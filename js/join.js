/* ==========================================================================
   Void Walkers — Hiring form (join.html)
   Domains come from data/site.json. The CV is validated (PDF/DOC/DOCX, ≤ 5 MB)
   and sent with the application to off.voidwalker@gmail.com (see js/forms.js).
   ========================================================================== */

(function () {
  "use strict";
  const D = window.VW.data, t = (k) => window.VW.i18n.t(k);
  const form = document.getElementById("joinForm");
  if (!form) return;

  const MAX = 5 * 1024 * 1024;
  const OK_TYPES = /\.(pdf|docx?|PDF|DOCX?)$/;
  const box = document.getElementById("joinDomains");
  const file = document.getElementById("joinCv");
  const fileName = document.getElementById("joinCvName");
  const success = document.getElementById("joinSuccess");
  const submit = document.getElementById("joinSubmit");
  const err = (k) => document.getElementById("join" + k + "Error");

  D.load("site").then((res) => {
    const list = res.ok ? res.data.domains || [] : [];
    box.innerHTML = list.map((d) => `<label class="chip"><input type="checkbox" name="domain" value="${D.esc(d.title)}"><span>${D.esc(d.title)}</span></label>`).join("");
  });

  function showName() { fileName.textContent = file.files[0] ? `${file.files[0].name} · ${(file.files[0].size / 1048576).toFixed(1)} MB` : t("join.cv.none"); }
  file.addEventListener("change", showName);
  document.addEventListener("vw:lang", showName);

  function validate() {
    const v = (id) => document.getElementById(id).value.trim();
    const f = file.files[0];
    const checks = {
      Name: v("joinName").length > 0,
      Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("joinEmail")),
      Domains: form.querySelectorAll('input[name="domain"]:checked').length > 0,
      Why: v("joinWhy").length >= 20,
      Cv: !!f && OK_TYPES.test(f.name) && f.size <= MAX,
    };
    Object.keys(checks).forEach((k) => { err(k).textContent = checks[k] ? "" : t("join.err." + k.toLowerCase()); });
    return Object.values(checks).every(Boolean);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;
    submit.disabled = true;
    submit.querySelector("span").textContent = t("join.sending");
    const v = (id) => document.getElementById(id).value.trim();
    const domains = [...form.querySelectorAll('input[name="domain"]:checked')].map((c) => c.value).join(", ");
    const res = await window.VW.sendToTeam({
      subject: `Hiring application: ${v("joinName")} — ${domains}`,
      fields: { name: v("joinName"), email: v("joinEmail"), phone: v("joinPhone"), institution: v("joinInstitution"), domains, experience: document.getElementById("joinExp").value, links: v("joinLinks"), why: v("joinWhy") },
      file: file.files[0],
    });
    submit.disabled = false;
    submit.querySelector("span").textContent = t("join.submit");
    success.querySelector("p").textContent = t(res.via === "mailto" ? "join.sent.mailto" : "join.sent.desc");
    success.setAttribute("data-visible", "true");
    success.setAttribute("tabindex", "-1");
    success.focus();
    if (res.via === "service") { form.reset(); showName(); }
  });
})();
