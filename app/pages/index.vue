<script setup lang="ts">
// Step 8 auth smoke test (Phase 1 "walking skeleton"): proves Supabase Auth +
// SSR session handling end-to-end.
//
// `useFetch` with a relative URL auto-proxies the incoming request's cookies
// to the internal API route during SSR via `useRequestFetch()` (Nuxt docs,
// "Data Fetching > Pass Client Headers to the API") — so the sign-in status
// below is genuinely computed server-side from the request's own session
// cookie, not a client-only after-mount check. `/api/session` reads the user
// id via `serverSupabaseUser()` (server/api/session.get.ts).
const { data } = await useFetch('/api/session')
const supabase = useSupabaseClient()

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/auth/signin')
}
</script>

<template>
  <div>
    <h1>AI Procurement Intelligence Platform</h1>
    <p v-if="data?.userId">Signed in as: {{ data.userId }}</p>
    <p v-else>Not signed in</p>
    <button v-if="data?.userId" type="button" @click="signOut">Sign out</button>
  </div>
</template>
