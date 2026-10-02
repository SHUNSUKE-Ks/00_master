import { For, type Component } from 'solid-js'
import { switchAppVersion, type AppVersion } from './nav'

const TABS: Array<{ id: AppVersion; label: string; title: string }> = [
  { id: 'v31', label: 'V3.1', title: 'Bakeru Note（シンプルなノート・本棚・コピペリスト）' },
  { id: 'v21', label: 'V2.1', title: '新しい画面（既定）' },
  { id: 'v11', label: 'Vol1.1', title: '旧画面（凍結。いままでの機能はすべてここ）' },
]

/** いまの版だけを小さく見せ、押すと選べる（V3.1 のヘッダー用。2026-10-02 利用者） */
export const VersionSelect: Component<{ current: AppVersion }> = (props) => (
  <label class="v21-version-select" title="画面の版を変える">
    <span class="v21-version-sr">画面の版</span>
    <select
      value={props.current}
      aria-label="画面の版"
      onChange={(e) => { const v = e.currentTarget.value as AppVersion; if (v !== props.current) switchAppVersion(v) }}
    >
      <For each={TABS}>{(t) => <option value={t.id}>{t.label}</option>}</For>
    </select>
  </label>
)

/** V3.1 / V2.1 / Vol1.1 のタブ。押すと保存して再読み込みし、ホームから全部やり直す */
export const VersionTabs: Component<{ current: AppVersion; compact?: boolean }> = (props) => (
  <div class="v21-version" classList={{ compact: props.compact }} role="tablist" aria-label="画面の版">
    <For each={TABS}>
      {(t) => (
        <button
          type="button"
          role="tab"
          aria-selected={props.current === t.id}
          classList={{ on: props.current === t.id }}
          onClick={() => props.current !== t.id && switchAppVersion(t.id)}
          title={t.title}
        >
          {t.label}
        </button>
      )}
    </For>
  </div>
)
