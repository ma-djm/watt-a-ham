# Watt a Ham — US FCC Technician (Element 2) Handbook & Study PWA

**Watt a Ham** is a zero-build, offline-capable Progressive Web App (PWA) and illustrated hobbyist handbook for passing the **2026–2030 US FCC Technician Class (Element 2) Amateur Radio Exam**—whether you are studying in short daily sessions or cramming in a single weekend.

- **Live App (Cloudflare Pages):** https://watt-a-ham.dayjobmedia.com/ (`https://watt-a-ham.pages.dev/`)
- **Mirror (GitHub Pages):** https://ma-djm.github.io/watt-a-ham/
- **Repository:** https://github.com/ma-djm/watt-a-ham
- **Runtime Stack:** Vanilla HTML5 (`<dialog>`, `popover="auto"`), CSS3 (dark/light custom properties), Vanilla ES2020 JavaScript, Offline Service Worker (`sw.js`) — **0 external runtime dependencies**
- **Authoring / Test Tooling:** Python 3 (`scripts/build_data.py`), Node.js ESM (`scripts/smoke_test.mjs`)

---

## Key Features

- **Authoritative 2026–2030 Pool + Feb 19, 2026 Errata:** Covers all **409 official NCVEC Element 2 questions** across **10 subelements (`T1`–`T0`)** and **35 groups (`T1A`–`T0C`)**, valid July 1, 2026 – June 30, 2030.
- **Zero-Prior-Knowledge Illustrated Handbook (146 Walkthrough Cards):**
  - Every group opens with **4–5 conversational cards** explaining equipment, slang (`rig`, `shack`, `HT`, `SWR`, `keyer`, `PTT`), radio physics, and FCC rules from scratch, ending in a **Quick-Recap Cheat-Sheet** card.
  - **Exam vs. Lore Visual Signaling:** Only exam-tested facts and numbers are **bolded** or `code-highlighted`; hobbyist context and analogies stay in normal type so you never wonder what to memorize.
  - **19 Custom Teaching SVGs, 32 Real Equipment Photos & Interactive Mini-Widgets:** Theme-aware vector diagrams, **32 offline-bundled freely licensed photographs** of real ham/electronics hardware (with tap-to-zoom & full Creative Commons credits), plus live interactive widgets (`Simplex/Repeater/Reverse` simulator, `Duty Cycle` slider, `SPST/SPDT` switch flipper, `300-Rule Wavelength` visualizer, and `Ohm's/Power` cover-up circles).
  - **Standalone Reading & Mid-Quiz Peek:** Browse any unlocked or locked node via **`📖 Read Walkthrough Cards Only`**, or tap **`📖 Cards`** mid-quiz to review that group's handbook cards.
- **Clickable Inline Jargon Popovers & Searchable Glossary:**
  - **88 multi-alias concepts (254 terms)** are dotted-underlined inside Walkthrough Cards, Stage 2 `Flash-Pass` stems, Post-Answer Feedback, and Mistake Walkthroughs (strictly disabled on unanswered quiz/exam questions).
  - Tapping a term opens a viewport-clamped popover with plain-English definitions, real-world analogies, and nested clickable jargon links (`← Back` history), paired with a **Searchable A–Z Glossary** in `Aids & Info`.
- **3-Stage Micro-Lessons & Spaced Retention:**
  1. **Stage 1 — Walkthrough Cards:** Illustrated concept cards + final Cheat-Sheet.
  2. **Stage 2 — Flash-Pass Warm-Up:** First exposure with wrong distractors dimmed/struck out so you lock in right answers first.
  3. **Stage 3 — Node Challenge:** Positional-safe shuffled 4-choice quiz that loops missed items at the end of the round until 100% cleared (`Gold`).
  - **Signal Check & Boss Checkpoints:** Targeted 5–10 question review queue prioritizing `Cracked` nodes and >12s hesitations, plus 4 multi-chapter Boss Checkpoints.
- **Closed-Loop Practice Exams:**
  - **Official 35-Question Mock Exam:** True VEC simulation (1 random question per group, flagging, spoiler-free schematics, `26/35` pass) with **Smart Dual Scoring** (*Raw Score* + *Studied-Nodes Score*), Subelement breakdown, automatic `Cracked` markers on missed Gold groups, and a **Mistake Walkthrough**.
  - **Progress Checkpoint Exam:** 1 question per completed/unlocked group for mid-path retention checks.
- **Interactive Study Aids & Offline Portability:**
  - Exam-focused **Technician Band & Power Summary** (with optional full Part 97 reference), live **Ohm's Law / Power Calculator**, **33-Question Math & Formula Drill**, zoomable **Figures T-1, T-2, and T-3**, **Exam Day Checklist**, and **1-Tap `HAM1:` Progress Backup/Transfer Codes**.

---

## Local Development

No `npm install`, bundler, or `.env` configuration is required.

### Running Locally
- **Direct file mode (`file://`):** Open [`./index.html`](./index.html) directly in any modern desktop browser.
- **Local HTTP server (to test PWA manifest & Service Worker):**
  ```bash
  python -m http.server 8000
  ```
  Then open http://localhost:8000/.

### Rebuilding `data.js` & Pre-Push Verification
Runtime files are static, while [`./data.js`](./data.js) is deterministically compiled from `scripts/pool_raw.json`, `scripts/data_parts/*.json`, `scripts/glossary_data.py`, `scripts/teaching_svgs.py`, and `scripts/figures_svg.py`. After editing any data source or runtime script, run:

```bash
python scripts/build_data.py
node --check app.js
node scripts/smoke_test.mjs
```

---

## Deployment Quick Reference

- **Cloudflare Pages (`watt-a-ham.dayjobmedia.com` / `watt-a-ham.pages.dev`):** Stages only runtime static files + `_headers` and deploys via Wrangler:
  ```bash
  python scripts/deploy_cloudflare.py
  ```
- **GitHub Pages (`ma-djm.github.io/watt-a-ham`):** Serves the repository root (`/`) directly from the `main` branch (`.nojekyll` enabled, no CI build step).

1. **Always bump `CACHE_NAME` in [`./sw.js`](./sw.js)** (e.g., `'watt-a-ham-2026-v9'` → `'watt-a-ham-2026-v10'`) whenever changing `index.html`, `style.css`, `app.js`, `data.js`, `manifest.json`, `icon.svg`, or `assets/photos/*.jpg`—otherwise installed offline PWAs will continue serving cached assets!
2. Run `python scripts/build_data.py`, `node --check app.js`, and `node scripts/smoke_test.mjs`.
3. Deploy to Cloudflare Pages (`python scripts/deploy_cloudflare.py`) and/or commit and push to `origin/main` (`git push origin main`).
   > **Warning:** Never force-push (`git push --force`) to `main` and never commit untracked build caches (`__pycache__/`).

---

## Documentation Map

- **[`AGENTS.md`](./AGENTS.md)** — Lean AI coding assistant entrypoint, critical guardrails, and verification workflow.
- **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** — System diagram, `window.HAM_DATA` & `localStorage` schemas, spoiler/HTML invariants, and subsystem guide.
- **[`docs/OPERATIONS.md`](./docs/OPERATIONS.md)** — GitHub Pages hosting config, Service Worker cache-bump runbook, content authoring workflow, and troubleshooting.
- Historical initial specs: [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) and [`docs/TECHNICAL_DESIGN.md`](./docs/TECHNICAL_DESIGN.md).

---

## License & Attributions

- **Application Code, UI, Explanations, Walkthrough Decks, Glossary & Vector Diagrams:** Licensed under the **[MIT License](./LICENSE)** (`Copyright (c) 2026 Michael Ames`).
- **Official Question Pool (`Public Domain`):** The 2026–2030 Element 2 (Technician Class) question pool, answer choices, FCC rule citations, February 19, 2026 errata, and examination figures `T-1`, `T-2`, and `T-3` are released into the **public domain** by the [NCVEC Question Pool Committee](https://www.ncvec.org/index.php/2026-2030-technician-question-pool).
- **Bundled Equipment Photographs (`PD` / `CC0` / `CC BY` / `CC BY-SA`):** Hardware photographs in `assets/photos/` originate from Wikimedia Commons; see **[NOTICE](./NOTICE)** and each photo's in-app zoom lightbox for author, license, and source URL credits.
- **Machine-Readable Pool Source (`Apache-2.0`):** Raw pool files in `scripts/pool_raw.*` are sourced from [`russolsen/ham_radio_question_pool`](https://github.com/russolsen/ham_radio_question_pool) under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). See **[NOTICE](./NOTICE)** for full attribution and state-of-change details.
