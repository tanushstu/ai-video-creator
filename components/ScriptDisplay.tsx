'use client';

import { useState } from 'react';
import { Copy, CheckCheck, FileText, Pencil } from 'lucide-react';

interface Props {
  script: string;
  onChange: (updated: string) => void;
}

export default function ScriptDisplay({ script, onChange }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.round((wordCount / 150) * 60);

  return (
    <div className="bg-[#1a1f2e] border border-indigo-500/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Generated Script</h3>
          <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5">
            <Pencil size={10} />
            Editable
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {wordCount} words · ~{estimatedDuration}s
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            {copied ? (
              <>
                <CheckCheck size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <textarea
        value={script}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full bg-[#0d1117] rounded-xl p-4 text-sm text-slate-300 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors"
        spellCheck={false}
      />
      <p className="mt-2 text-xs text-slate-600">
        Edit the script above if needed, then click <span className="text-indigo-400 font-medium">Generate Audio &amp; Video</span> to continue.
      </p>
    </div>
  );
}
