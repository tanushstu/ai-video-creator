'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, Eye, EyeOff, Save, Loader2, Users, Key, CheckCircle, AlertTriangle, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface KeysState {
  nvidia_key: string;
  elevenlabs_key: string;
  heygen_key: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<KeysState>({ nvidia_key: '', elevenlabs_key: '', heygen_key: '' });
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [show, setShow] = useState({ nvidia: false, elevenlabs: false, heygen: false });
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    // Fetch existing keys
    fetch('/api/admin/keys')
      .then((r) => r.json())
      .then((d) => {
        if (d.keys) setKeys(d.keys);
        setKeysLoaded(true);
      })
      .catch(() => setKeysLoaded(true));

    // Fetch users
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { if (d.users) setUsers(d.users); })
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    setKeysError('');
    setKeysSaved(false);

    const res = await fetch('/api/admin/keys', {
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

  const handleImpersonate = async (email: string) => {
    setImpersonating(email);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); setImpersonating(null); return; }
      // Navigate to magic link — signs in as that user
      window.location.href = data.link;
    } catch {
      alert('Failed to impersonate user');
      setImpersonating(null);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const keyFields: { key: keyof KeysState; label: string; placeholder: string; showKey: keyof typeof show }[] = [
    { key: 'nvidia_key', label: 'NVIDIA NIM API Key', placeholder: 'nvapi-…', showKey: 'nvidia' },
    { key: 'elevenlabs_key', label: 'ElevenLabs API Key', placeholder: 'sk-…', showKey: 'elevenlabs' },
    { key: 'heygen_key', label: 'HeyGen API Key', placeholder: 'NjI3…', showKey: 'heygen' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-none">AI Vid Creator</h1>
              <p className="text-xs text-slate-500 mt-0.5">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-0.5 font-medium">
              Admin
            </span>
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

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* API Keys Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">API Keys Configuration</h2>
          </div>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-slate-400 mb-6">
              These keys are used by all users of the platform. They are stored securely and never exposed to the browser.
            </p>

            {!keysLoaded ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-slate-500" />
              </div>
            ) : (
              <form onSubmit={handleSaveKeys} className="space-y-4">
                {keyFields.map(({ key, label, placeholder, showKey }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={show[showKey] ? 'text' : 'password'}
                        value={keys[key]}
                        onChange={(e) => setKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((prev) => ({ ...prev, [showKey]: !prev[showKey] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                {keysError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <AlertTriangle size={14} />
                    {keysError}
                  </div>
                )}

                {keysSaved && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <CheckCircle size={14} />
                    API keys saved successfully.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingKeys}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  {savingKeys ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {savingKeys ? 'Saving…' : 'Save Keys'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Users Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Registered Users</h2>
            {!loadingUsers && (
              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{users.length}</span>
            )}
          </div>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
            {loadingUsers ? (
              <div className="flex justify-center py-10">
                <Loader2 size={20} className="animate-spin text-slate-500" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">No users yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`${i < users.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/3 transition-colors`}
                    >
                      <td className="px-5 py-3 text-white">{user.email}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleImpersonate(user.email)}
                          disabled={impersonating === user.email}
                          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 ml-auto"
                        >
                          {impersonating === user.email
                            ? <Loader2 size={12} className="animate-spin" />
                            : <LogIn size={12} />}
                          Login as
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
