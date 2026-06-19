export type FrameworkCompletenessStatus = "source-owned" | "adapter-boundary";

export type FrameworkCompletenessItem = {
  id: string;
  lane: string;
  label: string;
  status: FrameworkCompletenessStatus;
  packageIds: readonly string[];
};

const item = (
  lane: string,
  id: string,
  label: string,
  status: FrameworkCompletenessStatus,
  packageIds: readonly string[] = [],
): FrameworkCompletenessItem => ({ id, lane, label, status, packageIds });

export const frameworkCompletenessContract = {
  schema: "dx.www.framework_completeness",
  publicAuthoring: "tsx-app-router",
  packagePolicy: "forge-source-owned-visible-files",
  stylePolicy: "dx-style-generated-css",
  checkPolicy: "dx-check-receipts",
} as const;

export const metasearchFrameworkCompleteness = [
  item("routing-parity", "nested-layouts", "Home, result, status, and footer regions share one App Router layout", "source-owned"),
  item("routing-parity", "loading-error-not-found-boundaries", "The first shell is pre-rendered and visible links stay inside DX WWW", "source-owned"),
  item("routing-parity", "route-groups", "Search, provider, status, and settings regions are grouped by component ownership", "source-owned"),
  item("routing-parity", "dynamic-params", "Internal query URLs preserve q, category, language, and safe search params", "source-owned"),
  item("routing-parity", "metadata-seo", "App metadata and SVG icons describe the public metasearch surface", "source-owned"),
  item("routing-parity", "route-handlers", "Axum API endpoints remain a typed adapter boundary", "adapter-boundary"),
  item("server-client-model", "server-actions-equivalent", "Form submission stays same-origin while the API boundary remains typed", "source-owned"),
  item("server-client-model", "form-actions", "Search and compact result forms resolve inside the DX WWW project", "source-owned"),
  item("server-client-model", "cookies-headers-session-helpers", "Strict privacy mode avoids cookies and session helpers", "source-owned"),
  item("server-client-model", "streaming-response-boundary", "Live JSON and RSS endpoints stay API-owned until DX WWW streaming is enabled", "adapter-boundary"),
  item("server-client-model", "cache-revalidate-story", "Status metrics are source-captured from the local backend API snapshot", "source-owned"),
  item("dev-experience", "reliable-hot-reload", "DX dev runs the TSX project from the root dx contract", "source-owned"),
  item("dev-experience", "tsx-first-templates", "All public UI is TSX, CSS, and typed route data", "source-owned"),
  item("dev-experience", "auto-imports", "DX imports sync owns the import-map and declarations receipts", "source-owned"),
  item("dev-experience", "dx-style-css-generation", "DX Style owns generated CSS from the theme and app sources", "source-owned"),
  item("dev-experience", "dx-check-receipts", "DX Check and project-contract reports cover the project before commit", "source-owned"),
  item("dev-experience", "obvious-cli-path", "The project runs through G:\\Dx\\bin\\dx.exe from this folder", "source-owned"),
  item("production-template", "real-dashboard-starter", "Home, results, and system status are real public product surfaces", "source-owned"),
  item("production-template", "auth-page", "Anonymous metasearch has no login surface by design", "adapter-boundary"),
  item("production-template", "settings-validation-form", "Language, safe search, and category controls remain visible in the same page", "source-owned"),
  item("production-template", "payment-plan-page", "Commercial packaging is intentionally outside the public search page", "adapter-boundary"),
  item("production-template", "database-backed-table-boundary", "Provider and engine data stays behind the Axum API boundary", "adapter-boundary"),
  item("production-template", "docs-content-route", "README and backend documentation links document the deployable surface", "source-owned"),
  item("production-template", "ai-chat-route", "Conversational search is a future adapter beyond this public launch page", "adapter-boundary"),
  item("package-ecosystem", "visual-studio-markers", "DX Icon markers identify search, media, status, and privacy affordances", "source-owned", ["dx/icon/search"]),
  item("package-ecosystem", "state-management", "The app uses typed local data and same-origin forms instead of npm stores", "source-owned"),
  item("package-ecosystem", "backend-platform-client", "Metasearch API and health endpoints are typed in lib/metasearch/routes.ts", "source-owned"),
  item("package-ecosystem", "ui-components-icons", "Icon rendering is source-owned and tagged for DX Icon provenance", "source-owned", ["dx/icon/search"]),
  item("package-ecosystem", "internationalization", "Language selection is encoded in internal URLs without client packages", "source-owned"),
] satisfies readonly FrameworkCompletenessItem[];

export function metasearchFrameworkCompletenessSummary() {
  return {
    ...frameworkCompletenessContract,
    itemCount: metasearchFrameworkCompleteness.length,
    sourceOwnedCount: metasearchFrameworkCompleteness.filter((entry) => entry.status === "source-owned").length,
    adapterBoundaryCount: metasearchFrameworkCompleteness.filter((entry) => entry.status === "adapter-boundary").length,
  };
}
