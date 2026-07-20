// Step 8 auth smoke test (Phase 1 "walking skeleton"). Proves SSR session
// handling end-to-end: reads the authenticated user's id via the SAME
// user-scoped server client pattern Step 6's scratch health route used
// (serverSupabaseUser() -> serverSupabaseClient() under the hood, forwards
// the caller's JWT — Backend Schema §3), not serverSupabaseServiceRole.
//
// serverSupabaseUser() calls the underlying client's auth.getClaims(), which
// returns `{ data: null, error: null }` (no throw) when there's no session at
// all — confirmed against @supabase/auth-js@2.110.7's GoTrueClient.getClaims
// source. So "not signed in" surfaces here as `userId: null` with a normal
// 200, exactly like @nuxtjs/supabase's own plugin does internally
// (`serverSupabaseUser(event).catch(() => null)`), rather than a 500.
//
// toSessionResponse() lives in server/utils/auth/session.ts (Nitro
// auto-imports server/utils/**, same as Step 6's toHealthResponse) so it's
// unit-testable without a real Nitro/H3 event or Supabase client.
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const user = await serverSupabaseUser(event)
  return toSessionResponse(user)
})
