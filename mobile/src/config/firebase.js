// src/config/firebase.js
// Deprecated Firebase compatibility file intentionally left minimal.
// Mobile screens use Supabase directly via src/config/supabase.js.
import { supabase } from './supabase';

export { supabase };

export const getCurrentSupabaseUser = async () => {
  const { data: { session } = {}, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user ?? null;
};

export const getUserProfile = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const saveUserProfile = async (userId, payload) => {
  const { error } = await supabase.from('users').upsert([{ id: userId, ...payload }], { onConflict: 'id' });
  if (error) throw error;
};

export const signOutCurrentUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export default supabase;