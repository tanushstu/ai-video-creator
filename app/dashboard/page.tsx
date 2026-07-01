'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InputWorkspace from '@/components/InputWorkspace';
import ProgressTracker from '@/components/ProgressTracker';
import ScriptDisplay from '@/components/ScriptDisplay';
import VideoOutput from '@/components/VideoOutput';
import { runScriptPhase, runMediaPhase, runSubmagicPhase, initialPipelineState } from '@/lib/pipeline';
import type { PipelineState, Project, EditorUser, EditorAssignment } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isImpersonating = searchParams.get('impersonating') === '1';
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pipelineState, setPipelineState] = useState<PipelineState>(initialPipelineState());
  const [editedScript, setEditedScript] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Editor send flow
  const [editors, setEditors] = useState<EditorUser[]>([]);
  const [selectedEditorIds, setSelectedEditorIds] = useState<string[]>([]);
  const [sendingToEditor, setSendingToEditor] = useState(false);
  const [sentToEditor, setSentToEditor] = useState(false);

  // Review assignments (for submitted editor videos)
  const [reviewAssignments, setReviewAssignments] = useState<EditorAssignment[]>([]);
  const [loadingReview, setLoadingReview] = useState(true);



  const [submagicOptions, setSubmagicOptions] = useState({
    templateName: 'Hormozi 1',
    dictionaryWords: '',
  });

  const pendingMedia = useRef<{ voiceId: string; avatarId: string; prompt: string } | null>(null);

  const loadProjects = useCallback(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => { if (d.projects) setProjects(d.projects); })
      .finally(() => setLoadingProjects(false));
  }, []);

  const loadReviewAssignments = useCallback(() => {
    // Fetch editor assignments where status = 'submitted' (user needs to review)
    // We get them via projects that have editor_status = 'submitted'
    fetch('/api/projects/review-pending')
      .then((r) => r.json())
      .then((d) => { if (d.assignments) setReviewAssignments(d.assignments); })
      .finally(() => setLoadingReview(false));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? '');
        const { data: profile } = await supabase
          .from('users')
          .select('username, role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'editor') {
          router.push('/editor');
          return;
        }
        if (profile?.role === 'super_admin') {
          router.push('/super-admin');
          return;
        }
        if (profile?.role === 'workspace_admin') {
          router.push('/workspace-admin');
          return;
        }
        setUsername(profile?.username ?? user.email?.split('@')[0] ?? '');
      }
    });
    loadProjects();
    loadReviewAssignments();
    // Load editors for the send-to-editor dropdown
    fetch('/api/editors')
      .then((r) => r.json())
      .then((d) => { if (d.editors) setEditors(d.editors); });
  }, [router, loadProjects, loadReviewAssignments]);

  useEffect(() => {
    if (pipelineState.script) setEditedScript(pipelineState.script);
  }, [pipelineState.script]);



  const { status } = pipelineState;

  const isRunning =
    status === 'generating-script' ||
    status === 'generating-audio' ||
    status === 'initializing-video' ||
    status === 'processing-video' ||
    status === 'processing-submagic';

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
    await runMediaPhase(editedScript, voiceId, avatarId, prompt, setPipelineState, () => {});
  }, [editedScript]);

  const handleSubmagic = useCallback(async () => {
    if (!pipelineState.heygenVideoUrl || !pendingMedia.current) return;
    await runSubmagicPhase(
      pipelineState.heygenVideoUrl,
      pendingMedia.current.prompt,
      pipelineState.projectId || null,
      submagicOptions,
      setPipelineState,
      () => {}
    );
  }, [pipelineState.heygenVideoUrl, pipelineState.projectId, submagicOptions]);

  const handleSendToEditor = async () => {
    if (!selectedEditorIds.length || !pipelineState.heygenVideoUrl || !pipelineState.projectId) return;
    setSendingToEditor(true);
    const res = await fetch(`/api/projects/${pipelineState.projectId}/send-to-editor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editorIds: selectedEditorIds,
        rawVideoUrl: pipelineState.heygenVideoUrl,
      }),
    });
    setSendingToEditor(false);
    if (res.ok) {
      setSentToEditor(true);
      loadProjects();
    }
  };

  const handleReset = () => {
    setPipelineState(initialPipelineState());
    setEditedScript('');
    pendingMedia.current = null;
    setSelectedEditorIds([]);
    setSentToEditor(false);
    loadProjects();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = username || userEmail.split('@')[0] || 'User';
  const userInitials = displayName.substring(0, 2).toUpperCase();

  // Toggle editor selection
  const toggleEditor = (id: string) => {
    setSelectedEditorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7faf8]">

      {/* Sidebar */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#f7faf8] border-r border-[#c0c9c0] flex flex-col py-6 z-40 hidden md:flex">
        <div className="px-6 mb-8 flex flex-col gap-3">
          <h1
            className="text-2xl font-extrabold text-[#002c17] tracking-tight"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            AI Vid Creator
          </h1>
          <p className="text-xs text-[#717972] uppercase tracking-wider">Enterprise AI</p>
          <button
            onClick={handleReset}
            className="mt-2 w-full bg-[#bff43f] text-[#151f00] font-medium text-sm py-2.5 rounded-full hover:bg-[#a4d71e] transition-colors inset-shadow-active flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            New Video
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2">
          <ul className="flex flex-col gap-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#002c17] border-l-4 border-[#bff43f] font-bold bg-[#e6e9e7] rounded-r-lg">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                <span className="text-sm">Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#my-videos" className="flex items-center gap-3 px-4 py-3 text-[#414942] hover:bg-[#f1f4f2] hover:text-[#002c17] transition-colors rounded-lg ml-1">
                <span className="material-symbols-outlined text-[20px]">video_library</span>
                <span className="text-sm">My Videos</span>
              </a>
            </li>
            {reviewAssignments.length > 0 && (
              <li>
                <a href="#in-review" className="flex items-center gap-3 px-4 py-3 text-[#414942] hover:bg-[#f1f4f2] hover:text-[#002c17] transition-colors rounded-lg ml-1">
                  <span className="material-symbols-outlined text-[20px]">rate_review</span>
                  <span className="text-sm">In Review</span>
                  <span className="ml-auto text-xs font-bold text-white bg-[#ba1a1a] rounded-full w-5 h-5 flex items-center justify-center">{reviewAssignments.length}</span>
                </a>
              </li>
            )}
          </ul>

          {/* Recent history */}
          {!loadingProjects && projects.length > 0 && (
            <div className="mt-8 px-4">
              <h3 className="text-xs text-[#717972] uppercase tracking-wider mb-3 pl-2 font-semibold">Recent History</h3>
              <ul className="flex flex-col gap-2">
                {projects.slice(0, 5).map((project) => (
                  <li key={project.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f1f4f2] transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-[#ebefed] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#717972] text-[18px]">video_file</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm text-[#181c1b] truncate">{project.title}</p>
                      <p className="text-xs text-[#717972] truncate">
                        {project.status === 'completed' ? 'Completed' : 'Draft'} · {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="mt-auto px-6 pt-4 border-t border-[#c0c9c0] mx-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#002c17] text-white flex items-center justify-center font-bold text-xs">
            {userInitials}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-semibold text-[#181c1b] truncate">@{displayName}</p>
          </div>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors" title="Sign out">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-[280px] h-screen overflow-y-auto bg-white custom-scrollbar">

        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="bg-[#bff43f]/20 border-b border-[#bff43f]/50 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#384e00] text-sm">
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              Viewing as <span className="font-semibold">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-[#384e00] hover:text-[#002c17] border border-[#bff43f]/50 hover:border-[#002c17]/30 rounded-lg px-3 py-1 transition-colors"
            >
              Return to Admin
            </button>
          </div>
        )}

        {/* Mobile top bar */}
        <div className="md:hidden flex justify-between items-center px-6 py-4 border-b border-[#c0c9c0]">
          <h1 className="text-xl font-extrabold text-[#002c17]" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
            AI Vid Creator
          </h1>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto p-8 flex flex-col gap-10">
          {/* Header + stepper */}
          <header className="flex flex-col gap-4">
            <div>
              <h2
                className="text-[32px] leading-10 font-semibold text-[#002c17] mb-1"
                style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
              >
                Create New Video
              </h2>
              <p className="text-base text-[#414942]">
                Describe your topic — AI writes the script, then generates audio and renders the avatar video.
              </p>
            </div>

            {/* Phase stepper */}
            <div className="flex items-center gap-4 mt-2 bg-[#f7faf8] rounded-[1.5rem] p-4 border border-[#c0c9c0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#002c17] text-white flex items-center justify-center font-bold text-sm shadow-inner">1</div>
                <span className="text-sm font-bold text-[#002c17]">Scripting</span>
              </div>
              <div className="h-1 flex-1 bg-[#e0e3e1] rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-[#bff43f] rounded-full transition-all"
                  style={{ width: status === 'idle' || status === 'generating-script' ? '0%' : '100%' }}
                />
              </div>
              <div className={`flex items-center gap-2 ${status === 'idle' || status === 'generating-script' || status === 'script-ready' ? 'opacity-40' : 'opacity-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${status !== 'idle' && status !== 'generating-script' && status !== 'script-ready' ? 'bg-[#002c17] text-white' : 'bg-[#e0e3e1] text-[#717972]'}`}>2</div>
                <span className="text-sm text-[#414942]">Production</span>
              </div>
            </div>
          </header>

          {/* Pipeline grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#b8efc9]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -left-20 w-96 h-96 bg-[#aff1c5]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Phase 1 */}
            <section className="lg:col-span-7 flex flex-col gap-4 z-10">
              {(status === 'idle' || status === 'generating-script' || status === 'script-ready') && (
                <InputWorkspace onGenerate={handleGenerate} isRunning={status === 'generating-script'} disabled={isRunning} />
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
                  className="w-full bg-[#bff43f] text-[#151f00] font-semibold py-4 rounded-xl hover:bg-[#a4d71e] transition-colors inset-shadow-active flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(191,244,63,0.3)] text-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">play_circle</span>
                  Generate Audio &amp; Video
                </button>
              )}

              {pipelineState.heygenVideoUrl && (status === 'heygen-completed' || status === 'processing-submagic' || status === 'completed') && (
                <div className="flex flex-col gap-4">
                  <div className="bg-[#f1f4f2] p-4 rounded-[1.5rem] border border-[#c0c9c0] flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[#002c17] font-semibold">
                      <span className="material-symbols-outlined">check_circle</span>
                      Raw Video Generated
                    </div>
                    <VideoOutput videoUrl={pipelineState.heygenVideoUrl} audioUrl={pipelineState.audioUrl} />
                  </div>

                  {status === 'heygen-completed' && (
                    <div className="flex flex-col gap-4">
                      {/* Submagic panel */}
                      <div className="bg-white rounded-[1.5rem] p-6 border border-[#c0c9c0] shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#35684a]">auto_fix_high</span>
                            <h3 className="text-base font-semibold text-[#181c1b]">Option A: Enhance with Submagic</h3>
                          </div>
                          <p className="text-sm text-[#414942]">Add dynamic captions, zooms, b-rolls, and audio cleanup automatically.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-[#414942]">Template</label>
                            <select
                              className="p-2 border border-[#c0c9c0] rounded-lg text-sm outline-none focus:border-[#35684a]"
                              value={submagicOptions.templateName}
                              onChange={(e) => setSubmagicOptions(p => ({ ...p, templateName: e.target.value }))}
                            >
                              <option value="Hormozi 1">Hormozi 1</option>
                              <option value="Hormozi 2">Hormozi 2</option>
                              <option value="Ali Abdaal">Ali Abdaal</option>
                              <option value="Iman Gadzhi">Iman Gadzhi</option>
                              <option value="MrBeast">MrBeast</option>
                              <option value="Devon Towse">Devon Towse</option>
                              <option value="David">David</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-[#414942]">Custom Dictionary Words</label>
                            <input
                              type="text"
                              placeholder="e.g. Submagic, HeyGen"
                              className="p-2 border border-[#c0c9c0] rounded-lg text-sm outline-none focus:border-[#35684a]"
                              value={submagicOptions.dictionaryWords}
                              onChange={(e) => setSubmagicOptions(p => ({ ...p, dictionaryWords: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <button
                            onClick={handleSubmagic}
                            className="flex-1 bg-[#35684a] text-white font-semibold py-3 rounded-xl hover:bg-[#2a533b] transition-colors text-sm"
                          >
                            Apply Submagic Edits
                          </button>
                          <button
                            onClick={() => setPipelineState(p => ({ ...p, status: 'completed' }))}
                            className="px-6 py-3 border border-[#c0c9c0] text-[#414942] hover:bg-[#f1f4f2] font-semibold rounded-xl transition-colors text-sm"
                          >
                            Skip
                          </button>
                        </div>
                      </div>

                      {/* Send to Editor panel */}
                      <div className="bg-white rounded-[1.5rem] p-6 border border-[#c0c9c0] shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#002c17]">edit_note</span>
                            <h3 className="text-base font-semibold text-[#181c1b]">Option B: Send to Editor</h3>
                          </div>
                          <p className="text-sm text-[#414942]">Send the raw video to one or more editors for a human touch.</p>
                        </div>

                        {editors.length === 0 ? (
                          <p className="text-sm text-[#717972] bg-[#f7faf8] rounded-xl p-3 border border-[#c0c9c0]">
                            No editors are available yet. Ask your admin to assign editor roles to users.
                          </p>
                        ) : (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-semibold text-[#414942]">Select Editor(s):</label>
                              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-[#c0c9c0] rounded-xl p-2">
                                {editors.map((ed) => (
                                  <label
                                    key={ed.id}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedEditorIds.includes(ed.id) ? 'bg-[#b8efc9] border border-[#9cd3ae]' : 'hover:bg-[#f1f4f2]'}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedEditorIds.includes(ed.id)}
                                      onChange={() => toggleEditor(ed.id)}
                                      className="accent-[#002c17] w-4 h-4"
                                    />
                                    <div className="w-7 h-7 rounded-full bg-[#002c17] text-white text-xs flex items-center justify-center font-bold shrink-0">
                                      {ed.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-[#181c1b]">@{ed.username}</p>
                                      <p className="text-xs text-[#717972]">{ed.email}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {sentToEditor ? (
                              <div className="flex items-center gap-2 text-sm text-[#35684a] bg-[#b8efc9] border border-[#9cd3ae] rounded-xl px-3 py-2.5">
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Sent to {selectedEditorIds.length} editor{selectedEditorIds.length > 1 ? 's' : ''}! You'll be notified when they submit.
                              </div>
                            ) : (
                              <button
                                onClick={handleSendToEditor}
                                disabled={sendingToEditor || selectedEditorIds.length === 0 || !pipelineState.projectId}
                                className="bg-[#002c17] hover:bg-[#35684a] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                              >
                                {sendingToEditor ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending…
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                    Send to {selectedEditorIds.length > 0 ? `${selectedEditorIds.length} Editor${selectedEditorIds.length > 1 ? 's' : ''}` : 'Editor'}
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {status === 'completed' && pipelineState.videoUrl !== pipelineState.heygenVideoUrl && pipelineState.videoUrl && (
                <div className="bg-[#b8efc9]/20 p-4 rounded-[1.5rem] border border-[#9cd3ae] flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-[#35684a] font-semibold">
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Final Submagic Video
                  </div>
                  <VideoOutput videoUrl={pipelineState.videoUrl} audioUrl={pipelineState.audioUrl} />
                </div>
              )}

              {(status === 'heygen-completed' || status === 'completed' || status === 'error') && (
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-sm text-[#414942] hover:text-[#002c17] border border-[#c0c9c0] hover:border-[#002c17]/30 rounded-xl transition-colors"
                >
                  Start Over
                </button>
              )}
            </section>

            {/* Phase 2 */}
            <section className="lg:col-span-5 z-10 flex flex-col gap-4">
              <ProgressTracker state={pipelineState} />

              {status === 'idle' && (
                <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#717972]">movie_creation</span>
                    <h3
                      className="text-base font-semibold text-[#414942]"
                      style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
                    >
                      Phase 2: Production
                    </h3>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3 py-6">
                    <div className="w-20 h-20 rounded-full bg-[#e6e9e7] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[40px] text-[#c0c9c0]">smart_toy</span>
                    </div>
                    <p className="text-base font-semibold text-[#181c1b]">Awaiting Script Approval</p>
                    <p className="text-sm text-[#414942] max-w-[220px]">
                      Review and edit your script in Phase 1 before initiating video production.
                    </p>
                  </div>
                  <div className="bg-[#f7faf8] rounded-xl p-4 border border-[#c0c9c0]">
                    <h5 className="text-xs font-semibold text-[#717972] uppercase tracking-wider mb-3">How It Works</h5>
                    <div className="space-y-3">
                      {[
                        { icon: 'auto_awesome', title: 'Script', desc: 'NVIDIA NIM writes a script sized to your chosen duration' },
                        { icon: 'edit', title: 'Review', desc: 'Read and edit the script before audio is generated' },
                        { icon: 'record_voice_over', title: 'Voice', desc: 'ElevenLabs synthesizes natural-sounding audio' },
                        { icon: 'videocam', title: 'Video', desc: 'HeyGen renders an AI avatar speaking your script' },
                      ].map((step) => (
                        <div key={step.title} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-[#b8efc9] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-[#002c17]">{step.icon}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#181c1b]">{step.title}</p>
                            <p className="text-xs text-[#717972] mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* In Review section */}
          {!loadingReview && reviewAssignments.length > 0 && (
            <div id="in-review" className="border-t border-[#c0c9c0] pt-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                <h3
                  className="text-2xl font-semibold text-[#002c17]"
                  style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
                >
                  Videos Awaiting Your Review
                </h3>
                <span className="text-xs text-white bg-[#ba1a1a] px-2 py-0.5 rounded-full font-semibold">{reviewAssignments.length}</span>
              </div>
              <div className="flex flex-col gap-4">
                {reviewAssignments.map((a) => (
                  <ReviewCard key={a.id} assignment={a} onAction={loadReviewAssignments} />
                ))}
              </div>
            </div>
          )}

          {/* My Videos */}
          {!loadingProjects && projects.length > 0 && (
            <div id="my-videos" className="border-t border-[#c0c9c0] pt-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
                <h3
                  className="text-2xl font-semibold text-[#002c17]"
                  style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
                >
                  My Videos
                </h3>
                <span className="text-xs text-[#717972] bg-[#ebefed] px-2 py-0.5 rounded-full">{projects.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-[1.5rem] border border-[#c0c9c0] p-4 hover:border-[#9cd3ae] hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-[#181c1b] line-clamp-2">{project.title}</p>
                      <ProjectStatusBadge status={project.status} editorStatus={project.editor_status} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#717972] mt-1">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    {project.video_url && (
                      <a
                        href={project.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block text-xs text-[#35684a] hover:text-[#002c17] transition-colors font-medium"
                      >
                        Watch video →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ assignment, onAction }: { assignment: EditorAssignment; onAction: () => void }) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<'approved' | 'revision' | null>(null);

  const submit = async (action: 'approve' | 'revision') => {
    if (action === 'revision' && !feedback.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${assignment.project_id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, assignmentId: assignment.id, feedback }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setResult(action === 'approve' ? 'approved' : 'revision');
      onAction();
    }
  };

  if (done) {
    return (
      <div className={`rounded-[1.5rem] border p-5 flex items-center gap-3 ${result === 'approved' ? 'bg-[#b8efc9]/20 border-[#9cd3ae]' : 'bg-[#ffdad6]/30 border-[#ba1a1a]/20'}`}>
        <span className={`material-symbols-outlined text-[24px] ${result === 'approved' ? 'text-[#35684a]' : 'text-[#ba1a1a]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {result === 'approved' ? 'check_circle' : 'feedback'}
        </span>
        <p className="text-sm font-medium text-[#181c1b]">
          {result === 'approved'
            ? `Approved "${assignment.project?.title}"! The editor has been notified.`
            : `Revision requested for "${assignment.project?.title}". The editor will see your feedback.`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[#181c1b]">{assignment.project?.title ?? 'Untitled Project'}</p>
          <p className="text-xs text-[#717972] mt-0.5">
            Edited by <span className="font-medium text-[#414942]">@{assignment.editor?.username ?? '?'}</span>
            {' · '}
            {new Date(assignment.updated_at).toLocaleDateString()}
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border text-[#384e00] bg-[#bff43f]/30 border-[#bff43f] shrink-0">
          Ready for Review
        </span>
      </div>

      {/* Side-by-side videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignment.raw_video_url && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-[#717972] uppercase tracking-wider">Raw Video</p>
            <video src={assignment.raw_video_url} controls className="w-full rounded-xl border border-[#c0c9c0] bg-black max-h-[180px] object-contain" />
          </div>
        )}
        {assignment.editor_video_url && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-[#35684a] uppercase tracking-wider">Editor&apos;s Version</p>
            <video src={assignment.editor_video_url} controls className="w-full rounded-xl border border-[#9cd3ae] bg-black max-h-[180px] object-contain" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!showFeedback ? (
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => submit('approve')}
            disabled={loading}
            className="flex-1 bg-[#35684a] hover:bg-[#002c17] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">thumb_up</span>}
            Approve
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            disabled={loading}
            className="flex-1 border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ffdad6]/30 disabled:opacity-60 font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">feedback</span>
            Request Revision
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#414942]">Feedback for the editor:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what needs to be changed…"
              rows={3}
              className="w-full border border-[#c0c9c0] rounded-xl p-3 text-sm text-[#181c1b] outline-none focus:border-[#35684a] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => submit('revision')}
              disabled={loading || !feedback.trim()}
              className="flex-1 bg-[#ba1a1a] hover:bg-[#8b1414] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">send</span>}
              Send Feedback
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="px-5 py-3 border border-[#c0c9c0] text-[#414942] hover:bg-[#f1f4f2] font-semibold rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project Status Badge ──────────────────────────────────────────────────────
function ProjectStatusBadge({ status, editorStatus }: { status: string; editorStatus?: string }) {
  if (editorStatus === 'submitted') {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 text-[#384e00] bg-[#bff43f]/30 border-[#bff43f]">Review Needed</span>;
  }
  if (editorStatus === 'sent') {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 text-[#4c6700] bg-[#bff43f]/20 border-[#bff43f]/50">With Editor</span>;
  }
  if (editorStatus === 'approved') {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 text-[#35684a] bg-[#b8efc9] border-[#9cd3ae]">Approved</span>;
  }
  if (editorStatus === 'revision_requested') {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 text-[#ba1a1a] bg-[#ffdad6] border-[#ba1a1a]/20">Revision</span>;
  }
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: 'Done', className: 'text-[#35684a] bg-[#b8efc9] border-[#9cd3ae]' },
    'script-ready': { label: 'Draft', className: 'text-[#4c6700] bg-[#bff43f]/30 border-[#bff43f]' },
    error: { label: 'Error', className: 'text-[#ba1a1a] bg-[#ffdad6] border-[#ba1a1a]/20' },
  };
  const s = map[status] ?? { label: status, className: 'text-[#414942] bg-[#ebefed] border-[#c0c9c0]' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${s.className}`}>{s.label}</span>;
}
