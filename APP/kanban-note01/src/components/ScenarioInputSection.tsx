import { type Component } from 'solid-js'
import { type ScenarioBlockKind } from '../utils/scenarioFormat'

type Props = {
  onInsert: (kind: ScenarioBlockKind) => void
}

const ScenarioInputSection: Component<Props> = (props) => {
  return (
    <section class="rounded-xl border border-nacc-border bg-[#fffdf9] shadow-sm p-3 shrink-0">
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="rounded-lg border border-[#b88748] bg-[#8a5b29] px-3 py-2 text-left text-white shadow-sm active:scale-[.99]"
          onClick={() => props.onInsert('pillar')}
        >
          <span class="block text-sm font-black">柱</span>
          <span class="block text-[11px] font-semibold opacity-80">Scene / Event</span>
        </button>
        <button
          type="button"
          class="rounded-lg border border-[#64748b] bg-[#334155] px-3 py-2 text-left text-white shadow-sm active:scale-[.99]"
          onClick={() => props.onInsert('direction')}
        >
          <span class="block text-sm font-black">ト</span>
          <span class="block text-[11px] font-semibold opacity-80">情景 / 動作</span>
        </button>
        <button
          type="button"
          class="rounded-lg border border-[#1d4ed8] bg-[#1e3a8a] px-3 py-2 text-left text-white shadow-sm active:scale-[.99]"
          onClick={() => props.onInsert('dialogue')}
        >
          <span class="block text-sm font-black">セリフ</span>
          <span class="block text-[11px] font-semibold opacity-80">名前：「」</span>
        </button>
      </div>
    </section>
  )
}

export default ScenarioInputSection
