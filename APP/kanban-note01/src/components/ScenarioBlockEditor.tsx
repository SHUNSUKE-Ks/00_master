import { type Component, Index, Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { joinTextBlocks, splitTextBlocks, type BlockCursor } from '../utils/blockText'
import type { ScenarioBlockKind } from '../utils/scenarioFormat'

type Props = {
  value: string
  cursor?: BlockCursor
  onChange: (value: string) => void
  onCursorChange?: (cursor: BlockCursor) => void
  onScenarioShortcut?: (kind: ScenarioBlockKind) => void
  onSpeakerClick?: (blockIndex: number) => void
  onCharacterShortcut?: (blockIndex: number, slotIndex: number) => void
  characterOptions?: Array<{ name: string; description?: string }>
  onCharacterSelect?: (blockIndex: number, name: string) => void
}

function readSpeaker(block: string) {
  const dialogue = block.match(/^(.+?)\s*：「([\s\S]*?)」?$/)
  if (dialogue) return { type: 'dialogue' as const, name: dialogue[1].trim(), body: dialogue[2] }
  const label = block.match(/^(柱|ト)：([\s\S]*)$/)
  if (label) return { type: 'label' as const, name: label[1], body: label[2] }
  return { type: 'text' as const, name: 'text', body: block }
}

const ScenarioBlockEditor: Component<Props> = (props) => {
  const [activeIndex, setActiveIndex] = createSignal(0)
  const [localPickerIndex, setLocalPickerIndex] = createSignal<number | null>(null)
  const refs: Array<HTMLTextAreaElement | undefined> = []

  const blocks = () => splitTextBlocks(props.value)

  createEffect(() => {
    const max = Math.max(blocks().length - 1, 0)
    if (activeIndex() > max) setActiveIndex(max)
  })

  createEffect(() => {
    if (!props.cursor) return
    const max = Math.max(blocks().length - 1, 0)
    setActiveIndex(Math.min(Math.max(props.cursor.blockIndex, 0), max))
  })

  function focusBlock(index: number, cursor?: number) {
    const nextIndex = Math.min(Math.max(index, 0), Math.max(blocks().length - 1, 0))
    setActiveIndex(nextIndex)
    queueMicrotask(() => {
      const textarea = refs[nextIndex]
      textarea?.focus()
      const nextCursor = cursor ?? textarea?.value.length ?? 0
      textarea?.setSelectionRange(nextCursor, nextCursor)
      props.onCursorChange?.({ blockIndex: nextIndex, cursor: nextCursor })
    })
  }

  function patchBlock(index: number, value: string) {
    const next = blocks().map((block, i) => (i === index ? value : block))
    props.onChange(joinTextBlocks(next))
  }

  function patchBlockText(index: number, text: string) {
    const block = blocks()[index] ?? ''
    const speaker = readSpeaker(block)
    if (speaker.type === 'dialogue') {
      patchBlock(index, `${speaker.name}：「${text}」`)
      return
    }
    if (speaker.type === 'label') {
      patchBlock(index, `${speaker.name}：${text}`)
      return
    }
    patchBlock(index, text)
  }

  function insertBlockAfter(index: number) {
    const next = blocks()
    next.splice(index + 1, 0, '')
    const nextIndex = index + 1
    props.onChange(joinTextBlocks(next))
    setActiveIndex(nextIndex)
    props.onCursorChange?.({ blockIndex: nextIndex, cursor: 0 })
    window.setTimeout(() => {
      const textarea = refs[nextIndex]
      textarea?.focus()
      textarea?.setSelectionRange(0, 0)
    }, 0)
  }

  function moveSelection(delta: number) {
    focusBlock(activeIndex() + delta)
  }

  function handleKeyDown(index: number, event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (event.isComposing) return
    const key = event.key.toLowerCase()
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      insertBlockAfter(index)
      return
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault()
        props.onCharacterShortcut?.(index, Number(event.key) - 1)
        return
      }

      const shortcuts: Record<string, ScenarioBlockKind | undefined> = {
        e: 'event',
        q: 'quest',
        c: 'choice',
        w: 'world',
        s: 'system',
      }
      const kind = shortcuts[key]
      if (kind) {
        event.preventDefault()
        props.onScenarioShortcut?.(kind)
        return
      }
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(-1)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveSelection(1)
      return
    }
    if (event.altKey && key === 'q') {
      event.preventDefault()
      moveSelection(-1)
      return
    }
    if (event.altKey && key === 'e') {
      event.preventDefault()
      insertBlockAfter(index)
    }
  }

  function syncCursor(index: number, textarea: HTMLTextAreaElement) {
    setActiveIndex(index)
    props.onCursorChange?.({ blockIndex: index, cursor: textarea.selectionStart })
  }

  onCleanup(() => refs.splice(0, refs.length))

  return (
    <section class="scenario-log-editor flex-1 min-h-0 overflow-y-auto rounded-xl border border-nacc-border bg-[#15120f] px-3 py-4 shadow-sm">
      <Index each={blocks()}>
        {(block, index) => {
          const speaker = () => readSpeaker(block())
          return (
            <div
              class="scenario-line-block"
              classList={{ active: activeIndex() === index }}
              onPointerDown={() => setActiveIndex(index)}
            >
              <div class="scenario-line-rail">
                <button type="button" class="scenario-speaker-icon" title="voice slot">▸</button>
              </div>
              <div class="scenario-line-content">
                <button
                  type="button"
                  class="scenario-line-name"
                  onClick={() => {
                    if (props.characterOptions?.length) {
                      setLocalPickerIndex(localPickerIndex() === index ? null : index)
                      return
                    }
                    props.onSpeakerClick?.(index)
                  }}
                  title="Characterを選択"
                >
                  {speaker().name}
                </button>
                <Show when={localPickerIndex() === index && props.characterOptions?.length}>
                  <div class="scenario-inline-character-picker">
                    <Index each={(props.characterOptions ?? []).slice(0, 12)}>
                      {(character) => (
                        <button
                          type="button"
                          onClick={() => {
                            props.onCharacterSelect?.(index, character().name)
                            setLocalPickerIndex(null)
                          }}
                        >
                          <span>{character().name.replace(/\s+Characters?$/i, '').trim() || character().name}</span>
                          <small>{character().description}</small>
                        </button>
                      )}
                    </Index>
                  </div>
                </Show>
                <textarea
                  ref={(el) => { refs[index] = el }}
                  class="scenario-line-text"
                  rows={3}
                  value={speaker().body}
                  onInput={(event) => patchBlockText(index, event.currentTarget.value)}
                  onFocus={(event) => syncCursor(index, event.currentTarget)}
                  onClick={(event) => syncCursor(index, event.currentTarget)}
                  onKeyUp={(event) => syncCursor(index, event.currentTarget)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                />
                <button
                  type="button"
                  class="scenario-add-block-btn"
                  onClick={() => insertBlockAfter(index)}
                  title="下にText blockを追加"
                >
                  +
                </button>
              </div>
            </div>
          )
        }}
      </Index>
    </section>
  )
}

export default ScenarioBlockEditor
