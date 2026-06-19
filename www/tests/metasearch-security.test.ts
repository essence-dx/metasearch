import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toBe(expected: TValue): void;
  toContain(expected: string): void;
};

const pageSource = readFileSync("app/page.tsx", "utf8");
const runtimeSource = readFileSync("public/metasearch/runtime.ts", "utf8");
const schedulerSource = readFileSync("public/metasearch/search-scheduler.ts", "utf8");
const answerEvidenceSource = readFileSync("public/metasearch/answer-evidence.ts", "utf8");
const resultCardsSource = readFileSync("public/metasearch/result-cards.ts", "utf8");
const routeSource = readFileSync("app/api/v1/search/route.ts", "utf8");
const routesTestSource = readFileSync("tests/metasearch-routes.test.ts", "utf8");

test("browser result renderers share an HTTP-only URL safety module", () => {
  expect(pageSource).toContain("/public/metasearch/url-safety.ts");
  expect(routesTestSource).toContain("/public/metasearch/url-safety.ts");
  expect(answerEvidenceSource).toContain("safeHttpUrl(result.url)");
  expect(resultCardsSource).toContain("safeHttpUrl(result.url)");
});

test("answer evidence keeps selected engines and avoids sensitive background categories", () => {
  expect(answerEvidenceSource).toContain('const categoryEvidenceCategories = ["images", "videos", "news", "maps", "music", "science", "it"];');
  expect(answerEvidenceSource.includes("loadCategorySet(false)")).toBe(false);
});

test("answer prompt postMessage is same-origin by default", () => {
  expect(runtimeSource).toContain("messageOriginAllowed");
  expect(runtimeSource).toContain("event.origin");
  expect(runtimeSource).toContain("window.location.origin");
});

test("search API stays on the DX WWW origin", () => {
  expect(pageSource.includes("127.0.0.1:8888")).toBe(false);
  expect(runtimeSource.includes("127.0.0.1:8888")).toBe(false);
  expect(runtimeSource).toContain("new URL(\"/api/v1/search\", apiOrigin)");
  expect(routeSource).toContain("createDxMetasearchSearchResponse");
});

test("header search UI is disabled while tab controls keep state inputs", () => {
  expect(pageSource).toContain("{/* <header className=\"site-header\">");
  expect(pageSource).toContain("// import { SearchToolbar }");
  expect(pageSource.includes("<SearchToolbar />")).toBe(true);
});

test("clearing results also clears busy state after errors or empty responses", () => {
  expect(runtimeSource).toContain("clearBusyState");
  expect(runtimeSource).toContain('resultList.removeAttribute("aria-busy")');
});

test("empty searches still update the browser URL before clearing results", () => {
  expect(schedulerSource).toContain("replaceSearchUrl(state)");
  expect(schedulerSource).toContain("if (!state.query)");
});
