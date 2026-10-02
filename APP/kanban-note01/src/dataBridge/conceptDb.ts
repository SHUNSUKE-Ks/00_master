export type ConceptDbStatus = 'active' | 'draft' | 'review'

export type ConceptDbItem = {
  id: string
  key: string
  description: string
  category: string
  sourceNotebook: string
  sourceFile: string
  sourcePath: string
  sourceSection: string
  sourceLineHint: string
  usedIn: string[]
  programmingLanguage: string
  developmentLanguage: string
  languageMeaning: string
  codeRelation: string
  status: ConceptDbStatus
  createdAt: string
  updatedAt: string
}

export const CONCEPT_DB_KEY = 'note-story-concept-db-v0-1'

const now = '2026-07-08T00:00:00.000+09:00'
const openHarnessSource = {
  sourceNotebook: 'Claude RPA資料 / OpenHarness',
  sourceFile: 'openharness_concept_reading.md',
  sourcePath: 'public/study-blog/custom/OpenHarness/custom/openharness_concept_reading.md',
  usedIn: ['Study', 'Claude RPA資料', 'OpenHarness'],
  programmingLanguage: '',
  developmentLanguage: '',
  languageMeaning: '',
  codeRelation: '',
  status: 'active' as ConceptDbStatus,
  createdAt: now,
  updatedAt: now,
}

const SEED_CONCEPTS: ConceptDbItem[] = [
  {
    id: 'concept-openharness-position',
    key: '位置',
    description: '記事やプロジェクトの立ち位置を読む',
    category: '読解',
    sourceSection: '位置づけ',
    sourceLineHint: 'OpenHarnessは2部構成のPythonプロジェクト。',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-two-layer',
    key: '二層',
    description: '本体と応用など、二つの層で構成を見る',
    category: '構造',
    sourceSection: '位置づけ',
    sourceLineHint: 'oh / ohmo',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-summary',
    key: '要約',
    description: '長い説明を一言の意味へ圧縮する',
    category: '読解',
    sourceSection: '位置づけ',
    sourceLineHint: 'The model is the agent. The code is the harness.',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-structure',
    key: '構造',
    description: 'サブシステムや部品の並びを見る',
    category: '設計',
    sourceSection: 'Harness Architecture',
    sourceLineHint: 'engine / tools / skills / plugins / permissions',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-loop',
    key: '循環',
    description: 'LLM応答、tool実行、結果追記の反復を見る',
    category: '実行',
    sourceSection: 'Harness Architecture',
    sourceLineHint: 'while True: response -> tool_use -> tool_results',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-safety',
    key: '安全',
    description: '実行前後の確認、権限、Hookを見る',
    category: '検証',
    sourceSection: 'Harness Architecture',
    sourceLineHint: 'Permission -> Hook -> Execute -> Hook',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-compare',
    key: '比較',
    description: '既存ツールや自分の環境と見比べる',
    category: '読解',
    sourceSection: 'Claude Codeとの近さ',
    sourceLineHint: 'Claude Codeのシステムプロンプトと非常に近い',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-similar',
    key: '近似',
    description: '設計や部品が似ている点を確認する',
    category: '読解',
    sourceSection: 'Claude Codeとの近さ',
    sourceLineHint: 'AgentTool / AskUserQuestion / EnterPlanMode / ToolSearch',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-connect',
    key: '接続',
    description: '外部プロバイダやプロトコルとのつながりを見る',
    category: '連携',
    sourceSection: 'プロバイダ互換性',
    sourceLineHint: 'Anthropic-compatible / OpenAI-compatible',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-compatible',
    key: '互換',
    description: '複数環境で差し替え可能かを見る',
    category: '連携',
    sourceSection: 'プロバイダ互換性',
    sourceLineHint: 'Claude / OpenAI / OpenRouter / Ollama / Copilot',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-verify',
    key: '検証',
    description: 'テストや確認方法を見る',
    category: '検証',
    sourceSection: 'テスト規模',
    sourceLineHint: '114 unit/integration + E2E',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-follow',
    key: '追従',
    description: '既存エコシステムへ合わせている点を見る',
    category: '運用',
    sourceSection: 'テスト規模',
    sourceLineHint: 'anthropics/skills と anthropics/claude-code 互換性テスト',
    ...openHarnessSource,
  },
  {
    id: 'concept-openharness-index',
    key: '索引',
    description: '次に読むファイルやRelationを見る',
    category: '検索',
    sourceSection: '関連ファイル',
    sourceLineHint: 'README / CHANGELOG / SHOWCASE / LICENSE',
    ...openHarnessSource,
  },
]

function normalizeConcept(item: Partial<ConceptDbItem>, index: number): ConceptDbItem {
  const fallbackId = `concept-${String(index + 1).padStart(3, '0')}`
  return {
    id: item.id || fallbackId,
    key: item.key || '未定',
    description: item.description || '',
    category: item.category || '未分類',
    sourceNotebook: item.sourceNotebook || '',
    sourceFile: item.sourceFile || '',
    sourcePath: item.sourcePath || '',
    sourceSection: item.sourceSection || '',
    sourceLineHint: item.sourceLineHint || '',
    usedIn: item.usedIn || [],
    programmingLanguage: item.programmingLanguage || '',
    developmentLanguage: item.developmentLanguage || '',
    languageMeaning: item.languageMeaning || '',
    codeRelation: item.codeRelation || '',
    status: item.status || 'draft',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

function mergeSeedConcepts(items: ConceptDbItem[]): ConceptDbItem[] {
  const ids = new Set(items.map((item) => item.id))
  return [...items, ...SEED_CONCEPTS.filter((item) => !ids.has(item.id))]
}

export function loadConceptDb(): ConceptDbItem[] {
  if (typeof localStorage === 'undefined') return SEED_CONCEPTS
  const raw = localStorage.getItem(CONCEPT_DB_KEY)
  if (!raw) {
    saveConceptDb(SEED_CONCEPTS)
    return SEED_CONCEPTS
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ConceptDbItem>[]
    const normalized = parsed.map(normalizeConcept)
    const merged = mergeSeedConcepts(normalized)
    if (merged.length !== normalized.length) saveConceptDb(merged)
    return merged
  } catch {
    saveConceptDb(SEED_CONCEPTS)
    return SEED_CONCEPTS
  }
}

export function saveConceptDb(items: ConceptDbItem[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CONCEPT_DB_KEY, JSON.stringify(items, null, 2))
}
