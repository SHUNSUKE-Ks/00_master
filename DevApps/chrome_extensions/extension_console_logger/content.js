const STORAGE_KEY = "consoleLoggerEntries";
const MAX_LOGS = 800;

function injectConsoleWrapper() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => script.remove();
  const target = document.documentElement || document.head || document.body;
  if (target) {
    target.appendChild(script);
    return;
  }
  document.addEventListener("DOMContentLoaded", () => {
    (document.documentElement || document.head || document.body).appendChild(script);
  }, { once: true });
}

function normalizeEntry(payload) {
  const firstArg = Array.isArray(payload.args) ? payload.args[0] : "";
  const firstText = typeof firstArg === "string" ? firstArg : "";
  const tagMatch = firstText.match(/^\[([^\]]+)\]/);
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    level: payload.level,
    time: payload.time,
    tag: tagMatch ? tagMatch[1] : "",
    message: firstText || payload.message || "",
    args: Array.isArray(payload.args) ? payload.args : [],
    url: location.href
  };
}

function storeEntry(entry) {
  chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
    const current = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
    const next = [...current, entry].slice(-MAX_LOGS);
    chrome.storage.local.set({ [STORAGE_KEY]: next });
  });
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== "CUSTOM_CONSOLE_LOG") return;
  storeEntry(normalizeEntry(event.data));
});

injectConsoleWrapper();
