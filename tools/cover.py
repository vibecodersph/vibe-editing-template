"""Make the episode's cover: a frame drawn by the same engine, with the hook set in type over it.

  python tools/cover.py <episode-dir> [--at 6.9] [--shot cover]

The frame comes from the film's own scene at a chosen moment, through the 'cover' camera set-up and with
captions off, so the cover always matches the episode. Everything that matters sits inside the central
3:4 of the 9:16 frame, because that is what the Instagram grid shows.
Writes renders/<episode>-cover.png (1080x1920) and -cover-3x4.jpg (the grid crop, to check it).
"""
import json
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'video')
FONT = os.path.join(VIDEO, 'assets', 'fonts', 'Fraunces.ttf')
_SERIES = os.path.join(ROOT, 'series.json')
LOGO = ((json.load(open(_SERIES, encoding='utf-8')) if os.path.exists(_SERIES) else {}).get('card') or {}).get('logo')    # relative to video/; none (or no such file): the cover has no lockup
if LOGO and not os.path.exists(os.path.join(VIDEO, LOGO)):
    LOGO = None


def fraunces(size, weight):
    f = ImageFont.truetype(FONT, size)
    axes = f.get_variation_axes()
    vals = []
    for a in axes:
        name = a['name'].decode() if isinstance(a['name'], bytes) else a['name']
        if 'eight' in name:            # Weight
            vals.append(weight)
        elif 'ptical' in name:         # Optical size
            vals.append(min(144, max(9, size)))
        else:
            vals.append(a['default'])
    f.set_variation_by_axes(vals)
    return f


def main():
    ep = sys.argv[1]
    args = sys.argv[2:]
    at = args[args.index('--at') + 1] if '--at' in args else '6.9'
    shot = args[args.index('--shot') + 1] if '--shot' in args else 'cover'
    name = os.path.basename(os.path.normpath(ep))
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    cov = script.get('cover', {})

    # the frame: build in cover mode, take one snapshot, then put the film's own page back
    subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'build.py'), ep, '--cover', shot], stdout=subprocess.DEVNULL)
    snaps = os.path.join(VIDEO, 'snapshots')
    shutil.rmtree(snaps, ignore_errors=True)
    subprocess.check_call('npx --yes hyperframes@0.8.137 snapshot --at ' + at + ' --no-end --describe false', cwd=VIDEO, shell=True,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frame = [f for f in sorted(os.listdir(snaps)) if f.startswith('frame-')][0]
    im = Image.open(os.path.join(snaps, frame)).convert('RGB').resize((1080, 1920), Image.NEAREST)
    subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'build.py'), ep], stdout=subprocess.DEVNULL)

    # a soft dark wash behind the type, top of the safe area only
    wash = Image.new('L', (1080, 1920), 0)
    d = ImageDraw.Draw(wash)
    for y in range(240, 900):
        k = 1.0 if y < 640 else max(0.0, 1 - (y - 640) / 260)
        d.line([(0, y), (1080, y)], fill=int(150 * k * min(1.0, (y - 240) / 80)))
    im = Image.composite(Image.new('RGB', im.size, (24, 14, 46)), im, wash.filter(ImageFilter.GaussianBlur(18)))

    d = ImageDraw.Draw(im)
    ink = (22, 12, 44)
    kicker, lines, accent = cov.get('kicker', 'CLAUDE KAMI'), cov.get('lines', [script.get('title', '')]), cov.get('accent', -1)
    y = 330
    kf = fraunces(40, 700)
    if kicker:
        d.text((540, y), kicker, font=kf, fill=(244, 239, 255), anchor='ma', stroke_width=5, stroke_fill=ink)
        y += 74
    else:
        y += 20
    for i, text in enumerate(lines):
        size = 150
        f = fraunces(size, 900)
        while d.textlength(text, font=f) > 930 and size > 60:
            size -= 4
            f = fraunces(size, 900)
        col = (255, 214, 90) if (i == accent or (accent == -1 and i == len(lines) - 1)) else (255, 255, 255)
        d.text((540, y), text, font=f, fill=col, anchor='ma', stroke_width=11, stroke_fill=ink)
        y += int(size * 1.06)

    # the lockup, low in the safe area
    if LOGO:
        lock = Image.open(os.path.join(VIDEO, LOGO)).convert('RGBA')
        bbox = lock.getbbox()
        lock = lock.crop(bbox)
        w = 600
        lock = lock.resize((w, int(lock.height * w / lock.width)), Image.LANCZOS)
        shadow = Image.new('RGBA', lock.size, (22, 12, 44, 0))
        shadow.putalpha(lock.getchannel('A').filter(ImageFilter.GaussianBlur(6)))
        px, py = (1080 - w) // 2, 1500
        im.paste(shadow, (px, py + 4), shadow)
        im.paste(shadow, (px, py + 4), shadow)
        im.paste(lock, (px, py), lock)

    out = os.path.join(ROOT, 'renders', name + '-cover.png')
    im.save(out)
    im.crop((33, 285, 1047, 1635)).save(out.replace('.png', '-3x4.jpg'), quality=90)
    print(out)


if __name__ == '__main__':
    main()
