import type { MatchSession, MatchState, Team, TeamId } from '../domain/models/match'

const STORAGE_KEY = 'bb-chief.match-session'
const STORAGE_VERSION = 1

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type LoadSessionResult =
  { status: 'empty' } | { status: 'valid'; session: MatchSession } | { status: 'invalid' }

interface StoredSession {
  version: number
  session: MatchSession
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isTeam(value: unknown, expectedId: TeamId): value is Team {
  if (!isRecord(value)) return false

  return (
    value.id === expectedId &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.race === 'string' &&
    value.race.trim().length > 0 &&
    isNonNegativeInteger(value.touchdowns) &&
    isNonNegativeInteger(value.rerollsAvailable) &&
    isNonNegativeInteger(value.turnsCompleted)
  )
}

function isMatchState(value: unknown): value is MatchState {
  if (!isRecord(value) || !isRecord(value.teams)) return false

  return (
    (value.format === 'normal' || value.format === 'sevens') &&
    (value.half === 1 || value.half === 2) &&
    (value.status === 'in-progress' ||
      value.status === 'halftime-pending' ||
      value.status === 'finished') &&
    (value.kickingTeamId === 'home' || value.kickingTeamId === 'away') &&
    (value.activeTeamId === 'home' || value.activeTeamId === 'away') &&
    isTeam(value.teams.home, 'home') &&
    isTeam(value.teams.away, 'away')
  )
}

function isMatchSession(value: unknown): value is MatchSession {
  if (!isRecord(value)) return false

  return (
    isMatchState(value.current) &&
    Array.isArray(value.history) &&
    value.history.length <= 100 &&
    value.history.every(isMatchState)
  )
}

export function saveSession(session: MatchSession, storage: StorageLike = localStorage): void {
  const data: StoredSession = {
    version: STORAGE_VERSION,
    session,
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadSession(storage: StorageLike = localStorage): LoadSessionResult {
  let raw: string | null

  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'invalid' }
  }

  if (raw === null) return { status: 'empty' }

  try {
    const data: unknown = JSON.parse(raw)

    if (!isRecord(data) || data.version !== STORAGE_VERSION || !isMatchSession(data.session)) {
      return { status: 'invalid' }
    }

    return { status: 'valid', session: data.session }
  } catch {
    return { status: 'invalid' }
  }
}

export function clearSavedSession(storage: StorageLike = localStorage): void {
  storage.removeItem(STORAGE_KEY)
}
