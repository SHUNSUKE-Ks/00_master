import { type Component, For, Show, createResource, createSignal } from 'solid-js'
import { importDelivery, importedNotebook, loadDelivery, loadDeliveryIndex, type DeliveryIndexItem } from './deliveries'
import { coverGradient, go } from './nav'

// 届いた納品（別の制作チャットが作った物語・立ち絵）。たまにしか開かないので、ホームではなくタイトル一覧に置く（2026-09-27 利用者）

/** 納品を作品として取り込む（タイトル一覧の納品パネルと、ホームのお知らせで共通） */
export function useTakeIn() {
  const [busy, setBusy] = createSignal<string | null>(null)
  const [deliveryError, setDeliveryError] = createSignal('')
  async function takeIn(item: DeliveryIndexItem) {
    setBusy(item.packageId)
    setDeliveryError('')
    try {
      const id = await importDelivery(await loadDelivery(item.path))
      go({ name: 'title', notebookId: id })
    } catch (e) {
      setDeliveryError(`取り込めません: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }
  return { busy, deliveryError, takeIn }
}

const DeliveriesPanel: Component = () => {
  const [deliveries] = createResource(loadDeliveryIndex)
  const { busy, deliveryError, takeIn } = useTakeIn()

  return (
    <Show when={deliveries()?.length}>
      <section class="v21-panel v21-deliveries">
        <div class="v21-panel-head">
          <h3>届いた納品</h3>
          <span class="v21-dim v21-small">物語・立ち絵・素材をまとめて作品として取り込めます</span>
        </div>
        <div class="v21-delivery-list">
          <For each={deliveries()}>
            {(item) => {
              const done = () => importedNotebook(item.packageId)
              return (
                <article class="v21-delivery">
                  <div class="v21-delivery-cover" style={item.cover ? { 'background-image': `url(${item.cover})` } : { background: coverGradient(item.title) }} />
                  <div class="v21-delivery-body">
                    <strong>{item.title}</strong>
                    <Show when={item.subtitle}><small>{item.subtitle}</small></Show>
                    <Show when={done()} fallback={<em>未取り込み</em>}><em class="ok">取り込み済み</em></Show>
                  </div>
                  <Show
                    when={done()}
                    fallback={
                      <button type="button" class="v21-btn primary" disabled={busy() === item.packageId} onClick={() => takeIn(item)}>
                        {busy() === item.packageId ? '取り込み中…' : '取り込む'}
                      </button>
                    }
                  >
                    {(nb) => <button type="button" class="v21-btn" onClick={() => go({ name: 'title', notebookId: nb().id! })}>開く</button>}
                  </Show>
                </article>
              )
            }}
          </For>
        </div>
        <Show when={deliveryError()}><p class="v21-notice">{deliveryError()}</p></Show>
      </section>
    </Show>
  )
}

export default DeliveriesPanel
