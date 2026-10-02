import { type Component, For, Show, createMemo, createResource, createSignal } from 'solid-js'
import { state } from '../store'
import { importedNotebook, loadDeliveryIndex, type DeliveryIndexItem } from './deliveries'
import { useTakeIn } from './DeliveriesPanel'
import { importScenario, importedFromInbox, loadInboxIndex, loadScenario, type InboxIndexItem } from './inbox'
import { go, isStoryNotebook, scenePages, titleTalkCount, updatedTime } from './nav'

// 最新の変更ログ（2026-09-28 利用者: 「届いた作品」を改名し、Title 画面の見出しの下に置く）。
// 最近変えたもの（Title・Event の更新）、届いた納品、外から届いたシナリオ（受信箱）を、新しい順に1本に並べる。
// ふだんは上の数件だけ。「すべて見る」で増やす。

type Row =
  | { kind: 'delivery'; at: number; item: DeliveryIndexItem }
  | { kind: 'inbox'; at: number; item: InboxIndexItem }
  | { kind: 'update'; at: number; id: string }

const SHORT = 4
const LONG = 20
const fmt = (t: number) => (t ? new Date(t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

const ChangeLogPanel: Component = () => {
  const [deliveries] = createResource(loadDeliveryIndex)
  const [inbox] = createResource(loadInboxIndex)
  const { busy, deliveryError, takeIn } = useTakeIn()
  const [inboxBusy, setInboxBusy] = createSignal<string | null>(null)
  const [inboxError, setInboxError] = createSignal('')
  const [all, setAll] = createSignal(false)

  const rows = createMemo<Row[]>(() => {
    const list: Row[] = []
    for (const item of deliveries() ?? []) list.push({ kind: 'delivery', at: Date.parse(item.deliveredAt ?? '') || 0, item })
    for (const item of inbox() ?? []) list.push({ kind: 'inbox', at: Date.parse(item.receivedAt ?? '') || 0, item })
    for (const nb of state.notebooks.filter(isStoryNotebook)) list.push({ kind: 'update', at: updatedTime(nb), id: nb.id! })
    return list.sort((a, b) => b.at - a.at)
  })
  const shown = () => rows().slice(0, all() ? LONG : SHORT)

  async function takeInScenario(item: InboxIndexItem) {
    setInboxBusy(item.packageId)
    setInboxError('')
    try {
      const id = await importScenario(await loadScenario(item.path))
      go({ name: 'title', notebookId: id })
    } catch (e) {
      setInboxError(`取り込めません: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setInboxBusy(null)
    }
  }

  return (
    <Show when={rows().length}>
      <section class="v21-panel v21-changelog" aria-label="最新の変更ログ">
        <div class="v21-panel-head">
          <h3>最新の変更ログ</h3>
          <span class="v21-dim v21-small">最近変えたもの・届いた納品・外から届いたシナリオ</span>
        </div>
        <ul class="v21-log">
          <For each={shown()}>
            {(r) => (
              <li classList={{ [`is-${r.kind}`]: true }}>
                <Show when={r.kind === 'update'}>
                  {(() => {
                    const nb = () => state.notebooks.find((n) => n.id === (r as { id: string }).id)
                    return (
                      <Show when={nb()}>
                        {(b) => (
                          <>
                            <span class="v21-log-kind">{b().kind === 'event' ? 'Event' : 'Title'}</span>
                            <span class="v21-log-body"><strong>{b().title || '無題'}</strong><small>{scenePages(b()).length}場面・会話 {titleTalkCount(b())}{b().inboxIds?.length ? '・外から取り込みあり' : ''}</small></span>
                            <time>{fmt(r.at)}</time>
                            <button type="button" class="v21-btn" onClick={() => go({ name: 'title', notebookId: b().id! })}>開く</button>
                          </>
                        )}
                      </Show>
                    )
                  })()}
                </Show>
                <Show when={r.kind === 'delivery'}>
                  {(() => {
                    const item = (r as { item: DeliveryIndexItem }).item
                    const done = () => importedNotebook(item.packageId)
                    return (
                      <>
                        <span class="v21-log-kind delivery">納品</span>
                        <span class="v21-log-body"><strong>{item.title}</strong><small>{item.subtitle ?? ''}{done() ? '（取り込み済み）' : '（未取り込み）'}</small></span>
                        <time>{fmt(r.at)}</time>
                        <Show when={done()} fallback={<button type="button" class="v21-btn primary" disabled={busy() === item.packageId} onClick={() => takeIn(item)}>{busy() === item.packageId ? '取り込み中…' : '取り込む'}</button>}>
                          {(nb) => <button type="button" class="v21-btn" onClick={() => go({ name: 'title', notebookId: nb().id! })}>開く</button>}
                        </Show>
                      </>
                    )
                  })()}
                </Show>
                <Show when={r.kind === 'inbox'}>
                  {(() => {
                    const item = (r as { item: InboxIndexItem }).item
                    const done = () => importedFromInbox(item.packageId)
                    return (
                      <>
                        <span class="v21-log-kind inbox">外から</span>
                        <span class="v21-log-body"><strong>{item.title}</strong><small>{item.from ? `${item.from}より・` : ''}{item.summary ?? ''}{done() ? '（取り込み済み）' : '（未取り込み）'}</small></span>
                        <time>{fmt(r.at)}</time>
                        <Show when={done()} fallback={<button type="button" class="v21-btn primary" disabled={inboxBusy() === item.packageId} onClick={() => void takeInScenario(item)}>{inboxBusy() === item.packageId ? '取り込み中…' : '取り込む'}</button>}>
                          {(nb) => <button type="button" class="v21-btn" onClick={() => go({ name: 'title', notebookId: nb().id! })}>開く</button>}
                        </Show>
                      </>
                    )
                  })()}
                </Show>
              </li>
            )}
          </For>
        </ul>
        <Show when={rows().length > SHORT}>
          <button type="button" class="v21-link v21-log-more" aria-expanded={all()} onClick={() => setAll(!all())}>{all() ? '少なく見る' : `すべて見る（${Math.min(rows().length, LONG)}件）`}</button>
        </Show>
        <Show when={deliveryError() || inboxError()}><p class="v21-notice">{deliveryError() || inboxError()}</p></Show>
      </section>
    </Show>
  )
}

export default ChangeLogPanel
