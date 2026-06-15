# CreatorGameLab Hub方針

## 結論

`CreatorGameLab` はこのまま続けます。

ただし、役割はゲーム制作エディタ本体ではなく、**Hub / Hosting Shell** として固定します。

## 役割

CreatorGameLabが担当するもの:

- Title Select
- Engine Sandbox
- Dev Save / Load
- Component Registry
- Workspaceへの入口
- `_devindex` の読み込み

CreatorGameLabが直接抱えないもの:

- NovelGameの詳細編集
- Dialogue音声録音/再生
- 脱出ゲームHotspot編集の本体
- SRPG戦闘システム本体
- 画像生成
- 素材発注

## 後で切り出す単位

```txt
NovelGameWorkspace
├─ Title Screen Editor
├─ Dialogue Scene Editor
├─ Escape Room Scene Editor
└─ SRPG Encounter Setup
```

## 理由

このまま全部をCreatorGameLabへ入れると、旧 `100_gamecollection` と同じく拡張で複雑化します。

Hubとして軽く保ち、Workspaceを別モジュールとして集中開発することで、入口と作業本体を分けます。

