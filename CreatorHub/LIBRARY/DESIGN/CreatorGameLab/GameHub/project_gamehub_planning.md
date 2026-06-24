# CreatorHub Release Site / GameHub 企画書

meta:
  date: 2026-06-23
  agent: codex
  topic: CreatorHub Release Site / GameHub
  status: planning
  target: C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\GameHub
  report_type: planning

## 1. 仮名称

CreatorHub Release Site

別名候補:

- GameHub
- CreatorHub GameHub
- CreatorHub Release Shelf

## 2. コンセプト

ゲームを販売するだけのホームページではなく、作品が増えるほど価値が増えるゲーム工房を構築する。

CreatorGameLabで制作し、TitleGameStudio packageで作品を整理し、GameHubで公開、予約公開、回遊、計測を行う。

## 3. 目的

### KGI

2026年6月30日までに以下を公開する。

- ゲーム公開ホームページ
- ノベルゲーム1作品
- 周回型バトルゲーム1作品

### 事業目的

作品単体を売るのではなく、作品が集まる場所を育てる。

流れ:

```txt
人を呼ぶ
↓
作品を遊ぶ
↓
次の作品を見る
↓
制作日記や外部導線を見る
↓
再訪する
↓
作品と導線が資産として蓄積する
```

## 4. 基本思想

```txt
作品を作る
↓
ホームページへ登録する
↓
予約公開する
↓
ユーザーが遊ぶ
↓
クリア後に別作品へ回遊する
↓
制作記録と作品が資産として蓄積する
```

## 5. 層構造

### 公開層

ユーザーが閲覧する本番ホームページ。

役割:

- 公開済み作品だけ表示する
- 作品一覧、作品詳細、ゲームプレイ、クリア後導線を表示する
- YouTube、小説家になろう、note、X、Google検索からの流入を受ける

### 管理層

自分専用CMS。

役割:

- 下書き確認
- 予約公開確認
- 公開切替
- Androidからの運用確認
- KPI確認
- 作品登録、サムネイル登録、公開履歴確認

初期段階では、完全なCMS編集機能よりも、JSONを読んで確認できる管理画面を優先する。

### データ層

作品データ、公開状態、素材参照、導線、計測キーを管理する。

役割:

- TitleGameStudio packageから公開用メタ情報を受け取る
- content JSONで作品一覧を管理する
- releaseAtとstatusで公開判定する
- thumbnail、playUrl、clearLinks、tagsを保持する

## 6. サイト構成

推奨URL:

```txt
/
/games
/games/:gameId
/games/:gameId/play
/games/:gameId/clear
/shorts/:shortId
/blog
/admin
/admin/games
/admin/schedule
/admin/preview/:gameId
/admin/kpi
```

画面役割:

- TOP: 新作、注目作品、制作導線を見せる
- 作品一覧: タイトルカードを並べる
- 作品詳細: あらすじ、プレイ時間、開始ボタンを置く
- ゲームプレイ: 埋め込みゲームまたはゲームページへ遷移する
- クリア後: 次作品、制作日記、YouTube、他作品へ回遊させる
- Admin: 自分だけが公開状態と進行状況を確認する

## 7. コンテンツ種類

### ノベルゲーム

本編作品。TitleGameStudio packageからscenario、character、image、audio、layoutを受け取る。

### バトルゲーム

周回型に遊ぶ作品。短時間プレイ、再訪、KPI確認に向く。

### ショートHTML

一枚HTML作品。短編、漫画風ページ、設定資料、導入ノベルとして使う。

### 制作日記

開発記録。SEO、SNS共有、制作過程の信頼、次作品への導線に使う。

## 8. 公開状態

```txt
draft      作成中
scheduled 予約公開
published 公開済み
archived  保管済み
```

公開判定:

```txt
published は表示する
scheduled かつ releaseAt <= 現在時刻 は表示する
draft / archived は公開層では表示しない
```

時刻基準:

- Asia/Tokyo
- releaseAtはISO 8601で保存する

## 9. KPI / KDI

### KPI

結果として測る数字。

- ホームページ訪問者数
- 作品プレイ開始数
- 作品クリア数
- クリア後リンククリック数
- 再訪問数
- 流入元別訪問数

流入元候補:

- YouTube
- 小説家になろう
- note
- X
- Google検索
- 直接アクセス

計測方法:

- Google Analytics
- UTMパラメータ
- 作品別kpiKey

例:

```txt
/?utm_source=youtube
/?utm_source=narou
/?utm_source=note
```

### KDI

自分で管理できる行動指標。

- シナリオ納品数
- 背景作成数
- キャラクター作成数
- テストプレイ回数
- 改善メモ数
- 制作日記投稿数
- 外部投稿数
- ホームページ更新回数

## 10. Android運用

Androidで確認したいこと:

- 作品一覧
- 作品詳細
- 公開前プレビュー
- 予約公開状態
- サムネイル確認
- 公開切替確認
- KPI概要
- 次にやる作業

Androidでは全部の編集機能を入れず、確認と軽い切替を優先する。

## 11. 現在システムとの関係

### CreatorGameLab

制作再開、WorkSpace、TitleGameStudio一覧、Save / Loadを担当する。

### TitleGameStudio package

ゲームタイトルごとの制作情報、素材、TODO、slot JSON、runtime JSONをまとめる。

### GameHub

公開用の棚。TitleGameStudio packageから公開に必要な情報だけを受け取り、作品一覧、詳細、プレイ、回遊、計測を担当する。

### Kanban_June

細かい作業指示ではなく、Reportを受けて進捗整理、知識化、TaskTicket化候補の抽出を担当する。

## 12. 最小リリース方針

6月30日までの最小構成:

- 静的な公開TOP
- 作品一覧
- 作品詳細ページ
- ノベルゲーム1作品のプレイ導線
- 周回型バトルゲーム1作品のプレイ導線
- クリア後ページ
- content JSONによる作品登録
- releaseAt / statusによる表示判定
- UTMで流入元を分ける
- 管理画面は確認中心

後回し:

- 完全CMS編集
- ユーザーアカウント
- 課金
- 大規模なKPI分析
- 自動公開API

## 13. マイルストーン

### M0 企画固定

GameHubの役割、URL、KGI、最小リリース範囲を固定する。

### M1 Content Schema

作品一覧、公開状態、導線、計測キーのJSON schemaを作る。

### M2 Public Site Scaffold

TOP、作品一覧、作品詳細、クリア後ページを作る。

### M3 Novel Release

ノベルゲーム1作品をGameHubから起動できるようにする。

### M4 Battle Loop Release

周回型バトルゲーム1作品をGameHubから起動できるようにする。

### M5 Admin Preview

Androidで作品状態、予約公開、プレビューを確認できるようにする。

### M6 KPI / Inflow

UTM、GA、作品別kpiKeyで最低限の流入確認を行う。

## 14. 判断

最初から大きなCMSを作らない。

まずは静的サイト + JSON管理 + 手動更新で公開まで到達する。公開できる棚ができた後に、管理画面の編集機能、予約公開API、KPI盤面を育てる。

