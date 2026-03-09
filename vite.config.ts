import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import solidPlugin from "vite-plugin-solid";
import manifest from "./src/manifest.json" with { type: "json" };
import { resolve } from "path";

export default defineConfig({
  plugins: [
    solidPlugin(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        tab: resolve(__dirname, "src/tab.html")
      }
    }
  },
  server: {
    host: "::",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 5173,
    },
    cors: true,
  },
});
