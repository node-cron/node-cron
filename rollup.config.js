import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { rmSync } from "fs";
import { builtinModules } from "module";
import dts from "rollup-plugin-dts";

// Wipes dist once before the first build so stale artifacts don't linger.
const cleanDist = () => ({
  name: "clean-dist",
  buildStart() {
    rmSync("dist", { recursive: true, force: true });
  },
});

// node-cron ships zero runtime dependencies; only Node built-ins are external.
const external = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

const basePlugins = () => [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: "./tsconfig.json",
    sourceMap: true,
    declaration: false,
    exclude: ["**/*.test.ts"],
    noEmitOnError: process.env.NODE_ENV !== "development",
  }),
];

// In the CJS build, ESM-only meta is rewritten to its CommonJS equivalent, and
// the forked daemon path is pointed at the .cjs artifact.
const cjsReplace = () =>
  replace({
    preventAssignment: true,
    delimiters: ["", ""],
    values: {
      "fileURLToPath(import.meta.url)": "__filename",
      "'daemon.js'": "'daemon.cjs'",
    },
  });

export default [
  // ESM build: single bundle per entry
  {
    input: {
      "node-cron": "src/node-cron.ts",
      daemon: "src/tasks/background-scheduled-task/daemon.ts",
    },
    output: {
      dir: "dist",
      format: "esm",
      entryFileNames: "[name].js",
      chunkFileNames: "_shared.js",
      sourcemap: true,
    },
    external,
    plugins: [cleanDist(), ...basePlugins()],
  },
  // CJS build: single bundle per entry
  {
    input: {
      "node-cron": "src/node-cron.ts",
      daemon: "src/tasks/background-scheduled-task/daemon.ts",
    },
    output: {
      dir: "dist",
      format: "cjs",
      entryFileNames: "[name].cjs",
      chunkFileNames: "_shared.cjs",
      sourcemap: true,
      exports: "named",
    },
    external,
    plugins: [cjsReplace(), ...basePlugins()],
  },
  // Type declarations: one bundled .d.ts for the public entry.
  {
    input: "src/node-cron.ts",
    output: {
      file: "dist/node-cron.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
