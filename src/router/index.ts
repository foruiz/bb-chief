import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/setup',
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('../views/MatchSetupView.vue'),
    },
    {
      path: '/match',
      name: 'match',
      component: () => import('../views/MatchView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
