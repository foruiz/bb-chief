<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMatchSession } from '../composables/useMatchSession'

import Logo from '@/assets/images/bb-chief-v2.svg'
import BallIcon from '../components/icons/BallIcon.vue'
import ConfroIcon from '../components/icons/ConfroIcon.vue'
import HelpIcon from '../components/icons/HelpIcon.vue'

const { t } = useI18n()
const router = useRouter()

// Usa el mismo flujo que antes para comenzar una partida: si hay una partida
// en curso, muestra la confirmación; si no, navega a la configuración.
const { prepareNewMatch, currentMatch } = useMatchSession()

// Continuar partida solo aparece con una partida en curso (no terminada).
const hasActiveMatch = computed(
  () => currentMatch.value !== null && currentMatch.value.status !== 'finished',
)

async function continueMatch() {
  await router.push('/match')
}

async function openHelp() {
  await router.push({ path: '/help', query: { from: 'menu' } })
}
</script>

<template>
  <main
    class="relative mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-hidden px-4 py-6 sm:px-6"
  >
    <!-- Logo de fondo: decorativo, al 50 % de opacidad y detrás del contenido -->
    <img
      data-testid="menu-background-logo"
      :src="Logo"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-1/2 -z-0 w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2 opacity-50"
    />

    <div class="relative mx-auto mt-10 flex w-full max-w-sm flex-col gap-4">
      <button
        v-if="hasActiveMatch"
        data-testid="menu-continue"
        type="button"
        class="flex w-full items-center gap-4 rounded-2xl border border-amber-400 bg-amber-400 p-4 text-left text-amber-950 shadow-sm transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        @click="continueMatch"
      >
        <BallIcon class="size-14 shrink-0 text-bb-text" />

        <span class="min-w-0">
          <span class="block font-display text-2xl font-bold">{{ t('menu.continueMatch') }}</span>
          <span class="block text-sm text-amber-900">{{ t('menu.continueMatchHint') }}</span>
        </span>
      </button>

      <button
        data-testid="menu-start"
        type="button"
        class="flex items-center gap-4 rounded-2xl border border-bb-border bg-bb-surface p-4 text-left text-bb-text shadow-sm transition hover:border-bb-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
        @click="prepareNewMatch"
      >
        <ConfroIcon class="size-14 shrink-0 text-bb-text" />

        <span class="min-w-0">
          <span class="block font-display text-2xl font-bold">{{ t('menu.startMatch') }}</span>
          <span class="block text-sm text-bb-muted">{{ t('menu.startMatchHint') }}</span>
        </span>
      </button>

      <button
        data-testid="menu-help"
        type="button"
        class="flex items-center gap-4 rounded-2xl border border-bb-border bg-bb-surface p-4 text-left text-bb-text shadow-sm transition hover:border-bb-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
        @click="openHelp"
      >
        <HelpIcon class="size-14 shrink-0 text-bb-text" />

        <span class="min-w-0">
          <span class="block font-display text-2xl font-bold">{{ t('menu.help') }}</span>
          <span class="block text-sm text-bb-muted">{{ t('menu.helpHint') }}</span>
        </span>
      </button>
    </div>
  </main>
</template>
