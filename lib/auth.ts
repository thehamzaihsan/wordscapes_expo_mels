import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { remapGuestSnapshotToUser } from "./guestSnapshot";
import { isSupabaseEnabled, supabase } from "./supabase";
import { mutateLocalProfile, syncUser } from "./sync";

export interface AuthResult {
  ok: boolean;
  error?: string;
  emailConfirmationRequired?: boolean;
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
  
  try {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: "com.hexadevs.word://auth", // 👈 add this line
        data: {
          username: username,
          avatar: avatar || "🛡️",
        }
      }
    });
    
    if (error) return { ok: false, error: error.message };
    
    const user = data.user;
    if (!user) return { ok: false, error: "No user returned" };
    
    // Check if email confirmation is required
    if (!user.email_confirmed_at) {
      // User created but needs to confirm email
      return { ok: true, emailConfirmationRequired: true };
    }
    
    // If email is already confirmed (shouldn't happen on signup but just in case)
    await remapGuestSnapshotToUser(user.id);
    await mutateLocalProfile((p) => {
      p.username = username;
      if (avatar) p.avatar = avatar;
    });
    syncUser(user.id).catch(() => {});
    
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Signup failed" };
  }
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

export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to resend email" };
  }
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
