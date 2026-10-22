"""Start an episode folder: the voices, the sound recipe's skeleton, and nothing else.

    python tools/new_episode.py 07-my-episode "My Episode" [--from 05-other-episode] [--set videoke]
        [--sapatos ID] [--palusot ID]

NN is the next unused number under episodes/ (the rs02-* folders belong to another series). Writes episodes/NN-slug/script.json with:
the voices from series.json "voices" (or copied from --from, an earlier episode), "set" if given (none means the store), one stub
line, the hook and card keys, "mix": 2 (the dialogue-led mix, tools/build.py and tools/soundcheck.py) and an audio block shaped
like a finished recipe (one bed with a stop, a room tone, an accent). It posts and voices nothing. It also writes an empty
"formula" block (docs/formula.md): pick the pair with tools/ideas.py and pass it as --sapatos and --palusot, or fill it in by hand.
The character's voice key and his lines' "who" are "buloy" (the build gives the page its internal id "viron").
Fill in lines from the script note, then: check_canon.py, voice.py, build.py, soundcheck.py, qa.py, render.py (see AGENTS.md).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPS = os.path.join(ROOT, 'episodes')
FORMULA = ('sapatos', 'palusot', 'tanong', 'amin', 'bisita', 'linya', 'button', 'caption', 'gag')


def main():
    argv = sys.argv[1:]
    opt = {}
    for k in ('--from', '--set', '--sapatos', '--palusot'):
        if k in argv:
            i = argv.index(k)
            opt[k] = argv[i + 1]
            del argv[i:i + 2]
    if len(argv) < 2:
        sys.exit(__doc__)
    slug, title = argv[0], argv[1]
    if not re.match(r'^\d\d-[a-z0-9-]+$', slug):
        sys.exit('name the folder NN-slug in lowercase kebab, for example 07-ai-naman-ang-gagawa')
    numbered = sorted(d for d in os.listdir(EPS) if re.match(r'^\d\d-', d))
    if slug[:2] in [d[:2] for d in numbered]:
        sys.exit(f'episode number {slug[:2]} is taken: {[d for d in numbered if d[:2] == slug[:2]]}')
    src = opt.get('--from')
    if src:
        voices = dict(json.load(open(os.path.join(EPS, src, 'script.json'), encoding='utf-8'))['voices'])
    else:
        path = os.path.join(ROOT, 'series.json')
        voices = (json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}).get('voices')
        if not voices:
            sys.exit('series.json has no "voices": add {"buloy": {"voice_id": ...}, "claude": {"voice_id": ...}} (see .env.example and series.json)')
        if not all(isinstance(v, dict) and v.get('voice_id') for v in voices.values()):
            sys.exit('series.json "voices" need a voice_id each: pick voices your ElevenLabs account can use first (the vibe-editing-setup skill helps)')
    out = os.path.join(EPS, slug)
    os.makedirs(os.path.join(out, 'audio'), exist_ok=False)
    script = {'title': title}
    if opt.get('--set'):
        script['set'] = opt['--set']
    who = 'buloy'                                         # the key of the character's voice and of his lines
    formula = {k: 'TODO' for k in FORMULA}
    formula.update({k: opt['--' + k] for k in ('sapatos', 'palusot') if opt.get('--' + k)})
    formula['checked'] = {}
    script['mix'] = 2                                     # the dialogue-led mix (tools/build.py)
    script.update({
        'formula': formula,
        'voices': voices,
        'open_shot': 'TODO: the camera of frame 0',
        'hook_caption': 'whole',
        'end_message': ['TODO: the card line', 'TODO: its second row'],
        'lines': [{'who': who, 'shot': 'TODO', 'act': 'b_hook', 'text': 'TODO: the hook', 'pre': 0.2}],
        'audio': {
            'music': {'file': 'audio-lib/music/lofi-bed.mp3', 'offset': 0.2, 'under_db': 13,
                      'stop': {'line': 1, 'edge': 'end', 'offset': 0.02}, 'resume': {'line': 2, 'edge': 'end', 'offset': 0.5}},
            'ambience': {'file': 'audio-lib/sfx/amb-morning-fan-long.wav', 'under_db': 22},
            'sfx': [{'file': 'audio-lib/sfx/scratch-stop.mp3', 'at': {'line': 1, 'edge': 'end', 'offset': -0.02}, 'under_db': 8}],
        },
    })
    au = script['audio']                                  # mix 2 reads under_db against the measured dialogue: the bed 14 under (then ducked), the room 25, an accent 6 under its loudest moment
    au['music']['under_db'], au['ambience']['under_db'], au['sfx'][0]['under_db'] = 14, 25, 6
    json.dump(script, open(os.path.join(out, 'script.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=2)
    print(f'episodes/{slug}/script.json written. Voices: {", ".join(voices)}; "mix": 2.')
    print('Next: fill in the lines and the formula block; python tools/check_canon.py episodes/' + slug
          + ', then read the lines yourself, then python tools/voice.py episodes/' + slug)


if __name__ == '__main__':
    main()
