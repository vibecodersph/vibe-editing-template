// Kausap si Claude, v2. The whole film is drawn from HyperFrames time: renderAt(t) rebuilds every
// pose from t, and nothing reads a clock, so any frame can be seeked on its own.
// The files in src/lib are joined in name order into one module by tools/build.py.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TL = window.TL;
const W = 360, H = 640;                       // drawn small, shown three times larger without smoothing
const canvas = document.getElementById("three-layer");
const capEl = document.getElementById("cap");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping;   // the grade pass at the end does the tone curve

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.35, 700);

// ---------- small tools ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// A value that eases to each key's value starting at the key's time.
function track(keys, t, ease = 0.5) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [kt, kv, ke] = keys[i];
    if (t <= kt) break;
    v = v + (kv - v) * smooth((t - kt) / (ke || ease));
  }
  return v;
}

// ---------- shading: three hard steps of light, like inked cel paint ----------
const GRAD = (() => {
  const steps = [0, 0, 0, 0, 0, 38, 62, 88, 118, 140, 176, 196, 228, 255, 255, 255];
  const t = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
// A hard-edged coloured rim on whatever faces away from the camera toward the dusk sky.
// It is what lifts a black hoodie off a dark street.
const RIM = { uRimColor: { value: new THREE.Color(1.0, 0.42, 0.5).multiplyScalar(0.9) }, uRimWorld: { value: new THREE.Vector3(-0.75, 0.55, -0.6).normalize() } };
function addRim(m, strength = 1) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uRimColor = RIM.uRimColor;
    sh.uniforms.uRimWorld = RIM.uRimWorld;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRimColor; uniform vec3 uRimWorld;")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        {
          vec3 rv = normalize(vViewPosition);
          vec3 rd = normalize((viewMatrix * vec4(uRimWorld, 0.0)).xyz);
          float rim = pow(1.0 - clamp(dot(normal, rv), 0.0, 1.0), 2.4);
          float side = clamp(dot(normal, rd) * 0.7 + 0.45, 0.0, 1.0);
          totalEmissiveRadiance += uRimColor * smoothstep(0.34, 0.46, rim * side) * ${strength.toFixed(2)};
        }`);
  };
  m.customProgramCacheKey = () => "rim" + strength.toFixed(2);
  return m;
}
const mats = new Map();
// opt: { glow: k } unlit and k times brighter than white (blooms when k > 1); { map }; { rim: k }
function mat(color, opt = {}) {
  const key = color + "|" + (opt.glow || 0) + "|" + (opt.map ? opt.map.uuid : "") + "|" + (opt.rim || 0) + "|" + (opt.alpha || 1) + "|" + (opt.side || 0);
  if (mats.has(key)) return mats.get(key);
  let m;
  if (opt.glow) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(opt.glow), map: opt.map || null, fog: false });
  } else {
    m = new THREE.MeshToonMaterial({ color, gradientMap: GRAD, map: opt.map || null });
    if (opt.rim) addRim(m, opt.rim);
  }
  if (opt.alpha && opt.alpha < 1) { m.transparent = true; m.opacity = opt.alpha; m.depthWrite = false; }
  if (opt.side) m.side = THREE.DoubleSide;
  mats.set(key, m);
  return m;
}
const unit = new THREE.BoxGeometry(1, 1, 1);
function shade(m, opt = {}) {
  const lit = !(opt.glow) && !(opt.alpha && opt.alpha < 1);
  m.castShadow = lit && !opt.noShadow;
  m.receiveShadow = lit;
  return m;
}
function box(parent, w, h, d, color, x = 0, y = 0, z = 0, opt = {}) {
  const m = shade(new THREE.Mesh(unit, mat(color, opt)), opt);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function mesh(parent, geom, material, x = 0, y = 0, z = 0, opt = {}) {
  const m = shade(new THREE.Mesh(geom, material), opt);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
// A box whose texture repeats by real size, so bricks and planks stay the same scale on every face.
function tbox(parent, w, h, d, tex, tile, x = 0, y = 0, z = 0, opt = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
  }
  return mesh(parent, g, mat(opt.color ?? 0xffffff, { map: tex, ...opt }), x, y, z, opt);
}
function painted(w, h, draw, opt = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = opt.mip === false ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = opt.mip !== false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (opt.repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
function plane(parent, w, h, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z);
  m.receiveShadow = !(material.isMeshBasicMaterial);
  parent.add(m);
  return m;
}
// A skin stretched over stacked rings: the one tool behind every body part.
// rings: [y, rx, rz, x, z] bottom to top. e < 1 squares the cross-section off.
function loft(rings, seg = 10, o = {}) {
  const rs = rings.map((r) => ({ y: r[0], rx: r[1], rz: r[2] ?? r[1], x: r[3] || 0, z: r[4] || 0 }));
  const n = rs.length, pos = [], uv = [], idx = [], e = o.e ?? 1;
  for (let i = 0; i < n; i++) for (let j = 0; j <= seg; j++) {
    const a = (j / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    pos.push(rs[i].x + Math.sign(ca) * Math.abs(ca) ** e * rs[i].rx, rs[i].y, rs[i].z + Math.sign(sa) * Math.abs(sa) ** e * rs[i].rz);
    uv.push(j / seg, i / (n - 1));
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const cap = (i, top) => {
    const c = pos.length / 3;
    pos.push(rs[i].x, rs[i].y, rs[i].z); uv.push(0.5, top ? 1 : 0);
    for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j; if (top) idx.push(c, a + 1, a); else idx.push(c, a, a + 1); }
  };
  if (o.capBottom !== false) cap(0, false);
  if (o.capTop !== false) cap(n - 1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nm = g.attributes.normal;                       // weld the seam so no line shows down the side
  for (let i = 0; i < n; i++) {
    const a = i * (seg + 1), b = a + seg;
    const x = nm.getX(a) + nm.getX(b), y = nm.getY(a) + nm.getY(b), z = nm.getZ(a) + nm.getZ(b), l = Math.hypot(x, y, z) || 1;
    nm.setXYZ(a, x / l, y / l, z / l); nm.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}
// Flat facets on a smooth shape (cel paint has no flatShading switch).
function facet(geom) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  g.computeVertexNormals();
  return g;
}
// A tapered tube hanging down from its pivot: arms, legs, posts.
function limb(len, r0, r1, seg = 9, e = 1) {
  return loft([[-len, r1 * 0.96, r1 * 0.96], [-len * 0.98, r1, r1], [-len * 0.5, (r0 + r1) / 2, (r0 + r1) / 2], [-0.01, r0, r0], [0, r0 * 0.96, r0 * 0.96]], seg, { e });
}
