"""Measure an episode against the floor set by the first Claude Kami episode (episode 1 below), the one that travelled.

    python tools/soundcheck.py episodes/00-legit-developer [episodes/01-your-episode ...]

Reads the mix stems that tools/build.py writes (audio/stems/*.wav), script.json and timeline.json, and prints:
  music on      share of the runtime with music audible          floor 85 percent   (episode 1: 90)
  music gap     how far the music sits under the dialogue, in dB  window 10 to 14    (episode 1: 11.8)
  room tone     an ambience or a continuous effect bed is there   required           (episode 1: yes)
  accents       timed sound effects per 10 seconds, beds left out floor 2.0          (episode 1: 2.2)
  cuts          camera cuts per 10 seconds                        floor 3.0          (episode 1: 3.7)
  music stop    at least one deliberate silence in the music      required           (episode 1: the crickets beat)
It exits non-zero when any line fails. Run it after build.py, before a render.

An episode with "mix": 2 in script.json (the dialogue-led mix) gets the same lines, with the music gap measured on the ducked
bed against a 15 to 26 dB window, and these more, measured on the stems build.py leaves in audio/stems/:
  speakers      Buloy against Claude, integrated LUFS of their lines in the dialogue  within 1.5 LU   (the mix aims at 0)
  voice/bed     the dialogue against the ducked bed while someone speaks            at least 15 dB  (the mix aims at 16 or more)
  loudest fx    the loudest effect against the dialogue's loudest moment and peak   at least 3 dB, or what the script asked for with
                an under_db below 3; an effect louder than the dialogue always fails
  ambience      the room tone (or a long bed effect) against the dialogue           20 to 32 dB   (about 25)
  final         the finished file's integrated loudness and true peak               -14 within 1 LU, true peak at or under -1 dBTP
"""
import json
import math
import os
import re
import struct
import subprocess
import sys

from build import ebur, in_windows

FLOOR = {'music_on': 0.85, 'gap_lo': 10.0, 'gap_hi': 14.0, 'accents': 2.0, 'cuts': 3.0}
MIX2 = {'gap_lo': 15.0, 'gap_hi': 26.0, 'balance': 1.5, 'bed': 15.0, 'fx': 3.0, 'amb_lo': 20.0, 'amb_hi': 32.0, 'lufs': 14.0, 'tp': -1.0}


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
    return float(m[-1]) if m else -70.0


def active(path, floor_db=-50.0, win=0.25):
    """Per-window on or off, from the RMS of a mono 16 kHz copy (8 kHz missed a bed of crickets, which lives above 4 kHz)."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    n = len(raw) // 2
    s = struct.unpack('<%dh' % n, raw[:n * 2])
    w = int(16000 * win)
    out = []
    for i in range(0, n - w, w):
        rms = math.sqrt(sum(x * x for x in s[i:i + w]) / w) / 32768
        out.append(20 * math.log10(rms + 1e-9) > floor_db)
    return out


def mix2_rows(sc, tl, st):
    """The rows of "mix": 2 (see the docstring); the stems are the ones build.py's mix_audio_v2 writes."""
    wav = lambda n: os.path.join(st, n)
    dlg = ebur(wav('dialogue.wav'))
    rows = []
    who = {w: [(x['s'], x['e']) for x in tl['lines'] if x['who'] == w] for w in ('viron', 'claude')}     # the character is "viron" on the page
    lu = {w: in_windows(wav('dialogue.wav'), v)['I'] for w, v in who.items() if v}
    if len(lu) == 2:
        diff = abs(lu['viron'] - lu['claude'])
        rows.append(('speakers', f"Buloy {lu['viron']:.1f}, Claude {lu['claude']:.1f} LUFS ({diff:.1f} LU apart)", diff <= MIX2['balance']))
    speech = [(x['s'], x['e']) for x in tl['lines']]
    bed = in_windows(wav('dialogue.wav'), speech)['I'] - in_windows(wav('music-ducked.wav'), speech)['I'] if ebur(wav('music.wav'))['I'] > -60 else None
    rows.append(('voice/bed', 'no music' if bed is None else f'{bed:.1f} dB under the dialogue', bed is None or bed >= MIX2['bed']))
    fx = sc.get('audio', {}).get('sfx', [])
    accents = [(k, e) for k, e in enumerate(fx) if e.get('dur', 0) < 6]
    worst = None                                              # the effect closest to the dialogue: (margin in dB, the lower of the moment and peak margins)
    for k, e in accents:
        r = ebur(wav(os.path.join('sfx', f'sfx_{k:02d}.wav')))
        m = min(dlg['M'] - r['M'], dlg['TP'] - r['TP'])
        if worst is None or m < worst[0]:
            worst = (m, os.path.basename(e['file']))
    if worst:
        need = max(0.0, min([MIX2['fx']] + [e.get('under_db', 6) for _, e in accents]))     # the script may ask for less than 3 dB with an under_db below 3
        rows.append(('loudest fx', f'{worst[1]} {worst[0]:.1f} dB under the dialogue (needs {need:.1f})', worst[0] >= need - 0.5))
    beds = [wav('ambience.wav')] if sc.get('audio', {}).get('ambience') else [wav(os.path.join('sfx', f'sfx_{k:02d}.wav')) for k, e in enumerate(fx) if e.get('dur', 0) >= 6]
    if beds:
        amb = dlg['I'] - max(ebur(b)['I'] for b in beds)
        rows.append(('ambience', f'{amb:.1f} dB under', MIX2['amb_lo'] <= amb <= MIX2['amb_hi']))
    fin = ebur(wav('mix-final.mp3'))
    rows.append(('final', f"{fin['I']:.1f} LUFS, true peak {fin['TP']:.1f} dBTP", abs(fin['I'] + MIX2['lufs']) <= 1.0 and fin['TP'] <= MIX2['tp']))
    return rows


def check(ep):
    sc = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    tl = json.load(open(os.path.join(ep, 'timeline.json'), encoding='utf-8'))
    st = os.path.join(ep, 'audio', 'stems')
    dur = tl['dur']
    mus = active(os.path.join(st, 'music.wav'))
    music_on = sum(mus) / max(1, len(mus))
    mix2 = sc.get('mix') == 2
    gap = lufs(os.path.join(st, 'dialogue.wav')) - lufs(os.path.join(st, 'music-ducked.wav' if mix2 else 'music.wav'))
    lo, hi = (MIX2['gap_lo'], MIX2['gap_hi']) if mix2 else (FLOOR['gap_lo'], FLOOR['gap_hi'])
    amb = active(os.path.join(st, 'ambience.wav')) if os.path.exists(os.path.join(st, 'ambience.wav')) else []
    sfx = sc.get('audio', {}).get('sfx', [])
    beds = [x for x in sfx if x.get('dur', 0) >= 6]                      # a long effect is a bed, not an accent
    room = (sum(amb) / max(1, len(amb)) > 0.5) or any(x.get('dur', 0) >= 0.6 * dur for x in beds)
    accents = (len(sfx) - len(beds)) / dur * 10
    cuts = len(tl['shots']) / dur * 10
    # a deliberate stop: a run of at least 0.75 s with no music, away from the first and last second
    gaps, run = 0, 0
    for k, on in enumerate(mus):
        t = k * 0.25
        if not on and 1.0 < t < dur - 3.5:
            run += 1
        else:
            gaps += run >= 3
            run = 0
    rows = [('music on', f'{music_on:.0%}', music_on >= FLOOR['music_on']),
            ('music gap', f'{gap:.1f} dB under', lo <= gap <= hi),
            ('room tone', 'yes' if room else 'no', room),
            ('accents', f'{accents:.1f} per 10 s ({len(sfx) - len(beds)} in {dur:.0f} s)', accents >= FLOOR['accents']),
            ('cuts', f'{cuts:.1f} per 10 s', cuts >= FLOOR['cuts']),
            ('music stop', f'{gaps} deliberate', gaps >= 1)]
    if mix2:
        rows += mix2_rows(sc, tl, st)
    print(os.path.basename(ep.rstrip('/').rstrip(chr(92))))
    for name, val, ok in rows:
        print(f"  {'ok  ' if ok else 'FAIL'} {name:11s} {val}")
    return all(ok for _, _, ok in rows)


if __name__ == '__main__':
    res = [check(e) for e in sys.argv[1:]]
    sys.exit(0 if all(res) else 1)
