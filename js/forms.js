/* ==========================================================================
   Void Walkers — Form delivery
   Every form on the site (contact, hiring, Hall of Fame reviews, merch
   waitlist) ends up in off.voidwalker@gmail.com via the endpoint configured in
   data/site.json → forms.endpoint (default: FormSubmit). If that request
   fails for any reason, the visitor's email app is opened with the message
   pre-filled, so a submission is never silently lost.
   ========================================================================== */

(function () {
  "use strict";
  window.VW = window.VW || {};

  /**
   * @param {{subject:string, fields:Object<string,string>, file?:File}} payload
   * @returns {Promise<{ok:boolean, via:"service"|"mailto"}>}
   */
  async function sendToTeam(payload) {
    const site = await window.VW.data.load("site");
    const cfg = site.ok ? site.data : {};
    const endpoint = cfg.forms && cfg.forms.endpoint;

    if (endpoint) {
      try {
        const fd = new FormData();
        fd.append("_subject", payload.subject);
        fd.append("_template", "table");
        fd.append("_captcha", "false");
        Object.keys(payload.fields).forEach((k) => fd.append(k, payload.fields[k]));
        if (payload.file) fd.append("attachment", payload.file);
        const res = await fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (res.ok) {
          const body = await res.json().catch(() => ({}));
          if (String(body.success) !== "false") return { ok: true, via: "service" };
        }
      } catch (e) { /* fall through to mailto */ }
    }

    const to = cfg.email || "off.voidwalker@gmail.com";
    const lines = Object.keys(payload.fields).map((k) => `${k}: ${payload.fields[k]}`);
    if (payload.file) lines.push(`(Please attach your file: ${payload.file.name})`);
    location.href = `mailto:${to}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(lines.join("\n\n")).slice(0, 1800)}`;
    return { ok: true, via: "mailto" };
  }

  window.VW.sendToTeam = sendToTeam;
})();
