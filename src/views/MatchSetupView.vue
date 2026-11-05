<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchSession } from '../composables/useMatchSession'
import type { CreateMatchInput, TeamId } from '../domain/models/match'

const { t, te } = useI18n()
const { createAndOpenMatch, errorMessage: sessionError } = useMatchSession()

// Se mantienen los valores originales para no modificar los datos
// que se guardan en el dominio. Solo cambia la etiqueta visible.
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

function raceLabel(race: string): string {
  const raceOption = races.find((option) => option.value === race)

  return raceOption ? t(`matchSetup.races.${raceOption.key}`) : race
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

      <!-- Paso 1: formato -->
      <template v-if="currentStep === 1">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          {{ t('matchSetup.format.title') }}
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          {{ t('matchSetup.format.description') }}
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
              {{ t('matchSetup.format.normal.title') }}
            </span>
            <span class="mt-1 block text-xs leading-5 text-bb-muted sm:text-sm">
              {{ t('matchSetup.format.normal.description') }}
            </span>
            <span
              v-if="format === 'normal'"
              class="mt-2 block text-xs font-semibold text-bb-blue sm:text-sm"
            >
              {{ t('matchSetup.selected') }}
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
            <span class="mt-2 block font-display text-base font-bold text-bb-text">
              {{ t('matchSetup.format.sevens.title') }}
            </span>
            <span class="mt-1 block text-xs leading-5 text-bb-muted sm:text-sm">
              {{ t('matchSetup.format.sevens.description') }}
            </span>
            <span
              v-if="format === 'sevens'"
              class="mt-2 block text-xs font-semibold text-bb-blue sm:text-sm"
            >
              {{ t('matchSetup.selected') }}
            </span>
          </button>
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

      <!-- Paso 4: selección del equipo pateador -->
      <template v-else-if="currentStep === 4">
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          {{ t('matchSetup.kickingTeam.title') }}
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          {{ t('matchSetup.kickingTeam.description') }}
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
              {{ t('matchSetup.teams.home') }}
            </span>
            <span class="mt-1 block text-base font-bold text-bb-text">
              {{ homeName.trim() || t('matchSetup.teams.home') }}
            </span>
            <span class="block text-xs text-bb-muted sm:text-sm">
              {{ raceLabel(homeRace) }}
            </span>
            <span
              v-if="kickingTeamId === 'home'"
              class="mt-2 inline-block rounded-full bg-bb-blue px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              {{ t('matchSetup.kickingTeam.kicksFirst') }}
            </span>
            <span
              v-else
              class="mt-2 inline-block rounded-full bg-bb-blue px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              {{ t('matchSetup.kickingTeam.receives') }}
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
              {{ t('matchSetup.teams.away') }}
            </span>
            <span class="mt-1 block text-base font-bold text-bb-text">
              {{ awayName.trim() || t('matchSetup.teams.away') }}
            </span>
            <span class="block text-xs text-bb-muted sm:text-sm">
              {{ raceLabel(awayRace) }}
            </span>
            <span
              v-if="kickingTeamId === 'away'"
              class="mt-2 inline-block rounded-full bg-bb-red px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              {{ t('matchSetup.kickingTeam.kicksFirst') }}
            </span>
            <span
              v-else
              class="mt-2 inline-block rounded-full bg-bb-red px-3 py-1 text-xs font-semibold text-white sm:text-sm"
            >
              {{ t('matchSetup.kickingTeam.receives') }}
            </span>
          </button>

          <button
            type="button"
            class="min-h-10 w-full rounded-lg border border-bb-border px-3 py-2 text-sm font-semibold text-bb-text transition hover:bg-bb-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-blue"
            @click="chooseRandomKickingTeam"
          >
            🎲 {{ t('matchSetup.kickingTeam.random') }}
          </button>
        </div>

        <p class="mt-3 text-xs text-bb-muted sm:text-sm">
          {{ t('matchSetup.kickingTeam.currentSelection') }}
          <strong class="text-bb-text">
            {{
              kickingTeamId === 'home'
                ? homeName.trim() || t('matchSetup.teams.home')
                : awayName.trim() || t('matchSetup.teams.away')
            }}
          </strong>
        </p>
      </template>

      <!-- Paso 5: resumen y creación -->
      <template v-else>
        <h2 id="step-title" class="font-display text-xl font-bold text-bb-text sm:text-2xl">
          {{ t('matchSetup.summary.title') }}
        </h2>

        <p class="mt-1 text-xs leading-5 text-bb-muted sm:text-sm">
          {{ t('matchSetup.summary.description') }}
        </p>

        <div class="mt-4 rounded-xl border border-bb-border bg-bb-background p-3 sm:p-4">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-bb-muted">{{ t('matchSetup.summary.format') }}</dt>
              <dd class="font-semibold text-bb-text">
                {{
                  format === 'normal'
                    ? t('matchSetup.format.normal.title')
                    : t('matchSetup.format.sevens.title')
                }}
              </dd>
            </div>

            <div class="border-t border-bb-border pt-3">
              <dt class="text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.teams.home') }}
              </dt>
              <dd class="mt-1 font-display text-base font-bold text-bb-blue">
                {{ homeName.trim() }}
              </dd>
              <dd class="text-xs text-bb-muted sm:text-sm">{{ raceLabel(homeRace) }}</dd>
              <dd class="mt-1 text-sm text-bb-text">
                {{ t('matchSetup.summary.rerolls', { count: homeRerolls }) }}
              </dd>
            </div>

            <div class="border-t border-bb-border pt-3">
              <dt class="text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.teams.away') }}
              </dt>
              <dd class="mt-1 font-display text-base font-bold text-bb-red">
                {{ awayName.trim() }}
              </dd>
              <dd class="text-xs text-bb-muted sm:text-sm">{{ raceLabel(awayRace) }}</dd>
              <dd class="mt-1 text-sm text-bb-text">
                {{ t('matchSetup.summary.rerolls', { count: awayRerolls }) }}
              </dd>
            </div>

            <div class="border-t border-bb-border pt-3">
              <dt class="text-xs font-semibold uppercase tracking-wide text-bb-muted">
                {{ t('matchSetup.summary.kickingTeam') }}
              </dt>
              <dd class="mt-1 font-semibold text-bb-text">
                {{ kickingTeamId === 'home' ? homeName.trim() : awayName.trim() }}
              </dd>
              <dd class="text-xs text-bb-muted sm:text-sm">
                {{ raceLabel(kickingTeamId === 'home' ? homeRace : awayRace) }}
              </dd>
            </div>
          </dl>
        </div>

        <p class="mt-3 text-xs leading-5 text-bb-muted sm:text-sm">
          {{ t('matchSetup.summary.editHint') }}
        </p>
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
