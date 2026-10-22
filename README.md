# Vibe Editing

![Isang frame mula sa example episode / A frame from the example episode](docs/img/example.png)

Lumaki ang Vibe Editing mula sa Claude Kami, ang skit series ng [Vibe Coders PH](https://vibecoders.ph).

**Taglish.** Gumawa ng kahit anong klaseng video sa pakikipag-usap lang kay Claude Code. Wala kang isusulat na code.

**English.** Make any kind of video just by talking to Claude Code. You write no code.

Basahin sa: [Taglish](#taglish) | [English](#english)

---

<a id="taglish"></a>
# Taglish

## Ano ito

Isang folder na may lahat ng kailangan ni Claude para gumawa ng video para sa iyo. Ikaw ang magsasabi kung ano ang gusto mo, sa sarili mong salita. Si Claude ang magsusulat ng code, magre-render, at magtatanong kapag may kulang.

Kahit anong video: explainer, kinetic text, motion graphics, skit. Kahit anong art style, topic o message. Vertical, horizontal o square.

May isang ready-made na style na kasama, para may mapanood ka agad. Low-poly na 3D skit: isang developer at si Claude (isang orange na block) na nag-uusap sa Taglish sa isang lugar sa Pilipinas. Ang example video ay nasa `episodes/00-legit-developer`, at nagre-render ito nang walang kahit anong key.

Kung ibang klase ng video ang gusto mo, si Claude ang gagawa nito gamit ang HyperFrames, at gagamitin niya ang mga boses at tunog na nandito na. Mas maraming balikan ito (mas maraming usap at ayos) kaysa sa ready-made na style.

## Ano ang kailangan

- [ ] Computer. Sa Windows 11 pa lang ito na-test, kaya 'yon pa lang ang sigurado namin.
- [ ] Paid na Claude plan (Pro, Max, Team o Enterprise). Wala ang Claude Code sa free plan.
- [ ] Internet. Kailangan ito sa unang render. Mga 150 MB ang isang tapos na cut, kaya may espasyo ka dapat.
- [ ] Isang idea, kahit malabo pa.

Wala nang iba. Ang mga programang kailangan pa (Node.js, Python, ffmpeg) ay si Claude ang mag-i-install, basta pumayag ka.

## Paano magsimula

1. Mag-sign up sa Claude at kumuha ng paid plan (Pro ang pinakamura). Ang presyo ay nasa [claude.com/pricing](https://claude.com/pricing).
2. I-download at i-install ang Claude desktop app sa [claude.com/download](https://claude.com/download). May Claude Code na sa loob nito. Hindi mo kailangan ng terminal (ang itim na window na puro text).
3. Kunin ang template na ito. Sa GitHub page na ito, pindutin ang **Code**, tapos **Download ZIP**, tapos i-unzip (i-extract) ang file. Kung may GitHub account ka, puwede ring **Use this template**.
4. Sa Claude desktop app, buksan ang Claude Code at piliin ang folder na in-unzip mo.
5. Sabihin: **"i-setup mo ako"** (o "set me up"). Ang `vibe-editing-setup` ang titingin kung ano ang kulang, mag-i-install kapag pumayag ka, gagawa ng `.env` (isang file na pinaglalagyan ng mga keys mo), itatanong ang handle mo at ang mga boses, at magre-render ng example.
6. Panoorin ang example sa `renders/00-legit-developer-v1-upload.mp4`.
7. Sabihin kay Claude ang gusto mo. Itatanong niya ang mga kulang, tapos magdi-draft siya para basahin at baguhin mo. Magtatanong din siya bago gumastos ng credits.

Ang `vibe-editing` skill ang gumagabay sa buong proseso, mula idea hanggang render.

## Ano ang sasabihin kay Claude

Sa sarili mong salita. Mga halimbawa:

- "Gawa tayo ng 30-second na vertical video tungkol sa ..."
- "Gusto ko ng explainer na may malalaking text na gumagalaw, para sa ..."
- "Horizontal na intro para sa channel ko, simple lang, kulay ..."
- "Gawa tayo ng skit na kagaya ng example, pero sa ibang lugar."
- "Ito ang script ko. Gawan mo ng video."

Kapag malabo pa ang idea, sabihin mo lang 'yon. Magtatanong si Claude hanggang luminaw.

## Lahat ng tools at magkano

Ang "needed" ay kailangan talaga. Ang "optional" ay puwedeng wala.

| Tool | Ano ang ginagawa | Magkano | Needed o optional |
|---|---|---|---|
| **Claude Code** (nasa Claude desktop app o terminal) | Ito ang kausap mo. Siya ang sumusulat at nagpapatakbo ng lahat. Ginawa ang template na ito gamit ang Claude Opus 5.5, na kasama sa Pro at Max. Mas malalaking trabaho, mas malaking bahagi ng limits ng plan mo. | Pro $20 kada buwan ($17 kada buwan kung yearly ang bayad). Max simula $100 kada buwan. [claude.com/pricing](https://claude.com/pricing) | Needed |
| **ElevenLabs** (model eleven_v4) | Mga boses at sound effects. Key sa `.env`: `ELEVENLABS_API_KEY`. | Free: $0, 10,000 credits kada buwan, mga 1 credit kada character ng speech. **Personal, non-commercial use lang ang Free**, at hindi magagamit ng API ang Voice Library voices. Starter: $6 kada buwan, may commercial licence, 30,000 credits, at library voices. Mas maraming credits ang kinakain ng sound effects kaysa sa isang spoken line. [elevenlabs.io/pricing](https://elevenlabs.io/pricing) | Optional. Kailangan lang para sa bagong boses o bagong sound effect |
| **Google Gemini API** (model gemini-3.8-flash) | Nakikinig sa tapos nang video para i-check kung malinaw ang bawat salita, at naglalarawan ng mga tunog. May optional din na paggawa ng picture para sa set (Gemini image model, bayad lang, hindi kailangan). Key sa `.env`: `GEMINI_API_KEY`. | Free tier ang gamit. **Sa free tier, puwedeng gamitin ng Google ang ipinapadala mo para pagandahin ang products nila, at puwedeng may taong magbasa nito, kaya huwag kang magpadala ng private.** Magtatanong muna si Claude. [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) | Optional |
| **HyperFrames** | Ginagawang video file ang eksena. Open source (Apache-2.0). Dina-download nito ang sarili nitong headless Chrome (browser na walang window) sa unang takbo. | Libre | Needed, kusang naii-install |
| **Three.js** at **GSAP** | Gumuguhit at nagpapagalaw ng 3D scene. | Libre. Kusang nilo-load mula sa web | Needed, kusang naglo-load |
| **Node.js 22+**, **Python 3.10+** (may Pillow at numpy), **ffmpeg** | Mga libreng programa na kailangan ng mga tools. | Libre. Si Claude ang mag-i-install, basta pumayag ka | Needed |
| **Git for Windows** | Para magamit ni Claude Code ang Bash tool nito sa Windows. | Libre | Optional (recommended) |
| **GitHub account** | Para sa "Use this template" lang. Hindi kailangan ng Download ZIP. | Libre | Optional |

Hindi ginagamit ang **Lyria** (music model ng Google). Gawa sa code ang music dito.

Wala nang ibang account o key. Sa `.env` file mo lang nakalagay ang mga keys, at hindi ito umaalis sa computer mo.

**Tungkol sa mga boses.** Ang example ay ni-voice gamit ang mga default voice ng ElevenLabs na nire-retire na. Hindi nito naaapektuhan ang pag-render ng example. Para sa sarili mong video, tutulungan ka ng setup na pumili ng mga boses na magagamit ng account mo sa pamamagitan ng API, at magte-test muna ito ng isang maikling linya ng bawat isa (ilang dosenang credits).

**Tungkol sa effort.** Matagal gumawa ng bagong video. Ang staging at ang pag-build ay kumakain ng malaking bahagi ng limits ng Claude plan mo.

## Ano ang sa iyo pa rin

Si Claude ang bahala sa files at commands. Sa iyo ang:

- ang idea at ang gusto mong sabihin
- ang taste mo sa itsura at sa tunog
- ang final say sa bawat linya (nagdi-draft si Claude, ikaw ang nagde-decide)
- ang mga boses mo
- ang sarili mong assets na may karapatan kang gamitin
- ang panonood sa bawat cut bago i-post
- ang pag-post mismo. Ikaw ang magpo-post, hindi si Claude

## Ano ang laman

- `src/`, `tools/`, `video/`: ang engine (ang eksena, ang mga command, ang HyperFrames project)
- `docs/`: cinematography, story formula, mga rules ng series, at licences
- `audio-lib/`: mga tunog na puwedeng gamitin ng kahit sino (CC0)
- `episodes/00-legit-developer`: ang example video, voiced na, nagre-render nang walang key
- `series.json`: ang handle mo sa card, credit, logo, at ang mga boses na pipiliin mo
- `.env.example`: kopyahin bilang `.env` para sa mga keys mo
- `.claude/skills/vibe-editing-setup`: unang takbo
- `.claude/skills/vibe-editing`: ang buong proseso ng paggawa ng video

## Lisensya, credits at disclaimer

- Code: MIT, tingnan ang [LICENSE](LICENSE).
- Ang mga tunog sa `audio-lib/` ay gawa sa code o ginawa ng Vibe Coders PH gamit ang ElevenLabs, at lahat ay CC0.
- Mga font: sa ilalim ng SIL Open Font License.
- Ang Vibe Coders PH logo at ang star sa hoodie ng karakter ay pag-aari ng Vibe Coders PH. Ang logo sa card ay itinatakda sa `series.json`, kaya ilagay mo ang sarili mo. Pakiusapan mo si Claude na palitan ang star kung gusto mo.
- Mga detalye: `docs/licences.md`.

**Disclaimer.** Ang Claude character ay fan-made na paglalarawan. Ang "Claude" ay trademark ng Anthropic. Hindi ito affiliated sa Anthropic at hindi rin ineendorso ng Anthropic.

---

<a id="english"></a>
# English

*A full translation of the Taglish section above, in the same order.*

## What this is

One folder with everything Claude needs to make videos for you. You say what you want, in your own words. Claude writes the code, renders the video, and asks when something is missing.

Any kind of video: explainer, kinetic text, motion graphics, skit. Any art style, topic or message. Vertical, horizontal or square.

One ready-made style is included, so you have something to watch right away. Low-poly 3D skits: a developer and Claude (an orange block) talking in Taglish in a place in the Philippines. The example video is in `episodes/00-legit-developer`, and it renders with no keys at all.

If you want a different kind of video, Claude builds it with HyperFrames and reuses the voices and sounds that are already here. It takes more back-and-forth (more talking and fixing) than the ready-made style.

## What you need

- [ ] A computer. So far it has been tested on Windows 11 only, so that is the only one we are sure about.
- [ ] A paid Claude plan (Pro, Max, Team or Enterprise). The free plan does not include Claude Code.
- [ ] Internet. It is needed on the first render. One finished cut is about 150 MB, so keep some free space.
- [ ] An idea, even a fuzzy one.

That is all. The other programs it needs (Node.js, Python, ffmpeg) are installed by Claude, if you say yes.

## How to start

1. Sign up for Claude and get a paid plan (Pro is the cheapest). Prices are at [claude.com/pricing](https://claude.com/pricing).
2. Download and install the Claude desktop app from [claude.com/download](https://claude.com/download). Claude Code is already inside it. You do not need a terminal (the black window full of text).
3. Get this template. On this GitHub page, press **Code**, then **Download ZIP**, then unzip (extract) the file. If you have a GitHub account, you can also press **Use this template**.
4. In the Claude desktop app, open Claude Code and pick the folder you unzipped.
5. Say: **"set me up"** (or "i-setup mo ako"). `vibe-editing-setup` checks what is missing, installs it when you say yes, makes your `.env` (a file where your keys go), asks for your handle and your voices, and renders the example.
6. Watch the example at `renders/00-legit-developer-v1-upload.mp4`.
7. Tell Claude what you want. It asks for what is missing, then drafts something for you to read and change. It also asks before anything spends credits.

The `vibe-editing` skill guides the whole process, from idea to render.

## What to say to Claude

In your own words. Some examples:

- "Let's make a 30-second vertical video about ..."
- "I want an explainer with big moving text, for ..."
- "A horizontal intro for my channel, simple, in the color ..."
- "Let's make a skit like the example, but in a different place."
- "Here is my script. Make a video from it."

If the idea is still fuzzy, just say so. Claude keeps asking until it is clear.

## Every tool and what it costs

"Needed" means you cannot do without it. "Optional" means you can.

| Tool | What it does | Cost | Needed or optional |
|---|---|---|---|
| **Claude Code** (in the Claude desktop app or a terminal) | The one you talk to. It writes and runs everything. This template was built with Claude Opus 5.5, which is included in Pro and Max. Bigger jobs use more of your plan's limits. | Pro $20 a month ($17 a month billed yearly). Max from $100 a month. [claude.com/pricing](https://claude.com/pricing) | Needed |
| **ElevenLabs** (model eleven_v4) | Voices and sound effects. Key in `.env`: `ELEVENLABS_API_KEY`. | Free: $0, 10,000 credits a month, about 1 credit per spoken character. **Free is personal, non-commercial use only**, and its API cannot use Voice Library voices. Starter: $6 a month, commercial licence, 30,000 credits, and library voices. Sound effects cost far more credits than a spoken line. [elevenlabs.io/pricing](https://elevenlabs.io/pricing) | Optional. Only needed for new voices or new sound effects |
| **Google Gemini API** (model gemini-3.8-flash) | Listens to the finished video to check every word is clear, and describes sounds. Also optional picture generation for a set (Gemini image model, paid only, not needed). Key in `.env`: `GEMINI_API_KEY`. | Free tier. **On the free tier, Google may use what you send to improve its products, and people may review it, so send nothing private.** Claude asks first. [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) | Optional |
| **HyperFrames** | Turns the scene into a video file. Free and open source (Apache-2.0). Downloads its own headless Chrome (a browser with no window) the first time. | Free | Needed, installed automatically |
| **Three.js** and **GSAP** | Draw and animate the 3D scene. | Free. Loaded automatically from the web | Needed, loaded automatically |
| **Node.js 22+**, **Python 3.10+** (with Pillow and numpy), **ffmpeg** | Free programs the tools need. | Free. Claude installs them, if you say yes | Needed |
| **Git for Windows** | Lets Claude Code use its Bash tool on Windows. | Free | Optional (recommended) |
| **GitHub account** | Only for "Use this template". Download ZIP needs none. | Free | Optional |

**Lyria** (Google's music model) is not used. The music here is made from code.

No other accounts or keys. Your keys live only in your `.env` file, which never leaves your computer.

**About the voices.** The example was voiced with ElevenLabs default voices that are being retired. That does not affect rendering it. For your own video, the setup helps you pick voices your account can use through the API, and it tests one short line of each first (a few dozen credits).

**About the effort.** A new video takes a while. Staging and building use a good share of your Claude plan's limits.

## What is still yours

Claude does the files and the commands. These are yours:

- the idea and what you want to say
- your taste in the look and the sound
- the final say on every line (Claude drafts, you decide)
- your voices
- your own assets that you have the right to use
- watching every cut before you post
- posting it yourself. You post, not Claude

## What is inside

- `src/`, `tools/`, `video/`: the engine (the scene, the commands, the HyperFrames project)
- `docs/`: cinematography, the story formula, the series rules, and licences
- `audio-lib/`: sounds anyone may reuse (CC0)
- `episodes/00-legit-developer`: the example video, already voiced, renders with no keys
- `series.json`: your card handle, credit, logo, and the voices you pick
- `.env.example`: copy it to `.env` for your keys
- `.claude/skills/vibe-editing-setup`: first run
- `.claude/skills/vibe-editing`: the whole process of making a video

## Licences, credits and disclaimer

- Code: MIT, see [LICENSE](LICENSE).
- The sounds in `audio-lib/` are made from code or by Vibe Coders PH with ElevenLabs, and all are CC0.
- Fonts: under the SIL Open Font License.
- The Vibe Coders PH logo and the star on the character's hoodie belong to Vibe Coders PH. The logo on the card is set in `series.json`, so put your own there. Ask Claude to change the star if you want.
- Details: `docs/licences.md`.

**Disclaimer.** The Claude character is a fan-made depiction. "Claude" is a trademark of Anthropic. This project is not affiliated with or endorsed by Anthropic.
