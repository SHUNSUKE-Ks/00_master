import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { addInboxItem, setState, state } from '../../store'

const DEFAULT_TAGS = ['未分類', 'note_app_improvement', 'codex_consult_seed', 'task_memo', 'app', 'game_system']

function sourceContext() {
  const notebook = state.notebooks.find((item) => item.id === state.selectedNotebookId)
  const page = notebook?.pages.find((item) => item.id === state.selectedNotebookPageId)
  return {
    sourceView: state.page,
    sourceNotebookId: notebook?.id,
    sourceNotebookTitle: notebook?.title,
    sourcePageId: page?.id,
    sourcePageTitle: page?.title,
  }
}

const InboxComposer: Component = () => {
  const [subject, setSubject] = createSignal('')
  const [body, setBody] = createSignal('')
  const [tag, setTag] = createSignal('未分類')
  const [relatedIdea, setRelatedIdea] = createSignal('')
  const [error, setError] = createSignal('')

  const ideaTitles = createMemo(() => {
    const notebook = state.notebooks.find((item) => item.id === 'story-ideas' || item.title === 'アイディア帳')
    return notebook?.pages
      .filter((page) => page.id !== 'idea-index-ai-md')
      .map((page) => page.title) ?? []
  })

  const tags = createMemo(() => {
    const legacy = state.notebooks.find((item) => item.id === 'story-inbox' || item.title === 'InBox')
    const tagPage = legacy?.pages.find((page) => page.id === 'inbox-tag-db' || page.title === 'tagDB')
    try {
      const parsed = JSON.parse(tagPage?.body ?? '{}') as { tags?: string[] }
      return Array.from(new Set([...DEFAULT_TAGS, ...(parsed.tags ?? [])]))
    } catch {
      return DEFAULT_TAGS
    }
  })

  function close() {
    setState({ inboxComposerOpen: false })
    setError('')
  }

  function submit() {
    const nextSubject = subject().trim()
    const nextBody = body().trim()
    if (!nextSubject || !nextBody) {
      setError('件名とMemoを入力してください')
      return
    }
    addInboxItem({
      subject: nextSubject,
      body: nextBody,
      tag: tag(),
      relatedIdea: relatedIdea() || undefined,
      ...sourceContext(),
    })
    setSubject('')
    setBody('')
    setRelatedIdea('')
    setError('')
    close()
  }

  return (
    <Show when={state.inboxComposerOpen}>
      <div class="idea-inbox-backdrop" onClick={close} />
      <aside class="idea-inbox-sidebar global-inbox-composer">
        <div class="idea-inbox-header">
          <div>
            <p>Global InBox</p>
            <span>{sourceContext().sourcePageTitle ?? sourceContext().sourceNotebookTitle ?? state.page} から送信</span>
          </div>
          <button type="button" onClick={close}>閉じる</button>
        </div>
        <div class="idea-inbox-body">
          <label>
            <span>件名</span>
            <input value={subject()} onInput={(event) => setSubject(event.currentTarget.value)} placeholder="あとで探すための件名..." />
          </label>
          <label>
            <span>Tag</span>
            <select value={tag()} onChange={(event) => setTag(event.currentTarget.value)}>
              <For each={tags()}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </label>
          <label>
            <span>関連アイディア</span>
            <select value={relatedIdea()} onChange={(event) => setRelatedIdea(event.currentTarget.value)}>
              <option value="">未指定</option>
              <For each={ideaTitles()}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </label>
          <label>
            <span>Memo</span>
            <textarea value={body()} onInput={(event) => setBody(event.currentTarget.value)} placeholder="どの画面からでも共通InBoxへ送れます..." />
          </label>
          <Show when={error()}><div class="idea-inbox-error">{error()}</div></Show>
          <button type="button" class="idea-inbox-submit" onClick={submit}>InBoxへ送信</button>
        </div>
      </aside>
    </Show>
  )
}

export default InboxComposer

