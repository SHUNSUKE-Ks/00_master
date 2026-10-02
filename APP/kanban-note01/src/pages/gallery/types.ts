export type GalleryCategory = 'product' | 'nutrient' | 'reference' | 'other'
export type GallerySyncStatus = 'local' | 'queued' | 'syncing' | 'synced' | 'error' | 'disabled'
export type GalleryAssetStatus = 'localDraft' | 'cloudDraft' | 'active' | 'archived' | 'deleted' | 'error'

export const SYNC_STATUS_LABELS: Record<GallerySyncStatus, string> = {
  local: 'ローカル',
  queued: '同期待ち',
  syncing: '同期中',
  synced: '同期済み',
  error: '同期失敗',
  disabled: 'Firebase無効',
}

export const ASSET_STATUS_LABELS: Record<GalleryAssetStatus, string> = {
  localDraft: 'ローカル下書き',
  cloudDraft: 'クラウド下書き',
  active: '使用中',
  archived: '保管',
  deleted: '削除',
  error: '要確認',
}

export const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  product:   'Note',
  nutrient:  'Tag',
  reference: '参考資料',
  other:     'その他',
}

export const CATEGORY_BG: Record<GalleryCategory, string> = {
  product:   'bg-amber-100 text-amber-700',
  nutrient:  'bg-emerald-100 text-emerald-700',
  reference: 'bg-blue-100 text-blue-700',
  other:     'bg-gray-100 text-gray-600',
}

export const CATEGORY_ICON: Record<GalleryCategory, string> = {
  product:   '📦',
  nutrient:  '🌿',
  reference: '📋',
  other:     '📁',
}

/**
 * Gallery item — JSONに紐付くデータ構造
 *
 * filename  : 実ファイル名 (e.g. "vitamin_c_001.jpg")
 * label     : 表示名（日本語）
 * description : 説明文（任意）
 * tags      : タグ一覧
 * category  : カテゴリ区分
 * mimeType  : 画像形式 ("image/jpeg" etc.)
 * fileSize  : バイト数（任意）
 * width/height : 画像解像度 px（任意）
 * url       : 外部URL or public パス
 * storagePath : Firebase Storage上の保存パス（クラウド同期後）
 * downloadUrl : Firebase Storageの取得URL（クラウド同期後）
 * thumbnailPath : Firebase Storage上のサムネイルパス（クラウド同期後）
 * thumbnailUrl : サムネイルURL（クラウド同期後）
 * syncStatus / assetStatus : Firebase / AllAssets Hub同期状態
 * dataUrl   : Base64（アップロード済み画像）
 * isFavorite : お気に入りフラグ
 * createdAt / updatedAt : 日時
 */
export type GalleryItem = {
  id: string
  filename: string
  label: string
  description?: string
  tags: string[]
  category: GalleryCategory
  mimeType: string
  fileSize?: number
  width?: number
  height?: number
  url?: string
  storagePath?: string
  downloadUrl?: string
  thumbnailPath?: string
  thumbnailUrl?: string
  syncStatus?: GallerySyncStatus
  assetStatus?: GalleryAssetStatus
  syncError?: string
  syncedAt?: string
  lastSyncAttemptAt?: string
  dataUrl?: string
  isFavorite: boolean
  isDeleted?: boolean
  createdAt: Date
  updatedAt: Date
  // ↓ V2.1 ギャラリー（2026-09-28）: 作品・登場人物との結びつきと、小さなコメント。クラウドの JSON にも入る
  titleIds?: string[]
  /** 登場人物: "<作品ID>:<枠ID>"（名前を変えても崩れない） */
  characterRefs?: string[]
  comments?: GalleryComment[]
  /** 送った端末（android / pc など） */
  device?: string
}

/** 写真の小さなコメント（いくつでも） */
export type GalleryComment = { id: string; text: string; createdAt: string; device?: string }

export type GalleryView = 'grid' | 'list' | 'pinterest'
export type GallerySortBy = 'createdAt' | 'updatedAt' | 'label'
