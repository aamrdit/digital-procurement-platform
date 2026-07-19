// Step 6 scratch helper (Phase 1 "walking skeleton"). Deleted alongside the
// `health` table and its API route in Step 8. Kept as a small pure function
// so it's unit-testable without spinning up a Nitro/H3 event or a real
// Supabase client.

export interface HealthResponse {
  count: number
}

/**
 * Normalises the count returned by a Supabase `select(..., { count: 'exact' })`
 * query (which is typed `number | null`) into the route's response shape.
 */
export function toHealthResponse(count: number | null): HealthResponse {
  return { count: count ?? 0 }
}
