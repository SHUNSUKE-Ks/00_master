# Firebase rpaJobs ルール案

## 現状

`npm run rpa:jobs -- --dry-run` は Firestore に接続できるが、現在のFirestore Rulesで `rpaJobs` の読み取りが拒否される。

```txt
Missing or insufficient permissions.
```

## 必要なcollection

```txt
rpaJobs
```

## 目的

- Android / PWA の `実行` ボタンが `rpaJobs` に依頼票を書く
- ローカルCodexの `npm run rpa:jobs` が `status == 実行依頼` を読む
- 処理中に `確認中`
- 完了時に `Library化済み`
- 失敗時に `失敗`

## Rules案

既存rulesの `match /databases/{database}/documents { ... }` の中へ追加する。

```txt
match /rpaJobs/{jobId} {
  allow create: if request.auth != null
    && request.resource.data.type == "rpa_job"
    && request.resource.data.source == "kanban-note01"
    && request.resource.data.target == "codex"
    && request.resource.data.status == "実行依頼";

  allow read: if request.auth != null;

  allow update: if request.auth != null
    && resource.data.type == "rpa_job"
    && request.resource.data.type == "rpa_job"
    && request.resource.data.source == "kanban-note01"
    && request.resource.data.target == "codex";
}
```

## 注意

この案は匿名ログインを許可している前提。
公開プロジェクトで厳密にするなら、Codex用workerだけがupdateできる仕組みへ変更する。

## 反映後の確認

```powershell
cd C:\00_master\APP\kanban-note01
npm run rpa:jobs -- --dry-run
```

成功時:

```txt
[RPA-JOBS] collection=rpaJobs status=実行依頼 count=...
```
