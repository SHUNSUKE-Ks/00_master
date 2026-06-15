# CreatorGameLab 開発用Chat引継ぎ

## このChatで決まったこと

`CreatorGameLab` は、ゲーム制作エディタ本体ではなく、制作対象や実験環境をホストするHubとして作る。

`NovelGameWorkspace` は別モジュールとして後で集中開発する。

## 開発開始の推奨

新しいChatで開始する。

理由:

- このChatは設計相談が多く、文脈が大きい。
- 開発Chatは実装、ビルド、確認に集中した方がよい。
- 引継ぎ書類を読めば、設計判断を再確認できる。

## 作成場所

第一候補:

```txt
C:\00_master\CreatorGameLab
```

旧実験場:

```txt
C:\202604_claude_workspace\100_gamecollection
```

旧実験場はまだ直接改名・削除しない。

## 実装する範囲

```txt
CreatorGameLab
├─ AppShell
├─ Sidebar
├─ TitleSelectView
├─ EngineSandboxView
├─ DevSaveLoadView
├─ WorkspacePlaceholder
├─ Back navigation
└─ _devindex
```

## 実装しない範囲

- NovelGameWorkspace本体
- Dialogue音声録音/再生
- Escape Room Hotspot編集本体
- SRPG戦闘本体
- 画像生成
- 素材発注
- 旧100_gamecollectionの一括移植

## UI方針

サンプル画像の4分割はデザイン確認用。

実装では、各ページをフルページ表示にする。

```txt
Sidebar + Full Page View
```

画面:

- `Title Select`
- `Engine Sandbox`
- `Dev Save / Load`
- `Component Registry`
- `Workspace Placeholder`

## Title Select

タイルウィンドウ型のタイトルギャラリー。

要件:

- hoverで枠線を淡く光らせる。
- selectedで少し浮き上がる。
- progressを表示する。
- `Open` と `Resume` を置く。
- ゲーム内のTitle/Chapter Selectにも流用できる部品にする。

## Engine Sandbox

3つのEngineと隔離テスト環境を表示する。

Engine:

- `AdventureEngine`
- `BattleEngine`
- `CollectionEngine`

Isolated Test:

- `Empty Project`
- `Performance Test`
- `Network Test`
- `UI Testbed`

## Dev Save / Load

`Scene / Context` ではなく `Resume Point` と呼ぶ。

例:

- `dialogue_scene_003 / line 12`
- `title_logo_layout / BGM選択中`
- `room_01 / key_hotspot調整`
- `encounter_001 / enemy spawn`

## Workspace Placeholder

今は中身を作り込まない。

`Back` で直前ページへ戻る導線だけ実装する。

後で `NovelGameWorkspace` として集中開発する。

## _devindex

最初に作る。

```txt
_devindex
├─ game-title.registry.js
├─ engine-sandbox.registry.js
├─ component-view.registry.js
├─ dev-save-slots.json
└─ migration-queue.registry.js
```

## 参照資料

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab
```

特に読むもの:

- `creator_game_lab_layout_spec_2026-06-15.md`
- `creator_game_lab_navigation_spec.json`
- `hub_scope_decision_2026-06-15.md`
- `novel_game_workspace_modes_2026-06-15.md`
- `prototype\index.html`

## 開発時の注意

- ローカルWebアプリのdev serverは自動起動しない。
- 起動コマンドだけユーザーへ渡す。
- Markdown資料は日本語で書く。
- 旧 `100_gamecollection` は勝手に削除・改名しない。
- まず `C:\00_master\CreatorGameLab` に新規実装する。

## 初回完了条件

- `npm run build` が通る。
- Title SelectからWorkspace Placeholderへ遷移できる。
- Engine SandboxからWorkspace Placeholderへ遷移できる。
- Dev Save / LoadからWorkspace Placeholderへ遷移できる。
- Workspace PlaceholderからBackで戻れる。
- `_devindex` の初期データから画面を描画している。

