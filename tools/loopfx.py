"""Make a longer, seamless-enough bed from a short sound: copies joined with a crossfade.

  python tools/loopfx.py <in.mp3> <out.wav> <seconds> [--fade 0.8]

Used for beds that must run longer than the clip the sound generator gave (traffic, wind, an idling engine).
"""
import subprocess
import sys


def duration(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())


def main():
    src, out, want = sys.argv[1], sys.argv[2], float(sys.argv[3])
    fade = float(sys.argv[sys.argv.index('--fade') + 1]) if '--fade' in sys.argv else 0.8
    d = duration(src)
    n = 1
    while d * n - fade * (n - 1) < want + 0.5:
        n += 1
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for _ in range(n):
        cmd += ['-i', src]
    if n == 1:
        flt = '[0:a]anull[out]'
    else:
        parts, prev = [], '[0:a]'
        for k in range(1, n):
            lab = f'[x{k}]'
            parts.append(f'{prev}[{k}:a]acrossfade=d={fade}:c1=tri:c2=tri{lab}')
            prev = lab
        flt = ';'.join(parts).rsplit('[x', 1)[0] + '[out]' if False else ';'.join(parts)
        flt = flt[:flt.rfind('[x')] + '[out]'
    subprocess.run(cmd + ['-filter_complex', flt, '-map', '[out]', '-t', str(want), '-ar', '44100', out], check=True)
    print(f'{out}: {duration(out):.1f}s from {n} copies of {d:.1f}s')


if __name__ == '__main__':
    main()
