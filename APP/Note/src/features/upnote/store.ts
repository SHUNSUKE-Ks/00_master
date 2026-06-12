import { createStore } from 'solid-js/store'
import { SAMPLE_UPNOTE_NOTES } from './data/sampleNotes'
import type { UpnoteNote } from './types'

const cloneNote = (note: UpnoteNote): UpnoteNote => ({
  ...note,
  tags: [...note.tags],
  relationIds: [...note.relationIds],
  createdAt: new Date(note.createdAt),
  updatedAt: new Date(note.updatedAt),
})

export const [upnoteNotes, setUpnoteNotes] = createStore<UpnoteNote[]>(SAMPLE_UPNOTE_NOTES.map(cloneNote))

export function createUpnoteNote(): string {
  const now = new Date()
  const id = `note_${now.getTime()}`
  setUpnoteNotes((prev) => [
    {
      id,
      title: 'Untitled note',
      body: '',
      tags: [],
      relationIds: [],
      createdAt: now,
      updatedAt: now,
    },
    ...prev,
  ])
  return id
}

export function updateUpnoteNote(id: string, patch: Partial<Omit<UpnoteNote, 'id' | 'createdAt'>>) {
  setUpnoteNotes((prev) =>
    prev.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: new Date() } : note))
  )
}

export function deleteUpnoteNote(id: string) {
  setUpnoteNotes((prev) =>
    prev
      .filter((note) => note.id !== id)
      .map((note) => ({ ...note, relationIds: note.relationIds.filter((relationId) => relationId !== id) }))
  )
}

export function toggleUpnoteTag(id: string, tag: string) {
  const cleanTag = tag.trim()
  if (!cleanTag) return
  const note = upnoteNotes.find((item) => item.id === id)
  if (!note) return
  const tags = note.tags.includes(cleanTag)
    ? note.tags.filter((item) => item !== cleanTag)
    : [...note.tags, cleanTag]
  updateUpnoteNote(id, { tags })
}

export function toggleUpnoteRelation(sourceId: string, targetId: string) {
  if (sourceId === targetId) return
  const source = upnoteNotes.find((item) => item.id === sourceId)
  if (!source) return
  const relationIds = source.relationIds.includes(targetId)
    ? source.relationIds.filter((item) => item !== targetId)
    : [...source.relationIds, targetId]
  updateUpnoteNote(sourceId, { relationIds })
}

export function getUpnoteById(id: string | null | undefined): UpnoteNote | undefined {
  if (!id) return undefined
  return upnoteNotes.find((note) => note.id === id)
}
