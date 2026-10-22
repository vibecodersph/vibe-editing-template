# The closing card

Every episode ends on the same card: your logo, the episode's one message, your handle, and a small credit chip. You set the logo, handle and credit once, in `series.json`; each episode only writes its sentence (`end_message` in its `script.json`). The rule is CK-20 in `docs/canon.md`; this file holds the measurements.

The card lives in `src/index.template.html` (`#endcard`); its slots are filled by `tools/build.py` (`fill_card`) from `series.json`, and the message fit and the caption lane are in `src/lib/50-direct.js`. Every value is on the 1080x1920 frame, and every y is a visible pixel.

## What you change: `series.json` "card"

```
"card": {
  "logo": "assets/brand/your-logo.png",
  "handle": "@yourhandle",
  "credit": { "label": "Made with", "name": "Your name or channel", "handle": "your.site", "avatar": "assets/brand/your-avatar.png" }
}
```

- Paths are relative to `video/` (so `assets/brand/...` is `video/assets/brand/...`). Put your files there.
- `null` or a missing field leaves that element out: no `logo` means no logo, no `credit` means no chip, and so on.
- There are no platform icons on the card.
- **A logo of another shape needs its crop adjusted.** `#endlogo` and `#endlogo img` in `src/index.template.html` crop the padding of the logo that ships with the template (a 2560x1080 PNG whose opaque pixels are at x 39 to 2452, y 316 to 766). For another logo, make the PNG tight to its artwork (no transparent border) and set `#endlogo img` to `left: 0; top: 0; width: 860px; height: auto`, with `#endlogo`'s height equal to the logo's height at 860 px wide. Claude may edit that CSS block with the person's OK, and must then check the card at full size (`python tools/lab.py <name> --ep NN-slug --times <a time inside the card>` or a render) before calling it done.
- **The star is not the card.** The Vibe Coders PH star on the developer's hoodie is part of the character (`src/lib/40-cast.js` loads `vcph-star-512.png`); changing `card.logo` or `card.credit` does not touch it.

## The measurements

1. **The logo**: drawn 860 px wide, centred (left 110), top at y 290. With the shipped logo that is 160 px tall (bottom at y 450).
2. **The message**: the episode's `end_message` (two or three rows of at most 24 characters).
   - Fraunces 700, line-height 1.1, colour `#ffd65a` (Claude's caption yellow).
   - The reel caption's style: a stroke of size*5/78 px in rgba(18,10,34,.92), `paint-order: stroke fill`, and the caption's two shadows.
   - Fitted to width by `fitEndMessage()`: it starts at 108 px and shrinks in 0.5 px steps until the widest row, stroke included, is 800 px or less (two 24-character rows land at 65 px). The block's middle is at y 880.
3. **The handle row** (`card.handle`): middle at y 1130, Fraunces 600, 46 px, `#f4efff`.
4. **The credit label** (`card.credit.label`, for example "Made with"): Gelasio 400, 26 px, `#d9d0f2`, in a 40 px box whose top is at y 1279.
5. **The credit chip**, middle at y 1395 (y 1329 to 1461): a pill 132 px tall, padding 18/40/18/18, radius 66, fill rgba(20,14,40,.62) with a 2 px inner line of rgba(244,239,255,.28).
   - The avatar (`card.credit.avatar`) at 96 px, smooth scaling, with a 3 px `#f4efff` ring.
   - 22 px after it: the name (Fraunces 700, 44 px, white), and under it the handle (Fraunces 600, 32 px, `#f4efff`).
6. **The caption over the card.** The last line plays over the card (the CK-20 gate wants `card: true` on it). From the card's start every caption sits at top y 506, the free band between the logo (bottom y 450) and the message (top y 700 or lower). One caption row ends at about y 574, two at about y 645. A longer logo (taller than 160 px) pushes into that band: shorten it or move the lane.
7. **Safe zones**: nothing above y 250 or below y 1500, and no right edge past x 940 between y 900 and 1700, so the phone app's buttons never cover the card.
8. **Timing**: the card fades in from `end.s` + 0.25 s over 0.45 s and rises 24 px.

`hyperframes check` (run by `tools/render.py`) fails when a caption overlaps something on the card. Fix the caption's lane or shorten the line; do not move the card.
