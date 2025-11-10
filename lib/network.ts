import { Platform } from "react-native";

/**
 * Robust connectivity check without extra deps.
 * - Web: trust navigator.onLine (avoids CORS false negatives)
 * - Native: try a couple of generate_204 endpoints + Supabase health with a timeout
 */
export async function checkOnline(timeoutMs: number = 2500): Promise<boolean> {
  // Web: avoid CORS-based false negatives. If the browser says we're online, accept it.
  if (Platform.OS === "web") {
    const nav: any = (globalThis as any).navigator;
    if (typeof nav?.onLine === "boolean") return !!nav.onLine;
    // If unknown, assume online to avoid blocking UX.
    return true;
  }

  // Native: perform a fast GET to well-known tiny endpoints with timeout
  const urls: string[] = [];
  // Prefer Google 204 endpoints (tiny payload)
  urls.push("https://www.google.com/generate_204");
  urls.push("https://httpstat.us/204");
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    urls.push(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`);
  }

  for (const url of urls) {
    const ok = await tryFetch(url, timeoutMs);
    if (ok) return true;
  }
  return false;
}

async function tryFetch(url: string, timeoutMs: number): Promise<boolean> {
  try {
    // RN fetch supports AbortController on modern versions; degrade gracefully if not.
    const controller =
      typeof AbortController !== "undefined"
        ? new AbortController()
        : (undefined as any);
    const timer = setTimeout(() => controller?.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      // no-cors is not applicable in RN; on web we don't call this path.
      signal: controller?.signal,
    } as any);
    clearTimeout(timer);
    return (
      !!res && (res.status === 204 || (res.status >= 200 && res.status < 500))
    );
  } catch {
    return false;
  }
}
