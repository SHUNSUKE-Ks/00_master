import { type Component, createSignal, For, Show } from 'solid-js'
import type { Tag } from '../types'
import { PRODUCTS } from '../db/products'
import { NUTRIENTS } from '../db/nutrients'
import { state, setState, addMemo, updateMemo, deleteMemo } from '../store'
import { kanbanMemoInboxEnabled, sendMemoToKanbanMemoInbox, sendScenarioFragmentToDevStudio } from '../db/firebase'
import CharacterInputSection from '../components/CharacterInputSection'
import CalloutInputSection from '../components/CalloutInputSection'
import ScenarioInputSection from '../components/ScenarioInputSection'
import NotionCalloutQuickInsert from '../components/NotionCalloutQuickInsert'
import { dialogueIndent, escapeDialogueToNextParagraph, formatDialogueLine } from '../utils/dialogueFormat'
import { cursorOffsetForScenarioBlock, formatScenarioBlock, type ScenarioBlockKind } from '../utils/scenarioFormat'

let saveTimer: ReturnType<typeof setTimeout>

function scheduleFirestoreSave(id: string, patch: Parameters<typeof updateMemo>[1]) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => updateMemo(id, patch), 800)
}

function formatCurrentLine(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string
): { value: string; selectionStart: number; selectionEnd: number } {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const lineEndIndex = value.indexOf('\n', selectionStart)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
  const line = value.slice(lineStart, lineEnd)
  const cleanLine = line.replace(/^(#{1,6}\s+|- |\d+\.\s+)/, '')
  const nextLine = `${prefix}${cleanLine}`
  const nextValue = `${value.slice(0, lineStart)}${nextLine}${value.slice(lineEnd)}`
  const delta = nextLine.length - line.length

  return {
    value: nextValue,
    selectionStart: Math.max(lineStart + prefix.length, selectionStart + delta),
    selectionEnd: Math.max(lineStart + prefix.length, selectionEnd + delta),
  }
}


const PageMemo: Component = () => {
  const [selectedId, setSelectedId] = createSignal<string | null>(state.selectedMemoId ?? state.memos[0]?.id ?? null)
  const isMobile = () => window.innerWidth < 768
  const [mobilePanel, setMobilePanel] = createSignal<'list' | 'editor'>('list')
  const [sendStatus, setSendStatus] = createSignal<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [devStudioStatus, setDevStudioStatus] = createSignal<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [devStudioInfo, setDevStudioInfo] = createSignal<{ id?: string; sentAt?: string; message?: string } | null>(null)
  let bodyTextareaRef: HTMLTextAreaElement | undefined

  const [tagPickerOpen, setTagPickerOpen] = createSignal(false)
  const [tagPickerTab, setTagPickerTab] = createSignal<'product' | 'nutrient'>('product')
  const [tagPickerSelected, setTagPickerSelected] = createSignal<Tag[]>([])
  const [tagPickerSearch, setTagPickerSearch] = createSignal('')
  const [characterPickerOpen, setCharacterPickerOpen] = createSignal(false)
  const [characterSearch, setCharacterSearch] = createSignal('')
  const [notionCalloutOpen, setNotionCalloutOpen] = createSignal(false)

  const selected = () => state.memos.find((m) => m.id === selectedId())

  function patchLocal(id: string, patch: Parameters<typeof updateMemo>[1]) {
    setState('memos', (prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  function handleTextInput(field: 'title' | 'body', value: string) {
    const id = selectedId()
    if (!id) return
    const now = new Date()
    const patch = { [field]: value, updatedAt: now }
    patchLocal(id, patch)
    scheduleFirestoreSave(id, patch)
  }

  function handleBodyKeyDown(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const shortcuts: Record<string, ScenarioBlockKind | undefined> = {
        q: 'pillar',
        w: 'direction',
        e: 'dialogue',
      }
      const kind = shortcuts[event.key.toLowerCase()]
      if (kind) {
        console.info('[NoteStory Shortcut] scenario memo', {
          key: event.key,
          code: event.code,
          kind,
          isTrusted: event.isTrusted,
        })
        event.preventDefault()
        insertScenarioBlock(kind)
        return
      }
    }

    if (event.key === 'Enter' && event.ctrlKey && !event.altKey && !event.metaKey) {
      const textarea = event.currentTarget
      const next = escapeDialogueToNextParagraph(textarea.value, textarea.selectionStart)
      if (next) {
        event.preventDefault()
        handleTextInput('body', next.value)
        queueMicrotask(() => textarea.setSelectionRange(next.cursor, next.cursor))
      }
      return
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      setNotionCalloutOpen(true)
      return
    }

    if (event.key === 'Enter' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const textarea = event.currentTarget
      const indent = dialogueIndent(textarea.value, textarea.selectionStart)
      if (indent !== null) {
        event.preventDefault()
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const nextValue = `${textarea.value.slice(0, start)}\n${indent}${textarea.value.slice(end)}`
        const nextCursor = start + 1 + indent.length
        handleTextInput('body', nextValue)
        queueMicrotask(() => textarea.setSelectionRange(nextCursor, nextCursor))
      }
      return
    }

    if (!event.ctrlKey || event.altKey || event.metaKey) return

    const prefixes: Record<string, string | undefined> = {
      '1': '# ',
      '2': '## ',
      '3': '### ',
      '7': '- ',
      '8': '1. ',
    }
    const prefix = prefixes[event.key]
    if (!prefix) return

    event.preventDefault()
    const textarea = event.currentTarget
    const next = formatCurrentLine(textarea.value, textarea.selectionStart, textarea.selectionEnd, prefix)
    handleTextInput('body', next.value)
    queueMicrotask(() => textarea.setSelectionRange(next.selectionStart, next.selectionEnd))
  }

  async function addNewMemo() {
    const now = new Date()
    const data = { title: 'scenarioノート', body: '', tags: [], createdAt: now, updatedAt: now }
    const id = await addMemo(data)
    setSelectedId(id)
    if (isMobile()) setMobilePanel('editor')
  }

  function selectMemo(id: string) {
    setSelectedId(id)
    setSendStatus('idle')
    setDevStudioStatus('idle')
    setDevStudioInfo(null)
    if (isMobile()) setMobilePanel('editor')
  }

  async function sendSelectedToKanban() {
    const memo = selected()
    if (!memo || sendStatus() === 'sending') return
    setSendStatus('sending')
    try {
      await sendMemoToKanbanMemoInbox(memo)
      setSendStatus('sent')
    } catch (error) {
      console.warn('[Kanban MemoInbox] send failed:', error)
      setSendStatus('error')
    }
  }

  async function sendSelectedToDevStudio() {
    const memo = selected()
    if (!memo || devStudioStatus() === 'sending') return
    setDevStudioStatus('sending')
    setDevStudioInfo(null)
    try {
      const item = await sendScenarioFragmentToDevStudio({
        sourceMemoId: memo.id,
        title: memo.title || 'scenario fragment',
        body: memo.body,
        tags: memo.tags.map((tag) => tag.name),
      })
      setDevStudioStatus('sent')
      setDevStudioInfo({ id: item.id, sentAt: item.updatedAt })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('[DevStudio scenario_fragment] memo send failed:', error)
      setDevStudioStatus('error')
      setDevStudioInfo({ message })
    }
  }

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 shrink-0" fill="none">
      <path
        d="M20.5 3.5 3.75 10.9c-.78.34-.75 1.46.05 1.76l6.18 2.31 2.32 6.19c.3.8 1.42.83 1.76.05L21.5 4.5c.27-.62-.38-1.27-1-.99Z"
        fill="currentColor"
      />
      <path d="m10 15 4.2-4.2" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" />
    </svg>
  )

  function removeTag(tagName: string) {
    const id = selectedId()
    if (!id) return
    const tags = selected()?.tags.filter((t) => t.name !== tagName) ?? []
    patchLocal(id, { tags })
    updateMemo(id, { tags })
  }

  function confirmTagPicker() {
    const id = selectedId()
    const curr = selected()
    if (!id || !curr) return
    const existing = curr.tags.map((t) => t.name)
    const toAdd = tagPickerSelected().filter((t) => !existing.includes(t.name))
    const tags = [...curr.tags, ...toAdd]
    patchLocal(id, { tags })
    updateMemo(id, { tags })
    setTagPickerOpen(false)
    setTagPickerSelected([])
    setTagPickerSearch('')
  }

  function closeTagPicker() {
    setTagPickerOpen(false)
    setTagPickerSelected([])
    setTagPickerSearch('')
  }

  function triggerAltD() {
    const eventInit = { key: 'd', code: 'KeyD', altKey: true, bubbles: true, cancelable: true }
    bodyTextareaRef?.dispatchEvent(new KeyboardEvent('keydown', eventInit))
    window.dispatchEvent(new KeyboardEvent('keydown', eventInit))
  }

  function insertCharacterLine(name: string, options: { fromLineEnd?: boolean; triggerMic?: boolean } = {}) {
    const memo = selected()
    if (!memo?.id) return
    const text = formatDialogueLine(name)
    const textarea = bodyTextareaRef
    const escaped = textarea ? escapeDialogueToNextParagraph(memo.body, textarea.selectionStart) : null
    const current = escaped?.value ?? memo.body
    const selectionStart = escaped?.cursor ?? textarea?.selectionStart ?? current.length
    const lineEndIndex = current.indexOf('\n', selectionStart)
    const start = options.fromLineEnd ? (lineEndIndex === -1 ? current.length : lineEndIndex) : selectionStart
    const end = options.fromLineEnd || escaped ? start : (textarea?.selectionEnd ?? current.length)
    const before = current.slice(0, start)
    const after = current.slice(end)
    const separator = before && !before.endsWith('\n') ? '\n' : ''
    const nextBody = `${before}${separator}${text}${after}`
    const cursor = before.length + separator.length + text.length - 1
    handleTextInput('body', nextBody)
    setCharacterPickerOpen(false)
    setCharacterSearch('')
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(cursor, cursor)
      if (options.triggerMic) window.setTimeout(triggerAltD, 200)
    })
  }

  function insertBlockAtCursor(text: string) {
    const memo = selected()
    if (!memo?.id) return
    const textarea = bodyTextareaRef
    const current = memo.body
    const start = textarea?.selectionStart ?? current.length
    const end = textarea?.selectionEnd ?? current.length
    const before = current.slice(0, start)
    const after = current.slice(end)
    const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n\n' : '\n'
    const nextBody = `${before}${prefix}${text}${suffix}${after}`
    const nextCursor = before.length + prefix.length + text.length
    handleTextInput('body', nextBody)
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function insertScenarioBlock(kind: ScenarioBlockKind) {
    const memo = selected()
    if (!memo?.id) return
    const text = formatScenarioBlock(kind)
    const textarea = bodyTextareaRef
    const escaped = textarea ? escapeDialogueToNextParagraph(memo.body, textarea.selectionStart) : null
    const current = escaped?.value ?? memo.body
    const start = escaped?.cursor ?? textarea?.selectionStart ?? current.length
    const end = escaped ? start : textarea?.selectionEnd ?? current.length
    const before = current.slice(0, start)
    const after = current.slice(end)
    const prefix = before && !before.endsWith('\n') ? '\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n' : ''
    const nextBody = `${before}${prefix}${text}${suffix}${after}`
    const cursor = before.length + prefix.length + cursorOffsetForScenarioBlock(kind)
    handleTextInput('body', nextBody)
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(cursor, cursor)
    })
  }

  const filteredCharacters = () => {
    const q = characterSearch().trim().toLowerCase()
    return state.nutrients.filter((item) => !q || `${item.name} ${item.description}`.toLowerCase().includes(q))
  }

  const List = () => (
    <div class="w-64 shrink-0 border-r border-nacc-border bg-white flex flex-col overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-nacc-border">
        <span class="text-sm font-semibold text-nacc-dark">メモ</span>
        <button
          class="text-xs px-2 py-1 rounded bg-nacc-gold text-white font-semibold hover:opacity-80"
          onClick={addNewMemo}
        >
          + 新規
        </button>
      </div>
      <Show
        when={state.memos.length > 0}
        fallback={
          <div class="flex-1 flex flex-col items-center justify-center text-[#ccc] gap-2 text-xs">
            <span class="text-3xl">📝</span>
            <span>メモがありません</span>
          </div>
        }
      >
        <div class="flex-1 overflow-y-auto">
          <For each={state.memos}>
            {(memo) => (
              <button
                class="blog-list-item w-full text-left px-4 py-3 border-b border-[#f0f0f0]"
                classList={{ active: selectedId() === memo.id }}
                onClick={() => selectMemo(memo.id!)}
              >
                <p class="text-sm font-medium text-nacc-dark truncate">{memo.title || '無題'}</p>
                <Show when={memo.tags.length > 0}>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <For each={memo.tags.slice(0, 2)}>
                      {(t) => (
                        <span
                          class="text-xs rounded-full px-1.5 py-0.5"
                          classList={{
                            'bg-blue-50 text-blue-600':   t.type === 'product',
                            'bg-green-50 text-green-700': t.type === 'nutrient',
                          }}
                        >
                          {t.type === 'product' ? '📦' : '🌿'} {t.name.length > 8 ? t.name.slice(0, 8) + '…' : t.name}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
                <p class="text-xs text-[#999] mt-0.5">
                  {new Date(memo.updatedAt).toLocaleDateString('ja-JP')}
                </p>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )

  const Editor = () => (
    <div class="flex-1 flex flex-col overflow-hidden">
      <Show when={isMobile()}>
        <button class="mobile-back" onClick={() => setMobilePanel('list')}>
          ← メモ一覧
        </button>
      </Show>
      <Show
        when={selected()}
        fallback={
          <div class="flex items-center justify-center h-full text-[#ccc] text-sm">
            メモを選択してください
          </div>
        }
      >
        {(memo) => (
          <div class="flex flex-col h-full overflow-hidden">
            <div class="min-h-[55px] px-5 py-2 border-b border-nacc-border bg-white flex items-center justify-end gap-3 shrink-0">
              <Show when={sendStatus() === 'sent'}>
                <span class="text-xs text-green-600">送信済み</span>
              </Show>
              <Show when={sendStatus() === 'error'}>
                <span class="text-xs text-red-500">
                  {kanbanMemoInboxEnabled ? '送信失敗' : 'Firebase未設定'}
                </span>
              </Show>
              <Show when={devStudioStatus() === 'sent'}>
                <span class="text-xs text-green-600" title={devStudioInfo()?.id}>
                  sent_to_devstudio {devStudioInfo()?.sentAt}
                </span>
              </Show>
              <Show when={devStudioStatus() === 'error'}>
                <span class="text-xs text-red-500" title={devStudioInfo()?.message}>
                  DevStudio送信失敗
                </span>
              </Show>
              <button
                class="kanban-send-btn"
                type="button"
                disabled={sendStatus() === 'sending'}
                onClick={sendSelectedToKanban}
                title="カンバンのCodex相談Inboxへ送る"
              >
                <SendIcon />
                <span>{sendStatus() === 'sending' ? '送信中...' : '送信'}</span>
              </button>
              <button
                class="devstudio-send-btn"
                type="button"
                disabled={devStudioStatus() === 'sending'}
                onClick={sendSelectedToDevStudio}
                title="現在のメモをscenario_fragmentとしてNovelEngine DevStudioへ送る"
              >
                <SendIcon />
                <span>{devStudioStatus() === 'sending' ? '送信中...' : 'DevStudioへ送信'}</span>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              <input
                type="text"
                class="text-xl font-bold text-nacc-dark border-none outline-none bg-transparent w-full"
                placeholder="タイトル"
                value={memo().title}
                onInput={(e) => handleTextInput('title', e.currentTarget.value)}
              />

              <div class="flex flex-wrap gap-1.5 items-center">
                <For each={memo().tags}>
                  {(tag) => (
                    <span
                      class="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border font-medium"
                      classList={{
                        'bg-blue-50 text-blue-700 border-blue-200':   tag.type === 'product',
                        'bg-green-50 text-green-700 border-green-200': tag.type === 'nutrient',
                      }}
                    >
                      {tag.type === 'product' ? '📦' : '🌿'} {tag.name}
                      <button
                        class="ml-1 opacity-50 hover:opacity-100 text-xs leading-none"
                        onClick={() => removeTag(tag.name)}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </For>
                <button
                  class="text-xs px-2 py-1 rounded-full border border-dashed border-nacc-gold text-nacc-gold hover:bg-[#f5f0e8]"
                  onClick={() => setTagPickerOpen(true)}
                >
                  + タグ追加
                </button>
                <button
                  class="text-xs px-2 py-1 rounded-full border border-dashed border-nacc-dark text-nacc-dark hover:bg-[#f5f0e8]"
                  onClick={() => setCharacterPickerOpen(true)}
                >
                  + Character
                </button>
              </div>

              <ScenarioInputSection onInsert={insertScenarioBlock} />
              <CharacterInputSection onInsert={insertCharacterLine} />
              <CalloutInputSection onInsert={insertBlockAtCursor} />

              <textarea
                ref={bodyTextareaRef}
                class="flex-1 min-h-64 text-sm font-mono text-nacc-dark border border-nacc-border outline-none bg-white rounded-xl p-4 resize-none leading-relaxed shadow-sm focus:ring-1 focus:ring-nacc-gold/30"
                placeholder="メモを入力..."
                value={memo().body}
                onInput={(e) => handleTextInput('body', e.currentTarget.value)}
                onKeyDown={handleBodyKeyDown}
              />

              <div class="flex items-center justify-between text-xs text-gray-400">
                <button
                  class="text-red-400 hover:text-red-600"
                  onClick={() => { deleteMemo(memo().id!); setSelectedId(null) }}
                >
                  🗑️ 削除
                </button>
                <span>自動保存 — {new Date(memo().updatedAt).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  )

  return (
    <div class="flex h-full overflow-hidden">
      <Show when={!isMobile() || mobilePanel() === 'list'}>
        <List />
      </Show>
      <Show when={!isMobile() || mobilePanel() === 'editor'}>
        <Editor />
      </Show>

      {/* ── Tag picker bottom sheet ── */}
      <Show when={tagPickerOpen()}>
        <div class="fixed inset-0 z-60 bg-black/30" onClick={closeTagPicker} />
        <div
          class="fixed bottom-0 left-0 right-0 z-70 bg-white rounded-t-2xl shadow-2xl flex flex-col"
          style={{ 'max-height': '70vh' }}
        >
          <div class="flex items-center justify-between px-5 pt-4 pb-0 shrink-0">
            <span class="font-semibold text-sm">カテゴリータグを追加</span>
            <button
              class="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              onClick={closeTagPicker}
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div class="px-5 pt-3 pb-0 shrink-0">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-nacc-border">
              <span class="text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                class="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                placeholder="検索..."
                value={tagPickerSearch()}
                onInput={(e) => setTagPickerSearch(e.currentTarget.value)}
              />
              <Show when={tagPickerSearch()}>
                <button
                  class="text-gray-300 hover:text-gray-500 leading-none"
                  onClick={() => setTagPickerSearch('')}
                >
                  ✕
                </button>
              </Show>
            </div>
          </div>

          <div class="flex px-5 mt-2 shrink-0 border-b border-nacc-border">
            {(['product', 'nutrient'] as const).map((tab) => (
              <button
                class="px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px"
                classList={{
                  'border-nacc-gold text-nacc-gold': tagPickerTab() === tab,
                  'border-transparent text-gray-500 hover:text-gray-700': tagPickerTab() !== tab,
                }}
                onClick={() => setTagPickerTab(tab)}
              >
                {tab === 'product' ? 'Note' : 'Tag'}
              </button>
            ))}
          </div>

          <div class="overflow-y-auto flex-1 p-3">
            <For each={(tagPickerTab() === 'product' ? PRODUCTS : NUTRIENTS).filter((item) =>
              tagPickerSearch() === '' || item.name.includes(tagPickerSearch())
            )}>
              {(item) => {
                const tag: Tag = { type: tagPickerTab(), name: item.name }
                const isSelected = () => tagPickerSelected().some((t) => t.name === item.name)
                const alreadyAdded = () => selected()?.tags.some((t) => t.name === item.name) ?? false
                return (
                  <button
                    class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    classList={{
                      'bg-[#f5f0e8]': isSelected(),
                      'opacity-40 pointer-events-none': alreadyAdded(),
                      'hover:bg-[#f9f8f6]': !isSelected() && !alreadyAdded(),
                    }}
                    onClick={() => {
                      if (alreadyAdded()) return
                      setTagPickerSelected((prev) =>
                        isSelected() ? prev.filter((t) => t.name !== item.name) : [...prev, tag]
                      )
                    }}
                  >
                    <span>{tagPickerTab() === 'product' ? '📦' : '🌿'}</span>
                    <span class="text-sm text-nacc-dark leading-tight flex-1">{item.name}</span>
                    <Show when={isSelected()}>
                      <span class="text-nacc-gold font-bold">✓</span>
                    </Show>
                    <Show when={alreadyAdded()}>
                      <span class="text-xs text-[#999]">追加済み</span>
                    </Show>
                  </button>
                )
              }}
            </For>
            <Show when={(tagPickerTab() === 'product' ? PRODUCTS : NUTRIENTS).filter((item) =>
              tagPickerSearch() !== '' && item.name.includes(tagPickerSearch())
            ).length === 0 && tagPickerSearch() !== ''}>
              <div class="flex flex-col items-center justify-center py-8 text-gray-300 text-sm gap-1">
                <span>「{tagPickerSearch()}」は見つかりません</span>
              </div>
            </Show>
          </div>

          <div class="px-5 py-3 border-t border-nacc-border flex items-center justify-between bg-gray-50 shrink-0">
            <span class="text-xs text-gray-500 font-medium">{tagPickerSelected().length}件選択中</span>
            <div class="flex gap-2">
              <button
                class="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={closeTagPicker}
              >
                キャンセル
              </button>
              <button
                class="px-4 py-1.5 text-sm bg-nacc-dark text-white rounded-lg hover:opacity-90 font-medium"
                onClick={confirmTagPicker}
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* ── Character picker bottom sheet ── */}
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

export default PageMemo
