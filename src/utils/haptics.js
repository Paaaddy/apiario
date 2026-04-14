/**
 * Tiny haptics helper. `navigator.vibrate()` is only supported in
 * Android Chromium-family browsers; everywhere else this silently
 * no-ops so call sites don't need feature detection.
 *
 * Patterns are kept short and respectful — vibration should be a
 * confirmation, not a nag. The user can disable it from the device
 * settings if they find it annoying.
 */
function safeVibrate(pattern) {
  try {
    if (typeof navigator === 'undefined') return false
    if (typeof navigator.vibrate !== 'function') return false
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

export const haptics = {
  /** A short, single buzz — confirmation (task checked, wizard step). */
  tap: () => safeVibrate(15),
  /** A slightly longer buzz — success, e.g. finishing a diagnose flow. */
  success: () => safeVibrate([20, 40, 20]),
  /** Double-buzz — warning, e.g. risk-level task confirmation. */
  warn: () => safeVibrate([10, 30, 10, 30, 10]),
  /** Stop any ongoing vibration. */
  stop: () => safeVibrate(0),
  /** True if the device supports `navigator.vibrate`. */
  isSupported:
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
}
