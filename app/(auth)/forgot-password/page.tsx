'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(searchParams.get('error') ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div>
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
        </div>
        <div className="glass-panel rounded-xl p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-[#b8efc9] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#002c17]" style={{ fontVariationSettings: "'FILL' 1" }}>
                mark_email_read
              </span>
            </div>
          </div>
          <h2
            className="text-2xl font-semibold text-[#002c17] mb-2"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            Check your email
          </h2>
          <p className="text-sm text-[#414942] mb-6">
            We sent a reset link to{' '}
            <span className="font-semibold text-[#181c1b]">{email}</span>.
            Click it to set a new password.
          </p>
          <Link
            href="/login"
            className="text-sm text-[#002c17] hover:text-[#35684a] transition-colors font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

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
        <p className="text-base text-[#414942] mt-2">Reset your password</p>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <h2
          className="text-2xl font-semibold text-[#002c17] mb-1"
          style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
        >
          Forgot password?
        </h2>
        <p className="text-sm text-[#414942] mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Email Address</label>
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
                Sending…
              </>
            ) : (
              <>
                Send Reset Link
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          <Link href="/login" className="text-[#002c17] hover:text-[#35684a] transition-colors font-medium">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
