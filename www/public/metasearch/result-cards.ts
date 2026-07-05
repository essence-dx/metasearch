(() => {
  const common = window.DxMetasearchResultCommon;
  const {
    compactUrl,
    createElement,
    hostname,
    metadataEntries,
    renderSnippet,
    safeHttpUrl,
  } = common;

  function resultMeta(result) {
    const items = [
      result.published_date,
      hostname(result.url),
    ].filter(Boolean);
    return items.map((item) => createElement("span", "", item));
  }

  function resultMetadataChips(result) {
    return metadataEntries(result.metadata).map(([key, value]) => createElement("span", "", `${key}: ${String(value).slice(0, 80)}`));
  }

  function markResult(node, result, index, category) {
    node.setAttribute("data-result-card", "true");
    node.setAttribute("data-result-source", "metasearch-api");
    node.setAttribute("data-result-index", String(index + 1));
    node.setAttribute("data-result-category", category);
    if (result.engine) node.setAttribute("data-result-engine", result.engine);
    return node;
  }

  function appendImage(parent, result, className) {
    const imageUrl = safeHttpUrl(result.thumbnail || result.url);
    if (!imageUrl) {
      parent.append(createElement("div", `${className} placeholder-media`));
      return;
    }
    const image = createElement("img");
    image.src = imageUrl;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    parent.append(image);
  }

  function externalLink(className, result, text) {
    const link = createElement("a", className, text);
    const href = safeHttpUrl(result.url);
    if (href) {
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    } else {
      link.setAttribute("aria-disabled", "true");
    }
    if (!text) {
      link.setAttribute("aria-label", `Open ${result.title || hostname(result.url) || "result"}`);
    }
    return link;
  }

  function titleWithHovercard(linkElement, text) {
    const wrapper = createElement("div");
    if (text) wrapper.setAttribute("data-tooltip", text);
    wrapper.style.minWidth = "0";
    wrapper.append(linkElement);
    return wrapper;
  }

  function renderImageResult(result, index, category) {
    const card = markResult(createElement("a", "image-card"), result, index, category);
    const href = safeHttpUrl(result.url);
    if (href) {
      card.href = href;
      card.target = "_blank";
      card.rel = "noreferrer noopener";
    } else {
      card.setAttribute("aria-disabled", "true");
    }
    card.setAttribute("aria-label", `Open ${result.title || hostname(result.url) || "image result"}`);
    appendImage(card, result, "image-card-placeholder");
    const overlay = createElement("span", "image-card-overlay");
    overlay.append(
      createElement("span", "image-card-title", result.title || hostname(result.url)),
      createElement("span", "image-card-source", result.engine || hostname(result.url)),
    );
    card.append(overlay);
    attachCardGlow(card);
    return card;
  }

  function renderVideoResult(result, index, category) {
    const article = markResult(createElement("article", "video-card"), result, index, category);
    const media = externalLink("video-thumb", result, "");
    appendImage(media, result, "video-thumb-placeholder");
    const overlay = createElement("span", "play-overlay");
    overlay.setAttribute("aria-hidden", "true");
    media.append(overlay);
    const content = createElement("div", "video-info");
    const meta = createElement("div", "video-meta source-row");
    meta.append(...resultMeta(result), ...resultMetadataChips(result));
    const titleText = result.title || result.url;
    content.append(titleWithHovercard(externalLink("video-title", result, titleText), titleText), meta, renderSnippet(result, category, "video-desc"));
    article.append(media, content);
    attachCardGlow(article);
    return article;
  }

  function renderNewsResult(result, index, category) {
    const article = markResult(createElement("article", "news-card"), result, index, category);
    if (result.thumbnail) {
      const media = externalLink("news-thumb", result, "");
      appendImage(media, result, "news-thumb-placeholder");
      article.append(media);
    }
    const content = createElement("div", "news-body");
    const meta = createElement("div", "source-row");
    meta.append(...resultMeta(result));
    const titleText = result.title || result.url;
    content.append(meta, titleWithHovercard(externalLink("news-title", result, titleText), titleText), renderSnippet(result, category, "news-snippet"));
    article.append(content);
    attachCardGlow(article);
    return article;
  }

  function renderMusicResult(result, index, category) {
    const article = markResult(createElement("article", "music-card"), result, index, category);
    const art = createElement("div", "music-art");
    appendImage(art, result, "music-art-placeholder");
    const content = createElement("div", "music-info");
    const meta = createElement("div", "result-tags");
    meta.append(...resultMeta(result), ...resultMetadataChips(result));
    const titleText = result.title || result.url;
    content.append(titleWithHovercard(externalLink("music-title", result, titleText), titleText), renderSnippet(result, category, "music-desc"), meta);
    article.append(art, content);
    attachCardGlow(article);
    return article;
  }

  function attachCardGlow(node) {
    const glow = window.DxMetasearchAnswerCommon?.attachHelloGlow;
    if (typeof glow === "function") glow(node);
  }

  function renderStandardResult(result, index, category) {
    const article = markResult(createElement("article", "result-card"), result, index, category);
    const meta = createElement("div", "source-row");
    meta.append(...resultMeta(result));
    const titleText = result.title || result.url;
    const title = createElement("h2");
    title.append(externalLink("", result, titleText));
    const titleWrapper = titleWithHovercard(title, titleText);
    const snippet = renderSnippet(result, category, "result-snippet");
    const display = externalLink("display-url", result, compactUrl(result.url));
    const chips = createElement("div", "result-tags");
    chips.append(...resultMetadataChips(result));
    const content = createElement("div", "result-content");
    content.append(meta, titleWrapper, snippet, display);
    if (chips.childElementCount > 0) content.append(chips);
    if (result.thumbnail) {
      const media = externalLink("result-media", result, "");
      appendImage(media, result, "result-media-placeholder");
      media.append(createElement("span", "media-source", result.engine || hostname(result.url)));
      article.append(media);
    }
    article.append(content);
    attachCardGlow(article);
    return article;
  }

  function renderResult(result, index, category) {
    if (category === "images") return renderImageResult(result, index, category);
    if (category === "videos") return renderVideoResult(result, index, category);
    if (category === "news") return renderNewsResult(result, index, category);
    if (category === "music") return renderMusicResult(result, index, category);
    return renderStandardResult(result, index, category);
  }

  window.DxMetasearchResultCards = {
    renderResult,
  };
})();
