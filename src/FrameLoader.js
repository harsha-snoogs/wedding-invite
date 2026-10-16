/**
 * FrameLoader - loads the film's photos in story order.
 *
 * Uses AVIF when the browser supports it (about a fifth of the size of the JPEGs), falls
 * back to JPEG otherwise. Each image is fully decoded off the main thread before it's
 * handed over, so the first time it's drawn there's no decode stall.
 */

// 2x2 AVIF used only to test for support.
const AVIF_PROBE = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAE1pUHJhdmlmbWlhZm1pZjEAAAFebWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAAOcGl0bQAAAAAAAQAAADhpaW5mAAAAAAACAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAFWluZmUCAAABAAIAAEV4aWYAAAAAGmlyZWYAAAAAAAAADmNkc2MAAgABAAEAAACBaXBycAAAAGBpcGNvAAAAE2NvbHJuY2x4AAIAAgAGgAAAAAxjbGxpAMsAQAAAABRpc3BlAAAAAAAAAAIAAAACAAAACWlyb3QAAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABlpcG1hAAAAAAAAAAEAAQaBAgMFhoQAAAAsaWxvYwAAAABEAAACAAEAAAABAAAB3AAAACsAAgAAAAEAAAGOAAAATgAAAAFtZGF0AAAAAAAAAIkAAAAGRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAqADAAQAAAABAAAAAgAAAAASAAoMAAAAAAZ//AgQEDQgMhkQAZIACCCCIAE47tM254GtvzFMnuEJ3QH0';

function supportsAvif() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0);
    img.onerror = () => resolve(false);
    img.src = AVIF_PROBE;
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // Pre-decode off the main thread where possible. Browsers defer decode() in background
      // tabs (sometimes rejecting it much later), so it must never block or fail the load -
      // the GPU upload will decode synchronously if it has to.
      if (!img.decode || document.visibilityState === 'hidden') return resolve(img);
      const done = () => resolve(img);
      Promise.race([img.decode(), new Promise((r) => setTimeout(r, 1500))]).then(done, done);
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * @param frames      storyboard frames ({ avif, jpg })
 * @param onFrame     (index, HTMLImageElement) as each one becomes ready
 * @param firstCount  how many frames the intro needs before the loader can lift
 * @returns {{ ready: Promise<void>, done: Promise<void> }}
 */
export function loadFrames(frames, { onFrame, onProgress, firstCount = 2, concurrency = 3 }) {
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));
  let firstLoaded = 0;

  const done = supportsAvif().then((avif) => {
    let next = 0;
    const worker = async () => {
      while (next < frames.length) {
        const i = next++;
        const f = frames[i];
        let img;
        try {
          img = await loadImage(avif ? f.avif : f.jpg);
        } catch {
          img = await loadImage(f.jpg).catch(() => null);
        }
        if (img) onFrame(i, img);
        if (i < firstCount) {
          firstLoaded++;
          onProgress?.(firstLoaded / firstCount);
          if (firstLoaded === firstCount) resolveReady();
        }
      }
    };
    return Promise.all(Array.from({ length: concurrency }, worker));
  });

  return { ready, done };
}
