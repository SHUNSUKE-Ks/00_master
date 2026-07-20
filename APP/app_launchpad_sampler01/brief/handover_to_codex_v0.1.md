# CODEX引継ぎ資料 v0.1 — app_launchpad_sampler01

作成: FABLE (2026-07-20) ／ 引継ぎ先: CODEX（本プロジェクトの実装担当。設計書v0.1でSonnet/Opus分担を想定していたが、今回はCODEXが実装全体を引き継ぐ）
本資料の位置: `C:\00_master\APP\app_launchpad_sampler01\brief\handover_to_codex_v0.1.md`

---

## 0. まず読むファイル（正の所在。パスは全て明示する）

| 順 | 種別 | フルパス | 備考 |
|---|---|---|---|
| 1 | 要件定義（正） | `C:\00_master\APP\app_launchpad_sampler01\brief\requirements_launchpad_sampler01.md` | 全機能要件・非機能要件の正 |
| 2 | 設計書 v0.1（凍結） | `C:\00_master\APP\app_launchpad_sampler01\brief\design_mvp_v0.1.md` | D1〜D10の技術判断、G1〜G5受け入れ基準、T1〜T8タスク分割 |
| 3 | UI参照パーツ辞書 | `C:\00_master\APP\app_launchpad_sampler01\brief\ui_reference_launchpad_ipad.md` | 本家Launchpadスクショのテキスト化。見た目の参考（要件と矛盾したら要件が勝つ） |
| 4 | **デザインモック（本資料の核）** | `C:\00_master\APP\app_launchpad_sampler01\brief\mockup\screen_mock_v0.1.html` | 機能なし・単一HTML。**このレイアウトフォーマットをRNで1:1踏襲すること**（詳細は§2） |
| 4' | デザインモック共有複製 | `C:\00_master\MockUp\app_launchpad_sampler01\screen_mock_v0.1.html` + 同フォルダ `README.md` | 内容は4と同一。ブラウザで直接開いて確認可 |
| 5 | 差し戻しログ | `C:\00_master\APP\app_launchpad_sampler01\brief\spec_return_log.md` | 曖昧点発見時の起票先（§4参照） |
| 6 | DEVBOARD | `C:\00_master\APP\app_launchpad_sampler01\DEVBOARD.md` | 進行状況・決定事項ログ |

---

## 1. 経緯（担当変更）

設計書v0.1のT1〜T8は当初「Sonnet実装／Opus検証」の分担で書かれている。**今回はCODEXがこの実装を丸ごと引き継ぐ**。
- G1〜G5（受け入れ基準）、D1〜D10（設計判断）、T1〜T8（タスク内容）はそのまま有効。担当欄の「Sonnet/Opus」は「CODEX」と読み替えてよい。
- T4（`audio/padPlayer.ts`＝中核契約ファイル）とT8（検証）は元々Opus指定だった＝**特に慎重な判断が必要な箇所**という意味なので、CODEXも自己検証を厳密に行うこと（§5参照）。
- 実装着手前に、FABLEが「機能なしの見た目だけのHTMLモック」を作成済み（§2）。これは今回の引継ぎで**最重要の参照物**。

---

## 2. 最重要: HTMLモックのレイアウトフォーマットをReact Nativeで順守する

`brief/mockup/screen_mock_v0.1.html` は言語・実装手段がHTML/CSS/JSからReact Native(TypeScript)に変わっても、**画面構成・配置・状態表現・配色トークンは1:1で踏襲する**契約物として扱うこと。「参考」ではなく「レイアウト仕様」として扱う。

### 2.1 画面構成（そのまま実装）

- **screen_home**: テンプレートカード4枚を横並び（Rock/Jazz/Drum & Bass/HipHop）。各カードに art（ジャンル色グラデーション）、テンプレート名、代表音色サブテキスト。選択中カードには枠強調（`sel`相当）。
- **screen_pad**:
  - ヘッダー: 戻るシェブロン／テンプレートアイコン+名前／スペーサー／`⋯`／録音アイコン(accent色)／停止アイコン
  - 本体: 左に「パッドグリッド＋下部パネル」(padmain)、右に「モードレール」(rail)
  - パッドグリッド: **8列×6行=48マス**、CSS Grid相当（RNでは`flexWrap`かFlatList gridで48マス固定レイアウトを再現）
  - 右レール: 縦積み4ボタン「パッド／フィルター／ボリューム／FX」、選択中はアクセント色背景+枠
  - モードが「パッド」以外のとき: グリッドが圧縮され（高さ約46%相当）、カテゴリ名ラベルが消えアイコンのみの簡易表示になり、下部に選択モードのパネルが表示される（`padmain.compact`の挙動を再現）

### 2.2 状態表現（そのまま実装）

- パッドの状態: `idle`（通常）／`pressed`（押下中＝同系色の輝度アップ＋96%程度に縮小、指を離すと約120ms後に戻る）／`active`（再生中の余韻＝内側グロー、MVPでは省略可）／`empty`（破線枠、操作不可、色は暗グレー固定）
- FXカード: タップで`lit`状態にトグル（背景がカテゴリ色の明色に変わり文字が白になる）。UI状態のみ、実際のFX処理はしない（要件FR-04/05）
- フィルターパネルとボリュームパネルは**見た目を意図的に変える**（同じ8本フェーダーでも型が違う）:
  - フィルター＝細いトラック＋ノブ（つまみ）が上下に動く型
  - ボリューム＝太いトラックの下から塗りつぶすバー型
  - ドラッグで値が変わる見た目（実音には反映しない。要件FR-05）

### 2.3 配色トークン（そのままカラーパレット定数に転用）

モックHTML冒頭の`:root{ }`（`design_mvp_v0.1.md` D5のカテゴリ色辞書に対応）をRN側の色定数ファイルへそのまま移す:

```
bg: #0c0e11        bg-elev: #16191e     bg-card: #1d2127
text: #f2f3f5       text-dim: #8a919b    accent: #ff5b2b（HipHopのaccentColor）

drum:    base #0e2b1e / ink #4ade8c / lit #19b869
bass:    base #0e2337 / ink #4db3f0 / lit #1f7fd0
melodic: base #2a1530 / ink #d477e8 / lit #c34ddd
fx:      base #331507 / ink #ff8a4d / lit #e85f1e
perc:    base #1c1a38 / ink #9c8cf0 / lit #6f5ce0
vocal:   base #08282a / ink #3fd6c2 / lit #14a894
empty:   base #14161a / ink #3a3f47
```

- `base`=パッド背景（通常時）／`ink`=文字・アイコン色（通常時）／`lit`=押下時の背景（文字は白に切替）
- カテゴリ→色の対応（drum=緑, bass=青, melodic=紫, fx=オレンジ, perc=藍紫, vocal=ティール）は固定。テンプレートJSON側の`color`フィールドと二重管理にしない（正はRNの色定数ファイル1箇所、テンプレートJSONは`category`のみ持ち、色は定数から引く実装を推奨。設計書D5参照）

### 2.4 モックに存在するが実アプリに含めないもの

- 画面上部の「screen_home / screen_pad」切替ピル（`mockbar`）— モック内での確認用タブ。実アプリのナビゲーションではない
- 脚注の操作説明テキスト（`legend`）

---

## 3. React Nativeファイル命名規約: 接頭辞 `RN_`

言語・フレームワークがReact Nativeに変わることを明示するため、**本プロジェクトの画面・UIコンポーネントファイルは全て`RN_`接頭辞を付ける**こと。設計書v0.1のファイル名（無印）から以下のように読み替える。

| モック上の要素 | RNファイル名（推奨） |
|---|---|
| screen_home | `RN_ScreenHome.tsx` |
| screen_pad | `RN_ScreenPad.tsx` |
| パッドグリッド全体 | `RN_PadGrid.tsx` |
| パッド1マス | `RN_Pad.tsx` |
| 右レール(4モード) | `RN_ModeRail.tsx` |
| フィルター/ボリュームのフェーダーパネル | `RN_FaderPanel.tsx`（`variant="filter"\|"volume"`propで型を切替） |
| FXパネル | `RN_FxPanel.tsx` |
| テンプレートカード | `RN_TemplateCard.tsx` |
| ヘッダー | `RN_PadHeader.tsx` |
| 配色トークン定数 | `RN_theme.ts`（§2.3の値をexport） |
| 音再生API（設計書D3/D10のpadPlayer契約） | `RN_padPlayer.ts` |
| テンプレート型定義 | `RN_types.ts` |

- 既存の設計書（`design_mvp_v0.1.md`）のパス表記（例: `src/audio/padPlayer.ts`）は**ディレクトリ構成の指示として有効**。ファイル名のみ`RN_`を付けて読み替える（例: `src/audio/RN_padPlayer.ts`）。
- `system_templates.json`・`sampleMap.ts`・`validate_templates.mjs`など**非コンポーネント/非UIファイル**（データ・スクリプト類）には`RN_`を付けない。対象はUIコンポーネントとRN固有の実装ファイルのみ。
- 迷った場合はFABLEに確認するか、`spec_return_log.md`にSR起票。

---

## 4. 曖昧さが出た場合

設計書v0.1の運用（プレイブック準拠）に従い、実装中に仕様の曖昧さ・矛盾を見つけたら独自解釈で埋めず `brief/spec_return_log.md` にSR-###として起票すること。CODEXが自律的に判断を下した箇所も、後から追える程度の一言コメントを残すことが望ましい。

---

## 5. 受け入れ基準（変更なし。設計書v0.1 §0を転記）

- G1: `npx tsc --noEmit` がエラー0
- G2: `node scripts/validate_templates.mjs` が exit 0（4テンプレート存在／各8パッド以上に音源／sample実在／sampleMapとの整合／row・column重複なし）
- G3: `node scripts/gen_placeholder_wavs.mjs` を2回実行しバイナリdiffが空（決定性）
- G4: Android実機（Expo Go）で手動チェックリスト8項目（設計書v0.1 §4 V4）が全てpass
- G5: 生成物（node_modules, .expo等）がgit未混入

詳細なタスク分割(T1〜T8)・触ってよい/禁止ファイル表は `design_mvp_v0.1.md` を参照。今回の引継ぎで変わるのは**担当者（CODEXが全T#を実施）**と**§3のRN_命名規約の追加**のみで、それ以外の設計判断(D1〜D10)・受け入れ基準(G1〜G5)は無変更。
