"""Render an expression sheet of Buloy in the close-up camera, from whatever is in src/lib right now.

  python tools/lab.py <name> [--cols 4] [--keep]

Builds video/index.html in lab mode: the film's own scene code, plus a hook that holds the light and camera
still (the 'vclose' shot, at a fixed moment of the default episode) and sets each cell's pose, so cells differ
only by the face and head. Snapshots every cell, crops the face, labels it, and writes renders/lab/<name>.png.
Afterwards the episode's own page is built back (skip with --keep to look at the lab page in a browser).

The hook is injected into the page by string replacement; nothing in src/ knows about it.
Pose keys: the acting keys (blink open smile brow gx gy, and the newer lid sad wet cheek pucker life),
yaw/pitch/roll for the head (radians, absolute), turn for the torso, and label.
"""
import json
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'video')
EP = os.path.join(ROOT, 'episodes', '00-legit-developer')
LAB_T = 34.65           # the moment the lab holds the page at, with the 'vclose' camera
FACE = 0.36             # head yaw that faces the close-up camera

POSES = [
    dict(label='neutral', yaw=FACE),
    dict(label='listening', yaw=FACE + 0.1, pitch=0.03, roll=0.03, brow=0.18, smile=0.12, gx=0.5, gy=-0.05),
    dict(label='soft smile', yaw=FACE, smile=0.55, cheek=0.8, brow=0.1),
    dict(label='sad brow', yaw=FACE, pitch=0.05, brow=-0.5, sad=0.9, lid=0.3, smile=-0.25),
    dict(label='eyes wet', yaw=FACE, pitch=0.04, brow=-0.3, sad=0.7, lid=0.35, wet=1.0, smile=-0.15),
    dict(label='looking down', yaw=FACE - 0.05, pitch=0.3, gy=1.0, gx=0.15, lid=0.45, brow=-0.1),
    dict(label='mouth open', yaw=FACE, open=0.85, brow=0.15),
    dict(label='mouth round', yaw=FACE, open=0.4, pucker=1.0),
    dict(label='mouth closed', yaw=FACE, smile=-0.05, lid=0.1),
    dict(label='three-quarter', yaw=FACE + 0.62, pitch=0.02, gx=-0.3, smile=0.1),
    dict(label='half blink', yaw=FACE, blink=0.6, lid=0.2),
    dict(label='profile-ish', yaw=FACE + 1.0, pitch=0.0, gx=-0.5),
]

YOUNG_POSES = [
    dict(label='neutral', yaw=FACE),
    dict(label='writing, look down', yaw=FACE - 0.05, pitch=0.34, gy=1.0, gx=0.1, lid=0.35, brow=-0.05),
    dict(label='soft smile', yaw=FACE, smile=0.55, cheek=0.8, brow=0.1),
    dict(label='laughing, mouth open', yaw=FACE, pitch=-0.04, open=0.95, smile=0.9, cheek=1.0, brow=0.3, lid=0.2),
    dict(label='listening', yaw=FACE + 0.1, pitch=0.03, roll=0.03, brow=0.18, smile=0.12, gx=0.5, gy=-0.05),
    dict(label='hopeful, look up', yaw=FACE, pitch=-0.2, gy=-1.0, brow=0.55, sad=0.3, smile=0.2),
]

FULL = 'crop_full'
CAMS = '''Object.assign(SHOTS, {
  lab_f: { p: [-0.55, 0.95, 3.7], l: [-0.55, 0.82, -0.9], fov: 32, d: [0, 0, 0] },
  lab_q: { p: [2.28, 0.95, 2.55], l: [-0.55, 0.82, -0.9], fov: 32, d: [0, 0, 0] },
  lab_s: { p: [-5.1, 0.95, -0.9], l: [-0.55, 0.82, -0.9], fov: 32, d: [0, 0, 0] },
  lab_bust: { p: [0.9, 1.05, 0.95], l: [-0.55, 0.9, -0.9], fov: 34, d: [0, 0, 0] },
  lab_shoe1: { p: [0.35, 0.16, 0.85], l: [-0.55, 0.1, -0.35], fov: 30, d: [0, 0, 0] },
  rv_nena: { p: [0.55, 1.38, 0.85], l: [-0.75, 1.3, 0.85], fov: 30, d: [0, 0, 0] },
  rv_nenaL: { p: [0.45, 1.0, 1.0], l: [-0.6, 0.95, 0.95], fov: 34, d: [0, 0, 0] },
  rv_bea: { p: [-0.1, 1.3, 0.95], l: [0.82, 1.2, 1.25], fov: 24, d: [0, 0, 0] },
  rv_fist: { p: [0.0, 1.38, 1.9], l: [-0.65, 1.35, 1.42], fov: 16, d: [0, 0, 0], near: 0.1 },
  rv_pass: { p: [0.2, 1.1, 1.6], l: [-0.6, 0.85, 0.7], fov: 30, d: [0, 0, 0], near: 0.1 },
  lab_shoe2: { p: [-1.5, 0.14, 0.7], l: [-0.55, 0.1, -0.4], fov: 30, d: [0, 0, 0] },
});
'''

SETS = {
    'fullbody': dict(cols=3, cell=(540, 960), poses=[
        dict(label='front', yaw=FACE - 0.36, shot='lab_f', crop=[0, 0, 1080, 1920]),
        dict(label='three-quarter', yaw=0.1, shot='lab_q', crop=[0, 0, 1080, 1920]),
        dict(label='side', yaw=0.55, shot='lab_s', crop=[0, 0, 1080, 1920])]),
    'hs': dict(cols=3, cell=(600, 700), poses=[
        dict(label='hoodie, two shot, laptop on', yaw=FACE, shot='two', crop=[60, 650, 900, 1050]),
        dict(label='three-quarter bust, laptop on', yaw=FACE + 0.3, shot='lab_bust', crop=[0, 280, 1080, 1260]),
        dict(label='shoes, low angle', yaw=FACE, shot='lab_shoe1', crop=[0, 360, 1080, 1260]),
        dict(label='hoodie, two shot, laptop away', yaw=FACE, shot='two', laptop=False, crop=[60, 650, 900, 1050]),
        dict(label='three-quarter bust, laptop away', yaw=FACE + 0.3, shot='lab_bust', laptop=False, crop=[0, 280, 1080, 1260]),
        dict(label='shoes, other side', yaw=FACE, shot='lab_shoe2', laptop=False, crop=[0, 360, 1080, 1260])]),
}

HOOK = r"""
window.LAB = {
  t: %(t)s, poses: %(poses)s,
  index(time) { const i = Math.floor(time); return i >= 0 && i < this.poses.length ? i : -1; },
  after(i, rig) {
    const p = this.poses[i], on = p.laptop !== false;
    laptop.visible = on;
    if (!on) for (const [a, k] of [[rig.armL, 1], [rig.armR, -1]]) {         // laptop away: hands rest on his thighs
      a.yaw.rotation.y = -0.1 * k; a.sh.rotation.x = -0.25; a.sh.rotation.z = 0.05 * k; a.el.rotation.x = -0.95; a.hand.rotation.z = 0; a.fingers.rotation.x = 0.3;
    }
  },
  apply(i, face, rig) {
    const p = this.poses[i], who = window.LABY && !window.LABBOTH ? window.LABY : null, def = { blink: 0, open: 0, smile: 0, brow: 0, gx: 0, gy: 0, lid: 0, sad: 0, wet: 0, cheek: 0, pucker: 0 };
    for (const k in def) face[k] = p[k] !== undefined ? p[k] : def[k];
    if (who) rig = who;
    rig.vHead.rotation.set(p.pitch || 0, p.yaw || 0, p.roll || 0);
    rig.vUpper.rotation.y = p.turn || 0;
    if (who) who.draw(face);
  },
};
"""


def font(size):
    try:
        return ImageFont.truetype(os.path.join(VIDEO, 'assets', 'fonts', 'Gelasio.ttf'), size)
    except OSError:
        return ImageFont.load_default()


def assemble(set_name, ep=None):
    """The scene code the way tools/build.py joins it: src/lib/*.js in name order, with the named set (src/sets/<name>.js) just before the director,
    and the episode's own stage.js (episodes/NN-slug/stage.js, when ep is given) right after the set."""
    import build
    return build.assemble_scene({'set': set_name} if set_name else {}, ep)


def ep_sheet(args):
    """python tools/lab.py <name> --ep 02-baka-tao-baka-ako --times 1,2,3 [--labels a,b,c] [--force-shot nenaface] [--crop x,y,w,h] [--cell 360x640] [--cols 5]
    Builds the real episode's scene (its own timeline, acts and props, no audio work) and snapshots the given moments into one sheet.
    --force-shot replaces the camera cuts with one shot, so a close-up of a face can be taken at any moment of the real acting.
    --eyes a,b,c gives Claude's eye shape (neutral flat dot soft sad wide squint side-l side-r happy closed) at each moment, in the order of --times.
    --shots and --force-shot take grammar strings too (cu:buloy, pov:claude, two, ...): the cinematographer solves them at the moment itself."""
    name = sys.argv[1]
    ep = os.path.join(ROOT, 'episodes', args[args.index('--ep') + 1])
    times = [float(v) for v in args[args.index('--times') + 1].split(',')]
    labels = args[args.index('--labels') + 1].split(',') if '--labels' in args else [str(v) for v in times]
    tl = json.load(open(os.path.join(ep, 'timeline.json'), encoding='utf-8'))
    if '--shots' in args:              # one camera per moment, same order as --times, the real acting kept
        names = args[args.index('--shots') + 1].split(',')
        tl['forceAt'] = {str(v): names[i] for i, v in enumerate(times)}
    elif '--force-shot' in args:
        tl['forceAt'] = {str(v): args[args.index('--force-shot') + 1] for v in times}
    if '--eyes' in args:                 # Claude's eye shape at each moment, in the order of --times
        shapes = args[args.index('--eyes') + 1].split(',')
        tl['forceEyes'] = {str(v): shapes[i] for i, v in enumerate(times)}
    if '--caps' not in args:
        tl['caps'] = []
    html = open(os.path.join(ROOT, 'src', 'index.template.html'), encoding='utf-8').read()
    lib = os.path.join(ROOT, 'src', 'lib')
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    import build                                        # the episode's image assets and inserts, embedded as build.py embeds them
    tl = build.page_extras(tl, script, ep)
    scene = assemble(script.get('set'), ep)
    html = html.replace('__DUR__', str(tl['dur'])).replace('/*__TL__*/', json.dumps(tl, ensure_ascii=False)).replace('/*__SCENE__*/', scene)
    html = build.fill_card(html)                        # the card's logo, handle and credit chip, from series.json
    msg = script.get('end_message')                     # the card shows this episode's own closing sentence, as build.py writes it
    if msg:
        import html as html_mod, re
        msg = [msg] if isinstance(msg, str) else list(msg)
        spans = ''.join('<span>' + html_mod.escape(m) + '</span>' for m in msg)
        html = re.sub(r'<!--ENDLINE-->.*?<!--/ENDLINE-->', lambda _: spans, html, flags=re.S)
    open(os.path.join(VIDEO, 'index.html'), 'w', encoding='utf-8').write(html)
    snaps = os.path.join(VIDEO, 'snapshots')
    shutil.rmtree(snaps, ignore_errors=True)
    subprocess.check_call('npx --yes hyperframes@0.8.137 snapshot --at ' + ','.join(str(v) for v in times) + ' --no-end --describe false', cwd=VIDEO, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frames = [f for f in sorted(os.listdir(snaps)) if f.startswith('frame-')]
    assert len(frames) == len(times), (len(frames), len(times))
    crop = [int(v) for v in args[args.index('--crop') + 1].split(',')] if '--crop' in args else [0, 0, 1080, 1920]
    cw, ch = [int(v) for v in args[args.index('--cell') + 1].split('x')] if '--cell' in args else (360, 640)
    cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 5
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cw, rows * (ch + 30)), (14, 10, 24))
    d = ImageDraw.Draw(sheet); f = font(22)
    os.makedirs(os.path.join(ROOT, 'renders', 'lab'), exist_ok=True)
    keep = os.path.join(ROOT, 'renders', 'review', name) if '--save' in args else None
    if keep: os.makedirs(keep, exist_ok=True)
    for i, fr in enumerate(frames):
        im = Image.open(os.path.join(snaps, fr)).convert('RGB')
        if im.size != (1080, 1920): im = im.resize((1080, 1920), Image.NEAREST)
        x, y, w, h = crop
        tile = im.crop((x, y, x + w, y + h)).resize((cw, ch), Image.LANCZOS)
        sheet.paste(tile, ((i % cols) * cw, (i // cols) * (ch + 30) + 30)); d.text(((i % cols) * cw + 6, (i // cols) * (ch + 30) + 4), labels[i], font=f, fill=(240, 232, 255))
        if keep: im.save(os.path.join(keep, labels[i] + '.png'))
    out = os.path.join(ROOT, 'renders', 'lab', name + '.png')
    sheet.save(out); print(out, sheet.size)


def main():
    if '--ep' in sys.argv:
        return ep_sheet(sys.argv[1:])
    name = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'buloy-expressions'
    args = sys.argv[1:]
    young = '--young' in args or '--both' in args
    if '--young' in args:
        POSES[:] = YOUNG_POSES
    cfg = None
    if '--set' in args:
        cfg = SETS[args[args.index('--set') + 1]]
        POSES[:] = cfg['poses']
    if '--only' in args:
        POSES[:] = POSES[int(args[args.index('--only') + 1]):][:1]
    cols = int(args[args.index('--cols') + 1]) if '--cols' in args else (cfg['cols'] if cfg else 4)
    crop = [int(v) for v in args[args.index('--crop') + 1].split(',')] if '--crop' in args else [130, 470, 650, 940]

    tl = json.load(open(os.path.join(EP, 'timeline.json'), encoding='utf-8'))
    n = len(POSES)
    shot = args[args.index('--shot') + 1] if '--shot' in args else 'vclose'
    tl.update(shots=[{'t': round(LAB_T - 0.5, 3), 'shot': shot}], caps=[], end={'s': tl['dur'] + 9, 'e': tl['dur'] + 9})
    tl['lines'] = [{'i': 0, 'who': 'viron', 's': 900, 'e': 901, 'act': ''}]
    html = open(os.path.join(ROOT, 'src', 'index.template.html'), encoding='utf-8').read()
    lib = os.path.join(ROOT, 'src', 'lib')
    scene = chr(10).join(open(os.path.join(lib, f), encoding='utf-8').read() for f in sorted(os.listdir(lib)) if f.endswith('.js'))
    a = 'const t = Math.max(0, Math.min(TL.dur, time || 0));'
    b = 'drawBuloy(face); faceTex.needsUpdate = true;'
    assert a in scene and b in scene
    scene = scene.replace(a, 'const LABI = window.LAB ? window.LAB.index(time) : -1; const t = LABI >= 0 ? window.LAB.t : Math.max(0, Math.min(TL.dur, time || 0));')
    sh_a = 'const sh = SHOTS[cut.shot] || SHOTS.hero;'
    c_a = '  drawScreen(t, 0.4); scrTex.needsUpdate = true;'
    assert sh_a in scene and c_a in scene
    scene = scene.replace(sh_a, 'const sh = (LABI >= 0 && window.LAB.poses[LABI].shot ? SHOTS[window.LAB.poses[LABI].shot] : null) || SHOTS[cut.shot] || SHOTS.hero;')
    scene = scene.replace(c_a, c_a + ' if (LABI >= 0) window.LAB.after(LABI, { armL, armR });')
    scene = scene.replace('// ---------- acting ----------', CAMS + '// ---------- acting ----------')
    scene = scene.replace(b, 'if (LABI >= 0) window.LAB.apply(LABI, face, { vHead, vUpper, armL, armR }); ' + b)
    if young:
        at = '[-0.1, 0, benchZ]' if '--both' in args else '[-0.55, 0, benchZ]'
        make = ('window.LABY = makeBuloy({ young: true, at: ' + at + ' }); ' + ('window.LABBOTH = true; ' if '--both' in args else 'V.position.x = 40; ') + chr(10))
        assert '// ---------- acting ----------' in scene
        scene = scene.replace('// ---------- acting ----------', make + '// ---------- acting ----------')
    scene = HOOK % dict(t=LAB_T, poses=json.dumps(POSES)) + scene
    html = html.replace('__DUR__', str(tl['dur'])).replace('/*__TL__*/', json.dumps(tl, ensure_ascii=False)).replace('/*__SCENE__*/', scene)
    open(os.path.join(VIDEO, 'index.html'), 'w', encoding='utf-8').write(html)

    snaps = os.path.join(VIDEO, 'snapshots')
    shutil.rmtree(snaps, ignore_errors=True)
    at = ','.join(str(i + 0.5) for i in range(n))
    subprocess.check_call('npx --yes hyperframes@0.8.137 snapshot --at ' + at + ' --no-end --describe false', cwd=VIDEO, shell=True,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frames = [f for f in sorted(os.listdir(snaps)) if f.startswith('frame-')]
    assert len(frames) == n, (len(frames), n)
    x, y, w, h = crop
    cell_w, cell_h = (cfg['cell'] if cfg else (w, h))[0], (cfg['cell'] if cfg else (w, h))[1] + 44
    rows = (n + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell_w, rows * cell_h), (14, 10, 24))
    d = ImageDraw.Draw(sheet)
    f = font(28)
    os.makedirs(os.path.join(ROOT, 'renders', 'lab'), exist_ok=True)
    for i, fr in enumerate(frames):
        im = Image.open(os.path.join(snaps, fr)).convert('RGB')
        if im.size != (1080, 1920):
            im = im.resize((1080, 1920), Image.NEAREST)
        if i == 0:
            im.save(os.path.join(ROOT, 'renders', 'lab', name + '-full0.png'))
        cx, cy = (i % cols) * cell_w, (i // cols) * cell_h
        px, py, pw, ph = POSES[i].get('crop', crop)
        sheet.paste(im.crop((px, py, px + pw, py + ph)).resize((cell_w, cell_h - 44), Image.NEAREST if pw == cell_w else Image.LANCZOS), (cx, cy + 44))
        d.text((cx + 12, cy + 6), POSES[i]['label'], font=f, fill=(240, 232, 255))
    out = os.path.join(ROOT, 'renders', 'lab', name + '.png')
    sheet.save(out)
    print(out, sheet.size)

    if '--keep' not in args:
        subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'build.py'), EP], stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    main()
