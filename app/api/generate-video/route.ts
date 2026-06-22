import { NextRequest, NextResponse } from 'next/server';
import { requireApiKeys } from '@/lib/get-api-keys';

export async function POST(req: NextRequest) {
  const { keys, errorResponse } = await requireApiKeys();
  if (errorResponse) return errorResponse;

  try {
    const { audioAssetId, avatarId } = await req.json();

    if (!audioAssetId || !avatarId) {
      return NextResponse.json({ error: 'Missing required fields: audioAssetId, avatarId' }, { status: 400 });
    }

    const payload = {
      video_inputs: [
        {
          character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
          voice: { type: 'audio', audio_asset_id: audioAssetId },
          background: { type: 'color', value: '#f0f4f8' },
        },
      ],
      dimension: { width: 1280, height: 720 },
      caption: false,
    };

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': keys.heygen_key,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = JSON.stringify(errorJson);
      } catch { /* ignore */ }
      return NextResponse.json(
        { error: `HeyGen video generation error (${response.status}): ${errorDetail}`, service: 'HeyGen' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const videoId = data?.data?.video_id;

    if (!videoId) {
      return NextResponse.json({ error: 'HeyGen did not return a video ID', service: 'HeyGen', raw: data }, { status: 500 });
    }

    return NextResponse.json({ videoId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Video generation failed: ${message}`, service: 'HeyGen' }, { status: 500 });
  }
}
