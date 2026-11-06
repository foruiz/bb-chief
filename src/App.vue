<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLocale, type Locale } from './i18n'
import { useMatchSession } from './composables/useMatchSession'

const route = useRoute()
const { t, locale } = useI18n()

const {
  recoveryPending,
  showNewMatchConfirmation,
  storageWarning,
  initializeSession,
  discardSavedAndPrepareNewMatch,
  cancelNewMatch,
  confirmAndPrepareNewMatch,
  continueAndOpenMatch,
  prepareNewMatch,
} = useMatchSession()

function changeLocale(newLocale: Locale) {
  setLocale(newLocale)
}

async function updateOrientation() {
  if (route.name === 'setup') {
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock('portrait')
      }
    } catch {
      // El navegador no permite bloquear la orientación.
      // La alternativa visual se aplica mediante CSS.
    }

    return
  }

  screen.orientation?.unlock()
}

watch(
  () => route.name,
  () => {
    void updateOrientation()
  },
)

onMounted(() => {
  initializeSession()
  void updateOrientation()
})

onBeforeUnmount(() => {
  screen.orientation?.unlock()
})
</script>

<template>
  <div
    class="app-shell flex h-dvh min-h-0 flex-col overflow-x-hidden bg-bb-background text-bb-text selection:bg-bb-blue selection:text-white"
    :class="{
      'setup-portrait-fallback': route.name === 'setup',
      'match-route': route.name === 'match',
    }"
  >
    <!-- Cabecera común -->
    <header class="shrink-0 border-b border-bb-border bg-bb-blue text-white shadow-sm">
      <div
        class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4"
      >
        <button
          type="button"
          class="flex min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          :aria-label="t('app.logoLabel')"
          @click="prepareNewMatch"
        >
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 font-display text-2xl font-bold"
            aria-hidden="true"
          >
            BB
          </div>

          <div class="min-w-0">
            <h1 class="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
              BB <span class="text-red-300">Chief</span>
            </h1>
            <p class="text-xs text-blue-100">{{ t('app.tagline') }}</p>
          </div>
        </button>

        <!-- Selector de idioma -->
        <div
          class="flex shrink-0 items-center gap-1 rounded-lg border border-white/20 bg-white/10 p-1"
          role="group"
          :aria-label="t('app.language')"
        >
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-bold transition"
            :class="locale === 'es' ? 'bg-white text-bb-blue' : 'text-white hover:bg-white/10'"
            :aria-pressed="locale === 'es'"
            @click="changeLocale('es')"
          >
            ES
          </button>

          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-bold transition"
            :class="locale === 'en' ? 'bg-white text-bb-blue' : 'text-white hover:bg-white/10'"
            :aria-pressed="locale === 'en'"
            @click="changeLocale('en')"
          >
            EN
          </button>
        </div>
      </div>
    </header>

    <!-- Aviso global de almacenamiento -->
    <div
      v-if="storageWarning"
      class="mx-auto mt-4 w-full max-w-6xl shrink-0 px-4 sm:px-6"
      role="alert"
    >
      <p
        class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950"
      >
        {{ t(`storage.${storageWarning}`) }}
      </p>
    </div>

    <!-- Vista actual: configuración o marcador -->
    <div class="min-h-0 flex-1">
      <RouterView />
    </div>

    <!-- Recuperación de partida guardada -->
    <Teleport to="body">
      <div
        v-if="recoveryPending"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
        :class="{ 'setup-portrait-overlay': route.name === 'setup' }"
        role="presentation"
      >
        <section
          class="my-auto w-full max-w-md rounded-2xl border border-bb-border bg-bb-surface p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-title"
        >
          <h2 id="recovery-title" class="mt-4 font-display text-3xl font-bold">
            {{ t('recovery.title') }}
          </h2>

          <p class="mt-3 text-sm leading-relaxed text-bb-muted">
            {{ t('recovery.description') }}
          </p>

          <div class="mt-6 grid gap-3">
            <button
              type="button"
              class="min-h-12 rounded-xl bg-bb-blue px-4 py-3 font-bold text-white transition hover:bg-bb-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
              @click="continueAndOpenMatch"
            >
              {{ t('recovery.continue') }}
            </button>

            <button
              type="button"
              class="min-h-12 rounded-xl border border-bb-red/30 px-4 py-3 font-bold text-bb-red transition hover:bg-bb-red-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-red"
              @click="discardSavedAndPrepareNewMatch"
            >
              {{ t('recovery.discard') }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- Confirmación para descartar una partida en curso -->
    <Teleport to="body">
      <div
        v-if="showNewMatchConfirmation"
        class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
        :class="{ 'setup-portrait-overlay': route.name === 'setup' }"
        role="presentation"
      >
        <section
          class="my-auto w-full max-w-md rounded-2xl border border-bb-border bg-bb-surface p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-match-title"
        >
          <h2 id="new-match-title" class="mt-2 font-display text-3xl font-bold">
            {{ t('match.confirmNew.title') }}
          </h2>

          <p class="mt-3 text-sm leading-relaxed text-bb-muted">
            {{ t('match.confirmNew.description') }}
          </p>

          <div class="mt-6 grid gap-3">
            <button
              type="button"
              class="min-h-12 rounded-xl bg-bb-red px-4 py-3 font-bold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-red"
              @click="confirmAndPrepareNewMatch"
            >
              {{ t('match.confirmNew.confirm') }}
            </button>

            <button
              type="button"
              class="min-h-12 rounded-xl border border-bb-border px-4 py-3 font-bold text-bb-text transition hover:bg-bb-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
              @click="cancelNewMatch"
            >
              {{ t('match.confirmNew.cancel') }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/*
 * Adaptación de la cabecera en el marcador.
 * Se aplica únicamente en móviles con poca altura.
 */
@media (max-width: 767px) and (max-height: 760px) {
  .match-route > header > div {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }

  .match-route > header > div > button > div:first-child {
    width: 2.25rem;
    height: 2.25rem;
  }
}

/*
 * Alternativa visual para la configuración del partido
 * cuando el navegador no permite bloquear la orientación.
 */
@media (orientation: landscape) {
  .setup-portrait-fallback {
    position: fixed;
    top: 50%;
    left: 50%;

    width: 100dvh;
    height: 100dvw;
    min-height: 0;

    overflow-x: hidden;
    overflow-y: auto;

    transform: translate(-50%, -50%) rotate(90deg);
    transform-origin: center center;

    overscroll-behavior: contain;
  }

  .setup-portrait-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    bottom: auto;

    width: 100dvh;
    height: 100dvw;

    transform: translate(-50%, -50%) rotate(90deg);
    transform-origin: center center;
  }
}
</style>
