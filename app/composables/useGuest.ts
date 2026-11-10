const HINT = 'Demo mode: this won\'t be saved — sign up to keep your data.'

/**
 * Guest mode: browse and edit a pre-filled demo without an account.
 *
 * The mode is a shared flag (`useState`, so every component agrees and the server's value reaches the
 * browser) backed by a session cookie, so it survives a page refresh and is readable during SSR but
 * ends when the browser closes. The demo data itself is in memory and starts fresh on every load.
 * A real signed-in session always wins over the flag.
 */
export function useGuest() {
  const cookie = useCookie<string | null>('slt-guest', { sameSite: 'lax', path: '/', default: () => null })
  const active = useState('guest-active', () => cookie.value === '1')
  const session = useSupabaseSession()
  const hintShown = useState('guest-hint-shown', () => false)

  const isGuest = computed(() => active.value && !session.value)

  function enter() {
    active.value = true
    cookie.value = '1'
  }

  function leave() {
    active.value = false
    cookie.value = null
    hintShown.value = false
  }

  /** The "changes aren't saved" reminder — returned once per visit, then null, so it never nags. */
  function consumeHint(): string | null {
    if (!isGuest.value || hintShown.value) return null
    hintShown.value = true
    return HINT
  }

  return { isGuest, enter, leave, consumeHint }
}
