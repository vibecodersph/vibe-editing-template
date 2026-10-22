---
name: kami-setup
description: "First-run setup for the Claude Kami template: check and install what the machine needs, set up the .env keys without ever showing them, fill in series.json (handle, credit, logo), pick two ElevenLabs voices the person's own account can use, and render the example episode to prove it works. Use when the person says 'set me up', 'i-setup mo ako', 'first time', 'paano magsimula', 'getting started', 'install', 'something is not installed', 'command not found', 'bakit hindi gumagana', 'pumili ng boses', 'pick voices', or opens this folder for the first time. Not for making an episode (use claude-kami)."
---

# Kami setup

You are setting up a folder so a person who may not code can make skit videos. Do the technical work yourself, in plain words, and ask
them only for what is theirs: an OK before installing, their keys (which they paste themselves), and the choices in `series.json`.
Answer in the language they write in (Taglish or English). The engine's manual is `AGENTS.md`. Never post or publish anything for them; do
not commit unless they ask.

## 1. Say what is about to happen

One short message: you will check the computer, install what is missing (with their OK), help them set up their keys, fill in their series
details, render the example video, and pick two voices. Rendering the example needs no key and spends nothing. Tell them it takes a while:
the first render downloads a browser and takes several minutes.

## 2. Check the machine

Run each and note what is missing:

```
git --version
python --version          (needs 3.10 or newer; if only python3 exists, use python3 everywhere, here and in every later command)
python -c "import PIL, numpy"
node --version            (22 or newer: hyperframes 0.8.137 needs it)
ffmpeg -version
ffprobe -version
```

If everything is there, skip to step 3. Otherwise list what is missing and **ask before installing**.

- **Windows 11 (tested):** `winget install --id Git.Git -e`, `winget install --id Python.Python.3.12 -e`, `winget install --id OpenJS.NodeJS.LTS -e`
  (check `node --version` is 22 or newer afterwards), `winget install --id Gyan.FFmpeg -e`. A new program is only found in a new terminal: after
  installing, tell the person to restart Claude Code (or open a new terminal) and run this skill again. If `python` opens the Microsoft Store, install
  Python with winget as above.
- **macOS (not yet tested):** with Homebrew (`brew --version`; if it is missing, send them to https://brew.sh, the install needs their password):
  `brew install git python node ffmpeg`.
- **Linux (not tested):** use the system package manager for git, python3 and ffmpeg. The distro's `nodejs` is often older than 22: use NodeSource
  or nvm.

Then `python -m pip install pillow numpy`. On macOS or Linux with only `python3`, use `python3 -m pip ...`. On Homebrew Python this can fail with
an "externally managed" error (PEP 668): make a venv (`python3 -m venv .venv`), install pillow and numpy into it (`.venv/bin/python -m pip install pillow numpy`),
and run every tool with `.venv/bin/python` from then on. `.venv/` must stay out of git (do not commit it; if it shows in `git status`, tell the
person). Do not install anything else: the first render downloads its own headless Chrome through `npx`, which needs internet.

## 3. Keys

Rendering the example needs none. New episodes need an ElevenLabs key (voices; sound effects). A Gemini key is optional (a check that every word is
heard; descriptions of sounds; images if they ever want them). Both send things to those companies, so you will ask before each use.

1. If `.env` does not exist, copy `.env.example` to `.env`. **Never open, print or paste the contents of `.env`.**
2. Tell the person to open `.env` in any editor and paste each key after its `=` sign themselves: no quotes, no spaces around the `=`. Never ask for a
   key in the chat. **If they paste one into the chat, it is leaked** (a chat cannot be deleted): tell them to revoke it at
   https://elevenlabs.io/app/settings/api-keys or https://aistudio.google.com/apikey and make a new one.
   - ElevenLabs: sign up at https://elevenlabs.io, then create a key at https://elevenlabs.io/app/settings/api-keys (if you restrict the key, allow
     Text to Speech, Sound Effects, and read access to Voices). The Free plan gives 10,000 credits a month, about 1 per character; an episode is about
     800 to 1,000 characters. Free is for personal, non-commercial use only; a monetized channel needs a paid plan (Starter, about $6 a month).
   - Gemini (optional): https://aistudio.google.com/apikey . The free tier covers `hear.py` and `describe.py`, but Google may use what is sent to improve
     its products and people may review it, so send nothing private. Image generation is paid only and not needed.
3. Check they are filled without showing them:
   `python -c "import re;t=open('.env').read();[print(k,'set' if re.search('^'+k+'=.+',t,re.M) else 'empty') for k in ('ELEVENLABS_API_KEY','GEMINI_API_KEY')]"`
   (this prints only `set` or `empty`).

## 4. series.json: the card

Ask, one or two questions at a time, and write the answers into `series.json`:

- Their handle for the card (for example `@theirname`) -> `card.handle`.
- A credit chip? `card.credit`: `label` ("Made with"), `name`, `handle`, `avatar` (an image path). Set `credit` to `null` for none.
- Their logo -> `card.logo`, a path relative to `video/` (they put the file in `video/assets/brand/`). The shipped logo belongs to Vibe Coders PH: if
  they have no logo, set `logo` to `null`. A logo of another shape needs the `#endlogo` CSS block in `src/index.template.html` adjusted: with their OK
  you may edit that block (see `docs/end-card.md`), then look at the card at full size afterwards.
- The Vibe Coders PH star on the developer's hoodie is part of the character, not the card, and stays.

Voices come in step 6. `series.json` ships with empty voice ids on purpose.

## 5. Prove it works

```
python tools/render.py episodes/00-legit-developer v1
```

Tell the person it takes several minutes the first time (browser download). Read the exit status, not just the log tail. When it succeeds, the files
are in `renders/`: `00-legit-developer-v1-upload.mp4` (the one to post), `-v1.mp4` and `-v1-phone.mp4`. Tell the person the full path and offer to open
the folder. If it fails, read the error, check the traps at the end of `AGENTS.md`, fix what is yours to fix (a missing tool, a typo in `series.json`),
and run it again. Do not run anything else that uses `video/` while it runs.

The example's voices were made with ElevenLabs default voices (Liam and Brian), which ElevenLabs is retiring. That does not affect rendering it: its
clips are already made. Ask them to watch it and check that the closing card shows their handle and credit.

## 6. Voices

No ElevenLabs voice works for every account: the old default voices exist only for accounts made before March 2026 and expire on 2026-12-31, and Voice
Library voices are not available through the API on the Free plan. So the person picks two voices their own account can use (`voices.buloy`,
`voices.claude`). Needs the ElevenLabs key from step 3.

1. **List the voices** with a read-only command that reads the key from `.env` without printing it (needs a key with Voices read access):
   `python -c "import re,json,urllib.request as u;k=re.search('^ELEVENLABS_API_KEY=(.+)',open('.env').read(),re.M).group(1).strip();r=u.Request('https://api.elevenlabs.io/v2/voices?page_size=100',headers={'xi-api-key':k});[print(v['voice_id'],v.get('category'),v['name'],sep=' | ') for v in json.load(u.urlopen(r))['voices']]"`
   On Free, use voices whose category is `premade` (old accounts only, until 2026-12-31), `generated` (made with Voice Design in their own ElevenLabs
   account) or `cloned`. Library voices need a paid plan. If nothing fits, tell them how to make one with Voice Design in their account, then list again.
   Ask what each character should sound like (Buloy: a Filipino developer; Claude: deadpan) and suggest two from the list.
2. **Test them** (with their OK; about 40 credits): write a git-ignored scratch episode `episodes/_voicetest/script.json` with a `voices` block holding
   the two candidate ids and two lines, one per voice, in the same shape as the example's lines (for example Buloy: "Claude, legit developer ba ako?",
   Claude: "Define legit."), then `python tools/voice.py episodes/_voicetest`. The person listens to the two mp3s in `episodes/_voicetest/audio/`. Try
   another pair if they do not like them (each trial spends credits; ask again).
3. **Write the chosen ids** into `series.json` `voices` (`buloy`, `claude`), each with a `note` naming the voice. `tools/new_episode.py` refuses to start an
   episode until both ids are set.

## 7. Hand over

Tell them what is ready, and that the next step is: "let's make an episode about ..." (or "gawa tayo ng bagong episode tungkol sa ..."). That starts the
`claude-kami` skill. Remind them the Claude plan is the main cost, voices cost credits and the Gemini check sends audio to Google (you will ask each
time), and they post the finished video themselves.
