import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/projects/[id]/send-to-editor
// Body: { editorIds: string[], rawVideoUrl: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const { editorIds, rawVideoUrl } = await req.json();

  if (!editorIds?.length || !rawVideoUrl) {
    return NextResponse.json({ error: 'editorIds and rawVideoUrl are required' }, { status: 400 });
  }

  // Verify the project belongs to this user
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Create one assignment per editor
  const assignments = (editorIds as string[]).map((editorId) => ({
    project_id: projectId,
    editor_id: editorId,
    assigned_by: user.id,
    status: 'pending',
    raw_video_url: rawVideoUrl,
  }));

  const { error: insertErr } = await supabase
    .from('editor_assignments')
    .insert(assignments);

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Update project editor_status
  await supabase
    .from('projects')
    .update({ editor_status: 'sent' })
    .eq('id', projectId)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
