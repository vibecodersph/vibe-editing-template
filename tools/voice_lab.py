"""Try Eleven v4 audio tags on short lines and measure what came back.

  python tools/voice_lab.py [--voice VOICE_ID] [--out voice/lab]     (default voice: series.json voices.buloy)

Writes one mp3 per test, plus report.json with: whether the tag text shows up in the
returned character timings, the clip length, and mean and peak level (so a shout and a
whisper can be compared by number, since nobody listens here). Spends paid characters.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
import voice as V  # noqa: E402

TESTS = [
    ("plain", "Tapos ko na yung app. Sino nang gumamit?"),
    ("shouting", "[shouting] TAPOS KO NA YUNG APP! SINO NANG GUMAMIT?!"),
    ("whispering", "[whispering] Tapos ko na yung app... sino nang gumamit?"),
    ("laughs", "[laughs] Grabe, ako lang pala ang gumamit."),
    ("sings", "[sings] Darating din tayo diyan, darating din tayo diyan."),
    ("accent_british", "[strong British accent] I finished the app last night, pero wala pang gumagamit."),
    ("accent_bisaya", "[strong Bisaya accent] Tapos ko na yung app, pero wala pang gumagamit."),
    ("sad", "[sad, quiet, close to tears] Matagal na kaming hindi nag-uusap."),
]


def level(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    m = re.search(r'mean_volume: ([-\d.]+) dB', out)
    p = re.search(r'max_volume: ([-\d.]+) dB', out)
    return (float(m.group(1)) if m else None, float(p.group(1)) if p else None)


def main():
    a = sys.argv[1:]
    voice_id = a[a.index('--voice') + 1] if '--voice' in a else json.load(open(os.path.join(ROOT, 'series.json'), encoding='utf-8'))['voices']['buloy']['voice_id']
    out = a[a.index('--out') + 1] if '--out' in a else 'voice/lab'
    os.makedirs(out, exist_ok=True)
    rep, sent = [], 0
    for name, text in TESTS:
        audio, al = V.synth(voice_id, text, 'eleven_v4')
        sent += len(text)
        f = os.path.join(out, name + '.mp3')
        open(f, 'wb').write(audio)
        chars = ''.join(al.get('characters', []))
        mean, peak = level(f)
        rep.append({'test': name, 'text': text, 'file': f, 'dur': round(V.duration(f), 2),
                    'tag_in_timings': '[' in chars, 'timing_text': chars[:90], 'mean_db': mean, 'peak_db': peak})
        print(f"{name:16} {rep[-1]['dur']:5.2f}s  mean {mean} dB  peak {peak} dB  tag in timings: {'[' in chars}")
    json.dump({'voice_id': voice_id, 'model': 'eleven_v4', 'characters_sent': sent, 'tests': rep},
              open(os.path.join(out, 'report.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('characters sent:', sent)


if __name__ == '__main__':
    main()
