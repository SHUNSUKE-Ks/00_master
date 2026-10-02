import { Dialog } from '@kobalte/core/dialog'
import { Tabs } from '@kobalte/core/tabs'
import { For, Show, createMemo, createSignal, onMount, type Component } from 'solid-js'
import {
  loadSandboxWorkspace,
  resetSandboxWorkspace,
  sandboxSeedInfo,
  saveSandboxWorkspace,
  type SandboxTab,
  type SandboxTheme,
  type SandboxWorkspace,
} from './sandboxStorage'
import { WIKI_CARDS, wikiCardById } from './wiki/wikiCards'

const LOG = '[APP04-CLAUDE-SANDBOX]'

const BOOK_TOC = [
  ['第1章', 'AIに「手足と安全」を与える — ハーネスとは', '1-1 モデルは賢いのに仕事が終わらない理由 / 1-2 2層構造 / 1-3 積層規則'],
  ['第2章', 'AIの脳を育てる — LLM Wiki', '2-1 毎回調べ直すAIをやめる / 2-2 残る知識と腐る知識 / 2-3 JSONが真実・MDは眺め / 2-4 品質ゲート'],
  ['第3章', '働き手を設計する — Agentと装備', '3-1 役割・装備・契約・engine / 3-2 1スロット1ファイル / 3-3 モデルの使い分け'],
  ['第4章', '「できました」を信じない — 検証と所有権', '4-1 実行中と報告したAIが動いていなかった話 / 4-2 VERIFY / 4-3 1成果物1オーナー'],
  ['第5章', '自分で回る仕組み — LoopとOrchestra', '5-1 定時に起きて1件だけ働く / 5-2 NO_WORKの価値 / 5-3 指揮者は1人'],
  ['第6章', '使うほど賢くなる — Skillの成長', '6-1 Learning Loop / 6-2 動いた実績からしかSkillを作らない / 6-3 人間承認という安全弁'],
  ['付録', '10日で1本つくる — 教材工房の実録', 'cycle 1全記録。準備中。'],
] as const

const FUTURE_CLIP_SAMPLE = [
  '{',
  '  "clipId": "clip_...",',
  '  "sourceDoc": "study-blog/.../manual.md",',
  '  "quote": "選択テキスト",',
  '  "anchor": { "prefix": "前20字", "suffix": "後20字" },',
  '  "note": "ユーザーの一言",',
  '  "clippedAt": "ISO",',
  '  "targetNote": "note_id"',
  '}',
].join('\n')

const TAB_LABELS: Record<SandboxTab, string> = {
  note: 'Note',
  wiki: 'WikiLLM',
  book: '技術書',
  lab: 'Design Lab',
}

const SandboxApp: Component = () => {
  const [workspace, setWorkspace] = createSignal<SandboxWorkspace>(loadSandboxWorkspace())
  const [resetOpen, setResetOpen] = createSignal(false)
  const [selectedCardId, setSelectedCardId] = createSignal<string | null>(null)
  const [notice, setNotice] = createSignal('Seedを読み込みました')
  const selectedCard = createMemo(() => wikiCardById(selectedCardId()))

  onMount(() => {
    const seed = sandboxSeedInfo()
    console.log(`${LOG} 0-1 Sandbox entry mounted`, { ...seed, cards: WIKI_CARDS.length })
  })

  function patchWorkspace(patch: Partial<SandboxWorkspace>, reason: string) {
    const next = { ...workspace(), ...patch, updatedAt: new Date().toISOString() }
    setWorkspace(next)
    saveSandboxWorkspace(next)
    setNotice(reason)
    console.log(`${LOG} 3-1 Sandbox workspace saved`, { reason, storagePrefix: sandboxSeedInfo().storagePrefix })
  }

  function changeTheme(theme: SandboxTheme) {
    patchWorkspace({ theme }, `Theme: ${theme}`)
    console.log(`${LOG} 2-1 Theme changed`, { theme })
  }

  function changeTab(value: string) {
    const activeTab: SandboxTab = value === 'wiki' || value === 'book' || value === 'lab' ? value : 'note'
    patchWorkspace({ activeTab }, `Tab: ${activeTab}`)
    console.log(`${LOG} 2-2 Tab changed`, { activeTab })
  }

  function confirmReset() {
    const next = resetSandboxWorkspace()
    setWorkspace(next)
    setResetOpen(false)
    setNotice('既知のSeed状態へ初期化しました')
    console.log(`${LOG} 3-2 Sandbox reset`, sandboxSeedInfo())
  }

  function openCard(cardId: string) {
    setSelectedCardId(cardId)
    console.log(`${LOG} 4-1 JsonCard opened`, { cardId })
  }

  return (
    <main class="sandbox-app" data-theme={workspace().theme}>
      <div class="sandbox-band" role="status">SANDBOX · Claude UI Trial · Production storage blocked</div>
      <header class="sandbox-header">
        <div class="sandbox-brand">
          <p class="sandbox-eyebrow">LEARNING NOTE / ISOLATED ENTRY</p>
          <h1>読む・引く・書く。</h1>
          <p>Note、WikiLLM資料、技術書を一つの机に置く学習ノートの試作。</p>
        </div>
        <div class="sandbox-header-actions">
          <button class="sandbox-button ghost" type="button" onClick={() => changeTheme(workspace().theme === 'midnight' ? 'paper' : 'midnight')}>Theme: {workspace().theme}</button>
          <Dialog open={resetOpen()} onOpenChange={setResetOpen}>
            <Dialog.Trigger class="sandbox-button danger">Reset</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay class="sandbox-dialog-overlay" />
              <Dialog.Content class="sandbox-dialog-content">
                <Dialog.Title>Sandboxを初期化しますか？</Dialog.Title>
                <Dialog.Description>本番Noteには触れず、sandbox_note01_ のデータだけを既知のSeedへ戻します。</Dialog.Description>
                <div class="sandbox-dialog-actions"><Dialog.CloseButton class="sandbox-button ghost">戻る</Dialog.CloseButton><button class="sandbox-button danger" type="button" onClick={confirmReset}>Seedへ戻す</button></div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </div>
      </header>

      <section class="sandbox-shell">
        <aside class="sandbox-sidebar">
          <p class="sandbox-eyebrow">LEARNING DESK</p>
          <nav class="sandbox-journey" aria-label="Learning note product">
            <button classList={{ active: workspace().activeTab === 'note' }} type="button" onClick={() => changeTab('note')}><b>01</b><span>Note<small>自分の言葉で書く</small></span></button>
            <button classList={{ active: workspace().activeTab === 'wiki' }} type="button" onClick={() => changeTab('wiki')}><b>02</b><span>WikiLLM<small>概念を引く</small></span></button>
            <button classList={{ active: workspace().activeTab === 'book' }} type="button" onClick={() => changeTab('book')}><b>03</b><span>技術書<small>人間が読む本</small></span></button>
          </nav>
          <div class="sandbox-boundary"><p class="sandbox-eyebrow">TEST BOUNDARY</p><strong>{sandboxSeedInfo().storagePrefix}*</strong><p>本番Store、Firebase、既存Notebookはimportしない。</p><div class="sandbox-status"><span />{notice()}</div></div>
        </aside>

        <section class="sandbox-workspace">
          <Tabs value={workspace().activeTab} onChange={changeTab}>
            <Tabs.List class="sandbox-tabs" aria-label="Learning note views">
              <For each={Object.entries(TAB_LABELS) as Array<[SandboxTab, string]>}>{([value, label]) => <Tabs.Trigger value={value}>{label}</Tabs.Trigger>}</For>
            </Tabs.List>

            <Tabs.Content value="note" class="sandbox-panel reading-surface">
              <p class="sandbox-eyebrow">01 / NOTE</p><h2>自分の言葉で残す</h2><p class="sandbox-lede">技術書で読んだことと、辞書で確認した概念を、自分の実装計画へつなげる場所。</p>
              <textarea aria-label="Sandbox note" value={workspace().note} onInput={(event) => patchWorkspace({ note: event.currentTarget.value }, 'Sandbox note saved')} />
              <button class="sandbox-dictionary-cta" type="button" onClick={() => openCard('concept_harness')}><span>辞書を引く</span><strong>Harness — ハーネスの型（2層定義）</strong><small>JsonCardを開く → 関連概念へ移動できる</small></button>
            </Tabs.Content>

            <Tabs.Content value="wiki" class="sandbox-panel reading-surface">
              <p class="sandbox-eyebrow">02 / WIKILLM MATERIAL</p><h2>長方形の辞書</h2><p class="sandbox-lede">Claude側Raw JSONを無変換コピーして表示。関連だけはSandbox索引で補っている。</p>
              <div class="sandbox-dict-grid"><For each={WIKI_CARDS}>{(card) => <button class="sandbox-dict-button" type="button" onClick={() => openCard(card.id)}><span>{card.type === 'concept' ? 'CONCEPT' : 'ENTITY'}</span><strong>{card.name}</strong><b>{card.title}</b><small>{card.summary}</small></button>}</For></div>
            </Tabs.Content>

            <Tabs.Content value="book" class="sandbox-panel reading-surface">
              <p class="sandbox-eyebrow">03 / TECH BOOK · TOC ONLY</p><h2>『AIが自分で働く環境のつくり方 — ハーネス入門』</h2><p class="sandbox-lede">本文はまだ作らない。WikiLLMの概念カードを土台にした第1巻の目次。</p>
              <ol class="sandbox-book-toc"><For each={BOOK_TOC}>{([number, title, items]) => <li><span>{number}</span><strong>{title}</strong><small>{items}</small><em>準備中</em></li>}</For></ol>
            </Tabs.Content>

            <Tabs.Content value="lab" class="sandbox-panel reading-surface">
              <p class="sandbox-eyebrow">DESIGN LAB</p><h2>Theme Token Demo</h2>
              <div class="sandbox-theme-grid"><button class="sandbox-token-card" classList={{ active: workspace().theme === 'midnight' }} onClick={() => changeTheme('midnight')} type="button"><strong>Midnight Study</strong><span>ink / shelf / turquoise</span></button><button class="sandbox-token-card" classList={{ active: workspace().theme === 'paper' }} onClick={() => changeTheme('paper')} type="button"><strong>Paper Study</strong><span>paper / brass / forest</span></button></div>
              <div class="sandbox-clip-contract"><p class="sandbox-eyebrow">FUTURE CLIP CONTRACT · NOT IMPLEMENTED</p><pre>{FUTURE_CLIP_SAMPLE}</pre><p class="sandbox-note">window.getSelection()による取得は、今回のSandboxでは実装しない。</p></div>
            </Tabs.Content>
          </Tabs>
        </section>
      </section>

      <Dialog open={selectedCardId() !== null} onOpenChange={(open) => { if (!open) setSelectedCardId(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay class="sandbox-dialog-overlay" />
          <Dialog.Content class="sandbox-dialog-content sandbox-card-dialog">
            <Show when={selectedCard()}>{(card) => <><p class="sandbox-eyebrow">{card().type.toUpperCase()} / JSON CARD</p><Dialog.Title>{card().name}</Dialog.Title><h3>{card().title}</h3><p class="sandbox-card-summary">{card().summary}</p><section class="sandbox-card-body"><For each={card().body.filter((line) => line.trim() && !line.startsWith('```'))}>{(line) => line.startsWith('## ') ? <h4>{line.slice(3)}</h4> : <p>{line.replaceAll('**', '')}</p>}</For></section><Show when={card().relations.length > 0}><section class="sandbox-relations"><p class="sandbox-eyebrow">RELATED CARDS</p><For each={card().relations}>{(relation) => { const target = wikiCardById(relation.target); return <button type="button" onClick={() => openCard(relation.target)}>{relation.type} · {target?.name ?? relation.target}</button> }}</For></section></Show><section class="sandbox-sources"><p class="sandbox-eyebrow">SOURCES</p><For each={card().sources}>{(source) => <p>{source}</p>}</For></section></>}</Show>
            <div class="sandbox-dialog-actions"><Dialog.CloseButton class="sandbox-button ghost">閉じる</Dialog.CloseButton></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </main>
  )
}

export default SandboxApp
