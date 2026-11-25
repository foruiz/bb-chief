import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { CreateMatchInput, MatchSession, TeamId } from '../domain/models/match'
import { createMatch } from '../domain/services/create-match'
import { getTurnsPerHalf } from '../domain/rules/match-rules'
import {
  confirmHalftime,
  createSession,
  finishTurn,
  recordTouchdown,
  undoLastAction,
  useReroll,
} from '../domain/services/match-actions'
import { clearSavedSession, loadSession, saveSession } from '../persistence/match-storage'

export type StorageWarning = 'saveError' | 'readError' | 'unavailable' | 'deleteError' | null

// Estado compartido: se crea una sola vez para toda la aplicación.
const session = ref<MatchSession | null>(null)
const showNewMatchConfirmation = ref(false)
const errorMessage = ref('')
const storageWarning = ref<StorageWarning>(null)

let initialized = false

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

function initializeSession() {
  if (initialized) return

  initialized = true

  // La partida guardada se carga directamente: la aplicación irá al menú,
  // donde aparece la opción Continuar partida.
  try {
    const result = loadSession()

    if (result.status === 'valid') {
      session.value = result.session
    } else if (result.status === 'invalid') {
      storageWarning.value = 'readError'
    } else if (result.status === 'unavailable') {
      storageWarning.value = 'unavailable'
    }
  } catch {
    storageWarning.value = 'unavailable'
  }

  // El watcher se registra después de cargar, para no volver a guardar
  // lo que se acaba de leer.
  watch(
    session,
    (current) => {
      if (!current) return

      try {
        saveSession(current)
        storageWarning.value = null
      } catch {
        storageWarning.value = 'saveError'
      }
    },
    { deep: true },
  )
}

function startMatch(input: CreateMatchInput) {
  errorMessage.value = ''

  try {
    session.value = createSession(createMatch(input))
    return true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la partida'
    return false
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

function beginNewMatch() {
  try {
    clearSavedSession()
  } catch {
    storageWarning.value = 'deleteError'
    return false
  }

  session.value = null
  showNewMatchConfirmation.value = false
  storageWarning.value = null
  errorMessage.value = ''

  return true
}

// Comenzar una partida nueva pide confirmación si la actual no ha terminado.
function newMatch() {
  if (session.value && session.value.current.status !== 'finished') {
    showNewMatchConfirmation.value = true
    return false
  }

  return beginNewMatch()
}

function cancelNewMatch() {
  showNewMatchConfirmation.value = false
}

function confirmNewMatch() {
  return beginNewMatch()
}

export function useMatchSession() {
  const router = useRouter()

  async function createAndOpenMatch(input: CreateMatchInput) {
    if (!startMatch(input)) return false

    await router.push('/match')
    return true
  }

  async function prepareNewMatch() {
    if (newMatch()) {
      await router.push('/setup')
    }
  }

  async function cancelAndOpenMatch() {
    cancelNewMatch()
    await router.push('/match')
  }

  async function confirmAndPrepareNewMatch() {
    if (confirmNewMatch()) {
      await router.push('/setup')
    }
  }

  return {
    session,
    currentMatch,
    maxTurns,
    teams,
    activeTeam,
    showNewMatchConfirmation,
    errorMessage,
    storageWarning,
    initializeSession,
    createAndOpenMatch,
    addTouchdown,
    consumeReroll,
    endTurn,
    startSecondHalf,
    undo,
    prepareNewMatch,
    cancelNewMatch,
    cancelAndOpenMatch,
    confirmAndPrepareNewMatch,
  }
}
