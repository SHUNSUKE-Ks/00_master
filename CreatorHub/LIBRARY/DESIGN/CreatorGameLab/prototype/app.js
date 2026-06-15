const state = {
  view: "titleSelect",
  history: [],
  active: null,
  selectedTitleId: "short_novel"
};

const titles = [
  { id: "short_novel", title: "Short Novel", type: "NovelGame", progress: 72, componentKey: "novelDialogueSceneEditor", thumb: "linear-gradient(135deg, #89b7a7, #31564f 48%, #10191c)" },
  { id: "steel_horizon", title: "Steel Horizon", type: "SRPG Encounter", progress: 48, componentKey: "srpgEncounterSetup", thumb: "linear-gradient(135deg, #2f3741, #7d5c34 46%, #111518)" },
  { id: "pixel_harvest", title: "Pixel Harvest", type: "Collection Test", progress: 31, componentKey: "escapeRoomSceneEditor", thumb: "linear-gradient(135deg, #8aa96c, #3e6540 50%, #182018)" },
  { id: "starfarer", title: "Starfarer", type: "Space Exploration", progress: 66, componentKey: "emptyPrototypeWorkspace", thumb: "linear-gradient(135deg, #17243a, #335c70 52%, #101318)" },
  { id: "neon_district", title: "Neon District", type: "Title Screen", progress: 55, componentKey: "novelTitleScreenEditor", thumb: "linear-gradient(135deg, #1b2f3c, #71344d 50%, #111418)" },
  { id: "echoes_dark", title: "Echoes in the Dark", type: "Escape Room", progress: 19, componentKey: "escapeRoomSceneEditor", thumb: "linear-gradient(135deg, #273235, #171b1f 48%, #080a0c)" }
];

const engines = [
  {
    id: "adventure",
    title: "AdventureEngine",
    text: "NovelGameのTitle、Dialogue、Escape Roomを検証します。",
    points: ["背景/Character/UI配置", "選択肢とフラグ", "BGM/SEの切替"],
    icon: "A",
    color: "#63d5d0",
    key: "novelDialogueSceneEditor"
  },
  {
    id: "battle",
    title: "BattleEngine",
    text: "SRPGや戦闘導入前の配置、敵、報酬を検証します。",
    points: ["敵初期配置", "スキル/報酬イベント", "battle.start連携"],
    icon: "B",
    color: "#e9b858",
    key: "srpgEncounterSetup"
  },
  {
    id: "collection",
    title: "CollectionEngine",
    text: "図鑑、収集、解放条件の見え方を単体で検証します。",
    points: ["collection.unlock", "未解放/解放済み表示", "CG/Item/Character図鑑"],
    icon: "C",
    color: "#79cf82",
    key: "escapeRoomSceneEditor"
  }
];

const saves = [
  { slot: "01", title: "Short Novel", resumePoint: "dialogue_scene_003 / line 12", engine: "AdventureEngine", key: "novelDialogueSceneEditor" },
  { slot: "02", title: "Neon District", resumePoint: "title_logo_layout / BGM選択中", engine: "AdventureEngine", key: "novelTitleScreenEditor" },
  { slot: "03", title: "Echoes in the Dark", resumePoint: "room_01 / key_hotspot調整", engine: "AdventureEngine", key: "escapeRoomSceneEditor" },
  { slot: "04", title: "Steel Horizon", resumePoint: "encounter_001 / enemy spawn", engine: "BattleEngine", key: "srpgEncounterSetup" }
];

const registry = [
  { key: "novelTitleScreenEditor", owner: "AdventureEngine", status: "planned", summary: "Title screen background, logo, buttons, BGM, SE layout." },
  { key: "novelDialogueSceneEditor", owner: "AdventureEngine", status: "planned", summary: "Background, Character, UI, item, dialogue log layout." },
  { key: "escapeRoomSceneEditor", owner: "AdventureEngine", status: "planned", summary: "Background hotspots and puzzle interaction placement." },
  { key: "srpgEncounterSetup", owner: "BattleEngine", status: "planned", summary: "Initial enemy and ally placement before battle integration." },
  { key: "emptyPrototypeWorkspace", owner: "CreatorGameLab", status: "empty", summary: "Clean isolated test environment." }
];

function setView(view, options = {}) {
  if (options.pushHistory) state.history.push({ view: state.view });
  state.view = view;
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
}

function openWorkspace(active, fromView = state.view) {
  state.active = active;
  state.history.push({ view: fromView });
  document.getElementById("workspaceTitle").textContent = active.title;
  document.getElementById("workspaceCrumb").textContent = `${fromViewLabel(fromView)} / ${active.title}`;
  document.getElementById("componentKey").textContent = active.componentKey;
  setView("activeWorkspace");
}

function goBack() {
  const previous = state.history.pop();
  setView(previous?.view ?? "titleSelect");
}

function fromViewLabel(view) {
  return {
    titleSelect: "Title Select",
    engineSandbox: "Engine Sandbox",
    devSaveLoad: "Dev Save / Load",
    componentRegistry: "Component Registry"
  }[view] ?? "Title Select";
}

function renderTitles() {
  document.getElementById("titleGrid").innerHTML = titles.map((item) => `
    <article class="card title-card ${state.selectedTitleId === item.id ? "selected" : ""}" data-title-card="${item.id}">
      <div class="thumb" style="--thumb: ${item.thumb}"></div>
      <div class="card-body">
        <h3>${item.title}</h3>
        <p>${item.type}</p>
        <div class="progress-line"><div class="bar"><i style="width:${item.progress}%"></i></div><span>${item.progress}%</span></div>
        <div class="card-actions">
          <button data-open-title="${item.id}">Open</button>
          <button data-resume-title="${item.id}">Resume</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderEngines() {
  document.getElementById("engineGrid").innerHTML = engines.map((item) => `
    <article class="card">
      <div class="engine-icon" style="--engine-color:${item.color}">${item.icon}</div>
      <div class="card-body">
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <ul class="engine-detail">
          ${item.points.map((point) => `<li>${point}</li>`).join("")}
        </ul>
        <button data-open-engine="${item.id}">Open Sandbox</button>
      </div>
    </article>
  `).join("");

  document.getElementById("testList").innerHTML = ["Empty Project", "Performance Test", "Network Test", "UI Testbed"].map((label) => `
    <div class="test-row">
      <strong>${label}</strong>
      <span>Isolated environment for safe experiments.</span>
      <button data-open-test="${label}">Open</button>
    </div>
  `).join("");
}

function renderSaves() {
  document.getElementById("saveTable").innerHTML = `
    <div class="save-head">
      <span>Slot</span>
      <span>Title</span>
      <span>Resume Point</span>
      <span>Engine</span>
      <span>Action</span>
    </div>
  ` + saves.map((item) => `
    <div class="save-row">
      <code>${item.slot}</code>
      <strong>${item.title}</strong>
      <span>${item.resumePoint}</span>
      <span>${item.engine}</span>
      <button data-resume-slot="${item.slot}">Resume</button>
    </div>
  `).join("");
}

function renderRegistry() {
  document.getElementById("registryList").innerHTML = registry.map((item) => `
    <div class="registry-row">
      <strong>${item.key}</strong>
      <span>${item.owner} / ${item.status} / ${item.summary}</span>
      <button data-open-component="${item.key}">Open</button>
    </div>
  `).join("");
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.view) setView(target.dataset.view);
  if (target.id === "backButton") goBack();

  const titleId = target.dataset.openTitle || target.dataset.resumeTitle;
  if (titleId) {
    const title = titles.find((item) => item.id === titleId);
    state.selectedTitleId = titleId;
    renderTitles();
    openWorkspace({ title: title.title, componentKey: title.componentKey }, "titleSelect");
  }

  const selectedCard = target.closest("[data-title-card]");
  if (selectedCard && !titleId) {
    state.selectedTitleId = selectedCard.dataset.titleCard;
    renderTitles();
  }

  if (target.dataset.openEngine) {
    const engine = engines.find((item) => item.id === target.dataset.openEngine);
    openWorkspace({ title: engine.title, componentKey: engine.key }, "engineSandbox");
  }

  if (target.dataset.openTest) {
    openWorkspace({ title: target.dataset.openTest, componentKey: "emptyPrototypeWorkspace" }, "engineSandbox");
  }

  if (target.dataset.resumeSlot) {
    const slot = saves.find((item) => item.slot === target.dataset.resumeSlot);
    openWorkspace({ title: `${slot.title} / ${slot.resumePoint}`, componentKey: slot.key }, "devSaveLoad");
  }

  if (target.dataset.openComponent) {
    openWorkspace({ title: target.dataset.openComponent, componentKey: target.dataset.openComponent }, "componentRegistry");
  }
});

renderTitles();
renderEngines();
renderSaves();
renderRegistry();
