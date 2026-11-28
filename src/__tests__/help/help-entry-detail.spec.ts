/**
 * Ficha de detalle de la ayuda.
 *
 * Ubicación en el repositorio: src/__tests__/help/help-entry-detail.spec.ts
 * Componente: src/components/help/HelpEntryDetail.vue
 *
 * Decisión D9: nombre arriba a la izquierda, categoría a la derecha y descripción al final.
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { HelpEntry } from '../../domain/help/help-models'
import HelpEntryDetail from '../../components/help/HelpEntryDetail.vue'
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

function mountDetail(entry: HelpEntry) {
  return mount(HelpEntryDetail, {
    props: { entry },
    global: { plugins: [i18n] },
  })
}

describe('HelpEntryDetail', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('coloca el nombre, después la categoría y al final la descripción', () => {
    const wrapper = mountDetail(SURE_HANDS)

    const sections = wrapper
      .findAll('[data-section]')
      .map((section) => section.attributes('data-section'))

    expect(sections).toEqual(['name', 'category', 'description'])
  })

  it('muestra el nombre con el término inglés entre corchetes en cursiva', () => {
    const wrapper = mountDetail(SURE_HANDS)

    expect(wrapper.find('[data-section="name"]').text()).toContain('Manos Seguras (Recogida)')
    expect(wrapper.find('[data-section="name"] em').text()).toBe('[Sure Hands]')
  })

  it('muestra el nombre de la categoría con su letra en un círculo', () => {
    const wrapper = mountDetail(SURE_HANDS)

    const category = wrapper.find('[data-section="category"]')

    expect(category.text()).toContain('General')
    expect(category.find('[data-testid="help-category-badge"]').text()).toBe('G')
  })

  it('muestra la descripción en el idioma activo', () => {
    const wrapper = mountDetail(SURE_HANDS)

    expect(wrapper.find('[data-section="description"]').text()).toBe(SURE_HANDS.description.es)
  })
})
