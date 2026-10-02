import { type Component, For, Show, createMemo, createSignal, onMount } from 'solid-js'
import { state } from '../store'

/**
 * ClaudeNote — 技術トピックの選別ビュー。
 *
 * ■ Master を壊さないことを、注意ではなく構造で保証する
 *   このファイルは store から `state` しか import しない。`setState` を持たない。
 *   したがって Master データへ書き込む手段がそもそも無い。
 *   選別の結果（チェック）は localStorage にだけ置く。消えても Master は無傷。
 *
 * ■ 何をする画面か
 *   溜まったノートとメモを1列に並べ、これからの開発に役立つものだけを拾い、
 *   技術トピックカードの素材としてコピーする。分類も編集もしない。拾うだけ。
 *
 * ■ 期待ログ
 *   [CLAUDENOTE] 1-1 opened          … 画面を開いた
 *   [CLAUDENOTE] 2-1 picked          … 1件選んだ / 外した
 *   [CLAUDENOTE] 3-1 copied          … 選んだものをコピーした
 */

const PICK_KEY = 'claudenote-picks-v1'

/** 開発の役に立ちそうな語。押すと絞り込む。増やしても Master には影響しない。 */
const PRESETS = [
  'JsonSlot', 'Slot', 'Engine', 'Tauri', 'Solid', 'スカフォールド', 'テスト',
  'ログ', '設計', 'Schema', 'novel', 'ノベル', 'Agent', '自走', 'View', 'DB',
]

type Row = {
  key: string
  source: string
  title: string
  body: string
  path?: string
}

/** Master から読むだけ。並べ替えも複製もしない。 */
function collectRows(): Row[] {
  const rows: Row[] = []
  for (const nb of state.notebooks ?? []) {
    for (const pg of nb.pages ?? []) {
      const body = [pg.body, pg.scenarioBody].filter(Boolean).join('\n')
      if (!body.trim() && !pg.title.trim()) continue
      rows.push({
        key: `nb:${nb.id ?? nb.title}:${pg.id}`,
        source: nb.title,
        title: pg.title,
        body,
        path: pg.sourcePath,
      })
    }
  }
  for (const m of state.memos ?? []) {
    if (!m.body?.trim() && !m.title?.trim()) continue
    rows.push({
      key: `memo:${m.id ?? m.title}`,
      source: 'Memo',
      title: m.title,
      body: m.body ?? '',
    })
  }
  return rows
}

const PageClaudeNote: Component = () => {
  const [q, setQ] = createSignal('')
  const [picks, setPicks] = createSignal<string[]>([])
  const [onlyPicked, setOnlyPicked] = createSignal(false)
  const [copied, setCopied] = createSignal('')

  onMount(() => {
    try {
      const saved = localStorage.getItem(PICK_KEY)
      if (saved) setPicks(JSON.parse(saved))
    } catch { /* 壊れていたら無視。Master には触れない */ }
    console.log('[CLAUDENOTE] 1-1 opened', { rows: collectRows().length })
  })

  const rows = createMemo(collectRows)

  const hits = createMemo(() => {
    const needle = q().trim().toLowerCase()
    const picked = picks()
    return rows().filter((r) => {
      if (onlyPicked() && !picked.includes(r.key)) return false
      if (!needle) return true
      return (r.title + '\n' + r.body + '\n' + r.source).toLowerCase().includes(needle)
    })
  })

  function togglePick(key: string) {
    const next = picks().includes(key) ? picks().filter((k) => k !== key) : [...picks(), key]
    setPicks(next)
    localStorage.setItem(PICK_KEY, JSON.stringify(next))
    console.log('[CLAUDENOTE] 2-1 picked', { key, picked: next.length })
  }

  /** 技術トピックカードの素材として、そのまま貼れる形にする。 */
  function asCardSource(list: Row[]) {
    const head = [
      '# 技術トピックカードの素材（ClaudeNote から抜き出し）',
      '',
      `- 出典アプリ: kanban-note01（C:\\00_master\\APP\\kanban-note01）`,
      `- 抜き出し日: ${new Date().toISOString().slice(0, 10)}`,
      `- 件数: ${list.length}`,
      '- **これはノートの下書きであり、動くコードではない。**',
      '  カードにするときは status を planned とし、実装根拠として使わないこと。',
      '',
    ]
    const body = list.map((r) => [
      `## ${r.title || '(無題)'}`,
      `出典: ${r.source}${r.path ? ` / ${r.path}` : ''}`,
      '',
      r.body.trim(),
      '',
    ].join('\n'))
    return head.concat(body).join('\n')
  }

  function copy(text: string, label: string) {
    const done = () => { setCopied(label); setTimeout(() => setCopied(''), 1200) }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback(text, done))
    } else fallback(text, done)
    console.log('[CLAUDENOTE] 3-1 copied', { label, chars: text.length })
  }

  function fallback(text: string, done: () => void) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy'); done() } catch { window.prompt('Ctrl+C でコピー', text) }
    document.body.removeChild(ta)
  }

  const pickedRows = createMemo(() => rows().filter((r) => picks().includes(r.key)))

  return (
    <div class="h-full overflow-y-auto px-5 py-4 text-sm">
      <div class="mb-3">
        <div class="flex items-baseline gap-3 flex-wrap">
          <h1 class="text-lg font-medium">ClaudeNote</h1>
          <span class="text-xs text-gray-400">
            溜まったノートから、これからの開発に役立つものだけ拾う
          </span>
        </div>
        <p class="mt-1 text-xs text-gray-400">
          この画面は<b>読み取り専用</b>です。Master のデータを書き換える手段を持ちません。
          選んだ印はこの端末（localStorage）にだけ残ります。
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap mb-2">
        <input
          class="border rounded px-2 py-1 text-sm flex-1 min-w-[220px]"
          placeholder="語で絞り込む（例: JsonSlot / Tauri / スカフォールド）"
          value={q()}
          onInput={(e) => setQ(e.currentTarget.value)}
        />
        <button
          class="border rounded px-3 py-1 text-xs"
          classList={{ 'bg-gray-100': onlyPicked() }}
          onClick={() => setOnlyPicked(!onlyPicked())}
        >
          選んだものだけ {picks().length}
        </button>
        <button
          class="border rounded px-3 py-1 text-xs"
          disabled={!picks().length}
          onClick={() => copy(asCardSource(pickedRows()), 'all')}
        >
          {copied() === 'all' ? 'コピー済' : '選んだものをコピー'}
        </button>
      </div>

      <div class="flex gap-1 flex-wrap mb-3">
        <For each={PRESETS}>
          {(w) => (
            <button
              class="border rounded px-2 py-0.5 text-xs text-gray-500 hover:text-gray-900"
              classList={{ 'bg-gray-100 text-gray-900': q() === w }}
              onClick={() => setQ(q() === w ? '' : w)}
            >
              {w}
            </button>
          )}
        </For>
      </div>

      <div class="text-xs text-gray-400 mb-2">
        {hits().length} / {rows().length} 件
      </div>

      <Show when={hits().length} fallback={<div class="text-gray-400 py-8">該当なし</div>}>
        <ul class="space-y-2">
          <For each={hits()}>
            {(r) => (
              <li class="border rounded p-3">
                <div class="flex items-start gap-2">
                  <input
                    type="checkbox"
                    class="mt-1"
                    checked={picks().includes(r.key)}
                    onChange={() => togglePick(r.key)}
                  />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium">{r.title || '(無題)'}</div>
                    <div class="text-xs text-gray-400">
                      {r.source}{r.path ? ` / ${r.path}` : ''}
                    </div>
                    <pre class="mt-1 text-xs text-gray-600 whitespace-pre-wrap line-clamp-6">
                      {r.body.slice(0, 600)}
                    </pre>
                  </div>
                  <button
                    class="border rounded px-2 py-1 text-xs shrink-0"
                    onClick={() => copy(asCardSource([r]), r.key)}
                  >
                    {copied() === r.key ? '済' : 'コピー'}
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}

export default PageClaudeNote
