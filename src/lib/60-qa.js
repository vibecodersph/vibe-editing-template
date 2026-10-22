// ---------- QA hook: measures every hand against every prop. Inert in a film; tools/qa.py calls window.__qa ----------
// Thresholds (metres unless said): a hand part may enter a prop by at most PEN; a full grip must have skin within GAP of the prop;
// a resting prop must lie within REST of what it rests on; a prop may enter a head or torso by at most BODY; a wrist may bend WRIST degrees;
// a forearm's core (0.6 of its radius; on a surface, its centre line: a sleeve lying on a table is cloth pressed flat) may enter a prop by FORE; a shown screen may have no sample covered by a hand that holds it.
// Solids (sets that list GRIP.movers): no mover (Buloy, Claude, an extra) may have a point of any shown mesh deeper than PEN inside a prop or surface, a box or body shape of another mover, or, for a person, hands and forearms deeper than BODY / FORE inside his own torso or head.
// Framing: a caption may not reach into the bottom fifth of the 1080 x 1920 frame (SAFE_Y) or the right eighth (SAFE_X); a shot that names a face
// ({ face: "viron" }) must keep that whole head inside the frame.
// Framing of the speaker (qaFrame, below), at every moment a caption shows: how much of the face box is in the frame and not hidden, the eyes, the eye line, the face height, the caption over the face,
// the face centre in the phone app's safe area (FR: below 250 px and above 1500 px; in the lower half of the frame left of 850 px); and the 180-degree rule between consecutive singles (qaFlips).
const QA = { PEN: 0.003, GAP: 0.004, REST: 0.006, BODY: 0.005, WRIST: 80, FORE: 0.01, SAFE_Y: 1536, SAFE_X: 945 };
const FR = { AWAY_DEG: 80, VIS: 0.8, CAP_OVER: 0.1, TOP: 250, BOTTOM: 1500, HALF: 960, RIGHT_LOW: 850, EYE_LO: 0.2, EYE_HI: 0.6, FACE_MIN: 0.08 };
const _qv = new THREE.Vector3(), _qv2 = new THREE.Vector3(), _qm = new THREE.Matrix4(), _qray = new THREE.Raycaster();
function qaPartPts(c) {                                                           // points on a collider's surface, in its own frame (cached)
  if (c.pts) return c.pts;
  const o = [], N = 6;
  if (c.k === "box") { for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const p = [0, 0, 0], a1 = (ax + 1) % 3, a2 = (ax + 2) % 3, e1 = Math.abs(i * 2 - N) === N, e2 = Math.abs(j * 2 - N) === N, k = c.r * (e1 && e2 ? 0.42 : e1 || e2 ? 0.29 : 0); p[ax] = sg * (c.h[ax] - k); p[a1] = (i / N * 2 - 1) * (c.h[a1] - (e1 ? k : 0)); p[a2] = (j / N * 2 - 1) * (c.h[a2] - (e2 ? k : 0)); o.push(p); } }
  else if (c.k === "cyl") { for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; for (let j = 0; j <= 4; j++) o.push([Math.cos(a) * c.rad, (j / 4 * 2 - 1) * c.hl, Math.sin(a) * c.rad]); for (const sg of [-1, 1]) o.push([Math.cos(a) * c.rad * 0.5, sg * c.hl, Math.sin(a) * c.rad * 0.5]); } o.push([0, c.hl, 0], [0, -c.hl, 0]); }
  else for (let i = 0; i < 8; i++) for (let j = 0; j <= 4; j++) { const a = i / 8 * 6.2832, b = j / 4 * Math.PI; o.push([Math.sin(b) * Math.cos(a) * c.rad, Math.cos(b) * c.rad, Math.sin(b) * Math.sin(a) * c.rad]); }
  return (c.pts = o.map((p) => [p[0] + c.c[0], p[1] + c.c[1], p[2] + c.c[2]]));
}
function qaPropPts(P) { const o = []; for (const c of P.parts) for (const p of qaPartPts(c)) o.push(new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(c.node.matrixWorld)); return o; }
const qaShown = (o) => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; };
function qaSolidMeshes(root) { const o = []; root.traverse((m) => { if (m.isMesh && m.geometry.userData.box) o.push(m); }); return o; }
// least signed distance between a set of solid boxes (hand parts or a nub) and a prop, both ways: their vertices against the prop, the prop's points against them
function qaDist(meshes, P, pts) {
  let d = 1e9;
  for (const m of meshes) {
    const pos = m.geometry.attributes.position, b = m.geometry.userData.box, e = m.matrixWorld.elements, sc = Math.hypot(e[4], e[5], e[6]);
    for (let i = 0; i < pos.count; i++) { _qv.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); const s = propSDF(P, _qv); if (s < d) d = s; }
    _qm.copy(m.matrixWorld).invert();
    for (const p of pts) { _qv.copy(p).applyMatrix4(_qm); const qx = Math.abs(_qv.x) - (b[0] - b[3]), qy = Math.abs(_qv.y) - (b[1] - b[3]), qz = Math.abs(_qv.z) - (b[2] - b[3]); const s = (Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - b[3]) * sc; if (s < d) d = s; }
  }
  return d;
}
function qaBodySDF(B, v) {
  _qv2.copy(v).applyMatrix4(_qm.copy(B.node.matrixWorld).invert()); const x = _qv2.x - B.c[0], y = _qv2.y - B.c[1], z = _qv2.z - B.c[2];
  const e = B.node.matrixWorld.elements, sc = Math.hypot(e[4], e[5], e[6]);
  if (B.box) { const qx = Math.abs(x) - B.box[0], qy = Math.abs(y) - B.box[1], qz = Math.abs(z) - B.box[2]; return (Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0)) * sc; }
  return (Math.hypot(x / B.r[0], y / B.r[1], z / B.r[2]) - 1) * Math.min(B.r[0], B.r[1], B.r[2]) * sc;
}
// ---- solids: nothing that moves goes through anything that stands, or through another figure, or through its own body ----
const _qa1 = new THREE.Vector3(), _qa2 = new THREE.Vector3(), _qaP = new THREE.Vector3(), _qaQ = new THREE.Quaternion(), _qaS = new THREE.Vector3(), _qaM = new THREE.Matrix4();
function qaBoxGrid(h, N, out) { for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const p = [0, 0, 0], a1 = (ax + 1) % 3, a2 = (ax + 2) % 3; p[ax] = sg * h[ax]; p[a1] = (i / N * 2 - 1) * h[a1]; p[a2] = (j / N * 2 - 1) * h[a2]; out.push(p[0], p[1], p[2]); } }
function qaMoverParts(M) {                                                         // every mesh of a mover with its vertices in its own frame (a mesh of over 500 vertices is thinned; a plain box gets a grid on each face)
  if (M.parts) return M.parts;
  M.parts = []; M.boxes = [];
  M.root.traverse((m) => {
    if (!m.isMesh || !m.geometry.attributes.position || !m.material || m.material.opacity < 0.1) return;
    const g = m.geometry, pos = g.attributes.position, k = Math.max(1, Math.ceil(pos.count / 500)), a = [];
    if (/^(Capsule|Tube|Torus)Geometry$/.test(g.type)) { if (!g.boundingBox) g.computeBoundingBox(); const e = g.boundingBox.getSize(_qaP).multiply(m.scale).toArray().sort((x, y) => x - y); if (e[1] < 0.02) return; }   // a drawstring, an aglet, an eyelet: cloth trim thinner than two centimetres hangs and drapes, it is not tested (hands have their own exact check)
    for (let i = 0; i < pos.count; i += k) a.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    const b = g.userData.box ? g.userData.box.slice(0, 3) : g.type === "BoxGeometry" ? [g.parameters.width / 2, g.parameters.height / 2, g.parameters.depth / 2] : null;
    if (g.type === "BoxGeometry") qaBoxGrid(b, 4, a);
    M.parts.push({ m, a });
    if (b) M.boxes.push({ m, b, r0: g.userData.box ? g.userData.box[3] : 0, h: [0, 0, 0], r: 0, inv: new THREE.Matrix4() });
  });
  return M.parts;
}
function qaMoverPts(M) { const out = []; for (const { m, a } of qaMoverParts(M)) { if (!qaShown(m)) continue; for (let i = 0; i < a.length; i += 3) out.push(new THREE.Vector3(a[i], a[i + 1], a[i + 2]).applyMatrix4(m.matrixWorld)); } return out; }
function qaMoverSDF(M, v) {                                                        // signed distance from a world point to the mover's solid shapes: its boxes, and its person's head and torso
  let d = 1e9;
  for (const x of M.boxes) { if (!x.shown) continue; _qa1.copy(v).applyMatrix4(x.inv); const qx = Math.abs(_qa1.x) - (x.h[0] - x.r), qy = Math.abs(_qa1.y) - (x.h[1] - x.r), qz = Math.abs(_qa1.z) - (x.h[2] - x.r); const s = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - x.r; if (s < d) d = s; }
  const P = M.person && GRIP.people[M.person]; if (P) for (const part of ["head", "torso"]) { const B = P[part]; if (B && qaShown(B.node)) d = Math.min(d, qaBodySDF(B, v)); }
  return d;
}
function qaSolids(fail, props, mm) {
  const rows = [], ms = GRIP.movers.filter((M) => qaShown(M.root));
  for (const M of ms) { qaMoverParts(M); for (const x of M.boxes) { x.shown = qaShown(x.m); if (x.shown) { x.m.matrixWorld.decompose(_qaP, _qaQ, _qaS); x.inv.compose(_qaP, _qaQ, _qaS.set(1, 1, 1)).invert(); x.m.matrixWorld.decompose(_qaP, _qaQ, _qaS); x.h = [x.b[0] * _qaS.x, x.b[1] * _qaS.y, x.b[2] * _qaS.z]; x.r = x.r0 * (_qaS.x + _qaS.y + _qaS.z) / 3; } } M.pts = qaMoverPts(M); }
  // movers against props and surfaces
  for (const M of ms) for (const P of props) {
    const bb = new THREE.Box3().setFromPoints(P._pts).expandByScalar(0.03); let d = 1e9, at = null;
    for (const p of M.pts) if (bb.containsPoint(p)) for (const c of P.parts) { _qa1.copy(p).applyMatrix4(c.inv); const s = partSDF(c, _qa1.x, _qa1.y, _qa1.z) * c.sc; if (s < d) { d = s; at = c; } }
    const nm = P.name + (at && at.name ? "." + at.name : "");
    if (d < 0) rows.push({ hand: M.name, prop: nm, kind: "solid", sk: "", w: 0, g: 0, pen: mm(-d), gap: 0, full: false });
    if (-d > QA.PEN) fail(M.name + " goes through " + nm + " by " + mm(-d) + " mm");
  }
  // movers against each other
  for (let i = 0; i < ms.length; i++) for (let j = 0; j < ms.length; j++) {
    if (i === j) continue; const A = ms[i], B = ms[j]; if (!B.boxes.length && !B.person) continue;
    const ba = new THREE.Box3().setFromPoints(A.pts), bbb = new THREE.Box3().setFromPoints(B.pts); if (!ba.intersectsBox(bbb)) continue;
    let d = 1e9; for (const p of A.pts) if (bbb.containsPoint(p)) d = Math.min(d, qaMoverSDF(B, p));
    if (-d > QA.PEN) { rows.push({ hand: A.name, prop: B.name, kind: "solid", sk: "", w: 0, g: 0, pen: mm(-d), gap: 0, full: false }); fail(A.name + " goes through " + B.name + " by " + mm(-d) + " mm"); }
  }
  // props against props they do not rest on
  const loose = props.filter((P) => !P.surface);
  for (const A of loose) for (const B of props) {
    if (A === B || A.on === B || B.on === A || (!B.surface && props.indexOf(B) < props.indexOf(A))) continue;
    let d = 1e9; for (const p of A._pts) d = Math.min(d, propSDF(B, p)); for (const p of B._pts) d = Math.min(d, propSDF(A, p));
    if (-d > QA.PEN) { rows.push({ hand: A.name, prop: B.name, kind: "solid", sk: "", w: 0, g: 0, pen: mm(-d), gap: 0, full: false }); fail(A.name + " goes through " + B.name + " by " + mm(-d) + " mm"); }
  }
  // a person's hands and forearms against his own head and torso
  for (const k in GRIP.people) {
    const P = GRIP.people[k]; if (!P.torso || !qaShown(P.torso.node) || !ms.some((M) => M.person === k)) continue;
    for (const a of P.arms || []) if (qaShown(a.H.root)) for (const part of ["torso", "head"]) {
      const B = P[part]; if (!B || !qaShown(B.node)) continue; let dh = 1e9, df = 1e9;
      for (const m of qaSolidMeshes(a.H.root)) { const pos = m.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { _qa2.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); dh = Math.min(dh, qaBodySDF(B, _qa2)); } }
      for (let u = 0; u <= 6; u++) { _qa2.set(0, -(a.len - 0.05) * u / 6, 0).applyMatrix4(a.fore.matrixWorld); df = Math.min(df, qaBodySDF(B, _qa2)); }
      if (-dh > QA.BODY) fail(a.H.name + " goes through " + k + "'s " + part + " by " + mm(-dh) + " mm");
      if (-df > QA.FORE) fail(a.H.name + " forearm goes through " + k + "'s " + part + " by " + mm(-df) + " mm");
    }
  }
  return rows;
}
function qaFrame(t, cut, cap, capOut) {                                           // the speaker's framing at this moment; null when the speaker is not Buloy, Claude or Aling Nena
  const who = CINE.canon(cap.who); if (!who) return null;
  const S = CINE.subject(who), cam = CINE.camOf(cut), type = cam ? cam.spec.type : null, W = 1080, H = 1920, fails = [], warns = [];
  const out = { t: +t.toFixed(3), who, shot: cut.shot, type, fails, warns };
  if (!qaShown(S.root)) { fails.push("the speaker " + who + " is not shown"); out.vis = 0; return out; }
  camera.updateMatrixWorld(true);
  const meshes = CINE.solidMeshes(), near = camera.near;
  const turn = Math.acos(Math.max(-1, Math.min(1, S.gaze.dot(camera.position.clone().sub(S.eye).normalize())))) * 180 / Math.PI, away = turn > FR.AWAY_DEG;      // the rays skip the subject's own meshes, so the back of a head would read as seen: a face more than 80 degrees off the way to the lens is turned away
  out.turn = Math.round(turn);
  const scr = (p) => { const c = p.clone().applyMatrix4(camera.matrixWorldInverse); if (c.z > -0.01) return null; const n = p.clone().project(camera); return { x: (n.x + 1) / 2, y: (1 - n.y) / 2 }; };
  const inF = (q) => !!q && q.x >= 0 && q.x <= 1 && q.y >= 0 && q.y <= 1;
  const hid = (p) => { const q = scr(p); return away || !inF(q) || CINE.occluded(camera.position, p, meshes, [S.root], near); };
  const b = S.lface; let seen = 0, tot = 0;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { tot++; if (!hid(S.node.localToWorld(new THREE.Vector3((i / 4 * 2 - 1) * b[0], b[1] + (j / 4) * (b[2] - b[1]), b[4] - 0.012)))) seen++; }
  out.vis = +(seen / tot).toFixed(2);
  const eh = S.eyes.map(hid); out.eyesHidden = eh;
  const qe = S.eyes.map(scr).filter(Boolean), qc = scr(S.crown), qn = scr(S.chin);
  out.eyeLine = qe.length ? +(qe.reduce((a, q) => a + q.y, 0) / qe.length).toFixed(3) : null;
  out.faceH = qc && qn ? +Math.abs(qc.y - qn.y).toFixed(3) : null;
  const cs = S.lface === S.lbox ? S.box.map(scr).filter(Boolean) : CINE.faceCorners(S).map(scr).filter(Boolean); let rect = null;
  if (cs.length) { const x0 = Math.max(0, Math.min(...cs.map((q) => q.x))) * W, x1 = Math.min(1, Math.max(...cs.map((q) => q.x))) * W, y0 = Math.max(0, Math.min(...cs.map((q) => q.y))) * H, y1 = Math.min(1, Math.max(...cs.map((q) => q.y))) * H; if (x1 > x0 && y1 > y0) rect = { x0, x1, y0, y1 }; }
  out.face = rect && { x0: Math.round(rect.x0), x1: Math.round(rect.x1), y0: Math.round(rect.y0), y1: Math.round(rect.y1) };
  out.eyePx = S.eyes.map((e) => { const q = scr(e); return q && [Math.round(q.x * W), Math.round(q.y * H)]; });
  out.centre = rect ? [Math.round((rect.x0 + rect.x1) / 2), Math.round((rect.y0 + rect.y1) / 2)] : null;
  if (capOut) {                                                                    // the caption box as the page draws it: 900 px wide at most, centred, rows of 68.5 px
    const rows = CINE.capLines(cap.text), w = Math.min(900, Math.max(...rows.map((r) => r.length)) * 29.5), cr = { x0: 540 - w / 2, x1: 540 + w / 2, y0: capOut.top, y1: capOut.top + rows.length * 68.5 + 6 };
    out.cap = { x0: Math.round(cr.x0), x1: Math.round(cr.x1), y0: Math.round(cr.y0), y1: Math.round(cr.y1) };
    if (rect) { const ox = Math.max(0, Math.min(cr.x1, rect.x1) - Math.max(cr.x0, rect.x0)), oy = Math.max(0, Math.min(cr.y1, rect.y1) - Math.max(cr.y0, rect.y0)); out.capOver = +(ox * oy / ((rect.x1 - rect.x0) * (rect.y1 - rect.y0))).toFixed(3); }
    out.capOnEye = out.eyePx.some((e) => e && e[0] > cr.x0 - 8 && e[0] < cr.x1 + 8 && e[1] > cr.y0 - 8 && e[1] < cr.y1 + 8);
    if (out.capOver > FR.CAP_OVER) fails.push("the caption covers " + Math.round(out.capOver * 100) + " percent of the face box");
    if (out.capOnEye) fails.push("the caption is over an eye");
    if (cr.y1 > FR.BOTTOM || cr.y0 < FR.TOP) warns.push("the caption box (" + Math.round(cr.y0) + " to " + Math.round(cr.y1) + " px) is outside " + FR.TOP + " to " + FR.BOTTOM);
  }
  if (away) fails.push("the speaker is turned away: his face looks " + out.turn + " degrees off the lens (limit " + FR.AWAY_DEG + ")");
  if (out.vis < FR.VIS) fails.push("the speaker is " + Math.round(out.vis * 100) + " percent visible (under " + FR.VIS * 100 + ")");
  if (eh.every(Boolean)) fails.push("both eyes of the speaker are hidden or out of frame");
  if (!out.centre || out.centre[1] < FR.TOP || out.centre[1] > FR.BOTTOM || (out.centre[1] > FR.HALF && out.centre[0] > FR.RIGHT_LOW) || out.centre[0] < 0 || out.centre[0] > W) fails.push("the face centre " + (out.centre ? out.centre.join(", ") : "off screen") + " is outside the phone app's safe area (" + FR.TOP + " to " + FR.BOTTOM + " px, left of " + FR.RIGHT_LOW + " px in the lower half)");
  const single = type ? CINE.SINGLES.indexOf(type) >= 0 : (out.faceH !== null && out.faceH >= 0.12);
  if (single && out.eyeLine !== null && (out.eyeLine < FR.EYE_LO || out.eyeLine > FR.EYE_HI)) warns.push("the eye line is at " + out.eyeLine.toFixed(2) + " of the frame height (wanted " + FR.EYE_LO + " to " + FR.EYE_HI + ")");
  if (out.faceH !== null && out.faceH < FR.FACE_MIN && type !== "ws" && type !== "two") warns.push("the face is " + out.faceH.toFixed(3) + " of the frame height while speaking (under " + FR.FACE_MIN + ")");
  return out;
}
function qaFlips() {                                                              // the 180-degree rule: in consecutive singles the speakers face opposite ways on the screen; a flip needs "flip": true on the shot
  const out = []; let prev = null;
  for (const c of TL.shots) {
    const cam = c.marker ? null : CINE.camOf(c); if (!cam || cam.spec.type === "pov" || CINE.SINGLES.indexOf(cam.spec.type) < 0 || !cam.spec.who) continue;
    renderAt(c.t + 0.05); camera.updateMatrixWorld(true);
    const S = CINE.subject(cam.spec.who), a = S.eye.clone().project(camera), g = S.eye.clone().addScaledVector(S.fwd, 0.3).project(camera), sign = Math.sign(g.x - a.x) || 1, frontal = S.fwd.dot(camera.position.clone().sub(S.eye).setY(0).normalize()) > Math.cos(10 * Math.PI / 180), cur = { t: +c.t.toFixed(2), shot: c.shot, who: S.who, sign, flip: !!cam.spec.flip };
    if (prev && !frontal && !cur.flip && !prev.flip && ((prev.who !== cur.who && prev.sign === cur.sign) || (prev.who === cur.who && prev.sign !== cur.sign))) out.push({ t: cur.t, shot: cur.shot, prev: prev.shot, msg: (prev.who === cur.who ? "the same speaker looks the other way" : "both look " + (sign > 0 ? "right" : "left")) + " on the screen between " + prev.shot + " (" + prev.t + ") and " + cur.shot + " (" + cur.t + ") without flip: true" });
    if (!frontal) prev = cur;                                                      // a gaze straight into the lens (a look: "lens") has no screen direction to break
  }
  return out;
}
function qaMeasure(t) {
  scene.updateMatrixWorld(true);
  const mm = (v) => Math.round(v * 10000) / 10, rows = [], fails = [], props = GRIP.props.filter((P) => qaShown(P.g));
  for (const P of props) { propRefresh(P); P._pts = qaPropPts(P); }
  const fail = (s) => fails.push(s);
  // hands
  const hands = [];
  for (const k in GRIP.people) for (const a of GRIP.people[k].arms || []) if (qaShown(a.H.root)) hands.push({ name: a.H.name, H: a.H, a, meshes: qaSolidMeshes(a.H.root), pos: a.H.root.getWorldPosition(new THREE.Vector3()) });
  for (const h of hands) for (const P of props) {
    if (propSDF(P, h.pos) > 0.3) continue;
    const hold = GRIP.holds.find((x) => x.P === P && x.A && x.A.H === h.H), d = qaDist(h.meshes, P, P._pts), pen = Math.max(0, -d), gap = Math.max(0, d);
    if (!hold && d > 0.02) continue;
    const row = { hand: h.name, prop: P.name, kind: hold ? hold.kind : "near", sk: hold ? hold.sk : "", w: hold ? +hold.w.toFixed(2) : 0, g: hold ? +hold.g.toFixed(2) : 0, pen: mm(pen), gap: mm(gap), full: !!hold && hold.w >= 0.999 && hold.g >= 0.999 };
    if (pen > QA.PEN) fail(h.name + " enters " + P.name + " by " + mm(pen) + " mm");
    if (hold) {
      const full = hold.w >= 0.999 && hold.g >= 0.999;
      if (hold.kind === "hold" && full && gap > QA.GAP) fail(h.name + " grips " + P.name + "." + hold.sk + " but is " + mm(gap) + " mm off it");
      if (hold.kind === "touch" && hold.contact && gap > QA.GAP) fail(h.name + " should touch " + P.name + " but is " + mm(gap) + " mm off it");
      hold.touching = full && gap <= QA.GAP;
      if (full) {                                                                 // the wrist, and the forearm behind it
        const f = _qv.set(0, -1, 0).transformDirection(h.a.fore.matrixWorld).clone(), y = _qv2.set(0, -1, 0).transformDirection(h.H.root.matrixWorld);
        row.wrist = Math.round(Math.acos(Math.min(1, Math.max(-1, f.dot(y)))) * 57.3);
        if (row.wrist > QA.WRIST) fail(h.name + " wrist bends " + row.wrist + " deg holding " + P.name);
      }
    }
    let fp = 0; for (let u = 0; u <= 6; u++) { _qv.set(0, -(h.a.len - 0.05) * u / 6, 0).applyMatrix4(h.a.fore.matrixWorld); fp = Math.max(fp, (P.surface ? 0 : h.a.rad * 0.6) - propSDF(P, _qv)); }   // on a table a sleeve may lie and press flat: only its centre line must stay out
    if (fp > QA.FORE) { row.fore = mm(fp); fail(h.name + " forearm enters " + P.name + " by " + mm(fp) + " mm"); }
    rows.push(row);
  }
  // Claude's nubs
  for (const hold of GRIP.holds) if (hold.nub) {
    const d = qaDist([hold.nub], hold.P, hold.P._pts || []), pen = Math.max(0, -d), gap = Math.max(0, d), full = hold.w >= 0.999;
    rows.push({ hand: "claude.nub" + (hold.s > 0 ? "L" : "R"), prop: hold.P.name, kind: "nub", sk: "", w: +hold.w.toFixed(2), g: +hold.g.toFixed(2), pen: mm(pen), gap: mm(gap), full });
    if (pen > QA.PEN) fail("claude nub enters " + hold.P.name + " by " + mm(pen) + " mm");
    if (full && gap > QA.GAP) fail("claude nub holds " + hold.P.name + " but is " + mm(gap) + " mm off it");
    hold.touching = full && gap <= QA.GAP;
    _qv.copy(hold.nub.position); const off = Math.hypot(Math.abs(_qv.x) - 0.28, _qv.y - 0.13, _qv.z);
    if (off > 0.36) fail("claude nub is " + mm(off) / 10 + " cm from its shoulder");
  }
  // props: owned or resting, clear of heads and torsos, opaque, the shown screen clear
  const state = [];
  for (const P of props) {
    if (P.surface) continue;
    const st = { prop: P.name, state: P.state };
    if (P.seen !== GRIP.frame) fail(P.name + " is visible but nobody placed it this frame");
    if (P.state === "held") { st.by = GRIP.holds.filter((x) => x.P === P && x.touching).map((x) => (x.A ? x.A.H.name : "claude.nub")).join("+"); if (!st.by) fail(P.name + " is held but no hand is on it"); }
    if (P.state === "rest" || P.on) {
      if (!P.on) { if (P.state === "rest") fail(P.name + " rests on nothing"); }
      else { let d = 1e9; for (const p of P._pts) d = Math.min(d, propSDF(P.on, p)); if (!P.on._pts) { propRefresh(P.on); P.on._pts = qaPropPts(P.on); } for (const p of P.on._pts) d = Math.min(d, propSDF(P, p)); st.on = P.on.name; st.rest = mm(d); if (d > QA.REST) fail(P.name + " floats " + mm(d) + " mm above " + P.on.name); if (d < -QA.BODY) fail(P.name + " sinks " + mm(-d) + " mm into " + P.on.name); }
    }
    for (const k in GRIP.people) for (const part of ["head", "torso"]) { const B = GRIP.people[k][part]; if (!B || !qaShown(B.node)) continue; let d = 1e9; for (const p of P._pts) d = Math.min(d, qaBodySDF(B, p)); if (d < -QA.BODY) { st[k + "." + part] = mm(-d); fail(P.name + " enters " + k + "'s " + part + " by " + mm(-d) + " mm"); } }
    P.g.traverse((m) => { if (m.isMesh && (m.material.transparent || m.material.opacity < 1 || m.material.blending !== THREE.NormalBlending)) fail(P.name + " has a see-through material"); });
    if (P.shown) for (const S of P.screens) {
      const n = _qv.set(0, 0, 1).transformDirection(S.node.matrixWorld).clone(), c = S.node.getWorldPosition(new THREE.Vector3());
      if (n.dot(_qv2.copy(camera.position).sub(c).normalize()) < 0.15) continue;
      const blockers = []; for (const x of GRIP.holds) if (x.P === P) { if (x.A) x.A.H.root.traverse((m) => m.isMesh && blockers.push(m)); else blockers.push(x.nub); }
      let cov = 0, tot = 0;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) { const p = new THREE.Vector3((i / 4 - 0.5) * S.w * 0.96, (j / 8 - 0.5) * S.h * 0.96, 0).applyMatrix4(S.node.matrixWorld), dir = p.clone().sub(camera.position), L = dir.length(); _qray.set(camera.position, dir.normalize()); _qray.far = L - 0.001; tot++; if (_qray.intersectObjects(blockers, false).length) cov++; }
      st.screen = cov + "/" + tot; if (cov) fail(P.name + " screen is covered by the hand that holds it (" + cov + " of " + tot + " points)");
    }
    state.push(st);
  }
  for (const h of hands) h.H.root.traverse((m) => { if (m.isMesh && (m.material.transparent || m.material.blending !== THREE.NormalBlending)) fail(h.name + " has a see-through material"); });
  // anything translucent that belongs to a figure or a prop, close to a hand that is holding (spectacle glass, under a tenth opaque, is not a halo)
  const owned = (m) => { for (let n = m; n; n = n.parent) { if (n.userData.prop) return n.userData.prop.name; for (const k in GRIP.people) { const p = GRIP.people[k]; if ((p.torso && n === p.torso.node) || (p.head && n === p.head.node)) return k; } } return ""; };
  for (const x of GRIP.holds) if (x.A && x.w >= 0.999) {
    const hp = x.A.H.root.getWorldPosition(new THREE.Vector3());
    scene.traverseVisible((m) => { if (!m.isMesh || !(m.material.transparent && (m.material.opacity < 0.99 || m.material.blending !== THREE.NormalBlending))) return; if (m.material.opacity < 0.1) return; const who = owned(m); if (!who) return; if (m.getWorldPosition(_qv).distanceTo(hp) < 0.22) fail("a translucent part of " + who + " is within 22 cm of " + x.A.H.name); });
  }
  if (GRIP.movers.length) for (const r of qaSolids(fail, props, mm)) rows.push(r);
  // framing: the caption's band, and the head a shot promises to keep whole
  let cut = TL.shots[0]; for (const c of TL.shots) if (c.t <= t) cut = c;
  const sh = SHOTS[cut.shot] || SHOTS.hero, cap = (TL.capsQA || TL.caps || []).find((c) => t >= c.s && t < c.e), cined = !!CINE.camOf(cut);
  let capOut = null;
  if (cap) {
    const wrap = (ln) => { const o = []; let cur = ""; for (const tok of ln.match(/[^\s-]+-?\s*/g) || [""]) { if (cur && (cur + tok).trimEnd().length * 29.5 > 900) { o.push(cur.trimEnd()); cur = tok; } else cur += tok; } o.push(cur.trimEnd()); return o; };   // the page's caption box is 900 px wide and breaks after a space or a hyphen
    const lines = [].concat(...cap.text.split(String.fromCharCode(10)).map(wrap)), top = t >= END.s ? CARD_CAP_TOP : cined ? CINE.capTop(cut, cap) : (sh.cap || 470), bottom = top + lines.length * 68.5 + 6, wide = Math.max(...lines.map((l) => l.length)) * 29.5;
    capOut = { text: cap.text, top, who: cap.who };
    if (bottom > QA.SAFE_Y) fail("caption \"" + lines[0] + "\" in " + cut.shot + " ends at " + Math.round(bottom) + " px, inside the bottom fifth");
    if (540 + wide / 2 > QA.SAFE_X + 40) fail("caption \"" + lines[0] + "\" is about " + Math.round(wide) + " px wide and reaches the right eighth");
  }
  if (sh.face && GRIP.people[sh.face] && t - cut.t > 0.02) {
    const B = GRIP.people[sh.face].head, e = B.node.matrixWorld.elements, sc = Math.hypot(e[4], e[5], e[6]); let worst = 0;
    for (const d of [[0, 1.16, 0], [0, -0.85, 0], [1, 0, 0], [-1, 0, 0]]) { _qv.set(B.c[0] + d[0] * B.r[0], B.c[1] + d[1] * B.r[1], B.c[2]).applyMatrix4(B.node.matrixWorld).project(camera); worst = Math.max(worst, Math.abs(_qv.x), Math.abs(_qv.y)); }
    if (worst > 0.97) fail(sh.face + "'s head is cut by the frame edge in " + cut.shot);
  }
  return { t: +t.toFixed(3), rows, state, fails: [...new Set(fails)], notes: GRIP.notes.slice(), cap: capOut, frame: cap && t < END.s ? qaFrame(t, cut, cap, capOut) : null };      // over the closing card the caption takes the card's lane and the scene is faded: no face to measure
}
// a review camera: from where the shot camera stands, pushed in on a point until `rad` fills the frame; turn > 0 swings it round the point
function qaAim(c, rad, turn = 0, lift = 0, dir0) {
  const dir = dir0 ? dir0.clone() : camera.position.clone().sub(c); dir.normalize();
  if (turn) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), turn); if (lift) { dir.y += lift; dir.normalize(); }
  const D = rad * 11; camera.fov = 20; camera.near = Math.max(0.03, D - rad * 3.2); camera.position.copy(c).addScaledVector(dir, D); camera.updateProjectionMatrix(); camera.lookAt(c); sky.position.copy(camera.position);
  composer.render(); return canvas.toDataURL("image/png");
}
window.__qa = async function (cfg) {
  GRIP.debug = !!cfg.debug;
  const post = (path, body) => fetch(path, { method: "POST", body });
  try {
    const times = [], dur = TL.dur, add = (t, label, img, line) => times.push({ t: Math.max(0, Math.min(dur - 0.02, t)), label, img, line });
    TL.shots.forEach((c, i) => { if (!c.marker) add(c.t + 0.05, "cut" + String(i).padStart(2, "0") + "-" + c.shot.replace(/[^\w-]+/g, "_"), true); });
    TL.lines.forEach((l) => add((l.s + l.e) / 2, "line" + String(l.i).padStart(2, "0") + "-" + l.who, true, l));
    if (typeof SET !== "undefined" && SET.keys) for (const k of SET.keys()) add(k.t, "key-" + k.label, true);
    for (let t = 0; t < dur - 0.05; t += cfg.step || 0.25) add(t, "", false);
    if (cfg.only) { times.length = 0; for (const t of cfg.only) add(t, "at", true, TL.lines.find((l) => t >= l.s && t <= l.e)); }
    times.sort((a, b) => a.t - b.t);
    const frames = [], framed = new Set();
    for (const k of times) {
      renderAt(k.t); const m = qaMeasure(k.t); m.label = k.label; let cut = TL.shots[0]; for (const c of TL.shots) if (c.t <= k.t) cut = c; m.shot = cut.shot; frames.push(m);
      const fk = m.frame && m.frame.fails.concat(m.frame.warns).length ? cut.t + "|" + m.frame.who + "|" + (m.cap ? m.cap.text : "") : null;           // one picture for each shot and caption that has a framing problem
      if (fk && cfg.images !== false && !framed.has(fk)) { framed.add(fk); m.frame.img = "frame/" + k.t.toFixed(2).padStart(5, "0") + "-" + cut.shot.replace(/[^\w-]+/g, "_"); await post("/__qa/img?name=" + encodeURIComponent(m.frame.img), canvas.toDataURL("image/png")); }
      if (!k.img || cfg.images === false) continue;
      const tag = k.t.toFixed(2).padStart(5, "0") + "-" + k.label, camP = camera.position.clone(), shotDir = (c) => camP.clone().sub(c);
      if (cfg.full) await post("/__qa/img?name=" + encodeURIComponent("full/" + tag), canvas.toDataURL("image/png"));
      for (const P of GRIP.props) if (!P.surface && qaShown(P.g) && P.state === "held") {
        const c = new THREE.Box3().setFromObject(P.g).getCenter(new THREE.Vector3()), rad = Math.max(0.1, (P.rad || 0.12));
        await post("/__qa/img?name=" + encodeURIComponent("props/" + tag + "-" + P.name), qaAim(c, rad, 0, 0, shotDir(c)));
        if (cfg.orbit) { await post("/__qa/img?name=" + encodeURIComponent("orbit/" + tag + "-" + P.name + "-a"), qaAim(c, rad, 1.25, 0.25, shotDir(c))); await post("/__qa/img?name=" + encodeURIComponent("orbit/" + tag + "-" + P.name + "-b"), qaAim(c, rad, -1.9, -0.2, shotDir(c))); }
      }
      for (const x of GRIP.holds) if (x.A && x.w >= 0.999 && x.P.state !== "held" && (k.label.indexOf("key-") === 0 || k.label === "at")) {          // a hand on a surface or on something lying there
        const c = x.A.H.root.getWorldPosition(new THREE.Vector3());
        await post("/__qa/img?name=" + encodeURIComponent("hands/" + tag + "-" + x.A.H.name + "-" + x.P.name), qaAim(c, 0.15, 0, 0.35, shotDir(c)));
        if (cfg.orbit) await post("/__qa/img?name=" + encodeURIComponent("orbit/" + tag + "-" + x.A.H.name + "-" + x.P.name + "-a"), qaAim(c, 0.15, 1.3, 0.3, shotDir(c)));
      }
      if (k.line) { const p = GRIP.people[k.line.who], B = p && p.head; if (B && qaShown(B.node)) { const c = new THREE.Vector3(B.c[0], B.c[1], B.c[2]).applyMatrix4(B.node.matrixWorld), fwd = new THREE.Vector3(0, 0, 1).transformDirection(B.node.matrixWorld), d = shotDir(c).normalize().lerp(fwd, 0.6); await post("/__qa/img?name=" + encodeURIComponent("faces/" + tag), qaAim(c, B.box ? 0.3 : 0.17, 0, 0, d)); } }
    }
    await post("/__qa/report", JSON.stringify({ thresholds: QA, frame: FR, frames, flips: qaFlips(), cineWarnings: window.__cineWarnings || [] }));
  } catch (e) { await post("/__qa/report", JSON.stringify({ error: String((e && e.stack) || e) })); }
};
if (window.QA_CFG) window.__qa(window.QA_CFG);
