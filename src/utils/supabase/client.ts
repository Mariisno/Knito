import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info.tsx';

// Singleton Supabase client to avoid multiple instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          // Use localStorage for persistent sessions (stays logged in)
          storage: window.localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }
  return supabaseInstance;
}