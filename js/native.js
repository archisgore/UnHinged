// Native (Capacitor) integration with graceful web fallback.
//
// No bundler needed: inside the native shell, Capacitor injects `window.Capacitor`
// and its plugins. On the web this all no-ops to the standard Web APIs, so the
// exact same code runs as a PWA and as native iOS/Android.

const Cap = typeof window !== "undefined" ? window.Capacitor : undefined;
const plugin = (name) => (Cap && Cap.Plugins ? Cap.Plugins[name] : undefined);

export const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

// Share via the native sheet (Capacitor) → Web Share → false (caller falls back).
export async function share(data) {
  try {
    const Share = plugin("Share");
    if (isNative && Share) { await Share.share({ title: data.title, text: data.text, url: data.url }); return true; }
    if (navigator.share) { await navigator.share(data); return true; }
  } catch { return true; } // user cancelled counts as handled
  return false;
}

// Haptics via Capacitor → navigator.vibrate.
export function haptic(pattern) {
  try {
    const Haptics = plugin("Haptics");
    if (isNative && Haptics) {
      const heavy = Array.isArray(pattern) && pattern.length > 1;
      Haptics.impact({ style: heavy ? "Heavy" : "Light" });
      return;
    }
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* haptics are best-effort */ }
}

// Tidy the native chrome once the app is up (status bar + hide splash).
export function initNativeChrome() {
  if (!isNative) return;
  try { plugin("StatusBar")?.setStyle({ style: "Light" }); } catch {}
  try { plugin("SplashScreen")?.hide(); } catch {}
}
