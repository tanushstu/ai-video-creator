'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, LogOut, Film, Calendar, ShieldAlert } from 'lucide-react';
import InputWorkspace from '@/components/InputWorkspace';
import ProgressTracker from '@/components/ProgressTracker';
import ScriptDisplay from '@/components/ScriptDisplay';
import VideoOutput from '@/components/VideoOutput';
import { runScriptPhase, runMediaPhase, initialPipelineState } from '@/lib/pipeline';
import type { PipelineState, Project } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isImpersonating = searchParams.get('impersonating') === '1';
  const [userEmail, setUserEmail] = useState('');
  const [pipelineState, setPipelineState] = useState<PipelineState>(initialPipelineState());
  const [editedScript, setEditedScript] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const pendingMedia = useRef<{ voiceId: string; avatarId: string; prompt: string } | null>(null);

  // Fetch current user + past projects on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? '');
    });

    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => { if (d.projects) setProjects(d.projects); })
      .finally(() => setLoadingProjects(false));
  }, []);

  // Sync editable script whenever pipeline generates a new one
  useEffect(() => {
    if (pipelineState.script) setEditedScript(pipelineState.script);
  }, [pipelineState.script]);

  const { status } = pipelineState;

  const isRunning =
    status === 'generating-script' ||
    status === 'generating-audio' ||
    status === 'initializing-video' ||
    status === 'processing-video';

  const isScriptReady = status === 'script-ready';

  const handleGenerate = useCallback(
    async (prompt: string, voiceId: string, avatarId: string, durationSeconds: number) => {
      pendingMedia.current = { voiceId, avatarId, prompt };
      await runScriptPhase(prompt, durationSeconds, setPipelineState);
    },
    []
  );

  const handleContinue = useCallback(async () => {
    if (!pendingMedia.current || !editedScript.trim()) return;
    const { voiceId, avatarId, prompt } = pendingMedia.current;
    setPipelineState((prev) => ({ ...prev, script: editedScript }));
    await runMediaPhase(
      editedScript,
      voiceId,
      avatarId,
      prompt,
      setPipelineState,
      (videoUrl, projectId) => {
        setPipelineState((prev) => ({ ...prev, videoUrl, status: 'completed' }));
        // Refresh project list after completion
        if (projectId) {
          setProjects((prev) =>
            prev.some((p) => p.id === projectId)
              ? prev.map((p) => p.id === projectId ? { ...p, status: 'completed', video_url: videoUrl } : p)
              : [{ id: projectId, title: prompt.substring(0, 60), status: 'completed', video_url: videoUrl, created_at: new Date().toISOString() } as Project, ...prev]
          );
        }
      }
    );
  }, [editedScript]);

  const handleReset = () => {
    setPipelineState(initialPipelineState());
    setEditedScript('');
    pendingMedia.current = null;
    // Refresh projects list
    fetch('/api/projects').then((r) => r.json()).then((d) => { if (d.projects) setProjects(d.projects); });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleReturnToAdmin = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <ShieldAlert size={14} />
            You are viewing as <span className="font-semibold">{userEmail}</span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/50 rounded-lg px-3 py-1 transition-colors"
          >
            Return to Admin
          </button>
        </div>
      )}
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-none">AI Vid Creator</h1>
              <p className="text-xs text-slate-500 mt-0.5">NVIDIA NIM · ElevenLabs · HeyGen</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-slate-500 hidden sm:block">{userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Create Your Video</h2>
              <p className="text-sm text-slate-500">
                Enter a topic and duration — we&apos;ll write a script for you to review, then generate audio and render the AI avatar video.
              </p>
            </div>

            {(status === 'idle' || status === 'generating-script' || status === 'script-ready') && (
              <InputWorkspace
                onGenerate={handleGenerate}
                isRunning={status === 'generating-script'}
                disabled={isRunning}
              />
            )}

            {editedScript && (
              status === 'script-ready' ||
              status === 'generating-audio' ||
              status === 'initializing-video' ||
              status === 'processing-video' ||
              status === 'completed' ||
              status === 'error'
            ) && (
              <ScriptDisplay script={editedScript} onChange={setEditedScript} />
            )}

            {isScriptReady && (
              <button
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
              >
                <ArrowRight size={18} />
                Generate Audio &amp; Video
              </button>
            )}

            {pipelineState.videoUrl && (
              <VideoOutput videoUrl={pipelineState.videoUrl} audioUrl={pipelineState.audioUrl} />
            )}

            {(status === 'completed' || status === 'error') && (
              <button
                onClick={handleReset}
                className="w-full py-2.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
              >
                Start Over
              </button>
            )}
          </div>

          {/* Right column — progress tracker */}
          <div className="space-y-4">
            <ProgressTracker state={pipelineState} />

            {status === 'idle' && (
              <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3">How It Works</h4>
                <div className="space-y-3">
                  {[
                    { num: '1', title: 'Script', desc: 'NVIDIA NIM writes a script sized to your chosen duration' },
                    { num: '2', title: 'Review', desc: 'Read and edit the script before audio is generated' },
                    { num: '3', title: 'Voice', desc: 'ElevenLabs synthesizes natural-sounding audio' },
                    { num: '4', title: 'Video', desc: 'HeyGen renders an AI avatar speaking your script' },
                  ].map((step) => (
                    <div key={step.num} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {step.num}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Past Projects */}
        {!loadingProjects && projects.length > 0 && (
          <div className="mt-10 border-t border-white/5 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Film size={16} className="text-indigo-400" />
              <h3 className="text-base font-semibold text-white">My Videos</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#1a1f2e] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-white line-clamp-2">{project.title}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                    <Calendar size={11} />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  {project.video_url && (
                    <a
                      href={project.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Watch video →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    'completed': { label: 'Done', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    'script-ready': { label: 'Draft', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    'error': { label: 'Error', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  };
  const s = map[status] ?? { label: status, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${s.color}`}>
      {s.label}
    </span>
  );
}
