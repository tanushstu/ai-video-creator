'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Clock, Circle } from 'lucide-react';
import type { PipelineState, PipelineStep } from '@/types';

interface Props {
  state: PipelineState;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function StepIcon({ status }: { status: PipelineStep['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
    case 'error':
      return <XCircle size={18} className="text-red-400 shrink-0" />;
    case 'running':
      return <Loader2 size={18} className="text-indigo-400 animate-spin shrink-0" />;
    default:
      return <Circle size={18} className="text-slate-600 shrink-0" />;
  }
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
    <span className="text-xs text-slate-500 flex items-center gap-1">
      <Clock size={10} />
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
  completed: 'Complete!',
  error: 'Pipeline Error',
};

export default function ProgressTracker({ state }: Props) {
  const { steps, status, startTime, error } = state;
  const isActive =
    status !== 'idle' &&
    status !== 'script-ready' &&
    status !== 'completed' &&
    status !== 'error';

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">Pipeline</h3>
          <p
            className={`text-xs mt-0.5 ${
              status === 'completed'
                ? 'text-emerald-400'
                : status === 'error'
                ? 'text-red-400'
                : status === 'script-ready'
                ? 'text-amber-400'
                : 'text-indigo-400'
            }`}
          >
            {STATUS_LABELS[status] || status}
          </p>
        </div>
        {isActive && startTime && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Total elapsed</p>
            <ElapsedTimer startTime={startTime} />
          </div>
        )}
        {status === 'completed' && startTime && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Completed in</p>
            <span className="text-xs text-emerald-400 font-medium">
              {formatDuration(Date.now() - startTime)}
            </span>
          </div>
        )}
      </div>

      {/* Step list */}
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={step.id}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                step.status === 'running'
                  ? 'bg-indigo-500/10 border border-indigo-500/20'
                  : step.status === 'completed'
                  ? 'bg-emerald-500/5'
                  : step.status === 'error'
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'opacity-50'
              }`}
            >
              <StepIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-200">{step.label}</span>
                  {step.status === 'running' && <ElapsedTimer startTime={step.startTime} />}
                  {step.status === 'completed' && step.startTime && step.endTime && (
                    <span className="text-xs text-slate-500">
                      {formatDuration(step.endTime - step.startTime)}
                    </span>
                  )}
                </div>
                {step.status === 'error' && step.error && (
                  <p className="text-xs text-red-400 mt-1 truncate">{step.error}</p>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`ml-[22px] h-3 w-px transition-colors ${
                  steps[i + 1].status !== 'pending' ? 'bg-white/20' : 'bg-white/5'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Global error message */}
      {status === 'error' && error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-xs font-medium text-red-400 mb-1">Error Details</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
