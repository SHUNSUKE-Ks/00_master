# Tauri Studio / 統合制作環境の要約

> 状態: 保留構想。ElectronからTauriへ読み替えた制作ツール群の案。

## 核心

個別アプリをばらばらに作るより、ゲーム企画・素材・シナリオ・実装・AI支援をまとめる「ゲームクリエイター向け統合制作環境」を想定していた。

原本: [方針](./原本チャット_保管.md#tauri開発メモ)

## ツール候補

### 素材と配置

| ツール | 役割 |
| --- | --- |
| Asset Manager | 画像、音声、BGM、Live2D、3D、tag、folder、JSON管理 |
| Map Editor | 背景へキャラ、家具、エフェクトなどを配置し、座標・scale・rotationを保存 |
| Character Manager | 画像、表情、立ち絵を整理 |
| Live2D Viewer | モデル一覧と確認 |

原本: [素材管理](./原本チャット_保管.md#素材管理ツール)、[マップエディタ](./原本チャット_保管.md#マップエディタスタンプ配置)

### 入力とAI

| ツール | 役割 |
| --- | --- |
| ChatGPT Character | Live2D、会話、感情、音声、表情のAI対話 |
| MIDI Composer | MIDI入力から譜面、BPM、クオンタイズ、ベロシティ、保存 |
| MIDI Shortcut | ノート番号をアプリ操作へ割り当て |
| DJ Controller | CC、回転、フェーダー、ノブ、sliderを入力装置にする |

原本: [ChatGPTキャラクター](./原本チャット_保管.md#chatgptキャラクター)、[MIDI](./原本チャット_保管.md#midi楽譜制作)

### 連携と編集

| ツール | 役割 |
| --- | --- |
| Remote Controller | 同一Wi-FiのiPad/Androidを左手デバイス、リモコン、debug UIにする |
| JSON Editor | ゲームデータを編集 |
| Scenario Editor | JSONでScenarioを管理 |
| Event Editor | Eventを作成 |

原本: [Express Remote UI](./原本チャット_保管.md#expressによるリモートui)、[将来ツール群](./原本チャット_保管.md#将来的なゲーム制作ツール群)

## 当時の技術候補

```text
Desktop: Tauri
UI: Material UI
Front: React または SolidJS
Backend: Rust (Tauri)
通信: Express
保存: JSON / SQLite
MIDI: Web MIDI API
2D: PixiJS
3D: Three.js
Live2D: Cubism SDK for Web
```

現行ではUIの候補や構成が更新されているため、この技術表は原文の保管とする。Tauri、Rust、SolidJS、PixiJS、JSON/SQLiteという発想は、必要に応じて現行設計で再検証する。

## いま残す価値

- 素材IDと配置情報をJSONで保存する。
- Editor、Asset Browser、Scenario、Eventを別Viewとして扱う。
- モバイルを制作補助コントローラーとして使う。
- 出力物をゲーム実行用データへつなぐ。
