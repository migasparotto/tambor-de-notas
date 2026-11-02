import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

// Layer boundaries (see src/*/README.md): each layer lists the layers it must NOT import.
const layerRules = {
  ui: ["storage", "integrations"],
  domain: ["ui"],
  storage: ["ui", "domain", "integrations"],
  integrations: ["ui", "domain", "storage"],
};

const layerConfigs = Object.entries(layerRules).map(([layer, forbidden]) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: forbidden.map((other) => ({
          group: [`**/${other}`, `**/${other}/**`],
          message: `A camada "${layer}" não pode importar de "${other}". Veja src/${layer}/README.md.`,
        })),
      },
    ],
  },
}));

export default tseslint.config(
  { ignores: ["dist", "node_modules", "src-tauri"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
  ...layerConfigs,
  {
    files: ["e2e/**/*.mjs"],
    // `browser.execute` runs code in the page, so the browser globals are valid too.
    languageOptions: { globals: { ...globals.node, ...globals.mocha, ...globals.browser } },
  },
  prettier,
);
