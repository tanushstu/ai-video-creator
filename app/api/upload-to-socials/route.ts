import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listAccounts,
  publishVideo,
  ZernioError,
  type ZernioPlatform,
} from '@/lib/zernio';

const SUPPORTED: ZernioPlatform[] = ['youtube', 'instagram'];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Zernio API key not configured', service: 'Zernio' },
      { status: 500 },
    );
  }

  // Same auth gate the rest of the API uses.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', service: 'Auth' }, { status: 401 });
  }

  try {
    const { videoUrl, platforms, title, description, caption } = (await req.json()) as {
      videoUrl?: string;
      platforms?: ZernioPlatform[];
      title?: string;
      description?: string;
      caption?: string;
    };

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
    }

    const selected = (platforms ?? []).filter((p): p is ZernioPlatform =>
      SUPPORTED.includes(p),
    );
    if (selected.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one platform (youtube, instagram)' },
        { status: 400 },
      );
    }

    // Resolve a connected Zernio account for each requested platform.
    const accounts = await listAccounts(apiKey);
    const resolved: Partial<Record<ZernioPlatform, string>> = {};
    const missing: ZernioPlatform[] = [];
    for (const p of selected) {
      const acc = accounts.find((a) => a.platform === p && a.isActive !== false);
      if (acc) resolved[p] = acc._id;
      else missing.push(p);
    }
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `No connected ${missing.join(' & ')} account found in Zernio. Connect it in Zernio first.`,
          service: 'Zernio',
        },
        { status: 400 },
      );
    }

    const result = await publishVideo(apiKey, {
      videoUrl,
      platforms: selected,
      accounts: resolved,
      title,
      description,
      caption,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    if (err instanceof ZernioError) {
      return NextResponse.json(
        { error: `Zernio API error: ${err.message}`, service: 'Zernio', details: err.details },
        { status: err.status },
      );
    }
    console.error('[upload-to-socials] error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Upload failed: ${message}`, service: 'Zernio' },
      { status: 500 },
    );
  }
}
