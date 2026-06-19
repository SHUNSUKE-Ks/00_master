import { type Component, createEffect, createSignal, For, Show } from 'solid-js'
import type { NotebookPage } from '../types'
import { state, setState, addNotebook, updateNotebook, deleteNotebook } from '../store'
import MarkdownView from '../components/MarkdownView'
import { kanbanMemoInboxEnabled, sendMemoToKanbanMemoInbox } from '../db/firebase'
import CharacterInputSection from '../components/CharacterInputSection'
import CalloutInputSection from '../components/CalloutInputSection'
import NotionCalloutQuickInsert from '../components/NotionCalloutQuickInsert'
import { dialogueIndent, escapeDialogueToNextParagraph, formatDialogueLine } from '../utils/dialogueFormat'

let saveTimer: ReturnType<typeof setTimeout>

function mkPageId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}


const PageNotebook: Component = () => {
  const [pagePanelOpen, setPagePanelOpen] = createSignal(false)
  const [viewMode, setViewMode] = createSignal<'preview' | 'edit'>('edit')
  const [sendStatus, setSendStatus] = createSignal<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [characterPickerOpen, setCharacterPickerOpen] = createSignal(false)
  const [characterSearch, setCharacterSearch] = createSignal('')
  const [notionCalloutOpen, setNotionCalloutOpen] = createSignal(false)
  let bodyTextareaRef: HTMLTextAreaElement | undefined

  const isMobile = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || (window.innerHeight <= 500 && window.matchMedia('(orientation: landscape)').matches))
  const selectedId = () => state.selectedNotebookId
  const selectedPageId = () => state.selectedNotebookPageId
  const setSelectedId = (id: string | null) => setState({ selectedNotebookId: id })
  const setSelectedPageId = (id: string | null) => setState({ selectedNotebookPageId: id })
  const selectedNotebook = () => state.notebooks.find((n) => n.id === selectedId())
  const selectedPage = () => selectedNotebook()?.pages.find((p) => p.id === selectedPageId())

  createEffect(() => {
    const nb = selectedNotebook()
    const page = selectedPage()
    if (!nb || !page?.sourcePath || page.body) return
    fetch(page.sourcePath)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`Failed to load ${page.sourcePath}`))))
      .then((body) => {
        setState('notebooks', (prev) =>
          prev.map((notebook) =>
            notebook.id === nb.id
              ? {
                  ...notebook,
                  pages: notebook.pages.map((p) => (p.id === page.id ? { ...p, body } : p)),
                }
              : notebook
          )
        )
      })
      .catch((error) => console.warn('[Story notebook] markdown load failed:', error))
  })

  function schedulePageSave(notebookId: string, pages: NotebookPage[]) {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => updateNotebook(notebookId, { pages, updatedAt: new Date() }), 800)
  }

  function patchPagesLocal(notebookId: string, pages: NotebookPage[]) {
    setState('notebooks', (prev) => prev.map((n) => (n.id === notebookId ? { ...n, pages } : n)))
  }

  async function handleAddNotebook() {
    const now = new Date()
    const id = await addNotebook({ title: '新しいストーリーノート', storyOnly: true, pages: [], createdAt: now, updatedAt: now })
    setSelectedId(id)
    setSelectedPageId(null)
  }

  function handleDeleteNotebook(id: string) {
    deleteNotebook(id)
    if (selectedId() === id) {
      setSelectedId(null)
      setSelectedPageId(null)
    }
  }

  function handleAddPage() {
    const nb = selectedNotebook()
    if (!nb) return
    const page: NotebookPage = {
      id: mkPageId(),
      title: '新しいページ',
      body: '',
      order: nb.pages.length,
    }
    const pages = [...nb.pages, page]
    updateNotebook(nb.id!, { pages, updatedAt: new Date() })
    setSelectedPageId(page.id)
  }

  function handleDeletePage(pageId: string) {
    const nb = selectedNotebook()
    if (!nb) return
    const pages = nb.pages.filter((p) => p.id !== pageId).map((p, i) => ({ ...p, order: i }))
    updateNotebook(nb.id!, { pages, updatedAt: new Date() })
    setSelectedPageId(pages[0]?.id ?? null)
  }

  function patchPage(field: 'title' | 'body', value: string) {
    const nb = selectedNotebook()
    if (!nb) return
    const pages = nb.pages.map((p) =>
      p.id === selectedPageId() ? { ...p, [field]: value } : p
    )
    patchPagesLocal(nb.id!, pages)
    schedulePageSave(nb.id!, pages)
  }

  function handleBodyKeyDown(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (event.key === 'Enter' && event.ctrlKey && !event.altKey && !event.metaKey) {
      const textarea = event.currentTarget
      const next = escapeDialogueToNextParagraph(textarea.value, textarea.selectionStart)
      if (next) {
        event.preventDefault()
        patchPage('body', next.value)
        queueMicrotask(() => textarea.setSelectionRange(next.cursor, next.cursor))
      }
      return
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      setViewMode('edit')
      setNotionCalloutOpen(true)
      return
    }

    if (event.key !== 'Enter' || event.ctrlKey || event.altKey || event.metaKey) return
    const textarea = event.currentTarget
    const indent = dialogueIndent(textarea.value, textarea.selectionStart)
    if (indent === null) return

    event.preventDefault()
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextValue = `${textarea.value.slice(0, start)}\n${indent}${textarea.value.slice(end)}`
    const nextCursor = start + 1 + indent.length
    patchPage('body', nextValue)
    queueMicrotask(() => textarea.setSelectionRange(nextCursor, nextCursor))
  }

  function filteredCharacters() {
    const q = characterSearch().trim().toLowerCase()
    return state.nutrients.filter((item) => !q || `${item.name} ${item.description}`.toLowerCase().includes(q))
  }

  function triggerAltD() {
    const eventInit = { key: 'd', code: 'KeyD', altKey: true, bubbles: true, cancelable: true }
    bodyTextareaRef?.dispatchEvent(new KeyboardEvent('keydown', eventInit))
    window.dispatchEvent(new KeyboardEvent('keydown', eventInit))
  }

  function insertCharacterLine(name: string, options: { fromLineEnd?: boolean; triggerMic?: boolean } = {}) {
    const page = selectedPage()
    if (!page) return
    const text = formatDialogueLine(name)
    const textarea = bodyTextareaRef
    const current = page.body
    const selectionStart = textarea?.selectionStart ?? current.length
    const lineEndIndex = current.indexOf('\n', selectionStart)
    const start = options.fromLineEnd ? (lineEndIndex === -1 ? current.length : lineEndIndex) : selectionStart
    const end = options.fromLineEnd ? start : (textarea?.selectionEnd ?? current.length)
    const before = current.slice(0, start)
    const after = current.slice(end)
    const separator = before && !before.endsWith('\n') ? '\n' : ''
    const nextBody = `${before}${separator}${text}${after}`
    const cursor = before.length + separator.length + text.length - 1
    setViewMode('edit')
    patchPage('body', nextBody)
    setCharacterPickerOpen(false)
    setCharacterSearch('')
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(cursor, cursor)
      if (options.triggerMic) window.setTimeout(triggerAltD, 200)
    })
  }

  function insertBlockAtCursor(text: string) {
    const page = selectedPage()
    if (!page) return
    const textarea = bodyTextareaRef
    const current = page.body
    const start = textarea?.selectionStart ?? current.length
    const end = textarea?.selectionEnd ?? current.length
    const before = current.slice(0, start)
    const after = current.slice(end)
    const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n\n' : '\n'
    const nextBody = `${before}${prefix}${text}${suffix}${after}`
    const nextCursor = before.length + prefix.length + text.length
    setViewMode('edit')
    patchPage('body', nextBody)
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function handleRenameNotebook(title: string) {
    const id = selectedId()
    if (!id) return
    updateNotebook(id, { title, updatedAt: new Date() })
  }

  async function sendSelectedPageToKanban() {
    const nb = selectedNotebook()
    const page = selectedPage()
    if (!nb || !page || sendStatus() === 'sending') return
    setSendStatus('sending')
    try {
      const now = new Date()
      await sendMemoToKanbanMemoInbox({
        id: `${nb.id}-${page.id}`,
        title: `${nb.title} / ${page.title || '無題'}`,
        body: page.body,
        tags: [],
        createdAt: now,
        updatedAt: now,
      })
      setSendStatus('sent')
    } catch (error) {
      console.warn('[Kanban MemoInbox] notebook page send failed:', error)
      setSendStatus('error')
    }
  }

  function selectNotebookForShelf(id: string) {
    setSelectedId(id)
    setSelectedPageId(null)
    setSendStatus('idle')
  }

  const MobileNotebookShelf = () => (
    <div class="flex-1 overflow-y-auto bg-white">
      <section class="w-full bg-white">
        <div class="flex items-center justify-between px-4 py-4 border-b border-nacc-border">
          <h1 class="text-xl font-extrabold text-nacc-dark tracking-tight">ノートブック</h1>
          <button
            class="rounded-lg bg-nacc-gold px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-[.98]"
            onClick={handleAddNotebook}
          >
            + 新規
          </button>
        </div>

        <div>
          <For each={state.notebooks}>
            {(notebook) => (
              <button
                class="w-full border-b border-[#f0f0f0] px-4 py-4 text-left transition-colors active:bg-[#f5f0e8]"
                classList={{ 'bg-[#f5f0e8]': selectedId() === notebook.id }}
                onClick={() => selectNotebookForShelf(notebook.id!)}
              >
                <div class="flex items-center gap-4">
                  <div class="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-[#0b1f3a] text-white shadow-sm flex items-center justify-center text-2xl font-black">
                    <Show when={notebook.cover} fallback={<span>{notebook.title.slice(0, 1)}</span>}>
                      <img src={notebook.cover} alt="" class="h-full w-full object-cover" />
                    </Show>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[1.02rem] font-extrabold leading-tight text-nacc-dark">{notebook.title}</p>
                    <p class="mt-1 text-sm font-medium text-gray-400">{notebook.pages.length}ページ</p>
                  </div>
                </div>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="w-full bg-white/95 border-t border-nacc-border">
        <Show
          when={selectedNotebook()}
          fallback={
            <div class="px-4 py-6 text-center text-sm text-gray-300">
              ノートブックを選択してください
            </div>
          }
        >
          {(nb) => (
            <div>
              <div class="px-4 py-4">
                <div class="text-xs text-gray-400">選択中のノートブック</div>
                <h2 class="mt-1 truncate text-lg font-extrabold text-nacc-dark">{nb().title}</h2>
              </div>
              <div class="px-4 pb-5">
                <Show
                  when={nb().pages.length > 0}
                  fallback={
                    <button
                      class="w-full rounded-xl border border-dashed border-nacc-border bg-white px-4 py-5 text-left text-sm font-semibold text-gray-400"
                      onClick={handleAddPage}
                    >
                      + ページを追加
                    </button>
                  }
                >
                  <For each={nb().pages.slice().sort((a, b) => a.order - b.order)}>
                    {(page) => (
                      <button
                        class="mb-2 w-full rounded-xl border border-nacc-border bg-white px-3 py-3 text-left shadow-sm active:scale-[.99]"
                        onClick={() => {
                          setSelectedPageId(page.id)
                          setSendStatus('idle')
                        }}
                      >
                        <p class="truncate text-sm font-bold text-nacc-dark">{page.title || '無題'}</p>
                        <p class="mt-1 truncate text-xs text-gray-400">{page.sourcePath ?? '手書きページ'}</p>
                      </button>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </section>
    </div>
  )

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 shrink-0" fill="none">
      <path
        d="M20.5 3.5 3.75 10.9c-.78.34-.75 1.46.05 1.76l6.18 2.31 2.32 6.19c.3.8 1.42.83 1.76.05L21.5 4.5c.27-.62-.38-1.27-1-.99Z"
        fill="currentColor"
      />
      <path d="m10 15 4.2-4.2" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" />
    </svg>
  )

  return (
    <div class="flex h-full overflow-hidden">
      <Show when={isMobile()}>
        <div class="flex-1 flex flex-col overflow-hidden bg-nacc-light">
          <Show
            when={selectedNotebook()}
            fallback={
              <div class="flex-1 flex flex-col items-center justify-center text-[#ccc] gap-3 px-6 text-center">
                <span class="text-5xl">📓</span>
                <span class="text-sm">左上メニューからノートブックを選択してください</span>
              </div>
            }
          >
            {(nb) => (
              <Show
                when={selectedPage()}
                fallback={<MobileNotebookShelf />}
              >
                {(page) => (
                  <div class="flex-1 flex flex-col overflow-hidden bg-nacc-light">
                    <div class="px-4 py-3 border-b border-nacc-border bg-white shrink-0 flex items-center gap-3">
                      <button
                        class="text-sm px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-700"
                        onClick={() => setSelectedPageId(null)}
                      >
                        戻る
                      </button>
                      <div class="min-w-0">
                        <div class="text-xs text-gray-400 truncate">{nb().title}</div>
                        <div class="text-sm font-semibold text-nacc-dark truncate">{page().title || '無題'}</div>
                      </div>
                      <button
                        class="ml-auto text-xs px-3 py-1.5 rounded-lg bg-[#0b1f3a] text-white"
                        onClick={() => setViewMode((mode) => (mode === 'preview' ? 'edit' : 'preview'))}
                      >
                        {viewMode() === 'preview' ? '編集' : '表示'}
                      </button>
                      <button
                        class="text-xs px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-700"
                        onClick={() => {
                          setViewMode('edit')
                          setCharacterPickerOpen(true)
                        }}
                      >
                        Character
                      </button>
                      <button
                        class="kanban-send-btn"
                        type="button"
                        disabled={sendStatus() === 'sending'}
                        onClick={sendSelectedPageToKanban}
                        title="カンバンのCodex相談Inboxへ送る"
                      >
                        <SendIcon />
                        <span>{sendStatus() === 'sending' ? '送信中...' : '送信'}</span>
                      </button>
                    </div>
                    <Show when={sendStatus() === 'sent' || sendStatus() === 'error'}>
                      <div class="px-4 pt-2 text-right text-xs">
                        <span class={sendStatus() === 'sent' ? 'text-green-600' : 'text-red-500'}>
                          {sendStatus() === 'sent' ? '送信済み' : kanbanMemoInboxEnabled ? '送信失敗' : 'Firebase未設定'}
                        </span>
                      </div>
                    </Show>
                    <div class="flex-1 flex flex-col overflow-hidden p-4">
                      <input
                        type="text"
                        class="text-xl font-bold text-nacc-dark border-none outline-none bg-transparent w-full mb-3"
                        placeholder="ページタイトル"
                        value={page().title}
                        onInput={(e) => patchPage('title', e.currentTarget.value)}
                      />
                      <Show
                        when={viewMode() === 'preview'}
                        fallback={
                          <>
                            <CharacterInputSection onInsert={insertCharacterLine} />
                            <CalloutInputSection onInsert={insertBlockAtCursor} />
                            <textarea
                              ref={bodyTextareaRef}
                              class="flex-1 text-sm font-mono text-nacc-dark border border-nacc-border outline-none bg-white rounded-xl p-4 resize-none leading-relaxed shadow-sm focus:ring-1 focus:ring-nacc-gold/30"
                              placeholder="ここに内容を入力..."
                              value={page().body}
                              onInput={(e) => patchPage('body', e.currentTarget.value)}
                              onKeyDown={handleBodyKeyDown}
                            />
                          </>
                        }
                      >
                        <div class="flex-1 overflow-y-auto bg-white rounded-xl border border-nacc-border shadow-sm px-5 py-4">
                          <MarkdownView markdown={page().body} />
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </Show>
            )}
          </Show>
        </div>
      </Show>
      <Show when={!isMobile()}>
      {/* ── ノートブック一覧 ── */}
      <div class="w-52 shrink-0 border-r border-nacc-border bg-white flex flex-col">
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-nacc-border">
          <span class="text-sm font-semibold text-nacc-dark">ノートブック</span>
          <button
            class="text-xs px-2 py-1 rounded bg-nacc-gold text-white font-semibold hover:opacity-80"
            onClick={handleAddNotebook}
          >
            + 新規
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <Show
            when={state.notebooks.length > 0}
            fallback={
              <div class="flex flex-col items-center justify-center h-32 text-[#ccc] gap-2 text-xs">
                <span class="text-3xl">📓</span>
                <span>ノートがありません</span>
              </div>
            }
          >
            <For each={state.notebooks}>
              {(nb) => (
                <div
                  class="w-full text-left px-4 py-3 border-b border-[#f0f0f0] group relative cursor-pointer"
                  classList={{
                    'bg-[#f5f0e8]': selectedId() === nb.id,
                    'hover:bg-[#f9f8f6]': selectedId() !== nb.id,
                  }}
                  onClick={() => {
                    setSelectedId(nb.id!)
                    setSelectedPageId(nb.pages[0]?.id ?? null)
                    setPagePanelOpen(false)
                  }}
                >
                  <div class="flex items-center gap-2.5 pr-5">
                    <div class="w-10 h-12 rounded-md overflow-hidden bg-[#0b1f3a] shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      <Show when={nb.cover} fallback={<span>{nb.title.slice(0, 1)}</span>}>
                        <img src={nb.cover} alt="" class="w-full h-full object-cover" />
                      </Show>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-nacc-dark truncate">{nb.title}</p>
                      <p class="text-xs text-[#999] mt-0.5">{nb.pages.length}ページ</p>
                    </div>
                  </div>
                  <button
                    class="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                    onClick={(e) => { e.stopPropagation(); handleDeleteNotebook(nb.id!) }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>

      {/* ── ページ一覧 + エディタ ── */}
      <Show
        when={selectedNotebook()}
        fallback={
          <div class="flex-1 flex flex-col items-center justify-center text-[#ccc] gap-3">
            <span class="text-5xl">📓</span>
            <span class="text-sm">ノートを選択してください</span>
            <button
              class="mt-1 text-xs px-3 py-1.5 rounded-lg bg-nacc-gold text-white hover:opacity-80"
              onClick={handleAddNotebook}
            >
              + 新規ノートを作成
            </button>
          </div>
        }
      >
        {(nb) => (
          <>
            {/* ページエディタ */}
            <div class="flex-1 flex flex-col overflow-hidden relative">
              <Show when={pagePanelOpen()}>
                <div class="absolute inset-0 z-30 bg-black/20" onClick={() => setPagePanelOpen(false)} />
                <div class="absolute left-0 top-0 bottom-0 z-40 w-64 max-w-[78vw] border-r border-nacc-border bg-nacc-light shadow-2xl flex flex-col">
                  <div class="px-3 py-2.5 border-b border-nacc-border flex items-center gap-2">
                    <input
                      type="text"
                      class="min-w-0 flex-1 text-xs font-semibold text-nacc-dark bg-transparent border-none outline-none truncate"
                      value={nb().title}
                      onInput={(e) => handleRenameNotebook(e.currentTarget.value)}
                    />
                    <button
                      class="w-7 h-7 rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 shrink-0"
                      onClick={() => setPagePanelOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                    <For each={nb().pages.slice().sort((a, b) => a.order - b.order)}>
                      {(page) => (
                        <div
                          class="group relative flex items-center px-2 py-2 rounded-lg cursor-pointer text-xs"
                          classList={{
                            'bg-white shadow-sm text-nacc-dark font-medium': selectedPageId() === page.id,
                            'text-gray-500 hover:bg-white/60': selectedPageId() !== page.id,
                          }}
                          onClick={() => {
                            setSelectedPageId(page.id)
                            setSendStatus('idle')
                            setPagePanelOpen(false)
                          }}
                        >
                          <span class="flex-1 truncate">📄 {page.title || '無題'}</span>
                          <button
                            class="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 ml-1 transition-all shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id) }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </For>
                    <button
                      class="mt-1 flex items-center gap-1 px-2 py-2 text-xs text-gray-400 hover:text-nacc-gold transition-colors"
                      onClick={() => {
                        handleAddPage()
                        setPagePanelOpen(false)
                      }}
                    >
                      + ページを追加
                    </button>
                  </div>
                </div>
              </Show>
              <Show
                when={selectedPage()}
                fallback={
                  <div class="flex-1 flex flex-col items-center justify-center text-[#ccc] gap-2">
                    <span class="text-4xl">📄</span>
                    <span class="text-sm">ページを選択または追加してください</span>
                    <button
                      class="mt-2 text-xs px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-600 hover:bg-gray-50"
                      onClick={() => setPagePanelOpen(true)}
                    >
                      ページ一覧
                    </button>
                    <button
                      class="mt-2 text-xs px-3 py-1.5 rounded-lg bg-nacc-gold text-white hover:opacity-80"
                      onClick={handleAddPage}
                    >
                      + 最初のページを追加
                    </button>
                  </div>
                }
              >
                {(page) => (
                  <div class="flex-1 flex flex-col overflow-hidden p-6">
                    <div class="mb-3 flex items-center justify-between gap-3">
                      <button
                        class="text-xs px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-600 hover:bg-gray-50"
                        onClick={() => setPagePanelOpen(true)}
                      >
                        ページ一覧
                      </button>
                      <span class="text-xs text-gray-400 truncate">{nb().title}</span>
                      <button
                        class="text-xs px-3 py-1.5 rounded-lg bg-[#0b1f3a] text-white"
                        onClick={() => setViewMode((mode) => (mode === 'preview' ? 'edit' : 'preview'))}
                      >
                        {viewMode() === 'preview' ? '編集' : '表示'}
                      </button>
                      <button
                        class="text-xs px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-700"
                        onClick={() => {
                          setViewMode('edit')
                          setCharacterPickerOpen(true)
                        }}
                      >
                        Character
                      </button>
                      <button
                        class="kanban-send-btn"
                        type="button"
                        disabled={sendStatus() === 'sending'}
                        onClick={sendSelectedPageToKanban}
                        title="カンバンのCodex相談Inboxへ送る"
                      >
                        <SendIcon />
                        <span>{sendStatus() === 'sending' ? '送信中...' : '送信'}</span>
                      </button>
                    </div>
                    <Show when={sendStatus() === 'sent' || sendStatus() === 'error'}>
                      <div class="-mt-1 mb-2 text-right text-xs">
                        <span class={sendStatus() === 'sent' ? 'text-green-600' : 'text-red-500'}>
                          {sendStatus() === 'sent' ? '送信済み' : kanbanMemoInboxEnabled ? '送信失敗' : 'Firebase未設定'}
                        </span>
                      </div>
                    </Show>
                    <input
                      type="text"
                      class="text-xl font-bold text-nacc-dark border-none outline-none bg-transparent w-full mb-3"
                      placeholder="ページタイトル"
                      value={page().title}
                      onInput={(e) => patchPage('title', e.currentTarget.value)}
                    />
                    <Show
                      when={viewMode() === 'preview'}
                      fallback={
                        <>
                          <CharacterInputSection onInsert={insertCharacterLine} />
                          <CalloutInputSection onInsert={insertBlockAtCursor} />
                          <textarea
                            ref={bodyTextareaRef}
                            class="flex-1 text-sm font-mono text-nacc-dark border border-nacc-border outline-none bg-white rounded-xl p-4 resize-none leading-relaxed shadow-sm focus:ring-1 focus:ring-nacc-gold/30"
                            placeholder="ここに内容を入力..."
                            value={page().body}
                            onInput={(e) => patchPage('body', e.currentTarget.value)}
                            onKeyDown={handleBodyKeyDown}
                          />
                        </>
                      }
                    >
                      <div class="flex-1 overflow-y-auto bg-white rounded-xl border border-nacc-border shadow-sm px-5 py-4">
                        <MarkdownView markdown={page().body} />
                      </div>
                    </Show>
                    <div class="text-xs text-gray-400 text-right mt-2">
                      自動保存 — {new Date(nb().updatedAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </>
        )}
      </Show>
      </Show>
      <Show when={characterPickerOpen()}>
        <div class="fixed inset-0 z-60 bg-black/30" onClick={() => setCharacterPickerOpen(false)} />
        <div
          class="fixed bottom-0 left-0 right-0 z-70 bg-white rounded-t-2xl shadow-2xl flex flex-col"
          style={{ 'max-height': '64vh' }}
        >
          <div class="flex items-center justify-between px-5 pt-4 pb-0 shrink-0">
            <span class="font-semibold text-sm">Characterを挿入</span>
            <button
              class="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              onClick={() => setCharacterPickerOpen(false)}
            >
              ✕
            </button>
          </div>
          <div class="px-5 pt-3 pb-0 shrink-0">
            <input
              type="search"
              class="w-full text-sm bg-gray-50 border border-nacc-border rounded-lg px-3 py-2 outline-none"
              placeholder="Characterを検索..."
              value={characterSearch()}
              onInput={(e) => setCharacterSearch(e.currentTarget.value)}
            />
          </div>
          <div class="overflow-y-auto flex-1 p-3">
            <For each={filteredCharacters()}>
              {(character) => (
                <button
                  class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f9f8f6] transition-colors"
                  onClick={() => insertCharacterLine(character.name)}
                >
                  <span class="w-8 h-8 rounded-full bg-[#e8dfd0] text-nacc-dark flex items-center justify-center text-xs font-bold">C</span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm text-nacc-dark font-semibold truncate">{character.name.replace(/\s+Characters?$/i, '').trim() || character.name}</span>
                    <span class="block text-xs text-gray-400 truncate">{character.description}</span>
                  </span>
                </button>
              )}
            </For>
            <Show when={filteredCharacters().length === 0}>
              <div class="text-center text-sm text-gray-300 py-8">Characterが見つかりません</div>
            </Show>
          </div>
        </div>
      </Show>
      <NotionCalloutQuickInsert
        open={notionCalloutOpen()}
        onClose={() => setNotionCalloutOpen(false)}
        onInsert={insertBlockAtCursor}
      />
    </div>
  )
}

export default PageNotebook
