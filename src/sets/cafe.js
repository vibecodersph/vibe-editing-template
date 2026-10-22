// ---------- SET: a café, a long table, a big laptop ----------
// Inside a café, Buloy on a banquette sofa at two pushed-together tables,
// a 16-inch MacBook Pro whose screen the camera can see (it carries every state dbnight's monitor carried), Claude on the table in front of it, an iced americano in a clear cup with the
// brown and cream round logo, a plate of blueberry cheesecake. Warm, well lit: wood, green, pendant lamps, window daylight, a counter in the back. Passers-by cross behind him; faceless figures
// (never a face) stand in the queue and sit at the window bar; a blurred dark silhouette crosses the lens edge in a few shots only.
// World: the lens side is +z. Buloy sits at x -0.55 on the banquette (seat top 0.46), the table top is y 0.74 (x -1.3 .. 1.3, z 0.05 .. 0.88). The laptop stands at x 0.18, its screen turned a little toward the
// lens and Buloy; Claude stands on the table in front of and beside it, so a camera held a little high sees the screen over his head (the stacked layout of dbnight's d_claude).
// The screen is a canvas drawn every frame (drawMon) and carries every number, so no number is spoken. Words are drawn only for cameras near enough to read them (TEXT_SHOTS); other cameras get bars.
// The sticky note AYUSIN BUKAS (CK-21) lies on the laptop's palm rest, right of the trackpad. The word for the branch appears nowhere.

// ================= THE COLOUR GRADE: the one place a later step swaps per variant =================
// Every number that sets the look of the finish lives in GRADE_VARIANTS. Pick one with window.CAFE_GRADE = "matte" before the scene runs, or change GRADE below; nothing else in this file sets a grade.
//   exposure   overall brightness (1 = as lit)        sat      colour saturation (1 = neutral)
//   contrast   strength of the S-curve (0 = none)      lift     black level, 0 .. 0.1 (raises the blacks: the matte look)
//   shadowTint rgb added to the darks                  hiTint   rgb added to the lights
//   vignette   edge darkening (0 = none)               grain    film grain amplitude (0 = none)       levels   palette steps per channel
const GRADE_VARIANTS = {
  natural: { exposure: 1.0,  sat: 1.0,  contrast: 0.22, lift: 0.02, shadowTint: [0.004, 0.004, 0.012], hiTint: [0.018, 0.010, -0.004], vignette: 0.20, grain: 0.010, levels: 48 },
  matte:   { exposure: 0.99, sat: 0.88, contrast: 0.08, lift: 0.08,  shadowTint: [0.012, 0.016, 0.024], hiTint: [0.016, 0.010, -0.002], vignette: 0.14, grain: 0.022, levels: 48 },   // lifted cool blacks, low contrast, a little faded film
  warm:    { exposure: 1.05, sat: 1.04, contrast: 0.16, lift: 0.03,  shadowTint: [0.016, 0.008, 0.000], hiTint: [0.046, 0.026, -0.024], vignette: 0.22, grain: 0.012, levels: 48 },   // soft golden afternoon
  "teal-orange": { exposure: 1.0, sat: 1.0, contrast: 0.30, lift: 0.015, shadowTint: [-0.020, 0.014, 0.034], hiTint: [0.034, 0.014, -0.026], vignette: 0.24, grain: 0.012, levels: 48 }, // restrained: teal shadows, orange lights, skin stays near natural
  pastel:  { exposure: 1.08, sat: 0.70, contrast: 0.06, lift: 0.06,  shadowTint: [0.012, 0.010, 0.026], hiTint: [0.020, 0.008, 0.014], vignette: 0.10, grain: 0.010, levels: 44 },   // soft, muted, low saturation
  lofi:    { exposure: 1.0, sat: 0.62, contrast: 0.20, lift: 0.045, shadowTint: [0.000, 0.010, 0.014], hiTint: [0.010, 0.008, -0.006], vignette: 0.30, grain: 0.085, levels: 34 },   // raw phone footage: flat colour, visible moving grain
};
const GRADE = GRADE_VARIANTS[window.CAFE_GRADE || "warm"] || GRADE_VARIANTS.warm;
{                                                                                                                         // make the shared grade pass read GRADE (kept apart from the lib: only this set changes the shader)
  const fs = grade.material.fragmentShader;
  if (!fs.includes("uLift")) {
    let f = fs.replace("uniform float uExposure, uSat, uLevels, uFade;", "uniform float uExposure, uSat, uLevels, uFade, uCon, uLift, uVig, uGrain; uniform vec3 uShadowTint, uHiTint; uniform float uSeed;");
    f = f.replace("s = mix(s, s*s*(3.0-2.0*s), 0.32);", "s = mix(s, s*s*(3.0-2.0*s), uCon); s = uLift + s * (1.0 - uLift);");
    f = f.replace("s += vec3(0.012, 0.0, 0.045) * (1.0 - l2) + vec3(0.03, 0.012, -0.012) * l2;", "s += uShadowTint * (1.0 - l2) + uHiTint * l2;");
    f = f.replace("s *= 1.0 - 0.34 * pow(length(q) * 1.42, 2.6);", "s *= 1.0 - uVig * pow(length(q) * 1.42, 2.6);");
    f = f.replace("s = floor(s * uLevels", "s += (fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * uGrain; s = floor(s * uLevels");
    grade.material.fragmentShader = f;
    Object.assign(grade.uniforms, { uCon: { value: 0.3 }, uLift: { value: 0 }, uVig: { value: 0.3 }, uGrain: { value: 0 }, uSeed: { value: 0 }, uShadowTint: { value: new THREE.Vector3() }, uHiTint: { value: new THREE.Vector3() } });
    grade.material.needsUpdate = true;
  }
}
const applyGrade = (t = 0) => {                                                                                              // the grain seed moves twelve times a second
  const u = grade.uniforms; u.uSeed.value = Math.floor(t * 12) * 37.7; u.uExposure.value = GRADE.exposure; u.uSat.value = GRADE.sat; u.uCon.value = GRADE.contrast; u.uLift.value = GRADE.lift; u.uVig.value = GRADE.vignette; u.uGrain.value = GRADE.grain; u.uLevels.value = GRADE.levels;
  u.uShadowTint.value.set(...GRADE.shadowTint); u.uHiTint.value.set(...GRADE.hiTint);
};

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0xc9d2cc); scene.fog = null;
RIM.uRimWorld.value.set(-0.3, 0.5, -0.8).normalize();                                // the rim comes from the window behind him: daylight over shoulders and hair

const LN = TL.lines, NO_LINE = { s: 1e9, e: 1e9 }, actLine = (name) => LN.find((l) => l.act === name) || NO_LINE;
const A = {}; for (const n of ["hook","alin","confused","list","old","main","why","april","who","users","please","folder","yes","empty","patay","copy","say","sabi","save","restore","ano","final"]) A[n] = actLine((["hook","confused","old","why","who","please","yes","patay","say","save","ano"].includes(n) ? "b_" : "c_") + n);
const win = (ln, t, pi = 0.2, po = 0.3) => smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3));
const env = (a, b, t, ei = 0.25, eo = 0.3) => smooth((t - a) / ei) * (1 - smooth((t - b) / eo));
const lerp = (a, b, w) => a + (b - a) * w;
const HAS = (n) => ASSET.has(n);
const DESK_Y = 0.74, CS = 0.85, BUL = [-0.42, 0.023, -0.02];                                                                  // 0.023: the sole of his sneakers sits that far under his own origin, so he stands on the floor instead of in it
const GREEN = 0xa0522d, GREEN_D = 0x5c2e1a, WOOD = 0xb98a5a;

// ================= the room =================
const FLOORT = painted(32, 32, (g) => {
  g.fillStyle = "#a88563"; g.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#b49070" : "#9d7b5a"; g.fillRect(0, i * 8, 32, 7); g.fillStyle = "#7f6246"; g.fillRect(0, i * 8 + 7, 32, 1); }
  g.fillStyle = "#7f6246"; g.fillRect(9, 0, 1, 7); g.fillRect(23, 8, 1, 7); g.fillRect(14, 16, 1, 7); g.fillRect(3, 24, 1, 7);
  speck(g, rng(5), 32, 32, 30, ["#bb9a78", "#92704f"]);
}, { repeat: true });
const WALLT = TEX.plaster("#efe6d2", "#e2d6bd", 11);
// Solid fixtures: one surface prop whose colliders QA tests every figure against (the floor, the walls, the banquette, the window bar, the counter). The side walls stop at the back wall: the street behind the glass has none.
const FIX = makeProp("fixtures", room, { surface: true }); FIX.seen = 1e9;
const col = (m, w, h, d, name) => { const n = new THREE.Object3D(); n.position.copy(m.position); n.quaternion.copy(m.quaternion); m.parent.add(n); FIX.part(n, "box", { h: [w / 2, h / 2, d / 2], name: name || "" }); return m; };   // an unscaled node at the mesh's place (box() meshes are unit cubes with a scale)
const floorM = col(tbox(room, 6.4, 0.1, 7.2, FLOORT, 0.9, 0, -0.05, 0.8, { noShadow: true }), 6.4, 0.1, 7.2, "floor"), FLOORM = floorM.material;
const wallB = col(tbox(room, 6.4, 3.0, 0.12, WALLT, 2.2, 0, 1.5, -2.06, { noShadow: true }), 6.4, 3.0, 0.12, "backwall"), WALLM = wallB.material;           // the back wall
col(tbox(room, 0.12, 3.0, 6.4, WALLT, 2.2, -3.2, 1.5, 1.2, { noShadow: true }), 0.12, 3.0, 6.4, "leftwall");
col(tbox(room, 0.12, 3.0, 6.4, WALLT, 2.2, 3.2, 1.5, 1.2, { noShadow: true }), 0.12, 3.0, 6.4, "rightwall");
box(room, 6.4, 0.1, 7.2, 0x4a3524, 0, 3.0, 0.8, { noShadow: true });                                                         // the ceiling: dark wood
for (let i = -6; i <= 6; i++) box(room, 0.05, 0.05, 7.2, 0x33261a, i * 0.5, 2.96, 0.8, { noShadow: true });                  // slats
box(room, 6.2, 0.9, 0.02, GREEN_D, 0, 0.45, -1.99, { noShadow: true });                                                     // the green wainscot on the back wall
box(room, 6.2, 0.04, 0.03, 0xd8b777, 0, 0.92, -1.98, { noShadow: true });
// the window wall: a wide glass front on the left two thirds of the back wall, daylight outside, street people crossing it
const streetTex = painted(160, 72, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 72); gr.addColorStop(0, "#d9ecf6"); gr.addColorStop(0.65, "#f4f1e2"); gr.addColorStop(1, "#e6dcc0"); g.fillStyle = gr; g.fillRect(0, 0, 160, 72);
  const r = rng(31);
  for (let i = 0; i < 9; i++) { const x = i * 19 + Math.floor(r() * 8), w = 14 + Math.floor(r() * 9), h = 18 + Math.floor(r() * 22); g.fillStyle = ["#c9c3b3", "#b9bdb5", "#d3c6ad", "#aeb8ba"][i % 4]; g.fillRect(x, 50 - h, w, h + 8); g.fillStyle = "#9aa5a8"; for (let yy = 50 - h + 3; yy < 54; yy += 6) g.fillRect(x + 3, yy, w - 6, 2); }
  for (const x of [14, 62, 118, 146]) { g.fillStyle = "#58763f"; g.beginPath(); g.arc(x, 44, 12, 0, 7); g.fill(); g.fillStyle = "#6f9250"; g.beginPath(); g.arc(x - 3, 41, 7, 0, 7); g.fill(); g.fillStyle = "#5a4630"; g.fillRect(x - 1, 50, 3, 14); }
  g.fillStyle = "#cfc7b4"; g.fillRect(0, 62, 160, 10); g.fillStyle = "#b5ad98"; g.fillRect(0, 62, 160, 1);
}, { mip: false });
const WINW = { x: -1.35, y: 1.62, w: 3.9, h: 1.65, z: -2.0 };
plane(room, WINW.w, WINW.h, new THREE.MeshBasicMaterial({ map: streetTex, color: new THREE.Color(1.12, 1.1, 1.04), fog: false }), WINW.x, WINW.y, WINW.z + 0.012);
for (let i = 0; i <= 4; i++) box(room, 0.05, WINW.h + 0.1, 0.06, 0x1f4a38, WINW.x - WINW.w / 2 + i * WINW.w / 4, WINW.y, WINW.z + 0.03, { noShadow: true });
for (const y of [WINW.y - WINW.h / 2, WINW.y + WINW.h / 2]) box(room, WINW.w + 0.1, 0.07, 0.08, 0x1f4a38, WINW.x, y, WINW.z + 0.03, { noShadow: true });
box(room, 0.06, WINW.h, 0.06, 0x1f4a38, WINW.x, WINW.y, WINW.z + 0.03, { noShadow: true });
// the window bar and its stools, plants on the sill
col(box(room, 3.6, 0.05, 0.4, 0x7a5636, WINW.x, 1.02, -1.78, { noShadow: true }), 3.6, 0.05, 0.4, "bar-top"); col(box(room, 3.4, 0.9, 0.05, 0x4a3420, WINW.x, 0.55, -1.9, { noShadow: true }), 3.4, 0.9, 0.05, "bar-front");
for (const x of [-2.4, -1.6, -0.8, -0.1]) { col(box(room, 0.02, 0.6, 0.02, 0x2a2a2e, x, 0.5, -1.4, { noShadow: true }), 0.02, 0.6, 0.02, "stool-peg"); { const n = new THREE.Object3D(); n.position.set(x, 0.8, -1.4); room.add(n); FIX.part(n, "cyl", { rad: 0.12, hl: 0.025, name: "stool-seat" }); } mesh(room, new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), mat(GREEN_D), x, 0.8, -1.4, { noShadow: true }); }
for (const [x, c] of [[-2.7, 0xb5613c], [-0.55, 0xd8d0bd]]) { mesh(room, new THREE.CylinderGeometry(0.06, 0.045, 0.1, 8), mat(c), x, 1.1, -1.78, { noShadow: true }); mesh(room, new THREE.SphereGeometry(0.075, 7, 5), mat(0x3f8a4a), x, 1.19, -1.78, { noShadow: true }); }
// the counter, right of the window: a wood front with green tile, a pastry case, a menu board and a round green sign above it (no words anywhere on them)
{
  const g = group(room, 1.75, 0, -1.15);
  col(box(g, 1.7, 1.02, 0.5, 0x6a4a2c, 0, 0.51, 0, { noShadow: true }), 1.7, 1.02, 0.5, "counter"); col(box(g, 1.76, 0.05, 0.56, 0xe9e2d2, 0, 1.04, 0, { noShadow: true }), 1.76, 0.05, 0.56, "counter-top");
  for (let i = 0; i < 9; i++) box(g, 0.18, 0.5, 0.012, i % 2 ? GREEN : 0x0a5c3c, -0.72 + i * 0.18, 0.46, 0.256, { noShadow: true });
  const bake = group(g, -0.45, 1.065, 0.02); box(bake, 0.62, 0.22, 0.34, 0xbfe0e6, 0, 0.11, 0, { alpha: 0.35, noShadow: true });
  for (let i = 0; i < 5; i++) box(bake, 0.09, 0.05, 0.1, [0xf0d9a8, 0xc98f58, 0xeab1c0, 0x9a6a4a, 0xf0d9a8][i], -0.24 + i * 0.12, 0.03, 0.05, { noShadow: true });
  box(g, 0.34, 0.2, 0.28, 0x2c2c32, 0.5, 1.17, -0.03, { noShadow: true }); box(g, 0.3, 0.05, 0.2, 0xb4b8c0, 0.5, 1.31, -0.03, { noShadow: true });               // the espresso machine
  const boardTex = painted(80, 40, (gg) => { gg.fillStyle = "#1c2a24"; gg.fillRect(0, 0, 80, 40); const r = rng(8), cc = ["#f2e8cf", "#9fd6b4", "#e8c56a"]; for (let y = 5; y < 36; y += 6) { gg.fillStyle = cc[y % 3 | 0 ? (y / 6 | 0) % 3 : 0]; gg.fillRect(5, y, 18 + Math.floor(r() * 26), 2); gg.fillRect(62, y, 12, 2); } }, { mip: false });
  plane(g, 1.4, 0.7, new THREE.MeshBasicMaterial({ map: boardTex, color: new THREE.Color(1.0, 1.0, 1.0) }), 0.1, 2.0, -0.47);
  const sign = painted(40, 40, (gg) => { gg.fillStyle = "#5b3a24"; gg.beginPath(); gg.arc(20, 20, 19, 0, 7); gg.fill(); gg.strokeStyle = "#f3e6cf"; gg.lineWidth = 2; gg.beginPath(); gg.arc(20, 20, 14, 0, 7); gg.stroke(); gg.fillStyle = "#f3e6cf"; gg.beginPath(); gg.arc(20, 20, 6, 0, 7); gg.fill(); }, { mip: false });
  plane(g, 0.42, 0.42, new THREE.MeshBasicMaterial({ map: sign, transparent: true, alphaTest: 0.5 }), -0.85, 2.0, -0.46);
}
// pendant lamps over the table
const PEND = [[-0.8, 0.45], [0.0, 0.45], [0.8, 0.45], [-1.7, 0.2], [1.7, 0.2]];
for (const [x, z] of PEND) {
  box(room, 0.01, 0.6, 0.01, 0x1a1a1a, x, 2.65, z, { noShadow: true });
  mesh(room, new THREE.CylinderGeometry(0.05, 0.16, 0.14, 12), mat(GREEN_D, { rim: 0.4 }), x, 2.3, z, { noShadow: true });
  mesh(room, new THREE.SphereGeometry(0.05, 8, 6), mat(0xfff0cc, { glow: 3.2 }), x, 2.22, z, { noShadow: true });
}

// ================= the banquette sofa, the long table (a surface), what lies on it =================
const SOFA = { x0: -1.5, x1: 1.0, z0: -0.55, z1: 0.11 };
{
  const cx = (SOFA.x0 + SOFA.x1) / 2, w = SOFA.x1 - SOFA.x0;
  col(box(room, w, 0.38, SOFA.z1 - SOFA.z0, 0x225e44, cx, 0.19, (SOFA.z0 + SOFA.z1) / 2, { noShadow: true }), w, 0.38, SOFA.z1 - SOFA.z0, "sofa-base");
  col(box(room, w - 0.06, 0.098, 0.56, 0x2f7a58, cx, 0.429, (SOFA.z0 + SOFA.z1) / 2 + 0.02, { noShadow: true }), w - 0.06, 0.098, 0.56, "sofa-seat");   // the seat's top is 0.478, where his thighs lie
  col(box(room, w, 0.66, 0.14, 0x225e44, cx, 0.79, SOFA.z0 + 0.07, { noShadow: true }), w, 0.66, 0.14, "sofa-back");
  for (let x = SOFA.x0 + 0.3; x < SOFA.x1; x += 0.36) { box(room, 0.012, 0.6, 0.01, 0x143f2d, x, 0.79, SOFA.z0 + 0.15, { noShadow: true }); for (const y of [0.62, 0.8, 0.98]) box(room, 0.03, 0.03, 0.012, 0xc8b070, x, y, SOFA.z0 + 0.152, { noShadow: true }); }
  col(box(room, w + 0.1, 0.05, 0.2, 0x6a4a2c, cx, 1.14, SOFA.z0 + 0.07, { noShadow: true }), w + 0.1, 0.05, 0.2, "sofa-cap");                 // the wood cap on the back
  box(room, 0.4, 0.34, 0.1, 0xe8d9b0, -1.15, 0.68, -0.34, { noShadow: true }).rotation.z = 0.08;                                // a cushion
}
const DK = { x0: -1.3, x1: 1.3, z0: 0.30, z1: 0.98 }, DCX = (DK.x0 + DK.x1) / 2, DCZ = (DK.z0 + DK.z1) / 2, DW = DK.x1 - DK.x0, DD = DK.z1 - DK.z0;
const WOODT = TEX.wood("#c39561", "#8a6238", "#d2a874", 5);
const deskP = makeProp("desk", room, { surface: true }); deskP.g.position.set(DCX, DESK_Y - 0.015, DCZ);
deskP.part(tbox(deskP.g, DW, 0.03, DD, WOODT, 0.6, 0, 0, 0), "box", { h: [DW / 2, 0.015, DD / 2] }); flatSocket(deskP, 0.015); deskP.seen = 1e9;
deskP.on = null;
const SOLIDS = [];                                                                                                                      // every loose solid on the table: QA tests each against the figures and against each other (sets of the lib's makeProp)
const solid = (name, on) => { const P = makeProp(name, room); P.on = on; P.state = "rest"; SOLIDS.push(P); return P; };
box(room, 0.012, 0.032, DD, 0x5a3d22, 0, DESK_Y - 0.015, DCZ, { noShadow: true });                                             // the seam between the two tables
for (const x of [-0.65, 0.65]) { mesh(room, new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), mat(0x26262a), x, 0.37, DCZ, { noShadow: true }); mesh(room, new THREE.CylinderGeometry(0.28, 0.3, 0.03, 12), mat(0x26262a), x, 0.015, DCZ, { noShadow: true }); }

// the logo, simplified: a brown disc, a cream ring, the wordmark (drawn only where a camera can read it), a star each side
const logoDraw = (words) => painted(64, 64, (g) => {
  g.fillStyle = "#5b3a24"; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill();
  g.strokeStyle = "#f3e6cf"; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.stroke();
  g.fillStyle = "#f3e6cf"; g.fillRect(31, 12, 3, 3); g.fillRect(31, 49, 3, 3);
  if (words && ATLAS && ATLAS.ptext) ATLAS.ptext(g, "KAPEHAN", 32, 28, "#f3e6cf", { font: 3, align: "center" });
  else { g.fillRect(14, 30, 36, 3); g.fillRect(20, 36, 24, 2); }
}, { mip: false });
const logoTexW = logoDraw(true), logoTexB = logoDraw(false);
// The table, seen from above (x to the right, z toward the lens): Buloy sits at x -0.42 with the banquette behind him and his hands on the table's edge (z 0.30); the plate is in front of him, the cup on his right hand's side,
// the laptop beside the plate turned toward him and the lens, Claude on its far side. Each one clear of the others by at least a hand's width; QA tests every pair.
const CUPX = -0.88, CUPZ = 0.64, CAKEX = -0.42, CAKEZ = 0.80;
const logoM = new THREE.MeshBasicMaterial({ map: logoTexB, transparent: true, alphaTest: 0.5, color: new THREE.Color(1, 1, 1) });
{
  const cup = group(room, CUPX, DESK_Y, CUPZ);                                                                                  // the iced americano, big as a venti: clear plastic, so its solid is a set of invisible colliders beside it (the prop's own meshes must be opaque)
  const cupP = solid("cup", deskP); cupP.g.position.set(CUPX, DESK_Y, CUPZ);
  const hit = (P, x, y, z, k, dims, rz = 0) => { const n = new THREE.Object3D(); n.position.set(x, y, z); n.rotation.z = rz; P.g.add(n); P.part(n, k, dims); };
  hit(cupP, 0, 0.115, 0, "cyl", { rad: 0.062, hl: 0.115, name: "cup" }); hit(cupP, 0, 0.236, 0, "cyl", { rad: 0.066, hl: 0.006, name: "lid" }); hit(cupP, 0, 0.255, 0, "cyl", { rad: 0.062, hl: 0.013, name: "dome" }); hit(cupP, 0.012, 0.22, 0, "cyl", { rad: 0.008, hl: 0.13, name: "straw" }, -0.09);
  mesh(cup, new THREE.CylinderGeometry(0.062, 0.047, 0.23, 14), mat(0xdcecf2, { alpha: 0.32 }), 0, 0.115, 0, { noShadow: true });
  mesh(cup, new THREE.CylinderGeometry(0.055, 0.044, 0.17, 14), mat(0x3a2314, { alpha: 0.9 }), 0, 0.09, 0, { noShadow: true });       // the coffee
  for (const [x, y, z, r] of [[-0.02, 0.17, 0.01, 0.3], [0.025, 0.15, -0.015, 0.8], [0.0, 0.19, -0.02, 0.5], [-0.03, 0.14, -0.02, 1.0]]) { const b = box(cup, 0.034, 0.034, 0.034, 0xdff3fb, x, y, z, { alpha: 0.7, noShadow: true }); b.rotation.set(r, r * 1.3, r * 0.7); }
  mesh(cup, new THREE.CylinderGeometry(0.066, 0.064, 0.012, 14), mat(0xf4f4f4, { alpha: 0.9 }), 0, 0.236, 0, { noShadow: true });
  mesh(cup, new THREE.CylinderGeometry(0.036, 0.062, 0.026, 14), mat(0xf4f4f4, { alpha: 0.7 }), 0, 0.255, 0, { noShadow: true });
  const straw = mesh(cup, new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6), mat(0x16a05f), 0.012, 0.22, 0.0, { noShadow: true }); straw.rotation.z = -0.09;
  plane(cup, 0.1, 0.1, logoM, 0, 0.12, 0.062);                                                                                  // the big brown and cream round logo, facing the lens
  const cakeP = solid("cheesecake", deskP), cheese = cakeP.g; cheese.position.set(CAKEX, DESK_Y, CAKEZ);                         // the blueberry cheesecake
  cakeP.part(mesh(cheese, new THREE.CylinderGeometry(0.13, 0.11, 0.012, 16), mat(0xe2e2da), 0, 0.006, 0, { noShadow: true }), "cyl", { rad: 0.13, hl: 0.006, name: "plate" });
  const sl = (r, h, y, c) => { const m = mesh(cheese, new THREE.CylinderGeometry(r, r, h, 12, 1, false, 0, 1.15), mat(c), 0, y, 0, { noShadow: true }); m.rotation.y = 0.5; m.position.set(-0.03, y, 0.02); cakeP.part(m, "cyl", { rad: r, hl: h / 2, name: "slice" }); return m; };
  sl(0.115, 0.014, 0.019, 0xb07a42); sl(0.11, 0.05, 0.051, 0xf3dfae); sl(0.112, 0.014, 0.083, 0x3b3f93);
  for (const [x, z] of [[0.015, 0.0], [0.05, 0.03], [0.03, 0.065], [0.075, -0.01], [0.0, 0.045]]) mesh(cheese, new THREE.SphereGeometry(0.014, 6, 5), mat(0x2a2f86), x - 0.03, 0.1, z + 0.02, { noShadow: true });
  box(cheese, 0.012, 0.004, 0.1, 0xc9ccd2, 0.16, 0.012, 0.02, { noShadow: true }).rotation.y = 0.3;                              // a fork
}

// ================= the laptop (the stake): a 16-inch MacBook Pro, drawn big =================
// A 16-inch MacBook Pro, to scale: 35.6 x 24.8 cm closed, 1.7 cm thick, a screen of 34.5 x 22.3 cm (Apple's spec), lid as deep as the base. Buloy is 56 cm across the shoulders: the laptop is 0.64 of that.
const LAP = { x: 0.10, z: 0.58, yaw: -1.0, W: 0.356, D: 0.248, LH: 0.248, tilt: -0.30 };
const lapP = solid("laptop", deskP), lapG = lapP.g; lapG.position.set(LAP.x, DESK_Y, LAP.z); lapG.rotation.y = LAP.yaw;
lapP.part(mesh(lapG, new RoundedBoxGeometry(LAP.W, 0.016, LAP.D, 2, 0.006), mat(0xc4c8d0, { rim: 0.5 }), 0, 0.008, 0), "box", { h: [LAP.W / 2, 0.008, LAP.D / 2], r: 0.006, name: "base" });
box(lapG, LAP.W - 0.03, 0.003, LAP.D * 0.36, 0x1b1b21, 0, 0.0175, -0.03, { noShadow: true }); box(lapG, LAP.W * 0.34, 0.003, LAP.D * 0.22, 0xb4b8c0, 0, 0.0175, 0.085, { noShadow: true });
const lapLid = group(lapG, 0, 0.014, -LAP.D / 2); lapLid.rotation.x = LAP.tilt;
box(lapLid, LAP.W, LAP.LH, 0.012, 0xc4c8d0, 0, LAP.LH / 2, 0, { rim: 0.5 }); { const n = new THREE.Object3D(); n.position.set(0, LAP.LH / 2, 0); lapLid.add(n); lapP.part(n, "box", { h: [LAP.W / 2, LAP.LH / 2, 0.006], name: "lid" }); }
box(lapLid, LAP.W - 0.012, LAP.LH - 0.012, 0.002, 0x0c0c10, 0, LAP.LH / 2, 0.0066, { noShadow: true });
const SW = 256, SH = 165, SCRW = 0.345, SCRH = SCRW * SH / SW;
const scrC = document.createElement("canvas"); scrC.width = SW; scrC.height = SH; const sg = scrC.getContext("2d");
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace; scrT.magFilter = THREE.NearestFilter; scrT.minFilter = THREE.LinearFilter; scrT.generateMipmaps = false;
plane(lapLid, SCRW, SCRH, new THREE.MeshBasicMaterial({ map: scrT, color: new THREE.Color(1.12, 1.12, 1.12) }), 0, LAP.LH / 2 + 0.002, 0.0098);
box(lapLid, 0.04, 0.008, 0.003, 0x0c0c10, 0, LAP.LH - 0.007, 0.0102, { noShadow: true });                                         // the notch
// the sticky note on the palm rest beside the trackpad (CK-21; it covered screen words on the bezel): the words only where the camera can read them
const noteDraw = (words) => painted(28, 28, (g) => {
  g.fillStyle = "#ffe066"; g.fillRect(0, 0, 28, 28); g.fillStyle = "#e8c63e"; g.fillRect(0, 25, 28, 3);
  if (words && ATLAS && ATLAS.ptext) { ATLAS.ptext(g, "AYUSIN", 14, 6, "#5a3a00", { font: 3, align: "center" }); ATLAS.ptext(g, "BUKAS", 14, 14, "#5a3a00", { font: 3, align: "center" }); g.fillStyle = "#5a3a00"; g.fillRect(5, 21, 18, 1); }
  else { g.fillStyle = "#b8962a"; g.fillRect(5, 7, 18, 2); g.fillRect(7, 14, 14, 2); g.fillRect(5, 21, 18, 1); }
}, { mip: false });
const noteTexW = noteDraw(true), noteTexB = noteDraw(false);
const noteM = new THREE.MeshBasicMaterial({ map: noteTexB, color: new THREE.Color(0.95, 0.95, 0.95) });
const note = plane(lapG, 0.07, 0.07, noteM, 0.125, 0.0178, 0.07); note.rotation.x = -Math.PI / 2; note.rotation.z = 0.07;      // lying on the palm rest, right of the trackpad, off the screen in every camera (CK-19); its top edge points at the screen
const TEXT_SHOTS = { k_hook: 1, k_claude: 1, k_ctight: 1, k_over: 1 };                                                                  // the cameras near enough to read the small words; every other one gets them as bars

const SCT = (rd, s, x, y, col, o = {}) => {                                                                                  // text where it can be read; a bar of the same size where it cannot
  if (!(ATLAS && ATLAS.ptext)) return;
  if (rd || o.big) { ATLAS.ptext(sg, s, x, y, col, o); return; }
  const m = ATLAS.ptext(sg, s, 0, 0, col, Object.assign({}, o, { dry: true })), al = o.align || "left", x0 = al === "center" ? x - m.w / 2 : al === "right" ? x - m.w : x;
  sg.fillStyle = col; sg.globalAlpha = 0.55; sg.fillRect(Math.round(x0), Math.round(y + m.h / 2 - 1), m.w, 2); sg.globalAlpha = 1;
};
const dbIcon = (x, y, col) => { sg.fillStyle = col; sg.fillRect(x, y + 1, 9, 2); sg.fillRect(x, y + 4, 9, 2); sg.fillRect(x, y + 7, 9, 2); sg.fillRect(x - 1, y + 2, 1, 6); sg.fillRect(x + 9, y + 2, 1, 6); };
function drawMon(t, rd) {
  const g = sg, pulse = Math.floor(t * 2.4) % 2 === 0;
  const tList = A.list.s - 0.05, tOld = A.old.s - 0.02, tUsers = A.users.s - 0.05, tBank = A.folder.s - 0.05, tCopy = A.copy.s - 0.05, tRest = A.restore.s - 0.05, tFin = A.final.s - 0.05;
  if (t < tList) {                                                                                                          // frame 0: the error
    g.fillStyle = pulse ? "#3a0a0c" : "#2a0608"; g.fillRect(0, 0, SW, SH);
    g.fillStyle = pulse ? "#ff3b3b" : "#a82424"; g.fillRect(0, 0, SW, 4); g.fillRect(0, SH - 4, SW, 4); g.fillRect(0, 0, 4, SH); g.fillRect(SW - 4, 0, 4, SH);
    g.fillStyle = "#ff5a4a"; for (let i = 0; i < 12; i++) { g.fillRect(18 + i, 26 + i, 3, 3); g.fillRect(32 - i, 26 + i, 3, 3); }
    SCT(rd, "ERROR 404", 118, 22, "#ffb0a8", { font: 5, scale: 1, align: "center", big: true });
    SCT(rd, "DATABASE:", 112, 54, "#ffe9e6", { font: 5, scale: 3, align: "center", big: true });
    SCT(rd, "NOT FOUND", 112, 84, pulse ? "#ff4a3d" : "#d63a30", { font: 5, scale: 4, align: "center", big: true });
    g.fillStyle = "#7a1a1a"; g.fillRect(18, 128, 220, 5); g.fillStyle = "#ff4a3d"; g.fillRect(18, 128, 48 + Math.floor(26 * (0.5 + 0.5 * Math.sin(t * 3))), 5);
  } else {
    g.fillStyle = "#0e1019"; g.fillRect(0, 0, SW, SH);
    g.fillStyle = "#1c2030"; g.fillRect(0, 0, SW, 13); g.fillStyle = "#ee5f5f"; g.fillRect(4, 4, 4, 4); g.fillStyle = "#f2c230"; g.fillRect(10, 4, 4, 4); g.fillStyle = "#5fd87a"; g.fillRect(16, 4, 4, 4);
    const bank = t >= tBank && t < tCopy;
    SCT(rd, bank ? "/BACKUP" : "/VAR/DATA", 30, 4, "#8c94b8", { font: 3 });
    if (bank) {                                                                                                             // the folder `backup`, opened, empty
      g.fillStyle = "#e8b83a"; g.fillRect(92, 20, 24, 8); g.fillRect(92, 26, 72, 36); g.fillStyle = "#f6d266"; g.fillRect(95, 32, 66, 27);
      g.fillStyle = "#3a2c08"; g.fillRect(112, 44, 28, 3);
      SCT(rd, "BACKUP", 128, 66, "#e9e6ff", { font: 5, scale: 2, align: "center", big: true });
      if (t >= A.empty.s - 0.05) SCT(rd, "0 ITEMS", 128, 82, "#9fb4ff", { font: 5, scale: 2, align: "center", big: true });      // the count is the punchline of "Pero walang laman": nothing hints at it before that line starts
      else { g.fillStyle = "#9fb4ff"; for (let i = 0; i < 3; i++) if (Math.floor(t * 3) % 3 >= i) g.fillRect(122 + i * 8, 86, 4, 4); }   // a loading mark while the folder opens
    } else {
      // row 3 is the punchline: until Claude's last line is spoken it is only "COPY"; the name then types in word by word, each whole word on its own voiced moment (TL.reveal, from script.json "reveal")
      const NAME = ["PRODUCTION-", "OLD-", "DO-", "NOT-", "DELETE-", "FINAL"], RV = TL.reveal || [], shown = NAME.filter((w, i) => RV[i] !== undefined && t >= RV[i] - 0.02);
      const rows = [["PRODUCTION", 0], ["PRODUCTION-OLD-DO-NOT-DELETE", 1]];
      if (t >= tCopy) rows.push([shown.length ? shown.join("") : "COPY", 2]);
      rows.forEach(([name, k], i) => {
        const y = 20 + i * 19, deleted = k === 1 && t >= tOld, hi = k === 2 && shown.length > 0, fresh = k === 2 ? clamp01((t - tCopy) / 0.3) : 1;
        g.fillStyle = hi ? "#ffd65a" : deleted ? "#14151e" : "#1a1e2e"; g.fillRect(4, y, SW - 8, 17);
        if (hi) { g.fillStyle = "#fff3c0"; g.fillRect(4, y, SW - 8, 1); g.fillRect(4, y + 16, SW - 8, 1); }
        dbIcon(9, y + 4, hi ? "#5a3a00" : deleted ? "#4a4e66" : "#7fd8a6");
        SCT(rd, name, 23, y + 5, hi ? "#3a2400" : deleted ? "#5a5f78" : "#e9e6ff", { font: 5, scale: 1 });
        if (deleted) {
          const w = ATLAS.ptext(sg, name, 0, 0, "#000", { font: 5, dry: true }).w; g.fillStyle = "#6a6f88"; g.fillRect(23, y + 8, w, 1);
          g.fillStyle = "#14151e"; g.fillRect(SW - 60, y + 2, 54, 13); SCT(rd, "DELETED", SW - 8, y + 5, "#ff5a4a", { font: 5, align: "right" });
        } else if (k === 2) { g.fillStyle = hi ? "#ffd65a" : "#1a1e2e"; g.fillRect(SW - 30, y + 2, 26, 13); SCT(rd, "TUE", SW - 8, y + 5, hi ? "#3a2400" : "#ffd65a", { font: 5, align: "right" }); }
        else { g.fillStyle = "#1a1e2e"; g.fillRect(SW - 36, y + 2, 32, 13); SCT(rd, "LIVE", SW - 8, y + 5, "#5fd87a", { font: 5, align: "right" }); }
        if (k === 2 && fresh < 1) { g.fillStyle = "#0e1019"; g.fillRect(4 + Math.floor((SW - 8) * fresh), y, SW - 8, 17); }
      });
      if (t >= tRest) {                                                                                                     // the restore bar
        const p = t >= tFin ? 1 : lerp(0.06, 0.9, clamp01((t - tRest) / Math.max(0.5, A.ano.e - tRest)));
        SCT(rd, t >= tFin ? "RESTORED" : "RESTORING...", 14, 80, t >= tFin ? "#5fd87a" : "#9fb4ff", { font: 5, scale: 2, big: true });
        g.fillStyle = "#222840"; g.fillRect(14, 98, SW - 28, 13); g.fillStyle = t >= tFin ? "#5fd87a" : "#7b9bff"; g.fillRect(17, 101, Math.floor((SW - 34) * p), 7);
        g.fillStyle = "#14182a"; for (let x = 24; x < SW - 16; x += 10) g.fillRect(x, 101, 1, 7);
      }
    }
    if (t >= tUsers) {                                                                                                      // USERS ONLINE: 900, red and blinking
      if (t < tBank) {
        g.fillStyle = pulse ? "#e02424" : "#7a1212"; g.fillRect(4, 20, SW - 8, 78);
        SCT(rd, "USERS ONLINE:", 128, 27, "#fff1ee", { font: 5, scale: 3, align: "center", big: true });
        SCT(rd, "900", 128, 52, pulse ? "#ffffff" : "#ffc9c2", { font: 5, scale: 6, align: "center", big: true });
      } else {
        g.fillStyle = pulse ? "#c41e1e" : "#5c1010"; g.fillRect(0, SH - 16, SW, 16);
        SCT(rd, "USERS ONLINE: 900", 128, SH - 12, "#fff1ee", { font: 5, align: "center" });
      }
    }
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = "#e9e6ff"; g.fillRect(SW - 12, SH - 30, 6, 10); }                         // a cursor that blinks: something moves
  }
  scrT.needsUpdate = true;
}

// ================= faceless people: nobody's face is ever seen =================
// A figure has a blank head under hair, a body in a plain colour, and (for a few) a lanyard: UP = maroon strap, green card; Ateneo = blue strap, white card.
const LAN = { up: [0x7a1216, 0x0f6a3a], ateneo: [0x1e4fa6, 0xf2f4f8] };
const dimC = (c, k) => (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);
function person(o) {
  o = Object.assign({}, o, { top: dimC(o.top, 0.74), bot: dimC(o.bot, 0.74), hair: dimC(o.hair, 0.8), skin: dimC(o.skin || 0xd9a27a, 0.76), shoe: dimC(o.shoe || 0xeeeeee, 0.74) });   // extras sit a step dimmer than Buloy so they stay background
  const g = group(room, o.x, o.y || 0, o.z); g.rotation.y = o.ry || 0; const s = o.s || 1; g.scale.setScalar(s);
  const hip = o.seated ? 0.47 : 0.86, rm = { rim: 0.5 };
  const legs = [-1, 1].map((k) => {
    const L = group(g, k * 0.1, hip, 0);
    if (o.seated) { box(L, 0.13, 0.13, 0.42, o.bot, 0, 0, 0.2, { noShadow: true }); box(L, 0.12, 0.44, 0.12, o.bot, 0, -0.22, 0.4, { noShadow: true }); }
    else box(L, 0.13, 0.86, 0.14, o.bot, 0, -0.43, 0, { noShadow: true });
    if (!o.seated) box(L, 0.14, 0.06, 0.2, o.shoe || 0xeeeeee, 0, -0.83, 0.03, { noShadow: true });
    return L;
  });
  box(g, 0.40, 0.58, 0.23, o.top, 0, hip + 0.31, 0, rm);
  const arms = [-1, 1].map((k) => { const a = group(g, k * 0.25, hip + 0.55, 0); box(a, 0.085, 0.5, 0.1, o.top, 0, -0.25, 0, { noShadow: true }); box(a, 0.075, 0.08, 0.08, o.skin || 0xd9a27a, 0, -0.53, 0, { noShadow: true }); return a; });
  const head = group(g, 0, hip + 0.72, 0.01); head.rotation.x = o.pitch || 0; head.rotation.y = o.hy || 0;
  mesh(head, new THREE.SphereGeometry(0.115, 10, 8), mat(o.skin || 0xd9a27a, rm), 0, 0.05, 0, { noShadow: true });
  mesh(head, new THREE.SphereGeometry(0.124, 10, 8, 0, Math.PI * 2, 0, 3.2), mat(o.hair, rm), 0, 0.06, -0.01, { noShadow: true });
  if (o.hairLong) box(head, 0.2, 0.26, 0.07, o.hair, 0, -0.06, -0.09, { noShadow: true });
  if (o.lan) {
    const [strap, card] = LAN[o.lan], top = hip + 0.58;
    for (const k of [-1, 1]) { for (const zz of [0.118, -0.118]) { const b = box(g, 0.012, 0.36, 0.006, strap, k * 0.05, top - 0.17, zz, { noShadow: true }); b.rotation.z = -k * 0.14; } }
    box(g, 0.075, 0.105, 0.01, card, 0, top - 0.38, 0.122, { noShadow: true }); box(g, 0.075, 0.02, 0.012, strap, 0, top - 0.34, 0.123, { noShadow: true });
  }
  if (o.apron) { box(g, 0.34, 0.5, 0.01, GREEN, 0, hip + 0.28, 0.12, { noShadow: true }); box(g, 0.2, 0.2, 0.012, 0xffffff, 0, hip + 0.2, 0.126, { noShadow: true }); }
  if (o.cup) { const c = box(arms[1], 0.06, 0.1, 0.06, 0xf4f4f0, 0, -0.58, 0.07, { noShadow: true }); box(c, 0.064, 0.05, 0.064, GREEN, 0, 0.0, 0, { noShadow: true }); arms[1].rotation.x = -1.0; }
  return { g, legs, arms, head, o };
}
const SKINS = [0xd9a27a, 0xc88e68, 0xe3b08a, 0xb87b58];
const walkers = [], sitters = [];
// the queue at the counter, backs and shoulders to the lens; two lanyards are the only hint of where this is
[[1.30, -0.40, 3.4, 0x2d3a52, 0x1f2430, "up", 0x20150f, SKINS[0]], [1.90, -0.42, 2.9, 0xe8e0d0, 0x2a2e3a, "ateneo", 0x15100c, SKINS[1]], [2.50, -0.4, 3.5, 0x7b8a6a, 0x3a3a40, null, 0x3a2412, SKINS[2]]].forEach(([x, z, ry, top, bot, lan, hair, skin], i) => sitters.push(person({ x, z, ry, top, bot, lan, hair, skin, s: 0.96 + i * 0.03 })));
// two at the window bar, on stools, turned to the glass
[[-1.6, -1.4, 0.35, 0xf0e6d8, 0x3a3f58, "ateneo", 0x241810, SKINS[3], 1], [-2.4, -1.4, -0.35, 0xd8e0d0, 0x2b2b32, "up", 0x120c08, SKINS[0], 1]].forEach(([x, z, ry, top, bot, lan, hair, skin, seated], i) => sitters.push(person({ x, z, ry: Math.PI + ry, y: 0.432, top, bot, lan, hair, skin, seated: true, pitch: 0.55, s: 0.97 })));
// baristas behind the counter in green aprons
[[1.35, -1.55], [2.05, -1.55]].forEach(([x, z], i) => sitters.push(person({ x, z, ry: Math.PI, y: 0, top: 0xf2efe6, bot: 0x2a2a30, apron: true, hair: 0x1a1210, skin: SKINS[i + 1], s: 1 })));
// walkers: cross the aisle behind the banquette once each at the given moment, then wait out of sight (tc: the second they are at xc)
const WALK = [
  { tc: 4.6, xc: -0.9, dir: 1, z: -0.95, top: 0xa05a3a, bot: 0x2a3340, hair: 0x1c130e, lan: "up", cup: 1 }, { tc: 14.6, xc: -0.7, dir: -1, z: -1.05, top: 0x3b5a8a, bot: 0x222222, hair: 0x2a1c12, lan: null },
  { tc: 21.3, xc: -0.5, dir: 1, z: -0.9, top: 0xe8e8e0, bot: 0x4a4458, hair: 0x120c0a, lan: "ateneo", hairLong: 1 }, { tc: 25.8, xc: -0.5, dir: -1, z: -1.0, top: 0x2e6a52, bot: 0x2b2b30, hair: 0x2a1a10, lan: null, cup: 1 },
  { tc: 33.0, xc: -0.6, dir: 1, z: -0.95, top: 0xc8b070, bot: 0x30303a, hair: 0x1a120c, lan: "up" }, { tc: 40.5, xc: 0.2, dir: -1, z: -1.0, top: 0x7a4a7a, bot: 0x2a2a2a, hair: 0x241810, lan: null, hairLong: 1 },
  { tc: 45.2, xc: -0.2, dir: 1, z: -0.95, top: 0x4a4a52, bot: 0x6a5a4a, hair: 0x1a120c, lan: "ateneo" }, { tc: 49.0, xc: 0.3, dir: -1, z: -1.0, top: 0xb04a3a, bot: 0x2a2a30, hair: 0x120c0a, lan: "up", cup: 1 },
];
WALK.forEach((w) => { w.z = -0.935; });                                                                                    // one lane behind the banquette, the middle of the aisle (5 cm to the banquette's cap, 4 to the stool seats); each walker shows only around his own cut, so two never meet
for (const w of WALK) { const p = person({ x: 0, z: w.z, ry: w.dir > 0 ? Math.PI / 2 : -Math.PI / 2, top: w.top, bot: w.bot, hair: w.hair, lan: w.lan, cup: w.cup, hairLong: w.hairLong, skin: SKINS[Math.floor(w.tc) % 4], s: 1.0, shoe: 0xe6e0d4 }); p.w = w; walkers.push(p); }
// the street outside the glass: people pass all the time, dark against the daylight
const OUT = [];
for (let i = 0; i < 5; i++) { const p = person({ x: 0, z: -2.6 - 0.6 * i, ry: (i % 2 ? -1 : 1) * Math.PI / 2, top: [0x7a3a3a, 0x2f4a6a, 0x3a3a3a, 0xc8c0a8, 0x5a6a4a][i], bot: 0x303030, hair: 0x1a1210, skin: SKINS[i % 4], lan: i === 1 ? "up" : null, s: 0.9 }); p.k = i; OUT.push(p); }
const swing = (p, ph, amp) => { p.legs[0].rotation.x = Math.sin(ph) * amp; p.legs[1].rotation.x = -Math.sin(ph) * amp; if (!p.o.cup) { p.arms[0].rotation.x = -Math.sin(ph) * amp * 0.8; p.arms[1].rotation.x = Math.sin(ph) * amp * 0.8; } else p.arms[0].rotation.x = -Math.sin(ph) * amp * 0.8;
  p.lift = 0; for (const L of p.legs) { const a = L.rotation.x; for (const z of [-0.07, 0.13]) p.lift = Math.max(p.lift, -(0.86 - 0.86 * Math.cos(a) - z * Math.sin(a))); } p.lift *= p.o.s || 1; };   // a swinging leg's toe or heel dips under the floor: lift the walker by exactly that, so the lowest sole always rests on it
const SPEED = 0.62;

// ================= a blurred foreground silhouette: close to the lens, in a few shots only, never over a speaker's face =================
const fgMake = (shirt, hair, skin) => painted(96, 128, (g) => {                                                                    // a person passing close to the lens: back of the head, ear, neck, shoulders; soft, never black
  g.filter = "blur(1.6px)";
  g.fillStyle = shirt; g.beginPath(); g.moveTo(2, 128); g.quadraticCurveTo(0, 74, 28, 66); g.lineTo(68, 66); g.quadraticCurveTo(96, 74, 94, 128); g.fill();
  g.fillStyle = skin; g.fillRect(38, 52, 20, 20);
  g.fillStyle = hair; g.beginPath(); g.ellipse(48, 33, 19, 25, 0, 0, 7); g.fill(); g.fillRect(31, 44, 34, 10);
  g.fillStyle = skin; g.beginPath(); g.ellipse(29, 42, 3, 5, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(67, 42, 3, 5, 0, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,0.16)"; g.fillRect(44, 66, 8, 62);
}, { mip: true });
const fgTexs = [fgMake("#6f86a0", "#2f2420", "#b98866"), fgMake("#a5645a", "#3a2a22", "#c89672"), fgMake("#b58a46", "#241a16", "#a87c5c")];
const fgM = new THREE.MeshBasicMaterial({ map: fgTexs[0], transparent: true, depthWrite: false, depthTest: false, fog: false, opacity: 0.0 });
const fgP = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.333), fgM); fgP.renderOrder = 999; fgP.frustumCulled = false; room.add(fgP);
// passes: [shot, from, to, side (+1 right edge, -1 left edge), height of the head in the frame (-1 .. 1), scale]
const FG = [["k_buloy", A.confused.s + 0.1, A.confused.e + 0.2, 1, -0.38, 0.6], ["k_bside", A.old.s + 0.1, A.old.e, -1, -0.38, 0.6], ["k_two", A.save.s + 0.4, A.save.e + 0.6, 1, -0.38, 0.6], ["k_buloy", A.ano.s + 0.2, A.ano.e - 0.1, -1, -0.38, 0.6]];
const _fgQ = new THREE.PerspectiveCamera(), _fgF = new THREE.Vector3(), _fgR = new THREE.Vector3(), _fgU = new THREE.Vector3();
function updateFG(t, ctx) {
  const sh = SHOTS[ctx.shot]; let on = 0, pass = null;
  for (const [pi, p] of FG.entries()) if (p[0] === ctx.shot && t >= p[1] && t <= p[2]) { pass = p; fgM.map = fgTexs[pi % 3]; on = smooth((t - p[1]) / 0.25) * (1 - smooth((t - (p[2] - 0.35)) / 0.35)); }
  if (!pass || !sh) { fgM.opacity = 0; fgP.visible = false; return; }
  const cp = shotCamPos(ctx.cut, t); _fgQ.position.copy(cp); _fgQ.lookAt(sh.l[0], sh.l[1], sh.l[2]); _fgQ.updateMatrixWorld(true);
  const d = 0.7, hh = d * Math.tan(sh.fov * Math.PI / 360), hw = hh * 9 / 16;
  _fgF.set(0, 0, -1).applyQuaternion(_fgQ.quaternion); _fgR.set(1, 0, 0).applyQuaternion(_fgQ.quaternion); _fgU.set(0, 1, 0).applyQuaternion(_fgQ.quaternion);
  const sc = pass[5] * 1.0 * hh, drift = (t - pass[1]) * 0.012 * pass[3];
  fgP.position.copy(cp).addScaledVector(_fgF, d).addScaledVector(_fgR, pass[3] * (hw * 0.95 + drift)).addScaledVector(_fgU, pass[4] * hh);
  fgP.quaternion.copy(_fgQ.quaternion); fgP.scale.set(sc, sc, 1); fgM.opacity = 0.95 * on; fgP.visible = true;
}

// ================= Claude, Buloy =================
room.add(C); C.scale.setScalar(CS); C.visible = true; C.position.set(0.66, DESK_Y, 0.66);
room.add(V); V.position.set(...BUL); V.rotation.y = 0; V.visible = true;
vUpper.rotation.order = "YXZ";
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;
const bulRig = { vUpper, armL, armR }, BL = armRig(bulRig, 1, "viron");
const faceBase = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase };
// every figure that moves, for the solids check in QA: it tests each one against every prop, surface and other figure, and a person's hands against his own body
GRIP.movers.push({ name: "buloy", root: V, person: "viron" }, { name: "claude", root: C, person: "claude" });
sitters.forEach((p, i) => GRIP.movers.push({ name: (p.o.apron ? "barista" : p.o.seated ? "stool" : "queue") + i, root: p.g }));
walkers.forEach((p, i) => GRIP.movers.push({ name: "walker" + i, root: p.g })); OUT.forEach((p, i) => GRIP.movers.push({ name: "street" + i, root: p.g }));

// ================= the lights: daylight through the glass, warm lamps overhead =================
const faceL = new THREE.PointLight(0xfff0dc, 0, 3.2, 1.4); faceL.position.set(-0.2, 1.3, 1.3); room.add(faceL);                  // in his close shot a soft light from the lens side keeps the face a face
const fillL = new THREE.PointLight(0xffe0b8, 0, 6.0, 1.3); room.add(fillL);
const lampL = new THREE.PointLight(0xffe2b0, 0, 8, 1.4); lampL.position.set(0.1, 2.15, 0.5); room.add(lampL);
const scrL = new THREE.PointLight(0xff3a2a, 0, 2.6, 2.0); scrL.position.set(0.1, 1.2, 1.0); room.add(scrL);                    // the screen's own light on the faces: red for the error, then pale
const sunL = new THREE.DirectionalLight(0xfff3dc, 0); sunL.position.set(-3.5, 4.5, 3.5); room.add(sunL);
const claudeL = new THREE.PointLight(0xffe6c8, 0, 3.4, 1.4); claudeL.position.set(1.3, 1.3, 1.7); room.add(claudeL);                     // in the wide shot Claude is far from every lamp: a soft light keeps him the orange he is in his own shots

// ================= acting tables =================
// Per act: the head [yaw, pitch, roll], the upper body [turn, lean], the face, the hands. Yaw + turns him toward +x (the laptop, Claude). Weights are normalised;
// an act the table does not name (Claude's lines, where Buloy is off camera) shows the idle state.
const IDLE = { h: [0.4, 0.06, 0], u: [0.1, 0.1], f: { smile: -0.1, brow: 0.1, gx: 0.4, gy: 0.2, lid: 0.05 }, hands: "rest" };
const ACTST = {
  hook:     { h: [0.10, 0.14, 0.0], u: [0.0, 0.08], f: { sad: 0.3, brow: 0.8, smile: -0.5, lid: -0.5, gx: 0.0, gy: 0.0, wet: 0.4, open: 0.55 }, hands: "head" },     // panic: brows up, eyes wide, mouth open
  alin:     { h: [0.55, 0.10, 0.04], u: [0.15, 0.07], f: { sad: 0.75, brow: -0.6, smile: -0.45, lid: 0.15, gx: 0.6, gy: 0.05, wet: 0.5 }, hands: "head" },
  confused: { h: [0.28, 0.10, 0.12], u: [0.08, 0.24], f: { brow: 0.9, lid: -0.45, smile: -0.35, gx: 0.45, gy: 0.0, sad: 0.15 }, hands: "shrug" },
  list:     { h: [0.7, 0.04, 0.0], u: [0.22, 0.14], f: { brow: 0.5, lid: -0.2, smile: -0.25, gx: 0.7, gy: 0.3 }, hands: "rest" },
  old:      { h: [0.22, 0.16, -0.06], u: [0.08, 0.2], f: { brow: -0.4, sad: 0.3, smile: 0.3, cheek: 0.35, lid: 0.18, gx: 0.2, gy: 0.7 }, hands: "rest" },     // sheepish: a guilty half smile, eyes down and away
  main:     { h: [0.5, 0.04, 0.0], u: [0.2, 0.1], f: { brow: 0.95, lid: -0.65, smile: -0.25, gx: 0.55, gy: 0.0 }, hands: "rest" },
  why:      { h: [0.25, 0.04, 0.1], u: [0.08, 0.2], f: { brow: 0.7, anger: 0.4, lid: -0.15, smile: -0.4, gx: 0.3, gy: 0.0, open: 0.1 }, hands: "shrug" },
  april:    { h: [0.3, 0.3, 0.08], u: [0.1, 0.2], f: { brow: -0.25, sad: 0.35, smile: 0.12, cheek: 0.2, lid: 0.2, gx: 0.1, gy: 0.8 }, hands: "rest" },
  who:      { h: [0.2, 0.10, 0.0], u: [0.08, 0.22], f: { brow: -0.7, sad: 0.9, smile: -0.6, lid: -0.3, gx: 0.0, gy: 0.0 }, hands: "rest" },     // dread: brows drawn up and in, wide fixed stare, mouth flat
  users:    { h: [0.7, -0.04, 0.0], u: [0.2, 0.12], f: { brow: 0.95, lid: -0.7, smile: -0.5, gx: 0.7, gy: 0.0, open: 0.35 }, hands: "rest" },
  please:   { h: [0.40, -0.02, 0.06], u: [0.12, 0.12], f: { brow: -0.65, sad: 0.75, smile: -0.2, lid: -0.1, gx: 0.4, gy: 0.0, wet: 0.4 }, hands: "clasp" },
  folder:   { h: [0.7, -0.02, 0.0], u: [0.2, 0.1], f: { brow: 0.45, smile: 0.18, lid: -0.1, gx: 0.7, gy: 0.0 }, hands: "clasp" },
  yes:      { h: [0.15, -0.14, 0.0], u: [0.0, 0.0], f: { smile: 0.95, cheek: 0.85, brow: 0.9, lid: -0.25, gx: 0.2, gy: -0.1 }, hands: "up" },
  empty:    { h: [0.55, 0.0, 0.0], u: [0.15, 0.05], f: { smile: 0.35, brow: 0.4, lid: -0.2, gx: 0.6, gy: 0.0 }, hands: "rest" },
  patay:    { h: [0.12, 0.40, 0.0], u: [0.0, 0.34], f: { sad: 0.95, brow: -0.65, smile: -0.5, lid: 0.45, gx: 0.0, gy: 0.9 }, hands: "rest" },
  copy:     { h: [0.3, 0.22, 0.0], u: [0.1, 0.22], f: { sad: 0.6, brow: -0.2, smile: -0.2, lid: 0.2, gx: 0.45, gy: 0.4 }, hands: "rest" },
  say:      { h: [0.3, 0.16, 0.14], u: [0.1, 0.32], f: { brow: 0.95, lid: -0.5, smile: -0.3, gx: 0.5, gy: 0.0, sad: 0.0, open: 0.1 }, hands: "shrug" },
  sabi:     { h: [0.55, 0.06, 0.04], u: [0.18, 0.2], f: { brow: 0.55, lid: -0.2, smile: 0.2, cheek: 0.2, gx: 0.6, gy: 0.0 }, hands: "rest" },
  save:     { h: [0.62, -0.06, 0.0], u: [0.3, 0.06], f: { smile: 1.0, cheek: 0.9, brow: 0.95, lid: -0.3, gx: 0.7, gy: 0.0 }, hands: "save" },
  restore:  { h: [0.5, 0.02, 0.0], u: [0.15, 0.12], f: { smile: 0.45, cheek: 0.3, brow: 0.3, gx: 0.6, gy: 0.0 }, hands: "rest" },
  ano:      { h: [0.30, 0.04, 0.07], u: [0.1, 0.18], f: { brow: 0.6, smile: 0.1, lid: 0.0, gx: 0.35, gy: 0.0, open: 0.05 }, hands: "rest" },
  final:    { h: [0.4, 0.05, 0.0], u: [0.1, 0.16], f: { brow: 0.9, lid: -0.5, smile: -0.2, gx: 0.5, gy: 0.0 }, hands: "rest" },
};
// a hand at rest lies on the table, whatever the lean: the point beside his belly is taken to the world, put on the table's top and on its near edge, and brought back into the upper body's frame
const _rp = new THREE.Vector3(), _qwi = new THREE.Quaternion(), _lq = new THREE.Vector3(), _lp = new THREE.Vector3(), REST_Y = 0.06;
function lowestOverTable(arm) {                                                                                    // the lowest point of an arm (sleeve, cuff, hand, fingers) over the table's top, or null when none is near it
  if (!arm.pts) { arm.pts = []; arm.el.traverse((m) => { if (!m.isMesh || !m.geometry.attributes.position) return; const pos = m.geometry.attributes.position, k = Math.max(1, Math.ceil(pos.count / 2500)), a = []; for (let i = 0; i < pos.count; i += k) a.push(pos.getX(i), pos.getY(i), pos.getZ(i)); arm.pts.push([m, a]); }); }
  let low = null;
  for (const [m, a] of arm.pts) for (let i = 0; i < a.length; i += 3) { _lp.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(m.matrixWorld); if (_lp.x > DK.x0 && _lp.x < DK.x1 && _lp.z > DK.z0 && _lp.z < DK.z1 && _lp.y < DESK_Y + 0.12 && (low === null || _lp.y < low)) low = _lp.y; }
  return low;
}
function restOnTable(s) { _rp.set(s * 0.20, 0.255, 0.30); vUpper.localToWorld(_rp); _rp.y = DESK_Y + REST_Y; _rp.z = Math.max(_rp.z, DK.z0 + 0.07); return vUpper.worldToLocal(_rp).clone(); }
// hands, in the upper body's frame: p the wrist target, F where the fingers point, Pm where the palm faces, pose the fingers
const HS = {
  rest:  (s) => ({ p: restOnTable(s), F: v3(0, -0.3, 0.954).applyQuaternion(_qwi.copy(_qw).invert()), Pm: v3(0, -0.954, -0.3).applyQuaternion(_qwi), pose: HAND_POSES.flat }),   // on the table like a typist's: the wrist stands a hand's height up (the cuff rests on the wood), the finger pads touch it; the directions are the world's, not the leaning body's
  head:  (s) => ({ p: v3(s * 0.155, 0.70, 0.0), F: v3(-s * 0.5, 1, 0.05), Pm: v3(-s, 0, 0.05), pose: HAND_POSES.open }),
  shrug: (s) => ({ p: v3(s * 0.34, 0.45, 0.30), F: v3(s * 0.25, 0.55, 1), Pm: v3(0, 1, 0.2), pose: HAND_POSES.open }),
  clasp: (s) => ({ p: v3(s * 0.05, 0.53, 0.36), F: v3(0, 1, 0.55), Pm: v3(-s, 0, 0), pose: HAND_POSES.flat }),
  up:    (s) => ({ p: v3(s * 0.30, 0.93, 0.12), F: v3(s * 0.15, 1, 0.1), Pm: v3(0, 0, 1), pose: HAND_POSES.open }),
  save:  (s) => (s > 0 ? { p: v3(0.40, 0.64, 0.32), F: v3(0.85, -0.12, 0.5), Pm: v3(0, -1, 0), pose: HAND_POSES.point } : { p: v3(-0.30, 0.95, 0.10), F: v3(-0.1, 1, 0.1), Pm: v3(0, 0, 1), pose: HAND_POSES.fist }),
};
const _hp = new THREE.Vector3(), _hf = new THREE.Vector3(), _hpm = new THREE.Vector3(), _qw = new THREE.Quaternion();

// ================= the cameras =================
// k_hook opens medium close on Buloy with the red screen at his side and pulls out as he speaks; k_buloy, k_bside and k_bclose are his close-ups (a push-in, a pull-out, a snap);
// k_claude and k_ctight look down a little over the table, so the screen stands over Claude's head and can be read; k_over is the screen with Claude's head below it; k_two pulls back to the cafe.
const SHOTS_CF = {
  k_hook:   { p: [-0.11, 1.3, 1.85], l: [-0.025, 1.17, 0.3], fov: 61, d: [-0.08, 0.06, 0.4], cap: 915 },
  k_claude: { p: [-0.9, 1.35, 1.5], l: [0.35, 0.93, 0.6], fov: 48, d: [0.0, -0.004, -0.05], cap: 1385 },
  k_ctight: { p: [-0.75, 1.3, 1.35], l: [0.27, 0.95, 0.58], fov: 44, d: [-0.003, 0.0, -0.045], cap: 1385 },
  k_over:   { p: [-1.25, 1.45, 0.6], l: [0.35, 0.95, 0.55], fov: 42, d: [0.004, -0.003, 0.0], cap: 1385 },
  k_buloy:  { p: [-0.18, 1.17, 2.0], l: [-0.52, 1.14, 0.0], fov: 36, d: [-0.004, 0, -0.06], cap: 1385 },
  k_bside:  { p: [0.62, 1.1, 1.5], l: [-0.55, 1.14, 0.0], fov: 34, d: [-0.01, 0.002, 0.04], cap: 1385 },
  k_bclose: { p: [-0.16, 1.2, 1.35], l: [-0.46, 1.2, 0.0], fov: 32, d: [-0.01, 0, -0.1], cap: 1385 },
  k_two:    { p: [0.4, 1.28, 3.3], l: [0.22, 1.1, 0.1], fov: 64, d: [0.0, 0.0, 0.04], cap: 1385 },
};

// The walkers cross only in the cameras that do not hold Buloy (Claude's and the screen's), so no head ever floats behind his: each one is given the middle of one of those cuts (the longest eight).
const WALK_OK = { k_over: 1 };                                                                                                  // not in Claude's cameras: a head cut by the top edge reads as a floating black ball
{
  const segs = []; TL.shots.forEach((c, i) => { const e = i + 1 < TL.shots.length ? TL.shots[i + 1].t : TL.dur; if (WALK_OK[c.shot] && e - c.t >= 1.7) segs.push({ m: (c.t + e) / 2, x: SHOTS_CF[c.shot].l[0] }); });
  walkers.forEach((p, i) => { const g = segs[i] || { m: -99, x: 0 }; p.w.tc = g.m; p.w.xc = g.x - 0.05 * p.w.dir; });
}

const SET = {
  name: "cafe",
  shots: SHOTS_CF,
  keys: () => [{ t: 0.02, label: "first-frame" }, { t: A.confused.s + 0.8, label: "confused" }, { t: A.users.s + 0.9, label: "users-online" }, { t: A.yes.s + 0.5, label: "arms-up" }, { t: A.patay.s + 0.8, label: "slumped" }, { t: A.save.s + 0.9, label: "pointing" }, { t: A.final.s + 0.8, label: "final-name" }],
  update(t, ctx) {
    laptop.visible = false;
    for (const P of SOLIDS) P.seen = GRIP.frame;                                                                                  // placed once, never moved: the laptop stands where it stands in every shot
    const shot = ctx.shot, vAmp = ampAt("viron", t), cAmp = ampAt("claude", t);
    // ---- the light: a bright café by day ----
    hemi.color.setRGB(1.0, 0.97, 0.9); hemi.groundColor.setRGB(0.62, 0.55, 0.46); hemi.intensity = 1.05;
    duskRim.color.setRGB(1.0, 0.92, 0.78); duskRim.position.set(-3, 4, -6); duskRim.intensity = 0.35; skyFill.color.setRGB(0.95, 0.97, 1.0); skyFill.intensity = 0.4;
    sunL.intensity = 0.55;
    claudeL.intensity = shot === "k_two" ? 1.6 : 0;
    RIM.uRimColor.value.setRGB(0.95, 0.85, 0.65); applyGrade(t);
    WALLM.color.setRGB(1, 1, 1); FLOORM.color.setRGB(1, 1, 1);
    lampL.intensity = shot === "k_hook" ? 2.2 : 4.0; bloom.strength = shot === "k_hook" ? 0.1 : 0.45; bloom.threshold = shot === "k_hook" ? 1.5 : 1.12;   // the opening frame stays clean: no glow on the cake, the keys or the table
    const err = t < A.list.s - 0.05;
    scrL.color.setRGB(err ? 1.0 : 0.8, err ? 0.28 : 0.88, err ? 0.2 : 1.0); scrL.intensity = err ? (shot === "k_hook" ? 1.2 : 0.9) + 0.3 * Math.sin(t * 17) * Math.sin(t * 5.3) : 0.35;
    faceL.intensity = (shot === "k_buloy" || shot === "k_bclose" || shot === "k_bside" || shot === "k_hook") ? 0.6 : 0; fillL.position.set(0.2, 1.5, 1.7); fillL.intensity = 0.45;
    // the screen, the sticky note, the cup's logo: words only where the camera can read them
    const rd = !!TEXT_SHOTS[shot]; drawMon(t, rd); noteM.map = rd ? noteTexW : noteTexB; logoM.map = (rd || shot === "k_buloy" || shot === "k_bclose" || shot === "k_bside") ? logoTexW : logoTexB;
    // the people
    // the aisle between the banquette and the window bar ends at the counter: nobody walks into it
    for (const p of walkers) { const w = p.w, u = (t - w.tc) * SPEED, x = w.xc + w.dir * u; p.g.visible = Math.abs(u) < 1.6 && x > -2.5 && x < 0.4 && !!WALK_OK[shot]; p.g.position.x = x; swing(p, t * 7.5 + w.tc, 0.5); p.g.position.y = Math.abs(Math.sin(t * 7.5 + w.tc)) * 0.012 + p.lift; }
    for (const p of OUT) { const dir = p.k % 2 ? -1 : 1, per = 16 + p.k * 3.7, ph = ((t * 0.55 + p.k * 5.3) % per) / per; p.g.position.x = dir * (ph - 0.5) * 9 - 1.3; swing(p, t * 6.5 + p.k, 0.45); p.g.position.y = p.lift; }
    for (const p of sitters) if (p.o.seated) { p.head.rotation.x = 0.55 + 0.04 * Math.sin(t * 0.9 + p.g.position.x); }
    sitters.forEach((p, i) => { if (!p.o.seated && !p.o.apron) { p.g.rotation.z = Math.sin(t * 0.8 + i) * 0.006; } if (p.o.apron) { p.arms[0].rotation.x = -0.5 + 0.2 * Math.sin(t * 1.7 + i); p.arms[1].rotation.x = -0.45 + 0.2 * Math.sin(t * 1.3 + i * 2); } });
    for (const p of sitters) { const lowCam = shot === "k_claude" || shot === "k_ctight"; const hide = lowCam || shot === "k_over"; p.g.visible = p.o.apron ? !hide : p.o.seated ? !(hide || shot === "k_bside") : !hide; }   // extras whose heads would be cut by the frame's top edge (black balls) or crowd Buloy's head stay out of those cameras
    if (shot === "k_hook") for (const p of sitters) if (p.o.apron && p.g.position.x < 1.7) p.g.visible = false;                    // the pull-out shows the near barista's head floating over the counter (his body is hidden behind the machine): out of this one shot
    updateFG(t, ctx);

    // ---- Buloy: blend the acts' states ----
    const W = {}; let tot = 0;
    for (const k in ACTST) { W[k] = win(A[k], t, 0.12, 0.05); }
    W.hook = t < A.hook.e ? 1 : W.hook;                                                                                         // the first pose holds from time zero
    W.final = smooth((t - (A.final.s - 0.12)) / 0.25);
    tot = 0; for (const k in W) tot += W[k];
    const norm = Math.max(1, tot), wI = Math.max(0, 1 - tot / norm);
    let yaw = 0, pitch = 0, roll = 0, tYaw = 0, tLean = 0; const f = { ...faceBase }; const hw = {};
    const add = (S, w) => { yaw += S.h[0] * w; pitch += S.h[1] * w; roll += S.h[2] * w; tYaw += S.u[0] * w; tLean += S.u[1] * w; for (const key in S.f) f[key] += S.f[key] * w; hw[S.hands] = (hw[S.hands] || 0) + w; };
    for (const k in ACTST) if (W[k] > 0.0005) add(ACTST[k], W[k] / norm);
    if (wI > 0.0005) add(IDLE, wI);
    f.open = Math.max(f.open, clamp01(vAmp * 1.25)); f.blink = 0;
    const jig = (W.hook + W.save) * 0.01 * Math.sin(t * 11), nameDrop = 0.1 * smooth((t - ((TL.reveal || [])[3] || 1e9)) / 0.7);                      // his head sinks a little as the name types
    vUpper.rotation.set(tLean + Math.sin(t * 1.3) * 0.008, tYaw, 0); vUpper.position.y = 0.592 + 0.032 * (W.patay + W.say) + 0.012 * W.yes;                                                             // 0.592 (was 0.52): the hoodie's hem rides on the seat's top instead of sinking into the cushion
    vHead.rotation.set(pitch + nameDrop + Math.sin(t * 1.13 + 2) * 0.008 + 0.012 * Math.sin(t * 8.5) * W.hook, yaw + Math.sin(t * 0.7) * 0.012 + 0.09 * Math.sin(t * 7.5) * W.hook * (1 - smooth((t - 1.8) / 0.6)), roll + Math.sin(t * 0.9 + 1) * 0.01 + jig);
    const dr = eyeDrift(t);
    Object.assign(bulFace, f); bulFace.gx += dr[0] * 0.3; bulFace.gy += dr[1] * 0.3;
    bulFace.blink = Math.max(blinkAt(t, 0.8), W.patay > 0.5 ? 0.5 : 0);
    buloy.draw(bulFace);

    // ---- Buloy's hands ----
    V.updateMatrixWorld(true);
    vUpper.getWorldQuaternion(_qw);
    const hands = [[1, armL], [-1, armR]];
    const wsum = Object.values(hw).reduce((a, b) => a + b, 0) || 1;
    // Each hand: blend the acts' targets, reach there, turn the hand, close the fingers. Then nothing of an arm may go into the table (the sleeve, the cuff, the fingers): find the lowest point of the arm over the wood and, if it is under it
    // (or, for a hand lying flat, off it), move the wrist by the difference with the exact solver (ikRigExact: the forearm is 0.25 long, which the search in reach() takes as 0.29) and turn the hand again; a pass or two settles it.
    const pose = {};
    for (const [s, arm] of hands) {
      _hp.set(0, 0, 0); _hf.set(0, 0, 0); _hpm.set(0, 0, 0); let best = 0, ps = HAND_POSES.relaxed;
      for (const name in hw) { const w = hw[name] / wsum, H = HS[name](s); _hp.addScaledVector(H.p, w); _hf.addScaledVector(H.F, w); _hpm.addScaledVector(H.Pm, w); if (w > best) { best = w; ps = H.pose; } }
      pose[s] = { p: _hp.clone(), F: _hf.clone().applyQuaternion(_qw), Pm: _hpm.clone().applyQuaternion(_qw) };
      reach(bulRig, s, [[0, null]], t, v3(s * 0.2, 0.255, 0.3), [[1, pose[s].p]]);
      arm.H.pose = ps;
    }
    V.updateMatrixWorld(true);
    const turn = (s, arm) => { orientHand(arm.hand, pose[s].F, pose[s].Pm, 1); applyHand(arm.H, handFree(arm.H)); };            // the fingers take their pose now so the measure sees them; the director applies the same pose again after this
    for (const [s, arm] of hands) turn(s, arm);
    V.updateMatrixWorld(true);
    for (const [s, arm] of hands) for (let k = 0; k < 4; k++) {
      const low = lowestOverTable(arm); if (low === null) break;
      const d = (hw.rest || 0) / wsum > 0.999 ? DESK_Y + 0.0015 - low : Math.max(0, DESK_Y + 0.0015 - low); if (Math.abs(d) < 0.0006) break;
      arm.hand.getWorldPosition(_lq).y += d; ikRigExact(arm, s, vUpper.worldToLocal(_lq)); V.updateMatrixWorld(true); turn(s, arm); V.updateMatrixWorld(true);
    }

    // ---- Claude: deadpan, bobbing a little as he speaks; the eyes are flat dashes when he is at his driest ----
    const cSpeak = Math.max(win(A.alin, t, 0.1, 0.1), win(A.list, t, 0.1, 0.1), win(A.main, t, 0.1, 0.1), win(A.april, t, 0.1, 0.1), win(A.users, t, 0.1, 0.1), win(A.folder, t, 0.1, 0.1), win(A.empty, t, 0.1, 0.1), win(A.copy, t, 0.1, 0.1), win(A.sabi, t, 0.1, 0.1), win(A.restore, t, 0.1, 0.1), win(A.final, t, 0.1, 0.1));
    const cy = lerp(-0.5, -0.1, cSpeak);
    C.rotation.set(0, cy + Math.sin(t * 0.7) * 0.012, 0);
    C.position.y = DESK_Y + 0.0075 + Math.abs(Math.sin((t - A.restore.s) * 9)) * 0.02 * env(A.restore.s - 0.05, A.restore.s + 0.5, t, 0.05, 0.2);
    cBody.rotation.set(-0.02 - 0.05 * cSpeak, 0, Math.sin(t * 0.9) * 0.01); cBody.position.y = 0.085 + cAmp * 0.008 * Math.sin(t * 13);
    const dash = Math.max(win(A.main, t, 0.1, 0.1), win(A.april, t, 0.1, 0.1) * 0.8, win(A.empty, t, 0.1, 0.1), win(A.sabi, t, 0.1, 0.1), win(A.final, t, 0.1, 0.1));
    const lookX = -0.01 + 0.012 * (1 - cSpeak), slow = 1 - blinkAt(t, 1.3, 3.7) * 0.9;
    cEyes.forEach((e, i) => { e.visible = true; e.scale.y = lerp(0.08 * slow, 0.012, dash); e.scale.x = lerp(0.04, 0.062, dash); e.position.set((i ? 1 : -1) * 0.14 + lookX, 0.2, 0.121); });
    cArms[0].position.set(-0.275, 0.13 + cAmp * 0.03 * Math.sin(t * 11), 0.02); cArms[1].position.set(0.275, 0.13 + cAmp * 0.03 * Math.sin(t * 11 + 2), 0.02);
    C.updateMatrixWorld(true);
  },
};
