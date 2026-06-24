type DebugEvent = KeyboardEvent | InputEvent | CompositionEvent

const STORAGE_KEY = 'noteStoryKeyDebug'

function isEnabled() {
  const params = new URLSearchParams(window.location.search)
  const value = params.get('keydebug')
  if (value === '1') localStorage.setItem(STORAGE_KEY, '1')
  if (value === '0') localStorage.removeItem(STORAGE_KEY)
  return localStorage.getItem(STORAGE_KEY) === '1'
}

function eventDetail(type: string, event: DebugEvent) {
  const target = event.target as HTMLElement | null
  const keyboard = event instanceof KeyboardEvent ? event : null
  const input = event instanceof InputEvent ? event : null
  return {
    type,
    key: keyboard?.key,
    code: keyboard?.code,
    altKey: keyboard?.altKey,
    ctrlKey: keyboard?.ctrlKey,
    shiftKey: keyboard?.shiftKey,
    metaKey: keyboard?.metaKey,
    repeat: keyboard?.repeat,
    isComposing: keyboard?.isComposing,
    isTrusted: event.isTrusted,
    inputType: input?.inputType,
    data: input?.data,
    target: target ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}` : null,
    active: document.activeElement?.tagName.toLowerCase(),
    time: new Date().toLocaleTimeString('ja-JP'),
  }
}

function formatOverlayLine(detail: ReturnType<typeof eventDetail>) {
  return [
    detail.time,
    detail.type,
    `key=${detail.key ?? '-'}`,
    `code=${detail.code ?? '-'}`,
    `alt=${detail.altKey ?? '-'}`,
    `ctrl=${detail.ctrlKey ?? '-'}`,
    `trusted=${detail.isTrusted}`,
    `input=${detail.inputType ?? '-'}`,
    `data=${detail.data ?? '-'}`,
    `target=${detail.target ?? '-'}`,
  ].join('  ')
}

export function installKeyDebug() {
  if (typeof window === 'undefined' || !isEnabled()) return

  const panel = document.createElement('div')
  panel.style.position = 'fixed'
  panel.style.left = '8px'
  panel.style.right = '8px'
  panel.style.bottom = '8px'
  panel.style.zIndex = '99999'
  panel.style.maxHeight = '96px'
  panel.style.overflow = 'auto'
  panel.style.padding = '8px'
  panel.style.borderRadius = '8px'
  panel.style.background = 'rgba(0, 0, 0, 0.82)'
  panel.style.color = '#fff'
  panel.style.font = '11px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  panel.style.whiteSpace = 'pre-wrap'
  panel.textContent = 'KeyDebug enabled. Add ?keydebug=0 to disable.'
  document.body.appendChild(panel)

  const lines: string[] = [panel.textContent]
  const log = (type: string, event: DebugEvent) => {
    const detail = eventDetail(type, event)
    console.info('[NoteStory KeyDebug]', detail)
    lines.unshift(formatOverlayLine(detail))
    panel.textContent = lines.slice(0, 5).join('\n')
  }

  window.addEventListener('keydown', (event) => log('keydown', event), true)
  window.addEventListener('keyup', (event) => log('keyup', event), true)
  window.addEventListener('beforeinput', (event) => log('beforeinput', event as InputEvent), true)
  window.addEventListener('compositionstart', (event) => log('compositionstart', event), true)
  window.addEventListener('compositionend', (event) => log('compositionend', event), true)
}
