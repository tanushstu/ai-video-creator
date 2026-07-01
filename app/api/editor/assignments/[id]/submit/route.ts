import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/editor/assignments/[id]/submit
// Multipart form: video file uploaded by the editor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assignmentId } = await params;

  // Verify assignment belongs to this editor
  const { data: assignment, error: aErr } = await supabase
    .from('editor_assignments')
    .select('id, project_id, editor_id, status')
    .eq('id', assignmentId)
    .eq('editor_id', user.id)
    .single();

  if (aErr || !assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  // Parse uploaded file
  const formData = await req.formData();
  const file = formData.get('video') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() ?? 'mp4';
  const storagePath = `${assignmentId}/edited.${ext}`;

  // Upload to Supabase Storage using service role (bypasses RLS)
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from('editor-videos')
    .upload(storagePath, buffer, {
      contentType: file.type || 'video/mp4',
      upsert: true,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from('editor-videos')
    .getPublicUrl(storagePath);

  // Update assignment: editor_video_url + status = submitted
  const { error: updateErr } = await supabase
    .from('editor_assignments')
    .update({
      editor_video_url: publicUrl,
      status: 'submitted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('editor_id', user.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Update project editor_status so the user sees it in their dashboard
  await supabase
    .from('projects')
    .update({ editor_status: 'submitted' })
    .eq('id', assignment.project_id);

  return NextResponse.json({ ok: true, videoUrl: publicUrl });
}
