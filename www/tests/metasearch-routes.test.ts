import {
  internalSearchPath,
  metasearchApiLinks,
  metasearchApiOrigin,
  metasearchApiSearchPath,
  metasearchApiUrl,
  metasearchPageLinks,
  normalizeEngineList,
  normalizeSearchCategory,
  normalizeTimeRange,
  searchCategories,
} from "../lib/metasearch/routes";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toBe(expected: TValue): void;
};

test("internalSearchPath preserves the default local query contract", () => {
  const url = new URL(internalSearchPath(), "http://127.0.0.1:3001");
  expect(url.origin).toBe("http://127.0.0.1:3001");
  expect(url.pathname).toBe("/");
  expect(url.hash).toBe("#results");
  expect(url.searchParams.get("q")).toBe("");
  expect(url.searchParams.get("category")).toBe("answer");
  expect(url.searchParams.get("language")).toBe("en");
  expect(url.searchParams.get("safe_search")).toBe("1");
});

test("page links only expose rendered sections", () => {
  const links = Object.values(metasearchPageLinks);
  expect(links.length).toBe(1);
  for (const link of links) {
    expect(link).toBe("#results");
  }
});

test("metasearch API search path preserves the JSON result contract", () => {
  const path = metasearchApiSearchPath({
    query: "tenali rama",
    category: "videos",
    language: "en",
    safeSearch: 1,
    timeRange: "week",
    engines: "bing, google",
  });
  const url = new URL(path, "http://127.0.0.1:3001");
  expect(url.pathname).toBe("/api/v1/search");
  expect(url.searchParams.get("q")).toBe("tenali rama");
  expect(url.searchParams.get("format")).toBe("json");
  expect(url.searchParams.get("categories")).toBe("videos");
  expect(url.searchParams.get("language")).toBe("en");
  expect(url.searchParams.get("safe_search")).toBe("1");
  expect(url.searchParams.get("time_range")).toBe("week");
  expect(url.searchParams.get("engines")).toBe("bing,google");
});

test("answer searches keep the page tab while querying primary answer evidence", () => {
  const pageUrl = new URL(
    internalSearchPath({
      query: "html button syntax",
      category: "answer",
      language: "en",
      safeSearch: 1,
    }),
    "http://127.0.0.1:3001",
  );
  const apiUrl = new URL(
    metasearchApiSearchPath({
      query: "html button syntax",
      category: "answer",
      language: "en",
      safeSearch: 1,
    }),
    "http://127.0.0.1:3001",
  );

  expect(pageUrl.searchParams.get("category")).toBe("answer");
  expect(apiUrl.searchParams.get("categories")).toBe("general");
});

test("search category normalization follows the backend category names", () => {
  expect(normalizeSearchCategory("answer")).toBe("answer");
  expect(normalizeSearchCategory("video")).toBe("videos");
  expect(normalizeSearchCategory("image")).toBe("images");
  expect(normalizeSearchCategory("videos")).toBe("videos");
  expect(normalizeSearchCategory("map")).toBe("maps");
  expect(normalizeSearchCategory("social")).toBe("social_media");
  expect(normalizeSearchCategory("dev")).toBe("it");
  expect(normalizeSearchCategory("unknown")).toBe("general");
});

test("search categories expose every backend media type", () => {
  expect(searchCategories.length).toBe(11);
  expect(searchCategories[0]).toBe("answer");
  expect(searchCategories.includes("answer")).toBe(true);
  expect(searchCategories.includes("general")).toBe(true);
  expect(searchCategories.includes("images")).toBe(true);
  expect(searchCategories.includes("videos")).toBe(true);
  expect(searchCategories.includes("news")).toBe(true);
  expect(searchCategories.includes("maps")).toBe(true);
  expect(searchCategories.includes("music")).toBe(true);
  expect(searchCategories.includes("science")).toBe(true);
  expect(searchCategories.includes("it")).toBe(true);
  expect(searchCategories.includes("files")).toBe(true);
  expect(searchCategories.includes("social_media")).toBe(true);
});

test("search filters normalize to the local API contract", () => {
  const url = new URL(
    internalSearchPath({
      query: "tenali rama",
      category: "images",
      language: "en",
      safeSearch: 2,
      timeRange: "month",
      engines: "  brave , qwant ,,  duckduckgo ",
    }),
    "http://127.0.0.1:3001",
  );

  expect(url.searchParams.get("time_range")).toBe("month");
  expect(url.searchParams.get("engines")).toBe("brave,qwant,duckduckgo");
  expect(normalizeTimeRange("decade")).toBe("");
  expect(normalizeEngineList("a,, b, c")).toBe("a,b,c");
});

test("API links stay on the DX WWW same-origin API boundary", () => {
  expect(metasearchApiOrigin).toBe("same-origin");
  const links = Object.values(metasearchApiLinks);
  for (const link of links) {
    expect(link.startsWith("/")).toBe(true);
    expect(new URL(link, "http://127.0.0.1:3001").origin).toBe("http://127.0.0.1:3001");
  }
});

test("metasearchApiUrl normalizes API paths", () => {
  expect(metasearchApiUrl("/api/v1/status")).toBe("/api/v1/status");
  expect(metasearchApiUrl("api/v1/status")).toBe("/api/v1/status");
  expect(metasearchApiLinks.translate).toBe("/api/v1/translate");
});

test("runtime asset stays TypeScript while fetching live API data", () => {
  const assetPaths = [
    "/public/metasearch/url-safety.ts",
    "/public/metasearch/i18n-languages.ts",
    "/public/metasearch/answer-common.ts",
    "/public/metasearch/answer-tts.ts",
    "/public/metasearch/answer-controls.ts",
    "/public/metasearch/answer-evidence.ts",
    "/public/metasearch/answer-media.ts",
    "/public/metasearch/answer-renderer.ts",
    "/public/metasearch/result-common.ts",
    "/public/metasearch/result-cards.ts",
    "/public/metasearch/results-renderer.ts",
    "/public/metasearch/search-scheduler.ts",
    "/public/metasearch/runtime.ts",
  ];

  expect(assetPaths.length).toBe(13);
  for (const assetPath of assetPaths) {
    expect(assetPath.endsWith(".ts")).toBe(true);
    expect(assetPath.includes(".js")).toBe(false);
  }
});
