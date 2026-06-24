import { type Component, createEffect, createSignal, For, Show, onCleanup } from 'solid-js'
import type { NotebookPage, PageCharacter } from '../types'
import { state, setState, addNotebook, updateNotebook, deleteNotebook } from '../store'
import MarkdownView from '../components/MarkdownView'
import { kanbanMemoInboxEnabled, sendIdeaInboxToFirebase, sendScenarioFragmentToDevStudio } from '../db/firebase'
import ScenarioBlockEditor from '../components/ScenarioBlockEditor'
import ScenarioMemoEditor from '../components/ScenarioMemoEditor'
import MarkdownSymbolBar from '../components/MarkdownSymbolBar'
import NotionCalloutQuickInsert from '../components/NotionCalloutQuickInsert'
import { dialogueIndent, escapeDialogueToNextParagraph, formatDialogueLine } from '../utils/dialogueFormat'
import { cursorOffsetForScenarioBlock, formatScenarioBlock, type ScenarioBlockKind } from '../utils/scenarioFormat'
import { cursorToTextIndex, splitTextBlocks, textIndexToBlockCursor, type BlockCursor } from '../utils/blockText'

let saveTimer: ReturnType<typeof setTimeout>
type EditorMode = 'note' | 'stepMemo' | 'dialogueLog' | 'characterSheet'

const EDITOR_MODE_KEY = 'note-story-editor-mode-v1'

type CharacterOption = {
  id: string
  name: string
  description: string
  dict?: string
  prompt?: string
  role?: string
  note?: string
}

type PasteItem = {
  id: string
  text: string
}

const PASTE_BOARD_KEY = 'note-story-paste-board-v1'
const NOTEBOOK_CHARACTERS_KEY = 'note-story-notebook-characters-v1'
const IDEA_INBOX_TAGS = ['app', 'codex_consult_seed', 'game_system', 'note_app_improvement', 'task_memo']

const NOTE_TEMPLATES = [
  {
    id: 'novel-episode',
    label: '小説1話',
    description: '小説家になろう / カクヨム向けの章・話・本文整理',
    body: `# 第一章
## 第一話
### 目的
### 登場人物
### 舞台
### 導入
### 転機
### 山場
### 余韻
### 次回への引き`,
  },
  {
    id: 'game-scenario',
    label: 'ゲームシナリオ',
    description: 'Scene、会話、選択肢、演出タグの整理',
    body: `# Scenario
## Scene
### 目的
### 場所 / 背景
### 登場Character
### 会話ログ
### Choice
### SystemTag
### 遷移先`,
  },
  {
    id: 'manga-name',
    label: '漫画化',
    description: 'ページ、コマ、セリフ、見せ場の整理',
    body: `# 漫画化
## 1ページ目
### コマ1
### コマ2
### コマ3
## 見せ場
### 表情
### セリフ
### ラストカット`,
  },
  {
    id: 'pv-plan',
    label: 'PV作成',
    description: '映像、ナレーション、BGM、素材の整理',
    body: `# PV構成
## Hook
### 画
### コピー
### BGM
## 展開
### Scene
### Character
### 見せ場
## CTA
### 最後の一言
### 必要素材`,
  },
  {
    id: 'codex-order',
    label: 'Codex発注',
    description: 'AIへ作業依頼するときの最小フォーマット',
    body: `# Codex発注
## 目的
## 入力資料
## やってほしいこと
## 出力形式
## 優先順位
## 完了条件
## 注意点`,
  },
]

const WORLD_WORD_TEMPLATE = `# WW_ワールドワード辞書

このノート専用の世界観辞書。
形式は「概念：説明」を基本にする。

| 概念 | 説明 | tag | reuse |
| --- | --- | --- | --- |
| 例：神の源 | この世界で法や信仰の根拠になる概念 | world_law | true |

## Rule
- 1行1概念で書く
- 他作品へ流用できる概念は reuse を true にする
- AIに渡すときは、このページを先に参照する
`

const UNDERTAKER_STEP_OUTLINE = `# アンダーテイカー
## プロローグ 死者として目覚める
### 罪と処分
### 棺桶と秘密通路
### 主人公はAgentになる
## 第1話 雨の町
### 初任務
### 守るべき家族
### 痕跡を残さない
## 第2話 炭鉱の町
### 消えた労働者
### 地下通路
### 黒幕の処分
## 第3話 港町
### 密輸船
### 残された子ども
### 死者の名で裁く
## 第4話 祈りの村
### 偽りの奇跡
### 神父の過去
### 信仰と必要悪
## 第5話 王都の影
### 法の番人
### 正義を捨てた裁判官
### 主人公の罪状に触れる
## 第6話 雪の地方
### 遭難した隊商
### 救う命と捨てる命
### Agentの掟
## 第7話 占いばあさん
### 悲劇の予兆
### 起こる前に止める
### 未来を変えた代償
## 第8話 他Agent回 影縫い
### 別のAgentの任務
### 主人公とは違う正義
### 組織の広がり
## 第9話 他Agent回 鐘守
### 死者を送る鐘
### 裏切り者の疑い
### Agent同士の衝突
## 第10話 アンダーテイカーの棺
### 主人公の選択
### 生きていたころの名前
### 名を捨てる
## シーズン後半候補
### 家族に会えない掟
### 組織の敵
### 神の源とは何か`

const TAG_GROUPS = [
  { key: 'bgm', label: 'BGM', items: { bgm_title: 'タイトル曲', bgm_peaceful: '日常', bgm_forest: '森', bgm_tension: '緊張', bgm_battle: '戦闘', bgm_boss: 'ボス', bgm_sad: '悲しい', bgm_mystery: '謎', bgm_hope: '希望', bgm_end: 'エンディング' } },
  { key: 'se', label: 'SE', items: { se_click: 'ボタン', se_next: '次へ', se_open: '開く', se_close: '閉じる', se_item: 'アイテム', se_magic: '魔法', se_attack: '攻撃', se_damage: 'ダメージ', se_heal: '回復', se_complete: '完了' } },
  { key: 'background', label: 'BG', items: { bg_title: 'タイトル', bg_village: '村', bg_village_night: '夜の村', bg_forest: '森', bg_town: '街', bg_castle: '城', bg_room: '部屋', bg_school: '学校', bg_night: '夜空' } },
  { key: 'character', label: 'Char', items: { char_hero: '主人公', char_heroine: 'ヒロイン', char_knight: '騎士', char_witch: '魔女', char_npc: 'NPC' } },
  { key: 'face', label: 'Face', items: { face_normal: '通常', face_happy: '笑顔', face_sad: '悲しい', face_angry: '怒り', face_surprised: '驚き', face_thinking: '考える', face_shy: '照れ' } },
  { key: 'fx', label: 'FX', items: { fx_fade_in: 'フェードイン', fx_fade_out: 'フェードアウト', fx_flash: '白フラッシュ', fx_blackout: '暗転', fx_fog_slow: '霧', fx_shake_small: '小揺れ', fx_shake_big: '大揺れ', fx_bloom: '発光', fx_rain: '雨', fx_snow: '雪' } },
  { key: 'camera', label: 'Camera', items: { cam_zoom_in: 'ズーム', cam_zoom_out: '縮小', cam_zoom_slow: 'ゆっくりズーム', cam_pan_left: '左移動', cam_pan_right: '右移動', cam_pan_up: '上移動', cam_pan_down: '下移動' } },
  { key: 'event', label: 'Event', items: { ev_next_scene: '次シーン', ev_branch: '分岐', ev_unlock: '解放', ev_reward: '報酬', ev_game_start: 'ゲーム開始', ev_game_end: 'ゲーム終了' } },
  { key: 'flag', label: 'Flag', items: { flag_hero_join: '主人公加入', flag_witch_join: '魔女加入', flag_route_a: 'Aルート', flag_route_b: 'Bルート', flag_good_end: 'GoodEnd', flag_bad_end: 'BadEnd' } },
  { key: 'memo', label: 'Memo', items: { memo_world: '世界観', memo_character: '人物', memo_item: 'アイテム', memo_keyword: '用語' } },
] as const

function initEditorMode(): EditorMode {
  if (typeof window === 'undefined') return 'note'
  const saved = localStorage.getItem(EDITOR_MODE_KEY)
  return saved === 'dialogueLog' || saved === 'stepMemo' || saved === 'characterSheet' ? saved : 'note'
}

function mkPageId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function readPasteBoards(): Record<string, PasteItem[]> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(PASTE_BOARD_KEY) || '{}') as Record<string, PasteItem[]>
  } catch {
    return {}
  }
}

function writePasteBoard(notebookId: string, items: PasteItem[]) {
  if (typeof window === 'undefined') return
  const boards = readPasteBoards()
  boards[notebookId] = items
  localStorage.setItem(PASTE_BOARD_KEY, JSON.stringify(boards))
}

function readNotebookCharacters(): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(NOTEBOOK_CHARACTERS_KEY) || '{}') as Record<string, string[]>
  } catch {
    return {}
  }
}

function mkCharacterId(name: string, index: number) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-\u3040-\u30ff\u3400-\u9fff]/g, '')
  return slug ? `char_${slug}` : `char_${index + 1}`
}

function defaultPageCharacters(names = ['CharacterA', 'CharacterB']): PageCharacter[] {
  return names.map((name, index) => ({
    id: mkCharacterId(name, index),
    name,
    dict: name,
    prompt: '',
    role: index === 0 ? 'main' : 'support',
    note: '',
  }))
}

function scenarioHeadingLevel(line: string) {
  const match = line.match(/^(#{1,3})\s+(.*)$/)
  return match ? match[1].length : 0
}

function scenarioHeadingText(line: string) {
  return line.replace(/^#{1,3}\s+/, '').trim()
}

function scenarioHeadingLogKey(index: number, level: number, title: string) {
  const slug = title.trim().replace(/\s+/g, '-').replace(/[\\/:*?"<>|#{}[\]]/g, '_') || 'untitled'
  return `heading-${index}-h${level}-${slug}`
}

function buildScenarioHeadingLogs(scenarioBody = '', currentLogs: Record<string, string> = {}) {
  const nextLogs = { ...currentLogs }
  let changed = false
  scenarioBody.split('\n').forEach((line, index) => {
    const level = scenarioHeadingLevel(line)
    if (level !== 2 && level !== 3) return
    const title = scenarioHeadingText(line)
    if (!title) return
    const key = scenarioHeadingLogKey(index, level, title)
    if (nextLogs[key]) return
    nextLogs[key] = `柱：${title}\n\nCharacterA：「」`
    changed = true
  })
  return changed ? nextLogs : currentLogs
}


const PageNotebook: Component = () => {
  const [pagePanelOpen, setPagePanelOpen] = createSignal(false)
  const [desktopNotebookListOpen, setDesktopNotebookListOpen] = createSignal(true)
  const [mobileShelfMode, setMobileShelfMode] = createSignal<'notebooks' | 'pages'>('notebooks')
  const [viewMode, setViewMode] = createSignal<'preview' | 'edit'>('edit')
  const [sendStatus, setSendStatus] = createSignal<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [devStudioStatus, setDevStudioStatus] = createSignal<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [devStudioInfo, setDevStudioInfo] = createSignal<{ id?: string; sentAt?: string; message?: string } | null>(null)
  const [characterPickerOpen, setCharacterPickerOpen] = createSignal(false)
  const [characterSearch, setCharacterSearch] = createSignal('')
  const [characterDraft, setCharacterDraft] = createSignal('')
  const [characterVersion, setCharacterVersion] = createSignal(0)
  const [notionCalloutOpen, setNotionCalloutOpen] = createSignal(false)
  const [shortcutGuideOpen, setShortcutGuideOpen] = createSignal(false)
  const [tagSidebarOpen, setTagSidebarOpen] = createSignal(false)
  const [blockSidebarOpen, setBlockSidebarOpen] = createSignal(false)
  const [templatePanelOpen, setTemplatePanelOpen] = createSignal(false)
  const [ideaInboxOpen, setIdeaInboxOpen] = createSignal(false)
  const [inboxSyncing, setInboxSyncing] = createSignal(false)
  const [ideaSubject, setIdeaSubject] = createSignal('')
  const [ideaDraft, setIdeaDraft] = createSignal('')
  const [ideaInboxError, setIdeaInboxError] = createSignal('')
  const [ideaTag, setIdeaTag] = createSignal('')
  const [ideaReference, setIdeaReference] = createSignal('')
  const [ideaTagDraft, setIdeaTagDraft] = createSignal('')
  const [pasteBoardOpen, setPasteBoardOpen] = createSignal(false)
  const [pasteDraft, setPasteDraft] = createSignal('')
  const [pasteBoardVersion, setPasteBoardVersion] = createSignal(0)
  const [pasteInsertRequest, setPasteInsertRequest] = createSignal<{ id: number; text: string } | null>(null)
  const [activeTagGroup, setActiveTagGroup] = createSignal<(typeof TAG_GROUPS)[number]['key']>('bgm')
  const [blockCursor, setBlockCursor] = createSignal<BlockCursor>({ blockIndex: 0, cursor: 0 })
  const [editorMode, setEditorModeSignal] = createSignal<EditorMode>(initEditorMode())
  const [characterTargetBlock, setCharacterTargetBlock] = createSignal<number | null>(null)
  const [activeScenarioLogScope, setActiveScenarioLogScope] = createSignal<{ key: string; title: string; level: 2 | 3 } | null>(null)
  let bodyTextareaRef: HTMLTextAreaElement | undefined
  const inboxSyncAttempted = new Set<string>()

  const isMobile = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || (window.innerHeight <= 500 && window.matchMedia('(orientation: landscape)').matches))
  const selectedId = () => state.selectedNotebookId
  const selectedPageId = () => state.selectedNotebookPageId
  const setSelectedId = (id: string | null) => setState({ selectedNotebookId: id })
  const setSelectedPageId = (id: string | null) => setState({ selectedNotebookPageId: id })
  const selectedNotebook = () => state.notebooks.find((n) => n.id === selectedId())
  const selectedPage = () => selectedNotebook()?.pages.find((p) => p.id === selectedPageId())
  const orderedNotebooks = () => {
    const anchorIds = new Set(['story-settings', 'story-comments'])
    const idea = state.notebooks.filter((notebook) => notebook.id === 'story-ideas')
    const anchors = state.notebooks.filter((notebook) => notebook.id && anchorIds.has(notebook.id))
    const normal = state.notebooks.filter((notebook) =>
      notebook.id !== 'story-ideas' &&
      notebook.id !== 'story-inbox' &&
      notebook.title !== 'InBox' &&
      (!notebook.id || !anchorIds.has(notebook.id))
    )
    return [...idea, ...normal, ...anchors]
  }
  const ideaNotebook = () => state.notebooks.find((n) => n.id === 'story-ideas' || n.title === 'アイディア帳')
  const inboxNotebook = () => state.notebooks.find((n) => n.id === 'story-inbox' || n.title === 'InBox')
  const inboxTagDbPage = () => inboxNotebook()?.pages.find((p) => p.id === 'inbox-tag-db' || p.title === 'tagDB')
  const inboxTags = () => {
    const raw = inboxTagDbPage()?.body
    try {
      const parsed = JSON.parse(raw || '{}') as { tags?: string[] }
      return Array.from(new Set([...(parsed.tags ?? []), ...IDEA_INBOX_TAGS].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ja'))
    } catch {
      return IDEA_INBOX_TAGS
    }
  }
  const ideaTags = () => {
    return inboxTags()
  }
  const ideaReferenceOptions = () => {
    const notebook = ideaNotebook()
    const titles = notebook?.pages.flatMap((page) => {
      if (page.id === 'idea-index-ai-md') return []
      const h1 = Array.from((page.body ?? '').matchAll(/^#\s+(.+)$/gm)).map((match) => match[1].trim())
      return [page.title, ...h1]
    }) ?? []
    return Array.from(new Set(titles.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ja'))
  }
  const pasteItems = () => {
    pasteBoardVersion()
    return readPasteBoards()[selectedId() ?? ''] ?? []
  }
  const legacyNotebookCharacters = () => {
    characterVersion()
    const notebookId = selectedId()
    if (!notebookId) return []
    const saved = readNotebookCharacters()[notebookId]
    if (saved?.length) return saved
    return ['CharacterA', 'CharacterB']
  }
  const pageCharacters = () => {
    characterVersion()
    const page = selectedPage()
    if (page?.characters?.length) return page.characters
    return defaultPageCharacters(legacyNotebookCharacters())
  }

  function readSection(body: string, heading: string) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = body.match(new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?=\\n## |$)`))
    return match?.[1]?.trim() ?? ''
  }

  function buildInboxFirebaseBody(body: string, status: string) {
    if (body.includes('- firebase:')) return body.replace(/- firebase:.*$/m, `- firebase: ${status}`)
    if (body.includes('firebase:')) return body.replace(/firebase:.*$/m, `firebase: ${status}`)
    return `${body.trimEnd()}\n\n## Source\n- firebase: ${status}`
  }

  function inboxPageSyncStatus(page: NotebookPage): 'system' | 'unsynced' | 'syncing' | 'synced' | 'error' {
    if (page.id === 'inbox-tag-db' || page.id === 'inbox-archive' || page.title === 'tagDB' || page.title === 'Archive') return 'system'
    if (page.syncStatus) return page.syncStatus
    const body = page.body ?? ''
    if (body.includes('firebase: sent')) return 'synced'
    if (body.includes('firebase: error')) return 'error'
    return 'unsynced'
  }

  function inboxSyncStatusLabel(status: ReturnType<typeof inboxPageSyncStatus>) {
    if (status === 'synced') return '同期済み'
    if (status === 'syncing') return '同期中'
    if (status === 'error') return '同期失敗'
    if (status === 'unsynced') return '未同期'
    return 'system'
  }

  function inboxFirebaseDocId(page: NotebookPage) {
    return `idea_inbox_${page.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
  }

  function isSyncableInboxPage(page: NotebookPage) {
    if (page.id === 'inbox-tag-db' || page.id === 'inbox-archive') return false
    if (page.title === 'tagDB' || page.title === 'Archive') return false
    if (inboxPageSyncStatus(page) === 'synced' || inboxPageSyncStatus(page) === 'syncing') return false
    return Boolean((page.body ?? '').trim())
  }

  async function sendInboxPageToFirebase(notebookId: string, page: NotebookPage) {
    const notebookBefore = state.notebooks.find((item) => item.id === notebookId)
    if (notebookBefore) {
      const pages = notebookBefore.pages.map((itemPage) =>
        itemPage.id === page.id ? { ...itemPage, syncStatus: 'syncing' as const, syncError: undefined } : itemPage
      )
      updateNotebook(notebookId, { pages, updatedAt: new Date() })
    }
    const body = page.body ?? ''
    const subject = scenarioHeadingText(body.split('\n')[0] ?? '') || page.title || 'No subject'
    const tag = readSection(body, 'tag') || page.title.split('/')[0]?.trim() || '未分類'
    const relatedIdea = readSection(body, 'relatedIdea')
    const text = readSection(body, 'InBox') || body
    try {
      const item = await sendIdeaInboxToFirebase({
        id: inboxFirebaseDocId(page),
        subject,
        body: text,
        tag,
        relatedIdea,
        sourceNotebookId: notebookId,
        sourceNotebookTitle: 'InBox',
        sourcePageId: page.id,
        sourcePageTitle: page.title,
      })
      const notebook = state.notebooks.find((item) => item.id === notebookId)
      if (!notebook) return
      const pages = notebook.pages.map((itemPage) =>
        itemPage.id === page.id
          ? {
              ...itemPage,
              body: buildInboxFirebaseBody(itemPage.body ?? '', `sent ${item.id}`),
              syncStatus: 'synced' as const,
              firebaseDocId: item.id,
              syncedAt: new Date().toISOString(),
              syncError: undefined,
            }
          : itemPage
      )
      updateNotebook(notebookId, { pages, updatedAt: new Date() })
    } catch (error) {
      const notebook = state.notebooks.find((item) => item.id === notebookId)
      if (!notebook) return
      const message = error instanceof Error ? error.message : String(error)
      const pages = notebook.pages.map((itemPage) =>
        itemPage.id === page.id
          ? {
              ...itemPage,
              body: buildInboxFirebaseBody(itemPage.body ?? '', `error ${message}`),
              syncStatus: 'error' as const,
              syncError: message,
            }
          : itemPage
      )
      updateNotebook(notebookId, { pages, updatedAt: new Date() })
      console.warn('[InBox Firebase] send failed:', error)
    }
  }

  async function syncPendingInboxPagesToFirebase() {
    if (!kanbanMemoInboxEnabled || inboxSyncing()) return
    const notebook = inboxNotebook()
    if (!notebook?.id) return
    const pending = notebook.pages.filter((page) => isSyncableInboxPage(page) && !inboxSyncAttempted.has(page.id))
    if (!pending.length) return
    setInboxSyncing(true)
    try {
      for (const page of pending) {
        inboxSyncAttempted.add(page.id)
        await sendInboxPageToFirebase(notebook.id, page)
      }
    } finally {
      setInboxSyncing(false)
    }
  }

  async function handleManualInboxSyncCheck() {
    inboxSyncAttempted.clear()
    await syncPendingInboxPagesToFirebase()
  }

  createEffect(() => {
    selectedPageId()
    setActiveScenarioLogScope(null)
  })

  createEffect(() => {
    const notebook = inboxNotebook()
    const signature = notebook?.pages.map((page) => `${page.id}:${page.body?.includes('firebase: sent') ? 'sent' : 'pending'}`).join('|')
    if (!signature) return
    queueMicrotask(() => {
      void syncPendingInboxPagesToFirebase()
    })
  })

  createEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'Space') {
        event.preventDefault()
        setPasteBoardOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown))
  })

  createEffect(() => {
    const notebook = ideaNotebook()
    if (!notebook?.id) return
    let changed = false
    const pages = notebook.pages.map((page) => {
      const currentLogs = page.scenarioLogs ?? {}
      const logs = buildScenarioHeadingLogs(page.scenarioBody ?? '', currentLogs)
      if (logs === currentLogs) return page
      changed = true
      return { ...page, scenarioLogs: logs }
    })
    if (changed) updateNotebook(notebook.id, { pages, updatedAt: new Date() })
  })

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
    const page: NotebookPage = {
      id: mkPageId(),
      title: '新しいページ',
      body: '',
      order: 0,
    }
    const id = await addNotebook({ title: '新しいストーリーノート', storyOnly: true, pages: [page], createdAt: now, updatedAt: now })
    setSelectedId(id)
    setSelectedPageId(page.id)
    setMobileShelfMode('pages')
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
    setSendStatus('idle')
    setDevStudioStatus('idle')
    setDevStudioInfo(null)
  }

  function openWorldWordDictionary() {
    const nb = selectedNotebook()
    if (!nb?.id) return
    const existing = nb.pages.find((page) => page.id === `${nb.id}-world-word-dictionary` || page.title.startsWith('WW_'))
    if (existing) {
      setSelectedPageId(existing.id)
      setViewMode('edit')
      setEditorMode('note')
      return
    }
    const page: NotebookPage = {
      id: `${nb.id}-world-word-dictionary`,
      title: 'WW_ワールドワード辞書',
      body: WORLD_WORD_TEMPLATE,
      scenarioBody: '# WW_ワールドワード辞書\n## 概念\n### 説明',
      order: nb.pages.length,
    }
    updateNotebook(nb.id, { pages: [...nb.pages, page], updatedAt: new Date() })
    setSelectedPageId(page.id)
    setViewMode('edit')
    setEditorMode('note')
  }

  function addInboxTag() {
    const notebook = inboxNotebook()
    const tagPage = inboxTagDbPage()
    const tag = ideaTagDraft().trim()
    if (!notebook?.id || !tagPage || !tag) return
    const current = inboxTags()
    if (current.includes(tag)) {
      setIdeaTag(tag)
      setIdeaTagDraft('')
      return
    }
    const body = JSON.stringify({ schema: 'kanban-note01.inbox_tag_db.v0_1', tags: [...current, tag].sort((a, b) => a.localeCompare(b, 'ja')) }, null, 2)
    const pages = notebook.pages.map((page) => page.id === tagPage.id ? { ...page, body, scenarioBody: `# tagDB\n${[...current, tag].map((item) => `## ${item}`).join('\n')}` } : page)
    updateNotebook(notebook.id, { pages, updatedAt: new Date() })
    setIdeaTag(tag)
    setIdeaTagDraft('')
  }

  async function addIdeaInboxPage() {
    const notebook = inboxNotebook()
    const text = ideaDraft().trim()
    const subjectInput = ideaSubject().trim()
    setIdeaInboxError('')
    if (!subjectInput) {
      setIdeaInboxError('件名を入力してください')
      return
    }
    if (!notebook || !text) return
    const now = new Date()
    const tag = ideaTag().trim()
    const relatedIdea = ideaReference().trim()
    const subject = subjectInput
    const sourceTitle = selectedNotebook()?.title ?? 'unknown'
    const sourcePage = selectedPage()?.title ?? 'unknown'
    const page: NotebookPage = {
      id: `inbox-${Date.now().toString(36)}`,
      title: tag ? `${tag} / ${subject}` : `InBox / ${subject}`,
      body: `# ${subject}\n\n## tag\n${tag || '未分類'}\n\n## relatedIdea\n${relatedIdea || '未指定'}\n\n## InBox\n${text}\n\n## Source\n- notebook: ${sourceTitle}\n- page: ${sourcePage}\n- firebase: pending`,
      scenarioBody: `# ${subject}\n## InBox\n### ${text.split('\n')[0]}`,
      syncStatus: 'unsynced',
      order: notebook.pages.length,
    }
    updateNotebook(notebook.id!, { pages: [...notebook.pages, page], updatedAt: now })
    inboxSyncAttempted.add(page.id)
    void sendInboxPageToFirebase(notebook.id!, page)
    setIdeaSubject('')
    setIdeaDraft('')
    setIdeaTag(tag)
    setIdeaReference(relatedIdea)
  }

  function handleDeletePage(pageId: string) {
    const nb = selectedNotebook()
    if (!nb) return
    const page = nb.pages.find((p) => p.id === pageId)
    const title = page?.title || '無題'
    if (typeof window !== 'undefined' && !window.confirm(`ページ「${title}」を削除しますか？`)) return
    const pages = nb.pages.filter((p) => p.id !== pageId).map((p, i) => ({ ...p, order: i }))
    updateNotebook(nb.id!, { pages, updatedAt: new Date() })
    if (selectedPageId() === pageId) setSelectedPageId(pages[0]?.id ?? null)
  }

  function patchPageData(patch: Partial<NotebookPage>) {
    const nb = selectedNotebook()
    if (!nb) return
    const pages = nb.pages.map((p) =>
      p.id === selectedPageId() ? { ...p, ...patch } : p
    )
    patchPagesLocal(nb.id!, pages)
    schedulePageSave(nb.id!, pages)
  }

  function patchPage(field: 'title' | 'body' | 'scenarioBody', value: string) {
    patchPageData({ [field]: value })
  }

  function currentScenarioBody() {
    return selectedPage()?.scenarioBody ?? ''
  }

  function scenarioHeadingNavItems() {
    return currentScenarioBody()
      .split('\n')
      .map((line, index) => {
        const level = scenarioHeadingLevel(line)
        const title = scenarioHeadingText(line)
        if ((level !== 2 && level !== 3) || !title) return null
        return { key: scenarioHeadingLogKey(index, level, title), title, level: level as 2 | 3, index }
      })
      .filter(Boolean) as Array<{ key: string; title: string; level: 2 | 3; index: number }>
  }

  function currentDialogueBody() {
    const page = selectedPage()
    const scope = activeScenarioLogScope()
    if (!page) return ''
    return scope ? page.scenarioLogs?.[scope.key] ?? '' : page.body
  }

  function patchDialogueBody(value: string) {
    const page = selectedPage()
    const scope = activeScenarioLogScope()
    if (!page || !scope) {
      patchPage('body', value)
      return
    }
    patchPageData({ scenarioLogs: { ...(page.scenarioLogs ?? {}), [scope.key]: value } })
  }

  function openScenarioHeadingLog(meta: { key: string; title: string; level: 2 | 3 }) {
    const page = selectedPage()
    if (!page) return
    const logs = page.scenarioLogs ?? {}
    const initial = `柱：${meta.title}\n\nCharacterA：「」`
    if (!logs[meta.key]) patchPageData({ scenarioLogs: { ...logs, [meta.key]: initial } })
    setActiveScenarioLogScope(meta)
    setBlockCursor({ blockIndex: 0, cursor: 0 })
    setEditorMode('dialogueLog')
  }

  function insertUndertakerOutline() {
    const current = currentScenarioBody().trim()
    patchPage('scenarioBody', current ? `${current}\n\n${UNDERTAKER_STEP_OUTLINE}` : UNDERTAKER_STEP_OUTLINE)
    setEditorMode('stepMemo')
  }

  function insertNoteTemplate(templateBody: string) {
    const targetField = editorMode() === 'stepMemo' ? 'scenarioBody' : 'body'
    const current = (targetField === 'scenarioBody' ? currentScenarioBody() : selectedPage()?.body ?? '').trim()
    patchPage(targetField, current ? `${current}\n\n${templateBody}` : templateBody)
    if (targetField === 'scenarioBody') setEditorMode('stepMemo')
    setTemplatePanelOpen(false)
  }

  function setEditorMode(mode: EditorMode) {
    setEditorModeSignal(mode)
    if (typeof window !== 'undefined') localStorage.setItem(EDITOR_MODE_KEY, mode)
  }

  function handleBodyKeyDown(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (event.ctrlKey && !event.altKey && !event.metaKey && /^[1-3]$/.test(event.key)) {
      event.preventDefault()
      const textarea = event.currentTarget
      const level = Number(event.key)
      const lineStart = textarea.value.lastIndexOf('\n', Math.max(0, textarea.selectionStart - 1)) + 1
      const lineEndIndex = textarea.value.indexOf('\n', textarea.selectionStart)
      const lineEnd = lineEndIndex === -1 ? textarea.value.length : lineEndIndex
      const line = textarea.value.slice(lineStart, lineEnd)
      const clean = line.replace(/^#{1,3}\s+/, '')
      const currentLevel = line.match(/^(#{1,3})\s+/)?.[1].length ?? 0
      const nextLine = currentLevel === level ? clean : `${'#'.repeat(level)} ${clean}`
      const nextValue = `${textarea.value.slice(0, lineStart)}${nextLine}${textarea.value.slice(lineEnd)}`
      const cursor = lineStart + Math.min(nextLine.length, Math.max(0, textarea.selectionStart - lineStart + nextLine.length - line.length))
      patchPage('body', nextValue)
      queueMicrotask(() => textarea.setSelectionRange(cursor, cursor))
      return
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const shortcuts: Record<string, ScenarioBlockKind | undefined> = {
        e: 'event',
        q: 'quest',
        c: 'choice',
        w: 'world',
        s: 'system',
      }
      const kind = shortcuts[event.key.toLowerCase()]
      if (kind) {
        event.preventDefault()
        insertScenarioBlock(kind)
        return
      }
      if (event.key === '?') {
        event.preventDefault()
        setShortcutGuideOpen(true)
        return
      }
    }

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

  function insertMarkdownSymbolToNote(text: string, cursorOffset?: number) {
    const page = selectedPage()
    if (!page) return
    const textarea = bodyTextareaRef
    const current = page.body
    const start = textarea?.selectionStart ?? current.length
    const end = textarea?.selectionEnd ?? start
    const nextBody = `${current.slice(0, start)}${text}${current.slice(end)}`
    const cursor = start + (cursorOffset ?? text.length)
    patchPage('body', nextBody)
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(cursor, cursor)
    })
  }

  function insertTextToDialogueBody(text: string) {
    const currentBody = currentDialogueBody()
    const blocks = splitTextBlocks(currentBody)
    const index = cursorToTextIndex(blocks, blockCursor())
    const nextBody = `${currentBody.slice(0, index)}${text}${currentBody.slice(index)}`
    patchDialogueBody(nextBody)
    setBlockCursor(textIndexToBlockCursor(splitTextBlocks(nextBody), index + text.length))
  }

  function pasteTextToActiveEditor(text: string) {
    if (editorMode() === 'stepMemo') {
      setPasteInsertRequest({ id: Date.now(), text })
      return
    }
    if (editorMode() === 'dialogueLog') {
      insertTextToDialogueBody(text)
      return
    }
    insertMarkdownSymbolToNote(text)
  }

  function addPasteItem() {
    const notebookId = selectedId()
    const text = pasteDraft().trim()
    if (!notebookId || !text) return
    const next = [{ id: `${Date.now()}`, text }, ...pasteItems()].slice(0, 24)
    writePasteBoard(notebookId, next)
    setPasteBoardVersion((value) => value + 1)
    setPasteDraft('')
  }

  function deletePasteItem(id: string) {
    const notebookId = selectedId()
    if (!notebookId) return
    writePasteBoard(notebookId, pasteItems().filter((item) => item.id !== id))
    setPasteBoardVersion((value) => value + 1)
  }

  function filteredCharacters(): CharacterOption[] {
    const q = characterSearch().trim().toLowerCase()
    const options = pageCharacters().map((character, index) => ({
      id: character.id,
      name: character.name,
      description: character.role || `Page character ${index + 1}`,
      dict: character.dict,
      prompt: character.prompt,
      role: character.role,
      note: character.note,
    }))
    return options.filter((item) => !q || `${item.id} ${item.name} ${item.description} ${item.dict} ${item.prompt} ${item.note}`.toLowerCase().includes(q))
  }

  function savePageCharacters(characters: PageCharacter[]) {
    const clean = characters
      .map((character, index) => {
        const name = character.name.trim()
        return {
          ...character,
          id: character.id.trim() || mkCharacterId(name, index),
          name,
          dict: character.dict.trim(),
          prompt: character.prompt.trim(),
          role: character.role.trim(),
          note: character.note.trim(),
        }
      })
      .filter((character) => character.name)
    patchPageData({ characters: clean })
    setCharacterVersion((value) => value + 1)
  }

  function addNotebookCharacter() {
    const name = characterDraft().trim()
    if (!name) return
    savePageCharacters([
      ...pageCharacters(),
      {
        id: mkCharacterId(name, pageCharacters().length),
        name,
        dict: name,
        prompt: '',
        role: '',
        note: '',
      },
    ])
    setCharacterDraft('')
  }

  function updatePageCharacter(index: number, patch: Partial<PageCharacter>) {
    const next = [...pageCharacters()]
    const current = next[index]
    if (!current) return
    next[index] = { ...current, ...patch }
    savePageCharacters(next)
  }

  function deleteNotebookCharacter(index: number) {
    savePageCharacters(pageCharacters().filter((_, i) => i !== index))
  }

  function triggerAltD() {
    const eventInit = { key: 'd', code: 'KeyD', altKey: true, bubbles: true, cancelable: true }
    bodyTextareaRef?.dispatchEvent(new KeyboardEvent('keydown', eventInit))
    window.dispatchEvent(new KeyboardEvent('keydown', eventInit))
  }

  function insertCharacterLine(name: string, options: { fromLineEnd?: boolean; triggerMic?: boolean } = {}) {
    const currentBody = currentDialogueBody()
    const text = formatDialogueLine(name)
    const textarea = bodyTextareaRef
    const blocks = splitTextBlocks(currentBody)
    const blockSelectionStart = cursorToTextIndex(blocks, blockCursor())
    const initialSelectionStart = textarea?.selectionStart ?? blockSelectionStart
    const escaped = escapeDialogueToNextParagraph(currentBody, initialSelectionStart)
    const current = escaped?.value ?? currentBody
    const selectionStart = escaped?.cursor ?? initialSelectionStart
    const lineEndIndex = current.indexOf('\n', selectionStart)
    const start = options.fromLineEnd ? (lineEndIndex === -1 ? current.length : lineEndIndex) : selectionStart
    const end = options.fromLineEnd || escaped ? start : (textarea?.selectionEnd ?? selectionStart)
    const before = current.slice(0, start)
    const after = current.slice(end)
    const separator = before && !before.endsWith('\n') ? '\n' : ''
    const nextBody = `${before}${separator}${text}${after}`
    const cursor = before.length + separator.length + text.length - 1
    setViewMode('edit')
    patchDialogueBody(nextBody)
    setBlockCursor(textIndexToBlockCursor(splitTextBlocks(nextBody), cursor))
    setCharacterPickerOpen(false)
    setCharacterSearch('')
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(cursor, cursor)
      if (options.triggerMic) window.setTimeout(triggerAltD, 200)
    })
  }

  function replaceBlockSpeaker(blockIndex: number, name: string) {
    const blocks = splitTextBlocks(currentDialogueBody())
    const block = blocks[blockIndex] ?? ''
    const normalized = name.replace(/\s+Characters?$/i, '').trim() || name
    const dialogue = block.match(/^(.+?)\s*：「([\s\S]*?)」?$/)
    blocks[blockIndex] = dialogue ? `${normalized}：「${dialogue[2]}」` : `${normalized}：「」`
    const nextBody = blocks.join('\n\n')
    patchDialogueBody(nextBody)
    setBlockCursor({ blockIndex, cursor: Math.max(blocks[blockIndex].length - 1, 0) })
  }

  function handleCharacterSheetSelect(name: string) {
    const targetBlock = characterTargetBlock()
    if (targetBlock !== null || editorMode() === 'dialogueLog') {
      const blockIndex = targetBlock ?? blockCursor().blockIndex
      replaceBlockSpeaker(blockIndex, name)
      setCharacterTargetBlock(null)
      setCharacterPickerOpen(false)
      setCharacterSearch('')
      return
    }
    insertCharacterLine(name)
  }

  function handleCharacterShortcutForBlock(blockIndex: number, slotIndex: number) {
    const character = pageCharacters()[slotIndex]
    if (!character?.name) return
    replaceBlockSpeaker(blockIndex, character.name)
  }

  function openCharacterForBlock(blockIndex: number) {
    setCharacterTargetBlock(blockIndex)
    setCharacterPickerOpen(true)
  }

  function insertBlockAtCursor(text: string) {
    const current = currentDialogueBody()
    const textarea = bodyTextareaRef
    const start = textarea?.selectionStart ?? current.length
    const end = textarea?.selectionEnd ?? current.length
    const before = current.slice(0, start)
    const after = current.slice(end)
    const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n\n' : '\n'
    const nextBody = `${before}${prefix}${text}${suffix}${after}`
    const nextCursor = before.length + prefix.length + text.length
    setViewMode('edit')
    patchDialogueBody(nextBody)
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function insertScenarioBlock(kind: ScenarioBlockKind) {
    const currentBody = currentDialogueBody()
    const text = formatScenarioBlock(kind)
    const textarea = bodyTextareaRef
    const blocks = splitTextBlocks(currentBody)
    const blockSelectionStart = cursorToTextIndex(blocks, blockCursor())
    const initialSelectionStart = textarea?.selectionStart ?? blockSelectionStart
    const escaped = escapeDialogueToNextParagraph(currentBody, initialSelectionStart)
    const current = escaped?.value ?? currentBody
    const start = escaped?.cursor ?? initialSelectionStart
    const end = escaped ? start : textarea?.selectionEnd ?? start
    const before = current.slice(0, start)
    const after = current.slice(end)
    const prefix = before && !before.endsWith('\n') ? '\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n' : ''
    const nextBody = `${before}${prefix}${text}${suffix}${after}`
    const cursor = before.length + prefix.length + cursorOffsetForScenarioBlock(kind)
    setViewMode('edit')
    patchDialogueBody(nextBody)
    setBlockCursor(textIndexToBlockCursor(splitTextBlocks(nextBody), cursor))
    if (kind === 'system') setTagSidebarOpen(true)
    queueMicrotask(() => {
      bodyTextareaRef?.focus()
      bodyTextareaRef?.setSelectionRange(cursor, cursor)
    })
  }

  function addTagToSystemBlock(tag: string) {
    const blocks = splitTextBlocks(currentDialogueBody())
    let blockIndex = blockCursor().blockIndex
    if (!blocks[blockIndex]?.startsWith(':::system')) {
      blockIndex = blocks.findLastIndex((block, index) => index <= blockCursor().blockIndex && block.startsWith(':::system'))
    }
    if (blockIndex < 0) {
      insertScenarioBlock('system')
      window.setTimeout(() => addTagToSystemBlock(tag), 0)
      return
    }

    const block = blocks[blockIndex]
    if (block.includes(`- ${tag}`)) return
    const insertAt = block.lastIndexOf('\n:::')
    const nextBlock = insertAt >= 0
      ? `${block.slice(0, insertAt)}\n- ${tag}${block.slice(insertAt)}`
      : `${block}\n- ${tag}`
    blocks[blockIndex] = nextBlock
    const nextBody = blocks.join('\n\n')
    patchDialogueBody(nextBody)
    setBlockCursor({ blockIndex, cursor: nextBlock.length })
  }

  function handleRenameNotebook(title: string) {
    const id = selectedId()
    if (!id) return
    updateNotebook(id, { title, updatedAt: new Date() })
  }

  function makeSourceFileName(notebookTitle: string, pageTitle: string) {
    const clean = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled'
    return `${clean(notebookTitle)}__${clean(pageTitle)}.md`
  }

  function appendCommentThread(input: {
    target: 'kanbanMemoInbox' | 'novelEngineDevStudio'
    documentId?: string
    status: 'sent' | 'error'
    message?: string
  }) {
    const nb = selectedNotebook()
    const page = selectedPage()
    const comments = state.notebooks.find((notebook) => notebook.id === 'story-comments')
    if (!nb || !page || !comments?.id) return

    const now = new Date().toISOString()
    const statusPage = comments.pages.find((item) => item.id === 'comment-inbox-status-json')
    const fallback = {
      schema: 'kanban-note01.comment_inbox.v0_1',
      purpose: '出先から送られたコメント、依頼、AI返信の対応状態をCodexが確認するためのJSON',
      statusRule: {
        inbox: '未確認',
        working: '対応中',
        needs_retry: '送信失敗。再送または確認が必要',
        done: '対応済み。Archiveへ移動候補',
        archived: 'Archiveへ蓄積済み',
      },
      threads: [],
    }
    let data: typeof fallback & { threads: Array<Record<string, unknown>> } = fallback
    try {
      data = { ...fallback, ...(JSON.parse(statusPage?.body || '{}') as typeof fallback & { threads?: Array<Record<string, unknown>> }) }
      data.threads = Array.isArray(data.threads) ? data.threads : []
    } catch {
      data = fallback
    }

    const sourcePageTitle = page.title || '無題'
    const thread = {
      id: `comment_${Date.now()}`,
      status: input.status === 'sent' ? 'inbox' : 'needs_retry',
      direction: 'outbound',
      target: input.target,
      firebaseDocumentId: input.documentId ?? null,
      sourceNotebookId: nb.id,
      sourceNotebookTitle: nb.title,
      sourcePageId: page.id,
      sourcePageTitle,
      sourceFileName: makeSourceFileName(nb.title, sourcePageTitle),
      title: `${nb.title} / ${sourcePageTitle}`,
      sentAt: now,
      message: input.message ?? '',
      aiReply: '',
      archiveTargetPageId: 'comment-archive-json',
    }
    const body = JSON.stringify({ ...data, threads: [thread, ...data.threads] }, null, 2)
    const pages = comments.pages.map((item) =>
      item.id === 'comment-inbox-status-json' ? { ...item, body, updatedAt: undefined } : item
    )
    updateNotebook(comments.id, { pages, updatedAt: new Date() })
  }

  async function sendSelectedPageToDevStudio() {
    const nb = selectedNotebook()
    const page = selectedPage()
    if (!nb || !page || devStudioStatus() === 'sending') return
    setDevStudioStatus('sending')
    setDevStudioInfo(null)
    try {
      const sourcePageTitle = page.title || '無題'
      const item = await sendScenarioFragmentToDevStudio({
        sourceNotebookId: nb.id,
        sourceNotebookTitle: nb.title,
        sourcePageId: page.id,
        sourcePageTitle,
        sourceFileName: makeSourceFileName(nb.title, sourcePageTitle),
        targetTitleId: nb.id,
        targetTitle: nb.title,
        title: `${nb.title} / ${sourcePageTitle}`,
        body: page.body,
        tags: ['notebook_page'],
      })
      setDevStudioStatus('sent')
      setDevStudioInfo({ id: item.id, sentAt: item.updatedAt })
      appendCommentThread({ target: 'novelEngineDevStudio', documentId: item.id, status: 'sent' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('[DevStudio scenario_fragment] notebook page send failed:', error)
      setDevStudioStatus('error')
      setDevStudioInfo({ message })
      appendCommentThread({ target: 'novelEngineDevStudio', status: 'error', message })
    }
  }

  function selectNotebookForShelf(id: string) {
    setSelectedId(id)
    setSelectedPageId(null)
    setSendStatus('idle')
    setDevStudioStatus('idle')
    setDevStudioInfo(null)
    setMobileShelfMode('pages')
  }

  const CharacterSheetPanel = () => (
    <section class="flex-1 min-h-0 overflow-y-auto rounded-xl border border-nacc-border bg-white p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <div class="min-w-0 mr-auto">
          <h2 class="text-sm font-bold text-nacc-dark">Characterシート</h2>
          <p class="text-xs text-gray-400">このページ内スコープ / ID, 名前, DICT, プロンプト, role, note</p>
        </div>
        <input
          type="search"
          class="min-w-[180px] flex-1 max-w-xs text-sm bg-gray-50 border border-nacc-border rounded-lg px-3 py-2 outline-none"
          placeholder="Characterを検索..."
          value={characterSearch()}
          onInput={(e) => setCharacterSearch(e.currentTarget.value)}
        />
        <input
          type="text"
          class="min-w-[180px] flex-1 max-w-xs text-sm bg-gray-50 border border-nacc-border rounded-lg px-3 py-2 outline-none"
          placeholder="新しいCharacter名"
          value={characterDraft()}
          onInput={(e) => setCharacterDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addNotebookCharacter()
            }
          }}
        />
        <button
          type="button"
          class="px-3 py-2 rounded-lg bg-nacc-gold text-white text-xs font-bold"
          onClick={addNotebookCharacter}
        >
          追加
        </button>
      </div>
      <div class="space-y-2">
        <For each={filteredCharacters()}>
          {(character) => {
            const index = () => pageCharacters().findIndex((item) => item.id === character.id)
            const current = () => pageCharacters()[index()]
            return (
              <div class="w-full rounded-xl border border-nacc-border bg-[#f9f8f6] px-3 py-3 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_.8fr_auto_auto] gap-2 items-center">
                  <input
                    type="text"
                    class="min-w-0 text-xs text-gray-500 bg-white border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                    placeholder="ID"
                    value={current()?.id ?? ''}
                    onInput={(e) => updatePageCharacter(index(), { id: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    class="min-w-0 text-sm text-nacc-dark font-semibold bg-white border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                    placeholder="名前"
                    value={current()?.name ?? ''}
                    onInput={(e) => updatePageCharacter(index(), { name: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    class="min-w-0 text-xs text-nacc-dark bg-white border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                    placeholder="role"
                    value={current()?.role ?? ''}
                    onInput={(e) => updatePageCharacter(index(), { role: e.currentTarget.value })}
                  />
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg bg-[#0b1f3a] text-white text-xs font-bold"
                    onClick={() => {
                      handleCharacterSheetSelect(current()?.name || character.name)
                      setEditorMode('dialogueLog')
                    }}
                  >
                    選択
                  </button>
                  <button
                    type="button"
                    class="px-2 py-1.5 rounded-lg text-red-400 text-xs font-bold"
                    onClick={() => deleteNotebookCharacter(index())}
                  >
                    削除
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <textarea
                    class="min-h-[64px] text-xs text-nacc-dark bg-white border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-y"
                    placeholder="DICT: 表記ゆれ、呼び名、別名"
                    value={current()?.dict ?? ''}
                    onInput={(e) => updatePageCharacter(index(), { dict: e.currentTarget.value })}
                  />
                  <textarea
                    class="min-h-[64px] text-xs text-nacc-dark bg-white border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-y"
                    placeholder="プロンプト: 外見、口調、画像生成メモ"
                    value={current()?.prompt ?? ''}
                    onInput={(e) => updatePageCharacter(index(), { prompt: e.currentTarget.value })}
                  />
                  <textarea
                    class="min-h-[64px] text-xs text-nacc-dark bg-white border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-y"
                    placeholder="note: このページ限定の補足"
                    value={current()?.note ?? ''}
                    onInput={(e) => updatePageCharacter(index(), { note: e.currentTarget.value })}
                  />
                </div>
              </div>
            )
          }}
        </For>
        <Show when={filteredCharacters().length === 0}>
          <div class="text-center text-sm text-gray-300 py-8">Characterが見つかりません</div>
        </Show>
      </div>
    </section>
  )

  const ScenarioHeadingLogNav = () => (
    <Show when={scenarioHeadingNavItems().length > 0}>
      <div class="scenario-heading-log-nav">
        <For each={scenarioHeadingNavItems()}>
          {(item) => (
            <button
              type="button"
              classList={{
                h2: item.level === 2,
                h3: item.level === 3,
                linked: Boolean(selectedPage()?.scenarioLogs?.[item.key]),
              }}
              title={`${item.title} の会話ログへ移動`}
              onClick={() => openScenarioHeadingLog(item)}
            >
              <span>H{item.level}</span>
              <strong>{item.title}</strong>
            </button>
          )}
        </For>
      </div>
    </Show>
  )

  const ShortcutGuideBar = () => (
    <div class="shortcut-guide-bar">
      <button type="button" onClick={() => setBlockSidebarOpen(true)}>
        <kbd>＋</kbd><span>Blocks</span>
      </button>
      <button type="button" onClick={() => insertScenarioBlock('event')}>
        <kbd>Alt+E</kbd><span>Event</span>
      </button>
      <button type="button" onClick={() => insertScenarioBlock('quest')}>
        <kbd>Alt+Q</kbd><span>Quest</span>
      </button>
      <button type="button" onClick={() => insertScenarioBlock('choice')}>
        <kbd>Alt+C</kbd><span>Choice</span>
      </button>
      <button type="button" onClick={() => insertScenarioBlock('world')}>
        <kbd>Alt+W</kbd><span>World</span>
      </button>
      <button type="button" onClick={() => { insertScenarioBlock('system'); setTagSidebarOpen(true) }}>
        <kbd>Alt+S</kbd><span>Tags</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setCharacterTargetBlock(null)
          setCharacterPickerOpen(true)
        }}
      >
        <kbd>Alt+1-4</kbd><span>Character</span>
      </button>
      <button type="button" class="is-muted" onClick={() => setShortcutGuideOpen(true)}>
        <kbd>Alt+?</kbd><span>Guide</span>
      </button>
    </div>
  )

  const BlockSidebar = () => {
    const blocks: Array<{ kind: ScenarioBlockKind; label: string; desc: string }> = [
      { kind: 'event', label: 'Event / Scene', desc: 'Sceneやイベントの区切り' },
      { kind: 'quest', label: 'Quest', desc: 'クエストカード' },
      { kind: 'choice', label: 'Choice', desc: '選択肢と遷移先' },
      { kind: 'world', label: 'WorldWord', desc: 'ログに出さない注釈' },
      { kind: 'system', label: 'System Tags', desc: 'BGM/背景/演出tag' },
      { kind: 'pillar', label: '柱', desc: 'Scene/Event名' },
      { kind: 'direction', label: 'ト書き', desc: '情景/動作' },
      { kind: 'dialogue', label: 'セリフ', desc: '名前：「」' },
    ]
    return (
      <Show when={blockSidebarOpen()}>
        <div class="block-sidebar-backdrop" onClick={() => setBlockSidebarOpen(false)} />
        <aside class="block-sidebar">
          <div class="block-sidebar-header">
            <div>
              <p>会話ログ Block追加</p>
              <span>現在位置へ挿入</span>
            </div>
            <button type="button" onClick={() => setBlockSidebarOpen(false)}>閉じる</button>
          </div>
          <div class="block-sidebar-list">
            <For each={blocks}>
              {(block) => (
                <button
                  type="button"
                  onClick={() => {
                    insertScenarioBlock(block.kind)
                    setBlockSidebarOpen(false)
                  }}
                >
                  <strong>{block.label}</strong>
                  <span>{block.desc}</span>
                </button>
              )}
            </For>
          </div>
        </aside>
      </Show>
    )
  }

  const ShortcutGuidePopup = () => (
    <Show when={shortcutGuideOpen()}>
      <div class="fixed inset-0 z-60 bg-black/35" onClick={() => setShortcutGuideOpen(false)} />
      <div class="shortcut-guide-popup">
        <div class="flex items-center justify-between gap-3">
          <h2>ショートカット</h2>
          <button type="button" onClick={() => setShortcutGuideOpen(false)}>閉じる</button>
        </div>
        <div class="shortcut-guide-grid">
          <span><kbd>Alt+E</kbd> Event / Scene</span>
          <span><kbd>Alt+Q</kbd> Quest</span>
          <span><kbd>Alt+C</kbd> Choice</span>
          <span><kbd>Alt+W</kbd> WorldWord</span>
          <span><kbd>Alt+1-4</kbd> Character</span>
          <span><kbd>Ctrl+Enter</kbd> 新規Block</span>
          <span><kbd>↑↓</kbd> line選択</span>
          <span><kbd>Alt+S</kbd> SystemTag 予約</span>
          <span><kbd>Alt+X</kbd> Variable 予約</span>
        </div>
      </div>
    </Show>
  )

  const TagSidebar = () => {
    const group = () => TAG_GROUPS.find((item) => item.key === activeTagGroup()) ?? TAG_GROUPS[0]
    return (
      <Show when={tagSidebarOpen()}>
        <div class="tag-sidebar-backdrop" onClick={() => setTagSidebarOpen(false)} />
        <aside class="tag-sidebar">
          <div class="tag-sidebar-header">
            <div>
              <p>System Tags</p>
              <span>既存tagのみ挿入</span>
            </div>
            <button type="button" onClick={() => setTagSidebarOpen(false)}>閉じる</button>
          </div>
          <div class="tag-sidebar-tabs">
            <For each={TAG_GROUPS}>
              {(item) => (
                <button
                  type="button"
                  classList={{ active: activeTagGroup() === item.key }}
                  onClick={() => setActiveTagGroup(item.key)}
                >
                  {item.label}
                </button>
              )}
            </For>
          </div>
          <div class="tag-sidebar-list">
            <For each={Object.entries(group().items)}>
              {([tag, label]) => (
                <button type="button" onClick={() => addTagToSystemBlock(tag)}>
                  <code>{tag}</code>
                  <span>{label}</span>
                </button>
              )}
            </For>
          </div>
        </aside>
      </Show>
    )
  }

  const PasteBoardOverlay = () => (
    <Show when={pasteBoardOpen()}>
      <div class="paste-board-backdrop" onClick={() => setPasteBoardOpen(false)} />
      <section class="paste-board-overlay">
        <div class="paste-board-header">
          <div>
            <p>コピペボード</p>
            <span>{selectedNotebook()?.title ?? 'No Title'} scope / Alt+Space</span>
          </div>
          <button type="button" onClick={() => setPasteBoardOpen(false)}>閉じる</button>
        </div>
        <div class="paste-board-compose">
          <textarea
            value={pasteDraft()}
            onInput={(event) => setPasteDraft(event.currentTarget.value)}
            placeholder="このノート内で使い回す文、タグ、テンプレを登録..."
          />
          <button type="button" onClick={addPasteItem}>登録</button>
        </div>
        <div class="paste-board-list">
          <Show
            when={pasteItems().length > 0}
            fallback={<div class="paste-board-empty">まだ登録がありません</div>}
          >
            <For each={pasteItems()}>
              {(item) => (
                <article class="paste-board-item">
                  <pre>{item.text}</pre>
                  <div>
                    <button type="button" onClick={() => pasteTextToActiveEditor(item.text)}>貼る</button>
                    <button type="button" class="danger" onClick={() => deletePasteItem(item.id)}>削除</button>
                  </div>
                </article>
              )}
            </For>
          </Show>
        </div>
      </section>
    </Show>
  )

  const IdeaInboxSidebar = () => (
    <Show when={ideaInboxOpen()}>
      <div class="idea-inbox-backdrop" onClick={() => setIdeaInboxOpen(false)} />
      <aside class="idea-inbox-sidebar">
        <div class="idea-inbox-header">
          <div>
            <p>InBox</p>
            <span>Firebase + InBoxノートへ保存</span>
          </div>
          <button type="button" onClick={() => setIdeaInboxOpen(false)}>閉じる</button>
        </div>
        <div class="idea-inbox-body">
          <label>
            <span>件名</span>
            <input
              type="text"
              value={ideaSubject()}
              onInput={(event) => {
                setIdeaSubject(event.currentTarget.value)
                if (ideaInboxError()) setIdeaInboxError('')
              }}
              placeholder="あとで探すための件名..."
            />
          </label>
          <Show when={ideaInboxError()}>
            <div class="idea-inbox-error">{ideaInboxError()}</div>
          </Show>
          <label>
            <span>Tag</span>
            <select value={ideaTag()} onChange={(event) => setIdeaTag(event.currentTarget.value)}>
              <option value="">未分類</option>
              <For each={ideaTags()}>
                {(tag) => <option value={tag}>{tag}</option>}
              </For>
            </select>
          </label>
          <div class="idea-tag-add-row">
            <input
              type="text"
              value={ideaTagDraft()}
              onInput={(event) => setIdeaTagDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addInboxTag()
                }
              }}
              placeholder="新しいtagを追加..."
            />
            <button type="button" onClick={addInboxTag}>tag追加</button>
          </div>
          <div class="idea-tag-list">
            <For each={ideaTags()}>
              {(tag) => (
                <button type="button" classList={{ active: ideaTag() === tag }} onClick={() => setIdeaTag(tag)}>
              idea:{tag}
                </button>
              )}
            </For>
          </div>
          <label>
            <span>関連アイディア</span>
            <select value={ideaReference()} onChange={(event) => setIdeaReference(event.currentTarget.value)}>
              <option value="">未指定</option>
              <For each={ideaReferenceOptions()}>
                {(title) => <option value={title}>{title}</option>}
              </For>
            </select>
          </label>
          <label>
            <span>Memo</span>
            <textarea
              value={ideaDraft()}
              onInput={(event) => setIdeaDraft(event.currentTarget.value)}
              placeholder="今のノートとは混ぜず、InBoxへ送るメモ..."
            />
          </label>
          <button type="button" class="idea-inbox-submit" classList={{ disabled: !ideaSubject().trim() }} onClick={addIdeaInboxPage}>
            InBoxへ送信
          </button>
        </div>
      </aside>
    </Show>
  )

  const TemplatePicker = () => (
    <div class="template-picker">
      <button
        type="button"
        class="template-trigger"
        onClick={() => setTemplatePanelOpen((open) => !open)}
      >
        Template
      </button>
      <Show when={templatePanelOpen()}>
        <div class="template-menu">
          <For each={NOTE_TEMPLATES}>
            {(template) => (
              <button type="button" onClick={() => insertNoteTemplate(template.body)}>
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )

  const InboxSyncBadge = (props: { page: NotebookPage }) => {
    const status = () => inboxPageSyncStatus(props.page)
    return (
      <Show when={status() !== 'system'}>
        <span class={`inbox-sync-badge ${status()}`}>
          {inboxSyncStatusLabel(status())}
        </span>
      </Show>
    )
  }

  const InboxSyncCheckButton = () => (
    <Show when={selectedNotebook()?.id === 'story-inbox' || selectedNotebook()?.title === 'InBox'}>
      <button
        type="button"
        class="inbox-sync-check-btn"
        disabled={inboxSyncing()}
        onClick={handleManualInboxSyncCheck}
        title="未同期 / 失敗のInBoxページをFirebaseへ再送します"
      >
        {inboxSyncing() ? '同期中' : '同期チェック'}
      </button>
    </Show>
  )

  const MobileNotebookShelf = () => (
    <div class="flex-1 overflow-y-auto bg-white">
      <Show
        when={mobileShelfMode() === 'pages' && selectedNotebook()}
        fallback={
          <section class="w-full bg-white">
            <div class="flex items-center justify-between px-4 py-4 border-b border-nacc-border">
              <h1 class="text-xl font-extrabold text-nacc-dark tracking-tight">Title</h1>
              <button
                class="rounded-lg bg-nacc-gold px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-[.98]"
                onClick={handleAddNotebook}
              >
                + 新規Title
              </button>
            </div>

            <div>
              <For each={orderedNotebooks()}>
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
        }
      >
        {(nb) => (
          <section class="w-full bg-white">
            <div class="flex items-center justify-between gap-3 px-4 py-4 border-b border-nacc-border">
              <button
                class="rounded-lg border border-nacc-border bg-white px-3 py-2 text-sm font-bold text-gray-700 active:scale-[.98]"
                onClick={() => {
                  setSelectedPageId(null)
                  setMobileShelfMode('notebooks')
                }}
              >
                戻る
              </button>
              <div class="min-w-0 flex-1">
                <div class="text-xs text-gray-400">Title</div>
                <h1 class="truncate text-lg font-extrabold text-nacc-dark">{nb().title}</h1>
              </div>
              <button
                class="rounded-lg bg-nacc-gold px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-[.98]"
                onClick={handleAddPage}
              >
                + 新規ページ
              </button>
              <InboxSyncCheckButton />
            </div>

            <div class="p-4">
              <Show
                when={nb().pages.length > 0}
                fallback={
                  <button
                    class="w-full rounded-xl border border-dashed border-nacc-border bg-white px-4 py-5 text-left text-sm font-semibold text-gray-400"
                    onClick={handleAddPage}
                  >
                    + 最初のページを追加
                  </button>
                }
              >
                <For each={nb().pages.slice().sort((a, b) => a.order - b.order)}>
                  {(page) => (
                    <div class="mb-2 flex items-center gap-2 rounded-xl border border-nacc-border bg-white px-3 py-3 shadow-sm">
                      <button
                        class="min-w-0 flex-1 text-left active:scale-[.99]"
                        onClick={() => {
                          setSelectedPageId(page.id)
                          setSendStatus('idle')
                          setDevStudioStatus('idle')
                          setDevStudioInfo(null)
                        }}
                      >
                        <p class="truncate text-sm font-bold text-nacc-dark">{page.title || '無題'}</p>
                        <p class="mt-1 flex items-center gap-2 truncate text-xs text-gray-400">
                          <span>{page.sourcePath ?? '手書きページ'}</span>
                          <Show when={nb().id === 'story-inbox' || nb().title === 'InBox'}>
                            <InboxSyncBadge page={page} />
                          </Show>
                        </p>
                      </button>
                      <button
                        class="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-red-400 active:bg-red-50"
                        onClick={() => handleDeletePage(page.id)}
                        title="ページを削除"
                      >
                        <Show when={nb().id === 'story-inbox' || nb().title === 'InBox'} fallback="削除">×</Show>
                      </button>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </section>
        )}
      </Show>
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
            fallback={<MobileNotebookShelf />}
          >
            {(nb) => (
              <Show
                when={selectedPage()}
                fallback={<MobileNotebookShelf />}
              >
                {(page) => (
                  <div class="flex-1 flex flex-col overflow-hidden bg-nacc-light">
                    <div class="mobile-page-header px-4 py-3 border-b border-nacc-border bg-white shrink-0 flex items-center gap-3">
                      <button
                        class="text-sm px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-700"
                        onClick={() => {
                          // 戻路：Androidの戻る階層は、同じTitleのPage一覧へ戻す。
                          setSelectedPageId(null)
                          setMobileShelfMode('pages')
                        }}
                      >
                        戻る
                      </button>
                      <div class="mobile-page-title min-w-0">
                        <div class="text-xs text-gray-400 truncate">{nb().title}</div>
                        <div class="text-sm font-semibold text-nacc-dark truncate">{page().title || '無題'}</div>
                      </div>
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
                          setCharacterTargetBlock(null)
                          setCharacterPickerOpen(true)
                        }}
                      >
                        Character
                      </button>
                      <button
                        class="text-xs px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-700"
                        onClick={openWorldWordDictionary}
                        title="このノート専用のWW_ワールドワード辞書を開く"
                      >
                        WW
                      </button>
                      <button
                        class="devstudio-send-btn"
                        type="button"
                        disabled={devStudioStatus() === 'sending'}
                        onClick={sendSelectedPageToDevStudio}
                        title="現在のページをscenario_fragmentとしてNovelEngine DevStudioへ送る"
                      >
                        <SendIcon />
                        <span>{devStudioStatus() === 'sending' ? '送信中...' : 'DevStudioへ送信'}</span>
                      </button>
                    </div>
                    <Show when={sendStatus() === 'sent' || sendStatus() === 'error' || devStudioStatus() === 'sent' || devStudioStatus() === 'error'}>
                      <div class="px-4 pt-2 text-right text-xs">
                        <Show when={sendStatus() === 'sent' || sendStatus() === 'error'}>
                          <span class={sendStatus() === 'sent' ? 'text-green-600' : 'text-red-500'}>
                            {sendStatus() === 'sent' ? '送信済み' : kanbanMemoInboxEnabled ? '送信失敗' : 'Firebase未設定'}
                          </span>
                        </Show>
                        <Show when={devStudioStatus() === 'sent'}>
                          <span class="ml-2 text-green-600" title={devStudioInfo()?.id}>
                            sent_to_devstudio {devStudioInfo()?.sentAt}
                          </span>
                        </Show>
                        <Show when={devStudioStatus() === 'error'}>
                          <span class="ml-2 text-red-500" title={devStudioInfo()?.message}>
                            DevStudio送信失敗
                          </span>
                        </Show>
                      </div>
                    </Show>
                    <div class="flex-1 flex flex-col overflow-hidden p-3">
                      <input
                        type="text"
                        class="text-lg font-bold text-nacc-dark border-none outline-none bg-transparent w-full mb-2 shrink-0"
                        placeholder="ページタイトル"
                        value={page().title}
                        onInput={(e) => patchPage('title', e.currentTarget.value)}
                      />
                      <Show
                        when={viewMode() === 'preview'}
                        fallback={
                          <div class="flex-1 min-h-0 flex flex-col gap-2">
                            <div class="mode-pill self-start shrink-0">
                              <button
                                classList={{ active: editorMode() === 'note' }}
                                onClick={() => setEditorMode('note')}
                              >
                                Note
                              </button>
                              <button
                                classList={{ active: editorMode() === 'stepMemo' }}
                                onClick={() => setEditorMode('stepMemo')}
                              >
                                階層ステップ
                              </button>
                              <button
                                classList={{ active: editorMode() === 'dialogueLog' }}
                                onClick={() => {
                                  setActiveScenarioLogScope(null)
                                  setEditorMode('dialogueLog')
                                }}
                              >
                                会話ログ
                              </button>
                              <button
                                classList={{ active: editorMode() === 'characterSheet' }}
                                onClick={() => setEditorMode('characterSheet')}
                              >
                                Character
                              </button>
                            </div>
                            <TemplatePicker />
                            <Show when={editorMode() === 'stepMemo'}>
                              <div class="scenario-step-tools">
                                <button
                                  type="button"
                                  class="step-outline-btn"
                                  onClick={insertUndertakerOutline}
                                  title="アンダーテイカーの仮見出しを階層ステップへ挿入"
                                >
                                  アンダーテイカー仮見出しを入れる
                                </button>
                                <ScenarioHeadingLogNav />
                              </div>
                            </Show>
                            <Show
                              when={editorMode() === 'characterSheet'}
                              fallback={
                                <Show
                                  when={editorMode() === 'dialogueLog'}
                                  fallback={
                                    <Show
                                      when={editorMode() === 'stepMemo'}
                                      fallback={
                                        <textarea
                                          ref={bodyTextareaRef}
                                          class="flex-1 text-sm font-mono text-nacc-dark border border-nacc-border outline-none bg-white rounded-xl p-4 resize-none leading-relaxed shadow-sm focus:ring-1 focus:ring-nacc-gold/30"
                                          placeholder="ここに内容を入力..."
                                          value={page().body}
                                          onInput={(e) => patchPage('body', e.currentTarget.value)}
                                          onKeyDown={handleBodyKeyDown}
                                        />
                                      }
                                    >
                                      <ScenarioMemoEditor
                                        value={currentScenarioBody()}
                                        variant="stepper"
                                        insertRequest={pasteInsertRequest()}
                                        logKeys={Object.keys(page().scenarioLogs ?? {})}
                                        onOpenLog={openScenarioHeadingLog}
                                        onChange={(value) => patchPage('scenarioBody', value)}
                                      />
                                    </Show>
                                  }
                                >
                                  <Show when={activeScenarioLogScope()}>
                                    {(scope) => (
                                      <div class="scenario-log-scope-bar">
                                        <span>H{scope().level} / {scope().title}</span>
                                        <button type="button" onClick={() => setActiveScenarioLogScope(null)}>全体ログへ戻る</button>
                                      </div>
                                    )}
                                  </Show>
                                  <ScenarioBlockEditor
                                    value={currentDialogueBody()}
                                    cursor={blockCursor()}
                                    onChange={patchDialogueBody}
                                    onCursorChange={setBlockCursor}
                                    onScenarioShortcut={insertScenarioBlock}
                                    onSpeakerClick={openCharacterForBlock}
                                    onCharacterShortcut={handleCharacterShortcutForBlock}
                                    characterOptions={filteredCharacters()}
                                    onCharacterSelect={replaceBlockSpeaker}
                                  />
                                </Show>
                              }
                            >
                              <CharacterSheetPanel />
                            </Show>
                            <Show
                              when={editorMode() === 'dialogueLog'}
                              fallback={
                                <Show when={editorMode() === 'note'}>
                                  <MarkdownSymbolBar onInsert={insertMarkdownSymbolToNote} />
                                </Show>
                              }
                            >
                              <ShortcutGuideBar />
                            </Show>
                          </div>
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
      <div
        class="notebook-desktop-list shrink-0 border-r border-nacc-border bg-white flex flex-col"
        classList={{ collapsed: !desktopNotebookListOpen() }}
      >
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-nacc-border">
          <Show when={desktopNotebookListOpen()}>
            <span class="text-sm font-semibold text-nacc-dark">ノートブック</span>
          </Show>
          <button
            class="text-xs px-2 py-1 rounded bg-nacc-gold text-white font-semibold hover:opacity-80"
            onClick={() => setDesktopNotebookListOpen((open) => !open)}
            title={desktopNotebookListOpen() ? 'ノート一覧を閉じる' : 'ノート一覧を開く'}
          >
            {desktopNotebookListOpen() ? '閉' : '開'}
          </button>
        </div>

        <Show when={desktopNotebookListOpen()}>
          <div class="px-3 py-2 border-b border-nacc-border">
            <button
              class="w-full text-xs px-2 py-1.5 rounded bg-nacc-gold text-white font-semibold hover:opacity-80"
              onClick={handleAddNotebook}
            >
              + 新規ノート
            </button>
          </div>
        </Show>

        <div class="flex-1 overflow-y-auto">
          <Show
            when={orderedNotebooks().length > 0}
            fallback={
              <div class="flex flex-col items-center justify-center h-32 text-[#ccc] gap-2 text-xs">
                <span class="text-3xl">📓</span>
                <span>ノートがありません</span>
              </div>
            }
          >
            <For each={orderedNotebooks()}>
              {(nb) => (
                <div
                  class="w-full text-left px-4 py-3 border-b border-[#f0f0f0] group relative cursor-pointer"
                  classList={{
                    'bg-[#f5f0e8]': selectedId() === nb.id,
                    'hover:bg-[#f9f8f6]': selectedId() !== nb.id,
                    'opacity-80': nb.id === 'story-settings' || nb.id === 'story-comments',
                  }}
                  onClick={() => {
                    setSelectedId(nb.id!)
                    setSelectedPageId(nb.pages[0]?.id ?? null)
                    setPagePanelOpen(true)
                  }}
                >
                  <div class="flex items-center gap-2.5 pr-5">
                    <div class="w-10 h-12 rounded-md overflow-hidden bg-[#0b1f3a] shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      <Show when={nb.cover} fallback={<span>{nb.title.slice(0, 1)}</span>}>
                        <img src={nb.cover} alt="" class="w-full h-full object-cover" />
                      </Show>
                    </div>
                    <Show when={desktopNotebookListOpen()}>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-nacc-dark truncate">{nb.title}</p>
                        <p class="text-xs text-[#999] mt-0.5">{nb.pages.length}ページ</p>
                      </div>
                    </Show>
                  </div>
                  <Show when={desktopNotebookListOpen()}>
                    <button
                      class="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                      onClick={(e) => { e.stopPropagation(); handleDeleteNotebook(nb.id!) }}
                    >
                      ✕
                    </button>
                  </Show>
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
                    <InboxSyncCheckButton />
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
                            setDevStudioStatus('idle')
                            setDevStudioInfo(null)
                            setPagePanelOpen(false)
                          }}
                        >
                          <span class="flex-1 min-w-0 truncate">📄 {page.title || '無題'}</span>
                          <Show when={nb().id === 'story-inbox' || nb().title === 'InBox'}>
                            <InboxSyncBadge page={page} />
                          </Show>
                          <button
                            class="ml-2 rounded-md px-2 py-1 text-[11px] font-bold text-red-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id) }}
                            title="ページを削除"
                          >
                            <Show when={nb().id === 'story-inbox' || nb().title === 'InBox'} fallback="削除">×</Show>
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
                          setCharacterTargetBlock(null)
                          setCharacterPickerOpen(true)
                        }}
                      >
                        Character
                      </button>
                      <button
                        class="text-xs px-3 py-1.5 rounded-lg border border-nacc-border bg-white text-gray-700"
                        onClick={openWorldWordDictionary}
                        title="このノート専用のWW_ワールドワード辞書を開く"
                      >
                        WW
                      </button>
                      <button
                        class="devstudio-send-btn"
                        type="button"
                        disabled={devStudioStatus() === 'sending'}
                        onClick={sendSelectedPageToDevStudio}
                        title="現在のページをscenario_fragmentとしてNovelEngine DevStudioへ送る"
                      >
                        <SendIcon />
                        <span>{devStudioStatus() === 'sending' ? '送信中...' : 'DevStudioへ送信'}</span>
                      </button>
                    </div>
                    <Show when={sendStatus() === 'sent' || sendStatus() === 'error' || devStudioStatus() === 'sent' || devStudioStatus() === 'error'}>
                      <div class="-mt-1 mb-2 text-right text-xs">
                        <Show when={sendStatus() === 'sent' || sendStatus() === 'error'}>
                          <span class={sendStatus() === 'sent' ? 'text-green-600' : 'text-red-500'}>
                            {sendStatus() === 'sent' ? '送信済み' : kanbanMemoInboxEnabled ? '送信失敗' : 'Firebase未設定'}
                          </span>
                        </Show>
                        <Show when={devStudioStatus() === 'sent'}>
                          <span class="ml-2 text-green-600" title={devStudioInfo()?.id}>
                            sent_to_devstudio {devStudioInfo()?.sentAt}
                          </span>
                        </Show>
                        <Show when={devStudioStatus() === 'error'}>
                          <span class="ml-2 text-red-500" title={devStudioInfo()?.message}>
                            DevStudio送信失敗
                          </span>
                        </Show>
                      </div>
                    </Show>
                    <input
                      type="text"
                      class="text-xl font-bold text-nacc-dark border-none outline-none bg-transparent w-full mb-2 shrink-0"
                      placeholder="ページタイトル"
                      value={page().title}
                      onInput={(e) => patchPage('title', e.currentTarget.value)}
                    />
                    <Show
                      when={viewMode() === 'preview'}
                      fallback={
                        <div class="flex-1 min-h-0 flex flex-col gap-2">
                          <div class="mode-pill self-start shrink-0">
                            <button
                              classList={{ active: editorMode() === 'note' }}
                              onClick={() => setEditorMode('note')}
                            >
                              Note
                            </button>
                            <button
                              classList={{ active: editorMode() === 'stepMemo' }}
                              onClick={() => setEditorMode('stepMemo')}
                            >
                              階層ステップ
                            </button>
                            <button
                              classList={{ active: editorMode() === 'dialogueLog' }}
                              onClick={() => {
                                setActiveScenarioLogScope(null)
                                setEditorMode('dialogueLog')
                              }}
                            >
                              会話ログ
                            </button>
                            <button
                              classList={{ active: editorMode() === 'characterSheet' }}
                              onClick={() => setEditorMode('characterSheet')}
                            >
                              Character
                            </button>
                          </div>
                          <TemplatePicker />
                          <Show when={editorMode() === 'stepMemo'}>
                            <div class="scenario-step-tools">
                              <button
                                type="button"
                                class="step-outline-btn"
                                onClick={insertUndertakerOutline}
                                title="アンダーテイカーの仮見出しを階層ステップへ挿入"
                              >
                                アンダーテイカー仮見出しを入れる
                              </button>
                              <ScenarioHeadingLogNav />
                            </div>
                          </Show>
                          <Show
                            when={editorMode() === 'characterSheet'}
                            fallback={
                              <Show
                                when={editorMode() === 'dialogueLog'}
                                fallback={
                                  <Show
                                    when={editorMode() === 'stepMemo'}
                                    fallback={
                                      <textarea
                                        ref={bodyTextareaRef}
                                        class="flex-1 text-sm font-mono text-nacc-dark border border-nacc-border outline-none bg-white rounded-xl p-4 resize-none leading-relaxed shadow-sm focus:ring-1 focus:ring-nacc-gold/30"
                                        placeholder="ここに内容を入力..."
                                        value={page().body}
                                        onInput={(e) => patchPage('body', e.currentTarget.value)}
                                        onKeyDown={handleBodyKeyDown}
                                      />
                                    }
                                  >
                                    <ScenarioMemoEditor
                                      value={currentScenarioBody()}
                                      variant="stepper"
                                      insertRequest={pasteInsertRequest()}
                                      logKeys={Object.keys(page().scenarioLogs ?? {})}
                                      onOpenLog={openScenarioHeadingLog}
                                      onChange={(value) => patchPage('scenarioBody', value)}
                                    />
                                  </Show>
                                }
                              >
                                <Show when={activeScenarioLogScope()}>
                                  {(scope) => (
                                    <div class="scenario-log-scope-bar">
                                      <span>H{scope().level} / {scope().title}</span>
                                      <button type="button" onClick={() => setActiveScenarioLogScope(null)}>全体ログへ戻る</button>
                                    </div>
                                  )}
                                </Show>
                                <ScenarioBlockEditor
                                  value={currentDialogueBody()}
                                  cursor={blockCursor()}
                                  onChange={patchDialogueBody}
                                  onCursorChange={setBlockCursor}
                                  onScenarioShortcut={insertScenarioBlock}
                                  onSpeakerClick={openCharacterForBlock}
                                  onCharacterShortcut={handleCharacterShortcutForBlock}
                                  characterOptions={filteredCharacters()}
                                  onCharacterSelect={replaceBlockSpeaker}
                                />
                              </Show>
                            }
                          >
                            <CharacterSheetPanel />
                          </Show>
                          <Show
                            when={editorMode() === 'dialogueLog'}
                            fallback={
                              <Show when={editorMode() === 'note'}>
                                <MarkdownSymbolBar onInsert={insertMarkdownSymbolToNote} />
                              </Show>
                            }
                          >
                            <ShortcutGuideBar />
                          </Show>
                        </div>
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
            <span class="font-semibold text-sm">Characterシート / このページ内</span>
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
          <div class="px-5 pt-3 shrink-0 flex gap-2">
            <input
              type="text"
              class="min-w-0 flex-1 text-sm bg-gray-50 border border-nacc-border rounded-lg px-3 py-2 outline-none"
              placeholder="新しいCharacter名"
              value={characterDraft()}
              onInput={(e) => setCharacterDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addNotebookCharacter()
                }
              }}
            />
            <button
              type="button"
              class="px-3 py-2 rounded-lg bg-nacc-gold text-white text-xs font-bold"
              onClick={addNotebookCharacter}
            >
              追加
            </button>
          </div>
          <div class="overflow-y-auto flex-1 p-3">
            <For each={filteredCharacters()}>
              {(character) => {
                const index = () => pageCharacters().findIndex((item) => item.id === character.id)
                const current = () => pageCharacters()[index()]
                return (
                  <div class="w-full rounded-xl border border-nacc-border bg-white px-3 py-3 mb-2 shadow-sm">
                    <div class="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_.8fr_auto_auto] gap-2 items-center">
                      <input
                        type="text"
                        class="min-w-0 text-xs text-gray-500 bg-gray-50 border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                        placeholder="ID"
                        value={current()?.id ?? ''}
                        onInput={(e) => updatePageCharacter(index(), { id: e.currentTarget.value })}
                      />
                      <input
                        type="text"
                        class="min-w-0 text-sm text-nacc-dark font-semibold bg-gray-50 border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                        placeholder="名前"
                        value={current()?.name ?? ''}
                        onInput={(e) => updatePageCharacter(index(), { name: e.currentTarget.value })}
                      />
                      <input
                        type="text"
                        class="min-w-0 text-xs text-nacc-dark bg-gray-50 border border-nacc-border rounded-lg px-2 py-1.5 outline-none"
                        placeholder="role"
                        value={current()?.role ?? ''}
                        onInput={(e) => updatePageCharacter(index(), { role: e.currentTarget.value })}
                      />
                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-lg bg-[#0b1f3a] text-white text-xs font-bold"
                        onClick={() => handleCharacterSheetSelect(current()?.name || character.name)}
                      >
                        選択
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1.5 rounded-lg text-red-400 text-xs font-bold"
                        onClick={() => deleteNotebookCharacter(index())}
                      >
                        削除
                      </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <textarea
                        class="min-h-[48px] text-xs text-nacc-dark bg-gray-50 border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-y"
                        placeholder="DICT: 表記ゆれ、呼び名、別名"
                        value={current()?.dict ?? ''}
                        onInput={(e) => updatePageCharacter(index(), { dict: e.currentTarget.value })}
                      />
                      <textarea
                        class="min-h-[48px] text-xs text-nacc-dark bg-gray-50 border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-y"
                        placeholder="プロンプト: 外見、口調、画像生成メモ"
                        value={current()?.prompt ?? ''}
                        onInput={(e) => updatePageCharacter(index(), { prompt: e.currentTarget.value })}
                      />
                      <textarea
                        class="min-h-[48px] text-xs text-nacc-dark bg-gray-50 border border-nacc-border rounded-lg px-2 py-1.5 outline-none resize-y"
                        placeholder="note: このページ限定の補足"
                        value={current()?.note ?? ''}
                        onInput={(e) => updatePageCharacter(index(), { note: e.currentTarget.value })}
                      />
                    </div>
                  </div>
                )
              }}
            </For>
            <Show when={filteredCharacters().length === 0}>
              <div class="text-center text-sm text-gray-300 py-8">Characterが見つかりません</div>
            </Show>
          </div>
        </div>
      </Show>
      <TagSidebar />
      <BlockSidebar />
      <IdeaInboxSidebar />
      <PasteBoardOverlay />
      <ShortcutGuidePopup />
      <NotionCalloutQuickInsert
        open={notionCalloutOpen()}
        onClose={() => setNotionCalloutOpen(false)}
        onInsert={insertBlockAtCursor}
      />
    </div>
  )
}

export default PageNotebook
