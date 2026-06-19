export function SearchControls() {
  return (
    <section className="control-deck" aria-label="Search controls">
      <form className="search-state-form" data-search-form="true" action="/" method="get" hidden>
        <input id="query" name="q" type="hidden" data-query-input="true" />
        <input id="category" name="category" type="hidden" data-category-input="true" />
        <input id="safe-search" name="safe_search" type="hidden" data-safe-search-input="true" />
        <input id="time-range" name="time_range" type="hidden" data-time-range-input="true" />
      </form>

      <div className="segmented-select category-tabs" role="group" aria-label="Search categories">
        <div className="category-tab-track" data-category-tab-track="true">
          <button type="button" data-category-tab="true" data-category-value="answer" data-tooltip="Answer">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="spark" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M12 3 9.8 8.8 4 11l5.8 2.2L12 19l2.2-5.8L20 11l-5.8-2.2L12 3Z" />
              <path d="M5 4v4" />
              <path d="M3 6h4" />
              <path d="M19 16v4" />
              <path d="M17 18h4" />
            </svg>
            <span>Answer</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="general" data-tooltip="General">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="search" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              <path d="m16 16 5 5" />
            </svg>
            <span>General</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="images" data-tooltip="Images">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="image" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M4 5h16v14H4V5Z" />
              <path d="m7 16 4-4 3 3 2-2 3 3" />
              <path d="M9 9h.01" />
            </svg>
            <span>Images</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="videos" data-tooltip="Videos">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="play" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7L8 5Z" />
            </svg>
            <span>Videos</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="news" data-tooltip="News">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="news" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M5 5h14v14H5V5Z" />
              <path d="M8 9h8" />
              <path d="M8 13h8" />
              <path d="M8 17h5" />
            </svg>
            <span>News</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="maps" data-tooltip="Maps">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="map" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M4 6 9 4l6 2 5-2v14l-5 2-6-2-5 2V6Z" />
              <path d="M9 4v14" />
              <path d="M15 6v14" />
            </svg>
            <span>Maps</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="music" data-tooltip="Music">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="music" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M9 18V6l10-2v12" />
              <path d="M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
              <path d="M19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
            </svg>
            <span>Music</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="science" data-tooltip="Science">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="science" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M10 3h4" />
              <path d="M11 3v6l-5 9a2 2 0 0 0 1.7 3h8.6a2 2 0 0 0 1.7-3l-5-9V3" />
              <path d="M8 17h8" />
            </svg>
            <span>Science</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="it" data-tooltip="Code">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="code" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="m8 8-4 4 4 4" />
              <path d="m16 8 4 4-4 4" />
              <path d="m14 5-4 14" />
            </svg>
            <span>Code</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="files" data-tooltip="Files">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="files" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M7 3h7l4 4v14H7V3Z" />
              <path d="M14 3v5h5" />
              <path d="M10 13h6" />
              <path d="M10 17h4" />
            </svg>
            <span>Files</span>
          </button>
          <button type="button" data-category-tab="true" data-category-value="social_media" data-tooltip="Social">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="social" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M16 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M10.5 10.5 13.5 13.5" />
              <path d="M10.7 8.9 15 6.5" />
            </svg>
            <span>Social</span>
          </button>
        </div>

        <details className="category-overflow" data-category-overflow="true" hidden>
          <summary className="category-overflow-trigger control-icon-trigger" data-category-overflow-trigger="true" data-tooltip="More categories">
            <svg aria-hidden="true" className="ui-icon" data-dx-icon="more" data-icon-source="dx-icons" viewBox="0 0 24 24">
              <path d="M5 12h.01" />
              <path d="M12 12h.01" />
              <path d="M19 12h.01" />
            </svg>
            <span className="visually-hidden">More</span>
          </summary>
          <div className="category-overflow-panel" data-category-overflow-panel="true" />
        </details>

        <div className="control-actions" data-category-controls="true">
          <details className="dropdown">
            <summary className="dropdown-trigger control-icon-trigger" aria-label="Refine search" data-tooltip="Refine search">
              <svg aria-hidden="true" className="ui-icon" data-dx-icon="filter" data-icon-source="dx-icons" viewBox="0 0 24 24">
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
            </summary>

          <div className="dropdown-panel">
            <div className="filter-stack">
              <div className="filter-row">
                <span className="filter-label">Safe search</span>
                <div className="segmented-select" role="group" aria-label="Safe search">
                  <button type="button" data-safe-search-button="true" data-safe-search-value="0" data-tooltip="Safe search off">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="shield" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
                      <path d="m9 12 2 2 4-5" />
                    </svg>
                    <span>Off</span>
                  </button>
                  <button type="button" data-safe-search-button="true" data-safe-search-value="1" data-tooltip="Safe search on">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="shield" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
                      <path d="m9 12 2 2 4-5" />
                    </svg>
                    <span>Safe</span>
                  </button>
                  <button type="button" data-safe-search-button="true" data-safe-search-value="2" data-tooltip="Strict safe search">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="shield" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
                      <path d="m9 12 2 2 4-5" />
                    </svg>
                    <span>Strict</span>
                  </button>
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-label">Time</span>
                <div className="segmented-select" role="group" aria-label="Time range">
                  <button type="button" data-time-range-button="true" data-time-range-value="" data-tooltip="Any time">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="activity" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M3 12h4l2-7 4 14 2-7h6" />
                    </svg>
                    <span>Any</span>
                  </button>
                  <button type="button" data-time-range-button="true" data-time-range-value="day" data-tooltip="Past day">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="activity" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M3 12h4l2-7 4 14 2-7h6" />
                    </svg>
                    <span>Day</span>
                  </button>
                  <button type="button" data-time-range-button="true" data-time-range-value="week" data-tooltip="Past week">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="activity" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M3 12h4l2-7 4 14 2-7h6" />
                    </svg>
                    <span>Week</span>
                  </button>
                  <button type="button" data-time-range-button="true" data-time-range-value="month" data-tooltip="Past month">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="activity" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M3 12h4l2-7 4 14 2-7h6" />
                    </svg>
                    <span>Month</span>
                  </button>
                  <button type="button" data-time-range-button="true" data-time-range-value="year" data-tooltip="Past year">
                    <svg aria-hidden="true" className="ui-icon" data-dx-icon="activity" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M3 12h4l2-7 4 14 2-7h6" />
                    </svg>
                    <span>Year</span>
                  </button>
                </div>
              </div>

              <div className="field-grid">
                <label className="text-field" htmlFor="language">
                  <span className="field-label">Language</span>
                  <span className="field-shell">
                    <svg aria-hidden="true" className="ui-icon field-icon" data-dx-icon="details" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M5 6h14" />
                      <path d="M5 12h14" />
                      <path d="M5 18h10" />
                    </svg>
                    <input
                      id="language"
                      name="language"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      placeholder="en"
                      data-language-input="true"
                    />
                  </span>
                </label>

                <label className="text-field" htmlFor="engines">
                  <span className="field-label">Engines</span>
                  <span className="field-shell">
                    <svg aria-hidden="true" className="ui-icon field-icon" data-dx-icon="engine" data-icon-source="dx-icons" viewBox="0 0 24 24">
                      <path d="M4 13h3l2-4h6l2 4h3v5H4v-5Z" />
                      <path d="M9 9V6h6v3" />
                      <path d="M8 18v2" />
                      <path d="M16 18v2" />
                    </svg>
                    <input
                      id="engines"
                      name="engines"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      placeholder="bing, brave"
                      data-engine-input="true"
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>
          </details>

          <details className="dropdown insights-dropdown">
            <summary className="dropdown-trigger control-icon-trigger" aria-label="Search details" data-tooltip="Search details">
              <svg aria-hidden="true" className="ui-icon" data-dx-icon="details" data-icon-source="dx-icons" viewBox="0 0 24 24">
                <path d="M5 6h14" />
                <path d="M5 12h14" />
                <path d="M5 18h10" />
              </svg>
            </summary>

            <div className="dropdown-panel insights-panel">
              <section className="insights-section insights-overview" aria-label="Result summary">
                <div className="details-summary" data-response-summary="true" />
              </section>

              <section className="insights-section">
                <h2 className="insights-title">
                  <svg aria-hidden="true" className="ui-icon" data-dx-icon="details" data-icon-source="dx-icons" viewBox="0 0 24 24">
                    <path d="M5 6h14" />
                    <path d="M5 12h14" />
                    <path d="M5 18h10" />
                  </svg>
                  <span>Details</span>
                </h2>
                <div className="details-list" data-response-details="true" />
              </section>

              <section className="insights-section">
                <h2 className="insights-title">
                  <svg aria-hidden="true" className="ui-icon" data-dx-icon="engine" data-icon-source="dx-icons" viewBox="0 0 24 24">
                    <path d="M4 13h3l2-4h6l2 4h3v5H4v-5Z" />
                    <path d="M9 9V6h6v3" />
                    <path d="M8 18v2" />
                    <path d="M16 18v2" />
                  </svg>
                  <span>Engines</span>
                </h2>
                <div className="engine-cloud" data-engine-list="true" />
              </section>

              <section className="insights-section" data-failed-engine-panel="true" hidden>
                <h2 className="insights-title">
                  <svg aria-hidden="true" className="ui-icon" data-dx-icon="alert" data-icon-source="dx-icons" viewBox="0 0 24 24">
                    <path d="M12 4 3.5 19h17L12 4Z" />
                    <path d="M12 9v4" />
                    <path d="M12 16h.01" />
                  </svg>
                  <span>Failed</span>
                </h2>
                <div className="engine-cloud" data-failed-engine-list="true" />
              </section>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
