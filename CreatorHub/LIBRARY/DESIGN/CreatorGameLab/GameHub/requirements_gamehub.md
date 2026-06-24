# CreatorHub Release Site / GameHub 要件定義書

meta:
  date: 2026-06-23
  agent: codex
  topic: CreatorHub Release Site / GameHub requirements
  status: planning
  target: C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\GameHub
  report_type: requirements

## 1. システム概要

CreatorHub Release Site / GameHubは、ゲーム作品を登録、管理、公開するCMS付きホームページである。

初期リリースでは、完全なCMS編集機能よりも、JSON管理による公開サイトと管理確認画面を優先する。

## 2. スコープ

### 対象

- 公開TOP
- 作品一覧
- 作品詳細
- ゲームプレイ導線
- クリア後回遊ページ
- ショートHTML表示
- 管理確認画面
- 公開予約情報
- 流入計測用データ

### 対象外

- 課金
- ユーザーアカウント
- コメント欄
- 大規模CMS
- WYSIWYGエディタ
- 自動素材生成工房
- 複雑なABテスト

## 3. 機能要件

### 3.1 作品管理

作品を登録、参照できる。

必須項目:

- id
- title
- description
- type
- status
- releaseAt
- thumbnail
- tags
- detailUrl
- playUrl

任意項目:

- catch
- estimatedPlayTime
- engineType
- packageId
- titleGameStudioPath
- clearLinks
- kpiKey

### 3.2 公開予約

日時指定で公開状態を判定できる。

状態:

- draft
- scheduled
- published
- archived

判定:

```txt
status === published
または
status === scheduled かつ releaseAt <= now
```

時刻:

- Asia/Tokyo基準
- releaseAtはISO 8601形式

### 3.3 一覧表示

公開対象の作品カードを表示する。

表示項目:

- タイトル
- サムネイル
- 種別
- タグ
- 公開日
- 短い説明

### 3.4 作品詳細ページ

作品の説明と開始導線を表示する。

表示項目:

- あらすじ
- 作品画像
- プレイ時間
- ジャンル
- 開始ボタン
- 関連作品
- 制作日記リンク

### 3.5 ゲームプレイページ

ゲーム本体へ遷移または埋め込み表示する。

初期方針:

- 既存エンジンやHTML作品へのリンク起動を優先する
- iframe埋め込みは必要になってから検討する
- スマホ縦画面とPC横画面の確認を必須にする

### 3.6 クリア後ページ

ゲーム終了後に回遊導線を表示する。

表示項目:

- 次の作品
- 関連作品
- 制作日記
- YouTube
- 作品一覧
- 作者ページ

### 3.7 ショートHTML

一枚HTML作品を公開できる。

用途:

- 短編ノベル
- 漫画風ページ
- 設定資料
- 本編への入口

### 3.8 流入計測

流入元を確認できる。

取得候補:

- utm_source
- utm_medium
- utm_campaign
- referrer
- gameId
- kpiKey

流入元:

- youtube
- narou
- note
- x
- google
- direct

### 3.9 プレビュー

公開前作品を管理者だけ確認できる。

初期案:

- ローカルまたは管理URLで確認
- draftは公開層に出さない
- preview URLは管理者向けに限定する

### 3.10 検索

作品を検索できる。

条件:

- タイトル
- タグ
- ジャンル
- 種別

初期段階ではクライアント側検索でよい。

### 3.11 管理画面

管理画面で以下を確認する。

- Dashboard
- 作品管理
- 公開予約
- プレビュー
- KPI確認
- 設定
- 作業箱 / InBox
- 公開待機
- 公開履歴
- 工房状態

初期実装は確認中心にする。

## 4. データ要件

### 4.1 content_games.json

例:

```json
{
  "games": [
    {
      "id": "game_witch_001",
      "title": "魔女の森",
      "type": "novel",
      "status": "scheduled",
      "releaseAt": "2026-06-30T20:00:00+09:00",
      "catch": "森に入った騎士は、死なない魔女と出会う。",
      "description": "短編ノベルゲーム。",
      "thumbnail": "/assets/games/game_witch_001/thumbnail.webp",
      "detailUrl": "/games/game_witch_001",
      "playUrl": "/games/game_witch_001/play",
      "tags": ["novel", "fantasy", "short"],
      "kpiKey": "game_witch_001",
      "clearLinks": [
        {
          "label": "次の作品へ",
          "url": "/games/game_battle_001"
        },
        {
          "label": "制作日記",
          "url": "/blog/game_witch_001"
        }
      ]
    }
  ]
}
```

### 4.2 content_sources.json

例:

```json
{
  "sources": [
    {
      "id": "youtube",
      "label": "YouTube",
      "utmSource": "youtube"
    },
    {
      "id": "narou",
      "label": "小説家になろう",
      "utmSource": "narou"
    }
  ]
}
```

### 4.3 TitleGameStudio連携

GameHubが参照する候補:

- packageId
- packageVersion
- latest
- publicTitle
- publicSummary
- thumbnail
- runtimeJsonPath
- playUrl
- engineType
- releaseStatus

## 5. 非機能要件

### Android対応

- 縦画面で作品一覧と詳細を確認できる
- 管理画面はカード型で確認しやすくする
- 公開切替や予約確認は誤操作を避ける

### 公開性能

- TOPと作品一覧は軽くする
- 画像はWeb向けサイズを使う
- ゲーム本体は必要時に読み込む

### セキュリティ

- /admin は認証必須にする
- draft作品は公開層で読み込まない
- preview URLは一般公開しない

### SEO / SNS

- 作品詳細ごとにtitle、description、OGP画像を持つ
- ショートHTMLはSNS共有しやすくする

## 6. 受け入れ条件

2026年6月30日の最小受け入れ条件:

- 公開TOPが表示できる
- 作品一覧が表示できる
- 作品詳細が表示できる
- ノベルゲーム1作品を開始できる
- 周回型バトルゲーム1作品を開始できる
- クリア後ページから別導線へ移動できる
- draft作品が公開層に表示されない
- scheduled作品がreleaseAt後に公開扱いになる
- AndroidでTOP、一覧、詳細、管理確認画面を見られる
- UTM付きURLで流入元を分けられる

## 7. 優先度

### Must

- content JSON
- 公開TOP
- 作品一覧
- 作品詳細
- プレイ導線
- クリア後導線
- status / releaseAt

### Should

- 管理確認画面
- 公開待機一覧
- 公開履歴
- KPI概要
- UTM source一覧

### Could

- CMS編集
- preview token
- GitHub Actions連携
- 自動公開API
- 詳細KPIダッシュボード

## 8. 実装前の判断

最初は、JSON管理 + 静的ページ + 手動更新で進める。

理由:

- 6月30日までの公開が最優先
- CMSを大きくすると作品公開が遅れる
- 作品が2本並んだ後に管理機能を増やした方が判断しやすい

## 9. 次の一手

次に作るべき設計資料:

- 仕様_content_games_schema_v0.1.md
- 画面_gamehub_public_layout_v0.1.md
- 画面_gamehub_admin_layout_v0.1.md
- 納品_release_checklist_2026-06-30.md

次に実装へ進む場合の最初のTask:

```txt
key: 型定
title: GameHub content_games schema v0.1を作る
state_change: 企画 → schema
output: content_games.schema.json / sample content_games.json
```

