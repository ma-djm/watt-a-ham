# SignalPath — US FCC Technician (Element 2) Study PWA

**Live App:** [https://ma-djm.github.io/ham/](https://ma-djm.github.io/ham/)

**SignalPath** is a zero-build, offline-capable Progressive Web App (PWA) designed to help you pass the **2026–2030 US FCC Technician Class (Element 2) Amateur Radio Exam** in **12 to 14 nights** (~30 minutes per night).

Instead of dumping 409 random flashcards on Night 1, SignalPath organizes the official pool into a **35-node guided skill path**—starting with intuitive on-air operating and station setup, and weaving in electronics, propagation, schematics, and FCC Part 97 rules in bite-sized blocks.

---

## Features

- **Authoritative 2026–2030 Pool + Feb 19, 2026 Errata:** Covers all **409 official NCVEC Element 2 questions** across **10 subelements (`T1`–`T0`)** and **35 groups (`T1A`–`T0C`)**, valid July 1, 2026 – June 30, 2030.
- **3-Stage Micro-Lessons per Node (~8–10 min):**
  1. **Briefing:** 2–3 plain-English concept cards with embedded visual aids.
  2. **Flash-Pass Warm-Up:** First exposure with wrong distractors dimmed/struck out so you never accidentally memorize wrong numbers.
  3. **Node Challenge:** Positional-safe shuffled 4-choice quiz that loops missed questions at the end of the round until 100% cleared (`Gold`).
- **Closed-Loop Practice Exams:**
  - **Official 35-Question Mock Exam:** True VEC simulation (1 random question per group, flagging, no mid-test hints, `26/35` pass) featuring **Smart Dual Scoring** mid-campaign (*Raw Score* + *Studied-Nodes Score*), Subelement breakdown, automatic `Cracked` node markers on missed Gold groups, and an immediate **Mistake Walkthrough**.
  - **Progress Checkpoint Exam:** 1 question per unlocked/Gold group for quick end-of-night checks.
- **Interactive Study Aids:**
  - **Visual Technician Band & Privilege Map** (`80m`, `40m`, `15m`, `10m`, `6m`, `2m`, `1.25m`, `70cm`).
  - **Interactive Ohm's Law, Power & Wavelength Sandbox** + 1-tap **33-Question Math & Conversion Drill**.
  - **Crisp Dark-Mode Vector Schematics** for official **Figures T-1, T-2, and T-3** with full-screen zoom.
  - **Exam Day Logistics Checklist** & **1-Tap `HAM1:` Progress Backup/Transfer Code**.
- **Works Everywhere (Zero Dependencies, Zero Build Step):**
  - **Installed Mobile PWA (`https://`):** Open the live link on iOS Safari (*Share → Add to Home Screen*) or Android Chrome (*Install app*) for full-screen, 100% offline study.
  - **Local Desktop (`file://`):** Double-click `index.html` directly from disk with no local server required, complete with keyboard shortcuts (`1`–`4` / `A`–`D`, `Space` / `Enter`, `F` to flag, `←` / `→`, `Esc`).

---

## Project Structure

```text
├── index.html          # Semantic HTML5 app shell & native <dialog> modals
├── style.css           # Dark-mode-first thumb-zone & responsive desktop styles
├── data.js             # Generated bundle: 409 questions, explanations, 35 briefings, 3 SVGs
├── app.js              # Skill path, 3-stage lessons, Signal Check, exams, localStorage
├── manifest.json       # Web App Manifest (standalone PWA)
├── sw.js               # Offline-first Service Worker
├── icon.svg            # Scalable maskable vector app icon
├── docs/               # Product Requirements & Technical Design specs
└── scripts/            # Deterministic data.js builder & end-to-end verification tests
```

### Rebuilding & Verifying `data.js` (Optional)

Runtime deployment requires **zero build step**. If you edit study explanations, briefings, or SVG schematics in `scripts/`, regenerate and verify `data.js` with:

```bash
python scripts/build_data.py
node scripts/smoke_test.mjs
```

---

## License & Attributions

- **Application Code, UI, Explanations, Briefings & Vector Schematics:** Licensed under the **[MIT License](./LICENSE)** (`Copyright (c) 2026 Michael Ames`).
- **Official Question Pool (`Public Domain`):** The 2026–2030 Element 2 (Technician Class) question pool, answer choices, FCC rule citations, February 19, 2026 errata, and examination figures `T-1`, `T-2`, and `T-3` are released into the **public domain** by the [NCVEC Question Pool Committee](https://www.ncvec.org/index.php/2026-2030-technician-question-pool).
- **Machine-Readable Pool Source (`Apache-2.0`):** Raw pool files in `scripts/pool_raw.*` are sourced from [`russolsen/ham_radio_question_pool`](https://github.com/russolsen/ham_radio_question_pool) under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). See **[NOTICE](./NOTICE)** for full attribution and state-of-change details.
