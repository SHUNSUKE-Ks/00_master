import { createStore } from 'solid-js/store'
import type {
  Page,
  BlogMode,
  FontSize,
  Blog,
  Memo,
  Notebook,
  Product,
  Nutrient,
  Symptom,
  DbView,
  ColumnDef,
  ScenarioBookEvent,
} from '../types'
import { PRODUCTS } from '../db/products'
import { NUTRIENTS } from '../db/nutrients'
import { SYMPTOMS } from '../db/symptoms'
import {
  fetchMemos, addMemoFs, updateMemoFs, deleteMemoFs,
  fetchBlogs, addBlogFs, updateBlogFs, restoreBlogFs, deleteBlogFs,
  fetchNotebooks, addNotebookFs, updateNotebookFs, deleteNotebookFs,
  fetchProducts, updateProductFs, seedProductsFs,
  fetchNutrients, updateNutrientFs, seedNutrientsFs,
  firebaseEnabled,
} from '../db/firebase'

export type DbStatus = 'idle' | 'connecting' | 'connected' | 'error'
export type DbTitleKey = 'db01' | 'db02'

export type AppState = {
  page: Page
  galleryReturnPage: Page
  blogMode: BlogMode
  fontSize: FontSize
  darkMode: boolean
  dbView: DbView
  selectedProductId: string | null
  selectedNutrientId: string | null
  selectedBlogId: string | null
  selectedMemoId: string | null
  sidebarOpen: boolean
  settingsPanelOpen: boolean
  galleryPanelOpen: boolean
  blogFilterTags: string[]
  products: Product[]
  nutrients: Nutrient[]
  symptoms: Symptom[]
  memos: Memo[]
  blogs: Blog[]
  trashBlogs: Blog[]
  notebooks: Notebook[]
  scenarioBooks: ScenarioBookEvent[]
  db01Columns: ColumnDef[]
  db02Columns: ColumnDef[]
  db03Columns: ColumnDef[]
  db10Columns: ColumnDef[]
  dbTitles: Record<DbTitleKey, string>
  dbStatus: DbStatus
}

const FONT_SIZE_PX: Record<FontSize, number> = { s: 13, m: 16, l: 19, xl: 22 }

function initDarkMode(): boolean {
  const saved = localStorage.getItem('note00-dark-mode')
  const isDark = saved === 'true'
  if (isDark) document.documentElement.classList.add('dark')
  return isDark
}

function initSidebarOpen(): boolean {
  return typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerHeight > 500 : true
}

export const DB01_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Title',       visible: true,  locked: true  },
  { id: 'category',    label: 'Type',        visible: true,  locked: false },
  { id: 'description', label: 'Summary',     visible: true,  locked: false },
  { id: 'symptoms',    label: 'Status',      visible: true,  locked: false },
  { id: 'effects',     label: 'Actions',     visible: true,  locked: false },
  { id: 'ingredients', label: 'Relations',   visible: true,  locked: false },
  { id: 'image',       label: 'Cover',       visible: false, locked: false },
  { id: 'memo',        label: 'Note',        visible: true,  locked: false },
]

export const DB02_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Tag',          visible: true,  locked: true  },
  { id: 'description', label: 'Description',  visible: true,  locked: false },
  { id: 'products',    label: 'Linked Notes', visible: true,  locked: false },
  { id: 'memo',        label: 'Memo',         visible: true,  locked: false },
]

export const DB03_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',     label: 'Relation Key', visible: true, locked: true  },
  { id: 'products', label: 'Linked Count', visible: true, locked: false },
  { id: 'category', label: 'Type',         visible: true, locked: false },
]

export const DB10_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Status',       visible: true, locked: true  },
  { id: 'description', label: 'Description',  visible: true, locked: false },
  { id: 'products',    label: 'Linked Notes', visible: true, locked: false },
  { id: 'memo',        label: 'Memo',         visible: true, locked: false },
]

const INITIAL_BLOGS: Blog[] = []

const INITIAL_SCENARIO_BOOKS: ScenarioBookEvent[] = [
  {
    id: 'scenario-sample-001',
    title: 'Scene 01 - 出会い',
    body: 'ナレーション：夕暮れの駅前。\nレムナント：「ここから先は、記録に残しておこう」\nラテル：「会話ログがそのままシナリオになるなら、あとで迷わないね」',
    coverType: 'none',
    characters: [
      { id: 'char-remnant', name: 'レムナント', role: '主人公' },
      { id: 'char-ratel', name: 'ラテル', role: '相棒' },
      { id: 'char-narration', name: 'ナレーション', role: '地の文' },
    ],
    titleDb: [
      { id: 'title-character', title: 'Character' },
      { id: 'title-place', title: 'Place' },
      { id: 'title-system', title: 'System' },
      { id: 'title-other', title: 'その他' },
    ],
    wordDb: [
      { id: 'word-remnant', titleId: 'title-character', label: 'レムナント', content: 'レムナント：「」', relationIds: [] },
      { id: 'word-ratel', titleId: 'title-character', label: 'ラテル', content: 'ラテル：「」', relationIds: [] },
      { id: 'word-narration', titleId: 'title-character', label: 'ナレーション', content: 'ナレーション：', relationIds: [] },
      { id: 'word-station', titleId: 'title-place', label: '駅前', content: '場所：駅前', relationIds: [] },
      { id: 'word-choice', titleId: 'title-system', label: '選択肢', content: '選択肢：\n- ', relationIds: [] },
    ],
    recentWordIds: ['word-remnant', 'word-ratel', 'word-narration'],
    fixedTags: [
      'fx_fade_in',
      'fx_fade_out',
      'mood_lonely',
      'bgm_forest',
      'se_page',
      'bg_village',
      'face_normal',
      'ev_character_join',
      'flag_seen_intro',
      'memo_key_event',
    ],
    snippets: [
      { id: 'term-event-flag', kind: 'term', label: 'イベントフラグ', content: 'イベントフラグ：' },
      { id: 'term-choice', kind: 'term', label: '選択肢', content: '選択肢：\n- ' },
      { id: 'tag-draft', kind: 'devTag', label: '#draft', content: '#draft' },
      { id: 'tag-review', kind: 'devTag', label: '#review', content: '#review' },
      { id: 'prompt-tone', kind: 'prompt', label: '口調確認', content: 'プロンプト：この会話のキャラクター口調を確認する。' },
    ],
    tags: ['event', 'conversation-log'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const [state, setState] = createStore<AppState>({
  page: 'db01',
  galleryReturnPage: 'db01',
  blogMode: 'memo',
  fontSize: 'xl',
  darkMode: initDarkMode(),
  dbView: 'table',
  selectedProductId: null,
  selectedNutrientId: null,
  selectedBlogId: null,
  selectedMemoId: null,
  sidebarOpen: initSidebarOpen(),
  settingsPanelOpen: false,
  galleryPanelOpen: false,
  blogFilterTags: [],
  products: PRODUCTS,
  nutrients: NUTRIENTS,
  symptoms: SYMPTOMS,
  memos: [],
  blogs: INITIAL_BLOGS,
  trashBlogs: [],
  notebooks: [],
  scenarioBooks: INITIAL_SCENARIO_BOOKS,
  db01Columns: DB01_COLUMNS_DEFAULT,
  db02Columns: DB02_COLUMNS_DEFAULT,
  db03Columns: DB03_COLUMNS_DEFAULT,
  db10Columns: DB10_COLUMNS_DEFAULT,
  dbTitles: {
    db01: 'Note DB',
    db02: 'Tag DB',
  },
  dbStatus: 'idle',
})

export { state, setState }

// ── UI actions ────────────────────────────────────────────────────────────────

export function navigate(page: Page) {
  if (page === 'gallery' && state.page !== 'gallery') {
    setState({ galleryReturnPage: state.page })
  }
  const keepSidebar = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerHeight > 500
  setState({ page, sidebarOpen: keepSidebar ? state.sidebarOpen : false })
}

export function updateDbTitle(key: DbTitleKey, title: string) {
  setState('dbTitles', key, title)
}

export function setFontSize(size: FontSize) {
  document.documentElement.style.fontSize = FONT_SIZE_PX[size] + 'px'
  setState({ fontSize: size })
}

export function toggleDarkMode() {
  const next = !state.darkMode
  document.documentElement.classList.toggle('dark', next)
  localStorage.setItem('note00-dark-mode', String(next))
  setState({ darkMode: next })
}

export function toggleBlogFilter(tagName: string) {
  setState('blogFilterTags', (prev) =>
    prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
  )
}

export function toggleDb01Column(id: string) {
  setState('db01Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

export function toggleDb02Column(id: string) {
  setState('db02Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

export function toggleDb03Column(id: string) {
  setState('db03Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

export function toggleDb10Column(id: string) {
  setState('db10Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

// ── Firestore init ────────────────────────────────────────────────────────────

export async function initFirestore(): Promise<void> {
  setState({ dbStatus: 'connecting' })
  try {
    const [memos, allBlogs, notebooks, fsProducts, fsNutrients] = await Promise.all([
      fetchMemos(),
      fetchBlogs(),
      fetchNotebooks(),
      fetchProducts(),
      fetchNutrients(),
    ])
    const blogs      = allBlogs.filter((b) => !b.deletedAt)
    const trashBlogs = allBlogs.filter((b) => !!b.deletedAt)

    if (fsProducts.length === 0) {
      await seedProductsFs(PRODUCTS)
      setState({ products: PRODUCTS })
    } else {
      setState({ products: fsProducts })
    }
    if (fsNutrients.length === 0) {
      await seedNutrientsFs(NUTRIENTS)
      setState({ nutrients: NUTRIENTS })
    } else {
      setState({ nutrients: fsNutrients })
    }

    setState({ memos, blogs, trashBlogs, notebooks, dbStatus: 'connected' })
  } catch (e) {
    console.error('[Firestore] init failed:', e)
    setState({ dbStatus: 'error' })
  }
}

// ── Product / Nutrient CRUD ───────────────────────────────────────────────────

export function updateProduct(id: string, patch: Partial<Product>): void {
  setState('products', (prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  if (firebaseEnabled) updateProductFs(id, patch).catch(console.warn)
}

export function addProduct(type = 'note'): string {
  const id = `NOTE-${String(state.products.length + 1).padStart(3, '0')}`
  const product: Product = {
    id,
    name: 'Untitled note item',
    image: '',
    category: type.trim() || 'note',
    description: '',
    price: 0,
    volume: '',
    symptoms: [],
    effects: [],
    ingredients: [],
    nutrientIds: [],
    memo: '',
    createdAt: new Date(),
  }
  setState('products', (prev) => [product, ...prev])
  if (firebaseEnabled) updateProductFs(id, product).catch(console.warn)
  return id
}

export function updateNutrient(id: string, patch: Partial<Nutrient>): void {
  setState('nutrients', (prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  if (firebaseEnabled) updateNutrientFs(id, patch).catch(console.warn)
}

export function addNutrient(): string {
  const id = `TAG-${String(state.nutrients.length + 1).padStart(3, '0')}`
  const nutrient: Nutrient = {
    id,
    name: 'Untitled tag',
    description: '',
    productIds: [],
    memo: '',
    createdAt: new Date(),
  }
  setState('nutrients', (prev) => [nutrient, ...prev])
  if (firebaseEnabled) updateNutrientFs(id, nutrient).catch(console.warn)
  return id
}

// ── Symptom CRUD ──────────────────────────────────────────────────────────────

export function addSymptom(data: Omit<Symptom, 'id'>): string {
  const id = 'SP' + String(state.symptoms.length + 1).padStart(2, '0')
  setState('symptoms', (prev) => [...prev, { ...data, id }])
  return id
}

export function updateSymptom(id: string, patch: Partial<Omit<Symptom, 'id'>>): void {
  setState('symptoms', (prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

export function deleteSymptom(id: string): void {
  setState('symptoms', (prev) => prev.filter((s) => s.id !== id))
}

// ── Memo CRUD ─────────────────────────────────────────────────────────────────

export async function addMemo(data: Omit<Memo, 'id'>): Promise<string> {
  const tempId = 'local-' + Date.now()
  setState('memos', (prev) => [{ ...data, id: tempId }, ...prev])
  try {
    if (!firebaseEnabled) return tempId
    const id = await addMemoFs(data)
    setState('memos', (prev) => prev.map((m) => (m.id === tempId ? { ...m, id } : m)))
    return id
  } catch {
    return tempId
  }
}

export function updateMemo(id: string, patch: Partial<Omit<Memo, 'id'>>): void {
  setState('memos', (prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  if (firebaseEnabled) updateMemoFs(id, patch).catch(console.warn)
}

export function deleteMemo(id: string): void {
  setState('memos', (prev) => prev.filter((m) => m.id !== id))
  if (firebaseEnabled) deleteMemoFs(id).catch(console.warn)
}

// ── Blog CRUD ─────────────────────────────────────────────────────────────────

export async function addBlog(data: Omit<Blog, 'id'>): Promise<string> {
  const tempId = 'local-' + Date.now()
  setState('blogs', (prev) => [{ ...data, id: tempId }, ...prev])
  try {
    if (!firebaseEnabled) return tempId
    const id = await addBlogFs(data)
    setState('blogs', (prev) => prev.map((b) => (b.id === tempId ? { ...b, id } : b)))
    return id
  } catch {
    return tempId
  }
}

export function updateBlog(id: string, patch: Partial<Omit<Blog, 'id'>>): void {
  setState('blogs', (prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  if (firebaseEnabled) updateBlogFs(id, patch).catch(console.warn)
}

export function trashBlog(id: string): void {
  const blog = state.blogs.find((b) => b.id === id)
  if (!blog) return
  const deletedAt = new Date()
  setState('blogs', (prev) => prev.filter((b) => b.id !== id))
  setState('trashBlogs', (prev) => [{ ...blog, deletedAt }, ...prev])
  if (firebaseEnabled) updateBlogFs(id, { deletedAt }).catch(console.warn)
}

export function restoreBlog(id: string): void {
  const blog = state.trashBlogs.find((b) => b.id === id)
  if (!blog) return
  const { deletedAt: _d, ...restored } = blog
  setState('trashBlogs', (prev) => prev.filter((b) => b.id !== id))
  setState('blogs', (prev) => [{ ...restored }, ...prev])
  if (firebaseEnabled) restoreBlogFs(id).catch(console.warn)
}

export function deleteBlogPermanent(id: string): void {
  setState('trashBlogs', (prev) => prev.filter((b) => b.id !== id))
  if (firebaseEnabled) deleteBlogFs(id).catch(console.warn)
}

export function emptyTrash(): void {
  const ids = state.trashBlogs.map((b) => b.id!)
  setState({ trashBlogs: [] })
  if (firebaseEnabled) Promise.all(ids.map(deleteBlogFs)).catch(console.warn)
}

// ── Notebook CRUD ─────────────────────────────────────────────────────────────

export async function addNotebook(data: Omit<Notebook, 'id'>): Promise<string> {
  const tempId = 'local-' + Date.now()
  setState('notebooks', (prev) => [{ ...data, id: tempId }, ...prev])
  try {
    if (!firebaseEnabled) return tempId
    const id = await addNotebookFs(data)
    setState('notebooks', (prev) => prev.map((n) => (n.id === tempId ? { ...n, id } : n)))
    return id
  } catch {
    return tempId
  }
}

export function updateNotebook(id: string, patch: Partial<Omit<Notebook, 'id'>>): void {
  setState('notebooks', (prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  if (firebaseEnabled) updateNotebookFs(id, patch).catch(console.warn)
}

export async function deleteNotebook(id: string): Promise<void> {
  if (firebaseEnabled) await deleteNotebookFs(id)
  setState('notebooks', (prev) => prev.filter((n) => n.id !== id))
}

// ── ScenarioBook CRUD ────────────────────────────────────────────────────────

export function addScenarioBookEvent(): string {
  const now = new Date()
  const id = `scenario-${now.getTime()}`
  setState('scenarioBooks', (prev) => [
    {
      id,
      title: '新しいイベント',
      body: 'ナレーション：',
      coverType: 'none',
      characters: [
        { id: `char-${now.getTime()}-narration`, name: 'ナレーション', role: '地の文' },
      ],
      titleDb: [
        { id: `title-${now.getTime()}-character`, title: 'Character' },
        { id: `title-${now.getTime()}-system`, title: 'System' },
        { id: `title-${now.getTime()}-other`, title: 'その他' },
      ],
      wordDb: [
        {
          id: `word-${now.getTime()}-narration`,
          titleId: `title-${now.getTime()}-character`,
          label: 'ナレーション',
          content: 'ナレーション：',
          relationIds: [],
        },
      ],
      recentWordIds: [],
      fixedTags: [
        'fx_fade_in',
        'fx_fade_out',
        'mood_happy',
        'mood_lonely',
        'bgm_forest',
        'se_page',
        'bg_village',
        'face_normal',
        'memo_key_event',
      ],
      snippets: [
        { id: `snippet-${now.getTime()}-choice`, kind: 'term', label: '選択肢', content: '選択肢：\n- ' },
        { id: `snippet-${now.getTime()}-draft`, kind: 'devTag', label: '#draft', content: '#draft' },
        { id: `snippet-${now.getTime()}-prompt`, kind: 'prompt', label: '整合性確認', content: 'プロンプト：このイベントの会話ログを確認する。' },
      ],
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
    ...prev,
  ])
  return id
}

export function updateScenarioBookEvent(id: string, patch: Partial<Omit<ScenarioBookEvent, 'id' | 'createdAt'>>) {
  setState('scenarioBooks', (prev) =>
    prev.map((event) => (event.id === id ? { ...event, ...patch, updatedAt: new Date() } : event))
  )
}

export function deleteScenarioBookEvent(id: string) {
  setState('scenarioBooks', (prev) => prev.filter((event) => event.id !== id))
}
