import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ApiKeys {
  nvidia_key: string;
  elevenlabs_key: string;
  heygen_key: string;
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

  const { data } = await supabase.from('api_keys').select('*').single();

  if (!data?.nvidia_key || !data?.elevenlabs_key || !data?.heygen_key) {
    return {
      keys: null,
      errorResponse: NextResponse.json(
        { error: 'API keys not configured. Please contact the administrator.', service: 'Config' },
        { status: 503 }
      ),
    };
  }

  return { keys: data as ApiKeys, errorResponse: null };
}
