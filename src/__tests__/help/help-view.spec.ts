/**
 * Pantalla de ayuda: integración con router, i18n y los datos reales.
 *
 * Ubicación en el repositorio: src/__tests__/help/help-view.spec.ts
 * Vista: src/views/HelpView.vue
 *
 * Comportamiento:
 * - Al entrar muestra todo el catálogo agrupado por categoría.
 * - La búsqueda se dispara al escribir.
 * - La X vacía el campo y vuelve a mostrar todo el catálogo.
 * - Con 1 o 2 caracteres muestra el aviso de longitud mínima.
 */
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import HelpView from '../../views/HelpView.vue'
import { i18n } from '../../i18n'

const TOO_SHORT_MESSAGE = 'Por favor, indique al menos 3 caracteres.'
const NO_RESULTS_MESSAGE = 'No se ha encontrado ninguna entrada para el texto proporcionado.'
const CLEAR_LABEL = 'Borrar búsqueda'

async function mountHelp(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/menu' },
      { path: '/menu', component: { template: '<div>Menú</div>' } },
      { path: '/match', component: { template: '<div>Marcador</div>' } },
      { path: '/help', component: HelpView },
    ],
  })

  await router.push(url)
  await router.isReady()

  const wrapper = mount(HelpView, {
    global: { plugins: [router, i18n] },
  })

  return { wrapper, router }
}

type HelpWrapper = VueWrapper

async function typeText(wrapper: HelpWrapper, text: string) {
  await wrapper.find('input').setValue(text)
  await flushPromises()
}

function groupTitles(wrapper: HelpWrapper): string[] {
  return wrapper.findAll('[data-testid="help-group-title"]').map((title) => title.text())
}

function clickEntry(wrapper: HelpWrapper, text: string) {
  const card = wrapper.findAll('button').find((button) => button.text().includes(text))

  if (!card) throw new Error(`No se encuentra la entrada «${text}»`)

  return card.trigger('click')
}

describe('HelpView', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('al entrar muestra todo el catálogo agrupado por categoría', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    const titles = groupTitles(wrapper)

    expect(titles).toContain('Agilidad')
    expect(titles).toContain('General')
    expect(titles).toContain('Rasgos')
    expect(wrapper.text()).toContain('Manos Seguras')
    expect(wrapper.text()).toContain('Golpe Mortífero')
    expect(wrapper.text()).not.toContain(TOO_SHORT_MESSAGE)
    expect(wrapper.text()).not.toContain(NO_RESULTS_MESSAGE)
  })

  it('muestra los resultados al escribir, sin pulsar Enter', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'manos')

    expect(wrapper.text()).toContain('Manos Seguras')
    expect(wrapper.text()).not.toContain('Golpe Mortífero')
  })

  it('muestra el aviso de longitud mínima con 1 o 2 caracteres', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'ma')

    expect(wrapper.text()).toContain(TOO_SHORT_MESSAGE)
    expect(groupTitles(wrapper)).toEqual([])
  })

  it('muestra el aviso de ausencia de resultados cuando nada coincide', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'xyzqw')

    expect(wrapper.text()).toContain(NO_RESULTS_MESSAGE)
  })

  it('agrupa los resultados por categoría en el orden de las categorías', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'pata')

    const titles = groupTitles(wrapper)

    expect(titles.indexOf('Agilidad')).toBeGreaterThanOrEqual(0)
    expect(titles.indexOf('Agilidad')).toBeLessThan(titles.indexOf('General'))
    expect(titles.indexOf('General')).toBeLessThan(titles.indexOf('Pase'))
  })

  it('la X vacía el campo y vuelve a mostrar todo el catálogo', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'manos')
    expect(wrapper.text()).not.toContain('Golpe Mortífero')

    await wrapper.find(`[aria-label="${CLEAR_LABEL}"]`).trigger('click')
    await flushPromises()

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('Golpe Mortífero')
    expect(wrapper.text()).not.toContain(TOO_SHORT_MESSAGE)
  })

  it('borrar el texto a mano también vuelve a mostrar todo el catálogo', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'manos')
    await typeText(wrapper, '')

    expect(wrapper.text()).toContain('Golpe Mortífero')
  })

  it('despliega la ficha debajo de la entrada pulsada sin ocultar los resultados', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'pata')
    await clickEntry(wrapper, 'Patada')
    await flushPromises()

    expect(wrapper.find('[data-testid="help-detail"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="help-results"]').exists()).toBe(true)
  })

  it('pliega la ficha al volver a pulsar la misma entrada', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'pata')
    await clickEntry(wrapper, 'Patada')
    await flushPromises()
    await clickEntry(wrapper, 'Patada')
    await flushPromises()

    expect(wrapper.find('[data-testid="help-detail"]').exists()).toBe(false)
  })

  it('conserva la búsqueda al desplegar y plegar una ficha', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'pata')
    await clickEntry(wrapper, 'Patada')
    await flushPromises()

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('pata')
    expect(wrapper.text()).toContain('Patada')
  })

  it('no tiene un botón Volver propio en la ficha; solo el de la pantalla', async () => {
    const { wrapper } = await mountHelp('/help?from=menu')

    await typeText(wrapper, 'pata')
    await clickEntry(wrapper, 'Patada')
    await flushPromises()

    expect(wrapper.find('[data-testid="help-detail-back"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="help-back"]').exists()).toBe(true)
  })

  it('Volver regresa al menú cuando el origen es el menú', async () => {
    const { wrapper, router } = await mountHelp('/help?from=menu')

    await wrapper.find('[data-testid="help-back"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/menu')
  })

  it('Volver regresa al marcador cuando el origen es la partida', async () => {
    const { wrapper, router } = await mountHelp('/help?from=match')

    await wrapper.find('[data-testid="help-back"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/match')
  })

  it('sin origen válido, Volver regresa al menú', async () => {
    const { wrapper, router } = await mountHelp('/help')

    await wrapper.find('[data-testid="help-back"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/menu')
  })
})
