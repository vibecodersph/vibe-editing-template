// ---------- Aling Nena's face: painted every frame, the same system as Buloy's (41-face.js) ----------
//
// face = { blink, open, smile, brow, gx, gy, squint, wide }
//   blink   0..1   eyelids shut
//   open    0..1   mouth open while talking (from her voice amplitude)
//   smile  -1..1   mouth corners and cheeks
//   brow   -1..1   -1 worried, +1 raised
//   gx,gy  -1..1   gaze, x toward her left (screen right), y down (at the phone, at the notebook)
//   squint  0..1   the teasing squint: lids narrow, the cheeks push up, one brow lifts, crow's feet deepen
//   wide   -1..1   mouth shape while talking: -1 a pursed "o", +1 a wide "e"
// An older Filipina: warm brown skin, smile lines, crow's feet, small round reading glasses (3D, in 40-cast.js) pushed down her nose.

const NFPX = 800;
const nx = (x) => (0.09 + x) * NFPX, ny = (y) => (0.21 - y) * NFPX;                 // the head is 0.18 m wide and 0.21 m tall

function drawNena(g, f) {
  g.setTransform(FS, 0, 0, FS, 0, 0);
  g.lineCap = "round"; g.lineJoin = "round";
  const sq = f.squint || 0, sm = f.smile, wide = f.wide || 0, old = f.old || 0;          // old 0..1: a much older face, deeper lines, hollow cheeks, thin grey brows (episode 3)
  const ell = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  const cl = clamp01(Math.max(0, sm) * 0.8 + sq * 0.7);                                // cheek lift

  const sk = g.createLinearGradient(0, 0, 0, 168);
  sk.addColorStop(0, "#c08a62"); sk.addColorStop(0.45, "#b27c54"); sk.addColorStop(1, "#98643f");
  g.fillStyle = sk; g.fillRect(0, 0, 144, 168);
  const sd = g.createLinearGradient(0, 0, 144, 0);
  sd.addColorStop(0, "rgba(70,35,24,0.34)"); sd.addColorStop(0.17, "rgba(70,35,24,0)"); sd.addColorStop(0.83, "rgba(70,35,24,0)"); sd.addColorStop(1, "rgba(70,35,24,0.34)");
  g.fillStyle = sd; g.fillRect(0, 0, 144, 168);
  { const uj = g.createLinearGradient(0, 140, 0, 168); uj.addColorStop(0, "rgba(60,30,20,0)"); uj.addColorStop(1, "rgba(60,30,20,0.38)"); g.fillStyle = uj; g.fillRect(0, 140, 144, 28); }
  ell(nx(0), ny(0.175), 28, 10, "rgba(255,215,175,0.13)");
  // forehead lines, faint
  g.strokeStyle = "rgba(90,50,34," + (0.13 + old * 0.17) + ")"; g.lineWidth = 1;
  for (const y of (old ? [44, 50, 56, 62] : [47, 54])) { g.beginPath(); g.moveTo(40, y); g.quadraticCurveTo(72, y - 2 - Math.max(0, f.brow) * 1.5, 104, y); g.stroke(); }
  for (const s of [-1, 1]) {
    ell(nx(s * 0.046), ny(0.058), 13, 10, "rgba(200,92,72," + (0.2 + cl * 0.14).toFixed(2) + ")");                 // warm cheeks
    ell(nx(s * 0.046), ny(0.082), 9, 3.2, "rgba(255,205,160," + (0.07 + cl * 0.16).toFixed(2) + ")");
    // smile lines, deeper when she smiles
    g.strokeStyle = "rgba(86,46,30," + (0.3 + old * 0.2 + cl * 0.22).toFixed(2) + ")"; g.lineWidth = 1.5 + old * 0.6;
    g.beginPath(); g.moveTo(nx(s * 0.0155), ny(0.07)); g.quadraticCurveTo(nx(s * (0.033 + cl * 0.004)), ny(0.06), nx(s * (0.032 + sm * 0.004)), ny(0.037)); g.stroke();
    g.strokeStyle = "rgba(86,46,30," + (0.16 + old * 0.22) + ")"; g.lineWidth = 1;
    if (old) { ell(nx(s * 0.05), ny(0.026), 11, 8, "rgba(70,36,24,0.2)"); g.beginPath(); g.moveTo(nx(s * 0.018), ny(0.05)); g.quadraticCurveTo(nx(s * 0.04), ny(0.03), nx(s * 0.034), ny(0.012)); g.stroke(); }          // hollow cheeks and a second fold
    g.beginPath(); g.moveTo(nx(s * 0.02), ny(0.028)); g.quadraticCurveTo(nx(s * 0.024), ny(0.016), nx(s * 0.018), ny(0.006)); g.stroke();                // jowl line
  }
  // nose: shaded sides, small nostrils, shadow under
  for (const s of [-1, 1]) {
    g.fillStyle = "rgba(90,46,30,0.2)"; g.beginPath(); g.moveTo(nx(s * 0.006), ny(0.11)); g.lineTo(nx(s * 0.014), ny(0.074)); g.lineTo(nx(s * 0.009), ny(0.071)); g.lineTo(nx(s * 0.0035), ny(0.105)); g.fill();
    ell(nx(s * 0.009), ny(0.0665), 2.3, 1.4, "rgba(60,26,20,0.55)");
  }
  ell(nx(0), ny(0.0615), 8, 2, "rgba(80,40,28,0.28)");

  // mouth: warm mauve lips, corners drawn
  const drop = f.open * 2.4;
  const my = ny(0.043) + drop * 0.3, mw = 12.5 + Math.max(0, sm) * 2.6 - Math.max(0, -sm) * 0.6 + wide * 2.4 - f.open * 1.2, smc = sm * 2.7 + cl * 0.5;
  const gap = f.open * (7.5 - Math.max(0, -wide) * 2), cx = nx(0);
  const yMid = my, yCor = my - smc;
  const yLine = (x) => yCor + (yMid - yCor) * (1 - (x / mw) * (x / mw));
  const tp = (x) => Math.pow(Math.max(0, 1 - (x / mw) * (x / mw)), 0.7);
  const upTop = (x) => yLine(x) - (3 * Math.pow(Math.max(0, 1 - (x / mw) * (x / mw)), 0.55) - 1 * Math.exp(-(x * x) / 4) + 0.5 * Math.exp(-((Math.abs(x) - 3) ** 2) / 3));
  const loTop = (x) => yLine(x) + gap * tp(x), loBot = (x) => loTop(x) + (4.3 - old * 1.3) * tp(x);
  const poly = (a, b, col) => { g.fillStyle = col; g.beginPath(); for (let x = -mw; x <= mw + 0.01; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, a(x)); for (let x = mw; x >= -mw - 0.01; x -= 1) g.lineTo(cx + x, b(x)); g.fill(); };
  ell(cx, my + 7 + drop, 8, 3.6, "rgba(60,30,22,0.18)");
  if (gap > 0.4) {
    poly((x) => yLine(x), loTop, "#2a0d0f");
    if (gap > 2) { g.save(); g.beginPath(); for (let x = -mw; x <= mw; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, yLine(x)); for (let x = mw; x >= -mw; x -= 1) g.lineTo(cx + x, loTop(x)); g.clip();
      g.fillStyle = "#ece2d2"; g.fillRect(cx - mw * 0.7, yLine(0) - 1, mw * 1.4, Math.min(gap * 0.5, 2.6)); g.fillStyle = "#a24c4a"; g.beginPath(); g.ellipse(cx, loTop(0) - 0.2, mw * 0.5, Math.max(0.5, gap * 0.3), 0, 0, 7); g.fill(); g.restore(); }
  }
  poly(loTop, loBot, "#b0645d");
  ell(cx - 1, loTop(0) + 2.2, 3.4, 0.8, "rgba(255,215,205,0.28)");
  poly(upTop, yLine, "#964f4c");
  g.strokeStyle = "rgba(58,22,22,0.9)"; g.lineWidth = 1.05; g.beginPath(); for (let x = -mw; x <= mw + 0.01; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, yLine(x)); g.stroke();
  for (const s of [-1, 1]) { g.strokeStyle = "rgba(76,34,30,0.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + s * mw, yCor - 0.2); g.lineTo(cx + s * (mw + 1.6), yCor - 1.3 - Math.max(0, sm) * 1); g.stroke(); }
  ell(nx(0), ny(0.0), 1, 1, "rgba(0,0,0,0)");
  ell(cx, ny(0.014) + drop, 5, 2, "rgba(70,36,26,0.15)");                                         // the dimple on her chin

  // eyes and brows
  for (const s of [-1, 1]) {
    const sqS = sq * (s > 0 ? 1 : 0.55);
    const ex = nx(s * 0.0285), ey = ny(0.098), ew = 8.4;
    const open = 1 - f.blink * 0.94;
    const eTop = 3.9 * open * (1 + Math.max(0, f.brow) * 0.12) * (1 - sqS * 0.5), eBot = 2.7 * open * (1 - cl * 0.35) * (1 - sqS * 0.4);
    const inner = ex - s * ew, outer = ex + s * ew;
    ell(ex, ey + 8.5, 9, 2.4, "rgba(96,52,36," + (0.26 + old * 0.2) + ")");                                             // bags under the eyes
    g.strokeStyle = "rgba(90,48,32," + (0.2 + cl * 0.1).toFixed(2) + ")"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(inner + s * 1, ey + 10.5); g.quadraticCurveTo(ex, ey + 12.5 - cl * 2, outer, ey + 10); g.stroke();
    g.strokeStyle = "rgba(86,46,30," + (0.22 + old * 0.2 + sq * 0.25 + Math.max(0, sm) * 0.12).toFixed(2) + ")"; g.lineWidth = 0.9;                   // crow's feet
    for (let k = 0; k < 3 + (old ? 2 : 0); k++) { const a = -0.45 + k * 0.45 - (old ? 0.45 : 0); g.beginPath(); g.moveTo(outer + s * 1.5, ey + 0.5 + k * 0.8); g.lineTo(outer + s * (4.6 + sq * 1.4), ey + 0.5 + k * 0.8 + Math.sin(a) * 4.2); g.stroke(); }
    const eyePath = () => { g.beginPath(); g.moveTo(inner, ey + 0.4); g.quadraticCurveTo(ex - s * 1, ey - Math.max(0.3, eTop) * 2, outer, ey - 0.1); g.quadraticCurveTo(ex + s * 0.4, ey + Math.max(0.3, eBot) * 2 + 0.2, inner, ey + 0.4); };
    g.save(); eyePath(); g.clip();
    const sc = g.createLinearGradient(ex - ew, 0, ex + ew, 0); sc.addColorStop(0, "#cfc0ac"); sc.addColorStop(0.3, "#ebe1d2"); sc.addColorStop(0.7, "#ebe1d2"); sc.addColorStop(1, "#cfc0ac");
    g.fillStyle = sc; g.fillRect(ex - 10, ey - 7, 20, 14);
    const ix = ex + f.gx * 3.6, iy = ey + f.gy * 1.6 + 0.4, ir = 4.3;
    const ig = g.createRadialGradient(ix, iy, 0.4, ix, iy, ir); ig.addColorStop(0, "#4a2a16"); ig.addColorStop(0.6, "#2e180c"); ig.addColorStop(1, "#150a05");
    g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, 7); g.fill();
    g.fillStyle = "#0d0807"; g.beginPath(); g.arc(ix, iy, 1.9, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,0.95)"; g.fillRect(ix - 2.3, iy - 2, 1.5, 1.5);
    g.fillStyle = "rgba(255,226,170,0.6)"; g.fillRect(ix + 1, iy + 1.7, 1.6, 0.9);                      // the bulb's warm light
    const lg = g.createLinearGradient(0, ey - 6, 0, ey); lg.addColorStop(0, "rgba(50,24,18,0.6)"); lg.addColorStop(1, "rgba(50,24,18,0)"); g.fillStyle = lg; g.fillRect(ex - 10, ey - 6, 20, 6);
    g.restore();
    g.strokeStyle = "#241410"; g.lineWidth = 1.7; g.beginPath(); g.moveTo(inner, ey + 0.2); g.quadraticCurveTo(ex - s * 1, ey - Math.max(0.3, eTop) * 2 - 0.2, outer, ey - 0.1); g.stroke();
    g.strokeStyle = "rgba(96,52,36,0.4)"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(inner + s * 1.5, ey - 2 - eTop * 0.6); g.quadraticCurveTo(ex, ey - Math.max(0.3, eTop) * 2 - 2.4, outer, ey - 2.2); g.stroke();   // the crease of a heavier lid
    g.strokeStyle = "rgba(90,50,36,0.34)"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(inner + s, ey + 0.8); g.quadraticCurveTo(ex, ey + eBot * 2 + 0.6, outer - s, ey + 0.4); g.stroke();
    // brow: thin, arched, greying toward the tail. one lifts when she teases.
    const lift = Math.max(0, f.brow) * 3.6 + (s > 0 ? sq * 2.8 : 0), worry = Math.max(0, -f.brow) * 2.6;
    const pi = [ex - s * 11.5, ny(0.1185) - lift - worry * 0.8 + 0.4], pm = [ex - s * 1, ny(0.1265) - lift - worry * 0.2], po = [ex + s * 11.5, ny(0.1175) - lift * 0.8 + worry * 0.6 + 1.5 - sqS * 0.8];
    const th = (a, b) => [a, b];
    const T = old ? [1.8, 2.0, 1.2] : [2.5, 2.8, 1.8];
    const top = (p, t) => [p[0], p[1] - t / 2], bot = (p, t) => [p[0], p[1] + t / 2];
    const ctl = (a, m, b) => [2 * m[0] - 0.5 * (a[0] + b[0]), 2 * m[1] - 0.5 * (a[1] + b[1])];
    const ti = top(pi, T[0]), tm = top(pm, T[1]), to = top(po, T[2]), bi = bot(pi, T[0]), bm = bot(pm, T[1]), bo = bot(po, T[2]);
    const ct = ctl(ti, tm, to), cb = ctl(bi, bm, bo);
    g.fillStyle = old ? "#9a969e" : "#2a1e1a"; g.beginPath(); g.moveTo(ti[0], ti[1]); g.quadraticCurveTo(ct[0], ct[1], to[0], to[1]); g.lineTo(bo[0], bo[1]); g.quadraticCurveTo(cb[0], cb[1], bi[0], bi[1]); g.closePath(); g.fill();
    g.strokeStyle = "rgba(150,146,152,0.55)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(pm[0] + s * 5, pm[1] + 0.4); g.lineTo(po[0], po[1]); g.stroke();          // grey in the tail of the brow
  }
}
nenaReady = true;
drawNena(nctx, { blink: 0, open: 0, smile: 0.1, brow: 0, gx: 0, gy: 0, squint: 0, wide: 0 });
nenaTex.needsUpdate = true;
