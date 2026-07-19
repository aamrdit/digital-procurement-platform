// Step 6 scratch test (Phase 1 "walking skeleton"). Proves the `test` script
// runs and passes; deleted alongside the rest of the scratch slice in Step 8.
import { describe, expect, it } from 'vitest'

import { toHealthResponse } from '../../server/utils/db/health'

describe('toHealthResponse', () => {
  it('returns the count wrapped in the expected shape', () => {
    expect(toHealthResponse(3)).toEqual({ count: 3 })
  })

  it('normalises a null count (e.g. from a failed head-count query) to 0', () => {
    expect(toHealthResponse(null)).toEqual({ count: 0 })
  })
})
