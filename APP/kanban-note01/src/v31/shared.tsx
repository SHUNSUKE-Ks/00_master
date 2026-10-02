import { type Accessor, For, createSignal, onCleanup, onMount } from 'solid-js'

// PC用とスマホ用で共通の小物（アイコン・記号キー・お知らせ・表示の切り替え）

export const SYMBOLS: Array<{ id: string; title: string }> = [
  { id: '#', title: '見出し: 押すたびに H1→H2→H3→H4→本文' },
  { id: '{}', title: '{ } 文中のメモ' },
  { id: '[]', title: '[ ] タグ' },
  { id: '()', title: '( ) 補足' },
  { id: ':', title: ': コロン' },
  { id: '//', title: '// 行のメモ' },
]

export const Icon = (p: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={p.d} fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
)

/** 短いお知らせ（2.6秒で消える） */
export function useToast(): [Accessor<string>, (t: string) => void] {
  const [toast, setToast] = createSignal('')
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  return [toast, (t: string) => { setToast(t); clearTimeout(timer); timer = setTimeout(() => setToast(''), 2600) }]
}

// ---- PC用／スマホ用の切り替え。既定は「自動」（画面の幅で決める） ----
export type ViewMode = 'auto' | 'pc' | 'mobile'
const MODE_KEY = 'bakeru-note-v31-view'
const MOBILE_QUERY = '(max-width: 767px)'
const readMode = (): ViewMode => {
  try { const v = localStorage.getItem(MODE_KEY); return v === 'pc' || v === 'mobile' ? v : 'auto' } catch { return 'auto' }
}
const [viewMode, setViewModeRaw] = createSignal<ViewMode>(readMode())
export { viewMode }
export function setViewMode(m: ViewMode) {
  setViewModeRaw(m)
  try { localStorage.setItem(MODE_KEY, m) } catch { /* 無視 */ }
}

/** いまスマホ用の画面を出すか */
export function useMobile(): Accessor<boolean> {
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(MOBILE_QUERY) : null
  const [narrow, setNarrow] = createSignal(mq?.matches ?? false)
  const on = (e: MediaQueryListEvent) => setNarrow(e.matches)
  onMount(() => mq?.addEventListener?.('change', on))
  onCleanup(() => mq?.removeEventListener?.('change', on))
  return () => (viewMode() === 'auto' ? narrow() : viewMode() === 'mobile')
}

export const ViewModePicker = () => (
  <div class="bn-viewmode" role="radiogroup" aria-label="画面">
    <span>画面</span>
    <For each={[['auto', '自動'], ['pc', 'PC用'], ['mobile', 'スマホ用']] as Array<[ViewMode, string]>}>
      {([id, label]) => (
        <button type="button" role="radio" aria-checked={viewMode() === id} classList={{ on: viewMode() === id }} onClick={() => setViewMode(id)}>
          {label}
        </button>
      )}
    </For>
  </div>
)
