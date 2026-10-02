import { type Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { addPage, addWord, db, noteById, noteTitle, updateNote, type Note } from './store'
import { REF_RE, asUrl, cardFromUrl, fetchPreview, fetchPreviewImage, hostOf, isPlaceholderTitle, linkLine, parseLink, refToken, type LinkCard } from './links'
import { parseLines, type Line } from './exportNote'
import { even, newTable, normalize, parseTable, tableLine, type TableData } from './table'
import { IMG_TOKEN, imageUrl, imgToken, isImageFile, putImage } from './imageStore'

// 本文の編集面。1行＝1つの <div class="bn-line" data-h="0〜4">。保存は「# 見出し」の Markdown 文字列。
// 見出しは Ctrl/Alt+0〜4。表は1行ぶんの部品（<div class="bn-line bn-tbl">）で、セル（.bn-cell）の中も同じ行の作り。
// 行の操作は「行の要素」で行うので、本文でもセルの中でも同じように効く。

export type EditorApi = {
  insertText: (text: string) => void
  symbol: (id: string) => void
  jumpTo: (lineIndex: number) => void
  /** 書式バーの操作（h1〜h4・h0・heading・bullet・number・check・quote・indent・outdent・divider・bold・undo・redo・table） */
  format: (id: string) => void
  /** しおり用: いまの場所（本文の何行目・何文字目・縦の位置） */
  getPos: () => { line: number; offset: number; scroll: number }
  /** しおり用: その場所へ戻る（行を一瞬光らせる） */
  goPos: (p: { line: number; offset: number; scroll: number }) => void
}

type Props = {
  note: Note
  onReady: (api: EditorApi) => void
  onCaretLine: (index: number) => void
  onToast: (text: string) => void
  /** アプリ内リンク・逆リンクを押した時（2カラムなら隣の列で開くなど、開き方は画面が決める） */
  onOpenRef?: (pageId: string) => void
}

// ノートを切り替えて戻ったときに、スクロールとカーソルを戻す（この画面を開いている間だけ覚える）
const memory = new Map<string, { scroll: number; line: number; offset: number; flash?: boolean }>()
/** まだ開いていないページを、この場所から開かせる（しおりを読む時） */
export function primeMemory(pageId: string, p: { line: number; offset: number; scroll: number }) {
  memory.set(pageId, { ...p, flash: true })
}

const MARK = /^( *)(- |\d+\. |☐ |☑ |> )?/
const SLASH_TABLE = /^[/／]\s*([1-3１-３])$/

/** 写真の行（セルの中）。押すと拡大、× で消す。中身は書き換えさせない */
function imgLineEl(id: string) {
  const d = document.createElement('div')
  d.className = 'bn-line bn-imgline'
  d.dataset.h = '0'
  d.dataset.img = id
  d.contentEditable = 'false'
  const img = document.createElement('img')
  img.className = 'bn-img'
  img.alt = '写真'
  img.draggable = false
  void imageUrl(id).then((u) => { if (u) img.src = u; else d.classList.add('missing') })
  const x = document.createElement('button')
  x.type = 'button'
  x.className = 'bn-img-x'
  x.textContent = '×'
  x.title = '写真を消す'
  x.setAttribute('aria-label', '写真を消す')
  d.append(img, x)
  return d
}

// ---- アプリ内リンク（メンション）: 文の中の小さな札。名前はいまのページ名 ----
const refName = (id: string) => { const p = noteById(id); return p ? noteTitle(p) : '（消えたページ）' }
function refEl(id: string) {
  const s = document.createElement('span')
  s.className = 'bn-ref'
  s.contentEditable = 'false'
  s.dataset.ref = id
  s.textContent = refName(id)
  if (!noteById(id)) s.classList.add('missing')
  s.title = 'このページを開く'
  return s
}
/** 文字とリンクの札を並べる */
function fillText(d: HTMLElement, text: string) {
  let last = 0
  for (const m of text.matchAll(REF_RE)) {
    if (m.index! > last) d.appendChild(document.createTextNode(text.slice(last, m.index)))
    d.appendChild(refEl(m[1]))
    last = m.index! + m[0].length
  }
  if (last < text.length) d.appendChild(document.createTextNode(text.slice(last)))
}

// ---- 外部リンクのカード（1行ぶんの部品）。押すとブラウザで開く。✎で手で直す ----
const el = (tag: string, cls: string, text?: string) => { const e = document.createElement(tag); e.className = cls; if (text) e.textContent = text; return e }
function renderLink(wrap: HTMLElement, c: LinkCard) {
  wrap.dataset.link = JSON.stringify(c)
  const view = el('div', 'bn-lc-view')
  view.dataset.act = 'open'
  view.title = `${c.u} を開く`
  const pic = el('div', 'bn-lc-img')
  if (c.img) {
    const img = document.createElement('img')
    img.alt = ''
    img.draggable = false
    img.referrerPolicy = 'no-referrer'
    if (c.img.startsWith('bnimg:')) void imageUrl(c.img.slice(6)).then((u) => { if (u) img.src = u })
    else img.src = c.img
    img.onerror = () => { pic.classList.add('none'); img.remove() }
    pic.appendChild(img)
  } else pic.classList.add('none')
  pic.appendChild(el('span', 'bn-lc-initial', [...(c.s || hostOf(c.u))][0]?.toUpperCase() ?? '🔗'))
  const tx = el('div', 'bn-lc-text')
  const site = el('div', 'bn-lc-site')
  site.append(el('span', 'bn-lc-badge', [...(c.s || hostOf(c.u))][0]?.toUpperCase() ?? ''), el('span', '', c.s || hostOf(c.u)))
  tx.append(site, el('div', 'bn-lc-title', c.t || hostOf(c.u)))
  if (c.d) tx.appendChild(el('div', 'bn-lc-desc', c.d))
  tx.appendChild(el('div', 'bn-lc-url', c.u))
  if (c.memo) tx.appendChild(el('div', 'bn-lc-memo', c.memo))
  view.append(pic, tx)
  const tools = el('div', 'bn-lc-tools')
  for (const [act, label, title] of [['fetch', '↻', 'サイトから自動で取り直す'], ['edit', '✎', '手で直す（タイトル・説明・画像・メモ）'], ['del', '×', 'カードを消す']]) {
    const b = el('button', act === 'del' ? 'danger' : '', label) as HTMLButtonElement
    b.type = 'button'
    b.dataset.act = act
    b.title = title
    b.setAttribute('aria-label', title)
    tools.appendChild(b)
  }
  const kids: HTMLElement[] = [view, tools]
  if (wrap.classList.contains('editing')) {
    const f = el('div', 'bn-lc-form')
    const field = (name: keyof LinkCard, label: string, multi = false) => {
      const lab = el('label', '', label)
      const inp = document.createElement(multi ? 'textarea' : 'input') as HTMLInputElement
      inp.dataset.field = name
      inp.value = String(c[name] ?? '')
      lab.appendChild(inp)
      return lab
    }
    const row = el('div', 'bn-lc-form-row')
    for (const [act, label] of [['img', '画像を選ぶ'], ['imgx', '画像を外す'], ['done', '完了']]) {
      const b = el('button', act === 'done' ? 'v21-btn primary' : 'v21-btn', label) as HTMLButtonElement
      b.type = 'button'
      b.dataset.act = act
      row.appendChild(b)
    }
    f.append(field('u', 'URL'), field('t', 'タイトル'), field('d', '説明', true), field('s', 'サイト名'), field('memo', '自分用のメモ', true), row)
    kids.push(f)
  }
  wrap.replaceChildren(...kids)
}
function linkEl(c: LinkCard, editing = false) {
  const d = el('div', 'bn-line bn-linkcard')
  d.dataset.h = '0'
  d.contentEditable = 'false'
  if (editing) d.classList.add('editing')
  renderLink(d, c)
  return d
}

const lineEl = (l: Line) => {
  const im = l.level === 0 ? l.text.match(IMG_TOKEN) : null
  if (im) return imgLineEl(im[1])
  const card = l.level === 0 ? parseLink(l.text) : null
  if (card) return linkEl(card)
  const d = document.createElement('div')
  d.className = 'bn-line'
  d.dataset.h = String(l.level)
  if (l.text) fillText(d, l.text)
  else d.appendChild(document.createElement('br'))
  return d
}

/** 1つのブロックの中を行に分ける（貼り付けで <br> や <div> が入った時用） */
function splitBlock(node: Node): string[] {
  const out = ['']
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) { out[out.length - 1] += (n.textContent ?? '').replace(/​/g, ''); return }
    const el = n as HTMLElement
    if (el.tagName === 'BR') { out.push(''); return }
    if (el.classList?.contains('bn-ref')) { out[out.length - 1] += refToken(el.dataset.ref!); return }
    const block = /^(DIV|P|LI|H[1-6])$/.test(el.tagName)
    if (block && out[out.length - 1] !== '') out.push('')
    el.childNodes.forEach(walk)
    if (block && out[out.length - 1] !== '') out.push('')
  }
  if (node.nodeType === Node.ELEMENT_NODE) (node as HTMLElement).childNodes.forEach(walk)
  else walk(node)
  // 末尾の <br> だけの空行は、空の1行として数えない
  while (out.length > 1 && out[out.length - 1] === '') out.pop()
  return out
}

const isTbl = (n: Node | null): boolean => n instanceof HTMLElement && n.classList.contains('bn-tbl')
const isCell = (n: Node | null): boolean => n instanceof HTMLElement && n.classList.contains('bn-cell')
const isImgLine = (n: Node | null): boolean => n instanceof HTMLElement && n.classList.contains('bn-imgline')
const isLinkCard = (n: Node | null): boolean => n instanceof HTMLElement && n.classList.contains('bn-linkcard')
const isRef = (n: Node | null): boolean => n instanceof HTMLElement && n.classList.contains('bn-ref')
const plainLine = (n: Node) => {
  if (isImgLine(n)) return true
  if (!(n instanceof HTMLDivElement) || !n.classList.contains('bn-line') || isTbl(n) || isLinkCard(n)) return false
  const kids = Array.from(n.childNodes)
  return kids.every((k) => k.nodeType === Node.TEXT_NODE || isRef(k)) || (kids.length === 1 && (kids[0] as HTMLElement).tagName === 'BR')
}
/** 箱（本文 or セル）の中が「行の div だけ」になっているか。本文では表とリンクのカードも許す */
const isCanonical = (box: HTMLElement, allowTable: boolean) =>
  box.childNodes.length > 0 && Array.from(box.childNodes).every((n) => plainLine(n) || (allowTable && (isTbl(n) || isLinkCard(n))))

const NoteEditor: Component<Props> = (props) => {
  let root!: HTMLDivElement
  let scroller!: HTMLDivElement
  let lastRange: Range | null = null
  // 閉じる時に DOM が外れていても覚えておけるよう、動くたびに控える
  let lastPos = { line: 0, offset: 0 }
  let lastScroll = 0
  let curEl: HTMLElement | undefined
  const [mark, setMark] = createSignal<{ x: number; y: number; text: string } | null>(null)
  // 行の種類のメニュー（左の H1・¶ を押すと出る）。ブロックの概念は持ち込まず、行の頭の印と見出しを変えるだけ
  const [typeMenu, setTypeMenu] = createSignal<{ el: HTMLElement; x: number; y: number; cur: string } | null>(null)

  const topLines = () => Array.from(root.children) as HTMLElement[]
  const isBox = (el: Element | null) => el === root || isCell(el)
  /** node を含む「行」（本文の行か、セルの中の行） */
  function lineOf(node: Node | null, offset = 0): HTMLElement | null {
    if (node instanceof HTMLElement && isBox(node)) {
      const kids = node.children
      return (kids[Math.min(offset, kids.length - 1)] as HTMLElement) ?? null
    }
    let n: Node | null = node
    while (n && n !== root) {
      if (n instanceof HTMLElement && n.classList.contains('bn-line') && isBox(n.parentElement)) return n
      n = n.parentNode
    }
    return null
  }
  /** 本文の何行目か（セルの中なら、その表の行） */
  function topIndex(el: Element | null) {
    let n: Element | null = el
    while (n && n.parentElement !== root) n = n.parentElement
    return n ? topLines().indexOf(n as HTMLElement) : -1
  }

  // ---- 読む・書く ----
  function readBox(box: HTMLElement): Line[] {
    const out: Line[] = []
    box.childNodes.forEach((n) => {
      if (isTbl(n)) { out.push({ level: 0, text: tableLine(readTable(n as HTMLElement)) }); return }
      if (isImgLine(n)) { out.push({ level: 0, text: imgToken((n as HTMLElement).dataset.img!) }); return }
      if (isLinkCard(n)) { out.push({ level: 0, text: linkLine(JSON.parse((n as HTMLElement).dataset.link || '{"u":""}')) }); return }
      const level = n instanceof HTMLElement ? Math.min(4, Number(n.dataset.h || 0)) : 0
      splitBlock(n).forEach((text, i) => out.push({ level: i === 0 ? level : 0, text }))
    })
    return out.length ? out : [{ level: 0, text: '' }]
  }
  const serialize = (ls: Line[]) => ls.map((l) => (l.level ? `${'#'.repeat(l.level)} ${l.text}` : l.text)).join('\n')
  function readTable(tbl: HTMLElement): TableData {
    const rows = Array.from(tbl.querySelectorAll('tr')).map((tr) => Array.from(tr.querySelectorAll<HTMLElement>('.bn-cell')).map((c) => serialize(readBox(c))))
    let w: number[] = []
    try { w = JSON.parse(tbl.dataset.w || '[]') } catch { /* 幅は均等に */ }
    const cols = rows[0]?.length ?? 1
    return { w: w.length === cols ? w : even(cols), r: rows }
  }
  function fill(box: HTMLElement, ls: Line[]) {
    box.replaceChildren(...(ls.length ? ls : [{ level: 0, text: '' }]).map((l) => {
      if (box === root) {
        const t = parseTable(l.text)
        if (t) return buildTable(t)
      }
      return lineEl(l)
    }))
  }
  function save() {
    updateNote(props.note.id, { body: serialize(readBox(root)) })
  }

  // ---- カーソル ----
  /** カーソルのある行と、その行の何文字目か */
  function caretAt(): { el: HTMLElement; offset: number } | null {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !root.contains(sel.anchorNode)) return null
    const el = lineOf(sel.anchorNode, sel.anchorOffset)
    if (!el || isTbl(el) || isLinkCard(el)) return null
    const r = document.createRange()
    r.setStart(el, 0)
    try { r.setEnd(sel.anchorNode!, sel.anchorOffset) } catch { return { el, offset: 0 } }
    return { el, offset: r.toString().length }
  }
  /** 行の何文字目かを、Range の始点にする */
  function pointRange(el: HTMLElement, offset: number): Range {
    const r = document.createRange()
    let rest = offset
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let t: Node | null = walker.nextNode()
    let placed = false
    while (t) {
      const len = t.textContent?.length ?? 0
      if (rest <= len) { r.setStart(t, rest); placed = true; break }
      rest -= len
      t = walker.nextNode()
    }
    if (!placed) { r.selectNodeContents(el); r.collapse(false) }
    r.collapse(true)
    return r
  }
  function setCaret(el: HTMLElement | undefined, offset: number) {
    if (!el) return
    if (isTbl(el)) { const c = el.querySelector<HTMLElement>('.bn-cell .bn-line'); if (c) el = c; else return }
    const host = el.closest('.bn-cell') as HTMLElement | null
    ;(host ?? root).focus({ preventScroll: true })
    const r = pointRange(el, offset)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
    lastRange = r.cloneRange()
  }
  const END = Number.MAX_SAFE_INTEGER
  const currentLine = () => caretAt()?.el

  function reportCaret() {
    const c = caretAt()
    if (!c) return
    const top = topIndex(c.el)
    if (c.el.parentElement === root) lastPos = { line: top, offset: c.offset }
    props.onCaretLine(top)
    // カーソルの行に印（本文の行にも ¶ を出して、種類を変えられると分かるように）
    if (c.el !== curEl) { curEl?.classList.remove('cur'); c.el.classList.add('cur'); curEl = c.el }
  }

  function setLevel(level: number) {
    const el = currentLine()
    if (!el) return
    const cur = Number(el.dataset.h || 0)
    el.dataset.h = String(cur === level ? 0 : level)
    save()
  }

  // ---- 書式バー: 行の頭の印（- ・1. ・☐ ・> ・字下げ）を付け外しする。保存は印つきの文字列のまま ----
  const textOf = (el: HTMLElement) => el.textContent ?? ''
  /** 行の頭の n 文字を text に置き換える（元に戻すが効くよう execCommand で） */
  function replaceHead(el: HTMLElement, n: number, text: string) {
    const a = pointRange(el, 0)
    const b = pointRange(el, n)
    const sel = window.getSelection()
    const r = document.createRange()
    r.setStart(a.startContainer, a.startOffset)
    r.setEnd(b.startContainer, b.startOffset)
    sel?.removeAllRanges()
    sel?.addRange(r)
    if (n === 0 && text === '') return
    if (text === '') document.execCommand('delete')
    else document.execCommand('insertText', false, text)
  }
  /** 選んでいる行（同じ箱の中だけ。選択なしならカーソルの行） */
  function selectedLines(): HTMLElement[] {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !root.contains(sel.anchorNode)) return []
    const a = lineOf(sel.anchorNode, sel.anchorOffset)
    const b = lineOf(sel.focusNode, sel.focusOffset)
    if (!a || isTbl(a)) return []
    if (!b || b.parentElement !== a.parentElement) return [a]
    const kids = Array.from(a.parentElement!.children) as HTMLElement[]
    const i = kids.indexOf(a)
    const j = kids.indexOf(b)
    return kids.slice(Math.min(i, j), Math.max(i, j) + 1).filter((el) => !isTbl(el) && !isImgLine(el))
  }
  function toggleMark(kind: 'bullet' | 'number' | 'check' | 'quote', only?: HTMLElement[]) {
    const ls = only ?? selectedLines()
    if (!ls.length) return
    const mk = (i: number) => (kind === 'bullet' ? '- ' : kind === 'check' ? '☐ ' : kind === 'quote' ? '> ' : `${i}. `)
    const has = (t: string) => {
      const k = t.match(MARK)![2] ?? ''
      return kind === 'bullet' ? k === '- ' : kind === 'check' ? k === '☐ ' || k === '☑ ' : kind === 'quote' ? k === '> ' : /^\d+\. $/.test(k)
    }
    const allOn = ls.every((el) => has(textOf(el)))
    ls.forEach((el, n) => {
      const m = textOf(el).match(MARK)!
      const head = m[1].length + (m[2] ?? '').length
      replaceHead(el, head, allOn ? m[1] : m[1] + mk(n + 1))
    })
  }
  function shift(dir: 1 | -1) {
    for (const el of selectedLines()) {
      const sp = (textOf(el).match(/^ */) ?? [''])[0].length
      if (dir === 1) replaceHead(el, 0, '  ')
      else if (sp) replaceHead(el, Math.min(2, sp), '')
    }
  }

  // ---- 表 ----
  let lastCell: HTMLElement | null = null
  function cellEl(text: string) {
    const td = document.createElement('td')
    const c = document.createElement('div')
    c.className = 'bn-cell'
    c.contentEditable = 'true'
    c.spellcheck = false
    fill(c, parseLines(text))
    td.appendChild(c)
    return td
  }
  function setWidths(tbl: HTMLElement, w: number[], grips = true) {
    tbl.dataset.w = JSON.stringify(w)
    const cg = tbl.querySelector('colgroup')!
    cg.replaceChildren(...w.map((x) => { const col = document.createElement('col'); col.style.width = `${(x * 100).toFixed(2)}%`; return col }))
    if (grips) placeGrips(tbl, w)
  }
  // ---- 列の幅: 列の境目のつまみをドラッグ（指でも）。ダブルクリックで隣どうしを同じ幅に ----
  const MIN_COL = 0.08
  function placeGrips(tbl: HTMLElement, w: number[]) {
    const scroll = tbl.querySelector('.bn-tbl-scroll') as HTMLElement
    scroll.querySelectorAll('.bn-col-grip').forEach((g) => g.remove())
    let acc = 0
    w.slice(0, -1).forEach((x, i) => {
      acc += x
      const g = document.createElement('span')
      g.className = 'bn-col-grip'
      g.style.left = `${(acc * 100).toFixed(2)}%`
      g.title = '左右にドラッグで列の幅を変える（ダブルクリックで同じ幅に）'
      g.addEventListener('pointerdown', (e) => startResize(e, tbl, i))
      g.addEventListener('dblclick', () => {
        const cur: number[] = JSON.parse(tbl.dataset.w || '[]')
        const avg = (cur[i] + cur[i + 1]) / 2
        cur[i] = avg
        cur[i + 1] = avg
        setWidths(tbl, cur)
        save()
      })
      scroll.appendChild(g)
    })
  }
  function startResize(e: PointerEvent, tbl: HTMLElement, i: number) {
    e.preventDefault()
    e.stopPropagation()
    const grip = e.currentTarget as HTMLElement
    try { grip.setPointerCapture(e.pointerId) } catch { /* 取れなくても動く */ }
    const table = tbl.querySelector('table') as HTMLElement
    const start: number[] = JSON.parse(tbl.dataset.w || '[]')
    const sx = e.clientX
    const total = table.getBoundingClientRect().width || 1
    grip.classList.add('on')
    tbl.classList.add('resizing')
    const move = (ev: PointerEvent) => {
      const pair = start[i] + start[i + 1]
      const a = Math.min(pair - MIN_COL, Math.max(MIN_COL, start[i] + (ev.clientX - sx) / total))
      const w = [...start]
      w[i] = a
      w[i + 1] = pair - a
      setWidths(tbl, w, false)
      // つまみ自身は動かし続ける（作り直すとドラッグが切れる）
      grip.style.left = `${(w.slice(0, i + 1).reduce((s, x) => s + x, 0) * 100).toFixed(2)}%`
    }
    const up = () => {
      grip.removeEventListener('pointermove', move)
      grip.removeEventListener('pointerup', up)
      grip.removeEventListener('pointercancel', up)
      tbl.classList.remove('resizing')
      placeGrips(tbl, JSON.parse(tbl.dataset.w || '[]'))
      save()
    }
    grip.addEventListener('pointermove', move)
    grip.addEventListener('pointerup', up)
    grip.addEventListener('pointercancel', up)
  }
  const toolBtn = (label: string, title: string, fn: () => void, danger = false) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.title = title
    b.setAttribute('aria-label', title)
    if (danger) b.className = 'danger'
    b.addEventListener('pointerdown', (e) => e.preventDefault())
    b.addEventListener('click', fn)
    return b
  }
  function buildTable(t: TableData): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'bn-line bn-tbl'
    wrap.dataset.h = '0'
    wrap.contentEditable = 'false'
    const scroll = document.createElement('div')
    scroll.className = 'bn-tbl-scroll'
    const table = document.createElement('table')
    table.className = 'bn-table'
    table.appendChild(document.createElement('colgroup'))
    const tbody = document.createElement('tbody')
    for (const row of t.r) {
      const tr = document.createElement('tr')
      row.forEach((c) => tr.appendChild(cellEl(c)))
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    scroll.appendChild(table)
    const bar = document.createElement('div')
    bar.className = 'bn-tbl-bar'
    bar.setAttribute('role', 'toolbar')
    bar.setAttribute('aria-label', '表の操作')
    bar.append(
      toolBtn('写真', 'このセルに写真を入れる（ファイル・ギャラリーから）', () => pickPhotos(wrap)),
      toolBtn('＋行', '下に行を足す', () => tableOp(wrap, 'addRow')),
      toolBtn('＋列', '右に列を足す', () => tableOp(wrap, 'addCol')),
      toolBtn('−行', 'この行を消す', () => tableOp(wrap, 'delRow')),
      toolBtn('−列', 'この列を消す', () => tableOp(wrap, 'delCol')),
      toolBtn('表を消す', '表をまるごと消す', () => tableOp(wrap, 'delete'), true),
    )
    wrap.append(bar, scroll)
    setWidths(wrap, t.w)
    return wrap
  }
  /** いまのセル（無ければ、その表の左上） */
  function cellIn(tbl: HTMLElement) {
    const c = lastCell && tbl.contains(lastCell) ? lastCell : tbl.querySelector<HTMLElement>('.bn-cell')!
    const td = c.parentElement as HTMLTableCellElement
    const tr = td.parentElement as HTMLTableRowElement
    return { c, col: td.cellIndex, row: tr.rowIndex, tr }
  }
  const focusCell = (c: HTMLElement | null | undefined, atEnd = true) => {
    if (!c) return
    const ls = Array.from(c.children) as HTMLElement[]
    setCaret(atEnd ? ls[ls.length - 1] : ls[0], atEnd ? END : 0)
    lastCell = c
  }
  function tableOp(tbl: HTMLElement, op: 'addRow' | 'addCol' | 'delRow' | 'delCol' | 'delete') {
    const rows = Array.from(tbl.querySelectorAll('tr'))
    const cols = rows[0]?.cells.length ?? 1
    const { col, row, tr } = cellIn(tbl)
    let w: number[] = JSON.parse(tbl.dataset.w || '[]')
    if (op === 'delete' || (op === 'delRow' && rows.length === 1) || (op === 'delCol' && cols === 1)) {
      const next = (tbl.nextElementSibling ?? tbl.previousElementSibling) as HTMLElement | null
      tbl.remove()
      if (!root.children.length) root.appendChild(lineEl({ level: 0, text: '' }))
      setCaret(next ?? (root.lastElementChild as HTMLElement), next ? 0 : END)
      props.onToast('表を消しました')
    } else if (op === 'addRow') {
      const nr = document.createElement('tr')
      for (let i = 0; i < cols; i++) nr.appendChild(cellEl(''))
      tr.after(nr)
      focusCell(nr.querySelector<HTMLElement>(`td:nth-child(${col + 1}) .bn-cell`), false)
    } else if (op === 'addCol') {
      rows.forEach((r) => r.cells[col].after(cellEl('')))
      const share = 1 / (cols + 1)
      w = w.map((x) => x * (1 - share))
      w.splice(col + 1, 0, share)
      setWidths(tbl, normalize(w))
      focusCell(tr.cells[col + 1].querySelector<HTMLElement>('.bn-cell'), false)
    } else if (op === 'delRow') {
      const target = rows[row + 1] ?? rows[row - 1]
      tr.remove()
      focusCell(target.cells[col].querySelector<HTMLElement>('.bn-cell'))
    } else if (op === 'delCol') {
      rows.forEach((r) => r.cells[col].remove())
      w.splice(col, 1)
      setWidths(tbl, normalize(w))
      focusCell(tr.cells[Math.min(col, cols - 2)].querySelector<HTMLElement>('.bn-cell'))
    }
    save()
  }
  /** 表を入れる。空の行ならその行を表にし、文字のある行ならその下に入れる。表の下には必ず書ける行を残す */
  function insertTable(at: HTMLElement | undefined, cols: number) {
    let anchor = at
    if (anchor && anchor.parentElement !== root) anchor = root.children[topIndex(anchor)] as HTMLElement
    const tbl = buildTable(newTable(cols))
    if (anchor && plainLine(anchor) && !textOf(anchor).trim()) anchor.replaceWith(tbl)
    else if (anchor) anchor.after(tbl)
    else root.appendChild(tbl)
    if (!tbl.nextElementSibling || isTbl(tbl.nextElementSibling)) tbl.after(lineEl({ level: 0, text: '' }))
    focusCell(tbl.querySelector<HTMLElement>('.bn-cell'), false)
    save()
    props.onToast(`${cols}列の表を入れました（Tab で次のセル）`)
  }
  /** セルの中のキー: Tab＝次のセル（最後なら行を足す）・上下の端で表の外へ */
  // ---- 写真（セルの中だけ）。貼り付け・ドラッグ&ドロップ・「写真」ボタン ----
  const [dropHint, setDropHint] = createSignal<{ x: number; y: number; w: number } | null>(null)
  const [viewer, setViewer] = createSignal<string | null>(null)
  let dropCell: HTMLElement | null = null
  /** 写真をセルに入れる。before があればその行の前、無ければ after の行の後（どちらも無ければセルの最後） */
  async function insertImages(cell: HTMLElement, files: File[], at?: { before?: Element | null; after?: Element | null }) {
    const imgs = files.filter(isImageFile)
    if (!imgs.length) return
    props.onToast(imgs.length > 1 ? `写真を${imgs.length}枚入れています…` : '写真を入れています…')
    let ref: Element | null = at?.after ?? null
    for (const f of imgs) {
      try {
        const id = await putImage(f)
        const el = imgLineEl(id)
        if (at?.before && !ref) at.before.before(el)
        else if (ref) ref.after(el)
        else cell.appendChild(el)
        ref = el
      } catch {
        props.onToast('この写真は読み込めませんでした')
      }
    }
    // 写真の下に、続きを書ける行を残す
    if (ref && (!ref.nextElementSibling || isImgLine(ref.nextElementSibling))) ref.after(lineEl({ level: 0, text: '' }))
    // 写真だけで空になった最初の行は片付ける
    const first = cell.firstElementChild as HTMLElement | null
    if (first && !isImgLine(first) && !textOf(first) && first.nextElementSibling && isImgLine(first.nextElementSibling)) first.remove()
    lastCell = cell
    save()
    props.onToast('写真を入れました（押すと大きく見られます）')
  }
  function pickPhotos(tbl: HTMLElement) {
    const { c } = cellIn(tbl)
    const after = lineOf(lastRange?.startContainer ?? null)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => { void insertImages(c, Array.from(input.files ?? []), { after: after && c.contains(after) ? after : null }) }
    input.click()
  }
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')
  /** 落とす場所: セルの中で、指・マウスの高さに一番近い行の前か後ろ。金の線で見せる */
  function dropAt(e: DragEvent) {
    const cell = (e.target as HTMLElement).closest?.('.bn-cell') as HTMLElement | null
    if (!cell) return null
    const kids = Array.from(cell.children) as HTMLElement[]
    const before = kids.find((k) => { const r = k.getBoundingClientRect(); return e.clientY < r.top + r.height / 2 }) ?? null
    return { cell, before }
  }
  function onDragOver(e: DragEvent) {
    if (!hasFiles(e)) return
    e.preventDefault()
    const at = dropAt(e)
    if (dropCell && dropCell !== at?.cell) dropCell.parentElement?.classList.remove('drop-on')
    if (!at) { setDropHint(null); dropCell = null; if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; return }
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    dropCell = at.cell
    at.cell.parentElement?.classList.add('drop-on')
    const box = scroller.getBoundingClientRect()
    const cr = at.cell.getBoundingClientRect()
    const y = at.before ? at.before.getBoundingClientRect().top : (at.cell.lastElementChild ?? at.cell).getBoundingClientRect().bottom
    setDropHint({ x: cr.left - box.left + 8, y: y - box.top + scroller.scrollTop, w: cr.width - 16 })
  }
  function clearDrop() {
    dropCell?.parentElement?.classList.remove('drop-on')
    dropCell = null
    setDropHint(null)
  }
  function onDragLeave(e: DragEvent) {
    if (!root.contains(e.relatedTarget as Node)) clearDrop()
  }
  function onDrop(e: DragEvent) {
    if (!hasFiles(e)) return
    e.preventDefault()
    const at = dropAt(e)
    clearDrop()
    const files = Array.from(e.dataTransfer?.files ?? [])
    if (!at) { props.onToast('写真は表のセルに入れられます（/1 と Enter で1列の表）'); return }
    void insertImages(at.cell, files, { before: at.before })
  }
  /** 写真を押す＝拡大、× ＝消す */
  function onEditorClick(e: MouseEvent) {
    const t = e.target as HTMLElement
    // アプリ内リンクの札: そのページを開く
    const ref = t.closest?.('.bn-ref') as HTMLElement | null
    if (ref) {
      e.preventDefault()
      if (noteById(ref.dataset.ref!)) props.onOpenRef?.(ref.dataset.ref!)
      else props.onToast('リンク先のページは消えています')
      return
    }
    // 外部リンクのカード
    const card = t.closest?.('.bn-linkcard') as HTMLElement | null
    if (card) { cardAction(card, (t.closest('[data-act]') as HTMLElement | null)?.dataset.act); return }
    const line = t.closest?.('.bn-imgline') as HTMLElement | null
    if (line && t.classList.contains('bn-img-x')) {
      const cell = line.parentElement as HTMLElement
      line.remove()
      if (!cell.children.length) cell.appendChild(lineEl({ level: 0, text: '' }))
      save()
      props.onToast('写真を消しました')
      return
    }
    if (line && t.classList.contains('bn-img')) { setViewer((t as HTMLImageElement).src); return }
    reportCaret()
  }

  function cellKey(e: KeyboardEvent, cell: HTMLElement): boolean {
    const tbl = cell.closest('.bn-tbl') as HTMLElement
    const cells = Array.from(tbl.querySelectorAll<HTMLElement>('.bn-cell'))
    const i = cells.indexOf(cell)
    if (e.key === 'Tab') {
      e.preventDefault()
      lastCell = cell
      if (e.shiftKey) { if (i > 0) focusCell(cells[i - 1]); return true }
      if (i < cells.length - 1) focusCell(cells[i + 1])
      else tableOp(tbl, 'addRow')
      return true
    }
    const c = caretAt()
    if (!c) return false
    const td = cell.parentElement as HTMLTableCellElement
    const tr = td.parentElement as HTMLTableRowElement
    const rows = tbl.querySelectorAll('tr')
    if (e.key === 'ArrowDown' && c.el === cell.lastElementChild && tr === rows[rows.length - 1]) {
      e.preventDefault()
      let next = tbl.nextElementSibling as HTMLElement | null
      if (!next || isTbl(next)) { next = lineEl({ level: 0, text: '' }); tbl.after(next) }
      setCaret(next, 0)
      return true
    }
    if (e.key === 'ArrowUp' && c.el === cell.firstElementChild && tr === rows[0]) {
      e.preventDefault()
      let prev = tbl.previousElementSibling as HTMLElement | null
      if (!prev || isTbl(prev)) { prev = lineEl({ level: 0, text: '' }); tbl.before(prev) }
      setCaret(prev, END)
      return true
    }
    // 空のセルで Backspace: セルの最後の1行は消さない（消すと書けなくなる）
    if (e.key === 'Backspace' && cell.children.length === 1 && !textOf(cell).length) { e.preventDefault(); return true }
    return false
  }

  function format(id: string) {
    restore()
    const h = id.match(/^h([0-4])$/)
    if (h) { setLevel(Number(h[1])); return }
    if (id === 'heading') {
      const el = currentLine()
      if (!el) return
      el.dataset.h = String((Number(el.dataset.h || 0) + 1) % 5)
      save()
    } else if (id === 'bullet' || id === 'number' || id === 'check' || id === 'quote') toggleMark(id)
    else if (id === 'indent') shift(1)
    else if (id === 'outdent') shift(-1)
    else if (id === 'table') { insertTable(currentLine(), 3); return }
    else if (id === 'link') { insertLinkCard(currentLine(), { u: '', t: '', d: '', s: '' }, true); return }
    else if (id === 'mention') { document.execCommand('insertText', false, '@'); checkTrigger(); return }
    else if (id === 'divider') {
      const el = currentLine()
      if (!el) return
      replaceHead(el, 0, '')
      document.execCommand('insertText', false, '---')
      document.execCommand('insertParagraph')
    } else if (id === 'bold') {
      const inner = window.getSelection()?.toString() ?? ''
      document.execCommand('insertText', false, `**${inner}**`)
      const c = caretAt()
      if (c && !inner) setCaret(c.el, c.offset - 2)
    } else if (id === 'undo') document.execCommand('undo')
    else if (id === 'redo') document.execCommand('redo')
    save()
    reportCaret()
  }

  // ---- 行の種類（本文・H1〜H4・箇条書き・番号・チェック・引用） ----
  const TYPES: Array<{ id: string; label: string; hint: string }> = [
    { id: 'p', label: '¶', hint: '本文' },
    { id: 'h1', label: 'H1', hint: '見出し1' },
    { id: 'h2', label: 'H2', hint: '見出し2' },
    { id: 'h3', label: 'H3', hint: '見出し3' },
    { id: 'h4', label: 'H4', hint: '見出し4' },
    { id: 'bullet', label: '•', hint: '箇条書き' },
    { id: 'number', label: '1.', hint: '番号付き' },
    { id: 'check', label: '☐', hint: 'チェック' },
    { id: 'quote', label: '❝', hint: '引用' },
  ]
  function typeOf(el: HTMLElement) {
    const h = Number(el.dataset.h || 0)
    if (h) return `h${h}`
    const k = textOf(el).match(MARK)?.[2] ?? ''
    return k === '- ' ? 'bullet' : /^\d+\. $/.test(k) ? 'number' : k === '☐ ' || k === '☑ ' ? 'check' : k === '> ' ? 'quote' : 'p'
  }
  function setType(el: HTMLElement, kind: string) {
    setTypeMenu(null)
    setCaret(el, END)
    if (typeOf(el) === kind) return
    const m = textOf(el).match(MARK)!
    // 今の印を外す（字下げは残す）
    if (m[2]) replaceHead(el, m[0].length, m[1])
    const h = kind.match(/^h([1-4])$/)
    el.dataset.h = h ? h[1] : '0'
    if (kind === 'bullet' || kind === 'number' || kind === 'check' || kind === 'quote') toggleMark(kind, [el])
    save()
    setCaret(el, END)
    reportCaret()
  }
  /** 行の左（H1・¶ の所）を押したら、種類のメニューを出す */
  function onGutterDown(e: PointerEvent) {
    const el = lineOf(e.target as Node)
    if (!el || isTbl(el)) return
    const r = el.getBoundingClientRect()
    if (e.clientX >= r.left - 2) return
    e.preventDefault()
    if (typeMenu()?.el === el) { setTypeMenu(null); return }
    const box = scroller.getBoundingClientRect()
    setTypeMenu({ el, x: Math.max(8, r.left - box.left - 24), y: r.top - box.top + scroller.scrollTop + Math.min(r.height, 48) + 4, cur: typeOf(el) })
  }
  function closeTypeMenu(e: PointerEvent) {
    if (!typeMenu()) return
    const t = e.target as HTMLElement
    if (t.closest?.('.bn-type-menu')) return
    const line = lineOf(t)
    if (line && e.clientX < line.getBoundingClientRect().left) return
    setTypeMenu(null)
  }

  // ---- 外部リンクのカードの操作 ----
  const cardOf = (card: HTMLElement): LinkCard => JSON.parse(card.dataset.link || '{"u":""}')
  function cardAction(card: HTMLElement, act: string | undefined) {
    const c = cardOf(card)
    if (act === 'open') { if (asUrl(c.u)) window.open(c.u, '_blank', 'noopener,noreferrer'); else props.onToast('URL が正しくありません（✎ で直せます）'); return }
    if (act === 'fetch') { void autoFill(card, true); return }
    if (act === 'edit' || act === 'done') {
      if (act === 'edit') card.dataset.prevU = c.u
      card.classList.toggle('editing', act === 'edit')
      renderLink(card, c)
      if (act === 'edit') (card.querySelector('[data-field="t"]') as HTMLInputElement | null)?.focus()
      else {
        save()
        // URL を入れ直した時は、サイトから取り直す
        if (c.u !== card.dataset.prevU && asUrl(c.u)) void autoFill(card)
        delete card.dataset.prevU
      }
      return
    }
    if (act === 'del') {
      const next = (card.nextElementSibling ?? card.previousElementSibling) as HTMLElement | null
      card.remove()
      if (!root.children.length) root.appendChild(lineEl({ level: 0, text: '' }))
      setCaret(next ?? (root.lastElementChild as HTMLElement), 0)
      save()
      props.onToast('リンクのカードを消しました')
      return
    }
    if (act === 'imgx') { renderLink(card, { ...c, img: undefined }); save(); return }
    if (act === 'img') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const f = input.files?.[0]
        if (!f) return
        try { const id = await putImage(f); renderLink(card, { ...cardOf(card), img: `bnimg:${id}` }); save() } catch { props.onToast('この画像は読み込めませんでした') }
      }
      input.click()
    }
  }
  /** カードの入力欄で打った時（本文の入力とは別に扱う） */
  function onCardField(t: HTMLInputElement) {
    const card = t.closest('.bn-linkcard') as HTMLElement
    const c = { ...cardOf(card), [t.dataset.field!]: t.value }
    card.dataset.link = JSON.stringify(c)
    save()
  }
  /**
   * サイトの名刺（タイトル・説明・画像・サイト名）を受付窓口から取り、カードを埋める。画像は端末に縮めて保存。
   * 手で直したタイトル・説明は上書きしない（force＝↻ の時だけ上書き）
   */
  async function autoFill(card: HTMLElement, force = false) {
    const first = cardOf(card)
    if (!asUrl(first.u)) return
    card.classList.add('loading')
    try {
      const p = await fetchPreview(first.u)
      let img: string | undefined
      if (p.image) {
        try { img = `bnimg:${await putImage(await fetchPreviewImage(p.image))}` } catch { img = undefined }
      }
      const cur = cardOf(card) // 待っている間に手で直したかもしれない
      if (cur.u !== first.u) return
      const next: LinkCard = {
        ...cur,
        t: (force || isPlaceholderTitle(cur)) && p.title ? p.title : cur.t,
        d: (force || !cur.d) && p.description ? p.description : cur.d,
        s: p.site || cur.s,
        img: img ?? cur.img,
      }
      if (card.isConnected) { renderLink(card, next); save() }
      props.onToast('サイトから、タイトル・説明・画像を取りました')
    } catch (e) {
      props.onToast(`自動で取れませんでした（${e instanceof Error ? e.message : '不明'}）。✎ で手で入れられます`)
    } finally {
      card.classList.remove('loading')
    }
  }
  /** 外部リンクのカードを入れる（空の行ならその行を、文字のある行ならその下に） */
  function insertLinkCard(at: HTMLElement | undefined, c: LinkCard, editing: boolean): HTMLElement {
    let anchor = at
    if (anchor && anchor.parentElement !== root) anchor = root.children[topIndex(anchor)] as HTMLElement
    const card = linkEl(c, editing)
    if (anchor && plainLine(anchor) && !textOf(anchor).trim()) anchor.replaceWith(card)
    else if (anchor) anchor.after(card)
    else root.appendChild(card)
    if (!card.nextElementSibling || !plainLine(card.nextElementSibling)) card.after(lineEl({ level: 0, text: '' }))
    if (editing) (card.querySelector('[data-field="u"]') as HTMLInputElement | null)?.focus()
    else setCaret(card.nextElementSibling as HTMLElement, 0)
    save()
    return card
  }

  // ---- アプリ内リンク: 「@」か「[[」で候補を出す ----
  const [picker, setPicker] = createSignal<{ el: HTMLElement; start: number; q: string; x: number; y: number; i: number } | null>(null)
  const TRIGGER = /(?:^|[^A-Za-z0-9._%+-])([@＠]|\[\[)([^\s@＠[\]]{0,40})$/
  const candidates = () => {
    const p = picker()
    if (!p) return []
    const q = p.q.toLowerCase()
    return [...db.pages]
      .filter((n) => n.id !== props.note.id && (!q || noteTitle(n).toLowerCase().includes(q)))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 8)
  }
  function checkTrigger() {
    const c = caretAt()
    const sel = window.getSelection()
    if (!c || !sel?.isCollapsed) { setPicker(null); return }
    const before = (() => { const r = pointRange(c.el, 0); r.setEnd(sel.anchorNode!, sel.anchorOffset); return r.toString() })()
    const m = before.match(TRIGGER)
    if (!m) { setPicker(null); return }
    const start = before.length - m[1].length - m[2].length
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    const box = scroller.getBoundingClientRect()
    const prev = picker()
    setPicker({ el: c.el, start, q: m[2], x: Math.max(8, rect.left - box.left), y: rect.bottom - box.top + scroller.scrollTop + 6, i: prev && prev.el === c.el && prev.start === start ? Math.min(prev.i, 8) : 0 })
  }
  /** 候補を選ぶ: 打った「@名前」を札に置き換える（id が無ければ、その名前で新しいページを作る） */
  function pickRef(id: string | null) {
    const p = picker()
    if (!p) return
    setPicker(null)
    const target = id ?? addPage(p.q.trim() || '新しいページ').id
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const r = pointRange(p.el, p.start)
    r.setEnd(sel.anchorNode!, sel.anchorOffset)
    r.deleteContents()
    const span = refEl(target)
    const space = document.createTextNode(' ')
    r.insertNode(space)
    r.insertNode(span)
    const after = document.createRange()
    after.setStart(space, 1)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
    lastRange = after.cloneRange()
    save()
    if (!id) props.onToast(`「${noteTitle(noteById(target)!)}」という新しいページを作って、リンクしました`)
  }
  /** 開いている間にページ名が変わっても、札の名前を合わせる */
  function refreshRefs() {
    root.querySelectorAll<HTMLElement>('.bn-ref').forEach((s) => {
      s.textContent = refName(s.dataset.ref!)
      s.classList.toggle('missing', !noteById(s.dataset.ref!))
    })
  }
  /** このページへリンクしているページ（逆リンク） */
  const backlinks = () => {
    const token = refToken(props.note.id)
    return db.pages
      .filter((p) => p.id !== props.note.id && p.body.includes(token))
      .map((p) => {
        const line = p.body.split('\n').find((l) => l.includes(token)) ?? ''
        const text = line.startsWith('::') ? '（表の中）' : line.replace(/^#{1,4}\s+/, '').replace(REF_RE, (_m, id: string) => `@${refName(id)}`)
        return { id: p.id, title: noteTitle(p), text: text.slice(0, 90) }
      })
  }

  function onInput(e: InputEvent) {
    // リンクのカードの入力欄は、本文とは別
    const tgt = e.target as HTMLElement
    if (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA') { if (tgt.closest('.bn-linkcard')) onCardField(tgt as HTMLInputElement); return }
    if (e.isComposing) { save(); return }
    const box = isCell(e.target as Node) ? (e.target as HTMLElement) : root
    // Enter のあと: 見出しの続きの新しい行は本文に戻す。行頭で Enter した時は、上にできた空行を本文にする
    if (e.inputType === 'insertParagraph') {
      const el = currentLine()
      const prev = el?.previousElementSibling as HTMLElement | null
      if (el && prev && !isTbl(prev)) {
        if (!prev.textContent && el.textContent) prev.dataset.h = '0'
        else el.dataset.h = '0'
      }
    }
    if (!isCanonical(box, box === root)) {
      const c = caretAt()
      const kids = Array.from(box.childNodes)
      let idx = c ? kids.indexOf(c.el) : -1
      if (idx < 0 && c) idx = kids.findIndex((k) => k.contains(c.el))
      fill(box, readBox(box))
      if (c) setCaret(box.children[Math.max(0, idx)] as HTMLElement, c.offset)
    }
    save()
    reportCaret()
    checkTrigger()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.isComposing) return
    const tg = e.target as HTMLElement
    if (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA') {
      // カードの入力欄: Enter（説明・メモ以外）で完了
      if (e.key === 'Enter' && tg.tagName === 'INPUT' && tg.closest('.bn-linkcard')) { e.preventDefault(); cardAction(tg.closest('.bn-linkcard') as HTMLElement, 'done') }
      return
    }
    if (e.key === 'Escape' && typeMenu()) { e.preventDefault(); setTypeMenu(null); return }
    // リンクの候補を選んでいる時
    const pk = picker()
    if (pk) {
      const n = candidates().length + 1 // 最後は「新しいページを作る」
      if (e.key === 'ArrowDown') { e.preventDefault(); setPicker({ ...pk, i: (pk.i + 1) % n }); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPicker({ ...pk, i: (pk.i - 1 + n) % n }); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickRef(candidates()[pk.i]?.id ?? null); return }
      if (e.key === 'Escape') { e.preventDefault(); setPicker(null); return }
    }
    const cell = (e.target as HTMLElement).closest?.('.bn-cell') as HTMLElement | null
    if (cell && cellKey(e, cell)) return
    // 見出し: Ctrl+0〜4。ブラウザに取られる時は Alt+0〜4（Ctrl+Alt+数字は OS が取ることがある）
    const digitKey = ((e.ctrlKey || e.metaKey) && !e.shiftKey) || (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey)
    if (digitKey && /^(Digit|Numpad)[0-4]$/.test(e.code)) {
      e.preventDefault()
      setLevel(Number(e.code.slice(-1)))
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      const c = caretAt()
      const t = c ? textOf(c.el) : ''
      // 本文の行で「/1」〜「/3」＋ Enter ＝ その列数の表
      const slash = !cell && c ? t.trim().match(SLASH_TABLE) : null
      if (slash && c) {
        e.preventDefault()
        // 「/3」の行そのものを表にする
        c.el.replaceChildren(document.createElement('br'))
        insertTable(c.el, '１２３'.includes(slash[1]) ? '１２３'.indexOf(slash[1]) + 1 : Number(slash[1]))
        return
      }
      // 箇条書き・番号の行で Enter: 次の行にも印を付ける（印だけの行で Enter なら印を外す）
      const m = t.match(MARK)
      if (c && m && m[2] && window.getSelection()?.isCollapsed) {
        e.preventDefault()
        if (t.length === m[0].length) { replaceHead(c.el, m[0].length, m[1]); save(); reportCaret(); return }
        const next = /^\d+\. $/.test(m[2]) ? `${parseInt(m[2], 10) + 1}. ` : m[2] === '☑ ' ? '☐ ' : m[2]
        document.execCommand('insertParagraph')
        document.execCommand('insertText', false, m[1] + next)
        return
      }
    }
    if (e.altKey && !e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault()
      registerSelection()
    }
  }

  function onPaste(e: ClipboardEvent) {
    const tg = e.target as HTMLElement
    if (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA') return
    e.preventDefault()
    // URL だけを、本文の空の行に貼ったら → 外部リンクのカード
    const plain = e.clipboardData?.getData('text/plain') ?? ''
    const url = asUrl(plain)
    const c0 = caretAt()
    if (url && c0 && c0.el.parentElement === root && !textOf(c0.el).trim()) {
      const card = insertLinkCard(c0.el, cardFromUrl(url.href), false)
      props.onToast('リンクのカードにしました。サイトから読み取っています…')
      void autoFill(card)
      return
    }
    // スクショなどの写真: セルの中ならカーソルの行の下へ。本文では案内だけ
    const files = Array.from(e.clipboardData?.files ?? []).filter(isImageFile)
    if (files.length) {
      const c = caretAt()
      const cell = c?.el.closest('.bn-cell') as HTMLElement | null
      if (cell && c) void insertImages(cell, files, { after: c.el })
      else props.onToast('写真は表のセルに貼れます（/1 と Enter で1列の表）')
      return
    }
    const text = e.clipboardData?.getData('text/plain') ?? ''
    document.execCommand('insertText', false, text.replace(/\r\n?/g, '\n'))
  }

  // コピーした文字は、すべて InBox へ
  function onCopy() {
    const text = window.getSelection()?.toString() ?? ''
    const r = addWord(text, 'copy')
    if (r === 'added') props.onToast(`InBox に入れました：${text.trim().slice(0, 20)}`)
    else if (r === 'exists') props.onToast('InBox にもう有ります（先頭へ上げました）')
  }

  function registerSelection() {
    const text = window.getSelection()?.toString() ?? mark()?.text ?? ''
    const r = addWord(text, 'mark')
    if (r === 'added') props.onToast(`単語に登録しました：${text.trim().slice(0, 20)}`)
    else if (r === 'exists') props.onToast('もう登録されています（先頭へ上げました）')
    else props.onToast('選んだ文字が長すぎるか、空です（200字まで）')
    setMark(null)
  }

  // 文字を選ぶと「単語に登録」を出す
  function onSelectionChange() {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !root.contains(sel.anchorNode)) { setMark(null); return }
    lastRange = sel.getRangeAt(0).cloneRange()
    if (picker()) checkTrigger()
    const cell = (sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement)?.closest('.bn-cell') as HTMLElement | null
    if (cell) lastCell = cell
    reportCaret()
    const text = sel.toString().trim()
    if (sel.isCollapsed || !text || text.length > 200) { setMark(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    const box = scroller.getBoundingClientRect()
    setMark({ x: rect.left - box.left + rect.width / 2, y: rect.bottom - box.top + scroller.scrollTop + 6, text })
  }

  /** 横の NAV から押したとき: 最後のカーソル位置に戻してから入れる */
  function restore() {
    const sel = window.getSelection()
    if (sel?.rangeCount && root.contains(sel.anchorNode) && root.contains(document.activeElement)) return
    if (lastRange && root.contains(lastRange.startContainer)) {
      const host = (lastRange.startContainer instanceof Element ? lastRange.startContainer : lastRange.startContainer.parentElement)?.closest('.bn-cell') as HTMLElement | null
      ;(host ?? root).focus({ preventScroll: true })
      sel?.removeAllRanges()
      sel?.addRange(lastRange)
    } else setCaret(topLines()[topLines().length - 1], END)
  }
  const api: EditorApi = {
    insertText(text) {
      restore()
      document.execCommand('insertText', false, text)
    },
    symbol(id) {
      restore()
      if (id === '#') {
        const el = currentLine()
        if (!el) return
        el.dataset.h = String((Number(el.dataset.h || 0) + 1) % 5)
        save()
        return
      }
      if (id.length === 2 && id !== '//') {
        const inner = window.getSelection()?.toString() ?? ''
        document.execCommand('insertText', false, id[0] + inner + id[1])
        const c = caretAt()
        if (c && !inner) setCaret(c.el, c.offset - 1)
        return
      }
      document.execCommand('insertText', false, id === '//' ? '// ' : id)
    },
    format,
    getPos() {
      reportCaret()
      return { ...lastPos, scroll: scroller.scrollTop }
    },
    goPos(p) {
      const el = topLines()[Math.min(p.line, topLines().length - 1)]
      if (!el) return
      if (!isTbl(el)) setCaret(el, p.offset)
      scroller.scrollTop = p.scroll
      // 戻ってきた場所が分かるよう、その行を一瞬光らせる
      el.classList.remove('bn-flash')
      void el.offsetWidth
      el.classList.add('bn-flash')
      setTimeout(() => el.classList.remove('bn-flash'), 1600)
      props.onCaretLine(p.line)
    },
    jumpTo(index) {
      const el = topLines()[index]
      if (!el) return
      el.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      setCaret(el, END)
      props.onCaretLine(index)
    },
  }

  onMount(() => {
    fill(root, parseLines(props.note.body))
    const m = memory.get(props.note.id)
    if (m) {
      lastPos = { line: m.line, offset: m.offset }
      lastScroll = m.scroll
      scroller.scrollTop = m.scroll
      const el = topLines()[Math.min(m.line, topLines().length - 1)]
      if (el && !isTbl(el)) setCaret(el, m.offset)
      scroller.scrollTop = m.scroll
      // しおりから開いた時は、画面ができてから戻して光らせる
      if (m.flash) { memory.set(props.note.id, { ...m, flash: false }); requestAnimationFrame(() => api.goPos(m)) }
    }
    props.onReady(api)
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('pointerdown', closeTypeMenu, true)
    root.addEventListener('focusin', refreshRefs)
  })
  onCleanup(() => {
    document.removeEventListener('selectionchange', onSelectionChange)
    document.removeEventListener('pointerdown', closeTypeMenu, true)
    memory.set(props.note.id, { scroll: lastScroll, ...lastPos })
  })

  return (
    <div class="bn-scroller" ref={scroller} onScroll={() => { lastScroll = scroller.scrollTop }}>
      <div
        ref={root}
        class="bn-editor"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="本文"
        spellcheck={false}
        data-placeholder="ここに書く。Ctrl+1〜4 で見出し・/3 と Enter で表"
        onInput={onInput}
        onKeyDown={onKeyDown}
        onKeyUp={reportCaret}
        onClick={onEditorClick}
        onPaste={onPaste}
        onCopy={onCopy}
        onPointerDown={onGutterDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />
      {/* このページへのリンク（逆リンク）。本文のすぐ下 */}
      <Show when={backlinks().length}>
        <section class="bn-backlinks" aria-label="このページへのリンク">
          <h3>このページへのリンク <small>{backlinks().length}</small></h3>
          <ul>
            <For each={backlinks()}>
              {(b) => (
                <li>
                  <button type="button" onClick={() => props.onOpenRef?.(b.id)}>
                    <b>{b.title}</b>
                    <span>{b.text}</span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </section>
      </Show>
      {/* 本文の下の余白（押すと最後の行へ） */}
      <div class="bn-tail" onClick={() => setCaret(topLines()[topLines().length - 1], END)} />
      {/* アプリ内リンクの候補（@・[[） */}
      <Show when={picker()}>
        {(p) => (
          <div class="bn-picker" role="listbox" aria-label="リンクするページ" style={{ left: `${p().x}px`, top: `${p().y}px` }} onPointerDown={(e) => e.preventDefault()}>
            <p class="bn-picker-head">{p().q ? `「${p().q}」を含むページ` : 'リンクするページ'}<small>↑↓ で選んで Enter</small></p>
            <For each={candidates()}>
              {(n, i) => (
                <button type="button" role="option" aria-selected={p().i === i()} classList={{ on: p().i === i() }} onClick={() => pickRef(n.id)}>
                  <span class="bn-picker-icon" aria-hidden="true">頁</span>{noteTitle(n)}
                </button>
              )}
            </For>
            <button type="button" role="option" class="new" aria-selected={p().i === candidates().length} classList={{ on: p().i === candidates().length }} onClick={() => pickRef(null)}>
              <span class="bn-picker-icon" aria-hidden="true">＋</span>{p().q ? `「${p().q}」という新しいページを作ってリンク` : '新しいページを作ってリンク'}
            </button>
          </div>
        )}
      </Show>
      {/* 写真を落とす場所 */}
      <Show when={dropHint()}>
        {(h) => <span class="bn-drop-line" style={{ left: `${h().x}px`, top: `${h().y}px`, width: `${h().w}px` }} />}
      </Show>
      {/* 写真の拡大 */}
      <Show when={viewer()}>
        {(src) => (
          <div class="bn-viewer" role="dialog" aria-modal="true" aria-label="写真" onClick={() => setViewer(null)} onKeyDown={(e) => e.key === 'Escape' && setViewer(null)}>
            <img src={src()} alt="写真（押すと閉じる）" />
            <button type="button" class="bn-viewer-x" aria-label="閉じる" ref={(b) => queueMicrotask(() => b.focus())}>×</button>
          </div>
        )}
      </Show>
      <Show when={typeMenu()}>
        {(t) => (
          <div class="bn-type-menu" role="menu" aria-label="行の種類" style={{ left: `${t().x}px`, top: `${t().y}px` }} onPointerDown={(e) => e.preventDefault()}>
            <For each={TYPES}>
              {(k) => (
                <button type="button" role="menuitemradio" aria-checked={t().cur === k.id} classList={{ on: t().cur === k.id }} onClick={() => setType(t().el, k.id)} title={k.hint}>
                  <span class="bn-type-glyph">{k.label}</span>
                  <small>{k.hint}</small>
                </button>
              )}
            </For>
          </div>
        )}
      </Show>
      <Show when={mark()}>
        {(m) => (
          <button
            type="button"
            class="bn-mark"
            style={{ left: `${m().x}px`, top: `${m().y}px` }}
            onPointerDown={(e) => e.preventDefault()}
            onClick={registerSelection}
            title="選んだ文字を InBox の単語に登録（Alt+R）"
          >
            ＋ 単語に登録 <kbd>Alt+R</kbd>
          </button>
        )}
      </Show>
    </div>
  )
}

export default NoteEditor
