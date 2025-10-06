import { updateGuestAvatar, updateGuestName } from "@/hooks/guest-progress";
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
  const normalizedUsername = username.trim();
  const chosenAvatar = avatar || "🛡️";

  try {
    console.info("[auth] signUpEmailPassword start", {
      email,
    });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: normalizedUsername,
          avatar: chosenAvatar,
        },
      },
    });

    if (error) return { ok: false, error: error.message };

    const user = data.user;
    if (!user) return { ok: false, error: "No user returned" };

    console.info("[auth] signUpEmailPassword success", {
      userId: user.id,
      emailConfirmed: !!user.email_confirmed_at,
    });

    try {
      await updateGuestName(normalizedUsername);
      if (chosenAvatar) await updateGuestAvatar(chosenAvatar);
    } catch (identityErr) {
      console.warn("Failed to persist local guest identity", identityErr);
    }

    // Check if email confirmation is required
    if (!user.email_confirmed_at) {
      // User created but needs to confirm email
      return { ok: true, emailConfirmationRequired: true };
    }

    // If email is already confirmed (shouldn't happen on signup but just in case)
    await remapGuestSnapshotToUser(user.id);
    console.info("[auth] remapped snapshot after signup", { userId: user.id });
    await mutateLocalProfile((p) => {
      p.username = normalizedUsername;
      if (chosenAvatar) p.avatar = chosenAvatar;
    });
    syncUser(user.id).catch((err) =>
      console.warn("[auth] syncUser after signup failed", err)
    );

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
    console.info("[auth] signInEmailPassword success", {
      userId: user.id,
    });
    await remapGuestSnapshotToUser(user.id);
    console.info("[auth] remapped snapshot after signin", { userId: user.id });
    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    const metaUsername =
      typeof meta?.username === "string" && meta.username.trim().length > 0
        ? meta.username.trim()
        : null;
    const metaAvatar =
      typeof meta?.avatar === "string" && meta.avatar.trim().length > 0
        ? meta.avatar.trim()
        : null;
    if (metaUsername) {
      try {
        await updateGuestName(metaUsername);
      } catch (identityErr) {
        console.warn("Failed to sync guest name from metadata", identityErr);
      }
      await mutateLocalProfile((p) => {
        p.username = metaUsername;
        if (metaAvatar) p.avatar = metaAvatar;
      });
    }
    syncUser(user.id).catch((err) =>
      console.warn("[auth] syncUser after signin failed", err)
    );
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

export async function resendConfirmationEmail(
  email: string
): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
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
