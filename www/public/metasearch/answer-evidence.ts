(() => {
  const common = window.DxMetasearchAnswerCommon;
  const {
    buildAnswerText,
    categoryLabel,
    cleanText,
    compactUrl,
    createElement,
    defaultLanguage,
    hostname,
    primaryEvidenceLimit,
    resultCategory,
    safeHttpUrl,
    sourceResults,
    truncate,
  } = common;

  const initialEvidenceLimit = 10;
  const categoryEvidenceLimit = 5;
  const categoryEvidenceCategories = ["images", "videos", "news", "maps", "music", "science", "it"];
  const mediaEvidenceCategories = new Set(["images", "videos", "music"]);
  const categoryEvidenceTimeoutMs = 4500;
  const mediaCategoryEvidenceTimeoutMs = 10000;
  const maxCategoryEvidenceRequests = 4;

  function categoryEvidenceTimeout(category) {
    return mediaEvidenceCategories.has(category) ? mediaCategoryEvidenceTimeoutMs : categoryEvidenceTimeoutMs;
  }

  function categoryEvidenceUrl(apiOrigin, state, category, useEngineFilter) {
    const url = new URL("/api/search", apiOrigin || window.location.origin);
    url.searchParams.set("q", cleanText(state.query));
    url.searchParams.set("format", "json");
    url.searchParams.set("categories", category);
    url.searchParams.set("language", state.language || defaultLanguage);
    url.searchParams.set("safe_search", state.safeSearch || "1");
    if (state.timeRange) url.searchParams.set("time_range", state.timeRange);
    if (useEngineFilter && state.engines) url.searchParams.set("engines", state.engines);
    return url;
  }

  async function fetchCategoryEvidence(apiOrigin, state, category, useEngineFilter, signal) {
    if (signal?.aborted) return null;
    const controller = new AbortController();
    const abort = () => controller.abort();
    const timeout = window.setTimeout(() => controller.abort(), categoryEvidenceTimeout(category));
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await fetch(categoryEvidenceUrl(apiOrigin, state, category, useEngineFilter), {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }

  async function runLimited(items, limit, worker) {
    let cursor = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        await worker(item);
      }
    });
    await Promise.all(runners);
  }

  function mergeMediaEvidence(payloads) {
    const seenUrls = new Set();
    const results = [];
    for (const payload of payloads) {
      for (const result of Array.isArray(payload?.results) ? payload.results : []) {
        const url = String(result.url || "");
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);
        results.push(result);
      }
    }
    return { results };
  }

  function mergeTextEvidence(payloads, state) {
    const seenUrls = new Set();
    const results = [];
    for (const payload of payloads) {
      for (const result of Array.isArray(payload?.results) ? payload.results : []) {
        const url = String(result.url || result.title || result.content || "");
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);
        results.push(result);
      }
    }
    return {
      language: state.language || defaultLanguage,
      query: state.query,
      results,
    };
  }

  function renderEvidenceCard(result, category) {
    const link = createElement("a", "answer-evidence-card");
    const resultUrl = safeHttpUrl(result.url);
    if (resultUrl) {
      link.href = resultUrl;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    } else {
      link.setAttribute("aria-disabled", "true");
    }
    link.setAttribute("data-source-url", resultUrl);
    link.append(
      createElement("span", "answer-evidence-meta", [categoryLabel(category), result.engine || hostname(result.url)].filter(Boolean).join(" · ")),
      createElement("strong", "", truncate(result.title || result.url, 92)),
      createElement("span", "answer-evidence-snippet", truncate(result.content || compactUrl(result.url), 142)),
    );
    return link;
  }

  function appendEvidenceCards(grid, payload, fallbackCategory, seenUrls, limit) {
    const results = sourceResults(payload).slice(0, limit);
    for (const result of results) {
      const url = safeHttpUrl(result.url);
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);
      grid.append(renderEvidenceCard(result, resultCategory(result, fallbackCategory)));
    }
  }

  function renderEvidence(payload) {
    const section = createElement("section", "answer-evidence");
    const header = createElement("div", "answer-evidence-header");
    header.append(
      createElement("span", "answer-evidence-title", "Sources"),
      createElement("span", "answer-evidence-status", "Checking related result tabs"),
    );
    const grid = createElement("div", "answer-evidence-grid");
    const seenUrls = new Set();
    appendEvidenceCards(grid, payload, "general", seenUrls, initialEvidenceLimit);
    section.append(header, grid);
    return { section, grid, status: header.querySelector(".answer-evidence-status"), seenUrls };
  }

  async function hydrateAnswerEvidence(shell, mediaAnchor, evidence, payload, state, apiOrigin, assistantContent, signal, typeText) {
    if (!shell || !evidence || !apiOrigin || !cleanText(state.query)) return;
    const payloads = [];
    let mediaHydrationFrame = 0;
    const answerIsMounted = () => shell.isConnected && evidence.grid?.isConnected;

    function hydrateMediaStage() {
      if (!window.DxMetasearchAnswerMedia?.hydrateAnswerMediaStage) return;
      if (signal?.aborted || !answerIsMounted()) return;
      window.DxMetasearchAnswerMedia.hydrateAnswerMediaStage(shell, mergeMediaEvidence([payload, ...payloads]), state, mediaAnchor);
    }

    function scheduleMediaHydration(category) {
      if (!mediaEvidenceCategories.has(category) || mediaHydrationFrame) return;
      mediaHydrationFrame = window.requestAnimationFrame(() => {
        mediaHydrationFrame = 0;
        hydrateMediaStage();
      });
    }

    async function loadCategorySet(useEngineFilter) {
      await runLimited(categoryEvidenceCategories, maxCategoryEvidenceRequests, async (category) => {
        if (signal?.aborted || !answerIsMounted()) return;
        const categoryPayload = await fetchCategoryEvidence(apiOrigin, state, category, useEngineFilter, signal);
        if (signal?.aborted || !answerIsMounted() || !categoryPayload) return;
        payloads.push(categoryPayload);
        appendEvidenceCards(evidence.grid, categoryPayload, category, evidence.seenUrls, categoryEvidenceLimit);
        scheduleMediaHydration(category);
      });
    }

    await loadCategorySet(true);
    if (signal?.aborted || !answerIsMounted()) return;

    if (evidence.status) {
      evidence.status.textContent = `${evidence.grid.children.length} source links`;
    }

    const mergedEvidence = mergeTextEvidence([payload, ...payloads], state);
    const allResults = sourceResults(mergedEvidence);

    // Try AI summary first using free OpenCode AI models
    if (false && assistantContent && allResults.length > 0 && window.DxMetasearchAnswerSummary) {
      try {
        const aiText = await window.DxMetasearchAnswerSummary.trySummarize(
          cleanText(state.query),
          allResults,
          signal
        );
        if (aiText && !signal?.aborted && answerIsMounted()) {
          assistantContent.setAttribute("data-ai-sourced", "true");
          assistantContent.setAttribute("data-source-text", aiText);
          typeText(assistantContent, aiText);
          hydrateMediaStage();
          return;
        }
      } catch (_e) {
        // AI unavailable, fall back to hardcoded answer
      }
    }

    if (assistantContent && allResults.length > 0) {
      const answerText = buildAnswerText(mergedEvidence, state);
      assistantContent.setAttribute("data-ai-sourced", "false");
      assistantContent.setAttribute("data-source-text", answerText);
      if (signal?.aborted || !answerIsMounted()) return;
      typeText(assistantContent, answerText);
    }

    hydrateMediaStage();
  }

  window.DxMetasearchAnswerEvidence = {
    hydrateAnswerEvidence,
    renderEvidence,
  };
})();
