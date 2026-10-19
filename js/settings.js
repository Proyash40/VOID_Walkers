/* ==========================================================================
   Void Walkers — Settings + background music
   • Persists language, music, volume, mute, accent and effects (localStorage).
   • Owns the single <audio id="bgAudio">. Tracks come from data/playlist.json
     and play one after another in shuffled order (reshuffled when the round
     ends). Volume slider, mute switch, prev/next and the navbar sound button
     all drive that one element.
   • Every page is a real page load, so the current track, shuffle order and
     position are saved to sessionStorage on pagehide and resumed on the next
     page. Resume needs a host that supports HTTP range requests (Vercel does).
   Requires js/i18n.js and js/data.js.
   ========================================================================== */

(function () {
  "use strict";

  const STORE_KEY = "vw.settings";
  const POS_KEY = "vw.audio";
  const DEFAULTS = { lang: "en", music: true, volume: 35, muted: false, accent: "orange", fx: "full" };

  const i18n = window.VW.i18n;
  const t = (k) => i18n.t(k);
  const root = document.documentElement;

  /* ---------------- state ---------------- */

  let state = load();

  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }

  function applyVisualState() {
    root.dataset.accent = state.accent;
    root.dataset.fx = state.fx;
    document.dispatchEvent(new CustomEvent("vw:accent", { detail: state.accent }));
    document.dispatchEvent(new CustomEvent("vw:fx", { detail: state.fx }));
  }

  /* ---------------- audio ---------------- */

  const audio = document.createElement("audio");
  audio.id = "bgAudio";
  audio.preload = "auto";
  audio.hidden = true;
  audio.setAttribute("aria-hidden", "true");

  let tracks = [], order = [], cursor = 0;
  let fade = 1, fadeFrame = 0;
  let hasPlayed = false, silentRun = false, blocked = false, errored = false, armed = false, failures = 0;
  let pendingSeek = null;

  const current = () => tracks[order[cursor]];

  function shuffle(n, avoidFirst) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (n > 1 && a[0] === avoidFirst) { const k = 1 + Math.floor(Math.random() * (n - 1)); [a[0], a[k]] = [a[k], a[0]]; }
    return a;
  }

  function applyVolume() {
    audio.muted = state.muted || silentRun;
    audio.volume = Math.min(1, Math.max(0, (state.volume / 100) * fade));
  }

  function fadeTo(target, ms, done) {
    cancelAnimationFrame(fadeFrame);
    const from = fade, start = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - start) / ms);
      fade = from + (target - from) * k;
      applyVolume();
      if (k < 1) fadeFrame = requestAnimationFrame(step); else if (done) done();
    })(start);
  }

  function savePosition() {
    if (!order.length) return;
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify({ order, cursor, t: audio.currentTime || 0, at: Date.now(), playing: !audio.paused, n: tracks.length }));
    } catch (e) { /* ignore */ }
  }

  async function loadPlaylist() {
    const res = await window.VW.data.load("playlist");
    tracks = res.ok && Array.isArray(res.data.tracks) ? res.data.tracks.filter((x) => x && x.src) : [];
    if (!tracks.length) { errored = true; refresh(); return false; }

    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(POS_KEY)); } catch (e) { /* ignore */ }
    if (saved && saved.n === tracks.length && Array.isArray(saved.order) && saved.order.length === tracks.length) {
      order = saved.order; cursor = Math.min(saved.cursor, order.length - 1);
      pendingSeek = saved.t + (saved.playing ? (Date.now() - saved.at) / 1000 : 0);
    } else {
      order = shuffle(tracks.length, -1); cursor = 0;
    }
    setSource();
    return true;
  }

  function setSource() {
    const tr = current();
    audio.src = window.VW.data.url(tr.src);
    updateMediaSession();
  }

  function goTo(step) {
    cursor += step;
    if (cursor >= order.length) { const last = order[order.length - 1]; order = shuffle(tracks.length, last); cursor = 0; }
    if (cursor < 0) cursor = order.length - 1;
    pendingSeek = null;
    setSource();
    if (state.music) audio.play().then(() => { hasPlayed = true; refresh(); }).catch(() => { armGesture(); });
    refresh();
  }

  function ready() {
    if (audio.readyState >= 1) return Promise.resolve();
    return new Promise((resolve) => audio.addEventListener("loadedmetadata", resolve, { once: true }));
  }

  async function startMusic() {
    if (errored || !tracks.length) return;
    await ready();
    if (!hasPlayed && audio.paused && pendingSeek !== null) {
      const d = audio.duration;
      if (isFinite(d) && d) {
        if (pendingSeek >= d) { pendingSeek = null; goTo(1); return; }   // the track ended while we were between pages
        audio.currentTime = pendingSeek;
      }
      pendingSeek = null;
    }

    if (silentRun && !audio.paused) {
      silentRun = false; hasPlayed = true; blocked = false;
      fade = 0; applyVolume(); fadeTo(1, 900); refresh(); return;
    }

    fade = 0; applyVolume();
    try {
      await audio.play();
      hasPlayed = true; blocked = false; fadeTo(1, 900);
    } catch (err) {
      blocked = true; fade = 1; silentRun = true; applyVolume();
      try { await audio.play(); } catch (e2) { silentRun = false; }
      armGesture();
    }
    refresh();
  }

  function stopMusic() {
    silentRun = false; blocked = false;
    fadeTo(0, 350, () => { audio.pause(); refresh(); });
  }

  function setMusic(on) {
    state.music = on; save();
    if (on) startMusic(); else stopMusic();
    refresh();
  }

  function armGesture() {
    if (armed) return;
    armed = true;
    const events = ["pointerdown", "keydown", "touchend"];
    const go = () => { events.forEach((e) => removeEventListener(e, go, true)); armed = false; if (state.music) startMusic(); };
    events.forEach((e) => addEventListener(e, go, { capture: true, passive: true }));
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator) || !current()) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: current().title || "Void Walkers", artist: current().artist || "Void Walkers" });
      navigator.mediaSession.setActionHandler("nexttrack", () => goTo(1));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("play", () => setMusic(true));
      navigator.mediaSession.setActionHandler("pause", () => setMusic(false));
    } catch (e) { /* unsupported */ }
  }

  function prev() {
    if (audio.currentTime > 4) { audio.currentTime = 0; return; }
    goTo(-1);
  }

  audio.addEventListener("ended", () => goTo(1));
  audio.addEventListener("error", () => {
    failures++;
    if (failures >= tracks.length) { errored = true; refresh(); return; }
    goTo(1);                                       // skip a missing file
  });
  audio.addEventListener("playing", () => { failures = 0; refresh(); });
  audio.addEventListener("play", refresh);
  audio.addEventListener("pause", refresh);
  addEventListener("pagehide", savePosition);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") savePosition(); });
  document.addEventListener("vw:leaving", savePosition);

  /* ---------------- settings drawer ---------------- */

  let dialog, els = {};

  const ICON_PREV = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 6V18M18 6L9.5 12L18 18V6Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 6V18M6 6L14.5 12L6 18V6Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildDialog() {
    dialog = document.createElement("dialog");
    dialog.className = "settings";
    dialog.id = "settingsDialog";
    dialog.setAttribute("aria-labelledby", "settingsTitle");
    dialog.innerHTML = `
      <div class="settings__panel">
        <div class="settings__head">
          <h2 id="settingsTitle" data-i18n="settings.title">Settings</h2>
          <button class="icon-btn" type="button" data-close data-i18n-aria-label="settings.close" aria-label="Close settings">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>

        <fieldset class="settings__group">
          <legend class="label" data-i18n="settings.language">Language</legend>
          <div class="segmented">
            <label><input type="radio" name="vw-lang" value="en"><span>English</span></label>
            <label><input type="radio" name="vw-lang" value="hi"><span>हिन्दी</span></label>
            <label><input type="radio" name="vw-lang" value="bn"><span>বাংলা</span></label>
          </div>
        </fieldset>

        <div class="settings__group">
          <span class="label" data-i18n="settings.music">Background music</span>
          <div class="settings__row">
            <span id="vwMusicStatus" class="settings__status" aria-live="polite"></span>
            <span class="switch"><input id="vwMusic" type="checkbox" role="switch" data-i18n-aria-label="settings.music" aria-label="Background music"><span class="switch__track"></span></span>
          </div>
          <div class="settings__player">
            <button class="icon-btn" type="button" id="vwPrev" data-i18n-aria-label="settings.prev" aria-label="Previous track">${ICON_PREV}</button>
            <div class="settings__track"><span class="label" data-i18n="settings.nowPlaying">Now playing</span><span id="vwTrack" class="settings__title">—</span></div>
            <button class="icon-btn" type="button" id="vwNext" data-i18n-aria-label="settings.next" aria-label="Next track">${ICON_NEXT}</button>
          </div>
          <div class="settings__row">
            <label for="vwVolume" data-i18n="settings.volume">Volume</label>
            <output id="vwVolumeOut" class="settings__value" for="vwVolume"></output>
          </div>
          <input id="vwVolume" class="range" type="range" min="0" max="100" step="1">
          <div class="settings__row">
            <label for="vwMute" data-i18n="settings.mute">Mute</label>
            <span class="switch"><input id="vwMute" type="checkbox" role="switch"><span class="switch__track"></span></span>
          </div>
        </div>

        <fieldset class="settings__group">
          <legend class="label" data-i18n="settings.accent">Accent colour</legend>
          <div class="swatches">
            <label class="swatch swatch--orange"><input type="radio" name="vw-accent" value="orange"><span data-i18n="settings.accent.orange">Orange</span></label>
            <label class="swatch swatch--violet"><input type="radio" name="vw-accent" value="violet"><span data-i18n="settings.accent.violet">Violet</span></label>
            <label class="swatch swatch--teal"><input type="radio" name="vw-accent" value="teal"><span data-i18n="settings.accent.teal">Teal</span></label>
            <label class="swatch swatch--pink"><input type="radio" name="vw-accent" value="pink"><span data-i18n="settings.accent.pink">Pink</span></label>
          </div>
        </fieldset>

        <fieldset class="settings__group">
          <legend class="label" data-i18n="settings.fx">Visual effects</legend>
          <div class="segmented">
            <label><input type="radio" name="vw-fx" value="full"><span data-i18n="settings.fx.full">Full</span></label>
            <label><input type="radio" name="vw-fx" value="reduced"><span data-i18n="settings.fx.reduced">Reduced</span></label>
          </div>
        </fieldset>

        <div class="settings__foot">
          <button class="btn btn--secondary" type="button" id="vwReset" data-i18n="settings.reset">Reset to defaults</button>
          <p class="settings__note" data-i18n="settings.note">Settings are saved on this device.</p>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    els = {
      status: dialog.querySelector("#vwMusicStatus"), music: dialog.querySelector("#vwMusic"),
      volume: dialog.querySelector("#vwVolume"), volumeOut: dialog.querySelector("#vwVolumeOut"),
      mute: dialog.querySelector("#vwMute"), track: dialog.querySelector("#vwTrack"),
    };

    dialog.addEventListener("change", (e) => {
      const el = e.target;
      if (el.name === "vw-lang") { state.lang = el.value; save(); i18n.setLang(el.value); }
      else if (el.name === "vw-accent") { state.accent = el.value; save(); applyVisualState(); }
      else if (el.name === "vw-fx") { state.fx = el.value; save(); applyVisualState(); }
      else if (el === els.music) setMusic(el.checked);
      else if (el === els.mute) { state.muted = el.checked; save(); applyVolume(); refresh(); }
    });

    els.volume.addEventListener("input", () => { state.volume = Number(els.volume.value); save(); applyVolume(); refresh(); });
    dialog.querySelector("#vwNext").addEventListener("click", () => { if (!state.music) { state.music = true; save(); } goTo(1); });
    dialog.querySelector("#vwPrev").addEventListener("click", () => { if (!state.music) { state.music = true; save(); } prev(); });

    dialog.querySelector("#vwReset").addEventListener("click", () => {
      const wasPlaying = state.music;
      state = Object.assign({}, DEFAULTS); save();
      applyVisualState(); i18n.setLang("en"); applyVolume();
      if (!wasPlaying) setMusic(true);
      refresh();
    });

    dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.closest("[data-close]")) closeDialog(); });
    dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); });
    i18n.apply(dialog);
  }

  function openDialog() { if (!dialog.open) dialog.showModal(); refresh(); }

  function closeDialog() {
    if (!dialog.open) return;
    const reduced = state.fx === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { dialog.close(); return; }
    dialog.dataset.closing = "true";
    setTimeout(() => { dialog.close(); delete dialog.dataset.closing; }, 210);
  }

  /* ---------------- UI sync ---------------- */

  function refresh() {
    const playing = !audio.paused && !silentRun && !errored;
    const navState = errored || !state.music ? "paused" : playing ? (state.muted ? "muted" : "playing") : "paused";
    const navBtn = document.getElementById("soundToggle");
    if (navBtn) { navBtn.dataset.state = navState; navBtn.setAttribute("aria-pressed", String(state.music && !errored)); }

    if (!dialog) return;
    const label = errored ? "settings.music.error" : !state.music ? "settings.music.paused" : blocked || silentRun ? "settings.music.blocked" : playing ? "settings.music.playing" : "settings.music.paused";
    els.status.textContent = t(label);
    els.track.textContent = current() ? current().title : "—";
    els.music.checked = state.music;
    els.mute.checked = state.muted;
    els.volume.value = state.volume;
    els.volume.style.setProperty("--fill", state.volume + "%");
    els.volumeOut.textContent = state.volume + "%";
    dialog.querySelectorAll('input[name="vw-lang"]').forEach((r) => { r.checked = r.value === i18n.lang; });
    dialog.querySelectorAll('input[name="vw-accent"]').forEach((r) => { r.checked = r.value === state.accent; });
    dialog.querySelectorAll('input[name="vw-fx"]').forEach((r) => { r.checked = r.value === state.fx; });
  }

  document.addEventListener("vw:lang", refresh);

  /* ---------------- init ---------------- */

  document.addEventListener("DOMContentLoaded", async () => {
    document.body.appendChild(audio);
    buildDialog();
    applyVisualState();
    applyVolume();

    const openBtn = document.getElementById("settingsOpen");
    const soundBtn = document.getElementById("soundToggle");
    if (openBtn) openBtn.addEventListener("click", openDialog);
    if (soundBtn) soundBtn.addEventListener("click", () => {
      if (state.music && (blocked || silentRun)) startMusic();      // autoplay was blocked → this click is the gesture
      else setMusic(!state.music);
    });

    refresh();
    const ok = await loadPlaylist();
    refresh();
    if (ok && state.music) startMusic();

    window.VW.settings = { get: () => Object.assign({}, state), audio };
  });
})();
