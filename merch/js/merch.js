/* ==========================================================================
   Void Walkers — Merch storefront shell (merch/js/merch.js)
   Reads merch/data/status.json + merch/data/products.json.
   • status.state = "under-construction" → boot log, progress, module map and
     redacted drop slots. Set it to "live" to show the real product grid.
   • Everything else (cart, checkout, accounts, orders) is a separate page in
     this folder so each can grow into its own module — see merch/README.md.
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data;
  const term = document.getElementById("terminalBody");
  const modulesEl = document.getElementById("moduleGrid");
  const slotsEl = document.getElementById("slotGrid");
  const progress = document.getElementById("progressBar");
  const tag = document.getElementById("sysTag");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.fx === "reduced";

  const STATE_LABEL = { live: "Live", building: "Building", queued: "Queued" };

  function bootLines(status) {
    const mods = status.modules || [];
    const lines = [{ c: "hl", t: "> boot merch.sys --env=void" }, { c: "q", t: "  resolving modules…" }];
    mods.forEach((m) => {
      const mark = m.state === "live" ? ["ok", "[ ok ]"] : m.state === "building" ? ["wip", "[ .. ]"] : ["q", "[ -- ]"];
      lines.push({ c: mark[0], t: `${mark[1]} ${m.id.padEnd(10)} ${m.state}` });
    });
    lines.push({ c: "hl", t: `> status: ${String(status.state).toUpperCase().replace("-", " ")}   eta: ${status.eta || "TBA"}` });
    return lines;
  }

  function typeLines(lines) {
    if (!term) return;
    if (still) { term.innerHTML = lines.map((l) => `<span class="${l.c}">${D.esc(l.t)}</span>`).join("\n"); return; }
    let li = 0, ci = 0, html = "";
    (function tick() {
      if (li >= lines.length) { term.innerHTML = html + '<span class="terminal__cursor"></span>'; return; }
      const l = lines[li];
      ci += 2;
      const partial = `<span class="${l.c}">${D.esc(l.t.slice(0, ci))}</span>`;
      term.innerHTML = html + partial + '<span class="terminal__cursor"></span>';
      if (ci >= l.t.length) { html += `<span class="${l.c}">${D.esc(l.t)}</span>\n`; li++; ci = 0; setTimeout(tick, 120); } else setTimeout(tick, 16);
    })();
  }

  function renderProgress(mods) {
    if (!progress || !mods.length) return;
    const score = mods.reduce((s, m) => s + (m.state === "live" ? 1 : m.state === "building" ? 0.5 : 0), 0) / mods.length;
    const on = Math.round(score * 24), cells = [];
    for (let i = 0; i < 24; i++) cells.push(`<i class="${i < on ? "on" : i === on ? "pulse" : ""}"></i>`);
    progress.innerHTML = cells.join("");
    const pct = document.getElementById("progressPct");
    if (pct) pct.textContent = Math.round(score * 100) + "%";
  }

  D.load("status", "merch").then((res) => {
    const status = res.ok ? res.data : { state: "under-construction", modules: [] };
    const mods = status.modules || [];
    if (tag) tag.dataset.state = status.state === "live" ? "live" : "wip";
    typeLines(bootLines(status));
    renderProgress(mods);
    if (modulesEl) {
      modulesEl.innerHTML = mods.map((m) => `
        <a class="module-card spot" href="${D.esc(m.page || "#")}">
          <span class="state state--${D.esc(m.state)}">${STATE_LABEL[m.state] || D.esc(m.state)}</span>
          <h3>${D.esc(m.name)}</h3><p>${D.esc(m.note || "")}</p></a>`).join("");
    }
  });

  D.load("products", "merch").then((res) => {
    const list = res.ok && Array.isArray(res.data.products) ? res.data.products : [];
    if (!slotsEl) return;
    if (list.length) {
      slotsEl.className = "slot-grid";
      slotsEl.innerHTML = list.map((p) => `
        <article class="product-card spot">
          ${p.image ? `<img src="${D.esc(D.url(p.image))}" alt="${D.esc(p.name)}" loading="lazy" data-hide-on-error>` : ""}
          <h3>${D.esc(p.name)}</h3><span class="product-card__price">₹${D.esc(p.price)}</span>
          <a class="btn btn--secondary" href="product.html?id=${encodeURIComponent(p.id)}"><span>View</span></a></article>`).join("");
      return;
    }
    slotsEl.innerHTML = Array.from({ length: 6 }, (_, i) => `
      <article class="slot-card spot" aria-label="Drop slot ${i + 1} — pending">
        <div class="slot-card__img"><span>${String(i + 1).padStart(2, "0")}</span></div>
        <div class="slot-card__meta"><span class="label">ITEM_${String(i + 1).padStart(3, "0")} · drop pending</span><div class="redact"></div><div class="redact redact--short"></div></div>
      </article>`).join("");
  });

  /* waitlist */
  const form = document.getElementById("waitlistForm");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim(), msg = document.getElementById("waitlistMsg");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.className = "form-error"; msg.textContent = "Enter a valid email address."; return; }
    const res = await window.VW.sendToTeam({ subject: "Merch waitlist signup", fields: { email } });
    msg.className = "form-error is-ok";
    msg.textContent = res.via === "mailto" ? "Your email app should open — press send to join the waitlist." : "You're on the list. We'll email you when the first drop goes live.";
    form.reset();
  });
})();
