export const metasearchApiOrigin = "same-origin" as const;

export type SearchCategory =
  | "answer"
  | "general"
  | "images"
  | "videos"
  | "news"
  | "maps"
  | "science"
  | "music"
  | "files"
  | "social_media"
  | "it";

export type SearchTimeRange = "" | "day" | "week" | "month" | "year";

export type SearchLinkInput = {
  query?: string;
  category?: SearchCategory;
  language?: string;
  safeSearch?: number;
  timeRange?: SearchTimeRange | string;
  engines?: string;
};

export const searchCategories = [
  "answer",
  "general",
  "images",
  "videos",
  "news",
  "maps",
  "music",
  "science",
  "it",
  "files",
  "social_media",
] as const satisfies readonly SearchCategory[];

export const answerPrimaryCategories = ["general"] as const;

export function metasearchApiUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function normalizeSearchCategory(value?: string | null): SearchCategory {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "answer" || normalized === "ai") return "answer";
  if (normalized === "map") return "maps";
  if (normalized === "image") return "images";
  if (normalized === "video") return "videos";
  if (normalized === "file") return "files";
  if (normalized === "web") return "general";
  if (normalized === "academic") return "science";
  if (normalized === "code" || normalized === "dev") return "it";
  if (normalized === "social" || normalized === "socialmedia") return "social_media";
  if (normalized && (searchCategories as readonly string[]).includes(normalized)) {
    return normalized as SearchCategory;
  }
  if (normalized === "maps" || normalized === "social_media") {
    return normalized;
  }
  return "general";
}

export function apiSearchCategories(category?: SearchCategory | string | null): string {
  const normalized = normalizeSearchCategory(category);
  return normalized === "answer" ? answerPrimaryCategories.join(",") : normalized;
}

export function normalizeTimeRange(value?: string | null): SearchTimeRange {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "day" || normalized === "week" || normalized === "month" || normalized === "year") {
    return normalized;
  }
  return "";
}

export function normalizeEngineList(value?: string | null): string {
  return (value || "")
    .split(",")
    .map((engine) => engine.trim())
    .filter(Boolean)
    .slice(0, 24)
    .join(",");
}

function appendOptionalFilters(params: URLSearchParams, input: SearchLinkInput): void {
  const timeRange = normalizeTimeRange(input.timeRange);
  const engines = normalizeEngineList(input.engines);
  if (timeRange) params.set("time_range", timeRange);
  if (engines) params.set("engines", engines);
}

export function internalSearchPath({
  query = "",
  category = "answer",
  language = "en",
  safeSearch = 1,
  timeRange = "",
  engines = "",
}: SearchLinkInput = {}): string {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("category", normalizeSearchCategory(category));
  params.set("language", language);
  params.set("safe_search", String(safeSearch));
  appendOptionalFilters(params, { timeRange, engines });
  return `/?${params.toString()}#results`;
}

export function metasearchApiSearchPath({
  query = "",
  category = "answer",
  language = "en",
  safeSearch = 1,
  timeRange = "",
  engines = "",
}: SearchLinkInput = {}): string {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("format", "json");
  params.set("categories", apiSearchCategories(category));
  params.set("language", language);
  params.set("safe_search", String(safeSearch));
  appendOptionalFilters(params, { timeRange, engines });
  return `/api/v1/search?${params.toString()}`;
}

export const metasearchPageLinks = {
  results: "#results",
} as const;

export const metasearchApiLinks = {
  config: metasearchApiUrl("/api/v1/config"),
  engines: metasearchApiUrl("/api/v1/engines"),
  search: metasearchApiUrl("/api/v1/search"),
  status: metasearchApiUrl("/api/v1/status"),
  translate: metasearchApiUrl("/api/v1/translate"),
  live: metasearchApiUrl("/livez"),
  ready: metasearchApiUrl("/readyz"),
  health: metasearchApiUrl("/health"),
} as const;
