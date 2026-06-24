import { type Component, Show, createResource, createSignal } from 'solid-js'
import MarkdownView from '../components/MarkdownView'

type StudyView = 'modules' | 'cards' | 'article'

const PageStudy: Component = () => {
  const [view, setView] = createSignal<StudyView>('modules')
  const [markdown] = createResource(async () => {
    const response = await fetch('/study-blog/note-story-state-driven-sample.md')
    return response.ok ? response.text() : '# 読み込み失敗\n\nサンプル記事を読み込めませんでした。'
  })

  return (
    <div class="study-page">
      <header class="study-header">
        <div><span>NOTE DEVELOPMENT WIKI</span><h1>Study</h1></div>
        <div class="study-breadcrumb">
          <button onClick={() => setView('modules')}>Module一覧</button>
          <Show when={view() !== 'modules'}><span>›</span><button onClick={() => setView('cards')}>状態駆動</button></Show>
          <Show when={view() === 'article'}><span>›</span><strong>画面状態と選択</strong></Show>
        </div>
      </header>

      <main class="study-main">
        <Show when={view() === 'modules'}>
          <section>
            <p class="study-eyebrow">MODULE</p>
            <button class="study-module" onClick={() => setView('cards')}>
              <strong>状態駆動</strong>
              <span>State / Action / ViewをNoteの実装から理解する</span>
              <small>1 Card · Sample</small>
            </button>
          </section>
        </Show>

        <Show when={view() === 'cards'}>
          <section>
            <button class="study-back" onClick={() => setView('modules')}>← Module一覧</button>
            <p class="study-eyebrow">STATE DRIVEN / CARDS</p>
            <button class="study-card" onClick={() => setView('article')}>
              <strong>画面状態と選択</strong>
              <span>Androidの戻る修正から、状態を消す範囲を学ぶ</span>
              <small>概念 · 改修 · SolidJS</small>
            </button>
          </section>
        </Show>

        <Show when={view() === 'article'}>
          <article class="study-article">
            <button class="study-back" onClick={() => setView('cards')}>← Card一覧</button>
            <Show when={!markdown.loading} fallback={<p>読み込み中...</p>}>
              <MarkdownView markdown={markdown() ?? ''} />
            </Show>
          </article>
        </Show>
      </main>
    </div>
  )
}

export default PageStudy

