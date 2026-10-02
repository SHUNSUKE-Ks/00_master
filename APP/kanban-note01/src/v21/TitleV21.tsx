import { type Component, For, Index, Show, createMemo, createSignal, onCleanup } from 'solid-js'
import { state } from '../store'
import { buildKeyDeckImport, downloadJson, KEYDECK_ID_PATTERN, suggestKeyDeckId } from '../utils/keydeckExport'
import { addCharacter, addScene, clearCastSlot, ensureCastSlots, flushNotebook, moveCastSlot, patchNotebookSoon, renameCharacterWithConfirm, setEventTags, unarchiveNotebook } from './actions'
import DraftsV21 from './DraftsV21'
import PlotBoardV21 from './PlotBoardV21'
import { askText } from './dialog'
import { flowOf } from './plotFlow'
import Portrait from './Portrait'
import { draftsOf } from './drafts'
import { NARRATOR_NAME, castSlots, coverGradient, go, isDefaultSlotName, isTitleNotebook, lastDialogues, namedCast, pageTalkCount, scenePages, titleSynopsis, titleTalkCount } from './nav'

// 作品ページ。場面の一覧と、あらすじ・登場人物を1画面に置く。
// イベント（kind: 'event'）も同じページを使う（2026-09-28）。イベントのときは Title タグと Character タグを付ける欄が出る

const TitleV21: Component<{ notebookId: string }> = (props) => {
  const nb = () => state.notebooks.find((n) => n.id === props.notebookId)
  const scenes = createMemo(() => (nb() ? scenePages(nb()!) : []))
  // 登場人物は9つの枠（名前は作品のDBで一元管理。初期は Character1〜9）
  const cast = createMemo(() => (nb() ? castSlots(nb()!) : []))
  if (nb()) ensureCastSlots(props.notebookId)
  const [tab, setTab] = createSignal<'work' | 'drafts' | 'plot'>('work')
  const [draftName, setDraftName] = createSignal('')
  const [notice, setNotice] = createSignal('')
  const isEvent = () => nb()?.kind === 'event'
  const listRoute = () => (isEvent() ? ({ name: 'events' } as const) : ({ name: 'titles' } as const))

  // ---- イベントのタグ（Title タグ・Character タグ） ----
  const allTitles = createMemo(() => state.notebooks.filter(isTitleNotebook))
  const toggleTitleTag = (id: string) => {
    const cur = nb()?.titleIds ?? []
    const on = cur.includes(id)
    // Title を外したら、その Title の Character タグも外す
    setEventTags(props.notebookId, {
      titleIds: on ? cur.filter((x) => x !== id) : [...cur, id],
      ...(on ? { characterRefs: (nb()?.characterRefs ?? []).filter((r) => !r.startsWith(`${id}:`)) } : {}),
    })
  }
  const toggleCharTag = (ref: string) => {
    const cur = nb()?.characterRefs ?? []
    setEventTags(props.notebookId, { characterRefs: cur.includes(ref) ? cur.filter((x) => x !== ref) : [...cur, ref] })
  }
  const taggedTitles = () => allTitles().filter((t) => nb()?.titleIds?.includes(t.id!))

  // ---- Assets（納品された素材）: タブで分類を選ぶ。エネミーは「編集」で分類を変えて分ける ----
  type AssetKind = 'character' | 'enemy' | 'background' | 'item'
  const ASSET_TABS: Array<{ id: 'all' | AssetKind; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'character', label: 'Character' },
    { id: 'background', label: '背景' },
    { id: 'enemy', label: 'エネミー' },
    { id: 'item', label: 'Item' },
  ]
  const ASSET_LABEL: Record<AssetKind, string> = { character: '立ち絵', enemy: 'エネミー', background: '背景', item: '小物' }
  const [assetTab, setAssetTab] = createSignal<'all' | AssetKind>('all')
  const [assetEdit, setAssetEdit] = createSignal(false)
  const assets = () => nb()?.assets ?? []
  const assetCount = (k: 'all' | AssetKind) => (k === 'all' ? assets().length : assets().filter((a) => a.kind === k).length)
  const shownAssets = () => (assetTab() === 'all' ? assets() : assets().filter((a) => a.kind === assetTab()))
  const setAssetKind = (id: string, kind: AssetKind) => patchNotebookSoon(props.notebookId, { assets: assets().map((a) => (a.id === id ? { ...a, kind } : a)) })

  onCleanup(() => flushNotebook(props.notebookId))

  function addCast() {
    const name = draftName().trim()
    if (!name) return
    const problem = addCharacter(props.notebookId, cast(), name)
    if (problem) { setNotice(problem); return }
    setNotice('')
    setDraftName('')
  }
  /** 名前の欄を確定したとき（Enter・欄を離れたとき）。作品の全セリフも付け替える */
  async function commitName(index: number, value: string) {
    const from = cast()[index]?.name ?? ''
    const problem = await renameCharacterWithConfirm(props.notebookId, cast(), from, value)
    if (problem === 'cancelled') return
    setNotice(problem || (value.trim() && value.trim() !== from ? `「${from}」を「${value.trim()}」に変えました（全セリフも）` : ''))
  }

  async function exportKeyDeck() {
    const book = nb()
    if (!book) return
    if (!cast().length) {
      setNotice('先に登場人物を1人以上入れてください')
      return
    }
    const input = await askText({
      title: 'KeyDeckへ書き出し',
      label: 'Deck名',
      message: '半角の英小文字・数字・_ で58文字まで',
      value: suggestKeyDeckId(book.id ?? book.title),
      okLabel: '書き出す',
      validate: (v) => (KEYDECK_ID_PATTERN.test(v.trim()) ? '' : 'Deck名は 半角の英小文字・数字・_ で書いてください'),
    })
    if (input === null) return
    const deckId = input.trim()
    downloadJson(`keydeck_${deckId}.json`, buildKeyDeckImport(deckId, book.title, cast().map((c) => ({ name: c.name })), { narration: NARRATOR_NAME }))
    setNotice(`書き出しました。PCのKeyDeck「Deck編集 → 取り込み」で読めます`)
  }

  return (
    <div class="v21-page">
      <Show when={nb()} fallback={<p class="v21-empty">この作品は見つかりません。<button type="button" class="v21-link" onClick={() => go(listRoute())}>一覧へ</button></p>}>
        {(book) => (
          <>
            <button type="button" class="v21-back" onClick={() => go(listRoute())}>{isEvent() ? '← イベント' : '← タイトル'}</button>
            <Show when={book().archivedAt && !book().trashedAt}>
              <p class="v21-notice">この{isEvent() ? 'イベント' : '作品'}は非表示です（一覧に出ません）。 <button type="button" class="v21-link" onClick={() => unarchiveNotebook(props.notebookId)}>表示に戻す</button></p>
            </Show>
            <Show when={book().trashedAt}><p class="v21-notice">この{isEvent() ? 'イベント' : '作品'}はごみ箱に入っています（一覧の「ごみ箱」から戻せます）。</p></Show>
            <div class="v21-title-hero">
              <div class="v21-hero-cover" style={book().cover ? { 'background-image': `url(${book().cover})` } : { background: coverGradient(book().title) }}>
                <Show when={!book().cover}>{[...book().title][0]}</Show>
              </div>
              <div class="v21-hero-body">
                <input
                  class="v21-title-input"
                  value={book().title}
                  onInput={(e) => patchNotebookSoon(props.notebookId, { title: e.currentTarget.value })}
                  aria-label={isEvent() ? 'イベント名' : 'タイトル名'}
                />
                <Show when={book().subtitle}><p class="v21-subtitle">{book().subtitle}</p></Show>
                <p class="v21-dim">{scenes().length}場面 ・ 会話 {titleTalkCount(book())} ・ {namedCast(book()).length}人</p>
                <textarea
                  class="v21-synopsis"
                  rows={3}
                  placeholder={isEvent() ? 'Dict（どんな出来事か。イベント一覧に出ます）' : 'Dict・あらすじ（一覧とホームに出ます）'}
                  value={book().synopsis ?? ''}
                  onInput={(e) => patchNotebookSoon(props.notebookId, { synopsis: e.currentTarget.value })}
                />
                <Show when={isEvent()}>
                  <div class="v21-event-tagedit">
                    <p class="v21-kicker">EVENT のタグ</p>
                    <div class="v21-tagrow">
                      <span class="v21-tagrow-label">Title</span>
                      <For each={allTitles()} fallback={<span class="v21-dim v21-small">Title がありません</span>}>
                        {(t) => <button type="button" class="v21-tag-title" classList={{ on: !!book().titleIds?.includes(t.id!) }} aria-pressed={!!book().titleIds?.includes(t.id!)} onClick={() => toggleTitleTag(t.id!)}>{t.title || '無題'}</button>}
                      </For>
                    </div>
                    <For each={taggedTitles()}>
                      {(t) => (
                        <div class="v21-tagrow">
                          <span class="v21-tagrow-label">人物<small>{t.title || '無題'}</small></span>
                          <For each={namedCast(t)} fallback={<span class="v21-dim v21-small">この Title の登場人物がまだいません</span>}>
                            {(c) => {
                              const ref = `${t.id}:${c.id}`
                              return <button type="button" class="v21-tag-char" classList={{ on: !!book().characterRefs?.includes(ref) }} aria-pressed={!!book().characterRefs?.includes(ref)} onClick={() => toggleCharTag(ref)}>{c.name}</button>
                            }}
                          </For>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={!book().synopsis && titleSynopsis(book())}>
                  <p class="v21-dim v21-small">いまは本文から拾った文を仮に表示しています: {titleSynopsis(book())}</p>
                </Show>
              </div>
            </div>

            <div class="v21-title-tabs" role="tablist" aria-label="作品ページ">
              <button type="button" role="tab" classList={{ on: tab() === 'work' }} onClick={() => setTab('work')}>場面と登場人物</button>
              <button type="button" role="tab" classList={{ on: tab() === 'drafts' }} onClick={() => setTab('drafts')}>
                下書き<small>{draftsOf(props.notebookId).length}</small>
              </button>
              <button type="button" role="tab" classList={{ on: tab() === 'plot' }} onClick={() => setTab('plot')}>
                プロット<small>{flowOf(book()).rolls.reduce((n, r) => n + r.charts.reduce((m, c) => m + c.nodes.length, 0), 0)}</small>
              </button>
            </div>

            <Show when={tab() === 'plot'}>
              <PlotBoardV21 notebookId={props.notebookId} />
            </Show>

            <Show when={tab() === 'drafts'}>
              <DraftsV21 notebookId={props.notebookId} cast={cast().filter((c, i) => !isDefaultSlotName(c.name, i)).map((c) => c.name)} />
            </Show>

            <Show when={tab() === 'work'}>
            <div class="v21-title-cols">
              <section class="v21-panel">
                <div class="v21-panel-head">
                  <h3>場面（Scene）</h3>
                  <button type="button" class="v21-btn" onClick={() => { const p = addScene(book()); go({ name: 'talk', notebookId: props.notebookId, pageId: p.id }) }}>＋ 場面を足して書く</button>
                </div>
                <Show when={scenes().length} fallback={<p class="v21-dim v21-small">場面がありません。</p>}>
                  <div class="v21-scenes">
                    <For each={scenes()}>
                      {(page, i) => (
                        <button type="button" class="v21-scene" onClick={() => go({ name: 'talk', notebookId: props.notebookId, pageId: page.id })}>
                          <span class="v21-scene-no">{i() + 1}</span>
                          <span class="v21-scene-body">
                            <strong>{page.title || '無題'}</strong>
                            <Show when={lastDialogues(page, 1)[0]} fallback={<small class="v21-dim">会話なし</small>}>
                              {(line) => <small>{line().name}「{line().text || '…'}」</small>}
                            </Show>
                          </span>
                          <span class="v21-scene-count">会話 {pageTalkCount(page)}</span>
                          <span class="v21-scene-go">書く →</span>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </section>

              <section class="v21-panel">
                <div class="v21-panel-head">
                  <h3>登場人物</h3>
                  <button type="button" class="v21-btn" onClick={exportKeyDeck} title="番号つきのボタンとしてKeyDeckへ">KeyDeckへ書き出し</button>
                </div>
                <p class="v21-dim v21-small">9つの枠の並びが番号です。会話ログの <kbd>Alt</kbd>+<kbd>番号</kbd> と、KeyDeckのボタンの番号がそろいます。名前を変えると、作品の全セリフの名前も変わります。</p>
                <div class="v21-cast-list">
                  <Index each={cast()}>
                    {(c, i) => (
                      <div class="v21-cast-row">
                        <kbd>{i + 1}</kbd>
                        <Show when={c().portrait} fallback={<span class="v21-portrait v21-portrait-empty">{[...c().name][0] ?? '?'}</span>}>
                          <Portrait src={c().portrait!} alt={c().name} focusX={c().focusX} focusY={c().focusY} />
                        </Show>
                        <input
                          value={c().name}
                          classList={{ 'is-empty-slot': isDefaultSlotName(c().name, i) }}
                          aria-label={`${i + 1}番の名前`}
                          onChange={(e) => { commitName(i, e.currentTarget.value); e.currentTarget.value = cast()[i]?.name ?? '' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        />
                        <button type="button" class="v21-icon-btn" title="上へ" onClick={() => moveCastSlot(props.notebookId, cast(), i, -1)} disabled={i === 0}>↑</button>
                        <button type="button" class="v21-icon-btn" title="下へ" onClick={() => moveCastSlot(props.notebookId, cast(), i, 1)} disabled={i === cast().length - 1}>↓</button>
                        <button type="button" class="v21-icon-btn" title="空きにする（Character番号に戻す。今あるセリフの名前はそのまま）" onClick={() => clearCastSlot(props.notebookId, cast(), i)} disabled={isDefaultSlotName(c().name, i)}>×</button>
                      </div>
                    )}
                  </Index>
                </div>
                <div class="v21-cast-narr" title="全作品共通。会話ログでは名前を出さない">
                  <kbd>0</kbd>
                  <span class="v21-portrait v21-portrait-empty">地</span>
                  <span class="v21-cast-narr-name">ナレーション<small>全作品共通・名前は出さない（Alt+0）</small></span>
                </div>
                <form class="v21-cast-add" onSubmit={(e) => { e.preventDefault(); addCast() }}>
                  <input placeholder="空きの枠に名前を入れる（例: ミア）" value={draftName()} onInput={(e) => setDraftName(e.currentTarget.value)} />
                  <button type="submit" class="v21-btn">追加</button>
                </form>
                <Show when={notice()}><p class="v21-notice">{notice()}</p></Show>
              </section>
            </div>

            {/* Assets（納品された素材）。タブで All・Character・背景・エネミー・Item を選ぶ（2026-09-28） */}
            <Show when={book().assets?.length}>
              <section class="v21-panel v21-assets">
                <div class="v21-panel-head">
                  <h3>Assets</h3>
                  <span class="v21-dim v21-small">{book().assets!.length}点</span>
                  <button type="button" class="v21-link v21-select-toggle" aria-pressed={assetEdit()} onClick={() => setAssetEdit(!assetEdit())} title="分類を変える（立ち絵 → エネミー など）">{assetEdit() ? '完了' : '編集'}</button>
                </div>
                <div class="v21-asset-tabs" role="tablist" aria-label="Assets の分類">
                  <For each={ASSET_TABS}>
                    {(t) => (
                      <button type="button" role="tab" aria-selected={assetTab() === t.id} classList={{ on: assetTab() === t.id }} onClick={() => setAssetTab(t.id)}>
                        {t.label}<small>{assetCount(t.id)}</small>
                      </button>
                    )}
                  </For>
                </div>
                <Show when={shownAssets().length} fallback={<p class="v21-dim v21-small">この分類の素材はありません。{assetTab() === 'enemy' ? '「編集」で立ち絵をエネミーに変えられます。' : ''}</p>}>
                <div class="v21-asset-grid">
                  <For each={shownAssets()}>
                    {(a) => (
                      <figure class="v21-asset" classList={{ [a.kind]: true }} title={a.note || a.label}>
                        <img
                          src={a.path}
                          alt={a.label}
                          loading="lazy"
                          style={a.kind === 'character' || a.kind === 'enemy' ? { 'object-position': `${a.focusX ?? '50%'} ${a.focusY ?? '15%'}` } : undefined}
                        />
                        <figcaption>
                          <Show when={assetEdit()} fallback={<span>{ASSET_LABEL[a.kind as AssetKind] ?? a.kind}</span>}>
                            <select class="v21-asset-kind" value={a.kind} aria-label={`${a.label} の分類`} onChange={(e) => setAssetKind(a.id, e.currentTarget.value as AssetKind)}>
                              <For each={Object.entries(ASSET_LABEL)}>{([k, label]) => <option value={k}>{label}</option>}</For>
                            </select>
                          </Show>
                          {a.label}
                        </figcaption>
                      </figure>
                    )}
                  </For>
                </div>
                </Show>
              </section>
            </Show>
            </Show>
          </>
        )}
      </Show>
    </div>
  )
}

export default TitleV21
