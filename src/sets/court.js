// ---------- SET: the barangay covered court (episode 8, "Kanina Gumagana") ----------
// A covered basketball court at dusk. Buloy demos an app on a bedsheet hung under the hoop; the barangay captain sits to one side with a rubber stamp.
// World: the camera side is +z, the hoop and the bedsheet are at the back (z about -3.1), the folding table runs from x -1.0 to 0.4 at z -0.1 with Buloy standing behind it
// (x -0.3, z -0.58), Claude on it right in front of him, the laptop on a carton at his right hand. The Kapitana sits on a monobloc at x 0.34, z 0.5, turned to the seats, her little table with the folder at her right hand; she holds the stamp up until she uses it.
// The crowd sits in two rows at z 1.4 and 2.0. The one rule: the sheet is RED until somebody on stage says "gumagana"; Buloy's key tap turns it green (TL.marks).
// Same contract as the other sets: SET.shots (cameras) and SET.update(t, ctx), a pure function of time. px, v3, vtrack and reach come from 46-rig.js.

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0x3a2f58); scene.fog = null;

// ================= the moments the story is built on (TL.marks, in seconds) =================
const LN = TL.lines, NO_LINE = { s: 1e9, e: 1e9 }, actLine = (name) => LN.find((l) => l.act === name) || NO_LINE;
const MKS = TL.marks || {}, MK = (k) => (MKS[k] == null ? 1e9 : MKS[k]);
const TM = { g1: MK("g1"), r1: MK("r1"), g2: MK("g2"), r2: MK("r2"), g3: MK("g3"), r3: MK("r3"), hush: MK("hush"), stamp: MK("stamp") };
const A = { plead: actLine("b_plead"), all: actLine("c_all"), wait: actLine("k_wait"), ayan: actLine("b_ayan"), bati: actLine("c_bati"), pala: actLine("k_pala"), naman: actLine("b_naman"),
  usog: actLine("c_usog"), hush: actLine("b_hush"), ok: actLine("k_ok"), pwera: actLine("k_pwera"), joy: actLine("b_joy"), video: actLine("c_video"), card: actLine("k_card") };
const win = (ln, t, pi = 0.2, po = 0.3) => smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3));
const env = (a, b, t, ei = 0.25, eo = 0.3) => smooth((t - a) / ei) * (1 - smooth((t - b) / eo));
const ramp = (a, b, t) => smooth((t - a) / Math.max(1e-4, b - a));
const lerp = (a, b, w) => a + (b - a) * w;
const GREEN_RUNS = [[TM.g1, TM.r1], [TM.g2, TM.r2], [TM.g3, TM.r3]];
const isGreen = (t) => GREEN_RUNS.some((r) => t >= r[0] && t < r[1]);
const FLIPS = [TM.g1, TM.r1, TM.g2, TM.r2, TM.g3, TM.r3];
const lampAt = (t) => {                                                                       // the red lamp: still fading at t = 0, then a blaze of about 0.6 s at each r
  let v = Math.max(0, 0.85 * (1 - t / 0.5));
  for (const r of [TM.r1, TM.r2, TM.r3]) { const u = t - r; if (u >= 0 && u < 0.6) v = Math.max(v, u < 0.3 ? 1 : 1 - (u - 0.3) / 0.3); }
  return v;
};
const TAPS = [TM.g1 - 0.3, TM.g2 - 0.3, TM.g3 - 0.3];                                           // finger contact on the keyboard

// ================= the sky, the ground, the far houses =================
{
  const skyTex = painted(2, 64, (g, w, h) => {
    const stops = [[0, "#1c2058"], [0.3, "#3a3480"], [0.5, "#8a4a8a"], [0.6, "#d8607a"], [0.68, "#f59a5c"], [0.72, "#ffc878"], [0.74, "#5a4a70"], [1, "#2a2438"]];
    const gr = g.createLinearGradient(0, 0, 0, h); for (const s of stops) gr.addColorStop(s[0], s[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { mip: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })); dome.position.y = -6; dome.renderOrder = -10; room.add(dome);
}
box(room, 400, 0.2, 400, 0x232c2c, 0, -0.1 - 0.02, 0, { noShadow: true });                                  // the ground outside
{
  const r = rng(321), HC = [0x2c2f4a, 0x343654, 0x3a3252, 0x2a3048], WIN = [0xffd27a, 0xffe6a8, 0xffc060];
  for (let i = 0; i < 16; i++) {                                                                           // houses and their lit windows, far off
    const w = 3 + r() * 4, h = 2.4 + r() * 2.6, x = -34 + i * 4.6 + r() * 1.6, z = -17 - r() * 8;
    const g = group(room, x, 0, z); box(g, w, h, 4, HC[i % 4], 0, h / 2, 0, { noShadow: true }); box(g, w + 0.4, 0.25, 4.4, 0x1e2036, 0, h + 0.1, 0, { noShadow: true });
    for (let k = 0; k < 2 + Math.floor(r() * 3); k++) if (r() > 0.35) { const lx = (r() - 0.5) * (w - 1), ly = 0.8 + r() * (h - 1.5), wb = box(g, 0.55, 0.5, 0.06, WIN[k % 3], lx, ly, 2.03, { glow: 1.3, noShadow: true }); if (Math.abs(x + lx + 0.1) < 2.6) wb.visible = false; }   // no lit window in the strip of town behind the stage: one sat beside the raised stamp like a yellow tag
  }
  for (const [x, z, s] of [[-12, -12, 1.0], [11.5, -13, 1.15], [-19, -15, 0.9], [19, -14, 1.0]]) {                // coconut trees against the sky
    const g = group(room, x, 0, z); g.scale.setScalar(s);
    const trunk = mesh(g, limb(7.2, 0.2, 0.12, 7), mat(0x1a1c2c), 0, 7.2, 0); trunk.rotation.z = 0.08;
    for (let k = 0; k < 7; k++) { const fr = box(g, 3.2, 0.06, 0.55, 0x15201f, Math.cos(k * 0.9) * 1.4 + 0.5, 7.1 - Math.abs(Math.sin(k * 0.9)) * 0.4, Math.sin(k * 0.9) * 1.4, { noShadow: true }); fr.rotation.y = -k * 0.9; fr.rotation.z = -0.25; }
  }
}

// ================= the court: floor, paint, low walls, columns, roof, lamps, banderitas =================
const FLOOR = TEX.concrete();
tbox(room, 12.8, 0.1, 13, FLOOR, 1.4, 0, -0.05, 1.3, { noShadow: true, color: 0x6c9a96 });                      // the painted floor
{
  const P = (w, d, col, x, z) => box(room, w, 0.006, d, col, x, 0.003, z, { noShadow: true });
  P(4.9, 5.8, 0x9c4a3c, 0, -1.3);                                                                          // the lane, painted red
  for (const [w, d, x, z] of [[4.9, 0.07, 0, 1.6], [4.9, 0.07, 0, -4.2], [0.07, 5.8, -2.45, -1.3], [0.07, 5.8, 2.45, -1.3]]) P(w, d, 0xf2eee0, x, z);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.76, 1.83, 40), mat(0xf2eee0)); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.006, 1.6); room.add(ring);
  const arc = new THREE.Mesh(new THREE.RingGeometry(6.0, 6.07, 56, 1, Math.PI * 1.2, Math.PI * 0.6), mat(0xf2eee0)); arc.rotation.x = -Math.PI / 2; arc.rotation.z = 0; arc.position.set(0, 0.006, -3.3); room.add(arc);
  P(12.8, 0.1, 0xf2eee0, 1.4, -4.55);
}
{
  const WALL = TEX.plaster("#d6cdb2", "#b9ae92", 3), COL = 0xa8a090;
  tbox(room, 12.8, 1.0, 0.25, WALL, 2, 1.4, 0.5, -4.85, { noShadow: true }); box(room, 12.8, 0.1, 0.3, 0xe9e2cc, 1.4, 1.02, -4.85, { noShadow: true });       // the back wall, low
  for (const sx of [-1, 1]) { tbox(room, 0.25, 1.0, 13, WALL, 2, sx * 5.0, 0.5, 1.4, { noShadow: true }); box(room, 0.3, 0.1, 13, 0xe9e2cc, sx * 5.0, 1.02, 1.4, { noShadow: true }); }   // the side walls, low
  for (const sx of [-1, 1]) for (const z of [-4.85, -1.6, 1.6, 4.8, 8.0]) box(room, 0.4, 4.7, 0.4, COL, sx * 5.0, 2.35, z, { noShadow: true });                      // columns
  for (const z of [-4.85, -1.6, 1.6, 4.8]) box(room, 0.3, 0.3, 0.3, 0x7d786c, 5.0 * 0, 0, z, { noShadow: true });
  // trusses and the dark roof above them
  const beam = (a, b, w, col) => { const d = a.distanceTo(b), m = box(room, w, w, d, col, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, { noShadow: true }); m.lookAt(b); return m; };
  for (const z of [-4.85, -1.6, 1.6, 4.8, 8.0]) {
    const lo = v3(-5.2, 4.7, z), hi = v3(0, 6.1, z), ro = v3(5.2, 4.7, z);
    beam(lo, ro, 0.1, 0x3a3640); beam(lo, hi, 0.1, 0x3a3640); beam(hi, ro, 0.1, 0x3a3640);
    for (const f of [-3.4, -1.7, 0, 1.7, 3.4]) { const top = v3(f * 0.9, 4.7 + (6.1 - 4.7) * (1 - Math.abs(f * 0.9) / 5.2), z); beam(v3(f, 4.7, z), top, 0.05, 0x4a4650); }
  }
  for (const sx of [-1, 1]) { const m = box(room, 5.4, 0.1, 15, 0x34303a, sx * 2.6, 5.42, 1.4, { noShadow: true }); m.rotation.z = sx * -0.27; box(room, 0.1, 0.1, 15, 0x4a4650, sx * 5.2, 4.7, 1.4, { noShadow: true }); }
  for (const x of [-3.2, -1.2, 1.2, 3.2]) box(room, 0.16, 0.1, 15, 0x403c48, x, 5.3 + (6.1 - 5.3) * (1 - Math.abs(x) / 5.2) - 0.05, 1.4, { noShadow: true });    // purlins
}
// banderitas: strings of small coloured triangles between the trusses
{
  const COLS = [0xff3a5a, 0xffd23a, 0x3aaaff, 0x7ad870, 0xff7ad0, 0xf2f2ea];
  for (const [z, y0, k0] of [[-3.2, 4.2, 0], [-0.1, 4.25, 2], [3.2, 4.2, 4], [6.4, 4.25, 1]]) for (let i = 0; i < 36; i++) {
    const u = i / 35, x = -4.8 + u * 9.6, y = y0 - Math.sin(u * Math.PI) * 0.45;
    const p = mesh(room, new THREE.ConeGeometry(0.1, 0.24, 3), mat(COLS[(i + k0) % 6], { glow: 0.62 }), x, y - 0.12, z, { noShadow: true }); p.rotation.set(0, Math.PI / 2, Math.PI);
    if (i < 35) { const rp = box(room, 0.28, 0.008, 0.008, 0xd8d0c0, x + 0.13, y + 0.0, z, { noShadow: true }); rp.rotation.z = -Math.cos(u * Math.PI) * 0.12; }
  }
}
// three hanging lamps and the warm light under them
const LAMPS = [];
for (const [x, y, z, I] of [[-1.5, 3.7, 0.7, 2.6], [1.6, 3.7, -0.7, 2.4], [0.1, 3.8, -2.6, 0.7]]) {
  const g = group(room, x, 0, z);
  box(g, 0.012, 4.7 - y, 0.012, 0x222226, 0, (4.7 + y) / 2, 0, { noShadow: true });
  const sh = mesh(g, new THREE.CylinderGeometry(0.07, 0.3, 0.22, 14, 1, true), mat(0x2c2c34, { side: 1 }), 0, y + 0.1, 0, { noShadow: true });
  mesh(g, new THREE.SphereGeometry(0.075, 8, 6), mat(0xfff0c8, { glow: 2.2 }), 0, y - 0.01, 0, { noShadow: true });
  const pl = new THREE.PointLight(0xffe2b4, I, 10, 1.3); pl.position.set(x, y - 0.1, z); room.add(pl); LAMPS.push(pl);
}
const keyLight = new THREE.DirectionalLight(0xffe9c8, 1.5); keyLight.position.set(3.5, 6.0, 6.5); keyLight.target.position.set(0, 1.0, -0.2); scene.add(keyLight, keyLight.target);        // a low warm sun from the camera side: faces are lit, never dark
keyLight.castShadow = true; keyLight.shadow.mapSize.set(2048, 2048); keyLight.shadow.bias = -0.0012; keyLight.shadow.normalBias = 0.02;
Object.assign(keyLight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 }); keyLight.shadow.camera.updateProjectionMatrix();

// ================= the hoop, the poles and the bedsheet =================
const HX = 0.0, SZ = -3.1;                                                                                  // the hoop and the sheet centre line
{
  const g = group(room, HX, 0, 0);
  box(g, 0.2, 4.8, 0.2, 0x35383f, 0, 2.4, -4.5, { noShadow: true }); box(g, 0.14, 0.14, 1.2, 0x35383f, 0, 3.9, -3.95, { noShadow: true });       // the post and its arm
  box(g, 1.8, 1.05, 0.06, 0xb9b9b4, 0, 3.87, -3.45, { noShadow: true });                                                                           // the backboard
  for (const [w, h, x, y] of [[1.8, 0.05, 0, 4.375], [1.8, 0.05, 0, 3.35], [0.05, 1.05, -0.9, 3.87], [0.05, 1.05, 0.9, 3.87]]) box(g, w, h, 0.07, 0xd62d2d, x, y, -3.45, { noShadow: true });
  for (const [w, h, x, y] of [[0.6, 0.04, 0, 3.55], [0.6, 0.04, 0, 4.01], [0.04, 0.5, -0.3, 3.78], [0.04, 0.5, 0.3, 3.78]]) box(g, w, h, 0.07, 0xd62d2d, x, y, -3.45, { noShadow: true });   // the square on the board
  box(g, 0.5, 0.04, 0.3, 0x8a8f99, 0, 3.42, -3.28, { noShadow: true });                                                                            // the ring's bracket
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.014, 6, 24), mat(0xe8531e, { rim: 0.6 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 3.42, -3.0); g.add(ring);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, nb = box(g, 0.012, 0.42, 0.012, 0xf4f4ee, Math.cos(a) * 0.19, 3.21, -3.0 + Math.sin(a) * 0.19, { noShadow: true }); nb.rotation.z = -Math.cos(a) * 0.2; nb.rotation.x = Math.sin(a) * 0.2; }
  for (const y of [3.28, 3.15]) { const nr = new THREE.Mesh(new THREE.TorusGeometry(0.2 - (3.35 - y) * 0.12, 0.006, 4, 16), mat(0xf4f4ee)); nr.rotation.x = Math.PI / 2; nr.position.set(0, y, -3.0); g.add(nr); }
}
// the two poles (steel, on weighted bases) and the rope they carry
for (const sx of [-1, 1]) { const x = HX + sx * 0.92; box(room, 0.07, 3.3, 0.07, 0x7d838c, x, 1.65, SZ - 0.1, { rim: 0.6 }); box(room, 0.55, 0.06, 0.5, 0x3a3d44, x, 0.03, SZ - 0.1, { noShadow: true }); }
const rope = box(room, 1.84, 0.014, 0.014, 0xe8dfc8, HX, 3.02, SZ - 0.04, { noShadow: true });
// the sheet: a canvas redrawn from the state of the app; a slightly sagging, creased bedsheet
const SHW = 1.3, SHH = 0.9, SHY = 2.45;
const sheetC = document.createElement("canvas"); sheetC.width = 160; sheetC.height = 112;
const sg = sheetC.getContext("2d");
const sheetT = new THREE.CanvasTexture(sheetC); sheetT.colorSpace = THREE.SRGBColorSpace; sheetT.magFilter = THREE.NearestFilter; sheetT.minFilter = THREE.LinearFilter; sheetT.generateMipmaps = false;
function drawSheet(green, flash, plain) {
  const g = sg, W2 = 160, H2 = 112;
  g.fillStyle = green ? "#12a84a" : "#d4202a"; g.fillRect(0, 0, W2, H2);
  g.fillStyle = green ? "#0e8e3c" : "#b01820";                                                                // soft cloth folds: a few darker vertical bands
  for (const [x, w] of [[22, 5], [58, 3], [101, 6], [138, 4]]) g.fillRect(x, 0, w, H2);
  g.fillStyle = green ? "#31c765" : "#e84a52"; for (const [x, w] of [[30, 2], [66, 2], [109, 3], [146, 2]]) g.fillRect(x, 0, w, H2);
  g.fillStyle = green ? "#0c7a34" : "#8c1018"; g.fillRect(0, H2 - 4, W2, 4);                                  // the hem
  if (plain) { /* the two close cameras see only a corner of the cloth: there it is plain, in its colour, so no piece of a letter or of the mark shows */ }
  else if (green) {                                                                                           // the mark sits in the middle: the bottom quarter of the cloth is left plain, the stage shot's caption goes there
    g.strokeStyle = "#ffffff"; g.lineWidth = 9; g.lineCap = "butt"; g.lineJoin = "miter"; g.beginPath(); g.moveTo(56, 54); g.lineTo(73, 71); g.lineTo(106, 33); g.stroke();
    if (ATLAS && ATLAS.ptext) ATLAS.ptext(g, "ONLINE", 80, 5, "#ffffff", { font: 5, scale: 4, align: "center", shadow: "#0a5a26", sd: 2 });
  } else {
    if (ATLAS && ATLAS.ptext) ATLAS.ptext(g, "ERROR", 80, 5, "#ffffff", { font: 5, scale: 4, align: "center", shadow: "#6a0c12", sd: 2 });
    g.fillStyle = "#ffffff"; g.fillRect(54, 40, 8, 13); g.fillRect(98, 40, 8, 13);                            // a small sad face: two eyes and a turned-down mouth
    g.fillRect(60, 64, 40, 6); g.fillRect(54, 68, 8, 7); g.fillRect(98, 68, 8, 7);
  }
  if (flash > 0) { g.fillStyle = "rgba(255,255,255," + Math.min(1, flash).toFixed(2) + ")"; g.fillRect(0, 0, W2, H2); }
  sheetT.needsUpdate = true;
}
{
  const geo = new THREE.PlaneGeometry(SHW, SHH, 20, 10), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.018 * Math.sin(x * 9.5 + 0.6) + 0.012 * Math.sin(x * 21 + y * 3) + 0.03 * (1 - ((y + SHH / 2) / SHH)) * Math.sin(x * 3.1) + 0.02 * Math.cos(y * 4)); }
  geo.computeVertexNormals();
  const sheet = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: sheetT, color: new THREE.Color(1.12, 1.12, 1.12) })); sheet.position.set(HX, SHY, SZ); room.add(sheet);
  for (const sx of [-0.58, -0.3, 0, 0.3, 0.58]) box(room, 0.02, 0.07, 0.02, 0xe8dfc8, HX + sx * 1.02, SHY + SHH / 2 + 0.02, SZ - 0.01, { noShadow: true });   // the ties that hold it to the rope
}
// the scoreboard box on the right pole, and its red lamp
const lampLens = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.04, 0.04) });
const lampHalo = new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, map: painted(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,0.95)"); r.addColorStop(0.45, "rgba(255,255,255,0.3)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }, { mip: false }) });
const lampLight = new THREE.PointLight(0xff3020, 0, 5, 1.6);
{
  const g = group(room, HX + 0.42, 3.06, SZ + 0.0);
  for (const sx of [-0.07, 0.07]) box(g, 0.012, 0.1, 0.012, 0xe8dfc8, sx, 0.11, 0, { noShadow: true });
  box(g, 0.36, 0.2, 0.12, 0x2a2b31, 0, 0, 0, { noShadow: true });
  const lens = mesh(g, new THREE.CylinderGeometry(0.078, 0.078, 0.03, 16), lampLens, 0, 0, 0.07, { noShadow: true }); lens.rotation.x = Math.PI / 2;
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), lampHalo); hl.position.set(0, 0, 0.1); g.add(hl);
  lampLight.position.set(0, 0, 0.5); g.add(lampLight);
}
const projLight = new THREE.PointLight(0xff3a3a, 2.0, 5.5, 1.3); projLight.position.set(HX, SHY - 0.1, SZ + 1.5); room.add(projLight);       // the sheet's light on whoever stands in front of it

// ================= the stage: table, laptop, projector, Claude, Buloy's legs =================
const ZS = 0.4, TB_X = -0.3, TB_Z = -0.5 + ZS, TB_TOP = 0.76, TB_W = 1.4;                                       // the table runs from x -1.0 to 0.4: the laptop at Buloy's right hand, Claude in front of him, the projector at the far end
{
  const g = group(room, TB_X, 0, TB_Z);
  box(g, TB_W, 0.04, 0.55, 0xf4f2ea, 0, TB_TOP - 0.02, 0); box(g, TB_W - 0.06, 0.06, 0.5, 0xe0ddd2, 0, TB_TOP - 0.07, 0, { noShadow: true });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.04, 0.72, 0.04, 0xbfbcb0, sx * (TB_W / 2 - 0.05), 0.36, sz * 0.23, { noShadow: true });
  box(g, TB_W - 0.1, 0.03, 0.03, 0xbfbcb0, 0, 0.22, 0.23, { noShadow: true }); box(g, TB_W - 0.1, 0.03, 0.03, 0xbfbcb0, 0, 0.22, -0.23, { noShadow: true });
}
const tableP = makeProp("table", room, { surface: true }); tableP.g.position.set(TB_X, TB_TOP - 0.02, TB_Z); tableP.part(tableP.g, "box", { h: [TB_W / 2, 0.02, 0.275] });
laptop.visible = false;
const lap = makeLaptop(room, { name: "laptop", tex: scrTex, k: 1.1 });
lap.sockets.key = (H, G = {}) => {                                                                          // one fingertip on the deck: G.x, G.z where (laptop frame), G.dir the way the finger points
  const dir = (G.dir || v3(0, 0, -1)).clone().normalize(), f = dir.clone().multiplyScalar(0.64).add(v3(0, -0.77, 0)), n = dir.clone().multiplyScalar(0.77).add(v3(0, 0.64, 0));
  return { p: v3(G.x || 0, lap.dim.T / 2, G.z || 0), n, f, anchor: [fingerX(H.s, 0), HD.rootY - HD.len[0]], depth: HD.th[2] / 2, lift: G.lift ?? 0.001, pose: HAND_POSES.point };
};
const RISER = { x: -0.74, z: TB_Z - 0.1, w: 0.4, h: 0.12, d: 0.3 };                                           // a carton under the laptop: the keys come up to where a standing man's hand reaches
const LAP_POS = v3(RISER.x, TB_TOP + RISER.h + lap.dim.T / 2 + 0.0006, RISER.z), LAP_Q = qEuler(0, Math.PI - 0.8, 0);   // the laptop is at his right hand and turned to him: from the seats its keys and his finger are seen from the side
{
  const g = group(room, RISER.x, TB_TOP + RISER.h / 2, RISER.z);
  box(g, RISER.w, RISER.h, RISER.d, 0xb58a56, 0, 0, 0); box(g, RISER.w + 0.004, 0.022, RISER.d + 0.004, 0xcfa873, 0, RISER.h / 2 - 0.02, 0, { noShadow: true });       // the carton and the fold of its lid
  box(g, 0.05, RISER.h + 0.002, RISER.d + 0.006, 0xd9c7a0, 0, 0, 0, { noShadow: true });                                                              // packing tape round it
}
const riserP = makeProp("riser", room, { surface: true }); riserP.g.position.set(RISER.x, TB_TOP + RISER.h / 2, RISER.z); riserP.part(riserP.g, "box", { h: [RISER.w / 2, RISER.h / 2, RISER.d / 2] });
const CLAUDE_X = -0.24;                                                                                     // Claude sits in front of Buloy, a hand's width from the carton: his close-up has the hoodie behind it, and nobody's arm crosses him
{
  const pj = group(room, 0.28, TB_TOP, TB_Z - 0.08); pj.rotation.y = -0.12;                                    // a small projector at the right end of the table, its lens toward the sheet
  box(pj, 0.2, 0.075, 0.16, 0x2c2e36, 0, 0.0375, 0); box(pj, 0.2, 0.012, 0.16, 0x474a55, 0, 0.082, 0, { noShadow: true });
  const ln = mesh(pj, new THREE.CylinderGeometry(0.03, 0.034, 0.05, 12), mat(0x14151a), 0, 0.04, -0.1); ln.rotation.x = Math.PI / 2; mesh(pj, new THREE.CylinderGeometry(0.02, 0.02, 0.01, 10), mat(0xcfe6ff, { glow: 1.4 }), 0, 0.04, -0.128, { noShadow: true }).rotation.x = Math.PI / 2;
}
room.add(C); C.visible = true; C.scale.setScalar(0.95);
room.add(V); V.visible = true; V.children[0].visible = false; V.children[1].visible = false;               // his seated legs stay hidden: he stands, on legs of his own
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
for (const s of [-1, 1]) {
  mesh(V, limb(0.97, 0.088, 0.058, 9, 0.9), cargoM, s * 0.092, 0.56, 0.0);
  mesh(V, new THREE.CylinderGeometry(0.058, 0.056, 0.035, 9), mat(HOOD_D, R), s * 0.092, -0.36, 0);
  const sh = group(V, s * 0.092, -0.43, 0.0); sh.rotation.y = s * 0.1;
  mesh(sh, new RoundedBoxGeometry(0.108, 0.04, 0.285, 2, 0.016), mat(0xf4f1ea, R), 0, 0.02, 0.06); mesh(sh, new RoundedBoxGeometry(0.098, 0.075, 0.2, 2, 0.03), mat(0xdedbd4, R), 0, 0.07, 0.03);
  mesh(sh, new RoundedBoxGeometry(0.094, 0.05, 0.1, 2, 0.026), mat(0x17161b, R), 0, 0.045, 0.14);
}
const BUL = [-0.3, 0.43, -0.98 + ZS];

// ================= the Kapitana: a bright polo, short greying hair, a lanyard, a rubber stamp =================
const KP = [0.34, 0.03, 0.1 + ZS], KRY = -0.5;
const kap = makeBuloy({ young: true, girl: true, prof: true, strap: false, parent: room, at: KP, shirt: 0x14a39a, shirtD: 0x0f7a74, legs: 0x2d3150 });
kap.V.rotation.y = KRY; kap.vUpper.rotation.x = 0.06;
{
  const GREY = mat(0x8c8a96, R), GREY2 = mat(0xb2b0bc, R), DARK = mat(HAIR, R), DARK2 = mat(HAIR_HI, R);
  kap.vHead.traverse((m) => { if (!m.isMesh) return; if (m.material === DARK) m.material = GREY; else if (m.material === DARK2) m.material = GREY2; });
  for (const m of kap.vHead.children) if (m.isMesh && Math.abs(m.position.y - 0.292) < 1e-4 && Math.abs(m.position.z + 0.07) < 1e-4) m.visible = false;      // no bun: short hair
  for (const m of kap.vHead.children) if (m.isMesh && Math.abs(m.position.y - 0.222) < 1e-4 && Math.abs(m.scale.y - 0.034) < 1e-4) m.visible = false;
  for (const s of [-1, 1]) { const c = box(kap.vUpper, 0.07, 0.03, 0.05, 0xf0efe6, s * 0.052, 0.505, 0.075, R); c.rotation.set(0.5, -s * 0.5, s * 0.5); }      // the polo's collar
  box(kap.vUpper, 0.02, 0.2, 0.006, 0x0c6a64, 0, 0.4, 0.147, { noShadow: true });                                                                  // the placket
  for (const y of [0.47, 0.42, 0.37]) box(kap.vUpper, 0.014, 0.014, 0.008, 0xf0efe6, 0, y, 0.15, { noShadow: true });
}
gripRigPerson("kap", kap);
const kapRig = { vUpper: kap.vUpper, armL: kap.armL, armR: kap.armR };
const KR = armRig(kapRig, -1, "kap");                                                                       // her right arm: the stamp
const kapFace = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0 }, bulFace = { ...kapFace };
// her chair and her little table with the folder on it
function monobloc(x, z, ry, col = 0xf2f0ea) {
  const g = group(room, x, 0, z); g.rotation.y = ry;
  mesh(g, new RoundedBoxGeometry(0.44, 0.05, 0.44, 2, 0.02), mat(col, R), 0, 0.45, 0); mesh(g, new RoundedBoxGeometry(0.42, 0.4, 0.05, 2, 0.02), mat(col, R), 0, 0.68, -0.2).rotation.x = -0.12;
  for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) box(g, 0.045, 0.44, 0.045, col, sx, 0.22, sz, { noShadow: true });
  return g;
}
monobloc(KP[0], KP[2] - 0.02, KRY);                                                                        // the chair faces her way: its back is behind her
const ST = { x: -0.05, z: 0.24 + ZS, top: 0.73 };
{
  const g = group(room, ST.x, 0, ST.z);
  box(g, 0.5, 0.03, 0.36, 0xf4f2ea, 0, ST.top - 0.015, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.035, 0.7, 0.035, 0xbfbcb0, sx * 0.22, 0.35, sz * 0.15, { noShadow: true });
}
const smallP = makeProp("sidetable", room, { surface: true }); smallP.g.position.set(ST.x, ST.top - 0.015, ST.z); smallP.part(smallP.g, "box", { h: [0.25, 0.015, 0.18] });
const folder = makeProp("folder", room); folder.dim = { w: 0.24, h: 0.012, d: 0.32 }; folder.rad = 0.2;
folder.box(folder.g, 0.24, 0.012, 0.32, 0xe0bf6a, 0, 0, 0, { mat: {} }); box(folder.g, 0.09, 0.012, 0.03, 0xc79c3e, -0.05, 0, -0.17, { noShadow: true });
for (let i = 0; i < 4; i++) box(folder.g, 0.15, 0.002, 0.008, 0x9c7a2a, 0, 0.0075, -0.08 + i * 0.045, { noShadow: true });
const FOLDER_TOP = ST.top + 0.012 + 0.0006;
// what the stamp leaves on the page: a red box with a tick in it (no word: it would be too small to read whole)
const inkMark = group(folder.g, -0.02, 0.0092, -0.03); inkMark.rotation.y = 0.18; inkMark.visible = false;
{
  const INK = 0xc22a22, o = { noShadow: true };
  for (const sz of [-1, 1]) box(inkMark, 0.112, 0.0012, 0.01, INK, 0, 0, sz * 0.027, o);
  for (const sx of [-1, 1]) box(inkMark, 0.01, 0.0012, 0.064, INK, sx * 0.051, 0, 0, o);
  const a = box(inkMark, 0.024, 0.0012, 0.013, INK, -0.016, 0, 0.006, o); a.rotation.y = -0.72;                 // the tick: a short stroke down, a long one up
  const b = box(inkMark, 0.046, 0.0012, 0.013, INK, 0.009, 0, -0.002, o); b.rotation.y = 0.8;
}
// the rubber stamp: a knob, a handle, a wide wooden block, a red-inked pad. Its frame: the pad's underside at y 0.
const stamp = makeProp("stamp", room); stamp.rad = 0.16;
stamp.box(stamp.g, 0.108, 0.012, 0.058, 0xd0241c, 0, 0.006, 0, { mat: {} });                                 // the pad (inked)
stamp.box(stamp.g, 0.128, 0.028, 0.072, 0x7a4a26, 0, 0.026, 0, { mat: {} });                                  // the block
stamp.cyl(stamp.g, 0.0165, 0.11, 0x5a3418, 0, 0.095, 0, { mat: {} });                                        // the handle: long enough that the fist sits clear of the block
stamp.sph(stamp.g, 0.026, mat(0x5a3418, R), 0, 0.166, 0);                                                      // the knob
const HANDLE_Y = 0.108;
const SP_UP = v3(0.03, 1.27, 0.54), STAMP_REF = v3(0.45, 0, -0.9).normalize(), COCK = 0.6;                          // where she holds it up (in front of her right shoulder, clear of her face); which way the knob points there (the inked face toward the seats); the cock of her wrist
const _q0 = qEuler(0.0, 0.3, 0), _qp = new THREE.Quaternion(), _qs = new THREE.Quaternion(), _fa = new THREE.Vector3(), _pp = new THREE.Vector3(), _xa = new THREE.Vector3(), _ya = new THREE.Vector3(), _za = new THREE.Vector3(), _mb = new THREE.Matrix4();
{
  const _sinv = new THREE.Matrix4();
  stamp.sockets.wrap = (H, G = {}) => {                                                                      // a fist round the handle, on the side that keeps the wrist straight (the mic's rule)
    let n = null;
    if (G.A) { const fl = v3(0, -1, 0).transformDirection(G.A.fore.matrixWorld).transformDirection(_sinv.copy(stamp.g.matrixWorld).invert()); fl.y = 0; if (fl.lengthSq() > 0.03) n = v3(0, 1, 0).cross(fl.normalize()).multiplyScalar(H.s); }
    if (!n) n = v3(0, 0, -1);
    const f = v3(0, 1, 0).cross(n).multiplyScalar(-H.s);
    return { p: v3(0, HANDLE_Y - 0.01, 0).addScaledVector(n, 0.0165), n, f, anchor: [0, HD.rootY + 0.004], thumb: "oppose", splay: 0.1 };
  };
}

// ================= the crowd: two short rows of monobloc chairs, five to seven people seen from behind =================
const crowd = [], crowdNodes = [];
{
  const r = rng(808), SK = [0xc58b62, 0xb07548, 0xd49d7c, 0xa87a58], SH = [0xd9412e, 0x3d63c9, 0xe9c03a, 0x5a9a5a, 0xeeeee6, 0x9a5ac8, 0xe07a9c, 0x2f8a9a], HR = [0x1a161f, 0x2a1c14, 0x3a2e22, 0x14121a, 0x6a6672];
  const spots = [[-1.35, 1.8], [-0.5, 1.8], [0.45, 1.8], [1.3, 1.8], [-1.0, 2.45], [0.05, 2.45], [0.95, 2.45]];
  spots.forEach(([x, z], i) => {
    crowdNodes.push(monobloc(x, z - 0.02, Math.PI, [0xf2f0ea, 0xe8e4d8, 0xf2f0ea][i % 3]));
    const g = group(room, x, 0.0, z), sc = 0.9 + r() * 0.12; g.rotation.y = Math.PI + (r() - 0.5) * 0.3; g.scale.setScalar(sc);
    const body = group(g, 0, 0.5, 0), sk = mat(SK[i % 4], R), shirt = mat(SH[(i * 3 + 1) % 8], R), hair = mat(HR[i % 5], R);
    mesh(body, new RoundedBoxGeometry(0.36, 0.52, 0.22, 2, 0.07), shirt, 0, 0.27, 0);
    for (const s of [-1, 1]) { box(g, 0.15, 0.14, 0.4, 0x2d3150, s * 0.09, 0.52, 0.18, R); box(g, 0.12, 0.42, 0.12, 0x2d3150, s * 0.09, 0.26, 0.38, R); box(g, 0.1, 0.05, 0.2, 0xd8d4ca, s * 0.09, 0.025, 0.42, R); }
    const neck = group(body, 0, 0.55, 0); mesh(neck, new THREE.CylinderGeometry(0.04, 0.045, 0.07, 8), sk, 0, 0, 0);
    const head = group(neck, 0, 0.1, 0); mesh(head, new THREE.SphereGeometry(0.105, 10, 8), sk, 0, 0, 0);
    const cap = mesh(head, new THREE.SphereGeometry(0.113, 10, 8, 0, 6.3, 0, 1.75), hair, 0, 0.012, -0.012); cap.rotation.x = -0.2;
    if (i % 3 === 1) { mesh(head, new THREE.SphereGeometry(0.05, 8, 6), hair, 0, 0.0, -0.1); }
    const arms = [-1, 1].map((s) => { const a = group(body, s * 0.22, 0.46, 0); box(a, 0.075, 0.3, 0.075, SH[(i * 3 + 1) % 8], 0, -0.15, 0, R); const fa = group(a, 0, -0.3, 0); box(fa, 0.065, 0.26, 0.065, SK[i % 4], 0, -0.13, 0, R); return { a, fa, s }; });
    crowdNodes.push(g); crowd.push({ g, body, head, neck, arms, i, x, z });
  });
}

// ================= the clock of the film (times come from the acts and marks) =================
const AT = (ln, off = 0) => ln.s + off;
const HAND_PALM_UP = Math.PI;
const OATH = [-0.3, 0.6, 0.2, 0.0], LIPS = [-0.02, 0.54, 0.2, 0.0];                                         // right hand: raised for "Sumpa!", and the finger on the lips (x, y, z in the torso's frame, then the hand's roll)
const bulRig = { vUpper, armL, armR }, BR = armRig(bulRig, -1, "viron"), BL = armRig(bulRig, 1, "viron");
const _tp = new THREE.Vector3(), _tq = new THREE.Quaternion(), _tq2 = new THREE.Quaternion(), _lq = new THREE.Quaternion();
const V_UP = v3(0, 1, 0);

// Buloy's head, torso and arms are keyed over the film (value, ease), then the grips and the hands are posed on top.
// Head angles are relative to the torso; V.rotation.y is 0.2 (he faces a little toward the Kapitana). Bearings: the Kapitana 0.64, Claude 0.70 (lower), the keys -0.2, the camera 0.09.
const bl = {
  hy: [[0, 0.44]], hp: [[0, 0.22]], hr: [[0, 0]],                         // head yaw, pitch (+ down), roll
  uy: [[0, 0]], ul: [[0, 0.04]], ur: [[0, 0]],                                          // torso yaw (relative to V), lean (+ forward)
  brow: [[0, -0.6]], sad: [[0, 0.8]], smile: [[0, -0.2]], lid: [[0, -0.4]], gx: [[0, 0.6]], gy: [[0, 0.1]],
  wPl: [[0, 1]],                                                           // the plead pose (hands out, palms up)
  wCh: [[0, 0]],                                                           // right hand on the chest
  wUp: [[0, 0]],                                                           // both arms thrown up and toward the sheet
  wPr: [[0, 0]],                                                           // presenting the sheet with both open hands
  wLp: [[0, 0]],                                                           // right finger on the lips
  wLo: [[0, 0]],                                                           // the left hand held flat and low
  wOut: [[0, 0]],                                                          // both hands thrown out at her
  wFist: [[0, 0]],                                                         // both fists up (the cheer)
  hop: [[0, 0]], cheek: [[0, 0]], gape: [[0, 0]], blk: [[0, 0]],
};
const cutAt = (name, from) => { const c = (TL.shots || []).find((x) => x.shot === name && x.t >= from); return c ? c.t : 1e9; };   // when the film next cuts to a camera
{
  const k = (name, t, v, e) => bl[name].push([t, v, e]);
  const P = A.plead, AL = A.all, WT = A.wait, AY = A.ayan, BA = A.bati, PA = A.pala, NA = A.naman, US = A.usog, HU = A.hush, JO = A.joy, VI = A.video;
  const TO_CLAUDE = -0.2;                                                 // head yaw to Claude, who sits low, straight in front of him
  // --- b_plead: hands out, palms up, brows up and worried; on "Sumpa!" the right hand goes up in an oath, the left keeps pleading
  k("wCh", P.e - 1.1, 1, 0.22); k("wPl", P.e - 1.1, 0.85, 0.3);
  // --- c_all: his head snaps to Claude, betrayed; the hands drop
  k("hy", AL.s + 0.02, TO_CLAUDE, 0.14); k("hp", AL.s + 0.02, 0.62, 0.14); k("brow", AL.s, -0.3, 0.1); k("sad", AL.s, 0.9, 0.1); k("smile", AL.s, -0.45, 0.1); k("lid", AL.s, 0.05, 0.1); k("gx", AL.s, 0.1, 0.1); k("gy", AL.s, 0.6, 0.1);
  k("wPl", P.e - 0.02, 0, 0.2); k("wCh", P.e - 0.02, 0, 0.2);
  // --- the silence: back to her, small and stiff, then down toward the keys for the first tap
  k("hy", WT.s - 0.3, 0.46, 0.3); k("hp", WT.s - 0.3, 0.26, 0.3); k("brow", WT.s - 0.3, -0.6, 0.3); k("sad", WT.s - 0.3, 0.7, 0.3); k("gx", WT.s - 0.3, 0.7, 0.3); k("gy", WT.s - 0.3, 0.1, 0.3);
  const bend = (tg, up) => {                                              // a short lean to the laptop, eyes on the keys, press, straighten: the face stays in the light
    k("ul", tg - 0.6, 0.5, 0.4); k("uy", tg - 0.6, -0.7, 0.4); k("ur", tg - 0.6, 0.18, 0.4); k("hp", tg - 0.6, 0.2, 0.35); k("hy", tg - 0.6, -0.2, 0.35); k("gy", tg - 0.6, 0.95, 0.3); k("gx", tg - 0.6, -0.2, 0.3);
    k("ul", tg + 0.3, 0.06, 0.4); k("uy", tg + 0.3, 0, 0.4); k("ur", tg + 0.3, 0, 0.4); k("hp", tg + 0.3, 0.1, 0.35);
  };
  bend(TAPS[0]); k("hy", TAPS[0] + 0.55, 0.45, 0.5);
  // --- b_ayan: green at g1; the body turns to the sheet, both arms thrown up toward it, a grin at the Kapitana; at r1 he freezes and the grin collapses
  k("uy", TM.g1 + 0.35, 1.75, 0.35); k("wUp", TM.g1 + 0.35, 1, 0.3); k("hy", TM.g1 + 0.35, -1.25, 0.35); k("hp", TM.g1 + 0.35, 0.0, 0.3); k("smile", TM.g1 + 0.3, 0.95, 0.25); k("brow", TM.g1 + 0.3, 0.7, 0.25); k("sad", TM.g1 + 0.3, 0, 0.25); k("lid", TM.g1 + 0.3, 0, 0.25); k("gx", TM.g1 + 0.3, -0.5, 0.25); k("gy", TM.g1 + 0.3, -0.05, 0.25); k("cheek", TM.g1 + 0.3, 1, 0.2);
  k("smile", TM.r1, -0.55, 0.12); k("brow", TM.r1, -0.55, 0.12); k("sad", TM.r1, 0.7, 0.12);
  // --- c_bati: he turns to Claude, arms dropping
  k("uy", BA.s - 0.45, 0, 0.6); k("wUp", BA.s - 0.45, 0, 0.5); k("hy", BA.s - 0.1, TO_CLAUDE, 0.45); k("hp", BA.s - 0.1, 0.6, 0.45); k("brow", BA.s, -0.2, 0.3); k("smile", BA.s, -0.35, 0.3); k("sad", BA.s, 0.55, 0.3); k("lid", BA.s, 0.3, 0.3); k("gy", BA.s, 0.6, 0.3); k("gx", BA.s, 0.1, 0.3);
  // --- the second tap, a finger to the lips, then presenting the sheet with both open hands, brows up, lips shut
  bend(TAPS[1]);
  k("hy", TAPS[1] + 0.55, 0.44, 0.4); k("hp", TAPS[1] + 0.55, 0.24, 0.4); k("gx", TAPS[1] + 0.55, 0.7, 0.3); k("gy", TAPS[1] + 0.55, 0.05, 0.3);
  k("wLp", TM.g2 + 0.15, 1, 0.3); k("brow", TM.g2 + 0.15, 0.8, 0.25); k("smile", TM.g2 + 0.15, 0.0, 0.25); k("sad", TM.g2 + 0.15, 0, 0.3); k("lid", TM.g2 + 0.15, 0, 0.3);
  k("wLp", TM.g2 + 0.9, 0, 0.35); k("wPr", TM.g2 + 0.9, 1, 0.4); k("smile", TM.g2 + 0.9, 0.12, 0.3);
  k("wPr", TM.r2, 0, 0.18); k("smile", TM.r2, -0.5, 0.15); k("brow", TM.r2, -0.5, 0.15); k("sad", TM.r2, 0.6, 0.2);
  // --- b_naman: both hands thrown out at her, exasperated
  k("wOut", NA.s - 0.35, 1, 0.3); k("brow", NA.s - 0.3, 0.2, 0.2); k("smile", NA.s - 0.3, -0.4, 0.2); k("sad", NA.s - 0.3, 0.5, 0.2); k("hy", NA.s - 0.3, 0.4, 0.2); k("hp", NA.s - 0.3, 0.08, 0.2); k("gy", NA.s - 0.3, 0, 0.2);
  k("wOut", NA.e + 0.02, 0, 0.2);
  // --- c_usog: he listens to Claude, frowning; when the film cuts to him the head is already coming up, and on "nauusog" it lands: eyes wide, mouth open, at nothing
  k("hy", US.s - 0.1, TO_CLAUDE, 0.4); k("hp", US.s - 0.1, 0.55, 0.4); k("brow", US.s, -0.25, 0.4); k("smile", US.s, -0.2, 0.4); k("lid", US.s, 0.2, 0.4); k("sad", US.s, 0.35, 0.4); k("gy", US.s, 0.6, 0.3); k("gx", US.s, 0.1, 0.3);
  const CUT_U = Math.min(cutAt("k_buloy", US.s), US.e - 0.6);
  k("hp", CUT_U - 0.25, 0.26, 0.3); k("gy", CUT_U - 0.25, 0.95, 0.3);
  const AHA = Math.min(CUT_U + 0.55, US.e - 0.25);
  k("brow", AHA, 0.95, 0.22); k("lid", AHA, -0.55, 0.2); k("smile", AHA, 0.0, 0.25); k("sad", AHA, 0.1, 0.25); k("hp", AHA, 0.04, 0.3); k("hy", AHA, 0.1, 0.3); k("gx", AHA, 0, 0.2); k("gy", AHA, -0.05, 0.2); k("gape", AHA, 1, 0.2);
  k("gape", TAPS[2] - 0.7, 0, 0.25); k("gx", TAPS[2] - 0.95, -0.9, 0.14); k("gy", TAPS[2] - 0.95, 0.3, 0.14);
  bend(TAPS[2]); k("hy", TAPS[2] + 0.5, -0.1, 0.35);
  // --- hush: he spins to the crowd with a finger on his lips, eyes wide
  k("uy", TM.hush - 0.2, -0.2, 0.28); k("hy", TM.hush - 0.15, -0.1, 0.25); k("hp", TM.hush - 0.15, 0.02, 0.25); k("wLp", TM.hush - 0.1, 1, 0.22); k("lid", TM.hush - 0.1, -0.5, 0.2); k("brow", TM.hush - 0.1, 0.8, 0.2); k("smile", TM.hush - 0.1, -0.1, 0.2); k("gx", TM.hush - 0.1, 0.0, 0.2); k("gy", TM.hush - 0.1, 0, 0.2); k("sad", TM.hush - 0.1, 0.3, 0.2);
  // --- b_hush: he whispers toward the Kapitana, the finger near his lips, the other hand flat and low
  k("hy", HU.s - 0.4, 0.42, 0.4); k("hp", HU.s - 0.4, 0.14, 0.4); k("gx", HU.s - 0.4, 0.7, 0.3); k("wLo", HU.s - 0.2, 1, 0.4); k("lid", HU.s - 0.3, 0.0, 0.3); k("uy", HU.s - 0.4, 0.05, 0.4);
  k("wLp", A.ok.s + 0.8, 0, 0.5); k("wLo", A.ok.s + 0.8, 0, 0.5); k("brow", A.ok.s + 0.8, 0.3, 0.5); k("smile", A.ok.s + 1.7, 0.4, 0.8);
  // --- b_joy: both fists up, he jumps, shouting; he freezes at r3, then sags
  k("wFist", JO.s - 0.1, 1, 0.12); k("smile", JO.s - 0.1, 1, 0.12); k("brow", JO.s - 0.1, 0.9, 0.12); k("hp", JO.s - 0.1, -0.12, 0.15); k("hy", JO.s - 0.1, 0.2, 0.2); k("cheek", JO.s - 0.1, 1, 0.1); k("gx", JO.s - 0.1, 0.4, 0.2); k("gy", JO.s - 0.1, -0.1, 0.2);
  k("hop", JO.s + 0.05, 1, 0.4); k("hop", TM.r3 + 0.08, 0, 0.12);
  // r3: he freezes with the fists still up, mouth open, and does not dare look behind him; only the eyes go; the fists sink
  k("smile", TM.r3, -0.5, 0.15); k("brow", TM.r3, 0.5, 0.15); k("sad", TM.r3, 0.9, 0.2); k("cheek", TM.r3, 0, 0.15); k("lid", TM.r3, -0.5, 0.15); k("gape", TM.r3 + 0.02, 1, 0.15); k("hp", TM.r3 + 0.1, 0.0, 0.3); k("hy", TM.r3 + 0.1, -0.13, 0.3);
  k("gx", TM.r3 + 0.45, -0.9, 0.25); k("gy", TM.r3 + 0.45, -0.1, 0.25);
  k("wFist", TM.r3 + 0.7, 0.4, 1.0);
  // --- c_video: the fists come down, he looks at Claude; when the film cuts to him he turns, slowly, and looks straight into the lens
  k("wFist", VI.s - 0.5, 0, 0.3); k("gape", VI.s - 0.3, 0, 0.3); k("hy", VI.s, TO_CLAUDE, 0.45); k("hp", VI.s, 0.5, 0.45); k("gx", VI.s, 0.1, 0.3); k("gy", VI.s, 0.6, 0.3); k("lid", VI.s, 0.2, 0.3); k("brow", VI.s, -0.2, 0.3); k("sad", VI.s, 0.5, 0.3);
  k("hp", VI.e - 0.8, 0.05, 0.5); k("hy", VI.e - 0.8, 0.08, 0.5); k("gx", VI.e - 0.7, 0, 0.4); k("gy", VI.e - 0.7, 0.0, 0.4);
  k("lid", VI.e - 0.7, 0.3, 0.4); k("brow", VI.e - 0.7, 0.2, 0.4); k("smile", VI.e - 0.7, -0.45, 0.4); k("sad", VI.e - 0.7, 0.85, 0.4);
  k("blk", VI.e + 0.62, 1, 0.09); k("blk", VI.e + 0.8, 0, 0.12);                                           // one slow blink, alone, after the line
  for (const a of Object.values(bl)) a.sort((x, y) => x[0] - y[0]);
}
const B = (name, t) => track(bl[name], t, 0.4);

// Claude, the Kapitana and the crowd are keyed the same way
const cl = { yaw: [[0, -0.22]], nubUp: [[0, 0]], tilt: [[0, 0]] };
{ for (const ln of [A.all, A.bati, A.usog, A.video]) { cl.yaw.push([ln.s - 0.2, -0.5, 0.3], [ln.e + 0.3, -0.22, 0.5]); cl.tilt.push([ln.s - 0.15, 0.5, 0.3], [ln.e + 0.2, 0, 0.4]); }   // on his lines he turns to his own camera (front left) and tips back a little
  cl.nubUp.push([A.bati.s + 0.7, 1, 0.25], [A.bati.e + 0.15, 0, 0.35], [A.usog.s + 0.5, 1, 0.3], [A.usog.s + 2.4, 0, 0.35]); for (const a of Object.values(cl)) a.sort((x, y) => x[0] - y[0]); }   // the nub goes up at the sheet on "siyang" and on "ang demo": it says who "siya" is
// stampUp: 1 held up beside her (the threat), 0 over the folder. stampH: how high it hovers over the folder when it is down there (x 0.5 m). stampOff: the lift after it has landed.
const kp = { hy: [[0, -0.62]], hp: [[0, 0.04]], hr: [[0, 0]], ul: [[0, 0.06]], uy: [[0, 0]], smile: [[0, -0.18]], brow: [[0, 0.02]], lid: [[0, 0.3]], gx: [[0, -0.5]], gy: [[0, 0]], cheek: [[0, 0]], stampUp: [[0, 1]], stampH: [[0, 0.3]], stampOff: [[0, 0]], wave: [[0, 0]], laugh: [[0, 0]] };
{
  const k = (name, t, v, e) => kp[name].push([t, v, e]);
  const WT = A.wait, PA = A.pala, OK = A.ok, PW = A.pwera, CD = A.card;
  // the head shake on "iho", small
  k("hy", WT.e - 1.1, -0.66, 0.12); k("hy", WT.e - 0.9, -0.5, 0.12); k("hy", WT.e - 0.7, -0.66, 0.12); k("hy", WT.e - 0.5, -0.52, 0.12); k("hy", WT.e - 0.3, -0.62, 0.15); k("hr", WT.e - 1.1, -0.04, 0.2); k("hr", WT.e - 0.3, 0, 0.3);
  // g1: the stamp comes halfway down and she looks up at the sheet; r1: it goes back up, her face flat
  k("stampUp", TM.g1 + 0.15, 0.4, 0.6); k("hy", TM.g1 + 0.12, -1.25, 0.3); k("hp", TM.g1 + 0.12, -0.22, 0.3); k("gx", TM.g1 + 0.12, -0.7, 0.3); k("brow", TM.g1 + 0.12, 0.4, 0.3); k("lid", TM.g1 + 0.12, 0.0, 0.3);
  k("stampUp", TM.r1 + 0.05, 1, 0.25); k("hy", TM.r1 + 0.25, -0.62, 0.35); k("hp", TM.r1 + 0.25, 0.04, 0.35); k("gx", TM.r1 + 0.25, -0.5, 0.3); k("brow", TM.r1 + 0.25, 0.0, 0.3); k("lid", TM.r1 + 0.25, 0.3, 0.3);
  // g2: the sheet again, the stamp starts down; k_pala: she leans forward, pleased, and it is a hand's width from the paper when the sheet turns red: it jerks back up
  k("hy", TM.g2 + 0.12, -1.2, 0.3); k("hp", TM.g2 + 0.12, -0.2, 0.3); k("gx", TM.g2 + 0.12, -0.7, 0.3); k("brow", TM.g2 + 0.12, 0.4, 0.3); k("lid", TM.g2 + 0.12, 0.0, 0.3);
  k("stampUp", TM.g2 + 0.3, 0.45, 0.6);
  k("hy", PA.s - 0.2, -0.64, 0.3); k("hp", PA.s - 0.2, 0.06, 0.3); k("gx", PA.s - 0.2, -0.5, 0.3); k("ul", PA.s - 0.1, 0.32, 0.4); k("smile", PA.s - 0.1, 0.55, 0.3); k("cheek", PA.s - 0.1, 0.8, 0.3); k("brow", PA.s - 0.1, 0.3, 0.3);
  k("stampUp", PA.s - 0.1, 0, 0.7); k("stampH", PA.s + 0.1, 0.1, 0.7);
  k("stampUp", TM.r2 + 0.12, 1, 0.22); k("stampH", TM.r2 + 0.12, 0.3, 0.3); k("ul", TM.r2 + 0.06, 0.0, 0.22);
  k("smile", TM.r2 + 0.05, -0.15, 0.2); k("cheek", TM.r2 + 0.05, 0, 0.2); k("brow", TM.r2 + 0.05, 0.0, 0.25); k("lid", TM.r2 + 0.05, 0.35, 0.3); k("ul", PA.e + 0.4, 0.08, 0.7);
  // she listens to Claude's explanation, glancing at the sheet; g3: eyes up at it, the stamp halfway; hush: she holds still
  k("hy", A.usog.s + 0.5, -0.85, 0.5); k("hp", A.usog.s + 0.5, 0.08, 0.4); k("smile", A.usog.s + 0.6, 0.1, 0.5); k("lid", A.usog.s + 0.6, 0.2, 0.4);
  k("hy", TM.g3 + 0.1, -1.25, 0.3); k("hp", TM.g3 + 0.1, -0.2, 0.3); k("brow", TM.g3 + 0.1, 0.4, 0.3); k("stampUp", TM.g3 + 0.3, 0.5, 0.6);
  k("hy", A.hush.s - 0.1, -0.64, 0.35); k("hp", A.hush.s - 0.1, 0.04, 0.35); k("brow", A.hush.s - 0.1, 0.1, 0.3); k("smile", A.hush.s - 0.1, 0.05, 0.4);
  // k_ok: she looks up at the sheet, lifts the stamp high, nods, whispers; at the stamp mark it comes down on the folder
  k("hy", OK.s - 0.5, -1.25, 0.4); k("hp", OK.s - 0.5, -0.2, 0.4); k("gx", OK.s - 0.5, -0.7, 0.3); k("brow", OK.s - 0.5, 0.35, 0.3); k("lid", OK.s - 0.5, 0.0, 0.3); k("smile", OK.s - 0.3, 0.2, 0.4);
  k("stampUp", OK.s - 0.45, 1, 0.4);
  // k_pwera: from the sheet to him, plainly, the stamp lifted off the mark it left, a small wave of the free hand, a smile
  k("hy", PW.s - 0.3, -0.62, 0.35); k("hp", PW.s - 0.3, 0.04, 0.35); k("gx", PW.s - 0.3, -0.5, 0.3); k("smile", PW.s - 0.3, 0.6, 0.4); k("cheek", PW.s - 0.3, 0.8, 0.4); k("brow", PW.s - 0.3, 0.3, 0.3); k("lid", PW.s - 0.3, 0.15, 0.3);
  k("stampOff", PW.s - 0.25, 0.26, 0.35);
  k("wave", PW.s + 0.1, 1, 0.3); k("wave", PW.e + 0.1, 0, 0.35);
  k("smile", TM.r3 + 0.1, 0.9, 0.4);
  // the card: laughing
  k("laugh", CD.s - 0.3, 1, 0.3); k("smile", CD.s - 0.3, 1, 0.3); k("cheek", CD.s - 0.3, 1, 0.3); k("hp", CD.s - 0.2, -0.12, 0.3); k("hy", CD.s - 0.2, -0.55, 0.3);
  for (const a of Object.values(kp)) a.sort((x, y) => x[0] - y[0]);
}
const K = (name, t) => track(kp[name], t, 0.4);
const CL = (name, t) => track(cl[name], t, 0.4);

// the shots. Cameras look down -z; the sheet and the lamp are at the top of the wide shot.
const SET = {
  name: "court",
  mode: () => "court",
  keys: () => [{ t: 0.05, label: "frame0" }, { t: TAPS[0], label: "tap1" }, { t: TAPS[1], label: "tap2" }, { t: TAPS[2], label: "tap3" }, { t: TM.stamp + 0.02, label: "stamp-lands" }, { t: TM.r1 + 0.1, label: "r1-plus" }, { t: TM.hush + 0.3, label: "hush-plus" }],
  shots: {
    k_hook:   { p: [-0.05, 1.0, 7.0], l: [-0.05, 1.42, -1.0], fov: 17, d: [0, 0, -0.14], cap: 478 },                         // the stage from the back row on a long lens: the sheet over Buloy over the raised stamp, all above the bottom quarter; the caption sits on the plain foot of the sheet
    k_stack:  { p: [-0.1, 1.0, 6.85], l: [-0.1, 1.42, -1.0], fov: 17, d: [0, 0, 0], cap: 545 },                            // the same view, held still, for the lines the sheet answers (their captions are one row)
    k_claude: { p: [-1.09, 1.1, 1.42], l: [-0.227, 1.056, -0.273], fov: 40, d: [0.004, 0, -0.008], cap: 1452 },              // Claude large and level in the lower two thirds, from the front left; Buloy stands over him behind, so the line and the look it gets share a frame. The Kapitana, her table and her elbow are all off to the right
    k_kap:    { p: [-0.7, 1.55, 2.8], l: [0.2, 1.15, 0.5], fov: 30, d: [0, 0, -0.02], cap: 1385 },
    k_wide:   { p: [-0.05, 2.2, 5.1], l: [-0.05, 1.9, -1.5], fov: 34, d: [0, 0, 0], cap: 905 },
    k_buloy:  { p: [0.0, 1.62, 0.48], l: [-0.28, 1.43, -0.58], fov: 40, d: [0, 0, -0.012], cap: 1235, capCard: 1380 },                      // Buloy, head and chest, from between the two tables at his eye level: Claude's top stays under the frame, the sheet's mark above it (only the plain foot of the cloth shows, in its colour)
  },
  update(t, ctx) {
    const vAmp = ampAt("viron", t), kAmp = ampAt("kap", t);
    // ---- light: dusk through the open sides, warm lamps, the sheet's colour ----
    const green = isGreen(t);
    hemi.color.setRGB(0.62, 0.64, 0.95); hemi.groundColor.setRGB(0.52, 0.45, 0.42); hemi.intensity = 1.2; grade.uniforms.uExposure.value = 0.98;
    duskRim.intensity = 0.9; duskRim.color.setRGB(1.0, 0.55, 0.5); skyFill.intensity = 0.7;
    if (green) RIM.uRimColor.value.setRGB(0.25, 1.0, 0.45); else RIM.uRimColor.value.setRGB(1.0, 0.28, 0.3);        // the sheet is behind them: its colour edges everyone, so a close shot without the sheet still says which state it is
    let flash = 0; for (const f of FLIPS) { const u = t - f; if (u >= 0 && u < 0.12) flash = Math.max(flash, 1 - u / 0.12); }
    drawSheet(green, flash * 0.85, ctx.shot === "k_claude" || ctx.shot === "k_buloy");
    projLight.color.setRGB(green ? 0.2 : 1.0, green ? 1.0 : 0.17, green ? 0.35 : 0.17); projLight.intensity = 2.2 + 3.0 * flash;
    const lv = lampAt(t);
    lampLens.color.setRGB(0.28 + 3.2 * lv, 0.04 + 0.35 * lv, 0.04 + 0.25 * lv); lampHalo.opacity = 0.95 * lv; lampLight.intensity = 6 * lv;
    // ---- Buloy ----
    const hop = B("hop", t) * 0.12 * (t < TM.r3 + 0.55 ? 1 : 1), hopY = A.joy.s < 1e8 ? hop * ramp(A.joy.s + 0.05, A.joy.s + 0.4, t) : 0;
    V.position.set(BUL[0] + Math.sin(t * 1.7) * 0.003, BUL[1] + hop, BUL[2]); V.rotation.y = 0.2;
    vUpper.position.y = 0.52;
    const tapNow = TAPS.reduce((m, tg) => Math.max(m, 1 - clamp01(Math.abs(t - tg) / 0.12)), 0);
    vUpper.rotation.set(B("ul", t) + Math.sin(t * 1.9) * 0.01 + B("wPl", t) * (0.05 + 0.035 * Math.sin(t * 7.5)), B("uy", t), B("ur", t) + Math.sin(t * 1.3) * 0.008);   // pleading, he leans in and bobs with his hands
    vHead.rotation.set(B("hp", t) + Math.sin(t * 1.1) * 0.01, B("hy", t) + Math.sin(t * 0.9) * 0.012, B("hr", t) + Math.sin(t * 0.8) * 0.01);
    Object.assign(bulFace, face);
    bulFace.blink = Math.max(blinkAt(t, 1.2, 4.1) * (B("lid", t) < -0.2 ? 0 : 1), B("blk", t));
    bulFace.open = Math.max(clamp01(vAmp * 1.25) + (t < A.plead.s ? 0.25 : 0), 0.55 * B("gape", t));
    bulFace.smile = B("smile", t) * (1 - clamp01(vAmp * 1.25) * 0.15); bulFace.brow = B("brow", t) + vAmp * 0.1; bulFace.sad = clamp01(B("sad", t)); bulFace.lid = B("lid", t); bulFace.cheek = clamp01(B("cheek", t));
    bulFace.gx = B("gx", t); bulFace.gy = B("gy", t); bulFace.wet = 0; bulFace.pucker = t > TM.hush - 0.1 && t < A.hush.s ? 0.3 : 0;
    buloy.draw(bulFace);
    room.updateMatrixWorld(true);
    // ---- his arms: weights over the keyed poses; the laptop tap and the other grips come after ----
    const w = { pl: B("wPl", t), ch: B("wCh", t), up: B("wUp", t), pr: B("wPr", t), lp: B("wLp", t), lo: B("wLo", t), out: B("wOut", t), fist: B("wFist", t) };
    const wiggle = Math.sin(t * 7.5) * 0.04;                                                             // the plead shakes: the hands beg
    const REST = [v3(0.3, -0.06, 0.05), v3(-0.3, -0.06, 0.05)];
    const P = {
      pl:   [v3(0.15, 0.34 + wiggle, 0.42), v3(-0.22, 0.34 - wiggle, 0.42)],
      ch:   [null, v3(OATH[0], OATH[1], OATH[2])],
      up:   [v3(0.5, 0.62, 0.34), v3(0.14, 0.6, 0.4)],
      pr:   [v3(0.4, 0.26, 0.38), v3(-0.36, 0.28, 0.4)],
      lp:   [null, v3(LIPS[0], LIPS[1], LIPS[2])],
      lo:   [v3(0.22, 0.06, 0.34), null],
      out:  [v3(0.25, 0.44, 0.5), v3(-0.25, 0.44, 0.5)],
      fist: [v3(0.28, 0.66, 0.2), v3(-0.28, 0.66, 0.2)],
    };
    const armEx = (i) => { const ex = []; for (const nm of ["pl", "ch", "up", "pr", "lp", "lo", "out", "fist"]) if (P[nm][i] && w[nm] > 0.001) ex.push([w[nm], P[nm][i]]); return ex; };
    reach(bulRig, 1, [[0, null]], t, REST[0], armEx(0));
    reach(bulRig, -1, [[0, null]], t, REST[1], armEx(1));
    // palms: up for the plead and the presenting hands, sideways for the throw, out for the oath
    const palmL = w.pl * HAND_PALM_UP + w.pr * 2.3 + w.up * 1.2 + w.out * 2.4 + w.fist * 0.2 - w.lo * 0.0, palmR = -(w.pl * HAND_PALM_UP + w.pr * 2.3 + w.up * 1.2 + w.out * 2.4 + w.fist * 0.2);
    armL.hand.quaternion.identity(); armR.hand.quaternion.identity();
    armL.hand.rotation.y = palmL; armR.hand.rotation.y = palmR * (1 - w.lp * 0.7) * (1 - w.ch) + w.ch * OATH[3] + w.lp * LIPS[3];
    armL.H.pose = w.fist > 0.5 ? HAND_POSES.fist : w.lo > 0.5 ? HAND_POSES.flat : w.pr > 0.5 || w.pl > 0.5 || w.out > 0.5 || w.up > 0.5 ? HAND_POSES.open : HAND_POSES.relaxed;
    armR.H.pose = w.fist > 0.5 ? HAND_POSES.fist : w.lp > 0.5 ? HAND_POSES.point : w.ch > 0.5 ? HAND_POSES.flat : w.pr > 0.5 || w.pl > 0.5 || w.out > 0.5 || w.up > 0.5 ? HAND_POSES.open : HAND_POSES.relaxed;
    // ---- the laptop on the table, and the one-finger key tap ----
    gripRest(lap, LAP_POS, LAP_Q, riserP);
    lap.g.updateWorldMatrix(true, true);
    for (let i = 0; i < 3; i++) {
      const tg = TAPS[i], wt = env(tg - 0.75, tg + 0.5, t, 0.28, 0.22), u = 1 - clamp01(Math.abs(t - tg) / 0.1);
      if (wt > 0.001) gripTouch(lap, [{ A: BR, sk: "key", x: 0.12, z: 0.01, dir: v3(0, 0, -1), w: wt, g: 1, lift: -0.0012 + 0.035 * (1 - u) + 0.05 * (1 - clamp01(wt * 1.6)), contact: wt > 0.999 && u > 0.97, clear: 0.05, arc: 0.04 }]);
    }
    // ---- Claude: on the table, deadpan; turns a little to Buloy; one nub toward the sheet ----
    C.position.set(CLAUDE_X, TB_TOP, -0.45 + ZS); C.rotation.y = CL("yaw", t) + Math.sin(t * 0.7) * 0.015; C.scale.setScalar(0.95);
    cBody.rotation.x = -0.13 * CL("tilt", t); cBody.rotation.z = Math.sin(t * 0.9) * 0.012;
    let cb = 1 - blinkAt(t, 2.3, 3.8) * 0.9; cb = Math.min(cb, 1 - 0.95 * Math.exp(-(((t - (A.all.s + (A.all.e - A.all.s) * 0.5)) / 0.12) ** 2)));
    cEyes.forEach((e) => { e.scale.y = 0.08 * cb; });
    const nubU = CL("nubUp", t);
    cArms[0].position.set(-0.275, 0.13, 0.16); cArms[1].position.set(0.275 + 0.02 * nubU, 0.13 + 0.17 * nubU, 0.16 - 0.12 * nubU);       // the nub stays near the body: lifted far, it reads as a loose block
    // ---- the Kapitana ----
    const kv = kap.V; kv.position.set(KP[0], KP[1], KP[2]); kv.rotation.y = KRY;
    kap.vUpper.rotation.set(K("ul", t) + Math.sin(t * 1.3) * 0.006, K("uy", t), 0);
    const nod = (OKs) => (t > OKs - 0.2 && t < OKs + 1.6 ? Math.sin(((t - OKs + 0.2) / 1.8) * Math.PI * 2) * 0.07 : 0);
    kap.vHead.rotation.set(K("hp", t) + nod(A.ok.s + 0.1), K("hy", t) + Math.sin(t * 0.7) * 0.01, K("hr", t) + Math.sin(t * 14) * 0.03 * K("laugh", t));
    kap.vHead.position.y = 0.585 + Math.abs(Math.sin(t * 13)) * 0.006 * K("laugh", t);
    Object.assign(kapFace, { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0 });
    const lau = K("laugh", t);
    kapFace.blink = Math.max(blinkAt(t, 0.5, 4.7), 0.7 * lau * (Math.sin(t * 8) > 0.3 ? 1 : 0)); kapFace.open = clamp01(kAmp * 1.25) + 0.3 * lau * Math.abs(Math.sin(t * 11));
    kapFace.smile = K("smile", t); kapFace.brow = K("brow", t); kapFace.lid = K("lid", t) + 0.4 * lau; kapFace.cheek = clamp01(K("cheek", t)); kapFace.gx = K("gx", t); kapFace.gy = K("gy", t);
    kap.draw(kapFace);
    room.updateMatrixWorld(true);
    // her free (left) hand rests on her knee, and waves a little at "pwera"; the right holds the stamp
    const wv = K("wave", t);
    reach(kapRig, 1, [[0, null]], t, v3(0.16, 0.1, 0.33), wv > 0.001 ? [[wv, v3(0.3, 0.42 + Math.sin(t * 9) * 0.03, 0.26)]] : null);
    kap.armL.hand.quaternion.identity(); kap.armL.hand.rotation.y = wv * 0.5; kap.armL.H.pose = wv > 0.5 ? HAND_POSES.open : HAND_POSES.relaxed;
    // the folder rests on her side table; the stamp is in her right fist: raised, lowered, hovering, and at the stamp mark it comes down on the folder
    gripRest(folder, v3(ST.x, ST.top + 0.006 + 0.0006, ST.z), qEuler(0, 0.12, 0), smallP);
    const dd = t - TM.stamp, drop = dd < 0 ? ramp(TM.stamp - 0.24, TM.stamp, t) ** 2 : 1;               // the slam: from wherever it is to the paper
    const su = smooth(K("stampUp", t)) * (1 - drop), wob = Math.sin(t * 7.1) * su;                       // held up, it is never quite still
    const h = dd < 0 ? K("stampH", t) * 0.5 * (1 - drop) : dd < 0.2 ? 0.013 * Math.sin(dd / 0.2 * Math.PI) * Math.exp(-dd * 6) : K("stampOff", t) * 0.5;
    const spos = v3(ST.x - 0.02, FOLDER_TOP + h, ST.z - 0.03).lerp(SP_UP, su); spos.y += wob * 0.026;
    const down = h < 0.0005 && su < 0.0005, upW = smooth(su * 3);                                       // upW 0: upright over the paper; 1: the handle goes across her forearm
    inkMark.visible = dd >= 0.02;
    let sq = _q0;
    for (let it = 0; it < 3; it++) {                                                                    // the arm is solved for the stamp, the stamp turned to the arm, and again: it settles in two rounds
      gripHold(stamp, spos, sq, [{ A: KR, sk: "wrap", w: 1, g: 1 }], { carrier: 0, on: down ? folder : null });
      if (upW < 0.001) { if (it >= 1) break; continue; }
      KR.fore.updateWorldMatrix(true, false); _fa.set(0, -1, 0).transformDirection(KR.fore.matrixWorld);                      // from her elbow to her wrist
      _pp.copy(STAMP_REF).addScaledVector(_fa, -STAMP_REF.dot(_fa)).normalize();                          // across the forearm, as near the reference as that allows
      const ck = COCK + wob * 0.13; _ya.copy(_pp).multiplyScalar(Math.cos(ck)).addScaledVector(_fa, Math.sin(ck)).normalize();
      _xa.crossVectors(_ya, _fa).normalize(); _za.crossVectors(_xa, _ya);                                 // the block's long side lies across the forearm, its short side toward it
      _qp.setFromRotationMatrix(_mb.makeBasis(_xa, _ya, _za)); sq = _qs.copy(_q0).slerp(_qp, upW);
    }
    kap.armR.hand.updateWorldMatrix(true, false);
    // ---- the crowd ----
    for (const n of crowdNodes) n.visible = ctx.shot === "k_wide";
    const slump = (r) => env(r, r + 1.3, t, 0.12, 0.5), head = (g) => env(g, g + 1.3, t, 0.2, 0.4);
    const hushHold = ramp(TM.hush - 0.05, TM.hush + 0.2, t) * (1 - ramp(TM.stamp + 0.2, TM.stamp + 0.8, t));
    const cheerUp = env(A.pwera.e + 0.05, TM.r3, t, 0.2, 0.12);
    const s0 = 1 - ramp(0.2, 1.4, t);
    for (const c of crowd) {
      const ph = c.i * 1.7, still = 1 - hushHold, sl = Math.max(s0, slump(TM.r1), slump(TM.r2), slump(TM.r3)), hd = Math.max(head(TM.g1), head(TM.g2), head(TM.g3)) * (1 - sl);
      c.body.rotation.set(0.06 * sl + 0.09 * hushHold + Math.sin(t * 0.8 + ph) * 0.012 * still, Math.sin(t * 0.5 + ph) * 0.05 * still, Math.sin(t * 0.9 + ph) * 0.02 * still);
      c.neck.rotation.set(0.3 * sl - 0.18 * hd - 0.1 * cheerUp, Math.sin(t * 0.6 + ph * 2) * 0.12 * still, 0);
      c.body.position.y = 0.5 + 0.05 * cheerUp * Math.abs(Math.sin(t * 8.5 + ph));                              // the cheer is a bounce in the seats: raised arms this close to the lens read as planks
      for (const a of c.arms) { a.a.rotation.set(0, 0, a.s * 0.14); a.fa.rotation.set(-0.3, 0, 0); }
    }
    // ---- the kids at the sides do nothing: the banderitas sway a hair ----
  },
};
