"""Ask Gemini what a sound file sounds like, one sentence each. For generated effects and beds, which nobody on this pipeline can hear.

    python tools/describe.py audio-lib/sfx/court-buzzer.mp3 [more files ...]

What it is good for: catching SPEECH in a sound that must have none (a generated room tone once came back with a man saying
"What's up, man?"), a sound that is plainly the wrong thing, and an abrupt start or end. What it is not good for: telling good
crickets from bad ones; it describes steady beds loosely ("a hissing spray", "a wavering tone"). Treat a description that quotes
words as a failure and regenerate with a plainer prompt that says "no speech, no words"; treat the rest as a hint.
tools/sfx.py runs this on every file it makes. The key is GEMINI_API_KEY (see tools/hear.py); it is never printed.
"""
import base64
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hear  # noqa: E402  (key(), MODEL)

ASK = ('Describe exactly what is heard in this short sound in one plain sentence: the source of the sound, whether any words are '
       'spoken (quote them), how many separate events, and whether it starts or ends abruptly. Do not guess a purpose.')


def describe(path, k=None):
    k = k or hear.key()
    data = base64.b64encode(open(path, 'rb').read()).decode()
    mime = 'audio/wav' if path.lower().endswith('.wav') else 'audio/mp3'
    body = json.dumps({'contents': [{'parts': [{'text': ASK}, {'inlineData': {'mimeType': mime, 'data': data}}]}],
                       'generationConfig': {'temperature': 0, 'thinkingConfig': {'thinkingBudget': 0}}}).encode()
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{hear.MODEL}:generateContent?key={k}',
                                 data=body, headers={'Content-Type': 'application/json'})
    d = json.load(urllib.request.urlopen(req, timeout=300))
    return ' '.join(p.get('text', '') for p in d['candidates'][0]['content']['parts']).strip()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    k = hear.key()
    for f in sys.argv[1:]:
        print(os.path.basename(f), '->', describe(f, k))


if __name__ == '__main__':
    main()
