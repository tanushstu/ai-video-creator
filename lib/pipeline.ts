import type { PipelineState, PipelineStep } from '@/types';

export function initialSteps(): PipelineStep[] {
  return [
    { id: 'script', label: 'Generate Script', status: 'pending' },
    { id: 'audio', label: 'Generate Audio', status: 'pending' },
    { id: 'upload', label: 'Upload Audio Asset', status: 'pending' },
    { id: 'video', label: 'Initialize Video', status: 'pending' },
    { id: 'poll', label: 'Process & Render Video', status: 'pending' },
    { id: 'submagic', label: 'Submagic AI Editing', status: 'pending' },
  ];
}

export function initialPipelineState(): PipelineState {
  return {
    status: 'idle',
    steps: initialSteps(),
  };
}

type StepUpdater = (updater: (prev: PipelineState) => PipelineState) => void;

function updateStep(setState: StepUpdater, stepId: string, patch: Partial<PipelineStep>) {
  setState((prev) => ({
    ...prev,
    steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
  }));
}

async function apiFetch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `Request to ${url} failed`);
    (err as Error & { service?: string }).service = data.service;
    throw err;
  }
  return data as T;
}

// Silently save project state — never throws so it can't break the pipeline
async function saveProject(body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.projectId ?? null;
  } catch {
    return null;
  }
}

async function updateProject(projectId: string, patch: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {
    // ignore — project save is best-effort
  }
}

// Phase 1: generate script only, then pause at 'script-ready'
export async function runScriptPhase(
  prompt: string,
  durationSeconds: number,
  setState: StepUpdater,
): Promise<void> {
  const startTime = Date.now();

  setState((prev) => ({
    ...prev,
    status: 'generating-script',
    startTime,
    steps: initialSteps(),
    script: undefined,
    audioUrl: undefined,
    videoUrl: undefined,
    videoId: undefined,
    projectId: undefined,
    error: undefined,
  }));

  updateStep(setState, 'script', { status: 'running', startTime: Date.now() });

  try {
    const res = await apiFetch<{ script: string }>('/api/generate-script', { prompt, durationSeconds });
    updateStep(setState, 'script', { status: 'completed', endTime: Date.now() });
    setState((prev) => ({ ...prev, script: res.script, status: 'script-ready' }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Script generation failed';
    updateStep(setState, 'script', { status: 'error', error: msg, endTime: Date.now() });
    setState((prev) => ({ ...prev, status: 'error', error: msg }));
  }
}

// Phase 2: audio + upload + video gen + poll — called after user reviews/edits script
export async function runMediaPhase(
  script: string,
  voiceId: string,
  avatarId: string,
  prompt: string,
  setState: StepUpdater,
  onComplete: (videoUrl: string, projectId: string | null) => void,
): Promise<void> {
  // Step 2: Audio
  setState((prev) => ({ ...prev, status: 'generating-audio' }));
  updateStep(setState, 'audio', { status: 'running', startTime: Date.now() });
  let audioBase64: string;
  try {
    const res = await apiFetch<{ audioBase64: string }>('/api/generate-audio', { script, voiceId });
    audioBase64 = res.audioBase64;
    updateStep(setState, 'audio', { status: 'completed', endTime: Date.now() });
    setState((prev) => ({ ...prev, audioUrl: `data:audio/mpeg;base64,${audioBase64}` }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Audio generation failed';
    updateStep(setState, 'audio', { status: 'error', error: msg, endTime: Date.now() });
    setState((prev) => ({ ...prev, status: 'error', error: msg }));
    return;
  }

  // Step 3: Upload audio to HeyGen
  setState((prev) => ({ ...prev, status: 'initializing-video' }));
  updateStep(setState, 'upload', { status: 'running', startTime: Date.now() });
  let audioAssetId: string;
  try {
    const res = await apiFetch<{ assetId: string }>('/api/upload-audio', { audioBase64 });
    audioAssetId = res.assetId;
    updateStep(setState, 'upload', { status: 'completed', endTime: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Audio upload failed';
    updateStep(setState, 'upload', { status: 'error', error: msg, endTime: Date.now() });
    setState((prev) => ({ ...prev, status: 'error', error: msg }));
    return;
  }

  // Step 4: Kick off HeyGen video generation
  updateStep(setState, 'video', { status: 'running', startTime: Date.now() });
  let videoId: string;
  try {
    const res = await apiFetch<{ videoId: string }>('/api/generate-video', { audioAssetId, avatarId, script });
    videoId = res.videoId;
    updateStep(setState, 'video', { status: 'completed', endTime: Date.now() });
    setState((prev) => ({ ...prev, videoId, status: 'processing-video' }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Video generation failed';
    updateStep(setState, 'video', { status: 'error', error: msg, endTime: Date.now() });
    setState((prev) => ({ ...prev, status: 'error', error: msg }));
    return;
  }

  // Save project record now that we have a videoId
  const projectId = await saveProject({
    title: prompt.substring(0, 80) || 'Untitled Project',
    status: 'script-ready',
    script_text: script,
    prompt,
    voice_id: voiceId,
    avatar_id: avatarId,
  });
  if (projectId) {
    setState((prev) => ({ ...prev, projectId }));
  }

  // Step 5: Poll for HeyGen completion
  updateStep(setState, 'poll', { status: 'running', startTime: Date.now() });
  let delay = 5000;
  const maxDelay = 30000;
  const maxAttempts = 60;
  let heyGenVideoUrl = '';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.4, maxDelay);

    try {
      const res = await apiFetch<{ status: string; videoUrl?: string; error?: string }>(
        '/api/poll-video',
        { videoId }
      );

      if (res.status === 'completed' && res.videoUrl) {
        updateStep(setState, 'poll', { status: 'completed', endTime: Date.now() });
        setState((prev) => ({ ...prev, status: 'heygen-completed', videoUrl: res.videoUrl, heygenVideoUrl: res.videoUrl }));
        if (projectId) {
          await updateProject(projectId, { status: 'heygen-completed', video_url: res.videoUrl });
        }
        onComplete(res.videoUrl, projectId);
        return;
      }

      if (res.status === 'failed') {
        const msg = `HeyGen video rendering failed: ${res.error || 'Unknown reason'}`;
        updateStep(setState, 'poll', { status: 'error', error: msg, endTime: Date.now() });
        setState((prev) => ({ ...prev, status: 'error', error: msg }));
        if (projectId) await updateProject(projectId, { status: 'error' });
        return;
      }
    } catch (err: unknown) {
      if (attempt === maxAttempts - 1) {
        const msg = err instanceof Error ? err.message : 'Polling timed out';
        updateStep(setState, 'poll', { status: 'error', error: msg, endTime: Date.now() });
        setState((prev) => ({ ...prev, status: 'error', error: msg }));
        if (projectId) await updateProject(projectId, { status: 'error' });
        return;
      }
    }
  }

  const msg = 'Video processing timed out after 10 minutes. Check HeyGen dashboard.';
  updateStep(setState, 'poll', { status: 'error', error: msg, endTime: Date.now() });
  setState((prev) => ({ ...prev, status: 'error', error: msg }));
  if (projectId) await updateProject(projectId, { status: 'error' });
}

export async function runSubmagicPhase(
  heyGenVideoUrl: string,
  prompt: string,
  projectId: string | null,
  submagicOptions: any,
  setState: StepUpdater,
  onComplete: (videoUrl: string) => void,
): Promise<void> {
  setState((prev) => ({ ...prev, status: 'processing-submagic' }));
  updateStep(setState, 'submagic', { status: 'running', startTime: Date.now() });
  
  let submagicId = '';
  try {
    const res = await apiFetch<{ projectId: string }>('/api/generate-submagic', { 
      videoUrl: heyGenVideoUrl,
      title: prompt.substring(0, 50),
      ...submagicOptions 
    });
    submagicId = res.projectId;
    setState((prev) => ({ ...prev, submagicId }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Submagic generation failed';
    updateStep(setState, 'submagic', { status: 'error', error: msg, endTime: Date.now() });
    setState((prev) => ({ ...prev, status: 'error', error: msg }));
    if (projectId) await updateProject(projectId, { status: 'error' });
    return;
  }

  // Step 7: Poll Submagic
  let delay = 5000;
  const maxDelay = 30000;
  const maxAttempts = 60;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.4, maxDelay);

    try {
      const res = await apiFetch<{ status: string; videoUrl?: string; error?: string }>(
        '/api/poll-submagic',
        { projectId: submagicId }
      );

      if (res.status === 'completed' && res.videoUrl) {
        updateStep(setState, 'submagic', { status: 'completed', endTime: Date.now() });
        setState((prev) => ({ ...prev, status: 'completed', videoUrl: res.videoUrl }));
        if (projectId) {
          await updateProject(projectId, { status: 'completed', video_url: res.videoUrl });
        }
        onComplete(res.videoUrl);
        return;
      }

      if (res.status === 'failed') {
        const msg = `Submagic rendering failed: ${res.error || 'Unknown reason'}`;
        updateStep(setState, 'submagic', { status: 'error', error: msg, endTime: Date.now() });
        setState((prev) => ({ ...prev, status: 'error', error: msg }));
        if (projectId) await updateProject(projectId, { status: 'error' });
        return;
      }
    } catch (err: unknown) {
      if (attempt === maxAttempts - 1) {
        const msg = err instanceof Error ? err.message : 'Submagic polling timed out';
        updateStep(setState, 'submagic', { status: 'error', error: msg, endTime: Date.now() });
        setState((prev) => ({ ...prev, status: 'error', error: msg }));
        if (projectId) await updateProject(projectId, { status: 'error' });
        return;
      }
    }
  }

  const msg = 'Submagic processing timed out after 10 minutes.';
  updateStep(setState, 'submagic', { status: 'error', error: msg, endTime: Date.now() });
  setState((prev) => ({ ...prev, status: 'error', error: msg }));
  if (projectId) await updateProject(projectId, { status: 'error' });
}
