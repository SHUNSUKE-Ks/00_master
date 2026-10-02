# GameUIDesignerAgent 設計アイディア

作成日: 2026-07-13  
状態: idea  
用途: 既存DesignerAgentへ追加する `GAME_UI` Stateの設計資料

## 方針

```text
基盤: Gameface-UI
規範: interface-design方式
担当: 既存DesignerAgent内のGAME_UI State
参照: Godot・Phaser系の完成UI
検査: スクリーンショット比較
```

DesignerAgentを増やさず、一つのAgent内部で制作段階を切り替える。

## Workflow

```text
自然言語
  -> ui_reference.json
  -> ui_spec.json
  -> 決定的レイアウト処理
  -> SolidJS / Figma
  -> Screenshot
  -> ui_review.json
  -> 修正
```

自然言語から直接コードを生成せず、先に情報優先度と世界観をJSONへ固定する。

## 推奨構造

```text
agent_game_ui_designer/
├─ agent_config.json
├─ system_game_ui.md
├─ rules_visual_identity.json
├─ rules_anti_ai_ui.json
├─ references_index.json
├─ schemas/
│  ├─ ui_screen.schema.json
│  ├─ ui_component.schema.json
│  └─ ui_review.schema.json
├─ states/
│  ├─ state_reference.json
│  ├─ state_wireframe.json
│  ├─ state_styling.json
│  ├─ state_implementation.json
│  └─ state_review.json
└─ output/
   ├─ ui_spec.json
   ├─ ui_tokens.css
   └─ ui_review.json
```

## State

| State | Action | Output |
|---|---|---|
| reference | 類似ゲームとGitHub実装を最低3件収集する | `ui_reference.json` |
| wireframe | 情報優先度と操作導線を定義する | `ui_wireframe.json` |
| styling | 世界観を形状、材質、文字、演出へ変換する | `ui_visual_spec.json` |
| implementation | SolidJSコンポーネントとして実装する | `ui_components/` |
| review | スクリーンショットを規範と比較する | `ui_review.json` |

## 画面ごとの密度

| Screen | 方針 |
|---|---|
| Title | 情報を減らし、世界観と開始導線へ集中する |
| Battle HUD | 頻繁に見る情報を圧縮する |
| Inventory | 一覧性、カテゴリ、選択状態を強くする |
| Dialog | 文章と話者へ集中する |
| Result | 報酬と次の行動を強調する |

## Visual Identity

ゲーム世界内の物体をUI表現へ変換する。

```text
石板 / 羊皮紙 / 魔法陣 / 木枠 / 金属枠 / 端末画面 / 古書 / 軍用盤
```

一画面の視覚的主役は一つだけにする。補助要素は2〜3個、それ以外は背景として扱う。

## 導入順

1. Gameface-UIを部品単位で解析する。
2. `interface-design`方式で作品別のDesign Memoryを持つ。
3. `rules_anti_ai_ui.json` をReview前に適用する。
4. GitHub参考UIを3件選び、採用点と不採用点を記録する。
5. 実装後のスクリーンショットを比較し、`ui_review.json` を作る。

## 研究資料

GameUIAgent研究は、自然言語をDesign Spec JSONへ変換し、決定的処理でFigmaを生成し、VLM評価で修正する構造を持つ。完成製品として導入するのではなく、`ui_spec.json -> render -> screenshot -> review` の設計資料として扱う。
