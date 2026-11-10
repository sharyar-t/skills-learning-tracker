/** `45` → "45m", `90` → "1h 30m", `120` → "2h", `0` → "0m". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Hours without trailing zeros: `5` → "5", `2.5` → "2.5", `1.25` → "1.25". */
export function formatHours(hours: number): string {
  return String(Number(hours.toFixed(2)))
}

/** Hours from minutes with one decimal and no trailing zero: 195 → "3.3", 300 → "5". */
export function formatHoursFromMinutes(minutes: number): string {
  return String(Math.round(minutes / 6) / 10)
}
