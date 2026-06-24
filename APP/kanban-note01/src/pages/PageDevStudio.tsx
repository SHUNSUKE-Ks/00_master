import { type Component, For, createMemo, createSignal } from 'solid-js'
import readme from '../../DevStudio/README.md?raw'
import developmentPlan from '../../DevStudio/02_Development_Plan.md?raw'
import kanban from '../../DevStudio/03_Kanban.md?raw'
import doneDefinition from '../../DevStudio/05_Done_Definition.md?raw'

type Task = {
  id: string
  title: string
  lane: 'Inbox' | 'Breakdown' | 'Writing' | 'Review' | 'Done'
  progress: number
  source: string
  scenarioTarget: string
  note: string
  todo: { title: string; done: boolean }[]
}

const TASKS: Task[] = [
  {
    id: 'kb-scene-intro',
    title: '第一話 導入シーンを作る',
    lane: 'Inbox',
    progress: 10,
    source: 'Kanban_June',
    scenarioTarget: '天災魔法使い / chapter-1',
    note: '親タスクを受注。まずScene TODOへ分解する。',
    todo: [
      { title: '親タスクの目的を1行で書く', done: true },
      { title: '登場キャラを決める', done: false },
      { title: 'シーンの開始地点と終了地点を決める', done: false },
      { title: '本文ノートへ下書き先を作る', done: false },
    ],
  },
  {
    id: 'scene-character-check',
    title: 'Character DBと導入シーンの整合確認',
    lane: 'Breakdown',
    progress: 35,
    source: 'Scenario Board',
    scenarioTarget: 'Character DB / 天災魔法使い',
    note: 'キャラ名、役割、口調を本文に入れる前に確認する。',
    todo: [
      { title: 'Character DBの候補を確認', done: true },
      { title: '本文に出すキャラを3名以内に絞る', done: true },
      { title: '口調メモをscenarioノートへ書く', done: false },
      { title: '矛盾があればCharacter DBへ戻す', done: false },
    ],
  },
  {
    id: 'scene-dialogue-draft',
    title: '導入シーン 会話ログ下書き',
    lane: 'Writing',
    progress: 55,
    source: 'Scenario Board',
    scenarioTarget: '天災魔法使い / 第一章 短稿',
    note: 'Characterボタンで名前を挿入し、会話ログ形式で進める。',
    todo: [
      { title: 'ナレーションで状況を置く', done: true },
      { title: '主人公の最初の台詞を書く', done: true },
      { title: '相手キャラの反応を書く', done: false },
      { title: 'シーン目的に戻って削る', done: false },
    ],
  },
  {
    id: 'scene-review',
    title: '第一話 導入シーン レビュー',
    lane: 'Review',
    progress: 70,
    source: 'Kanban_June',
    scenarioTarget: '天災魔法使い / chapter-1',
    note: '本文、Character DB、Title DBの反映漏れを見る。',
    todo: [
      { title: '本文ノートへ反映済み', done: true },
      { title: 'Character DBとの名前ゆれ確認', done: false },
      { title: 'Title DBの概要へ反映', done: false },
      { title: 'Report材料をまとめる', done: false },
    ],
  },
  {
    id: 'setup-character-insert',
    title: 'Character挿入ボタン追加',
    lane: 'Done',
    progress: 100,
    source: 'Note_Story',
    scenarioTarget: 'scenarioメモ / ノートブック',
    note: 'Character DBから選び、本文へ `名前：「」` を挿入できるようにした。',
    todo: [
      { title: 'scenarioメモへ追加', done: true },
      { title: 'ノートブック編集へ追加', done: true },
      { title: 'build確認', done: true },
      { title: '運用方針をScenario Boardへ反映', done: true },
    ],
  },
]

const LANES: Task['lane'][] = ['Inbox', 'Breakdown', 'Writing', 'Review', 'Done']
const LANE_LABELS: Record<Task['lane'], string> = {
  Inbox: '受注',
  Breakdown: '分解',
  Writing: '執筆',
  Review: '確認',
  Done: '完了',
}

const DOCS = [
  { id: 'plan', title: 'Plan', content: developmentPlan },
  { id: 'kanban', title: 'Kanban Source', content: kanban },
  { id: 'done', title: 'DONE', content: doneDefinition },
  { id: 'readme', title: 'Readme', content: readme },
]

const PageDevStudio: Component = () => {
  const [activeView, setActiveView] = createSignal<'board' | 'docs'>('board')
  const [activeDocId, setActiveDocId] = createSignal('plan')
  const [activeLane, setActiveLane] = createSignal<Task['lane']>('Inbox')
  const [touchStartX, setTouchStartX] = createSignal<number | null>(null)
  const activeDoc = createMemo(() => DOCS.find((doc) => doc.id === activeDocId()) ?? DOCS[0])
  const progress = createMemo(() => Math.round(TASKS.reduce((sum, task) => sum + task.progress, 0) / TASKS.length))
  const laneTaskCount = (lane: Task['lane']) => TASKS.filter((task) => task.lane === lane).length
  const moveLane = (direction: 1 | -1) => {
    const current = LANES.indexOf(activeLane())
    const next = Math.min(LANES.length - 1, Math.max(0, current + direction))
    setActiveLane(LANES[next])
  }
  const handleBoardTouchEnd = (event: TouchEvent) => {
    const start = touchStartX()
    const end = event.changedTouches[0]?.clientX
    setTouchStartX(null)
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) < 48) return
    moveLane(delta < 0 ? 1 : -1)
  }

  return (
    <div class="h-full bg-nacc-light overflow-hidden flex flex-col">
      <div class="devstudio-header px-6 py-4 bg-white border-b border-nacc-border shrink-0">
        <div class="devstudio-header-row flex items-center justify-between gap-4">
          <div class="devstudio-title-block">
            <h1 class="text-xl font-bold text-nacc-dark">Scenario Board</h1>
            <p class="text-xs text-gray-500 mt-1">Kanban_Juneから受けた親タスクを、シーン・キャラ・本文TODOへ分解する場所。</p>
          </div>
          <div class="devstudio-header-tools flex items-center gap-3">
            <div class="mode-pill">
              <button classList={{ active: activeView() === 'board' }} onClick={() => setActiveView('board')}>
                Board
              </button>
              <button classList={{ active: activeView() === 'docs' }} onClick={() => setActiveView('docs')}>
                Docs
              </button>
            </div>
            <div class="devstudio-progress w-72">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>Scenario Progress</span>
              <span class="font-semibold text-nacc-dark">{progress()}%</span>
            </div>
            <div class="h-2 rounded-full bg-nacc-light overflow-hidden">
              <div class="h-full bg-nacc-gold" style={{ width: `${progress()}%` }} />
            </div>
            </div>
          </div>
        </div>
      </div>

      <div class="devstudio-lane-tabs" classList={{ hidden: activeView() !== 'board' }}>
        <For each={LANES}>
          {(lane) => (
            <button
              type="button"
              classList={{ active: activeLane() === lane }}
              onClick={() => setActiveLane(lane)}
            >
              <span>{LANE_LABELS[lane]}</span>
              <small>{laneTaskCount(lane)}</small>
            </button>
          )}
        </For>
      </div>

      <div
        class="devstudio-board grid grid-cols-5 gap-3 p-4 flex-1 bg-[#fbfaf8] overflow-x-auto"
        classList={{ hidden: activeView() !== 'board' }}
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={handleBoardTouchEnd}
      >
        <For each={LANES}>
          {(lane) => (
            <section
              class="devstudio-lane min-w-44 bg-white border border-nacc-border rounded-xl p-3 overflow-y-auto"
              classList={{ active: activeLane() === lane }}
            >
              <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{LANE_LABELS[lane]}</h2>
              <div class="flex flex-col gap-2">
                <For each={TASKS.filter((task) => task.lane === lane)}>
                  {(task) => (
                    <article class="border border-nacc-border rounded-lg p-2 bg-[#fffdf9]">
                      <div class="text-sm font-semibold text-nacc-dark leading-snug">{task.title}</div>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <span class="text-[10px] rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.5">{task.source}</span>
                        <span class="text-[10px] rounded-full bg-[#f5f0e8] text-nacc-gold px-1.5 py-0.5">{task.scenarioTarget}</span>
                      </div>
                      <div class="text-[11px] text-gray-500 mt-1">{task.note}</div>
                      <div class="mt-2 flex flex-col gap-1">
                        <For each={task.todo}>
                          {(todo) => (
                            <label class="flex items-start gap-1.5 text-[11px] text-gray-600 leading-snug">
                              <input type="checkbox" class="mt-0.5 shrink-0" checked={todo.done} readOnly />
                              <span classList={{ 'line-through text-gray-300': todo.done }}>{todo.title}</span>
                            </label>
                          )}
                        </For>
                      </div>
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
