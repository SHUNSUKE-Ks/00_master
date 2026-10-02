import type { Blog, Memo, Tag } from '../types'

export type RpaMaterialTopic = {
  id: string
  title: string
  kind?: 'topic' | 'reference'
  tags?: string[]
  body: string
  code?: {
    lang?: string
    body: string
  }
  importAs?: 'memo' | 'blog'
}

export type RpaMaterialPack = {
  $schema: 'rpa_material_pack.v1'
  generatedBy?: string
  generatedAt?: string
  topics: RpaMaterialTopic[]
}

export type RpaImportDraft =
  | { kind: 'memo'; source: RpaMaterialTopic; data: Omit<Memo, 'id'> }
  | { kind: 'blog'; source: RpaMaterialTopic; data: Omit<Blog, 'id'> }

function toTags(tags: string[] = []): Tag[] {
  return Array.from(new Set(['rpa', ...tags].filter(Boolean))).map((name) => ({
    type: 'nutrient',
    name,
  }))
}

function topicBody(topic: RpaMaterialTopic): string {
  const lines = [topic.body.trim()]
  if (topic.code?.body.trim()) {
    lines.push('', `\`\`\`${topic.code.lang ?? ''}`.trim(), topic.code.body.trim(), '```')
  }
  return lines.join('\n')
}

export function parseRpaMaterialPack(raw: string): RpaMaterialPack {
  const parsed = JSON.parse(raw) as RpaMaterialPack
  if (parsed.$schema !== 'rpa_material_pack.v1') {
    throw new Error('Unsupported schema. Expected rpa_material_pack.v1.')
  }
  if (!Array.isArray(parsed.topics)) {
    throw new Error('topics must be an array.')
  }
  return parsed
}

export function buildRpaImportDrafts(pack: RpaMaterialPack): RpaImportDraft[] {
  const now = new Date()
  return pack.topics.map((topic) => {
    const tags = toTags(topic.tags)
    const body = topicBody(topic)
    if (topic.importAs === 'blog') {
      return {
        kind: 'blog',
        source: topic,
        data: {
          title: topic.title,
          body,
          coverType: 'none',
          categoryTags: tags,
          mode: 'published',
          createdAt: now,
          updatedAt: now,
        },
      }
    }
    return {
      kind: 'memo',
      source: topic,
      data: {
        title: topic.title,
        body,
        tags,
        createdAt: now,
        updatedAt: now,
      },
    }
  })
}

export const RPA_SAMPLE_PACK = `{
  "$schema": "rpa_material_pack.v1",
  "generatedBy": "claude",
  "generatedAt": "2026-07-08",
  "topics": [
    {
      "id": "rpa_click_wait",
      "title": "クリックと待機",
      "kind": "topic",
      "tags": ["rpa", "pyautogui", "ui操作"],
      "body": "RPAではクリック後に画面が変わるまで待つ。固定秒数より、対象UIが出るまで待つ設計が安定する。",
      "code": { "lang": "python", "body": "import pyautogui, time\\n\\npyautogui.click(100, 200)\\ntime.sleep(0.5)" },
      "importAs": "memo"
    },
    {
      "id": "rpa_techbook_intro",
      "title": "RPA技術書 Ver1.1：最小構成",
      "kind": "reference",
      "tags": ["rpa", "techbook", "ver1.1"],
      "body": "# RPA技術書 Ver1.1\\n\\n## 方針\\n\\nまずはノート型の可変レイアウトで読む。電子書籍の固定版面は後回しにする。\\n\\n## 章立て\\n\\n- クリックと待機\\n- 画像認識\\n- 失敗時の復帰\\n- ログ記録",
      "importAs": "blog"
    }
  ]
}`
