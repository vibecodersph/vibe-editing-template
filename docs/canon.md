<!--
  THE CLAUDE KAMI CANON: the series' rules, in one list.
  These are Claude Kami's rules. You may change them for your own series: change the rule here, change the matching check in
  tools/check_canon.py (Claude can do both), and keep the ids. Never edit a rule to make one episode pass; for a single
  exception use a waiver (CK-26).
  Machine gate: python tools/check_canon.py episodes/NN-slug
-->
# Claude Kami canon

**Read this before any work on an episode: idea, script, voice, set, render or fix.** Each rule has an id (CK-nn). When a brief, a note or a
remembered decision differs from this file, this file wins. The ids are the ones `tools/check_canon.py` prints; a missing number is a
rule the template does not use, and numbers are never reused.

## The series

- **CK-01 What it is.** A short skit for builders: Buloy (a low-poly Filipino developer, the viewer's stand-in) and Claude (an orange
  block, deadpan and honest) trade lines in Taglish in a Filipino place. Every frame is code (Three.js through HyperFrames); no
  generated video. Pictures may be mixed in as plates, textures and inserts.
- **CK-02 Its own cast.** Buloy and Claude carry every episode. Characters from other series do not appear here, and these two do not
  appear in other series.
- **CK-03 Every episode is a complete story unrelated to the others.** No callbacks, no running plot, no recurring sign-off. This is about
  the story. It does not forbid repeating the joke's engine.
- **CK-04 One formula, a new timpla.** Every episode is built on `docs/formula.md`: the same ten slots, with new shoes (a place) and a new
  palusot (a shortcut) each time. `script.json` carries a `formula` block that names them.

## The story

- **CK-05 The hook is real and on frame 0.** A sentence the viewer has said or heard, with a stake in money, work or school. The whole
  first line shows as one caption on frame 0 (`hook_caption`) and is at most 70 characters, the thing it is about sits above the bottom fifth of
  that frame, something moves in the first shot, and frame 0 says the situation with the sound off.
- **CK-06 Claude is honest.** He never flatters, never promises, never pitches; he says what he does not know. In a story drawn from a
  real AI failure (faked tests, a deleted drive), Claude warns and the shortcut is Buloy's; Claude is never the one who breaks things.
  (The gate cannot judge this; a person or a critic does.)
- **CK-07 Buloy owns the palusot.** The person caught is Buloy, the viewer's stand-in. Claude's honest question (the tanong) starts by 4.0 s
  and exposes it; Buloy's admission (the amin) starts by 8.0 s, as a held beat or a snap. The amin is Buloy's first reply after the
  tanong, of any length, or else a reply of one to four words. (`docs/formula.md`, slots 1 to 3.)
- **CK-08 A character says the line worth keeping, and a button follows.** The line is said aloud as a short pair (one character sets it up,
  the other finishes it), late; a deadpan button in plain Filipino idiom comes before the card.
- **CK-09 Two-hander.** Buloy and Claude speak at least half the lines; guests get a few. Forty to fifty-five seconds.
- **CK-10 Facts are sourced.** A price, a rule or a study in a line is checked against two reliable sources first. A real, named person
  does not appear in a line without their say-so.

## Language

- **CK-11 Taglish is Filipino grammar with English roots**, written as a native speaker says it, never translated from English ("nag-deploy",
  "i-test", "na-hit"). Every on-screen and spoken Filipino string is grammar-checked. A pun is two clean sentences, never one broken one.
  Watch for calques ("Tapat lang" for "Sa totoo lang"). No tool checks this: a person reads it.
- **CK-12 The person reads the lines before they are voiced.** A voiced line costs credits and a re-voice costs more. Claude drafts; the
  person decides every line.
- **CK-13 No counting in spoken lines.** No numerals, no number words, no "first, second". Numbers may sit on a screen or a receipt.

## Voices

- **CK-14 Every speaker with lines has a voice.** `voices` in `script.json` holds a `voice_id` for each `who` that has lines (new episodes
  copy them from `series.json`).
- **CK-16 A voice is a choice you make with the person, and it may cost money.** Voice Library voices are not available through the ElevenLabs API
  on the Free plan; voices you design or own are, and the old default voices only on accounts made before March 2026 (they expire on 2026-12-31).
  Test a voice with one short line before using it for a script. Re-voice a line twice at most, then rewrite it.

## Picture and sound

- **CK-17 The sound floor.** One music bed under at least 85 percent of the film, stopped once on purpose where the first laugh lands; a
  room tone under everything; at least two accents and three cuts per ten seconds; -14 LUFS within 1 LU, true peak at or under -1 dBTP.
  The mix is dialogue-led (`"mix": 2`, which `tools/new_episode.py` sets): every line is normalised so both voices sit within 1.5 LU of
  each other; the bed under speech at least 15 dB below the dialogue; no effect louder than the dialogue's loudest moment minus 3 dB;
  the room tone 20 to 32 dB below. Gate: `tools/soundcheck.py` measures and fails these.
- **CK-18 Hands hold solid things.** Nothing passes through anything; nothing held is see-through. Gate: `tools/qa.py`.
- **CK-19 The speaker is on screen for his whole line**, and every caption sits on its speaker. Words on signs and screens are whole or
  absent in every camera that sees them.
- **CK-20 The closing card** is the same every episode (your logo, handle and credit from `series.json`); its sentence is new each time,
  the episode's one message, two or three rows of at most 24 characters, and the last line plays over it (`card: true`). The shape the
  example uses is "Bago <the situation>, <one act> muna." (aim the warning at the situation, not at the viewer's habit); the gate checks
  the rows and `card: true`, not the shape. Measurements: `docs/end-card.md`.
- **CK-21 One hidden gag.** A small thing only a few will notice, in the set, never pointed at (a mug, a file name, a sign).

## Making it

- **CK-25 One episode in the engine at a time.** `video/` has one tenant: never build, snapshot, QA or render two things at once.
- **CK-26 The gate comes before the render:** `python tools/check_canon.py episodes/NN-slug` prints PASS (`--strict` fails a SKIP too, unless
  `formula.checked` says who did each human check and when: CK-05, CK-06, CK-07, CK-11, CK-12 and CK-19; the example has none), then
  `soundcheck.py`, `qa.py` and a look at the frames. A failed gate is reported as failed and fixed; its limits are never lowered. **Only the
  person who owns the series can excuse a FAIL, for one episode.** A waiver is their decision, never Claude's: Claude may propose one, they
  decide, and the text says who decided and why. It goes in the episode's `script.json` as `formula.waived` `"CK-07": "<who decided, and why>"`
  (any non-empty text), and the gate prints WAIVED (the example episode waives CK-07: its reply lands at about 8.9 s).

## What the gate checks

| Rule | `tools/check_canon.py` checks |
|---|---|
| CK-04 | `script.json` has a `formula` block with every slot filled, and its sapatos and palusot are in `data/formula/`. With no `formula` block there is one WARN and the formula rows (CK-04, CK-07, CK-08, CK-21) are skipped |
| CK-05 | `hook_caption` set; the first line is a hook of at most 70 characters; an `open_shot` |
| CK-05 (frame 0 reads), CK-06, CK-11, CK-12, CK-19 | SKIP: a person reads or looks (record who and when in `formula.checked` to pass `--strict`) |
| CK-07 | the tanong is Claude's and starts by 4.0 s; the amin is Buloy's first reply after it (any length) or else one to four words, and starts by 8.0 s (times from `timeline.json`; SKIP before the build) |
| CK-08 | the formula names the linya (a pair said by two characters) and the button, in that order, before the card line |
| CK-09 | Buloy and Claude speak at least half the lines; 40 to 55 s (from `timeline.json`) |
| CK-13 | no numerals or number words in any spoken line |
| CK-14 | every speaker with lines has a `voice_id` in `voices` |
| CK-17 | a music bed with a stop, a room tone, at least one effect (the full floor is `soundcheck.py`) |
| CK-20 | `end_message` has two or three rows of at most 24 characters; the last line has `card: true` |
| CK-21 | the formula names a hidden gag |
