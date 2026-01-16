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
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
