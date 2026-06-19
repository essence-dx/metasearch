(() => {
  const categoryLabels = {
    answer: "Answer",
    general: "General",
    images: "Images",
    videos: "Videos",
    news: "News",
    maps: "Maps",
    science: "Science",
    music: "Music",
    files: "Files",
    it: "Code",
    social_media: "Social",
  };

  const safeSearchLabels = {
    "0": "Off",
    "1": "Safe",
    "2": "Strict",
  };

  const timeRangeLabels = {
    "": "Any",
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
  };

  function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function appendText(parent, text) {
    if (text) parent.append(document.createTextNode(text));
  }

  function safeHttpUrl(value) {
    return window.DxMetasearchUrlSafety?.safeHttpUrl(value) || "";
  }

  function appendToken(parent, className, text) {
    if (!text) return;
    parent.append(createElement("span", className, text));
  }

  function normalizeCodeSnippet(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/>\s+</g, ">\n<")
      .trim();
  }

  function shouldRenderCodeSnippet(result, category) {
    const content = String(result.content || "");
    const categoryValue = String(result.category || category || "").toLowerCase();
    return (
      categoryValue === "it" &&
      /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<script[\s>]|<style[\s>]|<\/?[a-z][^>]{0,240}>/i.test(content)
    );
  }

  function appendHighlightedCode(codeNode, source) {
    const tagPattern = /<!doctype[^>]*>|<!--[\s\S]*?-->|<\/?[a-z][^>]{0,240}>/gi;
    let index = 0;
    for (const match of source.matchAll(tagPattern)) {
      appendText(codeNode, source.slice(index, match.index));
      appendToken(codeNode, "code-token code-token--tag", match[0]);
      index = match.index + match[0].length;
    }
    appendText(codeNode, source.slice(index));
  }

  function renderSnippet(result, category, className) {
    const content = String(result.content || "");
    if (!shouldRenderCodeSnippet(result, category)) return createElement("p", className, content);

    const block = createElement("pre", `${className} code-snippet`);
    block.tabIndex = 0;
    const code = createElement("code", "code-snippet-code");
    appendHighlightedCode(code, normalizeCodeSnippet(content));
    block.append(code);
    return block;
  }

  function replaceChildren(parent, children) {
    if (!parent) return;
    parent.replaceChildren(...children.filter(Boolean));
  }

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : "0";
  }

  function countValue(value) {
    if (Array.isArray(value)) return value.length;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatScore(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "";
  }

  function normalizeTimeRange(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return timeRangeLabels[normalized] !== undefined ? normalized : "";
  }

  function hostname(value) {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch {
      return value || "";
    }
  }

  function compactUrl(value) {
    try {
      const url = new URL(value);
      return `${url.hostname.replace(/^www\./, "")}${url.pathname}${url.search}`.slice(0, 120);
    } catch {
      return String(value || "");
    }
  }

  function metadataEntries(metadata) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
    return Object.entries(metadata)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
      .slice(0, 8);
  }

  function appendDetail(detailsList, label, value) {
    if (!detailsList || value === undefined || value === null || value === "") return;
    const row = createElement("div", "detail-row");
    row.append(createElement("span", "detail-label", label), createElement("span", "detail-value", value));
    detailsList.append(row);
  }

  window.DxMetasearchResultCommon = {
    appendDetail,
    categoryLabels,
    compactUrl,
    countValue,
    createElement,
    formatNumber,
    formatScore,
    hostname,
    metadataEntries,
    normalizeTimeRange,
    renderSnippet,
    replaceChildren,
    safeHttpUrl,
    safeSearchLabels,
    timeRangeLabels,
  };
})();
