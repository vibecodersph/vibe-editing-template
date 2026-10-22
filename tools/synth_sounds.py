"""Make the template's sound kit from code (numpy + ffmpeg only, no samples, no network): CC0-1.0.

    python tools/synth_sounds.py            # every file below, rewritten with the same samples (fixed seeds; the mp3 bytes depend on the ffmpeg build)
    python tools/synth_sounds.py ping-soft  # one file, by name (several names are fine)

Writes mp3s into audio-lib/sfx/ and audio-lib/music/ and adds one entry per file to that folder's SOURCES.json (once).
Each effect is checked as it is written: it starts within 30 ms (no leading silence) and does not clip.
Peaks are set to -3 dBFS (-6 for the bed); the mix-2 build sets the real level against the dialogue.

  stamp-low   rubber-stamp thud          scratch-stop  record scratch that winds down    womp       sad two-note trombone
  ping-soft   bright notification ping   whoosh-air    quick air whoosh for a cut        error-buzz two short UI buzzes
  chime-up    rising two-note chime      sparkle-dust  magical sparkle                   claps-small a few people clapping
  key-tap     one laptop key             ba-dum-tss    rimshot                           lofi-bed   76 BPM lo-fi bed, 75.8 s, loops
"""
import json
import os
import subprocess
import sys

import numpy as np

SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio-lib')
T = lambda d: np.arange(int(d * SR)) / SR  # noqa: E731  time axis
rng = lambda seed: np.random.default_rng(seed)  # noqa: E731


def svf(x, fc, d=0.7, mode=1):
    """State-variable filter with a moving cutoff; d = 1/Q. mode 0 low-pass, 1 band-pass, 2 high-pass."""
    f = 2 * np.sin(np.pi * np.minimum(np.broadcast_to(fc, len(x)), SR / 6) / SR)
    lo = bd = 0.0
    out = np.empty(len(x))
    for i, (v, g) in enumerate(zip(x.tolist(), f.tolist())):
        hi = v - lo - d * bd
        bd += g * hi
        lo += g * bd
        out[i] = (lo, bd, hi)[mode]
    return out


def place(out, x, at, gain=1.0):
    i = int(at * SR)
    n = min(len(x), len(out) - i)
    if n > 0:
        out[i:i + n] += gain * x[:n]


def bell(f, d, tau):
    t = T(d)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t / 2 / tau) + .1 * np.sin(6 * np.pi * f * t) * np.exp(-t / 4 / tau)) \
        * np.exp(-t / tau) * np.minimum(1, t / 0.0015)


def reverb(x, seed, tail=0.25, wet=0.3):
    t = T(tail)
    ir = rng(seed).standard_normal(len(t)) * np.exp(-t / (tail / 4))
    n = len(x) + len(ir)
    return x + wet * np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)] * 0.1


def stamp_low():
    t = T(0.8)
    f = 50 + 110 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * np.minimum(1, t / 0.005)
    slap = svf(rng(1).standard_normal(len(t)) * np.exp(-t / 0.008), 1200, 1.0, 0)
    return body + .5 * slap / np.abs(slap).max() + .3 * np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.05)


def scratch_stop():
    t = T(0.9)
    v = np.interp(t, [0, .05, .1, .15, .2, .25, .3, .4, .9], [1.3, -1.1, 1.4, -1, 1.2, -.8, 1, .8, 0])  # platter speed: back and forth, then winds down
    ph = np.cumsum(v) / SR
    music = sum(np.sin(2 * np.pi * 110 * r * ph * 4) / r for r in (1, 1.5, 2, 3, 4))  # a chord on the record, so the stop falls in pitch
    grit = svf(music + 1.5 * rng(2).standard_normal(len(t)), 900 + 3000 * np.abs(v), 1.2, 1)
    return grit * np.abs(v) ** .6


def womp():
    out = np.zeros(int(1.4 * SR))
    for at, d, f0, f1 in [(0, .4, 233, 220), (.45, .9, 207, 150)]:
        t = T(d)
        ph = np.cumsum(np.linspace(f0, f1, len(t)) * (1 + .006 * np.sin(2 * np.pi * 5 * t))) / SR
        b = 1.5 + 6 * np.sin(np.pi * np.minimum(1, t / .28)) ** 2 * np.exp(-t / .4)  # the wah: "wuh-ah", mouth opening then closing
        x = sum(np.sin(2 * np.pi * h * ph) / h * np.exp(-h / b) for h in range(1, 25)) + .05 * rng(11).standard_normal(len(t))
        place(out, x * np.minimum(1, t / .03) * np.exp(-t / .6) * np.minimum(1, (d - t) / .06), at)
    return out


def ping_soft():
    return bell(1760, 0.9, 0.18)


def whoosh_air():
    t = T(0.6)
    env = t / .14 * np.exp(1 - t / .14)  # peaks at 140 ms, fast in, long air out
    return svf(rng(3).standard_normal(len(t)), 300 + 3700 * np.exp(-((t - .15) / .17) ** 2), 2.0, 1) * env


def error_buzz():
    out = np.zeros(int(.55 * SR))
    for at, f in [(0, 100), (.22, 85)]:
        t = T(.17)
        x = np.tanh(2 * sum(np.sin(2 * np.pi * h * f * t) / h for h in range(1, 31))) * (1 - .5 * np.sin(2 * np.pi * 45 * t))  # a rough sawtooth, buzzing
        place(out, x * np.minimum(1, np.minimum(t, .17 - t) / .004), at)
    return out


def chime_up():
    out = np.zeros(SR)
    place(out, bell(1046.5, .8, .3), 0)
    place(out, bell(1568, .8, .35), .16)
    return out


def sparkle_dust():
    r = rng(4)
    out = np.zeros(int(1.2 * SR))
    times = np.sort(np.r_[0, 1.0 * r.random(27) ** 1.5])
    for at in times:
        place(out, bell(r.choice([1047, 1175, 1319, 1568, 1760]) * r.choice([1, 2, 3]), .3, .06), at, r.uniform(.3, 1) * (1.2 - at))
    return out


def claps_small():
    r = rng(5)
    out = np.zeros(int(1.6 * SR))
    for fc, t0, rate in [(1000, 0, 4.1), (1500, .03, 4.5), (2200, .06, 3.8)]:  # three people clapping a steady beat, none quite together
        for k in range(5):
            at = t0 + k / rate + r.uniform(-.015, .015)
            t = T(.12)
            n = r.standard_normal(len(t))
            hit = n * sum(np.exp(-np.maximum(t - s, 0) / .005) * (t >= s) for s in (0, .005, .01)) + .4 * n * np.exp(-t / .025)
            place(out, svf(hit, fc, .9, 1) + .3 * np.diff(n * np.exp(-t / .008), prepend=0), at, r.uniform(.6, 1))
    return reverb(out, 6, .3, .6)


def key_tap():
    out = np.zeros(int(.14 * SR))
    for at, g in [(0, 1), (.07, .5)]:  # the key going down, then bottoming out
        t = T(.07)
        click = svf(rng(7).standard_normal(len(t)) * np.exp(-t / .004), 3000, .5, 1)
        thock = np.sin(2 * np.pi * np.cumsum(420 - 2000 * t) / SR) * np.exp(-t / .02)
        place(out, click / np.abs(click).max() + .6 * thock, at, g)
    return out


def drum(f0, tone, noise_hz, tau_n):
    t = T(.3)
    n = svf(rng(8).standard_normal(len(t)), noise_hz, 1.3, 1) * np.exp(-t / tau_n)
    return tone * np.sin(2 * np.pi * np.cumsum(f0 * (.55 + .45 * np.exp(-t / .03))) / SR) * np.exp(-t / .12) + n / np.abs(n).max() * .9


def ba_dum_tss():
    out = np.zeros(int(1.4 * SR))
    place(out, drum(200, .8, 2200, .12), 0)
    place(out, drum(130, 1.0, 2000, .14), .22)
    t = T(.9)
    sq = sum(np.sign(np.sin(2 * np.pi * 205.3 * m * t)) for m in (2, 3, 4.16, 5.43, 6.79, 8.21))  # the six squares of an electronic cymbal
    cym = np.diff(sq + 3 * rng(9).standard_normal(len(t)), n=2, prepend=[0, 0]) * np.exp(-t / .3) * np.minimum(1, t / .002)
    place(out, cym / np.abs(cym).max(), .5, .8)
    return out


def lofi_bed():
    bars, beat = 24, 60 / 76  # 24 bars = 75.8 s: six turns of one four-bar progression
    bar, n, tail = 4 * beat, int(24 * 4 * beat * SR), int(4 * SR)
    r = rng(10)
    out = np.zeros((n + tail, 2))
    eighth = lambda i: (i // 2) * beat + (i % 2) * beat * .58  # swung eighths  # noqa: E731
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
    chords = [([60, 64, 67, 71], 33), ([53, 57, 60, 64], 38), ([53, 59, 64, 69], 31), ([52, 55, 59, 62], 36)]  # Am9 Dm9 G13 Cmaj9, rootless
    t = T(.5)
    kick = np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-t / .025)) / SR) * np.exp(-t / .16)
    snare = np.convolve(r.standard_normal(len(t)), np.ones(5) / 5, 'same') * np.exp(-t / .07) * .8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .05) * .3
    hats = [np.diff(r.standard_normal(len(t) + 1)) * np.exp(-t / tau) for tau in (.012, .03)]

    def rhodes(m, d):
        t = T(d)
        v = []
        for det in (1.0006, .9994):
            ph = 2 * np.pi * hz(m) * det * t
            v.append(np.sin(ph + (.9 * np.exp(-t / .15) + .1) * np.sin(ph)) * np.exp(-t / 2.2) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .15))
        return np.stack([.65 * v[0] + .35 * v[1], .35 * v[0] + .65 * v[1]], 1)

    pad = lambda m: np.sin(2 * np.pi * hz(m) * T(bar + .6)) * np.minimum(1, T(bar + .6) / .4) * np.minimum(1, (bar + .6 - T(bar + .6)) / .5)  # noqa: E731  slow sine under each chord

    for b in range(bars):
        s = b * bar
        notes, root = chords[b % 4]
        for j, m in enumerate(notes):  # chord rolled low to high on beat 1, a softer stab on the "and" of beat 3
            place(out, rhodes(m, 3.4), s + .018 * j, .11)
            place(out, pad(m)[:, None], s, .035)
            if j > 0:
                place(out, rhodes(m, 1.2), s + eighth(5), .06)
        for i, g in [(0, 1), (5, .7)]:  # soft kick
            place(out, kick[:, None], s + eighth(i), .9 * g)
        for i in (2, 6):  # snare a hair late
            place(out, snare[:, None], s + eighth(i) + .012, .4)
        for i in range(8):
            if r.random() > .12:
                place(out, hats[i % 2][:, None], s + eighth(i) + r.uniform(0, .008), (.18 if i % 2 == 0 else .1) * r.uniform(.7, 1))
        for i, mm, g in [(0, root, .45), (5, root + 12, .25)]:
            t = T(1.2)
            x = (np.sin(2 * np.pi * hz(mm) * t) + .25 * np.sin(4 * np.pi * hz(mm) * t)) * np.exp(-t / .6) * np.minimum(1, t / .008) * np.minimum(1, (1.2 - t) / .1)
            place(out, x[:, None], s + eighth(i), g)
    out[:tail] += out[n:]  # the tail wraps to the start so the bed loops
    out = out[:n]
    clicks = np.convolve((r.random(n) < 14 / SR) * r.uniform(-1, 1, n), [1, -.6, .3], 'same') * .06  # vinyl crackle
    out += np.stack([clicks, np.roll(clicks, 997)], 1) + .002 * r.standard_normal((n, 2))
    return out


# name -> (function, folder, afilter, fade out the last 20 ms, description)
SOUNDS = {
    'stamp-low': (stamp_low, 'sfx', None, 1, 'A heavy rubber stamp thud: a low body with a short slap, no ring.'),
    'scratch-stop': (scratch_stop, 'sfx', None, 1, 'A record scratched back and forth that winds down to a stop.'),
    'womp': (womp, 'sfx', None, 1, 'A sad two-note descending trombone-style womp womp.'),
    'ping-soft': (ping_soft, 'sfx', None, 1, 'A bright short notification ping with a soft ring.'),
    'whoosh-air': (whoosh_air, 'sfx', None, 1, 'A quick airy whoosh for a cut, fast in and a soft tail.'),
    'error-buzz': (error_buzz, 'sfx', None, 1, 'Two short low UI error buzzes, the second a little lower.'),
    'chime-up': (chime_up, 'sfx', None, 1, 'A gentle rising two-note chime.'),
    'sparkle-dust': (sparkle_dust, 'sfx', None, 1, 'A short magical sparkle: many tiny high bell tones thinning out.'),
    'claps-small': (claps_small, 'sfx', None, 1, 'A few people clapping, with a small room tail.'),
    'key-tap': (key_tap, 'sfx', None, 1, 'One laptop key tap: a short click over a soft thock.'),
    'ba-dum-tss': (ba_dum_tss, 'sfx', None, 1, 'A rimshot: two drum hits then a cymbal.'),
    'lofi-bed': (lofi_bed, 'music', 'lowpass=f=3500', 0, 'Calm lo-fi bed, 76 BPM, rolled Rhodes-style chords, soft bass, kick, snare and swung hats, light vinyl crackle; no voice, no lead melody; 24 bars that loop.'),
}


def write(name):
    fn, folder, af, fade, desc = SOUNDS[name]
    x = fn().astype(np.float32)
    assert np.isfinite(x).all(), name
    x *= 10 ** ((-3 if fade else -6) / 20) / np.abs(x).max()  # peak -3 dBFS (-6 for the bed, whose low-pass and encode add a little), so no clipping
    if fade:
        x[-int(.02 * SR):] *= np.linspace(1, 0, int(.02 * SR))[:, None] if x.ndim == 2 else np.linspace(1, 0, int(.02 * SR))
        assert np.argmax(np.abs(x) > .1 * np.abs(x).max()) < .03 * SR, f'{name} starts late'
    path = os.path.join(ROOT, folder, name + '.mp3')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(1 if x.ndim == 1 else 2), '-i', '-']
    subprocess.run(cmd + (['-af', af] if af else []) + ['-c:a', 'libmp3lame', '-q:a', '2', '-fflags', '+bitexact', '-flags:a', '+bitexact',
                                                          '-map_metadata', '-1', path], input=x.tobytes(), check=True)
    src = os.path.join(ROOT, folder, 'SOURCES.json')
    rows = json.load(open(src, encoding='utf-8'))
    row = {'file': name + '.mp3', 'type': 'music' if folder == 'music' else 'sound_effects', 'catalog': 'made from code',
           'duration': round(len(x) / SR, 2), 'description': desc, 'fetched': '2026-10-22',
           'source': f'made from code: tools/synth_sounds.py {name}', 'licence': 'CC0-1.0'}
    i = next((i for i, e in enumerate(rows) if e['file'] == row['file']), len(rows))  # replace our own entry, else append
    rows[i:i + 1] = [row]
    with open(src, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(rows, f, indent=1, ensure_ascii=False)
    print(f'{name}.mp3  {len(x) / SR:.2f} s')


if __name__ == '__main__':
    for nm in sys.argv[1:] or SOUNDS:
        write(nm)
