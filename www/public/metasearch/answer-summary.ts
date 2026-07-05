(() => {
  const apiOrigin =
    document.querySelector("[data-metasearch-app]")?.getAttribute("data-api-origin") ||
    window.location.origin;

  // 5 free AI models proxied through the metasearch server
  const FREE_MODELS = {
    bigPickle: { id: "big-pickle", protocol: "openai_chat", display: "Big Pickle" },
    deepSeekV4FlashFree: { id: "deepseek-v4-flash-free", protocol: "openai_chat", display: "Flash Free" },
    mimoV2_5Free: { id: "mimo-v2.5-free", protocol: "openai_chat", display: "MiMo V2.5" },
    northMiniCodeFree: { id: "north-mini-code-free", protocol: "openai_chat", display: "Mini Code" },
    nemotron3UltraFree: { id: "nemotron-3-ultra-free", protocol: "openai_chat", display: "Nemotron 3" },
  };

  const DEFAULT_MODEL = FREE_MODELS.mimoV2_5Free;
  const FALLBACK_MODEL = FREE_MODELS.nemotron3UltraFree;
  const MODEL_KEYS = Object.keys(FREE_MODELS);

  let selectedModelKey = "mimoV2_5Free";
  let selectedModel = FREE_MODELS[selectedModelKey];

  function setModel(key) {
    if (FREE_MODELS[key]) {
      selectedModelKey = key;
      selectedModel = FREE_MODELS[key];
      window.dispatchEvent(new CustomEvent("dx:metasearch-model-change", {
        detail: { modelKey: key, model: selectedModel },
      }));
    }
  }

  function getModelList() {
    return MODEL_KEYS.map((key) => ({ key, ...FREE_MODELS[key] }));
  }

  function buildSummaryPrompt(query, results) {
    const snippets = results
      .slice(0, 14)
      .map((r, i) => `${i + 1}. [${r.title || "Untitled"}](${r.url || ""}) - ${(r.content || "").slice(0, 500)}`)
      .join("\n");

    const history = window.DxMetasearch?.searchHistory || [];
    const prevQueries = history.filter((q) => q !== query).slice(0, 5);
    const historyBlock = prevQueries.length
      ? `\n\nPrevious searches this session: ${prevQueries.join(" → ")}`
      : "";

    return [
      {
        role: "system",
        content: "You are a professional research assistant. Write a comprehensive, well-structured answer to the user's query using the live search results provided. Use markdown formatting: headings for sections, **bold** for key terms, bullet points for lists, and cite sources by number in brackets like [1]. Write at least 3-4 paragraphs covering the most important aspects. If the results are insufficient, say so clearly.",
      },
      {
        role: "user",
        content: `Query: ${query}${historyBlock}\n\nLive search results:\n${snippets}\n\nWrite a thorough, professional answer based on these results. Include key facts, multiple perspectives where applicable, and cite sources.`,
      },
    ];
  }

  async function callOpenAICompatible(modelId, messages, signal) {
    const response = await fetch(`${apiOrigin}/api/ai/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 2048,
        temperature: 0.3,
      }),
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async function callAnthropicCompatible(modelId, messages, signal) {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");

    const response = await fetch(`${apiOrigin}/api/ai/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        system: systemMsg?.content || "",
        messages: userMsgs,
        max_tokens: 2048,
        temperature: 0.3,
      }),
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.content?.map((c) => c.text).join("") || "";
  }

  async function summarizeWithModel(query, results, model, signal) {
    const messages = buildSummaryPrompt(query, results);

    if (model.protocol === "anthropic") {
      return callAnthropicCompatible(model.id, messages, signal);
    }
    return callOpenAICompatible(model.id, messages, signal);
  }

  async function trySummarize(query, results, signal) {
    const models = [selectedModel, FALLBACK_MODEL];
    let lastError = null;

    for (const model of models) {
      if (signal?.aborted) return null;
      try {
        const text = await summarizeWithModel(query, results, model, signal);
        if (text) return text;
      } catch (err) {
        lastError = err;
      }
    }

    return null;
  }

  window.DxMetasearchAnswerSummary = {
    trySummarize,
    FREE_MODELS,
    DEFAULT_MODEL,
    get selectedModel() { return selectedModel; },
    get selectedModelKey() { return selectedModelKey; },
    setModel,
    getModelList,
  };
})();
