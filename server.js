import express from 'express';
import cors from 'cors';
import YouTube from 'youtube-sr';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Blob } from 'node:buffer';

dotenv.config();

const YouTubeClient = YouTube.default;

// Validate required environment variables
if (!process.env.MVSEP_API_TOKEN) {
  console.error('MVSEP_API_TOKEN environment variable is not set');
  process.exit(1);
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const downloadsDir = path.join(__dirname, 'downloads');
const dbPath = path.join(__dirname, 'database.json');

// Create downloads directory and database if they don't exist
if (!fs.existsSync(downloadsDir)) {
  console.log('Creating downloads directory...');
  fs.mkdirSync(downloadsDir);
}

// Ensure database.json exists
if (!fs.existsSync(dbPath)) {
  console.log('Creating database.json...');
  fs.writeFileSync(dbPath, JSON.stringify({ videos: [] }, null, 2));
}

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

// GET /api/songs endpoint with search query
// Download song endpoint
app.get('/api/songs/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { searchTerm } = req.query;

    // Read database
    let db = { videos: [] };
    try {
      const dbContent = await fsPromises.readFile(dbPath, 'utf-8');
      db = JSON.parse(dbContent);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    // Check if video exists in database
    const existingVideo = db.videos.find(v => v.videoId === videoId);
    const videoDir = path.join(downloadsDir, videoId);
    const fileName = `${videoId}.mp3`;
    const filePath = path.join(videoDir, fileName);
    const thumbnailPath = path.join(videoDir, 'thumbnail.jpg');

    if (existingVideo && fs.existsSync(filePath)) {
      return res.json({
        downloadUrl: `/downloads/${videoId}/${fileName}`,
        thumbnail: `/downloads/${videoId}/thumbnail.jpg`,
        title: existingVideo.searchTerm
      });
    }

    // Create video-specific directory
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir);
    }

    // Get video info
    const info = await ytdl.getInfo(videoId);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
    
    // Download thumbnail
    console.log(`Downloading thumbnail for video ${videoId}...`);
    if (!fs.existsSync(thumbnailPath)) {
      await new Promise((resolve, reject) => {
        https.get(info.videoDetails.thumbnails[0].url, (response) => {
          const fileStream = fs.createWriteStream(thumbnailPath);
          response.pipe(fileStream);
          fileStream.on('finish', () => {
            console.log(`Thumbnail downloaded successfully for ${videoId}`);
            resolve();
          });
          fileStream.on('error', (error) => {
            console.error(`Error downloading thumbnail for ${videoId}:`, error);
            reject(error);
          });
        }).on('error', (error) => {
          console.error(`Network error downloading thumbnail for ${videoId}:`, error);
          reject(error);
        });
      });
    }
    
    // Download and convert to MP3
    console.log(`Starting audio download for video ${videoId}...`);
    const writeStream = fs.createWriteStream(filePath);
    ytdl(videoId, { format: audioFormat })
      .pipe(writeStream);
    
    writeStream.on('finish', async () => {
      console.log(`Audio download completed for ${videoId}. Starting MVSEP processing...`);
      // Update database
      if (!existingVideo) {
        db.videos.push({
          videoId,
          searchTerm: searchTerm || info.videoDetails.title,
          thumbnail: `/downloads/${videoId}/thumbnail.jpg`,
          downloadedAt: new Date().toISOString()
        });
        await fsPromises.writeFile(dbPath, JSON.stringify(db, null, 2));
      }

      // Send request to MVSEP API
      console.log(`Sending request to MVSEP API for ${videoId}...`);
      let mvsepData;
      try {
        const formData = new FormData();
        formData.append('api_token', process.env.MVSEP_API_TOKEN);
        
        // Read the local audio file
        const audioBuffer = await fsPromises.readFile(filePath);
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        formData.append('audiofile', audioBlob, fileName);
        const mvsepResponse = await fetch('https://mvsep.com/api/separation/create', {
          method: 'POST',
          body: formData
        });
        console.log(`MVSEP API response status: ${mvsepResponse.status}`);

        const responseText = await mvsepResponse.text();
        console.log(`MVSEP API raw response: ${responseText}`);
        try {
          mvsepData = JSON.parse(responseText);
          console.log(`MVSEP API parsed response:`, mvsepData);
        } catch (error) {
          console.error(`Failed to parse MVSEP response for ${videoId}:`, responseText);
          throw new Error('Invalid response from MVSEP API');
        }
      } catch (error) {
        console.error(`MVSEP API request failed for ${videoId}:`, error);
        throw error;
      }
      
      // Store the result_url in the database
      if (mvsepData.success && mvsepData.data && mvsepData.data.link) {
        const videoToUpdate = db.videos.find(v => v.videoId === videoId);
        if (videoToUpdate) {
          videoToUpdate.mvsepResultUrl = mvsepData.data.link;
          await fsPromises.writeFile(dbPath, JSON.stringify(db, null, 2));
          console.log(`Successfully stored mvsepResultUrl for ${videoId}`);
        } else {
          console.error(`Could not find video with ID ${videoId} to update with mvsepResultUrl`);
        }
      } else {
        console.error(`MVSEP separation request failed or did not return a link for ${videoId}. Response:`, mvsepData);
      }

      res.json({
        downloadUrl: `/downloads/${videoId}/${fileName}`,
        thumbnail: `/downloads/${videoId}/thumbnail.jpg`,
        title: searchTerm || info.videoDetails.title,
        mvsepStatus: 'processing',
        mvsepResultUrl: mvsepData.data ? mvsepData.data.link : null
      });
    });
    
    writeStream.on('error', (error) => {
      console.error('Error downloading audio:', error);
      res.status(500).json({ error: 'Failed to download audio' });
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to process download request' });
  }
});

app.get('/api/songs', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query) {
      return res.json([]);
    }

    const videos = await YouTubeClient.search(query + ' song', {
      limit: 10,
      type: 'video',
      safeSearch: true
    });

    if (!Array.isArray(videos)) {
      throw new Error('Search results are not in expected format');
    }

    // Read database to check for existing videos
    let db = { videos: [] };
    try {
      const dbContent = await fsPromises.readFile(dbPath, 'utf-8');
      db = JSON.parse(dbContent);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const songs = videos.map(video => {
      const existingVideo = db.videos.find(v => v.videoId === video.id);
      return {
        id: video.id,
        title: video.title,
        artist: video.channel.name,
        image: video.thumbnail.url,
        searchTerm: existingVideo?.searchTerm || query.trim()
      };
    });

    res.json(songs);
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Endpoint to check MVSEP processing status
app.get('/api/songs/mvsep-status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`Checking MVSEP status for video ${videoId}...`);

    // Read database
    const dbContent = await fsPromises.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    const video = db.videos.find(v => v.videoId === videoId);
    if (!video || !video.mvsepResultUrl) {
      console.log(`No MVSEP processing found for video ${videoId}`);
      return res.status(404).json({ error: 'No MVSEP processing found for this video' });
    }

    // Check status from MVSEP API
    console.log(`Fetching status from MVSEP API for ${videoId}...`);
    const statusResponse = await fetch(video.mvsepResultUrl);
    console.log(`MVSEP status response code: ${statusResponse.status}`);
    const statusData = await statusResponse.json();
    console.log(`MVSEP status data:`, statusData);

    if (statusData.status === 'done' && statusData.data && statusData.data.files) {
        console.log(`Processing completed for ${videoId}, downloading separated stems...`);
        const videoDir = path.join(downloadsDir, videoId);
        const stemNames = ['vocals', 'drums', 'bass', 'other', 'instrumental'];
        const stemPaths = {};
        
        // Download all stems first
        for (let i = 0; i < stemNames.length; i++) {
          const stemName = stemNames[i];
          const stemUrl = statusData.data.files[i].url;
          const stemFileName = `${stemName}-${videoId}.mp3`;
          const stemFilePath = path.join(videoDir, stemFileName);
          
          if (!fs.existsSync(stemFilePath)) {
            console.log(`Downloading ${stemName} for ${videoId}...`);
            const response = await fetch(stemUrl);
            const writeStream = fs.createWriteStream(stemFilePath);
            await new Promise((resolve, reject) => {
              response.body.pipe(writeStream);
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
            });
            console.log(`${stemName} downloaded successfully for ${videoId}`);
          }
          stemPaths[stemName] = stemFilePath;
        }
        
        // Clean up unnecessary files after all stems are downloaded
        console.log(`Cleaning up unnecessary files for ${videoId}...`);
        const filesToDelete = ['bass', 'drums', 'vocals', videoId].map(stem => 
          path.join(videoDir, `${stem === videoId ? videoId : stem}-${videoId}.mp3`)
        );
        
        for (const file of filesToDelete) {
          try {
            if (fs.existsSync(file)) {
              await fsPromises.unlink(file);
              console.log(`Deleted file: ${file}`);
            }
          } catch (error) {
            console.error(`Error deleting file ${file}:`, error);
          }
        }
      // Set vocals and instrumental
      const vocalsFileName = `vocals-${videoId}.mp3`;
      const instFileName = `instrumental-${videoId}.mp3`;
      video.separatedVocalsUrl = `/downloads/${videoId}/${vocalsFileName}`;
      video.separatedInstrumentalUrl = `/downloads/${videoId}/${instFileName}`;
      await fsPromises.writeFile(dbPath, JSON.stringify(db, null, 2));
      console.log(`Database updated with separated vocals and instrumental info for ${videoId}`);
      return res.json({
        status: 'completed',
        separatedVocalsUrl: video.separatedVocalsUrl,
        separatedInstrumentalUrl: video.separatedInstrumentalUrl
      });
    } else if (statusData.status === 'failed') {
      console.log(`Processing failed for ${videoId}: ${statusData.data?.message}`);
      return res.json({
        status: 'failed',
        message: statusData.data?.message
      });
    }

    console.log(`Processing still in progress for ${videoId}`);
    res.json({
      status: statusData.status,
      progress: statusData.progress
    });
  } catch (error) {
    console.error('MVSEP status check error:', error);
    res.status(500).json({ error: 'Failed to check MVSEP processing status' });
  }
});

// Only start the server if we're not being imported
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3001;
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  app.listen(PORT, HOST, () => {
    console.log(`API server running on ${HOST}:${PORT}`);
  });
}

export default app;
