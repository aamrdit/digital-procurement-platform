// Step 6 scratch route (Phase 1 "walking skeleton"). Proves browser -> Nitro
// -> Postgres -> browser works end-to-end. Deleted in Step 8.
//
// Uses the user-scoped Supabase client (Backend Schema §3: "forwards the
// caller's JWT; RLS applies. Used for every internal-user action.") — NOT
// serverSupabaseServiceRole. This route only works because the scratch
// `health` table's RLS policy permissively allows anon/authenticated SELECT,
// not because RLS is bypassed.

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<HealthResponse> => {
  const client = await serverSupabaseClient(event)

  const { count, error } = await client
    .from('health')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read health table: ${error.message}`,
    })
  }

  return toHealthResponse(count)
})
