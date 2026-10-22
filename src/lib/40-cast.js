// ---------- Buloy: messy black hair, thin silver glasses, a light moustache and goatee,
// a black hoodie with a star on the left chest, black cargos, white sneakers ----------
const SKIN = 0xc58b62, HAIR = 0x1a161f, HAIR_HI = 0x2e2734, HOOD = 0x3a3945, HOOD_D = 0x25232e, HOOD_L = 0x4a4857, CARGO = 0x22212a, CARGO_L = 0x2c2a35, JOG = 0x7d7c87, JOG_D = 0x66656f, JOG_L = 0x93929d;
const R = { rim: 1 };                                  // everybody in the cast gets the dusk rim
const hoodM = mat(HOOD, R), hoodD = mat(HOOD_D, R), hoodL = mat(HOOD_L, R), cargoM = mat(CARGO, R), skinM = mat(SKIN, { rim: 0.5 }), skinPlain = mat(SKIN);
// vertical ribbing for cuffs and waistband: a texture of light and dark stripes round a cylinder
const ribTex = painted(8, 2, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 8, 2); g.fillStyle = "#8a8894"; g.fillRect(0, 0, 3, 2); }, { repeat: true });
ribTex.repeat.set(9, 1);
// cloth grain: a soft knit / fleece noise, so the hoodie and the joggers read as fabric and not plastic (subtle: it only dims or lifts the colour a little)
function grainTex(n, lo, rx, ry) {
  let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const t = painted(n, n, (g) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = Math.round(255 * (lo + (1 - lo) * (0.35 * rnd() + 0.65 * (0.5 + 0.5 * Math.sin((x + (y % 2) * 0.5) * Math.PI * 2 / 4)) * (0.6 + 0.4 * rnd())))); g.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; g.fillRect(x, y, 1, 1); } }, { repeat: true });
  t.repeat.set(rx, ry); return t;
}
const fleeceTex = grainTex(32, 0.8, 7, 9), jerseyTex = grainTex(32, 0.86, 8, 10);
// ---- cloth that follows the body. Every piece of the adult hoodie below (the hood, the pouch, the seams, the creases, the cords, the star) is laid on the torso's own surface:
// a ray from outside finds the skin, and the cloth is lifted off it by the fabric's thickness. Nothing is a flat plate, and nothing stands off the body by more than it is thick.
// makeSkin(root, meshes): rays in `root`'s own frame. front(x, y) and back(x, y) cast along z, ring(side, theta, y) casts inward at the neck, each returns { p, n } or null.
function makeSkin(root, meshes) {
  const rc = new THREE.Raycaster(), o = new THREE.Vector3(), d = new THREE.Vector3(), inv = new THREE.Matrix4();
  root.updateWorldMatrix(true, true); inv.copy(root.matrixWorld).invert();
  const cast = (ox, oy, oz, dx, dy, dz) => {
    o.set(ox, oy, oz).applyMatrix4(root.matrixWorld); d.set(dx, dy, dz).transformDirection(root.matrixWorld); rc.set(o, d); rc.far = 4;
    const h = rc.intersectObjects(meshes, false)[0]; if (!h) return null;
    const n = h.face.normal.clone().transformDirection(h.object.matrixWorld).transformDirection(inv); if (n.dot(d) > 0) n.negate();
    return { p: h.point.clone().applyMatrix4(inv), n };
  };
  const near = (f, x, y) => { for (const k of [1, 0.96, 0.9, 0.82, 0.7]) { const h = f(x * k, y); if (h) return h; } return null; };
  return {
    front: (x, y) => near((a, b) => cast(a, b, 1, 0, 0, -1), x, y), back: (x, y) => near((a, b) => cast(a, b, -1, 0, 0, 1), x, y),
    ring: (side, th, y) => { const sx = Math.sin(th) * side, cz = Math.cos(th); return cast(sx * 0.4, y, 0.004 + cz * 0.4, -sx, 0, -cz); },   // inward at height y, th from the front round the neck
  };
}
// a path of { p, n } resampled to n points along a smooth curve through the keys (normals blended between keys)
function clothPath(keys, n) {
  const cv = new THREE.CatmullRomCurve3(keys.map((k) => k.p), false, "catmullrom", 0.5), out = [], K = keys.length - 1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), f = t * K, a = Math.min(K - 1, Math.floor(f)), w = f - a;
    out.push({ p: cv.getPoint(t), n: keys[a].n.clone().lerp(keys[a + 1].n, w).normalize() });
  }
  return out;
}
// a soft tube lying on the cloth: an ellipse w wide (along the surface) and t thick (out of it), centred a little above the skin, closing to a point at both ends (or round, if closed).
// w and t may be functions of s (0..1 along the path). Seams are thin ones, a rolled hood edge a fat one.
function clothTube(path, w, t, seg = 8, o = {}) {
  const n = path.length, pos = [], uv = [], idx = [], T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  const W = typeof w === "function" ? w : () => w, Tt = typeof t === "function" ? t : () => t, lift = o.lift ?? 0.3;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), q = o.closed ? 1 : Math.min(1, Math.min(s, 1 - s) / (o.end ?? 0.07)), k = Math.sqrt(Math.max(0, 1 - (1 - q) * (1 - q)));
    T.subVectors(path[Math.min(n - 1, i + 1)].p, path[Math.max(0, i - 1)].p).normalize();
    N.copy(path[i].n).addScaledVector(T, -path[i].n.dot(T)).normalize(); B.crossVectors(T, N).normalize();
    const tw = W(s) * k, tt = Tt(s) * k, c = path[i].p;
    for (let j = 0; j <= seg; j++) {
      const a = j / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(c.x + B.x * ca * tw + N.x * (sa + lift) * tt, c.y + B.y * ca * tw + N.y * (sa + lift) * tt, c.z + B.z * ca * tw + N.z * (sa + lift) * tt); uv.push(s * (o.uvLen ?? 3), j / seg);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + 1, c2 = a + seg + 1, d2 = c2 + 1; idx.push(a, b, c2, b, d2, c2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  g.userData.orient = true; return orientOut(g, path);
}
// make sure a surface's triangles face away from the body (the side its path normals point to)
function orientOut(g, path) {
  const p = g.attributes.position, ix = g.index.array, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e = new THREE.Vector3(), f = new THREE.Vector3();
  let vote = 0;
  for (let i = 0; i < ix.length; i += 3) {
    a.fromBufferAttribute(p, ix[i]); b.fromBufferAttribute(p, ix[i + 1]); c.fromBufferAttribute(p, ix[i + 2]); e.subVectors(b, a); f.subVectors(c, a); e.cross(f);
    const m = (a.x + b.x + c.x) / 3, my = (a.y + b.y + c.y) / 3, mz = (a.z + b.z + c.z) / 3; let best = 1e9, bn = null;
    for (const q of path) { const dd = (q.p.x - m) ** 2 + (q.p.y - my) ** 2 + (q.p.z - mz) ** 2; if (dd < best) { best = dd; bn = q; } }
    vote += Math.sign(e.dot(new THREE.Vector3(m - bn.p.x, my - bn.p.y, mz - bn.p.z))) || 0;
  }
  if (vote < 0) { const arr = g.index.array; for (let i = 0; i < arr.length; i += 3) { const t = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = t; } g.index.needsUpdate = true; g.computeVertexNormals(); }
  return g;
}
// a sheet of cloth: P[j * nu + i] = { p, n } laid on the body, lift(i, j) its height off it. Normals come from the grid itself, so the sheet has no facets. wrap: the i direction closes (a fan round a centre).
function clothPatch(P, nu, nv, lift, o = {}) {
  const pos = [], uv = [], idx = [], at = (i, j) => P[Math.min(nv - 1, Math.max(0, j)) * nu + (o.wrap ? (i + nu) % nu : Math.min(nu - 1, Math.max(0, i)))];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nrm = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const q = P[j * nu + i]; a.subVectors(at(i + 1, j).p, at(i - 1, j).p); b.subVectors(at(i, j + 1).p, at(i, j - 1).p); c.crossVectors(a, b);
    if (c.lengthSq() < 1e-12) c.copy(q.n); else { c.normalize(); if (c.dot(q.n) < 0) c.negate(); }
    const h = lift(i, j); pos.push(q.p.x + c.x * h, q.p.y + c.y * h, q.p.z + c.z * h); nrm.push(c.clone());
    const u = o.uv ? o.uv(i, j) : [i / (nu - 1), j / (nv - 1)]; uv.push(u[0], u[1]);
  }
  const ni = o.wrap ? nu : nu - 1;
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < ni; i++) {
    const i2 = (i + 1) % nu, A = j * nu + i, B = j * nu + i2, C = (j + 1) * nu + i, D = (j + 1) * nu + i2;
    for (const [x, y, z] of [[A, B, C], [B, D, C]]) { const pa = new THREE.Vector3(pos[x * 3], pos[x * 3 + 1], pos[x * 3 + 2]), pb = new THREE.Vector3(pos[y * 3], pos[y * 3 + 1], pos[y * 3 + 2]), pc = new THREE.Vector3(pos[z * 3], pos[z * 3 + 1], pos[z * 3 + 2]); const fn = pb.sub(pa).cross(pc.sub(pa)); if (fn.lengthSq() < 1e-14) continue; idx.push(...(fn.dot(nrm[x]) >= 0 ? [x, y, z] : [x, z, y])); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const FS = 2, FW = 144 * FS, FH = 200 * FS;            // the face canvas is drawn at twice the 800 px per metre the screen can show (41-face.js)
var faceReady = false;                                 // 41-face.js sets this once it can paint; makeBuloy paints its own face after that

// the star, printed where his character sheet has it
const starTex = new THREE.TextureLoader().load("assets/brand/vcph-star-512.png");
starTex.colorSpace = THREE.SRGBColorSpace;
const starMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true, alphaTest: 0.35, color: new THREE.Color(0xffffff).multiplyScalar(0.95) });
const starGlowMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true, alphaTest: 0.35, color: new THREE.Color(0xffffff).multiplyScalar(1.45) });     // the printed star glows a little
const starHalo = painted(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(190,120,255,0.55)"); r.addColorStop(1, "rgba(190,120,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }, { mip: false });
const lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), transparent: true, opacity: 0.012, depthWrite: false, blending: THREE.AdditiveBlending });   // barely a tint: his brown eyes must read true through the glass
const lensStreak = painted(32, 20, (g) => { g.fillStyle = "rgba(255,255,255,0.9)"; for (const [x, w] of [[1, 2.4], [24, 3]]) { g.beginPath(); g.moveTo(x + 8, 0); g.lineTo(x + 8 + w, 0); g.lineTo(x + w, 20); g.lineTo(x, 20); g.fill(); } }, { mip: false });
const lensRefl = new THREE.MeshBasicMaterial({ map: lensStreak, color: new THREE.Color(0.85, 0.9, 1.0), transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending });


// ---------- hands: one builder for every human in the cast ----------
// makeHand(parent, s, o) builds a palm, four fingers in three joints, and a thumb that opposes, hanging from the wrist (the parent's origin).
// s is +1 for the left hand of the figure (thumb on -x). o: { skin, skin2, scale, knuckles, bangle }.
// Poses are { c: [index, middle, ring, little] curl 0..1, t: thumb 0 open .. 1 across, sp: finger splay }; HAND_POSES has the named ones.
// Old directors only set arm.fingers.rotation.x (0.4 relaxed .. 1.4 fist); updateHands() turns that into a pose unless h.pose was set this frame.
const HANDS = [];
const _hg = new Map();
const hgeo = (w, h, d, r, soft) => { const k = w + "," + h + "," + d + "," + r + (soft ? "s" : ""); if (!_hg.has(k)) { const rr = soft ? Math.min(r * 1.45, Math.min(w, h, d) / 2 * 0.92) : r; const g = new RoundedBoxGeometry(w, h, d, soft ? 3 : 1, rr); g.userData.box = [w / 2, h / 2, d / 2, rr]; _hg.set(k, g); } return _hg.get(k); };
const HAND_POSES = {
  open: { c: [0.04, 0.04, 0.06, 0.1], t: 0.05, sp: 0.1 }, relaxed: { c: [0.3, 0.36, 0.42, 0.5], t: 0.25, sp: 0.04 }, flat: { c: [0.06, 0.05, 0.08, 0.12], t: 0.1, sp: 0.02 },
  fist: { c: [1, 1, 1, 1], t: 1, sp: 0 }, coin: { c: [0.78, 0.95, 1, 1], t: 0.5, sp: 0 }, pinch: { c: [0.5, 0.42, 0.5, 0.58], t: 0.72, sp: 0.04 }, wrapT: { c: [0.7, 0.74, 0.74, 0.7], t: 0.95, sp: 0 },
  point: { c: [0.02, 1, 1, 1], t: 0.6, sp: 0 }, wrap: { c: [0.7, 0.74, 0.74, 0.7], t: 0.45, sp: 0 }, cheek: { c: [0.1, 0.08, 0.12, 0.18], t: 0.2, sp: 0.03 },
};
const mixPose = (a, b, w) => ({ c: a.c.map((v, i) => v + (b.c[i] - v) * w), t: a.t + (b.t - a.t) * w, sp: a.sp + (b.sp - a.sp) * w });
// HD: the hand's own measures in metres before its scale (47-grip.js solves finger joints against these). Index is finger 0, next to the thumb, on both hands.
const HD = { palm: [0.064, 0.066, 0.025], palmY: -0.03, rootY: -0.063, gap: 0.0166, len: [0.068, 0.076, 0.07, 0.056], frac: [0.42, 0.32, 0.26], wd: [0.0158, 0.0146, 0.0132], th: [0.02, 0.018, 0.016], tb: [0.034, -0.026, -0.002], tbs: [[0.0185, 0.032, 0.019], [0.016, 0.027, 0.016]] };
const fingerX = (s, i) => -s * (1.5 - i) * HD.gap;
function makeHand(parent, s, o) {
  const sc = o.scale ?? 1, root = group(parent, 0, 0, 0); root.scale.set(sc * (o.slim ?? 1), sc, sc);
  const skin = o.skin, skin2 = o.skin2 || skin, h = { root, s, sc, sx: sc * (o.slim ?? 1), js: [], fingers: new THREE.Object3D(), pose: null };
  mesh(root, hgeo(0.064, 0.066, 0.025, 0.011, o.soft), skin, 0, -0.03, 0);                       // the palm
  mesh(root, hgeo(0.046, 0.03, 0.023, 0.01, o.soft), skin, 0, -0.004, 0);                        // the heel, narrower where the wrist joins
  const total = HD.len, frac = HD.frac;
  for (let i = 0; i < 4; i++) {
    const g0 = group(root, fingerX(s, i), -0.063, 0), joints = [g0]; let pg = g0;
    for (let j = 0; j < 3; j++) {
      const len = total[i] * frac[j], w = [0.0158, 0.0146, 0.0132][j] * (i === 3 ? 0.88 : 1);
      mesh(pg, hgeo(w, len, [0.02, 0.018, 0.016][j], 0.0055, o.soft), j === 2 ? skin2 : skin, 0, -len / 2, 0);
      if (j < 2) { pg = group(pg, 0, -len, 0); joints.push(pg); }
    }
    if (o.knuckles) mesh(g0, new THREE.SphereGeometry(0.0085, 5, 4), skin2, 0, -0.002, 0.011, { noShadow: true });       // a knuckle on the back of the hand
    h.js.push(joints);
  }
  h.tb = group(root, -s * 0.034, -0.026, -0.002); mesh(h.tb, hgeo(0.0185, 0.032, 0.019, 0.007, o.soft), skin, 0, -0.016, 0);
  h.tb2 = group(h.tb, 0, -0.032, 0); mesh(h.tb2, hgeo(0.016, 0.027, 0.016, 0.006, o.soft), skin2, 0, -0.0135, 0);
  if (o.bangle) { const b = mesh(root, new THREE.TorusGeometry(0.034, 0.0046, 4, 12), mat(0xe8c66a, { glow: 0.5 }), 0, 0.004, 0, { noShadow: true }); b.rotation.x = Math.PI / 2; }
  HANDS.push(h);
  return h;
}
// A pose is either named-style { c, t, sp } or raw joint angles { f: [[a0, a1, a2] x 4], tb: [rx, ry, rz], tb2: rx } (what the grip solver writes). rawPose turns the first into the second.
function rawPose(h, p) {
  if (p.f) return p;
  return { f: p.c.map((c) => [c * 1.3, c * 1.55, c * 1.05]), sp: p.sp, tb: [0.15 + 0.95 * p.t, 0, -h.s * (0.62 - 1.0 * p.t)], tb2: 0.1 + 0.8 * p.t };
}
function applyHand(h, p) {
  const q = rawPose(h, p), sp = q.sp || 0;
  for (let i = 0; i < 4; i++) { const a = q.f[i], j = h.js[i]; j[0].rotation.set(a[0], 0, -h.s * (1.5 - i) * sp * 0.6); j[1].rotation.x = a[1]; j[2].rotation.x = a[2]; }
  h.tb.rotation.set(q.tb[0], q.tb[1], q.tb[2]); h.tb2.rotation.set(q.tb2, 0, 0);
}
const mixRaw = (h, a, b, w) => { const x = rawPose(h, a), y = rawPose(h, b), m = (u, v) => u + (v - u) * w; return { f: x.f.map((r, i) => r.map((u, j) => m(u, y.f[i][j]))), sp: m(x.sp || 0, y.sp || 0), tb: x.tb.map((u, i) => m(u, y.tb[i])), tb2: m(x.tb2, y.tb2) }; };
const handFree = (h) => { if (h.pose) return h.pose; const x = h.fingers.rotation.x; return x >= 0.4 ? mixPose(HAND_POSES.relaxed, HAND_POSES.fist, clamp01((x - 0.4) / 1.0)) : mixPose(HAND_POSES.open, HAND_POSES.relaxed, clamp01((x - 0.1) / 0.3)); };
function updateHands() {
  for (const h of HANDS) {
    applyHand(h, handFree(h)); h.pose = null;
  }
}
// Turn a hand in the world: F is where the fingers point, P is where the palm faces (w blends from the forearm's own direction). `hand` is the wrist group.
const _hY = new THREE.Vector3(), _hZ = new THREE.Vector3(), _hX = new THREE.Vector3(), _hM = new THREE.Matrix4(), _hQ = new THREE.Quaternion(), _hQ2 = new THREE.Quaternion();
function orientHand(hand, F, P, w = 1) {
  hand.parent.updateWorldMatrix(true, false);
  _hY.copy(F).normalize().negate(); _hZ.copy(P).negate(); _hZ.addScaledVector(_hY, -_hZ.dot(_hY)).normalize(); _hX.crossVectors(_hY, _hZ);
  _hM.makeBasis(_hX, _hY, _hZ); _hQ.setFromRotationMatrix(_hM);
  hand.parent.getWorldQuaternion(_hQ2); _hQ.premultiply(_hQ2.invert());
  hand.quaternion.identity().slerp(_hQ, w);
}

// ---------- makeBuloy: one Buloy, built from scratch each call ----------
// makeBuloy({})                            the present Buloy: hoodie, glasses, moustache and goatee, sits where the film puts him
// makeBuloy({ young: true, at: [x,y,z] })  his college self for flashbacks: no glasses, no moustache or goatee, short neat hair, a plain org
//                                          t-shirt, a lanyard with a blank ID card and one backpack strap. Same face system and expressions.
// options: young (bool), parent (default scene), at ([x, y, z], default the bench seat)
// returns { V, vUpper, vHead, armL, armR, faceTex, draw(face), young }; draw(face) paints that instance's own face canvas
// (face keys are documented in 41-face.js). Two instances can live in one scene, each with its own canvas and texture.
// the adult torso carries the dropped shoulder itself, one fleece surface from the neck over the shoulder to the sleeve, and blends into the neck (no ledge); the young one keeps its own
const TORSO_A = [[-0.075, 0.175, 0.118], [-0.045, 0.2, 0.15, 0, 0.004], [-0.01, 0.214, 0.158, 0, 0.006], [0.02, 0.208, 0.153, 0, 0.008], [0.11, 0.2, 0.152, 0, 0.012], [0.26, 0.206, 0.146, 0, 0.008], [0.4, 0.225, 0.132], [0.432, 0.262, 0.126], [0.458, 0.255, 0.116], [0.484, 0.215, 0.106], [0.506, 0.165, 0.098], [0.522, 0.115, 0.086], [0.536, 0.07, 0.068], [0.548, 0.054, 0.056], [0.556, 0.048, 0.05]];
function makeBuloy(o = {}) {
const young = !!o.young, V = group(o.parent || scene, ...(o.at || [-0.55, 0, benchZ]));
const shirtM = mat(o.shirt ?? 0x3d63c9, R), shirtD = mat(o.shirtD ?? 0x2f4fa6, R), legM = o.legs ? mat(o.legs, R) : young ? cargoM : mat(JOG, { rim: 1, map: jerseyTex }), fleeceM = mat(HOOD, { rim: 1, map: fleeceTex }), fleeceL = mat(HOOD_L, { rim: 1, map: fleeceTex }), jogD = mat(JOG_D, R);   // options shirt, shirtD, legs recolour the young figure (the jeepney set uses them for Bea's uniform)   // a plain flat-colour org tee


// legs: thigh forward along the bench, shin down, foot flat. They stay put when he turns round.
for (const s of [-1, 1]) {
  const hip = group(V, s * 0.098, 0.545, 0.03); hip.rotation.set(-Math.PI / 2 + 0.03, 0, s * 0.05);
  if (young) {
    mesh(hip, limb(0.43, 0.088, 0.072, 9, 0.9), legM);
    box(hip, 0.045, 0.17, 0.135, 0x3b3947, s * 0.088, -0.25, 0.0, R); box(hip, 0.052, 0.045, 0.14, 0x4a4857, s * 0.09, -0.185, 0.0, R);   // cargo pocket and flap
  } else {
    mesh(hip, limb(0.43, 0.09, 0.08, 16, 1), legM).scale.x = 1.2;                                                                          // loose jogger thigh: wider than it is deep
  }
  const knee = group(hip, 0, -0.43, 0); knee.rotation.x = Math.PI / 2 - 0.03;
  if (young) mesh(knee, new THREE.SphereGeometry(0.075, 8, 6), legM); else mesh(knee, new THREE.SphereGeometry(0.083, 14, 10), legM).scale.x = 1.1;
  if (young) mesh(knee, limb(0.43, 0.07, 0.056, 9, 0.9), legM);
  else {
    mesh(knee, limb(0.39, 0.077, 0.054, 16, 1), legM).scale.x = 1.1;                                                                        // the shin tapers to the ankle
    const rib = mesh(knee, new THREE.CylinderGeometry(0.054, 0.052, 0.05, 16), mat(JOG_L, { rim: 1, map: ribTex }), 0, -0.365, 0); rib.scale.x = 1.04;   // ribbed ankle cuff
    mesh(knee, new THREE.SphereGeometry(0.064, 14, 8), legM, 0, -0.33, 0).scale.set(1.05, 0.5, 1.0);                                       // the jogger bunching over the cuff
    { const b = mesh(knee, new THREE.TorusGeometry(0.058, 0.007, 6, 16), jogD, 0, -0.337, 0, { noShadow: true }); b.rotation.x = Math.PI / 2; }
  }
  if (young) mesh(knee, new THREE.CylinderGeometry(0.06, 0.058, 0.035, 9), mat(HOOD_D, R), 0, -0.415, 0);                                       // cuff
  const foot = group(knee, 0, -0.44, 0); foot.rotation.y = s * 0.12;
  if (young) {
    mesh(foot, new RoundedBoxGeometry(0.108, 0.04, 0.285, 2, 0.016), mat(0xf4f1ea, R), 0, -0.085, 0.07);
    mesh(foot, new RoundedBoxGeometry(0.098, 0.075, 0.2, 2, 0.03), mat(0xdedbd4, R), 0, -0.035, 0.03);
    mesh(foot, new RoundedBoxGeometry(0.094, 0.055, 0.1, 2, 0.026), mat(0xf4f1ea, R), 0, -0.045, 0.16);
    box(foot, 0.102, 0.035, 0.11, 0x9c9a96, 0, -0.04, 0.05, R); box(foot, 0.05, 0.02, 0.09, 0xf4f1ea, 0, 0.005, 0.07, R);
  } else {
    const W = mat(0xf4f1ea, R), K = mat(0x17161b, R), G = mat(0xd9d6cf, R), RD = mat(0xc3202b, R);                                                             // Jordan 1-style high-top, white with black overlays (no logos)
    mesh(foot, new RoundedBoxGeometry(0.108, 0.034, 0.292, 4, 0.016), W, 0, -0.088, 0.07);                                              // white midsole, rounded toe
    { const st = mesh(foot, new RoundedBoxGeometry(0.1115, 0.0075, 0.2965, 3, 0.0036), mat(0xb6b3ad, R), 0, -0.0885, 0.07, { noShadow: true }); }   // the midsole stripe, all the way round
    mesh(foot, new RoundedBoxGeometry(0.1, 0.012, 0.286, 3, 0.005), RD, 0, -0.109, 0.07);                                                // red outsole
    mesh(foot, new RoundedBoxGeometry(0.094, 0.074, 0.19, 4, 0.034), W, 0, -0.04, 0.02);                                                // white leather body: quarter and heel, rounded
    { const tb = mesh(foot, new THREE.SphereGeometry(1, 16, 10), W, 0, -0.056, 0.138); tb.scale.set(0.0485, 0.039, 0.082); }              // the toe box: a soft dome, round in front
    { const cp = mesh(foot, new THREE.SphereGeometry(1, 16, 10), RD, 0, -0.07, 0.142); cp.scale.set(0.0505, 0.03, 0.0875); }   // the red toe overlay, hugging the lower front
    for (const [rr, zz, cc] of [[0.044, 0.108, 0x0c0b0e], [0.04, 0.123, 0x8c8a92]]) { const sm = mesh(foot, new THREE.TorusGeometry(rr, 0.0021, 4, 14, Math.PI), mat(cc, R), 0, -0.047, zz, { noShadow: true }); sm.rotation.x = Math.PI / 2; sm.scale.set(1, 1, 0.9); }   // the curved cap seam and its stitch line
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) box(foot, 0.0055, 0.0055, 0.0055, 0x55555c, (i - 1) * 0.0165, -0.0155 - j * 0.004 - 0.0, 0.096 - j * 0.014, { noShadow: true });   // perforated toe box
    mesh(foot, new RoundedBoxGeometry(0.098, 0.062, 0.07, 3, 0.026), RD, 0, -0.046, -0.064);                                             // red heel overlay
    const col = mesh(foot, new THREE.CylinderGeometry(0.05, 0.057, 0.07, 16), W, 0, 0.01, -0.028); col.scale.z = 1.1;                      // the high ankle collar
    const pad = mesh(foot, new THREE.TorusGeometry(0.053, 0.0135, 8, 18), RD, 0, 0.043, -0.028); pad.rotation.x = Math.PI / 2; pad.scale.set(1, 1.1, 1);   // padded red collar
    mesh(foot, new THREE.TorusGeometry(0.0535, 0.0075, 6, 16), mat(0xece9df, R), 0, 0.0285, -0.028, { noShadow: true }).rotation.x = Math.PI / 2;   // the foam under it
    for (const q of [-1, 1]) {
      const sp = mesh(foot, new RoundedBoxGeometry(0.0055, 0.05, 0.13, 2, 0.0025), K, q * 0.0475, -0.026, 0.02);                          // black side overlay: the big colour block
      sp.rotation.x = -0.16;
      mesh(foot, new RoundedBoxGeometry(0.0055, 0.04, 0.055, 2, 0.0025), K, q * 0.0495, 0.014, -0.032, { noShadow: true });               // ankle patch
      const st = mesh(foot, new RoundedBoxGeometry(0.0045, 0.012, 0.07, 2, 0.002), G, q * 0.0505, -0.027, 0.03, { noShadow: true }); st.rotation.x = -0.32;   // a pale curved stripe across the overlay
    }
    const tg = mesh(foot, new RoundedBoxGeometry(0.048, 0.075, 0.014, 2, 0.006), W, 0, 0.034, 0.045); tg.rotation.x = -0.55;               // the tongue
    for (let k = 0; k < 5; k++) { const l = mesh(foot, new RoundedBoxGeometry(0.056, 0.0055, 0.0085, 2, 0.0025), mat(0xece9df, R), 0, 0.017 - k * 0.0105, 0.03 + k * 0.025, { noShadow: true }); l.rotation.x = -0.45; }   // laces
    mesh(foot, new THREE.SphereGeometry(0.0075, 8, 6), mat(0xece9df, R), 0, 0.012, 0.06, { noShadow: true }).scale.set(1.5, 0.8, 1);
  }
}

// everything above the hips turns with vUpper
const vUpper = group(V, 0, 0.52, 0);
const torsoM = young ? shirtM : fleeceM;
if (o.girl) { mesh(V, new THREE.CylinderGeometry(0.19, 0.22, 0.08, 12), legM, 0, 0.58, 0.04); box(V, 0.34, 0.07, 0.46, o.legs ?? 0x23306a, 0, 0.6, 0.27, R); box(V, 0.34, 0.14, 0.04, o.legs ?? 0x23306a, 0, 0.54, 0.5, R); }   // a pleated skirt over the lap
const torso = mesh(vUpper, loft(young ? [[-0.075, 0.175, 0.118], [-0.045, 0.2, 0.15, 0, 0.004], [-0.01, 0.214, 0.158, 0, 0.006], [0.02, 0.208, 0.153, 0, 0.008], [0.11, 0.2, 0.152, 0, 0.012], [0.26, 0.206, 0.146, 0, 0.008], [0.4, 0.216, 0.132], [0.468, 0.19, 0.112], [0.512, 0.108, 0.092], [0.535, 0.066, 0.068]] : TORSO_A, young ? 12 : 20, { e: young ? 0.84 : 0.97 }), torsoM);
if (young) {
  mesh(vUpper, new THREE.CylinderGeometry(0.21, 0.205, 0.04, 12), shirtD, 0, -0.03, 0.006).scale.z = 0.72;                            // hem
  const collar = mesh(vUpper, new THREE.TorusGeometry(0.062, 0.011, 6, 12), shirtD, 0, 0.517, 0.006); collar.rotation.x = Math.PI / 2 - 0.1; collar.scale.set(1, 0.85, 1);   // crew neck
  if (o.lace !== false) for (const s of [-1, 1]) { const c = box(vUpper, 0.007, 0.236, 0.005, 0xc43c3c, s * 0.0235, 0.388, 0.1285, { noShadow: true }); c.rotation.set(-0.12, 0, -s * 0.2); }   // lanyard
  if (o.lace !== false) { box(vUpper, 0.05, 0.068, 0.005, 0xf0eee6, 0, 0.246, 0.152, { noShadow: true }); box(vUpper, 0.016, 0.01, 0.007, 0x9c9a96, 0, 0.288, 0.151, { noShadow: true }); }       // the blank ID card and its clip
  if (o.strap !== false) box(vUpper, 0.04, 0.34, 0.014, 0x1b1a20, -0.12, 0.34, 0.124, { noShadow: true, rim: 1 }).rotation.set(-0.05, 0, 0.12);                                                  // one backpack strap, down the front
  if (o.strap !== false) box(vUpper, 0.04, 0.014, 0.19, 0x1b1a20, -0.125, 0.5, 0.025, { noShadow: true, rim: 1 }).rotation.set(0.05, 0, 0.14);                                                    // and over the shoulder
} else {
  const band = mesh(vUpper, loft([[-0.071, 0.168, 0.168], [-0.068, 0.183, 0.183], [-0.04, 0.19, 0.19], [-0.012, 0.183, 0.183], [-0.009, 0.17, 0.17]], 22, { e: 1 }), mat(HOOD_D, { rim: 1, map: ribTex }), 0, 0, 0.006); band.scale.z = 0.72;   // ribbed waistband, rolled at both edges, a little narrower than the body
  { const wb = mesh(vUpper, loft([[-0.118, 0.15, 0.15], [-0.114, 0.164, 0.164], [-0.098, 0.168, 0.168], [-0.082, 0.164, 0.164], [-0.078, 0.15, 0.15]], 22, { e: 1 }), mat(JOG, R)); wb.scale.z = 0.62;   // the jogger waistband peeking under the hem
    for (const s2 of [-1, 1]) { const c = mesh(vUpper, new THREE.CapsuleGeometry(0.0055, 0.045, 3, 6), mat(0xe6e4ea, R), s2 * 0.06, -0.14, 0.13, { noShadow: true }); c.rotation.set(-0.12, 0, -s2 * 0.1); } }   // its drawstring hanging out
  vUpper.userData.skinMeshes = [torso];
  const skin = makeSkin(vUpper, vUpper.userData.skinMeshes);
  const lay = (h, d) => ({ p: h.p.clone().addScaledVector(h.n, d), n: h.n });                                                     // a skin point lifted by d
  const fabUV = (x, y) => [0.5 + x / 1.1, y / 0.61 + 0.05];                                                                        // the fleece grain at the same scale everywhere
  const cordM = mat(0xd8d6e0, R), seamM = mat(0x24222c, R), seamL = mat(0x2a2833, R), slotM = mat(0x0f0e13, R);
  // THE HOOD, DOWN (a pullover's). In front there is no hood at all: only the neckline, where its two edges cross in a small V just under the throat and lie flat on the chest (never more than the
  // fabric's thickness off it). Round the neck the edge becomes a low soft roll, and down the back the hood is a shield of cloth lying on the upper back, following its curve, with a seam down the middle.
  const hood = group(vUpper, 0, 0, 0); vUpper.userData.hood = hood;
  const part = (m, name) => { m.userData.part = name; return m; };
  for (const side of [1, -1]) {                                                                                                     // the two hood edges: each starts at the V, goes up its own side of the neck, round the back to the middle
    const K = [];
    for (const [x, y] of [[-0.006, 0.484], [0.006, 0.491], [0.02, 0.503], [0.034, 0.514], [0.045, 0.524]]) { const h = skin.front(x * side, y); if (h) K.push(lay(h, side > 0 ? 0.002 : 0)); }   // the right-hand edge lies over the other where they cross
    for (const [deg, y] of [[62, 0.533], [82, 0.536], [104, 0.538], [128, 0.54], [152, 0.541], [180, 0.541]]) { const h = skin.ring(side, deg * Math.PI / 180, y); if (h) K.push(h); }
    const sm = (s, a) => { const k = Math.min(1, Math.max(0, (s - a) / (1 - a))); return k * k * (3 - 2 * k); };
    const path = clothPath(K, 54);
    mesh(hood, clothTube(path, (s) => 0.0105 + 0.0095 * sm(s, 0.3), (s) => 0.0048 + 0.0095 * sm(s, 0.35), 10, { end: 0.03 }), fleeceL); part(hood.children[hood.children.length - 1], "rim");
    const lk = K.slice(5).map((k) => ({ p: new THREE.Vector3(k.p.x * 0.82, k.p.y - 0.004, 0.004 + (k.p.z - 0.004) * 0.82), n: k.n }));
    if (lk.length > 2) mesh(hood, clothTube(clothPath(lk, 24), 0.007, 0.0055, 7, { end: 0.12, lift: 0.3 }), seamM, 0, 0, 0, { noShadow: true });   // the dark lining of the opening, where the roll turns up round the neck
  }
  {                                                                                                                                 // the shield on the back: a rounded triangle of cloth, neckline to shoulder blades
    const TOP = 0.522, LEN = 0.18, V0 = 0.22, nu = 25, nv = 24, P = [];
    const W = (v) => { if (v < V0) { const k = v / V0; return 0.078 + 0.043 * (k * k * (3 - 2 * k)); } return 0.121 * Math.pow(Math.max(0, 1 - ((v - V0) / (1 - V0)) ** 2), 0.85); };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const u = i / (nu - 1) * 2 - 1, v = j / (nv - 1), x = u * W(v), y = TOP - v * LEN;
      P.push(skin.back(x, y) || P[P.length - 1] || { p: new THREE.Vector3(x, y, -0.1), n: new THREE.Vector3(0, 0, -1) });
    }
    const lift = (i, j) => { const u = Math.abs(i / (nu - 1) * 2 - 1), v = j / (nv - 1); return 0.0055 + 0.0055 * (1 - u * u) * Math.min(1, (1 - v) * 3) + 0.0095 * Math.exp(-(((u - (0.6 - 0.42 * v)) / 0.15) ** 2)) * Math.sin(Math.PI * Math.min(1, v * 1.5)); };   // a soft puff, and two gentle folds that run in toward the middle
    mesh(hood, clothPatch(P, nu, nv, lift, { uv: (i, j) => fabUV((i / (nu - 1) * 2 - 1) * W(j / (nv - 1)), TOP - j / (nv - 1) * LEN) }), mat(0x43414f, { rim: 1, map: fleeceTex })); part(hood.children[hood.children.length - 1], "shield");
    const keys = [];                                                                                                                 // the rolled edge: down one side, round the point, up the other
    for (let j = 0; j < nv; j += 2) keys.push(lay(P[j * nu], 0.003)); keys.push(lay(P[(nv - 1) * nu], 0.003));
    for (let j = nv - 3; j >= 0; j -= 2) keys.push(lay(P[j * nu + nu - 1], 0.003));
    mesh(hood, clothTube(clothPath(keys, 90), 0.007, 0.0072, 8, { end: 0.02, lift: 0.3 }), fleeceL); part(hood.children[hood.children.length - 1], "shield");
    const sk = []; for (let j = 0; j < nv; j += 3) sk.push(lay(P[j * nu + (nu - 1) / 2], lift((nu - 1) / 2, j))); sk.push(lay(P[(nv - 1) * nu + (nu - 1) / 2], lift((nu - 1) / 2, nv - 1)));
    mesh(hood, clothTube(clothPath(sk, 40), 0.0028, 0.0028, 6, { end: 0.04, lift: 0.4 }), mat(0x201e28, R), 0, 0, 0, { noShadow: true }); part(hood.children[hood.children.length - 1], "shield");   // the hood's centre seam, a thin tube lying on it
  }
  {                                                                                                                                 // the kangaroo pouch: laid on the belly's curve, rounded all round, a seam stitched round it, two slanted openings
    const cy = 0.1125, hh = 0.0625, nu = 44, nj = 10, e = 2 / 4.5, P = [], UV = [], hw = (v) => 0.1175 - 0.0175 * v;
    const edge = (a, r) => { const ca = Math.cos(a), sa = Math.sin(a), uu = Math.sign(ca) * Math.abs(ca) ** e, vv = Math.sign(sa) * Math.abs(sa) ** e; return [r * uu * hw(vv), cy + r * vv * hh]; };
    for (let j = 0; j < nj; j++) for (let i = 0; i < nu; i++) { const [x, y] = edge(i / nu * Math.PI * 2, j / (nj - 1)); P.push(skin.front(x, y)); UV.push(fabUV(x, y)); }
    mesh(vUpper, clothPatch(P, nu, nj, (i, j) => 0.002 + 0.019 * Math.sqrt(Math.max(0, 1 - (j / (nj - 1)) ** 3)), { wrap: true, uv: (i, j) => UV[j * nu + i] }), fleeceM);
    const loop = []; for (let i = 0; i <= nu; i++) { const [x, y] = edge(i / nu * Math.PI * 2, 0.985), h = skin.front(x, y); loop.push(lay(h, 0.0012)); }
    mesh(vUpper, clothTube(clothPath(loop, 110), 0.003, 0.0032, 6, { closed: true, lift: 0.3 }), seamM, 0, 0, 0, { noShadow: true });
    for (const c0 of [0, Math.PI]) {                                                                                                // the openings, one each side
      const ks = []; for (let k = 0; k <= 8; k++) { const [x, y] = edge(c0 + (k / 8 - 0.5) * 0.56, 0.992); ks.push(lay(skin.front(x, y), 0.0016)); }
      mesh(vUpper, clothTube(clothPath(ks, 24), 0.0058, 0.0045, 6, { end: 0.12, lift: 0.3 }), slotM, 0, 0, 0, { noShadow: true });
    }
  }
  for (const [x, y, w, rz, d] of [[0, 0.215, 0.26, 0.04, 1], [0, 0.0, 0.24, 0.03, 0], [-0.02, 0.035, 0.2, -0.04, 0], [0, 0.275, 0.12, 0.1, 1]]) {     // soft creases across the belly and where the laptop rests: a low ridge of the same cloth, rising out of the surface and fading back into it
    const ni = 16, nj = 7, P = [], sag = d ? 1 : -1;
    for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
      const dx = (i / (ni - 1) - 0.5) * w, off = (j / (nj - 1) - 0.5) * 0.026, yy = y + dx * Math.tan(rz) + 0.003 * (1 - (2 * dx / w) ** 2) * sag + off;
      P.push(skin.front(x + dx, yy));
    }
    mesh(vUpper, clothPatch(P, ni, nj, (i, j) => 0.0042 * Math.cos((j / (nj - 1) - 0.5) * Math.PI) ** 2 * Math.sin(Math.PI * i / (ni - 1)) ** 0.7, { uv: (i, j) => fabUV(P[j * ni + i].p.x, P[j * ni + i].p.y) }), fleeceM);
  }
  for (const s of [-1, 1]) {                                                                                                         // drawstrings: a cord from each eyelet either side of the V, lying down the chest, a metal aglet
    const ks = []; for (const [x, y] of [[0.034, 0.492], [0.04, 0.45], [0.046, 0.4], [0.043, 0.355], [0.041, 0.31]]) { const h = skin.front(s * x + 0.004, y); if (h) ks.push(lay(h, 0.0042)); }
    const path = clothPath(ks, 36);
    mesh(vUpper, clothTube(path, 0.0052, 0.0046, 7, { end: 0.015, lift: 0 }), cordM, 0, 0, 0, { noShadow: true });
    const last = path[path.length - 1], tan = last.p.clone().sub(path[path.length - 4].p).normalize();
    const ag = mesh(vUpper, new THREE.CapsuleGeometry(0.0072, 0.024, 3, 8), mat(0xb9bcc6, { glow: 0.9 }), last.p.x + tan.x * 0.01, last.p.y + tan.y * 0.01, last.p.z + tan.z * 0.01, { noShadow: true });
    ag.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    const eh = skin.front(s * 0.034 + 0.004, 0.492), ey = mesh(vUpper, new THREE.TorusGeometry(0.0085, 0.003, 5, 10), mat(0xc4c8d0, { glow: 1.05 }), eh.p.x + eh.n.x * 0.002, eh.p.y + eh.n.y * 0.002, eh.p.z + eh.n.z * 0.002, { noShadow: true });
    ey.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), eh.n);
  }
  const decal = (cx, cy, size, material, lift) => {                                                                                 // a print: a little sheet laid on the chest's curve, never floating
    const n = 14, P = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) P.push(skin.front(cx + (i / (n - 1) - 0.5) * size, cy + (0.5 - j / (n - 1)) * size));
    const m = mesh(vUpper, clothPatch(P, n, n, () => lift, { uv: (i, j) => [i / (n - 1), 1 - j / (n - 1)] }), material, 0, 0, 0, { noShadow: true }); m.receiveShadow = false; return m;
  };
  decal(0.095, 0.315, 0.15, starGlowMat, 0.0035);
  const h = decal(0.1, 0.315, 0.26, new THREE.MeshBasicMaterial({ map: starHalo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.38 }), 0.002);
  vUpper.userData.halo = h;                                                                  // a set where hands work in front of the chest can switch the halo off
}
mesh(vUpper, new THREE.CylinderGeometry(0.047, 0.05, 0.08, 9), mat(0xa4704d, { rim: 0.5 }), 0, 0.555, 0.004);                                              // neck

// arms: yaw at the shoulder, then pitch, then the elbow (young: a short sleeve to the elbow, bare forearm)
function vArm(s) {
  const yaw = group(vUpper, s * 0.204, 0.44, 0), sh = group(yaw);
  let el, foreM;
  if (young) {
    mesh(sh, new THREE.SphereGeometry(0.068, 8, 6), torsoM);
    mesh(sh, limb(0.27, 0.066, 0.058, 9), torsoM);
    el = group(sh, 0, -0.27, 0); foreM = o.sleeves ? torsoM : skinM;                         // o.sleeves: long sleeves on the young rig (a blazer)
    mesh(el, new THREE.SphereGeometry(o.sleeves ? 0.062 : 0.048, 8, 6), foreM);
    mesh(el, limb(0.235, o.sleeves ? 0.066 : 0.05, o.sleeves ? 0.056 : 0.034, 9), foreM);
    if (o.sleeves) mesh(el, new THREE.CylinderGeometry(0.046, 0.044, 0.03, 9), shirtD, 0, -0.232, 0);       // the cuff
    if (!o.sleeves) mesh(sh, new THREE.CylinderGeometry(0.062, 0.06, 0.03, 9), shirtD, 0, -0.262, 0);       // the sleeve's hem
  } else {
    // the dropped fleece shoulder (the yoke) is made with the torso; the sleeve is one soft tube that tapers to the cuff
    mesh(sh, loft([[-0.27, 0.064, 0.062], [-0.2, 0.069, 0.067], [-0.1, 0.076, 0.073], [-0.02, 0.078, 0.076], [0.02, 0.07, 0.07, -s * 0.01], [0.046, 0.038, 0.04, -s * 0.026]], 18, { e: 1 }), fleeceM);
    el = group(sh, 0, -0.27, 0); foreM = fleeceM;
    mesh(el, new THREE.SphereGeometry(0.063, 16, 10), fleeceM);                                                                                    // the elbow, the same width as the sleeve either side so no seam shows
    mesh(el, loft([[-0.235, 0.05, 0.05], [-0.18, 0.056, 0.056], [-0.08, 0.063, 0.063], [0, 0.064, 0.064]], 18, { e: 1, capTop: false }), fleeceM);
    for (const [y, w, rz, d] of [[-0.012, 0.04, 0.08, 0], [-0.05, 0.036, -0.1, 1]]) {                                                              // two gentle folds across the bend
      const f = mesh(el, new THREE.SphereGeometry(1, 12, 8), fleeceM, 0, y, 0.042 + d * 0.004); f.scale.set(w, 0.012, 0.026); f.rotation.z = rz;
    }
    mesh(el, loft([[-0.2545, 0.04, 0.04], [-0.2535, 0.0475, 0.0475], [-0.249, 0.0525, 0.0525], [-0.232, 0.0535, 0.0535], [-0.2155, 0.0525, 0.0525], [-0.2105, 0.048, 0.048]], 18, { e: 1, capTop: false, capBottom: false }), mat(HOOD_D, { rim: 1, map: ribTex }));   // ribbed cuff, rolled at both edges
    mesh(el, new THREE.SphereGeometry(0.057, 16, 8), fleeceM, 0, -0.205, 0).scale.set(1, 0.5, 1);                                                  // a soft bunch above it
  }
  const hand = group(el, 0, -0.25, 0);
  if (!young) mesh(hand, new RoundedBoxGeometry(0.07, 0.012, 0.03, 3, 0.006), mat(HOOD_D, R), 0, 0.012, 0);                          // the cuff's edge
  const H = makeHand(hand, s, { skin: skinM, skin2: mat(0xb87a58, R), scale: o.girl ? 0.9 : 1.08, slim: o.girl ? 0.82 : 1, soft: !young });
  const fingers = H.fingers;
  return { yaw, sh, el, hand, fingers, H };
}
const armL = vArm(1), armR = vArm(-1);                  // L is his left, on +x

// head. The face is a canvas painted every frame by draw() (src/lib/41-face.js); x runs -0.09..0.09 m, y 0..0.25 m.
const vHead = group(vUpper, 0, 0.585, 0.008);
const faceCanvas = document.createElement("canvas"); faceCanvas.width = FW; faceCanvas.height = FH;
const fctx = faceCanvas.getContext("2d");
const faceTex = new THREE.CanvasTexture(faceCanvas);
faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.magFilter = THREE.NearestFilter; faceTex.minFilter = THREE.LinearFilter; faceTex.generateMipmaps = false;
{
  // the lower jaw tapers a little from the cheekbones (y 0.14) down to the chin
  const hg = loft([[0, 0.042, 0.04, 0, 0.03], [0.015, 0.056, 0.055, 0, 0.022], [0.04, 0.066, 0.069, 0, 0.012], [0.07, 0.0725, 0.079, 0, 0.006], [0.105, 0.08, 0.088, 0, 0.002], [0.14, 0.085, 0.094], [0.175, 0.085, 0.097, 0, -0.002], [0.205, 0.08, 0.094, 0, -0.004], [0.228, 0.067, 0.08, 0, -0.006], [0.242, 0.04, 0.052, 0, -0.008], [0.248, 0.012, 0.016, 0, -0.008]], 16, { e: 0.93 });
  const p = hg.attributes.position, uv = hg.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i) >= 0 ? 0.5 + p.getX(i) / 0.18 : (p.getX(i) < 0 ? 0.01 : 0.99), p.getY(i) / 0.25);   // the face is projected from the front
  mesh(vHead, hg, mat(0xffffff, { map: faceTex, rim: 0.5 }));
}
{ // nose: a low, flat bridge into a small tip, wearing the face's own texture (planar from the front) so it takes the cheek colour and shading and blends in
  const faceM = mat(0xffffff, { map: faceTex, rim: 0.5 });
  const bit = (x, y, z, sx, sy, sz, rx) => {
    const g = new THREE.SphereGeometry(1, 8, 6), m = new THREE.Object3D();
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.x = rx; m.updateMatrix(); g.applyMatrix4(m.matrix);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / 0.18, p.getY(i) / 0.25);
    mesh(vHead, g, faceM, 0, 0, 0, { noShadow: true });
  };
  bit(0, 0.119, 0.0885, 0.0072, 0.0125, 0.0038, 0.3);
  bit(0, 0.1085, 0.0925, 0.0088, 0.0062, 0.0052, 0);
}
for (const s of [-1, 1]) {
  mesh(vHead, new THREE.SphereGeometry(1, 7, 6), skinPlain, s * 0.086, 0.126, -0.006, { noShadow: true }).scale.set(0.012, 0.032, 0.021);
  mesh(vHead, new THREE.SphereGeometry(1, 6, 5), mat(0x7a4a36), s * 0.0895, 0.126, -0.004, { noShadow: true }).scale.set(0.004, 0.019, 0.012);   // the hollow of the ear
}
// hair. Adult: a short wavy French crop (close tapered sides, soft S-waves on top sweeping to his left, a short blunt fringe).
// Young: a plain short school cut, straight, no waves.
{
  const hairM = mat(HAIR, R), hairH = mat(HAIR_HI, R), hairL = mat(0x4c4460, R), hairF = mat(0x33293f, R);
  mesh(vHead, loft([[0.082, 0.058, 0.03, 0, -0.07], [0.12, 0.084, 0.05, 0, -0.053], [0.16, 0.0905, 0.076, 0, -0.03], [0.19, 0.0925, 0.1, 0, -0.008], [0.216, 0.092, 0.106, 0, -0.002], [0.246, 0.08, 0.098, 0, 0.0], [0.262, 0.052, 0.07, 0, 0.004], [0.27, 0.016, 0.024, 0, 0.004]], 14), hairM);   // the close cap: sides and back
  const r = rng(young ? 91 : 88), hairRowM = mat(HAIR, { rim: 0.3, side: 1 });
  const dome = (x, z) => 0.18 + 0.082 * Math.sqrt(Math.max(0.03, 1 - (x / 0.099) ** 2 - (z / 0.109) ** 2)) + (z > 0.04 ? (z - 0.04) * 0.14 : 0);   // a little lift at the front
  // a wave row runs across the head at depth zc; amp is the S-wave in depth, sweep leans the row, freq is the number of waves
  const row = (zc, amp, ph, sweep, rad, hi, x0 = -0.086, x1 = 0.086, freq = 1.15) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, x = x0 + (x1 - x0) * u, z = zc + amp * Math.sin(u * Math.PI * 2 * freq + ph) + sweep * (u - 0.5);
      pts.push(new THREE.Vector3(x, dome(x, z) + rad * 0.35, z));
    }
    mesh(vHead, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 34, rad, 7, false), hairRowM);
    if (hi) for (let k = 0; k < 1; k++) {                                                                                                 // short curved highlights that follow the wave
      const a0 = 3 + Math.floor(r() * 12), hp = pts.slice(a0, a0 + 4).map((q) => new THREE.Vector3(q.x, q.y + rad * 0.55, q.z + rad * 0.45));
      mesh(vHead, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 8, rad * 0.16, 4, false), hairF, 0, 0, 0, { noShadow: true });
    }
  };
  // small irregular strand tips round the rim and top, so the silhouette is choppy and not a smooth dome
  const tips = (n, lo, hi, len) => {
    for (let i = 0; i < n; i++) {
      const az = r() * Math.PI * 2, el = lo + r() * (hi - lo), ce = Math.cos(el), se = Math.sin(el);
      const nx = Math.cos(az) * ce, ny = se, nz = Math.sin(az) * ce;
      if (nz > 0.5 && ny < 0.85) continue;                                                              // keep the forehead clear
      const bx = nx * 0.082, by = 0.19 + ny * 0.082, bz = nz * 0.094 - 0.004;                          // rooted inside the mass, only the tip shows
      const v = new THREE.Vector3(nx * 0.35 + 0.25, ny * 0.9 + 0.1, nz * 0.5 + 0.05).normalize();      // mostly up, a little sideways: never a horn
      const L = len * (0.7 + r() * 0.5), c = mesh(vHead, facet(new THREE.ConeGeometry(0.008, L, 4)), hairM, bx + v.x * L * 0.35, by + v.y * L * 0.35, bz + v.z * L * 0.35);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    }
  };
  // a blunt fringe straight across the forehead, bottom edge above the brows and the glasses
  const fringe = (bottom, h, d, jit = 0.005) => {
    for (let i = 0; i < 24; i++) {
      const x = -0.072 + i * 0.0063, th = Math.asin(Math.min(0.9, x / 0.085)), zs = -0.004 + 0.098 * Math.sqrt(Math.max(0.05, 1 - (x / 0.085) ** 2)) + 0.006 + (i % 2) * 0.0025;
      const cut = (((i * 7 + 3) % 6) / 5 - 0.35) * jit * 2.4, hh = h - cut;                          // each lock a different length
      const b = box(vHead, 0.0085, hh, d * 0.7, i % 5 === 2 ? HAIR_HI : HAIR, x, bottom + cut + hh / 2, zs, R); b.rotation.y = th; b.rotation.z = ((i * 5) % 7 - 3) * 0.025;
    }
  };
  if (o.prof) {
    // the professor: hair swept up into a high bun, grey at the temples, a neat straight line over the forehead
    const bunM = mat(0x3a343c, R), greyM = mat(0xa8a6b0, R);
    mesh(vHead, new THREE.SphereGeometry(0.056, 9, 7), bunM, 0, 0.292, -0.07).scale.set(1, 0.9, 0.95);
    mesh(vHead, new THREE.TorusGeometry(0.05, 0.007, 4, 14), greyM, 0, 0.292, -0.07, { noShadow: true }).rotation.x = 1.2;
    for (const s of [-1, 1]) box(vHead, 0.012, 0.045, 0.07, 0x8a8892, s * 0.0885, 0.2, 0.01, R);                            // grey at the temples
    for (let i = 0; i <= 10; i++) { const x = -0.07 + i * 0.014, th = Math.asin(Math.min(0.9, x / 0.085)), zs = -0.004 + 0.098 * Math.sqrt(Math.max(0.05, 1 - (x / 0.085) ** 2)) + 0.007; const b = box(vHead, 0.0175, 0.034, 0.011, i % 4 === 1 ? 0x4a4650 : HAIR, x, 0.222, zs, R); b.rotation.y = th; }
  } else if (o.girl) {
    // Bea: a soft bob that falls to the jaw, bangs cut straight, a high ponytail with a tie
    for (const s of [-1, 1]) { box(vHead, 0.026, 0.14, 0.15, HAIR, s * 0.086, 0.15, -0.012, R); box(vHead, 0.02, 0.07, 0.07, HAIR_HI, s * 0.092, 0.15, 0.03, R); }
    box(vHead, 0.18, 0.2, 0.03, HAIR, 0, 0.14, -0.108, R);
    const tail = group(vHead, 0, 0.24, -0.1); tail.rotation.x = 0.55;
    mesh(tail, new THREE.CapsuleGeometry(0.036, 0.2, 3, 7), mat(HAIR, R), 0, -0.1, -0.02);
    mesh(tail, new THREE.CapsuleGeometry(0.014, 0.1, 2, 5), mat(HAIR_HI, R), 0.02, -0.1, 0.015, { noShadow: true });
    mesh(tail, new THREE.SphereGeometry(0.024, 6, 5), mat(0xd9412e), 0, 0.005, 0);
    for (let i = 0; i <= 12; i++) { const x = -0.075 + i * 0.0125, th = Math.asin(Math.min(0.9, x / 0.085)), zs = -0.004 + 0.098 * Math.sqrt(Math.max(0.05, 1 - (x / 0.085) ** 2)) + 0.007; const b = box(vHead, 0.0165, 0.04 + ((i * 5) % 3) * 0.004, 0.011, i % 4 === 1 ? HAIR_HI : HAIR, x, 0.205 + 0.02, zs, R); b.rotation.y = th; }
  } else if (young) {
    row(0.04, 0.008, 0.4, 0.03, 0.026, false, -0.076, -0.022, 0.9);                                                                            // his right of the part: one soft band
    row(0.048, 0.008, 1.6, -0.03, 0.025, false, -0.022, 0.07, 0.9); row(-0.012, 0.007, 0.8, -0.02, 0.026, false, -0.022, 0.074, 0.9);              // his left: two
    row(-0.03, 0.006, 0.2, 0.02, 0.022, false, -0.07, -0.022, 0.9);
    { const pp = []; for (let i = 0; i <= 12; i++) { const z = 0.085 - i * 0.012; pp.push(new THREE.Vector3(-0.022, dome(-0.022, z) + 0.02, z)); }
      mesh(vHead, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp), 14, 0.0022, 4, false), hairF, 0, 0, 0, { noShadow: true }); }       // the parting
    tips(6, 0.9, 1.3, 0.016);
    fringe(0.199, 0.026, 0.011, 0.004);
  } else {
    row(0.072, 0.006, 0.2, 0.04, 0.015, true, -0.06, 0.062, 1.4); row(0.056, 0.018, 1.1, -0.07, 0.017, true, -0.068, 0.068, 1.3); row(0.028, 0.02, 2.2, 0.09, 0.018, true, -0.07, 0.07, 1.0);
    row(0.0, 0.02, 0.6, -0.06, 0.018, true, -0.07, 0.07, 1.5); row(-0.03, 0.016, 1.7, 0.07, 0.017, true, -0.068, 0.068, 1.2); row(-0.06, 0.012, 2.6, -0.04, 0.015, true, -0.075, 0.075, 1.1);
    tips(22, 0.9, 1.35, 0.03);
    fringe(0.19, 0.034, 0.011);
  }
}
// glasses: thin silver rectangles that sit on the nose and wrap round to the ears (they follow the face, not a flat plane)
if (!young || o.glasses) {
  const fr = mat(0xc4c8d0, { glow: 0.72 }), w = 0.052, h = 0.032;
  for (const s of [-1, 1]) {
    const lg = group(vHead, s * 0.0335, 0.1425, 0.0893); lg.rotation.y = s * 0.5;
    for (const [bw, bh, bx, by] of [[w, 0.0038, 0, h / 2], [w, 0.0022, 0, -h / 2], [0.0022, h, -w / 2, 0], [0.0022, h, w / 2, 0]]) mesh(lg, unit, fr, bx, by, 0, { glow: 1 }).scale.set(bw, bh, 0.0035);
    mesh(lg, unit, mat(0xf2f4fa, { glow: 1.6 }), s * w / 2, h / 2, 0, { glow: 1 }).scale.set(0.0035, 0.0034, 0.0038);                    // the hinge catches the light
    mesh(lg, new THREE.PlaneGeometry(w - 0.003, h - 0.003), lensMat, 0, 0, -0.001);
    mesh(lg, new THREE.PlaneGeometry(w - 0.004, h - 0.004), lensRefl, 0, 0, 0.0004);
    for (const [x, y, z, len, ry] of [[0.0663, 0.1465, 0.0647, 0.0336, 0.719], [0.0840, 0.1435, 0.024, 0.0575, 0.228]]) { const t = mesh(vHead, unit, fr, s * x, y, z, { glow: 1 }); t.scale.set(0.0024, 0.0032, len); t.rotation.y = -s * ry; }   // temple arms, out round the head to the ear
  }
  mesh(vHead, unit, fr, 0, 0.1485, 0.1015, { glow: 1 }).scale.set(0.0215, 0.003, 0.0035);
  for (const s of [-1, 1]) mesh(vHead, unit, mat(0xe8eaf0, { glow: 1.2 }), s * 0.0118, 0.1345, 0.1, { glow: 1 }).scale.set(0.0022, 0.012, 0.004);    // nose pads
}
const draw = (f) => { drawFace(fctx, f, young, o.girl); faceTex.needsUpdate = true; };
if (faceReady) draw({ blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0 });
return { V, vUpper, vHead, armL, armR, faceTex, draw, young };
}
const buloy = makeBuloy({});
const { V, vUpper, vHead, armL, armR, faceTex } = buloy;
function drawBuloy(f) { buloy.draw(f); }


// the laptop on his lap: silver, lid to the street, his stickers on the lid
const laptop = group(V, 0, 0.628, 0.31);
mesh(laptop, new RoundedBoxGeometry(0.31, 0.014, 0.215, 2, 0.006), mat(0xc6c9d2, R));
box(laptop, 0.27, 0.003, 0.1, 0x1c1c22, 0, 0.008, 0.035, { noShadow: true }); box(laptop, 0.1, 0.003, 0.06, 0xb0b3bc, 0, 0.008, -0.062, { noShadow: true });
const lid = group(laptop, 0, 0.008, 0.106); lid.rotation.x = 0.33;
mesh(lid, new RoundedBoxGeometry(0.31, 0.206, 0.008, 2, 0.004), mat(0xc6c9d2, R), 0, 0.103, 0);
const scrCanvas = document.createElement("canvas"); scrCanvas.width = 96; scrCanvas.height = 62;
const sctx = scrCanvas.getContext("2d");
const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.magFilter = THREE.NearestFilter; scrTex.minFilter = THREE.LinearFilter; scrTex.generateMipmaps = false;
function drawScreen(t, typing) {
  const g = sctx, r = rng(77), C = ["#7b7bff", "#f29e4c", "#7fd8a6", "#e9e6ff", "#ee6fae"];
  g.fillStyle = "#14141d"; g.fillRect(0, 0, 96, 62);
  g.fillStyle = "#23233a"; g.fillRect(0, 0, 96, 6); g.fillStyle = "#ee5f5f"; g.fillRect(2, 2, 2, 2); g.fillStyle = "#f2c230"; g.fillRect(5, 2, 2, 2); g.fillStyle = "#5fd87a"; g.fillRect(8, 2, 2, 2);
  const lines = 9, shown = Math.min(lines, 3 + Math.floor(typing * 6 + t * 0.4));
  for (let i = 0; i < shown; i++) {
    let x = 4 + (i % 4 === 1 || i % 4 === 2 ? 6 : 0); const y = 10 + i * 4;
    for (let k = 0; k < 3 + (i % 3); k++) { const w = 5 + Math.floor(r() * 14); g.fillStyle = C[(i + k) % C.length]; g.fillRect(x, y, w, 2); x += w + 3; }
  }
  g.fillStyle = "#1d1d2c"; g.fillRect(0, 48, 96, 14);
  g.fillStyle = "#d97757"; g.fillRect(4, 52, 7, 5); g.fillRect(3, 54, 9, 1); g.fillStyle = "#14141d"; g.fillRect(6, 53, 1, 2); g.fillRect(9, 53, 1, 2);   // a small Clawd at the prompt
  g.fillStyle = "#e9e6ff"; g.fillRect(15, 54, 30 + Math.floor((t * 6) % 18), 2);
  if (Math.floor(t * 2) % 2) { g.fillStyle = "#d97757"; g.fillRect(47 + Math.floor((t * 6) % 18), 53, 2, 4); }
}
drawScreen(0, 0);
{ const s = plane(lid, 0.29, 0.187, new THREE.MeshBasicMaterial({ map: scrTex, color: new THREE.Color(1.25, 1.25, 1.25) }), 0, 0.106, -0.0046); s.rotation.y = Math.PI; }
{ const p = plane(lid, 0.105, 0.105, starMat, 0, 0.108, 0.0046); p.rotation.z = -0.1; }
const clawdSticker = painted(16, 11, (g) => { g.fillStyle = "#d97757"; g.fillRect(2, 0, 12, 8); g.fillRect(0, 4, 16, 2); g.fillRect(3, 8, 1, 2); g.fillRect(5, 8, 1, 2); g.fillRect(10, 8, 1, 2); g.fillRect(12, 8, 1, 2); g.fillStyle = "#14141d"; g.fillRect(4, 2, 1, 2); g.fillRect(11, 2, 1, 2); }, { mip: false });
plane(lid, 0.05, 0.034, new THREE.MeshBasicMaterial({ map: clawdSticker, transparent: true, alphaTest: 0.5 }), 0.105, 0.045, 0.0046).rotation.z = 0.15;
const screenGlow = new THREE.PointLight(0x9fc0ff, 0.16, 1.5, 1.2); screenGlow.position.set(0, 0.24, 0.0); laptop.add(screenGlow);

// ---------- Claude: the Claude Code block creature, to the measure of its own icon ----------
const ORANGE = 0xd97757, ORANGE_D = 0xb85f42;
const C = group(scene, 0.52, 0.46, benchZ + 0.03);
const cBody = group(C, 0, 0.085, 0);
mesh(cBody, new RoundedBoxGeometry(0.48, 0.32, 0.24, 2, 0.022), mat(ORANGE, { rim: 0.6 }), 0, 0.16, 0);
const cArms = [-1, 1].map((s) => mesh(cBody, new RoundedBoxGeometry(0.12, 0.08, 0.1, 1, 0.015), mat(ORANGE, { rim: 0.6 }), s * 0.28, 0.13, 0));
const cEyes = [-1, 1].map((s) => box(cBody, 0.04, 0.08, 0.012, 0x17111c, s * 0.14, 0.2, 0.121, { noShadow: true }));
const cLegs = [-0.18, -0.1, 0.1, 0.18].map((x) => box(C, 0.042, 0.095, 0.06, ORANGE_D, x, 0.045, 0.045, { rim: 0.6 }));

// ---------- Aling Nena, behind the grille with her pamaypay and her listahan ----------
// She is built from the hips up: nenaUp leans, the arms are two-bone chains (solved in 50-direct.js), the face is painted by drawNena (42-nena.js).
const NENA_SKIN = 0xb07548, nenaSkinM = mat(NENA_SKIN, { rim: 0.4 }), nenaSkinPlain = mat(NENA_SKIN);
const nena = group(store, -0.6, 0, -0.55);
const nenaUp = group(nena, 0, 0.9, 0);
const blouseM = mat(0xffffff, { map: TEX.floral("#c8478f") });
mesh(nenaUp, loft([[0, 0.2, 0.15], [0.2, 0.215, 0.165], [0.45, 0.205, 0.15], [0.6, 0.19, 0.125], [0.66, 0.09, 0.08]], 10, { e: 0.9 }), blouseM);
const nenaHead = group(nenaUp, 0, 0.68, 0.01);
const NFW = 144 * FS, NFH = 168 * FS;
var nenaReady = false;
const nenaCanvas = document.createElement("canvas"); nenaCanvas.width = NFW; nenaCanvas.height = NFH;
const nctx = nenaCanvas.getContext("2d");
const nenaTex = new THREE.CanvasTexture(nenaCanvas);
nenaTex.colorSpace = THREE.SRGBColorSpace; nenaTex.magFilter = THREE.NearestFilter; nenaTex.minFilter = THREE.LinearFilter; nenaTex.generateMipmaps = false;
const nenaFaceM = mat(0xffffff, { map: nenaTex, rim: 0.4 });
{
  const hg = loft([[0, 0.034, 0.034, 0, 0.022], [0.03, 0.064, 0.068, 0, 0.01], [0.075, 0.078, 0.086], [0.12, 0.081, 0.092], [0.165, 0.078, 0.09], [0.195, 0.06, 0.072], [0.21, 0.02, 0.026]], 14);
  const p = hg.attributes.position, uv = hg.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i) >= 0 ? 0.5 + p.getX(i) / 0.18 : 0.02, p.getY(i) / 0.21);
  mesh(nenaHead, hg, nenaFaceM);
  const bit = (x, y, z, sx, sy, sz, rx) => {                                  // nose parts wear the face texture, so they take its shading
    const g = new THREE.SphereGeometry(1, 8, 6), m = new THREE.Object3D();
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.x = rx; m.updateMatrix(); g.applyMatrix4(m.matrix);
    const q = g.attributes.position, u2 = g.attributes.uv;
    for (let i = 0; i < q.count; i++) u2.setXY(i, 0.5 + q.getX(i) / 0.18, q.getY(i) / 0.21);
    mesh(nenaHead, g, nenaFaceM, 0, 0, 0, { noShadow: true });
  };
  bit(0, 0.093, 0.0885, 0.0062, 0.0135, 0.0036, 0.25); bit(0, 0.0705, 0.0945, 0.0095, 0.0078, 0.0075, 0);
  for (const s of [-1, 1]) {
    mesh(nenaHead, new THREE.SphereGeometry(1, 7, 6), nenaSkinPlain, s * 0.081, 0.095, -0.004, { noShadow: true }).scale.set(0.011, 0.026, 0.018);        // ears
    mesh(nenaHead, new THREE.SphereGeometry(1, 5, 4), mat(0xe8c66a), s * 0.083, 0.07, 0.0, { noShadow: true }).scale.set(0.006, 0.009, 0.006);              // small gold earrings
  }
  // hair: dark, with grey coming through, pulled up into a bun
  const hairN = mat(0x2e262c, R), greyN = mat(0x9c9aa4, R), greyD = mat(0x7a7882, R);
  var NENA_HAIR = { hairN, greyN, greyD };                                      // a set can age her hair by changing these colours (episode 3 does)
  mesh(nenaHead, loft([[0.07, 0.06, 0.03, 0, -0.064], [0.11, 0.084, 0.06, 0, -0.04], [0.15, 0.088, 0.095, 0, -0.002], [0.178, 0.084, 0.1, 0, 0.002], [0.215, 0.05, 0.064, 0, -0.004], [0.224, 0.012, 0.016, 0, -0.006]], 12), hairN);
  const bun = mesh(nenaHead, new THREE.SphereGeometry(0.052, 9, 7), hairN, 0, 0.205, -0.088); bun.scale.set(1, 0.9, 0.95);
  const nr = rng(61);
  mesh(nenaHead, new THREE.BoxGeometry(0.003, 0.003, 0.05), mat(0xe8c66a), 0.03, 0.215, -0.09).rotation.y = 0.5;   // a hairpin
  // small round reading glasses, pushed down her nose
  const gf = mat(0xcaa24a, { glow: 0.8 }), glassTint = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.95, 0.85), transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const s of [-1, 1]) {
    const lg = group(nenaHead, s * 0.029, 0.08, 0.097); lg.rotation.y = s * 0.28; lg.rotation.x = 0.08;
    mesh(lg, new THREE.TorusGeometry(0.0135, 0.0015, 4, 14), gf, 0, 0, 0, { glow: 1 });
    mesh(lg, new THREE.CircleGeometry(0.0132, 12), glassTint, 0, 0, -0.0008);
    mesh(lg, unit, mat(0xffffff, { glow: 1.6 }), 0.007 * s, 0.006, 0.001, { glow: 1 }).scale.set(0.0035, 0.0012, 0.001);
    for (const [x, y, z, len, ry] of [[0.0585, 0.0845, 0.0725, 0.0496, 0.727], [0.0795, 0.088, 0.025, 0.055, 0.183]]) { const t = mesh(nenaHead, unit, gf, s * x, y, z, { glow: 1 }); t.scale.set(0.0018, 0.0022, len); t.rotation.y = -s * ry; }
  }
  mesh(nenaHead, unit, gf, 0, 0.0825, 0.0985, { glow: 1 }).scale.set(0.014, 0.002, 0.0025);
  mesh(nenaHead, new THREE.CylinderGeometry(0.04, 0.045, 0.06, 8), nenaSkinM, 0, -0.02, 0);                // neck
}
// arms: a rounded shoulder, a floral sleeve with a hem at the elbow, a tapering forearm, a slim hand (makeHand). nenaArm / nenaFore stay the right (fan) arm.
function nArm(s) {
  const up = group(nenaUp, s * 0.21, 0.57, 0.03);
  const sph = mesh(up, new THREE.SphereGeometry(0.066, 8, 6), blouseM); sph.scale.set(1.05, 0.95, 1);                 // a rounded shoulder under the sleeve
  mesh(up, limb(0.222, 0.062, 0.047), blouseM);                                                                      // the floral sleeve, to the elbow
  mesh(up, new THREE.CylinderGeometry(0.0485, 0.0485, 0.022, 10), mat(0xa3326f, R), 0, -0.222, 0);                  // its hem
  const fore = group(up, 0, -0.24, 0);
  mesh(fore, new THREE.SphereGeometry(0.0415, 8, 6), nenaSkinM);                                                      // the elbow
  mesh(fore, limb(0.235, 0.0405, 0.025), nenaSkinM);                                                                  // a forearm that tapers to a thin wrist
  const hand = group(fore, 0, -0.235, 0);
  const H = makeHand(hand, s, { skin: nenaSkinM, skin2: mat(0x9a6238, R), scale: 0.84, knuckles: true, bangle: true });
  return { up, fore, hand, H, s, pole: [s * 0.5, -1, -0.3] };
}
const nenaR = nArm(1), nenaL = nArm(-1);
const nenaArm = nenaR.up, nenaFore = nenaR.fore;
const fan = group(nenaFore, 0, -0.235, 0);
{ const f = mesh(fan, new THREE.CylinderGeometry(0.12, 0.12, 0.01, 7, 1, false, 0, Math.PI), mat(0xd9b56b, { side: 1 }), 0, -0.02, 0); f.rotation.set(Math.PI / 2, 0, Math.PI / 2); box(fan, 0.018, 0.1, 0.018, 0x7a4a2c, 0, 0.02, 0); }

// ---------- the cat, asleep where the light is warm ----------
const cat = group(scene, 1.72, 0, -0.5); cat.rotation.y = -0.5;
mesh(cat, new THREE.SphereGeometry(1, 8, 6), mat(0xf0ece2, R), 0, 0.075, 0).scale.set(0.17, 0.08, 0.11);
mesh(cat, new THREE.SphereGeometry(1, 7, 5), mat(0xe08a3c, R), 0.06, 0.09, 0.01).scale.set(0.09, 0.07, 0.1);
const catHead = group(cat, -0.17, 0.07, 0.04);
mesh(catHead, new THREE.SphereGeometry(0.06, 7, 6), mat(0xf0ece2, R)).scale.set(1, 0.85, 0.95);
const catEars = [-1, 1].map((s) => mesh(catHead, facet(new THREE.ConeGeometry(0.02, 0.04, 3)), mat(s > 0 ? 0xe08a3c : 0xf0ece2, R), -0.01, 0.055, s * 0.033));
const catTail = group(cat, 0.15, 0.05, 0.02);
for (let k = 0; k < 5; k++) mesh(catTail, new THREE.SphereGeometry(0.022 - k * 0.002, 5, 4), mat(k % 2 ? 0xe08a3c : 0xd67a2c, R), 0.03 + k * 0.035, 0, 0.03 * Math.sin(k * 0.9));
