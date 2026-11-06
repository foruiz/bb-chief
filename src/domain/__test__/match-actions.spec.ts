import { describe, expect, it } from 'vitest'
import { createMatch } from '../services/create-match'
import {
  confirmHalftime,
  correctRerolls,
  correctTouchdowns,
  createSession,
  finishTurn,
  recordTouchdown,
  undoLastAction,
  useReroll,
} from '../services/match-actions'
import type { CreateMatchInput } from '../models/match'

const input: CreateMatchInput = {
  format: 'normal',
  kickingTeamId: 'home',
  home: { name: 'Orcos', race: 'Orcos', rerolls: 3 },
  away: { name: 'Humanos', race: 'Humanos', rerolls: 2 },
}

function newSession() {
  return createSession(createMatch(input))
}

function finishHalf(session: ReturnType<typeof newSession>) {
  let result = session

  for (let i = 0; i < 16; i++) {
    result = finishTurn(result)
  }

  return result
}

describe('Operaciones de partido', () => {
  it('registra un touchdown y finaliza el turno sin modificar el estado anterior', () => {
    const session = newSession()
    const originalState = structuredClone(session.current)
    const activeTeamId = session.current.activeTeamId

    const result = recordTouchdown(session, activeTeamId)

    expect(session.current).toEqual(originalState)
    expect(result.current.teams[activeTeamId].touchdowns).toBe(1)
    expect(result.current.teams[activeTeamId].turnsCompleted).toBe(1)
    expect(result.current.activeTeamId).not.toBe(activeTeamId)
    expect(result.history).toHaveLength(1)
  })

  it('permite corregir touchdowns a cero', () => {
    const session = newSession()
    const activeTeamId = session.current.activeTeamId

    const scored = recordTouchdown(session, activeTeamId)
    const corrected = correctTouchdowns(scored, activeTeamId, 0)

    expect(corrected.current.teams[activeTeamId].touchdowns).toBe(0)
    expect(corrected.current.teams[activeTeamId].turnsCompleted).toBe(1)
    expect(corrected.current.activeTeamId).not.toBe(activeTeamId)
  })

  it('rechaza touchdowns negativos', () => {
    expect(() => correctTouchdowns(newSession(), 'home', -1)).toThrow()
  })

  it('consume una segunda oportunidad', () => {
    const result = useReroll(newSession(), 'home')

    expect(result.current.teams.home.rerollsAvailable).toBe(2)
  })

  it('no permite consumir segundas oportunidades inexistentes', () => {
    const session = createSession(
      createMatch({
        ...input,
        home: { ...input.home, rerolls: 0 },
      }),
    )

    expect(() => useReroll(session, 'home')).toThrow()
  })

  it('permite corregir las segundas oportunidades', () => {
    const result = correctRerolls(newSession(), 'away', 4)

    expect(result.current.teams.away.rerollsAvailable).toBe(4)
  })

  it('alterna los equipos al finalizar los turnos', () => {
    const result = finishTurn(newSession())

    expect(result.current.teams.away.turnsCompleted).toBe(1)
    expect(result.current.activeTeamId).toBe('home')
  })

  it('solicita confirmar el descanso tras los turnos de ambos equipos', () => {
    const result = finishHalf(newSession())

    expect(result.current.status).toBe('halftime-pending')
    expect(result.current.half).toBe(1)
    expect(result.current.teams.home.turnsCompleted).toBe(8)
    expect(result.current.teams.away.turnsCompleted).toBe(8)
  })

  it('inicia la segunda parte al confirmar el descanso', () => {
    const halftime = finishHalf(newSession())
    const result = confirmHalftime(halftime)

    expect(result.current.status).toBe('in-progress')
    expect(result.current.half).toBe(2)
    expect(result.current.activeTeamId).toBe('home')
    expect(result.current.teams.home.turnsCompleted).toBe(0)
    expect(result.current.teams.away.turnsCompleted).toBe(0)
  })

  it('finaliza la partida al completar la segunda parte', () => {
    const firstHalf = finishHalf(newSession())
    const secondHalf = confirmHalftime(firstHalf)
    const result = finishHalf(secondHalf)

    expect(result.current.status).toBe('finished')
    expect(result.current.half).toBe(2)
  })

  it('deshace el touchdown y restaura el estado anterior', () => {
    const session = newSession()
    const activeTeamId = session.current.activeTeamId
    const originalState = structuredClone(session.current)

    const scored = recordTouchdown(session, activeTeamId)
    const undone = undoLastAction(scored)

    expect(undone.current).toEqual(originalState)
    expect(undone.history).toHaveLength(0)
  })

  it('no falla al deshacer cuando no hay historial', () => {
    const initial = newSession()

    expect(undoLastAction(initial)).toBe(initial)
  })

  it('rechaza un touchdown del equipo que no está activo', () => {
    const session = newSession()
    const inactiveTeamId = session.current.activeTeamId === 'home' ? 'away' : 'home'

    expect(() => recordTouchdown(session, inactiveTeamId)).toThrow(
      expect.objectContaining({
        code: 'TOUCHDOWN_NOT_ACTIVE_TEAM',
      }),
    )
  })

  it('pasa el turno al rival cuando anota en su último turno y el rival aún tiene turnos', () => {
    let session = newSession()

    // Avanzar hasta que un equipo tenga 7 turnos completados
    // y sea el equipo activo.
    while (session.current.teams[session.current.activeTeamId].turnsCompleted < 7) {
      session = finishTurn(session)
    }

    const activeTeamId = session.current.activeTeamId
    const rivalId = activeTeamId === 'home' ? 'away' : 'home'

    // El rival debe tener turnos disponibles.
    expect(session.current.teams[activeTeamId].turnsCompleted).toBe(7)
    expect(session.current.teams[rivalId].turnsCompleted).toBeLessThan(8)

    const result = recordTouchdown(session, activeTeamId)

    expect(result.current.teams[activeTeamId].turnsCompleted).toBe(8)
    expect(result.current.teams[activeTeamId].touchdowns).toBe(1)
    expect(result.current.activeTeamId).toBe(rivalId)
    expect(result.current.status).toBe('in-progress')
  })

  it('deja pendiente el descanso cuando ambos equipos completan sus turnos', () => {
    const match = createMatch(input)

    const matchAtBoundary = {
      ...match,
      activeTeamId: 'home' as const,
      teams: {
        ...match.teams,
        home: {
          ...match.teams.home,
          turnsCompleted: 7,
        },
        away: {
          ...match.teams.away,
          turnsCompleted: 8,
        },
      },
    }

    const session = createSession(matchAtBoundary)
    const result = recordTouchdown(session, 'home')

    expect(result.current.teams.home.turnsCompleted).toBe(8)
    expect(result.current.teams.away.turnsCompleted).toBe(8)
    expect(result.current.status).toBe('halftime-pending')
    expect(result.current.half).toBe(1)
  })

  it('restablece las segundas oportunidades al comenzar la segunda parte', () => {
    let session = newSession()

    session = useReroll(session, 'home')
    session = useReroll(session, 'away')

    expect(session.current.teams.home.rerollsAvailable).toBe(2)
    expect(session.current.teams.away.rerollsAvailable).toBe(1)

    const halftime = finishHalf(session)
    expect(halftime.current.status).toBe('halftime-pending')

    const result = confirmHalftime(halftime)

    expect(result.current.teams.home.rerollsAvailable).toBe(3)
    expect(result.current.teams.away.rerollsAvailable).toBe(2)
  })
})
