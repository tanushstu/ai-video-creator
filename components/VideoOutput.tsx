'use client';

import { Download, Play, ExternalLink } from 'lucide-react';

interface Props {
  videoUrl: string;
  audioUrl?: string;
}

export default function VideoOutput({ videoUrl, audioUrl }: Props) {
  function handleDownload() {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `ai-video-${Date.now()}.mp4`;
    a.target = '_blank';
    a.click();
  }

  return (
    <div className="bg-[#1a1f2e] border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Generated Video</h3>
        </div>
        <div className="flex gap-2">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <ExternalLink size={12} />
            Open
          </a>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Download size={12} />
            Download
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-full"
          playsInline
        >
          Your browser does not support video playback.
        </video>
      </div>

      {audioUrl && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1.5">Preview Audio</p>
          <audio controls src={audioUrl} className="w-full h-8" />
        </div>
      )}
    </div>
  );
}
