import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

const supabaseUrl = Config.SUPABASE_URL ?? 'https://example.supabase.co';
const supabaseAnonKey = Config.SUPABASE_ANON_KEY ?? 'missing-anon-key';

export const AUTH_SCHEME = 'myapp';
export const AUTH_LINK_PREFIX = `${AUTH_SCHEME}://`;
export const AUTH_REDIRECT_PATHS = {
  resetPassword: 'reset-password',
  setPassword: 'set-password',
} as const;

export function buildAuthRedirectUrl(path: keyof typeof AUTH_REDIRECT_PATHS) {
  return `${AUTH_LINK_PREFIX}${AUTH_REDIRECT_PATHS[path]}`;
}

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function ensureSupabaseEnv() {
  if (!Config.SUPABASE_URL || !Config.SUPABASE_ANON_KEY) {
    throw new Error(
      'Variables Supabase manquantes. Configurez SUPABASE_URL et SUPABASE_ANON_KEY dans .env.',
    );
  }
}
