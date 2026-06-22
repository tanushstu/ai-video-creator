'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Trash2, CheckCircle, Key } from 'lucide-react';
import { saveCredentials, loadCredentials, clearCredentials } from '@/lib/storage';
import type { Credentials } from '@/types';

interface Props {
  onCredentialsChange: (creds: Credentials | null) => void;
}

const EMPTY: Credentials = { nvidiaKey: '', elevenlabsKey: '', heygenKey: '' };

export default function CredentialsPanel({ onCredentialsChange }: Props) {
  const [creds, setCreds] = useState<Credentials>(EMPTY);
  const [visible, setVisible] = useState({ openai: false, elevenlabs: false, heygen: false });
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = loadCredentials();
    if (stored) {
      setCreds(stored);
      onCredentialsChange(stored);
      setSaved(true);
    }
  }, [onCredentialsChange]);

  const isValid =
    creds.nvidiaKey.startsWith('nvapi-') &&
    creds.elevenlabsKey.length > 10 &&
    creds.heygenKey.length > 10;

  function handleSave() {
    if (!isValid) return;
    saveCredentials(creds);
    onCredentialsChange(creds);
    setSaved(true);
    setIsOpen(false);
  }

  function handleClear() {
    clearCredentials();
    setCreds(EMPTY);
    onCredentialsChange(null);
    setSaved(false);
  }

  const toggle = (field: keyof typeof visible) =>
    setVisible((v) => ({ ...v, [field]: !v[field] }));

  const fields: { key: keyof Credentials; label: string; placeholder: string; visKey: keyof typeof visible }[] = [
    { key: 'nvidiaKey', label: 'NVIDIA NIM API Key', placeholder: 'nvapi-...', visKey: 'openai' },
    { key: 'elevenlabsKey', label: 'ElevenLabs API Key', placeholder: 'Enter your ElevenLabs key', visKey: 'elevenlabs' },
    { key: 'heygenKey', label: 'HeyGen API Key', placeholder: 'Enter your HeyGen key', visKey: 'heygen' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          saved
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
        }`}
      >
        {saved ? <CheckCircle size={16} /> : <Key size={16} />}
        {saved ? 'Keys Saved' : 'Add API Keys'}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">API Credentials</h3>
            <span className="text-xs text-slate-400">Stored in sessionStorage</span>
          </div>

          <div className="space-y-3">
            {fields.map(({ key, label, placeholder, visKey }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={visible[visKey] ? 'text' : 'password'}
                    value={creds[key]}
                    onChange={(e) => {
                      setCreds((c) => ({ ...c, [key]: e.target.value }));
                      setSaved(false);
                    }}
                    placeholder={placeholder}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={() => toggle(visKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {visible[visKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!isValid && creds.nvidiaKey && (
            <p className="mt-2 text-xs text-amber-400">
              {!creds.nvidiaKey.startsWith('nvapi-') ? 'NVIDIA NIM key must start with nvapi-' : 'All fields are required'}
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <Save size={14} />
              Save Keys
            </button>
            {saved && (
              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-sm px-3 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Keys are base64-encoded in sessionStorage and never sent to any server other than the respective API providers.
          </p>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
