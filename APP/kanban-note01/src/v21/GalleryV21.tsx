import { type Component, For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { state } from '../store'
import { firebaseEnabled } from '../db/firebase'
import { loadAssetTags } from '../dataBridge/assetTagDb'
import { galleryState } from '../pages/gallery/store'
import type { GalleryItem } from '../pages/gallery/types'
import GalleryLegacyV21 from './GalleryLegacyV21'
import { askConfirm } from './dialog'
import { isTitleNotebook, namedCast } from './nav'
import { CAMERA_ANGLES, addPhotoSlot, deliverPhoto, deliverToOf, detachPhoto, openOrders, orderListJson, removeSlot, slotPlace, slotsWithPhoto, updateOrder, type SlotRow } from './sceneSlots'
import { addComment, addPhotosV21, hydrateV21Gallery, imageOf, photoJson, refreshFromCloud, removeComment, sendToCloud, toggleIn, updatePhoto } from './photoStore'

// V2.1 のギャラリー（2026-09-28 利用者）。目標: 各端末から写真を入れ、PC などどの端末のアプリからも見られる。
// 左のサイドバーで 表示（すべて・お気に入り・この端末だけ・ごみ箱）／作品／登場人物／タグ で絞る。
// 写真ごとに JSON（クラウドの galleryAssets）を持ち、作品・登場人物・タグ・小さなコメントをいくつでも付けられる。
// 前のギャラリー（ピンタレスト風）は残し、「前のギャラリー」から開ける。

type Scope = 'all' | 'fav' | 'local' | 'trash'
const SCOPES: Array<{ id: Scope; label: string }> = [
  { id: 'all', label: 'すべて' },
  { id: 'fav', label: 'お気に入り' },
  { id: 'local', label: 'この端末だけ' },
  { id: 'trash', label: 'ごみ箱' },
]
const SYNC_LABEL: Record<string, string> = {
  synced: 'クラウドにあります（他の端末からも見られます）',
  syncing: 'クラウドへ送っています',
  queued: 'クラウドへ送る順番待ち',
  error: 'クラウドへ送れませんでした（この端末には残っています）',
  disabled: 'この端末だけ（クラウドは使っていません）',
  local: 'この端末だけ',
}
const syncKind = (i: GalleryItem) => (i.syncStatus === 'synced' || i.storagePath ? 'ok' : i.syncStatus === 'error' ? 'err' : i.syncStatus === 'syncing' || i.syncStatus === 'queued' ? 'wait' : 'local')

const GalleryV21: Component = () => {
  const [legacy, setLegacy] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [scope, setScope] = createSignal<Scope>('all')
  /** 本体を発注リストにする（写真の一覧の代わり） */
  const [orders, setOrders] = createSignal(false)
  const [titleId, setTitleId] = createSignal<string | null>(null) // null＝すべて、'none'＝作品なし
  const [charRef, setCharRef] = createSignal<string | null>(null)
  const [tag, setTag] = createSignal<string | null>(null)
  const [q, setQ] = createSignal('')
  const [newestFirst, setNewestFirst] = createSignal(true)
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [lightboxId, setLightboxId] = createSignal<string | null>(null)
  const [sideOpen, setSideOpen] = createSignal(false)
  const [dragging, setDragging] = createSignal(false)
  const [notice, setNotice] = createSignal('')
  let fileInput: HTMLInputElement | undefined

  // 開くたびにクラウドを読み直す（スマホで入れた写真を、PC でアプリを開き直さずに見られる）
  async function reload(showResult: boolean) {
    if (!firebaseEnabled || loading()) return
    setLoading(true)
    try {
      const n = await refreshFromCloud()
      if (showResult) setNotice(`クラウドから読み直しました（${n}枚）`)
    } catch (e) {
      setNotice(`クラウドから読めませんでした: ${e instanceof Error ? e.message : String(e)}`)
    } finally { setLoading(false) }
  }
  onMount(() => { void hydrateV21Gallery().then(() => reload(false)) })

  const titles = createMemo(() => state.notebooks.filter(isTitleNotebook))
  const titleName = (id: string) => titles().find((n) => n.id === id)?.title || '（消えた作品）'
  const castOf = (nbId: string) => {
    const nb = titles().find((n) => n.id === nbId)
    return nb ? namedCast(nb).map((c) => ({ ref: `${nbId}:${c.id}`, name: c.name, portrait: c.portrait })) : []
  }
  const charName = (ref: string) => {
    const [nbId, slotId] = ref.split(':')
    return titles().find((n) => n.id === nbId)?.cast?.find((c) => c.id === slotId)?.name ?? '（消えた人物）'
  }

  // 絞り込みの前の母集団（ごみ箱かどうかだけ）
  const alive = () => galleryState.items.filter((i) => !i.isDeleted)
  const inScope = (i: GalleryItem, s: Scope) =>
    s === 'trash' ? !!i.isDeleted : !i.isDeleted && (s === 'all' || (s === 'fav' && i.isFavorite) || (s === 'local' && syncKind(i) !== 'ok'))
  const count = (pred: (i: GalleryItem) => boolean) => alive().filter(pred).length

  const list = createMemo(() => {
    const text = q().trim().toLowerCase()
    return galleryState.items
      .filter((i) => inScope(i, scope()))
      .filter((i) => titleId() === null || (titleId() === 'none' ? !(i.titleIds?.length) : i.titleIds?.includes(titleId()!)))
      .filter((i) => !charRef() || i.characterRefs?.includes(charRef()!))
      .filter((i) => !tag() || i.tags.includes(tag()!))
      .filter((i) => !text || `${i.label} ${i.filename} ${i.tags.join(' ')} ${(i.comments ?? []).map((c) => c.text).join(' ')}`.toLowerCase().includes(text))
      .sort((a, b) => (newestFirst() ? -1 : 1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
  })
  const allTags = createMemo(() => [...new Set(alive().flatMap((i) => i.tags))].sort())
  const dbTags = createMemo(() => loadAssetTags().filter((t) => t.status === 'active' && t.scopes.includes('Gallery')).map((t) => t.labelJa))
  const selected = () => galleryState.items.find((i) => i.id === selectedId()) ?? null

  async function addFiles(files: FileList | File[] | null) {
    const arr = [...(files ?? [])].filter((f) => f.type.startsWith('image/'))
    if (!arr.length) return
    const preset = { titleIds: titleId() && titleId() !== 'none' ? [titleId()!] : [], characterRefs: charRef() ? [charRef()!] : [] }
    const ids = await addPhotosV21(arr, preset)
    setNotice(`写真を${ids.length}枚入れました${preset.titleIds.length ? `（作品「${titleName(preset.titleIds[0])}」に付けました）` : ''}${firebaseEnabled ? '。クラウドへ送っています' : ''}`)
    if (ids.length === 1) setSelectedId(ids[0])
  }

  // 大きく見る: ← → で前後、Esc で閉じる
  function onKey(e: KeyboardEvent) {
    if (!lightboxId()) return
    const idx = list().findIndex((i) => i.id === lightboxId())
    if (e.key === 'Escape') { e.preventDefault(); setLightboxId(null) }
    if (e.key === 'ArrowRight' && idx < list().length - 1) setLightboxId(list()[idx + 1].id)
    if (e.key === 'ArrowLeft' && idx > 0) setLightboxId(list()[idx - 1].id)
  }
  onMount(() => window.addEventListener('keydown', onKey))
  onCleanup(() => window.removeEventListener('keydown', onKey))

  const pickTitle = (id: string | null) => { setTitleId(titleId() === id ? null : id); setCharRef(null); setSideOpen(false) }

  const Sidebar = () => (
    <aside class="v21-gal-side" classList={{ open: sideOpen() }} aria-label="絞り込み">
      <div class="v21-gal-side-head">
        <strong>絞り込み</strong>
        <button type="button" class="v21-icon-btn v21-gal-side-close" aria-label="閉じる" onClick={() => setSideOpen(false)}>×</button>
      </div>
      <p class="v21-gal-side-title">表示</p>
      <For each={SCOPES}>
        {(s) => (
          <button type="button" class="v21-gal-side-item" classList={{ on: !orders() && scope() === s.id }} onClick={() => { setScope(s.id); setOrders(false); setSideOpen(false) }}>
            {s.label}<span>{s.id === 'trash' ? galleryState.items.filter((i) => i.isDeleted).length : count((i) => inScope(i, s.id))}</span>
          </button>
        )}
      </For>
      <button type="button" class="v21-gal-side-item v21-gal-orders-btn" classList={{ on: orders() }} onClick={() => { setOrders(true); setSelectedId(null); setSideOpen(false) }}>
        発注リスト（絵待ち）<span>{openOrders().length}</span>
      </button>
      <p class="v21-gal-side-title">作品</p>
      <button type="button" class="v21-gal-side-item" classList={{ on: titleId() === null }} onClick={() => pickTitle(null)}>すべての作品</button>
      <For each={titles()}>
        {(nb) => (
          <button type="button" class="v21-gal-side-item" classList={{ on: titleId() === nb.id }} onClick={() => pickTitle(nb.id!)}>
            {nb.title || '無題'}<span>{count((i) => !!i.titleIds?.includes(nb.id!))}</span>
          </button>
        )}
      </For>
      <button type="button" class="v21-gal-side-item dim" classList={{ on: titleId() === 'none' }} onClick={() => pickTitle('none')}>作品なし<span>{count((i) => !(i.titleIds?.length))}</span></button>
      <Show when={titleId() && titleId() !== 'none' && castOf(titleId()!).length}>
        <p class="v21-gal-side-title">登場人物（{titleName(titleId()!)}）</p>
        <For each={castOf(titleId()!)}>
          {(c) => (
            <button type="button" class="v21-gal-side-item" classList={{ on: charRef() === c.ref }} onClick={() => { setCharRef(charRef() === c.ref ? null : c.ref); setSideOpen(false) }}>
              {c.name}<span>{count((i) => !!i.characterRefs?.includes(c.ref))}</span>
            </button>
          )}
        </For>
      </Show>
      <Show when={allTags().length}>
        <p class="v21-gal-side-title">タグ</p>
        <div class="v21-gal-side-tags">
          <For each={allTags()}>{(t) => <button type="button" classList={{ on: tag() === t }} onClick={() => setTag(tag() === t ? null : t)}>#{t}</button>}</For>
        </div>
      </Show>
      <p class="v21-gal-side-title">クラウド</p>
      <p class="v21-gal-side-sync">
        <Show when={firebaseEnabled} fallback={<>クラウドを使っていないので、写真はこの端末だけに保存します。</>}>
          クラウドにある写真 {count((i) => syncKind(i) === 'ok')}枚・この端末だけ {count((i) => syncKind(i) !== 'ok')}枚
        </Show>
      </p>
      <Show when={firebaseEnabled}>
        <button type="button" class="v21-btn" disabled={loading()} onClick={() => void reload(true)}>{loading() ? '読んでいます…' : 'クラウドから読み直す'}</button>
      </Show>
      <Show when={firebaseEnabled && count((i) => syncKind(i) === 'err')}>
        <button type="button" class="v21-btn" onClick={() => { for (const i of alive().filter((x) => syncKind(x) === 'err')) void sendToCloud(i.id) }}>送れなかった写真を送り直す</button>
      </Show>
      <button type="button" class="v21-link v21-gal-legacy" onClick={() => setLegacy(true)}>前のギャラリー（ピンタレスト風）を開く</button>
    </aside>
  )

  // 写真を作品の Sceneスロットに登録する（新しいスロット、または発注中のスロットへ納品）
  const SlotSection = (p: { item: GalleryItem }) => {
    const firstTitle = () => p.item.titleIds?.find((id) => titles().some((n) => n.id === id)) ?? titles()[0]?.id ?? ''
    const [nbId, setNbId] = createSignal(firstTitle())
    const [target, setTarget] = createSignal('')
    const [name, setName] = createSignal(p.item.label)
    const [error, setError] = createSignal('')
    const ordersHere = () => openOrders().filter((r) => r.nb.id === nbId())
    const mine = () => slotsWithPhoto(p.item.id)
    function register(e: SubmitEvent) {
      e.preventDefault()
      const nb = nbId()
      if (!nb) { setError('作品がありません'); return }
      if (target()) {
        const order = ordersHere().find((r) => r.slot.id === target())
        deliverPhoto(nb, target(), p.item.id)
        setNotice(`「${order?.slot.title ?? ''}」の発注に、この写真を納品しました`)
      } else {
        const problem = addPhotoSlot(nb, name(), p.item.id)
        if (problem) { setError(problem); return }
        setNotice(`「${titleName(nb)}」の Sceneスロットに「${name().trim()}」を登録しました`)
      }
      if (!p.item.titleIds?.includes(nb)) updatePhoto(p.item.id, { titleIds: [...(p.item.titleIds ?? []), nb] })
      setError('')
      setTarget('')
    }
    return (
      <>
        <p class="v21-gal-sub">Sceneスロット</p>
        <ul class="v21-gal-slots">
          <For each={mine()} fallback={<li class="v21-dim v21-small">まだ登録していません。登録すると、下書きの Scene「9グリッド」に出ます。</li>}>
            {(r: SlotRow) => {
              const place = () => slotPlace(r.nb, r.slot.id)
              return (
                <li>
                  <span>{r.nb.title || '無題'}<small>パレット{place()?.palette}・{place()?.cell}番</small></span>
                  <strong>{r.slot.title}</strong>
                  <button type="button" aria-label={`${r.slot.title} から外す`} title={r.slot.order ? '外す（発注に戻る）' : '外す'} onClick={() => detachPhoto(r.nb.id!, r.slot.id)}>×</button>
                </li>
              )
            }}
          </For>
        </ul>
        <Show when={titles().length}>
          <form class="v21-gal-slotform" onSubmit={register}>
            <select value={nbId()} aria-label="作品" onChange={(e) => { setNbId(e.currentTarget.value); setTarget('') }}>
              <For each={titles()}>{(nb) => <option value={nb.id}>{nb.title || '無題'}</option>}</For>
            </select>
            <select value={target()} aria-label="どこへ" onChange={(e) => setTarget(e.currentTarget.value)}>
              <option value="">新しいスロット</option>
              <For each={ordersHere()}>{(r) => <option value={r.slot.id}>発注「{r.slot.title}」へ納品</option>}</For>
            </select>
            <Show when={!target()}>
              <input value={name()} aria-label="Scene の名前" placeholder="Scene の名前" onInput={(e) => setName(e.currentTarget.value)} />
            </Show>
            <button type="submit" class="v21-btn primary">Sceneスロットに登録</button>
          </form>
          <Show when={error()}><p class="v21-gal-err" role="alert">{error()}</p></Show>
        </Show>
      </>
    )
  }

  // 発注リスト: 下書きのテンキー 0 で置いた、絵の無い Scene。絵ができたら写真を入れて納品する
  const OrdersView = () => {
    const [copied, setCopied] = createSignal(false)
    const [deliverTo, setDeliverTo] = createSignal<SlotRow | null>(null)
    let deliverInput: HTMLInputElement | undefined
    async function deliverFile(files: FileList | null) {
      const r = deliverTo()
      const file = [...(files ?? [])].find((x) => x.type.startsWith('image/'))
      if (!r || !file) return
      const [id] = await addPhotosV21([file], { titleIds: [r.nb.id!] })
      if (!id) return
      updatePhoto(id, { label: r.slot.title })
      deliverPhoto(r.nb.id!, r.slot.id, id)
      setNotice(`「${r.slot.title}」を納品しました（${deliverToOf(r)}）`)
      setDeliverTo(null)
    }
    const json = () => JSON.stringify(orderListJson(), null, 2)
    return (
      <section class="v21-gal-orders">
        <p class="v21-dim v21-small">下書きの Scene「9グリッド」でテンキー 0（ラベルだけ置いて絵を発注）を押すと、ここに並びます。絵ができたら「写真を入れて納品」、ギャラリーにある写真なら写真の情報の「Sceneスロット」から納品できます。</p>
        <div class="v21-row">
          <button type="button" class="v21-btn" disabled={!openOrders().length} onClick={() => { void navigator.clipboard?.writeText(json()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }}>
            {copied() ? 'コピーしました' : '発注リストを JSON でコピー'}
          </button>
        </div>
        <div class="v21-gal-order-list">
          <For each={openOrders()} fallback={<p class="v21-gal-empty">発注はありません。</p>}>
            {(r) => (
              <article class="v21-gal-order">
                <div class="v21-gal-order-thumb">絵待ち</div>
                <div class="v21-gal-order-body">
                  <strong>{r.slot.title}</strong>
                  <dl>
                    <dt>作品</dt><dd>{r.nb.title || '無題'}</dd>
                    <dt>納品先</dt><dd>{deliverToOf(r)}</dd>
                    <dt>依頼</dt><dd>{new Date(r.slot.order!.requestedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd>
                  </dl>
                  <Show when={r.slot.order?.note}><p class="v21-gal-order-note">{r.slot.order!.note}</p></Show>
                  <div class="v21-gal-order-opts">
                    <label>カメラ
                      <select value={r.slot.order?.camera ?? ''} onChange={(e) => updateOrder(r.nb.id!, r.slot.id, { camera: e.currentTarget.value })}>
                        <For each={[...CAMERA_ANGLES]}>{(a) => <option value={a}>{a || '（決めない）'}</option>}</For>
                      </select>
                    </label>
                    <label>担当
                      <input value={r.slot.order?.agent ?? ''} placeholder="codex" onChange={(e) => updateOrder(r.nb.id!, r.slot.id, { agent: e.currentTarget.value.trim() })} />
                    </label>
                  </div>
                  <div class="v21-row">
                    <button type="button" class="v21-btn primary" onClick={() => { setDeliverTo(r); deliverInput?.click() }}>写真を入れて納品</button>
                    <button type="button" class="v21-btn" onClick={async () => { if (await askConfirm({ title: `「${r.slot.title}」の発注をやめますか？`, message: '本文に書いた [Scene_"…"] のタグはそのまま残ります。', okLabel: 'やめる', danger: true })) removeSlot(r.nb.id!, r.slot.id) }}>発注をやめる</button>
                  </div>
                </div>
              </article>
            )}
          </For>
        </div>
        <input ref={deliverInput} type="file" accept="image/*" hidden onChange={(e) => { void deliverFile(e.currentTarget.files); e.currentTarget.value = '' }} />
      </section>
    )
  }

  const Detail = (p: { id: string; fallback: GalleryItem }) => {
    // 写真を直すたびに中身が差し替わるので、id で引き直す（パネルを作り直さない＝入力中の欄が外れない）
    const item = () => galleryState.items.find((i) => i.id === p.id) ?? p.fallback
    const [tagText, setTagText] = createSignal('')
    const [comment, setComment] = createSignal('')
    const [copied, setCopied] = createSignal(false)
    const json = () => JSON.stringify(photoJson(item()), null, 2)
    const addTag = (t: string) => { const v = t.trim().replace(/^#/, ''); if (v && !item().tags.includes(v)) updatePhoto(item().id, { tags: [...item().tags, v] }); setTagText('') }
    return (
      <aside class="v21-gal-detail" aria-label="写真の情報">
        <div class="v21-gal-detail-head">
          <button type="button" class="v21-icon-btn" aria-label="閉じる" onClick={() => setSelectedId(null)}>×</button>
          <input class="v21-gal-label" value={item().label} aria-label="写真の名前" onChange={(e) => updatePhoto(item().id, { label: e.currentTarget.value.trim() || item().label })} />
          <button type="button" class="v21-icon-btn v21-gal-fav" classList={{ on: item().isFavorite }} title="お気に入り" aria-pressed={item().isFavorite} onClick={() => updatePhoto(item().id, { isFavorite: !item().isFavorite })}>{item().isFavorite ? '♥' : '♡'}</button>
        </div>
        <button type="button" class="v21-gal-detail-img" onClick={() => setLightboxId(item().id)} title="大きく見る"><img src={imageOf(item())} alt={item().label} /></button>
        <p class={`v21-gal-sync ${syncKind(item())}`}>
          {SYNC_LABEL[item().syncStatus ?? (item().storagePath ? 'synced' : 'local')] ?? item().syncStatus}
          <Show when={firebaseEnabled && syncKind(item()) !== 'ok' && item().syncStatus !== 'syncing'}>
            <button type="button" class="v21-link" onClick={() => void sendToCloud(item().id)}>クラウドへ送る</button>
          </Show>
        </p>
        <Show when={item().syncError}><p class="v21-gal-err">{item().syncError}</p></Show>

        <p class="v21-gal-sub">作品</p>
        <div class="v21-gal-chips">
          <For each={titles()} fallback={<span class="v21-dim v21-small">作品がありません。</span>}>
            {(nb) => <button type="button" classList={{ on: !!item().titleIds?.includes(nb.id!) }} onClick={() => updatePhoto(item().id, { titleIds: toggleIn(item().titleIds, nb.id!) })}>{nb.title || '無題'}</button>}
          </For>
        </div>
        <Show when={(item().titleIds ?? []).some((id) => castOf(id).length)}>
          <p class="v21-gal-sub">登場人物</p>
          <For each={item().titleIds ?? []}>
            {(id) => (
              <Show when={castOf(id).length}>
                <div class="v21-gal-chips">
                  <For each={castOf(id)}>
                    {(c) => <button type="button" classList={{ on: !!item().characterRefs?.includes(c.ref) }} title={titleName(id)} onClick={() => updatePhoto(item().id, { characterRefs: toggleIn(item().characterRefs, c.ref) })}>{c.name}</button>}
                  </For>
                </div>
              </Show>
            )}
          </For>
        </Show>

        <SlotSection item={item()} />

        <p class="v21-gal-sub">タグ</p>
        <div class="v21-gal-chips">
          <For each={item().tags}>{(t) => <span class="v21-gal-tag">#{t}<button type="button" aria-label={`${t} を外す`} onClick={() => updatePhoto(item().id, { tags: item().tags.filter((x) => x !== t) })}>×</button></span>}</For>
        </div>
        <form class="v21-gal-inline" onSubmit={(e) => { e.preventDefault(); addTag(tagText()) }}>
          <input list="v21-gal-tag-db" placeholder="タグを足す（タグの DB から選べる）" value={tagText()} onInput={(e) => setTagText(e.currentTarget.value)} />
          <button type="submit" class="v21-btn">足す</button>
          <datalist id="v21-gal-tag-db"><For each={[...new Set([...dbTags(), ...allTags()])]}>{(t) => <option value={t} />}</For></datalist>
        </form>

        <p class="v21-gal-sub">コメント（{item().comments?.length ?? 0}）</p>
        <ul class="v21-gal-comments">
          <For each={item().comments ?? []} fallback={<li class="v21-dim v21-small">まだありません。</li>}>
            {(c) => (
              <li>
                <p>{c.text}</p>
                <small>{new Date(c.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{c.device ? `・${c.device}` : ''}</small>
                <button type="button" aria-label="このコメントを消す" onClick={() => removeComment(item().id, c.id)}>×</button>
              </li>
            )}
          </For>
        </ul>
        <form class="v21-gal-inline" onSubmit={(e) => { e.preventDefault(); addComment(item().id, comment()); setComment('') }}>
          <input placeholder="小さなコメントを足す" value={comment()} onInput={(e) => setComment(e.currentTarget.value)} />
          <button type="submit" class="v21-btn primary">足す</button>
        </form>

        <details class="v21-gal-json">
          <summary>JSON を見る</summary>
          <pre>{json()}</pre>
          <button type="button" class="v21-btn" onClick={() => { void navigator.clipboard?.writeText(json()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }}>{copied() ? 'コピーしました' : 'JSON をコピー'}</button>
        </details>

        <p class="v21-gal-meta">{item().width && item().height ? `${item().width}×${item().height} ・ ` : ''}{new Date(item().createdAt).toLocaleString('ja-JP')}{item().device ? ` ・ ${item().device} から` : ''}</p>
        <div class="v21-row">
          <Show
            when={item().isDeleted}
            fallback={<button type="button" class="v21-btn" onClick={async () => { if (await askConfirm({ title: 'この写真をごみ箱へ入れますか？', message: 'ごみ箱から戻せます。', okLabel: 'ごみ箱へ', danger: true })) { updatePhoto(item().id, { isDeleted: true }); setSelectedId(null) } }}>ごみ箱へ</button>}
          >
            <button type="button" class="v21-btn" onClick={() => updatePhoto(item().id, { isDeleted: false })}>ごみ箱から戻す</button>
          </Show>
        </div>
      </aside>
    )
  }

  return (
    <Show when={!legacy()} fallback={<div class="v21-gallery"><GalleryLegacyV21 onBack={() => setLegacy(false)} /></div>}>
      <div class="v21-gal">
        <Sidebar />
        <Show when={sideOpen()}><div class="v21-gal-backdrop" onClick={() => setSideOpen(false)} /></Show>
        <section
          class="v21-gal-main"
          classList={{ dragging: dragging() }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(e.dataTransfer?.files ?? null) }}
        >
          <div class="v21-gal-head">
            <button type="button" class="v21-btn v21-gal-side-btn" onClick={() => setSideOpen(true)}>絞り込み</button>
            <div class="v21-gal-titlebar">
              <p class="v21-kicker">GALLERY</p>
              <h1>ギャラリー</h1>
            </div>
            <input class="v21-search" placeholder="名前・タグ・コメントで探す" value={q()} onInput={(e) => setQ(e.currentTarget.value)} />
            <button type="button" class="v21-btn" onClick={() => setNewestFirst(!newestFirst())}>{newestFirst() ? '新しい順' : '古い順'}</button>
            <button type="button" class="v21-btn primary" onClick={() => fileInput?.click()}>＋ 写真を入れる</button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { void addFiles(e.currentTarget.files); e.currentTarget.value = '' }} />
          </div>
          <Show when={!orders()} fallback={<><Show when={notice()}><p class="v21-gal-notice" role="status">{notice()}</p></Show><h2 class="v21-gal-orders-title">発注リスト（絵待ち {openOrders().length}件）</h2><OrdersView /></>}>
          <div class="v21-gal-filters">
            <span>{SCOPES.find((s) => s.id === scope())!.label}</span>
            <Show when={titleId()}><button type="button" onClick={() => pickTitle(null)}>{titleId() === 'none' ? '作品なし' : titleName(titleId()!)} ×</button></Show>
            <Show when={charRef()}><button type="button" onClick={() => setCharRef(null)}>{charName(charRef()!)} ×</button></Show>
            <Show when={tag()}><button type="button" onClick={() => setTag(null)}>#{tag()} ×</button></Show>
            <small>{list().length}枚</small>
          </div>
          <Show when={notice()}><p class="v21-gal-notice" role="status">{notice()}</p></Show>
          <Show
            when={list().length}
            fallback={
              <div class="v21-gal-empty">
                <p>{scope() === 'trash' ? 'ごみ箱は空です。' : '写真がありません。'}</p>
                <Show when={scope() !== 'trash'}><p class="v21-dim v21-small">「＋ 写真を入れる」から、この端末の写真を入れられます（PC ではここへ落としても入ります）。</p></Show>
              </div>
            }
          >
            <div class="v21-gal-grid">
              <For each={list()}>
                {(i) => (
                  <button type="button" class="v21-gal-card" classList={{ on: selectedId() === i.id }} onClick={() => setSelectedId(i.id)}>
                    <span class="v21-gal-thumb"><img src={imageOf(i)} alt={i.label} loading="lazy" /></span>
                    <span class={`v21-gal-dot ${syncKind(i)}`} title={SYNC_LABEL[i.syncStatus ?? 'local'] ?? ''} />
                    <Show when={i.isFavorite}><span class="v21-gal-heart">♥</span></Show>
                    <span class="v21-gal-card-body">
                      <strong>{i.label || i.filename}</strong>
                      <small>
                        <Show when={i.titleIds?.length}>{titleName(i.titleIds![0])}{i.titleIds!.length > 1 ? ` ほか${i.titleIds!.length - 1}` : ''}</Show>
                        <Show when={i.comments?.length}> 💬{i.comments!.length}</Show>
                      </small>
                    </span>
                  </button>
                )}
              </For>
            </div>
          </Show>
          </Show>
        </section>
        <Show when={selected() ? selectedId() : null} keyed>{(id) => <Detail id={id} fallback={selected()!} />}</Show>
        <Show when={galleryState.items.find((i) => i.id === lightboxId())} keyed>
          {(item) => (
            <div class="v21-gal-lightbox" onClick={() => setLightboxId(null)} role="dialog" aria-label="大きく見る">
              <img src={imageOf(item)} alt={item.label} />
              <p>{item.label}</p>
            </div>
          )}
        </Show>
      </div>
    </Show>
  )
}

export default GalleryV21
