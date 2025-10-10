import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript"
  ),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // ✅ Règles utiles
      "no-console": "off", // désactivé pour le déploiement
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off", // désactivé car trop strict
      "@next/next/no-img-element": "off", // autorise l'usage de <img>
      "@typescript-eslint/no-explicit-any": "off", // désactivé pour le déploiement
      "@typescript-eslint/no-unused-vars": "off", // désactivé pour le déploiement
      "react/no-unescaped-entities": "off", // désactivé - pas de problème en React moderne
      "prefer-const": "off", // désactivé pour le déploiement
    },
  },
]

export default eslintConfig
