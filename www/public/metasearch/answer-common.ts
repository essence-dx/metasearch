(() => {
  const defaultLanguage = "en";
  const sourceLimit = 14;
  const primaryEvidenceLimit = 5;
  const helloGlowDuration = 3000;
  const SPAN_COUNT = 25;
  const queryStopWords = new Set(["about", "detail", "details", "for", "from", "into", "near", "show", "the", "with"]);

  function generateRainbowGradient(count) {
    const stops = Array.from({ length: count + 1 }, (_, i) => {
      const hue = (i / count) * 360;
      return `hsl(${hue}, 80%, 60%)`;
    });
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }

  const RAINBOW_GRADIENT = generateRainbowGradient(SPAN_COUNT);

  const categoryLabels = {
    general: "General",
    images: "Images",
    videos: "Videos",
    news: "News",
    maps: "Maps",
    music: "Music",
    science: "Science",
    it: "Code",
    files: "Files",
    social_media: "Social",
  };

  const fallbackLanguageOptions = [
    ["en", "English"],
    ["bn", "Bangla"],
    ["hi", "Hindi"],
    ["es", "Spanish"],
    ["fr", "French"],
    ["de", "German"],
    ["ja", "Japanese"],
    ["zh-CN", "Chinese"],
    ["ar", "Arabic"],
  ];

  function languageOptions() {
    const languages = window.DxMetasearchI18n?.languages;
    return Array.isArray(languages) && languages.length > 0 ? languages : fallbackLanguageOptions;
  }

  function languageLabel(code) {
    const normalized = String(code || defaultLanguage);
    const match = languageOptions().find(([languageCode]) => languageCode === normalized);
    return match ? match[1] : normalized;
  }

  function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function appendHelloGlowChildren(parent, children) {
    const childList = Array.isArray(children) ? children : [children];
    for (const child of childList) {
      if (child === undefined || child === null || child === false) continue;
      if (typeof Node !== "undefined" && child instanceof Node) {
        parent.append(child);
      } else {
        parent.append(document.createTextNode(String(child)));
      }
    }
  }

  function createHelloGlowOverlay(children) {
    const overlay = createElement("div", "hello-glow-container hello-glow-overlay");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--hello-glow-gradient", RAINBOW_GRADIENT);

    const content = createElement("div", "hello-glow-content");
    appendHelloGlowChildren(content, children);

    overlay.append(createElement("div", "hello-glow-background"), content);
    return overlay;
  }

  function attachHelloGlow(target, children) {
    if (!target) return () => {};
    const overlay = createHelloGlowOverlay(children);
    target.setAttribute("data-hello-glow-active", "true");
    target.append(overlay);
    let finished = false;
    const timeoutId = window.setTimeout(remove, helloGlowDuration);
    function remove() {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      overlay.remove();
      target.removeAttribute("data-hello-glow-active");
    }
    return remove;
  }

  function replaceChildren(parent, children) {
    if (!parent) return;
    parent.replaceChildren(...children.filter(Boolean));
  }

  function safeHttpUrl(value) {
    return window.DxMetasearchUrlSafety?.safeHttpUrl(value) || "";
  }

  function decodeTextEntities(value) {
    const text = String(value || "");
    if (!text.includes("&")) return text;
    try {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = text;
      return textarea.value;
    } catch {
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
  }

  function cleanText(value) {
    return decodeTextEntities(String(value || "").replace(/<[^>]*>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  }

  function truncate(value, maxLength) {
    const text = cleanText(value);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  function hostname(value) {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function compactUrl(value) {
    try {
      const url = new URL(value);
      return `${url.hostname.replace(/^www\./, "")}${url.pathname}${url.search}`.slice(0, 110);
    } catch {
      return truncate(value, 110);
    }
  }

  function resultSearchText(result) {
    return cleanText([result?.title, result?.content, result?.url, result?.engine].filter(Boolean).join(" ")).toLowerCase();
  }

  function significantQueryTokens(query) {
    return [...new Set(cleanText(query)
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 2 && !queryStopWords.has(token)))];
  }

  function matchesQueryIntent(result, query) {
    const tokens = significantQueryTokens(query);
    if (tokens.length === 0) return true;
    const haystack = resultSearchText(result);
    const matches = tokens.filter((token) => haystack.includes(token)).length;
    const required = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.55);
    return matches >= required;
  }

  function isProviderErrorResult(result) {
    const haystack = resultSearchText(result);
    return haystack.includes("auto' is an invalid source language") || haystack.includes("auto is an invalid source language");
  }

  function isWeatherQuery(query) {
    return /\b(weather|forecast|temperature|temp|rain|humidity|wind)\b/i.test(cleanText(query));
  }

  function isWeatherResult(result) {
    const engine = cleanText(result?.engine).toLowerCase();
    const title = cleanText(result?.title).toLowerCase();
    return engine.includes("weather") || engine === "wttr" || title.startsWith("weather for ");
  }

  function hasNonEnglishScript(value) {
    return /[\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u0980-\u09ff\u0e00-\u0e7f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(value);
  }

  function isLikelyEnglishResult(result) {
    const text = cleanText([result?.title, result?.content].filter(Boolean).join(" "));
    if (!text) return true;
    if (hasNonEnglishScript(text)) return false;
    const letters = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || [];
    if (letters.length < 4) return true;
    const otherLetters = text.replace(/[A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,:;!?'"()[\]{}|/@#%&+=_*~`^<>-]/g, "");
    return otherLetters.length / letters.length < 0.08;
  }

  function wantsEnglishResults(payload) {
    return cleanText(payload?.language || defaultLanguage).toLowerCase().startsWith("en");
  }

  function isUsableResult(result, query, payload) {
    if (!cleanText(result?.title || result?.content || result?.url)) return false;
    if (isProviderErrorResult(result)) return false;
    if (isWeatherResult(result) && !isWeatherQuery(query)) return false;
    if (wantsEnglishResults(payload) && !isLikelyEnglishResult(result)) return false;
    return matchesQueryIntent(result, query);
  }

  function sourceResults(payload) {
    const query = cleanText(payload?.query);
    return (Array.isArray(payload.results) ? payload.results : [])
      .filter((result) => isUsableResult(result, query, payload))
      .slice(0, sourceLimit);
  }

  function resultCategory(result, fallback) {
    const category = String(result?.category || fallback || "general").trim().toLowerCase();
    if (category === "code" || category === "dev") return "it";
    if (category === "social" || category === "socialmedia") return "social_media";
    if (category === "video") return "videos";
    if (category === "image") return "images";
    if (category === "map") return "maps";
    return categoryLabels[category] ? category : "general";
  }

  function categoryLabel(category) {
    return categoryLabels[resultCategory({ category }, category)] || "General";
  }

  function resultSource(result) {
    return hostname(result.url) || cleanText(result.engine);
  }

  function resultSignal(result, fallbackCategory) {
    const category = categoryLabel(resultCategory(result, fallbackCategory));
    const source = resultSource(result);
    return [category, source].filter(Boolean).join(" · ");
  }

  function resultLead(index) {
    if (index === 0) return "Strongest signal";
    if (index === 1) return "Useful context";
    return "Good next source";
  }

  function resultCountLabel(payload, results) {
    const total = Number(payload.number_of_results || results.length || 0);
    if (!Number.isFinite(total) || total <= 0) return "";
    return `${total.toLocaleString()} live result${total === 1 ? "" : "s"}`;
  }

  function engineCountLabel(payload, results) {
    const engines = Array.isArray(payload.engines_used) && payload.engines_used.length > 0
      ? payload.engines_used
      : [...new Set(results.map((result) => cleanText(result.engine)).filter(Boolean))];
    if (engines.length === 0) return "";
    return `${engines.length.toLocaleString()} engine${engines.length === 1 ? "" : "s"}`;
  }

  function buildAnswerText(payload, state) {
    return "The AI summary is still loading. If this keeps happening, check the model or the proxy endpoint.";
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inlineMarkdown(text) {
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return text;
  }

  function renderMarkdown(text, linkMap) {
    const codeBlocks = [];
    const htmlEscaped = escapeHtml(text);
    const withPlaceholders = htmlEscaped.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      codeBlocks.push(`<pre><code>${code}</code></pre>`);
      return `\x00CB${codeBlocks.length - 1}\x00`;
    });

    const lines = withPlaceholders.split("\n");
    const out = [];
    let inList = null;
    let listItems = [];
    let paraLines = [];

    function flushList() {
      if (inList && listItems.length) {
        out.push(`<${inList}>${listItems.join("")}</${inList}>`);
      }
      listItems = [];
      inList = null;
    }

    function flushPara() {
      if (paraLines.length) {
        out.push(`<p>${inlineMarkdown(paraLines.join("<br>"))}</p>`);
        paraLines = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) { flushList(); flushPara(); continue; }

      const h = trimmed.match(/^(#{1,6})\s*(.+)$/);
      if (h) { flushList(); flushPara(); out.push(`<h${h[1].length}>${inlineMarkdown(h[2])}</h${h[1].length}>`); continue; }

      if (trimmed.startsWith("|")) {
        flushList(); flushPara();
        const rows = [trimmed];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
          i++;
          rows.push(lines[i].trim());
        }
        const thead = [];
        const tbody = [];
        for (let r = 0; r < rows.length; r++) {
          if (rows[r].match(/^\|[-:| ]+\|?$/)) continue;
          const cells = rows[r].split("|").slice(1, -1).map((c) => inlineMarkdown(c.trim()));
          const tag = r === 1 || (r === 0 && rows.length > 1 && rows[1].match(/^\|[-:| ]+\|?$/)) ? "th" : "td";
          if (tag === "th") thead.push(`<tr>${cells.map((c) => `<th>${c}</th>`).join("")}</tr>`);
          else tbody.push(`<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`);
        }
        let tbl = "<table>";
        if (thead.length) tbl += `<thead>${thead.join("")}</thead>`;
        if (tbody.length) tbl += `<tbody>${tbody.join("")}</tbody>`;
        out.push(tbl + "</table>");
        continue;
      }

      const bq = trimmed.match(/^>\s+(.+)$/);
      if (bq) { flushList(); flushPara(); out.push(`<blockquote>${inlineMarkdown(bq[1])}</blockquote>`); continue; }

      const ul = trimmed.match(/^[-*]\s+(.+)$/);
      if (ul) {
        flushPara();
        if (inList !== "ul") { flushList(); inList = "ul"; }
        listItems.push(`<li>${inlineMarkdown(ul[1])}</li>`);
        continue;
      }

      const ol = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (ol) {
        flushPara();
        if (inList !== "ol") { flushList(); inList = "ol"; }
        listItems.push(`<li>${inlineMarkdown(ol[1])}</li>`);
        continue;
      }

      if (trimmed.match(/^-{3,}$/)) { flushList(); flushPara(); out.push("<hr>"); continue; }

      flushList();
      paraLines.push(trimmed);
    }

    flushList();
    flushPara();

    let html = out.join("\n");
    html = html.replace(/\x00CB(\d+)\x00/g, (_, i) => codeBlocks[i] || "");

    if (linkMap) {
      html = html.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (match, nums, offset) => {
        const prev = offset > 0 ? html[offset - 1] : "";
        if (prev && !prev.match(/\s|\(|,|>|\[|\]|"|'/)) return match;
        const ids = nums.split(/\s*,\s*/);
        const links = ids.map((n) => {
          const url = linkMap[n];
          if (!url) return n;
          const dom = hostname(url);
          const icon = `https://www.google.com/s2/favicons?domain=${dom}&sz=16`;
          return `<a href="${url}" target="_blank" rel="noopener" class="citation"><img src="${icon}" alt="" class="citation-favicon" width="14" height="14" loading="lazy" onerror="this.style.display='none'">${n}</a>`;
        });
        return "[" + links.join(",") + "]";
      });
    }

    return html;
  }

  window.DxMetasearchAnswerCommon = {
    buildAnswerText,
    renderMarkdown,
    categoryLabel,
    attachHelloGlow,
    cleanText,
    compactUrl,
    createElement,
    defaultLanguage,
    hostname,
    languageLabel,
    languageOptions,
    primaryEvidenceLimit,
    replaceChildren,
    resultCategory,
    safeHttpUrl,
    sourceResults,
    truncate,
  };
})();
