'use client';

import { useState } from 'react';

const VOICE_OPTIONS = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Female, American)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Female, American)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, American)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Male, American)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Female, American)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Male, American)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Male, American)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, American)' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (Male, American)' },
  { id: 'custom', name: 'Custom Voice ID...' },
];

const AVATAR_OPTIONS = [
  { id: 'Anna_public_3_20240108', name: 'Anna (Professional Female)' },
  { id: 'josh_lite3_20230714', name: 'Josh (Casual Male)' },
  { id: 'Wayne_20240711', name: 'Wayne (Business Male)' },
  { id: 'Lily_public_3_20240108', name: 'Lily (Young Female)' },
  { id: 'custom', name: 'Custom Avatar ID...' },
];

const WORDS_PER_SECOND = 2.5;

const EXAMPLE_PROMPTS = [
  'The future of AI in everyday life and how it will transform how we work',
  '5 productivity habits that high performers use every morning',
  'Why electric vehicles are about to change the automotive industry forever',
  'How to build a personal brand on social media in 2025',
];

interface Props {
  onGenerate: (prompt: string, voiceId: string, avatarId: string, durationSeconds: number) => void;
  isRunning: boolean;
  disabled: boolean;
}

export default function InputWorkspace({ onGenerate, isRunning, disabled }: Props) {
  const [prompt, setPrompt] = useState('');
  const [voiceId, setVoiceId] = useState(VOICE_OPTIONS[0].id);
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [avatarId, setAvatarId] = useState(AVATAR_OPTIONS[0].id);
  const [customAvatarId, setCustomAvatarId] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(60);

  const resolvedVoiceId = voiceId === 'custom' ? customVoiceId : voiceId;
  const resolvedAvatarId = avatarId === 'custom' ? customAvatarId : avatarId;

  const canGenerate =
    prompt.trim().length > 10 &&
    resolvedVoiceId.length > 5 &&
    resolvedAvatarId.length > 5 &&
    !disabled;

  const inputClass =
    'w-full bg-[#f1f4f2] border-2 border-transparent focus:border-[#002c17] focus:bg-white rounded-lg p-3 text-base text-[#181c1b] transition-colors placeholder:text-[#717972] outline-none disabled:opacity-50';

  const selectClass =
    'w-full bg-[#f1f4f2] border border-[#c0c9c0] rounded-lg px-3 py-2.5 text-sm text-[#181c1b] appearance-none focus:outline-none focus:border-[#002c17] transition-colors disabled:opacity-50 pr-8';

  return (
    <div className="space-y-4">
      {/* Topic input */}
      <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#002c17]">edit_document</span>
          <h3
            className="text-2xl font-semibold text-[#002c17]"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            Phase 1: Concept to Script
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#414942]" htmlFor="topic-input">
            What is your video about?
          </label>
          <textarea
            id="topic-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={disabled}
            placeholder="e.g., A 60-second explainer video about the benefits of renewable energy, aimed at small business owners. Tone should be professional but optimistic."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#717972]">{prompt.length} chars</span>
          <div className="flex gap-2">
            {EXAMPLE_PROMPTS.slice(0, 2).map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                disabled={disabled}
                className="text-xs text-[#35684a] hover:text-[#002c17] border border-[#35684a]/30 hover:border-[#002c17]/50 rounded-full px-3 py-1 transition-colors disabled:opacity-40"
              >
                Example {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Config row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Voice */}
        <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-4">
          <label className="block text-xs font-semibold text-[#414942] mb-2 uppercase tracking-wider">
            ElevenLabs Voice
          </label>
          <div className="relative">
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={disabled}
              className={selectClass}
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#717972] pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
          {voiceId === 'custom' && (
            <input
              type="text"
              value={customVoiceId}
              onChange={(e) => setCustomVoiceId(e.target.value)}
              placeholder="Enter Voice ID"
              className="mt-2 w-full bg-[#f1f4f2] border border-[#c0c9c0] rounded-lg px-3 py-2 text-sm text-[#181c1b] placeholder-[#717972] focus:outline-none focus:border-[#002c17] transition-colors"
            />
          )}
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-4">
          <label className="block text-xs font-semibold text-[#414942] mb-2 uppercase tracking-wider">
            HeyGen Avatar
          </label>
          <div className="relative">
            <select
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              disabled={disabled}
              className={selectClass}
            >
              {AVATAR_OPTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#717972] pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
          {avatarId === 'custom' && (
            <input
              type="text"
              value={customAvatarId}
              onChange={(e) => setCustomAvatarId(e.target.value)}
              placeholder="Enter Avatar ID"
              className="mt-2 w-full bg-[#f1f4f2] border border-[#c0c9c0] rounded-lg px-3 py-2 text-sm text-[#181c1b] placeholder-[#717972] focus:outline-none focus:border-[#002c17] transition-colors"
            />
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-4">
        <label className="block text-xs font-semibold text-[#414942] mb-3 uppercase tracking-wider">
          Video Duration (seconds)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={10}
            value={durationSeconds}
            onChange={(e) => {
              const v = Math.max(10, parseInt(e.target.value, 10) || 10);
              setDurationSeconds(v);
            }}
            disabled={disabled}
            className="w-28 bg-[#f1f4f2] border border-[#c0c9c0] rounded-lg px-3 py-2 text-sm text-[#181c1b] focus:outline-none focus:border-[#002c17] transition-colors disabled:opacity-50 text-center"
          />
          <span className="text-xs text-[#414942]">
            sec &nbsp;·&nbsp; ~{Math.round(durationSeconds * WORDS_PER_SECOND)} words
            {durationSeconds >= 60 && (
              <span className="ml-1 text-[#717972]">
                ({Math.floor(durationSeconds / 60)}m
                {durationSeconds % 60 > 0 ? ` ${durationSeconds % 60}s` : ''})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() => onGenerate(prompt.trim(), resolvedVoiceId, resolvedAvatarId, durationSeconds)}
        disabled={!canGenerate}
        className="w-full bg-[#002c17] text-white font-semibold py-3.5 rounded-full hover:bg-[#35684a] disabled:bg-[#e0e3e1] disabled:text-[#717972] transition-colors inset-shadow-active flex items-center justify-center gap-2 shadow-sm"
      >
        {isRunning ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            Generate Script
          </>
        )}
      </button>
    </div>
  );
}
