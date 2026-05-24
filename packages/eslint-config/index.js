import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const ignores = {
  ignores: [
    "node_modules/**",
    ".next/**",
    ".next-dev/**",
    ".open-next/**",
    ".cloudflare/**",
    ".wrangler/**",
    "dist/**",
    "coverage/**",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ],
};

const typedRules = {
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports" },
  ],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    { checksVoidReturn: { attributes: false } },
  ],
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
  "@typescript-eslint/require-await": "error",
  "no-console": ["error", { allow: ["info", "warn", "error"] }],
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "MemberExpression[object.object.name='process'][object.property.name='env']",
      message:
        "Use @repo/platform environment helpers outside config and platform files.",
    },
  ],
};

export const baseConfig = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [".storybook/*.ts", ".storybook/*.tsx"],
        },
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...typedRules,
      "react/jsx-key": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/no-duplicates": "error",
      "prefer-const": "error",
    },
  },
  {
    files: [
      "**/next.config.ts",
      "**/open-next.config.ts",
      "**/packages/platform/**",
      "**/tooling/**",
      "**/playwright.config.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: ["**/*.config.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.stories.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
);

const nextRecommended = nextPlugin.configs.recommended?.rules ?? {};
const nextVitals = nextPlugin.configs["core-web-vitals"]?.rules ?? {};

export const nextConfig = [
  ...baseConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...nextRecommended,
      ...nextVitals,
    },
  },
];

export default baseConfig;
