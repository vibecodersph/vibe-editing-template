"""Generate one sound effect or room tone with ElevenLabs sound generation, into audio-lib/sfx, and write its ledger line.

    python tools/sfx.py receipt-printer.mp3 "A small thermal receipt printer printing a short slip, close, dry" 1.5
    python tools/sfx.py amb-store-dusk.mp3 "Quiet street outside a small store at dusk: far tricycles, crickets starting, steady ambience" 10 --note "episode 01"

This SPENDS ElevenLabs credits. It refuses to overwrite a file unless --force is given. A result under -45 dB mean is flagged QUIET:
the endpoint sometimes returns near-silence (a bulb hum once had to be synthesized instead), so listen to the numbers and
regenerate with a plainer prompt. For a bed longer than the clip, loop it: python tools/loopfx.py <in.mp3> <out-long.wav> <seconds>.
The key is ELEVENLABS_API_KEY from this folder's git-ignored .env (see .env.example) or the environment; it is never printed.
"""
import datetime
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio-lib', 'sfx')


def key():
    env = {}
    f = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    if os.path.exists(f):
        for line in open(f, encoding='utf-8'):
            m = re.match(r'^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$', line)
            if m and m.group(2):
                env[m.group(1)] = m.group(2).strip('"\'')
    env.update({k: v for k, v in os.environ.items() if k == 'ELEVENLABS_API_KEY'})
    return env.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set: paste your key into .env (see .env.example)')


def main():
    argv = sys.argv[1:]
    note = ''
    if '--note' in argv:
        i = argv.index('--note')
        note = argv[i + 1]
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith('--')]
    if len(args) < 2:
        sys.exit(__doc__)
    name, prompt = args[0], args[1]
    dur = float(args[2]) if len(args) > 2 else 2.0
    path = os.path.join(OUT, name)
    if os.path.exists(path) and '--force' not in sys.argv:
        sys.exit(f'{name} exists; --force to replace it')
    body = json.dumps({'text': prompt, 'duration_seconds': dur, 'prompt_influence': 0.6}).encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', data=body,
                                 headers={'xi-api-key': key(), 'Content-Type': 'application/json'})
    try:
        data = urllib.request.urlopen(req, timeout=180).read()
    except urllib.error.HTTPError as e:
        sys.exit(f'FAILED {name}: {e.code} {e.read()[:200]!r}')
    open(path, 'wb').write(data)
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean = float(re.search(r'mean_volume: ([-\d.]+)', err).group(1))
    peak = float(re.search(r'max_volume: ([-\d.]+)', err).group(1))
    ledger_path = os.path.join(OUT, 'SOURCES.json')
    ledger = json.load(open(ledger_path, encoding='utf-8')) if os.path.exists(ledger_path) else []
    ledger = [x for x in ledger if x.get('file') != name]
    ledger.append({'file': name, 'type': 'sound_effects', 'query': prompt, 'catalog': 'ElevenLabs sound generation', 'duration': dur,
                   'fetched': datetime.date.today().isoformat(), 'mean_db': mean, 'peak_db': peak,
                   'source': 'ElevenLabs sound generation' + (', ' + note if note else '')})
    json.dump(ledger, open(ledger_path, 'w', encoding='utf-8', newline=chr(10)), indent=1)      # LF: the repo converts nothing, so CRLF here would show the whole ledger as changed
    print(f'{name}  {dur:.1f} s  mean {mean:.1f} dB  peak {peak:.1f} dB' + ('  <-- QUIET: regenerate with a plainer prompt' if mean < -45 else ''))
    try:                                              # nobody here can hear it: have it described (tools/describe.py)
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import describe
        said = describe.describe(path)
        print('  heard as: ' + said + ('  <-- SPEECH? a quoted word in an effect is a failure: regenerate with "no speech, no words"' if '"' in said else ''))
    except Exception as e:                            # the description is a check, not a step: never lose the file over it
        print('  (not described: ' + str(e)[:120] + ')')


if __name__ == '__main__':
    main()
