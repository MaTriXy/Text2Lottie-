import tailwindcss from '@tailwindcss/vite';
import path from "node:path"
import { defineConfig } from 'vite';
import solidSvg from 'vite-plugin-solid-svg';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [
    devtools(), 
    solidPlugin(),
    tailwindcss(),
    solidSvg({ defaultAsComponent: true }),
  ],
  server: {
    port: 3030,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
