import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import type { Memo, Blog, Notebook, Product, Nutrient, Page } from '../types'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled =
  import.meta.env.VITE_ENABLE_FIREBASE === 'true' &&
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)

export const firebaseConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)

export const kanbanMemoInboxEnabled =
  import.meta.env.VITE_ENABLE_KANBAN_MEMO_SYNC === 'true' && firebaseConfigured

const app = firebaseEnabled || kanbanMemoInboxEnabled ? initializeApp(firebaseConfig) : null
export const firestore = app ? getFirestore(app) : null
const auth = app ? getAuth(app) : null

function requireFirestore() {
  if (!firestore) throw new Error('Firebase is disabled. Local JSON/MD mode is active.')
  return firestore
}

async function ensureAnonymousUser() {
  if (!auth) throw new Error('Firebase auth is disabled.')
  if (auth.currentUser) return auth.currentUser
  const credential = await signInAnonymously(auth)
  return credential.user
}

function fromFs(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data }
  for (const key of ['createdAt', 'updatedAt', 'deletedAt']) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate()
  }
  return out
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

// ── Memos ────────────────────────────────────────────────────────────────────

export async function fetchMemos(): Promise<Memo[]> {
  const db = requireFirestore()
  const q = query(collection(db, 'memos'), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...fromFs(d.data()) } as Memo))
}

export async function addMemoFs(memo: Omit<Memo, 'id'>): Promise<string> {
  const db = requireFirestore()
  const ref = await addDoc(collection(db, 'memos'), stripUndefined(memo as Record<string, unknown>))
  return ref.id
}

export async function updateMemoFs(id: string, patch: Partial<Omit<Memo, 'id'>>): Promise<void> {
  const db = requireFirestore()
  await updateDoc(doc(db, 'memos', id), stripUndefined(patch as Record<string, unknown>))
}

export async function deleteMemoFs(id: string): Promise<void> {
  const db = requireFirestore()
  await deleteDoc(doc(db, 'memos', id))
}

// ── Kanban MemoInbox bridge ──────────────────────────────────────────────────

type KanbanMemoArchiveItem = {
  id: string
  title: string
  body: string
  status: 'consult'
  createdAt: string
  updatedAt: string
  source: 'kanban-note01'
  sourceMemoId?: string
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
  sourceFileName?: string
}

export type KanbanMemoSourceMeta = {
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
  sourceFileName?: string
}

export type ScenarioFragmentStatus = 'inbox' | 'converted' | 'accepted' | 'needs_fix' | 'rejected'

export type ScenarioFragmentInput = {
  title: string
  body: string
  tags?: string[]
  sourceMemoId?: string
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
  sourceFileName?: string
  targetTitleId?: string
  targetTitle?: string
}

export type ScenarioFragmentItem = {
  id: string
  type: 'scenario_fragment'
  source: 'kanban-note01'
  target: 'novelEngine'
  format: 'conversation_log_v0_1'
  title: string
  body: string
  tags: string[]
  status: ScenarioFragmentStatus
  createdAt: string
  updatedAt: string
  sourceMemoId?: string
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
  sourceFileName?: string
  targetTitleId?: string
  targetTitle?: string
}

export type IdeaInboxInput = {
  id?: string
  subject: string
  body: string
  tag?: string
  relatedIdea?: string
  sourceView?: Page
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
}

export type IdeaInboxItem = {
  id: string
  type: 'idea_inbox'
  source: 'kanban-note01'
  target: 'note_inbox'
  subject: string
  body: string
  tag: string
  relatedIdea?: string
  sourceView?: Page
  status: 'inbox'
  createdAt: string
  updatedAt: string
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
}

const KANBAN_MEMO_COLLECTION = import.meta.env.VITE_KANBAN_MEMO_COLLECTION || 'memoArchive'

export async function sendMemoToKanbanMemoInbox(memo: Memo, meta: KanbanMemoSourceMeta = {}): Promise<KanbanMemoArchiveItem> {
  if (!kanbanMemoInboxEnabled) {
    throw new Error('Kanban MemoInbox sync is disabled. Set VITE_ENABLE_KANBAN_MEMO_SYNC=true.')
  }
  const db = requireFirestore()
  await ensureAnonymousUser()

  const now = new Date().toISOString()
  const item: KanbanMemoArchiveItem = {
    id: `knote_${Date.now()}`,
    title: memo.title?.trim() || 'Kanban Note memo',
    body: memo.body?.trim() || '',
    status: 'consult',
    createdAt: now,
    updatedAt: now,
    source: 'kanban-note01',
    sourceMemoId: memo.id,
    sourceNotebookId: meta.sourceNotebookId,
    sourceNotebookTitle: meta.sourceNotebookTitle,
    sourcePageId: meta.sourcePageId,
    sourcePageTitle: meta.sourcePageTitle,
    sourceFileName: meta.sourceFileName,
  }
  await setDoc(doc(db, KANBAN_MEMO_COLLECTION, item.id), stripUndefined(item as unknown as Record<string, unknown>))
  return item
}

export async function sendScenarioFragmentToDevStudio(input: ScenarioFragmentInput): Promise<ScenarioFragmentItem> {
  if (!kanbanMemoInboxEnabled) {
    throw new Error('Kanban MemoInbox sync is disabled. Set VITE_ENABLE_KANBAN_MEMO_SYNC=true.')
  }
  const db = requireFirestore()
  await ensureAnonymousUser()

  const now = new Date().toISOString()
  const tags = Array.from(new Set(['scenario', 'conversation_log', ...(input.tags ?? [])].filter(Boolean)))
  const item: ScenarioFragmentItem = {
    id: `scenario_fragment_${Date.now()}`,
    type: 'scenario_fragment',
    source: 'kanban-note01',
    target: 'novelEngine',
    format: 'conversation_log_v0_1',
    title: input.title?.trim() || 'scenario fragment',
    body: input.body?.trim() || '',
    tags,
    status: 'inbox',
    createdAt: now,
    updatedAt: now,
    sourceMemoId: input.sourceMemoId,
    sourceNotebookId: input.sourceNotebookId,
    sourceNotebookTitle: input.sourceNotebookTitle,
    sourcePageId: input.sourcePageId,
    sourcePageTitle: input.sourcePageTitle,
    sourceFileName: input.sourceFileName,
    targetTitleId: input.targetTitleId,
    targetTitle: input.targetTitle,
  }
  await setDoc(doc(db, KANBAN_MEMO_COLLECTION, item.id), stripUndefined(item as unknown as Record<string, unknown>))
  return item
}

export async function sendIdeaInboxToFirebase(input: IdeaInboxInput): Promise<IdeaInboxItem> {
  if (!kanbanMemoInboxEnabled) {
    throw new Error('Kanban MemoInbox sync is disabled. Set VITE_ENABLE_KANBAN_MEMO_SYNC=true.')
  }
  const db = requireFirestore()
  await ensureAnonymousUser()

  const now = new Date().toISOString()
  const id = input.id?.trim() || `idea_inbox_${Date.now()}`
  const item: IdeaInboxItem = {
    id,
    type: 'idea_inbox',
    source: 'kanban-note01',
    target: 'note_inbox',
    subject: input.subject?.trim() || 'No subject',
    body: input.body?.trim() || '',
    tag: input.tag?.trim() || '未分類',
    relatedIdea: input.relatedIdea?.trim() || undefined,
    sourceView: input.sourceView,
    status: 'inbox',
    createdAt: now,
    updatedAt: now,
    sourceNotebookId: input.sourceNotebookId,
    sourceNotebookTitle: input.sourceNotebookTitle,
    sourcePageId: input.sourcePageId,
    sourcePageTitle: input.sourcePageTitle,
  }
  await setDoc(doc(db, KANBAN_MEMO_COLLECTION, item.id), stripUndefined(item as unknown as Record<string, unknown>), { merge: true })
  return item
}

export async function fetchIdeaInboxItems(): Promise<IdeaInboxItem[]> {
  const db = requireFirestore()
  await ensureAnonymousUser()
  const snap = await getDocs(collection(db, KANBAN_MEMO_COLLECTION))
  return snap.docs
    .map((entry) => ({ id: entry.id, ...fromFs(entry.data()) } as IdeaInboxItem))
    .filter((item) => item.type === 'idea_inbox')
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

// ── Blogs ────────────────────────────────────────────────────────────────────

export async function fetchBlogs(): Promise<Blog[]> {
  const db = requireFirestore()
  const q = query(collection(db, 'blogs'), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...fromFs(d.data()) } as Blog))
}

export async function addBlogFs(blog: Omit<Blog, 'id'>): Promise<string> {
  const db = requireFirestore()
  const ref = await addDoc(collection(db, 'blogs'), stripUndefined(blog as Record<string, unknown>))
  return ref.id
}

export async function updateBlogFs(id: string, patch: Partial<Omit<Blog, 'id'>>): Promise<void> {
  const db = requireFirestore()
  await updateDoc(doc(db, 'blogs', id), stripUndefined(patch as Record<string, unknown>))
}

export async function restoreBlogFs(id: string): Promise<void> {
  const db = requireFirestore()
  await updateDoc(doc(db, 'blogs', id), { deletedAt: deleteField() })
}

export async function deleteBlogFs(id: string): Promise<void> {
  const db = requireFirestore()
  await deleteDoc(doc(db, 'blogs', id))
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const db = requireFirestore()
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map((d) => ({ id: d.id, ...fromFs(d.data() as Record<string, unknown>) } as unknown as Product))
}

export async function updateProductFs(id: string, patch: Partial<Product>): Promise<void> {
  const db = requireFirestore()
  await setDoc(doc(db, 'products', id), stripUndefined(patch as Record<string, unknown>), { merge: true })
}

export async function seedProductsFs(products: Product[]): Promise<void> {
  const db = requireFirestore()
  await Promise.all(
    products.map(({ id, ...data }) =>
      setDoc(doc(db, 'products', id), stripUndefined(data as Record<string, unknown>))
    )
  )
}

// ── Nutrients ─────────────────────────────────────────────────────────────────

export async function fetchNutrients(): Promise<Nutrient[]> {
  const db = requireFirestore()
  const snap = await getDocs(collection(db, 'nutrients'))
  return snap.docs.map((d) => ({ id: d.id, ...fromFs(d.data() as Record<string, unknown>) } as unknown as Nutrient))
}

export async function updateNutrientFs(id: string, patch: Partial<Nutrient>): Promise<void> {
  const db = requireFirestore()
  await setDoc(doc(db, 'nutrients', id), stripUndefined(patch as Record<string, unknown>), { merge: true })
}

export async function seedNutrientsFs(nutrients: Nutrient[]): Promise<void> {
  const db = requireFirestore()
  await Promise.all(
    nutrients.map(({ id, ...data }) =>
      setDoc(doc(db, 'nutrients', id), stripUndefined(data as Record<string, unknown>))
    )
  )
}

// ── Notebooks ────────────────────────────────────────────────────────────────

export async function fetchNotebooks(): Promise<Notebook[]> {
  const db = requireFirestore()
  const q = query(collection(db, 'notebooks'), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...fromFs(d.data()) } as Notebook))
}

export async function addNotebookFs(notebook: Omit<Notebook, 'id'>): Promise<string> {
  const db = requireFirestore()
  const ref = await addDoc(collection(db, 'notebooks'), stripUndefined(notebook as Record<string, unknown>))
  return ref.id
}

export async function updateNotebookFs(id: string, patch: Partial<Omit<Notebook, 'id'>>): Promise<void> {
  const db = requireFirestore()
  await updateDoc(doc(db, 'notebooks', id), stripUndefined(patch as Record<string, unknown>))
}

export async function deleteNotebookFs(id: string): Promise<void> {
  const db = requireFirestore()
  await deleteDoc(doc(db, 'notebooks', id))
}
