import type { MatchSession, MatchState, TeamId, Team } from '../models/match'
import { getTurnsPerHalf } from '../rules/match-rules'
import { DomainError } from '../errors/domain-error'

const MAX_HISTORY = 100

export function createSession(match: MatchState): MatchSession {
  return {
    current: match,
    history: [],
  }
}

function saveState(session: MatchSession, next: MatchState): MatchSession {
  return {
    current: next,
    history: [...session.history, session.current].slice(-MAX_HISTORY),
  }
}

function requireActiveMatch(match: MatchState): void {
  if (match.status !== 'in-progress') {
    throw new DomainError('MATCH_NOT_ACTIVE')
  }
}

function getTeam(match: MatchState, teamId: TeamId): Team {
  return match.teams[teamId]
}

function updateTeam(match: MatchState, teamId: TeamId, changes: Partial<Team>): MatchState {
  return {
    ...match,
    teams: {
      ...match.teams,
      [teamId]: {
        ...match.teams[teamId],
        ...changes,
      },
    },
  }
}

function completeActiveTurn(match: MatchState): MatchState {
  const maxTurns = getTurnsPerHalf(match.format)
  const activeId = match.activeTeamId
  const otherId: TeamId = activeId === 'home' ? 'away' : 'home'
  const activeTeam = getTeam(match, activeId)

  if (activeTeam.turnsCompleted >= maxTurns) {
    throw new DomainError('TEAM_TURNS_COMPLETED')
  }

  const updated = updateTeam(match, activeId, {
    turnsCompleted: activeTeam.turnsCompleted + 1,
  })

  const homeDone = updated.teams.home.turnsCompleted >= maxTurns
  const awayDone = updated.teams.away.turnsCompleted >= maxTurns

  if (homeDone && awayDone) {
    return {
      ...updated,
      status: match.half === 1 ? 'halftime-pending' : 'finished',
    }
  }

  const otherHasTurns = updated.teams[otherId].turnsCompleted < maxTurns
  const activeHasTurns = updated.teams[activeId].turnsCompleted < maxTurns

  const nextActiveId: TeamId = otherHasTurns ? otherId : activeHasTurns ? activeId : otherId

  return {
    ...updated,
    activeTeamId: nextActiveId,
  }
}

function requireNonNegativeInteger(
  value: number,
  errorCode: 'INVALID_TOUCHDOWNS' | 'INVALID_REROLLS',
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new DomainError(errorCode)
  }
}

export function recordTouchdown(session: MatchSession, teamId: TeamId): MatchSession {
  const match = session.current
  requireActiveMatch(match)

  if (match.activeTeamId !== teamId) {
    throw new DomainError('TOUCHDOWN_NOT_ACTIVE_TEAM')
  }

  const team = getTeam(match, teamId)

  const scored = updateTeam(match, teamId, {
    touchdowns: team.touchdowns + 1,
  })

  return saveState(session, completeActiveTurn(scored))
}

export function correctTouchdowns(
  session: MatchSession,
  teamId: TeamId,
  touchdowns: number,
): MatchSession {
  requireActiveMatch(session.current)
  requireNonNegativeInteger(touchdowns, 'INVALID_TOUCHDOWNS')

  if (getTeam(session.current, teamId).touchdowns === touchdowns) {
    return session
  }

  return saveState(session, updateTeam(session.current, teamId, { touchdowns }))
}

export function useReroll(session: MatchSession, teamId: TeamId): MatchSession {
  requireActiveMatch(session.current)

  const team = getTeam(session.current, teamId)

  if (team.rerollsAvailable <= 0) {
    throw new DomainError('NO_REROLLS_AVAILABLE')
  }

  return saveState(
    session,
    updateTeam(session.current, teamId, {
      rerollsAvailable: team.rerollsAvailable - 1,
    }),
  )
}

export function correctRerolls(
  session: MatchSession,
  teamId: TeamId,
  rerollsAvailable: number,
): MatchSession {
  requireActiveMatch(session.current)
  requireNonNegativeInteger(rerollsAvailable, 'INVALID_REROLLS')

  if (getTeam(session.current, teamId).rerollsAvailable === rerollsAvailable) {
    return session
  }

  return saveState(session, updateTeam(session.current, teamId, { rerollsAvailable }))
}

export function finishTurn(session: MatchSession): MatchSession {
  requireActiveMatch(session.current)

  const next = completeActiveTurn(session.current)

  return saveState(session, next)
}

export function confirmHalftime(session: MatchSession): MatchSession {
  const match = session.current

  if (match.status !== 'halftime-pending' || match.half !== 1) {
    throw new DomainError('HALFTIME_NOT_PENDING')
  }

  return saveState(session, {
    ...match,
    half: 2,
    status: 'in-progress',
    // El equipo que pateó en la primera parte recibe en la segunda.
    activeTeamId: match.kickingTeamId,
    teams: {
      home: {
        ...match.teams.home,
        turnsCompleted: 0,
        rerollsAvailable: match.teams.home.rerollsPerHalf,
      },
      away: {
        ...match.teams.away,
        turnsCompleted: 0,
        rerollsAvailable: match.teams.away.rerollsPerHalf,
      },
    },
  })
}

export function undoLastAction(session: MatchSession): MatchSession {
  const historyLength = session.history.length

  if (historyLength === 0) {
    return session
  }

  const previousState = session.history[historyLength - 1]

  if (previousState === undefined) {
    return session
  }

  return {
    current: previousState,
    history: session.history.slice(0, historyLength - 1),
  }
}
