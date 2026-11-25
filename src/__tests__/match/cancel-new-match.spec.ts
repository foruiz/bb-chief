/**
 * Confirmación de nueva partida: «Seguir con la partida actual» lleva al marcador.
 *
 * Ubicación en el repositorio: src/__tests__/match/cancel-new-match.spec.ts
 * Componentes: src/App.vue (diálogo, con Teleport a body) y src/views/MenuView.vue
 *
 * El diálogo se renderiza fuera del componente montado, en document.body,
 * por eso los botones se buscan en document y no en el wrapper.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../../App.vue'
import MenuView from '../../views/MenuView.vue'
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

const CANCEL_TEXT = 'Seguir con la partida actual'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/menu' },
      { path: '/menu', component: MenuView },
      { path: '/setup', component: { template: '<div>Configuración</div>' } },
      { path: '/match', component: MatchView },
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

  const starter = mount(Starter, { global: { plugins: [router, i18n] } })
  await flushPromises()
  starter.unmount()
}

function findButtonByText(text: string): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === text,
  )
}

describe('confirmación de nueva partida', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'es'
    localStorage.clear()
  })

  afterEach(() => {
    // Limpia los diálogos enviados a body por Teleport.
    document.body.innerHTML = ''
  })

  it('Seguir con la partida actual cierra el diálogo y lleva al marcador', async () => {
    const router = createTestRouter()
    await router.push('/setup')
    await router.isReady()

    // La aplicación se monta primero para registrar la carga y el guardado de sesión.
    const app = mount(App, {
      attachTo: document.body,
      global: { plugins: [router, i18n] },
    })
    await flushPromises()

    await startMatch(router)
    await router.push('/menu')
    await flushPromises()

    // Comenzar partida con una partida en curso muestra la confirmación.
    const start = document.querySelector<HTMLButtonElement>('[data-testid="menu-start"]')
    start?.click()
    await flushPromises()

    const cancel = findButtonByText(CANCEL_TEXT)
    expect(cancel).toBeDefined()

    cancel?.click()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/match')
    expect(findButtonByText(CANCEL_TEXT)).toBeUndefined()

    app.unmount()
  })
})
