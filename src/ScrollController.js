import { evaluate, TOTAL_UNITS, holdStart, holdLen, FRAMES } from './Storyboard.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

/**
 * ScrollController - turns native page scroll into film position.
 *
 * The page scrolls normally (no scroll hijacking, so iOS/Android momentum stays intact).
 * A requestAnimationFrame loop eases the film towards the scroll position, renders, and
 * goes idle as soon as everything has settled. Motion blur is derived from how fast the
 * camera is actually zooming, so a fast flick streaks and a pause is pin sharp.
 */
export class ScrollController {
  constructor({ engine, film, overlays = [], progressEl, reducedMotion = false, onRender }) {
    this.engine = engine;
    this.onRender = onRender;
    this.film = film;
    this.overlays = overlays;
    this.progressEl = progressEl;
    this.opts = { reducedMotion };

    this.u = 0;
    this.blur = 0;
    this.speed = 0;
    this.running = false;
    this.dirty = true;

    this.tick = this.tick.bind(this);
    this.measure();

    window.addEventListener('scroll', () => this.kick(), { passive: true });
    window.addEventListener('resize', () => {
      this.measure();
      this.invalidate();
    });
    // Watch the canvas itself: it can change size without a window resize (a scrollbar
    // appearing, mobile browser bars).
    const fit = () => {
      if (this.engine.resize()) {
        this.measure();
        this.invalidate();
      }
    };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(engine.canvas);
    else window.addEventListener('resize', fit);
    engine.onRestore = () => this.invalidate();
  }

  measure() {
    this.filmTop = this.film.offsetTop;
    this.filmScroll = Math.max(1, this.film.offsetHeight - window.innerHeight);
  }

  /** Force a redraw (new frame loaded, resize, context restored). */
  invalidate() {
    this.dirty = true;
    this.kick();
  }

  /** Never let the film run ahead of the photos that have actually loaded. */
  maxU() {
    const missing = FRAMES.findIndex((_, i) => !this.engine.hasFrame(i));
    if (missing === -1) return TOTAL_UNITS;
    if (missing === 0) return 0;
    return holdStart(missing - 1) + holdLen(missing - 1);
  }

  targetU() {
    const p = clamp((window.scrollY - this.filmTop) / this.filmScroll, 0, 1);
    return Math.min(p * TOTAL_UNITS, this.maxU());
  }

  /** Jump straight to the current scroll position (first paint). */
  snap() {
    this.u = this.targetU();
    this.invalidate();
  }

  kick() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  tick(now) {
    const dt = clamp((now - this.last) / 1000, 1 / 240, 0.05);
    this.last = now;

    const target = this.targetU();
    const prev = this.u;
    this.u += (target - this.u) * (1 - Math.exp(-dt / 0.085));
    if (Math.abs(target - this.u) < 2e-4) this.u = target;

    const { W, H } = this.engine;
    const state = evaluate(this.u, W, H, this.opts);

    if (this.u !== prev) {
      const before = evaluate(prev, W, H, this.opts);
      // Log-zoom per 60fps frame; reuse the last value across segment boundaries where the
      // reference photo changes.
      if (before.seg === state.seg) this.speed = (Math.abs(state.logZoom - before.logZoom) / dt) / 60;
    } else {
      this.speed = 0;
    }
    const blurTarget = this.opts.reducedMotion ? 0 : Math.min(0.17, this.speed * 2.6 + state.baseBlur);
    this.blur += (blurTarget - this.blur) * (1 - Math.exp(-dt / 0.07));

    const settled = this.u === target && Math.abs(this.blur - blurTarget) < 0.001;
    if (settled) this.blur = blurTarget;

    if (this.u !== prev || this.dirty || this.blur !== this.lastBlur) {
      this.engine.render(state, this.blur);
      this.updateOverlays(this.u);
      this.onRender?.(state);
      this.lastBlur = this.blur;
      this.dirty = false;
    }

    if (settled) {
      this.running = false;
      return;
    }
    requestAnimationFrame(this.tick);
  }

  updateOverlays(u) {
    if (this.progressEl) {
      this.progressEl.style.transform = `scaleX(${(u / TOTAL_UNITS).toFixed(4)})`;
    }
    for (const o of this.overlays) {
      const enter = o.in ? smooth(o.in[0], o.in[1], u) : 1;
      const exit = o.out ? smooth(o.out[0], o.out[1], u) : 0;
      const a = enter * (1 - exit);
      const rounded = Math.round(a * 1000) / 1000;
      if (rounded === o.last) continue;
      o.last = rounded;
      o.el.style.opacity = rounded;
      o.el.style.visibility = rounded > 0 ? 'visible' : 'hidden';
      // Text drifts up slightly as it arrives and leaves, tied to the scroll.
      o.el.style.setProperty('--drift', `${((1 - enter) * 18 - exit * 18).toFixed(2)}px`);
      o.el.style.setProperty('--in', enter.toFixed(3));
    }
  }
}
