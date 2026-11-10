// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { TrendChart } from '#components'
import type { DailyTotal } from '#shared/types/domain'

const today = '2026-03-19'
const totals: DailyTotal[] = [
  { skillId: 's', date: '2026-03-17', minutes: 90, sessions: 2 },
  { skillId: 's', date: '2026-02-10', minutes: 60, sessions: 1 },
]
const props = { totals, color: '#059669', today, skillName: 'Spanish' }

describe('TrendChart', () => {
  it('shows weekly values as text, one per week', async () => {
    const wrapper = await mountSuspended(TrendChart, { props })
    expect(wrapper.findAll('li')).toHaveLength(12)
    expect(wrapper.text()).toContain('Week of Mar 16: 1h 30m, 2 sessions')
    expect(wrapper.text()).toContain('2h 30m in the last 12 weeks')
  })

  it('switches to months and says which period is selected', async () => {
    const wrapper = await mountSuspended(TrendChart, { props })
    const [weekly, monthly] = wrapper.findAll('button')
    expect(weekly!.attributes('aria-pressed')).toBe('true')

    await monthly!.trigger('click')
    expect(monthly!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('li')).toHaveLength(6)
    expect(wrapper.text()).toContain('Mar: 1h 30m, 2 sessions')
    expect(wrapper.text()).toContain('Feb: 1h, 1 session')
  })

  it('says so when there is no practice in the window', async () => {
    const wrapper = await mountSuspended(TrendChart, { props: { ...props, totals: [] } })
    expect(wrapper.text()).toContain('No practice in the last 12 weeks')
  })
})
