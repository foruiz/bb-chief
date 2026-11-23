export type TeamId = 'home' | 'away'
export type MatchFormat = 'normal' | 'sevens'
export type MatchType = 'exhibition' | 'league-tournament'
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
  matchType: MatchType
  format: MatchFormat
  advantageTeamId: TeamId | null
  half: MatchHalf
  status: MatchStatus
  kickingTeamId: TeamId
  activeTeamId: TeamId
  teams: Record<TeamId, Team>
}

export interface CreateMatchInput {
  matchType: MatchType
  format: MatchFormat
  advantageTeamId: TeamId | null
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

export interface MatchSession {
  current: MatchState
  history: MatchState[]
}
