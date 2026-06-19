export type Tag = { type: 'product' | 'nutrient'; name: string }

export type Product = {
  id: string
  name: string
  image: string
  category: string
  description: string
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
  pages: NotebookPage[]
  createdAt: Date
  updatedAt: Date
}

export type NotebookPage = {
  id: string
  title: string
  body: string
  order: number
}

export type ScenarioBookCharacter = {
  id: string
  name: string
  role?: string
}

export type ScenarioBookTitle = {
  id: string
  title: string
}

export type ScenarioBookWord = {
  id: string
  titleId: string
  label: string
  content: string
  relationIds: string[]
}

export type ScenarioBookSnippetKind = 'term' | 'devTag' | 'prompt'

export type ScenarioBookSnippet = {
  id: string
  kind: ScenarioBookSnippetKind
  label: string
  content: string
}

export type ScenarioBookEvent = {
  id: string
  title: string
  body: string
  cover?: string
  coverType: 'none' | 'product' | 'upload'
  characters: ScenarioBookCharacter[]
  titleDb: ScenarioBookTitle[]
  wordDb: ScenarioBookWord[]
  recentWordIds: string[]
  fixedTags: string[]
  snippets: ScenarioBookSnippet[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type Page = 'memo' | 'upnote' | 'scenarioBook' | 'db01' | 'db02' | 'db03' | 'db10' | 'blog' | 'notebook' | 'trash' | 'gallery' | 'devstudio'
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
