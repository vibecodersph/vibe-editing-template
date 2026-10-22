"""One command from script to files, in the only safe order.

    python tools/render.py episodes/00-legit-developer v1 [--workers 2]

1. tools/build.py        the page gets its captions back (tools/lab.py leaves video/index.html without them:
                         a render straight after a lab run once shipped a film with no captions)
2. the caption count in the page is checked against the timeline; zero stops the run
3. hyperframes check, then render to renders/<episode>-<version>.mp4
4. contact sheets in renders/review/<short>-<version>/ (tools/sheet.py)
5. the upload copy (H.264, crf 21, at most 9 Mbit/s) and a 720 px phone copy
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HF = 'npx --yes hyperframes@0.8.137'


def sh(cmd, cwd=ROOT):
    print('>', cmd if isinstance(cmd, str) else ' '.join(cmd), flush=True)
    subprocess.check_call(cmd, cwd=cwd, shell=isinstance(cmd, str))


def main():
    ep, ver = sys.argv[1].rstrip('/').rstrip(chr(92)), sys.argv[2]
    workers = sys.argv[sys.argv.index('--workers') + 1] if '--workers' in sys.argv else '2'
    name = os.path.basename(ep)
    short = 'ep' + name.split('-')[0]
    sh([sys.executable, 'tools/build.py', ep])
    page = open(os.path.join(ROOT, 'video', 'index.html'), encoding='utf-8').read()
    tl = json.loads(re.search(r'window\.TL = (\{.*?\});\n', page, re.S).group(1))
    if not tl['caps']:
        sys.exit('the page has no captions: do not render')
    print(f'{len(tl["caps"])} captions, {tl["dur"]} s', flush=True)
    video = os.path.join(ROOT, 'video')
    sh(HF + ' check', cwd=video)
    out = f'renders/{name}-{ver}.mp4'
    sh(f'{HF} render -o ../{out} --workers {workers}', cwd=video)
    review = f'renders/review/{short}-{ver}'
    os.makedirs(os.path.join(ROOT, review), exist_ok=True)
    sh([sys.executable, 'tools/sheet.py', out, review + '/sheet', '2', '8', '3'])
    up, phone = out.replace('.mp4', '-upload.mp4'), out.replace('.mp4', '-phone.mp4')
    sh(['ffmpeg', '-v', 'error', '-y', '-i', out, '-c:v', 'libx264', '-crf', '21', '-maxrate', '9M', '-bufsize', '18M',
        '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', up])
    sh(['ffmpeg', '-v', 'error', '-y', '-i', up, '-vf', 'scale=720:-2', '-c:v', 'libx264', '-crf', '26', '-preset', 'medium',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', phone])
    for f in (out, up, phone):
        print(f'{os.path.getsize(os.path.join(ROOT, f)) / 1e6:7.1f} MB  {f}')


if __name__ == '__main__':
    main()
