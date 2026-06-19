(() => {
  const common = window.DxMetasearchAnswerCommon;
  const { cleanText, defaultLanguage } = common;

  const ttsVolume = 0.3;
  const defaultTtsProvider = "google";
  const flowTtsEndpoint = "http://127.0.0.1:8789/api/flow/tts";
  const translateChunkLimit = 1100;
  const ttsProviders = [
    { id: "google", label: "Fast", description: "Fast output, lower quality" },
    { id: "flow", label: "Quality", description: "Better voice, slower generation" },
  ];
  const femaleVoicePattern =
    /\b(female|woman|aria|ava|ayanda|catherine|clara|dalia|elsa|emma|heera|helena|hortense|jenny|joana|karen|libby|lucia|maria|moira|natasha|neerja|paulina|samantha|sara|sonia|susan|tessa|veena|zira)\b/i;
  const maleVoicePattern = /\b(male|man|david|guy|mark|pablo|raul|ryan|thomas)\b/i;
  const speechLanguageRegions = {
    af: "af-ZA",
    am: "am-ET",
    ar: "ar-SA",
    az: "az-AZ",
    be: "be-BY",
    bg: "bg-BG",
    bn: "bn-BD",
    ca: "ca-ES",
    cs: "cs-CZ",
    da: "da-DK",
    de: "de-DE",
    el: "el-GR",
    en: "en-US",
    es: "es-ES",
    et: "et-EE",
    fa: "fa-IR",
    fi: "fi-FI",
    fil: "fil-PH",
    fr: "fr-FR",
    gu: "gu-IN",
    he: "he-IL",
    hi: "hi-IN",
    hr: "hr-HR",
    hu: "hu-HU",
    id: "id-ID",
    is: "is-IS",
    it: "it-IT",
    ja: "ja-JP",
    jv: "jv-ID",
    kn: "kn-IN",
    ko: "ko-KR",
    ml: "ml-IN",
    mr: "mr-IN",
    ms: "ms-MY",
    nb: "nb-NO",
    nl: "nl-NL",
    om: "om-ET",
    pa: "pa-IN",
    pl: "pl-PL",
    pt: "pt-BR",
    ro: "ro-RO",
    ru: "ru-RU",
    sk: "sk-SK",
    sl: "sl-SI",
    sr: "sr-RS",
    sv: "sv-SE",
    sw: "sw-KE",
    ta: "ta-IN",
    te: "te-IN",
    th: "th-TH",
    ti: "ti-ET",
    tr: "tr-TR",
    tt: "tt-RU",
    uk: "uk-UA",
    ur: "ur-PK",
    vi: "vi-VN",
    zh: "zh-CN",
  };
  const ttsStatusTimers = new WeakMap();
  let activeAudio = null;
  let activePlayback = null;
  let activeTtsKey = "";
  let activeTtsController = null;
  let ttsPlaybackState = "idle";
  let ttsSessionId = 0;

  async function speakText(text, language, provider, statusScope) {
    const utteranceText = cleanText(text);
    if (!utteranceText) return;
    const providerId = provider || defaultTtsProvider;
    const selectedLanguage = normalizeTtsLanguage(language || defaultLanguage);
    const session = startTtsSession();
    activeTtsKey = ttsKey(utteranceText, selectedLanguage, providerId);
    setTtsPlaybackState("loading");
    setTtsStatus(statusScope, "Preparing audio");

    try {
      if (providerId === "flow") {
        await playFlowKokoroTts(utteranceText, selectedLanguage, session);
        if (!isCurrentTtsSession(session)) return;
        setTtsStatus(statusScope, "Quality voice");
        return;
      }

      await playFastTts(utteranceText, selectedLanguage, session);
      if (!isCurrentTtsSession(session)) return;
      setTtsStatus(statusScope, "Fast voice");
    } catch (error) {
      if (isAbortError(error) || !isCurrentTtsSession(session)) return;
      if (providerId === "flow") {
        setTtsStatus(statusScope, "Quality unavailable; using Fast");
        try {
          await playFastTts(utteranceText, selectedLanguage, session);
          if (isCurrentTtsSession(session)) setTtsStatus(statusScope, "Fast voice");
        } catch (fallbackError) {
          if (isAbortError(fallbackError) || !isCurrentTtsSession(session)) return;
          setTtsStatus(statusScope, "TTS unavailable");
        }
        return;
      }
      setTtsStatus(statusScope, "TTS unavailable");
    } finally {
      if (activeTtsController === session.controller) {
        activeTtsController = null;
        activeTtsKey = "";
        setTtsPlaybackState("idle");
      }
    }
  }

  async function toggleText(text, language, provider, statusScope) {
    const utteranceText = cleanText(text);
    if (!utteranceText) return;
    const providerId = provider || defaultTtsProvider;
    const selectedLanguage = normalizeTtsLanguage(language || defaultLanguage);
    const nextKey = ttsKey(utteranceText, selectedLanguage, providerId);

    if (activeTtsKey === nextKey && ttsPlaybackState === "playing") {
      pauseTtsSession(statusScope);
      return;
    }

    if (activeTtsKey === nextKey && ttsPlaybackState === "paused") {
      await resumeTtsSession(statusScope);
      return;
    }

    await speakText(utteranceText, selectedLanguage, providerId, statusScope);
  }

  function pauseTtsSession(statusScope) {
    if (!activePlayback || ttsPlaybackState !== "playing") return false;
    activePlayback.pause?.();
    setTtsPlaybackState("paused");
    setTtsStatus(statusScope, "Paused");
    return true;
  }

  async function resumeTtsSession(statusScope) {
    if (!activePlayback || ttsPlaybackState !== "paused") return false;
    await activePlayback.resume?.();
    setTtsPlaybackState("playing");
    setTtsStatus(statusScope, "Playing");
    return true;
  }

  async function playFastTts(text, language, session) {
    const selectedLanguage = normalizeTtsLanguage(language);
    try {
      await playGoogleTranslateTts(text, selectedLanguage, session);
    } catch (error) {
      if (isAbortError(error) || !isCurrentTtsSession(session)) throw error;
      await playBrowserSpeechTts(text, selectedLanguage, session);
    }
  }

  async function playGoogleTranslateTts(text, language, session) {
    for (const chunk of ttsChunks(text)) {
      assertCurrentTtsSession(session);
      const audio = new Audio(googleTtsUrl(chunk, language || defaultLanguage));
      audio.preload = "auto";
      await playAudio(audio, session);
    }
  }

  async function playBrowserSpeechTts(text, language, session) {
    const speech = window.speechSynthesis;
    if (!speech || typeof SpeechSynthesisUtterance === "undefined") {
      throw new Error("Browser speech synthesis unavailable");
    }

    stopActiveAudio();
    assertCurrentTtsSession(session);
    announceTtsSessionStart();
    const languageCandidates = speechLanguageCandidates(language);
    const voice = await preferredSpeechVoice(speech, languageCandidates);
    assertCurrentTtsSession(session);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang || languageCandidates[0] || defaultLanguage;
      if (voice) utterance.voice = voice;
      utterance.volume = ttsVolume;

      const playback = {
        audio: null,
        cleanup: null,
        settled: false,
        pause() {
          speech.pause();
        },
        resume() {
          speech.resume();
        },
        stop(reason) {
          speech.cancel();
          settle(reason || ttsAbortError());
        },
      };

      function cleanup() {
        session.signal.removeEventListener("abort", handleAbort);
        utterance.onend = null;
        utterance.onerror = null;
      }

      function settle(error) {
        if (playback.settled) return;
        playback.settled = true;
        cleanupActivePlayback(playback);
        if (error) reject(error);
        else resolve();
      }

      function handleAbort() {
        playback.stop(ttsAbortError());
      }

      utterance.onend = () => settle();
      utterance.onerror = () => settle(new Error("Browser speech synthesis failed"));
      playback.cleanup = cleanup;
      activePlayback = playback;
      session.signal.addEventListener("abort", handleAbort, { once: true });
      speech.cancel();
      speech.speak(utterance);
      setTtsPlaybackState("playing");
    });
  }

  async function playFlowKokoroTts(text, language, session) {
    assertCurrentTtsSession(session);
    const response = await fetch(flowTtsUrl(), {
      method: "POST",
      headers: {
        accept: "audio/wav",
        "content-type": "application/json",
      },
      signal: session.signal,
      body: JSON.stringify({
        language: language || defaultLanguage,
        text: text.slice(0, 1200),
      }),
    });

    assertCurrentTtsSession(session);
    if (!response.ok) throw new Error("Flow Kokoro unavailable");

    const audioUrl = URL.createObjectURL(await response.blob());
    try {
      assertCurrentTtsSession(session);
      const audio = new Audio(audioUrl);
      await playAudio(audio, session);
    } finally {
      URL.revokeObjectURL(audioUrl);
    }
  }

  function playAudio(audio, session) {
    stopActiveAudio();
    assertCurrentTtsSession(session);
    announceTtsSessionStart();
    audio.volume = ttsVolume;
    activeAudio = audio;

    return new Promise((resolve, reject) => {
      const playback = {
        audio,
        cleanup: null,
        settled: false,
        pause() {
          audio.pause?.();
        },
        resume() {
          return Promise.resolve(audio.play?.());
        },
        stop(reason) {
          settle(reason || ttsAbortError());
        },
      };

      function cleanup() {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      }

      function settle(error) {
        if (playback.settled) return;
        playback.settled = true;
        cleanupActivePlayback(playback);
        if (error) reject(error);
        else resolve();
      }

      function handleEnded() {
        settle();
      }

      function handleError() {
        settle(new Error("Audio playback failed"));
      }

      playback.cleanup = cleanup;
      activePlayback = playback;
      audio.addEventListener("ended", handleEnded, { once: true });
      audio.addEventListener("error", handleError, { once: true });
      setTtsPlaybackState("playing");
      Promise.resolve(audio.play?.()).catch((error) => {
        settle(error);
      });
    });
  }

  function cleanupActivePlayback(playback) {
    playback?.cleanup?.();
    if (activePlayback === playback) activePlayback = null;
    if (activeAudio === playback?.audio) activeAudio = null;
  }

  function unloadAudio(audio) {
    if (!audio) return;
    audio.pause?.();
    try {
      audio.currentTime = 0;
    } catch {
      // Some browser audio implementations reject currentTime before metadata is ready.
    }
    audio.removeAttribute?.("src");
    audio.load?.();
  }

  function stopActiveAudio(reason = ttsAbortError()) {
    const playback = activePlayback;
    const audio = activeAudio || playback?.audio;
    if (!audio && !playback) return;
    unloadAudio(audio);
    if (playback?.stop) playback.stop(reason);
    else activeAudio = null;
  }

  function startTtsSession() {
    stopTtsSession();
    const controller = new AbortController();
    activeTtsController = controller;
    ttsSessionId += 1;
    return {
      controller,
      id: ttsSessionId,
      signal: controller.signal,
    };
  }

  function stopTtsSession() {
    ttsSessionId += 1;
    activeTtsController?.abort();
    activeTtsController = null;
    activeTtsKey = "";
    stopActiveAudio(ttsAbortError());
    setTtsPlaybackState("idle");
  }

  function isCurrentTtsSession(session) {
    return Boolean(session && session.id === ttsSessionId && !session.signal.aborted);
  }

  function assertCurrentTtsSession(session) {
    if (!isCurrentTtsSession(session)) throw ttsAbortError();
  }

  function ttsAbortError() {
    return new DOMException("TTS stopped", "AbortError");
  }

  function isAbortError(error) {
    return error?.name === "AbortError";
  }

  function announceTtsSessionStart() {
    window.dispatchEvent(new CustomEvent("dx:metasearch-tts-start"));
  }

  function setTtsPlaybackState(state) {
    ttsPlaybackState = state;
    window.dispatchEvent(new CustomEvent("dx:metasearch-tts-state", { detail: playbackState() }));
  }

  function playbackState() {
    return {
      key: activeTtsKey,
      state: ttsPlaybackState,
    };
  }

  window.addEventListener("dx:metasearch-media-start", stopTtsSession);

  function flowTtsUrl() {
    const configured =
      window.DxMetasearchTts?.flowEndpoint ||
      document.querySelector("[data-flow-tts-endpoint]")?.getAttribute("data-flow-tts-endpoint");
    return configured || flowTtsEndpoint;
  }

  function ttsChunks(text) {
    const chunks = [];
    const words = cleanText(text).split(" ");
    let current = "";

    for (const word of words) {
      if (word.length > 180) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += 180) {
          chunks.push(word.slice(index, index + 180));
        }
        continue;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length > 180 && current) {
        chunks.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  function setTtsStatus(scope, message) {
    const status = scope?.querySelector?.(".answer-tts-status");
    if (!status) return;
    status.textContent = message;
    const previousTimer = ttsStatusTimers.get(status);
    if (previousTimer) window.clearTimeout(previousTimer);
    const nextTimer = window.setTimeout(() => {
      status.textContent = "";
    }, 2400);
    ttsStatusTimers.set(status, nextTimer);
  }

  async function translateText(text, targetLanguage) {
    const translated = [];
    for (const chunk of translationChunks(text)) {
      translated.push(await translateChunk(chunk, targetLanguage));
    }
    return translated.join("");
  }

  async function translateChunk(text, targetLanguage) {
    try {
      return await translateWithLocalApi(text, targetLanguage);
    } catch {
      return translateWithGoogle(text, targetLanguage);
    }
  }

  async function translateWithLocalApi(text, targetLanguage) {
    const url = new URL("/api/v1/translate", window.location.origin);
    url.searchParams.set("text", text);
    url.searchParams.set("target", targetLanguage || defaultLanguage);
    const response = await fetch(url.toString(), { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const translated = cleanText(payload?.translated_text);
    if (!translated) throw new Error("Empty translation");
    return translated;
  }

  async function translateWithGoogle(text, targetLanguage) {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", targetLanguage);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return payload[0].map((part) => part[0]).join("");
  }

  function translationChunks(text) {
    const chunks = [];
    const tokens = String(text || "").split(/(\s+)/);
    let current = "";
    for (const token of tokens) {
      const next = `${current}${token}`;
      if (next.length > translateChunkLimit && current.trim()) {
        chunks.push(current);
        current = token.trimStart();
      } else {
        current = next;
      }
    }
    if (current.trim()) chunks.push(current);
    return chunks;
  }

  function googleTtsUrl(text, language) {
    const url = new URL("https://translate.google.com/translate_tts");
    url.searchParams.set("ie", "UTF-8");
    url.searchParams.set("tl", normalizeTtsLanguage(language));
    url.searchParams.set("client", "tw-ob");
    url.searchParams.set("q", text.slice(0, 180));
    return url.toString();
  }

  function normalizeTtsLanguage(language) {
    return cleanText(language || defaultLanguage) || defaultLanguage;
  }

  function ttsKey(text, language, provider) {
    return [
      provider || defaultTtsProvider,
      normalizeTtsLanguage(language),
      cleanText(text),
    ].join("\n");
  }

  function speechLanguageCandidates(language) {
    const normalized = normalizeTtsLanguage(language);
    const aliases = {
      iw: "he",
      jw: "jv",
      tl: "fil",
    };
    const aliased = aliases[normalized] || normalized;
    const base = aliased.split("-")[0];
    return uniqueValues([
      aliased,
      speechLanguageRegions[aliased],
      speechLanguageRegions[base],
      base,
      normalized,
    ]);
  }

  async function preferredSpeechVoice(speech, languageCandidates) {
    const voices = await speechVoices(speech);
    if (voices.length === 0) return null;
    const ranked = voices
      .map((voice) => ({ score: voiceScore(voice, languageCandidates), voice }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);
    return ranked[0]?.voice || null;
  }

  function speechVoices(speech) {
    const voices = speech.getVoices?.() || [];
    if (voices.length > 0) return Promise.resolve(voices);
    return new Promise((resolve) => {
      const finish = () => {
        speech.removeEventListener?.("voiceschanged", finish);
        resolve(speech.getVoices?.() || []);
      };
      speech.addEventListener?.("voiceschanged", finish, { once: true });
      window.setTimeout(finish, 500);
    });
  }

  function voiceScore(voice, languageCandidates) {
    const voiceLanguage = cleanText(voice?.lang).toLowerCase();
    const voiceName = cleanText(voice?.name);
    if (!voiceLanguage) return 0;
    const candidates = languageCandidates.map((candidate) => cleanText(candidate).toLowerCase());
    const exactMatch = candidates.findIndex((candidate) => candidate && voiceLanguage === candidate);
    const baseMatch = candidates.findIndex((candidate) => {
      const base = candidate.split("-")[0];
      return base && voiceLanguage.split("-")[0] === base;
    });
    let score = 0;
    if (exactMatch >= 0) score += 120 - exactMatch;
    else if (baseMatch >= 0) score += 80 - baseMatch;
    if (femaleVoicePattern.test(voiceName)) score += 30;
    if (maleVoicePattern.test(voiceName)) score -= 20;
    if (voice?.default) score += 3;
    if (voice?.localService) score += 2;
    return score;
  }

  function uniqueValues(values) {
    const unique = [];
    for (const value of values) {
      const normalized = cleanText(value);
      if (normalized && !unique.includes(normalized)) unique.push(normalized);
    }
    return unique;
  }

  window.DxMetasearchAnswerTts = {
    defaultTtsProvider,
    playbackState,
    speechLanguageCandidates,
    speakText,
    stop: stopTtsSession,
    toggleText,
    translateText,
    ttsKey,
    ttsProviders,
  };
})();
