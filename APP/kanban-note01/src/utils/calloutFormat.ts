export type CalloutKind = 'pillar' | 'memo' | 'idea'

export type CalloutDraft = {
  kind: CalloutKind
  emoji: string
  title: string
  tags: string
  body?: string
}

const DEFAULT_BODY: Record<CalloutKind, string> = {
  pillar: 'Scene / Event の内容を書く',
  memo: '補足メモを書く',
  idea: 'あとで回収したいアイディアを書く',
}

export function formatCallout(draft: CalloutDraft): string {
  const title = draft.title.trim() || (draft.kind === 'pillar' ? 'Scene / Event' : draft.kind === 'memo' ? '補足メモ' : 'IdeaBoard')
  const tagLine = draft.tags.trim() ? `tags: ${draft.tags.trim()}\n` : ''
  const body = draft.body?.trim() || DEFAULT_BODY[draft.kind]
  return [
    `:::callout ${draft.kind} ${draft.emoji} ${title}`,
    tagLine + body,
    ':::',
  ].join('\n')
}
