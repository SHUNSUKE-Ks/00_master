export const DEVSTUDIO_PROJECT = {
  name: "SolidJS NovelEngine",
  label: "OneJson Engine DevStudio",
  phase: "Vol1.1",
  generatedAt: "2026-05-31",
  purpose: "scenario_main.json 一枚で動くノベル Engine と、素材洗い出し用ナレッジを管理する開発用ツール"
};

export const STATUSES = ["todo", "in_progress", "review", "done"];

export const STATUS_LABELS = {
  todo: "TODO",
  in_progress: "進行中",
  review: "確認",
  done: "完了"
};

export const PHASE_LABELS = {
  setup: "P0 Setup",
  engine: "P1 Engine",
  scenario: "P2 Scenario",
  devstudio: "P3 DevStudio",
  asset: "P4 Asset",
  publish: "P5 Publish"
};

export const ENGINE_TICKETS = [
  {
    id: "NE-001",
    title: "PCローカルに SolidJS Engine プロジェクトを作成",
    status: "done",
    priority: "P1",
    phase: "setup",
    area: "project",
    depends_on: [],
    files: ["package.json", "vite.config.js", "src/index.jsx"],
    acceptance: [
      "DropboxではなくPCローカルに作成する",
      "npm run dev で起動する",
      "npm run build が通る"
    ]
  },
  {
    id: "NE-002",
    title: "src直下に DevStudio を配置",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "tool",
    depends_on: ["NE-001"],
    files: ["src/DevStudio/DevStudio.jsx", "src/DevStudio/DevStudio.css"],
    acceptance: [
      "カンバンで Engine 制作TODOを確認できる",
      "SVGメーターが表示される",
      "MotionOneでメーターがアニメーションする"
    ]
  },
  {
    id: "NE-003",
    title: "OneJson scenario_main.json を読み込む",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "data",
    depends_on: ["NE-001"],
    files: ["src/data/scenario/scenario_main.json"],
    acceptance: [
      "title が表示できる",
      "scenes[].scene が表示できる",
      "talk[].speaker/text が表示できる"
    ]
  },
  {
    id: "NE-004",
    title: "gameStore を作成",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "state",
    depends_on: ["NE-003"],
    files: ["src/stores/gameStore.js"],
    acceptance: [
      "screen / phase / sceneIndex / talkIndex を持つ",
      "startGame / nextTalk / resetGame を持つ",
      "最終Talk後にEndへ遷移する"
    ]
  },
  {
    id: "NE-005",
    title: "Dynamicで Title / Novel / End を切り替える",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "screen",
    depends_on: ["NE-004"],
    files: ["src/screens/00_GameManager/GameManager.jsx"],
    acceptance: [
      "TITLEで10_Titleを表示する",
      "NOVELで20_Novelを表示する",
      "ENDで90_Endを表示する"
    ]
  },
  {
    id: "NE-006",
    title: "NovelScreenでクリック進行を実装",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "screen",
    depends_on: ["NE-005"],
    files: ["src/screens/20_Novel/NovelScreen.jsx"],
    acceptance: [
      "Scene名を表示する",
      "話者と本文を表示する",
      "画面クリックまたは次へボタンで進む"
    ]
  },
  {
    id: "NE-007",
    title: "シナリオAI納品SchemaをEngine側サンプルに反映",
    status: "done",
    priority: "P2",
    phase: "scenario",
    area: "schema",
    depends_on: ["NE-003"],
    files: ["src/data/scenario/scenario_main.json", "docs/scenario_delivery_schema.schema.json"],
    acceptance: [
      "titleScreenを保持する",
      "keyEventsを保持できる",
      "cgHintsを保持できる"
    ]
  },
  {
    id: "NE-008",
    title: "tagsから素材候補を一覧化する設計メモを作る",
    status: "done",
    priority: "P2",
    phase: "asset",
    area: "asset",
    depends_on: ["NE-007"],
    files: ["docs/asset_order_flow.md"],
    acceptance: [
      "bg / char / face / cg / bgm / se を分類する",
      "cgHintsを一枚絵候補として扱う",
      "Codexへの画像生成依頼に接続できる"
    ]
  },
  {
    id: "NE-009",
    title: "DevStudioにMarkdown整形表示を追加",
    status: "done",
    priority: "P2",
    phase: "devstudio",
    area: "tool",
    depends_on: ["NE-002"],
    files: ["src/DevStudio/DevStudio.jsx"],
    acceptance: [
      "mdを読みやすいブロックとして表示する",
      "見出し / 箇条書き / code を最低限整形する",
      "将来docsビューへ拡張できる"
    ]
  },
  {
    id: "NE-010",
    title: "DevStudioにJSONコードブロックとCopyを追加",
    status: "done",
    priority: "P2",
    phase: "devstudio",
    area: "tool",
    depends_on: ["NE-002"],
    files: ["src/DevStudio/DevStudio.jsx"],
    acceptance: [
      "JSONを整形して表示する",
      "Copyボタンでクリップボードへコピーできる",
      "scenario_main.jsonの確認に使える"
    ]
  },
  {
    id: "NE-011",
    title: "InBox / 受信箱を残す",
    status: "done",
    priority: "P3",
    phase: "devstudio",
    area: "inbox",
    depends_on: ["NE-002"],
    files: ["src/DevStudio/DevStudio.jsx"],
    acceptance: [
      "外部報告をメール形式で受け取る思想を残す",
      "task ticketに後で紐付けられる余地を残す",
      "localStorageに保存する"
    ]
  },
  {
    id: "NE-012",
    title: "Vol1.1をブラウザで最後まで読了確認",
    status: "review",
    priority: "P1",
    phase: "publish",
    area: "qa",
    depends_on: ["NE-006"],
    files: ["src/data/scenario/scenario_main.json"],
    acceptance: [
      "Titleから開始できる",
      "最後のTalk後にEndへ進む",
      "scenario_main.json差し替えだけで読める"
    ]
  },
  {
    id: "NE-013",
    title: "Default DevLibrary JSONを作成",
    status: "done",
    priority: "P1",
    phase: "asset",
    area: "library",
    depends_on: ["NE-007", "NE-008"],
    files: ["src/data/library/dev_library.default.json"],
    acceptance: [
      "キャラクターDBを初期登録する",
      "場所DBを初期登録する",
      "AssetOrderをJSONで保持する",
      "指定がない素材はSVG placeholder方針を持つ"
    ]
  },
  {
    id: "NE-014",
    title: "DevStudioにDevLibrary編集ビューを追加",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "library",
    depends_on: ["NE-013"],
    files: ["src/DevStudio/DevStudio.jsx", "src/DevStudio/DevStudio.css"],
    acceptance: [
      "LibraryタブでCharacter DBを確認できる",
      "LibraryタブでAssetOrderを確認できる",
      "JSONを一時編集してlocalStorageに保存できる"
    ]
  },
  {
    id: "NE-015",
    title: "Fantasy Novel Default Packを初期素材として配置",
    status: "done",
    priority: "P1",
    phase: "asset",
    area: "asset",
    depends_on: ["NE-013"],
    files: [
      "public/assets/packs/fantasy_novel_default",
      "public/assets/sound/bgm/Unnamed Memory",
      "src/data/library/dev_library.default.json"
    ],
    acceptance: [
      "PC横画面向け背景PNGを配置する",
      "主人公とヒロインの立ち絵差分PNGシートを配置する",
      "UI素材をSVGで配置する",
      "BGMフォルダーをプロジェクトへ複製する"
    ]
  },
  {
    id: "NE-016",
    title: "BGM AudioManagerを追加",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "audio",
    depends_on: ["NE-015"],
    files: [
      "src/audio/audioManager.js",
      "src/audio/AudioDirector.jsx",
      "src/audio/AudioControls.jsx",
      "src/screens/10_Title/TitleScreen.jsx",
      "src/screens/20_Novel/NovelScreen.jsx"
    ],
    acceptance: [
      "初回ユーザー操作でBGM再生をunlockする",
      "Title / Novel / Endの切り替えでBGMを再生停止する",
      "Scene切り替えでBGMを差し替えられる",
      "Engine画面にBGM ON/OFFを置く"
    ]
  }
];

export const KNOWLEDGE_NOTES = [
  {
    id: "KN-001",
    title: "InBox / 受信箱の扱い",
    body: [
      "## 目的",
      "受信箱は、プロジェクト外からの報告をメール形式で受け取るための場所として残す。",
      "",
      "## 現在の位置づけ",
      "- 主導線はDashboardとKanban",
      "- InBoxは外部AI、素材作成、調査メモの一時受け口",
      "- 将来task ticketへ紐付ける可能性を残す",
      "",
      "## 注意",
      "並列agentが増えすぎると状況共有コストが上がるため、まずは一つのチャットで全体把握しながら進める。"
    ].join("\n")
  },
  {
    id: "KN-002",
    title: "AI共有ナレッジとIndex",
    body: [
      "## 目的",
      "AIが何をどこで参照すればよいか迷わないように、Indexを整備する。",
      "",
      "## 方針",
      "- 要件定義",
      "- Setup資料",
      "- Scenario Schema",
      "- OneJson sample",
      "- AssetOrder",
      "- TaskTicket",
      "",
      "これらをDevStudioから辿れる状態にする。"
    ].join("\n")
  },
  {
    id: "KN-003",
    title: "Scenario と DevLibrary の分離",
    body: [
      "## 目的",
      "scenario_main.jsonは脚本、dev_library.default.jsonは制作DBとして分ける。",
      "",
      "## 参照方針",
      "- scenario_main.json は char_ / bg_ / cg_ などのtagを持つ",
      "- DevLibrary はそのtagが指すキャラクター、場所、素材候補を管理する",
      "- Codex はLibraryを読んで不足素材やSVG placeholderを作れる",
      "",
      "## 編集",
      "DevStudioのLibraryタブでJSONを確認し、試験的な変更はlocalStorageへ保存する。"
    ].join("\n")
  }
];

export const SAMPLE_JSON = {
  title: "魔女の森",
  titleScreen: {
    title: "魔女の森",
    subtitle: "失われた妹を探す騎士の物語",
    startButtonLabel: "はじめる",
    tags: ["bg_title_forest", "bgm_title"]
  },
  scenes: [
    {
      id: "scene_forest_entrance",
      scene: "森入口",
      tags: ["bg_forest_entrance", "mood_lonely", "cg_knight_enter_forest"],
      talk: [
        {
          id: "talk_001",
          speaker: "騎士",
          text: "ここが魔女の森か……。",
          tags: ["char_knight", "face_knight_serious"]
        }
      ],
      next: null
    }
  ],
  cgHints: [
    {
      id: "cg_knight_enter_forest",
      label: "騎士が森へ入る一枚絵",
      description: "霧の深い森の入口で、剣を握った騎士が一歩踏み出す。",
      tags: ["cg_knight_enter_forest", "char_knight", "bg_forest_entrance"]
    }
  ]
};
