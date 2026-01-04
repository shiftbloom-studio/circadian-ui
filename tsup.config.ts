import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]
} as const;

export default defineConfig([
  {
    ...shared,
    entry: {
      index: "src/index.ts"
    },
    clean: true
  },
  {
    ...shared,
    entry: {
      server: "src/server.ts"
    },
    clean: false
  }
]);
