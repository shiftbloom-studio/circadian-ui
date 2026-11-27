import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createInlineScript } from "../src/core/script";
import { circadianTokens } from "./src/palette";

/**
 * The library's own no-flash script (what <CircadianScript /> renders), emitted as /boot.js because this
 * page's CSP doesn't allow inline scripts. index.html loads it in <head>, so the first paint already has
 * the right phase.
 */
const bootScript = (): Plugin => {
  const code = () => createInlineScript({ tokens: circadianTokens, persist: false });
  return {
    name: "circadian-boot-script",
    configureServer(server) {
      server.middlewares.use("/boot.js", (_req, res) => {
        res.setHeader("content-type", "text/javascript; charset=utf-8");
        res.end(code());
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "boot.js", source: code() });
    }
  };
};

// The demo always runs the library from ../src, so it shows the code in this repository, not a published version.
export default defineConfig({
  plugins: [react(), bootScript()],
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
