/* ==========================================================================
   Void Walkers — Role Hierarchy Config
   Single source of truth for how roles rank against each other. Used to
   sort the members grid (index.html) and to color-code both the role pill
   on a member card and the org chart on hierarchy.html.

   This mirrors the "Community Management Hierarchy" chart: Founder/Executive
   at rank 1 down to Team Members at rank 7, plus external Sponsors/Partners.
   A member's `role` string (from /api/Members) is matched against `role`
   below, case-insensitively, to find its rank and tier.

   NOTE: `role` is not part of the original Members struct documented for
   the backend. It needs to be added as a column on the `mem_list` table in
   Supabase for sorting and the role pill to work — see SETUP.md. Members
   without a recognized role still render; they're treated as a plain
   "Team Member" and sorted to the bottom of their group.
   ========================================================================== */

const ROLE_HIERARCHY = [
  { role: "Founder / Executive", rank: 1, tier: "founder" },
  { role: "Community Coordinators", rank: 2, tier: "coordinator" },

  // Management (Core Team) — all share rank 3
  { role: "Operations Manager", rank: 3, tier: "management" },
  { role: "Finance & Treasurer", rank: 3, tier: "management" },
  { role: "HR & Talent Manager", rank: 3, tier: "management" },
  { role: "Strategy & Planning Manager", rank: 3, tier: "management" },
  { role: "Legal & Compliance Manager", rank: 3, tier: "management" },

  // Department Heads (Domain Leads) — all share rank 4
  { role: "Cybersecurity & Ethical Hacking Head", rank: 4, tier: "department" },
  { role: "Cybercrime Investigation & Forensics Head", rank: 4, tier: "department" },
  { role: "Competitive Coding Head", rank: 4, tier: "department" },
  { role: "AI & Data Science Head", rank: 4, tier: "department" },
  { role: "Hardware & Robotics Head", rank: 4, tier: "department" },
  { role: "Hackathons & Product Building Head", rank: 4, tier: "department" },
  { role: "Design & Media Head", rank: 4, tier: "department" },
  { role: "Research & Innovation Head", rank: 4, tier: "department" },

  { role: "Moderator", rank: 5, tier: "moderator" },
  { role: "Team Lead", rank: 6, tier: "leads" },
  { role: "Team Member", rank: 7, tier: "members" },
  { role: "Sponsor / Partner", rank: 8, tier: "external" },
];

const DEFAULT_ROLE_ENTRY = { role: "Team Member", rank: 7, tier: "members" };

/**
 * Looks up hierarchy info for a role string from the API. Falls back to a
 * plain "Team Member" entry (sorted last) when the role is missing or
 * doesn't match a known title, so unrecognized data never breaks rendering.
 * @param {string|undefined} roleName
 */
function getRoleInfo(roleName) {
  if (!roleName) return DEFAULT_ROLE_ENTRY;
  const normalized = String(roleName).trim().toLowerCase();
  const match = ROLE_HIERARCHY.find((entry) => entry.role.toLowerCase() === normalized);
  if (match) return match;
  // Unrecognized but non-empty role: keep the label, rank it below every
  // known role rather than guessing where it belongs.
  return { role: String(roleName).trim(), rank: 99, tier: "members" };
}

/**
 * Returns a new array of members ordered by hierarchy rank (Founder /
 * Executive first), then alphabetically by uName within the same rank.
 * Pure function — does not mutate the input array.
 * @param {Array<object>} members
 */
function sortMembersByHierarchy(members) {
  if (!Array.isArray(members)) return [];
  return [...members].sort((a, b) => {
    const rankA = getRoleInfo(a && a.role).rank;
    const rankB = getRoleInfo(b && b.role).rank;
    if (rankA !== rankB) return rankA - rankB;
    const nameA = String((a && a.uName) || "");
    const nameB = String((b && b.uName) || "");
    return nameA.localeCompare(nameB);
  });
}
