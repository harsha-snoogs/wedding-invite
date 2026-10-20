/**
 * DetailsSection - the invitation itself (date, events, families, venue), shown
 * after the film. Everything comes from weddingData.js.
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

export function renderDetails(root, data) {
  const { bride, groom, couple, wedding, functions, families } = data;
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

      <section class="events">
        <p class="eyebrow reveal">The celebrations</p>
        <ol class="event-list">
          ${functions
            .map((fn) => {
              const d = splitDate(fn.date);
              return `
            <li class="event reveal">
              <div class="event-date"><span>${esc(d.day)}</span>${esc(d.mon)}</div>
              <div class="event-info">
                <h3>${esc(fn.title)}</h3>
                <p class="event-meta">${esc(fn.time)}</p>
                <p class="event-desc">${esc(fn.description)}</p>
              </div>
            </li>`;
            })
            .join("")}
        </ol>
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
        <p class="venue-address">${esc(wedding.address)}</p>
        <a class="btn btn-ghost" href="${esc(wedding.googleMapsUrl)}" target="_blank" rel="noopener">Open in Google Maps</a>
      </section>

      <footer class="closing reveal">
        <p class="closing-quote">${esc(couple.closingHeadline)}<br>${esc(couple.closingSubhead)}</p>
        <p class="closing-text">${esc(couple.invitationMessage)}</p>
        <p class="closing-mono">${esc(couple.monogram)}</p>
      </footer>
    </div>`;

  // Gentle fade-up as each block scrolls into view.
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
}
