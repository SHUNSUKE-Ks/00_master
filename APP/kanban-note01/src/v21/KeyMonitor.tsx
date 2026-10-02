import { type Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { go } from './nav'
import { askText } from './dialog'

// キー入力モニター（2026-09-28 利用者: Lenovo タブレットで Alt+1 が効かない。端末のキーボードが何を送っているかを見たい）。
// 画面の上に浮かぶ四角い窓。キーの信号を見るだけで、止めたり書き換えたりはしない（今の操作は変えない）。
// chordOf() は、将来「押したキーをそのままショートカットとして登録する」機能で、保存する形にそのまま使う。

const [monitorOpen, setMonitorOpen] = createSignal(false)
export { monitorOpen }
export const toggleKeyMonitor = () => setMonitorOpen(!monitorOpen())

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'OS'])

/**
 * 変換・無変換は、ブラウザでは Ctrl や Alt のような「押している印」が無い。
 * そこで押している間をここで覚え、ほかのキーと一緒に押したら組み合わせに入れる（例: "Convert+Digit1"）。
 * 2026-09-28: Lenovo タブレットで 変換 の信号が届くことを確かめた（key="Convert" code="Convert"）
 */
export const HOLD_KEYS = ['NonConvert', 'Convert'] as const
const held = new Set<string>()
if (typeof window !== 'undefined') {
  const opts = { capture: true, passive: true } as AddEventListenerOptions
  window.addEventListener('keydown', (e) => { if ((HOLD_KEYS as readonly string[]).includes(e.key)) held.add(e.key) }, opts)
  window.addEventListener('keyup', (e) => { if ((HOLD_KEYS as readonly string[]).includes(e.key)) held.delete(e.key) }, opts)
  window.addEventListener('blur', () => held.clear())
}
export const isHoldKey = (key: string) => (HOLD_KEYS as readonly string[]).includes(key)

/** 押したキーの組み合わせを1つの文字列に（例: "Alt+Digit1"、"Convert+Digit1"）。登録するときの形 */
export function chordOf(e: KeyboardEvent): string {
  const mods: string[] = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Meta')
  for (const k of HOLD_KEYS) if (held.has(k) && e.key !== k) mods.push(k)
  const main = e.code && e.code !== 'Unidentified' ? e.code : e.key
  if (!main || MODIFIER_KEYS.has(e.key)) return mods.join('+') || e.key || '?'
  return [...mods, main].join('+')
}

/** いまの会話ログの Alt+番号 として受け取れるか（受け取れないなら理由） */
function altDigitVerdict(e: KeyboardEvent): { ok: boolean; why: string } {
  if (e.isComposing || e.keyCode === 229 || e.key === 'Process') return { ok: false, why: '日本語入力（IME）が先に受け取っている（isComposing / 229）' }
  if (!e.altKey) return { ok: false, why: 'altKey が false（Alt が押された印が来ていない）' }
  if (e.ctrlKey || e.metaKey) return { ok: false, why: 'Ctrl か Meta も押されている' }
  if (!/^(Digit|Numpad)[0-9]$/.test(e.code)) return { ok: false, why: `code が "${e.code || '（空）'}"（Digit1〜9 ではない）` }
  return { ok: true, why: '受け取れる' }
}

type Row = { n: number; t: string; type: string; main: string; detail: string; chord?: string; verdict?: { ok: boolean; why: string } }

const POS_KEY = 'note-story-v21-keymonitor-pos'
const MAX_ROWS = 40

const KeyMonitor: Component = () => {
  const [rows, setRows] = createSignal<Row[]>([])
  const [paused, setPaused] = createSignal(false)
  const [last, setLast] = createSignal<Row | null>(null)
  const [copied, setCopied] = createSignal(false)
  // 修飾キー（Alt など）を押して離すまでに、ほかのキーの信号が来なかったか（端末が先に受け取った疑い）
  const [lostNote, setLostNote] = createSignal('')
  let modHeld: string | null = null
  let otherSeen = false
  const saved = (() => { try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null') as { x: number; y: number } | null } catch { return null } })()
  const [pos, setPos] = createSignal<{ x: number; y: number } | null>(saved)
  let n = 0
  let started = performance.now()

  const stamp = () => `${((performance.now() - started) / 1000).toFixed(2)}s`
  const push = (row: Omit<Row, 'n' | 't'>) => {
    if (paused()) return
    const r = { ...row, n: ++n, t: stamp() }
    setRows((prev) => [r, ...prev].slice(0, MAX_ROWS))
    if (row.type === 'keydown') setLast(r)
  }

  function onKey(e: KeyboardEvent) {
    if (!paused()) {
      if (e.type === 'keydown' && MODIFIER_KEYS.has(e.key)) {
        if (!modHeld) { modHeld = e.key; otherSeen = false }
      } else if (e.type === 'keydown') {
        otherSeen = true
        setLostNote('')
      } else if (e.type === 'keyup' && e.key === modHeld) {
        if (!otherSeen) setLostNote(`${modHeld} を押している間に、ほかのキー（数字など）の信号が1つも届きませんでした。いっしょに押したキーを、端末（OS・キーボード）が先に受け取っている可能性があります。この組み合わせはアプリでは使えないので、設定 → ショートカットで別の組み合わせを登録してください。`)
        modHeld = null
      }
    }
    const flags = [e.repeat && 'repeat', e.isComposing && 'composing', e.location ? `loc${e.location}` : ''].filter(Boolean).join(' ')
    const mods = ['Ctrl', 'Alt', 'Shift', 'Meta'].filter((m) => (e as unknown as Record<string, boolean>)[`${m.toLowerCase()}Key`]).join('+') || '-'
    push({
      type: e.type,
      main: `key="${e.key}" code="${e.code}"`,
      detail: `keyCode=${e.keyCode} mods=${mods}${e.getModifierState?.('AltGraph') ? ' AltGr' : ''}${flags ? ' ' + flags : ''}`,
      chord: e.type === 'keydown' ? chordOf(e) : undefined,
      verdict: e.type === 'keydown' && /^(Digit|Numpad)[0-9]$|^$/.test(e.code) && (e.altKey || /[0-9]/.test(e.key) || e.keyCode === 229) ? altDigitVerdict(e) : undefined,
    })
  }
  function onBeforeInput(e: Event) {
    const ie = e as InputEvent
    push({ type: 'beforeinput', main: `inputType=${ie.inputType}`, detail: `data=${JSON.stringify(ie.data ?? null)}${ie.isComposing ? ' composing' : ''}` })
  }
  function onComposition(e: CompositionEvent) {
    push({ type: e.type, main: `data=${JSON.stringify(e.data ?? '')}`, detail: '' })
  }

  onMount(() => {
    const opts = { capture: true, passive: true } as AddEventListenerOptions
    window.addEventListener('keydown', onKey, opts)
    window.addEventListener('keyup', onKey, opts)
    window.addEventListener('beforeinput', onBeforeInput, opts)
    window.addEventListener('compositionstart', onComposition as EventListener, opts)
    window.addEventListener('compositionend', onComposition as EventListener, opts)
  })
  onCleanup(() => {
    const opts = { capture: true } as EventListenerOptions
    window.removeEventListener('keydown', onKey, opts)
    window.removeEventListener('keyup', onKey, opts)
    window.removeEventListener('beforeinput', onBeforeInput, opts)
    window.removeEventListener('compositionstart', onComposition as EventListener, opts)
    window.removeEventListener('compositionend', onComposition as EventListener, opts)
  })

  // タイトルの帯をつかんで動かす
  let drag: { dx: number; dy: number } | null = null
  function dragStart(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect()
    drag = { dx: e.clientX - box.left, dy: e.clientY - box.top }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* 無視 */ }
  }
  function dragMove(e: PointerEvent) {
    if (!drag) return
    const x = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - drag.dx))
    const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - drag.dy))
    setPos({ x, y })
  }
  function dragEnd() {
    if (!drag) return
    drag = null
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos())) } catch { /* 無視 */ }
  }

  function asText() {
    return [...rows()].reverse().map((r) => `${r.t} ${r.type} ${r.main} ${r.detail}${r.chord ? ` chord=${r.chord}` : ''}${r.verdict ? ` Alt+番号=${r.verdict.ok ? 'OK' : 'NG(' + r.verdict.why + ')'}` : ''}`).join('\n')
  }
  async function copy() {
    const text = `端末: ${navigator.userAgent}\n${asText()}`
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { void askText({ title: '記録をコピーしてください', message: '自動でコピーできなかったので、下の文字を選んでコピーしてください。', value: text, multiline: true, readonly: true, okLabel: '閉じる' }) }
  }

  return (
    <div
      class="v21-keymon"
      role="dialog"
      aria-label="キー入力モニター"
      style={pos() ? { left: `${pos()!.x}px`, top: `${pos()!.y}px`, right: 'auto', bottom: 'auto' } : {}}
    >
      <div class="v21-keymon-bar" onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}>
        <strong>キー入力モニター</strong>
        <button type="button" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={() => setMonitorOpen(false)} aria-label="閉じる">×</button>
      </div>
      <div class="v21-keymon-last">
        <Show when={last()} fallback={<p class="v21-keymon-wait">キーを押すと、ここに信号が出ます（入力欄の中でも外でも）。</p>}>
          {(l) => (
            <>
              <div class="v21-keymon-chord">{l().chord}</div>
              <div class="v21-keymon-sub">{l().main}</div>
              <div class="v21-keymon-sub">{l().detail}</div>
              <Show when={lostNote()}><div class="v21-keymon-verdict v21-keymon-lost">{lostNote()}</div></Show>
              <Show when={l().verdict}>
                {(v) => <div class="v21-keymon-verdict" classList={{ ok: v().ok }}>Alt+番号: {v().ok ? '受け取れる' : `受け取れない — ${v().why}`}</div>}
              </Show>
            </>
          )}
        </Show>
      </div>
      <ol class="v21-keymon-log">
        <For each={rows()}>
          {(r) => (
            <li classList={{ down: r.type === 'keydown', other: r.type !== 'keydown' && r.type !== 'keyup' }}>
              <span class="t">{r.t}</span>
              <span class="ty">{r.type}</span>
              <span class="m">{r.main}</span>
              <span class="d">{r.detail}{r.chord ? `  → ${r.chord}` : ''}</span>
            </li>
          )}
        </For>
      </ol>
      <div class="v21-keymon-tools">
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => setPaused(!paused())}>{paused() ? '再開' : '一時停止'}</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => { setRows([]); setLast(null); n = 0; started = performance.now() }}>クリア</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={copy}>{copied() ? 'コピーした' : 'コピー'}</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => go({ name: 'settings' })} title="設定 → ショートカット">登録へ</button>
      </div>
    </div>
  )
}

export default KeyMonitor
