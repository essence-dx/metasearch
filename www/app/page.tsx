import { SearchControls } from "../components/metasearch/search-controls";
import { SearchToolbar } from "../components/metasearch/search-toolbar";

export const metadata = {
  title: "DX Metasearch",
  description: "Search results served through DX WWW.",
} as const;

export default function HomePage() {
  return (
    <div
      className="site-shell"
      data-metasearch-app="true"
      data-flow-tts-endpoint="http://127.0.0.1:8789/api/flow/tts"
    >
      <header className="site-header">
        <a className="brand" href="/" aria-label="DX Metasearch">
          <img className="brand-mark" src="/logo.svg" alt="DX" />
          <span className="brand-text">
            <span>DX</span>
            <strong>Metasearch</strong>
          </span>
        </a>

        {/* <SearchToolbar /> */}
      </header>

      <SearchControls />

      <main className="results-shell" id="results">
        <section className="results-main" aria-label="Search results">
          <div className="results-status" data-results-status="true" aria-live="polite" />
          <div className="result-list" data-result-list="true" />
        </section>

        <aside className="response-shell">
          <div className="response-summary" data-response-summary="true" aria-live="polite" />
          <div className="response-details" data-response-details="true" />
          <div className="engine-list" data-engine-list="true" />
          <div className="failed-engine-panel" data-failed-engine-panel="true" hidden>
            <div className="failed-engine-list" data-failed-engine-list="true" />
          </div>
        </aside>
      </main>
      <script src="/public/metasearch/url-safety.ts" defer></script>
      <script src="/public/metasearch/i18n-languages.ts" defer></script>
      <script src="/public/metasearch/answer-common.ts" defer></script>
      <script src="/public/metasearch/answer-tts.ts" defer></script>
      <script src="/public/metasearch/answer-controls.ts" defer></script>
      <script src="/public/metasearch/answer-summary.ts" defer></script>
      <script src="/public/metasearch/answer-evidence.ts" defer></script>
      <script src="/public/metasearch/answer-media.ts" defer></script>
      <script src="/public/metasearch/answer-renderer.ts" defer></script>
      <script src="/public/metasearch/result-common.ts" defer></script>
      <script src="/public/metasearch/result-cards.ts" defer></script>
      <script src="/public/metasearch/results-renderer.ts" defer></script>
      <script src="/public/metasearch/search-scheduler.ts" defer></script>
      <script src="/public/metasearch/runtime.ts" defer></script>
    </div>
  );
}
