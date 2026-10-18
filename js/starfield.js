/* ==========================================================================
   Void Walkers — Starfield
   Fixed, full-viewport canvas behind every page. Stars come from a seeded RNG
   so the field is identical on every page (keeps page transitions seamless),
   a share of them are clustered along a diagonal "galactic band", and the
   whole field drifts with pointer + scroll parallax. Respects Reduced effects.
   ========================================================================== */

(function () {
  "use strict";

  const canvas = document.createElement("canvas");
  canvas.id = "starfield";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const TAU = Math.PI * 2;
  let w = 0, h = 0, dpr = 1, stars = [];
  let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
  let accent = [255, 90, 31];

  const reducedMq = matchMedia("(prefers-reduced-motion: reduce)");
  const isStatic = () => reducedMq.matches || document.documentElement.dataset.fx === "reduced";

  function rng(seed) {                       // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readAccent() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim().split(/\s+/).map(Number);
    if (v.length === 3 && v.every(Number.isFinite)) accent = v;
  }

  function build() {
    const rand = rng(20260);
    const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(TAU * rand());
    const count = Math.min(520, Math.round((w * h) / 4200));
    const angle = (-24 * Math.PI) / 180;       // band rises to the right
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const diag = Math.hypot(w, h);
    stars = [];

    for (let i = 0; i < count; i++) {
      let x, y;
      if (rand() < 0.55) {                     // galactic band
        const along = (rand() - 0.5) * diag * 1.1;
        const across = gauss() * Math.min(w, h) * 0.13;
        x = w / 2 + along * cos - across * sin;
        y = h / 2 + along * sin + across * cos;
      } else {
        x = rand() * w; y = rand() * h;
      }
      const depth = rand();
      const tint = rand();
      stars.push({
        x, y, depth,
        size: depth > 0.93 ? 1.9 : depth > 0.6 ? 1.3 : 0.9,
        base: 0.25 + rand() * 0.6,
        speed: 0.4 + rand() * 1.6,
        phase: rand() * TAU,
        kind: tint > 0.93 ? 2 : tint > 0.8 ? 1 : 0,   // 2 = accent tinted, 1 = warm, 0 = cool white
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    build();
    draw(performance.now());
  }

  function color(kind, a) {
    if (kind === 2) return `rgba(${accent[0]},${accent[1]},${accent[2]},${a})`;
    if (kind === 1) return `rgba(255,232,205,${a})`;
    return `rgba(214,222,255,${a})`;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const t = now / 1000;
    const still = isStatic();
    const scroll = scrollY;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const par = 4 + s.depth * 26;
      let x = s.x + px * par;
      let y = s.y + py * par - scroll * s.depth * 0.06;
      y = ((y % h) + h) % h;                   // wrap vertically so scroll parallax never exposes gaps
      const tw = still ? 1 : 0.72 + 0.28 * Math.sin(t * s.speed + s.phase);
      ctx.fillStyle = color(s.kind, s.base * tw);
      ctx.fillRect(Math.round(x), Math.round(y), s.size, s.size);
    }
  }

  function loop(now) {
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (isStatic()) { draw(performance.now()); return; }
    raf = requestAnimationFrame(loop);
  }

  addEventListener("pointermove", (e) => {
    tx = (e.clientX / w - 0.5) * -1;
    ty = (e.clientY / h - 0.5) * -1;
  }, { passive: true });

  addEventListener("resize", resize);
  document.addEventListener("vw:fx", start);
  document.addEventListener("vw:accent", () => { readAccent(); if (isStatic()) draw(performance.now()); });
  reducedMq.addEventListener("change", start);
  document.addEventListener("visibilitychange", () => { document.hidden ? cancelAnimationFrame(raf) : start(); });

  readAccent();
  resize();
  start();
})();
