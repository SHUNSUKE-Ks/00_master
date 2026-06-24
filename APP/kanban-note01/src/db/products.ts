import type { Product } from '../types'

export const PRODUCTS: Product[] = [
  {
    id: 'TITLE-001',
    name: '天災魔法使い',
    image: '/story-covers/tensai-mage.webp',
    category: 'scenario',
    description: '天災と魔法使いを軸にしたシナリオ。第一章原稿と作業メモをノートブックに集約しています。',
    workState: '執筆中',
    headingRefNotebookId: 'story-tensai-mage',
    headingRefPageId: 'tensai-chapter-1-draft',
    headingRefMode: 'md_heading',
    price: 0,
    volume: '',
    symptoms: ['執筆中'],
    effects: ['第一章', '小説本文'],
    ingredients: ['CHAR-001'],
    nutrientIds: ['CHAR-001'],
    memo: '',
    createdAt: new Date(),
  },
  {
    id: 'TITLE-002',
    name: '未来を打ち直す鍛冶屋',
    image: '/story-covers/future-blacksmith.webp',
    category: 'scenario',
    description: '鍛冶屋が未来を打ち直す物語。世界設定、キャラクター、第一話、プロット資料をノートブックに集約しています。',
    workState: 'アイディア中',
    headingRefNotebookId: 'story-future-blacksmith',
    headingRefPageId: 'future-plot-episodes-1-3',
    headingRefMode: 'stepper_heading',
    price: 0,
    volume: '',
    symptoms: ['企画中'],
    effects: ['世界設定', '第一話', 'プロット'],
    ingredients: ['CHAR-002'],
    nutrientIds: ['CHAR-002'],
    memo: '',
    createdAt: new Date(),
  },
]

export function productImageUrl(image: string): string {
  if (!image) return ''
  return image.startsWith('http') ? image : ''
}
