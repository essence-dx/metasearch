(() => {
  const common = window.DxMetasearchAnswerCommon;
  const {
    attachHelloGlow,
    cleanText,
    createElement,
    hostname,
    safeHttpUrl,
    truncate,
  } = common;

  const mediaVolume = 0.05;
  let statusId = 0;

  const fallbackMedia = {
    image: {
      title: "Search context image",
      source: "Unsplash",
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82",
    },
  };

  function mediaHostIsAllowed(value) {
    const candidate = safeHttpUrl(value);
    if (!candidate) return false;
    try {
      const url = new URL(candidate, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function supportedMediaType(kind, value) {
    const url = String(value || "");
    const extension = (url.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1] || "").toLowerCase();
    const mimeTypes = {
      audio: {
        m4a: "audio/mp4",
        mp3: "audio/mpeg",
        ogg: "audio/ogg",
        wav: "audio/wav",
      },
      video: {
        mp4: "video/mp4",
        webm: "video/webm",
      },
    }[kind] || {};
    const mimeType = mimeTypes[extension];
    if (!mimeType) return false;
    const media = document.createElement(kind);
    return !media.canPlayType || media.canPlayType(mimeType) !== "";
  }

  function playableVideoUrl(result) {
    const url = safeHttpUrl(result?.url);
    return mediaHostIsAllowed(url) && supportedMediaType("video", url) ? url : "";
  }

  function playableAudioUrl(result) {
    const url = safeHttpUrl(result?.url);
    return mediaHostIsAllowed(url) && supportedMediaType("audio", url) ? url : "";
  }

  function playableImageUrl(result) {
    const url = safeHttpUrl(result?.url);
    return /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(url) ? url : "";
  }

  function imageUrl(result) {
    const category = String(result?.category || "").toLowerCase();
    return safeHttpUrl(result?.thumbnail) || (category === "images" ? safeHttpUrl(result?.url) : playableImageUrl(result));
  }

  function mediaResults(payload) {
    return Array.isArray(payload?.results) ? payload.results : [];
  }

  function hasMediaEvidence(payload) {
    return mediaResults(payload).some((result) => {
      const category = String(result?.category || "").toLowerCase();
      return category === "images" || category === "videos" || category === "music" || imageUrl(result) || playableVideoUrl(result) || playableAudioUrl(result);
    });
  }

  function selectImage(payload) {
    const result = mediaResults(payload).find((item) => {
      const category = String(item.category || "").toLowerCase();
      return category === "images" || imageUrl(item);
    });
    return {
      title: truncate(result?.title || fallbackMedia.image.title, 82),
      source: result?.engine || hostname(result?.url) || fallbackMedia.image.source,
      url: imageUrl(result) || fallbackMedia.image.url,
      href: safeHttpUrl(result?.url) || fallbackMedia.image.url,
    };
  }

  function mediaItemKey(item) {
    return safeHttpUrl(item?.href || item?.url || item?.src) || cleanText(item?.title);
  }

  function uniqueItems(items, limit) {
    const seen = new Set();
    const selected = [];
    for (const item of items) {
      const key = mediaItemKey(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      selected.push(item);
      if (selected.length >= limit) break;
    }
    return selected;
  }

  function withoutItem(items, excluded) {
    const excludedKey = mediaItemKey(excluded);
    if (!excludedKey) return items;
    return items.filter((item) => mediaItemKey(item) !== excludedKey);
  }

  function selectImages(payload, limit = 6) {
    const items = mediaResults(payload)
      .map((result) => {
        const url = imageUrl(result);
        if (!url) return null;
        return {
          title: resultTitle(result, "Image result", 72),
          source: resultSource(result, "Image"),
          url,
          href: safeHttpUrl(result?.url) || url,
        };
      })
      .filter(Boolean);
    return uniqueItems(items, limit);
  }

  function resultTitle(result, fallback, limit = 88) {
    return truncate(cleanText(result?.title) || safeHttpUrl(result?.url) || fallback, limit);
  }

  function resultSource(result, fallback) {
    return result?.engine || hostname(result?.url) || fallback;
  }

  function selectVideo(payload) {
    const source = mediaResults(payload).find((item) => playableVideoUrl(item));
    if (source) {
      return {
        mode: "player",
        title: resultTitle(source, "Video result"),
        source: resultSource(source, "Video"),
        src: playableVideoUrl(source),
        poster: imageUrl(source) || fallbackMedia.image.url,
        href: safeHttpUrl(source?.url),
      };
    }
    const result = mediaResults(payload).find((item) => String(item?.category || "").toLowerCase() === "videos");
    if (!result) return null;
    return {
      mode: "source",
      title: resultTitle(result, "Video result"),
      source: resultSource(result, "Video"),
      poster: imageUrl(result) || fallbackMedia.image.url,
      href: safeHttpUrl(result?.url),
    };
  }

  function selectVideos(payload, limit = 6) {
    const items = mediaResults(payload)
      .filter((result) => String(result?.category || "").toLowerCase() === "videos" || playableVideoUrl(result))
      .map((result) => {
        const href = safeHttpUrl(result?.url);
        if (!href) return null;
        return {
          title: resultTitle(result, "Video result", 72),
          source: resultSource(result, "Video"),
          poster: imageUrl(result),
          href,
        };
      })
      .filter(Boolean);
    return uniqueItems(items, limit);
  }

  function selectAudio(payload) {
    const source = mediaResults(payload).find((item) => playableAudioUrl(item));
    if (source) {
      const title = resultTitle(source, "Audio result");
      return {
        mode: "player",
        title,
        source: resultSource(source, "Audio"),
        src: playableAudioUrl(source),
        href: safeHttpUrl(source?.url),
        gradient: gradientForText(title),
      };
    }
    const result = mediaResults(payload).find((item) => String(item?.category || "").toLowerCase() === "music");
    if (!result) return null;
    const title = resultTitle(result, "Audio result");
    return {
      mode: "source",
      title,
      source: resultSource(result, "Audio"),
      href: safeHttpUrl(result?.url),
      gradient: gradientForText(title),
    };
  }

  function hashText(value) {
    let hash = 2166136261;
    for (const char of String(value || "audio")) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function gradientForText(value) {
    const seed = hashText(value);
    const hueA = seed % 360;
    const hueB = (hueA + 72 + ((seed >>> 8) % 84)) % 360;
    const hueC = (hueB + 96 + ((seed >>> 16) % 72)) % 360;
    return `linear-gradient(135deg, hsl(${hueA} 82% 52%), hsl(${hueB} 86% 46%) 52%, hsl(${hueC} 78% 58%))`;
  }

  function formatMediaTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    const remainder = String(whole % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function mediaIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "answer-media-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    const paths = {
      play: ["M8 5v14l11-7-11-7Z"],
      pause: ["M7 5h4v14H7V5Z", "M13 5h4v14h-4V5Z"],
      rotate: ["M4 12a8 8 0 0 1 13.6-5.7", "M18 3v5h-5", "M20 12a8 8 0 0 1-13.6 5.7", "M6 21v-5h5"],
      reset: ["M5 12a7 7 0 1 0 2-5", "M5 5v5h5"],
      volume: ["M4 9v6h4l5 4V5L8 9H4Z", "M16 9.5a4 4 0 0 1 0 5"],
      volumeOff: ["M4 9v6h4l5 4V5L8 9H4Z", "M19 9l-6 6", "M13 9l6 6"],
      video: ["M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z", "M16 10l6-4v12l-6-4v-4Z"],
      external: ["M14 3h7v7", "M10 14 21 3", "M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"],
    }[name] || ["M12 5v14", "M5 12h14"];

    for (const d of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }

  function mediaButton(label, iconName) {
    const button = createElement("button", "answer-media-button");
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip", label);
    button.append(mediaIcon(iconName));
    return button;
  }

  function setButtonIcon(button, iconName) {
    button.replaceChildren(mediaIcon(iconName));
  }

  function syncMediaProgress(media, progress, time) {
    const duration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : 0;
    const current = Number.isFinite(media.currentTime) ? media.currentTime : 0;
    const percent = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;
    const currentText = formatMediaTime(current);
    const durationText = formatMediaTime(duration);
    progress.value = String(percent);
    progress.style.setProperty("--progress", `${percent}%`);
    progress.setAttribute("aria-valuetext", `${currentText} of ${durationText}`);
    time.textContent = `${currentText} / ${durationText}`;
  }

  function seekMedia(media, progress) {
    const duration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : 0;
    if (duration <= 0) return;
    media.currentTime = (Number(progress.value || 0) / 100) * duration;
  }

  function pauseAllAnswerMedia(except) {
    for (const media of document.querySelectorAll(".answer-media-stage video,.answer-media-stage audio")) {
      if (media === except) continue;
      media.pause?.();
    }
  }

  function announceMediaSessionStart(media) {
    pauseAllAnswerMedia(media);
    window.dispatchEvent(new CustomEvent("dx:metasearch-media-start", { detail: { media } }));
  }

  function toggleMediaPlayback(media) {
    if (media.paused) {
      announceMediaSessionStart(media);
      return media.play?.();
    }
    media.pause();
    return undefined;
  }

  window.addEventListener("dx:metasearch-tts-start", () => pauseAllAnswerMedia());

  function createMediaStatus(message = "") {
    const status = createElement("span", "answer-media-status", message);
    status.id = `answer-media-status-${(statusId += 1)}`;
    status.dataset.answerMediaDefaultStatus = message;
    status.setAttribute("aria-live", "polite");
    return status;
  }

  function reportMediaFailure(status, toggle, progress, message, terminal = false) {
    status.textContent = message;
    toggle.setAttribute("data-error", "true");
    if (terminal) {
      toggle.disabled = true;
      progress.disabled = true;
    }
  }

  function clearMediaFailure(status, toggle, progress) {
    status.textContent = status.dataset.answerMediaDefaultStatus || "";
    toggle.removeAttribute("data-error");
    toggle.disabled = false;
    progress.disabled = false;
  }

  function bindMediaFailureState(media, status, toggle, progress, label) {
    media.setAttribute("aria-describedby", status.id);
    toggle.setAttribute("aria-describedby", status.id);
    progress.setAttribute("aria-describedby", status.id);
    media.addEventListener("error", () => {
      reportMediaFailure(status, toggle, progress, `${label} could not be played.`, true);
    });
    media.addEventListener("stalled", () => {
      reportMediaFailure(status, toggle, progress, `${label} is waiting for media data.`);
    });
    media.addEventListener("abort", () => {
      reportMediaFailure(status, toggle, progress, `${label} playback stopped before loading.`);
    });
    media.addEventListener("loadedmetadata", () => clearMediaFailure(status, toggle, progress));
    media.addEventListener("canplay", () => clearMediaFailure(status, toggle, progress));
    media.addEventListener("play", () => clearMediaFailure(status, toggle, progress));
    media.addEventListener("playing", () => clearMediaFailure(status, toggle, progress));
    media.addEventListener("timeupdate", () => {
      if (!media.paused && !media.ended) clearMediaFailure(status, toggle, progress);
    });
  }

  function syncMediaVolume(media, button, volume) {
    const muted = Boolean(media.muted || media.volume === 0);
    const percent = muted ? 0 : Math.round(media.volume * 100);
    button.title = muted ? "Unmute" : "Mute";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(muted));
    setButtonIcon(button, muted ? "volumeOff" : "volume");
    volume.value = String(percent);
    volume.style.setProperty("--progress", `${percent}%`);
    volume.setAttribute("aria-valuetext", `${percent}% volume`);
  }

  function renderVolumeControl(media) {
    const volumeGroup = createElement("div", "answer-media-volume");
    volumeGroup.setAttribute("data-answer-media-volume", "true");
    const toggle = mediaButton("Mute", "volume");
    const volume = createElement("input", "answer-media-progress answer-media-volume-range");
    volume.type = "range";
    volume.min = "0";
    volume.max = "100";
    volume.step = "1";
    volume.setAttribute("aria-label", "Volume");
    volume.addEventListener("input", () => {
      media.muted = false;
      media.volume = Math.min(1, Math.max(0, Number(volume.value || 0) / 100));
      syncMediaVolume(media, toggle, volume);
    });
    toggle.addEventListener("click", () => {
      if (media.muted || media.volume === 0) {
        media.muted = false;
        if (media.volume === 0) media.volume = mediaVolume;
      } else {
        media.muted = true;
      }
      syncMediaVolume(media, toggle, volume);
    });
    media.addEventListener("volumechange", () => syncMediaVolume(media, toggle, volume));
    volumeGroup.append(toggle, volume);
    syncMediaVolume(media, toggle, volume);
    return volumeGroup;
  }

  function mediaStageIsActive(stage) {
    const mediaItems = [...stage.querySelectorAll("video,audio")];
    return mediaItems.some((media) => (!media.paused && !media.ended) || media.currentTime > 0) || currentStageHasFocus(stage);
  }

  function currentStageHasFocus(stage) {
    return Boolean(document.activeElement && stage.contains(document.activeElement));
  }

  function disposeAnswerMediaStage(stage) {
    if (!stage) return;
    for (const media of stage.querySelectorAll("video,audio")) {
      media.pause?.();
      media.removeAttribute("src");
      media.load?.();
    }
    for (const panel of stage.querySelectorAll("[data-answer-media-disposable='true']")) {
      panel.disposeAnswerMedia?.();
    }
  }

  function attachMediaGlow(panel) {
    const removeGlow = attachHelloGlow(panel);
    if (typeof removeGlow !== "function") return () => {};
    panel.setAttribute("data-answer-media-disposable", "true");
    panel.disposeAnswerMedia = removeGlow;
    return removeGlow;
  }

  function appendMeta(parent, title, source) {
    const body = createElement("div", "answer-media-panel-body");
    body.append(createElement("strong", "", title));
    if (cleanText(source)) body.append(createElement("span", "", source));
    parent.append(body);
  }

  function audioArtLabel(item) {
    return cleanText(item?.source || item?.title || "Audio").match(/[a-z0-9]/i)?.[0]?.toUpperCase() || "A";
  }

  function renderImagePlayer(payload, selectedItem = selectImage(payload)) {
    const item = selectedItem;
    const article = createElement("article", "answer-media-panel answer-image-player");
    const link = createElement("a", "answer-image-frame");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.setAttribute("aria-label", `Open ${item.title}`);
    const image = createElement("img");
    image.src = item.url;
    image.alt = item.title;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    link.append(image, createElement("span", "answer-image-badge", item.source));
    article.append(link);
    appendMeta(article, item.title, item.source);
    attachMediaGlow(article);
    return article;
  }

  function renderMediaGalleryCard(item, kind) {
    const card = createElement(item.href ? "a" : "div", "answer-media-gallery-card");
    if (item.href) {
      card.href = item.href;
      card.target = "_blank";
      card.rel = "noreferrer noopener";
      card.setAttribute("aria-label", `Open ${item.title}`);
    }

    const visual = createElement("span", "answer-media-gallery-visual");
    const imageUrlValue = kind === "video" ? item.poster : item.url;
    if (imageUrlValue) {
      const image = createElement("img");
      image.src = imageUrlValue;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      visual.append(image);
    } else {
      visual.append(mediaIcon(kind === "video" ? "video" : "external"));
    }
    if (kind === "video") visual.append(createElement("span", "answer-media-gallery-play", ""));

    card.append(
      visual,
      createElement("span", "answer-media-gallery-title", item.title),
      createElement("span", "answer-media-gallery-source", item.source),
    );
    return card;
  }

  function renderMediaGallery(title, className, items, kind) {
    if (!items.length) return null;
    const article = createElement("article", `answer-media-panel answer-media-gallery ${className}`);
    const header = createElement("div", "answer-media-gallery-header");
    header.append(
      createElement("strong", "", title),
      createElement("span", "", `${items.length} result${items.length === 1 ? "" : "s"}`),
    );
    const grid = createElement("div", "answer-media-gallery-grid");
    for (const item of items) grid.append(renderMediaGalleryCard(item, kind));
    article.append(header, grid);
    attachMediaGlow(article);
    return article;
  }

  function renderImageGallery(payload, featuredImage) {
    const items = withoutItem(selectImages(payload), featuredImage).slice(0, 5);
    return renderMediaGallery("Images", "answer-image-gallery", items, "image");
  }

  function renderVideoGallery(payload, featuredVideo) {
    const items = withoutItem(selectVideos(payload), featuredVideo).slice(0, 5);
    return renderMediaGallery("Videos", "answer-video-gallery", items, "video");
  }

  function renderSourceAction(label, external = true) {
    const action = createElement("span", "answer-source-action");
    action.append(createElement("span", "", label));
    if (external) action.append(mediaIcon("external"));
    return action;
  }

  function renderVideoControls(video, poster, status) {
    const controls = createElement("div", "answer-media-controls answer-video-controls");
    const toggle = mediaButton("Play video", "play");
    toggle.setAttribute("data-answer-video-toggle", "true");
    const progress = createElement("input", "answer-media-progress");
    progress.type = "range";
    progress.min = "0";
    progress.max = "100";
    progress.step = "0.1";
    progress.value = "0";
    progress.setAttribute("data-answer-video-progress", "true");
    progress.setAttribute("aria-label", "Seek video");
    const time = createElement("span", "answer-media-time", "0:00 / 0:00");
    bindMediaFailureState(video, status, toggle, progress, "Video");

    function updatePlayState() {
      const playing = !video.paused && !video.ended;
      toggle.title = playing ? "Pause video" : "Play video";
      toggle.setAttribute("aria-label", toggle.title);
      controls.setAttribute("data-playing", String(playing));
      setButtonIcon(toggle, playing ? "pause" : "play");
      poster.hidden = playing || video.currentTime > 0;
    }

    toggle.addEventListener("click", () => {
      Promise.resolve(toggleMediaPlayback(video)).catch(() => {
        reportMediaFailure(status, toggle, progress, "Video playback did not start.");
      });
    });
    poster.addEventListener("click", () => {
      announceMediaSessionStart(video);
      Promise.resolve(video.play?.()).catch(() => {
        reportMediaFailure(status, toggle, progress, "Video playback did not start.");
      });
    });
    progress.addEventListener("input", () => seekMedia(video, progress));
    for (const eventName of ["loadedmetadata", "durationchange", "timeupdate", "seeking"]) {
      video.addEventListener(eventName, () => syncMediaProgress(video, progress, time));
    }
    for (const eventName of ["play", "pause", "ended"]) {
      video.addEventListener(eventName, updatePlayState);
    }

    controls.append(toggle, progress, time, renderVolumeControl(video), status);
    syncMediaProgress(video, progress, time);
    updatePlayState();
    return controls;
  }

  function renderVideoPlayer(payload, state, selectedItem = selectVideo(payload, state)) {
    const item = selectedItem;
    if (!item) return null;
    if (item.mode === "source") return renderVideoSourceCard(item);
    const article = createElement("article", "answer-media-panel answer-video-player");
    const frame = createElement("div", "answer-video-frame");
    const video = createElement("video", "answer-video-element");
    const poster = createElement("button", "answer-video-poster");
    const posterImage = createElement("img");
    const status = createMediaStatus();

    video.controls = false;
    video.playsInline = true;
    video.preload = "none";
    video.poster = item.poster;
    video.src = item.src;
    video.volume = mediaVolume;
    video.setAttribute("aria-label", item.title);

    poster.type = "button";
    poster.setAttribute("aria-label", `Play ${item.title}`);
    posterImage.src = item.poster;
    posterImage.alt = "";
    posterImage.loading = "lazy";
    posterImage.decoding = "async";
    posterImage.referrerPolicy = "no-referrer";
    poster.append(posterImage, mediaIcon("play"));

    frame.append(video, poster, createElement("span", "answer-video-badge", item.source), renderVideoControls(video, poster, status));
    article.append(frame);
    appendMeta(article, item.title, item.source);
    attachMediaGlow(article);
    return article;
  }

  function renderVideoSourceCard(item) {
    const article = createElement("article", "answer-media-panel answer-video-player answer-video-source-card");
    const frame = createElement(item.href ? "a" : "div", "answer-video-frame answer-video-source-frame");
    const visual = createElement("div", "answer-video-source-visual");
    if (item.href) {
      frame.href = item.href;
      frame.target = "_blank";
      frame.rel = "noreferrer noopener";
      frame.setAttribute("aria-label", `Open ${item.title}`);
    }
    if (item.poster) {
      const image = createElement("img");
      image.src = item.poster;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      visual.append(image);
    } else {
      visual.append(mediaIcon("video"));
    }
    frame.append(visual, createElement("span", "answer-video-badge", item.source), renderSourceAction(item.href ? "Open video source" : "Video source", Boolean(item.href)));
    article.append(frame);
    appendMeta(article, item.title, item.source);
    attachMediaGlow(article);
    return article;
  }

  function createAudioWaveform(label) {
    const waveform = createElement("div", "answer-audio-waveform");
    waveform.setAttribute("aria-hidden", "true");
    const seed = hashText(label);
    for (let index = 0; index < 18; index += 1) {
      const bar = createElement("span");
      const height = 22 + ((seed >>> (index % 16)) + index * 11) % 54;
      bar.style.setProperty("--bar-height", `${height}%`);
      waveform.append(bar);
    }
    return waveform;
  }

  function renderAudioControls(audio, status) {
    const controls = createElement("div", "answer-media-controls answer-audio-controls");
    const toggle = mediaButton("Play audio", "play");
    toggle.setAttribute("data-answer-audio-toggle", "true");
    const progress = createElement("input", "answer-media-progress");
    progress.type = "range";
    progress.min = "0";
    progress.max = "100";
    progress.step = "0.1";
    progress.value = "0";
    progress.setAttribute("data-answer-audio-progress", "true");
    progress.setAttribute("aria-label", "Seek audio");
    const time = createElement("span", "answer-media-time", "0:00 / 0:00");
    bindMediaFailureState(audio, status, toggle, progress, "Audio");

    function updatePlayState() {
      const playing = !audio.paused && !audio.ended;
      toggle.title = playing ? "Pause audio" : "Play audio";
      toggle.setAttribute("aria-label", toggle.title);
      controls.setAttribute("data-playing", String(playing));
      setButtonIcon(toggle, playing ? "pause" : "play");
    }

    toggle.addEventListener("click", () => {
      Promise.resolve(toggleMediaPlayback(audio)).catch(() => {
        reportMediaFailure(status, toggle, progress, "Audio playback did not start.");
      });
    });
    progress.addEventListener("input", () => seekMedia(audio, progress));
    for (const eventName of ["loadedmetadata", "durationchange", "timeupdate", "seeking"]) {
      audio.addEventListener(eventName, () => syncMediaProgress(audio, progress, time));
    }
    for (const eventName of ["play", "pause", "ended"]) {
      audio.addEventListener(eventName, updatePlayState);
    }

    controls.append(toggle, progress, time, renderVolumeControl(audio), status);
    syncMediaProgress(audio, progress, time);
    updatePlayState();
    return controls;
  }

  function renderAudioPlayer(payload, state) {
    const item = selectAudio(payload, state);
    if (!item) return null;
    if (item.mode === "source") return renderAudioSourceCard(item);
    const article = createElement("article", "answer-media-panel answer-audio-player");
    const art = createElement("div", "answer-audio-art");
    art.style.background = item.gradient;
    art.setAttribute("aria-hidden", "true");
    art.append(createElement("span", "", audioArtLabel(item)), createAudioWaveform(item.title));

    const content = createElement("div", "answer-audio-content");
    const audio = createElement("audio", "answer-audio-element");
    const audioStatus = createMediaStatus();
    audio.controls = false;
    audio.preload = "none";
    audio.src = item.src;
    audio.volume = mediaVolume;
    audio.setAttribute("aria-label", item.title);
    content.append(createElement("strong", "", item.title), createElement("span", "", item.source), audio, renderAudioControls(audio, audioStatus));
    article.append(art, content);
    attachMediaGlow(article);
    return article;
  }

  function renderAudioSourceCard(item) {
    const article = createElement("article", "answer-media-panel answer-audio-player answer-audio-source-card");
    const art = createElement("div", "answer-audio-art");
    art.style.background = item.gradient;
    art.setAttribute("aria-hidden", "true");
    art.append(createElement("span", "", audioArtLabel(item)), createAudioWaveform(item.title));

    const content = createElement("div", "answer-audio-content");
    content.append(createElement("strong", "", item.title), createElement("span", "", item.source));
    article.append(art, content);
    attachMediaGlow(article);
    return article;
  }

  function renderAnswerMediaStage(payload, state) {
    if (!hasMediaEvidence(payload)) return null;
    const section = createElement("section", "answer-media-stage");
    section.setAttribute("data-answer-media-stage", "true");
    section.setAttribute("aria-label", "Answer media");
    const primary = createElement("div", "answer-media-primary");
    const secondary = createElement("div", "answer-media-secondary");
    const featuredVideo = selectVideo(payload, state);
    const featuredImage = selectImage(payload);
    const imageGallery = renderImageGallery(payload, featuredImage);
    const videoGallery = renderVideoGallery(payload, featuredVideo);
    const panels = [
      renderVideoPlayer(payload, state, featuredVideo),
      imageGallery ? null : renderImagePlayer(payload, featuredImage),
      imageGallery,
      videoGallery,
      renderAudioPlayer(payload, state),
    ].filter(Boolean);
    if (!panels.length) return null;
    for (const panel of panels) {
      if (!primary.childElementCount) primary.append(panel);
      else secondary.append(panel);
    }
    section.append(primary);
    if (secondary.childElementCount) section.append(secondary);
    return section;
  }

  function hydrateAnswerMediaStage(shell, payload, state, mediaAnchor) {
    const current = shell?.querySelector?.("[data-answer-media-stage]");
    const next = renderAnswerMediaStage(payload, state);
    if (!current) {
      if (next) mediaAnchor?.before(next);
      return;
    }
    if (mediaStageIsActive(current) || current.contains(document.activeElement)) return;
    disposeAnswerMediaStage(current);
    if (next) current.replaceWith(next);
    else current.remove();
  }

  window.DxMetasearchAnswerMedia = {
    disposeAnswerMediaStage,
    gradientForText,
    hydrateAnswerMediaStage,
    renderAnswerMediaStage,
  };
})();
