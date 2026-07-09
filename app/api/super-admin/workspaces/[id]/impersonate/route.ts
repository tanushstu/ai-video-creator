import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/super-admin/workspaces/[id]/impersonate
// Generates a magic link to log in as the workspace admin
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: callerProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (callerProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: workspaceId } = await params;
  const admin = createAdminClient();

  // Find the workspace admin for this workspace
  const { data: wsAdmin } = await admin
    .from('users')
    .select('email')
    .eq('workspace_id', workspaceId)
    .eq('role', 'workspace_admin')
    .single();

  if (!wsAdmin?.email) {
    return NextResponse.json({ error: 'No workspace admin found for this workspace' }, { status: 404 });
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: wsAdmin.email,
    options: { redirectTo: `${req.nextUrl.origin}/workspace-admin` },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const link = `${req.nextUrl.origin}/api/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/workspace-admin`;

  return NextResponse.json({ link });
}
