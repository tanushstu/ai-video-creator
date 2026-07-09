'use client';

import { useState } from 'react';

type Platform = 'youtube' | 'instagram';

interface Props {
  videoUrl: string;
  onClose: () => void;
}

export default function UploadToSocialsModal({ videoUrl, onClose }: Props) {
  const [platforms, setPlatforms] = useState<Platform[]>(['youtube']);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (p: Platform) =>
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/upload-to-socials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, platforms, title, description, caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-[#c0c9c0] focus:border-[#002c17] outline-none px-3 py-2 text-sm text-[#002c17]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#9cd3ae] shadow-lg w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="material-symbols-outlined text-[20px] text-[#35684a]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            share
          </span>
          <h3 className="text-base font-semibold text-[#002c17]">Upload to Socials</h3>
        </div>

        {success ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-[40px] text-[#35684a]">
              check_circle
            </span>
            <p className="text-sm text-[#002c17] mt-2 mb-4">
              Sent to Zernio for publishing on {platforms.join(' & ')}.
            </p>
            <button
              onClick={onClose}
              className="text-sm bg-[#bff43f] text-[#151f00] rounded-lg px-4 py-2 font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#717972] mb-2">Platform</p>
            <div className="flex gap-2 mb-4">
              {(['youtube', 'instagram'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize border transition-colors ${
                    platforms.includes(p)
                      ? 'bg-[#bff43f] text-[#151f00] border-[#a4d71e] font-medium'
                      : 'border-[#c0c9c0] text-[#414942] hover:border-[#002c17]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {platforms.includes('youtube') && (
              <div className="space-y-2 mb-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="YouTube title"
                  maxLength={100}
                  className={inputCls}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="YouTube description"
                  rows={2}
                  className={inputCls}
                />
              </div>
            )}
            {platforms.includes('instagram') && (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Instagram caption"
                rows={2}
                className={`${inputCls} mb-3`}
              />
            )}

            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

            <div className="flex justify-end gap-2 mt-2">
              <button onClick={onClose} className="text-sm text-[#414942] px-3 py-2">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || platforms.length === 0}
                className="flex items-center gap-1.5 text-sm bg-[#bff43f] text-[#151f00] rounded-lg px-4 py-2 font-medium disabled:opacity-50"
              >
                {loading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                {loading ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
