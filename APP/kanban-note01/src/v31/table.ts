// 表（UpNote 風）。本文の中では1行の `::table {JSON}` として持つ（本文の他の行は今までどおりの Markdown）。
// w＝列の幅（割合・合計1）、r＝行ごとのセル。セルの中身は本文と同じ書き方（改行・# 見出し・- 印）。

export type TableData = { w: number[]; r: string[][] }

const PREFIX = '::table '
export const isTableLine = (text: string) => text.startsWith(PREFIX)

export function parseTable(text: string): TableData | null {
  if (!isTableLine(text)) return null
  try {
    const t = JSON.parse(text.slice(PREFIX.length)) as TableData
    if (!Array.isArray(t.r) || !t.r.length) return null
    const cols = Math.max(1, ...t.r.map((row) => row.length))
    const r = t.r.map((row) => Array.from({ length: cols }, (_, i) => String(row[i] ?? '')))
    const w = Array.isArray(t.w) && t.w.length === cols ? normalize(t.w) : even(cols)
    return { w, r }
  } catch {
    return null
  }
}

export const tableLine = (t: TableData) => PREFIX + JSON.stringify({ w: t.w.map((x) => Math.round(x * 1000) / 1000), r: t.r })

export const even = (n: number) => Array.from({ length: n }, () => 1 / n)
export function normalize(w: number[]) {
  const sum = w.reduce((a, b) => a + b, 0) || 1
  return w.map((x) => x / sum)
}

export const newTable = (cols: number, rows = 2): TableData => ({ w: even(cols), r: Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')) })

/** 検索・カードの抜き出し用（セルを「 / 」でつなぐ） */
export const tablePlain = (t: TableData) => t.r.map((row) => row.map((c) => cellPlain(c)).join(' / ')).join(' / ')
export const cellPlain = (c: string) => c.replace(/^#{1,4}\s+/gm, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '［写真］').replace(/\n+/g, ' ')
