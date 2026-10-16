/**
 * DetailsSection - the invitation itself (date, events, families, venue, RSVP), shown
 * after the film. Everything comes from weddingData.js.
 */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function parseCompact(s) {
  // "20261126T090000" -> Date
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}

function splitDate(text) {
  // "November 24, 2026" -> { day: "24", mon: "Nov" }
  const m = /^([A-Za-z]+)\s+(\d{1,2})/.exec(text);
  return m ? { day: m[2], mon: m[1].slice(0, 3) } : { day: '', mon: text };
}

function calendarUrl(c) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: c.title,
    dates: `${c.startDate}/${c.endDate}`,
    details: c.description,
    location: c.location,
    ctz: 'Asia/Kolkata'
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
  const weekday = day.toLocaleDateString('en-US', { weekday: 'long' });
  const month = day.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const family = (f, person) => `
    <article class="family reveal">
      <div class="family-arch"><img src="${esc(person.photo)}" alt="${esc(person.fullName)}" loading="lazy" decoding="async"></div>
      <h3>${esc(f.title)}</h3>
      <p class="family-sub">${esc(f.subtitle)}</p>
      <ul>
        ${f.members.map((m) => `<li><span>${esc(m.name)}</span><em>${esc(m.relation)}</em></li>`).join('')}
      </ul>
    </article>`;

  root.innerHTML = `
    <div class="details-inner">
      <header class="invite reveal">
        <p class="eyebrow">Together with their families</p>
        <h2 class="invite-names">${esc(bride.name)} <em>&amp;</em> ${esc(groom.name)}</h2>
        <p class="invite-line">request the joy of your presence at their wedding</p>
        <div class="invite-date">
          <span class="invite-dow">${esc(weekday)}</span>
          <span class="invite-day">${day.getDate()}</span>
          <span class="invite-month">${esc(month)}</span>
        </div>
        <p class="invite-time">${esc(wedding.auspiciousTime)}</p>
        <p class="invite-venue">${esc(wedding.venue)}<span>${esc(wedding.city)}</span></p>
        <div class="actions">
          <a class="btn btn-gold" href="${esc(wedding.rsvpUrl)}" target="_blank" rel="noopener">RSVP</a>
          <a class="btn btn-ghost" href="${esc(calendarUrl(wedding.calendarDetails))}" target="_blank" rel="noopener">Add to calendar</a>
        </div>
      </header>

      ${ornament}

      <section class="events">
        <p class="eyebrow reveal">The celebrations</p>
        <ol class="event-list">
          ${functions.map((fn) => {
            const d = splitDate(fn.date);
            return `
            <li class="event reveal">
              <div class="event-date"><span>${esc(d.day)}</span>${esc(d.mon)}</div>
              <div class="event-info">
                <h3>${esc(fn.title)}</h3>
                <p class="event-meta">${esc(fn.time)} · ${esc(fn.venue)}</p>
                <p class="event-desc">${esc(fn.description)}</p>
              </div>
            </li>`;
          }).join('')}
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
        <a class="btn btn-gold" href="${esc(wedding.rsvpUrl)}" target="_blank" rel="noopener">RSVP</a>
        <p class="closing-mono">${esc(couple.monogram)}</p>
      </footer>
    </div>`;

  // Gentle fade-up as each block scrolls into view.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  root.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
