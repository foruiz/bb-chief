import { describe, expect, it } from 'vitest'
import { createMatch } from '../services/create-match'
import type { CreateMatchInput } from '../models/match'

const validInput: CreateMatchInput = {
  format: 'normal',
  kickingTeamId: 'home',
  home: {
    name: 'Orcos',
    race: 'Orcos',
    rerolls: 3,
  },
  away: {
    name: 'Humanos',
    race: 'Humanos',
    rerolls: 2,
  },
}

describe('createMatch', () => {
  it('crea una partida con el marcador inicial a cero', () => {
    const match = createMatch(validInput)

    expect(match.teams.home.touchdowns).toBe(0)
    expect(match.teams.away.touchdowns).toBe(0)
    expect(match.half).toBe(1)
    expect(match.status).toBe('in-progress')
  })

  it('inicializa las segundas oportunidades de cada equipo', () => {
    const match = createMatch(validInput)

    expect(match.teams.home.rerollsAvailable).toBe(3)
    expect(match.teams.away.rerollsAvailable).toBe(2)
  })

  it('hace que el equipo receptor juegue primero', () => {
    const match = createMatch(validInput)

    expect(match.kickingTeamId).toBe('home')
    expect(match.activeTeamId).toBe('away')
  })

  it('rechaza nombres vacíos', () => {
    expect(() =>
      createMatch({
        ...validInput,
        home: { ...validInput.home, name: '  ' },
      }),
    ).toThrow()
  })

  it('rechaza segundas oportunidades negativas', () => {
    expect(() =>
      createMatch({
        ...validInput,
        home: { ...validInput.home, rerolls: -1 },
      }),
    ).toThrow()
  })
})
