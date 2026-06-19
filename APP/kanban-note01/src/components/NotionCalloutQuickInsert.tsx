import { type Component, createMemo, createSignal } from 'solid-js'
import { type CalloutKind, formatCallout } from '../utils/calloutFormat'

type Props = {
  open: boolean
  onClose: () => void
  onInsert: (text: string) => void
}

type Preset = {
  kind: CalloutKind
  emoji: string
  label: string
  title: string
  body: string
}

const PRESETS: Preset[] = [
  {
    kind: 'pillar',
    emoji: '💬',
    label: 'Scene',
    title: 'Scene / Event',
    body: 'Sceneやイベントの柱を書く',
  },
  {
    kind: 'memo',
    emoji: '📝',
    label: 'Memo',
    title: '補足メモ',
    body: '物語の補足やメモを書く',
  },
  {
    kind: 'idea',
    emoji: '💡',
    label: 'IdeaBoard',
    title: 'IdeaBoard',
    body: 'あとで回収したいアイディアを書く',
  },
]

const NotionCalloutQuickInsert: Component<Props> = (props) => {
  const [presetIndex, setPresetIndex] = createSignal(0)
  const [title, setTitle] = createSignal('')
  const [body, setBody] = createSignal('')
  const [tags, setTags] = createSignal('')
  const preset = createMemo(() => PRESETS[presetIndex()])

  function cyclePreset() {
    setPresetIndex((index) => (index + 1) % PRESETS.length)
  }

  function insert() {
    const current = preset()
    props.onInsert(formatCallout({
      kind: current.kind,
      emoji: current.emoji,
      title: title() || current.title,
      body: body() || current.body,
      tags: tags(),
    }))
    setTitle('')
    setBody('')
    setTags('')
    props.onClose()
  }

  return (
    <div classList={{ hidden: !props.open }}>
      <div class="fixed inset-0 z-70 bg-black/30" onClick={props.onClose} />
      <div
        class="fixed left-1/2 top-20 z-80 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-nacc-border bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div class="flex items-center justify-between gap-3 border-b border-nacc-border px-4 py-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 w-9 rounded-full border border-nacc-border bg-nacc-light text-lg hover:border-nacc-gold"
              onClick={cyclePreset}
              title="アイコンとコールアウト種類を切り替え"
            >
              {preset().emoji}
            </button>
            <div>
              <div class="text-sm font-bold text-nacc-dark">Notion Callout</div>
              <div class="text-xs text-gray-400">{preset().label} · Alt+H</div>
            </div>
          </div>
          <button class="text-xs text-gray-400 hover:text-gray-600" onClick={props.onClose}>閉じる</button>
        </div>
        <div class="flex flex-col gap-2 p-4">
          <input
            class="rounded-lg border border-nacc-border bg-white px-3 py-2 text-sm font-semibold text-nacc-dark outline-none focus:border-nacc-gold"
            placeholder={preset().title}
            value={title()}
            onInput={(event) => setTitle(event.currentTarget.value)}
          />
          <textarea
            class="min-h-24 resize-none rounded-lg border border-nacc-border bg-white px-3 py-2 text-sm text-nacc-dark outline-none focus:border-nacc-gold"
            placeholder={preset().body}
            value={body()}
            onInput={(event) => setBody(event.currentTarget.value)}
          />
          <input
            class="rounded-lg border border-nacc-border bg-white px-3 py-2 text-xs text-nacc-dark outline-none focus:border-nacc-gold"
            placeholder="TitleTag / special tag"
            value={tags()}
            onInput={(event) => setTags(event.currentTarget.value)}
          />
          <div class="flex items-center justify-between gap-3 pt-1">
            <div
              class="rounded-lg border bg-[#fffdf9] px-3 py-2 text-xs text-gray-500"
              classList={{
                'border-l-8 border-l-blue-600': preset().kind === 'pillar',
                'border-l-8 border-l-[#b38247]': preset().kind === 'memo',
                'border-l-8 border-l-violet-600': preset().kind === 'idea',
              }}
            >
              {preset().emoji} {title() || preset().title}
            </div>
            <button
              class="rounded-lg bg-[#8a5b29] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#70481f]"
              onClick={insert}
            >
              挿入
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotionCalloutQuickInsert
