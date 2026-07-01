import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ApiKeys {
  nvidia_key: string;
  elevenlabs_key: string;
  heygen_key: string;
  submagic_key?: string;
}

interface KeysOk { keys: ApiKeys; errorResponse: null }
interface KeysErr { keys: null; errorResponse: NextResponse }

export async function requireApiKeys(): Promise<KeysOk | KeysErr> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      keys: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized', service: 'Auth' },
        { status: 401 }
      ),
    };
  }

  // Get the user's workspace
  const { data: profile } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('id', user.id)
    .single();

  if (!profile?.workspace_id) {
    return {
      keys: null,
      errorResponse: NextResponse.json(
        { error: 'You are not assigned to a workspace. Please contact your administrator.', service: 'Config' },
        { status: 503 }
      ),
    };
  }

  const { data } = await supabase
    .from('workspace_api_keys')
    .select('nvidia_key, elevenlabs_key, heygen_key, submagic_key')
    .eq('workspace_id', profile.workspace_id)
    .single();

  if (!data?.nvidia_key || !data?.elevenlabs_key || !data?.heygen_key) {
    return {
      keys: null,
      errorResponse: NextResponse.json(
        { error: 'API keys not configured. Please contact your workspace administrator.', service: 'Config' },
        { status: 503 }
      ),
    };
  }

  return { keys: data as ApiKeys, errorResponse: null };
}
