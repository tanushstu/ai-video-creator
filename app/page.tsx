'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHandlingAuth, setIsHandlingAuth] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const hash = window.location.hash;

    if (code || tokenHash) {
      setIsHandlingAuth(true);
      const qs = new URLSearchParams();
      if (code) qs.set('code', code);
      if (tokenHash) qs.set('token_hash', tokenHash);
      if (type) qs.set('type', type);
      qs.set('next', type === 'recovery' ? '/reset-password' : '/dashboard');
      router.replace(`/api/auth/callback?${qs.toString()}`);
      return;
    }

    if (hash.includes('access_token')) {
      setIsHandlingAuth(true);
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashType = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const supabase = createClient();
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => {
            if (hashType === 'recovery') {
              router.replace('/reset-password');
            } else {
              router.replace('/dashboard?impersonating=1');
            }
          });
      }
      return;
    }

    // Check if already logged in — send straight to dashboard
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard');
    });
  }, [searchParams, router]);

  if (isHandlingAuth) {
    return (
      <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#e0e3e1] border-t-[#002c17] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#f7faf8] text-[#181c1b] overflow-x-hidden">
      {/* Nav */}
      <nav className="bg-[#f7faf8]/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-[#c0c9c0] flex justify-between items-center w-full px-6 h-16">
        <div className="flex items-center gap-6">
          <span
            className="text-2xl font-extrabold text-[#002c17]"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            AI Vid Creator
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-[#414942] hover:text-[#002c17] transition-colors">
            Features
          </a>
          <a href="#pipeline" className="text-sm text-[#414942] hover:text-[#002c17] transition-colors">
            Pipeline
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#414942] hover:text-[#002c17] font-medium transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="bg-[#002c17] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#35684a] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative pt-24 pb-32 px-8 overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 80% 20%, #bff43f 0%, transparent 40%), radial-gradient(circle at 20% 80%, #002c17 0%, transparent 40%)',
            }}
          />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bff43f]/20 text-[#151f00] text-xs font-semibold border border-[#bff43f]/30">
                <span className="w-2 h-2 rounded-full bg-[#bff43f]" />
                Enterprise AI Video Platform
              </div>
              <h1
                className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-[#002c17] max-w-2xl"
                style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
              >
                Create AI Talking-Avatar Videos in{' '}
                <span className="text-[#35684a] relative">
                  Minutes.
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-[#bff43f]"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                  >
                    <path d="M0 10 Q 50 20 100 10" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-[#414942] max-w-xl leading-7">
                Turn text scripts into professional video content using NVIDIA Llama 3 for intelligent
                scripting, ElevenLabs for hyper-realistic voices, and HeyGen for lifelike avatars.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/signup"
                  className="bg-[#002c17] text-white px-8 py-4 rounded-xl text-sm font-medium hover:bg-[#35684a] transition-all active:scale-95 shadow-sm flex items-center gap-2"
                >
                  Start Creating Free
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  href="/login"
                  className="bg-transparent border border-[#717972] text-[#181c1b] px-8 py-4 rounded-xl text-sm font-medium hover:bg-[#f1f4f2] transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                </Link>
              </div>
              <div className="pt-8 flex items-center gap-4 text-xs text-[#414942]">
                <span>Powered by:</span>
                <span className="font-bold text-[#181c1b]">NVIDIA</span>
                <span className="w-1 h-1 rounded-full bg-[#c0c9c0]" />
                <span className="font-bold text-[#181c1b]">ElevenLabs</span>
                <span className="w-1 h-1 rounded-full bg-[#c0c9c0]" />
                <span className="font-bold text-[#181c1b]">HeyGen</span>
              </div>
            </div>

            {/* Right — visual */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-12 grid-rows-6 gap-4 h-[500px]">
                {/* Main card */}
                <div className="col-span-8 row-span-4 rounded-[1.5rem] overflow-hidden bg-white shadow-sm border border-[#c0c9c0] relative group flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#002c17] flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-5xl text-white"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        smart_toy
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#414942]">AI Script Generation</p>
                    <div className="w-32 h-1.5 bg-[#e0e3e1] rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-[#bff43f] rounded-full" />
                    </div>
                    <p className="text-xs text-[#717972]">Generating script...</p>
                  </div>
                </div>
                {/* Top-right card */}
                <div className="col-span-4 row-span-3 rounded-[1.5rem] bg-white shadow-sm border border-[#c0c9c0] relative flex items-center justify-center">
                  <div className="text-center p-4">
                    <span
                      className="material-symbols-outlined text-5xl text-[#35684a]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      record_voice_over
                    </span>
                    <p className="text-xs text-[#414942] mt-2">ElevenLabs Voice</p>
                  </div>
                </div>
                {/* Bottom-right card */}
                <div className="col-span-4 row-span-3 rounded-[1.5rem] bg-white shadow-sm border border-[#c0c9c0] flex items-center justify-center">
                  <div className="text-center p-4">
                    <span
                      className="material-symbols-outlined text-5xl text-[#bff43f]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      video_camera_front
                    </span>
                    <p className="text-xs text-[#414942] mt-2">HeyGen Avatar</p>
                  </div>
                </div>
                {/* Bottom wide card */}
                <div className="col-span-8 row-span-2 rounded-[1.5rem] bg-white shadow-sm border border-[#c0c9c0] p-5 flex items-center gap-4">
                  <div className="flex items-end gap-[3px] h-10 flex-1">
                    {[20, 45, 70, 55, 80, 35, 60, 90, 40, 65, 50, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i % 2 === 0 ? '#35684a' : '#bff43f',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#002c17] bg-[#b8efc9] px-3 py-1.5 rounded-full border border-[#9cd3ae]">
                    <span className="material-symbols-outlined text-[16px] text-[#bff43f]">graphic_eq</span>
                    Voice Sync
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Section */}
        <section id="pipeline" className="py-24 px-8 bg-[#f1f4f2] border-y border-[#c0c9c0]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2
                className="text-[32px] leading-10 font-semibold text-[#002c17] mb-4"
                style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
              >
                The 2-Phase Production Pipeline
              </h2>
              <p className="text-lg text-[#414942] leading-7">
                Experience precision-engineered creativity. From raw ideas to final render in minutes,
                with zero technical overhead.
              </p>
            </div>
            <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Phase 1 */}
              <div className="bg-white rounded-[1.5rem] p-8 border border-[#c0c9c0] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#ebefed] rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl text-[#35684a]">edit_document</span>
                </div>
                <h3
                  className="text-2xl font-semibold text-[#002c17] mb-2"
                  style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
                >
                  Phase 1: AI Scripting
                </h3>
                <p className="text-base text-[#414942] mb-6 leading-6">
                  Powered by NVIDIA Llama 3, intelligent algorithms structure your raw input into
                  compelling, professional narratives optimized for video engagement.
                </p>
                <div className="bg-[#f7faf8] rounded-xl p-4 border border-[#c0c9c0]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#bff43f]" />
                    <span className="text-xs font-semibold text-[#181c1b]">Your Input</span>
                  </div>
                  <p className="text-sm italic text-[#414942] mb-4">
                    &ldquo;Create a welcome video for new employees explaining the company benefits.&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mb-3 pt-3 border-t border-[#c0c9c0]">
                    <div className="w-2 h-2 rounded-full bg-[#35684a]" />
                    <span className="text-xs font-semibold text-[#181c1b]">Llama 3 Output</span>
                  </div>
                  <div className="text-sm text-[#414942] bg-[#f1f4f2] p-3 rounded-lg border-l-2 border-[#35684a]">
                    &ldquo;Welcome to the team! Today, we&apos;re going to walk through our comprehensive
                    benefits package, designed to support you both inside and outside the office...&rdquo;
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="bg-white rounded-[1.5rem] p-8 border border-[#c0c9c0] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#ebefed] rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl text-[#35684a]">videocam</span>
                </div>
                <h3
                  className="text-2xl font-semibold text-[#002c17] mb-2"
                  style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
                >
                  Phase 2: Avatar Production
                </h3>
                <p className="text-base text-[#414942] mb-6 leading-6">
                  HeyGen avatars sync flawlessly with ElevenLabs&apos; hyper-realistic voices to deliver
                  your script with natural expressions and cadence.
                </p>
                <div className="bg-[#f7faf8] rounded-xl p-4 border border-[#c0c9c0] space-y-3">
                  <div className="flex justify-between text-xs text-[#414942]">
                    <span>Voice Gen (ElevenLabs)</span>
                    <span className="text-[#35684a] font-bold">100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e6e9e7] rounded-full overflow-hidden">
                    <div className="w-full h-full bg-[#35684a] rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-[#414942]">
                    <span>Lip Sync (HeyGen)</span>
                    <span className="text-[#bff43f] font-bold">75%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e6e9e7] rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-[#bff43f] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#c0c9c0] w-full py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div
            className="text-xl font-bold text-[#002c17]"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            AI Vid Creator
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {['Terms', 'Privacy', 'Careers', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-[#414942] hover:text-[#002c17] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="text-sm text-[#414942]">© 2024 AI Vid Creator. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
