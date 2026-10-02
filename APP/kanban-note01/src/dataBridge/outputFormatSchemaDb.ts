import type { OssCandidateGenre } from './ossCandidateDb'

export type OutputFormatStatus = 'current' | 'old' | 'draft'
export type OutputFormatAction = 'rpa' | 'kanji'

export type OutputFormatSchema = {
  id: string
  label: string
  version: string
  status: OutputFormatStatus
  action: OutputFormatAction
  genre: OssCandidateGenre | 'ClaudeRPA' | '共通'
  description: string
  schemaPath: string
  outputFolderPattern: string
  requiresRpaMaterial: boolean
  columns: string[]
}

export const OUTPUT_FORMAT_SCHEMAS: OutputFormatSchema[] = [
  {
    id: 'oss_candidate_rpa_game_ui_v0_1',
    label: 'RPA化 / Game UI v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'GameUI',
    description: 'ゲームUI部品・完成画面・Agent知識を、画面種別、密度、世界観、操作、検査へ分解する形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_game_ui_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'screenTypes', 'components', 'informationDensity', 'visualIdentity', 'input', 'accessibility', 'review', 'topics'],
  },
  {
    id: 'oss_candidate_rpa_ai_asset_workflow_v0_1',
    label: 'RPA化 / AI素材制作 v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'AI素材制作',
    description: 'ComfyUIのCustom Node、Workflow、ゲーム連携を、素材種別と入出力・再現条件へ分解する形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_ai_asset_workflow_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'assetType', 'workflow', 'input', 'output', 'consistency', 'models', 'runtime', 'topics'],
  },
  {
    id: 'oss_candidate_rpa_casual_game_v0_1',
    label: 'RPA化 / カジュアルゲーム v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'カジュアルゲーム',
    description: '完成ゲームOSSをOpenHarness型のmanual/目次/topicsへ分解するための初期形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_casual_game_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'genre', 'subGenre', 'gameLoop', 'state', 'rendering', 'input', 'asset', 'topics'],
  },
  {
    id: 'oss_candidate_rpa_game_engine_v0_1',
    label: 'RPA化 / ゲームEngine v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'ゲームエンジン',
    description: 'Phaser/PixiJS/melonJSなどEngine本体を、必要時に参照できる技術Libraryへ分解する形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_game_engine_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'engineCore', 'rendering', 'scene', 'input', 'assetPipeline', 'sampleLinks', 'topics'],
  },
  {
    id: 'oss_candidate_rpa_novel_game_v0_1',
    label: 'RPA化 / novelGame v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'novelGame',
    description: 'ノベルゲームOSSを、scenario/schema/runtime/asset導線に分けて読むための形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_novel_game_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'scenario', 'dialogue', 'choice', 'saveLoad', 'asset', 'runtime', 'topics'],
  },
  {
    id: 'oss_candidate_rpa_index_v0_1',
    label: 'RPA化 / OSS索引 v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'OSS索引',
    description: 'Awesome listやTopicを、候補採掘用の索引DBへ変換する形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_index_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'indexScope', 'genreBuckets', 'candidateRules', 'extractionTargets', 'topics'],
  },
  {
    id: 'oss_candidate_rpa_harness_v0_1',
    label: 'RPA化 / Harness v0.1',
    version: '0.1',
    status: 'current',
    action: 'rpa',
    genre: 'ClaudeRPA',
    description: 'OpenHarness型のRPA/Agent資料をmanual/目次/topicsへ分解する形式。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_harness_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['agent', 'harness', 'loop', 'tools', 'memory', 'permissions', 'topics'],
  },
  {
    id: 'kanji_concept_from_rpa_v0_1',
    label: '漢字概念化 / RPA資料 v0.1',
    version: '0.1',
    status: 'current',
    action: 'kanji',
    genre: '共通',
    description: 'RPA化済み本文をもとに、漢字2〜4文字Keyと英語概念を対応付ける形式。',
    schemaPath: 'public/study-blog/schema/output/kanji_concept_from_rpa_v0_1.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/custom/',
    requiresRpaMaterial: true,
    columns: ['kanjiKey', 'englishTerm', 'definition', 'sourceFile', 'usedIn', 'languageMapping'],
  },
  {
    id: 'oss_candidate_rpa_common_v0_0',
    label: 'RPA化 / 共通 v0.0',
    version: '0.0',
    status: 'old',
    action: 'rpa',
    genre: '共通',
    description: 'ジャンル分割前の旧形式。互換確認用に残す。',
    schemaPath: 'public/study-blog/schema/output/oss_candidate_rpa_common_v0_0.schema.json',
    outputFolderPattern: '01_Library/01_Library/{repoShort}/',
    requiresRpaMaterial: false,
    columns: ['repo', 'manual', 'index', 'topics'],
  },
]

export function outputFormatsForGenre(genre: OssCandidateGenre) {
  return OUTPUT_FORMAT_SCHEMAS.filter((format) => format.genre === genre || format.genre === '共通')
}

export function currentOutputFormatsForGenre(genre: OssCandidateGenre, action?: OutputFormatAction) {
  return outputFormatsForGenre(genre).filter((format) => format.status === 'current' && (!action || format.action === action))
}
