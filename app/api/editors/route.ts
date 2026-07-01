import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/editors — list all users with role='editor' (for the send-to-editor dropdown)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current user's workspace
  const { data: profile } = await supabase.from('users').select('workspace_id').eq('id', user.id).single();
  if (!profile?.workspace_id) return NextResponse.json({ editors: [] });

  const admin = createAdminClient();
  const { data: editors, error } = await admin
    .from('users')
    .select('id, email, username, role')
    .eq('role', 'editor')
    .eq('workspace_id', profile.workspace_id)
    .order('username', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ editors: editors ?? [] });
}
