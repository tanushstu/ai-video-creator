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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // keys.nvidia_key now holds the workspace's Google Gemini API key (column name kept for compatibility)
        Authorization: `Bearer ${keys.nvidia_key}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert video script writer. Create engaging, conversational scripts optimized for AI avatar videos.

Rules:
- Write in a natural, spoken-word style (no stage directions, no parenthetical notes)
- Keep sentences short and punchy for good pacing
- Structure: Hook → Main Content → Call to Action
- CRITICAL TIMING CONSTRAINT: The video MUST be exactly ${duration} seconds long. At a speaking rate of 150 words per minute, your script MUST be exactly ${targetWords} words.
- To hit this length accurately, you MUST write exactly ${Math.max(1, Math.round(targetWords / 15))} sentences. 
- DO NOT finish early. If your script is too short, expand on details, provide examples, or lengthen the call to action.
- STRICT LIMIT: You must output between ${Math.floor(targetWords * 0.95)} and ${Math.ceil(targetWords * 1.05)} words. Count your words carefully before responding.
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
        { error: `Google Gemini API error: ${error.error?.message || error.message || error.detail || response.statusText}`, service: 'Google Gemini' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content?.trim();

    if (!script) {
      return NextResponse.json({ error: 'Google Gemini returned an empty script', service: 'Google Gemini' }, { status: 500 });
    }

    return NextResponse.json({ script });
  } catch (err: unknown) {
    console.error('[generate-script] fetch error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const cause = err instanceof Error && (err as NodeJS.ErrnoException).cause;
    console.error('[generate-script] cause:', cause);
    return NextResponse.json({ error: `Script generation failed: ${message}`, cause: String(cause), service: 'Google Gemini' }, { status: 500 });
  }
}
