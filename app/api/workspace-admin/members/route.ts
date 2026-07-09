import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyWorkspaceAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role, workspace_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'workspace_admin' || !profile.workspace_id) return null;
  return { user, workspaceId: profile.workspace_id as string };
}

// GET /api/workspace-admin/members — list members of the calling admin's workspace
export async function GET() {
  const auth = await verifyWorkspaceAdmin();
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from('users')
    .select('id, email, username, role, created_at')
    .eq('workspace_id', auth.workspaceId)
    .neq('role', 'workspace_admin')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ members: members ?? [] });
}

// POST /api/workspace-admin/members
// Body: { email, password, role: 'user' | 'editor' }
export async function POST(req: NextRequest) {
  const auth = await verifyWorkspaceAdmin();
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, password, role } = await req.json();

  if (!email?.trim() || !password || !['user', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'email, password, and role (user or editor) are required.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 500 });
  }

  const username = email.trim().split('@')[0];

  // Upsert into public.users with the workspace.
  // A DB trigger on auth.users may already have auto-created this row, so we
  // upsert on the primary key (id) to set the correct workspace/role/username
  // instead of failing on a duplicate-key error.
  const { error: insertErr } = await admin.from('users').upsert(
    {
      id: authData.user.id,
      email: email.trim(),
      username,
      role,
      workspace_id: auth.workspaceId,
    },
    { onConflict: 'id' },
  );

  if (insertErr) {
    // Roll back the auth user
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    member: { id: authData.user.id, email: email.trim(), username, role },
  }, { status: 201 });
}
