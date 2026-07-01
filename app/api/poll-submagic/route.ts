import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.SUBMAGIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Submagic API key not configured' }, { status: 500 });
  }

  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const response = await fetch(`https://api.submagic.co/v1/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Submagic polling error: ${error.message || response.statusText}`, service: 'Submagic' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // According to Submagic docs, status can be 'completed', 'processing', 'failed', etc.
    // video url is in `data.downloadUrl` if completed
    const isCompleted = data.status === 'completed' || data.status === 'ready' || data.downloadUrl;
    const isFailed = data.status === 'failed' || data.status === 'error';

    return NextResponse.json({ 
      status: isFailed ? 'failed' : isCompleted ? 'completed' : 'processing',
      videoUrl: data.downloadUrl || data.resultUrl || data.url, // Try to capture download url
      data
    });
  } catch (err: unknown) {
    console.error('[poll-submagic] error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Submagic polling failed: ${message}`, service: 'Submagic' }, { status: 500 });
  }
}
