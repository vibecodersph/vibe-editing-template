# Production: voices, set, sound, checks

All commands run in the template's folder. The `video/` folder takes one job at a time: never build, snapshot, QA or render two things at once.
Money is spent from the voice step on (voices, effects, images): voice only a script that has passed the gate and that the person has read, and
ask before every spend and before anything that sends audio to Google (`hear.py`, `describe.py`; on any key). The list is in `CLAUDE.md`.

## Voices

```
python tools/voice.py episodes/NN-slug [--lines 3-5] [--who claude] [--force]
python tools/hear.py episodes/NN-slug <any film or mix> --lines
```

Before running `voice.py`, add up the characters of the lines that have no clip yet, tell the person ("about N credits of your M"), and wait for a yes.
It uses Eleven v4 (`eleven_v4`), one tag per line at most. It writes `audio/line_NN.mp3` and `audio/manifest.json` after every line, so a dropped
connection keeps the takes already paid for: run the same command again and it carries on.

Every line is checked to be heard. `hear.py ... --lines` transcribes each take (Gemini; ask first on any key: it sends audio to Google, and the free tier may use it to improve their products). A line
under 80 percent is rewritten shorter or plainer and voiced again; **twice at most, then change the line**. Short imperatives and near-homophones are
the usual misses. Two voices should sit together: the mix-2 build gains every line to the same loudness, so leave `gain` out.

- Add the takes up before building: voiced lines often run longer than a count of words suggests. A line dropped after voicing is removed with
  `python tools/lines.py drop episodes/NN-slug <index>` so the rest are not voiced again; a line inserted uses `lines.py insert`.
- A slow voice: `python tools/tempo.py episodes/NN-slug <index> 1.15` (15 percent is safe). A take whose words are right and whose pauses are long:
  `python tools/squeeze.py episodes/NN-slug <index> 0.15 [1.15]`. The two do not stack; give the speed to `squeeze.py`. If the set keys anything to a
  word inside that line, read the offsets again from `audio/manifest.json`.
- The film's first word is the one most easily lost. A soft vocative before a comma ("Kap, kanina po...") can vanish; sent as its own exclamation
  through `say` ("Kap! Kanina po...") it is heard. After any re-voice, have the new take described or transcribed (`tools/describe.py <clip>`,
  `hear.py --lines`) before `tempo.py` or `squeeze.py` touches it, and keep an effect off the first word.
- Voice Library voices are not available through the API on the Free plan; voices you design (Voice Design) or own are, and the old default voices only on
  accounts made before March 2026 (they expire on 2026-12-31). Pick with the person (see "Picking voices" in `AGENTS.md`).

## Set and staging

Reuse first (`AGENTS.md` lists the sets: `tindahan`, `jeepney`, `defense`, `videoke`, `baha`, `court`, `kwarto`, `dbnight`, `cafe`, `wfh`; no `set`
means the store). A new place is one file in `src/sets/`. Brief it like this, to a builder (a fresh subagent) or do it yourself:

```
GOAL      src/sets/<name>.js for episode NN: <the place in one sentence>, staged for the acts in episodes/NN-slug/script.json
CONTEXT   read AGENTS.md (A set, including Light) and the closest existing set as the model; the shot list and what each must show: <list>;
          the light this place needs: <for example one candle, a dead bulb, a laptop's glow>
SCOPE     edit src/sets/<name>.js only; do not touch other sets, tools/ or script.json
DONE-WHEN python tools/qa.py episodes/NN-slug --step 0.1 passes with 0 failures; a sheet of every cut (tools/lab.py --ep) where: frame 0 already
          holds the first line's pose; every face is in frame; every held thing is solid and gripped; every word on the set is whole or absent
RULES     update() is a pure function of time; nothing see-through in a hand; no real brand marks; video/ is single-tenant;
          kill only processes you started, by id; write patch scripts to files, not heredocs
REPORT    files changed, the shot table, the QA summary line, the sheet's path, anything you could not make work
```

**Staging a story on an existing set.** A set's acts belong to its first story: an act the set has no entry for shows the idle pose, and some sets hard-code
their own story's acts. So every new episode writes `episodes/NN-slug/stage.js` (joined into the page right after the set; `AGENTS.md`, "A set"): one
act per line the set does not already know (read the set file for the acts it has), modelled on `episodes/00-legit-developer/stage.js` (it reads the voiced
timings from `audio/manifest.json`, so voice first). It is the longest and most token-heavy step: tell the person. For a first episode, reuse the
`kwarto` room and start from the example's stage.js. Frame 0 needs the first line's pose from time zero. Run `lab.py --ep` snapshots and `qa.py` after.

Check the builder's sheet yourself at full size before going on. A flood has to read as water, a hand as a hand.

What a dark room, a court and a crowd taught (the rest is in the "A set" section of `AGENTS.md`):

- **Dark is a tint, not a dim light.** The shading has hard steps, so lowering the lights leaves a pale wall pale. Tint the wall and floor materials for
  the night in `update()`; keep the faces lit by short lights of their own.
- **Measure brightness against the example episode**, not against a guess: mean luma of one frame a second from the upload file. The closing card is dark.
- **A light at a flame burns out what it stands on** and the bloom hazes the frame: put it a hand above the flame. **One warm source turns skin solid
  orange**: a face near it needs a pale second light with a reason. **A face lit only by a screen goes black when the screen shuts.**
- **Captions go where the wall is dark.** Look for the slats, the flame and the bright window before choosing a shot's `cap`.
- **The stake sits above the bottom fifth of frame 0** (the gate's line), and higher is safer. A thing on a table falls under the phone app's interface or
  out of the frame. Have it held up, and shoot the stage on a long lens from far back and low.
- **A screen that states something leaves its foot plain** (ERROR or ONLINE at the top, nothing in the bottom quarter, where the caption sits).
- **An event between lines is a named moment** (`marks` in `script.json`; the set reads `TL.marks`, effects use `{mark, offset}`), so the picture and its
  sound cannot drift apart when a take changes length.
- **Put a character where his close-up has a clean wall.** **A crowd near the lens cheers by bouncing; raised arms that close read as planks.**
- **An action hidden by its own prop did not happen.** Turn the prop so the hand is seen from the side, and raise it if a standing figure cannot reach it.
- **A two-shot from the front makes both small** in a tall frame. From one side they overlap in depth and both faces grow.
- **A patch that adds a line comment can swallow the code after it** on a long line. After a scripted edit to a set, print the line.
- `tools/lab.py` snaps to frames: space moments 0.05 s apart.

Generated plates and textures (optional, paid): write `episodes/NN-slug/assets/manifest.json`, run `python tools/gen_image.py episodes/NN-slug --dry-run`,
show the person what would be generated and its cost, then run it without `--dry-run` on their yes; keep the ledger. Use only pictures you have the
right to use. A third-party download needs the person's yes with the file name, source and size.

## Sound

- One bed under at least 85 percent of the film, with one deliberate stop where the first laugh lands. Contiguous `music_cues`, or a single `music` with
  `stop` and `resume`; no gaps by accident.
- A room tone or a continuous bed under everything.
- An accent tied to a word on every punchline and every cut that matters: at least two per ten seconds.
- At least three cuts per ten seconds, cut on words. The punch is a close-up.
- Use real file names. List `audio-lib/music` and `audio-lib/sfx` and pick from what is there (the code-made kit: `stamp-low`, `scratch-stop`, `womp`, `ping-soft`,
  `whoosh-air`, `error-buzz`, `chime-up`, `sparkle-dust`, `claps-small`, `key-tap`, `ba-dum-tss`, `bulb-hum`, `lofi-bed.mp3`, `amb-morning-fan-long.wav`;
  plus the series' ElevenLabs effects and `*-long.mp3` room tones, each described in `SOURCES.json`).
  `new_episode.py` writes kit files as placeholders (`lofi-bed.mp3`, `amb-morning-fan-long.wav`, `scratch-stop.mp3`): choose the right ones for the story.
- More sounds: `python tools/synth_sounds.py` rewrites the free kit; `python tools/sfx.py <name>.mp3 "<plain description>" <seconds>` generates one with
  ElevenLabs (**spends far more credits than a voice line**: check https://elevenlabs.io/pricing, say the price and ask; it also runs `describe.py` when a Gemini key exists, which
  sends the sound to Google; it flags a near-silent result and writes the `SOURCES.json` line); stretch a short bed with `tools/loopfx.py`.
  Every file added gets a `SOURCES.json` entry with source and licence, and only files free to share go in the repo.

`python tools/soundcheck.py episodes/NN-slug` exits non-zero under any floor. `make.py` runs it; run it by hand after sound changes.

Nobody on this pipeline can hear, so a sound is checked by measurement before it is placed:

- `python tools/soundlook.py <files>` prints each file's length, where its loud part starts and where its energy sits. Place an effect by its loud part,
  not by the start of the file: many files are silent for their first 0.3 to 0.6 s. Give the effect a negative `offset` of that length, or the hit lands late.
- A model's description of a sound (`tools/describe.py`) is a hint, except about speech: a description that quotes words means regenerate.
- A room tone has to carry something under 1 kHz to count in `soundcheck.py` and to be felt on earphones; crickets alone sit above 8 kHz.
- A sound that must match a picture event one for one (a key press per letter) is cut from a library file with ffmpeg and placed once per event. Record
  the cut in `SOURCES.json` as derived, with the file it came from.

## Frame 0

Take it from the finished file at time zero (`ffmpeg -v error -y -i renders/NN-slug-v1-upload.mp4 -frames:v 1 frame0.png`) and look at it at full size.
It must hold: the first line's pose and face at full strength, the whole hook as one caption (`hook_caption`), something that moves in the first shot,
and in a tall frame the face directly under or over the one thing to read. Try cameras with
`python tools/lab.py <name> --ep NN-slug --times 0.05,0.08,0.11 --shots x1,x2,x3 --caps` before settling.

## Checks, in order

The one command: `python tools/make.py episodes/NN-slug --cut v1`, about 5 minutes for a 55-second episode (tell the person first). Add `--no-hear` to skip the Gemini
step, which sends the finished audio to Google: ask once before the first run, and if the answer is no, always pass `--no-hear`. By hand, the same order:

```
python tools/check_canon.py episodes/NN-slug
python tools/build.py episodes/NN-slug
python tools/soundcheck.py episodes/NN-slug
python tools/qa.py episodes/NN-slug --step 0.1
python tools/render.py episodes/NN-slug v1
python tools/hear.py episodes/NN-slug renders/NN-slug-v1-upload.mp4     # only if the person said yes: it sends the audio to Google
ffmpeg -hide_banner -nostats -i renders/NN-slug-v1-upload.mp4 -af ebur128=peak=true -f null -
```

`render.py` stops at `hyperframes check` on a layout error (a caption overlapping the card is the usual one) and leaves the last cut's files where they
were. Read its exit status and the files' times before measuring anything.

Pass lines: zero contact failures; every soundcheck row ok; 90 percent of script words heard with the first line clean; within 1 LU of -14 LUFS with
the true peak at or under -1 dBTP. Then the close looks (the contact sheets in `renders/review/`, full size) and a second reader if you can.

Brief for a second reader (a fresh subagent that did not build it):

```
GOAL      a ship / ship after fixes / do not ship verdict on renders/NN-slug-v1-upload.mp4, with ranked findings
CONTEXT   episodes/NN-slug/script.json, docs/canon.md, docs/formula.md; you did not build this
SCOPE     read only; frames with ffmpeg into your own scratch folder; do not touch video/
DONE-WHEN the swipe test on seconds 0 to 3 (would a stranger stay; what do they think it is about); every laugh beat marked landed or not;
          every hand, sign, caption and face looked at at full size; findings ranked blocker, major, minor, each with a time
RULES     no praise without a frame behind it; read every caption, sign and screen for Filipino grammar and spelling and quote any a native
          speaker would not write; say what you could not judge (you cannot hear)
REPORT    the verdict, the findings, the three fixes that would move the first three seconds most
```

Two rounds at most. Then you and the person decide what is left and write it down.

What a reader finds that no machine check finds, so look for these before handing a cut over:

- **The first frame said the wrong thing.** A candle on an orange block read as "a candle-lit cake". Frame 0 needs the things that name the situation
  (a moon in the window, a dead router, a dark room), and something has to move before the first cut.
- **A gag with no picture.** If a character reads, counts or points, show the thing: an insert of the page as he sees it, his finger under each word.
- **A line about not looking up, shot from below.** From under his face, eyes on a book look like eyes on the lens. Shoot it from above.
- **A lean on two feet.** A figure tipped until its other feet leave the ground reads as a glitch. Keep the feet planted and tip the body.
- **A reaction held too long.** Give a held face three beats, not one smug face for 1.6 seconds.
- **A face in its hands read as the back of a head** at phone size. A reaction needs the eyes: he looks into the lens.
- **The line landed on the wrong face:** the speaker's caption ran over the listener's close-up.

## When a check fails

The table is in `AGENTS.md` ("When a check fails"). The rule under it: fix the film, never the limit.
