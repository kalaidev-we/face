import { createClient } from '@supabase/supabase-js';

export interface SupabaseCredentials {
  url: string;
  key: string;
}

/**
 * Retrieves the current Supabase configuration.
 * Prioritizes local storage settings (configured in the UI Settings page) 
 * over Vite environment variables.
 */
export const getSupabaseConfig = (): SupabaseCredentials => {
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  
  return {
    url: localUrl || (import.meta.env.VITE_SUPABASE_URL as string) || '',
    key: localKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  };
};

/**
 * Helper to check if credentials are set.
 */
export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!(url && url.trim() !== '' && key && key.trim() !== '');
};

let cachedClient: any = null;
let cachedUrl = '';
let cachedKey = '';

/**
 * Gets the Supabase client instance. Re-creates client if credentials change at runtime.
 */
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  const { url, key } = getSupabaseConfig();
  
  if (cachedClient && url === cachedUrl && key === cachedKey) {
    return cachedClient;
  }
  
  cachedUrl = url;
  cachedKey = key;
  
  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};
