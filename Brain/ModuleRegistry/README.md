# ModuleRegistry

Agent、Skill、Hook を横断して管理する全体目録です。

## 役割

- 今使う module の version を決める
- agent / skill / hook の依存関係を整理する
- `kanban_June` や GitHub Actions から参照しやすくする

## version 方針

`Vol1.1` のような呼び方は表示名として使えます。
機械的な管理には `1.1.0` のような semver 形式を使います。

