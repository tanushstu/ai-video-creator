'use client';

import { useState } from 'react';

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
    <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm flex flex-col h-[400px] overflow-hidden">
      {/* Header */}
      <div className="bg-[#ebefed] flex items-center justify-between px-4 py-3 border-b border-[#c0c9c0]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#414942] text-[18px]">terminal</span>
          <span className="text-xs font-semibold text-[#414942] uppercase tracking-wider">
            AI Script Editor
          </span>
          <span className="flex items-center gap-1 text-xs text-[#35684a] bg-[#b8efc9] px-1.5 py-0.5 rounded border border-[#9cd3ae]">
            <span className="material-symbols-outlined text-[10px]">edit</span>
            Editable
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#717972]">
            {wordCount} words · ~{estimatedDuration}s
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#414942] hover:text-[#002c17] border border-[#c0c9c0] hover:border-[#002c17] rounded-lg px-2.5 py-1.5 transition-colors"
          >
            {copied ? (
              <>
                <span className="material-symbols-outlined text-[14px] text-[#35684a]">check_circle</span>
                <span className="text-[#35684a]">Copied</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={script}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-4 bg-white text-base text-[#181c1b] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#002c17]/20 focus:ring-inset"
        spellCheck={false}
      />

      {/* Footer hint */}
      <div className="px-4 py-2 bg-[#f1f4f2] border-t border-[#c0c9c0]">
        <p className="text-xs text-[#717972]">
          Edit above if needed, then click{' '}
          <span className="text-[#002c17] font-semibold">Generate Audio &amp; Video</span> to continue.
        </p>
      </div>
    </div>
  );
}
