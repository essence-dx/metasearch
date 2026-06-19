# DX Metasearch WWW

DX Metasearch WWW is the public DX WWW frontend for the metasearch project in this repository.

It recreates the current local search experience with a polished neutral Vercel-style interface, system-aware light and dark themes, first-party icons, DX Style tokens, DX Forge policy, and DX Check receipts.

## Runtime Boundary

- Public UI: served by this DX WWW project.
- Search forms: same-origin DX WWW URLs with query, category, language, and safe-search params.
- Search API: `/api/v1/search` is served from the same DX WWW Axum origin and executes the metasearch engine locally.
- Health source: health, liveness, config, engines, search, and status API paths are recorded as same-origin metadata, not visible redirects.
- Flow TTS bridge: `tools/flow-tts-bridge.ts` exposes the optional quality voice path for trusted local browser origins only.
- Answer media stage: `public/metasearch/answer-media.ts` renders source-backed image, video, and audio panels in the Answer tab.

The browser never calls the legacy `:8888` service. DX WWW owns the public page and the search API route on one Axum server.

## Deployment

- Vercel target: https://dx-metasearch-www.vercel.app
- Vercel project: `dx-metasearch-www`
- Local preview: `dx dev --port 3001`
- Static build: `dx www build`

## DX Surfaces

- `dx` defines the WWW app, Style generation, Icon metadata, Forge policy, and Check score scale.
- `styles/theme.css` owns the light and dark design tokens.
- `styles/base.css`, `styles/home.css`, and `styles/results.css` own layout and component styling.
- `app/page.tsx` owns the visible public page so the current DX WWW runtime serves literal DOM.
- `lib/metasearch` owns internal URLs and typed API boundary metadata.
- `server/metasearch` owns the search route contract used by the DX WWW Axum runtime.
- `public/metasearch` owns the browser runtime, result renderers, URL safety, TTS controls, and category behavior.
- `vercel.json` keeps a strict same-origin script CSP with explicit TTS, Unsplash poster, and media endpoints.

## Commands

```powershell
G:\Dx\bin\dx.exe dev
G:\Dx\bin\dx.exe style build --json
G:\Dx\bin\dx.exe icon search search --pack lucide --limit 1
G:\Dx\bin\dx.exe www imports check --json
G:\Dx\bin\dx.exe www style check --json
G:\Dx\bin\dx.exe www run --test tests/metasearch-routes.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-category-overflow.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-security.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-accessibility.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-answer-copy.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-answer-tts.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-answer-media.test.ts
G:\Dx\bin\dx.exe www run --test tests/metasearch-docs.test.ts
G:\Dx\bin\dx.exe check --json
```
