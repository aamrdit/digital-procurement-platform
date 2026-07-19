<!--
  Scratch / dev-only verification page — Step 4 (Tailwind 4 + design tokens +
  PrimeVue preset). Not a product screen; safe to delete once the design
  system wiring has been reviewed.

  Styling rule for this file: Tailwind utility classes backed by the
  `@theme` tokens in app/assets/css/main.css only. No raw hex or px values,
  no inline styles, no per-instance PrimeVue prop/style overrides — the
  Button and Tag below are coloured entirely by app/theme/preset.ts.
-->
<template>
  <main class="min-h-screen bg-app-bg px-6 py-8 font-sans text-base text-text">
    <h1 class="mb-1 text-xl font-semibold">Dev components — Step 4 token check</h1>
    <p class="mb-8 max-w-lg text-sm text-text-secondary">
      Scratch page only. Compare structurally against
      <code class="rounded-sm bg-surface-subtle px-1 py-0.5 text-xs">docs/design-system-preview.html</code>
      — primary button and a success status chip, light mode only.
    </p>

    <section class="mb-8">
      <span class="mb-2 block text-xs font-medium text-text-secondary">Primary button</span>
      <Button label="Add supplier" />
    </section>

    <section>
      <span class="mb-2 block text-xs font-medium text-text-secondary">Status chip — compliance</span>
      <Tag severity="success" value="Compliant" />
    </section>
  </main>
</template>
