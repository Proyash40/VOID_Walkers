/* ==========================================================================
   Void Walkers — Black hole hero (WebGL, ray-traced)
   Every pixel traces a light ray through a Schwarzschild (non-rotating) black
   hole by integrating the null-geodesic equation  a = -1.5 · h² · r̂ / r⁴
   (units: Schwarzschild radius = 1). This produces, without any faking:
     • the shadow (b < 2.6 rs) with an anti-aliased edge,
     • the disk's far side bent over the top and under the bottom,
     • the thin photon ring and its multiple images,
     • Doppler beaming + gravitational redshift (one side brighter/whiter),
     • a turbulent, differentially rotating (Keplerian) disk.
   The disk shading itself is stylised (noise, palette). Pointer = tilt/roll,
   press & hold = spin up and brighten. Quality auto-scales to hold frame rate.
   No WebGL → CSS fallback ring. Reduced effects → single still frame.
   ========================================================================== */

(function () {
  "use strict";

  const canvas = document.getElementById("blackhole");
  if (!canvas) return;
  const hero = canvas.closest(".hero") || canvas.parentElement;

  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" });
  if (!gl) { hero.classList.add("hero--no-gl"); return; }

  const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  const FRAG = `
precision highp float;
uniform vec2  uCenter;
uniform float uScale, uTime, uElev, uRoll, uPull, uAA;
uniform vec3  uAccent;

#define RIN   3.0
#define ROUT  9.5
#define BCRIT 2.598076

float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

vec3 palette(float t){
  vec3 deep = mix(uAccent, vec3(0.22, 0.07, 0.45), 0.55) * 0.32;
  vec3 warm = mix(uAccent, vec3(1.0), 0.42);
  vec3 hot  = vec3(1.0, 0.95, 0.86);
  vec3 c = mix(deep, uAccent, smoothstep(0.0, 0.5, t));
  c = mix(c, warm, smoothstep(0.45, 0.95, t));
  return mix(c, hot, smoothstep(0.9, 1.5, t));
}

// emission of the accretion disk at point 'hit' for a photon travelling with direction 'vel'
vec4 diskShade(vec3 hit, vec3 vel){
  float r = length(hit.xz);
  float temp = pow(RIN / r, 0.75);

  float omega = 2.2 * (1.0 + 1.8 * uPull) / (r * sqrt(r));          // Keplerian: inner rings turn faster
  float a = -omega * uTime, ca = cos(a), sa = sin(a);
  vec2 q = vec2(ca * hit.x - sa * hit.z, sa * hit.x + ca * hit.z);
  float n1 = fbm(vec3(q * 0.85, r * 1.6));
  float n2 = fbm(vec3(q * 2.4 + 5.0, r * 4.5));
  float bands = 0.72 + 0.28 * sin(r * 9.0 + n1 * 6.0);
  float dens = clamp((0.25 + 1.35 * n1) * (0.55 + 0.9 * n2) * bands, 0.0, 2.2);

  float beta = sqrt(0.5 / (r - 1.0));                                // local orbital speed
  vec3 vdir = normalize(vec3(-hit.z, 0.0, hit.x));
  vec3 toObs = -normalize(vel);
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  float dop = 1.0 / (gamma * (1.0 - beta * dot(vdir, toObs)));
  float shift = dop * sqrt(max(1.0 - 1.0 / r, 0.03));                // Doppler × gravitational

  float edge = smoothstep(RIN, RIN + 0.45, r) * (1.0 - smoothstep(ROUT - 3.5, ROUT, r));
  float I = dens * pow(temp, 2.2) * pow(shift, 2.0) * edge * (1.0 + 0.7 * uPull);
  vec3 c = palette(temp * shift * 0.95) * I * 2.7;
  return vec4(c, clamp(0.35 + I * 0.8, 0.0, 0.96) * edge);
}

void main(){
  vec2 p = (gl_FragCoord.xy - uCenter) / uScale;
  if (dot(p, p) > 13.0 * 13.0) { gl_FragColor = vec4(0.0); return; }

  float cr = cos(uRoll), sr = sin(uRoll);
  p = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y);

  const float R = 40.0;
  vec3 ro = R * vec3(0.0, sin(uElev), cos(uElev));
  vec3 fwd = -normalize(ro);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  vec3 vel = normalize(fwd * R + right * p.x + up * p.y);

  vec3 pos = ro;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float b = sqrt(h2);

  vec3 col = vec3(0.0);
  float trans = 1.0;

  for (int i = 0; i < 230; i++){
    float r2 = dot(pos, pos), r = sqrt(r2);
    float dt = clamp(0.1 * r - 0.04, 0.03, 1.4);
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    vec3 np = pos + vel * dt;

    if (pos.y * np.y < 0.0){
      float f = pos.y / (pos.y - np.y);
      vec3 hit = mix(pos, np, f);
      float rr = length(hit.xz);
      if (rr > RIN && rr < ROUT){
        vec4 s = diskShade(hit, vel);
        col += trans * s.rgb * s.a;
        trans *= 1.0 - s.a;
      }
    }
    pos = np;
    if (r2 < 1.03 || trans < 0.03) break;
    if (r2 > 1000.0 && dot(pos, vel) > 0.0) break;
  }

  // photon ring + soft halo (functions of the impact parameter)
  float e = uAA / uScale;
  float ring = exp(-pow((b - BCRIT - 0.03) / 0.07, 2.0)) * step(BCRIT - e, b);
  float halo = exp(-(b - BCRIT) * 1.15) * step(BCRIT, b) * 0.15;
  vec3 gcol = mix(uAccent, vec3(1.0, 0.94, 0.84), 0.65);
  col += gcol * (ring * 0.85 + halo) * (1.0 + 0.6 * uPull) * trans;

  float shadow = 1.0 - smoothstep(BCRIT - e, BCRIT + e, b);
  col = 1.0 - exp(-col * 1.25);                                      // soft tone-map
  float a = max(shadow, max(col.r, max(col.g, col.b)));
  gl_FragColor = vec4(col, a);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = vs && fs && gl.createProgram();
  if (prog) { gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); }
  if (!prog || !gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.classList.add("hero--no-gl"); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ["uCenter", "uScale", "uTime", "uElev", "uRoll", "uPull", "uAA", "uAccent"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  /* ---------- state ---------- */
  const BASE_ELEV = 0.11, BASE_ROLL = -0.12;
  let w = 0, h = 0, res = 1, maxRes = 1, minRes = 0.4;
  let elev = BASE_ELEV, roll = BASE_ROLL, pull = 0;
  let tElev = BASE_ELEV, tRoll = BASE_ROLL, tPull = 0;
  let time = 12, last = 0, raf = 0, visible = true;
  let accent = [1, 0.35, 0.12];
  let frames = 0, acc = 0;

  const reducedMq = matchMedia("(prefers-reduced-motion: reduce)");
  const isStatic = () => reducedMq.matches || document.documentElement.dataset.fx === "reduced";

  function readAccent() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim().split(/\s+/).map(Number);
    if (v.length === 3 && v.every(Number.isFinite)) accent = v.map((x) => x / 255);
  }

  function layout() {
    const rect = hero.getBoundingClientRect();
    w = rect.width; h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const budget = w < 720 ? 420000 : 760000;                     // pixels shaded per frame
    maxRes = Math.min(dpr, Math.sqrt(budget / (w * h)), 1.25);
    res = Math.min(Math.max(res, minRes), maxRes);
    if (!res || res > maxRes) res = maxRes;
    resize();
  }

  function resize() {
    canvas.width = Math.max(2, Math.round(w * res));
    canvas.height = Math.max(2, Math.round(h * res));
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (isStatic()) draw();
  }

  function draw() {
    const narrow = w < 720;
    const cxCss = w / 2, cyCss = narrow ? h * 0.34 : h * 0.44;      // centre of the hole (CSS px, y down)
    const shadowPx = Math.min(w / (narrow ? 8.4 : 11), h * (narrow ? 0.13 : 0.17), 130); // on-screen shadow radius
    const unit = (shadowPx / 2.598076) * res;                       // render-pixels per unit of impact parameter
    gl.uniform2f(U.uCenter, cxCss * res, (h - cyCss) * res);        // GL origin is bottom-left
    gl.uniform1f(U.uScale, unit);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uElev, elev);
    gl.uniform1f(U.uRoll, roll);
    gl.uniform1f(U.uPull, pull);
    gl.uniform1f(U.uAA, 1.4);
    gl.uniform3f(U.uAccent, accent[0], accent[1], accent[2]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const k = 1 - Math.pow(0.0015, dt);
    elev += (tElev - elev) * k;
    roll += (tRoll - roll) * k;
    pull += (tPull - pull) * (1 - Math.pow(0.02, dt));
    time += dt * (1 + 2.2 * pull);
    draw();

    // adaptive quality: hold ~50fps by trading render resolution
    acc += dt; frames++;
    if (frames === 40) {
      const avg = acc / frames; frames = 0; acc = 0;
      if (avg > 0.024 && res > minRes) { res = Math.max(minRes, res * 0.85); resize(); }
      else if (avg < 0.0135 && res < maxRes) { res = Math.min(maxRes, res * 1.08); resize(); }
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (isStatic()) { elev = BASE_ELEV; roll = BASE_ROLL; pull = 0; draw(); return; }
    if (!visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */
  function aim(e) {
    const rect = hero.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
    tRoll = BASE_ROLL + nx * 0.32;
    tElev = Math.max(0.04, BASE_ELEV + ny * 0.2);
  }

  hero.addEventListener("pointermove", (e) => { if (!isStatic()) aim(e); });
  hero.addEventListener("pointerdown", (e) => { if (isStatic() || e.target.closest("a,button")) return; tPull = 1; aim(e); });
  ["pointerup", "pointercancel"].forEach((ev) => addEventListener(ev, () => { tPull = 0; }));
  hero.addEventListener("pointerleave", () => { tPull = 0; tElev = BASE_ELEV; tRoll = BASE_ROLL; });

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); cancelAnimationFrame(raf); hero.classList.add("hero--no-gl"); });

  new ResizeObserver(layout).observe(hero);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; start(); }).observe(hero);
  document.addEventListener("visibilitychange", start);
  document.addEventListener("vw:fx", () => { layout(); start(); });
  document.addEventListener("vw:accent", () => { readAccent(); if (isStatic()) draw(); });
  reducedMq.addEventListener("change", start);

  readAccent();
  res = 1;
  layout();
  start();
})();
