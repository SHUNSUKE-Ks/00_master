import { type Component, For, Show, createSignal, onCleanup } from 'solid-js'
import { Icon } from './shared'

// 書式バー（ノート下の横並びボタン）。UpNote のように「編集」で並べ替え・表示/非表示ができる（2026-10-02 利用者）。
// 編集中: 上の段＝使うボタン、区切り線の下＝待機中。ドラッグで並べ替え・段の行き来（指でも動く）。
//   持ち上げると隙間が詰まり、置く場所に金の線が出る。押すだけ（ドラッグしない）なら、もう片方の段へ移る。
// 説明の吹き出し: マウスは乗せると出る。指（Android）は長押しで出る（押した扱いにはしない）。
// 並びは localStorage `bakeru-note-v31-formatbar` に覚える（この端末だけ）。

type Item = { id: string; label: string; title: string; d?: string; text?: string }

export const FORMAT_ITEMS: Item[] = [
  { id: 'heading', label: '見出し', title: '押すたびに H1→H2→H3→H4→本文（Alt+1〜4 でも）', text: 'H' },
  { id: 'bullet', label: '箇条書き', title: '行の頭に「- 」を付ける／外す', d: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01' },
  { id: 'number', label: '番号付き', title: '行の頭に「1. 」を付ける／外す', d: 'M10 6h10M10 12h10M10 18h10M4 5l1.2-.8V9M3.8 14.2c.6-1.1 2.2-.9 2.2.2 0 .8-1.2 1.3-2.2 2.4H6' },
  { id: 'check', label: 'チェック', title: '行の頭に「☐ 」を付ける／外す', d: 'M5 5h14v14H5zM8.5 12l2.5 2.5 4.5-5' },
  { id: 'quote', label: '引用', title: '行の頭に「> 」を付ける／外す', d: 'M4 6h16v12H4zM9 10.5v3M15 10.5v3' },
  { id: 'indent', label: '字下げ', title: '行を右へずらす', d: 'M4 6h16M12 11h8M12 16h8M4 21h16M4 10l4 2.5L4 15z' },
  { id: 'outdent', label: '字下げを戻す', title: '行を左へ戻す', d: 'M4 6h16M12 11h8M12 16h8M4 21h16M8 10l-4 2.5L8 15z' },
  { id: 'divider', label: '仕切り', title: '仕切り線（---）を入れる', d: 'M4 12h3M10.5 12h3M17 12h3M4 7h16M4 17h16' },
  { id: 'bold', label: '太字', title: '選んだ文字を ** ** で囲む', text: 'B' },
  { id: 'undo', label: '元に戻す', title: '一つ前に戻す（Ctrl+Z）', d: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3' },
  { id: 'redo', label: 'やり直す', title: '戻したのをやり直す（Ctrl+Y）', d: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3' },
  { id: 'table', label: '表', title: '3列の表を入れる（本文で /1〜/3 と打って Enter でも）', d: 'M4 5h16v14H4zM4 10h16M4 14.5h16M9.5 5v14M14.5 5v14' },
  { id: 'mention', label: 'ページへのリンク', title: '@ を入れて、リンクするページを選ぶ（本文で @ か [[ と打っても）', text: '@' },
  { id: 'link', label: 'リンクカード', title: '外のサイトのリンクをカードで入れる（URL だけを空の行に貼っても）', d: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1' },
  { id: 'h1', label: '見出し1', title: 'いちばん大きい見出し（Alt+1）', text: 'H1' },
  { id: 'h2', label: '見出し2', title: '章の見出し（Alt+2）', text: 'H2' },
  { id: 'h3', label: '見出し3', title: '小見出し（Alt+3）', text: 'H3' },
  { id: 'h4', label: '見出し4', title: 'いちばん小さい見出し（Alt+4）', text: 'H4' },
  { id: 'h0', label: '本文', title: '見出しをやめて本文に戻す（Alt+0）', text: '本' },
]
const DEFAULT_ORDER = FORMAT_ITEMS.map((i) => i.id)
const DEFAULT_HIDDEN = ['h1', 'h2', 'h3', 'h4', 'h0', 'redo', 'quote', 'divider']
const KEY = 'bakeru-note-v31-formatbar'

type Saved = { order: string[]; hidden: string[] }
function read(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null
    if (v && Array.isArray(v.order) && Array.isArray(v.hidden)) {
      // 後から増えた部品も末尾に足す
      const order = [...v.order.filter((id) => DEFAULT_ORDER.includes(id)), ...DEFAULT_ORDER.filter((id) => !v.order.includes(id))]
      return { order, hidden: v.hidden }
    }
  } catch { /* 無視 */ }
  return { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN }
}
const [cfg, setCfg] = createSignal<Saved>(read())
const commit = (v: Saved) => { setCfg(v); try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* 無視 */ } }
const byId = (id: string) => FORMAT_ITEMS.find((i) => i.id === id)!

type Row = 'shown' | 'wait'
const shownIds = () => cfg().order.filter((id) => !cfg().hidden.includes(id))
const waitIds = () => cfg().order.filter((id) => cfg().hidden.includes(id))
/** id を row の index 番目へ置く（もう片方の段からでもよい） */
function place(id: string, row: Row, index: number) {
  const s = shownIds().filter((x) => x !== id)
  const w = waitIds().filter((x) => x !== id)
  ;(row === 'shown' ? s : w).splice(index, 0, id)
  commit({ order: [...s, ...w], hidden: w })
}

const Glyph = (p: { it: Item }) => (p.it.d ? <Icon d={p.it.d} /> : <span class="bn-fb-text">{p.it.text}</span>)
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const HOLD_MS = 450
const DRAG_PX = 6

const FormatBar: Component<{ onPick: (id: string) => void }> = (props) => {
  let bar!: HTMLDivElement
  let shownRow!: HTMLDivElement
  let waitRow: HTMLDivElement | undefined
  const [editing, setEditing] = createSignal(false)
  // 持ち上げ中のボタン（ghost は指・マウスについてくる複製）
  const [drag, setDrag] = createSignal<{ id: string; x: number; y: number; ox: number; oy: number; w: number; h: number } | null>(null)
  const [drop, setDrop] = createSignal<{ row: Row; index: number; line: { x: number; y: number; h: number } } | null>(null)
  const [tip, setTip] = createSignal<{ id: string; x: number; y: number } | null>(null)

  // ---- FLIP: 並びが変わった時、前の位置から新しい位置へ滑らせる ----
  const cells = () => Array.from(bar.querySelectorAll<HTMLElement>('[data-fid]'))
  function snapshot() {
    const m = new Map<string, DOMRect>()
    for (const el of cells()) m.set(el.dataset.fid!, el.getBoundingClientRect())
    return m
  }
  function play(first: Map<string, DOMRect>) {
    if (reduced()) return
    for (const el of cells()) {
      const a = first.get(el.dataset.fid!)
      const b = el.getBoundingClientRect()
      if (!a || !b.width) continue
      const dx = a.left - b.left
      const dy = a.top - b.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' })
    }
  }
  const animated = (fn: () => void) => { const f = snapshot(); fn(); play(f) }

  // ---- 吹き出し ----
  let tipTimer: ReturnType<typeof setTimeout> | undefined
  function showTip(id: string, el: HTMLElement) {
    const r = el.getBoundingClientRect()
    setTip({ id, x: Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120), y: r.top - 8 })
  }
  const hideTip = () => { clearTimeout(tipTimer); setTip(null) }
  onCleanup(() => clearTimeout(tipTimer))

  // ---- 押す・長押し・ドラッグ（Pointer Events。マウスも指も同じ） ----
  let press: { id: string; el: HTMLElement; sx: number; sy: number; pid: number; held: boolean } | null = null
  let swallowClick = false

  function onDown(e: PointerEvent, id: string) {
    if (e.button !== 0) return
    e.preventDefault() // 本文のカーソルを外さない
    const el = e.currentTarget as HTMLElement
    // 指でドラッグした後はクリックが来ないことがある。押し直したら、前の「クリックを捨てる」は忘れる
    swallowClick = false
    press = { id, el, sx: e.clientX, sy: e.clientY, pid: e.pointerId, held: false }
    if (editing()) { try { el.setPointerCapture(e.pointerId) } catch { /* 取れなくても動く（指の移動は bar で受ける） */ } }
    clearTimeout(tipTimer)
    // 長押しで説明（指のとき）。マウスは乗せるだけで出るので要らない
    if (e.pointerType !== 'mouse') {
      tipTimer = setTimeout(() => { if (press && !drag()) { press.held = true; showTip(id, el); navigator.vibrate?.(15) } }, HOLD_MS)
    }
  }
  function onMove(e: PointerEvent) {
    if (!press || !editing() || e.pointerId !== press.pid) return
    if (!drag()) {
      if (Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < DRAG_PX) return
      hideTip()
      const r = press.el.getBoundingClientRect()
      // 持ち上げる → その場所は消えて、残りのボタンが隙間を詰める
      animated(() => setDrag({ id: press!.id, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, h: r.height }))
    }
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d))
    setDrop(findDrop(e.clientX, e.clientY))
  }
  function onUp(e: PointerEvent) {
    clearTimeout(tipTimer)
    if (!press || e.pointerId !== press.pid) return
    const p = press
    press = null
    const d = drag()
    if (d) {
      const target = drop()
      const first = snapshot()
      // 置いた場所へは、指の位置（ghost）から滑り込む
      first.set(d.id, new DOMRect(d.x - d.ox, d.y - d.oy, d.w, d.h))
      setDrag(null)
      setDrop(null)
      if (target) place(d.id, target.row, target.index)
      play(first)
      swallowClick = true
      return
    }
    if (p.held) { swallowClick = true; setTimeout(hideTip, 1600); return }
  }
  function onCancel() {
    clearTimeout(tipTimer)
    press = null
    if (drag()) animated(() => { setDrag(null); setDrop(null) })
  }
  function onClick(id: string) {
    if (swallowClick) { swallowClick = false; return }
    hideTip()
    if (!editing()) { props.onPick(id); return }
    // 編集中に押すだけ: もう片方の段の終わりへ
    const toWait = !cfg().hidden.includes(id)
    animated(() => place(id, toWait ? 'wait' : 'shown', toWait ? waitIds().length : shownIds().length))
  }
  function onKey(e: KeyboardEvent, id: string) {
    if (!editing() || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    const row: Row = cfg().hidden.includes(id) ? 'wait' : 'shown'
    const list = row === 'shown' ? shownIds() : waitIds()
    const i = list.indexOf(id) + (e.key === 'ArrowLeft' ? -1 : 1)
    if (i < 0 || i >= list.length) return
    animated(() => place(id, row, i))
    queueMicrotask(() => bar.querySelector<HTMLElement>(`[data-fid="${id}"]`)?.focus())
  }

  /** 指の位置から、置く段と何番目か、金の線の位置を決める */
  function findDrop(x: number, y: number) {
    const rows: Array<[Row, HTMLElement | undefined]> = [['shown', shownRow], ['wait', waitRow]]
    let best: [Row, HTMLElement] | null = null
    let bestDist = Infinity
    for (const [row, el] of rows) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      const dist = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
      if (dist < bestDist) { bestDist = dist; best = [row, el] }
    }
    if (!best) return null
    const [row, el] = best
    const box = bar.getBoundingClientRect()
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-fid]')).filter((c) => c.dataset.fid !== drag()?.id)
    const rects = items.map((c) => c.getBoundingClientRect())
    let index = rects.findIndex((r) => y < r.top || (y <= r.bottom && x < r.left + r.width / 2))
    if (index < 0) index = rects.length
    const gap = 4
    let line: { x: number; y: number; h: number }
    if (!rects.length) {
      const r = el.getBoundingClientRect()
      line = { x: r.left + 10, y: r.top + 4, h: Math.max(36, r.height - 8) }
    } else if (index < rects.length) {
      const r = rects[index]
      line = { x: r.left - gap, y: r.top, h: r.height }
    } else {
      const r = rects[rects.length - 1]
      line = { x: r.right + gap, y: r.top, h: r.height }
    }
    return { row, index, line: { x: line.x - box.left, y: line.y - box.top, h: line.h } }
  }

  const Cell = (p: { id: string; row: Row }) => {
    const it = byId(p.id)
    return (
      <button
        type="button"
        class="bn-fb-btn"
        classList={{ lifted: drag()?.id === p.id, wait: p.row === 'wait' }}
        data-fid={p.id}
        aria-label={editing() ? `${it.label}（${p.row === 'wait' ? '待機中。押すと使うボタンへ' : '押すと待機へ'}・左右キーで並べ替え）` : it.label}
        onPointerDown={(e) => onDown(e, p.id)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse' && !drag()) { clearTimeout(tipTimer); const el = e.currentTarget; tipTimer = setTimeout(() => showTip(p.id, el), 350) } }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') hideTip() }}
        onClick={() => onClick(p.id)}
        onKeyDown={(e) => onKey(e, p.id)}
        onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) showTip(p.id, e.currentTarget) }}
        onBlur={hideTip}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Glyph it={it} />
        <Show when={editing() && p.row === 'wait'}><span class="bn-fb-name">{it.label}</span></Show>
      </button>
    )
  }

  return (
    <div class="bn-fb" classList={{ editing: editing(), dragging: !!drag() }} ref={bar} role="toolbar" aria-label="書式">
      <Show when={editing()}>
        <div class="bn-fb-head">
          <strong>ボタンの編集</strong>
          <span class="bn-fb-hint">ドラッグで並べ替え・下の段へ置くと隠れる。押すだけでも上下を移せる</span>
          <button type="button" class="bn-fb-reset" onClick={() => animated(() => commit({ order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN }))}>初期に戻す</button>
          <button type="button" class="bn-fb-edit on" onClick={() => { hideTip(); setEditing(false) }}>完了</button>
        </div>
      </Show>
      <div class="bn-fb-row">
        <div class="bn-fb-items" ref={shownRow} aria-label="使うボタン">
          <For each={shownIds()}>{(id) => <Cell id={id} row="shown" />}</For>
        </div>
        <Show when={!editing()}>
          <button type="button" class="bn-fb-edit" onClick={() => { hideTip(); setEditing(true) }} title="ボタンの並べ替え・表示/非表示">編集</button>
        </Show>
      </div>
      <Show when={editing()}>
        <div class="bn-fb-sep" role="separator"><span>待機中のボタン</span></div>
        <div class="bn-fb-items bn-fb-wait" ref={waitRow} aria-label="待機中のボタン">
          <For each={waitIds()} fallback={<span class="bn-fb-empty">ここへ置いたボタンは、バーに出なくなります</span>}>{(id) => <Cell id={id} row="wait" />}</For>
        </div>
      </Show>

      {/* 置く場所の線 */}
      <Show when={drag() && drop()}>
        {(_) => <span class="bn-fb-line" style={{ left: `${drop()!.line.x - 1.5}px`, top: `${drop()!.line.y}px`, height: `${drop()!.line.h}px` }} />}
      </Show>
      {/* 持ち上げているボタン */}
      <Show when={drag()}>
        {(d) => (
          <span class="bn-fb-ghost" style={{ left: `${d().x - d().ox}px`, top: `${d().y - d().oy}px`, width: `${d().w}px`, height: `${d().h}px` }} aria-hidden="true">
            <Glyph it={byId(d().id)} />
          </span>
        )}
      </Show>
      {/* 説明の吹き出し */}
      <Show when={tip()}>
        {(t) => (
          <div class="bn-fb-tip" role="tooltip" style={{ left: `${t().x}px`, top: `${t().y}px` }}>
            <b>{byId(t().id).label}</b>
            <span>{byId(t().id).title}</span>
          </div>
        )}
      </Show>
    </div>
  )
}

export default FormatBar
