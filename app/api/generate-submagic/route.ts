import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.SUBMAGIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Submagic API key not configured' }, { status: 500 });
  }

  try {
    const { 
      videoUrl, 
      title = 'AI Generated Video',
      templateName = 'Hormozi 1',
      dictionaryWords = '',
    } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing required field: videoUrl' }, { status: 400 });
    }

    const dictionaryArray = dictionaryWords
      .split(',')
      .map((w: string) => w.trim())
      .filter((w: string) => w.length > 0);

    const body: Record<string, any> = {
      title,
      language: 'en',
      videoUrl,
      templateName,
    };

    if (dictionaryArray.length > 0) {
      body.dictionary = dictionaryArray;
    }

    const response = await fetch('https://api.submagic.co/v1/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Submagic API error: ${error.message || response.statusText}`, service: 'Submagic' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ projectId: data.id });
  } catch (err: unknown) {
    console.error('[generate-submagic] fetch error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Submagic generation failed: ${message}`, service: 'Submagic' }, { status: 500 });
  }
}
