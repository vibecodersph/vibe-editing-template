<!--
  THE CLAUDE KAMI FORMULA: the one joke engine every episode is built on.
  Binding rules are in docs/canon.md; where this file and the canon differ, the canon wins.
  You may change the formula for your own series (and the matching checks in tools/check_canon.py), but keep it fixed once chosen:
  the point is that the engine stays and only the shoes change.
-->
# The Claude Kami formula: "Nadali mo, boss"

*One joke engine, a new pair of shoes every episode. Named after the comment the series wants from the viewer: "nadali mo boss hahaha" ("you got me, boss").*

## Why a formula

A series that invents a new joke mechanism every episode has to be funny from scratch every time. A series that fixes the engine and changes
only the place, the person and the shortcut gets better at the engine, and the viewer learns the rhythm. The story is new every episode
(CK-03); the engine is not (CK-04).

**Why it is funny.** A joke works when something is wrong and safe at the same time (the benign violation theory). The palusot is the
violation: a small, shameful shortcut. That everybody does it, and that it is a cartoon, makes it safe. The viewer laughs because it is true of
them, then sends it to the friend it is truest of.

## The engine: what never changes

Ten slots, in this order. Times are targets.

| # | Slot | When | What it must do | Example: the app nobody uses | Example: the thesis | Example: `episodes/00-legit-developer` |
|---|---|---|---|---|---|---|
| 1 | **Ang palusot** (the hook) | frame 0 to 3 s | Buloy says the shortcut out loud, proud or panicked, as the viewer has said it. Whole on frame 0 with the stake visible. | "Claude, tapos ko na yung app. Kagabi ko lang ginawa." | "[whispering] Claude, ano'ng ibig sabihin ng thesis ko?" | "Claude, legit developer ba ako?" |
| 2 | **Ang tanong** (the honest puncture) | by 4 s | Claude asks one short, plain, true question (or states one fact). Never mean. | "Ayos, boss. Sino nang gumamit?" | "Hindi mo binasa, boss?" | "Define 'legit.'" |
| 3 | **Ang amin** (the admission) | by 8 s | A close-up, and Buloy admits it, held (under a music stop) or snapped. The first laugh. | "Ako." | "[whispering] Ikaw ang sumulat!" | "Grabe ka namaaan." |
| 4 | **Ang bisita** (the pressure) | 8 to 12 s | Someone from the place arrives who needs exactly what the palusot skipped: the user, the panel, the client, the captain. (Optional in a two-hander: the example has none.) | the shop owner, behind him | the panel chair: "Bakit ito ang methodology mo?" | none |
| 5 | **Ang lusot** (the wriggle) | 12 to 35 s | Buloy tries to keep the shortcut alive, each try worse than the last; a laugh or a turn every eight seconds. | "So gagawan ko siya ng utang tracker?" | "Kasi po... robust po siya, Ma'am." | "Eh lahat naman nagse-search niyan eh." |
| 6 | **Ang hindi** (Claude will not cover) | inside 5 | He asks Claude to save him; Claude helps with what he can and refuses to pretend. Honesty is what escalates the scene. | "Ako bahala sa code. Pero yung pakikipag-usap sa tao, ikaw yun." | "Kaya kitang bulungan, boss. Pero ikaw ang nakatayo diyan." | "Na wala talagang nakakaalam. Karamihan pa dyan, nagkukunwari lang." |
| 7 | **Ang baliktad** (the plain fix) | 30 to 40 s | The simple human act the shortcut skipped turns out to be the answer, often from the guest. | ask the shop owner first | explain it to the guest | "Inayos mo rin naman, boss. Wala ngang nagturo sa 'yo." |
| 8 | **Ang linya** (the line worth keeping) | late | Said aloud as a short pair: Buloy sets it up, Claude finishes it. This is the line people save and send. | "Hindi pala panalo yung mabilis mag-build." / "Panalo yung may gumagamit." | "Kung naipaliwanag mo kay Aling Nena, naintindihan mo na." | "So, legit na ba ako?" / "May na-ship kang ginagamit ng mga tao." |
| 9 | **Ang button** | before the card | A deadpan last jab in plain idiom, often money, food or utang. | "Bumili ka muna, boss. Nakakahiya." | "Nasa abstract, boss." | "Napa-search din ako eh. Nakalimutan ko rin kasi paano mag-for loop." |
| 10 | **Ang card** | over the last line | The closing card; its sentence is "Bago <the situation>, <one act> muna." | "Bago mag-build, magtanong muna." | "Bago mag-submit, intindihin muna." | "Bago magduda sa sarili, mag-ship muna." |

Also fixed, from the canon: Buloy and Claude carry it (a guest gets a few lines), Claude is honest, Taglish with Filipino grammar, no
counting in spoken lines, the sound floor, solid hands, the speaker on screen for his whole line, forty to fifty-five seconds.

**Who owns the palusot.** Buloy, always: he is the viewer's stand-in. A guest may push him into it (a client), but the person caught is
Buloy. Jokes that belong to a machine or to a fear have no admission, and have no laugh to land on.

## The timpla: what changes every episode

| Axis | What it is | Bank |
|---|---|---|
| **Sapatos** (the shoes) | the place, who Buloy is there, and the moment of pressure. Any field, as wild as it can be staged: a church, a fishing boat at dawn, a space capsule, a barbershop, a tarpaulin print shop before a fiesta | `data/formula/sapatos.json` |
| **Palusot** (the shortcut) | the thing the viewer does and does not admit, from builder and AI life, carried into those shoes | `data/formula/palusot.json` |
| **Bisita** | who arrives to test it | a field of each sapatos |
| **The stake prop** | what the hook is about, on frame 0 above the bottom fifth: the receipt, the stamp, the tarpaulin, the file list | a field of each sapatos |
| **The button's object** | the food, the coin, the utang that ends it | written per episode |

Rules for the mix:

- A pair of shoes and a palusot is used once. The same palusot may come back in new shoes, but not within three episodes; the same place may
  come back with a new palusot (a reused set is the cheapest episode).
- The palusot has to be **builder or AI life** even when the shoes are wild: an astronaut who approved the landing maths without reading it, a
  fisherman who trusts the app over the birds.
- Wild shoes cost a new set. Alternate: a wild set, then a reused one. Sets that exist: see `AGENTS.md`.

## Writing one

1. **Pick the timpla.** `python tools/ideas.py --n 5` lists fresh pairs of shoes and palusot, scored, with the used ones left out. The person
   picks unless they have named one.
2. **Fill the formula block** in `script.json` (`formula`: sapatos, palusot, the line numbers of the tanong, the amin, the bisita, the linya
   and the button, the caption question, the hidden gag). `tools/new_episode.py` writes it with `TODO`s (or with the sapatos and palusot, if you pass
   `--sapatos` and `--palusot`).
3. **Write the ten slots as beats, then the lines.** The palusot's first line is the sentence the viewer has said; the linya is a pair.
   Native Taglish: write it as it is said in a jeep, never translated from English.
4. **Ten hooks** for slot 1, scored; take the best and keep one alternative.
5. **Gate:** `python tools/check_canon.py episodes/NN-slug`.
6. **The person reads the lines** for grammar before anything is voiced (CK-12).
7. Then the usual road: voice, set, sound, `qa.py`, render (`AGENTS.md`, and the `claude-kami` skill).
