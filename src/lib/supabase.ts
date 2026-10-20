import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — running in device-only mode.');
}
