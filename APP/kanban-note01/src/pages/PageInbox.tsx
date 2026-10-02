import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { navigate, setState, state, syncInboxItem, syncPendingInboxItems, updateInboxItem } from '../store'
import { loadAssetTags } from '../dataBridge/assetTagDb'
import { loadConceptDb } from '../dataBridge/conceptDb'
import { galleryState, selectGalleryItem, setGalleryState } from './gallery/store'
import { toAllAssetsGalleryAsset } from '../dataBridge/firebaseGallery'
import { ASSET_STATUS_LABELS, SYNC_STATUS_LABELS } from './gallery/types'
import type { InboxItem } from '../types'

type DbHubMode = 'inbox' | 'noteDb' | 'tagDb' | 'archive' | 'assetTags' | 'conceptDb' | 'galleryDb' | 'allAssets' | 'scenarioDb'
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
  return saved === 'noteDb' || saved === 'tagDb' || saved === 'archive' || saved === 'assetTags' || saved === 'conceptDb' || saved === 'galleryDb' || saved === 'allAssets' || saved === 'scenarioDb' ? saved : 'inbox'
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
  const conceptItems = createMemo(() => loadConceptDb())
  const galleryAssets = createMemo(() => galleryState.items.filter((item) => !item.isDeleted))
  const allAssetsGalleryAssets = createMemo(() => galleryAssets().map((item) => toAllAssetsGalleryAsset(item)))
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
      <button type="button" classList={{ active: dbMode() === 'conceptDb' }} onClick={() => changeDbMode('conceptDb')}>Concept DB</button>
      <button type="button" classList={{ active: dbMode() === 'galleryDb' }} onClick={() => changeDbMode('galleryDb')}>Gallery DB</button>
      <button type="button" classList={{ active: dbMode() === 'allAssets' }} onClick={() => changeDbMode('allAssets')}>AllAssets</button>
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

  const ConceptDbView = () => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>LOCAL DB</span>
          <h2>Concept DB</h2>
          <p>本文読解に使った漢字Keyを集め、どこのノート・ファイルで使われたかを蓄積する。</p>
        </div>
        <button type="button" onClick={() => navigate('study')}>Studyで読む</button>
      </div>
      <div class="global-db-summary-grid">
        <div><span>概念Key</span><strong>{conceptItems().length}</strong></div>
        <div><span>使用元</span><strong>{new Set(conceptItems().map((item) => item.sourceFile)).size}</strong></div>
        <div><span>空カラム</span><strong>4</strong></div>
      </div>
      <div class="global-db-table concept-db-table">
        <div class="concept-db-head">
          <strong>Key</strong>
          <strong>説明</strong>
          <strong>使用元</strong>
          <strong>言語関連</strong>
        </div>
        <For each={conceptItems()}>
          {(item) => (
            <button
              type="button"
              class="concept-db-row"
              onClick={() => navigate('study')}
              title={`${item.sourceNotebook} / ${item.sourceFile}`}
            >
              <strong>{item.key}</strong>
              <span>{item.description}</span>
              <small>{item.sourceNotebook} / {item.sourceFile} / {item.sourceSection}</small>
              <em>
                {item.programmingLanguage || 'programmingLanguage: 空'}
                {' / '}
                {item.developmentLanguage || 'developmentLanguage: 空'}
              </em>
            </button>
          )}
        </For>
      </div>
      <details class="global-db-raw-json" open>
        <summary>Concept DB schema preview</summary>
        <pre>{JSON.stringify({
          schema: 'kanban-note01.concept_db.v0_1',
          columns: [
            'id',
            'key',
            'description',
            'category',
            'sourceNotebook',
            'sourceFile',
            'sourcePath',
            'sourceSection',
            'sourceLineHint',
            'usedIn',
            'programmingLanguage',
            'developmentLanguage',
            'languageMeaning',
            'codeRelation',
            'status',
            'createdAt',
            'updatedAt',
          ],
          items: conceptItems(),
        }, null, 2)}</pre>
      </details>
    </section>
  )

  const GalleryDbView = () => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>GALLERY DB</span>
          <h2>Gallery DB</h2>
          <p>画像本体はStorage、メタデータはGallery DBとして分離する前提のローカル一覧</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setGalleryState({ view: 'pinterest' })
            navigate('gallery')
          }}
        >
          Galleryで見る
        </button>
      </div>
      <div class="global-db-summary-grid">
        <div><span>画像数</span><strong>{galleryAssets().length}</strong></div>
        <div><span>お気に入り</span><strong>{galleryAssets().filter((item) => item.isFavorite).length}</strong></div>
        <div><span>ローカル画像</span><strong>{galleryAssets().filter((item) => item.id.startsWith('local_gallery_')).length}</strong></div>
        <div><span>クラウド候補</span><strong>{allAssetsGalleryAssets().filter((asset) => asset.syncStatus === 'synced').length}</strong></div>
        <div><span>未同期</span><strong>{allAssetsGalleryAssets().filter((asset) => asset.syncStatus === 'local' || asset.syncStatus === 'queued' || asset.syncStatus === 'disabled').length}</strong></div>
        <div><span>要確認</span><strong>{allAssetsGalleryAssets().filter((asset) => asset.syncStatus === 'error' || asset.intake.status === 'needs_metadata').length}</strong></div>
      </div>
      <DbList rows={galleryAssets().map((item) => {
        const asset = toAllAssetsGalleryAsset(item)
        return {
          id: item.id,
          name: item.label || item.filename,
          type: asset.category,
          relation: [
            item.tags.length ? `tags:${item.tags.slice(0, 3).join(',')}` : 'Asset Tag DB',
            `source:${asset.source.sourceType}`,
            asset.storagePath ? 'storage' : 'localDataUrl',
          ].filter(Boolean).join(' / '),
          status: `${ASSET_STATUS_LABELS[asset.assetStatus]} / ${SYNC_STATUS_LABELS[asset.syncStatus]}`,
          updated: new Date(item.updatedAt).toLocaleDateString('ja-JP'),
          onOpen: () => {
            setGalleryState({ view: 'pinterest' })
            selectGalleryItem(item.id)
            navigate('gallery')
          },
        }
      })} empty="Gallery画像はまだありません" />
      <details class="global-db-raw-json">
        <summary>GalleryAsset metadata preview</summary>
        <pre>{JSON.stringify(allAssetsGalleryAssets(), null, 2)}</pre>
      </details>
    </section>
  )

  const AllAssetsDbDesignView = () => (
    <section class="global-db-json-view">
      <div class="global-db-card-head">
        <div>
          <span>SAMPLE MASTER DB</span>
          <h2>AllAssets</h2>
          <p>全素材MasterDBを作る前に、必要なDB、カラム、relation、tagをテキストで確認する仮設計室。</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setGalleryState({ view: 'pinterest' })
            navigate('gallery')
          }}
        >
          Pinterest素材を見る
        </button>
      </div>

      <div class="global-db-summary-grid">
        <div><span>DB候補</span><strong>4</strong></div>
        <div><span>View候補</span><strong>6</strong></div>
        <div><span>Source</span><strong>APP04</strong></div>
      </div>

      <DbList rows={[
        {
          id: 'gallery-assets',
          name: 'GalleryAsset DB',
          type: 'Master',
          relation: 'Storage / AssetTag / TitleTag / AssetUsage',
          status: 'sample',
          updated: '-',
          onOpen: () => changeDbMode('galleryDb'),
        },
        {
          id: 'asset-tags',
          name: 'AssetTag DB',
          type: 'Tag',
          relation: 'GalleryAsset.category / usageScopes',
          status: 'sample',
          updated: '-',
          onOpen: () => changeDbMode('assetTags'),
        },
        {
          id: 'title-tags',
          name: 'TitleTag DB',
          type: 'Project Tag',
          relation: 'GameTitle / TitleGameStudio / Scenario',
          status: 'draft',
          updated: '-',
        },
        {
          id: 'asset-usages',
          name: 'AssetUsage DB',
          type: 'Relation',
          relation: 'Note / Blog / novelEngine / GameLab / GameHub',
          status: 'draft',
          updated: '-',
        },
      ]} />

      <div class="global-db-card-head" style={{ "margin-top": "1rem" }}>
        <div>
          <span>COLUMN MAP</span>
          <h2>カラム一覧</h2>
          <p>各DBが持つ情報を、あとでschema化しやすい粒度で並べる。</p>
        </div>
      </div>
      <DbList rows={[
        {
          id: 'col-gallery-identity',
          name: 'GalleryAsset / 基本',
          type: 'id,label,filename,category',
          relation: 'AssetTag / TitleTagの入口',
          status: 'required',
          updated: '-',
        },
        {
          id: 'col-gallery-storage',
          name: 'GalleryAsset / Storage',
          type: 'storagePath,downloadUrl,thumbnailPath,thumbnailUrl',
          relation: 'Firebase Storage',
          status: 'required',
          updated: '-',
        },
        {
          id: 'col-gallery-file',
          name: 'GalleryAsset / File',
          type: 'mimeType,fileSize,width,height',
          relation: 'PWA upload metadata',
          status: 'auto',
          updated: '-',
        },
        {
          id: 'col-gallery-state',
          name: 'GalleryAsset / State',
          type: 'status,sync,source,createdAt,updatedAt',
          relation: 'Sync Queue / Error Queue',
          status: 'required',
          updated: '-',
        },
        {
          id: 'col-asset-tag',
          name: 'AssetTag',
          type: 'id,label,group,scopes,status,description',
          relation: 'GalleryAsset.assetTagIds',
          status: 'master',
          updated: '-',
        },
        {
          id: 'col-title-tag',
          name: 'TitleTag',
          type: 'id,label,titleId,projectKind,status,description',
          relation: 'GalleryAsset.titleTagIds / GameTitle',
          status: 'master',
          updated: '-',
        },
        {
          id: 'col-asset-usage',
          name: 'AssetUsage',
          type: 'assetId,appId,titleId,studioId,usageType,slotKey',
          relation: 'Note / Blog / novelEngine / GameLab / GameHub',
          status: 'relation',
          updated: '-',
        },
      ]} />

      <div class="global-db-card-head" style={{ "margin-top": "1rem" }}>
        <div>
          <span>RELATION MAP</span>
          <h2>Relation関係</h2>
          <p>正規参照は利用側がassetIdを持ち、GalleryAsset側は逆参照で利用状況を見る。</p>
        </div>
      </div>
      <DbList rows={[
        {
          id: 'rel-asset-tag',
          name: 'GalleryAsset -> AssetTag',
          type: 'many-to-many',
          relation: 'galleryAssets.assetTagIds[] -> assetTags.id',
          status: 'classify',
          updated: '-',
        },
        {
          id: 'rel-title-tag',
          name: 'GalleryAsset -> TitleTag',
          type: 'many-to-many',
          relation: 'galleryAssets.titleTagIds[] -> titleTags.id',
          status: 'project',
          updated: '-',
        },
        {
          id: 'rel-usage',
          name: 'AssetUsage -> GalleryAsset',
          type: 'many-to-one',
          relation: 'assetUsages.assetId -> galleryAssets.id',
          status: 'usage',
          updated: '-',
        },
        {
          id: 'rel-blog',
          name: 'Blog -> GalleryAsset',
          type: 'one-to-one',
          relation: 'blog.coverGalleryAssetId -> galleryAssets.id',
          status: 'cover',
          updated: '-',
        },
        {
          id: 'rel-note',
          name: 'Note -> GalleryAsset',
          type: 'many-to-many',
          relation: 'note.attachmentAssetIds[] -> galleryAssets.id',
          status: 'attach',
          updated: '-',
        },
        {
          id: 'rel-gamelab',
          name: 'TitleGameStudio -> GalleryAsset',
          type: 'many-to-many',
          relation: 'assetRefs[].galleryAssetId -> galleryAssets.id',
          status: 'selected',
          updated: '-',
        },
        {
          id: 'rel-gamehub',
          name: 'GameHub -> GalleryAsset',
          type: 'one-to-many',
          relation: 'gameTitle.thumbnailGalleryAssetId / publicAssetIds[]',
          status: 'published',
          updated: '-',
        },
      ]} />

      <div class="global-db-card-head" style={{ "margin-top": "1rem" }}>
        <div>
          <span>TAG WORD DB</span>
          <h2>素材の性質タグ</h2>
          <p>画像やUIを分類するための言葉をAssetTag DBに集める。作品名ではなく素材の性質を表す。</p>
        </div>
        <button type="button" onClick={() => navigate('assetTags')}>Asset Tag DBで編集</button>
      </div>
      <DbList rows={assetTags().map((tag) => ({
        id: `word-${tag.id}`,
        name: tag.labelJa,
        type: tag.group,
        relation: tag.scopes.join(' / '),
        status: tag.status,
        updated: new Date(tag.updatedAt).toLocaleDateString('ja-JP'),
        onOpen: () => navigate('assetTags'),
      }))} />

      <details class="global-db-raw-json" open>
        <summary>Sample MasterDB設計メモ</summary>
        <pre>{`# AllAssets Sample MasterDB

目的:
Android PWAで保存した画像、Note素材、novelEngine生成素材、GameLab採用素材を1つのMasterDBで整理する。

データの正:
- 画像本体: Firebase Storage
- メタデータ: Firestore galleryAssets
- タグ: assetTags / titleTags
- 採用情報: assetUsages

DB:
1. GalleryAsset DB
   id
   label
   filename
   category
   assetTagIds
   titleTagIds
   usageScopes
   storagePath
   downloadUrl
   thumbnailPath
   thumbnailUrl
   mimeType
   fileSize
   width
   height
   status
   sync
   relation
   createdAt
   updatedAt

2. AssetTag DB
   id
   label
   group
   scopes
   status
   description

3. TitleTag DB
   id
   label
   titleId
   projectKind
   status
   description

4. AssetUsage DB
   id
   assetId
   appId
   titleId
   studioId
   usageType
   slotKey
   usageStatus
   targetPath
   memo

View:
- Table: Notion風リストDB
- Gallery: カード型
- Pinterest: 未登録素材・参考画像
- Board: status別
- Detail: 1素材の詳細
- Relation: どこで使っているか

Status:
- localDraft
- cloudDraft
- active
- selected
- used_in_runtime
- published
- archived
- error

運用:
APP04 Noteは画像追加入口。
AllAssetHubは全素材整理。
CreatorGameLabは作品ごとの採用素材確認。
GameHubは公開素材だけを見る。
`}</pre>
      </details>

      <details class="global-db-raw-json" open>
        <summary>開発資料パック</summary>
        <pre>{`# AllAssets 開発資料パック

目的:
Androidから見ながら、AllAssetHub / Firebase Hub / GameLab / Note連携の資料を確認できるようにする。

## 1. DB設計書

資料名:
- 仕様_allassets_gallery_asset_schema_v0.1.md
- 仕様_allassets_asset_tag_schema_v0.1.md
- 仕様_allassets_title_tag_schema_v0.1.md
- 仕様_allassets_asset_usage_schema_v0.1.md
- 仕様_allassets_column_registry_v0.1.md

確認すること:
- カラム名
- 型
- 必須/任意
- relation
- tag
- status
- Firebase保存先

## 2. 画面別レイアウト書

資料名:
- 画面_allassets_home_layout_v0.1.md
- 画面_allassets_table_view_v0.1.md
- 画面_allassets_pinterest_view_v0.1.md
- 画面_allassets_detail_panel_v0.1.md
- 画面_allassets_relation_view_v0.1.md
- 画面_allassets_sync_queue_v0.1.md

確認すること:
- Android縦画面
- PC横画面
- Header
- DB selector
- View switcher
- Detail panel
- Drawer / Overlay

## 3. 運用ルール

資料名:
- 運用_allassets_status_rule_v0.1.md
- 運用_allassets_tag_rule_v0.1.md
- 運用_allassets_relation_rule_v0.1.md
- 運用_allassets_public_asset_rule_v0.1.md

確認すること:
- localDraft / cloudDraft / active / selected / published
- AssetTagとTitleTagの違い
- 正規参照と逆参照
- 公開素材と非公開素材の分離

## 4. APP連携

資料名:
- 接続_app04_note_to_allassets_v0.1.md
- 接続_novelengine_to_allassets_v0.1.md
- 接続_gamelab_to_allassets_v0.1.md
- 接続_gamehub_to_allassets_v0.1.md

確認すること:
- APP04は画像追加入口
- novelEngineは生成素材登録
- GameLabは採用素材確認
- GameHubは公開素材確認

## 5. Task / TODO

資料名:
- 工程_allassets_mvp_todo_v0.1.md
- 納品_allassets_mvp_checklist_v0.1.md
- 報告_allassets_progress_report_YYYY-MM-DD.md

確認すること:
- 次に作るもの
- どこまでできたか
- 何が未確認か
- Kanbanへ何を報告するか

## 6. 参照Memory

参照先:
- C:/00_master/Memory/APP02_FirebaseHub/all_asset_hub_masterdb_design_2026-06-29.md
- C:/00_master/Memory/APP02_FirebaseHub/all_asset_hub_notion_db_view_development_thinking_2026-06-29.md
- C:/00_master/Memory/APP02_FirebaseHub/note_app_db_ui_snippet_reference_for_all_asset_hub_2026-06-29.md
- C:/00_master/CreatorHub/LIBRARY/DESIGN/DEVELOPMENT_DOCUMENT_INDEX_2026-06-29.md

Android確認時の見方:
1. Note_Storyロゴ
2. AllAssets設計室
3. DB候補を見る
4. 開発資料パックを見る
5. 画面別レイアウト書の不足をメモする
`}</pre>
      </details>

      <details class="global-db-raw-json">
        <summary>画面別レイアウトたたき台</summary>
        <pre>{`# AllAssets 画面別レイアウトたたき台

## Home / DB Hub

Header:
- AllAssetHub logo
- DB selector
- View switcher
- Search
- Filter

Main:
- Active DBのView

Right Panel:
- 選択中Assetの概要
- Relation summary

Bottom Drawer:
- Sync Queue
- Error Queue

## Table View

目的:
Notion風にカラムを確認する。

表示:
- thumbnail
- label
- category
- assetTagIds
- titleTagIds
- status
- usageScopes
- updatedAt

Android:
- 主要カラムだけ表示
- 詳細は横スクロールではなくDetail Drawerへ逃がす

## Pinterest View

目的:
未登録画像、参考画像、背景、キャラ案を見やすくする。

表示:
- image
- label
- tag chips
- status badge

Android:
- 2 columns
- tapでDetail Drawer

PC:
- 4-6 columns
- right detail panel

## Detail Panel

目的:
1素材の編集・確認。

表示:
- preview
- label
- filename
- category
- tags
- titleTags
- relation
- sync
- source

## Relation View

目的:
素材がどこで使われているか確認する。

表示:
- Note
- Blog
- Scenario
- novelEngine
- TitleGameStudio
- GameHub

## Sync Queue

目的:
同期状態を確認する。

表示:
- syncing
- error
- retryCount
- lastAttemptAt
- errorMessage
`}</pre>
      </details>
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
        { id: 'galleryDb', name: 'Gallery DB', type: 'Image Asset', relation: 'Asset Tag DB / Blog Cover / Note', status: 'view', updated: '-', onOpen: () => changeDbMode('galleryDb') },
        { id: 'assetTags', name: 'Asset Tag DB', type: 'Asset', relation: 'Gallery / Note / NovelEngine', status: 'source', updated: '-', onOpen: () => changeDbMode('assetTags') },
        { id: 'conceptDb', name: 'Concept DB', type: 'Knowledge', relation: 'Study / Note / Source File', status: 'source', updated: '-', onOpen: () => changeDbMode('conceptDb') },
        { id: 'noteDb', name: 'Note DB', type: 'Notebook', relation: 'Title DB / Character DB', status: 'view', updated: '-', onOpen: () => changeDbMode('noteDb') },
      ]} />
    </section>
  )

  const HubContent = () => (
    <Show when={dbMode() === 'inbox'} fallback={
      <Show when={dbMode() === 'noteDb'} fallback={
        <Show when={dbMode() === 'tagDb'} fallback={
          <Show when={dbMode() === 'archive'} fallback={
            <Show when={dbMode() === 'assetTags'} fallback={
              <Show when={dbMode() === 'conceptDb'} fallback={
                <Show when={dbMode() === 'galleryDb'} fallback={
                  <Show when={dbMode() === 'allAssets'} fallback={<ScenarioDbView />}>
                    <AllAssetsDbDesignView />
                  </Show>
                }>
                  <GalleryDbView />
                </Show>
              }>
                <ConceptDbView />
              </Show>
            }>
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
