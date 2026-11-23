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
const pendingSession = ref<MatchSession | null>(null)
const recoveryPending = ref(false)
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

  // El watcher se registra una sola vez y no guarda antes de recuperar
  // una posible sesión anterior.
  watch(
    session,
    (current) => {
      if (!current || recoveryPending.value) return

      try {
        saveSession(current)
        storageWarning.value = null
      } catch {
        storageWarning.value = 'saveError'
      }
    },
    { deep: true },
  )

  try {
    const result = loadSession()

    if (result.status === 'valid') {
      pendingSession.value = result.session
      recoveryPending.value = true
    } else if (result.status === 'invalid') {
      storageWarning.value = 'readError'
    } else if (result.status === 'unavailable') {
      storageWarning.value = 'unavailable'
    }
  } catch {
    storageWarning.value = 'unavailable'
  }
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
  pendingSession.value = null
  recoveryPending.value = false
  showNewMatchConfirmation.value = false
  storageWarning.value = null
  errorMessage.value = ''

  return true
}

function newMatch() {
  const matchToReplace = session.value ?? pendingSession.value

  if (matchToReplace && matchToReplace.current.status !== 'finished') {
    recoveryPending.value = false
    showNewMatchConfirmation.value = true
    return false
  }

  return beginNewMatch()
}

function cancelNewMatch() {
  showNewMatchConfirmation.value = false

  if (pendingSession.value) {
    recoveryPending.value = true
  }
}

function confirmNewMatch() {
  return beginNewMatch()
}

function continueSavedMatch() {
  if (!pendingSession.value) return false

  session.value = pendingSession.value
  pendingSession.value = null
  recoveryPending.value = false
  errorMessage.value = ''

  return true
}

export function useMatchSession() {
  const router = useRouter()

  async function createAndOpenMatch(input: CreateMatchInput) {
    if (!startMatch(input)) return false

    await router.push('/match')
    return true
  }

  async function prepareNewMatch() {
    const shouldNavigate = newMatch()

    if (shouldNavigate) {
      await router.push('/setup')
    }
  }

  async function discardSavedAndPrepareNewMatch() {
    if (beginNewMatch()) {
      await router.push('/setup')
    }
  }

  async function confirmAndPrepareNewMatch() {
    if (confirmNewMatch()) {
      await router.push('/setup')
    }
  }

  async function continueAndOpenMatch() {
    if (continueSavedMatch()) {
      await router.push('/match')
    }
  }

  return {
    session,
    currentMatch,
    maxTurns,
    teams,
    activeTeam,
    pendingSession,
    recoveryPending,
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
    discardSavedAndPrepareNewMatch,
    cancelNewMatch,
    confirmAndPrepareNewMatch,
    continueAndOpenMatch,
  }
}
