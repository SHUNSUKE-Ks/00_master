const RUNTIME_TODO_SLOT_PATH = "./package/slots/todo-runtime-json.slot.json";

const runtimeDeliveryList = document.querySelector("#runtimeDeliveryList");
const runtimeTodoList = document.querySelector("#runtimeTodoList");
const runtimeProgress = document.querySelector("#runtimeProgress");
const runtimeProgressBar = document.querySelector("#runtimeProgressBar");
const runtimeProgressText = document.querySelector("#runtimeProgressText");

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function showLoadError(error) {
  runtimeTodoList.innerHTML = `
    <article class="todo-group">
      <h3>Runtime TODO JSONを読み込めませんでした</h3>
      <p>file://環境ではブラウザが外部JSONのfetchを止める場合があります。</p>
      <p><code>${RUNTIME_TODO_SLOT_PATH}</code></p>
      <p><code>${String(error.message || error)}</code></p>
    </article>
  `;
  runtimeDeliveryList.innerHTML = "";
}

function renderRuntimeTodo(slot) {
  const deliveryItems = slot.deliveryItems || [];
  const groups = slot.groups || [];
  const items = [...deliveryItems, ...groups.flatMap((group) => group.items || [])];
  const doneCount = items.filter((item) => item.done).length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  runtimeProgress.textContent = `${percent}%`;
  runtimeProgressBar.style.width = `${percent}%`;
  runtimeProgressText.textContent = `${doneCount} / ${items.length} done`;

  runtimeDeliveryList.innerHTML = "";
  deliveryItems.forEach((item) => {
    const label = document.createElement("label");
    label.className = `delivery-item ${item.done ? "done" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${item.done ? "checked" : ""} disabled>
      <span>${item.key}</span>
      <p>${item.text}</p>
    `;
    runtimeDeliveryList.append(label);
  });

  runtimeTodoList.innerHTML = "";
  groups.forEach((group) => {
    const groupItems = group.items || [];
    const article = document.createElement("article");
    article.className = "todo-group";
    article.innerHTML = `
      <div class="todo-group-head">
        <div>
          <h3>${group.heading}</h3>
          <p>${group.summary}</p>
        </div>
        <code>${groupItems.filter((item) => item.done).length}/${groupItems.length}</code>
      </div>
      <div class="todo-items">
        ${groupItems
          .map(
            (item) => `
              <label class="todo-item ${item.done ? "done" : ""}">
                <input type="checkbox" ${item.done ? "checked" : ""} disabled>
                <span>${item.key}</span>
                <p><code>${item.prop || ""}</code><br>${item.text}</p>
              </label>
            `
          )
          .join("")}
      </div>
    `;
    runtimeTodoList.append(article);
  });
}

async function init() {
  try {
    const slot = await loadJson(RUNTIME_TODO_SLOT_PATH);
    renderRuntimeTodo(slot);
  } catch (error) {
    showLoadError(error);
  }
}

init();
