import fs from "node:fs";
import path from "node:path";
import { argValue, ensureDir, readRun, root } from "./agent-task-lib.mjs";

const runId = argValue("--run", "");
const status = argValue("--status", "done");
const summary = argValue("--summary", "TaskTicket作業を完了しました。");
const verification = argValue("--verification", "未記入");

if (!runId) {
  console.error("[NG] --run is required");
  process.exit(1);
}

const runPath = path.join(root, "AgentRoom", "runs", `${runId}.json`);
const run = readRun(runId);
const now = new Date().toISOString();
const kanbanReportDir = path.join(root, "DevApps", "kanban_June", "docs");
ensureDir(kanbanReportDir);

const reportPath = path.join(kanbanReportDir, `${run.sourceTask.toLowerCase()}_${run.agentId}_report_${now.slice(0, 10)}.md`);
const reportBody = [
  `# ${run.sourceTask} Agent Report`,
  "",
  "meta:",
  `  date: ${now}`,
  `  agent: ${run.agentId}`,
  `  run_id: ${run.runId}`,
  `  task_id: ${run.sourceTask}`,
  `  project: ${run.sourceProject}`,
  `  status: ${status}`,
  "  report_type: taskticket_agent_report",
  "",
  "## summary",
  "",
  summary,
  "",
  "## actions",
  "",
  "- AgentRoomのRun LogとPromptを保存した。",
  "- TaskTicket単位の報告をKanban_June docsへ保存した。",
  "",
  "## verification",
  "",
  verification,
  "",
  "## links",
  "",
  `- run: ${path.join(root, "AgentRoom", "runs", `${runId}.json`)}`,
  `- log: ${run.logPath}`,
  `- prompt: ${run.promptPath}`
].join("\n");

fs.writeFileSync(reportPath, reportBody, "utf8");

run.status = status;
run.finishedAt = now;
run.reportPath = reportPath;
run.verification.push(verification);
fs.writeFileSync(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");

fs.appendFileSync(
  run.logPath,
  [
    "",
    "## complete",
    "",
    `- finished_at: ${now}`,
    `- status: ${status}`,
    `- report: ${reportPath}`,
    `- verification: ${verification}`
  ].join("\n"),
  "utf8"
);

console.log("受領：agent-task-complete");
console.log(`Run：${runId}`);
console.log(`完了：${status}`);
console.log(`報告：${reportPath}`);

