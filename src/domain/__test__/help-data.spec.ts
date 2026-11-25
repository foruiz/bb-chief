/**
 * Integridad de los datos de ayuda.
 *
 * Ubicación en el repositorio: src/domain/__test__/help-data.spec.ts
 * Ruta del JSON: src/assets/data/help/blood_bowl_skills_2025.json
 */
import { describe, expect, it } from 'vitest'
import data from '../../assets/data/help/blood_bowl_skills_2025.json'

const { categories, entries } = data.skills

const categoryIds = new Set(categories.map((category) => category.id))

describe('datos de habilidades', () => {
  it('tiene al menos una entrada', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it('no repite ids de entradas', () => {
    const ids = entries.map((entry) => entry.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no repite ids de categorías', () => {
    const ids = categories.map((category) => category.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada entrada pertenece a una categoría existente', () => {
    for (const entry of entries) {
      expect(categoryIds.has(entry.category), `categoría de ${entry.id}`).toBe(true)
    }
  })

  it('todos los textos bilingües tienen contenido', () => {
    for (const entry of entries) {
      expect(entry.name.es.trim(), `name.es de ${entry.id}`).not.toBe('')
      expect(entry.name.en.trim(), `name.en de ${entry.id}`).not.toBe('')
      expect(entry.description.es.trim(), `description.es de ${entry.id}`).not.toBe('')
      expect(entry.description.en.trim(), `description.en de ${entry.id}`).not.toBe('')
    }
  })

  it('conserva las correcciones de nombres acordadas', () => {
    const quickFoul = entries.find((entry) => entry.id === 'quick_foul')
    const pileDriver = entries.find((entry) => entry.id === 'pile_driver')

    expect(quickFoul?.name.en).toBe('Quick Foul')
    expect(pileDriver?.name.en).toBe('Pile Driver')
  })

  it('Patada a Seguir y Defensa no llevan el inglés en el nombre en español', () => {
    const punt = entries.find((entry) => entry.id === 'punt')
    const guard = entries.find((entry) => entry.id === 'guard')

    expect(punt?.name.es).toBe('Patada de Despeje')
    expect(guard?.name.es).toBe('Defensa')
  })
})
