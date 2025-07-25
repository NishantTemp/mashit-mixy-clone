import { type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = params;
    
    // Check if the instrumental and vocals files exist in the downloads directory
    const instrumentalPath = `/downloads/${videoId}/instrumental-${videoId}.mp3`;
    const vocalsPath = `/downloads/${videoId}/vocals-${videoId}.mp3`;
    const otherPath = `/downloads/${videoId}/other-${videoId}.mp3`;

    // If both files exist, separation is complete
    if (instrumentalPath && vocalsPath && otherPath) {
      return new Response(JSON.stringify({
        status: 'completed',
        instrumentalUrl: instrumentalPath,
        vocalsUrl: vocalsPath,
        otherUrl: otherPath
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // If files don't exist, return processing status
    return new Response(JSON.stringify({
      status: 'processing'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('MVSEP status check error:', error);
    return new Response(JSON.stringify({
      status: 'failed',
      message: 'Failed to check MVSEP status'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}