(() => {
  const common = window.DxMetasearchAnswerCommon;
  const {
    cleanText,
    createElement,
    defaultLanguage,
    languageLabel,
    languageOptions,
    replaceChildren,
  } = common;
  const {
    defaultTtsProvider,
    playbackState,
    toggleText,
    translateText,
    ttsKey,
    ttsProviders,
  } = window.DxMetasearchAnswerTts;

  function renderMessage(role, text, options) {
    const message = createElement("article", `answer-message answer-message--${role}`);
    if (options?.latest) message.setAttribute("data-latest", "true");
    const bubble = createElement("div", "answer-bubble");
    const content = createElement("p", "answer-text", text);
    const sourceText = options?.sourceText || text;
    content.setAttribute("data-source-text", sourceText);
    bubble.append(content);

    const actions = createElement("div", "answer-actions");
    if (role === "user") {
      actions.append(
        actionButton("Copy", "copy", () => copyText(content.textContent || text)),
        ttsPlaybackButton(actions, {
          language: () => selectedGlobalLanguage(options?.language || defaultLanguage),
          provider: () => defaultTtsProvider,
          text: () => content.textContent || text,
        }),
      );
    }
    if (options?.assistant && options?.latest) {
      actions.append(
        actionButton("Copy", "copy", () => copyText(content.textContent || text)),
        actionButton("Like", "like", (button) => togglePressed(button)),
        actionButton("Dislike", "dislike", (button) => togglePressed(button)),
        languagePicker(content, sourceText, options.language || defaultLanguage),
        ttsProviderPicker(),
        ttsPlaybackButton(actions, {
          language: () => selectedLanguage(actions),
          provider: () => selectedTtsProvider(actions),
          text: () => content.textContent || sourceText,
        }),
        createElement("span", "answer-tts-status"),
      );
    }
    message.append(bubble);
    if (actions.childElementCount > 0) {
      const footer = createElement("div", "answer-message-footer");
      footer.append(actions);
      message.append(footer);
    }
    return { message, content };
  }

  function actionButton(label, icon, onClick) {
    const button = createElement("button", "answer-action");
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip", label);
    button.setAttribute("data-answer-action", icon);
    button.append(iconNode(icon));
    button.addEventListener("click", () => {
      Promise.resolve(onClick(button)).catch(() => {});
    });
    return button;
  }

  function ttsPlaybackButton(actions, config) {
    const button = actionButton("Speak", "speaker", () => {
      return toggleText(config.text(), config.language(), config.provider(), actions);
    });
    button.setAttribute("data-tts-playback-button", "true");

    function update(detail) {
      const state = detail || playbackState?.() || {};
      const currentKey = ttsKey?.(config.text(), config.language(), config.provider());
      const isCurrent = Boolean(currentKey && state.key === currentKey);
      if (isCurrent && state.state === "playing") {
        setActionButton(button, "Pause speech", "pause", true);
        return;
      }
      if (isCurrent && state.state === "loading") {
        setActionButton(button, "Preparing speech", "pause", true);
        return;
      }
      if (isCurrent && state.state === "paused") {
        setActionButton(button, "Play speech", "play", false);
        return;
      }
      setActionButton(button, "Speak", "speaker", false);
    }

    window.addEventListener("dx:metasearch-tts-state", (event) => update(event.detail));
    window.addEventListener("dx:metasearch-language-change", () => update(playbackState?.()));
    update(playbackState?.());
    return button;
  }

  function setActionButton(button, label, icon, pressed) {
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(pressed));
    button.setAttribute("data-tooltip", label);
    button.setAttribute("data-answer-action", icon);
    replaceChildren(button, [iconNode(icon)]);
  }

  function iconNode(icon) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "ui-icon");
    svg.setAttribute("data-dx-icon", icon);
    svg.setAttribute("data-icon-source", "dx-icons");
    svg.setAttribute("viewBox", "0 0 24 24");
    const paths = {
      copy: ["M8 8h11v11H8V8Z", "M5 16H4a1 1 0 0 1-1-1V4h11v1"],
      like: ["M7 11v9H4v-9h3Z", "M7 11l4-8 1 1v5h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7"],
      dislike: ["M7 13V4H4v9h3Z", "M7 13l4 8 1-1v-5h6a2 2 0 0 0 2-2l-2-7a2 2 0 0 0-2-2H7"],
      pause: ["M7 5h3v14H7V5Z", "M14 5h3v14h-3V5Z"],
      play: ["M8 5v14l11-7L8 5Z"],
      speaker: ["M4 10v4h4l5 4V6l-5 4H4Z", "M16 9a4 4 0 0 1 0 6"],
      "chevron-down": ["m6 9 6 6 6-6"],
      language: ["M4 5h10", "M9 3v2", "M7 5c.8 2.5 2.6 4.6 5 6", "M13 5c-.8 2.5-2.6 4.6-5 6", "M5 13h6", "m14 21 1.2-3h4.6l1.2 3", "M16 15h3", "m17.5 12 2.3 6"],
      check: ["m5 12 4 4L19 6"],
    }[icon] || ["M12 5v14", "M5 12h14"];

    for (const d of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }

  function togglePressed(button) {
    const pressed = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!pressed));
  }

  function languagePicker(content, sourceText, language) {
    const picker = createElement("div", "answer-language-picker");
    const initialLanguage = language || defaultLanguage;
    picker.setAttribute("data-language", initialLanguage);

    const trigger = createElement("button", "answer-language-trigger");
    trigger.type = "button";
    trigger.title = "Translate answer";
    trigger.setAttribute("aria-label", "Translate answer");
    trigger.setAttribute("data-tooltip", "Translate answer");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const label = createElement("span", "answer-language-trigger-label", languageLabel(initialLanguage));
    trigger.append(iconNode("language"), label, iconNode("chevron-down"));

    const panel = createElement("div", "answer-language-panel");
    panel.hidden = true;
    const search = createElement("input", "answer-language-search");
    search.type = "search";
    search.placeholder = `Search ${languageOptions().length} languages`;
    search.setAttribute("aria-label", "Search translation languages");
    const list = createElement("div", "answer-language-list");
    list.setAttribute("role", "listbox");
    const status = createElement("span", "answer-language-status");
    panel.append(search, list, status);

    function setOpen(open) {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      picker.classList.toggle("is-open", open);
      if (open) {
        renderOptions(search.value);
        window.setTimeout(() => search.focus(), 0);
      }
    }

    function renderOptions(filter) {
      const query = cleanText(filter).toLowerCase();
      const currentLanguage = picker.getAttribute("data-language") || defaultLanguage;
      const matches = languageOptions().filter(([languageCode, languageName]) => {
        const haystack = `${languageName} ${languageCode}`.toLowerCase();
        return !query || haystack.includes(query);
      });

      if (matches.length === 0) {
        replaceChildren(list, [createElement("span", "answer-language-empty", "No languages found")]);
        return;
      }

      replaceChildren(
        list,
        matches.map(([languageCode, languageName]) => {
          const option = createElement("button", "answer-language-option");
          option.type = "button";
          option.setAttribute("role", "option");
          option.setAttribute("aria-selected", String(languageCode === currentLanguage));
          option.setAttribute("data-language-code", languageCode);
          option.append(createElement("span", "", languageName));
          if (languageCode === currentLanguage) option.append(iconNode("check"));
          option.addEventListener("click", () => selectLanguage(languageCode, languageName));
          return option;
        }),
      );
    }

    async function selectLanguage(targetLanguage, targetLabel) {
      const currentSourceText = content.getAttribute("data-source-text") || sourceText;
      picker.setAttribute("data-language", targetLanguage);
      setGlobalLanguage(targetLanguage);
      label.textContent = targetLabel;
      status.textContent = "";
      setOpen(false);

      if (targetLanguage === defaultLanguage) {
        content.textContent = currentSourceText;
        return;
      }

      trigger.disabled = true;
      content.setAttribute("data-translating", "true");
      status.textContent = `Translating to ${targetLabel}`;
      try {
        content.textContent = await translateText(currentSourceText, targetLanguage);
        status.textContent = `Translated to ${targetLabel}`;
      } catch {
        content.textContent = currentSourceText;
        picker.setAttribute("data-language", targetLanguage);
        label.textContent = targetLabel;
        setGlobalLanguage(targetLanguage);
        status.textContent = `Translation unavailable; speech remains ${targetLabel}`;
      } finally {
        content.removeAttribute("data-translating");
        trigger.disabled = false;
      }
    }

    trigger.addEventListener("click", () => setOpen(panel.hidden));
    search.addEventListener("input", () => renderOptions(search.value));
    picker.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) setOpen(false);
    });

    picker.append(trigger, panel);
    return picker;
  }

  function selectedLanguage(actions) {
    const picker = actions.querySelector(".answer-language-picker");
    return picker ? picker.getAttribute("data-language") || selectedGlobalLanguage(defaultLanguage) : selectedGlobalLanguage(defaultLanguage);
  }

  function selectedGlobalLanguage(fallback) {
    return window.DxMetasearchI18n?.selectedLanguage || fallback || defaultLanguage;
  }

  function setGlobalLanguage(language) {
    window.DxMetasearchI18n = Object.assign(window.DxMetasearchI18n || {}, {
      selectedLanguage: language || defaultLanguage,
    });
    window.dispatchEvent(new CustomEvent("dx:metasearch-language-change", {
      detail: { language: window.DxMetasearchI18n.selectedLanguage },
    }));
  }

  function ttsProviderPicker() {
    const picker = createElement("div", "answer-tts-provider-picker");
    picker.setAttribute("data-tts-provider", defaultTtsProvider);

    const trigger = createElement("button", "answer-tts-provider-trigger");
    trigger.type = "button";
    trigger.title = "TTS provider";
    trigger.setAttribute("aria-label", "TTS provider");
    trigger.setAttribute("data-tooltip", "TTS provider");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const current = ttsProviderById(defaultTtsProvider);
    const label = createElement("span", "answer-tts-provider-label", current.label);
    trigger.append(label, iconNode("chevron-down"));

    const panel = createElement("div", "answer-tts-provider-panel");
    panel.hidden = true;
    panel.setAttribute("role", "listbox");

    function setOpen(open) {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      picker.classList.toggle("is-open", open);
    }

    function selectProvider(provider) {
      picker.setAttribute("data-tts-provider", provider.id);
      label.textContent = provider.label;
      setOpen(false);
      renderOptions();
    }

    function renderOptions() {
      const activeProvider = picker.getAttribute("data-tts-provider") || defaultTtsProvider;
      replaceChildren(
        panel,
        ttsProviders.map((provider) => {
          const option = createElement("button", "answer-tts-provider-option");
          option.type = "button";
          option.setAttribute("role", "option");
          option.setAttribute("aria-selected", String(provider.id === activeProvider));
          option.setAttribute("data-tts-provider-option", provider.id);
          option.append(
            createElement("span", "answer-tts-provider-option-label", provider.label),
            createElement("span", "answer-tts-provider-option-description", provider.description),
          );
          option.addEventListener("click", () => selectProvider(provider));
          return option;
        }),
      );
    }

    trigger.addEventListener("click", () => setOpen(panel.hidden));
    picker.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) setOpen(false);
    });

    renderOptions();
    picker.append(trigger, panel);
    return picker;
  }

  function ttsProviderById(providerId) {
    return ttsProviders.find((provider) => provider.id === providerId) || ttsProviders[0];
  }

  function selectedTtsProvider(actions) {
    const picker = actions.querySelector(".answer-tts-provider-picker");
    return picker ? picker.getAttribute("data-tts-provider") || defaultTtsProvider : defaultTtsProvider;
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  }

  window.DxMetasearchAnswerControls = {
    renderMessage,
  };
})();
