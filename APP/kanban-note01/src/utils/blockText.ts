export type BlockCursor = {
  blockIndex: number
  cursor: number
}

export function splitTextBlocks(value: string): string[] {
  if (value === '') return ['']
  const parts = value.split(/(\n{2,})/)
  const blocks: string[] = []

  for (let i = 0; i < parts.length; i += 2) {
    blocks.push(parts[i])
    const separator = parts[i + 1]
    if (!separator) continue
    const emptyBlocks = Math.max(0, Math.floor((separator.length - 2) / 2))
    for (let j = 0; j < emptyBlocks; j += 1) blocks.push('')
  }

  return blocks.length ? blocks : ['']
}

export function joinTextBlocks(blocks: string[]): string {
  return blocks.join('\n\n')
}

export function cursorToTextIndex(blocks: string[], cursor: BlockCursor): number {
  const safeIndex = Math.min(Math.max(cursor.blockIndex, 0), Math.max(blocks.length - 1, 0))
  const before = blocks.slice(0, safeIndex).reduce((sum, block) => sum + block.length + 2, 0)
  return before + Math.min(Math.max(cursor.cursor, 0), blocks[safeIndex]?.length ?? 0)
}

export function textIndexToBlockCursor(blocks: string[], index: number): BlockCursor {
  let offset = Math.max(index, 0)
  for (let i = 0; i < blocks.length; i += 1) {
    if (offset <= blocks[i].length) return { blockIndex: i, cursor: offset }
    offset -= blocks[i].length + 2
  }
  const lastIndex = Math.max(blocks.length - 1, 0)
  return { blockIndex: lastIndex, cursor: blocks[lastIndex]?.length ?? 0 }
}
