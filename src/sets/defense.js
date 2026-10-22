// ---------- SET: the thesis defense (episode 4, "Robust Po, Ma'am") ----------
// A state-university classroom set up for a defense. World: the back wall is at z -1.7 with the projector screen, the podium stands at the origin
// facing +z (the camera side), the panel table runs along z at x 1.9 with the professor behind it facing -x, the door is in the west wall (x -4.2),
// jalousie windows in the east wall (x +4.6). Buloy stands behind the podium, Claude sits on it beside the laptop.
// Same contract as the jeepney set: SET.shots (cameras) and SET.update(t, ctx), a pure function of time. px, v3, vtrack and reach come from 46-rig.js.

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0x2a2430); scene.fog = null;
const WALL_T = TEX.plaster("#e6dcc0", "#c9bb94", 3), WOODP = TEX.wood("#6a4a30", "#4a3220", "#7e5a3c", 5);
const tileTex = painted(16, 16, (g) => { g.fillStyle = "#d9d2bd"; g.fillRect(0, 0, 16, 16); g.fillStyle = "#c4bca4"; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); g.fillStyle = "#b3ab94"; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16); }, { repeat: true });

// ================= the room =================
tbox(room, 9.6, 0.1, 9, tileTex, 0.7, 0.2, -0.05, 1.5, { noShadow: true });                                             // the floor
tbox(room, 9.6, 3.2, 0.14, WALL_T, 1.3, 0.2, 1.6, -1.77, { noShadow: true });                                           // back wall
tbox(room, 0.14, 3.2, 8, WALL_T, 1.3, -4.27, 1.6, 1.2, { noShadow: true }).receiveShadow = false;                                             // west wall (the door side)
tbox(room, 0.14, 3.2, 8, WALL_T, 1.3, 4.67, 1.6, 1.2, { noShadow: true });                                              // east wall (the windows)
tbox(room, 9.6, 3.2, 0.14, WALL_T, 1.3, 0.2, 1.6, 5.2, { noShadow: true });                                              // front wall behind the camera
box(room, 9.6, 0.1, 8, 0xeee8d8, 0.2, 3.25, 1.2, { noShadow: true });                                                   // the ceiling
box(room, 9.5, 0.12, 0.05, 0x7a6a50, 0.2, 0.9, -1.69, { noShadow: true });                                              // a wainscot rail on the back wall
box(room, 9.5, 0.9, 0.05, 0x8a7458, 0.2, 0.45, -1.69, { noShadow: true });
// the door in the west wall, standing open
{
  const g = group(room, -4.2, 0, 0.5);
  box(g, 0.2, 2.2, 1.0, 0x1a1418, -0.02, 1.1, 0, { noShadow: true });                                                     // the dark doorway
  box(g, 0.24, 0.08, 1.14, 0x5a3c26, -0.02, 2.24, 0, { noShadow: true }); for (const z of [-0.54, 0.54]) box(g, 0.24, 2.2, 0.08, 0x5a3c26, -0.02, 1.1, z, { noShadow: true });
  const leaf = group(g, 0.1, 0, 0.5); leaf.rotation.y = 1.3;
  tbox(leaf, 0.05, 2.15, 0.96, WOODP, 0.5, 0, 1.075, -0.48); box(leaf, 0.06, 0.5, 0.4, 0x8fb4c8, 0.0, 1.55, -0.48, { noShadow: true }); box(leaf, 0.08, 0.06, 0.1, 0xd8c070, 0.0, 1.0, -0.88, { noShadow: true });
  plane(g, 0.34, 0.14, signMat(px("EXIT", 40, 14, "#1f7a44", "#ffffff", 1, { border: "#ffffff" }), 1.0), 0.1, 2.45, 0).rotation.y = Math.PI / 2;
  g.traverse((o) => { o.receiveShadow = false; });                                                                        // no cast shadows on the door or its frame (see the west wall)
}
// jalousie windows on the east wall: slatted glass, a bright afternoon behind
const jalTex = painted(16, 24, (g) => { g.fillStyle = "#fff0c0"; g.fillRect(0, 0, 16, 24); for (let y = 0; y < 24; y += 4) { g.fillStyle = "#b9d8e8"; g.fillRect(0, y, 16, 3); g.fillStyle = "#8aa8b8"; g.fillRect(0, y + 3, 16, 1); } }, { mip: false });
for (const z of [-0.9, 0.5, 1.9]) {
  const g = group(room, 4.58, 1.7, z);
  box(g, 0.1, 1.5, 1.1, 0x4a3c30, 0, 0, 0, { noShadow: true });
  const p = plane(g, 0.96, 1.36, new THREE.MeshBasicMaterial({ map: jalTex, color: new THREE.Color(1.5, 1.5, 1.45) }), -0.06, 0, 0); p.rotation.y = -Math.PI / 2;
  for (const y of [-0.7, 0, 0.7]) box(g, 0.14, 0.04, 1.14, 0x3a2e24, -0.02, y, 0, { noShadow: true });
}
// the projector screen on the back wall, the title slide, and the projector on the ceiling
const slideTex = painted(128, 72, (g) => {
  g.fillStyle = "#f4f6fa"; g.fillRect(0, 0, 128, 72); g.fillStyle = "#1c3f8a"; g.fillRect(0, 0, 128, 7); g.fillRect(0, 65, 128, 7);
  // a university seal, no words: a ring, a book, a small flame over it
  const SY = 21;
  g.fillStyle = "#1c3f8a"; for (let a = 0; a < 80; a++) { const x = 64 + Math.cos(a / 80 * 6.2832) * 11.5, y = SY + Math.sin(a / 80 * 6.2832) * 11.5; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  g.fillStyle = "#d8a024"; for (let a = 0; a < 60; a++) { const x = 64 + Math.cos(a / 60 * 6.2832) * 9, y = SY + Math.sin(a / 60 * 6.2832) * 9; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  g.fillStyle = "#1c3f8a"; g.fillRect(57, SY + 1, 6, 5); g.fillRect(65, SY + 1, 6, 5); g.fillStyle = "#f4f6fa"; g.fillRect(58, SY + 2, 4, 1); g.fillRect(66, SY + 2, 4, 1); g.fillRect(58, SY + 4, 4, 1); g.fillRect(66, SY + 4, 4, 1);
  g.fillStyle = "#c8281e"; g.fillRect(63, SY - 5, 2, 4); g.fillRect(62, SY - 3, 4, 2); g.fillStyle = "#d8a024"; g.fillRect(63, SY - 3, 2, 2);
  if (ATLAS && ATLAS.ptext) {
    ATLAS.ptext(g, "ROBUST, SCALABLE", 64, 40, "#12285c", { font: 5, scale: 1, align: "center" });
    ATLAS.ptext(g, "ADAPTIVE SYSTEMS", 64, 48, "#c8281e", { font: 5, scale: 1, align: "center" });
    ATLAS.ptext(g, "THESIS DEFENSE", 64, 60, "#4a5a7a", { font: 3, scale: 1, align: "center" });
  }
}, { mip: false });
{
  const g = group(room, 0.0, 2.5, -1.66);
  box(g, 1.45, 0.86, 0.03, 0x2a2a30, 0, 0, -0.01, { noShadow: true });
  plane(g, 1.34, 0.754, new THREE.MeshBasicMaterial({ map: slideTex, color: new THREE.Color(1.12, 1.12, 1.1) }), 0, 0, 0.008);
  box(room, 0.02, 0.5, 0.02, 0x2a2a30, -0.35, 3.0, -1.5, { noShadow: true }); box(room, 0.3, 0.12, 0.34, 0x3a3a44, -0.35, 2.74, -0.6, { noShadow: true });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.9, 1.1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: 2 }));
  beam.position.set(-0.35, 2.3, -1.1); beam.rotation.x = Math.PI / 2 - 0.12; room.add(beam);
}
// a wall clock, the school's framed VISION and MISSION, a corkboard (no flag anywhere in this room)
{
  const g = group(room, 2.4, 2.65, -1.66);
  mesh(g, new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), mat(0xf4f1e6), 0, 0, 0).rotation.x = Math.PI / 2; mesh(g, new THREE.TorusGeometry(0.2, 0.02, 4, 16), mat(0x2a2630), 0, 0, 0.01);
  box(g, 0.012, 0.13, 0.01, 0x16151c, 0, 0.06, 0.03, { noShadow: true }).rotation.z = 0.3; box(g, 0.01, 0.17, 0.01, 0x16151c, 0, 0.08, 0.035, { noShadow: true }).rotation.z = -2.3;
  const sec = box(g, 0.005, 0.17, 0.008, 0xc8281e, 0, 0.0, 0.04, { noShadow: true }); room.userData.sec = sec;
  for (const [x, head, seed] of [[-2.78, "VISION", 5], [-2.05, "MISSION", 9]]) {
    const g = group(room, x, 2.22, -1.66), r = rng(seed);
    box(g, 0.62, 0.8, 0.03, 0x4a3220, 0, 0, 0, { noShadow: true }); box(g, 0.56, 0.74, 0.012, 0xd8c070, 0, 0, 0.012, { noShadow: true });       // a wooden frame with a thin gold slip
    const tex = painted(52, 70, (c) => {
      c.fillStyle = "#f4f1e6"; c.fillRect(0, 0, 52, 70); c.fillStyle = "#1c3f8a"; c.fillRect(0, 0, 52, 3);
      if (ATLAS && ATLAS.ptext) ATLAS.ptext(c, head, 26, 7, "#12285c", { font: 5, scale: 1, align: "center" });
      c.fillStyle = "#c8281e"; c.fillRect(12, 17, 28, 1);
      for (let i = 0; i < 11; i++) { const w = i % 4 === 3 ? 18 + Math.floor(r() * 12) : 36 + Math.floor(r() * 6); c.fillStyle = "#8a8f9c"; c.fillRect(6, 23 + i * 4, w, 1); }
    }, { mip: false });
    plane(g, 0.52, 0.7, signMat(tex), 0, 0, 0.02);
  }
  box(room, 0.9, 0.6, 0.03, 0x8a6a40, 3.4, 1.9, -1.66, { noShadow: true }); for (let i = 0; i < 6; i++) box(room, 0.14, 0.18, 0.01, [0xf2f2ea, 0xffd23a, 0xe87aa8, 0x7fd8a6][i % 4], 3.1 + (i % 3) * 0.24, 1.78 + Math.floor(i / 3) * 0.26, -1.64, { noShadow: true });
}
// the ceiling fan and the stand fan: the fan is the only thing that moves in the silence
const cfan = group(room, 0.2, 3.1, 0.4);
box(cfan, 0.03, 0.3, 0.03, 0x5a5560, 0, 0.15, 0, { noShadow: true }); mesh(cfan, new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10), mat(0x6a6570), 0, -0.02, 0);
const cblades = group(cfan, 0, -0.06, 0);
for (let i = 0; i < 4; i++) { const b = group(cblades); b.rotation.y = i * Math.PI / 2; box(b, 0.62, 0.012, 0.15, 0xd8d0bc, 0.4, 0, 0, { noShadow: true }); }
const sfan = group(room, 3.6, 0, 1.3); sfan.rotation.y = -2.0;
{
  mesh(sfan, new THREE.CylinderGeometry(0.17, 0.2, 0.04, 10), mat(0x3a3a44), 0, 0.02, 0); box(sfan, 0.04, 1.0, 0.04, 0xaab0ba, 0, 0.55, 0, { noShadow: true });
  const head = group(sfan, 0, 1.12, 0); mesh(head, new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), mat(0x3a3a44), 0, 0, -0.1).rotation.x = Math.PI / 2;
  mesh(head, new THREE.TorusGeometry(0.24, 0.012, 4, 20), mat(0xc4c8d0, { rim: 0.6 }), 0, 0, 0.06); room.userData.sfanHead = head;
  const bl = group(head, 0, 0, 0.02); for (let i = 0; i < 4; i++) { const b = group(bl); b.rotation.z = i * Math.PI / 2; box(b, 0.05, 0.2, 0.01, 0x7fb4d8, 0, 0.11, 0, { noShadow: true }); }
  room.userData.sfanBlades = bl;
}

// ================= the podium, the laptop, the panel table =================
const POD_Y = 0.95;
// The podium is a surface (47-grip.js): its sloping top is the prop's own frame, so a hand or a laptop sits square on the slope.
const podP = makeProp("podium", room, { surface: true }); podP.g.position.set(0, POD_Y - 0.02, 0.15); podP.g.rotation.x = 0.06;
{
  const g = podP.g, body = group(g); body.rotation.x = -0.06; body.position.set(0, -(POD_Y - 0.02), 0);
  podP.box(g, 1.1, 0.05, 0.42, 0x5a3c26, 0, 0, 0, { mat: {} });                                                              // the top board
  box(g, 1.1, 0.008, 0.012, 0x3a2414, 0, 0.022, 0.2, { noShadow: true }); box(g, 1.04, 0.012, 0.02, 0x7a5636, 0, 0.031, 0.17, { noShadow: true });   // its front lip, and a ledge that stops papers sliding off
  podP.part(tbox(body, 1.0, 0.94, 0.34, WOODP, 0.5, 0, 0.47, 0, { noShadow: false }), "box", { h: [0.5, 0.47, 0.17] });
  box(body, 1.02, 0.04, 0.02, 0x2a1c12, 0, 0.9, 0.18, { noShadow: true });
  plane(body, 0.34, 0.16, signMat(px("DEFENSE\nTODAY", 44, 20, "#f2f2ea", "#12285c", 1, { border: "#12285c" })), 0, 0.42, 0.172).receiveShadow = false;
  // "edge": a white-knuckle hold on the near edge. The fingers lie on top pointing away from him, the heel hangs off the edge, the thumb presses the edge's face.
  podP.sockets.edge = (H, G = {}) => ({ p: v3(G.x || 0, 0.025, -0.21 + 0.03), n: v3(0, 1, 0), f: v3(0, 0, 1), anchor: [0, HD.rootY], start: [-0.18, 0.2, 0.15], to: [0.6, 0.9, 0.7], thumb: "oppose", splay: 0.3 });
}
laptop.visible = false;
const lap = makeLaptop(podP.g, { name: "laptop", tex: scrTex, k: 1.0 });
// the panel table: a cloth to the floor, a name card, water, the thick bound thesis
const TBL_X = 1.95, TBL_Z = -0.5;
{
  const g = group(room, TBL_X, 0, TBL_Z);
  box(g, 0.72, 0.04, 3.2, 0xf2ece0, 0, 0.77, 0); box(g, 0.7, 0.74, 3.16, 0x7a2a3a, 0, 0.37, 0.0, { noShadow: true });
  box(g, 0.74, 0.07, 3.22, 0xd8c070, 0, 0.74, 0, { noShadow: true });
  const card = group(g, -0.22, 0.79, -0.05); card.rotation.y = -Math.PI / 2; box(card, 0.3, 0.1, 0.02, 0xf4f1e6, 0, 0.05, 0); plane(card, 0.28, 0.08, signMat(px("PROF. DE LEON\nPANEL CHAIR", 56, 18, "#f4f1e6", "#12285c", 1)), 0, 0.05, 0.012);
  mesh(g, new THREE.CylinderGeometry(0.03, 0.034, 0.2, 8), mat(0xcfe8f0, { alpha: 0.5 }), -0.1, 0.89, 0.74); mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), mat(0x2f6fd9), -0.1, 1.0, 0.74);
}
const ptblP = makeProp("paneltable", room, { surface: true }); ptblP.g.position.set(TBL_X, 0.77, TBL_Z); ptblP.part(ptblP.g, "box", { h: [0.36, 0.02, 1.6] }); flatSocket(ptblP, 0.02);
const thesis = makeThesis(room, { name: "thesis" });
const TH_POS = v3(TBL_X + 0.06, 0.79 + thesis.dim.h / 2 + 0.0006, TBL_Z - 0.28), TH_Q = qEuler(0, Math.PI / 2, 0);
// two silent panelists: simple figures at the ends of the table
const dummies = [];
for (const [z, col, hair] of [[-1.62, 0x5a6a8a, 0x3a3030], [0.62, 0x7a8a6a, 0x6a6672]]) {
  const g = group(room, TBL_X + 0.55, 0, z), skinD = mat(0xa87a58, R);
  box(g, 0.3, 0.55, 0.42, 0x3a2e30, 0.1, 0.27, 0, { noShadow: true }); box(g, 0.24, 0.5, 0.4, col, 0.02, 0.88, 0, R);
  mesh(g, new THREE.SphereGeometry(0.1, 8, 6), skinD, 0.02, 1.26, 0); mesh(g, new THREE.SphereGeometry(0.108, 8, 5, 0, 6.3, 0, 1.4), mat(hair, R), 0.04, 1.28, 0);
  for (const s of [-1, 1]) box(g, 0.14, 0.05, 0.12, 0xd8d0bc, -0.16, 0.84, s * 0.16, { noShadow: true });
  dummies.push(g);
}
// chairs behind the table
for (const z of [-1.62, -0.5, 0.62]) { box(room, 0.42, 0.06, 0.5, 0x3a3a44, 2.58, 0.45, z, { noShadow: true }); box(room, 0.06, 0.5, 0.5, 0x3a3a44, 2.8, 0.7, z, { noShadow: true }); for (const q of [-0.2, 0.2]) box(room, 0.04, 0.45, 0.04, 0x8a93a0, 2.5, 0.22, z + q, { noShadow: true }); }

// ================= the cast moves in =================
const BUL = [0.18, 0.43, -0.22];                                   // standing behind the podium: his hips at 0.95, so the legs are hidden by its front
room.add(V); V.position.set(...BUL); V.rotation.y = 0; V.visible = true; V.children[0].visible = false; V.children[1].visible = false;
room.add(C); C.position.set(-0.2, POD_Y + 0.02, 0.14); C.visible = true; C.scale.setScalar(0.92);
// Buloy sweats: three drops slide down his temple
const sweat = [];
for (let i = 0; i < 3; i++) { const d = group(vHead); mesh(d, new THREE.SphereGeometry(0.0058, 7, 5), mat(0xbfe4f6, { glow: 1.05 }), 0, 0, 0, { noShadow: true }); mesh(d, new THREE.ConeGeometry(0.0046, 0.012, 6), mat(0xbfe4f6, { glow: 1.05 }), 0, 0.0085, 0, { noShadow: true }); mesh(d, new THREE.SphereGeometry(0.0018, 4, 3), mat(0xffffff, { glow: 1.5 }), -0.002, 0.002, 0.005, { noShadow: true }); sweat.push(d); }   // each a teardrop with a point of light, on the temple above the glasses' arm
// the professor: an older woman in a navy blazer, glasses, her hair up
const prof = makeBuloy({ young: true, girl: true, prof: true, glasses: true, sleeves: true, lace: false, strap: false, parent: room, at: [2.58, 0, -0.5], shirt: 0x22324e, shirtD: 0x16203a, legs: 0x16203a });
prof.V.rotation.y = -Math.PI / 2;
for (const s of [-1, 1]) box(prof.vUpper, 0.05, 0.22, 0.01, 0xf4f2ec, s * 0.025, 0.4, 0.148, { noShadow: true }).rotation.z = -s * 0.25;       // the white blouse in the opening of the blazer
for (const s of [-1, 1]) box(prof.vUpper, 0.04, 0.2, 0.012, 0x16203a, s * 0.07, 0.4, 0.15, { noShadow: true }).rotation.z = s * 0.25;           // its lapels
const faceBase = { blink: 0, open: 0, smile: 0.1, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const pface = { ...faceBase }, bulFace = { ...faceBase };
// Aling Nena, much older, from the canteen: an apron over her blouse, and a tray of turon
NENA_HAIR.hairN.color.set(0xb8b6c0); NENA_HAIR.greyN.color.set(0xd8d6de); NENA_HAIR.greyD.color.set(0x9896a2);
room.add(nena); nena.position.set(-3.9, 0, 0.5); nena.rotation.y = Math.PI / 2; nena.visible = false; fan.visible = false;
const nLegs = [];
{
  mesh(nena, new THREE.CylinderGeometry(0.2, 0.25, 0.5, 10), mat(0x6a3a8a, R), 0, 0.68, 0);
  for (const s of [-1, 1]) { const lg = group(nena, s * 0.07, 0.46, 0); box(lg, 0.085, 0.44, 0.09, 0xa8683e, 0, -0.22, 0, R); box(lg, 0.1, 0.05, 0.19, 0x23202c, 0, -0.46, 0.04, R); nLegs.push(lg); }
  box(nenaUp, 0.34, 0.5, 0.014, 0xf0e6c8, 0, 0.1, 0.168, R).rotation.x = -0.1; box(nenaUp, 0.2, 0.12, 0.016, 0xd8c8a0, 0, -0.02, 0.18, R);
  for (const s of [-1, 1]) { box(nenaUp, 0.012, 0.3, 0.012, 0xe8dcc0, s * 0.1, 0.46, 0.14, { noShadow: true }).rotation.z = -s * 0.15; }
}
const tray = makeTray(room, { name: "tray" });
gripRigPerson("prof", prof);
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
const bulRig = { vUpper, armL, armR }, profRig = { vUpper: prof.vUpper, armL: prof.armL, armR: prof.armR };
const BL = armRig(bulRig, 1, "viron"), BR = armRig(bulRig, -1, "viron"), PL = armRig(profRig, 1, "prof"), PR = armRig(profRig, -1, "prof"), NP = armNena(nenaR, "nena"), NM = armNena(nenaL, "nena");
const _tp = new THREE.Vector3(), _tq = new THREE.Quaternion(), _tq2 = new THREE.Quaternion();

// ================= the clock of the defense (times come from the acts of the script) =================
const LN = TL.lines, actLine = (name) => LN.find((l) => l.act === name);
const A = { hiss: actLine("b_hiss"), flat: actLine("c_flat"), hiss2: actLine("b_hiss2"), ask: actLine("p_ask"), bluff: actLine("b_bluff"), stare: actLine("p_stare"), beg: actLine("b_beg"), honest: actLine("c_honest"),
  enter: actLine("n_enter"), nask: actLine("n_ask"), plain: actLine("b_plain"), delight: actLine("n_delight"), nod: actLine("p_nod"), sign: actLine("c_signoff"), laugh: LN[LN.length - 1] };
const win = (ln, t, pi = 0.2, po = 0.3) => (ln ? smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3)) : 0);
const T_PERO = (() => { const c = A.honest && TL.shots.find((k) => k.shot === "d_buloy" && k.t > A.honest.s && k.t < A.honest.e); return c ? c.t : 1e9; })();       // the cut to Buloy inside Claude's "Pero ikaw ang nakatayo diyan"
const span01 = (ln, t) => (ln ? clamp01((t - ln.s) / (ln.e - ln.s)) : 0);
const yawKeys = [[0, -0.5]], pyKeys = [[0, 0.3]];
const nyKeys = [[0, 0]];
for (const l of LN) {
  const a = l.act;
  yawKeys.push([l.s - 0.2, a === "b_hiss" || a === "b_hiss2" || a === "b_beg" ? -0.55 : a === "b_bluff" || a === "p_ask" || a === "p_stare" || a === "p_nod" ? 0.85 : a === "b_plain" || a === "n_ask" || a === "n_delight" || a === "n_enter" ? -0.75 : a === "c_honest" ? -0.5 : 0.1, 0.3]);
  pyKeys.push([l.s - 0.2, a === "n_enter" || a === "n_ask" || a === "n_delight" ? 0.55 : a === "b_plain" || a === "b_hiss" || a === "b_hiss2" || a === "b_beg" || a === "b_bluff" ? -0.3 : -0.2, 0.3]);
}
for (const a of [yawKeys, pyKeys]) a.sort((x, y) => x[0] - y[0]);

const sun = new THREE.DirectionalLight(0xffe6b8, 2.3); sun.position.set(7, 5, 1.5); sun.target.position.set(0.5, 0.8, 0); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 16 }); sun.shadow.camera.updateProjectionMatrix();
const lampA = new THREE.PointLight(0xfff0d8, 2.2, 8, 1.4); lampA.position.set(0.3, 2.9, 0.6); room.add(lampA);
const lampB = new THREE.PointLight(0xfff0d8, 1.6, 8, 1.4); lampB.position.set(2.2, 2.9, -0.4); room.add(lampB);
for (const [x, z] of [[0.2, 0.6], [2.2, -0.4], [-2.2, 0.6]]) box(room, 1.1, 0.04, 0.2, 0xfff8e0, x, 3.18, z, { glow: 1.4, noShadow: true });

const SET = {
  name: "defense",
  mode: () => "defense",
  keys: () => [{ t: 0.3, label: "podium-grip" }, { t: A.ask ? A.ask.s + 0.5 : 8, label: "thesis-reach" }, { t: A.ask ? A.ask.s + 1.1 + Math.PI / 5 : 9, label: "thesis-tap" }, { t: A.ask ? A.ask.s + 1.1 + Math.PI / 5 + 0.42 : 9, label: "thesis-tap-up" }, { t: A.enter ? A.enter.s + 0.6 : 27, label: "tray-walk" }, { t: A.delight ? A.delight.s + 1 : 39, label: "tray-offer" }, { t: A.plain ? A.plain.s + 1 : 35, label: "podium-one-hand" }, { t: T_PERO < 1e8 ? T_PERO + 0.55 : 26, label: "pero-swallow" }, { t: T_PERO < 1e8 ? T_PERO + 1.6 : 27, label: "pero-back" }],
  shots: {
    d_open:   { p: [0.12, 1.55, 1.85], l: [0.085, 1.445, -0.15], fov: 37, d: [0.002, 0, -0.03], cap: 860 },                 // Buloy's worried face in the centre and large, Claude on the podium at his side; the hook sits under his chin
    d_buloy:  { p: [0.4, 1.64, 1.8], l: [0.17, 1.61, -0.2], fov: 30, d: [-0.006, 0, -0.025], cap: 1380, face: "viron" },     // Buloy medium, behind the podium: his head is never cut
    d_claude: { p: [0.3, 1.3, 2.3], l: [-0.2, 1.185, 0.14], fov: 34, d: [0, 0, -0.03], near: 0.1, cap: 270 },                // Claude on the podium, deadpan
    d_prof:   { p: [0.7, 1.32, 0.35], l: [2.55, 1.07, -0.5], fov: 30, d: [0.03, 0, 0.02], cap: 1425 },                      // the panel chair, her stare; her captions on the table's edge, off her blazer
    d_two:    { p: [0.55, 1.5, 1.6], l: [0.06, 1.3, 0.0], fov: 40, d: [-0.01, 0, -0.03], cap: 1390 },                        // Buloy leaning down to Claude
    d_door:   { p: [-0.4, 1.4, 3.1], l: [-3.0, 1.15, 0.6], fov: 44, d: [-0.03, 0, -0.03], cap: 1390 },                         // Aling Nena in the doorway with the tray
    d_nena:   { p: [-1.4, 1.5, 3.3], l: [-2.0, 1.3, 0.7], fov: 34, d: [0, 0, -0.02], cap: 975 },                             // Aling Nena medium; her captions on the apron's bib, clear of the tray and her hands
  },
  update(t, ctx) {
    const vAmp = ampAt("viron", t), pAmp = ampAt("prof", t);
    hemi.color.setRGB(0.85, 0.88, 1.0); hemi.groundColor.setRGB(0.55, 0.48, 0.42); hemi.intensity = 1.1; grade.uniforms.uExposure.value = 0.88;
    duskRim.intensity = 0.2; skyFill.intensity = 0.3; RIM.uRimColor.value.setRGB(0.6, 0.55, 0.5);
    // ---- the fans, the clock ----
    cblades.rotation.y = t * 7; room.userData.sfanBlades.rotation.z = t * 11; room.userData.sfanHead.rotation.y = Math.sin(t * 0.5) * 0.6 + 2.5; room.userData.sec.rotation.z = -t * 0.1047;
    const wHiss = Math.max(win(A.hiss, t), win(A.hiss2, t)), wBluff = win(A.bluff, t), wBeg = win(A.beg, t, 0.6, 0.3), wPlain = win(A.plain, t, 0.3, 0.6);
    const wAsk = win(A.ask, t), wStare = A.stare && A.beg ? smooth((t - (A.stare.s - 0.1)) / 0.3) * (1 - smooth((t - (A.beg.s - 0.02)) / 0.1)) : 0, wNod = win(A.nod, t, 0.1, 0.6);
    const wEnter = win(A.enter, t, 0.4, 0.2), wNask = win(A.nask, t), wDel = win(A.delight, t, 0.1, 0.5), wLaugh = A.laugh ? smooth((t - (A.laugh.s - 0.1)) / 0.2) : 0;
    // ---- Buloy: standing, gripping the podium; sweating, whispering down to Claude, bluffing, begging, then relaxed ----
    V.position.set(BUL[0] + Math.sin(t * 1.7) * 0.004, BUL[1], BUL[2] - 0.08 * wBeg);
    vUpper.position.y = 0.52;
    vUpper.rotation.x = 0.1 + Math.sin(t * 1.9) * 0.012 + 0.2 * wHiss + 0.48 * wBeg - 0.05 * wBluff - 0.06 * wPlain;
    vUpper.rotation.y = -0.2 * wHiss - 0.3 * wBeg + 0.25 * wBluff - 0.15 * wPlain; vUpper.rotation.z = Math.sin(t * 5.3) * 0.008 * (wHiss + wBluff) + 0.04 * wHiss;
    vHead.rotation.y = track(yawKeys, t, 0.3) + Math.sin(t * 0.9) * 0.015 + Math.sin(t * 7.1) * 0.01 * (wHiss + wBluff);
    vHead.rotation.x = track(pyKeys, t, 0.3) * 0.5 + 0.1 * wHiss - 0.06 * wBluff; vHead.rotation.z = 0.04 * wBeg - 0.03 * wHiss;
    Object.assign(bulFace, face);
    const fHiss = A.hiss && t < A.hiss.s + 0.3 ? 1 : wHiss;                              // the worry is on his face from the first frame, before he speaks
    bulFace.sad = 0.8 * fHiss + 0.6 * wBeg + 0.3 * wBluff; bulFace.brow = -0.55 * fHiss + 0.5 * wBeg + 0.4 * wBluff + 0.2 * wPlain; bulFace.smile = -0.4 * fHiss - 0.1 * wBeg + 0.25 * wBluff - 0.05 + 0.35 * wPlain;
    const wPanic = A.hiss && t < A.hiss.e + 0.2 ? 1 - smooth((t - A.hiss.e) / 0.2) : 0;                              // the first line: wide-eyed
    bulFace.lid = 0.1 * wHiss - 0.5 * wPanic; bulFace.cheek = 0.3 * wPlain; bulFace.wet = 0.25 * wBeg;
    if (A.hiss && t < A.hiss.s) { bulFace.open = 0.32; bulFace.pucker = 0.12; }
    bulFace.gx = wHiss || wBeg ? -0.4 : wBluff ? 0.55 : -0.2; bulFace.gy = 0.15;
    if (T_PERO < 1e8 && t >= T_PERO - 0.1 && t < T_PERO + 2.4) {
      const u = t - T_PERO, back = smooth((u - 1.05) / 0.4), sw = Math.exp(-(((u - 0.55) / 0.16) ** 2));
      vHead.rotation.y = -0.42 + 0.95 * back; vHead.rotation.x = 0.1 * (1 - back) + 0.1 * sw - 0.03 * back;
      bulFace.gx = -0.5 + 1.0 * back; bulFace.gy = 0.25 * (1 - back); bulFace.sad = 0.55; bulFace.brow = -0.35; bulFace.smile = -0.3 - 0.15 * sw; bulFace.pucker = 0.35 * sw; bulFace.open = 0; bulFace.lid = 0.1;
      bulFace.blink = Math.max(bulFace.blink, Math.exp(-(((u - 0.62) / 0.07) ** 2)), Math.exp(-(((u - 1.2) / 0.07) ** 2)));
    }
    buloy.draw(bulFace);
    sweat.forEach((d, i) => { const u = (t * 0.4 + i / 3) % 1, on = clamp01(0.4 + wHiss + wBluff + wBeg + 0.3 * (1 - wPlain)); d.visible = on > 0.3 && u < 0.9; d.position.set(0.0865 - i * 0.002, 0.212 - u * 0.045 - i * 0.004, 0.04 - i * 0.028); d.scale.setScalar((u < 0.12 ? u / 0.12 : 1) * 1.9); });
    room.updateMatrixWorld(true);
    // the laptop lies on the podium's slope, open toward him
    gripRest(lap, podP.g.localToWorld(_tp.set(0.5, 0.025 + lap.dim.T / 2 + 0.0006, -0.03)), podP.g.getWorldQuaternion(_tq).multiply(_tq2.setFromAxisAngle(v3(0, 1, 0), Math.PI)), podP);
    // his hands: both on the podium's near edge, knuckles up; the right one comes free to gesture when he finally speaks plainly
    reach(bulRig, 1, [[0, null]], t, REST_LOCAL[0]); reach(bulRig, -1, [[0, null]], t, REST_LOCAL[1], [[1, vUpper.worldToLocal(v3(BUL[0] - 0.12, 1.12, 0.12))]]);
    armL.hand.quaternion.identity(); armR.hand.quaternion.identity(); armL.H.pose = armR.H.pose = HAND_POSES.relaxed;
    const tense = Math.max(wBluff, wBeg * 0.5, wHiss * 0.6);
    gripTouch(podP, [{ A: BL, sk: "edge", x: 0.275, w: 1, g: 0.55 + 0.45 * tense }, { A: BR, sk: "edge", x: 0.075, w: 1 - wPlain, g: 0.55 + 0.45 * tense, arc: 0.04 }]);
    // ---- Claude on the podium: flat, honest, a nod to sign off ----
    const uSign = span01(A.sign, t);
    C.position.set(-0.2, POD_Y + 0.02 + Math.abs(Math.sin(t * 4)) * 0.0, 0.14); C.rotation.y = 0.35 + 0.25 * win(A.honest, t) + Math.sin(t * 0.7) * 0.02;
    cBody.rotation.x = 0.08 * win(A.honest, t) + (A.sign ? 0.14 * Math.sin(Math.PI * smooth((uSign - 0.3) / 0.35)) : 0) * win(A.sign, t, 0, 0.3); cBody.rotation.z = Math.sin(t * 0.9) * 0.015;
    let bc = 1 - blinkAt(t, 2.3, 3.8) * 0.9;
    if (A.flat) bc = Math.min(bc, 1 - 0.95 * Math.exp(-(((span01(A.flat, t) - 0.6) / 0.12) ** 2)) * win(A.flat, t));
    if (A.sign) bc = Math.min(bc, 1 - 0.95 * Math.exp(-(((t - (A.sign.e - 0.6)) / 0.3) ** 2)));
    cEyes.forEach((e) => { e.scale.y = 0.08 * bc; });
    cArms[0].position.set(-0.275, 0.13, 0.16); cArms[1].position.set(0.275, 0.13, 0.16);
    // ---- the professor: taps the thesis when she asks, stares over her glasses, nods ----
    prof.V.position.set(2.58, 0.07, -0.5);                                  // she sits up on a cushion: her forearms come down onto the table, not through its edge prof.vUpper.rotation.set(0.06 + 0.04 * wAsk + 0.05 * wStare, 0, 0);
    prof.vHead.rotation.set(0.04 + 0.16 * wStare + 0.12 * Math.sin(Math.PI * smooth((t - (A.nod ? A.nod.s : 0)) / 0.6)) * wNod, -0.2 * wStare + 0.1 * wAsk + Math.sin(t * 0.6) * 0.02, 0.03 * wStare);
    Object.assign(pface, faceBase);
    pface.blink = wStare ? 0 : blinkAt(t, 1.4, 4.4); pface.open = clamp01(pAmp * 1.25); pface.brow = 0.1 * wAsk + 0.35 * wStare; pface.anger = 0.55 * wStare; pface.lid = 0.38 * wStare; pface.smile = -0.12 + 0.12 * wAsk - 0.1 * wStare + 0.5 * wNod; pface.cheek = 0.4 * wNod;
    pface.gx = 0.0; pface.gy = -0.1 * wStare;
    prof.draw(pface);
    prof.vUpper.updateWorldMatrix(true, false);
    // her left hand lies flat on the cloth; her right rests there too until she asks, then one finger comes down on the thesis, again and again
    gripRest(thesis, TH_POS, TH_Q, ptblP);
    reach(profRig, 1, [[0, null]], t, v3(0.16, 0.34, 0.3)); reach(profRig, -1, [[0, null]], t, v3(-0.16, 0.34, 0.3));
    prof.armL.hand.quaternion.identity(); prof.armR.hand.quaternion.identity(); prof.armL.H.pose = prof.armR.H.pose = HAND_POSES.relaxed;
    const tapW = A.ask ? smooth((t - (A.ask.s + 0.2)) / 0.6) * (1 - smooth((t - (A.ask.e - 0.3)) / 0.5)) : 0, tapU = A.ask && t > A.ask.s + 1.1 ? Math.max(0, Math.sin((t - A.ask.s - 1.1) * 7.5)) : 0;
    const flatAt = (z) => ({ sk: "flat", x: (2.2 - TBL_X), z: z - TBL_Z, dir: v3(-1, 0, 0) });
    gripTouch(ptblP, [{ A: PL, ...flatAt(-0.3), w: 1, g: 1 }, { A: PR, ...flatAt(-0.56), w: 1 - tapW, g: 1, arc: 0.05 }]);
    if (tapW > 0.001) for (let k = 0; k < 2; k++) gripTouch(thesis, [{ A: PR, sk: "tap", x: 0.02, z: 0.07, dir: v3(0, 0, -1), w: tapW, lift: -0.0012 + 0.03 * (1 - tapU), contact: tapW > 0.999 && tapU > 0.97, clear: 0.05, arc: 0.04 }]);
    // ---- the silent panelists lean a little, one nods ----
    dummies.forEach((g, i) => { g.rotation.z = Math.sin(t * 0.8 + i * 2) * 0.02; g.children[2].rotation.x = Math.sin(t * 0.5 + i) * 0.04 + (wNod ? 0.1 : 0); });
    // ---- Aling Nena: walks in with the tray, asks, delights, laughs ----
    const sS = A.enter ? A.enter.s - 0.15 : 1e9, sE = A.enter ? A.enter.e + 0.3 : 1e9, walkU = clamp01((t - sS) / (sE - sS));
    const nx = -3.9 + 1.9 * smooth(walkU), moving = walkU > 0 && walkU < 1 ? 1 : 0;
    nena.visible = t >= sS - 0.1;
    nena.position.set(nx, Math.abs(Math.sin(t * 7)) * 0.012 * moving, 0.5 + 0.2 * smooth(walkU)); nena.rotation.y = Math.PI / 2 - 1.0 * smooth(clamp01((t - (sS + (sE - sS) * 0.75)) / 0.9));
    nLegs.forEach((lg, i) => { lg.rotation.x = Math.sin(t * 7 + i * Math.PI) * 0.5 * moving; });
    nenaHead.rotation.set(0.1 - 0.3 * wDel + 0.1 * wNask * 0, -0.5 * (1 - walkU) * 0 + 0.2 * wNask + Math.sin(t * 0.7) * 0.04 - 0.15 * wLaugh, 0.04 * wNask + Math.sin(t * 14) * 0.03 * wLaugh);
    nenaUp.rotation.set(0.12 - 0.1 * wLaugh, 0, Math.sin(t * 7) * 0.02 * moving + Math.sin(t * 15) * 0.015 * wLaugh); nenaUp.position.y = 0.9 + Math.sin(t * 15) * 0.008 * wLaugh;
    nface.old = 1; nface.blink = Math.max(blinkAt(t, 1.3, 4.6), 0.9 * wLaugh * (Math.sin(t * 6) > 0 ? 1 : 0.5)); nface.open = clamp01(ctx.nTalk * 1.3 + 0.25 * wLaugh * Math.abs(Math.sin(t * 13)));
    nface.smile = 0.2 + 0.3 * wEnter + 0.2 * wNask + 0.7 * wDel + 0.8 * wLaugh; nface.squint = Math.max(0.2 * wEnter, 0.35 * wNask, 0.5 * wDel, 0.8 * wLaugh); nface.brow = 0.15 + 0.25 * wNask + 0.2 * wDel; nface.gx = 0; nface.gy = 0.05; nface.wide = wEnter ? -0.5 * (nface.open > 0.2 ? 1 : 0) : Math.sin(t * 8.1) * 0.5 * (ctx.nTalk > 0 ? 1 : 0);
    drawNena(nctx, nface); nenaTex.needsUpdate = true;
    nena.updateMatrixWorld(true);
    // her hands: one at each end of the tray, fingers under the board, thumbs on the end rails. On n_delight she holds it out to him.
    nenaR.pole = [0.5, -1, 0.0]; nenaL.pole = [-0.5, -1, 0.0];
    solveNenaArm(nenaR, nena.localToWorld(v3(0.2, 1.2, 0.2)), 1, nQuat(-0.25, 0, 0), nQuat(-0.4, 0, 0)); solveNenaArm(nenaL, nena.localToWorld(v3(-0.2, 1.2, 0.2)), 1, nQuat(-0.25, 0, 0), nQuat(-0.4, 0, 0));
    nenaR.hand.quaternion.identity(); nenaL.hand.quaternion.identity(); nenaR.H.pose = nenaL.H.pose = HAND_POSES.relaxed;
    nena.updateMatrixWorld(true);
    if (nena.visible) {
      const offer = wDel + 0.12 * wLaugh, tpos = nena.localToWorld(_tp.set(0, 1.13 + Math.sin(t * 7) * 0.008 * moving + 0.05 * offer, 0.365 + 0.07 * offer));
      nena.getWorldQuaternion(_tq).multiply(_tq2.setFromAxisAngle(v3(1, 0, 0), 0.1 * offer + Math.sin(t * 7 + 1) * 0.015 * moving));
      gripHold(tray, tpos, _tq, [{ A: NP, sk: "end+", z: -0.075, w: 1, g: 1 }, { A: NM, sk: "end-", z: -0.075, w: 1, g: 1 }], { carrier: 0 });
    } else gripHide(tray);
    nenaL.up.visible = true;
    sun.position.set(7, 5, 1.5 + Math.sin(t * 0.2) * 0.3);
  },
};
