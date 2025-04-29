import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

import mochaPlugin from 'eslint-plugin-mocha';


export default defineConfig([
  mochaPlugin.configs.flat.recommended,
  { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.node } },

]);