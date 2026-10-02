import { type Component, For, Show, createMemo, createResource } from 'solid-js'
import { galleryState } from '../pages/gallery/store'
import { importedNotebook, loadDeliveryIndex, type DeliveryIndexItem } from './deliveries'
import { useTakeIn } from './DeliveriesPanel'
import { coverGradient, go } from './nav'
import { NEW_IMAGE_DAYS, NOTICE_KIND_LABEL, dismissNotice, isNoticeSeen, restoreNotices, seenCount, type NoticeKind } from './notices'

// ホームの「お知らせ」板。いまは 納品 と 新しい画像。他の端末からのお知らせは、届く道ができたら足す（notices.ts）

type Notice = {
  id: string
  kind: NoticeKind
  at: number
  delivery?: DeliveryIndexItem
  images?: Array<{ id: string; src: string; label: string }>
  imageCount?: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const toTime = (v: unknown) => {
  const t = v instanceof Date ? v.getTime() : new Date(String(v ?? '')).getTime()
  return Number.isFinite(t) ? t : 0
}
const dayLabel = (t: number) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const NoticesPanel: Component = () => {
  const [deliveries] = createResource(loadDeliveryIndex)
  const { busy, deliveryError, takeIn } = useTakeIn()

  const notices = createMemo<Notice[]>(() => {
    const out: Notice[] = []
    // 納品: 1件ずつ。取り込んだかどうかで id を変える（取り込んだあとに「開く」を知らせ直すため）
    for (const item of deliveries() ?? []) {
      const done = importedNotebook(item.packageId)
      out.push({ id: `delivery:${item.packageId}:${done ? 'imported' : 'new'}`, kind: 'delivery', at: toTime(item.deliveredAt), delivery: item })
    }
    // 新しい画像: 最近足された画像をまとめて1件。いちばん新しい画像の時刻を id に入れる（増えたらまた出る）
    const since = Date.now() - NEW_IMAGE_DAYS * DAY_MS
    const fresh = galleryState.items
      .filter((item) => !item.isDeleted && toTime(item.createdAt) >= since)
      .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
    if (fresh.length) {
      const latest = toTime(fresh[0].createdAt)
      out.push({
        id: `image:${latest}:${fresh.length}`,
        kind: 'image',
        at: latest,
        imageCount: fresh.length,
        images: fresh
          .map((item) => ({ id: item.id, src: item.thumbnailUrl ?? item.dataUrl ?? item.url ?? '', label: item.label }))
          .filter((x) => x.src)
          .slice(0, 6),
      })
    }
    // 他の端末からのお知らせ: まだ届く道が無い（KeyDeck P-007 などで足す）
    return out.filter((n) => !isNoticeSeen(n.id)).sort((a, b) => b.at - a.at)
  })

  return (
    <section class="v21-panel v21-notices">
      <div class="v21-panel-head">
        <h3>お知らせ</h3>
        <Show when={seenCount()}>
          <button type="button" class="v21-link" onClick={restoreNotices} title="閉じたお知らせをもう一度出す">閉じたものも出す</button>
        </Show>
      </div>
      <Show when={notices().length} fallback={<p class="v21-dim v21-small">新しいお知らせはありません。納品や新しい画像が届くと、ここに出ます。</p>}>
        <ul class="v21-notice-list">
          <For each={notices()}>
            {(n) => (
              <li class={`v21-notice-item kind-${n.kind}`}>
                <span class="v21-notice-kind">{NOTICE_KIND_LABEL[n.kind]}<Show when={dayLabel(n.at)}><em>{dayLabel(n.at)}</em></Show></span>

                <Show when={n.kind === 'delivery' && n.delivery}>
                  {(item) => {
                    const done = () => importedNotebook(item().packageId)
                    return (
                      <>
                        <div class="v21-delivery-cover" style={item().cover ? { 'background-image': `url(${item().cover})` } : { background: coverGradient(item().title) }} />
                        <div class="v21-notice-body">
                          <strong>{item().title}</strong>
                          <Show when={item().subtitle}><small>{item().subtitle}</small></Show>
                          <Show when={done()} fallback={<em>未取り込み</em>}><em class="ok">取り込み済み</em></Show>
                        </div>
                        <Show
                          when={done()}
                          fallback={
                            <button type="button" class="v21-btn primary" disabled={busy() === item().packageId} onClick={() => takeIn(item())}>
                              {busy() === item().packageId ? '取り込み中…' : '取り込む'}
                            </button>
                          }
                        >
                          {(nb) => <button type="button" class="v21-btn" onClick={() => go({ name: 'title', notebookId: nb().id! })}>開く</button>}
                        </Show>
                      </>
                    )
                  }}
                </Show>

                <Show when={n.kind === 'image'}>
                  <div class="v21-notice-thumbs">
                    <For each={n.images}>{(img) => <img src={img.src} alt={img.label} loading="lazy" />}</For>
                  </div>
                  <div class="v21-notice-body">
                    <strong>画像が {n.imageCount} 枚 入りました</strong>
                    <small>この{NEW_IMAGE_DAYS}日のあいだに Gallery へ足された画像</small>
                  </div>
                  <button type="button" class="v21-btn" onClick={() => go({ name: 'gallery' })}>ギャラリーで見る</button>
                </Show>

                <button type="button" class="v21-notice-close" aria-label="このお知らせを閉じる" title="閉じる（この端末だけ）" onClick={() => dismissNotice(n.id)}>×</button>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={deliveryError()}><p class="v21-notice">{deliveryError()}</p></Show>
    </section>
  )
}

export default NoticesPanel
