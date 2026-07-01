-- AI Vid Creator — Workspace System
-- Run in Supabase SQL Editor after 001 and 002

-- ── Workspaces ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspaces (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── Extend users ──────────────────────────────────────────────
-- Must run before any policy references users.workspace_id below.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- role column already exists (from 002); now also valid: 'workspace_admin' | 'super_admin'

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their workspace" ON public.workspaces;
CREATE POLICY "Members can view their workspace" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT workspace_id FROM public.users WHERE id = auth.uid())
  );

-- ── Per-workspace API keys ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_api_keys (
  workspace_id   uuid  PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nvidia_key     text,
  elevenlabs_key text,
  heygen_key     text,
  submagic_key   text,
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.workspace_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can read API keys" ON public.workspace_api_keys;
CREATE POLICY "Workspace members can read API keys" ON public.workspace_api_keys
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT workspace_id FROM public.users WHERE id = auth.uid())
  );

-- ── Mark the super admin ──────────────────────────────────────
UPDATE public.users SET role = 'super_admin' WHERE email = 'tanushmittal21@gmail.com';

-- ── Allow super_admin to read all users (for workspace member lists) ──
DROP POLICY IF EXISTS "Super admin can read all users" ON public.users;
CREATE POLICY "Super admin can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );

-- ── Workspace admins can read members of their workspace ──────
DROP POLICY IF EXISTS "Workspace admin can read workspace members" ON public.users;
CREATE POLICY "Workspace admin can read workspace members" ON public.users
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.users
      WHERE id = auth.uid() AND role = 'workspace_admin'
    )
  );
