import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { state } from '../store'
import type { WwEntry, WwKind } from '../types'
import { WW_KINDS, addWw, removeWw, wwKindLabel } from './actions'
import { hold } from './sideNav'
import { askConfirm } from './dialog'

// WW（World Word＝世界観の用語）のパネル。作品ごとにアイテム・武器・スキル・用語を登録し、押すと名前を貼る（2026-09-28 利用者）。
// 名前と Dict（読み・説明）だけでよい。将来はアイテムリスト・スキルリスト（MasterDB）から選べるようにする。
// 会話ログ・執筆デスク（PC のパネル・スマホのサイドバー）で共通。

type Props = {
  notebookId?: string
  onPick: (name: string, entry: WwEntry) => void
  /** スマホのサイドバーでは、上の検索窓の文字をもらう（このパネルの検索欄は出さない） */
  query?: string
  showTitle?: boolean
}

const WwPanel: Component<Props> = (props) => {
  const nb = () => (props.notebookId ? state.notebooks.find((n) => n.id === props.notebookId) : undefined)
  const [kind, setKind] = createSignal<WwKind | 'all'>('all')
  const [ownQuery, setOwnQuery] = createSignal('')
  const [addKind, setAddKind] = createSignal<WwKind>('item')
  const [error, setError] = createSignal('')
  const q = () => (props.query ?? ownQuery()).trim().toLowerCase()
  const list = createMemo(() =>
    (nb()?.ww ?? []).filter((e) => (kind() === 'all' || e.kind === kind()) && (!q() || `${e.name} ${e.dict ?? ''}`.toLowerCase().includes(q()))),
  )
  const count = (k: WwKind | 'all') => (nb()?.ww ?? []).filter((e) => k === 'all' || e.kind === k).length

  function add(e: SubmitEvent) {
    e.preventDefault()
    const f = e.currentTarget as HTMLFormElement
    const name = (f.elements.namedItem('wwName') as HTMLInputElement).value
    const dict = (f.elements.namedItem('wwDict') as HTMLInputElement).value
    const problem = addWw(props.notebookId!, addKind(), name, dict)
    if (problem) { setError(problem); return }
    setError('')
    f.reset()
  }

  return (
    <>
      <Show when={props.showTitle !== false}><h3 class="tl-side-title">WW（World Word）</h3></Show>
      <Show
        when={props.notebookId && nb()}
        fallback={<p class="tl-side-lead">WW は作品ごとに登録します。どの作品にも属さないメモでは使えません。</p>}
      >
        <p class="tl-side-lead">アイテム・武器・スキル・用語を登録しておき、押すと名前を貼ります。</p>
        <div class="v21-ww-kinds" role="tablist" onPointerDown={hold}>
          <For each={[{ id: 'all' as const, label: 'すべて' }, ...WW_KINDS]}>
            {(k) => (
              <button type="button" role="tab" classList={{ on: kind() === k.id }} onClick={() => { setKind(k.id); if (k.id !== 'all') setAddKind(k.id) }}>
                {k.label}<span>{count(k.id)}</span>
              </button>
            )}
          </For>
        </div>
        <Show when={props.query === undefined}>
          <input class="v21-ww-search" placeholder="WW を探す（名前・Dict）" value={ownQuery()} onInput={(e) => setOwnQuery(e.currentTarget.value)} />
        </Show>
        <ul class="v21-ww-list" onPointerDown={hold}>
          <For each={list()} fallback={<li class="v21-ww-empty">{q() ? '見つかりません。' : 'まだ登録がありません。下の欄から足せます。'}</li>}>
            {(e) => (
              <li>
                <button type="button" class="v21-ww-pick" onClick={() => props.onPick(e.name, e)} title={`押すと「${e.name}」を貼る`}>
                  <span class="v21-ww-kind">{wwKindLabel(e.kind)}</span>
                  <span class="v21-ww-name">{e.name}<Show when={e.dict}><small>{e.dict}</small></Show></span>
                </button>
                <button type="button" class="v21-ww-del" aria-label={`${e.name} を消す`} title="消す" onClick={async () => { if (await askConfirm({ title: `WW の「${e.name}」を消しますか？`, message: '本文に貼った名前はそのまま残ります。', okLabel: '消す', danger: true })) removeWw(props.notebookId!, e.id) }}>×</button>
              </li>
            )}
          </For>
        </ul>
        <form class="v21-ww-add" onSubmit={add}>
          <select value={addKind()} aria-label="種類" onChange={(e) => setAddKind(e.currentTarget.value as WwKind)}>
            <For each={WW_KINDS}>{(k) => <option value={k.id}>{k.label}</option>}</For>
          </select>
          <input name="wwName" placeholder="名前" aria-label="名前" enterkeyhint="next" />
          <input name="wwDict" placeholder="Dict（読み・説明。無くてもよい）" aria-label="Dict" enterkeyhint="done" />
          <button type="submit" class="v21-btn">足す</button>
        </form>
        <Show when={error()}><p class="v21-cast-side-error" role="alert">{error()}</p></Show>
      </Show>
    </>
  )
}

export default WwPanel
