/** After a failed submit, move keyboard/screen-reader focus to the first invalid field. */
export async function focusFirstInvalid(form: HTMLFormElement | null | undefined) {
  await nextTick()
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
