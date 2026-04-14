/**
 * Tiny haptics helper. `navigator.vibrate()` is only supported in
 * Android Chromium-family browsers; everywhere else this silently
 * no-ops so call sites don't need feature detection.
 *
 * ## Pulse lengths
 *
 * `tap` was originally 15 ms but that's below the useful threshold on
 * most Android devices. The linear vibration motors in typical phones
 * need ~20–30 ms just to spin up, and several Chromium builds round
 * sub-20 ms pulses down to "no vibration". Bumping `tap` to 25 ms makes
 * it actually perceptible without being annoying.
 *
 * Patterns are kept short and respectful — vibration should be a
 * confirmation, not a nag. The user can disable it from the device
 * settings if they find it annoying.
 *
 * ## Gesture context matters
 *
 * Chrome on Android enforces the "user activation" rule from the
 * Vibration spec: `navigator.vibrate()` is silently dropped unless
 * the call happens during or immediately after a user-initiated
 * event handler (click, touchstart, keydown). Callers MUST invoke
 * these helpers synchronously from the click/touch handler itself
 * — not from inside React state updaters, microtasks, `setTimeout`,
 * or `runWithViewTransition` callbacks — otherwise the buzz is
 * dropped with no error.
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
  tap: () => safeVibrate(25),
  /** A slightly longer buzz — success, e.g. finishing a diagnose flow. */
  success: () => safeVibrate([30, 50, 30]),
  /** Double-buzz — warning, e.g. risk-level task confirmation. */
  warn: () => safeVibrate([20, 40, 20, 40, 20]),
  /** Stop any ongoing vibration. */
  stop: () => safeVibrate(0),
  /** True if the device supports `navigator.vibrate`. */
  get isSupported() {
    return (
      typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
    )
  },
}
