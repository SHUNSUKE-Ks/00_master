# 実験場から本番環境へ移す流れ

## 目的

`C:\202604_claude_workspace\100_gamecollection` は、新しい名前を `CreatorGameLab` として再整理します。今後も隔離実験場として使います。

ただし、実験機能が増えすぎて本番機能と競合しないように、機能ごとの目次、ComponentView、依存、移植判定を管理します。

## 役割分担

```txt
CreatorGameLab
  実験、試作、検証、アイデアの仮実装、制作対象選択、開発再開ランチャー

C:\00_master\GAME
  完成済みのエンジン本番実装

C:\00_master\CreatorHub\LIBRARY\INDEX
  機能、ComponentView、技術スタック、素材DBの索引

C:\00_master\DevApps\kanban_June
  監視、タスク化、DB確認、進捗管理
```

## 移植条件

実験機能を本番へ移す前に、次を満たします。

1. 目的が1文で説明できる。
2. どのエンジンに属するか決まっている。
3. ComponentView の入口が分かる。
4. 依存パッケージが分かる。
5. 読み込むDBまたは素材IDが分かる。
6. 受け入れ条件が3つ以内で書ける。
7. 実験専用の仮データと本番DBが分離されている。

## 機能の状態

- `idea`: 思いつき。
- `experiment`: 100_gamecollectionで実験中。
- `candidate`: 本番移植候補。
- `migrating`: 移植中。
- `production`: 本番採用。
- `archived`: 保留または破棄。

## Index 管理

実験場で新しい機能を作ったら、`CreatorHub\LIBRARY\INDEX\experiment_registry.json` に記録します。

記録するもの:

- featureId
- title
- status
- sourcePath
- targetEngine
- componentViews
- dependencies
- assetRefs
- dbRefs
- notes
- lastCheckedAt

AI は作業開始時にこのIndexを読み、自分が扱える技術スタックと既存ComponentViewを確認します。

## CreatorGameLab の画面

CreatorGameLab には、次の画面を作ると良いです。

- `Title Select`: ゲームタイトルをサムネイルとタイトルで選ぶ。
- `Engine Sandbox Select`: BattleEngine、CollectionEngine、未画像プロトタイプ、隔離テスト環境を選ぶ。
- `Dev Save Load`: 複数タイトルをまたいで、前回の作業状態から再開する。
- `Component Registry View`: Dynamicで差し替え可能なComponentViewの目次を見る。

## Kanban で見たい画面

カンバン側には、将来的に次の別画面を作ると良いです。

- `Engine Index View`: GAME配下のエンジン一覧。
- `Experiment Index View`: 100_gamecollectionの実験機能一覧。
- `Asset DB View`: assets / characters / scenarios / collections / orders の確認。
- `Migration Queue View`: candidateからproductionへ移す候補。
- `Report Index View`: 設計レポート、移植レポート、削除候補レポートの一覧。

最初は実装せず、`Database View` または `Knowledge Index` に読ませるだけでも十分です。
