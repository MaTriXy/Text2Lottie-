import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { Scene, Project, ScenesTree } from "../src/types/common";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

/** "main-project" -> "Main Project", "scene-1" -> "Scene 1" */
function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Order is the trailing "-NN" suffix of a scene slug; absent -> Infinity (sorts last). */
function sceneOrder(slug: string): number {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function scanScene(projectSlug: string, sceneSlug: string, sceneDir: string): Scene | null {
  const files = fs
    .readdirSync(sceneDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  if (!files.includes("lottie.json")) return null;

  const base = `/projects/${projectSlug}/${sceneSlug}`;
  const images = files
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => `${base}/${name}`);

  return {
    slug: sceneSlug,
    label: titleCase(sceneSlug),
    order: sceneOrder(sceneSlug),
    lottie: `${base}/lottie.json`,
    controls: files.includes("controls.json") ? `${base}/controls.json` : undefined,
    images,
  };
}

/** Discover all projects/scenes under `projectsDir` into an ordered tree. */
export function scanProjects(projectsDir: string): ScenesTree {
  const projects: Project[] = [];

  for (const projectSlug of listDirs(projectsDir).sort()) {
    const projectDir = path.join(projectsDir, projectSlug);
    const scenes: Scene[] = [];

    for (const sceneSlug of listDirs(projectDir)) {
      const scene = scanScene(projectSlug, sceneSlug, path.join(projectDir, sceneSlug));
      if (scene) scenes.push(scene);
    }

    scenes.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
    if (scenes.length > 0) {
      projects.push({ slug: projectSlug, label: titleCase(projectSlug), scenes });
    }
  }

  return { projects };
}

/**
 * Auto-discovers `public/projects/<project>/<scene-NN>/` folders.
 * - Dev: serves the tree at `GET /__scenes` and live-pushes `scenes:update` over
 *   Vite's HMR socket whenever a project/scene file is added, removed, or renamed.
 * - Build: emits a static `scenes.json` for production.
 */
export function scenesPlugin(): Plugin {
  let projectsDir = "";

  return {
    name: "scenes-discovery",

    configResolved(config) {
      projectsDir = path.resolve(config.root, "public/projects");
    },

    configureServer(server) {
      server.middlewares.use("/__scenes", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(scanProjects(projectsDir)));
      });

      const notify = (file: string) => {
        if (!file.startsWith(projectsDir)) return;
        server.ws.send({ type: "custom", event: "scenes:update", data: scanProjects(projectsDir) });
      };

      server.watcher.add(projectsDir);
      for (const event of ["add", "unlink", "addDir", "unlinkDir", "change"] as const) {
        server.watcher.on(event, notify);
      }
    },

    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "scenes.json",
        source: JSON.stringify(scanProjects(projectsDir)),
      });
    },
  };
}
