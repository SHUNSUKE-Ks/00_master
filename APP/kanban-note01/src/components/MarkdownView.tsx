import { type Component, For, Show, createSignal } from 'solid-js'

type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'callout'; kind: 'pillar' | 'memo' | 'idea'; emoji: string; title: string; text: string; tags: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string; lang: string }
  | { type: 'hr' }
  | { type: 'table'; headers: string[]; rows: string[][] }

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.replace(/^```/, '').trim()
      const code: string[] = []
      i += 1
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i += 1
      }
      blocks.push({ type: 'code', text: code.join('\n'), lang })
      i += 1
      continue
    }

    if (trimmed.startsWith(':::callout')) {
      const [, rawKind, rawEmoji, ...titleParts] = trimmed.split(/\s+/)
      const kind = rawKind === 'memo' || rawKind === 'idea' ? rawKind : 'pillar'
      const emoji = rawEmoji || (kind === 'pillar' ? '🧱' : kind === 'memo' ? '📝' : '💡')
      const title = titleParts.join(' ') || (kind === 'pillar' ? 'Scene / Event' : kind === 'memo' ? '補足メモ' : 'IdeaBoard')
      const content: string[] = []
      i += 1
      while (i < lines.length && lines[i].trim() !== ':::') {
        content.push(lines[i])
        i += 1
      }
      i += 1
      const tags: string[] = []
      const body = content.filter((line) => {
        const tagLine = line.trim().match(/^tags:\s*(.+)$/)
        if (tagLine) {
          tags.push(...tagLine[1].split(/[,\s]+/).map((tag) => tag.trim()).filter(Boolean))
          return false
        }
        return true
      })
      blocks.push({ type: 'callout', kind, emoji, title, text: body.join('\n').trim(), tags })
      continue
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3 | 4, text: heading[2] })
      i += 1
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    if (trimmed.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const headers = splitTableRow(trimmed)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTableRow(lines[i]))
        i += 1
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      blocks.push({ type: 'quote', text: quote.join('\n') })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    const paragraph: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith(':::callout') &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !/^(-{3,}|\*{3,})$/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i].trim())
      i += 1
    }
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') })
  }

  return blocks
}

const CodeBlock: Component<{ text: string; lang: string }> = (props) => {
  const [copied, setCopied] = createSignal(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(props.text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div class="markdown-code-block">
      <div class="markdown-code-toolbar">
        <span>{props.lang || 'code'}</span>
        <button type="button" onClick={copyCode} aria-label="コードをコピー" title="Copy code">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied() ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre><code>{props.text}</code></pre>
    </div>
  )
}

const MarkdownView: Component<{ markdown: string }> = (props) => {
  const blocks = () => parseMarkdown(props.markdown)

  return (
    <article class="markdown-body">
      <Show when={props.markdown.trim()} fallback={<p class="markdown-empty">本文がありません</p>}>
        <For each={blocks()}>
          {(block) => (
            <Show
              when={block.type === 'heading'}
              fallback={
                <Show
                  when={block.type === 'paragraph'}
                  fallback={
                    <Show
                      when={block.type === 'quote'}
                      fallback={
                        <Show
                          when={block.type === 'callout'}
                          fallback={
                            <Show
                              when={block.type === 'ul'}
                              fallback={
                                <Show
                                  when={block.type === 'ol'}
                                  fallback={
                                    <Show
                                      when={block.type === 'code'}
                                      fallback={
                                        <Show
                                          when={block.type === 'table'}
                                          fallback={<hr />}
                                        >
                                          <div class="markdown-table-wrap">
                                            <table>
                                              <thead>
                                                <tr>
                                                  <For each={(block as Extract<Block, { type: 'table' }>).headers}>
                                                    {(header) => <th>{header}</th>}
                                                  </For>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                <For each={(block as Extract<Block, { type: 'table' }>).rows}>
                                                  {(row) => (
                                                    <tr>
                                                      <For each={row}>{(cell) => <td>{cell}</td>}</For>
                                                    </tr>
                                                  )}
                                                </For>
                                              </tbody>
                                            </table>
                                          </div>
                                        </Show>
                                      }
                                    >
                                      {(() => {
                                        const code = block as Extract<Block, { type: 'code' }>
                                        return <CodeBlock text={code.text} lang={code.lang} />
                                      })()}
                                    </Show>
                                  }
                                >
                                  <ol>
                                    <For each={(block as Extract<Block, { type: 'ol' }>).items}>{(item) => <li>{item}</li>}</For>
                                  </ol>
                                </Show>
                              }
                            >
                              <ul>
                                <For each={(block as Extract<Block, { type: 'ul' }>).items}>{(item) => <li>{item}</li>}</For>
                              </ul>
                            </Show>
                          }
                        >
                          {(() => {
                            const callout = block as Extract<Block, { type: 'callout' }>
                            return (
                              <div
                                class="scenario-callout"
                                classList={{
                                  'scenario-callout-pillar': callout.kind === 'pillar',
                                  'scenario-callout-memo': callout.kind === 'memo',
                                  'scenario-callout-idea': callout.kind === 'idea',
                                }}
                              >
                                <div class="scenario-callout-title">
                                  <span>{callout.emoji}</span>
                                  <span>{callout.title}</span>
                                </div>
                                <p>{callout.text}</p>
                                <Show when={callout.tags.length > 0}>
                                  <div class="scenario-callout-tags">
                                    <For each={callout.tags}>{(tag) => <span>{tag}</span>}</For>
                                  </div>
                                </Show>
                              </div>
                            )
                          })()}
                        </Show>
                      }
                    >
                      <blockquote>{(block as Extract<Block, { type: 'quote' }>).text}</blockquote>
                    </Show>
                  }
                >
                  <p>{(block as Extract<Block, { type: 'paragraph' }>).text}</p>
                </Show>
              }
            >
              {(() => {
                const heading = block as Extract<Block, { type: 'heading' }>
                if (heading.level === 1) return <h1>{heading.text}</h1>
                if (heading.level === 2) return <h2>{heading.text}</h2>
                if (heading.level === 3) return <h3>{heading.text}</h3>
                return <h4>{heading.text}</h4>
              })()}
            </Show>
          )}
        </For>
      </Show>
    </article>
  )
}

export default MarkdownView
