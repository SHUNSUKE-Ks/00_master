# BattleEngine

BattleEngine は、戦闘、ステータス、スキル、敵、報酬を扱うゲームエンジンです。

## 初期方針

まだ実装を急がず、AdventureEngine から呼び出すイベント境界を先に決めます。

例:

- `battle.start`
- `battle.result`
- `reward.grant`
- `collection.unlock`

戦闘の中身は後から差し替えられるようにし、AdventureEngine 側はイベントを投げるだけにします。

