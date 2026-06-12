import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import { state, setState } from '../store'

type IngredientRow = {
  name: string
  products: { id: string; name: string; category: string }[]
}

const PageDb03: Component = () => {
  const [search, setSearch] = createSignal('')
  const [selectedName, setSelectedName] = createSignal<string | null>(null)

  const ingredientRows = createMemo<IngredientRow[]>(() => {
    const map = new Map<string, { id: string; name: string; category: string }[]>()
    for (const product of state.products) {
      for (const ing of product.ingredients) {
        const trimmed = ing.trim()
        if (!trimmed) continue
        if (!map.has(trimmed)) map.set(trimmed, [])
        map.get(trimmed)!.push({ id: product.id, name: product.name, category: product.category })
      }
    }
    return Array.from(map.entries())
      .map(([name, products]) => ({ name, products }))
      .sort((a, b) => b.products.length - a.products.length)
  })

  const filtered = createMemo(() => {
    const q = search().trim().toLowerCase()
    if (!q) return ingredientRows()
    return ingredientRows().filter((r) => r.name.toLowerCase().includes(q))
  })

  const selectedRow = createMemo(() =>
    ingredientRows().find((r) => r.name === selectedName())
  )

  const visibleCols = () => state.db03Columns.filter((c) => c.visible)

  return (
    <div class="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div class="px-6 pt-4 pb-3 bg-nacc-light flex items-start justify-between shrink-0">
        <div>
          <h1 class="text-xl font-bold text-nacc-dark">DB03 — Relation</h1>
          <div class="text-xs text-gray-500 mt-0.5">
            Note同士のRelation Keyデータベース ·{' '}
            <span class="font-medium">{ingredientRows().length}種類</span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-nacc-border rounded-lg bg-white hover:bg-gray-50 transition-colors"
            onClick={() => setState({ settingsPanelOpen: true, galleryPanelOpen: false })}
          >
            ⚙ カラム設定
          </button>
        </div>
      </div>

      {/* Search */}
      <div class="px-6 py-2.5 border-b border-nacc-border bg-white shrink-0">
        <input
          type="search"
          placeholder="Relation Keyを検索..."
          class="w-full max-w-sm px-3 py-1.5 text-xs rounded-lg border border-nacc-border bg-nacc-light outline-none focus:border-nacc-gold"
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      {/* Content: Table + optional side panel */}
      <div class="flex flex-1 overflow-hidden">
        {/* Table */}
        <div class="flex-1 overflow-auto px-6 py-4">
          <div class="bg-white rounded-xl border border-nacc-border overflow-hidden">
            {/* Header */}
            <div class="flex border-b border-nacc-border bg-nacc-light sticky top-0 z-10">
              <For each={visibleCols()}>
                {(col) => (
                  <div class="notion-cell flex-1 px-3 py-2 text-xs font-semibold text-gray-500">
                    {col.label}
                  </div>
                )}
              </For>
              <div class="w-8 shrink-0" />
            </div>

            {/* Rows */}
            <For each={filtered()}>
              {(row) => {
                const typeCounts = () => Array.from(
                  row.products.reduce((map, product) => {
                    const type = product.category || 'note'
                    map.set(type, (map.get(type) ?? 0) + 1)
                    return map
                  }, new Map<string, number>())
                )

                return (
                  <div
                    class="notion-row flex border-b border-nacc-border last:border-none cursor-pointer transition-colors"
                    classList={{
                      'bg-[#f5f0e8]':    selectedName() === row.name,
                      'hover:bg-[#fafafa]': selectedName() !== row.name,
                    }}
                    onClick={() => setSelectedName(row.name === selectedName() ? null : row.name)}
                  >
                    <For each={visibleCols()}>
                      {(col) => {
                        switch (col.id) {
                          case 'name':
                            return (
                              <div class="notion-cell flex-1 px-3 py-2.5 text-xs font-medium text-nacc-dark">
                                {row.name}
                              </div>
                            )
                          case 'products':
                            return (
                              <div class="notion-cell flex-1 px-3 py-2.5 flex items-center gap-1.5">
                                <span class="text-sm font-bold text-nacc-dark">{row.products.length}</span>
                                <span class="text-xs text-gray-400">件</span>
                              </div>
                            )
                          case 'category':
                            return (
                              <div class="notion-cell flex-1 px-3 py-2.5 flex items-center gap-1.5">
                                <For each={typeCounts()}>
                                  {([type, count]) => (
                                    <span class="text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5">
                                      {type} {count}
                                    </span>
                                  )}
                                </For>
                              </div>
                            )
                          default:
                            return <div class="notion-cell flex-1 px-3 py-2.5 text-xs text-gray-400">—</div>
                        }
                      }}
                    </For>
                    <div class="w-8 shrink-0" />
                  </div>
                )
              }}
            </For>

            <Show when={filtered().length === 0}>
              <div class="px-6 py-10 text-center text-xs text-gray-300">
                一致するRelation Keyが見つかりません
              </div>
            </Show>
          </div>
        </div>

        {/* Side detail panel */}
        <Show when={selectedRow()}>
          {(row) => (
            <div class="w-72 shrink-0 border-l border-nacc-border bg-nacc-light overflow-y-auto flex flex-col">
              <div class="flex items-center justify-between px-4 py-3 border-b border-nacc-border bg-white shrink-0">
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-400 mb-0.5">Relation Key</p>
                  <h2 class="text-sm font-bold text-nacc-dark truncate">{row().name}</h2>
                </div>
                <button
                  class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs shrink-0 ml-2"
                  onClick={() => setSelectedName(null)}
                >
                  ✕
                </button>
              </div>

              <div class="p-4 flex-1">
                <p class="text-xs text-gray-500 mb-3 font-medium">
                  {row().products.length}件のNoteにリンクされています
                </p>

                <div class="flex flex-col gap-1.5">
                  <For each={row().products}>
                    {(p) => (
                      <div class="flex items-center gap-2 bg-white rounded-lg border border-nacc-border px-3 py-2">
                        <span class="text-xs text-nacc-dark font-medium leading-tight flex-1 min-w-0 truncate">
                          {p.name}
                        </span>
                        <span class="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                          {p.category || 'note'}
                        </span>
                        <span class="text-xs text-gray-400 shrink-0">{p.id}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}

export default PageDb03
