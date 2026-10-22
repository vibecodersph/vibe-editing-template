// ---------- camera set-ups: position, look-at, lens, slow push ----------
const SHOTS = {
  open:   { p: [1.5, 1.05, 1.7],   l: [-0.1, 1.0, -0.9],  fov: 47, d: [-0.05, 0, -0.1], ease: 2.6 },     // both of them, from the first frame
  hero:   { p: [1.3, 0.5, 10.4],   l: [0.15, 2.0, -1.4],  fov: 38, d: [-0.04, 0, -0.45], cap: 665 },    // the whole street: this is where the silence plays
  wide2:  { p: [3.1, 0.6, 4.3],    l: [-0.15, 1.6, -1.2], fov: 47, d: [-0.02, 0, -0.03] },
  two:    { p: [-0.05, 1.05, 4.9], l: [-0.05, 0.95, -0.9], fov: 31, d: [0, 0, -0.05], cap: 318 },
  high:   { p: [-2.4, 2.75, 2.9],  l: [0.0, 1.02, -0.9],  fov: 33, d: [0.02, -0.01, -0.02] },
  viron:  { p: [0.5, 1.2, 1.35],   l: [-0.55, 1.17, -0.9], fov: 26, d: [-0.008, 0, -0.025] },   // from Claude's side, so we see his face
  vclose: { p: [0.08, 1.28, 0.8],  l: [-0.55, 1.25, -0.9], fov: 23, d: [-0.004, 0, -0.02] },
  claude: { p: [-0.4, 0.98, 1.8],  l: [0.5, 1.0, -0.9],   fov: 27, d: [0.01, 0, -0.025] },      // from Buloy's side
  pov:    { p: [-1.0, 1.3, -1.3],  l: [-0.04, 1.248, -1.025], fov: 50, d: [0.012, 0, 0.004] },    // from behind Buloy: Claude, with the parol and the street beyond
  over:   { p: [2.15, 1.2, 0.45],  l: [-0.5, 1.12, -0.95], fov: 31, d: [-0.015, 0, -0.01], cap: 330 },     // past Claude to Buloy
  store:  { p: [1.05, 1.64, 1.2],  l: [-0.12, 1.62, -2.2], fov: 35, d: [-0.012, 0, -0.02], cap: 1215 },
  laptop: { p: [-1.3, 1.48, -1.12], l: [-0.55, 0.76, -0.5], fov: 38, d: [0.01, -0.006, 0.008] },     // over his right arm, onto the screen
  side:   { p: [-2.4, 1.1, 1.35],  l: [-0.28, 1.05, -0.9], fov: 31, d: [0.03, 0, -0.01] },
  cover:  { p: [1.45, 1.05, 1.5],  l: [-0.02, 1.0, -0.9], fov: 46, d: [0, 0, 0] },                 // for the still: both of them, large
  // episode 2, "Baka Tao, Baka Ako"
  hook:     { p: [1.1, 0.95, 1.95], l: [-0.12, 1.02, -0.9], fov: 49, d: [-0.01, 0, -0.04], cap: 1250 },                       // the two of them from the front and a little low, Aling Nena fanning behind, the sign over her
  nena:     { p: [-0.2, 1.62, -0.3], l: [-0.2, 1.6, -2.2], fov: 28, d: [0.004, 0, -0.03], cap: 1180 },                        // a medium close-up of Aling Nena at her counter
  nenawide: { p: [-0.2, 1.5, 0.9], l: [-0.2, 1.25, -2.0], fov: 38, d: [0, 0, 0] },                                  // review only: her whole upper body
  nenaside: { p: [-1.95, 1.3, -1.95], l: [-0.2, 1.2, -1.95], fov: 50, d: [0, 0, 0] },                                  // review only: her from the side
  nenaface: { p: [-0.2, 1.66, -0.6], l: [-0.2, 1.6, -2.2], fov: 15, d: [0, 0, 0] },                              // review only: her face close
  react:    { p: [-0.02, 1.1, 3.2], l: [-0.02, 1.05, -1.5], fov: 42, d: [0, 0, -0.2], cap: 1250 },                            // both of them, Aling Nena soft behind, a slow push
  phone:    { p: [-0.19, 1.7, -2.08], l: [-0.17, 1.34, -1.83], fov: 30, near: 0.06, d: [-0.004, -0.002, 0.006] },              // over her shoulder, onto her phone
  notebook: { p: [-0.13, 1.9, -0.7], l: [-0.13, 1.04, -1.6], fov: 25, cap: 1330, d: [0, 0, -0.01] },                         // looking down at the utang notebook and her tapping finger
  plead:    { p: [0.1, 1.25, 2.2], l: [0.0, 1.0, -0.9], fov: 46, cap: 1250, d: [0.01, 0, -0.03] },                         // past Buloy's shoulder as he turns to Claude, Claude's face beyond
  gag:    { p: [2.2, 1.15, 1.9],   l: [-0.25, 1.1, -1.3], fov: 40, d: [-0.01, 0, -0.02] },        // Claude near, Buloy's face, Aling Nena behind
};

if (typeof SET !== "undefined") Object.assign(SHOTS, SET.shots);               // a set (src/sets/<name>.js) adds its own camera set-ups

// ---------- acting ----------
const L = TL.lines;
const lineAt = (t) => L.find((x) => t >= x.s - 0.05 && t <= x.e + 0.05);
const ampAt = (who, t) => {
  const a = TL.amp[who], f = t * TL.fps, i = Math.floor(f);
  if (!a) return 0;
  const v0 = a[i] || 0, v1 = a[i + 1] || 0;
  return v0 + (v1 - v0) * (f - i);
};
const blinkAt = (t, off, every = 3.9) => { const u = (t + off) % every; return u < 0.14 ? Math.sin((u / 0.14) * Math.PI) : 0; };
const act = (name) => L.find((x) => x.act === name);
const span = (ln, t) => (ln ? clamp01((t - ln.s) / (ln.e - ln.s)) : 0);
const during = (ln, t, pad = 0.25) => !!ln && t > ln.s - pad && t < ln.e + pad;
const aProud = act("proud"), aShame = act("shame"), aAsk = act("ask"), aTease = act("tease"), aAha = act("aha"), aTurn = act("turn_back");
const aWorry = act("worry"), aWhine = act("whine"), aOffer = act("offer"), aPlead = act("plead"), cHonest = act("c_honest"), cUnsure = act("c_unsure"), cButton = act("c_button");
const aNLean = act("n_lean"), aNFlip = act("n_flip");
const EP2 = !!(aNLean || aNFlip);                                       // episode 2 props and acts are on only when its acts exist
const shotT = (name, from = 0) => { const c = TL.shots.find((x) => x.shot === name && x.t >= from); return c ? c.t : null; };
const capT = (prefix) => { const c = TL.caps.find((x) => x.text.indexOf(prefix) === 0); return c ? c.s : null; };
const cGreet = act("c_greet"), cBack = act("c_back"), cShake = act("c_shake"), cCode = act("c_code"), cWin = act("c_win"), cDead = act("c_deadpan");

// Where Buloy looks. yaw +: toward Claude on his left. pitch +: down at the laptop.
const vYaw = [[0, 0.62]], vPitch = [[0, 0.03]], vTurn = [[0, 0]], vSmile = [[0, 0.55]], vBrow = [[0, 0.35]];
// Quiet-acting keys, all 0 at rest so the acts below play as they always did. Set them like the others, for example
//   key(vSad, t, 0.8, 0.6) eases the sad brow in from time t over 0.6 s; key(vWet, t, 1, 1.2) brings tears; vLid droops the upper lids;
//   vCheek lifts the cheeks (pair with vSmile 0.4..0.7); vPucker rounds the lips. vLife scales the idle life (1 = on, 0 = frozen).
const vLid = [[0, 0]], vSad = [[0, 0]], vWet = [[0, 0]], vCheek = [[0, 0]], vPucker = [[0, 0]], vLife = [[0, 1]];
const key = (arr, t, v, e) => arr.push([t, v, e]);
if (aShame) {
  key(vYaw, aShame.s - 0.6, 0.05, 0.35); key(vPitch, aShame.s - 0.6, 0.3, 0.35); key(vSmile, aShame.s - 0.75, -0.35, 0.3); key(vBrow, aShame.s - 0.75, -0.9, 0.3);
  key(vYaw, aShame.e + 0.45, 0.6); key(vPitch, aShame.e + 0.45, 0.04); key(vSmile, aShame.e + 0.5, 0); key(vBrow, aShame.e + 0.5, 0);
}
if (aAsk) { key(vBrow, aAsk.s - 0.1, 0.8, 0.3); key(vSmile, aAsk.s - 0.1, 0.25, 0.3); key(vBrow, aAsk.e + 0.2, 0.1); key(vSmile, aAsk.e + 0.2, 0); }
if (aTease) { key(vSmile, aTease.s - 0.15, 0.75, 0.3); key(vBrow, aTease.s - 0.15, 0.5, 0.3); key(vSmile, aTease.e + 0.6, 0.1); key(vBrow, aTease.e + 0.6, 0); }
if (aAha) {
  key(vYaw, aAha.s - 0.25, 0.08, 0.4); key(vPitch, aAha.s - 0.25, -0.12, 0.4); key(vBrow, aAha.s - 0.2, 1, 0.3); key(vSmile, aAha.s + 0.9, 0.5, 0.5);
  key(vYaw, aAha.e + 0.1, 0.62); key(vPitch, aAha.e + 0.1, 0.03); key(vBrow, aAha.e + 0.4, 0.2);
}
if (aTurn) { const m = aTurn.s + (aTurn.e - aTurn.s) * 0.24; key(vTurn, m, 1, 0.55); key(vYaw, m, 0.2, 0.5); key(vSmile, m, 0.6, 0.4); key(vBrow, m, 0.6, 0.4); }
if (!EP2) { const z = L[L.length - 1]; key(vTurn, z.s + 0.9, 0.22, 0.5); key(vYaw, z.s + 0.9, 0.72, 0.45); key(vBrow, z.s + 1.1, -0.75, 0.35); key(vSmile, z.s + 1.1, -0.4, 0.35); }   // the look he gives Claude at the end
if (EP2) {
  // worry (line 0): looks down at the headline phone in his hand, then up at Claude; brows pinched
  if (aWorry) {
    vPitch[0][1] = 0.3; vYaw[0][1] = 0.35; vBrow[0][1] = -0.6; vSmile[0][1] = -0.25; vSad.push([0, 0.35, 0.01]);
    const m = aWorry.s + (aWorry.e - aWorry.s) * 0.5;
    key(vPitch, m, 0.02, 0.35); key(vYaw, m, 0.62, 0.35); key(vSad, m + 0.5, 0.15, 0.6); key(vBrow, m + 0.4, -0.35, 0.5);
    key(vBrow, aWorry.e + 0.3, 0.2, 0.6); key(vSmile, aWorry.e + 0.3, 0, 0.6); key(vSad, aWorry.e + 0.3, 0, 0.6);
  }
  // whine (line 2): chin up, brows up, a small hand gesture (in renderAt)
  if (aWhine) {
    key(vPitch, aWhine.s - 0.1, -0.12, 0.3); key(vBrow, aWhine.s - 0.1, 0.85, 0.3); key(vSad, aWhine.s - 0.1, 0.25, 0.3); key(vSmile, aWhine.s - 0.1, -0.2, 0.3);
    key(vPitch, aWhine.e + 0.3, 0.03, 0.5); key(vBrow, aWhine.e + 0.3, 0.3, 0.5); key(vSad, aWhine.e + 0.3, 0, 0.5); key(vSmile, aWhine.e + 0.3, 0, 0.5);
  }
  // offer (line 5): a firm small nod, then steady
  if (aOffer) {
    key(vPitch, aOffer.s + 0.05, 0.17, 0.12); key(vPitch, aOffer.s + 0.3, 0.03, 0.18);
    key(vBrow, aOffer.s - 0.2, 0.1, 0.3); key(vSmile, aOffer.s - 0.2, 0.15, 0.3); key(vBrow, aOffer.e + 0.3, 0.2, 0.5); key(vSmile, aOffer.e + 0.3, 0, 0.5);
  }
  // plead (line 7): brows up and a little desperate
  if (aPlead) {
    key(vBrow, aPlead.s - 0.2, 0.75, 0.3); key(vSad, aPlead.s - 0.2, 0.45, 0.3); key(vSmile, aPlead.s - 0.2, -0.1, 0.3);
    key(vYaw, aPlead.s - 0.2, 0.5, 0.3);
  }
  { const z = L[L.length - 1]; key(vBrow, z.s + 0.5, -0.5, 0.5); key(vSmile, z.s + 0.5, -0.3, 0.5); }
}
for (const a of [vYaw, vPitch, vTurn, vSmile, vBrow, vLid, vSad, vWet, vCheek, vPucker, vLife]) a.sort((x, y) => x[0] - y[0]);
// Claude: yaw - is toward Buloy
const cYaw = [[0, -0.55]], cTilt = [[0, 0]];
if (cGreet) { const q = cGreet.s + (cGreet.e - cGreet.s) * 0.5; key(cTilt, q, 0.2, 0.3); key(cTilt, cGreet.e + 0.5, 0, 0.4); }
if (cBack) { key(cYaw, cBack.s + 0.3, -2.2, 0.45); key(cYaw, cBack.s + 2.5, -0.55, 0.5); }
if (cCode) { const q = cCode.e - cCode.s; key(cYaw, cCode.s + q * 0.24, -1.4, 0.4); key(cYaw, cCode.e + 0.3, -0.55, 0.5); }
if (cDead) { key(cYaw, cDead.s - 0.25, -1.45, 0.4); key(cYaw, cDead.e + 0.12, 0.5, 0.5); }
if (aTurn) key(cYaw, aTurn.s + 0.6, -1.1, 0.5);
if (cButton) key(cYaw, cButton.s - 0.2, 0.05, 0.5);                       // c_button: he turns his face to the lens
for (const a of [cYaw, cTilt]) a.sort((x, y) => x[0] - y[0]);
const nface = { blink: 0, open: 0, smile: 0.1, brow: 0, gx: 0, gy: 0, squint: 0, wide: 0 };
const nenaKeys = [[0, 0]];
if (aTurn) nenaKeys.push([aTurn.s + (aTurn.e - aTurn.s) * 0.4, 1]);

const END = TL.end || { s: TL.dur + 9, e: TL.dur + 9 };
const endEl = document.getElementById("endcard");
const CARD_CAP_TOP = 506;   // the caption lane over card C1: the free band between the logo (bottom y 450) and the message (top y 700 or lower); two caption rows end near y 645
// The closing card's message (layout C1 "Logo up"): it starts at 108 px and shrinks in 0.5 px steps until its widest row, stroke included, is 800 px or less
// (kami_c_variants.mjs fitMessage, with the same stroke, width 800 and middle y 880). Its middle is y 880; the card is first shown at END.s + 0.25.
function fitEndMessage() {
  const box = document.getElementById("endline");
  if (!box) return;
  const rows = [...box.querySelectorAll("span")];
  const apply = (s) => { box.style.fontSize = s + "px"; box.style.setProperty("-webkit-text-stroke-width", (s * 5 / 78).toFixed(2) + "px"); };
  let size = 108;
  for (; size > 30; size -= 0.5) {
    apply(size);
    const widest = Math.max(...rows.map((r) => r.getBoundingClientRect().width)) + size * 5 / 78;   // the stroke is centred on the outline: half of it each side
    if (widest <= 800) break;
  }
  box.style.top = Math.round(880 - box.getBoundingClientRect().height / 2) + "px";
}
// once the card's fonts are in (not blocking the rest of the module)
(async () => {
  await document.fonts.load('700 108px "Fraunces"');
  await document.fonts.load('400 26px "Gelasio"');
  await document.fonts.ready;
  fitEndMessage();
})();
const tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();
const face = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0 };
// Idle life: the eyes make tiny jumps now and then (seeded, so any frame draws the same), the chest breathes, the head is never quite still.
function eyeDrift(t) {
  const k = Math.floor(t * 1.6), u = smooth((t * 1.6 - k) / 0.07);
  const a = rng(k * 7 + 3), b = rng((k - 1) * 7 + 3);
  const ax = a() - 0.5, ay = a() - 0.5, bx = b() - 0.5, by = b() - 0.5;
  return [(bx + (ax - bx) * u) * 0.34, (by + (ay - by) * u) * 0.2];
}

// Aling Nena's arms: a two-bone solve in her upper body's frame, blended with a rest pose by weight w.
const _nS = new THREE.Vector3(), _nT = new THREE.Vector3(), _nE = new THREE.Vector3(), _nD = new THREE.Vector3(), _nP = new THREE.Vector3(), _nV = new THREE.Vector3(), _nV2 = new THREE.Vector3(), _nDown = new THREE.Vector3(0, -1, 0);
const _nQ1 = new THREE.Quaternion(), _nQ2 = new THREE.Quaternion(), _nQr1 = new THREE.Quaternion(), _nQr2 = new THREE.Quaternion(), _nEu = new THREE.Euler();
function solveNenaArm(arm, targetWorld, w, restU, restF) {
  _nT.copy(targetWorld); nenaUp.worldToLocal(_nT);
  _nS.copy(arm.up.position);
  const A = 0.24, B = 0.235;
  _nD.subVectors(_nT, _nS); const d = Math.min(Math.max(_nD.length(), 0.08), A + B - 0.005); _nD.normalize();
  const x = (A * A - B * B + d * d) / (2 * d), h = Math.sqrt(Math.max(0, A * A - x * x));
  _nP.set(arm.pole[0], arm.pole[1], arm.pole[2]); _nP.addScaledVector(_nD, -_nP.dot(_nD)).normalize();
  _nE.copy(_nS).addScaledVector(_nD, x).addScaledVector(_nP, h);
  _nV.subVectors(_nE, _nS).normalize(); _nQ1.setFromUnitVectors(_nDown, _nV);
  _nV2.copy(_nS).addScaledVector(_nD, d).sub(_nE).normalize(); _nQ2.setFromUnitVectors(_nDown, _nV2);
  _nQ2.premultiply(_nQr1.copy(_nQ1).invert());
  arm.up.quaternion.copy(restU).slerp(_nQ1, w); arm.fore.quaternion.copy(restF).slerp(_nQ2, w);
}
const mixv = (a, b, w) => a + (b - a) * w;
const nQuat = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
const wPos = (o) => o.getWorldPosition(new THREE.Vector3());

// where the camera of a cut stands at time t (without the handheld breath): a set that turns a screen to the lens asks this, never camera.position, which still holds the last frame drawn
function shotCamPos(cut, t) { const sh = SHOTS[cut.shot] || SHOTS.hero; let u = t - cut.t; if (sh.ease) u = sh.ease * (1 - Math.exp(-u / (sh.ease * 0.6))); return new THREE.Vector3(sh.p[0] + sh.d[0] * u, sh.p[1] + sh.d[1] * u, sh.p[2] + sh.d[2] * u); }
function renderAt(time, opt) {                                                                          // opt.solve: pose the cast and the set, draw nothing (CINE.init, 51-cine.js, solves a cut's camera from the pose at its first moment)
  const t = Math.max(0, Math.min(TL.dur, time || 0));
  const ln = lineAt(t);
  const vAmp = ampAt("viron", t), cAmp = ampAt("claude", t);
  const vTalk = ln && ln.who === "viron" ? vAmp : 0; let cTalk = ln && ln.who === "claude" ? cAmp : 0;
  const nTalk = ln && ln.who === "nena" ? ampAt("nena", t) : 0;
  if (EP2) { if (cHonest && during(cHonest, t, 0)) cTalk *= 0.6; if (cUnsure && during(cUnsure, t, 0)) cTalk *= span(cUnsure, t) < 0.72 ? 0.35 : 0.1; }
  let cutNow = TL.shots[0]; for (const c of TL.shots) if (c.t <= t) cutNow = c;
  if (TL.forceAt) for (const k in TL.forceAt) if (Math.abs(t - parseFloat(k)) < 0.01) cutNow = { t, shot: TL.forceAt[k], forced: k };
  if (EP2) {                                                              // the bars that cross her face come out for her close shots only; the bulb hums while the fan is still
    const hide = cutNow.shot === "nena" || cutNow.shot === "notebook" || cutNow.shot === "nenaface";
    utang.visible = !hide; grilleBars[3].visible = grilleBars[4].visible = !hide; grilleBars[5].visible = cutNow.shot !== "notebook"; for (const rl of grilleRails) rl.visible = !hide;
    const rT = shotT("react"); bulbHum = rT !== null ? smooth((t - rT) / 0.2) * (1 - smooth((t - (rT + 1.5)) / 0.3)) : 0;
  }
  // the light goes from sunset to blue hour over the length of the talk
  const night = smooth((t - 3) / Math.max(1, END.s - 6));
  skyAt(t, night); setAt(t);
  hemi.intensity = 1.2 - 0.42 * night; hemi.color.setRGB(0.27 - 0.13 * night, 0.25 - 0.08 * night, 0.68 - 0.04 * night);
  duskRim.intensity = 1.5 - 0.95 * night; skyFill.intensity = 0.75 - 0.3 * night;
  RIM.uRimColor.value.setRGB(0.9 - 0.45 * night, 0.38 + 0.07 * night, 0.45 + 0.5 * night);

  // ----- Buloy -----
  const turnBack = track(vTurn, t, 0.6);
  const shame = aShame ? smooth((t - (aShame.s - 0.7)) / 0.3) * (1 - smooth((t - (aShame.e + 0.4)) / 0.5)) : 0;
  const nod = !vTalk && cTalk ? Math.sin(t * 2.6) * 0.022 * smooth(cTalk * 3) : 0;                 // he nods along when Claude talks
  vUpper.rotation.y = turnBack * 1.25;
  vUpper.rotation.x = 0.1 + Math.sin(t * 1.3) * 0.008 - turnBack * 0.09 + shame * 0.06;
  const life = track(vLife, t, 0.4), br = Math.sin(t * 1.9) * life;                                 // breathing: the chest swells, the shoulders rise a hair
  vUpper.scale.y = 1 + Math.sin(t * 1.3 + 1) * 0.006 - shame * 0.025 + br * 0.006;
  vUpper.scale.x = 1 + br * 0.012; vUpper.scale.z = 1 + br * 0.016;
  armL.yaw.position.y = armR.yaw.position.y = 0.44 + br * 0.004;
  vHead.rotation.y = track(vYaw, t, 0.45) + turnBack * 0.72 + Math.sin(t * 0.7) * 0.02;
  vHead.rotation.x = track(vPitch, t, 0.45) - vTalk * 0.05 + nod;
  vHead.rotation.z = Math.sin(t * 0.9 + 1) * 0.015 + vTalk * Math.sin(t * 9) * 0.022 - shame * 0.07;
  vHead.rotation.y += life * (Math.sin(t * 1.37) * 0.011 + Math.sin(t * 2.9 + 1) * 0.004);              // micro head motion
  vHead.rotation.x += life * (Math.sin(t * 1.13 + 2) * 0.008 + Math.sin(t * 3.3) * 0.002) + br * 0.004;
  vHead.position.y = 0.585 + br * 0.003;
  face.blink = Math.max(blinkAt(t, 0.8), shame > 0.5 ? blinkAt(t, 0.2, 1.1) : 0);
  face.open = clamp01(vTalk * 1.25);
  face.smile = track(vSmile, t, 0.4) * (1 - vTalk * 0.3);
  face.brow = track(vBrow, t, 0.4) + vTalk * 0.12;
  face.gx = clamp01(1 - turnBack) * (0.55 - shame * 1.1); face.gy = shame * 0.8;
  { const d = eyeDrift(t); face.gx += d[0] * life; face.gy += d[1] * life; }
  face.lid = track(vLid, t, 0.4); face.sad = track(vSad, t, 0.4); face.wet = track(vWet, t, 0.6);
  face.cheek = track(vCheek, t, 0.4); face.pucker = track(vPucker, t, 0.25);
  drawBuloy(face); faceTex.needsUpdate = true;
  lensMat.opacity = 0.012 + clamp01(track(vPitch, t, 0.45) * 2.2) * 0.04;
  // hands: resting on the keys, opening as he talks, on his knees when he turns round
  const g1 = vTalk * (0.5 + 0.5 * Math.sin(t * 5.2)), tease = during(aTease, t) ? 1 : 0;
  armL.yaw.rotation.y = -0.4 + turnBack * 0.3; armR.yaw.rotation.y = 0.4 - turnBack * 0.3 + g1 * 0.25;
  armL.sh.rotation.x = -0.3 - g1 * 0.08 - tease * vTalk * 0.5; armR.sh.rotation.x = -0.3 - g1 * 0.3;
  armL.sh.rotation.z = 0.06 + tease * vTalk * 0.25; armR.sh.rotation.z = -0.06 - g1 * 0.12;
  armL.el.rotation.x = -1.16 - tease * vTalk * 0.3 + turnBack * 0.25; armR.el.rotation.x = -1.16 - g1 * 0.5 + turnBack * 0.25;
  armR.hand.rotation.z = g1 * 0.5; armR.fingers.rotation.x = 0.4 - g1 * 0.3;
  drawScreen(t, 0.4); scrTex.needsUpdate = true;
  if (EP2) {
    // the laptop starts closed and opens on "magre-review"
    const oT = capT("magre-review"), lidOpen = oT === null ? 1 : smooth((t - oT) / 0.6);
    lid.rotation.x = mixv(-1.52, 0.33, lidOpen);
    // worry: shoulders up and tight, the headline phone held up toward us; it goes away when he starts to talk back
    const wk = aWorry ? 1 - smooth((t - (aWorry.e + 0.5)) / 0.8) : 0;
    headPhone.visible = !!aWorry && t < aWorry.e + 1.4;
    const tense = aWorry ? smooth(t / 0.4) * (1 - smooth((t - (aWorry.e + 0.3)) / 0.8)) : 0;
    armL.yaw.position.y += tense * 0.022; armR.yaw.position.y += tense * 0.022; vUpper.rotation.x += tense * 0.05;
    armL.yaw.rotation.y = mixv(armL.yaw.rotation.y, 0.2, wk); armL.sh.rotation.x = mixv(armL.sh.rotation.x, -1.05, wk); armL.sh.rotation.z = mixv(armL.sh.rotation.z, 0.1, wk);
    armL.el.rotation.x = mixv(armL.el.rotation.x, -1.6, wk); armL.hand.rotation.z = mixv(armL.hand.rotation.z, 0, wk);
    // whine: a small hand gesture
    const wh = aWhine ? smooth((t - (aWhine.s - 0.1)) / 0.3) * (1 - smooth((t - (aWhine.e + 0.1)) / 0.4)) : 0;
    armR.sh.rotation.x += wh * (-0.45 + Math.sin(t * 6) * 0.1); armR.el.rotation.x += wh * 0.25; armR.hand.rotation.z += wh * Math.sin(t * 7) * 0.3;
    // plead: the whole upper body turns toward Claude
    const pl = aPlead ? smooth((t - (aPlead.s - 0.3)) / 0.5) : 0;
    vUpper.rotation.y += pl * 0.85;
  }
  screenGlow.intensity = 0.16 + Math.sin(t * 5.1) * 0.01;

  // ----- Claude -----
  const shake = during(cShake, t, 0) && span(cShake, t) < 0.22 ? Math.sin((t - cShake.s) * 16) * 0.22 : 0;
  const win = during(cWin, t, 0.1) ? Math.abs(Math.sin((t - cWin.s) * 7)) * 0.045 : 0;
  const happy = during(cGreet, t, 0) && span(cGreet, t) < 0.38 ? 1 : 0;
  C.rotation.y = track(cYaw, t, 0.5) + shake;
  cBody.rotation.z = track(cTilt, t, 0.3) + Math.sin(t * 6.5) * cTalk * 0.05;
  cBody.scale.set(1 + cTalk * 0.05, 1 - cTalk * 0.07 + Math.sin(t * 1.7) * 0.012, 1 + cTalk * 0.05);
  const hop = happy && !win ? Math.abs(Math.sin((t - cGreet.s) * 9)) * 0.03 : 0;
  cBody.position.y = 0.085 + cTalk * 0.018 + win + hop;
  const codeU = cCode ? span(cCode, t) : 0, pointLap = during(cCode, t, 0) && codeU < 0.3 ? 1 : 0, pointV = during(cCode, t, 0) && codeU > 0.42 && codeU < 0.7 ? 1 : 0;
  cArms[0].position.y = 0.13 + cTalk * 0.045 * Math.sin(t * 11) + (pointLap + pointV) * 0.07 + win * 1.5;
  cArms[1].position.y = 0.13 + cTalk * 0.045 * Math.sin(t * 11 + 2) + win * 1.5;
  cArms[0].position.x = -0.275 - (pointLap + pointV) * 0.05;
  let cb = 1 - blinkAt(t, 2.3, 3.4) * 0.9, slide = 0, eyesHalf = 0;
  if (EP2) {
    cb = 1;
    if (cHonest) { const u = span(cHonest, t); cb = 1 - 0.95 * Math.exp(-(((u - 0.55) / 0.11) ** 2)); }   // c_honest: one slow blink, otherwise still
    else if (cUnsure) {
      const u = span(cUnsure, t), bump = during(cUnsure, t, 0) ? smooth((u - 0.2) / 0.1) * (1 - smooth((u - 0.4) / 0.12)) : 0;   // eyes slide toward Aling Nena and back
      slide = bump; cBody.rotation.z += bump * 0.05;
    } else if (cButton) eyesHalf = smooth((t - (cButton.s - 0.2)) / 0.4);
    else cb = 1 - blinkAt(t, 2.3, 3.4) * 0.9;
  }
  const dead = cDead && t > cDead.s - 0.3 ? 1 : 0;
  cEyes.forEach((e, i) => {
    e.scale.y = 0.08 * cb * (1 - dead * 0.5) * (1 - eyesHalf * 0.5);
    e.position.y = 0.2 - dead * 0.012;
    e.position.x = (i ? 1 : -1) * 0.14 - 0.012 + (EP2 ? 0 : Math.round(Math.sin(t * 0.37 + 1) * 0.8) * 0.006) - slide * 0.016;   // eyes rest toward Buloy, and wander
    e.rotation.z = 0;                                                                         // the cinematographer's eye shapes tilt them (51-cine.js); every frame starts level
    if (i === 1 && during(cGreet, t, 0) && span(cGreet, t) > 0.45) e.scale.y *= 0.6;       // one eye narrows on the question
  });
  cLegs.forEach((leg, i) => { leg.rotation.x = Math.sin(t * 2.2 + i * 1.3) * 0.22; leg.position.y = 0.045 + win; });
  CINE.blink = cb * (1 - dead * 0.5) * (1 - eyesHalf * 0.5);                                                                                       // the eye shapes (51-cine.js) blink with the same lids

  // ----- Aling Nena, the cat -----
  const nenaLook = track(nenaKeys, t, 0.5);
  nenaHead.rotation.y = 0.3 - nenaLook * 0.3 + Math.sin(t * 0.5) * 0.05;
  nenaHead.rotation.x = 0.26 - nenaLook * 0.2;
  nenaHead.rotation.z = 0; nenaUp.rotation.x = 0;
  let freeze = 0, wR = 0, wL = 0, flipW = 0, phoneW = 0, pointW = 0, leanW = 0;
  const tR = new THREE.Vector3(), tL = new THREE.Vector3();
  nface.blink = blinkAt(t, 1.3, 4.6); nface.open = clamp01(nTalk * 1.3); nface.smile = 0.12 + nTalk * 0.05; nface.brow = 0.05; nface.squint = 0; nface.gx = 0; nface.gy = 0;
  nface.wide = Math.sin(t * 8.1) * 0.7 * (nTalk > 0 ? 1 : 0) + Math.sin(t * 13.3) * 0.3 * (nTalk > 0 ? 1 : 0);
  if (EP2) {
    nenaL.up.visible = true;
    // the fan goes still for the bulb's hum between lines 4 and 5
    const rT = shotT("react"); if (rT !== null) freeze = smooth((t - rT) / 0.25) * (1 - smooth((t - (rT + 1.75)) / 0.35));
    // n_lean: forearms over the counter toward the bench, head tilted; on "Ikaw ba" the fan swings out to point at Claude
    if (aNLean) {
      leanW = smooth((t - (aNLean.s - 0.5)) / 0.7) * (1 - smooth((t - (aNLean.e + 0.25)) / 0.9));
      const pT = shotT("claude", aNLean.s);
      if (pT !== null) pointW = smooth((t - (pT - 0.75)) / 0.4) * (1 - smooth((t - (aNLean.e + 0.1)) / 0.5));
    }
    // the phone: she is typing with a thumb in the silence before line 6
    const phT = shotT("phone");
    if (phT !== null && aNFlip) phoneW = smooth((t - (phT - 0.5)) / 0.5) * (1 - smooth((t - (aNFlip.s - 0.15)) / 0.4));
    // n_flip: a satisfied little smile, the notebook opens to Buloy's page, she taps it
    const bT = shotT("notebook");
    if (aNFlip) flipW = smooth((t - (aNFlip.s - 0.2)) / 0.45);
    const dnW = aNFlip ? (bT !== null ? smooth((t - (bT - 0.4)) / 0.35) : flipW) : 0;   // eyes and shoulders go down to the book only when the camera does; for her line she looks at Buloy
    const openEnd = bT !== null ? bT - 0.12 : (aNFlip ? aNFlip.s + 1.8 : 0), openW = aNFlip ? smooth((t - (openEnd - 0.95)) / 0.8) : 0;
    const tapping = aNFlip && t > openEnd - 0.25 ? 1 : 0;
    nenaUp.rotation.x = 0.4 * leanW + 0.08 * phoneW + 0.3 * dnW;
    nenaHead.rotation.z = 0.14 * leanW; nenaHead.rotation.x += -0.55 * leanW + 0.3 * phoneW + 0.05 * flipW;
    nenaHead.rotation.y += pointW * 0.1;
    nface.smile = 0.15 + leanW * 0.2 + pointW * 0.15 + flipW * 0.55 + nTalk * 0.05; nface.brow = 0.1 + leanW * 0.3 + pointW * 0.35;
    nface.squint = Math.max(leanW * 0.35, pointW * 0.5, flipW * 0.6);
    nface.gy = phoneW * 1.0 + dnW * 0.7 * (1 - phoneW); nface.gx = -leanW * 0.1;
    if (phoneW > 0.3) nface.blink = Math.max(nface.blink, blinkAt(t, 0.4, 2.7));
    nena.updateMatrixWorld(true);
    // targets, in the world
    const cnt = (x, z) => new THREE.Vector3(x, 1.075, z);
    tR.copy(cnt(-0.03, -1.62)); tL.copy(cnt(-0.37, -1.62)); wR = leanW; wL = leanW;
    if (pointW > 0) {
      const sh = wPos(nenaR.up), dir = new THREE.Vector3(0.52 - sh.x, 0.82 - sh.y, -0.87 - sh.z).normalize();
      tR.lerp(sh.clone().addScaledVector(dir, 0.45), pointW); wR = Math.max(wR, pointW);
    }
    if (phoneW > 0) {
      const P = new THREE.Vector3(-0.17, 1.36, -1.82);
      tR.lerp(P.clone().add(new THREE.Vector3(0.062, -0.082, -0.01)), phoneW); tL.lerp(P.clone().add(new THREE.Vector3(-0.062 + Math.sin(t * 13) * 0.004, -0.082 + Math.abs(Math.sin(t * 9)) * 0.006, -0.01)), phoneW);
      wR = Math.max(wR, phoneW); wL = Math.max(wL, phoneW);
    }
    if (flipW > 0) {
      const tapY = tapping ? Math.max(0, Math.sin((t - (openEnd - 0.25)) * 17)) * 0.03 : 0.035;
      const B = new THREE.Vector3(-0.07, 1.04 + 0.052 + tapY, -1.6);
      tR.lerp(B, flipW); tL.lerp(new THREE.Vector3(-0.24, 1.1, -1.6), flipW); wR = Math.max(wR, flipW); wL = Math.max(wL, flipW);
    }
    const swing = Math.sin(t * 5.2) * 0.3 * (1 - nenaLook * 0.8) * (1 - freeze);
    nenaFore.rotation.set(-1.9, 0, swing);
    solveNenaArm(nenaR, tR, wR, nQuat(-0.25, 0, 0), new THREE.Quaternion().setFromEuler(nenaFore.rotation));
    solveNenaArm(nenaL, tL, wL, nQuat(-0.08, 0, -0.1), nQuat(-0.35, 0, 0));
    // the fan: swinging, still, pointing, or put down while her hands are busy
    fan.visible = !(phoneW > 0.4 || flipW > 0.5);
    nenaR.H.fingers.rotation.x = fan.visible ? 1.1 : phoneW > 0.4 ? 0.8 : 0.12; nenaL.H.fingers.rotation.x = flipW > 0.5 ? 0.12 : phoneW > 0.4 ? 0.8 : 0.5;     // the fan is held, the notebook is touched flat
    fan.rotation.set(0, 0, 0); if (pointW > 0) fan.rotation.set(mixv(0, 1.2, pointW), 0, mixv(0, 0.5, pointW));
    // the phone, held in front of her; the notebook, opening
    nena.updateMatrixWorld(true);
    nenaPhone.visible = phoneW > 0.2 && cutNow.shot !== "nena";
    if (nenaPhone.visible) { nenaPhone.position.set(-0.17, 1.36, -1.82); drawChat(t - (phT !== null ? phT : 0)); }
    utangBook.visible = !!aNFlip && t > (openEnd - 1.4);
    bookCoverPivot.rotation.z = mixv(0, Math.PI, openW); bookLeftPage.visible = openW > 0.5;
    notebook.visible = false;
  } else {
    nenaR.H.fingers.rotation.x = 1.1; nenaL.H.fingers.rotation.x = 0.5;                                  // episode 1: the fan is held
    nenaArm.rotation.x = -0.25; nenaFore.rotation.set(-1.9, 0, Math.sin(t * 5.2) * 0.3 * (1 - nenaLook * 0.8));
    nenaL.up.visible = false; nenaR.up.quaternion.setFromEuler(new THREE.Euler(-0.25, 0, 0));
    nenaFore.quaternion.setFromEuler(nenaFore.rotation);
  }
  drawNena(nctx, nface); nenaTex.needsUpdate = true;
  catTail.rotation.y = Math.sin(t * 1.4) * 0.45; catEars[0].rotation.x = Math.max(0, Math.sin(t * 0.9)) > 0.97 ? 0.4 : 0;

  GRIP.begin();                                                                         // a fresh frame for the grip system (47-grip.js)
  const pre = CINE.pre(t, ln, cutNow);                                                            // what the director posed, so the cinematographer can tell whether the set posed over it
  if (typeof SET !== "undefined") SET.update(t, { nTalk, vTalk, cTalk, ln, shot: cutNow.shot, cut: cutNow });   // the set poses its own cast and moves its own world
  CINE.after(t, ln, cutNow, pre);                                                       // eyelines and Claude's eye shapes where the set left them to the director (51-cine.js)
  if (opt && opt.solve) return;
  // ----- camera: the cut that owns this moment, a slow push, a breath of handheld -----
  let cut = TL.shots[0];
  for (const c of TL.shots) if (c.t <= t) cut = c;
  if (TL.forceAt) for (const k in TL.forceAt) if (Math.abs(t - parseFloat(k)) < 0.01) cut = { t, shot: TL.forceAt[k], forced: k };     // review sheets (tools/lab.py) can ask for another camera at a moment
  const cc = CINE.camAt(cut, t);                                                           // a shot the cinematographer solved (51-cine.js): its camera at this moment, push and punch-in included; null for a hand-placed shot
  const sh = SHOTS[cut.shot] || SHOTS.hero;
  if (cc) tmpP.copy(cc.p);
  else {
    let u = t - cut.t;
    if (sh.ease) u = sh.ease * (1 - Math.exp(-u / (sh.ease * 0.6)));                        // a push that settles
    tmpP.set(sh.p[0] + sh.d[0] * u, sh.p[1] + sh.d[1] * u, sh.p[2] + sh.d[2] * u);
  }
  tmpP.x += Math.sin(t * 0.83) * 0.006; tmpP.y += Math.sin(t * 1.07 + 2) * 0.005;
  if (typeof SET !== "undefined" && SET.shake) { const sk = SET.shake(t); tmpP.x += sk[0]; tmpP.y += sk[1]; }       // a set can shake the camera (the jeepney does when it speeds)
  if (cc) { tmpL.copy(cc.l); camera.near = cc.near; camera.fov = cc.fov; }
  else { tmpL.set(sh.l[0], sh.l[1], sh.l[2]); camera.near = sh.near || 0.35; camera.fov = cut.zoom ? 2 * Math.atan(Math.tan(sh.fov * Math.PI / 360) / cut.zoom) * 180 / Math.PI : sh.fov; }   // a cut's "zoom" narrows the lens about the point the camera looks at
  camera.position.copy(tmpP); camera.updateProjectionMatrix(); camera.lookAt(tmpL);
  CINE.light(cut, cc);                                                                     // the cinematographer's key, rim and fog for this shot; the set's own back on a hand-placed one
  sky.position.copy(camera.position);

  // ----- captions and the closing card -----
  const cap = TL.caps.find((c) => t >= c.s && t < c.e);
  const text = cap ? cap.text : "";
  if (capEl.textContent !== text) capEl.textContent = text;
  capEl.style.color = cap && cap.who === "claude" ? "#ffd65a" : cap && cap.who === "nena" ? "#ff74bd" : cap && cap.who === "prof" ? "#9fe8ff" : "#ffffff";
  capEl.style.top = (t >= END.s ? CARD_CAP_TOP : cc ? CINE.capTop(cut, cap) : (sh.cap || 470)) + "px";   // over the closing card every caption takes the card's own lane (a set's older capCard rows sat where the C1 chip is now)
  const fade = smooth((t - END.s) / 0.5);
  grade.uniforms.uFade.value = fade * 0.95;
  if (endEl) { endEl.style.opacity = String(smooth((t - END.s - 0.25) / 0.45)); endEl.style.transform = "translateY(" + ((1 - smooth((t - END.s - 0.25) / 0.6)) * 24).toFixed(1) + "px)"; }

  if (EP2) { armL.hand.updateMatrixWorld(true); if (headPhone.visible) { const hp = wPos(armL.hand), toCam = camera.position.clone().sub(hp).normalize(); headPhone.position.copy(hp).add(new THREE.Vector3(0, cutNow.shot === "hook" ? -0.07 : 0, 0)).addScaledVector(toCam, 0.1).addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), cutNow.shot === "viron" ? -0.1 : 0); headPhone.lookAt(camera.position); headPhone.scale.setScalar(cutNow.shot === "hook" ? 1.4 : 1); } if (nenaPhone.visible) nenaPhone.lookAt(camera.position); }   // the screens turn to the lens: this is how they stay readable
  insertsAt(t);                                                                                          // a picture insert, if the timeline has one now (49-assets.js)
  updateHands();                                                                                         // every hand takes this frame's pose
  composer.render();
}

// the first frame and the seek hook are in 51-cine.js, after the cinematographer has solved its cameras
