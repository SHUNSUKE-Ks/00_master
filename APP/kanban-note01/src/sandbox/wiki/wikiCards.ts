import { WIKI_RELATIONS, type WikiRelation } from './relations'

export type WikiCard = {
  id: string
  type: 'concept' | 'entity'
  name: string
  title: string
  summary: string
  body: string[]
  sources: string[]
  relations: WikiRelation[]
}

type RawWikiCard = Omit<WikiCard, 'relations'> & { type: string }

const rawModules = import.meta.glob<RawWikiCard>('./raw/*.json', { eager: true, import: 'default' })

function isWikiCard(value: RawWikiCard): value is Omit<WikiCard, 'relations'> {
  return (value.type === 'concept' || value.type === 'entity')
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.title === 'string'
    && Array.isArray(value.body)
}

export const WIKI_CARDS: WikiCard[] = Object.values(rawModules)
  .filter(isWikiCard)
  .map((card) => ({ ...card, relations: WIKI_RELATIONS[card.id] ?? [] }))
  .sort((left, right) => left.name.localeCompare(right.name, 'ja'))

export function wikiCardById(id: string | null): WikiCard | null {
  return WIKI_CARDS.find((card) => card.id === id) ?? null
}
