// PrimeVue 4 preset — Content & Design Guidelines §6 "PrimeVue Preset (light-touch)".
//
// One preset file, `definePreset(Aura, …)`, mapping semantic tokens onto the
// evergreen/warm-stone palette from `app/assets/css/main.css` §3.1. This is the
// ONLY place PrimeVue component colours/radius/focus-ring are set — no
// per-instance style overrides anywhere else in the app.
//
// Values reference the same CSS custom properties Tailwind's `@theme` block
// emits on `:root` (e.g. `var(--color-primary)`), so the two token systems
// stay in lockstep with a single source of truth. A handful of intermediate
// colour-scale stops (marked below) have no named design token — PrimeVue's
// Aura preset expects a full 50–950 scale, but the design doc only specifies
// five evergreen stops and nine stone stops. Those specified stops are wired
// to the exact CSS variable; the remaining stops are interpolated to keep the
// ramp visually smooth and are commented as such.
//
// Scope decision (resolved 19/07/2026): dark mode is OUT OF SCOPE for this
// task — see nuxt.config.ts, which sets `darkModeSelector: false` so no
// `prefers-color-scheme` media query can pull in Aura's default dark colours.
// This preset therefore only defines `colorScheme.light`.
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

export const AppPreset = definePreset(Aura, {
  semantic: {
    // Border radius scale — brief calls for the `md` (6px) stop specifically;
    // this already equals Aura's default, restated here so the mapping is
    // explicit and auditable rather than an accidental default.
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
      shadow: 'none',
    },
    // Primary (evergreen) scale — 50/200/500/600/700 map to the named
    // --color-primary-* tokens exactly; 100/300/400/800/900/950 are
    // interpolated (not in the design doc) to complete the ramp Aura expects.
    primary: {
      50: 'var(--color-primary-subtle)', // #E8F2F0
      100: '#D3E7E3', // interpolated
      200: 'var(--color-primary-border)', // #B7D6D0
      300: '#96C2B8', // interpolated
      400: '#5FA396', // interpolated
      500: 'var(--color-primary)', // #0E6B5C
      600: 'var(--color-primary-hover)', // #0B5649
      700: 'var(--color-primary-active)', // #094439
      800: '#073830', // interpolated
      900: '#062B25', // interpolated
      950: '#041D19', // interpolated
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: 'var(--color-text-inverse)',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
        // Neutral (warm-stone) scale — the nine named stops map exactly to
        // --color-app-bg / surface / surface-subtle / surface-sunken /
        // border / text-disabled / border-strong / text-placeholder /
        // text-secondary / text, ordered light-to-dark by luminance.
        // 800 and 950 are interpolated (no named token at that depth).
        surface: {
          0: 'var(--color-surface)', // #FFFFFF
          50: 'var(--color-app-bg)', // #FBFAF7
          100: 'var(--color-surface-subtle)', // #F5F3EF
          200: 'var(--color-surface-sunken)', // #EFECE6
          300: 'var(--color-border)', // #E9E6DF
          400: 'var(--color-text-disabled)', // #A29D91
          500: 'var(--color-border-strong)', // #8F897C
          600: 'var(--color-text-placeholder)', // #716C61
          700: 'var(--color-text-secondary)', // #6B665D
          800: '#443F37', // interpolated
          900: 'var(--color-text)', // #26231E
          950: '#18160F', // interpolated
        },
      },
    },
  },
  components: {
    // Tag — status chips. Aura's default severities reference Tailwind-style
    // green/orange/red/sky primitives, which do not match this project's
    // status trios. Wired directly to the §3.1 status tokens.
    tag: {
      colorScheme: {
        light: {
          success: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
          warn: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
          danger: { background: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
          info: { background: 'var(--color-info-bg)', color: 'var(--color-info)' },
          secondary: { background: 'var(--color-neutral-chip-bg)', color: 'var(--color-neutral-chip)' },
        },
      },
    },
  },
})

export default AppPreset
