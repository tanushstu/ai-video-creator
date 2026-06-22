import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

// GET /api/admin/keys — return current API keys (values are returned masked to admin for display)
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin.from('api_keys').select('nvidia_key, elevenlabs_key, heygen_key').single();

  return NextResponse.json({ keys: data ?? { nvidia_key: '', elevenlabs_key: '', heygen_key: '' } });
}

// POST /api/admin/keys — upsert global API keys
export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { nvidia_key, elevenlabs_key, heygen_key } = await req.json();

  if (!nvidia_key || !elevenlabs_key || !heygen_key) {
    return NextResponse.json({ error: 'All three API keys are required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('api_keys').upsert(
    { id: 1, nvidia_key, elevenlabs_key, heygen_key, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
