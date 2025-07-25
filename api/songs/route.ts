import { type NextRequest } from 'next/server';
import YouTube from 'youtube-sr';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    
    if (!query) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const YouTubeClient = YouTube;
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

    return new Response(JSON.stringify(songs), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search songs' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}