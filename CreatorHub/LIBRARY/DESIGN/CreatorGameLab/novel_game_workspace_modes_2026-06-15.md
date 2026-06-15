# NovelGame Active Workspace モード設計

## 目的

`Active Workspace` は、まず NovelGame 特化の制作ページとして作ります。

画像生成や素材管理を全部ここへ入れると大きくなりすぎるため、最初は「ゲーム画面を構成する制作モード」に絞ります。

## 初期モード

最初に扱う制作モードは4種類です。

```txt
NovelGame Workspace
├─ 1. Title Screen
├─ 2. Dialogue Scene
├─ 3. Escape Room Scene
└─ 4. SRPG Encounter Setup
```

## 1. Title Screen

タイトル画面を作るモードです。

扱う要素:

- 背景
- ロゴ
- ボタン配置
- BGM
- SE

保存する主なデータ:

```ts
type TitleScreenConfig = {
  titleId: string;
  backgroundAssetId?: string;
  logoAssetId?: string;
  buttonLayoutId?: string;
  bgmAssetId?: string;
  seAssetIds: string[];
};
```

## 2. Dialogue Scene

NovelGameの会話画面を作るモードです。

扱う要素:

- 背景
- Character
- UI
- アイテム
- 会話ログ
- BGM

会話ログの基本データ:

```ts
type DialogueLine = {
  lineId: string;
  speaker: string;
  text: string;
  characterAssetId?: string;
  voiceAssetId?: string;
};
```

最初のUI:

- 中央にゲーム画面プレビュー
- 下に会話ログ
- 右に選択中lineのInspector
- 左にScene Parts

## 会話ログ音声アイディア

以下は良いアイディアですが、最初から入れると作業量が増えます。

そのため、初期実装では **Future** に入れます。

Future内容:

- 各lineに録音ボタンを置く。
- 各lineに再生ボタンを置く。
- 再生中は一時停止アイコンに変わる。
- 長押しでゴミ箱アイコンに変わる。
- ゴミ箱アイコンをもう一度押すと音声を削除する。
- それ以外の画面を触るとゴミ箱状態を解除する。
- 同時に再生できる音声lineは1つだけ。
- 他のlineを再生したら、前のlineは停止して再生待ちアイコンに戻る。

Future用データ:

```ts
type DialogueVoiceState = {
  activeLineId?: string;
  playbackState: "idle" | "playing" | "paused";
  deleteArmedLineId?: string;
};
```

## 3. Escape Room Scene

脱出ゲーム的な画面を作るモードです。

背景にアイテムを設置し、クリック/タップできるギミックとして使います。

扱う要素:

- 背景
- アイテム配置
- クリック範囲
- ギミック状態
- 入手アイテム
- 解錠/変化イベント

保存する主なデータ:

```ts
type EscapeRoomHotspot = {
  hotspotId: string;
  itemAssetId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  interactionId?: string;
};
```

## 4. SRPG Encounter Setup

SRPG初期配置を作るモードです。

既存ゲーム側の仕様と相談しながら進めます。

扱う要素:

- マップ
- 敵の初期配置
- 味方の初期配置
- 勝利条件
- 敗北条件
- 会話イベントとの接続

最初は本格SRPGエディタにはせず、初期敵配置の確認だけにします。

保存する主なデータ:

```ts
type SrpgEncounterSetup = {
  encounterId: string;
  mapAssetId?: string;
  enemies: Array<{
    enemyId: string;
    x: number;
    y: number;
  }>;
  allies: Array<{
    characterId: string;
    x: number;
    y: number;
  }>;
};
```

## Active Workspace のタブ構成

Active Workspace内は、まず4つのモードタブだけにします。

```txt
[Title] [Dialogue] [Escape] [SRPG]
```

最初に開く画面は `Dialogue` か `Title` にします。

## 実装優先順位

1. `Title Screen` の静的レイアウト
2. `Dialogue Scene` の静的レイアウト
3. Dialogue line の追加/選択
4. 背景/Character/UI/ItemのID参照
5. `Escape Room Scene` のHotspot配置
6. `SRPG Encounter Setup` の敵配置
7. Future: Dialogue voice録音/再生/削除State

## 複雑化を防ぐルール

- 画像生成機能はActive Workspaceに入れない。
- 素材発注は `orders.json` または別画面へ逃がす。
- Active Workspaceは「既にある素材を配置してゲーム画面を作る」ことに集中する。
- 音声録音/再生は最初から入れずFutureにする。
- SRPGは最初から戦闘システムを作らず、初期配置だけにする。

