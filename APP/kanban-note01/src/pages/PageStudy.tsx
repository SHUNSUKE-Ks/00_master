import { type Component, For, Show, createEffect, createResource, createSignal } from 'solid-js'
import MarkdownView from '../components/MarkdownView'
import { rpaJobSyncEnabled, sendRpaJobToFirebase } from '../db/firebase'
import { addBlog, addMemo, navigate, setState, state } from '../store'
import {
  RPA_SAMPLE_PACK,
  buildRpaImportDrafts,
  parseRpaMaterialPack,
} from '../dataBridge/rpaMaterialPack'
import {
  CATEGORY_META,
  STUDY_CARDS,
  studyCardListLabel,
  studyCardsByCategory,
  type StudyCard,
} from '../dataBridge/studyLibrary'
import {
  OSS_CANDIDATES,
  type OssCandidateGenre,
  type OssCandidateStatus,
} from '../dataBridge/ossCandidateDb'
import {
  OUTPUT_FORMAT_SCHEMAS,
  currentOutputFormatsForGenre,
  type OutputFormatAction,
} from '../dataBridge/outputFormatSchemaDb'
import {
  isStudyFavorite,
  isStudyCardRead,
  markStudyCardRead,
  selectedStudyCardId,
  setSelectedStudyCardId,
  setStudyViewIntent,
  studyCategory,
  studyViewIntent,
  toggleStudyFavorite,
} from './studyState'

type StudyView = 'cards' | 'article'
type StudyTab = 'library' | 'db' | 'import' | 'reader'
type StudyDbView = 'ossCandidates' | 'studyCards' | 'outputFormats'

const PageStudy: Component = () => {
  const [view, setView] = createSignal<StudyView>('cards')
  const [tab, setTab] = createSignal<StudyTab>('library')
  const [dbView, setDbView] = createSignal<StudyDbView>('ossCandidates')
  const [rpaPackText, setRpaPackText] = createSignal(RPA_SAMPLE_PACK)
  const [importMessage, setImportMessage] = createSignal('')
  const [selectedRpaMemoId, setSelectedRpaMemoId] = createSignal<string | null>(null)
  const isNewCard = (card: StudyCard) => Boolean(card.addedAt) && !isStudyCardRead(card.id)
  const categoryCards = () =>
    [...studyCardsByCategory(studyCategory())].sort((a, b) => {
      const newScore = Number(isNewCard(b)) - Number(isNewCard(a))
      if (newScore !== 0) return newScore
      return (b.addedAt ?? '').localeCompare(a.addedAt ?? '')
    })
  const selectedCard = () => STUDY_CARDS.find((card) => card.id === selectedStudyCardId()) ?? STUDY_CARDS[0]
  const rpaMemos = () => state.memos.filter((memo) => memo.tags.some((tag) => tag.name === 'rpa'))
  const selectedRpaMemo = () =>
    rpaMemos().find((memo) => memo.id === selectedRpaMemoId()) ?? rpaMemos()[0]
  const [markdown] = createResource(selectedCard, async (card) => {
    const response = await fetch(card.file)
    return response.ok ? response.text() : '# 読み込み失敗\n\nサンプル記事を読み込めませんでした。'
  })

  createEffect(() => {
    setView(studyViewIntent())
  })

  function openCard(card: StudyCard) {
    setSelectedRpaMemoId(null)
    markStudyCardRead(card.id)
    setSelectedStudyCardId(card.id)
    setStudyViewIntent('article')
    setView('article')
    setTab('library')
  }

  async function importRpaPack() {
    try {
      const pack = parseRpaMaterialPack(rpaPackText())
      const drafts = buildRpaImportDrafts(pack)
      let memoCount = 0
      let blogCount = 0
      for (const draft of drafts) {
        if (draft.kind === 'memo') {
          const id = await addMemo(draft.data)
          setSelectedRpaMemoId(id)
          memoCount += 1
        } else {
          await addBlog(draft.data)
          blogCount += 1
        }
      }
      setImportMessage(`取り込み完了: memo ${memoCount}件 / blog ${blogCount}件`)
    } catch (error) {
      setImportMessage(`取り込み失敗: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  function openTechBookReader() {
    setState({ blogMode: 'view' })
    navigate('blog')
  }

  const displayGroups = () => {
    if (studyCategory() === 'claudeRpa') return ['索引', '本文'] as const
    if (studyCategory() === 'novelEngine') return ['索引', '納品', '構造', 'コード読解'] as const
    if (studyCategory() === 'customNote') return ['規則', '本文読解'] as const
    if (studyCategory() === 'legacyStudy') return ['索引', '旧資料'] as const
    if (studyCategory() === 'creationThinking') return ['索引', '制作思考'] as const
    return [] as const
  }

  return (
    <div class="study-page">
      <header class="study-header">
        <div><span>NOTE DEVELOPMENT WIKI</span><h1>Study</h1></div>
        <div class="study-breadcrumb">
          <button onClick={() => { setTab('library'); setStudyViewIntent('cards'); setView('cards') }}>Module一覧</button>
          <span>›</span><button onClick={() => { setTab('library'); setStudyViewIntent('cards'); setView('cards') }}>{CATEGORY_META[studyCategory()].label}</button>
          <Show when={view() === 'article'}><span>›</span><strong>{selectedRpaMemoId() ? selectedRpaMemo()?.title : selectedCard().title}</strong></Show>
        </div>
        <div class="study-header-tabs">
          <button classList={{ active: tab() === 'library' }} onClick={() => { setTab('library'); setStudyViewIntent('cards'); setView('cards') }}>Library</button>
          <button classList={{ active: tab() === 'db' }} onClick={() => { setTab('db'); setStudyViewIntent('cards'); setView('cards') }}>DB View</button>
        </div>
      </header>

      <main class="study-main">
        <div class="study-shell study-shell-main-only">
          <section class="study-workspace">
            <div class="study-top-panel">
              <div>
                <p class="study-eyebrow">{CATEGORY_META[studyCategory()].label}</p>
                <h2>{CATEGORY_META[studyCategory()].title}</h2>
                <p>{CATEGORY_META[studyCategory()].description}</p>
              </div>
              <nav class="study-tabs">
                <button classList={{ active: tab() === 'library' }} onClick={() => { setTab('library'); setStudyViewIntent('cards'); setView('cards') }}>Library</button>
                <button classList={{ active: tab() === 'db' }} onClick={() => { setTab('db'); setStudyViewIntent('cards'); setView('cards') }}>DB View</button>
                <button classList={{ active: tab() === 'import' }} onClick={() => { setTab('import'); setStudyViewIntent('cards'); setView('cards') }}>Import</button>
                <button classList={{ active: tab() === 'reader' }} onClick={() => { setTab('reader'); setStudyViewIntent('cards'); setView('cards') }}>Reader</button>
              </nav>
            </div>

            <Show when={tab() === 'db' && view() === 'cards'}>
              <StudyDbViewPanel dbView={dbView()} setDbView={setDbView} />
            </Show>

            <Show when={tab() === 'import' && view() === 'cards'}>
              <div class="study-import-box">
              <div class="study-import-head">
                <div>
                  <strong>RPA Material Pack Importer</strong>
                  <span>Claudeから受け取るJSONをmemo/blogへ取り込む</span>
                </div>
                <div class="study-import-actions">
                  <button type="button" onClick={() => setRpaPackText(RPA_SAMPLE_PACK)}>Sample</button>
                  <button type="button" onClick={importRpaPack}>Import</button>
                  <button type="button" onClick={openTechBookReader}>技術書Reader</button>
                </div>
              </div>
              <textarea
                value={rpaPackText()}
                onInput={(event) => setRpaPackText(event.currentTarget.value)}
                spellcheck={false}
              />
              <Show when={importMessage()}>
                <p class="study-import-message">{importMessage()}</p>
              </Show>
              </div>
            </Show>

            <Show when={tab() === 'reader' && view() === 'cards'}>
              <div class="study-reader-panel">
                <strong>技術書Reader</strong>
                <span>Blog表紙側に取り込んだ技術書を読む画面へ移動します。</span>
                <button type="button" onClick={openTechBookReader}>技術書Readerを開く</button>
              </div>
            </Show>

            <Show when={tab() === 'library' && view() === 'cards' && studyCategory() === 'claudeRpa' && rpaMemos().length > 0}>
              <p class="study-eyebrow">RPA / IMPORTED MEMOS</p>
              <For each={rpaMemos()}>
                {(memo) => (
                  <button
                    class="study-card"
                    onClick={() => {
                      setSelectedRpaMemoId(memo.id ?? null)
                      setView('article')
                    }}
                  >
                    <strong>{memo.title}</strong>
                    <span>{memo.tags.map((tag) => `#${tag.name}`).join(' ')}</span>
                    <small>RPA material · memo</small>
                  </button>
                )}
              </For>
            </Show>

            <Show when={tab() === 'library' && view() === 'cards' && studyCategory() === 'selfTech'}>
              <p class="study-eyebrow">{studyCardListLabel(studyCategory())}</p>
              <For each={categoryCards()}>
                {(card) => <StudyCardRow card={card} isNew={isNewCard(card)} onOpen={() => openCard(card)} />}
              </For>
            </Show>

            <Show when={tab() === 'library' && view() === 'cards' && studyCategory() !== 'selfTech'}>
              <p class="study-eyebrow">{studyCardListLabel(studyCategory())}</p>
              <For each={displayGroups()}>
                {(group) => (
                  <section class="study-card-group">
                    <h3>{group}</h3>
                    <For each={categoryCards().filter((card) => card.group === group)}>
                      {(card) => <StudyCardRow card={card} isNew={isNewCard(card)} onOpen={() => openCard(card)} />}
                    </For>
                  </section>
                )}
              </For>
            </Show>

            <Show when={view() === 'article'}>
              <article class="study-article">
                <button class="study-back" onClick={() => { setStudyViewIntent('cards'); setView('cards') }}>← Card一覧</button>
                <Show when={selectedRpaMemoId()} fallback={
                  <Show when={!markdown.loading} fallback={<p>読み込み中...</p>}>
                    <MarkdownView markdown={markdown() ?? ''} />
                  </Show>
                }>
                  <MarkdownView markdown={`# ${selectedRpaMemo()?.title ?? 'RPA資料'}\n\n${selectedRpaMemo()?.body ?? ''}`} />
                </Show>
              </article>
            </Show>
          </section>
        </div>
      </main>
    </div>
  )
}

const StudyNewBadge: Component = () => (
  <svg class="study-new-badge" viewBox="0 0 104 54" role="img" aria-label="New">
    <path d="M9 5h86l-8 12 10 10-10 10 8 12H9l7-12L6 27l10-10Z" />
    <text x="51" y="27" text-anchor="middle">New!!</text>
  </svg>
)

const StudyCardRow: Component<{ card: StudyCard; isNew: boolean; onOpen: () => void }> = (props) => (
  <div class="study-card-row">
    <button class="study-card study-card-main" onClick={props.onOpen}>
      <Show when={props.isNew}>
        <StudyNewBadge />
      </Show>
      <strong>{props.card.title}</strong>
      <span>{props.card.summary}</span>
      <small>{props.card.bookTitle} · {props.card.meta}</small>
    </button>
    <button
      type="button"
      class="study-favorite-btn"
      classList={{ active: isStudyFavorite(props.card.id) }}
      onClick={() => toggleStudyFavorite(props.card.id)}
      title={isStudyFavorite(props.card.id) ? 'お気に入り解除' : 'お気に入り'}
    >
      {isStudyFavorite(props.card.id) ? '★' : '☆'}
    </button>
  </div>
)

const OSS_GENRES: OssCandidateGenre[] = ['DesignSystem', 'GameUI', 'MultiAgent', 'AI素材制作', 'カジュアルゲーム', 'novelGame', 'ゲームエンジン', 'OSS索引']
const OSS_REQUEST_STATUS_KEY = 'note_story_oss_candidate_status_v1'
type OssCandidateStatusMap = Record<string, OssCandidateStatus>

function loadOssCandidateStatusMap(): OssCandidateStatusMap {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(OSS_REQUEST_STATUS_KEY)
    return raw ? JSON.parse(raw) as OssCandidateStatusMap : {}
  } catch {
    return {}
  }
}

function saveOssCandidateStatusMap(statusMap: OssCandidateStatusMap) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(OSS_REQUEST_STATUS_KEY, JSON.stringify(statusMap))
}

const StudyDbViewPanel: Component<{ dbView: StudyDbView; setDbView: (view: StudyDbView) => void }> = (props) => (
  <section class="study-db-view-panel">
    <div class="study-db-view-head">
      <div>
        <p class="study-eyebrow">MASTER DATA VIEWS</p>
        <h3>Study関連DB</h3>
        <p>マスターデータを壊さず、Study内で読むためのViewだけを切り替えます。</p>
      </div>
      <div class="study-db-view-tabs">
        <button classList={{ active: props.dbView === 'ossCandidates' }} onClick={() => props.setDbView('ossCandidates')}>OSS候補</button>
        <button classList={{ active: props.dbView === 'outputFormats' }} onClick={() => props.setDbView('outputFormats')}>Format DB</button>
        <button classList={{ active: props.dbView === 'studyCards' }} onClick={() => props.setDbView('studyCards')}>Study Cards</button>
      </div>
    </div>
    <Show when={props.dbView === 'ossCandidates'}>
      <OssCandidateDbView />
    </Show>
    <Show when={props.dbView === 'outputFormats'}>
      <OutputFormatDbView />
    </Show>
    <Show when={props.dbView === 'studyCards'}>
      <StudyCardsDbView />
    </Show>
  </section>
)

const OssCandidateDbView: Component = () => {
  const [statusMap, setStatusMap] = createSignal<OssCandidateStatusMap>(loadOssCandidateStatusMap())
  const candidateStatus = (candidate: (typeof OSS_CANDIDATES)[number]) =>
    statusMap()[candidate.id] ?? candidate.status

  function requestExecution(candidateId: string) {
    setStatusMap((previous) => {
      const next = { ...previous, [candidateId]: '実行依頼' as OssCandidateStatus }
      saveOssCandidateStatusMap(next)
      return next
    })
  }

  return (
    <section class="oss-db-panel">
      <div class="oss-db-head">
        <div>
          <p class="study-eyebrow">OSS REFERENCE CANDIDATES</p>
          <h3>Title別 Git URL DB</h3>
          <p>これから要素分解するGitHub候補を、Title / Genre / Statusで一時保管するDBです。実行ボタンで「実行依頼」に送ります。</p>
        </div>
        <span>{OSS_CANDIDATES.length} items</span>
      </div>
      <For each={OSS_GENRES}>
        {(genre) => {
          const items = () => OSS_CANDIDATES.filter((candidate) => candidate.genre === genre)
          return (
            <Show when={items().length}>
              <section class="oss-db-group">
                <h4>{genre}</h4>
                <div class="oss-db-list">
                  <For each={items()}>
                    {(candidate) => (
                      <article class="oss-db-card">
                        <div class="oss-db-card-head">
                          <div class="oss-db-card-top">
                            <span class="oss-status" data-status={candidateStatus(candidate)}>{candidateStatus(candidate)}</span>
                            <span class="oss-priority">{candidate.priority}級</span>
                            <span>{candidate.subGenre}</span>
                          </div>
                          <OssCardActions
                            candidate={candidate}
                            status={candidateStatus(candidate)}
                            onRequestExecution={() => requestExecution(candidate.id)}
                          />
                        </div>
                        <h5>{candidate.repo}</h5>
                        <p>{candidate.titleOriginal}</p>
                        <div class="oss-db-meta">
                          <span>概念: {candidate.concept}</span>
                          <span>技術: {candidate.tech.join(' / ')}</span>
                          <span>学習: {candidate.learn.join(' / ')}</span>
                        </div>
                        <div class="oss-db-foot">
                          <a href={candidate.url} target="_blank" rel="noreferrer">GitHub</a>
                        </div>
                      </article>
                    )}
                  </For>
                </div>
              </section>
            </Show>
          )
        }}
      </For>
    </section>
  )
}

const OssCardActions: Component<{
  candidate: (typeof OSS_CANDIDATES)[number]
  status: OssCandidateStatus
  onRequestExecution: () => void
}> = (props) => {
  const formats = () => currentOutputFormatsForGenre(props.candidate.genre)
  const formatsForAction = (action: OutputFormatAction) => formats().filter((format) => format.action === action)
  const defaultFormat = () => formats()[0]?.id ?? ''
  const [selectedAction, setSelectedAction] = createSignal<OutputFormatAction>('rpa')
  const [selectedFormatId, setSelectedFormatId] = createSignal(defaultFormat())
  const [requestState, setRequestState] = createSignal<'idle' | 'saving' | 'saved' | 'local' | 'error'>('idle')
  const [requestMessage, setRequestMessage] = createSignal('')
  const selectedFormat = () =>
    formats().find((format) => format.id === selectedFormatId() && format.action === selectedAction()) ??
    formatsForAction(selectedAction())[0]
  const hasRpaMaterial = () => props.status !== '未着手' && props.status !== '実行依頼'

  createEffect(() => {
    const exists = formatsForAction(selectedAction()).some((format) => format.id === selectedFormatId())
    if (!exists) setSelectedFormatId(formatsForAction(selectedAction())[0]?.id ?? defaultFormat())
  })

  async function startAction() {
    const selected = selectedFormat()
    const format = selected?.action === selectedAction() ? selected : formatsForAction(selectedAction())[0]
    if (!format) return
    if (selectedAction() === 'kanji' && !hasRpaMaterial()) return
    setRequestState('saving')
    setRequestMessage('')
    props.onRequestExecution()
    const payload = {
      action: selectedAction(),
      repo: props.candidate.repo,
      candidateId: props.candidate.id,
      formatId: format.id,
      schemaPath: format.schemaPath,
      requiresRpaMaterial: format.requiresRpaMaterial,
    }
    console.log('[APP04-OSS-FORMAT-START]', payload)
    try {
      const job = await sendRpaJobToFirebase({
        candidateId: props.candidate.id,
        repo: props.candidate.repo,
        url: props.candidate.url,
        titleOriginal: props.candidate.titleOriginal,
        concept: props.candidate.concept,
        genre: props.candidate.genre,
        subGenre: props.candidate.subGenre,
        priority: props.candidate.priority,
        sourceType: props.candidate.sourceType,
        reportPath: props.candidate.reportPath,
        action: selectedAction(),
        formatId: format.id,
        formatLabel: format.label,
        schemaPath: format.schemaPath,
        outputFolderPattern: format.outputFolderPattern,
      })
      setRequestState('saved')
      setRequestMessage(`Firebase: ${job.id}`)
    } catch (error) {
      setRequestState(rpaJobSyncEnabled ? 'error' : 'local')
      setRequestMessage(rpaJobSyncEnabled ? (error instanceof Error ? error.message : String(error)) : 'local only')
    }
  }

  return (
    <div class="oss-action-menu">
      <div class="oss-action-buttons">
        <button
          type="button"
          class="oss-action-primary"
          classList={{ active: selectedAction() === 'rpa' }}
          disabled={!formatsForAction('rpa').length}
          onClick={() => setSelectedAction('rpa')}
        >
          RPA
        </button>
        <button
          type="button"
          class="oss-action-kanji"
          classList={{ active: selectedAction() === 'kanji' }}
          disabled={!hasRpaMaterial()}
          title={hasRpaMaterial() ? '漢字概念化を開始' : 'RPA資料化後に実行'}
          onClick={() => setSelectedAction('kanji')}
        >
          漢字
        </button>
      </div>
      <select
        class="oss-format-select"
        aria-label="出力format"
        value={selectedFormatId()}
        onInput={(event) => setSelectedFormatId(event.currentTarget.value)}
      >
        <For each={formatsForAction(selectedAction())}>
          {(format) => (
            <option value={format.id}>
              {format.label}{format.status === 'old' ? ' / old' : ''}
            </option>
          )}
        </For>
      </select>
      <button
        type="button"
        class="oss-execute-btn"
        disabled={requestState() === 'saving' || (selectedAction() === 'kanji' && !hasRpaMaterial())}
        title="右上の設定で作業を開始"
        onClick={startAction}
      >
        {requestState() === 'saving' ? '保存中' : '実行'}
      </button>
      <Show when={requestMessage()}>
        <small class={`oss-request-state ${requestState()}`}>{requestMessage()}</small>
      </Show>
      <Show when={!hasRpaMaterial()}>
        <small>漢字はRPA後</small>
      </Show>
    </div>
  )
}

const OutputFormatDbView: Component = () => (
  <section class="format-db-panel">
    <div class="oss-db-head">
      <div>
        <p class="study-eyebrow">OUTPUT FORMAT SCHEMAS</p>
        <h3>出力Format Schema DB</h3>
        <p>RPA化、漢字概念化、Genre別の出力形式をまとめるDBです。statusで最新/旧版/下書きを見分けます。</p>
      </div>
      <span>{OUTPUT_FORMAT_SCHEMAS.length} formats</span>
    </div>
    <div class="format-db-list">
      <For each={OUTPUT_FORMAT_SCHEMAS}>
        {(format) => (
          <article class="format-db-card">
            <div class="format-db-top">
              <span class={`format-status ${format.status}`}>{format.status}</span>
              <span>{format.action}</span>
              <span>{format.genre}</span>
              <span>v{format.version}</span>
            </div>
            <h4>{format.label}</h4>
            <p>{format.description}</p>
            <div class="format-db-columns">
              <For each={format.columns}>
                {(column) => <code>{column}</code>}
              </For>
            </div>
            <div class="format-db-path">
              <span>schema</span>
              <code>{format.schemaPath}</code>
            </div>
          </article>
        )}
      </For>
    </div>
  </section>
)

const StudyCardsDbView: Component = () => (
  <section class="study-card-db-panel">
    <div class="oss-db-head">
      <div>
        <p class="study-eyebrow">STUDY CARD MASTER VIEW</p>
        <h3>Study Card DB</h3>
        <p>Study記事Cardのマスターデータを、カテゴリとグループだけに絞って表示します。</p>
      </div>
      <span>{STUDY_CARDS.length} cards</span>
    </div>
    <div class="study-card-db-list">
      <For each={STUDY_CARDS}>
        {(card) => (
          <article>
            <strong>{card.title}</strong>
            <span>{CATEGORY_META[card.category].label} / {card.group ?? '未分類'}</span>
            <small>{card.file}</small>
          </article>
        )}
      </For>
    </div>
  </section>
)

export default PageStudy

