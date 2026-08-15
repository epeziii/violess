import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://usjeipxsrpplsjmabvei.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3Drqr2HBt4dqV3jRrLvhqw_-nKuMyw8';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

const hasValidSupabaseConfig = () => {
  const urlLooksValid = /^https?:\/\/[^\s]+$/i.test(SUPABASE_URL);
  const keyLooksValid = typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('%%');
  return urlLooksValid && keyLooksValid;
};

if (!hasValidSupabaseConfig()) {
  console.warn('Supabase URL or anon key is missing/invalid. Mobile app may not be able to connect to Supabase.');
}

export const supabase = hasValidSupabaseConfig() ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export default supabase;
