# AGENTS.md — Watt a Ham

High-signal instructions for AI coding assistants working in this repository.

## Stack Snapshot

- **Runtime App:** Zero-build static PWA — Vanilla HTML5 (`<dialog closedby="any">`, `popover="auto"`), CSS3 custom properties (`[data-theme="dark" | "light"]`), Vanilla ES2020 IIFE (`app.js` + `window.HAM_DATA` from `data.js`), Service Worker (`sw.js`). **Zero npm packages or external CDN scripts.**
- **Data Builder & Validator:** Python `3.13+` (`scripts/build_data.py`, standard library only).
- **Smoke & Integration Tests:** Node.js `22.x` ESM (`scripts/smoke_test.mjs`, built-in `node:vm` + `node:assert/strict` only).
- **Hosting:** Cloudflare Pages (`https://watt-a-ham.dayjobmedia.com/`, project `watt-a-ham` via `python scripts/deploy_cloudflare.py`) + GitHub Pages (`https://ma-djm.github.io/watt-a-ham/` from `main` branch `/`).

## Repository Map

| Path | Purpose |
| :--- | :--- |
| `index.html` | Single-page HTML5 shell, 3 tab views, session overlay, `<dialog>` modals, and `#jargon-popover` |
| `style.css` | Dark/light theme tokens, mobile thumb-zone layout, walkthrough cards, SVG/widget & popover styles |
| `app.js` | State (`localStorage["ham_study_v1"]`), campaign path, 3-stage lessons, jargon linker, widgets, exams |
| `data.js` | **Generated** bundle (`window.HAM_DATA`) — **never hand-edit**; rebuild via `python scripts/build_data.py` |
| `sw.js` | Offline cache-first Service Worker (`CACHE_NAME` must be bumped on every asset release) |
| `manifest.json` / `icon.svg` | Standalone PWA metadata and maskable vector app icon |
| `assets/photos/*.jpg` | 32 resized Wikimedia Commons equipment photos (~1.25 MB, precached in `sw.js`) |
| `scripts/build_data.py` | Compiles & validates `data.js` from `pool_raw.json`, `data_parts/*.json`, glossary, photos, and SVGs |
| `scripts/fetch_photos.py` / `scripts/photos_data.py` | Deterministic Commons fetcher/optimizer and verified photo license/metadata registry |
| `scripts/deploy_cloudflare.py` | Stages clean runtime bundle + `_headers` and deploys to Cloudflare Pages (`watt-a-ham`) |
| `scripts/data_parts/*.json` | Authored per-question `explanations` and per-group `briefings` (35 walkthrough decks / 146 cards) |
| `scripts/glossary_data.py` | 88 multi-alias ham/electronics glossary concepts (254 terms) for inline popovers & Aids search |
| `scripts/teaching_svgs.py` | 19 theme-aware inline teaching SVGs (`ILLUSTRATIONS`) |
| `scripts/figures_svg.py` | Official examination schematics `T-1`, `T-2`, and `T-3` (`FIGURES`) |
| `scripts/smoke_test.mjs` | Static bundle assertions + end-to-end behavioral DOM/VM integration suite |
| `docs/` | Deep-dive architecture (`ARCHITECTURE.md`), runbooks (`OPERATIONS.md`), and historical initial specs |

## Critical Guardrails & Known Pitfalls

1. **Dual `https://` + `file://` Compatibility (Zero External Dependencies):** The app must boot cleanly both as an installed HTTPS PWA and by double-clicking `index.html` via `file://` offline. Never add ES module `<script type="module">` imports to `index.html` (blocked by `file://` CORS), external CDN scripts/fonts, or runtime `fetch()` calls for core data.
2. **Never Hand-Edit `data.js`:** Edit `scripts/data_parts/part*.json`, `scripts/glossary_data.py`, `scripts/teaching_svgs.py`, or `scripts/figures_svg.py`, then run `python scripts/build_data.py` and commit both the source files and regenerated `data.js`.
3. **Always Bump `CACHE_NAME` in `sw.js` Before Deploying Asset Changes:** `sw.js` uses a cache-first strategy. Any change to `index.html`, `style.css`, `app.js`, `data.js`, `manifest.json`, `icon.svg`, or `assets/photos/*.jpg` requires incrementing `CACHE_NAME` (e.g., `'watt-a-ham-2026-v7'` → `'watt-a-ham-2026-v8'`). Keep `./sw.js` **out** of `sw.js`'s `ASSETS` array, and ensure every `./assets/photos/<slug>.jpg` is listed in `ASSETS` and credited in `NOTICE`.
4. **No Spoilers or Invalid Nested `<button>` Tags in Quizzes/Exams:**
   - **Never** enable `linkJargon: true` inside `<button class="choice-btn">` labels (nested `<button class="jargon-term">` inside `<button>` is invalid HTML5 and breaks click/layout behavior).
   - **Never** show clickable jargon, `📖 Cards` peek buttons, or schematic component callout legends (`shouldHideSchematicLegend()`) on unanswered Stage 3 `Challenge`/Drill stems or during `Mock` / `Checkpoint` Exams.
5. **Strict Rich-Text Markdown Hygiene:** `scripts/smoke_test.mjs` asserts that zero raw `*` or `` ` `` characters survive `formatRichText()` across all explanations, glossary definitions/analogies, and walkthrough cards. Even literal asterisks inside inline code (like `` `*` ``) will fail the raw-character regex—spell out words like `star` instead.
6. **Walkthrough Authoring Rules:** In `concept` cards, use `**bold**` and `` `code` `` **exclusively** for exam-tested facts, formulas, and numbers (keep hobby lore/analogies unbolded). Maintain general-audience, schedule-neutral copy (avoid user-specific references like `"Night 1"`, `"nightly"`, or `"Sudoku"`).
7. **2026–2030 Technician Pool & Positional Choice Integrity:** Never alter official stems/choices in `scripts/pool_raw.json` (except the 4 verified Feb 19, 2026 NCVEC errata enforced in `build_data.py`), never teach legacy pre-2014/irrelevant band edges as tested Technician facts, and preserve `buildShuffledChoices()` pinning of `"All/None of these choices"` to slot `D`.
8. **Windows PowerShell 5.1 & `gh` CLI Quirks (Local Dev Environment):**
   - PowerShell 5.1 does not support `&&` and `$ErrorActionPreference = 'Stop'` does not halt on non-zero native-command exit codes—chain with `; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`.
   - Avoid PowerShell `>` redirection (writes UTF-16LE BOM); always write explicit UTF-8 in Python/Node.
   - If `gh` is not on `PATH` on Windows, invoke `& "C:\Program Files\GitHub CLI\gh.exe"`.

## Verification & Deploy Workflow

Run all three checks after any data or code edit before committing:

```powershell
python scripts/build_data.py; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node --check app.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/smoke_test.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Deploy to Cloudflare Pages & GitHub Pages (after bumping `CACHE_NAME` in `sw.js` if runtime assets changed):

```powershell
python scripts/deploy_cloudflare.py; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git status -s
git push origin main
& "C:\Program Files\GitHub CLI\gh.exe" api repos/ma-djm/watt-a-ham/pages/builds/latest --jq "{status: .status, commit: .commit, updated_at: .updated_at}"
```

## Deep-Dive Pointers

- Read **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** when modifying `app.js`, `style.css`, `index.html`, `window.HAM_DATA` schemas, `localStorage` state/backups, jargon popovers, or study/exam algorithms.
- Read **[`docs/OPERATIONS.md`](./docs/OPERATIONS.md)** when deploying to GitHub Pages, updating `sw.js` caching, authoring new walkthrough cards/SVGs/glossary entries, or troubleshooting offline/PWA behavior.
- Note: `docs/REQUIREMENTS.md` and `docs/TECHNICAL_DESIGN.md` are initial pre-implementation design artifacts kept for historical context; `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/OPERATIONS.md` are the authoritative docs for the live codebase.
