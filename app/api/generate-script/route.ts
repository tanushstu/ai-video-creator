import { NextRequest, NextResponse } from 'next/server';
import { requireApiKeys } from '@/lib/get-api-keys';

const WORDS_PER_SECOND = 2.5; // ~150 wpm

export async function POST(req: NextRequest) {
  const { keys, errorResponse } = await requireApiKeys();
  if (errorResponse) return errorResponse;

  try {
    const { prompt, durationSeconds } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing required field: prompt' }, { status: 400 });
    }

    const duration = typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : 60;
    const targetWords = Math.round(duration * WORDS_PER_SECOND);

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys.nvidia_key}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are an expert video script writer. Create engaging, conversational scripts optimized for AI avatar videos.

Rules:
- Write in a natural, spoken-word style (no stage directions, no parenthetical notes)
- Keep sentences short and punchy for good pacing
- Structure: Hook → Main Content → Call to Action
- Target length: exactly ${targetWords} words (${duration} seconds of speech at ~150 words per minute)
- Output ONLY the script text, no labels, no headings, no formatting
- No markdown, no asterisks, no special characters`,
          },
          {
            role: 'user',
            content: `Write a video script about: ${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: Math.round(targetWords * 1.5),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `NVIDIA NIM API error: ${error.message || error.detail || response.statusText}`, service: 'NVIDIA NIM' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content?.trim();

    if (!script) {
      return NextResponse.json({ error: 'NVIDIA NIM returned an empty script', service: 'NVIDIA NIM' }, { status: 500 });
    }

    return NextResponse.json({ script });
  } catch (err: unknown) {
    console.error('[generate-script] fetch error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const cause = err instanceof Error && (err as NodeJS.ErrnoException).cause;
    console.error('[generate-script] cause:', cause);
    return NextResponse.json({ error: `Script generation failed: ${message}`, cause: String(cause), service: 'NVIDIA NIM' }, { status: 500 });
  }
}
