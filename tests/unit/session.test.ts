// Step 8 auth smoke test (Phase 1 "walking skeleton"). Mirrors Step 6's
// toHealthResponse test: a small pure-function test for the one bit of
// server/api/session.get.ts logic that's testable without a real Nitro/H3
// event or Supabase client.
import { describe, expect, it } from 'vitest'

import { toSessionResponse } from '../../server/utils/auth/session'

describe('toSessionResponse', () => {
  it('returns the user id when signed in', () => {
    expect(toSessionResponse({ sub: '11111111-1111-1111-1111-111111111111' })).toEqual({
      userId: '11111111-1111-1111-1111-111111111111',
    })
  })

  it('returns a null userId when there is no session', () => {
    expect(toSessionResponse(null)).toEqual({ userId: null })
  })
})
