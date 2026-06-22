export interface Credentials {
  nvidiaKey: string;
  elevenlabsKey: string;
  heygenKey: string;
}

export type PipelineStatus =
  | 'idle'
  | 'generating-script'
  | 'script-ready'
  | 'generating-audio'
  | 'initializing-video'
  | 'processing-video'
  | 'completed'
  | 'error';

export interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface PipelineState {
  status: PipelineStatus;
  steps: PipelineStep[];
  script?: string;
  audioUrl?: string;
  videoUrl?: string;
  videoId?: string;
  projectId?: string;
  error?: string;
  startTime?: number;
}

export interface Project {
  id: string;
  title: string;
  status: string;
  video_url?: string;
  created_at: string;
}

export interface GenerateScriptRequest {
  prompt: string;
  durationSeconds?: number;
}

export interface GenerateAudioRequest {
  script: string;
  voiceId: string;
}

export interface GenerateVideoRequest {
  audioAssetId: string;
  avatarId: string;
  script: string;
}

export interface UploadAudioRequest {
  audioBase64: string;
}

export interface PollVideoRequest {
  videoId: string;
}
