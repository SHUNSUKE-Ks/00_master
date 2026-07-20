# 設計指示 v0.1 — Launchpad風サンプラーMVP（4テンプレート・48パッド・UI4モード）

作成: FABLE (2026-07-20) ／ 実装: Sonnet（T4のみOpus） ／ 検証: Opus ／ 曖昧さ発見時: `spec_return_log.md` へ SR-### で起票し停止（勝手に解釈しない）

正の所在:
- 要件の正: `brief/requirements_launchpad_sampler01.md`
- 見た目の参考: `brief/ui_reference_launchpad_ipad.md`（要件と矛盾したら要件が勝つ）
- パッド配置・色・音源対応の正: `src/data/system_templates.json`（本設計書のD4で構造を凍結。実装後はJSONが正）

---

## 0. ゴールの受け入れ基準（G1..G5。すべて満たされたら完了）

- G1: `npx tsc --noEmit` がエラー0で通る。
- G2: `node scripts/validate_templates.mjs` が exit 0。検証内容: (a)4テンプレート存在 (b)各テンプレート8パッド以上に sample 指定 (c)全 sample が `assets/samples/` に実在 (d)全 sample が `src/data/sampleMap.ts` のキーに存在 (e)row∈0..5, column∈0..7 で重複なし。
- G3: `node scripts/gen_placeholder_wavs.mjs` を2回実行し、生成WAVのバイナリdiffが空（決定性。乱数はseed固定）。
- G4: Android実機（Expo Go）で手動チェックリストV4の8項目が全て pass（Opusが立ち会い判定、または実行ログ・動画で判定）。
- G5: 生成物（node_modules, .expo, 生成WAV以外の一時ファイル）がgitに混入していない。

## 1. 設計判断（D1..D10。Sonnetは再解釈禁止）

- D1: **プロジェクト位置** `APP/app_launchpad_sampler01/` 直下にExpoプロジェクトを作る（サブフォルダを掘らない）。理由: APP/配下の既存2アプリ（kanban-note01, novelEngine）と同じ並び。
- D2: **技術スタック固定**: Expo (SDK最新安定) + TypeScript strict + expo-audio + Zustand + AsyncStorage + Reanimated。React Contextは使わない。理由: 要件§6の二択（Zustand or Context）はZustandに裁定。CGA01でストア一元管理の型が実証済み。
- D3: **音の再生規約**: `expo-audio` の `createAudioPlayer` でテンプレートロード時に**割当パッド1つにつき1プレイヤー**を生成・保持。押下時は `seekTo(0)` → `play()`。同一パッド連打は自分の音を頭から再トリガー（自己チョーク）で良い。異なるパッド同時押しは各プレイヤーが独立再生（重なる）。テンプレート切替時は旧プレイヤーを全て `remove()`/解放してから新規生成。理由: MVPはプレイヤープール等の最適化をしない。最も単純で要件（FR-03）を満たす。
- D4: **テンプレートJSONの構造凍結**（1ファイル `src/data/system_templates.json` に4テンプレートを配列で持つ。正は1箇所）:
  ```json
  {
    "version": 1,
    "templates": [
      {
        "id": "template_hiphop01",
        "name": "HipHop",
        "accentColor": "#ff5b2b",
        "pads": [
          { "id": "pad_01", "row": 0, "column": 0, "label": "KICK",
            "category": "drum", "color": "orange",
            "sample": "drum_kick_hiphop01.wav" }
        ]
      }
    ]
  }
  ```
  - `category` は `"drum" | "bass" | "melodic" | "fx" | "perc" | "vocal"` の6値のみ。
  - `color` は `"green" | "blue" | "purple" | "orange" | "indigo" | "teal" | "red" | "yellow"` の8値のみ。
  - `sample` 省略時は空パッド。48パッド全部をJSONに書く必要はない。JSONに無い(row,column)は `empty` として描画する。
  - 4テンプレートの最低音色は要件§4の表の通り（各8音）。配置は各テンプレート左上から: 列0-1=ドラム系、列2=ベース/低音系、列3-5=メロディック/その他、列6=FX、列7=ボーカル/パーカッション。埋まらない列は空で良い。
- D5: **カテゴリ→色の既定辞書**（ui_reference準拠）: drum=green / bass=blue / melodic=purple / fx=orange / perc=indigo / vocal=teal。JSONの `color` はこの既定に従って記入する（パッド単位で上書き可能な設計だが、MVVでは辞書通りに書く）。
- D6: **サンプル解決の規約**: React Nativeの `require()` は動的文字列不可。よって `src/data/sampleMap.ts` に `{"drum_kick_hiphop01.wav": require("../../assets/samples/drum_kick_hiphop01.wav"), ...}` の静的マップを手書きする。JSONとマップの整合は `validate_templates.mjs`（G2）が機械検証する。理由: RNの制約に対する唯一の素直な解。
- D7: **音源はプレースホルダを自前合成**: `scripts/gen_placeholder_wavs.mjs`（Node単体、依存パッケージなし）でPCM 16bit/44.1kHz/モノラルのWAVを合成生成する。kick=減衰サイン(60→40Hz)、snare=ノイズ+短サイン、hat=高域ノイズ短、等の簡易シンセで良い。全32音（4テンプレート×8）を決定的に生成（Math.random禁止、使うならseed付き自作PRNG）。ライセンスは自作=CC0とし `assets/samples/LICENSES.md` に「全ファイル: 本リポジトリで合成生成、CC0」と記録。理由: 権利確認ゼロで即開発開始でき、後で実音源に差し替えるだけで済む。
- D8: **状態ストア形状の凍結**（`src/state/useAppStore.ts`、Zustand 1ストア）:
  ```ts
  type Mode = "pad" | "filter" | "volume" | "fx";
  interface AppState {
    selectedTemplateId: string;          // AsyncStorageへ永続化（キー: "lps01.selectedTemplateId"）
    mode: Mode;                          // 永続化しない
    filterFaders: number[];              // 長さ8, 0..1, 初期値0.5, 永続化しない
    volumeFaders: number[];              // 長さ8, 0..1, 初期値0.8, 永続化しない
    fxActive: boolean[];                 // 長さ16, 初期値all false, 永続化しない
    pressedPadIds: string[];             // 押下中パッド。描画用
  }
  ```
  フェーダー・FX状態はテンプレート横断のセッション状態（FR-05）。
- D9: **画面は2枚に集約**: screen_home（テンプレート4カード）と screen_pad。要件§7の screen_template は screen_home と機能が重複するためMVPでは**作らない**（ホームがテンプレート一覧を兼ねる）。ナビゲーションはreact-navigation等を**入れず**、`selectedScreen` 相当のローカルstateで切替（画面2枚に外部ルーターは過剰）。理由: 依存最小。
- D10: **層の契約**: UIコンポーネントは `expo-audio` を直接importしない。音に触るのは `src/audio/padPlayer.ts` のみ。`padPlayer.ts` はZustandストアをimportしない（引数で受ける純粋API）。JSON構造の型定義は `src/data/types.ts` に置き、全ファイルはそこからimportする。

## 2. タスク分割（実装順に上から）

| T# | 内容 | 担当 | 理由 |
|---|---|---|---|
| T1 | Expoプロジェクト scaffold（TypeScript strict、依存: expo-audio, zustand, @react-native-async-storage/async-storage, react-native-reanimated）＋ `.gitignore`（node_modules, .expo） | Sonnet | 定型作業 |
| T2 | `scripts/gen_placeholder_wavs.mjs`（D7）＋ 実行して32音生成 ＋ `assets/samples/LICENSES.md` | Sonnet | 仕様凍結済み・決定性はG3で機械検証 |
| T3 | `src/data/types.ts` ＋ `system_templates.json`（4テンプレート、D4/D5準拠）＋ `sampleMap.ts`（D6）＋ `scripts/validate_templates.mjs`（G2の5項目） | Sonnet | 書面で全部決まっている |
| T4 | `src/audio/padPlayer.ts` — 契約API: `loadTemplate(template, sampleMap): Promise<void>` / `trigger(padId): void` / `unloadAll(): void`（D3準拠） | **Opus** | 中核契約ファイル。expo-audioのライフサイクル判断が発生しうる |
| T5 | screen_pad: `PadGrid.tsx` `Pad.tsx`（8×6、状態4種描画、押下で trigger＋点灯、マルチタッチ対応）＋ヘッダー | Sonnet | UI定型。音はT4のAPIを呼ぶだけ |
| T6 | `ModeRail.tsx`（4モード）＋ `FaderPanel.tsx`（8本、filter=ノブ型/volume=塗りバー型、ドラッグで値更新）＋ `FxPanel.tsx`（16カード、タップで点灯トグル） | Sonnet | UI状態のみ、音に接続しない（FR-04/05） |
| T7 | screen_home（4カード）＋ AsyncStorage永続化・復元 ＋ 画面切替 | Sonnet | 定型 |
| T8 | 検証（§4のV1..V4を独立再実行、検証シート作成） | **Opus** | 実装者の自己申告を信じない |

## 3. 触ってよいファイル

- **新規作成可**: `APP/app_launchpad_sampler01/` 配下すべて（scaffold含む）
- **変更可**: 同上（自プロジェクト内のみ）
- **禁止**: `APP/kanban-note01/`, `APP/novelEngine/`, `CreatorHub/`, `CreatorGameLab/`, `AgentRoom/` ほか本プロジェクト外の一切。ルートの設定ファイル（.gitignore等）も触らない（.gitignoreは自プロジェクト直下に置く）
- **凍結（実装中の変更禁止、変更したければSR起票）**: `brief/` 配下の全md、D4のJSONスキーマ、D8のストア形状、D10の層契約

## 4. 検証項目（V1..V4。Opusが独立再実行）

- V1: `npx tsc --noEmit` → エラー0（=G1）
- V2: `node scripts/validate_templates.mjs` → exit 0、5検査項目のログ出力を確認（=G2）
- V3: WAV生成を2回実行し `git status` / バイナリ比較でdiff空を確認（=G3）。ついでに生成WAVを1つ開きRIFFヘッダ・44.1kHz/16bitを確認
- V4: Android実機（Expo Go）手動チェックリスト（=G4）:
  1. 4テンプレートがホームに表示され選択できる
  2. HipHopで8音以上が鳴る（全割当パッドを叩く）
  3. 2パッド同時押しで音が重なる
  4. 押下時に点灯＋縮小フィードバックが即時（体感で遅延なく）出る
  5. 4モード切替でレール強調と下部パネルが切り替わる
  6. フェーダーがドラッグ追従し、FXカードがタップで点灯トグルする
  7. 機内モードで起動→再生できる
  8. テンプレートをRockに変更→アプリ完全終了→再起動でRockが復元される

検証シートは `reports/report_launchpad_mvp_v0.1_verification.md` に、CGA01の書式（V#ごとの合否・所見F#・追検証）で書く。

## 5. 実装順の注意（Sonnetへ）

- T1から順に。前のTのG該当項目が通ってから次へ進む。
- 要件§10の通り、T5はまずHipHopテンプレートのみで音が鳴るところまで確認してからT6へ。
- 曖昧・矛盾を見つけたら実装で解決せず `brief/spec_return_log.md` に SR-### で起票して停止。
