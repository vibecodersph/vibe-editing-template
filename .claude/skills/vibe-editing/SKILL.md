---
name: vibe-editing
description: "Vibe editing: make any video by talking to Claude. Any topic, message, length, shape (vertical, horizontal, square) and look. Claude asks what the video is about, writes the script, gets the voices and sounds, builds it, shows frames, and renders the file. One ready-made look is included (a low-poly 3D skit in Taglish); anything else is built from scratch with HyperFrames. Use when the person says 'make a video', 'gawa tayo ng video', 'vibe editing', 'make a reel', 'gumawa ng reel', 'make a TikTok', 'explainer', 'gawan mo ako ng explainer', 'skit', 'make a skit', 'new episode', 'bagong episode', 'gawa tayo ng bagong episode', 'i-render', 'render it', 'ayusin ang video', 'fix the video', 'palitan ang linya', 're-voice', 'list ideas', 'bigyan mo ako ng idea', or asks about a script, a voice, a shot, a sound or a render in this folder. For first-time installs, keys and picking voices use vibe-editing-setup."
---

# Vibe editing

The person tells you what video they want. You do the technical work. They keep the creative choices: the topic, the message, the look, every
line that is said, the voices. This skill grew out of Claude Kami, Vibe Coders PH's skit series. The manual of the included skit style is
`AGENTS.md`.

Talk plainly, like a friend who edits videos. No jargon without a few words of explanation. Answer in the language the person writes in.

## Before anything

1. Is this folder set up? `series.json` has two voice ids, `.env` has the keys the next step needs. If not, use `vibe-editing-setup` first.
2. Only one job at a time may use `video/` (building, checking, rendering). Before a long job, say how long it will take.
3. Do not edit `src/` or `tools/` for a video. They are the engine.

## Step 1: ask first

Ask one or two questions at a time, in plain words. Do not start building before you have these:

- **What is it about?** The one thing the viewer should remember or feel afterwards.
- **Who is it for?** Where will they see it?
- **How long?** (15, 30, 60 seconds.)
- **The shape.** Vertical (Reels, TikTok, Shorts), horizontal (YouTube), or square.
- **The look.** Offer the ready-made style as one choice among many, and say what it looks like: a **low-poly 3D skit**, a developer and Claude (an
  orange block) talking in Taglish in a Philippine place. The finished example is `episodes/00-legit-developer`. Other looks the person can name
  or describe: a cartoon, clean text and shapes, a slideshow with photos, a screen-recording style, a product demo, whatever they picture. If
  they send a video they like, ask what they like about it.
- **Sound.** Voices or narration? Which language? Music? Sound effects?

Then pick the road:

- They want the included look -> **Road A**.
- Anything else -> **Road B**.

Say which road you chose and why, in one or two sentences.

## Road A: the ready-made skit

A short skit. Every frame is code (Three.js, rendered by HyperFrames). Read `docs/canon.md` (the rules; a check tests them), `docs/formula.md`
(the story formula) and `AGENTS.md` first. The two references hold the steps:

- `references/story.md`: idea, beats, hook, language, the script.
- `references/production.md`: voices, staging, sound, checks, frame 0, a second reader, mistakes already made.

| Step | What | Where |
|---|---|---|
| 1. Idea | number it (the next unused NN under `episodes/`; the example is 00, so the first is 01); `python tools/ideas.py`; offer three to five, your pick first; the person chooses or names their own | `references/story.md` |
| 2. Script | the ten slots as beats with times, then the lines; `python tools/new_episode.py NN-slug "Title" --sapatos ID --palusot ID [--set <name>]`; fill `script.json`; `python tools/check_canon.py episodes/NN-slug` | `references/story.md` |
| 3. Read | the person reads every line and changes what they want. Record it in `formula.checked` (`CK-12`, `CK-11`: who and when) | `references/story.md` |
| 4. Voice | ask first, then `python tools/voice.py episodes/NN-slug`; check every line was heard; fix pace with `squeeze.py` and `tempo.py` | `references/production.md` |
| 5. Stage | write `episodes/NN-slug/stage.js`: one act per line the set does not already know, modelled on `episodes/00-legit-developer/stage.js`. The longest step: tell the person. Needs the voiced timings | `references/production.md` |
| 6. Sound | one music bed with one stop, a room tone, an accent on every punchline; real file names from `audio-lib/`; measure with `soundlook.py` | `references/production.md` |
| 7. Checks | `python tools/make.py episodes/NN-slug --cut v1` (canon, build, sound, picture, render, every-frame check, hear, look) stops at the first red; add `--no-hear` unless they said yes to the hear check | `references/production.md` |
| 8. Look | frame 0 from the finished file; the contact sheets at full size; a second reader if you can | `references/production.md` |
| 9. Hand over | tell the person the path of `renders/NN-slug-v1-upload.mp4` (and `-phone.mp4`), what is left unfixed, and that posting is theirs | here |

Long jobs: the first render takes several minutes, `make.py` about 5 minutes for a 55-second skit, `cast_sheet.py` several minutes.

The rules that never bend (full list: `docs/canon.md`):

- The hook is a sentence the viewer has said or heard, whole on frame 0.
- Taglish is Filipino grammar with English roots, as a native speaker says it. Never translated from English.
- Claude is honest: never flatters, never promises, never pitches.
- Music and sound effects are required. Hands hold solid things. The speaker is on screen for his whole line.
- A failed check is fixed in the film, never by lowering the check's limit. A waiver (`formula.waived`) is the person's decision, never yours:
  you may propose one, they decide, and its text says who decided and why.
- Nothing is voiced before the person has read the lines.

Revisions: two or three rounds at most. A new cut is a new name (`v2`), so an old file is never mistaken for the new one. Changing an
existing video starts at the step the change touches, then runs step 7 again.

## Road B: any other video

This road builds the video from scratch with HyperFrames, the same tool that renders Road A. It takes more back-and-forth than Road A, because
nothing is ready-made. Say so honestly.

**Once per computer, with the person's OK.** HyperFrames has its own set of Claude Code skills that teach Claude how its videos are made. Ask,
then run:

```
npx --yes hyperframes@0.8.137 skills
```

Then tell the person Claude Code may need a restart to load them, and to say "continue" afterwards. If the `hyperframes` skills are already
listed, skip this.

**Make the video in its own folder:**

```
npx --yes hyperframes@0.8.137 init videos/<short-name> --resolution <portrait|landscape|square> --non-interactive
```

Portrait is 1080x1920 (Reels, TikTok, Shorts), landscape is 1920x1080 (YouTube), square is 1080x1080. `--example <name>` starts from a ready-made
template (for example `blank`, `kinetic-type`, `product-promo`, `swiss-grid`). Use the same `hyperframes@0.8.137` in every command so it matches
the rest of this folder.

**Then:**

1. Write the script and the shot list in the chat first: what the viewer sees and hears, second by second. The person approves it before you build.
2. Build it by following the HyperFrames skills (they say how to lay out the scenes, animate, preview and render).
3. Voices and narration: this folder's `tools/voice.py` voices any folder that has a `script.json` with `voices` and `lines`, the same shape as
   `episodes/00-legit-developer/script.json`. It writes `audio/line_NN.mp3` and word timings in `audio/manifest.json`. **Ask first: it spends
   credits.** Add up the characters not yet voiced and say the cost.
4. Sounds: `audio-lib/` has free-to-use (CC0) music and sound effects; `SOURCES.json` in each folder describes every file. Use real file names.
5. Look before you call it done. Show the person frames, not only words: frame 0 with `ffmpeg -v error -y -i <file>.mp4 -frames:v 1 frame0.png`,
   and a contact sheet with `python tools/sheet.py <file>.mp4 <out-prefix>`. Look at them at full size yourself first. Then the finished file.
6. Tell the person the path of the finished video, what is left unfixed, and that posting is theirs.

## Ask first, always

- **Before anything that spends money or credits** (`voice.py`, `crowd.py`, `voice_lab.py`, `sfx.py`, `gen_image.py`): say what it will cost and
  wait for a yes. Voices are about 1 credit per character on ElevenLabs. **A sound effect costs far more than a spoken line: check the price on
  https://elevenlabs.io/pricing and say it before generating one** (do not quote a number from memory).
- **Before anything that sends audio to Google** (`hear.py`, `describe.py`, and `sfx.py`, which runs `describe.py` on what it makes when a Gemini key
  exists), on any key, free or paid. On the free tier Google may use it to improve its products and people may review it. On Road A, ask once,
  before the first `make.py` run, whether they want the hear check. If not, always pass `--no-hear` and do not run `describe.py`.
- **Never print, ask for or paste a key.** Keys are in `.env`, which only the person edits. A key that reaches the chat is leaked: tell them to
  revoke it and make a new one.
- **Never post or publish.** The person posts their own video. Do not commit unless they ask.
- The person owns the creative choices. You draft; they read, change and approve. Do not decide the message, the look or the lines for them.
