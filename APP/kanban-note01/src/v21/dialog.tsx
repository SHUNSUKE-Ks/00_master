import { type Component, For, Show, createSignal } from 'solid-js'

// アプリの中のダイアログ（2026-09-28 利用者: 端末の既存のポップアップ（window.prompt / confirm）ではなく、専用のダイアログに）。
// askConfirm・askText・askForm は Promise を返す。画面には DialogHost を1つ置く（AppV21）。
// Enter で決める・Esc と外側を押すとやめる。いちばん上の入力欄にカーソルを置く。

export type DialogField = {
  name: string
  label: string
  value?: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
  readonly?: boolean
  /** 選ぶ欄にする（value が選ばれた状態） */
  options?: Array<{ value: string; label: string }>
}
type Request = {
  title: string
  message?: string
  fields: DialogField[]
  okLabel: string
  cancelLabel?: string
  danger?: boolean
  validate?: (values: Record<string, string>) => string
  resolve: (values: Record<string, string> | null) => void
}

const [current, setCurrent] = createSignal<Request | null>(null)
export const dialogOpen = () => current() !== null

function open(req: Omit<Request, 'resolve'>): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    // 前のダイアログが開いていたら、やめたことにする
    current()?.resolve(null)
    setCurrent({ ...req, resolve })
  })
}

/** はい／いいえ */
export async function askConfirm(opts: { title: string; message?: string; okLabel?: string; cancelLabel?: string; danger?: boolean }): Promise<boolean> {
  const r = await open({ title: opts.title, message: opts.message, fields: [], okLabel: opts.okLabel ?? 'はい', cancelLabel: opts.cancelLabel, danger: opts.danger })
  return r !== null
}

/** 1つ書いてもらう。やめたら null */
export async function askText(opts: { title: string; label?: string; message?: string; value?: string; placeholder?: string; okLabel?: string; required?: boolean; multiline?: boolean; readonly?: boolean; validate?: (v: string) => string }): Promise<string | null> {
  const r = await open({
    title: opts.title,
    message: opts.message,
    fields: [{ name: 'value', label: opts.label ?? '', value: opts.value, placeholder: opts.placeholder, required: opts.required, multiline: opts.multiline, readonly: opts.readonly }],
    okLabel: opts.okLabel ?? '決める',
    validate: opts.validate ? (v) => opts.validate!(v.value ?? '') : undefined,
  })
  return r ? r.value ?? '' : null
}

/** いくつか書いてもらう。やめたら null */
export function askForm(opts: { title: string; message?: string; fields: DialogField[]; okLabel?: string; validate?: (values: Record<string, string>) => string }) {
  return open({ title: opts.title, message: opts.message, fields: opts.fields, okLabel: opts.okLabel ?? '決める', validate: opts.validate })
}

/** 画面に1つ置く */
export const DialogHost: Component = () => {
  const [error, setError] = createSignal('')
  let form: HTMLFormElement | undefined

  const close = (values: Record<string, string> | null) => {
    const req = current()
    setCurrent(null)
    setError('')
    req?.resolve(values)
  }
  function submit(e: SubmitEvent) {
    e.preventDefault()
    const req = current()
    if (!req || !form) return
    const values: Record<string, string> = {}
    for (const f of req.fields) values[f.name] = ((form.elements.namedItem(f.name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? '').trim()
    const missing = req.fields.find((f) => f.required && !values[f.name])
    if (missing) { setError(`${missing.label || '入力'}を入れてください`); return }
    const problem = req.validate?.(values) ?? ''
    if (problem) { setError(problem); return }
    close(values)
  }

  return (
    <Show when={current()}>
      {(req) => (
        <div class="v21-dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(null) }}>
          <form
            ref={form}
            class="v21-dialog"
            classList={{ danger: !!req().danger }}
            role="dialog"
            aria-modal="true"
            aria-label={req().title}
            onSubmit={submit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null) }
              // 1行の欄の Enter は決める。複数行の欄は Ctrl+Enter で決める
              if (e.key === 'Enter' && !e.isComposing && (e.ctrlKey || e.metaKey) && (e.target as HTMLElement).tagName === 'TEXTAREA') { e.preventDefault(); form?.requestSubmit() }
            }}
          >
            <h3>{req().title}</h3>
            <Show when={req().message}><p class="v21-dialog-msg">{req().message}</p></Show>
            <For each={req().fields}>
              {(f, i) => (
                <label class="v21-dialog-field">
                  <Show when={f.label}><span>{f.label}{f.required ? '' : '（無くてもよい）'}</span></Show>
                  <Show when={!f.options} fallback={
                    <select name={f.name} value={f.value ?? ''} ref={(el) => { if (i() === 0) requestAnimationFrame(() => el.focus()) }}>
                      <For each={f.options}>{(o) => <option value={o.value} selected={o.value === (f.value ?? '')}>{o.label}</option>}</For>
                    </select>
                  }>
                  <Show
                    when={f.multiline}
                    fallback={
                      <input
                        name={f.name}
                        value={f.value ?? ''}
                        placeholder={f.placeholder ?? ''}
                        readOnly={f.readonly}
                        enterkeyhint="done"
                        ref={(el) => { if (i() === 0) requestAnimationFrame(() => { el.focus(); if (f.value) el.select() }) }}
                      />
                    }
                  >
                    <textarea
                      name={f.name}
                      value={f.value ?? ''}
                      placeholder={f.placeholder ?? ''}
                      readOnly={f.readonly}
                      rows={f.readonly ? 8 : 3}
                      ref={(el) => { if (i() === 0) requestAnimationFrame(() => { el.focus(); if (f.readonly) el.select() }) }}
                    />
                  </Show>
                  </Show>
                </label>
              )}
            </For>
            <Show when={error()}><p class="v21-dialog-error" role="alert">{error()}</p></Show>
            <div class="v21-dialog-actions">
              <button type="button" class="v21-btn" onClick={() => close(null)}>{req().cancelLabel ?? 'やめる'}</button>
              <button type="submit" class="v21-btn primary" classList={{ danger: !!req().danger }}>{req().okLabel}</button>
            </div>
          </form>
        </div>
      )}
    </Show>
  )
}
