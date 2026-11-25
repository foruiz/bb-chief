/**
 * Catálogo de la ayuda: datos importados de forma estática desde el JSON.
 *
 * Ubicación en el repositorio: src/domain/help/help-catalog.ts
 * Fuente: src/assets/data/help/blood_bowl_skills_2025.json
 */
import data from '../../assets/data/help/blood_bowl_skills_2025.json'
import type { HelpCategory, HelpEntry, HelpLocale } from './help-models'

export const HELP_CATEGORIES: HelpCategory[] = data.skills.categories
export const HELP_ENTRIES: HelpEntry[] = data.skills.entries

export function getCategoryName(categoryId: string, locale: HelpLocale): string {
  const category = HELP_CATEGORIES.find((item) => item.id === categoryId)

  return category ? category.name[locale] : categoryId
}
