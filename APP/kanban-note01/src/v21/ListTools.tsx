import { type Component, For, Show, createSignal } from 'solid-js'
import type { Notebook } from '../types'
import { askConfirm } from './dialog'
import { archiveNotebooks, purgeNotebook, restoreNotebook, trashNotebooks, unarchiveNotebook } from './actions'
import { go } from './nav'

// 一覧の「編集」（2026-09-28 利用者: iPad のように。ふだんは場所を取らない）。
// - 見出しの小さな「編集」を押すと編集中になる: 押して選ぶ（開かない）・↑↓ で並べ替え・下の帯で「非表示」「ごみ箱へ」
// - 非表示（アーカイブ）は一覧から隠すだけ。見出しの「非表示 n」から見られ、開ける・戻せる
// - ごみ箱は中身があるときだけ見出しに小さく出る。中では 戻す／完全に消す

export function createSelection() {
  const [active, setActive] = createSignal(false)
  const [ids, setIds] = createSignal<Set<string>>(new Set())
  return {
    active,
    ids,
    has: (id: string) => ids().has(id),
    count: () => ids().size,
    start: () => { setIds(new Set<string>()); setActive(true) },
    stop: () => { setActive(false); setIds(new Set<string>()) },
    clear: () => setIds(new Set<string>()),
    toggle: (id: string) => setIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }),
  }
}
export type Selection = ReturnType<typeof createSelection>

/** 選んだ物をごみ箱へ（確認してから） */
export async function trashSelected(sel: Selection, noun: string, note = '') {
  const list = [...sel.ids()]
  if (!list.length) return
  const ok = await askConfirm({ title: `${noun}${list.length}件をごみ箱へ入れますか？`, message: `ごみ箱から戻せます。${note}`, okLabel: 'ごみ箱へ', danger: true })
  if (!ok) return
  trashNotebooks(list)
  sel.clear()
}
/** 選んだ物を非表示に（確認なし。すぐ戻せるため） */
export function archiveSelected(sel: Selection) {
  const list = [...sel.ids()]
  if (!list.length) return
  archiveNotebooks(list)
  sel.clear()
}

/** 編集中だけ下に出る帯 */
export const EditBar: Component<{ sel: Selection; noun: string; note?: string }> = (props) => (
  <Show when={props.sel.active()}>
    <div class="v21-selectbar" role="toolbar" aria-label="編集">
      <span>{props.sel.count() ? `${props.sel.count()}件を選択中` : `${props.noun}を押して選ぶ・↑↓で並べ替え`}</span>
      <button type="button" class="v21-btn" disabled={!props.sel.count()} onClick={() => archiveSelected(props.sel)} title="一覧から隠す（「非表示」から見られ、戻せる）">非表示</button>
      <button type="button" class="v21-btn danger" disabled={!props.sel.count()} onClick={() => void trashSelected(props.sel, props.noun, props.note)}>ごみ箱へ</button>
      <button type="button" class="v21-btn primary" onClick={() => props.sel.stop()}>完了</button>
    </div>
  </Show>
)

/** 見出しの小さな「編集」／「完了」 */
export const EditToggle: Component<{ sel: Selection }> = (props) => (
  <button type="button" class="v21-link v21-select-toggle" aria-pressed={props.sel.active()} onClick={() => (props.sel.active() ? props.sel.stop() : props.sel.start())}>
    {props.sel.active() ? '完了' : '編集'}
  </button>
)

/** 編集中の並べ替え（↑↓） */
export const MoveButtons: Component<{ index: number; total: number; label: string; onMove: (step: number) => void; disabled?: boolean }> = (props) => (
  <span class="v21-move" onClick={(e) => e.stopPropagation()}>
    <button type="button" class="v21-icon-btn" aria-label={`${props.label} を上へ`} title="上へ" disabled={props.disabled || props.index === 0} onClick={() => props.onMove(-1)}>↑</button>
    <button type="button" class="v21-icon-btn" aria-label={`${props.label} を下へ`} title="下へ" disabled={props.disabled || props.index === props.total - 1} onClick={() => props.onMove(1)}>↓</button>
  </span>
)

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

/** 非表示（アーカイブ）の一覧: 開く／表示に戻す */
export const ArchiveList: Component<{ items: Notebook[]; noun: string; onClose: () => void }> = (props) => (
  <section class="v21-trash v21-archive" aria-label="非表示">
    <div class="v21-trash-head">
      <h2>非表示（{props.noun}）</h2>
      <button type="button" class="v21-link" onClick={() => props.onClose()}>閉じる</button>
    </div>
    <ul>
      <For each={props.items}>
        {(nb) => (
          <li>
            <span class="v21-trash-name">{nb.title || '無題'}<small>{when(nb.archivedAt)} に非表示</small></span>
            <button type="button" class="v21-btn" onClick={() => go({ name: 'title', notebookId: nb.id! })}>開く</button>
            <button type="button" class="v21-btn" onClick={() => unarchiveNotebook(nb.id!)}>表示に戻す</button>
          </li>
        )}
      </For>
    </ul>
  </section>
)

/** ごみ箱の中身（戻す／完全に消す） */
export const TrashList: Component<{ items: Notebook[]; noun: string; onClose: () => void }> = (props) => (
  <section class="v21-trash" aria-label="ごみ箱">
    <div class="v21-trash-head">
      <h2>ごみ箱（{props.noun}）</h2>
      <button type="button" class="v21-link" onClick={() => props.onClose()}>閉じる</button>
    </div>
    <Show when={props.items.length} fallback={<p class="v21-dim v21-small">ごみ箱は空です。</p>}>
      <ul>
        <For each={props.items}>
          {(nb) => (
            <li>
              <span class="v21-trash-name">{nb.title || '無題'}<small>{when(nb.trashedAt)} にごみ箱へ</small></span>
              <button type="button" class="v21-btn" onClick={() => restoreNotebook(nb.id!)}>戻す</button>
              <button
                type="button"
                class="v21-btn danger"
                onClick={async () => {
                  if (await askConfirm({ title: `「${nb.title || '無題'}」を完全に消しますか？`, message: 'クラウドからも消え、元に戻せません。', okLabel: '完全に消す', danger: true })) void purgeNotebook(nb.id!)
                }}
              >
                完全に消す
              </button>
            </li>
          )}
        </For>
      </ul>
    </Show>
  </section>
)
