#!/usr/bin/env node
// `npm create lottie-experiments <dir>` / `npx create-lottie-experiments <dir>`
// Copies the bundled template into <dir> and prints next steps.
import { cp, rename, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, "template");

const targetArg = process.argv[2];
if (!targetArg || targetArg === "-h" || targetArg === "--help") {
  console.log("Usage: npm create lottie-experiments <project-directory>");
  process.exit(targetArg ? 0 : 1);
}

if (!existsSync(template)) {
  console.error(
    "Template not found. If running from source, generate it first:\n" +
      "  node create-lottie-experiments/sync.mjs"
  );
  process.exit(1);
}

const dest = path.resolve(process.cwd(), targetArg);
const name = path.basename(dest);

if (existsSync(dest)) {
  console.error(`Target directory already exists: ${dest}`);
  process.exit(1);
}

await cp(template, dest, { recursive: true });

// Restore the gitignore name (shipped as _gitignore so npm doesn't strip it).
const shippedGitignore = path.join(dest, "_gitignore");
if (existsSync(shippedGitignore)) {
  await rename(shippedGitignore, path.join(dest, ".gitignore"));
}

// Name the new project after its directory.
const pkgPath = path.join(dest, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
pkg.name = name;
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log(`\n✓ Created ${name} at ${dest}\n`);
console.log("Next steps:");
console.log(`  cd ${targetArg}`);
console.log("  npm install    # also copies the CanvasKit wasm into /public");
console.log("  npm run dev\n");
console.log("Then point your LLM at the repo (it reads CLAUDE.md) and ask for an");
console.log("animation — it writes public/lottie.json and the app hot-reloads it.");
console.log("Authoring guide: .claude/skills/write-lottie/SKILL.md\n");
