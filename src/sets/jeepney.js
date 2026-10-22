// ---------- SET: the jeepney (episode 3, "Para Po, Boss") ----------
// A set is one file in src/sets/, named in script.json as "set": "jeepney". tools/build.py puts it into the page just before the director
// (50-direct.js). It hides the sari-sari store world, builds its own world, moves the shared cast into it (Buloy, Claude, Aling Nena),
// and hands the director two things: SET.shots (camera set-ups) and SET.update(t) (poses and world motion, called every frame).
// Frame zero of the world: the jeepney faces -z, the cab is at the front (z about -1.9), the rear is open (z 3.6), benches run along both walls.
// Everything is a pure function of the time t: no clock, no Math.random.

// ---- hide the store world: only lights and the cast stay ----
for (const o of scene.children) if (!o.isLight) o.visible = false;
const jeep = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0xa9cce6);
scene.fog = new THREE.Fog(0xa9cce6, 10, 46);

const JW = 1.0;                                                         // half the width inside
// "EDSA" drawn by hand in 6x7 cells, so the D keeps its cut corners and does not read as an O or an N
const EDSA_G = { E: [0b111111, 0b110000, 0b110000, 0b111110, 0b110000, 0b110000, 0b111111], D: [0b111100, 0b110110, 0b110011, 0b110011, 0b110011, 0b110110, 0b111100], S: [0b011111, 0b110000, 0b110000, 0b011110, 0b000011, 0b000011, 0b111110], A: [0b011110, 0b110011, 0b110011, 0b111111, 0b110011, 0b110011, 0b110011] };
const edsaTex = (w, h, bg, fg, s, border) => painted(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.fillStyle = border; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); }
  const tw = 4 * 6 * s + 3 * s * 1.5, x0 = Math.round((w - tw) / 2), y0 = Math.round((h - 7 * s) / 2);
  g.fillStyle = fg; "EDSA".split("").forEach((ch, i) => EDSA_G[ch].forEach((row, ry) => { for (let k = 0; k < 6; k++) if (row & (1 << (5 - k))) g.fillRect(x0 + Math.round(i * (6 * s + s * 1.5)) + k * s, y0 + ry * s, s, s); }));
}, { mip: false });
const CHROME = mat(0xdde3ea, { rim: 0.6 }), STEEL = mat(0x8a93a0, { rim: 0.6 });

// ================= the body of the jeepney =================
const J_BLUE = 0x2f6fd9, J_RED = 0xd9412e, J_YEL = 0xf2c230, J_CREAM = 0xe8dcc0;
// floor
box(jeep, 2.3, 0.1, 6.6, 0x34323f, 0, -0.05, 0.9, { noShadow: true });
for (let i = 0; i < 7; i++) box(jeep, 0.55, 0.012, 6.5, 0x403e4c, -0.9 + i * 0.3, 0.003, 0.9, { noShadow: true });       // the ribbed floor mat
box(jeep, 0.18, 0.012, 6.5, J_YEL, 0.0, 0.006, 0.9, { noShadow: true });                                             // a painted stripe down the aisle
// the two side walls: a lower panel, sill, header; the windows between are open
for (const s of [-1, 1]) {
  const x = s * JW;
  box(jeep, 0.06, 0.88, 5.7, J_BLUE, x, 0.44, 0.75, { noShadow: true });
  box(jeep, 0.08, 0.05, 5.7, J_YEL, x, 0.9, 0.75, { noShadow: true });                                               // sill
  box(jeep, 0.08, 0.1, 5.7, J_CREAM, x, 1.6, 0.75, { noShadow: true });                                              // header
  for (let i = 0; i < 8; i++) box(jeep, 0.07, 0.72, 0.07, J_BLUE, x, 1.25, -1.9 + i * 0.78, { noShadow: true });        // window posts
  box(jeep, 0.04, 0.04, 5.7, J_RED, x - s * 0.02, 0.62, 0.75, { noShadow: true });                                    // a red pinstripe
  const sk = (txt, bg, fg, z, w) => { const p = plane(jeep, w, 0.18, signMat(px(txt, 48, 12, bg, fg, 1, { border: fg })), x - s * 0.035, 0.56, z); p.rotation.y = s * Math.PI / 2; p.receiveShadow = false; };
  if (s < 0) { sk("GOD BLESS", "#f2f2ea", "#c8281e", 0.5, 0.5); sk("PARA PO", "#c8281e", "#ffffff", 2.4, 0.42); }
  else { sk("SUKLI PO", "#ffd23a", "#16213f", 0.5, 0.5); sk("GOD BLESS", "#f2f2ea", "#1f4fb0", 2.4, 0.5); }
}
// benches along the walls: a cushion, a low back against the wall, a steel base
const benchTex = mat(0xc8281e, { rim: 0.6 }), benchEdge = mat(0x8e1a14, { rim: 0.6 });
for (const s of [-1, 1]) {
  const x = s * 0.74;
  mesh(jeep, new RoundedBoxGeometry(0.5, 0.1, 3.0, 2, 0.04), benchTex, x, 0.43, 1.3);
  mesh(jeep, new RoundedBoxGeometry(0.12, 0.3, 3.0, 2, 0.04), benchTex, s * 0.93, 0.62, 1.3);
  box(jeep, 0.5, 0.36, 3.0, 0x2c2a36, x, 0.2, 1.3, { noShadow: true });
  box(jeep, 0.04, 0.03, 3.0, 0xdde3ea, s * 0.5, 0.39, 1.3, { noShadow: true });
}
// the roof: a thin arch, ribs, the long metal rod
{
  const sh = new THREE.Shape(); sh.moveTo(-JW - 0.06, 0); sh.quadraticCurveTo(0, 0.72, JW + 0.06, 0); sh.lineTo(JW + 0.06, -0.05); sh.quadraticCurveTo(0, 0.67, -JW - 0.06, -0.05); sh.closePath();
  const roof = mesh(jeep, new THREE.ExtrudeGeometry(sh, { depth: 4.2, bevelEnabled: false }), mat(0xe9e2d0, { side: 1, rim: 0.3 }), 0, 1.66, -0.5, { noShadow: true });
  for (let i = 0; i < 6; i++) { const g = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }); const r = mesh(jeep, g, STEEL, 0, 1.655, -0.45 + i * 0.7, { noShadow: true }); r.scale.set(0.985, 1, 1); }
  mesh(jeep, new THREE.CylinderGeometry(0.018, 0.018, 5.4, 8), CHROME, -0.72, 1.5, 0.9, { noShadow: true }).rotation.x = Math.PI / 2;    // the rod Aling Nena holds and Buloy taps
  for (const z of [-0.3, 1.0, 2.3, 3.3]) { box(jeep, 0.02, 0.2, 0.02, 0xb9c0cb, -0.72, 1.6, z, { noShadow: true }); }
  mesh(jeep, new THREE.CylinderGeometry(0.014, 0.014, 5.4, 6), CHROME, 0.72, 1.5, 0.9, { noShadow: true }).rotation.x = Math.PI / 2;    // and the one on the other bench
  for (const z of [-0.3, 1.0, 2.3, 3.3]) box(jeep, 0.02, 0.2, 0.02, 0xb9c0cb, 0.72, 1.6, z, { noShadow: true });
}
// jeepney dressing: a string of bulbs across the windshield header, tassels hanging from it
{
  const XC = [0xff3a3a, 0xffd23a, 0x3aff7a, 0x4a8aff, 0xff5ad0];
  for (let i = 0; i < 15; i++) box(jeep, 0.045, 0.045, 0.045, XC[i % 5], -0.93 + i * 0.133, 2.22 - Math.sin(i / 14 * Math.PI) * 0.1, -1.9, { glow: 2.2, noShadow: true });
  for (const x of [-0.78, 0.74]) { box(jeep, 0.01, 0.12, 0.01, 0x14121a, x, 2.15, -1.88, { noShadow: true }); mesh(jeep, new THREE.SphereGeometry(0.04, 6, 5), mat(0xd62020, { glow: 0.6 }), x, 2.06, -1.88, { noShadow: true }); mesh(jeep, new THREE.SphereGeometry(0.03, 6, 5), mat(0xffd23a, { glow: 0.8 }), x, 1.99, -1.88, { noShadow: true }); box(jeep, 0.07, 0.07, 0.01, 0xd62020, x, 1.93, -1.88, { glow: 0.5, noShadow: true }); }
}

// ================= the cab, the dash, the windshield =================
const DASH_Z = -1.75;
box(jeep, 2.1, 0.12, 0.5, 0x232233, 0, 0.72, DASH_Z, { noShadow: true });                           // the dash top
box(jeep, 2.1, 0.52, 0.5, 0x2a2838, 0, 0.46, DASH_Z - 0.06, { noShadow: true });
box(jeep, 0.09, 0.45, 0.09, 0x2a2838, 0.4, 0.95, DASH_Z + 0.2, { noShadow: true });                  // the gauge stands on a stalk, so the windshield stays open
box(jeep, 2.1, 0.05, 0.08, J_YEL, 0, 0.77, DASH_Z + 0.22, { noShadow: true });
for (const x of [-0.995, -0.33, 0.35, 0.995]) box(jeep, 0.08, 1.3, 0.08, J_BLUE, x, 1.65, -2.0, { noShadow: true });   // windshield posts, tall: the camera looks out of this one most
box(jeep, 2.1, 0.12, 0.1, J_CREAM, 0, 2.32, -2.0, { noShadow: true }); box(jeep, 2.1, 0.06, 1.7, 0xe9e2d0, 0, 2.36, -1.15, { noShadow: true });
// the driver's raised seat
box(jeep, 0.6, 0.7, 0.7, 0x2c2a36, -0.35, 0.35, -0.78, { noShadow: true });
mesh(jeep, new RoundedBoxGeometry(0.6, 0.1, 0.7, 2, 0.04), benchTex, -0.35, 0.74, -0.78);
// stickers over the windshield and the route board hanging in the cab
{
  const st = (txt, bg, fg, x, w) => { const p = plane(jeep, w, 0.16, signMat(px(txt, 52, 12, bg, fg, 1, { border: fg })), x, 2.18, -1.945); p.receiveShadow = false; };
  st("PARA PO", "#c8281e", "#ffffff", -0.7, 0.5); st("GOD BLESS", "#f2f2ea", "#c8281e", 0.0, 0.58); st("SUKLI PO", "#ffd23a", "#16213f", 0.68, 0.5);
  const board = plane(jeep, 0.95, 0.3, signMat(edsaTex(64, 20, "#16213f", "#ffd23a", 2, "#ffd23a"), 1.15), 0.12, 1.98, -1.9);
  box(jeep, 0.01, 0.2, 0.01, 0x14121a, -0.28, 2.2, -1.9, { noShadow: true }); box(jeep, 0.01, 0.2, 0.01, 0x14121a, 0.52, 2.2, -1.9, { noShadow: true });
}
// the gauge: TOKEN, E on the left, F on the right, no numbers; the needle rises with each coin
const GAUGE = group(jeep, 0.4, 1.34, DASH_Z + 0.22);
GAUGE.rotation.x = -0.35; GAUGE.scale.setScalar(1.9);
{
  const dial = painted(128, 128, (g) => {
    g.fillStyle = "#16151c"; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill();
    g.fillStyle = "#e9e3cf"; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fill();
    g.fillStyle = "#c8281e"; g.beginPath(); g.arc(64, 70, 50, Math.PI * 1.1, Math.PI * 1.32); g.arc(64, 70, 38, Math.PI * 1.32, Math.PI * 1.1, true); g.fill();     // the red zone by E
    g.strokeStyle = "#16151c"; g.lineWidth = 3;
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.12 + i * (0.76 / 6)); g.beginPath(); g.moveTo(64 + Math.cos(a) * 44, 70 + Math.sin(a) * 44); g.lineTo(64 + Math.cos(a) * 52, 70 + Math.sin(a) * 52); g.stroke(); }
    if (ATLAS && ATLAS.ptext) {
      ATLAS.ptext(g, "E", 24, 66, "#c8281e", { font: 5, scale: 4, align: "center" });
      ATLAS.ptext(g, "F", 104, 66, "#16151c", { font: 5, scale: 4, align: "center" });
      ATLAS.ptext(g, "TOKEN", 64, 94, "#16151c", { font: 5, scale: 2, align: "center" });
    }
  }, { mip: false });
  mesh(GAUGE, new THREE.CylinderGeometry(0.18, 0.2, 0.05, 20), mat(0x1c1b24), 0, 0, -0.012).rotation.x = Math.PI / 2;
  mesh(GAUGE, new THREE.CircleGeometry(0.175, 24), new THREE.MeshBasicMaterial({ map: dial }), 0, 0, 0.0145);
}
const needlePivot = group(GAUGE, 0, -0.0164, 0.02);
box(needlePivot, 0.012, 0.13, 0.006, 0x16151c, 0, 0.065, 0, { noShadow: true });
box(needlePivot, 0.016, 0.03, 0.007, 0xd62020, 0, 0.14, 0.001, { glow: 1.4, noShadow: true });
mesh(needlePivot, new THREE.CylinderGeometry(0.014, 0.014, 0.01, 8), mat(0x16151c)).rotation.x = Math.PI / 2;
const redLight = group(jeep, 0.62, 0.84, DASH_Z + 0.42); redLight.scale.setScalar(1.7);                             // the blinking red light, big enough to see across the cab
const redLamp = mesh(redLight, new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
const redOff = new THREE.MeshBasicMaterial({ color: 0x4a1216 }), redOn = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 0.2, 0.2) });
mesh(redLight, new THREE.CylinderGeometry(0.052, 0.052, 0.02, 10), mat(0x1c1b24), 0, 0, -0.03).rotation.x = Math.PI / 2;
// hazard indicators: two green arrows on the dash
const hazL = box(jeep, 0.07, 0.07, 0.03, 0x2aff6a, 0.0, 0.82, DASH_Z + 0.4, { glow: 0.2 }), hazR = box(jeep, 0.07, 0.07, 0.03, 0x2aff6a, 0.12, 0.82, DASH_Z + 0.4, { glow: 0.2 });
const hazOnM = mat(0x2aff6a, { glow: 1.6 }), hazOffM = mat(0x1a4a2a, { glow: 0.3 });
// the steering wheel is Claude's: it travels with him
const wheel = group(C, 0, 0.04, 0.3); wheel.rotation.x = -1.3;
mesh(wheel, new THREE.TorusGeometry(0.2, 0.022, 6, 16), mat(0x17161c, { rim: 0.6 }));
box(wheel, 0.4, 0.02, 0.02, 0x17161c, 0, 0, 0, { noShadow: true }); box(wheel, 0.02, 0.2, 0.02, 0x17161c, 0, -0.1, 0, { noShadow: true });
mesh(wheel, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), mat(0xc4c8d0, { rim: 0.6 })).rotation.x = Math.PI / 2;
// and the cap on top of his block
mesh(cBody, new RoundedBoxGeometry(0.5, 0.08, 0.28, 2, 0.03), mat(0x1d2a55, { rim: 0.6 }), 0, 0.355, 0);
box(cBody, 0.32, 0.02, 0.14, 0x1d2a55, 0, 0.335, 0.2, { rim: 0.6 }); box(cBody, 0.1, 0.045, 0.012, J_YEL, 0, 0.365, 0.145, { noShadow: true });

// ================= the cast moves in =================
const SEATS = { buloy: [-0.82, 0, 1.6], nena: [-0.82, 0, 0.95], manong: [-0.82, 0, 0.12], bea: [0.82, 0, 1.25], claude: [-0.35, 0.74, -0.78] };
jeep.add(V); V.position.set(...SEATS.buloy); V.rotation.y = Math.PI / 2; V.visible = true; laptop.visible = false;
jeep.add(C); C.position.set(...SEATS.claude); C.visible = true;
jeep.add(nena); nena.position.set(SEATS.nena[0], 0.55 - 0.9, SEATS.nena[2]); nena.rotation.y = Math.PI / 2; nena.visible = true;
// Aling Nena sits: a skirt over the thighs, shins and shoes (the store never showed her below the counter), and she is much older here:
// grey hair (the hair materials are shared, so this only changes this page), a hunch, a woven bayong on her lap, her fingers round the rod.
NENA_HAIR.hairN.color.set(0xb8b6c0); NENA_HAIR.greyN.color.set(0xd8d6de); NENA_HAIR.greyD.color.set(0x9896a2);
{
  const skirt = mat(0x6a3a8a, R), skin = mat(0xb07548, { rim: 0.4 }), shoe = mat(0x23202c, R);
  mesh(nena, new THREE.CylinderGeometry(0.2, 0.235, 0.18, 10), skirt, 0, 0.86, 0.02);
  for (const s of [-1, 1]) {
    box(nena, 0.15, 0.13, 0.46, 0x6a3a8a, s * 0.085, 0.84, 0.25, R);
    box(nena, 0.085, 0.4, 0.09, 0xb07548, s * 0.085, 0.57, 0.5, R);
    box(nena, 0.1, 0.05, 0.17, 0x23202c, s * 0.085, 0.37, 0.56, R);
  }
  for (let k = 0; k < 4; k++) {                                                                  // grey strands lying flat on the bun: rings that hug it, no sticking out
    const t = mesh(nenaHead, new THREE.TorusGeometry(0.0535 + k * 0.0006, 0.0028, 3, 16, Math.PI * 1.2), k % 2 ? NENA_HAIR.greyN : NENA_HAIR.greyD, 0, 0.205, -0.088, { noShadow: true });
    t.rotation.set(0.5 + k * 0.7, k * 0.8, k * 0.5); t.scale.set(1, 0.9, 0.95);
  }
  // the bayong: a woven market bag with two handles, on her lap
  const weave = painted(16, 16, (g) => { g.fillStyle = "#c9a45a"; g.fillRect(0, 0, 16, 16); g.fillStyle = "#9a7a38"; for (let i = 0; i < 16; i += 4) { g.fillRect(i, 0, 1, 16); g.fillRect(0, i, 16, 1); } g.fillStyle = "#e0c27a"; for (let i = 2; i < 16; i += 4) g.fillRect(i, i % 8, 2, 1); }, { repeat: true });
  const bag = group(nena, 0, 1.0, 0.28);
  const cyl = mesh(bag, new THREE.CylinderGeometry(0.1, 0.085, 0.15, 10), mat(0xffffff, { map: weave }), 0, 0, 0); cyl.scale.z = 1.2;
  const h1 = mesh(bag, new THREE.TorusGeometry(0.065, 0.007, 4, 12, Math.PI), mat(0x7a5a2a, R), 0, 0.07, 0); h1.rotation.y = Math.PI / 2;
  box(bag, 0.18, 0.02, 0.2, 0xb8923e, 0, 0.075, 0, { noShadow: true });
  mesh(bag, new THREE.SphereGeometry(0.05, 6, 5), mat(0xd9412e), 0.03, 0.1, 0.02, { noShadow: true });                // a red cloth sticking out
}
// Aling Nena grips the rod with her real hand (posed in SET.update): the wrist sits below and behind the rod, the fingers go over it and curl round
const ROD_X = -0.72, ROD_Y = 1.5, NENA_GRIP_Z = SEATS.nena[2] - 0.12;
// Bea: a young woman in uniform, a backpack on her lap
const bea = makeBuloy({ young: true, girl: true, strap: false, parent: jeep, at: SEATS.bea, shirt: 0xf4f2ec, shirtD: 0xd2d4de, legs: 0x23306a });
bea.V.rotation.y = -Math.PI / 2;
{
  const bp = group(jeep, 0.5, 0.82, 1.27), bm = mat(0x7a2a3a, R);
  mesh(bp, new RoundedBoxGeometry(0.17, 0.36, 0.3, 2, 0.04), bm); box(bp, 0.06, 0.2, 0.24, 0x5a1c2a, 0.1, -0.04, 0, R); box(bp, 0.02, 0.05, 0.1, 0xe5c04a, 0.13, 0.06, 0, { noShadow: true });
  for (const z of [-0.11, 0.11]) box(bp, 0.02, 0.26, 0.045, 0x2c1a1e, -0.09, 0.0, z, R);
}
// a manong in a cap between Aling Nena and the cab: one more pair of hands for the coin
const manong = makeBuloy({ young: true, lace: false, strap: false, parent: jeep, at: SEATS.manong, shirt: 0x7a8f4a, shirtD: 0x5f7238, legs: 0x3a3a44 });
manong.V.rotation.y = Math.PI / 2;
mesh(manong.vHead, new RoundedBoxGeometry(0.2, 0.075, 0.22, 2, 0.03), mat(0x2f5f4a, R), 0, 0.268, 0.005);
box(manong.vHead, 0.15, 0.016, 0.1, 0x2f5f4a, 0, 0.245, 0.125, R);
const faceBase = { blink: 0, open: 0, smile: 0.1, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bface = { ...faceBase }, mface = { ...faceBase }, bulFace = { ...faceBase };

// ================= the world outside =================
const WORLD = [];                                                       // { o, z0, kind } : wrapped along z by the distance travelled
const road = box(jeep, 60, 0.2, 90, 0x3a3844, 0, -0.55, -10, { noShadow: true });
for (const s of [-1, 1]) box(jeep, 9, 0.3, 90, 0x8a8378, s * 14, -0.45, -10, { noShadow: true });       // pavement either side
let SEED = 0;
const jr = rng(303);
const wrapZ = (z0, d) => ((z0 + d + 40) % 60 + 60) % 60 - 40;
function addWorld(o, z0, kind = "wrap") { jeep.add(o); WORLD.push({ o, z0, kind }); return o; }
// lane dashes, the median wall with the train line pillars and its beam
for (const x of [-1.7, 1.7, -5.1, 5.1]) for (let i = 0; i < 10; i++) addWorld(box(jeep, 0.14, 0.012, 2.2, 0xf2f2e8, x, -0.43, 0, { noShadow: true }), -30 + i * 6);
for (let i = 0; i < 5; i++) { const g = group(jeep); for (const sx of [-0.7, 0.7]) box(g, 0.9, 7.4, 0.9, 0x8d8a84, sx - 0, 3.3, 0, { noShadow: true }); box(g, 3.2, 0.9, 1.1, 0x7c7a76, 0, 7.2, 0); g.position.x = -10.5; addWorld(g, -30 + i * 12); }
box(jeep, 3.0, 0.5, 90, 0x6e6c68, -10.5, 7.9, -10, { noShadow: true });                         // the train line itself, a long beam overhead
box(jeep, 2.6, 0.9, 90, 0x7a8a96, -10.5, 8.5, -10, { noShadow: true });
// buildings and billboards, both sides
const winTex = painted(16, 16, (g) => { g.fillStyle = "#c8c0b0"; g.fillRect(0, 0, 16, 16); g.fillStyle = "#4a6a8a"; g.fillRect(3, 3, 10, 9); g.fillStyle = "#8fb4d4"; g.fillRect(4, 4, 4, 3); g.fillStyle = "#a89c88"; g.fillRect(0, 14, 16, 2); }, { repeat: true });
const BL = [0xc8b8a0, 0xa8b4c0, 0xd8c8a0, 0xb8a0a0, 0xa0b0a0];
for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
  const h = 7 + Math.floor(jr() * 12), w = 6 + jr() * 2, g = group(jeep);
  tbox(g, 7, h, w, winTex, 2.2, 0, h / 2 - 0.4, 0, { color: BL[(i + (s > 0 ? 2 : 0)) % 5] });
  g.position.x = s * 20; addWorld(g, -36 + i * 7.5 + (s > 0 ? 3 : 0), "smear");
}
const BB = [["KAPE TAYO", "#7a4a2c", "#ffe9b0"], ["MALL SALE", "#d62020", "#ffffff"], ["LOAD NA!", "#1f4fb0", "#ffd23a"], ["BAHAY AT LOT", "#2a8a4a", "#ffffff"], ["DATA PROMO", "#8a3fb0", "#ffe14a"], ["TIPID SA LAHAT", "#f2c230", "#16213f"]];
for (let i = 0; i < 6; i++) {
  const g = group(jeep), b = BB[i], x = i % 2 ? 11.5 + (i % 3) * 0.6 : -(13.8 + (i % 3) * 0.6);
  box(g, 0.12, 4.2, 0.12, 0x5a5660, -1.4, 2.1, 0, { noShadow: true }); box(g, 0.12, 4.2, 0.12, 0x5a5660, 1.4, 2.1, 0, { noShadow: true });
  const p = plane(g, 3.8, 1.9, signMat(px(b[0], 96, 48, b[1], b[2], 3, { border: b[2] }), 1.0), 0, 4.2, 0.1);
  g.rotation.y = (i % 2 ? 1 : -1) * 0.1; g.position.x = x; addWorld(g, -32 + i * 10);
}
// vehicles: tail lights toward us (they face -z)
const VT = { amber: mat(0xffb020, { glow: 3.0 }), red: mat(0xff3030, { glow: 2.4 }), dim: mat(0x6a2a20, { glow: 0.5 }) };
const hazardLamps = [], vehList = [];
function vehicle(kind, x, z0, col, lane) {
  const g = group(jeep);
  const L = kind === "bus" ? 9.5 : kind === "jeep" ? 5.6 : 3.8, W2 = kind === "bus" ? 2.5 : kind === "jeep" ? 1.9 : 1.7, H = kind === "bus" ? 3.0 : kind === "jeep" ? 2.1 : 1.35;
  const BH = kind === "bus" ? H - 0.35 : kind === "jeep" ? H * 0.82 : H * 0.62;
  box(g, W2, BH, L, col, 0, 0.1 + BH / 2, 0);                                                   // the body is solid to its roof, so the rear we see is a coloured wall
  if (kind === "bus") { box(g, W2 + 0.02, 0.22, L, 0xd62020, 0, 1.0, 0, { noShadow: true }); box(g, W2 + 0.03, 0.12, L - 0.6, 0xf2f2ea, 0, 0.55, 0, { noShadow: true }); for (const sx of [-1, 1]) box(g, 0.03, 0.8, L - 1.0, 0x2a3a55, sx * (W2 / 2 + 0.005), 1.9, 0, { noShadow: true }); box(g, W2, 0.18, L, 0xf2f2ea, 0, 0.1 + BH + 0.09, 0); box(g, W2 * 0.78, 0.55, 0.05, 0x1c2438, 0, 2.05, L / 2 + 0.02, { noShadow: true }); }
  else if (kind === "jeep") { box(g, W2 + 0.02, 0.1, L, J_YEL, 0, 0.75, 0, { noShadow: true }); box(g, W2 + 0.02, 0.1, L, J_RED, 0, 1.0, 0, { noShadow: true }); for (const sx of [-1, 1]) box(g, 0.03, 0.5, L - 1.2, 0x2a3a55, sx * (W2 / 2 + 0.005), 1.4, -0.2, { noShadow: true }); box(g, W2, 0.08, L, 0xe9e2d0, 0, 0.1 + BH + 0.04, 0); box(g, W2 * 0.6, 0.4, 0.05, 0x1c2438, 0, 1.45, L / 2 + 0.02, { noShadow: true }); }
  else { box(g, W2 * 0.86, H * 0.4, L * 0.5, 0x2a3a55, 0, 0.1 + H * 0.82, 0.2); box(g, W2 * 0.86, 0.06, L * 0.5, col, 0, 0.1 + H * 1.02, 0.2); }
  const lamps = [];
  box(g, W2 * 0.3, 0.14, 0.05, 0xf2f2e8, 0, 0.55, L / 2 + 0.03, { noShadow: true });                                   // a plate
  for (const s of [-1, 1]) { const lm = box(g, kind === "car" ? 0.28 : 0.42, kind === "car" ? 0.16 : 0.26, 0.06, 0xff3030, s * (W2 / 2 - 0.25), 0.4 + H * 0.3, L / 2 + 0.02, { glow: 2.4, noShadow: true }); lamps.push(lm); }
  for (const s of [-1, 1]) for (const zz of [-0.34, 0.34]) { const w = mesh(g, new THREE.CylinderGeometry(0.34, 0.34, 0.2, 8), mat(0x16121a), s * (W2 / 2 - 0.02), 0.04, zz * L); w.rotation.z = Math.PI / 2; }
  if (kind === "jeep" && lane) { plane(g, 1.1, 0.26, signMat(px("PARA PO", 56, 13, "#c8281e", "#ffffff", 1, { border: "#ffffff" })), 0, 1.05, L / 2 + 0.05); box(g, 0.1, 0.5, 0.06, 0xc4c8d0, 0.55, 0.9, L / 2 + 0.05, { noShadow: true }); }       // our own kind of jeepney, from behind: a sticker and a back step
  g.position.x = x; hazardLamps.push(lamps);
  if (lane) vehList.push({ g, z0, own: true }); else addWorld(g, z0, "smear");
  return g;
}
// stalled EDSA: a bus and a jeepney in the right lane, cars and a jeepney on the left, the lane ahead packed
vehicle("bus", 3.5, 2.0, 0xf4f1ea); vehicle("jeep", 3.5, -9.5, 0xd9412e); vehicle("car", 3.5, -16, 0x2f9a4a); vehicle("bus", 3.5, -27, 0xe5762b);
vehicle("jeep", -3.5, 1.5, 0x2f6fd9); vehicle("car", -3.5, -5, 0xf2c230); vehicle("jeep", -3.5, -14, 0x8a3fb0); vehicle("car", -3.5, -22, 0xd8d8e0);
vehicle("bus", 7.0, -6, 0x2f6fd9); vehicle("car", -7.0, -3, 0xd9412e); vehicle("jeep", 7.0, 12, 0xf2c230); vehicle("jeep", -7.0, 8, 0x2f9a4a);
const ahead = [vehicle("jeep", 0.0, -9.4, 0x2f6fd9, true), vehicle("bus", 0.0, -19.5, 0xf4f1ea, true), vehicle("jeep", 0.0, -27, 0xd9412e, true), vehicle("bus", 0.0, -37, 0xe5762b, true)];
// an overhead gantry sign over the lanes ahead, and a puff of exhaust from the car in front
{
  const g = group(jeep);
  for (const sx of [-1, 1]) box(g, 0.25, 6.4, 0.25, 0x5a5660, sx * 6.2, 3.2, 0, { noShadow: true });
  box(g, 12.8, 0.3, 0.3, 0x5a5660, 0, 6.2, 0, { noShadow: true });
  plane(g, 5.2, 1.5, signMat(edsaTex(80, 24, "#1f7a44", "#ffffff", 2, "#ffffff"), 1.05), 0, 5.3, 0.2);
  addWorld(g, -14);
}
const SMOKE = [];
for (let i = 0; i < 6; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x8a8a92, transparent: true, opacity: 0, depthWrite: false, fog: false }); SMOKE.push(mesh(jeep, new THREE.SphereGeometry(1, 6, 5), m, 0, 0, 0, { noShadow: true })); }
// the BAWAL UTANG store, the last thing outside: it arrives in front of the window as the jeepney stops
const STORE = group(jeep);
{
  const g = STORE, T = 1.2;
  tbox(g, 4.6, 1.2, 0.3, T_TEAL, 0.8, 0, 0.6, 0); tbox(g, 4.6, 2.2, 0.3, T_CREAM, 1.3, 0, 2.3, 0);
  box(g, 4.7, 0.08, 0.34, 0x146059, 0, 1.2, 0.02, { noShadow: true });
  tbox(g, 4.8, 0.06, 1.6, T_YERO, 0.6, 0, 3.55, 0.6).rotation.x = 0.2;
  box(g, 3.4, 0.9, 0.1, 0x6b4a36, 0, 1.2, -0.1);                                             // the counter
  for (let i = 0; i <= 12; i++) box(g, 0.04, 1.7, 0.04, 0x2b2733, -1.8 + i * 0.3, 2.05, 0.2, { noShadow: true });
  for (let i = 0; i < 5; i++) box(g, 3.4, 0.05, 0.3, 0x6b4a36, 0, 1.55 + i * 0.35, -0.1, { noShadow: true });
  for (let i = 0; i < 18; i++) box(g, 0.14, 0.22, 0.14, [0xd9412e, 0x2f6fd9, 0xf2c230, 0x3aa655][i % 4], -1.6 + (i % 9) * 0.38, 1.7 + Math.floor(i / 9) * 0.5, -0.12, { noShadow: true });
  signPlane(g, "sign_store", 3.4, 0.6375, 0, 3.15, 0.2, true);
  const u = signPlane(g, "sign_utang", 1.5, 1.0, -0.2, 2.15, 0.28, false); u.rotation.z = -0.045;
  g.rotation.y = -Math.PI / 2; g.position.x = 5.6; g.scale.setScalar(0.55);
}
STORE.visible = false;
// motion streaks: long thin light bars that only show when we are fast
const STREAK = [];
for (let i = 0; i < 26; i++) {
  const s = jr() < 0.5 ? -1 : 1, m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const b = mesh(jeep, unit, m, s * (1.3 + jr() * 2.2), 0.3 + jr() * 1.7, 0, { noShadow: true }); b.scale.set(0.012 + jr() * 0.02, 0.012 + jr() * 0.012, 2.2 + jr() * 2.4);
  STREAK.push({ b, z0: -35 + i * 2.4 + jr() * 1.6, m, a: 0.3 + jr() * 0.5 });
}

// ================= the clock of the ride (modes and times come from the acts and shots of the script) =================
const LN = TL.lines, actLine = (name) => LN.find((l) => l.act === name);
const A = { limit: actLine("c_limit"), shout: actLine("shout"), laugh: actLine("n_laugh"), sing: actLine("n_sing"), chorus: actLine("chorus"), change: actLine("c_change"), relief: actLine("relief"),
  fast: actLine("c_fast"), whisper: actLine("whisper"), nwhisper: actLine("n_whisper"), panic: actLine("panic"), shout2: actLine("shout2"), cup: actLine("c_cup_ear"), button: actLine("c_button") };
const T_RESTART = A.change ? A.change.e : 1e9, T_FASTS = A.fast ? A.fast.s : 1e9;
const shotStart = (n) => { const c = TL.shots.find((x) => x.shot === n); return c ? c.t : null; };
const T_RODSHOT = shotStart("j_rod"), T_STOP = shotStart("j_stop") ?? TL.dur;               // the taps and the stop are keyed to their shots, not to a line
const T_TAPS = T_RODSHOT !== null ? [T_RODSHOT + 0.2 + 0.09, T_RODSHOT + 0.2 + 0.26, T_RODSHOT + 0.2 + 0.44] : [];
const speedAt = (t) => {
  if (t < T_RESTART) return 0;
  if (t < T_FASTS) return 5 * smooth((t - T_RESTART) / 1.2);
  if (t < T_STOP) return 5 + 12 * smooth((t - T_FASTS) / 0.8);
  const u = clamp01((t - T_STOP) / 0.35); return 17 * (1 - u) ** 3;                                  // a hard brake that settles: most of the speed goes in the first tenth of a second
};
const DT = 1 / 60, DIST = [0];
for (let i = 1; i <= Math.ceil((TL.dur + 2) / DT); i++) DIST.push(DIST[i - 1] + speedAt(i * DT) * DT);
const distAt = (t) => { const f = Math.max(0, t) / DT, i = Math.min(DIST.length - 2, Math.floor(f)); return DIST[i] + (DIST[i + 1] - DIST[i]) * (f - i); };
const D_STOP = distAt(T_STOP + 0.6), STORE_Z = 1.61 - D_STOP;
const win = (ln, t, pi = 0.2, po = 0.3) => (ln ? smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3)) : 0);
const span01 = (ln, t) => (ln ? clamp01((t - ln.s) / (ln.e - ln.s)) : 0);

// ---- the coin: where it is, and where each hand goes, as keys in time (null means the hand's rest place) ----
const R0 = A.sing ? A.sing.s : 0, R1 = A.chorus ? A.chorus.e : 1, fr = (f) => R0 + (R1 - R0) * f;
const C0 = A.change ? A.change.s : 0, C1 = A.change ? A.change.e : 1, cc = (f) => C0 + (C1 - C0) * f;
const P_B = v3(-0.58, 0.8, 1.4), H1 = v3(-0.58, 0.86, 1.2), P_N = v3(-0.6, 0.82, 0.98), H2 = v3(-0.58, 0.86, 0.72), P_M = v3(-0.6, 0.8, 0.4), H3 = v3(-0.56, 0.9, -0.28), P_C = v3(-0.5, 0.98, -0.5);
const CHEST = v3(-0.6, 1.02, 1.5);
const ROD_N = v3(ROD_X, ROD_Y, NENA_GRIP_Z), R_IN = v3(ROD_X, 1.46, -0.5), R_OUT = v3(ROD_X, 1.48, 1.38), TAP_UP = v3(ROD_X, 1.33, 1.4), TAP_HIT = v3(ROD_X, 1.425, 1.4), RAISED = v3(-0.45, 1.38, SEATS.nena[2] + 0.25);
const TC = (TL.shots.find((c) => c.shot === "j_change") || { t: cc(0.51) }).t;                    // "Heto po ang sukli": the change goes back, hand to hand, to Buloy
const coinKeys = [[fr(0), P_B], [fr(0.16), H1], [fr(0.3), P_N], [fr(0.44), H2], [fr(0.54), P_M], [fr(0.7), H3], [fr(0.84), P_C], [TC, P_C], [TC + 0.3, H3], [TC + 0.5, P_M], [TC + 0.75, H2], [TC + 0.95, P_N], [TC + 1.2, H1], [TC + 1.5, P_B]];
const T_GOT = TC + 1.5;
const bulLKeys = [[R0 - 0.5, null], [fr(0), P_B], [fr(0.14), P_B], [fr(0.18), H1], [fr(0.24), H1], [fr(0.34), null], [TC + 0.7, null], [TC + 1.2, H1], [TC + 1.5, P_B], [TC + 2.1, P_B], [TC + 2.5, null]];
const nenLKeys = [[R0 - 0.6, null], [fr(0.06), null], [fr(0.14), H1], [fr(0.3), P_N], [fr(0.4), H2], [fr(0.48), H2], [fr(0.6), null], [TC + 0.5, null], [TC + 0.75, H2], [TC + 0.95, P_N], [TC + 1.2, H1], [TC + 1.55, null]];
const manRKeys = [[R0 - 0.5, null], [fr(0.4), H2], [fr(0.52), P_M], [fr(0.62), P_M], [fr(0.74), null], [TC + 0.45, null], [TC + 0.75, H2], [TC + 1.0, null]];
const manLKeys = [[R0 - 0.5, null], [fr(0.48), null], [fr(0.54), P_M], [fr(0.7), H3], [fr(0.8), H3], [fr(0.92), null], [TC - 0.1, null], [TC + 0.3, H3], [TC + 0.5, P_M], [TC + 0.65, null]];
const nubKeys = [[R0, null], [fr(0.6), null], [fr(0.7), H3], [fr(0.84), P_C], [fr(1.0), P_C], [TC - 0.2, P_C], [TC + 0.3, H3], [TC + 0.55, P_C], [TC + 0.9, null]];
if (T_TAPS.length) {                                                       // lift the change coin and tap the rod three times, on the times of the sound
  bulLKeys.push([T_TAPS[0] - 1.2, null], [T_TAPS[0] - 0.25, TAP_UP]);
  for (const tp of T_TAPS) bulLKeys.push([tp - 0.07, TAP_UP], [tp, TAP_HIT], [tp + 0.06, TAP_UP]);
  bulLKeys.push([T_TAPS[2] + 0.3, TAP_UP], [T_TAPS[2] + 1.3, CHEST]);
}
const levelAt = (t) => {                                                  // the TOKEN gauge, 0 = E, 1 = F: a step with each hand-off, the rest while the change comes back
  const S = (x) => smooth((t - x + 0.11) / 0.22);
  return 0.12 * S(fr(0.16)) + 0.14 * S(fr(0.44)) + 0.14 * S(fr(0.7)) + 0.15 * S(fr(0.84)) + 0.45 * smooth((t - cc(0.25)) / Math.max(0.3, cc(0.95) - cc(0.25)));
};
// a hand that is passing or taking the coin pinches while the coin is close to it
const _pv = new THREE.Vector3();
function pinchOr(arm, fallback) { arm.hand.getWorldPosition(_pv); return coin.visible && _pv.distanceTo(coin.position) < 0.14 ? HAND_POSES.pinch : fallback; }
const sparks = group(jeep, ROD_X, ROD_Y, 1.4);
for (let i = 0; i < 7; i++) { const b = box(sparks, 0.004, 0.05, 0.004, 0xfff0a0, 0, 0.025, 0, { glow: 3, noShadow: true }); b.rotation.z = (i - 3) * 0.5; b.rotation.x = (i % 3 - 1) * 0.6; }
sparks.visible = false;
const coin = group(jeep);
mesh(coin, new THREE.CylinderGeometry(0.024, 0.024, 0.006, 10), mat(0xf2c230, { glow: 1.3 }), 0, 0, 0, { noShadow: true }).rotation.z = Math.PI / 2;
mesh(coin, new THREE.CylinderGeometry(0.016, 0.016, 0.0065, 10), mat(0xffe27a, { glow: 1.6 }), 0, 0, 0, { noShadow: true }).rotation.z = Math.PI / 2;
coin.visible = false; coin.scale.setScalar(2.3);
const glint = mesh(coin, new THREE.SphereGeometry(0.034, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), 0, 0, 0, { noShadow: true });
// which way each seated figure looks, by who speaks
const yawKeys = [[0, 0.1]], beaKeys = [[0, -0.3]], manKeys = [[0, 0.3]];
for (const l of LN) {
  const act = l.act;
  yawKeys.push([l.s - 0.2, act === "shout" ? 0.42 : act === "whisper" ? 0.85 : act === "shout2" ? 0.35 : act === "relief" ? 0.15 : l.who === "claude" || l.who === "nena" ? 0.85 : l.who === "bea" ? 0.15 : 0.1, 0.3]);
  beaKeys.push([l.s - 0.2, l.who === "bea" ? -0.55 : l.who === "claude" ? -0.7 : l.who === "nena" ? -0.4 : 0.3, 0.3]);
  manKeys.push([l.s - 0.2, l.who === "claude" ? 0.75 : -0.55, 0.3]);
}
for (const a of [yawKeys, beaKeys, manKeys]) a.sort((x, y) => x[0] - y[0]);
const sun = new THREE.DirectionalLight(0xfff0d0, 1.7); sun.position.set(3.5, 6, 2); sun.target.position.set(0, 0.6, 0.5); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 0.5, far: 14 }); sun.shadow.camera.updateProjectionMatrix();
const cabinLight = new THREE.PointLight(0xffe2b0, 1.8, 7, 1.6); cabinLight.position.set(0, 1.7, 0.6); jeep.add(cabinLight);
const hazardGlow = new THREE.PointLight(0xffa020, 0, 4, 1.5); hazardGlow.position.set(0, 1.0, -1.4); jeep.add(hazardGlow);

const SET = {
  name: "jeepney",
  mode: (t) => (t < T_RESTART ? "stalled" : t < T_FASTS ? "restart" : t < T_STOP ? "speeding" : "stopped"),
  // cameras: world = jeepney coordinates; the cab is at -z, the camera is mostly inside, behind the benches
  shots: {
    j_hook:   { p: [-0.55, 1.25, 3.5], l: [-0.28, 1.2, -1.9],   fov: 48, d: [0, 0, -0.03], cap: 1250 },               // inside, toward the cab: Buloy in front, Claude at the wheel, the gauge, a jam through the glass
    j_buloy:  { p: [0.5, 1.2, 1.6],   l: [-0.82, 1.12, 1.6],   fov: 33, d: [-0.01, 0, 0], cap: 1500 },               // Buloy across the aisle, medium
    j_nena:   { p: [0.95, 1.25, 0.95], l: [-0.82, 1.3, 0.95],   fov: 44, d: [-0.03, 0, -0.1], cap: 250 },               // Aling Nena, medium
    j_relay:  { p: [0.15, 1.45, 3.4],   l: [-0.45, 0.95, 0.0],     fov: 52, d: [-0.03, -0.012, -0.26], cap: 1300 },               // along the left bench: every pair of hands, the cab at the far end, the gauge
    j_gauge:  { p: [0.4, 1.4, 0.7],    l: [0.4, 1.32, -1.55],   fov: 31, d: [0, 0, -0.02], near: 0.1, cap: 1300 },    // the TOKEN gauge and the needle, close
    j_claude: { p: [0.8, 1.2, 0.6],    l: [-0.35, 1.0, -0.78],  fov: 27, d: [0, 0, -0.01], near: 0.1, cap: 1300 },    // Claude at the wheel, face visible
    j_fast:   { p: [0.9, 1.15, 0.7],   l: [-0.35, 1.05, -0.8],  fov: 40, d: [0, 0, -0.02], near: 0.1, cap: 330 },    // Claude at the wheel with the road rushing behind him
    j_change: { p: [0.25, 1.28, 3.25], l: [-0.5, 0.92, 0.5],    fov: 46, d: [-0.02, -0.01, -0.16], cap: 1300 },     // the change goes back along the bench, hand to hand, into Buloy's palm
    j_grip:   { p: [0.4, 1.74, 0.45], l: [-0.72, 1.42, 0.83],  fov: 28, d: [0, 0, -0.015], near: 0.1, cap: 250 },     // Aling Nena's hand wrapped round the rod: the plant for "bakal"
    rv_nena:  { p: [0.55, 1.38, 0.85], l: [-0.75, 1.3, 0.85], fov: 30, d: [0, 0, 0] },                                  // review cameras (tools/lab.py): not used by any script
    rv_nenaL: { p: [0.45, 1.0, 1.0], l: [-0.6, 0.95, 0.95], fov: 34, d: [0, 0, 0] },
    rv_bea:   { p: [-0.1, 1.3, 0.95], l: [0.82, 1.2, 1.25], fov: 24, d: [0, 0, 0] },
    rv_fist:  { p: [0.0, 1.38, 1.9], l: [-0.65, 1.35, 1.42], fov: 16, d: [0, 0, 0], near: 0.1 },
    rv_pass:  { p: [0.2, 1.1, 1.6], l: [-0.6, 0.85, 0.7], fov: 30, d: [0, 0, 0], near: 0.1 },
    rv_gA: { p: [0.0, 1.62, 0.83], l: [-0.72, 1.5, 0.83], fov: 20, d: [0, 0, 0], near: 0.1 },
    rv_gB: { p: [-0.35, 1.7, 1.2], l: [-0.72, 1.5, 0.83], fov: 20, d: [0, 0, 0], near: 0.1 },
    rv_gC: { p: [-0.1, 1.2, 0.5], l: [-0.72, 1.5, 0.83], fov: 20, d: [0, 0, 0], near: 0.1 },
    rv_grip2: { p: [0.35, 1.7, 0.95], l: [-0.72, 1.5, 0.83], fov: 20, d: [0, 0, 0], near: 0.1 },
    j_gossip: { p: [0.75, 1.36, 1.25], l: [-0.82, 1.2, 1.25],   fov: 54, d: [-0.01, 0, -0.01], cap: 1350 },               // Buloy leaning to Aling Nena, her hand on the rod
    j_bea:    { p: [-0.5, 1.32, 0.95], l: [0.82, 1.12, 1.25],    fov: 40, d: [0.01, 0, 0], cap: 300 },               // Bea across the aisle
    j_rod:    { p: [0.3, 1.46, 1.85],  l: [-0.72, 1.44, 1.42],  fov: 22, d: [0, 0, 0], near: 0.1, cap: 1350 },        // the rod, Buloy's raised hand and the coin at the tap
    j_stop:   { p: [-0.1, 1.25, 1.61], l: [5.5, 1.5, 1.61],   fov: 34, d: [0, 0, 0], cap: 1450 },         // through the gap between two window posts: the store sign, whole and uncovered
    j_jam:    { p: [0.0, 2.5, -2.4], l: [0.0, 1.35, -16],   fov: 52, d: [0, 0, 0.01], near: 0.1, cap: 1300 },     // through the windshield: dead traffic on EDSA, the overhead sign                   // wide: through the right window, the BAWAL UTANG store
  },
  shake(t) {
    const k = smooth((speedAt(t) - 6) / 8), slam = Math.exp(-(((t - T_STOP - 0.12) / 0.2) ** 2));
    return [(Math.sin(t * 53) * 0.007 + Math.sin(t * 31) * 0.004) * k + Math.sin(t * 70) * 0.045 * slam, Math.sin(t * 47 + 1) * 0.007 * k + Math.sin(t * 60) * 0.05 * slam];
  },
  update(t, ctx) {
    const sp = speedAt(t), d = distAt(t), mode = SET.mode(t), fastK = smooth((sp - 6) / 8), shakeOn = sp > 0.5 ? 1 : 0, slam = Math.exp(-(((t - T_STOP - 0.12) / 0.2) ** 2));
    // ---- light: a bright afternoon, warm sun, a little haze ----
    hemi.color.setRGB(0.78, 0.86, 1.0); hemi.groundColor.setRGB(0.5, 0.45, 0.42); hemi.intensity = 1.25; grade.uniforms.uExposure.value = 0.82;
    duskRim.intensity = 0.5; duskRim.color.setRGB(1, 0.9, 0.7); skyFill.intensity = 0.5;
    RIM.uRimColor.value.setRGB(0.55, 0.6, 0.62);
    // ---- the world outside: it scrolls with the distance travelled; at speed the buildings and the traffic smear along z ----
    for (const w of WORLD) { w.o.position.z = wrapZ(w.z0, d); w.o.scale.z = w.kind === "smear" ? 1 + 1.6 * fastK : 1; }
    hazardLamps.forEach((lamps, i) => { const on = mode === "stalled" ? Math.floor(t * 2.6 + (i % 3) * 0.37) % 2 : 0; for (const lm of lamps) lm.material = mode === "stalled" ? (on ? VT.amber : VT.red) : VT.red; });
    ahead.forEach((g, i) => { const u = Math.max(0, t - T_RESTART - i * 0.4); g.position.z = vehList[i].z0 + d - u * Math.min(1, u / 2) * 22; g.visible = g.position.z > -42; });
    if (T_STOP < TL.dur) { STORE.visible = t > T_STOP - 3.2; STORE.position.z = STORE_Z + d; }
    if (t > T_STOP - 1.2) for (const w of WORLD) if (w.o.position.x > 2.5 && w.o.position.x < 8.5 && Math.abs(w.o.position.z - 1.0) < 9) w.o.visible = false;
    for (const s of STREAK) { s.m.opacity = fastK * s.a * 1.6; s.b.position.z = wrapZ(s.z0, d * 1.6); s.b.scale.z = (2.2 + s.a * 4) * (1 + fastK * 1.2); }
    SMOKE.forEach((p, i) => { const u = (t * 0.45 + i / 6) % 1, on = mode === "stalled" ? 1 : 0; p.visible = on > 0; p.position.set(ahead[0].position.x - 0.5 + Math.sin(i * 2 + t) * 0.12, 0.45 + u * 1.5, ahead[0].position.z + 1.95); p.scale.setScalar(0.12 + u * 0.4); p.material.opacity = 0.4 * (1 - u) * on; });
    // ---- the cab ----
    const lv = levelAt(t);
    needlePivot.rotation.z = 1.1 - lv * 2.2 + (lv < 0.05 && mode === "stalled" ? Math.sin(t * 40) * 0.015 : 0) + (sp > 0.5 ? Math.sin(t * 61) * 0.01 : 0);
    redLamp.material = lv < 0.2 && mode === "stalled" && Math.floor(t * 3.2) % 2 ? redOn : redOff;
    const hz = mode === "stalled" ? Math.floor(t * 2.6) % 2 : 0;
    hazL.material = hz ? hazOnM : hazOffM; hazR.material = hz ? hazOnM : hazOffM; hazardGlow.intensity = hz ? 2.2 : 0;
    // ---- the ride moves the whole interior: a bob when stalled, a lean back when speeding, a lurch forward at the stop ----
    jeep.position.y = shakeOn * (Math.sin(t * 43) * 0.004 + Math.sin(t * 29) * 0.003) * (0.3 + fastK * 1.2) + (mode === "stalled" ? Math.sin(t * 9) * 0.0016 : 0);
    jeep.position.x = shakeOn * Math.sin(t * 37) * 0.0025 * (0.3 + fastK);
    jeep.rotation.x = 0.014 * fastK - 0.11 * slam; jeep.rotation.z = Math.sin(t * 2.2) * 0.006 * fastK + Math.sin(t * 0.8) * 0.002;
    // ================= acts =================
    const wShout = win(A.shout, t), wRel = win(A.relief, t, 0.1, 0.5), wWh = win(A.whisper, t), wS2 = win(A.shout2, t, 0.2, 0.3), wCh = win(A.chorus, t, 0.1, 0.2);
    const wLaugh = win(A.laugh, t), wSing = win(A.sing, t), wNW = win(A.nwhisper, t), wPanic = win(A.panic, t, 0.25, 0.4);
    const amp = (who) => ampAt(who, t), vAmp = amp("viron");
    // ---- Buloy ----
    V.position.set(SEATS.buloy[0], 0, SEATS.buloy[2]);
    vUpper.position.y = 0.52 + 0.07 * wS2 - 0.03 * wRel;
    vUpper.rotation.x = 0.06 + Math.sin(t * 1.3) * 0.008 + 0.16 * wShout + 0.28 * wRel + 0.14 * wWh + 0.2 * wS2;
    vUpper.rotation.y = 0.28 * wShout + 0.5 * wWh + 0.2 * wS2; vUpper.rotation.z = Math.sin(t * 1.9) * 0.03 * (1 - wWh);
    vHead.rotation.y = track(yawKeys, t, 0.3) + Math.sin(t * 0.9) * 0.015;
    vHead.rotation.x = 0.02 + 0.22 * wRel - 0.12 * wS2 - 0.06 * wShout; vHead.rotation.z = Math.sin(t * 0.9 + 1) * 0.015 - 0.05 * wWh;
    Object.assign(bulFace, face);
    bulFace.anger = 0.95 * wShout + 0.65 * wS2; bulFace.brow = face.brow * (1 - wShout) - 0.15 * wShout + 0.5 * wPanic;
    bulFace.open = clamp01(face.open * (1 + 0.45 * Math.max(wShout, wS2)));
    bulFace.lid = 0.55 * wRel; bulFace.smile = face.smile * (1 - wRel) + 0.25 * wRel - 0.2 * Math.max(wShout, wS2); bulFace.sad = 0.2 * wRel + 0.15 * wWh;
    const wPost = T_TAPS.length ? smooth((t - (T_TAPS[2] + 0.5)) / 0.5) : 0;
    bulFace.smile = bulFace.smile * (1 - wPost) + 0.45 * wPost; bulFace.cheek = 0.4 * wPost; bulFace.brow = bulFace.brow * (1 - wPost) + 0.1 * wPost;
    bulFace.gx = 0.1 + 0.4 * wPost; bulFace.gy = 0;
    buloy.draw(bulFace);
    jeep.updateMatrixWorld(true);
    const fistR = Math.max(wShout, wS2);
    const bulRig = { vUpper, armL, armR };
    reach(bulRig, 1, bulLKeys, t, REST_LOCAL[0]);
    reach(bulRig, -1, [[0, null]], t, REST_LOCAL[1], [[wShout, v3(-0.12, 0.5, 0.38)], [wS2, v3(-0.15, 0.5, 0.4)], [wWh, v3(-0.1, 0.56, 0.11)]]);
    armR.fingers.rotation.x = 0.4 + 1.0 * fistR;
    const heldK = smooth((t - (T_GOT - 0.1)) / 0.2);                                                         // his fingers close on the coin, thumb across, the coin's edge between thumb and index
    armL.H.pose = heldK > 0.01 ? mixPose(HAND_POSES.relaxed, HAND_POSES.coin, heldK) : null; armL.H.pose = armL.H.pose || pinchOr(armL, null);
    jeep.updateMatrixWorld(true);
    // the coin: relay along the bench, home with Claude, back along the rod to Buloy's hand, then in his fist for the tap
    const coinLive = t >= R0 - 0.35, coinHeld = t >= T_GOT;
    coin.visible = coinLive;
    if (coinLive) {
      if (coinHeld) { armL.H.root.localToWorld(coin.position.set(-0.02, -0.098, -0.004)); }
      else vtrack(coinKeys, t, P_B, coin.position);
      if (coinHeld) coin.rotation.set(0.25, 1.15, 0); else { coin.rotation.y = Math.sin(t * 6) * 0.4; coin.rotation.x = t * 3; }
      glint.material.opacity = 0.08 + 0.2 * Math.max(0, Math.sin(t * 15));                      // a glint, so the coin reads in every shot
    }
    // sparks at each tap
    let spk = 0; for (const tp of T_TAPS) { const dt = t - tp; if (dt >= 0 && dt < 0.3) spk = Math.max(spk, Math.exp(-dt / 0.05)); }
    sparks.visible = spk > 0.05; sparks.scale.setScalar(0.4 + spk * 1.2); sparks.children.forEach((c, i) => { c.rotation.y = i * 0.9 + t * 40; });
    // ---- Bea: a young woman in uniform; hands to her cheeks when she panics; she shouts with the chorus too ----
    bea.V.position.set(...SEATS.bea); bea.V.visible = !(t >= T_STOP - 0.05 && t < T_STOP + 1.5);                     // out of the way of the stop shot's window
    bea.vUpper.rotation.set(0.08 + 0.12 * wPanic, 0, Math.sin(t * 1.9 + 2) * 0.03);                          // her shoulders stay square, so both arms are mirror images
    bea.vHead.rotation.set(0.04 - 0.08 * wPanic, track(beaKeys, t, 0.3), Math.sin(t * 0.8) * 0.012 + Math.sin(t * 20) * 0.02 * wPanic);
    bface.blink = blinkAt(t, 2.1, 4.1); bface.open = clamp01(Math.max(amp("bea"), vAmp * wCh) * 1.3);
    bface.smile = 0.12 - 0.3 * wPanic; bface.brow = 0.1 + 0.7 * wPanic; bface.sad = 0.35 * wPanic; bface.gx = 0.1; bface.lid = 0;
    bea.draw(bface);
    const beaRig = { vUpper: bea.vUpper, armL: bea.armL, armR: bea.armR };
    jeep.updateMatrixWorld(true);
    for (const s of [1, -1]) {                                                                                  // palms flat on both cheeks, fingers up to the temples, thumbs along the jaw
      const cheek = bea.vUpper.worldToLocal(bea.vHead.localToWorld(_hv3.set(s * 0.076, 0.07, 0.05)));          // a point on her cheek, in the head's own frame so the hands follow it
      reach(beaRig, s, [[0, null]], t, REST_LOCAL[s > 0 ? 0 : 1], [[wPanic, cheek]]);
      const arm = s > 0 ? bea.armL : bea.armR; bea.vHead.updateWorldMatrix(true, false);
      if (wPanic > 0.01) { orientHand(arm.hand, _hv1.set(0, 0.95, -0.12).transformDirection(bea.vHead.matrixWorld), _hv2.set(-s, 0, 0).transformDirection(bea.vHead.matrixWorld), wPanic); arm.H.pose = mixPose(HAND_POSES.relaxed, HAND_POSES.cheek, wPanic); }
    }
    // ---- the manong in the cap: he passes the coin along and looks at whoever talks ----
    manong.vUpper.rotation.set(0.08, 0, Math.sin(t * 1.9 + 1) * 0.03); manong.vHead.rotation.set(0.04, track(manKeys, t, 0.3) - 0.9 * wCh, 0);
    mface.blink = blinkAt(t, 1.2, 4.6); mface.open = clamp01(vAmp * wCh * 1.2); mface.brow = 0.3 * wCh; manong.draw(mface);
    manong.armR.fingers.rotation.x = 0.4 + 1.0 * wCh;
    const manRig = { vUpper: manong.vUpper, armL: manong.armL, armR: manong.armR };
    reach(manRig, 1, manLKeys, t, REST_LOCAL[0]); reach(manRig, -1, manRKeys, t, REST_LOCAL[1], [[wCh, v3(-0.1, 0.62, 0.2)]]);
    manong.armL.H.pose = pinchOr(manong.armL, null); manong.armR.H.pose = wCh > 0.05 ? mixPose(HAND_POSES.relaxed, HAND_POSES.fist, wCh) : pinchOr(manong.armR, null);
    jeep.updateMatrixWorld(true);
    // ---- Claude: turned toward the aisle so his face shows, a cap, the wheel in his lap ----
    const wLim = win(A.limit, t, 0.05, 0.5), wFast = win(A.fast, t, 0.1, 0.6), wCup = win(A.cup, t, 0.15, 0.5), wBtn = win(A.button, t, 0.1, 0.9), uBtn = span01(A.button, t), uLim = span01(A.limit, t);
    C.position.set(SEATS.claude[0], SEATS.claude[1] + Math.abs(Math.sin(t * 9)) * 0.03 * wFast, SEATS.claude[2]);
    C.rotation.y = 0.42 + Math.sin(t * 0.7) * 0.03 + (mode === "speeding" ? Math.sin(t * 3.1) * 0.06 : 0) + 0.38 * wCup;
    C.rotation.z = 0.12 * wCup;
    const endNod = A.button ? Math.exp(-(((t - (A.button.e + 0.05)) / 0.4) ** 2)) : 0;                    // one more slow nod as the line lands
    cBody.rotation.x = 0.1 * wLim + (wBtn ? 0.13 * Math.sin(Math.PI * smooth((uBtn - 0.2) / 0.4)) : 0) + 0.12 * endNod;
    cBody.rotation.z += Math.sin(t * 7) * 0.04 * wFast;
    wheel.rotation.z = Math.sin(t * 16) * 0.16 * wFast + Math.sin(t * 2) * 0.03;
    if (wCh > 0.01) { const a = vAmp * wCh; cBody.scale.set(1 + a * 0.05, 1 - a * 0.07, 1 + a * 0.05); }                  // he joins the chorus: he swells with the clip
    let blinkC = 1 - blinkAt(t, 2.3, 3.4) * 0.9;
    if (wLim) blinkC = Math.min(blinkC, 1 - 0.95 * Math.exp(-((((uLim - 0.55) / 0.12)) ** 2)));
    if (wBtn) blinkC = Math.min(blinkC, 1 - 0.95 * Math.exp(-((((uBtn - 0.82) / 0.07)) ** 2)));
    if (A.button) blinkC = Math.min(blinkC, 1 - 0.95 * Math.exp(-(((t - (A.button.e + 0.3)) / 0.32) ** 2)));      // and a long slow blink at the end
    cEyes.forEach((e) => { e.scale.y = 0.08 * blinkC * (1 + 0.5 * wFast) * (1 - 0.35 * wBtn); e.scale.x = 0.04 * (1 + 0.25 * wFast); });
    {
      const home = cBody.localToWorld(v3(-0.275, 0.13, 0.16)), tgt = vtrack(nubKeys, t, home, _w2);
      const loc = cBody.worldToLocal(tgt.clone()); cArms[0].position.set(loc.x, loc.y, loc.z);
      cArms[1].position.set(0.275, 0.13, 0.16);
      if (wCup > 0.01) cArms[1].position.lerp(v3(0.31, 0.3, 0.02), wCup);                                      // a nub cups the side of his head
    }
    // ---- Aling Nena: much older, hunched, her hand on the rod, her bayong in her lap ----
    fan.visible = false; nenaL.up.visible = true;
    nenaHead.rotation.set(0.12 - 0.34 * wLaugh + 0.06 * wSing, -0.15 + Math.sin(t * 0.6) * 0.05 + (ctx.nTalk > 0.05 ? 0.1 : 0) - 0.25 * wNW,
      0.02 + Math.sin(t * 14) * 0.03 * wLaugh + Math.sin(t * 1.9) * 0.12 * wSing);
    nenaUp.rotation.set(0.24 + 0.05 * wNW, -0.4 * wNW - 0.1 * wLaugh, Math.sin(t * 1.9) * (0.09 * wSing + 0.03) + Math.sin(t * 17) * 0.012 * wLaugh);
    nenaUp.position.y = 0.9 + Math.sin(t * 17) * 0.007 * wLaugh;
    nface.old = 1;
    nface.squint = Math.max(wLaugh, 0.85 * wNW, 0.2 * wSing); nface.smile = 0.12 + 0.7 * wLaugh + 0.3 * wSing; nface.brow = 0.05 + 0.2 * wSing;
    nface.blink = Math.max(nface.blink, 0.8 * wLaugh, 0.92 * wSing, 0.5 * wNW);
    const vib = 1 - 0.18 * wSing * (0.5 + 0.5 * Math.sin(t * 24));                                              // the held note wobbles
    nface.open = clamp01(Math.max(nface.open * vib * (wLaugh ? 0.9 + 0.2 * Math.abs(Math.sin(t * 14)) : 1), vAmp * wCh * 1.2));
    nface.wide = wSing ? -0.65 * (nface.open > 0.15 ? 1 : 0) : nface.wide;
    nface.gx = 0; nface.gy = 0.2; nface.lid = 0;
    drawNena(nctx, nface); nenaTex.needsUpdate = true;
    nena.updateMatrixWorld(true);
    const lapW = nena.localToWorld(v3(-0.07, 1.06, 0.3));
    nenaR.pole = [0.35, -1, 0.7]; nenaL.pole = [-0.35, -1, 0.5];
    nenaR.hand.quaternion.identity(); nenaL.hand.quaternion.identity();
    // the rod hand: the wrist sits below and behind the rod, the fingers go over it toward the aisle and curl down the near side, the thumb under
    const F_ROD = v3(1, 0.04, 0), P_ROD = v3(0, 1, 0);
    _w.copy(ROD_N).addScaledVector(F_ROD, -0.066).addScaledVector(P_ROD, -0.034);
    _w.y += Math.sin(t * 53 + 1) * 0.0011 + 0.0; _w.z += Math.sin(t * 61) * 0.0009 * (1 + 2 * wNW);                    // a slight tremble
    solveNenaArm(nenaR, _w, 1, nQuat(-0.25, 0, 0), nQuat(-0.25, 0, 0));
    nena.updateMatrixWorld(true); nenaR.fore.updateWorldMatrix(true, false);
    orientHand(nenaR.hand, F_ROD, P_ROD, 1); nenaR.H.pose = HAND_POSES.wrapT;
    // the free hand: takes and passes the coin; otherwise it rests on the bayong, flat on the bag
    vtrack(nenLKeys, t, lapW, _w); const handoff = _w.distanceTo(lapW) > 0.06 ? 1 : 0;
    solveNenaArm(nenaL, _w, 1, nQuat(-0.08, 0, -0.1), nQuat(-0.35, 0, 0));
    nena.updateMatrixWorld(true); nenaL.fore.updateWorldMatrix(true, false);
    orientHand(nenaL.hand, v3(1, -0.1, 0), v3(0, -1, 0), 1 - handoff * 0.8); nenaL.H.pose = handoff ? pinchOr(nenaL, HAND_POSES.relaxed) : HAND_POSES.relaxed;
    SET.shots.j_buloy.p[1] = 1.2 + 0.12 * wS2; SET.shots.j_buloy.l[1] = 1.12 + 0.14 * wS2;                      // the camera rises with him when he half stands
    sun.position.set(3.5, 6, 2 + Math.sin(d * 0.05) * 0.8);
  },
};
