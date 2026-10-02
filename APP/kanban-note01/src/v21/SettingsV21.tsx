import { type Component, For, Show, createSignal, onCleanup } from 'solid-js'
import { chordOf, isHoldKey, toggleKeyMonitor } from './KeyMonitor'
import { askConfirm } from './dialog'
import {
  ACTIONS, PROFILES, bindingsOf, chordProblem, clearBinding, clearProfile, currentProfile, prettyChord, setBinding,
  setShortcutRecording, type DeviceProfile, type ShortcutAction,
} from './shortcuts'

// 設定 → ショートカット。タブで PC／Android（縦）／タブレット（横）に分ける（2026-09-28 利用者）。
// 「押して登録」→ 次に押したキーの組み合わせを、そのまま保存する（キー入力モニターと同じ形）。

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'OS'])

const SettingsV21: Component = () => {
  const [tab, setTab] = createSignal<DeviceProfile>(currentProfile())
  const [waitingFor, setWaitingFor] = createSignal<ShortcutAction | null>(null)
  const [live, setLive] = createSignal('')
  const [notice, setNotice] = createSignal('')

  let holdAlone: string | null = null
  function onRecordKey(e: KeyboardEvent) {
    const action = waitingFor()
    if (!action) return
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') { stop(); setNotice('登録をやめました'); return }
    if (MODIFIER_KEYS.has(e.key)) { setLive(chordOf(e)); return } // 修飾キーだけ: 続きを待つ
    if (isHoldKey(e.key)) { holdAlone = e.key; setLive(e.key); return } // 変換・無変換: 押したまま次のキーを待つ
    holdAlone = null
    commit(action, chordOf(e), e)
  }
  /** 変換・無変換を押して、ほかのキーを押さずに離したら、それだけで登録 */
  function onRecordKeyUp(e: KeyboardEvent) {
    const action = waitingFor()
    if (!action || !holdAlone || e.key !== holdAlone) return
    e.preventDefault()
    e.stopPropagation()
    holdAlone = null
    commit(action, e.key)
  }
  function commit(action: ShortcutAction, chord: string, e?: KeyboardEvent) {
    const problem = chordProblem(chord, e)
    if (problem) { setLive(chord); setNotice(problem); return }
    const moved = setBinding(tab(), action, chord)
    const label = ACTIONS.find((a) => a.id === action)?.label ?? action
    setNotice(`「${label}」に ${prettyChord(chord)} を登録しました${moved ? `（「${moved}」から外しました）` : ''}`)
    stop()
  }
  function start(action: ShortcutAction) {
    stop()
    setNotice('')
    setLive('')
    setWaitingFor(action)
    setShortcutRecording(true)
    holdAlone = null
    window.addEventListener('keydown', onRecordKey, true)
    window.addEventListener('keyup', onRecordKeyUp, true)
  }
  function stop() {
    window.removeEventListener('keydown', onRecordKey, true)
    window.removeEventListener('keyup', onRecordKeyUp, true)
    setWaitingFor(null)
    setShortcutRecording(false)
    setLive('')
  }
  onCleanup(stop)

  return (
    <div class="v21-page">
      <div class="v21-page-head">
        <div>
          <p class="v21-kicker">SETTINGS</p>
          <h1>設定</h1>
        </div>
      </div>

      <section class="v21-panel v21-shortcuts">
        <div class="v21-panel-head">
          <h3>ショートカット</h3>
          <button type="button" class="v21-link" onClick={toggleKeyMonitor}>キー入力モニターを開く</button>
        </div>
        <p class="v21-dim v21-small">
          端末ごとに「操作 → キーの組み合わせ」を持ちます。「押して登録」を押してから、使いたいキーを押してください（Esc でやめる）。
          変換・無変換は、押したままほかのキーを押すと組み合わせ（例: 変換 + 1）、何も押さずに離すとそれだけで登録します。
          いまの端末で使われるのは <b>{PROFILES.find((p) => p.id === currentProfile())?.label}</b> のタブです（端末の種類と向きで自動で選びます）。
          既定の操作（Alt+番号 など）はそのまま使えます。登録はこの端末に保存します。
        </p>

        <div class="v21-sc-tabs" role="tablist" aria-label="端末">
          <For each={PROFILES}>
            {(p) => (
              <button type="button" role="tab" aria-selected={tab() === p.id} classList={{ on: tab() === p.id }} onClick={() => { stop(); setTab(p.id) }} title={p.hint}>
                <Show when={currentProfile() === p.id}><span class="v21-split-dot" aria-label="この端末" /></Show>
                {p.label}
                <Show when={currentProfile() === p.id}><small>この端末</small></Show>
              </button>
            )}
          </For>
        </div>

        <Show when={notice()}><p class="v21-sc-notice" role="status">{notice()}</p></Show>

        <table class="v21-sc-table">
          <thead>
            <tr><th>操作</th><th>使う画面</th><th>既定</th><th>登録した組み合わせ</th><th /></tr>
          </thead>
          <tbody>
            <For each={ACTIONS}>
              {(a) => {
                const bound = () => bindingsOf(tab())[a.id]
                return (
                  <tr classList={{ waiting: waitingFor() === a.id }}>
                    <td class="label">{a.label}</td>
                    <td class="where">{a.where}</td>
                    <td class="builtin">{a.builtin ? <kbd>{prettyChord(a.builtin)}</kbd> : <span class="v21-dim">なし</span>}</td>
                    <td class="chord">
                      <Show when={waitingFor() === a.id} fallback={bound() ? <kbd>{prettyChord(bound()!)}</kbd> : <span class="v21-dim">なし</span>}>
                        <span class="v21-sc-wait">{live() ? `${prettyChord(live())} …` : 'キーを押してください…'}</span>
                      </Show>
                    </td>
                    <td class="ops">
                      <Show
                        when={waitingFor() === a.id}
                        fallback={
                          <>
                            <button type="button" class="v21-btn" onClick={() => start(a.id)}>押して登録</button>
                            <Show when={bound()}><button type="button" class="v21-icon-btn" title="登録を消す" onClick={() => { clearBinding(tab(), a.id); setNotice(`「${a.label}」の登録を消しました`) }}>×</button></Show>
                          </>
                        }
                      >
                        <button type="button" class="v21-btn" onClick={() => { stop(); setNotice('登録をやめました') }}>やめる</button>
                      </Show>
                    </td>
                  </tr>
                )
              }}
            </For>
          </tbody>
        </table>
        <div class="v21-row v21-sc-foot">
          <button type="button" class="v21-btn" onClick={async () => { if (await askConfirm({ title: `${PROFILES.find((p) => p.id === tab())?.label} の登録をすべて消しますか？`, okLabel: '消す', danger: true })) { clearProfile(tab()); setNotice('このタブの登録をすべて消しました') } }}>このタブの登録をすべて消す</button>
        </div>
      </section>
    </div>
  )
}

export default SettingsV21
