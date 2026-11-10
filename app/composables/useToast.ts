export interface Toast {
  id: number
  title: string
  detail?: string
  /** Icon shown next to the message; the wording always carries the meaning too. */
  icon?: 'check' | 'flame'
}

let nextId = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function show(toast: Omit<Toast, 'id'>) {
    const id = ++nextId
    // Keep the stack short: a burst of saves shouldn't bury the page
    toasts.value = [...toasts.value, { ...toast, id }].slice(-3)
    return id
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  return { toasts, show, dismiss }
}
