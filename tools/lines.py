"""Keep the voiced files in step when a line is removed from or added to script.json, so voice.py does not re-voice the rest.

    python tools/lines.py drop   episodes/NN-slug <index>     the line at <index> is gone: later files and manifest entries move up one
    python tools/lines.py insert episodes/NN-slug <index>     a new line now sits at <index>: later files and entries move down one

Edit script.json yourself (remove or add the line, and fix any audio anchors that name later line numbers), then run this, then
voice.py (it voices only the new line). Files are audio/line_NN.mp3 and their .orig.mp3 copies from tempo.py.
"""
import json
import os
import sys


def main():
    if len(sys.argv) != 4 or sys.argv[1] not in ('drop', 'insert'):
        sys.exit(__doc__)
    op, ep, idx = sys.argv[1], sys.argv[2], int(sys.argv[3])
    ad = os.path.join(ep, 'audio')
    mp = os.path.join(ad, 'manifest.json')
    man = json.load(open(mp, encoding='utf-8'))
    name = lambda i, orig=False: os.path.join(ad, f'line_{i:02d}' + ('.orig' if orig else '') + '.mp3')
    lines = sorted(man['lines'], key=lambda m: m['i'])
    if op == 'drop':
        for o in (False, True):
            if os.path.exists(name(idx, o)):
                os.remove(name(idx, o))
        lines = [m for m in lines if m['i'] != idx]
        for m in lines:
            if m['i'] > idx:
                for o in (False, True):
                    if os.path.exists(name(m['i'], o)):
                        os.replace(name(m['i'], o), name(m['i'] - 1, o))
                m['i'] -= 1
                m['file'] = f"line_{m['i']:02d}.mp3"
    else:
        for m in reversed(lines):
            if m['i'] >= idx:
                for o in (False, True):
                    if os.path.exists(name(m['i'], o)):
                        os.replace(name(m['i'], o), name(m['i'] + 1, o))
                m['i'] += 1
                m['file'] = f"line_{m['i']:02d}.mp3"
    man['lines'] = lines
    json.dump(man, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{op} {idx}: {len(lines)} voiced lines now, indexes {[m["i"] for m in lines]}')


if __name__ == '__main__':
    main()
