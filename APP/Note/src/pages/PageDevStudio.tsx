import { type Component, For, createMemo, createSignal } from 'solid-js'
import readme from '../../DevStudio/README.md?raw'
import developmentPlan from '../../DevStudio/02_Development_Plan.md?raw'
import kanban from '../../DevStudio/03_Kanban.md?raw'
import doneDefinition from '../../DevStudio/05_Done_Definition.md?raw'

type Task = {
  id: string
  title: string
  lane: 'Inbox' | 'Ready' | 'Doing' | 'Review' | 'Done'
  progress: number
  note: string
}

const TASKS: Task[] = [
  { id: 'git', title: 'Git初期化 / push', lane: 'Done', progress: 100, note: 'origin/mainへpush済み' },
  { id: 'devstudio', title: 'DevStudioをアプリ内表示', lane: 'Done', progress: 100, note: 'Board / Docsをヘッダー切替に整理' },
  { id: 'upnote-state', title: 'UPNOTE state boundary', lane: 'Done', progress: 100, note: 'src/features/upnote/state.ts' },
  { id: 'upnote-page', title: 'UPNOTE初回ページ', lane: 'Doing', progress: 55, note: 'editor/list/tags/relationを接続' },
  { id: 'note-repo', title: 'Local JSON / MD export', lane: 'Review', progress: 65, note: 'HeaderからJSON/MDを書き出し。Import/永続保存は次段階' },
  { id: 'db-rename', title: 'DB画面のnote用rename', lane: 'Review', progress: 75, note: 'DB01/02タイトル編集、TYPE動的フィルター、旧分類撤去' },
  { id: 'gallery-add', title: 'Gallery image add', lane: 'Review', progress: 80, note: '画像ファイル追加とdataUrl登録を実装' },
  { id: 'pwa-icon', title: 'PWA icon', lane: 'Inbox', progress: 0, note: 'note/card/relationのシルエット案' },
]

const LANES: Task['lane'][] = ['Inbox', 'Ready', 'Doing', 'Review', 'Done']

const DOCS = [
  { id: 'plan', title: 'Plan', content: developmentPlan },
  { id: 'kanban', title: 'Kanban Source', content: kanban },
  { id: 'done', title: 'DONE', content: doneDefinition },
  { id: 'readme', title: 'Readme', content: readme },
]

const PageDevStudio: Component = () => {
  const [activeView, setActiveView] = createSignal<'board' | 'docs'>('board')
  const [activeDocId, setActiveDocId] = createSignal('plan')
  const activeDoc = createMemo(() => DOCS.find((doc) => doc.id === activeDocId()) ?? DOCS[0])
  const progress = createMemo(() => Math.round(TASKS.reduce((sum, task) => sum + task.progress, 0) / TASKS.length))

  return (
    <div class="h-full bg-nacc-light overflow-hidden flex flex-col">
      <div class="px-6 py-4 bg-white border-b border-nacc-border shrink-0">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-xl font-bold text-nacc-dark">DevStudio</h1>
            <p class="text-xs text-gray-500 mt-1">進捗率、TODO、Kanbanを先に見るための開発ボード。</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="mode-pill">
              <button classList={{ active: activeView() === 'board' }} onClick={() => setActiveView('board')}>
                Board
              </button>
              <button classList={{ active: activeView() === 'docs' }} onClick={() => setActiveView('docs')}>
                Docs
              </button>
            </div>
            <div class="w-72">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>Total Progress</span>
              <span class="font-semibold text-nacc-dark">{progress()}%</span>
            </div>
            <div class="h-2 rounded-full bg-nacc-light overflow-hidden">
              <div class="h-full bg-nacc-gold" style={{ width: `${progress()}%` }} />
            </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-5 gap-3 p-4 flex-1 bg-[#fbfaf8] overflow-x-auto"
        classList={{ hidden: activeView() !== 'board' }}
      >
        <For each={LANES}>
          {(lane) => (
            <section class="min-w-44 bg-white border border-nacc-border rounded-xl p-3 overflow-y-auto">
              <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{lane}</h2>
              <div class="flex flex-col gap-2">
                <For each={TASKS.filter((task) => task.lane === lane)}>
                  {(task) => (
                    <article class="border border-nacc-border rounded-lg p-2 bg-[#fffdf9]">
                      <div class="text-sm font-semibold text-nacc-dark leading-snug">{task.title}</div>
                      <div class="text-[11px] text-gray-500 mt-1">{task.note}</div>
                      <div class="flex items-center gap-2 mt-2">
                        <div class="h-1.5 flex-1 rounded-full bg-nacc-light overflow-hidden">
                          <div class="h-full bg-nacc-gold" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span class="text-[11px] text-gray-400">{task.progress}%</span>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </section>
          )}
        </For>
      </div>

      <div class="flex flex-1 min-h-0 overflow-hidden" classList={{ hidden: activeView() !== 'docs' }}>
        <aside class="w-56 shrink-0 bg-white border-r border-nacc-border overflow-y-auto p-3">
          <div class="text-xs font-semibold text-gray-400 px-2 pb-2">Docs</div>
          <For each={DOCS}>
            {(doc) => (
              <button
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1"
                classList={{
                  'bg-nacc-light text-nacc-dark font-semibold': activeDocId() === doc.id,
                  'text-gray-500 hover:bg-gray-50': activeDocId() !== doc.id,
                }}
                onClick={() => setActiveDocId(doc.id)}
              >
                {doc.title}
              </button>
            )}
          </For>
        </aside>

        <main class="flex-1 min-w-0 overflow-y-auto p-5">
          <pre class="whitespace-pre-wrap break-words text-sm leading-7 text-nacc-dark bg-white border border-nacc-border rounded-xl p-5 font-mono">
            {activeDoc().content}
          </pre>
        </main>
      </div>
    </div>
  )
}

export default PageDevStudio
