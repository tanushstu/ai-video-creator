import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/projects/[id]/review
// Body: { action: 'approve' | 'revision', assignmentId: string, feedback?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const { action, assignmentId, feedback } = await req.json();

  if (!action || !assignmentId) {
    return NextResponse.json({ error: 'action and assignmentId are required' }, { status: 400 });
  }

  // Verify the project belongs to this user
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Verify the assignment belongs to this project
  const { data: assignment, error: aErr } = await supabase
    .from('editor_assignments')
    .select('id, status')
    .eq('id', assignmentId)
    .eq('project_id', projectId)
    .eq('assigned_by', user.id)
    .single();

  if (aErr || !assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (action === 'approve') {
    await supabase
      .from('editor_assignments')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', assignmentId);

    await supabase
      .from('projects')
      .update({ editor_status: 'approved' })
      .eq('id', projectId)
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true });
  }

  if (action === 'revision') {
    if (!feedback?.trim()) {
      return NextResponse.json({ error: 'Feedback message is required for revision requests' }, { status: 400 });
    }

    await supabase
      .from('editor_assignments')
      .update({
        status: 'revision_requested',
        feedback_message: feedback.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    await supabase
      .from('projects')
      .update({ editor_status: 'revision_requested' })
      .eq('id', projectId)
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
