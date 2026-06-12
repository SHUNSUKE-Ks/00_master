# AgentRoom

agent を登録しておく部屋です。

## 役割

- agent の名前、担当、使う skill、起動条件を整理する
- `kanban_June` から agent 状態を見える化する
- GitHub Issue や report をどの agent に渡すか判断する

## 構成

- `agents.index.json`  
  agent 一覧の索引です。

- `modules/`  
  agent ごとの定義フォルダーを置きます。

