import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// DELETE /api/workspace-admin/members/[id] — remove a member from the workspace
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, workspace_id')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'workspace_admin' || !callerProfile.workspace_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: memberId } = await params;
  const admin = createAdminClient();

  // Verify the member belongs to this workspace
  const { data: member } = await admin
    .from('users')
    .select('id, workspace_id, role')
    .eq('id', memberId)
    .single();

  if (!member || member.workspace_id !== callerProfile.workspace_id || member.role === 'workspace_admin') {
    return NextResponse.json({ error: 'Member not found in your workspace' }, { status: 404 });
  }

  // Remove from workspace (nullify workspace_id)
  await admin.from('users').update({ workspace_id: null }).eq('id', memberId);

  return NextResponse.json({ ok: true });
}
