/* ==========================================================================
   Void Walkers — Black hole hero (canvas 2D, no dependencies)
   A 3D accretion disk is projected with perspective each frame:
     • far half of the disk is drawn first, then the event horizon (pure black),
     • light from the far half is "lensed" into an arc over the top of the hole
       (and a fainter one beneath), plus a thin photon ring,
     • the near half of the disk is drawn last so it passes in front.
   Interaction: move the pointer / drag to tilt and roll the disk, press and
   hold to feed the void (spin up, disk tightens, glow intensifies).
   Reduced effects → one static frame, no animation, no tilt response.
   This is a stylised approximation, not a physical simulation.
   ========================================================================== */

(function () {
  "use strict";

  const canvas = document.getElementById("blackhole");
  if (!canvas) return;
  const hero = canvas.closest(".hero") || canvas.parentElement;
  const ctx = canvas.getContext("2d");

  const TAU = Math.PI * 2;
  const R_IN = 1.45, R_OUT = 4.3, FOCAL = 18;
  const LUT_SIZE = 64;

  let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, rs = 100;
  let count = 2600;
  let raf = 0, last = 0, visible = true;
  let pitch = 0.2, roll = -0.14, pull = 0;
  let tPitch = 0.2, tRoll = -0.14, tPull = 0;
  let accent = [255, 90, 31];
  let lut = [];
  let P = null;

  const reducedMq = matchMedia("(prefers-reduced-motion: reduce)");
  const isStatic = () => reducedMq.matches || document.documentElement.dataset.fx === "reduced";

  /* ---------- particles ---------- */

  function rngFn(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build() {
    const rand = rngFn(77);
    P = {
      n: count,
      r: new Float32Array(count), a: new Float32Array(count), s: new Float32Array(count),
      y: new Float32Array(count), size: new Float32Array(count), speed: new Float32Array(count),
      lum: new Float32Array(count), ci: new Uint8Array(count),
      sx: new Float32Array(count), sy: new Float32Array(count), sa: new Float32Array(count),
      sz: new Float32Array(count), far: new Uint8Array(count), lx: new Float32Array(count),
      ly: new Float32Array(count), la: new Float32Array(count),
    };
    for (let i = 0; i < count; i++) {
      const u = Math.pow(rand(), 1.9);              // denser toward the hot inner edge
      const r = R_IN + (R_OUT - R_IN) * u;
      const s = (r - R_IN) / (R_OUT - R_IN);
      P.r[i] = r;
      P.s[i] = s;
      P.a[i] = rand() * TAU;
      P.y[i] = (rand() - 0.5) * 0.035 * r;             // slight vertical thickness
      P.size[i] = 0.75 + rand() * 1.1 + (1 - s) * 0.45;
      P.speed[i] = 1.15 / Math.pow(r, 1.5);           // Keplerian-ish: inner rings orbit faster
      P.lum[i] = 0.35 + rand() * 0.65;
      P.ci[i] = Math.min(LUT_SIZE - 1, Math.floor(s * LUT_SIZE));
    }
  }

  /* ---------- colour ---------- */

  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  function readAccent() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim().split(/\s+/).map(Number);
    if (v.length === 3 && v.every(Number.isFinite)) accent = v;
    const hot = [255, 248, 236], warm = mix(accent, [255, 255, 255], 0.35), deep = mix(mix(accent, [60, 28, 120], 0.55), [0, 0, 0], 0.35);
    lut = [];
    for (let i = 0; i < LUT_SIZE; i++) {
      const k = i / (LUT_SIZE - 1);
      const c = k < 0.16 ? mix(hot, warm, k / 0.16) : k < 0.5 ? mix(warm, accent, (k - 0.16) / 0.34) : mix(accent, deep, (k - 0.5) / 0.5);
      lut.push(`rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`);
    }
  }

  /* ---------- layout ---------- */

  function resize() {
    const rect = hero.getBoundingClientRect();
    w = rect.width; h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const narrow = w < 720;
    cx = w / 2;
    cy = narrow ? h * 0.34 : h * 0.44;
    rs = Math.min(w / (narrow ? 10 : 12.6), h * (narrow ? 0.1 : 0.15), 124);
    const wantCount = narrow ? 2600 : 5400;
    if (wantCount !== count || !P) { count = wantCount; build(); }
    if (!lut.length) readAccent();
    if (isStatic()) render(0, true);
  }

  /* ---------- render ---------- */

  function render(dt, still) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const spin = (1 + 2.4 * pull) * (still ? 0 : 1);
    const squeeze = 1 - 0.06 * pull;
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const unit = rs * squeeze;

    // outer glow
    const g = ctx.createRadialGradient(cx, cy, rs * 0.9, cx, cy, rs * (6.5 + pull));
    g.addColorStop(0, `rgba(${accent[0]},${accent[1]},${accent[2]},${0.2 + 0.14 * pull})`);
    g.addColorStop(0.35, `rgba(${accent[0]},${accent[1]},${accent[2]},0.05)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    const n = P.n;

    // project every particle once
    for (let i = 0; i < n; i++) {
      P.a[i] += P.speed[i] * dt * spin;
      const a = P.a[i], r = P.r[i];
      const x = r * Math.cos(a), z = r * Math.sin(a), y = P.y[i];
      const y1 = y * cp - z * sp;
      const z1 = y * sp + z * cp;
      const xr = x * cr - y1 * sr;
      const yr = x * sr + y1 * cr;
      const persp = FOCAL / (FOCAL - z1);
      P.sx[i] = cx + xr * unit * persp;
      P.sy[i] = cy - yr * unit * persp;
      P.far[i] = z1 < 0 ? 1 : 0;
      const beam = 1 + 0.5 * Math.cos(a);                                 // approaching side is brighter
      P.sa[i] = Math.min(1, P.lum[i] * beam * persp * persp * (1.1 - P.s[i] * 0.55) * (1 + 0.35 * pull));
      P.sz[i] = P.size[i] * persp;

      // lensed image positions (far half → arc over the top, near half → faint arc beneath)
      const s = P.s[i];
      if (z1 < 0) {
        const phi = TAU - a + roll;
        const rho = unit * (1.05 + 0.5 * Math.pow(s, 0.7));
        P.lx[i] = cx + rho * Math.cos(phi);
        P.ly[i] = cy - rho * Math.sin(phi);
        P.la[i] = Math.min(1, P.sa[i] * 1.15);
      } else {
        const phi = -a + roll;
        const rho = unit * (1.03 + 0.26 * Math.pow(s, 0.75));
        P.lx[i] = cx + rho * Math.cos(phi);
        P.ly[i] = cy - rho * Math.sin(phi);
        P.la[i] = P.sa[i] * 0.3;
      }
    }

    // 1) far half of the disk
    for (let i = 0; i < n; i++) {
      if (!P.far[i]) continue;
      ctx.globalAlpha = P.sa[i];
      ctx.fillStyle = lut[P.ci[i]];
      ctx.fillRect(P.sx[i], P.sy[i], P.sz[i], P.sz[i]);
    }

    // 2) event horizon
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, unit * 1.0, 0, TAU);
    ctx.fill();

    // 3) lensed light + photon ring
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = P.la[i];
      ctx.fillStyle = lut[P.ci[i]];
      ctx.fillRect(P.lx[i], P.ly[i], P.sz[i] * 0.9, P.sz[i] * 0.9);
    }
    ctx.globalAlpha = 1;
    const ringBoost = 1 + 0.5 * pull;
    [[1.025, 0.07, 0.95], [1.05, 0.18, 0.28], [1.1, 0.45, 0.1]].forEach(([k, lw, al]) => {
      ctx.strokeStyle = `rgba(255,${240 - 40 * pull | 0},${215 - 70 * pull | 0},${Math.min(1, al * ringBoost)})`;
      ctx.lineWidth = Math.max(0.8, unit * lw * 0.12);
      ctx.beginPath();
      ctx.arc(cx, cy, unit * k, 0, TAU);
      ctx.stroke();
    });

    // 4) near half of the disk (in front of the hole)
    for (let i = 0; i < n; i++) {
      if (P.far[i]) continue;
      ctx.globalAlpha = P.sa[i];
      ctx.fillStyle = lut[P.ci[i]];
      ctx.fillRect(P.sx[i], P.sy[i], P.sz[i], P.sz[i]);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const k = 1 - Math.pow(0.0015, dt);           // frame-rate independent easing
    pitch += (tPitch - pitch) * k;
    roll += (tRoll - roll) * k;
    pull += (tPull - pull) * (1 - Math.pow(0.02, dt));
    render(dt, false);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (isStatic()) { pitch = 0.2; roll = -0.14; pull = 0; render(0, true); return; }
    if (!visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */

  function aim(e) {
    const rect = hero.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
    tRoll = -0.14 + nx * 0.34;
    tPitch = 0.2 + ny * 0.26;
  }

  hero.addEventListener("pointermove", (e) => { if (!isStatic()) aim(e); });
  hero.addEventListener("pointerdown", (e) => {
    if (isStatic() || e.target.closest("a,button")) return;
    tPull = 1;
    aim(e);
  });
  ["pointerup", "pointercancel"].forEach((ev) => addEventListener(ev, () => { tPull = 0; }));
  hero.addEventListener("pointerleave", () => { tPull = 0; tPitch = 0.2; tRoll = -0.14; });

  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; start(); }).observe(hero);
  document.addEventListener("visibilitychange", start);
  document.addEventListener("vw:fx", start);
  document.addEventListener("vw:accent", () => { readAccent(); if (isStatic()) render(0, true); });
  reducedMq.addEventListener("change", start);

  readAccent();
  resize();
  start();
})();
