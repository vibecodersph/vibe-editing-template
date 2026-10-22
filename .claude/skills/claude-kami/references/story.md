# Story: from an idea to a script that passes

## 1. Pick the idea

`python tools/ideas.py --n 5` lists fresh pairs of shoes (a place) and palusot (a shortcut), scored and with the used ones left out
(`--reuse` keeps only places that already have a set, which saves building the room but not the staging; `--wild 2` favours stranger places; `--count` says how many are left).
Offer the person three to five, one line of case each, your recommendation first. If they already have an idea, check it against these:

- **A stake the viewer carries**: money, work or school.
- **A sentence the viewer has said or heard** that can be the first line.
- **A place every Filipino has stood in**, staged so a viewer knows it in a second.
- **A palusot from builder or AI life** that Buloy owns, even when the place is wild.
- **Unrelated to every earlier episode as a story** (CK-03). A place and a shortcut are used together once (the bank reads `episodes/*/script.json`).
- **A picture for frame 0** that tells the joke with the sound off.
- **A build you can afford**: a reused set saves building the room, but every new story still needs its own staging (`episodes/NN-slug/stage.js`, one act
  per line the set does not already know); a new set is a builder job on top of that. For a first episode, reuse the `kwarto` room and start from the
  example's stage.js.

If the pair is not in the banks, add the palusot to `data/formula/palusot.json` or the place to `data/formula/sapatos.json` first (the gate checks
they exist).

## 2. Beats before lines

Write the beats with target times, then the lines (this is the formula, `docs/formula.md`):

| When | Beat |
|---|---|
| frame 0 to second 3 | the hook: the viewer's own sentence, the whole of it on screen |
| by second 4 | Claude punctures it with one honest question (the tanong) |
| by second 8 | the first laugh, made with silence: the music stops, a beat, Buloy admits it in close-up (the amin) |
| every 8 seconds after | a laugh or a turn; Claude helps with what he can and will not pretend |
| late | one line worth keeping, said aloud by two characters as a short pair (the linya) |
| before the card | a deadpan button in plain Filipino idiom |
| over the card | a last line or laugh; the card's sentence is the one message |

Keep it a two-hander. Buloy and Claude carry it; a guest gets a line or two. Forty to fifty-five seconds. A sung line runs about 3.7 seconds and a
laugh line 4 to 6, so budget with measured clips, not word counts. Add up the voiced takes before building.

## 3. The hook lab

Write ten hooks for slot 1 across five families (a confession, a boast, a question, a complaint, a plan), score each 0 to 2 on: does the
viewer say this, does it cost them something, does it loop to the ending, does it make a picture on frame 0, does it raise the pulse. Take
the best as the lead and keep an alternative that differs in the first three seconds. A first line is at most 70 characters (the gate checks).

## 4. The script, in the chat first

Show the person the script before it becomes JSON: a stage direction in plain text, the spoken line under it. In order:

1. **The one message** and the closing sentence (two or three rows, at most 24 characters each). The shape the example uses is
   "Bago <the situation>, <one act> muna." Aim the warning at the situation, not at the viewer's habit: "Bago ipagawa sa AI, aralin muna." scolds the
   viewer; "Bago mawalan ng WiFi, aralin muna ang code." says the same thing about the outage.
2. **Cast and voices**: Buloy, Claude, at most a guest.
3. **The lines** with a shot idea for each.
4. **The beats with times**, the linya, the button, the hidden gag (a small thing in the set that only a few notice).
5. **The caption's question**, as one sentence the viewer would answer in the comments (it goes in `formula.caption`).

## 5. Language and character

- Taglish is a Filipino frame with English roots: "nag-deploy", "i-test", "na-hit". Not English and Tagalog side by side.
- Check every Filipino sentence for grammar, on screen and spoken. A pun is two clean sentences, never one broken one. Watch for calques from
  English ("Tapat lang" for "Sa totoo lang"). There is no tool for this: read each line as a native speaker would say it, and have the person read it.
- Claude is honest. He says what he does not know. He never promises, flatters or sells.
- No counting in spoken lines: no numbers, no "tatlo", no "first, second". Numbers may sit on a screen or a receipt.
- Any fact a line states (a price, a rule, a study) is checked against two reliable sources first. A real, named person does not appear in a line
  without their say-so.
- The tag in `text` (`[whispering]`, `[shouting]`, `[laughs]`) is at most one per line. A word the voice misreads gets a `say` spelling.

## 6. Then `script.json`

`python tools/new_episode.py NN-slug "Title" --sapatos ID --palusot ID [--set <name>]` writes the skeleton with the formula block, the voices from
`series.json`, `"mix": 2` and the sound recipe's shape (it posts and voices nothing). Fill in: one entry per line (`who`, `shot`, `act`, `text`, `pre`
for a held silence, `cuts` on words), `open_shot`, `hook_caption`, `end_message`, and `card: true` on the last line. The formula block names the line
numbers of the tanong, amin, bisita, linya, button, the caption question and the gag. The audio block names kit files (`lofi-bed.mp3`, `scratch-stop.mp3`, a room tone) as placeholders:
choose the right ones for the story (`references/production.md`). Staging (`stage.js`) comes after voicing. The schema is in `AGENTS.md`; `episodes/00-legit-developer/script.json` is a finished one, and
`docs/cinematography.md` explains the `shot` strings (use `"cine": 1` and grammar shots for a new episode).

## 7. Gates on the script

- `python tools/check_canon.py episodes/NN-slug` prints PASS or says what to fix (a WARN or SKIP is read, not ignored). Fix before voicing: a voiced
  line costs credits.
- A second reader (a fresh subagent or the person) does the swipe test on the first three seconds: the lines, the planned frame, the caption. Would a
  stranger stay, what do they think it is about, which laugh beats do they believe.
- The person reads the lines (CK-12). Then record it in `formula.checked`: `"CK-12": "<who> read the lines, <date>"` and `"CK-11": "..."`. `check_canon.py
  --strict` needs such a note for each human check it would otherwise SKIP (CK-05, CK-06, CK-07, CK-11, CK-12, CK-19).
