# CodexでRPA記事作成 コマンド仕様

## 目的

Study の OSS候補DBで `実行` を押した `rpaJobs` を、ローカルCodex側で手動処理する。

## 手動コマンド

```powershell
cd C:\00_master\APP\kanban-note01
npm run rpa:jobs
```

## 事前確認のみ

```powershell
cd C:\00_master\APP\kanban-note01
npm run rpa:jobs -- --dry-run
```

## 処理対象

Firestore collection:

```txt
rpaJobs
```

条件:

```txt
status == 実行依頼
```

## 処理フロー

```txt
実行依頼
→ 確認中
→ public/study-blog/generated-rpa/{repo}/manual.md を生成
→ public/study-blog/generated-rpa/{repo}/目次.md を生成
→ public/study-blog/generated-rpa/{repo}/topics/overview.md を生成
→ Library化済み
```

## 失敗時

```txt
status = 失敗
errorMessage に理由を保存
```

## 現在の粒度

これはMVPです。今は依頼票からOpenHarness型の骨格を作るところまで。
次の段階で、GitHub原本のclone/read、主要ファイル抽出、漢字概念化job作成へ広げる。
