// ---------- SET: the store, with its own staging (episode 7, "AI Naman ang Gagawa") ----------
// Unlike the other sets this one keeps the store of episodes 1 and 2 (src/lib/30-set.js) and the cast where the director puts them:
// Buloy on the bench with his lap laptop (x -0.55), Claude on the bench (x 0.52), Aling Nena behind them at her counter window under the utang sign.
// The director (50-direct.js) poses the default store staging first; SET.update then overrides it with this episode's acting.
// World: the store's origin is at (0.4, 0, -1.7); the counter's top is at y 1.035 and runs z -1.81 .. -1.39; the grille is the plane z -1.64.
// Three solid props on the grip system (47-grip.js): the quotation sheet (shaken, kept, slapped face down on the counter), the receipt that prints
// out of a slot in Claude's front and grows, the ice candy. The counter is a surface: the sheet rests on it and her hands lie on it.
// The words: QUOTATION on the sheet (it faces us only while she shakes it; kept and slapped down it shows its blank back), the receipt's list,
// and the store's own BAWAL UTANG sign, which each camera either holds whole (t_front, the n_bawal framing of t_nena, t_hook_c) or leaves out.

const LN = TL.lines, NO_LINE = { s: 1e9, e: 1e9 }, actLine = (name) => LN.find((l) => l.act === name) || NO_LINE;
const A = { shout: actLine("n_shout"), side: actLine("c_side"), dread: actLine("b_dread"), sweet: actLine("b_sweet"), bawal: actLine("n_bawal"), see: actLine("b_see"), laway: actLine("n_laway"), blaway: actLine("b_laway"),
  print: actLine("c_print"), read: actLine("c_read"), pink: actLine("n_pink"), more: actLine("c_more"), type: actLine("c_type"), spine: actLine("b_spine"), candy: actLine("n_candy"), flavor: actLine("b_flavor"), price: actLine("c_price"), laugh: actLine("n_laugh") };
const win = (ln, t, pi = 0.2, po = 0.3) => smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3));
const env = (a, b, t, ei = 0.25, eo = 0.3) => smooth((t - a) / ei) * (1 - smooth((t - b) / eo));
const ramp = (a, b, t) => smooth((t - a) / (b - a));
const lerp = (a, b, w) => a + (b - a) * w;
// moments inside lines. The timeline carries no word times, so these are offsets from the line's start, measured from the voiced clips (audio/manifest.json):
// "laway" in n_laway, "Ay." and "Gawin" in n_pink, "Sige" and "ice" in n_candy. Voice a line again and its offset here needs measuring again.
const T_LAWAY = A.laway.s + 2.78, T_AY = A.pink.s + 2.15, T_SIGE = A.candy.s + 0.63, T_ICE = A.candy.s + 2.75;
const T_GAWIN = (() => { const c = TL.shots.find((k) => k.shot === "t_front" && k.t > A.pink.s && k.t < A.pink.e); return c ? c.t + 0.08 : A.pink.s + 2.78; })();
const X_AX = v3(1, 0, 0), Y_AX = v3(0, 1, 0), Z_AX = v3(0, 0, 1);
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AX, a), qZ = (a) => new THREE.Quaternion().setFromAxisAngle(Z_AX, a);

// ================= the store, changed for this episode only =================
// her window: the two bars and the piece of the lower rail that crossed her face and arms come out, so there is an opening x -0.5 .. 0.1 (world)
grilleBars[3].visible = grilleBars[4].visible = false; grilleRails[0].visible = false;
box(grille, 0.4, 0.03, 0.03, IRON, -1.1, 1.45, 0, { noShadow: true }); box(grille, 1.6, 0.03, 0.03, IRON, 0.5, 1.45, 0, { noShadow: true });
// Aling Nena is the old one of episodes 3 to 6 (grey bun, the older face), and stands a little nearer her counter so an arm can come through
NENA_HAIR.hairN.color.set(0xb8b6c0); NENA_HAIR.greyN.color.set(0xd8d6de); NENA_HAIR.greyD.color.set(0x9896a2);
nena.position.set(-0.6, 0, -0.36); fan.visible = false;
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
const nLight = new THREE.PointLight(0xffe2c0, 0, 2.4, 1.6); nLight.position.set(-0.55, 1.72, 0.3); store.add(nLight);         // a small warm light on her face, for her close shots
// the counter as a surface: things rest on it and fingers stop at it
const counterP = makeProp("counter", store, { surface: true }); counterP.g.position.set(0, 1.0, 0.1);
counterP.part(counterP.g, "box", { h: [1.4, 0.035, 0.21] }); flatSocket(counterP, 0.035);
const COUNTER_Y = 1.035;

// ================= the quotation: a solid sheet, printed on one side =================
// Its frame: x across, y up the page, the printed face at +z. "pinch": the palm lies on the blank back, the fingers up the page, the thumb along the bottom edge.
const SH = { w: 0.2, h: 0.27, d: 0.004 };
const quoTex = painted(60, 81, (g) => {
  g.fillStyle = "#f6f1e2"; g.fillRect(0, 0, 60, 81);
  g.fillStyle = "#1f3f8a"; g.fillRect(0, 0, 60, 15);
  if (ATLAS && ATLAS.ptext) ATLAS.ptext(g, "QUOTATION", 30, 4, "#ffffff", { font: 5, scale: 1, align: "center" });
  const r = rng(707);
  for (let i = 0; i < 6; i++) { const y = 21 + i * 6; g.fillStyle = "#a9a59c"; g.fillRect(5, y, 18 + Math.floor(r() * 16), 2); g.fillStyle = "#c9c4b8"; g.fillRect(45, y, 10, 2); }       // grey rows: what is asked for, what each costs
  g.fillStyle = "#1f3f8a"; g.fillRect(5, 58, 50, 1);
  if (ATLAS && ATLAS.ptext) ATLAS.ptext(g, "TOTAL", 5, 61, "#5a5660", { font: 3, scale: 1 });
  g.fillStyle = "#c8281e"; g.fillRect(4, 66, 52, 12);                                                                    // the total: a price, white on red
  if (ATLAS && ATLAS.ptext) ATLAS.ptext(g, "P15,000", 30, 69, "#ffffff", { font: 5, scale: 1, align: "center" });
}, { mip: false });
const sheet = makeProp("quotation", scene); sheet.rad = 0.2;
sheet.box(sheet.g, SH.w, SH.h, SH.d, 0xb4ae9f, 0, 0, 0, { mat: {} });
plane(sheet.g, SH.w - 0.004, SH.h - 0.004, signMat(quoTex, 0.9), 0, 0, SH.d / 2 + 0.0005);
sheet.sockets.pinch = (H, G = {}) => {
  const s = H.s, a = G.a ?? 0.5, gx = G.x ?? 0.02;
  return { p: v3(gx, -(SH.h / 2 + 0.0115 * H.sc), -SH.d / 2), n: v3(0, 0, -1), f: v3(-s * Math.sin(a), Math.cos(a), 0), anchor: [-s * HD.tb[0], HD.tb[1]], thumb: "oppose", splay: Math.PI / 2 - a, thumbRx: [1.5, 0.3], thumbFree: true, tb2: [0.05, 0.3] };
};

// ================= the ice candy: frozen buko in a pale sleeve, knotted at the top =================
// Its frame: the stick runs along y, the knot at +y. "wrap": a fist round the stick, on the side that keeps the wrist straight (the mic's rule, 48-solid.js).
const IC = { r: 0.014, L: 0.2 };
const candy = makeProp("icecandy", scene); candy.rad = 0.15;
candy.cyl(candy.g, IC.r, IC.L, 0x8a4fc4, 0, 0, 0, { mat: {} });
candy.sph(candy.g, IC.r, mat(0x8a4fc4), 0, -IC.L / 2, 0);
candy.cyl(candy.g, IC.r, 0.016, 0xc9d2cc, 0, IC.L / 2 + 0.008, 0, { r1: 0.004, mat: {} });                               // the sleeve drawn in to the knot
candy.sph(candy.g, 0.0065, mat(0xb9c4be), 0, IC.L / 2 + 0.019, 0);                                                       // the knot
for (const s of [-1, 1]) candy.box(candy.g, 0.011, 0.034, 0.003, 0xc9d2cc, s * 0.007, IC.L / 2 + 0.036, 0, { detail: true, noShadow: true, mat: {}, rot: [0, 0, -s * 0.35] });   // the two loose ends above it
candy.box(candy.g, 0.004, IC.L * 0.8, 0.002, 0xffffff, 0.005, 0, IC.r - 0.0006, { detail: true, noShadow: true, mat: {} });   // the plastic's shine, a solid stripe
for (const y of [-0.06, 0.0, 0.06]) mesh(candy.g, new THREE.CylinderGeometry(IC.r + 0.0004, IC.r + 0.0004, 0.004, 10), mat(0x6f3aa6), 0, y, 0, { noShadow: true });   // creases in the sleeve
const _cinv = new THREE.Matrix4();
candy.sockets.wrap = (H, G = {}) => {
  let n = null;
  if (G.A) { const fl = v3(0, -1, 0).transformDirection(G.A.fore.matrixWorld).transformDirection(_cinv.copy(candy.g.matrixWorld).invert()); fl.y = 0; if (fl.lengthSq() > 0.03) n = v3(0, 1, 0).cross(fl.normalize()).multiplyScalar(H.s); }
  if (!n) n = v3(0, 0, -1);
  const f = v3(0, 1, 0).cross(n).multiplyScalar(-H.s);
  return { p: v3(0, G.y ?? -0.05, 0).addScaledVector(n, IC.r), n, f, anchor: [0, HD.rootY + 0.004], thumb: "oppose", splay: 0.1 };
};

// ================= the receipt: a slot in Claude's front, and paper that feeds out of it and down =================
// The slot is a part of Claude's body (a surface the paper hangs from). The paper is one prop: a short tongue out of the slot, a strip that hangs
// from the tongue's end to the ground, and what lies on the ground once it is that long. Its words are drawn top down and a row shows only when
// the paper is long enough to hold the whole row, so no word is ever half printed.
const RC = { W: 0.18, T: 0.003, PW: 80, PH: 384, TONGUE: 0.115, TILT: 0.2 }; RC.K = RC.W / RC.PW;        // K: metres of paper per texel
const slotP = makeProp("printer", cBody, { surface: true }); slotP.g.position.set(0, 0.09, 0.12);
slotP.box(slotP.g, 0.212, 0.026, 0.014, 0x2a2228, 0, 0, 0.004, { mat: {} });
slotP.box(slotP.g, 0.19, 0.007, 0.002, 0x0d0a10, 0, 0, 0.0112, { detail: true, noShadow: true, mat: {} });
const rcC = document.createElement("canvas"); rcC.width = RC.PW; rcC.height = RC.PH;
const rcG = rcC.getContext("2d");
const rcT = new THREE.CanvasTexture(rcC); rcT.colorSpace = THREE.SRGBColorSpace; rcT.magFilter = THREE.NearestFilter; rcT.minFilter = THREE.LinearFilter; rcT.generateMipmaps = false;
const INK = "#2a2433";
function receiptRows(pink, pan) {
  const rows = []; let y = 5;
  const add = (h, fn) => { rows.push({ y, h, fn }); y += h; };
  const word = (s, col, o) => (g, yy) => ATLAS.ptext(g, s, o && o.left ? 7 : 40, yy, col || INK, { font: 5, scale: (o && o.scale) || 1, align: o && o.left ? "left" : "center" });
  const rule = (g, yy) => { g.fillStyle = INK; for (let x = 6; x < 74; x += 4) g.fillRect(x, yy, 2, 1); };
  add(18, word("LAWAY", INK, { scale: 2 })); add(5, rule);
  for (const s of ["PAKIKINIG", "PAG-AAYOS", "PALIT-ISIP"]) add(11, word(s, INK, { left: true }));
  if (pink) { add(19, word("+ PINK", "#e0308a", { scale: 2 })); for (let i = 0; i < 2; i++) add(6, (g, yy) => { g.fillStyle = "#b9b4aa"; g.fillRect(7, yy, 44 - i * 14, 2); }); add(4, () => {}); }
  if (pan) add(12, word("+ PANANAGUTAN", "#b3261e"));
  add(5, rule); add(10, word("TOTAL:")); add(11, word("ORAS NI BULOY"));
  return { rows, end: y + 4 };
}
const RC_READ = receiptRows(false, false).end, RC_MORE = receiptRows(true, false).end, RC_FIN = RC.PH - 14;
function drawReceipt(Lpx, pink, pan) {
  const g = rcG; g.fillStyle = "#f6f1e4"; g.fillRect(0, 0, RC.PW, RC.PH);
  g.fillStyle = "#e3dccb"; g.fillRect(0, 0, 1, RC.PH); g.fillRect(RC.PW - 1, 0, 1, RC.PH);
  if (!(ATLAS && ATLAS.ptext)) return;
  const R = receiptRows(pink, pan);
  for (const r of R.rows) if (r.y + r.h <= Lpx - 1) r.fn(g, r.y);
  const rr = rng(909);
  for (let y = R.end + 6; y + 6 < RC.PH; y += 6) { const w = 20 + Math.floor(rr() * 34); if (y + 4 <= Lpx - 1) { g.fillStyle = "#b9b4aa"; g.fillRect(7, y, w, 2); } }       // the list goes on: grey rows, no words
  rcT.needsUpdate = true;
}
const receipt = makeProp("receipt", scene);
const rcMat = signMat(rcT, 0.9), PAPER = 0xe9e3d2;
const rcTongueG = group(receipt.g, 0, 0, 0); rcTongueG.rotation.x = RC.TILT;
const rcTongue = box(rcTongueG, RC.W, RC.T, 1, PAPER, 0, 0, 0.5, { noShadow: true });
const rcTonguePart = receipt.parts[receipt.parts.push({ k: "box", node: rcTongueG, c: [0, 0, 0.05], r: 0, h: [RC.W / 2, RC.T / 2, 0.05], inv: new THREE.Matrix4(), sc: 1 }) - 1];
const rcStripG = group(receipt.g, 0, 0, 0);
const rcStrip = box(rcStripG, RC.W, 1, RC.T, PAPER, 0, -0.5, 0, { noShadow: true });
const rcStripFace = plane(rcStripG, RC.W - 0.004, 1, rcMat, 0, -0.5, RC.T / 2 + 0.0005);
const rcStripPart = receipt.parts[receipt.parts.push({ k: "box", node: rcStripG, c: [0, -0.05, 0], r: 0, h: [RC.W / 2, 0.05, RC.T / 2], inv: new THREE.Matrix4(), sc: 1 }) - 1];
const rcGroundG = group(rcStripG, 0, 0, 0);
const rcGround = box(rcGroundG, RC.W, RC.T, 1, PAPER, 0, 0, 0.5, { noShadow: true });
const rcGroundFace = plane(rcGroundG, RC.W - 0.004, 1, rcMat, 0, RC.T / 2 + 0.0005, 0.5); rcGroundFace.rotation.x = -Math.PI / 2;
const rcCurlG = group(rcGroundG, 0, 0, 0); rcCurlG.rotation.x = -0.9;
box(rcCurlG, RC.W, RC.T, 0.035, PAPER, 0, 0, 0.0175, { noShadow: true });
const setV = (pl, a, b) => { const uv = pl.geometry.attributes.uv, va = 1 - a / RC.PH, vb = 1 - b / RC.PH; uv.setY(0, va); uv.setY(1, va); uv.setY(2, vb); uv.setY(3, vb); uv.needsUpdate = true; };

// ================= the clock of the episode =================
// the sheet: shaken in the window through the hook; kept low over the counter, its back to us; lifted on "Ikaw,"; slapped face down on "laway"; then it lies there
const T_LOW = [A.shout.e + 0.1, A.shout.e + 0.75], T_RAISE = [T_LAWAY - 0.75, T_LAWAY - 0.4], T_SLAP = [T_LAWAY - 0.1, T_LAWAY + 0.03], T_REL = [A.blaway.s + 0.2, A.blaway.s + 0.6];
const S_HOOK = { B: v3(-0.04, 1.28, -1.5), q: qX(0.3) }, S_HOLD = { B: v3(-0.1, 1.19, -1.72), q: qX(1.62) }, S_RAISE = { B: v3(-0.1, 1.38, -1.66), q: qX(1.45) };
const S_REST = { B: v3(-0.2, COUNTER_Y + SH.d / 2 + 0.0008, -1.8), q: qX(Math.PI / 2) };
const _sB = new THREE.Vector3(), _sq = new THREE.Quaternion(), _sc = new THREE.Vector3();
function sheetPose(t) {
  const mix = (a, b, u) => { _sB.copy(a.B).lerp(b.B, u); _sq.copy(a.q).slerp(b.q, u); };
  if (t < T_LOW[1]) mix(S_HOOK, S_HOLD, ramp(T_LOW[0], T_LOW[1], t));
  else if (t < T_SLAP[0]) mix(S_HOLD, S_RAISE, ramp(T_RAISE[0], T_RAISE[1], t));
  else { const u = clamp01((t - T_SLAP[0]) / (T_SLAP[1] - T_SLAP[0])); mix(S_RAISE, S_REST, u * u); }
  const wSh = 1 - smooth((t - T_LOW[0]) / 0.3), jab = Math.max(0, Math.sin(t * 19 + 1.2));      // the thrust leads the tilt, so the first frame is a jab with the sheet upright
  if (wSh > 0.001) { _sq.premultiply(qZ(0.2 * Math.sin(t * 19) * wSh)); _sB.z += 0.055 * jab * wSh; _sB.y += 0.022 * jab * wSh; }
  return { pos: _sc.set(0, SH.h / 2, 0).applyQuaternion(_sq).add(_sB), quat: _sq };
}
// the receipt: starts as Claude says he will list it, a row at a time through c_read; jerks longer before "Nadagdagan po."; in the silence after
// "Ako ang mananagot." it runs out to the ground
const T_SLOT = A.print.s - 0.15, T_P0 = A.print.s + 0.2;
const T_J1 = (() => { const c = TL.shots.find((k) => k.shot === "t_receipt" && k.t > A.pink.s); return Math.max(c ? c.t + 0.07 : 0, A.more.s - 0.22); })(), T_J2 = A.spine.e + 0.2;
const RC_KEYS = [[T_P0 + 0.3, 0], [A.print.e, 42], [A.read.s + 0.55, 53], [A.read.s + 1.45, 64], [A.read.s + 2.0, 79], [A.read.e - 0.3, RC_READ]];
function receiptLen(t) {                                        // texels of paper past the tongue
  if (t >= T_J2) return lerp(RC_MORE, RC_FIN, smooth((t - T_J2) / 0.5));
  if (t >= T_J1) return lerp(RC_READ, RC_MORE, smooth((t - T_J1) / 0.14));
  let v = 0; for (let i = 1; i < RC_KEYS.length; i++) { const a = RC_KEYS[i - 1], b = RC_KEYS[i]; if (t >= a[0]) v = lerp(a[1], b[1], clamp01((t - a[0]) / (b[0] - a[0]))); }
  return Math.floor(v);
}
// the ice candy: fetched from beside her (out of every frame), brought through the window by "ice"
const T_PICK = T_ICE - 0.85, T_OUT = T_ICE - 0.05;
const C_PICK = { p: v3(-0.64, 1.14, -1.93), ax: v3(0.2, 1, 0.1) }, C_MID = { p: v3(-0.45, 1.3, -1.76), ax: v3(0.05, 1, 0.2) }, C_OUT = { p: v3(-0.29, 1.4, -1.47), ax: v3(0.06, 0.9, 0.42) };
const qAxis = (ax) => new THREE.Quaternion().setFromUnitVectors(Y_AX, ax.clone().normalize());
const across = (ax, pos, sh, k = 0.6) => { const d = pos.clone().sub(sh).normalize(); return ax.clone().normalize().addScaledVector(d, -k * ax.clone().normalize().dot(d)).normalize(); };

const bulRig = { vUpper, armL, armR }, BL = armRig(bulRig, 1, "viron"), BR = armRig(bulRig, -1, "viron"), NR = armNena(nenaR, "nena"), NL = armNena(nenaL, "nena");
const faceBase = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase }, _hqL = new THREE.Quaternion(), _hqR = new THREE.Quaternion();
const _wl = new THREE.Vector3(), _wr = new THREE.Vector3(), _p = new THREE.Vector3(), _p2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
// her close shot has two framings: tight on her face with the utang sign left out above the frame, and, for "Bawal utang." alone, wider with the whole sign over her head
const N_TIGHT = { p: [-0.2, 1.55, -0.2], l: [-0.2, 1.42, -2.06], fov: 28, d: [0.003, 0, -0.02], cap: 1215 };
const N_SIGN = { p: [-0.2, 1.62, 0.55], l: [-0.2, 1.66, -1.8], fov: 30, d: [0.002, 0, -0.025], cap: 1110 };

const SET = {
  name: "tindahan",
  mode: () => "store",
  shots: {
    t_hook:    { p: [-0.1, 1.5, -0.42], l: [-0.1, 1.372, -1.8], fov: 35.5, d: [0.003, 0, -0.02], cap: 1316 },                    // frame 0: her face large in her window, the QUOTATION under it in her fist; the hook under the sheet
    t_front:   { p: [-0.02, 1.1, 3.2], l: [-0.02, 1.05, -1.5], fov: 42, d: [0, 0, -0.2], cap: 1250 },                            // Buloy and Claude on the bench from the front, Aling Nena in her window behind, the whole sign over her
    t_claude:  { p: [-0.4, 0.95, 1.8], l: [0.5, 0.72, -0.9], fov: 28, d: [0.01, 0, -0.025], cap: 640 },                          // Claude from Buloy's side, low in the frame so the receipt is whole under him; captions over his head
    t_vclose:  { p: [0.08, 1.28, 0.8], l: [-0.55, 1.25, -0.9], fov: 23, d: [-0.004, 0, -0.02], cap: 1380 },                       // Buloy's face
    t_wince:   { p: [0.08, 1.24, 0.8], l: [-0.55, 1.15, -0.9], fov: 23, d: [-0.004, 0, -0.02], cap: 1300 },                       // Buloy's face under her shout: the hook's three rows sit on his hoodie
    t_nena:    { ...N_TIGHT },                                                                                                    // Aling Nena close (update swaps in N_SIGN for "Bawal utang.")
    t_two:     { p: [0.1, 1.25, 2.2], l: [0.0, 1.0, -0.9], fov: 46, d: [0.01, 0, -0.03], cap: 1250 },                             // the two of them, Buloy turned to Claude with both hands open
    t_receipt: { p: [0.52, 0.51, 0.66], l: [0.52, 0.51, -0.75], fov: 28.5, d: [0, 0, -0.008], cap: 445 },                          // the receipt square on, Claude's eyes over it; captions between his eyes and the slot
    t_gag:     { p: [2.05, 1.15, 1.95], l: [-0.42, 1.08, -1.3], fov: 44, d: [-0.01, 0, -0.02], cap: 1042 },                          // Claude near, Buloy's face, Aling Nena behind with the ice candy
    t_hook_a:  { p: [0.09, 0.95, 1.55], l: [0.05, 1.28, -1.6], fov: 64, d: [0, 0, -0.03], cap: 1330 },                            // frame 0, choice a: from low in front, Buloy and Claude in the foreground, her window over them
    t_hook_b:  { p: [-0.36, 1.46, -0.62], l: [-0.05, 1.27, -1.78], fov: 52, d: [0.003, 0, -0.02], cap: 1316 },                       // frame 0, choice b: from her right, her face and the sheet side by side
    t_hook_c:  { p: [-0.16, 1.55, 0.3], l: [-0.16, 1.66, -1.8], fov: 34, d: [0.002, 0, -0.03], cap: 1330 },                        // frame 0, choice c: wider, the whole BAWAL UTANG sign over her head
  },
  keys: () => [{ t: 0.02, label: "first-frame" }, { t: 1.0, label: "sheet-shaken" }, { t: 3.2, label: "sheet-shaken-wide" }, { t: T_LOW[1] + 0.3, label: "sheet-kept" }, { t: T_RAISE[1] + 0.05, label: "sheet-raised" },
    { t: T_SLAP[1] + 0.03, label: "sheet-slapped" }, { t: T_REL[1] + 0.4, label: "sheet-resting" }, { t: A.print.e, label: "receipt-starts" }, { t: A.read.e + 0.15, label: "receipt-read" }, { t: T_J1 + 0.3, label: "receipt-more" },
    { t: T_J2 + 0.55, label: "receipt-ground" }, { t: T_PICK + 0.03, label: "candy-picked" }, { t: T_OUT + 0.05, label: "candy-out" }, { t: A.laugh.s + 0.5, label: "candy-laugh" }],
  update(t, ctx) {
    const hook = ctx.shot.indexOf("t_hook") === 0, closeN = ctx.shot === "t_nena" || hook;
    Object.assign(SHOTS.t_nena, t >= A.bawal.s - 0.3 && t < A.see.s - 0.1 ? N_SIGN : N_TIGHT);
    nLight.intensity = closeN ? 0.5 : 0.15;
    SHOTS.t_gag.cap = t > A.laugh.s - 0.15 ? 560 : 1042;                                            // her line over the closing card sits under the card's icons, not on its sentence
    grilleBars[1].visible = !(ctx.shot === "t_vclose" || ctx.shot === "t_wince");
    SHOTS.t_front.cap = t > T_P0 ? 1445 : 1250;                                                   // once the receipt hangs in front of Claude the caption sits under it
    const vAmp = ampAt("viron", t), cAmp = ampAt("claude", t);

    // =============== Buloy ===============
    V.updateMatrixWorld(true);
    armL.hand.getWorldPosition(_wl); armR.hand.getWorldPosition(_wr); armL.hand.getWorldQuaternion(_hqL); armR.hand.getWorldQuaternion(_hqR);                            // where the director left his wrists: on the keys
    const wWince = 1 - smooth((t - (A.shout.e + 0.05)) / 0.4), wSide = win(A.side, t, 0.1, 0.2), wDread = env(A.side.e + 0.3, A.dread.e + 0.1, t, 0.3, 0.25), wSweet = env(A.sweet.s - 0.15, A.bawal.e + 0.1, t, 0.3, 0.3);
    const wSee = win(A.see, t, 0.2, 0.25), wLaw = win(A.blaway, t, 0.12, 0.2), wWatch = env(A.print.s + 0.2, A.type.e + 0.1, t, 0.4, 0.3), wSpine = env(A.spine.s - 0.3, T_SIGE, t, 0.35, 0.5);
    const wFlav = win(A.flavor, t, 0.12, 0.3), wCaught = smooth((t - (A.price.s + 0.35)) / 0.35), wSunk = smooth((t - (A.price.e - 0.1)) / 0.6);
    let yaw = 0.15, pitch = 0.03, roll = 0, tYaw = 0, tLean = 0.1, up = 0;
    const to = (w, y, p, ty, tl) => { yaw = lerp(yaw, y, w); pitch = lerp(pitch, p, w); tYaw = lerp(tYaw, ty, w); tLean = lerp(tLean, tl, w); };
    to(wWince, 0.02, 0.14, 0, 0.17); to(wSide, 0.6, 0.02, 0.1, 0.1); to(wDread, 0.1, 0.0, 0, 0.08); to(wSweet, 0.62, -0.04, 0.6, 0.06); to(wSee, 0.72, -0.03, 0.42, 0.04);
    to(wLaw, 0.34, -0.1, 0.1, 0.02); to(wWatch, 0.62, 0.2, 0.12, 0.12); to(wSpine, 0.34, -0.13, 0, -0.02); to(wFlav, 0.36, -0.04, 0.12, 0.2); to(wCaught, 0.78, 0.0 + 0.1 * wSunk, 0.2, 0.1 + 0.07 * wSunk);
    up = 0.02 * wSpine - 0.012 * wWince - 0.015 * wSunk * wCaught;
    roll = -0.05 * wWince + 0.05 * wSweet + 0.03 * wFlav;
    vUpper.rotation.set(tLean + Math.sin(t * 1.3) * 0.008, tYaw, 0); vUpper.position.y = 0.52 + up;
    vHead.rotation.set(pitch + Math.sin(t * 1.13 + 2) * 0.008 - 0.03 * clamp01(vAmp) * wSee, yaw + Math.sin(t * 0.7) * 0.015, roll + Math.sin(t * 0.9 + 1) * 0.012);
    Object.assign(bulFace, faceBase, { blink: face.blink });
    const dr = eyeDrift(t), quiet = 1 - Math.max(wDread, wCaught, wLaw);
    let f = { smile: 0, brow: 0.1, gx: 0.15, gy: 0, lid: 0, sad: 0, cheek: 0, pucker: 0, anger: 0, open: clamp01(vAmp * 1.25) };
    const fto = (w, o) => { for (const k in o) f[k] = lerp(f[k], o[k], w); };
    fto(wWince, { smile: -0.6, brow: -0.7, sad: 0.6, cheek: 0.75, lid: 0.3, gx: 0.0, gy: -0.05, open: 0.2, pucker: 0 });
    fto(wSide, { brow: 0.55, smile: -0.12, gx: 0.6, sad: 0.25 });
    fto(wDread, { smile: -0.4, brow: -0.2, anger: 0.5, lid: 0.28, gx: 1.0, gy: 0.05, sad: 0, cheek: 0 });
    fto(wSweet, { smile: 0.9, cheek: 0.95, brow: 0.65, lid: 0.12, gx: 0.75, gy: -0.1, anger: 0 });
    fto(wSee, { smile: 0.55, cheek: 0.4, brow: 0.85, gx: 0.45, lid: -0.2 });
    fto(wLaw, { smile: -0.35, brow: 1.0, sad: 0.3, lid: -0.55, gx: 0.1, gy: -0.05, open: Math.max(f.open, 0.62) });
    fto(wWatch, { brow: 0.25, gx: 0.7, gy: 0.4, smile: -0.1, lid: 0.1 });
    fto(wSpine, { smile: 0.14, brow: 0.05, anger: 0.3, lid: 0.0, gx: 0.05, gy: -0.12, sad: 0, cheek: 0.1 });
    fto(wFlav, { smile: 0.6, cheek: 0.6, brow: 1.0, lid: -0.45, gx: 0.2, gy: -0.1, anger: 0 });
    { const side = 1 - smooth((t - (A.price.s + 1.3)) / 0.4);                                    // caught: his eyes go to Claude, then to us, and he has nothing to say
      fto(wCaught, { smile: -0.3, brow: 0.55, sad: 0.55, lid: -0.5 + 0.2 * wSunk, gx: lerp(-0.15, 0.85, side), gy: 0.1 * wSunk, pucker: 0.35, open: 0.14 * (1 - wSunk), cheek: 0, anger: 0 }); }
    Object.assign(bulFace, f); bulFace.gx += dr[0] * 0.5 * quiet; bulFace.gy += dr[1] * 0.5 * quiet;
    if (wDread > 0.5 || wLaw > 0.5 || wFlav > 0.3) bulFace.blink = 0;
    bulFace.blink = Math.max(bulFace.blink, Math.exp(-(((t - (A.dread.s - 0.5)) / 0.17) ** 2)));           // the silence before "Claude.": a long blink
    if (wCaught > 0.5) bulFace.blink = Math.exp(-(((t - (A.price.e + 0.3)) / 0.07) ** 2));
    if (t < A.shout.e) bulFace.blink = Math.max(bulFace.blink, 0.55 + 0.35 * Math.max(0, Math.sin(t * 19 + 1.2)));     // he flinches with each shake of the sheet
    buloy.draw(bulFace);
    // his hands stay on the keys while his body turns; for b_see both come up, open, toward Claude
    V.updateMatrixWorld(true);
    const gB = wSee * (0.85 + 0.15 * Math.sin(t * 11));
    BL.ik(_p.copy(_wl).lerp(_p2.set(-0.2, 1.06, -0.58), gB)); BR.ik(_p.copy(_wr).lerp(_p2.set(-0.5, 1.02, -0.5), gB));
    handQuatWorld(armL.hand, _hqL); handQuatWorld(armR.hand, _hqR);                                  // and keep the turn they had there, so no finger comes through the lid
    if (wSee > 0.001) { orientHand(armL.hand, _p.set(1, 0.25, 0.25), _p2.set(-0.1, 1, 0.5), wSee); orientHand(armR.hand, _p.set(1, 0.2, 0.45), _p2.set(-0.1, 1, 0.5), wSee); armL.H.pose = mixPose(HAND_POSES.relaxed, HAND_POSES.open, wSee); armR.H.pose = mixPose(HAND_POSES.relaxed, HAND_POSES.open, wSee); }

    // =============== Claude ===============
    const feeding = t > T_P0 && t < A.read.e + 0.1 ? 1 : 0, wPrice = smooth((t - (A.price.s - 0.25)) / 0.4);
    let cy = -0.12;
    cy = lerp(cy, 0.0, 1 - smooth((t - A.shout.e) / 0.4)); cy = lerp(cy, -0.55, win(A.side, t, 0.15, 0.1)); cy = lerp(cy, -0.38, env(A.print.s - 0.2, A.print.s + 0.8, t, 0.3, 0.5));
    cy = lerp(cy, 0.0, env(A.print.e - 0.3, A.more.e + 0.05, t, 0.4, 0.3)); cy = lerp(cy, -0.12, env(A.type.s - 0.15, A.spine.s, t, 0.3, 0.5)); cy = lerp(cy, 0.12, wPrice);                     // with the paper out he barely turns: the strip must stay clear of the bench's edge
    C.rotation.y = cy + Math.sin(t * 0.7) * 0.012;
    cBody.position.y += feeding * Math.sin(t * 61) * 0.0025;
    if (wPrice > 0.01) { cBody.rotation.z *= 1 - wPrice; }
    { const slow = Math.min(1 - 0.95 * Math.exp(-(((t - 2.7) / 0.16) ** 2)), 1 - 0.95 * Math.exp(-(((t - (A.dread.s - 0.35)) / 0.16) ** 2)));       // the deadpan: one slow blink under her shouting, one before "Claude."
      cEyes.forEach((e) => { e.scale.y *= slow * (1 - 0.55 * wPrice); if (wPrice > 0.3) { e.position.y = 0.2 - 0.014 * wPrice; e.position.x += 0.022 * wPrice; } }); }
    // the slot, and the paper
    slotP.g.visible = t >= T_SLOT; slotP.g.scale.set(Math.max(0.02, ramp(T_SLOT, T_SLOT + 0.18, t)), 1, 1);
    C.updateMatrixWorld(true);
    if (t < T_P0) gripHide(receipt);
    else {
      const pink = t >= T_J1, pan = t >= T_J2, Lpx = receiptLen(t), tongue = RC.TONGUE * ramp(T_P0, T_P0 + 0.3, t);
      drawReceipt(Lpx, pink, pan);
      slotP.g.localToWorld(_p.set(0, 0, 0.0116)); _q.setFromAxisAngle(Y_AX, C.rotation.y);
      gripRest(receipt, _p, _q, slotP);
      rcTongue.scale.z = Math.max(tongue, 0.002); rcTongue.position.z = tongue / 2; rcTonguePart.h[2] = Math.max(tongue, 0.002) / 2; rcTonguePart.c[2] = tongue / 2; rcTonguePart.pts = null;
      rcStripG.position.set(0, -Math.sin(RC.TILT) * tongue, Math.cos(RC.TILT) * tongue);
      const drop = _p.y - Math.sin(RC.TILT) * tongue - 0.004, L = Lpx * RC.K, Lv = Math.max(0.002, Math.min(L, drop)), Lg = Math.max(0, L - Lv), vpx = Lv / RC.K;
      const kick = (u) => (u > 0 && u < 1.2 ? Math.exp(-u * 4) * Math.sin(u * 22) : 0);
      rcStripG.rotation.x = Lg > 0 ? 0 : 0.05 * kick(t - T_J1) + feeding * 0.006 * Math.sin(t * 9);
      rcStrip.visible = rcStripFace.visible = L > 0.003;
      rcStrip.scale.y = Lv; rcStrip.position.y = -Lv / 2; rcStripFace.scale.y = Lv; rcStripFace.position.y = -Lv / 2; setV(rcStripFace, 0, vpx);
      rcStripPart.h[1] = Lv / 2; rcStripPart.c[1] = -Lv / 2; rcStripPart.pts = null;
      rcGroundG.visible = Lg > 0.004; rcGroundG.position.set(0, -Lv + RC.T / 2, RC.T / 2);
      rcGround.scale.z = Math.max(Lg, 0.002); rcGround.position.z = Lg / 2; rcGroundFace.scale.y = Math.max(Lg, 0.002); rcGroundFace.position.z = Lg / 2; setV(rcGroundFace, vpx, Lpx);
      rcCurlG.position.set(0, 0, Lg);
      propRefresh(receipt);
    }

    // =============== Aling Nena ===============
    const nAmp = ampAt("nena", t), talkN = clamp01(Math.max(ctx.nTalk, 0) * 1.3);
    const wShout = t < A.shout.e ? 1 : 1 - smooth((t - A.shout.e) / 0.35), wBawal = win(A.bawal, t, 0.4, 0.3), wLawN = win(A.laway, t, 0.15, 0.2), wSlap = env(T_SLAP[0], T_SLAP[1] + 0.5, t, 0.1, 0.5), wSmug = env(T_SLAP[1] + 0.3, A.print.s, t, 0.3, 0.5);
    const wOff = env(A.pink.s - 0.15, T_AY - 0.1, t, 0.2, 0.15), wAy = env(T_AY - 0.08, T_GAWIN - 0.12, t, 0.12, 0.15), wPink = env(T_GAWIN - 0.15, A.pink.e + 0.25, t, 0.2, 0.4), wPoint = env(T_GAWIN - 0.2, A.pink.e + 0.15, t, 0.28, 0.4);
    const wSigh = env(A.candy.s + 0.02, T_SIGE - 0.05, t, 0.2, 0.25), wSige = env(T_SIGE - 0.1, T_PICK, t, 0.2, 0.3), wOffer = smooth((t - (T_PICK + 0.2)) / 0.5), wLaugh = smooth((t - (A.laugh.s - 0.1)) / 0.25);
    let lean = 0.14, hy = -0.1, hp = 0.02, hz = 0, ny = 0;
    const nto = (w, l, y, p) => { lean = lerp(lean, l, w); hy = lerp(hy, y, w); hp = lerp(hp, p, w); };
    nto(wShout, 0.34, hook ? 0.0 : -0.22, hook ? -0.16 : -0.05); nto(wBawal, 0.1, -0.06, 0.0); nto(wLawN, 0.2, -0.16, -0.04); nto(wSlap, 0.38, -0.2, -0.14); nto(wSmug, 0.12, -0.14, -0.02);
    nto(wOff, 0.2, 0.3, -0.06); nto(wAy, 0.1, 0.12, -0.16); nto(wPink, 0.3, 0.42, -0.1); nto(wSigh, 0.2, -0.05, 0.24); nto(wSige, 0.12, -0.18, 0.02); nto(wOffer, 0.3, -0.2, -0.12); nto(wLaugh, 0.16, -0.12, -0.3);
    hy += 0.1 * Math.sin(t * 9.5) * wOff * (t > A.pink.s ? 1 : 0); hz = 0.1 * wAy - 0.04 * wShout + Math.sin(t * 14) * 0.03 * wLaugh; ny = -0.05 * wShout + 0.12 * wPink - 0.06 * wOffer;
    const jolt = 0.09 * Math.max(0, Math.sin(t * 19 + 1.2)) * wShout;
    nenaUp.rotation.set(lean + jolt + Math.sin(t * 15) * 0.012 * wLaugh, ny, Math.sin(t * 1.9) * 0.01); nenaUp.position.y = 0.9 - 0.012 * wSigh + Math.sin(t * 15) * 0.007 * wLaugh;
    nenaHead.rotation.set(hp - lean * 0.75 + Math.sin(t * 0.8) * 0.01, hy + Math.sin(t * 0.6) * 0.02, hz);
    nface.old = 1;
    let nf = { smile: -0.05, brow: 0.05, squint: 0.1, gx: -0.25, gy: 0.2, wide: Math.sin(t * 8.1) * 0.5 * (talkN > 0 ? 1 : 0), open: talkN, blink: blinkAt(t, 1.3, 4.6) };
    const nfto = (w, o) => { for (const k in o) nf[k] = lerp(nf[k], o[k], w); };
    nfto(wShout, { smile: -0.9, brow: 1.0, squint: -0.6, gx: hook ? 0 : -0.3, gy: hook ? 0.05 : 0.3, wide: 0.9, open: Math.max(talkN, t < A.shout.s + 0.12 ? 1 : 0.62), blink: 0 });
    nfto(wBawal, { smile: -0.2, brow: -0.05, squint: 0.3, gx: -0.35, gy: 0.3, blink: 0, wide: -0.2 });
    nfto(wLawN, { smile: -0.4, brow: 0.7, squint: 0.15, gx: -0.35, gy: 0.3, blink: 0 });
    nfto(wSmug, { smile: 0.25, brow: 0.2, squint: 0.55, gx: -0.35, gy: 0.3 });
    nfto(wOff, { smile: -0.45, brow: 0.85, squint: 0.05, gx: 0.35, gy: 0.3, blink: 0 });
    nfto(wAy, { smile: 0.0, brow: 0.95, squint: 0, gx: 0.55, gy: -0.85, wide: -0.8, open: Math.max(talkN, 0.25), blink: 0 });
    nfto(wPink, { smile: 0.4, brow: 0.35, squint: 0.4, gx: 0.3, gy: 0.35 });
    nfto(wSigh, { smile: -0.3, brow: -0.5, squint: 0, gy: 0.6, blink: 0.92, open: 0.22, wide: -0.6 });
    nfto(wSige, { smile: -0.15, brow: -0.3, squint: 0.15, gx: -0.3, gy: 0.3 });
    nfto(wOffer, { smile: 0.35, brow: 0.6, squint: 0.2, gx: -0.35, gy: 0.3 });
    nfto(wLaugh, { smile: 0.95, brow: 0.3, squint: 0.85, gy: 0.1, open: Math.max(talkN, 0.3 + 0.35 * Math.abs(Math.sin(t * 13))), blink: 0.85 * (Math.sin(t * 6) > 0 ? 1 : 0.5) });
    Object.assign(nface, nf); nface.open = clamp01(nface.open);
    drawNena(nctx, nface); nenaTex.needsUpdate = true;
    fan.visible = false; nenaL.up.visible = true;
    nena.updateMatrixWorld(true);
    // free arms first: each hand hovers over its place on the counter; the left goes out to point at Claude ("Gawin mo palang pink"), and later down beside her for the ice candy
    const held = t < T_SLAP[1], kLow = ramp(T_LOW[0], T_LOW[1], t);
    nenaR.pole = [lerp(0.2, 0.75, kLow), -1, 0]; nenaL.pole = [-0.6, -1, 0];
    const shL = nenaUp.localToWorld(v3(-0.21, 0.57, 0.03)), dirP = v3(0.52, 0.8, -0.86).sub(shL).normalize(), wPre = env(T_PICK - 0.5, T_PICK + 0.1, t, 0.4, 0.1);
    const tgtL = v3(-0.4, 1.15, -1.74).lerp(shL.clone().addScaledVector(dirP, 0.43), wPoint).lerp(v3(-0.6, 1.1, -1.9), wPre);
    solveNenaArm(nenaR, v3(-0.03, 1.15, -1.74), 1, nQuat(-0.25, 0, 0), nQuat(-0.4, 0, 0)); solveNenaArm(nenaL, tgtL, 1, nQuat(-0.25, 0, 0), nQuat(-0.4, 0, 0));
    nenaR.hand.quaternion.identity(); nenaL.hand.quaternion.identity(); nenaR.H.pose = HAND_POSES.relaxed; nenaL.H.pose = wPoint > 0.4 ? HAND_POSES.point : HAND_POSES.relaxed;
    nena.updateMatrixWorld(true);
    orientHand(nenaR.hand, Z_AX, Y_AX, 1); orientHand(nenaL.hand, _p.copy(Z_AX).lerp(dirP, wPoint).normalize(), Y_AX, 1);
    const candyOn = t >= T_PICK, busyL = Math.max(wPoint, smooth((t - (T_PICK - 0.5)) / 0.3)), flatR = smooth((t - T_REL[1]) / 0.5);
    gripTouch(counterP, [{ A: NL, sk: "flat", x: -0.8, z: -0.12, dir: Z_AX, w: 1 - busyL, g: 1, arc: 0.04 }, { A: NR, sk: "flat", x: -0.43, z: -0.12, dir: Z_AX, w: flatR, g: 1, arc: 0.04 }]);
    // ---- the quotation ----
    const SP = sheetPose(t);
    if (held) gripHold(sheet, SP.pos, SP.quat, [{ A: NR, sk: "pinch", w: 1, g: 1 }], { carrier: 0, obstacles: [counterP] });
    else if (t < T_REL[1]) gripHold(sheet, SP.pos, SP.quat, [{ A: NR, sk: "pinch", w: 1 - ramp(T_REL[0], T_REL[1], t), g: 1 - ramp(T_REL[0] - 0.12, T_REL[0], t), clear: 0.05 }], { state: "rest", on: counterP, obstacles: [counterP] });
    else gripRest(sheet, SP.pos, SP.quat, counterP);
    // ---- the ice candy ----
    if (candyOn) {
      const u1 = ramp(T_PICK + 0.08, T_PICK + 0.4, t), u2 = ramp(T_PICK + 0.35, T_OUT, t), bob = wOffer * (0.012 * Math.sin(t * 7) * (1 - wLaugh) + 0.01 * Math.sin(t * 15) * wLaugh);
      const pos = _p.copy(C_PICK.p).lerp(C_MID.p, u1).lerp(C_OUT.p, u2); pos.y += bob;
      const ax = _p2.copy(C_PICK.ax).lerp(C_MID.ax, u1).lerp(C_OUT.ax, u2);
      const q = qAxis(across(ax, pos, shL));
      for (let k = 0; k < 2; k++) gripHold(candy, pos, q, [{ A: NL, sk: "wrap", w: 1, g: 1 }], { carrier: 0 });
    } else gripHide(candy);
  },
};
