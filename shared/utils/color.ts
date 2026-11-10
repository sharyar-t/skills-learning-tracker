function channel(value: number): number {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(hexA: string, hexB: string): number {
  const [light, dark] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a)
  return (light! + 0.05) / (dark! + 0.05)
}

const LIGHT_TEXT = '#FFFFFF'
const DARK_TEXT = '#1A1D1A'
const BLACK = '#000000'

/** WCAG AA for normal-size text */
const AA = 4.5

/**
 * Text colour for a user-chosen background (the skill colour): white if it reads, else the brand
 * near-black, else pure black. If none reaches AA, whichever is closest.
 */
export function readableTextColor(background: string): string {
  const candidates = [LIGHT_TEXT, DARK_TEXT, BLACK]
  const passing = candidates.find(color => contrastRatio(background, color) >= AA)
  if (passing) return passing
  return candidates.reduce((best, color) => (contrastRatio(background, color) > contrastRatio(background, best) ? color : best))
}
