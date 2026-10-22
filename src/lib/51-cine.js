// ---------- the virtual cinematographer: a shot named by intent is solved into a camera from where the cast really stands ----------
// A line's "shot" may be a grammar string instead of a camera table entry (docs/cinematography.md has the numbers and the reasons):
//   ecu|cu|mcu|ms|ws:<who>   a single (ws: the whole figure)      pov:<who>   frontal single from the other principal's eye line
//   ots:<who>   over the other principal's shoulder onto <who>     two | ws   both principals (ws: the wide)
//   duo:<who>+<object>   <who> and a prop (the laptop) together    insert:<object>   the object square-on, 88 percent of the frame wide
// <who> is buloy (also "viron"), claude or nena. Order of lookup for a name: SET.shots (hand-placed) -> script "cine_shots" -> grammar -> the base table.
// Each cut is solved ONCE at init: the cast and the set are posed at the cut's first moment (renderAt(t, { solve: true })), the subjects are read and the camera
// is stored on the cut. Rendering any frame afterwards is a pure function of (cut, t): the stored camera, the push, the arc, the zoom and the breath.
// This file ends by drawing the first frame, so everything above is defined before 50-direct.js draws anything.
const CINE = (() => {
  const D2R = Math.PI / 180, ASP = 9 / 16, FW_PX = 1080, FH_PX = 1920;
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const tanHalf = (fov) => Math.tan(fov * D2R / 2);
  const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const rotY = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return V3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
  const hor = (v) => { const h = V3(v.x, 0, v.z); return h.lengthSq() > 1e-8 ? h.normalize() : V3(0, 0, 1); };
  const lerpN = (a, b, w) => a + (b - a) * w;
  const ST = { side: 0, warnings: [], blink: 1, lastFace: null, rawDraw: null, baseFog: undefined, key: null, rim: null, fog: null, forced: {}, objects: {}, solving: false, rcCache: null, t: 0, ln: null, cutNow: null };
  const CANON = { buloy: "buloy", viron: "buloy", claude: "claude", nena: "nena" };
  const canon = (w) => CANON[w] || null;
  const otherOf = (w) => (w === "buloy" ? "claude" : "buloy");
  const setCfg = () => (typeof SET !== "undefined" && SET.cine) || {};
  const shownLite = (o) => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; };

  // ---------- the numbers (the director's; docs/cinematography.md says why) ----------
  const BSIZE = { ecu: 0.50, cu: 0.34, mcu: 0.22, ms: 0.14 }, BEYE = { ecu: 0.42, cu: 0.38, mcu: 0.34, ms: 0.32 };          // Buloy: crown-to-chin / frame height; eye line from the top
  const CSIZE = { ecu: 0.62, cu: 0.44, mcu: 0.30, ms: 0.20 }, CEYE = { ecu: 0.52, cu: 0.48, mcu: 0.45, ms: 0.45 };          // Claude: body-box height / frame height
  const FOVT = { ecu: 26, cu: 30, mcu: 34, ms: 38, two: 44, ws: 50, duo: 40, insert: 30, ots: 36, pov: 30 };                  // vertical fov, degrees
  const SINGLES = ["ecu", "cu", "mcu", "ms", "pov"];
  const EYE_SHAPES = {                                                                                                         // sx, sy: the box (m; neutral is 0.04 x 0.08); rz: degrees, + leans the top inward; dx, dy: shift
    neutral: { sx: 0.04, sy: 0.08, rz: 0, dx: 0, dy: 0 },
    flat: { sx: 0.052, sy: 0.0144, rz: 0, dx: 0, dy: 0 },            // deadpan: about 18 percent of the height
    dot: { sx: 0.044, sy: 0.044, rz: 0, dx: 0, dy: 0 },              // alert: small squares, 55 percent
    soft: { sx: 0.04, sy: 0.06, rz: -8, dx: 0, dy: 0 },              // sheepish: shorter, tilted outward
    sad: { sx: 0.04, sy: 0.07, rz: 15, dx: 0, dy: 0 },               // tilted 15 degrees inward
    wide: { sx: 0.05, sy: 0.1, rz: 0, dx: 0, dy: 0 },
    squint: { sx: 0.056, sy: 0.024, rz: -5, dx: 0, dy: 0 },
    "side-l": { sx: 0.04, sy: 0.08, rz: 0, dx: -0.024, dy: 0 },
    "side-r": { sx: 0.04, sy: 0.08, rz: 0, dx: 0.024, dy: 0 },
    happy: { sx: 0.056, sy: 0.034, rz: 0, dx: 0, dy: 0.025 },        // squashed and raised
    closed: { sx: 0.054, sy: 0.008, rz: 0, dx: 0, dy: 0 },
  };

  // ---------- subjects: where a head (Claude: the body) is, in the world ----------
  const SD = {
    buloy: { node: () => vHead, root: () => V, eyes: [[-0.0365, 0.142, 0.099], [0.0365, 0.142, 0.099]], crown: [0, 0.272, 0], chin: [0, 0, 0.04], box: [0.09, 0, 0.272, -0.1, 0.105], torso: () => ({ node: vUpper, box: [0.21, -0.12, 0.56, -0.15, 0.16] }) },
    claude: { node: () => cBody, root: () => C, eyes: [[-0.14, 0.2, 0.127], [0.14, 0.2, 0.127]], crown: [0, 0.32, 0], chin: [0, 0, 0], box: [0.24, 0, 0.32, -0.12, 0.12], face: [0.2, 0.1, 0.3, 0.1, 0.125] },
    nena: { node: () => nenaHead, root: () => nena, eyes: [[-0.0285, 0.1, 0.095], [0.0285, 0.1, 0.095]], crown: [0, 0.215, 0], chin: [0, 0, 0.02], box: [0.085, 0, 0.215, -0.09, 0.095], torso: () => ({ node: nenaUp, box: [0.2, 0, 0.7, -0.15, 0.15] }) },
  };
  const corners = (node, b) => { const o = []; for (const x of [-1, 1]) for (const y of [b[1], b[2]]) for (const z of [b[3], b[4]]) o.push(node.localToWorld(V3(x * b[0], y, z))); return o; };
  function subject(name) {                                                             // { who, eye, eyes, crown, chin, h, fwd, box (8 corners), figure, ... } in world metres
    const who = canon(name), d = who && SD[who];
    if (!d) throw new Error("cine: no subject \"" + name + "\" (buloy, claude or nena)");
    const node = d.node(), root = d.root();
    root.updateWorldMatrix(true, true);
    const eyes = d.eyes.map((e) => node.localToWorld(V3(...e))), eye = eyes[0].clone().add(eyes[1]).multiplyScalar(0.5);
    const crown = node.localToWorld(V3(...d.crown)), chin = node.localToWorld(V3(...d.chin));
    const gaze = V3(0, 0, 1).transformDirection(node.matrixWorld);
    const box = corners(node, d.box), figure = box.slice();
    if (d.torso) { const T = d.torso(); T.node.updateWorldMatrix(true, false); figure.push(...corners(T.node, T.box)); }
    const fl = root.getWorldPosition(V3()); for (const x of [-0.2, 0.2]) for (const z of [-0.08, 0.3]) figure.push(root.localToWorld(V3(x, 0, z)));
    return { who, node, root, eye, eyes, crown, chin, h: crown.distanceTo(chin), fwd: hor(gaze), gaze, box, lbox: d.box, lface: d.face || d.box, figure, floorY: fl.y };
  }

  // ---------- objects: a registered thing, or a prop by name (the laptop) ----------
  function objectInfo(name) {                                                          // { c: centre, n: front normal or null, w, h, pts: corners, prop }
    const reg = ST.objects[name] || (setCfg().objects || {})[name];                  // SET.cine.objects: { name: () => ({ c, n, w, h, pts }) } (a set or stage.js lists what is not a prop with a screen)
    if (reg) return reg();
    const P = (typeof GRIP !== "undefined" ? GRIP.props : []).find((p) => p.name === name);
    if (!P) throw new Error("cine: no object \"" + name + "\" (CINE.register(\"" + name + "\", () => ({ c, n, w, h, pts })) or name a prop made with makeProp)");
    P.g.updateWorldMatrix(true, true);
    if (P.screens && P.screens.length) {                                               // a screen: its centre, its front, its real size
      const S = P.screens[0], n = S.node, sc = V3().setFromMatrixScale(n.matrixWorld), pts = [];
      for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) pts.push(n.localToWorld(V3(x * S.w, y * S.h, 0)));
      return { c: n.getWorldPosition(V3()), n: V3(0, 0, 1).transformDirection(n.matrixWorld), w: S.w * sc.x, h: S.h * sc.y, pts, prop: P };
    }
    const b = new THREE.Box3(); P.g.traverse((m) => { if (m.isMesh && shownLite(m)) b.expandByObject(m, false); });
    const c = b.getCenter(V3()), s = b.getSize(V3()), pts = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(V3(x, y, z));
    return { c, n: null, w: Math.max(s.x, s.z), h: s.y, pts, prop: P };
  }

  // ---------- projection and aim ----------
  function basis(yaw, pitch) {
    const f = V3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)), r = V3(Math.cos(yaw), 0, Math.sin(yaw));
    return { f, r, u: V3().crossVectors(r, f), yaw, pitch };
  }
  function project(p, cam, B, fov) {                                                   // screen fractions from the left and from the top; null behind the camera
    const v = p.clone().sub(cam), Z = v.dot(B.f); if (Z < 0.02) return null;
    const tv = tanHalf(fov);
    return { sx: (v.dot(B.r) / (Z * tv * ASP) + 1) / 2, sy: (1 - v.dot(B.u) / (Z * tv)) / 2, z: Z };
  }
  function aim(cam, fov, pts, tg) {                                                    // yaw and pitch (no roll) that put each point at its screen fraction [x, y from the top], on average
    const tv = tanHalf(fov), th = tv * ASP, c = V3();
    pts.forEach((p) => c.add(p)); c.multiplyScalar(1 / pts.length).sub(cam);
    let yaw = Math.atan2(c.x, -c.z), pitch = Math.atan2(c.y, Math.hypot(c.x, c.z));
    for (let it = 0; it < 12; it++) {
      const B = basis(yaw, pitch); let ex = 0, ey = 0, n = 0;
      pts.forEach((p, k) => {
        const v = p.clone().sub(cam), Z = v.dot(B.f); if (Z < 0.01) return;
        ex += Math.atan2(v.dot(B.r), Z) - Math.atan((tg[k][0] * 2 - 1) * th); ey += Math.atan2(v.dot(B.u), Z) - Math.atan((1 - tg[k][1] * 2) * tv); n++;
      });
      if (!n) break; yaw += ex / n; pitch += ey / n;
    }
    return basis(yaw, pitch);
  }
  const rectOf = (pts, cam, B, fov) => {                                               // the screen box (fractions) of some points; inN: how many are inside the frame
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9, inN = 0;
    for (const p of pts) { const q = project(p, cam, B, fov); if (!q) return null; x0 = Math.min(x0, q.sx); x1 = Math.max(x1, q.sx); y0 = Math.min(y0, q.sy); y1 = Math.max(y1, q.sy); if (q.sx >= 0 && q.sx <= 1 && q.sy >= 0 && q.sy <= 1) inN++; }
    return { x0, x1, y0, y1, inN };
  };

  // ---------- what is in the way: scene meshes, boxes a camera could sit inside ----------
  function solidMeshes() {
    const o = [];
    scene.traverseVisible((m) => {
      if (!m.isMesh || !m.geometry || m.userData.noRaycast) return;
      const mt = m.material; if (!mt || mt.depthTest === false || mt.visible === false || (mt.opacity !== undefined && mt.opacity < 0.1) || (mt.transparent && mt.opacity < 0.5)) return;
      for (let n = m; n; n = n.parent) if (n === sky) return;
      o.push(m);
    });
    return o;
  }
  const under = (m, root) => { for (let n = m; n; n = n.parent) if (n === root) return true; return false; };
  const _ray = new THREE.Raycaster(), _inv = new THREE.Matrix4();
  function occluded(cam, pt, meshes, skip, near) {                                     // is a mesh (not under a skipped root) between the camera and the point? Hits nearer than the near plane are clipped, so they do not count
    const d = pt.clone().sub(cam), L = d.length(); if (L < 0.01) return false;
    _ray.set(cam, d.multiplyScalar(1 / L)); _ray.near = near; _ray.far = L - 0.012;
    for (const h of _ray.intersectObjects(meshes, false)) if (!skip.some((r) => under(h.object, r))) return true;
    return false;
  }
  function insideSolid(p, meshes, skip, clear = 0.03) {                                // a camera inside a box-shaped thing (a wall, a desk, a chair)
    for (const m of meshes) {
      const g = m.geometry; if (g.type !== "BoxGeometry" || skip.some((r) => under(m, r))) continue;
      const e = m.matrixWorld.elements, sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]);
      if (Math.max(g.parameters.width * sx, g.parameters.height * sy, g.parameters.depth * sz) < 0.12) continue;
      const l = p.clone().applyMatrix4(_inv.copy(m.matrixWorld).invert());
      if (Math.abs(l.x) < g.parameters.width / 2 + clear / sx && Math.abs(l.y) < g.parameters.height / 2 + clear / sy && Math.abs(l.z) < g.parameters.depth / 2 + clear / sz) return true;
    }
    return false;
  }
  function inHead(p, S, m = 0.05) {                                                  // a camera inside (or within m of) a figure's head box
    const l = S.node.worldToLocal(p.clone()), b = S.lbox;
    return Math.abs(l.x) < b[0] + m && l.y > b[1] - m && l.y < b[2] + m && l.z > b[3] - m && l.z < b[4] + m;
  }
  const AWAY = Math.cos(80 * D2R);                                                      // a face whose forward normal is more than 80 degrees off the way to the camera is turned away
  const facingCos = (p, S) => S.gaze.dot(p.clone().sub(S.eye).normalize());
  function faceVis(p, near, S) {                                                      // the share of a 5 x 5 grid over the face's front that the camera sees (not the frame: what stands in the way)
    if (facingCos(p, S) < AWAY) return 0;
    const meshes = ST.rcCache || (ST.rcCache = solidMeshes()), b = S.lface; let n = 0;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (!occluded(p, S.node.localToWorld(V3((i / 4 * 2 - 1) * b[0], b[1] + (j / 4) * (b[2] - b[1]), b[4] - 0.012)), meshes, [S.root], near)) n++;
    return n / 25;
  }
  function clean(p, near, subs, strict, avoid = [], facing = false) {                                              // { ok, inside, hidden }: the camera is not in a solid, and every subject keeps an eye in view (strict: both eyes)
    const meshes = ST.rcCache || (ST.rcCache = solidMeshes());
    const inside = insideSolid(p, meshes, subs.map((s) => s.root)) || avoid.some((a) => inHead(p, a));
    let hidden = 0;
    if (facing) for (const s of subs) if (facingCos(p, s) < AWAY) hidden++;
    for (const s of subs) if (strict ? s.eyes.some((e) => occluded(p, e, meshes, [s.root], near)) : s.eyes.every((e) => occluded(p, e, meshes, [s.root], near))) hidden++;
    return { ok: !inside && !hidden, inside, hidden };
  }

  // ---------- the line of action, and the side the camera lives on ----------
  function lineOfAction(Sb, Sc) {                                                      // d: Buloy to Claude; ncam: the unit sideways step toward the camera's side (+1 = the left of d seen from above)
    const d = hor(Sc.eye.clone().sub(Sb.eye)), nrm = V3(-d.z, 0, d.x), cfg = setCfg();
    if (!ST.side) {
      if (cfg.side) ST.side = cfg.side > 0 ? 1 : -1;
      else {                                                                           // the side where the room is open: the longer free run from between them
        const M = Sb.eye.clone().add(Sc.eye).multiplyScalar(0.5), meshes = solidMeshes().filter((m) => !under(m, V) && !under(m, C));
        const free = (dir) => { _ray.set(M, dir); _ray.near = 0; _ray.far = 9; const hs = _ray.intersectObjects(meshes, false); return hs.length ? hs[0].distance : 9; };
        const fp = free(nrm), fm = free(nrm.clone().negate());
        ST.side = Math.abs(fp - fm) < 0.4 ? (nrm.z >= 0 ? 1 : -1) : (fp > fm ? 1 : -1);
      }
    }
    return { d, nrm, ncam: nrm.clone().multiplyScalar(ST.side) };
  }

  // ---------- the grammar ----------
  const WHO_RE = "(buloy|viron|claude|nena)";
  function fromGrammar(name) {
    let m;
    if ((m = new RegExp("^(ecu|cu|mcu|ms|ws|pov|ots):" + WHO_RE + "$").exec(name))) return { type: m[1], who: canon(m[2]) };
    if (name === "two") return { type: "two" };
    if (name === "ws") return { type: "ws" };
    if ((m = new RegExp("^duo:" + WHO_RE + "\\+([\\w-]+)$").exec(name))) return { type: "duo", who: canon(m[1]), obj: m[2] };
    if ((m = /^insert:([\w-]+)$/.exec(name))) return { type: "insert", obj: m[1] };
    return null;
  }
  function normSpec(v, name) {                                                         // a cine_shots entry: a grammar string, or { base?, type, who, size, eye, x, yaw, pitch, fov, push, arc, cap, flip }
    if (typeof v === "string") { const g = fromGrammar(v); if (!g) throw new Error("cine_shots." + name + ": \"" + v + "\" is not a grammar string"); return g; }
    const base = v.base ? fromGrammar(v.base) : {};
    if (v.base && !base) throw new Error("cine_shots." + name + ": base \"" + v.base + "\" is not a grammar string");
    const o = { ...base, ...v }; if (o.who) o.who = canon(o.who);
    if (!o.type) throw new Error("cine_shots." + name + ": needs a type (ecu cu mcu ms ws pov ots two duo insert) or a base");
    if (v.who && !o.who) throw new Error("cine_shots." + name + ": who must be buloy, claude or nena");
    return o;
  }
  const SET_NAMES = new Set(typeof SET !== "undefined" && SET.shots ? Object.keys(SET.shots) : []);
  function resolve(name) {                                                             // null: a hand-placed camera (unchanged); a spec: the cinematographer's
    if (SET_NAMES.has(name)) return null;
    if (TL.cine_shots && TL.cine_shots[name] !== undefined) return normSpec(TL.cine_shots[name], name);
    const g = (name.indexOf(":") >= 0 || (TL.cine && (name === "two" || name === "ws"))) ? fromGrammar(name) : null;
    if (g) return g;
    if (SHOTS[name]) return null;
    if (TL.cine || name.indexOf(":") >= 0) throw new Error("cine: shot \"" + name + "\" is not in SET.shots, not in cine_shots and not a grammar string (ecu|cu|mcu|ms|ws|pov|ots:<who>, two, ws, duo:<who>+<object>, insert:<object>)");
    return null;
  }

  // ---------- solving ----------
  const nearFor = (type, d) => (type === "pov" ? 0.06 : type === "ots" ? 0.06 : Math.min(0.15, Math.max(0.05, d * 0.12)));
  const variations = () => {                                                           // collision search order: azimuth +-12 in 3 degree steps, height +-0.08, distance x0.85 (lens widened to keep the size)
    const o = [{ da: 0, dy: 0, kd: 1, e: 0 }];
    for (const kd of [1, 0.85]) for (const dy of [0, 0.04, -0.04, 0.08, -0.08]) for (const da of [0, 3, -3, 6, -6, 9, -9, 12, -12]) if (kd !== 1 || dy || da) o.push({ da, dy, kd, e: Math.abs(da) / 12 + Math.abs(dy) / 0.08 * 0.5 + (kd < 1 ? 0.7 : 0) });
    return o.sort((a, b) => a.e - b.e);
  };
  function solveSingle(spec, S, O, ln) {
    const toO = hor(O.eye.clone().sub(S.eye)), facesO = S.fwd.dot(toO) > Math.cos(40 * D2R);                        // a pov is from the other principal's eye line only while the subject faces him; else it is frontal to where the subject looks
    const pov = spec.type === "pov" && facesO, whole = spec.type === "ws", type = spec.type === "pov" ? "cu" : (whole ? "ws" : spec.type);
    const cl = S.who === "claude", tS = cl ? CSIZE : BSIZE, tE = cl ? CEYE : BEYE, sigma = (S.who === "buloy" ? 1 : -1) * ST.side * (spec.flip ? -1 : 1);
    const fov0 = Math.min(60, spec.fov || FOVT[spec.type]);
    let size = whole ? 0.6 : (spec.size || tS[type]);
    const eyeLine = spec.eye || (whole ? 0.48 : tE[type]);
    const figH = whole ? Math.max(...S.figure.map((p) => p.y)) - Math.min(...S.figure.map((p) => p.y)) : 0;
    const dyBase = whole ? -0.3 : (cl ? 0.04 : -0.06), th0 = spec.yaw !== undefined ? spec.yaw : (spec.type === "pov" ? 4 : 25);
    const make = (th, dy, kd, sizeNow) => {
      let fov = fov0, d, p;
      const hh = whole ? figH : S.h;
      if (pov) {                                                                       // the lens on the other principal's eye line (th degrees to the camera side); the size sets how far back: behind his head if need be, and then it is moved clear of it
        const toS = S.eye.clone().sub(O.eye), dist = toS.length();
        const lat = hor(V3(-toS.z, 0, toS.x)).multiplyScalar(-sigma * Math.tan(th * D2R) * dist);
        p = O.eye.clone().add(lat); if (kd !== 1) p = S.eye.clone().lerp(p, kd);
        p.y += dy; d = p.distanceTo(S.eye);
        fov = 2 * Math.atan(hh / (2 * sizeNow * d)) / D2R;
        if (fov > 60) { fov = 60; d = hh / (2 * sizeNow * tanHalf(60)); p = S.eye.clone().add(p.sub(S.eye).normalize().multiplyScalar(d)); }
        fov = Math.max(24, fov);
      } else {
        d = hh / (2 * sizeNow * tanHalf(fov0)) * kd; fov = kd < 1 ? Math.min(60, 2 * Math.atan(tanHalf(fov0) / kd) / D2R) : fov0;
        const g = S.fwd, cands = [rotY(g, th * D2R), rotY(g, -th * D2R)].map((dc) => ({ dc, s: Math.sign(g.dot(V3(dc.z, 0, -dc.x))) }));
        const pick = cands.find((c) => c.s === sigma) || cands[0], camY = (whole ? S.floorY + figH / 2 : S.eye.y) + dyBase + dy;
        const dy0 = camY - S.eye.y, dh = Math.sqrt(Math.max(d * d - dy0 * dy0, (0.4 * d) ** 2));
        p = V3(S.eye.x + pick.dc.x * dh, camY, S.eye.z + pick.dc.z * dh);
        if (spec.pitch) p.y = S.eye.y + dh * Math.tan(spec.pitch * D2R);
      }
      // look room: the extra space on the gaze side; the eyes sit 0.06 off the middle (a pov, a Claude or a wide stays near the middle)
      const toCam = hor(p.clone().sub(S.eye)), gazeSign = Math.sign(S.fwd.dot(V3(toCam.z, 0, -toCam.x))) || sigma;
      const x = spec.x !== undefined ? spec.x : 0.5 - gazeSign * (spec.type === "pov" ? 0.02 : cl ? (type === "ecu" ? 0 : 0.03) : whole ? 0 : 0.06);
      const anchor = whole ? S.figure.reduce((a, q) => a.add(q), V3()).multiplyScalar(1 / S.figure.length) : S.eye.clone();
      return { p, fov, d, anchor, tg: [x, eyeLine], near: nearFor(spec.type, d) };
    };
    const fits = (c) => {                                                              // a Claude: the block at most 96 percent of the width (an ecu may crop it, but both eyes stay inside, at most 62 percent apart)
      if (!cl) return 1;
      const B = aim(c.p, c.fov, [c.anchor], [c.tg]), r = rectOf(S.box, c.p, B, c.fov), ez = S.eyes[0].distanceTo(S.eyes[1]) / (2 * c.p.distanceTo(S.eye) * tanHalf(c.fov) * ASP);   // the eyes' spread as if he faced the lens
      return Math.min(type === "ecu" || !r ? 9 : 0.96 / Math.max(1e-3, r.x1 - r.x0), 0.62 / Math.max(1e-3, ez));
    };
    let c0 = make(th0, 0, 1, size);
    for (let i = 0; i < 3; i++) { const k = fits(c0); if (k < 0.995) { size *= k; c0 = make(th0, 0, 1, size); } else break; }
    let best = null, bv = -1;                                                          // the nearest variation that is clean and sees at least 85 percent of the face; else the one that sees most
    for (const t of variations()) {
      const c = t.e === 0 ? c0 : make(th0 + t.da, t.dy, t.kd, size);
      if (!clean(c.p, c.near, [S], false, [O], true).ok) { if (!best) best = c; continue; }
      const v = faceVis(c.p, c.near, S);
      if (v >= 0.85) { best = c; break; }
      if (v > bv) { bv = v; best = c; }
    }
    if (!clean(best.p, best.near, [S], false, [O], true).ok) ST.warnings.push("cine: no clean camera for " + spec.type + ":" + S.who + (ln ? " (line " + ln.i + ")" : "") + ": it is inside a solid or both eyes are hidden");
    return best;
  }
  function searchCams(o) {                                                             // a grid of cameras round a centre (azimuth, height, distance), scored by composition, best first
    const out = [];
    for (const az of o.azs) { const dir = o.dirOf(az); for (const el of o.elevs) for (const dist of o.dists) {
      const p = o.center.clone().addScaledVector(dir, dist); p.y = o.center.y + el;
      const B = aim(p, o.fov, o.aimPts, o.aimTg), cam = { p, B, fov: o.fov, az, el, dist, pr: (q) => project(q, p, B, o.fov) };
      const e = o.score(cam); if (e < 1e8) out.push({ e, cam });
    } }
    return out.sort((a, b) => a.e - b.e);
  }
  const outside = (q, b) => (q ? Math.max(0, b[0] - q.sx) + Math.max(0, q.sx - b[1]) + Math.max(0, b[2] - q.sy) + Math.max(0, q.sy - b[3]) : 5);
  function solveTwo(spec, Sb, Sc, L, wide) {                                           // both of them: camera 70 to 100 degrees from the line of action, eyes at 0.30-0.50 from the top and 0.25 apart, both whole in the frame
    const fov = spec.fov || (wide ? FOVT.ws : FOVT.two), mid = Sb.eye.clone().add(Sc.eye).multiplyScalar(0.5), ncam = spec.flip ? L.ncam.clone().negate() : L.ncam;
    const pts = wide ? Sb.figure.concat(Sc.figure) : Sb.box.concat(Sc.box), fitB = wide ? [0.05, 0.95, 0.1, 0.88] : [0.04, 0.96, 0.07, 0.9];
    const aimPts = wide ? [pts.reduce((a, q) => a.add(q), V3()).multiplyScalar(1 / pts.length)] : [mid], aimTg = wide ? [[0.5, 0.47]] : [[0.5, 0.4]];
    const cands = searchCams({
      center: mid, fov, aimPts, aimTg, azs: [70, 75, 80, 85, 90, 95, 100], elevs: wide ? [-0.1, 0, 0.1, 0.2, 0.35, 0.5, 0.7] : [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2, 0.3], dists: Array.from({ length: 70 }, (_, i) => 0.7 + i * 0.05),
      dirOf: (az) => L.d.clone().multiplyScalar(Math.cos(az * D2R)).addScaledVector(ncam, Math.sin(az * D2R)),
      score: (c) => {
        let e = 0;
        for (const q of pts) e += 80 * outside(c.pr(q), fitB);
        const hs = [Sb, Sc].map((S) => { const a = c.pr(S.crown), b = c.pr(S.chin); return a && b ? Math.abs(a.sy - b.sy) : 0; });
        if (!wide) {
          const pb = c.pr(Sb.eye), pc = c.pr(Sc.eye); if (!pb || !pc) return 1e9;
          for (const q of [pb, pc]) e += 40 * Math.max(0, 0.3 - q.sy) + 40 * Math.max(0, q.sy - 0.5) + 6 * Math.abs(q.sy - 0.4);
          e += 60 * Math.max(0, 0.25 - Math.abs(pb.sx - pc.sx));
        }
        e -= (wide ? 6 : 4) * (hs[0] + hs[1]); e += Math.abs(c.az - 90) * 0.003 + Math.abs(c.el) * (wide ? 0.2 : 1);
        for (const S of [Sb, Sc]) e += 6 * Math.max(0, Math.acos(Math.max(-1, Math.min(1, facingCos(c.p, S)))) / D2R - 75) / 15;
        return e;
      },
    });
    const near = 0.12, best = cands.slice(0, 500).find((k) => clean(k.cam.p, near, [Sb, Sc], false, [Sb, Sc]).ok) || (ST.warnings.push("cine: no clean camera for " + (wide ? "ws" : "two")), cands[0]);
    return { p: best.cam.p, fov, anchor: aimPts[0], tg: aimTg[0], near, d: best.cam.dist };
  }
  function solveDuo(spec, S, L) {                                                      // <who> and an object together
    const obj = objectInfo(spec.obj), fov = spec.fov || FOVT.duo, mid = S.eye.clone().add(obj.c).multiplyScalar(0.5);
    const line = hor(obj.c.clone().sub(S.eye)), nrm = V3(-line.z, 0, line.x), ncam = nrm.dot(L.ncam) >= 0 ? nrm : nrm.clone().negate(), pts = S.box.concat(obj.pts);
    const cands = searchCams({
      center: mid, fov, aimPts: [mid], aimTg: [[0.5, 0.45]], azs: [50, 60, 70, 80, 90, 100, -50, -60, -70, -80, -90, -100], elevs: [-0.1, 0, 0.1, 0.2, 0.3, 0.45], dists: Array.from({ length: 60 }, (_, i) => 0.5 + i * 0.04),
      dirOf: (az) => line.clone().multiplyScalar(Math.cos(az * D2R)).addScaledVector(ncam, Math.sin(az * D2R)),
      score: (c) => {
        let e = 0; for (const q of pts) e += 80 * outside(c.pr(q), [0.05, 0.95, 0.08, 0.9]);
        const ps = c.pr(S.eye), po = c.pr(obj.c); if (!ps || !po) return 1e9;
        e += 40 * Math.max(0, 0.28 - ps.sy) + 40 * Math.max(0, ps.sy - 0.5) + 30 * Math.max(0, 0.12 - Math.abs(ps.sy - po.sy));
        const a = c.pr(S.crown), b = c.pr(S.chin); e -= 5 * (a && b ? Math.abs(a.sy - b.sy) : 0);
        e += 6 * Math.max(0, Math.acos(Math.max(-1, Math.min(1, facingCos(c.p, S)))) / D2R - 75) / 15;
        return e + Math.abs(Math.abs(c.az) - 70) * 0.003 + Math.abs(c.el) * 0.5 + (c.az < 0 ? 0.5 : 0);
      },
    });
    const near = 0.1;
    let best = null, bv = -1;                                                          // the best-scored clean camera that sees 85 percent of the face and the object (nothing in front of it); else the one that sees most of the face
    const meshes = ST.rcCache || (ST.rcCache = solidMeshes()), skip = obj.prop ? [obj.prop.g] : [];
    for (const pass of [true, false]) {
      for (const k of cands.slice(0, 500)) {
        if (!clean(k.cam.p, near, [S], false, [S], true).ok) continue;
        if (pass && occluded(k.cam.p, obj.c, meshes, skip, near)) continue;
        const v = faceVis(k.cam.p, near, S);
        if (v >= 0.85) { best = k; break; }
        if (v > bv) { bv = v; best = k; }
      }
      if (best) break;
    }
    if (!best) { ST.warnings.push("cine: no clean camera for duo:" + S.who + "+" + spec.obj); best = cands[0]; }
    return { p: best.cam.p, fov, anchor: mid, tg: [0.5, 0.45], near, d: best.cam.dist };
  }
  function solveOts(spec, S, O, L) {                                                   // the camera behind the other principal, a little to the camera side: his head at a frame edge, the subject's eyes at 0.6 (or 0.4, mirrored)
    const uOS = hor(S.eye.clone().sub(O.eye)), lat0 = spec.flip ? L.ncam.clone().negate() : L.ncam, cl = S.who === "claude", oc = O.node.getWorldPosition(V3()), ob = new THREE.Box3().setFromPoints(O.box).expandByScalar(0.03), all = [];
    for (const fov of spec.fov ? [spec.fov] : [24, 28, 32, 38, 44]) for (const b of [0.12, 0.2, 0.3, 0.42, 0.6, 0.8, 1.0]) for (const l of [0.1, 0.18, 0.26, 0.36, 0.48, 0.62, 0.8]) for (const dh of [-0.06, 0, 0.06, 0.12, 0.2]) {
      const p = O.eye.clone().addScaledVector(uOS, -b).addScaledVector(lat0, l); p.y = O.eye.y + dh;
      let ee = 1e9, tx = 0.6;
      for (const x of [0.6, 0.4]) {
        const B = aim(p, fov, [S.eye], [[x, spec.eye || 0.4]]), qo = project(oc, p, B, fov), a = project(S.crown, p, B, fov), c = project(S.chin, p, B, fov), ro = rectOf(O.box, p, B, fov); if (!qo || !a || !c || !ro) continue;
        const lo = x === 0.6 ? 0.08 : 0.75, hi = x === 0.6 ? 0.25 : 0.92, ex = 40 * (Math.max(0, lo - qo.sx) + Math.max(0, qo.sx - hi)) + 30 * Math.max(0, ro.x1 - ro.x0 - 0.42) + 20 * Math.abs(Math.abs(a.sy - c.sy) - (cl ? 0.3 : 0.26)) + (fov - 24) * 0.004;
        if (ex < ee) { ee = ex; tx = x; }
      }
      if (ob.containsPoint(p)) ee += 1000;
      all.push({ e: ee, p, fov, tgx: spec.x !== undefined ? spec.x : tx });
    }
    all.sort((a, b) => a.e - b.e);
    const near = 0.06, top = all.slice(0, 200);
    let pick = null, bv = -1;                                                          // both eyes in view and 85 percent of the face; else the best view among the clean ones
    for (const k of top) { if (!clean(k.p, near, [S], true, [], true).ok) continue; const v = faceVis(k.p, near, S); if (v >= 0.85) { pick = k; break; } if (v > bv) { bv = v; pick = k; } }
    pick = pick || top.find((k) => clean(k.p, near, [S], false, [], true).ok) || all[0];
    if (!clean(pick.p, near, [S], false, [], true).ok) ST.warnings.push("cine: no clean camera for ots:" + S.who);
    return { p: pick.p, fov: pick.fov, anchor: S.eye.clone(), tg: [pick.tgx, spec.eye || 0.4], near, d: pick.p.distanceTo(S.eye) };
  }
  function solveInsert(spec, L, Sb, Sc) {                                              // the object square-on, about 88 percent of the frame wide
    const o = objectInfo(spec.obj), fov = spec.fov || FOVT.insert, meshes = ST.rcCache || (ST.rcCache = solidMeshes());
    let n = o.n ? o.n.clone() : hor(Sb.eye.clone().add(Sc.eye).multiplyScalar(0.5).sub(o.c));         // a screen faces its viewer; anything else is seen from the principals' side
    if (!o.n && n.dot(L.ncam) < 0) n.negate();
    const dist0 = Math.max(o.w, o.h * 0.5) / (2 * 0.88 * tanHalf(fov) * ASP), tg = [0.5, spec.eye || 0.42], skip = o.prop ? [o.prop.g] : [];
    let first = null;
    const wide = [];                                                                   // a second tier: turn the camera round the object toward the principals' side, 25 to 70 degrees off square-on
    for (const da of [25, -25, 40, -40, 55, -55, 70, -70]) for (const dy of [0, 0.1, 0.2]) wide.push({ da, dy, kd: 1, e: 10 + Math.abs(da) / 70 + dy });
    for (const t of variations().concat(wide.sort((a, b) => a.e - b.e))) {
      const dir = rotY(n, t.da * D2R), f = Math.min(60, t.kd < 1 ? 2 * Math.atan(tanHalf(fov) / t.kd) / D2R : fov), d = dist0 * t.kd;
      const p = o.c.clone().addScaledVector(dir, d); p.y += t.dy;
      const c = { p, fov: f, anchor: o.c.clone(), tg, near: Math.min(0.2, d * 0.2), d };
      first = first || c;
      if (!insideSolid(p, meshes, [V, C], 0.03) && !occluded(p, o.c, meshes, skip, c.near)) return c;
    }
    ST.warnings.push("cine: no clean camera for insert:" + spec.obj);
    return first;
  }
  function finish(cam, spec, subs, name) {                                             // the fields every solved camera carries
    const B = aim(cam.p, cam.fov, [cam.anchor], [cam.tg]);
    cam.l = cam.p.clone().addScaledVector(B.f, 5); cam.pivot = cam.anchor.clone();
    cam.push = spec.push !== undefined ? spec.push : (spec.type === "insert" ? 0 : 0.04);
    cam.arc = spec.arc || 0; cam.zoom = 1; cam.capOverride = spec.cap; cam.spec = spec; cam.name = name; cam.subs = subs.map((s) => s.who);
    return cam;
  }
  function solveCut(spec, cut, name) {
    const tq = cut.t + (spec.at !== undefined ? spec.at : 0.05), ln = TL.lines.find((l) => tq >= l.s - 0.2 && tq <= l.e + 0.2) || null;
    ST.rcCache = null; ST.solving = true;
    scene.updateMatrixWorld(true);
    const Sb = subject("buloy"), Sc = subject("claude"), L = lineOfAction(Sb, Sc), who = spec.who;
    const one = who ? subject(who) : null, oth = who ? (who === "nena" ? Sb : subject(otherOf(who))) : null;
    let r, subs = [Sb, Sc];
    switch (spec.type) {
      case "ecu": case "cu": case "mcu": case "ms": case "pov": case "ws":
        if (spec.type === "ws" && !who) { r = solveTwo(spec, Sb, Sc, L, true); break; }
        if (!who) throw new Error("cine: shot \"" + name + "\" needs a who (" + spec.type + ":buloy or " + spec.type + ":claude)");
        r = solveSingle(spec, one, oth, ln); subs = [one]; break;
      case "two": r = solveTwo(spec, Sb, Sc, L, false); break;
      case "ots": r = solveOts(spec, one, oth, L); subs = [one, oth]; break;
      case "duo": r = solveDuo(spec, one, L); subs = [one]; break;
      case "insert": r = solveInsert(spec, L, Sb, Sc); subs = []; break;
      default: throw new Error("cine: shot \"" + name + "\": unknown type " + spec.type);
    }
    const cam = finish(r, spec, subs, name);
    ST.solving = false;
    lookRig(cam, one, oth, L);
    cam.facePts = [Sb, Sc].map((S) => ({ who: S.who, pts: corners(S.node, S.lface) }));
    if (spec.type === "insert" || spec.type === "duo") cam.facePts.push({ who: "object", pts: objectInfo(spec.obj).pts });
    cam.faces = faceRects(cam);
    return cam;
  }

  // ---------- the light of a shot: a warm key from the screen side, a cool rim behind, the room falling into the dark ----------
  const lookCfg = () => { const l = setCfg().look || TL.cine_look; return l && Object.keys(l).length ? l : null; };
  function lookRig(cam, S, O, L) {                                                     // where this shot's key, rim and fog go (used when the set or the script asks for a look)
    const A = cam.anchor, toCam = hor(cam.p.clone().sub(A)), lk = lookCfg() || {}, gaze = S && O ? hor(O.eye.clone().sub(S.eye)) : L.d.clone();
    const perp = V3(-toCam.z, 0, toCam.x); if (perp.dot(gaze) < 0) perp.negate();
    const kd = toCam.clone().multiplyScalar(Math.cos(38 * D2R)).addScaledVector(perp, Math.sin(38 * D2R));
    cam.keyPos = A.clone().addScaledVector(kd, lk.keyDist !== undefined ? lk.keyDist : 0.5).add(V3(0, -0.08, 0));
    const rd = toCam.clone().multiplyScalar(-Math.cos(35 * D2R)).addScaledVector(perp, -Math.sin(35 * D2R));
    cam.rimPos = A.clone().addScaledVector(rd, 0.8).add(V3(0, 0.25, 0));
    const dist = cam.p.distanceTo(A);
    cam.fogNear = dist + (lk.fogNear !== undefined ? lk.fogNear : 0.25); cam.fogFar = dist + (lk.fogFar !== undefined ? lk.fogFar : 3.0);
  }
  function light(cut, cc) {                                                            // called every frame with the shot's camera (null for a hand-placed shot, which gets the set's own fog and lights back)
    if (!ST.key) return;
    const lk = lookCfg(); if (!lk) return;
    if (scene.fog && !scene.fog.cine) ST.baseFog = scene.fog; else if (ST.baseFog === undefined && !scene.fog) ST.baseFog = null;
    if (!cc || !cc.look) {
      ST.key.intensity = 0; ST.rim.intensity = 0;
      if (scene.fog && scene.fog.cine) scene.fog = ST.baseFog || null;
      return;
    }
    const cam = cc.look;
    ST.key.color.set(lk.key || "#ffb070"); ST.key.intensity = lk.keyI !== undefined ? lk.keyI : 1.4; ST.key.position.copy(cam.keyPos);
    ST.rim.color.set(lk.rim || "#6c8cff"); ST.rim.intensity = lk.rimI !== undefined ? lk.rimI : 1.0; ST.rim.position.copy(cam.rimPos);
    if (lk.fog) { ST.fog.color.set(lk.fog); ST.fog.near = cam.fogNear; ST.fog.far = cam.fogFar; scene.fog = ST.fog; }
  }

  // ---------- camera life: push, arc, punch-in; a pure function of the cut and the time ----------
  const OUT = { p: V3(), l: V3(), fov: 30, near: 0.1, look: null, cam: null };
  function poseOf(cam, t, cutT) {                                                      // { p, fov, B, near } at time t: the stored camera pushed by smoothstep over the run of the shot, arced, zoomed, re-aimed so the anchor keeps its screen point
    const t0 = cam.t0 !== undefined ? cam.t0 : cutT, t1 = cam.t1 !== undefined ? cam.t1 : t0 + 3, w = smooth((t - t0) / Math.max(0.3, t1 - t0));
    const off = cam.p.clone().sub(cam.pivot), v = cam.arc ? rotY(off, cam.arc * D2R * w) : off;
    const p = cam.pivot.clone().addScaledVector(v, 1 - cam.push * w), fov = cam.zoom > 1 ? 2 * Math.atan(tanHalf(cam.fov) / cam.zoom) / D2R : cam.fov;
    return { p, fov, B: aim(p, fov, [cam.anchor], [cam.tg]), near: cam.near };
  }
  const camOf = (cut) => cut.cam || (cut.forced !== undefined ? ST.forced[cut.forced] : null);
  function camAt(cut, t) {                                                             // the cinematographer's camera for this cut at time t, or null (a hand-placed shot)
    const cam = camOf(cut); if (!cam) return null;
    const P = poseOf(cam, t, cut.t);
    OUT.p.copy(P.p); OUT.l.copy(P.p).addScaledVector(P.B.f, 5); OUT.fov = P.fov; OUT.near = P.near; OUT.look = cam.keyPos ? cam : null; OUT.cam = cam;
    return OUT;
  }

  // ---------- captions: above the face when it fits, else below the chin, never over the eyes ----------
  const capLines = (text) => {                                                         // the rows a caption wraps to in the 900 px box (29.5 px a character)
    const wrap = (ln) => { const o = []; let cur = ""; for (const tok of ln.match(/[^\s-]+-?\s*/g) || [""]) { if (cur && (cur + tok).trimEnd().length * 29.5 > 900) { o.push(cur.trimEnd()); cur = tok; } else cur += tok; } o.push(cur.trimEnd()); return o; };
    return [].concat(...String(text || "").split(String.fromCharCode(10)).map(wrap));
  };
  const CAP_ROW = 68.5, CAP_TOP_MIN = 250, CAP_BOT_MAX = 1500, CAP_GAP = 24;
  function capTop(cut, cap) {                                                          // the caption's top in px of 1920 for a solved shot
    const cam = camOf(cut); if (!cam) return 470;
    if (cam.capOverride !== undefined) return cam.capOverride;
    const h = capLines(cap ? cap.text : "x").length * CAP_ROW + 6, rs = cam.faces.filter((r) => r.shown);
    if (!rs.length) return 470;
    const top = Math.min(...rs.map((r) => r.y0)), bot = Math.max(...rs.map((r) => r.y1)), above = top - CAP_GAP - h, below = bot + CAP_GAP;
    if (above >= CAP_TOP_MIN) return Math.round(above);
    if (below + h <= CAP_BOT_MAX) return Math.round(below);
    return Math.round(below + h - CAP_BOT_MAX < CAP_TOP_MIN - above ? below : Math.max(CAP_TOP_MIN, above));          // neither fits: the smaller miss (the framing QA says so)
  }
  function faceRects(cam) {                                                            // each principal's face box (and the object of a duo or insert) on the 1080 x 1920 screen over the whole push (start and end), for the caption lane and the QA; from cam.facePts, so a punch-in measures its own lens
    const out = [];
    const rect = (pts, who) => {
      let u = null;
      for (const w of [0, 1]) {
        const P = poseOf({ ...cam, t0: 0, t1: 1 }, w, 0), r = rectOf(pts, P.p, P.B, P.fov); if (!r) continue;
        u = u ? { x0: Math.min(u.x0, r.x0), x1: Math.max(u.x1, r.x1), y0: Math.min(u.y0, r.y0), y1: Math.max(u.y1, r.y1), inN: Math.max(u.inN, r.inN) } : r;
      }
      if (!u) return { who, shown: false };
      return { who, shown: u.inN > 0 && u.x1 > 0 && u.x0 < 1 && u.y1 > 0 && u.y0 < 1, x0: u.x0 * FW_PX, x1: u.x1 * FW_PX, y0: Math.max(0, u.y0) * FH_PX, y1: Math.min(1, u.y1) * FH_PX };
    };
    for (const f of cam.facePts) out.push(rect(f.pts, f.who));
    return out;
  }

  // ---------- eyes: Claude's eye shapes on beats ----------
  function eyeParams(t) {                                                              // the blended shape at t (0.08 s between two), or null before the first key
    const forced = TL.forceEyes && Object.keys(TL.forceEyes).find((k) => Math.abs(t - parseFloat(k)) < 0.01);
    if (forced) return EYE_SHAPES[TL.forceEyes[forced]];
    const ks = TL.eyes; if (!ks || !ks.length || t < ks[0].t) return null;
    let i = 0; while (i + 1 < ks.length && ks[i + 1].t <= t) i++;
    const cur = EYE_SHAPES[ks[i].eyes], prev = i ? EYE_SHAPES[ks[i - 1].eyes] : EYE_SHAPES.neutral, w = smooth((t - ks[i].t) / 0.08), o = {};
    for (const k in cur) o[k] = lerpN(prev[k], cur[k], w);
    return o;
  }
  function applyEyes(P) {                                                              // the same boxes the director blinks; rotation.z leans them (the director levels them every frame)
    cEyes.forEach((e, i) => {
      const s = i ? 1 : -1;
      e.scale.x = P.sx; e.scale.y = Math.max(0.004, P.sy * ST.blink); e.position.x = s * 0.14 + P.dx; e.position.y = 0.2 + P.dy; e.rotation.z = s * P.rz * D2R;
    });
  }

  // ---------- eyelines: who looks at whom ----------
  function lookTarget(who, solving) {                                                  // the world point `who` looks at now: the other principal's eyes (Aling Nena's while she speaks), unless the line says "lens" | "screen" | "down" | a name (buloy claude nena)
    const ln = ST.ln, t = ST.t;
    if (ln && canon(ln.who) === who && ln.look) {
      const me = subject(who), cn = ST.cutNow, cam = cn && camOf(cn), lk = ln.look;
      if (lk === "lens") {
        if (solving) { ST.lensSkipped = true; if (ST.lensGuess) return ST.lensGuess; }      // while the camera is solved, the lens is last round's guess (init solves such a cut twice)
        else if (cn) { if (cam) return poseOf(cam, t, cn.t).p; if (typeof shotCamPos === "function") return shotCamPos(cn, t); }
        return null;
      }
      if (lk === "screen") { try { return objectInfo("laptop").c; } catch (e) { /* no laptop: look down instead */ } }
      if (lk === "down" || lk === "screen") return me.eye.clone().addScaledVector(me.fwd, 0.3).add(V3(0, -0.4, 0));
      const named = canon(lk); if (named && named !== who && (named !== "nena" || shownLite(nena))) return subject(named).eye;
    }
    if (ln && canon(ln.who) === "nena" && shownLite(nena)) return subject("nena").eye;
    return subject(otherOf(who)).eye;
  }
  function lookBuloy(target, w) {                                                      // turn the head (+-50 degrees yaw, +-25 pitch) toward a world point, the eyes take what is left
    vUpper.updateWorldMatrix(true, true);
    const d = vUpper.worldToLocal(target.clone()).sub(vHead.position).add(V3(0, -0.142, 0)).normalize();
    const yawT = Math.asin(Math.max(-1, Math.min(1, d.x))), pitT = Math.atan2(-d.y, d.z), LY = 50 * D2R, LP = 25 * D2R;
    const y1 = lerpN(vHead.rotation.y, Math.max(-LY, Math.min(LY, yawT)), w), x1 = lerpN(vHead.rotation.x, Math.max(-LP, Math.min(LP, pitT)), w);
    vHead.rotation.y = y1; vHead.rotation.x = x1;
    return { gx: Math.max(-1, Math.min(1, (yawT - y1) / 0.4)), gy: Math.max(-1, Math.min(1, (pitT - x1) / 0.3)) };
  }
  function claudeYaw(point, yaw, w) {                                                  // Claude's yaw, turned the fraction w of the way from `yaw` toward a world point
    const loc = (C.parent || scene).worldToLocal(point.clone()), dx = loc.x - C.position.x, dz = loc.z - C.position.z;
    return Math.hypot(dx, dz) < 0.05 ? yaw : yaw + wrapPi(Math.atan2(dx, dz) - yaw) * w;
  }
  function facing(who, yaw, w = 0.85, forced) {                                        // a set that poses Claude's turn itself asks this for the yaw it is about to set (or stage.js wraps C.rotation.set)
    if ((!TL.cine && !forced) || canon(who) !== "claude") return yaw;
    V.updateWorldMatrix(true, true);
    const tc = lookTarget("claude", ST.solving);
    return tc ? claudeYaw(tc, yaw, w) : yaw;
  }
  function lookAt(who, point, w = 0.85) {                                              // CINE.lookAt("buloy", point, 0.85): turn his head (+-50 degrees yaw, +-25 pitch) and eyes toward a world point; "claude": turn his body
    const k = canon(who);
    if (k === "buloy") { const g = lookBuloy(point, w), f = ST.lastFace; if (f) ST.rawDraw(Object.assign({}, f, { gx: lerpN(f.gx || 0, g.gx, w), gy: lerpN(f.gy || 0, g.gy, w) })); }
    else if (k === "claude") { V.updateWorldMatrix(true, true); C.rotation.y = claudeYaw(point, C.rotation.y, w); }
    else throw new Error("cine: lookAt turns buloy or claude, not \"" + who + "\"");
  }
  const eyeSig = () => cEyes.map((e) => [e.scale.x, e.scale.y, e.position.x, e.position.y]).flat();
  function pre(t, ln, cutNow) {                                                        // before the set poses: what the director left, so we can tell whether the set posed over it
    ST.t = t; ST.ln = ln; ST.cutNow = cutNow;
    return { hx: vHead.rotation.x, hy: vHead.rotation.y, hz: vHead.rotation.z, cy: C.rotation.y, e: eyeSig() };
  }
  function after(t, ln, cutNow, p) {                                                   // after the set: eyelines and eye shapes where the set left the pose to the director (SET.cine.pose = "after" takes them from the set)
    const mode = setCfg().pose || "auto", lnLook = ln && ln.look, forWho = (w) => TL.cine || (lnLook && ln && canon(ln.who) === w);
    if (forWho("buloy") && (mode === "after" || (vHead.rotation.x === p.hx && vHead.rotation.y === p.hy && vHead.rotation.z === p.hz))) {
      const tb = lookTarget("buloy", ST.solving);
      if (tb) lookAt("buloy", tb);
    }
    if (forWho("claude") && C.rotation.y === p.cy) { const tc = lookTarget("claude", ST.solving); if (tc) lookAt("claude", tc); }
    const P = eyeParams(t);
    if (P && (mode === "after" || eyeSig().every((v, i) => v === p.e[i]))) applyEyes(P);
  }

  // ---------- init: resolve every shot name, solve each cut once ----------
  const pose = (t) => { ST.solving = true; renderAt(t, { solve: true }); };
  function solveAt(spec, cut, name, t) {                                               // pose the cast at t, solve; if a line there says look: "lens", pose again looking at the first camera and solve again
    ST.lensSkipped = false; ST.lensGuess = null; pose(t);
    let cam = solveCut(spec, cut, name);
    if (ST.lensSkipped) { ST.lensGuess = cam.p.clone(); pose(t); cam = solveCut(spec, cut, name); ST.lensGuess = null; ST.lensSkipped = false; }
    return cam;
  }
  function init() {
    ST.rawDraw = buloy.draw; buloy.draw = (f) => { ST.lastFace = f; ST.rawDraw(f); };            // remember the last face painted, so an eyeline can repaint it with the gaze moved
    for (const k of (TL.eyes || [])) if (!EYE_SHAPES[k.eyes]) throw new Error("cine: eyes \"" + k.eyes + "\" is not a shape (" + Object.keys(EYE_SHAPES).join(", ") + ")");
    for (const k in (TL.forceEyes || {})) if (!EYE_SHAPES[TL.forceEyes[k]]) throw new Error("cine: eyes \"" + TL.forceEyes[k] + "\" is not a shape (" + Object.keys(EYE_SHAPES).join(", ") + ")");
    const endT = TL.end ? TL.end.s : TL.dur, real = TL.shots.filter((c) => !c.marker), specs = new Map();
    for (const c of real) specs.set(c, resolve(c.shot));
    const forced = TL.forceAt ? Object.keys(TL.forceAt).map((k) => ({ k, name: TL.forceAt[k], spec: resolve(TL.forceAt[k]) })) : [];
    if (!real.some((c) => specs.get(c)) && !forced.some((f) => f.spec) && !lookCfg()) return;
    if (lookCfg()) { ST.key = new THREE.PointLight(0xffb070, 0, 2.6, 1.6); ST.rim = new THREE.PointLight(0x6c8cff, 0, 3.2, 1.6); scene.add(ST.key, ST.rim); ST.fog = new THREE.Fog(0x0b1020, 1, 6); ST.fog.cine = true; }
    let prev = null;
    for (const c of real) {
      const spec = specs.get(c); if (!spec) { prev = null; continue; }
      if (c.zoom && prev && prev.shot === c.shot && prev.cam) { c.cam = Object.assign({}, prev.cam, { zoom: c.zoom }); c.cam.faces = faceRects(c.cam); }          // a punch-in on the shot that is on screen: the same camera, a narrower lens, the eye keeps its place
      else { c.cam = solveAt(spec, c, c.shot, c.t + (spec.at !== undefined ? spec.at : 0.05)); c.cam.t0 = c.t; if (c.zoom) c.cam.zoom = c.zoom; }
      prev = c;
    }
    real.forEach((c, i) => { if (!c.cam) return; let j = i + 1; while (j < real.length && real[j].cam && real[j].cam.t0 === c.cam.t0) j++; c.cam.t1 = j < real.length ? real[j].t : endT; });
    for (const f of forced) if (f.spec) { const t = parseFloat(f.k), cam = solveAt(f.spec, { t, shot: f.name, forced: f.k }, f.name, t); cam.t0 = t; cam.t1 = t + 3; ST.forced[f.k] = cam; }
    ST.solving = false; ST.rcCache = null;
    for (const w of ST.warnings) console.warn(w);
    window.__cineWarnings = ST.warnings;
  }

  const faceCorners = (S) => corners(S.node, S.lface);
  return { init, subject, objectInfo, faceCorners, lookAt, register: (name, fn) => { ST.objects[name] = fn; }, resolve, camAt, camOf, capTop, capLines, light, pre, after, facing, lookTarget, project, basis, aim, rectOf, solidMeshes, occluded, canon, otherOf, poseOf,
    EYE_SHAPES, SINGLES, ST, set blink(v) { ST.blink = v; }, get blink() { return ST.blink; } };
})();
CINE.init();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
window.__renderAt = renderAt;
renderAt(window.__hfThreeTime || 0);
