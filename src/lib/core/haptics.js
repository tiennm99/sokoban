/**
 * Tiny wrapper around navigator.vibrate. Silent no-op where the API is
 * missing (iOS Safari, desktop) — callers don't need to feature-detect.
 */
export function pulse(ms) {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try {
        navigator.vibrate(ms);
    } catch {
        // Some embedded WebViews throw on vibrate; ignore.
    }
}
