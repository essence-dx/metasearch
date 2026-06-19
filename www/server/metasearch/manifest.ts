import {
  internalSearchPath,
  metasearchApiLinks,
  metasearchApiOrigin,
  metasearchPageLinks,
} from "../../lib/metasearch/routes";

export const metasearchServerManifest = {
  apiOrigin: metasearchApiOrigin,
  version: "0.1.0",
  engineCount: 221,
  effectiveEngineCount: 184,
  cacheEnabled: true,
  securityHeadersEnabled: true,
  crossOriginMode: "same-origin-www-axum",
  www: {
    defaultSearch: internalSearchPath(),
    routes: metasearchPageLinks,
  },
  health: {
    status: metasearchApiLinks.health,
    live: metasearchApiLinks.live,
    ready: metasearchApiLinks.ready,
  },
  api: {
    config: metasearchApiLinks.config,
    engines: metasearchApiLinks.engines,
    search: metasearchApiLinks.search,
    status: metasearchApiLinks.status,
  },
} as const;
