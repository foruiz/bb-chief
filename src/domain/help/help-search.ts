/**
 * Búsqueda de la ayuda de BB Chief.
 *
 * Ubicación en el repositorio: src/domain/help/help-search.ts
 *
 * Reglas:
 * - Se ignoran mayúsculas, tildes y espacios sobrantes.
 * - Se busca solo en el idioma activo.
 * - Una entrada aparece en el bloque «name» si su nombre coincide, y en el bloque
 *   «description» solo si no coincide en el nombre.
 * - Varias palabras: la frase completa tiene prioridad; después, cualquier término.
 * - Coincidencias aproximadas: palabras con similitud ≥ MIN_SIMILARITY.
 * - Bloque «name»: se ordena por nivel de coincidencia y, dentro de cada nivel, alfabéticamente.
 * - Bloque «description»: exactas antes que aproximadas; dentro de cada grupo, orden del JSON.
 */
import type {
  HelpCategory,
  HelpCategoryGroup,
  HelpEntry,
  HelpLocale,
  HelpMatch,
  HelpSearchResult,
  HighlightSegment,
} from './help-models'

export const MIN_QUERY_LENGTH = 3
export const MIN_SIMILARITY = 0.85

/** Niveles de relevancia dentro del nombre. Cuanto menor, más relevante. */
const LEVEL = {
  exactName: 1,
  namePrefix: 2,
  phraseInName: 3,
  termInName: 4,
  fuzzy: 5,
} as const

// ---------------------------------------------------------------------------
// Normalización
// ---------------------------------------------------------------------------

/** Quita tildes y pasa a minúsculas un carácter. */
function foldChar(char: string): string {
  return char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function splitWords(normalizedText: string): string[] {
  return normalizedText.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '')
}

// ---------------------------------------------------------------------------
// Similitud
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i++) {
    const current = [i]

    for (let j = 1; j <= b.length; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1

      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )
    }

    previous = current
  }

  return previous[b.length] ?? 0
}

function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length)

  if (longest === 0) return 1

  return 1 - levenshtein(a, b) / longest
}

// ---------------------------------------------------------------------------
// Clasificación de un texto frente a la búsqueda
// ---------------------------------------------------------------------------

/**
 * Devuelve el nivel de coincidencia de un texto, o null si no coincide.
 * Los niveles 1 a 4 son coincidencias exactas; el 5, aproximada.
 */
function classifyText(text: string, query: string, terms: string[]): number | null {
  const normalizedText = normalizeText(text)

  if (normalizedText === query) return LEVEL.exactName
  if (normalizedText.startsWith(query)) return LEVEL.namePrefix

  const words = splitWords(normalizedText)

  // La frase completa aparece a partir de una palabra interior.
  for (let start = 1; start < words.length; start++) {
    const phraseFound = terms.every((term, offset) =>
      (words[start + offset] ?? '').startsWith(term),
    )

    if (phraseFound) return LEVEL.phraseInName
  }

  // Cualquiera de los términos empieza una palabra.
  if (words.some((word) => terms.some((term) => word.startsWith(term)))) {
    return LEVEL.termInName
  }

  // Coincidencia aproximada de alguna palabra con algún término.
  if (words.some((word) => terms.some((term) => similarity(word, term) >= MIN_SIMILARITY))) {
    return LEVEL.fuzzy
  }

  return null
}

// ---------------------------------------------------------------------------
// Búsqueda
// ---------------------------------------------------------------------------

interface RankedMatch {
  match: HelpMatch
  rank: number
  index: number
  name: string
}

export function searchHelpEntries(
  entries: HelpEntry[],
  rawQuery: string,
  locale: HelpLocale,
): HelpSearchResult {
  const query = normalizeText(rawQuery)

  if (query === '') return { status: 'idle' }
  if (query.length < MIN_QUERY_LENGTH) return { status: 'too-short' }

  const terms = query.split(' ')
  const nameMatches: RankedMatch[] = []
  const descriptionMatches: RankedMatch[] = []

  entries.forEach((entry, index) => {
    const name = entry.name[locale]
    const nameLevel = classifyText(name, query, terms)

    if (nameLevel !== null) {
      nameMatches.push({
        match: { entry, block: 'name' },
        rank: nameLevel,
        index,
        name,
      })
      return
    }

    const descriptionLevel = classifyText(entry.description[locale], query, terms)

    if (descriptionLevel !== null) {
      descriptionMatches.push({
        match: { entry, block: 'description' },
        rank: descriptionLevel === LEVEL.fuzzy ? 2 : 1,
        index,
        name,
      })
    }
  })

  nameMatches.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, locale))
  descriptionMatches.sort((a, b) => a.rank - b.rank || a.index - b.index)

  const matches = [...nameMatches, ...descriptionMatches].map((ranked) => ranked.match)

  if (matches.length === 0) return { status: 'no-results' }

  return { status: 'results', matches }
}

// ---------------------------------------------------------------------------
// Resaltado
// ---------------------------------------------------------------------------

/**
 * Cuántos caracteres originales de «word» cubren el término al inicio.
 * Devuelve -1 si la palabra no empieza por el término.
 */
function prefixLengthIn(word: string, term: string): number {
  let folded = ''

  for (let index = 0; index < word.length; index++) {
    folded += foldChar(word.charAt(index))

    if (folded.length >= term.length) {
      return folded.startsWith(term) ? index + 1 : -1
    }
  }

  return -1
}

function highlightLength(word: string, terms: string[]): number {
  return terms.reduce((longest, term) => {
    const length = prefixLengthIn(word, term)
    return length > longest ? length : longest
  }, 0)
}

function pushSegment(segments: HighlightSegment[], text: string, highlighted: boolean): void {
  if (text === '') return

  const last = segments[segments.length - 1]

  if (last && last.highlighted === highlighted) {
    last.text += text
    return
  }

  segments.push({ text, highlighted })
}

/**
 * Divide el texto en fragmentos para resaltar el inicio de cada palabra que coincide.
 * Mantiene las mayúsculas y las tildes del texto original.
 */
export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const terms = normalizeText(query)
    .split(' ')
    .filter((term) => term !== '')
  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const word = match[0]
    const start = match.index ?? 0
    const length = highlightLength(word, terms)

    if (length === 0) continue

    pushSegment(segments, text.slice(cursor, start), false)
    pushSegment(segments, word.slice(0, length), true)
    cursor = start + length
  }

  pushSegment(segments, text.slice(cursor), false)

  return segments
}

// ---------------------------------------------------------------------------
// Agrupación por categoría
// ---------------------------------------------------------------------------

/**
 * Agrupa las coincidencias por categoría, en el orden de «categories».
 * Dentro de cada grupo se mantiene el orden de relevancia.
 */
export function groupMatchesByCategory(
  matches: HelpMatch[],
  categories: HelpCategory[],
): HelpCategoryGroup[] {
  return categories
    .map((category) => ({
      categoryId: category.id,
      matches: matches.filter((match) => match.entry.category === category.id),
    }))
    .filter((group) => group.matches.length > 0)
}

/**
 * Lista todas las entradas en el orden del JSON, para mostrar el catálogo completo
 * cuando no hay texto de búsqueda.
 */
export function listAllEntries(entries: HelpEntry[]): HelpMatch[] {
  return entries.map((entry) => ({ entry, block: 'name' as const }))
}
