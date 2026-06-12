import type { Product } from '../types'

// NACC source data was intentionally removed for note00.
// Keep this adapter shape until DB01 is renamed into a generic note database.
export const PRODUCTS: Product[] = []

export function productImageUrl(image: string): string {
  if (!image) return ''
  return image.startsWith('http') ? image : ''
}
