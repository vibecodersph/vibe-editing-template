// ---------- light: one warm bulb against a violet dusk ----------
const hemi = new THREE.HemisphereLight(0x8f8ad8, 0x4a3a56, 1.2);
scene.add(hemi);
const duskRim = new THREE.DirectionalLight(0xff6a70, 1.5);        // what is left of the sun, from behind the store
duskRim.position.set(-6, 7, -7); scene.add(duskRim);
const skyFill = new THREE.DirectionalLight(0xa9a6ee, 0.75);        // cool sky bounce from the street side
skyFill.position.set(2, 4, 9); scene.add(skyFill);

// ---------- labels: the pixel-art products and signs (src/lib/15-labels.js) ----------
const ATLAS = typeof makeLabelAtlas === "function" ? makeLabelAtlas() : null;
const atlasTex = ATLAS ? new THREE.CanvasTexture(ATLAS.canvas) : null;
if (atlasTex) { atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.LinearMipmapLinearFilter; atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 4; }
const atlasMat = atlasTex ? mat(0xffffff, { map: atlasTex }) : null;
const atlasGlow = atlasTex ? mat(0xffffff, { map: atlasTex, glow: 0.92 }) : null;
function cellUV(name) {
  const c = ATLAS && ATLAS.cells[name];
  if (!c) return null;
  const AW = ATLAS.canvas.width, AH = ATLAS.canvas.height;
  return { u0: c.x / AW, u1: (c.x + c.w) / AW, v1: 1 - c.y / AH, v0: 1 - (c.y + c.h) / AH, eu: (c.x + 2.5) / AW, ev: 1 - (c.y + 2.5) / AH };
}
// A box whose chosen faces show one label; the other faces take the label's own background colour.
function product(parent, name, w, h, d, x, y, z, faces = [4], fallback = 0xd9412e) {
  const c = cellUV(name);
  if (!c) return box(parent, w, h, d, fallback, x, y, z, { noShadow: true });
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (faces.includes(f)) uv.setXY(i, uv.getX(i) ? c.u1 : c.u0, uv.getY(i) ? c.v1 : c.v0);
    else uv.setXY(i, c.eu, c.ev);
  }
  return mesh(parent, g, atlasMat, x, y, z, { noShadow: true });
}
// A flat sign showing one whole cell.
function signPlane(parent, name, w, h, x, y, z, glow = false, fallback = 0xf4d23a) {
  const c = cellUV(name);
  if (!c) return box(parent, w, h, 0.01, fallback, x, y, z, { noShadow: true });
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
  for (let i = 0; i < 4; i++) uv.setXY(i, uv.getX(i) ? c.u1 : c.u0, uv.getY(i) ? c.v1 : c.v0);
  const m = new THREE.Mesh(g, glow ? atlasGlow : atlasMat);
  m.position.set(x, y, z); m.receiveShadow = !glow; parent.add(m);
  return m;
}

// ---------- ground ----------
const T_CONC = TEX.concrete();
box(scene, 400, 0.2, 400, 0x1c1830, 0, -0.34, 0, { noShadow: true });
tbox(scene, 30, 0.16, 4.2, T_CONC, 1.0, 0, -0.08, -0.78, { noShadow: true });               // bangketa
for (let i = -14; i < 15; i++) box(scene, 0.98, 0.15, 0.2, i % 2 ? 0xd8b23a : 0x2a2630, i + 0.5, -0.075, 1.42, { noShadow: true });   // curb, yellow and black
// The street after rain: a mirror broken up into puddles.
const WET = {
  name: "WetStreet",
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, time: { value: 0 } },
  vertexShader: "uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv = textureMatrix * vec4(position,1.0); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; varying vec4 vUv; varying vec3 vW;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec2 p = vW.xz;
      float n = noise(p*0.5)*0.6 + noise(p*1.6+3.1)*0.3 + noise(p*5.0)*0.1;
      float puddle = smoothstep(0.40, 0.52, n);
      vec2 rip = vec2(noise(p*7.0 + vec2(time*0.5, 0.0)), noise(p*7.0 + vec2(7.0, -time*0.4))) - 0.5;
      vec4 uv = vUv; uv.xy += rip * (0.0035 + 0.007*puddle) * uv.w;
      vec3 refl = texture2DProj(tDiffuse, uv).rgb;
      vec3 V = normalize(cameraPosition - vW);
      float fres = pow(1.0 - max(V.y, 0.0), 2.5);
      vec3 asphalt = mix(vec3(0.020,0.018,0.036), vec3(0.040,0.034,0.060), noise(p*13.0));
      float k = mix(0.22, 0.92, puddle) * mix(0.6, 1.0, fres);
      gl_FragColor = vec4(asphalt * (1.0 - 0.6*puddle) + refl * k, 1.0);
    }`,
};
const street = new Reflector(new THREE.PlaneGeometry(80, 16), { textureWidth: W, textureHeight: H, clipBias: 0.003, shader: WET });
street.rotation.x = -Math.PI / 2; street.position.set(0, -0.15, 9.5); scene.add(street);
for (let i = -7; i <= 7; i++) box(scene, 1.4, 0.012, 0.13, 0xb9ad6a, i * 3.2, -0.142, 6.6, { noShadow: true });

// ---------- the sari-sari store ----------
const store = group(scene, 0.4, 0, -1.7);
const T_TEAL = TEX.block("#1f8f86", "#176e68", "#2aa79c"), T_CREAM = TEX.plaster("#e8d3a0", "#cdb682");
const T_YERO = TEX.yero("#b4bdc8", "#8f99a6", "#6c7686", "#9a5a3c"), T_RUST = TEX.yero("#a86a4a", "#8a4f3c", "#6e3a2c", "#56291f", 9);
const T_WOOD = TEX.wood("#75503a", "#4a3024", "#856046"), T_BENCH = TEX.wood("#34508c", "#22386a", "#42609e", 11), T_WOODD = TEX.wood("#643a22", "#3d2316", "#734529", 8);
const IRON = 0x2b2733;
for (const sx of [-1.9, 1.9]) { tbox(store, 1.2, 1.0, 0.14, T_TEAL, 0.8, sx, 0.5, 0); tbox(store, 1.2, 2.2, 0.14, T_CREAM, 1.3, sx, 2.1, 0); }
tbox(store, 2.6, 1.0, 0.14, T_TEAL, 0.8, 0, 0.5, 0); tbox(store, 2.6, 0.9, 0.14, T_CREAM, 1.3, 0, 2.75, 0);
box(store, 5.02, 0.06, 0.17, 0x146059, 0, 1.0, 0.005); box(store, 5.02, 0.14, 0.17, 0x6f655f, 0, 0.07, 0.01);
tbox(store, 0.14, 3.2, 2.7, T_CREAM, 1.3, -2.5, 1.6, -1.3); tbox(store, 0.14, 3.2, 2.7, T_CREAM, 1.3, 2.5, 1.6, -1.3);
box(store, 5.0, 3.2, 0.14, 0x86b3a2, 0, 1.6, -2.6); box(store, 5.0, 0.1, 2.7, 0x6b4a36, 0, 0.05, -1.3, { noShadow: true });
tbox(store, 5.5, 0.07, 3.2, T_RUST, 0.6, 0, 3.27, -1.25).rotation.x = 0.05;
// door, calendar on it
tbox(store, 0.8, 1.9, 0.05, T_WOODD, 0.5, 1.9, 0.95, 0.08); box(store, 0.9, 0.06, 0.07, 0x3d2316, 1.9, 1.93, 0.08);
box(store, 0.05, 0.05, 0.05, 0xe8c66a, 1.62, 0.95, 0.12); signPlane(store, "poster_calendar", 0.26, 0.347, 1.98, 1.42, 0.108);
// counter and grille
tbox(store, 2.8, 0.07, 0.42, T_WOOD, 0.5, 0, 1.0, 0.1);
const grille = group(store, 0, 0, 0.06);
const grilleBars = [], grilleRails = [];
for (let i = 0; i <= 13; i++) grilleBars.push(box(grille, 0.028, 1.3, 0.028, IRON, -1.3 + i * 0.2, 1.65, 0, { noShadow: true }));
for (const y of [1.45, 1.87, 2.28]) grilleRails.push(box(grille, 2.6, 0.03, 0.03, IRON, 0, y, 0, { noShadow: true }));
// shelves full of paninda
const BOTTLES = [["bottle_toyo", 0x2a1810], ["bottle_suka", 0xd8d2b8], ["bottle_patis", 0x9a5a20], ["bottle_vibecola", 0x1e1210], ["bottle_clawd", 0xd97757], ["bottle_sprint", 0x2f9a4a], ["bottle_cpp", 0x7a8a2a], ["bottle_ctrlz", 0x2f6fd9]];
const CANS = ["can_404", "can_python", "can_bugspray", "can_java", "can_stack"];
const PACKS = ["pack_prompt", "pack_null", "pack_cookies", "box_safemode", "box_sudo", "box_token", "box_chocnull"];
function bottle(parent, label, liquid, x, y, z) {
  const g = group(parent, x, y, z);
  mesh(g, new THREE.CylinderGeometry(0.033, 0.035, 0.15, 7), mat(liquid), 0, 0.075, 0, { noShadow: true });
  mesh(g, new THREE.CylinderGeometry(0.013, 0.03, 0.05, 7), mat(liquid), 0, 0.175, 0, { noShadow: true });
  mesh(g, new THREE.CylinderGeometry(0.016, 0.016, 0.02, 7), mat(0xd8d2c8), 0, 0.21, 0, { noShadow: true });
  product(g, label, 0.058, 0.077, 0.006, 0, 0.078, 0.034);
  return g;
}
{
  const r = rng(21);
  for (let s = 0; s < 3; s++) {
    const y = 1.12 + s * 0.48;
    tbox(store, 4.6, 0.04, 0.32, T_WOODD, 0.5, 0, y, -2.36, { noShadow: true });
    let x = -2.22;
    while (x < 2.2) {
      const run = 2 + Math.floor(r() * 3);
      if (s === 2) {
        const b = BOTTLES[Math.floor(r() * BOTTLES.length)];
        for (let k = 0; k < run && x < 2.2; k++, x += 0.082) bottle(store, b[0], b[1], x + 0.04, y + 0.02, -2.34);
      } else if (s === 1) {
        const n = CANS[Math.floor(r() * CANS.length)], tall = r() > 0.5;
        for (let k = 0; k < run && x < 2.2; k++, x += 0.112) {
          product(store, n, 0.105, 0.131, 0.1, x + 0.055, y + 0.02 + 0.066, -2.34);
          if (tall) product(store, n, 0.105, 0.131, 0.1, x + 0.055, y + 0.02 + 0.197, -2.34);
        }
      } else {
        const n = PACKS[Math.floor(r() * PACKS.length)];
        for (let k = 0; k < run && x < 2.2; k++, x += 0.122) product(store, n, 0.116, 0.145, 0.07, x + 0.06, y + 0.02 + 0.073, -2.33);
      }
      x += r() > 0.7 ? 0.07 : 0.012;
    }
  }
}
// garapon of candy on the counter
for (let i = 0; i < 4; i++) {
  const jx = 0.48 + i * 0.2, cols = [[0xff5a8a, 0xffd23a], [0x7fd8a6, 0xf2f2ea], [0xb04ae0, 0xffd23a], [0xe8452e, 0xf2f2ea]][i];
  mesh(store, new THREE.CylinderGeometry(0.075, 0.075, 0.19, 8), mat(0xdfeee8, { alpha: 0.3 }), jx, 1.135, 0.17);
  const r = rng(40 + i);
  for (let k = 0; k < 12; k++) box(store, 0.03, 0.03, 0.03, cols[k % 2], jx + (r() - 0.5) * 0.09, 1.06 + r() * 0.1, 0.17 + (r() - 0.5) * 0.09, { noShadow: true });
  mesh(store, new THREE.CylinderGeometry(0.08, 0.08, 0.035, 8), mat([0xd9412e, 0x2f6fd9, 0xd9412e, 0x3aa655][i]), jx, 1.25, 0.17, { noShadow: true });
}
// hanging sachets, the signature of every tindahan, and chichirya down both sides
const sachets = [];
{
  const SACHETS = ["sachet_kape", "sachet_uptime", "sachet_deploy", "sachet_green", "sachet_commit", "sachet_smooth", "sachet_kilobyte", "sachet_baremetal", "sachet_array", "sachet_downtime"];
  const FB = [0xd9412e, 0x2f6fd9, 0xe5762b, 0x3aa655, 0x8a5a2a, 0xe87aa8, 0x3aa655, 0xf2f2ea, 0x3aa655, 0x8ab8e8];
  for (let i = 0; i < 9; i++) {
    if (i === 2) continue;                                           // a gap for Aling Nena to look through, with the utang sign over her
    const g = group(store, -1.2 + i * 0.3, 2.27, 0.13), n = 4 + (i % 3);
    for (let k = 0; k < n; k++) product(g, SACHETS[i % SACHETS.length], 0.088, 0.117, 0.008, 0, -0.07 - k * 0.121, 0, [4, 5], FB[i % FB.length]);
    sachets.push(g);
  }
  const BAGS = ["bag_chicharam", "bag_boybyte", "bag_pixels", "bag_node", "bag_cache"];
  for (const [sx, o] of [[-1.16, 0], [1.16, 2]]) {
    const g = group(store, sx, 2.25, -0.16);
    box(g, 0.012, 1.0, 0.012, 0xd8d2c8, 0, -0.5, -0.02, { noShadow: true });
    for (let k = 0; k < 4; k++) product(g, BAGS[(k + o) % BAGS.length], 0.2, 0.24, 0.035, 0, -0.14 - k * 0.255, 0, [4], [0xd9412e, 0x2f6fd9, 0x8a3fb0, 0x3aa655, 0xe5762b][(k + o) % 5]).rotation.z = (k % 2 ? 1 : -1) * 0.05;
    sachets.push(g);
  }
}
// saging, hanging by the window
{
  const g = group(store, -1.52, 2.62, 0.42);
  box(g, 0.01, 0.34, 0.01, 0x8a7a4a, 0, -0.17, 0, { noShadow: true });
  for (let i = 0; i < 8; i++) {
    const b = mesh(g, new THREE.CapsuleGeometry(0.02, 0.1, 2, 5), mat(i % 3 ? 0xf2c230 : 0xe0a820), Math.cos(i * 0.8) * 0.045, -0.42 - (i % 2) * 0.03, Math.sin(i * 0.8) * 0.045);
    b.rotation.z = Math.cos(i * 0.8) * 0.35; b.rotation.x = -Math.sin(i * 0.8) * 0.35;
  }
  box(g, 0.035, 0.05, 0.035, 0x5a4a2a, 0, -0.35, 0, { noShadow: true });
  sachets.push(g);
}
// awning, posts, sign, sign lamps
const awning = tbox(store, 5.7, 0.05, 1.8, T_YERO, 0.6, 0, 2.98, 0.84); awning.rotation.x = 0.2;
box(store, 5.7, 0.09, 0.06, 0x5a341f, 0, 2.79, 1.72);
tbox(store, 0.09, 2.8, 0.09, T_WOODD, 0.5, -2.6, 1.4, 1.62); tbox(store, 0.09, 2.8, 0.09, T_WOODD, 0.5, 2.6, 1.4, 1.62);
box(store, 3.52, 0.7, 0.06, 0x5a341f, 0, 3.17, 1.72);
signPlane(store, "sign_store", 3.4, 0.6375, 0, 3.17, 1.752, true);
for (const sx of [-1.2, 1.2]) { box(store, 0.02, 0.2, 0.02, IRON, sx, 3.6, 1.76, { noShadow: true }); box(store, 0.02, 0.02, 0.2, IRON, sx, 3.7, 1.86, { noShadow: true }); box(store, 0.1, 0.05, 0.08, 0xfff0b8, sx, 3.68, 1.96, { glow: 1.7 }); }
// the bulb everybody sits under, and the moths that found it
const BULB = [-0.3, 2.44, 1.5];                              // out near the eave, so it lights faces, not the tops of heads
const bulb = mesh(store, new THREE.SphereGeometry(0.055, 6, 5), mat(0xffe9a8, { glow: 3.2 }), BULB[0], BULB[1], BULB[2]);
box(store, 0.012, 0.38, 0.012, 0x1a1a1a, BULB[0], BULB[1] + 0.22, BULB[2], { noShadow: true });
let bulbHum = 0;                                                  // 0..1, a very slight mains flicker (episode 2 raises it while the fan is still)
const bulbLight = new THREE.PointLight(0xffdcb8, 7.5, 10, 2);
bulbLight.position.set(BULB[0], BULB[1] - 0.06, BULB[2]); bulbLight.castShadow = true;
bulbLight.shadow.mapSize.set(512, 512); bulbLight.shadow.bias = -0.006; bulbLight.shadow.normalBias = 0.03; bulbLight.shadow.camera.near = 0.12;
store.add(bulbLight);
const inside = new THREE.PointLight(0xffd8b0, 4.8, 7, 2); inside.position.set(0, 2.55, -1.1); store.add(inside);
const moths = [];
for (let i = 0; i < 5; i++) moths.push({ m: box(store, 0.022, 0.012, 0.022, 0xfff3d0, 0, 0, 0, { glow: 1.6 }), r: 0.14 + i * 0.045, f: 2.3 + i * 0.9, o: i * 1.7 });
// Christmas lights along the eave: it is October, so it is already Christmas
const xmas = [];
{
  const XC = [0xff3a3a, 0xffd23a, 0x3aff7a, 0x4a8aff, 0xff5ad0];
  for (let i = 0; i < 27; i++) {
    const x = -2.86 + i * 0.22, sag = Math.abs(Math.sin(i * Math.PI / 6.5)) * 0.07;
    const c = XC[i % XC.length];
    xmas.push({ m: box(store, 0.04, 0.055, 0.04, c, x, 2.7 - sag, 1.76, { glow: 2.6 }), on: mat(c, { glow: 2.6 }), off: mat(c, { glow: 0.28 }), i });
    if (i < 26) { const w = box(store, 0.225, 0.008, 0.008, 0x14101c, x + 0.11, 2.735 - sag, 1.76, { noShadow: true }); w.rotation.z = (Math.abs(Math.sin((i + 1) * Math.PI / 6.5)) * 0.07 - sag) / -0.22; }
  }
}
// the parol
const parol = group(store, 2.28, 2.74, 1.62);
box(parol, 0.008, 0.3, 0.008, 0x1a1a1a, 0, -0.15, 0, { noShadow: true });
const parolStar = group(parol, 0, -0.66, 0);
{
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, rr = i % 2 ? 0.135 : 0.33; if (i) sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const t = painted(64, 64, (g) => {
    g.fillStyle = "#ff3a5a"; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#28d86a" : "#ff3a5a"; g.beginPath(); g.moveTo(32, 32); const a = i * Math.PI / 5 - Math.PI / 2; g.arc(32, 32, 34, a, a + Math.PI / 5); g.fill(); }
    g.fillStyle = "#ffd23a"; g.beginPath(); g.arc(32, 32, 15, 0, 7); g.fill();
    g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill();
  }, { mip: false });
  t.repeat.set(1 / 0.68, 1 / 0.68); t.offset.set(0.5, 0.5);
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false });
  mesh(parolStar, sg, mat(0xffffff, { map: t, glow: 1.9 }), 0, 0, -0.025);
  mesh(parolStar, new THREE.TorusGeometry(0.37, 0.014, 4, 20), mat(0xffd23a, { glow: 1.2 }));
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) box(parolStar, 0.014, 0.3, 0.008, [0xff3a5a, 0xffd23a, 0x28d86a, 0xf2f2ea][k], sx * 0.2 + (k - 1.5) * 0.02, -0.46, 0, { glow: 0.9 });
}
const parolLight = new THREE.PointLight(0xff6ac0, 3.2, 6, 2); parolLight.position.set(0, -0.66, 0.2); parol.add(parolLight);
// what is fixed to the wall: e-load tarp, Piso WiFi, a flyer, the utang sign, yelo, the meter
signPlane(store, "sign_load", 1.05, 0.42, -1.9, 2.5, 0.075);
const wifi = group(store, -1.86, 1.52, 0.07);
box(wifi, 0.27, 0.4, 0.13, 0x9a9da6, 0, 0, 0.065); signPlane(wifi, "sign_pisowifi", 0.25, 0.375, 0, 0, 0.132, true);
box(wifi, 0.012, 0.24, 0.012, 0x1a1a1a, -0.09, 0.32, 0.06, { noShadow: true }); box(wifi, 0.012, 0.24, 0.012, 0x1a1a1a, 0.09, 0.32, 0.06, { noShadow: true });
box(wifi, 0.012, 1.2, 0.012, 0x1a1a1a, 0.12, 0.8, 0.01, { noShadow: true });
const wifiLed = box(wifi, 0.02, 0.02, 0.01, 0x3aff7a, 0.1, 0.17, 0.134, { glow: 3 });
signPlane(store, "poster_missing", 0.21, 0.28, -2.3, 1.74, 0.075).rotation.z = 0.05;
const utang = signPlane(store, "sign_utang", 0.5, 0.333, -0.6, 1.99, 0.14); utang.rotation.z = -0.045;
const yelo = group(store, 1.9, 2.72, 0.5);
for (const sx of [-0.2, 0.2]) box(yelo, 0.006, 0.2, 0.006, 0xd8d2c8, sx, -0.1, 0, { noShadow: true });
signPlane(yelo, "sign_yelo", 0.5, 0.3125, 0, -0.36, 0); box(yelo, 0.52, 0.33, 0.012, 0xe9e2d0, 0, -0.36, -0.008);
box(store, 0.17, 0.24, 0.1, 0x6a8a7a, 2.3, 2.5, 0.12); mesh(store, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), mat(0xcfe0e8, { glow: 0.5 }), 2.3, 2.52, 0.18).rotation.x = Math.PI / 2;
box(store, 0.02, 0.9, 0.02, 0x3a3a44, 2.3, 3.05, 0.1, { noShadow: true });
// the listahan
const listTex = painted(64, 80, (g, w, h) => {
  g.fillStyle = "#f3ecd6"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#c8281e"; g.fillRect(9, 0, 1, h);
  for (let y = 8; y < h - 4; y += 7) { g.fillStyle = "#3a4a8a"; g.fillRect(13, y, 16 + ((y * 7) % 19), 2); g.fillRect(50, y, 9, 2); if (y % 3 === 2) { g.fillStyle = "#c8281e"; g.fillRect(12, y + 1, 48, 1); } }
});
const notebook = group(store, -0.22, 1.045, 0.16);
box(notebook, 0.27, 0.02, 0.33, 0x2a3f7a, 0, 0, 0, { noShadow: true });
plane(notebook, 0.24, 0.3, mat(0xffffff, { map: listTex }), 0, 0.012, 0).rotation.x = -Math.PI / 2;
box(notebook, 0.015, 0.015, 0.16, 0xf2c230, 0.17, 0.012, 0.02, { noShadow: true });

// ---------- bench and what sits around it ----------
const benchZ = -0.9;
tbox(scene, 2.5, 0.06, 0.44, T_BENCH, 0.5, -0.02, 0.43, benchZ);
for (const x of [-1.15, 1.1]) { box(scene, 0.07, 0.4, 0.07, 0x22386a, x, 0.2, benchZ - 0.16); box(scene, 0.07, 0.4, 0.07, 0x22386a, x, 0.2, benchZ + 0.16); box(scene, 0.06, 0.05, 0.36, 0x22386a, x, 0.36, benchZ); }
box(scene, 2.3, 0.05, 0.05, 0x22386a, -0.02, 0.2, benchZ);
function crate(name, col, x, y, z) {
  product(scene, name, 0.46, 0.3, 0.34, x, y, z, [0, 1, 4, 5], col).castShadow = true;
}
crate("crate_vibecola", 0xc8281e, -1.98, 0.15, -1.28); crate("crate_sprint", 0x2f9a4a, -1.98, 0.45, -1.28); crate("crate_clawd", 0xd97757, -2.5, 0.15, -1.2);
for (let i = 0; i < 6; i++) { const bx = -2.13 + (i % 3) * 0.15, bz = -1.36 + Math.floor(i / 3) * 0.16; mesh(scene, new THREE.CylinderGeometry(0.03, 0.033, 0.14, 6), mat(0x2a1810), bx, 0.66, bz); mesh(scene, new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6), mat(i % 2 ? 0xd9412e : 0xd8d2c8), bx, 0.74, bz, { noShadow: true }); }
// halaman sa lata
for (const [x, z, c, s] of [[2.78, -1.32, 0xc9503c, 1], [3.14, -1.18, 0x9aa3b0, 0.8], [-3.0, -1.45, 0x2f6fd9, 1.1], [-3.3, -1.25, 0xc9a23c, 0.7]]) {
  mesh(scene, new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.24 * s, 8), mat(c), x, 0.12 * s, z);
  const r = rng(Math.floor(x * 10 + 99));
  for (let i = 0; i < 9; i++) {
    const leaf = mesh(scene, facet(new THREE.ConeGeometry(0.04 * s, (0.4 + r() * 0.35) * s, 4)), mat(i % 2 ? 0x2f8a4a : 0x49b05e), x + (r() - 0.5) * 0.12, 0.42 * s + r() * 0.08, z + (r() - 0.5) * 0.12);
    leaf.rotation.set((r() - 0.5) * 0.9, r() * 3, (r() - 0.5) * 0.9);
  }
}
{ const w = group(scene, 2.25, 0, -1.5); w.rotation.z = 0.12; box(w, 0.03, 1.0, 0.03, 0x9a7a3a, 0, 0.9, 0); box(w, 0.1, 0.5, 0.06, 0x7a5a2a, 0, 0.3, 0); box(w, 0.16, 0.2, 0.08, 0x6a4a22, 0, 0.1, 0); }

// ---------- poste, kawad, ilaw, ring ----------
const pole = group(scene, 3.35, 0, 0.85);
mesh(pole, new THREE.CylinderGeometry(0.1, 0.13, 7.4, 7), mat(0x4a4048), 0, 3.7, 0);
box(pole, 1.9, 0.1, 0.1, 0x4a4048, 0, 6.7, 0); box(pole, 1.3, 0.1, 0.1, 0x4a4048, 0, 6.1, 0);
mesh(pole, new THREE.CylinderGeometry(0.2, 0.2, 0.55, 8), mat(0x6a6a74), 0.4, 5.3, 0);
box(pole, 1.1, 0.06, 0.06, 0x4a4048, -0.55, 4.6, 0); box(pole, 0.3, 0.09, 0.18, 0x4a4048, -1.1, 4.57, 0);
box(pole, 0.22, 0.05, 0.13, 0xffd9a0, -1.1, 4.5, 0, { glow: 5 });
const lamp = new THREE.SpotLight(0xffc27a, 60, 18, 0.85, 0.55, 1.7);
lamp.position.set(-1.1, 4.42, 0.05); pole.add(lamp);
lamp.target.position.set(0.2, 0, -0.2); scene.add(lamp.target);
lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0012; lamp.shadow.normalBias = 0.02;
for (const [y, dz, sag] of [[6.76, -0.85, 0.5], [6.76, 0.0, 0.42], [6.76, 0.85, 0.55], [6.15, -0.5, 0.36], [6.15, 0.5, 0.48], [5.6, 0.1, 0.62], [5.45, -0.2, 0.7]]) {
  for (const dir of [-1, 1]) {                                        // each span sags, drawn as short straight pieces
    const span = 26, N = 9;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const y0 = y - sag * 8.8 * u0 * (1 - u0), y1 = y - sag * 8.8 * u1 * (1 - u1);
      const seg = box(scene, span / N + 0.02, 0.04, 0.04, 0x0e0a18, 3.35 + dir * span * (u0 + u1) / 2, (y0 + y1) / 2, 0.85 + dz, { glow: 1 });
      seg.rotation.z = Math.atan2(y1 - y0, span / N) * dir;
    }
  }
}
// the barangay ring, nailed to the post
{
  const g = group(pole, 0, 3.05, 0.16);
  box(g, 0.95, 0.62, 0.04, 0xe9e2d0, 0, 0, 0); box(g, 0.34, 0.26, 0.045, 0xe5762b, 0, -0.1, 0.002); box(g, 0.26, 0.18, 0.05, 0xe9e2d0, 0, -0.1, 0.004);
  const rim = mesh(g, new THREE.TorusGeometry(0.19, 0.016, 4, 12), mat(0xe5762b), 0, -0.24, 0.24); rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const n = box(g, 0.008, 0.2, 0.008, 0xe9e2d0, Math.cos(a) * 0.15, -0.35, 0.24 + Math.sin(a) * 0.15, { noShadow: true }); n.rotation.z = Math.cos(a) * 0.25; n.rotation.x = -Math.sin(a) * 0.25; }
}

// ---------- tricycle, parked on the wet street ----------
const trike = group(scene, -2.75, -0.15, 2.5); trike.rotation.y = 0.28;
{
  const t = trike;
  box(t, 1.25, 0.62, 0.74, 0x2f6fd9, 0, 0.6, 0.45); tbox(t, 1.38, 0.05, 0.9, T_YERO, 0.5, 0, 1.52, 0.42);
  for (const [x, z] of [[-0.6, 0.8], [0.6, 0.8], [-0.6, 0.08], [0.6, 0.08]]) box(t, 0.05, 0.62, 0.05, 0x9aa3b0, x, 1.2, z);
  box(t, 0.5, 0.3, 0.74, 0x245ab0, 0.72, 0.5, 0.45); box(t, 1.0, 0.12, 0.76, 0xf2c230, 0, 0.88, 0.45);
  box(t, 1.5, 0.28, 0.24, 0xc8281e, 0.05, 0.62, -0.25); box(t, 0.5, 0.12, 0.26, 0x1a1418, -0.2, 0.82, -0.25);
  box(t, 0.06, 0.5, 0.06, 0x9aa3b0, 0.62, 0.9, -0.25); box(t, 0.5, 0.05, 0.05, 0x1a1418, 0.62, 1.15, -0.25);
  box(t, 0.1, 0.1, 0.06, 0xfff3c8, 0.86, 0.86, -0.25, { glow: 2.2 }); box(t, 0.08, 0.06, 0.04, 0xff2a2a, -0.72, 0.62, -0.25, { glow: 2 });
  for (const [x, z] of [[-0.6, -0.25], [0.75, -0.25], [0.1, 0.9]]) { const wh = mesh(t, new THREE.CylinderGeometry(0.27, 0.27, 0.1, 10), mat(0x16121a), x, 0.27, z); wh.rotation.x = Math.PI / 2; }
}

// ---------- neighbours, sampayan, palms ----------
const T_HB = TEX.block("#8d8a80", "#6f6c64", "#a09c92", 31), T_JAL = TEX.jalousie("#ffc86a"), T_JALB = TEX.jalousie("#8ab8ff", 8);
const tvWindows = [];
function house(x, z, w, h, d, wallTex, roofTex, lit, facing = 1) {
  const g = group(scene, x, 0, z);
  tbox(g, w, h, d, wallTex, 1.0, 0, h / 2, 0);
  const rf = tbox(g, w + 0.5, 0.08, d + 0.6, roofTex, 0.6, 0, h + 0.22, 0); rf.rotation.x = 0.12 * facing;
  const r = rng(Math.floor(x * 31 + z * 17 + 400));
  for (let i = 0; i < Math.floor(w / 1.5); i++) {
    const roll = r(), wx = -w / 2 + 0.85 + i * 1.5;
    if (roll < lit) plane(g, 0.66, 0.88, mat(0xffffff, { map: T_JAL, glow: 1.15 }), wx, h * 0.62, facing * (d / 2 + 0.012)).rotation.y = facing < 0 ? Math.PI : 0;
    else if (roll < lit + 0.18) { const p = plane(g, 0.66, 0.88, new THREE.MeshBasicMaterial({ map: T_JALB, color: 0xffffff }), wx, h * 0.62, facing * (d / 2 + 0.012)); p.rotation.y = facing < 0 ? Math.PI : 0; tvWindows.push(p.material); }
    else box(g, 0.66, 0.88, 0.03, 0x241c30, wx, h * 0.62, facing * (d / 2 + 0.005), { noShadow: true });
  }
  return g;
}
const hL = house(-5.7, -2.9, 4.6, 3.1, 3.2, TEX.plaster("#c8787e", "#a8585e", 12), T_RUST, 0.55);
const hR = house(6.1, -3.1, 4.6, 3.5, 3.4, T_HB, T_YERO, 0.6);
house(-10.6, -3.4, 4.4, 4.7, 3.6, TEX.plaster("#d8be7e", "#b89e5e", 13), T_RUST, 0.5); house(11.0, -3.2, 4.8, 2.9, 3.2, TEX.plaster("#7aa88a", "#5a886a", 14), T_YERO, 0.5);
house(-2.6, -7.6, 5, 5.6, 3, TEX.plaster("#5a4a86", "#463a6e", 15), T_RUST, 0.45); house(4.2, -8.2, 6, 4.8, 3, TEX.plaster("#4e3f78", "#3d3162", 16), T_YERO, 0.45);
for (let i = 0; i < 8; i++) house(-18 + i * 5.2, 19.5 + (i % 2) * 0.6, 4.6, 2.9 + (i * 37 % 5) * 0.45, 3.2, [T_HB, TEX.plaster("#6a5a96", "#54467a", 17 + i)][i % 2], T_RUST, 0.6, -1);
// water tank and an old TV antenna on the roofs behind
mesh(scene, new THREE.CylinderGeometry(0.7, 0.7, 1.2, 9), mat(0x3a4a7a), -3.4, 6.5, -7.6); for (const s of [-1, 1]) box(scene, 0.08, 0.7, 0.08, 0x2a2a34, -3.4 + s * 0.5, 5.75, -7.6);
{ const g = group(scene, 5.4, 4.95, -8.0); box(g, 0.04, 1.6, 0.04, 0x1a1622, 0, 0.8, 0, { glow: 1 }); for (let i = 0; i < 4; i++) box(g, 0.9 - i * 0.15, 0.03, 0.03, 0x1a1622, 0, 1.0 + i * 0.18, 0, { glow: 1 }); }
// sampayan between the store and the house on the right
const laundry = [];
{
  const g = group(scene, 4.3, 2.35, -1.2);
  box(g, 2.9, 0.012, 0.012, 0xd8d2c8, 0, 0, 0, { noShadow: true });
  const cl = [0xe8452e, 0xf2f2ea, 0x2f6fd9, 0xffd23a, 0x3aa655, 0xe87aa8];
  for (let i = 0; i < 6; i++) { const p = group(g, -1.2 + i * 0.48, 0, 0); box(p, 0.36, 0.44, 0.02, cl[i], 0, -0.24, 0); if (i % 2) { box(p, 0.12, 0.16, 0.02, cl[i], -0.24, -0.1, 0); box(p, 0.12, 0.16, 0.02, cl[i], 0.24, -0.1, 0); } laundry.push(p); }
}
const palms = [];
function palm(x, z, h, lean) {
  const g = group(scene, x, 0, z), N = 8;
  for (let i = 0; i < N; i++) mesh(g, new THREE.CylinderGeometry(0.1 - i * 0.006, 0.115 - i * 0.006, h / N + 0.04, 6), mat(i % 2 ? 0x3a2c30 : 0x45343a), lean * (i / N) ** 2 * 1.6, (i + 0.5) * h / N, 0);
  const top = group(g, lean * 1.6 * ((N - 0.5) / N) ** 2, h, 0);
  for (let k = 0; k < 10; k++) {
    const f = group(top); f.rotation.y = (k / 10) * Math.PI * 2 + 0.3;
    const a = group(f); a.rotation.z = -0.3 - (k % 3) * 0.2;
    box(a, 1.5, 0.05, 0.36, k % 2 ? 0x173c34 : 0x215244, 0.8, 0, 0); box(a, 1.0, 0.05, 0.24, 0x173c34, 1.8, -0.24, 0).rotation.z = -0.5;
    palms.push({ a, base: a.rotation.z, o: k * 0.9 + x });
  }
  for (let k = 0; k < 4; k++) mesh(top, new THREE.SphereGeometry(0.13, 6, 5), mat(0x4a3a24), Math.cos(k * 1.6) * 0.16, -0.18, Math.sin(k * 1.6) * 0.16);
}
palm(-3.6, -5.2, 7.8, 0.6); palm(3.3, -5.8, 8.8, -0.5); palm(-8.2, -6.5, 6.8, -0.4); palm(8.4, -6.8, 7.4, 0.5); palm(0.3, -9.8, 9.8, 0.3);

function setAt(t) {
  street.material.uniforms.time.value = t;
  sachets.forEach((s, i) => { s.rotation.z = Math.sin(t * 1.1 + i * 0.9) * 0.03; s.rotation.x = Math.sin(t * 0.8 + i) * 0.03; });
  moths.forEach((m) => { const a = t * m.f + m.o; m.m.position.set(BULB[0] + Math.cos(a) * m.r, BULB[1] + Math.sin(a * 1.7) * 0.09, BULB[2] + Math.sin(a) * m.r); });
  const step = Math.floor(t * 2.5);
  xmas.forEach((x) => { x.m.material = ((x.i + step) % 3 === 0) ? x.off : x.on; });
  parolStar.rotation.y = Math.sin(t * 0.7) * 0.5; parol.rotation.z = Math.sin(t * 0.9) * 0.04;
  parolLight.intensity = 3.2 + Math.sin(t * 3.1) * 0.5;
  yelo.rotation.x = Math.sin(t * 1.3) * 0.05;
  wifiLed.visible = (t * 2.4) % 1 < 0.6;
  bulbLight.intensity = 7.5 * (0.97 + 0.03 * Math.sin(t * 37) * Math.sin(t * 5.3)) * (1 + bulbHum * 0.05 * Math.sin(t * 190) * Math.sin(t * 61));
  tvWindows.forEach((m, i) => { const k = 0.75 + 0.5 * Math.abs(Math.sin(Math.floor(t * 5 + i * 3) * 12.9898)); m.color.setScalar(k); });
  laundry.forEach((p, i) => { p.rotation.x = Math.sin(t * 1.5 + i * 0.7) * 0.12; });
  palms.forEach((p) => { p.a.rotation.z = p.base + Math.sin(t * 0.9 + p.o) * 0.045; });
}
