# Claude Sandbox Consoleテスト TODO

作成日: 2026-07-12  
対象: `C:\00_master\APP\kanban-note01\sandbox.html`

総合進捗: `0 / 18`

## 目的

本番NoteのStore、Firebase、既存localStorageキーを参照せず、SolidUI風UIとKobalte部品を試す。

## Expected番号

```txt
0-1 2-1 2-2 3-1 3-2 4-1 4-2 4-3
```

Filter:

```txt
APP04-CLAUDE-SANDBOX
```

## Phase 0: 隔離確認

- [ ] `0-1` `sandbox.html` を開く。
  - 期待ログ: `[APP04-CLAUDE-SANDBOX] 0-1 Sandbox entry mounted`
- [ ] `0-2` 常時表示の赤い `SANDBOX` 帯が見える。
- [ ] `0-3` `npm run verify:sandbox` がpassする。

## Phase 1: SolidUI風部品

- [ ] `1-1` Preview / Components / Future Clip のTabsが切り替わる。
- [ ] `1-2` ResetでKobalte Dialogが開き、Escapeで閉じる。
- [ ] `1-3` ThemeボタンまたはTheme Cardで見た目だけが切り替わる。

## Phase 2: 保存と初期化

- [ ] `2-1` Theme変更でログが出る。
- [ ] `2-2` Tab切替でログが出る。
- [ ] `3-1` テストノートの入力で `sandbox_note01_workspace_v1` だけに保存される。
- [ ] `3-2` Reset確認後、Seed本文とMidnightテーマへ戻る。

## Phase 3: WikiLLM辞書と技術書目次

- [ ] `4-1` WikiLLMタブにConcept 7件、Entity 3件、合計10枚の長方形辞書カードが見える。
- [ ] `4-2` 辞書カードを押すとJsonCardが開き、name / title / summary / body / sourcesを読める。
- [ ] `4-3` JsonCard内のrelationを押すと、関連する隣のJsonCardへ移動できる。
- [ ] `4-4` 技術書タブに『AIが自分で働く環境のつくり方 — ハーネス入門』の第1巻目次が見える。

## 手動確認

```powershell
cd C:\00_master\APP\kanban-note01
npm run verify:sandbox
npm run build
npm run dev -- --host 127.0.0.1 --port 5186
```

開くURL:

```txt
http://127.0.0.1:5186/sandbox.html
```

## 合格条件

- [ ] 通常の `/` を開いてもSandboxへ遷移しない。
- [ ] Sandboxの保存キーは `sandbox_note01_` から始まる。
- [ ] Sandboxのソースに本番App / store / Firebase / dataBridgeのimportがない。
- [ ] Button / Dialog / Tabsの3種が動く。
- [ ] Raw JSONはコピー後に編集されず、RelationはSandbox専用索引で補われている。
