# CreatorGameLab 実装メモ

## 初期実装範囲

最初の実装は、実際のゲーム機能を作り込まず、Title Select、Engine Sandbox、Dev Save / Loadの3画面をHubとして使えるところまでにします。

`CreatorGameLab` は、ゲーム制作機能そのものというより、制作対象、実験環境、作業再開地点をホストするHub/Hosting Shellとして扱います。

NovelGameの実制作画面は、後で `NovelGameWorkspace` として集中開発します。

実装するもの:

- AppShell
- Sidebar
- TitleSelectView
- EngineSandboxView
- DevSaveLoadView
- ComponentRegistryView
- Workspace Placeholder
- Back navigation placeholder
- componentRegistry
- sample `_devindex`

実装しないもの:

- NovelGameWorkspace本体
- 本番用AdventureEngine移植
- BattleEngine本体
- CollectionEngine本体
- 実素材DB読み込み
- 画像生成機能

## 切り分け判断

今すぐ別プロダクトへ切り分ける必要はありません。

ただし、内部構造は次のように分けます。

```txt
CreatorGameLab
  Title Select / Engine Sandbox / Dev Save Load / Component Registry

NovelGameWorkspace
  Title Screen / Dialogue Scene / Escape Room / SRPG Encounter Setup
```

この分け方なら、CreatorGameLabは軽いHubとして維持でき、Workspace側の開発が重くなっても入口が壊れにくくなります。

## 推奨フォルダー

新規作成時の名前は `CreatorGameLab` とします。

現在の旧実験場:

```txt
C:\202604_claude_workspace\100_gamecollection
```

新しい整理後の候補:

```txt
C:\202604_claude_workspace\CreatorGameLab
```

または、`C:\00_master` 管理下に置く場合:

```txt
C:\00_master\CreatorGameLab
```

## 注意

`C:\202604_claude_workspace` は現在のCodex書き込みルート外です。実際にそこへ作成・改名する場合は、ユーザー確認後に行います。
