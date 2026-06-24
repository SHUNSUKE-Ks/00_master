export type Tag = { type: 'product' | 'nutrient'; name: string }

export type Product = {
  id: string
  name: string
  image: string
  category: string
  description: string
  workState?: 'アイディア中' | '執筆中' | '納品候補' | '完了'
  headingRefNotebookId?: string
  headingRefPageId?: string
  headingRefMode?: 'md_heading' | 'stepper_heading' | 'manual'
  price: number
  volume: string
  symptoms: string[]
  effects: string[]
  ingredients: string[]
  nutrientIds: string[]
  memo: string
  createdAt?: Date
}

export type Nutrient = {
  id: string
  name: string
  description: string
  productIds: string[]
  memo: string
  createdAt?: Date
}

export type Symptom = {
  id: string
  name: string
  description: string
  productIds: string[]
  memo: string
  createdAt?: Date
}

export type Memo = {
  id?: string
  title: string
  body: string
  tags: Tag[]
  createdAt: Date
  updatedAt: Date
}

export type Blog = {
  id?: string
  title: string
  body: string
  cover?: string
  coverType: 'none' | 'product' | 'upload'
  categoryTags: Tag[]
  mode: 'memo' | 'published'
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type GalleryPhoto = {
  id?: string
  dataUrl: string
  name: string
  createdAt: Date
}

export type Notebook = {
  id?: string
  title: string
  cover?: string
  storyOnly?: boolean
  pages: NotebookPage[]
  createdAt: Date
  updatedAt: Date
}

export type NotebookPage = {
  id: string
  title: string
  body: string
  scenarioBody?: string
  scenarioLogs?: Record<string, string>
  characters?: PageCharacter[]
  syncStatus?: 'unsynced' | 'syncing' | 'synced' | 'error'
  firebaseDocId?: string
  syncedAt?: string
  syncError?: string
  sourcePath?: string
  order: number
}

export type PageCharacter = {
  id: string
  name: string
  dict: string
  prompt: string
  role: string
  note: string
}

export type InboxItem = {
  id: string
  subject: string
  body: string
  tag: string
  relatedIdea?: string
  status: 'inbox' | 'working' | 'done' | 'archived'
  syncStatus: 'unsynced' | 'syncing' | 'synced' | 'error'
  syncError?: string
  firebaseDocId?: string
  sourceView: Page
  sourceNotebookId?: string
  sourceNotebookTitle?: string
  sourcePageId?: string
  sourcePageTitle?: string
  createdAt: string
  updatedAt: string
}

export type Page = 'memo' | 'upnote' | 'db01' | 'db02' | 'db03' | 'db10' | 'blog' | 'study' | 'notebook' | 'inbox' | 'trash' | 'gallery' | 'devstudio'
export type BlogMode = 'memo' | 'view'
export type FontSize = 's' | 'm' | 'l' | 'xl'
export type FontSizePx = { s: 13; m: 16; l: 19; xl: 22 }
export type DbView = 'table' | 'detail' | 'index'

export type ColumnDef = {
  id: string
  label: string
  visible: boolean
  locked: boolean
}
