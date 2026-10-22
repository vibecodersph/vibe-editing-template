# Cinematography: shots by intent

`src/lib/51-cine.js` is a virtual cinematographer. A line's `shot` can be a **grammar string** ("cu:buloy", "pov:claude", "two") instead of an entry in a
camera table; the engine solves it into a camera from where the cast really stands, frames it by film rules, gives it a little life, lights it, and the QA
(`tools/qa.py`) measures the result. Hand-placed shots (`SET.shots`, the base table in `50-direct.js`) are untouched: an episode without `"cine"` and
without a grammar string renders pixel for pixel as it did (checked with canvas hashes of the engine before and after, at five or six moments each).

Research behind the rules: shot sizes, thirds, the 180-degree rule, the He, Cohen, Salesin 1996 conversation idiom, phone-app safe areas. The numbers below are the director's, tuned by looking at frames; where a number was changed after looking, it says so.

## 1. The grammar

| string | what it is |
|---|---|
| `ecu:<who>` `cu:<who>` `mcu:<who>` `ms:<who>` | a single: extreme close-up, close-up, medium close-up, medium |
| `ws:<who>` | one whole figure, 0.60 of the frame height |
| `pov:<who>` | frontal single of `<who>` from the other principal's eye line; Claude looks into the lens |
| `ots:<who>` | over the other principal's shoulder onto `<who>` (`ots:claude` = past Buloy's shoulder onto Claude) |
| `two` | both principals |
| `ws` | the wide: both principals, whole |
| `duo:<who>+<object>` | `<who>` and a prop (the laptop) together |
| `insert:<object>` | the object square-on, filling about 88 percent of the frame width |

`<who>` is `buloy` (the human character; see `AGENTS.md`), `claude` or `nena`. `<object>` is the name of a prop made with
`makeProp` (its `P.screens[0]` gives the front, the centre and the size: `laptop`), or a name the set or `stage.js` lists in `SET.cine.objects`.

**Lookup order for a shot name:** `SET.shots` (hand-placed, unchanged) -> `cine_shots` in script.json (named specs) -> grammar string -> the base table.
A bare `two` or `ws` is read as grammar only when the script has `"cine": 1` (the base table has a hand-placed `two` that old episodes use). A name with a colon
is always grammar. An unknown name in a `"cine": 1` script, or any name with a colon that is not grammar, is an error naming the shot; elsewhere the old
fallback (the `hero` camera) stays.

**Named specs** (`script.json` `cine_shots`), when a shot needs a number changed. A value is a grammar string, or an object:

```
"cine_shots": { "read": { "base": "cu:buloy", "at": 0.7 }, "hold": { "type": "ecu", "who": "claude", "push": 0, "eye": 0.5 } }
```

Fields: `type` (ecu cu mcu ms ws pov ots two duo insert), `base` (a grammar string to start from), `who`, `obj`, `size` (see the table), `eye` (the eye line, from the
top of the frame, 0 to 1), `x` (where the eyes sit across the frame, 0 to 1), `yaw` (degrees off the subject's facing; default 25, pov 4), `pitch` (the camera's
elevation angle, degrees), `fov` (vertical, degrees), `push` (default 0.04, insert 0), `arc` (degrees round the subject over the shot), `cap` (the caption's top
in px, which overrides the automatic lane), `flip` (cross the line of action on purpose), `at` (seconds after the cut at which the cast is read; default 0.05).

## 2. The numbers

All sizes are fractions of the frame height; a frame is 9:16 (a vertical `fov` of 30 degrees is 17 degrees across).

| shot | Buloy size (crown to chin) | eye line | Claude size (body box) | eye line | vertical fov |
|---|---|---|---|---|---|
| ecu | 0.50 | 0.42 | 0.62 | 0.52 | 26 |
| cu | 0.34 | 0.38 | 0.44 | 0.48 | 30 |
| mcu | 0.22 | 0.34 | 0.30 | 0.45 | 34 |
| ms | 0.14 | 0.32 | 0.20 | 0.45 | 38 |
| ws (one figure) | 0.60 (whole figure) | 0.48 | 0.60 | 0.48 | 50 |
| two | camera 70 to 100 degrees from the line of action, both eye points 0.30 to 0.50 from the top and at least 0.25 apart | | | | 44 |
| wide `ws` | both whole, 0.05 to 0.95 across | | | | 50 |
| pov | cu size | | | | set by the size and the distance (24 to 60) |
| ots | the subject's eyes at x 0.6 (mirrored when the room says so), eye line 0.40, the other principal's head at x 0.08 to 0.25, partly out | | | | 32 to 44 |
| duo | the eye at 0.28 to 0.50 from the top, the object lower, both inside 0.05 to 0.95 | | | | 40 |
| insert | the object 0.88 of the width | | | | 30 |

Why: eyes on the upper third; off-centre subjects; look room on the gaze side (eyes 0.06 off the middle); a close-up first, a wide only for isolation and the end.

**Singles.** The camera is 25 degrees off the subject's *facing* (what he looks at, not just the line to the other principal), toward the side of the line of action,
so he looks across the frame 15 to 25 degrees off the lens. Buloy's camera stands at his eye height minus 0.06 m; Claude's at his eye height plus 0.04 m. The sign
of the offset is chosen so that, on the screen, Buloy looks right and Claude looks left (the camera's side is +1; the opposite for -1): that is the 180-degree rule
built in.

**Changed after looking at frames:**
- A Claude is a landscape block (0.48 x 0.32 m): at the size 0.44 a frontal cu would be wider than the frame. The solver shrinks Claude's size until the block is at
  most 96 percent of the frame width, and (even in an ecu, which may crop the block) until his two eyes, taken as if he faced the lens, are at most 62 percent of the
  width apart, so both stay in the frame when he turns or talks. In practice Claude's ecu is a tight cu.
- A `pov` whose subject does not face the other principal (a set that turns Claude to the lens) goes frontal to where the subject looks instead (40 degrees is the limit).
- The camera of a `pov` is where the other principal's eyes are, backed off to the distance the size needs (often a hand behind his head); if that is inside his head
  box it is moved clear of it with the same search as a collision (below).
- `ots`: the foreground head must cover at most 42 percent of the width, and the subject's face must be 85 percent visible (a book held up between them is a miss).
- The caption's room: a Claude's face box for the caption and the QA is the patch round his eyes (x +-0.2, y 0.10 to 0.30 of his body), since he has no head.

## 3. Line of action and side

The line is from the two principals' eye points. The camera stays on one side of it for every automatic single and two-shot. `SET.cine.side` (`1` or `-1`) names the
side; without it the side with the longer free run (a ray from between them against the scene's meshes) wins, a tie going to the side of the lens (+z). `flip: true`
on a shot crosses it on purpose. `qaFlips` (in the QA) warns when two consecutive singles break the screen direction without a `flip`.

## 4. Collision and occlusion

A solved camera is rejected when it is inside a box-shaped solid (a wall, a desk), inside the other principal's head box (0.05 m margin), or when both eyes of the subject are
hidden by a mesh (raycast; hits nearer than the near plane do not count, since they are clipped; the subject's own meshes are skipped). The search then tries,
nearest first: azimuth +-3, 6, 9, 12 degrees; height +-0.04, 0.08 m; distance x0.85 with the lens widened to keep the size (at most 60). It takes the first clean
one that sees at least 85 percent of the face, else the one that sees most. `two`, `duo` and `ots` scan their whole grid for a clean camera. `insert` has a second tier
(25 to 70 degrees off square-on). When nothing is clean the shot keeps its best camera and the page logs `cine: no clean camera for ...` (`qa.py` prints it as `CINE WARN`).
The near plane is small for close shots (0.05 to 0.15, pov 0.06, ots 0.06, insert up to 0.2).

## 5. Camera life, punch-in, caption lane

Every cut is solved **once** at init: the cast and the set are posed at `cut.t + 0.05` exactly as the renderer would (`renderAt(t, { solve: true })`), the subjects are
read, the camera is solved and stored on the cut. A frame is then a pure function of the cut and the time, in any order. Subject motion inside a cut never moves the
camera (so a subject who walks across a long cut leaves the framing: cut again, `zoom`, or pick the moment with `at`).

- **push**: the camera ends 4 percent closer by the end of the shot (smoothstep, over the run of the shot; 0 for an insert). The anchor (the eye, or the middle of two)
  keeps its screen point. **arc**: degrees round the anchor over the shot.
- **breath** and `SET.shake` still apply, as in a hand-placed shot.
- **zoom**: a cut may carry `"zoom": 1.25`, with or without a shot (without = the shot on screen). It narrows the lens by that factor and re-aims so the eye keeps its
  place: the punch-in. In `script.json`: `cuts: [{ "word": 3, "zoom": 1.25 }]` (also in `pre_cuts`). A hand-placed shot zooms about the point it looks at.
- **caption lane** (automatic for solved shots): the caption box (two rows of 68.5 px, 900 px wide, centred) goes above the face box when it fits (24 px above the crown,
  top at least 250 px), else below the chin (24 px under it, bottom at most 1500 px); never over the eyes. The face box is measured over the whole push. A spec's `cap`
  overrides it.
- **caption end** (`"cine": 1` only, `build.py` `trim_caps`): a line's last caption ends at the first real cut after the line that changes the shot, never later; a card line with a `shot` cuts to it at its start minus 0.12 s.

## 6. Look

Opt-in: `SET.cine.look` or script `cine_look`, e.g.

```
{ "fog": "#070b1a", "key": "#ffb070", "keyI": 0.6, "rim": "#6c8cff", "rimI": 0.8, "fogNear": 0.25, "fogFar": 1.8 }
```

For every solved shot: a warm **key** PointLight 0.5 m from the subject's face, 38 degrees off the camera axis on the side he looks toward, a little under eye level (screen
glow); a cool **rim** behind the subject, opposite the key; `scene.fog` with near = camera-to-subject distance + `fogNear` (0.25) and far = distance + `fogFar` (spec: 3.0;
the example episode uses 1.8 so the room goes dark right behind the face). A hand-placed shot gets the set's own fog back and the two lights go out. `keyI` and `rimI` depend
on how hot the set's own lights are: Claude with a candle on his head needs `keyI` near 0.6 and the candle light turned down in a stage (as `docs/examples/cine-kwarto-stage.js` does).

Depth of field: not done. three is loaded from a CDN, not vendored, so its BokehPass example is not available locally, and the fog already separates the faces.

## 7. Claude's eyes

A line field `"eyes"` and `"eye_cuts": [{ "word": 3, "eyes": "dot" }]` (a change on a word). The shape holds until the next key; blend 0.08 s; blinks go on. Shapes
(`tools/lab.py ... --eyes` draws them, `renders/lab/claude-eyes.png`):

| name | box (m) and tilt | reads as |
|---|---|---|
| neutral | 0.04 x 0.08 | tall, attentive |
| flat | 0.052 x 0.0144 (18 percent) | deadpan |
| dot | 0.044 x 0.044 | alert |
| soft | 0.04 x 0.06, top tilted 8 degrees outward | sheepish |
| sad | 0.04 x 0.07, top tilted 15 degrees inward | sad |
| wide | 0.05 x 0.10 | startled |
| squint | 0.056 x 0.024 | suspicious |
| side-l, side-r | neutral, moved 0.024 to the screen left or right | glancing |
| happy | 0.056 x 0.034, raised 0.025 | squashed smile |
| closed | 0.054 x 0.008 | shut |

The key of a line is set 0.04 s before it starts, so a Buloy line may carry `eyes` for Claude's reaction. They are posed where the director poses the eyes; a set that poses
the eyes itself wins unless `SET.cine.pose = "after"`.

## 8. Eyelines

With `"cine": 1`, every frame: each principal looks at the other's eyes (weight 0.85) unless the speaking line says `"look": "screen"` (the laptop), `"lens"` (the camera of the cut), `"down"`, or a name (`"claude"`, `"buloy"`, `"nena"`); while Aling Nena
speaks and is on stage, both principals look at her. A cut whose speaker looks at the lens is solved twice (the first camera is the lens the second solve looks at), so the
solve sees the head the render will draw. Buloy: the head turns toward the point (yaw at most 50 degrees, pitch 25), the eyes (`gx`, `gy` of the face) take what is left. Claude: his yaw turns toward the point.
`CINE.lookAt(who, worldPoint, weight)` does the turning. The director calls it in `CINE.after`, after the set, and only where the set did not pose that part itself (a set that writes `vHead.rotation` or `C.rotation.y` wins);
`SET.cine.pose = "after"` makes the head and the eye shapes the director's even over a set that poses them. A set that poses Claude's yaw itself can ask for it:
`C.rotation.set(0, CINE.facing("claude", cy), 0)` (or wrap `C.rotation.set` in `stage.js`). Do not blend Claude's yaw part-way and let the set's own yaw swing: a
camera solved once cannot follow a Claude who turns during the cut (`docs/examples/cine-kwarto-stage.js` uses the full turn, and moves the fan and Claude's place a little).

## 9. The framing QA

`python tools/qa.py episodes/NN-slug --step 0.1` prints a **framing** section and writes `frame.json` and one overlay picture per shot and caption with a problem
(`renders/review/<short>-qa/frame/`: the face box in cyan, the eye points in magenta, the caption box in yellow, the safe lines in red). At every moment a caption of Buloy,
Claude or Aling Nena shows, for the speaker:

| check | FAIL | WARN |
|---|---|---|
| the face box (a 5 x 5 grid over the front of the head, Claude: the patch round his eyes): in the frame, not hidden by a mesh, and turned toward the lens (the face's forward normal within 80 degrees of the way to the camera: the rays skip the subject's own meshes, so the back of a head would read as seen) | under 80 percent; "turned away" | |
| both eyes in frame and not hidden | both hidden or out | |
| the caption box over the face box | over 10 percent, or over an eye | |
| the face centre in the phone app's safe area | not below 250 px and above 1500 px from the top; in the lower half (below 960 px) not left of 850 px | |
| the eye line in a single | | outside 0.20 to 0.60 |
| the face height while speaking | | under 0.08 (not in `ws` or `two`) |
| the caption box | | outside 250 to 1500 px |
| the 180-degree rule between consecutive singles | | the screen direction changes without `flip: true` (pov excluded) |

Lines: `FRAME FAIL t=12.31..13.50 (5 moments) line 4 buloy shot=cu:buloy: ...  [vis, eye line, face height, caption over face, centre]`. FAILs fail the run (exit 1) only
when script.json has `"cine": 1` or with `--frame-strict`; in an older episode the same findings print as `FRAME ADVICE` (never `FRAME FAIL`), so the log and `tools/make.py` can tell a
failure from advice (hand-placed shots in an older episode, measured: the speaker is out of frame for a whole line in two shots). While the closing card covers the scene (from `END.s`)
the caption is measured in the card's lane (506 px) and no face is measured; the card line before that (from 0.6 s ahead of the card) is measured as any line. The contact checks run as before. The safe-area numbers come from the research: the sources disagree (the bottom 250 to 670 px, a right rail about
230 px wide in the lower half); these are the widest that keep the interface clear.

## 10. How a set declares `SET.cine`

```
SET.cine = {
  side: 1,                       // optional: which side of the line of action the camera lives on
  pose: "after",                 // optional: eyelines and eye shapes win over the set's own acting (default "auto": only where the set left them)
  look: { fog, key, keyI, rim, rimI, fogNear, fogFar },
  objects: { bookopen: () => ({ c, n, w, h, pts, prop }) },   // what insert: and duo: may name besides a prop with a screen: centre, front normal (or null), size, corner points
}
```

All optional. A set needs nothing for the grammar: the subjects are read from `vHead`, `cBody`, `nenaHead` and the props from `GRIP.props`.

## 11. `stage.js`

`episodes/NN-slug/stage.js`, if it exists, is joined into the page right after the set file (in `build.py`, `lab.py`, `qa.py` and everything that calls `assemble_scene`),
before the director. It is for staging that belongs to one episode: it may set `SET.cine`, wrap `SET.update`, add props and acts, move a prop's rest position, add shots to
`SET.shots`. The worked example, committed, is `docs/examples/cine-kwarto-stage.js` (a stage.js for the kwarto room on grammar shots) with the matching script keys in
`docs/examples/cine-script-snippet.json`; scratch episodes named `episodes/_*` are git-ignored. The stage shows: `SET.cine`, the object list, wrapping `C.rotation.set` so Claude faces Buloy, dimming the candle
in the solved shots, and moving the fan and Claude's place for a Claude who now faces Buloy. A set keyed on shot names (kwarto's `cutAt("k_read")`) keeps working under grammar shots
with `"anchor": "k_read"` on the cut: a marker cut with that name is put at the same time as the real cut, listed just before it. Every loop that takes the last cut with t at or before now
lets a later entry win a tie, so the real cut owns every frame (`tools/make.py --selftest` checks all 60000 cut times in a minute against every frame time k/30).

## 12. In script.json

```
"cine": 1,                                            // the episode is directed by the cinematographer: default eyelines, framing FAILs count
"cine_shots": { "read": { "base": "cu:buloy", "at": 0.7 } },
"cine_look": { "fog": "#070b1a", "key": "#ffb070", "keyI": 0.6, "rim": "#6c8cff", "rimI": 0.8 },
"gap": 0.32,                                          // seconds between lines (default 0.32)
lines: { "shot": "cu:buloy", "eyes": "sad", "eye_cuts": [{ "word": 3, "eyes": "dot" }], "look": "screen",
         "pre_shot": "duo:buloy+laptop", "pre_anchor": "k_screen", "shot_anchor": "k_read",
         "cuts": [{ "word": 3, "zoom": 1.25 }, { "word": 6, "shot": "insert:book", "anchor": "k_book" }] }
```

Idiom (He, Cohen, Salesin 1996): stay on one side of the line, alternate the speakers' singles, use the listener's over-the-shoulder for variety, and cut to the listener's reaction in the
silence after a line (`pre_shot`), not during it. A close-up first (frame 0), a wide only for isolation and the ending; a cut on every line; a slow push inside each.

The director's rules, from two rounds of critic review of the example episode, for every episode:

- **A wide is a breath, not a stage.** `two` and `ws` hold for about one second at the head of a line (the room, the relationship), then the line cuts to the speaker's
  `mcu` or `cu` on its key word. A human beat (a confession, offence, warmth) is never played in a wide: a face under about 60 px on a phone reads as nobody.
- **A screen is shown, then the face.** `duo:` holds about two seconds, long enough to read the screen's few words, then the line cuts to the speaker's frontal close-up.
  The screen text is large and few words; it is whole or absent in every camera.
- **Claude's close-ups are square to the lens at his eye level**, his eyes clear; stage him so his eyes sit near the other principal's eye line (the example episode stands him
  on a stack of books), or every `pov` looks down on the top of the block.
- **The face is the brightest thing in its shot.** Dim and desaturate whatever glows behind a head (slats under a rim light, posters, saturated books), keep bloom off the
  foreground in the hook, and give a face under a warm key a pale cool fill.
- **Vary repeated framings.** Three lines in a row on one `cu` read as one long shot; change the size (`mcu`, `ecu`) or the zoom so a repeat looks meant.
- **The hidden gag stays hidden.** Readable in close-ups, never dead centre under the action.

## 13. Known limits

- The camera is solved at one moment of the cut. A prop that swings into the face right after the cut (a book Buloy lifts) or a subject who walks across the shot can
  leave the framing; use `at`, or cut again (`zoom`, or the same shot named twice) so each solve sees the new place.
- A set that animates Claude's yaw during a cut (a fan, a door and a candle beat) needs the full turn (or none) to keep a solved camera valid.
- `insert:` of a prop that moves (the book that slides out) frames where it stood at the cut's first moment.
- Aling Nena is a subject (`cu:nena`, `ots:nena`) but gets no eyeline of her own.
