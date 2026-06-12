import type { UpnoteNote } from '../types'

export const SAMPLE_UPNOTE_NOTES: UpnoteNote[] = [
  {
    id: 'note_welcome_001',
    title: 'note00 開発メモ',
    body: 'UPNOTE仕様のノート機能を、既存Memoとは分離して育てる。まずはローカル状態で編集、タグ、Relationを扱えるようにする。',
    tags: ['dev', 'upnote', 'todo'],
    relationIds: ['note_relation_001'],
    createdAt: new Date('2026-06-01T09:00:00'),
    updatedAt: new Date('2026-06-01T09:00:00'),
  },
  {
    id: 'note_relation_001',
    title: 'Relationの考え方',
    body: 'ノート同士をrelationIdsでつなぐ。DB表示、ギャラリー表示、サイドパネルから同じNoteを参照できる構成にする。',
    tags: ['relation', 'database'],
    relationIds: ['note_welcome_001'],
    createdAt: new Date('2026-06-01T09:10:00'),
    updatedAt: new Date('2026-06-01T09:10:00'),
  },
]
