import { type Component, For, Index, Show, createMemo, createSignal } from 'solid-js'
import { state } from '../store'
import type { PlotNode, PlotRef } from '../types'
import { addDraft, draftsOf, flushDrafts } from './drafts'
import { go, scenePages } from './nav'
import { askConfirm } from './dialog'
import {
  SLOT_LABEL, addChart, addNode, addRoll, attach, detach, ensureStart, exportPlotJson, flowOf, moveNode, refDraft, refFromText,
  refLabel, refPage, refWw, removeChart, removeNode, removeRoll, renameRoll, setChartPlace, updateNode, type SlotName,
} from './plotFlow'

// プロットのボード（作品ページのタブ「プロット」）。章 → 場所（Scene）→ 一行プロットを縦につなぐ。
// 各プロットのスロットに 場面・下書き・資料 を付ける。ゲームの進行フロー（将来の別ボード）とは別。

const ICON: Record<SlotName, string> = { pages: '💬', drafts: '✎', materials: '📎' }
const PILLAR = /^柱[：:]\s*(.+)$/

const PlotBoardV21: Component<{ notebookId: string }> = (props) => {
  const nb = () => state.notebooks.find((n) => n.id === props.notebookId)
  const flow = () => flowOf(nb())
  const [picker, setPicker] = createSignal<{ nodeId: string; slot: SlotName } | null>(null)
  const [note, setNote] = createSignal('')
  const say = (t: string) => { setNote(t); setTimeout(() => setNote((cur) => (cur === t ? '' : cur)), 2600) }

  // 場所の候補: 作品の柱の名前
  const places = createMemo(() => {
    const set = new Set<string>()
    for (const p of nb() ? scenePages(nb()!) : []) for (const line of (p.body ?? '').split('\n')) { const m = line.match(PILLAR); if (m) set.add(m[1].trim()) }
    for (const t of nb()?.sceneTags ?? []) set.add(t)
    return [...set]
  })

  function focusNode(id: string) {
    requestAnimationFrame(() => (document.querySelector(`[data-plot-node="${id}"] input.v21-plot-text`) as HTMLInputElement | null)?.focus())
  }
  function openRef(r: PlotRef) {
    const kind = r.ref.slice(0, r.ref.indexOf(':'))
    const rest = r.ref.slice(r.ref.indexOf(':') + 1)
    if (kind === 'page') { const [nbId, pageId] = rest.split('/'); go({ name: 'talk', notebookId: nbId, pageId }); return }
    if (kind === 'draft') { flushDrafts(); go({ name: 'desk', shelf: props.notebookId, draftId: rest }); return }
    if (kind === 'url') { window.open(rest, '_blank', 'noopener'); return }
    if (kind === 'file') {
      navigator.clipboard?.writeText(rest).then(() => say('PC のファイルです。パスをコピーしました（PC で開いてください）')).catch(() => say(`PC のファイル: ${rest}`))
      return
    }
    if (kind === 'ww') say('WW は右のパネル（会話ログ・下書き）で使えます')
  }

  // ---- スロットに付ける（その場で開く小さな枠） ----
  const Picker = (p: { node: PlotNode; slot: SlotName }) => {
    const add = (r: PlotRef, label: string) => { if (attach(props.notebookId, p.node.id, p.slot, r)) say(`「${label}」を${SLOT_LABEL[p.slot]}に付けました`); else say('もう付いています') }
    return (
      <div class="v21-plot-picker" role="dialog" aria-label={`${SLOT_LABEL[p.slot]}を付ける`}>
        <div class="v21-plot-picker-head">
          <strong>{ICON[p.slot]} {SLOT_LABEL[p.slot]}を付ける</strong>
          <button type="button" class="v21-icon-btn" aria-label="閉じる" onClick={() => setPicker(null)}>×</button>
        </div>
        <Show when={p.slot === 'pages'}>
          <div class="v21-plot-picks">
            <For each={nb() ? scenePages(nb()!) : []} fallback={<p class="v21-dim v21-small">場面がありません。</p>}>
              {(pg) => <button type="button" onClick={() => add({ ref: refPage(props.notebookId, pg.id) }, pg.title || '無題')}>{pg.title || '無題'}</button>}
            </For>
          </div>
        </Show>
        <Show when={p.slot === 'drafts'}>
          <div class="v21-plot-picks">
            <For each={draftsOf(props.notebookId)}>
              {(d) => <button type="button" onClick={() => add({ ref: refDraft(d.id) }, d.title || '無題')}>{d.title || '無題の下書き'}</button>}
            </For>
            <button type="button" class="new" onClick={() => {
              const d = addDraft(props.notebookId)
              add({ ref: refDraft(d.id) }, d.title)
            }}>＋ 新しい下書きを作って付ける</button>
          </div>
        </Show>
        <Show when={p.slot === 'materials'}>
          <form class="v21-plot-paste" onSubmit={(e) => {
            e.preventDefault()
            const f = e.currentTarget
            const input = f.elements.namedItem('path') as HTMLInputElement
            const label = (f.elements.namedItem('label') as HTMLInputElement).value.trim()
            const r = refFromText(input.value)
            if (!r) { say('URL（https://… や /deliveries/…）か、PC のパス（C:\\…）を貼ってください'); return }
            add(label ? { ...r, label } : r, label || refLabel(nb(), r))
            f.reset()
          }}>
            <input name="path" placeholder="URL・公開パス・PC のパスを貼る" aria-label="資料の場所" />
            <input name="label" placeholder="名前（無くてもよい）" aria-label="資料の名前" />
            <button type="submit" class="v21-btn primary">付ける</button>
          </form>
          <Show when={nb()?.assets?.length}>
            <p class="v21-plot-picker-sub">作品の素材</p>
            <div class="v21-plot-assets">
              <For each={nb()!.assets}>
                {(a) => (
                  <button type="button" title={a.note || a.label} onClick={() => add({ ref: `url:${a.path}`, label: a.label, schema: 'asset.image.v1' }, a.label)}>
                    <img src={a.path} alt="" loading="lazy" /><span>{a.label}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
          <Show when={nb()?.ww?.length}>
            <p class="v21-plot-picker-sub">WW（アイテム・武器・スキル・用語）</p>
            <div class="v21-plot-picks">
              <For each={nb()!.ww}>{(e) => <button type="button" onClick={() => add({ ref: refWw(e.id) }, e.name)}>{e.name}</button>}</For>
            </div>
          </Show>
        </Show>
      </div>
    )
  }

  return (
    <div class="v21-plot">
      <div class="v21-plot-head">
        <p class="v21-dim v21-small">一行プロットを縦につなぎ、場面・下書き・資料を付けます。プロットの欄で Enter を押すと、下に次のプロットができます。ゲームの進行フローとは別のボードです。</p>
        <div class="v21-row">
          <Show when={flow().rolls.length}>
            <button type="button" class="v21-btn" onClick={() => nb() && exportPlotJson(nb()!)} title="note_story.plot.v0.1 の JSON をファイルに保存">JSON に書き出す</button>
          </Show>
          <button type="button" class="v21-btn" onClick={() => addRoll(props.notebookId)}>＋ 章</button>
        </div>
      </div>
      <Show when={note()}><p class="v21-plot-note" role="status">{note()}</p></Show>

      <Show when={flow().rolls.length} fallback={
        <div class="v21-plot-empty">
          <p>まだプロットがありません。</p>
          <button type="button" class="v21-btn primary" onClick={() => { const c = ensureStart(props.notebookId); if (c) requestAnimationFrame(() => (document.querySelector('.v21-plot input.v21-plot-text') as HTMLInputElement | null)?.focus()) }}>プロットを書きはじめる</button>
        </div>
      }>
        <datalist id={`plot-places-${props.notebookId}`}><For each={places()}>{(p) => <option value={p} />}</For></datalist>
        <Index each={flow().rolls}>
          {(roll) => (
            <section class="v21-plot-roll">
              <div class="v21-plot-roll-head">
                <input class="v21-plot-roll-title" value={roll().title} aria-label="章の名前" onChange={(e) => renameRoll(props.notebookId, roll().id, e.currentTarget.value)} />
                <button type="button" class="v21-icon-btn" title="この章を消す" onClick={async () => { if (await askConfirm({ title: `「${roll().title}」を消しますか？`, message: '中の場所とプロットも消えます。付けた場面・下書き・資料そのものは消えません。', okLabel: '消す', danger: true })) removeRoll(props.notebookId, roll().id) }}>×</button>
              </div>
              <Index each={roll().charts}>
                {(chart, ci) => (
                  <div class="v21-plot-chart">
                    <div class="v21-plot-chart-head">
                      <span class="v21-plot-chart-no">{ci + 1}</span>
                      <input class="v21-plot-place" value={chart().place} placeholder="場所（Scene・柱の名前）" aria-label="場所" list={`plot-places-${props.notebookId}`} onChange={(e) => setChartPlace(props.notebookId, chart().id, e.currentTarget.value.trim())} />
                      <button type="button" class="v21-icon-btn" title="この場所を消す" onClick={async () => { if (await askConfirm({ title: 'この場所とプロットを消しますか？', message: '付けた場面・下書き・資料そのものは消えません。', okLabel: '消す', danger: true })) removeChart(props.notebookId, chart().id) }}>×</button>
                    </div>
                    <ol class="v21-plot-nodes">
                      <Index each={chart().nodes}>
                        {(node, i) => (
                          <li class="v21-plot-node" classList={{ optional: !node().required }} data-plot-node={node().id}>
                            <div class="v21-plot-row">
                              <span class="v21-plot-no">{i + 1}</span>
                              <input
                                class="v21-plot-text"
                                value={node().text}
                                placeholder="一行プロット（例: 倒れている兵士に話しかける）"
                                aria-label="一行プロット"
                                onInput={(e) => updateNode(props.notebookId, node().id, { text: e.currentTarget.value })}
                                onKeyDown={(e) => {
                                  if (e.isComposing || e.key !== 'Enter') return
                                  e.preventDefault()
                                  focusNode(addNode(props.notebookId, chart().id, '', node().id))
                                }}
                              />
                              <button type="button" class="v21-plot-req" classList={{ on: node().required }} title="必須（進行に要る）／任意" onClick={() => updateNode(props.notebookId, node().id, { required: !node().required })}>{node().required ? '必須' : '任意'}</button>
                              <button type="button" class="v21-icon-btn" title="上へ" disabled={i === 0} onClick={() => moveNode(props.notebookId, node().id, -1)}>↑</button>
                              <button type="button" class="v21-icon-btn" title="下へ" disabled={i === chart().nodes.length - 1} onClick={() => moveNode(props.notebookId, node().id, 1)}>↓</button>
                              <button type="button" class="v21-icon-btn" title="このプロットを消す" onClick={() => removeNode(props.notebookId, node().id)}>×</button>
                            </div>
                            <div class="v21-plot-slots">
                              <For each={(['pages', 'drafts', 'materials'] as SlotName[]).flatMap((s) => node().slots[s].map((r) => ({ s, r })))}>
                                {(x) => (
                                  <span class={`v21-plot-chip ${x.s}`}>
                                    <button type="button" class="open" title={x.r.ref} onClick={() => openRef(x.r)}>{ICON[x.s]} {refLabel(nb(), x.r)}</button>
                                    <button type="button" class="del" aria-label="外す" title="外す（資料そのものは消えません）" onClick={() => detach(props.notebookId, node().id, x.s, x.r.ref)}>×</button>
                                  </span>
                                )}
                              </For>
                              <For each={['pages', 'drafts', 'materials'] as SlotName[]}>
                                {(s) => (
                                  <button type="button" class="v21-plot-add" classList={{ on: picker()?.nodeId === node().id && picker()?.slot === s }} onClick={() => setPicker(picker()?.nodeId === node().id && picker()?.slot === s ? null : { nodeId: node().id, slot: s })}>＋ {SLOT_LABEL[s]}</button>
                                )}
                              </For>
                            </div>
                            <Show when={picker()?.nodeId === node().id ? picker()!.slot : null} keyed>
                              {(slot) => <Picker node={node()} slot={slot} />}
                            </Show>
                          </li>
                        )}
                      </Index>
                    </ol>
                    <button type="button" class="v21-plot-more" onClick={() => focusNode(addNode(props.notebookId, chart().id))}>＋ 一行プロット</button>
                  </div>
                )}
              </Index>
              <button type="button" class="v21-plot-more place" onClick={() => addChart(props.notebookId, roll().id)}>＋ 場所（Scene）</button>
            </section>
          )}
        </Index>
      </Show>
    </div>
  )
}

export default PlotBoardV21
