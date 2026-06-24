import { createMemo, createSignal, For, Show, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";
import { animate } from "motion";
import {
  DEVSTUDIO_PROJECT,
  ENGINE_TICKETS,
  KNOWLEDGE_NOTES,
  PHASE_LABELS,
  SAMPLE_JSON,
  STATUSES,
  STATUS_LABELS
} from "./devStudioData";
import scenario from "../data/scenario/scenario_main.json";
import defaultLibrary from "../data/library/dev_library.default.json";
import scenarioDeliverySchema from "../../docs/scenario_delivery_schema.schema.json";
import scenarioOneShotSchema from "../../docs/scenario_oneshot.schema.json";
import tagDictionary from "../../docs/tag_dictionary_v0_1.json";
import novelEngineTagsMd from "../../docs/novelEngine_tags.md?raw";
import { resolveAssetPath } from "../utils/assets";
import { categorizeScenarioTags, getScenarioStats, validateScenario } from "../utils/scenario";
import { convertOneShotToScenarioMain, inspectOneShot } from "../utils/scenarioOneShot";
import "./DevStudio.css";

const INBOX_KEY = "devstudio_inbox_solidjs_novel_engine";
const DEV_LIBRARY_KEY = "devstudio_library_solidjs_novel_engine";

const FUTURE_BLACKSMITH_ONESHOT_SAMPLE = {
  meta: {
    format: "scenario_oneshot",
    version: "0.1",
    title: "未来を打ち直す鍛冶屋",
    episode: 1,
    source: "chatgpt"
  },
  scenes: [
    {
      id: "sc_001",
      title: "村入口の夜",
      bg: "bg_village_gate_night",
      characters: [
        { id: "char_blacksmith_boy", face: "face_normal", slot: "left" },
        { id: "char_mia", face: "face_worried", slot: "right" }
      ],
      talk: [
        ["ミア", "また魔物の足音が近づいてる…"],
        ["主人公", "門はもたない。けど、まだ直せる。", ["face_serious", "se_hammer_light"]],
        ["ミア", "戦うの？"],
        ["主人公", "違う。守る道具を作るんだ。"]
      ],
      choice: {
        id: "choice_001",
        text: "主人公は何を優先する？",
        options: [
          {
            label: "壊れた門を補強する",
            next: "sc_002",
            setFlags: ["flag_gate_repaired"],
            tags: ["ev_repair_gate", "se_hammer_heavy"]
          },
          {
            label: "ミアを偵察に向かわせる",
            next: "sc_003",
            setFlags: ["flag_mia_scout"],
            tags: ["ev_mia_scout", "se_footstep_fast"]
          }
        ]
      },
      tags: ["bgm_tension_low", "fx_fog_slow", "cam_slow_zoom"]
    },
    {
      id: "sc_002",
      title: "打ち直された門",
      bg: "bg_village_gate_night",
      characters: [{ id: "char_blacksmith_boy", face: "face_determined", slot: "center" }],
      talk: [
        ["主人公", "武器じゃなくても、誰かを守れる。"],
        ["主人公", "父さんの炉は、そのためにあるんだ。", ["fx_spark_small"]]
      ],
      tags: ["flag_gate_repaired", "bgm_hope_small", "se_fire_crackle"]
    },
    {
      id: "sc_003",
      title: "闇に走るミア",
      bg: "bg_forest_edge_night",
      characters: [{ id: "char_mia", face: "face_serious", slot: "center" }],
      talk: [
        ["ミア", "匂いが二つ…正面は囮だ。"],
        ["ミア", "本隊は森の裏から来てる！", ["face_surprised", "se_alert"]]
      ],
      tags: ["flag_mia_scout", "bgm_danger", "fx_shadow_move"]
    }
  ],
  assetPrompts: {
    bg_village_gate_night:
      "warm dark fantasy anime background, small medieval village gate at night, damaged wooden gate, mist, lantern light, cinematic composition, high detail, 16:9",
    bg_forest_edge_night:
      "warm dark fantasy anime background, edge of a dark forest near a village, moonlight, fog, suspicious shadows between trees, high detail, 16:9",
    char_blacksmith_boy:
      "warm fantasy anime character, young blacksmith boy, demi-human blood hint, simple work clothes, leather apron, short messy hair, determined eyes, full body, transparent background",
    char_mia:
      "warm fantasy anime character, cheerful scout girl, agile, short cloak, light leather gear, sharp eyes, slightly catlike sense impression, full body, transparent background"
  }
};

const DEV_LIBRARY_SCHEMA_DRAFT = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://local.solidjs-novel-engine/schema/dev_library_default.draft.schema.json",
  title: "DevLibrary Draft Schema",
  description:
    "DevStudioが参照する制作DB。scenario_main.jsonとは分離し、素材、Character DB、Location DB、AssetOrder、LayoutPresetを管理する。",
  type: "object",
  required: ["meta", "characters", "locations", "assetOrder"],
  properties: {
    meta: {
      type: "object",
      required: ["id", "version", "format", "purpose"],
      properties: {
        id: { type: "string" },
        version: { type: "string" },
        format: { type: "string", const: "one_json_dev_library" },
        purpose: { type: "string" },
        lastTaskTicket: { type: "string" }
      }
    },
    layoutPresets: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["width", "height", "safeArea"],
        properties: {
          width: { type: "integer" },
          height: { type: "integer" },
          safeArea: { type: "object" },
          dialogueBox: { type: "object" },
          characterSlots: { type: "object" }
        }
      }
    },
    assetPacks: { type: "array", items: { type: "object" } },
    characters: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "name", "tags"],
        properties: {
          id: { type: "string", pattern: "^char_[a-zA-Z0-9_]+$" },
          name: { type: "string" },
          role: { type: "string" },
          description: { type: "string" },
          defaultFace: { type: "string" },
          assetPath: { type: "string" },
          demoPath: { type: "string" },
          cutoutPath: { type: "string" },
          processingStatus: { type: "string" },
          assetProcessing: { $ref: "#/$defs/assetProcessing" },
          assetSlots: { type: "object" },
          faceAssets: { type: "array", items: { type: "object" } },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    },
    locations: { type: "array", items: { type: "object" } },
    assetOrder: { type: "object" },
    assetPathPolicy: { type: "object" }
  },
  $defs: {
    assetProcessing: {
      type: "object",
      required: ["demoPath", "cutoutPath", "processingStatus"],
      properties: {
        rawPath: { type: "string" },
        demoPath: { type: "string" },
        cutoutPath: { type: "string" },
        processingStatus: {
          type: "string",
          enum: [
            "raw",
            "demo_only",
            "needs_cutout",
            "needs_manual_cutout",
            "cutout_ready",
            "cutout_ready_from_safe"
          ]
        },
        manualRequired: { type: "boolean" },
        notes: { type: "string" }
      }
    }
  }
};

const ASSET_WORKSHOP_SCHEMA_DRAFT = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://local.solidjs-novel-engine/schema/asset_workshop_order.draft.schema.json",
  title: "Asset Workshop Order Draft Schema",
  description:
    "DevStudio Asset Workshopで使う発注、検査、採用判断の候補schema。生成API連携前の手動/半自動運用を前提にする。",
  type: "object",
  required: ["meta", "target", "prompt", "output"],
  properties: {
    meta: {
      type: "object",
      required: ["id", "kind", "createdAt"],
      properties: {
        id: { type: "string" },
        kind: { type: "string", enum: ["character", "background", "object", "ui"] },
        createdAt: { type: "string" },
        linkedTicket: { type: "string" }
      }
    },
    target: {
      type: "object",
      required: ["assetId", "slot", "layoutProfile"],
      properties: {
        assetId: { type: "string" },
        slot: { type: "string" },
        characterId: { type: "string" },
        locationId: { type: "string" },
        layoutProfile: { type: "string", enum: ["pcLandscape", "androidPortrait"] }
      }
    },
    prompt: {
      type: "object",
      required: ["styleSheetId", "positive"],
      properties: {
        styleSheetId: { type: "string" },
        positive: { type: "string" },
        negative: { type: "string" },
        referencePaths: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      type: "object",
      required: ["rawPath", "status"],
      properties: {
        rawPath: { type: "string" },
        demoPath: { type: "string" },
        cutoutPath: { type: "string" },
        processedPath: { type: "string" },
        status: {
          type: "string",
          enum: ["ordered", "generated", "needs_check", "needs_manual_fix", "accepted", "rejected"]
        },
        alphaCheck: { type: "object" },
        backgroundCheck: { type: "object" }
      }
    }
  }
};

function loadInbox() {
  try {
    return JSON.parse(localStorage.getItem(INBOX_KEY)) || [];
  } catch {
    return [];
  }
}

function saveInbox(items) {
  localStorage.setItem(INBOX_KEY, JSON.stringify(items));
}

function loadDevLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEV_LIBRARY_KEY));
    if (!saved || saved.meta?.version !== defaultLibrary.meta?.version) return defaultLibrary;
    return saved;
  } catch {
    return defaultLibrary;
  }
}

function saveDevLibrary(value) {
  localStorage.setItem(DEV_LIBRARY_KEY, JSON.stringify(value));
}

function readJson(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function renderMiniMarkdown(text) {
  return text.split("\n").map((line) => {
    if (line.startsWith("## ")) return { type: "h2", text: line.slice(3) };
    if (line.startsWith("### ")) return { type: "h3", text: line.slice(4) };
    if (line.startsWith("- ")) return { type: "li", text: line.slice(2) };
    if (line.trim() === "") return { type: "space", text: "" };
    return { type: "p", text: line };
  });
}

async function copyText(text) {
  const value = String(text ?? "");
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the textarea copy path for browsers that block Clipboard API.
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyButton(props) {
  const [status, setStatus] = createSignal("idle");
  const label = createMemo(() => {
    if (status() === "copied") return "Copied";
    if (status() === "failed") return "Copy failed";
    return props.label ?? "Copy";
  });

  async function handleCopy() {
    const ok = await copyText(typeof props.text === "function" ? props.text() : props.text);
    setStatus(ok ? "copied" : "failed");
    window.setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <button
      type="button"
      classList={{ copied: status() === "copied", failed: status() === "failed" }}
      onClick={handleCopy}
    >
      {label()}
    </button>
  );
}

function HeaderTabs(props) {
  const tabs = [
    ["dashboard", "Dashboard"],
    ["tickets", "Tickets"],
    ["scenario", "Scenario"],
    ["intake", "Intake"],
    ["tags", "Tags"],
    ["library", "Library"],
    ["schemas", "Schemas"],
    ["knowledge", "Knowledge"],
    ["inbox", "InBox"],
    ["lab", "SVG Lab"]
  ];

  return (
    <header class="ds-header">
      <div>
        <p class="ds-kicker">{DEVSTUDIO_PROJECT.phase}</p>
        <h1>
          <span>{DEVSTUDIO_PROJECT.name}</span>
          <small>DevStudio</small>
        </h1>
      </div>
      <nav class="ds-tabs" aria-label="DevStudio sections">
        <For each={tabs}>
          {([id, label]) => (
            <button
              classList={{ active: props.active() === id }}
              onClick={() => props.setActive(id)}
              type="button"
            >
              {label}
            </button>
          )}
        </For>
      </nav>
    </header>
  );
}

function SvgMeter(props) {
  let arcRef;
  const circumference = 2 * Math.PI * 42;

  onMount(() => {
    const target = circumference * (1 - props.value() / 100);
    animate(
      arcRef,
      { strokeDashoffset: [circumference, target] },
      { duration: 0.9, easing: "ease-out" }
    );
  });

  return (
    <div class="meter">
      <svg viewBox="0 0 120 120" role="img" aria-label={`${props.label} ${props.value()}%`}>
        <circle class="meter-track" cx="60" cy="60" r="42" />
        <circle
          ref={arcRef}
          class="meter-arc"
          cx="60"
          cy="60"
          r="42"
          stroke-dasharray={circumference}
          stroke-dashoffset={circumference}
        />
        <text x="60" y="56" text-anchor="middle" class="meter-value">
          {props.value()}%
        </text>
        <text x="60" y="74" text-anchor="middle" class="meter-caption">
          {props.label}
        </text>
      </svg>
    </div>
  );
}

function Dashboard(props) {
  const doneRate = createMemo(() => {
    const done = props.tickets().filter((t) => t.status === "done").length;
    return Math.round((done / props.tickets().length) * 100);
  });

  const phaseCounts = createMemo(() => {
    const counts = {};
    for (const phase of Object.keys(PHASE_LABELS)) {
      const list = props.tickets().filter((t) => t.phase === phase);
      counts[phase] = {
        total: list.length,
        done: list.filter((t) => t.status === "done").length
      };
    }
    return counts;
  });

  const nextTickets = createMemo(() =>
    props
      .tickets()
      .filter((t) => t.status !== "done")
      .slice(0, 5)
  );

  return (
    <section class="ds-grid">
      <div class="panel hero-panel">
        <div>
          <p class="ds-kicker">Current Goal</p>
          <h2>OneJson Engine制作TODO</h2>
          <p>{DEVSTUDIO_PROJECT.purpose}</p>
        </div>
        <SvgMeter label="Done" value={doneRate} />
      </div>

      <div class="panel">
        <h2>Phase Progress</h2>
        <div class="phase-list">
          <For each={Object.entries(phaseCounts())}>
            {([phase, count]) => (
              <div class="phase-row">
                <span>{PHASE_LABELS[phase]}</span>
                <div class="phase-bar">
                  <i style={{ width: `${count.total ? (count.done / count.total) * 100 : 0}%` }} />
                </div>
                <code>
                  {count.done}/{count.total}
                </code>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="panel">
        <h2>Next Tickets</h2>
        <div class="next-list">
          <For each={nextTickets()}>
            {(ticket) => <TicketMini ticket={ticket} onOpen={props.setSelectedTicket} />}
          </For>
        </div>
      </div>
    </section>
  );
}

function TicketMini(props) {
  return (
    <button class="ticket-mini" type="button" onClick={() => props.onOpen(props.ticket)}>
      <span>{props.ticket.id}</span>
      <b>{props.ticket.title}</b>
      <em>{PHASE_LABELS[props.ticket.phase]}</em>
    </button>
  );
}

function TicketsBoard(props) {
  const grouped = createMemo(() =>
    STATUSES.map((status) => ({
      status,
      tickets: props.tickets().filter((ticket) => ticket.status === status)
    }))
  );

  return (
    <section class="kanban">
      <For each={grouped()}>
        {(column) => (
          <div class={`kanban-column ${column.status}`}>
            <div class="column-head">
              <h2>{STATUS_LABELS[column.status]}</h2>
              <code>{column.tickets.length}</code>
            </div>
            <For each={column.tickets}>
              {(ticket) => (
                <article class="task-card" onClick={() => props.setSelectedTicket(ticket)}>
                  <div class="task-id">{ticket.id}</div>
                  <h3>{ticket.title}</h3>
                  <div class="badges">
                    <span class={`badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                    <span class="badge phase">{PHASE_LABELS[ticket.phase]}</span>
                    <span class="badge area">{ticket.area}</span>
                  </div>
                </article>
              )}
            </For>
          </div>
        )}
      </For>
    </section>
  );
}

function KnowledgeView() {
  return (
    <section class="knowledge-layout">
      <div class="panel">
        <h2>Markdown Notes</h2>
        <For each={KNOWLEDGE_NOTES}>
          {(note) => (
            <article class="md-card">
              <div class="md-head">
                <span>{note.id}</span>
                <CopyButton label="Copy md" text={note.body} />
              </div>
              <h3>{note.title}</h3>
              <div class="md-body">
                <For each={renderMiniMarkdown(note.body)}>
                  {(line) => (
                    <Dynamic
                      component={line.type === "h2" ? "h4" : line.type === "li" ? "li" : "p"}
                      class={line.type}
                    >
                      {line.text}
                    </Dynamic>
                  )}
                </For>
              </div>
            </article>
          )}
        </For>
      </div>
      <JsonBlock title="scenario_main.json sample" value={SAMPLE_JSON} />
    </section>
  );
}

function JsonBlock(props) {
  const json = createMemo(() => JSON.stringify(props.value, null, 2));
  return (
    <div class="panel code-panel">
      <div class="code-head">
        <h2>{props.title}</h2>
        <CopyButton label="Copy JSON" text={json} />
      </div>
      <pre>
        <code>{json()}</code>
      </pre>
    </div>
  );
}

function SchemaSummaryCard(props) {
  return (
    <article class="schema-summary-card">
      <div>
        <code>{props.kind}</code>
        <h3>{props.title}</h3>
        <p>{props.description}</p>
      </div>
      <span>{props.status}</span>
    </article>
  );
}

function SchemasView() {
  const scenarioOneShotSample = FUTURE_BLACKSMITH_ONESHOT_SAMPLE;

  const scenarioCompact = createMemo(() => ({
    meta: scenario.meta,
    title: scenario.title,
    engine: scenario.engine,
    initialState: scenario.initialState,
    sceneShape: {
      id: "scene_forest_entrance",
      scene: "森入口",
      phase: "PLAYING",
      tags: ["bg_forest_entrance", "mood_lonely", "bgm_forest"],
      talk: [
        {
          id: "talk_001",
          speaker: "騎士",
          text: "ここが魔女の森か……。",
          tags: ["char_knight", "face_knight_serious"]
        }
      ],
      next: "scene_forest_deep"
    }
  }));

  const devLibraryCompact = createMemo(() => ({
    meta: defaultLibrary.meta,
    layoutPresets: defaultLibrary.layoutPresets,
    assetPathPolicy: defaultLibrary.assetPathPolicy,
    characterShape: {
      id: "char_knight",
      name: "騎士",
      defaultFace: "face_knight_serious",
      assetPath: "/assets/packs/fantasy_novel_default/characters_cutout/char_knight_neutral_safe.png",
      demoPath: "/assets/packs/fantasy_novel_default/characters_demo/char_knight_neutral_safe.png",
      cutoutPath: "/assets/packs/fantasy_novel_default/characters_cutout/char_knight_neutral_safe.png",
      processingStatus: "cutout_ready_from_safe",
      assetSlots: {
        standing: {
          default: "standing_knight_neutral",
          items: [
            {
              id: "standing_knight_neutral",
              variant: "neutral",
              path: "/assets/packs/fantasy_novel_default/characters_cutout/char_knight_neutral_safe.png",
              demoPath: "/assets/packs/fantasy_novel_default/characters_demo/char_knight_neutral_safe.png",
              cutoutPath: "/assets/packs/fantasy_novel_default/characters_cutout/char_knight_neutral_safe.png"
            }
          ]
        }
      }
    },
    assetOrderShape: {
      TITLE: {
        BGM: {
          id: "asset_bgm_title_theme",
          fileName: "Unnamed Memory ～新たな歴史へ〜.mp3",
          path: "/assets/sound/bgm/Unnamed Memory/Unnamed Memory ～新たな歴史へ〜.mp3",
          kind: "bgm",
          status: "copied"
        }
      }
    }
  }));

  const assetProcessingExample = {
    assetProcessing: {
      rawPath: "/assets/packs/fantasy_novel_default/characters_raw/char_knight_neutral.png",
      demoPath: "/assets/packs/fantasy_novel_default/characters_demo/char_knight_neutral_demo.png",
      cutoutPath: "/assets/packs/fantasy_novel_default/characters_cutout/char_knight_neutral_cutout.png",
      processingStatus: "needs_manual_cutout",
      alphaCheck: {
        hasAlpha: true,
        transparentRatio: 0.1489,
        semiTransparentRatio: 0,
        edgeOpaqueWarning: true,
        checkerboardSuspected: true
      },
      manualRequired: true,
      notes: "市松模様が焼き込まれている場合は手動確認に回す"
    }
  };

  return (
    <section class="schemas-layout">
      <div class="panel schema-intro">
        <p class="ds-kicker">Schema Registry</p>
        <h2>NovelEngine JSON / Schema 一元管理</h2>
        <p>
          現在のノベルエンジンで使う再生JSON、制作DB、素材処理候補schemaをここで確認します。
          コードブロックはすべてコピーできます。
        </p>
        <div class="schema-summary-grid">
          <SchemaSummaryCard
            kind="draft"
            title="scenario_oneshot.json"
            description="ChatGPT、kanban-note01、人間から受ける下書き/納品入口。DevStudioでscenario_mainへ変換する。"
            status="adopted"
          />
          <SchemaSummaryCard
            kind="runtime"
            title="scenario_main.json"
            description="Engineが直接読むOneJson。Title、Scene、Talk、tagsを持つ。"
            status="active"
          />
          <SchemaSummaryCard
            kind="schema"
            title="scenario_delivery_schema"
            description="シナリオAI納品用の正式schema。"
            status="active"
          />
          <SchemaSummaryCard
            kind="library"
            title="dev_library.default.json"
            description="Character DB、背景、BGM、AssetOrder、LayoutPresetを管理する制作DB。"
            status="active"
          />
          <SchemaSummaryCard
            kind="dictionary"
            title="tag_dictionary_v0_1"
            description="AIと人間が共通で使う演出tag辞書。bgm、se、bg、char、face、fx、camなどを管理する。"
            status="active"
          />
          <SchemaSummaryCard
            kind="draft"
            title="Asset Workshop Schema"
            description="Character透過、背景加工、生成発注のための候補schema。"
            status="draft"
          />
        </div>
      </div>

      <JsonBlock title="scenario_oneshot.json draft sample" value={scenarioOneShotSample} />
      <JsonBlock title="scenario_oneshot.schema.json" value={scenarioOneShotSchema} />
      <JsonBlock title="scenario_main.json active" value={scenario} />
      <JsonBlock title="scenario_main.json shape sample" value={scenarioCompact()} />
      <JsonBlock title="scenario_delivery_schema.schema.json" value={scenarioDeliverySchema} />
      <JsonBlock title="tag_dictionary_v0_1.json" value={tagDictionary} />
      <JsonBlock title="dev_library.default.json active" value={defaultLibrary} />
      <JsonBlock title="dev_library shape sample" value={devLibraryCompact()} />
      <JsonBlock title="dev_library draft schema" value={DEV_LIBRARY_SCHEMA_DRAFT} />
      <JsonBlock title="asset_processing sample" value={assetProcessingExample} />
      <JsonBlock title="asset_workshop_order draft schema" value={ASSET_WORKSHOP_SCHEMA_DRAFT} />
    </section>
  );
}

function ScenarioView() {
  const stats = createMemo(() => getScenarioStats(scenario));
  const validation = createMemo(() => validateScenario(scenario));
  const categories = createMemo(() => categorizeScenarioTags(scenario));
  const categoryLabels = {
    bg: "Background",
    char: "Character",
    face: "Face",
    cg: "CG",
    bgm: "BGM",
    se: "SE",
    fx: "FX",
    mood: "Mood",
    flag: "Flag",
    ev: "Event",
    memo: "Memo",
    ui: "UI",
    other: "Other"
  };

  return (
    <section class="scenario-layout">
      <div class="panel scenario-summary">
        <p class="ds-kicker">scenario_main.json</p>
        <h2>{scenario.title}</h2>
        <div class="stat-grid">
          <div>
            <b>{stats().scenes}</b>
            <span>Scenes</span>
          </div>
          <div>
            <b>{stats().talks}</b>
            <span>Talks</span>
          </div>
          <div>
            <b>{stats().tags}</b>
            <span>Tags</span>
          </div>
          <div>
            <b>{stats().cgHints}</b>
            <span>CG Hints</span>
          </div>
        </div>
        <div class={`validation ${validation().ok ? "ok" : "ng"}`}>
          <b>{validation().ok ? "再生チェック OK" : "要確認"}</b>
          <Show
            when={validation().issues.length}
            fallback={<p>必須の title / scenes / talk / text は揃っています。</p>}
          >
            <ul>
              <For each={validation().issues}>
                {(issue) => <li class={issue.level}>{issue.message}</li>}
              </For>
            </ul>
          </Show>
        </div>
      </div>

      <div class="panel">
        <h2>Scene Index</h2>
        <div class="scene-list">
          <For each={scenario.scenes ?? []}>
            {(scene, index) => (
              <article>
                <code>{scene.id}</code>
                <h3>
                  {index() + 1}. {scene.scene}
                </h3>
                <p>{scene.summary ?? `${scene.talk?.length ?? 0} talks`}</p>
              </article>
            )}
          </For>
        </div>
      </div>

      <div class="panel asset-panel">
        <h2>Asset Tags</h2>
        <div class="asset-category-grid">
          <For each={Object.entries(categories()).filter(([, tags]) => tags.length)}>
            {([category, tags]) => (
              <section>
                <h3>
                  {categoryLabels[category]} <code>{tags.length}</code>
                </h3>
                <div class="tag-list">
                  <For each={tags}>{(tag) => <span>{tag}</span>}</For>
                </div>
              </section>
            )}
          </For>
        </div>
      </div>

      <div class="panel">
        <h2>CG Hints</h2>
        <Show when={scenario.cgHints?.length} fallback={<p class="empty">cgHints は未設定です。</p>}>
          <div class="cg-list">
            <For each={scenario.cgHints}>
              {(hint) => (
                <article>
                  <code>{hint.id}</code>
                  <h3>{hint.label}</h3>
                  <p>{hint.description}</p>
                </article>
              )}
            </For>
          </div>
        </Show>
      </div>
    </section>
  );
}

function ScenarioIntakeView() {
  const [draft, setDraft] = createSignal(JSON.stringify(FUTURE_BLACKSMITH_ONESHOT_SAMPLE, null, 2));
  const parsed = createMemo(() => {
    try {
      return { ok: true, value: JSON.parse(draft()), error: "" };
    } catch (error) {
      return { ok: false, value: null, error: error.message };
    }
  });
  const inspection = createMemo(() =>
    parsed().ok ? inspectOneShot(parsed().value) : { ok: false, issues: [{ level: "error", message: parsed().error }] }
  );
  const converted = createMemo(() => (parsed().ok ? convertOneShotToScenarioMain(parsed().value) : null));
  const assetPromptEntries = createMemo(() => Object.entries(parsed().value?.assetPrompts ?? {}));

  function resetSample() {
    setDraft(JSON.stringify(FUTURE_BLACKSMITH_ONESHOT_SAMPLE, null, 2));
  }

  return (
    <section class="intake-layout">
      <div class="panel intake-intro">
        <p class="ds-kicker">Scenario Intake</p>
        <h2>scenario_oneshot 受け入れ</h2>
        <p>
          ChatGPT、kanban-note01、人間から届く下書きJSONを貼り付けて、Engine用の
          scenario_main draftへ変換します。ここではまだファイル保存せず、確認とコピーだけ行います。
        </p>
        <div class={`validation ${inspection().ok ? "ok" : "ng"}`}>
          <b>{inspection().ok ? "scenario_oneshot parse OK" : "要確認"}</b>
          <Show when={inspection().issues.length} fallback={<p>最低限のmeta / scenes / talkは揃っています。</p>}>
            <ul>
              <For each={inspection().issues}>
                {(issue) => <li class={issue.level}>{issue.message}</li>}
              </For>
            </ul>
          </Show>
        </div>
      </div>

      <div class="panel intake-editor">
        <div class="code-head">
          <h2>Paste scenario_oneshot.json</h2>
          <div>
            <CopyButton label="Copy" text={draft} />
            <button type="button" onClick={resetSample}>Sample</button>
          </div>
        </div>
        <textarea value={draft()} onInput={(event) => setDraft(event.currentTarget.value)} />
      </div>

      <Show when={converted()}>
        {(scenarioDraft) => (
          <>
            <JsonBlock title="converted scenario_main draft" value={scenarioDraft()} />
            <div class="panel">
              <h2>Asset Prompts</h2>
              <Show when={assetPromptEntries().length} fallback={<p class="empty">assetPrompts は未設定です。</p>}>
                <div class="asset-prompt-list">
                  <For each={assetPromptEntries()}>
                    {([key, value]) => (
                      <article>
                        <code>{key}</code>
                        <p>{value}</p>
                      </article>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </>
        )}
      </Show>
    </section>
  );
}

function TagsView() {
  const groups = createMemo(() => Object.entries(tagDictionary.groups ?? {}));
  const total = createMemo(() =>
    groups().reduce((sum, [, group]) => sum + Object.keys(group.items ?? {}).length, 0)
  );

  return (
    <section class="tags-layout">
      <div class="panel tags-intro">
        <p class="ds-kicker">Tag Dictionary</p>
        <h2>NovelEngine TAG一覧</h2>
        <p>
          AIと人間が共通で使う演出辞書です。Noteからの指示、conversation_log、
          scenario_oneshot、scenario_mainのtag指定はこの一覧を基準にします。
        </p>
        <div class="tag-dictionary-stats">
          <div>
            <b>{groups().length}</b>
            <span>Groups</span>
          </div>
          <div>
            <b>{total()}</b>
            <span>Tags</span>
          </div>
          <div>
            <b>{tagDictionary.meta?.version}</b>
            <span>Version</span>
          </div>
        </div>
        <div class="code-head tag-doc-actions">
          <h2>Shared Documents</h2>
          <div>
            <CopyButton label="Copy MD" text={novelEngineTagsMd} />
            <CopyButton label="Copy JSON" text={() => JSON.stringify(tagDictionary, null, 2)} />
          </div>
        </div>
      </div>

      <div class="panel tag-order-panel">
        <h2>Execution Order</h2>
        <div class="tag-prefix-row">
          <For each={tagDictionary.meta?.executionOrder ?? []}>
            {(prefix) => <span>{prefix}</span>}
          </For>
        </div>
      </div>

      <div class="panel tag-md-panel">
        <div class="code-head">
          <h2>novelEngine_tags.md</h2>
          <CopyButton label="Copy MD" text={novelEngineTagsMd} />
        </div>
        <pre>{novelEngineTagsMd}</pre>
      </div>

      <div class="panel tag-groups-panel">
        <h2>Tag Groups</h2>
        <div class="tag-group-grid">
          <For each={groups()}>
            {([groupId, group]) => (
              <article class="tag-group-card">
                <div class="tag-group-head">
                  <div>
                    <code>{group.prefix}</code>
                    <h3>{groupId}</h3>
                  </div>
                  <span>{Object.keys(group.items ?? {}).length}</span>
                </div>
                <div class="tag-table">
                  <For each={Object.entries(group.items ?? {})}>
                    {([tag, label]) => (
                      <div>
                        <code>{tag}</code>
                        <span>{label}</span>
                      </div>
                    )}
                  </For>
                </div>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}

function countAssets(assetOrder) {
  return Object.values(assetOrder ?? {}).reduce((total, group) => total + Object.keys(group ?? {}).length, 0);
}

function AssetPreview(props) {
  return (
    <Show when={props.path}>
      <figure class={props.variant === "wide" ? "asset-preview wide" : "asset-preview"}>
        <img src={props.path} alt={props.label ?? "asset preview"} loading="lazy" />
      </figure>
    </Show>
  );
}

function getStandingItems(character) {
  if (character.assetSlots?.standing?.items?.length) return character.assetSlots.standing.items;
  return Object.entries(character.standingAssets ?? {}).map(([variant, path]) => ({
    id: `standing_${character.id}_${variant}`,
    label: variant,
    variant,
    path
  }));
}

function getFaceIconItems(character) {
  if (character.assetSlots?.faceIcons?.items?.length) return character.assetSlots.faceIcons.items;
  return (character.faceAssets ?? []).map((face) => ({
    id: face.id,
    label: face.label,
    variant: face.standingVariant,
    path: face.iconPath ?? face.path,
    usage: "conversation_log_menu"
  }));
}

function getInitialStandingId(character, standingItems) {
  const configuredDefault = character.assetSlots?.standing?.default;
  if (standingItems.some((item) => item.id === configuredDefault)) return configuredDefault;
  const neutral = standingItems.find((item) => item.variant === "neutral");
  return neutral?.id ?? standingItems[0]?.id ?? "";
}

function CharacterDbCard(props) {
  const character = () => props.character;
  const standingItems = createMemo(() => getStandingItems(character()));
  const faceIconItems = createMemo(() => getFaceIconItems(character()));
  const costumeItems = createMemo(() => character().assetSlots?.costumes?.items ?? []);
  const hairstyleItems = createMemo(() => character().assetSlots?.hairstyles?.items ?? []);
  const [selectedStanding, setSelectedStanding] = createSignal(
    getInitialStandingId(character(), standingItems())
  );
  const currentStandingItem = createMemo(() =>
    standingItems().find((item) => item.id === selectedStanding()) ?? standingItems()[0]
  );
  const currentStanding = createMemo(() => resolveAssetPath(currentStandingItem()) || resolveAssetPath(character()));
  const currentIndex = createMemo(() =>
    Math.max(0, standingItems().findIndex((item) => item.id === selectedStanding()))
  );

  function stepStanding(direction) {
    const items = standingItems();
    if (!items.length) return;
    const nextIndex = (currentIndex() + direction + items.length) % items.length;
    setSelectedStanding(items[nextIndex].id);
  }

  return (
    <article class="character-db-card">
      <div class="character-standing-viewer">
        <button
          type="button"
          class="standing-nav prev"
          onClick={() => stepStanding(-1)}
          aria-label={`${character().name}の前の立ち絵`}
        >
          ‹
        </button>
        <AssetPreview
          path={currentStanding()}
          label={`${character().name} ${currentStandingItem()?.variant ?? selectedStanding()}`}
        />
        <button
          type="button"
          class="standing-nav next"
          onClick={() => stepStanding(1)}
          aria-label={`${character().name}の次の立ち絵`}
        >
          ›
        </button>
        <div class="standing-variant-label">
          <span>{currentStandingItem()?.label ?? selectedStanding()}</span>
          <code>{currentStandingItem()?.variant ?? selectedStanding()}</code>
        </div>
      </div>

      <div class="character-db-body">
        <code>{character().id}</code>
        <h3>{character().name}</h3>
        <p>{character().role} / {character().description}</p>

        <section class="asset-slot-section">
          <div class="slot-section-head">
            <h4>Standing Slot</h4>
            <code>{standingItems().length}</code>
          </div>
          <div class="standing-slot-list">
            <For each={standingItems()}>
              {(standing) => (
                <button
                  type="button"
                  classList={{ active: selectedStanding() === standing.id }}
                  onClick={() => setSelectedStanding(standing.id)}
                  title={`${standing.label}: ${standing.id}`}
                >
                  <img src={resolveAssetPath(standing)} alt={standing.label} loading="lazy" />
                  <span>{standing.label}</span>
                  <code>{standing.variant}</code>
                </button>
              )}
            </For>
          </div>
        </section>

        <section class="asset-slot-section">
          <div class="slot-section-head">
            <h4>Face Icon Slot</h4>
            <code>{faceIconItems().length}</code>
          </div>
          <div class="face-icon-row" aria-label={`${character().name}の顔アイコン差分`}>
            <For each={faceIconItems()}>
              {(face) => (
                <article title={`${face.label}: ${face.id}`}>
                  <img src={resolveAssetPath(face)} alt={face.label} loading="lazy" />
                  <span>{face.label}</span>
                  <code>{face.id}</code>
                </article>
              )}
            </For>
          </div>
        </section>

        <section class="asset-slot-section compact">
          <div class="slot-section-head">
            <h4>Costume / Hair Slots</h4>
            <code>{costumeItems().length + hairstyleItems().length}</code>
          </div>
          <div class="future-slot-list">
            <For each={costumeItems()}>
              {(item) => (
                <div>
                  <span>costume</span>
                  <b>{item.label}</b>
                  <code>{item.id}</code>
                </div>
              )}
            </For>
            <For each={hairstyleItems()}>
              {(item) => (
                <div>
                  <span>hair</span>
                  <b>{item.label}</b>
                  <code>{item.id}</code>
                </div>
              )}
            </For>
          </div>
        </section>

        <div class="tag-list">
          <For each={character().tags ?? []}>{(tag) => <span>{tag}</span>}</For>
        </div>
      </div>
    </article>
  );
}

function LibraryView() {
  const [library, setLibrary] = createSignal(loadDevLibrary());
  const [draft, setDraft] = createSignal(JSON.stringify(library(), null, 2));
  const [message, setMessage] = createSignal("Default Libraryを読み込みました。");
  const assetGroups = createMemo(() => Object.entries(library().assetOrder ?? {}));

  function applyDraft() {
    try {
      const next = JSON.parse(draft());
      setLibrary(next);
      saveDevLibrary(next);
      setMessage("Libraryをブラウザ保存しました。");
    } catch (error) {
      setMessage(`JSON parse error: ${error.message}`);
    }
  }

  function resetDraft() {
    setLibrary(defaultLibrary);
    setDraft(JSON.stringify(defaultLibrary, null, 2));
    saveDevLibrary(defaultLibrary);
    setMessage("Default Libraryに戻しました。");
  }

  return (
    <section class="library-layout">
      <div class="panel library-summary">
        <p class="ds-kicker">{library().meta?.format}</p>
        <h2>DevLibrary</h2>
        <p>{library().meta?.purpose}</p>
        <div class="stat-grid">
          <div>
            <b>{library().characters?.length ?? 0}</b>
            <span>Characters</span>
          </div>
          <div>
            <b>{library().locations?.length ?? 0}</b>
            <span>Locations</span>
          </div>
          <div>
            <b>{assetGroups().length}</b>
            <span>Asset Groups</span>
          </div>
          <div>
            <b>{countAssets(library().assetOrder)}</b>
            <span>Assets</span>
          </div>
        </div>
        <p class="library-message">{message()}</p>
      </div>

      <div class="panel character-db-panel">
        <h2>Character DB</h2>
        <div class="library-card-list character-db-list">
          <For each={library().characters ?? []}>
            {(character) => <CharacterDbCard character={character} />}
          </For>
        </div>
      </div>

      <div class="panel">
        <h2>Location DB</h2>
        <div class="library-card-list">
          <For each={library().locations ?? []}>
            {(location) => (
              <article>
                <AssetPreview path={location.assetPath} label={location.name} variant="wide" />
                <code>{location.id}</code>
                <h3>{location.name}</h3>
                <p>{location.description}</p>
                <div class="tag-list">
                  <For each={location.tags ?? []}>{(tag) => <span>{tag}</span>}</For>
                </div>
              </article>
            )}
          </For>
        </div>
      </div>

      <div class="panel asset-panel">
        <h2>Asset Order</h2>
        <div class="asset-category-grid">
          <For each={assetGroups()}>
            {([groupName, assets]) => (
              <section>
                <h3>
                  {groupName} <code>{Object.keys(assets).length}</code>
                </h3>
                <div class="library-asset-list">
                  <For each={Object.entries(assets)}>
                    {([slot, asset]) => (
                      <div>
                        <AssetPreview path={asset.path} label={slot} />
                        <b>{slot}</b>
                        <span>{asset.fileName}</span>
                        <em>{asset.kind} / {asset.status}</em>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            )}
          </For>
        </div>
      </div>

      <div class="panel library-editor">
        <div class="code-head">
          <h2>Editable JSON</h2>
          <div>
            <CopyButton label="Copy" text={draft} />
            <button type="button" onClick={applyDraft}>Apply</button>
            <button type="button" onClick={resetDraft}>Reset</button>
          </div>
        </div>
        <textarea value={draft()} onInput={(event) => setDraft(event.currentTarget.value)} />
      </div>
    </section>
  );
}

function InboxView() {
  const [items, setItems] = createSignal(loadInbox());
  const [type, setType] = createSignal("report");
  const [subject, setSubject] = createSignal("");
  const [body, setBody] = createSignal("");

  function persist(next) {
    setItems(next);
    saveInbox(next);
  }

  function addItem() {
    if (!subject().trim() && !body().trim()) return;
    persist([
      {
        id: Date.now(),
        type: type(),
        subject: subject().trim() || "No subject",
        body: body().trim(),
        createdAt: new Date().toLocaleString("ja-JP"),
        linkedTicket: ""
      },
      ...items()
    ]);
    setSubject("");
    setBody("");
  }

  return (
    <section class="inbox-view">
      <div class="panel inbox-compose">
        <h2>InBox / 受信箱</h2>
        <p>
          プロジェクト外からの報告をメール形式で受け取る思想を残します。将来はtask ticketへの紐付けやagent納品箱にできます。
        </p>
        <div class="form-row">
          <select value={type()} onInput={(e) => setType(e.currentTarget.value)}>
            <option value="report">外部報告</option>
            <option value="asset">素材納品</option>
            <option value="memo">メモ</option>
            <option value="command">コマンド名残</option>
          </select>
          <input
            value={subject()}
            onInput={(e) => setSubject(e.currentTarget.value)}
            placeholder="件名"
          />
        </div>
        <textarea
          value={body()}
          onInput={(e) => setBody(e.currentTarget.value)}
          placeholder="本文。AI報告、素材依頼の返答、気づきなど。"
        />
        <button type="button" onClick={addItem}>
          受信箱に追加
        </button>
      </div>
      <div class="panel inbox-list">
        <h2>Messages</h2>
        <Show when={items().length} fallback={<p class="empty">受信箱は空です。</p>}>
          <For each={items()}>
            {(item) => (
              <article class="mail-card">
                <span>{item.type}</span>
                <h3>{item.subject}</h3>
                <p>{item.body}</p>
                <small>{item.createdAt}</small>
              </article>
            )}
          </For>
        </Show>
      </div>
    </section>
  );
}

function SvgLab() {
  const [value, setValue] = createSignal(68);

  return (
    <section class="lab-layout">
      <div class="panel">
        <h2>SVG Meter Lab</h2>
        <p>MotionOne の `animate()` で SVG stroke を動かす試験場です。</p>
        <SvgMeter label="SVG" value={value} />
        <input
          type="range"
          min="0"
          max="100"
          value={value()}
          onInput={(e) => setValue(Number(e.currentTarget.value))}
        />
      </div>
      <div class="panel">
        <h2>Future Widgets</h2>
        <div class="widget-grid">
          <div>Kanban</div>
          <div>AssetOrder</div>
          <div>Scenario Index</div>
          <div>Agent Reports</div>
        </div>
      </div>
    </section>
  );
}

function TicketModal(props) {
  return (
    <Show when={props.ticket()}>
      <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && props.setTicket(null)}>
        <article class="modal">
          <button type="button" class="modal-close" onClick={() => props.setTicket(null)}>
            Close
          </button>
          <div class="task-id">{props.ticket().id}</div>
          <h2>{props.ticket().title}</h2>
          <p>
            {props.ticket().priority} / {PHASE_LABELS[props.ticket().phase]} /{" "}
            {STATUS_LABELS[props.ticket().status]}
          </p>
          <h3>Files</h3>
          <ul>
            <For each={props.ticket().files}>{(file) => <li>{file}</li>}</For>
          </ul>
          <h3>Acceptance</h3>
          <ul>
            <For each={props.ticket().acceptance}>{(item) => <li>{item}</li>}</For>
          </ul>
        </article>
      </div>
    </Show>
  );
}

export default function DevStudio(props) {
  const [active, setActive] = createSignal(props.initialTab ?? "dashboard");
  const [tickets] = createSignal(ENGINE_TICKETS);
  const [selectedTicket, setSelectedTicket] = createSignal(null);

  const screens = {
    dashboard: Dashboard,
    tickets: TicketsBoard,
    scenario: ScenarioView,
    intake: ScenarioIntakeView,
    tags: TagsView,
    library: LibraryView,
    schemas: SchemasView,
    knowledge: KnowledgeView,
    inbox: InboxView,
    lab: SvgLab
  };

  return (
    <main class="devstudio">
      <HeaderTabs active={active} setActive={setActive} />
      <Dynamic
        component={screens[active()]}
        tickets={tickets}
        setSelectedTicket={setSelectedTicket}
      />
      <TicketModal ticket={selectedTicket} setTicket={setSelectedTicket} />
    </main>
  );
}

