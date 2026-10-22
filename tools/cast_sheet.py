"""Draw the cast's character sheets, from whatever is in src/ right now.

  python tools/cast_sheet.py [who ...] [--keep]

who is any of buloy, claude, nena, muning and the guests the sets build with makeBuloy (prof, rider, kap, bea, manong, and any
new one: they are found by reading src/sets/*.js). Without names, everybody. --keep leaves the last studio page in
video/index.html to look at in a browser; otherwise episode 00's own page is built back, as tools/lab.py does.

Writes renders/cast/<who>.png (a turnaround: front, three-quarter, side, back, in a plain studio with a floor line and a 1 m mark,
and under it four expressions, Claude's four eye states, or Muning's four poses), renders/cast/lineup.png (everybody side by side,
front view, to scale, from the same camera) and renders/cast/heights.json (each figure's height in metres, read off the lineup);
those two only when everybody is drawn.

Each figure is posed in the scene code of its own place: Buloy, Claude and Muning in the store page, a guest (and Aling Nena,
who has legs only in src/sets/defense.js) in the page of the set that builds it, with the exact options that set uses, at a
quiet moment of the example episode's timeline (episodes/00-legit-developer). A studio hook is injected into that page by string replacement, the way
tools/lab.py injects its own; nothing in src/ knows about it. The hook hides the world, lights the figure evenly (key, fill, back
and a sky light), keeps the film's own ink, bloom, grade and dither, and stands the figure up: every human in the cast is built
seated, so the sheet straightens the legs, lets the arms hang and hides the seated-only parts (the laptop, a skirt's lap panels).
Snapshots go through `npx --yes hyperframes@0.8.137 snapshot` in video/, one page at a time.
"""
import glob
import json
import math
import os
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'video')
EPS = os.path.join(ROOT, 'episodes')
EP00 = os.path.join(EPS, '00-legit-developer')
OUT = os.path.join(ROOT, 'renders', 'cast')
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build                                   # noqa: E402  page_extras: the episode's own pictures, embedded as the film embeds them
import lab                                     # noqa: E402  assemble: src/lib and the set joined the way build.py joins them

T0 = 1.0                                       # the moment of the episode the page holds still at; the studio replaces everything it shows
BG, INK, DIM = (14, 10, 24), (240, 232, 255), (172, 162, 204)
FONT = os.path.join(VIDEO, 'assets', 'fonts', 'Gelasio.ttf')
SCALE = 2                                      # sheet pixels per film pixel (the film is drawn at 360 x 640 and shown at 3x)

# level cameras, long lenses from far off so a turnaround is nearly flat and every figure in the lineup is measured alike: height y,
# field of view, pixels per metre at the subject's plane, near plane (raised with distance so the ink keeps its inner lines: its depth
# edges are measured on raw depth), where the 1 m bar stands, and the crop of the 360 x 640 frame
LEVEL = {
    'std': dict(y=1.0, fov=10, ppm=271.4, near=11.0, bar=-0.42, crop=(50, 29, 260, 587)),
    'small': dict(y=0.55, fov=12, ppm=400.0, near=5.5, bar=-0.42, crop=(0, 112, 360, 456)),
}
FACE_CAM = dict(face=1, dist=1.71, fov=24, ang=0.3, crop=(50, 140, 260, 330))
EYES_CAM = dict(p=[0.25, 0.27, 2.25], l=[0, 0.25, 0], fov=30, near=0.6, crop=(0, 195, 360, 265))
CAT_CAM = dict(p=[0, 0.36, 1.8], l=[0, 0.15, 0], fov=30, near=0.35, crop=(0, 120, 360, 340))

TURN = [('front', 0.0), ('three-quarter', -0.785), ('side', -1.571), ('back', math.pi)]
FACES = [('neutral', {}, 0.0), ('smile', dict(smile=0.75, cheek=0.8, brow=0.15), 0.0),
         ('shocked', dict(open=0.85, brow=1.0, pucker=0.25, gy=-0.1), -0.05),
         ('sad', dict(sad=0.9, brow=-0.45, lid=0.3, smile=-0.45, gy=0.35), 0.08)]
NENA_FACES = [('neutral', dict(smile=0.1), 0.0), ('smile', dict(smile=0.85, squint=0.3), 0.0),
              ('shocked', dict(open=0.8, brow=1.0, wide=-0.7), -0.05), ('sad', dict(brow=-0.8, smile=-0.6, gy=0.3), 0.08)]
EYES = [('neutral', 'neutral'), ('deadpan', 'deadpan'), ('side-eye', 'side'), ('one eye narrowed', 'narrow')]
CAT_STAND = dict(pose='stand', ears=0.3, tail=0.15)
CAT_POSES = [('sitting', dict(cat=dict(pose='sit', ears=0.2, gx=0.3), yaw=-0.6)),
             ('loaf, slow blink', dict(cat=dict(pose='loaf', blink=0.5, ears=0.0, gx=0.3), yaw=-0.6)),
             ('standing alert', dict(cat=dict(pose='stand', ears=1.0, tail=1.0, pupil=0.85, pitch=-0.12, gx=0.3), yaw=-0.6)),
             ('on a laptop keyboard', dict(cat=dict(pose='loaf', blink=0.55, ears=0.15, yaw=0.6, pitch=0.05), yaw=-math.pi / 2 + 0.5,
                                           at=[0, 0.0165, 0], laptop=[0, 0, 0.5]))]

ORDER = ['buloy', 'claude', 'nena', 'bea', 'manong', 'prof', 'rider', 'kap', 'muning']
NAMES = {'buloy': 'Buloy', 'claude': 'Claude', 'nena': 'Aling Nena', 'muning': 'Muning', 'prof': 'the panel chair (Prof. De Leon)',
         'rider': 'the delivery rider', 'kap': 'the Kapitana', 'bea': 'Bea', 'manong': 'the manong'}
SHORT = {'prof': 'panel chair', 'rider': 'rider', 'kap': 'Kapitana', 'manong': 'manong', 'nena': 'Aling Nena'}

STUDIO = r"""
window.CAST = (() => {
  const cfg = __CFG__;
  const studio = new THREE.Group(); scene.add(studio);
  const lit = (L, p) => { L.position.set(p[0], p[1], p[2]); studio.add(L); if (L.target) { L.target.position.set(0, 0.8, 0); studio.add(L.target); } };
  lit(new THREE.HemisphereLight(0xb9b6d6, 0x4a4552, 1.0), [0, 4, 0]);                  // the sky
  lit(new THREE.DirectionalLight(0xfff1df, 2.1), [2.6, 4.2, 5.2]);                      // key
  lit(new THREE.DirectionalLight(0xc6d2ff, 0.85), [-4.2, 2.2, 4.0]);                    // fill
  lit(new THREE.DirectionalLight(0xd9ccff, 0.7), [-1, 3.2, -5]);                        // back
  const bg = painted(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, cfg.bg[0]); gr.addColorStop(1, cfg.bg[1]); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); }, { mip: false });
  const LINE = 0xd8d2ee, lm = { glow: 0.85 };
  box(studio, 8, 0.002, 0.9, 0x36324a, 0, -0.001, 0, { glow: 1 });                       // a strip of floor, so a foot stands at its own depth
  box(studio, 8, 0.004, 0.006, LINE, 0, 0.002, 0.45, lm);                              // and its front edge: the floor line
  const bar = group(studio, -0.42, 0, 0);                                                // 1 m, ticked every 25 cm
  box(bar, 0.008, 1, 0.008, LINE, 0, 0.5, 0, lm);
  for (const y of [0.25, 0.5, 0.75]) box(bar, 0.026, 0.006, 0.006, LINE, 0, y, 0, lm);
  box(bar, 0.05, 0.008, 0.008, LINE, 0, 1, 0, lm);
  const S = {};
__SUBJECTS__
  if (S.muning) studio.add(laptop);                                                      // Buloy's laptop, for the cat to lie on
  for (const k in S) {
    const s = S[k]; s.root = s.root || (s.r ? s.r.V : s.m.root); studio.add(s.root);
    s.keep = []; s.root.traverse((o) => s.keep.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone(), o.visible]));
  }
  const FACE0 = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0, anger: 0 };
  const _b = new THREE.Box3(), _bb = new THREE.Box3(), _v = new THREE.Vector3();
  function bounds(root) {
    root.updateWorldMatrix(true, true); _b.makeEmpty();
    root.traverseVisible((m) => { if (!m.isMesh || !m.geometry) return; const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); _bb.copy(g.boundingBox).applyMatrix4(m.matrixWorld); _b.union(_bb); });
    return _b;
  }
  function poseHuman(r, c) {                                                              // stand up: legs straight, arms down, the seated-only parts away
    const V = r.V;
    V.children.slice(0, 2).forEach((hip, k) => { hip.visible = true; hip.rotation.set(0, 0, (k ? 1 : -1) * 0.03); for (const ch of hip.children) if (ch.isGroup) ch.rotation.set(0, 0, 0); });
    for (const ch of V.children) if (ch.isMesh) ch.visible = false;                         // a skirt's waist ring and lap panels: they only work seated
    r.vUpper.position.set(0, 0.52, 0); r.vUpper.rotation.set(0.02, 0, 0); r.vUpper.scale.set(1, 1, 1);
    r.vHead.position.set(0, 0.585, 0.008); r.vHead.rotation.set(c.pitch || 0, c.hyaw || 0, 0);
    for (const [A, s] of [[r.armL, 1], [r.armR, -1]]) {
      A.yaw.visible = true; A.yaw.position.set(s * 0.204, 0.44, 0); A.yaw.rotation.set(0, 0, 0);
      A.sh.rotation.set(0.03, 0, s * 0.3); A.el.rotation.set(-0.22, 0, 0); A.hand.rotation.set(0, s * cfg.handTurn, 0); A.H.pose = HAND_POSES.relaxed;
    }
    r.draw({ ...FACE0, ...(c.face || {}) });
  }
  function poseNena(c) {
    nena.visible = true;
    for (const ch of nena.children) if (ch.isGroup && ch !== nenaUp) ch.rotation.set(0, 0, 0);
    nenaUp.position.set(0, 0.9, 0); nenaUp.rotation.set(0, 0, 0);
    for (const A of [nenaR, nenaL]) {
      A.up.visible = true; A.up.quaternion.setFromEuler(new THREE.Euler(0.03, 0, A.s * 0.3)); A.fore.quaternion.setFromEuler(new THREE.Euler(-0.22, 0, 0));
      A.hand.quaternion.setFromEuler(new THREE.Euler(0, A.s * cfg.handTurn, 0)); A.H.pose = HAND_POSES.relaxed;
    }
    fan.visible = false;
    nenaHead.rotation.set(c.pitch || 0, c.hyaw || 0, 0);
    drawNena(nctx, { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, squint: 0, wide: 0, old: 1, ...(c.face || {}) }); nenaTex.needsUpdate = true;
  }
  function poseClaude(c) {
    if (c.eyes === "deadpan") cEyes.forEach((e) => { e.scale.y = 0.04; e.position.y = 0.188; });
    else if (c.eyes === "side") { cEyes.forEach((e) => { e.position.x -= 0.028; }); cBody.rotation.z = 0.05; }
    else if (c.eyes === "narrow") cEyes[1].scale.y = 0.046;
  }
  function frame(i) {
    const c = cfg.cells[i];
    for (const ch of scene.children) ch.visible = ch === studio;                       // the world goes; only the studio stays
    scene.background = bg; scene.fog = null;
    RIM.uRimColor.value.setRGB(cfg.rim[0], cfg.rim[1], cfg.rim[2]); RIM.uRimWorld.value.set(-0.6, 0.55, -0.58).normalize();
    grade.uniforms.uExposure.value = 1; grade.uniforms.uFade.value = 0;
    for (const k in S) S[k].root.visible = false;
    laptop.visible = false;
    bar.visible = c.bar !== null && c.bar !== undefined; if (bar.visible) bar.position.x = c.bar;
    const s = S[c.who];
    if (s) {
      for (const [o, p, q, sc, v] of s.keep) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(sc); o.visible = v; }
      laptop.visible = false;
      const R0 = s.root; R0.visible = true; R0.position.set(0, 0, 0); R0.rotation.set(0, c.yaw || 0, 0);
      if (s.kind === "human") poseHuman(s.r, c); else if (s.kind === "nena") poseNena(c); else if (s.kind === "claude") poseClaude(c);
      else { s.m.pose(c.cat || {}); if (c.at) R0.position.set(c.at[0], c.at[1], c.at[2]); }
      if (c.laptop) { laptop.visible = true; laptop.position.set(c.laptop[0], 0.007, c.laptop[1]); laptop.rotation.set(0, Math.PI + c.laptop[2], 0); lid.rotation.x = 0.33; }
      const b = bounds(R0);
      if (s.kind !== "cat") R0.position.y -= b.min.y;                                     // stand it on the floor line (the cat stands on her own origin)
      if (c.centre) R0.position.x -= (b.min.x + b.max.x) / 2;
      R0.updateWorldMatrix(true, true);
    }
    const k = c.cam;
    if (k.face) {
      const head = s.kind === "nena" ? nenaHead : s.r.vHead;
      head.updateWorldMatrix(true, false); head.localToWorld(_v.set(0, s.kind === "nena" ? 0.125 : 0.15, 0.03));
      camera.position.set(_v.x + Math.sin(k.ang) * k.dist, _v.y, _v.z + Math.cos(k.ang) * k.dist); camera.near = 0.35; camera.fov = k.fov;
      camera.updateProjectionMatrix(); camera.lookAt(_v);
    } else {
      camera.position.set(k.p[0], k.p[1], k.p[2]); camera.near = k.near; camera.fov = k.fov; camera.updateProjectionMatrix(); camera.lookAt(k.l[0], k.l[1], k.l[2]);
    }
  }
  return { t: cfg.t, index(time) { const i = Math.floor((time || 0) + 1e-6); return i >= 0 && i < cfg.cells.length ? i : -1; }, frame };
})();
"""

A_T = 'const t = Math.max(0, Math.min(TL.dur, time || 0));'
A_HANDS = '  updateHands();'
A_ACT = '// ---------- acting ----------'


def font(size):
    return ImageFont.truetype(FONT, size) if os.path.exists(FONT) else ImageFont.load_default()


def level_cam(name):
    c = LEVEL[name]
    d = (320 / c['ppm']) / math.tan(math.radians(c['fov'] / 2))
    return dict(p=[0, c['y'], round(d, 4)], l=[0, c['y'], 0], fov=c['fov'], near=c['near'])


def guests():
    """Every figure a set builds with makeBuloy: (name, set, the options exactly as the set writes them)."""
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'src', 'sets', '*.js'))):
        src = open(f, encoding='utf-8').read()
        for m in re.finditer(r'const (\w+) = makeBuloy\((\{[^}]*\})', src):
            out.append((m.group(1), os.path.splitext(os.path.basename(f))[0], m.group(2)))
    return out


def cells_for(who, kind):
    """The cells one figure needs: its turnaround, its second row, and (for the lineup) a front view from the standard camera."""
    out = []
    small = kind in ('claude', 'cat')
    cam = 'small' if small else 'std'
    for label, yaw in TURN:
        c = dict(who=who, row=1, label=label, cam=level_cam(cam), bar=LEVEL[cam]['bar'], yaw=yaw, centre=True, crop=LEVEL[cam]['crop'], level=cam)
        if kind == 'cat':
            c['cat'] = CAT_STAND
        out.append(c)
    if kind in ('human', 'nena'):
        for label, face, pitch in (NENA_FACES if kind == 'nena' else FACES):
            out.append(dict(who=who, row=2, label=label, cam={k: v for k, v in FACE_CAM.items() if k != 'crop'}, bar=None, yaw=0.0, hyaw=0.12,
                            pitch=pitch, face=dict(face, gx=face.get('gx', 0.3)), crop=FACE_CAM['crop']))
    elif kind == 'claude':
        for label, eyes in EYES:
            out.append(dict(who=who, row=2, label=label, cam={k: v for k, v in EYES_CAM.items() if k != 'crop'}, bar=None, yaw=0.0, eyes=eyes, crop=EYES_CAM['crop']))
    else:
        for label, extra in CAT_POSES:
            out.append(dict(who=who, row=2, label=label, cam={k: v for k, v in CAT_CAM.items() if k != 'crop'}, bar=None, crop=CAT_CAM['crop'], **extra))
    if small:                                                    # the lineup needs everybody from the same camera
        c = dict(who=who, row=0, label='lineup', cam=level_cam('std'), bar=LEVEL['std']['bar'], yaw=0.0, centre=True, crop=LEVEL['std']['crop'], level='std')
        if kind == 'cat':
            c['cat'] = CAT_STAND
        out.append(c)
    return out


def subjects():
    """who -> what to show and where it lives."""
    S = {
        'buloy': dict(kind='human', js='S.buloy = { kind: "human", r: buloy };', set=None,
                      src='makeBuloy({}) in src/lib/40-cast.js, the film\'s own Buloy'),
        'claude': dict(kind='claude', js='S.claude = { kind: "claude", root: C };', set=None,
                       src='the block C in src/lib/40-cast.js: a rounded body, two arm nubs, four legs, two painted-black eyes and no mouth'),
        'muning': dict(kind='cat', js='S.muning = { kind: "cat", m: makeMuning(studio, {}) };', set=None,
                       src='makeMuning(parent, {}) in src/lib/44-muning.js (v0, orange coat): in no episode yet'),
        'nena': dict(kind='nena', js='S.nena = { kind: "nena", root: nena };', set='defense',
                     src='src/lib/40-cast.js (body) and 42-nena.js (face), dressed as src/sets/defense.js dresses her: legs, skirt, apron, grey hair, face old 1'),
    }
    for var, set_name, opts in guests():
        S[var] = dict(kind='human', js='S.%s = { kind: "human", r: %s };' % (var, var), set=set_name,
                      src='src/sets/%s.js: makeBuloy(%s)' % (set_name, re.sub(r'\s+', ' ', opts)))
    return S


def native(im):
    """The frame as the film draws it: one pixel per 3 x 3 block of the 1080 x 1920 snapshot."""
    return im.convert('RGB').resize((360, 640), Image.NEAREST)


def shoot(page_set, cells, js):
    epd = EP00                                                   # any built episode gives the timeline; the page is built with the subject's own set
    tl = json.load(open(os.path.join(epd, 'timeline.json'), encoding='utf-8'))
    script = json.load(open(os.path.join(epd, 'script.json'), encoding='utf-8'))
    tl.update(caps=[], inserts=[], end={'s': tl['dur'] + 9, 'e': tl['dur'] + 9}, shots=[{'t': 0, 'shot': 'hero'}], cine_shots={})   # the studio places every camera; the episode's own shots may name props this page does not have
    tl = build.page_extras(tl, script, epd)
    scene = lab.assemble(page_set)
    for a in (A_T, A_HANDS, A_ACT):
        assert scene.count(a) == 1, ('anchor not found once in the scene code', a)
    cfg = dict(t=T0, bg=['#5a566e', '#25232d'], rim=[0.38, 0.36, 0.52], handTurn=1.35,
               cells=[{k: v for k, v in c.items() if k not in ('crop', 'label', 'row', 'level')} for c in cells])
    scene = scene.replace(A_T, 'const CASTI = window.CAST ? window.CAST.index(time) : -1; const t = CASTI >= 0 ? window.CAST.t : Math.max(0, Math.min(TL.dur, time || 0));')
    scene = scene.replace(A_HANDS, '  if (CASTI >= 0) window.CAST.frame(CASTI);\n' + A_HANDS)
    scene = scene.replace(A_ACT, STUDIO.replace('__CFG__', json.dumps(cfg)).replace('__SUBJECTS__', '  ' + '\n  '.join(js)) + A_ACT)
    html = open(os.path.join(ROOT, 'src', 'index.template.html'), encoding='utf-8').read()
    html = html.replace('__DUR__', str(max(tl['dur'], len(cells) + 1))).replace('/*__TL__*/', json.dumps(tl, ensure_ascii=False)).replace('/*__SCENE__*/', scene)
    open(os.path.join(VIDEO, 'index.html'), 'w', encoding='utf-8', newline='\n').write(html)
    snaps = os.path.join(VIDEO, 'snapshots')
    shutil.rmtree(snaps, ignore_errors=True)
    at = ','.join(str(i + 0.5) for i in range(len(cells)))
    subprocess.check_call('npx --yes hyperframes@0.8.137 snapshot --at ' + at + ' --no-end --describe false', cwd=VIDEO, shell=True,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frames = sorted((f for f in os.listdir(snaps) if f.startswith('frame-')), key=lambda f: int(re.match(r'frame-(\d+)', f).group(1)))
    assert len(frames) == len(cells), (len(frames), len(cells))
    return [native(Image.open(os.path.join(snaps, f))) for f in frames]


def crop2(im, crop):
    x, y, w, h = crop
    return im.crop((x, y, x + w, y + h)).resize((w * SCALE, h * SCALE), Image.NEAREST)


def bar_label(cell):
    """Where the 1 m mark's top is in a cropped turnaround cell, in sheet pixels."""
    c = LEVEL[cell['level']]
    col = 180 + c['bar'] * c['ppm'] - cell['crop'][0]
    row = 320 - (1.0 - c['y']) * c['ppm'] - cell['crop'][1]
    return (col + 9) * SCALE, row * SCALE - 15


def sheet(who, info, row1, row2, path):
    f_name, f_sub, f_lab = font(46), font(22), font(26)
    lines = [info['src']] + info.get('notes', [])
    head_h = 78 + 30 * len(lines)
    rows = [row1, row2]
    widths = [sum(im.width for _, im in r) + 12 * (len(r) - 1) for r in rows]
    W = max(widths) + 48
    H = head_h + sum(44 + max(im.height for _, im in r) + 20 for r in rows) + 10
    out = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(out)
    d.text((24, 16), info['name'], font=f_name, fill=INK)
    for i, ln in enumerate(lines):
        d.text((24, 76 + 30 * i), ln, font=f_sub, fill=DIM)
    y = head_h
    for r, wd in zip(rows, widths):
        x = (W - wd) // 2
        for label, im in r:
            d.text((x + 6, y + 8), label, font=f_lab, fill=INK)
            out.paste(im, (x, y + 44))
            x += im.width + 12
        y += 44 + max(im.height for _, im in r) + 20
    out.save(path)
    return out.size


def fill_holes(m):
    """The mask with every gap that does not reach the frame's edge filled in."""
    out = np.zeros_like(m)
    out[0, :], out[-1, :], out[:, 0], out[:, -1] = ~m[0, :], ~m[-1, :], ~m[:, 0], ~m[:, -1]
    while True:
        grow = out.copy()
        grow[1:] |= out[:-1]
        grow[:-1] |= out[1:]
        grow[:, 1:] |= out[:, :-1]
        grow[:, :-1] |= out[:, 1:]
        grow &= ~m
        if (grow == out).all():
            return ~out
        out = grow


def spread(m, r, grow):
    """The mask grown (or shrunk) by r pixels, four-neighbour."""
    for _ in range(r):
        g = m.copy()
        for dst, src in (((slice(1, None),), (slice(None, -1),)), ((slice(None, -1),), (slice(1, None),)),
                         ((slice(None), slice(1, None)), (slice(None), slice(None, -1))), ((slice(None), slice(None, -1)), (slice(None), slice(1, None)))):
            if grow:
                g[dst] |= m[src]
            else:
                g[dst] &= m[src]
        m = g
    return m


def solid(m, r=3):
    """A figure's mask made solid: the outline's gaps of up to 2r pixels closed and the inside filled."""
    return spread(fill_holes(spread(m, r, True)), r, False) | m


def lineup(fronts, plates, heights_out, path):
    """Everybody from the standard camera, side by side: each figure cut from its own page by comparing it with that page's empty plate."""
    cam = LEVEL['std']
    x0, y0, w0, h0 = cam['crop']
    base = np.asarray(plates[None], dtype=np.int16)
    col = base[y0:y0 + h0, 180:181, :]                                            # the studio's middle column: gradient, floor line, no vignette at the edge
    tile = base[y0:y0 + h0, 148:212, :]                                           # 64 columns centred on it, tiled: the dither keeps its grain
    figs = []
    for who in ORDER:
        if who not in fronts:
            continue
        im, plate = np.asarray(fronts[who][0], dtype=np.int16), np.asarray(plates[fronts[who][1]], dtype=np.int16)
        m = np.abs(im - plate).sum(axis=2) > 24
        m = m[y0:y0 + h0]
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
        m = solid(m)                                                              # dark trousers on the dark studio barely differ from it
        cols = np.where(m.any(axis=0))[0]
        rows = np.where(m.any(axis=1))[0]
        if not len(cols):
            continue
        c0, c1 = max(0, cols[0] - 3), min(359, cols[-1] + 3)
        top = rows[0] + y0
        heights_out[who] = float(round(cam['y'] + (320 - top) / cam['ppm'], 2))
        figs.append((who, im[y0:y0 + h0, c0:c1 + 1], m[:, c0:c1 + 1]))
    # the 1 m bar, cut from the base page's plate
    bx0, bx1 = 40, 100
    bp = base[y0:y0 + h0, bx0:bx1]
    bm = np.abs(bp - col).sum(axis=2) > 60
    gap, lab_h = 18, 64
    width = (bx1 - bx0) + sum(f[1].shape[1] + gap for f in figs) + 40
    canvas = np.tile(tile, (1, -(-width // tile.shape[1]), 1))[:, :width].copy()
    canvas[:, 0:bx1 - bx0][bm] = bp[bm]
    x = bx1 - bx0 + 8
    places = []
    for who, im, m in figs:
        w = im.shape[1]
        canvas[:, x:x + w][m] = im[m]
        places.append((who, x, w))
        x += w + gap
    img = Image.fromarray(canvas.astype(np.uint8)).resize((width * SCALE, h0 * SCALE), Image.NEAREST)
    out = Image.new('RGB', (img.width, img.height + 60 + lab_h * SCALE // 2 + 30), BG)
    out.paste(img, (0, 60))
    d = ImageDraw.Draw(out)
    d.text((16, 12), 'The cast, front view, to scale (one camera, %d px per metre in the film\'s 360 x 640 frame)' % round(cam['ppm']), font=font(28), fill=INK)
    bar_top = 320 - (1 - cam['y']) * cam['ppm'] - y0
    d.text(((180 + cam['bar'] * cam['ppm'] - bx0 + 9) * SCALE, 60 + bar_top * SCALE - 15), '1 m', font=font(24), fill=INK)
    fl, fs = font(24), font(22)
    for who, xx, w in places:
        cx = (xx + w / 2) * SCALE
        name = SHORT.get(who, NAMES.get(who, who))
        for k, (txt, f, col_) in enumerate([(name, fl, INK), ('%.2f m' % heights_out[who], fs, DIM)]):
            tw = d.textlength(txt, font=f)
            d.text((cx - tw / 2, img.height + 70 + k * 32), txt, font=f, fill=col_)
    out.save(path)
    return out.size


def main():
    args = sys.argv[1:]
    S = subjects()
    want = [a for a in args if not a.startswith('--')] or [w for w in ORDER if w in S] + [w for w in S if w not in ORDER]
    for w in want:
        assert w in S, ('unknown figure', w, sorted(S))
    os.makedirs(OUT, exist_ok=True)
    pages = {}
    for w in want:
        pages.setdefault(S[w]['set'], []).append(w)
    shots, plates = {}, {}
    for page_set, whos in pages.items():
        cells = []
        for w in whos:
            cells += cells_for(w, S[w]['kind'])
        cells.append(dict(who=None, row=0, label='plate', cam=level_cam('std'), bar=LEVEL['std']['bar'], crop=LEVEL['std']['crop']))
        print('page %s: %s, %d cells' % (page_set or 'store', ' '.join(whos), len(cells)))
        frames = shoot(page_set, cells, [S[w]['js'] for w in whos])
        plates[page_set] = frames[-1]
        for c, im in zip(cells, frames):
            shots.setdefault(c['who'], []).append((c, im))
    if None not in plates:                                         # the lineup's bar and background come from the store page's plate
        plates[None] = next(iter(plates.values()))
    fronts, made = {}, []
    for w in want:
        info = dict(name=NAMES.get(w, w), src=S[w]['src'], notes=[])
        if S[w]['kind'] in ('human',):
            info['notes'].append('Built seated (that is how every episode uses it): here the legs are straightened, the arms let down%s.'
                                 % (', the laptop hidden' if w == 'buloy' else ''))
            if 'girl: true' in S[w]['src']:
                info['notes'].append('The skirt is a waist ring and two panels over a seated lap (src/lib/40-cast.js); they are hidden here, so the trouser legs show.')
            if w == 'rider':
                info['notes'].append('src/sets/baha.js adds the helmet, chin straps, box, stripes and the wet band, and hides his legs (he is in flood water); they are shown here.')
            if w == 'kap':
                info['notes'].append('src/sets/court.js then greys the hair, drops the bun and the fringe, and adds the polo collar and placket.')
        if S[w]['kind'] == 'nena':
            info['notes'].append('Built from the hips up (the store hides her legs); the legs and skirt are the ones src/sets/defense.js adds. Arms let down, fan hidden.')
        if S[w]['kind'] == 'claude':
            info['notes'].append('He has no face but the eyes, so the second row is the four eye states the director and the sets use, not expressions.')
        if S[w]['kind'] == 'cat':
            info['notes'].append('Turnaround in a relaxed stand. Poses: m.pose({ pose: "sit" }), loaf with blink 0.5, stand with ears 1, tail 1, pupil 0.85, and the loaf across Buloy\'s laptop.')
        row1, row2 = [], []
        for c, im in shots.get(w, []):
            if c['row'] == 1:
                tile = crop2(im, c['crop'])
                ImageDraw.Draw(tile).text(bar_label(c), '1 m', font=font(22), fill=INK)
                row1.append((c['label'], tile))
                if c['label'] == 'front' and c['level'] == 'std':
                    fronts[w] = (im, S[w]['set'])
            elif c['row'] == 2:
                row2.append((c['label'], crop2(im, c['crop'])))
            elif c['label'] == 'lineup':
                fronts[w] = (im, S[w]['set'])
        p = os.path.join(OUT, w + '.png')
        print(p, sheet(w, info, row1, row2, p))
        made.append(p)
    if len(want) == len(S):                                       # a lineup of only some of the cast would not be the cast
        heights = {}
        p = os.path.join(OUT, 'lineup.png')
        print(p, lineup(fronts, plates, heights, p))
        json.dump(heights, open(os.path.join(OUT, 'heights.json'), 'w', encoding='utf-8'), indent=1)
        print('heights (m):', heights)
    if '--keep' not in args:
        subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'build.py'), EP00], stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    main()
