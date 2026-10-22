# Licences and sources

Every file in this repository may be shared under the licence named here. The list comes from an audit made on 2026-10-22,
before the repository was made public. When you add a sound, a picture or a font, add it here and to its folder's
`SOURCES.json` with where it came from and its licence, and only add what you have the right to share.

## Code and docs

| What | Licence |
|---|---|
| `src/`, `tools/`, `video/` (except the fonts and images below), `docs/`, `.claude/skills/`, the example's `script.json` and `stage.js` | MIT, see `LICENSE` |
| three.js 0.181.2 and GSAP 3.14.2, loaded from a CDN when the page renders (not stored here) | three.js: MIT. GSAP: its free Standard License, https://gsap.com/standard-license |
| hyperframes 0.8.137, run with `npx` (not stored here); it downloads its own headless Chrome on first use | Apache-2.0 (https://github.com/heygen-com/hyperframes); Chrome under Google's own terms |

## Fonts

| File | Copyright | Licence |
|---|---|---|
| `video/assets/fonts/Fraunces.ttf` | Copyright 2020 The Fraunces Project Authors (github.com/undercasetype/Fraunces) | SIL Open Font License 1.1, text in `video/assets/fonts/OFL.txt` |
| `video/assets/fonts/Gelasio.ttf` | Copyright 2022 The Gelasio Project Authors (https://github.com/SorkinType/Gelasio) | SIL Open Font License 1.1, text in `video/assets/fonts/OFL.txt` |

## Images

| File | Owner | Use |
|---|---|---|
| `video/assets/brand/vibe-coders-ph-logo-text-white.png` | Vibe Coders PH | The default logo on the closing card. Not under MIT. Show it unchanged, or put your own logo in `series.json`. |
| `video/assets/brand/vcph-star-512.png` | Vibe Coders PH | The star on the developer's hoodie (`src/lib/40-cast.js`) and the default credit chip. Not under MIT. Same rule. |

Vibe Coders PH allows these two images to be shared inside this template, unchanged. Replacing them with your own logo and avatar is the expected use.

Everything else you see in a frame (the people, the rooms, the props, the signs) is drawn by code in `src/`. The shop names on
signs are made up (for example ALING NENA, VIBE COLA, KAPEHAN).

## Sounds

| File | Made by | Licence |
|---|---|---|
| `audio-lib/sfx/stamp-low.mp3`, `scratch-stop.mp3`, `womp.mp3`, `ping-soft.mp3`, `whoosh-air.mp3`, `error-buzz.mp3`, `chime-up.mp3`, `sparkle-dust.mp3`, `claps-small.mp3`, `key-tap.mp3`, `ba-dum-tss.mp3` | code: `tools/synth_sounds.py` (numpy and ffmpeg, no recordings) | CC0-1.0 |
| `audio-lib/music/lofi-bed.mp3` | code: `tools/synth_sounds.py` | CC0-1.0 |
| `audio-lib/sfx/bulb-hum.mp3` | code: numpy (mains hum and a faint buzz) | CC0-1.0 |
| `audio-lib/sfx/amb-morning-fan-long.wav` | code: ffmpeg (filtered noise and a hum, a stand fan in a room) | CC0-1.0 |

## The example's voices

| Files | Made by | Licence |
|---|---|---|
| `episodes/00-legit-developer/audio/line_00.mp3` to `line_19.mp3` (and `line_NN.orig.mp3`, the takes before fitting) | Vibe Coders PH, 2026-10-22, with ElevenLabs `eleven_v4` on a paid plan, using the ElevenLabs default voices Liam and Brian | CC0-1.0 for these recordings. The voices themselves are ElevenLabs'; to make new lines with them you need your own ElevenLabs account. |

## Left out, and why (do not add these back)

| What | Why |
|---|---|
| The Pixabay sound effects the series used (error, ping, pop, sparkle, typing, two whooshes, and key clicks cut from them) | Pixabay's licence does not allow sharing the files themselves. You may download them from Pixabay for your own videos. |
| The HeyGen catalogue music and effects (six music beds, ten effects) | No licence was found that allows sharing them. |
| The series' ElevenLabs sound effects and their long loops | The plan they were made on is not recorded, so they stay out until that is confirmed. |
| Platform icons (Instagram, Facebook, TikTok, YouTube, Gmail) | Trademarks, and their source was not recorded. |
| The series' own voice clips | Voice Library voices of real people, and one personal cloned voice. |

## The Claude character

The Claude in these skits (an orange block with eyes) is a fan-made depiction. "Claude" is a trademark of Anthropic. This project
is not affiliated with, sponsored by or endorsed by Anthropic.
