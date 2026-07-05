(() => {
  const common = window.DxMetasearchAnswerCommon;
  const controls = window.DxMetasearchAnswerControls;
  const evidenceRenderer = window.DxMetasearchAnswerEvidence;
  const {
    buildAnswerText,
    cleanText,
    createElement,
    defaultLanguage,
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
    const user = renderMessage("user", cleanText(state.query), { speaker: true, language: state.language || defaultLanguage });
    const assistant = createElement("article", "answer-message answer-message--assistant");
    const bubble = createElement("div", "answer-bubble");
    bubble.append(createElement("p", "answer-shimmer", "Reading live results"));
    assistant.append(bubble);
    shell.append(user.message, assistant);
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
    const shimmer = createElement("p", "answer-shimmer", "Generating...");
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
      if (payload._hasAnimated) {
        node.textContent = text;
      } else {
        payload._hasAnimated = true;
        typeText(node, text, () => shell.isConnected && renderId === answerRenderId);
      }
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
    }, 12000);
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
