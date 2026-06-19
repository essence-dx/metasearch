# DX Metasearch WWW Tasks

## Current

- Keep the DX WWW frontend aligned with the Axum API and health endpoints.
- Preserve same-origin navigation while keeping the browser runtime, URL safety, and TTS controls inside the WWW project.
- Keep `/api/v1/search` on the same DX WWW Axum origin as the page.

## Verification

- Run `G:\Dx\bin\dx.exe www imports check --json`.
- Run `G:\Dx\bin\dx.exe www style check --json`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-routes.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-category-overflow.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-security.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-accessibility.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-answer-copy.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-answer-tts.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-answer-media.test.ts`.
- Run `G:\Dx\bin\dx.exe www run --test tests/metasearch-docs.test.ts`.
- Run `G:\Dx\bin\dx.exe check --json`.
