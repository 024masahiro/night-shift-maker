# 宿直シフトメーカー

医師の宿直シフトを作成する静的Webアプリです。GitHub Pagesではサーバー機能を使わず、CSVはブラウザのダウンロードとして保存します。

## GitHub Pagesで公開する手順

1. このフォルダをGitHubリポジトリにpushします。
2. GitHubのリポジトリ設定で `Settings > Pages` を開きます。
3. `Build and deployment` の `Source` を `GitHub Actions` にします。
4. `main` ブランチにpushすると `.github/workflows/deploy-pages.yml` が実行されます。
5. 実行完了後、PagesのURLで `index.html` が公開されます。

## ローカルで使う場合

`index.html` をブラウザで開くだけで使用できます。CSVを指定フォルダへ直接保存したい場合だけ、別途 `server.js` を起動します。
