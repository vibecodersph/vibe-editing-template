"""Speed one voiced line up or down without changing its pitch, and fix its timings.

  python tools/tempo.py <episode-dir> <line-index> <speed>      e.g. 1.12 is 12 percent faster

Keeps the clip as it came from the voice in audio/line_NN.orig.mp3 (first run only), writes the changed clip to
audio/line_NN.mp3 and scales that line's duration and word timings in audio/manifest.json, so the timeline, captions
and mouth cues follow. Always start from the original, so running it again with another speed replaces the first.
voice.py --force on the line brings back the untouched take (and drops the speed).
"""
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice as V  # noqa: E402

ep, idx, sp = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
mp = os.path.join(ep, 'audio', 'manifest.json')
man = json.load(open(mp, encoding='utf-8'))
e = next(m for m in man['lines'] if m['i'] == idx)
cur = os.path.join(ep, 'audio', e['file'])
orig = cur.replace('.mp3', '.orig.mp3')
if not os.path.exists(orig) or 'orig_dur' not in e:      # none kept yet, or one left over from an earlier take: voice.py writes a fresh entry (no orig_dur) when it re-voices, so the clip on disk is the take. Without this the old take came back over the new one (episode 8, line 0).
    shutil.copy(cur, orig)
    e['orig_dur'] = e['dur']
    e['orig_words'] = e['words']
base_dur, base_words = e.get('orig_dur', e['dur']), e.get('orig_words', e['words'])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', orig, '-filter:a', f'atempo={sp}', '-b:a', '128k', cur], check=True)
e['dur'] = round(V.duration(cur), 3)
e['words'] = [{'w': w['w'], 's': round(w['s'] / sp, 3), 'e': round(w['e'] / sp, 3)} for w in base_words]
e['speed'] = sp
json.dump(man, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'line {idx:02d}: {base_dur:.2f}s -> {e["dur"]:.2f}s at x{sp}')
