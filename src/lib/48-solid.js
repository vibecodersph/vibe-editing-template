// ---------- solid props with real measures and named grip sockets (built on 47-grip.js) ----------
// Each maker returns a prop P (see makeProp): P.g is the group, P.sockets the grips, P.screens the lit faces QA keeps clear, P.rad the size of a close-up.
// All materials are opaque: a screen glows because it is unlit and brighter than white, never because it is see-through.
// The episodes before 04 keep their own older props (40-cast.js laptop, 43-props.js phones); nothing here changes them.

// a hand that grips a thin slab from one side: fingers flat against one face and hooked round the far edge, thumb round the near edge
// w: the slab's width across the grip, d: its thickness. Returns the angle the fingers make with the across direction.
function spanAngle(H, w) {
  const vx = (HD.tb[0] - 0.5 * HD.gap) * H.sx, vy = (-HD.rootY + HD.len[1] * (HD.frac[0] + HD.frac[1]) + HD.tb[1]) * H.sc, want = w + 0.0115 * H.sc + (HD.th[1] / 2) * H.sc + 0.001;
  let best = 0.1, be = 1e9;
  for (let a = 0.08; a <= 1.3; a += 0.01) { const e = Math.abs(vx * Math.sin(a) + vy * Math.cos(a) - want); if (e < be) { be = e; best = a; } }
  return best;
}

// the carry grip for anything with a thin edge held out in front (a laptop's side, a tray's end): the forearm points along the edge, the palm faces the
// edge's side wall from just below it, the four fingers curl in under the bottom, the thumb stands up past the wall and bends down onto the top.
// e: which side (+1 or -1 along the prop's x), x: that wall's x, yb: the bottom's y, z: where along the edge, fz: +1 if the fingers point to +z. Use the hand with s * e * fz = 1.
const carrySocket = (H, e, x, yb, z, fz = 1) => ({ p: v3(x, yb - 0.0018, z), n: v3(e, 0, 0), f: v3(0, 0, fz), anchor: [-H.s * HD.palm[0] / 2, -0.047], idle: [1.3, 0.4, 0.25], to: [1.3, 0.6, 0.4], thumb: "oppose", splay: 1.4, thumbRx: [0.04, 0.04], thumbFree: true, tb2: [0.1, 1.4] });
// ---- a phone: case, black glass, lit screen, camera bump with two lenses, side buttons ----
// o: { name, tex (screen texture), col (case colour), boost }. Its frame: x across, y up the long side, the screen faces +z.
function makePhone(parent, o = {}) {
  const P = makeProp(o.name || "phone", parent), g = P.g, w = 0.08, h = 0.166, d = 0.011, col = o.col ?? 0x6b46c9;
  P.dim = { w, h, d }; P.rad = 0.15;
  P.box(g, w, h, d, col, 0, 0, 0, { r: 0.0045 });                                                       // the case
  P.box(g, w - 0.005, h - 0.005, 0.0012, 0x0b0b10, 0, 0, d / 2 + 0.0002, { detail: true, noShadow: true });   // the glass, with a black bezel round the screen
  const scr = plane(g, w - 0.012, h - 0.016, new THREE.MeshBasicMaterial({ map: o.tex || null, color: new THREE.Color(o.boost || 1.2, o.boost || 1.2, o.boost || 1.2) }), 0, 0, d / 2 + 0.0009);
  P.screens.push({ node: scr, w: w - 0.012, h: h - 0.016 });
  P.box(g, 0.018, 0.0022, 0.0006, 0x2a2a33, 0, h / 2 - 0.006, d / 2 + 0.001, { detail: true, noShadow: true });        // the earpiece slit
  P.box(g, 0.032, 0.036, 0.003, new THREE.Color(col).multiplyScalar(0.72).getHex(), -0.017, h / 2 - 0.026, -d / 2 - 0.0012, { r: 0.0012 });   // the camera bump on the back
  for (const y of [0.009, -0.009]) { const l = mesh(g, new THREE.CylinderGeometry(0.0062, 0.0062, 0.0016, 10), mat(0x0d0d12, R), -0.017, h / 2 - 0.026 + y, -d / 2 - 0.0031, { noShadow: true }); l.rotation.x = Math.PI / 2; const k = mesh(g, new THREE.CylinderGeometry(0.0028, 0.0028, 0.0018, 8), mat(0x4a6a9a, { glow: 0.9 }), -0.017, h / 2 - 0.026 + y, -d / 2 - 0.0033, { noShadow: true }); k.rotation.x = Math.PI / 2; }
  P.box(g, 0.0016, 0.02, 0.0045, 0x1c1c22, w / 2 + 0.0004, 0.022, 0, { detail: true, noShadow: true });                 // the power button
  P.box(g, 0.0016, 0.034, 0.0045, 0x1c1c22, -w / 2 - 0.0004, 0.03, 0, { detail: true, noShadow: true });                // the volume rocker
  P.box(g, 0.012, 0.0016, 0.004, 0x0b0b10, 0, -h / 2 - 0.0003, 0, { detail: true, noShadow: true });                    // the charging port
  // "show": held up for someone else to read. Palm on the back, fingers across it and hooked round the far long edge, thumb round the near one.
  P.sockets.show = (H, G = {}) => {
    const s = H.s, a = spanAngle(H, w), yc = G.y ?? -0.03;
    // the thumb does not cross the glass: it lies along the near edge, its pad on the side of the case
    return { p: v3(-s * (w / 2 + 0.0115 * H.sc), yc + HD.tb[0] * H.sx * Math.cos(a), -d / 2), n: v3(0, 0, -1), f: v3(s * Math.cos(a), Math.sin(a), 0), anchor: [-s * HD.tb[0], HD.tb[1]], thumb: "oppose", splay: Math.PI / 2 - a, thumbRx: [1.5, 0.3], thumbFree: true, tb2: [0.05, 0.3] };
  };
  return P;
}

// ---- a laptop: one object that opens and closes ----
// Its frame: the hinge is along x at the back (-z), whoever types sits at +z, the open screen faces +z. P.open(angle): 0 shut, about 1.85 open.
const keysTex = painted(60, 24, (g) => {
  g.fillStyle = "#23232b"; g.fillRect(0, 0, 60, 24);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { g.fillStyle = (r === 4 && c > 3 && c < 10) ? "#4a4a56" : (r + c) % 7 === 3 ? "#565664" : "#474752"; if (r === 4 && c > 4 && c < 10) continue; g.fillRect(2 + c * 4, 2 + r * 4.4, r === 4 && c === 4 ? 23 : 3, 3); }
}, { mip: false });
function makeLaptop(parent, o = {}) {
  const P = makeProp(o.name || "laptop", parent), g = P.g, k = o.k ?? 1.15, W = 0.32 * k, D = 0.22 * k, T = 0.016 * k, LT = 0.007 * k, body = o.col ?? 0xc6c9d2;
  P.dim = { W, D, T, LT }; P.rad = 0.3;
  P.box(g, W, T, D, body, 0, 0, 0, { r: 0.004 });                                                       // the base
  P.box(g, W - 0.012, 0.0014, D - 0.012, 0xaeb1ba, 0, T / 2 + 0.0001, 0, { detail: true, noShadow: true });               // the deck, a shade darker than the rim
  { const kb = plane(g, W * 0.84, D * 0.44, mat(0xffffff, { map: keysTex }), 0, T / 2 + 0.0011, -D * 0.16); kb.rotation.x = -Math.PI / 2; }   // the key grid
  P.box(g, W * 0.3, 0.001, D * 0.27, 0x9a9da6, 0, T / 2 + 0.0009, D * 0.3, { detail: true, noShadow: true });              // the trackpad
  P.box(g, W * 0.3 - 0.004, 0.0012, D * 0.27 - 0.004, 0xb8bbc4, 0, T / 2 + 0.001, D * 0.3, { detail: true, noShadow: true });
  for (const s of [-1, 1]) P.box(g, 0.012, 0.004, 0.0015, 0x6dff8a, s * (W / 2 - 0.02), 0, D / 2 + 0.0002, { detail: true, noShadow: true, mat: { glow: 1.3 } });   // two status lights on the front edge
  for (const s of [-1, 1]) P.box(g, 0.0012, T * 0.45, 0.014, 0x2a2a33, s * (W / 2 + 0.0002), 0, -D * 0.25, { detail: true, noShadow: true });                     // ports on the sides
  const hz = -D / 2 + 0.005 * k, hy = T / 2 + 0.004 * k;
  { const hg = mesh(g, new THREE.CylinderGeometry(0.0055 * k, 0.0055 * k, W * 0.72, 8), mat(0x3a3a44, R), 0, hy - 0.001, hz, { noShadow: true }); hg.rotation.z = Math.PI / 2; }   // the hinge barrel
  const lid = group(g, 0, hy, hz), LD = D - 0.004 * k;
  P.box(lid, W, LT, LD, body, 0, LT / 2, LD / 2, { r: 0.003 });                                         // the lid
  P.box(lid, W - 0.008, 0.001, LD - 0.008, 0x0b0b10, 0, -0.0003, LD / 2, { detail: true, noShadow: true });                // the bezel
  const scr = plane(lid, W - 0.03, LD - 0.03, new THREE.MeshBasicMaterial({ map: o.tex || null, color: new THREE.Color(o.boost || 1.25, o.boost || 1.25, o.boost || 1.25) }), 0, -0.001, LD / 2 + 0.002); scr.rotation.x = Math.PI / 2;
  P.screens.push({ node: scr, w: W - 0.03, h: LD - 0.03 });
  P.box(lid, 0.006, 0.0012, 0.004, 0x3a3a44, 0, -0.0009, LD - 0.007, { detail: true, noShadow: true });                     // the camera in the bezel
  { const st = plane(lid, 0.085 * k, 0.085 * k, new THREE.MeshBasicMaterial({ map: starTex, alphaTest: 0.4, color: new THREE.Color(0.92, 0.92, 0.92) }), 0, LT + 0.0006, LD / 2); st.rotation.x = -Math.PI / 2; st.rotation.z = Math.PI; }   // the brand's own star on the lid's back
  P.box(lid, 0.05 * k, 0.0008, 0.016 * k, 0xd97757, W * 0.3, LT + 0.0003, LD * 0.24, { detail: true, noShadow: true, rot: [0, 0.2, 0] });   // one orange sticker
  P.lid = lid; P.open = (a) => { lid.rotation.x = -a; }; P.open(o.open ?? 1.85);
  // "side+" / "side-": the two-hand carry. Fingers under the base from the side, thumb over the deck's edge. G.z moves the hand along the side.
  for (const e of [-1, 1]) P.sockets[e > 0 ? "side+" : "side-"] = (H, G = {}) => carrySocket(H, e, e * W / 2, -T / 2, G.z ?? -D * 0.16, G.fz ?? 1);
  // where a nub presses it: the side faces, toward the front
  P.nub = (e, z) => ({ p: v3(e * W / 2, 0, z ?? D * 0.22), n: v3(e, 0, 0) });
  return P;
}

// ---- a wireless microphone: grille ball, ring, body with a switch, an end cap ----
// Its frame: the body runs along y, the head is at +y.
const grilleTex = painted(16, 16, (g) => { g.fillStyle = "#9a9da8"; g.fillRect(0, 0, 16, 16); for (let y = 0; y < 16; y += 2) for (let x = (y / 2) % 2; x < 16; x += 2) { g.fillStyle = "#3c3d46"; g.fillRect(x, y, 1, 1); } g.fillStyle = "#e4e6ee"; for (let x = 0; x < 16; x += 4) g.fillRect(x, 7, 2, 1); }, { repeat: true, mip: false });
grilleTex.repeat.set(3, 2);
function makeMic(parent, o = {}) {
  const P = makeProp(o.name || "mic", parent), g = P.g, r = 0.016, L = 0.17;
  P.dim = { r, L, head: 0.03, headY: L / 2 + 0.03 }; P.rad = 0.17;
  P.cyl(g, r, L, 0x1b1a20, 0, 0, 0);                                                                    // the body
  P.cyl(g, 0.0185, 0.012, 0xb9bcc6, 0, L / 2 + 0.002, 0, { mat: { rim: 0.6 } });                        // the ring under the head
  P.sph(g, 0.03, mat(0xffffff, { map: grilleTex, rim: 0.6 }), 0, L / 2 + 0.03, 0);                       // the grille ball
  { const b = mesh(g, new THREE.TorusGeometry(0.0302, 0.0026, 4, 14), mat(0xd8dbe4, { rim: 0.6 }), 0, L / 2 + 0.03, 0, { noShadow: true }); b.rotation.x = Math.PI / 2; }   // its band
  P.cyl(g, 0.0175, 0.01, 0x2f2e38, 0, -L / 2 - 0.004, 0);                                               // the end cap
  mesh(g, new THREE.CylinderGeometry(0.0166, 0.0166, 0.012, 10), mat(0xd62020, R), 0, -L / 2 + 0.014, 0, { noShadow: true });   // the red band of the set
  P.box(g, 0.007, 0.018, 0.003, 0x3a3a44, 0, 0.05, r + 0.0006, { detail: true, noShadow: true });       // the switch plate
  P.box(g, 0.004, 0.006, 0.0036, 0x3aff7a, 0, 0.054, r + 0.0012, { detail: true, noShadow: true, mat: { glow: 1.4 } });   // on
  // "low" / "mid" / "high": a wrap round the body. The palm goes to the side of the body that lets the forearm lie along the palm (so the wrist stays straight):
  // hold it twice in a frame and the second pass uses the arm the first one made. G.az sets that side by hand instead (0: the palm is behind it, at -z); G.azMix blends from the arm's side to that one.
  const _inv = new THREE.Matrix4();
  for (const [nm, y] of [["low", -0.04], ["high", 0.042], ["mid", 0]]) P.sockets[nm] = (H, G = {}) => {
    let n = null;
    if (G.A && (G.az === undefined || G.azMix !== undefined)) { const fl = v3(0, -1, 0).transformDirection(G.A.fore.matrixWorld).transformDirection(_inv.copy(g.matrixWorld).invert()); fl.y = 0; if (fl.lengthSq() > 0.03) n = v3(0, 1, 0).cross(fl.normalize()).multiplyScalar(H.s); }
    if (!n || G.azMix !== undefined) { const az = G.az || 0, nf = v3(-Math.sin(az), 0, -Math.cos(az)); n = n ? n.lerp(nf, G.azMix).normalize() : nf; }   // azMix: 0 the arm's own side .. 1 the side az names
    const f = v3(0, 1, 0).cross(n).multiplyScalar(-H.s);                                                 // f = s * (n x axis): the thumb ends toward the head
    return { p: v3(0, y + (G.dy || 0), 0).addScaledVector(n, r), n, f, anchor: [0, HD.rootY + 0.004], thumb: "oppose", splay: 0.1 };
  };
  // "tap": one fingertip on the grille ball, coming in along its own forearm. G.dir: where on the ball (the mic's own frame), G.lift: how far off it
  P.sockets.tap = (H, G = {}) => { const N = (G.dir || v3(0, 0.6, 0.8)).clone().normalize(); let T = v3(0, 1, 0); if (G.A) T = v3(0, -1, 0).transformDirection(G.A.fore.matrixWorld).transformDirection(_inv.copy(g.matrixWorld).invert()); T.addScaledVector(N, -T.dot(N)).normalize(); const st = G.steep ?? 0.77, ct = Math.sqrt(1 - st * st); return { p: v3(0, L / 2 + 0.03, 0).addScaledVector(N, 0.03), n: T.clone().multiplyScalar(st).addScaledVector(N, ct), f: T.clone().multiplyScalar(ct).addScaledVector(N, -st), anchor: [fingerX(H.s, 0), HD.rootY - HD.len[0]], depth: HD.th[2] / 2, lift: G.lift || 0.001, pose: HAND_POSES.point }; };
  return P;
}

// ---- a wooden serving tray with a leaf liner and eight separate turon ----
// Its frame: x along the tray, the board's top at y +0.006.
function makeTray(parent, o = {}) {
  const P = makeProp(o.name || "tray", parent), g = P.g, W = 0.5, D = 0.34, B = 0.012, RH = 0.026;
  P.dim = { W, D, B }; P.rad = 0.34;
  P.box(g, W, B, D, 0xc9a45a, 0, 0, 0);
  for (const s of [-1, 1]) { P.box(g, W, RH, 0.016, 0x8a6a2a, 0, -B / 2 + RH / 2, s * (D / 2 - 0.008)); P.box(g, 0.016, RH, D - 0.032, 0x8a6a2a, s * (W / 2 - 0.008), -B / 2 + RH / 2, 0); }   // the rim, four rails
  for (const s of [-1, 1]) P.box(g, 0.004, 0.008, 0.09, 0x5a4218, s * (W / 2 + 0.0005), 0.008, 0, { detail: true, noShadow: true });       // a dark grip groove on each end
  P.box(g, W - 0.05, 0.003, D - 0.05, 0x4f9a52, 0, B / 2 + 0.0015, 0, { detail: true, noShadow: true });                                    // the banana leaf
  P.box(g, 0.006, 0.0034, D - 0.05, 0x3a7a40, 0, B / 2 + 0.0017, 0, { detail: true, noShadow: true });                                      // its rib
  const r = rng(404);
  for (let i = 0; i < 8; i++) {                                                                            // the turon: each its own roll, lying on the leaf
    const tg = group(g, -0.165 + (i % 4) * 0.11 + (r() - 0.5) * 0.012, B / 2 + 0.003 + 0.0195, -0.075 + Math.floor(i / 4) * 0.15 + (r() - 0.5) * 0.012); tg.rotation.y = (r() - 0.5) * 0.3;
    const roll = P.cyl(tg, 0.0195, 0.13, i % 2 ? 0xb4622a : 0xc87434, 0, 0, 0, { rot: [Math.PI / 2, 0, 0], seg: 8 });
    for (const s of [-1, 1]) mesh(tg, new THREE.CylinderGeometry(0.0165, 0.0165, 0.006, 8), mat(0x7a3a16, R), 0, 0, s * 0.066, { noShadow: true }).rotation.x = Math.PI / 2;   // the fried, darker ends
    for (const z of [-0.03, 0.012, 0.04]) { const gl = mesh(tg, new THREE.BoxGeometry(0.022, 0.004, 0.007), mat(0xffd98a, { glow: 0.85 }), 0.003, 0.0185, z, { noShadow: true }); gl.rotation.y = 0.5; }   // caramel
  }
  // "end+" / "end-": the side hold. Four fingers under the board from the end, the thumb down on the end rail.
  for (const e of [-1, 1]) P.sockets[e > 0 ? "end+" : "end-"] = (H, G = {}) => carrySocket(H, e, e * W / 2, -B / 2, G.z ?? 0, G.fz ?? 1);
  return P;
}

// ---- a thick bound thesis: hard covers, a page block, a spine, a gold title ----
// Its frame: lying flat, x across the cover, the top cover at y +h/2, the spine at -x.
function makeThesis(parent, o = {}) {
  const P = makeProp(o.name || "thesis", parent), g = P.g, w = 0.215, d = 0.3, h = 0.05, cov = o.col ?? 0x1c3f8a;
  P.dim = { w, d, h }; P.rad = 0.26;
  P.part(g, "box", { h: [w / 2, h / 2, d / 2] });
  box(g, w, 0.004, d, cov, 0, h / 2 - 0.002, 0, R); box(g, w, 0.004, d, cov, 0, -h / 2 + 0.002, 0, R);                              // the two boards
  box(g, w - 0.01, h - 0.008, d - 0.012, 0xf0ead8, 0.003, 0, 0, { noShadow: true });                                                  // the page block, set in from three edges
  for (let i = 0; i < 5; i++) box(g, w - 0.0098, 0.0012, d - 0.0118, 0xcfc8b2, 0.003, -h / 2 + 0.01 + i * 0.008, 0, { noShadow: true });   // the pages show as lines
  box(g, 0.006, h, d, 0x12285c, -w / 2 + 0.003, 0, 0, R);                                                                               // the spine
  for (const z of [-0.1, 0.1]) box(g, 0.0064, h * 0.9, 0.006, 0xf2c230, -w / 2 + 0.003, 0, z, { noShadow: true });                      // two gold bands on it
  { const p = plane(g, w * 0.78, 0.07, signMat(px("THESIS", 40, 13, "#1c3f8a", "#f2c230", 1, { border: "#f2c230" })), 0.004, h / 2 + 0.0006, -0.04); p.rotation.x = -Math.PI / 2; p.rotation.z = Math.PI / 2; }
  // "tap": one fingertip on the cover. G.x, G.z where; G.lift how far the tip is off it; G.dir the way the finger points along the cover (prop frame)
  P.sockets.tap = (H, G = {}) => { const dir = (G.dir || v3(-1, 0, 0)).clone().normalize(), f = dir.clone().multiplyScalar(0.64).add(v3(0, -0.77, 0)), n = dir.clone().multiplyScalar(0.77).add(v3(0, 0.64, 0)); return { p: v3(G.x || 0, h / 2, G.z || 0), n, f, anchor: [fingerX(H.s, 0), HD.rootY - HD.len[0]], depth: HD.th[2] / 2, lift: G.lift || 0.001, pose: HAND_POSES.point }; };
  return P;
}

// ---- flat surfaces a hand can rest on or grip the edge of ----
// surfaceSockets(P, top): "flat" lays a hand palm down at G.x, G.z pointing G.dir; the fingers settle on the surface by themselves.
function flatSocket(P, y) { P.sockets.flat = (H, G = {}) => ({ p: v3(G.x || 0, y, G.z || 0), n: v3(0, 1, 0), f: (G.dir || v3(0, 0, 1)).clone().normalize(), thumb: "flat", start: [0, 0, 0], to: [0.5, 0.6, 0.4] }); }
