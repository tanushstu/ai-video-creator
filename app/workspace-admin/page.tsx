'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'editor';
  created_at: string;
}

interface KeysState {
  nvidia_key: string;
  elevenlabs_key: string;
  heygen_key: string;
  submagic_key: string;
}

export default function WorkspaceAdminPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<KeysState>({ nvidia_key: '', elevenlabs_key: '', heygen_key: '', submagic_key: '' });
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [show, setShow] = useState({ nvidia: false, elevenlabs: false, heygen: false, submagic: false });

  // Add member state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'editor'>('user');
  const [addingMember, setAddingMember] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchMembers = () => {
    fetch('/api/workspace-admin/members')
      .then((r) => r.json())
      .then((d) => { if (d.members) setMembers(d.members); })
      .finally(() => setLoadingMembers(false));
  };

  useEffect(() => {
    fetch('/api/workspace-admin/keys')
      .then((r) => r.json())
      .then((d) => {
        if (d.keys) setKeys(d.keys);
        setKeysLoaded(true);
      })
      .catch(() => setKeysLoaded(true));

    fetchMembers();
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    setKeysError('');
    setKeysSaved(false);

    const res = await fetch('/api/workspace-admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    });
    const data = await res.json();
    setSavingKeys(false);

    if (!res.ok) {
      setKeysError(data.error || 'Failed to save keys.');
    } else {
      setKeysSaved(true);
      setTimeout(() => setKeysSaved(false), 3000);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    setAddError('');

    const res = await fetch('/api/workspace-admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
    });
    const data = await res.json();
    setAddingMember(false);

    if (!res.ok) {
      setAddError(data.error || 'Failed to add member.');
    } else {
      setNewEmail('');
      setNewPassword('');
      fetchMembers();
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const keyFields: { key: keyof KeysState; label: string; placeholder: string; showKey: keyof typeof show; icon: string }[] = [
    { key: 'nvidia_key', label: 'Google Gemini API Key', placeholder: 'AIza…', showKey: 'nvidia', icon: 'memory' },
    { key: 'elevenlabs_key', label: 'ElevenLabs API Key', placeholder: 'sk-…', showKey: 'elevenlabs', icon: 'record_voice_over' },
    { key: 'heygen_key', label: 'HeyGen API Key', placeholder: 'NjI3…', showKey: 'heygen', icon: 'videocam' },
    { key: 'submagic_key', label: 'Submagic API Key', placeholder: 'sub-…', showKey: 'submagic', icon: 'auto_awesome' },
  ];

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
            Workspace Admin
          </span>
        </div>
        <nav className="flex-1 px-2">
          <ul className="flex flex-col gap-1">
            <li>
              <a href="#keys" className="flex items-center gap-3 px-4 py-3 text-[#002c17] border-l-4 border-[#bff43f] font-bold bg-[#e6e9e7] rounded-r-lg">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                <span className="text-sm">API Keys</span>
              </a>
            </li>
            <li>
              <a href="#members" className="flex items-center gap-3 px-4 py-3 text-[#414942] hover:bg-[#f1f4f2] hover:text-[#002c17] transition-colors rounded-lg ml-1">
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span className="text-sm">Members</span>
                {!loadingMembers && <span className="ml-auto text-xs text-[#717972] bg-[#ebefed] px-1.5 py-0.5 rounded-full">{members.length}</span>}
              </a>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#414942] hover:bg-[#f1f4f2] hover:text-[#002c17] transition-colors rounded-lg ml-1">
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                <span className="text-sm">Dashboard</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto px-6 pt-4 border-t border-[#c0c9c0] mx-4 flex items-center justify-between">
          <span className="text-sm text-[#414942] font-medium">Admin</span>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors" title="Sign out">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] h-screen overflow-y-auto bg-white custom-scrollbar">
        <div className="md:hidden flex justify-between items-center px-6 py-4 border-b border-[#c0c9c0]">
          <h1 className="text-xl font-extrabold text-[#002c17]" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
            Workspace Admin
          </h1>
          <button onClick={handleLogout} className="text-[#717972] hover:text-[#ba1a1a] transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto p-8 space-y-10">
          {/* API Keys */}
          <section id="keys">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
              <h2 className="text-2xl font-semibold text-[#002c17]" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
                Workspace API Keys
              </h2>
            </div>
            <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-6">
              {!keysLoaded ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-[#e0e3e1] border-t-[#002c17] rounded-full animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSaveKeys} className="space-y-4">
                  {keyFields.map(({ key, label, placeholder, showKey, icon }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-[#181c1b] mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#35684a]">{icon}</span>
                        {label}
                      </label>
                      <div className="input-field flex items-center bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2.5">
                        <input
                          type={show[showKey] ? 'text' : 'password'}
                          value={keys[key]}
                          onChange={(e) => setKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-transparent border-none p-0 text-base text-[#181c1b] placeholder-[#717972] focus:ring-0 outline-none font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShow((prev) => ({ ...prev, [showKey]: !prev[showKey] }))}
                          className="text-[#717972] hover:text-[#181c1b] transition-colors focus:outline-none ml-2"
                        >
                          <span className="material-symbols-outlined text-[20px]">{show[showKey] ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {keysError && (
                    <div className="flex items-center gap-2 text-sm text-[#ba1a1a] bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-3 py-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      {keysError}
                    </div>
                  )}

                  {keysSaved && (
                    <div className="flex items-center gap-2 text-sm text-[#35684a] bg-[#b8efc9] border border-[#9cd3ae] rounded-xl px-3 py-2">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      API keys saved successfully.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingKeys}
                    className="btn-primary flex items-center gap-2 bg-[#002c17] hover:bg-[#35684a] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
                  >
                    {savingKeys ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Save Keys
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Add Member */}
          <section id="add-member">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              <h2 className="text-2xl font-semibold text-[#002c17]" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
                Add New Member
              </h2>
            </div>
            <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-6">
              <form onSubmit={handleAddMember} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#35684a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#35684a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181c1b] mb-1.5">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'editor')}
                    className="w-full bg-[#f1f4f2] border border-[#e0e3e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#35684a] text-[#181c1b]"
                  >
                    <option value="user">User</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
                
                {addError && (
                  <div className="text-sm text-[#ba1a1a] bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
                    {addError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={addingMember}
                  className="bg-[#002c17] hover:bg-[#35684a] text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {addingMember && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Add Member
                </button>
              </form>
            </div>
          </section>

          {/* Members */}
          <section id="members">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#35684a]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <h2 className="text-2xl font-semibold text-[#002c17]" style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}>
                Workspace Members
              </h2>
              {!loadingMembers && (
                <span className="text-xs text-[#717972] bg-[#ebefed] px-2 py-0.5 rounded-full">{members.length}</span>
              )}
            </div>
            <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm overflow-hidden">
              {loadingMembers ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-4 border-[#e0e3e1] border-t-[#002c17] rounded-full animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#717972]">No members yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e0e3e1]">
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Member</th>
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Role</th>
                      <th className="text-left text-xs font-semibold text-[#717972] px-5 py-3 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, i) => (
                      <tr key={member.id} className={`${i < members.length - 1 ? 'border-b border-[#f1f4f2]' : ''} hover:bg-[#f7faf8] transition-colors`}>
                        <td className="px-5 py-4">
                          <p className="text-[#181c1b] font-medium">@{member.username || member.email.split('@')[0]}</p>
                          <p className="text-xs text-[#717972]">{member.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${member.role === 'editor' ? 'text-[#4c6700] bg-[#bff43f]/30 border-[#bff43f]' : 'text-[#414942] bg-[#ebefed] border-[#c0c9c0]'}`}>
                            <span className="material-symbols-outlined text-[13px]">{member.role === 'editor' ? 'edit_note' : 'person'}</span>
                            {member.role === 'editor' ? 'Editor' : 'User'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#717972]">
                          {new Date(member.created_at).toLocaleDateString()}
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
