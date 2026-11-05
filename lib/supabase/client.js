import { createBrowserClient } from '@supabase/ssr';

let clientInstance = null;

/**
 * Creates or returns a singleton Supabase client for use in browser / client components.
 */
export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
    );
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
    );
  }

  return clientInstance;
}
