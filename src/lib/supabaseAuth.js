// src/lib/supabaseAuth.js
import { supabase } from "../supabaseClient";

/**
 * Ensure a user row exists in `users` table (public.users) after auth.
 * For Supabase projects that use auth.users as primary, adapt as needed.
 */
export async function ensureUserProfile({ id, email = null, phone = null, full_name = null, role = "customer" }) {
  if (!id) return null;
  // try find existing
  const { data: exists } = await supabase.from("users").select("*").eq("id", id).limit(1).maybeSingle();
  if (exists) return exists;

  const payload = {
    id,
    email,
    phone,
    full_name,
    role,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("users").insert(payload).select().single();
  if (error) {
    console.warn("ensureUserProfile error:", error);
    return null;
  }
  return data;
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((event, session) => {
    cb(event, session);
  });
}
