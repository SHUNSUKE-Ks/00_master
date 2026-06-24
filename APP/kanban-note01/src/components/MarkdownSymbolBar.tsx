import { type Component, For } from 'solid-js'

type Props = {
  onInsert: (text: string, cursorOffset?: number) => void
}

const SYMBOLS = [
  { label: '#', value: '# ' },
  { label: '##', value: '## ' },
  { label: '###', value: '### ' },
  { label: '-', value: '- ' },
  { label: '/', value: '/' },
  { label: '_', value: '_' },
  { label: '`', value: '`' },
  { label: '```', value: '```\n\n```', cursorOffset: 4 },
  { label: '<>', value: '<>', cursorOffset: 1 },
  { label: '</>', value: '</>', cursorOffset: 2 },
  { label: '()', value: '()', cursorOffset: 1 },
  { label: '{}', value: '{}', cursorOffset: 1 },
  { label: '[]', value: '[]', cursorOffset: 1 },
  { label: '「」', value: '「」', cursorOffset: 1 },
  { label: ':', value: ':' },
  { label: ',', value: ',' },
  { label: '.', value: '.' },
  { label: '"', value: '"' },
  { label: 'space', value: ' ' },
]

const MarkdownSymbolBar: Component<Props> = (props) => (
  <div class="markdown-symbol-bar" aria-label="半角Markdown記号">
    <For each={SYMBOLS}>
      {(symbol) => (
        <button type="button" onClick={() => props.onInsert(symbol.value, symbol.cursorOffset)}>
          {symbol.label}
        </button>
      )}
    </For>
  </div>
)

export default MarkdownSymbolBar
