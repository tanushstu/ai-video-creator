'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Workspace } from '@/types';

export default function SuperAdminPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create workspace state
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const fetchWorkspaces = () => {
    fetch('/api/super-admin/workspaces')
      .then((r) => r.json())
      .then((d) => { if (d.workspaces) setWorkspaces(d.workspaces); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    const res = await fetch('/api/super-admin/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceName: newWorkspaceName, adminEmail, adminPassword }),
    });
    
    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateError(data.error || 'Failed to create workspace.');
    } else {
      setNewWorkspaceName('');
      setAdminEmail('');
      setAdminPassword('');
      fetchWorkspaces();
    }
  };

  const handleImpersonate = async (email: string) => {
    setImpersonating(email);
    try {
      const res = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); setImpersonating(null); return; }
      window.location.href = data.link;
    } catch {
      alert('Failed to impersonate admin');
      setImpersonating(null);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7faf8]">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#f7faf8] border-r border-[#c0c9c0] flex flex-col py-6 z-40 hidden md:flex">
        <div className="px-6 mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-[#002c17] tracking-tight" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
            AI Vid Creator
          </h1>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#35684a] bg-[#b8efc9] border border-[#9cd3ae] rounded-full px-2.5 py-0.5 w-fit">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Super Admin
          </span>
        </div>
        <nav className="flex-1 px-2">
          <ul className="flex flex-col gap-1">
            <li>
              <a href="#workspaces" className="flex items-center gap-3 px-4 py-3 text-[#002c17] border-l-4 border-[#bff43f] font-bold bg-[#e6e9e7] rounded-r-lg">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspaces</span>
                <span className="text-sm">Workspaces</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-auto px-6 pt-4 border-t border-[#c0c9c0] mx-4 flex items-center justify-between">
          <span className="text-sm text-[#414942] font-medium">Super Admin</span>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors" title="Sign out">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] h-screen overflow-y-auto bg-white custom-scrollbar">
        <div className="max-w-4xl mx-auto p-8 space-y-10">
          
          <section id="create">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              <h2 className="text-2xl font-semibold text-[#002c17]">Create New Workspace</h2>
            </div>
            <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-6">
              <form onSubmit={handleCreateWorkspace} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Workspace Name</label>
                  <input
                    type="text"
                    required
                    value={newWorkspaceName}
                    onChange={e => setNewWorkspaceName(e.target.value)}
                    className="w-full bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#35684a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#35684a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Admin Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#35684a]"
                  />
                </div>
                {createError && (
                  <div className="text-sm text-[#ba1a1a] bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
                    {createError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-[#002c17] hover:bg-[#35684a] text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create Workspace
                </button>
              </form>
            </div>
          </section>

          <section id="workspaces">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
              <h2 className="text-2xl font-semibold text-[#002c17]">All Workspaces</h2>
              {!loading && (
                <span className="text-xs text-[#717972] bg-[#ebefed] px-2 py-0.5 rounded-full">{workspaces.length}</span>
              )}
            </div>
            
            <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-4 border-[#e0e3e1] border-t-[#002c17] rounded-full animate-spin" />
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#717972]">No workspaces yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e0e3e1]">
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Workspace</th>
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Admin</th>
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Members</th>
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Created</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {workspaces.map((ws, i) => (
                      <tr key={ws.id} className={`${i < workspaces.length - 1 ? 'border-b border-[#f1f4f2]' : ''} hover:bg-[#f7faf8] transition-colors`}>
                        <td className="px-5 py-4 font-medium text-[#181c1b]">{ws.name}</td>
                        <td className="px-5 py-4">
                          <div className="text-[#181c1b]">@{ws.admin_username}</div>
                          <div className="text-xs text-[#717972]">{ws.admin_email}</div>
                        </td>
                        <td className="px-5 py-4 text-[#414942]">{ws.member_count}</td>
                        <td className="px-5 py-4 text-[#717972]">{new Date(ws.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => ws.admin_email && handleImpersonate(ws.admin_email)}
                            disabled={!ws.admin_email || impersonating === ws.admin_email}
                            className="inline-flex items-center gap-1.5 text-xs text-[#35684a] hover:text-[#002c17] border border-[#9cd3ae] hover:border-[#002c17]/30 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                          >
                            {impersonating === ws.admin_email ? (
                              <div className="w-3 h-3 border-2 border-[#35684a]/30 border-t-[#35684a] rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">login</span>
                            )}
                            Login as Admin
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          
        </div>
      </main>
    </div>
  );
}
