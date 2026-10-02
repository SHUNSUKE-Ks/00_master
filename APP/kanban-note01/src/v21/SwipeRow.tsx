import { type JSX, Show, createSignal, onCleanup } from 'solid-js'

// スマホ用の1行ボタン。押す＝onTap、長押し＝onLongPress、左へスワイプ＝右側に赤いごみ箱（onDelete）。
// 押しても入力欄のフォーカス（キーボード）を奪わない。縦のスクロールは邪魔しない（touch-action: pan-y）。

const OPEN_X = -84      // ごみ箱を見せたときのずれ
const LONG_MS = 600     // 長押しとみなす時間（名前札・NAVと同じ0.6秒）
const MOVE_SLOP = 8     // これ以上動いたら「押した」ではない

type Props = {
  onTap: () => void
  onLongPress?: () => void
  onDelete?: () => void
  deleteLabel?: string
  class?: string
  children: JSX.Element
}

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10 10.5v6M14 10.5v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
)

export default function SwipeRow(props: Props) {
  const [x, setX] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)
  let startX = 0
  let startY = 0
  let base = 0
  let moved = false
  let horizontal = false
  let longFired = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const canDelete = () => !!props.onDelete
  onCleanup(() => clearTimeout(timer))

  function down(e: PointerEvent) {
    e.preventDefault() // 入力欄のフォーカスを奪わない
    startX = e.clientX
    startY = e.clientY
    base = x()
    moved = false
    horizontal = false
    longFired = false
    clearTimeout(timer)
    if (props.onLongPress) {
      timer = setTimeout(() => {
        if (moved) return
        longFired = true
        navigator.vibrate?.(20)
        setX(0)
        props.onLongPress?.()
      }, LONG_MS)
    }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* 無視 */ }
  }
  function move(e: PointerEvent) {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (!moved && Math.hypot(dx, dy) > MOVE_SLOP) {
      moved = true
      horizontal = Math.abs(dx) > Math.abs(dy)
      clearTimeout(timer)
    }
    if (moved && horizontal && canDelete()) {
      setDragging(true)
      setX(Math.max(OPEN_X - 12, Math.min(0, base + dx)))
    }
  }
  function up() {
    clearTimeout(timer)
    const wasDragging = dragging()
    setDragging(false)
    if (longFired) return
    if (wasDragging) {
      setX(x() < OPEN_X / 2 ? OPEN_X : 0)
      return
    }
    if (moved) return
    if (x() !== 0) { setX(0); return } // 開いているときに押したら閉じるだけ
    props.onTap()
  }
  function cancel() {
    clearTimeout(timer)
    setDragging(false)
    if (x() !== OPEN_X) setX(0)
  }

  return (
    <div class={`v21-swipe ${props.class ?? ''}`} classList={{ open: x() === OPEN_X }}>
      <Show when={canDelete()}>
        <button
          type="button"
          class="v21-swipe-trash"
          aria-label={props.deleteLabel ?? '消す'}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }}
          onClick={() => { setX(0); props.onDelete?.() }}
          tabIndex={x() === OPEN_X ? 0 : -1}
        >
          <TrashIcon />
        </button>
      </Show>
      <div
        class="v21-swipe-face"
        classList={{ dragging: dragging() }}
        style={{ transform: `translateX(${x()}px)` }}
        role="button"
        tabIndex={0}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onTap() } }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {props.children}
      </div>
    </div>
  )
}
