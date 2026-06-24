import fs from "node:fs";
import path from "node:path";
import {
  argValue,
  createStartPrompt,
  ensureDir,
  readAgent,
  root,
  selectCandidate,
  slug
} from "./agent-task-lib.mjs";

const agentId = argValue("--agent", "creator_game_lab_agent");
const ticketId = argValue("--ticket", "");
const agent = readAgent(agentId);
const { tickets, candidates, handoffCandidates, selected } = selectCandidate(agent, ticketId);

if (!selected) {
  console.log("受領：agent-task-start");
  console.log(`担当：${agent.label}`);
  console.log(`候補：${candidates.length}件`);
  console.log(`引継：${handoffCandidates.length}件`);
  console.log("停止：開始できるTaskTicketがありません");
  process.exit(0);
}

const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
const runId = `run_${slug(agent.agentId)}_${slug(selected.ticketId)}_${stamp}`;
const runDir = path.join(root, "AgentRoom", "runs");
const promptDir = path.join(root, "AgentRoom", "prompts");
const logDir = path.join(root, "AgentRoom", "logs");
ensureDir(runDir);
ensureDir(promptDir);
ensureDir(logDir);

const prompt = createStartPrompt(selected, agent, runId);
const runPath = path.join(runDir, `${runId}.json`);
const promptPath = path.join(promptDir, `${runId}.md`);
const logPath = path.join(logDir, `${runId}.md`);
const doneCount = tickets.filter((ticket) => ticket.status === "done" || ticket.wipLane === "done").length;
const activeTotal = tickets.filter((ticket) => ticket.status !== "blocked").length;

const run = {
  schemaVersion: "agentroom.agent-run.v1",
  runId,
  agentId: agent.agentId,
  agentLabel: agent.label,
  sourceTask: selected.ticketId,
  sourceProject: selected.projectId,
  status: "running",
  startedAt: now.toISOString(),
  finishedAt: null,
  cwd: root,
  command: `node AgentRoom\\commands\\agent-task-start.mjs --agent ${agent.agentId}${ticketId ? ` --ticket ${ticketId}` : ""}`,
  promptPath,
  logPath,
  reportPath: null,
  expectedOutput: {
    reportTargetDir: agent.reportTargetDir,
    reportTarget: selected.reportTarget,
    acceptance: selected.acceptance
  },
  changedFiles: [],
  verification: [],
  nextCandidates: []
};

fs.writeFileSync(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
fs.writeFileSync(promptPath, `# Agent Start Prompt\n\n${prompt}\n`, "utf8");
fs.writeFileSync(
  logPath,
  [
    `# Agent Run Log`,
    "",
    "meta:",
    `  run_id: ${runId}`,
    `  agent: ${agent.agentId}`,
    `  task: ${selected.ticketId}`,
    `  status: running`,
    `  started_at: ${now.toISOString()}`,
    "",
    "## start",
    "",
    `- title: ${selected.title}`,
    `- phase: ${selected.phase}`,
    `- lane: ${selected.wipLane}`,
    `- prompt: ${promptPath}`,
    "",
    "## work_log",
    "",
    "- started"
  ].join("\n"),
  "utf8"
);

console.log("受領：agent-task-start");
console.log(`担当：${agent.label}`);
console.log(`進捗：${doneCount}/${activeTotal}`);
console.log(`選定：${selected.ticketId} ${selected.title}`);
console.log(`Run：${runId}`);
console.log(`Prompt：${promptPath}`);
console.log(`Log：${logPath}`);
console.log("");
console.log(prompt);

