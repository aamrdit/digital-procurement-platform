import tailwindcss from '@tailwindcss/vite'

import { AppPreset } from './app/theme/preset'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-19',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@primevue/nuxt-module', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  primevue: {
    options: {
      theme: {
        preset: AppPreset,
        options: {
          // Scope decision (19/07/2026): dark mode is out of scope for this
          // task. Disabling the dark-mode selector entirely (rather than
          // leaving Aura's default "system" media-query behaviour) guarantees
          // components never switch to Aura's default dark palette based on
          // OS preference, regardless of the CSS this task ships.
          darkModeSelector: false,
        },
      },
    },
  },
  supabase: {
    // Reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` from
    // `.env.local` (loaded via `--dotenv .env.local` on the `dev` script) — these are
    // supported as the module's legacy-fallback env var names (verified against
    // node_modules/@nuxtjs/supabase@2.0.9's module.mjs defaults; no config keys needed
    // here to read them).
    types: '~~/shared/types/database.ts',
    // The module's default `redirect: true` sends every route to `/login` for
    // unauthenticated visitors. Neither `/login` nor `/confirm` exists yet (Phase 2 /
    // App Flow §2.1 owns building the auth pages), so left on this 404s the app's own
    // homepage. Disabled here; re-enable once those pages land.
    redirect: false,
  },
})
