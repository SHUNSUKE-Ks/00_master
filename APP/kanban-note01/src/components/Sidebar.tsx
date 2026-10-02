import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { state, navigate } from '../store'
import type { Page } from '../types'
import { CATEGORY_META, STUDY_CARDS, STUDY_CATEGORIES, studyCardsByCategory, type StudyCategory } from '../dataBridge/studyLibrary'
import { selectedStudyCardId, setSelectedStudyCardId, setStudyCategory, setStudyViewIntent, studyCategory, studyFavoriteCardIds } from '../pages/studyState'

type NavItem = { page: Page; label: string; icon: string; dbHubMode?: string }

const PAGE_NAV: NavItem[] = [
  { page: 'memo', label: 'scenarioノート', icon: '📝' },
]
const NavBtn: Component<{ item: NavItem }> = (props) => (
  <button
    class="nav-btn w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors"
    classList={{
      'bg-nacc-light font-medium text-nacc-dark': state.page === props.item.page,
      'text-[#555] hover:bg-[#f5f4f1]': state.page !== props.item.page,
    }}
    data-page={props.item.page}
    onClick={() => {
      if (props.item.dbHubMode) sessionStorage.setItem('note-story-db-hub-mode-v1', props.item.dbHubMode)
      navigate(props.item.page)
    }}
  >
    <span class="sidebar-icon">{props.item.icon}</span>
    <span class="sidebar-label truncate">{props.item.label}</span>
  </button>
)

const SectionLabel: Component<{ label: string }> = (props) => (
  <div class="sidebar-section-label text-xs font-semibold text-[#aaa] px-2 py-1 mt-3">{props.label}</div>
)

function openStudyCategory(category: StudyCategory) {
  const firstCard = studyCardsByCategory(category)[0]
  setStudyCategory(category)
  if (firstCard) setSelectedStudyCardId(firstCard.id)
  setStudyViewIntent('cards')
  navigate('study')
}

function openStudyCard(cardId: string) {
  const card = STUDY_CARDS.find((item) => item.id === cardId)
  if (!card) return
  setStudyCategory(card.category)
  setSelectedStudyCardId(card.id)
  setStudyViewIntent('article')
  navigate('study')
}

const StudySidebarContent: Component = () => {
  const favoriteCards = createMemo(() => STUDY_CARDS.filter((card) => studyFavoriteCardIds().includes(card.id)))
  const currentCards = createMemo(() => studyCardsByCategory(studyCategory()))
  const [categoriesOpen, setCategoriesOpen] = createSignal(false)
  const [favoritesOpen, setFavoritesOpen] = createSignal(true)
  const [bookOpen, setBookOpen] = createSignal(true)
  const [openHarnessOpen, setOpenHarnessOpen] = createSignal(true)
  const [awesomeOpen, setAwesomeOpen] = createSignal(true)
  const [agentSkillsOpen, setAgentSkillsOpen] = createSignal(true)
  const [secondBrainOpen, setSecondBrainOpen] = createSignal(true)
  const [novelIndexOpen, setNovelIndexOpen] = createSignal(true)
  const [deliveryOpen, setDeliveryOpen] = createSignal(true)
  const [structureOpen, setStructureOpen] = createSignal(true)
  const [codeReadingOpen, setCodeReadingOpen] = createSignal(true)
  const [rulesOpen, setRulesOpen] = createSignal(true)
  const [readingOpen, setReadingOpen] = createSignal(true)
  const groupedCards = (group?: '索引' | '本文' | '規則' | '本文読解' | '納品' | '構造' | 'コード読解') => currentCards().filter((card) => card.group === group)
  const ungroupedCards = () => currentCards().filter((card) => !card.group)
  const cardsByBook = (bookTitle: string) => currentCards().filter((card) => card.bookTitle === bookTitle)
  const bookGroups = () => [
    { title: 'ClaudeRPA / OpenHarness', open: openHarnessOpen(), toggle: () => setOpenHarnessOpen((v) => !v) },
    { title: 'ClaudeRPA / awesome-harness-engineering', open: awesomeOpen(), toggle: () => setAwesomeOpen((v) => !v) },
    { title: 'ClaudeRPA / agent-skills-for-context-engineering', open: agentSkillsOpen(), toggle: () => setAgentSkillsOpen((v) => !v) },
    { title: 'ClaudeRPA / second-brain-starter', open: secondBrainOpen(), toggle: () => setSecondBrainOpen((v) => !v) },
  ]

  return (
    <>
      {/* Quick Memo */}
      <div class="p-3 border-b border-nacc-border">
        <button
          class="w-full flex items-center gap-2 px-3 py-2 bg-nacc-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => navigate('memo')}
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="sidebar-label">scenarioメモ</span>
        </button>
      </div>

      <div class="study-sidebar-block">
        <button class="study-sidebar-tree-head category-root" onClick={() => setCategoriesOpen((v) => !v)}>
          <span class="study-tree-toggle" classList={{ open: categoriesOpen() }} />
          <strong>大分類</strong>
          <small>{CATEGORY_META[studyCategory()].label}</small>
        </button>
        <Show when={categoriesOpen()}>
          <For each={STUDY_CATEGORIES}>
            {(category) => {
              const meta = CATEGORY_META[category]
              return (
                <button
                  class="study-sidebar-category"
                  classList={{ active: studyCategory() === category }}
                  onClick={() => openStudyCategory(category)}
                >
                  <span>{meta.icon}</span>
                  <div>
                    <strong>{meta.label}</strong>
                    <small>{meta.note}</small>
                  </div>
                </button>
              )
            }}
          </For>
        </Show>
      </div>

      {/* Nav */}
      <nav class="flex-1 overflow-y-auto p-2">
        <button class="study-sidebar-tree-head" onClick={() => setFavoritesOpen((v) => !v)}>
          <span class="study-tree-toggle" classList={{ open: favoritesOpen() }} />
          <strong>ページ</strong>
          <small></small>
        </button>
        <Show when={favoritesOpen()}>
          <Show when={favoriteCards().length} fallback={<p class="study-sidebar-empty sidebar-label">☆でページをお気に入り登録</p>}>
            <For each={favoriteCards()}>
              {(card) => <StudySidebarCard cardId={card.id} depth={1} />}
            </For>
          </Show>
        </Show>

        <button class="study-sidebar-tree-head" onClick={() => setBookOpen((v) => !v)}>
          <span class="study-tree-toggle" classList={{ open: bookOpen() }} />
          <strong>ノートブック</strong>
          <small></small>
        </button>
        <Show when={bookOpen()}>
          <Show when={studyCategory() === 'claudeRpa'}>
            <For each={bookGroups()}>
              {(book) => (
                <Show when={cardsByBook(book.title).length}>
                  <button class="study-sidebar-tree-head child" onClick={book.toggle}>
                    <span class="study-tree-toggle" classList={{ open: book.open }} />
                    <strong>{book.title.replace('ClaudeRPA / ', '')}</strong>
                    <small></small>
                  </button>
                  <Show when={book.open}>
                    <For each={cardsByBook(book.title)}>
                      {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
                    </For>
                  </Show>
                </Show>
              )}
            </For>
          </Show>
          <Show when={studyCategory() === 'novelEngine'}>
            <button class="study-sidebar-tree-head child" onClick={() => setNovelIndexOpen((v) => !v)}>
              <span class="study-tree-toggle" classList={{ open: novelIndexOpen() }} />
              <strong>索引</strong>
              <small></small>
            </button>
            <Show when={novelIndexOpen()}>
              <For each={groupedCards('索引')}>
                {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
              </For>
            </Show>
            <button class="study-sidebar-tree-head child" onClick={() => setDeliveryOpen((v) => !v)}>
              <span class="study-tree-toggle" classList={{ open: deliveryOpen() }} />
              <strong>納品</strong>
              <small></small>
            </button>
            <Show when={deliveryOpen()}>
              <For each={groupedCards('納品')}>
                {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
              </For>
            </Show>
            <button class="study-sidebar-tree-head child" onClick={() => setStructureOpen((v) => !v)}>
              <span class="study-tree-toggle" classList={{ open: structureOpen() }} />
              <strong>構造</strong>
              <small></small>
            </button>
            <Show when={structureOpen()}>
              <For each={groupedCards('構造')}>
                {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
              </For>
            </Show>
            <button class="study-sidebar-tree-head child" onClick={() => setCodeReadingOpen((v) => !v)}>
              <span class="study-tree-toggle" classList={{ open: codeReadingOpen() }} />
              <strong>コード読解</strong>
              <small></small>
            </button>
            <Show when={codeReadingOpen()}>
              <For each={groupedCards('コード読解')}>
                {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
              </For>
            </Show>
          </Show>
          <Show when={studyCategory() === 'customNote'}>
            <button class="study-sidebar-tree-head child" onClick={() => setRulesOpen((v) => !v)}>
              <span class="study-tree-toggle" classList={{ open: rulesOpen() }} />
              <strong>規則</strong>
              <small></small>
            </button>
            <Show when={rulesOpen()}>
              <For each={groupedCards('規則')}>
                {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
              </For>
            </Show>
            <button class="study-sidebar-tree-head child" onClick={() => setReadingOpen((v) => !v)}>
              <span class="study-tree-toggle" classList={{ open: readingOpen() }} />
              <strong>本文読解</strong>
              <small></small>
            </button>
            <Show when={readingOpen()}>
              <For each={groupedCards('本文読解')}>
                {(card) => <StudySidebarCard cardId={card.id} depth={2} book />}
              </For>
            </Show>
          </Show>
          <Show when={studyCategory() === 'selfTech'}>
            <For each={ungroupedCards()}>
              {(card) => <StudySidebarCard cardId={card.id} depth={1} book />}
            </For>
          </Show>
        </Show>

      </nav>

      {/* Trash */}
      <div class="px-2 py-2 border-t border-nacc-border">
        <button
          class="nav-btn w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors text-[#999] hover:bg-red-50 hover:text-red-500"
          classList={{ 'bg-red-50 text-red-500': state.page === 'trash' }}
          data-page="trash"
          onClick={() => navigate('trash')}
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="sidebar-label">ごみ箱</span>
          {state.trashBlogs.length > 0 && (
            <span class="sidebar-label ml-auto text-xs bg-red-100 text-red-500 rounded-full px-1.5 py-0.5 font-medium min-w-5 text-center">
              {state.trashBlogs.length}
            </span>
          )}
        </button>
      </div>

      {/* User */}
      <div class="p-3 border-t border-nacc-border text-xs text-[#999]">
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-5 rounded-full bg-nacc-gold/20 flex items-center justify-center text-nacc-gold font-bold text-xs">
            N
          </div>
          <span class="sidebar-label">Note_Story user</span>
        </div>
      </div>
    </>
  )
}

const StudySidebarCard: Component<{ cardId: string; depth: 1 | 2; book?: boolean }> = (props) => {
  const card = () => STUDY_CARDS.find((item) => item.id === props.cardId)
  return (
    <Show when={card()}>
      {(item) => (
        <div class="study-sidebar-page-row no-star" classList={{ child: props.depth === 2 }}>
          <button
            class={props.book ? 'study-sidebar-notebook' : 'study-sidebar-page'}
            classList={{ active: selectedStudyCardId() === item().id }}
            onClick={() => openStudyCard(item().id)}
          >
            <span>{props.book ? '📘' : '📄'}</span>
            <div>
              <strong>{item().title}</strong>
              <small>{item().meta}</small>
            </div>
          </button>
        </div>
      )}
    </Show>
  )
}

const DefaultSidebarContent: Component = () => (
  <>
      {/* Quick Memo */}
      <div class="p-3 border-b border-nacc-border">
        <button
          class="w-full flex items-center gap-2 px-3 py-2 bg-nacc-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => navigate('memo')}
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="sidebar-label">scenarioメモ</span>
        </button>
      </div>

      {/* Nav */}
      <nav class="flex-1 overflow-y-auto p-2">
        <SectionLabel label="ページ" />
        <For each={PAGE_NAV}>{(item) => <NavBtn item={item} />}</For>

        <SectionLabel label="ノートブック" />
        <button
          class="nav-btn w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors"
          classList={{
            'bg-nacc-light font-medium text-nacc-dark': state.page === 'notebook',
            'text-[#555] hover:bg-[#f5f4f1]': state.page !== 'notebook',
          }}
          onClick={() => navigate('notebook')}
        >
          <span class="sidebar-icon">📚</span>
          <span class="sidebar-label truncate">ノートブック</span>
        </button>

      </nav>

      {/* Trash */}
      <div class="px-2 py-2 border-t border-nacc-border">
        <button
          class="nav-btn w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors text-[#999] hover:bg-red-50 hover:text-red-500"
          classList={{ 'bg-red-50 text-red-500': state.page === 'trash' }}
          data-page="trash"
          onClick={() => navigate('trash')}
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="sidebar-label">ごみ箱</span>
          {state.trashBlogs.length > 0 && (
            <span class="sidebar-label ml-auto text-xs bg-red-100 text-red-500 rounded-full px-1.5 py-0.5 font-medium min-w-5 text-center">
              {state.trashBlogs.length}
            </span>
          )}
        </button>
      </div>

      {/* User */}
      <div class="p-3 border-t border-nacc-border text-xs text-[#999]">
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-5 rounded-full bg-nacc-gold/20 flex items-center justify-center text-nacc-gold font-bold text-xs">
            N
          </div>
          <span class="sidebar-label">Note_Story user</span>
        </div>
      </div>
    </>
)

const Sidebar: Component = () => (
  <aside
    id="sidebar"
    class="w-52 bg-white border-r border-nacc-border flex flex-col shrink-0 overflow-hidden"
    classList={{ 'sidebar-open': state.sidebarOpen }}
  >
      <Show when={state.page === 'study'} fallback={<DefaultSidebarContent />}>
        <StudySidebarContent />
      </Show>
    </aside>
)

export default Sidebar
