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
import { categorizeScenarioTags, getScenarioStats, validateScenario } from "../utils/scenario";
import "./DevStudio.css";

const INBOX_KEY = "devstudio_inbox_solidjs_novel_engine";
const DEV_LIBRARY_KEY = "devstudio_library_solidjs_novel_engine";

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

function renderMiniMarkdown(text) {
  return text.split("\n").map((line) => {
    if (line.startsWith("## ")) return { type: "h2", text: line.slice(3) };
    if (line.startsWith("### ")) return { type: "h3", text: line.slice(4) };
    if (line.startsWith("- ")) return { type: "li", text: line.slice(2) };
    if (line.trim() === "") return { type: "space", text: "" };
    return { type: "p", text: line };
  });
}

function copyText(text) {
  navigator.clipboard?.writeText(text);
}

function HeaderTabs(props) {
  const tabs = [
    ["dashboard", "Dashboard"],
    ["tickets", "Tickets"],
    ["scenario", "Scenario"],
    ["library", "Library"],
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
                <button type="button" onClick={() => copyText(note.body)}>
                  Copy md
                </button>
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
        <button type="button" onClick={() => copyText(json())}>
          Copy JSON
        </button>
      </div>
      <pre>
        <code>{json()}</code>
      </pre>
    </div>
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

      <div class="panel">
        <h2>Character DB</h2>
        <div class="library-card-list">
          <For each={library().characters ?? []}>
            {(character) => (
              <article>
                <AssetPreview path={character.assetPath} label={character.name} />
                <code>{character.id}</code>
                <h3>{character.name}</h3>
                <p>{character.role} / {character.description}</p>
                <div class="tag-list">
                  <For each={character.tags ?? []}>{(tag) => <span>{tag}</span>}</For>
                </div>
              </article>
            )}
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
            <button type="button" onClick={() => copyText(draft())}>Copy</button>
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

export default function DevStudio() {
  const [active, setActive] = createSignal("dashboard");
  const [tickets] = createSignal(ENGINE_TICKETS);
  const [selectedTicket, setSelectedTicket] = createSignal(null);

  const screens = {
    dashboard: Dashboard,
    tickets: TicketsBoard,
    scenario: ScenarioView,
    library: LibraryView,
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
