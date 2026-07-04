(() => {
  const API_URL = "https://opencode.ai/zen";
  const API_KEY = "public";

  // 6 free AI models from opencode crate
  const FREE_MODELS = {
    bigPickle: { id: "high", protocol: "openai_chat", display: "High" },
    deepSeekV4FlashFree: { id: "xhigh", protocol: "openai_chat", display: "XHigh" },
    mimoV2_5Free: { id: "default", protocol: "openai_chat", display: "Default" },
    miniMaxM3Free: { id: "low", protocol: "anthropic", display: "Low" },
    nemotron3SuperFree: { id: "medium", protocol: "openai_chat", display: "Medium" },
    nemotron3UltraFree: { id: "xlow", protocol: "openai_chat", display: "XLow" },
  };

  const DEFAULT_MODEL = FREE_MODELS.mimoV2_5Free;
  const FALLBACK_MODEL = FREE_MODELS.deepSeekV4FlashFree;

  function buildSummaryPrompt(query, results) {
    const snippets = results
      .slice(0, 14)
      .map((r, i) => `${i + 1}. [${r.title || "Untitled"}](${r.url || ""}) - ${(r.content || "").slice(0, 500)}`)
      .join("\n");

    return [
      {
        role: "system",
        content: "You are a helpful search result summarizer. Answer the user's query based on the provided live search results. Be concise, factual, and cite sources by number. If the results don't contain enough information, say so.",
      },
      {
        role: "user",
        content: `Query: ${query}\n\nLive search results:\n${snippets}\n\nProvide a concise answer summarizing the key information from these results.`,
      },
    ];
  }

  async function callOpenAICompatible(url, modelId, messages, signal) {
    const response = await fetch(`${url}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 1024,
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

  async function callAnthropicCompatible(url, modelId, messages, signal) {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");

    const response = await fetch(`${url}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        system: systemMsg?.content || "",
        messages: userMsgs,
        max_tokens: 1024,
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
    const url = API_URL;

    if (model.protocol === "anthropic") {
      return callAnthropicCompatible(url, model.id, messages, signal);
    }
    return callOpenAICompatible(url, model.id, messages, signal);
  }

  async function trySummarize(query, results, signal) {
    const models = [DEFAULT_MODEL, FALLBACK_MODEL];
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
  };
})();
