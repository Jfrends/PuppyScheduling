import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import jestPlugin from "eslint-plugin-jest";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    ignores: ["**/dist/**", "**/node_modules/**"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
  },
  pluginReact.configs.flat.recommended,
  {
    files: ["packages/react-frontend/tests/**/*.{js,jsx}"],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest, // Use Jest globals
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },
]);
