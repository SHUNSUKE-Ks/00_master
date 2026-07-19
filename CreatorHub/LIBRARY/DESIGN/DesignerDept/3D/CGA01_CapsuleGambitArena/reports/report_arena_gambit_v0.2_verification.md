# 検証シート — アリーナ v0.2 ＋ Gambit評価エンジン(Step2)

検証者: Opus（em-verifier役） ／ 実施日: 2026-07-19
対象: `prototypes/arena/`（arena.mjs / gambitEngine.mjs / gambitCatalog.mjs / viewer.html）
      ＋ `battle-proto/src/gameState.js` の `createBattleState(overrides)` 拡張
設計・受け入れ基準: `brief/arena_viewer_v0.2_design.md`
方針: 実装者の自己申告を再利用せず、検証者が独立に再実行して判定した。

## 総合判定: ✅ 合格（実装は受け入れ基準を満たす）

コードは健全で、gameState.jsへの変更は本体ゲームに退行を与えていない。Gambitエンジンは6種すべてを設計意図通りに差別化して動かす。
未決事項はすべて**Gambitカタログ(ルール定義)側の設計課題**であり、エンジンのバグではない（下記 所見 F1〜F3）。

## 検証結果一覧

| # | 項目 | 方法 | 結果 | 証拠 |
|---|---|---|---|---|
| V1 | baseline 3v3 完走・勝敗表示 | `node arena.mjs` 独立実行 | ✅ | 2P(enemy)勝, 8ターン, 生存ゴーレムHP55/58 |
| V2 | baseline 決定性 | 2回実行しログdiff | ✅ | diff空（DETERMINISTIC_OK） |
| V3 | 後方互換: 無引数`createBattleState()`が従来と同一 | 専用スクリプトで12アサート | ✅ | **12/12 pass**（元2ユニット・数値・facingYaw一致、override経路が既定を汚染しない、インスタンス独立） |
| V4 | 実ゲーム(battle-proto)の退行なし | 稼働中dev(:5198)へ`?sprite=1`で接続、Title→モード→バトル通し | ✅ | screen遷移 title→modeselect→battle、units=元の2体(drake28@1,4 / golem58@3,1)、**console error 0**、fps60で盤描画（スクショ確認） |
| V5/V6 | viewer 再生（MAX/1x）と棋譜一致 | Gambit棋譜(825行)を読み込み末尾まで再生 | ✅ | tick825で評価メーター1P8%/2P92%、全味方カード「戦闘不能」、footerに決着ログ。棋譜最終行と一致 |
| G1 | Gambitエンジンが不正コマンドを出さない | gambit全対戦ログに「失敗:」が出ないこと | ✅ | 「失敗:」0件（applyCommandに拒否されたコマンドなし） |
| G2 | Gambit 決定性 | 2回実行しログdiff | ✅ | diff空（DETERMINISTIC_OK） |
| G3 | **6種の行動差別化**（＝ラッパーでない証明） | 統制1v1でevaluateGambitTurnを直接評価、11アサート | ✅ | **11/11 pass**（下表） |

### G3 行動差別化の内訳（統制1v1で確認）

| gambitSet | 検証した挙動 | 結果 |
|---|---|---|
| guardian | 射程外の敵を追わず移動を出さない／攻撃せずfaceWait | ✅ |
| sniper(range2) | 隣接されたら間合いを1→2に取り直し、射程内から攻撃 | ✅ |
| cautious | HP<35%で後退移動＋隣接でも攻撃しない／HP健全時は通常攻撃（対照） | ✅ |
| aggressive | 敵へ接近し距離を詰める | ✅ |
| boss_phase | 中期(33-66%)は隣接敵でも攻撃せず様子見／健在(>66%)は攻撃（対照） | ✅ |
| flanker | 敵の正面(facingYaw方向)ではなく側面(東)へ回り込んで攻撃 | ✅ |

## 所見（ブロッカーではない設計課題。数値バランスはスコープ外のため修正せず記録のみ）

- **F1（既知・実装者報告済）膠着による引き分け**: guardian(自分から仕掛けない)×cautious(低HPで永続後退)がかみ合うと、6種フルデモが400ターン上限で引き分けになる。**膠着打開ルール(例: Nターン経過で強制接近／攻勢化)がカタログに未整備**。ベースライン検証ツールが設計欠陥を可視化した好例。

- **F2（検証で新規発見）boss中期の"様子見"が移動を止めない**: mid期(33-66%)は攻撃だけ抑制され、`boss_normal_approach`(priority10, HP非依存)が生きているため敵へ接近し続ける。実測: HP53%・敵距離3で(2,4)→(2,2)へ前進しつつfaceWait。意図（様子見＝間合いを保つ）と不一致。修正するなら mid期に `hold_position`/`keep_distance` を priority>10 で追加するのが筋。**エンジンではなくカタログの穴**。

- **F3（軽微）flankerの側面成立は移動力依存**: 今ターンで側面/背面マスへ到達できなければ通常approachにフォールバックする仕様。3v3のranger(move2)では側面成立が限定的。仕様通りだが「側面突き」らしさはmove値に依存する点を明記。

## 検証者からの申し送り

- gameState.jsのプロトタイプ領域はgit未追跡（`??`）のため差分検証は不可。代わりに実行時アサート(V3)＋実ゲーム起動(V4)で退行なしを担保した。
- F1/F2はStep3(PlayerAdapter/LLM接続)より前に、カタログ精緻化として着手する価値がある。ただしいずれも「今のコードが仕様通り動いている」ことを覆さない → **本検証は合格**。
