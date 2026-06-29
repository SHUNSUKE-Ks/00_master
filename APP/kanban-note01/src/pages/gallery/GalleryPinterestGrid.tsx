import { type Component, For, Show } from 'solid-js'
import type { GalleryItem } from './types'
import { galleryState, openTagSheet, selectGalleryItem } from './store'

type Props = {
  items: GalleryItem[]
}

const SCAFFOLD_PINS = [
  { id: 'pin-scaffold-01', label: '女侍 / monochrome', tags: ['character', 'samurai', 'monochrome'], background: 'linear-gradient(135deg, #020617, #52525b 56%, #f4f4f5)', height: 288 },
  { id: 'pin-scaffold-02', label: '立ち絵ポーズ資料', tags: ['standing', 'pose', 'sketch'], background: 'linear-gradient(135deg, #fafaf9, #d6d3d1 54%, #71717a)', height: 384 },
  { id: 'pin-scaffold-03', label: 'ゲームUI 操作パネル', tags: ['ui-panel', 'game', 'draft'], background: 'linear-gradient(135deg, #082f49, #3730a3 58%, #22d3ee)', height: 224 },
  { id: 'pin-scaffold-04', label: '魔女キャラクター案', tags: ['witch', 'fantasy', 'full-body'], background: 'linear-gradient(135deg, #3b0764, #a21caf 58%, #fda4af)', height: 352 },
  { id: 'pin-scaffold-05', label: '背景 / 街角', tags: ['background', 'town', 'reference'], background: 'linear-gradient(135deg, #78350f, #57534e 58%, #fef08a)', height: 256 },
  { id: 'pin-scaffold-06', label: 'ItemBox 参考', tags: ['item-icon', 'collection'], background: 'linear-gradient(135deg, #064e3b, #0f766e 58%, #bef264)', height: 208 },
  { id: 'pin-scaffold-07', label: '表情差分候補', tags: ['face-icon', 'expression'], background: 'linear-gradient(135deg, #500724, #be123c 58%, #fed7aa)', height: 320 },
  { id: 'pin-scaffold-08', label: 'エフェクト素材', tags: ['fx_', 'effect', 'magic'], background: 'linear-gradient(135deg, #172554, #6d28d9 58%, #ffffff)', height: 240 },
]

const BOARDS = ['すべて', 'Character', 'Background', 'UI', 'Effect', 'Item', 'Sprite', 'MangaRef', 'PromptRef']

const GalleryPinterestGrid: Component<Props> = (props) => {
  const hasAnyRealItems = () => galleryState.items.some((item) => !item.isDeleted)
  const hasVisibleItems = () => props.items.length > 0

  function logScaffold(testId: string, action: string, detail?: unknown) {
    console.log(`[APP04-GALLERY-PINTEREST] ${testId} ${action}`, detail ?? '')
  }

  return (
    <div class="flex-1 overflow-y-auto bg-neutral-950 text-white">
      <div class="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
        <div class="flex items-center gap-2 overflow-x-auto px-3 py-2">
          <For each={BOARDS}>
            {(board, index) => (
              <button
                class="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.97]"
                classList={{
                  'bg-white text-neutral-950': index() === 0,
                  'bg-white/6 text-white/80 hover:bg-white/12': index() !== 0,
                }}
                onClick={() => logScaffold('3-1', 'Board filter placeholder', { board })}
              >
                {board}
              </button>
            )}
          </For>
        </div>
      </div>

      <Show when={!hasAnyRealItems()}>
        <div class="px-4 pt-4">
          <div class="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3">
            <p class="text-sm font-bold">APP04 Pinterest Masonry Scaffold</p>
            <p class="mt-1 text-xs leading-relaxed text-white/55">
              実データ接続前の見た目です。クリックや保存系はコンソールログだけ出します。
            </p>
          </div>
        </div>
      </Show>

      <div class="columns-2 gap-2 p-2 sm:columns-3 md:columns-4 xl:columns-5 2xl:columns-6">
        <Show when={hasVisibleItems()} fallback={
          <Show when={hasAnyRealItems()} fallback={
          <For each={SCAFFOLD_PINS}>
            {(pin) => (
              <article class="group mb-2 break-inside-avoid overflow-hidden rounded-[18px] bg-neutral-900 transition-all duration-200 ease-out active:scale-[0.98]">
                <button
                  class="relative block w-full"
                  style={{ height: `${pin.height}px`, background: pin.background }}
                  onClick={() => logScaffold('3-2', 'Open scaffold pin detail', { pinId: pin.id })}
                >
                  <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,.58))]" />
                  <div class="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-1 text-[10px] font-bold text-white/80 backdrop-blur">
                    {pin.id}
                  </div>
                  <div class="absolute right-3 top-3 flex translate-y-1 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <span
                      class="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-neutral-950 shadow-lg"
                      onClick={(event) => {
                        event.stopPropagation()
                        logScaffold('3-3', 'Open pin action detail placeholder', pin.id)
                      }}
                    >
                      詳細
                    </span>
                    <span
                      class="flex size-7 items-center justify-center rounded-full bg-black/45 text-white/80 backdrop-blur"
                      onClick={(event) => {
                        event.stopPropagation()
                        logScaffold('3-4', 'Open pin menu placeholder', pin.id)
                      }}
                    >
                      ...
                    </span>
                  </div>
                  <div class="absolute bottom-3 left-3 right-3 text-left">
                    <p class="text-sm font-bold leading-tight">{pin.label}</p>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <For each={pin.tags.slice(0, 3)}>
                        {(tag) => <span class="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] text-white/75">#{tag}</span>}
                      </For>
                    </div>
                  </div>
                </button>
                <div class="px-2.5 py-2">
                  <p class="text-[10px] leading-snug text-white/45">詳細画面からBlog表紙 / Scenario / Asset DBへ接続予定</p>
                </div>
              </article>
            )}
          </For>
          }>
            <div class="mb-2 break-inside-avoid rounded-[18px] border border-dashed border-white/15 bg-white/[0.04] p-5 text-center">
              <p class="text-sm font-bold text-white/80">この条件の画像はありません</p>
              <p class="mt-1 text-xs leading-relaxed text-white/45">
                検索やフィルターを外すと、追加済みの画像を表示できます。
              </p>
            </div>
          </Show>
        }>
          <For each={props.items}>
            {(item) => (
              <article class="group mb-2 break-inside-avoid overflow-hidden rounded-[18px] bg-neutral-900 transition-all duration-200 ease-out hover:brightness-105 active:scale-[0.98]">
                <button
                  class="relative block w-full"
                  onClick={() => {
                    selectGalleryItem(item.id)
                    logScaffold('12-1', 'Open pinterest overlay detail', { itemId: item.id })
                  }}
                >
                  <img
                    src={item.dataUrl ?? item.url ?? ''}
                    alt={item.label}
                    class="h-auto w-full object-cover"
                    loading="lazy"
                  />
                  <span
                    class="absolute right-2 top-2 flex size-8 translate-y-1 items-center justify-center rounded-full bg-black/45 text-white/80 opacity-0 backdrop-blur transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation()
                      openTagSheet(item.id)
                    }}
                  >
                    ...
                  </span>
                </button>
                <div class="px-2.5 py-2">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="line-clamp-2 text-xs font-bold leading-snug text-white">{item.label}</p>
                      <div class="mt-1 flex flex-wrap gap-1">
                        <For each={item.tags.slice(0, 3)}>
                          {(tag) => <span class="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">#{tag}</span>}
                        </For>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}

export default GalleryPinterestGrid
