'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EditorAssignment } from '@/types';

export default function EditorPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [assignments, setAssignments] = useState<EditorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }

      // Check editor role
      const { data: profile } = await supabase
        .from('users')
        .select('username, role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'editor') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setUsername(profile.username ?? user.email?.split('@')[0] ?? 'Editor');

      fetch('/api/editor/assignments')
        .then((r) => r.json())
        .then((d) => { if (d.assignments) setAssignments(d.assignments); })
        .finally(() => setLoading(false));
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const refreshAssignments = () => {
    fetch('/api/editor/assignments')
      .then((r) => r.json())
      .then((d) => { if (d.assignments) setAssignments(d.assignments); });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7faf8]">
        <div className="w-8 h-8 border-4 border-[#e0e3e1] border-t-[#002c17] rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7faf8] flex-col gap-4">
        <span className="material-symbols-outlined text-[48px] text-[#ba1a1a]">block</span>
        <p className="text-lg font-semibold text-[#181c1b]">Access Denied</p>
        <p className="text-sm text-[#717972]">This portal is only for editors.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-2 bg-[#002c17] text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#35684a] transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'revision_requested');
  const submitted = assignments.filter((a) => a.status === 'submitted' || a.status === 'approved');

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7faf8]">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#f7faf8] border-r border-[#c0c9c0] flex flex-col py-6 z-40 hidden md:flex">
        <div className="px-6 mb-8 flex flex-col gap-2">
          <h1
            className="text-2xl font-extrabold text-[#002c17] tracking-tight"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            AI Vid Creator
          </h1>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4c6700] bg-[#bff43f]/30 border border-[#bff43f] rounded-full px-2.5 py-0.5 w-fit">
            <span className="material-symbols-outlined text-[14px]">edit_note</span>
            Editor Portal
          </span>
        </div>

        <nav className="flex-1 px-2">
          <ul className="flex flex-col gap-1">
            <li>
              <a href="#assignments" className="flex items-center gap-3 px-4 py-3 text-[#002c17] border-l-4 border-[#bff43f] font-bold bg-[#e6e9e7] rounded-r-lg">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                <span className="text-sm">My Assignments</span>
                {pending.length > 0 && (
                  <span className="ml-auto text-xs font-bold text-white bg-[#002c17] rounded-full w-5 h-5 flex items-center justify-center">
                    {pending.length}
                  </span>
                )}
              </a>
            </li>
          </ul>
        </nav>

        <div className="mt-auto px-6 pt-4 border-t border-[#c0c9c0] mx-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#002c17] text-white flex items-center justify-center font-bold text-xs">
            {username.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-semibold text-[#181c1b] truncate">@{username}</p>
            <p className="text-xs text-[#717972]">Editor</p>
          </div>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors" title="Sign out">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-[280px] h-screen overflow-y-auto bg-white custom-scrollbar">
        <div className="md:hidden flex justify-between items-center px-6 py-4 border-b border-[#c0c9c0]">
          <h1 className="text-xl font-extrabold text-[#002c17]" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
            Editor Portal
          </h1>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-8 flex flex-col gap-10">
          <header>
            <h2
              className="text-[32px] leading-10 font-semibold text-[#002c17] mb-1"
              style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
            >
              Welcome, @{username}
            </h2>
            <p className="text-base text-[#414942]">Review your assigned projects and upload your edited videos.</p>
          </header>

          {/* Pending / needs action */}
          <section id="assignments">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
              <h3
                className="text-xl font-semibold text-[#002c17]"
                style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
              >
                Needs Action
              </h3>
              <span className="text-xs text-[#717972] bg-[#ebefed] px-2 py-0.5 rounded-full">{pending.length}</span>
            </div>

            {pending.length === 0 ? (
              <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] p-10 text-center">
                <span className="material-symbols-outlined text-[40px] text-[#c0c9c0] block mb-2">check_circle</span>
                <p className="text-sm text-[#717972]">No pending assignments. You're all caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} onDone={refreshAssignments} />
                ))}
              </div>
            )}
          </section>

          {/* Submitted / done */}
          {submitted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-[#717972]">history</span>
                <h3
                  className="text-xl font-semibold text-[#002c17]"
                  style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
                >
                  Submitted
                </h3>
                <span className="text-xs text-[#717972] bg-[#ebefed] px-2 py-0.5 rounded-full">{submitted.length}</span>
              </div>
              <div className="flex flex-col gap-4">
                {submitted.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} onDone={refreshAssignments} readonly />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function AssignmentCard({
  assignment,
  onDone,
  readonly = false,
}: {
  assignment: EditorAssignment;
  onDone: () => void;
  readonly?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const form = new FormData();
    form.append('video', file);

    const res = await fetch(`/api/editor/assignments/${assignment.id}/submit`, {
      method: 'POST',
      body: form,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setUploadError(data.error ?? 'Upload failed');
    } else {
      setUploaded(true);
      onDone();
    }
  };

  const statusBadge: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'text-[#4c6700] bg-[#bff43f]/30 border-[#bff43f]' },
    revision_requested: { label: 'Revision Needed', cls: 'text-[#ba1a1a] bg-[#ffdad6] border-[#ba1a1a]/20' },
    submitted: { label: 'Submitted', cls: 'text-[#35684a] bg-[#b8efc9] border-[#9cd3ae]' },
    approved: { label: 'Approved', cls: 'text-[#002c17] bg-[#b8efc9] border-[#35684a]' },
  };
  const badge = statusBadge[assignment.status] ?? { label: assignment.status, cls: 'text-[#414942] bg-[#ebefed] border-[#c0c9c0]' };

  return (
    <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] p-6 flex flex-col gap-4 hover:border-[#9cd3ae] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[#181c1b]">{assignment.project?.title ?? 'Untitled Project'}</p>
          <p className="text-xs text-[#717972] mt-0.5">
            From <span className="font-medium text-[#414942]">@{assignment.assigned_by_user?.username ?? '?'}</span>
            {' · '}
            {new Date(assignment.assigned_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Feedback when revision is requested */}
      {assignment.status === 'revision_requested' && assignment.feedback_message && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl p-3 flex gap-2">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[18px] shrink-0 mt-0.5">feedback</span>
          <div>
            <p className="text-xs font-semibold text-[#ba1a1a] mb-0.5">Revision feedback:</p>
            <p className="text-sm text-[#181c1b]">{assignment.feedback_message}</p>
          </div>
        </div>
      )}

      {/* Raw video to edit */}
      {assignment.raw_video_url && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#414942]">Raw Video (to edit):</p>
          <a
            href={assignment.raw_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#35684a] hover:text-[#002c17] font-medium transition-colors bg-[#f1f4f2] border border-[#c0c9c0] rounded-xl px-4 py-2.5 w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download Raw Video
          </a>
        </div>
      )}

      {/* Editor's submitted video */}
      {assignment.editor_video_url && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#414942]">Your Submission:</p>
          <video
            src={assignment.editor_video_url}
            controls
            className="w-full max-h-[200px] rounded-xl border border-[#c0c9c0] object-contain bg-black"
          />
        </div>
      )}

      {/* Upload area (only when action needed) */}
      {!readonly && (assignment.status === 'pending' || assignment.status === 'revision_requested') && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#414942]">
            {assignment.status === 'revision_requested' ? 'Upload Corrected Video:' : 'Upload Edited Video:'}
          </p>

          {uploaded ? (
            <div className="flex items-center gap-2 text-sm text-[#35684a] bg-[#b8efc9] border border-[#9cd3ae] rounded-xl px-3 py-2.5">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Video submitted! The user will review it shortly.
            </div>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 bg-[#002c17] hover:bg-[#35684a] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-full transition-colors text-sm w-fit"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Select & Upload Video
                  </>
                )}
              </button>
              {uploadError && (
                <p className="text-xs text-[#ba1a1a]">{uploadError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
