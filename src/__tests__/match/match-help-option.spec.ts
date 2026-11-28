/**
 * Ayuda desde la tarjeta de opciones del partido.
 *
 * Ubicación en el repositorio: src/__tests__/match/match-help-option.spec.ts
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

function scores(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.match-team-score').map((score) => score.text())
}

describe('ayuda desde la tarjeta de opciones del partido', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
  })

  it('la opción de ayuda está habilitada', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    await startMatch(router)
    await router.push('/match')

    const wrapper = mount(MatchView, { global: { plugins: [router, i18n] } })

    expect(wrapper.find('[data-testid="match-help"]').attributes('disabled')).toBeUndefined()
  })

  it('abre la ayuda indicando que el origen es la partida', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    await startMatch(router)
    await router.push('/match')

    const wrapper = mount(MatchView, { global: { plugins: [router, i18n] } })

    await wrapper.find('[data-testid="match-help"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/help?from=match')
  })

  it('al volver a la partida, el marcador y el historial siguen igual', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    await startMatch(router)
    await router.push('/match')

    const before = mount(MatchView, { global: { plugins: [router, i18n] } })

    // Anotar un touchdown del equipo activo (visitante, porque recibe el local).
    const scoreButton = before
      .findAll('button')
      .find((button) => button.text().includes('Anotar Touchdown'))
    await scoreButton?.trigger('click')
    await flushPromises()

    expect(scores(before)).toEqual(['0', '1'])

    await before.find('[data-testid="match-help"]').trigger('click')
    await flushPromises()
    await router.push('/match')
    await flushPromises()

    const after = mount(MatchView, { global: { plugins: [router, i18n] } })

    expect(scores(after)).toEqual(['0', '1'])

    const undo = after.findAll('button').find((button) => button.text().includes('Deshacer'))
    expect(undo?.attributes('disabled')).toBeUndefined()
  })
})
