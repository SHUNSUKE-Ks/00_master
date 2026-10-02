import { state } from '../store'
import type { Notebook, PlotChart, PlotFlow, PlotNode, PlotRef, PlotRoll, PlotSlots } from '../types'
import { downloadJson } from '../utils/keydeckExport'
import { patchNotebookSoon } from './actions'
import { findDraft } from './drafts'

// プロットのフローチャート（2026-09-28 利用者）。章 → 場所（Scene）→ 一行プロットを縦につなぎ、
// 場面・下書き・資料をスロットに付ける。ゲームの進行フロー（将来の別ボード）とは別のデータ（nb.plotFlow）。
// 資料はパスを写さず、種類つきの参照（page:・draft:・ww:・url:・file:）で持つ。
// 設計: docs/構想_フローチャートとScene登場人物スロット_2026-09-28.md

export type SlotName = keyof PlotSlots
export const SLOT_LABEL: Record<SlotName, string> = { pages: '場面', drafts: '下書き', materials: '資料' }

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const emptySlots = (): PlotSlots => ({ pages: [], drafts: [], materials: [] })
export const newNode = (text = ''): PlotNode => ({ id: uid('pn'), type: 'plot', text, required: true, slots: emptySlots() })
const newChart = (place = ''): PlotChart => ({ id: uid('pc'), place, nodes: [newNode()] })
const newRoll = (title: string): PlotRoll => ({ id: uid('pr'), title, charts: [newChart()] })

/** 作品のプロットのフロー（無ければ空の形。保存はしない） */
export function flowOf(nb: Notebook | undefined): PlotFlow {
  return nb?.plotFlow ?? { schema: 'note_story.plot.v0.1', rolls: [] }
}

/** 形を写し取って直し、保存する */
function mutate(nbId: string, fn: (flow: PlotFlow) => void) {
  const nb = state.notebooks.find((n) => n.id === nbId)
  if (!nb) return
  const flow = JSON.parse(JSON.stringify(flowOf(nb))) as PlotFlow
  fn(flow)
  patchNotebookSoon(nbId, { plotFlow: flow })
}

function findNode(flow: PlotFlow, nodeId: string) {
  for (const r of flow.rolls) for (const c of r.charts) {
    const i = c.nodes.findIndex((n) => n.id === nodeId)
    if (i >= 0) return { roll: r, chart: c, index: i, node: c.nodes[i] }
  }
  return null
}

// ── 章・場所・プロット ─────────────────────────────────────────────
export function addRoll(nbId: string) {
  mutate(nbId, (f) => { f.rolls.push(newRoll(`第${f.rolls.length + 1}章`)) })
}
export function renameRoll(nbId: string, rollId: string, title: string) {
  mutate(nbId, (f) => { const r = f.rolls.find((x) => x.id === rollId); if (r) r.title = title })
}
export function removeRoll(nbId: string, rollId: string) {
  mutate(nbId, (f) => { f.rolls = f.rolls.filter((r) => r.id !== rollId) })
}
export function addChart(nbId: string, rollId: string, place = '') {
  mutate(nbId, (f) => { f.rolls.find((r) => r.id === rollId)?.charts.push(newChart(place)) })
}
export function setChartPlace(nbId: string, chartId: string, place: string) {
  mutate(nbId, (f) => { for (const r of f.rolls) for (const c of r.charts) if (c.id === chartId) c.place = place })
}
export function removeChart(nbId: string, chartId: string) {
  mutate(nbId, (f) => { for (const r of f.rolls) r.charts = r.charts.filter((c) => c.id !== chartId) })
}
/** プロットを1つ足す（after があればその下、無ければ場所の最後）。足したプロットの id を返す */
export function addNode(nbId: string, chartId: string, text = '', after?: string, attach?: { slot: SlotName; ref: PlotRef }): string {
  const node = newNode(text)
  if (attach) node.slots[attach.slot].push(attach.ref)
  mutate(nbId, (f) => {
    for (const r of f.rolls) for (const c of r.charts) {
      if (c.id !== chartId) continue
      const i = after ? c.nodes.findIndex((n) => n.id === after) : -1
      if (i >= 0) c.nodes.splice(i + 1, 0, node)
      else c.nodes.push(node)
    }
  })
  return node.id
}
export function updateNode(nbId: string, nodeId: string, patch: Partial<Pick<PlotNode, 'text' | 'required'>>) {
  mutate(nbId, (f) => { const hit = findNode(f, nodeId); if (hit) Object.assign(hit.node, patch) })
}
export function moveNode(nbId: string, nodeId: string, step: -1 | 1) {
  mutate(nbId, (f) => {
    const hit = findNode(f, nodeId)
    if (!hit) return
    const j = hit.index + step
    if (j < 0 || j >= hit.chart.nodes.length) return
    ;[hit.chart.nodes[hit.index], hit.chart.nodes[j]] = [hit.chart.nodes[j], hit.chart.nodes[hit.index]]
  })
}
export function removeNode(nbId: string, nodeId: string) {
  mutate(nbId, (f) => { const hit = findNode(f, nodeId); if (hit) hit.chart.nodes.splice(hit.index, 1) })
}

/** 最初の章・最初の場所を用意する（まだ何も無い作品）。場所の id を返す */
export function ensureStart(nbId: string): string | null {
  const nb = state.notebooks.find((n) => n.id === nbId)
  if (!nb) return null
  const flow = flowOf(nb)
  if (flow.rolls[0]?.charts[0]) return flow.rolls[0].charts[0].id
  const roll = newRoll('第1章')
  patchNotebookSoon(nbId, { plotFlow: { schema: 'note_story.plot.v0.1', rolls: [roll] } })
  return roll.charts[0].id
}

// ── スロット ───────────────────────────────────────────────────
export function attach(nbId: string, nodeId: string, slot: SlotName, ref: PlotRef): boolean {
  let added = false
  mutate(nbId, (f) => {
    const hit = findNode(f, nodeId)
    if (!hit || hit.node.slots[slot].some((r) => r.ref === ref.ref)) return
    hit.node.slots[slot].push(ref)
    added = true
  })
  return added
}
export function detach(nbId: string, nodeId: string, slot: SlotName, ref: string) {
  mutate(nbId, (f) => { const hit = findNode(f, nodeId); if (hit) hit.node.slots[slot] = hit.node.slots[slot].filter((r) => r.ref !== ref) })
}
/** この参照が付いているプロット（下書きがどこに付いているか、など） */
export function nodesWithRef(nb: Notebook | undefined, ref: string) {
  const out: Array<{ roll: PlotRoll; chart: PlotChart; node: PlotNode; no: number }> = []
  for (const r of flowOf(nb).rolls) for (const c of r.charts) c.nodes.forEach((n, i) => {
    if ((['pages', 'drafts', 'materials'] as SlotName[]).some((s) => n.slots[s].some((x) => x.ref === ref))) out.push({ roll: r, chart: c, node: n, no: i + 1 })
  })
  return out
}

// ── 参照の作り方と読み方 ─────────────────────────────────────────
export const refPage = (nbId: string, pageId: string) => `page:${nbId}/${pageId}`
export const refDraft = (id: string) => `draft:${id}`
export const refWw = (id: string) => `ww:${id}`

/** 貼り付けた文字から資料の参照を作る（URL・公開パス・PC のパス）。わからなければ null */
export function refFromText(raw: string): PlotRef | null {
  const v = raw.trim().replace(/^"(.*)"$/, '$1')
  if (!v) return null
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('/')) return { ref: `url:${v}`, schema: guessSchema(v) }
  if (/^[a-zA-Z]:[\\/]/.test(v) || v.startsWith('\\\\')) return { ref: `file:${v}`, schema: guessSchema(v) }
  if (/^(url|file|page|draft|ww):/.test(v)) return { ref: v }
  return null
}
function guessSchema(v: string) {
  if (/\.(png|jpe?g|webp|gif|avif)$/i.test(v)) return 'asset.image.v1'
  if (/\.(ogg|mp3|wav|m4a)$/i.test(v)) return 'asset.audio.v1'
  if (/\.(md|txt)$/i.test(v)) return 'doc.text.v1'
  if (/\.json$/i.test(v)) return 'data.json.v1'
  return undefined
}

/** 参照を人が読める名前に */
export function refLabel(nb: Notebook | undefined, r: PlotRef): string {
  if (r.label) return r.label
  const [kind, rest] = [r.ref.slice(0, r.ref.indexOf(':')), r.ref.slice(r.ref.indexOf(':') + 1)]
  if (kind === 'page') {
    const [, pageId] = rest.split('/')
    return nb?.pages.find((p) => p.id === pageId)?.title || '（消えた場面）'
  }
  if (kind === 'draft') {
    const d = nb?.id ? findDraft(nb.id, rest) : undefined
    return d ? d.title.trim() || d.body.trim().split('\n')[0]?.slice(0, 20) || '無題の下書き' : '（この端末に無い下書き）'
  }
  if (kind === 'ww') return nb?.ww?.find((e) => e.id === rest)?.name ?? '（消えたWW）'
  const tail = rest.split(/[\\/]/).pop() || rest
  return decodeURIComponent(tail)
}

/** JSON として書き出す（novelEngine・CODEX に渡す用） */
export function exportPlotJson(nb: Notebook) {
  const flow = flowOf(nb)
  const out = {
    ...flow,
    titleId: nb.id,
    title: nb.title,
    exportedAt: new Date().toISOString(),
    // 縦のつながり（next）は並び順から作る。選択肢の分かれ道は進行フロー（別ボード）で持つ
    rolls: flow.rolls.map((r) => ({
      ...r,
      charts: r.charts.map((c, ci) => ({
        ...c,
        nodes: c.nodes.map((n, i) => {
          const nextNode = c.nodes[i + 1] ?? r.charts[ci + 1]?.nodes[0]
          return { ...n, slots: Object.fromEntries(Object.entries(n.slots).map(([k, list]) => [k, list.map((x) => ({ ...x, label: refLabel(nb, x) }))])), next: nextNode ? [nextNode.id] : [] }
        }),
      })),
    })),
  }
  downloadJson(`plot_${(nb.title || 'title').replace(/[\\/:*?"<>|\s]+/g, '_')}.json`, out)
}
