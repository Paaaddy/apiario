/**
 * Runs `update` inside `document.startViewTransition` if the browser
 * supports the View Transitions API. Otherwise just runs `update`
 * synchronously. Use for tab changes and any other large structural
 * DOM swap that benefits from a native cross-fade.
 *
 * Returns the result of `update` (or nothing if the transition
 * machinery runs it asynchronously).
 */
export function runWithViewTransition(update) {
  if (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function'
  ) {
    // Wrap and let the browser orchestrate the cross-fade.
    document.startViewTransition(() => update())
    return
  }
  update()
}
