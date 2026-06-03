# create-lottie-experiments

Scaffold a [Skia/Skottie](https://skia.org/docs/user/modules/skottie/) Lottie
player that you drive with an LLM: the agent writes the animation to
`public/lottie.json` and the running app **hot-reloads** it.

```bash
npm create lottie-experiments@latest my-animation
cd my-animation
npm install
npm run dev
```

Then point any coding agent (Claude Code, etc.) at the project. It reads
`CLAUDE.md` and the bundled `write-lottie` skill, generates a renderable Lottie
into `public/lottie.json`, and the dev server reloads it on save.

## What you get

- A full-screen Lottie player (CanvasKit / Skottie) with play/pause, frame seek,
  and Figma-style pan/zoom.
- `public/lottie.json` — the one file that controls what renders. Overwrite it
  to change the animation; the dev server reloads automatically.
- `CLAUDE.md` + `.claude/skills/write-lottie/` — so an LLM knows exactly where to
  write and how to produce a file Skottie can render (the big gotcha: shapes must
  be wrapped in a `"ty": "gr"` group).

## Developing this scaffolder

The repo root is the single source of truth; `template/` is generated from it.

```bash
node sync.mjs        # regenerate ./template from the repo root
node index.mjs ../tmp-test   # try the CLI locally
```

`sync.mjs` also runs on `prepack`, so `npm publish` always ships a fresh
template.
