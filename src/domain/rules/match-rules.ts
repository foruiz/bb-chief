import type { MatchFormat } from '../models/match'

export function getTurnsPerHalf(format: MatchFormat): number {
  return format === 'normal' ? 8 : 6
}
