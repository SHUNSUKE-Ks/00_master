import type { GalleryPhoto } from '../types'

export const LOCAL_GALLERY_STORAGE_KEY = 'nacc_gallery'

type StoredGalleryPhoto = Omit<GalleryPhoto, 'createdAt'> & {
  createdAt: string | Date
}

function makeStablePhotoId(photo: StoredGalleryPhoto, index: number): string {
  const createdAt = new Date(photo.createdAt).getTime()
  const base = Number.isFinite(createdAt) ? createdAt : Date.now()
  return `local_gallery_${base}_${index}`
}

function revivePhoto(photo: StoredGalleryPhoto, index: number): GalleryPhoto {
  return {
    ...photo,
    id: photo.id ?? makeStablePhotoId(photo, index),
    createdAt: new Date(photo.createdAt),
  }
}

function readStoredPhotos(): StoredGalleryPhoto[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function loadLocalGalleryPhotos(): GalleryPhoto[] {
  const storedPhotos = readStoredPhotos()
  const photos = storedPhotos.map(revivePhoto)
  if (storedPhotos.some((photo) => !photo.id)) {
    saveLocalGalleryPhotos(photos)
  }
  return photos
}

export function saveLocalGalleryPhotos(photos: GalleryPhoto[]) {
  localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(photos))
}

export function fileToLocalGalleryPhoto(file: File): Promise<GalleryPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const createdAt = new Date()
      resolve({
        id: `local_gallery_${createdAt.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
        dataUrl: String(reader.result ?? ''),
        name: file.name,
        createdAt,
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function addLocalGalleryPhoto(photo: GalleryPhoto): GalleryPhoto[] {
  const photos = loadLocalGalleryPhotos()
  const normalized = {
    ...photo,
    id: photo.id ?? `local_gallery_${photo.createdAt.getTime()}`,
  }
  const next = [normalized, ...photos.filter((item) => item.id !== normalized.id)]
  saveLocalGalleryPhotos(next)
  return next
}

export function deleteLocalGalleryPhoto(photoId: string): GalleryPhoto[] {
  const next = loadLocalGalleryPhotos().filter((photo) => photo.id !== photoId)
  saveLocalGalleryPhotos(next)
  return next
}
