# Console Log Exporter

localhost / 127.0.0.1 の開発ページで `console.log / warn / error` を収集し、JSONまたはCodex貼り付け用テキストとして出力するChrome拡張です。

## 初回ロード

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. 次のフォルダーを選ぶ

```txt
C:\00_master\DevApps\chrome_extensions\extension_console_logger
```

## 使い方

1. 対象アプリを開く

```txt
http://127.0.0.1:5184/
```

2. アプリ側でDebug InteractionをONにする
3. DnDなどの手動テストを行う
4. 拡張機能popupを開く
5. `[DnD` や `[Test` でフィルターする
6. 必要なら `Compact On` で同じ番号のログを最後の1件に整理する
7. `Copy for Codex` または `Export JSON` を使う

## Compact

`Compact On` は、`2-4` のように同じ番号が連続して大量に出るログを、最後の1件だけに畳みます。

元ログは削除しません。popupの表示、Copy、Exportだけが整理されます。

## 制限

- DevTools内部の全ログを取得するものではありません。
- ページ上の `console.log / warn / error` をラップして取得します。
- v1は `localhost` と `127.0.0.1` のみ対象です。
- ページ読み込み後に注入されるため、拡張を有効化した後は対象ページをリロードしてください。
