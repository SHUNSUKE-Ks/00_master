import { type Component, For, Show, createSignal } from 'solid-js'
import type { PageCharacter } from '../types'
import { addCharacter, renameCharacterWithConfirm } from './actions'
import { hold } from './sideNav'
import { isDefaultSlotName } from './nav'

// サイドバーの「登場人物」。押すとセリフ、✎ で名前を変える、下の欄で人物を足す。
// 会話ログと執筆デスク（作品の下書き）で共通。保存先は作品ページの登場人物と同じ（nb.cast）。
// 並べ替え・外すは作品ページで行う（押し間違いで番号＝Alt+番号が変わらないように）。

type Props = {
  notebookId?: string
  /** 番号つきで並べる名前（Alt+1〜9） */
  names: string[]
  /** 作品に未登録で、画面だけの仮の名前（CharacterA など）のとき */
  placeholder?: boolean
  /** 作品に登録する元の一覧（未登録なら、これを登録してから足す／変える） */
  base: () => PageCharacter[]
  onSpeak: (index: number) => void
  onNarration: () => void
  portraitOf?: (name: string) => PageCharacter | undefined
  roleOf?: (name: string) => string
  onRenamed?: (from: string, to: string) => void
  onMessage?: (text: string) => void
  onOpenTitle?: () => void
}

const CastSidebar: Component<Props> = (props) => {
  const [editing, setEditing] = createSignal<string | null>(null)
  const [draft, setDraft] = createSignal('')
  const [error, setError] = createSignal('')
  let saving = false

  const say = (text: string) => { setError(text); if (text) props.onMessage?.(text) }

  function startEdit(name: string) {
    setError('')
    setDraft(name)
    setEditing(name)
  }
  async function saveEdit() {
    const from = editing()
    if (!from || saving || !props.notebookId) return
    saving = true
    const to = draft().trim()
    // 仮の名前（CharacterA など）を変えたときは、その1人だけを登録する
    const base = props.placeholder || !props.base().length ? [{ id: '', name: from, dict: from, prompt: '', role: '', note: '' }] : props.base()
    const problem = await renameCharacterWithConfirm(props.notebookId, base, from, to)
    saving = false
    if (problem === 'cancelled') return
    if (problem) { say(problem); return }
    setError('')
    setEditing(null)
    if (to !== from) {
      props.onRenamed?.(from, to)
      props.onMessage?.(`「${from}」を「${to}」に変えました（セリフの名前も付け替えました）`)
    }
  }
  function add(e: SubmitEvent) {
    e.preventDefault()
    if (!props.notebookId) return
    const input = (e.currentTarget as HTMLFormElement).elements.namedItem('castName') as HTMLInputElement
    const free = props.base().findIndex((c, i) => isDefaultSlotName(c.name, i))
    const problem = addCharacter(props.notebookId, props.base(), input.value)
    if (problem) { say(problem); return }
    props.onMessage?.(`「${input.value.trim()}」を ${free + 1}番（Alt+${free + 1}）に入れました`)
    setError('')
    input.value = ''
  }

  return (
    <>
      <h3 class="tl-side-title">登場人物</h3>
      <p class="tl-side-lead">押すと、いまの行の直下にその人のセリフができます。✎ で名前を変えると、作品の登場人物と全セリフが変わります。</p>
      <div class="tl-side-cast" onPointerDown={hold}>
        <button type="button" onClick={() => props.onNarration()} title="Alt+0（全作品共通）">
          <kbd>0</kbd>
          <span class="tl-side-face empty">地</span>
          <span class="tl-side-name">ナレーション<small>全作品共通・名前は出さない</small></span>
        </button>
        <For each={props.names}>
          {(name, i) => (
            <Show
              when={editing() === name}
              fallback={
                <div class="v21-cast-side-row">
                  <button type="button" onClick={() => props.onSpeak(i())} title={`Alt+${i() + 1}`}>
                    <kbd>{i() + 1}</kbd>
                    <Show when={props.portraitOf?.(name)} fallback={<span class="tl-side-face empty">{[...name][0] ?? '?'}</span>}>
                      {(c) => <img class="tl-side-face" src={c().portrait!} alt="" loading="lazy" style={{ 'object-position': `${c().focusX ?? '50%'} ${c().focusY ?? '15%'}` }} />}
                    </Show>
                    <span class="tl-side-name">
                      {name}
                      <Show when={isDefaultSlotName(name, i())} fallback={<Show when={props.roleOf?.(name)}><small>{props.roleOf!(name)}</small></Show>}>
                        <small>空き（✎ で名前を入れる）</small>
                      </Show>
                    </span>
                  </button>
                  <Show when={props.notebookId}>
                    <button type="button" class="v21-cast-side-edit" title={`「${name}」の名前を変える`} aria-label={`${name}の名前を変える`} onClick={() => startEdit(name)}>✎</button>
                  </Show>
                </div>
              }
            >
              <form class="v21-cast-side-form" onSubmit={(e) => { e.preventDefault(); saveEdit() }}>
                <kbd>{i() + 1}</kbd>
                <input
                  ref={(el) => requestAnimationFrame(() => { el.focus(); el.select() })}
                  value={draft()}
                  aria-label="新しい名前"
                  onInput={(e) => setDraft(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditing(null); setError('') } }}
                />
                <button type="submit" class="v21-btn primary">変える</button>
                <button type="button" class="v21-btn" onClick={() => { setEditing(null); setError('') }}>やめる</button>
              </form>
            </Show>
          )}
        </For>
      </div>

      <Show when={props.notebookId}>
        <form class="v21-cast-side-add" onSubmit={add}>
          <input name="castName" placeholder="＋ 人物を足す（空きの枠に入れる・Enter）" aria-label="足す人物の名前" enterkeyhint="done" />
          <button type="submit" class="v21-btn">足す</button>
        </form>
        <Show when={error()}><p class="v21-cast-side-error" role="alert">{error()}</p></Show>
        <Show when={props.onOpenTitle}>
          <button type="button" class="v21-link v21-cast-side-more" onClick={() => props.onOpenTitle!()}>並べ替え・外す・説明は作品ページで →</button>
        </Show>
      </Show>
    </>
  )
}

export default CastSidebar
