export type UpnoteSurface = 'editor' | 'gallery' | 'database' | 'relation' | 'sidePanel'
export type UpnoteSelectionMode = 'none' | 'single' | 'multi'
export type UpnoteEditorMode = 'idle' | 'writing' | 'composing' | 'preview'
export type UpnoteSidePanel = 'tags' | 'outline' | 'relation' | 'metadata'

export type UpnoteNote = {
  id: string
  title: string
  body: string
  tags: string[]
  relationIds: string[]
  createdAt: Date
  updatedAt: Date
}

export type UpnoteUiState = {
  activeSurface: UpnoteSurface
  activeNoteId: string | null
  selectionMode: UpnoteSelectionMode
  selectedNoteIds: string[]
  editorMode: UpnoteEditorMode
  sidePanel: UpnoteSidePanel
  filterTags: string[]
  relationFocusId: string | null
  isDirty: boolean
}
