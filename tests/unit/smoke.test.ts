import { describe, expect, it } from 'vitest'
import sample from '../../data/sample-skills.json'

describe('sample data', () => {
  it('contains 6 skills and 47 sessions for guest mode', () => {
    expect(sample.skills).toHaveLength(6)
    expect(sample.sessions).toHaveLength(47)
  })
})
