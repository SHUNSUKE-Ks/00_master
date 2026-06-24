# Study Blog 仕様書

## 1. 目的

Noteアプリの実装、設計判断、UI検証を技術要素へ分解し、次の用途で再利用する。

- 自分のSolidJS、状態駆動、スキャフォールド開発の学習
- Noteアプリの保守資料
- AIへ渡す実装指示Card
- 将来のLocal AI用知識資料
- 完成後の正本Manualを作るための原稿DB

## 2. 情報単位

### 2.1 Module

複数のCardを一緒に理解する必要がある場合の上位単位。
フォルダーではなく、前提知識と学習順を持つ。

```jsonc
{
  "moduleId": "state-driven",
  "名称": "状態駆動",
  "要約": "State、Action、Viewの関係を学ぶ",
  "前提": ["solid-basic"],
  "構成": ["state-001", "derived-001", "action-001"],
  "順序": ["state-001", "derived-001", "action-001"],
  "状態": "下書"
}
```

### 2.2 Card

単独で検索、参照、AI指示へ利用できる最小知識。
1 Cardは原則として1つの問い、機能、判断を扱う。

```jsonc
{
  "cardId": "notebook-back-001",
  "moduleId": "notebook-navigation",
  "題名": "Androidの戻る階層",
  "種別": ["機能", "改修", "指示"],
  "要約": "ページ、ページ一覧、Title一覧の戻る順を固定する",
  "三行要約": [],
  "概念": {
    "状態": "現在選択中のNotebookとPage",
    "遷移": "Pageから親Viewへ戻る操作",
    "復帰": "不整合時にTitle一覧を表示する"
  },
  "対象": ["PageNotebook.tsx"],
  "前提": ["state-selection-001"],
  "関連": ["mobile-navigation-001"],
  "後続": ["browser-history-001"],
  "版数": 1,
  "状態": "検証",
  "対象版": "kanban-note01@current"
}
```

### 2.3 Section

Card本文内の見出し単位。

| 見出し | 用途 |
| --- | --- |
| 要点 | 結論を短く記載 |
| 背景 | なぜ必要か |
| 構造 | State、Component、保存境界 |
| 実装 | コメント付きコード |
| 検証 | 操作手順と結果 |
| 関連 | 前提、関連、後続Card |

## 3. Relation

Card間の関係は階層だけで表現せず、有向リレーションとして保持する。

| 関係 | 意味 |
| --- | --- |
| `requires` | 先に理解すべきCard |
| `contains` | Moduleが含むCard |
| `relates` | 同時に参照すると理解しやすいCard |
| `continues` | 次に読むCard |
| `supersedes` | 旧版を置き換えるCard |
| `implements` | 仕様を実装したCard |
| `verifies` | 実装を検証したCard |

Moduleは主な学習経路、Relationは横断参照に使う。
同じCardを複数Moduleへ複製せず、主Moduleを1つ決めてRelationで接続する。

## 4. Card種別

| 種別 | 内容 |
| --- | --- |
| 概念 | SolidJS、状態駆動、派生状態 |
| 機能 | InBox、会話ログ、見出しRelation |
| 設計 | Store、Repository、保存境界 |
| 意匠 | Android配置、余白、文字、配色 |
| 改修 | 問題、原因、変更、検証 |
| 判断 | 採用案、不採用案、理由 |
| 指示 | AIへ渡す目的、制約、完了条件 |
| 用語 | 語句、意味、関連Card |

## 5. 開発Tag DB

Tagは自由入力を主にせず、専用DBから選択する。

```jsonc
{
  "技術": ["solidjs", "typescript", "vite", "pwa", "firebase", "dexie"],
  "設計": ["state", "action", "derived", "repository", "component"],
  "領域": ["notebook", "inbox", "scenario", "title-db", "study-blog"],
  "用途": ["study", "instruction", "task", "decision", "local-ai"],
  "状態": ["sprout", "draft", "verified", "adopted", "obsolete"]
}
```

Tag IDは英数字で固定し、画面表示名は日本語へ変換できるようにする。

## 6. 用語索引

```jsonc
{
  "termId": "derived-state",
  "語句": "派生状態",
  "意味": "既存Stateから計算され、重複保存しない値",
  "別名": ["derived", "computed"],
  "関連記事": ["derived-001"],
  "関連語": ["state", "createMemo"]
}
```

- 本文中の登録語句は関連記事へ遷移できる。
- 語句リンクが多すぎる場合、同一Card内では初出だけをリンクする。
- 用語の意味はCard本文と重複させず、Glossaryを参照する。

## 7. パンくずと目次

### パンくず

```text
Module > Card > H2 > H3
```

- スクロール位置から現在のH2/H3を判定する。
- Androidでは1行表示し、長い場合は中央を省略する。
- Module、Card、H2はタップで移動可能にする。

### 目次

- H2を主項目、H3を子項目として抽出する。
- H1はCard題名なので目次へ重複表示しない。
- 見出しIDは題名変更に影響されない安定IDを持たせる。
- 画面右端の縦型`目次`Buttonから、右側スライドインパネルを開く。
- 目次パネル表示中は本文側へOverlayを表示する。
- H2/H3選択時は安定した見出しIDへスクロールする。
- Androidでは選択後に目次パネルを閉じる。
- 現在見出し、パンくず、目次の選択状態は同じ派生状態から生成する。

### 三行要約

- `三行要約`はCardでは任意項目とする。
- 初期Study Card画面では表示を必須にしない。
- 将来の正本Blog Viewで、記事冒頭の要約欄として利用する。
- 正本化時に最大3文へ編集し、未検証Cardの要約は正本へ出さない。

## 7.1 Copy仕様

対象Blockは`code`、`json`、`schema`とする。

```jsonc
{
  "blockId": "code-state-001",
  "種別": "code",
  "言語": "typescript",
  "本文": "const selected = () => state.selectedId"
}
```

- CopyアイコンはBlock単位で表示する。
- Clipboard APIを第一候補として使う。
- 成功状態は約1.5秒後に通常アイコンへ戻す。
- Copy操作はCard本文や選択状態を変更しない。
- Local AI Exportでは装飾を除き、言語名と本文を保持する。

## 8. 検索仕様

### 初期検索

- クライアント内検索。
- 題名、要約、Tag、見出し、用語を対象にする。
- AND検索を基本とする。
- Module、種別、状態、技術Tagで絞り込む。

### Local AI向け

- Card単位のJSONを出力する。
- Module、Relation、Glossaryを別JSONで出力する。
- `cardId`、`版数`、`対象版`を必須とする。
- 表示用装飾を除いたMarkdown本文も保持する。

## 9. 版管理

```text
芽生 → 下書 → 検証 → 採用
                  └→ 旧版 → 保管
```

- `cardId`は意味単位のIDとして固定する。
- 内容更新時は`版数`を増やす。
- 採用済み版を直接上書きしない。
- 新版は`supersedes`で旧版へ接続する。
- 初期実装ではGit履歴を実体の版管理として利用する。
- 将来CMSを追加する場合も同じIDとRelationを継承する。

## 10. コードコメント規則

本体コードには処理内容の説明ではなく、設計意図と境界だけを書く。

```ts
// 戻路：Androidの戻る階層は、同じTitleのPage一覧へ戻す。
setSelectedPageId(null)
setMobileShelfMode('pages')
```

次はコメントしない。

```ts
// selectedPageIdをnullにする
setSelectedPageId(null)
```

詳しい解説、比較案、学習用コードはStudy Cardへ記載する。

## 11. 初期Module候補

| Module | 主なCard |
| --- | --- |
| Solid基礎 | Signal、Store、Show、For、派生状態 |
| 状態駆動 | State、Action、View、選択状態、画面遷移 |
| Note構造 | Notebook、Page、Mode、Character、Dialogue Log |
| 保存境界 | LocalStorage、Dexie、Firebase、同期状態 |
| PWA構成 | Service Worker、Cache、更新、Vercel |
| Android UI | 戻る階層、Bottom Sheet、固定Footer、レスポンシブ |
| AI連携 | InBox、指示Card、Report、JSON Export |
| 改修記録 | 問題、原因、変更、検証、残課題 |

## 12. 現行コードから見える優先改修

現時点で次のファイルは責務が大きい。

| ファイル | 現況 | 分割候補 |
| --- | --- | --- |
| `PageNotebook.tsx` | 約2500行。画面、保存、送信、Character、Logを保持 | hooks/actions、panels、mobile navigation |
| `store/index.ts` | 約1300行。Seed、State、CRUD、Firebase初期化を保持 | state、seed、actions、repositories |
| `index.css` | 約1800行。全画面とresponsiveを保持 | tokens、components、pages、mobile |

リファクタリング前に、現在動作をCard化し、変更単位ごとに検証条件を残す。

## 13. 初期実装範囲

### 含む

- 読み取り専用Study画面
- Module一覧
- Card一覧
- Card本文
- Tagフィルターと検索
- H2/H3目次
- 追従パンくず
- 関連Cardと用語リンク
- JSON/Markdownの静的データ

### 含まない

- アプリ内記事編集
- CMS承認画面
- 複数ユーザー権限
- 閲覧数、いいね、コメント
- AIによる自動書き換え

## 14. 機能受入条件

- Note_StoryメニューからStudyへ移動できる。
- AndroidでModule、Card、本文を順に閲覧できる。
- 戻る操作で空画面へ入らない。
- Moduleから構成Cardと前提Moduleを確認できる。
- Cardから前提、関連、後続へ移動できる。
- Tagと検索語でCardを絞り込める。
- H2/H3目次とパンくずが同期する。
- 右端の縦型目次Buttonからスライドイン目次を開閉できる。
- 見出し選択で本文位置へジャンプできる。
- Code、JSON、SchemaをBlock単位でコピーできる。
- 用語索引から定義と関連記事へ移動できる。
- 記事データをLocal AI向けJSONとして取り出せる構造になっている。

## 15. Global InBox境界

InBoxはScenario Notebookの子ページではなく、アプリ全体で共有する独立DBとして扱う。

```text
Header InBox
  → Global Composer
    → InboxItem Store
      ├ LocalStorage
      └ Firebase memoArchive / idea_inbox
```

- 全画面共通Headerから送信できる。
- 送信時の画面、Notebook、PageをSourceとして保持する。
- 左上メニューのInBoxは専用DB一覧へ移動する。
- Scenario内に重複する送信ボタンは置かない。
- 旧`story-inbox`ページは初回移行元としてのみ読む。
- JSON/Markdown ExportへGlobal InBoxを含める。
