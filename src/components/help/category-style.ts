/**
 * Letra y color de cada categoría (decisión D5).
 *
 * Ubicación en el repositorio: src/components/help/category-style.ts
 * Colores de la paleta del proyecto: azul, morado, naranja, verde, amarillo, rojo y marrón.
 */
export interface CategoryStyle {
  letter: string
  color: string
}

export const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  general: { letter: 'G', color: '#10477d' },
  agility: { letter: 'A', color: '#6b46c1' },
  devious: { letter: 'T', color: '#dd6b20' },
  mutation: { letter: 'M', color: '#2f855a' },
  passing: { letter: 'P', color: '#d69e2e' },
  strength: { letter: 'F', color: '#b51920' },
  traits: { letter: 'R', color: '#7b4a2d' },
}
