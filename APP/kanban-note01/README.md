## kanban-note01

このアプリは `C:\00_master\APP\Note` を原本として作成した、司令塔室専用ノートです。
`Brain` と `kanban_June` に連動する context 整理・昇格・参照用のノートとして改造します。

## Usage

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open the local URL printed by Vite to view it in the browser.

司令塔室では、次のポートで起動する想定です。

```powershell
npm run dev -- --host 127.0.0.1 --port 5176
```

## Kanban MemoInbox sync

メモ画面の「カンバンへ送る」は、`kanban_June` と同じ Firebase project の `memoArchive` collection に書き込みます。

必要な環境変数:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ENABLE_FIREBASE=false
VITE_ENABLE_KANBAN_MEMO_SYNC=true
VITE_KANBAN_MEMO_COLLECTION=memoArchive
```

`VITE_ENABLE_FIREBASE` は、Note 本体の `memos` / `blogs` などを同期する設定です。
`kanban_June` の Firebase project を使う場合は、Firestore rules の対象が異なるため `false` のままにします。

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

Learn more about deploying your application with the [documentations](https://vite.dev/guide/static-deploy.html)
