import { describe, expect, it } from 'vitest'
import {
  describeAuthError,
  sanitizeRedirect,
  validateCurrentPassword,
  validateEmail,
  validateNewPassword,
} from '../../shared/utils/auth'

describe('validateEmail', () => {
  it('accepts normal addresses, ignoring surrounding whitespace', () => {
    expect(validateEmail('name@example.com')).toBeNull()
    expect(validateEmail('  first.last+tag@sub.example.io ')).toBeNull()
  })

  it.each(['', '   ', 'plain', 'a@b', '@example.com', 'a b@example.com'])('rejects %j', (value) => {
    expect(validateEmail(value)).toEqual(expect.any(String))
  })
})

describe('password validation', () => {
  it('requires 8+ characters for a new password', () => {
    expect(validateNewPassword('')).toEqual(expect.any(String))
    expect(validateNewPassword('1234567')).toMatch(/at least 8/)
    expect(validateNewPassword('12345678')).toBeNull()
  })

  it('only requires presence when signing in', () => {
    expect(validateCurrentPassword('')).toEqual(expect.any(String))
    expect(validateCurrentPassword('short')).toBeNull()
  })
})

describe('sanitizeRedirect', () => {
  it('keeps safe in-app paths, including query strings', () => {
    expect(sanitizeRedirect('/skills/guitar?tab=history')).toBe('/skills/guitar?tab=history')
  })

  it.each([
    ['https://evil.com'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['javascript:alert(1)'],
    [''],
    [null],
    [undefined],
  ])('falls back for %j', (value) => {
    expect(sanitizeRedirect(value as string | null | undefined)).toBe('/dashboard')
  })

  it('supports a custom fallback', () => {
    expect(sanitizeRedirect('//x', '/')).toBe('/')
  })
})

describe('describeAuthError', () => {
  it('explains wrong credentials without revealing which field is wrong', () => {
    expect(describeAuthError({ code: 'invalid_credentials', status: 400 })).toMatch(/email or password/)
  })

  it('prompts to confirm email', () => {
    expect(describeAuthError({ code: 'email_not_confirmed', status: 400 })).toMatch(/confirm/)
  })

  it('reports rate limits and expired links specifically', () => {
    expect(describeAuthError({ code: 'over_email_send_rate_limit', status: 429 })).toMatch(/Too many/)
    expect(describeAuthError({ code: 'otp_expired', status: 403 })).toMatch(/expired/)
  })

  it('reports network failures as a connection problem', () => {
    expect(describeAuthError({ name: 'AuthRetryableFetchError', status: 0 })).toMatch(/connection/)
    expect(describeAuthError({ message: 'Failed to fetch' })).toMatch(/connection/)
  })

  it('never leaks raw error messages', () => {
    const message = describeAuthError({ code: 'unexpected_failure', status: 400, message: 'pg: relation "x" does not exist' })
    expect(message).not.toMatch(/pg:|relation/)
  })
})
