import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'email' | null;
  const next = searchParams.get('next') ?? '/dashboard';

  // Supabase passes errors as query params when token is invalid/expired
  if (searchParams.get('error')) {
    const desc = searchParams.get('error_description') ?? 'Link expired or invalid';
    return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent(desc)}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // PKCE flow (from our app's resetPasswordForEmail / signUp redirectTo)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await upsertUser(data.user.id, data.user.email!);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Token-hash flow (from Supabase dashboard "Send password reset" or email templates)
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.user) {
      await upsertUser(data.user.id, data.user.email!);
      const dest = type === 'recovery' ? '/reset-password' : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent('Link expired or invalid. Request a new one.')}`);
}

async function upsertUser(id: string, email: string) {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await admin.from('users').upsert({ id, email }, { onConflict: 'id', ignoreDuplicates: true });
}
