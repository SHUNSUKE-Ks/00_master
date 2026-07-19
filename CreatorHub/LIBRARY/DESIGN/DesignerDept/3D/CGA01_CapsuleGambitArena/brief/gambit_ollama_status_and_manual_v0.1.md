# Gambit / 自己対戦(Ollama含む) 現状報告＋AI引継ぎマニュアル v0.1

作成: 2026-07-19（開発一時停止・現状報告として作成）
対象読者: **このプロジェクトを初めて触るAI**（人間の同席なしで状況把握できることを狙う）

## 0. 結論（3行で）

- **Gambitシステム: 実装コード0%。設計・辞書データのみ100%完了。** `gameState.js`にGambitを呼ぶコードは1行もない
- **自己対戦アリーナ(Ollama含む): 実装コード0%。設計書1本のみ。** `arena.mjs`のようなファイルは存在しない
- 両方とも「次に何を作れば動き出すか」は具体的に決まっている（本書§3）。着手すればPhase 4の最初の一歩として現実的

## 1. 現状の正確な内訳

### 1-1. 敵AIは今どう動いているか（Gambitではない）

現在の敵の行動は`battle-proto/src/gameState.js`の`enemyTurn`ケース（コメント: `// 敵の簡易AI: 各敵が最寄りの味方へ1マス寄り、射程内なら攻撃。GambitDBの本格AI(Q04)は後日`）に**ハードコードされた1種類の固定ロジック**のみ：

1. 生存する敵ごとにループ
2. `nearestEnemy()`で最寄りの敵対ユニットを1体選ぶ
3. 射程外なら`stepToward()`で**1マスだけ**近づく（BFS/経路探索ではない単純な貪欲法）
4. 射程内なら`calcDamage()`で攻撃

これは全ユニット共通の1パターンで、`gambitSetId`（CSVに8体分定義済み: flanker/guardian/sniper/cautious/aggressive×2/boss_phase×1）は**一切参照されていない**。つまりボルト射手も坑道穿ちも同じ「最寄りへにじり寄って殴る」しかしない。

### 1-2. 存在する資料（設計のみ・コードなし）

| 資料 | 内容 | コード化状況 |
|---|---|---|
| `brief/selfplay_gambit_design_v0.1.md` | 自己対戦アリーナのアーキテクチャ設計（PlayerAdapter方式、Gambit=ルールベース高速AI、Ollama/Claude/CODEXは対戦相手の1種） | 設計のみ。`arena.mjs`等の実体なし |
| `GambitSystem/schemas/gambit.rule.schema.json`（`GAME/BattleEngine`配下、参照のみで直接利用は未接続） | ルールのJSON Schema | battle-protoとは未接続 |
| `GambitSystem/samples/gambit.sample.json`（同上） | 回復/攻撃/接近の3ルールのサンプル | 同上 |
| `brief/notion_import/GambitDB.csv` | 6種の行動パターン名・使用ユニット一覧 | データのみ、実行エンジンなし |
| `GambitSystem/prototypes/from_srpg_ai_019eebe2/ai/AIController.js`（旧SRPG試作、読取専用） | 「判断→ブリッジ実行」の分離設計の参考実装 | 移植されていない。読むだけの参考 |

## 2. なぜ「合っている」という前回の回答は変わらないか

以前ユーザーから「ClaudeCode/CODEXも自己対戦学習でき、Gambitと掛け合わせてtext/logベースで連続対戦できる形でいいか」と質問があり、回答は**「その方針で合っている」**でした。この回答自体は今も有効です。理由の核心：

`gameState.js`は**Three.jsを一切importしない純関数**です（`createBattleState()` / `applyCommand(state, cmd)`）。ブラウザなしのNode.jsでそのまま高速に何百戦でも回せます。全操作が`{"type":"attack","unitId":"...","targetId":"..."}`のようなJSONコマンドなので、「対戦相手」を人間UIからLLM(Ollama/Claude/CODEX)やGambitルールエンジンに差し替えるのは**新エンジンの開発ではなく、コマンドの発行元を差し替えるだけ**。この土台は既にある。**ないのは、その土台の上に乗るPlayerAdapterとGambit評価エンジンそのもの。**

## 3. 次の一歩（着手すれば動き出す具体的な入口）

`selfplay_gambit_design_v0.1.md` §実装ステップより、優先順位そのまま：

### Step 1（最も着手しやすい・約半日）: `arena.mjs` — 画面なしランダム対戦
```js
import { createBattleState, applyCommand } from "./battle-proto/src/gameState.js";
// random vs random で100戦回し、JSONL(1行=1コマンド+結果イベント)を出力するだけ
```
これだけで「ブラウザなしで対戦が回る」ことが証明できる。既存の`gameState.js`を**1行も変えずに**importするだけで動くはず（純関数設計の効果を最初に確認する工程）。

### Step 2: Gambit評価エンジン
`GambitDB.csv`の6種＋`gambit.sample.json`のルール形式（`when`/`then`条件式）を読み、`applyCommand`が受け付けるコマンドJSONへ変換する関数を書く。**これが「GambitSetId未実装」を解消する最初のコード**。`enemyTurn`ケースの固定ロジックをこの評価結果で置き換える（gameStateの契約=Three.js非依存は維持）。

### Step 3: PlayerAdapter（Ollama/Claude/CODEX共通インターフェース）
盤面JSON→コマンドJSONを返す関数を、対戦相手の種類ごとに用意（gambit版はStep2の関数そのもの、ollama版はプロンプト整形+API呼び出し）。

## 4. 着手前に必ず確認すること（他AI向け注意）

- `gameState.js`は**純関数性を絶対に壊さない**（Three.js importが1つでも入った瞬間、Node単体実行ができなくなり本設計全体が崩れる）
- 乱数を使うなら**必ずseed付き**にする（自己対戦ログの再現性・将来のオンライン同期の両方に必須）
- Gambit評価エンジンは`gameState.js`に置くか別ファイルに分離するか要判断だが、**いずれもThree.js非依存であること**が唯一の制約
- 敵の`gambitSetId`はCSV(`enemy_master_v0_1.csv`)に既に紐付いている。データの正はそちら

## 5. 未着手の理由（正直な経緯）

Phase 4（Gambit接続・自己対戦アリーナ・はこにわ）はPhase 0〜3（盤・移動・ターン・画面フロー・地形ルール）の完成を優先したため、設計だけ済ませて実装は着手していない。2026-07-18〜19は2.5Dスプライト検証と向き保持バグ修正が優先されたため、Phase 4は依然未着手。
