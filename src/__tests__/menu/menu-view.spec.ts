/**
 * Menú principal de la aplicación.
 *
 * Ubicación en el repositorio: src/__tests__/menu/menu-view.spec.ts
 * Vista: src/views/MenuView.vue
 */
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import MenuView from '../../views/MenuView.vue'
import { i18n } from '../../i18n'

async function mountMenu() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/menu' },
      { path: '/menu', component: MenuView },
      { path: '/setup', component: { template: '<div>Configuración</div>' } },
      { path: '/help', component: { template: '<div>Ayuda</div>' } },
    ],
  })

  await router.push('/menu')
  await router.isReady()

  const wrapper = mount(MenuView, {
    global: { plugins: [router, i18n] },
  })

  return { wrapper, router }
}

describe('MenuView', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('muestra las opciones Comenzar partido y Ayuda', () => {
    return mountMenu().then(({ wrapper }) => {
      expect(wrapper.find('[data-testid="menu-start"]').text()).toContain('Comenzar partido')
      expect(wrapper.find('[data-testid="menu-help"]').text()).toContain('Ayuda')
    })
  })

  it('Comenzar partido abre la configuración cuando no hay partida en curso', async () => {
    const { wrapper, router } = await mountMenu()

    await wrapper.find('[data-testid="menu-start"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/setup')
  })

  it('Ayuda abre la pantalla de ayuda indicando que el origen es el menú', async () => {
    const { wrapper, router } = await mountMenu()

    await wrapper.find('[data-testid="menu-help"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/help?from=menu')
  })

  it('la opción Ayuda está habilitada', async () => {
    const { wrapper } = await mountMenu()

    expect(wrapper.find('[data-testid="menu-help"]').attributes('disabled')).toBeUndefined()
  })
})
