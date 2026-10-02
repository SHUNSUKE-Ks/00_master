import { type Component, createSignal } from 'solid-js'
import { download, prepareImages, toHtml, toMarkdown, toText, type Fold } from './exportNote'
import type { Note } from './store'

// 書き出し（UpNote の書き出し画面を参考に、3つに絞った）
const ExportDialog: Component<{ note: Note; onClose: () => void; onDone: (t: string) => void }> = (props) => {
  const [fold, setFold] = createSignal<Fold>('open')
  const [toc, setToc] = createSignal(true)
  const [meta, setMeta] = createSignal(false)
  const done = (k: string) => { props.onDone(`${k} に書き出しました`); props.onClose() }

  return (
    <div class="bn-modal-back" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
      <div class="bn-modal bn-export" role="dialog" aria-modal="true" aria-labelledby="bn-export-title">
        <h2 id="bn-export-title">書き出し</h2>
        <section>
          <div class="bn-export-row"><b>テキストファイル</b><button type="button" class="v21-btn" onClick={() => { download(props.note, 'txt', toText(props.note)); done('テキスト') }}>書き出す</button></div>
        </section>
        <section>
          <div class="bn-export-row"><b>HTML</b><button type="button" class="v21-btn primary" onClick={async () => { await prepareImages(props.note.body); download(props.note, 'html', toHtml(props.note, fold(), toc())); done('HTML') }}>書き出す</button></div>
          <label class="bn-export-opt">折りたたみできる見出し
            <select value={fold()} onChange={(e) => setFold(e.currentTarget.value as Fold)}>
              <option value="open">すべて展開</option>
              <option value="closed">すべて折りたたむ</option>
              <option value="none">折りたたまない</option>
            </select>
          </label>
          <label class="bn-export-check"><input type="checkbox" checked={toc()} onChange={(e) => setToc(e.currentTarget.checked)} />先頭に目次を付ける</label>
        </section>
        <section>
          <div class="bn-export-row"><b>Markdown</b><button type="button" class="v21-btn primary" onClick={async () => { await prepareImages(props.note.body); download(props.note, 'md', toMarkdown(props.note, meta())); done('Markdown') }}>書き出す</button></div>
          <label class="bn-export-check"><input type="checkbox" checked={meta()} onChange={(e) => setMeta(e.currentTarget.checked)} />作成日・更新日などを先頭に入れる</label>
        </section>
        <button type="button" class="v21-btn bn-export-close" onClick={props.onClose}>閉じる</button>
      </div>
    </div>
  )
}

export default ExportDialog
