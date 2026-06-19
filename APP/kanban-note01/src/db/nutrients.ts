import type { Nutrient } from '../types'

export const NUTRIENTS: Nutrient[] = [
  {
    id: 'CHAR-001',
    name: '天災魔法使い Characters',
    description: '天災魔法使いに登場する人物群。詳細はノートブック側の本文・メモに集約します。',
    productIds: ['TITLE-001'],
    memo: '',
    createdAt: new Date(),
  },
  {
    id: 'CHAR-002',
    name: '未来を打ち直す鍛冶屋 Characters',
    description: '未来を打ち直す鍛冶屋に登場する人物群。characterログと設定メモをノートブックに集約します。',
    productIds: ['TITLE-002'],
    memo: '',
    createdAt: new Date(),
  },
]
