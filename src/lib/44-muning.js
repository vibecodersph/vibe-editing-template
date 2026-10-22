// ---------- Muning: a puspin, the thin street cat of every sari-sari store, built in code like the rest of the cast ----------
// Nothing here runs until a set calls makeMuning, so a film that does not call it renders exactly as before.
//
// const m = makeMuning(parent, { at: [x, y, z], ry: 0, scale: 1, coat: "orange", kink: true, notch: true, whiskers: true, seed: 23 })
//   She stands on her own origin (paws at y 0) and faces +z: about 0.48 m from nose to rump, her ear tips about 0.36 m up standing.
//   coat "orange" (default): an orange tabby with a white muzzle, blaze, chest, belly and socks. coat "calico": white with orange and black patches.
//   kink: the bent tail tip many Philippine street cats have. notch: the left ear tipped flat, the mark of a neutered community cat.
// m.pose(p) poses her. Every key is optional and starts from the default, so m.pose({ pose: "sit" }) is a whole pose.
//   pose   "stand" | "sit" | "loaf", or the weights stand, sit, loaf (0..1, blended: a sit can rise into a stand over time)
//   ears   -1 flat back .. 0 relaxed .. 1 pricked forward        tail   -1 low .. 0 relaxed .. 1 straight up with a hooked tip
//   swish  0..1 how far the tail sweeps; phase (radians) drives it, so pass something like t * 3
//   blink  0..1 (0.5 is the slow blink)    pupil  0 slit .. 1 round    gx, gy  gaze -1..1 (x toward her left, y down)
//   yaw, pitch, roll  the head turn in radians (yaw + is toward her left, pitch + looks down)
// m.root is the group to place. m.head, m.ears (left first), m.tail (eight segment groups) and m.legs are there for a set that wants more.
// m.draw(face) repaints the face alone (face: blink, gx, gy, pupil). The tail keeps above the ground on its own when she sits or lies.
function makeMuning(parent, o = {}) {
  const calico = o.coat === "calico", kink = o.kink !== false, notch = o.notch !== false;
  const K = calico
    ? { base: "#f3eee6", a: "#e08a3a", aD: "#b8662a", b: "#2c2522", w: "#f3eee6", light: "#fbf8f2" }
    : { base: "#e2893a", a: "#e2893a", aD: "#b65d1f", b: "#b65d1f", w: "#f3eee6", light: "#f4c690" };
  const hex = (c) => parseInt(c.slice(1), 16), RM = { rim: 0.3 };
  const root = group(parent || scene, ...(o.at || [0, 0, 0]));
  root.rotation.y = o.ry || 0; root.scale.setScalar(o.scale || 1);
  const rnd = rng(o.seed ?? 23);

  // ----- the coat: one painted strip round the body. x runs round it (0 her left side, 16 the spine, 32 her right, 48 the belly), y from chest (top) to rump -----
  const coatTex = painted(64, 64, (g) => {
    g.fillStyle = K.base; g.fillRect(0, 0, 64, 64);
    const blob = (x, y, rx, ry, c, r = 0) => { g.fillStyle = c; for (const dx of [-64, 0, 64]) { g.beginPath(); g.ellipse(x + dx, y, rx, ry, r, 0, 7); g.fill(); } };
    if (calico) {
      blob(9, 22, 12, 14, K.b, 0.3); blob(24, 44, 13, 11, K.a, -0.2); blob(20, 12, 7, 6, K.a); blob(31, 30, 6, 8, K.b); blob(3, 52, 7, 6, K.a); blob(14, 60, 9, 5, K.b);
    } else {
      for (let k = 0; k < 9; k++) {                                     // tabby bands round the back and sides, a chevron that points to the rump
        const y = 8 + k * 5.4 + (rnd() - 0.5) * 1.6, w = 12 + rnd() * 3.5, th = 1.6 + rnd() * 1.1;
        g.fillStyle = K.aD; g.beginPath();
        g.moveTo(16 - w, y); g.lineTo(16, y + 2); g.lineTo(16 + w, y); g.lineTo(16 + w, y + th); g.lineTo(16, y + 2 + th); g.lineTo(16 - w, y + th); g.fill();
      }
      g.fillStyle = K.aD; g.fillRect(14.5, 0, 3, 64);                  // the dark line down the spine
    }
    for (let y = 0; y < 64; y++) {                                       // the white underside, widening over the chest; the rump end keeps its colour
      const v = 1 - (y + 0.5) / 64; if (v < 0.07) continue;
      const hw = (calico ? 12 : 6.5) + (v > 0.66 ? (v - 0.66) * 46 : 0) + (v < 0.2 ? -(0.2 - v) * 20 : 0);
      g.fillStyle = K.w; g.fillRect(48 - hw, y, hw * 2, 1); g.fillRect(48 - hw - 64, y, hw * 2, 1);
    }
  });
  const furM = mat(0xffffff, { map: coatTex, rim: 0.3 });
  const aM = mat(hex(K.a), RM), aDM = mat(hex(K.aD), RM), wM = mat(hex(K.w), RM), bM = mat(hex(K.b), RM);
  const stripeTex = calico ? null : painted(4, 16, (g) => { g.fillStyle = K.a; g.fillRect(0, 0, 4, 16); g.fillStyle = K.aD; for (const y of [4, 10]) g.fillRect(0, y, 4, 1); });
  const legM = calico ? wM : mat(0xffffff, { map: stripeTex, rim: 0.3 });

  // ----- a tube along a curve (torso and neck): the topology is fixed, pose() moves its rings -----
  const S = 10;
  function tube(n, v0, v1, vs) {
    const N = n * (S + 1), pos = new Float32Array((N + 2) * 3), uv = new Float32Array((N + 2) * 2), idx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j <= S; j++) { const k = i * (S + 1) + j; uv[k * 2] = j / S; uv[k * 2 + 1] = vs ? vs[i] : v0 + (v1 - v0) * (i / (n - 1)); }
    uv[N * 2] = 0.75; uv[N * 2 + 1] = vs ? vs[0] : v0; uv[N * 2 + 2] = 0.75; uv[N * 2 + 3] = vs ? vs[n - 1] : v1;
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < S; j++) { const a = i * (S + 1) + j, b = a + 1, c = a + S + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    for (let j = 0; j < S; j++) { const a = j; idx.push(N, a + 1, a); const e = (n - 1) * (S + 1) + j; idx.push(N + 1, e, e + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = mesh(root, g, furM); m.frustumCulled = false;
    return { g, n, m };
  }
  const _X = new THREE.Vector3(), _U = new THREE.Vector3(), _T = new THREE.Vector3(), _w = new THREE.Vector3();
  // rings: [{ c: Vector3 centre, t: Vector3 tangent, rx, ry }]; the side is her own x, "up" is the back of the tube
  function setTube(tb, rings) {
    const p = tb.g.attributes.position, N = tb.n * (S + 1);
    rings.forEach((r, i) => {
      _T.copy(r.t).normalize(); _X.set(1, 0, 0).addScaledVector(_T, -_T.x).normalize(); _U.crossVectors(_T, _X);
      for (let j = 0; j <= S; j++) {
        const a = (j / S) * Math.PI * 2, k = i * (S + 1) + j;
        _w.copy(r.c).addScaledVector(_X, Math.cos(a) * r.rx).addScaledVector(_U, Math.sin(a) * r.ry);
        p.setXYZ(k, _w.x, _w.y, _w.z);
      }
    });
    p.setXYZ(N, rings[0].c.x, rings[0].c.y, rings[0].c.z); const l = rings[tb.n - 1].c; p.setXYZ(N + 1, l.x, l.y, l.z);
    p.needsUpdate = true;
    tb.g.computeVertexNormals();
    const nm = tb.g.attributes.normal;
    for (let i = 0; i < tb.n; i++) {                                   // weld the seam
      const a = i * (S + 1), b = a + S, x = nm.getX(a) + nm.getX(b), y = nm.getY(a) + nm.getY(b), z = nm.getZ(a) + nm.getZ(b), L = Math.hypot(x, y, z) || 1;
      nm.setXYZ(a, x / L, y / L, z / L); nm.setXYZ(b, x / L, y / L, z / L);
    }
    tb.g.computeBoundingBox(); tb.g.computeBoundingSphere();
  }
  // the torso rings along the spine: [u, rx (half width), ry (half height), lift toward the back]
  const TR = [[0, 0.012, 0.014, 0], [0.035, 0.034, 0.04, 0], [0.11, 0.046, 0.054, 0], [0.24, 0.05, 0.06, 0], [0.4, 0.046, 0.055, 0.005], [0.55, 0.047, 0.058, 0.003],
    [0.7, 0.051, 0.066, 0], [0.82, 0.053, 0.07, 0], [0.9, 0.05, 0.066, -0.002], [0.96, 0.04, 0.052, 0], [1, 0.014, 0.018, 0]];
  const torso = tube(TR.length, 0, 1, TR.map((r) => r[0]));
  const NR = [[0.037, 0.04], [0.034, 0.037], [0.031, 0.034], [0.03, 0.032]];
  const neck = tube(NR.length, 0.8, 0.86);

  // ----- head: a rounded skull, the face painted on a canvas and projected from the front, a muzzle in three small bumps -----
  const HS = 1.1, head = group(root); head.scale.setScalar(HS);                   // a touch big for a real cat: it has to read on a phone
  const FSZ = 2, fc = document.createElement("canvas"); fc.width = 100 * FSZ; fc.height = 96 * FSZ;
  const fg = fc.getContext("2d");
  const faceTex = new THREE.CanvasTexture(fc);
  faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.magFilter = THREE.NearestFilter; faceTex.minFilter = THREE.LinearFilter; faceTex.generateMipmaps = false;
  const faceM = mat(0xffffff, { map: faceTex, rim: 0.3 });
  {
    const hg = loft([[-0.046, 0.012, 0.011, 0, 0.012], [-0.04, 0.027, 0.025, 0, 0.009], [-0.028, 0.041, 0.033, 0, 0.004], [-0.013, 0.048, 0.037, 0, 0.001], [0.004, 0.048, 0.039],
      [0.02, 0.0445, 0.039, 0, -0.002], [0.033, 0.037, 0.036, 0, -0.005], [0.043, 0.026, 0.028, 0, -0.008], [0.05, 0.009, 0.01, 0, -0.01]], 14, { e: 0.95 });
    // one uv per triangle: a triangle on the back of the skull takes the fur at the canvas edge whole, so no triangle across the back
    // stretches the face round the head (the normals are the smooth ones of the indexed shape)
    const hn = hg.toNonIndexed(), p = hn.attributes.position, uv = hn.attributes.uv;
    for (let i = 0; i < p.count; i += 3) {
      const back = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3 < -0.004;
      for (let k = i; k < i + 3; k++) uv.setXY(k, back ? 0.006 : 0.5 + p.getX(k) * 10, (p.getY(k) + 0.046) / 0.096);
    }
    mesh(head, hn, faceM);
    const bit = (x, y, z, sx, sy, sz) => {
      const g = new THREE.SphereGeometry(1, 8, 6); g.scale(sx, sy, sz); g.translate(x, y, z);
      const q = g.attributes.position, u2 = g.attributes.uv;
      for (let i = 0; i < q.count; i++) u2.setXY(i, 0.5 + q.getX(i) * 10, (q.getY(i) + 0.046) / 0.096);
      mesh(head, g, faceM, 0, 0, 0, { noShadow: true });
    };
    for (const s of [-1, 1]) bit(s * 0.0105, -0.0195, 0.035, 0.0125, 0.0105, 0.0115);     // the whisker pads
    bit(0, -0.031, 0.029, 0.012, 0.0085, 0.011);                                            // the chin
    bit(0, -0.0105, 0.0405, 0.0065, 0.0048, 0.0055);                                        // the nose
    if (o.whiskers !== false) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {          // each from its own root on the pad, fanned and swept back
      const e = (1 - k) * 0.14, len = 0.05 - Math.abs(1 - k) * 0.006, dir = new THREE.Vector3(s * Math.cos(e) * Math.cos(0.32), Math.sin(e), -Math.cos(e) * Math.sin(0.32));
      const wk = mesh(head, unit, mat(0xf4f1ea, { glow: 0.85 }), 0, 0, 0, { noShadow: true });
      wk.position.set(s * 0.017, -0.0185 + (k - 1) * 0.0036, 0.042).addScaledVector(dir, len / 2);
      wk.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir); wk.scale.set(len, 0.0016, 0.0016);
    }
  }
  // ears: thin four-sided cones, a pink inside; the tipped one is cut flat
  const ears = [1, -1].map((s) => {
    const g = group(head, s * 0.027, 0.033, -0.006);
    const tipped = notch && s > 0, outM = calico ? (s > 0 ? aM : bM) : aM;
    const og = tipped ? new THREE.CylinderGeometry(0.006, 0.0215, 0.04, 4) : new THREE.ConeGeometry(0.0215, 0.048, 4);
    og.rotateY(Math.PI / 4); og.translate(0, tipped ? 0.02 : 0.024, 0);
    mesh(g, og, outM).scale.z = 0.42;
    const ig = tipped ? new THREE.CylinderGeometry(0.004, 0.015, 0.03, 4) : new THREE.ConeGeometry(0.015, 0.036, 4);
    ig.rotateY(Math.PI / 4); ig.translate(0, tipped ? 0.017 : 0.02, 0);
    mesh(g, ig, mat(0xd9979b, RM), 0, 0.001, 0.0058, { noShadow: true }).scale.z = 0.3;
    return { g, s };
  });

  // ----- legs: each a chain in the plane of its side, posed by solving two bones to the paw -----
  const sph = (r) => new THREE.SphereGeometry(r, 7, 5);
  const legs = [];
  for (const s of [1, -1]) {                                             // front legs: shoulder, upper arm, forearm (white sock), paw
    const up = group(root); mesh(up, sph(0.026), aM); mesh(up, limb(0.1, 0.024, 0.017, 7), legM);
    const lo = group(up, 0, -0.1, 0); mesh(lo, sph(0.017), wM); mesh(lo, limb(0.095, 0.0165, 0.013, 7), wM);
    const paw = group(lo, 0, -0.095, 0); mesh(paw, sph(1), wM, 0, -0.006, 0.009).scale.set(0.015, 0.011, 0.021);
    legs.push({ front: true, s, up, lo, paw });
  }
  for (const s of [1, -1]) {                                             // hind legs: haunch and thigh, shin, the long foot (white), paw
    const th = group(root);
    mesh(th, sph(1), calico ? (s > 0 ? aM : bM) : aM, 0, -0.04, 0.002).scale.set(0.026, 0.06, 0.05);
    mesh(th, limb(0.09, 0.026, 0.019, 7), legM);
    const sh = group(th, 0, -0.09, 0); mesh(sh, sph(0.019), calico ? wM : aM); mesh(sh, limb(0.095, 0.0175, 0.012, 7), calico ? wM : legM);
    const mt = group(sh, 0, -0.095, 0); mesh(mt, sph(0.0125), wM); mesh(mt, limb(0.06, 0.0125, 0.011, 7), wM);
    const paw = group(mt, 0, -0.06, 0); mesh(paw, sph(1), wM, 0, -0.004, 0.011).scale.set(0.015, 0.0105, 0.023);
    legs.push({ front: false, s, th, sh, mt, paw });
  }

  // ----- tail: eight segments, ringed on the tabby, ending in a round tip -----
  const TL_SEG = 0.034, tail = [];
  {
    let par = root;
    for (let i = 0; i < 8; i++) {
      const g = group(par, 0, 0, i ? -TL_SEG : 0), r0 = 0.0155 - i * 0.00095, r1 = r0 - 0.00095;
      const cg = new THREE.CylinderGeometry(r0, r1, TL_SEG, 7); cg.rotateX(Math.PI / 2); cg.translate(0, 0, -TL_SEG / 2);
      const m = calico ? (i < 3 ? bM : i < 6 ? aM : bM) : (i % 2 ? aDM : aM);
      mesh(g, cg, m); mesh(g, sph(r0), m);
      g.userData.r = r1; tail.push(g); par = g;
    }
    mesh(par, sph(0.0068), calico ? bM : aDM, 0, 0, -TL_SEG);
  }

  // ----- the face, painted -----
  function drawCat(f) {
    const g = fg; g.setTransform(FSZ, 0, 0, FSZ, 0, 0); g.lineCap = "round"; g.lineJoin = "round";
    const bl = clamp01(f.blink || 0), gx = Math.max(-1, Math.min(1, f.gx || 0)), gy = Math.max(-1, Math.min(1, f.gy || 0)), pu = clamp01(f.pupil ?? 0.25);
    const ell = (x, y, rx, ry, col, r = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); g.fill(); };
    g.fillStyle = K.base; g.fillRect(0, 0, 100, 96);
    if (calico) {
      ell(76, 24, 27, 25, K.a, 0.2); ell(22, 20, 25, 22, K.b, -0.3); ell(4, 52, 10, 16, K.b);
    } else {
      g.fillStyle = K.aD;                                                // the M on the forehead and the stripes over the crown
      for (const [x, w, y0, y1] of [[50, 2.4, 0, 28], [43.5, 1.9, 2, 23], [56.5, 1.9, 2, 23], [37, 1.7, 4, 18], [63, 1.7, 4, 18]]) { g.beginPath(); g.moveTo(x - w, y0); g.lineTo(x + w, y0); g.lineTo(x + w * 0.4, y1); g.lineTo(x - w * 0.4, y1); g.fill(); }
      g.strokeStyle = K.aD; g.lineWidth = 2.2;                           // cheek stripes from the outer corners of the eyes
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(50 + s * 29, 46); g.quadraticCurveTo(50 + s * 39, 48, 50 + s * 49, 44); g.stroke();
        g.beginPath(); g.moveTo(50 + s * 31, 55); g.quadraticCurveTo(50 + s * 41, 58, 50 + s * 49, 57); g.stroke();
      }
    }
    g.fillStyle = K.w;                                                   // the white muzzle and chin, and a narrow blaze up the nose
    g.beginPath(); g.moveTo(46.2, 64); g.lineTo(48.3, 41); g.lineTo(50, 34); g.lineTo(51.7, 41); g.lineTo(53.8, 64); g.fill();
    ell(40.5, 71, 11.5, 9.5, K.w); ell(59.5, 71, 11.5, 9.5, K.w); ell(50, 80, 12.5, 12, K.w); ell(50, 91, 17, 8, K.w);
    g.fillStyle = "rgba(118,74,58,0.6)";                                 // whisker roots
    for (const s of [-1, 1]) for (const [x, y] of [[6.5, 68], [10, 70.5], [13.5, 68.5], [8.5, 73], [12.5, 73.8]]) g.fillRect(50 + s * x - 0.6, y - 0.6, 1.2, 1.2);
    for (const s of [-1, 1]) {
      const ex = 50 + s * 17.5, ey = 42, rx = 10.5, ry = 8.2, lidC = calico ? (s > 0 ? K.a : K.b) : "#d6843e";
      g.save(); g.translate(ex, ey); g.rotate(-s * 0.2);
      ell(0, 0, rx + 2.6, ry + 2.4, calico && s < 0 ? "#4a4038" : K.light);          // pale fur round the eye
      ell(0, 0, rx + 1.1, ry + 1.1, "#24140e");                                         // the dark rim
      const ir = g.createRadialGradient(0, 0, 0.5, 0, 0, rx); ir.addColorStop(0, "#e1cf55"); ir.addColorStop(0.55, "#a6a632"); ir.addColorStop(1, "#6f7a28");
      g.fillStyle = ir; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
      g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.clip();
      const px = gx * 3.6, py = gy * 2.6;
      ell(px, py, 1.6 + 4.6 * pu, ry * 0.95 - pu * 1.6, "#120c0a");                    // the pupil, a slit in daylight, round in the dark
      ell(px + 2.7, py - 3.3, 1.6, 1.6, "#fffdf4"); ell(px - 2.4, py + 3.4, 0.8, 0.8, "rgba(255,250,235,0.6)");
      g.restore();
      if (bl > 0.02) {                                                                  // the upper lid comes down
        const yl = -ry - 1.2 + (2 * ry + 2.4) * Math.min(1, bl);
        g.save(); g.beginPath(); g.ellipse(0, 0, rx + 1.2, ry + 1.2, 0, 0, Math.PI * 2); g.clip();
        g.fillStyle = lidC; g.fillRect(-rx - 3, -ry - 3, 2 * rx + 6, yl + ry + 3); g.restore();
        const yy = bl > 0.92 ? ry * 0.3 : Math.min(yl, ry * 0.95), w = rx * Math.sqrt(Math.max(0.05, 1 - (yy / (ry + 1)) ** 2));
        g.strokeStyle = "#24140e"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-w, yy); g.quadraticCurveTo(0, yy + (bl > 0.92 ? 3 : 1.2), w, yy); g.stroke();
      }
      g.restore();
    }
    g.fillStyle = "#d77b84";                                             // the nose: a rounded triangle, pink
    g.beginPath(); g.moveTo(45.3, 59); g.quadraticCurveTo(50, 57.4, 54.7, 59); g.lineTo(51.1, 64.6); g.quadraticCurveTo(50, 65.6, 48.9, 64.6); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,222,226,0.75)"; g.fillRect(48.4, 59, 2.6, 1.3);
    g.strokeStyle = "#6a4038"; g.lineWidth = 1.15;                       // the mouth: a short line down, and the two curves
    g.beginPath(); g.moveTo(50, 65.4); g.lineTo(50, 69); g.quadraticCurveTo(47, 72.6, 43.4, 70.6); g.moveTo(50, 69); g.quadraticCurveTo(53, 72.6, 56.6, 70.6); g.stroke();
    faceTex.needsUpdate = true;
  }

  // ----- poses -----
  // each: spine p0 (rump), p1, p2 (chest) as [y, z]; hd head centre; hp head pitch; fz, hz front and hind paw z; hx, fx half the stance width;
  // meta the hind foot's angle (-pi/2 lies flat on the ground); tb tail base [pitch, heading]; tp, ty the pitch and heading added at each segment
  const POSES = {
    stand: { p0: [0.185, -0.19], p1: [0.212, 0], p2: [0.198, 0.18], hd: [0.29, 0.245], hp: 0.12, fz: 0.155, hz: -0.165, hx: 0.04, fx: 0.034, meta: -0.25,
      tb: [-0.95, 0], tp: [0.14, 0.14, 0.14, 0.14, 0.15, 0.16, 0.17, 0.17], ty: [0, 0, 0, 0, 0, 0, 0, 0] },
    sit: { p0: [0.075, -0.085], p1: [0.135, -0.035], p2: [0.24, 0.045], hd: [0.335, 0.08], hp: 0, fz: 0.085, hz: 0.035, hx: 0.05, fx: 0.032, meta: -Math.PI / 2,
      tb: [-1.45, -0.5], tp: [0, 0.45, 0.55, 0.45, 0, 0, 0, 0], ty: [-0.2, -0.4, -0.45, -0.5, -0.5, -0.45, -0.4, -0.3] },
    loaf: { p0: [0.07, -0.17], p1: [0.075, -0.01], p2: [0.08, 0.13], hd: [0.155, 0.19], hp: -0.05, fz: 0.045, hz: -0.03, hx: 0.05, fx: 0.03, meta: -Math.PI / 2,
      tb: [-1.2, -0.45], tp: [0, 0.25, 0.35, 0.35, 0.25, 0, 0, 0], ty: [-0.2, -0.35, -0.4, -0.45, -0.45, -0.4, -0.35, -0.3] },
  };
  const TAIL_UP = { tb: [1.25, 0], tp: [0.05, 0.03, 0.02, 0.02, 0.05, 0.25, 0.45, 0.5], ty: [0, 0, 0, 0, 0, 0, 0, 0] };
  const TAIL_LOW = { tb: [-1.35, 0], tp: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05], ty: [0, 0, 0, 0, 0, 0, 0, 0] };
  const EAR = { up: [0.15, 0, 0.18], mid: [0, 0.15, 0.32], flat: [-0.75, 0.6, 1.05] };          // [pitch, yaw outward, tilt outward]
  const NAMES = ["stand", "sit", "loaf"];
  const mix = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * u) : a + (b - a) * u);
  const ik2 = (Ay, Az, Ty, Tz, a, b, fwd) => {                            // two bones in the y-z plane; an angle th points a bone along (-cos th, -sin th)
    let d = Math.hypot(Ty - Ay, Tz - Az); d = Math.min(Math.max(d, Math.abs(a - b) + 1e-4), (a + b) * 0.9995);
    const base = Math.atan2(-(Tz - Az), -(Ty - Ay)), gam = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
    const t1 = fwd ? base - gam : base + gam, Ey = Ay - a * Math.cos(t1), Ez = Az - a * Math.sin(t1);
    return [t1, Math.atan2(-(Tz - Ez), -(Ty - Ey))];
  };
  const _e = new THREE.Vector3(), _hv = new THREE.Vector3(), _ax = new THREE.Vector3(), _X1 = new THREE.Vector3(1, 0, 0);
  const _qa = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qs = new THREE.Quaternion(), _eu = new THREE.Euler();
  let faceKey = "";
  function pose(p = {}) {
    const w = { stand: p.stand || 0, sit: p.sit || 0, loaf: p.loaf || 0 };
    if (p.pose) { for (const n of NAMES) w[n] = 0; w[p.pose] = 1; }
    let tot = w.stand + w.sit + w.loaf; if (tot < 1e-6) { w.stand = 1; tot = 1; }
    const Q = {};
    const add = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => v + b[i] * u) : a + b * u);
    for (const k in POSES.stand) Q[k] = NAMES.reduce((acc, n) => add(acc, POSES[n][k], w[n] / tot), Array.isArray(POSES.stand[k]) ? POSES.stand[k].map(() => 0) : 0);
    // the spine, a quadratic curve from rump to chest
    const B = (u) => new THREE.Vector3(0, (1 - u) ** 2 * Q.p0[0] + 2 * u * (1 - u) * Q.p1[0] + u * u * Q.p2[0], (1 - u) ** 2 * Q.p0[1] + 2 * u * (1 - u) * Q.p1[1] + u * u * Q.p2[1]);
    const D = (u) => new THREE.Vector3(0, 2 * (1 - u) * (Q.p1[0] - Q.p0[0]) + 2 * u * (Q.p2[0] - Q.p1[0]), 2 * (1 - u) * (Q.p1[1] - Q.p0[1]) + 2 * u * (Q.p2[1] - Q.p1[1])).normalize();
    const UP = (u) => { const t = D(u); return new THREE.Vector3(0, t.z, -t.y); };
    setTube(torso, TR.map(([u, rx, ry, lift]) => ({ c: B(u).addScaledVector(UP(u), lift), t: D(u), rx, ry })));
    // head and neck
    head.position.set(0, Q.hd[0], Q.hd[1]);
    head.rotation.set(Q.hp + (p.pitch || 0), p.yaw || 0, p.roll || 0, "YXZ");
    const n0 = B(0.93).addScaledVector(UP(0.93), 0.03), n1 = _hv.set(0, -0.028 * HS, -0.018 * HS).applyEuler(head.rotation).add(head.position).clone();
    const nt = n1.clone().sub(n0);
    setTube(neck, NR.map(([rx, ry], i) => ({ c: n0.clone().lerp(n1, i / (NR.length - 1)), t: nt, rx, ry })));
    // legs
    const sh = B(0.84).addScaledVector(UP(0.84), -0.022), hp = B(0.15).addScaledVector(UP(0.15), -0.012);
    for (const L of legs) {
      if (L.front) {
        L.up.position.set(L.s * Q.fx, sh.y, sh.z);
        const [t1, t2] = ik2(sh.y, sh.z, 0.017, Q.fz, 0.1, 0.095, false);
        L.up.rotation.set(t1, 0, 0); L.lo.rotation.set(t2 - t1, 0, 0); L.paw.rotation.set(-t2, 0, 0);
      } else {
        L.th.position.set(L.s * Q.hx, hp.y, hp.z);
        const hy = 0.0145 + 0.06 * Math.cos(Q.meta), hz = Q.hz + 0.06 * Math.sin(Q.meta);
        const [t1, t2] = ik2(hp.y, hp.z, hy, hz, 0.09, 0.095, true);
        L.th.rotation.set(t1, 0, 0); L.sh.rotation.set(t2 - t1, 0, 0); L.mt.rotation.set(Q.meta - t2, 0, 0); L.paw.rotation.set(-Q.meta, 0, 0);
      }
    }
    // tail: the pose's carriage, raised or lowered, a swish travelling down it, the kink at the tip, then kept off the ground
    const tl = p.tail || 0, T = tl >= 0 ? { tb: mix(Q.tb, TAIL_UP.tb, tl), tp: mix(Q.tp, TAIL_UP.tp, tl), ty: mix(Q.ty, TAIL_UP.ty, tl) } : { tb: mix(Q.tb, TAIL_LOW.tb, -tl), tp: mix(Q.tp, TAIL_LOW.tp, -tl), ty: mix(Q.ty, TAIL_LOW.ty, -tl) };
    // each segment's direction is built in her own frame (pitch up from level, heading round the vertical, + toward her right), so a
    // curl along the ground stays on the ground; the segment's local turn is then what is left after its parent's
    const pos = B(0.03).addScaledVector(UP(0.03), 0.02), sw = p.swish || 0, ph = p.phase || 0;
    tail[0].position.copy(pos);
    let pa = 0, ha = 0;
    _qp.identity();
    tail.forEach((g, i) => {
      pa += T.tp[i] + (i ? 0 : T.tb[0]) + (kink && i === 7 ? 0.75 : 0) + (kink && i === 6 ? 0.2 : 0);
      ha += T.ty[i] + (i ? 0 : T.tb[1]) + (kink && i === 7 ? 0.55 : 0);
      const fl = g.userData.r + 0.0015;                                    // its end stays above the ground
      if (pos.y + TL_SEG * Math.sin(pa) < fl) pa = Math.asin(Math.max(-1, Math.min(1, (fl - pos.y) / TL_SEG)));
      _qa.setFromEuler(_eu.set(pa, ha, 0, "YXZ"));
      _e.set(0, 0, -1).applyQuaternion(_qa);
      const w = sw * 0.3 * Math.sin(ph - i * 0.55) * (0.5 + i / 8);         // the swish leans each segment sideways, whatever way it points
      if (w) { _ax.crossVectors(_e, _X1); if (_ax.lengthSq() > 1e-6) { _qs.setFromAxisAngle(_ax.normalize(), w); _qa.premultiply(_qs); _e.applyQuaternion(_qs); } }
      g.quaternion.copy(_qp).invert().multiply(_qa);
      _qp.copy(_qa);
      pos.addScaledVector(_e, TL_SEG);
    });
    // ears
    const e = Math.max(-1, Math.min(1, p.ears || 0)), E = e >= 0 ? mix(EAR.mid, EAR.up, e) : mix(EAR.mid, EAR.flat, -e);
    for (const { g, s } of ears) g.rotation.set(E[0], s * E[1], -s * E[2]);
    // the face, only when it changed
    const f = { blink: p.blink || 0, gx: p.gx || 0, gy: p.gy || 0, pupil: p.pupil ?? 0.25 }, k = JSON.stringify(f);
    if (k !== faceKey) { faceKey = k; drawCat(f); }
  }
  pose({});
  return { root, head, ears: ears.map((x) => x.g), tail, legs, pose, draw: (f) => { faceKey = ""; drawCat(f); }, faceTex };
}
