(() => {
  const common = window.DxMetasearchResultCommon;
  const cards = window.DxMetasearchResultCards;
  const {
    appendDetail,
    categoryLabels,
    countValue,
    createElement,
    formatNumber,
    replaceChildren,
    safeSearchLabels,
    timeRangeLabels,
    normalizeTimeRange,
  } = common;
  const { renderResult } = cards;

  function updateResultCardSpans(resultList) {
    if (!resultList) return;
    const styles = getComputedStyle(resultList);
    const rowHeight = Number.parseFloat(styles.gridAutoRows) || 8;
    const rowGap = Number.parseFloat(styles.rowGap) || 0;
    const spanBase = rowHeight + rowGap;
    for (const card of resultList.querySelectorAll("[data-result-card]")) {
      card.style.gridRowEnd = `span ${Math.max(1, Math.ceil((card.getBoundingClientRect().height + rowGap) / spanBase))}`;
    }
  }

  function scheduleResultCardSpans(resultList) {
    if (!resultList) return;
    const update = () => updateResultCardSpans(resultList);
    requestAnimationFrame(update);
    window.setTimeout(update, 160);
    for (const image of resultList.querySelectorAll("img")) {
      if (image.complete) continue;
      image.addEventListener("load", update, { once: true });
      image.addEventListener("error", update, { once: true });
    }
  }

  function renderSummary(summaryNode, payload, visibleResults) {
    const visibleEngineCount = new Set(visibleResults.map((result) => result.engine).filter(Boolean)).size;
    const usedEngineCount = countValue(payload.engines_used) || visibleEngineCount;
    const summaryItems = [
      `${formatNumber(payload.number_of_results || visibleResults.length)} total`,
      `${formatNumber(visibleResults.length)} shown`,
      `${formatNumber(usedEngineCount)} engines`,
      `${formatNumber(countValue(payload.engines_failed))} failed`,
      `${formatNumber(payload.search_time_ms)}ms`,
      payload.cached === true ? "cached" : "fresh",
    ];
    replaceChildren(summaryNode, summaryItems.map((item) => createElement("span", "", item)));
  }

  function renderDetails(detailsList, payload, state, results) {
    if (!detailsList) return;
    const displayedCategory = state.category === "answer" ? state.category : payload.category || state.category;
    detailsList.replaceChildren();
    appendDetail(detailsList, "Query", payload.query || state.query);
    appendDetail(detailsList, "Category", categoryLabels[displayedCategory] || displayedCategory);
    appendDetail(detailsList, "Language", payload.language || state.language);
    appendDetail(detailsList, "Safe search", safeSearchLabels[String(payload.safe_search)] || payload.safe_search);
    appendDetail(detailsList, "Time range", timeRangeLabels[normalizeTimeRange(payload.time_range || state.timeRange)] || "");
    appendDetail(detailsList, "Returned", formatNumber(results.length));
    appendDetail(detailsList, "Total", formatNumber(payload.number_of_results || results.length));
    appendDetail(detailsList, "Search time", `${formatNumber(payload.search_time_ms)}ms`);
    appendDetail(detailsList, "Page", payload.page);
    appendDetail(detailsList, "Cached", payload.cached === true ? "Yes" : "No");
    const requestedEngineCount = countValue(payload.requested_engines);
    if (requestedEngineCount > 0) appendDetail(detailsList, "Requested engines", requestedEngineCount);
    appendDetail(detailsList, "Used engines", countValue(payload.engines_used) || new Set(results.map((result) => result.engine).filter(Boolean)).size);
    appendDetail(detailsList, "Failed engines", countValue(payload.engines_failed));
  }

  function renderEngines(engineList, payload, results) {
    if (!engineList) return;
    const counts = new Map();
    for (const result of results) {
      const engine = result.engine;
      if (!engine) continue;
      counts.set(engine, (counts.get(engine) || 0) + 1);
    }
    const usedEngines = Array.isArray(payload.engines_used) ? payload.engines_used.filter(Boolean) : [...counts.keys()];
    const chips = [...new Set(usedEngines)]
      .sort((left, right) => (counts.get(right) || 0) - (counts.get(left) || 0) || left.localeCompare(right))
      .map((engine) => {
        const count = counts.get(engine);
        return createElement("span", "engine-chip", count ? `${engine} ${count}` : engine);
      });
    replaceChildren(engineList, chips);
  }

  function renderFailedEngines(failedEnginePanel, failedEngineList, payload) {
    if (!failedEnginePanel || !failedEngineList) return;
    const failed = Array.isArray(payload.engines_failed) ? payload.engines_failed.filter(Boolean) : [];
    failedEnginePanel.hidden = failed.length === 0;
    replaceChildren(failedEngineList, failed.map((engine) => createElement("span", "engine-chip engine-chip--failed", engine)));
  }

  function disposeCurrentMedia(elements) {
    window.DxMetasearchAnswer?.cancel?.();
    const stage = elements.resultList?.querySelector?.("[data-answer-media-stage]");
    window.DxMetasearchAnswerMedia?.disposeAnswerMediaStage?.(stage);
    window.DxMetasearchAnswerTts?.stop?.();
  }

  function clearResults(elements) {
    disposeCurrentMedia(elements);
    replaceChildren(elements.summaryNode, []);
    replaceChildren(elements.resultList, []);
    if (elements.detailsList) elements.detailsList.replaceChildren();
    if (elements.engineList) elements.engineList.replaceChildren();
    renderFailedEngines(elements.failedEnginePanel, elements.failedEngineList, {});
  }

  function renderResults({ payload, state, elements, maxVisibleResults, apiOrigin }) {
    const results = Array.isArray(payload.results) ? payload.results : [];
    const visibleResults = results.slice(0, maxVisibleResults);
    renderSummary(elements.summaryNode, payload, visibleResults);
    renderDetails(elements.detailsList, payload, state, visibleResults);
    renderEngines(elements.engineList, payload, visibleResults);
    renderFailedEngines(elements.failedEnginePanel, elements.failedEngineList, payload);
    if (elements.resultList) elements.resultList.setAttribute("data-result-layout", state.category);
    if (state.category === "answer" && window.DxMetasearchAnswer && typeof window.DxMetasearchAnswer.renderAnswer === "function") {
      window.DxMetasearchAnswer.renderAnswer({
        payload,
        state,
        elements,
        maxVisibleResults,
        apiOrigin,
      });
      scheduleResultCardSpans(elements.resultList);
      return;
    }
    disposeCurrentMedia(elements);
    replaceChildren(elements.resultList, visibleResults.map((result, index) => renderResult(result, index, state.category)));
    scheduleResultCardSpans(elements.resultList);
  }

  window.addEventListener("resize", () => {
    scheduleResultCardSpans(document.querySelector("[data-result-list]"));
  });

  window.DxMetasearchResults = {
    clearResults,
    renderResults,
  };
})();
