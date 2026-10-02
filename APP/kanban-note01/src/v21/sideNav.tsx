import { createSignal, onCleanup, onMount } from 'solid-js'

// 会話ログと執筆デスク（下書き・メモ）で共通の「左右の縦長NAV」の部品。
// 候補のHooks（入力している行・ブロックの種類 → 出す候補）もここに1つだけ置く。
// 将来 KeyDeck が端末に出す盤面を選ぶときも、この表を元にする（docs/修正案_2026-09-25_テキスト化.md）。

export const WIDE_QUERY = '(min-width: 1100px)'

/** PC幅（左右のNAVを出す幅）か。狭い画面ではオーバーレイを使う */
export function useWide() {
  const mq = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(WIDE_QUERY) : null
  const [wide, setWide] = createSignal(mq?.matches ?? false)
  const onChange = (e: MediaQueryListEvent) => setWide(e.matches)
  onMount(() => mq?.addEventListener?.('change', onChange))
  onCleanup(() => mq?.removeEventListener?.('change', onChange))
  return wide
}

export type CandidatePanel = 'cast' | 'scenes' | 'ww' | 'tags'
export type CandidateHook = { side: 'left' | 'right'; panel: CandidatePanel; pcAuto: boolean; mobileAuto: boolean }

// 候補のHooks（ブロックの種類 → 出す候補）。この1か所を直せば、会話ログも執筆デスクも、PCのパネルもスマホのオーバーレイも変わる
export const CANDIDATE_HOOKS: Record<string, CandidateHook | undefined> = {
  pillar: { side: 'right', panel: 'scenes', pcAuto: true, mobileAuto: true },  // 柱 → Scene（今までの柱）。Scene は右のパネル
  note: { side: 'right', panel: 'tags', pcAuto: true, mobileAuto: true },      // 備考 → 演出tag
  dialogue: { side: 'left', panel: 'cast', pcAuto: false, mobileAuto: false }, // セリフ → 人物（PCはAlt+番号があり目次を隠さないため、スマホは本文が隠れるため、どちらも自動では開かない）
}

// 縦長NAVのアイコン（1マスで分かる形）
export const RAIL_ICONS = {
  toc: 'M4.5 5.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M4.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M4.5 18.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M6 7v3.5M6 13.5V17M10 5.5h9M10 12h9M10 18.5h6',
  sheets: 'M7 3.5h8.5L19 7v13.5H7zM15.5 3.5V7H19M4.5 6.5v15H15M10 11h6M10 14.5h6M10 18h4',
  cast: 'M12 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5',
  scenes: 'M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4a2 2 0 0 0 0 4',
  ww: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17M3.5 12h17M12 3.5c2.5 2.4 3.6 5.2 3.6 8.5s-1.1 6.1-3.6 8.5M12 3.5C9.5 5.9 8.4 8.7 8.4 12s1.1 6.1 3.6 8.5',
  tags: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.1 6.1a1.4 1.4 0 0 1-2 0zM8 8.1h.01',
}

/** 長押しの時間（名前札・NAVのアイコン共通。2026-09-27 利用者: 1秒→0.6秒） */
export const HOLD_MS = 600

/**
 * 押す／長押しを分ける。長押しが決まったら onLong を呼び、そのあとの click は consumed() で捨てる。
 * 指が動いたら（スクロール）長押しにしない。スマホの長押しメニューも出さない。
 */
export function holdPress(onLong: () => void, ms = HOLD_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let fired = false
  let sx = 0
  let sy = 0
  const stop = () => clearTimeout(timer)
  return {
    consumed() { const f = fired; fired = false; return f },
    handlers: {
      onPointerDown: (e: PointerEvent) => {
        fired = false
        sx = e.clientX
        sy = e.clientY
        stop()
        timer = setTimeout(() => { fired = true; navigator.vibrate?.(20); onLong() }, ms)
      },
      onPointerMove: (e: PointerEvent) => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) stop() },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    },
  }
}

export const RailButton = (p: { d: string; label: string; title: string; on: boolean; onClick: () => void; onLongPress?: () => void }) => {
  const press = p.onLongPress ? holdPress(() => p.onLongPress?.()) : null
  return (
    <button
      type="button"
      class="tl-rail-btn"
      classList={{ on: p.on }}
      onClick={() => { if (press?.consumed()) return; p.onClick() }}
      title={p.title}
      aria-pressed={p.on}
      {...(press?.handlers ?? {})}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={p.d} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>{p.label}</span>
    </button>
  )
}

export const FabIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
)

/** 押す瞬間に入力欄のフォーカスを奪わない（候補を押しても書き続けられる） */
export const hold = (e: PointerEvent) => {
  // 名前の入力欄などは、押してカーソルを置けるようにする
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return
  e.preventDefault()
}
