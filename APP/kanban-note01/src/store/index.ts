import { createStore } from 'solid-js/store'
import type { Page, BlogMode, FontSize, Blog, Memo, Notebook, NotebookPage, Product, Nutrient, Symptom, DbView, ColumnDef, InboxItem } from '../types'
import { PRODUCTS } from '../db/products'
import { NUTRIENTS } from '../db/nutrients'
import { SYMPTOMS } from '../db/symptoms'
import {
  fetchMemos, addMemoFs, updateMemoFs, deleteMemoFs,
  fetchBlogs, addBlogFs, updateBlogFs, restoreBlogFs, deleteBlogFs,
  fetchNotebooks, addNotebookFs, updateNotebookFs, deleteNotebookFs,
  fetchProducts, updateProductFs, seedProductsFs,
  fetchNutrients, updateNutrientFs, seedNutrientsFs,
  fetchIdeaInboxItems, sendIdeaInboxToFirebase,
  firebaseEnabled,
} from '../db/firebase'

export type DbStatus = 'idle' | 'connecting' | 'connected' | 'error'
export type DbTitleKey = 'db01' | 'db02'

export type AppState = {
  page: Page
  galleryReturnPage: Page
  blogMode: BlogMode
  fontSize: FontSize
  darkMode: boolean
  dbView: DbView
  selectedProductId: string | null
  selectedNutrientId: string | null
  selectedBlogId: string | null
  selectedMemoId: string | null
  selectedNotebookId: string | null
  selectedNotebookPageId: string | null
  sidebarOpen: boolean
  settingsPanelOpen: boolean
  galleryPanelOpen: boolean
  blogFilterTags: string[]
  products: Product[]
  nutrients: Nutrient[]
  symptoms: Symptom[]
  memos: Memo[]
  blogs: Blog[]
  trashBlogs: Blog[]
  notebooks: Notebook[]
  inboxItems: InboxItem[]
  inboxComposerOpen: boolean
  db01Columns: ColumnDef[]
  db02Columns: ColumnDef[]
  db03Columns: ColumnDef[]
  db10Columns: ColumnDef[]
  dbTitles: Record<DbTitleKey, string>
  dbStatus: DbStatus
}

const FONT_SIZE_PX: Record<FontSize, number> = { s: 13, m: 16, l: 19, xl: 22 }

function initFontSize(): FontSize {
  if (typeof window === 'undefined') return 'l'
  return window.innerWidth < 768 || (window.innerHeight <= 500 && window.matchMedia('(orientation: landscape)').matches)
    ? 'm'
    : 'l'
}

function initDarkMode(): boolean {
  const saved = localStorage.getItem('note00-dark-mode')
  const isDark = saved === null ? true : saved === 'true'
  if (isDark) document.documentElement.classList.add('dark')
  return isDark
}

function initSidebarOpen(): boolean {
  return typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerHeight > 500 : true
}

export const DB01_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Title',       visible: true,  locked: true  },
  { id: 'category',    label: 'Genre',       visible: true,  locked: false },
  { id: 'description', label: 'Synopsis',    visible: true,  locked: false },
  { id: 'workState',   label: 'Work State',  visible: true,  locked: false },
  { id: 'headingRef',  label: '見出し参照',  visible: true,  locked: false },
  { id: 'headingMode', label: '参照Mode',    visible: true,  locked: false },
  { id: 'symptoms',    label: 'State',       visible: true,  locked: false },
  { id: 'effects',     label: 'Plot',        visible: true,  locked: false },
  { id: 'ingredients', label: 'Characters',  visible: true,  locked: false },
  { id: 'image',       label: 'Cover',       visible: false, locked: false },
  { id: 'memo',        label: 'Note',        visible: true,  locked: false },
]

export const DB02_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Character',    visible: true,  locked: true  },
  { id: 'description', label: 'Profile',      visible: true,  locked: false },
  { id: 'products',    label: 'Linked Titles', visible: true, locked: false },
  { id: 'memo',        label: 'Memo',         visible: true,  locked: false },
]

export const DB03_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',     label: 'Relation Key', visible: true, locked: true  },
  { id: 'products', label: 'Linked Count', visible: true, locked: false },
  { id: 'category', label: 'Type',         visible: true, locked: false },
]

export const DB10_COLUMNS_DEFAULT: ColumnDef[] = [
  { id: 'name',        label: 'Status',       visible: true, locked: true  },
  { id: 'description', label: 'Description',  visible: true, locked: false },
  { id: 'products',    label: 'Linked Notes', visible: true, locked: false },
  { id: 'memo',        label: 'Memo',         visible: true, locked: false },
]

const INITIAL_BLOGS: Blog[] = []
const INITIAL_MEMOS: Memo[] = [
  {
    id: 'scenario-note-initial',
    title: 'scenarioノート',
    body: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const IDEA_PAGE_INDEX: NotebookPage = {
  id: 'idea-index-ai-md',
  title: '00_アイディア索引',
  body: `# アイディア索引

AIがアイディア帳を参照するとき、まず見る仮目次。
各アイディア本文とは混ぜず、タイトル、説明、tag、参照先だけを置く。

| タイトル名 | 説明 | tags | path |
| --- | --- | --- | --- |
| 筋トレイベント / フォーエバーナイン | 悪い魔術士が99回地獄で少しずつ変わるギャグイベント | idea, event_seed, gag, character_growth | idea-workout-event-forever-nine |
| アンダーテイカー | 死んだことにされた者たちが必要悪として任務をこなすコンセプト | idea, concept, dark_hero, mission_series | idea-undertaker-concept |
| 魔法使いになりたかった少年 | まだ芽生え段階。少年の願望だけを置く | idea, idea_sprout, fantasy | idea-sprout-boy-wanted-mage |
| 私をもう破壊神ではないのだから | まだ芽生え段階。破壊神ではなくなった存在の告白、拒絶、再定義 | idea, idea_sprout, fantasy, former_destroyer | idea-sprout-not-destroyer-anymore |
| SRPG_聖女_基本シナリオ | 聖女が騎士に加護と予言を与え、外敵と戦うゲームシナリオ | idea, game_scenario, srpg, saint, auto_chess | idea-game-scenario-saint-srpg |
| ショートストーリー_豪華特典 | 通販の豪華特典として筋トレトレーナーが届く短編コメディ | idea, short_story, gag, fitness, delivery | idea-short-story-gorgeous-bonus |

## Tag Rule
- idea: アイディア帳内の素材
- idea_sprout: まだ1行から育てる芽生え
- concept: 物語の核や設定
- event_seed: 単発イベント候補
- short_story: 短編として成立させる小ネタ、掌編、会話劇
- game_system: ゲームのシステム追加、ルール、UI、バトル、拠点など
- app: アプリ、ツール、制作支援UIのアイディア
- game_scenario: ゲーム化を前提にしたシナリオ
- srpg: SRPG構造を持つ
- saint: 聖女、教会、加護に関係する
- auto_chess: オートチェス戦闘構造
`,
  scenarioBody: `# アイディア索引
## 参照ルール
### AIはまずこのページを見る
### 本文とは混ぜない
### tagsで回収する
## Tags
### idea
### idea_sprout
### concept
### event_seed
### short_story
### game_system
### app
### game_scenario
### srpg
### saint
### auto_chess`,
  order: 0,
}

const IDEA_PAGE_WORKOUT_EVENT: NotebookPage = {
  id: 'idea-workout-event-forever-nine',
  title: '筋トレイベント / フォーエバーナイン',
  body: `# 筋トレイベント

## Type
ギャグイベント / Event Seed / キャラクター成長

## Core
悪い魔術士が捕まり、99から上の数字がない筋トレ地獄に巻き込まれる。
何回上げても99までしかカウントされない。

## Scene Seed フォーエバーナイン
悪い魔術士が捕まる。

貧弱、貧弱、貧弱。

魔術士：
「わかった。もう話すから、知ってることはぜんぶ話すから」

魔術士：
「あ、刑事さん助けて、99から上の数字がないんです」

何回上げても99までしかカウントされない。

「99！！ 99！！ 22回目の99！！」

## Scene 取調室
ちょっとムキムキになった魔術士が、待合室で自白する。

## Scene 夜の牢屋
魔術士：
「こんな事やってられるか。逃げ出してやる」

牢屋の格子を手で開く。

## 回想
逃げるのか？
ここで逃げたら、今までのことが全部無駄になるぞ。
終わった後のドリンクがうまいだろ。

魔術士：
「何なんだよ。この雨とムチは」

## Inner Theme
僕は魔法が使えるようになりたかったんじゃない。
弱い自分が嫌で変わりたかったんだ。
今逃げ出したら、後悔する。

## Punchline
魔道士と筋肉のコラボレーション
`,
  scenarioBody: `# 筋トレイベント
## Scene Seed フォーエバーナイン
### 悪い魔術士が捕まる
### 99から上の数字がない
### 22回目の99
## Scene 取調室
### ちょっとムキムキになった魔術士
### 待合室で自白する
## Scene 夜の牢屋
### 逃げ出そうとする
### 牢屋の格子を手で開く
## 回想
### 逃げるのか？
### 今までのことが無駄になるぞ
### 終わった後のドリンクがうまいだろ
## Inner Theme
### 魔法ではなく変わりたかった
### 弱い自分が嫌だった
### 今逃げたら後悔する
## Punchline
### 魔道士と筋肉のコラボレーション`,
  order: 1,
}

const IDEA_PAGE_UNDERTAKER: NotebookPage = {
  id: 'idea-undertaker-concept',
  title: 'アンダーテイカー',
  body: `# アンダーテイカー

## Type
Concept / Premise / Scene Seed

## Concept
現在の国の法に背いてまで正義を貫いたり、大切なものを守るために戦った人間を、アンダーテイカーは処分するふりをして埋葬する。
棺桶から秘密の通路に逃がす。

## Premise
彼らは死んだものとされる。
その代わり秘密組織に属し、この世の悪を討つ必要悪となる。
生きていたころの家族や恋人には一生会えない。
生きていることを知られてはならない。

## Scene Seed 01 雨の処分前
罪を犯した主人公が雨の中、アンダーテイカーに詰め寄られる。

主人公：
「なんでだよ、なんで俺が処分されなきゃならないんだよ」

アンダーテイカー：
「それが、神の源」

重い打撃音が響く。

## Scene Seed 02 プロローグ さびれた教会
主人公は棺の中にいる。実は眠らされている。
棺が閉じられる。
神父の合図で、棺の秘密の扉が開き、死体が隠し通路に落ちて秘密の部屋に招かれる。

## Rule / Theme
俺たちは死人だ。
痕跡を残さない。
生きていることが知られれば、また処分の対象になる。
その命、なんのために使う？
名を捨てろ。

## Line Seed
彼らはもう。
死なすには惜しい命だ。
悲劇が起こる前に止めるのだろう。

## Open Question
- 主人公の罪状
- 神の源とは何か
- アンダーテイカーは個人か組織か
- 占いばあさんの役割
`,
  scenarioBody: `# アンダーテイカー
## Concept
### 処分するふりをして埋葬する
### 棺桶から秘密通路に逃がす
## Premise
### 彼らは死んだものとされる
### 秘密組織に属して悪を討つ
### 家族や恋人には会えない
## Scene Seed 01 雨の処分前
### 主人公が詰め寄る
### それが、神の源
### 重い打撃音
## Scene Seed 02 さびれた教会
### 棺の中の主人公
### 秘密の扉
### 隠し通路と秘密の部屋
## Rule / Theme
### 俺たちは死人だ
### 痕跡を残さない
### 名を捨てろ
## Open Question
### 主人公の罪状
### 神の源
### 占いばあさん`,
  order: 2,
}

const IDEA_PAGE_MAGIC_BOY_SPROUT: NotebookPage = {
  id: 'idea-sprout-boy-wanted-mage',
  title: 'アイディア芽生 / 魔法使いになりたかった少年',
  body: `# 魔法使いになりたかった少年

## Tags
idea, idea_sprout, fantasy
`,
  scenarioBody: `# 魔法使いになりたかった少年
## Tags
### idea
### idea_sprout
### fantasy`,
  order: 3,
}

const IDEA_PAGE_NOT_DESTROYER_SPROUT: NotebookPage = {
  id: 'idea-sprout-not-destroyer-anymore',
  title: 'アイディア芽生 / 私をもう破壊神ではないのだから',
  body: `# 私をもう破壊神ではないのだから

## Tags
idea, idea_sprout, fantasy, former_destroyer
`,
  scenarioBody: `# 私をもう破壊神ではないのだから
## Tags
### idea
### idea_sprout
### fantasy
### former_destroyer`,
  order: 4,
}

const IDEA_PAGE_SAINT_SRPG: NotebookPage = {
  id: 'idea-game-scenario-saint-srpg',
  title: 'SRPG_聖女_基本シナリオ',
  body: `# SRPG_聖女_基本シナリオ

## Type
Game Scenario / SRPG / Base Concept

## Tags
idea, game_scenario, srpg, saint, church, blessing, auto_chess, prophecy

## Core
外から魔族が攻めてくる。
教会はいつでも兵士を募集していた。
聖女に会うことで加護がもらえる。

## Battle System
オートチェスSRPGで戦う騎士たちに、聖女が加護を与える物語。
聖女は千里眼でお抱えの騎士たちの現状を見ることができる。

## Base System
教会に毎回兵士たちが会いに来る。
そこで兵士に加護を与えて、戦地に送り出す。
予言を与えて、騎士がどこへ向かうか指示を出すことができる。

## Open Question
- 聖女は戦場へ直接出るのか
- 加護の種類
- 予言が外れた時のペナルティ
- 騎士ごとの信仰、性格、相性
`,
  scenarioBody: `# SRPG_聖女_基本シナリオ
## Core
### 外から魔族が攻めてくる
### 教会は兵士を募集している
### 聖女に会うことで加護がもらえる
## Battle System
### オートチェスSRPG
### 騎士たちに加護を与える
### 千里眼で現状を見る
## Base System
### 兵士が教会に会いに来る
### 加護を与えて戦地へ送る
### 予言で進路を指示する
## Tags
### game_scenario
### srpg
### saint
### auto_chess
### prophecy`,
  order: 5,
}

const IDEA_PAGE_GORGEOUS_BONUS_SHORT: NotebookPage = {
  id: 'idea-short-story-gorgeous-bonus',
  title: 'ショートストーリー_豪華特典',
  body: `# ショートストーリー_豪華特典

## Type
Short Story / Gag / Fitness Comedy

## Tags
idea, short_story, gag, fitness, delivery, trainer, product_bonus

## Core
通販で筋トレ道具を買ったら、豪華特典として配達してくれたお兄さんが筋トレトレーナーだった。

## Synopsis
通販で買った筋トレ道具一式。
これで僕も強くなるんだ。

そうだ。豪華特典がついてくるって言ってたけど、どれだろう。

ピンポン。

## Scene Seed 配達後
主人公：
「まだ、なにか用ですか？」

配達員：
「どうも、豪華特典です」

配達員：
「僕の任務は君にこのゴルザーXを届けることではない」

配達員：
「君をゴルザーXまで届けることだ」

## Gag Beat
配達員：
「あぶない！！」

危うく、カポルところだった。

配達員：
「敵はどこに潜んでるかわからない」

配達員：
「大丈夫、君は僕が守るよ」

一瞬、ときめきかけた自分に危機感を覚えてきた。

## Punchline
配達員：
「大丈夫。自分のプロテイン代は自分で払う」

他は全部払わないつもりだ。この人。

## Open Question
- ゴルザーXとは何か
- カポルとは何か
- 豪華特典の契約期間
- 主人公が返品しようとした時の展開
`,
  scenarioBody: `# ショートストーリー_豪華特典
## Core
### 通販の豪華特典が筋トレトレーナー
### ゴルザーXを届けるのではなく主人公を届ける
## Scene Seed
### まだ、なにか用ですか？
### どうも、豪華特典です
### 君をゴルザーXまで届けることだ
## Gag Beat
### 危うくカポルところだった
### 敵はどこに潜んでるかわからない
### 君は僕が守るよ
## Punchline
### 自分のプロテイン代は自分で払う
### 他は全部払わないつもりだ
## Tags
### short_story
### gag
### fitness
### delivery
### trainer`,
  order: 6,
}

const SETTING_PAGE_SCENARIO_RULES: NotebookPage = {
  id: 'setting-scenario-rules-narou-kakuyomu',
  title: 'scenarioルール / 小説家になろう・カクヨム型',
  body: `# scenarioルール

小説家になろう、カクヨム型の投稿文体ルール。
現段階では設定として保持するだけ。本文アイディアとは混ぜない。

## 小説ルール

### 文字数
- 目安: 40文字 x 3行
- 1話: 2000〜4000文字を基本にする

### 文字ルール
- 120〜150文字ごとに、上下へ1行空ける
- 地の文の1行目は1マス目を空ける
- 読者がスマホで読んだ時に詰まりすぎないことを優先する

### 会話ルール
- 「」の上下は1行空ける
- 連続会話は行を空けずに連続で書く
- 「」内の会話が続く時は、テンポを優先する

### 記号ルール
- 三点リーダーは「……」を使う
- 三点リーダーは点6個で統一する

### 階層ルール
- 大きい階層: 第一章
- 小さい階層: 第一話
- 章と話の関係を崩さない

## AI参照メモ
- このページは執筆時の整形ルールとして参照する
- アイディア、プロット、本文とは別扱い
- NovelEngine用JSON変換時には直接混ぜない
`,
  scenarioBody: `# scenarioルール
## 小説ルール
### 40文字 x 3行
### 1話 2000〜4000文字
## 文字ルール
### 120〜150文字で上下に1行空ける
### 地の文1行目は1マス空ける
## 会話ルール
### 「」の上下は1行空ける
### 連続会話は行を空けない
## 記号ルール
### 三点リーダーは……
### 点6個で統一
## 階層ルール
### 第一章
### 第一話`,
  order: 0,
}

const SETTING_NOTEBOOK: Notebook = {
  id: 'story-settings',
  title: 'setting',
  storyOnly: true,
  pages: [SETTING_PAGE_SCENARIO_RULES],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const COMMENT_STATUS_PAGE: NotebookPage = {
  id: 'comment-inbox-status-json',
  title: '00_comment_inbox_status.json',
  body: `{
  "schema": "kanban-note01.comment_inbox.v0_1",
  "purpose": "出先から送られたコメント、依頼、AI返信の対応状態をCodexが確認するためのJSON",
  "statusRule": {
    "inbox": "未確認",
    "working": "対応中",
    "needs_retry": "送信失敗。再送または確認が必要",
    "done": "対応済み。Archiveへ移動候補",
    "archived": "Archiveへ蓄積済み"
  },
  "threads": []
}`,
  scenarioBody: `# comment_inbox_status.json
## schema
### kanban-note01.comment_inbox.v0_1
## status
### inbox
### working
### needs_retry
### done
### archived`,
  order: 0,
}

const COMMENT_ARCHIVE_PAGE: NotebookPage = {
  id: 'comment-archive-json',
  title: 'Archive / 対応済みコメント.json',
  body: `{
  "schema": "kanban-note01.comment_archive.v0_1",
  "purpose": "対応済みコメントとAI返信を蓄積するArchive",
  "archivedThreads": []
}`,
  scenarioBody: `# Archive / 対応済みコメント
## archivedThreads
### 対応済みコメントを蓄積する`,
  order: 1,
}

const COMMENT_NOTEBOOK: Notebook = {
  id: 'story-comments',
  title: 'コメント',
  storyOnly: true,
  pages: [COMMENT_STATUS_PAGE, COMMENT_ARCHIVE_PAGE],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const INBOX_TAG_DB_PAGE: NotebookPage = {
  id: 'inbox-tag-db',
  title: 'tagDB',
  body: `{
  "schema": "kanban-note01.inbox_tag_db.v0_1",
  "tags": [
    "app",
    "codex_consult_seed",
    "game_system",
    "note_app_improvement",
    "task_memo"
  ]
}`,
  scenarioBody: `# tagDB
## app
## codex_consult_seed
## game_system
## note_app_improvement
## task_memo`,
  order: 0,
}

const INBOX_ARCHIVE_PAGE: NotebookPage = {
  id: 'inbox-archive',
  title: 'Archive',
  body: `{
  "schema": "kanban-note01.inbox_archive.v0_1",
  "items": []
}`,
  scenarioBody: `# Archive
## 対応済みInBoxを蓄積`,
  order: 1,
}

const INBOX_NOTEBOOK: Notebook = {
  id: 'story-inbox',
  title: 'InBox',
  storyOnly: true,
  pages: [INBOX_TAG_DB_PAGE, INBOX_ARCHIVE_PAGE],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'story-ideas',
    title: 'アイディア帳',
    storyOnly: true,
    pages: [
      IDEA_PAGE_INDEX,
      IDEA_PAGE_WORKOUT_EVENT,
      IDEA_PAGE_UNDERTAKER,
      IDEA_PAGE_MAGIC_BOY_SPROUT,
      IDEA_PAGE_NOT_DESTROYER_SPROUT,
      IDEA_PAGE_SAINT_SRPG,
      IDEA_PAGE_GORGEOUS_BONUS_SHORT,
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'story-tensai-mage',
    title: '天災魔法使い',
    cover: '/story-covers/tensai-mage.webp',
    storyOnly: true,
    pages: [
      {
        id: 'tensai-task01',
        title: 'Task01',
        body: '',
        sourcePath: '/story-notebooks/tensai-mage/task01.md',
        order: 0,
      },
      {
        id: 'tensai-chapter-1-draft',
        title: '天災_第一章 短稿',
        body: '',
        scenarioBody: `# 天災魔法使い 第一章
## 第一話 光と喪失
### 紅蓮色の光が産室を満たす
### 母の死とクロウの命名
### 継母だけが怪物ではなく才能だと告げる
## 第二話 病と陰謀
### 継母が魔力蝕みに倒れる
### 父は薬を止める
### クロウは金庫を開け闇医者へ向かう
## 第三話 学園の葛藤
### 魔術部とアルテミスに出会う
### 魔力なき者の研究に協力する
### 父の商業化命令から離脱を決意する
## 第四話 新しい世界
### 冒険者として世界の現場を知る
### 破壊ではなく制御の力だと理解する
### 双子と継母が回復した別荘へ戻る
## 第五話 からくり屋敷
### 双子と共同で遊びと学びの屋敷を作る
### 魔力なしでも成し遂げられる証明
### 家族は血ではなく選択だと知る
## 第六話 異なる力
### 学園調停を任される
### 協働実習プログラムを提案する
### 天災という呼称が社会改革家の名になる
## 第七話 幽霊の約束
### 観察者と名乗る女性に出会う
### 幼馴染の仲介業から技能市場を思いつく
### 社会の敵になる覚悟を口にする
## 第八話 家族への選択
### 父から最後の手紙が届く
### 父の死と別荘の継承
### 双子を発明の中心に据える
## 第九話 技能市場の拡大
### 五都市で技能市場を同時開設する
### 貴族の暗殺未遂を退ける
### 制度的差別が法律から消える
## 第十話 新しい世界への扉
### 技能工房へ進化した別荘を見る
### 国家技能評価制度という次の任務
### 天災は破壊と創造の両者だと受け入れる`,
        sourcePath: '/story-notebooks/tensai-mage/chapter-1-draft.md',
        order: 1,
      },
      {
        id: 'tensai-chapter-1-full',
        title: '天災_第一章',
        body: '',
        sourcePath: '/story-notebooks/tensai-mage/chapter-1-full.md',
        order: 2,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'story-future-blacksmith',
    title: '未来を打ち直す鍛冶屋',
    cover: '/story-covers/future-blacksmith.webp',
    storyOnly: true,
    pages: [
      {
        id: 'future-character-idialog',
        title: 'Character IdiaLog',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/character-idialog.md',
        order: 0,
      },
      {
        id: 'future-world-master',
        title: 'マスター設定書',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/world-master.md',
        order: 1,
      },
      {
        id: 'future-scenario-chat-log',
        title: 'IdiaChatログ',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/scenario-chat-log.md',
        order: 2,
      },
      {
        id: 'future-episode-1-samples',
        title: '第一話 サンプル集',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/episode-1-samples.md',
        order: 3,
      },
      {
        id: 'future-episode-1-directions',
        title: '第一話 ト書き',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/episode-1-directions.md',
        order: 4,
      },
      {
        id: 'future-plot-episodes-1-3',
        title: 'プロットシート 第1-3話',
        body: '',
        scenarioBody: `# 未来を打ち直す鍛冶屋 第1-3話
## 第1話 木の剣と夢の話
### 辺境の鍛冶屋の息子と森の秘密基地
### 仲間の夢を聞き五本の木の剣を作る
### 名前を刻んだ瞬間に荒れ地と血の未来を見る
## 第2話 名前のない隊
### TRPG遊びで役割と夢を語る
### 後の義勇軍になる隊名が生まれる
### 木の剣が夢ではない予感を残す
## 第3話 正規軍は来ない
### 魔物の群れが辺境を襲う
### 村人が秘密基地に集まる
### 初めて本物の剣を打ち未来視が鮮明になる
## 未来視のルール
### 武器は戦いの未来を見せる
### 生活道具は平和な未来を見せる
### 打ち直しは未来の改変を示す
## 主人公の内面軸
### 剣を打つほど戦いの未来が固まる
### 道具を作る時だけ穏やかな未来が見える
### 戦わせないことが行動原理になる
## 未決定事項
### 主人公の名前
### 医師志望キャラの名前
### 義勇軍の名前
### 未来視の由来
### 魔物の詳細種族名`,
        sourcePath: '/story-notebooks/future-blacksmith/plot-episodes-1-3.md',
        order: 5,
      },
      {
        id: 'future-devlog-idialog',
        title: 'DevLog IdiaLog',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/devlog-idialog.md',
        order: 6,
      },
      {
        id: 'future-root-idialog',
        title: 'Root IdiaLog',
        body: '',
        sourcePath: '/story-notebooks/future-blacksmith/root-idialog.md',
        order: 7,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  INBOX_NOTEBOOK,
  SETTING_NOTEBOOK,
  COMMENT_NOTEBOOK,
]

const LOCAL_MEMOS_KEY = 'note-story-local-memos-v1'
const LOCAL_BLOGS_KEY = 'note-story-local-blogs-v1'
const LOCAL_NOTEBOOKS_KEY = 'note-story-local-notebooks-v1'
const LOCAL_INBOX_KEY = 'note-story-global-inbox-v1'

function reviveDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value || Date.now()))
}

function reviveMemo(item: Memo): Memo {
  return {
    ...item,
    createdAt: reviveDate(item.createdAt),
    updatedAt: reviveDate(item.updatedAt),
  }
}

function reviveBlog(item: Blog): Blog {
  return {
    ...item,
    createdAt: reviveDate(item.createdAt),
    updatedAt: reviveDate(item.updatedAt),
    deletedAt: item.deletedAt ? reviveDate(item.deletedAt) : undefined,
  }
}

function mergeProductSeedDefaults(products: Product[]): Product[] {
  return products.map((product) => {
    const seed = PRODUCTS.find((item) => item.id === product.id || item.name === product.name)
    if (!seed) return product
    return {
      ...product,
      workState: product.workState ?? seed.workState,
      headingRefNotebookId: product.headingRefNotebookId ?? seed.headingRefNotebookId,
      headingRefPageId: product.headingRefPageId ?? seed.headingRefPageId,
      headingRefMode: product.headingRefMode ?? seed.headingRefMode,
    }
  })
}

function reviveNotebook(item: Notebook): Notebook {
  return {
    ...item,
    createdAt: reviveDate(item.createdAt),
    updatedAt: reviveDate(item.updatedAt),
    pages: item.pages ?? [],
  }
}

function ensureSeedIdeaPages(notebooks: Notebook[]): Notebook[] {
  return notebooks.map((notebook) => {
    if (notebook.id !== 'story-ideas') return notebook
    const seeds = [
      IDEA_PAGE_INDEX,
      IDEA_PAGE_WORKOUT_EVENT,
      IDEA_PAGE_UNDERTAKER,
      IDEA_PAGE_MAGIC_BOY_SPROUT,
      IDEA_PAGE_NOT_DESTROYER_SPROUT,
      IDEA_PAGE_SAINT_SRPG,
      IDEA_PAGE_GORGEOUS_BONUS_SHORT,
    ]
    const seedIds = new Set(seeds.map((seed) => seed.id))
    const seedPages = seeds.map((seed) => notebook.pages.find((page) => page.id === seed.id) ?? seed)
    const customPages = notebook.pages.filter((page) => !seedIds.has(page.id))
    const pages = [
      ...seedPages,
      ...customPages,
    ].map((page, index) => ({ ...page, order: index }))
    const changed =
      pages.length !== notebook.pages.length ||
      pages.some((page, index) => page.id !== notebook.pages[index]?.id || page.order !== notebook.pages[index]?.order)
    if (!changed) return notebook
    return { ...notebook, pages }
  })
}

function ensureSeedStoryOutlines(notebooks: Notebook[]): Notebook[] {
  const seedNotebookMap = new Map(INITIAL_NOTEBOOKS.map((notebook) => [notebook.id, notebook]))
  return notebooks.map((notebook) => {
    const seedNotebook = seedNotebookMap.get(notebook.id)
    if (!seedNotebook) return notebook
    let changed = false
    const pages = notebook.pages.map((page) => {
      const seedPage = seedNotebook.pages.find((item) => item.id === page.id)
      if (!seedPage?.scenarioBody || page.scenarioBody) return page
      changed = true
      return { ...page, scenarioBody: seedPage.scenarioBody }
    })
    return changed ? { ...notebook, pages } : notebook
  })
}

function ensureSeedNotebooks(notebooks: Notebook[]): Notebook[] {
  const ensureNotebook = (current: Notebook[], seedNotebook: Notebook, seedPages: NotebookPage[]) => {
    if (!current.some((notebook) => notebook.id === seedNotebook.id)) return [...current, seedNotebook]
    return current.map((notebook) => {
      if (notebook.id !== seedNotebook.id) return notebook
      const missing = seedPages.filter((seedPage) => !notebook.pages.some((page) => page.id === seedPage.id))
      if (!missing.length) return notebook
      return {
        ...notebook,
        pages: [
          ...missing.map((page, index) => ({ ...page, order: index })),
          ...notebook.pages.map((page, index) => ({ ...page, order: missing.length + index })),
        ],
      }
    })
  }

  const withSettings = ensureNotebook(notebooks, SETTING_NOTEBOOK, [SETTING_PAGE_SCENARIO_RULES])
  const withComments = ensureNotebook(withSettings, COMMENT_NOTEBOOK, [COMMENT_STATUS_PAGE, COMMENT_ARCHIVE_PAGE])
  const withInbox = ensureNotebook(withComments, INBOX_NOTEBOOK, [INBOX_TAG_DB_PAGE, INBOX_ARCHIVE_PAGE])
  return ensureSeedStoryOutlines(ensureSeedIdeaPages(withInbox))
}

function loadLocalMemos(): Memo[] {
  if (typeof window === 'undefined') return INITIAL_MEMOS
  try {
    const raw = localStorage.getItem(LOCAL_MEMOS_KEY)
    if (!raw) return INITIAL_MEMOS
    const parsed = JSON.parse(raw) as Memo[]
    return parsed.map(reviveMemo)
  } catch (error) {
    console.warn('[Local NOTE] failed to load memos:', error)
    return INITIAL_MEMOS
  }
}

function loadLocalBlogs(): Blog[] {
  if (typeof window === 'undefined') return INITIAL_BLOGS
  try {
    const raw = localStorage.getItem(LOCAL_BLOGS_KEY)
    if (!raw) return INITIAL_BLOGS
    const parsed = JSON.parse(raw) as Blog[]
    return parsed.map(reviveBlog)
  } catch (error) {
    console.warn('[Local BLOG] failed to load blogs:', error)
    return INITIAL_BLOGS
  }
}

function loadLocalNotebooks(): Notebook[] {
  if (typeof window === 'undefined') return INITIAL_NOTEBOOKS
  try {
    const raw = localStorage.getItem(LOCAL_NOTEBOOKS_KEY)
    if (!raw) return INITIAL_NOTEBOOKS
    const parsed = JSON.parse(raw) as Notebook[]
    return ensureSeedNotebooks(parsed.map(reviveNotebook))
  } catch (error) {
    console.warn('[Local NOTE] failed to load notebooks:', error)
    return INITIAL_NOTEBOOKS
  }
}

function readLegacyInboxSection(body: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return body.match(new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1]?.trim() ?? ''
}

function migrateLegacyInbox(notebooks: Notebook[]): InboxItem[] {
  const legacy = notebooks.find((notebook) => notebook.id === 'story-inbox' || notebook.title === 'InBox')
  if (!legacy) return []
  return legacy.pages.flatMap((page) => {
    if (page.id === 'inbox-tag-db' || page.id === 'inbox-archive' || page.title === 'tagDB' || page.title === 'Archive') return []
    const body = page.body ?? ''
    const source = readLegacyInboxSection(body, 'Source')
    const sourceNotebookTitle = source.match(/- notebook:\s*(.+)/)?.[1]?.trim()
    const sourcePageTitle = source.match(/- page:\s*(.+)/)?.[1]?.trim()
    const now = new Date().toISOString()
    return [{
      id: page.id,
      subject: body.match(/^#\s+(.+)$/m)?.[1]?.trim() || page.title,
      body: readLegacyInboxSection(body, 'InBox') || body,
      tag: readLegacyInboxSection(body, 'tag') || '未分類',
      relatedIdea: readLegacyInboxSection(body, 'relatedIdea') || undefined,
      status: 'inbox' as const,
      syncStatus: page.syncStatus ?? (body.includes('firebase: sent') ? 'synced' as const : 'unsynced' as const),
      syncError: page.syncError,
      firebaseDocId: page.firebaseDocId,
      sourceView: 'notebook' as const,
      sourceNotebookTitle,
      sourcePageTitle,
      createdAt: now,
      updatedAt: page.syncedAt ?? now,
    }]
  })
}

function loadLocalInboxItems(notebooks: Notebook[]): InboxItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_INBOX_KEY)
    if (raw) return JSON.parse(raw) as InboxItem[]
    const migrated = migrateLegacyInbox(notebooks)
    localStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify(migrated))
    return migrated
  } catch (error) {
    console.warn('[Global InBox] failed to load:', error)
    return []
  }
}

function saveLocalMemos(memos: Memo[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_MEMOS_KEY, JSON.stringify(memos))
}

function saveLocalBlogs(blogs: Blog[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_BLOGS_KEY, JSON.stringify(blogs))
}

function saveLocalNotebooks(notebooks: Notebook[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(notebooks))
}

function saveLocalInboxItems(items: InboxItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify(items))
}

const initialMemos = loadLocalMemos()
const initialBlogs = loadLocalBlogs()
const initialNotebooks = loadLocalNotebooks()
const initialInboxItems = loadLocalInboxItems(initialNotebooks)

const [state, setState] = createStore<AppState>({
  page: 'notebook',
  galleryReturnPage: 'db01',
  blogMode: 'memo',
  fontSize: initFontSize(),
  darkMode: initDarkMode(),
  dbView: 'table',
  selectedProductId: null,
  selectedNutrientId: null,
  selectedBlogId: null,
  selectedMemoId: initialMemos[0]?.id ?? null,
  selectedNotebookId: initialNotebooks[0]?.id ?? null,
  selectedNotebookPageId: null,
  sidebarOpen: initSidebarOpen(),
  settingsPanelOpen: false,
  galleryPanelOpen: false,
  blogFilterTags: [],
  products: mergeProductSeedDefaults(PRODUCTS),
  nutrients: NUTRIENTS,
  symptoms: SYMPTOMS,
  memos: initialMemos,
  blogs: initialBlogs.filter((blog) => !blog.deletedAt),
  trashBlogs: initialBlogs.filter((blog) => !!blog.deletedAt),
  notebooks: initialNotebooks,
  inboxItems: initialInboxItems,
  inboxComposerOpen: false,
  db01Columns: DB01_COLUMNS_DEFAULT,
  db02Columns: DB02_COLUMNS_DEFAULT,
  db03Columns: DB03_COLUMNS_DEFAULT,
  db10Columns: DB10_COLUMNS_DEFAULT,
  dbTitles: {
    db01: 'Title',
    db02: 'Character',
  },
  dbStatus: 'idle',
})

export { state, setState }

// ── UI actions ────────────────────────────────────────────────────────────────

export function navigate(page: Page) {
  if (page === 'gallery' && state.page !== 'gallery') {
    setState({ galleryReturnPage: state.page })
  }
  const keepSidebar = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerHeight > 500
  setState({ page, sidebarOpen: keepSidebar ? state.sidebarOpen : false })
}

type NewInboxItem = Pick<InboxItem, 'subject' | 'body' | 'tag' | 'sourceView'> &
  Partial<Pick<InboxItem, 'relatedIdea' | 'sourceNotebookId' | 'sourceNotebookTitle' | 'sourcePageId' | 'sourcePageTitle'>>

function patchInboxItemLocal(id: string, patch: Partial<InboxItem>) {
  setState('inboxItems', (items) => {
    const next = items.map((item) => item.id === id ? { ...item, ...patch } : item)
    saveLocalInboxItems(next)
    return next
  })
}

export function addInboxItem(input: NewInboxItem): string {
  const now = new Date().toISOString()
  const id = `inbox-${Date.now().toString(36)}`
  const item: InboxItem = {
    ...input,
    id,
    subject: input.subject.trim(),
    body: input.body.trim(),
    tag: input.tag.trim() || '未分類',
    status: 'inbox',
    syncStatus: 'unsynced',
    createdAt: now,
    updatedAt: now,
  }
  setState('inboxItems', (items) => {
    const next = [item, ...items]
    saveLocalInboxItems(next)
    return next
  })
  void syncInboxItem(id)
  return id
}

export function updateInboxItem(id: string, patch: Partial<InboxItem>) {
  patchInboxItemLocal(id, { ...patch, updatedAt: new Date().toISOString() })
}

export async function syncInboxItem(id: string): Promise<void> {
  const item = state.inboxItems.find((entry) => entry.id === id)
  if (!item || item.syncStatus === 'syncing') return
  patchInboxItemLocal(id, { syncStatus: 'syncing', syncError: undefined })
  try {
    const firebaseItem = await sendIdeaInboxToFirebase({
      id: item.firebaseDocId ?? `idea_inbox_${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      subject: item.subject,
      body: item.body,
      tag: item.tag,
      relatedIdea: item.relatedIdea,
      sourceView: item.sourceView,
      sourceNotebookId: item.sourceNotebookId,
      sourceNotebookTitle: item.sourceNotebookTitle,
      sourcePageId: item.sourcePageId,
      sourcePageTitle: item.sourcePageTitle,
    })
    patchInboxItemLocal(id, {
      syncStatus: 'synced',
      firebaseDocId: firebaseItem.id,
      updatedAt: firebaseItem.updatedAt,
    })
  } catch (error) {
    patchInboxItemLocal(id, {
      syncStatus: 'error',
      syncError: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function syncPendingInboxItems(): Promise<void> {
  const ids = state.inboxItems
    .filter((item) => item.syncStatus === 'unsynced' || item.syncStatus === 'error')
    .map((item) => item.id)
  for (const id of ids) await syncInboxItem(id)
}

export function updateDbTitle(key: DbTitleKey, title: string) {
  setState('dbTitles', key, title)
}

export function setFontSize(size: FontSize) {
  document.documentElement.style.fontSize = FONT_SIZE_PX[size] + 'px'
  setState({ fontSize: size })
}

export function toggleDarkMode() {
  const next = !state.darkMode
  document.documentElement.classList.toggle('dark', next)
  localStorage.setItem('note00-dark-mode', String(next))
  setState({ darkMode: next })
}

export function toggleBlogFilter(tagName: string) {
  setState('blogFilterTags', (prev) =>
    prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
  )
}

export function toggleDb01Column(id: string) {
  setState('db01Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

export function toggleDb02Column(id: string) {
  setState('db02Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

export function toggleDb03Column(id: string) {
  setState('db03Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

export function toggleDb10Column(id: string) {
  setState('db10Columns', (prev) =>
    prev.map((c) => (c.id === id && !c.locked ? { ...c, visible: !c.visible } : c))
  )
}

// ── Firestore init ────────────────────────────────────────────────────────────

export async function initFirestore(): Promise<void> {
  setState({ dbStatus: 'connecting' })
  try {
    const [memos, allBlogs, notebooks, fsProducts, fsNutrients, fsInboxItems] = await Promise.all([
      fetchMemos(),
      fetchBlogs(),
      fetchNotebooks(),
      fetchProducts(),
      fetchNutrients(),
      fetchIdeaInboxItems(),
    ])
    const blogs      = allBlogs.filter((b) => !b.deletedAt)
    const trashBlogs = allBlogs.filter((b) => !!b.deletedAt)

    if (fsProducts.length === 0) {
      await seedProductsFs(PRODUCTS)
      setState({ products: mergeProductSeedDefaults(PRODUCTS) })
    } else {
      setState({ products: mergeProductSeedDefaults(fsProducts) })
    }
    if (fsNutrients.length === 0) {
      await seedNutrientsFs(NUTRIENTS)
      setState({ nutrients: NUTRIENTS })
    } else {
      setState({ nutrients: fsNutrients })
    }

    const localInboxByFirebaseId = new Map(state.inboxItems.filter((item) => item.firebaseDocId).map((item) => [item.firebaseDocId!, item]))
    const cloudInbox: InboxItem[] = fsInboxItems.map((item) => {
      const local = localInboxByFirebaseId.get(item.id)
      return {
        id: local?.id ?? item.id,
        subject: item.subject,
        body: item.body,
        tag: item.tag,
        relatedIdea: item.relatedIdea,
        status: local?.status ?? 'inbox',
        syncStatus: 'synced',
        firebaseDocId: item.id,
        sourceView: item.sourceView ?? local?.sourceView ?? 'notebook',
        sourceNotebookId: item.sourceNotebookId,
        sourceNotebookTitle: item.sourceNotebookTitle,
        sourcePageId: item.sourcePageId,
        sourcePageTitle: item.sourcePageTitle,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
    })
    const cloudIds = new Set(cloudInbox.map((item) => item.id))
    const mergedInbox = [...cloudInbox, ...state.inboxItems.filter((item) => !cloudIds.has(item.id) && !item.firebaseDocId)]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    setState({ memos, blogs, trashBlogs, notebooks, inboxItems: mergedInbox, dbStatus: 'connected' })
    saveLocalMemos(memos)
    saveLocalBlogs(allBlogs)
    saveLocalNotebooks(notebooks)
    saveLocalInboxItems(mergedInbox)
  } catch (e) {
    console.error('[Firestore] init failed:', e)
    setState({ dbStatus: 'error' })
  }
}

// ── Product / Nutrient CRUD ───────────────────────────────────────────────────

export function updateProduct(id: string, patch: Partial<Product>): void {
  setState('products', (prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  if (firebaseEnabled) updateProductFs(id, patch).catch(console.warn)
}

export function addProduct(type = 'note'): string {
  const id = `TITLE-${String(state.products.length + 1).padStart(3, '0')}`
  const product: Product = {
    id,
    name: 'Untitled title',
    image: '',
    category: type.trim() || 'scenario',
    description: '',
    price: 0,
    volume: '',
    symptoms: [],
    effects: [],
    ingredients: [],
    nutrientIds: [],
    memo: '',
    createdAt: new Date(),
  }
  setState('products', (prev) => [product, ...prev])
  if (firebaseEnabled) updateProductFs(id, product).catch(console.warn)
  return id
}

export function updateNutrient(id: string, patch: Partial<Nutrient>): void {
  setState('nutrients', (prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  if (firebaseEnabled) updateNutrientFs(id, patch).catch(console.warn)
}

export function addNutrient(): string {
  const id = `CHAR-${String(state.nutrients.length + 1).padStart(3, '0')}`
  const nutrient: Nutrient = {
    id,
    name: 'Untitled character',
    description: '',
    productIds: [],
    memo: '',
    createdAt: new Date(),
  }
  setState('nutrients', (prev) => [nutrient, ...prev])
  if (firebaseEnabled) updateNutrientFs(id, nutrient).catch(console.warn)
  return id
}

// ── Symptom CRUD ──────────────────────────────────────────────────────────────

export function addSymptom(data: Omit<Symptom, 'id'>): string {
  const id = 'SP' + String(state.symptoms.length + 1).padStart(2, '0')
  setState('symptoms', (prev) => [...prev, { ...data, id }])
  return id
}

export function updateSymptom(id: string, patch: Partial<Omit<Symptom, 'id'>>): void {
  setState('symptoms', (prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

export function deleteSymptom(id: string): void {
  setState('symptoms', (prev) => prev.filter((s) => s.id !== id))
}

// ── Memo CRUD ─────────────────────────────────────────────────────────────────

export async function addMemo(data: Omit<Memo, 'id'>): Promise<string> {
  const tempId = 'local-' + Date.now()
  setState('memos', (prev) => {
    const next = [{ ...data, id: tempId }, ...prev]
    saveLocalMemos(next)
    return next
  })
  try {
    if (!firebaseEnabled) return tempId
    const id = await addMemoFs(data)
    setState('memos', (prev) => {
      const next = prev.map((m) => (m.id === tempId ? { ...m, id } : m))
      saveLocalMemos(next)
      return next
    })
    return id
  } catch {
    return tempId
  }
}

export function updateMemo(id: string, patch: Partial<Omit<Memo, 'id'>>): void {
  setState('memos', (prev) => {
    const next = prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    saveLocalMemos(next)
    return next
  })
  if (firebaseEnabled) updateMemoFs(id, patch).catch(console.warn)
}

export function deleteMemo(id: string): void {
  setState('memos', (prev) => {
    const next = prev.filter((m) => m.id !== id)
    saveLocalMemos(next)
    return next
  })
  if (firebaseEnabled) deleteMemoFs(id).catch(console.warn)
}

// ── Blog CRUD ─────────────────────────────────────────────────────────────────

export async function addBlog(data: Omit<Blog, 'id'>): Promise<string> {
  const tempId = 'local-' + Date.now()
  setState('blogs', (prev) => {
    const next = [{ ...data, id: tempId }, ...prev]
    saveLocalBlogs([...next, ...state.trashBlogs])
    return next
  })
  try {
    if (!firebaseEnabled) return tempId
    const id = await addBlogFs(data)
    setState('blogs', (prev) => {
      const next = prev.map((b) => (b.id === tempId ? { ...b, id } : b))
      saveLocalBlogs([...next, ...state.trashBlogs])
      return next
    })
    return id
  } catch {
    return tempId
  }
}

export function updateBlog(id: string, patch: Partial<Omit<Blog, 'id'>>): void {
  setState('blogs', (prev) => {
    const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    saveLocalBlogs([...next, ...state.trashBlogs])
    return next
  })
  if (firebaseEnabled) updateBlogFs(id, patch).catch(console.warn)
}

export function trashBlog(id: string): void {
  const blog = state.blogs.find((b) => b.id === id)
  if (!blog) return
  const deletedAt = new Date()
  const deletedBlog = { ...blog, deletedAt }
  setState('blogs', (prev) => {
    const nextBlogs = prev.filter((b) => b.id !== id)
    saveLocalBlogs([...nextBlogs, deletedBlog, ...state.trashBlogs.filter((b) => b.id !== id)])
    return nextBlogs
  })
  setState('trashBlogs', (prev) => [deletedBlog, ...prev.filter((b) => b.id !== id)])
  if (firebaseEnabled) updateBlogFs(id, { deletedAt }).catch(console.warn)
}

export function restoreBlog(id: string): void {
  const blog = state.trashBlogs.find((b) => b.id === id)
  if (!blog) return
  const { deletedAt: _d, ...restored } = blog
  setState('trashBlogs', (prev) => {
    const nextTrash = prev.filter((b) => b.id !== id)
    saveLocalBlogs([{ ...restored }, ...state.blogs, ...nextTrash])
    return nextTrash
  })
  setState('blogs', (prev) => [{ ...restored }, ...prev.filter((b) => b.id !== id)])
  if (firebaseEnabled) restoreBlogFs(id).catch(console.warn)
}

export function deleteBlogPermanent(id: string): void {
  setState('trashBlogs', (prev) => {
    const nextTrash = prev.filter((b) => b.id !== id)
    saveLocalBlogs([...state.blogs, ...nextTrash])
    return nextTrash
  })
  if (firebaseEnabled) deleteBlogFs(id).catch(console.warn)
}

export function emptyTrash(): void {
  const ids = state.trashBlogs.map((b) => b.id!)
  setState({ trashBlogs: [] })
  saveLocalBlogs(state.blogs)
  if (firebaseEnabled) Promise.all(ids.map(deleteBlogFs)).catch(console.warn)
}

// ── Notebook CRUD ─────────────────────────────────────────────────────────────

export async function addNotebook(data: Omit<Notebook, 'id'>): Promise<string> {
  const tempId = 'local-' + Date.now()
  setState('notebooks', (prev) => {
    const next = [{ ...data, id: tempId }, ...prev]
    saveLocalNotebooks(next)
    return next
  })
  try {
    if (!firebaseEnabled) return tempId
    const id = await addNotebookFs(data)
    setState('notebooks', (prev) => {
      const next = prev.map((n) => (n.id === tempId ? { ...n, id } : n))
      saveLocalNotebooks(next)
      return next
    })
    return id
  } catch {
    return tempId
  }
}

export function updateNotebook(id: string, patch: Partial<Omit<Notebook, 'id'>>): void {
  setState('notebooks', (prev) => {
    const next = prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
    saveLocalNotebooks(next)
    return next
  })
  if (firebaseEnabled) updateNotebookFs(id, patch).catch(console.warn)
}

export async function deleteNotebook(id: string): Promise<void> {
  if (firebaseEnabled) await deleteNotebookFs(id)
  setState('notebooks', (prev) => {
    const next = prev.filter((n) => n.id !== id)
    saveLocalNotebooks(next)
    return next
  })
}
