/* ==========================================================================
   Void Walkers — Data + helpers
   There is no backend. Everything the site shows lives in plain JSON files
   under data/ (and merch/data/) that you edit by hand:
     site.json · team.json · events.json · hall-of-fame.json · playlist.json
   Pages inside a sub-folder (merch/) set <body data-base="../"> so the same
   paths resolve from there.
   ========================================================================== */

window.VW = window.VW || {};

(function () {
  "use strict";
  const cache = {};
  const base = () => document.body.dataset.base || "";

  /** Resolve a site-relative path (image, audio, link) for the current page depth. */
  function url(path) {
    if (!path) return "";
    return /^(https?:|data:|\/)/.test(path) ? path : base() + path;
  }

  /** Fetch data/<name>.json (or merch/data/<name>.json with scope "merch"). Resolves {ok,data,error}. */
  function load(name, scope) {
    const key = (scope || "") + name;
    if (!cache[key]) {
      const path = scope === "merch" ? "merch/data/" : "data/";
      cache[key] = fetch(url(path + name + ".json"), { cache: "no-cache" })
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then((data) => ({ ok: true, data }))
        .catch((e) => ({ ok: false, data: null, error: String(e.message || e) }));
    }
    return cache[key];
  }

  const esc = (v) => (v === null || v === undefined ? "" : String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"));

  const initial = (name) => (String(name || "").trim().charAt(0).toUpperCase() || "?");

  /** <img> that falls back to an initial if the file is missing (handled by the capture listener below). */
  function photo(src, name, cls) {
    const c = cls || "photo";
    if (!src) return `<span class="${c} ${c}--initial" aria-hidden="true">${esc(initial(name))}</span>`;
    return `<img class="${c}" src="${esc(url(src))}" alt="${esc(name)}" loading="lazy" decoding="async" data-initial="${esc(initial(name))}">`;
  }

  document.addEventListener("error", (e) => {
    const el = e.target;
    if (el && el.tagName === "IMG" && el.dataset.hideOnError !== undefined) { el.remove(); return; }   // posters: fall back to the generated card
    if (!el || el.tagName !== "IMG" || el.dataset.initial === undefined) return;
    const span = document.createElement("span");
    span.className = el.className + " " + el.className.split(" ")[0] + "--initial";
    span.setAttribute("aria-hidden", "true");
    span.textContent = el.dataset.initial;
    el.replaceWith(span);
  }, true);

  function fmtDate(value, opts) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value || "");
    return d.toLocaleDateString(window.VW.i18n ? window.VW.i18n.lang : "en", opts || { year: "numeric", month: "short", day: "numeric" });
  }

  window.VW.data = { load, url, esc, initial, photo, fmtDate };
})();
