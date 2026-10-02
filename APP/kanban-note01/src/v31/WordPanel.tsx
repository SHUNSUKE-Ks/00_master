import { type Component, For, Show, createSignal } from 'solid-js'
import { addBook, addWord, db, removeBook, removeWord, toggleWordBook } from './store'

// 左のコピペリスト。panel＝'inbox'（全部の単語）／辞書の id（その辞書に振り分けた単語）／'add'（辞書を足す）。
// 単語は1つの表（WordInBox）。辞書は単語に付ける印なので、振り分けても単語は増えない。

type Props = {
  panel: string
  canInsert: boolean
  onPick: (text: string) => void
  onToast: (text: string) => void
  onOpen: (panel: string) => void
  /** 辞書を足した時に紐づける本（ノート） */
  linkTo?: string | null
}

const WordPanel: Component<Props> = (props) => {
  const [filter, setFilter] = createSignal('')
  const [confirmBook, setConfirmBook] = createSignal(false)
  const book = () => db.dicts.find((b) => b.id === props.panel)
  const isInbox = () => props.panel === 'inbox'
  const words = () => {
    const q = filter().trim().toLowerCase()
    return db.words.filter((w) => (isInbox() || w.dicts.includes(props.panel)) && (!q || w.text.toLowerCase().includes(q)))
  }

  function onAdd(e: SubmitEvent) {
    e.preventDefault()
    const el = (e.currentTarget as HTMLFormElement).elements.namedItem('w') as HTMLInputElement
    const r = addWord(el.value, 'hand', book() ? [book()!.id] : [])
    if (r === 'empty') return
    props.onToast(r === 'added' ? '登録しました' : 'もう有ります（先頭へ上げました）')
    el.value = ''
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); props.onToast(`コピーしました：${text.slice(0, 20)}`) } catch { props.onToast('コピーできませんでした') }
  }

  return (
    <Show
      when={props.panel !== 'add'}
      fallback={
        <div class="bn-panel">
          <h2 class="bn-side-title">辞書を足す</h2>
          <p class="bn-lead">表紙は漢字1字。単語を分けて置く辞書になります。</p>
          <form
            class="bn-form"
            onSubmit={(e) => {
              e.preventDefault()
              const f = e.currentTarget.elements
              const b = addBook((f.namedItem('k') as HTMLInputElement).value, (f.namedItem('n') as HTMLInputElement).value, props.linkTo)
              if (b) { props.onToast(`「${b.kanji}」の辞書を作りました`); props.onOpen(b.id) }
            }}
          >
            <label>表紙の漢字<input name="k" maxLength={2} required placeholder="例: 技" class="bn-kanji-in" /></label>
            <label>辞書の名前<input name="n" placeholder="例: スキル" /></label>
            <button type="submit" class="v21-btn primary">作る</button>
          </form>
        </div>
      }
    >
      <div class="bn-panel">
        <h2 class="bn-side-title">
          <Show when={book()} fallback={<>InBox <small>すべての単語 {db.words.length}</small></>}>
            {(b) => <>{b().kanji}｜{b().name} <small>{words().length}語</small></>}
          </Show>
        </h2>
        <p class="bn-lead">
          {isInbox()
            ? 'コピーした文字はここに集まります。下の辞書を押すと、その辞書にも並びます。'
            : 'InBox で振り分けた単語です。'}
          {props.canInsert ? '単語を押すと、カーソルの位置に貼ります。' : 'ページを開くと、押して貼れます。'}
        </p>
        <form class="bn-add" onSubmit={onAdd}>
          <input name="w" placeholder="単語を足す" aria-label="単語を足す" />
          <button type="submit" class="v21-btn">足す</button>
        </form>
        <Show when={db.words.length > 8}>
          <input class="bn-filter" type="search" placeholder="単語をしぼる" aria-label="単語をしぼる" value={filter()} onInput={(e) => setFilter(e.currentTarget.value)} />
        </Show>
        <ul class="bn-words">
          <For each={words()} fallback={<li class="bn-lead">{isInbox() ? 'まだ単語がありません。本文の文字を選んでコピーしてみてください。' : 'まだありません。InBox で、この辞書を押して振り分けます。'}</li>}>
            {(w) => (
              <li class="bn-word">
                <div class="bn-word-row">
                  <button
                    type="button"
                    class="bn-word-text"
                    disabled={!props.canInsert}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => props.onPick(w.text)}
                    title="カーソルの位置に貼る"
                  >
                    {w.text}
                  </button>
                  <button type="button" class="bn-mini" onClick={() => copy(w.text)} aria-label={`${w.text} をコピー`} title="コピー">⧉</button>
                  <Show
                    when={isInbox()}
                    fallback={<button type="button" class="bn-mini" onClick={() => toggleWordBook(w.id, props.panel)} aria-label={`${w.text} をこの辞書から外す`} title="この辞書から外す（InBox には残ります）">−</button>}
                  >
                    <button type="button" class="bn-mini" onClick={() => removeWord(w.id)} aria-label={`${w.text} を消す`} title="消す（すべての辞書からも消えます）">×</button>
                  </Show>
                </div>
                <Show when={isInbox()}>
                  <div class="bn-chips" role="group" aria-label={`${w.text} を振り分ける辞書`}>
                    <For each={db.dicts}>
                      {(b) => (
                        <button
                          type="button"
                          class="bn-chip"
                          classList={{ on: w.dicts.includes(b.id) }}
                          style={{ '--bk-hue': String(b.hue) }}
                          aria-pressed={w.dicts.includes(b.id)}
                          aria-label={`${b.name}の辞書`}
                          title={`${b.name}の辞書に${w.dicts.includes(b.id) ? '入っています（押すと外す）' : '入れる'}`}
                          onClick={() => toggleWordBook(w.id, b.id)}
                        >
                          {b.kanji}
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </li>
            )}
          </For>
        </ul>
        <Show when={book()}>
          {(b) => (
            <div class="bn-panel-foot">
              <Show
                when={confirmBook()}
                fallback={<button type="button" class="bn-link" onClick={() => setConfirmBook(true)}>この辞書を消す</button>}
              >
                <span>辞書だけ消します（単語は InBox に残ります）。</span>
                <button type="button" class="v21-btn" onClick={() => { removeBook(b().id); props.onOpen('inbox') }}>消す</button>
                <button type="button" class="v21-btn" onClick={() => setConfirmBook(false)}>やめる</button>
              </Show>
            </div>
          )}
        </Show>
      </div>
    </Show>
  )
}

export default WordPanel
