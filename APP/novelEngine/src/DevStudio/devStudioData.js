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
    status: "done",
    priority: "P1",
    phase: "publish",
    area: "qa",
    depends_on: ["NE-006"],
    files: ["src/data/scenario/scenario_main.json"],
    acceptance: [
      "Titleから開始できる",
      "最後のTalk後にEndへ進む",
      "scenario_main.json差し替えだけで読める",
      "2026-06-21: ノベルゲーム仮データで読了テスト完了"
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
  },
  {
    id: "NE-017",
    title: "DevStudioにSchema Registryを追加",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "schema",
    depends_on: ["NE-007", "NE-014", "TT-NE-WS-002"],
    files: [
      "src/DevStudio/DevStudio.jsx",
      "src/DevStudio/DevStudio.css",
      "docs/scenario_delivery_schema.schema.json",
      "src/data/scenario/scenario_main.json",
      "src/data/library/dev_library.default.json"
    ],
    acceptance: [
      "右上headerにSchemasタブを追加する",
      "scenario_main.json activeとshape sampleをコピー付きで表示する",
      "scenario_delivery_schema.schema.jsonをコピー付きで表示する",
      "dev_library.default.json activeとdraft schemaをコピー付きで表示する",
      "asset_processing / asset_workshop_orderの候補schemaをコピー付きで表示する"
    ]
  },
  {
    id: "NE-018",
    title: "scenario_oneshot下書き納品フォーマットを採用",
    status: "done",
    priority: "P1",
    phase: "scenario",
    area: "schema",
    depends_on: ["NE-017"],
    files: [
      "docs/scenario_oneshot.schema.json",
      "docs/tag_dictionary_v0_1.json",
      "src/DevStudio/DevStudio.jsx"
    ],
    acceptance: [
      "ChatGPT / kanban-note01 / 人間からの納品入口をscenario_oneshotとして定義する",
      "scenario_oneshot.schema.jsonを作成する",
      "tag_dictionary_v0_1.jsonを作成する",
      "Schemasタブで下書きsample、schema、tag辞書をコピー付きで確認できる",
      "Engine本体のscenario_main.jsonとは分離し、後続Ticketで変換する"
    ]
  },
  {
    id: "NE-019",
    title: "scenario_oneshotをscenario_mainへ変換するIntakeを作る",
    status: "done",
    priority: "P1",
    phase: "scenario",
    area: "intake",
    depends_on: ["NE-018"],
    files: [
      "src/DevStudio/DevStudio.jsx",
      "src/utils/scenarioOneShot.js",
      "src/data/scenario/scenario_main.json",
      "docs/scenario_oneshot.schema.json",
      "docs/scenario_delivery_schema.schema.json"
    ],
    acceptance: [
      "scenario_oneshot JSONを貼り付けてparseできる",
      "sc_001をscene_001へ正規化できる",
      "bg / characters / tagsをscene.tagsへ統合できる",
      "talk配列をtalk objectへ変換できる",
      "choiceを変換後scenario_main draftへ保持できる",
      "assetPromptsを変換後scenario_main draftへ保持できる",
      "変換後scenario_main draftをコピーできる"
    ]
  },
  {
    id: "NE-020",
    title: "scenario_main draftをEngine再生データへ採用する流れを作る",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "scenario",
    depends_on: ["NE-019"],
    files: [
      "src/data/scenario/scenario_main.json",
      "src/screens/20_Novel/NovelScreen.jsx",
      "src/stores/gameStore.js"
    ],
    acceptance: [
      "converted scenario_main draftを実データへ差し替える",
      "choice表示とoption.next遷移を実装する",
      "assetPromptsはDevStudio / Asset Workshop用に残す",
      "未来を打ち直す鍛冶屋のサンプルをTitleから再生確認できる"
    ]
  },
  {
    id: "NE-021",
    title: "Conversation Log下書き形式を採用",
    status: "done",
    priority: "P1",
    phase: "scenario",
    area: "writing-format",
    depends_on: ["NE-018", "NE-019"],
    files: [
      "docs/conversation_log_draft_format_v0_1.md",
      "C:/00_master/APP/kanban-note01/src/components/ScenarioBlockEditor.tsx",
      "C:/00_master/APP/kanban-note01/src/utils/dialogueFormat.ts"
    ],
    acceptance: [
      "Noteで作る会話ログに合わせた縦ログ台本形式を定義する",
      "話者名、音声アイコン相当、本文、Scene、bg、tags、choiceの書き方を固定する",
      "conversation_log -> scenario_oneshot -> scenario_main の変換方針を明記する"
    ]
  },
  {
    id: "NE-022",
    title: "conversation_logをscenario_oneshotへ変換するIntakeを作る",
    status: "todo",
    priority: "P1",
    phase: "scenario",
    area: "intake",
    depends_on: ["NE-021"],
    files: [
      "src/DevStudio/DevStudio.jsx",
      "src/utils/conversationLog.js",
      "docs/conversation_log_draft_format_v0_1.md"
    ],
    acceptance: [
      "会話ログテキストを貼り付けてparseできる",
      "話者名と🔊本文をtalk tupleへ変換できる",
      "【Scene】/【bg】/【tags】/【choice】をscenario_oneshotへ変換できる",
      "変換後scenario_oneshotをコピーできる"
    ]
  },
  {
    id: "NE-023",
    title: "会話画面にLog / Auto / Skip UIを追加",
    status: "done",
    priority: "P1",
    phase: "engine",
    area: "conversation-ui",
    depends_on: ["NE-020", "NE-021"],
    files: [
      "src/App.jsx",
      "src/screens/20_Novel/NovelScreen.jsx",
      "src/index.css"
    ],
    acceptance: [
      "Novel画面上部にLog / Auto / Skipを表示する",
      "右上のBGM ON / current track表示を外す",
      "Logは現在Sceneの会話ログをconsole prefix付きで確認できる",
      "Auto / Skipは将来実装のためのUI足場として押せる状態にする"
    ]
  },
  {
    id: "NE-024",
    title: "novelEngine_tags.md共有資料とTags欄を追加",
    status: "done",
    priority: "P1",
    phase: "scenario",
    area: "tag-dictionary",
    depends_on: ["NE-018", "NE-021"],
    files: [
      "docs/novelEngine_tags.md",
      "docs/tag_dictionary_v0_1.json",
      "src/DevStudio/DevStudio.jsx",
      "src/DevStudio/DevStudio.css"
    ],
    acceptance: [
      "AIと人間が参照できるnovelEngine_tags.mdを作成する",
      "DevStudioにTagsタブを追加する",
      "MDとJSONをコピーできる",
      "カテゴリ別tag一覧と実行順をDevStudioで確認できる"
    ]
  },
  {
    id: "NE-025",
    title: "2D_SRPGStudio Visual Asset Scaffoldを追加",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "srpg-studio",
    depends_on: ["NE-024"],
    files: [
      "src/TitleGameStudio/srpgStudioData.js",
      "src/DevStudio/DevStudio.jsx",
      "src/DevStudio/DevStudio.css",
      "docs/2d_srpgstudio_visual_asset_scaffold_2026-06-21.md",
      "public/reference/srpg-upnote"
    ],
    acceptance: [
      "UpNoteのSRPG参照画像をDevStudio上で確認できる",
      "各画面をScreen Layout / Layerで整理できる",
      "UI / Object / Background / Character / FXの必要素材一覧を確認できる",
      "各素材の生成プロンプトをCopyできる",
      "SRPGエンジン本体ではなく見た目と素材準備にscopeを限定する"
    ]
  },
  {
    id: "NE-026",
    title: "2D_SRPGStudioに画面別Galleryと修正依頼ログを追加",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "srpg-studio",
    depends_on: ["NE-025"],
    files: [
      "src/TitleGameStudio/srpgStudioData.js",
      "src/DevStudio/DevStudio.jsx",
      "src/DevStudio/DevStudio.css",
      "docs/2d_srpgstudio_visual_asset_scaffold_2026-06-21.md"
    ],
    acceptance: [
      "Map / Conversation / Battleなど画面別にGallery表示できる",
      "画像クリックでポップアップ表示できる",
      "左右ボタンで次/前の画像へ移動できる",
      "画像ごとのコメントをlocalStorageへ保存できる",
      "コメントを修正依頼ログとして蓄積し、MarkdownでCopyできる"
    ]
  },
  {
    id: "NE-027",
    title: "SRPG runtime manifestとframe仮定義を追加",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "srpg-runtime",
    depends_on: ["NE-025", "NE-026"],
    files: [
      "src/TitleGameStudio/srpgStudioData.js",
      "src/DevStudio/DevStudio.jsx",
      "src/DevStudio/DevStudio.css",
      "public/assets/srpg/srpg_runtime_manifest_v0_1.json"
    ],
    acceptance: [
      "Map / Conversation / Battleのlayer構成をmanifest化する",
      "Player walk / battle sprite sheetの仮gridとanimation名を定義する",
      "DevStudioでRuntime Manifestを確認できる",
      "Runtime JSONをCopyできる",
      "SRPGエンジン側から読めるpublic JSONとして保存する"
    ]
  },
  {
    id: "TT-NE-WS-001",
    title: "旧ImageStudio資料をnovelEngine用に再整理",
    status: "done",
    priority: "P1",
    phase: "devstudio",
    area: "asset-workshop",
    depends_on: ["NE-014", "NE-015"],
    files: [
      "docs/devstudio_asset_workshop_plan_2026-06-20.md",
      "C:/202604_claude_workspace/100_gamecollection/Document/studio/Opus_WorkSpace/ImageStudio_v1.0",
      "C:/202604_claude_workspace/100_gamecollection/src/parts/image-studio"
    ],
    acceptance: [
      "旧ImageStudioのStyleSheet / PromptSlot / OrderSheet / GenerationHistoryの考え方を整理する",
      "React/Zustandコードは丸ごと移植しない方針を明記する",
      "novelEngine DevStudioで使うWorkshop構成案を資料化する"
    ]
  },
  {
    id: "TT-NE-WS-002",
    title: "Asset Workshop用フォルダとCharacter DBの処理パスを作る",
    status: "done",
    priority: "P1",
    phase: "asset",
    area: "asset-workshop",
    depends_on: ["NE-013", "NE-015"],
    files: [
      "public/assets/packs/fantasy_novel_default/characters_raw",
      "public/assets/packs/fantasy_novel_default/characters_demo",
      "public/assets/packs/fantasy_novel_default/characters_cutout",
      "src/data/library/dev_library.default.json",
      "src/utils/assets.js"
    ],
    acceptance: [
      "characters_raw / characters_demo / characters_cutout を分ける",
      "Character DBに demoPath / cutoutPath / processingStatus を持たせる",
      "Runtime表示は cutoutPath -> demoPath -> assetPath の順で解決する",
      "2026-06-21: Report確認済み。仮データ再生テスト側の完了と合わせてdoneへ移動"
    ]
  },
  {
    id: "TT-NE-WS-003",
    title: "Character Workshop UI scaffoldを作る",
    status: "in_progress",
    priority: "P1",
    phase: "devstudio",
    area: "asset-workshop",
    depends_on: ["TT-NE-WS-001", "TT-NE-WS-002"],
    files: [
      "src/DevStudio/DevStudio.jsx",
      "src/DevStudio/DevStudio.css",
      "src/DevStudio/AssetWorkshop/AssetWorkshop.jsx",
      "src/DevStudio/AssetWorkshop/AssetWorkshop.css",
      "src/DevStudio/AssetWorkshop/assetWorkshopData.js"
    ],
    acceptance: [
      "DevStudioにWorkshop導線を追加する",
      "Character DBをraw / demo / cutoutの比較カードで確認できる",
      "processingStatus、manualRequired、alphaCheckをUI上で読める",
      "最初はファイル書き込みをせず、表示とJSONコピーだけにする"
    ]
  },
  {
    id: "TT-NE-WS-004",
    title: "Background Workshop UI scaffoldを作る",
    status: "todo",
    priority: "P2",
    phase: "devstudio",
    area: "asset-workshop",
    depends_on: ["TT-NE-WS-003"],
    files: [
      "src/DevStudio/AssetWorkshop/AssetWorkshop.jsx",
      "src/data/assetWorkshop/style_sheets.default.json",
      "src/data/assetWorkshop/prompt_slots.default.json",
      "public/assets/packs/fantasy_novel_default/backgrounds_raw",
      "public/assets/packs/fantasy_novel_default/backgrounds_processed"
    ],
    acceptance: [
      "背景素材をraw / processedで分けて表示できる",
      "PC横 / Android縦 / Safe Area previewの確認枠を持つ",
      "明度、ぼかし、dialogue contrastの確認項目を表示する",
      "本番背景差し替え前のpending / accepted / rejected状態を持つ"
    ]
  },
  {
    id: "TT-NE-WS-005",
    title: "Character alpha / Background検査scriptを作る",
    status: "todo",
    priority: "P1",
    phase: "asset",
    area: "asset-workshop",
    depends_on: ["TT-NE-WS-002"],
    files: [
      "scripts/check-character-alpha.mjs",
      "scripts/check-background-assets.mjs",
      "package.json"
    ],
    acceptance: [
      "Character PNGのhasAlpha、transparentRatio、semiTransparentRatioを出す",
      "市松模様残りや外周不透明の疑いをwarningとして出す",
      "Backgroundの存在、解像度、比率、容量を確認する",
      "検査結果をDevStudioに貼れるJSON形式で出せる"
    ]
  },
  {
    id: "TT-NE-WS-006",
    title: "cutoutPath優先のRuntime fallbackを確定する",
    status: "todo",
    priority: "P1",
    phase: "engine",
    area: "runtime-assets",
    depends_on: ["TT-NE-WS-002", "TT-NE-WS-005"],
    files: [
      "src/utils/assets.js",
      "src/data/library/dev_library.default.json",
      "src/screens/20_Novel/NovelScreen.jsx",
      "docs/devstudio_character_asset_layer_rules_2026-06-20.md"
    ],
    acceptance: [
      "RuntimeはcutoutPath -> demoPath -> assetPathの順で表示候補を解決する",
      "demo画像は背景状態の確認用として残せる",
      "本番差し替え時はCharacter / Objectのみ透過PNGを優先する",
      "未加工素材はprocessingStatusで止め、誤って本番採用しない"
    ]
  },
  {
    id: "TT-NE-WS-007",
    title: "Asset Workshop結果をReport化してKanban reviewへ渡す",
    status: "todo",
    priority: "P2",
    phase: "publish",
    area: "report",
    depends_on: ["TT-NE-WS-003", "TT-NE-WS-004", "TT-NE-WS-005", "TT-NE-WS-006"],
    files: [
      "docs/devstudio_asset_workshop_plan_2026-06-20.md",
      "C:/00_master/DevApps/kanban_June/docs",
      "C:/00_master/DevApps/kanban_June/docs/report_access_index_2026-06-18.md"
    ],
    acceptance: [
      "実装したWorkshop機能を短いReportに残す",
      "未完了の素材処理と手動工房が必要な項目を分ける",
      "再利用できる作業をWorkflow / Command / Template候補として書く",
      "Kanban_June側では必要なものだけTaskTicket化できる状態にする"
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
  },
  {
    id: "KN-004",
    title: "Conversation Log下書き形式",
    body: [
      "## 目的",
      "Noteで作る会話ログと、NovelEngineのscenario_oneshot納品をつなぐ。",
      "",
      "## 基本形",
      "```text",
      "【Scene】村入口の夜",
      "【bg】bg_village_gate_night",
      "【tags】bgm_tension_low, fx_fog_slow, cam_slow_zoom",
      "",
      "ミア",
      "🔊 また魔物の足音が近づいてる…",
      "",
      "主人公",
      "🔊 門はもたない。けど、まだ直せる。",
      "【tags】face_serious, se_hammer_light",
      "```",
      "",
      "## 変換",
      "- conversation_log text",
      "- scenario_oneshot",
      "- scenario_main",
      "",
      "詳細: docs/conversation_log_draft_format_v0_1.md"
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
