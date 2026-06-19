# ScenarioBook / WordDB Android優先 実装プラン

作成日: 2026-06-15

## 前提

対象アプリは `C:\00_master\APP\kanban-note01`。

以前検討した NOTE 側ではなく、このアプリの既存構造に合わせて ScenarioBook 機能を設計する。

`kanban-note01` にはすでに以下が存在する。

- `scenarioノート`
- `Title DB`
- `Character DB`
- `ノートブック`
- `story-notebooks`
- Android 向けの mobile 分岐を持つ `PageNotebook`

そのため、ScenarioBook は完全に別アプリとして足すのではなく、既存の「ストーリー制作ノート」を強化する方向で進める。

## 目的

novelゲーム、ADV、小説、漫画ネーム、動画コンテなどの会話ログを、Android で素早く記入できる状態にする。

1ノート、または1ページを1イベントとして扱い、会話ログをそのままシナリオ素材にする。

## 重要方針

### TAGS は固定辞書にする

TAGS はできるだけ固定し、開発やエンジン側と連携する。

想定カテゴリ:

- `fx_`: 演出
- `mood_`: 雰囲気
- `bgm_`: BGM
- `se_`: 効果音
- `bg_`: 背景
- `char_`: キャラクター識別
- `face_`: 表情
- `cg_`: イベントCG
- `ui_`: UI制御
- `cam_`: カメラ
- `ev_`: イベント
- `flag_`: フラグ
- `req_`: 条件
- `memo_`: AI向け補助メモ

固定TAGSは自由入力タグと分離する。

### Character DB は維持し、WordDB は補助語彙にする

Character DB はそのまま維持する。

ネームドキャラクター、レギュラーメンバー、作品内で継続管理したい人物は Character DB に置く。

WordDB はそれ以外の用語を一時的・発展的に入れていく補助語彙DBとする。

WordDB に入れるもの:

- 場所名
- アイテム名
- 組織名
- 世界観用語
- System用語
- プロンプト断片
- 仮名
- 頻出フレーズ
- まだ Character DB に昇格するか未定の名前

WordDB は以下を持つ。

- `id`
- `titleId`
- `label`
- `content`
- `relationIds`
- `lastUsedAt`
- `useCount`

### TitleDB で候補を分類する

WordDB の分類として TitleDB を使う。

初期候補:

- `Character`
- `Place`
- `System`
- `Prompt`
- `Term`
- `その他`

検索窓の下に Title セレクトを置き、Title別に貼り付け候補を絞る。

### Android優先

ほとんどの記入は Android で行う。

PC向けの右サイドバーより、Android の親指操作に近い footer パレットを優先する。

## UI方針

### footer パレット

画面下部に常設 footer を置く。

通常時:

- `WordDB` ボタン
- よく使う Character/Word 候補
- 右端に時計マークの「最近使ったもの」

展開時:

- 一番上に開発窓
- 検索窓
- Title セレクト
- Character DB / WordDB / TagsDB 候補一覧
- 最近使った候補

候補をタップしたら本文に挿入し、Android ではパレットを閉じる。

### footer 候補表示

footer 内のコピペ候補は、設定から2種類の View を切り替えられるようにする。

#### 丸角Tag式

短い候補を横並び・折り返しで表示する。

向いているもの:

- キャラクター名
- 短い用語
- `fx_`、`mood_` などの固定TAGS
- 最近使ったもの

利点:

- Androidで親指タップしやすい。
- 画面内に多くの候補を置ける。
- Notionの tag select に近い感触になる。

#### 1カラムLine式

候補を1行カードとして縦に並べる。

向いているもの:

- 説明付きの用語
- プロンプト断片
- 挿入内容が長い System 用語
- relation を確認しながら選びたい候補

利点:

- 誤タップしにくい。
- `label`、`content`、`relation`、`description` を確認しやすい。

初期設定は Android で軽く使える `丸角Tag式` にする。

### 開発窓

footer 展開時の一番上に配置する。

Notion の tag select のように、候補がなければその場で作る。

入力項目:

- 表示名
- 挿入テキスト
- Title分類

空欄の場合は表示名をそのまま挿入テキストとして扱う。

### 最近使ったもの

時計マークのアイコンでアクセスする。

仕様:

- WordDB 候補を挿入したら `recentWordIds` に追加
- 同じ候補は重複させない
- 最大12件程度
- `lastUsedAt` と `useCount` も後で使えるように持たせる

### 右サイドバー

PCでは補助的に使う。

用途:

- 固定TAGSの確認
- TagsDB の確認・編集
- WordDB / TitleDB の管理
- Character DB の確認
- System用プロンプト管理
- カバー画像やイベントメタ情報の管理

Androidでは主導線にしない。

## ショートカット

第一候補:

- `Alt + Space`: footer パレット開閉

追加候補:

- `Alt + 1〜9`: 表示中候補の上位を挿入
- `Alt + 0`: ナレーション
- `Ctrl + Space`: 検索フォーカス、または候補切替

注意:

Windows環境では `Alt + Space` がウィンドウメニューと衝突する可能性がある。問題が出た場合は `Alt + K` または `Ctrl + Space` に変更する。

## データ設計案

### ScenarioBookWord

```ts
type ScenarioBookWord = {
  id: string
  titleId: string
  label: string
  content: string
  relationIds: string[]
  lastUsedAt?: Date
  useCount?: number
}
```

### ScenarioBookTitle

```ts
type ScenarioBookTitle = {
  id: string
  title: string
  order: number
}
```

### FixedScenarioTag

```ts
type FixedScenarioTag = {
  id: string
  tag: string
  group: 'fx' | 'mood' | 'bgm' | 'se' | 'bg' | 'char' | 'face' | 'cg' | 'ui' | 'cam' | 'ev' | 'flag' | 'req' | 'memo'
  label: string
  description?: string
}
```

### TagsDB

固定TAGSを見られるDBとして作る。

```ts
type TagsDbItem = {
  id: string
  tag: string
  group: 'fx' | 'mood' | 'bgm' | 'se' | 'bg' | 'char' | 'face' | 'cg' | 'ui' | 'cam' | 'ev' | 'flag' | 'req' | 'memo'
  label: string
  description?: string
  locked: boolean
  order: number
}
```

`locked: true` のタグは開発・エンジン連携用の固定タグとして扱う。

### FooterCandidateViewMode

```ts
type FooterCandidateViewMode = 'pill' | 'line'
```

- `pill`: 丸角のTag式。短い候補を横に並べて素早くタップする。
- `line`: 1カラムのライン式。説明文や挿入内容を見ながら選ぶ。

### ScenarioBookState

```ts
type ScenarioBookState = {
  wordDb: ScenarioBookWord[]
  titleDb: ScenarioBookTitle[]
  tagsDb: TagsDbItem[]
  recentWordIds: string[]
  activeTitleId: string | null
  paletteOpen: boolean
  footerCandidateViewMode: FooterCandidateViewMode
}
```

## 実装フェーズ

### Phase 1: 設計の受け皿を追加

- `src/types/index.ts` に WordDB / TitleDB / TagsDB / footer表示設定の型を追加
- `src/store/index.ts` に初期データと更新関数を追加
- 既存の `Product` / `Nutrient` とは分け、ScenarioBook 用の状態として持つ
- Character DB は既存の `Character DB` として維持し、WordDB に統合しない

完了条件:

- TypeScript 型が通る
- build が通る
- 既存ページの表示が壊れない

### Phase 2: Android footer パレット

- `ScenarioWordFooter.tsx` を追加
- footer 通常状態を作る
- 展開パレットを作る
- 検索窓を作る
- Title セレクトを作る
- 時計マークの最近使ったものを作る
- footer候補の表示形式を `pill` と `line` で切り替えられるようにする

完了条件:

- Android幅で下部操作だけで候補を探せる
- 候補タップで本文へ挿入できる
- タップ後に footer が閉じる
- 丸角Tag式と1カラムLine式を切り替えられる

### Phase 3: 開発窓

- footer 展開時の最上部に開発窓を追加
- 候補がない場合に WordDB へ追加
- 追加後すぐに本文へ挿入
- `その他` Title を初期作成して逃げ場にする

完了条件:

- 新しいキャラクター名や用語をその場で作れる
- 作成した候補が以後の検索に出る

### Phase 4: TagsDB 連携

- `system_tags_reference.md` 相当のTAGSを TagsDB として初期データ化
- footer の Title セレクトに `TAGS` を追加
- TagsDB を一覧表示できるページまたはパネルを作る
- 固定TAGSを本文へ挿入
- イベントまたはページのメタ情報にも tag として保持できる形にする

完了条件:

- `fx_`、`mood_`、`bgm_` などを検索して挿入できる
- 自由入力タグと固定TAGSを分けて扱える
- TagsDB を目視確認できる

### Phase 4.5: 設定パネルへの表示切替追加

- SettingsPanel に footer候補表示形式の設定を追加
- 選択肢は `丸角Tag式` と `1カラムLine式`
- Android では切替しやすい segmented control 形式にする

完了条件:

- 設定から表示形式を変更できる
- footer パレット側が設定に追従する

### Phase 5: Notebook / Memo への接続

候補1:

- `PageNotebook` の編集モード下部に footer パレットを接続する。

候補2:

- `PageMemo` の scenarioノートに先に接続する。

推奨:

- まず `PageNotebook` に接続する。
- 理由は、すでに `story-notebooks` と Android mobile 分岐があり、1ページ=1イベントにしやすいため。

完了条件:

- ノートブックページ本文に WordDB / TAGS を挿入できる
- Character DB の候補も footer から挿入できる
- 既存のプレビュー/編集切替を壊さない

### Phase 6: 保存と同期

- まずはローカル state で動かす
- 次に Firestore 保存対象を検討する
- `story-notebooks` の Markdown 読み込みと衝突しないようにする

完了条件:

- ページ本文の保存が現状どおり動く
- WordDB / TitleDB / 固定TAGS の保存先方針が決まる
- TagsDB と footer表示設定の保存先方針が決まる

## 最初の実装対象

最初に作るもの:

1. 型追加
2. store追加
3. `ScenarioWordFooter.tsx`
4. footer候補表示モード設定
5. `PageNotebook` 編集モードへの接続
6. Android幅での動作確認

## 注意

`APP\Note` 側に行った試作変更は、この計画の正規対象ではない。

必要であれば後で `APP\Note` 側の変更を取り消すか、参考実装として残すかを別途判断する。
