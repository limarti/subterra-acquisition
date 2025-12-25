import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,jsx,ts,mts,tsx}'],
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      '@stylistic': stylistic,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      "semi": [2, "always"],
      "no-multiple-empty-lines": ["warn", { "max": 1 }],
      "brace-style": ["error", "allman", { "allowSingleLine": true }],
      "arrow-spacing": ["error"],
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "object-curly-spacing": ["error", "always"],
      "@/no-multi-spaces": ["error", { ignoreEOLComments: true }],
      "@stylistic/indent": ["error", 2], // Changed from "tab" to 2 spaces and "warn" to "error"
      "@typescript-eslint/consistent-type-imports": "off"
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".vue"],
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    rules: {
      "semi": [2, "always"],
      "no-multiple-empty-lines": ["warn", { "max": 1 }],
      "brace-style": ["error", "allman", { "allowSingleLine": true }],
      "arrow-spacing": ["error"],
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "object-curly-spacing": ["error", "always"],
      "vue/html-closing-bracket-newline": ["error", {
        "singleline": "never",
        "multiline": "never"
      }],
      "vue/first-attribute-linebreak": ["error", {
        "singleline": "beside",
        "multiline": "beside"
      }],
      "vue/max-attributes-per-line": ["error", {
        "singleline": 1000,
        "multiline": 1
      }],
      "vue/attribute-hyphenation": ["error", "never", {
        "ignore": []
      }],
      "vue/v-on-event-hyphenation": ["error", "never", {
        "ignore": []
      }],
      "vue/script-indent": ["error", 2, {
        "baseIndent": 1,
      }],
      "vue/html-indent": ["error", 2, {
        "baseIndent": 1,
      }],
      "vue/multiline-html-element-content-newline": ["error", {
        "ignoreWhenEmpty": true,
        "ignores": ["VueComponent", "pre"],
        "allowEmptyLines": true
      }],
      'vue/multi-word-component-names': 'off',
      'vue/block-order': ['error', {
        'order': ['template', 'script', 'style']
      }]
    },
  }
);
