import { describe, expect, it, beforeEach } from 'vitest'
import type { StorageLike } from '../../persistence/match-storage'
import { clearSavedSession, loadSession, saveSession } from '../../persistence/match-storage'
import { createMatch } from '../../domain/services/create-match'
import { createSession } from '../../domain/services/match-actions'

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  putRaw(key: string, value: string): void {
    this.data.set(key, value)
  }
}

describe('match persistence', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  function makeSession() {
    return createSession(
      createMatch({
        format: 'normal',
        kickingTeamId: 'home',
        home: { name: 'Reikland Reavers', race: 'Humanos', rerolls: 3 },
        away: { name: 'Gouged Eye', race: 'Orcos', rerolls: 2 },
      }),
    )
  }

  it('returns empty when there is no saved match', () => {
    expect(loadSession(storage)).toEqual({ status: 'empty' })
  })

  it('saves and restores the session', () => {
    const session = makeSession()

    saveSession(session, storage)

    expect(loadSession(storage)).toEqual({
      status: 'valid',
      session,
    })
  })

  it('preserves history so actions can be undone after reload', () => {
    const original = makeSession()
    const withAction = {
      ...original,
      current: {
        ...original.current,
        teams: {
          ...original.current.teams,
          home: {
            ...original.current.teams.home,
            touchdowns: 1,
          },
        },
      },
      history: [original.current],
    }

    saveSession(withAction, storage)

    const result = loadSession(storage)

    expect(result.status).toBe('valid')
    if (result.status === 'valid') {
      expect(result.session.history).toHaveLength(1)
      expect(result.session.current.teams.home.touchdowns).toBe(1)
    }
  })

  it('rejects malformed JSON', () => {
    storage.putRaw('bb-chief.match-session', '{broken')

    expect(loadSession(storage)).toEqual({ status: 'invalid' })
  })

  it('rejects an unsupported storage version', () => {
    storage.putRaw(
      'bb-chief.match-session',
      JSON.stringify({ version: 999, session: makeSession() }),
    )

    expect(loadSession(storage)).toEqual({ status: 'invalid' })
  })

  it('rejects a session with invalid team data', () => {
    const session = makeSession()
    const corrupted = {
      ...session,
      current: {
        ...session.current,
        teams: {
          ...session.current.teams,
          home: {
            ...session.current.teams.home,
            touchdowns: -1,
          },
        },
      },
    }

    storage.putRaw('bb-chief.match-session', JSON.stringify({ version: 1, session: corrupted }))

    expect(loadSession(storage)).toEqual({ status: 'invalid' })
  })

  it('removes the saved session', () => {
    saveSession(makeSession(), storage)

    clearSavedSession(storage)

    expect(loadSession(storage)).toEqual({ status: 'empty' })
  })
})
