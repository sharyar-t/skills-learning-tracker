// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { AppDialog, SkillCard, StreakBadge } from '#components'
import type { SkillWithStats } from '#shared/types/domain'

const skill: SkillWithStats = {
  id: 'skill-1',
  name: 'Spanish',
  color: '#059669',
  goal: { type: 'weekly', targetHours: 5 },
  createdAt: '2025-11-01T10:00:00Z',
  totalMinutes: 565,
  sessionCount: 14,
  lastPracticedOn: '2026-03-19',
  streak: { current: 8, longest: 8, status: 'active' },
}

describe('SkillCard', () => {
  it('shows name, time, sessions, goal and streak as text', async () => {
    const wrapper = await mountSuspended(SkillCard, { props: { skill } })
    const text = wrapper.text()
    expect(wrapper.find('h2').text()).toBe('Spanish')
    expect(text).toContain('9h 25m')
    expect(text).toContain('14')
    expect(text).toContain('5 h / week')
    expect(text).toContain('8-day streak')
  })

  it('gives icon-only buttons the skill name in their label', async () => {
    const wrapper = await mountSuspended(SkillCard, { props: { skill } })
    expect(wrapper.find('[aria-label="Edit Spanish"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Delete Spanish"]').exists()).toBe(true)
  })

  it('emits edit and delete', async () => {
    const wrapper = await mountSuspended(SkillCard, { props: { skill } })
    await wrapper.find('[aria-label="Edit Spanish"]').trigger('click')
    await wrapper.find('[aria-label="Delete Spanish"]').trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('omits the goal row when the skill has no goal', async () => {
    const wrapper = await mountSuspended(SkillCard, { props: { skill: { ...skill, goal: null } } })
    expect(wrapper.text()).not.toContain('Goal')
  })

  it('hides the decorative avatar from assistive tech', async () => {
    const wrapper = await mountSuspended(SkillCard, { props: { skill } })
    const avatar = wrapper.find('span[aria-hidden="true"]')
    expect(avatar.text()).toBe('S')
  })
})

describe('StreakBadge', () => {
  it('uses wording, not just colour, for each status', async () => {
    const active = await mountSuspended(StreakBadge, { props: { streak: { current: 8, longest: 8, status: 'active' } } })
    const atRisk = await mountSuspended(StreakBadge, { props: { streak: { current: 3, longest: 3, status: 'at-risk' } } })
    const none = await mountSuspended(StreakBadge, { props: { streak: { current: 0, longest: 2, status: 'none' } } })
    expect(active.text()).toBe('8-day streak')
    expect(atRisk.text()).toContain('3-day streak')
    expect(atRisk.text()).toContain('at risk')
    expect(none.text()).toBe('No active streak')
  })
})

describe('AppDialog', () => {
  it('opens as a modal, syncs v-model on close, and labels itself with its title', async () => {
    const wrapper = await mountSuspended(AppDialog, {
      props: { open: false, title: 'Add a skill', 'onUpdate:open': (value: boolean) => wrapper.setProps({ open: value }) },
      slots: { default: '<p>content</p>' },
      attachTo: document.body,
    })
    const dialog = wrapper.find('dialog').element as HTMLDialogElement
    expect(dialog.open).toBe(false)

    await wrapper.setProps({ open: true })
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-labelledby')).toBe(wrapper.find('h2').attributes('id'))

    await wrapper.find('[aria-label="Close dialog"]').trigger('click')
    expect(dialog.open).toBe(false)
    wrapper.unmount()
  })
})
