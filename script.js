/* =====================================================================
   script.js  (merged: wedding.js + music.js + gallery.js + rsvp.js
               + the small inline "celebrate" handler from index.html)
   Order kept exactly as the original <script> order.
   ===================================================================== */


/* ===================== 1) wedding.js ===================== */

// Edit the invitation details here
const INVITE = {
  groom: "Alexander",
  bride: "Vivienne",
  date: "Friday, 18 December 2026",
  time: "8:00 PM",
  place: "Karnak Grand Hall, Luxor",
  when: "2026-12-18T20:00:00+02:00",   // exact moment for the countdown (include the venue's time zone)
  image: "hero.jpg",                    // main photo: put the file next to index.html
  countStart: "2026-10-01T00:00:00+02:00",   // the day the countdown ribbon is at full length
  mapsUrl: "",                          // optional Google Maps link; if empty, the place name is searched
  schedule: [                           // the evening: edit, add or remove lines (empty list hides the section)
    { time: "8:00 PM", title: "Welcome & reception" },
    { time: "8:45 PM", title: "The Zaffa" },
    { time: "9:30 PM", title: "Dinner" },
    { time: "11:00 PM", title: "Cake & dancing" }
  ]
};

const $ = (s) => document.querySelector(s);
const all = (s) => document.querySelectorAll(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Fill the text
all("[data-groom]").forEach((el) => (el.textContent = INVITE.groom));
all("[data-bride]").forEach((el) => (el.textContent = INVITE.bride));
all("[data-date]").forEach((el) => (el.textContent = INVITE.date));
all("[data-time]").forEach((el) => (el.textContent = INVITE.time));
all("[data-place]").forEach((el) => (el.textContent = INVITE.place));
document.title = `${INVITE.bride} & ${INVITE.groom}`;

const envelope = $("#envelope");
const cvs = $("#ribbon");
const ctx = cvs.getContext("2d");
const openBtn = $("#open");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Opening the envelope (the flap lifts, then the invitation rises out). The CSS does the animation.
// ---------------------------------------------------------------------------
let opened = false;

function reveal() {
  if (opened) return;
  opened = true;
  envelope.classList.add("is-open");
  openBtn.tabIndex = -1;
  setTimeout(showPage, reduced ? 200 : 1300);   // the invitation rises out of the open envelope
}

// ---------------------------------------------------------------------------
// The invitation page (shown after the envelope opens)
// ---------------------------------------------------------------------------
const invite = $("#invite");

function showPage() {
  if (document.body.classList.contains("is-page")) return;
  document.body.classList.add("is-page");
  invite.removeAttribute("inert");
  invite.setAttribute("aria-hidden", "false");
  invite.scrollTop = 0;
  invite.focus({ preventScroll: true });
  watchReveals();
  startDust();
  onScroll();
}

// fade elements in as they scroll into view
function watchReveals() {
  const els = all(".rv");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (list) => list.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    }),
    { root: invite, threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
}

// main photo: falls back to a monogram until the image file exists
const hero = $("#hero");
const heroImg = $("#heroImg");
all("[data-initials]").forEach((el) => (el.textContent = `${INVITE.groom[0]} & ${INVITE.bride[0]}`));
if (INVITE.image) {
  heroImg.alt = `${INVITE.groom} & ${INVITE.bride}`;
  heroImg.addEventListener("load", () => hero.classList.add("has-image"));
  heroImg.src = INVITE.image;
}

// Google Maps button: uses your link if you set one, otherwise searches the place name
$("#mapsBtn").href = INVITE.mapsUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(INVITE.place);

// countdown
const target = new Date(INVITE.when).getTime();
const cd = { d: $("[data-cd=d]"), h: $("[data-cd=h]"), m: $("[data-cd=m]"), s: $("[data-cd=s]") };
const pad = (n) => String(n).padStart(2, "0");
let cdTimer = null;

// digits flip when they change
function setNum(el, v) {
  v = String(v);
  if (el.textContent === v) return;
  el.textContent = v;
  el.classList.remove("flip");
  void el.offsetWidth;
  el.classList.add("flip");
}

// a little burst of gold specks around an element (the countdown by default)
function burst(host = $(".count__grid"), n = 26) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const sp = document.createElement("span");
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 130;
    sp.className = "spark";
    sp.style.setProperty("--dx", Math.cos(a) * d + "px");
    sp.style.setProperty("--dy", Math.sin(a) * d + "px");
    sp.style.setProperty("--s", 4 + Math.random() * 7 + "px");
    sp.style.animationDelay = Math.random() * 0.25 + "s";
    sp.addEventListener("animationend", () => sp.remove());
    host.appendChild(sp);
  }
}

// the ribbon under the numbers: full length on countStart, nothing left on the day
const unrav = $("#unrav");
const startMs = new Date(INVITE.countStart).getTime();
let lastF = -1;

let prevLeft = null;
function tick() {
  const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
  setNum(cd.d, Math.floor(left / 86400));
  setNum(cd.h, pad(Math.floor((left % 86400) / 3600)));
  setNum(cd.m, pad(Math.floor((left % 3600) / 60)));
  setNum(cd.s, pad(left % 60));
  const total = target - startMs;
  const f = total > 0 ? clamp((target - Date.now()) / total, 0, 1) : 1;
  if (Math.abs(f - lastF) > 0.0003) {
    lastF = f;
    unrav.style.setProperty("--f", f.toFixed(4));
  }
  if (left === 0) {
    $("#cdNote").textContent = "The big day is here";
    clearInterval(cdTimer);
    if (prevLeft > 0) burst();
  }
  prevLeft = left;
}
if (!isNaN(target)) {
  tick();
  cdTimer = setInterval(tick, 1000);
}


// ---------------------------------------------------------------------------
// Sound (synthesized with Web Audio, no files needed)
// ---------------------------------------------------------------------------
let audioCtx = null;

function audio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {
    audioCtx = null;
  }
  return audioCtx;
}

// short burst of filtered noise with a fast decay
function noise(c, when, dur, hp, gain) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(when);
}

// fingers taking hold of the satin
function tugSound() {
  const c = audio();
  if (!c) return;
  noise(c, c.currentTime, 0.05, 2200, 0.05);
  noise(c, c.currentTime + 0.03, 0.08, 900, 0.03);
}

// the knot letting go
function untieSound() {
  const c = audio();
  if (!c) return;
  [0, 55, 120].forEach((ms, i) => noise(c, c.currentTime + ms / 1000, 0.02 + i * 0.008, 2500 + i * 700, 0.05));
}

// the ribbon slipping around the envelope: a swell of filtered noise sweeping upward
function silkSound() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const dur = 0.9;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const x = i / len;
    d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.pow(x, 0.65));
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(4200, t + dur * 0.85);
  const g = c.createGain();
  g.gain.value = 0.2;
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(t);
}

// ---------------------------------------------------------------------------
// Ribbon: a satin band around the envelope, tied in a bow.
//   - the two tails are little ropes (Verlet integration, fixed time step)
//   - `pd` is how far the knot has come undone (0 tied, 1 untied), on a spring
//   - pull past the threshold, or tap, and the band slips off the envelope
// ---------------------------------------------------------------------------
const TIP = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tip")) || 62) / 100;
const N = 14;            // points per tail
const G = 2300;          // gravity, px/s²
const STEP = 1 / 120;    // physics step, seconds
const SLIDE_T = 0.9;     // how long the band takes to slip away

let W = 0, H = 0, DPR = 1, cx = 0, tipY = 0;
let U = 40;              // one "unit": everything on the ribbon scales from this
let tailLen = 120, bandH = 38, PAD = 400;
let kx = 0, ky = 0;      // knot position (kx moves while the band slips away)

const tails = [-1, 1].map((side) => ({
  side,
  n: Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }))
}));

let state = "idle";      // idle | drag | auto | back | finish | slide | done
let pd = 0, pdv = 0, pTarget = 0;
let held = null;         // the tail being pulled
let ptr = { x: 0, y: 0 }, ptr0 = { x: 0, y: 0 }, autoTo = { x: 0, y: 0 };
let autoT = 0, finT = 0, slideT = 0, sOff = 0, dir = 1, revealed = false;
let time = 0, acc = 0, last = 0, gustX = 0, lean = 0;   // lean: how far the bow is being tugged sideways
let downAt = { x: 0, y: 0 }, downTime = 0, moved = 0;

const anchor = (t) => ({ x: kx + t.side * U * 0.16, y: ky + U * 0.32 });

function rest(t, i) {
  const a = anchor(t);
  const ang = t.side * 0.3;
  const s = (i * tailLen) / (N - 1);
  return { x: a.x + Math.sin(ang) * s + t.side * Math.sin((s / tailLen) * Math.PI) * U * 0.1, y: a.y + Math.cos(ang) * s };
}

function resetTails() {
  tails.forEach((t) =>
    t.n.forEach((p, i) => {
      const r = rest(t, i);
      p.x = p.px = r.x;
      p.y = p.py = r.y;
    })
  );
}

function layout() {
  W = envelope.clientWidth;
  H = envelope.clientHeight;
  DPR = Math.min(1.5, window.devicePixelRatio || 1);   // capped at 1.5 to keep the ribbon light on phones
  cvs.width = Math.round(W * DPR);
  cvs.height = Math.round(H * DPR);
  cx = W / 2;
  tipY = H * TIP;
  U = clamp(Math.min(W * 0.11, H * 0.075), 30, 62);
  bandH = U * 0.95;
  tailLen = clamp(U * 3.2, 90, 190);
  PAD = W * 0.5 + 240;
  kx = cx;
  ky = tipY;
  if (state === "idle") resetTails();
}

// --- physics ---------------------------------------------------------------
function stepTail(t, h) {
  const nodes = t.n;
  const a0 = anchor(t);
  const ls = (tailLen * (1 + 1.3 * clamp(pd, 0, 1))) / (N - 1);  // ribbon is drawn out of the knot as it loosens
  const free = state === "slide" || state === "done";
  const stiff = free ? 0 : 1 - clamp(pd, 0, 1);
  const isHeld = held === t;

  nodes[0].x = nodes[0].px = a0.x;
  nodes[0].y = nodes[0].py = a0.y;

  for (let i = 1; i < N; i++) {
    const nd = nodes[i];
    const f = i / (N - 1);
    if (isHeld && i === N - 1) {
      // the end follows the finger, with a little lag so it feels like it has weight
      const ox = nd.x, oy = nd.y;
      const k = 1 - Math.exp(-h * 26);
      nd.x += (ptr.x - nd.x) * k;
      nd.y += (ptr.y - nd.y) * k;
      nd.px = ox;
      nd.py = oy;
      continue;
    }
    const vx = (nd.x - nd.px) * 0.988;
    const vy = (nd.y - nd.py) * 0.988;
    nd.px = nd.x;
    nd.py = nd.y;
    let ax = (Math.sin(time * 1.7 + t.side * 1.3 + i * 0.35) * 38 + gustX * t.side) * f;
    let ay = G;
    if (stiff > 0.001) {
      // satin is stiff near the knot and floppy at the end
      const r = rest(t, i);
      const w = Math.pow(1 - f, 1.4) * stiff * 420;
      ax += (r.x - nd.x) * w;
      ay += (r.y - nd.y) * w;
    }
    nd.x += vx + ax * h * h;
    nd.y += vy + ay * h * h;
  }

  const iters = free ? 14 : 8;
  for (let k = 0; k < iters; k++) {
    for (let i = 0; i < N - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const diff = (d - ls) / d;
      const wa = i === 0 ? 0 : 1;
      const wb = isHeld && i + 1 === N - 1 ? 0 : 1;
      const s = wa + wb;
      if (!s) continue;
      a.x += (dx * diff * wa) / s;
      a.y += (dy * diff * wa) / s;
      b.x -= (dx * diff * wb) / s;
      b.y -= (dy * diff * wb) / s;
    }
  }
}

// how undone the knot is, from where the finger is
function pFromPtr() {
  const d = Math.hypot(ptr.x - cx, ptr.y - (ky + U * 0.3));
  return clamp((d - 0.55 * tailLen) / (1.3 * tailLen), 0, 1);
}

// --- states ----------------------------------------------------------------
function startAuto(tail) {
  if (state !== "idle" && state !== "back") return;
  audio();
  held = tail;
  dir = tail.side;
  state = "auto";
  autoT = 0;
  const e = tail.n[N - 1];
  ptr0 = { x: e.x, y: e.y };
  ptr = { x: e.x, y: e.y };
  autoTo = { x: cx + tail.side * tailLen * 1.6, y: ky + U * 0.3 + tailLen };
  tugSound();
}

function beginFinish() {
  if (state === "finish" || state === "slide" || state === "done") return;
  dir = Math.abs(ptr.x - cx) > U * 0.3 ? (ptr.x > cx ? 1 : -1) : held.side;
  state = "finish";
  finT = 0;
  pTarget = 1;
  untieSound();
  if (navigator.vibrate) navigator.vibrate(12);
}

function startSlide() {
  state = "slide";
  slideT = 0;
  held = null;
  pTarget = 1;
  silkSound();
}

const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

function updateState(dt) {
  // a little flutter now and then invites a pull
  gustX = state === "idle" && !reduced ? ((time + 3.6) % 5.5 < 1.2 ? Math.sin((((time + 3.6) % 5.5) / 1.2) * Math.PI) * 240 : 0) : 0;

  switch (state) {
    case "drag":
      pTarget = pFromPtr();
      if (pTarget >= 0.995) beginFinish();
      break;
    case "auto": {
      autoT += dt;
      const u = clamp(autoT / 0.6, 0, 1);
      const e = 1 - Math.pow(1 - u, 3);
      ptr.x = ptr0.x + (autoTo.x - ptr0.x) * e;
      ptr.y = ptr0.y + (autoTo.y - ptr0.y) * e;
      pTarget = pFromPtr();
      if (u >= 1) beginFinish();
      break;
    }
    case "back":
      pTarget = 0;
      if (Math.abs(pd) < 0.02 && Math.abs(pdv) < 0.15) {
        pd = pdv = 0;
        state = "idle";
      }
      break;
    case "finish":
      finT += dt;
      pTarget = 1;
      if (finT > 0.18) startSlide();
      break;
    case "slide": {
      slideT += dt;
      const u = clamp(slideT / SLIDE_T, 0, 1);
      sOff = dir * (W + PAD + 80) * easeInOut(u);
      kx = cx + sOff;
      if (!revealed && slideT > 0.13) {
        revealed = true;
        reveal();
      }
      if (u >= 1) {
        state = "done";
        cvs.hidden = true;
      }
      break;
    }
    default:
      pTarget = 0;
  }
}

// --- drawing ---------------------------------------------------------------
// Satin gold, drawn to read as real fabric: soft broad highlights, a fine
// woven grain, folded selvedge edges and contact shadows, with no hard outlines.
const GOLD = { dark: [82, 56, 16], mid: [196, 160, 84], light: [242, 224, 168], spec: [255, 250, 232] };

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const shade = (l) => (l < 0.5 ? mix(GOLD.dark, GOLD.mid, l * 2) : mix(GOLD.mid, GOLD.light, (l - 0.5) * 2));
const lerpP = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

// tiny tile of alternating light / dark threads, repeated over the satin
const weave = (() => {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 3;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(255,248,220,.55)";
  g.fillRect(0, 0, 4, 1);
  g.fillStyle = "rgba(70,45,8,.55)";
  g.fillRect(0, 1, 4, 1);
  return c;
})();

function bandPath(xl, xr, y0, y1) {
  const nt = bandH * 0.5;   // swallow-tail cut on the free ends
  const ym = (y0 + y1) / 2;
  ctx.beginPath();
  ctx.moveTo(xl, y0);
  ctx.lineTo(xr, y0);
  ctx.lineTo(xr - nt, ym);
  ctx.lineTo(xr, y1);
  ctx.lineTo(xl, y1);
  ctx.lineTo(xl + nt, ym);
  ctx.closePath();
}

function drawBand(k) {
  const y0 = tipY - bandH / 2, y1 = tipY + bandH / 2;
  const xl = -PAD + sOff, xr = W + PAD + sOff, w = xr - xl;

  // soft contact shadow on the envelope
  ctx.save();
  ctx.shadowColor = "rgba(15,0,5,.32)";
  ctx.shadowBlur = U * 0.95;
  ctx.shadowOffsetY = U * 0.3;
  bandPath(xl, xr, y0, y1);
  ctx.fillStyle = "#b8965a";
  ctx.fill();
  ctx.shadowColor = "rgba(15,0,5,.5)";   // tight shadow right where the satin touches the paper
  ctx.shadowBlur = U * 0.14;
  ctx.shadowOffsetY = U * 0.05;
  ctx.fill();
  ctx.restore();

  ctx.save();
  bandPath(xl, xr, y0, y1);
  ctx.clip();

  // cross-section: flat satin with slightly rolled edges
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  [[0, "#7c5d24"], [0.07, "#a98847"], [0.22, "#d2b46f"], [0.46, "#ead79f"], [0.52, "#f1e2b0"],
  [0.6, "#e2cb8e"], [0.82, "#c1a05a"], [0.94, "#98783a"], [1, "#70531f"]].forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(xl, y0, w, bandH);

  // broad soft light and shade drifting along the fabric (moves with the band)
  const fx = ctx.createLinearGradient(sOff, 0, sOff + W, 0);
  [[0, "rgba(255,244,205,0)"], [0.1, "rgba(255,244,205,.16)"], [0.22, "rgba(50,28,4,.1)"], [0.36, "rgba(255,244,205,.22)"],
  [0.5, "rgba(50,28,4,.06)"], [0.64, "rgba(255,244,205,.2)"], [0.78, "rgba(50,28,4,.12)"], [0.9, "rgba(255,244,205,.16)"],
  [1, "rgba(255,244,205,0)"]].forEach(([o, c]) => fx.addColorStop(o, c));
  ctx.fillStyle = fx;
  ctx.fillRect(xl, y0, w, bandH);

  // the band curves around the envelope: darker toward the sides
  const wrap = ctx.createLinearGradient(0, 0, W, 0);
  wrap.addColorStop(0, "rgba(40,8,16,.4)");
  wrap.addColorStop(0.17, "rgba(40,8,16,0)");
  wrap.addColorStop(0.83, "rgba(40,8,16,0)");
  wrap.addColorStop(1, "rgba(40,8,16,.4)");
  ctx.fillStyle = wrap;
  ctx.fillRect(xl, y0, w, bandH);

  // a slow sheen sweeping along the satin
  const sx = (((time * 0.2) % 1.8) - 0.4) * W;
  const sh = ctx.createLinearGradient(sx - W * 0.18, 0, sx + W * 0.18, 0);
  sh.addColorStop(0, "rgba(255,250,228,0)");
  sh.addColorStop(0.5, "rgba(255,250,228,.26)");
  sh.addColorStop(1, "rgba(255,250,228,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(xl, y0, w, bandH);

  // woven thread grain
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = ctx.createPattern(weave, "repeat");
  ctx.fillRect(xl, y0, w, bandH);
  ctx.globalAlpha = 1;

  // folded selvedge edges
  ctx.lineWidth = 1;
  [[0.09, "rgba(255,242,200,.5)"], [0.12, "rgba(80,52,10,.28)"], [0.88, "rgba(255,242,200,.3)"], [0.91, "rgba(80,52,10,.3)"]].forEach(([f, c]) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(xl, y0 + bandH * f);
    ctx.lineTo(xr, y0 + bandH * f);
    ctx.stroke();
  });

  // the shiny satin picks up its surroundings: wine from the flap above, cream from the paper below
  const rt = ctx.createLinearGradient(0, y0, 0, y0 + bandH * 0.34);
  rt.addColorStop(0, "rgba(120,28,52,.07)");
  rt.addColorStop(1, "rgba(120,28,52,0)");
  ctx.fillStyle = rt;
  ctx.fillRect(xl, y0, w, bandH * 0.34);
  const rc = ctx.createRadialGradient(cx, y0, 0, cx, y0, W * 0.22);
  rc.addColorStop(0, "rgba(125,32,56,.22)");
  rc.addColorStop(1, "rgba(125,32,56,0)");
  ctx.fillStyle = rc;
  ctx.fillRect(xl, y0, w, bandH * 0.5);
  const rb = ctx.createLinearGradient(0, y1, 0, y1 - bandH * 0.28);
  rb.addColorStop(0, "rgba(238,230,210,.3)");
  rb.addColorStop(1, "rgba(238,230,210,0)");
  ctx.fillStyle = rb;
  ctx.fillRect(xl, y1 - bandH * 0.28, w, bandH * 0.28);

  if (k > 0.02) {
    // shadow where the knot pinches the band, plus fine gathers either side
    const r = U * 1.5;
    const ao = ctx.createRadialGradient(kx, tipY, U * 0.2, kx, tipY, r);
    ao.addColorStop(0, `rgba(30,14,0,${0.5 * k})`);
    ao.addColorStop(1, "rgba(30,14,0,0)");
    ctx.fillStyle = ao;
    ctx.fillRect(kx - r, y0, 2 * r, bandH);
    [-1, 1].forEach((s) => {
      for (let j = 1; j <= 3; j++) {
        const x = kx + s * U * (0.62 + j * 0.26);
        ctx.strokeStyle = `rgba(70,44,8,${0.1 * k * (1 - j * 0.24)})`;
        ctx.beginPath();
        ctx.moveTo(x, y0 + bandH * 0.08);
        ctx.quadraticCurveTo(x - s * U * 0.16, tipY, x, y1 - bandH * 0.08);
        ctx.stroke();
      }
    });
  }
  ctx.restore();

  bandPath(xl, xr, y0, y1);
  ctx.strokeStyle = "rgba(70,45,10,.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawTail(t) {
  // light smoothing so the ribbon bends in curves instead of sharp corners
  const n = t.n.map((q, i, a) =>
    i === 0 || i === N - 1 ? q : { x: (a[i - 1].x + 2 * q.x + a[i + 1].x) / 4, y: (a[i - 1].y + 2 * q.y + a[i + 1].y) / 4 }
  );
  const wT = U * 0.5;
  const L = [], R = [], lit = [];
  for (let i = 0; i < N; i++) {
    const a = n[Math.max(0, i - 1)], b = n[Math.min(N - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const d = Math.hypot(tx, ty) || 1;
    tx /= d;
    ty /= d;
    const wi = wT * (1 - 0.06 * (i / (N - 1))) * (0.84 + 0.16 * Math.cos(i * 0.5 + t.side * 1.1 + time * 0.8));
    L.push({ x: n[i].x - ty * wi / 2, y: n[i].y + tx * wi / 2 });
    R.push({ x: n[i].x + ty * wi / 2, y: n[i].y - tx * wi / 2 });
    // brightness follows the direction of the ribbon, so bends catch the light
    lit.push(clamp(0.5 + 0.5 * Math.cos(Math.atan2(ty, tx * t.side) - 0.8 + i * 0.3), 0, 1));
  }
  // swallow-tail cut at the end
  const e = n[N - 1], p = n[N - 2];
  const ex = e.x - p.x, ey = e.y - p.y;
  const ed = Math.hypot(ex, ey) || 1;
  const notch = { x: e.x - (ex / ed) * wT * 0.6, y: e.y - (ey / ed) * wT * 0.6 };

  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(L[0].x, L[0].y);
    for (let i = 1; i < N; i++) ctx.lineTo(L[i].x, L[i].y);
    ctx.lineTo(notch.x, notch.y);
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath();
  };

  // shadow underneath
  ctx.save();
  ctx.shadowColor = "rgba(20,0,6,.45)";
  ctx.shadowBlur = U * 0.3;
  ctx.shadowOffsetY = U * 0.1;
  outline();
  ctx.fillStyle = rgb(GOLD.mid);
  ctx.fill();
  ctx.restore();

  // satin: each piece is split in three and shaded across its width (dark rolled edges, bright core)
  const S = 3;
  for (let i = 0; i < N - 1; i++) {
    for (let s = 0; s < S; s++) {
      const u0 = s / S, u1 = (s + 1) / S;
      const l0 = lerpP(L[i], L[i + 1], u0), l1 = lerpP(L[i], L[i + 1], u1);
      const r0 = lerpP(R[i], R[i + 1], u0), r1 = lerpP(R[i], R[i + 1], u1);
      const lt = lit[i] + (lit[i + 1] - lit[i]) * ((u0 + u1) / 2);
      const base = shade(lt);
      const g = ctx.createLinearGradient((l0.x + l1.x) / 2, (l0.y + l1.y) / 2, (r0.x + r1.x) / 2, (r0.y + r1.y) / 2);
      g.addColorStop(0, rgb(mix(GOLD.dark, base, 0.35)));
      g.addColorStop(0.14, rgb(mix(GOLD.dark, base, 0.75)));
      g.addColorStop(0.5, rgb(mix(base, GOLD.spec, Math.pow(lt, 4) * 0.55)));
      g.addColorStop(0.86, rgb(mix(GOLD.dark, base, 0.75)));
      g.addColorStop(1, rgb(mix(GOLD.dark, base, 0.35)));
      ctx.beginPath();
      ctx.moveTo(l0.x, l0.y);
      ctx.lineTo(l1.x, l1.y);
      if (i === N - 2 && s === S - 1) ctx.lineTo(notch.x, notch.y);
      ctx.lineTo(r1.x, r1.y);
      ctx.lineTo(r0.x, r0.y);
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle = g;
      ctx.lineWidth = 0.8;
      ctx.fill();
      ctx.stroke();
    }
  }

  // selvedge lines along both edges, then a very soft outline
  [[0.1, "rgba(255,244,205,.38)"], [0.16, "rgba(80,52,10,.22)"], [0.9, "rgba(80,52,10,.28)"]].forEach(([f, c]) => {
    ctx.beginPath();
    for (let i = 1; i < N - 1; i++) {
      const q = lerpP(L[i], R[i], f);
      i === 1 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y);
    }
    ctx.strokeStyle = c;
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  outline();
  ctx.strokeStyle = "rgba(84,58,16,.32)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// the loop's centre line (two bezier halves out to the tip and back to the knot)
function loopPts(len, hh, M) {
  const b = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
  const pts = [];
  for (let i = 0; i <= 2 * M; i++) {
    if (i <= M) { const t = i / M; pts.push({ x: b(0, len * 0.25, len * 0.98, len, t), y: b(0, -hh * 1.15, -hh * 0.95, 0, t) }); }
    else { const t = i / M - 1; pts.push({ x: b(len, len * 0.98, len * 0.25, 0, t), y: b(0, hh * 0.95, hh * 1.15, 0, t) }); }
  }
  return pts;
}

// A loop is a real flat ribbon: gathered (narrow) at the knot, full width in the
// curve, with a little twist at the tip that shows the darker back of the satin.
function drawLoop(side, rot, len, hh, wid, dark, tilt = 0) {
  const M = 28, n = 2 * M + 1;   // fewer segments than before: lighter on phones, still smooth
  const c = Math.cos(rot * side + tilt), s = Math.sin(rot * side + tilt);
  const P = loopPts(len, hh, M).map((q) => {
    const x = q.x * side;
    return { x: kx + x * c - q.y * s, y: ky + x * s + q.y * c };
  });
  const L = [], R = [], lit = [], tw = [], gsA = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), e = Math.min(u, 1 - u) * 2;
    const gth = Math.min(1, e * 2), gs = gth * gth * (3 - 2 * gth);
    const twist = Math.exp(-Math.pow((u - 0.5) / 0.07, 2));
    const wi = wid * 1.1 * (0.42 + 0.58 * gs) * (1 - 0.5 * twist);
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const d = Math.hypot(tx, ty) || 1;
    tx /= d; ty /= d;
    L.push({ x: P[i].x - ty * wi / 2, y: P[i].y + tx * wi / 2 });
    R.push({ x: P[i].x + ty * wi / 2, y: P[i].y - tx * wi / 2 });
    // satin ripples along the ribbon; darker where it gathers into the knot
    // mirrored so the left and right loops are lit the same way
    lit.push(0.5 + 0.5 * Math.cos(Math.atan2(ty, tx * side) - 0.8 + u * 4) + 0.05 * Math.sin(u * 9 + (dark ? 2 : 0)));
    gsA.push(gs);
    tw.push(twist);
  }
  for (let k = 0; k < 6; k++) for (let i = 1; i < n - 1; i++) lit[i] = (lit[i - 1] + 2 * lit[i] + lit[i + 1]) / 4;   // no visible steps
  for (let i = 0; i < n; i++) lit[i] = clamp(lit[i] * (dark ? 0.86 : 1) * (0.72 + 0.28 * gsA[i]), 0, 1);
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(L[0].x, L[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i].x, L[i].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath();
  };

  ctx.save();
  ctx.shadowColor = dark ? "rgba(20,0,6,.3)" : "rgba(20,0,6,.62)";
  ctx.shadowBlur = U * (dark ? 0.28 : 0.4);
  ctx.shadowOffsetY = U * (dark ? 0.1 : 0.16);
  outline();
  ctx.fillStyle = rgb(GOLD.mid);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < n - 1; i++) {
    const lt = (lit[i] + lit[i + 1]) / 2, t2 = (tw[i] + tw[i + 1]) / 2;
    const base = mix(shade(lt), GOLD.dark, 0.45 * t2);
    const g = ctx.createLinearGradient((L[i].x + L[i + 1].x) / 2, (L[i].y + L[i + 1].y) / 2, (R[i].x + R[i + 1].x) / 2, (R[i].y + R[i + 1].y) / 2);
    g.addColorStop(0, rgb(mix(GOLD.dark, base, 0.3)));
    g.addColorStop(0.14, rgb(mix(GOLD.dark, base, 0.72)));
    g.addColorStop(0.5, rgb(mix(base, GOLD.spec, Math.pow(lt, 3) * 0.7)));
    g.addColorStop(0.86, rgb(mix(GOLD.dark, base, 0.72)));
    g.addColorStop(1, rgb(mix(GOLD.dark, base, 0.3)));
    // each piece runs a little under the next one, so no seams show
    const j = Math.min(n - 1, i + 2), e1 = lerpP(L[i + 1], L[j], 0.6), e2 = lerpP(R[i + 1], R[j], 0.6);
    ctx.beginPath();
    ctx.moveTo(L[i].x, L[i].y);
    ctx.lineTo(e1.x, e1.y);
    ctx.lineTo(e2.x, e2.y);
    ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle = g;
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
  }

  // selvedge lines and a very soft outline
  [[0.12, "rgba(255,244,205,.4)"], [0.18, "rgba(80,52,10,.2)"], [0.88, "rgba(80,52,10,.28)"]].forEach(([f, col]) => {
    ctx.beginPath();
    for (let i = 1; i < n - 1; i++) {
      const q = lerpP(L[i], R[i], f);
      i === 1 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y);
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  outline();
  ctx.strokeStyle = "rgba(84,58,16,.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawKnot(sc, tilt = 0) {
  if (sc < 0.03) return;
  const hw = U * 0.3 * sc, hh = U * 0.41 * sc, w = hw * 2, h = hh * 2;
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(tilt * 0.6);
  ctx.lineJoin = "round";

  // a strip of satin wrapped round the loops: puckered edges, pinched sides
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-hw, -hh * 0.92);
    ctx.bezierCurveTo(-hw * 0.5, -hh * 1.08, -hw * 0.15, -hh * 0.86, hw * 0.2, -hh * 1.02);
    ctx.bezierCurveTo(hw * 0.6, -hh * 1.1, hw * 0.9, -hh * 0.9, hw, -hh * 0.95);
    ctx.bezierCurveTo(hw * 0.86, -hh * 0.3, hw * 0.9, hh * 0.3, hw, hh * 0.92);
    ctx.bezierCurveTo(hw * 0.55, hh * 1.06, hw * 0.1, hh * 0.88, -hw * 0.25, hh * 1.04);
    ctx.bezierCurveTo(-hw * 0.6, hh * 1.1, -hw * 0.9, hh * 0.95, -hw, hh * 0.9);
    ctx.bezierCurveTo(-hw * 0.88, hh * 0.3, -hw * 0.9, -hh * 0.3, -hw, -hh * 0.92);
    ctx.closePath();
  };

  shape();
  ctx.shadowColor = "rgba(20,0,6,.5)";
  ctx.shadowBlur = U * 0.2;
  ctx.shadowOffsetY = U * 0.08;
  const g = ctx.createLinearGradient(-hw, -hh, hw, hh);
  [[0, "#f3e4b2"], [0.3, "#e4cb8a"], [0.55, "#bf9d55"], [0.8, "#96763a"], [1, "#6c5020"]].forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = ctx.strokeStyle = g;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.save();
  shape();
  ctx.clip();

  // the end of the strip laid over itself: a lighter diagonal flap with a shadowed edge
  ctx.beginPath();
  ctx.moveTo(hw * 0.1, -hh * 1.1);
  ctx.lineTo(hw * 0.5, -hh * 1.1);
  ctx.lineTo(hw * 0.15, hh * 1.1);
  ctx.lineTo(-hw * 0.2, hh * 1.1);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,246,214,.18)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hw * 0.5, -hh * 1.1);
  ctx.lineTo(hw * 0.15, hh * 1.1);
  ctx.strokeStyle = "rgba(60,36,6,.4)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.translate(-1.4, 0);
  ctx.strokeStyle = "rgba(255,246,214,.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.translate(1.4, 0);

  // creases fanning out as the fabric is gathered toward the bottom
  [-0.6, -0.3, 0, 0.3, 0.6].forEach((j, k) => {
    const bow = (k % 2 ? 1 : -1) * w * 0.07;
    [["rgba(70,44,8,.3)", 0], ["rgba(255,244,205,.35)", 1.5]].forEach(([col, off]) => {
      ctx.beginPath();
      ctx.moveTo(j * hw + off, -hh * 1.1);
      ctx.quadraticCurveTo(j * hw * 0.8 + bow + off, 0, j * hw * 0.55 + off, hh * 1.1);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  });

  // cylinder shading toward the sides, fabric turning away top and bottom
  const cyl = ctx.createLinearGradient(-hw, 0, hw, 0);
  cyl.addColorStop(0, "rgba(50,28,4,.4)");
  cyl.addColorStop(0.22, "rgba(50,28,4,0)");
  cyl.addColorStop(0.75, "rgba(50,28,4,0)");
  cyl.addColorStop(1, "rgba(50,28,4,.45)");
  ctx.fillStyle = cyl;
  ctx.fillRect(-hw, -hh * 1.2, w, h * 1.2);
  const v = ctx.createLinearGradient(0, -hh, 0, hh);
  v.addColorStop(0, "rgba(50,28,4,.35)");
  v.addColorStop(0.25, "rgba(50,28,4,0)");
  v.addColorStop(0.75, "rgba(50,28,4,0)");
  v.addColorStop(1, "rgba(50,28,4,.4)");
  ctx.fillStyle = v;
  ctx.fillRect(-hw, -hh * 1.2, w, h * 1.2);
  // faint wine-colored reflection from the flap on the top edge
  const wr = ctx.createLinearGradient(0, -hh, 0, -hh + h * 0.28);
  wr.addColorStop(0, "rgba(125,32,56,.3)");
  wr.addColorStop(1, "rgba(125,32,56,0)");
  ctx.fillStyle = wr;
  ctx.fillRect(-hw, -hh * 1.2, w, h * 0.5);
  ctx.restore();

  shape();
  ctx.strokeStyle = "rgba(80,54,14,.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // the bow shrinks as the knot comes undone (and bounces back if you let go early)
  const vanish = state === "slide" ? clamp(1 - slideT * 7, 0, 1) : state === "done" ? 0 : 1;
  const sc = clamp(1 - 0.92 * pd, 0, 1.12) * vanish * (1 + 0.018 * Math.sin(time * 1.6));

  drawBand(clamp(sc, 0, 1));
  tails.forEach(drawTail);

  if (sc > 0.03) {
    const len = 2.55 * U * sc, hh = 0.92 * U * sc, wid = 0.5 * U * (0.55 + 0.45 * sc);
    // each loop breathes on its own rhythm; the whole bow leans when tugged and sways in a gust
    const b1 = Math.sin(time * 1.3) * 0.02, b2 = Math.sin(time * 1.05 + 1.9) * 0.024;
    const tilt = lean * 0.1 + clamp(gustX / 240, -1, 1) * 0.035;
    // 4) back loops sit further out, smaller and narrower, so they read as behind the front ones
    [-1, 1].forEach((s, i) => drawLoop(s, 0.74 + 0.3 * pd + (i ? b1 : b2), len * 0.82, hh * 0.88, wid * 0.86, true, tilt));
    [-1, 1].forEach((s, i) => drawLoop(s, 0.04 + 0.35 * pd - (i ? b2 : b1), len * (1 + 0.012 * Math.sin(time * 1.7 + i * 2)), hh, wid, false, tilt));
    drawKnot(clamp(1 - pd * 1.05, 0, 1.05) * vanish, tilt);
  }
}

// --- loop ------------------------------------------------------------------
let idleSkip = false;   // while the bow just rests, draw every other frame (about 30 fps) to save battery

function frame(now) {
  if (state === "idle" && !reduced) {
    idleSkip = !idleSkip;
    if (idleSkip) {
      requestAnimationFrame(frame);
      return;
    }
  }
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;
  time += dt;
  updateState(dt);
  lean += ((held ? clamp((ptr.x - cx) / (tailLen * 1.6), -1, 1) : 0) - lean) * (1 - Math.exp(-dt * 7));

  acc = Math.min(acc + dt, 0.1);
  while (acc >= STEP) {
    acc -= STEP;
    // the knot loosens on a spring: it overshoots a little when it snaps back
    pdv += (200 * (pTarget - pd) - 16 * pdv) * STEP;
    pd += pdv * STEP;
    tails.forEach((t) => stepTail(t, STEP));
  }
  draw();
  if (state !== "done") requestAnimationFrame(frame);
}

// --- input -----------------------------------------------------------------
const local = (e) => {
  const r = envelope.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

// is the pointer on the bow or its tails?
const hit = (p) => Math.abs(p.x - cx) < U * 3 && p.y > tipY - U * 1.5 && p.y < tipY + tailLen + U * 1.2;

function nearestTail(p) {
  let best = tails[1], bd = Infinity;
  tails.forEach((t) =>
    t.n.forEach((q) => {
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) { bd = d; best = t; }
    })
  );
  // near the loops, choose by side
  if (p.y < tipY + U) best = p.x < cx ? tails[0] : tails[1];
  return best;
}

envelope.addEventListener("pointerdown", (e) => {
  if (state !== "idle" && state !== "back") return;
  const p = local(e);
  if (!hit(p)) return;
  if (reduced) {
    state = "done";
    cvs.hidden = true;
    reveal();
    return;
  }
  e.preventDefault();
  audio();
  held = nearestTail(p);
  state = "drag";
  ptr = p;
  downAt = p;
  downTime = performance.now();
  moved = 0;
  envelope.style.cursor = "grabbing";
  try { envelope.setPointerCapture(e.pointerId); } catch (_) { }
  tugSound();
  if (navigator.vibrate) navigator.vibrate(6);
});

envelope.addEventListener("pointermove", (e) => {
  const p = local(e);
  if (state === "drag") {
    ptr = p;
    moved = Math.max(moved, Math.hypot(p.x - downAt.x, p.y - downAt.y));
  } else if (e.pointerType === "mouse" && (state === "idle" || state === "back")) {
    envelope.style.cursor = hit(p) ? "grab" : "";
  }
});

function release() {
  if (state !== "drag") return;
  envelope.style.cursor = "";
  const tap = moved < 8 && performance.now() - downTime < 450;
  if (tap) {
    const t = held;
    held = null;
    state = "idle";
    startAuto(t);
  } else if (pTarget >= 0.42) {
    beginFinish();
  } else {
    state = "back";
    held = null;   // let go: the tail swings and the bow springs back
  }
}
envelope.addEventListener("pointerup", release);
envelope.addEventListener("pointercancel", release);

// keyboard / screen reader / label: same thing as a tap on the bow
openBtn.addEventListener("click", () => {
  if (reduced) {
    state = "done";
    cvs.hidden = true;
    reveal();
    return;
  }
  startAuto(tails[1]);
});

window.addEventListener("resize", () => {
  layout();
  if (state === "idle") draw();
});

layout();
resetTails();
requestAnimationFrame((t) => {
  last = t;
  frame(t);
});

// ---------------------------------------------------------------------------
// Page extras: names written letter by letter, schedule,
// scroll thread, gold dust, photo tilt and "close the envelope" replay
// ---------------------------------------------------------------------------

// names: split into letters so CSS can write them one after another
{
  const h = $(".hero .names");
  h.setAttribute("aria-label", `${INVITE.groom} & ${INVITE.bride}`);
  let k = 0;
  [...h.children].forEach((part) => {
    const txt = part.textContent;
    part.textContent = "";
    part.setAttribute("aria-hidden", "true");
    [...txt].forEach((chr) => {
      const em = document.createElement("em");
      em.className = "ch";
      em.textContent = chr === " " ? "\u00A0" : chr;
      em.style.setProperty("--i", k++);
      part.appendChild(em);
    });
  });
}

// evening schedule (edit it in INVITE.schedule)
{
  const items = INVITE.schedule || [];
  const list = $("#schedList");
  if (!items.length) $(".sched").hidden = true;
  items.forEach((it, i) => {
    const li = document.createElement("li");
    li.className = "rv";
    li.style.setProperty("--d", i * 0.12 + "s");
    li.innerHTML = '<span class="sched__t"></span><span class="sched__n"></span>';
    li.children[0].textContent = it.time;
    li.children[1].textContent = it.title;
    list.appendChild(li);
  });
}

// scroll: satin thread fills, bow pops at the end, photo drifts slower than the page
const thread = $("#thread");
let scrollQueued = false;

function onScroll() {
  const max = invite.scrollHeight - invite.clientHeight;
  const p = max > 0 ? clamp(invite.scrollTop / max, 0, 1) : 0;
  thread.style.setProperty("--p", p.toFixed(4));
  thread.style.setProperty("--bow", clamp((p - 0.9) / 0.1, 0, 1).toFixed(3));
  thread.classList.toggle("is-end", p > 0.9);
  const r = hero.getBoundingClientRect();
  hero.style.setProperty("--py", clamp(((r.top + r.height / 2) - innerHeight / 2) * -0.07, -16, 16).toFixed(1) + "px");
}
invite.addEventListener("scroll", () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
}, { passive: true });

// photo tilts a little toward the pointer
{
  const inner = hero.querySelector(".photo__in");
  hero.addEventListener("pointermove", (e) => {
    if (reduced) return;
    const r = hero.getBoundingClientRect();
    inner.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - 0.5) * 9).toFixed(2) + "deg");
    inner.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(2) + "deg");
  });
  const flat = () => { inner.style.setProperty("--rx", "0deg"); inner.style.setProperty("--ry", "0deg"); };
  hero.addEventListener("pointerleave", flat);
  hero.addEventListener("pointercancel", flat);
}

// gold dust: soft specks drifting upward behind the page
const dustCv = $("#dust");
const dctx = dustCv.getContext("2d");
const sprite = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,244,205,1)");
  gr.addColorStop(0.25, "rgba(241,223,174,.55)");
  gr.addColorStop(1, "rgba(216,189,126,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  return c;
})();
let dustOn = false, dW = 0, dH = 0, specks = [];

const speck = (anywhere) => ({
  x: Math.random() * dW, y: anywhere ? Math.random() * dH : dH + 12,
  s: 2 + Math.random() * 5, v: 6 + Math.random() * 14, ph: Math.random() * 6.28, sw: 8 + Math.random() * 16
});

function dustLayout() {
  const r = Math.min(2, window.devicePixelRatio || 1);
  dW = innerWidth;
  dH = innerHeight;
  dustCv.width = dW * r;
  dustCv.height = dH * r;
  dctx.setTransform(r, 0, 0, r, 0, 0);
  specks = Array.from({ length: Math.round(clamp((dW * dH) / 26000, 18, 60)) }, () => speck(true));
}

function startDust() {
  if (reduced || dustOn) return;
  dustOn = true;
  dustLayout();
  let t0 = performance.now();
  const loop = (now) => {
    if (!dustOn) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    dctx.clearRect(0, 0, dW, dH);
    specks.forEach((p, i) => {
      p.y -= p.v * dt;
      p.x += Math.sin(now / 1000 * 0.5 + p.ph) * p.sw * dt;
      if (p.y < -12) specks[i] = speck(false);
      dctx.globalAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(now / 1000 * 1.6 + p.ph));
      dctx.drawImage(sprite, p.x - p.s * 2, p.y - p.s * 2, p.s * 4, p.s * 4);
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
window.addEventListener("resize", () => {
  if (dustOn) dustLayout();
  onScroll();
});

// close the envelope: the invitation fades away and the ribbon is tied again
function closeEnvelope() {
  if (!opened) return;
  dustOn = false;
  document.body.classList.remove("is-page");
  invite.setAttribute("inert", "");
  invite.setAttribute("aria-hidden", "true");
  all(".rv").forEach((el) => el.classList.remove("in"));
  envelope.classList.add("is-resetting");
  envelope.classList.remove("is-open");
  state = "idle";
  pd = pdv = pTarget = 0;
  held = null;
  sOff = 0;
  slideT = 0;
  dir = 1;
  revealed = false;
  opened = false;
  cvs.hidden = false;
  layout();
  resetTails();
  openBtn.tabIndex = 0;
  scratchReset();
  fwItems = [];
  fctx.clearRect(0, 0, fwW, fwH);
  acc = 0;
  requestAnimationFrame((t) => { last = t; frame(t); });
  setTimeout(() => envelope.classList.remove("is-resetting"), 1600);
  openBtn.focus({ preventScroll: true });
}
$("#again").addEventListener("click", closeEnvelope);

// ---------------------------------------------------------------------------
// Scratch-off foil over the date
//   - a wide gold plaque (not just the text), so it is easy to rub on a phone
//   - soft round brush, gold flakes fly off, a quiet scratching sound
//   - a coin shows what to do; progress is counted on a grid, and the foil
//     falls away by itself once about half of it has been rubbed off
// ---------------------------------------------------------------------------
const scratch = $("#scratch");
const scv = $("#scratchCv");
const sctx = scv.getContext("2d");

const HINT_TEXT = "Rub the gold to reveal the date";
const scratchHint = document.createElement("small");
scratchHint.className = "scratch__hint";
scratchHint.textContent = HINT_TEXT;
scratch.after(scratchHint);

const scratchCoin = document.createElement("i");
scratchCoin.className = "scratch__coin";
scratchCoin.setAttribute("aria-hidden", "true");
scratch.appendChild(scratchCoin);

const CELL = 10;          // size of one square of the progress grid, in px
const NEED = 0.5;         // share of the foil that must be rubbed off
let scratched = false, scratching = false, lastPt = null, lastSound = 0, flakeCount = 0;
let gridMap = null, gCols = 0, gRows = 0, gDone = 0, brushR = 26;

// soft round brush: the middle erases fully, the edge fades out
const brush = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(0,0,0,1)");
  gr.addColorStop(0.55, "rgba(0,0,0,.95)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return c;
})();

function foilStar(x, y, s) {
  sctx.beginPath();
  sctx.moveTo(x, y - s);
  sctx.quadraticCurveTo(x, y, x + s, y);
  sctx.quadraticCurveTo(x, y, x, y + s);
  sctx.quadraticCurveTo(x, y, x - s, y);
  sctx.quadraticCurveTo(x, y, x, y - s);
  sctx.closePath();
  sctx.fill();
}

function foil() {
  const r = Math.min(2, window.devicePixelRatio || 1);
  const w = scratch.offsetWidth, h = scratch.offsetHeight;
  if (!w || !h) return;
  scv.width = Math.round(w * r);
  scv.height = Math.round(h * r);
  sctx.setTransform(r, 0, 0, r, 0, 0);
  sctx.globalCompositeOperation = "source-over";
  sctx.globalAlpha = 1;

  brushR = clamp(h * 0.42, 20, 30);
  gCols = Math.ceil(w / CELL);
  gRows = Math.ceil(h / CELL);
  gridMap = new Uint8Array(gCols * gRows);
  gDone = 0;

  // base metal
  const g = sctx.createLinearGradient(0, 0, w, h);
  [[0, "#8a6a2c"], [0.18, "#d9bf7e"], [0.38, "#f6e9be"], [0.55, "#cfae66"], [0.78, "#ecd9a2"], [1, "#8a6a2c"]].forEach(([o, c]) => g.addColorStop(o, c));
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, w, h);

  // brushed grain: fine horizontal streaks
  for (let y = 0; y < h; y += 1.5) {
    sctx.fillStyle = Math.random() < 0.5
      ? `rgba(255,248,220,${(Math.random() * 0.16).toFixed(3)})`
      : `rgba(80,52,10,${(Math.random() * 0.14).toFixed(3)})`;
    sctx.fillRect(0, y, w, 1);
  }

  // fine speckle so it reads as foil
  for (let i = 0; i < (w * h) / 55; i++) {
    sctx.fillStyle = Math.random() < 0.5 ? "rgba(255,248,220,.35)" : "rgba(90,60,10,.25)";
    sctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
  }

  // a few diagonal glints
  sctx.save();
  sctx.translate(w / 2, h / 2);
  sctx.rotate(-0.5);
  [[-0.28, 0.1], [0.05, 0.06], [0.3, 0.12]].forEach(([p, a]) => {
    sctx.fillStyle = `rgba(255,250,230,${a})`;
    sctx.fillRect(w * p - w * 0.03, -h * 2, w * 0.05, h * 4);
  });
  sctx.restore();

  // bevelled edge
  sctx.strokeStyle = "rgba(255,246,214,.7)";
  sctx.lineWidth = 1.5;
  sctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
  sctx.strokeStyle = "rgba(70,44,8,.35)";
  sctx.lineWidth = 1;
  sctx.strokeRect(3.5, 3.5, w - 7, h - 7);

  // embossed label with little stars
  const fs = clamp(h * 0.18, 11, 14);
  sctx.font = `500 ${fs}px ${getComputedStyle(document.body).fontFamily}`;
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  if ("letterSpacing" in sctx) sctx.letterSpacing = "4px";
  const label = "SCRATCH HERE";
  const tw = sctx.measureText(label).width;
  sctx.fillStyle = "rgba(255,248,224,.75)";
  sctx.fillText(label, w / 2 + 2, h / 2 + 1.8);
  sctx.fillStyle = "rgba(70,44,8,.85)";
  sctx.fillText(label, w / 2 + 2, h / 2 + 0.8);
  sctx.fillStyle = "rgba(255,248,224,.85)";
  foilStar(w / 2 - tw / 2 - 12, h / 2, 5);
  foilStar(w / 2 + tw / 2 + 16, h / 2, 5);
  if ("letterSpacing" in sctx) sctx.letterSpacing = "0px";
}

// mark the squares of the grid that the brush has touched
function markCells(x, y) {
  const rr = brushR * 0.8;
  const c0 = Math.max(0, Math.floor((x - rr) / CELL)), c1 = Math.min(gCols - 1, Math.floor((x + rr) / CELL));
  const r0 = Math.max(0, Math.floor((y - rr) / CELL)), r1 = Math.min(gRows - 1, Math.floor((y + rr) / CELL));
  for (let rw = r0; rw <= r1; rw++) {
    for (let cl = c0; cl <= c1; cl++) {
      if (Math.hypot((cl + 0.5) * CELL - x, (rw + 0.5) * CELL - y) > rr) continue;
      const k = rw * gCols + cl;
      if (!gridMap[k]) { gridMap[k] = 1; gDone++; }
    }
  }
}

function rub(a, b) {
  sctx.globalCompositeOperation = "destination-out";
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const step = Math.max(2, brushR * 0.25);
  const n = Math.max(1, Math.ceil(d / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    sctx.drawImage(brush, x - brushR, y - brushR, brushR * 2, brushR * 2);
    markCells(x, y);
  }
}

// quiet scratching sound (uses the same little synth as the ribbon)
function scratchSound() {
  const c = audio();
  if (!c) return;
  noise(c, c.currentTime, 0.05, 3200, 0.022);
}

// two soft bells when the date is uncovered
function chime() {
  const c = audio();
  if (!c) return;
  [1318.5, 1760].forEach((f, i) => {
    const t = c.currentTime + i * 0.09;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.95);
  });
}

// gold flakes flying off the foil while rubbing
function flakes(p) {
  const now = performance.now();
  if (now - lastSound > 70) { lastSound = now; scratchSound(); }
  if (reduced || flakeCount >= 22) return;
  const f = document.createElement("i");
  f.className = "flake";
  f.style.left = p.x + "px";
  f.style.top = p.y + "px";
  f.style.setProperty("--s", 3 + Math.random() * 4 + "px");
  f.style.setProperty("--dx", (Math.random() - 0.5) * 34 + "px");
  f.style.setProperty("--dy", 10 + Math.random() * 24 + "px");
  flakeCount++;
  f.addEventListener("animationend", () => { f.remove(); flakeCount--; });
  scratch.appendChild(f);
}

function revealDate() {
  if (scratched) return;
  scratched = true;
  scv.classList.add("done");
  scratch.classList.add("revealed");
  scratchHint.classList.add("gone");
  burst(scratch, 22);
  chime();
  if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
}

function scratchReset() {
  scratched = false;
  scratching = false;
  scv.classList.remove("done");
  scratch.classList.remove("revealed", "touched");
  scratchHint.classList.remove("gone");
  scratchHint.textContent = HINT_TEXT;
  foil();
}

function scratchProgress() {
  if (scratched || !gridMap) return;
  const p = gDone / (gCols * gRows);
  if (p >= NEED) revealDate();
  else if (p > 0.2) scratchHint.textContent = "Keep going…";
}

const spot = (e) => {
  const r = scv.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * scv.offsetWidth, y: ((e.clientY - r.top) / r.height) * scv.offsetHeight };
};

scv.addEventListener("pointerdown", (e) => {
  if (scratched) return;
  e.preventDefault();
  scratching = true;
  scratch.classList.add("touched");
  lastPt = spot(e);
  try { scv.setPointerCapture(e.pointerId); } catch (_) { }
  rub(lastPt, lastPt);
  flakes(lastPt);
  scratchProgress();
});
scv.addEventListener("pointermove", (e) => {
  if (!scratching) return;
  const p = spot(e);
  rub(lastPt, p);
  lastPt = p;
  flakes(p);
  scratchProgress();
});
const endRub = () => {
  if (!scratching) return;
  scratching = false;
  scratchProgress();
};
scv.addEventListener("pointerup", endRub);
scv.addEventListener("pointercancel", endRub);
scv.addEventListener("keydown", (e) => {   // keyboard: Enter or Space uncovers it
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    revealDate();
  }
});
new ResizeObserver(() => { if (!scratched && !scratching) foil(); }).observe(scratch);
foil();

// ---------------------------------------------------------------------------
// Signature label for screen readers
// ---------------------------------------------------------------------------
$("#sign").setAttribute("aria-label", `${INVITE.groom} & ${INVITE.bride}`);

// ---------------------------------------------------------------------------
// Fireworks: tap the bow at the end of the thread
// ---------------------------------------------------------------------------
const fwCv = $("#fw");
const fctx = fwCv.getContext("2d");
let fwItems = [], fwOn = false, fwW = 0, fwH = 0;

function fwSize() {
  const r = Math.min(2, window.devicePixelRatio || 1);
  fwW = innerWidth;
  fwH = innerHeight;
  fwCv.width = fwW * r;
  fwCv.height = fwH * r;
  fctx.setTransform(r, 0, 0, r, 0, 0);
}

function fwLaunch(x, y, delay) {
  fwItems.push({
    k: "r", x, y, x0: x, y0: y,
    tx: fwW * (0.18 + Math.random() * 0.64), ty: fwH * (0.12 + Math.random() * 0.38),
    t: -delay, dur: 0.85 + Math.random() * 0.3
  });
}

function fwBurst(x, y, out) {
  for (let i = 0; i < 54; i++) {
    const a = (i / 54) * Math.PI * 2 + Math.random() * 0.2, v = 90 + Math.random() * 190;
    out.push({ k: "p", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.2 + Math.random() * 0.9, s: 2 + Math.random() * 3 });
  }
  const c = audio();
  if (c) {
    noise(c, c.currentTime, 0.16, 500, 0.09);
    noise(c, c.currentTime + 0.05, 0.3, 2500, 0.04);
  }
}

function fwStart() {
  if (fwOn) return;
  fwOn = true;
  fwSize();
  let t0 = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    fctx.globalCompositeOperation = "destination-out";   // fade the old frame, so everything leaves a trail
    fctx.fillStyle = "rgba(0,0,0,.24)";
    fctx.fillRect(0, 0, fwW, fwH);
    fctx.globalCompositeOperation = "lighter";
    const born = [];
    fwItems = fwItems.filter((o) => {
      if (o.k === "r") {
        o.t += dt;
        if (o.t < 0) return true;
        const u = clamp(o.t / o.dur, 0, 1), e = 1 - Math.pow(1 - u, 3);
        o.x = o.x0 + (o.tx - o.x0) * e;
        o.y = o.y0 + (o.ty - o.y0) * e;
        fctx.globalAlpha = 1;
        fctx.drawImage(sprite, o.x - 7, o.y - 7, 14, 14);
        if (u >= 1) { fwBurst(o.x, o.y, born); return false; }
        return true;
      }
      o.life += dt;
      if (o.life >= o.max) return false;
      o.vy += 140 * dt;
      o.vx *= 1 - 0.9 * dt;
      o.vy *= 1 - 0.9 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      const a = 1 - o.life / o.max, s = o.s * 2.5 * (0.6 + 0.4 * a);
      fctx.globalAlpha = a;
      fctx.drawImage(sprite, o.x - s, o.y - s, s * 2, s * 2);
      return true;
    }).concat(born);
    if (!fwItems.length) {
      fctx.globalCompositeOperation = "source-over";
      fctx.clearRect(0, 0, fwW, fwH);
      fwOn = false;
      return;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

$("#bowBtn").addEventListener("click", () => {
  if (reduced) return;
  const r = $("#bowBtn").getBoundingClientRect();
  fwSize();
  [0, 0.3, 0.6, 0.9].forEach((d) => fwLaunch(r.left + r.width / 2, r.top, d));
  fwStart();
  if (navigator.vibrate) navigator.vibrate(15);
});


/* ===================== 2) music.js ===================== */

// Background music, synthesized live with Web Audio (no audio files needed).
//
// The piece: a slow, warm waltz-less ballad in D major at 70 BPM. It follows the
// classic eight-chord wedding progression (D A Bm F#m G D G A), with a soft
// piano-like arpeggio, a low bass note, a warm pad and a little music-box melody
// that echoes into a big reverb. It starts when the invitation opens, fades out
// when the envelope is closed, and can be switched off with the round button.
(() => {
  const btn = document.getElementById("music");
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!btn || !Ctx) {
    if (btn) btn.hidden = true;
    return;
  }

  // ---- the score -----------------------------------------------------------
  const BPM = 70;
  const E = 60 / BPM / 2;          // one eighth note, in seconds
  const LEVEL = 0.85;              // overall volume (0 to 1)

  // one entry per bar, 8 bars, then it loops
  const BASS = [38, 45, 47, 42, 43, 38, 43, 45];
  const ARP = [
    [50, 57, 62, 66, 69, 66, 62, 57],   // D
    [52, 57, 61, 64, 69, 64, 61, 57],   // A
    [54, 59, 62, 66, 71, 66, 62, 59],   // Bm
    [49, 54, 57, 61, 66, 61, 57, 54],   // F#m
    [50, 55, 59, 62, 67, 62, 59, 55],   // G
    [50, 57, 62, 66, 69, 66, 62, 57],   // D
    [50, 55, 59, 62, 67, 62, 59, 55],   // G
    [52, 57, 61, 64, 69, 64, 61, 57]    // A
  ];
  const PAD = [
    [57, 62, 66], [57, 61, 64], [59, 62, 66], [57, 61, 66],
    [59, 62, 67], [57, 62, 66], [59, 62, 67], [57, 61, 64]
  ];
  // melody: [bar, eighth within the bar, midi note, length in eighths]
  const MELODY = [
    [0, 0, 78, 3], [0, 3, 76, 1], [0, 4, 74, 4],
    [1, 0, 73, 3], [1, 3, 74, 1], [1, 4, 76, 4],
    [2, 0, 74, 3], [2, 3, 71, 1], [2, 4, 74, 2], [2, 6, 78, 2],
    [3, 0, 76, 3], [3, 3, 73, 1], [3, 4, 73, 4],
    [4, 0, 79, 3], [4, 3, 78, 1], [4, 4, 74, 4],
    [5, 0, 78, 2], [5, 2, 81, 2], [5, 4, 78, 2], [5, 6, 74, 2],
    [6, 0, 79, 3], [6, 3, 78, 1], [6, 4, 76, 2], [6, 6, 74, 2],
    [7, 0, 73, 4], [7, 4, 76, 2], [7, 6, 73, 2]
  ];
  const MEL = {};
  MELODY.forEach(([bar, pos, midi, len]) => { MEL[bar * 8 + pos] = [midi, len]; });

  // ---- audio graph ---------------------------------------------------------
  let ctx = null, master = null, bus = null, echoIn = null;
  let timer = null, stopTimer = null;
  let nextT = 0, step = 0;
  let pageOn = false;    // the invitation page is showing
  let muted = false;     // the guest switched the music off

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const on = () => pageOn && !muted;

  // a made-up room: decaying noise makes a soft, long reverb
  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function build() {
    if (ctx) return;
    ctx = new Ctx();

    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    master.connect(comp);
    comp.connect(ctx.destination);

    const dry = ctx.createGain();
    dry.gain.value = 0.8;
    dry.connect(master);

    const verb = ctx.createConvolver();
    verb.buffer = impulse(3.4, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    verb.connect(wet);
    wet.connect(master);

    bus = ctx.createGain();          // every instrument goes in here
    bus.connect(dry);
    bus.connect(verb);

    // a soft dotted-eighth echo, mostly for the music-box melody
    echoIn = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = E * 1.5;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2600;
    const fb = ctx.createGain();
    fb.gain.value = 0.34;
    echoIn.connect(delay);
    delay.connect(tone);
    tone.connect(fb);
    fb.connect(delay);
    tone.connect(bus);
  }

  // ---- instruments ---------------------------------------------------------
  // soft piano-like note: a few sine/triangle partials through a closing filter
  function pluck(t, midi, vel, dur) {
    const f = mtof(midi);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(Math.min(6500, f * 7), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 1.5), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    [["triangle", 1, 1], ["sine", 2, 0.28], ["sine", 3, 0.08]].forEach(([type, mul, amp]) => {
      const o = ctx.createOscillator();
      const a = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mul;
      o.detune.value = (Math.random() - 0.5) * 6;
      a.gain.value = amp;
      o.connect(a);
      a.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
    lp.connect(g);
    g.connect(bus);
  }

  // music-box bell for the melody, with a send into the echo
  function bell(t, midi, vel, dur) {
    const f = mtof(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    [[1, 1], [2, 0.2], [3.01, 0.07]].forEach(([mul, amp]) => {
      const o = ctx.createOscillator();
      const a = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f * mul;
      a.gain.value = amp;
      o.connect(a);
      a.connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
    g.connect(bus);
    const send = ctx.createGain();
    send.gain.value = 0.55;
    g.connect(send);
    send.connect(echoIn);
  }

  // warm pad: two slightly detuned saws per note, filtered dark, slow swell
  function pad(t, midis, dur) {
    midis.forEach((m) => {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 850;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.016, t + 1.3);
      g.gain.setValueAtTime(0.016, t + dur - 1.6);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      [-6, 6].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = mtof(m);
        o.detune.value = cents;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.05);
      });
      lp.connect(g);
      g.connect(bus);
    });
  }

  function bass(t, midi, dur) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ---- the sequencer: schedules a little ahead of the clock ----------------
  function schedule() {
    while (nextT < ctx.currentTime + 0.5) {
      const bar = (step >> 3) % 8;
      const pos = step & 7;
      const t = nextT + Math.random() * 0.012;   // tiny human timing wobble

      pluck(t, ARP[bar][pos], (pos === 0 ? 0.15 : pos === 4 ? 0.1 : 0.065) * (0.9 + Math.random() * 0.2), E * 5);
      if (pos === 0) {
        bass(t, BASS[bar], E * 7.5);
        pad(t, PAD[bar], E * 8 + 1.6);
      }
      const m = MEL[step];
      if (m) bell(t, m[0], 0.1 * (0.9 + Math.random() * 0.2), m[1] * E + 0.7);

      nextT += E;
      step = (step + 1) % 64;
    }
  }

  // ---- start / stop --------------------------------------------------------
  function start() {
    if (!on()) return;
    build();
    clearTimeout(stopTimer);
    stopTimer = null;
    ctx.resume();
    if (!timer) {
      nextT = ctx.currentTime + 0.2;
      step = 0;
      timer = setInterval(schedule, 120);
      schedule();
    }
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(LEVEL, now + 4);   // slow fade-in
    paint();
  }

  function stop() {
    paint();
    if (!ctx || !timer) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 1.2);   // fade-out
    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      clearInterval(timer);
      timer = null;
      if (!on()) ctx.suspend();
    }, 1400);
  }

  // ---- the button ----------------------------------------------------------
  function paint() {
    const isOn = on();
    btn.classList.toggle("is-on", isOn);
    btn.setAttribute("aria-pressed", String(isOn));
    btn.setAttribute("aria-label", isOn ? "Turn the music off" : "Turn the music on");
    btn.title = isOn ? "Music on" : "Music off";
  }

  btn.addEventListener("click", () => {
    muted = !muted;
    if (muted) stop();
    else start();
    paint();
  });

  // the music follows the invitation: it starts when the page opens and fades when the envelope is closed
  new MutationObserver(() => {
    const now = document.body.classList.contains("is-page");
    if (now === pageOn) return;
    pageOn = now;
    if (pageOn) start();
    else stop();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // browsers only allow sound after a tap or key press: get the audio ready on the first one
  // (the ribbon pull is that first tap)
  const unlock = () => {
    build();
    if (ctx.state === "suspended" && !document.hidden && (on() || !timer)) ctx.resume();
  };
  ["pointerdown", "keydown", "touchend", "click"].forEach((ev) =>
    window.addEventListener(ev, unlock, { capture: true, passive: true })
  );

  // pause while the tab is in the background
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (on()) ctx.resume();
  });

  paint();
})();


/* ===================== 3) gallery.js ===================== */

// Photo gallery: a swipeable "coverflow" carousel plus a full-screen viewer.
//
// To use your own photos, put 10 images in a folder named "gallery" next to
// index.html (01.jpg ... 10.jpg) or edit the list below. Until a photo exists,
// its card shows a monogram-style placeholder, just like the main photo.
(() => {
  const PHOTOS = [
    { src: "gallery/01.jpg", caption: "Where it began" },
    { src: "gallery/02.jpg", caption: "Laughter" },
    { src: "gallery/03.jpg", caption: "Adventures" },
    { src: "gallery/04.jpg", caption: "Quiet moments" },
    { src: "gallery/05.jpg", caption: "Golden hours" },
    { src: "gallery/06.jpg", caption: "Side by side" },
    { src: "gallery/07.jpg", caption: "Our favourite place" },
    { src: "gallery/08.jpg", caption: "Sweet surprises" },
    { src: "gallery/09.jpg", caption: "Celebrations" },
    { src: "gallery/10.jpg", caption: "Forever starts here" }
  ];

  const $ = (id) => document.getElementById(id);
  const track = $("gTrack");
  if (!track) return;

  const n = PHOTOS.length;
  const pad2 = (i) => String(i + 1).padStart(2, "0");
  const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const prevBtn = $("gPrev"), nextBtn = $("gNext"), countEl = $("gCount"), barEl = $("gBar");
  const pageEl = $("invite");

  // ---- build the cards -----------------------------------------------------
  const cards = PHOTOS.map((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gcard";
    b.setAttribute("aria-label", `Photo ${i + 1} of ${n}: ${p.caption}. Open larger view`);
    b.innerHTML =
      '<span class="gcard__frame"><img class="gcard__img" alt="" decoding="async" loading="lazy">' +
      '<span class="gcard__ph" aria-hidden="true"></span></span><span class="gcard__cap"></span>';
    const frame = b.firstChild;
    const img = frame.firstChild;
    frame.lastChild.textContent = pad2(i);
    b.lastChild.textContent = p.caption;
    const ok = () => frame.classList.add("has-image");
    img.addEventListener("load", ok);
    img.alt = p.caption;
    img.src = p.src;
    if (img.complete && img.naturalWidth) ok();
    track.appendChild(b);
    return b;
  });

  // ---- carousel ------------------------------------------------------------
  let active = -1, raf = 0;

  const targetLeft = (i) => cards[i].offsetLeft + cards[i].offsetWidth / 2 - track.clientWidth / 2;

  function goTo(i, smooth = true) {
    i = clampN(i, 0, n - 1);
    track.scrollTo({ left: targetLeft(i), behavior: smooth && !reduced ? "smooth" : "auto" });
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    cards.forEach((c, k) => {
      c.classList.toggle("is-active", k === i);
      if (k === i) c.setAttribute("aria-current", "true");
      else c.removeAttribute("aria-current");
    });
    countEl.textContent = `${i + 1} / ${n}`;
    barEl.style.transform = `scaleX(${(i + 1) / n})`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === n - 1;
  }

  // every card is scaled, dimmed and turned a little according to how far it is from the centre
  function update() {
    raf = 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const stepW = cards[0].offsetWidth + gap;
    const vc = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const d = (c.offsetLeft + c.offsetWidth / 2 - vc) / stepW;
      const ad = Math.abs(d);
      if (ad < bestD) { bestD = ad; best = i; }
      const k = Math.min(ad, 2);
      const rot = reduced ? 0 : clampN(-d, -1.5, 1.5) * 16;
      c.style.transform = `scale(${(1 - 0.13 * k).toFixed(3)}) rotateY(${rot.toFixed(1)}deg)`;
      c.style.opacity = (1 - 0.3 * k).toFixed(2);
      c.style.zIndex = String(10 - Math.round(ad * 2));
    });
    setActive(best);
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };

  track.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("load", queue);
  prevBtn.addEventListener("click", () => goTo(active - 1));
  nextBtn.addEventListener("click", () => goTo(active + 1));
  update();

  // mouse: drag the strip with the pointer (touch and trackpad already scroll natively)
  let drag = null, suppress = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: 0 };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved > 5) {
      track.classList.add("is-drag");
      track.scrollLeft = drag.left - dx;
    }
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved > 5;
    drag = null;
    track.classList.remove("is-drag");
    if (moved) {
      suppress = true;
      setTimeout(() => { suppress = false; }, 0);
      goTo(active);
    }
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // a tap on the centre photo opens it; a tap on a side photo brings it to the centre
  track.addEventListener("click", (e) => {
    if (suppress) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  track.addEventListener("click", (e) => {
    const c = e.target.closest(".gcard");
    if (!c) return;
    const i = cards.indexOf(c);
    if (i === active) openBox(i);
    else goTo(i);
  });

  // ---- full-screen viewer --------------------------------------------------
  const lb = $("lightbox"), lbFig = $("lbFig"), lbImg = $("lbImg"), lbPh = $("lbPh");
  const lbCap = $("lbCap"), lbCount = $("lbCount");
  let cur = 0, opener = null, isOpen = false;

  function showBox(i) {
    cur = (i + n) % n;
    const p = PHOTOS[cur];
    const mine = cur;   // ignore a late load event from a photo the guest already left
    lbFig.classList.remove("ok");
    lbImg.onload = () => { if (mine === cur) lbFig.classList.add("ok"); };
    lbImg.onerror = () => lbFig.classList.remove("ok");
    lbImg.alt = p.caption;
    lbImg.src = p.src;
    // an image already in cache may not fire "load" again
    if (lbImg.complete && lbImg.naturalWidth) lbFig.classList.add("ok");
    lbPh.textContent = pad2(cur);
    lbCap.textContent = p.caption;
    lbCount.textContent = `${cur + 1} / ${n}`;
    goTo(cur, false);   // the carousel behind stays on the same photo
  }

  function openBox(i) {
    opener = document.activeElement;
    isOpen = true;
    pageEl.setAttribute("inert", "");
    lb.removeAttribute("inert");
    lb.setAttribute("aria-hidden", "false");
    lb.classList.add("lb-open");
    showBox(i);
    $("lbClose").focus({ preventScroll: true });
  }

  function closeBox() {
    if (!isOpen) return;
    isOpen = false;
    lb.classList.remove("lb-open");
    lb.setAttribute("inert", "");
    lb.setAttribute("aria-hidden", "true");
    if (document.body.classList.contains("is-page")) pageEl.removeAttribute("inert");
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  $("lbClose").addEventListener("click", closeBox);
  $("lbPrev").addEventListener("click", () => showBox(cur - 1));
  $("lbNext").addEventListener("click", () => showBox(cur + 1));
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.classList.contains("lb__stage")) closeBox();
  });
  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") closeBox();
    else if (e.key === "ArrowLeft") showBox(cur - 1);
    else if (e.key === "ArrowRight") showBox(cur + 1);
  });

  // swipe left / right inside the viewer
  let sx = null;
  lb.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") sx = e.clientX; });
  lb.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 60) showBox(cur + (dx < 0 ? 1 : -1));
  });
  lb.addEventListener("pointercancel", () => { sx = null; });
})();


/* ===================== 4) rsvp.js ===================== */

// RSVP / attendance confirmation.
//
// A static website has no server of its own, so the reply has to be delivered somewhere.
// Fill in ONE of these (they are tried in this order):
//   endpoint  - a form service address (Formspree, Getform, Web3Forms, a Google Apps Script...).
//               The reply is sent silently in the background as JSON.
//   whatsapp  - your number with the country code, digits only (e.g. "201001234567").
//               WhatsApp opens with the reply already written; the guest just presses send.
//   email     - the guest's mail app opens with the reply already written.
// If all three are empty, the guest gets a "Copy my reply" button instead.
(() => {
  const RSVP = {
    endpoint: "",
    whatsapp: "",
    email: "",
    deadline: "",      // optional line under the title, e.g. "Kindly reply by 1 December 2026"
    maxGuests: 6       // the most people one reply can cover (the guest included)
  };

  const $ = (id) => document.getElementById(id);
  const form = $("rsvpForm");
  if (!form) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const who = typeof INVITE !== "undefined" ? INVITE : { groom: "", bride: "" };
  const coupleName = `${who.groom} & ${who.bride}`;
  const STORE = `rsvp:${coupleName}`;

  const card = $("rsvp");
  const nameIn = $("rsvpName"), noteIn = $("rsvpNote"), withIn = $("rsvpWith"), trap = form.elements.website;
  const guestsBox = $("rsvpGuests"), withBox = $("rsvpWho");
  const minus = $("gMinus"), plus = $("gPlus"), num = $("gNum");
  const sendBtn = $("rsvpSend"), formErr = $("rsvpFormErr");
  const thanks = $("rsvpThanks"), tTitle = $("thanksTitle"), tText = $("thanksText"), tSum = $("thanksSum");
  const act = $("rsvpAct"), edit = $("rsvpEdit"), seal = $("rsvpSeal");

  let guests = 1;
  let onAct = null;

  // ---- small setup ---------------------------------------------------------
  if (RSVP.deadline) {
    $("rsvpDeadline").textContent = RSVP.deadline;
    $("rsvpDeadline").hidden = false;
  }
  $("sealTxt").textContent = `${(who.groom || "")[0] || ""}&${(who.bride || "")[0] || ""}`;

  // the "RSVP" button next to the directions button scrolls here
  const link = $("rsvpLink");
  if (link) {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    });
  }

  // ---- the form ------------------------------------------------------------
  const attending = () => (form.elements.attending.value || "");   // "yes", "no" or ""

  function sync() {
    const yes = attending() === "yes";
    guestsBox.hidden = !yes;
    withBox.hidden = !(yes && guests > 1);
    num.textContent = String(guests);
    minus.disabled = guests <= 1;
    plus.disabled = guests >= RSVP.maxGuests;
  }

  form.addEventListener("change", (e) => {
    if (e.target.name === "attending") clearBad("attending");
    sync();
  });
  minus.addEventListener("click", () => { guests = Math.max(1, guests - 1); sync(); });
  plus.addEventListener("click", () => { guests = Math.min(RSVP.maxGuests, guests + 1); sync(); });
  nameIn.addEventListener("input", () => clearBad("name"));

  function field(key) { return form.querySelector(`[data-field="${key}"]`); }
  function setBad(key, msg) {
    const f = field(key);
    f.classList.add("is-bad");
    f.querySelector(".rsvp__err").textContent = msg;
    const c = f.querySelector("input,textarea");
    if (c) c.setAttribute("aria-invalid", "true");
  }
  function clearBad(key) {
    const f = field(key);
    f.classList.remove("is-bad");
    f.querySelector(".rsvp__err").textContent = "";
    const c = f.querySelector("input,textarea");
    if (c) c.removeAttribute("aria-invalid");
  }

  function validate() {
    let ok = true;
    formErr.textContent = "";
    if (nameIn.value.trim().length < 2) {
      setBad("name", "Please tell us your name.");
      nameIn.focus();
      ok = false;
    }
    if (!attending()) {
      setBad("attending", "Please choose your reply.");
      if (ok) form.querySelector('input[name="attending"]').focus();
      ok = false;
    }
    return ok;
  }

  // ---- what gets sent ------------------------------------------------------
  function collect() {
    const yes = attending() === "yes";
    return {
      couple: coupleName,
      name: nameIn.value.trim(),
      attending: yes ? "yes" : "no",
      guests: yes ? guests : 0,
      companions: yes && guests > 1 ? withIn.value.trim() : "",
      note: noteIn.value.trim(),
      sentAt: new Date().toISOString()
    };
  }

  function message(d) {
    const lines = [
      `RSVP – ${coupleName}`,
      `Name: ${d.name}`,
      `Reply: ${d.attending === "yes" ? "Joyfully accepts" : "Regretfully declines"}`
    ];
    if (d.attending === "yes") {
      lines.push(`Guests: ${d.guests}`);
      if (d.companions) lines.push(`With: ${d.companions}`);
    }
    if (d.note) lines.push(`Note: ${d.note}`);
    return lines.join("\n");
  }

  const waUrl = (text) => `https://wa.me/${RSVP.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  const mailUrl = (text) => `mailto:${RSVP.email}?subject=${encodeURIComponent(`RSVP – ${coupleName}`)}&body=${encodeURIComponent(text)}`;

  // opens a link in a new tab (an invisible <a> click keeps working inside a tap on phones)
  function openLink(url) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t);
      t.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (__) { }
      t.remove();
      return ok;
    }
  }

  async function post(d) {
    try {
      const r = await fetch(RSVP.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(d)
      });
      return r.ok;
    } catch (_) {
      return false;
    }
  }

  // ---- send ----------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const d = collect();
    const text = message(d);
    let how;

    if (trap && trap.value) {          // a bot filled the hidden field: pretend it worked
      showThanks(d, "sent", text, true);
      return;
    }

    if (RSVP.endpoint) {
      sendBtn.disabled = true;
      const label = sendBtn.lastChild.textContent;
      sendBtn.lastChild.textContent = " Sending…";
      const ok = await post(d);
      sendBtn.disabled = false;
      sendBtn.lastChild.textContent = label;
      if (!ok) {
        formErr.textContent = "We couldn't send your reply just now. Please try again in a moment.";
        return;
      }
      how = "sent";
    } else if (RSVP.whatsapp) {
      openLink(waUrl(text));
      how = "wa";
    } else if (RSVP.email) {
      location.href = mailUrl(text);
      how = "mail";
    } else {
      how = "manual";
    }
    showThanks(d, how, text, false);
  });

  // ---- thank-you state -----------------------------------------------------
  function showThanks(d, how, text, restored) {
    const yes = d.attending === "yes";
    const first = d.name.split(/\s+/)[0];
    tTitle.textContent = yes ? "We'll see you there!" : "We'll miss you";

    if (restored) {
      tText.textContent = yes
        ? "Your reply is saved on this device. We can't wait to celebrate with you."
        : "Your reply is saved on this device. Thank you for letting us know.";
    } else if (how === "sent") {
      tText.textContent = `Your reply has been sent. Thank you, ${first}!`;
    } else if (how === "wa") {
      tText.textContent = "WhatsApp is opening with your reply ready. Just press send to deliver it.";
    } else if (how === "mail") {
      tText.textContent = "Your email app is opening with your reply ready. Just press send to deliver it.";
    } else {
      tText.textContent = "Please send your reply to the couple. Copy it below and paste it in a message.";
    }
    tSum.textContent = yes ? `${d.name} · ${d.guests} ${d.guests === 1 ? "guest" : "guests"}` : d.name;

    // optional extra button
    onAct = null;
    act.hidden = true;
    if (!restored) {
      if (how === "wa") { onAct = () => openLink(waUrl(text)); act.lastChild.textContent = " Open WhatsApp again"; }
      if (how === "mail") { onAct = () => { location.href = mailUrl(text); }; act.lastChild.textContent = " Open email again"; }
      if (how === "manual") {
        onAct = async () => {
          const ok = await copyText(text);
          act.lastChild.textContent = ok ? " Copied" : " Copy failed – select and copy manually";
          setTimeout(() => { act.lastChild.textContent = " Copy my reply"; }, 2500);
        };
        act.lastChild.textContent = " Copy my reply";
      }
      act.hidden = !onAct;
    }

    form.hidden = true;
    $("rsvpLead").hidden = true;
    thanks.hidden = false;
    if (!restored) {
      card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      if (typeof burst === "function") burst(seal, 30);   // gold sparks (defined in the first section above)
      try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (_) { }
    }
  }

  act.addEventListener("click", () => { if (onAct) onAct(); });

  // "Change my reply": back to the form, filled with the earlier answers
  edit.addEventListener("click", () => {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (_) { }
    if (d) {
      nameIn.value = d.name || "";
      noteIn.value = d.note || "";
      withIn.value = d.companions || "";
      guests = clampG(d.guests || 1);
      const r = form.querySelector(`input[name="attending"][value="${d.attending}"]`);
      if (r) r.checked = true;
    }
    thanks.hidden = true;
    form.hidden = false;
    $("rsvpLead").hidden = false;
    sync();
    nameIn.focus({ preventScroll: true });
  });
  const clampG = (v) => Math.min(RSVP.maxGuests, Math.max(1, v));

  // a guest who already replied on this device sees the thank-you again
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && saved.name) showThanks(saved, "sent", "", true);
  } catch (_) { }

  sync();
})();


/* ===================== 5) inline script from index.html ===================== */

// the footer button does the same thing as tapping the bow on the thread
document.getElementById("celebrate").addEventListener("click", function () {
  document.getElementById("bowBtn").click();
});