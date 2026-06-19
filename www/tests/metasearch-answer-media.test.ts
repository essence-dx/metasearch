import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toBe(expected: TValue): void;
  toContain(expected: string): void;
};

function readOptional(path: string) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const pageSource = readOptional("app/page.tsx");
const mediaSource = readOptional("public/metasearch/answer-media.ts");
const commonSource = readOptional("public/metasearch/answer-common.ts");
const evidenceSource = readOptional("public/metasearch/answer-evidence.ts");
const rendererSource = readOptional("public/metasearch/answer-renderer.ts");
const resultsRendererSource = readOptional("public/metasearch/results-renderer.ts");
const runtimeSource = readOptional("public/metasearch/runtime.ts");
const stylesSource = readOptional("styles/results.css");
const vercelConfig = readOptional("vercel.json");
const readme = readOptional("README.md");

test("answer page loads dedicated media runtime before the answer renderer", () => {
  expect(pageSource).toContain("/public/metasearch/answer-media.ts");
  expect(pageSource.indexOf("/public/metasearch/answer-media.ts") < pageSource.indexOf("/public/metasearch/answer-renderer.ts")).toBe(true);
  expect(pageSource.includes("/public/metasearch/answer-three.ts")).toBe(false);
});

test("default showcase media uses filled image framing, plain audio gradient, and playable local video", () => {
  expect(pageSource).toContain("/public/metasearch/media/default-preview.mp4");
  expect(pageSource.includes("default-audio-visual")).toBe(false);
  expect(stylesSource.includes(".default-audio-visual")).toBe(false);
  expect(stylesSource).toContain(".default-media-card--image");
  expect(stylesSource).toContain("display: block;");
  expect(stylesSource).toContain("height: 100%;");
  expect(pageSource.includes("default-media-card--three")).toBe(false);
  expect(stylesSource.includes(".default-media-card--three")).toBe(false);
  expect(stylesSource.includes(".default-three-cube")).toBe(false);
  expect(runtimeSource).toContain("randomAudioGradient");
  expect(runtimeSource).toContain("linear-gradient(${angle}deg");
});

test("answer media stage renders source-backed image, video, and audio panels", () => {
  expect(mediaSource).toContain("renderAnswerMediaStage");
  expect(mediaSource).toContain("hasMediaEvidence");
  expect(mediaSource).toContain("if (!hasMediaEvidence(payload)) return null");
  expect(mediaSource).toContain("answer-media-stage");
  expect(mediaSource).toContain("answer-video-player");
  expect(mediaSource).toContain("renderVideoSourceCard");
  expect(mediaSource).toContain("renderImageGallery");
  expect(mediaSource).toContain("renderVideoGallery");
  expect(mediaSource).toContain("answer-media-gallery");
  expect(mediaSource).toContain("answer-audio-player");
  expect(mediaSource).toContain("renderAudioSourceCard");
  expect(mediaSource).toContain("answer-image-player");
  expect(mediaSource.includes("renderThreePlayer(payload, state),")).toBe(false);
  expect(mediaSource).toContain("for (const panel of panels)");
});

test("answer media does not expose source-only audio links or hardcoded 3D panels", () => {
  expect(mediaSource.includes("Open audio source")).toBe(false);
  expect(mediaSource.includes("renderThreePlayer(payload, state),")).toBe(false);
  expect(pageSource.includes("default-three-cube")).toBe(false);
  expect(pageSource.includes("3D preview")).toBe(false);
});

test("answer media does not expose branded placeholder labels as result data", () => {
  const brand = "D" + "X";
  expect(/source:\s*"DX\b/.test(mediaSource)).toBe(false);
  expect(/String\(value \|\| "DX\b/.test(mediaSource)).toBe(false);
  expect(/createElement\("span", "", "DX"\)/.test(mediaSource)).toBe(false);
  expect(new RegExp(`Static ${brand}\\b`).test(mediaSource)).toBe(false);
});

test("answer tab keeps a broader source budget for media-rich searches", () => {
  expect(commonSource).toContain("const sourceLimit = 14");
  expect(commonSource).toContain("const primaryEvidenceLimit = 5");
  expect(commonSource).toContain("matchesQueryIntent");
  expect(commonSource).toContain("isProviderErrorResult");
  expect(commonSource).toContain("isWeatherResult");
  expect(commonSource).toContain("hasNonEnglishScript");
  expect(commonSource).toContain("isLikelyEnglishResult");
  expect(commonSource).toContain("replace(/<[^>]*>/g");
  expect(evidenceSource).toContain("const initialEvidenceLimit = 10");
  expect(evidenceSource).toContain("const categoryEvidenceLimit = 5");
  expect(evidenceSource).toContain("const mediaCategoryEvidenceTimeoutMs = 10000");
  expect(evidenceSource).toContain("const maxCategoryEvidenceRequests = 4");
});

test("answer video player exposes YouTube-style custom controls at safe default volume", () => {
  expect(mediaSource).toContain("renderVideoControls");
  expect(mediaSource).toContain("answer-video-controls");
  expect(mediaSource).toContain("data-answer-video-toggle");
  expect(mediaSource).toContain("data-answer-video-progress");
  expect(mediaSource).toContain("answer-media-status");
  expect(mediaSource).toContain("reportMediaFailure");
  expect(mediaSource).toContain("formatMediaTime");
  expect(mediaSource).toContain("video.controls = false");
  expect(mediaSource).toContain("video.volume = mediaVolume");
});

test("video and image media use safe sources without unrelated preview playback", () => {
  expect(mediaSource).toContain("images.unsplash.com");
  expect(mediaSource.includes("interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")).toBe(false);
  expect(mediaSource).toContain("poster");
  expect(mediaSource).toContain("answer-video-poster");
  expect(mediaSource).toContain("find((item) => playableVideoUrl(item))");
  expect(mediaSource).toContain('mode: "player"');
  expect(mediaSource).toContain('mode: "source"');
  expect(mediaSource).toContain("renderVideoSourceCard");
  expect(mediaSource.includes("sample: !source")).toBe(false);
  expect(mediaSource.includes('data-answer-media-sample')).toBe(false);
  expect(mediaSource.includes("fallbackMedia.video.title")).toBe(false);
  expect(mediaSource.includes("Playback preview")).toBe(false);
  expect(mediaSource).toContain("supportedMediaType");
  expect(mediaSource.includes('url.origin === "https://interactive-examples.mdn.mozilla.net"')).toBe(false);
  expect(mediaSource).toContain("playableImageUrl");
  expect(mediaSource).toContain('category === "images" ? safeHttpUrl(result?.url) : playableImageUrl(result)');
});

test("answer media only chooses direct player sources allowed by the current CSP", () => {
  expect(mediaSource).toContain("mediaHostIsAllowed");
  expect(mediaSource).toContain("url.origin === window.location.origin");
  expect(mediaSource.includes("interactive-examples.mdn.mozilla.net")).toBe(false);
});

test("audio media uses a deterministic gradient generator and real playable sources", () => {
  expect(mediaSource).toContain("gradientForText");
  expect(mediaSource).toContain("answer-audio-art");
  expect(mediaSource).toContain("createAudioWaveform");
  expect(mediaSource).toContain("answer-audio-controls");
  expect(mediaSource).toContain("data-answer-audio-toggle");
  expect(mediaSource).toContain("data-answer-audio-progress");
  expect(mediaSource).toContain("audioStatus");
  expect(mediaSource).toContain("renderAudioSourceCard");
  expect(mediaSource.includes("interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3")).toBe(false);
  expect(mediaSource).toContain("audio.controls = false");
  expect(mediaSource).toContain("audio.volume = mediaVolume");
  expect(mediaSource.includes("source?.title || cleanText(state?.query)")).toBe(false);
  expect(mediaSource.includes("fallbackMedia.audio.title")).toBe(false);
});

test("answer media does not ship the removed hardcoded 3D cube runtime", () => {
  expect(pageSource.includes("/public/metasearch/answer-three.ts")).toBe(false);
  expect(mediaSource.includes("DxMetasearchAnswerThree")).toBe(false);
  expect(mediaSource.includes("answer-three-")).toBe(false);
  expect(stylesSource.includes(".answer-three")).toBe(false);
  expect(evidenceSource.includes("model-viewer")).toBe(false);
  expect(evidenceSource.includes("unpkg.com")).toBe(false);
});

test("answer media hydration preserves active playback and focused controls", () => {
  expect(mediaSource).toContain("mediaStageIsActive");
  expect(mediaSource).toContain("document.activeElement");
  expect(mediaSource).toContain("!media.paused && !media.ended");
  expect(mediaSource).toContain("media.currentTime > 0");
  expect(mediaSource).toContain("current.contains(document.activeElement)");
  expect(mediaSource).toContain("mediaAnchor?.before(next)");
  expect(mediaSource).toContain("if (next) current.replaceWith(next)");
  expect(mediaSource).toContain("else current.remove()");
});

test("answer media disposes replaced media panels", () => {
  expect(mediaSource).toContain("disposeAnswerMediaStage");
  expect(mediaSource).toContain("[data-answer-media-disposable='true']");
  expect(mediaSource).toContain("panel.disposeAnswerMedia?.()");
  expect(rendererSource).toContain("disposeAnswerMediaStage");
});

test("answer renderer keeps the answer usable if optional media runtime is unavailable", () => {
  expect(rendererSource).toContain("window.DxMetasearchAnswerMedia?.renderAnswerMediaStage");
  expect(rendererSource).toContain("const media = renderMediaStage(payload, state)");
  expect(rendererSource).toContain("if (media) shell.append(media)");
});

test("answer renderer cancels stale typing before hydrating a newer answer", () => {
  expect(rendererSource).toContain("typingTimers = new WeakMap");
  expect(rendererSource).toContain("cancelTyping(node)");
  expect(rendererSource).toContain("window.clearTimeout");
  expect(rendererSource).toContain("if (!node.isConnected || !shouldContinue())");
  expect(rendererSource).toContain("typingTimers.set(node, timer)");
});

test("answer evidence hydration stops when the current answer has been replaced", () => {
  expect(rendererSource).toContain("activeEvidenceController");
  expect(rendererSource).toContain("abortActiveAnswerWork");
  expect(evidenceSource).toContain("signal?.aborted");
  expect(evidenceSource).toContain("answerIsMounted");
  expect(evidenceSource).toContain("shell.isConnected");
  expect(evidenceSource).toContain("evidence.grid?.isConnected");
  expect(evidenceSource).toContain("if (signal?.aborted || !answerIsMounted()) return");
});

test("answer evidence hydrates media as media categories arrive", () => {
  expect(evidenceSource).toContain('const mediaEvidenceCategories = new Set(["images", "videos", "music"])');
  expect(evidenceSource).toContain("scheduleMediaHydration(category)");
  expect(evidenceSource).toContain("mediaHydrationFrame = window.requestAnimationFrame");
  expect(evidenceSource).toContain("hydrateMediaStage()");
  expect(evidenceSource).toContain("window.DxMetasearchAnswerMedia.hydrateAnswerMediaStage");
});

test("result renderer disposes answer media before clearing or replacing result lists", () => {
  expect(resultsRendererSource).toContain("disposeCurrentMedia");
  expect(resultsRendererSource).toContain("window.DxMetasearchAnswerMedia?.disposeAnswerMediaStage");
  expect(resultsRendererSource).toContain("window.DxMetasearchAnswerTts?.stop?.()");
  expect(resultsRendererSource).toContain("disposeCurrentMedia(elements)");
});

test("answer media avoids eager third-party media requests and exposes accessible labels", () => {
  expect(mediaSource).toContain('video.preload = "none"');
  expect(mediaSource).toContain('audio.preload = "none"');
  expect(mediaSource).toContain('status.setAttribute("aria-live", "polite")');
  expect(mediaSource).toContain('toggle.setAttribute("aria-describedby", status.id)');
  expect(mediaSource).toContain('media.addEventListener("error"');
  expect(mediaSource).toContain('media.addEventListener("stalled"');
  expect(mediaSource).toContain('media.addEventListener("canplay"');
  expect(mediaSource).toContain('media.addEventListener("playing"');
  expect(mediaSource).toContain('video.setAttribute("aria-label"');
  expect(mediaSource).toContain('audio.setAttribute("aria-label"');
  expect(mediaSource).toContain('section.setAttribute("aria-label", "Answer media")');
});

test("answer media coordinates playback with TTS and other media sessions", () => {
  expect(mediaSource).toContain("announceMediaSessionStart");
  expect(mediaSource).toContain('"dx:metasearch-media-start"');
  expect(mediaSource).toContain('"dx:metasearch-tts-start"');
  expect(mediaSource).toContain("pauseAllAnswerMedia");
});

test("answer media exposes custom accessible volume controls", () => {
  expect(mediaSource).toContain("renderVolumeControl");
  expect(mediaSource).toContain("syncMediaVolume");
  expect(mediaSource).toContain("data-answer-media-volume");
  expect(mediaSource).toContain("answer-media-volume-range");
  expect(mediaSource).toContain('volume.setAttribute("aria-valuetext"');
});

test("media failure status resets without preview playback messaging", () => {
  expect(mediaSource).toContain("answerMediaDefaultStatus");
  expect(mediaSource).toContain("status.dataset.answerMediaDefaultStatus");
  expect(mediaSource).toContain('status.textContent = status.dataset.answerMediaDefaultStatus || ""');
  expect(mediaSource.includes("Playback preview")).toBe(false);
});

test("answer media styles are responsive and match the existing motion accessibility contract", () => {
  expect(stylesSource).toContain(".answer-media-stage");
  expect(stylesSource).toContain(".answer-video-frame");
  expect(stylesSource).toContain(".answer-video-source-visual");
  expect(stylesSource).toContain(".answer-media-gallery-grid");
  expect(stylesSource).toContain(".answer-media-gallery-card");
  expect(stylesSource).toContain(".answer-media-gallery-play");
  expect(stylesSource).toContain(".answer-audio-art");
  expect(stylesSource).toContain(".answer-media-controls");
  expect(stylesSource).toContain(".answer-media-progress");
  expect(stylesSource).toContain(".answer-media-volume");
  expect(stylesSource).toContain(".answer-media-volume-range");
  expect(stylesSource).toContain(".answer-media-status");
  expect(stylesSource).toContain(".answer-source-action");
  expect(stylesSource).toContain(".answer-audio-waveform");
  expect(stylesSource).toContain("@media (hover: none), (pointer: coarse)");
  expect(stylesSource).toContain("@media (pointer: coarse), (any-pointer: coarse)");
  expect(stylesSource).toContain("touch-action: manipulation");
  expect(stylesSource).toContain(".answer-video-controls {");
  expect(stylesSource).toContain("position: static");
  expect(stylesSource).toContain(".answer-audio-controls .answer-media-time");
  expect(stylesSource).toContain("@supports not (backdrop-filter: blur(1px))");
  expect(stylesSource).toContain("@media (prefers-reduced-motion: reduce)");
});

test("CSP keeps media playback on trusted local and product-owned sources", () => {
  expect(vercelConfig.includes("https://interactive-examples.mdn.mozilla.net")).toBe(false);
  expect(vercelConfig).toContain("https://images.unsplash.com");
  expect(vercelConfig).toContain("script-src 'self'");
  expect(vercelConfig).toContain("Referrer-Policy");
  expect(vercelConfig).toContain("no-referrer");
  expect(vercelConfig.includes("https://unpkg.com")).toBe(false);
});

test("README documents the Answer tab media runtime boundary", () => {
  expect(readme).toContain("Answer media stage");
  expect(readme).toContain("source-backed image, video, and audio panels");
  expect(readme.includes("self-contained WebGL")).toBe(false);
});
