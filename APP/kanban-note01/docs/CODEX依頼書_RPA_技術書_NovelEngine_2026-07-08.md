# CODEX依頼書：RPA・技術書・NovelEngine 組み合わせテスト（kanban-note01）

**日付:** 2026-07-08
**宛先:** CODEX（本アプリ kanban-note01 の実装・テスト担当）
**発行:** Claude（RPA資料の自律作成担当。本番アプリApp02とは別系統）

---

## 1. 背景・役割分担

| 主体 | 役割 |
|------|------|
| **Claude（本番: App02_NoteSubs）** | 決済機能つき本番環境。サブスク縦串(登録→¥300課金→pro解放→解約)をStripe sandboxで実証済み。**触らない** |
| **Claude（このチャット）** | **RPAの参考資料を自律作成** → 完成品をCODEXへ渡す |
| **CODEX（このアプリ: kanban-note01）** | **RPA＋技術書＋NovelEngine の組み合わせをテスト実装**する |

- 本番の決済系は App02 側にあり、kanban-note01 は**テスト環境**。課金は組み込まない。
- Claudeは資料（データ）を供給、CODEXは表示・統合・テストを担う。**疎結合**。

---

## 2. 対象アプリの現状（kanban-note01）

- 技術: SolidJS + Vite + Tailwind v4 + **Dexie(IndexedDB)** + PWA
- 既存ページ: `PageInbox / PageMemo / PageNotebook / PageStudy / PageBlog / PageDb01..10 / PageAssetTags / PageDevStudio / PageGallery / PageTrash`
- 既存Dexieテーブル（`src/db/schema.ts`）:
  - `memos`   … `Memo{ title, body, tags[], createdAt, updatedAt }`
  - `blogs`   … `Blog{ title, body, cover?, coverType, categoryTags[], mode:'memo'|'published', ... }`
  - `notebooks` … `Notebook{ title, ... }`
  - `gallery` … 画像

→ 既に「ノート＋DB＋タグ＋Study＋Blog＋Gallery」が揃っている。3機能はこの上に載せる。

---

## 3. 依頼内容：3機能の組み合わせテスト

kanban-note01 の中で、以下3つを**同一ノート基盤の上で切り替えて使えるか**を検証する。
（App02で確立した「Engine＝ノートを変換するアタッチ機能」の考え方を踏襲）

### ① RPA（Study系）
- Claudeが供給するRPAトピック資料（§5の形式）を取り込み、`PageStudy`/`memos`で**そのまま簡潔に閲覧**できる。
- 技術者・AIが読みやすい、装飾を作り込まない素の表示でよい（技術書Ver1.1相当）。

### ② 技術書（Blog reader系）
- `blogs`(mode:'published', cover)を**技術書リーダー**として表示。
- PC/iPad/Androidでレスポンシブ（固定レイアウトの電子書籍でなく**ブログ寄りの可変レイアウト**でよい）。
- 将来の独自Book形式(XHTML+XML+CSS)は範囲外。今回は既存Blog型で「読める」ことを確認。

### ③ NovelEngine（Scenario系）
- 既存の `ScenarioBlockEditor / CharacterInputSection` 等を使い、会話形式ノートを扱えるか確認。
- 出力（ノベル再生）まではスコープ任意。**入力フォーマット切替が成立するか**が主眼。

### 組み合わせ観点
- 同一ノート/DBを、Study(RPA) ⇔ 技術書(Blog) ⇔ Novel(Scenario) の**表示モードで切り替え**られるか。
- モード切替で本体が壊れない（疎結合が保てている）か。

---

## 4. 参照すべき設計（App02側の確定資料）

CODEXは以下を参照可（`C:\00_claudemaster\00_Projects\CreatorHub\` 配下）:
- `05_Project/App02_NoteSubs/docs/TECHBOOK_CONCEPT.md` … 技術書 Ver1.1/2.1 の方針
- `05_Project/App02_NoteSubs/docs/ENGINE_IDEAS.md` … Engineカタログ
- `Fable5_Handoff/fable_handoff_noteapp_schema_2026-07-06.md` … engine.manifest / StampDock / study.material / ViewMode スキーマ
- `Fable5_Handoff/mockup_stamp_dock.html` … StampDock操作モック（任意で移植）

これらは「案」。kanban-note01の既存型（Memo/Blog）に合わせて調整してよい。

---

## 5. ★Claude→CODEX 受け渡し形式（RPA資料パック）

Claudeが作るRPA資料は、以下のJSONパックで渡す。CODEXはこれを`memos`/`blogs`へインポートする想定。

```jsonc
// rpa_material_pack.v1.json
{
  "$schema": "rpa_material_pack.v1",
  "generatedBy": "claude",
  "generatedAt": "2026-07-08",
  "topics": [
    {
      "id": "rpa_click_wait",
      "title": "クリックと待機",
      "kind": "topic",                 // topic(素材) | reference(まとめ)
      "tags": ["rpa", "pyautogui"],    // kanban-note01のTag.name想定
      "body": "…AIが読みやすい簡潔な解説（Markdown）…",
      "code": { "lang": "python", "body": "pyautogui.click(100,200)" },
      "importAs": "memo"               // memo | blog（技術書化するならblog）
    }
  ]
}
```

- `importAs:"memo"` → `memos`テーブルへ（title/body/tags）。RPA素材の既定。
- `importAs:"blog"` → `blogs`テーブルへ（title/body/cover/categoryTags, mode:'published'）。技術書化する時。
- タグ・命名規則は**暫定**。最終確定は**8月6日の会議**（アプリ構造確定後）で行うため、今は緩く付ける。

→ CODEX側で「このパックを取り込むインポータ」を用意してもらえれば、以降Claudeは資料を量産して渡すだけで回る。

---

## 6. テスト観点（合否の目安）

- [ ] rpa_material_pack を取り込み、Studyで素のRPAトピックが読める
- [ ] 同じ資料をBlog(published)として技術書リーダー表示できる（レスポンシブ）
- [ ] Scenarioモードに切り替えても本体が壊れない
- [ ] 3モード切替が同一ノート基盤で成立（疎結合の確認）
- [ ] PC/iPad/Android で表示崩れがない

---

## 7. 制約・非対象

- 決済/サブスクは**組み込まない**（本番App02側の責務）
- 独自Book形式(XHTML+XML+CSS)・表紙生成・自作ストアは**将来**（今回範囲外）
- ノートへの抜粋取り込み/コードブロック挿入/スキーマ適用は**相談中**（Ver1.1後）
- tag/命名規則/最終スキーマの確定は**8月6日会議**

---

## 8. 次のアクション

1. **CODEX**: 本依頼書に沿って kanban-note01 に「rpa_material_pack インポータ」＋3モード表示の検証を実装
2. **Claude(このチャット)**: 本依頼書の発行をもって、**RPA資料の自律作成**へ移行。`rpa_material_pack.v1.json` 形式で順次納品
3. 受け渡し場所は追って指定（既定案: kanban-note01 の `docs/` か Claude側 `06_Output/` 経由）
