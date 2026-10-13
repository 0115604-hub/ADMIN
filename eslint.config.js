import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "public/**",
      "**/*.json",
      "**/*.min.js",
      "src/assets/kwonSignature.js"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
        __APP_VERSION__: "readonly",
        __BUILD_TIMESTAMP__: "readonly"
      }
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin
    },
    settings: {
      react: {
        version: "18.3"
      }
    },
    rules: {
      // 🚨 CRITICAL: Prevents undefined variables and missing imports (like the isMeetingExpired incident)
      "no-undef": "error",
      "no-unreachable": "error",
      "no-dupe-keys": "error",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-useless-escape": "warn",
      "no-extra-boolean-cast": "warn",
      
      // ⚠️ React Hooks rules to prevent infinite render loops and hook order crashes
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // 🧹 Code hygiene
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ]
    }
  }
];
