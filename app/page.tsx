'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const hash = window.location.hash;

    if (code || tokenHash) {
      // PKCE / token-hash flow — forward to server callback
      const qs = new URLSearchParams();
      if (code) qs.set('code', code);
      if (tokenHash) qs.set('token_hash', tokenHash);
      if (type) qs.set('type', type);
      qs.set('next', type === 'recovery' ? '/reset-password' : '/dashboard');
      router.replace(`/api/auth/callback?${qs.toString()}`);
      return;
    }

    if (hash.includes('access_token')) {
      // Implicit flow (admin-generated magic links / dashboard password reset)
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashType = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const supabase = createClient();
        // Explicitly set session — this overwrites the existing admin cookies
        // so the proxy will see the impersonated user on the next navigation
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => {
            if (hashType === 'recovery') {
              router.replace('/reset-password');
            } else {
              // magiclink (impersonation) or any other sign-in via hash
              router.replace('/dashboard?impersonating=1');
            }
          });
      }
      return;
    }

    // No auth params — just go to dashboard (proxy enforces auth)
    router.replace('/dashboard');
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
    </div>
  );
}
