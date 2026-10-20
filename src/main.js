import { CinemaEngine } from './CinemaEngine.js';
import { ScrollController } from './ScrollController.js';
import { loadFrames } from './FrameLoader.js';
import { FRAMES, TOTAL_UNITS, UNIT_VH, SEGMENTS, holdStart, holdLen, evaluate } from './Storyboard.js';
import { renderDetails } from './DetailsSection.js';
import { Music } from './Music.js';
import { BrowserTint } from './BrowserTint.js';
import { weddingData } from './weddingData.js';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const canvas = document.getElementById('film-canvas');
const film = document.getElementById('film');
const details = document.getElementById('details');
const loaderFill = document.getElementById('loader-fill');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Words on screen -------------------------------------------------------------------
const { bride, groom, wedding } = weddingData;
const day = new Date(+wedding.calendarDetails.startDate.slice(0, 4), +wedding.calendarDetails.startDate.slice(4, 6) - 1, +wedding.calendarDetails.startDate.slice(6, 8));
document.querySelectorAll('[data-names]').forEach((el) => {
  if (el.dataset.order === 'groom-first') {
    el.innerHTML = `${groom.name} <em>${el.dataset.names}</em> ${bride.name}`;
  } else {
    el.innerHTML = `${bride.name} <em>${el.dataset.names}</em> ${groom.name}`;
  }
});
document.querySelectorAll('[data-date]').forEach((el) => {
  el.textContent = `${String(day.getDate()).padStart(2, '0')} · ${String(day.getMonth() + 1).padStart(2, '0')} · ${day.getFullYear()}`;
});
document.querySelectorAll('[data-date-long]').forEach((el) => {
  el.textContent = `${wedding.date} · ${wedding.city.split(',')[0]}`;
});
document.querySelectorAll('[data-finale-date]').forEach((el) => {
  el.textContent = wedding.date;
});
document.querySelectorAll('[data-finale-line]').forEach((el) => {
  el.textContent = weddingData.finaleLine || '';
});

// The cover's calligraphy writes itself in once its artwork has loaded.
const coverLogo = document.getElementById('cover-logo');
coverLogo.setAttribute('aria-label', `${groom.name} & ${bride.name}`);
const logoArt = new Image();
logoArt.onload = logoArt.onerror = () => document.body.classList.add('logo-in');
logoArt.src = '/assets/logo/ashwin-snegha.webp';
renderDetails(details, weddingData);

// --- Music -----------------------------------------------------------------------------
const music = new Music(weddingData.music);
const musicBtn = document.getElementById('music-toggle');

// No song set? Then there's nothing to offer: hide the button and the cover's music hint.
if (!music.available) {
  musicBtn.hidden = true;
  document.querySelector('.cover-hint').hidden = true;
}

function setMusicUI(on) {
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
}

/** Remembers a guest's on/off choice on this device (read with no argument). */
function musicPref(value) {
  try {
    if (value) localStorage.setItem('invite-music', value);
    return localStorage.getItem('invite-music');
  } catch {
    return null;
  }
}

// --- Film ------------------------------------------------------------------------------
film.style.height = `${TOTAL_UNITS * UNIT_VH + 100}vh`;
window.scrollTo(0, 0);

// preserveDrawingBuffer only in dev, so the frame can be read back for inspection.
const engine = new CinemaEngine(canvas, { preserveDrawingBuffer: import.meta.env.DEV });

// When text appears, in film units. The last scene shows its journey note first, then your
// names at the top as the camera pulls back - bookending the opening title.
const last = FRAMES.length - 1;
const finaleSplit = holdStart(last) + 0.85;
const overlays = [
  // shade: which screen edge the text's shading darkens, and how strongly (for BrowserTint)
  { el: document.getElementById('ov-title'), out: [0.08, 0.42], shade: ['top', 0.66] },
  { el: document.getElementById('ov-cue'), out: [0.02, 0.22] },
  { el: document.getElementById('to-top'), in: [0.5, 0.85] },
  { el: document.getElementById('ov-wed'), in: [finaleSplit + 0.05, finaleSplit + 0.4], out: [TOTAL_UNITS - 0.45, TOTAL_UNITS - 0.05], shade: ['top', 0.55] },
  { el: document.getElementById('ov-cue-finale'), in: [finaleSplit + 0.33, finaleSplit + 0.4], out: [TOTAL_UNITS - 0.5, TOTAL_UNITS - 0.1] }
];

// Journey notes: each arrives once its photo has mostly taken over the screen, stays
// through the pause, and leaves as the next move begins - never over a double exposure.
const linkSeg = (i) => SEGMENTS.find((s) => s.kind === 'link' && s.i === i);
(weddingData.journey || []).forEach((note) => {
  const f = FRAMES.findIndex((fr) => fr.src === note.frame);
  if (f < 0) return;
  const el = document.createElement('div');
  el.className = 'ov ov-note';
  const label = document.createElement('p');
  label.className = 'note-label';
  label.textContent = note.label || '';
  const text = document.createElement('p');
  text.className = 'note-text';
  text.textContent = note.text || '';
  el.append(label, text);
  document.getElementById('film-text').appendChild(el);

  const prev = f > 0 ? linkSeg(f - 1) : null;
  const next = linkSeg(f);
  const holdEnd = holdStart(f) + holdLen(f);
  overlays.push({
    el,
    in: prev ? [prev.start + 0.68 * prev.len, prev.start + prev.len + 0.08] : [-1, 0],
    out: next ? [holdEnd - 0.05, next.start + 0.22 * next.len] : [finaleSplit - 0.25, finaleSplit],
    shade: ['bottom', 0.76]
  });
});

// Phone browser bars take the colour of the picture at the screen edges.
const bgHex = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#3e0d16';
const tint = new BrowserTint({
  bg: [1, 3, 5].map((i) => parseInt(bgHex.slice(i, i + 2), 16)),
  details
});

const scroller = new ScrollController({
  engine,
  film,
  overlays,
  progressEl: document.getElementById('progress-fill'),
  reducedMotion,
  onRender: (state) => {
    const isAtFinale = state.u >= finaleSplit + 0.3 && state.u < TOTAL_UNITS - 0.1;
    document.body.classList.toggle('has-finale', isAtFinale);
    if (isAtFinale && !isAutoScrolling) {
      if (!finaleAdvanceTimer) scheduleFinaleAutoAdvance(6500);
    } else if (!isAutoScrolling && state.u < finaleSplit + 0.15) {
      cancelFinaleAutoAdvance();
    }
    tint.setFilm(state, engine.W, engine.H, overlays.filter((o) => o.shade && o.last > 0).map((o) => ({ edge: o.shade[0], amount: o.shade[1] * o.last })));
  }
});

const { ready } = loadFrames(FRAMES, {
  firstCount: 2,
  onFrame: (i, img) => {
    engine.addFrame(i, img);
    tint.addFrame(i, img);
    scroller.invalidate();
  },
  onProgress: (p) => {
    loaderFill.style.transform = `scaleX(${p})`;
  }
});

// Once the film is ready, the cover offers "Open invitation". That tap is the guest's
// permission for sound, so the music starts with it (unless they switched it off before).
ready.then(() => {
  scroller.snap();
  document.body.classList.add('can-open');
  music.preload();
  // Focus for keyboard users once the button has faded in (it can't take focus while hidden).
  setTimeout(() => document.getElementById('cover-open').focus({ preventScroll: true }), 250);
});

let doorsOpenedTime = 0;

function openInvite() {
  const body = document.body;
  if (!body.classList.contains('can-open') || body.classList.contains('is-ready')) return;
  doorsOpenedTime = performance.now();
  userHasInteracted = false;
  wasAutoAdvanced = false;
  hideDetailsCue();
  document.documentElement.classList.remove('locked');
  window.scrollTo(0, 0);
  body.classList.add('is-ready');
  if (musicPref() !== 'off') music.start().then(setMusicUI);
  setTimeout(() => tint.apply(), 800); // bars follow the picture as the doors swing open
  scheduleAutoScroll();
}
document.getElementById('loader').addEventListener('click', openInvite);

// --- Auto-scroll ------------------------------------------------------------------------
// If the user doesn't scroll within ~2.8s after opening the invite, auto-scroll begins.
// It glides through the film, giving comfortable reading time at each story note, and comes to a
// gentle rest at "Snegha weds Ashwin" (the 3rd photo finale). Any manual interaction stops it.

const AUTO_SCROLL_DELAY_MS = 2800;

const f1Start = holdStart(1);
const f2Start = holdStart(2);

const AUTO_SCROLL_KEYFRAMES = [
  { t: 0.0,  u: 0.0 },
  { t: 2.2,  u: f1Start + 0.15 }, // Zoom into hands (faster & more responsive)
  { t: 6.0,  u: f1Start + 0.45 }, // Reading time for "The first promise" note (~3.8s)
  { t: 9.2,  u: f2Start + 0.15 }, // Transition to face-to-face photo (~3.2s)
  { t: 13.0, u: f2Start + 0.45 }, // Reading time for "Face to face" note (~3.8s)
  { t: 16.2, u: finaleSplit + 0.40 } // Settle at finale stopping point
];

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function evaluateAutoScrollU(elapsedSeconds) {
  const lastKf = AUTO_SCROLL_KEYFRAMES[AUTO_SCROLL_KEYFRAMES.length - 1];
  if (elapsedSeconds <= 0) return 0;
  if (elapsedSeconds >= lastKf.t) return lastKf.u;
  for (let i = 0; i < AUTO_SCROLL_KEYFRAMES.length - 1; i++) {
    const k0 = AUTO_SCROLL_KEYFRAMES[i];
    const k1 = AUTO_SCROLL_KEYFRAMES[i + 1];
    if (elapsedSeconds >= k0.t && elapsedSeconds <= k1.t) {
      const p = smoothstep(k0.t, k1.t, elapsedSeconds);
      return k0.u + (k1.u - k0.u) * p;
    }
  }
  return lastKf.u;
}

let autoScrollTimer = null;
let autoScrollRaf = null;
let isAutoScrolling = false;
let userHasInteracted = false;
let wasAutoAdvanced = false;
let detailsCueTimer = null;

function hideDetailsCue() {
  if (detailsCueTimer) {
    clearTimeout(detailsCueTimer);
    detailsCueTimer = null;
  }
  document.getElementById('details-cue')?.classList.remove('is-visible');
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearTimeout(autoScrollTimer);
    autoScrollTimer = null;
  }
  if (autoScrollRaf) {
    cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = null;
  }
  isAutoScrolling = false;
}

let finaleAdvanceTimer = null;

function scheduleFinaleAutoAdvance(delayMs = 3000) {
  cancelFinaleAutoAdvance();
  finaleAdvanceTimer = setTimeout(() => {
    if (userHasInteracted) return;
    wasAutoAdvanced = true;
    details.scrollIntoView({ behavior: 'smooth' });
  }, delayMs);
}

function cancelFinaleAutoAdvance() {
  if (finaleAdvanceTimer) {
    clearTimeout(finaleAdvanceTimer);
    finaleAdvanceTimer = null;
  }
}

function onUserManualInteraction(e) {
  if (!document.body.classList.contains('is-ready')) return;
  // Ignore opening interactions or controls like music button
  if (performance.now() - doorsOpenedTime < 1500) return;
  if (e && e.target && e.target.closest && (e.target.closest('#loader') || e.target.closest('#music-toggle'))) return;

  userHasInteracted = true;
  stopAutoScroll();
  cancelFinaleAutoAdvance();
  hideDetailsCue();
}

// Listen for genuine gestures indicating intent to scroll manually
['wheel', 'touchmove', 'keydown'].forEach((evt) => {
  window.addEventListener(evt, onUserManualInteraction, { passive: true });
});

function startAutoScroll() {
  if (userHasInteracted || isAutoScrolling) return;

  isAutoScrolling = true;
  const startTime = performance.now();
  const totalDurationSec = AUTO_SCROLL_KEYFRAMES[AUTO_SCROLL_KEYFRAMES.length - 1].t;

  function step(now) {
    if (!isAutoScrolling || userHasInteracted) return;
    const elapsedSec = (now - startTime) / 1000;
    const currentU = evaluateAutoScrollU(elapsedSec);

    scroller.measure();
    const targetScrollY = scroller.filmTop + (currentU / TOTAL_UNITS) * scroller.filmScroll;
    window.scrollTo(0, targetScrollY);

    if (elapsedSec >= totalDurationSec) {
      stopAutoScroll();
      scheduleFinaleAutoAdvance(3000);
      return;
    }

    autoScrollRaf = requestAnimationFrame(step);
  }

  autoScrollRaf = requestAnimationFrame(step);
}

function scheduleAutoScroll() {
  if (userHasInteracted) return;
  stopAutoScroll();
  autoScrollTimer = setTimeout(startAutoScroll, AUTO_SCROLL_DELAY_MS);
}

if (import.meta.env.DEV) {
  // Console helper: __film.show(u) renders the film at position u (0..TOTAL_UNITS).
  window.__film = {
    engine,
    scroller,
    total: TOTAL_UNITS,
    get music() {
      return music;
    },
    tint,
    startAutoScroll,
    stopAutoScroll,
    show(u, blur = 0) {
      const s = evaluate(u, engine.W, engine.H, { reducedMotion });
      engine.render(s, blur);
      scroller.updateOverlays(u);
      return { seg: s.seg.kind + s.seg.i, t: +s.t.toFixed(3) };
    },
    // __film.at('link', 0, 0.5) -> halfway through the first link
    at(kind, i, t, blur = 0) {
      const seg = SEGMENTS.find((s) => s.kind === kind && s.i === i);
      return this.show(seg.start + seg.len * t, blur);
    }
  };
}

// --- Chrome ----------------------------------------------------------------------------
document.getElementById('skip').addEventListener('click', (e) => {
  e.preventDefault();
  onUserManualInteraction();
  details.scrollIntoView({ behavior: 'smooth' });
});
musicBtn.addEventListener('click', () => {
  music.toggle().then((on) => {
    setMusicUI(on);
    musicPref(on ? 'on' : 'off');
  });
});

document.getElementById('to-top').addEventListener('click', (e) => {
  e.preventDefault();
  onUserManualInteraction();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('ov-cue-finale')?.addEventListener('click', () => {
  details.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('details-cue')?.addEventListener('click', () => {
  const celebrations = document.querySelector('.events-section') || document.querySelector('.invite');
  celebrations?.scrollIntoView({ behavior: 'smooth' });
});

// Hide the film chrome once the invitation details take over the screen.
new IntersectionObserver(([entry]) => {
  document.body.classList.toggle('in-details', entry.isIntersecting);
  const detailsCue = document.getElementById('details-cue');

  if (entry.isIntersecting) {
    cancelFinaleAutoAdvance();
    // ONLY reveal the details scroll cue if brought here via auto-scroll and NOT manually scrolled
    if (wasAutoAdvanced && !userHasInteracted) {
      if (detailsCueTimer) clearTimeout(detailsCueTimer);
      detailsCueTimer = setTimeout(() => {
        if (wasAutoAdvanced && !userHasInteracted) {
          detailsCue?.classList.add('is-visible');
        }
      }, 750);
    }
  } else {
    hideDetailsCue();
  }
}, { rootMargin: '0px 0px -40% 0px' }).observe(details);
