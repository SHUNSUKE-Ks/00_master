export type AssetTagScope = 'Gallery' | 'Note' | 'NovelEngine'
export type AssetTagStatus = 'active' | 'review' | 'hidden'

export type AssetTag = {
  id: string
  labelJa: string
  labelEn: string
  group: string
  scopes: AssetTagScope[]
  status: AssetTagStatus
  description: string
  createdAt: string
  updatedAt: string
}

export const ASSET_TAG_DB_KEY = 'note-story-asset-tag-db-v1'

export const ASSET_TAG_SCOPES: AssetTagScope[] = ['Gallery', 'Note', 'NovelEngine']

const SEED_TAGS: AssetTag[] = [
  {
    id: 'char-standing',
    labelJa: '立ち絵',
    labelEn: 'character-standing',
    group: 'Character',
    scopes: ['Gallery', 'Note', 'NovelEngine'],
    status: 'active',
    description: 'ノベルゲームの会話画面で使う人物立ち絵。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'bg-room',
    labelJa: '室内背景',
    labelEn: 'background-room',
    group: 'Background',
    scopes: ['Gallery', 'NovelEngine'],
    status: 'active',
    description: '部屋、拠点、研究室などの背景素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'ui-panel',
    labelJa: '操作パネル',
    labelEn: 'ui-panel',
    group: 'UI',
    scopes: ['Gallery', 'NovelEngine'],
    status: 'active',
    description: 'ゲーム画面、選択肢、設定、HUDのUI素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'prompt-ref',
    labelJa: 'プロンプト参照',
    labelEn: 'prompt-reference',
    group: 'PromptRef',
    scopes: ['Gallery', 'Note'],
    status: 'review',
    description: '生成プロンプトや参照元URLを後で見るための整理タグ。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'old-sketch',
    labelJa: '旧スケッチ',
    labelEn: 'legacy-sketch',
    group: 'Review',
    scopes: ['Gallery'],
    status: 'hidden',
    description: '旧タグから移行中。必要な素材だけ新タグへ移す。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
]

function normalizeTag(tag: Partial<AssetTag>, index: number): AssetTag {
  const now = new Date().toISOString()
  return {
    id: tag.id || `asset-tag-${Date.now()}-${index}`,
    labelJa: tag.labelJa || '新規タグ',
    labelEn: tag.labelEn || 'new-asset-tag',
    group: tag.group || 'Draft',
    scopes: tag.scopes?.length ? tag.scopes : ['Gallery'],
    status: tag.status || 'review',
    description: tag.description || '',
    createdAt: tag.createdAt || now,
    updatedAt: tag.updatedAt || now,
  }
}

export function loadAssetTags(): AssetTag[] {
  if (typeof window === 'undefined') return SEED_TAGS
  try {
    const raw = localStorage.getItem(ASSET_TAG_DB_KEY)
    if (!raw) {
      saveAssetTags(SEED_TAGS)
      return SEED_TAGS
    }
    const parsed = JSON.parse(raw) as Partial<AssetTag>[]
    return parsed.map(normalizeTag)
  } catch (error) {
    console.warn('[APP04-ASSETTAGDB] load failed', error)
    return SEED_TAGS
  }
}

export function saveAssetTags(tags: AssetTag[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ASSET_TAG_DB_KEY, JSON.stringify(tags))
}

export function createDraftAssetTag(): AssetTag {
  const now = new Date().toISOString()
  return {
    id: `asset-tag-${Date.now()}`,
    labelJa: '新規タグ',
    labelEn: 'new-asset-tag',
    group: 'Draft',
    scopes: ['Gallery'],
    status: 'review',
    description: '用途を確認してからGallery / Note / NovelEngineへ割り当てる。',
    createdAt: now,
    updatedAt: now,
  }
}

export function downloadAssetTagJson(tags: AssetTag[]) {
  if (typeof document === 'undefined') return
  const payload = {
    schema: 'kanban-note01.asset_tag_db.v0_1',
    exportedAt: new Date().toISOString(),
    tags,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `asset-tag-db-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
