/**
 * Logo de fondo del menú principal.
 *
 * Ubicación en el repositorio: src/__tests__/menu/menu-background-logo.spec.ts
 * Vista: src/views/MenuView.vue
 *
 * El logo es decorativo: se oculta a los lectores de pantalla y no captura clics.
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import MenuView from '../../views/MenuView.vue'
import { i18n } from '../../i18n'

const BACKGROUND_LOGO = '[data-testid="menu-background-logo"]'

async function mountMenu() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/menu' },
      { path: '/menu', component: MenuView },
      { path: '/setup', component: { template: '<div>Configuración</div>' } },
      { path: '/match', component: { template: '<div>Marcador</div>' } },
      { path: '/help', component: { template: '<div>Ayuda</div>' } },
    ],
  })

  await router.push('/menu')
  await router.isReady()

  return mount(MenuView, { global: { plugins: [router, i18n] } })
}

describe('logo de fondo del menú', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('muestra el logo de la aplicación como fondo', async () => {
    const wrapper = await mountMenu()

    expect(wrapper.find(BACKGROUND_LOGO).exists()).toBe(true)
  })

  it('el logo tiene una opacidad del 50 %', async () => {
    const wrapper = await mountMenu()

    expect(wrapper.find(BACKGROUND_LOGO).classes()).toContain('opacity-50')
  })

  it('el logo es decorativo: oculto a lectores de pantalla y sin captar clics', async () => {
    const wrapper = await mountMenu()

    const logo = wrapper.find(BACKGROUND_LOGO)

    expect(logo.attributes('aria-hidden')).toBe('true')
    expect(logo.classes()).toContain('pointer-events-none')
  })
})
