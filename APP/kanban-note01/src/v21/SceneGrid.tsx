import { type Component, For, Show, onMount } from 'solid-js'
import { state } from '../store'
import { galleryState } from '../pages/gallery/store'
import type { SceneSlot } from '../types'
import { hold } from './sideNav'
import { hydrateV21Gallery, imageOf } from './photoStore'
import { PALETTE_SIZE, paletteCells, paletteCount } from './sceneSlots'
import { go } from './nav'

// 下書きの Scene サイドバーの「9グリッド」（2026-09-28 利用者）。
// サイドバーの幅で 3×3 のマスに Sceneスロット（名前＋サムネ）を並べる。押す（テンキー 1〜9）と本文に [Scene_"名前"] を書く。
// − ＋（テンキー）でパレットを替える。0 は画像の無いラベルだけのタグを置き、絵を発注する。

type Props = {
  notebookId: string
  palette: number
  onPalette: (p: number) => void
  onPick: (slot: SceneSlot) => void
  onOrder: () => void
}

const SceneGrid: Component<Props> = (props) => {
  onMount(() => { void hydrateV21Gallery() })
  const nb = () => state.notebooks.find((n) => n.id === props.notebookId)
  const count = () => paletteCount(nb())
  const page = () => Math.min(props.palette, count() - 1)
  const photo = (slot: SceneSlot) => (slot.photoId ? galleryState.items.find((i) => i.id === slot.photoId) : undefined)
  const move = (step: number) => props.onPalette((page() + step + count()) % count())

  return (
    <div class="v21-sgrid" onPointerDown={hold}>
      <div class="v21-sgrid-pager">
        <button type="button" class="v21-icon-btn" aria-label="前のパレット" title="前のパレット（テンキー −）" disabled={count() < 2} onClick={() => move(-1)}>−</button>
        <span>パレット {page() + 1} / {count()}</span>
        <button type="button" class="v21-icon-btn" aria-label="次のパレット" title="次のパレット（テンキー ＋）" disabled={count() < 2} onClick={() => move(1)}>＋</button>
      </div>
      <div class="v21-sgrid-cells">
        <For each={paletteCells(nb(), page())}>
          {(slot, i) => (
            <Show
              when={slot}
              fallback={<div class="v21-sgrid-cell empty" aria-hidden="true"><kbd>{i() + 1}</kbd></div>}
            >
              {(s) => (
                <button
                  type="button"
                  class="v21-sgrid-cell"
                  classList={{ order: !s().photoId }}
                  title={`${s().title}（テンキー ${i() + 1}）${s().photoId ? '' : '・絵を発注中'}`}
                  onClick={() => props.onPick(s())}
                >
                  <Show when={photo(s())} fallback={<span class="v21-sgrid-thumb none">{s().photoId ? '…' : '絵待ち'}</span>}>
                    {(p) => <img class="v21-sgrid-thumb" src={imageOf(p())} alt="" loading="lazy" />}
                  </Show>
                  <kbd>{i() + 1}</kbd>
                  <span class="v21-sgrid-name">{s().title}</span>
                </button>
              )}
            </Show>
          )}
        </For>
      </div>
      <button type="button" class="v21-sgrid-order" title="テンキー 0" onClick={() => props.onOrder()}>
        <kbd>0</kbd> ラベルだけ置いて絵を発注
      </button>
      <p class="v21-sgrid-help">
        テンキー 1〜{PALETTE_SIZE}＝書く／−＋＝パレット／0＝発注。写真は
        <button type="button" class="v21-link" onClick={() => go({ name: 'gallery' })}>ギャラリー</button>
        の「Sceneスロットに登録」から入れます。
      </p>
    </div>
  )
}

export default SceneGrid
