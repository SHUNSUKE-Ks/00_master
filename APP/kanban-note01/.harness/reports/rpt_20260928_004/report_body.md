# Lenovo タブレット: Alt+1 と PWA の向き

- Alt+1: モニターの記録が Alt だけで、数字の信号が来ていない。端末が先に受け取っている。アプリでは直せないので、ショートカットに別の組み合わせを登録して使う
- モニター: 修飾キーだけが届いたときに知らせるようにした
- PWA が縦だけ: manifest が orientation: portrait だった。any に変更
- 検証: tsc・vite build 成功、manifest を確認、jsdom PASS。デプロイは確認待ち
