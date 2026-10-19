/* ==========================================================================
   Void Walkers — Main (shared by every page)
   Navbar menu · scroll reveal · spotlight hover · site-wide details from
   data/site.json (logo, email, socials) · accordion · contact form.
   Each block checks for the DOM it needs, so one file serves every page.
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data, t = (k) => window.VW.i18n.t(k);

  /* ---------------- scroll reveal ---------------- */
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.remove("is-pending"); observer.unobserve(en.target); }
      }), { rootMargin: "0px 0px -6% 0px" })
    : null;

  function revealOnScroll(scope) {
    if (!observer) return;
    (scope || document).querySelectorAll("[data-reveal]").forEach((el) => {
      if (el.dataset.seen) return;
      el.dataset.seen = "1";
      if (el.getBoundingClientRect().top > innerHeight * 0.94) { el.classList.add("is-pending"); observer.observe(el); }
    });
  }
  window.VW.revealOnScroll = revealOnScroll;
  document.addEventListener("DOMContentLoaded", () => revealOnScroll());

  /* ---------------- navbar ---------------- */
  (function () {
    const navbar = document.getElementById("navbar"), toggle = document.getElementById("navToggle");
    if (!navbar || !toggle) return;
    const setOpen = (open) => { navbar.setAttribute("data-open", String(open)); toggle.setAttribute("aria-expanded", String(open)); };
    toggle.addEventListener("click", () => setOpen(navbar.getAttribute("data-open") !== "true"));
    navbar.querySelectorAll(".navbar__link").forEach((l) => l.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  })();

  /* ---------------- spotlight hover ---------------- */
  (function () {
    const SELECTOR = ".org-node, .org-tile, .panel, .ladder-step, .form-card, .accordion-item, .principle, .channel-card, .step-card, .module-card, .slot-card, .cta-banner, .next-event";
    document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("spot"));
    let frame = 0, pending = null;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      pending = { el, x: e.clientX, y: e.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = pending.el.getBoundingClientRect();
        pending.el.style.setProperty("--mx", pending.x - r.left + "px");
        pending.el.style.setProperty("--my", pending.y - r.top + "px");
      });
    }, { passive: true });
  })();

  /* ---------------- site details (data/site.json) ---------------- */
  D.load("site").then((res) => {
    const site = res.ok ? res.data : {};
    const mail = site.email || "off.voidwalker@gmail.com";

    // logo — falls back to the bundled violet/black placeholder if the file isn't there yet
    document.querySelectorAll("[data-site-logo]").forEach((img) => {
      img.addEventListener("error", () => { if (!img.dataset.fell) { img.dataset.fell = "1"; img.src = D.url("assets/img/logo-placeholder.svg"); } });
      img.src = D.url(site.logo || "assets/img/logo-placeholder.svg");
    });

    const socials = [
      { key: "instagram", href: site.instagram, label: "Instagram", icon: "instagram" },
      { key: "discord", href: site.discord && site.discord.url, label: "Discord · " + ((site.discord && site.discord.name) || "Void Walkers"), icon: "discord" },
      { key: "mail", href: "mailto:" + mail, label: mail, icon: "mail" },
    ];
    document.querySelectorAll("[data-social]").forEach((box) => {
      box.innerHTML = socials.map((s) => s.href
        ? `<a class="social-link" href="${D.esc(s.href)}" ${s.key === "mail" ? "" : 'target="_blank" rel="noopener noreferrer"'} aria-label="${D.esc(s.label)}">${iconForPlatform(s.icon)}</a>`
        : `<span class="social-link social-link--static" title="${D.esc(s.label)}" aria-label="${D.esc(s.label)}">${iconForPlatform(s.icon)}</span>`).join("");
    });

    const handle = "@" + String(site.instagram || "").replace(/\/+$/, "").split("/").pop();
    const hrefs = { email: "mailto:" + mail, instagram: site.instagram, discord: site.discord && site.discord.url };
    const texts = { email: mail, instagram: handle, discord: (site.discord && site.discord.name) || "Void Walkers" };
    document.querySelectorAll("[data-site-href]").forEach((a) => { const h = hrefs[a.dataset.siteHref]; if (h) a.setAttribute("href", h); });
    document.querySelectorAll("[data-site-text]").forEach((el) => { el.textContent = texts[el.dataset.siteText] || ""; });
  });

  /* ---------------- accordion (help.html) ---------------- */
  document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => trigger.setAttribute("aria-expanded", String(trigger.getAttribute("aria-expanded") !== "true")));
  });

  /* ---------------- contact form (contact.html) ---------------- */
  (function () {
    const form = document.getElementById("contactForm");
    if (!form) return;
    const success = document.getElementById("contactSuccess"), submit = document.getElementById("contactSubmit");
    const F = { name: document.getElementById("contactName"), email: document.getElementById("contactEmail"), message: document.getElementById("contactMessage") };
    const E = { name: document.getElementById("contactNameError"), email: document.getElementById("contactEmailError"), message: document.getElementById("contactMessageError") };

    function validate() {
      const checks = {
        name: F.name.value.trim().length > 0,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(F.email.value.trim()),
        message: F.message.value.trim().length >= 10,
      };
      Object.keys(checks).forEach((k) => { E[k].textContent = checks[k] ? "" : t("contact.err." + k); F[k].setAttribute("aria-invalid", String(!checks[k])); });
      return Object.values(checks).every(Boolean);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;
      submit.disabled = true;
      submit.querySelector("span").textContent = t("contact.sending");
      const res = await window.VW.sendToTeam({ subject: `Website message from ${F.name.value.trim()}`, fields: { name: F.name.value.trim(), email: F.email.value.trim(), message: F.message.value.trim() } });
      submit.disabled = false;
      submit.querySelector("span").textContent = t("contact.send");
      success.querySelector("p").textContent = t(res.via === "mailto" ? "contact.sent.mailto" : "contact.sent.desc");
      success.setAttribute("data-visible", "true");
      success.setAttribute("tabindex", "-1");
      success.focus();
      if (res.via === "service") form.reset();
    });

    Object.values(F).forEach((f) => f.addEventListener("input", () => { if (success.getAttribute("data-visible") === "true") success.setAttribute("data-visible", "false"); }));
  })();
})();
