export type ScenarioBlockKind =
  | 'event'
  | 'quest'
  | 'choice'
  | 'world'
  | 'system'
  | 'variable'
  | 'pillar'
  | 'direction'
  | 'dialogue'

const DEFAULT_BLOCK: Record<ScenarioBlockKind, string> = {
  event: ':::event h1\nScene:\n:::',
  quest: ':::quest\n目的:\n達成条件:\n鍵:\n成果物:\n:::',
  choice: ':::choice\n- 選択肢A -> page:\n- 選択肢B -> page:\nreturn:\n:::',
  world: ':::world\n背景/概念:\n:::',
  system: ':::system\ntags:\n:::',
  variable: ':::var\nname:\nmemo:\n:::',
  pillar: '柱：',
  direction: 'ト：',
  dialogue: '名前：「」',
}

export function formatScenarioBlock(kind: ScenarioBlockKind): string {
  return DEFAULT_BLOCK[kind]
}

export function cursorOffsetForScenarioBlock(kind: ScenarioBlockKind): number {
  const text = DEFAULT_BLOCK[kind]
  if (kind === 'dialogue') return text.length - 1
  if (kind === 'event') return text.indexOf('Scene:') + 'Scene:'.length
  if (kind === 'quest') return text.indexOf('目的:') + '目的:'.length
  if (kind === 'choice') return text.indexOf('選択肢A') + '選択肢A'.length
  if (kind === 'world') return text.indexOf('背景/概念:') + '背景/概念:'.length
  if (kind === 'system') return text.indexOf('tags:') + 'tags:'.length
  if (kind === 'variable') return text.indexOf('name:') + 'name:'.length
  return text.length
}
