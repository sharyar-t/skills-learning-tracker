// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppButton } from '#components'
import IndexPage from '~/pages/index.vue'

// The landing page only needs to know whether someone is signed in
const { auth, vue } = await vi.hoisted(async () => ({ auth: { signedIn: false }, vue: await import('vue') }))
mockNuxtImport('useAuth', () => () => ({
  isAuthenticated: vue.ref(auth.signedIn),
  email: vue.ref(null),
  user: vue.ref(null),
}))

beforeEach(() => { auth.signedIn = false })

const mountPage = () => mountSuspended(IndexPage)
type W = Awaited<ReturnType<typeof mountPage>>

const links = (w: W) => w.findAll('a').map(a => ({ text: a.text().replace(/\s+/g, ' '), href: a.attributes('href') }))
const sectionOf = (w: W, id: string) => w.find(`section[aria-labelledby="${id}"]`)

describe('landing page — content', () => {
  it('leads with the value proposition as the only h1', async () => {
    const wrapper = await mountPage()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe('See every hour you\'ve invested in becoming better.')
  })

  it('highlights four features', async () => {
    const wrapper = await mountPage()
    const features = sectionOf(wrapper, 'features-title')
    expect(features.findAll('h3').map(h => h.text())).toEqual([
      'Streaks that keep you honest',
      'Progress you can see',
      'A heatmap of your consistency',
      'Log a session in seconds',
    ])
  })

  it('has a section for each part of the story, each named by its heading', async () => {
    const wrapper = await mountPage()
    for (const id of ['hero-title', 'demo-title', 'features-title', 'consistency-title', 'cta-title']) {
      const heading = wrapper.find(`#${id}`)
      expect(heading.exists(), id).toBe(true)
      expect(sectionOf(wrapper, id).exists(), id).toBe(true)
    }
  })

  it('never skips a heading level (h1 → h2 → h3 …)', async () => {
    const wrapper = await mountPage()
    const levels = wrapper.findAll('h1, h2, h3, h4').map(h => Number(h.element.tagName[1]))
    expect(levels[0]).toBe(1)
    levels.forEach((level, i) => { if (i > 0) expect(level, `heading #${i}`).toBeLessThanOrEqual(levels[i - 1]! + 1) })
  })
})

describe('landing page — headings nest under their section', () => {
  it('uses h2 for a section\'s own heading and h3 or deeper for everything inside it', async () => {
    const wrapper = await mountPage()
    for (const id of ['demo-title', 'features-title', 'consistency-title']) {
      const [own, ...inner] = sectionOf(wrapper, id).findAll('h1, h2, h3, h4').map(h => Number(h.element.tagName[1]))
      expect(own, `${id} heading`).toBe(2)
      expect(inner.length, `${id} has nested headings`).toBeGreaterThan(0)
      expect(inner.every(level => level >= 3), `${id}: nested headings ${inner}`).toBe(true)
    }
  })
})

describe('landing page — calls to action', () => {
  it('offers both Sign up and Try as guest in the hero and again at the end', async () => {
    const wrapper = await mountPage()
    for (const id of ['hero-title', 'cta-title']) {
      const section = sectionOf(wrapper, id)
      const found = section.findAll('a').map(a => `${a.text()} → ${a.attributes('href')}`)
      expect(found, id).toEqual(expect.arrayContaining(['Sign up → /signup', 'Try as guest → /guest']))
    }
  })

  it('explains what the guest demo contains', async () => {
    const wrapper = await mountPage()
    expect(sectionOf(wrapper, 'hero-title').text()).toContain('6 skills and 47 practice sessions')
  })

  it('points signed-in visitors to their dashboard instead', async () => {
    auth.signedIn = true
    const wrapper = await mountPage()
    const found = links(wrapper)
    expect(found).toContainEqual({ text: 'Open your dashboard', href: '/dashboard' })
    expect(found.some(l => l.href === '/signup')).toBe(false)
    expect(found.some(l => l.href === '/guest')).toBe(false)
  })
})

describe('landing page — product showcase (real components on sample data)', () => {
  it('shows Spanish as the featured skill, with an alive 8-day streak and its goal ring', async () => {
    const wrapper = await mountPage()
    const demo = sectionOf(wrapper, 'demo-title')
    const featured = demo.find('section[aria-labelledby]')
    expect(featured.find('h3').text()).toContain('Spanish')
    expect(featured.text()).toContain('8-day streak')
    expect(featured.find('[role="progressbar"]').attributes('aria-label')).toBe('Spanish weekly goal')
  })

  it('suggests what to practice next and shows three more skills', async () => {
    const wrapper = await mountPage()
    const demo = sectionOf(wrapper, 'demo-title')
    expect(demo.text()).toContain('TypeScript: your 3-day streak is at risk')
    expect(demo.findAll('article')).toHaveLength(3)
  })

  it('turns "Log" in a demo card into an invitation to try the guest demo', async () => {
    const wrapper = await mountPage()
    const router = useRouter()
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined)
    await sectionOf(wrapper, 'demo-title').find('article button').trigger('click')
    await vi.waitFor(() => expect(push).toHaveBeenCalled())
    expect(JSON.stringify(push.mock.calls[0])).toContain('/guest')
  })

  it('includes a working interactive heatmap covering about three months', async () => {
    const wrapper = await mountPage()
    const section = sectionOf(wrapper, 'consistency-title')
    expect(section.find('h3').text()).toBe('Activity')
    expect(section.text()).toContain('47 sessions')
    expect(section.text()).toContain('in the last 3 months')
    expect(section.findAll('button[aria-label]').length).toBeGreaterThan(14 * 7 - 7)
  })
})

describe('landing page — decorative preview', () => {
  it('is hidden from assistive tech and contains nothing focusable', async () => {
    const wrapper = await mountPage()
    const hidden = sectionOf(wrapper, 'hero-title').findAll('div[aria-hidden="true"]').find(d => d.text().includes('Last 14 weeks'))
    expect(hidden, 'the preview card should be aria-hidden').toBeDefined()
    expect(hidden!.text()).toContain('Spanish')
    expect(hidden!.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0)
  })
})

describe('AppButton sizing', () => {
  const classesOf = async (props: Record<string, unknown>) => (await mountSuspended(AppButton, { props, slots: { default: 'x' } })).classes()

  it('large buttons use only the large height and padding', async () => {
    const classes = await classesOf({ size: 'lg' })
    expect(classes).toEqual(expect.arrayContaining(['min-h-12', 'px-7']))
    expect(classes).not.toContain('min-h-11')
    expect(classes).not.toContain('px-5')
  })

  it('ghost buttons use only their compact padding, regular ones only px-5', async () => {
    const ghost = await classesOf({ variant: 'ghost' })
    expect(ghost).toContain('px-3')
    expect(ghost).not.toContain('px-5')
    const primary = await classesOf({})
    expect(primary).toContain('px-5')
    expect(primary).not.toContain('px-3')
  })
})
