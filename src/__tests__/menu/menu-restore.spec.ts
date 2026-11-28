/**
 * Recarga de la aplicación con una partida guardada.
 *
 * Ubicación en el repositorio: src/__tests__/menu/menu-restore.spec.ts
 *
 * Comportamiento acordado: al recargar, la aplicación va al menú y la partida
 * guardada queda disponible con Continuar partida. No aparece ningún diálogo
 * de recuperación.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../../App.vue'
import MenuView from '../../views/MenuView.vue'
import { createMatch } from '../../domain/services/create-match'
import { createSession } from '../../domain/services/match-actions'
import { saveSession } from '../../persistence/match-storage'
import { i18n } from '../../i18n'

const RECOVERY_TEXT = 'Se ha encontrado una partida anterior'

describe('recarga con partida guardada', () => {
  it('va al menú con Continuar partida y sin diálogo de recuperación', async () => {
    i18n.global.locale.value = 'es'
    localStorage.clear()

    saveSession(
      createSession(
        createMatch({
          matchType: 'exhibition',
          format: 'normal',
          advantageTeamId: null,
          kickingTeamId: 'home',
          home: { name: 'Orcos', race: 'Orcos', rerolls: 3 },
          away: { name: 'Humanos', race: 'Humanos', rerolls: 2 },
        }),
      ),
    )

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

    await router.push('/')
    await router.isReady()

    const app = mount(App, { global: { plugins: [router, i18n] } })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/menu')
    expect(app.find('[data-testid="menu-continue"]').exists()).toBe(true)
    expect(app.text()).not.toContain(RECOVERY_TEXT)
  })
})
