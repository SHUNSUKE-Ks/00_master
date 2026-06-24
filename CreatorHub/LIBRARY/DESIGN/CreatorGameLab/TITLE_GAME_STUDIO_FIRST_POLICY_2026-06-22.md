# TitleGameStudio First Policy

meta:
  date: 2026-06-22
  target: CreatorGameLab WorkSpace
  status: draft

## 目的

GameLabのWorkSpaceでは、ゲームEngineを先に作るのではなく、TitleGameStudioを先に作る。

TitleGameStudioで、各Titleに固有のレイアウト、画面State、素材、仕様、修正依頼ログを固めたあと、必要なEngineを当てる。

## 役割分担

| 領域 | 役割 |
|---|---|
| CreatorGameLab WorkSpace | TitleGameStudioを選び、Engine候補と接続状態を見る |
| TitleGameStudio | Title固有の画面、素材、State、仕様、Fix Logを管理する |
| novelGame DevStudio | novelEngine用のscenario、tag、conversation、asset DBを管理する |
| 2D_SRPGStudio | SRPG Title用のMap / Conversation / Battle素材、Layout、Runtime Manifestを管理する |
| Engine | TitleGameStudioで決めた仕様に合わせて接続される実行基盤 |

## 方針

- novelGame DevStudio と 2D_SRPGStudio は分離する。
- 2D_SRPGStudio は novelGame開発ツールではなく、TitleGameStudioとして扱う。
- 新Titleは、まずTitleGameStudio単体HTMLまたはStudio画面で確認できるようにする。
- Engineは後から当てる。
- Engine候補は `novel`, `battle`, `collection` の三層。
- 画面内状態は App Phase / View Phase / Active Target / View Mode / Interaction State / Overlay State に分ける。

## 2D_SRPGStudio 現在の単体HTML

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio\index.html
```

## 次のTask候補

1. GameLab WorkSpaceにTitleGameStudio一覧を追加する。
2. TitleGameStudioからEngine候補を選択できるLayoutにする。
3. 2D_SRPGStudioのruntime manifestをGameLab WorkSpaceでも読めるようにする。
4. novelGame DevStudioをnovel開発用に再整理する。
5. 各TitleGameStudioでFix Log / Gallery / Screen State / Runtime Manifestを共通構造にする。
