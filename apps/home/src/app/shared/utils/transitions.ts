/**
 * Helper function to do a safe view transition.
 *
 * This is just a wrapper around `document.startViewTransition`
 * to get rid of the boilerplate code needed to make this SSR safe.
 *
 * @param callback The callback to execute inside the view transition.
 *                 Will execute immediately if view transitions is not supported.
 */
export function doSafeTransition(callback: ViewTransitionUpdateCallback) {
  if (typeof window === 'undefined') {
    // No transition in SSR
    callback();
  }
  const doc = window.document;
  if ('startViewTransition' in doc) {
    doc.startViewTransition(callback);
  } else {
    callback();
  }
}
