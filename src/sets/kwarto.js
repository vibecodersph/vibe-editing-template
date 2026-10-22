// ---------- SET: Buloy's bedroom at night, a place to be reused (the first episode shot here with the cinematographer is 13, "Legit Developer") ----------
// Episode 9's brownout version (candle, fan, door, book, router) is frozen in kwarto-ep09.js; this file is the room with nothing of that in it.
// World: the lens side is +z, the back wall is at z -0.78, the left wall at x -1.76, the right wall at x 1.66, the ceiling at 2.7.
// Buloy sits at the desk's left end on a swivel chair, turned toward Claude (body 0.85 rad off the lens, the head the rest of the way). Claude stands on a stack of three
// thick books on the desk (so his eyes are near Buloy's eye line, and a camera at Buloy's eyes sees him square on). The laptop stands between them, its screen turned to
// the lens side and a little toward Buloy, so a camera on the lens side reads it and sees a face in the same frame.
// The room is lit as a night: deep navy walls and floor (tinted in update()), a moonlit window in the back wall, fairy lights, a lamp; the cinematographer (SET.cine) adds
// a warm key from the screen's side and a cool rim for every solved shot, and the fog lets the room fall away behind the faces.
//
// What an episode can add (episodes/NN-slug/stage.js is joined right after this file and sees every name below):
//   ACTST[act]            Buloy's state for a script act: { h: [yaw, pitch, roll], u: [turn, lean], f: face keys, hands: "rest" | a name of HS | (t) => ({ name: weight }) }
//   HS[name](s)           a hand's target in the upper body's frame (s +1 his left, -1 his right): { p, F, Pm, pose }
//   KW.buloy(t, P)        a hook called every frame with P = { hx, hy, hz, look } (extra head rotation added after the eyeline: a nod, a tilt; look 0..1 turns his head and eyes smoothly from Claude to the screen)
//   KW.claude(t, S)       a hook with S = { yaw, tilt, lean, hop, nubL, nubR } (Claude's extra yaw, tilt about z, lean about x, hop in metres, nub offsets or null)
//   KW.screen(t, rd, g)   draw the laptop's screen (a 256 x 165 canvas context); rd is true in a camera that can read words, false in the others (bars, never cropped words)
//   KW.screenLight(t)     { c: [r, g, b], i } the screen's own light on the faces
//   KW.mug                two rows printed on the mug (null for a plain mug)
// With nothing added Buloy sits and breathes, blinks, looks at Claude, his hands resting on the desk; Claude stands, blinks and faces him.

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0x04060e); scene.fog = null;
RIM.uRimWorld.value.set(-0.45, 0.5, -0.74).normalize();                             // the rim comes from the window: moonlight over shoulders and hair

const LN = TL.lines, NO_LINE = { s: 1e9, e: 1e9 }, actLine = (name) => LN.find((l) => l.act === name) || NO_LINE;
const win = (ln, t, pi = 0.2, po = 0.3) => smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3));
const env = (a, b, t, ei = 0.25, eo = 0.3) => smooth((t - a) / ei) * (1 - smooth((t - b) / eo));
const ramp = (a, b, t) => smooth((t - a) / Math.max(1e-4, b - a));
const lerp = (a, b, w) => a + (b - a) * w;
const HAS = (n) => ASSET.has(n);
const dimMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.5, 0.5, 0.56) });       // a picture on the wall: lit by nothing, never brighter than a face
const dull = (c, k = 0.6, g = 0.45) => { const r = (c >> 16) & 255, gg = (c >> 8) & 255, b = c & 255, l = 0.3 * r + 0.59 * gg + 0.11 * b, f = (v) => Math.round((v + (l - v) * g) * k); return (f(r) << 16) | (f(gg) << 8) | f(b); };       // a colour toned down: pulled toward its grey and darkened, so a set dressing never outshines a face
const DESK_Y = 0.74, WALL_Z = -0.78, CS = 0.85;
const BUL = [-0.5, 0, -0.14], BYAW = 0.85;                                           // Buloy's chair, and how far his body is turned from the lens (toward Claude)
const CLX = 0.58, CLZ = 0.5, RISER = 0.26;                                         // Claude's place on the desk, and the height of the books under him
const LAP = { x: 0.08, z: 0.64, yaw: -0.6 };                                       // the laptop's place and the turn of its screen (-: toward Buloy)
const KW = { buloy: null, claude: null, screen: null, screenLight: null, mug: null };

// ================= the room =================
const WALLT = HAS("wall") ? ASSET.tex("wall", { pixel: true, repeat: [1, 1] }) : TEX.plaster("#b4c8ae", "#869c84", 21), WT = HAS("wall") ? 2.2 : 1.3;
const FLOORT = painted(32, 32, (g) => {
  g.fillStyle = "#8a6f58"; g.fillRect(0, 0, 32, 32); g.fillStyle = "#7c624d"; g.fillRect(0, 0, 16, 16); g.fillRect(16, 16, 16, 16);
  g.fillStyle = "#6a523f"; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 32); g.fillRect(16, 0, 1, 32);
  speck(g, rng(5), 32, 32, 40, ["#93785f", "#70573f"]);
}, { repeat: true });
const WOODD = TEX.wood("#8a6238", "#5c3d20", "#a07848", 5);
const FLOORM = tbox(room, 3.5, 0.1, 4.5, FLOORT, 0.8, -0.05, -0.05, 1.35, { noShadow: true }).material;
const WALLM = tbox(room, 3.5, 2.7, 0.12, WALLT, WT, -0.05, 1.35, WALL_Z - 0.06, { noShadow: true }).material;                 // the back wall; one material for every wall, tinted in update()
tbox(room, 0.12, 2.7, 4.5, WALLT, WT, -1.76, 1.35, 1.35, { noShadow: true });
tbox(room, 0.12, 2.7, 4.5, WALLT, WT, 1.66, 1.35, 1.35, { noShadow: true }).receiveShadow = false;
tbox(room, 3.5, 2.7, 0.12, WALLT, WT, -0.05, 1.35, 3.6, { noShadow: true });
box(room, 3.5, 0.1, 4.5, 0x8c93aa, -0.05, 2.7, 1.35, { noShadow: true });
box(room, 3.4, 0.1, 0.02, 0x54705e, -0.05, 0.05, WALL_Z + 0.01, { noShadow: true });                                      // the baseboard
// the moonlit window: it keeps its light in any fog, so a camera that looks at the back wall always finds a blue glow in the dark
const nightTex = HAS("night") ? ASSET.tex("night", { pixel: true }) : painted(48, 72, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 72); gr.addColorStop(0, "#0c1436"); gr.addColorStop(0.7, "#1d2e5e"); gr.addColorStop(1, "#2a3c72"); g.fillStyle = gr; g.fillRect(0, 0, 48, 72);
  const r = rng(909); for (let i = 0; i < 30; i++) { g.fillStyle = i % 4 ? "#aeb9e6" : "#ffffff"; g.fillRect(Math.floor(r() * 48), Math.floor(r() * 46), 1, 1); }
  g.fillStyle = "#f6f2da"; g.beginPath(); g.arc(34, 16, 5, 0, 7); g.fill();
  g.fillStyle = "#090c1a"; g.fillRect(0, 60, 48, 12);
  for (const [x0, xm, x1, y] of [[-4, 8, 20, 50], [16, 29, 42, 54], [36, 46, 56, 51]]) { g.beginPath(); g.moveTo(x0, 61); g.lineTo(xm, y); g.lineTo(x1, 61); g.fill(); }
  g.fillRect(22, 44, 1, 10); g.fillRect(20, 46, 5, 1); g.fillRect(40, 47, 5, 5);
  g.fillStyle = "#ffb060"; g.fillRect(27, 63, 2, 2);
}, { mip: false });
const WIN = { x: -1.0, y: 1.62, w: 0.56, h: 0.9 };
{
  const g = group(room, WIN.x, WIN.y, WALL_Z + 0.005);
  box(g, WIN.w + 0.1, WIN.h + 0.1, 0.03, 0x3a2e24, 0, 0, 0, { noShadow: true });
  plane(g, WIN.w, WIN.h, new THREE.MeshBasicMaterial({ map: nightTex, color: new THREE.Color(0.5, 0.55, 0.72), fog: false }), 0, 0, 0.017);
  box(g, 0.03, WIN.h, 0.03, 0x3a2e24, 0, 0, 0.03, { noShadow: true });
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) box(g, WIN.w / 2 - 0.03, 0.006, 0.05, 0x1c2438, s * WIN.w / 4, -WIN.h / 2 + 0.05 + i * (WIN.h - 0.1) / 8, 0.04, { noShadow: true }).rotation.x = -0.6;
  box(g, WIN.w + 0.16, 0.03, 0.09, 0x3a2e24, 0, -WIN.h / 2 - 0.06, 0.04, { noShadow: true });                              // the sill
  for (const [x, h, c] of [[-0.17, 0.1, dull(0xb8433a)], [-0.1, 0.07, dull(0x3a6ea8)]]) box(g, 0.05, h, 0.06, c, x, -WIN.h / 2 - 0.04 + h / 2 + 0.03, 0.06, { noShadow: true });       // two small boxes on the sill
}
// the shelf over the desk's left end: books, a pot, a small speaker
{
  const g = group(room, -0.3, 1.84, WALL_Z + 0.1);
  box(g, 0.9, 0.028, 0.2, 0x6a4a2c, 0, 0, 0); for (const x of [-0.36, 0.36]) box(g, 0.02, 0.12, 0.16, 0x3a2a1c, x, -0.07, -0.01, { noShadow: true });
  for (const [x, h, c] of [[-0.4, 0.2, dull(0xb8433a)], [-0.36, 0.17, dull(0x3a6ea8)], [-0.32, 0.21, dull(0xd8b23a)], [-0.27, 0.15, dull(0x4f8a5a)], [-0.23, 0.19, dull(0x8a4fc4)]]) box(g, 0.034, h, 0.13, c, x, 0.014 + h / 2, 0, { noShadow: true });
  mesh(g, new THREE.CylinderGeometry(0.035, 0.028, 0.05, 8), mat(0xb5613c), 0.3, 0.04, 0.01); mesh(g, new THREE.SphereGeometry(0.036, 7, 5), mat(0x3f8a4a), 0.3, 0.09, 0.01);
  box(g, 0.13, 0.17, 0.11, 0x2a2e3a, 0.1, 0.099, 0.0, { noShadow: true }); mesh(g, new THREE.CircleGeometry(0.03, 10), mat(0x14161e), 0.1, 0.085, 0.057, { noShadow: true });
}
// pictures with no words: a calendar, two prints, sticky notes
{
  const cal = painted(32, 44, (g) => {
    g.fillStyle = "#f2ecdc"; g.fillRect(0, 0, 32, 44); g.fillStyle = "#c8382e"; g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#ffd76a"; g.beginPath(); g.arc(23, 7, 3, 0, 7); g.fill(); g.fillStyle = "#7a2a22"; g.beginPath(); g.moveTo(0, 16); g.lineTo(9, 6); g.lineTo(16, 12); g.lineTo(21, 8); g.lineTo(32, 16); g.fill();
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { g.fillStyle = c === 0 ? "#d9685e" : "#9a958a"; g.fillRect(3 + c * 4, 20 + r * 4.5, 2, 2); }
    g.strokeStyle = "#c8382e"; g.lineWidth = 1; g.strokeRect(13.5, 27.5, 5, 5);
  }, { mip: false });
  plane(room, 0.3, 0.41, new THREE.MeshToonMaterial({ color: 0x8a8a98, gradientMap: GRAD, map: cal }), -1.5, 1.5, WALL_Z + 0.006);
  const print1 = painted(40, 52, (g) => { const gr = g.createLinearGradient(0, 0, 0, 52); gr.addColorStop(0, "#2a3466"); gr.addColorStop(0.6, "#8a5e52"); gr.addColorStop(1, "#a08a64"); g.fillStyle = gr; g.fillRect(0, 0, 40, 52); g.fillStyle = "#1a1a3a"; g.beginPath(); g.moveTo(0, 52); g.lineTo(12, 30); g.lineTo(22, 42); g.lineTo(30, 26); g.lineTo(40, 52); g.fill(); g.fillStyle = "#cfc8aa"; g.beginPath(); g.arc(28, 14, 4, 0, 7); g.fill(); }, { mip: false });
  const frame1 = group(room, 0.3, 1.5, WALL_Z + 0.012); box(frame1, 0.34, 0.44, 0.02, 0x1c1c24, 0, 0, 0, { noShadow: true }); plane(frame1, 0.3, 0.4, dimMat(print1), 0, 0, 0.011);
  const print2 = painted(52, 36, (g) => { g.fillStyle = "#101a3a"; g.fillRect(0, 0, 52, 36); const r = rng(14); for (let i = 0; i < 26; i++) { g.fillStyle = i % 5 ? "#8aa0e0" : "#ffffff"; g.fillRect(Math.floor(r() * 52), Math.floor(r() * 36), 1, 1); } g.fillStyle = "#8a5448"; g.beginPath(); g.arc(18, 20, 8, 0, 7); g.fill(); g.fillStyle = "#8a86a8"; g.fillRect(2, 22, 48, 1); g.fillRect(34, 8, 12, 12); }, { mip: false });
  const frame2 = group(room, 0.88, 1.62, WALL_Z + 0.012); box(frame2, 0.5, 0.36, 0.02, 0x1c1c24, 0, 0, 0, { noShadow: true }); plane(frame2, 0.46, 0.32, dimMat(print2), 0, 0, 0.011);
  for (const [x, y, c, rz] of [[-1.3, 1.1, 0xffe066, 0.08], [-1.22, 1.19, 0xff9ac0, -0.1], [-1.34, 1.24, 0x9fe8a0, 0.05]]) { const n = box(room, 0.07, 0.07, 0.003, c, x, y, WALL_Z + 0.006, { noShadow: true }); n.rotation.z = rz; }
}
// the right wall: a tall bookcase, a hanging jacket on a hook
{
  const g = group(room, 1.55, 0, -0.05);
  box(g, 0.28, 1.9, 0.9, 0x4a3420, 0, 0.95, 0, { noShadow: true });
  for (let i = 0; i < 5; i++) {
    box(g, 0.3, 0.025, 0.86, 0x6a4a2c, -0.02, 0.2 + i * 0.4, 0, { noShadow: true });
    const r = rng(60 + i); let z = -0.38; const cols = [0xb8433a, 0x3a6ea8, 0xd8b23a, 0x4f8a5a, 0x8a4fc4, 0xe9e2d0, 0x2f6fb0].map((c) => dull(c, 0.5, 0.5));
    while (z < 0.36) { const w = 0.03 + r() * 0.035, h = 0.18 + r() * 0.14; box(g, 0.2, h, w, cols[Math.floor(r() * cols.length)], -0.05, 0.2 + i * 0.4 + 0.0125 + h / 2, z + w / 2, { noShadow: true }); z += w + 0.004; if (r() < 0.12) z += 0.08; }
  }
  const hook = group(room, 1.6, 1.5, 0.95); box(hook, 0.04, 0.04, 0.04, 0xc9a24a, 0, 0.3, 0, { noShadow: true });
  box(hook, 0.08, 0.5, 0.34, 0x2a3350, -0.02, 0.0, 0, { noShadow: true });
}
// fairy lights along the back wall, lit in any fog
const FAIRY = [];
{
  const strand = (x0, x1, y, sag, n, seed) => { const r = rng(seed); for (let i = 0; i < n; i++) { const u = i / (n - 1), x = lerp(x0, x1, u), yy = y - sag * Math.sin(u * Math.PI); const c = [0xffc070, 0xffd890, 0xffe8b8][Math.floor(r() * 3)]; const b = mesh(room, new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.6), fog: false }), x, yy, WALL_Z + 0.04, { noShadow: true }); FAIRY.push(b); }
    box(room, x1 - x0, 0.003, 0.003, 0x1a1a22, (x0 + x1) / 2, y - sag * 0.5, WALL_Z + 0.035, { noShadow: true }).rotation.z = 0; };
  strand(-1.6, -0.1, 2.36, 0.14, 11, 21); strand(-0.1, 1.5, 2.36, 0.14, 11, 22);
}
// the stand fan of the old room is gone; in its place a small lamp on the desk's far end (off), and a wardrobe behind the lens so a camera that turns round finds a room
{ box(room, 0.9, 1.9, 0.5, 0x4a3a2a, 0.9, 0.95, 3.25); box(room, 0.01, 1.8, 0.01, 0x2a1a0e, 0.9, 0.95, 2.995, { noShadow: true }); for (const s of [-1, 1]) box(room, 0.02, 0.1, 0.02, 0xc9a24a, 0.9 + s * 0.05, 1.0, 2.99, { noShadow: true }); }
// the edge of his bed at the front left, and a rug under the desk
{
  const g = group(room, -1.3, 0, 1.75);
  box(g, 0.8, 0.3, 2.1, 0x5c3d20, 0, 0.15, 0); box(g, 0.78, 0.14, 2.06, 0xd9d2c0, 0, 0.37, 0); box(g, 0.84, 0.75, 0.06, 0x5c3d20, 0, 0.375, -1.06);
  mesh(g, new RoundedBoxGeometry(0.5, 0.1, 0.32, 2, 0.04), mat(0xf2ece0), 0, 0.49, -0.8);
  const kumot = painted(16, 16, (c) => { for (let i = 0; i < 16; i++) { c.fillStyle = ["#c8463c", "#e8dcc0", "#3a6ea8", "#e8dcc0"][i % 4]; c.fillRect(i, 0, 1, 16); } }, { repeat: true });
  const k = tbox(g, 0.7, 0.08, 0.9, kumot, 0.25, 0.03, 0.48, 0.45); k.rotation.y = 0.2; tbox(g, 0.5, 0.1, 0.4, kumot, 0.25, -0.08, 0.53, -0.1).rotation.y = -0.4;
  const rug = painted(24, 16, (c) => { c.fillStyle = "#3a4a7a"; c.fillRect(0, 0, 24, 16); c.fillStyle = "#e8c070"; c.fillRect(1, 1, 22, 1); c.fillRect(1, 14, 22, 1); c.fillRect(1, 1, 1, 14); c.fillRect(22, 1, 1, 14); c.fillStyle = "#c8463c"; for (let i = 0; i < 5; i++) c.fillRect(4 + i * 4, 6, 2, 4); }, { repeat: false, mip: false });
  tbox(room, 1.8, 0.012, 1.3, rug, 1, 0.006, 0.0, 0.5, { noShadow: true });
}

// ================= the desk (a surface), the chair, the books under Claude, what lies about =================
const DK = { x0: -1.05, x1: 0.95, z0: 0.26, z1: 0.8 }, DCX = (DK.x0 + DK.x1) / 2, DCZ = (DK.z0 + DK.z1) / 2, DW = DK.x1 - DK.x0, DD = DK.z1 - DK.z0;
const deskP = makeProp("desk", room, { surface: true }); deskP.g.position.set(DCX, DESK_Y - 0.015, DCZ);
deskP.part(tbox(deskP.g, DW, 0.03, DD, WOODD, 0.45, 0, 0, 0), "box", { h: [DW / 2, 0.015, DD / 2] }); flatSocket(deskP, 0.015); deskP.seen = 1e9;
{
  for (const x of [DK.x0 + 0.04, DK.x1 - 0.04]) for (const z of [DK.z0 + 0.04, DK.z1 - 0.04]) box(room, 0.05, 0.71, 0.05, 0x55381f, x, 0.355, z, { noShadow: true });
  box(room, DW - 0.1, 0.07, 0.02, 0x6a4a2c, DCX, 0.675, DK.z1 - 0.03, { noShadow: true }); box(room, DW - 0.1, 0.4, 0.02, 0x4a3420, DCX, 0.5, DK.z0 + 0.03, { noShadow: true });
  // the chair: a swivel seat turned with him
  const ch = group(room, BUL[0], 0, BUL[2]); ch.rotation.y = BYAW;
  box(ch, 0.42, 0.04, 0.4, 0x3a3f58, 0, 0.44, -0.02); box(ch, 0.4, 0.4, 0.035, 0x3a3f58, 0, 0.78, -0.24); box(ch, 0.05, 0.4, 0.05, 0x20222c, 0, 0.22, -0.02, { noShadow: true });
  for (let a = 0; a < 5; a++) { const arm = box(ch, 0.28, 0.025, 0.04, 0x20222c, 0, 0.03, -0.02, { noShadow: true }); arm.rotation.y = a * 1.2566; arm.translateX(0.14); }
  // sticky notes, a pad, a charger with its cable in a heap, a pencil cup
  box(room, 0.075, 0.016, 0.075, 0xffe066, 0.3, DESK_Y + 0.008, 0.64, { noShadow: true }).rotation.y = 0.3; box(room, 0.075, 0.003, 0.075, 0xff9ac0, 0.22, DESK_Y + 0.002, 0.7, { noShadow: true }).rotation.y = -0.2;
  box(room, 0.06, 0.03, 0.06, 0xf2f2ea, -0.9, DESK_Y + 0.015, 0.7, { noShadow: true });
  for (let i = 0; i < 6; i++) { const c = box(room, 0.09, 0.006, 0.006, 0xe6e6de, -0.8 + Math.cos(i * 1.3) * 0.04, DESK_Y + 0.003, 0.72 + Math.sin(i * 1.7) * 0.03, { noShadow: true }); c.rotation.y = i * 0.9; }
  const cup = group(room, 0.85, DESK_Y, 0.3); mesh(cup, new THREE.CylinderGeometry(0.034, 0.03, 0.08, 10), mat(0x2f8a6f, R), 0, 0.04, 0);
  box(cup, 0.008, 0.14, 0.008, 0xf2c230, -0.01, 0.1, 0.005, { noShadow: true }).rotation.z = 0.2; box(cup, 0.008, 0.13, 0.008, 0xd9412e, 0.012, 0.1, -0.008, { noShadow: true }).rotation.z = -0.25;
  // a small lamp, off, at the desk's back left
  box(room, 0.1, 0.012, 0.1, 0x1a1c26, -0.78, DESK_Y + 0.006, 0.28, { noShadow: true }); box(room, 0.012, 0.26, 0.012, 0x1a1c26, -0.78, DESK_Y + 0.14, 0.28, { noShadow: true });
  mesh(room, new THREE.CylinderGeometry(0.03, 0.075, 0.09, 10), mat(0xe9e0c8, { rim: 0.5 }), -0.78, DESK_Y + 0.3, 0.28, { noShadow: true });
}
// the mug: two rows can be printed on it (KW.mug), seen only in close cameras; it stands at the desk's front left, its label to the lens side
const MUG = { x: -0.15, z: 0.47, yaw: 0.8, k: 1.35 };
const mugTex = painted(96, 40, (g) => { g.fillStyle = "#bdb39a"; g.fillRect(0, 0, 96, 40); g.fillStyle = "#b8403a"; g.fillRect(0, 0, 96, 3); g.fillRect(0, 37, 96, 3); }, { mip: false });
const mugM = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: GRAD, map: mugTex });
{
  const m = group(room, MUG.x, DESK_Y, MUG.z); m.rotation.y = MUG.yaw; m.scale.setScalar(MUG.k);                                                        // its label toward the camera of the laptop close-up
  mesh(m, new THREE.CylinderGeometry(0.042, 0.038, 0.095, 18, 1, true), mat(0x8f8873, { side: 1 }), 0, 0.0475, 0, { noShadow: true });
  mesh(m, new THREE.CylinderGeometry(0.0425, 0.0385, 0.08, 14, 1, true, -1.15, 2.3), mugM, 0, 0.0475, 0, { noShadow: true });   // the printed patch: a wide arc of the front
  mesh(m, new THREE.CylinderGeometry(0.038, 0.038, 0.006, 14), mat(0x8f8873), 0, 0.003, 0, { noShadow: true });
  mesh(m, new THREE.CylinderGeometry(0.039, 0.039, 0.003, 14), mat(0x3a2314), 0, 0.085, 0, { noShadow: true });                  // the coffee
  const h = mesh(m, new THREE.TorusGeometry(0.026, 0.006, 5, 10), mat(0x8f8873), -0.05, 0.05, 0, { noShadow: true }); h.rotation.set(0, Math.PI / 2, 0);
}
// Claude's books: three thick ones, each a different size, a slight turn on each; the layers are wide enough for his four feet at any turn
const RISER_P = makeProp("riser", room, { surface: true }); RISER_P.seen = 1e9;
{
  const layers = [[0.50, 0.088, 0.44, 0x28306a, 0.05, -0.02, 0.01], [0.46, 0.086, 0.42, 0x7a2f3a, -0.06, 0.02, -0.01], [0.44, 0.086, 0.42, 0x2f5a4a, 0.04, -0.01, 0.015]];
  let y = DESK_Y;
  for (const [w, h, d, c, ry, dx, dz] of layers) {
    const g = group(room, CLX + dx, y + h / 2, CLZ + dz); g.rotation.y = ry;
    box(g, w, h - 0.01, d - 0.008, 0x8a826f, 0, 0, -0.002, { noShadow: true }); box(g, w, 0.01, d, c, 0, h / 2 - 0.005, 0, { noShadow: true }); box(g, w, 0.01, d, c, 0, -h / 2 + 0.005, 0, { noShadow: true }); box(g, w, h, 0.008, c, 0, 0, d / 2 - 0.004, { noShadow: true });
    box(g, 0.3, 0.02, 0.003, 0xf6f0d0, -0.04, 0.0, d / 2 + 0.0003, { noShadow: true });
    const n = new THREE.Object3D(); n.position.copy(g.position); n.rotation.y = ry; room.add(n); RISER_P.part(n, "box", { h: [w / 2, h / 2, d / 2] });
    y += h;
  }
  var RISER_TOP = y;
}

// ================= the laptop =================
laptop.visible = false;
const SW = 256, SH = 165;
const scrC = document.createElement("canvas"); scrC.width = SW; scrC.height = SH; const sg = scrC.getContext("2d");
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace; scrT.magFilter = THREE.NearestFilter; scrT.minFilter = THREE.LinearFilter; scrT.generateMipmaps = false;
const lap = makeLaptop(room, { name: "laptop", tex: scrT, k: 1.1, col: 0x565b68 });
lap.screens[0].node.material.fog = false;
lap.open(1.75);
const LW = lap.dim.W, LTH = lap.dim.T, LDP = lap.dim.D;
lap.box(lap.lid, 0.05, 0.0008, 0.05, 0xffe066, -0.085, lap.dim.LT + 0.0005, LDP * 0.7, { detail: true, noShadow: true, mat: {} });       // a sticky note on the lid
const SCT = (rd, s, x, y, col, o = {}) => {                                                                                  // text where a camera can read it whole; a bar of the same size where it cannot
  if (!(ATLAS && ATLAS.ptext)) return;
  if (rd) { ATLAS.ptext(sg, s, x, y, col, o); return; }
  const m = ATLAS.ptext(sg, s, 0, 0, col, Object.assign({}, o, { dry: true })), al = o.align || "left", x0 = al === "center" ? x - m.w / 2 : al === "right" ? x - m.w : x;
  sg.fillStyle = col; sg.globalAlpha = 0.5; sg.fillRect(Math.round(x0), Math.round(y + m.h / 2 - 1), m.w, 2); sg.globalAlpha = 1;
};
function drawEditor(t) {                                                                                                     // the idle screen: an editor, no words, code that scrolls a little
  const g = sg;
  g.fillStyle = "#10121b"; g.fillRect(0, 0, SW, SH); g.fillStyle = "#232638"; g.fillRect(0, 0, SW, 14);
  g.fillStyle = "#ee5f5f"; g.fillRect(5, 5, 4, 4); g.fillStyle = "#f2c230"; g.fillRect(12, 5, 4, 4); g.fillStyle = "#5fd87a"; g.fillRect(19, 5, 4, 4);
  g.fillStyle = "#10121b"; g.fillRect(36, 3, 70, 11);
  g.fillStyle = "#181b28"; g.fillRect(0, 14, 24, SH - 14);
  const r = rng(41), C = ["#c792ea", "#82aaff", "#c3e88d", "#f78c6c", "#e9e6ff"], off = (t * 3) % 10;
  for (let i = -1; i < 14; i++) {
    const y = 20 + i * 10 - off; let x = 30 + (i % 4 === 1 || i % 4 === 2 ? 12 : 0) + (i % 5 === 3 ? 12 : 0);
    g.fillStyle = "#3a4058"; if (y > 15) g.fillRect(8, y + 2, 8, 3);
    for (let k = 0; k < 2 + (((i % 7) + 7) % 3); k++) { const w = 14 + Math.floor(r() * 34); g.fillStyle = C[(((i + k) % 5) + 5) % 5]; if (y > 15 && y < SH - 8) g.fillRect(x, y, w, 5); x += w + 6; }
  }
  if (Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = "#e9e6ff"; g.fillRect(120, 112, 5, 12); }
}
function drawLapScreen(t, rd) {
  if (KW.screen) KW.screen(t, rd, sg); else drawEditor(t);
  scrT.needsUpdate = true;
}
{ drawEditor(0); scrT.needsUpdate = true; }

// ================= Claude and Buloy =================
room.add(C); C.scale.setScalar(CS); C.visible = true; C.position.set(CLX, RISER_TOP + 0.0075, CLZ);
room.add(V); V.position.set(...BUL); V.rotation.y = BYAW; V.visible = true;
vUpper.rotation.order = "YXZ";
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
const bulRig = { vUpper, armL, armR }, BL = armRig(bulRig, 1, "viron"), BR = armRig(bulRig, -1, "viron");
const faceBase = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase };
GRIP.movers.push({ name: "buloy", root: V, person: "viron" }, { name: "claude", root: C, person: "claude" });
const CBASE = Math.atan2(BUL[0] - CLX, BUL[2] - CLZ);                                                                      // Claude faces Buloy
const CSCREEN = Math.atan2(LAP.x - CLX, LAP.z - CLZ) - CBASE;                                                              // how far he turns to face the screen instead (add it to S.yaw, enveloped)

// ================= the lights =================
const screenL = new THREE.PointLight(0xffb878, 0, 2.2, 2.0); screenL.position.set(LAP.x - 0.1, DESK_Y + 0.5, LAP.z + 0.2); room.add(screenL);        // the screen's own light on both faces: warm, red in an error, green when it works
const faceC = new THREE.PointLight(0xdce8ff, 0, 3.2, 2.0); faceC.position.set(BUL[0] - 0.45, 1.55, BUL[2] + 0.95); room.add(faceC);        // a pale cool soft light on his face from the front left, so the warm key never turns his skin to one orange
const lampL = new THREE.PointLight(0xffd8a0, 0, 2.5, 2.0); lampL.position.set(-0.78, DESK_Y + 0.3, 0.3); room.add(lampL);
const NIGHT = { hemiC: [0.2, 0.26, 0.5], hemiG: [0.07, 0.09, 0.2], hemiI: 0.95, exposure: 2.0, wall: [0.3, 0.34, 0.48], floor: [0.34, 0.35, 0.48], screen: 0.8, faceC: 1.1 };

// ================= Buloy's acting: the states an act can name =================
// ACTST[act] = { h: [yaw, pitch, roll] (the eyeline wins at 0.85: these are small), u: [turn, lean] of the upper body, f: the face, hands: a name of HS }. An act without an entry shows IDLE.
const IDLE = { h: [0.0, 0.04, 0], u: [0, 0.1], f: { smile: -0.05, brow: 0.1, gx: 0.4, gy: 0.2, lid: 0.05 }, hands: "rest" };
const ACTST = {};
const _rp = new THREE.Vector3(), _qwi = new THREE.Quaternion(), _lq = new THREE.Vector3(), _lp = new THREE.Vector3(), REST_Y = 0.06;
function lowestOverTable(arm) {                                                                                           // the lowest point of an arm (sleeve, cuff, hand, fingers) over the desk's top, or null when none is near it
  if (!arm.pts) { arm.pts = []; arm.el.traverse((m) => { if (!m.isMesh || !m.geometry.attributes.position) return; const pos = m.geometry.attributes.position, k = Math.max(1, Math.ceil(pos.count / 2500)), a = []; for (let i = 0; i < pos.count; i += k) a.push(pos.getX(i), pos.getY(i), pos.getZ(i)); arm.pts.push([m, a]); }); }
  let low = null;
  for (const [m, a] of arm.pts) for (let i = 0; i < a.length; i += 3) { _lp.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(m.matrixWorld); if (_lp.x > DK.x0 && _lp.x < DK.x1 && _lp.z > DK.z0 && _lp.z < DK.z1 && _lp.y < DESK_Y + 0.12 && (low === null || _lp.y < low)) low = _lp.y; }
  return low;
}
function restOnTable(s) { _rp.set(s * 0.20, 0.255, 0.30); vUpper.localToWorld(_rp); _rp.y = DESK_Y + REST_Y; _rp.z = Math.max(_rp.z, DK.z0 + 0.06); return vUpper.worldToLocal(_rp).clone(); }
const _hp = new THREE.Vector3(), _hf = new THREE.Vector3(), _hpm = new THREE.Vector3(), _qw = new THREE.Quaternion();
// hands, in the upper body's frame: p the wrist target, F where the fingers point, Pm where the palm faces, pose the fingers. s +1 is his left hand (the side Claude and the laptop are on).
const HS = {
  rest:  (s) => ({ p: restOnTable(s), F: v3(0, -0.3, 0.954).applyQuaternion(_qwi.copy(_qw).invert()), Pm: v3(0, -0.954, -0.3).applyQuaternion(_qwi), pose: HAND_POSES.flat }),
  head:  (s) => ({ p: v3(s * 0.21, 0.73, 0.03), F: v3(-s * 0.25, 1, 0.0), Pm: v3(-s, 0, 0.1), pose: HAND_POSES.open }),       // hands up either side of his head: the arm cannot swivel its elbow out, so a hand on the temple would bring the forearm across the face
  shrug: (s) => ({ p: v3(s * 0.34, 0.45, 0.30), F: v3(s * 0.25, 0.55, 1), Pm: v3(0, 1, 0.2), pose: HAND_POSES.open }),
  clasp: (s) => ({ p: v3(s * 0.05, 0.53, 0.36), F: v3(0, 1, 0.55), Pm: v3(-s, 0, 0), pose: HAND_POSES.flat }),
  lift:  (s) => ({ p: v3(s * 0.22, 0.5, 0.26), F: v3(s * 0.1, 0.4, 1), Pm: v3(-s * 0.4, 1, 0.1), pose: HAND_POSES.relaxed }),                 // hands off the desk, a hand's height up, loose: they have left what they were doing
  open:  (s) => (s > 0 ? { p: v3(0.3, 0.52, 0.34), F: v3(0.3, 0.35, 1), Pm: v3(-0.1, 1, 0.1), pose: HAND_POSES.open } : HS.rest(s)),            // his left hand opens toward Claude, palm up; the other stays down
  chest: (s) => (s > 0 ? { p: v3(0.11, 0.47, 0.205), F: v3(-0.85, 0.55, 0.0), Pm: v3(0.0, 0.0, -1), pose: HAND_POSES.flat } : HS.rest(s)),     // a hand flat on his chest
};

// ================= the cameras: none by hand; every shot is a grammar string (docs/cinematography.md) =================
const SET = {
  name: "kwarto",
  mode: () => "kwarto",
  shots: {},
  cine: {
    side: 1,
    pose: "after",
    look: { fog: "#0f1736", key: "#ffb070", keyI: 0.45, rim: "#6c8cff", rimI: 0.8, fogNear: 0.3, fogFar: 2.6 },
    objects: { mug: () => { const c = v3(MUG.x, DESK_Y + 0.05 * MUG.k, MUG.z), n = v3(Math.sin(MUG.yaw), 0, Math.cos(MUG.yaw)); return { c, n, w: 0.1 * MUG.k, h: 0.1 * MUG.k, pts: [[-0.05, -0.05], [0.05, -0.05], [-0.05, 0.05], [0.05, 0.05]].map(([x, y]) => [x * MUG.k, y * MUG.k]).map(([x, y]) => c.clone().add(v3(n.z * x, y, -n.x * x))) }; } },        // insert:mug frames the print
  },
  keys: () => [{ t: 0.02, label: "first-frame" }].concat(LN.filter((l, i) => i % 2 === 0).map((l) => ({ t: l.s + 0.7, label: l.act || ("line" + l.i) }))),
  update(t, ctx) {
    const shot = ctx.shot, vAmp = ampAt("viron", t), cAmp = ampAt("claude", t);
    const rd = /^(duo|insert)/.test(shot) || shot === "two" || shot === "ws";                                           // the cameras that show the screen whole: words only there
    if (!SET._post) { SET._post = { hx: 0, hy: 0, hz: 0, look: 0 }; const af = CINE.after; CINE.after = (...a) => { af(...a); const Q = SET._post; if (Q.look > 0.001) CINE.lookAt("buloy", CINE.objectInfo("laptop").c, 0.9 * Q.look); vHead.rotation.x += Q.hx; vHead.rotation.y += Q.hy; vHead.rotation.z += Q.hz; }; }
    // ---- the night ----
    hemi.color.setRGB(...NIGHT.hemiC); hemi.groundColor.setRGB(...NIGHT.hemiG); hemi.intensity = NIGHT.hemiI;
    duskRim.color.setRGB(0.5, 0.66, 1.0); duskRim.position.set(-4, 5, -7); duskRim.intensity = 0.6; skyFill.intensity = 0;
    RIM.uRimColor.value.setRGB(0.36, 0.52, 1.0); grade.uniforms.uExposure.value = NIGHT.exposure;
    WALLM.color.setRGB(...NIGHT.wall); FLOORM.color.setRGB(...NIGHT.floor);
    FAIRY.forEach((b, i) => { const k = 1.6 * (0.9 + 0.1 * Math.sin(t * 1.7 + i * 1.9)); b.material.color.setRGB(1.0 * k, 0.78 * k, 0.45 * k); });
    // ---- the screen and its light ----
    drawLapScreen(t, rd);
    const sl = KW.screenLight ? KW.screenLight(t) : { c: [1.0, 0.72, 0.47], i: NIGHT.screen };
    screenL.color.setRGB(...sl.c); screenL.intensity = sl.i * (1 + 0.03 * Math.sin(t * 5.1));
    lampL.intensity = 0; faceC.intensity = NIGHT.faceC;
    gripRest(lap, v3(LAP.x, DESK_Y + LTH / 2 + 0.0007, LAP.z), new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), LAP.yaw), deskP);
    if (KW.mug && !SET._mug) { SET._mug = 1; const g = mugTex.image.getContext("2d"); g.fillStyle = "#bdb39a"; g.fillRect(0, 0, 96, 40); g.fillStyle = "#b8403a"; g.fillRect(0, 0, 96, 3); g.fillRect(0, 37, 96, 3); KW.mug.forEach((s, k) => { for (const dx of [0, 1]) ATLAS.ptext(g, s, 47 + dx, 9 + k * 12, "#0e0b12", { font: 5, align: "center", maxWidth: 85 }); }); mugTex.needsUpdate = true; }

    // ---- Buloy: blend the acts' states ----
    const W = {}; let tot = 0;
    for (const k in ACTST) { W[k] = win(actLine(k), t, 0.12, 0.05); tot += W[k]; }
    const first = LN[0] && ACTST[LN[0].act] ? LN[0].act : null;
    if (first && t < LN[0].e) { for (const k in W) W[k] = k === first ? 1 : 0; tot = 1; }                                  // the first line's pose holds from time zero
    const norm = Math.max(1, tot), wI = Math.max(0, 1 - tot / norm);
    let yaw = 0, pitch = 0, roll = 0, tYaw = 0, tLean = 0; const f = { ...faceBase }; const hw = {};
    const addHands = (h, w) => { if (typeof h === "function") { const o = h(t); for (const n in o) hw[n] = (hw[n] || 0) + o[n] * w; } else hw[h] = (hw[h] || 0) + w; };
    const add = (S, w) => { yaw += S.h[0] * w; pitch += S.h[1] * w; roll += S.h[2] * w; tYaw += S.u[0] * w; tLean += S.u[1] * w; for (const key in S.f) f[key] += S.f[key] * w; addHands(S.hands, w); };
    for (const k in ACTST) if (W[k] > 0.0005) add(ACTST[k], W[k] / norm);
    if (wI > 0.0005) add(IDLE, wI);
    f.open = Math.max(f.open, clamp01(vAmp * 1.25)); f.blink = 0;
    const P = SET._post; P.hx = P.hy = P.hz = P.look = 0; if (KW.buloy) KW.buloy(t, P);
    vUpper.rotation.set(tLean + Math.sin(t * 1.3) * 0.008, tYaw, 0); vUpper.position.y = 0.52;
    vHead.rotation.set(pitch + Math.sin(t * 1.13 + 2) * 0.008, yaw + Math.sin(t * 0.7) * 0.012, roll + Math.sin(t * 0.9 + 1) * 0.01);
    const dr = eyeDrift(t);
    Object.assign(bulFace, f); bulFace.gx += dr[0] * 0.3; bulFace.gy += dr[1] * 0.3;
    bulFace.blink = blinkAt(t, 0.8);
    buloy.draw(bulFace);

    // ---- Buloy's hands ----
    V.updateMatrixWorld(true);
    vUpper.getWorldQuaternion(_qw);
    const hands = [[1, armL], [-1, armR]];
    const wsum = Object.values(hw).reduce((a, b) => a + b, 0) || 1;
    const pose = {};
    for (const [s, arm] of hands) {
      _hp.set(0, 0, 0); _hf.set(0, 0, 0); _hpm.set(0, 0, 0); let best = 0, ps = HAND_POSES.relaxed;
      for (const name in hw) { const w = hw[name] / wsum, H = HS[name](s); _hp.addScaledVector(H.p, w); _hf.addScaledVector(H.F, w); _hpm.addScaledVector(H.Pm, w); if (w > best) { best = w; ps = H.pose; } }
      pose[s] = { p: _hp.clone(), F: _hf.clone().applyQuaternion(_qw), Pm: _hpm.clone().applyQuaternion(_qw) };
      reach(bulRig, s, [[0, null]], t, v3(s * 0.2, 0.255, 0.3), [[1, pose[s].p]]);
      arm.H.pose = (hw.rest || 0) / wsum > 0.999 ? mixPose(HAND_POSES.flat, HAND_POSES.relaxed, 0.2 + 0.2 * Math.sin(t * 9 + s)) : ps;           // at rest the fingers tap a little: he types on the desk
    }
    V.updateMatrixWorld(true);
    const turn = (s, arm) => { orientHand(arm.hand, pose[s].F, pose[s].Pm, 1); applyHand(arm.H, handFree(arm.H)); };
    for (const [s, arm] of hands) turn(s, arm);
    V.updateMatrixWorld(true);
    for (const [s, arm] of hands) for (let k = 0; k < 4; k++) {                                                            // nothing of an arm may go into the desk: lift the wrist by what is under it, and put a resting hand down on it
      const low = lowestOverTable(arm); if (low === null) break;
      const d = (hw.rest || 0) / wsum > 0.999 ? DESK_Y + 0.0015 - low : Math.max(0, DESK_Y + 0.0015 - low); if (Math.abs(d) < 0.0006) break;
      arm.hand.getWorldPosition(_lq).y += d; ikRigExact(arm, s, vUpper.worldToLocal(_lq)); V.updateMatrixWorld(true); turn(s, arm); V.updateMatrixWorld(true);
    }

    // ---- Claude: stands on his books, faces Buloy, blinks (the director's eyes); an episode's acts add a little ----
    const S = { yaw: 0, tilt: 0, lean: 0, hop: 0, nubL: null, nubR: null };
    if (KW.claude) KW.claude(t, S);
    const cy = CINE.facing("claude", CBASE, 1.0) + S.yaw;
    C.rotation.set(0, cy + Math.sin(t * 0.7) * 0.01, 0); C.position.y = RISER_TOP + 0.0075 + S.hop;
    cBody.rotation.set(S.lean, 0, S.tilt + Math.sin(t * 0.9) * 0.008); cBody.position.y = 0.085 + cAmp * 0.008 * Math.sin(t * 13);
    cArms[0].position.set(-0.275 + (S.nubR ? S.nubR[0] : 0), 0.13 + cAmp * 0.03 * Math.sin(t * 11) + (S.nubR ? S.nubR[1] : 0), 0.02 + (S.nubR ? S.nubR[2] : 0));
    cArms[1].position.set(0.275 + (S.nubL ? S.nubL[0] : 0), 0.13 + cAmp * 0.03 * Math.sin(t * 11 + 2) + (S.nubL ? S.nubL[1] : 0), 0.02 + (S.nubL ? S.nubL[2] : 0));
    C.updateMatrixWorld(true);
  },
};
