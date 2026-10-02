import { type Component, For, Show, onMount } from 'solid-js'
import { HELP, HELP_COMMON, WHEN_LABEL, type HelpItem, type HelpScreen, type HelpSection } from './help'

// Ctrl+/ で出す「この画面でできること」。開いた瞬間の状態に合う操作を明るく、合わない操作を薄く出す

type Props = {
  screen: HelpScreen
  phase: 'input' | 'view'
  extra?: HelpSection[]
  onClose: () => void
}

const HelpOverlay: Component<Props> = (props) => {
  let closeRef: HTMLButtonElement | undefined
  onMount(() => closeRef?.focus())
  const screen = () => HELP[props.screen]
  const usable = (item: HelpItem) => !item.when || item.when === 'any' || item.when === props.phase

  const Section = (p: { section: HelpSection }) => (
    <section class="v21-help-section">
      <h3>{p.section.title}</h3>
      <ul>
        <For each={p.section.items}>
          {(item) => (
            <li classList={{ dim: !usable(item) }}>
              <span class="v21-help-key">
                <Show when={item.keys}>
                  <For each={item.keys}>
                    {(combo, i) => (
                      <>
                        <Show when={i() > 0}><span class="v21-help-or">/</span></Show>
                        <For each={combo}>
                          {(key, j) => (
                            <>
                              <Show when={j() > 0}><span class="v21-help-plus">+</span></Show>
                              <kbd>{key}</kbd>
                            </>
                          )}
                        </For>
                      </>
                    )}
                  </For>
                </Show>
                <Show when={item.code}><code>{item.code}</code></Show>
              </span>
              <span class="v21-help-text">{item.text}</span>
              <Show when={item.when && item.when !== 'any'}>
                <span class="v21-help-when">{WHEN_LABEL[item.when!]}</span>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </section>
  )

  return (
    <div class="v21-help-backdrop" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
      <div class="v21-help" role="dialog" aria-modal="true" aria-label={`${screen().name}で使える操作`}>
        <header class="v21-help-head">
          <div>
            <p class="v21-kicker">この画面でできること</p>
            <h2>{screen().name}</h2>
            <p class="v21-help-lead">{screen().lead}</p>
          </div>
          <div class="v21-help-state">
            <span>いまの状態</span>
            <strong>{props.phase === 'input' ? '入力中' : '見ているとき'}</strong>
            <small>合わない操作は薄く出ます</small>
          </div>
          <button ref={closeRef} type="button" class="v21-icon-btn" onClick={props.onClose} aria-label="閉じる">×</button>
        </header>
        <div class="v21-help-body">
          <For each={[...(props.extra ?? []), ...screen().sections]}>{(section) => <Section section={section} />}</For>
          <Section section={HELP_COMMON} />
        </div>
        <footer class="v21-help-foot"><kbd>Ctrl</kbd>+<kbd>/</kbd> でいつでも開閉 ・ <kbd>Esc</kbd> で閉じる</footer>
      </div>
    </div>
  )
}

export default HelpOverlay
