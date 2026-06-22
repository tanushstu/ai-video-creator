'use client';

import { useState } from 'react';
import { Wand2, ChevronDown } from 'lucide-react';

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

const WORDS_PER_SECOND = 2.5; // ~150 wpm

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

  return (
    <div className="space-y-4">
      {/* Topic input */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Video Topic / Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
          placeholder="Describe your video topic in detail. E.g: 'The future of renewable energy and how solar panels will power entire cities by 2030...'"
          rows={5}
          className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-600">{prompt.length} chars</span>
          <div className="flex gap-2">
            {EXAMPLE_PROMPTS.slice(0, 2).map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                disabled={disabled}
                className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 rounded-lg px-2 py-1 transition-colors disabled:opacity-40"
              >
                Example {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Config row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Voice selection */}
        <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            ElevenLabs Voice
          </label>
          <div className="relative">
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={disabled}
              className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 pr-8"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
          {voiceId === 'custom' && (
            <input
              type="text"
              value={customVoiceId}
              onChange={(e) => setCustomVoiceId(e.target.value)}
              placeholder="Enter Voice ID"
              className="mt-2 w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          )}
        </div>

        {/* Avatar selection */}
        <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            HeyGen Avatar
          </label>
          <div className="relative">
            <select
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              disabled={disabled}
              className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 pr-8"
            >
              {AVATAR_OPTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
          {avatarId === 'custom' && (
            <input
              type="text"
              value={customAvatarId}
              onChange={(e) => setCustomAvatarId(e.target.value)}
              placeholder="Enter Avatar ID"
              className="mt-2 w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Duration selector */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
        <label className="block text-xs font-medium text-slate-400 mb-3">
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
            className="w-28 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 text-center"
          />
          <span className="text-xs text-slate-500">
            sec &nbsp;·&nbsp; ~{Math.round(durationSeconds * WORDS_PER_SECOND)} words
            {durationSeconds >= 60 && (
              <span className="ml-1 text-slate-600">
                ({Math.floor(durationSeconds / 60)}m{durationSeconds % 60 > 0 ? ` ${durationSeconds % 60}s` : ''})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() => onGenerate(prompt.trim(), resolvedVoiceId, resolvedAvatarId, durationSeconds)}
        disabled={!canGenerate}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none text-sm"
      >
        <Wand2 size={18} />
        {isRunning ? 'Generating...' : 'Generate Script'}
      </button>
    </div>
  );
}
