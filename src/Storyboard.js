/**
 * Storyboard - the shot list for the scroll film, plus the camera math that turns
 * a scroll position into what's on screen.
 *
 * The whole film is one continuous camera. Every cut is a "link": the next photo is
 * placed inside the current one at a shared subject (their hands, the couple) so the
 * camera can zoom *through* one photo into the next.
 *
 * Camera grammar (kept the same everywhere so the film feels like one steady operator):
 *   - Each beat is a move about a SUBJECT: the subject glides to a screen position while
 *     the photo scales around it. During links the subject barely moves, so the world
 *     zooms around the couple instead of the screen swinging about.
 *   - Every beat starts and ends at rest (eased), so moves land softly.
 *   - Link lengths follow how far they zoom, so every transition moves at the same pace.
 *   - Holds are near-still: a barely visible push, unless they deliberately reframe.
 *
 * Coordinates: image UVs (0,0 top-left .. 1,1 bottom-right); screen positions `at` are
 * fractions of the screen; `z` is zoom over the photo's base fit (1 = just fills).
 *   link { p, q, k } -> point p in the OUTER photo lines up with point q in the INNER
 *                       photo; k = inner photo width as a fraction of outer width
 */

const FILM = '/assets/film/';

// show (optional): share of a wide photo's width that stays on screen on portrait screens.
export const FRAMES = [
  { src: '01-opening',        w: 896,  h: 1200 },
  { src: '02-hands',          w: 1024, h: 1024 },
  { src: '03-face-other',     w: 1326, h: 1186, show: 0.66 }
].map((f) => ({ ...f, avif: `${FILM}${f.src}.avif`, jpg: `${FILM}${f.src}.jpg` }));

// Framing of the very first shot.
const OPENING = { x: 0.5, y: 0.5, z: 1.0 };

// dir: 'in'  -> next photo is nested inside the current one (zoom into the subject)
//      'out' -> current photo is nested inside the next one (pull back from the subject)
// at / z: where the subject sits on screen, and the incoming photo's zoom, when the link
//         lands (at defaults to wherever the subject already is).
// night (optional): grade the outgoing photo to night during the link.
export const LINKS = [
  { dir: 'in',  p: [0.528, 0.820], q: [0.56, 0.56], k: 0.26, at: [0.5, 0.6], z: 1.15 },    // their hands, up close
  { dir: 'out', p: [0.525, 0.6], q: [0.56, 0.56], k: 0.14, at: [0.5, 0.8], z: 1.15 }       // hands -> the space between them, face to face
];

// Holds: `push` scales gently about the next subject; `at`/`z` reframe deliberately.
const HOLDS = [
  { len: 0.7, push: 1.06, at: [0.53, 0.8] },      // opening - drifting down towards their hands
  { len: 0.6 },                                   // hands
  { len: 1.8, at: [0.5, 0.9], z: 1.0 }            // face to face - pull back until both faces are in; names appear
];

// Backup third shot (walking down the path; files in source-photos/backup/film/). To switch
// back, use { src: '03-journey-start', w: 896, h: 1200 } as the third frame, link
// { dir: 'out', p: [0.517, 0.531], q: [0.56, 0.56], k: 0.22, z: 1.15 } with length 1.6,
// and hold { len: 1.8, at: [0.5, 0.55], z: 1.0 }.
const DEFAULT_PUSH = 1.025;

// Link lengths in units, set so each transition moves at the same pace (see motion check).
const LINK = [1.6, 1.7];

export const UNIT_VH = 62;

export const SEGMENTS = (() => {
  const segs = [];
  let u = 0;
  FRAMES.forEach((_, i) => {
    segs.push({ kind: 'hold', i, start: u, len: HOLDS[i].len });
    u += HOLDS[i].len;
    if (i < LINKS.length) {
      segs.push({ kind: 'link', i, start: u, len: LINK[i] });
      u += LINK[i];
    }
  });
  return segs;
})();

export const TOTAL_UNITS = SEGMENTS[SEGMENTS.length - 1].start + SEGMENTS[SEGMENTS.length - 1].len;

/** Start (in units) of the hold for frame i - used to time on-screen text. */
export function holdStart(i) {
  return SEGMENTS.find((s) => s.kind === 'hold' && s.i === i).start;
}
export function holdLen(i) {
  return HOLDS[i].len;
}

// ---------------------------------------------------------------------------------------
// Camera math (all rects are in CSS pixels: { x, y, w, h } of the photo on screen)
// ---------------------------------------------------------------------------------------

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
const ease = (t) => t * t * (3 - 2 * t);
const FEATHER = 0.22; // soft edge of the photo being zoomed through, as a share of its size

// On portrait screens photos fill the screen, unless a wide photo would lose too much of its
// width (frame.show): it then sits shorter than the screen instead. On wide screens a tall
// photo is allowed to sit narrower than the screen rather than cropping away 60% of it.
// Either way the shader continues the picture past its edges as a soft blurred reflection.
const MAX_OVERFILL = 1.6;

function baseWidth(frame, W, H) {
  const ia = frame.w / frame.h;
  const sa = W / H;
  const coverW = sa > ia ? W : H * ia;
  const containW = sa > ia ? H * ia : W;
  if (sa < 1) return frame.show ? Math.min(coverW, W / frame.show) : coverW;
  return Math.min(coverW, containW * MAX_OVERFILL);
}

/** Shift needed so a rect covers the screen (or sits centred on an axis it can't cover). */
function coverShift(r, W, H) {
  const dx = r.w >= W ? clamp(r.x, W - r.w, 0) - r.x : (W - r.w) / 2 - r.x;
  const dy = r.h >= H ? clamp(r.y, H - r.h, 0) - r.y : (H - r.h) / 2 - r.y;
  return [dx, dy];
}

const shift = (r, [dx, dy]) => ({ x: r.x + dx, y: r.y + dy, w: r.w, h: r.h });
const screenOf = (r, uv) => [r.x + uv[0] * r.w, r.y + uv[1] * r.h];

/** The rect r, scaled by s about screen point S0, with S0 then moved to S. */
function about(r, S0, S, s) {
  return { x: S[0] + s * (r.x - S0[0]), y: S[1] + s * (r.y - S0[1]), w: r.w * s, h: r.h * s };
}

function nest(outer, link, innerFrame) {
  const w = outer.w * link.k;
  const h = (w * innerFrame.h) / innerFrame.w;
  return {
    x: outer.x + link.p[0] * outer.w - link.q[0] * w,
    y: outer.y + link.p[1] * outer.h - link.q[1] * h,
    w,
    h
  };
}

function unnest(inner, link, outerFrame) {
  const w = inner.w / link.k;
  const h = (w * outerFrame.h) / outerFrame.w;
  return {
    x: inner.x + link.q[0] * inner.w - link.p[0] * w,
    y: inner.y + link.q[1] * inner.h - link.p[1] * h,
    w,
    h
  };
}

/** The subject of link i, as a point in photo f (f is i or i + 1). */
function subject(f, i) {
  const { dir, p, q } = LINKS[i];
  const outer = dir === 'in' ? i : i + 1;
  return f === outer ? p : q;
}

/**
 * Lay out every beat for one screen size: where each move starts, where its subject goes,
 * and how much it scales. Each beat starts exactly where the previous one ended.
 */
function buildPlan(W, H) {
  const plan = [];
  const f0 = FRAMES[0];
  const bw0 = baseWidth(f0, W, H) * OPENING.z;
  let cam = { x: W / 2 - OPENING.x * bw0, y: H / 2 - OPENING.y * (bw0 * f0.h) / f0.w, w: bw0, h: (bw0 * f0.h) / f0.w };
  cam = shift(cam, coverShift(cam, W, H));

  for (const seg of SEGMENTS) {
    const i = seg.i;
    if (seg.kind === 'hold') {
      const beat = HOLDS[i];
      const uv = i < LINKS.length ? subject(i, i) : subject(i, i - 1);
      const S0 = screenOf(cam, uv);
      const s = beat.z ? (baseWidth(FRAMES[i], W, H) * beat.z) / cam.w : beat.push || DEFAULT_PUSH;
      let S1 = beat.at ? [beat.at[0] * W, beat.at[1] * H] : S0;
      const sh = coverShift(about(cam, S0, S1, s), W, H);
      S1 = [S1[0] + sh[0], S1[1] + sh[1]];
      plan.push({ seg, start: cam, S0, S1, s });
      cam = about(cam, S0, S1, s);
    } else {
      const link = LINKS[i];
      const B = FRAMES[i + 1];
      const S0 = screenOf(cam, subject(i, i));
      const bStart = link.dir === 'in' ? nest(cam, link, B) : unnest(cam, link, B);
      const s = (baseWidth(B, W, H) * link.z) / bStart.w;
      let S1 = link.at ? [link.at[0] * W, link.at[1] * H] : S0;
      const sh = coverShift(about(bStart, S0, S1, s), W, H);
      S1 = [S1[0] + sh[0], S1[1] + sh[1]];
      plan.push({ seg, start: cam, bStart, S0, S1, s });
      cam = about(bStart, S0, S1, s);
    }
  }
  return plan;
}

let cached = { key: '', plan: null };
function planFor(W, H) {
  const key = `${W}x${H}`;
  if (cached.key !== key) cached = { key, plan: buildPlan(W, H) };
  return cached.plan;
}

/**
 * Evaluate the film at position u (in units). Returns everything the renderer needs:
 * up to two layers (bottom is always full-screen, top may be a soft-edged inset), the
 * zoom-blur centre, and the camera's log-zoom so the caller can derive speed.
 */
export function evaluate(u, W, H, opts = {}) {
  u = clamp(u, 0, TOTAL_UNITS);
  const plan = planFor(W, H);
  let k = plan.length - 1;
  for (let j = 0; j < plan.length; j++) {
    const sg = plan[j].seg;
    if (u < sg.start + sg.len) { k = j; break; }
  }
  const P = plan[k];
  const seg = P.seg;
  const t = clamp((u - seg.start) / seg.len, 0, 1);
  const e = ease(t);
  // The subject glides into place early, while the zoom is still slow - tilt, then push -
  // so the big zooms happen around a settled point instead of while sliding.
  const g = seg.kind === 'link' ? smooth(0, 0.7, t) : e;
  const S = [P.S0[0] + (P.S1[0] - P.S0[0]) * g, P.S0[1] + (P.S1[1] - P.S0[1]) * g];
  const sc = P.s ** e;

  const state = {
    layers: [],
    blurCenter: S,
    baseBlur: 0,
    vignette: 0.32,
    logZoom: 0,
    t,
    seg
  };

  if (seg.kind === 'hold') {
    let r = about(P.start, P.S0, S, sc);
    r = shift(r, coverShift(r, W, H));
    state.layers.push(layer(seg.i, r, 1, 0, 1));
    state.logZoom = Math.log(r.w);
    return state;
  }

  const ia = seg.i;
  const ib = seg.i + 1;
  const link = LINKS[seg.i];
  let ra = about(P.start, P.S0, S, sc);
  let rb = about(P.bStart, P.S0, S, sc);

  if (opts.reducedMotion) {
    // Plain cross-fade with a gentle push on each photo, ending exactly where the full
    // move would have.
    const bEnd = about(P.bStart, P.S0, P.S1, P.s);
    ra = grow(P.start, 1.05 ** e);
    rb = grow(bEnd, 1.05 ** (1 - e));
    state.layers.push(layer(ia, ra, 1, 0, 1));
    state.layers.push(layer(ib, rb, smooth(0.12, 0.88, t), 0, 1));
    state.logZoom = Math.log(ra.w);
  } else {
    // Both photos ride the same camera; keep the larger (outer) one covering the screen.
    const sh = coverShift(link.dir === 'in' ? ra : rb, W, H);
    ra = shift(ra, sh);
    rb = shift(rb, sh);
    if (link.dir === 'in') {
      // Camera flies into A; B is waiting inside it at the match point.
      state.layers.push(layer(ia, ra, 1, 0, 1));
      state.layers.push(layer(ib, rb, smooth(0.18, 0.78, t), FEATHER * (1 - smooth(0.55, 0.95, t)), smooth(0.7, 1, t)));
      state.logZoom = Math.log(ra.w);
    } else {
      // Camera pulls back out of A, revealing B around it.
      state.layers.push(layer(ib, rb, 1, 0, 1));
      state.layers.push(layer(ia, ra, 1 - smooth(0.22, 0.82, t), FEATHER * smooth(0.04, 0.4, t), 1 - smooth(0, 0.28, t)));
      state.logZoom = Math.log(rb.w);
    }
    state.baseBlur = 0.022 * Math.sin(Math.PI * t);
  }

  if (link.night) {
    // A (golden hour) sinks into blue night as they sit down.
    const n = smooth(0.05, 0.8, t);
    const la = state.layers.find((l) => l.frame === ia);
    la.tone = [1 - 0.62 * n, 1 - 0.55 * n, 1 - 0.3 * n, 1 - 0.45 * n];
  }

  return state;
}

function grow(r, s) {
  const w = r.w * s;
  const h = r.h * s;
  return { x: r.x - (w - r.w) / 2, y: r.y - (h - r.h) / 2, w, h };
}

function layer(frame, rect, alpha, feather, ext) {
  return { frame, rect, alpha, feather, ext, tone: [1, 1, 1, 1] };
}
