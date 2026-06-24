import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { setState, state, syncInboxItem, syncPendingInboxItems, updateInboxItem } from '../store'
import type { InboxItem } from '../types'

function syncLabel(item: InboxItem) {
  if (item.syncStatus === 'synced') return '同期済み'
  if (item.syncStatus === 'syncing') return '同期中'
  if (item.syncStatus === 'error') return '同期失敗'
  return '未同期'
}

const PageInbox: Component = () => {
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [mobileDetail, setMobileDetail] = createSignal(false)
  const [search, setSearch] = createSignal('')
  const [tagFilter, setTagFilter] = createSignal('')

  const tags = createMemo(() => Array.from(new Set(state.inboxItems.map((item) => item.tag))).sort((a, b) => a.localeCompare(b, 'ja')))
  const items = createMemo(() => {
    const query = search().trim().toLowerCase()
    return state.inboxItems.filter((item) => {
      if (tagFilter() && item.tag !== tagFilter()) return false
      if (!query) return true
      return `${item.subject}\n${item.body}\n${item.tag}\n${item.relatedIdea ?? ''}`.toLowerCase().includes(query)
    })
  })
  const selected = createMemo(() => state.inboxItems.find((item) => item.id === selectedId()) ?? items()[0])

  function select(item: InboxItem) {
    setSelectedId(item.id)
    setMobileDetail(true)
  }

  const List = () => (
    <section class="global-inbox-list">
      <div class="global-inbox-toolbar">
        <input type="search" value={search()} onInput={(event) => setSearch(event.currentTarget.value)} placeholder="InBoxを検索..." />
        <select value={tagFilter()} onChange={(event) => setTagFilter(event.currentTarget.value)}>
          <option value="">すべてのTag</option>
          <For each={tags()}>{(tag) => <option value={tag}>{tag}</option>}</For>
        </select>
      </div>
      <div class="global-inbox-items">
        <Show when={items().length} fallback={<div class="global-inbox-empty">InBoxは空です</div>}>
          <For each={items()}>
            {(item) => (
              <button type="button" class="global-inbox-item" classList={{ active: selected()?.id === item.id }} onClick={() => select(item)}>
                <div class="global-inbox-item-head"><strong>{item.subject}</strong><span class={item.syncStatus}>{syncLabel(item)}</span></div>
                <p>{item.body}</p>
                <div><span>#{item.tag}</span><time>{new Date(item.updatedAt).toLocaleDateString('ja-JP')}</time></div>
              </button>
            )}
          </For>
        </Show>
      </div>
    </section>
  )

  const Detail = () => (
    <section class="global-inbox-detail">
      <Show when={selected()} fallback={<div class="global-inbox-empty">項目を選択してください</div>}>
        {(item) => (
          <>
            <div class="global-inbox-detail-head">
              <button type="button" class="global-inbox-mobile-back" onClick={() => setMobileDetail(false)}>戻る</button>
              <div><span>#{item().tag}</span><h1>{item().subject}</h1></div>
              <select value={item().status} onChange={(event) => updateInboxItem(item().id, { status: event.currentTarget.value as InboxItem['status'] })}>
                <option value="inbox">未対応</option>
                <option value="working">対応中</option>
                <option value="done">対応済み</option>
                <option value="archived">Archive</option>
              </select>
            </div>
            <div class="global-inbox-body">{item().body}</div>
            <dl class="global-inbox-meta">
              <dt>送信元</dt><dd>{item().sourceNotebookTitle ?? item().sourceView}{item().sourcePageTitle ? ` / ${item().sourcePageTitle}` : ''}</dd>
              <dt>関連</dt><dd>{item().relatedIdea || '未指定'}</dd>
              <dt>同期</dt><dd>{syncLabel(item())}</dd>
            </dl>
            <Show when={item().syncError}><p class="global-inbox-sync-error">{item().syncError}</p></Show>
            <button type="button" class="global-inbox-sync-btn" disabled={item().syncStatus === 'syncing'} onClick={() => syncInboxItem(item().id)}>同期する</button>
          </>
        )}
      </Show>
    </section>
  )

  return (
    <div class="global-inbox-page">
      <header class="global-inbox-page-head">
        <div><span>GLOBAL DB</span><h1>InBox</h1></div>
        <button type="button" onClick={() => syncPendingInboxItems()}>同期チェック</button>
        <button type="button" class="primary" onClick={() => setState({ inboxComposerOpen: true })}>+ 新規</button>
      </header>
      <div class="global-inbox-layout" classList={{ 'show-detail': mobileDetail() }}>
        <List />
        <Detail />
      </div>
    </div>
  )
}

export default PageInbox
