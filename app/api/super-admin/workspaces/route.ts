import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') return null;
  return user;
}

// GET /api/super-admin/workspaces — list all workspaces with admin info and member count
export async function GET() {
  const user = await verifySuperAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();

  const { data: workspaces, error } = await admin
    .from('workspaces')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich each workspace with admin info and member count
  const enriched = await Promise.all((workspaces ?? []).map(async (ws) => {
    const { data: members } = await admin
      .from('users')
      .select('id, email, username, role')
      .eq('workspace_id', ws.id);

    const adminMember = members?.find((m) => m.role === 'workspace_admin');
    const memberCount = members?.filter((m) => m.role !== 'workspace_admin').length ?? 0;

    return {
      ...ws,
      admin_username: adminMember?.username ?? adminMember?.email ?? '—',
      admin_email: adminMember?.email ?? null,
      member_count: memberCount,
    };
  }));

  return NextResponse.json({ workspaces: enriched });
}

// POST /api/super-admin/workspaces
// Body: { workspaceName, adminEmail, adminPassword }
// Creates: workspace row + auth user + public.users row (workspace_admin) + empty workspace_api_keys row
export async function POST(req: NextRequest) {
  const user = await verifySuperAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { workspaceName, adminEmail, adminPassword } = await req.json();

  if (!workspaceName?.trim() || !adminEmail?.trim() || !adminPassword) {
    return NextResponse.json({ error: 'workspaceName, adminEmail, and adminPassword are required.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Create workspace
  const { data: workspace, error: wsErr } = await admin
    .from('workspaces')
    .insert({ name: workspaceName.trim() })
    .select('id')
    .single();

  if (wsErr || !workspace) {
    return NextResponse.json({ error: wsErr?.message ?? 'Failed to create workspace' }, { status: 500 });
  }

  // 2. Create auth user for workspace admin
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: adminEmail.trim(),
    password: adminPassword,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    // Roll back workspace
    await admin.from('workspaces').delete().eq('id', workspace.id);
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create admin account' }, { status: 500 });
  }

  const adminUsername = adminEmail.trim().split('@')[0];

  // 3. Upsert into public.users — a row for this id may already exist (created
  // the instant the auth user was provisioned above), so a plain insert here
  // can silently fail on the primary-key conflict and leave the account stuck
  // with default role='user'/workspace_id=null. Upsert guarantees these fields
  // land correctly either way.
  const { error: profileErr } = await admin.from('users').upsert({
    id: authData.user.id,
    email: adminEmail.trim(),
    username: adminUsername,
    role: 'workspace_admin',
    workspace_id: workspace.id,
  }, { onConflict: 'id' });

  if (profileErr) {
    // Roll back the auth user and workspace so we don't leave a broken half-created account
    await admin.auth.admin.deleteUser(authData.user.id);
    await admin.from('workspaces').delete().eq('id', workspace.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // 4. Create empty workspace_api_keys row
  const { error: keysErr } = await admin.from('workspace_api_keys').insert({ workspace_id: workspace.id });
  if (keysErr) {
    return NextResponse.json({ error: keysErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, workspaceId: workspace.id }, { status: 201 });
}
