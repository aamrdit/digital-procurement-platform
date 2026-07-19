<script setup lang="ts">
// Step 6 scratch smoke test (Phase 1 "walking skeleton"): proves
// browser -> Nitro route -> Postgres -> browser works end-to-end.
// Deleted in Step 8 along with /api/health and the `health` table.
const { data } = await useFetch('/api/health')
</script>

<template>
  <div>
    <h1>AI Procurement Intelligence Platform</h1>
    <p v-if="data">{{ data.count }} health rows in the database</p>
  </div>
</template>
