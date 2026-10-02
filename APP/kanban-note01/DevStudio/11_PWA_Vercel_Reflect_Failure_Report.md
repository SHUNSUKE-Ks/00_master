# PWA / Vercel 反映失敗 原因レポート

作成日: 2026-06-29

## 結論

`https://kanban-note01.vercel.app/` にAPP04の最新UIが反映されていない主因は、PWAキャッシュ単体ではなく、Vercel本番が参照しているデプロイ対象と、今回pushしたGitブランチが一致していない可能性が高い。

今回の最新変更は `codex/novel-engine-devstudio-layer` にpush済みだが、Vercel Production URL は古いUIを配信している。画面上でも `Asset Tags / Blog / DB Hub` 周辺の最新Header構成ではなく、旧 `Title DB` 中心の表示が残っている。

## 確認できた事実

- 現在のローカルブランチ: `codex/novel-engine-devstudio-layer`
- 最新push済みコミット: `0160c58 Add APP04 gallery and DB hub updates`
- リモートにも同コミットあり: `origin/codex/novel-engine-devstudio-layer`
- Vercelプロジェクト名: `kanban-note01`
- ローカルのアプリ作業ツリーはクリーン
- `npm run build` は直近のAPP04更新後に成功済み
- Vercel URLでは旧UIが表示され、最新のDB Hub / Gallery導線が見えていない

## 失敗原因の整理

### 1. Production Branch不一致の可能性が高い

VercelのProduction URLは通常、Production Branchに設定されたブランチの最新デプロイを配信する。

今回の変更は `codex/novel-engine-devstudio-layer` にpushされているため、Vercel側のProduction Branchが `master` や別ブランチの場合、本番URLには反映されない。

### 2. PWAキャッシュは副次要因

PWAはService Workerや端末側キャッシュで古い表示を保持することがある。ただし今回の画面は、単なる画像やCSSの古いキャッシュではなく、Headerメニュー構成そのものが古い。

そのため、最初に確認すべきはキャッシュ削除ではなく、本番デプロイが最新コミットを参照しているかどうか。

### 3. VercelのPreview DeployとProduction Deployを混同している可能性

feature branchへpushするとPreview Deployは作成されることがあるが、Production URL `kanban-note01.vercel.app` には出ない場合がある。

Productionで確認したい場合は、Production Branchへmergeするか、明示的にProduction Deployを実行する必要がある。

## 反映までの推奨手順

1. Vercel Dashboardで `kanban-note01` のProduction Branchを確認する
2. Production Branchが `master` の場合、`codex/novel-engine-devstudio-layer` の変更を `master` へmergeする
3. もしくはVercelのProduction Branchを今回の開発ブランチに変更する
4. Vercelの最新Production Deploymentが `0160c58` 以降を指しているか確認する
5. その後、PWA端末で再読み込み、必要ならアプリ再起動または再インストールを行う

## 次アクション候補

- 安全ルート: feature branchをPR化し、Production BranchへmergeしてからVercel反映を確認
- 速度優先ルート: `npx vercel --prod` で現在のローカル内容をProductionへ直接デプロイ
- 検証ルート: Vercel Preview URLを取得し、そこにAPP04最新UIが出るか確認

## カンバン報告文

APP04のPWA反映失敗は、PWAキャッシュよりもVercel Productionの参照ブランチ不一致が主因と判断。最新変更は `codex/novel-engine-devstudio-layer` の `0160c58` にpush済みだが、Production URLでは旧UIを配信中。次はVercelのProduction Branch確認、またはProduction Deployの明示実行を行う。
