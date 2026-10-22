"""Shorten the pauses inside one voiced line without touching the words, and fix its timings.

  python tools/squeeze.py <episode-dir> <line-index> <gap> [speed] [--lead 0.06]
      gap    0.18 leaves at most 0.18 s of silence between words
      speed  optional, as in tempo.py: 1.12 is 12 percent faster, applied after the pauses are cut
      --lead optional: also cut the silence before the first word down to this many seconds (a take that opens on a
             breath or dead air). Off by default: the timeline's own gaps usually own the edges.

For a take whose words are right and whose pauses are long (a line sounded out slowly, a voice that breathes between
phrases). tempo.py makes the whole take faster, syllables included; this one keeps the delivery and removes dead air.

Keeps the clip as it came from the voice in audio/line_NN.orig.mp3 (first run only), writes the changed clip to
audio/line_NN.mp3 and moves that line's duration and word timings in audio/manifest.json, so the timeline, captions and
mouth cues follow. Always starts from the original, so running it again with another gap replaces the first, and it
replaces a tempo.py change on the same line (the two do not stack; give the speed here instead). voice.py --force on
the line brings back the untouched take.
"""
import json
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice as V  # noqa: E402

NOISE_DB, MIN_SILENCE = -38, 0.10


def silences(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', f'silencedetect=noise={NOISE_DB}dB:d={MIN_SILENCE}',
                          '-f', 'null', '-'], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', err)]
    ends = [float(x) for x in re.findall(r'silence_end: (-?[\d.]+)', err)]
    return list(zip(starts, ends))  # a silence that runs to the end of the file has no end and is left alone


def main():
    argv = sys.argv[1:]
    lead = None
    if '--lead' in argv:
        k = argv.index('--lead')
        lead = float(argv[k + 1])
        del argv[k:k + 2]
    ep, idx, gap = argv[0], int(argv[1]), float(argv[2])
    sp = float(argv[3]) if len(argv) > 3 else 1.0
    mp = os.path.join(ep, 'audio', 'manifest.json')
    man = json.load(open(mp, encoding='utf-8'))
    e = next(m for m in man['lines'] if m['i'] == idx)
    cur = os.path.join(ep, 'audio', e['file'])
    orig = cur.replace('.mp3', '.orig.mp3')
    if not os.path.exists(orig) or 'orig_dur' not in e:      # no kept original, or the line was voiced again since: this take is the original
        shutil.copy(cur, orig)
        e['orig_dur'] = e['dur']
        e['orig_words'] = e['words']
    base_dur, base_words = e.get('orig_dur', e['dur']), e.get('orig_words', e['words'])
    total = V.duration(orig)
    cuts = []  # the middle of every inner silence longer than the gap
    head = 0.0  # with --lead: whatever comes before the first word (dead air or a tag's breath), by the word timings
    if lead is not None and base_words and base_words[0]['s'] > lead + 0.02:
        head = base_words[0]['s'] - lead
        cuts.append((0.0, head))
    for s, t in silences(orig):
        if s <= 0.02 or t >= total - 0.02 or t - s <= gap:
            continue  # leading and trailing silence belong to the timeline's own gaps
        if s + gap / 2 < head:
            continue  # inside the head already cut
        cuts.append((s + gap / 2, t - gap / 2))
    if not cuts:
        sys.exit(f'line {idx:02d}: no pause inside it is longer than {gap} s; nothing changed')
    keep, at = [], 0.0
    for a, b in cuts:
        if a > at:
            keep.append((at, a))
        at = b
    keep.append((at, total))
    parts = ''.join(f'[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.004,'
                    f'afade=t=out:st={max(0.0, b - a - 0.004):.4f}:d=0.004[p{i}];' for i, (a, b) in enumerate(keep))
    graph = parts + ''.join(f'[p{i}]' for i in range(len(keep))) + f'concat=n={len(keep)}:v=0:a=1,atempo={sp}[out]'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', orig, '-filter_complex', graph, '-map', '[out]', '-b:a', '128k', cur], check=True)

    def move(t):
        gone = 0.0
        for a, b in cuts:
            if t >= b:
                gone += b - a
            elif t > a:
                gone += t - a
        return round((t - gone) / sp, 3)

    e['dur'] = round(V.duration(cur), 3)
    e['words'] = [{'w': w['w'], 's': move(w['s']), 'e': move(w['e'])} for w in base_words]
    e['squeezed'] = gap
    e.pop('speed', None)
    if sp != 1.0:
        e['speed'] = sp
    json.dump(man, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'line {idx:02d}: {base_dur:.2f}s -> {e["dur"]:.2f}s, {len(cuts)} pauses cut to {gap} s' + (f', then x{sp}' if sp != 1.0 else ''))
    print('  words:', ', '.join(f"{w['w']} {w['s']:.2f}-{w['e']:.2f}" for w in e['words']))


if __name__ == '__main__':
    main()
