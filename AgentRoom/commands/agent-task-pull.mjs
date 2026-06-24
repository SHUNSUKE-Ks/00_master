import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const configPath = path.join(root, "AgentRoom", "configs", "agents.json");
const sampleDbPath = path.join(root, "DevApps", "kanban_June", "src", "data", "sampleDb.ts");
const reportDir = path.join(root, "AgentRoom", "reports");

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function matchString(block, key) {
  return block.match(new RegExp(`${key}:\\s*"([^"]*)"`, "m"))?.[1] ?? "";
}

function matchStringArray(block, key) {
  const arrayBlock = block.match(new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`, "m"))?.[1] ?? "";
  return [...arrayBlock.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
}

function readTaskTickets() {
  const source = fs.readFileSync(sampleDbPath, "utf8");
  const taskTicketSection = source.match(/export const taskTickets:[\s\S]*?=\s*\[([\s\S]*?)\];\s*\n\nexport const executionQueue/)?.[1] ?? "";
  const blocks = taskTicketSection
    .split(/\n\s*\},\s*\n\s*\{/)
    .map((block, index, blocks) => {
      const prefix = index === 0 ? block : `{${block}`;
      return index === blocks.length - 1 ? prefix : `${prefix}}`;
    })
    .filter((block) => block.includes("ticketId:"));

  return blocks.map((block) => ({
    ticketId: matchString(block, "ticketId"),
    projectId: matchString(block, "projectId"),
    phase: matchString(block, "phase"),
    title: matchString(block, "title"),
    scope: matchString(block, "scope"),
    acceptance: matchStringArray(block, "acceptance"),
    testNumbers: matchStringArray(block, "testNumbers"),
    tags: matchStringArray(block, "tags"),
    status: matchString(block, "status"),
    wipLane: matchString(block, "wipLane"),
    assignee: matchString(block, "assignee"),
    reportTarget: matchString(block, "reportTarget"),
    updatedAt: matchString(block, "updatedAt")
  }));
}

function rankTicket(ticket, agent) {
  let score = 0;
  if (ticket.wipLane === "doing") score += 100;
  if (ticket.wipLane === "ready") score += 80;
  if (ticket.wipLane === "backlog") score += 10;
  if (ticket.tags.includes("today")) score += 30;
  if (ticket.tags.includes("agent_pull_ready")) score += 20;
  if (ticket.tags.some((tag) => agent.watchTags.includes(tag))) score += 15;
  if (ticket.tags.some((tag) => agent.blockedTags.includes(tag))) score -= 30;
  if (ticket.status === "blocked") score -= 1000;
  if (ticket.status === "done") score -= 1000;
  return score;
}

function normalizePathLike(value) {
  return value.replaceAll("\\", "/").toLowerCase();
}

function touchesDoNotTouchPath(ticket, agent) {
  const text = normalizePathLike([ticket.scope, ticket.title, ticket.tags.join(" ")].join(" "));
  return agent.doNotTouchPaths.some((blockedPath) => text.includes(normalizePathLike(blockedPath)));
}

function createStartPrompt(ticket, agent) {
  return [
    `/KB_START ${ticket.ticketId}`,
    "",
    `担当：${agent.label}`,
    `Project：${ticket.projectId}`,
    `Phase：${ticket.phase}`,
    `Lane：${ticket.wipLane}`,
    "",
    "## Scope",
    ticket.scope,
    "",
    "## Acceptance",
    ...ticket.acceptance.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Before Work",
    `- Read: ${agent.profilePath}`,
    `- Read: ${agent.taskWatchPath}`,
    "- Confirm owned paths and do-not-touch paths",
    "- Save report after work"
  ].join("\n");
}

function writePullReport(agent, selected, candidates) {
  const now = new Date().toISOString();
  const safeAgent = agent.agentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const reportPath = path.join(reportDir, `${safeAgent}_task_pull_${now.slice(0, 10)}.md`);
  const handoffTickets = candidates.filter((ticket) => touchesDoNotTouchPath(ticket, agent));
  const startableTickets = candidates.filter((ticket) => !touchesDoNotTouchPath(ticket, agent));
  const body = [
    `# ${agent.label} Task Pull`,
    "",
    "meta:",
    `  date: ${now}`,
    `  agent: ${agent.agentId}`,
    "  report_type: task_pull",
    `  status: ${selected ? "candidate_selected" : "no_candidate"}`,
    "",
    "## selected",
    "",
    selected
      ? [
          `- ticket: ${selected.ticketId}`,
          `- title: ${selected.title}`,
          `- phase: ${selected.phase}`,
          `- lane: ${selected.wipLane}`,
          `- tags: ${selected.tags.join(", ") || "none"}`
        ].join("\n")
      : "候補なし",
    "",
    "## candidates",
    "",
    ...startableTickets.map((ticket, index) => `${index + 1}. ${ticket.ticketId} / ${ticket.wipLane} / ${ticket.title}`),
    "",
    "## handoff_candidates",
    "",
    ...handoffTickets.map((ticket, index) => `${index + 1}. ${ticket.ticketId} / ${ticket.title} / do-not-touch scope`),
    "",
    "## start_prompt",
    "",
    "```text",
    selected ? createStartPrompt(selected, agent) : "",
    "```"
  ].join("\n");

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, body, "utf8");
  return reportPath;
}

const agentId = argValue("--agent", "creator_game_lab_agent");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const agent = config.agents.find((item) => item.agentId === agentId);

if (!agent) {
  console.error(`[NG] unknown agent: ${agentId}`);
  process.exit(1);
}

const tickets = readTaskTickets();
const allCandidates = tickets
  .filter((ticket) => agent.projectIds.includes(ticket.projectId))
  .filter((ticket) => ticket.status !== "done" && ticket.status !== "blocked" && ticket.wipLane !== "done")
  .sort((a, b) => rankTicket(b, agent) - rankTicket(a, agent) || b.updatedAt.localeCompare(a.updatedAt));

const handoffCandidates = allCandidates.filter((ticket) => touchesDoNotTouchPath(ticket, agent));
const candidates = allCandidates.filter((ticket) => !touchesDoNotTouchPath(ticket, agent));
const selected = candidates[0] ?? null;
const doneCount = tickets.filter((ticket) => ticket.status === "done" || ticket.wipLane === "done").length;
const activeTotal = tickets.filter((ticket) => ticket.status !== "blocked").length;
const reportPath = writePullReport(agent, selected, candidates.slice(0, 8));

console.log(`受領：agent-task-pull`);
console.log(`担当：${agent.label}`);
console.log(`進捗：${doneCount}/${activeTotal}`);
console.log(`候補：${candidates.length}件`);
console.log(`引継：${handoffCandidates.length}件`);
console.log(`選定：${selected ? `${selected.ticketId} ${selected.title}` : "候補なし"}`);
console.log(`報告：${reportPath}`);
if (selected) {
  console.log("");
  console.log(createStartPrompt(selected, agent));
}
