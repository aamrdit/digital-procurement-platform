<script setup lang="ts">
// Step 8 auth smoke test (Phase 1 "walking skeleton"). Minimal email+password
// sign-in against the local Supabase Auth service, proving the round trip
// works end-to-end (see app/pages/index.vue + server/api/session.get.ts for
// the SSR-session half of the proof). This is NOT the real AUTH-01 screen
// (Phase 2, Guidelines §4.2) — no SSO, no MFA, no design-token styling;
// function over form, matching Step 6's scratch health page.
const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function signIn() {
  errorMessage.value = ''

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = error.message
    return
  }

  await navigateTo('/')
}
</script>

<template>
  <div>
    <h1>Sign in</h1>
    <form @submit.prevent="signIn">
      <div>
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required />
      </div>
      <div>
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <button type="submit">Sign in</button>
    </form>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>
