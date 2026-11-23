import type { CreateMatchInput, MatchState, Team, TeamId } from '../models/match'
import { DomainError } from '../errors/domain-error'

function createTeam(id: TeamId, name: string, race: string, rerolls: number): Team {
  if (!name.trim()) {
    throw new DomainError('TEAM_NAME_REQUIRED')
  }

  if (!race.trim()) {
    throw new DomainError('TEAM_RACE_REQUIRED')
  }

  if (!Number.isInteger(rerolls) || rerolls < 0) {
    throw new DomainError('INVALID_REROLLS')
  }

  return {
    id,
    name: name.trim(),
    race: race.trim(),
    touchdowns: 0,
    rerollsAvailable: rerolls,
    rerollsPerHalf: rerolls,
    turnsCompleted: 0,
  }
}

export function createMatch(input: CreateMatchInput): MatchState {
  const home = createTeam('home', input.home.name, input.home.race, input.home.rerolls)

  const away = createTeam('away', input.away.name, input.away.race, input.away.rerolls)

  // El equipo que recibe el saque realiza el primer turno.
  const activeTeamId: TeamId = input.kickingTeamId === 'home' ? 'away' : 'home'

  return {
    format: input.format,
    half: 1,
    status: 'in-progress',
    kickingTeamId: input.kickingTeamId,
    activeTeamId,
    teams: {
      home,
      away,
    },
  }
}
