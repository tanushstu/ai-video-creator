'use client';

import { useState } from 'react';
import UploadToSocialsModal from './UploadToSocialsModal';

interface Props {
  videoUrl: string;
  audioUrl?: string;
}

export default function VideoOutput({ videoUrl, audioUrl }: Props) {
  const [showUpload, setShowUpload] = useState(false);

  function handleDownload() {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `ai-video-${Date.now()}.mp4`;
    a.target = '_blank';
    a.click();
  }

  return (
    <div className="bg-white rounded-[1.5rem] border border-[#9cd3ae] shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[20px] text-[#35684a]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_circle
          </span>
          <h3
            className="text-base font-semibold text-[#002c17]"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            Generated Video
          </h3>
        </div>
        <div className="flex gap-2">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#414942] hover:text-[#002c17] border border-[#c0c9c0] hover:border-[#002c17] rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            Open
          </a>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs bg-[#bff43f] text-[#151f00] hover:bg-[#a4d71e] border border-[#a4d71e] rounded-lg px-2.5 py-1.5 transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            Download
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 text-xs bg-[#002c17] text-white hover:bg-[#014023] border border-[#002c17] rounded-lg px-2.5 py-1.5 transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[14px]">share</span>
            Upload to Socials
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden bg-[#181c1b] aspect-video">
        <video src={videoUrl} controls autoPlay className="w-full h-full" playsInline>
          Your browser does not support video playback.
        </video>
      </div>

      {audioUrl && (
        <div className="mt-3">
          <p className="text-xs text-[#717972] mb-1.5">Preview Audio</p>
          <audio controls src={audioUrl} className="w-full h-8" />
        </div>
      )}

      {showUpload && (
        <UploadToSocialsModal videoUrl={videoUrl} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}
