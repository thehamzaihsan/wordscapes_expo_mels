import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AuthState {
  session: import("@supabase/supabase-js").Session | null;
  user: import("@supabase/supabase-js").User | null;
  loading: boolean;
  error?: string | null;
}

export function useSupabaseAuth(): AuthState {
  const [session, setSession] = useState<AuthState["session"]>(null);
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session ?? null);
        setUser(session?.user ?? null);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load session");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (
        event: string,
        session: import("@supabase/supabase-js").Session | null
      ) => {
        setSession(session ?? null);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading, error };
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
