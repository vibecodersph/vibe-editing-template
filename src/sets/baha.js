// ---------- SET: the flooded street (episode 6, "Sa Laptop Ko") ----------
// A narrow street in the rain. World: the street runs along x, the camera looks down -z. The table Buloy sits on stands at x -0.45 (top at y 1.5),
// the brown water is at y 0.9 (waist height on a standing figure), the delivery rider stands in it at x 0.6, hollow-block walls and a shuttered store behind.
// Same contract as the other sets: SET.shots (cameras) and SET.update(t, ctx), a pure function of time. px, v3, vtrack and reach come from 46-rig.js.
// Everything held is a solid prop on the grip system (47-grip.js, 48-solid.js): the two phones, the laptop that changes hands and ends on Claude's head.
// The episode's own pictures (script.json "assets", 49-assets.js) dress the street when they are there: far (the street's far end), sky, store (a closed
// store front), wall, yero, water. Without them the set falls back to its painted blocks, so it still builds for a script that names no assets.

for (const o of scene.children) if (!o.isLight) o.visible = false;
const room = group(scene, 0, 0, 0);
scene.background = new THREE.Color(0xa3adb5); scene.fog = new THREE.Fog(0xa3adb5, 9, 26);
const HAS = (n) => ASSET.has(n);
const HBW = HAS("wall") ? ASSET.tex("wall", { pixel: true, repeat: [1, 1] }) : TEX.block("#8d8a80", "#6f6c64", "#a09c92", 31), HBT = HAS("wall") ? 2.2 : 1.2;
const PLS = TEX.plaster("#c9b88e", "#a89870", 12), YR = HAS("yero") ? ASSET.tex("yero", { pixel: true, repeat: [1, 1] }) : TEX.yero("#b4bdc8", "#8f99a6", "#6c7686", "#9a5a3c");
const WATER_Y = 0.9, TABLE_Y = 1.5;

// ================= the street =================
box(room, 14, 0.2, 40, 0x3a3630, 0, 0.1, -12, { noShadow: true });                                                           // the road bed under the water
tbox(room, 0.2, 3.4, 26, PLS, 1.2, -3.4, 1.7, -7.0, { noShadow: true }); tbox(room, 0.2, 3.4, 26, HBW, HBT, 4.0, 1.7, -7.0, { noShadow: true });
// the sky: the rain-cloud plate, far behind everything, its cloud part only
if (HAS("sky")) { const t = ASSET.tex("sky", { pixel: true }); t.repeat.set(1, 0.58); t.offset.set(0, 0.42); const p = plane(room, 96, 37, new THREE.MeshBasicMaterial({ map: t, fog: false, color: new THREE.Color(0.86, 0.88, 0.92) }), 0.3, 15.5, -42); p.receiveShadow = false; }
// the far end of the street: the painted plate, its top melting into the sky, its own flood hidden under ours; without it, low blocks in the haze
if (HAS("far")) { const sz = ASSET.size("far"), w = 10.5, h = w * sz[1] / sz[0]; const p = plane(room, w, h, new THREE.MeshBasicMaterial({ map: ASSET.tex("far", { pixel: true, fadeTop: 0.22 }), transparent: true, color: new THREE.Color(0.9, 0.9, 0.9) }), 0.9, 1.72 + (0.36 - 0.5) * h, -15.5); p.receiveShadow = false; p.renderOrder = -5; }
else {
  for (let i = 0; i < 6; i++) { const w = [4.4, 3.2, 5.0, 3.8, 4.6, 3.4][i], h = [4.5, 3.6, 5.6, 4.0, 5.0, 4.2][i]; tbox(room, w, h, 3, i % 2 ? HBW : PLS, 1.2, -2.6 + i * 1.3 - (i > 3 ? 2 : 0), h / 2, -13.5 - (i % 2) * 2.5, { noShadow: true }); }
  box(room, 2.4, 2.6, 0.2, 0x6a7a8a, 0.6, 1.3, -22, { noShadow: true });
}
// a closed store: with the plate, a building that stands where the street bends, shutter down, its tarpaulin lettered here; without it, a shutter on the left wall
if (HAS("store")) {
  const S = 3.5, g = group(room, -2.0, 0, -5.4);
  tbox(g, S, 4.3, 6, HBW, HBT, 0, 2.15, -3.02, { noShadow: true });                                                            // the block behind the front
  const f = plane(g, S, S, mat(0xffffff, { map: ASSET.tex("store", { pixel: true }) }), 0, WATER_Y - 0.115 * S + S / 2, 0.0); f.receiveShadow = true;
  plane(g, S * 0.75, S * 0.18, signMat(painted(64, 16, (c) => { c.fillStyle = "#2f5f9a"; c.fillRect(0, 0, 64, 16); const r = rng(41); for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? "#3b72b4" : "#27507e"; c.fillRect(Math.floor(r() * 60), 0, 1 + Math.floor(r() * 2), 16); } c.fillStyle = "#234a78"; c.fillRect(0, 14, 64, 2); c.fillStyle = "#4a84c8"; c.fillRect(0, 0, 64, 1); for (const x of [1, 62]) for (const y of [1, 13]) { c.fillStyle = "#d8dde4"; c.fillRect(x, y, 1, 1); } }, { mip: false })), 0.005 * S, WATER_Y - 0.115 * S + S * (1 - 0.262), 0.012);        // the tarp over the shutter: a blue trapal, no words (words here were always half behind a head or the umbrella)
  const aw = tbox(g, S + 0.3, 0.05, 1.3, YR, 1.3, 0, WATER_Y - 0.115 * S + S * 0.985, 0.55, { noShadow: false }); aw.rotation.x = 0.3;      // a rusty awning over the front
  for (const sx of [-1, 1]) box(g, 0.05, 0.05, 1.25, 0x4a4048, sx * (S / 2 + 0.05), WATER_Y - 0.115 * S + S * 0.97, 0.55, { noShadow: true }).rotation.x = 0.3;
} else {
  const g = group(room, -3.28, 0, -0.3); g.rotation.y = Math.PI / 2;
  box(g, 2.6, 1.9, 0.08, 0x5a6a7a, 0, 1.0, 0, { noShadow: true });
  for (let i = 0; i < 18; i++) box(g, 2.6, 0.02, 0.02, 0x4a5868, 0, 0.12 + i * 0.1, 0.05, { noShadow: true });                // the roll-up shutter
  plane(g, 2.4, 0.5, signMat(px("TINDAHAN\nSARADO", 96, 24, "#1f6a9a", "#ffffff", 2, { border: "#ffd23a" })), 0, 2.15, 0.05);
}
// overhead wires, tangled: long thin lines across the street at different heights
for (let i = 0; i < 8; i++) { const w = box(room, 7.4, 0.012, 0.012, 0x14121a, 0.3, 2.5 + (i % 4) * 0.2 - Math.sin(i) * 0.1, -1.6 + i * 0.5, { noShadow: true }); w.rotation.z = Math.sin(i * 2) * 0.05; w.rotation.y = Math.sin(i * 3) * 0.08; }
box(room, 0.14, 3.0, 0.14, 0x4a4048, 3.2, 1.5, -1.6, { noShadow: true });
// the water: brown, with a ripple texture that slides, and rain rings
const rippleTex = HAS("water") ? ASSET.tex("water", { pixel: true, repeat: [1, 1] }) : painted(32, 32, (g) => { g.fillStyle = "#7a7442"; g.fillRect(0, 0, 32, 32); const r = rng(9); for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? "#b8b47e" : "#544a2a"; g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 3 + Math.floor(r() * 5), 1); } }, { repeat: true, mip: false });
rippleTex.repeat.set(HAS("water") ? 4.5 : 7, HAS("water") ? 13 : 18);
const waterM = new THREE.MeshPhongMaterial({ color: 0xffffff, map: rippleTex, specular: 0xdfe8f2, shininess: 70 });      // wet: it throws the sky back in streaks
const water = mesh(room, new THREE.PlaneGeometry(14, 40), waterM, 0, WATER_Y, -12, { noShadow: true }); water.rotation.x = -Math.PI / 2; water.receiveShadow = true;
// and it mirrors: a planar reflection laid just over the surface, darkened by the mud, broken by ripples, stronger at a low angle.
// It shows the store front, the umbrella, the table's legs, the plates and whoever stands in it, upside down under them: that is what says water.
const FLOOD = {
  name: "Flood",
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, time: { value: 0 } },
  vertexShader: "uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv = textureMatrix * vec4(position,1.0); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; varying vec4 vUv; varying vec3 vW;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec2 p = vW.xz;
      vec2 rip = vec2(noise(p*4.0 + vec2(time*0.6, 0.0)) + 0.5*noise(p*11.0 - vec2(0.0, time*1.2)), noise(p*4.0 + vec2(5.0, -time*0.5)) + 0.5*noise(p*11.0 + vec2(time*0.9, 2.0))) - 0.75;
      vec4 uv = vUv; uv.xy += rip * 0.016 * uv.w;
      vec3 refl = texture2DProj(tDiffuse, uv).rgb * vec3(0.6, 0.64, 0.58);
      vec3 V = normalize(cameraPosition - vW);
      float fres = pow(1.0 - max(V.y, 0.0), 1.8), d = length(cameraPosition - vW), far = smoothstep(8.0, 22.0, d);
      float glint = smoothstep(0.62, 0.9, noise(p*vec2(3.0, 16.0) + vec2(time*0.4, time*0.2))) * 0.1 * (1.0 - far);
      gl_FragColor = vec4(refl + glint, mix(0.42, 0.86, fres) * (1.0 - 0.75*far));
    }`,
};
const flood = new Reflector(new THREE.PlaneGeometry(14, 40), { textureWidth: W, textureHeight: H, clipBias: 0.003, shader: FLOOD });
flood.rotation.x = -Math.PI / 2; flood.position.set(0, WATER_Y + 0.004, -12); flood.material.transparent = true; flood.material.depthWrite = false; flood.renderOrder = -2; room.add(flood);
const RINGS = [], rr = rng(31);
for (let i = 0; i < 44; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }); const rg = mesh(room, new THREE.TorusGeometry(1, 0.09, 3, 16), m, 0, WATER_Y + 0.01, 0, { noShadow: true }); rg.rotation.x = Math.PI / 2; RINGS.push({ rg, m, x: -2.8 + rr() * 6.4, z: -1.6 + rr() * 4.6, ph: rr() }); }
// drifting things: a slipper, a basin, a plastic cup
const slipper = group(room); box(slipper, 0.12, 0.03, 0.3, 0x3a8a4a, 0, 0, 0, { noShadow: true }); box(slipper, 0.1, 0.025, 0.06, 0xf2f2ea, 0, 0.02, 0.03, { noShadow: true });
const basin = group(room); mesh(basin, new THREE.CylinderGeometry(0.28, 0.2, 0.14, 12), mat(0xd9412e, R), 0, 0.03, 0); mesh(basin, new THREE.TorusGeometry(0.28, 0.02, 4, 14), mat(0xf2f2ea), 0, 0.1, 0).rotation.x = Math.PI / 2;
// the waterline where things meet it: a dark wet band and a bright ripple ring
const WETM = mat(0x2e3a1c, R), FOAM = new THREE.MeshBasicMaterial({ color: 0xf2f6e0, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
const contact = (parent, x, z, r) => { const g = group(parent, x, WATER_Y + 0.012, z); const a = mesh(g, new THREE.TorusGeometry(r, 0.022, 3, 18), FOAM, 0, 0, 0, { noShadow: true }); a.rotation.x = Math.PI / 2; const b = mesh(g, new THREE.TorusGeometry(r * 1.5, 0.015, 3, 18), FOAM, 0, 0, 0, { noShadow: true }); b.rotation.x = Math.PI / 2; return g; };
const cup = mesh(room, new THREE.CylinderGeometry(0.04, 0.03, 0.09, 8), mat(0xf4f1e6), 0, 0, 0, { noShadow: true });
// the rain: pale streaks that fall, seeded
const RAIN = [], rn = rng(77);
for (let i = 0; i < 170; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xe8f0f8, transparent: true, opacity: 0.55, depthWrite: false, fog: false }); const b = mesh(room, unit, m, 0, 0, 0, { noShadow: true }); b.scale.set(0.006, 0.34, 0.006); b.rotation.z = 0.12; RAIN.push({ b, x: -3.2 + rn() * 7, z: -2.8 + rn() * 4.2, ph: rn(), sp: 0.85 + rn() * 0.4 }); }

// ================= the table, the crate, the umbrella, the laptop =================
// The table top and the crate are surfaces (47-grip.js): things rest on them and fingers stop at them.
const tableP = makeProp("table", room, { surface: true }); tableP.g.position.set(-0.55, TABLE_Y - 0.03, 0.2);
{
  const g = tableP.g;
  tableP.box(g, 1.6, 0.06, 0.9, 0xc8a870, 0, 0, 0, { mat: {} }); for (const x of [-0.7, 0.7]) for (const z of [-0.38, 0.38]) box(g, 0.07, 0.62, 0.07, 0x8a6a40, x, -0.28, z, { noShadow: true });
  box(g, 1.62, 0.1, 0.92, 0x6a5030, 0, -0.07, 0, { noShadow: true });
  for (let i = 0; i < 5; i++) box(g, 1.6, 0.002, 0.006, 0xa88a58, 0, 0.031, -0.36 + i * 0.18, { noShadow: true });       // the gaps between its planks
}
tableP.seen = 1e9; flatSocket(tableP, 0.03);
const tableRings = [[-1.25, -0.18], [-1.25, 0.58], [0.15, -0.18], [0.15, 0.58]].map(([x, z]) => contact(room, x, z, 0.09));
for (const [x, z] of [[-1.25, -0.18], [-1.25, 0.58], [0.15, -0.18], [0.15, 0.58]]) box(room, 0.1, 0.22, 0.1, 0x3a3018, x, WATER_Y + 0.12, z, { noShadow: true });   // the wet-dark foot of each table leg
// an upturned soft-drink crate: the laptop stands on it, clear of the wet table, and its sides overhang so a hand can get under them
const CRATE = [-0.5, TABLE_Y + 0.07, 0.5], crateP = makeProp("crate", room, { surface: true }); crateP.g.position.set(...CRATE);
{
  const g = crateP.g;
  crateP.box(g, 0.2, 0.14, 0.2, 0xc7321f, 0, 0, 0, { mat: R });
  for (const y of [-0.035, 0.012]) for (const s of [-1, 1]) { box(g, 0.15, 0.03, 0.004, 0x5a140c, 0, y, s * 0.1, { noShadow: true }); box(g, 0.004, 0.03, 0.15, 0x5a140c, s * 0.1, y, 0, { noShadow: true }); }   // the hand slots and slats
  box(g, 0.204, 0.012, 0.204, 0xe0452e, 0, 0.064, 0, { noShadow: true }); box(g, 0.204, 0.012, 0.204, 0xa5271a, 0, -0.064, 0, { noShadow: true });
}
crateP.seen = 1e9;
// submerged to the seat: a motorbike, and a street sign up to its lower edge
{
  const g = group(room, 2.3, 0, -0.5); g.rotation.y = 0.5;
  box(g, 0.5, 0.12, 0.9, 0x23306a, 0, WATER_Y + 0.12, 0, R); box(g, 0.36, 0.1, 0.5, 0x16151c, 0, WATER_Y + 0.28, -0.1, R);                       // the body and the seat above the water
  box(g, 0.05, 0.4, 0.05, 0xc4c8d0, 0, WATER_Y + 0.35, 0.4, R).rotation.x = -0.4; box(g, 0.5, 0.04, 0.05, 0x16151c, 0, WATER_Y + 0.58, 0.32, R);   // the fork and the handlebar
  box(g, 0.14, 0.12, 0.1, 0xfff0b8, 0, WATER_Y + 0.5, 0.46, { glow: 1.6, noShadow: true });
  contact(g, 0, 0.1, 0.5);
}
// a wet-dark band where the walls meet the water, and the lower part of the left wall soaked
box(room, 0.04, 0.5, 26, 0x4a4a30, -3.29, WATER_Y + 0.25, -7.0, { noShadow: true }); box(room, 0.04, 0.5, 26, 0x4a4a30, 3.89, WATER_Y + 0.25, -7.0, { noShadow: true });
box(room, 0.06, 0.03, 26, 0xf2f6e0, -3.28, WATER_Y + 0.01, -7.0, { glow: 0.9, noShadow: true }); box(room, 0.06, 0.03, 26, 0xf2f6e0, 3.88, WATER_Y + 0.01, -7.0, { glow: 0.9, noShadow: true });
// a beach umbrella clamped to the back of the table, tall enough for Claude with the open laptop on his head
const umb = group(room, -1.2, TABLE_Y, -0.08);
{
  box(umb, 0.016, 0.98, 0.016, 0x2a2630, 0, 0.49, 0, { noShadow: true }); box(umb, 0.05, 0.05, 0.05, 0x3a3a44, 0, 0.025, 0, { noShadow: true });
  const cn = mesh(umb, new THREE.ConeGeometry(0.5, 0.17, 10), mat(0xd9412e, R), 0, 1.03, 0.2); cn.rotation.x = 0.12;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; box(umb, 0.004, 0.004, 0.28, 0xf2f2ea, Math.cos(a) * 0.24, 1.035, 0.2 + Math.sin(a) * 0.24, { noShadow: true }).rotation.y = -a; }
}
// the laptop: a solid one (48-solid.js) with ALL TESTS PASSED in green on its screen; the cast's own lap laptop is put away
laptop.visible = false;
const lap = makeLaptop(room, { name: "laptop", tex: scrTex, k: 1.15 });
// the screen's glow: a spot that shines out of the glass only, so it lights the deck, the table and whoever faces it, never the back of the lid
const lapGlow = new THREE.SpotLight(0xa4ff9c, 2.1, 1.5, 1.25, 0.6, 1.5); lapGlow.position.set(0, 0.0, 0.13); lap.lid.add(lapGlow); lapGlow.target.position.set(0, -1, 0.13); lap.lid.add(lapGlow.target);

// ================= the cast moves in =================
const BUL_S = [-0.5, TABLE_Y - 0.46, 0.05], BUL_W = [-0.25, 0.43, 0.7];
room.add(V); V.rotation.y = 0; V.visible = true; V.children[0].visible = false; V.children[1].visible = false;
vUpper.rotation.order = "YXZ";                                                    // he turns, then leans the way he faces
if (vUpper.userData.halo) vUpper.userData.halo.visible = false;                   // no glow hanging in front of hands that hold things
{                                                                                 // crossed legs on the table: a thigh out to each knee, a shin back across, a sneaker at each ankle
  const legs = group(V, 0, 0.47, 0.02), up = v3(0, 1, 0), bone = (a, b, r, m) => { const d = b.clone().sub(a), c = mesh(legs, new THREE.CapsuleGeometry(r, d.length(), 3, 8), m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); c.quaternion.setFromUnitVectors(up, d.normalize()); return c; };
  for (const s of [-1, 1]) {
    const hip = v3(s * 0.1, 0.03, 0.02), knee = v3(s * 0.3, 0.035, 0.27), ank = v3(-s * 0.07, 0.0 + (s > 0 ? 0.045 : 0), 0.36 + (s > 0 ? 0.03 : 0));
    bone(hip, knee, 0.075, cargoM); bone(knee, ank, 0.058, cargoM); mesh(legs, new THREE.SphereGeometry(0.078, 8, 6), mat(CARGO_L, R), knee.x, knee.y, knee.z);
    const sh = mesh(legs, new RoundedBoxGeometry(0.1, 0.085, 0.2, 2, 0.03), mat(0xf4f1ea, R), ank.x - s * 0.07, ank.y, ank.z + 0.01); sh.rotation.y = s * 1.2; box(legs, 0.1, 0.02, 0.2, 0x17161b, ank.x - s * 0.07, ank.y - 0.04, ank.z + 0.01, R).rotation.y = s * 1.2;
  }
  legs.visible = false; room.userData.legs = [legs];
}
room.add(C); C.scale.setScalar(0.9); C.visible = true;
// the rider: a delivery rider in a one-colour jacket and helmet, an insulated box on his back; no logo, no brand
const rider = makeBuloy({ young: true, sleeves: true, lace: false, strap: false, parent: room, at: [0.62, 0.43, 0.55], shirt: 0xe8590c, shirtD: 0xb8430a, legs: 0x23306a });
rider.V.children[0].visible = false; rider.V.children[1].visible = false;
gripRigPerson("rider", rider);
// where a soaked top meets the water: a wet-dark band that follows the body's own shape (not a box round the waist)
const wetBand = (up, col) => mesh(up, loft([[-0.085, 0.184, 0.125], [-0.03, 0.204, 0.15, 0, 0.004], [0.02, 0.212, 0.157, 0, 0.008], [0.075, 0.208, 0.157, 0, 0.011]], 12, { e: 0.84 }), mat(col, R), 0, 0, 0, { noShadow: true });
{
  const hm = mat(0xe8590c, R), hd = mat(0xb8430a, R);
  const sh = mesh(rider.vHead, new THREE.SphereGeometry(0.128, 12, 8, 0, Math.PI * 2, 0, 1.52), hm, 0, 0.2, -0.004); sh.scale.set(1, 1.0, 1.04);
  box(rider.vHead, 0.2, 0.014, 0.1, 0xb8430a, 0, 0.206, 0.105, R);                                                         // the brim
  for (const s of [-1, 1]) box(rider.vHead, 0.012, 0.09, 0.012, 0x23202c, s * 0.075, 0.07, 0.07, { noShadow: true });       // chin strap
  const bx = box(rider.vUpper, 0.36, 0.34, 0.3, 0xe8590c, 0, 0.3, -0.24, R); box(rider.vUpper, 0.38, 0.03, 0.32, 0xb8430a, 0, 0.47, -0.24, R); box(rider.vUpper, 0.3, 0.06, 0.012, 0x23202c, 0, 0.3, -0.39, { noShadow: true });   // the insulated box
  for (const s of [-1, 1]) box(rider.vUpper, 0.03, 0.34, 0.012, 0xf4f1e6, s * 0.1, 0.3, 0.15, { noShadow: true });           // reflective stripes down the jacket
  wetBand(rider.vUpper, 0x7a3410);
}
const riderRing = contact(room, 0.3, 0.55, 0.3), bulRing = contact(room, -0.25, 0.7, 0.3); bulRing.visible = false;
const bulWet = wetBand(vUpper, 0x201e26); bulWet.visible = false;                 // Buloy's own, seen once he is in
// the phones: the same loading screen, drawn per frame, on the rider's and on Buloy's
function phoneScreen() { const c = document.createElement("canvas"); c.width = 72; c.height = 128; const g = c.getContext("2d"); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return { c, g, t }; }
const rScr = phoneScreen(), bScr = phoneScreen();
function drawPhone(P, t, batt) {
  const g = P.g; g.fillStyle = "#101c2a"; g.fillRect(0, 0, 72, 128);
  for (let i = 0; i < 4; i++) { g.fillStyle = i < 1 ? "#ff5a4a" : "#34404e"; g.fillRect(6 + i * 5, 12 - i * 2, 3, 3 + i * 2); }                                // weak signal: one bar
  g.fillStyle = "#cfd8e0"; g.fillRect(48, 6, 16, 8); g.fillStyle = "#101c2a"; g.fillRect(49, 7, 14, 6);
  const bl = batt > 0.5 ? "#6dff8a" : (Math.floor(t * 2.5) % 2 ? "#ff3a3a" : "#7a2020"); g.fillStyle = bl; g.fillRect(50, 8, batt > 0.5 ? 10 : 3, 4); g.fillStyle = "#cfd8e0"; g.fillRect(64, 8, 2, 4);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + t * 6, on = ((i - Math.floor(t * 9)) % 8 + 8) % 8; g.fillStyle = "rgba(235,245,255," + (0.25 + 0.75 * (1 - on / 8)).toFixed(2) + ")"; g.fillRect(Math.round(36 + Math.cos(a) * 14) - 2, Math.round(40 + Math.sin(a) * 14) - 2, 5, 5); }
  if (ATLAS && ATLAS.ptext) ATLAS.ptext(g, "Loading...".toUpperCase(), 36, 64, "#ffffff", { font: 5, scale: 1, align: "center" });
  g.fillStyle = "#1b2a3c"; g.fillRect(8, 84, 56, 6); g.fillRect(8, 96, 40, 6); g.fillStyle = "#24364c"; g.fillRect(8, 110, 56, 10);                             // the page that never arrives
  P.t.needsUpdate = true;
}
const rPhone = makePhone(room, { name: "phoneR", tex: rScr.t, col: 0x16a3a0 }), bPhone = makePhone(room, { name: "phoneB", tex: bScr.t, col: 0x6b46c9 });
rPhone.shown = bPhone.shown = true; gripHide(bPhone);
const rainOnPhone = [];
for (let i = 0; i < 5; i++) rainOnPhone.push(mesh(rPhone.g, new THREE.BoxGeometry(0.004, 0.007, 0.001), mat(0xdcecff, { glow: 1.1 }), 0, 0, rPhone.dim.d / 2 + 0.0015, { noShadow: true }));   // drops running down the glass: solid beads, not a film
const faceBase = { blink: 0, open: 0, smile: 0.1, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
const bulFace = { ...faceBase }, rFace = { ...faceBase };

// ================= the clock of the flood (times come from the acts of the script) =================
const LN = TL.lines, actLine = (name) => LN.find((l) => l.act === name);
const A = { shout: actLine("b_shout"), point: actLine("r_point"), insist: actLine("b_insist"), dry: actLine("c_dry"), cpoint: actLine("c_point"), rphone: actLine("r_phone"), hand: actLine("b_hand"),
  surprise: actLine("c_surprise"), wade: actLine("b_wade"), laugh: LN[LN.length - 1] };
const win = (ln, t, pi = 0.2, po = 0.3) => (ln ? smooth((t - (ln.s - pi)) / 0.25) * (1 - smooth((t - (ln.e + po)) / 0.3)) : 0);
const T_SPL = A.wade ? A.wade.s - 0.45 : 1e9;                                    // the splash: he drops off the table in the silence before his line
// the hand-off, all measured from the start of "Claude, hawakan mo 'tong laptop": reach, grasp, lift and turn, set it on Claude's head, Claude's nubs take it, Buloy lets go
const HS = A.hand ? A.hand.s : 1e9;
const HO = { reach: [HS - 0.8, HS - 0.3], grasp: [HS - 0.28, HS - 0.08], lift: [HS - 0.05, HS + 0.55], land: [HS + 0.5, HS + 0.95], nub: [HS + 0.8, HS + 1.05], open: [HS + 1.25, HS + 1.4], away: [HS + 1.4, HS + 1.62], back: [HS + 1.62, HS + 1.98], face: [HS + 1.72, HS + 2.24] };
const ramp = (k, t) => smooth((t - k[0]) / (k[1] - k[0]));
const TURN = -1.1;                                                                // how far Buloy turns to reach Claude on his right
const C_HOME = v3(-1.15, TABLE_Y, 0.25), C_TAKE = v3(-1.0, TABLE_Y, 0.3);
const LAP_REST = v3(CRATE[0], CRATE[1] + 0.07 + lap.dim.T / 2 + 0.0005, CRATE[2] + 0.02), LAP_MID = v3(-0.88, TABLE_Y + 0.42, 0.28);
const yawKeys = [[0, 0.15]]; for (const l of LN) yawKeys.push([l.s - 0.2, l.act === "r_point" || l.act === "r_phone" ? 0.1 : l.act === "c_dry" || l.act === "c_point" || l.act === "c_surprise" || l.act === "b_insist" || l.act === "b_hand" ? -0.8 : 0.15, 0.3]); yawKeys.sort((a, b) => a[0] - b[0]);
// the light of a rainy noon: a soft grey key from high in front, the sky's own cool wash, a low light from down the street that skims the water and
// comes back off it as wet streaks, and the screens' small glow on whatever is near them
const sun = new THREE.DirectionalLight(0xdfe6f0, 1.15); sun.position.set(1.5, 7, 5); sun.target.position.set(0, 1, 0); scene.add(sun, sun.target);
const sheen = new THREE.DirectionalLight(0xc8d6e8, 0.75); sheen.position.set(-1.5, 2.2, -9); sheen.target.position.set(0, 0.9, 2); scene.add(sheen, sheen.target);
const riderFill = new THREE.PointLight(0xfff0dc, 0, 2.2, 1.6); room.add(riderFill);          // in his own shots a soft light from the lens side lifts his face out of the helmet's shade
const phoneGlow = [0, 1].map(() => { const l = new THREE.PointLight(0xffe9c8, 0, 0.7, 2); room.add(l); return l; });
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.02; Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 16 }); sun.shadow.camera.updateProjectionMatrix();
const splash = []; for (let i = 0; i < 8; i++) splash.push(mesh(room, new THREE.SphereGeometry(0.02, 5, 4), new THREE.MeshBasicMaterial({ color: 0xe2ecf2, transparent: true, opacity: 0.85 }), 0, 0, 0, { noShadow: true }));
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
const bulRig = { vUpper, armL, armR }, rRig = { vUpper: rider.vUpper, armL: rider.armL, armR: rider.armR };
const BL = armRig(bulRig, 1, "viron"), BR = armRig(bulRig, -1, "viron"), RL = armRig(rRig, 1, "rider");
const UPY = v3(0, 1, 0);

const SET = {
  name: "baha",
  mode: () => "baha",
  shots: {
    f_open:   { p: [0.25, 1.5, 3.1], l: [0.02, 1.92, 0.3], fov: 50, d: [-0.01, 0, -0.05], cap: 150 },                          // Buloy dry above, the green laptop, the rider waist-deep with his whole phone up; the hook sits in the sky
    f_rider:  { p: [-0.1, 1.55, 2.5], l: [0.36, 1.62, 0.55], fov: 37, d: [0.01, 0, -0.04], cap: 1330 },                         // the rider, pointing at the water
    f_two:    { p: [-0.1, 2.1, 3.0], l: [-0.8, 1.95, 0.2], fov: 42, d: [0, 0, -0.04], cap: 1390 },                             // Buloy turning to Claude on the table; captions on the water under it
    f_claude: { p: [-0.6, 1.95, 2.8], l: [-0.9, 1.9, 0.4], fov: 52, d: [0, 0, -0.03], cap: 1390 },                             // Claude under the umbrella, the laptop beside him
    f_phone:  { p: [0.44, 1.76, 2.3], l: [0.37, 1.73, 0.6], fov: 28, d: [0, 0, -0.03], near: 0.1, cap: 120 },                   // the rider's phone held up in the rain, his face behind it; captions above both
    rv_wide:  { p: [0.0, 2.0, 5.5], l: [0.0, 1.5, 0.0], fov: 60, d: [0, 0, 0] },
    rv_lap:   { p: [-0.5, 1.75, 2.0], l: [-0.5, 1.65, 0.5], fov: 34, d: [0, 0, 0], near: 0.1 },
    rv_top:   { p: [-0.5, 4.5, 1.5], l: [-0.5, 1.5, 0.2], fov: 50, d: [0, 0, 0] },
    f_wade:   { p: [-0.3, 1.6, 2.9], l: [0.0, 1.72, 0.6], fov: 54, d: [0.004, 0, -0.04], cap: 1390 },                            // the last picture: Buloy in the water beside the rider, both with a phone that will not load, both whole in the frame
    f_hook:   { p: [-0.1, 1.75, 2.15], l: [-0.41, 2.0, 0.1], fov: 42, d: [-0.01, 0.01, -0.12], cap: 190 },                       // frame 0: his face, his fist, ALL TESTS PASSED under them, the table's legs in the flood; the wide comes after
    f_wadephone: { p: [-0.36, 1.27, 1.98], l: [-0.37, 1.5, 1.1], fov: 31, d: [0, 0, -0.03], near: 0.1, cap: 1390 },                 // close on his phone above the water: the spinner that will not stop, his face fallen behind it (update aims it at the phone)
  },
  keys: () => [{ t: HO.reach[1], label: "lap-reached" }, { t: HO.grasp[1] + 0.02, label: "lap-grasped" }, { t: (HO.lift[0] + HO.lift[1]) / 2, label: "lap-lift" }, { t: HO.lift[1], label: "lap-turned" }, { t: HO.land[1], label: "lap-on-head" },
    { t: HO.nub[1] + 0.05, label: "lap-both" }, { t: HO.open[1], label: "lap-let-go" }, { t: HO.back[1], label: "lap-claude" }, { t: HO.face[1], label: "lap-faces" }, { t: T_SPL + 0.45, label: "phone-rising" }, { t: T_SPL + 1.0, label: "phone-out" },
    { t: A.rphone ? A.rphone.s + 0.6 : 1, label: "rider-thrust" }, { t: A.laugh ? A.laugh.s + 0.35 : 1, label: "card-line" }, { t: A.wade ? A.wade.s + 2.25 : 1, label: "wadephone" }, { t: 0.02, label: "first-frame" }],
  update(t, ctx) {
    const vAmp = ampAt("viron", t), rAmp = ampAt("rider", t);
    hemi.color.setRGB(0.7, 0.76, 0.86); hemi.groundColor.setRGB(0.42, 0.4, 0.33); hemi.intensity = 1.5; grade.uniforms.uExposure.value = 0.96;
    duskRim.intensity = 0.0; skyFill.intensity = 0.2; RIM.uRimColor.value.setRGB(0.62, 0.68, 0.76);
    // ---- the water, the rain, the rings, the drifters ----
    rippleTex.offset.set(t * 0.03, t * 0.015); water.position.y = WATER_Y + Math.sin(t * 1.3) * 0.006; flood.position.y = water.position.y + 0.004; flood.material.uniforms.time.value = t;
    RAIN.forEach((r) => { const u = (t * 2.2 * r.sp + r.ph) % 1; r.b.position.set(r.x - u * 0.4, 3.6 - u * 2.75, r.z); });
    RINGS.forEach((r) => { const u = (t * 0.9 + r.ph) % 1; r.rg.position.set(r.x, WATER_Y + 0.012, r.z); r.rg.scale.setScalar(0.05 + u * 0.3); r.m.opacity = 0.95 * (1 - u); });
    slipper.position.set(0.65 + Math.sin(t * 0.5) * 0.12, WATER_Y + 0.02 + Math.sin(t * 2.1) * 0.01, 2.0 + Math.sin(t * 0.7) * 0.1); slipper.rotation.y = 0.6 + Math.sin(t * 0.4) * 0.3; slipper.scale.setScalar(1.6);
    basin.position.set(-0.55 - 0.035 * t + Math.sin(t * 0.4) * 0.12, WATER_Y + 0.05 + Math.sin(t * 1.8) * 0.012, 1.7 + Math.sin(t * 0.6) * 0.08); basin.rotation.y = t * 0.3; basin.scale.setScalar(1.3);
    cup.position.set(-1.4 + ((t * 0.07 + 0.6) % 1) * 3.4, WATER_Y + 0.03, 1.9); cup.rotation.z = Math.sin(t) * 0.3;
    // ---- states: Buloy on the table, then in the water ----
    const inW = smooth((t - T_SPL) / 0.28);
    const wShout = A.shout && t < A.shout.s ? 1 : win(A.shout, t), wIns = win(A.insist, t), wHand = win(A.hand, t, 0.9, 0.3), wWade = win(A.wade, t, 0.6, 0.6), wLaugh = A.laugh ? smooth((t - (A.laugh.s - 0.1)) / 0.2) : 0, wLook = A.hand ? smooth((t - (A.hand.s - 0.85)) / 0.3) * (1 - smooth((t - A.hand.s) / 0.3)) : 0;
    // the hand-off's own weights
    const hReach = ramp(HO.reach, t), hGrasp = ramp(HO.grasp, t), hLift = ramp(HO.lift, t), hLand = ramp(HO.land, t), hNub = ramp(HO.nub, t), hOpen = ramp(HO.open, t), hAway = ramp(HO.away, t), hBack = ramp(HO.back, t), hFace = ramp(HO.face, t);
    const lean = hReach * (1 - hLift) * 0.28 + hLift * (1 - hBack) * 0.1, turn = hLift * (1 - smooth((t - (HO.away[0] + 0.1)) / 0.5));
    // Buloy: cross-legged on the table, dry and smug; then he drops into the water beside the rider
    const px_ = BUL_S[0] + (BUL_W[0] - BUL_S[0]) * inW, pz_ = BUL_S[2] + (BUL_W[2] - BUL_S[2]) * inW;
    const py_ = BUL_W[1] + (BUL_S[1] - BUL_W[1]) * (1 - inW) + 0.5 * Math.sin(Math.PI * inW) * (inW < 1 ? 1 : 0) * 0.4;
    V.position.set(px_, py_, pz_);
    bulRing.visible = inW > 0.9; bulRing.position.set(px_, WATER_Y + 0.012 + Math.sin(t * 3) * 0.003, pz_); bulRing.scale.setScalar(1 + 0.1 * Math.sin(t * 3)); riderRing.position.x = 0.3; riderRing.scale.setScalar(1 + 0.08 * Math.sin(t * 2.6 + 1));
    room.userData.legs.forEach((l) => { l.visible = inW < 0.05; }); bulWet.visible = inW > 0.5;
    vUpper.position.y = 0.52 + 0.01 * Math.sin(t * 1.9);
    vUpper.rotation.x = 0.04 + 0.3 * wShout + 0.18 * wIns + 0.14 * wLook * (1 - hReach) + 0.1 * wWade + lean; vUpper.rotation.y = 0.1 * wShout - 0.3 * wIns + TURN * turn; vUpper.rotation.z = Math.sin(t * 28) * 0.03 * wWade + 0.02 * Math.sin(t * 1.2);
    vHead.rotation.y = track(yawKeys, t, 0.3) * (1 - 0.85 * turn) + Math.sin(t * 0.9) * 0.015; vHead.rotation.x = 0.04 + 0.3 * wLook + 0.22 * wWade * 0.5 + 0.02 * wShout - 0.6 * lean; vHead.rotation.z = 0.04 * wWade;
    Object.assign(bulFace, face);
    bulFace.anger = 0.7 * wShout + 0.35 * wIns; bulFace.smile = 0.3 * (1 - wShout) * (t < T_SPL ? 1 : 0) - 0.5 * wWade - 0.15 * wLook; bulFace.cheek = 0.2 * (t < A.insist?.s ? 1 : 0);
    bulFace.sad = 0.6 * wWade + 0.3 * wLook; bulFace.brow = -0.2 * wShout + 0.4 * wWade; bulFace.lid = 0.35 * wWade; bulFace.gy = 0.3 * wLook + 0.3 * wWade; bulFace.gx = 0.1;
    bulFace.open = Math.max(clamp01(vAmp * 1.25) * (1 + 0.3 * wShout), A.shout && t < A.shout.s + 0.1 ? 0.7 : 0);
    buloy.draw(bulFace);
    // Claude: on the table under the umbrella, calm; a nub toward the laptop (c_dry), toward the rider (c_point); he shuffles over and backs in under the laptop; then he turns to us with it on his head
    const wDry = win(A.dry, t), wCp = win(A.cpoint, t), wSu = win(A.surprise, t, 0.1, 0.6);
    const cGo = smooth((t - (HS - 0.45)) / 0.75), cYaw = 0.45 + 0.2 * wCp - 0.2 * wDry + (TURN - 0.45) * cGo * (1 - hFace) + (0.32 - 0.45) * hFace;
    C.position.copy(C_HOME).lerp(C_TAKE, cGo); C.position.y += Math.abs(Math.sin(cGo * Math.PI * 3)) * 0.035 * (cGo < 1 ? 1 : 0);
    C.rotation.y = cYaw + Math.sin(t * 0.7) * 0.02 * (1 - cGo); C.rotation.z = 0.0; cBody.rotation.x = 0.04 * wDry - 0.05 * wSu * (1 - cGo); cBody.rotation.z = Math.sin(t * 0.8) * 0.012 * (1 - cGo * (1 - hFace));
    if (t > HO.land[0] - 0.05 && t < HO.back[1]) { cBody.scale.set(1, 1, 1); cBody.position.y = 0.085; cBody.rotation.set(0, 0, 0); }    // he holds still while it is set down on him
    const bc = Math.min(1 - blinkAt(t, 2.3, 3.6) * 0.9, 1);
    cEyes.forEach((e) => { e.scale.y = 0.08 * bc * (1 + 0.55 * wSu); e.scale.x = 0.04 * (1 + 0.3 * wSu); });
    cArms[0].position.set(-0.275 - 0.05 * wCp, 0.13 + 0.14 * wDry, 0.16 + 0.1 * wDry + 0.1 * wCp); cArms[1].position.set(0.275, 0.13, 0.16);
    // the rider: waist-deep, looks up at Buloy, points at the water, thrusts his phone up
    const wPt = win(A.point, t), wRp = win(A.rphone, t, 0.1, 0.5);
    rider.V.position.set(0.3, 0.43 + Math.sin(t * 1.3) * 0.006, 0.55); rider.V.rotation.y = -0.15;
    rider.vUpper.rotation.set(0.03 + 0.12 * wPt + 0.06 * wRp, -0.1 * wPt, Math.sin(t * 1.7) * 0.01 + 0.02 * Math.sin(t * 14) * wLaugh); rider.vUpper.position.y = 0.52 + 0.04 * wRp + 0.01 * Math.sin(t * 15) * wLaugh;
    const exa = wPt, plead = wRp;                                                  // exasperated at the dry man on the table; then pleading, his battery going
    rider.vHead.rotation.set(-0.16 + 0.1 * plead - 0.2 * wLaugh - 0.07 * exa, -0.25 + 0.2 * wLaugh + Math.sin(t * 0.8) * 0.02 + 0.09 * Math.sin(t * 7.5) * exa, 0.03 * Math.sin(t * 14) * wLaugh + 0.07 * plead - 0.05 * exa);
    Object.assign(rFace, faceBase); rFace.open = clamp01(rAmp * (1.3 + 0.3 * exa)); rFace.brow = 0.75 * exa - 0.75 * plead; rFace.anger = 0.3 * exa; rFace.sad = 0.9 * plead; rFace.wet = 0.35 * plead; rFace.lid = 0.12 * plead; rFace.smile = -0.45 * exa - 0.35 * plead + 0.9 * wLaugh; rFace.cheek = 0.8 * wLaugh; rFace.blink = Math.max(blinkAt(t, 1.6, 4.1), 0.85 * wLaugh * (Math.sin(t * 6) > 0 ? 1 : 0.4)); rFace.gx = 0.0; rFace.gy = -0.35 + 0.4 * wLaugh + 0.15 * plead;
    rider.draw(rFace);
    room.updateMatrixWorld(true);
    // ---- free arms first (what each arm does when it holds nothing); the grips below take over by weight ----
    for (const s of [1, -1]) {
      const keys = [[0, null], [T_SPL - 0.2, null], [T_SPL + 0.05, v3(px_ + (s > 0 ? 0.3 : -0.08), 1.95, pz_ + 0.28)], [T_SPL + 0.3, null]];
      const extra = [[wShout, vUpper.worldToLocal(v3(px_ + 0.35, py_ + 1.75, pz_ + 0.3))]];
      reach(bulRig, s, keys, t, v3(s * 0.2, 0.2, 0.26), s > 0 ? extra : null);
    }
    armL.hand.quaternion.identity(); armR.hand.quaternion.identity();
    armL.H.pose = wShout > 0.4 ? HAND_POSES.fist : HAND_POSES.relaxed; armR.H.pose = HAND_POSES.relaxed;
    const pointT = rider.vUpper.worldToLocal(v3(0.35, WATER_Y + 0.05, 0.8));
    reach(rRig, 1, [[0, null]], t, v3(0.2, 0.1, 0.3));
    reach(rRig, -1, [[0, null]], t, v3(-0.2, 0.0, 0.3), [[wPt, pointT]]);
    rider.armR.H.pose = wPt > 0.4 ? HAND_POSES.point : HAND_POSES.relaxed;
    rider.armL.hand.quaternion.identity(); rider.armR.hand.quaternion.identity();
    room.updateMatrixWorld(true);
    // on the table he props himself on his hands, flat on the planks beside his knees, whenever they are not busy
    const onTbl = (1 - smooth((t - (T_SPL - 0.14)) / 0.14)), prop = (s) => ({ sk: "flat", x: (BUL_S[0] + s * (s > 0 ? 0.43 : 0.3)) - tableP.g.position.x, z: (BUL_S[2] + (s > 0 ? 0.2 : 0.04)) - tableP.g.position.z, dir: s > 0 ? v3(0.8, 0, 1) : v3(-1, 0, 0.2), arc: 0.1 });
    gripTouch(tableP, [{ A: BL, ...prop(1), w: onTbl * (1 - wShout) * (1 - hReach * (1 - hBack)), g: 1 }, { A: BR, ...prop(-1), w: onTbl * (1 - hReach * (1 - hBack)), g: 1 }], { obstacles: [] });
    // ---- the laptop: on its crate; lifted in two hands; set on Claude's head; his nubs take it; it stays with him ----
    lap.open(1.85 - 0.45 * hLift * (1 - hLand)); lapGlow.intensity = 2.1 + 0.15 * Math.sin(t * 3);
    sctx.fillStyle = "#0b3a1c"; sctx.fillRect(0, 0, 96, 62); sctx.fillStyle = "#1c6a34"; sctx.fillRect(0, 0, 96, 5); sctx.fillStyle = "#6dff8a"; sctx.fillRect(3, 1, 3, 3); sctx.fillRect(8, 1, 3, 3);
    if (ATLAS && ATLAS.ptext) { ATLAS.ptext(sctx, "ALL", 48, 9, "#6dff8a", { font: 5, scale: 2, align: "center" }); ATLAS.ptext(sctx, "TESTS", 48, 25, "#6dff8a", { font: 5, scale: 2, align: "center" }); ATLAS.ptext(sctx, "PASSED", 48, 41, "#ffffff", { font: 5, scale: 2, align: "center" }); }
    scrTex.needsUpdate = true;
    const bGrips = (w, g) => [{ A: BL, sk: "side+", w, g, arc: 0.12 }, { A: BR, sk: "side-", w, g, arc: 0.12 }];
    cBody.updateWorldMatrix(true, false);
    const headPos = cBody.localToWorld(_p.set(0, 0.32, 0)); headPos.y += lap.dim.T / 2 + 0.0008; cBody.getWorldQuaternion(_qa);
    if (t < HO.lift[0]) gripHold(lap, LAP_REST, _qb.identity(), bGrips(hReach, hGrasp), { state: "rest", on: crateP, obstacles: [crateP, tableP] });
    else if (t < HO.land[1]) {
      const pos = _q.copy(LAP_REST).lerp(LAP_MID, hLift * hLift); pos.y = LAP_REST.y + (LAP_MID.y - LAP_REST.y) * smooth(hLift * 1.7);     // up first, then across pos.lerp(headPos, hLand); pos.y += 0.05 * Math.sin(Math.PI * hLand) * (hLand < 1 ? 1 : 0);
      const quat = _qb.setFromAxisAngle(UPY, TURN * hLift); quat.slerp(_qa, hLand);
      gripHold(lap, pos, quat, bGrips(1, 1), { carrier: 0, obstacles: [crateP] });
    } else {
      gripHold(lap, headPos, _qa, bGrips(1 - hAway, 1 - hOpen), {});
    }
    if (t >= HO.nub[0]) nubHold(lap, [-1, 1].map((e, i) => { const n = lap.nub(e); n.p.y = 0.036 - lap.dim.T / 2 + 0.0005; return { i, p: n.p, n: n.n, w: hNub }; }));   // each nub: its bottom on his own top edge, its face on the laptop's side
    // ---- the rider's phone: always up out of the water in his left hand, turned so it can be read ----
    drawPhone(rScr, t, 0.2); drawPhone(bScr, t, 0.8);
    {
      const pos = v3(0.47 - 0.03 * wRp, 1.82 + 0.06 * wRp + Math.sin(t * 1.3) * 0.006, 0.84 + 0.12 * wRp);
      const fwd = ctx.shot === "f_phone" ? shotCamPos(ctx.cut, t).sub(pos).setY(0.05) : v3(-0.32, 0.06, 1);
      const roll = (ctx.shot === "f_phone" ? 0.42 : 0.5) + 0.05 * Math.sin(t * 2.2) * wRp + 0.14 * wPt;                   // held up in a hurry, a little askew: the fingers' side higher
      gripHold(rPhone, pos, qLook(fwd, v3(-Math.sin(roll), Math.cos(roll), 0)), [{ A: RL, sk: "show", w: 1, g: 1 }], { carrier: 0 });
      rainOnPhone.forEach((m, i) => { const u = (t * 0.9 + i / 5) % 1; m.position.set(-0.026 + i * 0.013, 0.07 - u * 0.14, rPhone.dim.d / 2 + 0.0015); });
    }
    // ---- Buloy's phone: it comes up out of the water in his right hand after the splash ----
    const wPh = smooth((t - (T_SPL + 0.35)) / 0.6);
    if (t > T_SPL + 0.3) {
      const pos = v3(px_ - 0.17, 0.74 + 0.72 * wPh + Math.sin(t * 28) * 0.004 * wWade, pz_ + 0.44), close = ctx.shot === "f_wadephone";
      if (close) { SHOTS.f_wadephone.p = [pos.x + 0.17, pos.y - 0.08, pos.z + 0.76]; SHOTS.f_wadephone.l = [pos.x + 0.07, pos.y + 0.035, pos.z]; }      // the close shot stands off the phone itself, a little low, so his face is over it
      // it comes up the way an arm brings it: top down beside his hip, then flat with its glass to the sky as the forearm levels, then up and turned to us
      const rl = close ? 0.3 : 0.35, qEnd = qLook((close ? shotCamPos(ctx.cut, t) : v3(-0.05, 1.62, 2.55)).sub(pos).setY(close ? 0.02 : 0.25), v3(Math.sin(rl), Math.cos(rl), 0));
      const quat = wPh >= 1 ? qEnd : wPh < 0.5 ? qLook(v3(0, 0.25, 1), v3(-1, 0, 0)).slerp(qLook(v3(0, 1, 0.1), v3(-1, 0, 0)), smooth(wPh / 0.5)) : qLook(v3(0, 1, 0.1), v3(-1, 0, 0)).slerp(qEnd, smooth((wPh - 0.5) / 0.5));
      gripHold(bPhone, pos, quat, [{ A: BR, sk: "show", w: 1, g: 1 }], { carrier: 0 });
      if (close) { bPhone.g.getWorldPosition(_q); SHOTS.f_wadephone.l = [_q.x + 0.07, _q.y + 0.035, _q.z]; }
    } else gripHide(bPhone);
    // the splash: sand-brown drops fly up where he lands
    splash.forEach((s, i) => { const u = (t - T_SPL - 0.18) / 0.5, on = u > 0 && u < 1; s.visible = on; if (on) s.position.set(BUL_W[0] + Math.cos(i * 0.8) * 0.3 * u, WATER_Y + 0.3 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(i)), BUL_W[2] + Math.sin(i * 0.8) * 0.3 * u); });
    // the phones' glow sits just in front of each glass: it warms the fingertips on the edge and the water below, and is too weak to tint a face
    riderFill.intensity = ctx.shot === "f_rider" || ctx.shot === "f_phone" ? 0.85 : ctx.shot === "f_open" || ctx.shot === "f_wade" ? 0.4 : 0; riderFill.position.set(0.05, 1.75, 1.55);
    [rPhone, bPhone].forEach((P, i) => { const on = P.g.visible; phoneGlow[i].intensity = on ? 0.034 + 0.003 * Math.sin(t * 9 + i) : 0; if (on) phoneGlow[i].position.copy(P.g.localToWorld(_p.set(0, -0.02, 0.2))); });
  },
};
