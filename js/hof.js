/* ==========================================================================
   Void Walkers — Hall of Fame (hall-of-fame.html)
   Source: data/hall-of-fame.json (poster, name, details, team, gallery and the
   APPROVED reviews for each past event). Visitors submit reviews through the
   form in the dialog; those arrive by email, and you paste the good ones into
   the JSON — so nothing unmoderated ever appears on the site.
   Deep link: hall-of-fame.html#<id> opens that entry.
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data, t = (k) => window.VW.i18n.t(k);
  const grid = document.getElementById("hofGrid");
  const dialog = document.getElementById("hofDialog");
  if (!grid || !dialog) return;
  const body = document.getElementById("hofDialogBody");
  const errorSlot = document.getElementById("hofError");

  let items = [], status = "loading", openId = null;

  const stars = (n) => "●".repeat(n) + "○".repeat(5 - n);
  const avg = (it) => { const r = (it.reviews || []).filter((x) => x.rating); return r.length ? r.reduce((s, x) => s + Number(x.rating), 0) / r.length : 0; };

  function posterHTML(it, large) {
    const img = it.poster ? `<img src="${D.esc(D.url(it.poster))}" alt="${large ? D.esc(it.title) : ""}" loading="lazy" data-hide-on-error>` : "";
    return `<div class="poster-card__img">${img}<div class="poster-card__fallback" aria-hidden="true"><span>${D.esc(it.category || "")}</span><strong>${D.esc(it.title)}</strong></div></div>`;
  }

  function renderGrid() {
    if (errorSlot) errorSlot.innerHTML = "";
    if (status === "error") {
      grid.innerHTML = "";
      if (errorSlot) errorSlot.innerHTML = `<div class="error-banner" role="alert"><div><p class="error-banner__title">${D.esc(t("hof.error"))}</p><p class="error-banner__message">${D.esc(t("common.error"))}</p></div></div>`;
      return;
    }
    if (!items.length) { grid.innerHTML = `<div class="empty-state">${D.esc(t("hof.empty"))}</div>`; return; }
    grid.innerHTML = items.map((it, i) => {
      const a = avg(it);
      return `<button type="button" class="poster-card spot" data-id="${D.esc(it.id)}" style="--i:${Math.min(i, 8)}" data-reveal>
        ${posterHTML(it)}
        <span class="poster-card__body"><span class="poster-card__title">${D.esc(it.title)}</span>
          <span class="poster-card__sub">${D.esc([it.result, D.fmtDate(it.date)].filter(Boolean).join(" · "))}</span>
          ${a ? `<span class="poster-card__stars" aria-label="${a.toFixed(1)} / 5">${stars(Math.round(a))}</span>` : ""}</span>
      </button>`;
    }).join("");
    if (window.VW.revealOnScroll) window.VW.revealOnScroll(grid);
  }

  function reviewsHTML(it) {
    const r = it.reviews || [];
    return r.length ? r.map((x) => `<li class="review"><div class="review__head"><strong>${D.esc(x.name)}</strong>${x.rating ? `<span class="review__stars" aria-label="${Number(x.rating)} / 5">${stars(Math.round(x.rating))}</span>` : ""}<small>${D.esc(x.date ? D.fmtDate(x.date) : "")}</small></div><p>${D.esc(x.text)}</p></li>`).join("")
      : `<li class="review review--empty">${D.esc(t("hof.noreviews"))}</li>`;
  }

  function openItem(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    openId = id;
    const team = (it.team || []).map((n) => `<span class="tag">${D.esc(n)}</span>`).join("");
    const gallery = (it.gallery || []).map((g) => `<img src="${D.esc(D.url(g))}" alt="" loading="lazy" data-hide-on-error>`).join("");
    body.innerHTML = `
      <div class="modal__poster">${posterHTML(it, true)}</div>
      <div class="modal__content">
        <span class="label">${D.esc([it.category, D.fmtDate(it.date)].filter(Boolean).join(" · "))}</span>
        <h2 id="hofDialogTitle" class="modal__title">${D.esc(it.title)}</h2>
        ${it.result ? `<p class="modal__result">${D.esc(it.result)}</p>` : ""}
        <p>${D.esc(it.summary || "")}</p>
        ${it.details ? `<p>${D.esc(it.details)}</p>` : ""}
        ${team ? `<h3 class="label">${D.esc(t("hof.team"))}</h3><div class="event-card__tags">${team}</div>` : ""}
        ${gallery ? `<h3 class="label">${D.esc(t("hof.gallery"))}</h3><div class="gallery">${gallery}</div>` : ""}
        <h3 class="label">${D.esc(t("hof.reviews"))}</h3>
        <ul class="reviews">${reviewsHTML(it)}</ul>

        <form class="review-form" id="reviewForm" novalidate>
          <h3 class="label">${D.esc(t("hof.review.title"))}</h3>
          <div class="review-form__row">
            <input class="form-control" name="name" required autocomplete="name" placeholder="${D.esc(t("hof.review.name"))}" aria-label="${D.esc(t("hof.review.name"))}">
            <select class="form-control" name="rating" aria-label="${D.esc(t("hof.review.rating"))}">
              ${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${stars(n)} (${n}/5)</option>`).join("")}
            </select>
          </div>
          <textarea class="form-control" name="text" required minlength="10" placeholder="${D.esc(t("hof.review.text"))}" aria-label="${D.esc(t("hof.review.text"))}"></textarea>
          <div class="review-form__foot"><button class="btn btn--primary" type="submit"><span>${D.esc(t("hof.review.send"))}</span></button><p class="form-error" id="reviewMsg" role="status"></p></div>
        </form>
      </div>`;
    if (!dialog.open) dialog.showModal();
    history.replaceState(null, "", "#" + id);

    const form = body.querySelector("#reviewForm"), msg = body.querySelector("#reviewMsg");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(form);
      if (!String(f.get("name")).trim() || String(f.get("text")).trim().length < 10) { msg.textContent = t("contact.err.message"); return; }
      msg.textContent = "…";
      const res = await window.VW.sendToTeam({ subject: `Hall of Fame review: ${it.title}`, fields: { event: it.title, name: f.get("name"), rating: f.get("rating") + "/5", review: f.get("text") } });
      msg.classList.add("is-ok");
      msg.textContent = t(res.via === "mailto" ? "hof.review.mailto" : "hof.review.thanks");
      form.reset();
    });
  }

  function closeItem() { if (dialog.open) dialog.close(); }

  grid.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) openItem(b.dataset.id); });
  dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.closest("[data-close]")) closeItem(); });
  dialog.addEventListener("close", () => { openId = null; history.replaceState(null, "", location.pathname); });
  addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id) openItem(id); });

  D.load("hall-of-fame").then((res) => {
    if (res.ok) { items = (Array.isArray(res.data.items) ? res.data.items : []).slice().sort((a, b) => new Date(b.date) - new Date(a.date)); status = "ok"; } else status = "error";
    renderGrid();
    if (location.hash) openItem(location.hash.slice(1));
  });
  document.addEventListener("vw:lang", () => { if (status !== "loading") { renderGrid(); if (openId) openItem(openId); } });
})();
