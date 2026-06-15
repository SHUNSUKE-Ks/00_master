# View State Layering

## 目的

画面を作る時に、いま画面内で何が起きているかを見失わないための設計技術です。

これはScaffoldではありません。

Scaffoldは「決まった画面をフォルダー、ファイル、TODO、TaskTicketへ分解する工程」です。

View State Layeringは、その前後で使う「画面状態の見取り図」です。

## 名前

技術スタッツ名:

`View State Layering`

日本語名:

`画面状態レイヤー分割`

## 基本ルール

画面内の状態を、ひとつの大きな `currentState` に混ぜない。

最低限、次のレイヤーに分けて考えます。

```text
App Phase
  アプリ全体またはプロジェクト全体の進行段階。

View Phase
  画面内で、いま何の作業段階を表示しているか。

Active Target
  現在選択中のProject、Task、Report、File、Screen。

View Mode
  index / reader / split / edit / preview など、表示モード。

Interaction State
  dragging / longPress / saving / loading / error など、一時的な操作状態。

Overlay State
  Quick Capture、Detail Panel、Modal、Sidebarなど、重ねて表示する状態。
```

## 例

Project Hubの場合:

```ts
const activeProjectId = createSignal<string | null>(null);
const projectCardExpandedIds = createSignal<string[]>([]);
const quickCaptureOpen = createSignal(false);
const quickCaptureDraft = createSignal(null);
```

Report Viewの場合:

```ts
const selectedReportId = createSignal(reportItems[0].id);
const reportMode = createSignal<"index" | "reader" | "split">("index");
const categoryFilter = createSignal("All");
```

NovelGame Workspaceの場合:

```ts
const workspacePhase = createSignal<"title" | "dialogue" | "escape" | "srpg">("title");
const activeSceneId = createSignal<string | null>(null);
const activeLineId = createSignal<string | null>(null);
const overlayMode = createSignal<"none" | "assetPicker" | "voiceRecorder">("none");
```

## 非エンジニア向けの確認方法

画面仕様書には、必ず次を書きます。

```text
この画面のPhaseは何か
いまActiveになっている対象は何か
表示Modeは何種類あるか
一時的な操作状態は何があるか
Overlayで開くものは何か
```

これを書いておくと、AIは画面の現在地を読み取りやすくなります。

## Kanbanとの関係

Kanbanのカラムは作業工程です。

View State Layeringは画面内部の現在地です。

混ぜないこと。

例:

```text
Kanban Column: Scaffold
View Phase: layout-review
Active Target: screen_title_select
View Mode: split
Overlay State: quickCapture
```

## 使うタイミング

1. HTMLレイアウトを作る前
2. 画面仕様書を書く時
3. Scaffold化する前
4. TaskTicketへ分解する前
5. UIの挙動が分からなくなった時

## 注意

ステート名は短く、画面にそのまま表示しても意味が分かる名前にします。

悪い例:

```text
state1
mode2
current
flag
```

良い例:

```text
activeProjectId
viewMode
workspacePhase
selectedScreenId
quickCaptureOpen
```

