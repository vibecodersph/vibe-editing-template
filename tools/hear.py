"""Check that a finished cut says what the script says, by transcription.

    python tools/hear.py episodes/00-legit-developer renders/00-legit-developer-v1-upload.mp4 [--lines]

Extracts the film's audio, has Gemini transcribe it, and reports how many of the script's words were heard in the
finished mix (music and effects included). With --lines it also transcribes every voiced line file on its own.
Nobody on this pipeline can hear, so this and the loudness figures are the audio check.
The key is GEMINI_API_KEY from this folder's git-ignored .env (see .env.example) or the environment; it is never printed.
"""
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import urllib.request

MODEL = 'gemini-3.8-flash'


def key():
    env = {}
    f = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    if os.path.exists(f):
        for line in open(f, encoding='utf-8'):
            m = re.match(r'^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$', line)
            if m and m.group(2):
                env[m.group(1)] = m.group(2).strip('"\'')
    env.update({k: v for k, v in os.environ.items() if k == 'GEMINI_API_KEY'})
    return env.get('GEMINI_API_KEY') or sys.exit('GEMINI_API_KEY is not set: paste your key into .env (see .env.example)')


def norm(s):
    s = re.sub(r'\[[^\]]*\]', ' ', s)
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]+', ' ', s).split()


def transcribe(path, k):
    data = base64.b64encode(open(path, 'rb').read()).decode()
    body = json.dumps({'contents': [{'parts': [
        {'text': 'Transcribe the speech in this audio word for word. It is Taglish: Filipino with English words. '
                 'Write only the words that are spoken, in order, with no speaker names, no timestamps and no notes.'},
        {'inlineData': {'mimeType': 'audio/mp3', 'data': data}}]}],
        'generationConfig': {'temperature': 0, 'thinkingConfig': {'thinkingBudget': 0}}}).encode()
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={k}',
                                 data=body, headers={'Content-Type': 'application/json'})
    d = json.load(urllib.request.urlopen(req, timeout=300))
    return ' '.join(p.get('text', '') for p in d['candidates'][0]['content']['parts']).strip()


def main():
    ep, film = sys.argv[1], sys.argv[2]
    k = key()
    script = json.load(open(os.path.join(ep, 'script.json'), encoding='utf-8'))
    tmp = os.path.join(tempfile.gettempdir(), 'ksc_hear.mp3')
    subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', film, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', tmp])
    got = transcribe(tmp, k)
    want = norm(' '.join(l['text'] for l in script['lines']))
    heard = norm(got)
    hit = sum(1 for w in want if w in heard)
    print(f'mix: {hit}/{len(want)} script words heard ({hit / len(want):.0%})')
    print(got)
    first = norm(script['lines'][0]['text'])
    import difflib                                    # spelling differs between a script and a transcript ("ano'ng" and "anong"): compare loosely
    near = difflib.SequenceMatcher(None, ''.join(first), ''.join(heard[:len(first) + 1])[:len(''.join(first)) + 4]).ratio()
    print('first line:', f'heard ({near:.0%} match)' if near >= 0.8 else f'NOT clean at the start ({near:.0%}): ' + ' '.join(heard[:len(first) + 2]))
    if '--lines' in sys.argv:
        man = json.load(open(os.path.join(ep, 'audio', 'manifest.json'), encoding='utf-8'))['lines']
        for m in man:
            g = transcribe(os.path.join(ep, 'audio', m['file']), k)
            a = norm(m['text'])
            ok = sum(1 for w in a if w in norm(g)) / max(1, len(a))
            print(f"{'OK   ' if ok >= 0.8 else 'CHECK'} line {m['i']:02d} {ok:4.0%} [{m['who']}] {g[:90]}")


if __name__ == '__main__':
    main()
