# Git Branch・Fork学習資料のStudy追加

## 方針

GitのBranchとForkを、強制ルールではなく必要時に参照する学習教材として保存した。

## 判断

```text
自分の変更を隔離する -> Branch
外部OSSを改造する -> Fork
一部Commitを採用する -> cherry-pick
```

## 安全性

実際の作成、統合、履歴操作は対象と目的を確認してから実施する。mainへ直接変更や、履歴を壊す操作は自動化しない。
