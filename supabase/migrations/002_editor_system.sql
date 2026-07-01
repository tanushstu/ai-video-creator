-- AI Vid Creator — Editor System
-- Run in Supabase SQL Editor after 001_initial.sql

-- ── Extend users ──────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Derive usernames for existing users (part before @)
UPDATE public.users SET username = split_part(email, '@', 1) WHERE username IS NULL;

-- ── Extend projects ───────────────────────────────────────────
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS editor_status text NOT NULL DEFAULT 'none';
-- 'none' | 'sent' | 'submitted' | 'approved' | 'revision_requested'

-- ── Editor Assignments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.editor_assignments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  editor_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status         text        NOT NULL DEFAULT 'pending',
  -- 'pending' | 'submitted' | 'approved' | 'revision_requested'
  raw_video_url  text,
  editor_video_url text,
  feedback_message text,
  assigned_at    timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.editor_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editors can view their assignments" ON public.editor_assignments;
CREATE POLICY "Editors can view their assignments" ON public.editor_assignments
  FOR SELECT USING (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can view their project assignments" ON public.editor_assignments;
CREATE POLICY "Users can view their project assignments" ON public.editor_assignments
  FOR SELECT USING (auth.uid() = assigned_by);

DROP POLICY IF EXISTS "Users can create assignments" ON public.editor_assignments;
CREATE POLICY "Users can create assignments" ON public.editor_assignments
  FOR INSERT WITH CHECK (auth.uid() = assigned_by);

DROP POLICY IF EXISTS "Editors can update their assignments" ON public.editor_assignments;
CREATE POLICY "Editors can update their assignments" ON public.editor_assignments
  FOR UPDATE USING (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can update their project assignments" ON public.editor_assignments;
CREATE POLICY "Users can update their project assignments" ON public.editor_assignments
  FOR UPDATE USING (auth.uid() = assigned_by);

-- Editors need to read project data (video URL, title) for assigned projects
DROP POLICY IF EXISTS "Editors can view assigned projects" ON public.projects;
CREATE POLICY "Editors can view assigned projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.editor_assignments ea
      WHERE ea.project_id = id AND ea.editor_id = auth.uid()
    )
  );

-- Allow authenticated users to see editor profiles (username) for the dropdown
DROP POLICY IF EXISTS "Authenticated can read editor profiles" ON public.users;
CREATE POLICY "Authenticated can read editor profiles" ON public.users
  FOR SELECT TO authenticated
  USING (role = 'editor');

-- Allow users to update their own profile (needed so signup can set the role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ── Supabase Storage — editor-videos bucket ───────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('editor-videos', 'editor-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can upload editor videos" ON storage.objects;
CREATE POLICY "Authenticated can upload editor videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'editor-videos');

DROP POLICY IF EXISTS "Anyone can view editor videos" ON storage.objects;
CREATE POLICY "Anyone can view editor videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'editor-videos');

DROP POLICY IF EXISTS "Authenticated can update editor videos" ON storage.objects;
CREATE POLICY "Authenticated can update editor videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'editor-videos');
