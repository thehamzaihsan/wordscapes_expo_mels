import { updateGuestAvatar, updateGuestName } from "@/hooks/guest-progress";
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
      const account = await GoogleSignin.signIn();
      const idToken = account?.data?.idToken ?? (account as any)?.idToken;
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
