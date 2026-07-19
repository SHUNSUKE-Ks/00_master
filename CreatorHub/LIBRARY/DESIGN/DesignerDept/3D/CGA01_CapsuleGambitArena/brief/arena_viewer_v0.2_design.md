# アリーナ v0.2 設計書 — 多対多(A) ＋ テキストログviewer(B)

作成: 2026-07-19 (FABLE) ／ 実装: Sonnet(em-feature-dev) ／ 検証: Opus(em-verifier)
前提資料: `brief/gambit_ollama_status_and_manual_v0.1.md`（現状0%報告＋Step1-3計画）
現状: `prototypes/arena/arena.mjs` v0.1 が1v1固定ロジック対戦を完走済み（決定的・乱数なし・JSONL棋譜出力あり）

## 0. ゴールと非ゴール

**ゴール**
- (A) 3v3の多対多で固定ロジック(基準線AI)同士が決着まで自己対戦できる
- (B) その棋譜(JSONL)を、ユーザー承認済みレイアウト（header/評価メーター/4カラム+両サイドNavi/footer総合ログ）のviewer.htmlで再生できる

**非ゴール（今回やらない・書くのも禁止）**
- Gambit評価エンジン、Ollama/LLM接続（Step2/3。次版）
- ライブ観戦（SSE/WebSocket）。今回は**棋譜ファイルの再生専用**
- mapview.html / remote.html の中身（「準備中」1行のプレースホルダのみ置く）
- バランス調整（ステータス数値の変更。データの正はCSV側）

## 1. 設計判断（Sonnetは再解釈禁止。疑問はem-manager経由で差し戻し）

- **D1: `createBattleState(overrides)` を追加引数として拡張する（gameState.js唯一の変更点）**
  `overrides = { units?: [...] }` を受け、あればunits配列を差し替える。**無引数呼び出しの結果は現状と完全一致**（既存battle-proto本体に影響ゼロ）。Three.js import追加は絶対禁止。
- **D2: viewerは「再生専用・サーバーレス」**。viewer.htmlは素の静的HTML1枚（ビルド不要・外部CDN禁止・全部インライン）。JSONLは`<input type="file">`とドラッグ&ドロップで読む。これで「BATで開ける・軽量」を満たす。ライブ配信は将来SSEを足すだけの構造にしておく（描画関数は「1行ぶんのレコードを受けて画面更新」の単機能に分離）。
- **D3: JSONL 1行のスキーマを拡張**（arena.mjs側のみの変更）:
  ```json
  { "tick": 3, "cmd": {...}, "events": [...],
    "units": [ { "id":"", "team":"", "name":"", "hp":0, "maxHp":0, "atk":0, "def":0, "x":0, "y":0, "acted":false } ] }
  ```
  `units`は**そのコマンド適用後のスナップショット**。viewerは盤ロジックを一切持たず、この行を順に描くだけにする（viewer側にルール知識ゼロ＝ルール変更でviewerが壊れない）。
- **D4: 評価メーター式 v0** = `味方Σhp ÷ 味方ΣmaxHp` と敵側同値の比。50%中央のバー1本。凝った評価式は入れない。
- **D5: 決定性の維持**。ロースターは固定JSON、乱数は一切使わない。将来ランダム編成を入れる時は必ずseed付きPRNG（`Math.random`禁止）— 今回は書かない。
- **D6: 3v3ロースター**はarena内の定数`ROSTER_3V3`として定義（別ファイル化しない）。ステータスは既存2ユニットの値を基準に、レンジ役(range2,低def)と軽量役(move4,低hp)を各チーム1体ずつ追加した対称構成。数値の出典コメントに「暫定・正はCSV」と明記。

## 2. 機能要件

### A: 多対多（arena.mjs v0.2）
- FR-A1: `node arena.mjs` が3v3で決着まで完走し、勝敗・ターン数・生存者を表示する
- FR-A2: `node arena.mjs 20` の統計モードが3v3で動く
- FR-A3: JSONL各行にD3のunitsスナップショットが入る
- FR-A4: 決定的（同一コマンドで2回実行→JSONLがbyte一致。タイムスタンプはファイル名のみ）
- FR-A5: 固定ロジック(decideTurn)は現行のまま流用（貪欲接近＋射程内攻撃）。複数ユニットでも1体ずつ配列順に処理

### B: viewer.html（prototypes/arena/viewer.html）
- FR-B1: レイアウト＝ユーザー提示モック通り。header／評価メーター／メイン(左Navi・1Pテキストログ・1Pパラメーター・2Pパラメーター・2Pテキストログ・右Navi)／footer総合ログ
- FR-B2: JSONL読込（ファイル選択＋D&D）→ 再生ボタンで1行ずつ流す。速度切替 1x(600ms/行)・2x・MAX(遅延なし)
- FR-B3: 両サイドのテキストログ＝**そのチームのユニットのcmd/eventsに由来するlogテキストのみ**を左右に振り分け（1P=ally左、2P=enemy右）
- FR-B4: 中央パラメーター＝ユニットカード縦積み。カード内容: 名前・HP(バー付き)・AT・DF・座標(x,y)・行動済みマーク。hp0で暗転表示。unitsスナップショットから毎行再描画
- FR-B5: 評価メーター＝D4の式で毎行更新
- FR-B6: footer総合ログ＝**節目のみ**（開戦・撃破・ターン交代・決着）。全文は流さない
- FR-B7: 両サイドNavi枠は空divで幅だけ確保（アイコンは将来）
- FR-B8: ダーク背景基調（バトル画面と同系）。CSS変数で色定義
- FR-B9: `start_viewer.bat` … viewer.htmlを既定ブラウザで開くだけのBAT

### C: プレースホルダ
- FR-C1: `mapview.html` / `remote.html` を「準備中」表記のみで設置（各10行以内）

## 3. 触ってよいファイル / 禁止事項

| 可否 | 対象 |
|---|---|
| 変更可 | `prototypes/arena/arena.mjs`, `prototypes/arena/start_arena.bat` |
| 新規可 | `prototypes/arena/viewer.html`, `start_viewer.bat`, `mapview.html`, `remote.html` |
| **限定変更** | `battle-proto/src/gameState.js` — **D1の引数追加のみ**。既存ロジック・数値・関数シグネチャ他一切変更禁止 |
| 禁止 | renderAdapter.js / main.js / index.html ほかbattle-proto配下すべて。npm依存の追加。外部CDN読込 |

## 4. 検証（Opus/em-verifierが実施）

- V1: `node arena.mjs` 3v3完走・勝敗表示（FR-A1）
- V2: 2回実行しJSONL diffが空（FR-A4）
- V3: 無引数`createBattleState()`が従来と同一オブジェクトを返す（node -eでJSON比較）
- V4: battle-proto本体がデグレなし（`?sprite=1`含め起動してTitle→バトル1周。CDPで確認）
- V5: viewer.htmlにJSONLを読ませMAX速度で最後まで再生、カードHPと最終ログが棋譜と一致。スクショ保存
- V6: 1x速度でログが上から下へ順に流れる（体感確認スクショ2時点）

## 5. タスク分割と担当

| # | 内容 | 担当 | 理由 |
|---|---|---|---|
| T1 | gameState.js D1拡張（数行） | **Opus** (em-programmer) | 中核契約ファイルの変更のため。凍結仕様でも番人が直接触る |
| T2 | arena.mjs v0.2（3v3＋スナップショット） | Sonnet (em-feature-dev) | 仕様凍結済み・境界明確 |
| T3 | viewer.html＋BAT＋プレースホルダ | Sonnet (em-feature-dev) | 同上。レイアウトはFR-B1のモック通り |
| T4 | 検証V1-V6＋報告書 | **Opus** (em-verifier) | 合否判定の信頼性 |

実装順: T1 → T2 → T3 → T4（T2はT1完了後。T3はT2のJSONLサンプルがあると楽だが並行可）
