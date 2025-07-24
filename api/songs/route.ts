import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Mock data for now - replace with actual database query later
    const songs = [
      { id: 1, title: "Summer Nights", artist: "Luna Bay", image: "photo-1618160702438-9b02ab6515c9" },
      { id: 2, title: "Electric Dreams", artist: "Neon Waves", image: "photo-1535268647677-057b9d5e3905" },
      { id: 3, title: "City Lights", artist: "Urban Echo", image: "photo-1582562124811-c09040d0a901" },
    ];

    return new Response(JSON.stringify(songs), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch songs' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}