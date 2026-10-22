# Claude Kami: the engine's manual

Code-only 3D pixel-art skits: a low-poly Buloy talks to Claude (an orange block) in Taglish. Three.js draws the scene at 360x640, it is shown at
1080x1920, and HyperFrames renders it. No generated video. This file is for Claude Code: it is the manual for the commands, `script.json`, sets
and traps. The person you are talking to may not code: do the technical work, ask them for the creative choices (the story, the lines, the
voices, the look), and ask before anything that spends money or sends audio to Google (the list is under "Keys and what spends money").
Never post or publish anything for them, and do not commit unless they ask.

- First time here, or something is not installed: the `kami-setup` skill.
- Making, fixing or rendering an episode: the `claude-kami` skill (it points here for details).
- `CLAUDE.md` has the standing rules (keys, spending, language).

**Read before any episode work, in this order:** [docs/canon.md](docs/canon.md) (the series' rules, CK-nn; the gate checks them),
[docs/formula.md](docs/formula.md) (the story formula: ten fixed slots, a new place and shortcut each time). The example
`episodes/00-legit-developer` shows a finished episode of every key below. Shots chosen by intent instead of a camera table (the virtual
cinematographer, `src/lib/51-cine.js`) are in [docs/cinematography.md](docs/cinematography.md): read it before you write a `shot`. The closing
card is in [docs/end-card.md](docs/end-card.md). Licences: [docs/licences.md](docs/licences.md).

**The human character** is Buloy. Scripts say `"who": "buloy"` and `voices.buloy`; the engine's internal id for him is `viron` (the build maps one to
the other, `PAGE_WHO` in `tools/build.py`), and you will see that id in the code and in a few older files. Never rename it.

**The machine needs** git, Python 3.10 or newer (with Pillow and numpy), Node.js 22 or newer (`npx` runs hyperframes 0.8.137, which needs it, and
downloads its own headless Chrome on first use) and ffmpeg and ffprobe on PATH. Tested on Windows 11 only. If the machine has only `python3`, use
`python3` wherever this file says `python`. On Homebrew Python, `pip install` can fail with an "externally managed" error (PEP 668): make a venv
(`python3 -m venv .venv`), install pillow and numpy into it, and run every tool with `.venv/bin/python`. `.venv/` must stay out of git.

## Layout

| Path | What |
|---|---|
| `src/lib/*.js` | the scene, joined in name order: core, textures, labels, sky, the store set (`30-set.js`), cast, faces, props, post, rig, grips (`47`), solid props (`48`), image assets (`49`), the director (`50`), the virtual cinematographer (`51`, which also draws the first frame), the QA hook (`60`) |
| `src/sets/<name>.js` | one place per file: `tindahan`, `jeepney`, `defense`, `videoke`, `baha`, `court`, `kwarto`, `dbnight`, `cafe`, `wfh`. A script names it with `"set"`; without one the store is used |
| `docs/` | the canon, the formula, cinematography, the closing card, licences, `examples/` |
| `data/formula/` | the topic banks: `sapatos.json` (places), `palusot.json` (shortcuts), `used.json` (pairs already made) |
| `series.json` | your series: the closing card (logo, handle, credit) and the voices |
| `.env` | your keys (git-ignored); `.env.example` is the template |
| `src/index.template.html` | the page: canvas, caption, closing card |
| `episodes/NN-slug/` | `script.json` (the only file written by hand), `stage.js` (optional: this episode's own staging, joined into the page right after the set), `audio/` (voiced lines and `manifest.json`), `timeline.json` (built), `assets/` (generated images, `manifest.json`, `ledger.jsonl`) |
| `audio-lib/music`, `audio-lib/sfx` | beds and effects; each folder has `SOURCES.json` (source and licence of every file) |
| `tools/` | every command below |
| `video/` | the HyperFrames project the build writes into. **One tenant: one build, lab, QA or render at a time** |
| `renders/` | finished files, review sheets (`renders/review/`), lab sheets (`renders/lab/`). Not in git |

## One episode, in order

NN is the next unused number under `episodes/` (the example is 00, so the first new one is 01).

```
python tools/ideas.py [--n 5] [--reuse] [--wild 2] [--count]   # fresh premises: a place and a shortcut nobody has used, scored; writes nothing
python tools/new_episode.py NN-slug "Title" [--set <name>] [--from 00-legit-developer] [--sapatos ID --palusot ID]   # script.json skeleton: formula block, voices from series.json, "mix": 2, hook and card keys, the sound recipe's shape
python tools/check_canon.py episodes/NN-slug           # the canon gate, before voicing; again with --strict at the end
python tools/voice.py episodes/NN-slug                 # ElevenLabs eleven_v4, one clip per line with word timings; skips lines already voiced. SPENDS credits: ask first
python tools/build.py episodes/NN-slug                 # timeline, captions, cuts, the mix; writes video/index.html
python tools/soundcheck.py episodes/NN-slug            # the sound floor, measured (mix 2 adds speakers, voice/bed, loudest fx, ambience, final)
python tools/qa.py episodes/NN-slug --step 0.1 [--frame-strict]   # hands and props: nothing through anything; caption safe area; the speaker's framing (FRAME FAIL / FRAME ADVICE / FRAME WARN lines, frame.json, overlays)
python tools/render.py episodes/NN-slug v1             # build again, caption check, hyperframes check, render, sheets, -upload and -phone copies
python tools/hear.py episodes/NN-slug renders/NN-slug-v1-upload.mp4 [--lines]   # Gemini transcribes the finished mix. Sends the audio to Google (free tier: it may be used to improve their products): ask first
python tools/cover.py episodes/NN-slug [--at 6.9] [--shot cover]   # the cover image from the engine, type from script.json "cover" {kicker, lines, accent}
```

**One command for the checks:** `python tools/make.py episodes/NN-slug [--cut v1] [--from STEP] [--to STEP] [--keep-going] [--dry-run] [--no-hear]` runs
canon-pre, voiced, build, canon, sound, qa, render, frames, hear and look in the only safe order and stops at the first red. It voices nothing
(a missing clip stops it at `voiced`). It writes `renders/review/<episode>-<cut>-make/summary.md`. Its last line is `MAKE: PASS` or
`MAKE: FAIL at <step> (<reason>)`. `--no-hear` skips the Gemini step (`hear.py` sends the finished audio to Google): ask the person once before the first run, and if they say no, always pass
`--no-hear`. With no `GEMINI_API_KEY` set, make.py reports the hear step as SKIP. A full run takes about 5 minutes for a 55-second episode.

The finished files are `renders/NN-slug-v1.mp4` (full), `-v1-upload.mp4` (H.264 for posting) and `-v1-phone.mp4` (720 px). Frame 0 of a finished
file: `ffmpeg -v error -y -i renders/NN-slug-v1-upload.mp4 -frames:v 1 frame0.png`.

Other tools: `sfx.py` (generate a sound effect or room tone; spends credits), `synth_sounds.py` (make the free CC0 sound kit from code, no key),
`soundlook.py` (measure a sound: its length, where its loud part starts, where its energy sits; no key), `loopfx.py` (make a long bed from a
short clip), `tempo.py` (speed one voiced line up or down), `squeeze.py` (cut the pauses inside one voiced line, with an optional speed),
`lines.py` (keep voiced files in step when a line is dropped or inserted), `describe.py` (have a sound described in words, since nobody here can
hear: reliable for speech, so it catches a voice inside a generated effect; `sfx.py` runs it on what it makes), `crowd.py` (one line shouted by
several of the cast), `voice_lab.py` (try v4 tags; spends credits), `music_cues.py` (the `music_cues` format), `sheet.py` (contact sheets),
`gen_image.py` (images; paid Gemini). Each has its usage in the first lines of its file.

Looking while working: `python tools/lab.py <name> --ep NN-slug --times 0.05,3.2 [--shots a,b] [--eyes sad,dot] [--caps]` snapshots moments,
with a different camera per moment if asked (a grammar string such as `cu:claude` is solved at that moment; `--eyes` gives Claude an eye shape per
moment). It leaves `video/index.html` without captions, which is why renders go through `render.py`. Without `--ep` it draws Buloy's expression
sheet. Character sheets: `python tools/cast_sheet.py [who ...]` draws each figure's turnaround and expressions into `renders/cast/` (about five
minutes for everybody); run it after any change to a character.

## Keys and what spends money

Keys live in `.env` at the folder's root (git-ignored; copy `.env.example`). **The person pastes each key into `.env` themselves. Never ask for
one in chat, never print one, never put one in another file or a commit.**

| What | Key | Used by |
|---|---|---|
| voices, sound effects | `ELEVENLABS_API_KEY` | `voice.py`, `sfx.py`, `voice_lab.py` |
| transcription, sound descriptions, images | `GEMINI_API_KEY` | `hear.py`, `describe.py`, `gen_image.py` |

**Ask before** (one list, the same in `CLAUDE.md` and the skills):
- anything that spends money or credits: `voice.py` (every new or `--force` line), `crowd.py`, `voice_lab.py`, `sfx.py`, `gen_image.py`;
- anything that sends audio to Google, on any key, free or paid: `hear.py` and `describe.py` (and `sfx.py`, which runs `describe.py` on what it
  makes when a Gemini key exists). On the Gemini free tier Google may use what is sent to improve its products, and people may review it.

**Sound effects cost far more credits than a spoken line.** Before generating one, check the current price on https://elevenlabs.io/pricing and tell the
person (do not quote a number from memory). Voice only after the script has passed the gate and the person has read the lines. Re-voice a line twice
at most, then rewrite the line. Everything else (build, soundcheck, qa, render, ideas, soundlook, synth_sounds) is free and local. The example
episode is already voiced, so rendering it needs no key.

If a key ever appears in the chat, treat it as leaked: tell the person to revoke it (https://elevenlabs.io/app/settings/api-keys or
https://aistudio.google.com/apikey) and make a new one, because a chat cannot be deleted. In `.env` a key has no quotes and no spaces around the `=`.

## series.json and voices

`series.json` at the root:

```
{ "card": { "logo": "assets/brand/logo.png", "handle": "@yourhandle",
            "credit": { "label": "Made with", "name": "...", "handle": "...", "avatar": "assets/brand/avatar.png" } },
  "voices": { "buloy": { "voice_id": "...", "note": "..." }, "claude": { "voice_id": "...", "note": "..." } } }
```

`card` fills the closing card (paths are relative to `video/`; `null` or a missing field leaves that part out; see `docs/end-card.md`). Branding: the
Vibe Coders PH star on the developer's hoodie is part of the character (`src/lib/40-cast.js` loads `vcph-star-512.png`), not the card; the card's
logo is `card.logo`. A logo of another shape needs the `#endlogo` CSS block in `src/index.template.html` adjusted: you may edit that block with the
person's OK, then check the card with `lab.py` (or a render) at full size.

`voices` is copied into every new episode by `new_episode.py` (or copied from another episode with `--from`). **It starts empty** (`voice_id: ""`):
`new_episode.py` exits with a message until both are set, because no ElevenLabs voice works for every account. A guest is one more entry in an
episode's `voices` (`"who": {"voice_id": "...", "note": "..."}`) and a `who` on its lines. The example episode keeps its own `voices` block (Liam and
Brian) as a record of what it was voiced with; those ElevenLabs default voices are being retired (they expire on 2026-12-31 and exist only for
accounts made before March 2026). That does not affect rendering the example, whose clips are already made.

**Picking voices** (the `kami-setup` skill walks the person through it):
1. List what the person's own account can use through the API: a read-only one-liner that reads `ELEVENLABS_API_KEY` from `.env` without printing it and
   prints `voice_id`, `category` and `name` from `GET https://api.elevenlabs.io/v2/voices?page_size=100` (the key needs Voices read access).
2. On the Free plan, use voices whose category is `premade` (old accounts only, until 2026-12-31), `generated` (made with Voice Design in their account)
   or `cloned`. Voice Library voices need a paid plan (Starter, about $6 a month, which also adds a commercial licence); the Free plan is non-commercial
   only.
3. With the person's OK, test one short line per voice: a git-ignored scratch episode `episodes/_voicetest/script.json` (two lines, one per voice, the shape
   of the example's lines) and `python tools/voice.py episodes/_voicetest` (about 40 credits). The person listens to the two mp3s.
4. Write the chosen ids into `series.json` `voices` (`buloy`, `claude`) with a `note` naming each voice. Claude's voice stays the same across episodes
   (CK-14). `voice.py` sends every "Buloy" to eleven_v4 as the IPA `/buˈloj/` (quick BU, longer LOY).

## script.json

```
title, set, mix (2 = the dialogue-led mix; new_episode.py sets it), cine (1), formula{sapatos, palusot, tanong, amin, bisita, linya [a, b], button, caption, gag, checked{rule: note}, waived{rule: reason}},
voices{who: {voice_id}}, open_shot, hook_caption ("whole" | "all"), end_message [line, line], keep_together [[a, b]],
marks{name: moment},
lines[{ who, shot, text, say, act, gain, stability, crowd, pre, pre_shot, pre_cuts[{at, shot, zoom}], cuts[{word, shot, zoom, offset, anchor}], card, card_at,
         eyes, eye_cuts[{word, eyes}], look, shot_anchor, pre_anchor }],
       cine_shots{name: spec}, cine_look{fog, key, keyI, rim, rimI}, gap,
audio{ music{file, offset, under_db, stop, resume} | music_cues[{file, offset, at, until, under_db, fade_in, fade_out}],
       ambience{file, under_db}, sfx[{file, at, under_db, dur, fade, fade_in}] },
assets{name: "assets/file.png"}, inserts[{at, dur, asset, layout}], cover
```

- `formula` (docs/formula.md): `sapatos` and `palusot` are ids in `data/formula/`; `tanong`, `amin` and `button` are line numbers and `linya` a pair
  of them; `bisita` who arrives; `caption` the post caption's question; `gag` the hidden gag. `checked` records the human checks the gate cannot
  make (`"CK-12": "read the lines, 2026-10-19"`): `check_canon.py --strict` needs a note (who checked, and when) for each human check it would otherwise
  SKIP: CK-05, CK-06, CK-07 (the part about the amin landing), CK-11, CK-12 and CK-19. The example has none, so it does not pass `--strict`. `waived`
  excuses a FAIL for this one episode (CK-26): a waiver is the person's decision, never Claude's. Claude may propose one, the person decides, and the
  text says who decided and why.
- `text` may open with one Eleven v4 tag in brackets (`[whispering]`, `[shouting]`, `[laughs]`, `[sings]`). Tags are stripped from captions.
- `say` (optional, beside `text`): what the voice is sent when a word must be spelled for the ear, with the same number of words as `text`;
  captions still show `text`. A voice that says "AI" as "ay" needs `say` with "Ey-ay".
- Removing or adding a line: edit `script.json` (and any audio anchors that name later line numbers), then
  `python tools/lines.py drop|insert episodes/NN-slug <index>` so the voiced files keep their places, then `voice.py`.
- A take that runs long: `python tools/tempo.py episodes/NN-slug <index> 1.15` (a slow voice is safe at 15 percent). A take whose words are right
  and whose pauses are long: `python tools/squeeze.py episodes/NN-slug <index> 0.15 [1.15]` (the two do not stack; give the speed to
  `squeeze.py`). If the set keys anything to a word inside that line, its offsets move: read them again from `audio/manifest.json`.
- An effect's `at` is where the file starts, and many files start with silence. Run `python tools/soundlook.py <file>` and subtract the lead from
  the `offset`, so the loud part lands on the moment.
- `act` is the name the set's `update()` looks up to stage the line. `shot` is a camera in the set's `shots` table, or a grammar string (below).
- `cuts` cut inside a line on a word (index into the line's words; `offset` moves the cut that many seconds after the word starts, for a cut just
  after the line's last word). `pre` is silence before the line; `pre_shot` is the camera for that silence.
- The closing card's sentence may be two or three rows. The card line's caption sits in a fixed lane (y 506, `docs/end-card.md`); a set's own `capCard` is no longer read. `hyperframes check` fails on an overlap.
- `card: true` on the last line plays it over the closing card. `end_message` is the card's sentence, two or three rows of at most 24 characters.
- A moment (`at`, `until`, `stop`, `resume`) is `{t}`, `{line, word?, edge?, offset?}`, `{card, offset?}` or `{mark, offset?}`.
- `marks` names a moment once (`"g1": {"line": 2, "edge": "end", "offset": 0.75}`). The build resolves each to seconds and writes them to the
  timeline as `TL.marks`; the set reads them there and effects use `{"mark": "g1", "offset": -0.75}`. One time then drives the picture and the
  sound of an event that happens between lines.
- **Shots by intent** (docs/cinematography.md): a `shot` (also in `cuts`, `pre_shot`, `pre_cuts`, `open_shot`) may be a grammar string:
  `ecu|cu|mcu|ms|ws:<who>`, `pov:<who>`, `ots:<who>`, `two`, `ws`, `duo:<who>+<laptop>`, `insert:<prop>`; `<who>` is `buloy`, `claude` or `nena`.
  The engine solves each into a camera from where the cast stands, once per cut at init. Lookup: `SET.shots` (hand-placed) -> `cine_shots` (named
  specs: `{base, type, who, size, eye, x, yaw, pitch, fov, push, arc, cap, flip, at}`) -> grammar -> the base table. `"cine": 1` turns on the
  default eyeline (each principal looks at the other's eyes) and makes the framing FAILs of `qa.py` count. `cine_look` is the key, rim and fog of a
  solved shot (or `SET.cine.look`). A cut may carry `"zoom": 1.25` (a punch-in on the shot on screen, with or without a `shot`). `anchor` names a
  cut for a set that keys on shot names (`cutAt("k_read")`). `gap` is the silence between lines (default 0.32).
- `eyes` (and `eye_cuts`, a change on a word) is Claude's eye shape: neutral, flat (deadpan), dot (alert), soft (sheepish), sad, wide, squint, side-l,
  side-r, happy, closed; a Buloy line may carry it for Claude's reaction. `look` on a line is where the speaker looks: `"screen"`, `"lens"` or
  `"down"` (else the other's eyes).
- `hook_caption`: the first line's caption shown as one caption so frame 0 carries the whole hook ("whole" for one sentence, "all" for more).
- Captions are cut at 26 characters from the word timings; `keep_together` names word pairs that must not be split ("thank you" is built in).
- **The mix** (`"mix": 2`): `build.py` measures every voiced line (integrated LUFS) and gains it to -16 LUFS, so Buloy and Claude sit together with no
  hand `gain` (a line's `gain` stays as an extra offset); a syllable that would stand more than 13 dB over that is limited to -3.5 dBFS.
  Everything else is then set against the measured dialogue, and `under_db` means "this many dB under the dialogue": the music bed (default 14,
  then ducked, and lowered further if it is closer than 16 dB to the voices while someone speaks); ambience, or an effect of `dur` 6 or more used as
  a bed (default 25); any other effect, measured at its loudest 400 ms moment and its true peak (default 6; the gate wants at least 3 unless the
  script asks for less). A bigger number is quieter. The master is one linear trim to -14 LUFS and a limiter, corrected on the encoded file until it
  is within 0.3 LU with the true peak at or under -1.2 dBTP. `soundcheck.py` fails: **speakers** (Buloy against Claude over 1.5 LU apart), **voice/bed**
  (dialogue against the ducked bed under 15 dB), **loudest fx** (the closest effect against the dialogue's loudest moment under 3 dB, or any effect
  louder than the dialogue), **ambience** (outside 20 to 32 dB under), **final** (over 1 LU from -14 LUFS or a true peak above -1 dBTP), plus music on
  at least 85 percent, music gap, room tone, accents at least 2 per ten seconds, cuts at least 3 per ten seconds, and a deliberate music stop.

## The sound library

`audio-lib/` holds sounds anyone may reuse (CC0): a kit made from code (effects `stamp-low`, `scratch-stop`, `womp`, `ping-soft`, `whoosh-air`,
`error-buzz`, `chime-up`, `sparkle-dust`, `claps-small`, `key-tap`, `ba-dum-tss`, `bulb-hum`, the music bed `lofi-bed.mp3`, the room tone
`amb-morning-fan-long.wav`), and the Claude Kami series' own ElevenLabs effects and room tones (crowds, a rimshot, jeepney, traffic, rain, rooms
at night, a classroom, a cafe; the `*-long.mp3` files are beds). `SOURCES.json` says what each one is. List the folders to see what is there now. `new_episode.py` writes placeholder file names in `audio`; replace each with a file
that exists. More sounds: `python tools/synth_sounds.py` (rewrites the kit, free), `python tools/sfx.py name.mp3 "<plain description>" <seconds>` (ElevenLabs,
spends far more credits than a voice line: say the price first; refuses to overwrite without `--force`), or files the person has the right to use. **Every file gets an entry in its folder's
`SOURCES.json` (source and licence)** and nothing is added that is not free to share (`docs/licences.md`). `SOURCES.json` is LF.

## A set

`src/sets/<name>.js` hides the store, builds its own room, and exports `SET = { name, shots: {...}, keys: () => [...], update(t, ctx) }`.

- **A set's acts belong to its first story.** An act without an entry in the set shows the idle pose (`kwarto.js`: "An act without an entry shows IDLE"), and
  a set such as `tindahan.js` hard-codes the acts of its own story. A new episode on an existing set therefore needs its own staging:
  `episodes/NN-slug/stage.js`, one act per line the set does not already know (read the set file for the acts it has). The example's poses live in
  `episodes/00-legit-developer/stage.js`; start from it. This is the longest and most token-heavy step of an episode: say so to the person. For a first
  episode, reuse the `kwarto` room. Frame 0 needs the first line's pose from time zero.
- `update` is a pure function of time. It poses the cast from the script's acts: `const A = { x: actLine("b_x") }`, `win(A.x, t)` is a weight that
  rises before the line and falls after it.
- **The first line's pose holds from time zero.** Do not gate it on the line's lead-in, or frame 0 is a figure standing still.
- A shot is `{ p, l, fov, d, cap }`: camera position, look-at, field of view, drift per second, and caption lane in pixels from the top.
  `ctx.shot` is the camera on screen, so acting can depend on the shot.
- Everything held is a solid prop on the grip system (`makeProp`, `gripHold`, `gripTouch`, `gripRest`, `nubHold` for Claude). Nothing held is
  see-through. `keys()` lists the moments QA should photograph.
- **A prop held up in the air** has its handle set across the holder's forearm every frame, not leaned by a fixed angle: solve the arm, read
  `fore.matrixWorld`, turn the prop, solve again (`court.js`, the stamp). A fixed lean puts the handle along the forearm half-way down.
- **A standing figure cannot press a key on a table**: from shoulder to key is longer than the arm. Raise the laptop on a carton, seat the figure, or
  let him touch something higher.
- **Who speaks must be on screen while the caption shows.** A caption over the listener's close-up reads as the listener's line with the sound off.
  Keep the speaker for the whole line and cut to the listener's face in the silence after.
- Pictures (`script.json` `assets`) come through `ASSET.tex(name, {pixel: true})`; a set must still build without them.
- Words on signs, banners and screens must be whole or absent in every camera that sees them.
- **Light.** The shared rig is in `src/lib/30-set.js` (`hemi`, `duskRim`, `skyFill`, the store's bulbs) and the grade in `45-post.js`
  (`grade.uniforms.uExposure`, `RIM.uRimColor`). A set sets these every frame at the top of `update()` and adds its own lights (a `DirectionalLight`
  with shadows for a sun, `PointLight`s for lamps, screens and candles; see `videoke.js` for coloured moving light and `baha.js` for a wet street). A
  wall beside a door should not receive cast shadows.
- **A dark place.** The shading has hard steps, so dimming the lights does not darken a pale wall. Tint the wall and floor materials in `update()` and
  lift the tint when the light returns (`kwarto.js`: `NIGHT`, `WALLM`, `FLOORM`). Keep faces on short lights of their own, put a flame's light a hand
  above the flame, and give a face near a warm source a pale second light, or the skin goes solid orange. Compare mean brightness with the example
  episode, not with a guess.
- `SET.cine = { side, pose, look, objects }` (all optional): which side of the line of action the camera lives on (`1` or `-1`), `pose: "after"` (the
  eyelines and eye shapes win over the set's own acting), the look (fog, key, rim), and `objects` (what `insert:`/`duo:` may name besides a prop with a
  screen). A set that turns Claude itself should set his yaw through `CINE.facing("claude", yaw)`. `episodes/NN-slug/stage.js` (joined right after
  the set, before the director) is where an episode sets these, wraps `SET.update`, adds acts or moves a prop; `episodes/00-legit-developer/stage.js`
  and `docs/examples/cine-kwarto-stage.js` with `docs/examples/cine-script-snippet.json` are worked examples.
- A set may swap one shot name's framing over time (`Object.assign(SHOTS.k_x, t < T ? A : B)`) and may light per shot through `ctx.shot`.
- The build picks the set by name (`src/sets/<name>.js`); backup files beside it are ignored. A new set is a builder job: brief it with the script's
  acts, the shot list and the light the place needs, and check it with `python tools/lab.py <name> --ep NN-slug --times ... --caps` and
  `python tools/qa.py episodes/NN-slug --step 0.1`. Reuse an existing set when the story allows: it is the cheapest episode.

## When a check fails

| Check | What to do |
|---|---|
| a voiced line under 80 percent | rewrite it shorter or plainer and voice it again; twice at most, then change the line |
| `soundcheck.py` music on or gap | make the cues contiguous, lower `under_db` toward 12; room tone missing: add `ambience` or a long bed |
| `soundcheck.py` speakers, voice/bed, loudest fx, ambience or final | speakers: remove a hand `gain`, re-voice the odd line; bed or effect: raise its `under_db` (a bigger number is quieter); final: re-run `build.py`, which corrects it |
| `soundcheck.py` accents or cuts | add an accent on a punchline word; add a `cuts` entry on a word |
| `qa.py` penetration or gap | move the grip or the prop, not the limit; wrist over 80 degrees: turn the hand or the prop toward the arm |
| `qa.py` caption | change the shot's `cap` lane or shorten the line |
| `qa.py` FRAME FAIL (or FRAME ADVICE in an episode without `"cine": 1`): speaker under 80 percent visible, turned away from the lens, both eyes hidden | look at the overlay in `frame/` (cyan face box, magenta eyes): a prop or a head in the way, or the subject walked out of the solved framing; give the shot an `at` (the moment it is solved at), cut again, or change the shot |
| `qa.py` FRAME FAIL: caption over the face, face centre outside the safe area | give the shot a `cap`, or a looser size (`cu` -> `mcu`); the safe area is 250 to 1500 px from the top, and left of 850 px in the lower half |
| `qa.py` FRAME WARN: 180-degree flip | the two singles break the screen direction: swap one for `ots:` or `two`, or `flip: true` if it is on purpose |
| `qa.py` CINE WARN: no clean camera | the camera of that shot is inside a solid or both eyes are hidden: use another shot type, or give a spec `yaw`/`pitch`/`fov` |
| `qa.py` fails after a change to the cuts only | QA samples every cut, so a new cut tests a moment nobody had looked at; fix the pose there |
| a caption sits on something bright | move that shot's `cap` to where the wall is dark; a set can change `cap` by time |
| mix under 90 percent heard | lower the bed or the effect under that line, or give the line `gain` |
| loudness off by more than 1 LU | check `TARGET_LUFS` in `build.py` and the stems; do not push the limiter |
| `check_canon.py` FAIL | fix the episode, never the limit. Only the person can excuse one FAIL, for one episode, in their own words (`formula.waived`); Claude never writes a waiver on its own |

The rule under the table: fix the film, never the limit.

## Images

`python tools/gen_image.py episodes/NN-slug` reads `assets/manifest.json` (style blocks `common`, `background`, `cutout`, `texture`; a texture
needs its own style block or a whole scene comes back) and writes `assets/raw/` and `assets/ledger.jsonl`. Gemini only, paid, optional;
`--dry-run` shows what it would send. Ask before running it. Generate only the images the manifest lists.

## Traps that have cost a render

- The Bash tool mangles backslashes inside heredocs. Write a patch script or a file with the Write tool and run it.
- `lab.py` leaves the page without captions. Render with `render.py`.
- `lab.py --shots` keys cameras by time; give repeated moments times 0.05 s apart (closer ones land on one frame and one camera).
- A scripted edit that adds a `//` comment in the middle of a long line turns the rest of that line into comment. Print the line afterwards.
- A face lit only by a screen goes black the moment the screen shuts. Look at the frame after every prop change.
- Line endings: `* -text` in `.gitattributes` means git converts nothing, and the repo is LF. An editor can still save a file as CRLF: when
  `git diff --stat` shows a whole file changed for a small edit, that is what happened; convert it back before committing.
- `render.py` stops at `hyperframes check` when a caption overlaps the card (or any layout error) and leaves the previous cut's files in
  `renders/`. Read the render's own exit status or the files' times, not the tail of a log; and never reuse a cut name for a re-render you
  have not confirmed.
- Inserting a line needs the voiced files and `audio/manifest.json` re-indexed (`lines.py`), or `voice.py` re-voices the wrong lines.
- Never kill processes by name (it ends every Python or Node on the machine). Kill only what you started, by id.
- A first run of `qa.py` can fail with "Failed to fetch"; run it again.
- A solved camera does not follow its subject: it is solved at the cut's first moment (+0.05 s). A subject who turns or walks during the cut (or a
  prop that swings in front of him) drifts out of the framing; the QA says so. `at` picks another moment, a second cut re-solves.
- `stage.js` and the set share one scope: a `const` in the set cannot be redeclared there, and a name the engine already uses (`FW` is the face
  width) is a syntax error.
- The finished file measures up to 1 LU under the mix after encoding. Within 1 LU of -14 is the pass line.
- The first render downloads a headless Chrome and the page loads three.js and GSAP from a CDN: it needs internet, and the first run is slow (several minutes).
- Tell the person before a long job and how long it takes: the first render (several minutes), `make.py` (about 5 minutes for a 55-second episode on the
  test machine), `cast_sheet.py` (several minutes). Never two jobs that use `video/` at once.
