(function wrapConsole() {
  if (window.__consoleLogExporterInstalled) return;
  window.__consoleLogExporterInstalled = true;

  const levels = ["log", "warn", "error"];
  const originals = {};

  function toSerializable(value) {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }
    if (value instanceof Node) {
      return {
        nodeName: value.nodeName,
        text: value.textContent ? value.textContent.slice(0, 120) : ""
      };
    }
    try {
      JSON.stringify(value);
      return value;
    } catch {
      return String(value);
    }
  }

  for (const level of levels) {
    originals[level] = console[level].bind(console);
    console[level] = (...args) => {
      try {
        window.postMessage(
          {
            type: "CUSTOM_CONSOLE_LOG",
            level,
            args: args.map(toSerializable),
            message: args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(toSerializable(arg)))).join(" "),
            time: new Date().toISOString()
          },
          "*"
        );
      } catch {
        // Keep original console behavior even if capture fails.
      }
      originals[level](...args);
    };
  }
})();
