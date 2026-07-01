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

// GET /api/workspace-admin/keys — return current API keys for workspace
export async function GET() {
  const auth = await verifyWorkspaceAdmin();
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('workspace_api_keys')
    .select('nvidia_key, elevenlabs_key, heygen_key, submagic_key')
    .eq('workspace_id', auth.workspaceId)
    .single();

  return NextResponse.json({ keys: data ?? { nvidia_key: '', elevenlabs_key: '', heygen_key: '', submagic_key: '' } });
}

// POST /api/workspace-admin/keys — upsert workspace API keys
export async function POST(req: NextRequest) {
  const auth = await verifyWorkspaceAdmin();
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { nvidia_key, elevenlabs_key, heygen_key, submagic_key } = await req.json();

  if (!nvidia_key || !elevenlabs_key || !heygen_key) {
    return NextResponse.json({ error: 'Nvidia, ElevenLabs, and HeyGen keys are required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('workspace_api_keys').upsert(
    { 
      workspace_id: auth.workspaceId, 
      nvidia_key, 
      elevenlabs_key, 
      heygen_key, 
      submagic_key,
      updated_at: new Date().toISOString() 
    },
    { onConflict: 'workspace_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
