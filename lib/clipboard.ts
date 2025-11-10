import { Platform } from "react-native";

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      const nav: any = (globalThis as any).navigator;
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        return true;
      }
      // Fallback: create a temporary element
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    }
    // Native: use deprecated Clipboard API fallback if available
    const rnClipboard: any = (global as any).Clipboard || null;
    if (rnClipboard?.setString) {
      rnClipboard.setString(text);
      return true;
    }
    // Final fallback fails silently
    return false;
  } catch {
    return false;
  }
}
