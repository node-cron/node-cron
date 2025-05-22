import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: ["dist/**", "node-cron.cjs", "node-cron.mjs"]
  },
  { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-async-promise-executor": "off",
      'no-restricted-imports': ['error', {
          patterns: [{
            group: ['src/*', '/src/*'],
            message: 'Using absolute imports from the src/ directory is not allowed. Use relative imports instead.'
          }
        ]
      }]
    }
  }
]);