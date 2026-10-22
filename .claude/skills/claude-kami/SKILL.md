---
name: claude-kami
description: "Make, check, fix and render an episode of Claude Kami: a code-only 3D skit where a low-poly Buloy talks to an honest Claude (an orange block) in Taglish. Covers picking the idea, the script and hook, voices, the set and camera, sound, the checks, and the render. Use when the person says 'new episode', 'bagong episode', 'let's make an episode about ...', 'gawa tayo ng episode', 'gawa tayo ng bagong episode', 'gumawa ng skit', 'make a skit', 'next episode', 'list episode ideas', 'bigyan mo ako ng idea', 'i-render', 'render the example', 'ayusin ang episode', 'fix the episode', 'palitan ang linya', 're-voice', or asks about a script, a voice line, a shot, a sound or a render in this folder. For first-time installs, keys and picking voices use kami-setup."
---

# Claude Kami

A short skit for Filipino builders. Buloy (a low-poly Filipino developer, the viewer's stand-in) and Claude (an orange block, deadpan and honest)
trade lines in Taglish in a Filipino place. Every frame is code (Three.js through HyperFrames). You do the technical work; the person owns the
story, the final say on every line, the voices and the look. The engine's manual is `AGENTS.md`; this skill is the order of work, and the two
references hold the steps:

- `references/story.md`: idea, beats, hook, language, the script.
- `references/production.md`: voices, staging, sound, checks, frame 0, the second reader.

## Before anything

1. Read `docs/canon.md` (the rules; the gate checks them), then `docs/formula.md` (ten fixed slots; a new place and shortcut each time), then
   `AGENTS.md`. `episodes/00-legit-developer` is a finished example of every key.
2. Is this folder set up? `series.json` filled (card and both voice ids), `.env` has the keys the next step needs, the example renders. If not, use `kami-setup`.
3. `video/` takes one job at a time. Never build, QA or render two things at once. Tell the person before a long job and how long it takes: the first
   render (several minutes), `make.py` (about 5 minutes for a 55-second episode), `cast_sheet.py` (several minutes).
4. Do not edit `src/` or `tools/` for an episode. A new place is `src/sets/<name>.js`; an episode's own staging is `episodes/NN-slug/stage.js`.

## Rules that never bend (the canon, short)

- Every episode is a complete story unrelated to the others. The joke's engine is the same every time (the formula).
- The hook is a sentence the viewer has said or heard, with a stake in money, work or school, whole on frame 0.
- Taglish is Filipino grammar with English roots, as a native speaker says it. Never translated from English.
- Claude is honest: never flatters, never promises, never pitches. Buloy owns the palusot; Claude's honest question exposes it.
- No counting in spoken lines. Numbers may sit on a screen.
- Music and sound effects are required, with an accent on every punchline. Hands hold solid things. The speaker is on screen for his whole line.
- A failed check is fixed in the film. Its limit is never lowered. A waiver (`formula.waived`) is the person's decision, never yours: you may propose
  one, they decide, and its text says who decided and why.

## Ask the person; do not decide for them

- The idea: offer three to five from `python tools/ideas.py`, one line of case each, your recommendation first. They pick, or name their own.
- The lines: you draft, they read and change. Nothing is voiced before they have read the lines (CK-12).
- Voices, the look, a new set, any sound they must have the right to use.
- **Before anything that spends money or credits** (`voice.py`, `crowd.py`, `voice_lab.py`, `sfx.py`, `gen_image.py`): say what it will cost and wait
  for a yes. For voices, add up the characters of the lines not yet voiced (about 1 credit per character on ElevenLabs). **A sound effect costs far
  more credits than a spoken line: check the price on https://elevenlabs.io/pricing and say it before generating one** (do not quote a number from memory).
- **Before anything that sends audio to Google** (`hear.py`, `describe.py`, and `sfx.py`, which runs `describe.py` on what it makes when a Gemini key
  exists): on any key, free or paid. On the free tier Google may use it to improve its products and people may review it. **Ask once, before the first
  `make.py` run, whether they want the hear check.** If not, always pass `--no-hear` (and do not run `describe.py`). With no Gemini key, `make.py` reports
  hear as SKIP.
- Never print, ask for or paste a key. Keys are in `.env`, which only the person edits. A key that reaches the chat is leaked: tell them to revoke it
  and make a new one.
- The person posts the finished video themselves. You never post or publish. Do not commit unless they ask.

## The loop

| Step | What | Where |
|---|---|---|
| 1. Idea | number it (next unused NN under `episodes/`; the example is 00, so the first is 01); `python tools/ideas.py`; the person picks | `references/story.md` |
| 2. Script | the formula's ten slots as beats with times, then the lines; ten hooks scored; `python tools/new_episode.py NN-slug "Title" --sapatos ID --palusot ID [--set <name>]`; fill `script.json`; `python tools/check_canon.py episodes/NN-slug` | `references/story.md` |
| 3. Read | the person reads every line for grammar and changes what they want. Record it: `formula.checked` `"CK-12"` and `"CK-11"` with who and when | `references/story.md` |
| 4. Voice | ask, then `python tools/voice.py episodes/NN-slug`; check every line was heard; fix pace with `squeeze.py` and `tempo.py` | `references/production.md` |
| 5. Stage | **write `episodes/NN-slug/stage.js`**: one act per line the set does not already know, modelled on `episodes/00-legit-developer/stage.js`. The longest and most token-heavy step: tell the person. For a first episode, reuse the `kwarto` room and start from the example's stage.js. Frame 0 needs the first line's pose from time zero | `references/production.md` |
| 6. Sound | one bed with one stop, a room tone, an accent on every punchline; real file names from `audio-lib/`; measure with `soundlook.py` | `references/production.md` |
| 7. Checks | `python tools/make.py episodes/NN-slug --cut v1` (canon, build, soundcheck, qa, render, every-frame qa, hear, look) stops at the first red; add `--no-hear` unless they said yes to the hear check | `references/production.md` |
| 8. Look | frame 0 from the finished file; the contact sheets at full size; a second reader if you can | `references/production.md` |
| 9. Hand over | tell the person the path of `renders/NN-slug-v1-upload.mp4` (and `-phone.mp4`), what is left unfixed, and that posting is theirs | here |

Stage after voicing: the stage keys moments to the voiced words (the example's stage reads `audio/manifest.json`), so the timings must exist.

Revisions: two or three rounds at most; stop at the second when it is good. A new cut is a new name (`v2`), so a stale file is never read as the new one.
Fixing or re-cutting an existing episode starts at the step the change touches, then runs step 7 again; after any change to the cuts, run `qa.py` again.

## Mistakes already made (keep the checks)

- Trusted a thumbnail sheet and a builder's own report: hands through props, a flood that read as a floor. **Look at full size.**
- Dropped the music, the accents and the said-aloud line a little more each episode. Run `soundcheck.py` and count the laugh beats.
- Frame 0 was a figure standing still because the pose waited for the line. **Take frame 0 from the finished file.**
- Signs half hidden behind a head. Whole or absent.
- Judged a dark set by eye and opened on a frame a stranger read as "a candle-lit cake". Measure brightness against the example episode, and ask a
  reader what frame 0 says with the sound off.
- Placed effects by the start of the file; several are silent for a third to half a second, so hits landed late. Measure with `soundlook.py`.
- Trusted a passing QA after adding a cut. A new cut is a new sample: run it again.
- Cut to the listener's face while the speaker's caption was still up; with the sound off the line became the listener's. The speaker stays on
  screen for his whole line; the reaction comes after it, in silence.
- Put the stake (a raised stamp) on a table, under the frame. What the hook is about sits above the bottom fifth of frame 0 (the gate's line), and
  higher is safer: a thing low in the frame falls under the phone app's interface.
- Measured a render that had failed its layout check: the files in `renders/` were the cut before. **Read the render's exit status.**
- Changed the speed of a re-voiced line and got the old take back under the new timings. Check a new take before touching its speed.
- Checked contacts on a 0.1 s sweep only. A one-frame touch sat between the samples until a retiming moved it onto one. After a retiming, run
  `python tools/qa.py episodes/NN-slug --step 0.0333333 --no-images` (every rendered frame). Hair is not in that check: look at anything worn on a head.
- Wrote a rule from a style card and removed what had worked. A new rule is tested against an episode that worked before it is kept.
