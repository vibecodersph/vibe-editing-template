"""Turn an episode's script and voice clips into a renderable HyperFrames project.

  python tools/build.py <episode-dir>

Reads script.json and audio/manifest.json (from voice.py). Writes:
  video/assets/audio/mix.mp3   dialogue, music, ambience and effects, mastered
  video/index.html             template + timeline data + scene code, one file
  <episode>/timeline.json      the same timeline, for reading
  <episode>/audio/stems/       dialogue.wav, music.wav, ambience.wav, sfx.wav

Two optional script.json keys bring an episode's own pictures in (src/lib/49-assets.js has the set-code side):
  "assets":  {"name": "assets/file.png"}          embedded in the page as raw pixels, so a set gets them as textures on frame 0
  "inserts": [{"at": {...}, "dur": 1.2, "asset": "name", "layout": "full" | "pip"}]   a picture over the film at a moment ("at" as for sfx)

Cinematography keys (src/lib/51-cine.js, docs/cinematography.md):
  "cine": 1                the episode is directed by the virtual cinematographer (default eyeline; the framing QA is enforced)
  "cine_shots": {"name": spec}   named shot specs a line's "shot" may use; "cine_look": {fog, key, keyI, rim, rimI}
  line "shot": "cu:buloy" | "pov:claude" | "ots:claude" | "two" | "insert:laptop" ... (a grammar string: no camera table needed)
  line "eyes": "sad", "eye_cuts": [{"word": 3, "eyes": "dot"}]   Claude's eye shape; line "look": "screen" | "lens" | "down"
  cuts / pre_cuts entries: {"zoom": 1.25} is a punch-in on the shot that is on screen (no "shot" needed); {"anchor": "k_read"} also names the
  cut for a set that keys on shot names ("shot_anchor" and "pre_anchor" on the line do the same for its own cuts)
  "gap": seconds between lines (default 0.32)
If episodes/NN-slug/stage.js exists it is joined into the page right after the set file.

The timeline is the real voice: every cut, caption, mouth movement and sound effect is placed
from the measured clip lengths and word timings, so nothing is retimed afterwards.

Audio is staged by measurement, since nobody listens during a build: the dialogue's level is
measured first, and music, ambience and effects are set a fixed number of decibels under it.
"""
import html as html_mod
import json
import math
import os
import re
import shutil
import subprocess
import sys

FPS = 30
LEAD, GAP = 0.12, 0.32         # GAP is the default silence between lines; script.json "gap" changes it for one episode
EYE_SHAPES = ('neutral', 'flat', 'dot', 'soft', 'sad', 'wide', 'squint', 'side-l', 'side-r', 'happy', 'closed')    # Claude's eyes (src/lib/51-cine.js)
TARGET_LUFS = -14.0             # the finished mix's integrated loudness
TARGET_DIALOGUE = -16.0         # mix 2: every voiced line is gained to this integrated loudness (LUFS) before the mix
PEAK_CEIL = -3.5                # mix 2: each gained line is limited to this peak (dBFS), so no one syllable decides how loud the master can be
BED_MIN = 16.0                  # mix 2: the bed under speech sits at least this far under the dialogue (tools/soundcheck.py fails under 15)
PAGE_WHO = {'buloy': 'viron'}   # a line may say who "buloy"; the page, its mouth and the QA know him by the internal id "viron"
HOLD, CARD = 1.25, 2.9          # the beat after the last line, then the closing card: locked, every episode ends on the same card
END_CHARS = 24             # widest closing-card line that still fits at 78 px
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'video')


def fill_card(html):
    """Fill the page's closing-card slots with the logo, handle and credit chip from series.json "card", HTML-escaped; a null or missing field leaves its element out."""
    path = os.path.join(ROOT, 'series.json')
    card = (json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}).get('card') or {}
    cr = card.get('credit') or {}
    e = lambda v: html_mod.escape(str(v), quote=True)
    who = ''.join(f'<div class="{c}">{e(cr[k])}</div>' for c, k in (('name', 'name'), ('ig', 'handle')) if cr.get(k))
    chip = (f'<img id="endavatar" src="{e(cr["avatar"])}" alt="" />' if cr.get('avatar') else '') + (f'<div class="who">{who}</div>' if who else '')
    slots = {
        'ENDLOGO': f'<div id="endlogo"><img src="{e(card["logo"])}" alt="" /></div>' if card.get('logo') else '',
        'ENDHANDLE': f'<div id="endhandle">{e(card["handle"])}</div>' if card.get('handle') else '',
        'ENDCREDIT': (f'<div id="endby"><span>{e(cr["label"])}</span></div>' if cr.get('label') else '') + (f'<div id="endchip"><div id="chip">{chip}</div></div>' if chip else ''),
    }
    for name, frag in slots.items():
        html = re.sub(f'<!--{name}--><!--/{name}-->', lambda _: frag, html)
    return html


def run(cmd):
    subprocess.check_call(cmd)


def pcm(path, rate=16000):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(rate), '-f', 's16le', '-'])
    import array
    a = array.array('h')
    a.frombytes(raw)
    return a, rate


def envelope(path):
    """Loudness per video frame, 0..1, for the mouth."""
    a, rate = pcm(path)
    hop = rate // FPS
    out = []
    for i in range(0, len(a), hop):
        w = a[i:i + hop]
        out.append((sum(x * x for x in w) / max(1, len(w))) ** 0.5)
    top = sorted(out)[int(len(out) * 0.92)] or 1.0
    return [min(1.0, v / top) for v in out]


def levels(path, ss=None, t=None):
    """(mean dB, peak dB) of a file or a stretch of it."""
    cmd = ['ffmpeg', '-hide_banner', '-nostats']
    if ss is not None:
        cmd += ['-ss', str(ss)]
    if t is not None:
        cmd += ['-t', str(t)]
    cmd += ['-i', path, '-af', 'volumedetect', '-f', 'null', '-']
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    mean = float(re.search(r'mean_volume: (-?[\d.]+)', err).group(1))
    peak = float(re.search(r'max_volume: (-?[\d.]+)', err).group(1))
    return mean, peak


KEEP = {('thank', 'you')}       # word pairs a caption never breaks between; script.json "keep_together": [["a", "b"]] adds its own


def glued(a, b):
    """True when a caption must not end on word a with word b starting the next one."""
    k = lambda w: re.sub(r"[^a-z0-9]", '', w['w'].lower())
    return (k(a), k(b)) in KEEP


def resplit(sent, limit=26):
    """Fewest contiguous parts of a sentence that each fit on one caption line, as even as possible; a comma is a good place to break."""
    from itertools import combinations
    n = len(sent)
    for k in range(2, n + 1):
        best = None
        for cuts in combinations(range(1, n), k - 1):
            parts = [sent[a:b] for a, b in zip((0,) + cuts, cuts + (n,))]
            lens = [len(' '.join(x['w'] for x in part)) for part in parts]
            if max(lens) > limit:
                continue
            score = (max(lens) - min(lens)) - 6 * sum(1 for part in parts[:-1] if part[-1]['w'].endswith(','))
            score += 8 * sum(1 for a, b in zip(parts, parts[1:]) if glued(a[-1], b[0]))
            if best is None or score < best[0]:
                best = (score, parts)
        if best:
            return best[1]
    return [[w] for w in sent]


def captions(line, start):
    """Break a line into short phrases, each with its spoken window. A sentence is never split
    across a caption with the next one; a long sentence is cut into even parts, at a comma if it can."""
    sents, cur = [], []
    for w in line['words']:
        cur.append(w)
        if re.search(r'[.?!]$', w['w']):
            sents.append(cur)
            cur = []
    if cur:
        sents.append(cur)
    chunks = []
    for sent in sents:
        text = ' '.join(x['w'] for x in sent)
        parts = -(-len(text) // 26)
        while parts > 1 and len(sent) > 1:
            target, acc, best = len(text) / parts, 0, None
            for k, w in enumerate(sent[:-1]):
                acc += len(w['w']) + 1
                score = abs(acc - target) - (6 if w['w'].endswith(',') else 0) + (8 if glued(w, sent[k + 1]) else 0)
                if best is None or score < best[0]:
                    best = (score, k + 1)
            chunks.append(sent[:best[1]])
            sent = sent[best[1]:]
            text = ' '.join(x['w'] for x in sent)
            parts -= 1
        chunks.append(sent)
    fixed = []
    for c in chunks:                                  # a chunk that would wrap: split its whole sentence again
        if len(' '.join(x['w'] for x in c)) > 26 and len(c) > 2:
            fixed.extend(resplit(c))
        else:
            fixed.append(c)
    chunks = fixed
    out = []
    for k, c in enumerate(chunks):
        end = chunks[k + 1][0]['s'] if k + 1 < len(chunks) else line['dur'] + 0.2
        out.append({'s': round(start + c[0]['s'] - 0.04, 3), 'e': round(start + end - 0.04, 3), 'who': PAGE_WHO.get(line['who'], line['who']),
                    'text': ' '.join(x['w'] for x in c).rstrip(','), 'raw': ' '.join(x['w'] for x in c)})
    return out


MARKS = {}                      # script.json "marks", resolved to seconds in main()


def anchor(at, lines, man, end_s):
    """A moment on the timeline: {t} | {line, word?, edge?, offset?} | {card, offset?}. Sound effects, music cues and picture inserts all use it."""
    if 't' in at:
        return at['t']
    if 'mark' in at:                               # a named moment from script.json "marks" (the set reads the same one as TL.marks.<name>)
        return MARKS[at['mark']] + at.get('offset', 0.0)
    if 'card' in at:
        return end_s + at.get('offset', 0.0)
    ln = lines[at['line']]
    if 'word' in at:
        w = man[at['line']]['words'][at['word']]
        base = ln['s'] + (w['e'] if at.get('edge') == 'end' else w['s'])
    else:
        base = ln['e'] if at.get('edge') == 'end' else ln['s']
    return base + at.get('offset', 0.0)


def embed_assets(script, ep):
    """script.json "assets": {"name": "assets/file.png" | {"file": ..., "max": 512}} -> {"name": {w, h, c, d}} for the page.
    Each image is decoded here, scaled so its longer side is at most "max" pixels, flipped bottom row first (the order a texture wants)
    and written as raw RGB or RGBA bytes in base64: the page makes a texture from them at once, with nothing to fetch or decode
    (src/lib/49-assets.js)."""
    out = {}
    if not script.get('assets'):
        return out
    import base64
    from PIL import Image
    for name, spec in script['assets'].items():
        spec = {'file': spec} if isinstance(spec, str) else dict(spec)
        path = spec['file'] if os.path.isabs(spec['file']) else os.path.join(ep, spec['file'])
        if not os.path.exists(path):
            sys.exit(f'assets: {name}: no file {path}')
        im = Image.open(path)
        alpha = im.mode in ('RGBA', 'LA', 'P') and im.convert('RGBA').getextrema()[3][0] < 255
        im = im.convert('RGBA' if alpha else 'RGB')
        cap = int(spec.get('max', 512))
        if max(im.size) > cap:
            k = cap / max(im.size)
            im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        im = im.transpose(Image.FLIP_TOP_BOTTOM)
        out[name] = {'w': im.width, 'h': im.height, 'c': 4 if alpha else 3, 'd': base64.b64encode(im.tobytes()).decode('ascii')}
    return out


def place_inserts(script, lines, man, end_s, assets=None):
    """script.json "inserts": [{"at": {...}, "dur": 1.2, "asset": "name", "layout": "full" | "pip"}] -> [{s, e, asset, layout}]."""
    out = []
    for k in script.get('inserts', []):
        if k['asset'] not in script.get('assets', {}):
            sys.exit(f'inserts: no asset named {k["asset"]} in "assets"')
        if k.get('layout', 'full') not in ('full', 'pip'):
            sys.exit(f'inserts: layout must be "full" or "pip", got {k["layout"]}')
        s = max(0.0, anchor(k['at'], lines, man, end_s))
        out.append({'s': round(s, 3), 'e': round(s + float(k.get('dur', 1.2)), 3), 'asset': k['asset'], 'layout': k.get('layout', 'full')})
    return out


def page_extras(tl, script, ep):
    """The timeline as the page gets it: the same, plus the episode's embedded images (too big for timeline.json) and its inserts.
    tools/lab.py and tools/qa.py call this too, so a review page has the same pictures as the film."""
    out = dict(tl)
    assets = embed_assets(script, ep)
    if assets:
        out['assets'] = assets
    if script.get('inserts') and 'inserts' not in out:           # a timeline.json written before the inserts were added
        man = {m['i']: m for m in json.load(open(os.path.join(ep, 'audio', 'manifest.json'), encoding='utf-8'))['lines']}
        out['inserts'] = place_inserts(script, tl['lines'], man, tl['end']['s'])
    return out


def mix_audio(ep, script, lines, man, placed, dur, end_s):
    """Build the four stems and the mastered mix. Returns the list of placed effects, for the log."""
    cfg = script.get('audio', {})
    stems = os.path.join(ep, 'audio', 'stems')
    os.makedirs(stems, exist_ok=True)
    src = lambda p: p if os.path.isabs(p) else os.path.join(ROOT, p)
    when = lambda at: anchor(at, lines, man, end_s)

    # 1. dialogue
    dlg = os.path.join(stems, 'dialogue.wav')
    cmd, filt, tags = ['ffmpeg', '-v', 'error', '-y'], [], []
    for k, (path, s, _, g) in enumerate(placed):
        cmd += ['-i', path]
        filt.append(f'[{k}:a]aresample=44100,volume={g:.2f}dB,adelay={int(s * 1000)}:all=1[d{k}]')      # g: a line's own gain in dB (script.json "gain"), 0 by default
        tags.append(f'[d{k}]')
    filt.append(f'{"".join(tags)}amix=inputs={len(placed)}:normalize=0,apad=whole_dur={dur}[out]')
    run(cmd + ['-filter_complex', ';'.join(filt), '-map', '[out]', '-t', str(dur), '-ac', '2', '-ar', '44100', dlg])
    spoken = [levels(p)[0] + g for p, _, _, g in placed]
    d_mean = sum(spoken) / len(spoken)                      # how loud a line is while someone is speaking
    d_peak = levels(dlg)[1]

    # 2. music: starts on a downbeat, drops out for the awkward silence if asked, fades under the closing card
    mus = os.path.join(stems, 'music.wav')
    m = cfg.get('music')
    cues = cfg.get('music_cues')
    if cues:                                                     # music as cues placed between moments of the film (tools/music_cues.py)
        import music_cues
        music_cues.build(cues, when, src, levels, d_mean, dur, mus, run)
    elif m:
        f, off = src(m['file']), m.get('offset', 0.0)
        gain = (d_mean - m.get('under_db', 17)) - levels(f, off, dur)[0]
        fade_out = f'afade=t=out:st={dur - 0.9:.3f}:d=0.9'
        if 'stop' in m:
            a, b = when(m['stop']), when(m['resume'])
            fc = (f'[0:a]atrim=0:{a + 0.06:.3f},afade=t=in:d=0.12,afade=t=out:st={a:.3f}:d=0.06[m1];'
                  f'[0:a]atrim={b:.3f}:{dur},asetpts=PTS-STARTPTS,afade=t=in:d=0.7,adelay={int(b * 1000)}:all=1[m2];'
                  f'[m1][m2]amix=inputs=2:normalize=0,volume={gain:.2f}dB,{fade_out},apad=whole_dur={dur}[out]')
        else:
            fc = f'[0:a]afade=t=in:d=0.12,volume={gain:.2f}dB,{fade_out},apad=whole_dur={dur}[out]'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(off), '-t', str(dur), '-i', f, '-filter_complex', fc, '-map', '[out]',
             '-t', str(dur), '-ac', '2', '-ar', '44100', mus])
    else:
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', str(dur), mus])

    # 3. ambience: one loop, quiet and constant
    amb = os.path.join(stems, 'ambience.wav')
    a = cfg.get('ambience')
    if a:
        f = src(a['file'])
        gain = (d_mean - a.get('under_db', 24)) - levels(f)[0]
        run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-i', f, '-af',
             f'volume={gain:.2f}dB,afade=t=in:d=0.4,afade=t=out:st={dur - 1.2:.3f}:d=1.2', '-t', str(dur), '-ac', '2', '-ar', '44100', amb])
    else:
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', str(dur), amb])

    # 4. effects: each one set by its own peak, a fixed distance under the dialogue's peak
    sfx = os.path.join(stems, 'sfx.wav')
    fx, log = cfg.get('sfx', []), []
    if fx:
        cmd, filt, tags = ['ffmpeg', '-v', 'error', '-y'], [], []
        for k, e in enumerate(fx):
            f, t = src(e['file']), max(0.0, when(e['at']))
            gain = (d_peak - e.get('under_db', 10)) - levels(f)[1]
            trim = f"atrim=0:{e['dur']},afade=t=out:st={max(0, e['dur'] - e.get('fade', 0.25)):.3f}:d={e.get('fade', 0.25)}," if 'dur' in e else ''
            fin = f"afade=t=in:d={e['fade_in']}," if 'fade_in' in e else ''
            cmd += ['-i', f]
            filt.append(f'[{k}:a]aresample=44100,{trim}{fin}volume={gain:.2f}dB,adelay={int(t * 1000)}:all=1[s{k}]')
            tags.append(f'[s{k}]')
            log.append((round(t, 2), os.path.basename(f)))
        filt.append(f'{"".join(tags)}amix=inputs={len(fx)}:normalize=0,apad=whole_dur={dur}[out]')
        run(cmd + ['-filter_complex', ';'.join(filt), '-map', '[out]', '-t', str(dur), '-ac', '2', '-ar', '44100', sfx])
    else:
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', str(dur), sfx])

    # 5. the mix: the music ducks itself under whoever is speaking, then one loudness pass for the feed
    os.makedirs(os.path.join(VIDEO, 'assets', 'audio'), exist_ok=True)
    out = os.path.join(VIDEO, 'assets', 'audio', 'mix.mp3')
    fc = ('[0:a]asplit=2[dlg][key];'
          '[1:a][key]sidechaincompress=threshold=0.05:ratio=3:attack=30:release=380:makeup=1[duck];'
          '[dlg][duck][2:a][3:a]amix=inputs=4:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[out]')
    pre = os.path.join(stems, 'mix-pre.wav')
    run(['ffmpeg', '-v', 'error', '-y', '-i', dlg, '-i', mus, '-i', amb, '-i', sfx, '-filter_complex', fc, '-map', '[out]',
         '-t', str(dur), '-ar', '44100', pre])
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', pre, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    got = float(re.findall(r'I:\s*(-?[\d.]+) LUFS', err)[-1])
    trim = max(-4.0, min(4.0, TARGET_LUFS - got))          # one-pass loudnorm drifts on a film with a constant bed (rain): measure it, trim to the target
    run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', f'volume={trim:.2f}dB,alimiter=limit=0.84:attack=3:release=60:level=disabled',
         '-t', str(dur), '-ar', '44100', '-b:a', '192k', out])
    print(f'loudness: {got:.1f} LUFS after the first pass, trimmed {trim:+.1f} dB to {TARGET_LUFS}')
    return log, d_mean, d_peak


def ebur(path, ss=None, t=None, af=''):
    """EBU R128 numbers of a file, a stretch of it, or what a filter leaves of it: I (integrated LUFS), M (loudest momentary LUFS, 400 ms),
    TP (true peak, dBFS). -70 for a file too short or too quiet to measure."""
    cmd = ['ffmpeg', '-hide_banner', '-nostats']
    if ss is not None:
        cmd += ['-ss', str(ss)]
    if t is not None:
        cmd += ['-t', str(t)]
    cmd += ['-i', path, '-af', (af + ',' if af else '') + 'ebur128=peak=true', '-f', 'null', '-']
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    ms = [float(x) for x in re.findall(r'\sM:\s*(-?[\d.]+)', err)]
    i = re.findall(r'\sI:\s*(-?[\d.]+) LUFS', err)
    tp = re.findall(r'Peak:\s*(-?[\d.]+) dBFS', err)
    return {'I': float(i[-1]) if i else -70.0, 'M': max(ms) if ms else -70.0, 'TP': float(tp[-1]) if tp else -70.0}


def in_windows(path, wins):
    """ebur() of the stretches [(a, b), ...] of a file joined together: the loudness of a stem while someone is speaking."""
    expr = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in wins)
    return ebur(path, af=f"aselect='{expr}',asetpts=N/SR/TB")


def clip_lufs(path):
    """Integrated loudness of a voiced line. A line shorter than one 400 ms gating block is measured padded with silence and scaled back."""
    r = ebur(path)['I']
    if r > -69:
        return r
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode().strip())
    return ebur(path, af='apad=pad_dur=0.8')['I'] + 10 * math.log10(0.4 / max(0.05, d))


def mix_audio_v2(ep, script, lines, man, placed, dur, end_s):
    """Mix 2 (script.json "mix": 2), the dialogue-led mix, built like a sound engineer would: everything is set against the voices, and
    the voices are set against each other first.
      1. every voiced line is measured (integrated LUFS) and gained to TARGET_DIALOGUE, so both voices sit at one level whoever the
         clone is; a line's own "gain" is an extra offset on top (0 by default, no hand gain needed); a peak that would stand more than
         13 dB over that level is limited to PEAK_CEIL, which leaves the master its headroom;
      2. the dialogue's loudness D (integrated), its loudest momentary loudness and its true peak are measured;
      3. the music bed is gained to D minus its "under_db" (default 14, LUFS), then ducked under speech; the bed under speech is
         measured and, when it is closer than BED_MIN to the dialogue, lowered until it is not;
      4. ambience (and a long effect, "dur" 6 or more, as a bed) is gained to D minus "under_db" (default 25);
      5. every other effect is set by its loudest moment: "under_db" (default 6) under the dialogue's loudest momentary loudness, and
         under its true peak, whichever is lower;
      6. one linear trim to TARGET_LUFS and a limiter, measured on the encoded file and corrected until it is within 0.5 LU with the true
         peak at or under -1 dBTP. (No dynamic loudnorm: it rides the gain line by line and undoes the balance above.)
    Returns the same as mix_audio: the effect log, the dialogue loudness (LUFS) and its true peak."""
    cfg = script.get('audio', {})
    stems = os.path.join(ep, 'audio', 'stems')
    for sub in ('lines', 'sfx'):
        os.makedirs(os.path.join(stems, sub), exist_ok=True)
    src = lambda p: p if os.path.isabs(p) else os.path.join(ROOT, p)
    when = lambda at: anchor(at, lines, man, end_s)
    silence = lambda out: run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', str(dur), out])

    # 1. dialogue: each line to one loudness
    cmd, filt, tags, rows = ['ffmpeg', '-v', 'error', '-y'], [], [], []
    for k, (path, s, who, g) in enumerate(placed):
        wav = os.path.join(stems, 'lines', f'line_{k:02d}.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ac', '2', '-ar', '44100', wav])
        was = clip_lufs(wav)
        gain = TARGET_DIALOGUE - was + g
        rows.append((lines[k]['i'], who, was, gain, ebur(wav)['TP'] + gain))
        cmd += ['-i', wav]
        filt.append(f'[{k}:a]volume={gain:.2f}dB,alimiter=limit={10 ** (PEAK_CEIL / 20):.3f}:attack=3:release=40:level=disabled,adelay={int(s * 1000)}:all=1[d{k}]')
        tags.append(f'[d{k}]')
    filt.append(f'{"".join(tags)}amix=inputs={len(placed)}:normalize=0,apad=whole_dur={dur}[out]')
    dlg = os.path.join(stems, 'dialogue.wav')
    run(cmd + ['-filter_complex', ';'.join(filt), '-map', '[out]', '-t', str(dur), '-ac', '2', '-ar', '44100', '-c:a', 'pcm_f32le', dlg])   # float: lines gained up to +10 dB must not clip before the master
    d = ebur(dlg)
    D, DM, DP = d['I'], d['M'], d['TP']                      # how loud the voices are, their loudest moment, their true peak

    # 2. music: a stretch of a file (or cues), set by its measured LUFS under the dialogue
    lv = lambda f, ss=None, t=None: (ebur(f, ss, t)['I'],)    # the same shape as levels(): [0] is the loudness
    mus = os.path.join(stems, 'music.wav')
    m, cues = cfg.get('music'), cfg.get('music_cues')
    if cues:
        import music_cues
        for c in cues:
            c.setdefault('under_db', 14)
        music_cues.build(cues, when, src, lv, D, dur, mus, run)
    elif m:
        f, off = src(m['file']), m.get('offset', 0.0)
        gain = (D - m.get('under_db', 14)) - lv(f, off, dur)[0]
        fade_out = f'afade=t=out:st={dur - 0.9:.3f}:d=0.9'
        if 'stop' in m:
            a, b = when(m['stop']), when(m['resume'])
            fc = (f'[0:a]atrim=0:{a + 0.06:.3f},afade=t=in:d=0.12,afade=t=out:st={a:.3f}:d=0.06[m1];'
                  f'[0:a]atrim={b:.3f}:{dur},asetpts=PTS-STARTPTS,afade=t=in:d=0.7,adelay={int(b * 1000)}:all=1[m2];'
                  f'[m1][m2]amix=inputs=2:normalize=0,volume={gain:.2f}dB,{fade_out},apad=whole_dur={dur}[out]')
        else:
            fc = f'[0:a]afade=t=in:d=0.12,volume={gain:.2f}dB,{fade_out},apad=whole_dur={dur}[out]'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(off), '-t', str(dur), '-i', f, '-filter_complex', fc, '-map', '[out]',
             '-t', str(dur), '-ac', '2', '-ar', '44100', mus])
    else:
        silence(mus)

    # 3. ambience: one loop, quiet and constant
    amb = os.path.join(stems, 'ambience.wav')
    a = cfg.get('ambience')
    if a:
        f = src(a['file'])
        gain = (D - a.get('under_db', 25)) - ebur(f)['I']
        run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-i', f, '-af',
             f'volume={gain:.2f}dB,afade=t=in:d=0.4,afade=t=out:st={dur - 1.2:.3f}:d=1.2', '-t', str(dur), '-ac', '2', '-ar', '44100', amb])
    else:
        silence(amb)

    # 4. effects: a bed by its loudness under the dialogue, an accent by its loudest moment under the dialogue's
    sfx = os.path.join(stems, 'sfx.wav')
    fx, log, outs = cfg.get('sfx', []), [], []
    for k, e in enumerate(fx):
        f, t = src(e['file']), max(0.0, when(e['at']))
        trim = f"atrim=0:{e['dur']},afade=t=out:st={max(0, e['dur'] - e.get('fade', 0.25)):.3f}:d={e.get('fade', 0.25)}," if 'dur' in e else ''
        fin = f"afade=t=in:d={e['fade_in']}," if 'fade_in' in e else ''
        raw = os.path.join(stems, 'sfx', f'raw_{k:02d}.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', f'aresample=44100,{trim}{fin}anull', '-ac', '2', '-ar', '44100', raw])
        r = ebur(raw)
        if e.get('dur', 0) >= 6:                              # a long effect is a bed
            gain = (D - e.get('under_db', 25)) - r['I']
        else:
            u = e.get('under_db', 6)
            gain = min((DM - u) - r['M'], (DP - u) - r['TP'])
        out = os.path.join(stems, 'sfx', f'sfx_{k:02d}.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', f'volume={gain:.2f}dB,adelay={int(t * 1000)}:all=1,apad=whole_dur={dur}',
             '-t', str(dur), '-ac', '2', '-ar', '44100', out])
        outs.append(out)
        log.append((round(t, 2), os.path.basename(f)))
    if outs:
        cmd = ['ffmpeg', '-v', 'error', '-y']
        for o in outs:
            cmd += ['-i', o]
        run(cmd + ['-filter_complex', ''.join(f'[{k}:a]' for k in range(len(outs))) + f'amix=inputs={len(outs)}:normalize=0[out]',
                   '-map', '[out]', '-t', str(dur), '-ac', '2', '-ar', '44100', sfx])
    else:
        silence(sfx)

    # 5. the bed ducks under speech (as in mix 1); then it is measured while someone speaks and lowered if it is too close
    speech = [(l['s'], l['e']) for l in lines]
    ducked = os.path.join(stems, 'music-ducked.wav')

    def duck():
        run(['ffmpeg', '-v', 'error', '-y', '-i', dlg, '-i', mus, '-filter_complex',
             '[1:a][0:a]sidechaincompress=threshold=0.05:ratio=3:attack=30:release=380:makeup=1[o]', '-map', '[o]', '-t', str(dur), '-ar', '44100', '-c:a', 'pcm_f32le', ducked])
    duck()
    spoken = in_windows(dlg, speech)['I']
    bed = spoken - in_windows(ducked, speech)['I'] if ebur(mus)['I'] > -60 else None
    trimmed = 0.0
    if bed is not None and bed < BED_MIN:
        trimmed = BED_MIN - bed
        tmp = mus + '.tmp.wav'
        run(['ffmpeg', '-v', 'error', '-y', '-i', mus, '-af', f'volume=-{trimmed:.2f}dB', '-ac', '2', '-ar', '44100', tmp])
        os.replace(tmp, mus)
        duck()
        bed = spoken - in_windows(ducked, speech)['I']

    # 6. the master: a linear trim to the target and a limiter, measured on the encoded file
    os.makedirs(os.path.join(VIDEO, 'assets', 'audio'), exist_ok=True)
    out = os.path.join(VIDEO, 'assets', 'audio', 'mix.mp3')
    pre = os.path.join(stems, 'mix-pre.wav')
    run(['ffmpeg', '-v', 'error', '-y', '-i', dlg, '-i', ducked, '-i', amb, '-i', sfx, '-filter_complex',
         '[0:a][1:a][2:a][3:a]amix=inputs=4:normalize=0[out]', '-map', '[out]', '-t', str(dur), '-ar', '44100', '-c:a', 'pcm_f32le', pre])
    got = ebur(pre)['I']
    trim, limit = TARGET_LUFS - got, 0.85
    for _ in range(5):
        run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', f'volume={trim:.2f}dB,alimiter=limit={limit:.3f}:attack=3:release=60:level=disabled',
             '-t', str(dur), '-ar', '44100', '-b:a', '192k', out])
        fin = ebur(out)
        if abs(fin['I'] - TARGET_LUFS) <= 0.3 and fin['TP'] <= -1.2:      # soundcheck passes at -1.0; the 0.2 is the margin
            break
        if fin['TP'] > -1.2:
            limit *= 0.93
        trim += TARGET_LUFS - fin['I']
    shutil.copyfile(out, os.path.join(stems, 'mix-final.mp3'))
    print(f'mix 2: lines gained to {TARGET_DIALOGUE:.0f} LUFS; dialogue {D:.1f} LUFS, loudest moment {DM:.1f} LUFS, true peak {DP:.1f} dBFS')
    for i, who, was, gain, tp in rows:
        print(f'  line {i:02d} {who:6s} {was:6.1f} LUFS  gain {gain:+5.1f} dB  true peak after {tp:+5.1f} dBFS')
    if bed is not None:
        print(f'  bed under speech {bed:.1f} dB under the dialogue' + (f' (lowered {trimmed:.1f} dB to reach {BED_MIN:.0f})' if trimmed else ''))
    print(f'loudness: {got:.1f} LUFS before the master, trimmed {trim:+.1f} dB; finished file {fin["I"]:.1f} LUFS, true peak {fin["TP"]:.1f} dBTP')
    return log, D, DP


def whole_hook(cc, comma=False):
    """The first line of a film (script.json "hook_caption": "whole"): the caption parts of one sentence are paired
    into two-line captions, so the whole hook is readable on frame 0 instead of half of it.
    comma (cine episodes): a row that is not the last of the hook keeps its comma, as all_hook does."""
    row = lambda k: cc[k].get('raw', cc[k]['text']) if comma and k + 1 < len(cc) else cc[k]['text']
    out, k = [], 0
    while k < len(cc):
        a = cc[k]
        if k + 1 < len(cc) and not re.search(r'[.?!]$', a['text']):
            b = cc[k + 1]
            out.append({'s': a['s'], 'e': b['e'], 'who': a['who'], 'text': row(k) + '\n' + row(k + 1)})
            k += 2
        else:
            out.append(a)
            k += 1
    return out


def trim_caps(caps, lines, shots):
    """cine episodes (CK-19): a line's last caption ends no later than the first real cut after the line ended, when that cut changes
    the shot. The caption runs about 0.16 s past the voice and the cut to the next speaker comes at the voice's end, so without this the
    old speaker's words sit over the other one's close-up."""
    real = [k for k in shots if not k.get('marker')]
    for c in caps:
        ln = next((l for l in lines if l['who'] == c['who'] and c['s'] >= l['s'] - 0.3 and c['s'] < l['e']), None)
        if ln is None or c['e'] <= ln['e']:
            continue
        k = next((n for n, s in enumerate(real) if s['t'] >= ln['e'] - 0.02 and s['t'] < c['e']), None)
        if k is not None and k > 0 and real[k]['shot'] != real[k - 1]['shot']:
            c['e'] = round(min(c['e'], max(c['s'] + 0.2, real[k]['t'])), 3)


def all_hook(cc, limit=30):
    """The first line of a film (script.json "hook_caption": "all"): every caption part of the line joined into one caption,
    a sentence to a row where it fits, so frame 0 carries the whole hook even when the hook is more than one sentence."""
    rows = []
    for k, c in enumerate(cc):
        text = c.get('raw', c['text']) if k + 1 < len(cc) else c['text']      # a row inside the hook keeps its comma
        if rows and not re.search(r'[.?!]$', rows[-1]) and len(rows[-1]) + 1 + len(text) <= limit:
            rows[-1] += ' ' + text
        else:
            rows.append(text)
    return [{'s': cc[0]['s'], 'e': cc[-1]['e'], 'who': cc[0]['who'], 'text': chr(10).join(rows)}]


def last_real_shot(shots):
    """The shot name on screen at the end of the list, markers ignored."""
    return next(c['shot'] for c in reversed(shots) if not c.get('marker'))


def add_cut(shots, at, shot=None, zoom=None, anchor=None):
    """A camera cut. shot None keeps the one on screen (a punch-in needs "zoom"); "anchor" also names the cut for a set that keys on shot names
    (cutAt('k_read') in a set still finds the moment while the film shows a grammar shot). The marker is a cut with that name at the SAME time as
    the real cut, listed just before it: every "last cut with t <= now" loop (src/lib/50-direct.js, 60-qa.js) lets a later entry win a tie, so
    the real cut owns every moment from its time on and no frame time can land on the marker's camera."""
    if shot is None:
        shot = last_real_shot(shots)
    t = round(at, 3)
    if anchor:
        shots.append({'t': t, 'shot': anchor, 'marker': True})
    c = {'t': t, 'shot': shot}
    if zoom:
        c['zoom'] = float(zoom)
    shots.append(c)


def assemble_scene(script, ep=None):
    """The scene code, joined the way every page is: src/lib/*.js in name order, the script's set (src/sets/<name>.js) just before the director
    (the first file from 50 on), and the episode's own stage.js (episodes/NN-slug/stage.js) right after the set. tools/lab.py, tools/qa.py and the
    sheet tools call this too, so a review page has the same staging as the film."""
    lib = os.path.join(ROOT, 'src', 'lib')
    set_src = None
    if script.get('set'):
        set_src = open(os.path.join(ROOT, 'src', 'sets', script['set'] + '.js'), encoding='utf-8').read()
    stage = os.path.join(ep, 'stage.js') if ep else None
    if stage and os.path.exists(stage):
        set_src = (set_src or '') + chr(10) + '// ---------- stage.js of ' + os.path.basename(os.path.abspath(ep)) + ' ----------' + chr(10) + open(stage, encoding='utf-8').read()
    parts = []
    for f in sorted(os.listdir(lib)):
        if not f.endswith('.js'):
            continue
        if set_src is not None and f >= '50':
            parts.append(set_src)
            set_src = None
        parts.append(open(os.path.join(lib, f), encoding='utf-8').read())
    if set_src is not None:
        parts.append(set_src)
    return chr(10).join(parts)


def main():
    ep = sys.argv[1]
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    gap = float(script.get('gap', GAP))
    for a, b in script.get('keep_together', []):
        KEEP.add((re.sub(r"[^a-z0-9]", '', a.lower()), re.sub(r"[^a-z0-9]", '', b.lower())))
    man = {m['i']: m for m in json.load(open(os.path.join(ep, 'audio', 'manifest.json'), encoding='utf-8'))['lines']}
    cine = bool(script.get('cine'))                    # the caption and card fixes below apply to camera-grammar episodes only; older timelines stay byte-identical

    t = LEAD
    lines, caps, shots, placed = [], [], [{'t': 0, 'shot': script.get('open_shot', 'hero')}], []
    card_lines = []
    reveal = []
    eyes = []                                          # Claude's eye shape keys: [{t, eyes}]

    def last_shot():
        return last_real_shot(shots)

    def cut(at, shot=None, zoom=None, anchor=None):
        add_cut(shots, at, shot, zoom, anchor)

    def eye_keys(i, ln, s, m):
        for name in [ln.get('eyes')] + [c.get('eyes') for c in ln.get('eye_cuts', [])]:
            if name is not None and name not in EYE_SHAPES:
                sys.exit(f'line {i}: eyes "{name}" is not a shape; the shapes are {", ".join(EYE_SHAPES)}')
        if ln.get('eyes'):
            eyes.append({'t': round(s - 0.04, 3), 'eyes': ln['eyes']})
        for c in ln.get('eye_cuts', []):
            eyes.append({'t': round(s + m['words'][c['word']]['s'] + c.get('offset', 0.0), 3), 'eyes': c['eyes']})
    for i, ln in enumerate(script['lines']):
        m = man[i]
        if ln.get('card'):                             # a last line or laugh that plays over the closing card: it must come last, and it adds no time
            card_lines.append((i, ln, m))
            continue
        t += ln.get('pre', 0.0)
        s, e = round(t, 3), round(t + m['dur'], 3)
        lines.append({'i': i, 'who': PAGE_WHO.get(ln['who'], ln['who']), 's': s, 'e': e, 'act': ln.get('act', '')})
        if ln.get('look'):
            lines[-1]['look'] = ln['look']
        eye_keys(i, ln, s, m)
        cc = captions(m, s)
        if i == 0 and script.get('hook_caption') == 'whole':   # the hook: one sentence on screen at once, so frame 0 carries all of it
            cc = whole_hook(cc, cine)
        if i == 0 and script.get('hook_caption') == 'all':
            cc = all_hook(cc)
        caps += cc
        if ln.get('pre_shot') and lines[:-1]:          # a set-up that plays in the silence before this line
            cut(lines[-2]['e'] + 0.14, ln['pre_shot'], anchor=ln.get('pre_anchor'))
            for c in ln.get('pre_cuts', []):           # and further cuts inside that same silence: {"at": seconds after it begins, "shot": name (none = same shot), "zoom": 1.25}
                cut(lines[-2]['e'] + 0.14 + c['at'], c.get('shot'), c.get('zoom'), c.get('anchor'))
        if ln.get('shot') and ln['shot'] != last_shot():
            cut(max(0, s - 0.12), ln['shot'], anchor=ln.get('shot_anchor'))
        for c in ln.get('cuts', []):
            cut(s + m['words'][c['word']]['s'] - 0.08 + c.get('offset', 0.0), c.get('shot'), c.get('zoom'), c.get('anchor'))   # "offset": seconds after the word starts; no "shot" = a punch-in on the shot on screen
        placed.append((os.path.join(ep, 'audio', m['file']), s, PAGE_WHO.get(ln['who'], ln['who']), float(ln.get('gain', 0.0))))
        t = e + gap
    for c in caps:
        c.pop('raw', None)
    caps[0]['s'] = 0.0          # the hook is readable on the very first frame
    spoken_end = t - gap
    end_s = round(spoken_end + HOLD, 3)
    dur = round(end_s + CARD, 2)
    for i, ln, m in card_lines:                        # "card_at": seconds from the card's first frame (default -0.6: it starts in the beat before the card)
        s = round(end_s + ln.get('card_at', -0.6), 3)
        assert s + m['dur'] <= dur, 'the card line runs past the end of the film'
        if cine and ln.get('shot') and ln['shot'] != last_shot():     # a cine card line cuts to its own shot, as any line does
            cut(max(0, s - 0.12), ln['shot'], anchor=ln.get('shot_anchor'))
        lines.append({'i': i, 'who': PAGE_WHO.get(ln['who'], ln['who']), 's': s, 'e': round(s + m['dur'], 3), 'act': ln.get('act', '')})
        if ln.get('look'):
            lines[-1]['look'] = ln['look']
        eye_keys(i, ln, s, m)
        if ln.get('reveal'):                           # "reveal": seconds into the line at which each part of one long token is spoken; the set shows it word by word (TL.reveal)
            reveal = [round(s + r, 3) for r in ln['reveal']]
        caps += captions(m, s)
        placed.append((os.path.join(ep, 'audio', m['file']), s, PAGE_WHO.get(ln['who'], ln['who']), float(ln.get('gain', 0.0))))
    if cine:
        trim_caps(caps, lines, shots)                  # the shots are final now (card cut included): captions end at the next shot change
    nf = int(dur * FPS) + 2

    amp = {PAGE_WHO.get(w, w): [0.0] * nf for w in script['voices']}
    for path, s, who, _ in placed:
        for k, v in enumerate(envelope(path)):
            f = int(s * FPS) + k
            if f < nf:
                amp[who][f] = round(v, 2)

    for k, v in script.get('marks', {}).items():   # "marks": {"name": <moment>}: one time for a sound effect ({"mark": "name"}) and for the set (TL.marks.name)
        MARKS[k] = round(anchor(v, lines, man, end_s), 3)
    mix2 = script.get('mix') == 2                      # the dialogue-led mix (mix_audio_v2); no "mix" key is mix 1, which every episode up to 13 keeps byte for byte
    fx_log, d_mean, d_peak = (mix_audio_v2 if mix2 else mix_audio)(ep, script, lines, man, placed, dur, end_s)

    tl = {'fps': FPS, 'dur': dur, 'title': script.get('title', ''), 'lines': lines, 'caps': caps, 'shots': shots, 'amp': amp,
          'end': {'s': end_s, 'e': dur}}
    if reveal:
        tl['reveal'] = reveal
    for key in ('cine', 'cine_shots', 'cine_look'):    # the virtual cinematographer (src/lib/51-cine.js); an old timeline has none of these and stays as it was
        if script.get(key) is not None:
            tl[key] = script[key]
    if eyes:
        tl['eyes'] = sorted(eyes, key=lambda k: k['t'])
    if MARKS:
        tl['marks'] = dict(MARKS)
    if script.get('inserts'):
        tl['inserts'] = place_inserts(script, lines, man, end_s)
    if '--cover' in sys.argv:          # one camera, no captions, no closing card: tools/cover.py takes a still from this
        tl.update(shots=[{'t': 0, 'shot': sys.argv[sys.argv.index('--cover') + 1]}], caps=[], end={'s': dur + 9, 'e': dur + 9}, inserts=[])
    html = open(os.path.join(ROOT, 'src', 'index.template.html'), encoding='utf-8').read()
    scene = assemble_scene(script, ep)             # src/lib in name order, the set (script.json "set") and the episode's stage.js just before the director
    # the closing card is locked; the logo, handle and credit chip come from series.json "card", and only its sentence changes with the story:
    # script.json "end_message": ["line one", "line two"] (up to three lines of at most END_CHARS characters); none keeps the template's line
    html = fill_card(html)
    msg = script.get('end_message')
    if msg:
        msg = [msg] if isinstance(msg, str) else list(msg)
        if len(msg) > 3 or any(len(m) > END_CHARS for m in msg):
            sys.exit(f'end_message: at most 3 lines of {END_CHARS} characters; got {[len(m) for m in msg]}')
        spans = ''.join('<span>' + html_mod.escape(m) + '</span>' for m in msg)
        html, n = re.subn(r'<!--ENDLINE-->.*?<!--/ENDLINE-->', lambda _: spans, html, flags=re.S)
        if n != 1:
            sys.exit('end_message: the template has no <!--ENDLINE--> slot')
    page_tl = page_extras(tl, script, ep)          # plus the embedded images: they go into the page, not into timeline.json
    html = html.replace('__DUR__', str(dur)).replace('/*__TL__*/', json.dumps(page_tl, ensure_ascii=False)).replace('/*__SCENE__*/', scene)
    open(os.path.join(VIDEO, 'index.html'), 'w', encoding='utf-8').write(html)
    json.dump(tl, open(os.path.join(ep, 'timeline.json'), 'w', encoding='utf-8', newline=chr(10)), ensure_ascii=False, indent=1)   # LF always: the repo converts nothing, and CRLF made a rebuilt old episode show its whole timeline as changed
    print(f'duration {dur}s, {len(lines)} lines, {len(caps)} captions, {len(shots)} shots; dialogue ' + (f'{d_mean:.1f} LUFS, true peak {d_peak:.1f} dBFS' if mix2 else f'mean {d_mean:.1f} dB, peak {d_peak:.1f} dB'))
    for c in shots:
        if not c.get('marker'):
            print(f'  cut {c["t"]:6.2f}  {c["shot"]}' + (f'  zoom {c["zoom"]}' if c.get('zoom') else ''))
    for at, name in fx_log:
        print(f'  sfx {at:6.2f}  {name}')
    for k in tl.get('inserts', []):
        print(f'  insert {k["s"]:6.2f} to {k["e"]:6.2f}  {k["asset"]} ({k["layout"]})')
    for name, a in page_tl.get('assets', {}).items():
        print(f'  asset {name}: {a["w"]}x{a["h"]}, {len(a["d"]) // 1024} KB in the page')


if __name__ == '__main__':
    main()
