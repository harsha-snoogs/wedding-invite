/**
 * BrowserTint - keeps the phone browser's bars (status bar / notch area at the top, toolbar
 * area at the bottom) the same colour as the picture right next to them.
 *
 * Browsers tint those bars from the page: the theme-color meta tag, the page background, and
 * on newer iOS Safari, fixed elements touching the screen edges. Left alone they'd all say
 * "maroon" while the film shows golden light or a night sky. So we work out the colour at the
 * top and bottom edges of what's on screen and feed it to all three.
 *
 * Each photo gets a tiny colour map when it loads; picking the edge colour is then just a few
 * array lookups per frame.
 */

const COLS = 32;
const ROWS = 64;
const SHADE = [10, 8, 6]; // colour of the shading behind film text

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const hex = (c) =>
  '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v)) / 2) * 2).map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('');

export class BrowserTint {
  constructor({ bg, details }) {
    this.bg = bg; // full-page background colour (cover + invitation details), as [r, g, b]
    this.details = details;
    this.maps = [];
    this.film = { top: bg, bottom: bg };
    this.meta = document.querySelector('meta[name="theme-color"]');
    this.edgeTop = document.getElementById('edge-top');
    this.edgeBottom = document.getElementById('edge-bottom');
    this.last = '';

    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        this.apply();
      });
    }, { passive: true });
  }

  /** Build the colour map for a photo (an averaged COLS x ROWS thumbnail). */
  addFrame(i, img) {
    const c = document.createElement('canvas');
    c.width = COLS;
    c.height = ROWS;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, COLS, ROWS);
    this.maps[i] = ctx.getImageData(0, 0, COLS, ROWS).data;
  }

  /**
   * Colour of photo i at image coords (u, v), as the shader draws it: inside the photo a
   * plain sample; outside it (wide screens) the mirrored, warmed continuation.
   */
  sample(i, u, v) {
    const d = this.maps[i];
    if (!d) return null;
    const out = Math.max(-u, u - 1, -v, v - 1, 0);
    const mu = 1 - Math.abs(1 - (((u % 2) + 2) % 2));
    const mv = 1 - Math.abs(1 - (((v % 2) + 2) % 2));
    // Bilinear lookup between map cells, like the GPU's texture filtering.
    const fx = Math.min(COLS - 1, Math.max(0, mu * COLS - 0.5));
    const fy = Math.min(ROWS - 1, Math.max(0, mv * ROWS - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(COLS - 1, x0 + 1), y1 = Math.min(ROWS - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const px = (x, y) => {
      const k = (y * COLS + x) * 4;
      return [d[k], d[k + 1], d[k + 2]];
    };
    let c = mix(mix(px(x0, y0), px(x1, y0), tx), mix(px(x0, y1), px(x1, y1), tx), ty);
    if (out > 0) {
      const warm = mix([c[0] * 0.95, c[1] * 0.85, c[2] * 0.74], [237, 217, 179], 0.25);
      const s = clamp01(out / 0.22);
      c = mix(c, warm, s * s * (3 - 2 * s));
    }
    return c;
  }

  /**
   * Average colour drawn along screen row y (CSS px): samples points across the width and
   * composites the layers with the same alpha, soft-edge feather and tone as the shader.
   */
  edge(state, W, H, y) {
    const N = 12;
    const sum = [0, 0, 0];
    let n = 0;
    for (let j = 0; j < N; j++) {
      const x = ((j + 0.5) / N) * W;
      let col = null;
      state.layers.forEach((l, idx) => {
        const r = l.rect;
        const u = (x - r.x) / r.w;
        const v = (y - r.y) / r.h;
        let c = this.sample(l.frame, u, v);
        if (!c) return;
        const [tr, tg, tb, sat] = l.tone;
        if (tr !== 1 || tg !== 1 || tb !== 1 || sat !== 1) {
          const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
          c = mix([lum, lum, lum], c, sat);
          c = [c[0] * tr, c[1] * tg, c[2] * tb];
        }
        if (idx === 0 || !col) {
          col = c;
          return;
        }
        const px = Math.min(r.w, r.h) * l.feather;
        const fu = Math.max(px / r.w, 1e-4);
        const fv = Math.max(px / r.h, 1e-4);
        const ss = (e, t) => {
          const k = clamp01(t / e);
          return k * k * (3 - 2 * k);
        };
        const inside = ss(fu, u) * ss(fu, 1 - u) * ss(fv, v) * ss(fv, 1 - v);
        col = mix(col, c, l.alpha * (inside + (1 - inside) * l.ext));
      });
      if (!col) continue;
      sum[0] += col[0];
      sum[1] += col[1];
      sum[2] += col[2];
      n++;
    }
    if (!n) return this.bg;
    // The shader's shared grade: gentle S-curve and a warm lift.
    let col = [sum[0] / n, sum[1] / n, sum[2] / n].map((c, ch) => {
      let x = Math.min(1, c / 255);
      x = x + (x * x * (3 - 2 * x) - x) * 0.14;
      x += [0.014, 0.007, 0][ch] * (1 - x);
      return x * 255;
    });
    // The vignette's warm shading near the top and bottom centre.
    const v = state.vignette * 0.39;
    col = mix(col, [col[0] * 0.74, col[1] * 0.52, col[2] * 0.44], v);
    return col;
  }

  /**
   * Called whenever the film renders. `shades` lists the text shading currently on screen:
   * [{ edge: 'top' | 'bottom', amount }].
   */
  setFilm(state, W, H, shades = []) {
    let top = this.edge(state, W, H, H * 0.02);
    let bottom = this.edge(state, W, H, H * 0.98);
    for (const s of shades) {
      if (s.amount <= 0) continue;
      if (s.edge === 'top') top = mix(top, SHADE, s.amount);
      else bottom = mix(bottom, SHADE, s.amount);
    }
    this.film = { top, bottom };
    this.apply();
  }

  /** Blend in the cover and the invitation details where they cover the screen edges. */
  apply() {
    let top = this.film.top;
    let bottom = this.film.bottom;
    if (!document.body.classList.contains('is-ready')) {
      top = bottom = this.bg; // the cover is showing
    } else if (this.details) {
      // The details section fades from clear to solid maroon over its first 42vh.
      const H = window.innerHeight;
      const t = this.details.getBoundingClientRect().top;
      const cover = (offset) => {
        if (offset <= 0) return 0;
        const vh = H / 100;
        if (offset < 22 * vh) return 0.78 * (offset / (22 * vh));
        if (offset < 42 * vh) return 0.78 + 0.22 * ((offset - 22 * vh) / (20 * vh));
        return 1;
      };
      top = mix(top, this.bg, cover(-t));
      bottom = mix(bottom, this.bg, cover(H - t));
    }

    const ht = hex(top);
    const hb = hex(bottom);
    const key = ht + hb;
    if (key === this.last) return;
    this.last = key;
    if (this.meta) this.meta.content = ht;
    document.documentElement.style.backgroundColor = ht;
    document.body.style.backgroundColor = ht;
    if (this.edgeTop) this.edgeTop.style.backgroundColor = ht;
    if (this.edgeBottom) this.edgeBottom.style.backgroundColor = hb;
  }
}
