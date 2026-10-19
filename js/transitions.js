/* ==========================================================================
   Void Walkers — Page transitions
   Real multi-page navigation (no SPA). Browsers with cross-document View
   Transitions (Chrome 126+, Safari 18.2+) animate natively via the
   @view-transition rule in css/global.css. Everywhere else this script plays
   an exit animation (html.is-leaving) before following the link, and the next
   page's [data-reveal] elements animate in. Links are also prefetched on
   hover/focus so the destination is ready by the time the transition ends.
   ========================================================================== */

(function () {
  "use strict";

  const nativeVT = "CSSViewTransitionRule" in window;
  const root = document.documentElement;
  const prefetched = new Set();

  const motionOff = () =>
    root.dataset.fx === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;

  function internalLink(a) {
    if (!a || !a.href) return null;
    if (a.target && a.target !== "_self") return null;
    if (a.hasAttribute("download")) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname && url.search === location.search) return null; // same page or in-page hash
    return url;
  }

  function prefetch(e) {
    const a = e.target.closest && e.target.closest("a[href]");
    const url = internalLink(a);
    if (!url || prefetched.has(url.href)) return;
    prefetched.add(url.href);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url.href;
    document.head.appendChild(link);
  }

  document.addEventListener("pointerover", prefetch, { passive: true });
  document.addEventListener("focusin", prefetch);

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a[href]");
    const url = internalLink(a);
    if (!url) return;

    document.dispatchEvent(new CustomEvent("vw:leaving"));   // lets settings.js save the audio position
    if (nativeVT || motionOff()) return;                      // browser handles it (or no animation wanted)

    e.preventDefault();
    root.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, 300);
  });

  // Back/forward cache restores the old DOM — make sure it isn't stuck mid-exit.
  addEventListener("pageshow", (e) => { if (e.persisted) root.classList.remove("is-leaving"); });
})();
