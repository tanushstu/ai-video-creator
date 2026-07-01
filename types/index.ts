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
  | 'heygen-completed'
  | 'processing-submagic'
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
  heygenVideoUrl?: string;
  videoId?: string;
  projectId?: string;
  submagicId?: string;
  error?: string;
  startTime?: number;
}

export interface SubmagicOptions {
  templateName: string;
  dictionaryWords?: string;
  hookText?: string;
  hookTemplate?: string;
  musicUserMediaId?: string;
  musicVolume?: number;
}

export type UserRole = 'user' | 'editor' | 'workspace_admin' | 'super_admin';

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  admin_username?: string;
  admin_email?: string;
  member_count?: number;
}

export interface EditorUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface EditorAssignment {
  id: string;
  project_id: string;
  editor_id: string;
  assigned_by: string;
  status: 'pending' | 'submitted' | 'approved' | 'revision_requested';
  raw_video_url: string | null;
  editor_video_url: string | null;
  feedback_message: string | null;
  assigned_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    video_url: string | null;
    prompt: string | null;
  };
  editor?: {
    username: string;
    email: string;
  };
  assigned_by_user?: {
    username: string;
    email: string;
  };
}

export interface Project {
  id: string;
  title: string;
  status: string;
  editor_status: string;
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
