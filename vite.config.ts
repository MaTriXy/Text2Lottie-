import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Files in /public live outside Vite's module graph, so editing the Lottie file
// doesn't trigger HMR on its own. This plugin watches it explicitly and full-
// reloads the page on change — so an LLM (or you) can overwrite the Lottie file
// and immediately see the result in the running dev server.
function watchLottie(): Plugin {
  const file = path.resolve(__dirname, "public/lottie.json");
  return {
    name: "watch-lottie",
    configureServer(server) {
      server.watcher.add(file);
      server.watcher.on("change", (changed) => {
        if (path.resolve(changed) === file) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), watchLottie()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
