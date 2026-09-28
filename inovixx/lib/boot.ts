// The first-load handshake between the 3D scene and the loading screen.
//
// Module scope, deliberately outside React state: the scene reports in from an
// imperative canvas callback, the loading screen is a different branch of the
// tree, and neither should re-render the other to pass one boolean. It also
// means the flag survives a client-side route change, so the loading screen is
// never shown twice in one visit.

let ready = false;
const waiting = new Set<() => void>();

/** The scene has drawn its first frame (or there will never be one). */
export function markSceneReady() {
  if (ready) return;
  ready = true;
  for (const cb of waiting) cb();
  waiting.clear();
}

/** Calls back when the scene is ready, or immediately if it already is. */
export function whenSceneReady(cb: () => void): () => void {
  if (ready) {
    cb();
    return () => {};
  }
  waiting.add(cb);
  return () => {
    waiting.delete(cb);
  };
}
