import { type Component, For, Show, createResource, createSignal } from 'solid-js'
import MarkdownView from '../components/MarkdownView'

type StudyView = 'modules' | 'cards' | 'article'

type StudyCard = {
  id: string
  title: string
  summary: string
  meta: string
  file: string
}

const STUDY_CARDS: StudyCard[] = [
  {
    id: 'dev-environment-outline',
    title: 'Note開発環境 学習ロードマップ',
    summary: 'SolidJS、状態駆動、PWA、Firebase、Gallery、InBoxを学ぶためのTitleと見出し',
    meta: '目次 · 開発環境 · 再利用',
    file: '/study-blog/note-story-dev-environment-outline.md',
  },
  {
    id: 'state-driven-selection',
    title: '画面状態と選択',
    summary: 'Androidの戻る修正から、状態を消す範囲を学ぶ',
    meta: '概念 · 改修 · SolidJS',
    file: '/study-blog/note-story-state-driven-sample.md',
  },
]

const PageStudy: Component = () => {
  const [view, setView] = createSignal<StudyView>('modules')
  const [selectedCardId, setSelectedCardId] = createSignal(STUDY_CARDS[0].id)
  const selectedCard = () => STUDY_CARDS.find((card) => card.id === selectedCardId()) ?? STUDY_CARDS[0]
  const [markdown] = createResource(selectedCard, async (card) => {
    const response = await fetch(card.file)
    return response.ok ? response.text() : '# 読み込み失敗\n\nサンプル記事を読み込めませんでした。'
  })

  function openCard(card: StudyCard) {
    setSelectedCardId(card.id)
    setView('article')
  }

  return (
    <div class="study-page">
      <header class="study-header">
        <div><span>NOTE DEVELOPMENT WIKI</span><h1>Study</h1></div>
        <div class="study-breadcrumb">
          <button onClick={() => setView('modules')}>Module一覧</button>
          <Show when={view() !== 'modules'}><span>›</span><button onClick={() => setView('cards')}>状態駆動</button></Show>
          <Show when={view() === 'article'}><span>›</span><strong>{selectedCard().title}</strong></Show>
        </div>
      </header>

      <main class="study-main">
        <Show when={view() === 'modules'}>
          <section>
            <p class="study-eyebrow">MODULE</p>
            <button class="study-module" onClick={() => setView('cards')}>
              <strong>Note開発環境</strong>
              <span>このアプリを作る過程からSolidJS、状態駆動、PWA、Firebaseを理解する</span>
              <small>{STUDY_CARDS.length} Cards · Draft</small>
            </button>
          </section>
        </Show>

        <Show when={view() === 'cards'}>
          <section>
            <button class="study-back" onClick={() => setView('modules')}>← Module一覧</button>
            <p class="study-eyebrow">NOTE DEVELOPMENT / CARDS</p>
            <For each={STUDY_CARDS}>
              {(card) => (
                <button class="study-card" onClick={() => openCard(card)}>
                  <strong>{card.title}</strong>
                  <span>{card.summary}</span>
                  <small>{card.meta}</small>
                </button>
              )}
            </For>
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
