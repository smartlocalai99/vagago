import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { thumbPath } from './image';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'vagago-admin-auth' } },
);

export function photoUrl(path: string) {
  return supabase.storage.from('property-photos').getPublicUrl(path).data.publicUrl;
}

export const thumbUrl = (path: string) => photoUrl(thumbPath(path));
