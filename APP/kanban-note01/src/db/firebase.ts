import { initializeApp } from 'firebase/app'
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
import type { Memo, Blog, Notebook, Product, Nutrient } from '../types'

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

const app = firebaseEnabled ? initializeApp(firebaseConfig) : null
export const firestore = app ? getFirestore(app) : null

function requireFirestore() {
  if (!firestore) throw new Error('Firebase is disabled. Local JSON/MD mode is active.')
  return firestore
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
