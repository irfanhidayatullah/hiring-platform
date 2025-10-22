let _mpReady: Promise<{ Hands: any; Camera: any }> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export function ensureMediapipe() {
  if (_mpReady) return _mpReady;
  _mpReady = (async () => {
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
    const Hands = (window as any).Hands;
    const Camera = (window as any).Camera;
    if (!Hands || !Camera) throw new Error("Mediapipe not loaded");
    return { Hands, Camera };
  })();
  return _mpReady;
}
