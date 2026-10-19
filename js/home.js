/* ==========================================================================
   Void Walkers — Home page sections (index.html)
   Domains grid (data/site.json), next-event strip (data/events.json) and a
   Hall of Fame preview (data/hall-of-fame.json). The core team is rendered
   by js/people.js.
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data, t = (k) => window.VW.i18n.t(k);
  const grid = document.getElementById("domainGrid");
  const next = document.getElementById("nextEvent");
  const hof = document.getElementById("hofPreview");
  if (!grid && !next && !hof) return;

  /* ---- domains ---- */
  if (grid) {
    D.load("site").then((res) => {
      const list = res.ok && Array.isArray(res.data.domains) ? res.data.domains : [];
      grid.innerHTML = list.map((d, i) => `
        <li class="domain-card spot">
          <span class="domain-card__index">${String(i + 1).padStart(2, "0")}</span>
          <h3>${D.esc(d.title)}</h3>
          <p>${D.esc(d.blurb)}</p>
        </li>`).join("");
    });
  }

  /* ---- next event ---- */
  let nextEvent = null;
  function renderNext() {
    if (!next) return;
    if (!nextEvent) {
      next.innerHTML = `<div><span class="label">${D.esc(t("home.next.label"))}</span><p class="next-event__title">${D.esc(t("home.next.none"))}</p></div>
        <a class="btn btn--secondary" href="events.html"><span>${D.esc(t("home.next.cta"))}</span></a>`;
      return;
    }
    const e = nextEvent;
    next.innerHTML = `
      <div class="next-event__date" aria-hidden="true"><span>${D.esc(D.fmtDate(e.date, { day: "2-digit" }))}</span><small>${D.esc(D.fmtDate(e.date, { month: "short" }))}</small></div>
      <div class="next-event__main">
        <span class="label">${D.esc(t("home.next.label"))} · ${D.esc(t("events.type." + e.type))}</span>
        <p class="next-event__title">${D.esc(e.title)}</p>
        <span class="next-event__meta">${D.esc([e.location, e.mode].filter(Boolean).join(" · "))}</span>
      </div>
      <a class="btn btn--secondary" href="events.html"><span>${D.esc(t("home.next.cta"))}</span></a>`;
  }

  if (next) {
    D.load("events").then((res) => {
      const now = Date.now();
      const upcoming = res.ok && Array.isArray(res.data.events)
        ? res.data.events.filter((e) => new Date((e.endDate || e.date) + "T23:59:59").getTime() >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
      nextEvent = upcoming[0] || null;
      renderNext();
    });
    document.addEventListener("vw:lang", renderNext);
  }

  /* ---- Hall of Fame preview ---- */
  let items = [];
  function renderHof() {
    if (!hof) return;
    hof.innerHTML = items.map((it) => `
      <a class="poster-card spot" href="hall-of-fame.html#${D.esc(it.id)}">
        <div class="poster-card__img">${it.poster ? `<img src="${D.esc(D.url(it.poster))}" alt="" loading="lazy" data-hide-on-error>` : ""}
          <div class="poster-card__fallback" aria-hidden="true"><span>${D.esc(it.category || "")}</span><strong>${D.esc(it.title)}</strong></div></div>
        <div class="poster-card__body"><h3>${D.esc(it.title)}</h3><p>${D.esc([it.result, D.fmtDate(it.date)].filter(Boolean).join(" · "))}</p></div>
      </a>`).join("");
  }

  if (hof) {
    D.load("hall-of-fame").then((res) => {
      items = res.ok && Array.isArray(res.data.items) ? res.data.items.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3) : [];
      renderHof();
    });
    document.addEventListener("vw:lang", renderHof);
  }
})();
