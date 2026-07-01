'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
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
        <p className="text-base text-[#414942] mt-2">Set a new password</p>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <h2
          className="text-2xl font-semibold text-[#002c17] mb-6"
          style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
        >
          Set new password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">
              New password{' '}
              <span className="text-[#717972] font-normal">(min 6 chars)</span>
            </label>
            <div className="input-field flex items-center bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2.5">
              <span className="material-symbols-outlined text-[#717972] mr-2 text-[20px]">lock</span>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
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

          <div>
            <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">
              Confirm password
            </label>
            <div className="input-field flex items-center bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2.5">
              <span className="material-symbols-outlined text-[#717972] mr-2 text-[20px]">lock_reset</span>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-transparent border-none p-0 text-base text-[#181c1b] placeholder-[#717972] focus:ring-0 outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="btn-primary w-full bg-[#002c17] text-white rounded-lg py-3 text-sm font-bold mt-2 shadow-sm flex items-center justify-center gap-2 hover:bg-[#35684a] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating…
              </>
            ) : !ready ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying session…
              </>
            ) : (
              <>
                Update Password
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
