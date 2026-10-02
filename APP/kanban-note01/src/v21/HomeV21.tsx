import { type Component, For, Index, Show, createMemo } from 'solid-js'
import { state } from '../store'
import type { Notebook, NotebookPage } from '../types'
import { createTitle } from './actions'
import NoticesPanel from './NoticesPanel'
import {
  accessLog,
  coverGradient,
  go,
  isStoryNotebook,
  lastDialogues,
  pageTalkCount,
  scenePages,
  namedCast,
  titleSynopsis,
  titleTalkCount,
  updatedTime,
} from './nav'

// ホーム。よく使う物をパネルで並べる（情報設計 §2）
// 2026-09-27 利用者の指示: 「続きから書く」はゲームのセーブ＆ロード画面のような3スロット（横長の行を縦に並べる）。
// その上に「お知らせ」（納品・新しい画像・他の端末から）。ギャラリーはメニューから。書き方・登場人物のパネルは非表示（部品は残す）
const SLOT_COUNT = 3
const SHOW_CAST_PANEL = false
const SHOW_HOWTO_PANEL = false

type Spot = { nb: Notebook; page: NotebookPage }

const HomeV21: Component = () => {
  const titles = createMemo(() => state.notebooks.filter(isStoryNotebook).sort((a, b) => updatedTime(b) - updatedTime(a)))
  const findSpot = (nbId: string, pgId: string): Spot | null => {
    const nb = titles().find((n) => n.id === nbId)
    const page = nb?.pages.find((p) => p.id === pgId)
    return nb && page ? { nb, page } : null
  }

  // 続きから（3スロット）: 最後に開いた場面から新しい順 → 足りなければ会話のある場面で埋める
  const slots = createMemo<Array<Spot & { last?: string }>>(() => {
    const out: Array<Spot & { last?: string }> = []
    const seen = new Set<string>()
    const push = (spot: Spot | null, last?: string) => {
      if (!spot || out.length >= SLOT_COUNT) return
      const key = `${spot.nb.id}:${spot.page.id}`
      if (seen.has(key)) return
      seen.add(key)
      out.push({ ...spot, last })
    }
    const opened = Object.entries(accessLog())
      .filter(([key]) => key.startsWith('page:'))
      .sort((a, b) => b[1].last.localeCompare(a[1].last))
    for (const [key, v] of opened) {
      const [, nbId, pgId] = key.split(':')
      push(findSpot(nbId, pgId), v.last)
    }
    for (const nb of titles()) {
      const page = scenePages(nb).find((p) => pageTalkCount(p) > 0) ?? scenePages(nb)[0]
      if (page) push({ nb, page })
    }
    return out
  })
  const resume = () => slots()[0] ?? null
  const when = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return Number.isFinite(d.getTime()) ? `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''
  }

  // よく開く: 回数の多い順（同数なら新しい順）
  const frequent = createMemo(() =>
    Object.entries(accessLog())
      .sort((a, b) => b[1].count - a[1].count || b[1].last.localeCompare(a[1].last))
      .map(([key, value]) => {
        const [kind, nbId, pgId] = key.split(':')
        if (kind === 'title') {
          const nb = titles().find((n) => n.id === nbId)
          return nb ? { key, count: value.count, kind: 'タイトル', label: nb.title, sub: `${scenePages(nb).length}場面`, open: () => go({ name: 'title', notebookId: nb.id! }) } : null
        }
        const spot = findSpot(nbId, pgId)
        return spot ? { key, count: value.count, kind: '場面', label: spot.page.title || '無題', sub: spot.nb.title, open: () => go({ name: 'talk', notebookId: spot.nb.id, pageId: spot.page.id }) } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 6),
  )

  return (
    <div class="v21-page">
      <div class="v21-home">
        {/* お知らせ（納品・新しい画像・他の端末から） */}
        <NoticesPanel />

        {/* 続きから（セーブ＆ロード風の3スロット） */}
        <section class="v21-panel v21-resume">
          <p class="v21-kicker">続きから書く</p>
          <Show
            when={slots().length}
            fallback={
              <div class="v21-resume-empty">
                <h2>まだ作品がありません</h2>
                <p>タイトルを1つ作ると、ここに「続きから」が出ます。</p>
                <button type="button" class="v21-btn primary" onClick={createTitle}>＋ 新しいタイトル</button>
              </div>
            }
          >
            <div class="v21-slots">
              <Index each={Array.from({ length: SLOT_COUNT })}>
                {(_, i) => (
                  <Show
                    when={slots()[i]}
                    fallback={
                      <div class="v21-slot empty">
                        <span class="v21-slot-no">SLOT {i + 1}</span>
                        <p>空きスロット</p>
                        <small>場面を開くと、ここに並びます</small>
                      </div>
                    }
                  >
                    {(spot) => (
                      <article class="v21-slot" classList={{ latest: i === 0 }}>
                        <div class="v21-slot-top">
                          <span class="v21-slot-no">SLOT {i + 1}<Show when={when(spot().last)}><em>{when(spot().last)}</em></Show></span>
                          <button
                            type="button"
                            class="v21-btn primary v21-slot-go"
                            onClick={() => go({ name: 'talk', notebookId: spot().nb.id, pageId: spot().page.id })}
                          >
                            続きを書く
                          </button>
                        </div>
                        <div class="v21-resume-head">
                          <div class="v21-resume-cover" style={spot().nb.cover ? { 'background-image': `url(${spot().nb.cover})`, 'background-size': 'cover', 'background-position': 'center' } : { background: coverGradient(spot().nb.title) }}>
                            <Show when={!spot().nb.cover}>{[...spot().nb.title][0]}</Show>
                          </div>
                          <div class="v21-slot-names">
                            <button type="button" class="v21-slot-title" title="作品ページへ" onClick={() => go({ name: 'title', notebookId: spot().nb.id! })}>
                              {spot().nb.title || '無題'}
                            </button>
                            <p class="v21-dim">{spot().page.title || '無題'} ・ 会話 {pageTalkCount(spot().page)}</p>
                          </div>
                        </div>
                        <div class="v21-resume-lines">
                          <Show when={lastDialogues(spot().page, 2).length} fallback={<p class="v21-dim">この場面にはまだ会話がありません。</p>}>
                            <For each={lastDialogues(spot().page, 2)}>
                              {(line) => (
                                <div class="v21-line">
                                  <span class="v21-line-name">{line.name}</span>
                                  <span class="v21-line-text">{line.text || '…'}</span>
                                </div>
                              )}
                            </For>
                          </Show>
                        </div>
                      </article>
                    )}
                  </Show>
                )}
              </Index>
            </div>
          </Show>
        </section>

        {/* よく開く */}
        <section class="v21-panel v21-frequent">
          <div class="v21-panel-head"><h3>よく開く</h3></div>
          <Show when={frequent().length} fallback={<p class="v21-dim v21-small">開いた作品や場面が、回数の多い順にここへ並びます。</p>}>
            <div class="v21-freq-list">
              <For each={frequent()}>
                {(item) => (
                  <button type="button" class="v21-freq" onClick={item.open}>
                    <span class="v21-freq-kind">{item.kind}</span>
                    <span class="v21-freq-label">{item.label}</span>
                    <span class="v21-freq-sub">{item.sub}</span>
                    <span class="v21-freq-count">{item.count}回</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </section>

        {/* タイトル */}
        <section class="v21-panel v21-titles-panel">
          <div class="v21-panel-head">
            <h3>タイトル</h3>
            <button type="button" class="v21-link" onClick={() => go({ name: 'titles' })}>すべて見る（{titles().length}）</button>
          </div>
          <div class="v21-mini-titles">
            <For each={titles().slice(0, 4)}>
              {(nb) => (
                <button type="button" class="v21-mini-title" onClick={() => go({ name: 'title', notebookId: nb.id! })}>
                  <span class="v21-mini-cover" style={{ background: coverGradient(nb.title) }}>{[...nb.title][0]}</span>
                  <span class="v21-mini-body">
                    <strong>{nb.title}</strong>
                    <small>{titleSynopsis(nb) || 'あらすじ未設定'}</small>
                    <em>{scenePages(nb).length}場面 ・ 会話 {titleTalkCount(nb)}</em>
                  </span>
                </button>
              )}
            </For>
            <button type="button" class="v21-mini-title new" onClick={createTitle}>＋ 新しいタイトル</button>
          </div>
        </section>

        {/* 登場人物（非表示。部品は残す） */}
        <Show when={SHOW_CAST_PANEL}>
        <section class="v21-panel v21-cast-panel">
          <div class="v21-panel-head">
            <h3>登場人物</h3>
            <Show when={resume()}>
              {(spot) => <button type="button" class="v21-link" onClick={() => go({ name: 'title', notebookId: spot().nb.id! })}>編集</button>}
            </Show>
          </div>
          <Show
            when={resume() && namedCast(resume()!.nb).length}
            fallback={<p class="v21-dim v21-small">作品ページで登場人物を決めると、番号（Alt+番号・KeyDeckのボタン）で呼べます。</p>}
          >
            <p class="v21-dim v21-small">{resume()!.nb.title}</p>
            <div class="v21-chips">
              <For each={namedCast(resume()!.nb).slice(0, 9)}>
                {(c, i) => <span class="v21-chip"><kbd>{i() + 1}</kbd>{c.name}</span>}
              </For>
            </div>
          </Show>
        </section>
        </Show>

        {/* 書き方（非表示。部品は残す） */}
        <Show when={SHOW_HOWTO_PANEL}>
        <section class="v21-panel v21-howto">
          <div class="v21-panel-head"><h3>書き方</h3></div>
          <ol>
            <li><b>タイトル</b>を作り、<b>登場人物</b>を並べる（並び順が番号になる）</li>
            <li><b>会話ログ</b>で <kbd>Alt</kbd>+<kbd>番号</kbd>。その人のセリフが直下にできる</li>
            <li>KeyDeckへ書き出すと、iPadのボタンでも同じことができる</li>
          </ol>
        </section>
        </Show>
      </div>
    </div>
  )
}

export default HomeV21
