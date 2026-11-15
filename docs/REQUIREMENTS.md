# Product Requirements Document (PRD): Technician HAM Radio Study App

## 1. Overview & Vision

This project builds a personal, single-user **Progressive Web App (PWA)** designed to help the user pass the **US FCC Technician Class (Element 2) Amateur Radio Exam** in **12 to 14 nights** by trading a **30-minute nightly mobile puzzle habit (like Sudoku)** for a guided, Duolingo-style learning path.

All 409 official questions, plain-English explanations, 35 group briefings, 3 inline SVG circuit schematics, study aids, and application logic are bundled directly inside **`index.html` (~300–350 KB)**, paired with a lightweight **`manifest.json`** and **`sw.js` (Service Worker)** so it works **both** by double-clicking `index.html` locally (`file://`) **and** as a properly-designed, installable offline PWA on iOS/Android.

---

## 2. Core Constraints & Target Experience

| Dimension | Requirement |
| :--- | :--- |
| **Deliverable Format** | **Self-contained `index.html`** (~300–350 KB containing all inline CSS, JS, SVG figures, and question/briefing data) + **`manifest.json`** + **`sw.js`** (~30 lines each for spec-compliant PWA installation and offline caching). |
| **Execution Environments** | **1. Local Desktop (`file://`)**: Double-click `index.html` directly from disk with zero server. **2. Installed Mobile PWA (`https://`)**: Host the folder on any free static host (GitHub Pages, Netlify Drop, Cloudflare Pages), tap *"Install / Add to Home Screen"*, and `sw.js` caches the entire app offline permanently. |
| **Nightly Routine** | Designed for **30-minute evening sessions on a phone** in dark mode: a 3-minute warm-up review + 2 to 3 lesson nodes per night (~8–10 minutes per node). |
| **Mobile & Desktop UX** | **Mobile**: Dark-mode first, one-handed thumb-zone buttons in the bottom half of the screen, stationary `Continue` button. **Desktop**: Keyboard-first shortcuts (`1`–`4` or `A`–`D` to answer, `Space`/`Enter` for next question). |
| **Persistence & Backup** | `localStorage` (~15–20 KB) + a **1-Tap "Copy Progress Backup Code"** text string in Settings to save/transfer progress via Notes or text message. |

---

## 3. Official Exam Data & Expert Corrections

### 3.1 2026–2030 NCVEC Element 2 Pool & Feb 19, 2026 Errata
- Uses the official **2026–2030 NCVEC Technician Class (Element 2)** pool (valid July 1, 2026 – June 30, 2030): **409 multiple-choice questions** across **10 Subelements (`T1`–`T0`)** and **35 Groups (`T1A`–`T0C`)**.
- Incorporates and verifies the **February 19, 2026 NCVEC Errata** wording for all 4 updated questions:
  - `T1C01`: *"For which classes of amateur radio licenses does the FCC currently issue new licenses?"*
  - `T5A05`: *"A difference in which of the following causes electron flow?"*
  - `T7A09`: *"What is the function of the switch which selects either SSB or CW-FM on some VHF power amplifiers?"*
  - `T0A10`: *"What hazard exists when rapidly charging or discharging an unprotected battery?"*

### 3.2 Question Record Schema
Each of the 409 questions follows the agreed schema:
- `id` (e.g., `"T5D01"`), `element` (`2`), `subelement` (`"T5"`), `group` (`"T5D"`)
- `question` (stem text), `choices` (array of 4 strings `A`–`D`), `answer` (correct index `0`–`3`)
- `has_positional_choice` (`boolean`): Flags questions containing `"All of these choices are correct"`, `"None of these choices are correct"`, or explicit letter references (`"Both A and B"`).
  - When `has_positional_choice` is `true`, `"All/None of these choices"` is pinned to position D while shuffling A–C (or choice order is kept fixed if specific letters A/B/C are referenced).
  - When `false`, all 4 choices shuffle randomly every time so positional patterns cannot be memorized.
- `fcc_rules` (array of strings, e.g., `["97.105"]` extracted from `[97.x]` citations)
- `figure` (`"T-1" | "T-2" | "T-3" | null`): Maps to crisp, dark-mode-friendly inline SVG schematics for `Figures T-1, T-2, and T-3`.
- `tags` (array of strings, e.g., `["math", "ohms-law"]`, `["band-plan"]`)
- `explanation` (string): Concise 1–2 sentence plain-English explanation of *why* the right answer is right, *why* distractors are wrong, or a quick formula/mnemonic.

---

## 4. User Experience & Study Flows

### 4.1 App Navigation (3 Primary Tabs)
A compact bottom navigation bar provides quick access to three tabs:
1. **Path** — The 35-Node Winding Skill Path, Nightly Goal & Streak header, Nightly "Signal Check" Warm-Up, and inline Boss Checkpoints.
2. **Exams** — Official 35-Question Mock Exam, Progress Checkpoint Exam (unlocked nodes only), and Mistake Walkthroughs.
3. **Aids & Info** — Visual Technician Band Map, Interactive Ohm's Law / Math Sandbox (+ Math-only drill), Exam Day Logistics Checklist, and 1-Tap Progress Backup/Restore.

### 4.2 The "Skill Path" Home Screen & Curated Campaign Order
Instead of raw menus, the main screen is a vertical, scrollable **35-Node Winding Path** with a **Nightly Session Goal bar** (`"Nightly Goal: 2 Nodes + Daily Review"` / 30-min progress ring) and **Day-Streak Counter** at the top.

Nodes follow the **Curated Campaign Order**—starting with the most intuitive, hands-on, and puzzle-like topics first, and interleaving the memorization-heavy FCC rules (`T1`) in bite-sized 2-node blocks once the radio concepts already make sense:

| Chapter | Chapter Title | Subelement / Groups | Nodes | Focus |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Operating Procedures** | `T2` (`T2A`, `T2B`, `T2C`) | 3 | Calling CQ, repeaters, simplex, Q-signals, emergency operations. |
| **2** | **Station Setup & Practices** | `T4` (`T4A`, `T4B`) | 2 | Transceiver controls, microphones, digital mode hookups, interference. |
| **3** | **Electrical, Antenna & RF Safety** | `T0` (`T0A`, `T0B`, `T0C`) | 3 | Grounding, fuses, battery safety, tower climbing, RF exposure limits. |
| **4** | **FCC Rules I: License & Callsigns** | `T1` (`T1A`, `T1C`) | 2 | Purpose of Amateur Service, license classes, callsign formats, FRN/renewal. |
| **5** | **Basic Electronics & Ohm's Law** | `T5` (`T5A`, `T5B`, `T5C`, `T5D`) | 4 | Voltage, current, resistance, metric prefixes, dB, Ohm's Law & Power math puzzles. |
| **6** | **Electronic Components** | `T6` (`T6A`, `T6B`, `T6C`, `T6D`) | 4 | Resistors, capacitors, transistors, ICs, and `Figures T-1, T-2, T-3` schematics. |
| **7** | **Practical Circuits** | `T7` (`T7A`, `T7B`, `T7C`, `T7D`) | 4 | Receivers, transmitters, amplifiers, filters, power supplies, multimeters. |
| **8** | **Radio Wave Propagation** | `T3` (`T3A`, `T3B`, `T3C`) | 3 | Wavelength vs. frequency, polarization, line-of-sight, ionosphere bounce. |
| **9** | **FCC Rules II: Band Privileges** | `T1` (`T1B`, `T1D`) | 2 | Authorized frequencies (paired with the Visual Band Map) & permitted transmissions. |
| **10** | **Antennas & Feed Lines** | `T9` (`T9A`, `T9B`) | 2 | Dipoles, verticals, Yagi beams, SWR, coax loss, and RF connectors. |
| **11** | **Signals & Modulation** | `T8` (`T8A`, `T8B`, `T8C`, `T8D`) | 4 | AM/FM/SSB, bandwidth, satellites, FT8, APRS, and digital modes. |
| **12** | **FCC Rules III: Control & ID** | `T1` (`T1E`, `T1F`) | 2 | Control operator rules, third-party traffic, station identification, records. |
| **13** | **Final Boss: License Readiness** | *All 35 Groups* | *Cert* | Pass 3 full Official 35-Question Mock Exams at `30+/35` (`85%+`). |

- **Node Visual States**: `Locked` → `Next Up` → `In Progress` → `Gold (Mastered)`, plus `Cracked / Tune-Up Needed` if missed later on a review or practice exam. *(Users can also tap any locked node to manually unlock/jump ahead if desired).*
- **Boss Checkpoints on the Path**: Every 3 chapters along the path, an inline **Boss Checkpoint** node triggers a mini practice test pulling 1 random question from each group unlocked so far.

### 4.3 3-Stage Micro-Lesson Flow (How a Single Node Plays Out)
Tapping a group node (~11–12 questions, ~8–10 minutes) runs a 3-stage flow:
1. **Stage 1: The 60-Second "Briefing" (1–3 Swipeable Concept Cards)**
   - Plain-English explanation of the core idea behind the group's questions, embedded visual helper if applicable (e.g., $E = I \times R$ triangle or Band segment bar), and key exam tricks/mnemonics.
2. **Stage 2: "Flash-Pass" Warm-Up (First Exposure)**
   - Shows each question in the group with the **3 wrong choices visually dimmed/struck out**.
   - The user taps the highlighted correct answer while reading the 1-sentence *why* note—zero frustration on brand-new material and no accidental memorization of wrong numbers. *(Can be toggled or skipped when re-practicing a Gold/Cracked node).*
3. **Stage 3: The Node Challenge (Full 4-Choice Quiz)**
   - Choices are shuffled (respecting `has_positional_choice`).
   - Tapping an answer triggers a smooth bottom-sheet feedback banner (**Green `"Correct! Here's why..."`** or **Red `"Not quite—remember..."`**) with a single big **Continue** button in the exact same thumb position.
   - Any missed question loops back at the end of the round until the entire group is cleared, turning the node **Gold** (or repairing a **Cracked** node).

### 4.4 Rolling Group Mastery, "Cracked" Nodes & Nightly "Signal Check"
- **Simple 4-Bucket Question Mastery**: Each question moves through `Unseen` → `Learning` → `Review` → `Mastered` (no complex FSRS scheduling).
- **Group-Weighted Readiness (`35 Groups = 35 Points`)**: Because the real exam pulls 1 question per group, overall readiness weights all 35 groups equally rather than treating 409 questions as a flat pile.
- **Nightly "Signal Check" (3-Minute Warm-Up)**: Starting on Night 2, the session begins with a 5–10 question warm-up pulled from previously cleared nodes—prioritizing `Cracked` nodes and questions the user previously missed or hesitated on (`> 12 seconds` to answer).

---

## 5. Practice Exams & Closed-Loop Feedback

### 5.1 Two Exam Modes (Available Anytime in the "Exams" Tab)
1. **Official 35-Question Mock Exam (True VEC Simulation)**:
   - Pulls 1 random question from each of the 35 official groups (`T1A`–`T0C`).
   - **Exam-Day Rules**: No green/red flashes or hints after each question; supports flagging questions to revisit before hitting Submit; requires `26+/35` (`74%`) to pass.
   - **Subelement Breakdown**: Shows score breakdown across `T1` through `T0`.
   - **Smart Dual Scoring Mid-Campaign**: When fewer than 35 nodes have been completed on the Path, the score report displays **both**:
     - **Raw Score** (e.g., `24/35`), and
     - **Studied-Nodes Score** (e.g., `14/15 — 93% on material you've learned!`), so the user sees how well their memory is holding up without being penalized for chapters not yet reached.
2. **"Progress Checkpoint" Exam (Unlocked Nodes Only)**:
   - Pulls 1 random question per group completed so far (`N` questions, same `74%` passing threshold), fitting into the last 5–8 minutes of a nightly session.

### 5.2 Exams Feed Directly Back Into the Path
- **Immediate "Mistake Walkthrough"**: On the exam results screen, a big **`"Review X Missed Questions"`** button walks through only the missed questions with their plain-English explanations and schematic diagrams.
- **Cracking Nodes on the Map**: Missing a group's question on a practice exam marks a previously `Gold` node on the main Path with a **`"Cracked / Tune-Up Needed"`** badge so the next nightly Signal Check automatically targets that weak spot.
- **Final Boss Node ("License Readiness Certification")**: Unlocks at the bottom of the path once all 35 nodes are completed; tracks passing **3 full Official Mock Exams with `30+/35` (`85%+`)**.

---

## 6. Study Aids & Reference Tab

1. **Visual Technician Band Map (`T1B` / `T2A`)**:
   - Single visual spectrum bar across HF (`80m`, `40m`, `15m`, `10m`) and VHF/UHF (`6m`, `2m`, `1.25m`, `70cm`) showing exactly where Technicians have CW-only vs. RTTY/Data vs. SSB/Phone/FM privileges and power limits.
2. **Interactive Math Helper & Math Filter (`T5`)**:
   - Interactive Ohm's Law ($E = I \times R$), Power ($P = I \times E$), and Wavelength ($\text{Meters} = 300 / \text{MHz}$) helper card alongside a **1-tap "Drill Math Questions"** filter covering the ~12 `T5`/`T3` calculation questions.
3. **Exam Day Logistics Checklist**:
   - Simple static checklist covering: (1) Getting a free **FCC FRN number** beforehand, (2) Finding a **\$0 Laurel VEC** or online **HamStudy.org** exam session, (3) Photo ID & calculator reminders, and (4) Paying the **\$35 FCC license fee** after passing.
4. **1-Tap Progress Backup / Transfer String**:
   - **"Copy Progress Backup Code"** and **"Paste Backup Code"** controls in Settings to back up or move `localStorage` progress between desktop and phone via clipboard.
