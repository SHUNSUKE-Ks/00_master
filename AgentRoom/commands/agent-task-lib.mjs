import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const configPath = path.join(root, "AgentRoom", "configs", "agents.json");
export const sampleDbPath = path.join(root, "DevApps", "kanban_June", "src", "data", "sampleDb.ts");

export function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

export function matchString(block, key) {
  return block.match(new RegExp(`${key}:\\s*"([^"]*)"`, "m"))?.[1] ?? "";
}

export function matchStringArray(block, key) {
  const arrayBlock = block.match(new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`, "m"))?.[1] ?? "";
  return [...arrayBlock.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
}

export function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

export function readAgent(agentId) {
  const config = readConfig();
  const agent = config.agents.find((item) => item.agentId === agentId);
  if (!agent) {
    throw new Error(`unknown agent: ${agentId}`);
  }
  return agent;
}

export function readTaskTickets() {
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

export function rankTicket(ticket, agent) {
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

export function normalizePathLike(value) {
  return value.replaceAll("\\", "/").toLowerCase();
}

export function touchesDoNotTouchPath(ticket, agent) {
  const text = normalizePathLike([ticket.scope, ticket.title, ticket.tags.join(" ")].join(" "));
  return agent.doNotTouchPaths.some((blockedPath) => text.includes(normalizePathLike(blockedPath)));
}

export function selectCandidate(agent, ticketId = "") {
  const tickets = readTaskTickets();
  const allCandidates = tickets
    .filter((ticket) => agent.projectIds.includes(ticket.projectId))
    .filter((ticket) => ticket.status !== "done" && ticket.status !== "blocked" && ticket.wipLane !== "done")
    .sort((a, b) => rankTicket(b, agent) - rankTicket(a, agent) || b.updatedAt.localeCompare(a.updatedAt));

  const handoffCandidates = allCandidates.filter((ticket) => touchesDoNotTouchPath(ticket, agent));
  const candidates = allCandidates.filter((ticket) => !touchesDoNotTouchPath(ticket, agent));
  const selected = ticketId ? candidates.find((ticket) => ticket.ticketId === ticketId) ?? null : candidates[0] ?? null;
  return { tickets, candidates, handoffCandidates, selected };
}

export function createStartPrompt(ticket, agent, runId = "") {
  return [
    `/KB_START ${ticket.ticketId}`,
    "",
    `担当：${agent.label}`,
    runId ? `Run：${runId}` : "",
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
    "- Keep AgentRun log updated",
    "- Save TaskTicket report after work"
  ].filter(Boolean).join("\n");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function slug(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function readRun(runId) {
  const runPath = path.join(root, "AgentRoom", "runs", `${runId}.json`);
  return JSON.parse(fs.readFileSync(runPath, "utf8"));
}
