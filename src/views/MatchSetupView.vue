<script setup lang="ts">
import { ref } from 'vue'
import { useMatchSession } from '../composables/useMatchSession'
import type { CreateMatchInput, TeamId } from '../domain/models/match'

const { createAndOpenMatch, errorMessage: sessionError } = useMatchSession()

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

const format = ref<CreateMatchInput['format']>('normal')
const currentStep = ref(1)

const homeName = ref('')
const homeRace = ref('Humanos')
const homeRerolls = ref(0)

const awayName = ref('')
const awayRace = ref('Orcos')
const awayRerolls = ref(0)

const kickingTeamId = ref<TeamId>('home')
const errorMessage = ref('')
const isCreating = ref(false)

const totalSteps = 5

function validateRerolls(value: number, teamName: string): string | null {
  if (!Number.isInteger(value) || value < 0 || value > 20) {
    return `Las segundas oportunidades del ${teamName} deben ser un número entero entre 0 y 20.`
  }

  return null
}

function validateHome(): boolean {
  if (!homeName.value.trim()) {
    errorMessage.value = 'Introduce el nombre del equipo local.'
    return false
  }

  const rerollsError = validateRerolls(homeRerolls.value, 'equipo local')

  if (rerollsError) {
    errorMessage.value = rerollsError
    return false
  }

  return true
}

function validateAway(): boolean {
  if (!awayName.value.trim()) {
    errorMessage.value = 'Introduce el nombre del equipo visitante.'
    return false
  }

  const rerollsError = validateRerolls(awayRerolls.value, 'equipo visitante')

  if (rerollsError) {
    errorMessage.value = rerollsError
    return false
  }

  return true
}

function nextStep() {
  errorMessage.value = ''

  if (currentStep.value === 1) {
    currentStep.value = 2
    return
  }

  if (currentStep.value === 2) {
    if (!validateHome()) return

    currentStep.value = 3
    return
  }

  if (currentStep.value === 3) {
    if (!validateAway()) return

    currentStep.value = 4
    return
  }

  if (currentStep.value === 4) {
    if (!validateHome() || !validateAway()) return

    currentStep.value = 5
  }
}

function previousStep() {
  errorMessage.value = ''

  if (currentStep.value > 1 && !isCreating.value) {
    currentStep.value--
  }
}

function chooseRandomKickingTeam() {
  kickingTeamId.value = Math.random() < 0.5 ? 'home' : 'away'
}

async function createMatch() {
  errorMessage.value = ''

  if (!validateHome()) {
    currentStep.value = 2
    return
  }

  if (!validateAway()) {
    currentStep.value = 3
    return
  }

  const input: CreateMatchInput = {
    format: format.value,
    kickingTeamId: kickingTeamId.value,
    home: {
      name: homeName.value.trim(),
      race: homeRace.value,
      rerolls: homeRerolls.value,
    },
    away: {
      name: awayName.value.trim(),
      race: awayRace.value,
      rerolls: awayRerolls.value,
    },
  }

  isCreating.value = true

  try {
    const created = await createAndOpenMatch(input)

    if (!created) {
      errorMessage.value = sessionError.value || 'No se pudo crear la partida.'
    }
  } catch {
    errorMessage.value =
      'No se pudo abrir el marcador. Comprueba la navegación e inténtalo de nuevo.'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-3 py-2 sm:px-6 sm:py-3">
    <header class="mb-3">
      <h1 class="mt-1 font-display text-2xl font-bold text-bb-text sm:text-3xl">
        Preparación del partido
      </h1>

      <p class="mt-1 text-xs text-bb-muted sm:text-sm">
        Configura el encuentro antes de saltar al terreno de juego.
      </p>
    </header>

    <section
      class="rounded-2xl border border-bb-border bg-bb-surface p-3 shadow-lg sm:p-5"
      aria-labelledby="step-title"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <span class="text-xs font-medium text-bb-muted sm:text-sm">
          Paso {{ currentStep }} de {{ totalSteps }}
        </span>

        <span class="text-right text-xs font-semibold text-bb-blue sm:text-sm">
          {{
            currentStep === 1
              ? 'Formato'
              : currentStep === 2
                ? 'Equipo local'
                : currentStep === 3
                  ? 'Equipo visitante'
                  : currentStep === 4
                    ? 'Equipo pateador'
                    : 'Resumen'
          }}
        </span>
      </div>

      <div
        class="mb-4 h-1 overflow-hidden rounded-full bg-bb-background"
        role="progressbar"
        aria-label="Progreso de la configuración"
        :aria-valuenow="currentStep"
        :aria-valuemin="1"
        :aria-valuemax="totalSteps"
      >
        <div
          class="h-full rounded-full bg-bb-blue transition-all duration-300"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        />
      </div>

      <!-- Paso 1: formato -->
      <template v-if="currentStep === 1">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          ¿Qué modalidad vais a jugar?
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          Selecciona el formato del encuentro.
        </p>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
            :class="
              format === 'normal'
                ? 'border-bb-blue bg-bb-blue-soft'
                : 'border-bb-border bg-bb-background hover:border-bb-blue'
            "
            :aria-pressed="format === 'normal'"
            @click="format = 'normal'"
          >
            <span class="text-xl" aria-hidden="true">🏈</span>
            <span class="mt-2 block font-display text-base font-bold text-bb-text">
              Partido normal
            </span>
            <span class="mt-1 block text-xs leading-5 text-bb-muted sm:text-sm">
              El formato estándar de Blood Bowl.
            </span>
            <span
              v-if="format === 'normal'"
              class="mt-2 block text-xs font-semibold text-bb-blue sm:text-sm"
            >
              Seleccionado
            </span>
          </button>

          <button
            type="button"
            class="rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
            :class="
              format === 'sevens'
                ? 'border-bb-blue bg-bb-blue-soft'
                : 'border-bb-border bg-bb-background hover:border-bb-blue'
            "
            :aria-pressed="format === 'sevens'"
            @click="format = 'sevens'"
          >
            <span class="text-xl" aria-hidden="true">⚡</span>
            <span class="mt-2 block font-display text-base font-bold text-bb-text"> Sevens </span>
            <span class="mt-1 block text-xs leading-5 text-bb-muted sm:text-sm">
              La variante rápida de siete jugadores.
            </span>
            <span
              v-if="format === 'sevens'"
              class="mt-2 block text-xs font-semibold text-bb-blue sm:text-sm"
            >
              Seleccionado
            </span>
          </button>
        </div>
      </template>

      <!-- Paso 2: equipo local -->
      <template v-else-if="currentStep === 2">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          Equipo local
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          Introduce los datos del primer equipo.
        </p>

        <div class="mt-4 space-y-3">
          <div>
            <label for="home-name" class="mb-1 block text-sm font-semibold text-bb-text">
              Nombre del equipo
            </label>
            <input
              id="home-name"
              v-model="homeName"
              type="text"
              maxlength="40"
              autocomplete="off"
              placeholder="Ej. Reikland Reavers"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text placeholder:text-bb-muted focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            />
          </div>

          <div>
            <label for="home-race" class="mb-1 block text-sm font-semibold text-bb-text">
              Raza
            </label>
            <select
              id="home-race"
              v-model="homeRace"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            >
              <option v-for="race in races" :key="race" :value="race">
                {{ race }}
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between gap-4">
              <label class="mb-1 block text-sm font-semibold text-bb-text">
                Segundas oportunidades
              </label>

              <output
                class="min-w-10 rounded-lg border border-bb-blue/30 bg-bb-blue-soft px-3 py-1 text-center text-lg font-bold tabular-nums text-bb-blue"
              >
                {{ homeRerolls }}
              </output>
            </div>

            <input
              v-model.number="homeRerolls"
              type="range"
              min="0"
              max="6"
              step="1"
              aria-label="Segundas oportunidades del equipo local"
              class="w-full cursor-pointer accent-bb-blue"
            />

            <div class="flex justify-between text-xs text-bb-muted">
              <span>0</span>
              <span>6</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Paso 3: equipo visitante -->
      <template v-else-if="currentStep === 3">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          Equipo visitante
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          Introduce los datos del segundo equipo.
        </p>

        <div class="mt-4 space-y-3">
          <div>
            <label for="away-name" class="mb-1 block text-sm font-semibold text-bb-text">
              Nombre del equipo
            </label>
            <input
              id="away-name"
              v-model="awayName"
              type="text"
              maxlength="40"
              autocomplete="off"
              placeholder="Ej. Gouged Eye"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text placeholder:text-bb-muted focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            />
          </div>

          <div>
            <label for="away-race" class="mb-1 block text-sm font-semibold text-bb-text">
              Raza
            </label>
            <select
              id="away-race"
              v-model="awayRace"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            >
              <option v-for="race in races" :key="race" :value="race">
                {{ race }}
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between gap-4">
              <label class="mb-1 block text-sm font-semibold text-bb-text">
                Segundas oportunidades
              </label>

              <output
                class="min-w-10 rounded-lg border border-bb-red/30 bg-bb-red-soft px-3 py-1 text-center text-lg font-bold tabular-nums text-bb-red"
              >
                {{ awayRerolls }}
              </output>
            </div>

            <input
              v-model.number="awayRerolls"
              type="range"
              min="0"
              max="6"
              step="1"
              aria-label="Segundas oportunidades del equipo visitante"
              class="w-full cursor-pointer accent-bb-red"
            />

            <div class="flex justify-between text-xs text-bb-muted">
              <span>0</span>
              <span>6</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Paso 4: selección del equipo pateador -->
      <template v-else-if="currentStep === 4">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          ¿Quién patea primero?
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          Selecciona el equipo que realiza la patada inicial. Podéis elegirlo manualmente o al azar.
        </p>

        <div class="mt-4 space-y-2">
          <button
            type="button"
            class="w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
            :class="
              kickingTeamId === 'home'
                ? 'border-bb-blue bg-bb-blue-soft'
                : 'border-bb-border bg-bb-background hover:border-bb-blue'
            "
            :aria-pressed="kickingTeamId === 'home'"
            @click="kickingTeamId = 'home'"
          >
            <span class="block text-xs font-semibold uppercase tracking-wide text-bb-muted">
              Equipo local
            </span>
            <span class="mt-1 block text-base font-bold text-bb-text">
              {{ homeName.trim() || 'Equipo local' }}
            </span>
            <span class="block text-xs text-bb-muted sm:text-sm">
              {{ homeRace }}
            </span>
            <span
              v-if="kickingTeamId === 'home'"
              class="mt-2 inline-block rounded-full bg-bb-blue px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              Patea primero
            </span>
            <span
              v-else
              class="mt-2 inline-block rounded-full bg-bb-blue px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              Receptor
            </span>
          </button>

          <button
            type="button"
            class="w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-red sm:p-4"
            :class="
              kickingTeamId === 'away'
                ? 'border-bb-red bg-bb-red-soft'
                : 'border-bb-border bg-bb-background hover:border-bb-red'
            "
            :aria-pressed="kickingTeamId === 'away'"
            @click="kickingTeamId = 'away'"
          >
            <span class="block text-xs font-semibold uppercase tracking-wide text-bb-muted">
              Equipo visitante
            </span>
            <span class="mt-1 block text-base font-bold text-bb-text">
              {{ awayName.trim() || 'Equipo visitante' }}
            </span>
            <span class="block text-xs text-bb-muted sm:text-sm">
              {{ awayRace }}
            </span>
            <span
              v-if="kickingTeamId === 'away'"
              class="mt-2 inline-block rounded-full bg-bb-red px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              Patea primero
            </span>
            <span
              v-else
              class="mt-2 inline-block rounded-full bg-bb-red px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              Receptor
            </span>
          </button>

          <button
            type="button"
            class="min-h-10 w-full rounded-lg border border-bb-border px-3 py-2 text-sm font-semibold text-bb-text transition hover:bg-bb-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue"
            @click="chooseRandomKickingTeam"
          >
            🎲 Elegir equipo pateador al azar
          </button>
        </div>

        <p class="mt-3 text-xs text-bb-muted sm:text-sm">
          Selección actual:
          <strong class="text-bb-text">
            {{
              kickingTeamId === 'home'
                ? homeName.trim() || 'Equipo local'
                : awayName.trim() || 'Equipo visitante'
            }}
          </strong>
        </p>
      </template>

      <!-- Paso 5: resumen y creación -->
      <template v-else>
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          Resumen del partido
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          Revisa la configuración antes de comenzar el partido.
        </p>

        <div class="mt-4 rounded-xl border border-bb-border bg-bb-background p-3 sm:p-4">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-bb-muted">Formato</dt>
              <dd class="font-semibold text-bb-text">
                {{ format === 'normal' ? 'Partido normal' : 'Sevens' }}
              </dd>
            </div>

            <div class="border-t border-bb-border pt-3">
              <dt class="text-xs font-semibold uppercase tracking-wide text-bb-muted">
                Equipo local
              </dt>
              <dd class="mt-1 font-display text-base font-bold text-bb-blue">
                {{ homeName.trim() }}
              </dd>
              <dd class="text-xs text-bb-muted sm:text-sm">{{ homeRace }}</dd>
              <dd class="mt-1 text-sm text-bb-text">{{ homeRerolls }} segundas oportunidades</dd>
            </div>

            <div class="border-t border-bb-border pt-3">
              <dt class="text-xs font-semibold uppercase tracking-wide text-bb-muted">
                Equipo visitante
              </dt>
              <dd class="mt-1 font-display text-base font-bold text-bb-red">
                {{ awayName.trim() }}
              </dd>
              <dd class="text-xs text-bb-muted sm:text-sm">{{ awayRace }}</dd>
              <dd class="mt-1 text-sm text-bb-text">{{ awayRerolls }} segundas oportunidades</dd>
            </div>

            <div class="border-t border-bb-border pt-3">
              <dt class="text-xs font-semibold uppercase tracking-wide text-bb-muted">
                Equipo que patea primero
              </dt>
              <dd class="mt-1 font-semibold text-bb-text">
                {{ kickingTeamId === 'home' ? homeName.trim() : awayName.trim() }}
              </dd>
              <dd class="text-xs text-bb-muted sm:text-sm">
                {{ kickingTeamId === 'home' ? homeRace : awayRace }}
              </dd>
            </div>
          </dl>
        </div>

        <p class="mt-3 text-xs leading-5 text-bb-muted sm:text-sm">
          Si necesitas corregir algún dato, pulsa «Anterior» para volver al paso correspondiente.
        </p>
      </template>

      <p
        v-if="errorMessage || (currentStep === 5 && sessionError)"
        class="mt-3 rounded-lg border border-bb-red/30 bg-bb-red-soft p-2 text-sm font-medium text-bb-red"
        role="alert"
      >
        {{ errorMessage || sessionError }}
      </p>

      <footer class="mt-4 flex justify-between gap-3 border-t border-bb-border pt-3">
        <button
          type="button"
          class="min-h-11 rounded-lg border border-bb-border px-4 py-2 text-sm font-semibold text-bb-text transition hover:bg-bb-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentStep === 1 || isCreating"
          @click="previousStep"
        >
          Anterior
        </button>

        <button
          v-if="currentStep < totalSteps"
          type="button"
          class="min-h-11 rounded-lg bg-bb-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-bb-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue"
          @click="nextStep"
        >
          Siguiente →
        </button>

        <button
          v-else
          type="button"
          class="min-h-11 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-60"
          :disabled="isCreating"
          @click="createMatch"
        >
          {{ isCreating ? 'Comenzar partido…' : 'Comenzar partido' }}
        </button>
      </footer>
    </section>
  </main>
</template>
