import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use Expo public env vars (prefixed with EXPO_PUBLIC_) so they are accessible in the app bundle.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as
  | string
  | undefined;

let supabase: SupabaseClient;
let SUPABASE_DISABLED = false;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  SUPABASE_DISABLED = true;
  console.warn(
    "[supabase] Missing SUPABASE env vars. Create a .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. Falling back to disabled mock client."
  );
  // Provide a minimal mock so calls fail gracefully instead of throwing at import time.
  // Each method returns a rejected promise with an explanatory error.
  const errorMsg = () =>
    ({
      data: null,
      error: new Error(
        "Supabase disabled: missing EXPO_PUBLIC_SUPABASE_URL / ANON key"
      ),
      status: 400,
      statusText: "Bad Request",
    } as any);
  const mock: any = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => errorMsg(),
      signUp: async () => errorMsg(),
      signOut: async () => errorMsg(),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    },
    from() {
      return {
        select: () => Promise.resolve(errorMsg()),
        insert: () => Promise.resolve(errorMsg()),
        update: () => Promise.resolve(errorMsg()),
        eq: () => this,
        maybeSingle: () => Promise.resolve(errorMsg()),
        match: () => Promise.resolve(errorMsg()),
      } as any;
    },
  };
  // Assign mock to exported supabase variable
  supabase = mock;
} else {
  // Provide AsyncStorage so sessions (access/refresh tokens) persist across app launches on device.
  // This replaces the web localStorage mechanism in a React Native environment.
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // still useful for handling OAuth redirect URLs
      storage: AsyncStorage as any, // Supabase expects a StorageAdapter; AsyncStorage matches the shape
    },
  });
}

export { supabase };
export function isSupabaseEnabled() {
  return !SUPABASE_DISABLED;
}
