<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { CreateMatchInput, MatchSession, TeamId } from './domain/models/match'
import { createMatch } from './domain/services/create-match'
import {
  confirmHalftime,
  createSession,
  finishTurn,
  recordTouchdown,
  undoLastAction,
  useReroll,
} from './domain/services/match-actions'
import { getTurnsPerHalf } from './domain/rules/match-rules'
import { clearSavedSession, loadSession, saveSession } from './persistence/match-storage'

const races = [
  'Amazonas',
  'Altos Elfos',
  'Alianza del Viejo Mundo',
  'Caos',
  'Enanos',
  'Elfos Oscuros',
  'Elfos Silvanos',
  'Elegidos del Caos',
  'Enanos del Caos',
  'Humanos',
  'Imperial Nobility',
  'Hombres Lagarto',
  'Khorne',
  'Muertos Vivientes',
  'Nórdicos',
  'Nurgle',
  'Ogro',
  'Orcos',
  'Pacto del Caos',
  'Skaven',
  'Snotlings',
  'Vampiros',
  'Unión Élfica',
  'Inframundo',
  'Otro',
]

const format = ref<'normal' | 'sevens'>('normal')
const homeName = ref('')
const homeRace = ref('Humanos')
const homeRerolls = ref(3)
const awayName = ref('')
const awayRace = ref('Orcos')
const awayRerolls = ref(3)
const kickingTeamId = ref<TeamId>('home')

const session = ref<MatchSession | null>(null)
const errorMessage = ref('')
const showSetup = computed(() => session.value === null)

const currentMatch = computed(() => session.value?.current ?? null)
const maxTurns = computed(() =>
  currentMatch.value ? getTurnsPerHalf(currentMatch.value.format) : 8,
)

const teams = computed(() => {
  if (!currentMatch.value) return []
  return [currentMatch.value.teams.home, currentMatch.value.teams.away]
})

const activeTeam = computed(() => {
  if (!currentMatch.value) return null
  return currentMatch.value.teams[currentMatch.value.activeTeamId]
})

const recoveryPending = ref(false)
const storageWarning = ref('')
let pendingSession: MatchSession | null = null

const showNewMatchConfirmation = ref(false)

function startMatch() {
  errorMessage.value = ''

  try {
    const input: CreateMatchInput = {
      format: format.value,
      kickingTeamId: kickingTeamId.value,
      home: {
        name: homeName.value,
        race: homeRace.value,
        rerolls: Number(homeRerolls.value),
      },
      away: {
        name: awayName.value,
        race: awayRace.value,
        rerolls: Number(awayRerolls.value),
      },
    }

    session.value = createSession(createMatch(input))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la partida'
  }
}

function updateSession(action: (current: MatchSession) => MatchSession) {
  if (!session.value) return

  errorMessage.value = ''

  try {
    session.value = action(session.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo realizar la acción'
  }
}

function addTouchdown(teamId: TeamId) {
  updateSession((current) => recordTouchdown(current, teamId))
}

function consumeReroll(teamId: TeamId) {
  updateSession((current) => useReroll(current, teamId))
}

function endTurn() {
  updateSession((current) => finishTurn(current))
}

function startSecondHalf() {
  updateSession((current) => confirmHalftime(current))
}

function undo() {
  updateSession((current) => undoLastAction(current))
}

function newMatch() {
  const matchToReplace = session.value ?? pendingSession

  if (matchToReplace && matchToReplace.current.status !== 'finished') {
    recoveryPending.value = false
    showNewMatchConfirmation.value = true
    return
  }

  beginNewMatch()
}

function cancelNewMatch() {
  showNewMatchConfirmation.value = false

  if (pendingSession) {
    recoveryPending.value = true
  }
}

function confirmNewMatch() {
  beginNewMatch()
  showNewMatchConfirmation.value = false
}

function beginNewMatch() {
  try {
    clearSavedSession()
  } catch {
    storageWarning.value =
      'No se ha podido borrar la partida guardada. Comprueba el almacenamiento del navegador.'
    return
  }

  session.value = null
  pendingSession = null
  recoveryPending.value = false
  storageWarning.value = ''
  errorMessage.value = ''
}

function drawKickingTeam() {
  kickingTeamId.value = Math.random() < 0.5 ? 'home' : 'away'
}

onMounted(() => {
  try {
    const result = loadSession()

    if (result.status === 'valid') {
      pendingSession = result.session
      recoveryPending.value = true
    } else if (result.status === 'invalid') {
      storageWarning.value = 'No se ha podido leer la partida guardada. Puedes iniciar una nueva.'
    }
  } catch {
    storageWarning.value = 'El almacenamiento local no está disponible en este navegador.'
  }
})

watch(
  session,
  (current) => {
    if (!current || recoveryPending.value) return

    try {
      saveSession(current)
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'No se ha podido guardar la partida. Comprueba el almacenamiento del navegador.'
    }
  },
  { deep: true },
)

function continueSavedMatch() {
  if (!pendingSession) return

  session.value = pendingSession
  pendingSession = null
  recoveryPending.value = false
}
</script>

<template>
  <div class="min-h-screen bg-bb-background text-bb-text selection:bg-bb-blue selection:text-white">
    <!-- Cabecera -->
    <header class="border-b border-bb-border bg-bb-blue text-white shadow-sm">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 font-display text-2xl font-bold"
          >
            BB
          </div>
          <div class="min-w-0">
            <h1 class="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
              BB <span class="text-red-300">Chief</span>
            </h1>
            <p class="text-xs text-blue-100">Hecho para jugar</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="session && session.history.length > 0"
            type="button"
            @click="undo"
            title="Deshacer última acción"
            aria-label="Deshacer última acción"
            class="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-100 transition hover:bg-slate-700"
          >
            <span aria-hidden="true">↶</span>
          </button>

          <button
            type="button"
            @click="newMatch"
            title="Nueva partida"
            aria-label="Nueva partida"
            class="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 transition hover:bg-emerald-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Confirmación de nueva partida -->
    <div
      v-if="showNewMatchConfirmation"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-match-title"
    >
      <section
        class="w-full max-w-md rounded-2xl border border-bb-border bg-bb-surface p-6 shadow-2xl"
      >
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-bb-red">Confirmación</p>
        <h2 id="new-match-title" class="mt-2 font-display text-3xl font-bold">
          ¿Empezar una nueva partida?
        </h2>

        <p class="mt-3 text-sm leading-relaxed text-bb-muted">
          La partida actual todavía no ha terminado. Si continúas, perderás su marcador, sus turnos
          y el historial para deshacer acciones.
        </p>

        <div class="mt-6 grid gap-3">
          <button
            class="min-h-12 rounded-xl bg-bb-red px-4 py-3 font-bold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-red"
            @click="confirmNewMatch"
          >
            Descartar y empezar nueva
          </button>

          <button
            class="min-h-12 rounded-xl border border-bb-border px-4 py-3 font-bold text-bb-text transition hover:bg-bb-background"
            @click="cancelNewMatch"
          >
            Seguir con la partida actual
          </button>
        </div>
      </section>
    </div>

    <!-- Recuperación de partida -->
    <div
      v-if="recoveryPending"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
    >
      <section
        class="w-full max-w-md rounded-2xl border border-bb-border bg-bb-surface p-6 shadow-2xl"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-bb-blue-soft text-bb-blue"
        >
          <span class="text-2xl" aria-hidden="true">↻</span>
        </div>
        <h2 id="recovery-title" class="mt-4 font-display text-3xl font-bold">Partida guardada</h2>

        <p class="mt-3 text-sm leading-relaxed text-bb-muted">
          Se ha encontrado una partida anterior. ¿Quieres continuarla o empezar una nueva?
        </p>

        <div class="mt-6 grid gap-3">
          <button
            class="min-h-12 rounded-xl bg-bb-blue px-4 py-3 font-bold text-white transition hover:bg-bb-blue-deep"
            @click="continueSavedMatch"
          >
            Continuar partida
          </button>

          <button
            class="min-h-12 rounded-xl border border-bb-red/30 px-4 py-3 font-bold text-bb-red transition hover:bg-bb-red-soft"
            @click="newMatch"
          >
            Descartar y empezar una nueva
          </button>
        </div>
      </section>
    </div>

    <main class="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <!-- Configuración -->
      <section v-if="showSetup" class="mx-auto max-w-3xl">
        <div class="mb-6">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-bb-blue">
            Preparación del encuentro
          </p>
          <h2 class="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl">
            ¡Que empiece el partido!
          </h2>
          <p class="mt-2 text-bb-muted">Configura los equipos y prepara el marcador.</p>
        </div>

        <form class="space-y-5" @submit.prevent="startMatch">
          <!-- Formato -->
          <section class="rounded-2xl border border-bb-border bg-bb-surface p-4 shadow-sm sm:p-6">
            <h3 class="mb-4 font-display text-2xl font-bold">Formato del partido</h3>

            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
                :class="
                  format === 'normal'
                    ? 'border-bb-blue bg-bb-blue-soft ring-1 ring-bb-blue'
                    : 'border-bb-border bg-white hover:border-bb-blue/50 hover:bg-slate-50'
                "
                :aria-pressed="format === 'normal'"
                @click="format = 'normal'"
              >
                <span class="block font-bold" :class="format === 'normal' ? 'text-bb-blue' : ''">
                  Normal
                </span>
                <span class="mt-1 block text-sm text-bb-muted">8 turnos por equipo</span>
              </button>

              <button
                type="button"
                class="rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
                :class="
                  format === 'sevens'
                    ? 'border-bb-blue bg-bb-blue-soft ring-1 ring-bb-blue'
                    : 'border-bb-border bg-white hover:border-bb-blue/50 hover:bg-slate-50'
                "
                :aria-pressed="format === 'sevens'"
                @click="format = 'sevens'"
              >
                <span class="block font-bold" :class="format === 'sevens' ? 'text-bb-blue' : ''">
                  Sevens
                </span>
                <span class="mt-1 block text-sm text-bb-muted">6 turnos por equipo</span>
              </button>
            </div>
          </section>

          <!-- Equipos -->
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Local -->
            <section
              class="overflow-hidden rounded-2xl border border-bb-blue/25 bg-bb-surface shadow-sm"
            >
              <div
                class="flex items-center gap-3 border-b border-bb-blue/15 bg-bb-blue-soft px-4 py-4 sm:px-6"
              >
                <div
                  class="flex size-9 items-center justify-center rounded-lg bg-bb-blue text-sm font-bold text-white"
                >
                  L
                </div>
                <div>
                  <h3 class="font-display text-2xl font-bold text-bb-blue">Equipo local</h3>
                  <p class="text-xs text-bb-muted">Identidad azul</p>
                </div>
              </div>

              <div class="p-4 sm:p-6">
                <label for="home-name" class="mb-2 block text-sm font-semibold">
                  Nombre del equipo
                </label>
                <input
                  id="home-name"
                  v-model="homeName"
                  required
                  maxlength="40"
                  placeholder="Ej. Reikland Reavers"
                  class="mb-4 min-h-12 w-full rounded-xl border border-bb-border bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-bb-blue focus:ring-2 focus:ring-bb-blue/15"
                />

                <label for="home-race" class="mb-2 block text-sm font-semibold">Raza</label>
                <select
                  id="home-race"
                  v-model="homeRace"
                  required
                  class="mb-4 min-h-12 w-full rounded-xl border border-bb-border bg-white px-4 py-3 text-base outline-none focus:border-bb-blue focus:ring-2 focus:ring-bb-blue/15"
                >
                  <option v-for="race in races" :key="race" :value="race">{{ race }}</option>
                </select>

                <label for="home-rerolls" class="mb-2 block text-sm font-semibold">
                  Segundas oportunidades iniciales
                </label>
                <input
                  id="home-rerolls"
                  v-model.number="homeRerolls"
                  type="number"
                  min="0"
                  max="20"
                  required
                  class="min-h-12 w-full rounded-xl border border-bb-border bg-white px-4 py-3 text-base outline-none focus:border-bb-blue focus:ring-2 focus:ring-bb-blue/15"
                />
              </div>
            </section>

            <!-- Visitante -->
            <section
              class="overflow-hidden rounded-2xl border border-bb-red/25 bg-bb-surface shadow-sm"
            >
              <div
                class="flex items-center gap-3 border-b border-bb-red/15 bg-bb-red-soft px-4 py-4 sm:px-6"
              >
                <div
                  class="flex size-9 items-center justify-center rounded-lg bg-bb-red text-sm font-bold text-white"
                >
                  V
                </div>
                <div>
                  <h3 class="font-display text-2xl font-bold text-bb-red">Equipo visitante</h3>
                  <p class="text-xs text-bb-muted">Identidad roja</p>
                </div>
              </div>

              <div class="p-4 sm:p-6">
                <label for="away-name" class="mb-2 block text-sm font-semibold">
                  Nombre del equipo
                </label>
                <input
                  id="away-name"
                  v-model="awayName"
                  required
                  maxlength="40"
                  placeholder="Ej. Gouged Eye"
                  class="mb-4 min-h-12 w-full rounded-xl border border-bb-border bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-bb-red focus:ring-2 focus:ring-bb-red/15"
                />

                <label for="away-race" class="mb-2 block text-sm font-semibold">Raza</label>
                <select
                  id="away-race"
                  v-model="awayRace"
                  required
                  class="mb-4 min-h-12 w-full rounded-xl border border-bb-border bg-white px-4 py-3 text-base outline-none focus:border-bb-red focus:ring-2 focus:ring-bb-red/15"
                >
                  <option v-for="race in races" :key="race" :value="race">{{ race }}</option>
                </select>

                <label for="away-rerolls" class="mb-2 block text-sm font-semibold">
                  Segundas oportunidades iniciales
                </label>
                <input
                  id="away-rerolls"
                  v-model.number="awayRerolls"
                  type="number"
                  min="0"
                  max="20"
                  required
                  class="min-h-12 w-full rounded-xl border border-bb-border bg-white px-4 py-3 text-base outline-none focus:border-bb-red focus:ring-2 focus:ring-bb-red/15"
                />
              </div>
            </section>
          </div>

          <!-- Equipo pateador -->
          <section class="rounded-2xl border border-bb-border bg-bb-surface p-4 shadow-sm sm:p-6">
            <h3 class="font-display text-2xl font-bold">Equipo que patea al inicio</h3>
            <p class="mb-4 mt-1 text-sm text-bb-muted">
              El equipo receptor será quien juegue el primer turno.
            </p>

            <button
              type="button"
              class="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 font-bold text-amber-900 transition hover:bg-amber-100 active:scale-[0.99]"
              @click="drawKickingTeam"
            >
              <span aria-hidden="true">🎲</span>
              Sortear equipo pateador
            </button>

            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="team in [
                  { id: 'home' as const, name: homeName || 'Equipo local' },
                  { id: 'away' as const, name: awayName || 'Equipo visitante' },
                ]"
                :key="team.id"
                type="button"
                class="min-w-0 rounded-xl border p-3 text-left transition"
                :class="
                  kickingTeamId === team.id
                    ? team.id === 'home'
                      ? 'border-bb-blue bg-bb-blue-soft ring-1 ring-bb-blue'
                      : 'border-bb-red bg-bb-red-soft ring-1 ring-bb-red'
                    : 'border-bb-border bg-white hover:bg-slate-50'
                "
                :aria-pressed="kickingTeamId === team.id"
                @click="kickingTeamId = team.id"
              >
                <span class="block text-xs font-bold uppercase tracking-wider text-bb-muted">
                  Patea
                </span>
                <span
                  class="mt-1 block break-words font-semibold"
                  :class="
                    kickingTeamId === team.id
                      ? team.id === 'home'
                        ? 'text-bb-blue'
                        : 'text-bb-red'
                      : 'text-bb-text'
                  "
                >
                  {{ team.name }}
                </span>
                <span
                  v-if="kickingTeamId === team.id"
                  class="mt-2 block text-xs font-bold"
                  :class="team.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
                >
                  Seleccionado
                </span>
              </button>
            </div>
          </section>

          <p
            v-if="errorMessage"
            role="alert"
            class="rounded-xl border border-bb-red/30 bg-bb-red-soft p-3 text-sm font-medium text-bb-red"
          >
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="min-h-14 w-full rounded-xl bg-bb-blue px-5 py-4 font-display text-2xl font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-bb-blue-deep active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-blue"
          >
            Crear partida
          </button>
        </form>
      </section>

      <!-- Marcador -->
      <section v-else-if="currentMatch && activeTeam" class="space-y-5">
        <!-- Parte -->
        <div
          class="relative overflow-hidden rounded-xl border border-bb-border bg-bb-surface px-3 py-2 text-center shadow-sm"
        >
          <!-- Franja superior -->
          <div class="absolute inset-x-0 top-0 h-1 bg-bb-blue-deep"></div>

          <p class="text-[10px] font-bold uppercase tracking-widest text-bb-blue">
            {{ currentMatch.format === 'normal' ? 'Blood Bowl' : 'Blood Bowl Sevens' }}
          </p>

          <h2 class="mt-0.5 font-display text-xl font-bold sm:text-2xl">
            {{
              currentMatch.status === 'finished'
                ? 'Partido finalizado'
                : currentMatch.half === 1
                  ? 'Primera parte'
                  : 'Segunda parte'
            }}
          </h2>
        </div>

        <!-- Marcador general -->
        <div class="grid grid-cols-2 gap-3 sm:gap-5">
          <article
            v-for="team in teams"
            :key="team.id"
            class="overflow-hidden rounded-2xl border bg-bb-surface text-center shadow-sm"
            :class="team.id === 'home' ? 'border-bb-blue/30' : 'border-bb-red/30'"
          >
            <div class="h-1.5" :class="team.id === 'home' ? 'bg-bb-blue' : 'bg-bb-red'"></div>

            <div class="p-3 sm:p-5">
              <div
                class="mx-auto flex size-12 items-center justify-center rounded-xl sm:size-16"
                :class="
                  team.id === 'home' ? 'bg-bb-blue-soft text-bb-blue' : 'bg-bb-red-soft text-bb-red'
                "
                aria-hidden="true"
              >
                <span class="text-2xl sm:text-3xl">🛡️</span>
              </div>

              <p
                class="mt-3 break-words text-sm font-bold sm:text-lg"
                :class="team.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
              >
                {{ team.name }}
              </p>

              <p class="score-number mt-2 text-6xl text-bb-text sm:text-8xl">
                {{ team.touchdowns }}
              </p>

              <p class="mt-2 text-xs font-bold uppercase tracking-wider text-bb-muted">
                Touchdowns
              </p>
            </div>
          </article>
        </div>

        <!-- Panel del equipo activo -->
        <article
          class="overflow-hidden rounded-2xl border bg-bb-surface shadow-sm"
          :class="activeTeam.id === 'home' ? 'border-bb-blue/40' : 'border-bb-red/40'"
        >
          <div class="h-1.5" :class="activeTeam.id === 'home' ? 'bg-bb-blue' : 'bg-bb-red'"></div>

          <div class="p-4 sm:p-6">
            <!-- Identidad del equipo activo -->
            <div class="flex items-center gap-3">
              <div
                class="flex size-14 shrink-0 items-center justify-center rounded-xl sm:size-16"
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
                  Turno activo
                </p>
                <h3
                  class="break-words font-display text-2xl font-bold sm:text-3xl"
                  :class="activeTeam.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
                >
                  {{ activeTeam.name }}
                </h3>
                <p class="mt-1 text-sm text-bb-muted">{{ activeTeam.race }}</p>
              </div>

              <div
                class="hidden shrink-0 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide sm:block"
                :class="
                  activeTeam.id === 'home'
                    ? 'bg-bb-blue-soft text-bb-blue'
                    : 'bg-bb-red-soft text-bb-red'
                "
              >
                {{ activeTeam.id === 'home' ? 'Local' : 'Visitante' }}
              </div>
            </div>

            <!-- Finalizar turno -->
            <button
              class="mt-5 min-h-14 w-full rounded-xl px-5 py-4 font-display text-2xl font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
              :class="
                activeTeam.id === 'home'
                  ? 'bg-bb-blue hover:bg-bb-blue-deep focus-visible:outline-bb-blue'
                  : 'bg-bb-red hover:bg-red-800 focus-visible:outline-bb-red'
              "
              @click="endTurn"
            >
              <span> Finalizar turno {{ Math.min(activeTeam.turnsCompleted + 1, maxTurns) }} </span>

              <div class="flex w-full max-w-xs gap-1" aria-hidden="true">
                <div
                  v-for="turn in maxTurns"
                  :key="turn"
                  class="h-1.5 flex-1 rounded-sm transition-colors"
                  :class="
                    turn <= activeTeam.turnsCompleted
                      ? activeTeam.id === 'home'
                        ? 'bg-white'
                        : 'bg-white'
                      : turn === activeTeam.turnsCompleted + 1
                        ? 'bg-white/70'
                        : 'bg-white/25'
                  "
                ></div>
              </div>

              <p class="mt-3 text-center text-xs text-slate-950/80">
                El turno pasará al equipo que corresponda.
              </p>
            </button>

            <!-- Acciones principales -->
            <div class="mt-4 grid grid-cols-2 gap-3">
              <button
                :disabled="currentMatch.status !== 'in-progress'"
                class="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl p-3 font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                :class="
                  activeTeam.id === 'home'
                    ? 'bg-bb-blue hover:bg-bb-blue-deep'
                    : 'bg-bb-red hover:bg-red-800'
                "
                @click="addTouchdown(activeTeam.id)"
              >
                <span class="text-2xl" aria-hidden="true">🏈</span>
                <span class="text-base">Touchdown</span>
                <span class="text-xs font-medium text-white/80">+1 punto</span>
              </button>

              <button
                :disabled="
                  currentMatch.status !== 'in-progress' || activeTeam.rerollsAvailable === 0
                "
                class="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-2 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                :class="
                  activeTeam.id === 'home'
                    ? 'border-bb-blue/30 bg-bb-blue-soft hover:bg-blue-100'
                    : 'border-bb-red/30 bg-bb-red-soft hover:bg-red-100'
                "
                @click="consumeReroll(activeTeam.id)"
              >
                <span
                  class="score-number text-4xl"
                  :class="activeTeam.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
                >
                  {{ activeTeam.rerollsAvailable }}
                </span>
                <span
                  class="flex items-center justify-center gap-1 text-center text-xs font-bold sm:text-sm"
                  :class="activeTeam.id === 'home' ? 'text-bb-blue' : 'text-bb-red'"
                >
                  <span aria-hidden="true">↻</span>
                  <span>Usar segunda oportunidad</span>
                </span>
              </button>
            </div>
          </div>
        </article>

        <!-- Descanso -->
        <div
          v-if="currentMatch.status === 'halftime-pending'"
          class="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"
          role="status"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl"
            >
              ⏸
            </div>
            <div>
              <h3 class="font-display text-2xl font-bold text-amber-950">¡Descanso!</h3>
              <p class="mt-1 text-sm leading-relaxed text-amber-900">
                Los dos equipos han completado sus turnos de la primera parte. Confirma para iniciar
                la segunda parte.
              </p>
            </div>
          </div>
          <button
            class="mt-4 min-h-12 w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-amber-950 transition hover:bg-amber-300"
            @click="startSecondHalf"
          >
            Comenzar segunda parte
          </button>
        </div>

        <!-- Partido finalizado -->
        <div
          v-else-if="currentMatch.status === 'finished'"
          class="overflow-hidden rounded-2xl border border-bb-blue/20 bg-bb-surface text-center shadow-sm"
          role="status"
        >
          <div class="bg-bb-blue px-4 py-4 text-white">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              Partido finalizado
            </p>
            <h3 class="mt-1 font-display text-3xl font-bold sm:text-4xl">Resultado final</h3>
          </div>

          <div class="p-5 sm:p-7">
            <div class="flex items-center justify-center gap-4 sm:gap-8">
              <div class="min-w-0 flex-1 text-right">
                <p class="break-words font-bold text-bb-blue">
                  {{ currentMatch.teams.home.name }}
                </p>
                <p class="text-xs text-bb-muted">Local</p>
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
                <p class="text-xs text-bb-muted">Visitante</p>
              </div>
            </div>

            <p class="mt-5 text-lg font-bold">
              {{
                currentMatch.teams.home.touchdowns === currentMatch.teams.away.touchdowns
                  ? '¡Empate!'
                  : `¡Victoria de ${
                      currentMatch.teams.home.touchdowns > currentMatch.teams.away.touchdowns
                        ? currentMatch.teams.home.name
                        : currentMatch.teams.away.name
                    }!`
              }}
            </p>

            <button
              class="mt-5 min-h-12 rounded-xl bg-bb-blue px-5 py-3 font-bold text-white transition hover:bg-bb-blue-deep"
              @click="newMatch"
            >
              Preparar otro partido
            </button>
          </div>
        </div>

        <!-- Errores -->
        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-xl border border-bb-red/30 bg-bb-red-soft p-3 text-sm font-medium text-bb-red"
        >
          {{ errorMessage }}
        </p>
      </section>

      <!-- Avisos de almacenamiento -->
      <p
        v-if="storageWarning"
        role="alert"
        class="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950"
      >
        {{ storageWarning }}
      </p>
    </main>

    <footer
      class="border-t border-bb-border bg-bb-surface px-4 py-5 text-center text-xs text-bb-muted"
    >
      <span class="font-display font-bold tracking-wide text-bb-blue">BB CHIEF</span>
      <span class="mx-1">·</span>
      Blood Bowl 2020
      <span class="mx-1">·</span>
      Hecho para jugar
    </footer>
  </div>
</template>
