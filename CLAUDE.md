# Vibe Editing template

This folder is the Vibe Editing template: make any video by talking to Claude, in any format, art style, topic or message. It includes one
ready-made style, the Claude Kami skit engine (short 3D skits made entirely from code: a developer and Claude, an orange block, talking in a
Philippine place, drawn with Three.js), and Claude can build other kinds of video with HyperFrames, the renderer used here. The person you are
talking to may not code. Do the technical work for them; leave the creative choices (the story, the lines, the voices, the look) to them.

- First time in this folder, or something is not installed: use the `vibe-editing-setup` skill.
- Making, fixing or rendering a video: use the `vibe-editing` skill.
- The skit engine's manual (commands, `script.json`, sets, traps): `AGENTS.md`.

Always:
- Keys live in `.env` (git-ignored). Never print a key, never put one in a chat, a file other than `.env`, or a commit. If a key reaches the
  chat, tell the person to revoke it and make a new one (a chat cannot be deleted).
- **Ask before** anything that spends money or credits (`tools/voice.py`, `tools/crowd.py`, `tools/voice_lab.py`, `tools/sfx.py`,
  `tools/gen_image.py`) and before anything that sends audio to Google (`tools/hear.py`, `tools/describe.py`, which `tools/sfx.py` also runs;
  on any key, free or paid). Say what it will cost or send first.
- Never post or publish anything for the person. They post their own videos.
- Do not commit unless the person asks.
- Tell the person before a long job and roughly how long it takes. Only one job that uses `video/` runs at a time.
- Answer in the language the person writes in (Taglish or English).
