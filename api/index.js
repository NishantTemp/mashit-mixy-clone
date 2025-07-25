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
  // In a serverless environment, we can't exit the process.
  // We'll let the function fail and Vercel will log the error.
}
const __filename = fileURLToPath(import.meta.url);
// In Vercel serverless functions, __dirname is not available in the same way.
// We need to resolve paths relative to the function's location.
const __dirname = path.dirname(__filename);

const app = express();
const downloadsDir = path.join('/tmp', 'downloads');
const dbPath = path.join('/tmp', 'database.json');

// Create downloads directory and database if they don't exist
async function initializeFileSystem() {
  try {
    await fsPromises.mkdir(downloadsDir, { recursive: true });
    console.log('Downloads directory is ready.');
  } catch (error) {
    console.error('Error creating downloads directory:', error);
  }

  try {
    await fsPromises.access(dbPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Creating database.json...');
      await fsPromises.writeFile(dbPath, JSON.stringify({ videos: [] }, null, 2));
    } else {
      console.error('Error checking database.json:', error);
    }
  }
}

// We need to initialize the filesystem before handling requests.
// A simple way is to call it at the top level, but it's better to do it lazily.
// For simplicity here, we'll call it before starting the server logic.

app.use(cors());
app.use(express.json());

// This is important for Vercel to serve static files from the `public` directory.
// The `dist` directory will be the output of the Vite build.
app.use(express.static(path.join(__dirname, '..', 'dist')));

// GET /api/songs endpoint with search query
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

    const songs = videos.map(video => ({
      id: video.id,
      title: video.title,
      artist: video.channel?.name || 'Unknown Artist',
      image: video.thumbnail?.url || '',
      searchTerm: query.trim()
    }));

    res.json(songs);
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Download song endpoint
app.get('/api/songs/download/:videoId', async (req, res) => {
  await initializeFileSystem();
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
        downloadUrl: `/api/downloads/${videoId}/${fileName}`,
        thumbnail: `/api/downloads/${videoId}/thumbnail.jpg`,
        title: existingVideo.searchTerm
      });
    }

    // Create video-specific directory
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    // Get video info
    const info = await ytdl.getInfo(videoId);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
    
    // Download thumbnail
    if (!fs.existsSync(thumbnailPath)) {
      await new Promise((resolve, reject) => {
        https.get(info.videoDetails.thumbnails[0].url, (response) => {
          const fileStream = fs.createWriteStream(thumbnailPath);
          response.pipe(fileStream);
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        }).on('error', reject);
      });
    }
    
    // Download and convert to MP3
    await new Promise((resolve, reject) => {
      console.log(`Starting audio download for video ${videoId}...`);
      const writeStream = fs.createWriteStream(filePath);
      ytdl(videoId, { format: audioFormat })
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    console.log(`Audio download completed for ${videoId}.`);

    // Update database
    if (!existingVideo) {
      db.videos.push({
        videoId,
        searchTerm: searchTerm || info.videoDetails.title,
        thumbnail: `/api/downloads/${videoId}/thumbnail.jpg`,
        downloadedAt: new Date().toISOString()
      });
      await fsPromises.writeFile(dbPath, JSON.stringify(db, null, 2));
      console.log(`Database updated for new video ${videoId}.`);
    }

    // Send request to MVSEP API
    let mvsepData;
    try {
      console.log(`Sending request to MVSEP API for ${videoId}...`);
      const formData = new FormData();
      formData.append('api_token', process.env.MVSEP_API_TOKEN);
      
      const audioBuffer = await fsPromises.readFile(filePath);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      formData.append('audiofile', audioBlob, fileName);
      const mvsepResponse = await fetch('https://mvsep.com/api/separation/create', {
        method: 'POST',
        body: formData
      });

      const responseText = await mvsepResponse.text();
      console.log(`MVSEP API response for ${videoId}:`, responseText);
      mvsepData = JSON.parse(responseText);
    } catch (error) {
      console.error(`MVSEP API request failed for ${videoId}:`, error);
      // Don't fail the whole request, just log the error
    }
    
    // Store the result_url in the database
    if (mvsepData && mvsepData.success && mvsepData.data && mvsepData.data.link) {
      const videoToUpdate = db.videos.find(v => v.videoId === videoId);
      if (videoToUpdate) {
        videoToUpdate.mvsepResultUrl = mvsepData.data.link;
        await fsPromises.writeFile(dbPath, JSON.stringify(db, null, 2));
        console.log(`Database updated with mvsepResultUrl for ${videoId}.`);
      }
    }

    res.json({
      downloadUrl: `/api/downloads/${videoId}/${fileName}`,
      thumbnail: `/api/downloads/${videoId}/thumbnail.jpg`,
      title: searchTerm || info.videoDetails.title,
      mvsepStatus: 'processing',
      mvsepResultUrl: mvsepData && mvsepData.data ? mvsepData.data.link : null
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to process download request' });
  }
});

app.get('/api/downloads/:videoId/:fileName', async (req, res) => {
  await initializeFileSystem();
  const { videoId, fileName } = req.params;
  const filePath = path.join(downloadsDir, videoId, fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// This is the main export for Vercel
export default app;