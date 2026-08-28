/**
 * Safely runs a state update inside document.startViewTransition if supported by the browser,
 * falling back to immediate execution otherwise.
 */
export function withViewTransition(updateFn: () => void): void {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(updateFn);
  } else {
    updateFn();
  }
}
