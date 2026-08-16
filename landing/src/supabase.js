import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://usjeipxsrpplsjmabvei.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3Drqr2HBt4dqV3jRrLvhqw_-nKuMyw8';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
