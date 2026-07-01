'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      window.location.href = '/reset-password' + window.location.hash;
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Route to the correct portal based on role
    let destination = '/dashboard';
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.role === 'editor') destination = '/editor';
      else if (profile?.role === 'super_admin') destination = '/super-admin';
      else if (profile?.role === 'workspace_admin') destination = '/workspace-admin';
    }

    router.push(destination);
    router.refresh();
  };

  return (
    <div>
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#002c17] text-white mb-4 shadow-sm">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            video_camera_front
          </span>
        </div>
        <h1
          className="text-[32px] leading-10 font-semibold tracking-tight text-[#002c17]"
          style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
        >
          AI Vid Creator
        </h1>
        <p className="text-base text-[#414942] mt-2">Enterprise-grade AI video generation.</p>
      </div>

      {/* Glass Card */}
      <div className="glass-panel rounded-xl p-6">
        {/* Tabs */}
        <div className="flex border-b border-[#e0e3e1] mb-6">
          <button className="flex-1 pb-3 text-sm font-bold text-[#002c17] border-b-2 border-[#bff43f] transition-colors">
            Log In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">
              Email Address
            </label>
            <div className="input-field flex items-center bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2.5">
              <span className="material-symbols-outlined text-[#717972] mr-2 text-[20px]">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@company.com"
                className="w-full bg-transparent border-none p-0 text-base text-[#181c1b] placeholder-[#717972] focus:ring-0 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-[#181c1b]">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#002c17] hover:text-[#35684a] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="input-field flex items-center bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2.5">
              <span className="material-symbols-outlined text-[#717972] mr-2 text-[20px]">lock</span>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent border-none p-0 text-base text-[#181c1b] placeholder-[#717972] focus:ring-0 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-[#717972] hover:text-[#181c1b] transition-colors focus:outline-none ml-2"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full bg-[#002c17] text-white rounded-lg py-3 text-sm font-bold mt-2 shadow-sm flex items-center justify-center gap-2 hover:bg-[#35684a] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-[#717972]">
          By logging in, you agree to our{' '}
          <a href="#" className="text-[#002c17] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#002c17] hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
