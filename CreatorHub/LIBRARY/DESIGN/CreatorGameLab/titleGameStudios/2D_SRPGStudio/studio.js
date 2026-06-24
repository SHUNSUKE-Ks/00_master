const assets = [
  {
    title: "Map Background",
    kind: "background",
    src: "./assets/background/bg_world_map_01.png",
    note: "Mission markerやroute objectを後から重ねる。"
  },
  {
    title: "Conversation Background",
    kind: "background",
    src: "./assets/background/bg_conversation_dock_01.png",
    note: "会話UI、Player、Log/Auto/Skipを後から重ねる。"
  },
  {
    title: "Battle Background",
    kind: "background",
    src: "./assets/background/bg_battle_field_forest_01.png",
    note: "unit sprite、range overlay、command UIを後から重ねる。"
  },
  {
    title: "Player Walk Sheet",
    kind: "character",
    src: "./assets/character/player_walk_default_alpha.png",
    note: "default / walking用。次にtrim済みframe座標JSONを作る。"
  },
  {
    title: "Player Battle Sheet",
    kind: "character",
    src: "./assets/character/player_battle_action_alpha.png",
    note: "Battle action用。attack effectの分離は後工程。"
  },
  {
    title: "Player Status UI",
    kind: "ui",
    src: "./assets/ui/ui_player_status_panel_alpha.png",
    note: "左側、操作中Player 1人のHP/状態表示。"
  },
  {
    title: "Marker / Object Set",
    kind: "object",
    src: "./assets/object/obj_srpg_marker_set_alpha.png",
    note: "Map / Battle共通のmarker、cursor、range、props。"
  }
];

const packageSlots = [
  {
    slotId: "slot_identity",
    label: "Identity",
    kind: "meta",
    status: "attached",
    file: "./package/title-game-studio.package.json",
    schema: "./package/schemas/title-game-studio-package.schema.json",
    dependsOn: []
  },
  {
    slotId: "slot_screen_layout",
    label: "Screen Layout",
    kind: "layout",
    status: "draft",
    file: "./package/slots/screen-layout.slot.json",
    schema: "./package/schemas/screen-layout.slot.schema.json",
    dependsOn: ["slot_identity"]
  },
  {
    slotId: "slot_runtime_manifest",
    label: "Runtime Manifest",
    kind: "runtime",
    status: "draft",
    file: "./package/slots/runtime-manifest.slot.json",
    schema: "./package/schemas/runtime-manifest.slot.schema.json",
    dependsOn: ["slot_asset_manifest", "slot_screen_layout"]
  },
  {
    slotId: "slot_asset_manifest",
    label: "Asset Manifest",
    kind: "asset",
    status: "draft",
    file: "./package/slots/asset-manifest.slot.json",
    schema: "./package/schemas/asset-manifest.slot.schema.json",
    dependsOn: ["slot_identity"]
  },
  {
    slotId: "slot_engine_binding",
    label: "Engine Binding",
    kind: "engine",
    status: "candidate",
    file: "./package/slots/engine-binding.slot.json",
    schema: "./package/schemas/engine-binding.slot.schema.json",
    dependsOn: ["slot_runtime_manifest"]
  },
  {
    slotId: "slot_fix_log",
    label: "Fix Log",
    kind: "review",
    status: "empty",
    file: "./package/slots/fix-log.slot.json",
    schema: "./package/schemas/fix-log.slot.schema.json",
    dependsOn: ["slot_asset_manifest"]
  },
  {
    slotId: "slot_engine_order",
    label: "Engine Order",
    kind: "handoff",
    status: "draft",
    file: "./package/slots/engine-order.slot.json",
    schema: "./package/schemas/engine-order.slot.schema.json",
    dependsOn: ["slot_engine_binding", "slot_fix_log"]
  }
];

const gallery = document.querySelector("#gallery");
const slots = document.querySelector("#slots");
const dialog = document.querySelector("#preview");
const previewImage = document.querySelector("#previewImage");
const previewTitle = document.querySelector("#previewTitle");
const previewNote = document.querySelector("#previewNote");

assets.forEach((asset) => {
  const button = document.createElement("button");
  button.className = "card";
  button.type = "button";
  button.innerHTML = `
    <img src="${asset.src}" alt="${asset.title}">
    <span>${asset.kind}</span>
    <h3>${asset.title}</h3>
    <p>${asset.note}</p>
  `;
  button.addEventListener("click", () => {
    previewImage.src = asset.src;
    previewImage.alt = asset.title;
    previewTitle.textContent = asset.title;
    previewNote.textContent = asset.note;
    dialog.showModal();
  });
  gallery.append(button);
});

packageSlots.forEach((slot) => {
  const article = document.createElement("article");
  article.className = "slot-card";
  article.innerHTML = `
    <div>
      <span>${slot.kind}</span>
      <h3>${slot.label}</h3>
      <strong>${slot.status}</strong>
    </div>
    <code>${slot.slotId}</code>
    <p>${slot.file}</p>
    <small>schema: ${slot.schema}</small>
    <small>depends: ${slot.dependsOn.length ? slot.dependsOn.join(" / ") : "none"}</small>
  `;
  slots.append(article);
});

document.querySelector("#close").addEventListener("click", () => dialog.close());
