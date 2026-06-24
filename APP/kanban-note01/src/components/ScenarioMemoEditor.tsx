import { type Component, Index, Show, createEffect } from 'solid-js'

type Props = {
  value: string
  onChange: (value: string) => void
  variant?: 'plain' | 'stepper'
  insertRequest?: { id: number; text: string } | null
  logKeys?: string[]
  onOpenLog?: (meta: { key: string; title: string; level: 2 | 3; index: number }) => void
}

function headingLevel(line: string) {
  const match = line.match(/^(#{1,3})\s+(.*)$/)
  return match ? match[1].length : 0
}

function lineText(line: string) {
  return line.replace(/^#{1,3}\s+/, '')
}

function lineRows(text: string, level: number) {
  if (level) return 1
  return Math.max(1, Math.min(6, text.split('\n').length))
}

function withHeading(text: string, level: number) {
  const clean = text.replace(/^#{1,3}\s+/, '')
  return level > 0 ? `${'#'.repeat(level)} ${clean}` : clean
}

function logKey(index: number, level: number, title: string) {
  const slug = title.trim().replace(/\s+/g, '-').replace(/[\\/:*?"<>|#{}[\]]/g, '_') || 'untitled'
  return `heading-${index}-h${level}-${slug}`
}

const ScenarioMemoEditor: Component<Props> = (props) => {
  let refs: Array<HTMLTextAreaElement | undefined> = []
  let activeIndex = 0
  let activeCursor = 0
  const lines = () => (props.value === '' ? [''] : props.value.split('\n'))

  function commit(nextLines: string[]) {
    props.onChange(nextLines.join('\n'))
  }

  function patchLine(index: number, text: string) {
    const next = [...lines()]
    next[index] = withHeading(text, headingLevel(next[index] ?? ''))
    commit(next)
  }

  function setLineHeading(index: number, level: number) {
    const next = [...lines()]
    const current = next[index] ?? ''
    next[index] = withHeading(lineText(current), headingLevel(current) === level ? 0 : level)
    commit(next)
    queueMicrotask(() => refs[index]?.focus())
  }

  function shiftLineHeading(index: number, delta: number) {
    const next = [...lines()]
    const current = next[index] ?? ''
    const nextLevel = Math.min(3, Math.max(0, headingLevel(current) + delta))
    next[index] = withHeading(lineText(current), nextLevel)
    commit(next)
    queueMicrotask(() => refs[index]?.focus())
  }

  function insertLineAfter(index: number) {
    const next = [...lines()]
    next.splice(index + 1, 0, '')
    commit(next)
    queueMicrotask(() => refs[index + 1]?.focus())
  }

  function removeEmptyLine(index: number) {
    const next = [...lines()]
    if (next.length <= 1 || lineText(next[index] ?? '') !== '') return
    next.splice(index, 1)
    commit(next)
    queueMicrotask(() => refs[Math.max(0, index - 1)]?.focus())
  }

  function visualNumber(index: number) {
    return lines().slice(0, index + 1).filter((line) => headingLevel(line) === 0).length
  }

  function insertSymbol(text: string) {
    const next = [...lines()]
    const index = Math.min(Math.max(activeIndex, 0), next.length - 1)
    const current = lineText(next[index] ?? '')
    const level = headingLevel(next[index] ?? '')
    const cursor = Math.min(Math.max(activeCursor, 0), current.length)
    const nextText = `${current.slice(0, cursor)}${text}${current.slice(cursor)}`
    next[index] = withHeading(nextText, level)
    commit(next)
    queueMicrotask(() => {
      const textarea = refs[index]
      textarea?.focus()
      const nextCursor = cursor + text.length
      textarea?.setSelectionRange(nextCursor, nextCursor)
      activeCursor = nextCursor
    })
  }

  createEffect(() => {
    const request = props.insertRequest
    if (!request) return
    insertSymbol(request.text)
  })

  return (
    <section class={props.variant === 'stepper' ? 'scenario-stepper-editor' : 'scenario-memo-editor'}>
      <Index each={lines()}>
        {(line, index) => {
          const level = () => headingLevel(line())
          const key = () => logKey(index, level(), lineText(line()))
          const canOpenLog = () => props.variant === 'stepper' && (level() === 2 || level() === 3) && lineText(line()).trim() !== ''
          return (
            <div class="scenario-stepper-row" classList={{ h1: level() === 1, h2: level() === 2, h3: level() === 3 }}>
              <Show when={props.variant === 'stepper'}>
                <div class="scenario-stepper-mark">
                  <span>{level() ? `H${level()}` : visualNumber(index)}</span>
                </div>
              </Show>
              <div class="scenario-stepper-main">
                <textarea
                  ref={(el) => { refs[index] = el }}
                  class="scenario-memo-line"
                  classList={{
                    h1: level() === 1,
                    h2: level() === 2,
                    h3: level() === 3,
                  }}
                  rows={lineRows(lineText(line()), level())}
                  value={lineText(line())}
                  placeholder={index === 0 ? 'scenarioメモを書く...' : ''}
                  onInput={(event) => patchLine(index, event.currentTarget.value)}
                  onFocus={(event) => {
                    activeIndex = index
                    activeCursor = event.currentTarget.selectionStart
                  }}
                  onClick={(event) => {
                    activeIndex = index
                    activeCursor = event.currentTarget.selectionStart
                  }}
                  onKeyUp={(event) => {
                    activeIndex = index
                    activeCursor = event.currentTarget.selectionStart
                  }}
                  onKeyDown={(event) => {
                    if (event.isComposing) return
                    if (event.key === 'Tab') {
                      event.preventDefault()
                      shiftLineHeading(index, event.shiftKey ? -1 : 1)
                      return
                    }
                    if (event.ctrlKey && !event.altKey && !event.metaKey && /^[1-3]$/.test(event.key)) {
                      event.preventDefault()
                      setLineHeading(index, Number(event.key))
                      return
                    }
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      if (lineText(line()).trim() === '' && headingLevel(line()) > 0) {
                        shiftLineHeading(index, -1)
                        return
                      }
                      insertLineAfter(index)
                      return
                    }
                    if (event.key === 'Backspace' && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
                      removeEmptyLine(index)
                    }
                  }}
                />
                <Show when={canOpenLog()}>
                  <button
                    type="button"
                    class="scenario-heading-log-btn"
                    classList={{ linked: props.logKeys?.includes(key()) }}
                    title="この見出しに会話ログCardを作る"
                    onClick={() => props.onOpenLog?.({ key: key(), title: lineText(line()).trim(), level: level() as 2 | 3, index })}
                  >
                    Log
                  </button>
                </Show>
              </div>
            </div>
          )
        }}
      </Index>
    </section>
  )
}

export default ScenarioMemoEditor
