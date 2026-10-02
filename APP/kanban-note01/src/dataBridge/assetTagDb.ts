export type AssetTagScope = 'Gallery' | 'Note' | 'NovelEngine' | 'AllAssetHub' | 'GameLab' | 'GameHub' | 'BlogCover'
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

export const ASSET_TAG_SCOPES: AssetTagScope[] = ['Gallery', 'Note', 'NovelEngine', 'AllAssetHub', 'GameLab', 'GameHub', 'BlogCover']

const SEED_TAGS: AssetTag[] = [
  {
    id: 'char-standing',
    labelJa: '立ち絵',
    labelEn: 'character-standing',
    group: 'Character',
    scopes: ['Gallery', 'Note', 'NovelEngine', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: 'ノベルゲームの会話画面で使う人物立ち絵。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'char-face-icon',
    labelJa: '顔アイコン',
    labelEn: 'character-face-icon',
    group: 'Character',
    scopes: ['Gallery', 'NovelEngine', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: '会話ログ、セリフ枠、キャラクターDBで使う顔アイコン素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'bg-room',
    labelJa: '室内背景',
    labelEn: 'background-room',
    group: 'Background',
    scopes: ['Gallery', 'NovelEngine', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: '部屋、拠点、研究室などの背景素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'bg-field',
    labelJa: '屋外背景',
    labelEn: 'background-field',
    group: 'Background',
    scopes: ['Gallery', 'NovelEngine', 'AllAssetHub', 'GameLab', 'GameHub'],
    status: 'active',
    description: '森、街、村、城、戦場などの屋外背景素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'sprite-walk',
    labelJa: '歩行スプライト',
    labelEn: 'sprite-walk',
    group: 'Sprite',
    scopes: ['Gallery', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: 'マップやSRPG画面で使う歩行・待機スプライト。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'sprite-battle',
    labelJa: '戦闘スプライト',
    labelEn: 'sprite-battle',
    group: 'Sprite',
    scopes: ['Gallery', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: 'BattleEngineやSRPG戦闘画面で使う攻撃・被弾・待機スプライト。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'ui-panel',
    labelJa: '操作パネル',
    labelEn: 'ui-panel',
    group: 'UI',
    scopes: ['Gallery', 'NovelEngine', 'AllAssetHub', 'GameLab', 'GameHub'],
    status: 'active',
    description: 'ゲーム画面、選択肢、設定、HUDのUI素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'ui-button',
    labelJa: 'ボタンUI',
    labelEn: 'ui-button',
    group: 'UI',
    scopes: ['Gallery', 'AllAssetHub', 'GameLab', 'GameHub'],
    status: 'active',
    description: 'ゲーム開始、選択肢、設定、保存などで使うボタン素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'ui-dialog',
    labelJa: '会話UI',
    labelEn: 'ui-dialog',
    group: 'UI',
    scopes: ['Gallery', 'NovelEngine', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: '名前欄、会話本文、ログ、Auto、Skipなどの会話画面UI。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'ui-hud',
    labelJa: 'HUD',
    labelEn: 'ui-hud',
    group: 'UI',
    scopes: ['Gallery', 'AllAssetHub', 'GameLab', 'GameHub'],
    status: 'active',
    description: 'HP、ステータス、ミニマップ、コマンドなどの画面常駐UI。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'item-icon',
    labelJa: 'アイテムアイコン',
    labelEn: 'item-icon',
    group: 'Item',
    scopes: ['Gallery', 'AllAssetHub', 'GameLab', 'GameHub'],
    status: 'active',
    description: '装備、素材、報酬、消耗品などのアイコン素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'effect-fx',
    labelJa: 'エフェクト',
    labelEn: 'effect-fx',
    group: 'Effect',
    scopes: ['Gallery', 'NovelEngine', 'AllAssetHub', 'GameLab'],
    status: 'active',
    description: '発光、霧、雨、斬撃、魔法などの演出素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'blog-cover',
    labelJa: 'ブログ表紙',
    labelEn: 'blog-cover',
    group: 'Publish',
    scopes: ['Gallery', 'Note', 'AllAssetHub', 'BlogCover', 'GameHub'],
    status: 'active',
    description: 'Blog、制作日記、作品紹介ページの表紙に使う素材。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'title-thumbnail',
    labelJa: '作品サムネイル',
    labelEn: 'title-thumbnail',
    group: 'Publish',
    scopes: ['Gallery', 'AllAssetHub', 'GameLab', 'GameHub'],
    status: 'active',
    description: 'GameHub作品一覧、作品詳細、SNS共有で使うタイトルサムネイル。',
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'prompt-ref',
    labelJa: 'プロンプト参照',
    labelEn: 'prompt-reference',
    group: 'PromptRef',
    scopes: ['Gallery', 'Note', 'AllAssetHub'],
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

function mergeSeedTags(tags: AssetTag[]): AssetTag[] {
  const existingIds = new Set(tags.map((tag) => tag.id))
  const missing = SEED_TAGS.filter((tag) => !existingIds.has(tag.id))
  return missing.length ? [...tags, ...missing] : tags
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
    const merged = mergeSeedTags(parsed.map(normalizeTag))
    if (merged.length !== parsed.length) saveAssetTags(merged)
    return merged
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
