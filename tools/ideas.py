"""List fresh Claude Kami premises from the formula's banks: a pair of shoes and a palusot nobody has used.

    python tools/ideas.py [--n 5] [--date YYYY-MM-DD] [--wild 0|1|2] [--reuse] [--palusot ID] [--sapatos ID] [--json] [--count]

The formula is docs/formula.md: the joke's engine is fixed, and each episode changes its timpla, the sapatos (place, role,
who arrives, the stake prop) and the palusot (the shortcut Buloy is caught in). The banks are data/formula/sapatos.json
and data/formula/palusot.json. A pair is used once: the pairs already used are in data/formula/used.json, later
ones are read from each episode's script.json "formula" block.

A pair fits when the shoes share the palusot's home tag (the first of its 'fits'). Each fresh pair is scored (the
weights are predictions, to be corrected against the scoreboard):
  fit         3 when the shoes list the palusot in 'best_with' (the lead's judgement of a natural pair), else 1
  viewer x2   how many of the audience have taken this shortcut (palusot 'viewer', 0 to 2)
  frame       how fast a stranger reads the place on frame 0 (0 to 2)
  build       a set that exists 2, a small room from existing assets 1, a new set 0
  wild        how far from daily life (0 to 2), times --wild (default 1)
  season      2 when the date falls in the place's season window, or within three weeks before it
  rest        1 when the palusot was not used in the last three episodes, and 1 when the set was not used in the last two
The list never repeats a palusot or a place, so five ideas are five different episodes. A shortcut an earlier episode used
may come back in new shoes (the formula's point: same story, different sapatos); its card says so. Nothing is written or spent.
--count prints how many fresh pairs are left. --reuse keeps only places with a built set.
"""
import datetime
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'formula')
EPS = os.path.join(ROOT, 'episodes')


def load(name):
    with open(os.path.join(DATA, name), encoding='utf-8') as f:
        return json.load(f)


def used_pairs():
    """Every (sapatos, palusot) already made, in episode order."""
    out = [(u['episode'], u['sapatos'], u['palusot']) for u in load('used.json')['episodes']]
    seen = {e for e, _, _ in out}
    for d in sorted(os.listdir(EPS)):
        if not re.match(r'^\d\d-', d) or d in seen:
            continue
        p = os.path.join(EPS, d, 'script.json')
        if not os.path.exists(p):
            continue
        f = json.load(open(p, encoding='utf-8')).get('formula') or {}
        if f.get('sapatos') and f.get('palusot') and not str(f['sapatos']).startswith('TODO'):
            out.append((d, f['sapatos'], f['palusot']))
    return out


def in_season(windows, day):
    """True when day is inside a window, or up to three weeks before it opens."""
    for a, b in windows or []:
        for year in (day.year - 1, day.year, day.year + 1):
            start = datetime.date(year, int(a[:2]), int(a[3:]))
            end = datetime.date(year if b >= a else year + 1, int(b[:2]), int(b[3:]))
            if start - datetime.timedelta(days=21) <= day <= end:
                return True
    return False


def score(s, p, day, wild_w, recent_p, recent_set):
    parts = {
        'fit': 3 if p['id'] in s.get('best_with', []) else 1,
        'viewer': 2 * p['viewer'],
        'frame': s['frame'],
        'build': {'new': 0, 'small': 1}.get(s['set'], 2),
        'wild': wild_w * s['wild'],
        'season': 2 if in_season(s.get('season'), day) else 0,
        'rest': (0 if p['id'] in recent_p else 1) + (0 if s['set'] in recent_set else 1),
    }
    return sum(parts.values()), parts


def candidates(opt):
    sap = {s['id']: s for s in load('sapatos.json')['sapatos']}
    pal = {p['id']: p for p in load('palusot.json')['palusot'] if not p.get('retired')}
    used = used_pairs()
    made = {(s, p) for _, s, p in used}
    recent_p = {p for _, _, p in used[-3:]}
    recent_set = {sap[s]['set'] for _, s, _ in used[-2:] if s in sap}
    day = opt['date']
    out = []
    for s in sap.values():
        if opt['reuse'] and s['set'] in ('new', 'small'):
            continue
        if opt['sapatos'] and s['id'] != opt['sapatos']:
            continue
        for p in pal.values():
            if opt['palusot'] and p['id'] != opt['palusot']:
                continue
            if (s['id'], p['id']) in made:
                continue
            if p['id'] not in s.get('best_with', []) and p['fits'][0] not in s['tags']:
                continue
            total, parts = score(s, p, day, opt['wild'], recent_p, recent_set)
            out.append((total, s, p, parts))
    out.sort(key=lambda x: (-x[0], x[2]['id'], x[1]['id']))
    return out, used


def pick(cands, n):
    """The best n with no palusot and no place twice."""
    chosen, ps, ss = [], set(), set()
    for c in cands:
        if c[1]['id'] in ss or c[2]['id'] in ps:
            continue
        chosen.append(c)
        ps.add(c[2]['id'])
        ss.add(c[1]['id'])
        if len(chosen) == n:
            break
    return chosen


def card(i, c, used=()):
    total, s, p, parts = c
    build = {'new': 'a new set (a builder session)', 'small': 'a small room from existing assets'}.get(s['set'], f"the {s['set']} set, built")
    lines = [
        f"### {i}. {p['title']}, at {s['place']}  (score {total}: " + ', '.join(f'{k} {v}' for k, v in parts.items()) + ')',
        f"- Shoes: {s['place']}; Buloy is {s['buloy']}. Build: {build}.",
        f"- Palusot: {p['what']}.",
        f"- Bisita: {s['bisita']}. Frame 0: {s['stake_prop']}, with the hook whole on screen.",
        f"- Seeds (rewrite in the script): hook \"{p['hook_seed']}\" / tanong \"{p['tanong_seed']}\" / amin \"{p['amin_seed']}\"",
        f"- The plain fix: {p['plain_fix']}. Card seed: \"{' '.join(p['card_seed'])}\"",
    ]
    before = [e for e, _, pid in used if pid == p['id']]
    if before:
        lines.append(f"- Re-run: the shortcut of episode {', '.join(e[:2].lstrip('0') for e in before)}, in new shoes; "
                     "the hook, the bisita and the button must be new.")
    watch = [w for w in (s.get('watch'), p.get('watch'), p.get('frame_note')) if w]
    if watch:
        lines.append('- Watch: ' + '; '.join(watch) + '.')
    lines.append(f"- formula block: \"sapatos\": \"{s['id']}\", \"palusot\": \"{p['id']}\"")
    return '\n'.join(lines)


def main():
    argv = sys.argv[1:]
    opt = {'n': 5, 'date': datetime.date.today(), 'wild': 1, 'reuse': False, 'palusot': None, 'sapatos': None}
    flags = {'--json': False, '--count': False}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in flags:
            flags[a] = True
        elif a == '--reuse':
            opt['reuse'] = True
        elif a in ('--n', '--wild'):
            opt[a[2:]] = int(argv[i + 1])
            i += 1
        elif a == '--date':
            opt['date'] = datetime.date.fromisoformat(argv[i + 1])
            i += 1
        elif a in ('--palusot', '--sapatos'):
            opt[a[2:]] = argv[i + 1]
            i += 1
        else:
            sys.exit(__doc__)
        i += 1
    cands, used = candidates(opt)
    if flags['--count']:
        sap = len(load('sapatos.json')['sapatos'])
        pal = len([p for p in load('palusot.json')['palusot'] if not p.get('retired')])
        print(f'{len(cands)} fresh pairs that fit, from {sap} places and {pal} shortcuts; {len(used)} episodes made.')
        return
    chosen = pick(cands, opt['n'])
    if flags['--json']:
        print(json.dumps([{'score': c[0], 'parts': c[3], 'sapatos': c[1], 'palusot': c[2]} for c in chosen], ensure_ascii=False, indent=2))
        return
    print(f"Fresh Claude Kami premises for {opt['date'].isoformat()} ({len(cands)} fresh pairs fit; the best {len(chosen)} with no palusot or place twice)\n")
    for k, c in enumerate(chosen, 1):
        print(card(k, c, used))
        print()


if __name__ == '__main__':
    main()
