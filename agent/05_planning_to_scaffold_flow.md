# Planning to Scaffold Flow

## 基本の流れ

```text
Idea
  思いつき、相談、素材候補

Plan
  企画書、目的、作りたい体験

Layout
  画像またはHTMLで画面レイアウトとボタン遷移を作る

Spec
  画面ごとの仕様書を書く

Scaffold
  フォルダー、ファイル、TODO、console prefix、TaskTicketへ分解する

Build
  SolidJSなどで実装する

Review
  動作確認、見た目確認、Report

Done
  IndexとReportへ登録
```

## Kanban Lane案

```text
InBox
Plan
Design / Layout
Scaffold
Asset
Build
Review
Done
```

## 企画を画像で出す決まり

新しい画面やアプリを作る時は、いきなり実装しない。

まず次のどちらかを作る。

```text
1. 画像レイアウト
2. HTML screenLayout
```

HTMLの場合は、ボタン遷移だけ先に作る。

この時点では本実装ではなく、画面の設計模型として扱う。

## Scaffold化の条件

Scaffoldへ進める条件:

- 画面名が決まっている
- 画面の目的が決まっている
- ボタン遷移が分かる
- Active TargetとView Modeが分かる
- 必要なDBまたは素材が分かる
- 仕様書に未決定項目が残りすぎていない

## TaskTicket化の条件

TaskTicketへ進める条件:

- 実装ファイル候補がある
- acceptanceがある
- console checkがある
- 1つのTicketで終わる範囲に分かれている

