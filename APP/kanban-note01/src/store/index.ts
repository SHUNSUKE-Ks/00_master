import { createStore } from 'solid-js/store'
import type { Page, BlogMode, FontSize, Blog, Memo, Notebook, Product, Nutrient, Symptom, DbView, ColumnDef } from '../types'
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
  selectedNotebookId: string | null
  selectedNotebookPageId: string | null
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
  db01Columns: ColumnDef[]
  db02Columns: ColumnDef[]
  db03Columns: ColumnDef[]
  db10Columns: ColumnDef[]
  dbTitles: Record<DbTitleKey, string>
  dbStatus: DbStatus
}

const FONT_SIZE_PX: Record<FontSize, number> = { s: 13, m: 16, l: 19, xl: 22 }

function initFontSize(): FontSize {
  if (typeof window === 'undefined') return 'l'
  return window.innerWidth < 768 || (window.innerHeight <= 500 && window.matchMedia('(orientation: landscape)').matches)
    ? 'm'
    : 'l'
}

function initDarkMode(): boolean {
  const saved = localStorage.getItem('note00-dark-mode')
  const isDark = saved === null ? true : saved === 'true'
  if (isDark) document.documentElement.classList.add('dark')
  return isDark
}

function initSidebarOpen(): boolean {
  return typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerHeight > 500 : true
}

export const DB01_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Title',       visible: true,  locked: true  },
  { id: 'category',    label: 'Genre',       visible: true,  locked: false },
  { id: 'description', label: 'Synopsis',    visible: true,  locked: false },
  { id: 'symptoms',    label: 'State',       visible: true,  locked: false },
  { id: 'effects',     label: 'Plot',        visible: true,  locked: false },
  { id: 'ingredients', label: 'Characters',  visible: true,  locked: false },
  { id: 'image',       label: 'Cover',       visible: false, locked: false },
  { id: 'memo',        label: 'Note',        visible: true,  locked: false },
]

export const DB02_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Character',    visible: true,  locked: true  },
  { id: 'description', label: 'Profile',      visible: true,  locked: false },
  { id: 'products',    label: 'Linked Titles', visible: true, locked: false },
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
const INITIAL_MEMOS: Memo[] = [
  {
    id: 'scenario-note-initial',
    title: 'scenarioノート',
    body: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]
const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'story-ideas',
    title: 'アイディア帳',
    storyOnly: true,
    pages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'story-tensai-mage',
    title: '天災魔法使い',
    cover: '/story-covers/tensai-mage.webp',
    storyOnly: true,
    pages: [
      {
        id: 'tensai-task01',
        title: 'Task01',
        body: '',
        sourcePath: '/story-notebooks/tensai-mage/task01.md',
        order: 0,
      },
      {
        id: 'tensai-chapter-1-draft',
        title: '天災_第一章 短稿',
        body: '',
        sourcePath: '/story-notebooks/tensai-mage/chapter-1-draft.md',
        order: 1,
      },
      {
        id: 'tensai-chapter-1-full',
        title: '天災_第一章',
        body: '',
        sourcePath: '/story-notebooks/tensai-mage/chapter-1-full.md',
        order: 2,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'story-future-blacksmith',
    title: '未来を打ち直す鍛冶屋',
    cover: '/story-covers/future-blacksmith.webp',
    storyOnly: true,
    pages: [
      {
        id: 'future-character-idialog',
        title: 'Character IdiaLog',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/character-idialog.md',
        order: 0,
      },
      {
        id: 'future-world-master',
        title: 'マスター設定書',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/world-master.md',
        order: 1,
      },
      {
        id: 'future-scenario-chat-log',
        title: 'IdiaChatログ',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/scenario-chat-log.md',
        order: 2,
      },
      {
        id: 'future-episode-1-samples',
        title: '第一話 サンプル集',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/episode-1-samples.md',
        order: 3,
      },
      {
        id: 'future-episode-1-directions',
        title: '第一話 ト書き',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/episode-1-directions.md',
        order: 4,
      },
      {
        id: 'future-plot-episodes-1-3',
        title: 'プロットシート 第1-3話',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/plot-episodes-1-3.md',
        order: 5,
      },
      {
        id: 'future-devlog-idialog',
        title: 'DevLog IdiaLog',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/devlog-idialog.md',
        order: 6,
      },
      {
        id: 'future-root-idialog',
        title: 'Root IdiaLog',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/root-idialog.md',
        order: 7,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const [state, setState] = createStore<AppState>({
  page: 'notebook',
  galleryReturnPage: 'db01',
  blogMode: 'memo',
  fontSize: initFontSize(),
  darkMode: initDarkMode(),
  dbView: 'table',
  selectedProductId: null,
  selectedNutrientId: null,
  selectedBlogId: null,
  selectedMemoId: null,
  selectedNotebookId: INITIAL_NOTEBOOKS[0]?.id ?? null,
  selectedNotebookPageId: null,
  sidebarOpen: initSidebarOpen(),
  settingsPanelOpen: false,
  galleryPanelOpen: false,
  blogFilterTags: [],
  products: PRODUCTS,
  nutrients: NUTRIENTS,
  symptoms: SYMPTOMS,
  memos: INITIAL_MEMOS,
  blogs: INITIAL_BLOGS,
  trashBlogs: [],
  notebooks: INITIAL_NOTEBOOKS,
  db01Columns: DB01_COLUMNS_DEFAULT,
  db02Columns: DB02_COLUMNS_DEFAULT,
  db03Columns: DB03_COLUMNS_DEFAULT,
  db10Columns: DB10_COLUMNS_DEFAULT,
  dbTitles: {
    db01: 'Title',
    db02: 'Character',
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
  const id = `TITLE-${String(state.products.length + 1).padStart(3, '0')}`
  const product: Product = {
    id,
    name: 'Untitled title',
    image: '',
    category: type.trim() || 'scenario',
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
  const id = `CHAR-${String(state.nutrients.length + 1).padStart(3, '0')}`
  const nutrient: Nutrient = {
    id,
    name: 'Untitled character',
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
