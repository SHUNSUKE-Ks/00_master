const STORAGE_KEY = "consoleLoggerEntries";

const filterInput = document.getElementById("filterInput");
const expectedInput = document.getElementById("expectedInput");
const refreshButton = document.getElementById("refreshButton");
const copyButton = document.getElementById("copyButton");
const exportButton = document.getElementById("exportButton");
const compactButton = document.getElementById("compactButton");
const clearButton = document.getElementById("clearButton");
const logCount = document.getElementById("logCount");
const numberSummary = document.getElementById("numberSummary");
const codexPreview = document.getElementById("codexPreview");
const logList = document.getElementById("logList");

let allLogs = [];
let compactMode = false;

function getObservedNumbers(logs) {
  const numbers = new Set();
  for (const log of logs) {
    const text = `${log.tag || ""} ${log.message || ""}`;
    for (const match of text.matchAll(/\b\d+-\d+[a-z]?\b/g)) {
      numbers.add(match[0]);
    }
  }
  return [...numbers].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getExpectedNumbers() {
  return expectedInput.value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFilteredLogs() {
  const needle = filterInput.value.trim().toLowerCase();
  if (!needle) return allLogs;
  return allLogs.filter((log) => JSON.stringify(log).toLowerCase().includes(needle));
}

function getLogNumber(log) {
  const text = `${log.tag || ""} ${log.message || ""}`;
  const match = text.match(/\b\d+-\d+[a-z]?\b/);
  return match ? match[0] : "";
}

function compactLogs(logs) {
  const byKey = new Map();
  const order = [];
  for (const log of logs) {
    const number = getLogNumber(log);
    const key = number || `${log.level}:${log.message}`;
    const current = byKey.get(key);
    if (!current) {
      order.push(key);
      byKey.set(key, { ...log, count: 1, firstTime: log.time, lastTime: log.time });
      continue;
    }
    byKey.set(key, { ...log, count: current.count + 1, firstTime: current.firstTime, lastTime: log.time });
  }
  return order.map((key) => byKey.get(key));
}

function getOutputLogs(rawLogs) {
  return compactMode ? compactLogs(rawLogs) : rawLogs;
}

function buildExportPayload(logs, rawCount = logs.length) {
  const observed = getObservedNumbers(logs);
  const expected = getExpectedNumbers();
  const missing = expected.filter((item) => !observed.includes(item));
  return {
    project: "Kanban_June",
    source: "chrome_extension_console_logger",
    exportedAt: new Date().toISOString(),
    filter: filterInput.value,
    expectedNumbers: expected,
    observedNumbers: observed,
    missingNumbers: missing,
    compacted: compactMode,
    rawLogCount: rawCount,
    outputLogCount: logs.length,
    logs
  };
}

function buildCodexText(payload) {
  const lines = [
    "# Console Log Export",
    "",
    `filter: ${payload.filter || "(none)"}`,
    `exportedAt: ${payload.exportedAt}`,
    "",
    `出た番号: ${payload.observedNumbers.length ? payload.observedNumbers.join(", ") : "なし"}`,
    `出なかった番号: ${payload.missingNumbers.length ? payload.missingNumbers.join(", ") : "未指定またはなし"}`,
    "",
    "## Logs"
  ];

  if (payload.compacted) {
    lines.push(`compact: on (${payload.rawLogCount} logs -> ${payload.outputLogCount} logs)`);
    lines.push("");
  }

  for (const log of payload.logs.slice(-80)) {
    const count = log.count && log.count > 1 ? ` x${log.count}` : "";
    lines.push(`- ${log.time} [${log.level}]${count} ${log.message}`);
  }
  return lines.join("\n");
}

function render() {
  const rawLogs = getFilteredLogs();
  const logs = getOutputLogs(rawLogs);
  const payload = buildExportPayload(logs, rawLogs.length);
  compactButton.textContent = compactMode ? "Compact On" : "Compact Off";
  logCount.textContent = compactMode ? `${logs.length} / ${rawLogs.length} compacted` : `${logs.length} / ${allLogs.length} logs`;
  numberSummary.textContent = `numbers: ${payload.observedNumbers.join(", ") || "none"}`;
  codexPreview.textContent = buildCodexText(payload);
  logList.textContent = "";

  for (const log of logs.slice(-80).reverse()) {
    const article = document.createElement("article");
    article.className = `log-entry ${log.level}`;
    article.innerHTML = `
      <code>${escapeHtml(log.tag || log.level)}</code>
      <b>${escapeHtml(log.message || "(no message)")}${log.count && log.count > 1 ? ` x${log.count}` : ""}</b>
      <small>${escapeHtml(log.time)} / ${escapeHtml(log.url || "")}</small>
    `;
    logList.appendChild(article);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function loadLogs() {
  chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
    allLogs = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
    render();
  });
}

function downloadJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `console-log-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

filterInput.addEventListener("input", render);
expectedInput.addEventListener("input", render);
refreshButton.addEventListener("click", loadLogs);
copyButton.addEventListener("click", async () => {
  const rawLogs = getFilteredLogs();
  const logs = getOutputLogs(rawLogs);
  await navigator.clipboard.writeText(buildCodexText(buildExportPayload(logs, rawLogs.length)));
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy for Codex";
  }, 900);
});
exportButton.addEventListener("click", () => {
  const rawLogs = getFilteredLogs();
  const logs = getOutputLogs(rawLogs);
  downloadJson(buildExportPayload(logs, rawLogs.length));
});
compactButton.addEventListener("click", () => {
  compactMode = !compactMode;
  render();
});
clearButton.addEventListener("click", () => {
  chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
    allLogs = [];
    render();
  });
});

loadLogs();
