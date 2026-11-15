# Technical Design Document (TDD): Zero-Build Static Technician HAM Study PWA

## 1. Architecture: Clean Static PWA Folder (Zero Build Step)

### 1.1 Runtime File Layout
The entire application lives as a clean, zero-build static PWA folder (~300 KB total) that runs **both** as an installable offline PWA over static HTTPS (GitHub Pages, Netlify Drop, Cloudflare Pages) **and** locally by double-clicking `index.html` (`file://`):

```text
ham2/
├── index.html       # Semantic HTML5 shell & <dialog> modals (~15 KB)
├── style.css        # Dark-mode-first mobile thumb-zone & desktop styles (~18 KB)
├── data.js          # window.HAM_DATA: 409 questions + explanations + 35 briefings + 3 SVG figures (~230 KB)
├── app.js           # Path, 3-stage lessons, Signal Check, 2 exam modes, study aids, localStorage (~45 KB)
├── manifest.json    # Spec-compliant Web App Manifest (standalone dark-mode PWA)
├── sw.js            # Spec-compliant Service Worker (caches all static files offline)
└── icon.svg         # Scalable vector app icon (maskable & home-screen ready)
```

> [!NOTE]
> **Deterministic Generation of `data.js`**
> While the deployed app requires **zero build step**, `data.js` (~230 KB) is assembled and verified via helper scripts in `scripts/` (from the authoritative NCVEC 2026–2030 pool + per-subelement explanations + briefings) so we never hand-edit a 230 KB file or risk missing a single question or errata update.

---

## 2. Spec-Compliant PWA Design (`manifest.json` & `sw.js`)

### 2.1 `manifest.json`
```json
{
  "id": "./",
  "name": "Technician HAM Radio Study",
  "short_name": "HamStudy T2",
  "description": "Guided 35-node study path & mock exams for the 2026-2030 FCC Technician exam.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "./icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### 2.2 `sw.js` (Offline-First Service Worker)
Caches the entire 7-file app on install so launching from a phone's Home Screen works 100% offline:
```js
const CACHE_NAME = 'ham-tech-2026-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './manifest.json',
  './icon.svg'
];
```
Registration in `app.js` checks `location.protocol.startsWith('http')` so opening `index.html` directly from disk (`file://`) runs cleanly with zero console errors.

---

## 3. Data Schemas (`data.js` & `localStorage`)

### 3.1 `window.HAM_DATA` Object (`data.js`)
Exposes `{ pool, campaign, briefings, figures }`, where each item in `pool` (409 items) has:
```json
{
  "id": "T5D01",
  "element": 2,
  "subelement": "T5",
  "group": "T5D",
  "question": "What formula is used to calculate current in a circuit?",
  "choices": ["I = E × R", "I = E / R", "I = R / E", "I = P × R"],
  "answer": 1,
  "has_positional_choice": false,
  "fcc_rules": [],
  "figure": null,
  "tags": ["math", "ohms-law"],
  "explanation": "Cover I in the Ohm's Law triangle (E on top, I × R on bottom): Current = Voltage / Resistance (I = E / R)."
}
```

### 3.2 Validation Rules Enforced on `data.js`
1. **Pool Completeness**: Exactly **409 questions**, **10 subelements (`T1`–`T0`)**, and **35 groups (`T1A`–`T0C`)**.
2. **Feb 19, 2026 Errata Verification**: Asserts updated stems for `T1C01`, `T5A05`, `T7A09`, and `T0A10`.
3. **Positional Choice Guard (`has_positional_choice`)**: `true` whenever choices contain `"all of these"`, `"none of these"`, or letter cross-references (`"Both A and B"`, etc.).
4. **100% Explanation, Briefing & Figure Coverage**: Every question has a plain-English `explanation`, all 35 groups have a multi-card briefing, and `Figures T-1, T-2, T-3` inline SVGs match every referenced `T6`/`T7` callout number.

### 3.3 `localStorage["ham_study_v1"]` Schema (~10–15 KB)
- **`streak`**: `{ count, longest, lastDay, todayNodes, todayReviewDone, todaySeconds }` using a **03:00 AM local rollover** so late-night study sessions never break streaks.
- **`nodes[group]`**: `{ status: "locked" | "next" | "in_progress" | "gold", cracked: boolean, clears: number }`.
- **`questions[id]`**: `{ bucket: 0|1|2|3, streak: number, missed: number, hesitated: boolean, lastSeen: number }`.
- **`exams[]`**: `{ id, ts, mode: "mock35" | "checkpoint", score, total, studiedScore, studiedTotal, missedIds }`.
- **`checklist`**: `{ frn, session, id_calc, fee35 }`.

---

## 4. Core Algorithms (`app.js`)

1. **Positional-Safe Choice Shuffler**:
   - Standard questions (`has_positional_choice: false`): Fisher-Yates shuffle all 4 choices.
   - `"All/None of these choices"` (`has_positional_choice: true`): Pin that option to slot D (`3`) and Fisher-Yates shuffle the remaining 3 choices across A–C (`0..2`).
   - Explicit letter cross-references (`"Both A and B"`): Keep original A–D order.
2. **Group-Weighted Readiness (`35 Groups = 35 Points`)**:
   - Computes per-group mastery $M_g \in [0, 1]$ (`Unseen=0`, `Learning=0.35`, `Review=0.75`, `Mastered=1.0`, $\times 0.8$ if `cracked`), weighting each of the 35 groups equally (`1/35` each).
3. **Nightly "Signal Check" Queue (5–10 Questions)**:
   - Prioritizes (1) questions in `Cracked` nodes, (2) `Learning` (`bucket: 1`) or `hesitated` (`> 12s`) questions, and (3) least-recently-reviewed `Gold` groups. Clearing a `Cracked` group's review questions restores its solid `Gold` badge.
4. **3-Stage Node Micro-Lesson**:
   - **Stage 1 (`Briefing`)**: 1–3 swipeable/tappable concept cards + embedded mini-aid where relevant.
   - **Stage 2 (`Flash-Pass`)**: Distractors dimmed/struck out; tap highlighted correct choice + read 1-sentence *why* note.
   - **Stage 3 (`Challenge`)**: Full 4-choice shuffled quiz; bottom-sheet Green/Red feedback banner with stationary `Continue` button; missed questions loop back at the end of the round until 100% cleared → node turns `Gold`.
5. **Practice Exams & Dual Scoring**:
   - **Official 35-Question Mock Exam**: 1 random question per group (`T1A`–`T0C`), no mid-test hints, flagging, subelement breakdown, Raw Score (`X/35`, `26+` pass) + **Studied-Nodes Score** (`Y/N` on completed groups).
   - **Progress Checkpoint Exam**: 1 random question per completed group (`N` questions, `74%` pass).
   - **Mistake Walkthrough & Cracking**: Immediate walkthrough of missed questions; missed completed groups get marked `Cracked` on the Path; **Final Boss** tracks 3 Mock Exams at `>= 30/35`.
6. **1-Tap Progress Backup / Transfer String**:
   - Encodes compact state into `"HAM1:" + btoa(unescape(encodeURIComponent(JSON.stringify(compact))))` for 1-tap clipboard copy/paste.
