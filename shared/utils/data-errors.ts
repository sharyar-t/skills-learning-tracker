/** An error whose message is already safe and helpful to show to the user. */
export class DataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataError'
  }
}

interface PostgrestErrorLike {
  code?: string
  message?: string
}

/**
 * Turns a database/network failure into a specific message.
 * @param what what we were trying to do, phrased to follow "Couldn't …" (e.g. "save your skill")
 */
export function describeDataError(error: PostgrestErrorLike, what: string): string {
  // supabase-js reports a failed fetch with an empty code and the browser's TypeError text
  if (!error.code || /fetch|network|timeout/i.test(error.message ?? '')) {
    return `Couldn't ${what}. Check your connection and try again.`
  }
  // Expired JWT / row-level-security rejection: the session is no longer valid
  if (error.code === 'PGRST301' || error.code === '42501' || error.code === 'PGRST303') {
    return 'Your session has expired. Sign in again, then retry.'
  }
  // Foreign-key violation: the skill was deleted (e.g. in another tab) while the form was open
  if (error.code === '23503') {
    return 'That skill no longer exists. Reload the page and try again.'
  }
  // .single() matched no row — deleted elsewhere (e.g. another tab)
  if (error.code === 'PGRST116') {
    return 'That item no longer exists. Reload the page and try again.'
  }
  return `Couldn't ${what}. Please try again.`
}

/** Message for any thrown value: ours pass through, anything unexpected is generalised. */
export function messageOf(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return error instanceof DataError ? error.message : fallback
}
