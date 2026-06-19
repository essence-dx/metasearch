export function SearchToolbar() {
  return (
    <form className="search-form" data-search-form="true" action="/" method="get">
      <label className="text-field query-field" htmlFor="query">
        <span className="field-label">Search</span>
        <span className="field-shell">
          <svg
            aria-hidden="true"
            className="ui-icon field-icon"
            data-dx-icon="search"
            data-icon-source="dx-icons"
            viewBox="0 0 24 24"
          >
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="query"
            name="q"
            type="search"
            inputMode="text"
            autoComplete="off"
            placeholder="Search the web"
            data-query-input="true"
          />
        </span>
      </label>

      <input id="category" name="category" type="hidden" data-category-input="true" />
      <input id="safe-search" name="safe_search" type="hidden" data-safe-search-input="true" />
      <input id="time-range" name="time_range" type="hidden" data-time-range-input="true" />

      <button className="primary-action" type="submit" data-tooltip="Search">
        <svg
          aria-hidden="true"
          className="ui-icon"
          data-dx-icon="search"
          data-icon-source="dx-icons"
          viewBox="0 0 24 24"
        >
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Search</span>
      </button>
    </form>
  );
}
