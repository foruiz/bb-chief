/**
 * Modelos de la ayuda de BB Chief.
 *
 * Ubicación en el repositorio: src/domain/help/help-models.ts
 */

export type HelpLocale = 'es' | 'en'

export interface LocalizedText {
  es: string
  en: string
}

export interface HelpCategory {
  id: string
  name: LocalizedText
  description: LocalizedText
}

export interface HelpEntry {
  id: string
  category: string
  name: LocalizedText
  description: LocalizedText
}

/** Dónde se ha encontrado la coincidencia: en el nombre o en la descripción. */
export type HelpMatchBlock = 'name' | 'description'

export interface HelpMatch {
  entry: HelpEntry
  block: HelpMatchBlock
}

export type HelpSearchResult =
  | { status: 'idle' }
  | { status: 'too-short' }
  | { status: 'no-results' }
  | { status: 'results'; matches: HelpMatch[] }

export interface HelpCategoryGroup {
  categoryId: string
  matches: HelpMatch[]
}

export interface HighlightSegment {
  text: string
  highlighted: boolean
}
