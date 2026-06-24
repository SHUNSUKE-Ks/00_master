const TODO_SLOT_PATH = "./package/slots/todo-studio-build.slot.json";
const NEXT_TASK_STORAGE_KEY = "tgs_2d_srpg_next_task";
const MILESTONE_STORAGE_KEY = "tgs_2d_srpg_active_milestone";

const todoList = document.querySelector("#todoList");
const deliveryList = document.querySelector("#deliveryList");
const milestoneStepper = document.querySelector("#milestoneStepper");
const milestoneDetail = document.querySelector("#milestoneDetail");
const resetMilestone = document.querySelector("#resetMilestone");
const nextTaskActive = document.querySelector("#nextTaskActive");
const nextTaskList = document.querySelector("#nextTaskList");
const resetNextTask = document.querySelector("#resetNextTask");
const todoProgress = document.querySelector("#todoProgress");
const todoProgressBar = document.querySelector("#todoProgressBar");
const todoProgressText = document.querySelector("#todoProgressText");

let todoSlot = null;

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function showLoadError(error) {
  const message = `
    <article class="todo-group">
      <h3>TODO JSONを読み込めませんでした</h3>
      <p>file://環境ではブラウザが外部JSONのfetchを止める場合があります。</p>
      <p><code>${TODO_SLOT_PATH}</code></p>
      <p><code>${String(error.message || error)}</code></p>
    </article>
  `;
  todoList.innerHTML = message;
  deliveryList.innerHTML = "";
  nextTaskActive.innerHTML = message;
}

function readActiveTaskId(tasks) {
  const saved = localStorage.getItem(NEXT_TASK_STORAGE_KEY);
  const savedTask = tasks.find((item) => item.taskId === saved);
  if (savedTask && savedTask.status !== "done") return savedTask.taskId;
  return tasks.find((item) => item.status === "next")?.taskId || tasks[0]?.taskId || "";
}

function writeActiveTaskId(taskId) {
  localStorage.setItem(NEXT_TASK_STORAGE_KEY, taskId);
}

function readActiveMilestoneId(milestones) {
  const saved = localStorage.getItem(MILESTONE_STORAGE_KEY);
  if (saved && milestones.some((item) => item.milestoneId === saved)) return saved;
  return milestones.find((item) => item.status === "active" || item.status === "next")?.milestoneId || milestones[0]?.milestoneId || "";
}

function writeActiveMilestoneId(milestoneId) {
  localStorage.setItem(MILESTONE_STORAGE_KEY, milestoneId);
}

function renderMilestones(milestones) {
  milestoneStepper.innerHTML = "";
  if (!milestones.length) {
    milestoneDetail.innerHTML = "<p>Milestoneは未設定です。</p>";
    return;
  }

  milestones.forEach((milestone, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.milestoneId = milestone.milestoneId;
    button.className = `milestone-step ${milestone.status}`;
    button.innerHTML = `
      <span>${index + 1}</span>
      <b>${milestone.key}</b>
      <small>${milestone.title}</small>
    `;
    button.addEventListener("click", () => {
      writeActiveMilestoneId(milestone.milestoneId);
      renderMilestoneDetail(milestones);
    });
    milestoneStepper.append(button);
  });

  resetMilestone.addEventListener("click", () => {
    localStorage.removeItem(MILESTONE_STORAGE_KEY);
    renderMilestoneDetail(milestones);
  });

  renderMilestoneDetail(milestones);
}

function renderMilestoneDetail(milestones) {
  const activeId = readActiveMilestoneId(milestones);
  const milestone = milestones.find((item) => item.milestoneId === activeId) || milestones[0];

  [...milestoneStepper.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.milestoneId === milestone.milestoneId);
  });

  const childTodos = milestone.childTodos || [];
  milestoneDetail.innerHTML = `
    <div class="milestone-detail-head">
      <div>
        <span>${milestone.key}</span>
        <h3>${milestone.title}</h3>
        <p>${milestone.summary}</p>
      </div>
      <aside>
        <strong>${milestone.status}</strong>
        <small>条件: ${milestone.clearCondition}</small>
        ${milestone.nextHref ? `<a href="${milestone.nextHref}">${milestone.nextLabel || "Open next TODO"}</a>` : ""}
      </aside>
    </div>
    <div class="milestone-child-list">
      ${childTodos
        .map(
          (item) => `
            <label class="milestone-child ${item.done ? "done" : ""}">
              <input type="checkbox" ${item.done ? "checked" : ""} disabled>
              <span>${item.key}</span>
              <p>${item.text}</p>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderActiveTask(tasks) {
  const activeId = readActiveTaskId(tasks);
  const task = tasks.find((item) => item.taskId === activeId) || tasks[0];
  if (!task) {
    nextTaskActive.innerHTML = "<p>次Taskは未設定です。</p>";
    return;
  }

  nextTaskActive.innerHTML = `
    <div>
      <span>${task.key}</span>
      <h3>${task.title}</h3>
      <p>${task.summary}</p>
    </div>
    <aside>
      <button id="copyActiveTask" type="button" title="Copy task for Codex">Copy</button>
      <strong>${task.status}</strong>
      <small>${task.output}</small>
    </aside>
  `;

  document.querySelector("#copyActiveTask").addEventListener("click", async () => {
    const text = buildTaskCopyText(task);
    const ok = await copyText(text);
    const button = document.querySelector("#copyActiveTask");
    button.textContent = ok ? "Copied" : "Copy failed";
    window.setTimeout(() => {
      button.textContent = "Copy";
    }, 1200);
  });

  [...nextTaskList.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.taskId === task.taskId);
  });
}

function buildTaskCopyText(task) {
  const refs = (task.refs || [])
    .map(([name, file]) => `- ${name}: ${file}`)
    .join("\n");

  return [
    "# Codex Task",
    "",
    `key: ${task.key}`,
    `title: ${task.title}`,
    `status: ${task.status}`,
    `output: ${task.output}`,
    "",
    "summary:",
    task.summary,
    "",
    "state_change:",
    task.summary.includes("State:") ? task.summary.split("State:")[1].split("。")[0].trim() : "",
    "",
    "reference:",
    refs || "- none"
  ].join("\n");
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Use textarea fallback below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function renderNextTasks(tasks) {
  nextTaskList.innerHTML = "";
  tasks.forEach((task) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.taskId = task.taskId;
    button.innerHTML = `
      <span>${task.key}</span>
      <b>${task.title}</b>
      <small>${task.status}</small>
    `;
    button.addEventListener("click", () => {
      writeActiveTaskId(task.taskId);
      renderActiveTask(tasks);
    });
    nextTaskList.append(button);
  });

  resetNextTask.addEventListener("click", () => {
    localStorage.removeItem(NEXT_TASK_STORAGE_KEY);
    renderActiveTask(tasks);
  });

  renderActiveTask(tasks);
}

function renderTodo(slot) {
  const deliveryItems = slot.deliveryItems || [];
  const groups = slot.groups || [];
  const items = [...deliveryItems, ...groups.flatMap((group) => group.items || [])];
  const doneCount = items.filter((item) => item.done).length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  todoProgress.textContent = `${percent}%`;
  todoProgressBar.style.width = `${percent}%`;
  todoProgressText.textContent = `${doneCount} / ${items.length} done`;

  deliveryList.innerHTML = "";
  deliveryItems.forEach((item) => {
    const label = document.createElement("label");
    label.className = `delivery-item ${item.done ? "done" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${item.done ? "checked" : ""} disabled>
      <span>${item.key}</span>
      <p>${item.text}</p>
    `;
    deliveryList.append(label);
  });

  todoList.innerHTML = "";
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
                <p>${item.text}</p>
              </label>
            `
          )
          .join("")}
      </div>
    `;
    todoList.append(article);
  });
}

async function init() {
  try {
    todoSlot = await loadJson(TODO_SLOT_PATH);
    renderMilestones(todoSlot.milestones || []);
    renderNextTasks(todoSlot.nextTasks || []);
    renderTodo(todoSlot);
  } catch (error) {
    showLoadError(error);
  }
}

init();
