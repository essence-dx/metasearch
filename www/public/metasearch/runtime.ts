(() => {
  const app = document.querySelector("[data-metasearch-app]");
  if (!app) return;

  const apiOrigin = app.getAttribute("data-api-origin") || window.location.origin;
  const common = window.DxMetasearchAnswerCommon;
  const resultsRenderer = window.DxMetasearchResults;
  const answerRenderer = window.DxMetasearchAnswer;
  const form = document.querySelector("[data-search-form]");
  const queryInput = document.querySelector("[data-query-input]");
  const categoryInput = document.querySelector("[data-category-input]");
  const languageInput = document.querySelector("[data-language-input]");
  const safeSearchInput = document.querySelector("[data-safe-search-input]");
  const timeRangeInput = document.querySelector("[data-time-range-input]");
  const engineInput = document.querySelector("[data-engine-input]");
  const statusNode = document.querySelector("[data-results-status]");
  const summaryNode = document.querySelector("[data-response-summary]");
  const resultList = document.querySelector("[data-result-list]");
  const detailsList = document.querySelector("[data-response-details]");
  const engineList = document.querySelector("[data-engine-list]");
  const failedEnginePanel = document.querySelector("[data-failed-engine-panel]");
  const failedEngineList = document.querySelector("[data-failed-engine-list]");
  const defaultShowcase = document.querySelector("[data-default-showcase]");
  const audioGradientCard = document.querySelector("[data-audio-gradient-card]");
  const categoryTabs = [...document.querySelectorAll("[data-category-tab]")];
  const categoryTabShell = document.querySelector(".category-tabs");
  const categoryTabTrack = document.querySelector("[data-category-tab-track]");
  const categoryOverflow = document.querySelector("[data-category-overflow]");
  const categoryOverflowPanel = document.querySelector("[data-category-overflow-panel]");
  const categoryOverflowTrigger = document.querySelector("[data-category-overflow-trigger]");
  const categoryControls = document.querySelector("[data-category-controls]");
  const safeSearchButtons = [...document.querySelectorAll("[data-safe-search-button]")];
  const timeRangeButtons = [...document.querySelectorAll("[data-time-range-button]")];
  const maxVisibleResults = 80;
  let categoryLayoutFrame = 0;

  const resultElements = {
    summaryNode,
    resultList,
    detailsList,
    engineList,
    failedEnginePanel,
    failedEngineList,
  };

  const categories = [
    "answer",
    "general",
    "images",
    "videos",
    "news",
    "maps",
    "music",
    "science",
    "it",
    "files",
    "social_media",
  ];

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

  function currentState() {
    const params = new URLSearchParams(window.location.search);
    return {
      query: (params.get("q") || "").trim(),
      category: normalizeCategory(params.get("category") || "answer"),
      language: params.get("language") || "en",
      safeSearch: normalizeSafeSearch(params.get("safe_search") || "1"),
      timeRange: normalizeTimeRange(params.get("time_range") || ""),
      engines: normalizeEngineList(params.get("engines") || ""),
    };
  }

  function normalizeCategory(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "answer" || normalized === "ai") return "answer";
    if (normalized === "video") return "videos";
    if (normalized === "image") return "images";
    if (normalized === "map") return "maps";
    if (normalized === "social") return "social_media";
    if (normalized === "code" || normalized === "dev") return "it";
    return categories.includes(normalized) ? normalized : "general";
  }

  function normalizeSafeSearch(value) {
    const normalized = String(value || "").trim();
    return safeSearchLabels[normalized] ? normalized : "1";
  }

  function normalizeTimeRange(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return timeRangeLabels[normalized] !== undefined ? normalized : "";
  }

  function normalizeEngineList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 24)
      .join(",");
  }

  function readFormState() {
    return {
      query: queryInput ? queryInput.value.trim() : "",
      category: normalizeCategory(categoryInput ? categoryInput.value : "general"),
      language: languageInput ? languageInput.value.trim() || "en" : "en",
      safeSearch: normalizeSafeSearch(safeSearchInput ? safeSearchInput.value : "1"),
      timeRange: normalizeTimeRange(timeRangeInput ? timeRangeInput.value : ""),
      engines: normalizeEngineList(engineInput ? engineInput.value : ""),
    };
  }

  function setFormState(state) {
    if (queryInput) queryInput.value = state.query;
    if (categoryInput) categoryInput.value = state.category;
    if (languageInput) languageInput.value = state.language;
    if (safeSearchInput) safeSearchInput.value = state.safeSearch;
    if (timeRangeInput) timeRangeInput.value = state.timeRange || "";
    if (engineInput) engineInput.value = state.engines || "";
    syncDefaultShowcase(state);
    syncControls(state);
  }

  function syncDefaultShowcase(state) {
    if (!defaultShowcase) return;
    defaultShowcase.hidden = Boolean(state.query);
  }

  function randomAudioGradient() {
    const hue = Math.floor(Math.random() * 360);
    const secondaryHue = (hue + 110 + Math.floor(Math.random() * 80)) % 360;
    const angle = 115 + Math.floor(Math.random() * 70);
    return `linear-gradient(${angle}deg, hsl(${hue} 82% 54%), hsl(${secondaryHue} 80% 48%))`;
  }

  function prepareDefaultShowcase() {
    if (audioGradientCard) {
      audioGradientCard.style.setProperty("--default-audio-gradient", randomAudioGradient());
    }
    if (common && typeof common.attachHelloGlow === "function") {
      for (const card of document.querySelectorAll("[data-hello-glow-media]")) {
        common.attachHelloGlow(card);
      }
    }
  }

  function syncControls(state) {
    for (const tab of categoryTabs) {
      const active = normalizeCategory(tab.getAttribute("data-category-value")) === state.category;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    }
    syncCategoryOverflowState();
    for (const button of safeSearchButtons) {
      const active = normalizeSafeSearch(button.getAttribute("data-safe-search-value")) === state.safeSearch;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    for (const button of timeRangeButtons) {
      const active = normalizeTimeRange(button.getAttribute("data-time-range-value")) === normalizeTimeRange(state.timeRange);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function syncCategoryOverflowState() {
    if (!categoryOverflowTrigger || !categoryOverflowPanel) return;
    const hasActiveOverflowTab = Boolean(categoryOverflowPanel.querySelector("[data-category-tab].is-active"));
    categoryOverflowTrigger.classList.toggle("is-active", hasActiveOverflowTab);
    categoryOverflowTrigger.setAttribute("aria-pressed", String(hasActiveOverflowTab));
  }

  function categoryGap(node) {
    const gap = Number.parseFloat(window.getComputedStyle(node).columnGap || "0");
    return Number.isFinite(gap) ? gap : 0;
  }

  function layoutCategoryTabs() {
    if (!categoryTabShell || !categoryTabTrack || !categoryOverflow || !categoryOverflowPanel) return;
    if (categoryTabShell.clientWidth <= 0) return;

    const wasOpen = categoryOverflow.hasAttribute("open");
    categoryOverflow.removeAttribute("open");

    for (const tab of categoryTabs) {
      categoryTabTrack.append(tab);
    }

    categoryOverflow.hidden = false;
    categoryOverflow.style.visibility = "hidden";

    const shellGap = categoryGap(categoryTabShell);
    const trackGap = categoryGap(categoryTabTrack);
    const controlsWidth = categoryControls && !categoryControls.hidden
      ? categoryControls.getBoundingClientRect().width + shellGap
      : 0;
    const availableWidth = Math.max(0, categoryTabShell.clientWidth - controlsWidth);
    const overflowWidth = categoryOverflow.getBoundingClientRect().width;
    const tabWidths = categoryTabs.map((tab) => tab.getBoundingClientRect().width);
    const totalTabWidth = tabWidths.reduce((total, width, index) => total + width + (index > 0 ? trackGap : 0), 0);
    let usedWidth = 0;
    let visibleCount = categoryTabs.length;

    if (totalTabWidth > availableWidth) {
      visibleCount = 0;
      for (const tabWidth of tabWidths) {
        const tabGap = visibleCount > 0 ? trackGap : 0;
        const remainingAfterThis = categoryTabs.length - visibleCount - 1;
        const overflowReserve = remainingAfterThis > 0 ? overflowWidth + shellGap : 0;
        const nextWidth = usedWidth + tabGap + tabWidth + overflowReserve;
        if (nextWidth <= availableWidth) {
          usedWidth += tabGap + tabWidth;
          visibleCount += 1;
          continue;
        }
        break;
      }
    }

    categoryOverflowPanel.replaceChildren(...categoryTabs.slice(visibleCount));
    categoryOverflow.hidden = categoryOverflowPanel.childElementCount === 0;
    categoryOverflow.style.visibility = "";
    if (wasOpen && !categoryOverflow.hidden) categoryOverflow.setAttribute("open", "");
    syncCategoryOverflowState();
  }

  function scheduleCategoryLayout() {
    if (categoryLayoutFrame) window.cancelAnimationFrame(categoryLayoutFrame);
    categoryLayoutFrame = window.requestAnimationFrame(() => {
      categoryLayoutFrame = 0;
      layoutCategoryTabs();
    });
  }

  function searchUrl(state) {
    const params = searchParams(state);
    params.set("format", "json");
    params.set("categories", apiSearchCategories(state.category));
    params.delete("category");
    const url = new URL("/api/search", apiOrigin);
    url.search = params.toString();
    return url.toString();
  }

  function apiSearchCategories(category) {
    return normalizeCategory(category) === "answer" ? "general" : normalizeCategory(category);
  }

  function searchParams(state) {
    const params = new URLSearchParams();
    params.set("q", state.query);
    params.set("category", state.category);
    params.set("language", state.language);
    params.set("safe_search", state.safeSearch);
    if (state.timeRange) params.set("time_range", state.timeRange);
    if (state.engines) params.set("engines", state.engines);
    return params;
  }

  function setStatus(message, tone) {
    if (!statusNode) return;
    statusNode.textContent = message || "";
    statusNode.setAttribute("data-tone", tone || "neutral");
  }

  function clearBusyState() {
    if (resultList) resultList.removeAttribute("aria-busy");
  }

  function clearResults() {
    if (resultsRenderer) resultsRenderer.clearResults(resultElements);
    clearBusyState();
  }

  function renderPayload(payload, state) {
    resultsRenderer.renderResults({
      payload,
      state,
      elements: resultElements,
      maxVisibleResults,
      apiOrigin,
    });
    clearBusyState();
  }

  function showPendingState(state) {
    if (!resultList) return;
    clearResults();
    resultList.setAttribute("data-result-layout", state.category);
    resultList.setAttribute("aria-busy", "true");
    if (state.category === "answer" && answerRenderer && typeof answerRenderer.renderPending === "function") {
      answerRenderer.renderPending({
        state,
        elements: resultElements,
      });
    }
  }

  const searchScheduler = window.DxMetasearchSearch?.createSearchScheduler({
    categories,
    clearResults,
    normalizeCategory,
    normalizeTimeRange,
    renderPayload,
    searchParams,
    searchUrl,
    setFormState,
    setStatus,
    showPendingState,
  });

  function runSearch(state, updateUrl) {
    if (!resultsRenderer || !searchScheduler) {
      setStatus("Search renderer unavailable", "error");
      return;
    }
    searchScheduler.runSearch(state, updateUrl);
  }

  function queuePrefetchState(state, category, priority) {
    if (searchScheduler) searchScheduler.queuePrefetchState(state, category, priority);
  }

  function runAnswerPrompt(input) {
    const data = input && typeof input === "object" ? input : {};
    const prompt = String(data.prompt || data.query || "").trim();
    if (!prompt) return;
    const formState = readFormState();
    runSearch(
      {
        ...formState,
        query: prompt,
        category: "answer",
        language: String(data.language || formState.language || "en"),
        safeSearch: normalizeSafeSearch(data.safeSearch || data.safe_search || formState.safeSearch),
      },
      true,
    );
  }

  function messageOriginAllowed(event) {
    if (event.origin === window.location.origin) return true;
    const allowedOrigins = window.DxMetasearch?.allowedMessageOrigins;
    return Array.isArray(allowedOrigins) && allowedOrigins.includes(event.origin);
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch(readFormState(), true);
    });
  }

  for (const tab of categoryTabs) {
    const category = normalizeCategory(tab.getAttribute("data-category-value"));
    tab.addEventListener("pointerenter", () => {
      queuePrefetchState(readFormState(), category, true);
    });
    tab.addEventListener("focus", () => {
      queuePrefetchState(readFormState(), category, true);
    });
    tab.addEventListener("click", () => {
      if (categoryOverflow) categoryOverflow.removeAttribute("open");
      runSearch({ ...readFormState(), category }, true);
    });
  }

  for (const button of safeSearchButtons) {
    button.addEventListener("click", () => {
      runSearch({ ...readFormState(), safeSearch: normalizeSafeSearch(button.getAttribute("data-safe-search-value")) }, true);
    });
  }

  for (const button of timeRangeButtons) {
    button.addEventListener("click", () => {
      runSearch({ ...readFormState(), timeRange: normalizeTimeRange(button.getAttribute("data-time-range-value")) }, true);
    });
  }

  window.addEventListener("message", (event) => {
    if (!messageOriginAllowed(event)) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.schema !== "dx.metasearch.answer.prompt.v1") return;
    runAnswerPrompt(data);
  });

  window.DxMetasearch = Object.assign(window.DxMetasearch || {}, {
    answer: runAnswerPrompt,
    answerPromptSchema: "dx.metasearch.answer.prompt.v1",
  });

  if (categoryTabShell) {
    if ("ResizeObserver" in window) {
      const categoryObserver = new ResizeObserver(scheduleCategoryLayout);
      categoryObserver.observe(categoryTabShell);
    } else {
      window.addEventListener("resize", scheduleCategoryLayout);
    }
    document.fonts?.ready?.then(scheduleCategoryLayout).catch(() => {});
  }

  prepareDefaultShowcase();
  runSearch(currentState(), false);
  scheduleCategoryLayout();
})();
