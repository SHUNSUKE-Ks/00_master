import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { GalleryItem, GalleryCategory, GalleryAssetStatus, GallerySyncStatus, GalleryComment } from '../pages/gallery/types'
import { ensureAnonymousUser, firebaseEnabled, firestore, storage } from '../db/firebase'

export type AllAssetsCategory =
  | 'background'
  | 'character'
  | 'face_icon'
  | 'ui'
  | 'sprite'
  | 'item'
  | 'effect'
  | 'audio'
  | 'reference'
  | 'document'
  | 'other'

export type GalleryAssetDraft = {
  id: string
  label: string
  filename: string
  category: AllAssetsCategory
  assetTagIds: string[]
  titleTagIds: string[]
  usageScopes: string[]
  tags: string[]
  storagePath: string | null
  downloadUrl: string | null
  thumbnailPath: string | null
  thumbnailUrl: string | null
  mimeType: string
  fileSize: number | null
  width: number | null
  height: number | null
  assetStatus: 'localDraft' | 'cloudDraft' | 'active' | 'archived' | 'deleted' | 'error'
  syncStatus: 'local' | 'queued' | 'syncing' | 'synced' | 'error' | 'disabled'
  ownerId: string | null
  visibility: 'private' | 'shared' | 'public'
  published: boolean
  createdByApp: string
  favorite: boolean
  source: {
    appId: string
    sourceType: string | null
    localId: string | null
    device: string | null
    sourceUrl: string | null
    prompt: string | null
    importedAt: string | null
  }
  intake: {
    status: 'new' | 'classifying' | 'accepted' | 'rejected' | 'duplicate' | 'needs_metadata'
    memo: string
    checkedAt: string | null
  }
  relation: {
    noteIds: string[]
    blogIds: string[]
    titleIds: string[]
    studioIds: string[]
    scenarioIds: string[]
    usageIds: string[]
  }
  sync: {
    syncedAt: string | null
    lastAttemptAt: string | null
    retryCount: number
    errorCode: string | null
    errorMessage: string | null
  }
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  // ↓ V2.1 ギャラリー（2026-09-28）: 登場人物（"<作品ID>:<枠ID>"）と小さなコメント
  characterRefs?: string[]
  comments?: GalleryComment[]
}

type ConvertOptions = {
  assetId?: string
  device?: string
  sourceType?: string
}

const GALLERY_ASSETS_COLLECTION = import.meta.env.VITE_GALLERY_ASSETS_COLLECTION || 'galleryAssets'

function toIso(input: Date | string): string {
  return new Date(input).toISOString()
}

function detectDevice(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  return /Android/i.test(navigator.userAgent) ? 'android' : 'pc'
}

function mapGalleryCategory(category: GalleryCategory): AllAssetsCategory {
  if (category === 'reference') return 'reference'
  if (category === 'other') return 'other'
  return 'document'
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (Number.isFinite(date.getTime())) return date
  }
  return new Date()
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T
}

export function toAllAssetsGalleryAsset(item: GalleryItem, options: ConvertOptions = {}): GalleryAssetDraft {
  const now = new Date().toISOString()
  const storagePath = item.storagePath ?? null
  const downloadUrl = item.downloadUrl ?? item.url ?? null
  const thumbnailPath = item.thumbnailPath ?? null
  const thumbnailUrl = item.thumbnailUrl ?? null
  const syncStatus = item.syncStatus ?? (storagePath ? 'synced' : firebaseEnabled ? 'queued' : 'disabled')
  const assetStatus = item.assetStatus ?? (item.isDeleted ? 'deleted' : storagePath ? 'cloudDraft' : 'localDraft')

  return {
    id: options.assetId ?? item.id,
    label: item.label,
    filename: item.filename,
    category: mapGalleryCategory(item.category),
    assetTagIds: [],
    titleTagIds: [],
    usageScopes: ['AllAssetHub', 'Note'],
    tags: item.tags,
    storagePath,
    downloadUrl,
    thumbnailPath,
    thumbnailUrl,
    mimeType: item.mimeType,
    fileSize: item.fileSize ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    assetStatus,
    syncStatus,
    ownerId: null,
    visibility: 'private',
    published: false,
    createdByApp: 'note_story',
    favorite: item.isFavorite,
    source: {
      appId: 'note_story',
      sourceType: options.sourceType ?? 'gallery_upload',
      localId: item.id,
      device: options.device ?? detectDevice(),
      sourceUrl: item.downloadUrl ?? item.url ?? null,
      prompt: null,
      importedAt: now,
    },
    intake: {
      status: 'new',
      memo: item.description ?? '',
      checkedAt: null,
    },
    relation: {
      noteIds: [],
      blogIds: [],
      titleIds: item.titleIds ?? [],
      studioIds: [],
      scenarioIds: [],
      usageIds: [],
    },
    sync: {
      syncedAt: item.syncedAt ?? (storagePath ? now : null),
      lastAttemptAt: item.lastSyncAttemptAt ?? null,
      retryCount: 0,
      errorCode: null,
      errorMessage: item.syncError ?? null,
    },
    createdAt: toIso(item.createdAt),
    updatedAt: toIso(item.updatedAt),
    deletedAt: item.isDeleted ? now : null,
    characterRefs: item.characterRefs ?? [],
    comments: item.comments ?? [],
  }
}

export function galleryAssetToGalleryItem(asset: GalleryAssetDraft): GalleryItem {
  return {
    id: asset.id,
    filename: asset.filename,
    label: asset.label,
    description: asset.intake.memo || undefined,
    tags: asset.tags,
    category: asset.category === 'reference' ? 'reference' : 'other',
    mimeType: asset.mimeType,
    fileSize: asset.fileSize ?? undefined,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    url: asset.downloadUrl ?? undefined,
    storagePath: asset.storagePath ?? undefined,
    downloadUrl: asset.downloadUrl ?? undefined,
    thumbnailPath: asset.thumbnailPath ?? undefined,
    thumbnailUrl: asset.thumbnailUrl ?? undefined,
    syncStatus: asset.syncStatus as GallerySyncStatus,
    assetStatus: asset.assetStatus as GalleryAssetStatus,
    syncError: asset.sync.errorMessage ?? undefined,
    syncedAt: asset.sync.syncedAt ?? undefined,
    lastSyncAttemptAt: asset.sync.lastAttemptAt ?? undefined,
    isFavorite: asset.favorite,
    // V2.1 の写真は assetStatus を持ったまま deletedAt でごみ箱を表す
    isDeleted: asset.assetStatus === 'deleted' || !!asset.deletedAt,
    createdAt: parseDate(asset.createdAt),
    updatedAt: parseDate(asset.updatedAt),
    titleIds: asset.relation?.titleIds ?? [],
    characterRefs: asset.characterRefs ?? [],
    comments: asset.comments ?? [],
    device: asset.source?.device ?? undefined,
  }
}

/** 写真の情報（名前・タグ・作品・登場人物・コメント・お気に入り・ごみ箱）だけをクラウドの JSON に書く（画像はそのまま） */
export async function saveGalleryItemMeta(item: GalleryItem): Promise<void> {
  await saveGalleryAssetDraft(toAllAssetsGalleryAsset(item, { device: item.device }))
}

export async function uploadGalleryAssetFile(file: File, assetId: string): Promise<{
  storagePath: string
  downloadUrl: string
  thumbnailPath: string | null
  thumbnailUrl: string | null
}> {
  if (!firebaseEnabled || !storage) {
    throw new Error('Firebase Storage is disabled.')
  }

  await ensureAnonymousUser()
  const safeName = file.name.replace(/[^\w.\-]+/g, '_')
  const storagePath = `galleryAssets/${assetId}/original/${safeName}`
  const fileRef = ref(storage, storagePath)
  await uploadBytes(fileRef, file, { contentType: file.type })
  const downloadUrl = await getDownloadURL(fileRef)

  return {
    storagePath,
    downloadUrl,
    thumbnailPath: null,
    thumbnailUrl: null,
  }
}

export async function saveGalleryAssetDraft(asset: GalleryAssetDraft): Promise<GalleryAssetDraft> {
  if (!firebaseEnabled || !firestore) {
    throw new Error('Firebase Firestore is disabled.')
  }

  await ensureAnonymousUser()
  await setDoc(
    doc(firestore, GALLERY_ASSETS_COLLECTION, asset.id),
    stripUndefined(asset as unknown as Record<string, unknown>),
    { merge: true },
  )
  return asset
}

export async function fetchGalleryAssetDrafts(): Promise<GalleryAssetDraft[]> {
  if (!firebaseEnabled || !firestore) {
    console.log('[APP04-FIREBASE-GALLERY] 6-4 Gallery asset fetch skipped', {
      reason: 'firebase-disabled',
    })
    return []
  }

  await ensureAnonymousUser()
  const snap = await getDocs(collection(firestore, GALLERY_ASSETS_COLLECTION))
  return snap.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as GalleryAssetDraft)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

export async function syncGalleryItemToFirebase(item: GalleryItem, file?: File): Promise<GalleryAssetDraft> {
  const baseAsset = toAllAssetsGalleryAsset({
    ...item,
    syncStatus: 'syncing',
    assetStatus: item.assetStatus ?? 'localDraft',
    lastSyncAttemptAt: new Date().toISOString(),
  })

  try {
    const uploaded = file ? await uploadGalleryAssetFile(file, baseAsset.id) : null
    const syncedAt = new Date().toISOString()
    const asset: GalleryAssetDraft = {
      ...baseAsset,
      storagePath: uploaded?.storagePath ?? baseAsset.storagePath,
      downloadUrl: uploaded?.downloadUrl ?? baseAsset.downloadUrl,
      thumbnailPath: uploaded?.thumbnailPath ?? baseAsset.thumbnailPath,
      thumbnailUrl: uploaded?.thumbnailUrl ?? baseAsset.thumbnailUrl,
      assetStatus: 'cloudDraft',
      syncStatus: 'synced',
      sync: {
        ...baseAsset.sync,
        syncedAt,
        lastAttemptAt: syncedAt,
      },
      updatedAt: syncedAt,
    }
    return saveGalleryAssetDraft(asset)
  } catch (error) {
    const failedAt = new Date().toISOString()
    const asset: GalleryAssetDraft = {
      ...baseAsset,
      syncStatus: 'error',
      sync: {
        ...baseAsset.sync,
        lastAttemptAt: failedAt,
        retryCount: baseAsset.sync.retryCount + 1,
        errorCode: error instanceof Error ? error.name : 'unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      updatedAt: failedAt,
    }
    if (firebaseEnabled && firestore) {
      await saveGalleryAssetDraft(asset)
    }
    throw error
  }
}
