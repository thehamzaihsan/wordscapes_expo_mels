import { supabase, isSupabaseEnabled } from "./supabase";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { remapGuestSnapshotToUser } from "./guestSnapshot";
import { syncUser, mutateLocalProfile } from "./sync";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signUpEmailPassword(params: {
  email: string;
  password: string;
  username: string;
  avatar?: string;
}): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  const { email, password, username, avatar } = params;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  const user = data.user;
  if (!user) return { ok: false, error: "No user returned" };
  // Rely on database triggers to create profile & stats rows automatically.
  // Remap snapshot if guest
  await remapGuestSnapshotToUser(user.id);
  // Mutate local profile username/avatar if snapshot exists
  await mutateLocalProfile((p) => {
    p.username = username;
    if (avatar) p.avatar = avatar;
  });
  // Initial sync (fire & forget)
  syncUser(user.id).catch(() => {});
  return { ok: true };
}

export async function signInEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, error: error.message };
  const user = data.user;
  if (user) {
    await remapGuestSnapshotToUser(user.id);
    syncUser(user.id).catch(() => {});
  }
  return { ok: true };
}

export async function signOutSupabase(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL("/password-reset"),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    // Ensure explicit scheme (helps on Android sometimes)
    const redirectTo = Linking.createURL("/auth-callback", {
      scheme: Platform.select({ default: "wordscapesexpo" }),
    });
    // Use skipBrowserRedirect so we can manually open (reliable in Expo Go / dev)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { ok: false, error: error.message };
    if (data?.url) {
      // Manually open auth URL
      await Linking.openURL(data.url);
      return { ok: true };
    }
    return { ok: false, error: "No OAuth URL returned" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Google auth failed" };
  }
}
