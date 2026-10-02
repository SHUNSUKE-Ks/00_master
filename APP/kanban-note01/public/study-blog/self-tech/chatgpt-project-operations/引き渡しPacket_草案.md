# Web -> Codex / 引き渡しPacket草案

> 状態: カンバン判断待ち。将来のプロジェクト別Report schemaへ育てる前段。

## 目的

Web ChatGPTで固めた戦略を、Codexがローカルの現況と照合して実装できる依頼へ変える。

## 最小Packet

```yaml
meta:
  project: "NovelEngine"
  request_type: "strategy_to_implementation"
  date: "YYYY-MM-DD"
  source: "Web ChatGPT Project"

goal:
  user_value: "誰が何をできるようになるか"
  success_state: "完了時に見える状態"

context:
  background: "なぜ今やるか"
  decisions: ["採用済み判断"]
  non_goals: ["今回やらないこと"]

scope:
  target_app: "C:/.../APP/name"
  target_screen_or_module: ["画面/モジュール"]
  references: ["GitHub URL または資料パス"]

acceptance:
  - "動作確認条件"
  - "表示確認条件"
  - "保存/出力確認条件"

handoff:
  requested_action: "design | implement | review | investigate"
  required_report: "HarnessBoard Report"
  questions_for_codex: ["ローカル確認が必要な点"]
```

## Codexが補う項目

Web側が知らないローカル情報は、Codexがリポジトリを読んで補う。

```text
現行の実装状態
既存パターン
依存関係
影響範囲
実行コマンド
テスト結果
成果物パス
```

## プロジェクト別Schemaの方向

将来的には、アプリごとに受け渡しの必須項目を変える。

| Project種別 | 追加必須項目の例 |
| --- | --- |
| Note / PWA | 対象画面、保存先、Android表示、同期条件 |
| NovelEngine | OneShot schema、Scene ID、素材ID、runtime受入条件 |
| Game | Game state、入力、asset、画面、実機確認 |
| Web / LP | ターゲット、CTA、公開先、レスポンシブ条件 |
| RPA / Study | 原本、出典、出力format、保存先、記事の粒度 |

## 引き渡しのタイミング

次を埋められたらCodexへ渡す。

```text
目的が一文で言える
今回やらないことが分かる
対象アプリ/資料が分かる
完了条件を確認できる
不明点を質問として残せる
```

未確定のアイディアはWeb Project内で保持し、実装依頼に変換しない。これにより、思考の自由とローカル実装の正確さを両立する。
