import { createSignal } from 'solid-js'
import { STUDY_CARDS, type StudyCategory } from '../dataBridge/studyLibrary'

const FAVORITE_KEY = 'note-story-study-favorites-v1'
const READ_KEY = 'note-story-study-read-cards-v1'

function readFavorites() {
  if (typeof localStorage === 'undefined') return [] as string[]
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function readCards() {
  if (typeof localStorage === 'undefined') return [] as string[]
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

const DEFAULT_STUDY_CATEGORY: StudyCategory = 'claudeRpa'
const DEFAULT_STUDY_CARD_ID =
  STUDY_CARDS.find((card) => card.category === DEFAULT_STUDY_CATEGORY)?.id ?? STUDY_CARDS[0].id

export const [studyCategory, setStudyCategory] = createSignal<StudyCategory>(DEFAULT_STUDY_CATEGORY)
export const [selectedStudyCardId, setSelectedStudyCardId] = createSignal(DEFAULT_STUDY_CARD_ID)
export const [studyFavoriteCardIds, setStudyFavoriteCardIds] = createSignal<string[]>(readFavorites())
export const [studyReadCardIds, setStudyReadCardIds] = createSignal<string[]>(readCards())
export const [studyViewIntent, setStudyViewIntent] = createSignal<'cards' | 'article'>('cards')

export function toggleStudyFavorite(cardId: string) {
  setStudyFavoriteCardIds((prev) => {
    const next = prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    if (typeof localStorage !== 'undefined') localStorage.setItem(FAVORITE_KEY, JSON.stringify(next))
    return next
  })
}

export function isStudyFavorite(cardId: string) {
  return studyFavoriteCardIds().includes(cardId)
}

export function markStudyCardRead(cardId: string) {
  setStudyReadCardIds((prev) => {
    if (prev.includes(cardId)) return prev
    const next = [...prev, cardId]
    if (typeof localStorage !== 'undefined') localStorage.setItem(READ_KEY, JSON.stringify(next))
    return next
  })
}

export function isStudyCardRead(cardId: string) {
  return studyReadCardIds().includes(cardId)
}
