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
  mimeType?: string
  fileSize?: number
  width?: number
  height?: number
  storagePath?: string
  downloadUrl?: string
  thumbnailPath?: string
  thumbnailUrl?: string
  syncStatus?: 'local' | 'queued' | 'syncing' | 'synced' | 'error' | 'disabled'
  assetStatus?: 'localDraft' | 'cloudDraft' | 'active' | 'archived' | 'deleted' | 'error'
  syncError?: string
  syncedAt?: string
  lastSyncAttemptAt?: string
}

/** WW（World Word）の1件。名前と Dict（読み・説明）だけでもよい */
export type WwKind = 'item' | 'weapon' | 'skill' | 'term'
export type WwEntry = { id: string; kind: WwKind; name: string; dict?: string }

/**
 * プロットのフローチャート（note_story.plot.v0.1）。章 → 場所（Scene）→ 一行プロット。
 * 資料はパスを写さず、種類つきの参照で持つ: page:<作品ID>/<場面ID>・draft:<ID>・ww:<ID>・url:<URL>・file:<PCのパス>
 * ゲームの進行フロー（将来の別ボード）とは分けて持つ。
 */
export type PlotRef = { ref: string; label?: string; schema?: string }
export type PlotSlots = { pages: PlotRef[]; drafts: PlotRef[]; materials: PlotRef[] }
export type PlotNode = { id: string; type: 'plot'; text: string; required: boolean; slots: PlotSlots }
export type PlotChart = { id: string; place: string; nodes: PlotNode[] }
export type PlotRoll = { id: string; title: string; charts: PlotChart[] }
export type PlotFlow = { schema: 'note_story.plot.v0.1'; rolls: PlotRoll[] }

/**
 * Sceneスロット（2026-09-28）。作品ごとに、ギャラリーの写真を Scene として並べる。9つで1パレット（テンキーの1〜9）。
 * 写真の無いスロット（ラベルだけ）は絵の発注で、発注リストに出る。絵ができたらギャラリーから納品する（photoId が入る）。
 */
export type ImageOrder = {
  /** 納品先（作品名／パレット・番号） */
  deliverTo: string
  /** どんな絵か */
  note?: string
  /** 画像を作る担当（例: codex）。プロンプト辞書ができたら使う */
  agent?: string
  /** カメラアングル（正面・あおり・俯瞰など） */
  camera?: string
  status: 'open' | 'delivered'
  requestedAt: string
  deliveredAt?: string
}
export type SceneSlot = { id: string; title: string; photoId?: string; order?: ImageOrder; createdAt: string }

export type Notebook = {
  id?: string
  title: string
  cover?: string
  favorite?: boolean
  storyOnly?: boolean
  /** V2.1: 作品のあらすじ（タイトル一覧・ホームに出す） */
  synopsis?: string
  /** V2.1: 作品の登場人物。並び順＝Alt+番号＝KeyDeckのボタン番号 */
  cast?: PageCharacter[]
  /** V2.1: 作品で作ったSceneタグ（会話ログのフッター。本文の `柱：` と合わせて候補にする） */
  sceneTags?: string[]
  /** V2.1: 副題（第一章「…」など） */
  subtitle?: string
  /** V2.1: 納品パッケージから取り込んだときの packageId（二重取り込みを防ぐ） */
  deliveryId?: string
  /** V2.1: 納品された素材（背景・立ち絵・小物）。path は public 配下のURL */
  assets?: Array<{ id: string; kind: 'background' | 'character' | 'enemy' | 'item'; label: string; note?: string; path: string; focusX?: string | null; focusY?: string | null }>
  /** V2.1: WW（World Word＝世界観の用語）。アイテム・武器・スキルなどを作品ごとに登録する（2026-09-28） */
  ww?: WwEntry[]
  /** V2.1: プロットのフローチャート（一行プロットを縦につなぎ、場面・下書き・資料をスロットに付ける）。進行フローとは別（2026-09-28） */
  plotFlow?: PlotFlow
  /**
   * V2.1: 種類（2026-09-28）。無し＝Title（作品）。event＝イベント（作品ページと同じ中身を持ち、Title タグで Title に付く）
   */
  kind?: 'title' | 'event'
  /** V2.1: Event の Title タグ（どの Title の話か） */
  titleIds?: string[]
  /** V2.1: Event の Character タグ（"<TitleのID>:<枠ID>"） */
  characterRefs?: string[]
  /** V2.1: ごみ箱に入れた時刻（ある＝ごみ箱。一覧に出さない。戻せる） */
  trashedAt?: string
  /** V2.1: 非表示（アーカイブ）にした時刻。一覧に出さないが、「非表示」から見られ、戻せる */
  archivedAt?: string
  /** V2.1: 一覧の並び（編集で並べ替えた順。無い物は更新の新しい順で後ろ） */
  listOrder?: number
  /** V2.1: 受信箱（外から届いたシナリオ）から取り込んだ packageId（二重取り込みを防ぐ） */
  inboxIds?: string[]
  /** V2.1: Sceneスロット（ギャラリーの写真を Scene として9つずつのパレットに並べる。写真なし＝絵の発注）（2026-09-28） */
  sceneSlots?: SceneSlot[]
  pages: NotebookPage[]
  createdAt: Date
  updatedAt: Date
}

export type NotebookPage = {
  id: string
  title: string
  body: string
  favorite?: boolean
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
  /** V2.1: 立ち絵のURL（納品された絵など） */
  portrait?: string
  /** V2.1: 立ち絵を小さく切り抜くときの位置（CSS の object-position。例 '28%' '10%'） */
  focusX?: string
  focusY?: string
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

export type Page = 'memo' | 'upnote' | 'db01' | 'db02' | 'db03' | 'db10' | 'assetTags' | 'blog' | 'study' | 'notebook' | 'inbox' | 'trash' | 'gallery' | 'devstudio' | 'claudenote' | 'talklog'
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
