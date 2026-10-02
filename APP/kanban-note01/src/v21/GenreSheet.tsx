import { type JSX, Show } from 'solid-js'

// スマホ（Android）用のサイドバー。1つのジャンル（人物・Scene・WW・演出…）だけを縦のリストで出す。
// ヘッダーは共通で検索窓。文字を確定するたび（日本語の変換中は待つ）にリストを絞る。

type Props = {
  title: string
  query: string
  onQuery: (q: string) => void
  onClose: () => void
  placeholder?: string
  lead?: string
  children: JSX.Element
}

export default function GenreSheet(props: Props) {
  // 日本語の変換中（isComposing）は絞らず、確定したときに絞る
  const commit = (el: HTMLInputElement) => props.onQuery(el.value)
  return (
    <>
      <div class="v21-gsheet-backdrop" onClick={() => props.onClose()} />
      <aside class="v21-gsheet" aria-label={props.title}>
        <div class="v21-gsheet-head">
          <div class="v21-gsheet-titlebar">
            <h3>{props.title}</h3>
            <button type="button" class="v21-gsheet-close" aria-label="閉じる" onPointerDown={(e) => e.preventDefault()} onClick={() => props.onClose()}>×</button>
          </div>
          <input
            class="v21-gsheet-search"
            type="search"
            enterkeyhint="search"
            placeholder={props.placeholder ?? `${props.title}を探す`}
            value={props.query}
            onInput={(e) => { if (!(e as InputEvent).isComposing) commit(e.currentTarget) }}
            onCompositionEnd={(e) => commit(e.currentTarget)}
          />
          <Show when={props.lead}><p class="v21-gsheet-lead">{props.lead}</p></Show>
        </div>
        <div class="v21-gsheet-body">{props.children}</div>
      </aside>
    </>
  )
}
