"""Dialogue voices with ElevenLabs: one clip per script line, with word timings.

  python tools/voice.py <episode-dir> [--lines 0-2] [--who buloy] [--model eleven_v4] [--force]

Reads <episode-dir>/script.json, writes <episode-dir>/audio/line_NN.mp3 and
audio/manifest.json (who, text, duration, words with start and end seconds).
A line that already has a clip is skipped unless --force, so a re-run costs nothing.
The key is ELEVENLABS_API_KEY from this folder's git-ignored .env (see .env.example) or the environment; it is never printed.
"""
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

# How a name is said, for eleven_v4, which reads IPA written between slashes. Buloy is sent as /buˈloj/ (quick BU, longer LOY).
# Bai (the Visayan "bai", said like English "bye") is sent as /baɪ/: the plain "Bai" came back as "bay" (like "day"), and
# /baj/ or /ˈbaj/ were garbled or heard as "bay" half the time. Captions keep the plain name.
SPOKEN = {'Buloy': '/buˈloj/', 'Bai': '/baɪ/'}


def spoken(text, model):
    if model != 'eleven_v4':
        return text
    for name, ipa in SPOKEN.items():
        text = re.sub(rf'\b{name}\b', ipa, text, flags=re.I)
    return text


def _env():
    out = {}
    f = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    if os.path.exists(f):
        for l in open(f, encoding='utf-8'):
            m = re.match(r'^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$', l)
            if m and m.group(2):
                out[m.group(1)] = m.group(2).strip('"\'')
    out.update(os.environ)
    return out


def synth(voice_id, text, model, stability=0.45):
    key = _env().get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set: paste your key into .env (see .env.example)')
    body = {'text': text, 'model_id': model,
            'voice_settings': {'stability': stability, 'similarity_boost': 0.8, 'style': 0.15, 'use_speaker_boost': True}}
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128',
        data=json.dumps(body).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json'}, method='POST')
    try:
        j = json.loads(urllib.request.urlopen(req, timeout=180).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'ElevenLabs HTTP {e.code}: {e.read()[:300]!r}')
    return base64.b64decode(j['audio_base64']), j.get('alignment') or {}


def duration(path):
    return float(subprocess.check_output(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode().strip())


def words(al):
    """Word start and end seconds from the character timings."""
    chars = al.get('characters', [])
    st, en = al.get('character_start_times_seconds', []), al.get('character_end_times_seconds', [])
    out, cur, s, e = [], '', None, None
    for c, a, b in zip(chars, st, en):
        if c.isspace():
            if cur:
                out.append({'w': cur, 's': round(s, 3), 'e': round(e, 3)})
            cur, s = '', None
            continue
        if s is None:
            s = a
        cur += c
        e = b
    if cur:
        out.append({'w': cur, 's': round(s, 3), 'e': round(e, 3)})
    # Eleven v4 audio tags ([shouting], [sad, quiet]) come back in the timings but are
    # never spoken, so they must not become captions or mouth cues.
    kept, depth = [], 0
    for w in out:
        opens, closes = w['w'].count('['), w['w'].count(']')
        if depth == 0 and opens == 0:
            kept.append(w)
        depth = max(0, depth + opens - closes)
    return kept


def main():
    ep = sys.argv[1]
    args = sys.argv[2:]
    model = args[args.index('--model') + 1] if '--model' in args else 'eleven_v4'
    force = '--force' in args
    who = args[args.index('--who') + 1] if '--who' in args else None      # only this speaker's lines
    only = None
    if '--lines' in args:
        a, _, b = args[args.index('--lines') + 1].partition('-')
        only = set(range(int(a), int(b or a) + 1))
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    out = os.path.join(ep, 'audio')
    os.makedirs(out, exist_ok=True)
    mpath = os.path.join(out, 'manifest.json')
    old = {m['i']: m for m in json.load(open(mpath, encoding='utf-8'))['lines']} if os.path.exists(mpath) else {}
    lines, spent = [], 0
    for i, ln in enumerate(script['lines']):
        mp3 = os.path.join(out, f'line_{i:02d}.mp3')
        prev = old.get(i)
        keep = os.path.exists(mp3) and prev and prev['text'] == ln['text'] and prev['who'] == ln['who'] and prev.get('say') == ln.get('say')
        mine = (only is None or i in only) and (who is None or ln['who'] == who)
        if keep and not (force and mine):
            lines.append(prev)
            continue
        if not mine:
            if prev:
                lines.append(prev)
            continue
        said = ln.get('say', ln['text'])                 # "say": what the voice is sent when a word must be spelled for the ear ("A.I."); "text" is what the captions show
        sent = spoken(said, model)
        audio, al = synth(script['voices'][ln['who']]['voice_id'], sent, model, ln.get('stability', 0.45))
        open(mp3, 'wb').write(audio)
        spent += len(sent)
        ws = words(al)
        for w in ws:                                      # the timings come back with the IPA; captions show the name
            for name, ipa in SPOKEN.items():
                w['w'] = w['w'].replace(ipa, name)
        entry = {'i': i, 'who': ln['who'], 'text': ln['text'], 'file': f'line_{i:02d}.mp3', 'dur': round(duration(mp3), 3), 'words': ws}
        if 'say' in ln:
            entry['say'] = ln['say']
            plain = lambda t: [w for w in t.split() if not (w.startswith('[') or w.endswith(']'))]
            heard, shown = [w for w in ws if not (w['w'].startswith('[') or w['w'].endswith(']'))], plain(ln['text'])
            if len(heard) == len(shown):
                for w, t in zip(heard, shown):
                    w['w'] = t
            else:
                print(f'  line {i:02d}: "say" and "text" differ in word count ({len(heard)} against {len(shown)}); the captions will show what was said')
        lines.append(entry)
        rest = [old[k] for k in sorted(old) if k > i and k not in {x['i'] for x in lines}]      # not reached yet: keep what was there
        json.dump({'model': model, 'lines': lines + rest}, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)   # saved after every line: a dropped connection must not cost the takes already paid for
        print(f'line {i:02d} {ln["who"]:6s} {lines[-1]["dur"]:.2f}s  {ln["text"]}')
    json.dump({'model': model, 'lines': lines}, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'characters sent this run: {spent}')


if __name__ == '__main__':
    main()
