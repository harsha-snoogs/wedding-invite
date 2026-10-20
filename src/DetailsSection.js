/**
 * DetailsSection - the invitation itself (date, events, postcards, families, venue),
 * shown after the film. Everything comes from weddingData.js.
 */

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function parseCompact(s) {
  // "20261126T090000" -> Date
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}

function splitDate(text) {
  // "November 24, 2026" -> { day: "24", mon: "Nov" }
  const m = /^([A-Za-z]+)\s+(\d{1,2})/.exec(text);
  return m ? { day: m[2], mon: m[1].slice(0, 3) } : { day: "", mon: text };
}

function calendarUrl(c) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: c.title,
    dates: `${c.startDate}/${c.endDate}`,
    details: c.description,
    location: c.location,
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const ornament = `
  <svg class="ornament" viewBox="0 0 120 12" aria-hidden="true">
    <path d="M0 6h50M70 6h50" stroke="currentColor" stroke-width="0.75"/>
    <path d="M60 1l5 5-5 5-5-5z" fill="none" stroke="currentColor" stroke-width="0.75"/>
  </svg>`;

// Distinct cultural SVG motifs for each ceremony
function getCeremonyIcon(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("welcome")) {
    // Traditional Diya & Blooming Lotus
    return `
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M24 10c0 4-4 8-4 12 0 4 4 6 4 6s4-2 4-6c0-4-4-8-4-12z" />
        <path d="M24 28c-4 0-10-2-12-8 0 6 5 11 12 11s12-5 12-11c-2 6-8 8-12 8z" />
        <path d="M12 24c-3 1-5 4-5 7 0 5 6 9 17 9s17-4 17-9c0-3-2-6-5-7" />
        <path d="M24 6c0-2-2-4-2-4s-2 2-2 4c0 1.5 1 2 2 2s2-.5 2-2z" fill="currentColor" />
      </svg>`;
  }
  if (t.includes("engage") || t.includes("nitchayathartham")) {
    // Intertwined Rings & Sacred Blossom
    return `
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="19" cy="27" r="9.5" />
        <circle cx="29" cy="27" r="9.5" />
        <path d="M24 13l2.5 3.5-2.5 3.5-2.5-3.5z" fill="currentColor" opacity="0.85" />
        <path d="M24 9v-3M20.5 8.5l-2-2M27.5 8.5l2-2" stroke-width="1.2" />
        <circle cx="24" cy="27" r="1.5" fill="currentColor" />
      </svg>`;
  }
  if (t.includes("reception")) {
    // Grand Chandelier & Festive Sparkles
    return `
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M24 4v8" />
        <path d="M14 16c0 6 4 10 10 10s10-4 10-10H14z" />
        <path d="M10 16c0 10 6 16 14 16s14-6 14-16" />
        <path d="M18 20v6M24 20v8M30 20v6" />
        <circle cx="24" cy="40" r="2.5" fill="currentColor" />
        <circle cx="16" cy="35" r="1.8" fill="currentColor" />
        <circle cx="32" cy="35" r="1.8" fill="currentColor" />
        <path d="M6 10l2 2M42 10l-2 2M24 2l1 2h2l-2 1 1 2-2-1-2 1 1-2-2-1h2z" fill="currentColor" />
      </svg>`;
  }
  if (t.includes("upanayanam")) {
    // Sacred Yajnopavita & Vedic Homa Sacred Fire
    return `
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M13 41h22l4-7H9l4 7z" />
        <path d="M11 44h26" stroke-width="2" />
        <path d="M15 36c4-7 14-17 20-27" stroke-dasharray="2 2" stroke-width="1.7" />
        <path d="M13 38c4-7 14-17 20-27" stroke-dasharray="2 2" stroke-width="1.7" />
        <path d="M24 26c3.5-4 5.5-8 5.5-11 0-4-3.5-7-5.5-7s-5.5 3-5.5 7c0 3 2 7 5.5 11z" fill="currentColor" opacity="0.3" />
        <path d="M24 26c1.8-2 3-4 3-6 0-2-1.2-3.5-3-3.5s-3 1.5-3 3.5c0 2 1.2 4 3 6z" fill="currentColor" />
      </svg>`;
  }
  // Subha Muhurtham: Sacred Mangalasutra & Auspicious Kalasam
  return `
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 19c0-5 4-8.5 9-8.5s9 3.5 9 8.5c0 7-9 13.5-9 13.5s-9-6.5-9-13.5z" />
      <path d="M24 6v4M19.5 8l2 2.5M28.5 8l-2 2.5" />
      <circle cx="24" cy="38" r="4.5" fill="currentColor" />
      <circle cx="17" cy="35" r="3" fill="currentColor" opacity="0.85" />
      <circle cx="31" cy="35" r="3" fill="currentColor" opacity="0.85" />
      <path d="M8 24c4.5 7 10 11 16 11s11.5-4 16-11" stroke-width="1.4" />
    </svg>`;
}

export function renderDetails(root, data) {
  const {
    bride,
    groom,
    couple,
    wedding,
    functions,
    families,
    coimbatorePostcards = [],
  } = data;
  const day = parseCompact(wedding.calendarDetails.startDate);
  const weekday = day.toLocaleDateString("en-US", { weekday: "long" });
  const month = day.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const family = (f, person) => `
    <article class="family reveal">
      <div class="family-arch"><img src="${esc(f.photo || person.photo)}" alt="${esc(f.title || person.fullName)}" loading="lazy" decoding="async"></div>
      <h3>${esc(f.title)}</h3>
      <p class="family-sub">${esc(f.subtitle)}</p>
      <ul>
        ${f.members.map((m) => `<li><span>${esc(m.name)}</span></li>`).join("")}
      </ul>
    </article>`;

  root.innerHTML = `
    <div class="details-inner">
      <header class="invite reveal">
        <p class="eyebrow">Together with their families</p>
        <h2 class="invite-names">${esc(groom.name)} <em>&amp;</em> ${esc(bride.name)}</h2>
        <p class="invite-line">request the joy of your presence at their wedding celebrations</p>
        
        <div class="invite-dates">
          <div class="invite-date-card">
            <span class="card-dow">Sunday</span>
            <span class="card-day">15</span>
            <span class="card-tag">Reception</span>
          </div>
          <span class="invite-date-amp" aria-hidden="true">&amp;</span>
          <div class="invite-date-card card-muhurtham">
            <span class="card-dow">Monday</span>
            <span class="card-day">16</span>
            <span class="card-tag">Subha Muhurtham</span>
          </div>
        </div>
        <p class="invite-month">November 2026</p>

        <p class="invite-venue">${esc(wedding.venue)}<span>${esc(wedding.address)}, ${esc(wedding.city)}</span></p>
        <div class="actions">
          <a class="btn btn-gold" href="${esc(calendarUrl(wedding.calendarDetails))}" target="_blank" rel="noopener">Add to calendar</a>
        </div>
      </header>

      ${ornament}

      <!-- Celebrations section with luxury cards and slow perspective transitions -->
      <section class="events-section">
        <p class="eyebrow reveal">The Celebrations</p>
        <h3 class="events-section-title reveal">Sacred Ceremonies &amp; Festivities</h3>
        <p class="events-section-subtitle reveal">Join us as we step into our new journey across two joyful days</p>

        <div class="ceremony-cards-grid">
          ${functions
            .map((fn, idx) => {
              const isMuhurtham =
                /muhurtham/i.test(fn.title) || fn.type === "muhurtham";
              const d = splitDate(fn.date);
              const icon = getCeremonyIcon(fn.type || fn.title);
              const dayName = /15/.test(fn.date) ? "Sunday" : "Monday";
              return `
            <div class="ceremony-card reveal-card ${isMuhurtham ? "is-muhurtham-card" : ""}" style="--card-index: ${idx}">
              <div class="card-glass">
                ${
                  fn.bg
                    ? `
                <div class="card-bg-layer" aria-hidden="true">
                  <img src="${esc(fn.bg)}" alt="" loading="eager" decoding="async">
                  <div class="card-bg-gradient"></div>
                </div>`
                    : ""
                }
                ${isMuhurtham ? `<div class="card-crown-badge">✦ Auspicious Subha Muhurtham ✦</div>` : ""}
                <div class="card-header-bar">
                  <span class="card-date-badge"><span class="badge-dot"></span>${dayName}, ${esc(d.day)} ${esc(d.mon)}</span>
                  <span class="card-time-badge">${esc(fn.time)}</span>
                </div>
                <div class="card-motif-circle">
                  <div class="motif-icon">${icon}</div>
                </div>
                <h4 class="card-event-title">${esc(fn.title)}</h4>
                <p class="card-event-desc">${esc(fn.description)}</p>
                <div class="card-decor-corner card-decor-tl" aria-hidden="true"></div>
                <div class="card-decor-corner card-decor-br" aria-hidden="true"></div>
              </div>
            </div>`;
            })
            .join("")}
        </div>
      </section>

      ${ornament}

      <section class="families">
        <p class="eyebrow reveal">With the blessings of</p>
        <div class="family-grid">
          ${family(families.bride, bride)}
          ${family(families.groom, groom)}
        </div>
      </section>

      ${ornament}

      <section class="venue reveal">
        <p class="eyebrow">The venue</p>
        <h3>${esc(wedding.venue)}</h3>
        <p class="venue-address">${esc(wedding.address)}, ${esc(wedding.city)}</p>
        <a class="btn btn-ghost" href="${esc(wedding.googleMapsUrl)}" target="_blank" rel="noopener">Open in Google Maps</a>
      </section>

      ${ornament}

      <!-- Postcards from Coimbatore (horizontally scrollable interactive cards) -->
      <section class="postcards-section reveal">
        <p class="eyebrow">Explore Kovai</p>
        <h3 class="postcards-title">Postcards from Coimbatore</h3>
        <p class="postcards-subtitle">Scenic landmarks &amp; sacred sanctuaries to visit during your stay</p>

        <div class="postcard-rail-wrapper">
          <div class="postcard-rail" id="postcard-rail" role="region" aria-label="Postcards from Coimbatore carousel">
            ${coimbatorePostcards
              .map(
                (place) => `
              <article class="postcard-card" data-postcard-id="${esc(place.id)}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View details for ${esc(place.title)}">
                <div class="postcard-inner">
                  <div class="postcard-stamp" aria-hidden="true">
                    <span class="stamp-pin">641001</span>
                    <span class="stamp-city">KOVAI</span>
                  </div>
                  <div class="postcard-photo-wrap">
                    <img src="${esc(place.image)}" alt="${esc(place.title)}" loading="lazy" decoding="async">
                    <span class="postcard-dist-pill">${esc(place.distance.split("·")[0].trim())}</span>
                  </div>
                  <div class="postcard-caption">
                    <span class="postcard-category">${esc(place.category)}</span>
                    <h4 class="postcard-place-title">${esc(place.title)}</h4>
                    <p class="postcard-tagline">${esc(place.tagline)}</p>
                    <div class="postcard-cta">
                      <span>Read story &amp; view map</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </article>`,
              )
              .join("")}
          </div>
        </div>
      </section>

      <footer class="closing reveal">
        <p class="closing-quote">${esc(couple.closingHeadline)}<br>${esc(couple.closingSubhead)}</p>
        <p class="closing-text">${esc(couple.invitationMessage)}</p>
        <p class="closing-mono">${esc(couple.monogram)}</p>
      </footer>
    </div>

    <!-- Interactive Postcard Modal Popup -->
    <div class="postcard-modal-overlay" id="postcard-modal-overlay" aria-hidden="true">
      <div class="postcard-modal" id="postcard-modal" role="dialog" aria-modal="true" aria-labelledby="modal-place-title">
        <div class="modal-drag-area" id="modal-drag-area" role="button" aria-label="Swipe down to close">
          <span class="modal-drag-bar" aria-hidden="true"></span>
        </div>
        <button class="modal-close-btn" id="modal-close-btn" type="button" aria-label="Close dialog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-body" id="modal-body"></div>
      </div>
    </div>`;

  // Standard fade-up for general reveal blocks
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  root.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Slow, silky perspective transitions for ceremony cards (like reference site)
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          cardObserver.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  );
  root
    .querySelectorAll(".reveal-card")
    .forEach((el) => cardObserver.observe(el));

  // --- Interactive Postcard Modal Logic ---
  const modalOverlay = document.getElementById("postcard-modal-overlay");
  const modalEl = document.getElementById("postcard-modal");
  const modalBody = document.getElementById("modal-body");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const dragArea = document.getElementById("modal-drag-area");

  // Move modalOverlay directly to document.body so it is never trapped inside #details's lower z-index stacking context
  if (modalOverlay && modalOverlay.parentElement !== document.body) {
    document.body.appendChild(modalOverlay);
  }

  function openPostcardModal(placeId) {
    const place = coimbatorePostcards.find((p) => p.id === placeId);
    if (!place || !modalOverlay || !modalBody || !modalEl) return;

    // Reset scroll & transforms
    modalEl.scrollTop = 0;
    modalEl.style.transform = "";
    modalEl.style.transition = "";

    modalBody.innerHTML = `
      <div class="modal-hero-wrap">
        <img src="${esc(place.image)}" alt="${esc(place.title)}" class="modal-hero-img">
        <div class="modal-hero-overlay"></div>
        <span class="modal-category-badge">${esc(place.category)}</span>
      </div>
      <div class="modal-content">
        <div class="modal-header-meta">
          <span class="modal-distance-pill">📍 ${esc(place.distance)}</span>
          <span class="modal-time-pill">⏰ Best time: ${esc(place.bestTime)}</span>
        </div>
        <h3 class="modal-title" id="modal-place-title">${esc(place.title)}</h3>
        <p class="modal-tagline">${esc(place.tagline)}</p>
        <p class="modal-desc">${esc(place.description)}</p>
        
        <div class="modal-highlights">
          <span class="highlights-label">Experience highlights:</span>
          <ul class="highlights-list">
            ${place.highlights.map((h) => `<li><span class="check-icon">✦</span> ${esc(h)}</li>`).join("")}
          </ul>
        </div>

        <div class="modal-actions">
          <a class="btn btn-gold modal-map-btn" href="${esc(place.mapsUrl)}" target="_blank" rel="noopener">
            <span>Open in Google Maps</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
          <button type="button" class="btn btn-ghost modal-close-action-btn" id="modal-bottom-close">
            <span>Close</span>
          </button>
        </div>
      </div>`;

    modalBody
      .querySelector("#modal-bottom-close")
      ?.addEventListener("click", closePostcardModal);

    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    modalCloseBtn?.focus();
  }

  function closePostcardModal() {
    if (!modalOverlay || !modalEl) return;
    modalEl.style.transition = "transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
    modalEl.style.transform = "translateY(100%)";
    setTimeout(() => {
      modalOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      modalEl.style.transform = "";
      modalEl.style.transition = "";
    }, 240);
  }

  modalCloseBtn?.addEventListener("click", closePostcardModal);
  dragArea?.addEventListener("click", closePostcardModal);

  modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closePostcardModal();
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      modalOverlay?.getAttribute("aria-hidden") === "false"
    ) {
      closePostcardModal();
    }
  });

  // --- Mobile Touch Gestures: Swipe Down to Dismiss ---
  let touchStartY = 0;
  let touchStartX = 0;
  let currentDeltaY = 0;
  let isSwipingDown = false;

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    currentDeltaY = 0;
    isSwipingDown = false;
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1 || !modalEl) return;
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const diffY = touchY - touchStartY;
    const diffX = touchX - touchStartX;

    // Only engage swipe-down if user drags downwards with dominant vertical movement
    // and when scrolled to the top (or dragging top header/drag area)
    const isAtTop = modalEl.scrollTop <= 0;
    const isHeaderTouch = e.target.closest(
      "#modal-drag-area, .modal-hero-wrap, .modal-close-btn",
    );

    if (
      (isAtTop || isHeaderTouch) &&
      diffY > 0 &&
      Math.abs(diffY) > Math.abs(diffX)
    ) {
      isSwipingDown = true;
      currentDeltaY = diffY;
      if (e.cancelable) e.preventDefault();
      modalEl.style.transition = "none";
      modalEl.style.transform = `translateY(${Math.max(0, diffY)}px)`;
    }
  }

  function onTouchEnd() {
    if (!isSwipingDown || !modalEl) return;
    isSwipingDown = false;

    // If swiped down past threshold (> 75px), dismiss card; else snap back smoothly
    if (currentDeltaY > 75) {
      closePostcardModal();
    } else {
      modalEl.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      modalEl.style.transform = "translateY(0)";
      setTimeout(() => {
        if (modalEl) modalEl.style.transition = "";
      }, 300);
    }
  }

  if (modalEl) {
    modalEl.addEventListener("touchstart", onTouchStart, { passive: true });
    modalEl.addEventListener("touchmove", onTouchMove, { passive: false });
    modalEl.addEventListener("touchend", onTouchEnd, { passive: true });
    modalEl.addEventListener("touchcancel", onTouchEnd, { passive: true });
  }

  // Attach click & enter key handlers on cards
  root.querySelectorAll(".postcard-card").forEach((card) => {
    const placeId = card.dataset.postcardId;
    card.addEventListener("click", () => openPostcardModal(placeId));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPostcardModal(placeId);
      }
    });
  });
}
