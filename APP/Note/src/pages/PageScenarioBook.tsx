import { type Component, For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { addScenarioBookEvent, deleteScenarioBookEvent, state, updateScenarioBookEvent } from '../store'
import type { ScenarioBookSnippetKind, ScenarioBookWord } from '../types'
import { PRODUCTS, productImageUrl } from '../db/products'

const SNIPPET_LABELS: Record<ScenarioBookSnippetKind, string> = {
  term: '用語',
  devTag: '開発タグ',
  prompt: 'プロンプト',
}

const FIXED_TAG_TITLE_ID = 'fixed-tags'
const RECENT_TITLE_ID = 'recent-words'

const PageScenarioBook: Component = () => {
  const [selectedId, setSelectedId] = createSignal<string | null>(state.scenarioBooks[0]?.id ?? null)
  const [footerOpen, setFooterOpen] = createSignal(false)
  const [activeTitleId, setActiveTitleId] = createSignal(state.scenarioBooks[0]?.titleDb[0]?.id ?? FIXED_TAG_TITLE_ID)
  const [search, setSearch] = createSignal('')
  const [devLabel, setDevLabel] = createSignal('')
  const [devContent, setDevContent] = createSignal('')
  const [devTitleId, setDevTitleId] = createSignal('')
  const [snippetKind, setSnippetKind] = createSignal<ScenarioBookSnippetKind>('prompt')
  const [snippetLabel, setSnippetLabel] = createSignal('')
  const [snippetContent, setSnippetContent] = createSignal('')
  const [tagInput, setTagInput] = createSignal('')
  const [coverPickerOpen, setCoverPickerOpen] = createSignal(false)
  let textareaRef: HTMLTextAreaElement | undefined

  const selected = createMemo(() => {
    const id = selectedId()
    return state.scenarioBooks.find((event) => event.id === id) ?? state.scenarioBooks[0]
  })

  const activeTitleOptions = createMemo(() => {
    const event = selected()
    if (!event) return []
    return [
      ...event.titleDb,
      { id: FIXED_TAG_TITLE_ID, title: 'TAGS' },
      { id: RECENT_TITLE_ID, title: '最近' },
    ]
  })

  const filteredWords = createMemo(() => {
    const event = selected()
    if (!event) return []
    const q = search().trim().toLowerCase()
    const active = activeTitleId()
    let words = active === RECENT_TITLE_ID
      ? event.recentWordIds.map((id) => event.wordDb.find((word) => word.id === id)).filter(Boolean) as ScenarioBookWord[]
      : event.wordDb.filter((word) => word.titleId === active)
    if (q) words = words.filter((word) => `${word.label} ${word.content}`.toLowerCase().includes(q))
    return words
  })

  const filteredFixedTags = createMemo(() => {
    const event = selected()
    if (!event) return []
    const q = search().trim().toLowerCase()
    return event.fixedTags.filter((tag) => !q || tag.toLowerCase().includes(q))
  })

  function isMobile() {
    return window.innerWidth < 768
  }

  function createEvent() {
    const id = addScenarioBookEvent()
    setSelectedId(id)
    const event = state.scenarioBooks.find((item) => item.id === id)
    setActiveTitleId(event?.titleDb[0]?.id ?? FIXED_TAG_TITLE_ID)
    setFooterOpen(true)
  }

  function patchSelected(patch: Parameters<typeof updateScenarioBookEvent>[1]) {
    const event = selected()
    if (!event) return
    updateScenarioBookEvent(event.id, patch)
  }

  function insertTextAtCursor(text: string, options: { closeOnMobile?: boolean; setInsideQuote?: boolean } = {}) {
    const event = selected()
    if (!event) return
    const textarea = textareaRef
    const before = textarea ? event.body.slice(0, textarea.selectionStart) : event.body
    const after = textarea ? event.body.slice(textarea.selectionEnd) : ''
    const separator = before && !before.endsWith('\n') ? '\n' : ''
    const nextBody = `${before}${separator}${text}${after}`
    const quoteOffset = options.setInsideQuote && text.endsWith('：「」') ? 1 : 0
    const nextCursor = before.length + separator.length + text.length - quoteOffset
    patchSelected({ body: nextBody })
    window.setTimeout(() => {
      textarea?.focus()
      if (textarea) {
        textarea.selectionStart = nextCursor
        textarea.selectionEnd = nextCursor
      }
    })
    if (options.closeOnMobile && isMobile()) setFooterOpen(false)
  }

  function insertWord(word: ScenarioBookWord) {
    const event = selected()
    if (!event) return
    const recentWordIds = [word.id, ...event.recentWordIds.filter((id) => id !== word.id)].slice(0, 12)
    patchSelected({ recentWordIds })
    insertTextAtCursor(word.content, { closeOnMobile: true, setInsideQuote: true })
  }

  function insertFixedTag(tag: string) {
    const event = selected()
    if (!event) return
    const tags = event.tags.includes(tag) ? event.tags : [...event.tags, tag]
    patchSelected({ tags })
    insertTextAtCursor(tag, { closeOnMobile: true })
  }

  function addWordFromDevWindow() {
    const event = selected()
    const label = devLabel().trim()
    const content = (devContent().trim() || label)
    if (!event || !label) return
    const titleId = devTitleId() || activeTitleId()
    const safeTitleId = event.titleDb.some((title) => title.id === titleId) ? titleId : event.titleDb[0]?.id
    if (!safeTitleId) return
    const word = { id: `word-${Date.now()}`, titleId: safeTitleId, label, content, relationIds: [] }
    patchSelected({
      wordDb: [...event.wordDb, word],
      recentWordIds: [word.id, ...event.recentWordIds].slice(0, 12),
    })
    setActiveTitleId(safeTitleId)
    setDevLabel('')
    setDevContent('')
    setSearch('')
    insertWord(word)
  }

  function addSnippet() {
    const event = selected()
    const label = snippetLabel().trim()
    const content = snippetContent().trim()
    if (!event || !label || !content) return
    patchSelected({
      snippets: [
        ...event.snippets,
        { id: `snippet-${Date.now()}`, kind: snippetKind(), label, content },
      ],
    })
    setSnippetLabel('')
    setSnippetContent('')
  }

  function removeSnippet(id: string) {
    const event = selected()
    if (!event) return
    patchSelected({ snippets: event.snippets.filter((snippet) => snippet.id !== id) })
  }

  function addTag() {
    const event = selected()
    const tag = tagInput().trim().replace(/^#/, '')
    if (!event || !tag || event.tags.includes(tag)) return
    patchSelected({ tags: [...event.tags, tag] })
    setTagInput('')
  }

  function removeTag(tag: string) {
    const event = selected()
    if (!event) return
    patchSelected({ tags: event.tags.filter((item) => item !== tag) })
  }

  onMount(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'Space') {
        event.preventDefault()
        setFooterOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    onCleanup(() => window.removeEventListener('keydown', handleKeydown))
  })

  return (
    <div class="h-full bg-nacc-light overflow-hidden flex relative">
      <aside class="hidden md:flex w-72 shrink-0 bg-white border-r border-nacc-border flex-col overflow-hidden">
        <div class="px-3 py-3 border-b border-nacc-border flex items-center justify-between">
          <div>
            <h1 class="text-sm font-bold text-nacc-dark">ScenarioBook</h1>
            <p class="text-[11px] text-gray-400">1ノート = 1イベント</p>
          </div>
          <button class="text-xs px-2 py-1 rounded bg-nacc-gold text-white font-semibold" onClick={createEvent}>
            + Event
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <For each={state.scenarioBooks}>
            {(event) => (
              <button
                class="blog-list-item w-full text-left px-4 py-3 border-b border-[#f0f0f0]"
                classList={{ active: selected()?.id === event.id }}
                onClick={() => {
                  setSelectedId(event.id)
                  setActiveTitleId(event.titleDb[0]?.id ?? FIXED_TAG_TITLE_ID)
                }}
              >
                <Show when={event.cover}>
                  <img src={event.cover} class="w-full h-16 object-cover rounded-lg mb-2" alt="" />
                </Show>
                <p class="text-sm font-semibold text-nacc-dark truncate">{event.title || '無題イベント'}</p>
                <p class="text-xs text-gray-400 truncate mt-1">{event.body || '会話ログなし'}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                  <For each={event.tags.slice(0, 3)}>
                    {(tag) => <span class="text-[11px] px-1.5 py-0.5 rounded bg-nacc-light text-gray-500">#{tag}</span>}
                  </For>
                </div>
              </button>
            )}
          </For>
        </div>
      </aside>

      <main class="flex-1 min-w-0 flex flex-col overflow-hidden pb-16 md:pb-0">
        <div class="md:hidden px-3 py-2 bg-white border-b border-nacc-border flex items-center gap-2">
          <select
            class="min-w-0 flex-1 text-sm font-semibold border border-nacc-border rounded-lg px-2 py-2 bg-white"
            value={selected()?.id}
            onChange={(event) => setSelectedId(event.currentTarget.value)}
          >
            <For each={state.scenarioBooks}>
              {(event) => <option value={event.id}>{event.title || '無題イベント'}</option>}
            </For>
          </select>
          <button class="text-xs px-3 py-2 rounded bg-nacc-gold text-white font-semibold" onClick={createEvent}>+</button>
        </div>

        <Show when={selected()} fallback={<div class="flex-1 grid place-items-center text-gray-400">イベントを作成してください</div>}>
          {(event) => (
            <>
              <div class="px-4 md:px-5 py-3 bg-white border-b border-nacc-border flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-400">会話ログ形式 / Alt+Space: palette</div>
                  <input
                    class="text-lg md:text-xl font-bold text-nacc-dark bg-transparent outline-none w-full"
                    value={event().title}
                    placeholder="イベントタイトル"
                    onInput={(inputEvent) => patchSelected({ title: inputEvent.currentTarget.value })}
                  />
                </div>
                <button
                  class="text-xs px-3 py-1.5 rounded border border-red-100 text-red-500 bg-white hover:bg-red-50"
                  onClick={() => {
                    deleteScenarioBookEvent(event().id)
                    setSelectedId(state.scenarioBooks[0]?.id ?? null)
                  }}
                >
                  Delete
                </button>
              </div>

              <div class="flex-1 overflow-y-auto p-3 md:p-5 flex flex-col gap-3">
                <div
                  class="w-full h-28 md:h-36 rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0 border border-nacc-border"
                  classList={{ 'cover-placeholder': !event().cover }}
                  onClick={() => setCoverPickerOpen(true)}
                >
                  <Show when={event().cover}>
                    <img src={event().cover} class="w-full h-full object-cover" alt="cover" />
                  </Show>
                  <span class="absolute text-xs text-white/85 bg-black/35 px-3 py-1 rounded-full">
                    {event().cover ? 'カバー変更' : 'カバー画像を追加'}
                  </span>
                </div>

                <div class="flex flex-wrap gap-1.5 items-center">
                  <For each={event().tags}>
                    {(tag) => (
                      <button class="text-xs rounded-full px-2.5 py-1 border border-nacc-border bg-white text-gray-600" onClick={() => removeTag(tag)}>
                        #{tag} x
                      </button>
                    )}
                  </For>
                  <div class="flex items-center gap-1">
                    <input
                      class="w-28 text-xs border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                      value={tagInput()}
                      placeholder="free tag"
                      onInput={(inputEvent) => setTagInput(inputEvent.currentTarget.value)}
                      onKeyDown={(keyEvent) => keyEvent.key === 'Enter' && addTag()}
                    />
                    <button class="text-xs px-2 py-1.5 rounded bg-nacc-dark text-white" onClick={addTag}>Add</button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  class="min-h-96 flex-1 text-base md:text-sm leading-8 text-nacc-dark border border-nacc-border rounded-xl p-4 resize-none outline-none focus:ring-1 focus:ring-nacc-gold/30 bg-white"
                  value={event().body}
                  placeholder={'ナレーション：\nキャラクター：「セリフ」'}
                  onInput={(inputEvent) => patchSelected({ body: inputEvent.currentTarget.value })}
                />

                <div class="text-xs text-gray-400 text-right">
                  最終更新: {new Date(event().updatedAt).toLocaleString('ja-JP')}
                </div>
              </div>
            </>
          )}
        </Show>
      </main>

      <aside class="hidden lg:flex w-80 shrink-0 bg-white border-l border-nacc-border flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-nacc-border">
          <div class="text-sm font-bold text-nacc-dark">System / TAGS</div>
          <div class="text-xs text-gray-400">固定タグは開発側と連携する辞書として扱う</div>
        </div>

        <Show when={selected()}>
          {(event) => (
            <div class="flex-1 overflow-y-auto">
              <section class="p-4 border-b border-nacc-border">
                <div class="text-xs font-semibold text-gray-400 mb-2">固定TAGS</div>
                <div class="flex flex-wrap gap-1.5">
                  <For each={event().fixedTags}>
                    {(tag) => (
                      <button class="text-xs px-2 py-1.5 rounded border border-nacc-border bg-white hover:bg-nacc-light" onClick={() => insertFixedTag(tag)}>
                        {tag}
                      </button>
                    )}
                  </For>
                </div>
              </section>

              <section class="p-4 border-b border-nacc-border">
                <div class="text-xs font-semibold text-gray-400 mb-2">Prompt / System Snippets</div>
                <For each={(['term', 'devTag', 'prompt'] as ScenarioBookSnippetKind[])}>
                  {(kind) => (
                    <div class="mb-3">
                      <div class="text-[11px] text-gray-400 mb-1">{SNIPPET_LABELS[kind]}</div>
                      <div class="flex flex-wrap gap-1.5">
                        <For each={event().snippets.filter((snippet) => snippet.kind === kind)}>
                          {(snippet) => (
                            <div class="flex items-center gap-1">
                              <button class="text-xs px-2 py-1.5 rounded border border-nacc-border bg-white hover:bg-nacc-light" onClick={() => insertTextAtCursor(snippet.content)}>
                                {snippet.label}
                              </button>
                              <button class="text-xs text-gray-300 hover:text-red-500" onClick={() => removeSnippet(snippet.id)}>x</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>

                <div class="rounded-xl bg-nacc-light p-3 flex flex-col gap-2">
                  <select class="text-xs border border-nacc-border rounded-lg px-2 py-1.5 bg-white outline-none" value={snippetKind()} onChange={(event) => setSnippetKind(event.currentTarget.value as ScenarioBookSnippetKind)}>
                    <option value="term">用語</option>
                    <option value="devTag">開発タグ</option>
                    <option value="prompt">プロンプト</option>
                  </select>
                  <input class="text-xs border border-nacc-border rounded-lg px-2 py-1.5 outline-none" value={snippetLabel()} placeholder="表示名" onInput={(event) => setSnippetLabel(event.currentTarget.value)} />
                  <textarea class="text-xs border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-none" value={snippetContent()} rows={3} placeholder="挿入するテキスト" onInput={(event) => setSnippetContent(event.currentTarget.value)} />
                  <button class="text-xs px-3 py-1.5 rounded bg-nacc-dark text-white" onClick={addSnippet}>スニペット追加</button>
                </div>
              </section>
            </div>
          )}
        </Show>
      </aside>

      <div class="fixed left-0 right-0 bottom-0 z-50 md:absolute md:left-72 md:right-80 lg:right-80">
        <Show when={footerOpen()}>
          <div class="mx-2 mb-2 rounded-2xl bg-white border border-nacc-border shadow-2xl overflow-hidden">
            <Show when={selected()}>
              {(event) => (
                <>
                  <div class="p-3 border-b border-nacc-border bg-[#faf9f7]">
                    <div class="flex items-center gap-2 mb-2">
                      <select
                        class="w-28 text-xs border border-nacc-border rounded-lg px-2 py-2 bg-white outline-none"
                        value={devTitleId() || activeTitleId()}
                        onChange={(inputEvent) => setDevTitleId(inputEvent.currentTarget.value)}
                      >
                        <For each={event().titleDb}>
                          {(title) => <option value={title.id}>{title.title}</option>}
                        </For>
                      </select>
                      <input
                        class="min-w-0 flex-1 text-sm border border-nacc-border rounded-lg px-3 py-2 outline-none"
                        value={devLabel()}
                        placeholder="開発窓: なければ作る"
                        onInput={(inputEvent) => {
                          setDevLabel(inputEvent.currentTarget.value)
                          if (!devContent()) setSearch(inputEvent.currentTarget.value)
                        }}
                        onKeyDown={(keyEvent) => keyEvent.key === 'Enter' && addWordFromDevWindow()}
                      />
                      <button class="px-3 py-2 rounded-lg bg-nacc-dark text-white text-xs font-semibold" onClick={addWordFromDevWindow}>
                        作成
                      </button>
                    </div>
                    <input
                      class="w-full text-sm border border-nacc-border rounded-xl px-3 py-2.5 outline-none bg-white"
                      value={search()}
                      placeholder="WordDB / TAGS を検索"
                      onInput={(inputEvent) => setSearch(inputEvent.currentTarget.value)}
                    />
                    <input
                      class="w-full mt-2 text-xs border border-nacc-border rounded-lg px-3 py-2 outline-none bg-white"
                      value={devContent()}
                      placeholder="作成時の挿入テキスト。空なら表示名をそのまま使う"
                      onInput={(inputEvent) => setDevContent(inputEvent.currentTarget.value)}
                    />
                  </div>

                  <div class="flex items-center gap-1 overflow-x-auto px-3 py-2 border-b border-nacc-border">
                    <For each={activeTitleOptions().filter((title) => title.id !== RECENT_TITLE_ID)}>
                      {(title) => (
                        <button
                          class="shrink-0 text-xs px-3 py-2 rounded-full border font-medium"
                          classList={{
                            'bg-nacc-dark text-white border-nacc-dark': activeTitleId() === title.id,
                            'bg-white text-gray-600 border-nacc-border': activeTitleId() !== title.id,
                          }}
                          onClick={() => setActiveTitleId(title.id)}
                        >
                          {title.title}
                        </button>
                      )}
                    </For>
                    <button
                      class="ml-auto shrink-0 w-9 h-9 rounded-full border border-nacc-border bg-white text-gray-600"
                      classList={{ 'bg-nacc-dark text-white border-nacc-dark': activeTitleId() === RECENT_TITLE_ID }}
                      title="最近使ったもの"
                      onClick={() => setActiveTitleId(RECENT_TITLE_ID)}
                    >
                      ◷
                    </button>
                  </div>

                  <div class="max-h-56 overflow-y-auto p-3">
                    <Show when={activeTitleId() === FIXED_TAG_TITLE_ID} fallback={
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <For each={filteredWords()}>
                          {(word) => (
                            <button class="text-left px-3 py-3 rounded-xl bg-nacc-light hover:bg-[#f5f0e8] active:scale-[.98]" onClick={() => insertWord(word)}>
                              <div class="text-sm font-semibold text-nacc-dark truncate">{word.label}</div>
                              <div class="text-[11px] text-gray-400 truncate mt-0.5">{word.content}</div>
                            </button>
                          )}
                        </For>
                        <Show when={filteredWords().length === 0}>
                          <div class="col-span-full text-center text-sm text-gray-300 py-8">候補がありません。開発窓から追加できます。</div>
                        </Show>
                      </div>
                    }>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <For each={filteredFixedTags()}>
                          {(tag) => (
                            <button class="text-left px-3 py-3 rounded-xl bg-nacc-light hover:bg-[#f5f0e8] active:scale-[.98]" onClick={() => insertFixedTag(tag)}>
                              <div class="text-sm font-semibold text-nacc-dark truncate">{tag}</div>
                              <div class="text-[11px] text-gray-400 truncate mt-0.5">fixed tag</div>
                            </button>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </>
              )}
            </Show>
          </div>
        </Show>

        <div class="mx-2 mb-2 h-14 rounded-2xl bg-white border border-nacc-border shadow-xl flex items-center gap-2 px-2">
          <button class="h-10 px-4 rounded-xl bg-nacc-dark text-white text-sm font-semibold" onClick={() => setFooterOpen((open) => !open)}>
            {footerOpen() ? '閉じる' : 'WordDB'}
          </button>
          <Show when={selected()}>
            {(event) => (
              <div class="flex-1 overflow-x-auto flex gap-1.5">
                <For each={event().wordDb.filter((word) => word.titleId === event().titleDb[0]?.id).slice(0, 8)}>
                  {(word) => (
                    <button class="shrink-0 text-xs px-3 py-2 rounded-full bg-nacc-light text-nacc-dark" onClick={() => insertWord(word)}>
                      {word.label}
                    </button>
                  )}
                </For>
              </div>
            )}
          </Show>
          <button class="w-10 h-10 rounded-xl border border-nacc-border bg-white text-gray-600" onClick={() => { setActiveTitleId(RECENT_TITLE_ID); setFooterOpen(true) }} title="最近使ったもの">
            ◷
          </button>
        </div>
      </div>

      <Show when={coverPickerOpen()}>
        <div class="fixed inset-0 z-60 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setCoverPickerOpen(false)}>
          <div class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div class="flex items-center justify-between px-5 py-4 border-b border-nacc-border">
              <span class="font-semibold text-nacc-dark">カバー画像を選択</span>
              <button onClick={() => setCoverPickerOpen(false)} class="text-[#999]">x</button>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
              <p class="text-xs text-[#999] mb-3 font-semibold uppercase tracking-wider">Cover Image</p>
              <div class="grid grid-cols-3 gap-2 mb-4">
                <For each={PRODUCTS.filter((product) => product.image)}>
                  {(product) => (
                    <button
                      class="aspect-square rounded-lg overflow-hidden bg-[#e8dfd0] hover:ring-2 hover:ring-nacc-gold"
                      onClick={() => {
                        patchSelected({ cover: productImageUrl(product.image), coverType: 'product' })
                        setCoverPickerOpen(false)
                      }}
                    >
                      <img src={productImageUrl(product.image)} alt={product.name} class="w-full h-full object-cover" />
                    </button>
                  )}
                </For>
              </div>
              <p class="text-xs text-[#999] mb-3 font-semibold uppercase tracking-wider">端末から追加</p>
              <label class="flex items-center justify-center gap-2 border-2 border-dashed border-[#e8e8e8] rounded-xl py-5 cursor-pointer hover:border-nacc-gold text-[#999] text-sm">
                写真を選択
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  onChange={(inputEvent) => {
                    const file = inputEvent.currentTarget.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      patchSelected({ cover: reader.result as string, coverType: 'upload' })
                      setCoverPickerOpen(false)
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
              <Show when={selected()?.cover}>
                <button class="w-full mt-3 py-2 text-sm text-red-400 hover:text-red-600" onClick={() => { patchSelected({ cover: undefined, coverType: 'none' }); setCoverPickerOpen(false) }}>
                  カバー画像を削除
                </button>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default PageScenarioBook
