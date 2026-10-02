import { createStore, produce } from 'solid-js/store'

// Bakeru Note（V3.1）のデータ。この端末の localStorage に1つだけ持つ（V2.1 のノートとは別）。
// ── DB V1（2026-10-02 利用者）──────────────────────────────────────────────
//   ページDB  pages     … 1枚ずつ書くもの（旧「ノート」）。notebookId でノート（本）に紐づく（無くてもよい）
//   ノートDB  notebooks … 本棚に並ぶ本。ジャンルはマルチセレクト。dictIds で辞書に紐づく
//   辞書DB    dicts     … コピペ用の辞書（表紙は漢字1字）。左の NAV に並ぶ
//   単語      words     … WordInBox の1表だけ。dicts＝振り分けた辞書の id（0個なら InBox だけ）
// 詳しくは docs/BakeruNote_DB_V1_2026-10-02.md

export type Page = {
  id: string; title: string; body: string; pinned?: boolean; createdAt: string; updatedAt: string
  /** 属するノート（本）。null＝どの本にも入っていない */
  notebookId?: string | null
}
/** 旧名（画面のコードでは Note と呼んでいる所がある） */
export type Note = Page
export type Notebook = {
  id: string; title: string
  /** 表紙の1字 */
  cover: string
  hue: number
  genres: string[]
  /** 本棚の何段目か（0〜3） */
  shelf: number
  order: number
  dictIds: string[]
  createdAt: string; updatedAt: string
}
/** 辞書。表紙は漢字1字 */
export type Dict = { id: string; kanji: string; name: string; hue: number }
/** 旧名 */
export type Book = Dict
export type Word = { id: string; text: string; dicts: string[]; createdAt: string; from?: 'copy' | 'mark' | 'hand' }
/** しおり（ゲームのセーブのように、書いていた場所を挟んでおく）。line/offset＝本文の何行目の何文字目、scroll＝縦の位置 */
export type Bookmark = {
  id: string; pageId: string; line: number; offset: number; scroll: number
  /** 挟んだ時の見出しと、その行の文字（あとで本文が変わっても、挟んだ時の様子を見せる） */
  heading: string; snippet: string
  memo: string
  createdAt: string
}

type Db = {
  version: 1
  pages: Page[]
  notebooks: Notebook[]
  dicts: Dict[]
  words: Word[]
  /** 2段目に並べる、開いているページ */
  openIds: string[]
  /** いま見ているページ（null＝ホーム） */
  activeId: string | null
  /** 2カラム（PC）。左は openIds/activeId、右は rightIds/rightActive */
  split: boolean
  rightIds: string[]
  rightActive: string | null
  /** 本棚: いま見ている段（0〜3）と、選んでいる本（null＝最近のページ） */
  shelf: number
  shelfBook: string | null
  /** しおりDB（新しい順） */
  bookmarks: Bookmark[]
}

export const SHELVES = 4
const KEY = 'bakeru-note-v31'
const now = () => new Date().toISOString()
export const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const DEFAULT_DICTS: Dict[] = [
  { id: 'bk_hito', kanji: '人', name: '人物', hue: 28 },
  { id: 'bk_basho', kanji: '地', name: '場所', hue: 150 },
  { id: 'bk_kotoba', kanji: '語', name: '用語', hue: 210 },
]

function welcome(): Page {
  const t = now()
  return {
    id: newId('nt'),
    title: 'はじめに',
    body: [
      '# Bakeru Note へようこそ',
      'ここは、思いついたことをすぐ書けるシンプルなページです。',
      '## 見出しを付ける',
      '行にカーソルを置いて Alt+1〜4。右の目次から、その見出しへ飛べます。',
      '## 単語を集める',
      '本文の文字を選んでコピーすると、左の InBox に集まります。選んで出る「単語に登録」でも入ります。',
      'InBox の単語の下にある辞書（人・地・語）を押すと、その辞書にも並びます。単語を押すと、カーソルの位置に貼ります。',
      '## 本棚',
      'ホームの本棚に本（ノート）を並べると、本ごとにページをまとめられます。',
    ].join('\n'),
    createdAt: t,
    updatedAt: t,
    notebookId: null,
  }
}

type RawDb = Partial<Db> & { notes?: Page[]; books?: Dict[] }
function load(): Db {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as RawDb | null
    // 旧形式（notes・books・word.books）も読み替える
    const pages = raw?.pages ?? raw?.notes
    if (raw && Array.isArray(pages)) {
      const has = (id: string | null | undefined) => !!id && pages.some((n) => n.id === id)
      const words = (Array.isArray(raw.words) ? raw.words : []).map((w) => {
        const old = w as Word & { books?: string[] }
        return { id: old.id, text: old.text, dicts: old.dicts ?? old.books ?? [], createdAt: old.createdAt, from: old.from }
      })
      return {
        version: 1,
        pages: pages.map((p) => ({ ...p, notebookId: p.notebookId ?? null })),
        notebooks: Array.isArray(raw.notebooks) ? raw.notebooks : [],
        dicts: Array.isArray(raw.dicts) ? raw.dicts : Array.isArray(raw.books) ? raw.books : DEFAULT_DICTS,
        words,
        openIds: (raw.openIds ?? []).filter(has),
        activeId: has(raw.activeId) ? raw.activeId! : null,
        split: !!raw.split,
        rightIds: (raw.rightIds ?? []).filter(has),
        rightActive: has(raw.rightActive) ? raw.rightActive! : null,
        shelf: Math.min(SHELVES - 1, Math.max(0, raw.shelf ?? 0)),
        shelfBook: raw.notebooks?.some((b) => b.id === raw.shelfBook) ? raw.shelfBook! : null,
        bookmarks: (raw.bookmarks ?? []).filter((b) => has(b.pageId)),
      }
    }
  } catch { /* 読めなければ初めから */ }
  const w = welcome()
  return {
    version: 1, pages: [w], notebooks: [], dicts: DEFAULT_DICTS, words: [],
    openIds: [w.id], activeId: w.id, split: false, rightIds: [], rightActive: null, shelf: 0, shelfBook: null, bookmarks: [],
  }
}

export const [db, setDb] = createStore<Db>(load())

// ---- 保存（打つたびに書くと重いので、少し待ってまとめて書く） ----
const [saveState, setSaveState] = createStore({ text: '保存済み' as '保存済み' | '保存中…' | '保存できません' })
export { saveState }
let timer: ReturnType<typeof setTimeout> | undefined
function persist() {
  setSaveState('text', '保存中…')
  clearTimeout(timer)
  timer = setTimeout(flush, 400)
}
export function flush() {
  clearTimeout(timer)
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
    setSaveState('text', '保存済み')
  } catch {
    setSaveState('text', '保存できません')
  }
}
if (typeof window !== 'undefined') window.addEventListener('beforeunload', flush)

// ---- ページ ----
export const noteById = (id: string | null) => db.pages.find((n) => n.id === id)
const blankPage = (): Page => {
  const t = now()
  // 本棚で本を選んでいる時は、その本のページとして作る
  return { id: newId('nt'), title: '', body: '', createdAt: t, updatedAt: t, notebookId: db.shelfBook }
}

export function createNote(): Page {
  const n = blankPage()
  setDb(produce((d) => { d.pages.unshift(n) }))
  openNote(n.id)
  return n
}
/** 開かずにページを作る（リンクの候補から「新しいページ」を作る時） */
export function addPage(title: string, notebookId: string | null = null): Page {
  const n = { ...blankPage(), title, notebookId }
  setDb(produce((d) => { d.pages.unshift(n) }))
  persist()
  return n
}
export function updateNote(id: string, patch: Partial<Pick<Page, 'title' | 'body' | 'pinned' | 'notebookId'>>) {
  // ピン留め・本の付け替えだけの時は「更新」にしない（並びが変わらないように）
  const touch = Object.keys(patch).some((k) => k !== 'pinned' && k !== 'notebookId')
  setDb('pages', (n) => n.id === id, produce((n) => { Object.assign(n, patch); if (touch) n.updatedAt = now() }))
  persist()
}
export function deleteNote(id: string) {
  setDb(produce((d) => {
    d.pages = d.pages.filter((n) => n.id !== id)
    d.bookmarks = d.bookmarks.filter((b) => b.pageId !== id)
    d.openIds = d.openIds.filter((x) => x !== id)
    if (d.activeId === id) d.activeId = d.openIds[d.openIds.length - 1] ?? null
    d.rightIds = d.rightIds.filter((x) => x !== id)
    if (d.rightActive === id) d.rightActive = d.rightIds[d.rightIds.length - 1] ?? null
  }))
  persist()
}

// ---- 2カラム（右の列）。同じページを左右で同時に開かない（片方の書き込みが消えるため） ----
export function setSplit(on: boolean) {
  setDb(produce((d) => {
    d.split = on
    // 2カラムをやめる時は、右のタブを左のタブ列へ戻す
    if (!on) {
      for (const id of d.rightIds) if (!d.openIds.includes(id)) d.openIds.push(id)
      d.rightIds = []
      d.rightActive = null
    }
    if (on && !d.rightActive) {
      const other = [...d.openIds].reverse().find((x) => x !== d.activeId) ?? null
      if (other) {
        if (!d.rightIds.includes(other)) d.rightIds.push(other)
        d.rightActive = other
      }
    }
  }))
  persist()
}
export function openRight(id: string) {
  setDb(produce((d) => {
    if (d.activeId === id) d.activeId = d.openIds.filter((x) => x !== id).pop() ?? null
    d.openIds = d.openIds.filter((x) => x !== id)
    if (!d.rightIds.includes(id)) d.rightIds.push(id)
    d.rightActive = id
  }))
  persist()
}
export function closeRightTab(id: string) {
  setDb(produce((d) => {
    const i = d.rightIds.indexOf(id)
    if (i < 0) return
    d.rightIds.splice(i, 1)
    if (d.rightActive === id) d.rightActive = d.rightIds[Math.min(i, d.rightIds.length - 1)] ?? null
  }))
  persist()
}
export function createNoteRight() {
  const n = blankPage()
  setDb(produce((d) => { d.pages.unshift(n) }))
  openRight(n.id)
}
export function openNote(id: string) {
  setDb(produce((d) => {
    // 右の列で開いていたら、左へ移す（同じページを2つ同時に開かない）
    if (d.rightIds.includes(id)) {
      d.rightIds = d.rightIds.filter((x) => x !== id)
      if (d.rightActive === id) d.rightActive = d.rightIds[d.rightIds.length - 1] ?? null
    }
    if (!d.openIds.includes(id)) d.openIds.push(id)
    d.activeId = id
  }))
  persist()
}
export function goHome() {
  setDb('activeId', null)
  persist()
}
/** 2段目のタブを閉じる。見ていたタブなら、隣のタブ（無ければホーム）へ */
export function closeTab(id: string) {
  setDb(produce((d) => {
    const i = d.openIds.indexOf(id)
    if (i < 0) return
    d.openIds.splice(i, 1)
    if (d.activeId === id) d.activeId = d.openIds[Math.min(i, d.openIds.length - 1)] ?? null
  }))
  persist()
}
export const noteTitle = (n: Page) => n.title.trim() || firstLine(n.body) || '無題のページ'
// 表の行（::table）と写真の行は名前に使わない
// リンクの札は「@ページ名」に（相手の名前は title だけを見る。互いに参照しあっても止まらなくならないように）
const firstLine = (body: string) => (body.split('\n').find((l) => l.trim() && !l.startsWith('::table ') && !l.startsWith('::link ') && !/^!\[[^\]]*\]\(bnimg:/.test(l)) ?? '')
  .replace(/^#{1,4}\s+/, '')
  .replace(/\[\[p:([\w-]+)\]\]/g, (_m, id: string) => `@${db.pages.find((p) => p.id === id)?.title || 'ページ'}`)
  .slice(0, 40)

// ---- ノート（本棚の本） ----
const HUES = [28, 150, 210, 330, 270, 90, 0, 190, 45, 250]
export const notebookById = (id: string | null | undefined) => (id ? db.notebooks.find((b) => b.id === id) : undefined)
export const booksOnShelf = (shelf: number) => db.notebooks.filter((b) => b.shelf === shelf).sort((a, b) => a.order - b.order)
export const pagesOf = (notebookId: string) => db.pages.filter((p) => p.notebookId === notebookId)
/** いままでに付けたジャンル（全部の本から集める） */
export const allGenres = () => [...new Set(db.notebooks.flatMap((b) => b.genres))].sort((a, b) => a.localeCompare(b, 'ja'))

export function createNotebook(shelf = db.shelf): Notebook {
  const t = now()
  const onShelf = booksOnShelf(shelf)
  const b: Notebook = {
    id: newId('nb'), title: '新しい本', cover: '本', hue: HUES[db.notebooks.length % HUES.length], genres: [],
    shelf, order: (onShelf[onShelf.length - 1]?.order ?? 0) + 1, dictIds: [], createdAt: t, updatedAt: t,
  }
  setDb(produce((d) => { d.notebooks.push(b); d.shelfBook = b.id }))
  persist()
  return b
}
export function updateNotebook(id: string, patch: Partial<Omit<Notebook, 'id' | 'createdAt'>>) {
  setDb('notebooks', (b) => b.id === id, produce((b) => { Object.assign(b, patch); b.updatedAt = now() }))
  persist()
}
/** 本を消す（ページは消さない。どの本にも入っていないページになる） */
export function deleteNotebook(id: string) {
  setDb(produce((d) => {
    d.notebooks = d.notebooks.filter((b) => b.id !== id)
    for (const p of d.pages) if (p.notebookId === id) p.notebookId = null
    if (d.shelfBook === id) d.shelfBook = null
  }))
  persist()
}
export function toggleGenre(id: string, genre: string) {
  const g = genre.trim()
  if (!g) return
  setDb('notebooks', (b) => b.id === id, 'genres', (gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]))
  persist()
}
export function toggleNotebookDict(id: string, dictId: string) {
  setDb('notebooks', (b) => b.id === id, 'dictIds', (ds) => (ds.includes(dictId) ? ds.filter((x) => x !== dictId) : [...ds, dictId]))
  persist()
}
export function setShelf(n: number) {
  setDb('shelf', Math.min(SHELVES - 1, Math.max(0, n)))
  persist()
}
/** 本を選ぶ（もう一度押すと外す＝最近のページに戻る） */
export function selectBook(id: string | null) {
  setDb('shelfBook', db.shelfBook === id ? null : id)
  persist()
}
/** いまの本（開いているページの本 → 無ければ本棚で選んでいる本） */
export const contextBook = (pageId: string | null) => notebookById(noteById(pageId)?.notebookId ?? db.shelfBook)

// ---- 単語（WordInBox） ----
export function addWord(text: string, from: Word['from'] = 'hand', dicts: string[] = []): 'added' | 'exists' | 'empty' {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t || t.length > 200) return 'empty'
  const same = db.words.find((w) => w.text === t)
  if (same) {
    // もう有れば、先頭へ上げるだけ（同じ単語を2つ作らない）
    setDb(produce((d) => {
      const i = d.words.findIndex((w) => w.id === same.id)
      const [w] = d.words.splice(i, 1)
      for (const b of dicts) if (!w.dicts.includes(b)) w.dicts.push(b)
      d.words.unshift(w)
    }))
    persist()
    return 'exists'
  }
  setDb(produce((d) => { d.words.unshift({ id: newId('wd'), text: t, dicts: [...dicts], createdAt: now(), from }) }))
  persist()
  return 'added'
}
export function removeWord(id: string) {
  setDb('words', (ws) => ws.filter((w) => w.id !== id))
  persist()
}
/** 辞書への振り分け（付ける／外す）。単語は1つのまま */
export function toggleWordBook(wordId: string, dictId: string) {
  setDb('words', (w) => w.id === wordId, 'dicts', (bs) => (bs.includes(dictId) ? bs.filter((b) => b !== dictId) : [...bs, dictId]))
  persist()
}

// ---- 辞書 ----
/** 辞書を足す。linkTo を渡すと、その本（ノート）にも紐づける */
export function addBook(kanji: string, name: string, linkTo?: string | null): Dict | null {
  const k = [...kanji.trim()][0]
  if (!k) return null
  const b: Dict = { id: newId('bk'), kanji: k, name: name.trim() || k, hue: HUES[db.dicts.length % HUES.length] }
  setDb(produce((d) => {
    d.dicts.push(b)
    const nb = linkTo ? d.notebooks.find((x) => x.id === linkTo) : undefined
    if (nb) nb.dictIds.push(b.id)
  }))
  persist()
  return b
}
export function removeBook(id: string) {
  setDb(produce((d) => {
    d.dicts = d.dicts.filter((b) => b.id !== id)
    for (const w of d.words) w.dicts = w.dicts.filter((b) => b !== id)
    for (const nb of d.notebooks) nb.dictIds = nb.dictIds.filter((x) => x !== id)
  }))
  persist()
}

// ---- しおり ----
export const MAX_BOOKMARKS = 50
export function addBookmark(b: Omit<Bookmark, 'id' | 'createdAt' | 'memo'>): Bookmark {
  const bm: Bookmark = { ...b, id: newId('bm'), memo: '', createdAt: now() }
  setDb(produce((d) => {
    d.bookmarks.unshift(bm)
    if (d.bookmarks.length > MAX_BOOKMARKS) d.bookmarks.splice(MAX_BOOKMARKS)
  }))
  persist()
  return bm
}
export function removeBookmark(id: string) {
  setDb('bookmarks', (bs) => bs.filter((b) => b.id !== id))
  persist()
}
export function setBookmarkMemo(id: string, memo: string) {
  setDb('bookmarks', (b) => b.id === id, 'memo', memo)
  persist()
}
