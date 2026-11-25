/**
 * Opción Continuar partida del menú.
 *
 * Ubicación en el repositorio: src/__tests__/menu/menu-continue.spec.ts
 * Vista: src/views/MenuView.vue
 *
 * El orden de los tests importa: el primero comprueba el menú sin partida,
 * antes de que el segundo inicie una.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import MenuView from '../../views/MenuView.vue'
import { useMatchSession } from '../../composables/useMatchSession'
import type { CreateMatchInput } from '../../domain/models/match'
import { i18n } from '../../i18n'

const INPUT: CreateMatchInput = {
  matchType: 'exhibition',
  format: 'normal',
  advantageTeamId: null,
  kickingTeamId: 'home',
  home: { name: 'Orcos', race: 'Orcos', rerolls: 3 },
  away: { name: 'Humanos', race: 'Humanos', rerolls: 2 },
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/menu' },
      { path: '/menu', component: MenuView },
      { path: '/setup', component: { template: '<div>Configuración</div>' } },
      { path: '/match', component: { template: '<div>Marcador</div>' } },
      { path: '/help', component: { template: '<div>Ayuda</div>' } },
    ],
  })
}

async function startMatch(router: ReturnType<typeof createTestRouter>) {
  const Starter = defineComponent({
    setup() {
      const { createAndOpenMatch } = useMatchSession()
      void createAndOpenMatch(INPUT)
      return () => h('div')
    },
  })

  mount(Starter, { global: { plugins: [router, i18n] } })
  await flushPromises()
}

describe('opción Continuar partida', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('no aparece cuando no hay partida en curso', async () => {
    const router = createTestRouter()
    await router.push('/menu')
    await router.isReady()

    const wrapper = mount(MenuView, { global: { plugins: [router, i18n] } })

    expect(wrapper.find('[data-testid="menu-continue"]').exists()).toBe(false)
  })

  it('aparece con una partida en curso y lleva al marcador', async () => {
    const router = createTestRouter()
    await router.push('/setup')
    await router.isReady()

    await startMatch(router)
    await router.push('/menu')
    await flushPromises()

    const wrapper = mount(MenuView, { global: { plugins: [router, i18n] } })

    const continueButton = wrapper.find('[data-testid="menu-continue"]')
    expect(continueButton.exists()).toBe(true)

    await continueButton.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/match')
  })
})
