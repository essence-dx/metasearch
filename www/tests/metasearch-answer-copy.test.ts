import { readFileSync } from "node:fs";

declare function test(name: string, testCase: () => void): void;
declare function expect<TValue>(actual: TValue): {
  toContain(expected: string): void;
  toBe(expected: TValue): void;
};

const answerCommonSource = readFileSync("public/metasearch/answer-common.ts", "utf8");
const answerRendererSource = readFileSync("public/metasearch/answer-renderer.ts", "utf8");
const answerEvidenceSource = readFileSync("public/metasearch/answer-evidence.ts", "utf8");

test("answer copy reads like a source-backed assistant response", () => {
  expect(answerCommonSource).toContain("Here are the search results");
  expect(answerCommonSource).toContain("highest-signal links");
  expect(answerCommonSource).toContain("Strongest signal");
  expect(answerCommonSource).toContain("The source cards below keep the best links ready");
});

test("answer loading states use polished assistant language", () => {
  expect(answerRendererSource).toContain("Reading live results");
  expect(answerRendererSource).toContain("Composing the source-backed answer");
});

test("answer evidence labels stay compact and professional", () => {
  expect(answerEvidenceSource).toContain('"Sources"');
  expect(answerEvidenceSource).toContain("Checking related result tabs");
  expect(answerEvidenceSource).toContain("source links");
  expect(answerEvidenceSource.includes("Live links")).toBe(false);
});
