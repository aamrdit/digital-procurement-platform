// @ts-check
import eslintConfigPrettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

// eslint-config-prettier must be last so it can disable any stylistic
// rules that would conflict with Prettier. Prettier owns formatting;
// ESLint owns correctness (Tech Stack §4).
export default withNuxt(eslintConfigPrettier)
