<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchSession } from '../composables/useMatchSession'
import type { CreateMatchInput, TeamId } from '../domain/models/match'

const { t, te } = useI18n()
const { createAndOpenMatch, errorMessage: sessionError } = useMatchSession()

const races = [
  { value: 'Amazonas', key: 'amazons' },
  { value: 'Altos Elfos', key: 'highElves' },
  { value: 'Alianza del Viejo Mundo', key: 'oldWorldAlliance' },
  { value: 'Caos', key: 'chaos' },
  { value: 'Enanos', key: 'dwarfs' },
  { value: 'Elfos Oscuros', key: 'darkElves' },
  { value: 'Elfos Silvanos', key: 'woodElves' },
  { value: 'Elegidos del Caos', key: 'chaosChosen' },
  { value: 'Enanos del Caos', key: 'chaosDwarfs' },
  { value: 'Humanos', key: 'humans' },
  { value: 'Imperial Nobility', key: 'imperialNobility' },
  { value: 'Hombres Lagarto', key: 'lizardmen' },
  { value: 'Khorne', key: 'khorne' },
  { value: 'Muertos Vivientes', key: 'undead' },
  { value: 'Nórdicos', key: 'norse' },
  { value: 'Nurgle', key: 'nurgle' },
  { value: 'Ogro', key: 'ogre' },
  { value: 'Orcos', key: 'orcs' },
  { value: 'Pacto del Caos', key: 'chaosRenegades' },
  { value: 'Skaven', key: 'skaven' },
  { value: 'Snotlings', key: 'snotlings' },
  { value: 'Vampiros', key: 'vampires' },
  { value: 'Unión Élfica', key: 'elvenUnion' },
  { value: 'Inframundo', key: 'underworldDenizens' },
  { value: 'Otro', key: 'other' },
] as const

const matchType = ref<CreateMatchInput['matchType']>('exhibition')
const format = ref<CreateMatchInput['format']>('normal')
const currentStep = ref(1)

const homeName = ref('')
const homeRace = ref('Humanos')
const homeRerolls = ref(0)

const awayName = ref('')
const awayRace = ref('Orcos')
const awayRerolls = ref(0)

// null representa que ambos equipos tienen la misma valoración.
const advantageTeamId = ref<TeamId | null>(null)

const kickingTeamId = ref<TeamId | null>(null)

const errorMessage = ref('')
const isCreating = ref(false)

const totalSteps = 5

const currentStepLabel = computed(() => {
  const steps = [
    'matchSetup.steps.format',
    'matchSetup.steps.home',
    'matchSetup.steps.away',
    'matchSetup.steps.kickingTeam',
    'matchSetup.steps.summary',
  ]

  return t(steps[currentStep.value - 1] ?? 'matchSetup.steps.format')
})

const sessionErrorText = computed(() => {
  const code = sessionError.value

  if (!code) return ''

  return te(`errors.${code}`) ? t(`errors.${code}`) : t('errors.UNKNOWN_ERROR')
})

const homeDisplayName = computed(() => homeName.value.trim() || t('matchSetup.teams.home'))

const awayDisplayName = computed(() => awayName.value.trim() || t('matchSetup.teams.away'))

function raceLabel(race: string): string {
  const raceOption = races.find((option) => option.value === race)

  return raceOption ? t(`matchSetup.races.${raceOption.key}`) : race
}

// Letra corta del indicador de saque (P / R) para el equipo indicado.
function kickingBadgeShort(teamId: TeamId): string {
  return kickingTeamId.value === teamId
    ? t('matchSetup.kickingTeam.kicksFirstShort')
    : t('matchSetup.kickingTeam.receivesShort')
}

// Texto completo del indicador de saque, para lectores de pantalla y tooltip.
function kickingBadgeFull(teamId: TeamId): string {
  return kickingTeamId.value === teamId
    ? t('matchSetup.kickingTeam.kicksFirst')
    : t('matchSetup.kickingTeam.receives')
}

function validateRerolls(value: number, teamName: string): string | null {
  if (!Number.isInteger(value) || value < 0 || value > 20) {
    return t('matchSetup.validation.rerolls', { team: teamName })
  }

  return null
}

function validateHome(): boolean {
  if (!homeName.value.trim()) {
    errorMessage.value = t('matchSetup.validation.homeName')
    return false
  }

  const rerollsError = validateRerolls(homeRerolls.value, t('matchSetup.teams.home').toLowerCase())

  if (rerollsError) {
    errorMessage.value = rerollsError
    return false
  }

  return true
}

function validateAway(): boolean {
  if (!awayName.value.trim()) {
    errorMessage.value = t('matchSetup.validation.awayName')
    return false
  }

  const rerollsError = validateRerolls(awayRerolls.value, t('matchSetup.teams.away').toLowerCase())

  if (rerollsError) {
    errorMessage.value = rerollsError
    return false
  }

  return true
}

function selectAdvantageTeam(teamId: TeamId) {
  advantageTeamId.value = advantageTeamId.value === teamId ? null : teamId
}

function selectKickingTeam(teamId: TeamId) {
  kickingTeamId.value = teamId
}

function resolveKickingTeam() {
  if (kickingTeamId.value === null) {
    kickingTeamId.value = Math.random() < 0.5 ? 'home' : 'away'
    return
  }
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

    resolveKickingTeam()
    currentStep.value = 5
  }
}

function previousStep() {
  errorMessage.value = ''

  if (currentStep.value > 1 && !isCreating.value) {
    currentStep.value--
  }
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

  // Protección adicional por si se llega a este método sin pasar
  // previamente por la navegación normal del paso 4.
  resolveKickingTeam()

  if (kickingTeamId.value === null) {
    errorMessage.value = t('matchSetup.errors.create')
    currentStep.value = 4
    return
  }

  const input: CreateMatchInput = {
    matchType: matchType.value,
    format: format.value,
    advantageTeamId: advantageTeamId.value,
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
      errorMessage.value = sessionErrorText.value || t('matchSetup.errors.create')
    }
  } catch {
    errorMessage.value = t('matchSetup.errors.openScoreboard')
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-3 py-2 sm:px-6 sm:py-3">
    <header class="mb-3">
      <h1 class="mt-1 font-display text-2xl font-bold text-bb-text sm:text-3xl">
        {{ t('matchSetup.title') }}
      </h1>

      <p class="mt-1 text-xs text-bb-muted sm:text-sm">
        {{ t('matchSetup.subtitle') }}
      </p>
    </header>

    <section
      class="rounded-2xl border border-bb-border bg-bb-surface p-3 shadow-lg sm:p-5"
      aria-labelledby="step-title"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <span class="text-xs font-medium text-bb-muted sm:text-sm">
          {{ t('matchSetup.step', { current: currentStep, total: totalSteps }) }}
        </span>

        <span class="text-right text-xs font-semibold text-bb-blue sm:text-sm">
          {{ currentStepLabel }}
        </span>
      </div>

      <div
        class="mb-4 h-1 overflow-hidden rounded-full bg-bb-background"
        role="progressbar"
        :aria-label="t('matchSetup.progress')"
        :aria-valuenow="currentStep"
        :aria-valuemin="1"
        :aria-valuemax="totalSteps"
      >
        <div
          class="h-full rounded-full bg-bb-blue transition-all duration-300"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        />
      </div>

      <!-- Paso 1: tipo de partido y modalidad -->
      <template v-if="currentStep === 1">
        <div>
          <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
            {{ t('matchSetup.matchType.title') }}
          </h2>

          <div class="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
              :class="
                matchType === 'exhibition'
                  ? 'border-bb-blue bg-bb-blue-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-blue'
              "
              :aria-pressed="matchType === 'exhibition'"
              @click="matchType = 'exhibition'"
            >
              <span class="block font-display text-sm font-bold text-bb-text sm:text-base">
                {{ t('matchSetup.matchType.exhibition.title') }}
              </span>
            </button>

            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
              :class="
                matchType === 'league-tournament'
                  ? 'border-bb-blue bg-bb-blue-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-blue'
              "
              :aria-pressed="matchType === 'league-tournament'"
              @click="matchType = 'league-tournament'"
            >
              <span class="block font-display text-sm font-bold text-bb-text sm:text-base">
                {{ t('matchSetup.matchType.leagueTournament.title') }}
              </span>
            </button>
          </div>
        </div>

        <div class="mt-5 border-t border-bb-border pt-4">
          <h3 class="font-display text-xl font-bold text-bb-text sm:text-2xl">
            {{ t('matchSetup.format.title') }}
          </h3>

          <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
            {{ t('matchSetup.format.description') }}
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
              :class="
                format === 'normal'
                  ? 'border-bb-blue bg-bb-blue-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-blue'
              "
              :aria-pressed="format === 'normal'"
              @click="format = 'normal'"
            >
              <span class="mt-2 block font-display text-sm font-bold text-bb-text sm:text-base">
                {{ t('matchSetup.format.normal.title') }}
              </span>
              <span class="mt-1 block text-xs leading-5 text-bb-muted">
                {{ t('matchSetup.format.normal.description') }}
              </span>
            </button>

            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
              :class="
                format === 'sevens'
                  ? 'border-bb-blue bg-bb-blue-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-blue'
              "
              :aria-pressed="format === 'sevens'"
              @click="format = 'sevens'"
            >
              <span class="mt-2 block font-display text-sm font-bold text-bb-text sm:text-base">
                {{ t('matchSetup.format.sevens.title') }}
              </span>
              <span class="mt-1 block text-xs leading-5 text-bb-muted">
                {{ t('matchSetup.format.sevens.description') }}
              </span>
            </button>
          </div>
        </div>
      </template>

      <!-- Paso 2: equipo local -->
      <template v-else-if="currentStep === 2">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          {{ t('matchSetup.teams.home') }}
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          {{ t('matchSetup.teamDescription.home') }}
        </p>

        <div class="mt-4 space-y-3">
          <div>
            <label for="home-name" class="mb-1 block text-sm font-semibold text-bb-text">
              {{ t('matchSetup.teamName') }}
            </label>
            <input
              id="home-name"
              v-model="homeName"
              type="text"
              maxlength="40"
              autocomplete="off"
              :placeholder="t('matchSetup.placeholders.homeName')"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text placeholder:text-bb-muted focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            />
          </div>

          <div>
            <label for="home-race" class="mb-1 block text-sm font-semibold text-bb-text">
              {{ t('matchSetup.race') }}
            </label>
            <select
              id="home-race"
              v-model="homeRace"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            >
              <option v-for="race in races" :key="race.value" :value="race.value">
                {{ t(`matchSetup.races.${race.key}`) }}
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between gap-4">
              <label class="mb-1 block text-sm font-semibold text-bb-text">
                {{ t('matchSetup.rerolls') }}
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
              :aria-label="t('matchSetup.rerollsForTeam', { team: t('matchSetup.teams.home') })"
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
          {{ t('matchSetup.teams.away') }}
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          {{ t('matchSetup.teamDescription.away') }}
        </p>

        <div class="mt-4 space-y-3">
          <div>
            <label for="away-name" class="mb-1 block text-sm font-semibold text-bb-text">
              {{ t('matchSetup.teamName') }}
            </label>
            <input
              id="away-name"
              v-model="awayName"
              type="text"
              maxlength="40"
              autocomplete="off"
              :placeholder="t('matchSetup.placeholders.awayName')"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text placeholder:text-bb-muted focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            />
          </div>

          <div>
            <label for="away-race" class="mb-1 block text-sm font-semibold text-bb-text">
              {{ t('matchSetup.race') }}
            </label>
            <select
              id="away-race"
              v-model="awayRace"
              class="min-h-10 w-full rounded-lg border border-bb-border bg-bb-background px-3 py-2 text-sm text-bb-text focus:border-bb-blue focus:outline-none focus:ring-2 focus:ring-bb-blue/30"
            >
              <option v-for="race in races" :key="race.value" :value="race.value">
                {{ t(`matchSetup.races.${race.key}`) }}
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between gap-4">
              <label class="mb-1 block text-sm font-semibold text-bb-text">
                {{ t('matchSetup.rerolls') }}
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
              :aria-label="t('matchSetup.rerollsForTeam', { team: t('matchSetup.teams.away') })"
              class="w-full cursor-pointer accent-bb-red"
            />

            <div class="flex justify-between text-xs text-bb-muted">
              <span>0</span>
              <span>6</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Paso 4: ventaja de valoración y equipo pateador -->
      <template v-else-if="currentStep === 4">
        <div>
          <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
            {{ t('matchSetup.advantage.title') }}
          </h2>

          <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
            {{ t('matchSetup.advantage.description') }}
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
              :class="
                advantageTeamId === 'home'
                  ? 'border-bb-blue bg-bb-blue-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-blue'
              "
              :aria-pressed="advantageTeamId === 'home'"
              @click="selectAdvantageTeam('home')"
            >
              <span class="block text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.teams.home') }}
              </span>
              <span class="mt-1 block truncate text-sm font-bold text-bb-text">
                {{ homeDisplayName }}
              </span>
            </button>

            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-red sm:p-4"
              :class="
                advantageTeamId === 'away'
                  ? 'border-bb-red bg-bb-red-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-red'
              "
              :aria-pressed="advantageTeamId === 'away'"
              @click="selectAdvantageTeam('away')"
            >
              <span class="block text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.teams.away') }}
              </span>
              <span class="mt-1 block truncate text-sm font-bold text-bb-text">
                {{ awayDisplayName }}
              </span>
            </button>
          </div>
        </div>

        <div class="mt-5 border-t border-bb-border pt-4">
          <h3 class="font-display text-xl font-bold text-bb-text sm:text-2xl">
            {{ t('matchSetup.kickingTeam.title') }}
          </h3>

          <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
            {{ t('matchSetup.kickingTeam.description') }}
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue sm:p-4"
              :class="
                kickingTeamId === 'home'
                  ? 'border-bb-blue bg-bb-blue-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-blue'
              "
              :aria-pressed="kickingTeamId === 'home'"
              @click="selectKickingTeam('home')"
            >
              <span class="block text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.teams.home') }}
              </span>

              <!-- Nombre (truncado con «…») e indicador P/R en la misma línea -->
              <span class="mt-1 flex items-center justify-center gap-2">
                <span class="min-w-0 truncate text-sm font-bold text-bb-text">
                  {{ homeDisplayName }}
                </span>

                <span
                  v-show="kickingTeamId !== null"
                  class="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-bb-blue text-xs font-bold text-white"
                  :title="kickingBadgeFull('home')"
                >
                  <span aria-hidden="true">{{ kickingBadgeShort('home') }}</span>
                  <span class="sr-only">{{ kickingBadgeFull('home') }}</span>
                </span>
              </span>
            </button>

            <button
              type="button"
              class="min-w-0 rounded-xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-red sm:p-4"
              :class="
                kickingTeamId === 'away'
                  ? 'border-bb-red bg-bb-red-soft'
                  : 'border-bb-border bg-bb-background hover:border-bb-red'
              "
              :aria-pressed="kickingTeamId === 'away'"
              @click="selectKickingTeam('away')"
            >
              <span class="block text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.teams.away') }}
              </span>

              <!-- Nombre (truncado con «…») e indicador P/R en la misma línea -->
              <span class="mt-1 flex items-center justify-center gap-2">
                <span class="min-w-0 truncate text-sm font-bold text-bb-text">
                  {{ awayDisplayName }}
                </span>

                <span
                  v-show="kickingTeamId !== null"
                  class="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-bb-red text-xs font-bold text-white"
                  :title="kickingBadgeFull('away')"
                >
                  <span aria-hidden="true">{{ kickingBadgeShort('away') }}</span>
                  <span class="sr-only">{{ kickingBadgeFull('away') }}</span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </template>

      <!-- Paso 5: resumen y creación -->
      <template v-else>
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          {{ t('matchSetup.summary.title') }}
        </h2>

        <!-- Datos del partido -->
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span
            class="rounded-full border border-bb-border bg-bb-background px-2.5 py-1 text-xs font-semibold text-bb-text"
          >
            {{
              matchType === 'exhibition'
                ? t('matchSetup.matchType.exhibition.title')
                : t('matchSetup.matchType.leagueTournament.title')
            }}
          </span>

          <span
            class="rounded-full border border-bb-border bg-bb-background px-2.5 py-1 text-xs font-semibold text-bb-text"
          >
            {{
              format === 'normal'
                ? t('matchSetup.format.normal.title')
                : t('matchSetup.format.sevens.title')
            }}
          </span>
        </div>

        <!-- Equipos -->
        <div class="mt-2 flex flex-col">
          <!-- Equipo local -->
          <article class="min-w-0 rounded-xl border border-bb-blue bg-bb-blue-soft px-3 py-3">
            <div class="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3">
              <!-- Columna izquierda: equipo -->
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-bb-muted">
                  {{ t('matchSetup.teams.home') }}
                </p>

                <!-- Nombre (truncado con «…») e indicador P/R en la misma línea -->
                <p class="mt-1 flex items-center gap-1.5">
                  <span
                    class="min-w-0 truncate font-display text-[22px] font-bold leading-7 text-bb-blue"
                  >
                    {{ homeName.trim() }}
                  </span>

                  <span
                    class="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-bb-blue text-xs font-bold text-white"
                    :title="kickingBadgeFull('home')"
                  >
                    <span aria-hidden="true">{{ kickingBadgeShort('home') }}</span>
                    <span class="sr-only">{{ kickingBadgeFull('home') }}</span>
                  </span>
                </p>

                <p class="text-xs text-bb-muted">{{ raceLabel(homeRace) }}</p>

                <span
                  v-if="advantageTeamId === 'home'"
                  class="mt-2 inline-flex items-center gap-1 rounded-xl border border-bb-gold-border bg-bb-gold-pale px-2 py-1 text-left text-[11px] font-semibold leading-tight text-bb-gold-deep"
                >
                  <svg class="size-3 shrink-0" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M6 2l4 6H2z" fill="currentColor" />
                  </svg>
                  {{ t('matchSetup.summary.advantage') }}
                </span>
              </div>

              <!-- Columna derecha: segundas oportunidades -->
              <div
                class="flex flex-col items-center justify-center self-stretch border-l border-bb-blue/30 pl-3 text-center"
              >
                <p class="text-[11px] leading-tight text-bb-muted">{{ t('matchSetup.rerolls') }}</p>
                <p class="score-number mt-1 text-3xl text-bb-text">{{ homeRerolls }}</p>
              </div>
            </div>
          </article>

          <!-- Separador VS (decorativo), centrado sobre el hueco entre tarjetas -->
          <span
            class="relative z-10 -my-2 flex size-6 shrink-0 items-center justify-center self-center rounded-full bg-bb-text text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            VS
          </span>

          <!-- Equipo visitante -->
          <article class="min-w-0 rounded-xl border border-bb-red bg-bb-red-soft px-3 py-3">
            <div class="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3">
              <!-- Columna izquierda: equipo -->
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-bb-muted">
                  {{ t('matchSetup.teams.away') }}
                </p>

                <!-- Nombre (truncado con «…») e indicador P/R en la misma línea -->
                <p class="mt-1 flex items-center gap-1.5">
                  <span
                    class="min-w-0 truncate font-display text-[22px] font-bold leading-7 text-bb-red"
                  >
                    {{ awayName.trim() }}
                  </span>

                  <span
                    class="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-bb-red text-xs font-bold text-white"
                    :title="kickingBadgeFull('away')"
                  >
                    <span aria-hidden="true">{{ kickingBadgeShort('away') }}</span>
                    <span class="sr-only">{{ kickingBadgeFull('away') }}</span>
                  </span>
                </p>

                <p class="text-xs text-bb-muted">{{ raceLabel(awayRace) }}</p>

                <span
                  v-if="advantageTeamId === 'away'"
                  class="mt-2 inline-flex items-center gap-1 rounded-xl border border-bb-gold-border bg-bb-gold-pale px-2 py-1 text-left text-[11px] font-semibold leading-tight text-bb-gold-deep"
                >
                  <svg class="size-3 shrink-0" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M6 2l4 6H2z" fill="currentColor" />
                  </svg>
                  {{ t('matchSetup.summary.advantage') }}
                </span>
              </div>

              <!-- Columna derecha: segundas oportunidades -->
              <div
                class="flex flex-col items-center justify-center self-stretch border-l border-bb-red/30 pl-3 text-center"
              >
                <p class="text-[11px] leading-tight text-bb-muted">{{ t('matchSetup.rerolls') }}</p>
                <p class="score-number mt-1 text-3xl text-bb-text">{{ awayRerolls }}</p>
              </div>
            </div>
          </article>
        </div>
      </template>

      <p
        v-if="errorMessage || (currentStep === 5 && sessionErrorText)"
        class="mt-3 rounded-lg border border-bb-red/30 bg-bb-red-soft p-2 text-sm font-medium text-bb-red"
        role="alert"
      >
        {{ errorMessage || sessionErrorText }}
      </p>

      <footer class="mt-4 flex justify-between gap-3 border-t border-bb-border pt-3">
        <button
          type="button"
          class="min-h-11 rounded-lg border border-bb-border px-4 py-2 text-sm font-semibold text-bb-text transition hover:bg-bb-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentStep === 1 || isCreating"
          @click="previousStep"
        >
          {{ t('matchSetup.navigation.previous') }}
        </button>

        <button
          v-if="currentStep < totalSteps"
          type="button"
          class="min-h-11 rounded-lg bg-bb-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-bb-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue"
          @click="nextStep"
        >
          {{ t('matchSetup.navigation.next') }} →
        </button>

        <button
          v-else
          type="button"
          class="min-h-11 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-60"
          :disabled="isCreating"
          @click="createMatch"
        >
          {{
            isCreating ? t('matchSetup.navigation.creating') : t('matchSetup.navigation.startMatch')
          }}
        </button>
      </footer>
    </section>
  </main>
</template>
