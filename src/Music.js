/**
 * Music - plays your song (weddingData.music.src) on a loop. Browsers only allow sound after
 * a tap, so it starts with the "Open invitation" tap and the music button toggles it.
 *
 * Fades in and out where the browser allows volume changes (iPhones ignore volume, so there
 * it simply starts and stops - the song's own soft intro does the fading).
 */
export class Music {
  constructor({ src = '', volume = 1 } = {}) {
    this.src = src;
    this.volume = volume;
    this.playing = false;
    document.addEventListener('visibilitychange', () => this.onVisibility());
  }

  get available() {
    return Boolean(this.src);
  }

  /** Start downloading ahead of the tap (loading is allowed, playing isn't). */
  preload() {
    if (!this.src || this.el) return;
    this.el = new Audio(this.src);
    this.el.loop = true;
    this.el.preload = 'auto';
    this.el.volume = 0;
  }

  /** Must be called from a tap/click. Resolves to whether music is now playing. */
  toggle() {
    return this.playing ? Promise.resolve(this.stop()) : this.start();
  }

  start() {
    this.preload();
    if (!this.el) return Promise.resolve(false);
    this.playing = true;
    const played = this.el.play(); // synchronously, so Safari still sees the tap
    this.fade(this.volume, 1500);
    return Promise.resolve(played).then(
      () => true,
      () => {
        this.playing = false;
        return false;
      }
    );
  }

  stop() {
    this.playing = false;
    if (this.el) this.fade(0, 800, () => this.el.pause());
    return false;
  }

  fade(to, ms, done) {
    cancelAnimationFrame(this.raf);
    const el = this.el;
    const from = el.volume;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      el.volume = from + (to - from) * k;
      if (k < 1) this.raf = requestAnimationFrame(step);
      else done?.();
    };
    this.raf = requestAnimationFrame(step);
  }

  // Quiet while the invite is in a background tab; pick up again on return.
  onVisibility() {
    if (!this.el || !this.playing) return;
    if (document.hidden) this.el.pause();
    else this.el.play().catch(() => {});
  }
}
