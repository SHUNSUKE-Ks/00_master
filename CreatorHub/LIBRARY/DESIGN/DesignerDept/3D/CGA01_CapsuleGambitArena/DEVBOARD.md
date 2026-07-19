# 📋 DEVBOARD — エレメンタルモンスターズ(仮) / CGA01 開発状況ボード

**他のAI・人間はまずこれを読む。** 各Phase完了時に担当AIがこのファイルを更新する（NFR-9）。
最終更新: 2026-07-19 (Sonnet) — ユーザー指示によりここで開発を一時停止し現状報告

## いま動くもの

| もの | 起動 | 状態 |
|---|---|---|
| 🎮 Battle 3D（本命） | `prototypes/threejs/battle-proto` → `npm run dev` → http://127.0.0.1:5198 | **Title→モード選択→バトル→Result の1周が遊べる。実画像素材（7枚）反映済み** |
| 🏪 Asset Store（GLB閲覧） | `prototypes/threejs/asset-store` → port 5197 | 9アセット稼働 |
| 🌐 2D版+公式サイト（CODEX担当） | `CreatorGameLab/titleGameStudios/CGA01_CapsuleGambitArena` → port 5196 | 参照のみ・変更禁止 |

## Phase進行表

| Phase | 内容 | 状態 | 報告書 |
|---|---|---|---|
| 0 | 5x6盤・GLB表示・クリック選択・JSON移動 | ✅ 7/7合格 | reports/report_battle_proto_phase0_v0.1.md |
| 1 | カプセル開封・バナー・ダメージ・パネル・攻撃/ターン | ✅ | reports/report_battle_proto_phase1_v0.1.md |
| 1.5 | 勝敗判定・敵AI・リザルト・マウス/キー操作・設定画面 | ✅ | （チャット検証、書式化はPhase2報告と統合予定） |
| 2 | BFS移動範囲表示・1ターン1行動・自動ターン交代・向き制御・向き決めフェーズ | ✅実装済 / 検証書未 | **未**: report_phase2_v0.1.md（Sonnet中断→要再実行） |
| 3 | 画面フローモック(Title/モード/Result)・地形通行+ジャンプ | ✅完了（FR6件/NFR該当分すべて✅） | reports/report_phase3_v0.1.md |
| 4+ | Gambit接続→自己対戦アリーナ→はこにわ(Track B)→HP組込 | **アリーナv0.2着手**（固定ロジック基準線+viewer動作確認済、Gambit本体は未着手） | brief/selfplay_gambit_design_v0.1.md / brief/gambit_ollama_status_and_manual_v0.1.md / **設計書: brief/arena_viewer_v0.2_design.md** |

## 未完タスク（次にやること順）

- [完了 2026-07-19] 2.5Dスプライトテストモード（`?sprite=1`でゴーレムのみ板ポリ差替）を実装・検証。受入A1-A6/A8=✅, A7=△(mobileは盤未描画=プロト制約)。所見: 統一感良好・要調整はアート側の足元/余白framing規約。→ `battle-proto/reports/report_sprite_test_v0.1.md`（採否はユーザー判断待ち＝決定事項ログの「モンスター表現方式」）
- [完了 2026-07-19] Gambit評価エンジン(Step2)実装。`prototypes/arena/gambitEngine.mjs`(評価器)+`gambitCatalog.mjs`(GambitDB.csv 6種をgambit.rule.schema.json準拠で具体化)。
  `node arena.mjs gambit` で3v3の6種フル動員デモが動く(gambitSetIdをユニットに付与するだけで固定ロジックから差し替わる設計。gameState.js無変更)。決定性・20戦統計とも確認済み。
  **所見(実装バグではなくAI設計上の発見)**: guardian(ゴーレム)×cautious(スカウト,HP35%未満で永続後退)の組み合わせが400ターン上限まで膠着し引き分けになった。両者とも「相手から仕掛けない限り動かない」性質同士がかみ合うと決着しない — Gambit設計時に「膠着打開ルール(例: 一定ターン経過で強制接近)」が必要という具体的な検証結果。バランス調整はスコープ外のため数値修正はせず、所見として記録のみ。
  **[検証済 2026-07-19 Opus] 合格**。検証シート: reports/report_arena_gambit_v0.2_verification.md。V1-V6+Gambit差別化(6種11アサート)+実ゲーム退行なし(:5198起動確認)を独立再実行で確認。所見(ブロッカーでない): F1 guardian×cautious膠着で引分(膠着打開ルール未整備), F2 boss中期の様子見が接近移動を止めない(カタログの穴,エンジンは正常), F3 flankerの側面成立はmove依存。いずれもカタログ設計課題でエンジンのバグではない。
- [完了 2026-07-19] アリーナv0.2（多対多＋viewer）実装。設計: brief/arena_viewer_v0.2_design.md。
  T1(gameState.js): `createBattleState(overrides)` に拡張（units差替可、無引数は従来と完全一致をnode -eで確認）。触ったのはOpus範囲だが本セッションではSonnet(Fable指示のもと)が実施— **正式検証(V1-V6)はOpus/em-verifierへ未依頼のため今後要実施**。
  T2(arena.mjs v0.2): 3v3ロースター(ROSTER_3V3)追加、JSONL各行にunitsスナップショット(D3スキーマ)を付与。3v3完走・8ターンで決着、2回実行のdiff一致で決定性を確認。
  T3(viewer.html): 棋譜(JSONL)をドラッグ&ドロップ/ファイル選択で読み込み、1x/2x/MAX速度で再生する静的HTML(サーバー不要)。header/評価メーター/両サイドログ+中央ユニットカード2枚/footer節目ログのレイアウトで実装、ブラウザで実棋譜を読み込みMAX再生→最終状態(1P0%/2P100%, 全滅表示)を確認。mapview.html/remote.htmlはプレースホルダのみ設置。start_arena.bat/start_viewer.batで起動可。
  所在: prototypes/arena/（arena.mjs, viewer.html, mapview.html, remote.html, start_*.bat, logs/）
- [完了 2026-07-19] 敵ユニットの向き保持バグ修正。原因: `renderAdapter.sync()`が毎tick、敵の`facingYaw`(gameState側。プレイヤーのfaceWait操作でしか更新されず敵ターンでは不変)で`v.sprite.yaw`を強制上書きしていたため、攻撃で横を向いても直後に正面(初期値yaw=0)へ戻っていた。修正: 「向いた方向を覚える」責務を描画層(`faceYaw()`)に一本化し、`sync()`は上書きしないよう変更。gameState.js無変更。横向き攻撃→4回の強制sync tick後も向き維持を実写で確認（スクショ5枚: `reports/screenshots_2026-07-19_facing_fix/`）

1. **Phase 2 検証書**（Opus/Sonnet）: brief/phase2_tasks_v0.1.json のT4を実行（前回Sonnetはセッション上限で中断。Phase2自体は実装済で遊べる）
2. UI部品の差し戻し1件: ui_capsule_lid 再生成（ComfyUI発注済み REQ-20260717-105）
3. Notion 6DBへのCSV取り込み（人間・各DB10秒）: brief/notion_import/
4. imageboard 4枚（HP用ヒーロー/工房/バトル/はこにわ生活）をCODEX 2D公式サイト側へ組込（納品済み・組込未着手）
5. Phase 4着手判断: Gambit接続 / 自己対戦アリーナ / はこにわ のどれから始めるか（brief/selfplay_gambit_design_v0.1.md参照）

## 決定事項ログ（合意済み・覆す時はユーザー確認）

- タイトル「エレメンタルモンスターズ」仮採用（CGA01=プロジェクトコード）
- 体制: FABLE=計画 / Sonnet=実装 / Opus=検証 / FABLE=抜き取り最終確認
- 正の所在: ルール数値=2D側CSV ／ 3D資産=exports/asset-manifest.json ／ 企画・編集=Notion(節目同期)
- 勝敗=全滅方式で仮実装（Q06「金の卵」案は未決）
- 全操作はコマンドJSON経由（オンライン・自己対戦・リプレイの土台。壊さない）
- 1ユニットの行動: 移動→向き決め(4方向スナップ)クリックで終了、または攻撃で終了。全員終了で自動ターン交代
- 地形通行: terrain_master_v0_1.csvのpassableMovementTypesが正。進入不可1マスは放物線ジャンプ(コスト2)で飛び越え可（gameState.jsのTERRAIN_PASSABLE定数に転記済み）
- 画面フロー: Title/モード選択/バトルの3画面をhashで遷移。はこにわ/ずかんは「準備中」で選択不可。Resultの「もう一度/タイトルへ」はstate再生成+シーン再構築（location.reloadは使わない）
- 開発チーム(2026-07-18): CGA01専用のFABLE_Manager傘下に3階層エージェント10体を配備。**モデルはエージェントに固定**(スキルには付かない)。責務: fable=戦略/要件/最終承認, opus=密結合実装/検証/仕様凍結, sonnet=凍結仕様の実装。憲章=`AgentRoom/experiments/EM_TeamCharter/em_team_charter_2026-07-18.md`, 実体=`C:\00_master\.claude\agents\em-*.md`。**Sonnetに投げる前に憲章§4チェックリスト(受け入れ基準/触れる範囲/参照資料/アーキ判断残なし)を満たすこと**
- モンスター表現方式: 2.5Dスプライト主方式の是非を検討中（盤・地形=3D / ボス=完全3D許容）。未決=ユーザー判断待ち

## 資料の入口

- 中央索引（キーワード→資料）: `C:\00_master\CreatorHub\LIBRARY\DESIGN\DEVELOPMENT_DOCUMENT_INDEX_2026-06-29.md`
- 企画書（参考ゲーム43枚のパーツ辞書つき）: brief/cga01_3d_planning_report_2026-07-16.md
- アーキテクチャと操作: prototypes/threejs/battle-proto/README.md
- 未解決の質問リスト: brief/questions_to_2d_predecessor_v0.1.json（open 8件）
- エージェント定義: AgentRoom/experiments/ DSN02(3D)・PLN01(Planner)
