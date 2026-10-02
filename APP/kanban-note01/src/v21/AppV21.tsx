import { type Component, For, Match, Show, Switch, createSignal, onCleanup, onMount } from 'solid-js'
import TalkLogV21 from './TalkLogV21'
import HelpOverlay from './HelpOverlay'
import { currentPhase, type HelpScreen, type HelpSection } from './help'
import HomeV21 from './HomeV21'
import { state } from '../store'
import TitlesV21 from './TitlesV21'
import EventsV21 from './EventsV21'
import TitleV21 from './TitleV21'
import GalleryV21 from './GalleryV21'
import MemosV21 from './MemosV21'
import DeskScreenV21 from './DeskSplitV21'
import KeyMonitor, { chordOf, monitorOpen, toggleKeyMonitor } from './KeyMonitor'
import SettingsV21 from './SettingsV21'
import { DialogHost, dialogOpen } from './dialog'
import { actionFor, emitAction, shortcutRecording, type ShortcutAction } from './shortcuts'
import { MEMO_SHELF, addMemo, liveMemos, sweepMemos } from './drafts'
import { VersionTabs } from './VersionTabs'
import { go, isStoryNotebook, recordAccess, route, type V21Route } from './nav'
import './v21.css'

// Note Story V2.1 の外枠。ノベルゲームのシナリオ作成に絞った入口5つ（2026-09-26 に「メモ」を足した）。
// 情報設計: docs/v21_情報設計_2026-09-25.md

type NavItem = { name: V21Route['name']; label: string; icon: string; target: V21Route }

const NAV: NavItem[] = [
  // ホームは、左上の「Note Story」（ロゴ）が兼ねる（2026-09-30 利用者）。メニューには置かない
  { name: 'titles', label: 'タイトル', icon: 'M5 4.5h9.5L19 9v10.5H5zM14 4.5V9h5M8.5 13h7M8.5 16h5', target: { name: 'titles' } },
  // イベント（2026-09-28。Title の隣）
  { name: 'events', label: 'イベント', icon: 'M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4M8.5 14h3', target: { name: 'events' } },
  { name: 'talk', label: '会話ログ', icon: 'M4.5 6.5h15v9h-8l-4.5 3.5v-3.5H4.5z', target: { name: 'talk' } },
  { name: 'memos', label: 'メモ', icon: 'M6 3.5h12v17l-6-3.8-6 3.8zM9 8h6M9 11.5h4', target: { name: 'memos' } },
  { name: 'gallery', label: 'ギャラリー', icon: 'M4.5 5.5h15v13h-15zM4.5 15l4.5-4.5 4 4 2.5-2.5 4 4M15 9.2h.01', target: { name: 'gallery' } },
]

/**
 * ヘッダーの「メモ」: 一覧を挟まず、Title を選ばない下書き画面（アイディアメモ）へ直接入る（2026-09-30 利用者）。
 * 何も書いていない最新のメモがあればそれを開き、無ければ新しく作る（押すたびに空のメモが増えないように）。
 * 一覧は、画面の左上「← アイディアメモ」から開ける。
 */
function openMemoDesk() {
  const latest = liveMemos().slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0]
  const memo = latest && !latest.title.trim() && !latest.body.trim() ? latest : addMemo()
  go({ name: 'desk', shelf: MEMO_SHELF, draftId: memo.id })
}
const goNav = (item: NavItem) => (item.name === 'memos' ? openMemoDesk() : go(item.target))

const isActive = (item: NavItem) => {
  const r = route()
  if (r.name === 'desk') return item.name === (r.shelf === MEMO_SHELF ? 'memos' : state.notebooks.find((n) => n.id === r.shelf)?.kind === 'event' ? 'events' : 'titles')
  // 作品ページは、Title なら「タイトル」、Event なら「イベント」を光らせる
  if (r.name === 'title') {
    const isEvent = state.notebooks.find((n) => n.id === r.notebookId)?.kind === 'event'
    return item.name === (isEvent ? 'events' : 'titles')
  }
  return r.name === item.name
}

const NavIcon = (props: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={props.d} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
  </svg>
)

const AppV21: Component = () => {
  // ---- ヘルプ（Ctrl+/）: 開いた瞬間の画面と状態を覚えて出す ----
  const [help, setHelp] = createSignal<{ phase: 'input' | 'view' } | null>(null)
  const [talkCast, setTalkCast] = createSignal<string[]>([])
  const helpScreen = (): HelpScreen => route().name
  const helpExtra = (): HelpSection[] =>
    route().name === 'talk' && talkCast().length
      ? [{
          title: 'いまの番号と人物',
          items: talkCast().map((name, i) => ({ keys: [['Alt', String(i + 1)]], text: name, when: 'any' as const })),
        }]
      : []

  function toggleHelp() {
    setHelp((open) => (open ? null : { phase: currentPhase() }))
  }
  // 一つ前の動作に戻る。ボタンは押しても入力欄のフォーカスを外さない（onPointerDown で止める）ので、
  // 入力中の欄の取り消し履歴をそのまま使える。Ctrl+Z はブラウザ標準の取り消しがそのまま働く（二重に処理しない）
  function undoLast() {
    document.execCommand('undo')
  }
  // capture: 入力欄の中でも、各画面のキー処理より先に受ける
  // 端末ごとに登録したショートカット（設定 → ショートカット）。既定の操作より先に受け取る
  function runShortcut(action: ShortcutAction) {
    if (action === 'app.keymon') toggleKeyMonitor()
    else emitAction(action)
  }
  function onKeyDown(ev: KeyboardEvent) {
    if (dialogOpen()) return
    if (!shortcutRecording() && !ev.isComposing) {
      const action = actionFor(chordOf(ev))
      if (action) {
        ev.preventDefault()
        ev.stopPropagation()
        runShortcut(action)
        return
      }
    }
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === '/' || ev.code === 'Slash')) {
      ev.preventDefault()
      ev.stopPropagation()
      toggleHelp()
      return
    }
    if (help() && ev.key === 'Escape') {
      ev.preventDefault()
      ev.stopPropagation()
      setHelp(null)
    }
  }
  onMount(() => {
    window.addEventListener('keydown', onKeyDown, true)
    // 期限（作ってから10日・進捗の更新なし）を過ぎたアイディアメモをごみ箱へ
    sweepMemos()
  })
  onCleanup(() => window.removeEventListener('keydown', onKeyDown, true))

  return (
  <div class="v21">
    <header class="v21-top">
      <button type="button" class="v21-brand" onClick={() => go({ name: 'home' })} title="ホームへ">
        <span class="v21-brand-mark">N</span>
        <span class="v21-brand-text">
          <strong>Note Story</strong>
          <small>ノベルシナリオ</small>
        </span>
      </button>
      <nav class="v21-nav" aria-label="V2.1 メニュー">
        <For each={NAV}>
          {(item) => (
            <button type="button" class="v21-nav-item" classList={{ on: isActive(item) }} onClick={() => goNav(item)}>
              <NavIcon d={item.icon} />
              <span>{item.label}</span>
            </button>
          )}
        </For>
      </nav>
      <button
        type="button"
        class="v21-undo-btn"
        onPointerDown={(e) => e.preventDefault()}
        onClick={undoLast}
        title="一つ前の動作に戻る（Ctrl+Z）"
        aria-label="一つ前の動作に戻る"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4 4.5 8.5 9 13M5 8.5h9.5a5 5 0 0 1 0 10H11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
        <span>戻る</span>
        <small>Ctrl+Z</small>
      </button>
      <button
        type="button"
        class="v21-keymon-btn"
        classList={{ on: monitorOpen() }}
        onPointerDown={(e) => e.preventDefault()}
        onClick={toggleKeyMonitor}
        title="キー入力モニター（端末のキーボードが何を送っているかを見る）"
        aria-label="キー入力モニター"
        aria-pressed={monitorOpen()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7h17v10h-17zM6.5 10h1M9.5 10h1M12.5 10h1M15.5 10h1M8 14h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <button
        type="button"
        class="v21-keymon-btn v21-settings-btn"
        classList={{ on: route().name === 'settings' }}
        onClick={() => go({ name: 'settings' })}
        title="設定（ショートカット）"
        aria-label="設定"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-1.8 3.1-1.9-.8a7 7 0 0 1-1.7 1l-.3 2h-3.6l-.3-2a7 7 0 0 1-1.7-1l-1.9.8-1.8-3.1 1.6-1.2a7 7 0 0 1 0-3l-1.6-1.2 1.8-3.1 1.9.8a7 7 0 0 1 1.7-1l.3-2h3.6l.3 2a7 7 0 0 1 1.7 1l1.9-.8 1.8 3.1-1.6 1.2a7 7 0 0 1 0 3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>
      </button>
      <button
        type="button"
        class="v21-help-btn"
        onPointerDown={(e) => e.preventDefault()}
        onClick={toggleHelp}
        title="この画面で使える操作（Ctrl+/）"
        aria-label="この画面で使える操作"
      >
        ?
      </button>
      <VersionTabs current="v21" />
    </header>

    <main class="v21-main">
      <Switch>
        <Match when={route().name === 'home'}><HomeV21 /></Match>
        <Match when={route().name === 'titles'}><TitlesV21 /></Match>
        <Match when={route().name === 'events'}><EventsV21 /></Match>
        {/* keyed: 作品IDを値で渡す（離れるときの後片付けで古いIDを読みに行かないため） */}
        <Match when={route().name === 'title' && (route() as { notebookId: string }).notebookId} keyed>
          {(notebookId) => <TitleV21 notebookId={notebookId} />}
        </Match>
        <Match when={route().name === 'talk'}>
          {/* 開く場面が変わったら作り直す（会話ログは最初に開いた場面を覚える作りのため） */}
          <Show when={JSON.stringify(route())} keyed>
            {(_routeKey) => (
              <div class="v21-talk">
                <TalkLogV21
                  notebookId={(route() as { notebookId?: string }).notebookId}
                  pageId={(route() as { pageId?: string }).pageId}
                  filterNotebook={isStoryNotebook}
                  onPageOpen={(nbId, pgId) => recordAccess(`page:${nbId}:${pgId}`)}
                  onCastChange={setTalkCast}
                />
              </div>
            )}
          </Show>
        </Match>
        <Match when={route().name === 'gallery'}><GalleryV21 /></Match>
        <Match when={route().name === 'memos'}><MemosV21 /></Match>
        <Match when={route().name === 'settings'}><SettingsV21 /></Match>
        <Match when={route().name === 'desk'}>
          {/* 開く下書き・メモが変わったら作り直す */}
          <Show when={JSON.stringify(route())} keyed>
            {(_routeKey) => {
              const r = route() as { shelf: string; draftId: string }
              return <div class="v21-talk"><DeskScreenV21 shelf={r.shelf} draftId={r.draftId} /></div>
            }}
          </Show>
        </Match>
      </Switch>
    </main>

    {/* スマホ幅では画面下のタブになる（CSSで切り替え） */}
    <nav class="v21-tabbar" aria-label="V2.1 メニュー（下）">
      <For each={NAV}>
        {(item) => (
          <button type="button" classList={{ on: isActive(item) }} onClick={() => goNav(item)}>
            <NavIcon d={item.icon} />
            <span>{item.label}</span>
          </button>
        )}
      </For>
    </nav>

    {/* アプリの中のダイアログ（端末のポップアップの代わり） */}
    <DialogHost />

    {/* キー入力モニター（見るだけ。操作は変えない） */}
    <Show when={monitorOpen()}><KeyMonitor /></Show>

    <Show when={help()}>
      {(h) => <HelpOverlay screen={helpScreen()} phase={h().phase} extra={helpExtra()} onClose={() => setHelp(null)} />}
    </Show>
  </div>
  )
}

export default AppV21
