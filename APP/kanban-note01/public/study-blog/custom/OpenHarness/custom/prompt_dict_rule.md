# 漢字Key + English Prefix Dict ルール

## 目的

AI Agent / Harness / RAG / 技術記事で使う概念を、
人間にもAIにも読みやすい **辞書型ルール** として統一する。

## 基本形式

```txt
英語Prefix_漢字Key: 説明
```

## 命名規則

```txt
{EnglishPrefix}_{漢字2〜4文字}: {Dict説明}
```

## Prefix一覧

```txt
AG_: Agent / 実作業担当
HN_: Harness / 検証・実行環境
LP_: Loop / 反復改善
OR_: Orchestra / 分担・統括
RG_: RAG / 検索・参照
MD_: Markdown / 文書化
JS_: JavaScript / 実装
UI_: User Interface / 画面
DB_: Database / 保存構造
```

## 記述ルール

```txt
短名: 漢字Keyは2〜4文字にする
英前: 英語Prefixで所属領域を示す
辞書: 説明は「何をするか」を短く書く
固定: 同じ概念には同じKeyを使う
検索: RAGで拾いやすい語を使う
```

## 良い例

```txt
AG_読解: ソースや資料を読み取り要点を抽出する
AG_要約: 読解結果を短い説明へ圧縮する
HN_実行: コマンドやテストを動かして結果を得る
HN_確認: 成果物が存在するか検証する
OR_分配: タスクをAgentごとに割り当てる
OR_統合: 複数Agentの結果を一つにまとめる
LP_修正: 失敗結果をもとに再編集する
LP_再試: 修正後にもう一度実行する
RG_検索: 必要な情報を索引から探す
RG_参照: 回答生成時に資料を引用する
```

## 悪い例

```txt
Agentが色々やる: 曖昧
AG_エージェントがファイルを読んでまとめる処理: 長すぎる
検証: Prefixがない
AG_check: 漢字Keyがない
```
