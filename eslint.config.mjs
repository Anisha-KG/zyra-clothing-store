import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],  // Node.js files
    plugins: { js },
    extends: ["js/recommended"],
    env: { node: true },            // <-- This tells ESLint it's Node.js
    rules: {
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { "max": 1 }],
      "indent": ["error", 2]
    }
  },
  {
    files: ["**/*.jsx"],            // React files
    plugins: { js },
    extends: ["js/recommended", "plugin:react/recommended"],
    env: { browser: true, es2021: true },
    rules: {
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { "max": 1 }],
      "indent": ["error", 2]
    }
  }
]);
