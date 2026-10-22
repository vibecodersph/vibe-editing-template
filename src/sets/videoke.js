// ---------- SET: the videoke night (episode 5, "Perfect Score") ----------
// A garage set up for a birthday, at night. World: the back wall is at z -1.9 with the TV on its stand and the HAPPY BIRTHDAY banner, the camera side is +z.
// Buloy stands at x -0.3 behind the plastic table (it hides his legs), Aling Nena sits on a monobloc chair at x 0.45, the videoke machine with Claude on it is at x -1.55.
// Same contract as the other sets: SET.shots (cameras) and SET.update(t, ctx), a pure function of time. px, v3, vtrack and reach come from 46-rig.js.

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0x120c1e); scene.fog = null;
const HB = TEX.block("#8d8a80", "#6f6c64", "#a09c92", 31), CONC = TEX.concrete(), YERO = TEX.yero("#b4bdc8", "#8f99a6", "#6c7686", "#9a5a3c");

// ================= the garage =================
tbox(room, 10, 0.1, 9, CONC, 1.0, 0.2, -0.05, 1.0, { noShadow: true });                                                  // the floor
tbox(room, 10, 3.2, 0.14, HB, 1.4, 0.2, 1.6, -1.97, { noShadow: true });                                                 // hollow-block wall behind
tbox(room, 0.14, 3.2, 8, HB, 1.4, -4.8, 1.6, 1.0, { noShadow: true }); tbox(room, 0.14, 3.2, 8, HB, 1.4, 5.2, 1.6, 1.0, { noShadow: true });
tbox(room, 10, 0.1, 8, YERO, 0.8, 0.2, 3.28, 1.0, { noShadow: true });                                                   // a corrugated roof
box(room, 10, 0.12, 0.2, 0x4a3a30, 0.2, 3.2, -1.85, { noShadow: true });
// the gate, half open on the left, the dark street through it
{
  const g = group(room, -3.2, 0, -1.84);
  box(g, 1.7, 2.3, 0.05, 0x14101c, 0, 1.15, -0.02, { noShadow: true });
  for (let i = 0; i <= 8; i++) box(g, 0.035, 2.2, 0.035, 0x2b2733, -0.8 + i * 0.2, 1.1, 0.03, { noShadow: true });
  for (const y of [0.3, 1.1, 2.0]) box(g, 1.76, 0.04, 0.04, 0x2b2733, 0, y, 0.03, { noShadow: true });
}

// ================= the TV, the stand, the videoke machine =================
const scrC = document.createElement("canvas"); scrC.width = 128; scrC.height = 72;
const scrG = scrC.getContext("2d");
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace; scrT.magFilter = THREE.NearestFilter; scrT.minFilter = THREE.NearestFilter; scrT.generateMipmaps = false;
const TV = group(room, 0.3, 1.85, -1.7);
{
  box(TV, 1.62, 0.98, 0.1, 0x16151c, 0, 0, 0, { noShadow: true });
  plane(TV, 1.52, 0.855, new THREE.MeshBasicMaterial({ map: scrT, color: new THREE.Color(1.2, 1.2, 1.2) }), 0, 0, 0.056);
  box(TV, 0.08, 0.6, 0.08, 0x2b2733, 0, -0.78, 0.0, { noShadow: true });
  box(room, 1.1, 0.7, 0.4, 0x5a3c26, 0.3, 0.35, -1.7);                                                                     // the TV stand, wood
  box(room, 1.0, 0.04, 0.34, 0x2a1c12, 0.3, 0.72, -1.7, { noShadow: true });
}
const MACH = group(room, -1.55, 0, -0.7);
{
  tbox(MACH, 0.72, 0.9, 0.5, WOODP_TEX(), 0.5, 0, 0.45, 0);
  box(MACH, 0.64, 0.5, 0.02, 0x16151c, 0, 0.5, 0.26, { noShadow: true });                                                    // the speaker grille
  for (let i = 0; i < 9; i++) box(MACH, 0.6, 0.012, 0.01, 0x3a3a46, 0, 0.27 + i * 0.054, 0.272, { noShadow: true });
  box(MACH, 0.76, 0.06, 0.54, 0x1c1b24, 0, 0.93, 0);                                                                          // the top, where Claude sits
  for (let i = 0; i < 4; i++) box(MACH, 0.05, 0.05, 0.02, [0xff3a3a, 0x3aff7a, 0xffd23a, 0x4a8aff][i], -0.22 + i * 0.1, 0.1, 0.262, { glow: 1.8, noShadow: true });
  box(MACH, 0.12, 0.14, 0.1, 0x2b2733, 0.28, 0.99, 0.18, { noShadow: true });                                               // the mic holder
  plane(MACH, 0.3, 0.08, signMat(px("VIDEOKE", 44, 12, "#16151c", "#ffd23a", 1, { border: "#ffd23a" }), 1.1), -0.18, 0.12 + 0.28, 0.275).receiveShadow = false;
}
function WOODP_TEX() { return TEX.wood("#6a4a30", "#4a3220", "#7e5a3c", 5); }

// ================= the party: banner, banderitas, table, chairs, food =================
plane(room, 2.7, 0.3, signMat(px("HAPPY BIRTHDAY", 180, 20, "#d62070", "#ffffff", 2, { border: "#ffd23a", y: 3 }), 1.1), 0.3, 3.0, -1.88);
{
  const COLS = [0xff3a5a, 0xffd23a, 0x3aff7a, 0x4a8aff, 0xff7ad0, 0xf2f2ea];
  for (const [x0, x1, y0] of [[-3.0, 3.2, 3.0], [-2.4, 2.8, 2.9]]) for (let i = 0; i < 22; i++) {
    const u = i / 21, x = x0 + (x1 - x0) * u, y = y0 - Math.sin(u * Math.PI) * 0.35 - 0.12;
    const p = mesh(room, new THREE.ConeGeometry(0.085, 0.2, 3), mat(COLS[(i + (x0 < -2.5 ? 0 : 3)) % 6], { glow: 0.7 }), x, y, -1.2 + (x0 < -2.5 ? 0 : 0.5), { noShadow: true }); p.rotation.set(0, 0, Math.PI);
  }
}
const TBL = group(room, 0.1, 0, 1.0);
{
  box(TBL, 2.0, 0.04, 0.6, 0x2a3f7a, 0, 0.74, 0); box(TBL, 2.02, 0.5, 0.62, 0x1c2c5a, 0, 0.5, 0, { noShadow: true }); for (const x of [-0.96, 0.96]) for (const z of [-0.26, 0.26]) box(TBL, 0.04, 0.72, 0.04, 0xe9e2d0, x, 0.36, z, { noShadow: true });
  mesh(TBL, new THREE.CylinderGeometry(0.17, 0.15, 0.04, 12), mat(0xf4f1e6), -0.12, 0.78, 0.0);                                // a platter of pancit
  for (let i = 0; i < 14; i++) { const w = mesh(TBL, new THREE.TorusGeometry(0.05 + (i % 3) * 0.03, 0.01, 4, 8), mat(i % 2 ? 0xe6c46a : 0xd9a84a), -0.12 + Math.cos(i) * 0.05, 0.82 + (i % 4) * 0.008, 0.05 + Math.sin(i) * 0.05, { noShadow: true }); w.rotation.set(1.5 + Math.sin(i), i, 0); }
  for (let i = 0; i < 4; i++) { const c = mesh(TBL, new THREE.CylinderGeometry(0.03, 0.028, 0.16, 8), mat([0xd9412e, 0x2f9a4a, 0xe5762b, 0x8a3fb0][i]), 0.24 + (i % 2) * 0.08, 0.84, -0.12 + Math.floor(i / 2) * 0.12); }
  box(TBL, 0.2, 0.012, 0.28, 0xf2c230, 0.0, 0.762, -0.2, { noShadow: true });                                                  // the songbook
  plane(TBL, 0.18, 0.04, signMat(px("SONGBOOK", 36, 9, "#f2c230", "#16213f", 1)), 0.0, 0.775, -0.2).rotation.x = -Math.PI / 2;
}
function monobloc(x, z, ry) {
  const g = group(room, x, 0, z); g.rotation.y = ry; const col = 0xf2f0ea;
  mesh(g, new RoundedBoxGeometry(0.44, 0.05, 0.44, 2, 0.02), mat(col, R), 0, 0.45, 0); mesh(g, new RoundedBoxGeometry(0.42, 0.4, 0.05, 2, 0.02), mat(col, R), 0, 0.68, -0.2).rotation.x = -0.12;
  for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) box(g, 0.045, 0.44, 0.045, col, sx, 0.22, sz, { noShadow: true });
}
monobloc(0.5, 0.5, -0.45); monobloc(1.45, 0.4, 0.3); monobloc(-1.2, 1.2, 0.8);

// ================= the cast moves in =================
const BUL = [-0.28, 0.43, 0.4];
room.add(V); V.position.set(...BUL); V.rotation.y = 0; V.visible = true; V.children[0].visible = false; V.children[1].visible = false; laptop.visible = false;
room.add(C); C.position.set(-1.55, 0.96, -0.6); C.visible = true; C.scale.setScalar(1.0); C.rotation.y = 0.35;
// Aling Nena, much older, seated on the monobloc: a skirt, thighs, shins and shoes (copied from the jeepney)
NENA_HAIR.hairN.color.set(0xb8b6c0); NENA_HAIR.greyN.color.set(0xd8d6de); NENA_HAIR.greyD.color.set(0x9896a2);
room.add(nena); nena.position.set(0.5, 0.55 - 0.9, 0.5); nena.rotation.y = -0.45; nena.visible = true; fan.visible = false;
{
  const skirt = mat(0x6a3a8a, R);
  mesh(nena, new THREE.CylinderGeometry(0.2, 0.235, 0.18, 10), skirt, 0, 0.86, 0.02);
  for (const s of [-1, 1]) { box(nena, 0.15, 0.13, 0.46, 0x6a3a8a, s * 0.085, 0.84, 0.25, R); box(nena, 0.085, 0.4, 0.09, 0xb07548, s * 0.085, 0.57, 0.5, R); box(nena, 0.1, 0.05, 0.17, 0x23202c, s * 0.085, 0.37, 0.56, R); }
}
// the mic: a solid wireless one (48-solid.js), carried, handed over, tapped, kept, handed back
const mic = makeMic(room, { name: "mic" });
const tblP = makeProp("vtable", TBL, { surface: true }); tblP.g.position.set(0, 0.74, 0);
flatSocket(tblP, 0.02); tblP.part(tblP.g, "box", { h: [1.0, 0.02, 0.3] });                                              // the table top: hands rest on it
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;                                    // no glow hanging in front of the hand with the mic
const faceBase = { blink: 0, open: 0, smile: 0.1, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase };

// ================= the light: warm string lights and a disco light that throws moving coloured spots =================
const DISCO = [];
for (let i = 0; i < 5; i++) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, map: painted(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,0.9)"); r.addColorStop(0.6, "rgba(255,255,255,0.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }, { mip: false }) });
  const p = mesh(room, new THREE.PlaneGeometry(0.9, 0.9), m, 0, 1.5, -1.88, { noShadow: true }); DISCO.push({ p, m, i });
}
const discoLights = [0xff3a8a, 0x3aaaff, 0xffd23a].map((c) => { const l = new THREE.PointLight(c, 2.4, 6, 1.5); l.position.set(0, 2.6, 0.2); room.add(l); return l; });
const ball = mesh(room, new THREE.SphereGeometry(0.16, 8, 6), mat(0xdde3ea, { glow: 1.4 }), 0.4, 2.85, 0.2, { noShadow: true }); box(room, 0.01, 0.4, 0.01, 0x16151c, 0.4, 3.1, 0.2, { noShadow: true });
const hemiFill = new THREE.PointLight(0xffe2b0, 2.6, 7, 1.5); hemiFill.position.set(-0.2, 2.6, 1.4); room.add(hemiFill);
// confetti: seeded, falls while the score cheers
const CONF = [];
{ const r = rng(515); for (let i = 0; i < 46; i++) { const b = box(room, 0.03, 0.002, 0.05, [0xff3a5a, 0xffd23a, 0x3aff7a, 0x4a8aff, 0xff7ad0][i % 5], 0, 0, 0, { glow: 1.2, noShadow: true }); CONF.push({ b, x: -1.6 + r() * 3.2, z: -1.0 + r() * 2.4, ph: r(), sp: 0.5 + r() * 0.5, rx: r() * 6, rz: r() * 6 }); } }

// ================= the clock of the night (times come from the acts of the script) =================
const LN = TL.lines, actLine = (name) => LN.find((l) => l.act === name);
const A = { doubt: actLine("n_doubt"), praise: actLine("c_praise"), proud: actLine("b_proud"), nmic: actLine("n_mic"), praise2: actLine("c_praise2"), bdoubt: actLine("b_doubt"), admit: actLine("c_admit"),
  offer: actLine("c_offer"), brace: actLine("b_brace"), truth: actLine("c_truth"), again: actLine("b_again"), laugh: LN[LN.length - 1] };
const win = (ln, t, pi = 0.2, po = 0.3) => (ln ? smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3)) : 0);
const T_REAL = A.truth ? A.truth.s + 0.9 : 1e9;                              // the screen turns honest as Claude says the truth
const T_COUGH = A.nmic ? A.nmic.e : 1e9;
const yawKeys = [[0, 0.5]];
for (const l of LN) yawKeys.push([l.s - 0.2, l.act === "n_doubt" ? -0.5 : l.act === "n_mic" ? 0.7 : l.act === "c_praise" || l.act === "c_admit" || l.act === "c_offer" || l.act === "c_truth" || l.act === "b_doubt" || l.act === "c_praise2" ? -0.75 : 0.1, 0.3]);
yawKeys.sort((a, b) => a[0] - b[0]);
// the mic's route: Buloy carries it; he holds it out and Aling Nena takes it by the upper body while he still has the lower; she coughs into it and taps the ball;
// she keeps it, her fist resting over the table, and before he sings again she holds it out and he takes it back the same way.
// It is never put down: every change of hands has a stretch where both are on it.
const tNm = A.nmic ? A.nmic.s : 1e9, tNe = A.nmic ? A.nmic.e : 1e9, tAg = A.again ? A.again.s : 1e9;
const HO = { nReach: [tNm - 1.0, tNm - 0.62], nGrasp: [tNm - 0.62, tNm - 0.48], bOpen: [tNm - 0.4, tNm - 0.28], bAway: [tNm - 0.28, tNm + 0.1], toMouth: [tNm - 0.3, tNm + 0.05], down: [tNe + 0.3, tNe + 0.9],
  offer: [tAg - 1.75, tAg - 1.3], bReach: [tAg - 1.65, tAg - 1.22], bGrasp: [tAg - 1.22, tAg - 1.06], nOpen: [tAg - 1.0, tAg - 0.88], nAway: [tAg - 0.88, tAg - 0.45], up: [tAg - 0.85, tAg - 0.25] };
const ramp = (k, t) => smooth((t - k[0]) / (k[1] - k[0]));
const M_B1 = v3(BUL[0] + 0.16, 1.9, BUL[2] + 0.14), M_H = v3(BUL[0] + 0.33, 1.2, BUL[2] + 0.3);
const bulRig = { vUpper, armL, armR }, BL = armRig(bulRig, 1, "viron"), NA = armNena(nenaL, "nena"), NT = armNena(nenaR, "nena");
const UPY = v3(0, 1, 0), _mp = new THREE.Vector3(), _mq = new THREE.Quaternion();
// the last picture before the card: closer on Buloy as he lifts the mic to sing again, the honest 72 on the TV beside him
const V_MED = { p: [0.9, 1.55, 3.3], l: [0.16, 1.6, 0.2], fov: 52, d: [-0.01, 0, -0.04], cap: 1380 }, V_END = { p: [-1.2, 1.58, 1.8], l: [-0.2, 1.63, 0.07], fov: 54, d: [0.012, 0, -0.035], cap: 1350 };
const T_ENDSHOT = (() => { let c = null; for (const k of TL.shots) if (k.shot === "v_buloy") c = k; return c && A.again && c.t > A.again.s - 1 ? c.t : 1e9; })();
const qAxis = (ax) => new THREE.Quaternion().setFromUnitVectors(UPY, ax.clone().normalize());
// a held mic lies across the forearm, not along it: lean the wanted axis off the line from the shoulder to the mic
const across = (ax, pos, sh, k = 0.85) => { const d = pos.clone().sub(sh).normalize(); return ax.clone().normalize().addScaledVector(d, -k * ax.clone().normalize().dot(d)).normalize(); };

const SET = {
  name: "videoke",
  mode: () => "videoke",
  shots: {
    v_open:   { p: [0.8, 1.5, 3.4], l: [0.35, 1.65, 0.4], fov: 56, d: [-0.01, 0, -0.05], cap: 1345 },                         // from the right: Buloy whole, arms up with the mic, the 100 clear beside him, Aling Nena's face under it, the whole banner
    v_claude: { p: [-2.75, 1.35, 1.3], l: [-1.36, 1.4, -0.45], fov: 48, d: [0.012, 0, -0.012], cap: 1330 },                      // Claude on the machine with the TV's score in the picture behind him
    v_buloy:  { p: [0.9, 1.55, 3.3], l: [0.16, 1.6, 0.2], fov: 52, d: [-0.01, 0, -0.04], cap: 1380 },                        // Buloy medium; for the last use (he sings again) update swaps in V_END, closer, the 72 beside him
    v_nena:   { p: [-0.1, 1.25, 2.4], l: [0.5, 1.2, 0.6], fov: 32, d: [0.01, 0, -0.03], cap: 1390 },                          // Aling Nena takes the mic
    v_screen: { p: [1.0, 1.3, 1.6], l: [0.15, 1.7, -1.3], fov: 48, d: [0, 0, -0.05], cap: 1390 },                             // the TV, her mic in the foreground
    v_two:    { p: [-0.6, 1.5, 3.1], l: [-0.77, 1.4, 0.0], fov: 56, d: [0.01, 0, -0.04], cap: 1390 },                        // Buloy turning to Claude, his smile gone
    v_hook:   { p: [-0.45, 2.4, 1.55], l: [-0.1, 1.62, 0.0], fov: 62, d: [0.004, -0.02, -0.05], cap: 1345 },                   // frame 0, from above: the 100 over his head, his face tipped up to the lens, fist and mic in the air
    v_face:   { p: [-0.75, 1.58, 1.5], l: [-0.34, 1.62, 0.4], fov: 40, d: [0.004, 0, -0.03], cap: 1390 },                     // close on Buloy, the frozen 100 beside his face: he asks if it was real, and later hears the answer
  },
  keys: () => [{ t: 1.5, label: "mic-up" }, { t: HO.nGrasp[1] + 0.05, label: "mic-both" }, { t: HO.bAway[0], label: "mic-nena" }, { t: tNm + 0.5, label: "mic-cough" }, { t: tNm + 0.9 + Math.PI / 24, label: "mic-tap" }, { t: tNm + 0.9 + 5 * Math.PI / 24, label: "mic-tap2" },
    { t: HO.down[1], label: "mic-kept" }, { t: 20, label: "mic-kept2" }, { t: HO.offer[1], label: "mic-offer" }, { t: HO.bGrasp[1] + 0.04, label: "mic-both2" }, { t: HO.nAway[0], label: "mic-buloy" }, { t: HO.up[1], label: "mic-back" }, { t: tAg + 1.0, label: "mic-sing" }],
  update(t, ctx) {
    const vAmp = ampAt("viron", t);
    Object.assign(SHOTS.v_buloy, t >= T_ENDSHOT ? V_END : V_MED);
    hemi.color.setRGB(0.4, 0.38, 0.6); hemi.groundColor.setRGB(0.3, 0.26, 0.3); hemi.intensity = 0.7; grade.uniforms.uExposure.value = 1.05;
    duskRim.intensity = 0.1; skyFill.intensity = 0.15; RIM.uRimColor.value.setRGB(0.8, 0.45, 0.8);
    const wCel = (1 - smooth((t - (A.proud ? A.proud.e + 0.6 : 5)) / 0.5)) , wBp = win(A.proud, t), wDb = win(A.bdoubt, t, 1.1, 0.5), wBr = win(A.brace, t, 0.3, 0.4), wAg = win(A.again, t, 0.2, 2.6), wCard = A.laugh ? smooth((t - A.laugh.s + 0.2) / 0.3) : 0;
    const wCP = Math.max(win(A.praise, t, 0.1, 0.6), win(A.praise2, t, 0.1, 0.6)), wCoin = Math.max(wCP, 0), wNm = win(A.nmic, t, 0.4, 0.5), wNd = A.doubt && t < A.doubt.e ? 1 : win(A.doubt, t), wNl = A.laugh ? smooth((t - A.laugh.s + 0.1) / 0.2) : 0;
    // ---- the screen: the same perfect score until Claude tells the truth, then an honest one ----
    const real = t >= T_REAL, flick = t > T_REAL - 0.5 && t < T_REAL ? Math.floor(t * 20) % 2 : 0;
    const live = t < T_COUGH - 1.0 || (A.praise2 && t >= A.praise2.s - 0.2 && t < A.praise2.e + 0.4);        // the sparkle only moves while Claude cheers: the silence beat is frozen
    const sp = live ? t : (t < T_COUGH ? 0 : A.praise2 ? A.praise2.e : 0);
    const g = scrG, r = rng(77);
    g.fillStyle = real ? "#0e1c3a" : "#1c0a3a"; g.fillRect(0, 0, 128, 72);
    for (let i = 0; i < 14; i++) { const x = Math.floor(r() * 128), y = Math.floor(r() * 72), ph = (sp * 3 + r() * 6) % 6; if (!real && (ph < 3)) { g.fillStyle = ph < 1.5 ? "#ffe27a" : "#ff7ad0"; g.fillRect(x, y, 2, 2); g.fillRect(x - 1, y + 0.5, 4, 1); } }
    g.fillStyle = real ? "#2a3a6a" : "#ffd23a"; g.fillRect(0, 0, 128, 3); g.fillRect(0, 69, 128, 3);
    if (ATLAS && ATLAS.ptext) {
      if (!real || flick) {
        const pulse = !real ? 1 + 0.05 * Math.sin(sp * 8) : 1;
        ATLAS.ptext(g, "100", 64, 8, "#ffe14a", { font: 5, scale: 5, align: "center", shadow: "#a8281e", sd: 2 });
        ATLAS.ptext(g, "PERFECT!", 64, 50, "#ffffff", { font: 5, scale: 2, align: "center", shadow: "#d62070", sd: 1 });
      } else {
        ATLAS.ptext(g, "72", 64, 6, "#7fd8a6", { font: 5, scale: 4, align: "center", shadow: "#1d5a3a", sd: 2 });
        ATLAS.ptext(g, "SINTUNADO", 64, 38, "#ffffff", { font: 5, scale: 2, align: "center" });
        ATLAS.ptext(g, "SA CHORUS", 64, 54, "#ff9a9a", { font: 5, scale: 2, align: "center" });
      }
    }
    scrT.needsUpdate = true;
    // ---- the light ----
    const hu = (k) => new THREE.Color().setHSL((t * 0.15 + k) % 1, 1, 0.55);
    discoLights.forEach((l, i) => { l.color.copy(hu(i * 0.33)); l.position.set(Math.cos(t * 0.9 + i * 2.1) * 2.2, 2.6, 0.4 + Math.sin(t * 0.9 + i * 2.1) * 1.4); });
    DISCO.forEach((d) => { d.m.color.copy(hu(d.i * 0.2)); d.m.opacity = 0.5; d.p.position.set(Math.cos(t * 0.7 + d.i * 1.3) * 3.0 + 0.1, 1.4 + Math.sin(t * 1.1 + d.i * 2.0) * 0.7, -1.86); d.p.scale.setScalar(1 + 0.3 * Math.sin(t * 2 + d.i)); });
    ball.rotation.y = t * 2;
    // ---- confetti ----
    const cOn = Math.max(1 - smooth((t - (A.proud ? A.proud.e : 6)) / 1.5) * 1, 0) * (t < 7 ? 1 : 0) + wCP * 1;
    CONF.forEach((c) => { const u = (t * 0.35 * c.sp + c.ph) % 1; c.b.visible = cOn > 0.05 && (c.ph < cOn); c.b.position.set(c.x + Math.sin(t * 2 + c.rx) * 0.1, 3.0 - u * 2.9, c.z); c.b.rotation.set(t * 3 + c.rx, c.rz, t * 2); });
    // ---- Buloy: arms up with the mic, proud; then the doubt, the brace, singing again ----
    const wSing = A.again ? smooth((t - (A.again.e + 0.08)) / 0.3) : 0, sing = Math.max(wSing, wCard);
    V.position.set(BUL[0] + Math.sin(t * 1.7) * 0.004, BUL[1], BUL[2]);
    vUpper.position.y = 0.52 + 0.03 * wCel * Math.abs(Math.sin(t * 5.5)) + 0.035 * wBr;
    vUpper.rotation.x = 0.04 - 0.08 * wCel + 0.12 * wDb + 0.05 * wBr + 0.1 * wAg - 0.05 * wSing; vUpper.rotation.y = 0.15 * wCel * Math.sin(t * 2.3) - 0.2 * wDb + 0.1 * wAg; vUpper.rotation.z = Math.sin(t * 5.5) * 0.03 * wCel + Math.sin(t * 4) * 0.02 * wCard;
    vHead.rotation.y = track(yawKeys, t, 0.3) * (1 - wCel * 0.6) + Math.sin(t * 0.9) * 0.015 + 0.15 * wCel * Math.sin(t * 5.5); vHead.rotation.x = -0.12 * wCel + 0.1 * wDb + 0.04 - 0.1 * wSing; vHead.rotation.z = -0.08 * wCel * Math.sin(t * 2.7) + 0.03 * wBr;
    const wHk = ctx.shot === "v_hook" ? 1 : 0; vHead.rotation.x -= 0.22 * wHk; vHead.rotation.y *= 1 - 0.7 * wHk;      // the hook: head back, eyes up at the lens
    Object.assign(bulFace, face);
    bulFace.smile = 0.85 * wCel * (1 - wDb) + 0.42 * wAg * (1 - wCel) + 0.3 * wCard - 0.55 * wDb - 0.2 * wBr; bulFace.cheek = 0.7 * wCel + 0.5 * wAg; bulFace.brow = 0.35 * wCel + 0.35 * wDb + 0.4 * wBr; bulFace.sad = 0.55 * wDb + 0.35 * wBr; bulFace.lid = 0.1 * wCel;
    bulFace.blink = Math.max(face.blink * 0.0, wBr > 0.4 ? 0.97 : 0);
    bulFace.open = Math.max(clamp01(vAmp * 1.2), sing * (0.45 + 0.4 * Math.abs(Math.sin(t * 5.1)))); bulFace.lid = Math.max(bulFace.lid, 0.3 * wSing); bulFace.pucker = 0.25 * wSing;
    bulFace.gx = 0.1 + 0.4 * (wDb || wBp ? 1 : 0) * -1; bulFace.gy = -0.1 * wCel; if (wHk) { bulFace.gy = -0.35; bulFace.gx = 0; }
    buloy.draw(bulFace);
    jeep_update();
    function jeep_update() {}
    room.updateMatrixWorld(true);
    // ---- free arms (what they do with nothing in them); the mic's grips below take over by weight ----
    const hNR = ramp(HO.nReach, t), hNG = ramp(HO.nGrasp, t), hBO = ramp(HO.bOpen, t), hBA = ramp(HO.bAway, t), hMo = ramp(HO.toMouth, t), hDn = ramp(HO.down, t), hOf = ramp(HO.offer, t), hNO = ramp(HO.nOpen, t), hNA = ramp(HO.nAway, t), hBR = ramp(HO.bReach, t), hBG = ramp(HO.bGrasp, t), hUp = ramp(HO.up, t);
    const REST_B = [v3(0.2, -0.04, 0.1), v3(-0.2, -0.04, 0.1)];
    reach(bulRig, 1, [[0, null]], t, REST_B[0]);
    reach(bulRig, -1, [[0, null]], t, REST_B[1], [[wCel, vUpper.worldToLocal(v3(BUL[0] - 0.25, 1.98, BUL[2] + 0.05))]]);
    armL.hand.quaternion.identity(); armR.hand.quaternion.identity();
    armL.H.pose = HAND_POSES.relaxed; armR.H.pose = wCel > 0.4 ? HAND_POSES.fist : HAND_POSES.relaxed;
    // ---- Claude the scorer: bounces with confetti on the cheer, flat, honest, calm ----
    const wAd = win(A.admit, t), wOf = win(A.offer, t), wTr = win(A.truth, t);
    C.position.set(-1.55, 0.96 + Math.abs(Math.sin(t * 9)) * 0.06 * wCP, -0.6); C.rotation.y = 0.35 + 0.15 * Math.sin(t * 0.7) + 0.3 * (wAd + wOf + wTr);
    C.rotation.z = Math.sin(t * 9) * 0.1 * wCP; cBody.rotation.x = 0.1 * wAd - 0.05 * wOf; cBody.rotation.z = Math.sin(t * 0.9) * 0.015;
    const cb = cBody.scale; if (wCP > 0.05) cb.set(1 + 0.04 * Math.abs(Math.sin(t * 9)), 1 - 0.06 * Math.abs(Math.sin(t * 9)), 1); else cb.set(1, 1, 1);
    const blinkC = Math.min(1 - blinkAt(t, 2.3, 3.6) * 0.9, A.truth ? 1 - 0.95 * Math.exp(-(((t - (A.truth.s + 0.2)) / 0.2) ** 2)) : 1);
    cEyes.forEach((e) => { e.scale.y = 0.08 * blinkC * (1 + 0.5 * wCP) * (1 - 0.4 * wAd); e.scale.x = 0.04 * (1 + 0.25 * wCP); });
    cArms[0].position.set(-0.275, 0.13 + 0.12 * wCP * Math.abs(Math.sin(t * 9)) + 0.1 * wCP, 0.16); cArms[1].position.set(0.275, 0.13 + 0.12 * wCP * Math.abs(Math.sin(t * 9 + 1)) + 0.1 * wCP, 0.16);
    // ---- Aling Nena: seated, unimpressed; she takes the mic, coughs, taps it; later she laughs ----
    fan.visible = false; nenaL.up.visible = true;
    nenaHead.rotation.set(0.04 + 0.1 * wNm - 0.3 * wNl, -0.2 + Math.sin(t * 0.6) * 0.04 + 0.1 * wNd, 0.03 * wNd + Math.sin(t * 14) * 0.03 * wNl);
    nenaUp.rotation.set(0.12 + 0.08 * wNm - 0.1 * wNl, -0.1 * wNd, Math.sin(t * 1.9) * 0.02 + Math.sin(t * 15) * 0.015 * wNl); nenaUp.position.y = 0.9 + Math.sin(t * 15) * 0.008 * wNl;
    nface.old = 1; nface.blink = Math.max(blinkAt(t, 1.3, 4.6) * (wNd < 0.5 ? 1 : 0.4), 0.85 * wNl * (Math.sin(t * 6) > 0 ? 1 : 0.5));
    nface.open = clamp01(ctx.nTalk * 1.3 + 0.3 * wNl * Math.abs(Math.sin(t * 13)) + (A.doubt && t < A.doubt.s ? 0.3 : 0)); nface.smile = -0.12 * wNd + 0.08 + 0.9 * wNl; nface.squint = Math.max(0.55 * wNd, 0.3 * wNm, 0.8 * wNl); nface.brow = 0.1 + 0.55 * wNd + 0.15 * wNm; nface.gx = -0.3 * wNd; nface.gy = 0.1;
    nface.wide = Math.sin(t * 8.1) * 0.5 * (ctx.nTalk > 0 ? 1 : 0);
    drawNena(nctx, nface); nenaTex.needsUpdate = true;
    nena.updateMatrixWorld(true);
    const lapW = nena.localToWorld(v3(-0.1, 1.2, 0.3)), lapW2 = nena.localToWorld(v3(0.14, 1.2, 0.3));           // free hands hover over the table edge, never under it
    const up = v3(0, 1, 0), fwd = v3(0, 0, 1).transformDirection(nena.matrixWorld);
    nenaR.pole = [0.5, -1, 0.0]; nenaL.pole = [-0.5, -1, 0.0]; nenaR.hand.quaternion.identity(); nenaL.hand.quaternion.identity();
    solveNenaArm(nenaR, lapW2, 1, nQuat(-0.25, 0, 0), nQuat(-0.4, 0, 0)); solveNenaArm(nenaL, lapW, 1, nQuat(-0.08, 0, -0.1), nQuat(-0.35, 0, 0));
    nena.updateMatrixWorld(true);
    orientHand(nenaR.hand, fwd, up, 1); orientHand(nenaL.hand, fwd, up, 1);
    nenaR.H.pose = HAND_POSES.relaxed; nenaL.H.pose = HAND_POSES.relaxed;
    room.updateMatrixWorld(true);
    // her hands lie on the table in front of her whenever they are not on the mic
    const busyA = ramp(HO.nReach, t) * (1 - smooth((t - (HO.nAway[0] + 0.2)) / 0.3)), busyT = smooth((t - (tNm + 0.5)) / 0.3) * (1 - smooth((t - (tNe + 0.3)) / 0.3));
    gripTouch(tblP, [{ A: NA, sk: "flat", x: 0.2, z: -0.21, dir: fwd, w: 1 - busyA, g: 1, arc: 0.05 }, { A: NT, sk: "flat", x: 0.53, z: -0.17, dir: fwd, w: 1 - busyT, g: 1, arc: 0.05 }]);
    // ---- the mic ----
    const shB = vUpper.localToWorld(v3(0.204, 0.3, 0)), shN = nenaUp.localToWorld(v3(-0.21, 0.4, 0.03));
    // where the mic sits when it is at his mouth: its ball a hand's breadth in front of his lips, its body leaning back down toward his chest
    const micAtMouth = () => { const m = vHead.localToWorld(v3(0, 0.062, 0.2)), ax0 = v3(0.1, 0.8, 0).add(v3(0, 0, 1).transformDirection(vHead.matrixWorld).multiplyScalar(0.55)).normalize(); let pos = m.clone().addScaledVector(ax0, -mic.dim.headY); const ax = across(ax0, pos, shB, 0.6); pos = m.clone().addScaledVector(ax, -mic.dim.headY); return { pos, ax }; };
    const mouthB = vHead.localToWorld(v3(0, 0.07, 0.11)), mouthN = nenaHead.localToWorld(v3(0, 0.045, 0.1));
    const two = (pos, quat, grips, o) => { gripHold(mic, pos, quat, grips, o); gripHold(mic, pos, quat, grips, o); };          // twice: the second pass turns the palm to the arm the first one made
    if (t < HO.bOpen[1]) {                                                   // Buloy has it: up in the air, at his mouth, then held out to her
      const kM = smooth((t - (A.proud ? A.proud.s : 2)) / 0.5), kH = smooth((t - (tNm - 1.5)) / 0.5), MM = micAtMouth(), pos = _mp.copy(M_B1).lerp(MM.pos, kM).lerp(M_H, kH);
      pos.y += 0.03 * wCel * Math.abs(Math.sin(t * 5.5)) * (1 - kM);
      const ax = v3(0.12, 1, 0.1).lerp(MM.ax, kM * (1 - kH)).lerp(v3(0.1, 1, 0), kH);
      two(pos, qAxis(kM > 0.99 && kH < 0.01 ? ax : across(ax, pos, shB)), [{ A: BL, sk: "low", w: 1, g: 1 - hBO }, { A: NA, sk: "high", w: hNR, g: hNG, clear: 0.07 }], { carrier: t >= HO.nGrasp[1] ? 1 : 0 });
    } else if (t < HO.nOpen[1]) {                                            // she has it: to her mouth for the cough, a tap on the ball, then kept in her fist over the table; later held out to him
      const axN = v3(0, 0.8, 0).addScaledVector(fwd, -0.55).normalize(), atMouth = mouthN.clone().addScaledVector(fwd, 0.085).add(v3(0, -0.035, 0)).addScaledVector(axN, -mic.dim.headY);
      const keep = nena.localToWorld(v3(-0.16, 1.36, 0.36)), pos = _mp.copy(M_H).lerp(atMouth, hMo).lerp(keep, hDn).lerp(M_H, hOf);
      const q = qAxis(across(v3(0.1, 1, 0).lerp(axN, hMo * (1 - hDn)).lerp(v3(0.05, 1, 0.25), hDn * (1 - hOf)), pos, shN, 0.6));
      two(pos, q, [{ A: NA, sk: "high", w: 1, g: 1 - hNO }, { A: BL, sk: "low", w: t < tNe ? 1 - hBA : hBR, g: t < tNe ? 0 : hBG, clear: 0.07 }], { carrier: t >= HO.bGrasp[1] ? 1 : 0 });
      const tapU = t > tNm + 0.9 && t < tNe + 0.25 ? Math.max(0, Math.sin((t - tNm - 0.9) * 12)) : 0, tapW = smooth((t - (tNm + 0.55)) / 0.3) * (1 - smooth((t - (tNe + 0.2)) / 0.25));
      if (tapW > 0.001) for (let k = 0; k < 2; k++) gripTouch(mic, [{ A: NT, sk: "tap", dir: mic.g.worldToLocal(nenaUp.localToWorld(v3(0.3, 0.62, 0.25))).sub(v3(0, mic.dim.headY, 0)).normalize().add(v3(0, 0.2, 0)), w: tapW, steep: 0.95, lift: 0.001 + 0.03 * (1 - tapU), contact: tapU > 0.97 && tapW > 0.999, clear: 0.05 }]);
    } else {                                                                 // he has it again: back up to his mouth
      const MM = micAtMouth(), pos = _mp.copy(M_H).lerp(MM.pos, hUp), q = qAxis(hUp > 0.99 ? MM.ax : across(v3(0.1, 1, 0).lerp(MM.ax, hUp), pos, shB));
      two(pos, q, [{ A: BL, sk: "low", w: 1, g: 1 }, { A: NA, sk: "high", w: 1 - hNA, g: 0, clear: 0.07 }], { carrier: 0 });
    }
  },
};
