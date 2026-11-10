// Pure auth helpers: validation, safe redirects and friendly error messages.
// Kept free of Nuxt/Supabase imports so they are trivially unit-testable.

export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value: string): string | null {
  const email = value.trim()
  if (!email) return 'Enter your email address.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address, like name@example.com.'
  return null
}

/** Rules for choosing a NEW password (sign up, reset). */
export function validateNewPassword(value: string): string | null {
  if (!value) return 'Enter a password.'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

/** Sign-in only checks presence: never lock out accounts created under older rules. */
export function validateCurrentPassword(value: string): string | null {
  return value ? null : 'Enter your password.'
}

/**
 * Only allow in-app absolute paths as post-login destinations.
 * Rejects protocol-relative (`//evil.com`), backslash tricks and full URLs (open-redirect protection).
 */
export function sanitizeRedirect(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path || typeof path !== 'string') return fallback
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback
  return path
}

export interface AuthErrorLike {
  code?: string
  name?: string
  status?: number
  message?: string
}

/** Maps Supabase auth errors to specific, plain-language messages (no raw error text). */
export function describeAuthError(error: AuthErrorLike): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password. Check them and try again.'
    case 'email_not_confirmed':
      return 'Your email isn\'t confirmed yet. Open the confirmation link we sent you, then sign in.'
    case 'weak_password':
      return `That password is too easy to guess. Use at least ${MIN_PASSWORD_LENGTH} characters and mix letters with numbers.`
    case 'same_password':
      return 'Choose a password that\'s different from your current one.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try signing in instead.'
    case 'signup_disabled':
      return 'Sign ups are turned off right now. Please try again later.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a few minutes before trying again.'
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
    case 'session_expired':
    case 'session_not_found':
      return 'This link has expired or was already used. Request a new one and try again.'
    case 'validation_failed':
    case 'email_address_invalid':
      return 'That email address doesn\'t look right. Check it and try again.'
  }

  // Network failures surface without a code (fetch rejected / status 0)
  if (error.name === 'AuthRetryableFetchError' || error.status === 0 || error.status === undefined) {
    return 'Couldn\'t reach the server. Check your connection and try again.'
  }

  if (error.status && error.status >= 500) {
    return 'Our server had a problem. Please try again in a moment.'
  }

  return 'Something went wrong on our side. Please try again.'
}
