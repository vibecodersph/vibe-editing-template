"""Measure every hand against every prop in an episode, and write close-ups to look at.

  python tools/qa.py <episode-dir> [--step 0.25] [--orbit] [--full] [--no-images] [--name <folder>] [--wait 240] [--frame-strict]

Builds the episode's page from its timeline.json (no audio work), opens it in headless Chrome, and lets the page's own QA hook
(src/lib/60-qa.js) seek through the film: every cut, the middle of every line, every keyed prop moment the set lists in SET.keys(),
and a sweep every --step seconds. At each moment it measures, in the real scene graph:

  pen    how far any hand part is inside any prop or surface            fails over 3 mm
  gap    how far a full grip's skin is from the prop it holds           fails over 4 mm
  rest   how far a resting prop is from what it lies on                 fails over 6 mm (or 5 mm into it)
  body   how far a prop is inside a head or torso                       fails over 5 mm
  wrist  the bend between forearm and hand on a full grip               fails over 80 degrees
  fore   how far a forearm's core is inside a prop                      fails over 10 mm
  also: a held prop with no hand on it, a visible prop nobody placed, a shown screen covered by its holder's hand,
  a see-through material on a prop or a hand, a translucent part of a figure within 22 cm of a holding hand.

Framing (the speaker, at every moment a caption shows; src/lib/60-qa.js qaFrame, docs/cinematography.md): prints FRAME FAIL and FRAME WARN lines
(time, line, shot, numbers), writes frame.json, and draws an overlay (face box, eye points, caption box, the phone app's safe lines) for each shot and
caption with a problem into frame/. FAIL: the speaker under 80 percent visible, both eyes hidden, the caption over more than 10 percent of the face box or
over an eye, the face centre outside the safe area. WARN: eye line outside 0.20 to 0.60 in a single, face under 0.08 of the height while speaking,
a 180-degree flip without "flip": true. Framing FAILs fail the run only when script.json has "cine": 1 or with --frame-strict; in an older episode the same findings print as
FRAME ADVICE lines (never FRAME FAIL), so a reader of the log, and tools/make.py, can tell a failure from advice.
Writes renders/review/<short>-qa/: report.json, props/ (one zoomed frame per held prop per keyed moment, from the shot camera's side),
hands/ (the same for a hand on a table, a podium or a thing lying there, at the set's keyed moments),
faces/ (one face close-up per spoken line), sheets of both, and with --orbit two more angles per prop in orbit/.
Exits 1 if anything failed. Leaves video/index.html alone (it works on video/qa.html and removes it).
"""
import base64
import functools
import http.server
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lab  # noqa: E402  (assemble: the scene code joined the way build.py joins it)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'video')
FONT = os.path.join(VIDEO, 'assets', 'fonts', 'Gelasio.ttf')


def find_chrome():
    """System Chrome on Windows, macOS or Linux; else the chrome-headless-shell HyperFrames or Puppeteer cached (any platform folder); else Playwright's Chromium; else whatever chrome, chromium or msedge is on the PATH."""
    import glob
    env = os.environ.get
    system = [os.path.join(env(k, ''), 'Google', 'Chrome', 'Application', 'chrome.exe') for k in ('ProgramFiles', 'ProgramFiles(x86)', 'LOCALAPPDATA') if env(k)]
    system += ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    cached = []
    for root in ('~/.cache/hyperframes/chrome', '~/.cache/puppeteer'):
        for exe in ('chrome-headless-shell', 'chrome-headless-shell.exe'):
            cached += sorted(glob.glob(os.path.join(os.path.expanduser(root), 'chrome-headless-shell', '*', '*', exe)))[-1:]       # the newest one cached
    cached += sorted(glob.glob('/opt/pw-browsers/chromium*/chrome-linux*/chrome') + glob.glob('/opt/pw-browsers/chromium*/chrome-linux*/headless_shell'))
    found = [p for p in map(shutil.which, ('chrome', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'msedge')) if p]
    return next((c for c in system + cached + found if os.path.exists(c)), None)


CHROME = find_chrome()


def page(ep, cfg):
    tl = json.load(open(os.path.join(ep, 'timeline.json'), encoding='utf-8'))
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    tl['capsQA'] = tl['caps']            # the page draws no captions (close-ups stay clean); the QA hook still checks where each would sit
    tl['caps'] = []
    import build
    if hasattr(build, 'page_extras'):            # image assets and inserts, embedded the way the film's own page has them
        tl = build.page_extras(tl, script, ep)
    html = open(os.path.join(ROOT, 'src', 'index.template.html'), encoding='utf-8').read()
    scene = lab.assemble(script.get('set'), ep)
    html = html.replace('__DUR__', str(tl['dur'])).replace('/*__TL__*/', json.dumps(tl, ensure_ascii=False)).replace('/*__SCENE__*/', scene)
    trap = ("window.addEventListener('error', (e) => fetch('/__qa/report', { method: 'POST', body: JSON.stringify({ error: (e.message || 'load error') + ' at line ' + e.lineno + ' of the page' }) })); "
            "window.addEventListener('unhandledrejection', (e) => fetch('/__qa/report', { method: 'POST', body: JSON.stringify({ error: String(e.reason && e.reason.stack || e.reason) }) })); ")
    html = html.replace('window.TL = ', trap + 'window.__timelines = window.__timelines || {}; window.QA_CFG = ' + json.dumps(cfg) + '; window.TL = ', 1)
    open(os.path.join(VIDEO, 'qa.html'), 'w', encoding='utf-8').write(html)


def sheet(files, out, cols=6, cell=(270, 480)):
    if not files:
        return []
    per, outs = cols * 3, []
    for n in range(0, len(files), per):
        chunk = files[n:n + per]
        rows = (len(chunk) + cols - 1) // cols
        im = Image.new('RGB', (cols * cell[0], rows * (cell[1] + 22)), (14, 10, 24))
        d = ImageDraw.Draw(im)
        for i, f in enumerate(chunk):
            t = Image.open(f).convert('RGB').resize(cell, Image.NEAREST)
            x, y = (i % cols) * cell[0], (i // cols) * (cell[1] + 22)
            im.paste(t, (x, y + 22))
            d.text((x + 4, y + 5), os.path.splitext(os.path.basename(f))[0][:44], fill=(240, 232, 255))
        o = f'{out}-{n // per + 1:02d}.jpg'
        im.save(o, quality=90)
        outs.append(o)
    return outs


def framing(ep, out, rep, frames, args):
    """The framing section: FRAME FAIL / FRAME WARN lines, frame.json, one overlay per problem shot. Returns the number of failure groups that count (0 when advisory)."""
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    tl = json.load(open(os.path.join(ep, 'timeline.json'), encoding='utf-8'))
    strict = bool(script.get('cine')) or '--frame-strict' in args
    spans = [(ln['s'], ln['e'], ln['i']) for ln in tl['lines']]
    line_of = lambda t: next((i for a, b, i in spans if a - 0.05 <= t <= b + 0.05), '-')
    rows = [f['frame'] for f in frames if f.get('frame')]
    json.dump({'strict': strict, 'limits': rep.get('frame'), 'moments': rows, 'flips': rep.get('flips', [])}, open(os.path.join(out, 'frame.json'), 'w', encoding='utf-8'), indent=1)
    print(f'framing: {len(rows)} moments with a speaker caption measured' + ('' if strict else ' (this episode is not "cine": 1, so what would fail prints as FRAME ADVICE and does not fail the run; --frame-strict makes it count)'))
    for w in rep.get('cineWarnings', []):
        print('CINE WARN ' + w)
    groups = {}
    for r in rows:
        for kind, msgs in (('FAIL' if strict else 'ADVICE', r['fails']), ('WARN', r['warns'])):
            for m in msgs:
                key = (kind, r['who'], r['shot'], line_of(r['t']), ''.join(c for c in m if not c.isdigit() and c not in '.,'))
                groups.setdefault(key, []).append((r, m))
    nfail = 0
    for (kind, who, shot, ln, _), v in sorted(groups.items(), key=lambda kv: kv[1][0][0]['t']):
        a, b = v[0][0], v[-1][0]
        nums = f'vis {a.get("vis")}, eye line {a.get("eyeLine")}, face height {a.get("faceH")}, caption over face {a.get("capOver")}, centre {a.get("centre")}'
        print(f'FRAME {kind} t={a["t"]:.2f}' + (f'..{b["t"]:.2f}' if b is not a else '') + f' ({len(v)} moments) line {ln} {who} shot={shot}: {v[0][1]}  [{nums}]')
        if kind == 'FAIL':
            nfail += 1
    for fl in rep.get('flips', []):
        print(f'FRAME WARN t={fl["t"]:.2f} shot={fl["shot"]}: {fl["msg"]}')
    # overlays: face box, eyes, caption box, the safe lines, on the frame the page drew (no captions in it)
    from PIL import ImageFont
    try:
        font = ImageFont.truetype(FONT, 30)
    except OSError:
        font = ImageFont.load_default()
    n = 0
    for r in rows:
        if not r.get('img'):
            continue
        f = os.path.join(out, r['img'] + '.png')
        if not os.path.exists(f):
            continue
        im = Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST)
        d = ImageDraw.Draw(im)
        d.line([(0, 250), (1080, 250)], fill=(255, 60, 60), width=3); d.line([(0, 1500), (1080, 1500)], fill=(255, 60, 60), width=3); d.line([(850, 960), (850, 1920)], fill=(255, 60, 60), width=3); d.line([(0, 960), (60, 960)], fill=(255, 60, 60), width=3)
        if r.get('face'):
            q = r['face']; d.rectangle([q['x0'], q['y0'], q['x1'], q['y1']], outline=(60, 255, 255), width=4)
        for e in r.get('eyePx') or []:
            if e:
                d.ellipse([e[0] - 12, e[1] - 12, e[0] + 12, e[1] + 12], outline=(255, 60, 220), width=4)
        if r.get('cap'):
            q = r['cap']; d.rectangle([q['x0'], q['y0'], q['x1'], q['y1']], outline=(255, 230, 60), width=4)
        if r.get('centre'):
            c = r['centre']; d.line([(c[0] - 20, c[1]), (c[0] + 20, c[1])], fill=(60, 255, 255), width=4); d.line([(c[0], c[1] - 20), (c[0], c[1] + 20)], fill=(60, 255, 255), width=4)
        y = 300
        for kind, msgs, col in (('FAIL', r['fails'], (255, 90, 90)), ('WARN', r['warns'], (255, 200, 80))):
            for m in msgs:
                d.text((16, y), f'{kind}: {m}', font=font, fill=col, stroke_width=3, stroke_fill=(10, 6, 20)); y += 40
        d.text((16, 16), f't {r["t"]:.2f}  {r["shot"]}  {r["who"]}', font=font, fill=(255, 255, 255), stroke_width=3, stroke_fill=(10, 6, 20))
        im.save(f); n += 1
    if n:
        print(f'  {n} overlays in {os.path.join(out, "frame")}')
    return nfail if strict else 0


def main():
    ep = os.path.abspath(sys.argv[1])
    args = sys.argv[2:]
    short = 'ep' + os.path.basename(ep).split('-')[0]
    name = args[args.index('--name') + 1] if '--name' in args else short + '-qa'
    out = os.path.join(ROOT, 'renders', 'review', name)
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    cfg = {'step': float(args[args.index('--step') + 1]) if '--step' in args else 0.25, 'orbit': '--orbit' in args, 'full': '--full' in args, 'images': '--no-images' not in args, 'debug': '--debug' in args}
    if '--only' in args:                          # --only 19.2,23.4: just these moments, with images (for a quick look while working)
        cfg['only'] = [float(v) for v in args[args.index('--only') + 1].split(',')]
    page(ep, cfg)
    got = {}

    class H(http.server.SimpleHTTPRequestHandler):
        def do_POST(self):
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            u = urllib.parse.urlparse(self.path)
            if u.path == '/__qa/img':
                f = os.path.join(out, urllib.parse.parse_qs(u.query)['name'][0] + '.png')
                os.makedirs(os.path.dirname(f), exist_ok=True)
                open(f, 'wb').write(base64.b64decode(body.split(b',', 1)[1]))
            else:
                got['report'] = json.loads(body)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')

        def log_message(self, *a):
            pass

    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=VIDEO))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    import hashlib                                # one Chrome profile per checkout, so two sessions can run QA at the same time
    prof = os.path.join(os.environ.get('TEMP', '/tmp'), 'kami-qa-profile-' + hashlib.md5(ROOT.lower().encode()).hexdigest()[:8])
    extra = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] if os.name != 'nt' else []
    if not CHROME:
        sys.exit('qa: no Chrome found: install Google Chrome, or run npx hyperframes@0.8.137 browser ensure')
    hl = [] if 'headless-shell' in CHROME or 'headless_shell' in CHROME else ['--headless=new']
    p = subprocess.Popen([CHROME] + hl + extra + ['--no-first-run', '--disable-extensions', '--user-data-dir=' + prof, '--enable-unsafe-swiftshader',
                          '--window-size=1080,1920', f'http://127.0.0.1:{srv.server_address[1]}/qa.html'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    wait = float(args[args.index('--wait') + 1]) if '--wait' in args else 240.0          # seconds to wait for the page: a slow cloud CPU needs more than the default at --step 0.1
    while 'report' not in got and time.time() - t0 < wait and p.poll() is None:
        time.sleep(0.25)
    p.terminate()
    srv.shutdown()
    try:
        os.remove(os.path.join(VIDEO, 'qa.html'))
    except OSError:
        pass
    rep = got.get('report')
    if not rep:
        sys.exit('qa: the page never reported (Chrome closed or timed out)')
    if 'error' in rep:
        sys.exit('qa: the page threw\n' + rep['error'])
    json.dump(rep, open(os.path.join(out, 'report.json'), 'w', encoding='utf-8'), indent=1)
    frames = rep['frames']
    full = os.path.join(out, 'full')
    if os.path.isdir(full):                       # --full frames get the caption drawn where the film puts it, and the phone-app safe lines
        from PIL import ImageFont
        try:
            font = ImageFont.truetype(FONT, 19)
        except OSError:
            font = ImageFont.load_default()
        for f in frames:
            name = os.path.join(full, f'{f["t"]:.2f}'.rjust(5, '0') + '-' + f['label'] + '.png')
            if not os.path.exists(name):
                continue
            im = Image.open(name).convert('RGB')
            d = ImageDraw.Draw(im)
            d.line([(0, 512), (360, 512)], fill=(255, 60, 60)); d.line([(315, 0), (315, 640)], fill=(255, 60, 60))
            if f.get('cap'):
                for k, ln in enumerate(f['cap']['text'].split(chr(10))):
                    w = d.textlength(ln, font=font)
                    d.text((180 - w / 2, f['cap']['top'] / 3 + k * 23), ln, font=font, fill=(255, 255, 255), stroke_width=2, stroke_fill=(18, 10, 34))
            im.save(name)
    if '--debug' in args:
        for f in frames:
            for n in f.get('notes', []):
                print(f['t'], n)
    bad = [f for f in frames if f['fails']]
    frame_fail = framing(ep, out, rep, frames, args)
    worst = {}
    for f in frames:
        for r in f['rows']:
            k = (r['hand'], r['prop'], r['kind'])
            w = worst.setdefault(k, {'pen': 0, 'gap': 0, 'wrist': 0, 'n': 0, 'tp': f['t'], 'tg': f['t']})
            w['n'] += 1
            if r['pen'] > w['pen']:
                w['pen'], w['tp'] = r['pen'], f['t']
            if r['kind'] in ('hold', 'nub') and r.get('full') and r['gap'] > w['gap']:
                w['gap'], w['tg'] = r['gap'], f['t']
            w['wrist'] = max(w['wrist'], r.get('wrist', 0))
    print(f'{os.path.basename(ep)}: {len(frames)} moments measured in {time.time() - t0:.0f} s; limits: pen 3 mm, gap 4 mm, rest 6 mm, body 5 mm, wrist 80 deg, forearm 10 mm')
    print(f'{"hand":<14}{"prop":<12}{"kind":<7}{"frames":>7}{"max pen mm":>12}{"at":>7}{"grip gap mm":>12}{"at":>7}{"wrist":>7}')
    for (h, pr, k), w in sorted(worst.items()):
        print(f'{h:<14}{pr:<12}{k:<7}{w["n"]:>7}{w["pen"]:>12.1f}{w["tp"]:>7.2f}{w["gap"]:>12.1f}{w["tg"]:>7.2f}{w["wrist"]:>7}')
    states = {}
    for f in frames:
        for s in f['state']:
            states.setdefault(s['prop'], set()).add(s['state'] + (' by ' + s['by'] if s.get('by') else '') + (' on ' + s['on'] if s.get('on') else ''))
    for k, v in sorted(states.items()):
        print(f'  {k}: ' + '; '.join(sorted(v)))
    for d, cols in (('props', 6), ('hands', 6), ('faces', 6), ('orbit', 6), ('full', 6), ('frame', 6)):
        fs = sorted(os.path.join(out, d, f) for f in os.listdir(os.path.join(out, d))) if os.path.isdir(os.path.join(out, d)) else []
        for o in sheet(fs, os.path.join(out, 'sheet-' + d), cols):
            print('  ' + o)
    if bad:
        if frame_fail:
            print(f'FRAME: {frame_fail} framing failure group(s) too (see above)')
        print(f'FAIL: {len(bad)} of {len(frames)} moments')
        seen = {}
        for f in bad:
            for m in f['fails']:
                key = ''.join(c for c in m if not c.isdigit() and c != '.')
                seen.setdefault(key, []).append((f['t'], m))
        for key, v in seen.items():
            print(f'  {len(v):>4} x  {v[0][1]}   (t {v[0][0]} .. {v[-1][0]})')
        sys.exit(1)
    print('PASS: 0 contact failures')
    if frame_fail:
        sys.exit(1)


if __name__ == '__main__':
    main()
