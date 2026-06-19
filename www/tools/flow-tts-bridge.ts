import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const flowRoot = Bun.env.DX_FLOW_ROOT || "G:\\Dx\\flow";
const host = Bun.env.DX_FLOW_TTS_HOST || "127.0.0.1";
const port = Number(Bun.env.DX_FLOW_TTS_PORT || "8789");
const outputRoot = join(flowRoot, "tmp", "metasearch-tts");
const endpointPath = "/api/flow/tts";
const maxTextLength = 1200;
const maxRequestBytes = readPositiveInteger(Bun.env.DX_FLOW_TTS_MAX_REQUEST_BYTES, 8192);
const maxConcurrentSyntheses = readPositiveInteger(Bun.env.DX_FLOW_TTS_MAX_CONCURRENCY, 1);
const synthTimeoutMs = readPositiveInteger(Bun.env.DX_FLOW_TTS_TIMEOUT_MS, 30000);
let activeSyntheses = 0;
const allowedOrigins = new Set(
  (Bun.env.DX_FLOW_TTS_ORIGINS || "http://127.0.0.1:3001,http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function originAllowed(request) {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins.has(origin);
}

function responseHeaders(request, extraHeaders = {}) {
  const origin = request.headers.get("origin");
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : "http://127.0.0.1:3001";
  return {
    "access-control-allow-headers": "content-type, accept",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": allowedOrigin,
    vary: "origin",
    ...extraHeaders,
  };
}

function resolveFlowTtsBinary() {
  const candidates = [
    Bun.env.DX_FLOW_TTS_BIN,
    join(flowRoot, "target", "debug", "flow-tts.exe"),
    join(flowRoot, "target", "release", "flow-tts.exe"),
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

function jsonResponse(request, payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...responseHeaders(request),
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function readPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function requestTooLarge(request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  return Number.isFinite(contentLength) && contentLength > maxRequestBytes;
}

async function parseRequestText(request) {
  try {
    const rawPayload = await request.text();
    if (rawPayload.length > maxRequestBytes) return { error: "request_too_large", text: "" };
    const payload = JSON.parse(rawPayload);
    return { error: "", text: String(payload?.text || "").replace(/\s+/g, " ").trim().slice(0, maxTextLength) };
  } catch {
    return { error: "", text: "" };
  }
}

async function renderSpeech(request) {
  const binary = resolveFlowTtsBinary();
  if (!binary) {
    return jsonResponse(
      request,
      {
        error: "flow_tts_unavailable",
        message: "Flow Kokoro unavailable. Build G:\\Dx\\flow\\tools\\flow-tts-host before using Quality TTS.",
      },
      503,
    );
  }

  if (requestTooLarge(request)) {
    return jsonResponse(request, { error: "request_too_large", message: "Text payload is too large." }, 413);
  }

  const { error, text } = await parseRequestText(request);
  if (error === "request_too_large") {
    return jsonResponse(request, { error, message: "Text payload is too large." }, 413);
  }
  if (!text) {
    return jsonResponse(request, { error: "empty_text", message: "Text is required." }, 400);
  }

  if (activeSyntheses >= maxConcurrentSyntheses) {
    return jsonResponse(request, { error: "tts_busy", message: "Flow Kokoro is already rendering speech." }, 429);
  }

  activeSyntheses += 1;
  try {
    mkdirSync(outputRoot, { recursive: true });
    const outputPath = join(outputRoot, `metasearch-${Date.now()}-${Math.random().toString(16).slice(2)}.wav`);
    const childProcess = Bun.spawn([binary, "--text", text, "--output", outputPath], {
      cwd: flowRoot,
      stderr: "pipe",
      stdout: "pipe",
    });

    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      childProcess.kill();
    }, synthTimeoutMs);

    const [exitCode, stderr] = await Promise.all([
      childProcess.exited.finally(() => clearTimeout(timeoutHandle)),
      new Response(childProcess.stderr).text(),
      new Response(childProcess.stdout).text(),
    ]);

    if (timedOut) {
      if (existsSync(outputPath)) removeGeneratedSpeech(outputPath);
      return jsonResponse(request, { error: "flow_tts_timeout", message: "Flow Kokoro timed out." }, 504);
    }

    if (exitCode !== 0 || !existsSync(outputPath)) {
      if (existsSync(outputPath)) removeGeneratedSpeech(outputPath);
      return jsonResponse(
        request,
        {
          error: "flow_tts_failed",
          message: stderr.trim() || "Flow Kokoro failed to render speech.",
        },
        502,
      );
    }

    let audioBytes;
    try {
      audioBytes = await Bun.file(outputPath).arrayBuffer();
    } finally {
      removeGeneratedSpeech(outputPath);
    }

    return new Response(audioBytes, {
      headers: responseHeaders(request, {
        "cache-control": "no-store",
        "content-type": "audio/wav",
      }),
    });
  } finally {
    activeSyntheses -= 1;
  }
}

function removeGeneratedSpeech(outputPath) {
  try {
    rmSync(outputPath, { force: true });
  } catch {
    // Best-effort cleanup only; response handling should not fail after successful synthesis.
  }
}

Bun.serve({
  hostname: host,
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (!originAllowed(request)) {
      return new Response(JSON.stringify({ error: "forbidden_origin", message: "Origin is not allowed." }), {
        status: 403,
        headers: {
          "content-type": "application/json; charset=utf-8",
          vary: "origin",
        },
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: responseHeaders(request) });
    }

    if (url.pathname === "/livez") {
      return jsonResponse(request, {
        endpoint: endpointPath,
        flowRoot,
        hasBinary: Boolean(resolveFlowTtsBinary()),
        status: "ok",
      });
    }

    if (url.pathname !== endpointPath || request.method !== "POST") {
      return jsonResponse(request, { error: "not_found", message: "Route not found." }, 404);
    }

    return renderSpeech(request);
  },
});

console.log(`Flow TTS bridge listening on http://${host}:${port}${endpointPath}`);
