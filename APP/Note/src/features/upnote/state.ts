import { createStore } from 'solid-js/store'
import type { UpnoteEditorMode, UpnoteSidePanel, UpnoteSurface, UpnoteUiState } from './types'

export const initialUpnoteUiState: UpnoteUiState = {
  activeSurface: 'editor',
  activeNoteId: null,
  selectionMode: 'none',
  selectedNoteIds: [],
  editorMode: 'idle',
  sidePanel: 'tags',
  filterTags: [],
  relationFocusId: null,
  isDirty: false,
}

export const [upnoteUiState, setUpnoteUiState] = createStore<UpnoteUiState>(initialUpnoteUiState)

export function activateSurface(activeSurface: UpnoteSurface) {
  setUpnoteUiState({ activeSurface })
}

export function activateNote(noteId: string | null) {
  setUpnoteUiState({
    activeNoteId: noteId,
    selectionMode: noteId ? 'single' : 'none',
    selectedNoteIds: noteId ? [noteId] : [],
    relationFocusId: noteId,
  })
}

export function setEditorMode(editorMode: UpnoteEditorMode) {
  setUpnoteUiState({ editorMode })
}

export function setSidePanel(sidePanel: UpnoteSidePanel) {
  setUpnoteUiState({ sidePanel, activeSurface: 'sidePanel' })
}

export function setDirty(isDirty: boolean) {
  setUpnoteUiState({ isDirty })
}

export function setFilterTags(filterTags: string[]) {
  setUpnoteUiState({ filterTags })
}
