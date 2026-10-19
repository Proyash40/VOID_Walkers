/* ==========================================================================
   Void Walkers — Events page (events.html)
   Source: data/events.json. Shows events we are organising and ones we are
   competing in; finished events disappear automatically (move the memorable
   ones to data/hall-of-fame.json). Includes a live countdown to the next one.
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data, t = (k) => window.VW.i18n.t(k);
  const list = document.getElementById("eventsList");
  if (!list) return;
  const banner = document.getElementById("nextEvent");
  const errorSlot = document.getElementById("eventsError");

  let events = [], filter = "all", status = "loading", timer = 0;

  const endOf = (e) => new Date((e.endDate || e.date) + "T23:59:59").getTime();
  const startOf = (e) => new Date(e.date + "T00:00:00").getTime();

  function cardHTML(e, i) {
    const tags = (e.tags || []).map((x) => `<span class="tag">${D.esc(x)}</span>`).join("");
    return `<article class="event-card spot" data-type="${D.esc(e.type)}" style="--i:${Math.min(i, 8)}" data-reveal>
      <div class="event-card__date" aria-hidden="true"><span>${D.esc(D.fmtDate(e.date, { day: "2-digit" }))}</span><small>${D.esc(D.fmtDate(e.date, { month: "short" }))}</small></div>
      <div class="event-card__body">
        <div class="event-card__meta"><span class="badge badge--${D.esc(e.type)}">${D.esc(t("events.type." + e.type))}</span>
          <span>${D.esc([e.location, e.mode].filter(Boolean).join(" · "))}</span></div>
        <h3>${D.esc(e.title)}</h3>
        <p>${D.esc(e.description || "")}</p>
        ${tags ? `<div class="event-card__tags">${tags}</div>` : ""}
      </div>
      ${e.poster ? `<div class="event-card__poster"><img src="${D.esc(D.url(e.poster))}" alt="" loading="lazy" data-hide-on-error></div>` : ""}
      ${e.register ? `<a class="btn btn--secondary event-card__cta" href="${D.esc(e.register)}" target="_blank" rel="noopener noreferrer"><span>${D.esc(t("events.register"))}</span></a>` : ""}
    </article>`;
  }

  function countdown(e) {
    const ms = startOf(e) - Date.now();
    if (ms <= 0) return "";
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `<span class="countdown" aria-label="${D.esc(t("events.countdown"))}"><b>${pad(d)}</b><i>d</i><b>${pad(h)}</b><i>h</i><b>${pad(m)}</b><i>m</i><b>${pad(s)}</b><i>s</i></span>`;
  }

  function renderBanner(first) {
    if (!banner) return;
    if (!first) { banner.hidden = true; return; }
    banner.hidden = false;
    banner.innerHTML = `<div class="next-event__main"><span class="label">${D.esc(t("home.next.label"))}</span><p class="next-event__title">${D.esc(first.title)}</p></div>${countdown(first)}`;
  }

  function render() {
    if (errorSlot) errorSlot.innerHTML = "";
    if (status === "error") {
      list.innerHTML = "";
      if (errorSlot) errorSlot.innerHTML = `<div class="error-banner" role="alert"><div><p class="error-banner__title">${D.esc(t("events.error"))}</p><p class="error-banner__message">${D.esc(t("common.error"))}</p></div></div>`;
      return;
    }
    const upcoming = events.filter((e) => endOf(e) >= Date.now()).sort((a, b) => startOf(a) - startOf(b));
    renderBanner(upcoming[0]);
    const shown = upcoming.filter((e) => filter === "all" || e.type === filter);
    list.innerHTML = shown.length ? shown.map(cardHTML).join("") : `<div class="empty-state">${D.esc(t("events.empty"))}</div>`;
    if (window.VW.revealOnScroll) window.VW.revealOnScroll(list);
    clearInterval(timer);
    if (upcoming[0] && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setInterval(() => { const el = banner && banner.querySelector(".countdown"); if (el) el.outerHTML = countdown(upcoming[0]) || ""; }, 1000);
    }
  }

  document.querySelectorAll('input[name="evFilter"]').forEach((r) => r.addEventListener("change", () => { filter = r.value; render(); }));

  D.load("events").then((res) => {
    if (res.ok) { events = Array.isArray(res.data.events) ? res.data.events : []; status = "ok"; } else status = "error";
    render();
  });
  document.addEventListener("vw:lang", () => { if (status !== "loading") render(); });
})();
