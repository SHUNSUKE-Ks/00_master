export const SRPG_STUDIO_PROJECT = {
  name: "2D_SRPGStudio",
  phase: "Visual Asset Scaffold",
  source: "C:/Users/enjoy/InBox2026/InBox0601/UpNote_2026-06-21_11-18-00",
  goal:
    "SRPGエンジン本体ではなく、UI / Object / Background / Characterを分離したゲーム用画像素材一覧と生成プロンプトを整える。"
};

export const SRPG_STYLE_PROMPT =
  "tactical fantasy SRPG visual style, warm hand-painted pixel art look, HD-2D inspired isometric game screen, crisp readable UI, layered game asset production, muted parchment gold, deep navy shadows, soft bloom, dramatic but usable in-game composition, no logos, no watermark";

export const SRPG_REFERENCE_IMAGES = [
  {
    id: "sample_srpg_style_001",
    title: "Generated Style Sample 001",
    kind: "style_sample",
    src: "/assets/srpg/style-samples/srpg_style_sample_001.png",
    note: "2D_SRPGStudio用に生成した最初の一枚絵サンプル。ここからレイヤー分離素材へ展開する。"
  },
  {
    id: "generated_map_bg_01",
    title: "Generated Map Background 001",
    kind: "generated_background",
    src: "/assets/srpg/background/bg_world_map_01.png",
    note: "UIなしのマップ背景。Mission markerやカーソルを後から重ねる。"
  },
  {
    id: "generated_conversation_bg_01",
    title: "Generated Conversation Background 001",
    kind: "generated_background",
    src: "/assets/srpg/background/bg_conversation_dock_01.png",
    note: "UIなしの会話背景。Character、dialogue UI、Log/Auto/Skipを後から重ねる。"
  },
  {
    id: "generated_battle_bg_01",
    title: "Generated Battle Background 001",
    kind: "generated_background",
    src: "/assets/srpg/background/bg_battle_field_forest_01.png",
    note: "UIなしのBattle背景。unit sprite、range overlay、command UIを後から重ねる。"
  },
  {
    id: "generated_player_walk_sheet_01",
    title: "Generated Player Walk Sheet 001",
    kind: "generated_character",
    src: "/assets/srpg/character/player_walk_default_alpha.png",
    note: "操作中Player 1人用のdefault / walking sprite sheet。透明化済み。"
  },
  {
    id: "generated_player_battle_sheet_01",
    title: "Generated Player Battle Sheet 001",
    kind: "generated_character",
    src: "/assets/srpg/character/player_battle_action_alpha.png",
    note: "操作中Player 1人用のBattle action sprite sheet。透明化済み。"
  },
  {
    id: "generated_player_status_ui_01",
    title: "Generated Player Status UI 001",
    kind: "generated_ui",
    src: "/assets/srpg/ui/ui_player_status_panel_alpha.png",
    note: "左側に置く操作中Player 1人用のHP / 状態パネル。透明化済み。"
  },
  {
    id: "generated_marker_object_set_01",
    title: "Generated Marker Object Set 001",
    kind: "generated_object",
    src: "/assets/srpg/object/obj_srpg_marker_set_alpha.png",
    note: "マップ、Battleで共通利用するmarker / cursor / object sheet。透明化済み。"
  },
  {
    id: "ref_world_map",
    title: "World Map / Mission Marker",
    kind: "background_ui",
    src: "/reference/srpg-upnote/image%202.png",
    note: "戦略マップ、拠点アイコン、選択マーカー、章/推奨Lv表示の参考。"
  },
  {
    id: "ref_unit_list",
    title: "Unit List",
    kind: "ui_character",
    src: "/reference/srpg-upnote/image%204.png",
    note: "左Character表示、右ユニット一覧、選択ユニット切替の参考。"
  },
  {
    id: "ref_equipment",
    title: "Equipment Screen",
    kind: "ui",
    src: "/reference/srpg-upnote/image%206.png",
    note: "装備、パラメータ、Q/Eユニット切替の参考。"
  },
  {
    id: "ref_dialogue_log",
    title: "Conversation Log",
    kind: "ui_dialogue",
    src: "/reference/srpg-upnote/image%209.png",
    note: "会話ログ、音声アイコン、選択ライン、footer操作ガイドの参考。"
  },
  {
    id: "ref_battle_title",
    title: "Battle Title Call",
    kind: "screen",
    src: "/reference/srpg-upnote/image%2023.png",
    note: "戦闘開始タイトルコール、画面演出、背景ぼかしの参考。"
  },
  {
    id: "ref_battle_result",
    title: "Battle Result",
    kind: "screen",
    src: "/reference/srpg-upnote/image%2040.png",
    note: "戦果、報酬、成長、終了画面の参考。"
  }
];

export const SRPG_GALLERY_SECTIONS = [
  {
    id: "map",
    title: "Map",
    stateHint: "idle / marker_focus / mission_preview / route_confirm",
    imageIds: ["generated_map_bg_01", "generated_marker_object_set_01", "generated_player_status_ui_01", "ref_world_map"]
  },
  {
    id: "conversation",
    title: "Conversation",
    stateHint: "reading / log_open / auto_play / skip_confirm / choice_open",
    imageIds: [
      "generated_conversation_bg_01",
      "generated_player_walk_sheet_01",
      "generated_player_status_ui_01",
      "ref_dialogue_log"
    ]
  },
  {
    id: "battle",
    title: "Battle",
    stateHint: "player_idle / move_preview / target_select / command_open / action_preview / enemy_turn",
    imageIds: [
      "generated_battle_bg_01",
      "generated_player_walk_sheet_01",
      "generated_player_battle_sheet_01",
      "generated_marker_object_set_01",
      "generated_player_status_ui_01",
      "sample_srpg_style_001",
      "ref_battle_title"
    ]
  },
  {
    id: "player_status",
    title: "Player Status / Equipment",
    stateHint: "default / equipment_select / skill_select / state_detail",
    imageIds: ["generated_player_status_ui_01", "generated_player_walk_sheet_01", "ref_unit_list", "ref_equipment"]
  },
  {
    id: "result",
    title: "Battle Result",
    stateHint: "reward_count / level_up / item_gain / next_confirm",
    imageIds: ["generated_battle_bg_01", "generated_player_status_ui_01", "ref_battle_result"]
  }
];

export const SRPG_SCREEN_LAYOUTS = [
  {
    id: "world_map",
    title: "World Map",
    phase: "Map Select",
    description: "章選択、拠点選択、イベント/戦闘アイコン、推奨Lvを確認する画面。",
    references: ["ref_world_map"],
    layers: ["background", "route_object", "mission_marker", "cursor", "left_player_status"],
    assets: ["bg_world_map_01", "obj_route_nodes_01", "ui_mission_marker_set", "ui_player_status_panel"]
  },
  {
    id: "battle_field",
    title: "Battle Field",
    phase: "Tactical Action",
    description: "グリッド、操作中Player、攻撃範囲、間合いSystem、コマンドを扱う中心画面。",
    references: ["ref_battle_title"],
    layers: ["background", "terrain_tile", "player_sprite", "range_overlay", "command_ui", "left_player_status", "cursor"],
    assets: ["bg_battle_field_forest_01", "tile_srpg_forest_set", "spr_player_walk_default", "spr_player_battle_action", "ui_command_ring", "ui_player_status_panel"]
  },
  {
    id: "unit_roster",
    title: "Unit Roster",
    phase: "Player Status",
    description: "操作中Player 1人の立ち絵、HP、状態、装備導線を確認する画面。パーティ一覧は別画面で扱う。",
    references: ["ref_unit_list"],
    layers: ["ui_panel", "character_portrait", "player_hp", "state_icon", "stat_text"],
    assets: ["ui_player_status_panel", "char_portrait_player_01", "icon_state_set"]
  },
  {
    id: "equipment",
    title: "Equipment",
    phase: "Unit Customize",
    description: "装備、武器、アクセサリ、能力値、ユニット切替を扱う画面。",
    references: ["ref_equipment"],
    layers: ["ui_panel", "item_icon", "character_portrait", "player_hp", "stat_grid"],
    assets: ["ui_equipment_panel", "icon_weapon_item_set", "char_portrait_player_01", "ui_player_status_panel"]
  },
  {
    id: "conversation",
    title: "Conversation",
    phase: "Story",
    description: "背景、キャラクター、吹き出し、会話本文、Log/Auto/Skipを扱う画面。",
    references: ["ref_dialogue_log"],
    layers: ["background", "character_sprite", "dialogue_ui", "voice_icon", "left_player_status"],
    assets: ["bg_conversation_dock_01", "spr_player_walk_default", "ui_dialogue_box", "ui_player_status_panel"]
  },
  {
    id: "battle_result",
    title: "Battle Result",
    phase: "Reward",
    description: "戦果、報酬、経験値、習得スキル、次へ進む導線を扱う画面。",
    references: ["ref_battle_result"],
    layers: ["background_blur", "result_panel", "reward_icon", "character_portrait", "left_player_status"],
    assets: ["ui_result_panel", "icon_reward_set", "fx_result_light", "ui_player_status_panel"]
  }
];

export const SRPG_ASSET_MANIFEST = [
  {
    id: "bg_world_map_01",
    group: "Background",
    screen: "world_map",
    status: "generated",
    output: "public/assets/srpg/background/bg_world_map_01.png",
    prompt:
      "Create a 16:9 tactical fantasy SRPG world map background, parchment terrain, rivers, forests, castles, routes, warm hand-painted pixel art look, no UI text, no mission markers, clean background layer only."
  },
  {
    id: "bg_battle_field_forest_01",
    group: "Background",
    screen: "battle_field",
    status: "generated",
    output: "public/assets/srpg/background/bg_battle_field_forest_01.png",
    prompt:
      "Create an isometric SRPG battle field background, forest ruins and stone path, readable tactical terrain, 3/4 top-down angle, warm pixel art look, no characters, no UI, background layer only."
  },
  {
    id: "bg_conversation_dock_01",
    group: "Background",
    screen: "conversation",
    status: "generated",
    output: "public/assets/srpg/background/bg_conversation_dock_01.png",
    prompt:
      "Create an SRPG story conversation background, medieval riverside wooden dock and village edge at dusk, warm hand-painted pixel art look, no characters, no UI, background layer only."
  },
  {
    id: "spr_player_walk_default",
    group: "Character",
    screen: "battle_field",
    status: "alpha_ready",
    output: "public/assets/srpg/character/player_walk_default_alpha.png",
    prompt:
      "Create a single controllable Player character sprite sheet for a 2D tactical fantasy SRPG. Include default idle and walking frames only, 4 directions if possible, flat chroma-key background."
  },
  {
    id: "spr_player_battle_action",
    group: "Character",
    screen: "battle_field",
    status: "alpha_ready",
    output: "public/assets/srpg/character/player_battle_action_alpha.png",
    prompt:
      "Create a battle action sprite sheet for the same single controllable Player character. Include battle idle, ready, sword slash, guard, damaged, victory, flat chroma-key background."
  },
  {
    id: "tile_srpg_forest_set",
    group: "Object",
    screen: "battle_field",
    status: "prompt_ready",
    output: "public/assets/srpg/object/tile_srpg_forest_set.png",
    prompt:
      "Create a game-ready tile object set for SRPG forest terrain: grass tile, stone path, bush, tree stump, low wall, shallow water edge, top-down isometric pixel art, arranged as a clean sprite sheet on flat chroma-key background."
  },
  {
    id: "char_portrait_player_01",
    group: "Character",
    screen: "unit_roster",
    status: "prompt_ready",
    output: "public/assets/srpg/character/char_portrait_player_01.png",
    prompt:
      "Create a portrait for the controllable Player character, young sword hero with dark hair, navy cloak, light armor, fantasy anime pixel-painted portrait, transparent-ready flat background, no text."
  },
  {
    id: "ui_mission_marker_set",
    group: "UI",
    screen: "world_map",
    status: "alpha_ready",
    output: "public/assets/srpg/object/obj_srpg_marker_set_alpha.png",
    prompt:
      "Create SRPG world map UI marker set: battle marker, event marker, danger marker, completed marker, selected cursor, parchment gold and red accents, crisp game icons, transparent-ready flat background, no text."
  },
  {
    id: "ui_command_ring",
    group: "UI",
    screen: "battle_field",
    status: "prompt_ready",
    output: "public/assets/srpg/ui/ui_command_ring.png",
    prompt:
      "Create SRPG command UI components: attack, move, skill, item, wait, guard icons, compact dark translucent panel style, readable at small size, transparent-ready flat background, no text."
  },
  {
    id: "ui_player_status_panel",
    group: "UI",
    screen: "shared",
    status: "alpha_ready",
    output: "public/assets/srpg/ui/ui_player_status_panel_alpha.png",
    prompt:
      "Create a compact left-side Player status UI panel for one controllable unit, portrait slot, HP bar, small state icon slots, dark gold tactical fantasy UI, transparent-ready flat background, no readable text."
  },
  {
    id: "ui_dialogue_box",
    group: "UI",
    screen: "conversation",
    status: "prompt_ready",
    output: "public/assets/srpg/ui/ui_dialogue_box.png",
    prompt:
      "Create SRPG dialogue UI frame, dark translucent box, nameplate, voice icon slot, log auto skip button slots, elegant fantasy tactical UI, transparent-ready flat background, no text."
  },
  {
    id: "icon_weapon_item_set",
    group: "Object",
    screen: "equipment",
    status: "prompt_ready",
    output: "public/assets/srpg/object/icon_weapon_item_set.png",
    prompt:
      "Create SRPG equipment icon sheet: sword, spear, bow, staff, shield, ring, potion, scroll, crisp pixel art icons, consistent lighting, transparent-ready flat background, no text."
  },
  {
    id: "ui_result_panel",
    group: "UI",
    screen: "battle_result",
    status: "prompt_ready",
    output: "public/assets/srpg/ui/ui_result_panel.png",
    prompt:
      "Create SRPG battle result UI panel set, reward window, exp bar, item reward slots, rank badge frame, dark gold tactical fantasy UI, transparent-ready flat background, no text."
  },
  {
    id: "fx_result_light",
    group: "FX",
    screen: "battle_result",
    status: "prompt_ready",
    output: "public/assets/srpg/fx/fx_result_light.png",
    prompt:
      "Create subtle SRPG result screen light effect sprites, gold rays, small sparkle particles, soft bloom, game overlay FX, transparent-ready flat background."
  }
];

export const SRPG_WORKFLOW_STEPS = [
  "Reference画像を画面カテゴリへ分類する",
  "各画面を background / ui / object / character / fx のレイヤーへ分ける",
  "Asset Manifestで必要素材ID、用途、出力先、promptを管理する",
  "まず一枚絵サンプルで雰囲気を確認する",
  "採用後にUI / Object / Background / Characterを個別画像として生成する",
  "SRPGエンジン側にはlayer manifestとして渡す"
];

export const SRPG_RUNTIME_MANIFEST = {
  meta: {
    id: "srpg_visual_runtime_manifest_v0_1",
    version: "0.1",
    status: "draft",
    purpose:
      "2D_SRPGStudioで生成した画像をSRPGエンジン側へ渡すためのruntime向けmanifest。座標は初期切り出し用の仮grid。"
  },
  style: {
    prompt: SRPG_STYLE_PROMPT,
    sharedLook:
      "Map / Conversation / Battleで同じPlayer、同じUIトーン、同じwarm HD-2D pixel fantasy lookを使う。"
  },
  screens: {
    map: {
      phase: "Map Select",
      states: ["idle", "marker_focus", "mission_preview", "route_confirm"],
      layers: [
        { id: "bg", type: "background", asset: "bg_world_map_01", z: 0 },
        { id: "markers", type: "object", asset: "obj_srpg_marker_set", z: 20 },
        { id: "playerStatus", type: "ui", asset: "ui_player_status_panel", z: 80 }
      ]
    },
    conversation: {
      phase: "Story",
      states: ["reading", "log_open", "auto_play", "skip_confirm", "choice_open"],
      layers: [
        { id: "bg", type: "background", asset: "bg_conversation_dock_01", z: 0 },
        { id: "player", type: "character", asset: "player_walk_default", z: 30 },
        { id: "playerStatus", type: "ui", asset: "ui_player_status_panel", z: 80 }
      ]
    },
    battle: {
      phase: "Tactical Action",
      states: ["player_idle", "move_preview", "target_select", "command_open", "action_preview", "enemy_turn"],
      layers: [
        { id: "bg", type: "background", asset: "bg_battle_field_forest_01", z: 0 },
        { id: "range", type: "object", asset: "obj_srpg_marker_set", z: 15 },
        { id: "playerWalk", type: "character", asset: "player_walk_default", z: 30 },
        { id: "playerBattle", type: "character", asset: "player_battle_action", z: 35 },
        { id: "playerStatus", type: "ui", asset: "ui_player_status_panel", z: 80 }
      ]
    }
  },
  assets: {
    bg_world_map_01: {
      type: "background",
      path: "/assets/srpg/background/bg_world_map_01.png",
      size: { width: 1536, height: 1024 },
      usage: ["map"]
    },
    bg_conversation_dock_01: {
      type: "background",
      path: "/assets/srpg/background/bg_conversation_dock_01.png",
      size: { width: 1536, height: 1024 },
      usage: ["conversation"]
    },
    bg_battle_field_forest_01: {
      type: "background",
      path: "/assets/srpg/background/bg_battle_field_forest_01.png",
      size: { width: 1536, height: 1024 },
      usage: ["battle"]
    },
    player_walk_default: {
      type: "spriteSheet",
      path: "/assets/srpg/character/player_walk_default_alpha.png",
      sourcePath: "/assets/srpg/character/player_walk_default_chroma.png",
      alpha: true,
      size: { width: 1536, height: 1024 },
      grid: { columns: 5, rows: 4, cellWidth: 307, cellHeight: 256 },
      framePolicy:
        "初期切り出しは5x4 grid。実装時に余白を検出してtrimする。方向はrowごとにfront / side_a / side_b / backとして仮扱い。",
      animations: {
        default_front: ["walk_r0_c0"],
        walk_front: ["walk_r0_c1", "walk_r0_c2", "walk_r0_c3", "walk_r0_c4"],
        walk_side_a: ["walk_r1_c0", "walk_r1_c1", "walk_r1_c2", "walk_r1_c3", "walk_r1_c4"],
        walk_side_b: ["walk_r2_c0", "walk_r2_c1", "walk_r2_c2", "walk_r2_c3", "walk_r2_c4"],
        walk_back: ["walk_r3_c0", "walk_r3_c1", "walk_r3_c2", "walk_r3_c3", "walk_r3_c4"]
      }
    },
    player_battle_action: {
      type: "spriteSheet",
      path: "/assets/srpg/character/player_battle_action_alpha.png",
      sourcePath: "/assets/srpg/character/player_battle_action_chroma.png",
      alpha: true,
      size: { width: 1536, height: 1024 },
      grid: { columns: 4, rows: 2, cellWidth: 384, cellHeight: 512 },
      framePolicy:
        "初期切り出しは4x2 grid。attack framesはエフェクト込みのため、後工程でhitbox / effectBoxを分ける。",
      animations: {
        battle_idle: ["battle_r0_c0"],
        ready: ["battle_r0_c1"],
        sword_attack: ["battle_r0_c2", "battle_r0_c3"],
        guard: ["battle_r1_c0"],
        damaged: ["battle_r1_c1"],
        victory: ["battle_r1_c2"],
        back_view: ["battle_r1_c3"]
      }
    },
    ui_player_status_panel: {
      type: "uiSheet",
      path: "/assets/srpg/ui/ui_player_status_panel_alpha.png",
      sourcePath: "/assets/srpg/ui/ui_player_status_panel_chroma.png",
      alpha: true,
      usage: ["map", "conversation", "battle", "result"]
    },
    obj_srpg_marker_set: {
      type: "objectSheet",
      path: "/assets/srpg/object/obj_srpg_marker_set_alpha.png",
      sourcePath: "/assets/srpg/object/obj_srpg_marker_set_chroma.png",
      alpha: true,
      usage: ["map", "battle"]
    }
  },
  next: [
    "player_walk_defaultの実trim frame座標を作る",
    "player_battle_actionのhitbox / effectBoxを分ける",
    "ui_player_status_panelの部品ごとのslice座標を作る",
    "obj_srpg_marker_setのmarker / range / cursor / propsごとのslice座標を作る"
  ]
};
