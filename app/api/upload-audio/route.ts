import { NextRequest, NextResponse } from 'next/server';
import { requireApiKeys } from '@/lib/get-api-keys';

export async function POST(req: NextRequest) {
  const { keys, errorResponse } = await requireApiKeys();
  if (errorResponse) return errorResponse;

  try {
    const { audioBase64 } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing required field: audioBase64' }, { status: 400 });
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Send raw binary body with type as query param — avoids Node.js FormData serialization issues
    const response = await fetch('https://upload.heygen.com/v1/asset?type=audio', {
      method: 'POST',
      headers: {
        'X-Api-Key': keys.heygen_key,
        'Content-Type': 'audio/mpeg',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = JSON.stringify(errorJson);
      } catch { /* ignore */ }
      return NextResponse.json(
        { error: `HeyGen asset upload error (${response.status}): ${errorDetail}`, service: 'HeyGen' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assetId = data?.data?.id || data?.data?.asset_id;

    if (!assetId) {
      return NextResponse.json(
        { error: `HeyGen upload succeeded but returned no asset ID. Response: ${JSON.stringify(data)}`, service: 'HeyGen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assetId, url: data?.data?.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Audio upload to HeyGen failed: ${message}`, service: 'HeyGen' }, { status: 500 });
  }
}
