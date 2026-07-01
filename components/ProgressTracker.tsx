'use client';

import { useEffect, useState } from 'react';
import type { PipelineState, PipelineStep } from '@/types';

interface Props {
  state: PipelineState;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StepIcon({ status }: { status: PipelineStep['status'] }) {
  if (status === 'completed') {
    return (
      <span
        className="material-symbols-outlined text-[20px] text-[#35684a] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        check_circle
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span
        className="material-symbols-outlined text-[20px] text-[#ba1a1a] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        cancel
      </span>
    );
  }
  if (status === 'running') {
    return (
      <div className="w-5 h-5 border-2 border-[#c0c9c0] border-t-[#002c17] rounded-full animate-spin shrink-0" />
    );
  }
  return (
    <span className="material-symbols-outlined text-[20px] text-[#c0c9c0] shrink-0">radio_button_unchecked</span>
  );
}

function ElapsedTimer({ startTime }: { startTime?: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => clearInterval(id);
  }, [startTime]);

  if (!startTime) return null;
  return (
    <span className="text-xs text-[#717972] flex items-center gap-1">
      <span className="material-symbols-outlined text-[12px]">schedule</span>
      {formatDuration(elapsed)}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  'generating-script': 'Writing Script...',
  'script-ready': 'Script Ready — Review & Edit',
  'generating-audio': 'Synthesizing Voice...',
  'initializing-video': 'Uploading & Initializing...',
  'processing-video': 'Rendering Video...',
  'heygen-completed': 'Raw Video Ready',
  'processing-submagic': 'Submagic Enhancing...',
  completed: 'Complete!',
  error: 'Pipeline Error',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-[#35684a]',
  error: 'text-[#ba1a1a]',
  'script-ready': 'text-[#4c6700]',
  'heygen-completed': 'text-[#4c6700]',
};

export default function ProgressTracker({ state }: Props) {
  const { steps, status, startTime, error } = state;
  const isActive =
    status !== 'idle' &&
    status !== 'script-ready' &&
    status !== 'heygen-completed' &&
    status !== 'completed' &&
    status !== 'error';

  return (
    <div className="bg-white rounded-[1.5rem] border border-[#c0c9c0] shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="font-semibold text-[#002c17] text-base"
            style={{ fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif" }}
          >
            Pipeline
          </h3>
          <p className={`text-xs mt-0.5 ${STATUS_COLORS[status] ?? 'text-[#002c17]'}`}>
            {STATUS_LABELS[status] || status}
          </p>
        </div>
        {isActive && startTime && (
          <div className="text-right">
            <p className="text-xs text-[#717972]">Total elapsed</p>
            <ElapsedTimer startTime={startTime} />
          </div>
        )}
        {status === 'completed' && startTime && (
          <div className="text-right">
            <p className="text-xs text-[#717972]">Completed in</p>
            <span className="text-xs text-[#35684a] font-medium">
              {formatDuration(Date.now() - startTime)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={step.id}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                step.status === 'running'
                  ? 'bg-[#f1f4f2] border border-[#002c17]/20'
                  : step.status === 'completed'
                  ? 'bg-[#b8efc9]/20'
                  : step.status === 'error'
                  ? 'bg-[#ffdad6] border border-[#ba1a1a]/20'
                  : 'opacity-40'
              }`}
            >
              <StepIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[#181c1b]">{step.label}</span>
                  {step.status === 'running' && <ElapsedTimer startTime={step.startTime} />}
                  {step.status === 'completed' && step.startTime && step.endTime && (
                    <span className="text-xs text-[#717972]">
                      {formatDuration(step.endTime - step.startTime)}
                    </span>
                  )}
                </div>
                {step.status === 'error' && step.error && (
                  <p className="text-xs text-[#ba1a1a] mt-1 truncate">{step.error}</p>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`ml-[22px] h-3 w-px transition-colors ${
                  steps[i + 1].status !== 'pending' ? 'bg-[#c0c9c0]' : 'bg-[#e0e3e1]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {status === 'error' && error && (
        <div className="mt-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl">
          <p className="text-xs font-semibold text-[#ba1a1a] mb-1">Error Details</p>
          <p className="text-xs text-[#93000a]">{error}</p>
        </div>
      )}
    </div>
  );
}
