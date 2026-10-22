// ---------- image assets: an episode's own pictures as textures, and picture inserts on the timeline ----------
// How an episode uses them (tools/build.py does the work; nothing is fetched or decoded at run time, so frame 0 already has every picture):
//
//   script.json  "assets":  { "wall": "assets/tex-wall.png", "far": { "file": "assets/street-far.png", "max": 512 } }
//                           paths are relative to the episode folder; "max" caps the longer side in pixels (default 512; the frame is 360 x 640)
//                "inserts": [{ "at": { "line": 5, "offset": 0.4 }, "dur": 1.2, "asset": "far", "layout": "full" }]
//                           "at" takes the same anchors the sound effects use ({t} | {line, word?, edge?, offset?} | {card, offset?}); layout "full" or "pip"
//
//   set code     ASSET.tex("wall", { pixel: true, repeat: [3, 2] })   a THREE texture, ready at once. Options: pixel (hard texels when magnified),
//                                                                    repeat [u, v] (tiles), fadeTop 0..1 (the top fraction fades to clear, for a plate
//                                                                    that must melt into the sky behind it; use it on a transparent material)
//                ASSET.has("wall"), ASSET.size("wall") -> [w, h]
//
// build.py decodes each file with Pillow, scales it, flips it bottom row first and writes the raw pixels into the page as base64 (TL.assets);
// here they become DataTextures synchronously. A name the page does not have gives a grey checker and a console warning, not a crash.
// An insert is drawn inside the scene, on a card fixed in front of the lens, so it goes through the same ink, grade and dither as everything else.
const ASSET = {
  data: (TL && TL.assets) || {},
  has(name) { return !!this.data[name]; },
  size(name) { const a = this.data[name]; return a ? [a.w, a.h] : [2, 2]; },
  tex(name, o = {}) {
    let a = this.data[name];
    if (!a) { console.warn("ASSET: no asset named " + name); a = { w: 2, h: 2, c: 4, px: new Uint8Array([120, 120, 120, 255, 80, 80, 80, 255, 80, 80, 80, 255, 120, 120, 120, 255]) }; }
    if (!a.px) {                                                             // decode once: base64 -> bytes -> RGBA
      const bin = atob(a.d), n = a.w * a.h, px = new Uint8Array(n * 4);
      if (a.c === 4) for (let i = 0; i < n * 4; i++) px[i] = bin.charCodeAt(i);
      else for (let i = 0, j = 0; i < n; i++, j += 3) { px[i * 4] = bin.charCodeAt(j); px[i * 4 + 1] = bin.charCodeAt(j + 1); px[i * 4 + 2] = bin.charCodeAt(j + 2); px[i * 4 + 3] = 255; }
      a.px = px; a.d = null;
    }
    let px = a.px;
    if (o.fadeTop) { px = px.slice(); const rows = Math.max(1, Math.round(a.h * o.fadeTop)); for (let y = 0; y < rows; y++) { const k = smooth(y / rows), r = a.h - 1 - y; for (let x = 0; x < a.w; x++) px[(r * a.w + x) * 4 + 3] = Math.round(px[(r * a.w + x) * 4 + 3] * k); } }   // row 0 is the bottom
    const t = new THREE.DataTexture(px, a.w, a.h, THREE.RGBAFormat);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = o.pixel ? THREE.NearestFilter : THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4;
    if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    t.needsUpdate = true;
    return t;
  },
};
// ---- inserts: TL.inserts = [{ s, e, asset, layout }] ----
const INS = { list: (TL && TL.inserts) || [], card: null, edge: null, tex: {} };
function insertsAt(t) {
  const cur = INS.list.find((k) => t >= k.s && t < k.e);
  if (!cur) { if (INS.card) INS.card.visible = INS.edge.visible = false; return; }
  if (!INS.card) {
    if (camera.parent !== scene) scene.add(camera);
    const m = () => new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, depthFunc: THREE.AlwaysDepth });      // drawn last and over everything, yet it writes depth so no ink edge shows through it
    INS.edge = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m()); INS.card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m());
    INS.edge.material.color.setRGB(0.93, 0.9, 0.84); INS.edge.renderOrder = 998; INS.card.renderOrder = 999; INS.edge.frustumCulled = INS.card.frustumCulled = false;
    camera.add(INS.edge, INS.card);
  }
  camera.visible = true;
  const tex = INS.tex[cur.asset] || (INS.tex[cur.asset] = ASSET.tex(cur.asset, { pixel: true })), sz = ASSET.size(cur.asset), ia = sz[0] / sz[1];
  INS.card.material.map = tex; INS.card.material.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const d = camera.near * 1.6, fh = 2 * d * Math.tan(camera.fov * Math.PI / 360), fw = fh * camera.aspect;
  const pop = smooth((t - cur.s) / 0.14) * (1 - smooth((t - (cur.e - 0.12)) / 0.12));
  INS.card.visible = true;
  if (cur.layout === "pip") {                                                // a framed picture in the upper right, popping in and out
    const w = fw * 0.5 * (0.7 + 0.3 * pop), h = w / ia, x = fw / 2 - fw * 0.05 - fw * 0.25, y = fh / 2 - fh * 0.07 - (fw * 0.5 / ia) / 2;
    tex.repeat.set(1, 1); tex.offset.set(0, 0);
    INS.card.scale.set(w, h, 1); INS.card.position.set(x, y, -d); INS.edge.visible = true; INS.edge.scale.set(w + fw * 0.03, h + fw * 0.03, 1); INS.edge.position.set(x, y, -d * 1.002);
    INS.card.visible = INS.edge.visible = pop > 0.02;
  } else {                                                                   // the whole frame, the picture cropped to fill it
    const fa = fw / fh; if (ia > fa) { tex.repeat.set(fa / ia, 1); tex.offset.set((1 - fa / ia) / 2, 0); } else { tex.repeat.set(1, ia / fa); tex.offset.set(0, (1 - ia / fa) / 2); }
    INS.card.scale.set(fw * 1.002, fh * 1.002, 1); INS.card.position.set(0, 0, -d); INS.edge.visible = false;
  }
}
