import { NextRequest, NextResponse } from 'next/server';
import { requireApiKeys } from '@/lib/get-api-keys';

export async function POST(req: NextRequest) {
  const { keys, errorResponse } = await requireApiKeys();
  if (errorResponse) return errorResponse;

  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Missing required field: videoId' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        method: 'GET',
        headers: { 'X-Api-Key': keys.heygen_key },
      }
    );

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch { /* ignore */ }
      return NextResponse.json(
        { error: `HeyGen status check error: ${errorMessage}`, service: 'HeyGen' },
        { status: response.status }
      );
    }

    const data = await response.json();
    // HeyGen returns { code: 100, data: { status: "processing"|"completed"|"failed", video_url: "..." } }
    const status = data?.data?.status;
    const videoUrl = data?.data?.video_url;
    const errorDetail = data?.data?.error;

    return NextResponse.json({ status, videoUrl, error: errorDetail });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Video status poll failed: ${message}`, service: 'HeyGen' }, { status: 500 });
  }
}
