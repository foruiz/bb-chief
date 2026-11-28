/**
 * Campo de búsqueda de la ayuda (búsqueda en vivo).
 *
 * Ubicación en el repositorio: src/__tests__/help/help-search-field.spec.ts
 * Componente: src/components/help/HelpSearchField.vue
 *
 * La búsqueda se dispara al escribir. El campo no emite ningún evento de envío.
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import HelpSearchField from '../../components/help/HelpSearchField.vue'
import { i18n } from '../../i18n'

const PLACEHOLDER_TEXT = 'Escribe al menos 3 letras'
const CLEAR_LABEL = 'Borrar búsqueda'

function mountField(modelValue: string) {
  return mount(HelpSearchField, {
    props: { modelValue },
    global: { plugins: [i18n] },
  })
}

describe('HelpSearchField', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('tiene una etiqueta accesible para el campo', () => {
    const wrapper = mountField('')

    expect(wrapper.find('input').attributes('aria-label')).toBe('Buscar en la ayuda')
  })

  it('muestra un placeholder que indica el mínimo de 3 caracteres', () => {
    const wrapper = mountField('')

    expect(wrapper.find('input').attributes('placeholder')).toBe(PLACEHOLDER_TEXT)
  })

  it('emite el texto escrito en cada cambio, para buscar al escribir', async () => {
    const wrapper = mountField('')

    await wrapper.find('input').setValue('m')
    await wrapper.find('input').setValue('ma')

    expect(wrapper.emitted('update:modelValue')).toEqual([['m'], ['ma']])
  })

  it('no emite ningún evento de envío', async () => {
    const wrapper = mountField('manos')

    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('no muestra el botón para borrar cuando el campo está vacío', () => {
    const wrapper = mountField('')

    expect(wrapper.find(`[aria-label="${CLEAR_LABEL}"]`).exists()).toBe(false)
  })

  it('muestra el botón para borrar cuando hay texto', () => {
    const wrapper = mountField('manos')

    expect(wrapper.find(`[aria-label="${CLEAR_LABEL}"]`).exists()).toBe(true)
  })

  it('el botón para borrar emite un campo vacío', async () => {
    const wrapper = mountField('manos')

    await wrapper.find(`[aria-label="${CLEAR_LABEL}"]`).trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })
})
