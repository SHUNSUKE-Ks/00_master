import { type Component, For, Show, createSignal, onCleanup } from 'solid-js'
import { formatScenarioBlock, cursorOffsetForScenarioBlock, type ScenarioBlockKind } from '../utils/scenarioFormat'
import { formatCallout, type CalloutKind } from '../utils/calloutFormat'
import TagPicker from './TagPicker'
import { addDraft, deleteDraft, draftsOf, flushDrafts, updateDraft } from './drafts'
import { go } from './nav'
import { askConfirm } from './dialog'

// 作品ページの「下書き」。仮置きで何枚でも書ける。本番の場面（notebook.pages）とは別の置き場に保存する。
// 書く道具は旧ノート（ScenarioInputSection / CharacterInputSection / CalloutInputSection）と同じ書式を使う。
// 横の候補は2段のタブ: 共通（タグ辞書）／キャラクター／WW。押すとカーソル位置に貼る。

type Props = { notebookId: string; cast: string[] }
type PanelTab = 'common' | 'cast' | 'ww'

const CALLOUT_KINDS: Array<{ id: CalloutKind; label: string; emoji: string }> = [
  { id: 'pillar', label: '柱 / Scene', emoji: '🧱' },
  { id: 'memo', label: '補足メモ', emoji: '📝' },
  { id: 'idea', label: 'IdeaBoard', emoji: '💡' },
]
const EMOJIS = ['🧱', '🎬', '📝', '💡', '📌', '⚠️', '🌱']

const DraftsV21: Component<Props> = (props) => {
  const drafts = () => draftsOf(props.notebookId)
  const [activeId, setActiveId] = createSignal<string | null>(drafts()[0]?.id ?? null)
  const active = () => drafts().find((d) => d.id === activeId()) ?? drafts()[0]
  let ta: HTMLTextAreaElement | undefined

  onCleanup(flushDrafts)

  function newDraft() {
    const d = addDraft(props.notebookId)
    setActiveId(d.id)
    requestAnimationFrame(() => ta?.focus())
  }
  async function removeDraft() {
    const d = active()
    if (!d) return
    if (d.body.trim() && !(await askConfirm({ title: `「${d.title}」を消しますか？`, message: '元に戻せません。', okLabel: '消す', danger: true }))) return
    deleteDraft(props.notebookId, d.id)
    setActiveId(drafts()[0]?.id ?? null)
  }

  // ---- カーソル位置へ差し込む ----
  function insert(text: string, opts: { block?: boolean; caret?: number } = {}) {
    const d = active()
    if (!d || !ta) return
    const value = ta.value
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? start
    let before = value.slice(0, start)
    let after = value.slice(end)
    let piece = text
    if (opts.block) {
      if (before && !before.endsWith('\n')) before += '\n'
      if (after && !after.startsWith('\n')) piece += '\n'
    } else {
      if (before && !/\s$/.test(before)) piece = ' ' + piece
      if (!after.startsWith(' ')) piece += ' '
    }
    const next = before + piece + after
    const caret = before.length + (opts.caret ?? piece.length)
    updateDraft(props.notebookId, d.id, { body: next })
    requestAnimationFrame(() => {
      if (!ta) return
      ta.value = next
      ta.focus()
      ta.setSelectionRange(caret, caret)
    })
  }
  const insertBlock = (kind: ScenarioBlockKind) =>
    insert(formatScenarioBlock(kind), { block: true, caret: cursorOffsetForScenarioBlock(kind) })
  const insertLine = (name: string) => {
    const line = `${name}：「」`
    insert(line, { block: true, caret: line.length - 1 })
  }

  // ---- Callout（旧ノートの「tagをセレクトで入れる」行） ----
  const [calloutKind, setCalloutKind] = createSignal<CalloutKind>('pillar')
  const [calloutEmoji, setCalloutEmoji] = createSignal('🧱')
  const [calloutTitle, setCalloutTitle] = createSignal('')
  const [calloutTags, setCalloutTags] = createSignal('')
  function insertCallout() {
    insert(formatCallout({ kind: calloutKind(), emoji: calloutEmoji(), title: calloutTitle(), tags: calloutTags() }), { block: true })
    setCalloutTitle('')
    setCalloutTags('')
  }

  // ---- 横の候補（2段のタブ）: 1段目 共通／キャラクター／WW。共通は TagPicker ----
  const [panelTab, setPanelTab] = createSignal<PanelTab>('common')

  return (
    <div class="v21-drafts">
      <div class="v21-draft-sheets" role="tablist" aria-label="下書き">
        <For each={drafts()}>
          {(d) => (
            <button type="button" role="tab" classList={{ on: active()?.id === d.id }} onClick={() => setActiveId(d.id)}>
              {d.title || '無題'}
            </button>
          )}
        </For>
        <button type="button" class="add" onClick={newDraft}>＋ 新しい下書き</button>
        <span class="v21-draft-where">この端末だけに保存・本番の場面とは別</span>
      </div>

      <Show
        when={active()}
        fallback={
          <div class="v21-draft-empty">
            <p>下書きはまだありません。思いついた会話や場面を、本番の場面に入れる前にここへ仮置きできます。</p>
            <button type="button" class="v21-btn primary" onClick={newDraft}>＋ 最初の下書きを作る</button>
          </div>
        }
      >
        {(d) => (
          <div class="v21-draft-work">
            <div class="v21-draft-editor">
              <div class="v21-draft-head">
                <input
                  class="v21-draft-title"
                  value={d().title}
                  aria-label="下書きの名前"
                  onInput={(e) => updateDraft(props.notebookId, d().id, { title: e.currentTarget.value })}
                />
                <button
                  type="button"
                  class="v21-btn v21-draft-desk"
                  title="会話ログと同じ候補のNAVつきの画面で書く"
                  onClick={() => { flushDrafts(); go({ name: 'desk', shelf: props.notebookId, draftId: d().id }) }}
                >
                  執筆デスクで開く
                </button>
                <button type="button" class="v21-icon-btn" title="この下書きを消す" onClick={removeDraft}>🗑</button>
              </div>

              <div class="v21-draft-blocks">
                <button type="button" class="blk pillar" onClick={() => insertBlock('pillar')}><b>柱</b><small>Scene / Event</small></button>
                <button type="button" class="blk direction" onClick={() => insertBlock('direction')}><b>ト</b><small>情景 / 動作</small></button>
                <button type="button" class="blk dialogue" onClick={() => insertBlock('dialogue')}><b>セリフ</b><small>名前：「」</small></button>
              </div>

              <Show when={props.cast.length}>
                <div class="v21-draft-cast">
                  <span>人物</span>
                  <For each={props.cast}>{(name) => <button type="button" onClick={() => insertLine(name)}>{name}</button>}</For>
                </div>
              </Show>

              <div class="v21-draft-callout">
                <select value={calloutKind()} aria-label="Calloutの種類" onChange={(e) => {
                  const k = CALLOUT_KINDS.find((x) => x.id === e.currentTarget.value)!
                  setCalloutKind(k.id)
                  setCalloutEmoji(k.emoji)
                }}>
                  <For each={CALLOUT_KINDS}>{(k) => <option value={k.id}>{k.label}</option>}</For>
                </select>
                <select value={calloutEmoji()} aria-label="絵文字" onChange={(e) => setCalloutEmoji(e.currentTarget.value)}>
                  <For each={EMOJIS}>{(x) => <option value={x}>{x}</option>}</For>
                </select>
                <input placeholder="Scene / Event名" value={calloutTitle()} onInput={(e) => setCalloutTitle(e.currentTarget.value)} />
                <input class="short" placeholder="TitleTag" value={calloutTags()} onInput={(e) => setCalloutTags(e.currentTarget.value)} />
                <button type="button" class="v21-btn" onClick={insertCallout}>Callout</button>
              </div>

              <textarea
                ref={ta}
                class="v21-draft-text"
                value={d().body}
                placeholder={'柱：\nト：\n名前：「」\n\n横の候補を押すと、カーソルの位置に貼ります'}
                onInput={(e) => updateDraft(props.notebookId, d().id, { body: e.currentTarget.value })}
              />
            </div>

            <aside class="v21-tagpanel" aria-label="貼れる候補">
              <div class="v21-tag-tabs" role="tablist">
                <button type="button" classList={{ on: panelTab() === 'common' }} onClick={() => setPanelTab('common')}>共通</button>
                <button type="button" classList={{ on: panelTab() === 'cast' }} onClick={() => setPanelTab('cast')}>キャラクター</button>
                <button type="button" classList={{ on: panelTab() === 'ww' }} onClick={() => setPanelTab('ww')}>WW</button>
              </div>

              <Show when={panelTab() === 'common'}>
                <TagPicker onPick={(id) => insert(`[${id}]`)} />
              </Show>

              <Show when={panelTab() === 'cast'}>
                <p class="v21-dim v21-small">仮置き: 作品の登場人物を出しています（本番と分けるかは未定）。押すと <code>名前：「」</code> を貼ります。</p>
                <div class="v21-tag-list">
                  <For each={props.cast} fallback={<p class="v21-dim v21-small">登場人物がいません。</p>}>
                    {(name) => <button type="button" class="v21-tag" onClick={() => insertLine(name)}><code>{name}：「」</code></button>}
                  </For>
                </div>
              </Show>

              <Show when={panelTab() === 'ww'}>
                <p class="v21-dim v21-small">WW（World Word＝世界観の用語）の置き場は未定です。決まったらここに候補を出します。</p>
              </Show>
            </aside>
          </div>
        )}
      </Show>

    </div>
  )
}

export default DraftsV21
