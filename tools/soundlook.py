"""Measure a sound nobody here can hear: how long it is, where its loud part starts, and where its energy sits.

    python tools/soundlook.py audio-lib/sfx/abaniko-snap.mp3 [more files ...]

For each file: length, peak, spectral centroid, the share of energy under 200 Hz, from 200 to 2000 Hz and above 2000 Hz, a row
of bars (one column per 50 ms, louder is denser) and where the loudest part starts and ends. No key, no network.

What to read from it:
- Place an effect by where its loud part starts, not where the file starts. A generated effect often has a quarter second of
  lead-in: give it a negative offset of that length in script.json, or the hit lands late.
- A thud sits under 2000 Hz with a loud part of a tenth of a second; a snap or a rustle sits above 2000 Hz; a power-down or a
  hum is mostly under 200 Hz and lasts. If the bands say otherwise, the file is not what its name says.
- A room tone needs something under 1000 Hz to pass tools/soundcheck.py and to be felt on earphones.
Use it beside tools/describe.py (a model's one-sentence description): when the two disagree, trust this one, except when the
description quotes spoken words, which has been right every time.
"""
import os
import subprocess
import sys

import numpy as np


def pcm(path, sr=22050):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32), sr


def look(path):
    x, sr = pcm(path)
    if not len(x):
        print(f'{os.path.basename(path)}: could not be read')
        return
    w = int(sr * 0.05)
    n = max(1, len(x) // w)
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * w:(i + 1) * w] ** 2) + 1e-12) + 1e-9) for i in range(n)])
    bars = ' .:-=+*#%@'
    row = ''.join(bars[int(np.clip((d + 60) / 60 * (len(bars) - 1), 0, len(bars) - 1))] for d in db[:240])
    spec = np.abs(np.fft.rfft(x)) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    tot = spec.sum() + 1e-12
    lo, mid, hi = spec[f < 200].sum() / tot, spec[(f >= 200) & (f < 2000)].sum() / tot, spec[f >= 2000].sum() / tot
    loud = np.where(db > db.max() - 12)[0]
    print(f'{os.path.basename(path)}: {len(x) / sr:.2f} s, peak {20 * np.log10(np.abs(x).max() + 1e-9):.1f} dB, '
          f'centroid {(spec * f).sum() / tot:.0f} Hz, low/mid/high {lo:.0%}/{mid:.0%}/{hi:.0%}')
    print(f'  |{row}|' + ('' if n <= 240 else ' ...'))
    print(f'  loud part {loud[0] * 0.05:.2f} to {(loud[-1] + 1) * 0.05:.2f} s')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for p in sys.argv[1:]:
        look(p)
