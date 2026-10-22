"""One command from script to checks, in the only safe order, stopping at the first red.

    python tools/make.py episodes/NN-slug [--cut v1] [--from STEP] [--to STEP] [--keep-going] [--dry-run] [--no-hear]
    python tools/make.py --selftest

Steps, in order (the names work with --from and --to):
  1  canon-pre  check_canon.py before the build (SKIP allowed)
  2  voiced     every script line has its clip in audio/manifest.json for its current text; nothing is voiced here
  3  build      build.py
  4  canon      check_canon.py again, timeline-dependent checks now run
  5  sound      soundcheck.py
  6  qa         qa.py --step 0.1 (one retry on "Failed to fetch"); a contact FAIL or a FRAME FAIL line stops (FRAME ADVICE and FRAME WARN lines do not)
  7  render     render.py; the three files must be newer than this step's start, and the upload copy within 1 LU of -14
  8  frames     qa.py every frame (--step 0.0333333 --no-images)
  9  hear       hear.py on the upload copy; under 90 percent of the script's words heard stops (--no-hear skips; no GEMINI_API_KEY skips too)
 10  look       frame 0 and a contact sheet every 2 s, for a person to look at

Writes renders/review/<episode>-<cut>-make/summary.md and summary.json, with each step's log beside them. The last
line is MAKE: PASS or MAKE: FAIL at <step> (<reason>). --keep-going runs on past a red step; the steps that need a
finished render are then skipped, never run on the old files. --dry-run prints the commands and writes nothing.
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import time
import traceback
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable
ENV = dict(os.environ, PYTHONUTF8='1', PYTHONIOENCODING='utf-8')
STEPS = ['canon-pre', 'voiced', 'build', 'canon', 'sound', 'qa', 'render', 'frames', 'hear', 'look']
RENDER_DEPENDENT = {'frames', 'hear', 'look'}     # skipped when the render of this run did not pass
NEEDS_UPLOAD = {'hear', 'look'}                   # with no render in this run, these read the upload copy already on disk
HEARD_FLOOR = 90.0                                # percent of the script's words heard in the mix (AGENTS: under 90, lower the bed)
LUFS_TARGET, LUFS_SLACK = -14.0, 1.0


def render_fresh(paths, since, rc):
    """(ok, reason): the render passed and every file was written at or after `since`, so none is left from an earlier cut."""
    if rc != 0:
        return False, f'render.py exit {rc}'
    stale = []
    for p in paths:
        if not os.path.exists(p):
            return False, f'{os.path.basename(p)} is missing'
        if os.path.getmtime(p) < since:
            stale.append(os.path.basename(p))
    if stale:
        return False, ', '.join(stale) + ' is older than the step'
    return True, 'fresh'


def parse_qa(text):
    """The verdict and maxima from qa.py's printed report."""
    out = {'contact': None, 'fail_line': '', 'frame_fails': 0, 'moments': None,
           'max_pen': None, 'max_gap': None, 'max_wrist': None}
    m = re.search(r'(\d+) moments measured', text)
    if m:
        out['moments'] = int(m.group(1))
    for line in text.splitlines():
        if line.startswith('PASS: 0 contact failures'):
            out['contact'] = 'PASS'
        elif line.startswith('FAIL: '):
            out['contact'], out['fail_line'] = 'FAIL', line.strip()
        elif line.startswith('FRAME FAIL'):                  # strict runs only: qa.py prints FRAME ADVICE for an episode without "cine": 1
            out['frame_fails'] += 1
        t = line.split()
        if len(t) == 9 and t[3].isdigit():                  # a row: hand prop kind frames pen at gap at wrist
            try:
                pen, gap, wrist = float(t[4]), float(t[6]), float(t[8])
            except ValueError:
                continue
            out['max_pen'] = max(pen, out['max_pen'] or 0.0)
            out['max_gap'] = max(gap, out['max_gap'] or 0.0)
            out['max_wrist'] = max(wrist, out['max_wrist'] or 0.0)
    return out


def parse_loudness(text):
    """(integrated LUFS, true peak dBFS) from the summary ffmpeg ebur128 prints at the end, or None."""
    i = re.search(r'Integrated loudness:\s*\n\s*I:\s+(-?[\d.]+) LUFS', text)
    tp = re.search(r'True peak:\s*\n\s*Peak:\s+(-?[\d.]+) dBFS', text)
    if not i or not tp:
        return None
    return float(i.group(1)), float(tp.group(1))


def selftest():
    import shutil as sh
    import tempfile
    fails = []

    def check(name, got, want):
        ok = got == want
        print(f"  {'ok  ' if ok else 'FAIL'} {name}" + ('' if ok else f'  (got {got!r}, want {want!r})'))
        if not ok:
            fails.append(name)

    tmp = tempfile.mkdtemp(prefix='make-selftest-')
    try:
        def touch(name, when=None):
            p = os.path.join(tmp, name)
            open(p, 'wb').write(b'x')
            if when is not None:
                os.utime(p, (when, when))
            return p

        since = time.time()
        old = since - 3600
        # the previous cut's files, an hour old, and this step's exit status 0
        stale = [touch('a.mp4', old), touch('a-upload.mp4', old), touch('a-phone.mp4', old)]
        check('stale files with exit 0 are not fresh', render_fresh(stale, since, 0)[0], False)
        check('the reason says the files are older', 'older' in render_fresh(stale, since, 0)[1], True)
        # this step's files, written after `since`
        fresh = [touch('b.mp4'), touch('b-upload.mp4'), touch('b-phone.mp4')]
        check('new files with exit 0 are fresh', render_fresh(fresh, since - 1, 0)[0], True)
        check('new files with exit 1 are not fresh', render_fresh(fresh, since - 1, 1)[0], False)
        check('one stale file of three is not fresh', render_fresh([fresh[0], fresh[1], stale[2]], since - 1, 0)[0], False)
        check('a missing file is not fresh', render_fresh(fresh + [os.path.join(tmp, 'nope.mp4')], since - 1, 0)[0], False)

        qa_ok = ('01-x: 120 moments measured in 80 s; limits: pen 3 mm, gap 4 mm, rest 6 mm, body 5 mm, wrist 80 deg, forearm 10 mm\n'
                 'hand          prop        kind     frames  max pen mm     at  grip gap mm     at   wrist\n'
                 'rhand         tray        hold         40         0.0   0.00         2.1   1.20      61\n'
                 'lhand         cup         nub          12         1.4   3.10         0.0   0.00      75.5\n'
                 '  tray: held by rhand\n'
                 'PASS: 0 contact failures\n')
        q = parse_qa(qa_ok)
        check('qa PASS line gives contact PASS', q['contact'], 'PASS')
        check('qa maxima are read from the table', (q['max_pen'], q['max_gap'], q['max_wrist']), (1.4, 2.1, 75.5))
        check('qa moments are read', q['moments'], 120)
        qa_bad = qa_ok.replace('PASS: 0 contact failures', 'FAIL: 3 of 120 moments\n  3 x  hand penetrates tray')
        check('qa FAIL line gives contact FAIL', parse_qa(qa_bad)['contact'], 'FAIL')
        check('a FRAME FAIL line is counted', parse_qa(qa_ok + 'FRAME FAIL t=4.20 hand off the cup\n')['frame_fails'], 1)
        advice = (qa_ok + 'framing: 80 moments with a speaker caption measured (this episode is not "cine": 1, so what would fail prints as FRAME ADVICE and does not fail the run; --frame-strict makes it count)\n'
                  'FRAME ADVICE t=3.25..4.00 (3 moments) line 2 claude shot=k_bclose: the speaker is 0 percent visible (under 80)  [vis 0]\n'
                  'FRAME WARN t=5.00 shot=k_two: the caption box (1455 to 1530 px) is outside 250 to 1500\n')
        check('FRAME ADVICE and FRAME WARN lines are not failures', parse_qa(advice)['frame_fails'], 0)
        check('a run with only advice still reads PASS', parse_qa(advice)['contact'], 'PASS')
        check('the strict header line is not a failure', parse_qa('framing: 5 moments with a speaker caption measured\nFRAME FAIL t=1.00 x\n' + qa_ok)['frame_fails'], 1)
        check('no verdict line gives contact None', parse_qa('Traceback\n')['contact'], None)

        # an anchor's marker cut (build.add_cut) must never own a frame: the renderer takes the LAST cut with t <= now, so at every time k/30 the real cut wins
        import build
        pick = lambda shots, t: next(c for c in reversed(shots) if c['t'] <= t)         # the loop in 50-direct.js and 60-qa.js: a later entry wins a tie
        landed = 0
        for ms in range(0, 60000):
            at = ms / 1000.0
            shots = [{'t': 0, 'shot': 'a'}]
            build.add_cut(shots, at, 'cine', anchor='k_read')
            build.add_cut(shots, at + 0.5, None, zoom=1.25)
            for k in range(max(0, int(at * 30) - 2), int(at * 30) + 3):
                if pick(shots, k / 30).get('marker'):
                    landed += 1
        check('no frame time k/30 lands on an anchor marker camera (60000 cut times)', landed, 0)
        old_landed = 0                                                                 # the old marker, 1 ms before the cut: some frame times did land on it
        for ms in range(0, 60000):
            at = ms / 1000.0
            old = [{'t': 0, 'shot': 'a'}, {'t': round(at - 0.001, 3), 'shot': 'k_read', 'marker': True}, {'t': round(at, 3), 'shot': 'cine'}]
            for k in range(max(0, int(at * 30) - 2), int(at * 30) + 3):
                if pick(old, k / 30).get('marker'):
                    old_landed += 1
        check('the old 1 ms marker did land on frame times (the bug this test guards)', 0 < old_landed < 60000, True)

        ebur = ('Summary:\n\n  Integrated loudness:\n    I:         -15.0 LUFS\n    Threshold: -25.6 LUFS\n\n'
                '  Loudness range:\n    LRA:         4.1 LU\n\n  True peak:\n    Peak:       -1.1 dBFS\n')
        check('loudness summary is read', parse_loudness(ebur), (-15.0, -1.1))
        check('a per-frame I line is not read', parse_loudness('I: -23.0 LUFS\n' + ebur)[0], -15.0)
    finally:
        sh.rmtree(tmp, ignore_errors=True)
    print('SELFTEST: ' + ('FAIL ' + ', '.join(fails) if fails else 'PASS'))
    return 1 if fails else 0


# ---- the commands, one place: the dry run and the real run both read these ----

def quote(argv):
    return ' '.join(f'"{a}"' if (' ' in a or not a) else a for a in argv)


def cmd_canon(c):
    return [PY, 'tools/check_canon.py', c['ep']]


def cmd_build(c):
    return [PY, 'tools/build.py', c['ep']]


def cmd_sound(c):
    return [PY, 'tools/soundcheck.py', c['ep']]


def cmd_qa(c):
    return [PY, 'tools/qa.py', c['ep'], '--step', '0.1']


def cmd_render(c):
    return [PY, 'tools/render.py', c['ep'], c['cut']]


def cmd_loudness(c):
    return ['ffmpeg', '-hide_banner', '-nostats', '-i', c['up'], '-af', 'ebur128=peak=true', '-f', 'null', '-']


def cmd_frames(c):
    return [PY, 'tools/qa.py', c['ep'], '--step', '0.0333333', '--no-images', '--wait', '900']      # a long every-frame run is slow: not a false red


def cmd_hear(c):
    return [PY, 'tools/hear.py', c['ep'], c['up']]


def cmd_frame0(c):
    return ['ffmpeg', '-v', 'error', '-y', '-i', c['up'], '-frames:v', '1', c['review'] + '/frame0.png']


def cmd_sheet(c):
    return [PY, 'tools/sheet.py', c['up'], c['review'] + '/sheet', '0.5', '8', '3']


def make_ctx(ep_arg, cut):
    ep_dir = os.path.abspath(os.path.join(ROOT, ep_arg))
    rel = os.path.relpath(ep_dir, ROOT).replace('\\', '/')
    ep = rel if not rel.startswith('..') else ep_dir.replace('\\', '/')
    name = os.path.basename(ep_dir.rstrip('/\\'))
    base = f'renders/{name}-{cut}.mp4'
    return {'ep': ep, 'ep_dir': ep_dir, 'name': name, 'cut': cut, 'base': base,
            'up': base.replace('.mp4', '-upload.mp4'), 'phone': base.replace('.mp4', '-phone.mp4'),
            'review': f'renders/review/{name}-{cut}-make'}


def plan_lines(c):
    """Step name -> the exact command lines (in-process work is described in brackets)."""
    return {
        'canon-pre': [quote(cmd_canon(c))],
        'voiced': ['[in process] every script line needs its clip in audio/manifest.json for its current text; voice.py is never run here'],
        'build': [quote(cmd_build(c))],
        'canon': [quote(cmd_canon(c))],
        'sound': [quote(cmd_sound(c))],
        'qa': [quote(cmd_qa(c))],
        'render': [quote(cmd_render(c)),
                   '[in process] the three files must be written after this step starts, and render.py must exit 0',
                   quote(cmd_loudness(c)) + '   (the upload copy within 1 LU of -14)'],
        'frames': [quote(cmd_frames(c))],
        'hear': [quote(cmd_hear(c))],
        'look': [quote(cmd_frame0(c)), quote(cmd_sheet(c))],
    }


# ---- running ----

def say(msg=''):
    print(msg, flush=True)


def last_line(text):
    lines = [x for x in text.splitlines() if x.strip()]
    return lines[-1].strip()[:200] if lines else ''


def run_cmd(c, step, argv, append=False):
    """Run one command in the repo root, pass its output through, keep it in the step's log."""
    t = time.time()
    logdir = os.path.join(ROOT, c['review'], 'logs')
    os.makedirs(logdir, exist_ok=True)
    log = os.path.join(logdir, step + '.log')
    say('  $ ' + quote(argv))
    p = subprocess.Popen(argv, cwd=ROOT, env=ENV, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    chunks = []
    for raw in p.stdout:
        sys.stdout.flush()
        sys.stdout.buffer.write(raw)
        sys.stdout.buffer.flush()
        chunks.append(raw.decode('utf-8', 'replace'))
    rc = p.wait()
    text = ''.join(chunks)
    with open(log, 'a' if append else 'w', encoding='utf-8') as f:
        f.write(('$ ' + quote(argv) + '\n') + text + f'\n[exit {rc}]\n')
    return rc, text, time.time() - t


def result(status, reason='', numbers=None, secs=0.0):
    return {'status': status, 'reason': reason, 'numbers': numbers or {}, 'seconds': round(secs, 1)}


def voiced_missing(ep_dir):
    script = json.load(open(os.path.join(ep_dir, 'script.json'), encoding='utf-8'))
    mpath = os.path.join(ep_dir, 'audio', 'manifest.json')
    man = {}
    if os.path.exists(mpath):
        man = {m['i']: m for m in json.load(open(mpath, encoding='utf-8')).get('lines', [])}
    missing = []
    for i, ln in enumerate(script['lines']):
        m = man.get(i)
        if (not m or m.get('text') != ln.get('text') or m.get('who') != ln.get('who') or m.get('say') != ln.get('say')      # as voice.py keeps a clip: same text, speaker and "say"
                or not os.path.exists(os.path.join(ep_dir, 'audio', m.get('file', f'line_{i:02d}.mp3')))):
            missing.append(i)
    return missing, len(script['lines'])


def step_voiced(c, step):
    missing, n = voiced_missing(c['ep_dir'])
    nums = {'script lines': n, 'without a clip': len(missing)}
    if missing:
        listed = ', '.join(str(i) for i in missing[:20]) + (' ...' if len(missing) > 20 else '')
        return result('FAIL', f'{len(missing)} of {n} lines have no clip for their current text (indices {listed}); '
                              'voicing is the lead\'s call: voice.py spends money and is never run here', nums)
    return result('PASS', '', nums)


def step_canon(c, step):
    rc, text, secs = run_cmd(c, step, cmd_canon(c))
    res = re.search(r'^RESULT: (PASS|FAIL)\s*$', text, re.M)
    counts = re.search(r'(\d+) PASS, (\d+) FAIL, (\d+) WARN, (\d+) SKIP', text)
    nums = dict(zip(['PASS', 'FAIL', 'WARN', 'SKIP'], counts.groups())) if counts else {}
    if rc == 0 and res and res.group(1) == 'PASS':
        return result('PASS', '', nums, secs)
    fails = re.findall(r'^\s+FAIL\s+(\S+)\s+(.*)$', text, re.M)
    why = '; '.join(f'{rule} {msg}' for rule, msg in fails[:3]) or f'exit {rc}, no RESULT line'
    return result('FAIL', f'check_canon: {why}', nums, secs)


def step_build(c, step):
    rc, text, secs = run_cmd(c, step, cmd_build(c))
    nums = {}
    dur = re.search(r'^duration .*$', text, re.M)
    loud = re.search(r'^loudness: .*$', text, re.M)
    if dur:
        nums['build'] = dur.group(0)[:160]
    if loud:
        nums['build loudness'] = loud.group(0)[:160]
    if rc == 0:
        return result('PASS', '', nums, secs)
    return result('FAIL', f'build.py exit {rc}: {last_line(text)}', nums, secs)


def step_sound(c, step):
    rc, text, secs = run_cmd(c, step, cmd_sound(c))
    rows = re.findall(r'^  (ok  |FAIL) (.{11}) (.*)$', text, re.M)
    nums = {name.strip(): val.strip() for _, name, val in rows}
    bad = [name.strip() for ok, name, _ in rows if ok == 'FAIL']
    if rc == 0 and rows and not bad:
        return result('PASS', '', nums, secs)
    if bad:
        return result('FAIL', 'soundcheck: ' + ', '.join(bad), nums, secs)
    return result('FAIL', f'soundcheck exit {rc}: {last_line(text)}', nums, secs)


def step_qa(c, step, argv):
    rc, text, secs = run_cmd(c, step, argv)
    retried = False
    if rc != 0 and 'Failed to fetch' in text:
        say('  "Failed to fetch": running it once more')
        rc, text, extra = run_cmd(c, step, argv, append=True)
        secs += extra
        retried = True
    v = parse_qa(text)
    nums = {'moments': v['moments'], 'max pen mm': v['max_pen'], 'max grip gap mm': v['max_gap'],
            'max wrist deg': v['max_wrist'], 'contact': v['contact'], 'frame fails': v['frame_fails'], 'retried': retried}
    if v['contact'] == 'FAIL':
        return result('FAIL', f'qa: {v["fail_line"]}', nums, secs)
    if v['frame_fails']:
        return result('FAIL', f'qa: {v["frame_fails"]} FRAME FAIL line(s)', nums, secs)
    if rc == 0 and v['contact'] == 'PASS':
        return result('PASS', '', nums, secs)
    return result('FAIL', f'qa exit {rc} with no verdict: {last_line(text)}', nums, secs)


def step_render(c, step):
    started = time.time()
    rc, text, secs = run_cmd(c, step, cmd_render(c))
    paths = [os.path.join(ROOT, p) for p in (c['base'], c['up'], c['phone'])]
    ok, why = render_fresh(paths, started, rc)
    if not ok:
        return result('FAIL', f'render failed; the files in renders/ are older than this step ({why})', {}, secs)
    rc2, text2, extra = run_cmd(c, step, cmd_loudness(c), append=True)
    secs += extra
    measured = parse_loudness(text2)
    if measured is None:
        return result('FAIL', 'loudness of the upload copy not measured', {}, secs)
    lufs, tp = measured
    nums = {'LUFS': lufs, 'true peak dBFS': tp}
    for p in paths:
        nums[os.path.basename(p) + ' MB'] = round(os.path.getsize(p) / 1e6, 1)
    if abs(lufs - LUFS_TARGET) > LUFS_SLACK:
        return result('FAIL', f'mix at {lufs} LUFS, outside -14 +- 1 LU', nums, secs)
    return result('PASS', '', nums, secs)


def step_hear(c, step):
    rc, text, secs = run_cmd(c, step, cmd_hear(c))
    m = re.search(r'mix: (\d+)/(\d+) script words heard', text)
    if rc != 0 or not m:
        return result('FAIL', f'hear.py exit {rc}, no mix line: {last_line(text)}', {}, secs)
    hit, want = int(m.group(1)), int(m.group(2))
    pct = 100.0 * hit / want if want else 0.0
    first = re.search(r'^first line: (.*)$', text, re.M)
    nums = {'heard': f'{hit}/{want} ({pct:.0f}%)', 'first line': first.group(1)[:80] if first else 'n/a'}
    if pct < HEARD_FLOOR:
        return result('FAIL', f'only {pct:.0f}% of the script\'s words heard in the mix (floor {HEARD_FLOOR:.0f})', nums, secs)
    return result('PASS', '', nums, secs)


def step_look(c, step):
    total = 0.0
    frame0_abs = os.path.join(ROOT, c['review'], 'frame0.png')
    for argv in (cmd_frame0(c), cmd_sheet(c)):
        rc, text, secs = run_cmd(c, step, argv, append=True)
        total += secs
        if rc != 0:
            return result('FAIL', f'{argv[0]} exit {rc}: {last_line(text)}', {}, total)
    sheets = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, c['review'], 'sheet-*.jpg')))
    if not os.path.exists(frame0_abs) or not sheets:
        return result('FAIL', 'frame 0 or the contact sheets were not written', {}, total)
    return result('PASS', '', {'frame 0': c['review'] + '/frame0.png', 'sheets': len(sheets), 'first sheet': sheets[0]}, total)


def run_step(c, step, state):
    if step == 'canon-pre' or step == 'canon':
        return step_canon(c, step)
    if step == 'voiced':
        return step_voiced(c, step)
    if step == 'build':
        return step_build(c, step)
    if step == 'sound':
        return step_sound(c, step)
    if step == 'qa':
        return step_qa(c, step, cmd_qa(c))
    if step == 'render':
        return step_render(c, step)
    if step == 'frames':
        return step_qa(c, step, cmd_frames(c))
    if step == 'hear':
        if not state['hear']:
            return result('SKIP', '--no-hear')
        import hear
        try:
            hear.key()                                   # exits with the one-line message when the key is in neither .env nor the environment
        except SystemExit:
            return result('SKIP', 'no GEMINI_API_KEY in .env')
        return step_hear(c, step)
    if step == 'look':
        return step_look(c, step)
    raise ValueError(step)


# ---- the summary ----

def write_summary(c, started, steps, results, verdict, reason, partial):
    d = os.path.join(ROOT, c['review'])
    os.makedirs(d, exist_ok=True)
    data = {'episode': c['ep'], 'cut': c['cut'], 'started': datetime.fromtimestamp(started).isoformat(timespec='seconds'),
            'result': verdict, 'failed_at': reason[0] if reason else None, 'reason': reason[1] if reason else '',
            'partial': partial, 'steps': []}
    for s in steps:
        r = results.get(s, result('NOT RUN'))
        data['steps'].append({'step': s, 'status': r['status'], 'reason': r['reason'], 'seconds': r['seconds'],
                              'numbers': r['numbers'], 'commands': plan_lines(c)[s]})
    with open(os.path.join(d, 'summary.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    rows = ['| # | step | status | seconds | key numbers | reason |', '|---|---|---|---|---|---|']
    for i, s in enumerate(data['steps'], 1):
        nums = '; '.join(f'{k} {v}' for k, v in s['numbers'].items()).replace('|', '/')
        rows.append(f"| {STEPS.index(s['step']) + 1} | {s['step']} | {s['status']} | {s['seconds']} | {nums} | {s['reason'].replace('|', '/')} |")
    cmds = [f"- **{s['step']}**" + ''.join(f'\n    - `{x}`' for x in s['commands']) for s in data['steps']]
    head = f"# make: {c['ep']} cut {c['cut']}\n\nStarted {data['started']}. " + \
           (f"MAKE: PASS" if verdict == 'PASS' else f"MAKE: FAIL at {reason[0]} ({reason[1]})")
    if partial:
        head += f' (partial run: {len(steps)} of {len(STEPS)} steps)'
    md = head + '\n\n' + '\n'.join(rows) + '\n\n## Commands\n\n' + '\n'.join(cmds) + \
         f'\n\nLogs: `{c["review"]}/logs/`\n'
    with open(os.path.join(d, 'summary.md'), 'w', encoding='utf-8') as f:
        f.write(md)
    return os.path.join(d, 'summary.md')


def usage(msg):
    print(msg, file=sys.stderr)
    print('usage: python tools/make.py episodes/NN-slug [--cut v1] [--from STEP] [--to STEP] [--keep-going] [--dry-run] [--no-hear]', file=sys.stderr)
    sys.exit(2)


def main(argv):
    if '--selftest' in argv:
        sys.exit(selftest())
    opts = {'--cut': 'v1', '--from': 'canon-pre', '--to': 'look'}
    flags = {'--keep-going', '--dry-run', '--no-hear'}
    pos, i = [], 0
    while i < len(argv):
        a = argv[i]
        if a in opts:
            if i + 1 >= len(argv):
                usage(f'{a} needs a value')
            opts[a] = argv[i + 1]
            i += 2
            continue
        if a in flags:
            i += 1
            continue
        if a.startswith('--'):
            usage(f'unknown option {a}')
        pos.append(a)
        i += 1
    if len(pos) != 1:
        usage('give one episode folder')
    if not re.fullmatch(r'[A-Za-z0-9._-]+', opts['--cut']):
        usage('--cut takes letters, digits, dot, dash or underscore')
    for k in ('--from', '--to'):
        if opts[k] not in STEPS:
            usage(f'{k} must be one of: {", ".join(STEPS)}')
    lo, hi = STEPS.index(opts['--from']), STEPS.index(opts['--to'])
    if lo > hi:
        usage('--from comes after --to')
    steps = STEPS[lo:hi + 1]
    c = make_ctx(pos[0], opts['--cut'])
    if not os.path.isdir(c['ep_dir']):
        usage(f'no such episode folder: {pos[0]}')
    keep_going, dry, hear = '--keep-going' in argv, '--dry-run' in argv, '--no-hear' not in argv
    partial = len(steps) != len(STEPS)

    if dry:
        say(f"make: {c['ep']} cut {c['cut']}: dry run, nothing runs and nothing is written")
        for n, s in enumerate(steps, 1):
            say(f'{STEPS.index(s) + 1:>2} {s}')
            for line in plan_lines(c)[s]:
                say('     ' + line)
        say('dry run: the steps above in order; hear is ' + ('on' if hear else 'off (--no-hear)'))
        sys.exit(0)

    # a real run starts from nothing: last run's review folder, logs and summary go before anything is checked
    shutil.rmtree(os.path.join(ROOT, c['review']), ignore_errors=True)
    started = time.time()
    say(f"make: {c['ep']} cut {c['cut']}: steps {steps[0]} to {steps[-1]}" + (' (keep going past red)' if keep_going else ''))
    results, first_red = {}, None
    render_in_run = 'render' in steps
    state = {'hear': hear}
    for s in steps:
        n = STEPS.index(s) + 1
        if first_red and not keep_going:
            results[s] = result('NOT RUN')
            continue
        if s in RENDER_DEPENDENT and render_in_run and results.get('render', {}).get('status') != 'PASS':
            results[s] = result('SKIP', 'the render of this run did not pass')
            continue
        note = ''
        if s in NEEDS_UPLOAD and not render_in_run:
            up = os.path.join(ROOT, c['up'])
            if not os.path.exists(up):
                results[s] = result('FAIL', f'no finished render at {c["up"]}: run the render step first')
                first_red = first_red or (s, results[s]['reason'])
                say(f'\n== {n:>2} {s}: FAIL: {results[s]["reason"]}')
                continue
            note = (f'this run did not render {c["up"]}; it is measured as it stands, last written '
                    f'{datetime.fromtimestamp(os.path.getmtime(up)).isoformat(timespec="seconds")}')
            say('  ' + note)
        say(f'\n== {n:>2} {s}')
        try:
            res = run_step(c, s, state)
        except Exception as e:
            res = result('FAIL', f'{type(e).__name__}: {e}'.strip(), {}, 0.0)
            say(''.join(traceback.format_exception_only(type(e), e)).rstrip())
        if note:
            res['numbers']['note'] = note
        results[s] = res
        say(f'  {res["status"]} ({res["seconds"]} s)' + (f': {res["reason"]}' if res['reason'] else ''))
        if res['status'] == 'FAIL' and first_red is None:
            first_red = (s, res['reason'])

    verdict = 'FAIL' if first_red else 'PASS'
    summary = write_summary(c, started, steps, results, verdict, first_red, partial)
    say(f'\nsummary: {summary}')
    if first_red:
        say(f'MAKE: FAIL at {first_red[0]} ({first_red[1]})')
        sys.exit(1)
    tail = f' (partial: steps {steps[0]} to {steps[-1]} only)' if partial else ''
    say(f'MAKE: PASS{tail}')
    sys.exit(0)


if __name__ == '__main__':
    main(sys.argv[1:])
