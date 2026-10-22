// ---------- shared by the sets: small pixel signs, keyed vectors, and the arm reach for the rigged figures (Buloy, Bea, the manong, the prof) ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
function vtrack(keys, t, rest, out) {
  const at = (k) => (k[1] === null ? rest : k[1]);
  if (t <= keys[0][0]) return out.copy(at(keys[0]));
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return out.copy(at(a)).lerp(at(b), smooth((t - a[0]) / Math.max(1e-4, b[0] - a[0]))); }
  return out.copy(at(keys[keys.length - 1]));
}
// ---- arms of the rigged figures: a three-angle search for the hand to reach a point (in the upper body's own frame) ----
function ikArm(arm, s, T) {
  const L = 0.27, F = 0.29, tx = T.x - s * 0.204, ty = T.y - 0.44, tz = T.z;
  let best = 1e9, ba = 0, bb = -0.3, bc = -1.1;
  const ev = (a, b, c) => { const yy = -L * Math.cos(b) - F * Math.cos(b + c), zz = -L * Math.sin(b) - F * Math.sin(b + c), dx = zz * Math.sin(a) - tx, dy = yy - ty, dz = zz * Math.cos(a) - tz; return dx * dx + dy * dy + dz * dz + 0.002 * a * a + 0.004 * (c + 0.9) * (c + 0.9); };
  for (let a = -1.5; a <= 1.51; a += 0.25) for (let b = -3.1; b <= 0.41; b += 0.25) for (let c = -2.5; c <= 0.16; c += 0.25) { const e = ev(a, b, c); if (e < best) { best = e; ba = a; bb = b; bc = c; } }
  const a0 = ba, b0 = bb, c0 = bc;
  for (let a = a0 - 0.25; a <= a0 + 0.26; a += 0.05) for (let b = b0 - 0.25; b <= b0 + 0.26; b += 0.05) for (let c = c0 - 0.25; c <= c0 + 0.26; c += 0.05) { const e = ev(a, b, c); if (e < best) { best = e; ba = a; bb = b; bc = c; } }
  arm.yaw.rotation.y = ba; arm.sh.rotation.x = bb; arm.sh.rotation.z = 0; arm.el.rotation.x = bc; arm.hand.rotation.z = 0;
}
const REST_LOCAL = [v3(0.13, 0.08, 0.34), v3(-0.13, 0.08, 0.34)];            // hands on the knees: [armL, armR]
const _w = new THREE.Vector3(), _w2 = new THREE.Vector3(), _w3 = new THREE.Vector3(), _w4 = new THREE.Vector3();
function reach(rig, s, worldKeys, t, restLocal, extra) {                       // one arm to a keyed world point, then optionally to an acting pose (local), then solve
  const arm = s > 0 ? rig.armL : rig.armR, restW = rig.vUpper.localToWorld(_w3.copy(restLocal));
  vtrack(worldKeys, t, restW, _w);
  const loc = rig.vUpper.worldToLocal(_w);
  if (extra) for (const [w, p] of extra) if (w > 0.001) loc.lerp(p, w);
  ikArm(arm, s, loc);
  return _w;
}
const _hv1 = new THREE.Vector3(), _hv2 = new THREE.Vector3(), _hv3 = new THREE.Vector3();
const px = (text, w, h, bg, fg, scale = 1, o = {}) => painted(w, h, (g) => {                       // a little pixel sign
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (o.border) { g.fillStyle = o.border; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); }
  if (ATLAS && ATLAS.ptext) { const lines = String(text).split("\n"); lines.forEach((ln, i) => ATLAS.ptext(g, ln, w >> 1, o.y ?? Math.max(1, ((h - lines.length * (7 * scale + 1)) >> 1) + i * (7 * scale + 1)), fg, { font: 5, scale, align: "center", shadow: o.shadow, sd: 1 })); }
}, { mip: false });
const signMat = (tex, glow = 0) => glow ? new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(glow, glow, glow) }) : mat(0xffffff, { map: tex });
