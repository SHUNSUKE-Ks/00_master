import { type Component, Show, createSignal } from 'solid-js'
import { state, setState, navigate } from '../store'
import type { Page } from '../types'
import { exportLocalWorkspace } from '../dataBridge/localExport'

const PAGE_LABELS: Record<Page, string> = {
  memo:     'scenarioノート',
  upnote:   'UPNOTE',
  db01:     'Title DB',
  db02:     'Character DB',
  db03:     'DB03 Relation',
  db10:     'DB10 Status',
  blog:     '📓 ブログ',
  study:    'Study',
  notebook: '📚 ノートブック',
  inbox:    'InBox DB',
  trash:    '🗑️ ごみ箱',
  gallery:  '🖼 ギャラリー',
  devstudio: 'Scenario Board',
}

const Header: Component = () => {
  const [viewMenuOpen, setViewMenuOpen] = createSignal(false)
  const isDbPage = () => state.page === 'db01' || state.page === 'db02' || state.page === 'db03' || state.page === 'db10'

  function closeViewMenu() { setViewMenuOpen(false) }
  function goToDevStudio() {
    navigate('devstudio')
    closeViewMenu()
  }
  function goToNotebook(notebookId?: string) {
    const notebook = notebookId ? state.notebooks.find((item) => item.id === notebookId) : undefined
    const firstContentPage = notebook?.pages.find((page) => page.id !== 'inbox-tag-db' && page.id !== 'inbox-archive') ?? notebook?.pages[0]
    setState({
      selectedNotebookId: notebookId ?? state.selectedNotebookId,
      selectedNotebookPageId: firstContentPage?.id ?? null,
    })
    navigate('notebook')
    closeViewMenu()
  }
  function goToDb() {
    setState({ dbView: 'index' })
    navigate('db01')
    closeViewMenu()
  }

  const activeNotebookId = () => state.page === 'notebook' ? state.selectedNotebookId : null

  return (
    <header class="h-12 bg-white border-b border-nacc-border flex items-center px-3 gap-2 shrink-0 z-50 relative">

      {/* Hamburger */}
      <button
        class="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-gray-500 shrink-0 transition-all"
        classList={{ 'hidden': state.page === 'notebook' }}
        onClick={() => setState({ sidebarOpen: !state.sidebarOpen })}
        aria-label="メニュー"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo + DB View dropdown (DB pages only) */}
      <div class="relative">
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0b1f3a] text-white hover:bg-[#12345f] transition-colors shadow-sm"
          onClick={() => setViewMenuOpen((v) => !v)}
        >
          <span class="font-bold text-sm tracking-tight">Note_Story</span>
          <span class="hidden sm:inline text-[10px] font-semibold rounded-full bg-white/12 px-1.5 py-0.5 text-blue-100">
            scenarioノート
          </span>
          <svg
            class="w-3 h-3 text-blue-100 transition-transform"
            classList={{ 'rotate-180': viewMenuOpen() }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Show when={viewMenuOpen()}>
          <div
            class="absolute left-0 top-10 bg-white border border-nacc-border rounded-xl shadow-lg w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden z-50"
          >
            <div class="px-3 py-2 text-xs text-gray-400 font-medium border-b border-nacc-border">
              Note_Story Menu
            </div>
            <div class="p-1.5 flex flex-col gap-0.5">
              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={() => { navigate('inbox'); closeViewMenu() }}
              >
                <span>IN</span>
                <div>
                  <div class="font-medium">InBox</div>
                  <div class="text-xs text-gray-400">改善案・相談メモを受ける</div>
                </div>
                <Show when={state.page === 'inbox'}>
                  <span class="ml-auto text-nacc-gold text-xs">✓</span>
                </Show>
              </button>

              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={goToDevStudio}
              >
                <span>DS</span>
                <div>
                  <div class="font-medium">Scenario Board</div>
                  <div class="text-xs text-gray-400">シナリオTODOを分解する</div>
                </div>
                <Show when={state.page === 'devstudio'}>
                  <span class="ml-auto text-nacc-gold text-xs">✓</span>
                </Show>
              </button>

              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={() => goToNotebook('story-ideas')}
              >
                <span>SN</span>
                <div>
                  <div class="font-medium">シナリオノート</div>
                  <div class="text-xs text-gray-400">本文・アイディア・会話ログを書く</div>
                </div>
                <Show when={activeNotebookId() === 'story-ideas'}>
                  <span class="ml-auto text-nacc-gold text-xs">✓</span>
                </Show>
              </button>

              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={() => { navigate('study'); closeViewMenu() }}
              >
                <span>ST</span>
                <div>
                  <div class="font-medium">Study</div>
                  <div class="text-xs text-gray-400">Note開発の技術Cardを読む</div>
                </div>
                <Show when={state.page === 'study'}><span class="ml-auto text-nacc-gold text-xs">✓</span></Show>
              </button>

              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={goToDb}
              >
                <span>DB</span>
                <div>
                  <div class="font-medium">DB</div>
                  <div class="text-xs text-gray-400">Title / Character DB</div>
                </div>
                <Show when={isDbPage()}>
                  <span class="ml-auto text-nacc-gold text-xs">✓</span>
                </Show>
              </button>

              <Show when={isDbPage()}>
                <div class="border-t border-nacc-border my-1" />
                <div class="px-3 pt-1 pb-0.5 text-[11px] text-gray-400 font-semibold">
                  DB View
                </div>
              </Show>

              <Show when={isDbPage()}>
              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={() => { setState({ dbView: 'table' }); closeViewMenu() }}
              >
                <span>≡</span>
                <div>
                  <div class="font-medium">テーブル</div>
                  <div class="text-xs text-gray-400">Notion風・ライン表示</div>
                </div>
                <Show when={state.dbView === 'table'}>
                  <span class="ml-auto text-nacc-gold text-xs">✓</span>
                </Show>
              </button>
              </Show>
              <Show when={isDbPage()}>
              <button
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left w-full transition-colors"
                onClick={() => { setState({ dbView: 'detail' }); closeViewMenu() }}
              >
                <span>🗂</span>
                <div>
                  <div class="font-medium">詳細View</div>
                  <div class="text-xs text-gray-400">カード・詳細パネル表示</div>
                </div>
                <Show when={state.dbView === 'detail'}>
                  <span class="ml-auto text-nacc-gold text-xs">✓</span>
                </Show>
              </button>
              </Show>
            </div>
          </div>
          <div class="fixed inset-0 z-40" onClick={closeViewMenu} />
        </Show>
      </div>

      {/* Gallery button — ロゴ直後、ブレッドクラム前 */}
      <button
        class="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all shrink-0"
        classList={{
          'bg-violet-50 text-violet-600': state.page === 'gallery',
          'text-gray-400 hover:bg-gray-100 hover:text-gray-600': state.page !== 'gallery',
        }}
        onClick={() => navigate('gallery')}
        title="Gallery"
      >
        <div class="w-5 h-5 rounded-md bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="text-xs font-semibold hidden sm:inline">Gallery</span>
      </button>

      {/* Breadcrumb */}
      <div class="flex items-center gap-1 text-xs text-gray-400 ml-1">
        <span>{PAGE_LABELS[state.page]}</span>
      </div>

      {/* Blog mode toggle (center, blog only) */}
      <Show when={state.page === 'blog'}>
        <div class="ml-2">
          <div class="mode-pill">
            <button
              classList={{ active: state.blogMode === 'memo' }}
              onClick={() => setState({ blogMode: 'memo' })}
            >
              📝 メモ
            </button>
            <button
              classList={{ active: state.blogMode === 'view' }}
              onClick={() => setState({ blogMode: 'view' })}
            >
              👁 View
            </button>
          </div>
        </div>
      </Show>

      {/* Right: search (desktop) + gallery + settings */}
      <div class="ml-auto flex items-center gap-1.5">
        <button
          class="global-inbox-header-btn"
          type="button"
          onClick={() => setState({ inboxComposerOpen: true })}
          title="現在の画面からGlobal InBoxへ送る"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M20.5 3.5 3.75 10.9c-.78.34-.75 1.46.05 1.76l6.18 2.31 2.32 6.19c.3.8 1.42.83 1.76.05L21.5 4.5c.27-.62-.38-1.27-1-.99Z" fill="currentColor" />
          </svg>
          <span>InBox</span>
        </button>
        <div class="hidden sm:flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 w-36">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="検索..." class="bg-transparent outline-none w-full text-gray-600 text-xs" />
        </div>

        <button
          class="hidden sm:inline-flex px-2 py-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-xs font-semibold text-gray-500 transition-all"
          onClick={() => exportLocalWorkspace('json')}
          title="Local JSON Export"
        >
          JSON
        </button>
        <button
          class="hidden sm:inline-flex px-2 py-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-xs font-semibold text-gray-500 transition-all"
          onClick={() => exportLocalWorkspace('md')}
          title="Local MD Export"
        >
          MD
        </button>

        <button
          class="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-gray-500 transition-all"
          onClick={() => setState({ galleryPanelOpen: !state.galleryPanelOpen, settingsPanelOpen: false })}
          title="フォトギャラリー"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          class="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-gray-500 transition-all"
          onClick={() => setState({ settingsPanelOpen: !state.settingsPanelOpen, galleryPanelOpen: false })}
          title="設定"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Header
