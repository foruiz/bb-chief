/**
 * Tarjeta de resultado de la ayuda.
 *
 * Ubicación en el repositorio: src/__tests__/help/help-entry-card.spec.ts
 * Componente: src/components/help/HelpEntryCard.vue
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { HelpEntry } from '../../domain/help/help-models'
import HelpEntryCard from '../../components/help/HelpEntryCard.vue'
import { i18n } from '../../i18n'

const SURE_HANDS: HelpEntry = {
  id: 'sure_hands',
  category: 'general',
  name: { es: 'Manos Seguras (Recogida)', en: 'Sure Hands' },
  description: {
    es: 'Puede repetir tiradas de Agilidad fallidas al recoger el balón del suelo.',
    en: 'May re-roll any failed Agility Test when attempting to Pick up the ball.',
  },
}

const JUGGERNAUT: HelpEntry = {
  id: 'juggernaut',
  category: 'strength',
  name: { es: 'Juggernaut', en: 'Juggernaut' },
  description: { es: 'Trata Ambos Derribados como Empujón.', en: 'Treats Both Down as Push Back.' },
}

function mountCard(entry: HelpEntry, query = '') {
  return mount(HelpEntryCard, {
    props: { entry, query },
    global: { plugins: [i18n] },
  })
}

describe('HelpEntryCard', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('muestra el nombre en español y el término inglés entre corchetes en cursiva', () => {
    const wrapper = mountCard(SURE_HANDS)

    expect(wrapper.text()).toContain('Manos Seguras (Recogida)')
    expect(wrapper.find('em').text()).toBe('[Sure Hands]')
  })

  it('no muestra corchetes cuando el nombre en español y el inglés son iguales', () => {
    const wrapper = mountCard(JUGGERNAUT)

    expect(wrapper.find('em').exists()).toBe(false)
  })

  it('en inglés muestra solo el nombre en inglés', () => {
    i18n.global.locale.value = 'en'

    const wrapper = mountCard(SURE_HANDS)

    expect(wrapper.text()).toContain('Sure Hands')
    expect(wrapper.text()).not.toContain('Manos Seguras')
    expect(wrapper.find('em').exists()).toBe(false)
  })

  it('resalta las letras buscadas en el nombre', () => {
    const wrapper = mountCard(SURE_HANDS, 'manos')

    const marks = wrapper.findAll('mark').map((mark) => mark.text())

    expect(marks).toEqual(['Manos'])
  })

  it('resalta las letras buscadas en la descripción', () => {
    const wrapper = mountCard(SURE_HANDS, 'agilidad')

    const marks = wrapper.findAll('mark').map((mark) => mark.text())

    expect(marks).toContain('Agilidad')
  })

  it('muestra la letra de la categoría dentro de un círculo con su nombre accesible', () => {
    const wrapper = mountCard(SURE_HANDS)

    const badge = wrapper.find('[data-testid="help-category-badge"]')

    expect(badge.text()).toBe('G')
    expect(badge.attributes('aria-label')).toBe('General')
  })

  it('emite select con el id de la entrada al pulsarla', async () => {
    const wrapper = mountCard(SURE_HANDS)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['sure_hands']])
  })
})
