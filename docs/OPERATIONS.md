# Operations & Maintenance Runbook — Watt a Ham

Deployment configuration, Service Worker cache management, content authoring workflows, and troubleshooting for **Watt a Ham**.

---

## 1. Hosting & Deployment Inventory

| Item | Value |
| :--- | :--- |
| **Primary Production URL (Cloudflare Pages)** | https://watt-a-ham.dayjobmedia.com/ (`https://watt-a-ham.pages.dev/`, project `watt-a-ham`) |
| **DNS Setup (`dayjobmedia.com` on GoDaddy)** | `CNAME` record `watt-a-ham` → `watt-a-ham.pages.dev` (`ns45/ns46.domaincontrol.com`) |
| **GitHub Pages Mirror** | https://ma-djm.github.io/watt-a-ham/ (branch `main`, root `/`, [`.nojekyll`](../.nojekyll)) |
| **GitHub Repository** | `ma-djm/watt-a-ham` (`https://github.com/ma-djm/watt-a-ham.git`) |
| **Environment Variables / Secrets** | **None** — 100% client-side static PWA with zero backend or build secrets |

---

## 2. Release, Cache-Bump & Smoke-Test Runbook

### Step 1: Bump `CACHE_NAME` in `sw.js` (Required Whenever Assets Change)
Installed mobile/desktop PWAs serve assets cache-first via [`../sw.js`](../sw.js). Whenever any file in `ASSETS` (`index.html`, `style.css`, `data.js`, `app.js`, `manifest.json`, `icon.svg`) changes:

1. Open [`../sw.js`](../sw.js) and increment `CACHE_NAME` (e.g., `'watt-a-ham-2026-v7'` → `'watt-a-ham-2026-v8'`).
2. Never add `'./sw.js'` itself to the `ASSETS` array (`smoke_test.mjs` verifies all runtime files and all `./assets/photos/*.jpg` images are listed).

### Step 2: Rebuild `data.js` & Run Full Verification
From the repository root:

```powershell
python scripts/build_data.py; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node --check app.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/smoke_test.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Expected output ends with:
- `SUCCESS: Generated data.js (...)`
- `ALL SMOKE CHECKS PASSED!`
- `ALL END-TO-END BEHAVIORAL INTEGRATION TESTS PASSED!`

### Step 3: Deploy to Cloudflare Pages + Commit & Push to GitHub
Deploy the staged production bundle (excluding `scripts/` and `docs/`, and injecting cache-revalidation `_headers` for `sw.js` and `index.html`) to Cloudflare Pages, then push to `main`:

```powershell
python scripts/deploy_cloudflare.py; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git status -s
git add index.html style.css app.js data.js sw.js
git commit -m "Describe release concisely"
git push origin main
& "C:\Program Files\GitHub CLI\gh.exe" api repos/ma-djm/watt-a-ham/pages/builds/latest --jq "{status: .status, commit: .commit, updated_at: .updated_at}"
```

*(Note: On non-Windows shells where `gh` is on `PATH`, run `gh api repos/ma-djm/watt-a-ham/pages/builds/latest` directly.)*

---

## 3. Content & Question Pool Maintenance

### Editing Walkthrough Cards or Question Explanations
1. Locate the target group in `scripts/data_parts/`:
   - [`../scripts/data_parts/part1_T1_T2.json`](../scripts/data_parts/part1_T1_T2.json) — Groups `T1A`–`T1F`, `T2A`–`T2C`
   - [`../scripts/data_parts/part2_T3_T4_T0.json`](../scripts/data_parts/part2_T3_T4_T0.json) — Groups `T3A`–`T3C`, `T4A`–`T4B`, `T0A`–`T0C`
   - [`../scripts/data_parts/part3_T5_T6.json`](../scripts/data_parts/part3_T5_T6.json) — Groups `T5A`–`T5D`, `T6A`–`T6D`
   - [`../scripts/data_parts/part4_T7_T8_T9.json`](../scripts/data_parts/part4_T7_T8_T9.json) — Groups `T7A`–`T7D`, `T8A`–`T8D`, `T9A`–`T9B`
2. Follow schema invariants enforced by [`../scripts/build_data.py`](../scripts/build_data.py) and [`../scripts/smoke_test.mjs`](../scripts/smoke_test.mjs):
   - `4` to `7` cards per group; every card except the last has `"kind": "concept"` and `paragraphs` (`>= 2` strings); the final card has `"kind": "cheatsheet"` and `bullets` (`>= 3` strings).
   - `illustration` must be `null` or a valid key in [`../scripts/teaching_svgs.py`](../scripts/teaching_svgs.py) (`ILLUSTRATIONS`).
   - `widget` must be `null` or a valid key in `VALID_WIDGETS` (`build_data.py`) handled by `renderMiniAidForBriefing()` (`app.js`).
   - Use `**bold**` and `` `code` `` **only** for exam-tested facts/numbers in `concept` cards, and ensure every `*` and `` ` `` pair is balanced.
3. Run `python scripts/build_data.py` and `node scripts/smoke_test.mjs` to regenerate and verify [`../data.js`](../data.js).

### Adding Glossary Concepts or Teaching SVGs
- **Glossary ([`../scripts/glossary_data.py`](../scripts/glossary_data.py)):** Add an entry with `term`, `expansion`, `aliases` (array of case-insensitive phrases matched automatically across lessons), `category`, `definition`, and `analogy`. Avoid short ambiguous English words in `aliases` (e.g., use `"band plan"` rather than `"plan"`).
- **Teaching SVGs ([`../scripts/teaching_svgs.py`](../scripts/teaching_svgs.py)):** Use `class="teaching-svg"`, an explicit `viewBox`, `role="img"`, `aria-label`, and theme-aware colors (`currentColor`, `var(--accent)`, `var(--gold)`, `var(--success)`, `var(--bg-surface)`, `var(--border-strong)`) so diagrams remain legible in both Dark and Light themes.

### Applying Official NCVEC Errata
If the NCVEC Question Pool Committee issues new errata during the 2026–2030 cycle:
1. Update the affected question/answer in [`../scripts/pool_raw.json`](../scripts/pool_raw.json) and add the assertion to `ERRATA_2026_02_19` (or a new errata map) in [`../scripts/build_data.py`](../scripts/build_data.py).
2. Update the corresponding explanation and cheatsheet/concept card in `scripts/data_parts/part*.json`, bump `CACHE_NAME` in `sw.js`, rebuild `data.js`, run `node scripts/smoke_test.mjs`, and push to `main`.

---

## 4. Troubleshooting

- **Live site still shows old UI or cards after `git push`:**
  1. Check `gh api repos/ma-djm/watt-a-ham/pages/builds/latest` to confirm `"status": "built"`.
  2. Confirm `CACHE_NAME` in [`../sw.js`](../sw.js) was incremented; if not, bump `CACHE_NAME` and push so installed Service Workers evict the old cache on activation.
- **`smoke_test.mjs` fails with `Unrendered markdown in ...`:**
  - A string contains an unmatched `*` or `` ` ``, spaces immediately inside `*...*`, or a literal `*` inside `` `...` `` (e.g., `` `*` `` renders to `<code>*</code>`, which still trips the raw-`*` check). Replace literal `*` symbols with words (e.g., `star` or `×`).
- **GitHub push rejected when modifying `.github/workflows/*`:**
  - The local `gh` OAuth token only carries `repo`, `read:org`, and `gist` scopes (no `workflow` scope). Because GitHub Pages deploys directly from `main` (`/`) via legacy static publishing, no GitHub Actions workflow files are needed.
