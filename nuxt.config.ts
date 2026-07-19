import tailwindcss from '@tailwindcss/vite'

import { AppPreset } from './app/theme/preset'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-19',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@primevue/nuxt-module'],
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
})
