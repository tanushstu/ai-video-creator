import { NextRequest, NextResponse } from 'next/server';
import { requireApiKeys } from '@/lib/get-api-keys';

export async function POST(req: NextRequest) {
  const { keys, errorResponse } = await requireApiKeys();
  if (errorResponse) return errorResponse;

  try {
    const { script, voiceId } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Missing required field: script' }, { status: 400 });
    }

    const resolvedVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel — ElevenLabs default

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': keys.elevenlabs_key,
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.detail?.message || errorJson.detail || errorMessage;
      } catch { /* ignore */ }
      return NextResponse.json(
        { error: `ElevenLabs API error: ${errorMessage}`, service: 'ElevenLabs' },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ audioBase64, mimeType: 'audio/mpeg' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Audio generation failed: ${message}`, service: 'ElevenLabs' }, { status: 500 });
  }
}
