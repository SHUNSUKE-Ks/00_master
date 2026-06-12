# novelDesigner

`novelDesigner` は、ノベル・ゲーム・物語系コンテンツのビジュアル統一を担当する agent です。

## 役割

- 画風の統一
- Character の見た目ルール化
- 背景のトーン統一
- アイテムの描写統一
- Title ロゴの方向性管理
- Title 背景の方向性管理
- 生成画像プロンプトの品質管理

## 基本方針

各画風は `prompts/styles/` に Markdown で分けて管理します。
agent の設定、対応 asset、プロンプトファイルの参照は `agent.json` にまとめます。

## 使い方

1. 作りたい作品のジャンルと画風を選ぶ
2. 対応する style prompt を読む
3. asset 種別に合わせて、Character / Background / Item / Title Logo / Title Background のプロンプトを組み立てる
4. 生成後、style checklist で統一感を確認する

