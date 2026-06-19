import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toContain(expected: string): void;
};

const themeStyles = readFileSync("styles/theme.css", "utf8");
const baseStyles = readFileSync("styles/base.css", "utf8");
const resultStyles = readFileSync("styles/results.css", "utf8");
const resultCommon = readFileSync("public/metasearch/result-common.ts", "utf8");

test("light theme uses accessible Vercel-style accent and danger text contrast", () => {
  expect(themeStyles).toContain("--accent: 0 0% 4%");
  expect(themeStyles).toContain("--success: 0 0% 18%");
  expect(themeStyles).toContain("--danger: 0 72% 42%");
  expect(baseStyles).toContain("--accent: 0 0% 4%");
  expect(baseStyles).toContain("--success: 0 0% 18%");
  expect(baseStyles).toContain("--danger: 0 72% 42%");
});

test("result cards have keyboard focus parity with hover states", () => {
  expect(resultStyles).toContain(".result-card:focus-within");
  expect(resultStyles).toContain(".image-card:focus-visible");
  expect(resultStyles).toContain(".news-card:focus-within");
  expect(resultStyles).toContain(".music-card:focus-within");
});

test("scrollable code snippets are keyboard reachable", () => {
  expect(resultCommon).toContain('block.tabIndex = 0');
  expect(resultStyles).toContain(".code-snippet:focus-visible");
});

test("reduced motion disables nonessential animations and transforms", () => {
  expect(baseStyles).toContain("scroll-behavior: auto");
  expect(baseStyles).toContain("transition-duration: 0ms");
  expect(resultStyles).toContain("animation: none");
});
