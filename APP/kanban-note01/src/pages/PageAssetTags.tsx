import { type Component, createMemo, createSignal, For, onMount, Show } from 'solid-js'
import {
  ASSET_TAG_SCOPES,
  createDraftAssetTag,
  downloadAssetTagJson,
  loadAssetTags,
  saveAssetTags,
  type AssetTag,
  type AssetTagScope,
  type AssetTagStatus,
} from '../dataBridge/assetTagDb'

const STATUS_LABEL: Record<AssetTagStatus, string> = {
  active: '使用中',
  review: '整理候補',
  hidden: '非表示',
}

const STATUS_CLASS: Record<AssetTagStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20',
  review: 'bg-amber-500/15 text-amber-200 border-amber-400/20',
  hidden: 'bg-zinc-500/15 text-zinc-300 border-zinc-400/20',
}

function logAssetTag(actionId: string, label: string, detail?: unknown) {
  console.log(`[APP04-ASSETTAGDB] ${actionId} ${label}`, detail ?? '')
}

const PageAssetTags: Component = () => {
  const [tags, setTags] = createSignal<AssetTag[]>([])
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [scopeFilters, setScopeFilters] = createSignal<AssetTagScope[]>([])

  onMount(() => {
    const loaded = loadAssetTags()
    setTags(loaded)
    setSelectedId(loaded[0]?.id ?? null)
  })

  const selectedTag = createMemo(() => tags().find((tag) => tag.id === selectedId()) ?? tags()[0])
  const filteredTags = createMemo(() => {
    const filters = scopeFilters()
    if (filters.length === 0) return tags()
    return tags().filter((tag) => filters.every((scope) => tag.scopes.includes(scope)))
  })
  const activeCount = () => tags().filter((tag) => tag.status === 'active').length
  const reviewCount = () => tags().filter((tag) => tag.status !== 'active').length

  function persist(next: AssetTag[]) {
    setTags(next)
    saveAssetTags(next)
  }

  function patchTag(id: string, patch: Partial<AssetTag>) {
    const now = new Date().toISOString()
    persist(tags().map((tag) => tag.id === id ? { ...tag, ...patch, updatedAt: now } : tag))
  }

  function addTag() {
    const tag = createDraftAssetTag()
    persist([tag, ...tags()])
    setSelectedId(tag.id)
    logAssetTag('8-1', 'Create tag', { tagId: tag.id })
  }

  function exportJson() {
    downloadAssetTagJson(tags())
    logAssetTag('8-2', 'Export schema', { count: tags().length })
  }

  function toggleScopeFilter(scope: AssetTagScope) {
    setScopeFilters((prev) =>
      prev.includes(scope) ? prev.filter((item) => item !== scope) : [...prev, scope]
    )
    logAssetTag('8-3', 'Scope filter', { scope })
  }

  function toggleTagScope(tag: AssetTag, scope: AssetTagScope) {
    const nextScopes = tag.scopes.includes(scope)
      ? tag.scopes.filter((item) => item !== scope)
      : [...tag.scopes, scope]
    patchTag(tag.id, { scopes: nextScopes.length ? nextScopes : ['Gallery'] })
  }

  return (
    <div class="h-full overflow-hidden bg-[#151515] text-zinc-100">
      <div class="flex h-full flex-col">
        <header class="shrink-0 border-b border-white/10 bg-[#202020] px-4 py-3">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-400 text-xs font-black text-white shadow-lg shadow-sky-950/40">
              DB
            </div>
            <div class="min-w-0">
              <h1 class="text-base font-bold leading-tight">Asset Tag DB</h1>
              <p class="text-xs text-zinc-400">NovelEngine / Gallery / Noteで共通利用する画像アセットタグ</p>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <button
                class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:bg-white/10 active:scale-95"
                onClick={addTag}
              >
                + 新規Tag
              </button>
              <button
                class="rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-400 active:scale-95"
                onClick={exportJson}
              >
                JSON
              </button>
            </div>
          </div>
        </header>

        <main class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[280px_1fr_320px]">
          <aside class="border-b border-white/10 bg-[#1b1b1b] p-4 xl:border-b-0 xl:border-r">
            <div class="grid grid-cols-2 gap-2 xl:grid-cols-1">
              <div class="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p class="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Active</p>
                <p class="mt-1 text-2xl font-black">{activeCount()}</p>
              </div>
              <div class="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p class="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Review</p>
                <p class="mt-1 text-2xl font-black">{reviewCount()}</p>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <p class="text-xs font-bold text-zinc-400">Scope Filter</p>
              <For each={ASSET_TAG_SCOPES}>
                {(scope) => {
                  const selected = () => scopeFilters().includes(scope)
                  return (
                    <button
                      class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition"
                      classList={{
                        'bg-sky-500 text-white': selected(),
                        'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]': !selected(),
                      }}
                      onClick={() => toggleScopeFilter(scope)}
                    >
                      <span>{scope}</span>
                      <span class={selected() ? 'text-white/75' : 'text-zinc-500'}>multi</span>
                    </button>
                  )
                }}
              </For>
            </div>
          </aside>

          <section class="min-h-0 overflow-y-auto p-3 sm:p-4">
            <div class="overflow-hidden rounded-xl border border-white/10 bg-[#202020]">
              <div class="grid grid-cols-[1.2fr_.75fr_.9fr_.7fr] border-b border-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                <span>日本語ラベル</span>
                <span>Group</span>
                <span>Apps</span>
                <span>Status</span>
              </div>
              <For each={filteredTags()}>
                {(tag) => (
                  <button
                    class="grid w-full grid-cols-[1.2fr_.75fr_.9fr_.7fr] items-center gap-2 border-b border-white/5 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.04]"
                    classList={{ 'bg-sky-500/10': selectedId() === tag.id }}
                    onClick={() => {
                      setSelectedId(tag.id)
                      logAssetTag('8-4', 'Open asset tag detail', { tagId: tag.id })
                    }}
                  >
                    <div class="min-w-0">
                      <p class="truncate text-sm font-bold text-zinc-100">{tag.labelJa}</p>
                      <p class="truncate text-xs text-zinc-500">{tag.labelEn}</p>
                    </div>
                    <span class="truncate text-xs font-semibold text-zinc-300">{tag.group}</span>
                    <div class="flex flex-wrap gap-1">
                      <For each={tag.scopes}>
                        {(scope) => <span class="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-zinc-300">{scope}</span>}
                      </For>
                    </div>
                    <span class={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[tag.status]}`}>
                      {STATUS_LABEL[tag.status]}
                    </span>
                  </button>
                )}
              </For>
            </div>

            <div class="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4">
              <p class="text-sm font-bold">次Phaseの接続メモ</p>
              <p class="mt-1 text-xs leading-relaxed text-zinc-400">
                画像URL/ローカル参照、pinId、日本語ラベル、タグ、プロンプト、参照元URLをここへ接続する。
                Title DBはScenario用として維持し、Asset Tag DBは画像アセット専用DBに分ける。
              </p>
            </div>
          </section>

          <aside class="min-h-0 overflow-y-auto border-t border-white/10 bg-[#1b1b1b] p-4 xl:border-l xl:border-t-0">
            <Show when={selectedTag()} fallback={<p class="text-sm text-zinc-500">タグを選択してください</p>}>
              {(tagAccessor) => {
                const tag = () => tagAccessor()
                return (
                  <div class="space-y-4">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">Detail</p>
                      <input
                        class="mt-2 w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-sky-400"
                        value={tag().labelJa}
                        onInput={(event) => patchTag(tag().id, { labelJa: event.currentTarget.value })}
                      />
                      <input
                        class="mt-2 w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-sky-400"
                        value={tag().labelEn}
                        onInput={(event) => patchTag(tag().id, { labelEn: event.currentTarget.value })}
                      />
                    </div>

                    <div>
                      <p class="text-xs font-bold text-zinc-400">Group</p>
                      <input
                        class="mt-2 w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-sky-400"
                        value={tag().group}
                        onInput={(event) => patchTag(tag().id, { group: event.currentTarget.value })}
                      />
                    </div>

                    <div>
                      <p class="text-xs font-bold text-zinc-400">Status</p>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <For each={Object.keys(STATUS_LABEL) as AssetTagStatus[]}>
                          {(status) => (
                            <button
                              class={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${tag().status === status ? STATUS_CLASS[status] : 'border-white/10 bg-white/[0.04] text-zinc-400'}`}
                              onClick={() => patchTag(tag().id, { status })}
                            >
                              {STATUS_LABEL[status]}
                            </button>
                          )}
                        </For>
                      </div>
                    </div>

                    <div>
                      <p class="text-xs font-bold text-zinc-400">Apps</p>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <For each={ASSET_TAG_SCOPES}>
                          {(scope) => (
                            <button
                              class="rounded-full px-3 py-1.5 text-xs font-bold transition"
                              classList={{
                                'bg-sky-500 text-white': tag().scopes.includes(scope),
                                'bg-white/[0.04] text-zinc-400': !tag().scopes.includes(scope),
                              }}
                              onClick={() => toggleTagScope(tag(), scope)}
                            >
                              {scope}
                            </button>
                          )}
                        </For>
                      </div>
                    </div>

                    <div>
                      <p class="text-xs font-bold text-zinc-400">Description</p>
                      <textarea
                        class="mt-2 min-h-28 w-full resize-none rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs leading-relaxed text-zinc-300 outline-none focus:border-sky-400"
                        value={tag().description}
                        onInput={(event) => patchTag(tag().id, { description: event.currentTarget.value })}
                      />
                    </div>
                  </div>
                )
              }}
            </Show>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default PageAssetTags
