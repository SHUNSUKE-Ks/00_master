# DevStudio：SchemaとCopy導線

DevStudioは「作る」「見る」「検査する」「コピーして外部Agentへ渡す」を同じ画面に置く制作台。

## 要点

| Key | 意味 |
| --- | --- |
| 取込 | schema、tag辞書、sample JSONをimportする |
| 表示 | active tabでDashboardやSchemasを切り替える |
| 複写 | CopyButtonでJSONやMarkdownを外部へ渡す |
| 検査 | validateやinspectの結果を画面へ返す |
| 保存 | localStorageへDevLibraryやInboxを残す |

## CopyButtonの型

```jsx
function CopyButton(props) {
  const [status, setStatus] = createSignal("idle");

  async function handleCopy() {
    // 複写: textは文字列でも関数でも受け取れるようにする。
    const value = typeof props.text === "function" ? props.text() : props.text;
    const ok = await copyText(value);

    // 状態: copied/failedを短時間だけUIへ反映する。
    setStatus(ok ? "copied" : "failed");
    window.setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <button type="button" onClick={handleCopy}>
      {status() === "copied" ? "Copied" : props.label ?? "Copy"}
    </button>
  );
}
```

## tab切替の型

```jsx
export default function DevStudio(props) {
  // 状態: activeが現在のDevStudio内画面。
  const [active, setActive] = createSignal(props.initialTab ?? "dashboard");

  // 境界: tab idとComponentを対応させる。
  const screens = {
    dashboard: Dashboard,
    scenario: ScenarioView,
    tags: TagsView,
    library: LibraryView,
    schemas: SchemasView
  };

  return (
    <main class="devstudio">
      <HeaderTabs active={active} setActive={setActive} />
      <Dynamic component={screens[active()]} />
    </main>
  );
}
```

## Studyへの流用

Note側の`MarkdownView`も同じ思想で、コードブロックの右上にCopy UIを置いている。技術Cardを書くときは、Markdownのコードフェンスを使えばコピー可能な教材になる。

