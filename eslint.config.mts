import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: {...globals.browser, ...globals.node},
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "no-var": "off", // var en vez de let o const
      "no-empty-pattern": "off",  // opciones {}
      "no-unused-vars": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off", // this.algo?.otraCosa
      "@typescript-eslint/ban-ts-comment": "off", // uso de @ts-ignore
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "off", // PROVISORIA
      "@typescript-eslint/no-floating-promises": "error",
    }    
  },
  {
    files: ["**/client/**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        "confirmPromise": "readonly",
        "myOwn": "readonly",
        "my": "readonly",
        "TypeStore": "readonly",
      }
    },
    rules:{
      "@typescript-eslint/no-floating-promises": "error",
    }
  },
  {
    files: ["**/*.test.{js,ts,jsx,tsx}", "**/test/**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.mocha, // ← Esto incluye todas las globals de Mocha
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    }
  }
]);
