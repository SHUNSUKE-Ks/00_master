// KeyDeck（Deck編集の「取り込み」）へ渡すファイルを作る。形式は keydeck.deck_import.v1。
// PWAからHubへは直接送れない（HubはCORSを許可していない／HTTPSのPWA→LANのHTTPは遮断される）ため、
// ファイルを書き出して、PCのKeyDeckで取り込む。
// 並び順＝ALT+1〜9。会話ログVIEWの Alt+1〜9 と同じ番号なので、KeyDeckのボタンを押すと
// PC上のこのアプリにALT+nが届き、その人物の新しいセリフが作られる。

export type KeyDeckCharacter = { name: string; iconDataUrl?: string }

export const KEYDECK_ID_PATTERN = /^[a-z0-9_]{1,58}$/
export const KEYDECK_MAX_CHARACTERS = 9

const ICON_COLORS = ['#7b4b2a', '#2a4f7b', '#5a2a7b', '#2a7b5a', '#7b2a3f', '#6b6b2a', '#2a6b7b', '#4b2a7b', '#7b5a2a']

export function suggestKeyDeckId(seed: string) {
  const slug = seed.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
  return `chara_${slug || 'notebook'}`
}

/** 画像の無いキャラクター用に、頭文字の正方形アイコン（PNG）を描く */
export function drawInitialIcon(name: string, index: number, size = 256): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const color = ICON_COLORS[index % ICON_COLORS.length]
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, color)
  grad.addColorStop(1, '#14161c')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(233, 214, 170, 0.55)'
  ctx.lineWidth = size * 0.02
  ctx.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88)
  ctx.fillStyle = '#f3ead6'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(size * 0.5)}px "Hiragino Mincho ProN", "Yu Mincho", serif`
  ctx.fillText([...name.trim()][0] ?? '?', size / 2, size / 2 + size * 0.02)
  return canvas.toDataURL('image/png')
}

export function buildKeyDeckImport(deckId: string, title: string, characters: KeyDeckCharacter[], opts: { narration?: string } = {}) {
  const cast = characters.slice(0, KEYDECK_MAX_CHARACTERS)
  const total = cast.length + (opts.narration ? 1 : 0)
  const cols = Math.min(Math.max(total, 1), 5)
  const rows = Math.max(1, Math.ceil(total / cols))
  const icons: Record<string, string> = {}
  const slots = cast.map((character, index) => {
    const iconName = `${deckId}_c${index + 1}`
    icons[iconName] = character.iconDataUrl || drawInitialIcon(character.name, index)
    return {
      slotId: `C${index + 1}`,
      label: character.name,
      iconRef: iconName,
      action: { t: 'chord', keys: ['ALT', String(index + 1)] },
    }
  })
  // ナレーション（全作品共通の ALT+0）。V2.1 の会話ログで名前なしの地の文を作る
  if (opts.narration) {
    const iconName = `${deckId}_c0`
    icons[iconName] = drawInitialIcon(opts.narration, cast.length)
    slots.push({ slotId: 'C0', label: opts.narration, iconRef: iconName, action: { t: 'chord', keys: ['ALT', '0'] } })
  }
  return {
    format: 'keydeck.deck_import.v1',
    source: 'kanban-note01 / 会話ログVIEW',
    exportedAt: new Date().toISOString(),
    deck: {
      deckId,
      description: `「${title}」の登場人物。押すと ALT+番号 を送り、Note_Story の会話ログVIEWでその人物の新しいセリフを直下に作る。`,
      grid: { cols, rows },
      pages: [{ id: 1, slots }],
    },
    icons,
  }
}

export function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
