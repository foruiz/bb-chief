<script setup lang="ts">
import { computed, ref } from 'vue'
import { onMounted, watch } from 'vue'
import type { CreateMatchInput, MatchSession, TeamId } from './domain/models/match'
import { createMatch } from './domain/services/create-match'
import {
  confirmHalftime,
  correctRerolls,
  correctTouchdowns,
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

const activeTeamName = computed(() => {
  if (!currentMatch.value) return ''
  return currentMatch.value.teams[currentMatch.value.activeTeamId].name
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

function removeTouchdown(teamId: TeamId) {
  updateSession((current) => {
    const score = current.current.teams[teamId].touchdowns
    if (score === 0) return current
    return correctTouchdowns(current, teamId, score - 1)
  })
}

function addReroll(teamId: TeamId) {
  updateSession((current) => {
    const count = current.current.teams[teamId].rerollsAvailable
    return correctRerolls(current, teamId, count + 1)
  })
}

function removeReroll(teamId: TeamId) {
  updateSession((current) => {
    const count = current.current.teams[teamId].rerollsAvailable
    if (count === 0) return current
    return correctRerolls(current, teamId, count - 1)
  })
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

function teamTurnLabel(turnsCompleted: number) {
  if (turnsCompleted >= maxTurns.value) return 'Turnos completados'
  return `Turno ${turnsCompleted + 1} de ${maxTurns.value}`
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
  <div
    class="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-400 selection:text-slate-950"
  >
    <header class="border-b border-slate-800 bg-slate-900/90">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-xl font-black text-emerald-300"
          >
            BB
          </div>
          <div>
            <h1 class="text-xl font-black tracking-wider sm:text-2xl">
              BB <span class="text-emerald-400">CHIEF</span>
            </h1>
            <p class="text-xs text-slate-400">Blood Bowl match tracker</p>
          </div>
        </div>

        <button
          v-if="!showSetup"
          class="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
          @click="newMatch"
        >
          Nueva partida
        </button>
      </div>
    </header>

    <div
      v-if="showNewMatchConfirmation"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-match-title"
    >
      <section
        class="w-full max-w-md rounded-2xl border border-rose-400/40 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 id="new-match-title" class="text-2xl font-black">¿Empezar una nueva partida?</h2>

        <p class="mt-3 text-slate-300">
          La partida actual todavía no ha terminado. Si continúas, perderás su marcador, sus turnos
          y el historial para deshacer acciones.
        </p>

        <div class="mt-6 grid gap-3">
          <button
            class="min-h-12 rounded-xl bg-rose-500 px-4 py-3 font-black text-white"
            @click="confirmNewMatch"
          >
            Descartar y empezar nueva
          </button>

          <button
            class="min-h-12 rounded-xl border border-slate-600 px-4 py-3 font-bold text-slate-200"
            @click="cancelNewMatch"
          >
            Seguir con la partida actual
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="recoveryPending"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
    >
      <section
        class="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 id="recovery-title" class="text-2xl font-black">Partida guardada</h2>

        <p class="mt-3 text-slate-300">
          Se ha encontrado una partida anterior. ¿Quieres continuarla o empezar una nueva?
        </p>

        <div class="mt-6 grid gap-3">
          <button
            class="min-h-12 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950"
            @click="continueSavedMatch"
          >
            Continuar partida
          </button>

          <button
            class="min-h-12 rounded-xl border border-rose-400/40 px-4 py-3 font-bold text-rose-300"
            @click="newMatch"
          >
            Descartar y empezar una nueva
          </button>
        </div>
      </section>
    </div>

    <main class="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <section v-if="showSetup" class="mx-auto max-w-3xl">
        <div class="mb-6">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
            Preparación del encuentro
          </p>
          <h2 class="mt-2 text-3xl font-black sm:text-4xl">¡Que empiece el partido!</h2>
          <p class="mt-2 text-slate-400">Configura los equipos y prepara el marcador.</p>
        </div>

        <form class="space-y-5" @submit.prevent="startMatch">
          <section class="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
            <h3 class="mb-4 text-lg font-bold">Formato del partido</h3>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="rounded-xl border p-4 text-left transition"
                :class="
                  format === 'normal'
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                "
                @click="format = 'normal'"
              >
                <span class="block font-bold">Normal</span>
                <span class="mt-1 block text-sm text-slate-400">8 turnos por equipo</span>
              </button>
              <button
                type="button"
                class="rounded-xl border p-4 text-left transition"
                :class="
                  format === 'sevens'
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                "
                @click="format = 'sevens'"
              >
                <span class="block font-bold">Sevens</span>
                <span class="mt-1 block text-sm text-slate-400">6 turnos por equipo</span>
              </button>
            </div>
          </section>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <section class="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 sm:p-6">
              <div class="mb-5 flex items-center gap-3">
                <div class="size-3 rounded-full bg-emerald-400"></div>
                <h3 class="text-lg font-black">Equipo local</h3>
              </div>

              <label class="mb-2 block text-sm font-semibold text-slate-300">
                Nombre del equipo
              </label>
              <input
                v-model="homeName"
                required
                maxlength="40"
                placeholder="Ej. Reikland Reavers"
                class="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />

              <label class="mb-2 block text-sm font-semibold text-slate-300"> Raza </label>
              <select
                v-model="homeRace"
                required
                class="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base outline-none focus:border-emerald-400"
              >
                <option v-for="race in races" :key="race" :value="race">{{ race }}</option>
              </select>

              <label class="mb-2 block text-sm font-semibold text-slate-300">
                Segundas oportunidades iniciales
              </label>
              <input
                v-model.number="homeRerolls"
                type="number"
                min="0"
                max="20"
                required
                class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base outline-none focus:border-emerald-400"
              />
            </section>

            <section class="rounded-2xl border border-rose-500/30 bg-slate-900 p-4 sm:p-6">
              <div class="mb-5 flex items-center gap-3">
                <div class="size-3 rounded-full bg-rose-400"></div>
                <h3 class="text-lg font-black">Equipo visitante</h3>
              </div>

              <label class="mb-2 block text-sm font-semibold text-slate-300">
                Nombre del equipo
              </label>
              <input
                v-model="awayName"
                required
                maxlength="40"
                placeholder="Ej. Gouged Eye"
                class="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base outline-none transition placeholder:text-slate-600 focus:border-rose-400"
              />

              <label class="mb-2 block text-sm font-semibold text-slate-300"> Raza </label>
              <select
                v-model="awayRace"
                required
                class="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base outline-none focus:border-rose-400"
              >
                <option v-for="race in races" :key="race" :value="race">{{ race }}</option>
              </select>

              <label class="mb-2 block text-sm font-semibold text-slate-300">
                Segundas oportunidades iniciales
              </label>
              <input
                v-model.number="awayRerolls"
                type="number"
                min="0"
                max="20"
                required
                class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base outline-none focus:border-rose-400"
              />
            </section>
          </div>

          <section class="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
            <h3 class="mb-3 text-lg font-bold">Equipo que patea al inicio</h3>
            <p class="mb-4 text-sm text-slate-400">
              El equipo receptor será quien juegue el primer turno.
            </p>
            <button
              type="button"
              class="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-bold text-amber-300 transition hover:bg-amber-400/20 active:scale-[0.99]"
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
                class="rounded-xl border p-3 text-left font-semibold transition"
                :class="
                  kickingTeamId === team.id
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                "
                @click="kickingTeamId = team.id"
              >
                <span class="block text-xs uppercase tracking-wider text-slate-500">Patea</span>
                <span class="mt-1 block break-words">{{ team.name }}</span>
              </button>
            </div>
          </section>

          <p
            v-if="errorMessage"
            role="alert"
            class="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300"
          >
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="w-full rounded-xl bg-emerald-400 px-5 py-4 text-lg font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 active:scale-[0.99]"
          >
            Crear partida
          </button>
        </form>
      </section>

      <section v-else-if="currentMatch" class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
              {{ currentMatch.format === 'normal' ? 'Partido normal' : 'Blood Bowl Sevens' }}
            </p>
            <h2 class="mt-1 text-2xl font-black sm:text-3xl">
              {{ currentMatch.half === 1 ? 'Primera parte' : 'Segunda parte' }}
            </h2>
          </div>

          <div class="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-right">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Turno activo</p>
            <p class="mt-1 font-black text-emerald-300">{{ activeTeamName }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article
            v-for="team in teams"
            :key="team.id"
            class="overflow-hidden rounded-2xl border bg-slate-900 transition"
            :class="[
              team.id === 'home' ? 'border-emerald-500/40' : 'border-rose-500/40',
              currentMatch.activeTeamId === team.id && currentMatch.status === 'in-progress'
                ? 'ring-2 ring-emerald-400/70'
                : '',
            ]"
          >
            <div
              class="p-4 sm:p-5"
              :class="team.id === 'home' ? 'bg-emerald-400/5' : 'bg-rose-400/5'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.18em]"
                    :class="team.id === 'home' ? 'text-emerald-400' : 'text-rose-400'"
                  >
                    {{ team.id === 'home' ? 'Local' : 'Visitante' }}
                  </p>
                  <h3 class="mt-1 break-words text-xl font-black sm:text-2xl">{{ team.name }}</h3>
                  <p class="mt-1 text-sm text-slate-400">{{ team.race }}</p>
                </div>

                <span
                  v-if="
                    currentMatch.activeTeamId === team.id && currentMatch.status === 'in-progress'
                  "
                  class="shrink-0 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300"
                >
                  AL TURNO
                </span>
              </div>

              <div class="my-5 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-center">
                <p class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  Touchdowns
                </p>
                <p class="my-1 text-6xl font-black tabular-nums sm:text-7xl">
                  {{ team.touchdowns }}
                </p>
                <div class="mt-4 flex justify-center gap-3">
                  <button
                    :disabled="currentMatch.status !== 'in-progress' || team.touchdowns === 0"
                    class="size-12 rounded-xl border border-slate-700 bg-slate-900 text-2xl font-bold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                    :aria-label="`Restar touchdown a ${team.name}`"
                    @click="removeTouchdown(team.id)"
                  >
                    −
                  </button>
                  <button
                    :disabled="currentMatch.status !== 'in-progress'"
                    class="min-h-12 flex-1 rounded-xl bg-emerald-400 px-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                    @click="addTouchdown(team.id)"
                  >
                    + TOUCHDOWN
                  </button>
                </div>
              </div>

              <div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-sm font-bold">Segundas oportunidades</p>
                    <p class="mt-1 text-xs text-slate-500">Disponibles</p>
                  </div>
                  <p class="text-3xl font-black tabular-nums">{{ team.rerollsAvailable }}</p>
                </div>

                <div class="mt-4 grid grid-cols-3 gap-2">
                  <button
                    :disabled="currentMatch.status !== 'in-progress' || team.rerollsAvailable === 0"
                    class="min-h-11 rounded-lg border border-slate-700 text-xl font-bold transition hover:bg-slate-800 disabled:opacity-30"
                    :aria-label="`Corregir segundas oportunidades de ${team.name}`"
                    @click="removeReroll(team.id)"
                  >
                    −
                  </button>
                  <button
                    :disabled="currentMatch.status !== 'in-progress' || team.rerollsAvailable === 0"
                    class="min-h-11 rounded-lg bg-amber-400 px-2 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-30"
                    @click="consumeReroll(team.id)"
                  >
                    USAR
                  </button>
                  <button
                    :disabled="currentMatch.status !== 'in-progress'"
                    class="min-h-11 rounded-lg border border-slate-700 text-xl font-bold transition hover:bg-slate-800 disabled:opacity-30"
                    :aria-label="`Añadir segunda oportunidad a ${team.name}`"
                    @click="addReroll(team.id)"
                  >
                    +
                  </button>
                </div>
                <p class="mt-2 text-center text-xs text-slate-500">
                  − / + corrige el contador; «Usar» consume una.
                </p>
              </div>

              <div class="mt-4 flex items-center justify-between text-sm">
                <span class="text-slate-400">Turnos</span>
                <span class="font-bold">{{ teamTurnLabel(team.turnsCompleted) }}</span>
              </div>
              <div class="mt-2 flex gap-1">
                <div
                  v-for="turn in maxTurns"
                  :key="turn"
                  class="h-1.5 flex-1 rounded-full"
                  :class="turn <= team.turnsCompleted ? 'bg-emerald-400' : 'bg-slate-800'"
                ></div>
              </div>
            </div>
          </article>
        </div>

        <div
          v-if="currentMatch.status === 'halftime-pending'"
          class="rounded-2xl border border-amber-400/50 bg-amber-400/10 p-5"
          role="status"
        >
          <h3 class="text-xl font-black text-amber-200">¡Descanso!</h3>
          <p class="mt-2 text-sm text-slate-300">
            Los dos equipos han completado sus turnos de la primera parte. Confirma para iniciar la
            segunda parte.
          </p>
          <button
            class="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-300"
            @click="startSecondHalf"
          >
            Comenzar segunda parte
          </button>
        </div>

        <div
          v-else-if="currentMatch.status === 'finished'"
          class="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5 text-center"
          role="status"
        >
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
            Partido finalizado
          </p>
          <p class="mt-2 text-3xl font-black">
            {{ currentMatch.teams.home.touchdowns }}
            <span class="text-slate-500">—</span>
            {{ currentMatch.teams.away.touchdowns }}
          </p>
          <p class="mt-2 text-slate-300">
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
            class="mt-4 rounded-xl bg-emerald-400 px-5 py-3 font-black text-slate-950 hover:bg-emerald-300"
            @click="newMatch"
          >
            Preparar otro partido
          </button>
        </div>

        <div v-else class="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <button
            class="w-full rounded-xl bg-emerald-400 px-5 py-4 text-lg font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 active:scale-[0.99]"
            @click="endTurn"
          >
            FINALIZAR TURNO
          </button>
          <p class="mt-3 text-center text-sm text-slate-400">
            El turno pasará al equipo que corresponda.
          </p>
        </div>

        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300"
        >
          {{ errorMessage }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-slate-500">
            Los cambios todavía se mantienen en memoria y se perderán al recargar.
          </p>
          <button
            :disabled="!session || session.history.length === 0"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            @click="undo"
          >
            ↶ Deshacer última acción
          </button>
        </div>
      </section>

      <p
        v-if="storageWarning"
        role="alert"
        class="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200"
      >
        {{ storageWarning }}
      </p>
    </main>

    <footer class="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-600">
      BB CHIEF · Blood Bowl 2020 · Hecho para jugar
    </footer>
  </div>
</template>
