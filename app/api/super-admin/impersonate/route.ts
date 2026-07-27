import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  // Use the configured public site URL rather than req.nextUrl.origin — behind a
  // reverse proxy that doesn't forward the real Host header, origin falls back to
  // the server's bind address (e.g. 0.0.0.0:3000), producing an unreachable link.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${origin}/dashboard` },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Route through our own callback (not Supabase's hosted action_link) so the
  // token is verified server-side and a real cookie session gets set — visiting
  // action_link directly redirects to the origin with tokens only in the URL
  // fragment, which the server-side session (proxy.ts, API routes) never sees.
  const link = `${origin}/api/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/dashboard`;

  return NextResponse.json({ link });
}
