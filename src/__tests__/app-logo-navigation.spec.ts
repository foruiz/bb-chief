/**
 * Logotipo de la cabecera: lleva al menú sin descartar la partida en curso (decisión D3).
 *
 * Ubicación en el repositorio: src/__tests__/app-logo-navigation.spec.ts
 * Componente: src/App.vue
 */
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import { useMatchSession } from '../composables/useMatchSession'
import type { CreateMatchInput } from '../domain/models/match'
import { i18n } from '../i18n'

const LOGO_LABEL = 'BB Chief, ir al menú'
const STORAGE_KEY = 'bb-chief.match-session'
const CONFIRMATION_TITLE = '¿Empezar una nueva partida?'

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
      { path: '/menu', component: { template: '<div>Menú</div>' } },
      { path: '/setup', component: { template: '<div>Configuración</div>' } },
      { path: '/match', component: { template: '<div>Marcador</div>' } },
      { path: '/help', component: { template: '<div>Ayuda</div>' } },
    ],
  })
}

// Inicia una partida con el composable real, como lo hace la configuración.
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

describe('logotipo de la cabecera', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
    localStorage.clear()
  })

  it('lleva al menú', async () => {
    const router = createTestRouter()
    await router.push('/setup')
    await router.isReady()

    const app = mount(App, { global: { plugins: [router, i18n] } })
    await flushPromises()

    await startMatch(router)

    await app.find(`[aria-label="${LOGO_LABEL}"]`).trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/menu')
  })

  it('no descarta la partida en curso ni muestra la confirmación de descarte', async () => {
    const router = createTestRouter()
    await router.push('/setup')
    await router.isReady()

    const app = mount(App, { global: { plugins: [router, i18n] } })
    await flushPromises()

    await startMatch(router)

    await app.find(`[aria-label="${LOGO_LABEL}"]`).trigger('click')
    await flushPromises()

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(app.text()).not.toContain(CONFIRMATION_TITLE)
  })
})
