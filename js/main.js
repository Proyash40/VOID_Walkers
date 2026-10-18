/* ==========================================================================
   Void Walkers — Main
   Shared by every page; each block checks for the DOM it needs, so one file
   serves all five pages. Depends on (load order): i18n.js, icons.js, api.js,
   roles.js (index only) — see the <script> tags in each page.
   ========================================================================== */

const t = (key) => window.VW.i18n.t(key);

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const ERROR_ICON = `<svg class="error-banner__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 9V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M12 16.5H12.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M10.29 3.86L1.82 18A1.5 1.5 0 003.09 20.25H20.91A1.5 1.5 0 0022.18 18L13.71 3.86A1.5 1.5 0 0010.29 3.86Z" stroke="currentColor" stroke-width="1.6"/>
</svg>`;

function errorBannerHTML(titleKey, message) {
  return `<div class="error-banner" role="alert">${ERROR_ICON}<div>
    <p class="error-banner__title">${escapeHTML(t(titleKey))}</p>
    <p class="error-banner__message">${escapeHTML(message || t("common.error"))}</p></div></div>`;
}


/* --------------------------------------------------------------------
   Scroll reveal — below-the-fold [data-reveal] / member cards wait until visible
   -------------------------------------------------------------------- */
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.remove("is-pending"); revealObserver.unobserve(en.target); }
    }), { rootMargin: "0px 0px -6% 0px" })
  : null;

function revealOnScroll(scope) {
  if (!revealObserver) return;
  (scope || document).querySelectorAll("[data-reveal], .member-card:not(.no-anim)").forEach((el) => {
    if (el.classList.contains("is-pending") || el.dataset.seen) return;
    el.dataset.seen = "1";
    if (el.getBoundingClientRect().top > innerHeight * 0.94) { el.classList.add("is-pending"); revealObserver.observe(el); }
  });
}
document.addEventListener("DOMContentLoaded", () => revealOnScroll());

/* --------------------------------------------------------------------
   Navbar — mobile menu
   -------------------------------------------------------------------- */
(function initNavbar() {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("navToggle");
  if (!navbar || !toggle) return;

  const setOpen = (open) => {
    navbar.setAttribute("data-open", String(open));
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(navbar.getAttribute("data-open") !== "true"));
  navbar.querySelectorAll(".navbar__link").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();

/* --------------------------------------------------------------------
   Spotlight hover — cursor-tracked border glow on cards / panels
   -------------------------------------------------------------------- */
(function initSpotlight() {
  const SELECTOR = ".org-node, .org-tile, .panel, .ladder-step, .form-card, .accordion-item, .principle";
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

/* --------------------------------------------------------------------
   Members grid (index.html)
   -------------------------------------------------------------------- */
(function initMembers() {
  const grid = document.getElementById("membersGrid");
  const errorSlot = document.getElementById("membersError");
  if (!grid) return;

  let view = { status: "loading", data: [], error: "" };
  let animated = false;

  function skeletons(count) {
    return Array.from({ length: count }, () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-row"><div class="skeleton-line skeleton-avatar"></div><div class="skeleton-line skeleton-line--title"></div></div>
        <div class="skeleton-row"><div class="skeleton-line skeleton-line--tag"></div><div class="skeleton-line skeleton-line--tag"></div></div>
        <div class="skeleton-row skeleton-row--stack"><div class="skeleton-line skeleton-line--text"></div><div class="skeleton-line skeleton-line--text"></div></div>
      </div>`).join("");
  }

  function cardHTML(member, index) {
    const uName = member && member.uName ? String(member.uName) : "Unknown";
    const categories = Array.isArray(member && member.category) ? member.category : [];
    const description = member && member.description ? String(member.description) : "—";
    const socials = member && member.socials && typeof member.socials === "object" ? member.socials : {};
    const initial = uName.trim().charAt(0).toUpperCase() || "?";
    const roleInfo = typeof getRoleInfo === "function" ? getRoleInfo(member && member.role) : null;

    const tags = categories.map((c) => `<span class="tag">${escapeHTML(c)}</span>`).join("");
    const links = Object.keys(socials)
      .filter((p) => Boolean(socials[p]))
      .map((p) => `<a class="social-link" href="${escapeHTML(socials[p])}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(uName)} — ${escapeHTML(p)}">${iconForPlatform(p)}</a>`)
      .join("");

    return `
      <article class="member-card spot${animated ? " no-anim" : ""}" style="animation-delay:${Math.min(index, 9) * 70}ms">
        <div class="member-card__header">
          <div class="member-card__avatar" aria-hidden="true">${escapeHTML(initial)}</div>
          <div>
            <div class="member-card__name">${escapeHTML(uName)}</div>
            ${roleInfo ? `<span class="role-pill" data-tier="${escapeHTML(roleInfo.tier)}">${escapeHTML(roleInfo.role)}</span>` : ""}
          </div>
          <span class="member-card__index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        </div>
        ${tags ? `<div class="member-card__tags">${tags}</div>` : ""}
        <p class="member-card__description">${escapeHTML(description)}</p>
        ${links ? `<div class="member-card__footer">${links}</div>` : ""}
      </article>`;
  }

  function render() {
    if (errorSlot) errorSlot.innerHTML = "";
    if (view.status === "loading") { grid.innerHTML = skeletons(6); return; }
    if (view.status === "error") {
      grid.innerHTML = "";
      if (errorSlot) errorSlot.innerHTML = errorBannerHTML("members.error.title", view.error);
      return;
    }
    if (!Array.isArray(view.data) || view.data.length === 0) {
      grid.innerHTML = `<div class="empty-state">${escapeHTML(t("members.empty"))}</div>`;
      return;
    }
    // Founder/Executive first, then down the hierarchy (see js/roles.js)
    const ordered = typeof sortMembersByHierarchy === "function" ? sortMembersByHierarchy(view.data) : view.data;
    grid.innerHTML = ordered.map(cardHTML).join("");
    revealOnScroll(grid);
    animated = true;
  }

  render();
  fetchMembers().then((result) => {
    view = result.ok ? { status: "ok", data: result.data, error: "" } : { status: "error", data: [], error: result.error };
    render();
  });

  document.addEventListener("vw:lang", () => { if (view.status !== "loading") render(); });
})();

/* --------------------------------------------------------------------
   Events table (database.html)
   NOTE: the /api/Events struct wasn't specified; this assumes name, format,
   startDate, status, rank, points, url and falls back to "—" for missing
   fields. Adjust the field names below to match your Go struct.
   -------------------------------------------------------------------- */
(function initEvents() {
  const tbody = document.getElementById("eventsTableBody");
  const errorSlot = document.getElementById("eventsError");
  const wrap = document.getElementById("eventsTableWrap");
  const emptySlot = document.getElementById("eventsEmpty");
  if (!tbody) return;

  const COLUMNS = 6;
  let view = { status: "loading", data: [], error: "" };

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(window.VW.i18n.lang, { year: "numeric", month: "short", day: "numeric" });
  }

  function rowHTML(ev) {
    const name = ev && (ev.name || ev.title) ? String(ev.name || ev.title) : t("events.untitled");
    const status = ev && ev.status ? String(ev.status).toLowerCase() : "concluded";
    const val = (v) => (v !== undefined && v !== null && v !== "" ? String(v) : "—");
    const nameCell = ev && ev.url
      ? `<a href="${escapeHTML(ev.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)}</a>`
      : escapeHTML(name);
    const statusLabel = t("events.status." + status);
    return `<tr>
      <td>${nameCell}</td>
      <td class="text-secondary">${escapeHTML(val(ev && ev.format))}</td>
      <td class="text-secondary">${escapeHTML(formatDate(ev && (ev.startDate || ev.start_date)))}</td>
      <td><span class="status-pill" data-status="${escapeHTML(status)}">${escapeHTML(statusLabel.startsWith("events.") ? status : statusLabel)}</span></td>
      <td class="text-secondary">${escapeHTML(val(ev && ev.rank))}</td>
      <td class="text-secondary">${escapeHTML(val(ev && ev.points))}</td>
    </tr>`;
  }

  function render() {
    if (errorSlot) errorSlot.innerHTML = "";
    if (emptySlot) emptySlot.innerHTML = "";
    if (wrap) wrap.hidden = false;

    if (view.status === "loading") {
      const cells = Array.from({ length: COLUMNS }, () => `<td><div class="data-table__skeleton-cell"></div></td>`).join("");
      tbody.innerHTML = Array.from({ length: 5 }, () => `<tr aria-hidden="true">${cells}</tr>`).join("");
      return;
    }
    if (view.status === "error") {
      tbody.innerHTML = "";
      if (wrap) wrap.hidden = true;
      if (errorSlot) errorSlot.innerHTML = errorBannerHTML("events.error.title", view.error);
      return;
    }
    if (!Array.isArray(view.data) || view.data.length === 0) {
      tbody.innerHTML = "";
      if (wrap) wrap.hidden = true;
      if (emptySlot) emptySlot.innerHTML = `<div class="empty-state">${escapeHTML(t("events.empty"))}</div>`;
      return;
    }
    tbody.innerHTML = view.data.map(rowHTML).join("");
  }

  render();
  fetchEvents().then((result) => {
    view = result.ok ? { status: "ok", data: result.data, error: "" } : { status: "error", data: [], error: result.error };
    render();
  });

  document.addEventListener("vw:lang", () => { if (view.status !== "loading") render(); });
})();

/* --------------------------------------------------------------------
   Accordion (help.html)
   -------------------------------------------------------------------- */
(function initAccordion() {
  document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      trigger.setAttribute("aria-expanded", String(trigger.getAttribute("aria-expanded") !== "true"));
    });
  });
})();

/* --------------------------------------------------------------------
   Contact form (contact.html)
   The backend exposes no contact endpoint (only /api/Members and
   /api/Events), so submission is validated and confirmed client-side.
   -------------------------------------------------------------------- */
(function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const success = document.getElementById("contactSuccess");
  const submit = document.getElementById("contactSubmit");
  const fields = {
    name: document.getElementById("contactName"),
    email: document.getElementById("contactEmail"),
    message: document.getElementById("contactMessage"),
  };
  const errors = {
    name: document.getElementById("contactNameError"),
    email: document.getElementById("contactEmailError"),
    message: document.getElementById("contactMessageError"),
  };

  function validate() {
    const checks = {
      name: fields.name.value.trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim()),
      message: fields.message.value.trim().length >= 10,
    };
    Object.keys(checks).forEach((k) => {
      errors[k].textContent = checks[k] ? "" : t("contact.err." + k);
      fields[k].setAttribute("aria-invalid", String(!checks[k]));
    });
    return Object.values(checks).every(Boolean);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;

    submit.disabled = true;
    submit.querySelector("span").textContent = t("contact.sending");

    setTimeout(() => {
      form.reset();
      submit.disabled = false;
      submit.querySelector("span").textContent = t("contact.send");
      if (success) {
        success.setAttribute("data-visible", "true");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    }, 650);
  });

  Object.values(fields).forEach((f) => f.addEventListener("input", () => {
    if (success && success.getAttribute("data-visible") === "true") success.setAttribute("data-visible", "false");
  }));
})();
