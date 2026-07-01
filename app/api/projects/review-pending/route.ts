import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/review-pending
// Returns editor assignments where status = 'submitted' for the logged-in user's projects
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: assignments, error } = await supabase
    .from('editor_assignments')
    .select(`
      id, project_id, editor_id, assigned_by, status,
      raw_video_url, editor_video_url, feedback_message,
      assigned_at, updated_at,
      project:projects(id, title, video_url, prompt),
      editor:users!editor_assignments_editor_id_fkey(username, email)
    `)
    .eq('assigned_by', user.id)
    .eq('status', 'submitted')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assignments: assignments ?? [] });
}
