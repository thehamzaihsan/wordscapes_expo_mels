import {
  clearAllLocalProgressForActiveUser,
  updateGuestAvatar,
  updateGuestName,
} from "@/hooks/guest-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { NativeModules, Platform } from "react-native";
import { remapGuestSnapshotToUser } from "./guestSnapshot";
import { isSupabaseEnabled, supabase } from "./supabase";
import { mutateLocalProfile, syncUser } from "./sync";

type GoogleSignInModule =
  typeof import("@react-native-google-signin/google-signin");

export interface AuthResult {
  ok: boolean;
  error?: string;
  emailConfirmationRequired?: boolean;
}

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let googleConfigured = false;
let googleModule: GoogleSignInModule | null | undefined;

async function loadGoogleSignInModule(): Promise<GoogleSignInModule | null> {
  if (Platform.OS === "web") return null;
  if (googleModule !== undefined) return googleModule;
  if (!(NativeModules as any)?.RNGoogleSignin) {
    console.warn(
      "[auth] RNGoogleSignin native module missing; using browser OAuth"
    );
    googleModule = null;
    return googleModule;
  }
  try {
    googleModule = await import("@react-native-google-signin/google-signin");
  } catch (error) {
    console.warn(
      "[auth] Google Sign-In native module unavailable, falling back to browser flow",
      error instanceof Error ? error.message : error
    );
    googleModule = null;
  }
  return googleModule;
}

async function prepareGoogleModule(): Promise<GoogleSignInModule | null> {
  const module = await loadGoogleSignInModule();
  if (!module) return null;
  if (googleConfigured) return module;
  if (!googleWebClientId) {
    console.warn(
      "[auth] Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; falling back to browser OAuth"
    );
    return module;
  }
  module.GoogleSignin.configure({
    scopes: ["profile", "email"],
    offlineAccess: true,
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId || undefined,
    forceCodeForRefreshToken: false,
  });
  googleConfigured = true;
  return module;
}

async function startSupabaseGoogleOAuth(
  skipBrowserRedirect: boolean
): Promise<AuthResult> {
  try {
    // Use the scheme defined in app.json (expo.expo.scheme) automatically.
    // Hardcoding a different scheme (previously "wordscapesexpo") caused redirect_uri mismatches.
    const redirectTo = Linking.createURL("/auth-callback");
    if (__DEV__) {
      console.log("[auth] Using redirect URI:", redirectTo);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect,
      },
    });
    if (error) return { ok: false, error: error.message };
    if (skipBrowserRedirect) {
      if (data?.url) {
        await Linking.openURL(data.url);
        return { ok: true };
      }
      return { ok: false, error: "No OAuth URL returned" };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Google auth failed" };
  }
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
  if (Platform.OS !== "web") {
    try {
      const module = await loadGoogleSignInModule();
      await module?.GoogleSignin?.signOut();
    } catch (googleError) {
      console.warn("[auth] Failed to sign out of Google", googleError);
    }
  }
  try {
    // Clear local per-user progress and fallback guest progress and the snapshot
    await clearAllLocalProgressForActiveUser();
    const { clearLocalSnapshot } = await import("./sync");
    await clearLocalSnapshot();
    
    // Clear user-specific settings like background selection
    await AsyncStorage.removeItem("selectedBackground");
    console.log("[auth] Cleared background selection on sign out");
  } catch (e) {
    console.warn("[auth] Failed to clear local data on sign out", e);
  }
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
  if (Platform.OS === "web") {
    return startSupabaseGoogleOAuth(false);
  }

  const nativeClientConfigured = !!googleWebClientId;
  let module: GoogleSignInModule | null = null;
  if (nativeClientConfigured) {
    module = await prepareGoogleModule();
  } else {
    await loadGoogleSignInModule();
    console.warn(
      "[auth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not set; defaulting to browser OAuth flow"
    );
  }

  if (module && nativeClientConfigured) {
    const { GoogleSignin, statusCodes: googleStatusCodes } = module;
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const account: any = await GoogleSignin.signIn();
      const idToken = account?.data?.idToken ?? account?.idToken;
      if (!idToken) {
        console.warn(
          "[auth] Google Sign-In returned no ID token; using browser OAuth fallback"
        );
      } else {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) {
          return { ok: false, error: error.message };
        }
        const user = data.user ?? data.session?.user;
        if (user) {
          console.info("[auth] signInWithGoogle success", { userId: user.id });
          await remapGuestSnapshotToUser(user.id);
          console.info("[auth] remapped snapshot after Google signin", {
            userId: user.id,
          });
          const meta = (user.user_metadata ?? {}) as Record<string, any>;
          const metaUsername =
            typeof meta?.username === "string" &&
            meta.username.trim().length > 0
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
              console.warn(
                "Failed to sync guest name from metadata (google)",
                identityErr
              );
            }
            await mutateLocalProfile((p) => {
              p.username = metaUsername;
              if (metaAvatar) p.avatar = metaAvatar;
            });
          }
          syncUser(user.id).catch((err) =>
            console.warn("[auth] syncUser after google signin failed", err)
          );
        }
        return { ok: true };
      }
    } catch (err: any) {
      if (err?.code === googleStatusCodes?.SIGN_IN_CANCELLED) {
        return { ok: false, error: "Google sign-in cancelled" };
      }
      if (err?.code === googleStatusCodes?.IN_PROGRESS) {
        return { ok: false, error: "Google sign-in already in progress" };
      }
      if (err?.code === googleStatusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, error: "Google Play Services unavailable" };
      }
      console.warn(
        "[auth] Native Google Sign-In failed, falling back to browser OAuth",
        err
      );
    }
  }

  return startSupabaseGoogleOAuth(true);
}

// ================= OTP helpers (email code) =================
// Signup flow with OTP:
// 1) sendSignupOtp -> store pending signup locally and send code to email
// 2) verifySignupOtp -> verify code, set password + metadata, sync user
// Password reset flow with OTP:
// 1) sendPasswordResetOtp -> send code to email
// 2) verifyPasswordResetOtp -> verify code, creates session
// 3) updatePassword -> update password for the authed user

const PENDING_SIGNUP_PREFIX = "@pendingSignup:";

export async function sendSignupOtp(params: {
  email: string;
  password: string;
  username: string;
  avatar?: string;
}): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  const email = params.email.trim().toLowerCase();
  const avatar = params.avatar || "🛡️";
  try {
    console.info("[auth] sendSignupOtp ->", { email });
    await AsyncStorage.setItem(
      `${PENDING_SIGNUP_PREFIX}${email}`,
      JSON.stringify({
        email,
        password: params.password,
        username: params.username.trim(),
        avatar,
        ts: Date.now(),
      })
    );
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to send OTP" };
  }
}

export async function verifySignupOtp(params: {
  email: string;
  token: string;
}): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  const email = params.email.trim().toLowerCase();
  try {
    // For signup OTP the correct type is usually 'signup'.
    let data: any | null = null;
    let error: any | null = null;
    const attempt1 = await supabase.auth.verifyOtp({
      email,
      token: params.token.trim(),
      type: "signup",
    } as any);
    data = attempt1.data;
    error = attempt1.error;
    if (error) {
      // Fallback to 'email' in case project is configured differently
      const attempt2 = await supabase.auth.verifyOtp({
        email,
        token: params.token.trim(),
        type: "email",
      } as any);
      data = attempt2.data;
      error = attempt2.error;
    }
    if (error) return { ok: false, error: error.message };
    const user = data?.user ?? data?.session?.user;
    if (!user) return { ok: false, error: "No user returned" };

    const raw = await AsyncStorage.getItem(`${PENDING_SIGNUP_PREFIX}${email}`);
    if (raw) {
      const pending = JSON.parse(raw) as {
        password: string;
        username: string;
        avatar?: string;
      };
      const upd = await supabase.auth.updateUser({
        password: pending.password,
        data: { username: pending.username, avatar: pending.avatar || "🛡️" },
      });
      if (upd.error) return { ok: false, error: upd.error.message };
      try {
        await updateGuestName(pending.username);
        if (pending.avatar) await updateGuestAvatar(pending.avatar);
      } catch {}
      
      // Remap guest data and sync user FIRST to create the snapshot
      await remapGuestSnapshotToUser(user.id);
      await syncUser(user.id).catch((err) =>
        console.warn("[auth] syncUser after signup otp verify failed", err)
      );
      
      // Now update the local profile with username/avatar
      await mutateLocalProfile((p) => {
        p.username = pending.username;
        if (pending.avatar) p.avatar = pending.avatar;
      });
      
      await AsyncStorage.removeItem(`${PENDING_SIGNUP_PREFIX}${email}`);
    } else {
      // No pending data, just sync the user
      await remapGuestSnapshotToUser(user.id);
      await syncUser(user.id).catch((err) =>
        console.warn("[auth] syncUser after signup otp verify failed", err)
      );
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to verify OTP" };
  }
}

export async function sendPasswordResetOtp(email: string): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    console.info("[auth] sendPasswordResetOtp (recovery) ->", { email });
    // Use recovery flow so Supabase sends the Recovery template (now OTP-based)
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase()
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to send OTP" };
  }
}

export async function verifyPasswordResetOtp(params: {
  email: string;
  token: string;
}): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: params.email.trim().toLowerCase(),
      token: params.token.trim(),
      type: "recovery",
    } as any);
    if (error) return { ok: false, error: error.message };
    const user = data?.user ?? data?.session?.user;
    if (!user) return { ok: false, error: "No user returned" };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to verify OTP" };
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update password" };
  }
}

// ----- Optional: Login via Magic Link or Email OTP -----
export async function sendLoginMagicLink(email: string): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    const redirectTo = Linking.createURL("/auth-callback");
    console.info("[auth] sendLoginMagicLink ->", { email, redirectTo });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to send magic link" };
  }
}

export async function sendLoginOtp(email: string): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    console.info("[auth] sendLoginOtp ->", { email });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to send OTP" };
  }
}

export async function verifyLoginOtp(params: {
  email: string;
  token: string;
}): Promise<AuthResult> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: params.email.trim().toLowerCase(),
      token: params.token.trim(),
      type: "email",
    } as any);
    if (error) return { ok: false, error: error.message };
    const user = data?.user ?? data?.session?.user;
    if (user) {
      await remapGuestSnapshotToUser(user.id);
      syncUser(user.id).catch((err) =>
        console.warn("[auth] syncUser after login otp verify failed", err)
      );
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to verify OTP" };
  }
}
