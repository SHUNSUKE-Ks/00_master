import { createStore } from 'solid-js/store'
import type { GalleryItem, GalleryView, GallerySortBy, GalleryCategory } from './types'
import { GALLERY_SAMPLE } from './data'
import type { GalleryPhoto } from '../../types'
import {
  addLocalGalleryPhoto,
  deleteLocalGalleryPhoto,
  fileToLocalGalleryPhoto,
  loadLocalGalleryPhotos,
  updateLocalGalleryPhoto,
} from '../../dataBridge/localGallery'
import { firebaseEnabled } from '../../db/firebase'
import { fetchGalleryAssetDrafts, galleryAssetToGalleryItem, syncGalleryItemToFirebase } from '../../dataBridge/firebaseGallery'

type GalleryLocalState = {
  items: GalleryItem[]
  masterTags: string[]          // 全体タグ（削除しても残る）
  view: GalleryView
  sortBy: GallerySortBy
  search: string
  selectedCategory: GalleryCategory | 'all'
  selectedTags: string[]
  favoritesOnly: boolean
  selectedId: string | null
  detailOpen: boolean
  showTrash: boolean
  lightboxId: string | null
  tagSheetId: string | null
}

function extractTags(items: GalleryItem[]): string[] {
  const set = new Set<string>()
  items.forEach((i) => i.tags.forEach((t) => set.add(t)))
  return Array.from(set).sort()
}

function galleryPhotoToItem(
  photo: GalleryPhoto,
  size: { width?: number; height?: number } = {},
): GalleryItem {
  return {
    id: photo.id ?? `local_gallery_${photo.createdAt.getTime()}`,
    filename: photo.name,
    label: photo.name.replace(/\.[^.]+$/, ''),
    description: '',
    tags: [],
    category: 'reference',
    mimeType: photo.mimeType ?? photo.dataUrl.match(/^data:([^;]+);/)?.[1] ?? 'image/*',
    fileSize: photo.fileSize,
    width: photo.width ?? size.width,
    height: photo.height ?? size.height,
    storagePath: photo.storagePath,
    downloadUrl: photo.downloadUrl,
    url: photo.downloadUrl,
    thumbnailPath: photo.thumbnailPath,
    thumbnailUrl: photo.thumbnailUrl,
    syncStatus: photo.syncStatus ?? (firebaseEnabled ? 'queued' : 'disabled'),
    assetStatus: photo.assetStatus ?? (photo.storagePath ? 'cloudDraft' : 'localDraft'),
    syncError: photo.syncError,
    syncedAt: photo.syncedAt,
    lastSyncAttemptAt: photo.lastSyncAttemptAt,
    dataUrl: photo.dataUrl,
    isFavorite: false,
    createdAt: photo.createdAt,
    updatedAt: photo.createdAt,
  }
}

function loadInitialGalleryItems(): GalleryItem[] {
  const localItems = loadLocalGalleryPhotos().map((photo) => galleryPhotoToItem(photo))
  if (localItems.length > 0) {
    console.log('[APP04-LOCAL-GALLERY] 6-0 Gallery store loaded local photos', {
      count: localItems.length,
    })
  }
  return [...localItems, ...GALLERY_SAMPLE.filter((sample) => !localItems.some((item) => item.id === sample.id))]
}

const initialGalleryItems = loadInitialGalleryItems()

export const [galleryState, setGalleryState] = createStore<GalleryLocalState>({
  items: initialGalleryItems,
  masterTags: extractTags(initialGalleryItems),
  view: 'grid',
  sortBy: 'createdAt',
  search: '',
  selectedCategory: 'all',
  selectedTags: [],
  favoritesOnly: false,
  selectedId: null,
  detailOpen: false,
  showTrash: false,
  lightboxId: null,
  tagSheetId: null,
})

function hydrateCloudGalleryItems(): Promise<number> {
  return fetchGalleryAssetDrafts().then((assets) => {
    if (assets.length === 0) return 0
    const cloudItems = assets.map(galleryAssetToGalleryItem)
    setGalleryState('items', (prev) => {
      const localById = new Map(prev.map((item) => [item.id, item]))
      const mergedCloud = cloudItems.map((cloud) => ({
        ...cloud,
        dataUrl: localById.get(cloud.id)?.dataUrl,
        isFavorite: localById.get(cloud.id)?.isFavorite ?? cloud.isFavorite,
      }))
      const cloudIds = new Set(mergedCloud.map((item) => item.id))
      return [...mergedCloud, ...prev.filter((item) => !cloudIds.has(item.id))]
    })
    setGalleryState('masterTags', (prev) =>
      Array.from(new Set([...prev, ...extractTags(cloudItems)])).sort()
    )
    console.log('[APP04-FIREBASE-GALLERY] 6-4 Gallery assets loaded from Firestore', {
      count: assets.length,
    })
    return assets.length
  }).catch((error) => {
    console.warn('[APP04-FIREBASE-GALLERY] 6-4e Gallery asset fetch failed', { error })
    throw error
  })
}

/** クラウドの写真を読み直す（他の端末で入れた写真を、アプリを開き直さずに見る。V2.1 ギャラリー） */
export const refreshGalleryFromCloud = hydrateCloudGalleryItems

hydrateCloudGalleryItems().catch(() => {})
if (typeof window !== 'undefined') {
  window.setTimeout(retryPendingLocalGalleryItems, 1200)
}

// マスタータグに追加（重複・自動ソート）
export function addMasterTag(tag: string) {
  const t = tag.trim()
  if (!t) return
  setGalleryState('masterTags', (prev) =>
    prev.includes(t) ? prev : [...prev, t].sort()
  )
}

function readImageSize(dataUrl: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({})
    img.src = dataUrl
  })
}

function dataUrlToFile(dataUrl: string, filename: string, mimeType = 'image/png'): File {
  const [header, body = ''] = dataUrl.split(',')
  const detectedMime = header.match(/^data:([^;]+);/)?.[1] ?? mimeType
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], filename, { type: detectedMime })
}

function syncLocalGalleryItem(item: GalleryItem, file: File) {
  updateGalleryItem(item.id, { syncStatus: 'syncing', lastSyncAttemptAt: new Date().toISOString() })
  updateLocalGalleryPhoto(item.id, { syncStatus: 'syncing', lastSyncAttemptAt: new Date().toISOString() })

  syncGalleryItemToFirebase(item, file).then((asset) => {
    const patch: Partial<GalleryItem> = {
      storagePath: asset.storagePath ?? undefined,
      downloadUrl: asset.downloadUrl ?? undefined,
      url: asset.downloadUrl ?? undefined,
      thumbnailPath: asset.thumbnailPath ?? undefined,
      thumbnailUrl: asset.thumbnailUrl ?? undefined,
      syncStatus: asset.syncStatus,
      assetStatus: asset.assetStatus,
      syncError: undefined,
      syncedAt: asset.sync.syncedAt ?? undefined,
      lastSyncAttemptAt: asset.sync.lastAttemptAt ?? undefined,
    }
    updateGalleryItem(item.id, patch)
    updateLocalGalleryPhoto(item.id, patch)
    console.log('[APP04-FIREBASE-GALLERY] 6-2 Gallery asset synced', {
      id: asset.id,
      storagePath: asset.storagePath,
      syncStatus: asset.syncStatus,
    })
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[APP04-FIREBASE-GALLERY] 6-2e Gallery asset sync skipped or failed', {
      id: item.id,
      filename: file.name,
      error,
    })
    updateGalleryItem(item.id, {
      syncStatus: 'error',
      assetStatus: 'error',
      syncError: message,
      lastSyncAttemptAt: new Date().toISOString(),
    })
    updateLocalGalleryPhoto(item.id, {
      syncStatus: 'error',
      assetStatus: 'error',
      syncError: message,
      lastSyncAttemptAt: new Date().toISOString(),
    })
  })
}

function retryPendingLocalGalleryItems() {
  if (!firebaseEnabled) return
  const pendingItems = galleryState.items.filter((item) =>
    item.dataUrl &&
    !item.storagePath &&
    (item.syncStatus === 'disabled' || item.syncStatus === 'queued' || item.syncStatus === 'error')
  )
  if (pendingItems.length === 0) return
  console.log('[APP04-FIREBASE-GALLERY] 6-5 Retry pending local gallery assets', {
    count: pendingItems.length,
  })
  pendingItems.slice(0, 5).forEach((item) => {
    syncLocalGalleryItem(item, dataUrlToFile(item.dataUrl ?? '', item.filename, item.mimeType))
  })
}

export function addGalleryImage(file: File) {
  if (!file.type.startsWith('image/')) return
  fileToLocalGalleryPhoto(file).then(async (photo) => {
    if (!photo.dataUrl) return
    const size = await readImageSize(photo.dataUrl)
    const initialSyncStatus = firebaseEnabled ? 'queued' : 'disabled'
    const preparedPhoto: GalleryPhoto = {
      ...photo,
      ...size,
      mimeType: file.type,
      fileSize: file.size,
      syncStatus: initialSyncStatus,
      assetStatus: 'localDraft',
    }
    addLocalGalleryPhoto(preparedPhoto)
    const item: GalleryItem = {
      ...galleryPhotoToItem(preparedPhoto, size),
      mimeType: file.type,
      fileSize: file.size,
      syncStatus: initialSyncStatus,
      assetStatus: 'localDraft',
    }
    setGalleryState('items', (prev) => [item, ...prev.filter((entry) => entry.id !== item.id)])
    setGalleryState({ selectedId: item.id, detailOpen: true, showTrash: false })
    console.log('[APP04-LOCAL-GALLERY] 6-1 Gallery page photo added', {
      id: item.id,
      filename: file.name,
      syncStatus: initialSyncStatus,
    })

    if (!firebaseEnabled) {
      console.log('[APP04-FIREBASE-GALLERY] 6-2 Gallery asset sync disabled', {
        id: item.id,
        filename: file.name,
      })
      return
    }

    syncLocalGalleryItem(item, file)
  }).catch((error) => {
    console.warn('[APP04-LOCAL-GALLERY] 6-1e Gallery page photo add failed', {
      filename: file.name,
      error,
    })
  })
}

export function selectGalleryItem(id: string | null) {
  setGalleryState({ selectedId: id, detailOpen: id !== null })
  if (galleryState.view === 'pinterest') {
    console.log('[APP04-GALLERY-PINTEREST] 12-2 Toggle pinterest detail overlay', {
      itemId: id,
      open: id !== null,
    })
  }
}

export function openLightbox(id: string) {
  setGalleryState({ lightboxId: id })
}

export function closeLightbox() {
  setGalleryState({ lightboxId: null })
}

export function openTagSheet(id: string) {
  setGalleryState({ tagSheetId: id })
}

export function closeTagSheet() {
  setGalleryState({ tagSheetId: null })
}

export function toggleGalleryFavorite(id: string) {
  setGalleryState('items', (prev) =>
    prev.map((item) => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item)
  )
}

export function toggleGalleryTag(tag: string) {
  setGalleryState('selectedTags', (prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  )
}

export function updateGalleryItem(id: string, patch: Partial<GalleryItem>) {
  setGalleryState('items', (prev) =>
    prev.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date() } : item)
  )
}

export function moveToGalleryTrash(id: string) {
  updateGalleryItem(id, { isDeleted: true })
  setGalleryState({ selectedId: null, detailOpen: false })
}

export function restoreFromGalleryTrash(id: string) {
  updateGalleryItem(id, { isDeleted: false })
  setGalleryState({ selectedId: null, detailOpen: false })
}

export function permanentDeleteGalleryItem(id: string) {
  if (id.startsWith('local_gallery_')) {
    deleteLocalGalleryPhoto(id)
    console.log('[APP04-LOCAL-GALLERY] 6-3 Local gallery photo deleted', { id })
  }
  setGalleryState('items', (prev) => prev.filter((item) => item.id !== id))
  setGalleryState({ selectedId: null, detailOpen: false })
}

export function getAllTags(items: GalleryItem[]): string[] {
  const tagSet = new Set<string>()
  items.filter(i => !i.isDeleted).forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)))
  return Array.from(tagSet).sort()
}

export function getFilteredItems(s: typeof galleryState): GalleryItem[] {
  let items = [...s.items]

  if (s.showTrash) return items.filter((i) => i.isDeleted)

  items = items.filter((i) => !i.isDeleted)

  if (s.favoritesOnly) items = items.filter((i) => i.isFavorite)
  if (s.selectedCategory !== 'all') items = items.filter((i) => i.category === s.selectedCategory)
  if (s.selectedTags.length > 0)
    items = items.filter((i) => s.selectedTags.every((t) => i.tags.includes(t)))
  if (s.search.trim()) {
    const q = s.search.toLowerCase()
    items = items.filter((i) =>
      i.label.toLowerCase().includes(q) ||
      i.filename.toLowerCase().includes(q) ||
      (i.description?.toLowerCase().includes(q) ?? false) ||
      i.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  items.sort((a, b) => {
    if (s.sortBy === 'label') return a.label.localeCompare(b.label, 'ja')
    if (s.sortBy === 'updatedAt') return b.updatedAt.getTime() - a.updatedAt.getTime()
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return items
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date))
}
