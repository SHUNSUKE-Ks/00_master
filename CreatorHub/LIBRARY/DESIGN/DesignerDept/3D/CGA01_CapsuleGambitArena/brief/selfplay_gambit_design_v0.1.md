# 自己対戦アリーナ設計 v0.1（資料のみ・実装はPhase 4以降）

作成: FABLE 2026-07-18 ／ ユーザー質問「Ollamaだけでなく、ClaudeCodeやCODEXも自己対戦学習していけるようにガンビットと掛け合わせ、ゲーム画面でなくtextとログベースで連続対戦できる形でいい？」への回答を兼ねる。

## 回答: その方針で合っています

しかも現在の実装が最初からその形にできています。**gameState.jsはThree.jsを一切importしない純関数**なので、ブラウザなしのNode.jsでそのまま動きます。つまり「ゲーム画面なしのtext対戦」は新エンジンを作るのではなく、**今の戦闘ルールをそのまま高速回しするだけ**です。

## アーキテクチャ

```
arena.mjs (Node, 画面なし)
  ├─ import { createBattleState, applyCommand } ← battle-protoのgameState.jsをそのまま
  ├─ PlayerAdapter A ─┐ 盤面JSON → コマンドJSON {"type":"move",...}
  ├─ PlayerAdapter B ─┘（全操作が既にコマンドJSONなので追加契約は不要）
  └─ 出力: logs/match_<id>.jsonl（1行=1コマンド+結果イベント） + results.csv(勝敗/ターン数/残HP)
```

### PlayerAdapter の種類（同じインターフェースで差し替え）

| adapter | 中身 | 用途 |
|---|---|---|
| gambit | GambitDBのルール評価（LLM不要・ミリ秒） | 大量対戦の主力。学習=パラメータ選抜の対象 |
| ollama | ローカルLLMに盤面テキスト→コマンド | 外出先PCで無料連続対戦 |
| claude / codex | 各CLIをsubprocessで呼び盤面→コマンド | 少数の高品質棋譜・Gambitルールの改善案生成 |
| random / scripted | ベースライン | 強さの物差し |

## 「学習」の中身（重み学習ではなくパラメータ選抜）

1. Gambitルールの数値（HP閾値・優先度・接近距離）に幅を持たせた変種を量産
2. gambit vs gambit を数千戦（画面なしなので1戦<10ms級）→ 勝率で選抜・交配（進化的調整）
3. 性格別に別々の数値セットを保持 → 「勇敢は勇敢のまま強くなる」（性格の定義自体は人が書く。phase2計画書§4-Q4の切り分けどおり）
4. LLM(claude/codex/ollama)は①対戦相手 ②敗戦ログを読ませて「新ルール案」を出させる係。**LLMの重みは学習しない**（プロンプトとルールJSONが進化する）

## ログ規約（あとで分析・Result画面・リプレイに流用）

- 対戦単位: `{matchId, seed, agents:{ally,enemy}, gambitProfiles, result, turns}` ヘッダ行
- 各行: `{turn, actor, cmd, events}` — cmdは本編と同一形式なので**そのままdispatchすればリプレイ再生になる**（オンライン設計とも同じ土台）

## 実装ステップ（Phase 4候補・各1日以内）

1. arena.mjs: gameState import + random vs random で100戦完走・JSONL出力
2. gambit adapter: GambitDB 6種を実装（enemyTurnのAIをここへ移す）
3. 選抜ループ: パラメータ変異→総当たり→勝率表
4. ollama/claude adapter（盤面→テキスト整形は1関数）

## 前提条件（守り続けること）

- gameStateの純関数性（NFR-4/8）。これが壊れると全部崩れる
- 乱数を入れる時は必ずseed付き（リプレイ・オンライン同期のため）
