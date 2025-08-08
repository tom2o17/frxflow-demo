import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Disable unused vars rule
      "@typescript-eslint/no-explicit-any": "warn", // Change 'any' errors to warnings
      "react-hooks/rules-of-hooks": "error", // Ensure hooks are used correctly
      "@next/next/no-img-element": "off", // Allow using `<img>` instead of `next/image`
    },
  },
];


export default eslintConfig;
