/* ==========================================================================
   Void Walkers — Main Script
   Shared across every page: nav behavior, member/event rendering, the help
   accordion, and the contact form. Each block below checks for the DOM
   nodes it needs before running, so this single file can be loaded on
   every page without guarding <script> tags per-page.
   ========================================================================== */

/**
 * Escapes text before it is placed inside innerHTML, since member and event
 * records come from the API and should never be treated as trusted markup.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* --------------------------------------------------------------------
   Navbar — mobile toggle
   -------------------------------------------------------------------- */
(function initNavbar() {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("navToggle");
  if (!navbar || !toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = navbar.getAttribute("data-open") === "true";
    navbar.setAttribute("data-open", String(!isOpen));
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });

  navbar.querySelectorAll(".navbar__link").forEach((link) => {
    link.addEventListener("click", () => {
      navbar.setAttribute("data-open", "false");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

/* --------------------------------------------------------------------
   Social icon registry — raw SVGs, no external icon library
   -------------------------------------------------------------------- */
const SOCIAL_ICONS = {
  twitter:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.9 3H21.7L15.5 10.1L22.8 21H17.1L12.6 14.6L7.5 21H4.7L11.3 13.4L4.3 3H10.1L14.2 8.9L18.9 3ZM17.9 19.2H19.5L9.3 4.7H7.6L17.9 19.2Z" fill="currentColor"/></svg>',
  x:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.9 3H21.7L15.5 10.1L22.8 21H17.1L12.6 14.6L7.5 21H4.7L11.3 13.4L4.3 3H10.1L14.2 8.9L18.9 3ZM17.9 19.2H19.5L9.3 4.7H7.6L17.9 19.2Z" fill="currentColor"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.21C2 16.71 4.87 20.53 8.84 21.88C9.34 21.97 9.52 21.66 9.52 21.39C9.52 21.15 9.51 20.41 9.51 19.62C7 20.1 6.35 19 6.15 18.43C6.04 18.14 5.55 17.3 5.12 17.07C4.77 16.88 4.27 16.4 5.11 16.39C5.9 16.38 6.46 17.13 6.65 17.43C7.55 18.96 8.98 18.53 9.55 18.27C9.64 17.6 9.9 17.15 10.19 16.9C7.95 16.65 5.6 15.77 5.6 11.88C5.6 10.77 5.99 9.86 6.67 9.15C6.56 8.9 6.21 7.86 6.77 6.46C6.77 6.46 7.65 6.18 9.52 7.47C10.3 7.25 11.14 7.14 11.98 7.14C12.82 7.14 13.66 7.25 14.44 7.47C16.31 6.17 17.19 6.46 17.19 6.46C17.75 7.86 17.4 8.9 17.29 9.15C17.97 9.86 18.36 10.76 18.36 11.88C18.36 15.78 16 16.65 13.76 16.9C14.12 17.21 14.43 17.81 14.43 18.74C14.43 20.06 14.42 21.05 14.42 21.39C14.42 21.66 14.6 21.98 15.1 21.88C19.07 20.53 21.94 16.71 21.94 12.21C21.94 6.58 17.46 2 12 2Z" fill="currentColor"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6.94 5C6.94 6.1 6.05 7 4.94 7C3.83 7 2.94 6.1 2.94 5C2.94 3.9 3.83 3 4.94 3C6.05 3 6.94 3.9 6.94 5ZM3.06 8.75H6.81V21H3.06V8.75ZM10.19 8.75H13.78V10.36H13.83C14.33 9.43 15.53 8.45 17.33 8.45C21.13 8.45 21.83 10.93 21.83 14.16V21H18.08V14.9C18.08 13.5 18.06 11.69 16.13 11.69C14.18 11.69 13.88 13.22 13.88 14.8V21H10.19V8.75Z" fill="currentColor"/></svg>',
  discord:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.9 6.3C17.66 5.72 16.35 5.31 14.98 5.08C14.96 5.08 14.94 5.09 14.93 5.11C14.76 5.42 14.57 5.83 14.44 6.14C12.97 5.92 11.5 5.92 10.05 6.14C9.92 5.82 9.73 5.42 9.55 5.11C9.54 5.09 9.52 5.08 9.5 5.08C8.13 5.31 6.83 5.72 5.58 6.3C5.57 6.3 5.56 6.31 5.55 6.32C3.02 10.1 2.33 13.79 2.67 17.43C2.67 17.45 2.68 17.46 2.7 17.47C4.35 18.68 5.94 19.42 7.51 19.91C7.53 19.92 7.55 19.91 7.56 19.9C7.93 19.4 8.26 18.87 8.54 18.31C8.56 18.28 8.54 18.24 8.51 18.23C7.99 18.03 7.49 17.79 7.01 17.51C6.98 17.49 6.98 17.45 7 17.43C7.1 17.35 7.2 17.27 7.3 17.19C7.32 17.17 7.35 17.17 7.37 17.18C10.51 18.62 13.91 18.62 17.02 17.18C17.04 17.17 17.07 17.17 17.09 17.19C17.19 17.27 17.29 17.35 17.39 17.43C17.41 17.45 17.41 17.49 17.38 17.51C16.9 17.8 16.4 18.03 15.88 18.23C15.85 18.24 15.84 18.28 15.85 18.31C16.14 18.87 16.47 19.4 16.83 19.9C16.85 19.91 16.87 19.92 16.89 19.91C18.47 19.42 20.06 18.68 21.71 17.47C21.72 17.46 21.73 17.45 21.73 17.43C22.13 13.23 21.06 9.58 18.94 6.32C18.93 6.31 18.92 6.3 18.9 6.3ZM8.68 15.19C7.74 15.19 6.96 14.32 6.96 13.25C6.96 12.18 7.72 11.31 8.68 11.31C9.65 11.31 10.41 12.19 10.4 13.25C10.4 14.32 9.65 15.19 8.68 15.19ZM15.33 15.19C14.39 15.19 13.61 14.32 13.61 13.25C13.61 12.18 14.37 11.31 15.33 11.31C16.3 11.31 17.06 12.19 17.05 13.25C17.05 14.32 16.3 15.19 15.33 15.19Z" fill="currentColor"/></svg>',
  website:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" stroke-width="1.6"/><path d="M3 12H21" stroke="currentColor" stroke-width="1.6"/><path d="M12 3C14.2091 5.5 15.4 8.6 15.4 12C15.4 15.4 14.2091 18.5 12 21C9.79086 18.5 8.6 15.4 8.6 12C8.6 8.6 9.79086 5.5 12 3Z" stroke="currentColor" stroke-width="1.6"/></svg>',
  default:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9.5 14.5L14.5 9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M11 7.5L11.6 6.9C13 5.5 15.3 5.5 16.7 6.9C18.1 8.3 18.1 10.6 16.7 12L16.1 12.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M13 16.5L12.4 17.1C11 18.5 8.7 18.5 7.3 17.1C5.9 15.7 5.9 13.4 7.3 12L7.9 11.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

function iconForPlatform(platform) {
  const key = String(platform || "").toLowerCase();
  return SOCIAL_ICONS[key] || SOCIAL_ICONS.default;
}

/* --------------------------------------------------------------------
   Members grid (index.html)
   -------------------------------------------------------------------- */
(function initMembers() {
  const grid = document.getElementById("membersGrid");
  const errorSlot = document.getElementById("membersError");
  if (!grid) return;

  function renderSkeletons(count) {
    grid.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      const card = document.createElement("div");
      card.className = "skeleton-card";
      card.setAttribute("aria-hidden", "true");
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="skeleton-line skeleton-avatar"></div>
          <div class="skeleton-line skeleton-line--title"></div>
        </div>
        <div style="display:flex;gap:8px;">
          <div class="skeleton-line skeleton-line--tag"></div>
          <div class="skeleton-line skeleton-line--tag"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="skeleton-line skeleton-line--text"></div>
          <div class="skeleton-line skeleton-line--text"></div>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  function renderError(message) {
    grid.innerHTML = "";
    if (!errorSlot) return;
    errorSlot.innerHTML = `
      <div class="error-banner" role="alert">
        <svg class="error-banner__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 9V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 16.5H12.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M10.29 3.86L1.82 18A1.5 1.5 0 003.09 20.25H20.91A1.5 1.5 0 0022.18 18L13.71 3.86A1.5 1.5 0 0010.29 3.86Z" stroke="currentColor" stroke-width="1.6"/>
        </svg>
        <div>
          <p class="error-banner__title">Couldn't load the crew</p>
          <p class="error-banner__message">${escapeHTML(message)}</p>
        </div>
      </div>
    `;
  }

  function renderEmpty() {
    grid.innerHTML = `<div class="empty-state">No members are listed yet. Check back soon.</div>`;
  }

  function renderMembers(members) {
    grid.innerHTML = "";
    if (errorSlot) errorSlot.innerHTML = "";

    if (!Array.isArray(members) || members.length === 0) {
      renderEmpty();
      return;
    }

    // Founder/Executive first, then every other role in hierarchy order —
    // see js/roles.js. A member's position here is driven entirely by
    // their `role` field, so whoever holds "Founder / Executive" (e.g.
    // Saber, Godspeed) naturally sorts to the top without hardcoding names.
    const ordered = typeof sortMembersByHierarchy === "function" ? sortMembersByHierarchy(members) : members;

    ordered.forEach((member, index) => {
      const uName = member && member.uName ? String(member.uName) : "Unknown";
      const categories = Array.isArray(member && member.category) ? member.category : [];
      const description =
        member && member.description ? String(member.description) : "No bio provided yet.";
      const socials = member && member.socials && typeof member.socials === "object" ? member.socials : {};
      const initial = uName.trim().charAt(0).toUpperCase() || "?";
      const roleInfo = typeof getRoleInfo === "function" ? getRoleInfo(member && member.role) : null;

      const tagsHTML = categories
        .map((cat) => `<span class="tag">${escapeHTML(cat)}</span>`)
        .join("");

      const socialsHTML = Object.keys(socials)
        .filter((platform) => Boolean(socials[platform]))
        .map((platform) => {
          const url = String(socials[platform]);
          return `<a class="social-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(
            uName
          )} on ${escapeHTML(platform)}">${iconForPlatform(platform)}</a>`;
        })
        .join("");

      const card = document.createElement("article");
      card.className = "member-card";
      card.style.animationDelay = `${Math.min(index, 8) * 60}ms`;
      card.innerHTML = `
        <div class="member-card__header">
          <div class="member-card__avatar" aria-hidden="true">${escapeHTML(initial)}</div>
          <div>
            <div class="member-card__name">${escapeHTML(uName)}</div>
            ${
              roleInfo
                ? `<span class="role-pill" data-tier="${escapeHTML(roleInfo.tier)}">${escapeHTML(roleInfo.role)}</span>`
                : ""
            }
          </div>
        </div>
        ${tagsHTML ? `<div class="member-card__tags">${tagsHTML}</div>` : ""}
        <p class="member-card__description">${escapeHTML(description)}</p>
        ${socialsHTML ? `<div class="member-card__footer">${socialsHTML}</div>` : ""}
      `;
      grid.appendChild(card);
    });
  }

  renderSkeletons(6);

  fetchMembers().then((result) => {
    if (!result.ok) {
      renderError(result.error || "Unable to reach the server right now.");
      return;
    }
    renderMembers(result.data);
  });
})();

/* --------------------------------------------------------------------
   Events table (database.html)

   NOTE: the backend struct for /api/Events was not specified in the
   brief the way /api/Members was. Rendering below assumes the common
   CTF-tracker shape (name, format, startDate, endDate, status, rank,
   points, url) and falls back to "—" for any field that is missing, so
   the table still renders cleanly if the real struct differs slightly.
   Update the field names below to match the actual Go struct once
   confirmed.
   -------------------------------------------------------------------- */
(function initEvents() {
  const tbody = document.getElementById("eventsTableBody");
  const errorSlot = document.getElementById("eventsError");
  const wrap = document.getElementById("eventsTableWrap");
  const emptySlot = document.getElementById("eventsEmpty");
  if (!tbody) return;

  const COLUMN_COUNT = 6;

  function renderSkeletonRows(count) {
    tbody.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      const row = document.createElement("tr");
      row.setAttribute("aria-hidden", "true");
      let cells = "";
      for (let c = 0; c < COLUMN_COUNT; c += 1) {
        cells += `<td><div class="data-table__skeleton-cell" style="width:${60 + ((c * 13) % 30)}%;"></div></td>`;
      }
      row.innerHTML = cells;
      tbody.appendChild(row);
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHTML(String(value));
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function renderError(message) {
    tbody.innerHTML = "";
    if (wrap) wrap.style.display = "none";
    if (!errorSlot) return;
    errorSlot.innerHTML = `
      <div class="error-banner" role="alert">
        <svg class="error-banner__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 9V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 16.5H12.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M10.29 3.86L1.82 18A1.5 1.5 0 003.09 20.25H20.91A1.5 1.5 0 0022.18 18L13.71 3.86A1.5 1.5 0 0010.29 3.86Z" stroke="currentColor" stroke-width="1.6"/>
        </svg>
        <div>
          <p class="error-banner__title">Couldn't load events</p>
          <p class="error-banner__message">${escapeHTML(message)}</p>
        </div>
      </div>
    `;
  }

  function renderEvents(events) {
    tbody.innerHTML = "";
    if (errorSlot) errorSlot.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      if (wrap) wrap.style.display = "none";
      if (emptySlot) emptySlot.innerHTML = `<div class="empty-state">No events logged yet. Check back soon.</div>`;
      return;
    }

    if (wrap) wrap.style.display = "";
    if (emptySlot) emptySlot.innerHTML = "";

    events.forEach((event) => {
      const name = event && (event.name || event.title) ? String(event.name || event.title) : "Untitled event";
      const format = event && event.format ? String(event.format) : "—";
      const status = event && event.status ? String(event.status).toLowerCase() : "concluded";
      const rank = event && (event.rank !== undefined && event.rank !== null) ? String(event.rank) : "—";
      const points = event && (event.points !== undefined && event.points !== null) ? String(event.points) : "—";
      const url = event && event.url ? String(event.url) : null;
      const start = event ? formatDate(event.startDate || event.start_date) : "—";

      const nameCell = url
        ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--color-text-primary);border-bottom:1px solid var(--color-border-strong);">${escapeHTML(name)}</a>`
        : escapeHTML(name);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${nameCell}</td>
        <td class="text-secondary">${escapeHTML(format)}</td>
        <td class="text-secondary">${escapeHTML(start)}</td>
        <td><span class="status-pill" data-status="${escapeHTML(status)}">${escapeHTML(status)}</span></td>
        <td class="text-secondary">${escapeHTML(rank)}</td>
        <td class="text-secondary">${escapeHTML(points)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  renderSkeletonRows(5);

  fetchEvents().then((result) => {
    if (!result.ok) {
      renderError(result.error || "Unable to reach the server right now.");
      return;
    }
    renderEvents(result.data);
  });
})();

/* --------------------------------------------------------------------
   Accordion (help.html)
   -------------------------------------------------------------------- */
(function initAccordion() {
  const triggers = document.querySelectorAll(".accordion-trigger");
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isExpanded));
    });
  });
})();

/* --------------------------------------------------------------------
   Contact form (contact.html)
   -------------------------------------------------------------------- */
(function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const successPanel = document.getElementById("contactSuccess");
  const submitButton = document.getElementById("contactSubmit");
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

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    let isValid = true;

    if (!fields.name.value.trim()) {
      errors.name.textContent = "Enter your name.";
      isValid = false;
    } else {
      errors.name.textContent = "";
    }

    if (!fields.email.value.trim() || !validEmail(fields.email.value.trim())) {
      errors.email.textContent = "Enter a valid email address.";
      isValid = false;
    } else {
      errors.email.textContent = "";
    }

    if (!fields.message.value.trim() || fields.message.value.trim().length < 10) {
      errors.message.textContent = "Message should be at least 10 characters.";
      isValid = false;
    } else {
      errors.message.textContent = "";
    }

    return isValid;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validate()) return;

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";

    // The backend does not currently expose a contact/messages endpoint —
    // only /api/Members and /api/Events are documented — so submission is
    // handled client-side and confirmed here rather than posted to a
    // fabricated route.
    window.setTimeout(() => {
      form.reset();
      submitButton.disabled = false;
      submitButton.textContent = "Send message";
      if (successPanel) {
        successPanel.setAttribute("data-visible", "true");
        successPanel.setAttribute("tabindex", "-1");
        successPanel.focus();
      }
    }, 600);
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => {
      if (successPanel && successPanel.getAttribute("data-visible") === "true") {
        successPanel.setAttribute("data-visible", "false");
      }
    });
  });
})();
