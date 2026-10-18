/* ==========================================================================
   Void Walkers — Settings + background audio
   • Persists language, music, volume, mute, accent and effects to localStorage.
   • Owns the single <audio id="bgAudio"> element. The volume slider, the mute
     switch and the navbar sound button all drive that element directly.
   • Because every page is a real page load, playback position is saved to
     sessionStorage on pagehide and restored on the next page, so the track
     carries on from (roughly) where it left off.
   • Builds the settings drawer (native <dialog>) so its markup lives in one place.
   Requires js/i18n.js.
   ========================================================================== */

(function () {
  "use strict";

  const STORE_KEY = "vw.settings";
  const POS_KEY = "vw.audio";
  const AUDIO_SRC = "assets/audio/ambient-loop.mp3";
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

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function applyVisualState() {
    root.dataset.accent = state.accent;
    root.dataset.fx = state.fx;
    document.dispatchEvent(new CustomEvent("vw:accent", { detail: state.accent }));
    document.dispatchEvent(new CustomEvent("vw:fx", { detail: state.fx }));
  }

  /* ---------------- audio ---------------- */

  const audio = document.createElement("audio");
  audio.id = "bgAudio";
  audio.loop = true;
  audio.preload = "auto";
  audio.hidden = true;
  audio.setAttribute("aria-hidden", "true");
  audio.src = AUDIO_SRC;

  let fade = 1;          // 0–1 multiplier used for fade in/out; real volume = slider × fade
  let fadeFrame = 0;
  let hasPlayed = false; // has this page ever produced sound
  let silentRun = false; // autoplay blocked → running muted until the first gesture
  let blocked = false;
  let errored = false;
  let armed = false;

  function applyVolume() {
    audio.muted = state.muted || silentRun;
    audio.volume = Math.min(1, Math.max(0, (state.volume / 100) * fade));
  }

  function fadeTo(target, ms, done) {
    cancelAnimationFrame(fadeFrame);
    const from = fade;
    const start = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - start) / ms);
      fade = from + (target - from) * k;
      applyVolume();
      if (k < 1) fadeFrame = requestAnimationFrame(step);
      else if (done) done();
    })(start);
  }

  function ready() {
    if (audio.readyState >= 1) return Promise.resolve();
    return new Promise((resolve) => audio.addEventListener("loadedmetadata", resolve, { once: true }));
  }

  function savePosition() {
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify({ t: audio.currentTime || 0, at: Date.now(), playing: !audio.paused }));
    } catch (e) { /* ignore */ }
  }

  function restorePosition() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(POS_KEY)); } catch (e) { /* ignore */ }
    const d = audio.duration;
    if (!saved || !isFinite(d) || !d) return;
    // If it was playing when the last page closed, account for the time that has passed since.
    const pos = saved.t + (saved.playing ? (Date.now() - saved.at) / 1000 : 0);
    audio.currentTime = pos % d;
  }

  async function startMusic() {
    if (errored) return;
    await ready();
    if (!hasPlayed && audio.paused) restorePosition();

    if (silentRun && !audio.paused) {            // already running muted → just bring the sound in
      silentRun = false; hasPlayed = true; blocked = false;
      fade = 0; applyVolume(); fadeTo(1, 900);
      refresh();
      return;
    }

    fade = 0; applyVolume();
    try {
      await audio.play();
      hasPlayed = true; blocked = false;
      fadeTo(1, 900);
    } catch (err) {
      blocked = true; fade = 1;
      silentRun = true; applyVolume();           // muted autoplay is allowed — keeps the position moving
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
    state.music = on;
    save();
    if (on) startMusic(); else stopMusic();
    refresh();
  }

  function armGesture() {
    if (armed) return;
    armed = true;
    const events = ["pointerdown", "keydown", "touchend"];
    const go = () => {
      events.forEach((e) => removeEventListener(e, go, true));
      armed = false;
      if (state.music) startMusic();
    };
    events.forEach((e) => addEventListener(e, go, { capture: true, passive: true }));
  }

  audio.addEventListener("error", () => { errored = true; refresh(); });
  audio.addEventListener("play", refresh);
  audio.addEventListener("pause", refresh);
  addEventListener("pagehide", savePosition);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") savePosition(); });
  document.addEventListener("vw:leaving", savePosition);

  /* ---------------- settings drawer ---------------- */

  let dialog, els = {};

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
      status: dialog.querySelector("#vwMusicStatus"),
      music: dialog.querySelector("#vwMusic"),
      volume: dialog.querySelector("#vwVolume"),
      volumeOut: dialog.querySelector("#vwVolumeOut"),
      mute: dialog.querySelector("#vwMute"),
    };

    dialog.addEventListener("change", (e) => {
      const el = e.target;
      if (el.name === "vw-lang") { state.lang = el.value; save(); i18n.setLang(el.value); }
      else if (el.name === "vw-accent") { state.accent = el.value; save(); applyVisualState(); }
      else if (el.name === "vw-fx") { state.fx = el.value; save(); applyVisualState(); }
      else if (el === els.music) setMusic(el.checked);
      else if (el === els.mute) { state.muted = el.checked; save(); applyVolume(); refresh(); }
    });

    els.volume.addEventListener("input", () => {
      state.volume = Number(els.volume.value);
      save();
      applyVolume();
      refresh();
    });

    dialog.querySelector("#vwReset").addEventListener("click", () => {
      const wasPlaying = state.music;
      state = Object.assign({}, DEFAULTS);
      save();
      applyVisualState();
      i18n.setLang("en");
      applyVolume();
      if (!wasPlaying) setMusic(true);
      refresh();
    });

    dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.closest("[data-close]")) closeDialog(); });
    dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); });

    i18n.apply(dialog);
  }

  function openDialog() {
    if (!dialog.open) dialog.showModal();
    refresh();
  }

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
    const navState = errored ? "paused" : !state.music ? "paused" : playing ? (state.muted ? "muted" : "playing") : "paused";

    const navBtn = document.getElementById("soundToggle");
    if (navBtn) {
      navBtn.dataset.state = navState;
      navBtn.setAttribute("aria-pressed", String(state.music && !errored));
    }

    if (!dialog) return;
    const label = errored ? "settings.music.error" : !state.music ? "settings.music.paused" : blocked || silentRun ? "settings.music.blocked" : playing ? "settings.music.playing" : "settings.music.paused";
    els.status.textContent = t(label);
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

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(audio);
    buildDialog();
    applyVisualState();
    applyVolume();

    const openBtn = document.getElementById("settingsOpen");
    const soundBtn = document.getElementById("soundToggle");
    if (openBtn) openBtn.addEventListener("click", openDialog);
    if (soundBtn) soundBtn.addEventListener("click", () => {
      // Music is "on" but the browser blocked autoplay → this click is the gesture that starts it.
      if (state.music && (blocked || silentRun)) startMusic();
      else setMusic(!state.music);
    });

    refresh();
    if (state.music) startMusic();

    window.VW.settings = { get: () => Object.assign({}, state), audio };
  });
})();
