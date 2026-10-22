// ---------- Buloy's face: painted every frame onto the head's canvas, from the acting keys in 50-direct.js ----------
//
// face = { blink, open, smile, brow, gx, gy,   the original six
//          lid, sad, wet, cheek, pucker }       the quiet-acting set; every one is 0 at rest, so old acts are unchanged
//   blink   0..1   eyelids shut (1 = closed). A natural blink is blinkAt() in 50-direct.js.
//   open    0..1   mouth open while talking (jaw drop and the dark of the mouth)
//   smile  -1..1   mouth corners: +1 broad smile, 0 flat, -1 corners pulled down
//   brow   -1..1   -1 worried (inner ends up), +1 raised overall
//   gx,gy  -1..1   gaze, x toward his left (screen right when he faces us), y down. Idle drift is added in renderAt.
//   lid     0..1   upper eyelid droop: 0 open, 0.4 tired and heavy, 1 nearly shut but still a slit of eye
//   sad     0..1   sad brow: inner ends lift and the outer ends settle, with a crease between the brows
//   wet     0..1   eyes wet: a bright waterline, bigger catchlight, pink lower lid; past 0.7 a tear gathers and runs
//   cheek   0..1   cheek lift: lower lids push up, the nasolabial folds deepen, the cheeks catch the light (with smile 0.4..0.7)
//   pucker  0..1   lips drawn in toward an O for "o" and "u" sounds (use with open)
// drawFace(ctx, face, young) paints any Buloy's canvas; makeBuloy (40-cast.js) wraps it as inst.draw(face). young leaves out the moustache and goatee.
// Keys: add key(vLid, t, v, ease) and so on beside vSmile in 50-direct.js, or set them in renderAt.

const FPX = 800;                                         // drawing units per metre (the canvas is FS times denser)
const fx = (x) => (0.09 + x) * FPX, fy = (y) => (0.25 - y) * FPX;
const FACE_SKIN = ["#d49d7c", "#c28c68", "#a36f50"];

// hairs are placed once, from a seed, so every frame has the same stubble
const FACE_HAIR = (() => {
  const r = rng(5), M = [], G = [], J = [];
  for (const s of [-1, 1]) for (let i = 0; i < 190; i++) {                      // moustache: thin in the middle, fuller toward the corners
    const u = Math.sqrt(r());
    M.push({ x: s * (2 + u * 21), y: 139.2 + u * 4.2 + (r() - 0.5) * (7.4 - u * 2.2), dx: s * (1 + r() * 1.4), dy: 0.4 + r() * 1.4, a: 0.45 + r() * 0.4 });
  }
  for (let i = 0; i < 300; i++) {                                                                                    // goatee patch: inside a rounded shape (rx 12.5, ry 12.5 at y 19) and the soul-patch strip above it
    const a = r() * 6.283, q = Math.sqrt(r());
    G.push({ x: Math.cos(a) * q * 12, y: 19 + Math.sin(a) * q * 12, a: 0.55 + r() * 0.35, h: 1 + (r() < 0.4 ? 1 : 0) });
  }
  for (let i = 0; i < 44; i++) G.push({ x: (r() - 0.5) * 5.4, y: -7 + r() * 13, a: 0.5 + r() * 0.3, h: 1 + (r() < 0.4 ? 1 : 0) });   // the soul patch strip
  for (let i = 0; i < 70; i++) { const a = r() * 6.283, k = 1.08 + r() * 0.3; G.push({ x: Math.cos(a) * 12 * k, y: 19 + Math.sin(a) * 12 * k, a: 0.16 + r() * 0.16, h: 1 }); }   // lighter stubble dots just outside the edge
  for (let i = 0; i < 40; i++) { const q = r(); J.push({ x: (r() - 0.5) * 7, y: -16 + q * 12, a: 0.4 + r() * 0.35 }); }    // the soul patch under the lip
  const jaw = []; for (let i = 0; i < 120; i++) { const a = r() * 6.283, q = Math.sqrt(r()); jaw.push({ x: Math.cos(a) * q * 36, y: 18 + Math.sin(a) * q * 16, a: 0.12 + r() * 0.16 }); }
  return { M, G, J, jaw };
})();

function drawFace(g, f, young, girl) {
  g.setTransform(FS, 0, 0, FS, 0, 0);
  g.lineCap = "round"; g.lineJoin = "round";
  const anger = f.anger || 0, lid = f.lid || 0, sad = f.sad || 0, wet = f.wet || 0, pk = f.pucker || 0;
  const cl = clamp01((f.cheek || 0) + Math.max(0, f.smile) * 0.3);               // cheek lift
  const ell = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };

  // skin: a vertical wash, rounded at the temples, warm on the cheeks, shaded under the eyes
  const sk = g.createLinearGradient(0, 0, 0, 200);
  sk.addColorStop(0, FACE_SKIN[0]); sk.addColorStop(0.45, FACE_SKIN[1]); sk.addColorStop(1, FACE_SKIN[2]);
  g.fillStyle = sk; g.fillRect(0, 0, 144, 200);
  const sd = g.createLinearGradient(0, 0, 144, 0);
  sd.addColorStop(0, "rgba(80,40,30,0.34)"); sd.addColorStop(0.17, "rgba(80,40,30,0)"); sd.addColorStop(0.83, "rgba(80,40,30,0)"); sd.addColorStop(1, "rgba(80,40,30,0.34)");
  g.fillStyle = sd; g.fillRect(0, 0, 144, 200);
  ell(fx(0), fy(0.19), 30, 12, "rgba(255,222,185,0.17)");
  { const uj = g.createLinearGradient(0, 160, 0, 200); uj.addColorStop(0, "rgba(70,36,26,0)"); uj.addColorStop(1, "rgba(70,36,26,0.4)"); g.fillStyle = uj; g.fillRect(0, 160, 144, 40); }   // the under-jaw falls into shade                                                   // forehead light
  for (const s of [-1, 1]) {
    ell(fx(s * 0.05), fy(0.098), 15, 11, "rgba(206,92,72," + (0.24 + (girl ? 0.1 : 0) + cl * 0.12).toFixed(2) + ")");          // warm cheeks
    ell(fx(s * 0.05), fy(0.118), 10, 3.6, "rgba(255,205,165," + (0.07 + cl * 0.16).toFixed(2) + ")");    // cheekbone light
    ell(fx(s * 0.0365), fy(0.118) - cl * 1.6, 15, 4.6, "rgba(112,58,48," + (0.2 + wet * 0.08 + lid * 0.06).toFixed(2) + ")");  // under the eye
    g.strokeStyle = "rgba(112,62,50," + (0.16 + lid * 0.1) + ")"; g.lineWidth = 1; g.beginPath();           // the eye bag line
    g.moveTo(fx(s * 0.0365) - s * 10, fy(0.1245)); g.quadraticCurveTo(fx(s * 0.0365), fy(0.1195) - cl * 2, fx(s * 0.0365) + s * 11, fy(0.1245)); g.stroke();
  }

  // nose: shaded sides, nostrils and the shadow under it (the mesh gives the form, this gives the read)
  for (const s of [-1, 1]) {
    g.fillStyle = "rgba(100,52,40,0.2)"; g.beginPath(); g.moveTo(fx(s * 0.0085), fy(0.145)); g.lineTo(fx(s * 0.016), fy(0.108)); g.lineTo(fx(s * 0.0105), fy(0.104)); g.lineTo(fx(s * 0.005), fy(0.14)); g.fill();
    ell(fx(s * 0.0102), fy(0.0985), 2.5, 1.5, "rgba(66,28,24,0.5)");
  }
  ell(fx(0), fy(0.0925), 9, 2.2, "rgba(86,42,32,0.32)");
  g.strokeStyle = "rgba(112,60,48,0.26)"; g.lineWidth = 1;                                                 // philtrum
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(fx(s * 0.0045), fy(0.0905)); g.lineTo(fx(s * 0.0055), fy(0.0835)); g.stroke(); }
  g.strokeStyle = "rgba(108,56,44," + (0.2 + cl * 0.22).toFixed(2) + ")"; g.lineWidth = 1.5;                  // nasolabial folds
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(fx(s * 0.0185), fy(0.099)); g.quadraticCurveTo(fx(s * (0.0345 + cl * 0.004)), fy(0.088), fx(s * (0.0325 + f.smile * 0.004)), fy(0.062)); g.stroke(); }

  // mouth geometry: yLine is the line where the lips meet, corners lifting with the smile
  const drop = f.open * 3;
  const my = fy(0.066) + drop * 0.35, mw = 16.5 - f.open * 2 - pk * 7 + Math.max(0, f.smile) * 2.4, sm = f.smile * 3.4 + cl * 0.6;
  const gap = Math.max(f.open * 9.5, pk * mw * 1.35 * (0.4 + f.open));
  const cx = fx(0), yMidLine = my, yCorner = my - sm;
  const yLine = (x) => yCorner + (yMidLine - yCorner) * (1 - (x / mw) * (x / mw));
  const taper = (x) => Math.pow(Math.max(0, 1 - (x / mw) * (x / mw)), 0.7);
  const upperTop = (x) => yLine(x) - (3.6 * Math.pow(Math.max(0, 1 - (x / mw) * (x / mw)), 0.55) - 1.3 * Math.exp(-(x * x) / 5) + 0.7 * Math.exp(-((Math.abs(x) - 3.6) ** 2) / 3.5));
  const lowerBot = (x) => yLine(x) + gap * taper(x) + 5.2 * taper(x);
  const lowerTop = (x) => yLine(x) + gap * taper(x);
  const poly = (fn1, fn2, col) => {
    g.fillStyle = col; g.beginPath();
    for (let x = -mw; x <= mw + 0.01; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, fn1(x));
    for (let x = mw; x >= -mw - 0.01; x -= 1) g.lineTo(cx + x, fn2(x));
    g.fill();
  };
  ell(cx, my + 8 + drop, 10, 4.5, "rgba(70,34,28,0.2)");                                                   // shadow under the lower lip
  if (gap > 0.4) {
    poly((x) => yLine(x), lowerTop, "#2a0d0f");
    if (gap > 2.2) {
      g.save(); g.beginPath(); for (let x = -mw; x <= mw; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, yLine(x)); for (let x = mw; x >= -mw; x -= 1) g.lineTo(cx + x, lowerTop(x)); g.clip();
      g.fillStyle = "#eee4d4"; g.fillRect(cx - mw * 0.78, yLine(0) - 1, mw * 1.56, Math.min(gap * 0.5, 3));
      g.fillStyle = "#a54e4e"; g.beginPath(); g.ellipse(cx, lowerTop(0) - 0.2, mw * 0.6, Math.max(0.5, gap * 0.34), 0, 0, 7); g.fill();
      g.restore();
    }
  }
  poly(lowerTop, lowerBot, girl ? "#d9728a" : "#b8695f");
  ell(cx - 1.5, lowerTop(0) + 2.7, 4.2 - pk * 1.5, 0.95, "rgba(255,215,205,0.32)");                       // gloss on the lower lip
  poly(upperTop, yLine, girl ? "#c4566a" : "#9a544d");
  g.strokeStyle = "rgba(60,24,24,0.9)"; g.lineWidth = 1.15; g.beginPath();
  for (let x = -mw; x <= mw + 0.01; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, yLine(x)); g.stroke();   // where the lips meet
  g.strokeStyle = "rgba(110,52,46,0.55)"; g.lineWidth = 0.9; g.beginPath();
  for (let x = -mw; x <= mw + 0.01; x += 1) g[x === -mw ? "moveTo" : "lineTo"](cx + x, upperTop(x)); g.stroke();  // the lip's top edge
  for (const s of [-1, 1]) { g.strokeStyle = "rgba(76,36,32,0.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + s * mw, yCorner - 0.3); g.lineTo(cx + s * (mw + 1.8), yCorner - 1.6 - Math.max(0, f.smile) * 1.2 + Math.max(0, -f.smile) * 2.6); g.stroke(); }   // corners

  // moustache, soul patch, goatee, the stubble that joins them (young: only the faintest shadow)
  if (young) {
    ell(cx, 140.5, 17, 4.2, "rgba(60,40,32,0.1)"); ell(cx, fy(0.0245) + drop + 1, 15, 12, "rgba(60,40,32,0.07)");
  } else {
  ell(cx, 141.5, 23, 5.6, "rgba(40,28,24,0.3)");
  for (const h of FACE_HAIR.M) { g.strokeStyle = "rgba(26,18,16," + h.a.toFixed(2) + ")"; g.lineWidth = 1.15; g.beginPath(); const yy = h.y - Math.abs(h.x) * sm * 0.03; g.moveTo(cx + h.x, yy); g.lineTo(cx + h.x + h.dx * 2.2, yy + h.dy * 2); g.stroke(); }
  ell(cx, fy(0.0295) + drop, 25, 14, "rgba(40,28,24,0.07)");
  for (const h of FACE_HAIR.jaw) { g.fillStyle = "rgba(30,20,18," + h.a.toFixed(2) + ")"; g.fillRect(cx + h.x, fy(0.0) - h.y + 150 + drop - 148, 1, 1); }
  { const gy = fy(0.0245) + drop - 18 + 19; g.fillStyle = "rgba(40,28,24,0.3)"; g.beginPath(); g.ellipse(cx, gy, 12.4, 12.4, 0, 0, 7); g.fill(); g.fillRect(cx - 2.8, gy - 26, 5.6, 14);     // the patch, with a defined edge
    g.strokeStyle = "rgba(24,16,14,0.35)"; g.lineWidth = 0.9; g.beginPath(); g.ellipse(cx, gy, 12.4, 12.4, 0, 0, 7); g.stroke(); }
  for (const h of FACE_HAIR.G) { g.fillStyle = "rgba(24,16,14," + h.a.toFixed(2) + ")"; g.fillRect(cx + h.x, fy(0.0245) + drop - 18 + h.y, 1, h.h + 0.5); }
  for (const h of FACE_HAIR.J) if (h.a > 0.7) { g.fillStyle = "rgba(24,16,14," + h.a.toFixed(2) + ")"; g.fillRect(cx + h.x * 0.45, my + 8 + drop + 4 + (h.y + 16) * 0.75, 1, 1.5); }

  }
  // eyes, brows
  for (const s of [-1, 1]) {
    const ex = fx(s * 0.0365), ey = fy(0.142), ew = 10.4;
    const open = 1 - f.blink * 0.94;
    const eTop = 4.9 * open * (1 + Math.max(0, f.brow) * 0.1) * (1 - lid * 0.52);
    const eBot = 3.2 * open * (1 - cl * 0.4) * (1 - wet * 0.06);
    const inner = ex - s * ew, outer = ex + s * ew;
    const eyePath = () => {
      g.beginPath(); g.moveTo(inner, ey + 0.6);
      g.quadraticCurveTo(ex - s * 1.5, ey - Math.max(0.3, eTop) * 2, outer, ey - 0.2);
      g.quadraticCurveTo(ex + s * 0.5, ey + Math.max(0.3, eBot) * 2 + 0.2, inner, ey + 0.6);
    };
    // the white and the shade the lid throws
    g.save(); eyePath(); g.clip();
    const sc = g.createLinearGradient(ex - ew, 0, ex + ew, 0);
    sc.addColorStop(0, "#cfc2b2"); sc.addColorStop(0.25, "#ece4d8"); sc.addColorStop(0.75, "#ece4d8"); sc.addColorStop(1, "#cfc2b2");
    g.fillStyle = sc; g.fillRect(ex - 12, ey - 8, 24, 16);
    if (wet > 0) { g.fillStyle = "rgba(190,86,84," + (wet * 0.3).toFixed(2) + ")"; g.fillRect(inner - (s > 0 ? 0 : -1) - 3, ey - 2, 6, 5); }
    const ix = ex + f.gx * 4.4 + (f.gx > 0 ? 0 : 0), iy = ey + f.gy * 1.9 + 0.5 - lid * 0.4, ir = 5.35;
    const ig = g.createRadialGradient(ix, iy, 0.5, ix, iy, ir);
    ig.addColorStop(0, "#3c2418"); ig.addColorStop(0.55, "#2b1a12"); ig.addColorStop(1, "#150c08");
    g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, 7); g.fill();
    g.fillStyle = "#0d0807"; g.beginPath(); g.arc(ix, iy, 2.5 + wet * 0.2, 0, 7); g.fill();
    g.fillStyle = "rgba(150,96,52,0.3)"; g.beginPath(); g.arc(ix, iy, ir - 0.6, 0.25, 2.9); g.arc(ix, iy, ir - 2, 2.9, 0.25, true); g.fill();             // the lit lower rim of the iris
    const cs = 2 + wet * 1.4;                                                                                   // catchlights: a window up and to the side, the laptop glow below
    g.fillStyle = "rgba(255,255,255,0.97)"; g.fillRect(ix - 3.1, iy - 2.7, cs, cs);
    g.fillStyle = "rgba(170,205,255,0.8)"; g.fillRect(ix + 1.6, iy + 2.6, 1.3, 1);
    if (wet > 0) { g.fillStyle = "rgba(255,255,255," + (0.5 + wet * 0.4).toFixed(2) + ")"; g.fillRect(ix + 2, iy - 1.8, 1.2, 1.2); }
    const lg = g.createLinearGradient(0, ey - 8, 0, ey);
    lg.addColorStop(0, "rgba(50,24,18,0.62)"); lg.addColorStop(1, "rgba(50,24,18,0)");
    g.fillStyle = lg; g.fillRect(ex - 12, ey - 8, 24, 8 - (ey - (ey - eTop * 1.2)) * 0);                       // the lid's shadow on the eye
    if (wet > 0) { g.strokeStyle = "rgba(226,238,255," + (0.4 + wet * 0.45).toFixed(2) + ")"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(inner, ey + 1); g.quadraticCurveTo(ex, ey + eBot * 2 - 0.2, outer, ey + 0.2); g.stroke(); }  // a bright waterline
    g.restore();
    if (wet > 0) { g.strokeStyle = "rgba(205,100,92," + (wet * 0.4).toFixed(2) + ")"; g.lineWidth = 1.7; g.beginPath(); g.moveTo(inner + s * 1.5, ey + 1.6); g.quadraticCurveTo(ex, ey + eBot * 2 + 1.6, outer - s * 1.5, ey + 0.9); g.stroke(); }   // pink lower lid
    // the upper lid: dark line, heavier toward the outer corner, a faint crease above
    if (girl) { g.strokeStyle = "#140c0a"; g.lineWidth = 1.6; for (const [dx, dy] of [[2.6, -2.4], [3.4, -0.6]]) { g.beginPath(); g.moveTo(outer, ey - 0.2); g.lineTo(outer + s * dx, ey - 0.2 + dy); g.stroke(); } }   // lashes
    g.strokeStyle = "#1c120e"; g.lineWidth = girl ? 2.8 : 2; g.beginPath(); g.moveTo(inner, ey + 0.3); g.quadraticCurveTo(ex - s * 1.5, ey - Math.max(0.3, eTop) * 2 - 0.2, outer, ey - 0.2); g.stroke();
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex + s * 2, ey - Math.max(0.3, eTop) * 1.5 - 0.1); g.quadraticCurveTo(ex + s * 7, ey - Math.max(0.3, eTop) * 1.9 - 0.2, outer + s * 1.3, ey - 0.9); g.stroke();
    g.strokeStyle = "rgba(96,54,40," + (0.34 + lid * 0.1).toFixed(2) + ")"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(inner + s * 2, ey - 2.2 - eTop * 0.7); g.quadraticCurveTo(ex, ey - Math.max(0.3, eTop) * 2 - 2.6 - lid * 0.5, outer, ey - 2.6); g.stroke();   // the crease
    g.strokeStyle = "rgba(92,50,38,0.36)"; g.lineWidth = 1; g.beginPath(); g.moveTo(inner + s * 1.5, ey + 1.2); g.quadraticCurveTo(ex, ey + eBot * 2 + 0.8, outer - s * 1.5, ey + 0.6); g.stroke();  // lower lid
    if (wet > 0.7) {                                                                                          // a tear gathers below the glass and runs: 3 to 4 px wide at the end, with a highlight
      const tw = clamp01((wet - 0.7) / 0.3), tx = ex + s * 2.4, ty = ey + 15;
      g.fillStyle = "rgba(60,30,26,0.4)"; g.beginPath(); g.ellipse(tx + s * 1.1, ty + 4 + tw * 2, 2.6, 4 + tw * 2, 0, 0, 7); g.fill();
      g.fillStyle = "rgba(226,240,255,0.95)"; g.beginPath(); g.ellipse(tx, ty + 3.6 + tw * 2, 2.1, 3.8 + tw * 2, 0, 0, 7); g.fill();
      g.fillStyle = "rgba(226,240,255,0.95)"; g.beginPath(); g.ellipse(tx, ty + 8.6 + tw * 4, 2.5, 2.8, 0, 0, 7); g.fill();            // the bead at the end
      g.fillStyle = "#ffffff"; g.fillRect(tx - 1.2, ty + 1.5, 1.2, 3); g.fillRect(tx - 1.4, ty + 7.4 + tw * 4, 1.4, 1.6);
    }
    // brows: thick, a gentle arch, thickest at the inner end. brow -1..1 worry/raise, sad lifts the inner end and settles the outer
    const lift = Math.max(0, f.brow) * 4.4, worry = Math.max(0, -f.brow) * 3.4;
    const dy = -lift - worry * 0.7 + lid * 0.9 + anger * 2.5;
    const pi = [ex - s * 17.5, fy(0.1635) + dy - worry * 0.6 - sad * 9 + anger * 5.5], pm = [ex - s * 2, fy(0.1685) + dy - worry * 0.2 - sad * 3.6], po = [ex + s * 17.5, fy(0.1635) + dy * 0.8 + worry * 0.8 + sad * 3.4 - anger * 1.5];
    const thI = (girl ? 3.8 : 5.6) - sad * 0.4, thM = girl ? 4.2 : 6.2, thO = girl ? 2.4 : 3.4;
    const top = (p, th) => [p[0], p[1] - th / 2], bot = (p, th) => [p[0], p[1] + th / 2];
    const ctl = (a, m, b) => [2 * m[0] - 0.5 * (a[0] + b[0]), 2 * m[1] - 0.5 * (a[1] + b[1])];
    const ti = top(pi, thI), tm = top(pm, thM), to = top(po, thO), bi = bot(pi, thI), bm = bot(pm, thM), bo = bot(po, thO);
    const ct = ctl(ti, tm, to), cb = ctl(bi, bm, bo);
    g.fillStyle = "#19120f"; g.beginPath(); g.moveTo(ti[0], ti[1]); g.quadraticCurveTo(ct[0], ct[1], to[0], to[1]); g.lineTo(bo[0], bo[1]); g.quadraticCurveTo(cb[0], cb[1], bi[0], bi[1]); g.closePath(); g.fill();
    g.strokeStyle = "rgba(92,70,60,0.4)"; g.lineWidth = 0.8;                                                   // a few hairs catching light
    for (let k = 0; k < 6; k++) { const u = (k + 0.5) / 6, x = pi[0] + (po[0] - pi[0]) * u, y = pi[1] + (pm[1] - pi[1]) * Math.sin(u * 3.14) * 0.9 + (po[1] - pi[1]) * u * u - 1.2; g.beginPath(); g.moveTo(x, y + 1.6); g.lineTo(x + s * -(-1.8) * 0 + (po[0] > pi[0] ? 1.6 : -1.6), y - 0.6); g.stroke(); }
  }
  if (sad > 0.05) {                                                                                           // the crease between the brows when he is sad
    g.strokeStyle = "rgba(100,52,40," + (sad * 0.32).toFixed(2) + ")"; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(fx(-0.0055), fy(0.168)); g.lineTo(fx(-0.004), fy(0.155)); g.moveTo(fx(0.0055), fy(0.168)); g.lineTo(fx(0.004), fy(0.155)); g.stroke();
  }
}
faceReady = true;
buloy.draw({ blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0 });
