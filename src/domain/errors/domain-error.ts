export type DomainErrorCode =
  | 'TEAM_NAME_REQUIRED'
  | 'TEAM_RACE_REQUIRED'
  | 'INVALID_REROLLS'
  | 'MATCH_NOT_ACTIVE'
  | 'TEAM_TURNS_COMPLETED'
  | 'TOUCHDOWN_NOT_ACTIVE_TEAM'
  | 'NO_REROLLS_AVAILABLE'
  | 'HALFTIME_NOT_PENDING'
  | 'INVALID_TOUCHDOWNS'

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode) {
    super(code)
    this.name = 'DomainError'
  }
}
