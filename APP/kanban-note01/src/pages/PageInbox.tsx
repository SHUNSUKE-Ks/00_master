import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { navigate, setState, state, syncInboxItem, syncPendingInboxItems, updateInboxItem } from '../store'
import { loadAssetTags } from '../dataBridge/assetTagDb'
import type { InboxItem } from '../types'

type DbHubMode = 'inbox' | 'noteDb' | 'tagDb' | 'archive' | 'assetTags' | 'scenarioDb'
const DB_HUB_MODE_KEY = 'note-story-db-hub-mode-v1'
type DbListRow = {
  id: string
  name: string
  type: string
  relation: string
  status: string
  updated: string
  onOpen?: () => void
}

function initDbHubMode(): DbHubMode {
  if (typeof window === 'undefined') return 'inbox'
  const saved = sessionStorage.getItem(DB_HUB_MODE_KEY)
  return saved === 'noteDb' || saved === 'tagDb' || saved === 'archive' || saved === 'assetTags' || saved === 'scenarioDb' ? saved : 'inbox'
}

function syncLabel(item: InboxItem) {
  if (item.syncStatus === 'synced') return '同期済み'
  if (item.syncStatus === 'syncing') return '同期中'
  if (item.syncStatus === 'error') return '同期失敗'
  return '未同期'
}

const PageInbox: Component = () => {
  const [dbMode, setDbMode] = createSignal<DbHubMode>(initDbHubMode())
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [mobileDetail, setMobileDetail] = createSignal(false)
  const [search, setSearch] = createSignal('')
  const [tagFilter, setTagFilter] = createSignal('')

  const legacyInboxNotebook = createMemo(() => state.notebooks.find((notebook) => notebook.id === 'story-inbox' || notebook.title === 'InBox'))
  const inboxTagDbPage = createMemo(() => legacyInboxNotebook()?.pages.find((page) => page.id === 'inbox-tag-db' || page.title === 'tagDB'))
  const inboxArchivePage = createMemo(() => legacyInboxNotebook()?.pages.find((page) => page.id === 'inbox-archive' || page.title === 'Archive'))
  const favoriteNotebooks = createMemo(() => state.notebooks.filter((notebook) => notebook.favorite))
  const assetTags = createMemo(() => loadAssetTags())
  const archivedItems = createMemo(() => state.inboxItems.filter((item) => item.status === 'archived'))
  const tags = createMemo(() => Array.from(new Set(state.inboxItems.map((item) => item.tag))).sort((a, b) => a.localeCompare(b, 'ja')))
  const items = createMemo(() => {
    const query = search().trim().toLowerCase()
    return state.inboxItems.filter((item) => {
      if (tagFilter() && item.tag !== tagFilter()) return false
      if (!query) return true
      return `${item.subject}\n${item.body}\n${item.tag}\n${item.relatedIdea ?? ''}`.toLowerCase().includes(query)
    })
  })
  const selected = createMemo(() => state.inboxItems.find((item) => item.id === selectedId()) ?? items()[0])

  function select(item: InboxItem) {
    setSelectedId(item.id)
    setMobileDetail(true)
  }

  function changeDbMode(mode: DbHubMode) {
    setDbMode(mode)
    if (typeof window !== 'undefined') sessionStorage.setItem(DB_HUB_MODE_KEY, mode)
    setMobileDetail(false)
    console.log('[APP04-DB-HUB] 13-1 Switch global DB hub mode', { mode })
  }

  function readJsonPreview(raw = '') {
    try {
      return JSON.stringify(JSON.parse(raw || '{}'), null, 2)
    } catch {
      return raw || 'データがありません'
    }
  }

  function readInboxTagRows(): DbListRow[] {
    try {
      const parsed = JSON.parse(inboxTagDbPage()?.body || '{}') as { tags?: string[] }
      return (parsed.tags ?? []).map((tag) => ({
        id: `tag-${tag}`,
        name: tag,
        type: 'Tag',
        relation: 'InBox / Note',
        status: 'active',
        updated: '-',
      }))
    } catch {
      return []
    }
  }

  const DbList = (props: { rows: DbListRow[]; empty?: string }) => (
    <div class="global-db-list">
      <div class="global-db-list-head">
        <span>Name</span>
        <span>Type</span>
        <span>Relation</span>
        <span>Status</span>
        <span>Updated</span>
      </div>
      <Show when={props.rows.length} fallback={<div class="global-inbox-empty">{props.empty ?? 'データがありません'}</div>}>
        <For each={props.rows}>
          {(row) => (
            <button
              type="button"
              class="global-db-list-row"
              disabled={!row.onOpen}
              onClick={() => row.onOpen?.()}
            >
              <strong>{row.name}</strong>
              <span>{row.type}</span>
              <span>{row.relation}</span>
              <span>{row.status}</span>
              <time>{row.updated}</time>
            </button>
          )}
        </For>
      </Show>
    </div>
  )

  const DbHubTabs = () => (
    <div class="global-db-tabs">
      <button type="button" classList={{ active: dbMode() === 'inbox' }} onClick={() => changeDbMode('inbox')}>InBox</button>
      <button type="button" classList={{ active: dbMode() === 'noteDb' }} onClick={() => changeDbMode('noteDb')}>Note DB</button>
      <button type="button" classList={{ active: dbMode() === 'tagDb' }} onClick={() => changeDbMode('tagDb')}>InBox Tag DB</button>
      <button type="button" classList={{ active: dbMode() === 'archive' }} onClick={() => changeDbMode('archive')}>Archive DB</button>
      <button type="button" classList={{ active: dbMode() === 'assetTags' }} onClick={() => changeDbMode('assetTags')}>Asset Tag DB</button>
      <button type="button" classList={{ active: dbMode() === 'scenarioDb' }} onClick={() => changeDbMode('scenarioDb')}>Scenario DB</button>
    </div>
  )

  const List = () => (
    <section class="global-inbox-list">
      <div class="global-inbox-toolbar">
        <input type="search" value={search()} onInput={(event) => setSearch(event.currentTarget.value)} placeholder="InBoxを検索..." />
        <select value={tagFilter()} onChange={(event) => setTagFilter(event.currentTarget.value)}>
          <option value="">すべてのTag</option>
          <For each={tags()}>{(tag) => <option value={tag}>{tag}</option>}</For>
        </select>
      </div>
      <div class="global-inbox-items">
        <Show when={items().length} fallback={<div class="global-inbox-empty">InBoxは空です</div>}>
          <For each={items()}>
            {(item) => (
              <button type="button" class="global-inbox-item" classList={{ active: selected()?.id === item.id }} onClick={() => select(item)}>
                <div class="global-inbox-item-head"><strong>{item.subject}</strong><span class={item.syncStatus}>{syncLabel(item)}</span></div>
                <p>{item.body}</p>
                <div><span>#{item.tag}</span><time>{new Date(item.updatedAt).toLocaleDateString('ja-JP')}</time></div>
              </button>
            )}
          </For>
        </Show>
      </div>
    </section>
  )

  const Detail = () => (
    <section class="global-inbox-detail">
      <Show when={selected()} fallback={<div class="global-inbox-empty">項目を選択してください</div>}>
        {(item) => (
          <>
            <div class="global-inbox-detail-head">
              <button type="button" class="global-inbox-mobile-back" onClick={() => setMobileDetail(false)}>戻る</button>
              <div><span>#{item().tag}</span><h1>{item().subject}</h1></div>
              <select value={item().status} onChange={(event) => updateInboxItem(item().id, { status: event.currentTarget.value as InboxItem['status'] })}>
                <option value="inbox">未対応</option>
                <option value="working">対応中</option>
                <option value="done">対応済み</option>
                <option value="archived">Archive</option>
              </select>
            </div>
            <div class="global-inbox-body">{item().body}</div>
            <dl class="global-inbox-meta">
              <dt>送信元</dt><dd>{item().sourceNotebookTitle ?? item().sourceView}{item().sourcePageTitle ? ` / ${item().sourcePageTitle}` : ''}</dd>
              <dt>関連</dt><dd>{item().relatedIdea || '未指定'}</dd>
              <dt>同期</dt><dd>{syncLabel(item())}</dd>
            </dl>
            <Show when={item().syncError}><p class="global-inbox-sync-error">{item().syncError}</p></Show>
            <button type="button" class="global-inbox-sync-btn" disabled={item().syncStatus === 'syncing'} onClick={() => syncInboxItem(item().id)}>同期する</button>
          </>
        )}
      </Show>
    </section>
  )

  const JsonDbView = (props: { title: string; subtitle: string; rows: DbListRow[]; body?: string; actionLabel?: string; onAction?: () => void }) => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>LOCAL DB</span>
          <h2>{props.title}</h2>
          <p>{props.subtitle}</p>
        </div>
        <Show when={props.actionLabel && props.onAction}>
          <button type="button" onClick={props.onAction}>{props.actionLabel}</button>
        </Show>
      </div>
      <DbList rows={props.rows} />
      <details class="global-db-raw-json">
        <summary>JSON原本</summary>
        <pre>{readJsonPreview(props.body)}</pre>
      </details>
    </section>
  )

  const AssetTagDbView = () => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>LOCAL DB</span>
          <h2>Asset Tag DB</h2>
          <p>Gallery / Note / NovelEngineで共通利用する画像アセットタグ</p>
        </div>
        <button type="button" onClick={() => navigate('assetTags')}>専用ページで編集</button>
      </div>
      <div class="global-db-summary-grid">
        <div><span>総数</span><strong>{assetTags().length}</strong></div>
        <div><span>使用中</span><strong>{assetTags().filter((tag) => tag.status === 'active').length}</strong></div>
        <div><span>整理候補</span><strong>{assetTags().filter((tag) => tag.status !== 'active').length}</strong></div>
      </div>
      <DbList rows={assetTags().map((tag) => ({
        id: tag.id,
        name: tag.labelJa,
        type: tag.group,
        relation: tag.scopes.join(' / '),
        status: tag.status,
        updated: new Date(tag.updatedAt).toLocaleDateString('ja-JP'),
        onOpen: () => navigate('assetTags'),
      }))} />
    </section>
  )

  const NoteDbView = () => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>NOTE DB</span>
          <h2>お気に入りノート</h2>
          <p>ノートブック一覧で ★ を付けたものだけをここに表示</p>
        </div>
        <button type="button" onClick={() => navigate('notebook')}>ノートブックへ</button>
      </div>
      <div class="global-db-summary-grid">
        <div><span>お気に入り</span><strong>{favoriteNotebooks().length}</strong></div>
        <div><span>全ノート</span><strong>{state.notebooks.length}</strong></div>
        <div><span>ページ合計</span><strong>{favoriteNotebooks().reduce((sum, notebook) => sum + notebook.pages.length, 0)}</strong></div>
      </div>
      <DbList rows={favoriteNotebooks().map((notebook) => ({
        id: notebook.id ?? notebook.title,
        name: `★ ${notebook.title}`,
        type: 'Notebook',
        relation: `${notebook.pages.length} pages`,
        status: 'favorite',
        updated: new Date(notebook.updatedAt).toLocaleDateString('ja-JP'),
        onOpen: () => {
          setState({
            selectedNotebookId: notebook.id,
            selectedNotebookPageId: notebook.pages[0]?.id ?? null,
          })
          navigate('notebook')
        },
      }))} empty="★を付けたノートはまだありません" />
    </section>
  )

  const ScenarioDbView = () => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>APP DB</span>
          <h2>Scenario DB</h2>
          <p>Title DB / Character DB / Asset Tag DB をこのDB Hubから参照する</p>
        </div>
      </div>
      <DbList rows={[
        { id: 'db01', name: 'Title DB', type: 'Scenario', relation: 'Character DB / Note DB', status: 'source', updated: '-', onOpen: () => { setState({ dbView: 'table' }); navigate('db01') } },
        { id: 'db02', name: 'Character DB', type: 'Character', relation: 'Title DB / Note DB', status: 'source', updated: '-', onOpen: () => { setState({ dbView: 'table' }); navigate('db02') } },
        { id: 'assetTags', name: 'Asset Tag DB', type: 'Asset', relation: 'Gallery / Note / NovelEngine', status: 'source', updated: '-', onOpen: () => changeDbMode('assetTags') },
        { id: 'noteDb', name: 'Note DB', type: 'Notebook', relation: 'Title DB / Character DB', status: 'view', updated: '-', onOpen: () => changeDbMode('noteDb') },
      ]} />
    </section>
  )

  const HubContent = () => (
    <Show when={dbMode() === 'inbox'} fallback={
      <Show when={dbMode() === 'noteDb'} fallback={
        <Show when={dbMode() === 'tagDb'} fallback={
          <Show when={dbMode() === 'archive'} fallback={
            <Show when={dbMode() === 'assetTags'} fallback={<ScenarioDbView />}>
              <AssetTagDbView />
            </Show>
          }>
            <JsonDbView
              title="Archive DB"
              subtitle="旧InBox内のArchive DBを専用DB場所から参照"
              body={inboxArchivePage()?.body}
              rows={archivedItems().map((item) => ({
                id: item.id,
                name: item.subject,
                type: 'Archive',
                relation: item.relatedIdea || item.sourcePageTitle || '未指定',
                status: item.syncStatus,
                updated: new Date(item.updatedAt).toLocaleDateString('ja-JP'),
              }))}
            />
          </Show>
        }>
          <JsonDbView title="InBox Tag DB" subtitle="旧InBox内のtagDBを専用DB場所から参照" body={inboxTagDbPage()?.body} rows={readInboxTagRows()} />
        </Show>
      }>
        <NoteDbView />
      </Show>
    }>
      <div class="global-inbox-layout" classList={{ 'show-detail': mobileDetail() }}>
        <List />
        <Detail />
      </div>
    </Show>
  )

  return (
    <div class="global-inbox-page">
      <header class="global-inbox-page-head">
        <div><span>GLOBAL DB HUB</span><h1>{dbMode() === 'inbox' ? 'InBox' : 'Database'}</h1></div>
        <button type="button" onClick={() => syncPendingInboxItems()}>同期チェック</button>
        <button type="button" class="primary" onClick={() => setState({ inboxComposerOpen: true })}>+ 新規</button>
      </header>
      <DbHubTabs />
      <HubContent />
    </div>
  )
}

export default PageInbox
