"""Music as cues: each cue is a stretch of one file placed between two moments of the film.

audio.music_cues in script.json, instead of the single audio.music:
  [{"file": "audio-lib/music/cartoon-playful-fast.wav", "offset": 0.0,
    "at": {"line": 5, "offset": -0.3}, "until": {"line": 8, "offset": -0.1},
    "under_db": 14, "fade_in": 0.3, "fade_out": 0.4}, ...]

`at` and `until` are the same moments build.py's `when()` understands: {t}, {line, word?, edge?, offset?}, {card, offset?};
`until` may be left out to run to the end. Each cue is set by its own measured level, `under_db` below the dialogue,
and the cues are summed into the music stem. The music still ducks under speech in the final mix.
"""


def build(cues, when, src, levels, d_mean, dur, out, run):
    stems = []
    for k, c in enumerate(cues):
        f, off = src(c['file']), c.get('offset', 0.0)
        a = max(0.0, when(c['at']))
        b = min(dur, when(c['until'])) if 'until' in c else dur
        span = max(0.2, b - a)
        fi, fo = c.get('fade_in', 0.3), c.get('fade_out', 0.4)
        gain = (d_mean - c.get('under_db', 17)) - levels(f, off, span)[0]
        stem = out.replace('.wav', f'-cue{k}.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(off), '-t', f'{span:.3f}', '-i', f, '-af',
             f'afade=t=in:d={fi},afade=t=out:st={max(0.0, span - fo):.3f}:d={fo},volume={gain:.2f}dB,adelay={int(a * 1000)}:all=1,apad=whole_dur={dur}',
             '-t', str(dur), '-ac', '2', '-ar', '44100', stem])
        stems.append(stem)
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for s in stems:
        cmd += ['-i', s]
    flt = ''.join(f'[{k}:a]' for k in range(len(stems))) + f'amix=inputs={len(stems)}:normalize=0[out]'
    run(cmd + ['-filter_complex', flt, '-map', '[out]', '-t', str(dur), '-ac', '2', '-ar', '44100', out])
