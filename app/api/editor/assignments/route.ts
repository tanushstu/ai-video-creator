import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/editor/assignments — returns all assignments for the currently logged-in editor
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the user is an editor
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'editor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: assignments, error } = await supabase
    .from('editor_assignments')
    .select(`
      id, project_id, editor_id, assigned_by, status,
      raw_video_url, editor_video_url, feedback_message,
      assigned_at, updated_at,
      project:projects(id, title, video_url, prompt),
      assigned_by_user:users!editor_assignments_assigned_by_fkey(username, email)
    `)
    .eq('editor_id', user.id)
    .order('assigned_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assignments: assignments ?? [] });
}
