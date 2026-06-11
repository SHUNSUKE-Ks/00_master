# Codex Automations と Codex GitHub Action

## 要約

### Codex Automations

Codex アプリ側の「定期巡回・監視・リマインド」機能です。
ローカルの司令塔室を定期的に起こして、GitHub Issue、PR、ファイル、ログなどを見に行かせる用途に向きます。

### Codex GitHub Action

GitHub Actions 上で Codex を動かす CI/CD 用の仕組みです。
Issue 作成、PR 作成、push、手動実行などをトリガーにして、GitHub runner 上で Codex に処理させます。

## Codex Automations

Codex Automations は、Codex アプリに「この作業を定期的にやって」と頼むものです。

たとえば:

- 15分ごとに GitHub Issue を見に行く
- `agent-ready` ラベル付き Issue を探す
- 新しい Issue を `kanban_June` 用の task JSON に変換する
- PR の CI 状態を巡回する
- レビュー待ちやブロック中 task を Triage に出す
- 「何もなければ何も報告しない」監視にする

重要なのは、これは基本的にポーリング型という点です。
GitHub から即時に押されてくるというより、Codex が定期的に見に行きます。

Codex manual では、project-scoped automation の場合は、ローカル Codex アプリを動かしているマシンが起動中で、Codex が起動していて、対象 project がディスク上に存在している必要がある、と説明されています。

## 司令塔室での使い方

```text
Codex Automation
  ↓ 定期巡回
GitHub Issues / PRs / reports
  ↓ 分類・要約・振り分け
C:\00_master の command center data
  ↓
kanban_June で可視化
```

向いているのは「見張り番」です。
即時性よりも、継続監視・整理・日次または数分ごとの棚卸しが得意です。

## Codex GitHub Action

Codex GitHub Action は `openai/codex-action@v1` を GitHub Actions workflow に組み込むものです。
GitHub Actions workflow から Codex を実行し、Codex CLI のインストールや Responses API への安全なプロキシ設定を行います。

GitHub 側のイベントで即時起動できます。

例:

```yaml
on:
  issues:
    types: [opened, labeled]
```

これで、スマホから GitHub Issue を作った瞬間に GitHub Actions が走ります。

## Codex Action の処理イメージ

```text
GitHub Issue opened
  ↓
GitHub Actions workflow 起動
  ↓
openai/codex-action@v1
  ↓
Issue 本文を読んで分類・計画・コメント・ファイル生成
  ↓
GitHub にコメント / artifact / PR / commit
```

向いているのは「GitHub 上で即時反応する agent」です。

たとえば:

- Issue を読んで `bug`, `feature`, `research`, `design` に分類する
- Issue に必要な agent / skill をコメントする
- `.command-center/tasks/issue-123.json` を生成する
- `kanban_June` 用の task seed を作る
- PR をレビューしてコメントする
- 軽い修正なら patch を作成する
- label に応じて異なる prompt を実行する

## 違い

| 観点 | Codex Automations | Codex GitHub Action |
|---|---|---|
| 起動 | 定期実行 | GitHub イベントで即時 |
| 実行場所 | Codex アプリ側 / project automation | GitHub Actions runner |
| 得意 | 巡回、監視、棚卸し、継続タスク | Issue / PR / push への即時反応 |
| ローカル PC | 必要な場合あり | 不要 |
| GitHub Secret | 通常不要、連携次第 | `OPENAI_API_KEY` などが必要 |
| 司令塔室向き用途 | 状態監視・可視化更新 | Issue 受付・自動処理開始 |

## おすすめ構成

最初の司令塔室では、次の分担がよいです。

```text
携帯で GitHub Issue 作成
  ↓
GitHub Action が即時検知
  ↓
Codex Action が Issue を分類
  ↓
task JSON / コメント / label を作成
  ↓
Codex Automation が定期的に巡回
  ↓
kanban_June に集約表示
```

役割分担:

- GitHub Action = 受付係
- Codex Action = 初動処理 agent
- Codex Automations = 巡回監視 agent
- `kanban_June` = 司令塔のモニター

## 注意点

Codex GitHub Action は強力ですが、GitHub runner 上でリポジトリ・Issue 本文・PR 内容を Codex に渡します。
Issue 本文をそのまま prompt に入れる場合、prompt injection 対策が必要です。

公式の `openai/codex-action` README でも、権限管理や `safety-strategy` が重要な項目として扱われています。

