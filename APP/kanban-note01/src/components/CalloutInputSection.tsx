import { type Component, createSignal } from 'solid-js'
import { type CalloutDraft, type CalloutKind, formatCallout } from '../utils/calloutFormat'

type Props = {
  onInsert: (text: string) => void
}

const EMOJI_OPTIONS = ['🧱', '🎬', '📝', '💡', '📌', '⚠️', '🌱']

const KIND_LABELS: Record<CalloutKind, string> = {
  pillar: '柱 / Scene',
  memo: '補足メモ',
  idea: 'IdeaBoard',
}

const DEFAULT_EMOJI: Record<CalloutKind, string> = {
  pillar: '🧱',
  memo: '📝',
  idea: '💡',
}

const CalloutInputSection: Component<Props> = (props) => {
  const [kind, setKind] = createSignal<CalloutKind>('pillar')
  const [emoji, setEmoji] = createSignal(DEFAULT_EMOJI.pillar)
  const [title, setTitle] = createSignal('')
  const [tags, setTags] = createSignal('')

  function changeKind(nextKind: CalloutKind) {
    setKind(nextKind)
    setEmoji(DEFAULT_EMOJI[nextKind])
  }

  function insertCallout() {
    const draft: CalloutDraft = {
      kind: kind(),
      emoji: emoji(),
      title: title(),
      tags: tags(),
    }
    props.onInsert(formatCallout(draft))
    setTitle('')
    setTags('')
  }

  return (
    <section class="rounded-xl border border-nacc-border bg-white shadow-sm p-3 shrink-0">
      <div class="flex flex-wrap items-center gap-2">
        <select
          class="rounded-lg border border-nacc-border bg-white px-2 py-1.5 text-xs font-semibold text-nacc-dark outline-none"
          value={kind()}
          onChange={(event) => changeKind(event.currentTarget.value as CalloutKind)}
        >
          <option value="pillar">{KIND_LABELS.pillar}</option>
          <option value="memo">{KIND_LABELS.memo}</option>
          <option value="idea">{KIND_LABELS.idea}</option>
        </select>
        <select
          class="rounded-lg border border-nacc-border bg-white px-2 py-1.5 text-xs font-semibold text-nacc-dark outline-none"
          value={emoji()}
          onChange={(event) => setEmoji(event.currentTarget.value)}
          aria-label="コールアウト絵文字"
        >
          {EMOJI_OPTIONS.map((item) => <option value={item}>{item}</option>)}
        </select>
        <input
          class="min-w-40 flex-1 rounded-lg border border-nacc-border bg-white px-2 py-1.5 text-xs text-nacc-dark outline-none focus:border-nacc-gold"
          placeholder={kind() === 'pillar' ? 'Scene / Event名' : kind() === 'idea' ? 'IdeaBoardタイトル' : '補足タイトル'}
          value={title()}
          onInput={(event) => setTitle(event.currentTarget.value)}
        />
        <input
          class="w-36 rounded-lg border border-nacc-border bg-white px-2 py-1.5 text-xs text-nacc-dark outline-none focus:border-nacc-gold"
          placeholder="TitleTag"
          value={tags()}
          onInput={(event) => setTags(event.currentTarget.value)}
        />
        <button
          type="button"
          class="rounded-lg bg-[#8a5b29] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#70481f] active:scale-[.99]"
          onClick={insertCallout}
        >
          Callout
        </button>
      </div>
    </section>
  )
}

export default CalloutInputSection
