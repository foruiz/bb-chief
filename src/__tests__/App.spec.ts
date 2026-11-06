import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from '../App.vue'
import { i18n } from '../i18n'

describe('App', () => {
  it('mounts renders properly', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: '/setup' },
        { path: '/setup', component: { template: '<div>Configuración</div>' } },
        { path: '/match', component: { template: '<div>Marcador</div>' } },
      ],
    })

    await router.push('/setup')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('BB')
    expect(wrapper.text()).toContain('Chief')

    wrapper.unmount()
  })
})
