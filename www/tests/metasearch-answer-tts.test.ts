import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toBe(expected: TValue): void;
  toContain(expected: string): void;
};

const ttsSource = readFileSync("public/metasearch/answer-tts.ts", "utf8");
const controlsSource = readFileSync("public/metasearch/answer-controls.ts", "utf8");
const languageSource = readFileSync("public/metasearch/i18n-languages.ts", "utf8");
const answerRendererSource = readFileSync("public/metasearch/answer-renderer.ts", "utf8");
const bridgeSource = readFileSync("tools/flow-tts-bridge.ts", "utf8");
const vercelConfig = readFileSync("vercel.json", "utf8");
const languageRows = Array.from(languageSource.matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g));

test("answer TTS exposes fast and quality provider choices", () => {
  expect(ttsSource).toContain('id: "google"');
  expect(ttsSource).toContain("Fast output, lower quality");
  expect(ttsSource).toContain('id: "flow"');
  expect(ttsSource).toContain("Better voice, slower generation");
  expect(controlsSource).toContain("answer-tts-provider-picker");
  expect(controlsSource).toContain("data-tts-provider");
  expect(controlsSource).toContain("data-tts-playback-button");
});

test("answer TTS uses fast provider audio with browser speech fallback", () => {
  expect(ttsSource).toContain("const ttsVolume = 0.3");
  expect(ttsSource).toContain("playFastTts");
  expect(ttsSource).toContain("playGoogleTranslateTts");
  expect(ttsSource).toContain("translate.google.com/translate_tts");
  expect(ttsSource).toContain("playBrowserSpeechTts");
  expect(ttsSource).toContain("SpeechSynthesisUtterance");
  expect(ttsSource).toContain("speech.speak(utterance)");
  expect(ttsSource).toContain("utterance.volume = ttsVolume");
  expect(ttsSource).toContain("Fast voice");
  expect(controlsSource).toContain("selectedLanguage(actions)");
});

test("answer TTS keeps the full language selector wired into speech", () => {
  expect(languageRows.length >= 247).toBe(true);
  expect(ttsSource).toContain("speechLanguageCandidates");
  expect(ttsSource).toContain("preferredSpeechVoice");
  expect(ttsSource).toContain("speechLanguageRegions");
  expect(ttsSource).toContain('om: "om-ET"');
  expect(ttsSource).toContain('tt: "tt-RU"');
  expect(ttsSource).toContain('ti: "ti-ET"');
  expect(ttsSource).toContain('iw: "he"');
  expect(ttsSource).toContain('jw: "jv"');
  expect(ttsSource).toContain('tl: "fil"');
});

test("answer language selection does not reset TTS back to English", () => {
  expect(controlsSource).toContain("selectedGlobalLanguage");
  expect(controlsSource).toContain("setGlobalLanguage");
  expect(controlsSource).toContain('"dx:metasearch-language-change"');
  expect(controlsSource).toContain("window.DxMetasearchI18n?.selectedLanguage");
  expect(controlsSource).toContain("Translation unavailable; speech remains");
  expect(controlsSource.includes('picker.setAttribute("data-language", defaultLanguage)')).toBe(false);
});

test("answer TTS prefers female browser voices when Google audio falls back", () => {
  expect(ttsSource).toContain("femaleVoicePattern");
  expect(ttsSource).toContain("maleVoicePattern");
  expect(ttsSource).toContain("voiceScore");
  expect(ttsSource).toContain("speech.getVoices");
  expect(ttsSource).toContain('"voiceschanged"');
  expect(ttsSource).toContain("if (voice) utterance.voice = voice");
  expect(ttsSource).toContain("utterance.lang = voice?.lang || languageCandidates[0]");
});

test("answer TTS exposes play and pause controls for active speech", () => {
  expect(ttsSource).toContain("toggleText");
  expect(ttsSource).toContain("pauseTtsSession");
  expect(ttsSource).toContain("resumeTtsSession");
  expect(ttsSource).toContain('"dx:metasearch-tts-state"');
  expect(ttsSource).toContain("playbackState");
  expect(ttsSource).toContain("ttsKey");
  expect(controlsSource).toContain("ttsPlaybackButton");
  expect(controlsSource).toContain('actionButton("Speak", "speaker"');
  expect(controlsSource).toContain("Play speech");
  expect(controlsSource).toContain("Pause speech");
  expect(controlsSource).toContain('setActionButton(button, "Speak", "speaker", false)');
  expect(controlsSource).toContain('play: ["M8 5v14l11-7L8 5Z"]');
  expect(controlsSource).toContain('pause: ["M7 5h3v14H7V5Z", "M14 5h3v14h-3V5Z"]');
});

test("answer TTS can request the local Flow Kokoro bridge with a safe fallback", () => {
  expect(ttsSource).toContain("playFlowKokoroTts");
  expect(ttsSource).toContain("/api/flow/tts");
  expect(ttsSource).toContain("Quality unavailable; using Fast");
  expect(ttsSource).toContain("playGoogleTranslateTts");
});

test("answer translation uses same-origin API first with direct Google fallback and chunking", () => {
  expect(ttsSource).toContain("/api/translate");
  expect(ttsSource).toContain("translateWithLocalApi");
  expect(ttsSource).toContain("translateWithGoogle");
  expect(ttsSource).toContain("translationChunks");
  expect(ttsSource).toContain("const translateChunkLimit = 1100");
});

test("answer TTS coordinates with Answer media playback sessions", () => {
  expect(ttsSource).toContain("announceTtsSessionStart");
  expect(ttsSource).toContain('"dx:metasearch-tts-start"');
  expect(ttsSource).toContain('"dx:metasearch-media-start"');
  expect(ttsSource).toContain("window.addEventListener");
  expect(ttsSource).toContain("stopActiveAudio");
});

test("answer TTS aborts stale sessions and releases playback resources", () => {
  expect(ttsSource).toContain("let ttsSessionId = 0");
  expect(ttsSource).toContain("let activeTtsController = null");
  expect(ttsSource).toContain("let activePlayback = null");
  expect(ttsSource).toContain("startTtsSession");
  expect(ttsSource).toContain("isCurrentTtsSession");
  expect(ttsSource).toContain("cleanupActivePlayback");
  expect(ttsSource).toContain("unloadAudio");
  expect(ttsSource).toContain('audio.removeAttribute?.("src")');
  expect(ttsSource).toContain("audio.load?.()");
  expect(ttsSource).toContain("signal: session.signal");
  expect(ttsSource).toContain("stopTtsSession");
  expect(answerRendererSource).toContain("window.DxMetasearchAnswerTts?.stop?.()");
});

test("Flow Kokoro bridge is a local WAV endpoint for the Answer tab", () => {
  expect(bridgeSource).toContain('const endpointPath = "/api/flow/tts"');
  expect(bridgeSource).toContain("G:\\\\Dx\\\\flow");
  expect(bridgeSource).toContain("flow-tts.exe");
  expect(bridgeSource).toContain('"content-type": "audio/wav"');
});

test("Flow Kokoro bridge restricts browser origins and cleans generated WAV files", () => {
  expect(bridgeSource).toContain("allowedOrigins");
  expect(bridgeSource).toContain("originAllowed");
  expect(bridgeSource).toContain("removeGeneratedSpeech");
  expect(bridgeSource).toContain("await Bun.file(outputPath).arrayBuffer()");
});

test("Flow Kokoro bridge limits local request size, concurrency, and synthesis time", () => {
  expect(bridgeSource).toContain("const maxRequestBytes =");
  expect(bridgeSource).toContain("requestTooLarge");
  expect(bridgeSource).toContain("activeSyntheses");
  expect(bridgeSource).toContain("synthTimeoutMs");
  expect(bridgeSource).toContain("childProcess.kill()");
});

test("production CSP allows the configured TTS audio providers", () => {
  expect(vercelConfig).toContain("https://translate.googleapis.com");
  expect(vercelConfig).toContain("https://translate.google.com");
  expect(vercelConfig).toContain("http://127.0.0.1:8789");
  expect(vercelConfig).toContain("media-src");
  expect(vercelConfig).toContain("/public/metasearch/(.*).ts");
});
