"""The canon gate: check an episode against docs/canon.md before the render and again before the packet.

    python tools/check_canon.py episodes/NN-slug [--strict]

Reads episodes/NN-slug/script.json, and timeline.json and publish/ when they exist. Prints one line per check,
PASS, FAIL, WARN or SKIP with its rule id, then RESULT: PASS or RESULT: FAIL; the exit status is 1 on FAIL.

- FAIL: a binding rule is broken. Fix the episode; never the limit.
- WARN: a rule in PROPOSED below is not met (written in the canon but not yet approved). When the owner approves one, its id
  leaves the set in the same commit as the canon change. A script with no "formula" block gets one WARN and the formula rows
  (CK-04, CK-07, CK-08, CK-21) are not run.
- SKIP: the check needs a person or a file that does not exist yet (timeline.json before the build). With --strict, before
  packing, a SKIP fails unless script.json's "formula" block records who did it:
  "checked": {"CK-12": "I read the lines in the thread, 2026-10-19"}.
- WAIVED: a FAIL that the owner excused for this one episode, recorded in script.json's "formula" block with their words and
  the date: "waived": {"CK-07": "..."}. The limit does not move and the row still prints what failed; an empty waiver is
  ignored and the rule FAILs.

CK-07 binds as: the tanong is Claude's and starts by 4.0 s, comes before the amin, and the amin starts by 8.0 s; the amin is
the character's first reply after the tanong, of any length, or else a reply of one to four words.

What it cannot judge (is it funny, is the Taglish natural, does the face act the line) stays with a person and the critic.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The formula's additions, binding only on the owner's yes (docs/canon.md). Empty this set when they approve, with the date.
PROPOSED = set()

HUMAN = {'CK-11': 'the Taglish reads as a native speaker says it (the lead, then the script critic)',
         'CK-12': 'a person read the lines before they were voiced',
         'CK-19': 'the speaker is on screen for his whole line and every sign is whole (the lead, at full size)'}
FORMULA_KEYS = ('sapatos', 'palusot', 'tanong', 'amin', 'bisita', 'linya', 'button', 'caption', 'gag')

# The counting gate's number words. "isang" (the article) and "daan" (road) are left out for the same reasons.
NUMBER_WORDS = r"""
isa dalawa dalawang tatlo tatlong apat apatnaraan\w* lima limang anim animnaraan\w* pito pitong walo walong
siyam siyam\w* sampu sampung labing-?(?:isa|dalawa|tatlo|apat|lima|anim|pito|walo|siyam)\w* labindalawa\w* labintatlo\w* labinlima\w* labinsiyam\w* labimpito\w*
dalawampu\w* tatlumpu\w* apatnapu\w* limampu\w* animnapu\w* pitumpu\w* walumpu\w* siyamnapu\w* daang libo libong milyon
one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen
seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million first second third
""".split()
NUMBER_RE = re.compile(r"\b(" + "|".join(NUMBER_WORDS) + r")\b", re.I)


def spoken(text):
    """The words of a line without its v4 tags."""
    return re.sub(r'\[[^\]]*\]', '', text or '').strip()


def words(text):
    return [w for w in re.split(r'\s+', spoken(text)) if re.search(r'\w', w)]


class Gate:
    def __init__(self, strict, checked, waived=None):
        self.rows, self.strict, self.checked = [], strict, checked
        self.waived = {k: v for k, v in (waived or {}).items() if isinstance(v, str) and v.strip()}

    def add(self, rule, ok, msg, skip=False):
        if skip:
            state = 'SKIP'
            if rule in self.checked:
                state, msg = 'PASS', f'{msg} (checked: {self.checked[rule]})'
        elif ok:
            state = 'PASS'
        else:
            state = 'WARN' if rule in PROPOSED else 'FAIL'
            if state == 'FAIL' and rule in self.waived:   # the owner's own exception for this episode; the limit stays
                state, msg = 'WAIVED', f'{msg} (waived: {self.waived[rule]})'
        self.rows.append((state, rule, msg))

    def result(self):
        bad = [r for r in self.rows if r[0] == 'FAIL' or (self.strict and r[0] == 'SKIP')]
        return 'FAIL' if bad else 'PASS'


def main():
    argv = sys.argv[1:]
    strict = '--strict' in argv
    argv = [a for a in argv if a != '--strict']
    if len(argv) != 1:
        sys.exit(__doc__)
    ep = os.path.normpath(argv[0] if os.path.isabs(argv[0]) else os.path.join(os.getcwd(), argv[0]))
    if not os.path.exists(os.path.join(ep, 'script.json')):
        ep = os.path.join(ROOT, 'episodes', os.path.basename(argv[0].rstrip('/\\')))
    name = os.path.basename(ep)
    sc = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    tl_path = os.path.join(ep, 'timeline.json')
    tl = json.load(open(tl_path, encoding='utf-8')) if os.path.exists(tl_path) else None
    lines = sc.get('lines', [])
    f = sc.get('formula') or {}
    g = Gate(strict, f.get('checked') or {}, f.get('waived'))
    todo = lambda v: v in (None, '', []) or (isinstance(v, str) and v.startswith('TODO'))

    # CK-04 the formula block
    if not f:
        g.rows.append(('WARN', 'CK-04', 'script.json has no "formula" block: the formula rows (CK-04, CK-07, CK-08, CK-21) were not checked'))
    else:
        missing = [k for k in FORMULA_KEYS if todo(f.get(k))]
        g.add('CK-04', not missing, 'formula block complete' if not missing else f'formula block missing: {", ".join(missing)}')
        banks = {}
        for bank in ('sapatos', 'palusot'):
            p = os.path.join(ROOT, 'data', 'formula', bank + '.json')
            banks[bank] = {x['id'] for x in json.load(open(p, encoding='utf-8'))[bank]} if os.path.exists(p) else set()
        for bank in ('sapatos', 'palusot'):
            if not todo(f.get(bank)):
                g.add('CK-04', f[bank] in banks[bank], f'{bank} "{f[bank]}" is in data/formula/{bank}.json'
                      if f[bank] in banks[bank] else f'{bank} "{f[bank]}" is not in the bank: add it there first')

    # CK-05 the hook
    g.add('CK-05', sc.get('hook_caption') in ('whole', 'all'), f'hook_caption is {sc.get("hook_caption")!r} (whole or all)')
    hook = spoken(lines[0]['text']) if lines else ''
    g.add('CK-05', bool(hook) and len(hook) <= 70, f'first line is {len(hook)} characters (at most 70): "{hook}"')
    g.add('CK-05', not todo(sc.get('open_shot')), f'open_shot {sc.get("open_shot")!r}')
    g.add('CK-05', False, 'frame 0 says the situation with the sound off, the stake above the bottom fifth', skip=True)

    # CK-06 Claude stays honest
    g.add('CK-06', False, 'Claude never flatters, promises or pitches (the critic)', skip=True)

    # CK-07 the tanong and the amin
    starts = [x.get('s') for x in tl['lines']] if tl else None
    ends = [x.get('e') for x in tl['lines']] if tl else None
    ti, ai = f.get('tanong'), f.get('amin')
    bai = lambda w: w in ('viron', 'buloy')          # who the character's lines carry: "buloy", or "viron", the page's internal id
    nick = 'Buloy'
    if not f:
        pass
    elif isinstance(ti, int) and isinstance(ai, int) and 0 <= ti < len(lines) and 0 < ai < len(lines):
        g.add('CK-07', lines[ti].get('who') == 'claude', f'the tanong (line {ti}) is {lines[ti].get("who")}\'s, Claude\'s by the formula')
        aw = words(lines[ai]['text'])
        said = f'the amin (line {ai}) is {lines[ai].get("who")}\'s, {len(aw)} word(s): "{spoken(lines[ai]["text"])}"'
        first = not any(bai(l.get('who')) for l in lines[ti + 1:ai])
        g.add('CK-07', bai(lines[ai].get('who')) and (first or 1 <= len(aw) <= 4), f'{said} ({nick}\'s first reply after the tanong, or one to four words)')
        g.add('CK-07', ti < ai, f'the tanong (line {ti}) comes before the amin (line {ai})')
        if starts:
            g.add('CK-07', starts[ti] <= 4.0, f'the tanong starts at {starts[ti]:.2f} s (by 4.0)')
            gap = starts[ai] - ends[ai - 1]
            g.add('CK-07', starts[ai] <= 8.0, f'the amin starts at {starts[ai]:.2f} s (by 8.0)')
            g.add('CK-07', False, f'the amin lands, held or snapped ({gap:.2f} s before it; a held reaction runs about 1.8 s, a '
                                  'snapped 0.32)', skip=True)
        else:
            g.add('CK-07', False, 'the tanong by 4 s and the amin by 8 s: no timeline.json yet (build first)', skip=True)
    elif ai == 0:
        g.add('CK-07', False, 'the amin is line 0, the hook: the formula wants Claude\'s tanong first and Buloy\'s amin after it')
    else:
        g.add('CK-07', False, 'formula "tanong" and "amin" must be line numbers')

    # CK-08 the linya, then the button, before the card
    li, bi = f.get('linya'), f.get('button')
    if isinstance(li, list) and li and all(isinstance(x, int) for x in li) and isinstance(bi, int):
        ok = max(li) < bi <= len(lines) - 1
        g.add('CK-08', ok, f'linya at lines {li}, button at line {bi}, card line {len(lines) - 1}')
        g.add('CK-08', len(li) == 2 and len({lines[x].get('who') for x in li if x < len(lines)}) == 2,
              'the linya is a pair said by two characters')
    elif not f:
        g.add('CK-08', False, 'no formula block to name the linya and the button; read them by eye', skip=True)
    else:
        g.add('CK-08', False, 'formula "linya" must be a pair of line numbers and "button" a line number')

    # CK-09 two-hander, length
    two = sum(bai(l.get('who')) or l.get('who') == 'claude' for l in lines)
    g.add('CK-09', lines and two * 2 >= len(lines), f'{nick} and Claude speak {two} of {len(lines)} lines (at least half)')
    if tl:
        g.add('CK-09', 40 <= tl['dur'] <= 55, f'length {tl["dur"]:.1f} s (40 to 55)')
    else:
        g.add('CK-09', False, 'length: no timeline.json yet', skip=True)

    # CK-11, CK-12, CK-19: people
    for rule, what in HUMAN.items():
        g.add(rule, False, what, skip=True)

    # CK-13 no counting
    hits = []
    for i, l in enumerate(lines):
        for field in ('text', 'say'):
            t = spoken(l.get(field))
            if re.search(r'\d', t):
                hits.append(f'line {i} numeral: "{t}"')
            hits += [f'line {i} "{m.group(0)}": "{t}"' for m in NUMBER_RE.finditer(t)]
    g.add('CK-13', not hits, 'no counting in spoken lines' if not hits else 'counting: ' + '; '.join(hits))

    # CK-14 voices: every speaker has one
    v = sc.get('voices', {})
    speakers = sorted({l.get('who') for l in lines if l.get('who')})
    nov = [w for w in speakers if todo((v[w] if isinstance(v.get(w), dict) else {}).get('voice_id'))]
    g.add('CK-14', not nov, f'every speaker has a voice_id in "voices" ({", ".join(speakers)})' if not nov
          else f'no voice_id in "voices" for: {", ".join(nov)}')

    # CK-17 the sound recipe's shape (the floor itself is tools/soundcheck.py)
    a = sc.get('audio', {})
    music = a.get('music') or a.get('music_cues')
    stop = bool(a.get('music', {}).get('stop')) or len(a.get('music_cues') or []) >= 2
    g.add('CK-17', bool(music) and stop, 'a music bed with a deliberate stop' if music and stop else 'no music bed, or no stop in it')
    amb = (a.get('ambience') or {}).get('file', '')
    if not amb:  # a room tone laid as one long effect from the start (episode 6's rain) counts
        amb = next((x['file'] for x in a.get('sfx') or [] if (x.get('at') or {}).get('t', 99) <= 1
                    and (x.get('dur') or 0) >= 30), '')
    g.add('CK-17', bool(amb) and not amb.startswith('TODO'), f'room tone {amb!r}')
    g.add('CK-17', len(a.get('sfx') or []) >= 1, f'{len(a.get("sfx") or [])} effect(s); the floor is tools/soundcheck.py')

    # CK-20 the card
    em = sc.get('end_message') or []
    rows_ok = 2 <= len(em) <= 3 and all(len(r) <= 24 for r in em)
    g.add('CK-20', rows_ok, f'end_message {em} (two or three rows, at most 24 characters each)')
    g.add('CK-20', bool(lines) and lines[-1].get('card') is True, 'the last line plays over the card (card: true)')

    # CK-21 the hidden gag
    if f:
        g.add('CK-21', not todo(f.get('gag')), f'hidden gag: {f.get("gag")!r}')

    print(f'Claude Kami canon gate: {name}' + (' (strict)' if strict else ''))
    for state, rule, msg in g.rows:
        print(f'  {state:<4} {rule:<6} {msg}')
    counts = {s: sum(r[0] == s for r in g.rows) for s in ('PASS', 'FAIL', 'WARN', 'SKIP', 'WAIVED')}
    print('  ' + ', '.join(f'{v} {k}' for k, v in counts.items()))
    res = g.result()
    print(f'RESULT: {res}')
    sys.exit(0 if res == 'PASS' else 1)


if __name__ == '__main__':
    main()
