import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toBe(expected: TValue): void;
  toContain(expected: string): void;
};

const controlsSource = readFileSync("components/metasearch/search-controls.tsx", "utf8");
const runtimeSource = readFileSync("public/metasearch/runtime.ts", "utf8");
const baseStyles = readFileSync("styles/base.css", "utf8");

test("category tabs expose a measured overflow surface", () => {
  expect(controlsSource).toContain("data-category-tab-track");
  expect(controlsSource).toContain("data-category-overflow");
  expect(controlsSource).toContain("data-category-overflow-panel");
  expect(controlsSource).toContain("data-category-controls");
});

test("category tab layout moves extra buttons into the overflow menu", () => {
  expect(runtimeSource).toContain("layoutCategoryTabs");
  expect(runtimeSource).toContain("ResizeObserver");
  expect(runtimeSource).toContain("categoryOverflowPanel.replaceChildren");
  expect(runtimeSource).toContain("categoryOverflow.hidden");
  expect(runtimeSource).toContain("categoryControls.getBoundingClientRect().width");
});

test("category overflow menu prevents horizontal rail spill", () => {
  expect(baseStyles).toContain(".category-tab-track");
  expect(baseStyles).toContain("overflow: hidden");
  expect(baseStyles).toContain(".category-overflow-panel");
  expect(baseStyles).toContain(".control-icon-trigger");
});
