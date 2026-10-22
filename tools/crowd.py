"""Turn one line into a crowd: the same words shouted by several of the cast, layered with tiny offsets.

  python tools/crowd.py <episode-dir> <line-index> [--who buloy,nena,claude] [--offset-ms 70]

A line in script.json marked "crowd": [...] is voiced once by tools/voice.py (so the timeline, captions and mouth
cues exist); this replaces its clip with the layered version and rewrites that line's duration in
audio/manifest.json. The word timings stay those of the first voice. Takes are cached in audio/crowd/, so a
re-run costs nothing unless --force. Run it again after voice.py --force or after a voice changes.
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice as V  # noqa: E402


def main():
    ep, idx = sys.argv[1], int(sys.argv[2])
    a = sys.argv[3:]
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    ln = script['lines'][idx]
    who = (a[a.index('--who') + 1].split(',') if '--who' in a else ln.get('crowd')) or [ln['who']]
    off = int(a[a.index('--offset-ms') + 1]) if '--offset-ms' in a else 70
    force = '--force' in a
    out = os.path.join(ep, 'audio')
    cache = os.path.join(out, 'crowd')
    os.makedirs(cache, exist_ok=True)
    takes, first_words, spent = [], None, 0
    for k, w in enumerate(who):
        f = os.path.join(cache, f'line_{idx:02d}_{w}.mp3')
        if force or not os.path.exists(f):
            audio, al = V.synth(script['voices'][w]['voice_id'], ln['text'], 'eleven_v4')
            open(f, 'wb').write(audio)
            spent += len(ln['text'])
            if k == 0:
                first_words = V.words(al)
        takes.append(f)
    mp = os.path.join(out, 'manifest.json')
    man = json.load(open(mp, encoding='utf-8'))
    entry = next(m for m in man['lines'] if m['i'] == idx)
    cmd = ['ffmpeg', '-v', 'error', '-y']
    filt = []
    for k, f in enumerate(takes):
        cmd += ['-i', f]
        filt.append(f'[{k}:a]aresample=44100,adelay={k * off}:all=1[c{k}]')
    filt.append(''.join(f'[c{k}]' for k in range(len(takes))) + f'amix=inputs={len(takes)}:normalize=0,alimiter=limit=0.95[out]')
    mix = os.path.join(out, f'line_{idx:02d}.mp3')
    subprocess.run(cmd + ['-filter_complex', ';'.join(filt), '-map', '[out]', '-b:a', '128k', mix], check=True)
    entry['dur'] = round(V.duration(mix), 3)
    entry['crowd'] = who
    if first_words:
        entry['words'] = first_words
    json.dump(man, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    m = re.search(r'mean_volume: ([-\d.]+)', subprocess.run(['ffmpeg', '-hide_banner', '-i', mix, '-af', 'volumedetect', '-f', 'null', '-'],
                                                           capture_output=True, text=True).stderr)
    print(f'line {idx:02d} crowd of {len(takes)} ({", ".join(who)}): {entry["dur"]:.2f}s, mean {m.group(1) if m else "?"} dB; characters sent {spent}')


if __name__ == '__main__':
    main()
