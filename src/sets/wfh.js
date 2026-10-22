// ---------- SET: Buloy's room by day, a work-from-home morning (episode 10, "Pina-attend Ko si Claude") ----------
// The room of episode 9 (kwarto.js) in daylight, laid out afresh so one tall frame can hold the bed, the desk and the meeting.
// World: the lens side is +z, the back wall is at z -0.62. The bed runs along z at the left (headboard at the back wall, foot toward the lens);
// Buloy lies in it propped on two pillows, so his face is upright to a camera at the foot of the room. The desk stands along the bed's right side,
// from his hips to past his feet. On it: a tall round stand with the laptop, its screen turned toward the lens and away from the pillow, and Claude,
// who stands in front of the screen in Buloy's headset. The sun comes in low through the jalousie on the back wall and lays its slats across the desk.
// Same contract as the other sets: SET.shots (cameras), SET.keys() and SET.update(t, ctx), a pure function of time.
//
// Why this layout (worth knowing before anyone moves the furniture):
//   - the laptop has its back to the pillow, so the boss cannot see him until Claude turns it (line 6); the turn is about 70 degrees;
//   - Claude is nearer the lens than Buloy's head: from the foot of the room Claude is low, the screen sits over his head and Buloy's face is high,
//     and when Buloy sits up and looks at the desk his face comes toward the lens;
//   - the price is that Claude at work shows the lens his back. His face is shot from the right of the room (to the screen), from over the
//     headboard (his look at the sleeper) or from the bed's side (to Buloy).
//   A desk beside the pillow shows Claude's face in frame 0 but leaves Buloy with the laptop behind him for the rest of the film.
//
// The props, all solid, all on the grip system (47-grip.js):
//   laptop   on the stand; pushed round by Claude's left nub on its near corner, then it runs on by itself and settles facing the bed
//   headset  Buloy's: stretched wide over Claude's block from frame 0, lifted off by both nubs on its ear cups (line 8), taken by Buloy's
//            left hand by its band, on Buloy's head from the cut into line 9 to the end. The band is elastic: wide and low on Claude, narrow and tall on Buloy
//   kumot    the blanket: it always lies on the bed; Buloy's hands pull it by its rolled hem
// The words on the set are all on the laptop's screen: BOSS, BULOY, NOTES, SABADO: BULOY. A camera that cannot read them is given the screen in shapes only (TEXT_SHOTS).
//
// What is simplified, on purpose:
//   - the laptop is pushed for its first half radian only; a nub cannot follow it round without Claude standing in front of the screen, so it runs on and settles;
//   - Claude changes where he stands at two cuts, never in a shot: to the bed's edge of the desk for the headset (C_GIVE), then beside the turned laptop (C_SIDE);
//   - the blanket is drawn solid but only its hems and its foot are colliders (a body is inside it by design); clutched to his chest its far corner
//     dips into the edge of the desk, behind the blanket itself from every camera;
//   - his sleeves are not drawn while his arms are under the blanket (the end) or behind it (the laptop's own lens): only the fingers over the hem;
//   - the clock follows the script's sound cues where there is one: the snore, the swivel, the typing (the taps last as long as the typing sound).

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0xbfd9ee); scene.fog = null;

const LN = TL.lines, NO_LINE = { s: 1e9, e: 1e9 }, actLine = (name) => LN.find((l) => l.act === name) || NO_LINE;
const A = { send: actLine("b_send"), ask: actLine("m_ask"), dunno: actLine("c_dunno"), hiss: actLine("b_hiss"), notmine: actLine("c_notmine"), orange: actLine("m_orange"), turnlap: actLine("c_turnlap"),
  wave: actLine("b_wave"), notes: actLine("c_notes"), answer: actLine("b_answer"), sabado: actLine("m_sabado"), opo: actLine("b_opo"), written: actLine("c_written"), notdone: actLine("c_notdone") };
const win = (ln, t, pi = 0.2, po = 0.3) => smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3));
const env = (a, b, t, ei = 0.25, eo = 0.3) => smooth((t - a) / ei) * (1 - smooth((t - b) / eo));
const ramp = (a, b, t) => smooth((t - a) / Math.max(1e-4, b - a));
const lerp = (a, b, w) => a + (b - a) * w;
const cutAt = (shot, from) => { const c = TL.shots.find((k) => k.shot === shot && k.t >= from); return c ? c.t : 1e9; };
const X_AX = v3(1, 0, 0), Y_AX = v3(0, 1, 0), Z_AX = v3(0, 0, 1);
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y_AX, a);
const WALL_Z = -0.62, WALL_L = -1.42, WALL_R = 1.75, WALL_F = 4.4, CEIL = 2.7, DESK_Y = 0.74, CS = 0.85;

// ================= the room =================
const WALLT = TEX.plaster("#b4c8ae", "#869c84", 21), WT = 1.3;
const FLOORT = painted(32, 32, (g) => {
  g.fillStyle = "#8a6f58"; g.fillRect(0, 0, 32, 32); g.fillStyle = "#7c624d"; g.fillRect(0, 0, 16, 16); g.fillRect(16, 16, 16, 16);
  g.fillStyle = "#6a523f"; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 32); g.fillRect(16, 0, 1, 32);
  speck(g, rng(5), 32, 32, 40, ["#93785f", "#70573f"]);
}, { repeat: true });
const WOODD = TEX.wood("#8a6238", "#5c3d20", "#a07848", 5), WOODDOOR = TEX.wood("#7a5a3c", "#4f3622", "#8c6a48", 9);
{
  const RW = WALL_R - WALL_L, RD = WALL_F - WALL_Z, CX = (WALL_L + WALL_R) / 2, CZ = (WALL_Z + WALL_F) / 2, o = { noShadow: true };
  tbox(room, RW + 0.3, 0.1, RD + 0.3, FLOORT, 0.8, CX, -0.05, CZ, o);
  tbox(room, RW + 0.24, CEIL, 0.12, WALLT, WT, CX, CEIL / 2, WALL_Z - 0.06, o);                 // back
  tbox(room, 0.12, CEIL, RD + 0.24, WALLT, WT, WALL_L - 0.06, CEIL / 2, CZ, o);                 // left
  tbox(room, 0.12, CEIL, RD + 0.24, WALLT, WT, WALL_R + 0.06, CEIL / 2, CZ, o);                 // right
  tbox(room, RW + 0.24, CEIL, 0.12, WALLT, WT, CX, CEIL / 2, WALL_F + 0.06, o);                 // front, behind the lens
  box(room, RW + 0.3, 0.1, RD + 0.3, 0xe6e1d2, CX, CEIL + 0.05, CZ, o);
  box(room, RW, 0.1, 0.02, 0x54705e, CX, 0.05, WALL_Z + 0.01, o); box(room, 0.02, 0.1, RD, 0x54705e, WALL_L + 0.01, 0.05, CZ, o); box(room, 0.02, 0.1, RD, 0x54705e, WALL_R - 0.01, 0.05, CZ, o);   // baseboards
}
// what the jalousies look out on: a morning sky, two clouds, the roofs across the street (an antenna, a water tank, one coconut top)
const skyTex = painted(48, 72, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 72); gr.addColorStop(0, "#6fb2ea"); gr.addColorStop(0.55, "#a9d6f4"); gr.addColorStop(0.8, "#ffe9c4"); gr.addColorStop(1, "#ffd9a0"); g.fillStyle = gr; g.fillRect(0, 0, 48, 72);
  g.fillStyle = "#ffffff"; for (const [x, y, w] of [[5, 12, 15], [9, 9, 9], [28, 26, 14], [31, 23, 8]]) g.fillRect(x, y, w, 4);
  g.fillStyle = "#eef6ff"; for (const [x, y, w] of [[7, 15, 12], [30, 29, 10]]) g.fillRect(x, y, w, 2);
  g.fillStyle = "#2f7a46"; for (const [x, y, w, h] of [[36, 36, 10, 3], [33, 38, 5, 3], [42, 39, 6, 3], [38, 33, 5, 4]]) g.fillRect(x, y, w, h); g.fillStyle = "#6a4a2c"; g.fillRect(40, 38, 2, 24);      // a coconut top
  g.fillStyle = "#9a5a48"; g.fillRect(0, 60, 48, 12);
  for (const [x0, xm, x1, y, c] of [[-4, 8, 20, 50, "#b8644e"], [16, 29, 42, 54, "#8f4e40"], [36, 46, 56, 51, "#a85a46"]]) { g.fillStyle = c; g.beginPath(); g.moveTo(x0, 61); g.lineTo(xm, y); g.lineTo(x1, 61); g.fill(); }
  g.fillStyle = "#4a4650"; g.fillRect(22, 43, 1, 11); g.fillRect(20, 45, 5, 1); g.fillStyle = "#3f6f9a"; g.fillRect(4, 44, 6, 7); g.fillStyle = "#35302c"; g.fillRect(5, 51, 1, 4); g.fillRect(8, 51, 1, 4);   // an antenna, a blue water tank on legs
}, { mip: false });
function jalousie(w, h, n = 9) {
  const g = new THREE.Group(), o = { noShadow: true };
  box(g, w + 0.1, h + 0.1, 0.03, 0x4a3828, 0, 0, 0, o);
  plane(g, w, h, new THREE.MeshBasicMaterial({ map: skyTex, color: new THREE.Color(1.08, 1.08, 1.08) }), 0, 0, 0.017);
  box(g, 0.03, h, 0.03, 0x4a3828, 0, 0, 0.03, o);
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) box(g, w / 2 - 0.03, 0.006, 0.05, 0xdbe8f2, s * w / 4, -h / 2 + 0.05 + i * (h - 0.1) / (n - 1), 0.04, { noShadow: true, rim: 1 }).rotation.x = -0.6;
  box(g, w + 0.16, 0.03, 0.09, 0x4a3828, 0, -h / 2 - 0.06, 0.04, o);
  return g;
}
const WINB = { x: 0.5, y: 1.6, w: 0.62, h: 0.86 };                                                                           // on the back wall, right of the bed: the sun's window
{ const b = jalousie(WINB.w, WINB.h); b.position.set(WINB.x, WINB.y, WALL_Z + 0.005); room.add(b); }
// the door, on the back wall at the right (shut: nobody shouts through it today)
{
  const g = group(room, 1.32, 0, WALL_Z + 0.004), o = { noShadow: true };
  tbox(g, 0.72, 2.0, 0.04, WOODDOOR, 0.7, 0, 1.0, 0.024, o);
  for (const [y, h] of [[0.5, 0.7], [1.45, 0.86]]) { box(g, 0.52, h, 0.008, 0x5a3f28, 0, y, 0.046, o); box(g, 0.46, h - 0.06, 0.008, 0x6e5034, 0, y, 0.049, o); }
  for (const s of [-1, 1]) box(g, 0.06, 2.06, 0.06, 0x3f2c1c, s * 0.39, 1.03, 0.03, o);
  box(g, 0.84, 0.06, 0.06, 0x3f2c1c, 0, 2.04, 0.03, o); box(g, 0.84, 0.05, 0.06, 0x3f2c1c, 0, 2.36, 0.03, o);
  for (let i = 0; i < 5; i++) box(g, 0.7, 0.03, 0.02, 0x4f3622, 0, 2.1 + i * 0.052, 0.03, o).rotation.x = 0.5;
  mesh(g, new THREE.SphereGeometry(0.03, 8, 6), mat(0xc9a24a, { rim: 0.6 }), -0.28, 1.0, 0.075, o);
  g.traverse((m) => { m.receiveShadow = false; });                                                                        // a wall beside a door takes no cast shadows (AGENTS.md)
}
// the shelf over the headboard: the router (its lights on: there is WiFi today), a few books, a small pot
const ROUTER_LED = [];
{
  const g = group(room, -0.55, 1.92, WALL_Z + 0.1), o = { noShadow: true };
  box(g, 0.78, 0.028, 0.2, 0x7a5636, 0, 0, 0); for (const x of [-0.3, 0.3]) box(g, 0.02, 0.12, 0.16, 0x4a3420, x, -0.07, -0.01, o);
  for (const [x, h, c] of [[-0.33, 0.2, 0xb8433a], [-0.29, 0.17, 0x3a6ea8], [-0.25, 0.21, 0xd8b23a], [-0.2, 0.15, 0x4f8a5a]]) box(g, 0.034, h, 0.13, c, x, 0.014 + h / 2, 0, o);
  mesh(g, new THREE.CylinderGeometry(0.035, 0.028, 0.05, 8), mat(0xb5613c), 0.31, 0.04, 0.01); mesh(g, new THREE.SphereGeometry(0.036, 7, 5), mat(0x3f8a4a), 0.31, 0.09, 0.01);
  const r = group(g, 0.06, 0.014, 0.02);
  box(r, 0.24, 0.042, 0.13, 0xe9e6de, 0, 0.021, 0); box(r, 0.24, 0.006, 0.13, 0xb9b6ae, 0, 0.003, 0, o);
  for (const s of [-1, 1]) box(r, 0.012, 0.17, 0.012, 0x2a2a30, s * 0.1, 0.12, -0.05, o).rotation.z = -s * 0.12;
  for (let i = 0; i < 4; i++) { box(r, 0.016, 0.012, 0.004, 0x27332c, -0.07 + i * 0.034, 0.022, 0.066, o); ROUTER_LED.push(box(r, 0.016, 0.012, 0.005, 0x4dff7a, -0.07 + i * 0.034, 0.022, 0.067, { glow: 1.6, noShadow: true })); }
}
// a calendar (a picture and a grid, no words; Saturday ringed) and sticky notes, on the left wall past the foot of the bed
{
  const cal = painted(32, 44, (g) => {
    g.fillStyle = "#f2ecdc"; g.fillRect(0, 0, 32, 44); g.fillStyle = "#c8382e"; g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#ffd76a"; g.beginPath(); g.arc(23, 7, 3, 0, 7); g.fill(); g.fillStyle = "#7a2a22"; g.beginPath(); g.moveTo(0, 16); g.lineTo(9, 6); g.lineTo(16, 12); g.lineTo(21, 8); g.lineTo(32, 16); g.fill();
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { g.fillStyle = c === 0 ? "#d9685e" : "#9a958a"; g.fillRect(3 + c * 4, 20 + r * 4.5, 2, 2); }
    g.strokeStyle = "#c8382e"; g.lineWidth = 1; g.strokeRect(25.5, 27.5, 5, 5);
    g.fillStyle = "#8a8578"; g.fillRect(15, 0, 2, 2);
  }, { mip: false });
  const p = plane(room, 0.3, 0.41, signMat(cal), WALL_L + 0.006, 1.5, 2.9); p.rotation.y = Math.PI / 2;
  for (const [z, y, c, rx] of [[3.2, 1.36, 0xffe066, 0.08], [3.27, 1.45, 0xff9ac0, -0.1], [3.18, 1.5, 0x9fe8a0, 0.05]]) { const n = box(room, 0.003, 0.07, 0.07, c, WALL_L + 0.006, y, z, { noShadow: true }); n.rotation.x = rx; }
}
// the stand fan, in the back corner by the door: turning, swinging its head slowly
const sfan = group(room, 1.5, 0, 0.1); sfan.rotation.y = -1.25;
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
// behind the lens: a wardrobe, so a shot that looks this way finds a room there
{ box(room, 0.9, 1.9, 0.5, 0x6a4a2c, 0.6, 0.95, WALL_F - 0.27); box(room, 0.01, 1.8, 0.01, 0x3a2414, 0.6, 0.95, WALL_F - 0.525, { noShadow: true }); for (const s of [-1, 1]) box(room, 0.02, 0.1, 0.02, 0xc9a24a, 0.6 + s * 0.05, 1.0, WALL_F - 0.53, { noShadow: true }); }
// the bulb over the middle of the room: off
const KBULB = [0.9, 2.05, 2.7];
box(room, 0.008, CEIL - KBULB[1] - 0.07, 0.008, 0x1a1a20, KBULB[0], (CEIL + KBULB[1] + 0.07) / 2, KBULB[2], { noShadow: true }); mesh(room, new THREE.CylinderGeometry(0.022, 0.026, 0.05, 8), mat(0x2a2a30), KBULB[0], KBULB[1] + 0.07, KBULB[2], { noShadow: true });
mesh(room, new THREE.SphereGeometry(0.05, 8, 6), mat(0xb9b9c2, { rim: 0.6 }), KBULB[0], KBULB[1], KBULB[2], { noShadow: true });

// ================= the bed (a surface), its pillows =================
// Buloy's measures in it. XB: the line he lies along. RHO: how far the pillows prop his back up from flat. HIP_L, HIP_S: his hip joint lying and sitting up
// (sitting, he is a little lower: the mattress gives). SPINE and FRONT: the way his back runs and the way his chest faces while he lies.
const BED = { x0: -1.0, x1: -0.1, z0: -0.56, z1: 1.62, top: 0.46 }, BCX = (BED.x0 + BED.x1) / 2, BCZ = (BED.z0 + BED.z1) / 2, BEDW = BED.x1 - BED.x0, BEDL = BED.z1 - BED.z0;
const XB = -0.4, RHO = 0.45, SPINE = v3(0, Math.sin(RHO), -Math.cos(RHO)), FRONT = v3(0, Math.cos(RHO), Math.sin(RHO));
const HIP_L = v3(XB, BED.top + 0.13, 0.5), HIP_S = v3(XB, BED.top + 0.085, 0.48);
const bedP = makeProp("bed", room, { surface: true }); bedP.g.position.set(BCX, BED.top - 0.08, BCZ); bedP.seen = 1e9;
bedP.part(mesh(bedP.g, new RoundedBoxGeometry(BEDW - 0.02, 0.16, BEDL - 0.04, 2, 0.03), mat(0xe4dccb), 0, 0, 0), "box", { h: [BEDW / 2 - 0.01, 0.08, BEDL / 2 - 0.02] });
{
  box(room, BEDW, 0.3, BEDL, 0x5c3d20, BCX, 0.15, BCZ);                                                                         // the frame
  box(room, BEDW + 0.04, 0.98, 0.06, 0x5c3d20, BCX, 0.49, BED.z0 - 0.01); box(room, BEDW - 0.14, 0.5, 0.012, 0x6e4c2a, BCX, 0.66, BED.z0 + 0.024, { noShadow: true });   // the headboard and its panel
  box(room, BEDW + 0.04, 0.5, 0.05, 0x5c3d20, BCX, 0.25, BED.z1 + 0.005);                                                    // the footboard, low
  mesh(room, new RoundedBoxGeometry(0.64, 0.2, 0.42, 2, 0.07), mat(0xf0e9da), XB - 0.03, BED.top + 0.1, BED.z0 + 0.25);          // the pillow that lies flat
  const c = HIP_L.clone().addScaledVector(SPINE, 0.56).addScaledVector(FRONT, -0.21);                                       // the one his back and head lie on, at the slope of his back
  mesh(room, new RoundedBoxGeometry(0.66, 0.15, 0.6, 2, 0.06), mat(0xfbf7ee), c.x, c.y, c.z).rotation.x = RHO;
}

// ================= the desk (a surface), the laptop's stand, what lies about =================
// The desk stands along the bed's right side, from his hips to past the foot: nearer the lens than his pillow, so a camera at the foot of the room
// has Claude low, the screen over him and Buloy's face high; and when Buloy sits up, the desk is in front of him and to his left.
const DK = { x0: -0.08, x1: 0.82, z0: 0.26, z1: 1.5 }, DCX = (DK.x0 + DK.x1) / 2, DCZ = (DK.z0 + DK.z1) / 2, DW = DK.x1 - DK.x0, DD = DK.z1 - DK.z0;
const deskP = makeProp("desk", room, { surface: true }); deskP.g.position.set(DCX, DESK_Y - 0.015, DCZ); deskP.seen = 1e9;
deskP.part(tbox(deskP.g, DW, 0.03, DD, WOODD, 0.45, 0, 0, 0), "box", { h: [DW / 2, 0.015, DD / 2] }); flatSocket(deskP, 0.015);
{
  const o = { noShadow: true };
  for (const x of [DK.x0 + 0.04, DK.x1 - 0.04]) for (const z of [DK.z0 + 0.04, DK.z1 - 0.04]) box(room, 0.05, 0.71, 0.05, 0x55381f, x, 0.355, z, o);
  box(room, DW - 0.1, 0.07, 0.02, 0x6a4a2c, DCX, 0.675, DK.z1 - 0.03, o); for (const x of [DK.x0 + 0.03, DK.x1 - 0.03]) box(room, 0.02, 0.07, DD - 0.1, 0x6a4a2c, x, 0.675, DCZ, o);       // the aprons
  // a mug with two pencils, sticky notes, the charger and its cable: along the right edge, where nobody walks and no caption sits
  const mug = group(room, 0.72, DESK_Y, 0.4); mesh(mug, new THREE.CylinderGeometry(0.04, 0.036, 0.09, 10), mat(0x2f6fb0, R), 0, 0.045, 0); mesh(mug, new THREE.TorusGeometry(0.026, 0.008, 4, 10), mat(0x2f6fb0, R), 0.045, 0.045, 0, o);
  box(mug, 0.008, 0.15, 0.008, 0xf2c230, -0.01, 0.1, 0.005, o).rotation.z = 0.2; box(mug, 0.008, 0.14, 0.008, 0xd9412e, 0.012, 0.1, -0.008, o).rotation.z = -0.25;
  box(room, 0.075, 0.016, 0.075, 0xffe066, 0.73, DESK_Y + 0.008, 1.12, o).rotation.y = 0.3; box(room, 0.075, 0.003, 0.075, 0xff9ac0, 0.74, DESK_Y + 0.002, 1.24, o).rotation.y = -0.2;
  box(room, 0.06, 0.03, 0.06, 0xf2f2ea, 0.74, DESK_Y + 0.015, 1.42, o);
  for (let i = 0; i < 6; i++) box(room, 0.09, 0.006, 0.006, 0xe6e6de, 0.72 + Math.cos(i * 1.3) * 0.03, DESK_Y + 0.003, 1.32 + Math.sin(i * 1.7) * 0.03, o).rotation.y = i * 0.9;
  // his chair, empty, at the lens end of the desk
  const ch = group(room, 0.44, 0, 1.9); ch.rotation.y = Math.PI + 0.25;
  box(ch, 0.42, 0.04, 0.4, 0x8a6a40, 0, 0.44, 0); box(ch, 0.4, 0.4, 0.035, 0x8a6a40, 0, 0.78, -0.2);
  for (const sx of [-0.18, 0.18]) for (const sz of [-0.17, 0.17]) box(ch, 0.04, 0.42, 0.04, 0x5c3d20, sx, 0.21, sz, o);
}
// the stand: a round plate on a post, tall enough that the screen clears Claude's head from the foot of the room. The laptop turns on it.
const LAPX = 0.38, LAPZ = 0.7, STAND_H = 0.18;
const standP = makeProp("stand", room, { surface: true }); standP.g.position.set(LAPX, DESK_Y, LAPZ); standP.seen = 1e9;
standP.part(mesh(standP.g, new THREE.CylinderGeometry(0.165, 0.165, 0.018, 20), mat(0x9a7446, R), 0, STAND_H - 0.009, 0), "cyl", { rad: 0.165, hl: 0.009 });
mesh(standP.g, new THREE.CylinderGeometry(0.04, 0.055, STAND_H - 0.018, 10), mat(0x5c3d20, R), 0, (STAND_H - 0.018) / 2, 0); mesh(standP.g, new THREE.CylinderGeometry(0.13, 0.14, 0.014, 16), mat(0x6a4a2c, R), 0, 0.007, 0, { noShadow: true });

// ================= the laptop and the meeting on its screen =================
// The screen is a canvas drawn every frame. It is a meeting like any other and like none: no logo, no product's colours or layout.
// One large tile is the boss (a plain round avatar and shoulders, never a face; a ring that swells with her voice), one small tile is what her
// side sees of "Buloy". With text on, the tiles carry BOSS and BULOY; with text off (a camera too far to read them) nothing takes their place.
laptop.visible = false;
const MW = 192, MH = 124;
const meetC = document.createElement("canvas"); meetC.width = MW; meetC.height = MH;
const mg = meetC.getContext("2d"); mg.imageSmoothingEnabled = false;
const meetT = new THREE.CanvasTexture(meetC); meetT.colorSpace = THREE.SRGBColorSpace; meetT.magFilter = THREE.NearestFilter; meetT.minFilter = THREE.LinearFilter; meetT.generateMipmaps = false;
const PT = (s, x, y, col, o) => { if (ATLAS && ATLAS.ptext) ATLAS.ptext(mg, s, x, y, col, o); };
const NOTE = "SABADO: BULOY", RING = "#7dff9a", SKIN_B = "#c98f6b";
function drawAvatar(cx, cy, r, amp) {                                                                                        // head and shoulders, and the ring her voice makes
  const g = mg;
  g.fillStyle = "#8f98c4"; g.beginPath(); g.ellipse(cx, cy + r * 2.75, r * 1.75, r * 1.5, 0, Math.PI, 0); g.fill();
  g.fillStyle = "#b8c0e6"; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  if (amp > 0.06) { g.strokeStyle = RING; g.lineWidth = Math.max(1, r * (0.1 + 0.12 * amp)); g.beginPath(); g.arc(cx, cy, r * (1.22 + 0.3 * amp), 0, 7); g.stroke(); }
}
function drawSelf(x, y, w, h, who, t) {                                                                                      // what her side sees: an orange block; a blur while the laptop turns; a man in bed
  const g = mg;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (who === "claude") {
    g.fillStyle = "#d97757"; g.fillRect(x, y, w, h); g.fillStyle = "#b85f42"; g.fillRect(x, y + h * 0.84, w, h * 0.16);
    g.fillStyle = "#17111c"; g.fillRect(x + w * 0.26, y + h * 0.26, w * 0.09, h * 0.3); g.fillRect(x + w * 0.65, y + h * 0.26, w * 0.09, h * 0.3);
    g.fillStyle = "#e8e6f0"; g.fillRect(x, y, w, h * 0.1);                                                                   // the band of the headset across the top
  } else if (who === "blur") {
    const C = ["#a9bca4", "#d97757", "#e4dccb", "#3b5b94", "#8a6238"]; for (let i = 0; i < 9; i++) { g.fillStyle = C[(i + Math.floor(t * 20)) % 5]; g.fillRect(x, y + i * h / 9, w, h / 9 + 1); }
  } else {
    g.fillStyle = "#a9bca4"; g.fillRect(x, y, w, h); g.fillStyle = "#f6f1e6"; g.fillRect(x + w * 0.16, y + h * 0.3, w * 0.68, h * 0.5);       // the wall, the pillows
    g.fillStyle = "#3b5b94"; g.fillRect(x, y + h * 0.7, w, h * 0.3); g.fillStyle = "#3a3945"; g.fillRect(x + w * 0.3, y + h * 0.52, w * 0.4, h * 0.3);   // the blanket, his shoulders
    g.fillStyle = "#c58b62"; g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.36, w * 0.11, h * 0.2, 0, 0, 7); g.fill();
    g.fillStyle = "#1a161f"; g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.24, w * 0.125, h * 0.13, 0, 0, 7); g.fill();
    if (who === "buloyhs") { g.fillStyle = "#e8e6f0"; g.fillRect(x + w * 0.36, y + h * 0.1, w * 0.28, h * 0.05); g.fillStyle = "#6b46c9"; g.fillRect(x + w * 0.34, y + h * 0.28, w * 0.05, h * 0.16); g.fillRect(x + w * 0.61, y + h * 0.28, w * 0.05, h * 0.16); }
  }
  g.restore();
}
// S: { t, amp, eye 0..1 (she leans into her camera), dart -1..1, self, notes (the notes window is up), check 0..1, text }
function drawMeet(S) {
  const g = mg, text = S.text;
  g.fillStyle = "#1c1e29"; g.fillRect(0, 0, MW, MH);
  if (!S.notes) {
    g.fillStyle = "#262938"; g.fillRect(0, 0, MW, 8); g.fillStyle = "#4a5068"; for (let i = 0; i < 3; i++) g.fillRect(170 + i * 6, 3, 3, 3); g.fillStyle = "#3a3f58"; g.fillRect(4, 3, 26, 2);
    const X = 64, Y = 11, Wd = 124, Hd = 92;
    g.fillStyle = "#2f3550"; g.fillRect(X, Y, Wd, Hd);
    g.save(); g.beginPath(); g.rect(X, Y, Wd, Hd); g.clip();
    if (S.eye < 0.5) drawAvatar(X + Wd / 2, Y + 34 + S.eye * 30, 16 * (1 + S.eye * 6), S.eye > 0.05 ? 0 : S.amp);
    else {                                                                                                                    // one large squinting eye: her skin fills the tile
      const cx = X + Wd / 2, cy = Y + Hd / 2 + 2, k = 0.9 + 0.1 * S.eye, sq = 0.5;
      g.fillStyle = SKIN_B; g.fillRect(X, Y, Wd, Hd); g.fillStyle = "#b47a58"; g.fillRect(X, Y + Hd - 16, Wd, 16);
      g.fillStyle = "#f3ead9"; g.beginPath(); g.ellipse(cx, cy, 44 * k, 17 * k, 0, 0, 7); g.fill();
      g.fillStyle = "#3a2418"; g.beginPath(); g.arc(cx + S.dart * 12, cy + 1, 13 * k, 0, 7); g.fill(); g.fillStyle = "#0d0807"; g.beginPath(); g.arc(cx + S.dart * 12, cy + 1, 6 * k, 0, 7); g.fill();
      g.fillStyle = "#ffffff"; g.fillRect(cx + S.dart * 12 - 7, cy - 6, 4, 4);
      g.fillStyle = SKIN_B; g.fillRect(X, Y, Wd, cy - Y - 17 * k * (1 - sq)); g.fillRect(X, cy + 17 * k * (1 - sq * 0.7), Wd, Hd);    // the lids come down and up: a squint
      g.fillStyle = "#5a3626"; g.fillRect(cx - 46 * k, cy - 17 * k * (1 - sq) - 3, 92 * k, 3); g.fillStyle = "#8a5a40"; g.fillRect(cx - 40 * k, cy + 17 * k * (1 - sq * 0.7), 80 * k, 2);
      g.fillStyle = "#2a1c16"; g.beginPath(); g.moveTo(cx - 50, cy - 30); g.lineTo(cx + 44, cy - 21); g.lineTo(cx + 44, cy - 14); g.lineTo(cx - 50, cy - 22); g.fill();         // the brow, drawn down toward the nose
    }
    g.restore();
    if (S.amp > 0.06 && S.eye < 0.05) { g.strokeStyle = RING; g.lineWidth = 2; g.strokeRect(X + 1, Y + 1, Wd - 2, Hd - 2); }
    if (text) { g.fillStyle = "#14161f"; g.fillRect(X + 3, Y + 3, 29, 11); PT("BOSS", X + 6, Y + 5, "#ffffff", { font: 5 }); }
    drawSelf(4, 11, 54, 40, S.self, S.t);
    if (text) PT("BULOY", 31, 54, "#ffffff", { font: 5, align: "center" });
    g.fillStyle = "#232634"; g.fillRect(4, 66, 54, 37); g.fillStyle = "#3a3f58"; for (const [y, w] of [[71, 40], [78, 28], [85, 36], [92, 20]]) g.fillRect(9, y, w, 3);
    g.fillStyle = "#14161f"; g.fillRect(0, 106, MW, 18); g.fillStyle = "#3a3f58"; for (const x of [10, 24, 38]) { g.beginPath(); g.arc(x, 115, 5, 0, 7); g.fill(); }
    g.fillStyle = "#e0483e"; g.fillRect(175, 110, 13, 10);
  } else {
    g.fillStyle = "#2f3550"; g.fillRect(4, 3, 42, 27); drawAvatar(25, 12, 6, S.amp); if (S.amp > 0.06) { g.strokeStyle = RING; g.lineWidth = 1; g.strokeRect(4.5, 3.5, 41, 26); }
    drawSelf(50, 3, 42, 27, S.self, S.t);
    g.fillStyle = "#3a3f58"; for (let i = 0; i < 3; i++) g.fillRect(100, 8 + i * 7, [50, 34, 44][i], 3);
    g.fillStyle = "#f4eedc"; g.fillRect(4, 33, 184, 87); g.fillStyle = "#3a3f58"; g.fillRect(4, 33, 184, 18);
    if (text) PT("NOTES", 10, 35, "#f4eedc", { font: 5, scale: 2 }); else { g.fillStyle = "#6a7090"; g.fillRect(10, 39, 46, 6); }
    g.strokeStyle = "#3a3640"; g.lineWidth = 2; g.strokeRect(11, 63, 14, 14);
    if (S.check > 0) { g.fillStyle = "#2f9a4a"; g.fillRect(10, 62, 16, 16); g.fillStyle = "#ffffff"; for (const [x, y] of [[13, 70], [15, 72], [17, 74], [19, 72], [21, 70], [23, 68]]) g.fillRect(x - 1, y - 3, 3, 3); }
    if (text) PT(NOTE, 32, 63, "#2a2630", { font: 5, scale: 2 }); else { g.fillStyle = "#6a6672"; g.fillRect(32, 67, 70, 6); g.fillRect(108, 67, 58, 6); }
    g.fillStyle = "#cfc8b2"; for (const [y, w] of [[88, 120], [98, 86], [108, 104]]) g.fillRect(32, y, w, 4);
  }
  meetT.needsUpdate = true;
}
const lap = makeLaptop(room, { name: "laptop", tex: meetT, k: 1.15, col: 0x565b68 });
const LW = lap.dim.W, LTH = lap.dim.T, LDP = lap.dim.D, LAP_Y = DESK_Y + STAND_H + LTH / 2 + 0.0006;
lap.box(lap.lid, 0.05, 0.0008, 0.05, 0xffe066, -0.085, lap.dim.LT + 0.0005, LDP * 0.7, { detail: true, noShadow: true, mat: {} });       // the sticky note on the lid, as in episode 9
// where the middle of the screen and the lens over it are, in the laptop's own frame (lid open 1.85: see makeLaptop)
const LID_A = 1.85, HY = LTH / 2 + 0.004 * 1.15, HZ = -LDP / 2 + 0.005 * 1.15, LD = LDP - 0.004 * 1.15;
const SCR_C = v3(0, HY + (LD / 2 + 0.002) * Math.sin(LID_A), HZ + (LD / 2 + 0.002) * Math.cos(LID_A)), SCR_N = v3(0, -Math.cos(LID_A), Math.sin(LID_A)), SCR_UP = v3(0, Math.sin(LID_A), Math.cos(LID_A));
const CAM_C = v3(0, HY + (LD - 0.007) * Math.sin(LID_A), HZ + (LD - 0.007) * Math.cos(LID_A));
const SCR_W = LW - 0.03, SCR_H = LD - 0.03;

// ================= Claude: where he stands, the top of his head (a surface) =================
room.add(C); C.scale.setScalar(CS); C.visible = true;
const PSI0 = -0.6, N0 = v3(Math.sin(PSI0), 0, Math.cos(PSI0));                                                              // the screen's bearing at the start: toward the lens and a little toward the bed's foot
const C_WORK = v3(LAPX, DESK_Y, LAPZ).addScaledVector(N0, 0.37);                                                            // in front of the screen
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const headP = makeProp("claudehead", cBody, { surface: true }); headP.g.position.set(0, 0.32, 0); headP.part(headP.g, "box", { h: [0.24, 0.004, 0.12], c: [0, -0.004, 0] }); headP.seen = 1e9;

// ================= the headset =================
// Its frame: the middle between the two ear cups is the origin, x runs from cup to cup (+x is the wearer's left, where the microphone is), y up to the band, z forward.
// It has two shapes and springs between them: W is half the distance between the cups, H the rise from the cups to the band.
const HS = { cupR: 0.04, cupT: 0.032, barT: 0.02, barD: 0.034, W_C: 0.204 + 0.016 + 0.003, H_C: 0.074, W_B: 0.108, H_B: 0.162, W: 0, H: 0 };
const hset = makeProp("headset", room); hset.rad = 0.24;
const HSM = { band: mat(0xe8e6f0, R), cup: mat(0x6b46c9, R), pad: mat(0x2a2a33, R), mic: mat(0x2a2a33, R) };
const hsBar = group(hset.g), hsBarM = mesh(hsBar, unit, HSM.band); hset.part(hsBar, "box", { h: [0.2, HS.barT / 2, HS.barD / 2], r: 0.004 });
const hsBarPart = hset.parts[hset.parts.length - 1];
const hsStrut = [-1, 1].map((s) => { const g = group(hset.g), m = mesh(g, unit, HSM.band); hset.part(g, "box", { h: [0.007, 0.03, 0.014] }); return { g, m, s, part: hset.parts[hset.parts.length - 1] }; });
const hsCup = [-1, 1].map((s) => {
  const g = group(hset.g); g.rotation.z = Math.PI / 2;                                                                      // the cup's own y runs across the head: +y is the prop's -x
  hset.part(g, "cyl", { rad: HS.cupR, hl: HS.cupT / 2 });
  mesh(g, new THREE.CylinderGeometry(HS.cupR, HS.cupR, HS.cupT - 0.008, 14), HSM.cup, 0, -s * 0.004, 0);                      // the shell, outside
  mesh(g, new THREE.CylinderGeometry(HS.cupR - 0.003, HS.cupR - 0.003, 0.008, 14), HSM.pad, 0, s * (HS.cupT / 2 - 0.004), 0, { noShadow: true });   // the cushion, on the head's side
  mesh(g, new THREE.CylinderGeometry(HS.cupR * 0.5, HS.cupR * 0.5, 0.002, 12), HSM.band, 0, -s * (HS.cupT / 2 - 0.0008), 0, { noShadow: true });    // a pale disc on its outer face
  return { g, s };
});
const hsMic = group(hset.g);                                                                                                 // the boom, from the left cup forward and down to a foam ball
{ const d = v3(-0.05, -0.45, 0.9).normalize(), len = 0.15; hsMic.quaternion.setFromUnitVectors(Z_AX, d); box(hsMic, 0.008, 0.008, len, 0x2a2a33, 0, 0, len / 2, { noShadow: true, rim: 1 }); mesh(hsMic, new THREE.SphereGeometry(0.017, 8, 6), HSM.mic, 0, 0, len, { noShadow: true }); }
function hsShape(W, H) {
  hsBar.position.set(0, H, 0); hsBarM.scale.set(2 * W + 0.024, HS.barT, HS.barD); hsBarPart.h[0] = W + 0.012; hsBarPart.pts = null;
  for (const k of hsStrut) { const y0 = HS.cupR * 0.7, hh = (H - HS.barT / 2 - y0) / 2; k.g.position.set(k.s * W, y0 + hh, 0); k.m.scale.set(0.014, 2 * hh, 0.028); k.part.h[1] = hh; k.part.pts = null; }
  for (const k of hsCup) k.g.position.set(k.s * W, 0, 0);
  hsMic.position.set(W - 0.002, -0.012, HS.cupR * 0.55);
  HS.W = W; HS.H = H;
}
hsShape(HS.W_C, HS.H_C);
const hsNub = (s) => ({ p: v3(s * (HS.W + HS.cupT / 2), 0, 0), n: v3(s, 0, 0) });                                              // where a nub presses it: the outer face of an ear cup
// "band": a fist over the band from the front. The knuckles lie on its upper front edge, the fingers go over the top and down behind it, the thumb comes up from below.
hset.sockets.band = (Hd, G = {}) => { const n = v3(0, 0.5, 0.866), f = v3(0, 0.866, -0.5); return { p: v3(G.x || 0, HS.H, 0).addScaledVector(n, 0.0185), n, f, anchor: [0, HD.rootY + 0.004], thumb: "oppose", splay: 0.1 }; };
const _hq = new THREE.Quaternion(), _hp = new THREE.Vector3(), _hu = new THREE.Vector3();
function hsOnClaude() {                                                                                                      // where it sits on his block: the band on the top of his head, whatever his body is doing
  cBody.updateWorldMatrix(true, false); cBody.getWorldQuaternion(_hq); _hu.set(0, 1, 0).applyQuaternion(_hq);
  _hp.set(0, 0.32, 0); cBody.localToWorld(_hp); _hp.addScaledVector(_hu, 0.001 + HS.barT / 2 - HS.H_C);
  return { pos: _hp, quat: _hq };
}
function hsOnBuloy() {                                                                                                       // on his head: the cups on his ears, the band over his hair
  vHead.updateWorldMatrix(true, false); vHead.getWorldQuaternion(_hq); _hu.set(0, 1, 0).applyQuaternion(_hq);
  _hp.set(0, 0.2755, -0.002); vHead.localToWorld(_hp); _hp.addScaledVector(_hu, 0.001 + HS.barT / 2 - HS.H_B);
  return { pos: _hp, quat: _hq };
}

// ================= Buloy moves in: his legs stay under the blanket, so they are not drawn =================
room.add(V); V.visible = true; V.children[0].visible = false; V.children[1].visible = false;
vUpper.rotation.order = "YXZ";
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
const bulRig = { vUpper, armL, armR }, BL = armRig(bulRig, 1, "viron"), BR = armRig(bulRig, -1, "viron");
const bulHeadP = makeProp("bulhead", vHead, { surface: true }); bulHeadP.g.position.set(0, 0.2755, -0.002); bulHeadP.part(bulHeadP.g, "box", { h: [0.05, 0.003, 0.03], c: [0, -0.003, 0] }); bulHeadP.seen = 1e9;
const sleeveOf = (arm) => [...arm.sh.children, ...arm.el.children, arm.hand.children[0]].filter((m) => m && m.isMesh), SLEEVE_L = sleeveOf(armL), SLEEVE_R = sleeveOf(armR);      // what is hidden when his arms are under the blanket and only his fingers show: the sleeve, and the cuff's edge that sits on the hand (in the fall it came through the blanket's face)
mesh(vHead, new RoundedBoxGeometry(0.04, 0.1, 0.016, 2, 0.007), skinPlain, 0, 0.047, -0.058, { noShadow: true }).rotation.x = -0.53;   // his nape: the head's own skin has a seam there that no camera before this set looked at
const faceBase = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase };
const THUMB_UP = (s) => ({ f: [[1.35, 1.6, 1.05], [1.35, 1.6, 1.05], [1.35, 1.6, 1.05], [1.35, 1.6, 1.05]], sp: 0, tb: [0.05, 0, -s * 1.35], tb2: 0.0 });   // a fist with the thumb straight out of it
// the tips of his hair: after the blanket they stand on end
const hairTips = vHead.children.filter((m) => m.isMesh && m.geometry.type === "BufferGeometry" && !m.geometry.index && m.geometry.attributes.position.count <= 40).map((m) => ({ m, p: m.position.clone(), q: m.quaternion.clone(), s: m.scale.clone() }));
// With the headset on, a tip that stood up through the band was seen in his close-ups (the critic, cut v1). The headset sits rigidly on his head, so each tip's limit is found once:
// the longest it may be (as a factor of its own length) with every point of it outside the band, the struts and the cups, HAIR_GAP clear. A tip that cannot clear at any length lies flat under the band: hidden while it is worn.
const HAIR_WORN = 0.45, HAIR_GAP = 0.004;
{
  vHead.updateWorldMatrix(true, false);
  const sc = vHead.getWorldScale(new THREE.Vector3()).y || 1, O = v3(0, 0.2755 + (0.001 + HS.barT / 2 - HS.H_B) / sc, -0.002);      // the headset's origin in the head's own frame (hsOnBuloy)
  const y0 = HS.cupR * 0.7, hh = (HS.H_B - HS.barT / 2 - y0) / 2;
  const boxes = [[0, HS.H_B, 0, HS.W_B + 0.012, HS.barT / 2, HS.barD / 2]];                                                  // centre and half sizes, in the headset's frame, metres
  for (const sx of [-1, 1]) boxes.push([sx * HS.W_B, y0 + hh, 0, 0.007, hh, 0.014], [sx * HS.W_B, 0, 0, HS.cupT / 2, HS.cupR, HS.cupR]);
  const LID = HS.H_B - HS.barT / 2 - HAIR_GAP;                                                                               // and none stands higher than the underside of the band, before it or behind it: from the laptop's lens a tip in front of the band is a tip through it
  const inside = (P) => P.y > LID || boxes.some((b) => Math.abs(P.x - b[0]) < b[3] + HAIR_GAP && Math.abs(P.y - b[1]) < b[4] + HAIR_GAP && Math.abs(P.z - b[2]) < b[5] + HAIR_GAP);
  const a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), c3 = new THREE.Vector3(), P = new THREE.Vector3(), N = 6;
  const clear = (k, f) => {
    const pos = k.m.geometry.attributes.position, at = (i, out) => out.fromBufferAttribute(pos, i).multiply(_hu.set(k.s.x, k.s.y * f, k.s.z)).applyQuaternion(k.q).add(k.p).sub(O).multiplyScalar(sc);
    for (let i = 0; i + 2 < pos.count; i += 3) {
      at(i, a3); at(i + 1, b3); at(i + 2, c3);
      for (let u = 0; u <= N; u++) for (let w = 0; u + w <= N; w++) { P.copy(a3).multiplyScalar(u / N).addScaledVector(b3, w / N).addScaledVector(c3, (N - u - w) / N); if (inside(P)) return false; }
    }
    return true;
  };
  hairTips.forEach((k, i) => {
    const want = 1 + (i % 2 ? 0.5 : 1.6) * HAIR_WORN; k.worn = 0;
    for (let f = want; f >= 0.2; f -= 0.02) if (clear(k, f)) { k.worn = f; break; }
  });
}

// ================= the kumot (the blanket) =================
// Three pieces of one prop, which always lies on the bed: the long mound over his legs; the cover over his chest, in two halves so one arm can be out
// (each half ends in a rolled hem, the only part a hand takes); and the heap round his waist when he sits up.
// Only the hems and the foot of the mound are colliders: the cover is drawn solid, but a body is inside it by design.
const KT = painted(64, 8, (g) => { g.fillStyle = "#35548f"; g.fillRect(0, 0, 64, 8); for (const [x, w, c] of [[6, 2, "#46689f"], [14, 1, "#d9cfb4"], [16, 2, "#a8433c"], [19, 1, "#d9cfb4"], [27, 2, "#46689f"], [38, 2, "#46689f"], [46, 1, "#d9cfb4"], [48, 2, "#a8433c"], [51, 1, "#d9cfb4"], [59, 2, "#46689f"]]) { g.fillStyle = c; g.fillRect(x, 0, w, 8); } }, { mip: false });
const kumotM = mat(0xffffff, { map: KT }), hemM = mat(0x4f72b4);
const kumot = makeProp("kumot", room); kumot.rad = 0.5;
const kLegs = group(kumot.g);
mesh(kLegs, new RoundedBoxGeometry(0.66, 0.2, 1.1, 2, 0.08), kumotM, 0, 0, 0); mesh(kLegs, new RoundedBoxGeometry(0.3, 0.1, 0.16, 2, 0.045), kumotM, 0.02, 0.1, 0.42);     // his legs; his feet
kumot.part(group(kLegs, 0, -0.08, 0.3), "box", { h: [0.3, 0.02, 0.22] });                                                    // the foot of the mound, flat on the mattress
const kLap = group(kumot.g); mesh(kLap, new RoundedBoxGeometry(0.76, 0.2, 0.52, 2, 0.09), kumotM, -0.07, 0.02, 0.2); mesh(kLap, new RoundedBoxGeometry(0.5, 0.07, 0.3, 2, 0.03), kumotM, -0.14, 0.13, 0.26).rotation.y = 0.3;
const kCov = group(kumot.g), KC = { d: 0.34, zc: 0.02 };
const kHalf = [-1, 1].map((s) => {                                                                                           // -1: over his right side, +1: over his left
  const m = mesh(kCov, new RoundedBoxGeometry(1, 1, 1, 2, 0.14), kumotM), hem = group(kCov), hm = mesh(hem, new RoundedBoxGeometry(1, 0.046, 0.046, 2, 0.018), hemM);
  kumot.part(hem, "box", { h: [0.2, 0.021, 0.021], r: 0.014 });
  return { s, m, hem, hm, part: kumot.parts[kumot.parts.length - 1], h: 0, xc: 0 };
});
// the cover: o and q are the frame it lies in (y along the body from the hips, z out of its top face); hR, hL how far up each half reaches; d its depth; zc where its middle is
function kumotCover(o, q, hR, hL, d, zc) {
  kCov.position.copy(o); kCov.quaternion.copy(q); KC.d = d; KC.zc = zc;
  for (const k of kHalf) {
    const h = k.s < 0 ? hR : hL, x0 = k.s < 0 ? -0.44 : 0.0, x1 = k.s < 0 ? 0.02 : 0.29, w = x1 - x0;                       // his left half is the narrow one: the desk stands against that side of the bed
    const m0 = k.s < 0 ? x0 : x0 - 0.07, m1 = k.s < 0 ? x1 + 0.06 : x1, proud = k.s > 0 ? 0.004 : 0;                        // the cloth of each half runs on under the other's edge: no groove between them; the left one stands a hair proud so the two never share a face
    k.m.position.set((m0 + m1) / 2, (h - 0.12) / 2, zc); k.m.scale.set(m1 - m0, h + 0.12 + proud, d + proud);
    k.hem.position.set((x0 + x1) / 2, h, zc + d / 2 - 0.012); k.hm.scale.x = w + 0.012; k.part.h[0] = w / 2; k.part.pts = null; k.h = h; k.xc = (x0 + x1) / 2;
  }
  kCov.updateMatrix();
}
// "hem": a fist round the rolled hem from outside, knuckles on its upper face, fingers over the edge toward his chin. G.x moves it along the hem; G.under takes it from beneath.
kumot.sockets.hem = (Hd, G = {}) => {
  const k = kHalf[Hd.s > 0 ? 1 : 0], u = G.under ? -1 : 1;                                                                     // under: the palm is beneath the hem and only the fingers come over its edge
  const n = v3(0, 0.34 * u, 0.94 * u).applyQuaternion(kCov.quaternion), f = v3(0, 0.94, -0.34 * u).applyQuaternion(kCov.quaternion);
  const p = v3(k.xc + (G.x || 0), k.h, KC.zc + KC.d / 2 - 0.012).applyMatrix4(kCov.matrix).addScaledVector(n, 0.021);
  return { p, n, f, anchor: [0, HD.rootY + 0.004], thumb: G.under ? "flat" : "oppose", splay: 0.15 };
};
const ORIGIN = v3(0, 0, 0), IDENT = new THREE.Quaternion();

// ================= the light =================
// DAY, in one place. The sun is a low directional light through the back window, toward the lens: it rims hair, shoulders and the blanket and lays the
// slats across the desk. Because it comes from behind, faces are lit by the sky (HEMI) and by a soft bounce from the lens side (FILL): without the
// bounce every face that looks at the lens is in its own shade. FACE is a short light for close shots. Compare mean luma with finished episodes (73 to 86 of 255).
const DAY = { hemiC: [0.86, 0.92, 1.0], hemiG: [0.66, 0.58, 0.5], hemiI: 1.15, sun: 2.3, fill: 0.9, face: 0.7, screen: 0.8, exposure: 0.94, rim: [0.62, 0.5, 0.36] };
const SUN_DIR = v3(-0.3, -0.42, 0.86).normalize();                                                                          // the way the sunlight travels
const sun = new THREE.DirectionalLight(0xffe2b4, DAY.sun); sun.target.position.set(0.1, 0.8, 1.0); sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, -7); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 16 }); sun.shadow.camera.updateProjectionMatrix();
RIM.uRimWorld.value.copy(SUN_DIR).negate();
{
  // What makes it a window's light: plates that stand outside the back wall, with a hole where the window is and slats across the hole.
  // The wall hides them from every camera; they are there only to cast the sun's shadow. (The wall itself casts none: see the room.)
  const Z = WALL_Z - 0.24, x0 = WINB.x - WINB.w / 2, x1 = WINB.x + WINB.w / 2, y0 = WINB.y - WINB.h / 2, y1 = WINB.y + WINB.h / 2;
  const plate = (xa, xb, ya, yb) => box(room, xb - xa, yb - ya, 0.02, 0x222222, (xa + xb) / 2, (ya + yb) / 2, Z);
  plate(-7, x0, -1, 7); plate(x1, 7, -1, 7); plate(x0, x1, -1, y0); plate(x0, x1, y1, 7);
  for (let i = 0; i < 8; i++) box(room, WINB.w, 0.008, 0.05, 0x222222, WINB.x, y0 + 0.06 + i * (WINB.h - 0.1) / 7.4, Z).rotation.x = 0.6;
  box(room, 0.03, WINB.h, 0.03, 0x222222, WINB.x, WINB.y, Z);
}
const faceL = new THREE.PointLight(0xfff0e0, 0, 3.2, 1.6); room.add(faceL);
const lapGlow = new THREE.SpotLight(0xc4d4ff, 0, 1.9, 1.2, 0.7, 1.4); lapGlow.position.set(0, 0.0, 0.12); lap.lid.add(lapGlow); lapGlow.target.position.set(0, -1, 0.12); lap.lid.add(lapGlow.target);

// ================= the clock of the morning (from the acts and cuts of the script) =================
const HEAD_L = HIP_L.clone().addScaledVector(SPINE, 0.72), HEAD_S = v3(HIP_S.x + 0.03, HIP_S.y + 0.72, HIP_S.z + 0.03);       // the middle of his head, lying and sitting
const LAPV = v3(LAPX, LAP_Y, LAPZ), PSI1 = Math.atan2(HEAD_S.x - LAPX, HEAD_S.z - LAPZ);                                     // the bearing that faces him when he sits up
const lapDir = (psi, loc) => loc.clone().applyAxisAngle(Y_AX, psi), lapPt = (psi, loc) => lapDir(psi, loc).add(LAPV);         // a direction, a point of the laptop's own frame, in the room
const X1 = lapDir(PSI1, X_AX), N1 = lapDir(PSI1, Z_AX), C_SIDE = v3(LAPX, DESK_Y, LAPZ).addScaledVector(X1, 0.5).addScaledVector(N1, 0.03);    // the turned laptop's own right and front; where Claude stands beside it
const C_GIVE = v3(0.06, DESK_Y, 0.86);                                                                                      // the bed's edge of the desk, an arm's length from where Buloy sits: where the headset changes hands
const T_BED = cutAt("w_bed", 0), T_SNORE = cutAt("w_snore", 0), T_UP = cutAt("w_up", 0) + 0.03, T_TWO = cutAt("w_two", 0), T_BFACE = cutAt("w_bface", 0);
const T_EYE = A.orange.s - 0.22;                                                                                            // she leans into her camera just before "Teka."
const T_SWIVEL = cutAt("w_swivel", A.turnlap.s), T_P0 = T_SWIVEL + 0.12, T_P1 = T_P0 + 0.45, PUSH = 0.5;                      // his nub is on the corner from T_P0 to T_P1, through PUSH radians
const PSI_REL = PSI0 - PUSH, W_REL = -2 * PUSH / (T_P1 - T_P0), T_STOP = T_P1 + 2 * (PSI1 - PSI_REL) / W_REL;                  // then it runs on by itself, slowing, and stops facing the bed
const lapYaw = (t) => {
  if (t <= T_P0) return PSI0;
  if (t <= T_P1) { const u = (t - T_P0) / (T_P1 - T_P0); return PSI0 - PUSH * u * u; }
  if (t <= T_STOP) { const u = (t - T_P1) / (T_STOP - T_P1); return PSI_REL + (PSI1 - PSI_REL) * (2 * u - u * u); }
  return PSI1;
};
const T_CAUGHT = cutAt("w_caught", 0), T_CLUTCH = [T_STOP - 0.55, T_STOP - 0.2], T_DROP = A.wave.e + 0.3;                        // he pulls the blanket to his chest as the screen comes round; lets it fall after the greeting
const T_HAND = cutAt("w_hand", 0), T_WEAR = cutAt("w_bclose", A.notes.s);                                                    // from T_WEAR the headset is on his head
const T_NUB = [T_HAND - 0.3, T_HAND + 0.06], T_LIFT = [A.notes.s + 0.02, A.notes.s + 0.4], T_SNAP = [A.notes.s + 0.36, A.notes.s + 0.6], T_OFFER = [A.notes.s + 0.5, A.notes.s + 1.0];
const T_TAKE = [A.notes.e - 0.3, A.notes.e + 0.14], T_GRASP = [A.notes.e + 0.14, A.notes.e + 0.26], T_LETGO = [A.notes.e + 0.26, A.notes.e + 0.38], T_AWAY = [A.notes.e + 0.36, T_WEAR];
const T_NOTES = A.written.s - 0.95, T_CHECK = A.written.s + 0.64;                                                            // he starts to type; the tick lands on "na"
const T_FLOP = cutAt("w_flop", 0), T_FALL = [T_FLOP + 0.1, T_FLOP + 0.42], T_PULL = [T_FLOP + 0.5, T_FLOP + 0.95];
const sitAt = (t) => { const u = (t - T_UP) / 0.26, up = u <= 0 ? 0 : u >= 1 ? 1 + 0.1 * Math.sin((u - 1) * 9) * Math.exp(-(u - 1) * 3.2) : 1 - (1 - u) ** 3; return up * (1 - ramp(T_FALL[0], T_FALL[1], t)); };   // 0 lying, 1 sitting: he bolts up and overshoots a little


// ================= the acting, keyed: a value eases to each key's value from the key's time (track() in 00-core.js) =================
// Buloy. tw: his torso's turn toward the desk (radians; Claude is at YAW_C, the laptop at YAW_L). lean: forward. up: shoulders. hy, hp, hr: head yaw (to his left, the desk), pitch (down), roll.
// The face keys are the ones 41-face.js documents; gape is a mouth open with no voice; blk shuts the eyes.
const LIE_X = -(Math.PI / 2 - RHO), YAW_C = yawTo(HIP_S, C_WORK), YAW_L = yawTo(HIP_S, LAPV);
const bk = {
  tw: [[0, 0]], lean: [[0, 0.05]], up: [[0, 0]], hy: [[0, 0.1]], hp: [[0, 0.45]], hr: [[0, 0]],
  smile: [[0, 0.9]], cheek: [[0, 0.8]], brow: [[0, 0.55]], lid: [[0, -0.05]], gx: [[0, 0.1]], gy: [[0, 0.45]], sad: [[0, 0]], anger: [[0, 0]], pucker: [[0, 0]], gape: [[0, 0]], blk: [[0, 0]],
};
{
  const k = (name, t, v, e) => bk[name].push([t, v, e]);
  // the second half of the hook: he settles, shuts his eyes, sinks into the pillow
  k("smile", T_BED + 0.2, 0.75, 0.4); k("brow", T_BED + 0.2, 0.3, 0.4);
  const SL = A.send.e - 0.45;
  k("blk", SL, 1, 0.3); k("hp", SL, 0.22, 0.5); k("hr", SL, 0.14, 0.5); k("smile", SL + 0.1, 0.6, 0.4); k("cheek", SL + 0.1, 0.6, 0.4); k("brow", SL + 0.1, 0.1, 0.4);
  k("smile", A.ask.s, 0.12, 0.6); k("cheek", A.ask.s, 0.1, 0.6); k("gape", A.ask.s + 0.15, 0.22, 0.6); k("hy", A.ask.s, 0.3, 0.8);
  // he bolts upright
  k("blk", T_UP - 0.02, 0, 0.05); k("lid", T_UP, -0.7, 0.08); k("brow", T_UP, 0.95, 0.08); k("smile", T_UP, -0.3, 0.1); k("cheek", T_UP, 0, 0.1); k("gape", T_UP, 0.45, 0.1);
  k("hp", T_UP, 0.05, 0.15); k("hr", T_UP, 0, 0.15); k("hy", T_UP, 0, 0.15); k("gy", T_UP, 0, 0.1); k("gx", T_UP, 0, 0.1);
  // and hisses at Claude
  const HI = T_UP + 0.3;
  k("tw", HI, 0.5, 0.25); k("hy", HI, 0.36, 0.22); k("lean", HI, 0.24, 0.3); k("hp", HI, 0.1, 0.2); k("brow", HI, -0.2, 0.2); k("anger", HI, 0.6, 0.2); k("lid", HI, -0.35, 0.2);
  k("smile", HI, -0.35, 0.2); k("gape", HI, 0, 0.15); k("gx", HI, 0.25, 0.2); k("pucker", HI, 0.25, 0.2);
  // Claude answers out loud: he freezes; then a finger to his lips
  const FR = T_TWO + 0.2, SH = A.notmine.s + 0.7;
  k("anger", FR, 0, 0.12); k("brow", FR, 0.95, 0.12); k("lid", FR, -0.75, 0.12); k("gape", FR, 0.55, 0.12); k("pucker", FR, 0, 0.1); k("lean", FR, 0.1, 0.2);
  k("gape", SH, 0, 0.12); k("pucker", SH, 0.7, 0.12); k("brow", SH, -0.1, 0.15); k("anger", SH, 0.35, 0.15); k("lean", SH, 0.26, 0.2);
  // betrayed, in three beats: the jaw drops at Claude; the eyes go to the laptop; the face falls and the eyes come to the lens
  k("pucker", T_BFACE - 0.1, 0, 0.1); k("anger", T_BFACE - 0.1, 0, 0.1); k("gape", T_BFACE - 0.05, 0.7, 0.1); k("brow", T_BFACE - 0.05, 0.9, 0.1); k("lid", T_BFACE - 0.05, -0.6, 0.1); k("lean", T_BFACE - 0.1, 0.08, 0.2); k("gx", T_BFACE - 0.05, 0.3, 0.1);
  k("gx", T_BFACE + 0.2, 0.95, 0.07); k("brow", T_BFACE + 0.2, 0.35, 0.1); k("sad", T_BFACE + 0.2, 0.45, 0.1); k("gape", T_BFACE + 0.2, 0.3, 0.1);
  k("gape", T_BFACE + 0.42, 0, 0.1); k("smile", T_BFACE + 0.42, -0.6, 0.12); k("sad", T_BFACE + 0.42, 0.9, 0.12); k("brow", T_BFACE + 0.42, -0.35, 0.12); k("lid", T_BFACE + 0.42, 0.12, 0.12);
  k("gx", T_BFACE + 0.42, 0.05, 0.1); k("hr", T_BFACE + 0.42, 0.09, 0.18); k("hp", T_BFACE + 0.42, 0.14, 0.18);
  // the boss asks, Claude answers: he shrinks, eyes on the laptop
  const SK = A.orange.s + 0.2;
  k("hy", SK, 0.5, 0.4); k("hp", SK, 0.05, 0.4); k("tw", SK, 0.75, 0.5); k("gx", SK, 0.2, 0.3); k("lean", SK, -0.06, 0.5); k("smile", SK, -0.4, 0.3); k("brow", SK, 0.6, 0.3); k("sad", SK, 0.5, 0.3); k("lid", SK, -0.3, 0.3); k("hr", SK, 0, 0.3); k("up", SK, 0.015, 0.4);
  // the screen comes round on him: the blanket to his chest, frozen
  const CL = T_CLUTCH[0];
  k("lid", CL, -0.8, 0.12); k("brow", CL, 0.95, 0.12); k("gape", CL, 0.35, 0.12); k("gx", CL, 0, 0.15); k("gy", CL, 0, 0.15); k("hy", CL, YAW_L - 0.8, 0.2); k("tw", CL, 0.8, 0.2); k("lean", CL, -0.05, 0.2); k("sad", CL, 0.3, 0.15); k("smile", CL, -0.2, 0.15);
  // "Good morning po, Ma'am.": a weak smile
  const GM = A.wave.s - 0.1;
  k("gape", GM - 0.15, 0, 0.12); k("smile", GM, 0.42, 0.25); k("cheek", GM, 0.3, 0.25); k("sad", GM, 0.65, 0.25); k("brow", GM, 0.45, 0.25); k("lid", GM, -0.25, 0.25); k("lean", GM, 0, 0.3);
  // he lets the blanket go and turns to Claude; leans to take the headset
  k("tw", T_HAND, 0.55, 0.4); k("hy", T_HAND, 0.3, 0.4); k("smile", T_HAND, 0, 0.4); k("cheek", T_HAND, 0, 0.3); k("sad", T_HAND, 0.3, 0.4); k("brow", T_HAND, 0.3, 0.4); k("lid", T_HAND, 0, 0.4);
  k("lean", T_TAKE[0], 0.3, 0.4); k("tw", T_TAKE[0], 0.45, 0.4); k("hy", T_TAKE[0], 0.2, 0.4); k("hp", T_TAKE[0], -0.1, 0.4);
  // the headset on: straight, to the laptop. He works it out as he says it.
  const W0 = T_WEAR - 0.05, AN = A.answer;
  k("lean", W0, 0.02, 0.05); k("tw", W0, 0.8, 0.05); k("hy", W0, YAW_L - 0.8, 0.05); k("up", W0, 0.012, 0.05); k("hp", W0, 0.02, 0.05);
  k("brow", W0, 0.45, 0.05); k("sad", W0, 0, 0.05); k("smile", W0, 0.08, 0.05); k("gx", W0, -0.45, 0.05); k("gy", W0, -0.45, 0.05); k("lid", W0, -0.1, 0.05);
  k("gx", AN.s + 0.5, 0, 0.25); k("gy", AN.s + 0.5, 0, 0.25); k("brow", AN.s + 0.5, 0.15, 0.3);
  k("sad", AN.s + 1.05, 0.5, 0.25); k("lid", AN.s + 1.05, 0.2, 0.25); k("smile", AN.s + 1.05, -0.2, 0.25); k("brow", AN.s + 1.05, -0.1, 0.25);
  k("sad", AN.s + 1.45, 0.85, 0.3); k("smile", AN.s + 1.45, -0.45, 0.3); k("gy", AN.s + 1.5, 0.55, 0.25); k("hp", AN.s + 1.5, 0.12, 0.3); k("up", AN.s + 1.5, -0.008, 0.4);
  k("gy", AN.e - 0.2, 0, 0.2); k("hp", AN.e - 0.2, 0.03, 0.25);
  // "So, Buloy. Sabado?": his shoulders come up
  k("up", A.sabado.s + 1.7, 0.02, 0.2); k("hp", A.sabado.s + 1.7, 0.1, 0.2); k("brow", A.sabado.s + 1.7, 0.7, 0.2); k("lid", A.sabado.s + 1.7, -0.4, 0.2);
  // he swallows and gives in; the shoulders drop
  const OP = A.opo;
  k("hp", OP.s - 0.5, 0.16, 0.15); k("hp", OP.s - 0.3, -0.02, 0.18); k("pucker", OP.s - 0.5, 0.2, 0.15); k("pucker", OP.s - 0.15, 0, 0.1); k("gx", OP.s - 0.5, 0.7, 0.15); k("gx", OP.s - 0.15, 0, 0.15); k("smile", OP.s - 0.5, -0.3, 0.15);
  k("smile", OP.s - 0.05, 0.45, 0.2); k("cheek", OP.s - 0.05, 0.25, 0.2); k("sad", OP.s - 0.05, 0.7, 0.2); k("brow", OP.s - 0.05, 0.35, 0.2); k("lid", OP.s - 0.05, 0, 0.2); k("up", OP.s - 0.05, 0, 0.3);
  k("smile", OP.s + 0.85, -0.35, 0.3); k("cheek", OP.s + 0.85, 0, 0.3); k("sad", OP.s + 0.85, 0.9, 0.3); k("brow", OP.s + 0.85, -0.3, 0.3);
  k("lean", OP.s + 1.25, 0.06, 0.5); k("up", OP.s + 1.25, -0.03, 0.5); k("hp", OP.s + 1.25, 0.28, 0.5); k("blk", OP.s + 1.4, 1, 0.3); k("gy", OP.s + 1.25, 0.6, 0.3);
  // he stares, drops back onto the pillow, goes under
  k("blk", T_FLOP - 0.25, 0, 0.12); k("lid", T_FLOP - 0.25, 0.3, 0.2); k("gy", T_FLOP - 0.25, 0, 0.2); k("hp", T_FLOP - 0.2, 0, 0.2); k("lean", T_FLOP - 0.2, 0.02, 0.2); k("up", T_FLOP - 0.2, 0, 0.2);
  k("tw", T_FALL[0], 0, 0.3); k("hy", T_FALL[0], 0.05, 0.3); k("hp", T_FALL[0], 0.18, 0.3); k("blk", T_FALL[0] + 0.15, 1, 0.2);
  for (const a of Object.values(bk)) a.sort((x, y) => x[0] - y[0]);
}
const B = (name, t) => track(bk[name], t, 0.3);
// Claude. yaw: which way he faces (TH_W the screen, TH_PIL the pillow, TH_BED the bed beside him with his face still toward the lens, TH_SIT Buloy sitting up).
const nearAngle = (a, ref) => a + Math.round((ref - a) / (2 * Math.PI)) * 2 * Math.PI;
const NEAR_OUT = 0.1, NEAR_UP = 0.085;
const TH_W = PSI0 + Math.PI, TH_PIL = nearAngle(yawTo(C_WORK, HEAD_L), TH_W), TH_SIT = nearAngle(yawTo(C_SIDE, HEAD_S), TH_W), TH_BED = 4.9;
// The first shot: his face to the lens and a little to the bed (Y_HOOK), then round to the laptop's side, still in view at the cut (Y_LAP). He comes square to the screen (TH_W) in T_ROUND, while the lens is on the bed.
// That way round his left nub and his microphone pass over the laptop's front edge: the nub goes out past the ear cup and up before it gets there (NEAR_OUT, NEAR_UP), and he hops as he comes square.
const Y_HOOK = -0.2, Y_LAP = 0.96, HY_HOOK = 0.28, T_ROUND = [T_BED + 0.08, T_BED + 0.78];
const ck = { yaw: [[0, Y_HOOK], [0.5, Y_LAP, Math.max(0.3, T_BED - 0.56)], [T_ROUND[0], TH_W, T_ROUND[1] - T_ROUND[0]]], lid: [[0, 1]], lookX: [[0, 0]] };
{
  const k = (name, t, v, e) => ck[name].push([t, v, e]);
  k("yaw", cutAt("w_turn", 0) - 0.12, TH_PIL - 0.1, 0.62); k("yaw", T_SNORE + 0.35, TH_W, 0.25);                             // slowly to the bed in the silence; back to the screen to answer
  k("lid", A.dunno.s - 0.15, 0.62, 0.15); k("lid", A.dunno.e + 0.3, 1, 0.3);                                                 // deadpan: the eyes half shut
  k("lookX", A.hiss.s + 0.5, 1, 0.2); k("lookX", T_TWO - 0.2, 0, 0.2);                                                       // the hiss: only his eyes go to the bed
  k("yaw", T_TWO - 0.2, TH_BED, 0.32); k("yaw", T_BFACE + 0.05, TH_W, 0.45);                                                 // he turns to the bed and answers out loud; back to the screen for the boss
  k("lid", A.turnlap.s - 0.1, 0.7, 0.2); k("lid", T_P0, 1, 0.2);
  k("yaw", T_P1, TH_SIT, 0.6);                                                                                              // after the push he comes round to Buloy
  k("yaw", T_NUB[0], TH_BED - 0.05, 0.3); k("yaw", T_WEAR, TH_SIT, 0.001);                                              // he holds the headset out across to the bed; then watches Buloy answer
  for (const a of Object.values(ck)) a.sort((x, y) => x[0] - y[0]);
}
const CK = (name, t) => track(ck[name], t, 0.4);
const _p = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();
const Q_LIE = new THREE.Quaternion().setFromAxisAngle(X_AX, LIE_X), Q_LAP = qY(0.1);
const REST_L = v3(0.2, 0.17, 0.27), REST_R = v3(-0.2, 0.17, 0.27);                                                           // his hands on the heap of blanket in his lap (in his torso's frame)
// ================= the cameras =================
const TILE_C = SCR_C.clone().add(v3((126 / MW - 0.5) * SCR_W, 0, 0)).addScaledVector(SCR_UP, (0.5 - 57 / MH) * SCR_H);          // the middle of the boss's tile, in the laptop's frame
const arr = (v) => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
const TEXT_SHOTS = { w_screen: 1, w_tile: 1, w_over: 1, w_notes: 1 };                                                        // the cameras near enough to read the screen; every other one gets it in shapes only
const SET = {
  name: "wfh",
  mode: () => "wfh",
  shots: {
    w_hook:   { p: [0.889, 2.533, 3.343], l: [0.19, 0.80, 0.58], fov: 30, d: [-0.023, -0.057, -0.091], ease: 1.4, cap: 1385 },   // frame 0 from the foot of the desk, high and to its right: Buloy's face and thumb straight over Claude and his headset, the screen beside them; it pushes in along its own line and settles (the bulb's cord hangs at x 0.9, z 2.7: a lens further right has it across the frame)
    w_bed:    { p: [-0.34, 1.6, 0.52], l: [-0.42, 0.9, -0.08], fov: 34, d: [0, -0.012, -0.012], cap: 1300 },                    // his face on the pillow, from over his own knees
    w_screen: { p: arr(lapPt(PSI0, v3(-0.55, 0.32, 0.95))), l: arr(lapPt(PSI0, SCR_C.clone().add(v3(0.03, -0.03, 0)))), fov: 34, d: [0.004, 0, -0.012], cap: 1385 },    // the screen from the bed's side, Claude's ear cup and microphone at the right edge
    w_tile:   { p: arr(lapPt(PSI0, TILE_C.clone().addScaledVector(SCR_N, 1.2))), l: arr(lapPt(PSI0, TILE_C)), fov: 19.4, d: [0, 0, 0], near: 0.9, cap: 1392 },   // her tile across the whole frame, square on (the lens stands behind Claude; the near plane cuts him away)
    w_turn:   { p: [-0.8, 2.25, -0.48], l: [-0.04, 0.67, 0.48], fov: 54, d: [0, 0, 0.02], cap: 1385 },                          // from over the headboard: the sleeper's head below, Claude beyond it turning from the screen until his eyes are on the bed
    w_snore:  { p: [-0.3, 1.95, 0.8], l: [-0.37, 0.86, 0.0], fov: 36, d: [0, 0, -0.02], cap: 1385 },                           // the lump and the sleeping face, from over the desk
    w_claude: { p: [1.3, 1.08, 0.7], l: [0.163, 0.985, 0.976], fov: 41, d: [-0.01, 0, 0.004], cap: 1385 },                     // Claude to the screen, from the right of the room: the plain left wall behind him
    w_up:     { p: [-0.3, 1.45, 2.3], l: [-0.38, 1.08, 0.48], fov: 36, d: [0, 0, -0.03], cap: 1150 },                          // Buloy bolt upright, from the foot of the bed (the caption on the dark of his chest, over the mark on it)
    w_two:    { p: [-0.55, 1.38, 2.3], l: [-0.02, 1.05, 0.8], fov: 55, d: [0.01, 0, -0.03], cap: 1385 },                        // Claude near, turned to the bed; Buloy sitting up beyond him
    w_cturn:  { p: [-0.52, 1.1, 1.85], l: [0.12, 0.97, 0.965], fov: 40, d: [0.008, 0, -0.012], cap: 1385 },                    // Claude close, still turned to the bed
    w_bface:  { p: [0.3, 1.33, 1.26], l: [-0.37, 1.265, 0.536], fov: 32, d: [0, 0, 0], cap: 1385 },                        // Buloy's face
    w_swivel: { p: [-0.9, 1.8, 0.82], l: [0.36, 1.03, 0.8], fov: 44, d: [0, 0, 0], cap: 1455 },                               // the stand from the bed's side: the nub on the laptop's corner, the screen coming round (the caption under his ear cup)
    w_caught: { p: arr(lapPt(PSI1, CAM_C.clone().addScaledVector(SCR_N, 0.03))), l: arr(HEAD_S.clone().add(v3(0, -0.26, 0))), fov: 58, d: [0, 0, 0], near: 0.05, cap: 1385 },   // what the laptop's own lens sees
    w_hand:   { p: [-1.1, 1.5, 2.28], l: [-0.12, 1.12, 0.76], fov: 50, d: [0, 0, 0], cap: 1385 },                              // square to the line between them: Buloy in profile on the left, Claude at the bed's edge of the desk on the right, the headset crossing
    w_bclose: { p: arr(lapPt(PSI1, v3(0, 0.3, 0.1))), l: arr(HEAD_S.clone().add(v3(0, -0.085, 0))), fov: 47, d: [0, 0, 0], near: 0.1, cap: 1385 },   // Buloy from the laptop, the headset on; his face high in the frame, the caption on his chest
    w_over:   { p: arr(HEAD_S.clone().addScaledVector(N1, 0.5).addScaledVector(X1, 0.27).add(v3(0, 0.16, 0))), l: arr(lapPt(PSI1, SCR_C)), fov: 38, d: [0, 0, 0], near: 0.1, cap: 1385 },   // over his shoulder to the screen that now faces him
    w_notes:  { p: arr(lapPt(PSI1, SCR_C.clone().addScaledVector(SCR_N, 0.77).add(v3(0.127, 0, 0)))), l: arr(lapPt(PSI1, SCR_C.clone().add(v3(0.127, -0.03, 0)))), fov: 70, d: [0, 0, 0], near: 0.1, cap: 470 },   // the notes from where Buloy sits, Claude's near eye and his nub on the keys at their edge
    w_flop:   { p: [-0.25, 2.15, 2.2], l: [-0.37, 0.85, 0.02], fov: 36, d: [0, 0, -0.03], cap: 1385, capCard: 1380 },             // the bed from its foot: he drops back and goes under
  },
  keys: () => [{ t: 0.02, label: "first-frame" }, { t: 0.6, label: "thumb-up" }, { t: T_BED + 0.75, label: "hem-pulled" }, { t: T_SNORE + 0.3, label: "asleep" }, { t: T_UP + 0.5, label: "bolt-upright" },
    { t: T_P0 + 0.02, label: "nub-on-laptop" }, { t: T_P1 - 0.02, label: "laptop-pushed" }, { t: (T_P1 + T_STOP) / 2, label: "laptop-running-on" }, { t: T_STOP + 0.1, label: "laptop-turned" },
    { t: T_CAUGHT + 0.3, label: "blanket-clutched" }, { t: A.wave.s + 0.6, label: "wave" }, { t: T_NUB[1] + 0.02, label: "nubs-on-cups" }, { t: T_LIFT[1], label: "headset-lifted" }, { t: T_SNAP[1] + 0.05, label: "headset-sprung" },
    { t: T_OFFER[1] + 0.1, label: "headset-held-out" }, { t: T_GRASP[1] + 0.01, label: "hand-on-band" }, { t: T_LETGO[1] + 0.02, label: "headset-taken" }, { t: T_WEAR + 0.04, label: "headset-on-buloy" },
    { t: A.opo.e, label: "shoulders-drop" }, { t: T_NOTES + 0.65, label: "typing" }, { t: T_CHECK - 0.03, label: "tick-key" }, { t: T_CHECK + 0.1, label: "notes-tick" }, { t: T_PULL[1] + 0.1, label: "blanket-over-face" }],
  update(t, ctx) {
    const shot = ctx.shot, SH = SHOTS[shot] || SHOTS.w_hook, vAmp = ampAt("viron", t), cAmp = ampAt("claude", t), bAmp = ampAt("boss", t), cTalk = ctx.cTalk || 0;
    const sit = sitAt(t), sitC = clamp01(sit), psi = lapYaw(t), worn = t >= T_WEAR;

    // =============== the light ===============
    hemi.color.setRGB(DAY.hemiC[0], DAY.hemiC[1], DAY.hemiC[2]); hemi.groundColor.setRGB(DAY.hemiG[0], DAY.hemiG[1], DAY.hemiG[2]); hemi.intensity = DAY.hemiI;
    duskRim.intensity = 0; sun.intensity = DAY.sun; grade.uniforms.uExposure.value = DAY.exposure; RIM.uRimColor.value.setRGB(DAY.rim[0], DAY.rim[1], DAY.rim[2]);
    // the bounce comes from wherever the lens is, a little above it: whatever faces the camera is lit
    _p.set(SH.p[0] - SH.l[0], 0, SH.p[2] - SH.l[2]).normalize(); _p2.set(SH.l[0], SH.l[1], SH.l[2]);
    skyFill.target.position.copy(_p2); skyFill.target.updateMatrixWorld(); skyFill.position.copy(_p2).addScaledVector(_p, 6).setY(_p2.y + 3.2); skyFill.color.setRGB(1.0, 0.96, 0.9); skyFill.intensity = DAY.fill;
    const close = shot === "w_bed" || shot === "w_up" || shot === "w_cturn" || shot === "w_bface" || shot === "w_caught" || shot === "w_bclose" || shot === "w_hand" || shot === "w_snore";
    faceL.intensity = close ? DAY.face : 0; faceL.position.set(SH.l[0], SH.l[1], SH.l[2]).addScaledVector(_p, 0.85).setY(SH.l[1] + 0.22);
    if (shot === "w_caught" || shot === "w_bclose") faceL.color.setRGB(0.9, 0.94, 1.0); else faceL.color.setRGB(1.0, 0.95, 0.88);          // facing the screen, the light on his face is the screen's
    sfanBlades.rotation.z = t * 15; sfanHead.rotation.y = 0.5 * Math.sin(t * 0.9);
    ROUTER_LED.forEach((m, i) => { m.visible = i === 0 || Math.floor(t * (5 + i * 2.3) + i) % 2 === 0; });

    // =============== the meeting, the laptop ===============
    const eye = env(T_EYE, A.turnlap.s + 0.2, t, 0.22, 0.14), self = t < T_P0 + 0.1 ? "claude" : t < T_STOP ? "blur" : worn ? "buloyhs" : "buloy";
    drawMeet({ t, amp: clamp01(bAmp * 1.2), eye, dart: 0.75 * Math.sin((t - T_EYE) * 4.2), self, notes: t >= T_NOTES, check: t >= T_CHECK ? 1 : 0, text: !!TEXT_SHOTS[shot] });
    const sv = t - T_STOP; lap.open(LID_A + (sv > 0 ? 0.07 * Math.sin(sv * 30) * Math.exp(-sv * 8) : 0));                        // the lid shivers as it stops
    gripRest(lap, LAPV, qY(psi), standP);
    lapGlow.intensity = DAY.screen;

    // =============== Buloy: where he is, his back, his head ===============
    _p.copy(HIP_L).lerp(HIP_S, sitC); V.position.set(_p.x, _p.y - 0.52, _p.z); V.rotation.set(0, 0, 0);
    const hipX = _p.x, hipY = _p.y, hipZ = _p.z;
    const asleep = env(A.send.e + 0.25, T_UP, t, 0.5, 0.04), su = (t - (T_SNORE - 0.14)) / 0.95, snore = t < T_UP && su > 0 && su < 1 ? Math.sin(su * Math.PI) : 0, breath = Math.sin(t * 2.1);
    const SHH = A.notmine.s + 0.7, noShake = 0.09 * Math.sin((t - SHH) * 22) * env(SHH + 0.2, SHH + 0.75, t, 0.1, 0.15);
    const tw = B("tw", t) * sitC, lean = B("lean", t), up = B("up", t) * sitC;
    vUpper.rotation.set(lerp(LIE_X, lean + Math.sin(t * 1.3) * 0.006, sit), tw, 0); vUpper.position.y = 0.52 + up;
    vHead.rotation.set(B("hp", t) + Math.sin(t * 1.13 + 2) * 0.006 * (1 - asleep), B("hy", t) + (shot === "w_hook" ? HY_HOOK : 0) + noShake + Math.sin(t * 0.7) * 0.008 * (1 - asleep), B("hr", t));   // in the first shot the lens is to the right of the bed's foot: he grins at it
    const f = { ...faceBase, smile: B("smile", t), cheek: clamp01(B("cheek", t)), brow: B("brow", t), lid: B("lid", t), gx: B("gx", t), gy: B("gy", t), sad: clamp01(B("sad", t)), anger: clamp01(B("anger", t)), pucker: clamp01(B("pucker", t)) };
    f.open = Math.max(clamp01(vAmp * 1.25), 0.55 * B("gape", t) * (1 + 0.5 * breath * asleep), 0.6 * snore);
    const calm = f.lid > -0.3 && asleep < 0.5 ? 1 : 0, dr = eyeDrift(t);
    f.blink = Math.max(clamp01(B("blk", t)), calm * blinkAt(t, 1.2, 4.1) * (t < 1.4 ? 0 : 1), Math.exp(-(((t - (T_CAUGHT + 0.5)) / 0.07) ** 2)), Math.exp(-(((t - (T_BFACE + 0.57)) / 0.06) ** 2)));
    f.gx += dr[0] * 0.3 * calm; f.gy += dr[1] * 0.3 * calm;
    Object.assign(bulFace, f); buloy.draw(bulFace);
    const wild = smooth((t - T_UP) / 0.12) * (worn ? HAIR_WORN : 1);                                                               // his hair, on end after the blanket
    hairTips.forEach((k, i) => { const a = i % 2 ? 0.5 : 1.6, f = 1 + a * wild; k.m.visible = !(worn && !k.worn); k.m.scale.set(k.s.x, k.s.y * (worn ? Math.min(f, k.worn || 1) : f), k.s.z); });
    const lShow = t < A.ask.s + 0.05 || t >= T_UP + 0.07, rShow = t >= T_UP + 0.07; armL.yaw.visible = lShow; armR.yaw.visible = rShow;

    // =============== Claude: where he faces, how he tips, his eyes, his free nubs ===============
    const pu = clamp01((t - T_P0) / (T_P1 - T_P0)), pushOff = t < T_P0 ? 0 : t < T_P1 ? -PUSH * pu * pu : -PUSH * (1 - smooth((t - T_P1) / 0.35));
    const offer = t < T_WEAR ? ramp(T_OFFER[0], T_OFFER[1], t) : 0, hop = ramp(T_P1 + 0.02, T_P1 + 0.5, t);                        // he holds the offer still until the cut: the headset is in Buloy's hand by then
    const typeW = env(T_NOTES - 0.25, T_CHECK + 0.3, t, 0.25, 0.3), side = 0.22 * typeW, sideUp = Math.max(0, 0.24 * Math.sin(side) - 0.05);      // typing, he leans over the keys: his right
    const tip = 0.42 * offer, bob = cTalk * 0.018, ext = 0.075 * Math.sin(tip) + bob + sideUp;
    if (t >= T_HAND && t < T_WEAR) C.position.copy(C_GIVE); else { C.position.copy(C_WORK).lerp(C_SIDE, hop); C.position.y += hop < 1 ? 0.035 * Math.sin(Math.PI * hop) : 0; }
    if (t > T_ROUND[0] && t < T_ROUND[1]) C.position.y += 0.05 * Math.sin(Math.PI * (t - T_ROUND[0]) / (T_ROUND[1] - T_ROUND[0]));              // the hop that brings him square to the screen: his microphone goes over the deck, not through it
    C.rotation.set(0, CK("yaw", t) + pushOff + Math.sin(t * 0.7) * 0.01, 0);
    cBody.rotation.set(tip, 0, side + Math.sin(t * 0.9) * 0.008); cBody.position.y = 0.085 + 0.12 * Math.sin(tip) + bob + sideUp;
    cBody.scale.set(1, 1 - cTalk * 0.07 + Math.sin(t * 1.7) * 0.01, 1);                                                      // he squashes only downward: the headset is as wide as his block and no wider
    cLegs.forEach((leg, i) => { const e = ext + Math.max(0, [-0.18, -0.1, 0.1, 0.18][i] * Math.sin(side) * 1.05); leg.rotation.x = 0; leg.scale.y = 0.095 + e; leg.position.y = 0.045 + e / 2; });   // feet planted: the legs take up what the body tips
    const cb = Math.min(1 - blinkAt(t, 2.3, 3.7) * 0.9, 1 - 0.95 * Math.exp(-(((t - (A.dunno.s - 0.3)) / 0.1) ** 2))), lookX = CK("lookX", t);
    cEyes.forEach((e, i) => { e.visible = true; e.scale.set(0.04, 0.08 * cb * CK("lid", t), 0.012); e.position.set((i ? 1 : -1) * 0.14 + 0.03 * lookX, 0.2, 0.121); });
    const pre = ramp(T_NUB[0] - 0.18, T_NUB[0], t) * (1 - ramp(T_LETGO[1], T_LETGO[1] + 0.25, t));                                   // before they go up to the ear cups the nubs come out sideways, so they rise beside the cups and not through them
    cArms[0].position.set(-0.275 - 0.1 * pre, 0.13 + cAmp * 0.03 * Math.sin(t * 11), 0.02); cArms[1].position.set(0.275 + 0.1 * pre, 0.13 + cAmp * 0.03 * Math.sin(t * 11 + 2), 0.02);
    if (t < T_ROUND[1]) {                                                                                                     // the first turn: his left nub goes out past the ear cup, then up, and rides over the laptop's front edge as if to the keys; it comes down the same way once he is square
      const nearOut = ramp(0.5, 0.65, t) * (1 - ramp(T_ROUND[0] + 0.55, T_ROUND[1], t)), nearUp = ramp(0.62, 0.82, t) * (1 - ramp(T_ROUND[0] + 0.4, T_ROUND[0] + 0.55, t));
      cArms[1].position.x += NEAR_OUT * nearOut; cArms[1].position.y += NEAR_UP * nearUp;
    }
    room.updateMatrixWorld(true);

    // =============== the blanket ===============
    const hemUp = ramp(T_BED + 0.5, T_BED + 0.95, t), pull = ramp(T_PULL[0], T_PULL[1], t), late = t > T_FLOP - 1;
    const clutch2 = ramp(T_FLOP - 0.55, T_FLOP - 0.2, t);                                                                     // before the last shot he takes the blanket to his chest again, as when the screen came round on him: he drops back holding it. (His hands used to go for the hem in the fall itself, and went through it on the way.)
    const clutch = Math.max(ramp(T_CLUTCH[0], T_CLUTCH[1], t) * (1 - ramp(T_HAND - 0.3, T_HAND - 0.05, t)), clutch2), covLie = 1 - sitC;
    const hRl = late ? lerp(0.5, 0.86, pull) : lerp(0.5, 0.535, hemUp), hLl = late ? lerp(0.5, 0.86, pull) : lerp(0.34, 0.535, ramp(T_BED + 0.12, T_BED + 0.95, t)), hSit = lerp(0.03, 0.44, clutch);
    vUpper.getWorldQuaternion(_q); _q2.copy(Q_LAP).slerp(_q, clutch).slerp(Q_LIE, covLie * (1 - clutch2));                       // held to his chest it falls with his chest: turned ahead of him toward the pillow, his hoodie came through it
    kumotCover(_p.set(hipX, hipY, hipZ), _q2, lerp(hSit, hRl, covLie), lerp(hSit, hLl, covLie), lerp(lerp(0.34, 0.26, clutch), 0.34 * (1 + 0.05 * breath * asleep + 0.14 * snore), covLie), lerp(lerp(0.3, 0.21, clutch), 0.02 + 0.02 * snore, covLie));
    kLegs.position.set(XB - 0.03, BED.top + 0.1, hipZ + 0.52); kLap.position.set(hipX, hipY, hipZ); kLap.rotation.y = 0.1; kLap.scale.setScalar(Math.max(0.001, sitC)); kLap.visible = sitC > 0.02;
    kumot.g.updateMatrixWorld(true);

    // =============== Buloy's hands: what they do free ===============
    V.updateMatrixWorld(true);
    const wThumb = 1 - ramp(T_BED + 0.05, T_BED + 0.35, t), bounce = t < T_BED ? 0.03 * Math.abs(Math.sin(t * 10.5)) * Math.exp(-t * 1.6) : 0;
    const wCup = env(T_UP + 0.28, T_TWO + 0.12, t, 0.2, 0.2), wShh = env(SHH - 0.1, T_BFACE - 0.02, t, 0.18, 0.2), wWave = env(A.wave.s + 0.05, T_HAND - 0.02, t, 0.16, 0.2), wiggle = env(A.wave.s + 0.1, A.wave.e - 0.1, t, 0.1, 0.25);
    vHead.updateMatrix();
    const cupP = _p.set(-0.078, 0.062, 0.115).applyMatrix4(vHead.matrix).clone(), shhP = _p.set(0.012, -0.035, 0.125).applyMatrix4(vHead.matrix).clone();
    const restL = v3(hipX + 0.12, hipY + 0.145, hipZ + 0.2), restR = v3(hipX - 0.2, hipY + 0.19, hipZ + 0.2);                    // on the heap of blanket in his lap: fixed to the bed, not to his turning back
    reach(bulRig, 1, [[0, restL]], t, REST_L, t < A.ask.s + 0.1 ? [[wThumb, v3(0.34, 0.24, 0.4 + bounce)]] : null);
    reach(bulRig, -1, [[0, restR]], t, REST_R, [[wCup, cupP], [wShh, shhP], [wWave, v3(-0.15, 0.6 + 0.012 * Math.sin(t * 9) * wiggle, 0.2)]]);
    armL.hand.quaternion.identity(); armR.hand.quaternion.identity(); V.updateMatrixWorld(true);
    vHead.getWorldQuaternion(_q); const hUp = _p.set(0, 1, 0).applyQuaternion(_q).clone(), hFw = _p.set(0, 0, 1).applyQuaternion(_q).clone(), hLf = _p.set(1, 0, 0).applyQuaternion(_q).clone();
    vUpper.getWorldQuaternion(_q); const tFw = _p.set(0, 0, 1).applyQuaternion(_q).clone();
    const restW = sitC * (1 - Math.max(wCup, wShh, wWave));
    if (wThumb > 0.001 && t < A.ask.s) orientHand(armL.hand, _p.set(0, 0.56, 0.83), _p2.set(-1, 0, 0), wThumb);                    // the fist along his arm, the palm to his own right: the thumb stands up
    else if (sitC > 0.001) orientHand(armL.hand, _p.set(0, -0.12, 1), _p2.set(0, -1, 0), sitC);                                    // flat on his lap, fingers down the bed
    if (restW > 0.001) orientHand(armR.hand, _p.set(0, -0.12, 1), _p2.set(0, -1, 0), restW);
    if (wCup > 0.001) orientHand(armR.hand, _p.copy(hUp).addScaledVector(hFw, 0.55), _p2.copy(hLf).addScaledVector(hFw, 0.25), wCup);     // cupped beside his mouth, the palm toward it
    if (wShh > 0.001) orientHand(armR.hand, hUp, _p.copy(hLf).addScaledVector(hFw, -0.4), wShh);                                 // one finger up before his lips
    if (wWave > 0.001) orientHand(armR.hand, _p.set(0.1 * Math.sin(t * 9) * wiggle, 1, 0).normalize(), tFw, wWave);                        // a small wave, the palm to the laptop
    armL.H.pose = wThumb > 0.3 && t < A.ask.s ? THUMB_UP(1) : HAND_POSES.flat;
    armR.H.pose = wShh > 0.4 ? HAND_POSES.point : wWave > 0.4 ? mixPose(HAND_POSES.open, HAND_POSES.relaxed, (0.5 + 0.5 * Math.sin(t * 17)) * wiggle) : wCup > 0.4 ? HAND_POSES.cheek : HAND_POSES.flat;
    V.updateMatrixWorld(true);

    // =============== his hands on the blanket's hem ===============
    const waveOff = ramp(A.wave.s - 0.04, A.wave.s + 0.1, t);
    const bedL = ramp(T_BED + 0.05, T_BED + 0.45, t) * (1 - ramp(A.ask.s - 0.1, A.ask.s + 0.05, t)), clutchW = ramp(T_CLUTCH[0], T_CLUTCH[1], t) * (1 - ramp(T_HAND - 0.3, T_HAND - 0.05, t)), flopW = ramp(T_FALL[0], T_FALL[1], t);      // his hands meet the hem as it comes up to his chest; at the end, as he lands on the pillow
    const wHL = Math.max(bedL, clutchW, clutch2), wHR = Math.max(clutchW * (1 - waveOff), clutch2), grasp = (w) => smooth((w - 0.85) / 0.15);
    const hems = [];
    const under = bedL <= 0, hx = clutchW > 0 ? 0.12 : under ? 0.05 : -0.005;                                                        // only the first pull is from outside: after that his hands are behind the blanket and his fingers come over its edge
    if (wHL > 0.001 && lShow) hems.push({ A: BL, sk: "hem", x: -hx, under, w: wHL, g: grasp(wHL), clear: 0.05, arc: 0.02 });
    if (wHR > 0.001 && rShow) hems.push({ A: BR, sk: "hem", x: hx, under, w: wHR, g: grasp(wHR), clear: 0.05, arc: 0.02 });
    const behind = shot === "w_caught" ? clutchW : 0;                                                                        // seen from in front, an arm that holds the blanket up from behind it is behind it
    for (const m of SLEEVE_L) m.visible = !(flopW > 0.02 || behind > 0.5); for (const m of SLEEVE_R) m.visible = !(flopW > 0.02 || behind * (1 - waveOff) > 0.5);   // in the last shot his arms are seen while he sits; they go under as the fall begins (later, a cuff came through the blanket's face)
    gripHold(kumot, ORIGIN, IDENT, hems, { state: "rest", on: bedP });

    // =============== the headset ===============
    const snap = ramp(T_SNAP[0], T_SNAP[1], t), ss = t - T_SNAP[1], boing = ss > 0 && !worn ? 0.1 * Math.sin(ss * 34) * Math.exp(-ss * 9) : 0;
    hsShape(lerp(HS.W_C, HS.W_B, snap) * (1 + boing), lerp(HS.H_C, HS.H_B, snap) * (1 - 0.5 * boing));
    if (worn) { const on = hsOnBuloy(); gripRest(hset, on.pos, on.quat, bulHeadP); }
    else {
      const on = hsOnClaude(), lift = ramp(T_LIFT[0], T_LIFT[1], t), nubW = ramp(T_NUB[0], T_NUB[1], t) * (1 - ramp(T_LETGO[0], T_LETGO[1], t));
      const wTake = ramp(T_TAKE[0], T_TAKE[1], t), away = ramp(T_AWAY[0], T_AWAY[1], t);
      _p.copy(on.pos).addScaledVector(_p2.set(0, 1, 0).applyQuaternion(on.quat), 0.13 * lift).addScaledVector(_p3.set(0, 0, 1).applyQuaternion(on.quat), 0.1 * offer);
      _q.copy(on.quat);
      if (lift <= 0) gripRest(hset, _p, _q, headP);
      else {
        if (away > 0) _p.y += 0.04 * away;                                                                                  // he lifts it clear of the nubs
        gripHold(hset, _p, _q, wTake > 0.001 ? [{ A: BL, sk: "band", w: wTake, g: ramp(T_GRASP[0], T_GRASP[1], t), clear: 0.07, arc: 0.03 }] : [], { carrier: t >= T_LETGO[0] ? 0 : -1 });
      }
      if (nubW > 0.001) nubHold(hset, [{ i: 0, ...hsNub(-1), w: nubW }, { i: 1, ...hsNub(1), w: nubW }]);
    }

    // =============== Claude's nubs on the laptop: the push that turns it; later, the keys ===============
    const pushW = ramp(T_SWIVEL - 0.25, T_P0 - 0.02, t) * (1 - ramp(T_P1, T_P1 + 0.12, t));
    if (pushW > 0.001) nubHold(lap, [{ i: 1, p: v3(-LW / 2 + 0.05, 0.022, LDP / 2), n: Z_AX, w: pushW }]);
    if (typeW > 0.001) {                                                                                                    // the right nub goes over the laptop's edge from above, and taps
      cBody.getWorldQuaternion(_q).invert(); _p2.set(0, 1, 0).applyQuaternion(_q);
      const round = 0.015 * CS * (Math.abs(_p2.x) + Math.abs(_p2.y) + Math.abs(_p2.z) - 1) * 1.33;
      const kp = v3(LW * 0.33 + 0.015 * Math.sin(t * 13), LTH / 2 - 0.04 * CS * (1 - cBody.scale.y) - round, -LDP * 0.16);
      lap.g.updateWorldMatrix(true, false); _p.copy(kp).setY(kp.y + 0.075).applyMatrix4(lap.g.matrixWorld); cBody.worldToLocal(_p);
      cArms[0].position.lerp(_p, typeW); cArms[0].position.y += 0.07 * Math.sin(Math.PI * typeW);
      const TYPE_END = T_NOTES + 1.3;                                                                                       // the length of the typing sound (script.json, audio): the taps stop with it; one last key lands the tick
      const tapW = t < TYPE_END ? clamp01(Math.abs(Math.sin(t * Math.PI * 4.5)) * 1.7) * (1 - ramp(TYPE_END - 0.08, TYPE_END, t)) : Math.exp(-(((t - T_CHECK + 0.03) / 0.06) ** 2));
      if (typeW > 0.98 && tapW > 0.001) nubHold(lap, [{ i: 0, p: kp, n: Y_AX, w: tapW }]);
    }
  },
};
