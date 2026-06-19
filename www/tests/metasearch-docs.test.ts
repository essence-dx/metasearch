import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toBe(expected: TValue): void;
  toContain(expected: string): void;
};

const readme = readFileSync("README.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");
const todo = readFileSync("TODO.md", "utf8");

test("README documents the current same-origin search and TTS runtime boundary", () => {
  expect(readme).toContain("Search API");
  expect(readme).toContain("same DX WWW Axum origin");
  expect(readme).toContain("Flow TTS bridge");
  expect(readme.includes("script-free")).toBe(false);
});

test("README keeps launch verification commands current", () => {
  expect(readme).toContain("tests/metasearch-security.test.ts");
  expect(readme).toContain("tests/metasearch-accessibility.test.ts");
  expect(readme).toContain("tests/metasearch-answer-copy.test.ts");
  expect(readme).toContain("tests/metasearch-answer-tts.test.ts");
  expect(readme).toContain("tests/metasearch-answer-media.test.ts");
  expect(todo).toContain("tests/metasearch-security.test.ts");
  expect(todo).toContain("tests/metasearch-answer-copy.test.ts");
  expect(todo).toContain("tests/metasearch-answer-media.test.ts");
  expect(todo.includes("script-free")).toBe(false);
});

test("changelog does not claim a fresh production deployment without a deploy receipt", () => {
  expect(changelog.includes("Deployed the static DX WWW build")).toBe(false);
  expect(changelog).toContain("Prepared the Vercel target");
});
