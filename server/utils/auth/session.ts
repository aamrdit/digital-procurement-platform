// Step 8 auth smoke test (Phase 1 "walking skeleton"). Kept as a small pure
// function, in its own module with no Nitro/H3 or Supabase imports, so it's
// unit-testable without spinning up a real event or Supabase client —
// mirrors Step 6's server/utils/db/health.ts (toHealthResponse) pattern.
// Consumed by server/api/session.get.ts.

export interface SessionResponse {
  userId: string | null
}

/**
 * Normalises the claims object `serverSupabaseUser()` resolves to (or `null`,
 * when there's no session) into the session route's response shape.
 */
export function toSessionResponse(user: { sub: string } | null): SessionResponse {
  return { userId: user?.sub ?? null }
}
