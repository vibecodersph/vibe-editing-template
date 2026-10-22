// ---------- solid props, grip sockets, and the hands that hold them ----------
// The rule this file exists for: a hand is never posed by eye against a prop. A prop is a solid object with real measures (metres) and
// its own colliders; a hand goes to a named socket on it; the finger joints are then closed against the colliders until the pads touch.
//
//   const P = makeProp("phone", room);            a prop: P.g is its group; build it with P.box / P.cyl / P.sph (each adds a mesh AND its collider;
//                                                  pass { detail: true } for a small part that lies inside or flush on another collider)
//   P.sockets.name = (H) => ({ p, f, n, ... })    a socket, in the prop's own frame: p the point the palm anchor sits on, n the surface normal there
//                                                  (the palm faces -n), f the way the fingers point. Options: anchor [x, y] (the point of the hand, in the
//                                                  hand's own unscaled measures, that lands on p; default the palm centre), lift (stand-off, metres),
//                                                  thumb "oppose" (comes round from the far side and closes back onto the prop) or "flat", splay,
//                                                  start / to (finger joint ranges), pose (a fixed HAND_POSES entry: no solving, for a tap or a flat rest)
//   gripHold(P, pos, quat, grips, o)               per frame, from a set's update: put the prop at a world pose and bring hands to sockets.
//                                                  grips: [{ A: armRig(rig, s) | armNena(nArm), sk: "name", w: reach 0..1, g: grasp 0..1, clear, arc }].
//                                                  While w < 1 the hand stands `clear` metres off the socket (default 0.06) and may arc `arc` metres up on the way.
//                                                  o.carrier: index of the grip the prop follows (the prop is moved to where that wrist really got to, so a
//                                                  carried prop is exactly in the hand); o.obstacles: other props the fingers must not enter (a table);
//                                                  o.state "held" (default) or "rest" with o.on = the prop it rests on.
//   nubHold(P, [{ i, p, n, w }])                   Claude has no fingers: nub i (0 his right, 1 his left) is laid flat against the prop at p, normal n.
//   gripRest(P, pos, quat, on)                     nobody holds it: it lies on `on` (another prop or a surface made with makeProp(..., { surface: true })).
// A hand-off is two grips whose w and g cross while the prop stands still: both are in contact during the overlap, then the carrier changes.
// tools/qa.py measures the result (60-qa.js): penetration, gap at contact, floating props, covered screens, transparent materials.
const GRIP = { props: [], people: {}, movers: [], holds: [], notes: [], skin: 0.0008, frame: 0, debug: false };   // movers: [{ name, root, person? }] a set lists every figure that walks or sits (Buloy, Claude, the extras) so QA can test each one against every solid
const _ga = new THREE.Vector3(), _gb = new THREE.Vector3(), _gc = new THREE.Vector3(), _gd = new THREE.Vector3(), _ge = new THREE.Vector3();
const _gq = new THREE.Quaternion(), _gq2 = new THREE.Quaternion(), _gM = new THREE.Matrix4(), _gM2 = new THREE.Matrix4(), _gEu = new THREE.Euler();

function makeProp(name, parent, o = {}) {
  const P = { name, g: group(parent), parts: [], sockets: {}, screens: [], state: "rest", on: null, surface: !!o.surface, seen: -1, shown: null };
  P.g.userData.prop = P;
  const M = (m, q) => (typeof m === "number" ? mat(m, q.mat || R) : m);
  P.part = (node, k, dims, c) => { P.parts.push({ k, node, c: c || [0, 0, 0], r: 0, ...dims, inv: new THREE.Matrix4(), sc: 1 }); return node; };
  P.box = (par, w, h, d, m, x = 0, y = 0, z = 0, q = {}) => {
    const me = mesh(par, q.r ? new RoundedBoxGeometry(w, h, d, 2, q.r) : new THREE.BoxGeometry(w, h, d), M(m, q), x, y, z, q);
    if (q.rot) me.rotation.set(q.rot[0], q.rot[1], q.rot[2]);
    if (!q.detail) P.part(me, "box", { h: [w / 2, h / 2, d / 2], r: q.r || 0 });
    return me;
  };
  P.cyl = (par, r, len, m, x = 0, y = 0, z = 0, q = {}) => {                       // along its own y
    const me = mesh(par, new THREE.CylinderGeometry(q.r1 ?? r, r, len, q.seg || 10), M(m, q), x, y, z, q);
    if (q.rot) me.rotation.set(q.rot[0], q.rot[1], q.rot[2]);
    if (!q.detail) P.part(me, "cyl", { rad: Math.max(r, q.r1 ?? r), hl: len / 2 });
    return me;
  };
  P.sph = (par, r, m, x = 0, y = 0, z = 0, q = {}) => { const me = mesh(par, new THREE.SphereGeometry(r, q.seg || 10, q.seg2 || 7), M(m, q), x, y, z, q); if (!q.detail) P.part(me, "sph", { rad: r }); return me; };
  GRIP.props.push(P);
  return P;
}
function partSDF(c, x, y, z) {                                                   // distance from a point in the part's own frame to its surface (negative inside)
  x -= c.c[0]; y -= c.c[1]; z -= c.c[2];
  if (c.k === "box") {
    const qx = Math.abs(x) - (c.h[0] - c.r), qy = Math.abs(y) - (c.h[1] - c.r), qz = Math.abs(z) - (c.h[2] - c.r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - c.r;
  }
  if (c.k === "cyl") { const dx = Math.hypot(x, z) - c.rad, dy = Math.abs(y) - c.hl; return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)); }
  return Math.hypot(x, y, z) - c.rad;
}
function propRefresh(P) {
  P.g.updateWorldMatrix(true, true);
  for (const c of P.parts) { c.inv.copy(c.node.matrixWorld).invert(); const e = c.node.matrixWorld.elements; c.sc = Math.hypot(e[0], e[1], e[2]); }
}
function propSDF(P, v) { let d = 1e9; for (const c of P.parts) { _ge.copy(v).applyMatrix4(c.inv); const s = partSDF(c, _ge.x, _ge.y, _ge.z) * c.sc; if (s < d) d = s; } return d; }
function placeProp(P, pos, quat) {                                               // a world pose, whatever the prop's parent is
  const par = P.g.parent; par.updateWorldMatrix(true, false);
  P.g.position.copy(pos); par.worldToLocal(P.g.position);
  par.getWorldQuaternion(_gq2); P.g.quaternion.copy(_gq2.invert()).multiply(quat);
  P.g.visible = true; P.seen = GRIP.frame;
}
const qEuler = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
const qLook = (fwd, up) => { const z = fwd.clone().normalize(), x = new THREE.Vector3().crossVectors(up, z).normalize(), y = new THREE.Vector3().crossVectors(z, x); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };   // +z of the object toward fwd

// ---- arms: one small adapter per kind of rig, so a grip does not care whose arm it is ----
// The rigged figures (Buloy, the rider, the professor): yaw at the shoulder, pitch, elbow. Solved exactly for the wrist, not searched.
function ikRigExact(arm, s, T) {
  const L = 0.27, F = 0.25, tx = T.x - s * 0.204, ty = T.y - arm.yaw.position.y, tz = T.z;
  let best = null;
  for (const sg of [1, -1]) {
    const hz = sg * Math.hypot(tx, tz), d = Math.hypot(ty, hz) || 1e-6, dc = Math.min(Math.max(d, Math.abs(L - F) + 0.01), L + F - 0.002);
    const yy = ty * dc / d, zz = hz * dc / d;
    let a = Math.atan2(sg * tx, sg * tz);
    const c = -Math.acos(Math.min(1, Math.max(-1, (dc * dc - L * L - F * F) / (2 * L * F))));
    let b = Math.atan2(-zz, -yy) - Math.atan2(F * Math.sin(c), L + F * Math.cos(c));
    while (b > 0.9) b -= Math.PI * 2; while (b < -Math.PI * 2 + 0.9) b += Math.PI * 2;
    const ac = Math.min(1.75, Math.max(-1.75, a)), bc = Math.min(0.9, Math.max(-3.5, b));
    const cost = Math.abs(a - ac) * 3 + Math.abs(b - bc) * 3 + Math.abs(d - dc) * 4 + (sg < 0 ? 0.02 : 0);
    if (!best || cost < best[0]) best = [cost, ac, bc, c];
  }
  arm.yaw.rotation.y = best[1]; arm.sh.rotation.set(best[2], 0, 0); arm.el.rotation.set(best[3], 0, 0);
}
function armRig(rig, s, who) {
  const arm = s > 0 ? rig.armL : rig.armR;
  return { who: who || rig.who || "?", s, hand: arm.hand, H: arm.H, fore: arm.el, foreLen: 0.25, foreR: 0.05,
    ik(w) { rig.vUpper.updateWorldMatrix(true, false); ikRigExact(arm, s, rig.vUpper.worldToLocal(_gd.copy(w))); } };
}
function armNena(nArm, who) {
  return { who: who || "nena", s: nArm.s, hand: nArm.hand, H: nArm.H, fore: nArm.fore, foreLen: 0.235, foreR: 0.03,
    ik(w) { nenaUp.updateWorldMatrix(true, false); solveNenaArm(nArm, w, 1, nArm.up.quaternion, nArm.fore.quaternion); } };
}
function handQuatWorld(hand, q, w = 1) { hand.parent.updateWorldMatrix(true, false); hand.parent.getWorldQuaternion(_gq2); _gq.copy(_gq2.invert()).multiply(q); if (w >= 1) hand.quaternion.copy(_gq); else hand.quaternion.slerp(_gq, w); }

// ---- where the wrist goes for a socket ----
function socketOf(P, G) { const s = P.sockets[G.sk]; if (!s) throw new Error("no socket " + G.sk + " on " + P.name); return typeof s === "function" ? s(G.A.H, G) : s; }
function socketWrist(P, S, H, out) {
  const m = P.g.matrixWorld;
  const z = _ga.copy(S.n).transformDirection(m), y = _gb.copy(S.f).transformDirection(m).negate();
  y.addScaledVector(z, -y.dot(z)).normalize();
  const x = _gc.crossVectors(y, z), an = S.anchor || [0, HD.palmY];
  out.quat.setFromRotationMatrix(_gM.makeBasis(x, y, z));
  out.pos.copy(S.p).applyMatrix4(m).addScaledVector(z, (S.depth ?? HD.palm[2] / 2) * H.sc + (S.lift ?? GRIP.skin)).addScaledVector(x, -an[0] * H.sx).addScaledVector(y, -an[1] * H.sc);
  return out;
}

// ---- fingers: close each joint against the colliders until the pad touches ----
const boxPts = (h, r) => { const o = []; for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) for (const c of [-1, 0, 1]) { const n = Math.abs(a) + Math.abs(b) + Math.abs(c); if (!n) continue; const k = n === 3 ? r * 0.42 : n === 2 ? r * 0.29 : 0; o.push([a * (h[0] - k), b * (h[1] - k), c * (h[2] - k)]); } return o; };
const TB_PTS = [boxPts(HD.tbs[0].map((v) => v / 2), 0.007), boxPts(HD.tbs[1].map((v) => v / 2), 0.006)];
function solveFingers(H, props, S, g, rootW) {                                    // rootW: solve as if the hand's root were there (the open pose a hand arrives with)
  const skin = GRIP.skin, sc = H.sc, parts = [];
  for (const P of props) for (const c of P.parts) parts.push([c, new THREE.Matrix4().multiplyMatrices(c.inv, rootW || H.root.matrixWorld).elements]);
  const sdf = (x, y, z) => { let d = 1e9; for (const [c, e] of parts) { const v = partSDF(c, e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]) * c.sc; if (v < d) d = v; } return d; };
  // least distance from finger i (segments `from` and beyond, the ones a turning joint moves) to the props, at joint angles a
  const fmin = (i, a, from) => {
    let y = HD.rootY, z = 0, th = 0, m = 1e9; const x0 = fingerX(H.s, i), wk = i === 3 ? 0.88 : 1;
    for (let j = 0; j < 3; j++) {
      th += a[j]; const len = HD.len[i] * HD.frac[j], dy = -Math.cos(th), dz = -Math.sin(th), ny = Math.sin(th), nz = -Math.cos(th), hw = HD.wd[j] * wk / 2 - 0.002, ht = HD.th[j] / 2, rl = HD.wd[j] * wk / 2;
      if (j >= from) for (let u = 0; u <= 5; u++) {
        const cy = y + dy * len * u / 5, cz = z + dz * len * u / 5;
        m = Math.min(m, sdf(x0 - hw, cy + ny * ht, cz + nz * ht), sdf(x0, cy + ny * ht, cz + nz * ht), sdf(x0 + hw, cy + ny * ht, cz + nz * ht), sdf(x0, cy - ny * ht, cz - nz * ht), sdf(x0, cy, cz) - rl * sc);
      }
      y += dy * len; z += dz * len;
    }
    return m;
  };
  const closeJ = (i, a, j, to) => {                                               // turn joint j toward `to` until first touch; true if it touched
    if (fmin(i, a, j) <= skin) return true;
    const from = a[j], N = 20; let lo = from;
    for (let k = 1; k <= N; k++) {
      a[j] = from + (to - from) * k / N;
      if (fmin(i, a, j) <= skin) { let hi = a[j]; for (let b = 0; b < 7; b++) { const mid = (lo + hi) / 2; a[j] = mid; if (fmin(i, a, j) <= skin) hi = mid; else lo = mid; } a[j] = lo; return true; }
      lo = a[j];
    }
    return false;
  };
  const st = S.start || [0.02, 0.03, 0.03], to = S.to || [1.45, 1.6, 1.15], f = [], hit = [];
  for (let i = 0; i < 4; i++) {
    const a = st.slice(); let h = false;
    for (let j = 0; j < 3; j++) h = closeJ(i, a, j, st[j] + (to[j] - st[j]) * g) || h;
    f.push(a); hit.push(h);
  }
  for (let i = 0; i < 4; i++) if (!hit[i]) {                                      // a finger that met nothing follows its nearest neighbour that did
    let n = -1; for (let d = 1; d < 4 && n < 0; d++) for (const k of [i - d, i + d]) if (k >= 0 && k < 4 && hit[k]) { n = k; break; }
    if (n < 0) { f[i] = st.map((v, j) => v + ((S.idle || [0.35, 0.45, 0.3])[j] - v) * g); continue; }
    const tgt = f[n].slice(); let lo = 0, hi = 1; const at = (u) => st.map((v, j) => v + (tgt[j] - v) * u);
    if (fmin(i, at(1), 0) > skin) { f[i] = at(1); continue; }
    for (let b = 0; b < 7; b++) { const mid = (lo + hi) / 2; if (fmin(i, at(mid), 0) <= skin) hi = mid; else lo = mid; }
    f[i] = at(lo);
  }
  // the thumb: two boxes; it must also keep off the fingers
  const caps = [];
  for (let i = 0; i < 4; i++) { let y = HD.rootY, z = 0, th = 0; for (let j = 0; j < 3; j++) { th += f[i][j]; const len = HD.len[i] * HD.frac[j], y1 = y - Math.cos(th) * len, z1 = z - Math.sin(th) * len; caps.push([fingerX(H.s, i), y, z, y1, z1, HD.th[j] / 2]); y = y1; z = z1; } }
  const selfD = (px, py, pz) => { let m = 1e9; for (const c of caps) { const vy = c[3] - c[1], vz = c[4] - c[2], u = clamp01(((py - c[1]) * vy + (pz - c[2]) * vz) / (vy * vy + vz * vz)); m = Math.min(m, Math.hypot(px - c[0], py - c[1] - vy * u, pz - c[2] - vz * u) - c[5]); } return m * sc; };
  const M1 = new THREE.Matrix4(), M2 = new THREE.Matrix4(), T = new THREE.Matrix4(), v = new THREE.Vector3();
  const tmin = (rx, rz, rx2, only2) => {
    M1.makeRotationFromEuler(_gEu.set(rx, 0, rz, "XYZ")).setPosition(-H.s * HD.tb[0], HD.tb[1], HD.tb[2]);
    M2.copy(M1).multiply(T.makeRotationX(rx2).setPosition(0, -HD.tbs[0][1], 0));
    let m = 1e9;
    for (let k = only2 ? 1 : 0; k < 2; k++) for (const p of TB_PTS[k]) { v.set(p[0], p[1] - HD.tbs[k][1] / 2, p[2]).applyMatrix4(k ? M2 : M1); m = Math.min(m, sdf(v.x, v.y, v.z), selfD(v.x, v.y, v.z)); }
    return m;
  };
  const sweep = (fn, from, to) => {                                               // move a value from `from` toward `to` until first touch
    if (fn(from) <= skin) return null;
    const N = 24; let lo = from;
    for (let k = 1; k <= N; k++) { const x = from + (to - from) * k / N; if (fn(x) <= skin) { let hi = x; for (let b = 0; b < 7; b++) { const mid = (lo + hi) / 2; if (fn(mid) <= skin) hi = mid; else lo = mid; } return [lo, true]; } lo = x; }
    return [lo, false];
  };
  let rx = 0.15, rz = -H.s * 0.5, rx2 = 0.1, done = false;
  const tr = S.thumbRx || [1.8, 0], t2 = S.tb2 || [0.1, 1.05];
  if ((S.thumb || "oppose") === "oppose") {                                       // it starts on the far side of the prop and closes back onto it
    const sp0 = S.splay ?? 0.3;
    for (const sp of [sp0, sp0 + 0.3, sp0 - 0.3, sp0 + 0.6]) {
      const z = -H.s * sp, r = sweep((x) => tmin(x, z, t2[0]), tr[0], tr[0] + (tr[1] - tr[0]) * g);
      if (r && (r[1] || g < 0.999 || S.thumbFree)) { rx = r[0]; rz = z; done = true; break; }
    }
  }
  if (!done) { rz = -H.s * (S.splayFlat ?? 0.5); const r = sweep((x) => tmin(x, rz, 0.1), 0.02, 0.02 + 1.3 * g); rx = r ? r[0] : 0.02; }
  { const r = sweep((x) => tmin(rx, rz, x, true), t2[0], t2[0] + (t2[1] - t2[0]) * g); rx2 = r ? r[0] : t2[0]; }
  if (GRIP.debug) GRIP.notes.push(H.name + ' thumb rx ' + rx.toFixed(2) + ' rz ' + rz.toFixed(2) + ' rx2 ' + rx2.toFixed(2) + ' done ' + done + ' t18 ' + tmin(1.8, -H.s * (S.splay ?? 0.3), 0.1).toFixed(4) + ' t12 ' + tmin(1.2, -H.s * (S.splay ?? 0.3), 0.1).toFixed(4) + ' t06 ' + tmin(0.6, -H.s * (S.splay ?? 0.3), 0.1).toFixed(4) + ' f ' + JSON.stringify(f.map((a) => a.map((v) => +v.toFixed(2)))) + ' hit ' + hit);
  return { f, sp: 0, tb: [rx, 0, rz], tb2: rx2 };
}
const _gRoot = new THREE.Matrix4(), _gSc = new THREE.Vector3();

// ---- the frame API ----
GRIP.begin = () => { GRIP.frame++; GRIP.holds.length = 0; GRIP.notes.length = 0; };
function gripHide(P) { P.g.visible = false; }
function gripRest(P, pos, quat, on) { placeProp(P, pos, quat); P.state = "rest"; P.on = on || null; propRefresh(P); }
const _W = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
function gripHold(P, pos, quat, grips, o = {}) { placeProp(P, pos, quat); P.state = o.state || "held"; P.on = o.on || null; gripTouch(P, grips, o); }
function gripTouch(P, grips, o = {}) {                                             // hands to the sockets of a prop that stays where it is (a table, a podium, something already placed)
  P.g.updateWorldMatrix(true, true);
  const live = grips.filter((G) => G.w > 0.001);
  for (const G of live) { const h = G.A.hand; h.updateWorldMatrix(true, false); G.fp = h.getWorldPosition(new THREE.Vector3()); G.fq = h.quaternion.clone(); G.S = socketOf(P, G); G.g = G.g ?? 1; }
  const go = (G) => {
    const W = socketWrist(P, G.S, G.A.H, _W), h = G.A.hand;
    // the way in: first across to a point `clear` off the socket (turning as it goes, arcing if asked), then straight down the palm's normal onto it
    const u1 = smooth(Math.min(1, G.w / 0.7)), u2 = Math.max(0, (G.w - 0.7) / 0.3);
    _ga.copy(W.pos); if (G.w < 1) { _ga.addScaledVector(_gc.set(0, 0, 1).applyQuaternion(W.quat), (G.clear ?? 0.06) * (1 - u2)); _ga.lerp(G.fp, 1 - u1); _ga.y += (G.arc || 0) * Math.sin(Math.PI * u1); }
    G.A.ik(_ga);
    h.quaternion.copy(G.fq); handQuatWorld(h, W.quat, G.w < 1 ? u1 : 1);
    h.updateWorldMatrix(true, false);
    return h.getWorldPosition(_gb).sub(W.pos);
  };
  const car = o.carrier ?? -1, C0 = car >= 0 ? grips[car] : null;
  if (C0 && C0.w >= 0.999) {                                                       // the carried prop goes to where the carrying wrist really is
    const d = go(C0);
    if (d.lengthSq() > 1e-10) { P.g.getWorldPosition(_gc).add(d); P.g.parent.worldToLocal(_gc); P.g.position.copy(_gc); P.g.updateWorldMatrix(true, true); }
  }
  for (const G of live) if (G !== C0 || C0.w < 0.999) go(G);
  propRefresh(P);
  const obs = [P].concat(o.obstacles || []);
  for (const G of live) {
    const H = G.A.H, free = handFree(H); H.root.updateWorldMatrix(true, false);
    if (G.S.pose) H.pose = mixRaw(H, free, G.S.pose, smooth(Math.min(1, G.w / 0.7)));
    else if (G.w < 0.999) { socketWrist(P, G.S, H, _W); H.pose = mixRaw(H, free, solveFingers(H, obs, G.S, 0, _gRoot.compose(_W.pos, _W.quat, _gSc.set(H.sx, H.sc, H.sc))), smooth(Math.min(1, G.w / 0.7))); }   // it arrives open, in the pose that is clear at the socket
    else H.pose = solveFingers(H, obs, G.S, G.g);
    const old = GRIP.holds.findIndex((x) => x.P === P && x.A && x.A.H === H); if (old >= 0) GRIP.holds.splice(old, 1);          // a second pass on the same hand replaces the first
    GRIP.holds.push({ P, A: G.A, sk: G.sk, w: G.w, g: G.g, kind: G.S.pose ? "touch" : "hold", contact: G.contact });
  }
}
// Claude's nubs: boxes in his body's frame. Each is laid with a face flat on the prop at p (prop frame), on the side n points to.
const NUB_H = [0.06, 0.04, 0.05];
for (const a of cArms) a.geometry.userData.box = [0.06, 0.04, 0.05, 0.015];
function nubHold(P, list) {
  P.g.updateWorldMatrix(true, true); cBody.updateWorldMatrix(true, false);
  const sc = Math.hypot(cBody.matrixWorld.elements[0], cBody.matrixWorld.elements[1], cBody.matrixWorld.elements[2]);
  cBody.getWorldQuaternion(_gq); _gq2.copy(_gq).invert();
  for (const N of list) {
    if (N.w <= 0.001) continue;
    const n = _ga.copy(N.n).transformDirection(P.g.matrixWorld), nl = _gb.copy(n).applyQuaternion(_gq2);
    const ext = (Math.abs(nl.x) * NUB_H[0] + Math.abs(nl.y) * NUB_H[1] + Math.abs(nl.z) * NUB_H[2]) * sc;
    const c = _gc.copy(N.p).applyMatrix4(P.g.matrixWorld).addScaledVector(n, ext + GRIP.skin);
    cBody.worldToLocal(c); cArms[N.i].position.lerp(c, N.w);
    GRIP.holds.push({ P, nub: cArms[N.i], who: "claude", s: N.i ? 1 : -1, sk: "nub", w: N.w, g: N.w, kind: "nub" });
  }
}
// ---- who is who, for the QA report: heads and torsos a prop must not enter ----
function gripPerson(name, parts) { GRIP.people[name] = { name, ...parts }; for (const a of parts.arms || []) a.H.name = name + (a.s > 0 ? ".L" : ".R"); }
gripPerson("viron", { head: { node: vHead, c: [0, 0.135, 0], r: [0.088, 0.135, 0.098] }, torso: { node: vUpper, c: [0, 0.23, 0.005], r: [0.2, 0.3, 0.14] }, arms: [{ s: 1, H: armL.H, fore: armL.el, len: 0.25, rad: 0.05 }, { s: -1, H: armR.H, fore: armR.el, len: 0.25, rad: 0.05 }] });
gripPerson("claude", { head: { node: cBody, box: [0.24, 0.16, 0.12], c: [0, 0.16, 0] }, arms: [] });
gripPerson("nena", { head: { node: nenaHead, c: [0, 0.105, 0], r: [0.078, 0.11, 0.088] }, torso: { node: nenaUp, c: [0, 0.32, 0], r: [0.195, 0.34, 0.145] }, arms: [{ s: 1, H: nenaR.H, fore: nenaR.fore, len: 0.235, rad: 0.03 }, { s: -1, H: nenaL.H, fore: nenaL.fore, len: 0.235, rad: 0.03 }] });
function gripRigPerson(name, rig) { gripPerson(name, { head: { node: rig.vHead, c: [0, 0.135, 0], r: [0.088, 0.135, 0.098] }, torso: { node: rig.vUpper, c: [0, 0.23, 0.005], r: [0.2, 0.3, 0.14] }, arms: [{ s: 1, H: rig.armL.H, fore: rig.armL.el, len: 0.25, rad: 0.05 }, { s: -1, H: rig.armR.H, fore: rig.armR.el, len: 0.25, rad: 0.05 }] }); }
