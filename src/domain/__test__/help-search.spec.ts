/**
 * Contrato de la lógica de búsqueda de la ayuda (Fase 1).
 *
 * Ubicación en el repositorio: src/domain/__test__/help-search.spec.ts
 * Módulos que se implementarán después:
 *   - src/domain/help/help-models.ts
 *   - src/domain/help/help-search.ts
 *
 * Estado: FASE ROJA. Los tests fallarán hasta crear los módulos anteriores.
 */
import { describe, expect, it } from 'vitest'
import {
  groupMatchesByCategory,
  highlightSegments,
  normalizeText,
  searchHelpEntries,
  listAllEntries,
} from '../help/help-search'
import type {
  HelpCategory,
  HelpEntry,
  HelpLocale,
  HelpMatch,
  HelpSearchResult,
} from '../help/help-models'

// ---------------------------------------------------------------------------
// Datos de prueba: pequeños y controlados, independientes del JSON real.
// ---------------------------------------------------------------------------

const CATEGORIES: HelpCategory[] = [
  { id: 'agility', name: { es: 'Agilidad', en: 'Agility' }, description: { es: '', en: '' } },
  { id: 'devious', name: { es: 'Artera', en: 'Devious' }, description: { es: '', en: '' } },
  { id: 'general', name: { es: 'General', en: 'General' }, description: { es: '', en: '' } },
  { id: 'mutation', name: { es: 'Mutación', en: 'Mutation' }, description: { es: '', en: '' } },
  { id: 'passing', name: { es: 'Pase', en: 'Passing' }, description: { es: '', en: '' } },
  { id: 'strength', name: { es: 'Fuerza', en: 'Strength' }, description: { es: '', en: '' } },
  { id: 'traits', name: { es: 'Atributos', en: 'Traits' }, description: { es: '', en: '' } },
]

const ENTRIES: HelpEntry[] = [
  {
    id: 'sure_hands',
    category: 'general',
    name: { es: 'Manos Seguras (Recogida)', en: 'Sure Hands' },
    description: {
      es: 'Puede repetir tiradas de Agilidad fallidas al recoger el balón del suelo.',
      en: 'May re-roll any failed Agility Test when attempting to Pick up the ball.',
    },
  },
  {
    id: 'safe_pair_of_hands',
    category: 'agility',
    name: { es: 'Manos Seguras', en: 'Safe Pair of Hands' },
    description: {
      es: 'Si es derribado teniendo el balón, puede colocarlo en una casilla adyacente.',
      en: 'If Knocked Down while holding the ball, may place it in an adjacent square.',
    },
  },
  {
    id: 'big_hand',
    category: 'mutation',
    name: { es: 'Mano Grande', en: 'Big Hand' },
    description: {
      es: 'Ignora los modificadores por zonas de defensa al recoger el balón.',
      en: 'Ignores modifiers for Tackle Zones when attempting to Pick up the ball.',
    },
  },
  {
    id: 'no_ball',
    category: 'traits',
    name: { es: 'Sin Manos / Sin Balón', en: 'No Ball' },
    description: {
      es: 'No puede tener la posesión del balón bajo ninguna circunstancia.',
      en: 'Cannot gain possession of the ball under any circumstances.',
    },
  },
  {
    id: 'infected',
    category: 'traits',
    name: { es: 'Infectado', en: 'Infected' },
    description: {
      es: 'Una vez por partido, si un rival muere a manos de este equipo, puede alzarse como un nuevo Rotter.',
      en: 'Once per game, if an opposition player is Killed by this team, they may be raised as a new Rotter.',
    },
  },
  {
    id: 'pass',
    category: 'passing',
    name: { es: 'Pasar', en: 'Pass' },
    description: {
      es: 'Puede repetir una tirada de Pase fallida al realizar una acción de pase.',
      en: 'May re-roll a failed Passing Ability test when performing a Pass Action.',
    },
  },
  {
    id: 'mighty_blow',
    category: 'strength',
    name: { es: 'Golpe Mortífero', en: 'Mighty Blow' },
    description: {
      es: 'Aplica un modificador de +1 a la tirada de armadura o de heridas.',
      en: 'Applies a +1 modifier to either the Armour Roll or Injury Roll.',
    },
  },
  {
    id: 'strip_ball',
    category: 'general',
    name: { es: 'Robar Balón', en: 'Strip Ball' },
    description: {
      es: 'Cuando empuja a un rival que lleva el balón durante un placaje, el balón cae al suelo.',
      en: 'When this player Pushes Back an opponent carrying the ball, the ball is knocked loose.',
    },
  },
]

// ---------------------------------------------------------------------------
// Utilidades de test
// ---------------------------------------------------------------------------

function search(query: string, locale: HelpLocale = 'es', entries: HelpEntry[] = ENTRIES) {
  return searchHelpEntries(entries, query, locale)
}

function matchesOf(result: HelpSearchResult): HelpMatch[] {
  if (result.status !== 'results') {
    throw new Error(`Se esperaban resultados y se ha recibido "${result.status}"`)
  }

  return result.matches
}

function idsOf(result: HelpSearchResult): string[] {
  return matchesOf(result).map((match) => match.entry.id)
}

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

describe('normalizeText', () => {
  it('pasa el texto a minúsculas', () => {
    expect(normalizeText('MANOS')).toBe('manos')
  })

  it('elimina las tildes', () => {
    expect(normalizeText('Mortífero')).toBe('mortifero')
    expect(normalizeText('Nórdicos')).toBe('nordicos')
  })

  it('elimina los espacios sobrantes', () => {
    expect(normalizeText('  Manos   Seguras ')).toBe('manos seguras')
  })
})

// ---------------------------------------------------------------------------
// Longitud mínima y estados de la búsqueda (RF-09)
// ---------------------------------------------------------------------------

describe('longitud de la búsqueda', () => {
  it('no busca si el texto está vacío o solo tiene espacios', () => {
    expect(search('').status).toBe('idle')
    expect(search('    ').status).toBe('idle')
  })

  it('pide al menos 3 caracteres', () => {
    expect(search('ma').status).toBe('too-short')
    expect(search(' ma ').status).toBe('too-short')
  })

  it('busca a partir de 3 caracteres', () => {
    expect(search('man').status).toBe('results')
  })
})

// ---------------------------------------------------------------------------
// Qué coincide (RF-06, RF-07, RF-08)
// ---------------------------------------------------------------------------

describe('coincidencias', () => {
  it('encuentra palabras que empiezan por el texto buscado', () => {
    const ids = idsOf(search('seguras'))

    expect(ids).toContain('safe_pair_of_hands')
    expect(ids).toContain('sure_hands')
  })

  it('encuentra entradas que contienen la frase completa', () => {
    const ids = idsOf(search('manos seguras'))

    expect(ids).toContain('safe_pair_of_hands')
    expect(ids).toContain('sure_hands')
  })

  it('encuentra entradas que contienen cualquiera de los términos de la búsqueda', () => {
    // «manos» aparece en «Sin Manos / Sin Balón».
    const ids = idsOf(search('manos seguras'))

    expect(ids).toContain('no_ball')
  })

  it('ignora mayúsculas y tildes en la búsqueda', () => {
    expect(idsOf(search('MORTIFERO'))).toEqual(['mighty_blow'])
    expect(idsOf(search('pasár'))).toContain('pass')
  })

  it('busca solo en el idioma activo', () => {
    expect(search('sure', 'es').status).toBe('no-results')
    expect(idsOf(search('sure', 'en'))).toContain('sure_hands')
  })

  it('busca también en la descripción', () => {
    const result = search('manos')
    const infected = matchesOf(result).find((match) => match.entry.id === 'infected')

    expect(infected).toBeDefined()
    expect(infected?.block).toBe('description')
  })
})

// ---------------------------------------------------------------------------
// Coincidencias aproximadas (umbral 75 %)
// ---------------------------------------------------------------------------

describe('coincidencias aproximadas', () => {
  it('encuentra palabras aproximadas por encima del 85 % de similitud', () => {
    // «infectdo» se parece a «infectado»: 89 % de similitud.
    expect(idsOf(search('infectdo'))).toContain('infected')
  })

  it('no encuentra palabras por debajo del 85 % de similitud', () => {
    // «manso» se parece a «mano» (Mano Grande): 80 %, por debajo del umbral.
    expect(search('manso').status).toBe('no-results')
  })
})

// ---------------------------------------------------------------------------
// Orden de resultados (RF-10)
// ---------------------------------------------------------------------------

describe('orden de resultados', () => {
  it('muestra primero las coincidencias en el nombre y después las de la descripción', () => {
    const matches = matchesOf(search('manos'))
    const firstDescription = matches.findIndex((match) => match.block === 'description')

    expect(firstDescription).toBeGreaterThan(0)
    expect(matches.slice(0, firstDescription).every((match) => match.block === 'name')).toBe(true)
    expect(matches.slice(firstDescription).every((match) => match.block === 'description')).toBe(
      true,
    )
  })

  it('no repite una entrada que coincide en el nombre y en la descripción', () => {
    const entries: HelpEntry[] = [
      {
        id: 'x',
        category: 'general',
        name: { es: 'Manos Largas', en: 'Long Hands' },
        description: { es: 'Usa manos fuertes.', en: '' },
      },
    ]

    const matches = matchesOf(search('manos', 'es', entries))

    expect(matches).toHaveLength(1)
    expect(matches[0]?.block).toBe('name')
  })

  it('pone antes la frase completa que los términos sueltos', () => {
    // «manos seguras» coincide con la frase en «Manos Seguras».
    // «Sin Manos» solo contiene el término «manos».
    const ids = idsOf(search('manos seguras'))

    expect(ids.indexOf('safe_pair_of_hands')).toBeLessThan(ids.indexOf('no_ball'))
    expect(ids.indexOf('sure_hands')).toBeLessThan(ids.indexOf('no_ball'))
  })

  it('pone antes la coincidencia exacta del nombre que la que solo empieza el nombre', () => {
    const entries: HelpEntry[] = [
      {
        id: 'pasar_largo',
        category: 'passing',
        name: { es: 'Pasar a lo Loco', en: 'Hail Mary Pass' },
        description: { es: '', en: '' },
      },
      {
        id: 'pasar',
        category: 'passing',
        name: { es: 'Pasar', en: 'Pass' },
        description: { es: '', en: '' },
      },
    ]

    expect(idsOf(search('pasar', 'es', entries))).toEqual(['pasar', 'pasar_largo'])
  })

  it('pone antes las palabras que empiezan el nombre que las que están dentro del nombre', () => {
    // «manos» empieza «Manos Seguras» y «Manos Seguras (Recogida)»,
    // pero solo es una palabra interior en «Sin Manos / Sin Balón».
    const ids = idsOf(search('manos')).slice(0, 3)

    expect(ids).toEqual(['safe_pair_of_hands', 'sure_hands', 'no_ball'])
  })

  it('ordena alfabéticamente entre coincidencias del mismo nivel en el nombre', () => {
    // «seguras» es una palabra interior en ambos nombres: se ordena por nombre.
    const ids = idsOf(search('seguras'))

    expect(ids.indexOf('safe_pair_of_hands')).toBeLessThan(ids.indexOf('sure_hands'))
  })

  it('en la descripción sigue el orden de aparición en el JSON, no el alfabético', () => {
    // Las dos entradas coinciden solo en la descripción.
    // «Zeta» va antes que «Alfa» porque aparece antes en el array de entradas.
    const entries: HelpEntry[] = [
      {
        id: 'zeta',
        category: 'general',
        name: { es: 'Zeta', en: 'Zeta' },
        description: { es: 'Usa manos fuertes.', en: '' },
      },
      {
        id: 'alfa',
        category: 'general',
        name: { es: 'Alfa', en: 'Alpha' },
        description: { es: 'Tiene manos hábiles.', en: '' },
      },
    ]

    expect(idsOf(search('manos', 'es', entries))).toEqual(['zeta', 'alfa'])
  })
})

// ---------------------------------------------------------------------------
// Resaltado de coincidencias (RF-12)
// ---------------------------------------------------------------------------

describe('highlightSegments', () => {
  it('marca la parte del texto que coincide con la búsqueda', () => {
    expect(highlightSegments('Manos Seguras', 'man')).toEqual([
      { text: 'Man', highlighted: true },
      { text: 'os Seguras', highlighted: false },
    ])
  })

  it('conserva las tildes y mayúsculas del texto original', () => {
    expect(highlightSegments('Golpe Mortífero', 'mortifero')).toEqual([
      { text: 'Golpe ', highlighted: false },
      { text: 'Mortífero', highlighted: true },
    ])
  })

  it('marca todas las apariciones al inicio de palabra', () => {
    expect(highlightSegments('Puede manos y manos', 'manos')).toEqual([
      { text: 'Puede ', highlighted: false },
      { text: 'manos', highlighted: true },
      { text: ' y ', highlighted: false },
      { text: 'manos', highlighted: true },
    ])
  })

  it('no marca coincidencias dentro de una palabra', () => {
    expect(highlightSegments('Sin Manos', 'ano')).toEqual([
      { text: 'Sin Manos', highlighted: false },
    ])
  })

  it('devuelve el texto sin marcar si no hay coincidencias', () => {
    expect(highlightSegments('Robar Balón', 'xyz')).toEqual([
      { text: 'Robar Balón', highlighted: false },
    ])
  })
})

// ---------------------------------------------------------------------------
// Sin resultados
// ---------------------------------------------------------------------------

describe('sin resultados', () => {
  it('devuelve el estado sin resultados cuando ninguna entrada se parece', () => {
    expect(search('xyzqw').status).toBe('no-results')
  })
})

// ---------------------------------------------------------------------------
// Agrupación por categoría (RF-11)
// ---------------------------------------------------------------------------

describe('groupMatchesByCategory', () => {
  it('ordena los grupos según el orden de las categorías, no el de relevancia', () => {
    const matches = matchesOf(search('manos'))
    const groups = groupMatchesByCategory(matches, CATEGORIES)

    expect(groups.map((group) => group.categoryId)).toEqual(['agility', 'general', 'traits'])
  })

  it('mantiene la relevancia dentro de cada grupo', () => {
    const matches = matchesOf(search('manos'))
    const traits = groupMatchesByCategory(matches, CATEGORIES).find(
      (group) => group.categoryId === 'traits',
    )

    expect(traits?.matches.map((match) => match.entry.id)).toEqual(['no_ball', 'infected'])
  })

  it('devuelve una lista vacía si no hay coincidencias', () => {
    expect(groupMatchesByCategory([], CATEGORIES)).toEqual([])
  })
})

describe('listAllEntries', () => {
  it('devuelve todas las entradas en el orden del JSON', () => {
    const ids = listAllEntries(ENTRIES).map((match) => match.entry.id)

    expect(ids).toEqual(ENTRIES.map((entry) => entry.id))
  })
})
