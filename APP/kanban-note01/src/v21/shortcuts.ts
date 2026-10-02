import { createSignal } from 'solid-js'

// 端末ごとのショートカット（2026-09-28 利用者）。設定 → ショートカット で、タブ PC／Android（縦）／タブレット（横）ごとに持つ。
// 「押して登録」で、押したキーの組み合わせを KeyMonitor の chordOf() と同じ形（例 "Ctrl+Alt+KeyD"）で保存する。
// いま使うタブは、端末の種類と向きから自動で決める（同じタブレットでも、縦なら Android（縦）、横ならタブレット（横））。
// 既定の操作（Alt+番号 など）はそのまま。登録した組み合わせは、既定より先に受け取る。
// 保存先はこの端末（localStorage）。キーの信号は端末ごとに違うので、登録はその端末で行う。

export type DeviceProfile = 'pc' | 'android' | 'tablet'
export const PROFILES: Array<{ id: DeviceProfile; label: string; hint: string }> = [
  { id: 'pc', label: 'PC', hint: 'マウスで操作する画面' },
  { id: 'android', label: 'Android（縦）', hint: 'スマホ・タブレットの縦向き' },
  { id: 'tablet', label: 'タブレット（横）', hint: 'タブレットの横向き（幅900px以上）' },
]

export type ShortcutAction =
  | 'desk.split.toggle' | 'app.keymon'
  | 'talk.speak.0' | 'talk.speak.1' | 'talk.speak.2' | 'talk.speak.3' | 'talk.speak.4'
  | 'talk.speak.5' | 'talk.speak.6' | 'talk.speak.7' | 'talk.speak.8' | 'talk.speak.9'
  | 'desk.tag.cast' | 'desk.tag.scenes' | 'desk.tag.tags'

export const ACTIONS: Array<{ id: ShortcutAction; label: string; where: string; builtin?: string }> = [
  { id: 'desk.split.toggle', label: '2カラムの切り替え', where: '下書き', builtin: 'F16' },
  { id: 'app.keymon', label: 'キー入力モニターを開く／閉じる', where: 'どこでも', builtin: 'F17' },
  { id: 'talk.speak.0', label: 'ナレーションの行', where: '会話ログ・下書き', builtin: 'Alt+Digit0' },
  ...Array.from({ length: 9 }, (_, i) => ({ id: `talk.speak.${i + 1}` as ShortcutAction, label: `人物${i + 1}のセリフ`, where: '会話ログ・下書き', builtin: `Alt+Digit${i + 1}` })),
  { id: 'desk.tag.cast', label: '直書きタグ [Character_""]', where: '下書き', builtin: 'F13' },
  { id: 'desk.tag.scenes', label: '直書きタグ [Scene_""]', where: '下書き', builtin: 'F14' },
  { id: 'desk.tag.tags', label: '直書きタグ [演出_""]', where: '下書き', builtin: 'F15' },
]

/**
 * 外の操作盤（KeyDeck）向けの既定キー（2026-09-28）。F13〜F17 は普通のキーボードに無いので、打ち間違いとぶつからない。
 * KeyDeck のボタンからこのキーを送ると、登録しなくても動く。端末ごとの登録（上の ACTIONS の割り当て）が先に効く。
 * 一覧は docs/commands/kanban_note_commands_v0.1.json（KeyDeck への依頼 REQ-20260928-001 が使う）
 */
export const EXTERNAL_DEFAULTS: Partial<Record<ShortcutAction, string>> = {
  'desk.tag.cast': 'F13', 'desk.tag.scenes': 'F14', 'desk.tag.tags': 'F15', 'desk.split.toggle': 'F16', 'app.keymon': 'F17',
}

type Bindings = Partial<Record<ShortcutAction, string>>
type Store = Record<DeviceProfile, Bindings>
const KEY = 'note-story-v21-shortcuts'

function read(): Store {
  const empty: Store = { pc: {}, android: {}, tablet: {} }
  try { return { ...empty, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Store>) } } catch { return empty }
}
const [store, setStore] = createSignal<Store>(read())
export { store as shortcutStore }
function save(next: Store) {
  setStore(next)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* 無視 */ }
}

/** いまの端末の種類と向きから、使うタブを決める */
export function detectProfile(): DeviceProfile {
  const mm = (q: string) => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(q).matches : false)
  if (!mm('(pointer: coarse)')) return 'pc'
  if (mm('(orientation: landscape)') && mm('(min-width: 900px)')) return 'tablet'
  return 'android'
}
const [profile, setProfile] = createSignal<DeviceProfile>(detectProfile())
export { profile as currentProfile }
if (typeof window !== 'undefined') {
  const update = () => setProfile(detectProfile())
  window.addEventListener('resize', update)
  window.addEventListener('orientationchange', update)
}

export const bindingsOf = (p: DeviceProfile) => store()[p] ?? {}

/** 登録してよい組み合わせか。だめなら理由 */
export function chordProblem(chord: string, e?: KeyboardEvent): string {
  if (!chord || /(^|\+)(Process|Unidentified|Dead)$/.test(chord) || e?.keyCode === 229 || e?.isComposing) {
    return 'この端末では、このキーは日本語入力などが先に受け取るので登録できません（キー入力モニターで信号を確かめられます）'
  }
  const parts = chord.split('+')
  const main = parts[parts.length - 1]
  const hasMod = parts.some((p) => ['Ctrl', 'Alt', 'Meta', 'NonConvert', 'Convert'].includes(p)) && parts.length > 1
  const special = /^(F\d{1,2}|NonConvert|Convert|KanaMode|Lang\d|Insert|Pause|ScrollLock|PrintScreen|ContextMenu|Media\w+|Audio\w+|Browser\w+|Launch\w+)$/.test(main)
  if (!hasMod && !special) return '文字を打つキーだけでは登録できません（Ctrl・Alt と組み合わせるか、F13 などの特別なキー）'
  return ''
}

/** 登録する。同じ組み合わせがほかの操作にあれば、そちらから外す（外した操作の名前を返す） */
export function setBinding(p: DeviceProfile, action: ShortcutAction, chord: string): string | null {
  const cur = { ...bindingsOf(p) }
  let moved: string | null = null
  for (const [a, c] of Object.entries(cur)) {
    if (c === chord && a !== action) {
      delete cur[a as ShortcutAction]
      moved = ACTIONS.find((x) => x.id === a)?.label ?? a
    }
  }
  cur[action] = chord
  save({ ...store(), [p]: cur })
  return moved
}
export function clearBinding(p: DeviceProfile, action: ShortcutAction) {
  const cur = { ...bindingsOf(p) }
  delete cur[action]
  save({ ...store(), [p]: cur })
}
export function clearProfile(p: DeviceProfile) {
  save({ ...store(), [p]: {} })
}

/** いまの端末のタブで、この組み合わせに登録された操作 */
export function actionFor(chord: string): ShortcutAction | null {
  const b = bindingsOf(profile())
  for (const [a, c] of Object.entries(b)) if (c === chord) return a as ShortcutAction
  // 登録が無ければ、外の操作盤向けの既定キー（F13〜F17）
  for (const [a, c] of Object.entries(EXTERNAL_DEFAULTS)) if (c === chord) return a as ShortcutAction
  return null
}

// 「押して登録」を待っているあいだは、ショートカットを動かさない
const [recording, setRecording] = createSignal(false)
export { recording as shortcutRecording, setRecording as setShortcutRecording }

/** 操作を画面へ知らせる（会話ログ・下書き・2カラムの画面がそれぞれ受け取る） */
export const ACTION_EVENT = 'v21-shortcut'
export function emitAction(action: ShortcutAction) {
  window.dispatchEvent(new CustomEvent(ACTION_EVENT, { detail: action }))
}
export function onAction(handler: (action: ShortcutAction) => void) {
  const fn = (e: Event) => handler((e as CustomEvent<ShortcutAction>).detail)
  window.addEventListener(ACTION_EVENT, fn)
  return () => window.removeEventListener(ACTION_EVENT, fn)
}

/** 表示用（Digit1 → 1、KeyD → D） */
export const prettyChord = (c: string) => c.split('+').map((p) => p === 'Convert' ? '変換' : p === 'NonConvert' ? '無変換' : p.replace(/^Digit/, '').replace(/^Key/, '').replace(/^Numpad/, 'Num')).join(' + ')
