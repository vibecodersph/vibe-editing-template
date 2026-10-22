// ---------- SET: Buloy's room at night, the bulb on (episode 12, "Do Not Delete") ----------
// The room of episode 9 (kwarto.js) with the brownout taken out: the bulb hangs lit over the desk, no candle, no book, the stand fan turning from frame 0.
// World: the lens side is +z, the back wall is at z -0.78. Buloy sits at x -0.30 facing us behind the desk (top y 0.74, x -1.0 .. 0.75, z 0.17 .. 0.77).
// Claude stands on the desk at x 0.30; behind him, a little to the right, stands the monitor, its screen turned a touch toward Buloy and up over Claude's head,
// so one close shot of Claude carries the screen above him. A jalousie window with the moon at the right, a shelf over Buloy, the calendar, the stand fan at the back left.
// The screen is a canvas drawn every frame (drawMon) and carries every number, so no number is spoken. Words are drawn only for cameras near enough to read
// them (TEXT_SHOTS); the wide shot gets big shapes and the two big words of the error. The sticky note AYUSIN BUKAS on the bezel (CK-21) is blank in every other camera.
// Props: the desk (a surface). Nothing is held; his hands go to his head, together, up, or rest on the desk (reach + orientHand, as the earlier sets do).

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0x04060e); scene.fog = null;
RIM.uRimWorld.value.set(0.55, 0.5, -0.67).normalize();                              // the rim comes from the window: moonlight over shoulders and hair

const LN = TL.lines, NO_LINE = { s: 1e9, e: 1e9 }, actLine = (name) => LN.find((l) => l.act === name) || NO_LINE;
const A = {}; for (const n of ["hook","alin","confused","list","old","main","why","april","who","users","please","folder","yes","empty","patay","copy","say","sabi","save","restore","ano","final"]) A[n] = actLine((["hook","confused","old","why","who","please","yes","patay","say","save","ano"].includes(n) ? "b_" : "c_") + n);
const win = (ln, t, pi = 0.2, po = 0.3) => smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3));
const env = (a, b, t, ei = 0.25, eo = 0.3) => smooth((t - a) / ei) * (1 - smooth((t - b) / eo));
const ramp = (a, b, t) => smooth((t - a) / (b - a));
const lerp = (a, b, w) => a + (b - a) * w;
const cutAt = (shot, from) => { const c = TL.shots.find((k) => k.shot === shot && k.t >= from); return c ? c.t : 1e9; };
const X_AX = v3(1, 0, 0), Y_AX = v3(0, 1, 0), Z_AX = v3(0, 0, 1);
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AX, a), qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y_AX, a), qZ = (a) => new THREE.Quaternion().setFromAxisAngle(Z_AX, a);
const HAS = (n) => ASSET.has(n);
const DESK_Y = 0.74, WALL_Z = -0.78, CS = 0.85, BUL = [-0.30, 0, -0.02];

// ================= the room =================
const WALLT = HAS("wall") ? ASSET.tex("wall", { pixel: true, repeat: [1, 1] }) : TEX.plaster("#b4c8ae", "#869c84", 21), WT = HAS("wall") ? 2.2 : 1.3;
const FLOORT = painted(32, 32, (g) => {
  g.fillStyle = "#8a6f58"; g.fillRect(0, 0, 32, 32); g.fillStyle = "#7c624d"; g.fillRect(0, 0, 16, 16); g.fillRect(16, 16, 16, 16);
  g.fillStyle = "#6a523f"; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 32); g.fillRect(16, 0, 1, 32);
  speck(g, rng(5), 32, 32, 40, ["#93785f", "#70573f"]);
}, { repeat: true });
const WOODD = TEX.wood("#8a6238", "#5c3d20", "#a07848", 5), WOODDOOR = TEX.wood("#7a5a3c", "#4f3622", "#8c6a48", 9);
const FLOORM = tbox(room, 3.5, 0.1, 4.5, FLOORT, 0.8, -0.05, -0.05, 1.35, { noShadow: true }).material;
const WALLM = tbox(room, 3.5, 2.7, 0.12, WALLT, WT, -0.05, 1.35, WALL_Z - 0.06, { noShadow: true }).material;                 // the back wall: it takes Buloy's shadow. One material for every wall: update() tints it for the night
tbox(room, 0.12, 2.7, 4.5, WALLT, WT, -1.76, 1.35, 1.35, { noShadow: true });
tbox(room, 0.12, 2.7, 4.5, WALLT, WT, 1.66, 1.35, 1.35, { noShadow: true }).receiveShadow = false;
tbox(room, 3.5, 2.7, 0.12, WALLT, WT, -0.05, 1.35, 3.6, { noShadow: true });
box(room, 3.5, 0.1, 4.5, 0xd9d4c4, -0.05, 2.7, 1.35, { noShadow: true });
box(room, 3.4, 0.1, 0.02, 0x54705e, -0.05, 0.05, WALL_Z + 0.01, { noShadow: true });                                      // the baseboard
// the jalousie window: the night outside, a moon, glass slats
const nightTex = HAS("night") ? ASSET.tex("night", { pixel: true }) : painted(48, 72, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 72); gr.addColorStop(0, "#0c1436"); gr.addColorStop(0.7, "#1d2e5e"); gr.addColorStop(1, "#2a3c72"); g.fillStyle = gr; g.fillRect(0, 0, 48, 72);
  const r = rng(909); for (let i = 0; i < 30; i++) { g.fillStyle = i % 4 ? "#aeb9e6" : "#ffffff"; g.fillRect(Math.floor(r() * 48), Math.floor(r() * 46), 1, 1); }
  g.fillStyle = "#f6f2da"; g.beginPath(); g.arc(34, 16, 5, 0, 7); g.fill();
  g.fillStyle = "#090c1a"; g.fillRect(0, 60, 48, 12);
  for (const [x0, xm, x1, y] of [[-4, 8, 20, 50], [16, 29, 42, 54], [36, 46, 56, 51]]) { g.beginPath(); g.moveTo(x0, 61); g.lineTo(xm, y); g.lineTo(x1, 61); g.fill(); }      // roofs
  g.fillRect(22, 44, 1, 10); g.fillRect(20, 46, 5, 1); g.fillRect(40, 47, 5, 5);                                           // an antenna, a water tank
  g.fillStyle = "#ffb060"; g.fillRect(27, 63, 2, 2);                                                                      // one far window with a candle of its own
}, { mip: false });
const WIN = { x: 0.98, y: 1.6, w: 0.48, h: 0.84 };
{
  const g = group(room, WIN.x, WIN.y, WALL_Z + 0.005);
  box(g, WIN.w + 0.1, WIN.h + 0.1, 0.03, 0x4a3828, 0, 0, 0, { noShadow: true });
  plane(g, WIN.w, WIN.h, new THREE.MeshBasicMaterial({ map: nightTex, color: new THREE.Color(1.0, 1.0, 1.05) }), 0, 0, 0.017);
  if (!HAS("night")) mesh(g, new THREE.CircleGeometry(0.047, 14), mat(0xf6f2da, { glow: 1.7 }), 0.1, 0.204, 0.019, { noShadow: true });
  box(g, 0.03, WIN.h, 0.03, 0x4a3828, 0, 0, 0.03, { noShadow: true });
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) box(g, WIN.w / 2 - 0.03, 0.006, 0.05, 0x9db4c8, s * WIN.w / 4, -WIN.h / 2 + 0.05 + i * (WIN.h - 0.1) / 8, 0.04, { noShadow: true, rim: 1 }).rotation.x = -0.6;
  box(g, WIN.w + 0.16, 0.03, 0.09, 0x4a3828, 0, -WIN.h / 2 - 0.06, 0.04, { noShadow: true });                             // the sill
}
// the shelf over Buloy: a few books, a small pot
{
  const g = group(room, -0.62, 1.84, WALL_Z + 0.1);
  box(g, 0.78, 0.028, 0.2, 0x7a5636, 0, 0, 0); for (const x of [-0.3, 0.3]) box(g, 0.02, 0.12, 0.16, 0x4a3420, x, -0.07, -0.01, { noShadow: true });
  for (const [x, h, c] of [[-0.33, 0.2, 0xb8433a], [-0.29, 0.17, 0x3a6ea8], [-0.25, 0.21, 0xd8b23a], [-0.2, 0.15, 0x4f8a5a]]) box(g, 0.034, h, 0.13, c, x, 0.014 + h / 2, 0, { noShadow: true });
  mesh(g, new THREE.CylinderGeometry(0.035, 0.028, 0.05, 8), mat(0xb5613c), 0.31, 0.04, 0.01); mesh(g, new THREE.SphereGeometry(0.036, 7, 5), mat(0x3f8a4a), 0.31, 0.09, 0.01);
}
// a calendar (a picture and a grid, no words), sticky notes beside it
{
  const cal = painted(32, 44, (g) => {
    g.fillStyle = "#f2ecdc"; g.fillRect(0, 0, 32, 44); g.fillStyle = "#c8382e"; g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#ffd76a"; g.beginPath(); g.arc(23, 7, 3, 0, 7); g.fill(); g.fillStyle = "#7a2a22"; g.beginPath(); g.moveTo(0, 16); g.lineTo(9, 6); g.lineTo(16, 12); g.lineTo(21, 8); g.lineTo(32, 16); g.fill();
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { g.fillStyle = c === 0 ? "#d9685e" : "#9a958a"; g.fillRect(3 + c * 4, 20 + r * 4.5, 2, 2); }
    g.strokeStyle = "#c8382e"; g.lineWidth = 1; g.strokeRect(13.5, 27.5, 5, 5);
    g.fillStyle = "#8a8578"; g.fillRect(15, 0, 2, 2);
  }, { mip: false });
  plane(room, 0.3, 0.41, signMat(cal), -1.26, 1.52, WALL_Z + 0.006);
  for (const [x, y, c, rz] of [[-1.0, 1.36, 0xffe066, 0.08], [-0.93, 1.45, 0xff9ac0, -0.1], [-1.02, 1.5, 0x9fe8a0, 0.05]]) { const n = box(room, 0.07, 0.07, 0.003, c, x, y, WALL_Z + 0.006, { noShadow: true }); n.rotation.z = rz; }
}
// the stand fan at the back left: still in the brownout, it spins up when the power returns
const sfan = group(room, -0.95, 0, -0.42); sfan.rotation.y = 0.85;
let sfanHead, sfanBlades;
{
  mesh(sfan, new THREE.CylinderGeometry(0.19, 0.22, 0.045, 12), mat(0x2f3a4a, R), 0, 0.022, 0); box(sfan, 0.04, 1.12, 0.04, 0xb9c0ca, 0, 0.6, 0, { rim: 0.6 });
  sfanHead = group(sfan, 0, 1.2, 0);
  mesh(sfanHead, new THREE.CylinderGeometry(0.07, 0.07, 0.17, 10), mat(0x2f3a4a, R), 0, 0, -0.07).rotation.x = Math.PI / 2;
  for (const z of [0.0, 0.11]) mesh(sfanHead, new THREE.TorusGeometry(0.235, 0.008, 4, 22), mat(0xc4c8d0, { rim: 0.6 }), 0, 0, z, { noShadow: true });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const w = box(sfanHead, 0.004, 0.235, 0.004, 0xc4c8d0, Math.cos(a) * 0.117, Math.sin(a) * 0.117, 0.11, { noShadow: true }); w.rotation.z = a - Math.PI / 2; }
  sfanBlades = group(sfanHead, 0, 0, 0.055);
  for (let i = 0; i < 3; i++) { const b = group(sfanBlades); b.rotation.z = i * Math.PI * 2 / 3; box(b, 0.085, 0.18, 0.008, 0x6fb0d8, 0, 0.11, 0, { noShadow: true }).rotation.y = 0.35; }
  mesh(sfanBlades, new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), mat(0xe8eaf0), 0, 0, 0, { noShadow: true }).rotation.x = Math.PI / 2;
}
// the bulb that hangs over the desk
const KBULB = [0.05, 2.1, 0.9];
box(room, 0.008, 0.52, 0.008, 0x1a1a20, KBULB[0], KBULB[1] + 0.34, KBULB[2], { noShadow: true }); mesh(room, new THREE.CylinderGeometry(0.022, 0.026, 0.05, 8), mat(0x2a2a30), KBULB[0], KBULB[1] + 0.07, KBULB[2], { noShadow: true });
const bulbOff = mesh(room, new THREE.SphereGeometry(0.05, 8, 6), mat(0x8a8a92, { rim: 0.6 }), KBULB[0], KBULB[1], KBULB[2], { noShadow: true });
const bulbOn = mesh(room, new THREE.SphereGeometry(0.052, 8, 6), mat(0xfff1c8, { glow: 3.4 }), KBULB[0], KBULB[1], KBULB[2], { noShadow: true }); bulbOn.visible = false;

// ================= the desk (a surface), the chair, what lies about =================
const DK = { x0: -1.0, x1: 0.75, z0: 0.17, z1: 0.77 }, DCX = (DK.x0 + DK.x1) / 2, DCZ = (DK.z0 + DK.z1) / 2, DW = DK.x1 - DK.x0, DD = DK.z1 - DK.z0;
const deskP = makeProp("desk", room, { surface: true }); deskP.g.position.set(DCX, DESK_Y - 0.015, DCZ);
deskP.part(tbox(deskP.g, DW, 0.03, DD, WOODD, 0.45, 0, 0, 0), "box", { h: [DW / 2, 0.015, DD / 2] }); flatSocket(deskP, 0.015); deskP.seen = 1e9;
{
  for (const x of [DK.x0 + 0.04, DK.x1 - 0.04]) for (const z of [DK.z0 + 0.04, DK.z1 - 0.04]) box(room, 0.05, 0.71, 0.05, 0x55381f, x, 0.355, z, { noShadow: true });
  box(room, DW - 0.1, 0.07, 0.02, 0x6a4a2c, DCX, 0.675, DK.z1 - 0.03, { noShadow: true });
  const ped = group(room, DK.x0 + 0.2, 0, DCZ); box(ped, 0.36, 0.5, 0.52, 0x6a4a2c, 0, 0.455, 0, { noShadow: true });
  for (const y of [0.33, 0.58]) { box(ped, 0.32, 0.2, 0.01, 0x7e5a38, 0, y, 0.262, { noShadow: true }); box(ped, 0.08, 0.02, 0.02, 0xc9a24a, 0, y, 0.275, { noShadow: true }); }
  // the chair
  box(room, 0.42, 0.04, 0.4, 0x8a6a40, BUL[0], 0.44, BUL[2] - 0.02); box(room, 0.4, 0.4, 0.035, 0x8a6a40, BUL[0], 0.78, BUL[2] - 0.24);
  for (const sx of [-0.18, 0.18]) for (const sz of [-0.19, 0.15]) box(room, 0.04, 0.42, 0.04, 0x5c3d20, BUL[0] + sx, 0.21, BUL[2] + sz, { noShadow: true });
  // a mug with two pencils, a pad of sticky notes, a charger with its cable in a heap (nothing to plug it into)
  const mug = group(room, 0.61, DESK_Y, 0.62); mesh(mug, new THREE.CylinderGeometry(0.04, 0.036, 0.09, 10), mat(0x2f6fb0, R), 0, 0.045, 0); mesh(mug, new THREE.TorusGeometry(0.026, 0.008, 4, 10), mat(0x2f6fb0, R), 0.045, 0.045, 0, { noShadow: true });
  box(mug, 0.008, 0.15, 0.008, 0xf2c230, -0.01, 0.1, 0.005, { noShadow: true }).rotation.z = 0.2; box(mug, 0.008, 0.14, 0.008, 0xd9412e, 0.012, 0.1, -0.008, { noShadow: true }).rotation.z = -0.25;
  box(room, 0.075, 0.016, 0.075, 0xffe066, 0.6, DESK_Y + 0.008, 0.3, { noShadow: true }).rotation.y = 0.3; box(room, 0.075, 0.003, 0.075, 0xff9ac0, 0.52, DESK_Y + 0.002, 0.24, { noShadow: true }).rotation.y = -0.2;
  box(room, 0.06, 0.03, 0.06, 0xf2f2ea, -0.9, DESK_Y + 0.015, 0.68, { noShadow: true });
  for (let i = 0; i < 6; i++) { const c = box(room, 0.09, 0.006, 0.006, 0xe6e6de, -0.8 + Math.cos(i * 1.3) * 0.04, DESK_Y + 0.003, 0.69 + Math.sin(i * 1.7) * 0.03, { noShadow: true }); c.rotation.y = i * 0.9; }
}


// ================= the monitor (the stake) =================
// The panel stands on the desk at the right, behind Claude, its screen a little toward Buloy. Its picture is a canvas drawn every frame.
const MON = { x: 0.40, z: 0.20, cy: 1.37, w: 0.62, h: 0.40, yaw: -0.22 };
const monG = group(room, MON.x, 0, MON.z); monG.rotation.y = MON.yaw;
box(monG, 0.22, 0.02, 0.15, 0x2a2a30, 0, DESK_Y + 0.01, 0);
box(monG, 0.05, MON.cy - MON.h / 2 - DESK_Y, 0.04, 0x2a2a30, 0, DESK_Y + (MON.cy - MON.h / 2 - DESK_Y) / 2, -0.03);
box(monG, MON.w, MON.h, 0.04, 0x202026, 0, MON.cy, -0.02);
const SW = 192, SH = 120;
const scrC = document.createElement("canvas"); scrC.width = SW; scrC.height = SH; const sg = scrC.getContext("2d");
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace; scrT.magFilter = THREE.NearestFilter; scrT.minFilter = THREE.LinearFilter; scrT.generateMipmaps = false;
plane(monG, MON.w - 0.05, (MON.w - 0.05) * SH / SW, new THREE.MeshBasicMaterial({ map: scrT, color: new THREE.Color(1.2, 1.2, 1.2) }), 0, MON.cy, 0.002);
box(monG, 0.02, 0.012, 0.004, 0x4dff7a, MON.w / 2 - 0.03, MON.cy - MON.h / 2 + 0.012, 0.001, { glow: 1.6, noShadow: true });                // the power light
// the sticky note on the bezel's left edge (CK-21): the words only where the camera can read them
const noteDraw = (words) => painted(28, 28, (g) => {
  g.fillStyle = "#ffe066"; g.fillRect(0, 0, 28, 28); g.fillStyle = "#e8c63e"; g.fillRect(0, 25, 28, 3);
  if (words && ATLAS && ATLAS.ptext) { ATLAS.ptext(g, "AYUSIN", 14, 6, "#5a3a00", { font: 3, align: "center" }); ATLAS.ptext(g, "BUKAS", 14, 14, "#5a3a00", { font: 3, align: "center" }); g.fillStyle = "#5a3a00"; g.fillRect(5, 21, 18, 1); }
  else { g.fillStyle = "#b8962a"; g.fillRect(5, 7, 18, 2); g.fillRect(7, 14, 14, 2); g.fillRect(5, 21, 18, 1); }
}, { mip: false });
const noteTexW = noteDraw(true), noteTexB = noteDraw(false);
const noteM = new THREE.MeshBasicMaterial({ map: noteTexB, color: new THREE.Color(0.95, 0.95, 0.95) });
const note = plane(monG, 0.088, 0.088, noteM, -MON.w / 2 + 0.034, MON.cy + 0.075, 0.003); note.rotation.z = 0.07;
const TEXT_SHOTS = { d_claude: 1, d_screen: 1 };                                                                              // the cameras near enough to read the small words; every other one gets them as bars

const SCT = (rd, s, x, y, col, o = {}) => {                                                                                  // text where it can be read; a bar of the same size where it cannot
  if (!(ATLAS && ATLAS.ptext)) return;
  if (rd || o.big) { ATLAS.ptext(sg, s, x, y, col, o); return; }
  const m = ATLAS.ptext(sg, s, 0, 0, col, Object.assign({}, o, { dry: true })), al = o.align || "left", x0 = al === "center" ? x - m.w / 2 : al === "right" ? x - m.w : x;
  sg.fillStyle = col; sg.globalAlpha = 0.55; sg.fillRect(Math.round(x0), Math.round(y + m.h / 2 - 1), m.w, 2); sg.globalAlpha = 1;
};
const dbIcon = (x, y, col) => { sg.fillStyle = col; sg.fillRect(x, y + 1, 9, 2); sg.fillRect(x, y + 4, 9, 2); sg.fillRect(x, y + 7, 9, 2); sg.fillRect(x - 1, y + 2, 1, 6); sg.fillRect(x + 9, y + 2, 1, 6); };
function drawMon(t, rd) {
  const g = sg, flick = 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3), pulse = Math.floor(t * 2.4) % 2 === 0;
  const tList = A.list.s - 0.05, tOld = A.old.s - 0.02, tUsers = A.users.s - 0.05, tBank = A.folder.s - 0.05, tCopy = A.copy.s - 0.05, tRest = A.restore.s - 0.05, tFin = A.final.s - 0.05;
  if (t < tList) {                                                                                                          // frame 0: the error
    g.fillStyle = pulse ? "#3a0a0c" : "#2a0608"; g.fillRect(0, 0, SW, SH);
    g.fillStyle = pulse ? "#ff3b3b" : "#a82424"; g.fillRect(0, 0, SW, 3); g.fillRect(0, SH - 3, SW, 3); g.fillRect(0, 0, 3, SH); g.fillRect(SW - 3, 0, 3, SH);
    g.fillStyle = "#ff5a4a"; for (let i = 0; i < 9; i++) { g.fillRect(14 + i, 20 + i, 2, 2); g.fillRect(24 - i, 20 + i, 2, 2); }                          // an X
    SCT(rd, "ERROR 404", 100, 17, "#ffb0a8", { font: 5, scale: 1, align: "center", big: true });
    SCT(rd, "DATABASE:", 96, 40, "#ffe9e6", { font: 5, scale: 2, align: "center", big: true });
    SCT(rd, "NOT FOUND", 96, 62, pulse ? "#ff4a3d" : "#d63a30", { font: 5, scale: 3, align: "center", big: true });
    g.fillStyle = "#7a1a1a"; g.fillRect(14, 96, 164, 4); g.fillStyle = "#ff4a3d"; g.fillRect(14, 96, 36 + Math.floor(20 * (0.5 + 0.5 * Math.sin(t * 3))), 4);
  } else {
    g.fillStyle = "#0e1019"; g.fillRect(0, 0, SW, SH);
    g.fillStyle = "#1c2030"; g.fillRect(0, 0, SW, 10); g.fillStyle = "#ee5f5f"; g.fillRect(3, 3, 3, 3); g.fillStyle = "#f2c230"; g.fillRect(8, 3, 3, 3); g.fillStyle = "#5fd87a"; g.fillRect(13, 3, 3, 3);
    const bank = t >= tBank && t < tCopy;
    SCT(rd, bank ? "/BACKUP" : "/VAR/DATA", 24, 3, "#8c94b8", { font: 3 });
    if (bank) {                                                                                                             // the folder `backup`, opened, empty
      g.fillStyle = "#e8b83a"; g.fillRect(70, 26, 18, 6); g.fillRect(70, 30, 52, 30); g.fillStyle = "#f6d266"; g.fillRect(72, 34, 48, 24);
      g.fillStyle = "#3a2c08"; g.fillRect(84, 44, 20, 2);
      SCT(rd, "BACKUP", 96, 68, "#e9e6ff", { font: 5, scale: 1, align: "center", big: true });
      SCT(rd, "0 ITEMS", 96, 82, "#9fb4ff", { font: 5, scale: 2, align: "center", big: true });
    } else {
      const rows = [["PRODUCTION", 0], ["PRODUCTION-OLD-DO-NOT-DELETE", 1]];
      if (t >= tCopy) rows.push(["PRODUCTION-OLD-DO-NOT-DELETE-FINAL", 2]);
      rows.forEach(([name, k], i) => {
        const y = 16 + i * 15, deleted = k === 1 && t >= tOld, hi = k === 2 && t >= tFin, fresh = k === 2 ? clamp01((t - tCopy) / 0.3) : 1;
        g.fillStyle = hi ? "#ffd65a" : deleted ? "#14151e" : "#1a1e2e"; g.fillRect(4, y, SW - 8, 13);
        if (hi) { g.fillStyle = "#fff3c0"; g.fillRect(4, y, SW - 8, 1); g.fillRect(4, y + 12, SW - 8, 1); }
        dbIcon(9, y + 2, hi ? "#5a3a00" : deleted ? "#4a4e66" : "#7fd8a6");
        SCT(rd, name, 23, y + 4, hi ? "#3a2400" : deleted ? "#5a5f78" : "#e9e6ff", { font: 3 });
        if (deleted) {
          const w = ATLAS.ptext(sg, name, 0, 0, "#000", { font: 3, dry: true }).w; g.fillStyle = "#6a6f88"; g.fillRect(23, y + 6, w, 1);
          SCT(rd, "DELETED", SW - 8, y + 4, "#ff5a4a", { font: 3, align: "right" });
        } else if (k === 2) SCT(rd, "TUE", SW - 8, y + 4, hi ? "#3a2400" : "#ffd65a", { font: 3, align: "right" });
        else SCT(rd, "LIVE", SW - 8, y + 4, "#5fd87a", { font: 3, align: "right" });
        if (k === 2 && fresh < 1) { g.fillStyle = "#0e1019"; g.fillRect(4 + Math.floor((SW - 8) * fresh), y, SW - 8, 13); }
      });
      if (t >= tRest) {                                                                                                     // the restore bar
        const p = t >= tFin ? 1 : lerp(0.06, 0.9, clamp01((t - tRest) / Math.max(0.5, A.ano.e - tRest)));
        SCT(rd, t >= tFin ? "RESTORED" : "RESTORING...", 12, 70, t >= tFin ? "#5fd87a" : "#9fb4ff", { font: 5, scale: 1, big: true });
        g.fillStyle = "#222840"; g.fillRect(12, 84, SW - 24, 12); g.fillStyle = t >= tFin ? "#5fd87a" : "#7b9bff"; g.fillRect(14, 86, Math.floor((SW - 28) * p), 8);
        g.fillStyle = "#14182a"; for (let x = 20; x < SW - 14; x += 8) g.fillRect(x, 86, 1, 8);
      }
    }
    if (t >= tUsers) {                                                                                                      // USERS ONLINE: 900, red and blinking
      if (t < tBank) {
        g.fillStyle = pulse ? "#e02424" : "#7a1212"; g.fillRect(4, 50, SW - 8, 62);
        SCT(rd, "USERS ONLINE:", 96, 56, "#fff1ee", { font: 5, scale: 2, align: "center", big: true });
        SCT(rd, "900", 96, 78, pulse ? "#ffffff" : "#ffc9c2", { font: 5, scale: 4, align: "center", big: true });
      } else {
        g.fillStyle = pulse ? "#c41e1e" : "#5c1010"; g.fillRect(0, SH - 12, SW, 12);
        SCT(rd, "USERS ONLINE: 900", 96, SH - 9, "#fff1ee", { font: 3, align: "center" });
      }
    }
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = "#e9e6ff"; g.fillRect(SW - 10, SH - 22, 5, 8); }                         // a cursor that blinks: something moves
  }
  scrT.needsUpdate = true;
}

// ================= Claude, Buloy =================
room.add(C); C.scale.setScalar(CS); C.visible = true; C.position.set(0.30, DESK_Y, 0.46);
room.add(V); V.position.set(...BUL); V.rotation.y = 0; V.visible = true;
vUpper.rotation.order = "YXZ";
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
const bulRig = { vUpper, armL, armR }, BL = armRig(bulRig, 1, "viron");
const faceBase = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase };

// ================= the lights =================
const faceL = new THREE.PointLight(0xffe8d0, 0, 2.8, 1.5); faceL.position.set(-0.05, 1.22, 1.15); room.add(faceL);              // in his close shot a soft light from the lens side keeps the face a face
const fillL = new THREE.PointLight(0xffc48a, 0, 5.5, 1.4); room.add(fillL);
const bulbL = new THREE.PointLight(0xfff1d6, 0, 11, 1.3); bulbL.position.set(KBULB[0], KBULB[1] - 0.06, KBULB[2]); room.add(bulbL);
const monL = new THREE.PointLight(0xff3a2a, 0, 3.4, 2.0); monL.position.set(0.30, 1.36, 0.8); room.add(monL);                   // the screen's own light on the faces: red for the error, then pale
bulbOn.visible = true; bulbOff.visible = false;

// ================= acting tables =================
// Per act: the head [yaw, pitch, roll], the upper body [turn, lean], the face, the hands. Yaw + turns him toward +x (the monitor, Claude). Weights are normalised;
// an act the table does not name (Claude's lines, where Buloy is off camera) shows the idle state.
const IDLE = { h: [0.4, 0.06, 0], u: [0.1, 0.1], f: { smile: -0.1, brow: 0.1, gx: 0.4, gy: 0.2, lid: 0.05 }, hands: "rest" };
const ACTST = {
  hook:     { h: [0.10, 0.14, 0.0], u: [0.0, 0.08], f: { sad: 0.75, brow: -0.6, smile: -0.5, lid: 0.12, gx: 0.0, gy: 0.05, wet: 0.5, open: 0.3 }, hands: "head" },
  alin:     { h: [0.55, 0.10, 0.04], u: [0.15, 0.07], f: { sad: 0.75, brow: -0.6, smile: -0.45, lid: 0.15, gx: 0.6, gy: 0.05, wet: 0.5 }, hands: "head" },
  confused: { h: [0.28, 0.10, 0.12], u: [0.08, 0.24], f: { brow: 0.9, lid: -0.45, smile: -0.35, gx: 0.45, gy: 0.0, sad: 0.15 }, hands: "shrug" },
  list:     { h: [0.7, 0.04, 0.0], u: [0.22, 0.14], f: { brow: 0.5, lid: -0.2, smile: -0.25, gx: 0.7, gy: 0.3 }, hands: "rest" },
  old:      { h: [0.22, 0.16, -0.06], u: [0.08, 0.2], f: { brow: -0.55, sad: 0.65, smile: -0.45, lid: 0.12, gx: 0.3, gy: 0.2 }, hands: "rest" },
  main:     { h: [0.5, 0.04, 0.0], u: [0.2, 0.1], f: { brow: 0.95, lid: -0.65, smile: -0.25, gx: 0.55, gy: 0.0 }, hands: "rest" },
  why:      { h: [0.25, 0.04, 0.1], u: [0.08, 0.2], f: { brow: 0.7, anger: 0.4, lid: -0.15, smile: -0.4, gx: 0.3, gy: 0.0, open: 0.1 }, hands: "shrug" },
  april:    { h: [0.3, 0.3, 0.08], u: [0.1, 0.2], f: { brow: -0.25, sad: 0.35, smile: 0.12, cheek: 0.2, lid: 0.2, gx: 0.1, gy: 0.8 }, hands: "rest" },
  who:      { h: [0.2, 0.10, 0.0], u: [0.08, 0.22], f: { brow: -0.5, sad: 0.55, smile: -0.45, gx: 0.2, gy: 0.1 }, hands: "rest" },
  users:    { h: [0.7, -0.04, 0.0], u: [0.2, 0.12], f: { brow: 0.95, lid: -0.7, smile: -0.5, gx: 0.7, gy: 0.0, open: 0.35 }, hands: "rest" },
  please:   { h: [0.40, -0.02, 0.06], u: [0.12, 0.12], f: { brow: -0.65, sad: 0.75, smile: -0.2, lid: -0.1, gx: 0.4, gy: 0.0, wet: 0.4 }, hands: "clasp" },
  folder:   { h: [0.7, -0.02, 0.0], u: [0.2, 0.1], f: { brow: 0.45, smile: 0.18, lid: -0.1, gx: 0.7, gy: 0.0 }, hands: "clasp" },
  yes:      { h: [0.15, -0.14, 0.0], u: [0.0, 0.0], f: { smile: 0.95, cheek: 0.85, brow: 0.9, lid: -0.25, gx: 0.2, gy: -0.1 }, hands: "up" },
  empty:    { h: [0.55, 0.0, 0.0], u: [0.15, 0.05], f: { smile: 0.35, brow: 0.4, lid: -0.2, gx: 0.6, gy: 0.0 }, hands: "up" },
  patay:    { h: [0.12, 0.40, 0.0], u: [0.0, 0.34], f: { sad: 0.95, brow: -0.65, smile: -0.5, lid: 0.45, gx: 0.0, gy: 0.9 }, hands: "rest" },
  copy:     { h: [0.3, 0.22, 0.0], u: [0.1, 0.22], f: { sad: 0.6, brow: -0.2, smile: -0.2, lid: 0.2, gx: 0.45, gy: 0.4 }, hands: "rest" },
  say:      { h: [0.3, 0.16, 0.14], u: [0.1, 0.32], f: { brow: 0.95, lid: -0.5, smile: -0.3, gx: 0.5, gy: 0.0, sad: 0.0, open: 0.1 }, hands: "shrug" },
  sabi:     { h: [0.55, 0.06, 0.04], u: [0.18, 0.2], f: { brow: 0.55, lid: -0.2, smile: 0.2, cheek: 0.2, gx: 0.6, gy: 0.0 }, hands: "rest" },
  save:     { h: [0.62, -0.06, 0.0], u: [0.3, 0.06], f: { smile: 1.0, cheek: 0.9, brow: 0.95, lid: -0.3, gx: 0.7, gy: 0.0 }, hands: "save" },
  restore:  { h: [0.5, 0.02, 0.0], u: [0.15, 0.12], f: { smile: 0.45, cheek: 0.3, brow: 0.3, gx: 0.6, gy: 0.0 }, hands: "rest" },
  ano:      { h: [0.30, 0.04, 0.07], u: [0.1, 0.18], f: { brow: 0.6, smile: 0.1, lid: 0.0, gx: 0.35, gy: 0.0, open: 0.05 }, hands: "rest" },
  final:    { h: [0.4, 0.05, 0.0], u: [0.1, 0.16], f: { brow: 0.9, lid: -0.5, smile: -0.2, gx: 0.5, gy: 0.0 }, hands: "rest" },
};
// hands, in the upper body's frame: p the wrist target, F where the fingers point, Pm where the palm faces, pose the fingers
const HS = {
  rest:  (s) => ({ p: v3(s * 0.20, 0.255, 0.30), F: v3(0, 0, 1), Pm: v3(0, -1, 0), pose: HAND_POSES.flat }),
  head:  (s) => ({ p: v3(s * 0.155, 0.70, 0.0), F: v3(-s * 0.5, 1, 0.05), Pm: v3(-s, 0, 0.05), pose: HAND_POSES.open }),
  shrug: (s) => ({ p: v3(s * 0.34, 0.45, 0.30), F: v3(s * 0.25, 0.55, 1), Pm: v3(0, 1, 0.2), pose: HAND_POSES.open }),
  clasp: (s) => ({ p: v3(s * 0.05, 0.53, 0.36), F: v3(0, 1, 0.55), Pm: v3(-s, 0, 0), pose: HAND_POSES.flat }),
  up:    (s) => ({ p: v3(s * 0.30, 0.93, 0.12), F: v3(s * 0.15, 1, 0.1), Pm: v3(0, 0, 1), pose: HAND_POSES.open }),
  save:  (s) => (s > 0 ? { p: v3(0.40, 0.64, 0.32), F: v3(0.85, -0.12, 0.5), Pm: v3(0, -1, 0), pose: HAND_POSES.point } : { p: v3(-0.30, 0.95, 0.10), F: v3(-0.1, 1, 0.1), Pm: v3(0, 0, 1), pose: HAND_POSES.fist }),
};
const _hp = new THREE.Vector3(), _hf = new THREE.Vector3(), _hpm = new THREE.Vector3(), _qw = new THREE.Quaternion();

// ================= the cameras =================
const SHOTS_DB = {
  d_hook:   { p: [0.24, 1.2, 2.9], l: [0.10, 1.12, 0.2], fov: 50, d: [-0.006, -0.01, -0.13], cap: 1385 },                      // frame 0: the whole desk, the red screen, the fan turning, Buloy with his hands on his head
  d_buloy:  { p: [0.02, 1.16, 1.95], l: [-0.30, 1.13, 0.0], fov: 36, d: [-0.003, 0, -0.02], cap: 1385 },                          // Buloy from the desk's front: his face and both arms
  d_claude: { p: [0.26, 1.1, 2.05], l: [0.34, 1.06, 0.3], fov: 40, d: [0.003, 0, -0.02], cap: 1345 },                            // Claude with the monitor over his head: the screen is readable here
  d_screen: { p: [0.46, 1.38, 2.2], l: [0.48, 1.37, 0.2], fov: 32, d: [0.002, 0, -0.012], cap: 1385 },                            // the screen alone
  d_two:    { p: [0.16, 1.22, 2.95], l: [0.10, 1.10, 0.2], fov: 54, d: [0, 0, -0.03], cap: 1385 },                                   // both of them and the monitor
};

const SET = {
  name: "dbnight",
  shots: SHOTS_DB,
  keys: () => [{ t: 0.02, label: "first-frame" }, { t: A.confused.s + 0.8, label: "confused" }, { t: A.users.s + 0.9, label: "users-online" }, { t: A.yes.s + 0.5, label: "arms-up" }, { t: A.patay.s + 0.8, label: "slumped" }, { t: A.save.s + 0.9, label: "pointing" }, { t: A.final.s + 0.8, label: "final-name" }],
  update(t, ctx) {
    laptop.visible = false;
    const shot = ctx.shot, vAmp = ampAt("viron", t), cAmp = ampAt("claude", t);
    // ---- the light: a lit room at night ----
    hemi.color.setRGB(0.92, 0.9, 0.88); hemi.groundColor.setRGB(0.42, 0.38, 0.38); hemi.intensity = 0.78;
    duskRim.color.setRGB(0.5, 0.66, 1.0); duskRim.position.set(4, 5, -7); duskRim.intensity = 0.28; skyFill.intensity = 0;
    RIM.uRimColor.value.setRGB(0.4, 0.5, 0.9); grade.uniforms.uExposure.value = 0.95;
    WALLM.color.setRGB(0.8, 0.78, 0.74); FLOORM.color.setRGB(0.82, 0.8, 0.8);
    bulbL.intensity = 8.0 * (1 + 0.012 * Math.sin(t * 190));
    const err = t < A.list.s - 0.05;
    monL.color.setRGB(err ? 1.0 : 0.7, err ? 0.22 : 0.82, err ? 0.16 : 1.0); monL.intensity = err ? 1.6 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3) : 0.9;
    faceL.intensity = shot === "d_buloy" ? 0.55 : 0; fillL.position.set(0.2, 1.42, 1.5); fillL.intensity = 0.5;
    // the fan turns from frame 0, and nods
    sfanBlades.rotation.z = t * 16; sfanHead.rotation.y = 0.5 * Math.sin(t * 0.9 + 1.2);
    // the screen and the sticky note
    drawMon(t, !!TEXT_SHOTS[shot]); noteM.map = TEXT_SHOTS[shot] ? noteTexW : noteTexB;

    // ---- Buloy: blend the acts' states ----
    const W = {}; let tot = 0;
    for (const k in ACTST) { W[k] = win(A[k], t, 0.12, 0.05); tot += 0; }
    W.hook = t < A.hook.e ? 1 : W.hook;                                                                                         // the first pose holds from time zero
    W.final = smooth((t - (A.final.s - 0.12)) / 0.25);
    tot = 0; for (const k in W) tot += W[k];
    const norm = Math.max(1, tot), wI = Math.max(0, 1 - tot / norm);
    let yaw = 0, pitch = 0, roll = 0, tYaw = 0, tLean = 0; const f = { ...faceBase }; const hw = {};
    const add = (S, w) => { yaw += S.h[0] * w; pitch += S.h[1] * w; roll += S.h[2] * w; tYaw += S.u[0] * w; tLean += S.u[1] * w; for (const key in S.f) f[key] += S.f[key] * w; hw[S.hands] = (hw[S.hands] || 0) + w; };
    for (const k in ACTST) if (W[k] > 0.0005) add(ACTST[k], W[k] / norm);
    if (wI > 0.0005) add(IDLE, wI);
    f.open = Math.max(f.open, clamp01(vAmp * 1.25)); f.blink = 0;
    const jig = (W.hook + W.save) * 0.01 * Math.sin(t * 11);
    vUpper.rotation.set(tLean + Math.sin(t * 1.3) * 0.008, tYaw, 0); vUpper.position.y = 0.52 - 0.02 * W.patay + 0.012 * W.yes;
    vHead.rotation.set(pitch + Math.sin(t * 1.13 + 2) * 0.008 + 0.012 * Math.sin(t * 8.5) * W.hook, yaw + Math.sin(t * 0.7) * 0.012, roll + Math.sin(t * 0.9 + 1) * 0.01 + jig);
    const dr = eyeDrift(t);
    Object.assign(bulFace, f); bulFace.gx += dr[0] * 0.3; bulFace.gy += dr[1] * 0.3;
    bulFace.blink = Math.max(blinkAt(t, 0.8), Math.exp(-(((t - 0.1) / 0.06) ** 2)) * 0, W.patay > 0.5 ? 0.5 : 0);
    buloy.draw(bulFace);

    // ---- Buloy's hands ----
    V.updateMatrixWorld(true);
    vUpper.getWorldQuaternion(_qw);
    const hands = [[1, armL], [-1, armR]];
    const wsum = Object.values(hw).reduce((a, b) => a + b, 0) || 1;
    for (const [s, arm] of hands) {
      _hp.set(0, 0, 0); _hf.set(0, 0, 0); _hpm.set(0, 0, 0); let best = 0, pose = HAND_POSES.relaxed;
      for (const name in hw) { const w = hw[name] / wsum, H = HS[name](s); _hp.addScaledVector(H.p, w); _hf.addScaledVector(H.F, w); _hpm.addScaledVector(H.Pm, w); if (w > best) { best = w; pose = H.pose; } }
      reach(bulRig, s, [[0, null]], t, v3(s * 0.2, 0.255, 0.3), [[1, _hp]]);
      arm.H.pose = pose;
    }
    V.updateMatrixWorld(true);
    for (const [s, arm] of hands) {
      _hf.set(0, 0, 0); _hpm.set(0, 0, 0);
      for (const name in hw) { const w = hw[name] / wsum, H = HS[name](s); _hf.addScaledVector(H.F, w); _hpm.addScaledVector(H.Pm, w); }
      orientHand(arm.hand, _hf.applyQuaternion(_qw), _hpm.applyQuaternion(_qw), 1);
    }
    V.updateMatrixWorld(true);

    // ---- Claude: deadpan, bobbing a little as he speaks; the eyes are flat dashes when he is at his driest ----
    const cSpeak = Math.max(W.hook * 0, win(A.alin, t, 0.1, 0.1), win(A.list, t, 0.1, 0.1), win(A.main, t, 0.1, 0.1), win(A.april, t, 0.1, 0.1), win(A.users, t, 0.1, 0.1), win(A.folder, t, 0.1, 0.1), win(A.empty, t, 0.1, 0.1), win(A.copy, t, 0.1, 0.1), win(A.sabi, t, 0.1, 0.1), win(A.restore, t, 0.1, 0.1), win(A.final, t, 0.1, 0.1));
    const cy = lerp(-0.5, -0.1, cSpeak);
    C.rotation.set(0, cy + Math.sin(t * 0.7) * 0.012, 0);
    C.position.y = DESK_Y + Math.abs(Math.sin((t - A.restore.s) * 9)) * 0.02 * env(A.restore.s - 0.05, A.restore.s + 0.5, t, 0.05, 0.2);
    cBody.rotation.set(-0.02 - 0.05 * cSpeak, 0, Math.sin(t * 0.9) * 0.01); cBody.position.y = 0.085 + cAmp * 0.008 * Math.sin(t * 13);
    const dash = Math.max(win(A.main, t, 0.1, 0.1), win(A.april, t, 0.1, 0.1) * 0.8, win(A.empty, t, 0.1, 0.1), win(A.sabi, t, 0.1, 0.1), win(A.final, t, 0.1, 0.1));
    const lookX = -0.01 + 0.012 * (1 - cSpeak), slow = 1 - blinkAt(t, 1.3, 3.7) * 0.9;
    cEyes.forEach((e, i) => { e.visible = true; e.scale.y = lerp(0.08 * slow, 0.012, dash); e.scale.x = lerp(0.04, 0.062, dash); e.position.set((i ? 1 : -1) * 0.14 + lookX, 0.2, 0.121); });
    cArms[0].position.set(-0.275, 0.13 + cAmp * 0.03 * Math.sin(t * 11), 0.02); cArms[1].position.set(0.275, 0.13 + cAmp * 0.03 * Math.sin(t * 11 + 2), 0.02);
    C.updateMatrixWorld(true);
  },
};
