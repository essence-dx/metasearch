(() => {
  const cacheTtlMs = 5 * 60 * 1000;
  const backgroundPrefetchCategories = new Set(["general", "images", "videos", "news", "it", "files"]);
  const maxCachedSearches = 32;
  const maxPrefetchRequests = 6;
  const prefetchDelayMs = 30;
  const prefetchTimeoutMs = 3000;

  function createSearchScheduler(config) {
    const resultCache = new Map();
    const prefetchRequests = new Map();
    let activeController = null;
    let activePrefetches = 0;
    let activeRequestId = 0;
    let prefetchBaseKey = "";
    let prefetchTimer = 0;
    let prefetchQueue = [];

    function cacheKey(state) {
      return config.searchParams(state).toString();
    }

    function prefetchScopeKey(state) {
      return [
        state.query,
        state.language,
        state.safeSearch,
        config.normalizeTimeRange(state.timeRange),
        state.engines,
      ].join("\u001f");
    }

    function readCachedPayload(key) {
      let entry = resultCache.get(key);
      if (!entry) {
        try {
          const stored = localStorage.getItem(`dx_cache_${key}`);
          if (stored) {
            entry = JSON.parse(stored);
            resultCache.set(key, entry);
          }
        } catch (e) {}
      }
      if (!entry) return null;
      if (Date.now() - entry.storedAt > cacheTtlMs) {
        resultCache.delete(key);
        try { localStorage.removeItem(`dx_cache_${key}`); } catch (e) {}
        return null;
      }
      resultCache.delete(key);
      resultCache.set(key, entry);
      return entry.payload;
    }

    function storeCachedPayload(key, payload) {
      const entry = { payload, storedAt: Date.now() };
      resultCache.set(key, entry);
      try { localStorage.setItem(`dx_cache_${key}`, JSON.stringify(entry)); } catch (e) {}
      while (resultCache.size > maxCachedSearches) {
        const oldestKey = resultCache.keys().next().value;
        if (!oldestKey) break;
        resultCache.delete(oldestKey);
        try { localStorage.removeItem(`dx_cache_${oldestKey}`); } catch (e) {}
      }
    }

    async function fetchSearchPayload(state, signal) {
      const response = await fetch(config.searchUrl(state), {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }

    function categoryPrefetchOrder(activeCategory) {
      const order = [];
      const activeIndex = config.categories.indexOf(activeCategory);
      const preferred = [
        config.categories[activeIndex + 1],
        config.categories[activeIndex - 1],
        "answer",
        "general",
        "images",
        "videos",
        "news",
        "it",
        "files",
        "maps",
        "music",
        "science",
        "social_media",
      ];

      for (const value of preferred) {
        const category = config.normalizeCategory(value);
        if (category !== activeCategory && config.categories.includes(category) && !order.includes(category)) {
          order.push(category);
        }
      }
      return order;
    }

    function queuePrefetchState(state, category, priority) {
      if (!state.query) return;
      const prefetchState = { ...state, category: config.normalizeCategory(category) };
      const key = cacheKey(prefetchState);
      if (readCachedPayload(key) || prefetchRequests.has(key) || prefetchQueue.some((item) => item.key === key)) return;

      const item = { key, state: prefetchState };
      if (priority) prefetchQueue.unshift(item);
      else prefetchQueue.push(item);
      schedulePrefetch();
    }

    function queueCategoryPrefetches(state) {
      const scopeKey = prefetchScopeKey(state);
      if (scopeKey !== prefetchBaseKey) {
        prefetchQueue = [];
        prefetchBaseKey = scopeKey;
      }
      for (const category of categoryPrefetchOrder(state.category)) {
        if (!backgroundPrefetchCategories.has(category)) continue;
        queuePrefetchState(state, category, false);
      }
    }

    function schedulePrefetch() {
      if (activePrefetches >= maxPrefetchRequests || prefetchTimer || prefetchQueue.length === 0) return;
      prefetchTimer = window.setTimeout(runNextPrefetch, prefetchDelayMs);
    }

    function startPrefetch(next) {
      if (!next || readCachedPayload(next.key)) return;

      activePrefetches += 1;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => {
        controller.abort();
      }, prefetchTimeoutMs);
      const request = fetchSearchPayload(next.state, controller.signal)
        .then((payload) => {
          storeCachedPayload(next.key, payload);
          return payload;
        })
        .catch(() => null)
        .finally(() => {
          window.clearTimeout(timeout);
          prefetchRequests.delete(next.key);
          activePrefetches = Math.max(0, activePrefetches - 1);
          schedulePrefetch();
        });

      prefetchRequests.set(next.key, request);
    }

    function runNextPrefetch() {
      prefetchTimer = 0;
      while (activePrefetches < maxPrefetchRequests && prefetchQueue.length > 0) {
        startPrefetch(prefetchQueue.shift());
      }
      schedulePrefetch();
    }

    function replaceSearchUrl(state) {
      history.replaceState(null, "", `/?${config.searchParams(state).toString()}#results`);
    }

    async function runSearch(state, updateUrl) {
      const requestId = ++activeRequestId;
      if (activeController) activeController.abort();
      activeController = null;
      config.setFormState(state);

      if (updateUrl) {
        replaceSearchUrl(state);
      }

      if (!state.query) {
        config.setStatus("", "neutral");
        config.clearResults();
        return;
      }

      const key = cacheKey(state);
      const cachedPayload = readCachedPayload(key);
      if (cachedPayload) {
        config.renderPayload(cachedPayload, state);
        config.setStatus("", "ready");
        queueCategoryPrefetches(state);
        return;
      }

      config.setStatus("", "loading");
      if (typeof config.showPendingState === "function") config.showPendingState(state);
      else config.clearResults();
      const pendingPrefetch = prefetchRequests.get(key);
      if (pendingPrefetch) {
        const payload = await pendingPrefetch;
        if (requestId !== activeRequestId) return;
        if (payload) {
          config.renderPayload(payload, state);
          config.setStatus("", "ready");
          queueCategoryPrefetches(state);
          return;
        }
      }

      const controller = new AbortController();
      activeController = controller;
      try {
        const payload = await fetchSearchPayload(state, controller.signal);
        if (requestId !== activeRequestId) return;
        storeCachedPayload(key, payload);
        config.renderPayload(payload, state);
        config.setStatus("", "ready");
        queueCategoryPrefetches(state);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (requestId !== activeRequestId) return;
        config.setStatus(`Search failed: ${error instanceof Error ? error.message : "API unavailable"}`, "error");
        config.clearResults();
      } finally {
        if (activeController === controller) activeController = null;
      }
    }

    return {
      queuePrefetchState,
      runSearch,
    };
  }

  window.DxMetasearchSearch = {
    createSearchScheduler,
  };
})();
