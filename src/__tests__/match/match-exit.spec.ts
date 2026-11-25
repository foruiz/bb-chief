/**
 * Botón Salir del marcador: vuelve al menú sin descartar la partida.
 *
 * Ubicación en el repositorio: src/__tests__/match/match-exit.spec.ts
 * Vista: src/views/MatchView.vue
 */
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import MatchView from '../../views/MatchView.vue'
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

const STORAGE_KEY = 'bb-chief.match-session'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/menu' },
      { path: '/menu', component: { template: '<div>Menú</div>' } },
      { path: '/setup', component: { template: '<div>Configuración</div>' } },
      { path: '/match', component: MatchView },
      { path: '/help', component: { template: '<div>Ayuda</div>' } },
    ],
  })
}

// Inicializa la sesión como lo hace App.vue, para que el guardado automático esté activo,
// y después inicia la partida.
async function startMatch(router: ReturnType<typeof createTestRouter>) {
  const Starter = defineComponent({
    setup() {
      const { initializeSession, createAndOpenMatch } = useMatchSession()
      initializeSession()
      void createAndOpenMatch(INPUT)
      return () => h('div')
    },
  })

  const starter = mount(Starter, { global: { plugins: [router, i18n] } })
  await flushPromises()
  starter.unmount()
}

describe('botón Salir del marcador', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
    localStorage.clear()
  })

  it('con la partida en curso, vuelve al menú sin descartar la partida', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    await startMatch(router)
    await router.push('/match')

    const wrapper = mount(MatchView, { global: { plugins: [router, i18n] } })

    const exit = wrapper.findAll('button').find((button) => button.text() === 'Salir')
    expect(exit).toBeDefined()

    await exit?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/menu')
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })
})
