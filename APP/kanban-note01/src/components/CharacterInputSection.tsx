import { type Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js'

type CharacterSlot = {
  id: number
  name: string
  active: boolean
}

type Props = {
  onInsert: (name: string, options?: { fromLineEnd?: boolean; triggerMic?: boolean }) => void
}

const DEFAULT_SLOTS: CharacterSlot[] = [
  { id: 0, name: 'CharacterA', active: true },
  { id: 1, name: 'CharacterB', active: true },
  { id: 2, name: 'CharacterC', active: false },
  { id: 3, name: 'CharacterD', active: false },
]

const CharacterInputSection: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(true)
  const [slots, setSlots] = createSignal<CharacterSlot[]>(DEFAULT_SLOTS)
  const [micMode, setMicMode] = createSignal(false)

  onMount(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) return
      if (!['1', '2', '3', '4'].includes(event.key)) return
      const index = Number(event.key) - 1
      const slot = slots()[index]
      if (!slot?.active) return
      event.preventDefault()
      props.onInsert(slot.name, { fromLineEnd: true, triggerMic: micMode() })
    }
    window.addEventListener('keydown', handleKeydown)
    onCleanup(() => window.removeEventListener('keydown', handleKeydown))
  })

  function activateSlot(id: number) {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, active: true } : slot)))
  }

  function updateName(id: number, name: string) {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, name } : slot)))
  }

  return (
    <section class="rounded-xl border border-nacc-border bg-white shadow-sm overflow-hidden shrink-0">
      <button
        type="button"
        class="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[#f9f8f6] transition-colors"
        onClick={() => setOpen((value) => !value)}
      >
        <span class="text-sm font-bold text-nacc-dark">Character入力{open() ? '▶' : '▽'}</span>
        <span class="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            class="rounded-full border px-2 py-0.5 text-[11px] font-bold"
            classList={{
              'border-blue-600 bg-blue-600 text-white': micMode(),
              'border-nacc-border bg-white text-gray-400': !micMode(),
            }}
            onClick={(event) => {
              event.stopPropagation()
              setMicMode((value) => !value)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              event.stopPropagation()
              setMicMode((value) => !value)
            }}
            title="キャラ挿入後にAlt+Dを送る"
          >
            MODEMIC
          </span>
          <span class="text-xs text-gray-400">{open() ? '閉じる' : '開く'}</span>
        </span>
      </button>

      <Show when={open()}>
        <div class="border-t border-nacc-border p-3 overflow-x-auto">
          <div class="grid grid-cols-4 gap-2 min-w-[620px]">
            <For each={slots()}>
              {(slot) => (
                <Show
                  when={slot.active}
                  fallback={
                    <button
                      type="button"
                      class="min-h-28 rounded-xl border border-dashed border-nacc-border bg-nacc-light text-2xl font-bold text-gray-300 hover:border-nacc-gold hover:text-nacc-gold transition-colors"
                      onClick={() => activateSlot(slot.id)}
                      title="Character枠を追加"
                    >
                      +
                    </button>
                  }
                >
                  <div class="min-h-28 rounded-xl border border-nacc-border bg-[#fffdf9] p-2 flex flex-col gap-2">
                    <input
                      class="w-full rounded-lg border border-nacc-border bg-white px-2 py-1.5 text-sm font-semibold text-nacc-dark outline-none focus:border-nacc-gold"
                      value={slot.name}
                      onInput={(event) => updateName(slot.id, event.currentTarget.value)}
                    />
                    <button
                      type="button"
                      class="mt-auto rounded-lg bg-[#8a5b29] px-2 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#70481f] active:scale-[.99]"
                      onClick={() => props.onInsert(slot.name, { triggerMic: micMode() })}
                    >
                      挿入
                    </button>
                  </div>
                </Show>
              )}
            </For>
          </div>
        </div>
      </Show>
    </section>
  )
}

export default CharacterInputSection
