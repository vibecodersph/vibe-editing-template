"""Generate an episode's image assets (plates, textures, cutouts) with Gemini's image model.

    python tools/gen_image.py episodes/NN-slug [--only id,id] [--force] [--model gemini-nano-banana-2.1] [--dry-run]

Reads <episode>/assets/manifest.json:
  { "style": {"common": "...", "background": "...", "cutout": "..."},
    "assets": [ {"id": "street-far", "kind": "background" | "texture" | "prop" | "character",
                 "size": "1024x1536", "aspect": "9:16" (optional, wins over size), "prompt": "..."} ] }
Writes <episode>/assets/raw/<id>.png and appends one line per call to <episode>/assets/ledger.jsonl
(model, prompt hash, token usage, file hash), so every generated image can be traced.
The key is GEMINI_API_KEY from this folder's git-ignored .env (see .env.example) or the environment; it is never printed.
"""
import base64
import datetime
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request

ASPECTS = {'1024x1024': '1:1', '1024x1536': '2:3', '1536x1024': '3:2', '2048x1152': '16:9', '1152x2048': '9:16'}


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


def compose(a, style):
    cut = a.get('kind') in ('prop', 'character')
    if a.get('kind') == 'texture':                     # a material swatch: its own style block, never the scene one
        return '\n\n'.join(p for p in [a['prompt'], style.get('texture', '')] if p)
    parts = [a['prompt'], style.get('common', ''), style.get('cutout' if cut else 'background', '')]
    return '\n\n'.join(p for p in parts if p)


def main():
    ep = sys.argv[1].rstrip('/').rstrip(chr(92))
    args = sys.argv[2:]
    val = lambda n: args[args.index(n) + 1] if n in args else None
    only = (val('--only') or '').split(',') if val('--only') else None
    model = val('--model') or 'gemini-nano-banana-2.1'
    adir = os.path.join(ep, 'assets')
    man = json.load(open(os.path.join(adir, 'manifest.json'), encoding='utf-8'))
    os.makedirs(os.path.join(adir, 'raw'), exist_ok=True)
    k = None if '--dry-run' in args else key()
    made = 0
    for a in man['assets']:
        if only and a['id'] not in only:
            continue
        out = os.path.join(adir, 'raw', a['id'] + '.png')
        if os.path.exists(out) and '--force' not in args:
            print('have', a['id'])
            continue
        prompt = compose(a, man.get('style', {}))
        aspect = a.get('aspect') or ASPECTS.get(a.get('size', ''), '1:1')
        if '--dry-run' in args:
            print(f'--- {a["id"]} [{a.get("kind")}] {aspect}\n{prompt}\n')
            continue
        body = json.dumps({'contents': [{'parts': [{'text': prompt}]}],
                           'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': aspect}}}).encode()
        req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={k}',
                                     data=body, headers={'Content-Type': 'application/json'})
        try:
            d = json.load(urllib.request.urlopen(req, timeout=300))
        except urllib.error.HTTPError as e:
            print('FAILED', a['id'], e.code, e.read()[:300].decode('utf-8', 'replace'))
            continue
        parts = (d.get('candidates') or [{}])[0].get('content', {}).get('parts', [])
        img = next((p['inlineData'] for p in parts if 'inlineData' in p), None)
        if not img:
            print('NO IMAGE', a['id'], json.dumps(d)[:300])
            continue
        raw = base64.b64decode(img['data'])
        tmp = out if img.get('mimeType', 'image/png') == 'image/png' else out[:-4] + '.' + img['mimeType'].split('/')[-1]
        open(tmp, 'wb').write(raw)
        if tmp != out:                                   # keep one format on disk
            from PIL import Image
            Image.open(tmp).save(out)
            os.remove(tmp)
        u = d.get('usageMetadata', {})
        rec = {'ts': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'), 'id': a['id'], 'file': 'raw/' + a['id'] + '.png',
               'provider': 'google', 'model': model, 'aspect': aspect, 'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest()[:16],
               'usage': {x: u.get(x) for x in ('promptTokenCount', 'candidatesTokenCount', 'totalTokenCount')},
               'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest()[:16]}
        open(os.path.join(adir, 'ledger.jsonl'), 'a', encoding='utf-8').write(json.dumps(rec) + '\n')
        made += 1
        print(f'ok   {a["id"]}  {aspect}  {os.path.getsize(out) // 1024} KB  out-tokens {u.get("candidatesTokenCount")}')
    print(made, 'made')


if __name__ == '__main__':
    main()
