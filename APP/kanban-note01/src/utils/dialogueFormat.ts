const CHARACTER_NAME_WIDTH = 'CharacterA'.length

export function formatDialogueLine(name: string): string {
  const normalized = name.replace(/\s+Characters?$/i, '').trim() || name
  return `${normalized.padEnd(CHARACTER_NAME_WIDTH, ' ')}：「」`
}

export function dialogueIndent(value: string, cursor: number): string | null {
  const beforeCursor = value.slice(0, cursor)
  const openIndex = beforeCursor.lastIndexOf('：「')
  if (openIndex === -1) return null
  const closeIndex = beforeCursor.lastIndexOf('」')
  if (closeIndex > openIndex) return null

  const lineStart = value.lastIndexOf('\n', openIndex) + 1
  const prefix = value.slice(lineStart, openIndex + 2)
  return ' '.repeat(prefix.length)
}

export function escapeDialogueToNextParagraph(
  value: string,
  cursor: number
): { value: string; cursor: number } | null {
  const beforeCursor = value.slice(0, cursor)
  const openIndex = beforeCursor.lastIndexOf('：「')
  if (openIndex === -1) return null
  const closeBeforeCursor = beforeCursor.lastIndexOf('」')
  if (closeBeforeCursor > openIndex) return null

  const lineEndIndex = value.indexOf('\n', cursor)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
  const closeAfterCursor = value.indexOf('」', cursor)
  const hasCloseOnLine = closeAfterCursor !== -1 && closeAfterCursor <= lineEnd
  const insertAt = hasCloseOnLine ? closeAfterCursor + 1 : lineEnd
  const closing = hasCloseOnLine ? '' : '」'
  const nextValue = `${value.slice(0, insertAt)}${closing}\n\n${value.slice(insertAt)}`
  const nextCursor = insertAt + closing.length + 2

  return { value: nextValue, cursor: nextCursor }
}
