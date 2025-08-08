import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import dts from "@rollup/plugin-typescript";

import pkg from "./package.json" with { type: "json" };

function createConfig(pkg, input = "src/index.ts", plugins = []) {
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ];

  // Shared base plugins (without replace)
  const basePlugins = () => [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: true,
      declaration: false,
      exclude: "**/*.test.ts",
      noEmitOnError: process.env.NODE_ENV !== "development",
    }),
  ];

  // Helper to conditionally add replace of import.meta.dirname and import.meta.url
  function withReplace(isCjs = false) {
    return [
      ...(isCjs
        ? [
            replace({
              preventAssignment: true,
              delimiters: ["", ""],
              values: {
                "import.meta.dirname": "__dirname",
                "import.meta.url": "__filename",
                "import.meta.filename": "__filename",
              },
            }),
          ]
        : []),
      ...basePlugins(),
    ];
  }

  return [
    // ESM build
    {
      input,
      output: {
        dir: "dist",
        format: "esm",
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        sourcemap: true,
      },
      external,
      plugins: [withReplace(false)],
    },
    // CJS build
    {
      input,
      output: {
        dir: "dist",
        format: "cjs",
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].cjs",
        sourcemap: true,
        exports: "named",
      },
      external,
      plugins: [withReplace(true), ...plugins],
    },
    // Typescript declaration files
    {
      input,
      output: {
        dir: "dist",
        format: "es",
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].d.ts",
      },
      plugins: [dts()],
    },
  ];
}

export default createConfig(pkg, ["src/node-cron.ts", "src/tasks/background-scheduled-task/daemon.ts"]);

