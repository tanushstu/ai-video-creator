import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/projects/[id] — update a project (status, video_url, audio_url)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, script_text, audio_url, video_url } = body;

  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch.status = status;
  if (script_text !== undefined) patch.script_text = script_text;
  if (audio_url !== undefined) patch.audio_url = audio_url;
  if (video_url !== undefined) patch.video_url = video_url;

  const { error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
