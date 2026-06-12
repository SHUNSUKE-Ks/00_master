import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import {
  activateNote,
  activateSurface,
  createUpnoteNote,
  deleteUpnoteNote,
  getUpnoteById,
  setDirty,
  setEditorMode,
  setFilterTags,
  setSidePanel,
  toggleUpnoteRelation,
  toggleUpnoteTag,
  updateUpnoteNote,
  upnoteNotes,
  upnoteUiState,
} from '../features/upnote'

const PageUpnote: Component = () => {
  const [tagInput, setTagInput] = createSignal('')
  const activeNote = createMemo(() => getUpnoteById(upnoteUiState.activeNoteId) ?? upnoteNotes[0])
  const allTags = createMemo(() => Array.from(new Set(upnoteNotes.flatMap((note) => note.tags))).sort())
  const filteredNotes = createMemo(() => {
    if (upnoteUiState.filterTags.length === 0) return upnoteNotes
    return upnoteNotes.filter((note) => upnoteUiState.filterTags.every((tag) => note.tags.includes(tag)))
  })
  const relatedNotes = createMemo(() =>
    activeNote() ? activeNote()!.relationIds.map((id) => getUpnoteById(id)).filter(Boolean) : []
  )

  function createNote() {
    const id = createUpnoteNote()
    activateNote(id)
    activateSurface('editor')
    setEditorMode('writing')
  }

  function patchActive(field: 'title' | 'body', value: string) {
    const note = activeNote()
    if (!note) return
    updateUpnoteNote(note.id, { [field]: value })
    activateNote(note.id)
    activateSurface('editor')
    setEditorMode('writing')
    setDirty(true)
  }

  function addTag() {
    const note = activeNote()
    if (!note) return
    toggleUpnoteTag(note.id, tagInput())
    setTagInput('')
    setSidePanel('tags')
    setDirty(true)
  }

  function toggleFilter(tag: string) {
    const next = upnoteUiState.filterTags.includes(tag)
      ? upnoteUiState.filterTags.filter((item) => item !== tag)
      : [...upnoteUiState.filterTags, tag]
    setFilterTags(next)
    activateSurface('sidePanel')
  }

  function removeActiveNote() {
    const note = activeNote()
    if (!note) return
    deleteUpnoteNote(note.id)
    activateNote(upnoteNotes[0]?.id ?? null)
    setDirty(false)
  }

  return (
    <div class="h-full bg-nacc-light overflow-hidden flex">
      <aside class="w-72 shrink-0 bg-white border-r border-nacc-border flex flex-col overflow-hidden">
        <div class="px-3 py-3 border-b border-nacc-border flex items-center justify-between">
          <div>
            <h1 class="text-sm font-bold text-nacc-dark">UPNOTE</h1>
            <p class="text-[11px] text-gray-400">separated note feature</p>
          </div>
          <button class="text-xs px-2 py-1 rounded bg-nacc-gold text-white font-semibold" onClick={createNote}>
            + Note
          </button>
        </div>

        <div class="px-3 py-2 border-b border-nacc-border">
          <div class="text-[11px] text-gray-400 font-semibold mb-1">Filter Tags</div>
          <div class="flex flex-wrap gap-1">
            <For each={allTags()}>
              {(tag) => (
                <button
                  class="text-[11px] px-2 py-1 rounded-full border"
                  classList={{
                    'bg-nacc-gold text-white border-nacc-gold': upnoteUiState.filterTags.includes(tag),
                    'bg-white text-gray-500 border-nacc-border': !upnoteUiState.filterTags.includes(tag),
                  }}
                  onClick={() => toggleFilter(tag)}
                >
                  {tag}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <For each={filteredNotes()}>
            {(note) => (
              <button
                class="w-full text-left px-4 py-3 border-b border-[#f0f0f0] hover:bg-[#faf9f7]"
                classList={{ 'bg-nacc-light': upnoteUiState.activeNoteId === note.id }}
                onClick={() => { activateNote(note.id); activateSurface('editor'); setEditorMode('idle') }}
              >
                <p class="text-sm font-semibold text-nacc-dark truncate">{note.title || 'Untitled note'}</p>
                <p class="text-xs text-gray-400 truncate mt-0.5">{note.body || 'No body'}</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  <For each={note.tags.slice(0, 3)}>
                    {(tag) => <span class="text-[11px] px-1.5 py-0.5 rounded bg-white border border-nacc-border text-gray-500">{tag}</span>}
                  </For>
                </div>
              </button>
            )}
          </For>
        </div>
      </aside>

      <main class="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div class="px-5 py-3 bg-white border-b border-nacc-border flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs text-gray-400">activeSurface: {upnoteUiState.activeSurface} / editorMode: {upnoteUiState.editorMode}</div>
            <div class="text-sm font-semibold text-nacc-dark truncate">
              {activeNote()?.title || 'No active note'}
              <Show when={upnoteUiState.isDirty}>
                <span class="ml-2 text-[11px] text-nacc-gold">edited</span>
              </Show>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="text-xs px-3 py-1.5 rounded border border-nacc-border bg-white" onClick={() => { setEditorMode('preview'); setDirty(false) }}>
              Preview
            </button>
            <button class="text-xs px-3 py-1.5 rounded border border-red-100 text-red-500 bg-white" onClick={removeActiveNote}>
              Delete
            </button>
          </div>
        </div>

        <Show when={activeNote()} fallback={<div class="flex-1 grid place-items-center text-gray-400">No note</div>}>
          {(note) => (
            <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              <input
                class="text-2xl font-bold text-nacc-dark bg-transparent outline-none"
                value={note().title}
                placeholder="Title"
                onInput={(event) => patchActive('title', event.currentTarget.value)}
              />
              <textarea
                class="min-h-80 flex-1 text-sm leading-7 text-nacc-dark border border-nacc-border rounded-xl p-4 resize-none outline-none focus:ring-1 focus:ring-nacc-gold/30"
                value={note().body}
                placeholder="Write note body..."
                onFocus={() => { activateSurface('editor'); setEditorMode('writing') }}
                onInput={(event) => patchActive('body', event.currentTarget.value)}
              />
            </div>
          )}
        </Show>
      </main>

      <aside class="w-80 shrink-0 bg-white border-l border-nacc-border flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-nacc-border">
          <div class="text-sm font-bold text-nacc-dark">Side Panel</div>
          <div class="text-xs text-gray-400">active: {upnoteUiState.sidePanel}</div>
        </div>

        <div class="p-4 border-b border-nacc-border">
          <div class="text-xs font-semibold text-gray-400 mb-2">Tags</div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <For each={activeNote()?.tags ?? []}>
              {(tag) => (
                <button class="text-xs px-2 py-1 rounded-full bg-nacc-light text-nacc-dark" onClick={() => activeNote() && toggleUpnoteTag(activeNote()!.id, tag)}>
                  {tag} x
                </button>
              )}
            </For>
          </div>
          <div class="flex gap-2">
            <input
              class="min-w-0 flex-1 text-xs border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
              value={tagInput()}
              placeholder="new tag"
              onInput={(event) => setTagInput(event.currentTarget.value)}
              onFocus={() => setSidePanel('tags')}
            />
            <button class="text-xs px-3 py-1.5 rounded bg-nacc-dark text-white" onClick={addTag}>
              Add
            </button>
          </div>
        </div>

        <div class="p-4 border-b border-nacc-border">
          <div class="text-xs font-semibold text-gray-400 mb-2">Relations</div>
          <For each={relatedNotes()}>
            {(note) => note && (
              <button class="block w-full text-left text-xs px-3 py-2 rounded-lg bg-nacc-light mb-1" onClick={() => activateNote(note.id)}>
                {note.title}
              </button>
            )}
          </For>
          <div class="mt-3 text-[11px] text-gray-400 mb-1">Link another note</div>
          <For each={upnoteNotes.filter((item) => item.id !== activeNote()?.id)}>
            {(note) => (
              <button
                class="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-gray-50"
                onClick={() => activeNote() && toggleUpnoteRelation(activeNote()!.id, note.id)}
              >
                {activeNote()?.relationIds.includes(note.id) ? 'Linked: ' : '+ '}
                {note.title}
              </button>
            )}
          </For>
        </div>

        <div class="p-4 text-xs text-gray-500 leading-6">
          <div class="font-semibold text-nacc-dark mb-1">State Snapshot</div>
          <pre class="whitespace-pre-wrap break-words bg-nacc-light rounded-lg p-3">{JSON.stringify(upnoteUiState, null, 2)}</pre>
        </div>
      </aside>
    </div>
  )
}

export default PageUpnote
