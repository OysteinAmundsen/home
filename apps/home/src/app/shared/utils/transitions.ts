/**
 * A mock object to return from `doSafeTransition` in SSR
 * and other environments where view transitions are not supported.
 *
 * This is only to make sure that we always give a valid return object
 * back from this function.
 */
const viewTransitionMockReturnObject = {
  finished: Promise.resolve(undefined),
  ready: Promise.resolve(undefined),
  updateCallbackDone: Promise.resolve(undefined),
  skipTransition: () => ({}),
} as unknown as ViewTransition;

/**
 * Helper function to do a safe view transition.
 *
 * This is just a wrapper around `document.startViewTransition`
 * to get rid of the boilerplate code needed to make this SSR safe.
 *
 * @param callback The callback to execute inside the view transition.
 *                 Will execute immediately if view transitions is not supported.
 */
export function doSafeTransition(callback: () => void): ViewTransition {
  if (typeof window === 'undefined') {
    // No transition in SSR
    callback();
    return viewTransitionMockReturnObject;
  }
  const doc = window.document;
  if ('startViewTransition' in doc) {
    return doc.startViewTransition(callback);
  } else {
    callback();
    return viewTransitionMockReturnObject;
  }
}
