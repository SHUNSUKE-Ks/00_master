# Loop Engineering と再利用Policyのアイディア

作成日: 2026-07-13  
用途: Harness / Agent / Project Policy / LLM Wiki の検討資料  
状態: idea

## 目的

収益や作品数だけを追うのではなく、再利用可能な開発資産を増やしながら、仮説検証を継続できる制作環境を作る。

```text
Goal -> Evaluation Function -> Metric -> Loop -> Review -> Memory
```

## KGI・評価関数・KPI

```text
KGI: 最終目的
評価関数: KGIへ寄与したかを判定する規則
KPI: 途中の観測指標
```

KPI達成はKGI達成を保証しない。たとえば月3本を完成しても売上が0円なら、制作数KPIは達成しているが収益KGIは未達である。

### 中間KGI案

| Key | 目標 | 判定例 |
|---|---|---|
| KGI_01 | 10作品公開 | 公開URLまたは配布物が存在する |
| KGI_02 | 100DL到達 | 配布元の計測値を記録する |
| KGI_03 | 初売上 | 決済または販売記録を確認する |
| KGI_04 | 月30万円相当の開発基盤 | 再利用資産の棚卸しで評価する |

## Loop Engineering

Loopは正解を最初から当てるためではなく、仮説を早く検証し、外れた仮説を捨てるために使う。

```text
KGI -> 仮説 -> 実験 -> 評価 -> 学習 -> 次の仮説
```

定性的な評価も扱える。レビュー、自己評価、Judge AI評価を `S / A / B / C` のように記録すれば、改善Loopの入力にできる。

```text
Creator AI -> Judge AI -> 改善
```

月3本リリースの構想では、個別作品の制作Loopだけでなく、当たりジャンルを発見する探索Loopも上位価値になる。

## 資産KGI

集客チャネルが育つ前は、売上だけでなく「月30万円相当の開発基盤」を増やす。

```json
{
  "kgi": "月30万円相当の開発基盤",
  "kpi": { "component": 50, "snippet": 100, "layout": 20, "engine": 10, "template": 10 }
}
```

| 順位 | 資産 | 例 | 価値 |
|---|---|---|---|
| 01 | Component | Dialog、Tab、Sidebar、Gallery、Kanban、Inspector | 全アプリで再利用する |
| 02 | UI Template | note_layout、dashboard_layout、game_layout、editor_layout | DesignerAgentの参考資料になる |
| 03 | Snippet | drag_drop、IndexedDB、command_palette、tree_view | 実装速度を上げる |
| 04 | Mini Engine | engine_quest、engine_escape、engine_flashcard | 作品を派生させる |
| 05 | Template App | template_note、template_kanban、template_gallery | 新規アプリの土台になる |

ゲームは完成品を一度だけ作るより、差し替え可能なEngineとして作る。

```text
engine_escape -> stage_001 / stage_002 / stage_003
engine_escape -> engine_detective / engine_horror / engine_adventure
```

## Agent用の改善ルール

KPIではなく、Agentに「どう改善するか」を示すものは `Policy` が中心となる。

| 呼称 | 用途 | 略称例 |
|---|---|---|
| Policy | 行動・改善方針 | `POL_` |
| Principle | 守る原則 | `PRI_` |
| Rule | 明示的な規則 | `RUL_` |
| Guideline | 実装や運用の案内 | `GUI_` |
| Heuristic | 経験則による判断 | `HEU_` |
| Rubric | Judge AI用の評価基準 | `RUB_` |

### 最重要Policy

```text
POL_REUSE: 新規作成前に既存資産を検索する。
POL_EXTRACT: 同じ構造が3回出現したら共通化候補にする。
POL_COMPONENT: 画面単位ではなく部品単位で設計する。
POL_ENGINE: 一作のゲームではなく、派生できるEngineを先に作る。
POL_TEMPLATE: 完成品より再利用できる雛形を優先する。
POL_JSON: 可変データはJSONで分離し、UI実装から切り離す。
POL_SOLID: 表示はStateから導出し、直接DOM操作を増やさない。
```

### POL_REUSE の処理

```text
既存資産を探す -> あれば利用 -> なければ新規作成 -> 3回使った構造を共通化候補化 -> Core Libraryへ移動
```

## 推奨フォルダの考え方

```text
00_Core/
  components/  layouts/  engines/  snippets/
10_Note/
20_Novel/
30_Escape/
40_Study/
```

各プロジェクトはCoreを参照する。最初から巨大な共通化をせず、実際に3回現れた構造を昇格させる。

## Harnessへの適用案

```json
{
  "goal": "Create reusable PWA assets",
  "evaluation": ["isReusable", "hasVerification", "contributesToProductLine"],
  "metrics": { "component": 50, "snippet": 100, "layout": 20, "engine": 10, "template": 10 },
  "policies": ["POL_REUSE", "POL_EXTRACT", "POL_COMPONENT", "POL_ENGINE", "POL_TEMPLATE", "POL_JSON", "POL_SOLID"],
  "memory": "検証済みの成果物、採否、失敗理由、再利用先を記録する"
}
```

## 次の検討

1. Core Component Libraryの正本をどのProjectに置くか決める。
2. `POL_REUSE` の検索対象を、Component DB・Snippet DB・Study記事へ接続する。
3. Judge AI用の `RUB_PRODUCT`、`RUB_REUSE`、`RUB_QUALITY` を作る。
4. 各Projectの資産棚卸しを行い、3回以上出現した構造を候補化する。
