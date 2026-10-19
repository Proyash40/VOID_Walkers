/* ==========================================================================
   Void Walkers — People (core team + hierarchy names)
   Source of truth: data/team.json — edit names / images there.
   • index.html  → #teamRoot gets founders / management / department heads
                   (which groups: team.json → home.show).
   • hierarchy.html → names are dropped into the org chart wherever a node has
                   data-people="founders|coordinators|moderators|teamLeads" or
                   a tile has data-slot="management:<key>" / "dept:<key>".
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data, t = (k) => window.VW.i18n.t(k);
  const root = document.getElementById("teamRoot");
  const chart = document.querySelector(".org-chart");
  if (!root && !chart) return;

  const GROUPS = {
    founders: { tier: "founder", label: "team.founders" },
    coordinators: { tier: "coordinator", label: "team.coordinators" },
    management: { tier: "management", label: "team.management" },
    departmentHeads: { tier: "department", label: "team.departmentHeads" },
    moderators: { tier: "moderator", label: "team.moderators" },
    teamLeads: { tier: "leads", label: "team.teamLeads" },
  };

  let team = null;

  const roleOf = (p, group) => p.position || p.title || (group === "founders" ? "Founder" : "");

  function cardHTML(p, group) {
    const open = !p.name;
    const tier = GROUPS[group].tier;
    return `<article class="person-card spot${open ? " person-card--open" : ""}" data-tier="${tier}">
      <div class="person-card__photo">${D.photo(p.image, p.name || "?", "person-card__img")}</div>
      <div class="person-card__body">
        <h3 class="person-card__name">${D.esc(open ? t("team.open") : p.name)}</h3>
        <p class="person-card__role">${D.esc(roleOf(p, group))}</p>
      </div></article>`;
  }

  function chipHTML(p) {
    const open = !p.name;
    return `<span class="person-chip${open ? " person-chip--open" : ""}">${D.photo(p.image, p.name || "?", "person-chip__img")}<span>${D.esc(open ? t("team.open") : p.name)}</span></span>`;
  }

  function renderHome() {
    const show = (team.home && team.home.show) || ["founders", "management", "departmentHeads"];
    root.innerHTML = show.filter((g) => GROUPS[g] && Array.isArray(team[g]) && team[g].length).map((g) => `
      <div class="team-group team-group--${g}">
        <h3 class="team-group__title label">${D.esc(t(GROUPS[g].label))}</h3>
        <div class="team-grid team-grid--${g}">${team[g].map((p) => cardHTML(p, g)).join("")}</div>
      </div>`).join("");
  }

  function renderChart() {
    chart.querySelectorAll(".org-people").forEach((el) => {
      const list = team[el.dataset.people] || [];
      el.innerHTML = list.map(chipHTML).join("");
    });
    const slots = { management: team.management || [], dept: team.departmentHeads || [] };
    chart.querySelectorAll("[data-slot]").forEach((tile) => {
      const [kind, key] = tile.dataset.slot.split(":");
      const person = (slots[kind] || []).find((p) => p.key === key);
      tile.querySelector(".org-tile__person")?.remove();
      if (!person) return;
      const div = document.createElement("div");
      div.className = "org-tile__person";
      div.innerHTML = chipHTML(person);
      tile.appendChild(div);
    });
  }

  function render() { if (!team) return; if (root) renderHome(); if (chart) renderChart(); }

  window.VW.data.load("team").then((res) => {
    if (!res.ok) { if (root) root.innerHTML = `<div class="empty-state">${D.esc(t("common.error"))}</div>`; return; }
    team = res.data; render();
    if (window.VW.revealOnScroll) window.VW.revealOnScroll(root || chart);
  });
  document.addEventListener("vw:lang", render);
})();
