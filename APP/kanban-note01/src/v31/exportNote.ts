import { noteById, noteTitle, type Note } from './store'
import { hostOf, parseLink, resolveRefs, type LinkCard } from './links'
import { cellPlain, parseTable, type TableData } from './table'
import { IMG_TOKEN, imageDataUrl } from './imageStore'

// 書き出し（テキスト／HTML／Markdown）。本文は「1行＝1段落、# 〜 #### ＝見出し」の Markdown として持っている。

export type Fold = 'none' | 'open' | 'closed'
export type Line = { level: number; text: string }

export function parseLines(body: string): Line[] {
  return body.split('\n').map((raw) => {
    const m = raw.match(/^(#{1,4})\s(.*)$/)
    return m ? { level: m[1].length, text: m[2] } : { level: 0, text: raw }
  })
}

/** 表の行を、ほかの形へ（Markdown の表・HTML の表・タブ区切りの文字） */
// 写真は書き出しの前に data: URL に読み替えておく（ファイル1つで見られるように）
let IMGS = new Map<string, string>()
export async function prepareImages(body: string) {
  const ids = [...new Set([...body.matchAll(/bnimg:([\w-]+)/g)].map((m) => m[1]))]
  const pairs = await Promise.all(ids.map(async (id) => [id, (await imageDataUrl(id)) ?? ''] as const))
  IMGS = new Map(pairs.filter(([, u]) => u))
}
const imgOf = (line: string) => { const m = line.match(IMG_TOKEN); return m ? IMGS.get(m[1]) ?? null : undefined }

const cellMd = (c: string) => c.split('\n').map((l) => {
  const src = imgOf(l)
  if (src !== undefined) return src ? `![写真](${src})` : '［写真］'
  return mdRefs(l).replace(/\|/g, '\\|')
}).join('<br>') || ' '
export function tableToMd(t: TableData) {
  const row = (r: string[]) => `| ${r.map(cellMd).join(' | ')} |`
  return [row(t.r[0]), `| ${t.r[0].map(() => '---').join(' | ')} |`, ...t.r.slice(1).map(row)].join('\n')
}
function cellHtml(c: string) {
  return parseLines(c).map((l) => {
    const src = imgOf(l.text)
    if (src !== undefined) return src ? `<img src="${src}" alt="写真">` : '<div>［写真］</div>'
    return l.level ? `<div class="c-h${l.level}">${htm(l.text)}</div>` : l.text.trim() ? `<div>${htm(l.text)}</div>` : '<div class="gap"></div>'
  }).join('')
}
function tableToHtml(t: TableData) {
  const cols = t.w.map((w) => `<col style="width:${(w * 100).toFixed(1)}%">`).join('')
  const rows = t.r.map((r, i) => `<tr>${r.map((c) => `<${i ? 'td' : 'th'}>${cellHtml(c)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')
  return `<table><colgroup>${cols}</colgroup>${rows}</table>`
}
const tableToText = (t: TableData) => t.r.map((r) => r.map((c) => cellPlain(txt(c))).join('\t')).join('\n')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// アプリ内リンク（[[p:ID]]）は、テキスト＝@名前、Markdown＝[[名前]]、HTML＝名前の札
const nameOf = (id: string) => { const p = noteById(id); return p ? noteTitle(p) : null }
const txt = (s: string) => resolveRefs(s, nameOf)
const mdRefs = (s: string) => resolveRefs(s, nameOf, (n) => `[[${n}]]`)
const htm = (s: string) => resolveRefs(esc(s), nameOf, (n) => `<span class="ref">@${esc(n)}</span>`)
// 外部リンクのカード
const cardTitle = (c: LinkCard) => c.t || hostOf(c.u)
const cardText = (c: LinkCard) => [cardTitle(c), c.u, c.d, c.memo ? `メモ: ${c.memo}` : ''].filter(Boolean).join('\n')
const cardMd = (c: LinkCard) => [`[${cardTitle(c).replace(/[[\]]/g, '')}](${c.u})`, c.d ? `> ${c.d}` : '', c.memo ? `> メモ: ${c.memo}` : ''].filter(Boolean).join('\n')
function cardHtml(c: LinkCard) {
  const src = c.img?.startsWith('bnimg:') ? IMGS.get(c.img.slice(6)) : c.img
  return `<a class="card" href="${esc(c.u)}" target="_blank" rel="noopener">${src ? `<img src="${esc(src)}" alt="">` : ''}<span><small>${esc(c.s || hostOf(c.u))}</small><b>${esc(cardTitle(c))}</b>${c.d ? `<em>${esc(c.d)}</em>` : ''}<u>${esc(c.u)}</u>${c.memo ? `<i>メモ: ${esc(c.memo)}</i>` : ''}</span></a>`
}
const fileBase = (n: Note) => noteTitle(n).replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'note'
const day = (iso: string) => iso.slice(0, 10)

export function toText(n: Note) {
  const title = n.title.trim()
  const body = parseLines(n.body).map((l) => { const t = parseTable(l.text); const c = parseLink(l.text); return t ? tableToText(t) : c ? cardText(c) : txt(l.text) }).join('\n')
  return title ? `${title}\n\n${body}\n` : `${body}\n`
}

export function toMarkdown(n: Note, withMeta: boolean) {
  const title = n.title.trim()
  const meta = withMeta
    ? `---\ntitle: ${JSON.stringify(noteTitle(n))}\ncreated: ${n.createdAt}\nupdated: ${n.updatedAt}\napp: Bakeru Note V3.1\n---\n\n`
    : ''
  // 表の行は Markdown の表にする（前後に空行を入れないと表として読まれない）
  const body = n.body.split('\n').map((l) => { const t = parseTable(l); const c = parseLink(l); return t ? `\n${tableToMd(t)}\n` : c ? `\n${cardMd(c)}\n` : mdRefs(l) }).join('\n')
  return `${meta}${title ? `# ${title}\n\n` : ''}${body}\n`
}

export function toHtml(n: Note, fold: Fold, withToc: boolean) {
  const lines = parseLines(n.body)
  const heads = lines.map((l, i) => ({ ...l, i })).filter((l) => l.level > 0)
  const toc = withToc && heads.length
    ? `<nav class="toc"><p>目次</p><ul>${heads.map((h) => `<li style="margin-left:${(h.level - 1) * 1.2}em"><a href="#h${h.i}">${esc(h.text)}</a></li>`).join('')}</ul></nav>`
    : ''
  // 見出しごとに <details> で包む（深い見出しは中に入れ子）
  let html = ''
  const stack: number[] = []
  const closeTo = (level: number) => {
    while (stack.length && stack[stack.length - 1] >= level) { stack.pop(); html += '</div></details>' }
  }
  lines.forEach((l, i) => {
    if (l.level > 0) {
      if (fold === 'none') { html += `<h${l.level} id="h${i}">${htm(l.text)}</h${l.level}>`; return }
      closeTo(l.level)
      html += `<details${fold === 'open' ? ' open' : ''}><summary><h${l.level} id="h${i}">${htm(l.text)}</h${l.level}></summary><div class="sec">`
      stack.push(l.level)
      return
    }
    const t = parseTable(l.text)
    if (t) { html += tableToHtml(t); return }
    const card = parseLink(l.text)
    if (card) { html += cardHtml(card); return }
    html += l.text.trim() ? `<p>${htm(l.text)}</p>` : '<p class="gap"></p>'
  })
  closeTo(1)
  const title = esc(noteTitle(n))
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{max-width:760px;margin:40px auto;padding:0 16px;font:16px/1.9 "Hiragino Sans","Yu Gothic UI","Noto Sans JP",sans-serif;color:#222;background:#fdfcf9}
h1,h2,h3,h4{font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif;line-height:1.4;margin:1.2em 0 .4em}
h1{font-size:1.9em}h2{font-size:1.5em}h3{font-size:1.25em}h4{font-size:1.08em}
p{margin:0}p.gap{height:.9em}
summary{cursor:pointer;list-style-position:outside}summary>*{display:inline}
.sec{margin-left:.2em}
.toc{border:1px solid #ddd;border-radius:10px;padding:10px 16px;margin-bottom:24px;background:#fff}
.toc p{font-weight:700;margin:0 0 4px}.toc ul{margin:0;padding-left:1em}
.meta{color:#888;font-size:12px}
.ref{color:#9a6a3c;font-weight:600}
a.card{display:flex;gap:14px;margin:.8em 0;border:1px solid #ddd;border-radius:12px;overflow:hidden;color:inherit;text-decoration:none;background:#fff}a.card img{width:180px;object-fit:cover;flex:none}a.card>span{display:flex;flex-direction:column;gap:4px;padding:12px 14px;min-width:0}a.card small{color:#888}a.card b{font-size:1.05em}a.card em{font-style:normal;color:#555;font-size:.9em}a.card u{text-decoration:none;color:#999;font-size:.8em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}a.card i{font-style:normal;color:#9a6a3c;font-size:.85em}
@media (prefers-color-scheme:dark){a.card{background:#1b1e25;border-color:#333}a.card em{color:#bbb}}
table{border-collapse:collapse;width:100%;margin:.8em 0;table-layout:fixed}th,td{border:1px solid #ccc;padding:8px 10px;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{background:#f3f1ec}td img,th img{display:block;max-width:100%;border-radius:6px;margin:4px 0}
.c-h1,.c-h2,.c-h3,.c-h4{font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif;font-weight:700}.c-h1{font-size:1.4em}.c-h2{font-size:1.2em}.c-h3{font-size:1.08em}div.gap{height:.8em}
@media (prefers-color-scheme:dark){th,td{border-color:#3a3d45}th{background:#1f2229}}
@media (prefers-color-scheme:dark){body{background:#14161b;color:#e9e6de}.toc{background:#1b1e25;border-color:#333}}
</style></head><body>
<header><h1>${title}</h1><p class="meta">作成 ${day(n.createdAt)} ・ 更新 ${day(n.updatedAt)}</p></header>
${toc}
<main>${html}</main>
</body></html>
`
}

export function download(n: Note, kind: 'txt' | 'md' | 'html', text: string) {
  const mime = kind === 'html' ? 'text/html' : kind === 'md' ? 'text/markdown' : 'text/plain'
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileBase(n)}.${kind}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
