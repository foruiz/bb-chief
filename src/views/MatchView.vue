<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchSession } from '../composables/useMatchSession'

import OptionsIcon from '../assets/icons/options.png'
import PitchIcon from '../assets/icons/pitch.png'

const { t } = useI18n()

const {
  session,
  currentMatch,
  maxTurns,
  teams,
  activeTeam,
  errorMessage,
  addTouchdown,
  consumeReroll,
  endTurn,
  startSecondHalf,
  undo,
  prepareNewMatch,
} = useMatchSession()

const showBack = ref(false)

watch(
  () => currentMatch.value?.status,
  () => {
    showBack.value = false
  },
)

function toggleCardFace() {
  showBack.value = !showBack.value
}
</script>

<template>
  <main class="match-main mx-auto h-full min-h-0 max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
    <section v-if="currentMatch" class="match-layout space-y-5">
      <!-- Columna izquierda: parte y marcador -->
      <div class="match-overview space-y-5">
        <!-- Parte -->
        <div
          class="match-half relative overflow-hidden rounded-xl border border-bb-border bg-bb-surface px-3 py-2 text-center shadow-sm"
        >
          <div class="absolute inset-x-0 top-0 h-1 bg-bb-blue-deep"></div>

          <p class="text-[10px] font-bold uppercase tracking-widest text-bb-blue">
            {{ currentMatch.format === 'normal' ? 'Blood Bowl' : 'Blood Bowl Sevens' }}
          </p>

          <h2 class="mt-0.5 font-display text-xl font-bold sm:text-2xl">
            {{
              currentMatch.status === 'finished'
                ? t('matchView.status.finished')
                : currentMatch.status === 'halftime-pending'
                  ? t('matchView.status.halftime')
                  : currentMatch.half === 1
                    ? t('matchView.status.firstHalf')
                    : t('matchView.status.secondHalf')
            }}
          </h2>
        </div>

        <!-- Marcador general -->
        <div class="match-scoreboard grid grid-cols-2 gap-3 sm:gap-5">
          <article
            v-for="team in teams"
            :key="team.id"
            class="match-team overflow-hidden rounded-2xl border bg-bb-surface text-center shadow-sm"
            :class="team.id === 'home' ? 'border-bb-blue/30' : 'border-bb-red/30'"
          >
            <div class="h-1.5" :class="team.id === 'home' ? 'bg-bb-blue' : 'bg-bb-red'"></div>

            <div class="match-team-content p-3 sm:p-5">
              <div
                class="match-team-icon mx-auto flex size-12 items-center justify-center rounded-xl sm:size-16"
                :class="
                  team.id === 'home' ? 'bg-bb-blue-soft text-bb-blue' : 'bg-bb-red-soft text-bb-red'
                "
                aria-hidden="true"
              >
                <span class="text-2xl sm:text-3xl">🛡️</span>
              </div>

              <p
                class="match-team-name mt-3 break-words text-sm font-bold sm:text-lg"
                :class="team.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
              >
                {{ team.name }}
              </p>

              <p class="score-number match-team-score mt-2 text-6xl text-bb-text sm:text-8xl">
                {{ team.touchdowns }}
              </p>

              <p
                class="match-team-label mt-2 text-xs font-bold uppercase tracking-wider text-bb-muted"
              >
                {{ t('matchView.score.touchdowns') }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <!-- Columna derecha: tarjeta giratoria -->
      <div class="match-panel card-scene">
        <article
          class="card-flipper"
          :class="{ 'is-flipped': showBack }"
          :aria-label="
            currentMatch.status === 'in-progress' && activeTeam
              ? t('matchView.accessibility.teamCard', { team: activeTeam.name })
              : currentMatch.status === 'halftime-pending'
                ? t('matchView.accessibility.halftimeCard')
                : t('matchView.accessibility.finishedCard')
          "
        >
          <!-- Cara frontal -->
          <section
            class="card-face overflow-hidden rounded-2xl border bg-bb-surface shadow-sm"
            :class="activeTeam?.id === 'away' ? 'border-bb-red/40' : 'border-bb-blue/40'"
            :aria-hidden="showBack"
            :inert="showBack"
          >
            <div
              class="h-1.5 shrink-0"
              :class="activeTeam?.id === 'away' ? 'bg-bb-red' : 'bg-bb-blue'"
            ></div>

            <div class="match-card-content p-4 sm:p-6">
              <!-- Partido en curso -->
              <template v-if="currentMatch.status === 'in-progress' && activeTeam">
                <div class="flex items-start gap-3">
                  <div
                    class="match-active-icon flex size-14 shrink-0 items-center justify-center rounded-xl sm:size-16"
                    :class="
                      activeTeam.id === 'home'
                        ? 'bg-bb-blue-soft text-bb-blue'
                        : 'bg-bb-red-soft text-bb-red'
                    "
                    aria-hidden="true"
                  >
                    <span class="text-3xl">🛡️</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-bb-muted">
                      {{ t('matchView.active.turn') }}
                    </p>

                    <h3
                      class="match-active-name break-words font-display text-2xl font-bold sm:text-3xl"
                      :class="activeTeam.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
                    >
                      {{ activeTeam.name }}
                    </h3>

                    <p class="mt-1 text-sm text-bb-muted">
                      {{ activeTeam.race }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="match-flip-button flex size-14 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 sm:size-16"
                    :class="
                      activeTeam.id === 'home'
                        ? 'border-bb-blue/30 bg-bb-blue-soft text-bb-blue hover:bg-blue-100 focus-visible:outline-bb-blue'
                        : 'border-bb-red/30 bg-bb-red-soft text-bb-red hover:bg-red-100 focus-visible:outline-bb-red'
                    "
                    :aria-label="t('matchView.options.show')"
                    :title="t('matchView.options.show')"
                    @click="toggleCardFace"
                  >
                    <img
                      :src="OptionsIcon"
                      alt=""
                      class="size-8 object-contain sm:size-9"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <!-- Acciones principales -->
                <div class="match-actions mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    :disabled="currentMatch.status !== 'in-progress'"
                    class="match-action flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-2 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    :class="
                      activeTeam.id === 'home'
                        ? 'border-bb-blue/30 bg-bb-blue-soft hover:bg-blue-100'
                        : 'border-bb-red/30 bg-bb-red-soft hover:bg-red-100'
                    "
                    @click="addTouchdown(activeTeam.id)"
                  >
                    <span class="text-2xl" aria-hidden="true">🏈</span>
                    <span class="text-sm font-black">
                      {{ t('matchView.active.scoreTouchdown') }}
                    </span>
                  </button>

                  <button
                    type="button"
                    :disabled="
                      currentMatch.status !== 'in-progress' || activeTeam.rerollsAvailable === 0
                    "
                    class="match-action flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-2 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    :class="
                      activeTeam.id === 'home'
                        ? 'border-bb-blue/30 bg-bb-blue-soft hover:bg-blue-100'
                        : 'border-bb-red/30 bg-bb-red-soft hover:bg-red-100'
                    "
                    @click="consumeReroll(activeTeam.id)"
                  >
                    <span
                      class="score-number text-4xl"
                      aria-hidden="true"
                      :class="activeTeam.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
                    >
                      {{ activeTeam.rerollsAvailable }} 🎲
                    </span>

                    <span class="text-sm font-black">
                      {{ t('matchView.active.useReroll') }}
                    </span>
                  </button>
                </div>

                <!-- Finalizar turno -->
                <button
                  type="button"
                  :disabled="currentMatch.status !== 'in-progress'"
                  class="match-end-turn mt-5 min-h-14 w-full rounded-xl px-5 py-4 font-display text-2xl font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  :class="
                    activeTeam.id === 'home'
                      ? 'bg-bb-blue hover:bg-bb-blue-deep focus-visible:outline-bb-blue'
                      : 'bg-bb-red hover:bg-red-800 focus-visible:outline-bb-red'
                  "
                  @click="endTurn"
                >
                  <span>
                    {{
                      t('matchView.active.finishTurn', {
                        turn: Math.min(activeTeam.turnsCompleted + 1, maxTurns),
                      })
                    }}
                  </span>

                  <div class="mx-auto flex w-full max-w-xs gap-1" aria-hidden="true">
                    <div
                      v-for="turn in maxTurns"
                      :key="turn"
                      class="h-1.5 flex-1 rounded-sm transition-colors"
                      :class="
                        turn <= activeTeam.turnsCompleted
                          ? 'bg-white'
                          : turn === activeTeam.turnsCompleted + 1
                            ? 'bg-white/70'
                            : 'bg-white/25'
                      "
                    ></div>
                  </div>

                  <p class="match-end-hint mt-3 text-center text-xs text-slate-950/80">
                    {{ t('matchView.active.endTurnHint') }}
                  </p>
                </button>
              </template>

              <!-- Descanso -->
              <template v-else-if="currentMatch.status === 'halftime-pending'">
                <div class="flex items-start gap-3">
                  <div
                    class="match-active-icon flex size-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-3xl sm:size-16"
                    aria-hidden="true"
                  >
                    ⏸
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-bb-muted">
                      {{ t('matchView.halftime.completed') }}
                    </p>

                    <h3 class="font-display text-2xl font-bold text-amber-950 sm:text-3xl">
                      {{ t('matchView.halftime.title') }}
                    </h3>

                    <p class="mt-1 text-sm leading-relaxed text-bb-muted">
                      {{ t('matchView.halftime.description') }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="match-flip-button flex size-14 shrink-0 items-center justify-center rounded-xl border border-bb-blue/30 bg-bb-blue-soft text-bb-blue transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue sm:size-16"
                    :aria-label="t('matchView.options.show')"
                    :title="t('matchView.options.show')"
                    @click="toggleCardFace"
                  >
                    <img
                      :src="OptionsIcon"
                      alt=""
                      class="size-8 object-contain sm:size-9"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <button
                  type="button"
                  class="match-secondary-action mt-4 min-h-12 w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-amber-950 transition hover:bg-amber-300"
                  @click="startSecondHalf"
                >
                  {{ t('matchView.halftime.start') }}
                </button>
              </template>

              <!-- Partido finalizado -->
              <template v-else-if="currentMatch.status === 'finished'">
                <div class="flex items-start gap-3">
                  <div
                    class="match-active-icon flex size-14 shrink-0 items-center justify-center rounded-xl bg-bb-blue-soft text-3xl text-bb-blue sm:size-16"
                    aria-hidden="true"
                  >
                    🏆
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-bb-muted">
                      {{ t('matchView.status.finished') }}
                    </p>

                    <h3 class="font-display text-2xl font-bold text-bb-blue sm:text-3xl">
                      {{ t('matchView.finished.title') }}
                    </h3>
                  </div>

                  <button
                    type="button"
                    class="match-flip-button flex size-14 shrink-0 items-center justify-center rounded-xl border border-bb-blue/30 bg-bb-blue-soft text-bb-blue transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue sm:size-16"
                    :aria-label="t('matchView.options.show')"
                    :title="t('matchView.options.show')"
                    @click="toggleCardFace"
                  >
                    <img
                      :src="OptionsIcon"
                      alt=""
                      class="size-8 object-contain sm:size-9"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div class="match-result mt-5 text-center">
                  <div class="flex items-center justify-center gap-4 sm:gap-8">
                    <div class="min-w-0 flex-1 text-right">
                      <p class="break-words font-bold text-bb-blue">
                        {{ currentMatch.teams.home.name }}
                      </p>
                      <p class="text-xs text-bb-muted">
                        {{ t('matchView.score.home') }}
                      </p>
                    </div>

                    <p class="score-number shrink-0 text-5xl sm:text-7xl">
                      {{ currentMatch.teams.home.touchdowns }}
                      <span class="font-sans text-3xl text-bb-muted sm:text-5xl">—</span>
                      {{ currentMatch.teams.away.touchdowns }}
                    </p>

                    <div class="min-w-0 flex-1 text-left">
                      <p class="break-words font-bold text-bb-red">
                        {{ currentMatch.teams.away.name }}
                      </p>
                      <p class="text-xs text-bb-muted">
                        {{ t('matchView.score.away') }}
                      </p>
                    </div>
                  </div>

                  <p class="mt-5 text-lg font-bold">
                    {{
                      currentMatch.teams.home.touchdowns === currentMatch.teams.away.touchdowns
                        ? t('matchView.score.draw')
                        : t('matchView.score.victory', {
                            team:
                              currentMatch.teams.home.touchdowns >
                              currentMatch.teams.away.touchdowns
                                ? currentMatch.teams.home.name
                                : currentMatch.teams.away.name,
                          })
                    }}
                  </p>
                </div>
              </template>
            </div>
          </section>

          <!-- Cara posterior: opciones del partido -->
          <section
            class="card-face card-back overflow-hidden rounded-2xl border bg-bb-surface shadow-sm"
            :class="activeTeam?.id === 'away' ? 'border-bb-red/40' : 'border-bb-blue/40'"
            :aria-hidden="!showBack"
            :inert="!showBack"
          >
            <div
              class="h-1.5 shrink-0"
              :class="activeTeam?.id === 'away' ? 'bg-bb-red' : 'bg-bb-blue'"
            ></div>

            <div class="match-card-content flex min-h-64 flex-col p-4 sm:min-h-80 sm:p-6">
              <!-- Cabecera de opciones -->
              <div class="flex items-center gap-3">
                <div class="min-w-0 flex-1">
                  <h3
                    class="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl"
                    :class="activeTeam?.id === 'away' ? 'text-bb-red' : 'text-bb-blue'"
                  >
                    {{ t('matchView.options.title') }}
                  </h3>
                </div>

                <button
                  type="button"
                  class="match-flip-button flex size-14 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 sm:size-16"
                  :class="
                    activeTeam?.id === 'away'
                      ? 'border-bb-red/30 bg-bb-red-soft text-bb-red hover:bg-red-100 focus-visible:outline-bb-red'
                      : 'border-bb-blue/30 bg-bb-blue-soft text-bb-blue hover:bg-blue-100 focus-visible:outline-bb-blue'
                  "
                  :aria-label="t('matchView.options.backToScore')"
                  :title="t('matchView.options.backToScore')"
                  @click="toggleCardFace"
                >
                  <img
                    :src="PitchIcon"
                    alt=""
                    class="size-8 object-contain sm:size-9"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <!-- Acciones secundarias -->
              <div class="match-option-grid mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled
                  :aria-label="t('matchView.options.helpComingSoon')"
                  :title="t('matchView.options.comingSoon')"
                  class="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-bb-border bg-bb-background p-2 text-bb-muted opacity-60"
                >
                  <span class="text-3xl" aria-hidden="true">❔</span>
                  <span class="text-sm font-bold">
                    {{ t('matchView.options.help') }}
                  </span>
                </button>

                <button
                  type="button"
                  :disabled="!session?.history?.length"
                  class="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-bb-border bg-bb-background p-2 font-bold text-bb-text transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue disabled:cursor-not-allowed disabled:opacity-40"
                  @click="undo"
                >
                  <span class="text-3xl" aria-hidden="true">↶</span>
                  <span class="text-sm">
                    {{ t('matchView.options.undo') }}
                  </span>
                </button>

                <button
                  type="button"
                  class="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-bb-red/30 bg-bb-red-soft p-2 font-bold text-bb-red transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-red"
                  @click="prepareNewMatch"
                >
                  <span class="text-3xl" aria-hidden="true">↩</span>
                  <span class="text-sm">
                    {{ t('matchView.options.exit') }}
                  </span>
                </button>
              </div>

              <p class="mt-auto pt-5 text-center text-xs text-bb-muted">
                {{ t('matchView.options.exitHint') }}
              </p>
            </div>
          </section>
        </article>
      </div>

      <!-- Errores -->
      <p
        v-if="errorMessage"
        role="alert"
        class="match-error rounded-xl border border-bb-red/30 bg-bb-red-soft p-3 text-sm font-medium text-bb-red"
      >
        {{ t(`errors.${errorMessage}`) }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.card-scene {
  perspective: 1200px;
}

.card-flipper {
  position: relative;
  display: grid;
  transform-style: preserve-3d;
  transition: transform 350ms ease-in-out;
}

.card-flipper.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  grid-area: 1 / 1;
  min-width: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .card-flipper {
    transition-duration: 0.01ms;
  }
}

@media (orientation: landscape) and (max-width: 950px) and (max-height: 600px) {
  .match-main {
    width: 100%;
    max-width: none;
    padding: 0.5rem 0.75rem;
  }

  .match-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0.75rem;
    height: 100%;
    min-height: 0;
  }

  /* Evita márgenes heredados de space-y-5 en el Grid principal. */
  .match-layout > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0;
  }

  /* Columna izquierda */
  .match-overview {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }

  /* Elimina también space-y-5 entre el panel de parte y el marcador. */
  .match-overview > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0;
  }

  .match-half {
    flex: 0 0 auto;
    padding: 0.35rem 0.5rem;
  }

  .match-half h2 {
    font-size: 1.1rem;
    line-height: 1.25rem;
  }

  .match-scoreboard {
    flex: 1;
    min-height: 0;
    gap: 0.5rem;
  }

  .match-team {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }

  .match-team-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.25rem;
  }

  .match-team-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
  }

  .match-team-icon span {
    font-size: 1.25rem;
  }

  .match-team-name {
    margin-top: 0.35rem;
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .match-team-score {
    margin-top: 0.15rem;
    font-size: clamp(2.5rem, 8vh, 3.5rem);
    line-height: 1;
  }

  .match-team-label {
    margin-top: 0.15rem;
    font-size: 0.6rem;
  }

  /* Columna derecha */
  .match-panel {
    display: flex;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }

  .match-panel .card-scene {
    display: flex;
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 0;
  }

  .card-flipper {
    flex: 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .card-face {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .match-card-content {
    flex: 1;
    min-height: 0;
    padding: 0.65rem;
  }

  .match-active-icon,
  .match-flip-button {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.65rem;
  }

  .match-flip-button img {
    width: 1.6rem;
    height: 1.6rem;
  }

  .match-active-name {
    font-size: 1.25rem;
    line-height: 1.4rem;
  }

  .match-actions {
    flex: 1;
    min-height: 0;
    margin-top: 0.55rem;
    gap: 0.5rem;
  }

  .match-action {
    min-height: 3.75rem;
    gap: 0.25rem;
    padding: 0.35rem;
  }

  .match-action > span:first-child {
    font-size: 1.4rem;
    line-height: 1.5rem;
  }

  .match-action > span:last-child {
    font-size: 0.7rem;
    line-height: 0.85rem;
  }

  .match-action .score-number {
    font-size: 1.7rem;
    line-height: 1.8rem;
  }

  .match-end-turn {
    flex: 0 0 auto;
    min-height: 0;
    margin-top: 0.55rem;
    padding: 0.45rem 0.65rem;
    font-size: 1.25rem;
    line-height: 1.5rem;
  }

  .match-end-turn > div {
    margin-top: 0.25rem;
  }

  .match-end-hint {
    margin-top: 0.25rem;
    font-size: 0.65rem;
    line-height: 0.8rem;
  }

  .match-secondary-action {
    min-height: 2.75rem;
    margin-top: 0.65rem;
    padding: 0.5rem;
  }

  /* Cara posterior */
  .card-back .match-card-content {
    min-height: 0;
  }

  .match-option-grid {
    flex: 1;
    min-height: 0;
    margin-top: 0.65rem;
    gap: 0.5rem;
  }

  .match-option-grid button {
    min-width: 0;
    gap: 0.25rem;
    padding: 0.25rem;
  }

  .match-option-grid button span:first-child {
    font-size: 1.5rem;
    line-height: 1.75rem;
  }

  .match-option-grid button span:last-child {
    font-size: 0.65rem;
    line-height: 0.8rem;
    overflow-wrap: anywhere;
  }

  .card-back .match-card-content > p {
    padding-top: 0.5rem;
    font-size: 0.65rem;
  }

  /* Resultado final */
  .match-result {
    margin-top: 0.65rem;
  }

  .match-result .score-number {
    font-size: 2.5rem;
  }

  .match-result > p {
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }

  /* Avisos */
  .match-error {
    grid-column: 1 / -1;
    padding: 0.4rem 0.65rem;
    font-size: 0.7rem;
  }
}
</style>
