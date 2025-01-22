import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest"; // Import Jest plugin

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        process: "readonly",
      },
    },
    rules: {
      "func-names": ["error", "never"],
      "comma-dangle": ["error", "only-multiline"],
      quotes: ["warn", "double"],
      "max-len": [
        "warn",
        {
          ignoreComments: true,
          ignoreTrailingComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      "no-console": 1,
      "no-unused-vars": 1,
      "prefer-const": 1,
      "no-var": 1,
      "eol-last": 1,
      "no-underscore-dangle": 0,
    },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js", "**/__tests__/**/*.js"], // Match test files
    plugins: { jest: pluginJest }, // Enable Jest plugin
    languageOptions: {
      globals: {
        ...globals.jest, // Include Jest globals like `describe`, `test`, `expect`, etc.
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules, // Use recommended Jest rules
    },
  },
  pluginJs.configs.recommended,
];
