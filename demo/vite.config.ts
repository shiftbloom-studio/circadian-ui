import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The demo always runs the library from ../src, so it shows the code in this repository, not a published version.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shiftbloom-studio/circadian-ui": fileURLToPath(new URL("../src/index.ts", import.meta.url))
    },
    dedupe: ["react", "react-dom"]
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022"
  }
});
