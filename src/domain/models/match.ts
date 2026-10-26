export type TeamId = 'home' | 'away'

export type MatchFormat = 'normal' | 'sevens'

export type MatchHalf = 1 | 2

export type MatchStatus = 'in-progress' | 'halftime-pending' | 'finished'

export interface Team {
  id: TeamId
  name: string
  race: string
  touchdowns: number
  rerollsAvailable: number
  rerollsPerHalf: number
  turnsCompleted: number
}

export interface MatchState {
  format: MatchFormat
  half: MatchHalf
  status: MatchStatus
  kickingTeamId: TeamId
  activeTeamId: TeamId
  teams: Record<TeamId, Team>
}

export interface CreateMatchInput {
  format: MatchFormat
  kickingTeamId: TeamId
  home: {
    name: string
    race: string
    rerolls: number
  }
  away: {
    name: string
    race: string
    rerolls: number
  }
}

/**
 * Sesión de trabajo de una partida.
 * history contiene los estados anteriores, del más antiguo al más reciente.
 */
export interface MatchSession {
  current: MatchState
  history: MatchState[]
}
