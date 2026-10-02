import { type Component, For, Index, Show, createMemo, createSignal } from 'solid-js'
import { state } from '../store'
import { addNode, attach, detach, ensureStart, flowOf, nodesWithRef, refDraft } from './plotFlow'

// 下書きの画面から、画面を移らずにプロットのフローチャートへ付ける小さな枠（2026-09-28 利用者）。
// 付いているプロットの確認と外す／プロットを選んで付ける／この下書きを新しいプロットとして足す。

type Props = { notebookId: string; draftId: string; draftTitle: string; onClose: () => void }

const PlotLinkPopover: Component<Props> = (props) => {
  const nb = () => state.notebooks.find((n) => n.id === props.notebookId)
  const ref = () => refDraft(props.draftId)
  const linked = createMemo(() => nodesWithRef(nb(), ref()))
  const isLinked = (nodeId: string) => linked().some((x) => x.node.id === nodeId)
  const [q, setQ] = createSignal('')
  const [note, setNote] = createSignal('')
  const charts = createMemo(() => flowOf(nb()).rolls.flatMap((r) => r.charts.map((c, ci) => ({ roll: r, chart: c, no: ci + 1 }))))
  const [target, setTarget] = createSignal<string>('')
  const hit = (t: string) => !q().trim() || t.toLowerCase().includes(q().trim().toLowerCase())

  function link(nodeId: string, label: string) {
    if (attach(props.notebookId, nodeId, 'drafts', { ref: ref() })) setNote(`「${label || '（空のプロット）'}」に付けました`)
  }
  function addAsNew(e: SubmitEvent) {
    e.preventDefault()
    const text = ((e.currentTarget as HTMLFormElement).elements.namedItem('text') as HTMLInputElement).value.trim()
    const chartId = target() || charts()[charts().length - 1]?.chart.id || ensureStart(props.notebookId)
    if (!chartId) return
    addNode(props.notebookId, chartId, text, undefined, { slot: 'drafts', ref: { ref: ref() } })
    setNote(`新しいプロット「${text || '（空）'}」を足して、この下書きを付けました`)
  }

  return (
    <div class="v21-plotlink" role="dialog" aria-label="プロットに付ける">
      <div class="v21-plotlink-head">
        <strong>プロットに付ける</strong>
        <button type="button" class="v21-icon-btn" aria-label="閉じる" onClick={() => props.onClose()}>×</button>
      </div>
      <Show when={note()}><p class="v21-plot-note" role="status">{note()}</p></Show>

      <p class="v21-plotlink-sub">この下書きが付いているプロット</p>
      <div class="v21-plotlink-linked">
        <For each={linked()} fallback={<p class="v21-dim v21-small">まだ付いていません。</p>}>
          {(x) => (
            <span class="v21-plot-chip drafts">
              <span class="open">{x.roll.title}・{x.chart.place || '場所なし'} {x.no}. {x.node.text || '（空）'}</span>
              <button type="button" class="del" aria-label="外す" onClick={() => detach(props.notebookId, x.node.id, 'drafts', ref())}>×</button>
            </span>
          )}
        </For>
      </div>

      <form class="v21-plotlink-new" onSubmit={addAsNew}>
        <p class="v21-plotlink-sub">新しいプロットとして足す</p>
        <input name="text" value={props.draftTitle} aria-label="一行プロット" placeholder="一行プロット" />
        <Show when={charts().length}>
          <select value={target()} aria-label="足す場所" onChange={(e) => setTarget(e.currentTarget.value)}>
            <option value="">最後の場所（{charts()[charts().length - 1]?.chart.place || '場所なし'}）</option>
            <For each={charts()}>{(c) => <option value={c.chart.id}>{c.roll.title}・{c.no}. {c.chart.place || '場所なし'}</option>}</For>
          </select>
        </Show>
        <button type="button" class="v21-btn primary" onClick={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}>足して付ける</button>
      </form>

      <Show when={charts().length}>
        <p class="v21-plotlink-sub">今あるプロットに付ける</p>
        <input class="v21-plotlink-search" placeholder="プロットを探す" value={q()} onInput={(e) => setQ(e.currentTarget.value)} />
        <div class="v21-plotlink-list">
          <Index each={charts()}>
            {(c) => (
              <div class="v21-plotlink-chart">
                <p class="v21-plotlink-place">{c().roll.title}・<b>{c().no}</b> {c().chart.place || '場所なし'}</p>
                <Index each={c().chart.nodes}>
                  {(n, i) => (
                    <Show when={hit(n().text)}>
                      <button type="button" classList={{ on: isLinked(n().id) }} disabled={isLinked(n().id)} onClick={() => link(n().id, n().text)}>
                        <span>{i + 1}</span>{n().text || '（空のプロット）'}{isLinked(n().id) ? ' ✓' : ''}
                      </button>
                    </Show>
                  )}
                </Index>
              </div>
            )}
          </Index>
        </div>
      </Show>
    </div>
  )
}

export default PlotLinkPopover
