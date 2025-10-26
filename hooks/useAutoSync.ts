import { supabase } from "@/lib/supabase";
import { requestSync } from "@/lib/sync";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

/**
 * Lightweight auto-sync effect:
 * - On mount: attempts sync if logged in.
 * - On App foreground: throttled sync.
 * - On interval (5 min) while app active.
 */
export default function useAutoSync() {
  const lastSyncRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function attemptSync(reason: string) {
    try {
      const now = Date.now();
      // Throttle to at most once every 15s unless forced by interval
      if (reason !== "interval" && now - lastSyncRef.current < 15000) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      // Use the coordinated requestSync which will debounce/dedupe frequent
      // calls and avoid concurrent sync storms.
      await requestSync(uid);
      lastSyncRef.current = Date.now();
    } catch {
      // Silent; network may be offline
      // console.warn('AutoSync failed', reason, e);
    }
  }

  useEffect(() => {
    attemptSync("mount");

    function handleAppState(next: AppStateStatus) {
      if (next === "active") {
        attemptSync("foreground");
      }
    }
    const sub = AppState.addEventListener("change", handleAppState);

    // Web-specific listener for tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        attemptSync("visibilitychange");
      }
    };
    if (Platform.OS === "web") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    intervalRef.current = setInterval(
      () => attemptSync("interval"),
      5 * 60 * 1000
    );

    return () => {
      sub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (Platform.OS === "web") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };
  }, []);
}
