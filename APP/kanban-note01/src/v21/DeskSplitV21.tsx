import { type Component, For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { state } from '../store'
import WritingDeskV21 from './WritingDeskV21'
import { DRAFT_KINDS, MEMO_SHELF, addDraft, addMemo, draftsOf, flushDrafts, liveMemos, type Draft } from './drafts'
import { go } from './nav'
import { onAction } from './shortcuts'

// 執筆デスクの2カラム（2026-09-28 利用者: iPad などタブレットの横画面で、下書きを2つ並べて書く）。
// 列ごとにタブ（VS Code のタブのように。いま開いている物は名前の前に緑の丸）と、
// その列のノートの右の境目に縦長NAV（押す＝直書きのタグ／長押し＝そのジャンルのサイドバー）。
//
// 1カラム／2カラムは端末ごとに覚える。覚えていなければ、タブレットの横画面（指で触る・横長・幅900px以上）で2カラム。

const SPLIT_QUERY = '(min-width: 900px)'
const TABLET_LANDSCAPE = '(min-width: 900px) and (orientation: landscape) and (pointer: coarse)'
const MODE_KEY = 'note-story-v21-desk-split'
const RIGHT_KEY = 'note-story-v21-desk-split-right'

function media(q: string) {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(q) : null
}
function readMode(): boolean | null {
  try {
    const v = localStorage.getItem(MODE_KEY)
    return v === null ? null : v === '1'
  } catch { return null }
}
function readRight(shelf: string): string | null {
  try { return (JSON.parse(localStorage.getItem(RIGHT_KEY) || '{}') as Record<string, string>)[shelf] ?? null } catch { return null }
}
function saveRight(shelf: string, id: string) {
  try {
    const all = JSON.parse(localStorage.getItem(RIGHT_KEY) || '{}') as Record<string, string>
    all[shelf] = id
    localStorage.setItem(RIGHT_KEY, JSON.stringify(all))
  } catch { /* 無視 */ }
}

/** 執筆デスクの画面（1カラムか2カラムかを決める） */
const DeskScreenV21: Component<{ shelf: string; draftId: string }> = (props) => {
  const mq = media(SPLIT_QUERY)
  const [canSplit, setCanSplit] = createSignal(mq?.matches ?? false)
  const onChange = (e: MediaQueryListEvent) => setCanSplit(e.matches)
  onMount(() => mq?.addEventListener?.('change', onChange))
  onCleanup(() => mq?.removeEventListener?.('change', onChange))
  const [split, setSplitSignal] = createSignal<boolean>(readMode() ?? (media(TABLET_LANDSCAPE)?.matches ?? false))
  const setSplit = (v: boolean) => {
    setSplitSignal(v)
    try { localStorage.setItem(MODE_KEY, v ? '1' : '0') } catch { /* 無視 */ }
  }
  // 端末ごとに登録したショートカット「2カラムの切り替え」
  onCleanup(onAction((action) => {
    if (action !== 'desk.split.toggle' || !canSplit()) return
    flushDrafts()
    setSplit(!split())
  }))
  return (
    <Show
      when={split() && canSplit()}
      fallback={<WritingDeskV21 shelf={props.shelf} draftId={props.draftId} canSplit={canSplit()} onSplit={() => setSplit(true)} />}
    >
      <DeskSplit shelf={props.shelf} draftId={props.draftId} onSingle={() => setSplit(false)} />
    </Show>
  )
}

const DeskSplit: Component<{ shelf: string; draftId: string; onSingle: () => void }> = (props) => {
  const isMemo = () => props.shelf === MEMO_SHELF
  const notebook = () => (isMemo() ? undefined : state.notebooks.find((n) => n.id === props.shelf))
  const list = createMemo<Draft[]>(() =>
    (isMemo() ? liveMemos() : draftsOf(props.shelf)).slice().sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
  )
  const exists = (id: string | null) => !!id && list().some((d) => d.id === id)

  const [left, setLeft] = createSignal<string | null>(props.draftId)
  const firstOther = () => list().find((d) => d.id !== left())?.id ?? null
  const remembered = readRight(props.shelf)
  const [right, setRightSignal] = createSignal<string | null>(remembered && remembered !== props.draftId && exists(remembered) ? remembered : firstOther())
  const setRight = (id: string) => { setRightSignal(id); saveRight(props.shelf, id) }

  const name = (d: Draft) => d.title.trim() || d.body.trim().split('\n')[0]?.slice(0, 18) || (isMemo() ? '無題のメモ' : '無題の下書き')
  function create(side: 'left' | 'right') {
    const d = isMemo() ? addMemo() : addDraft(props.shelf)
    if (side === 'left') setLeft(d.id)
    else setRight(d.id)
  }
  function back() {
    flushDrafts()
    if (isMemo()) go({ name: 'memos' })
    else go({ name: 'title', notebookId: props.shelf })
  }

  const Column = (p: { side: 'left' | 'right'; active: () => string | null; setActive: (id: string) => void }) => (
    <section class="v21-split-col" aria-label={p.side === 'left' ? '左の列' : '右の列'}>
      <div class="v21-split-tabs" role="tablist">
        <For each={list()}>
          {(d) => (
            <button
              type="button"
              role="tab"
              class="v21-split-tab"
              classList={{ on: p.active() === d.id }}
              aria-selected={p.active() === d.id}
              title={name(d)}
              onClick={() => { flushDrafts(); p.setActive(d.id) }}
            >
              <Show when={p.active() === d.id}><span class="v21-split-dot" aria-label="開いている" /></Show>
              <span class="v21-split-tab-name">{name(d)}</span>
              <Show when={!isMemo() && d.kind && d.kind !== 'draft'}>
                <small>{DRAFT_KINDS.find((k) => k.id === d.kind)?.label}</small>
              </Show>
            </button>
          )}
        </For>
        <button type="button" class="v21-split-tab add" title={isMemo() ? '新しいメモ' : '新しい下書き'} onClick={() => create(p.side)}>＋</button>
      </div>
      <div class="v21-split-pane">
        <Show
          when={p.active() && exists(p.active()) ? p.active() : null}
          keyed
          fallback={
            <div class="v21-split-empty">
              <p>この列に開く{isMemo() ? 'メモ' : '下書き'}を、上のタブから選んでください。</p>
              <button type="button" class="v21-btn" onClick={() => create(p.side)}>＋ {isMemo() ? '新しいメモ' : '新しい下書き'}</button>
            </div>
          }
        >
          {(id) => <WritingDeskV21 shelf={props.shelf} draftId={id} embedded onOpenSheet={(next) => { flushDrafts(); p.setActive(next) }} />}
        </Show>
      </div>
    </section>
  )

  return (
    <div class="v21-split">
      <div class="v21-split-head">
        <button type="button" class="v21-back" onClick={back}>← {isMemo() ? 'アイディアメモ' : notebook()?.title || '作品'}</button>
        <span class="v21-desk-where">2カラム・{isMemo() ? 'どの作品にも属さないメモ' : '下書き（本番の場面とは別）'}</span>
        <button type="button" class="v21-btn v21-desk-split" onClick={() => { flushDrafts(); props.onSingle() }} title="1つだけ大きく書く">1カラムに戻す</button>
      </div>
      <div class="v21-split-cols">
        <Column side="left" active={left} setActive={setLeft} />
        <Column side="right" active={right} setActive={setRight} />
      </div>
    </div>
  )
}

export default DeskScreenV21
