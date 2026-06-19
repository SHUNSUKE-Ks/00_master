const lessons = [
  {
    id: "signal",
    title: "Signal",
    meta: "値を読む場所だけが更新対象になる",
    tag: "状態の最小単位",
    summary: "SignalはSolidJSの基本。getterで読む、setterで変える。読まれた場所だけが依存として記録され、必要なDOMだけ更新されます。",
    diagram: "signal",
    quiz: "count() と count の違いを説明できる？",
    answer: "count() は現在値を読む関数。count はgetter関数そのもの。JSXや計算内では count() と呼ぶことで依存が追跡されます。"
  },
  {
    id: "memo",
    title: "Memo",
    meta: "派生値をキャッシュする",
    tag: "計算結果の再利用",
    summary: "createMemoはSignalなどから派生する値を作ります。依存が変わった時だけ再計算され、同じ計算を何度も書く場所を整理できます。",
    diagram: "memo",
    quiz: "Memoと普通の関数の使い分けは？",
    answer: "計算が複数箇所で読まれる、または再計算を抑えたい時はMemo。単発で軽い計算なら普通の関数でも十分です。"
  },
  {
    id: "effect",
    title: "Effect",
    meta: "外側の世界へ反応する",
    tag: "副作用の置き場",
    summary: "createEffectは依存値が変わった時に処理を実行します。ログ、localStorage、外部API呼び出しなど、DOM描画そのものではない反応を置きます。",
    diagram: "effect",
    quiz: "Effectに何でも入れると何が困る？",
    answer: "状態更新と副作用が絡みすぎると、再実行の理由が見えにくくなります。描画用の派生値はMemo、副作用だけEffectに分けると追いやすいです。"
  },
  {
    id: "component",
    title: "Component",
    meta: "関数は一度実行、JSXの中身が反応する",
    tag: "Reactとの違い",
    summary: "Solidのコンポーネント関数は基本的に再レンダーされません。最初に一度走り、Signalを読んでいるJSXの細部だけが更新されます。",
    diagram: "component",
    quiz: "Reactの再レンダー感覚で書くと迷いやすい点は？",
    answer: "コンポーネント関数全体が何度も走る前提で考えないこと。反応させたい値はSignalとして読み、処理の場所を明確にします。"
  },
  {
    id: "store",
    title: "Store",
    meta: "オブジェクトや配列を細かく追跡する",
    tag: "構造化された状態",
    summary: "createStoreは深いオブジェクトや配列を扱いやすくします。ユーザー、設定、シナリオJSONなど、形のあるデータに向きます。",
    diagram: "store",
    quiz: "SignalではなくStoreにしたい場面は？",
    answer: "複数フィールドを持つオブジェクト、配列、JSON構造を部分更新したい時。単純な数値や文字列ならSignalで十分です。"
  },
  {
    id: "resource",
    title: "Resource",
    meta: "非同期データを状態として読む",
    tag: "読み込みと待機",
    summary: "createResourceはPromiseの結果をSignalのように扱います。loadingやerrorを見ながら、APIやファイル読み込みをUIに接続できます。",
    diagram: "resource",
    quiz: "Resourceがあると何が楽になる？",
    answer: "読み込み中、成功、失敗の状態をUI側で扱いやすくなります。fetch結果を手動でSignalに詰める処理を減らせます。"
  },
  {
    id: "control-flow",
    title: "Control Flow",
    meta: "Show / For / Switchで意図を明示する",
    tag: "JSX内の分岐と反復",
    summary: "Solidは配列や条件表示に専用コンポーネントを使います。Forはリスト更新に強く、Showは条件表示を読みやすくします。",
    diagram: "flow",
    quiz: "Forとmapの違いをざっくり言える？",
    answer: "ForはSolidのリアクティブなリスト処理に最適化されています。動的リストではForを使う方が意図も性能も安定します。"
  },
  {
    id: "props",
    title: "Props",
    meta: "分割代入で反応性を壊さない",
    tag: "受け渡しの注意点",
    summary: "Propsはリアクティブです。ただし安易な分割代入で値だけ取り出すと追跡が切れることがあります。props.name のように読むのが基本です。",
    diagram: "props",
    quiz: "const { name } = props が危ない理由は？",
    answer: "その時点の値を取り出してしまい、後からprops.nameが変わっても追跡されないことがあります。必要ならsplitPropsなどを使います。"
  }
];

const storageKey = "solidjs-basic-check-v1";
let checked = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
let currentIndex = 0;

const toc = document.getElementById("toc");
const lesson = document.getElementById("lesson");
const progressNumber = document.getElementById("progressNumber");
const resetButton = document.getElementById("resetButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

function save() {
  localStorage.setItem(storageKey, JSON.stringify([...checked]));
}

function renderToc() {
  toc.innerHTML = lessons
    .map((item, index) => {
      const done = checked.has(item.id);
      const active = index === currentIndex;
      return `
        <a class="toc-row ${done ? "is-done" : ""} ${active ? "is-active" : ""}" href="#${item.id}" data-index="${index}">
          <span class="check">${done ? "✓" : ""}</span>
          <span>
            <span class="toc-title">${item.title}</span>
            <span class="toc-meta">${item.meta}</span>
          </span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </a>
      `;
    })
    .join("");
}

function renderProgress() {
  const percent = Math.round((checked.size / lessons.length) * 100);
  progressNumber.textContent = `${percent}%`;
  document.querySelector(".progress-ring").style.setProperty("--value", `${percent * 3.6}deg`);
}

function diagram(kind) {
  const diagrams = {
    signal: `
      <svg viewBox="0 0 320 150" role="img" aria-label="SignalからDOMへ更新が伝わる図">
        <rect class="box accent" x="18" y="44" width="86" height="54" rx="8" />
        <text x="61" y="68" text-anchor="middle">Signal</text>
        <text class="muted" x="61" y="86" text-anchor="middle">count()</text>
        <path d="M112 72h70" stroke="#007f73" stroke-width="3" marker-end="url(#arrow)" />
        <rect class="box" x="190" y="25" width="110" height="36" rx="8" />
        <rect class="box warn" x="190" y="82" width="110" height="42" rx="8" />
        <text x="245" y="48" text-anchor="middle">他のDOM</text>
        <text x="245" y="106" text-anchor="middle">読むDOMだけ更新</text>
        ${arrowMarker()}
      </svg>`,
    memo: `
      <svg viewBox="0 0 320 150" role="img" aria-label="複数のSignalからMemoが派生値を作る図">
        <rect class="box" x="18" y="26" width="74" height="34" rx="8" />
        <text x="55" y="48" text-anchor="middle">price</text>
        <rect class="box" x="18" y="90" width="74" height="34" rx="8" />
        <text x="55" y="112" text-anchor="middle">count</text>
        <path d="M96 43l62 31M96 107l62-31" stroke="#007f73" stroke-width="2.5" />
        <rect class="box accent" x="160" y="52" width="84" height="46" rx="8" />
        <text x="202" y="79" text-anchor="middle">Memo</text>
        <path d="M248 75h44" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <text x="290" y="80">合計</text>
        ${arrowMarker()}
      </svg>`,
    effect: `
      <svg viewBox="0 0 320 150" role="img" aria-label="Signalの変更でEffectが外部処理を行う図">
        <rect class="box accent" x="16" y="52" width="82" height="46" rx="8" />
        <text x="57" y="79" text-anchor="middle">Signal</text>
        <path d="M106 75h58" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <rect class="box warn" x="170" y="43" width="82" height="64" rx="8" />
        <text x="211" y="71" text-anchor="middle">Effect</text>
        <text class="muted" x="211" y="90" text-anchor="middle">副作用</text>
        <path d="M258 75h40" stroke="#f4b641" stroke-width="2.5" marker-end="url(#arrow)" />
        <text x="298" y="62" text-anchor="middle">ログ</text>
        <text x="298" y="92" text-anchor="middle">保存</text>
        ${arrowMarker()}
      </svg>`,
    component: `
      <svg viewBox="0 0 320 150" role="img" aria-label="コンポーネントは一度実行され細部だけ更新される図">
        <rect class="box" x="18" y="28" width="122" height="92" rx="8" />
        <text x="79" y="56" text-anchor="middle">Component</text>
        <text class="muted" x="79" y="80" text-anchor="middle">関数は基本1回</text>
        <path d="M146 74h42" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <rect class="box accent" x="194" y="28" width="108" height="28" rx="7" />
        <rect class="box" x="194" y="64" width="108" height="28" rx="7" />
        <rect class="box accent" x="194" y="100" width="108" height="28" rx="7" />
        <text x="248" y="47" text-anchor="middle">細部A</text>
        <text x="248" y="83" text-anchor="middle">固定</text>
        <text x="248" y="119" text-anchor="middle">細部B</text>
        ${arrowMarker()}
      </svg>`,
    store: `
      <svg viewBox="0 0 320 150" role="img" aria-label="Store内の部分更新を表す図">
        <rect class="box accent" x="18" y="20" width="128" height="108" rx="8" />
        <text x="82" y="45" text-anchor="middle">Store</text>
        <rect class="box" x="38" y="58" width="88" height="22" rx="5" />
        <rect class="box warn" x="38" y="88" width="88" height="22" rx="5" />
        <text class="muted" x="82" y="74" text-anchor="middle">user.name</text>
        <text class="muted" x="82" y="104" text-anchor="middle">items[2]</text>
        <path d="M154 99h58" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <rect class="box warn" x="218" y="78" width="82" height="42" rx="8" />
        <text x="259" y="103" text-anchor="middle">部分更新</text>
        ${arrowMarker()}
      </svg>`,
    resource: `
      <svg viewBox="0 0 320 150" role="img" aria-label="Resourceの読み込み状態を表す図">
        <rect class="box" x="16" y="52" width="70" height="46" rx="8" />
        <text x="51" y="79" text-anchor="middle">fetch</text>
        <path d="M94 75h45" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <rect class="box accent" x="146" y="36" width="88" height="78" rx="8" />
        <text x="190" y="64" text-anchor="middle">Resource</text>
        <text class="muted" x="190" y="86" text-anchor="middle">loading</text>
        <text class="muted" x="190" y="103" text-anchor="middle">data/error</text>
        <path d="M242 75h42" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <text x="287" y="80" text-anchor="middle">UI</text>
        ${arrowMarker()}
      </svg>`,
    flow: `
      <svg viewBox="0 0 320 150" role="img" aria-label="ShowとForで表示を制御する図">
        <rect class="box accent" x="18" y="26" width="86" height="40" rx="8" />
        <text x="61" y="51" text-anchor="middle">Show</text>
        <path d="M112 46h45" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <text x="190" y="51" text-anchor="middle">条件表示</text>
        <rect class="box warn" x="18" y="88" width="86" height="40" rx="8" />
        <text x="61" y="113" text-anchor="middle">For</text>
        <path d="M112 108h45" stroke="#f4b641" stroke-width="2.5" marker-end="url(#arrow)" />
        <rect class="box" x="170" y="88" width="36" height="28" rx="6" />
        <rect class="box" x="214" y="88" width="36" height="28" rx="6" />
        <rect class="box" x="258" y="88" width="36" height="28" rx="6" />
        ${arrowMarker()}
      </svg>`,
    props: `
      <svg viewBox="0 0 320 150" role="img" aria-label="Propsをそのまま読むことを示す図">
        <rect class="box accent" x="18" y="39" width="92" height="72" rx="8" />
        <text x="64" y="67" text-anchor="middle">Parent</text>
        <text class="muted" x="64" y="88" text-anchor="middle">name</text>
        <path d="M118 75h58" stroke="#007f73" stroke-width="2.5" marker-end="url(#arrow)" />
        <rect class="box" x="184" y="39" width="118" height="72" rx="8" />
        <text x="243" y="65" text-anchor="middle">Child</text>
        <text class="muted" x="243" y="88" text-anchor="middle">props.name</text>
        ${arrowMarker()}
      </svg>`
  };
  return diagrams[kind];
}

function arrowMarker() {
  return `
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0 0l8 4-8 4z" fill="#007f73"></path>
      </marker>
    </defs>`;
}

function renderLesson() {
  const item = lessons[currentIndex];
  const done = checked.has(item.id);
  lesson.innerHTML = `
    <article>
      <div class="lesson-head">
        <span class="tag">${item.tag}</span>
        <h2>${item.title}</h2>
        <p>${item.summary}</p>
      </div>
      <div class="lesson-body">
        <div class="diagram">${diagram(item.diagram)}</div>
        <div class="note">
          <h3>覚える要点</h3>
          <p>${item.meta}。Codexに頼む時も、この言葉で意図を指定できると実装がぶれにくい。</p>
        </div>
        <div class="quiz">
          <h3>理解チェック</h3>
          <p>${item.quiz}</p>
          <button class="answer-button" type="button">答えを見る</button>
          <p class="answer">${item.answer}</p>
        </div>
      </div>
      <div class="check-action">
        <button type="button" data-check="${item.id}" class="${done ? "" : "primary"}">
          ${done ? "チェックを外す" : "説明できた"}
        </button>
      </div>
    </article>
  `;
  lesson.querySelector(".answer-button").addEventListener("click", () => {
    lesson.querySelector(".answer").classList.toggle("is-open");
  });
  lesson.querySelector("[data-check]").addEventListener("click", () => {
    if (checked.has(item.id)) checked.delete(item.id);
    else checked.add(item.id);
    save();
    update();
  });
}

function update() {
  renderToc();
  renderProgress();
  renderLesson();
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === lessons.length - 1;
}

function move(delta) {
  currentIndex = Math.max(0, Math.min(lessons.length - 1, currentIndex + delta));
  location.hash = lessons[currentIndex].id;
  update();
  lesson.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncFromHash() {
  const id = location.hash.replace("#", "");
  const found = lessons.findIndex((item) => item.id === id);
  if (found >= 0) currentIndex = found;
  update();
}

toc.addEventListener("click", (event) => {
  const row = event.target.closest("[data-index]");
  if (!row) return;
  currentIndex = Number(row.dataset.index);
  update();
});

resetButton.addEventListener("click", () => {
  checked = new Set();
  save();
  update();
});

prevButton.addEventListener("click", () => move(-1));
nextButton.addEventListener("click", () => move(1));
window.addEventListener("hashchange", syncFromHash);

syncFromHash();
