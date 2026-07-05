(() => {
  const common = window.DxMetasearchAnswerCommon;
  const controls = window.DxMetasearchAnswerControls;
  const evidenceRenderer = window.DxMetasearchAnswerEvidence;
  const {
    buildAnswerText,
    cleanText,
    createElement,
    defaultLanguage,
    renderMarkdown,
    replaceChildren,
  } = common;
  const { renderMessage } = controls;
  const { hydrateAnswerEvidence, renderEvidence } = evidenceRenderer;
  const typingTimers = new WeakMap();
  let answerRenderId = 0;
  let activeEvidenceController = null;

  function renderMediaStage(payload, state) {
    return window.DxMetasearchAnswerMedia?.renderAnswerMediaStage?.(payload, state) || null;
  }

  function disposeExistingMedia(elements) {
    const stage = elements.resultList?.querySelector?.("[data-answer-media-stage]");
    window.DxMetasearchAnswerMedia?.disposeAnswerMediaStage?.(stage);
  }

  function cancelTyping(node) {
    const timer = typingTimers.get(node);
    if (timer) window.clearTimeout(timer);
    typingTimers.delete(node);
  }

  function abortActiveAnswerWork() {
    activeEvidenceController?.abort();
    activeEvidenceController = null;
    answerRenderId += 1;
    window.DxMetasearchAnswerTts?.stop?.();
  }

  function renderPending({ state, elements }) {
    if (!elements.resultList) return;
    abortActiveAnswerWork();
    elements.resultList.setAttribute("data-result-layout", "answer");
    const shell = createElement("section", "answer-thread answer-thread--pending");
    shell.setAttribute("data-result-card", "true");

    const user = createElement("article", "answer-message answer-message--user");
    const userBubble = createElement("div", "answer-bubble answer-skeleton answer-skeleton--user-bubble");
    user.append(userBubble);

    const assistant = createElement("article", "answer-message answer-message--assistant");
    const bubble = createElement("div", "answer-bubble");
    const lineWidths = ["100%", "92%", "78%", "85%", "55%"];
    for (const width of lineWidths) {
      const line = createElement("div", "answer-skeleton answer-skeleton--line");
      line.style.width = width;
      bubble.append(line);
    }
    assistant.append(bubble);

    const evidence = createElement("section", "answer-evidence");
    const header = createElement("div", "answer-evidence-header");
    header.append(createElement("span", "answer-evidence-title", "Sources"));
    const grid = createElement("div", "answer-evidence-grid");
    for (let i = 0; i < 4; i++) {
      grid.append(createElement("div", "answer-skeleton answer-skeleton--card"));
    }
    evidence.append(header, grid);

    shell.append(user, assistant, evidence);
    replaceChildren(elements.resultList, [shell]);
  }

  function renderAnswer({ payload, state, elements, apiOrigin }) {
    if (!elements.resultList) return;
    abortActiveAnswerWork();
    const renderId = answerRenderId;
    const evidenceController = new AbortController();
    activeEvidenceController = evidenceController;
    const language = state.language || defaultLanguage;
    const hardcodeText = buildAnswerText(payload, state);
    const shell = createElement("section", "answer-thread answer-thread--composing");
    shell.setAttribute("data-result-card", "true");

    const user = renderMessage("user", cleanText(state.query || payload.query), { speaker: true, language });

    const summary = window.DxMetasearchAnswerSummary;
    const initialModel = summary ? "…" : "hardcode";
    const assistant = renderMessage("assistant", "", { assistant: true, latest: true, language, sourceText: hardcodeText, modelName: initialModel });
    const shimmer = createElement("div", "answer-skeleton-container");
    const lineWidths = ["100%", "92%", "78%", "85%", "55%"];
    for (const width of lineWidths) {
      const line = createElement("div", "answer-skeleton answer-skeleton--line");
      line.style.width = width;
      shimmer.append(line);
    }
    assistant.content.replaceWith(shimmer);
    const media = renderMediaStage(payload, state);
    const evidence = renderEvidence(payload);

    shell.append(user.message, assistant.message);
    if (media) shell.append(media);
    shell.append(evidence.section);
    disposeExistingMedia(elements);
    replaceChildren(elements.resultList, [shell]);

    let answerPopulated = false;

    function populateAnswer(node, text) {
      if (!shell.isConnected || renderId !== answerRenderId || answerPopulated) return;
      answerPopulated = true;
      shell.classList.remove("answer-thread--composing");
      const isHardcode = node.getAttribute("data-ai-sourced") !== "true";
      const modelName = isHardcode ? "hardcode" : (summary?.selectedModel?.display || summary?.DEFAULT_MODEL?.display || "AI");
      const badge = assistant.message.querySelector("[data-answer-model-badge]");
      if (badge) {
        badge.textContent = modelName;
        badge.classList.toggle("answer-model-badge--hardcode", isHardcode);
      }
      if (shimmer.isConnected) shimmer.replaceWith(node);
      node.setAttribute("data-answer-hydrated", "true");
      const results = Array.isArray(payload.results) ? payload.results : [];
      const linkMap = {};
      for (let i = 0; i < results.length && i < 14; i++) {
        linkMap[String(i + 1)] = results[i].url;
      }
      const html = renderMarkdown ? renderMarkdown(text, linkMap) : text;
      node.textContent = "";
      node.setAttribute("data-ai-sourced", isHardcode ? "false" : "true");
      const inner = document.createElement("div");
      inner.innerHTML = html;
      node.appendChild(inner);
    }

    hydrateAnswerEvidence(shell, evidence.section, evidence, payload, state, apiOrigin, assistant.content, evidenceController.signal, populateAnswer)
      .finally(() => {
        if (activeEvidenceController === evidenceController) activeEvidenceController = null;
        if (!answerPopulated && shell.isConnected && renderId === answerRenderId) {
          populateAnswer(assistant.content, hardcodeText);
        }
      });

    window.setTimeout(() => {
      if (!answerPopulated && shell.isConnected && renderId === answerRenderId) {
        populateAnswer(assistant.content, hardcodeText);
      }
    }, 30000);
  }

  function typeText(node, text, shouldContinue = () => true) {
    cancelTyping(node);
    node.textContent = "";
    const chunks = text.split(/(\s+)/);
    let index = 0;
    function tick() {
      if (!node.isConnected || !shouldContinue()) {
        cancelTyping(node);
        return;
      }
      const next = chunks.slice(index, index + 3).join("");
      node.textContent += next;
      index += 3;
      if (index < chunks.length) {
        const timer = window.setTimeout(tick, 18);
        typingTimers.set(node, timer);
      } else {
        typingTimers.delete(node);
      }
    }
    tick();
  }

  window.DxMetasearchAnswer = {
    cancel: abortActiveAnswerWork,
    renderAnswer,
    renderPending,
  };
})();
