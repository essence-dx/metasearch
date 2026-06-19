(() => {
  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  window.DxMetasearchUrlSafety = Object.assign(window.DxMetasearchUrlSafety || {}, {
    safeHttpUrl,
  });
})();
