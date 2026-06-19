# ScenarioBook 移植仕様

作成日: 2026-06-15

## 目的

ScenarioBook は、novel ゲームの会話ログをそのままシナリオ作成用ノートとして扱うための NOTE 内ステートです。

基本単位は「1ノート = 1イベント」です。各イベントは会話ログ形式の本文、カバー画像、登場キャラクター、用語、開発用タグ、プロンプトを持ちます。

## 移植元アプリ 1: InkNest

参照元: `C:\202604_claude_workspace\3000_App\InkNest`

主な参照ファイル:

- `src\componemts_ver2.2\CharacterNameList.jsx`
- `src\componemts_ver2.2\StorySupportPanel.jsx`
- `src\hooks\useCharacters.js`
- `src\componemts_ver2.2\memo\NoteEditor.jsx`

移植対象にした機能:

- キャラクター名ボタンを押すと、ノート本文へ `キャラクター名：` を挿入する。
- ブラケットモードでは `キャラクター名：「」` の形で挿入し、セリフ位置にカーソルを置く。
- キャラクターリストはイベントごとに保持する。
- キャラクターの追加・削除を記入パレット上で行う。
- 会話ログ本文は通常のテキストエリアに保持する。

今回の NOTE 版での調整:

- React + localStorage の `useCharacters` ではなく、Solid のアプリ状態 `state.scenarioBooks` に統合。
- ドラッグ並び替えは初回移植では見送り、まずは記入速度に関わるボタン挿入を優先。
- `Alt+1` などのショートカット登録は、既存 NOTE 側のキーマップ基盤が固まってから追加する。

## 移植元アプリ 2: sokucopy

参照元: `C:\05__claude_workspace\sokucopy`

主な参照ファイル:

- `src\components\TextBlock.tsx`
- `src\context\AppContext.tsx`
- `doc01\sokucopy_project_inventory_report_20260603.md`

移植対象にした機能:

- カテゴリごとに定型文を保持する。
- ボタン操作で登録済みテキストをワンアクション実行する。
- 編集中はグローバルショートカットを無効化する思想。
- 用語、開発用タグ、プロンプトなどを保存して再利用する。

今回の NOTE 版での調整:

- クリップボードコピーではなく、ScenarioBook 本文へのカーソル位置挿入を主目的にした。
- `term`、`devTag`、`prompt` の3種類のスニペットをイベントごとに保持する。
- スニペットは右側の記入パレットから追加・削除・挿入できる。
- ショートカットキーによる発火は初回移植では見送り、ボタン挿入を安定版とする。

## 新機能: カバー画像

ブログ記事と同じように、イベントごとにイメージ画像を1枚登録できます。

仕様:

- DB01 の画像付き Note から選択できる。
- 端末から画像をアップロードできる。
- カバー画像を削除できる。
- `coverType` は `none`、`product`、`upload` の3種類。

## データ構造

`ScenarioBookEvent`:

- `id`: イベントID
- `title`: イベントタイトル
- `body`: 会話ログ本文
- `cover`: カバー画像URLまたは Data URL
- `coverType`: カバー画像の由来
- `characters`: 旧互換用のキャラクターリスト
- `titleDb`: WordDB を分類する Title 一覧
- `wordDb`: キャラクター名、用語、場所、System用語などの挿入候補
- `recentWordIds`: 最近使った WordDB 候補
- `fixedTags`: 開発・エンジン連携用の固定タグ辞書
- `snippets`: 用語、開発タグ、プロンプト
- `tags`: イベント管理用タグ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

`ScenarioBookCharacter`:

- `id`: キャラクターID
- `name`: 表示名、挿入名
- `role`: 任意の役割メモ

## WordDB 方針

キャラクター名だけを独立した Character DB として扱うのではなく、ScenarioBook では WordDB に統合します。

理由:

- キャラクター名、場所名、用語、System用語、仮名などを同じ操作で挿入できる。
- アイディア段階では分類が変わりやすいため、Title別に緩く整理するほうが速い。
- Notion の tag select のように、候補がなければその場で作成できる。

`ScenarioBookTitle`:

- `id`: Title ID
- `title`: 分類名。例: `Character`、`Place`、`System`、`その他`

`ScenarioBookWord`:

- `id`: Word ID
- `titleId`: 所属 Title
- `label`: 候補表示名
- `content`: 本文へ挿入する文字列
- `relationIds`: 関連 Word ID

## 固定TAGS 方針

TAGS はできるだけ固定し、開発・エンジン側と連携できる辞書として扱います。

例:

- `fx_`: 演出
- `mood_`: 雰囲気
- `bgm_`: BGM
- `se_`: 効果音
- `bg_`: 背景
- `char_`: キャラクター識別
- `face_`: 表情
- `ev_`: イベント
- `flag_`: フラグ
- `req_`: 条件
- `memo_`: AI向け補助メモ

固定TAGSは自由入力タグとは分離します。本文へ挿入するだけでなく、イベントの `tags` にも保持します。

## Android 優先 UI

ScenarioBook の主な記入環境は Android とします。

実装方針:

- 右サイドバーは PC 向けの管理・確認用途にする。
- Android では footer を主操作面にする。
- footer は下から飛び出すパレットとして扱う。
- footer 上部に「開発窓」を置き、候補がなければ WordDB に追加できる。
- 検索窓の下に Title セレクトを置き、Title別に候補を絞る。
- 右端に時計マークの最近使った候補を置く。
- 候補をタップすると本文へ挿入し、Android では footer を自動で閉じる。

ショートカット:

- `Alt + Space`: footer パレット開閉

`ScenarioBookSnippet`:

- `id`: スニペットID
- `kind`: `term`、`devTag`、`prompt`
- `label`: ボタン表示名
- `content`: 本文へ挿入するテキスト

## 実装済み

- `Page` に `scenarioBook` を追加。
- `AppState` に `scenarioBooks` を追加。
- `addScenarioBookEvent`、`updateScenarioBookEvent`、`deleteScenarioBookEvent` を追加。
- `PageScenarioBook.tsx` を追加。
- サイドバーに `ScenarioBook` を追加。
- サンプルイベントを1件追加。
- WordDB、TitleDB、固定TAGS、最近使った候補を追加。
- Android優先の footer パレットを追加。
- `Alt + Space` で footer パレットを開閉。

## 次の候補

- WordDB を DB01 または専用 DB と同期する。
- TitleDB の追加・編集・並び替えを UI 化する。
- `Alt+1` から `Alt+9` で WordDB の上位候補を挿入する。
- スニペットをイベント単位ではなく、プロジェクト共通ライブラリとして保存する。
- 会話ログを JSON Lines 形式に変換するエクスポート機能を追加する。
- イベント同士の前後関係や分岐関係を Relation DB と接続する。
