/* Watt a Ham — 2026–2030 Technician License Study App (Zero-Build Static PWA) */
(function () {
  'use strict';

  const DATA = window.HAM_DATA;
  if (!DATA || !Array.isArray(DATA.pool)) {
    console.error('HAM_DATA failed to load.');
    return;
  }

  const STORAGE_KEY = 'ham_study_v1';
  const GOAL_SECONDS = 30 * 60; // 30-minute nightly session ring
  const GOAL_NODES = 2;
  const HESITATION_MS = 12000;

  // Lookup indexes
  const Q_BY_ID = new Map();
  const Q_BY_GROUP = new Map();
  const ORDERED_GROUPS = [];
  for (const ch of DATA.campaign) {
    for (const g of ch.groups) {
      ORDERED_GROUPS.push(g);
      Q_BY_GROUP.set(g, []);
    }
  }
  for (const q of DATA.pool) {
    Q_BY_ID.set(q.id, q);
    if (!Q_BY_GROUP.has(q.group)) Q_BY_GROUP.set(q.group, []);
    Q_BY_GROUP.get(q.group).push(q);
  }

  // 03:00 AM local day key so late-night sessions stay on the same study night
  function getStudyDayKey(date = new Date()) {
    const shifted = new Date(date.getTime() - 3 * 3600 * 1000);
    const y = shifted.getFullYear();
    const m = String(shifted.getMonth() + 1).padStart(2, '0');
    const d = String(shifted.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function dayDiff(dayA, dayB) {
    if (!dayA || !dayB) return 999;
    const [y1, m1, d1] = dayA.split('-').map(Number);
    const [y2, m2, d2] = dayB.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc2 - utc1) / 86400000);
  }

  function createDefaultState() {
    const nodes = {};
    ORDERED_GROUPS.forEach((g, idx) => {
      nodes[g] = {
        status: idx === 0 ? 'next' : 'locked',
        cracked: false,
        clears: 0,
        lastReviewed: 0
      };
    });
    return {
      version: 1,
      theme: 'dark',
      sound: true,
      streak: {
        count: 0,
        longest: 0,
        lastDay: null,
        activeDay: getStudyDayKey(),
        todayNodes: 0,
        todayReviewDone: false,
        todaySeconds: 0
      },
      nodes,
      bosses: {},
      questions: {},
      exams: [],
      checklist: {
        frn: false,
        session: false,
        id_calc: false,
        fee35: false
      }
    };
  }

  let state = loadState();
  let activeTab = 'path';
  let activeSession = null;
  let lastToastMsg = '';
  let toastTimer = null;
  let lastInteractionTs = Date.now();

  function loadState() {
    const base = createDefaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      return mergeState(base, parsed);
    } catch {
      return base;
    }
  }

  function mergeState(base, incoming) {
    if (!incoming || typeof incoming !== 'object') return base;
    if (incoming.theme === 'light' || incoming.theme === 'dark') base.theme = incoming.theme;
    if (typeof incoming.sound === 'boolean') base.sound = incoming.sound;
    if (incoming.streak && typeof incoming.streak === 'object') {
      Object.assign(base.streak, incoming.streak);
    }
    if (incoming.nodes && typeof incoming.nodes === 'object') {
      for (const g of ORDERED_GROUPS) {
        if (incoming.nodes[g]) Object.assign(base.nodes[g], incoming.nodes[g]);
      }
    }
    if (incoming.bosses && typeof incoming.bosses === 'object') {
      base.bosses = { ...incoming.bosses };
    }
    if (incoming.questions && typeof incoming.questions === 'object') {
      base.questions = { ...incoming.questions };
    }
    if (Array.isArray(incoming.exams)) {
      base.exams = incoming.exams.slice(0, 30);
    }
    if (incoming.checklist && typeof incoming.checklist === 'object') {
      Object.assign(base.checklist, incoming.checklist);
    }
    rolloverDayIfNeeded(base);
    ensureNextNodeUnlocked(base);
    return base;
  }

  function rolloverDayIfNeeded(st = state) {
    const today = getStudyDayKey();
    if (st.streak.activeDay !== today) {
      if (st.streak.lastDay && dayDiff(st.streak.lastDay, today) > 1) {
        st.streak.count = 0;
      }
      st.streak.activeDay = today;
      st.streak.todayNodes = 0;
      st.streak.todayReviewDone = false;
      st.streak.todaySeconds = 0;
    }
  }

  function recordStudyActivity(st = state) {
    rolloverDayIfNeeded(st);
    const today = getStudyDayKey();
    if (st.streak.lastDay !== today) {
      const diff = st.streak.lastDay ? dayDiff(st.streak.lastDay, today) : 0;
      st.streak.count = diff === 1 ? st.streak.count + 1 : 1;
      if (st.streak.count > st.streak.longest) {
        st.streak.longest = st.streak.count;
      }
      st.streak.lastDay = today;
    }
  }

  function ensureNextNodeUnlocked(st = state) {
    const anyNextOrProg = ORDERED_GROUPS.some(
      (g) => st.nodes[g].status === 'next' || st.nodes[g].status === 'in_progress'
    );
    if (!anyNextOrProg) {
      const firstLocked = ORDERED_GROUPS.find((g) => st.nodes[g].status === 'locked');
      if (firstLocked) st.nodes[firstLocked].status = 'next';
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in private mode
    }
  }

  function getQState(qid) {
    if (!state.questions[qid]) {
      state.questions[qid] = {
        bucket: 0, // 0=Unseen, 1=Learning, 2=Review, 3=Mastered
        streak: 0,
        missed: 0,
        hesitated: false,
        lastSeen: 0
      };
    }
    return state.questions[qid];
  }

  // Compact Backup String ("HAM1:" + Base64)
  function exportBackupString() {
    const compact = {
      v: 1,
      th: state.theme,
      sn: state.sound ? 1 : 0,
      st: state.streak,
      nd: {},
      bs: state.bosses,
      qs: {},
      ex: state.exams.slice(0, 15),
      ck: state.checklist
    };
    for (const g of ORDERED_GROUPS) {
      const n = state.nodes[g];
      if (n.status !== 'locked' || n.clears > 0 || n.cracked) {
        compact.nd[g] = [n.status, n.cracked ? 1 : 0, n.clears, n.lastReviewed || 0];
      }
    }
    for (const [qid, q] of Object.entries(state.questions)) {
      if (q.bucket > 0 || q.missed > 0 || q.hesitated) {
        compact.qs[qid] = [q.bucket, q.streak, q.missed, q.hesitated ? 1 : 0, q.lastSeen || 0];
      }
    }
    const json = JSON.stringify(compact);
    return 'HAM1:' + btoa(unescape(encodeURIComponent(json)));
  }

  function importBackupString(str) {
    const trimmed = (str || '').trim();
    if (!trimmed.startsWith('HAM1:')) {
      throw new Error('Backup code must start with "HAM1:".');
    }
    const decoded = decodeURIComponent(escape(atob(trimmed.slice(5))));
    const c = JSON.parse(decoded);
    if (!c || c.v !== 1) throw new Error('Unsupported backup format version.');

    const next = createDefaultState();
    if (c.th === 'light' || c.th === 'dark') next.theme = c.th;
    next.sound = c.sn !== 0;
    if (c.st) Object.assign(next.streak, c.st);
    for (const g of ORDERED_GROUPS) {
      next.nodes[g].status = 'locked';
    }
    if (c.nd) {
      for (const [g, arr] of Object.entries(c.nd)) {
        if (next.nodes[g] && Array.isArray(arr)) {
          next.nodes[g] = {
            status: arr[0] || 'locked',
            cracked: Boolean(arr[1]),
            clears: Number(arr[2]) || 0,
            lastReviewed: Number(arr[3]) || 0
          };
        }
      }
    }
    if (c.bs && typeof c.bs === 'object') next.bosses = c.bs;
    if (c.qs && typeof c.qs === 'object') {
      for (const [qid, arr] of Object.entries(c.qs)) {
        if (Q_BY_ID.has(qid) && Array.isArray(arr)) {
          next.questions[qid] = {
            bucket: Number(arr[0]) || 0,
            streak: Number(arr[1]) || 0,
            missed: Number(arr[2]) || 0,
            hesitated: Boolean(arr[3]),
            lastSeen: Number(arr[4]) || 0
          };
        }
      }
    }
    if (Array.isArray(c.ex)) next.exams = c.ex;
    if (c.ck && typeof c.ck === 'object') Object.assign(next.checklist, c.ck);
    rolloverDayIfNeeded(next);
    ensureNextNodeUnlocked(next);
    state = next;
    applyTheme();
    saveState();
  }

  // Positional-Safe Choice Shuffler (TECHNICAL_DESIGN.md 4.1)
  const ALL_NONE_RE = /\b(all\s+(of\s+)?these\s+(choices|answers)|none\s+(of\s+)?these\s+(choices|answers)|all\s+of\s+the\s+above|none\s+of\s+the\s+above)\b/i;
  const LETTER_REF_RE = /\b(both\s+[abcd]\s+and\s+[abcd]|neither\s+[abcd]\s+nor\s+[abcd]|choices?\s+[abcd]\s+and\s+[abcd])\b/i;

  function fyShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildShuffledChoices(q) {
    const indexed = q.choices.map((text, origIdx) => ({ text, origIdx }));
    if (!q.has_positional_choice) {
      return fyShuffle(indexed);
    }
    if (q.choices.some((c) => LETTER_REF_RE.test(c))) {
      return indexed;
    }
    const pinIdx = indexed.findIndex((item) => ALL_NONE_RE.test(item.text));
    if (pinIdx !== -1) {
      const pinned = indexed[pinIdx];
      const others = indexed.filter((_, idx) => idx !== pinIdx);
      return [...fyShuffle(others), pinned];
    }
    return indexed;
  }

  // Group-Weighted Readiness (35 Groups = 35 Points)
  const BUCKET_WEIGHTS = [0, 0.35, 0.75, 1.0];

  function computeGroupMastery(group) {
    const qs = Q_BY_GROUP.get(group) || [];
    if (!qs.length) return 0;
    let sum = 0;
    for (const q of qs) {
      const b = state.questions[q.id] ? state.questions[q.id].bucket : 0;
      sum += BUCKET_WEIGHTS[b] || 0;
    }
    let mg = sum / qs.length;
    if (state.nodes[group] && state.nodes[group].cracked) {
      mg *= 0.8;
    }
    return mg;
  }

  function computeOverallReadiness() {
    let totalPoints = 0;
    let goldCount = 0;
    let crackedCount = 0;
    for (const g of ORDERED_GROUPS) {
      totalPoints += computeGroupMastery(g);
      if (state.nodes[g].status === 'gold') goldCount++;
      if (state.nodes[g].cracked) crackedCount++;
    }
    const pct = Math.round((totalPoints / ORDERED_GROUPS.length) * 100);
    return { pct, totalPoints, goldCount, crackedCount };
  }

  // Nightly "Signal Check" Queue Builder (5-10 Questions)
  function buildSignalCheckQueue() {
    const studiedGroups = ORDERED_GROUPS.filter(
      (g) => state.nodes[g].status === 'gold' || state.nodes[g].status === 'in_progress'
    );
    if (!studiedGroups.length) return [];

    const candidates = [];
    for (const g of studiedGroups) {
      const node = state.nodes[g];
      const qs = Q_BY_GROUP.get(g) || [];
      for (const q of qs) {
        const qsState = state.questions[q.id];
        if (!qsState || qsState.bucket === 0) continue;
        let priority = 0;
        if (node.cracked) priority += 100;
        if (qsState.bucket === 1) priority += 60;
        if (qsState.hesitated) priority += 40;
        if (qsState.missed > 0) priority += Math.min(35, qsState.missed * 12);
        const ageHours = qsState.lastSeen ? (Date.now() - qsState.lastSeen) / 3600000 : 48;
        priority += Math.min(30, ageHours * 0.5);
        priority += Math.random() * 8;
        candidates.push({ q, priority });
      }
    }

    candidates.sort((a, b) => b.priority - a.priority);
    const targetLen = Math.min(10, Math.max(5, Math.min(candidates.length, 8)));
    return candidates.slice(0, targetLen).map((c) => c.q);
  }

  // Subtle Web Audio Tone Feedback (Zero External Assets)
  let audioCtx = null;
  function playFeedbackTone(ok) {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (ok) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.07);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.setValueAtTime(190, now + 0.09);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch {
      // Ignore audio errors
    }
  }

  // HTML Escaping & Simple Markdown (**bold** + `code`) Formatter
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatRichText(str) {
    return escHtml(str)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // Accessible Toast + Clipboard Copy (Modern Web Guidance)
  function showToast(msg) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    clearTimeout(toastTimer);
    let announce = msg;
    if (announce === lastToastMsg) announce += '\u00A0';
    lastToastMsg = announce;
    region.textContent = announce;
    region.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      region.classList.remove('is-visible');
    }, 2400);
  }

  function legacyCopy(text) {
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try {
      return document.execCommand('copy');
    } finally {
      field.remove();
    }
  }

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy(text);
    }
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  }

  function openFigureZoom(figKey) {
    const svg = DATA.figures[figKey];
    if (!svg) return;
    const dlg = document.getElementById('figure-dialog');
    document.getElementById('figure-dialog-title').textContent = `Official Schematic — Figure ${figKey}`;
    document.getElementById('figure-dialog-svg').innerHTML = svg;
    const captions = {
      'T-1': 'Figure T-1: (1) Resistor, (2) NPN Transistor, (3) Lamp, (4) Battery, (5) Chassis Ground.',
      'T-2': 'Figure T-2: (1) AC Plug, (2) Fuse, (3) SPST Switch, (4) Transformer, (5) Rectifier Diode, (6) Filter Capacitor, (7) Resistor, (8) LED, (9) Variable Resistor, (10) Zener Diode.',
      'T-3': 'Figure T-3: (1) RF Input, (2) Variable Capacitor, (3) Variable/Tapped Inductor, (4) Antenna.'
    };
    document.getElementById('figure-dialog-caption').textContent = captions[figKey] || '';
    dlg.showModal();
  }

  function openConfirmDialog({ title, html, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const dlg = document.getElementById('confirm-dialog');
      document.getElementById('confirm-dialog-title').textContent = title;
      document.getElementById('confirm-dialog-desc').innerHTML = html;
      const actions = document.getElementById('confirm-dialog-actions');
      actions.innerHTML = `
        ${cancelLabel ? `<button value="cancel" class="btn btn-secondary" autofocus>${escHtml(cancelLabel)}</button>` : ''}
        <button value="confirm" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" ${!cancelLabel ? 'autofocus' : ''}>${escHtml(confirmLabel)}</button>
      `;
      const onClose = () => {
        dlg.removeEventListener('close', onClose);
        const val = dlg.returnValue;
        dlg.returnValue = '';
        resolve(val === 'confirm');
      };
      dlg.addEventListener('close', onClose);
      dlg.showModal();
    });
  }

  // Update Header Telemetry & Progress Ring
  function renderHeader() {
    rolloverDayIfNeeded();
    const { pct, goldCount, crackedCount } = computeOverallReadiness();
    document.getElementById('readiness-sub').textContent =
      `Readiness: ${pct}% (${goldCount}/35 Gold)`;
    document.getElementById('streak-count').textContent = String(state.streak.count);

    const mins = Math.floor(state.streak.todaySeconds / 60);
    const ringPct = Math.min(100, Math.round((state.streak.todaySeconds / GOAL_SECONDS) * 100));
    const prog = document.getElementById('nightly-progress');
    prog.setAttribute('value', String(ringPct));
    prog.style.setProperty('--value', String(ringPct));
    prog.setAttribute('aria-valuetext', `${mins} of 30 minutes studied tonight`);
    document.getElementById('nightly-ring-label').textContent = `${mins}m`;
    document.getElementById('goal-nodes-label').textContent =
      `${state.streak.todayNodes}/${GOAL_NODES} nodes`;

    const navBadge = document.getElementById('cracked-nav-badge');
    if (crackedCount > 0) {
      navBadge.textContent = String(crackedCount);
      navBadge.hidden = false;
    } else {
      navBadge.hidden = true;
    }
  }

  // Reusable Visual Helpers (used in both Aids Tab and Stage 1 Briefing Cards)
  function renderBandMapHtml(compact = false) {
    const bands = [
      {
        name: '80m / 40m / 15m (HF)',
        power: '200W PEP max',
        segs: [
          { cls: 'seg-cw', flex: 45, label: 'CW Only: 3.525–3.600 · 7.025–7.125 · 21.025–21.200 MHz' },
          { cls: 'seg-none', flex: 55, label: 'General / Extra' }
        ],
        note: 'Technicians get CW (Morse code) privileges only on 80m, 40m, and 15m (200W PEP limit).'
      },
      {
        name: '10 Meters (28.0–29.7 MHz)',
        power: '200W PEP max',
        segs: [
          { cls: 'seg-data', flex: 34, label: '28.0–28.3 RTTY/Data & CW' },
          { cls: 'seg-ssb', flex: 26, label: '28.3–28.5 SSB Phone' },
          { cls: 'seg-none', flex: 40, label: '28.5–29.7 Gen/Extra' }
        ],
        note: 'Techs ONLY HF voice slice: 28.300–28.500 MHz SSB! Propagation beacons live at 28.200–28.300 MHz.'
      },
      {
        name: '6m (50–54 MHz) & 2m (144–148 MHz)',
        power: '1500W PEP max',
        segs: [
          { cls: 'seg-cw', flex: 18, label: '.0–.1 CW Only' },
          { cls: 'seg-all', flex: 82, label: '50.1–54 & 144.1–148 MHz: All Amateur Modes (FM, SSB, Digital)' }
        ],
        note: 'Bottom 100 kHz (50.0–50.1 & 144.0–144.1 MHz) is CW-only! 146.520 MHz = National 2m FM Simplex Calling.'
      },
      {
        name: '1.25 Meters (219–225 MHz)',
        power: '50W (219–220) · 1500W (222–225)',
        segs: [
          { cls: 'seg-data', flex: 26, label: '219–220 Fixed Digital (50W)' },
          { cls: 'seg-none', flex: 12, label: 'Gap' },
          { cls: 'seg-all', flex: 62, label: '222–225 MHz: All Modes' }
        ],
        note: '219–220 MHz is strictly fixed digital message forwarding (50W max). Full privileges on 222–225 MHz.'
      },
      {
        name: '70 Centimeters (420–450 MHz)',
        power: '1500W PEP max (secondary)',
        segs: [
          { cls: 'seg-all', flex: 100, label: '420–450 MHz: All Modes (No 420–430 MHz north of Line A)' }
        ],
        note: '446.000 MHz = 70cm FM Simplex Calling. Amateur service is secondary—must not interfere with radiolocation.'
      }
    ];

    const list = compact ? bands.slice(0, 3) : bands;
    return `
      <div class="legend-pills">
        <span class="legend-pill seg-cw">CW Only</span>
        <span class="legend-pill seg-data">RTTY / Data</span>
        <span class="legend-pill seg-ssb">SSB Phone</span>
        <span class="legend-pill seg-all">All Modes</span>
      </div>
      <div class="band-list">
        ${list.map((b) => `
          <div class="band-row">
            <div class="band-row-top">
              <span class="band-name">${escHtml(b.name)}</span>
              <span class="band-power">${escHtml(b.power)}</span>
            </div>
            <div class="spectrum-bar">
              ${b.segs.map((s) => `<div class="seg ${s.cls}" style="flex:${s.flex}">${escHtml(s.label)}</div>`).join('')}
            </div>
            <p class="band-notes">${escHtml(b.note)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMiniAidForBriefing(aid) {
    if (!aid) return '';
    if (aid === 'band-map') {
      return `
        <div class="panel-card" style="margin-top:0.4rem">
          <div class="panel-eyebrow">Visual Privilege Reference</div>
          ${renderBandMapHtml(true)}
        </div>
      `;
    }
    if (aid === 'ohms-triangle') {
      return `
        <div class="formula-triangles" style="margin-top:0.4rem">
          <div class="triangle-card">
            <strong>Ohm's Law Circle</strong>
            <div class="tri-grid">
              <div class="tri-btn tri-top is-selected">E (Volts)</div>
              <div class="tri-btn">I (Amps)</div>
              <div class="tri-btn">R (Ohms)</div>
            </div>
            <div class="formula-readout">E = I × R · I = E / R · R = E / I</div>
          </div>
          <div class="triangle-card">
            <strong>DC Power Circle</strong>
            <div class="tri-grid">
              <div class="tri-btn tri-top is-selected">P (Watts)</div>
              <div class="tri-btn">I (Amps)</div>
              <div class="tri-btn">E (Volts)</div>
            </div>
            <div class="formula-readout">P = I × E · I = P / E · E = P / I</div>
          </div>
        </div>
      `;
    }
    if (aid === 'metric-db') {
      return `
        <div class="panel-card" style="margin-top:0.4rem">
          <div class="panel-eyebrow">Quick Exam Cheat-Bar</div>
          <p class="panel-desc" style="margin-bottom:0.45rem">
            <strong>Decibels:</strong> <code>+3 dB = 2× power</code> · <code>-3 dB = ½</code> · <code>-6 dB = ¼</code> · <code>+10 dB = 10×</code><br>
            <strong>Prefixes:</strong> <code>pico (10⁻¹²) → nano (10⁻⁹) → micro (10⁻⁶) → milli (10⁻³) → kilo (10³) → mega (10⁶) → giga (10⁹)</code>
          </p>
        </div>
      `;
    }
    if (aid === 'wavelength') {
      return `
        <div class="panel-card" style="margin-top:0.4rem">
          <div class="panel-eyebrow">Wavelength &amp; Spectrum Rule</div>
          <div class="formula-readout" style="margin:0.35rem 0">Wavelength (m) = 300 / Frequency (MHz)</div>
          <p class="panel-desc" style="margin-bottom:0">
            <strong>HF:</strong> 3–30 MHz · <strong>VHF:</strong> 30–300 MHz · <strong>UHF:</strong> 300–3000 MHz (All travel at <code>300,000,000 m/s</code>!)
          </p>
        </div>
      `;
    }
    if (aid === 'figures') {
      return `
        <div class="panel-card" style="margin-top:0.4rem">
          <div class="panel-eyebrow">Official NCVEC Schematics (Tap to Zoom)</div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem">
            <button type="button" class="btn btn-secondary" data-zoom-fig="T-1">Inspect Figure T-1</button>
            <button type="button" class="btn btn-secondary" data-zoom-fig="T-2">Inspect Figure T-2</button>
            <button type="button" class="btn btn-secondary" data-zoom-fig="T-3">Inspect Figure T-3</button>
          </div>
        </div>
      `;
    }
    return '';
  }

  // TAB 1: Winding 35-Node Skill Path
  function renderPathTab() {
    const signalSlot = document.getElementById('signal-check-slot');
    const campaignEl = document.getElementById('campaign-container');
    const { goldCount, crackedCount } = computeOverallReadiness();
    const signalQueue = buildSignalCheckQueue();

    // Nightly Signal Check Banner
    if (signalQueue.length === 0) {
      const firstGroup = ORDERED_GROUPS[0];
      const firstBrief = DATA.briefings[firstGroup];
      signalSlot.innerHTML = `
        <div class="signal-card">
          <div class="signal-top">
            <div>
              <div class="signal-eyebrow">Night 1 · 12-to-14 Night Campaign</div>
              <h2 class="signal-title">Welcome to Watt a Ham</h2>
            </div>
          </div>
          <p class="signal-desc">
            Swap 30 minutes of evening puzzles for 2–3 guided radio nodes per night. Start with intuitive repeater &amp; on-air operating first!
          </p>
          <button type="button" class="btn btn-primary btn-block" data-open-node="${escHtml(firstGroup)}" data-direct-start="1">
            Start Node 1: ${escHtml(firstGroup)} — ${escHtml(firstBrief ? firstBrief.title : 'Operating')}
          </button>
        </div>
      `;
    } else {
      const doneTonight = state.streak.todayReviewDone && crackedCount === 0;
      signalSlot.innerHTML = `
        <div class="signal-card ${crackedCount > 0 ? 'has-cracks' : ''}">
          <div class="signal-top">
            <div>
              <div class="signal-eyebrow">
                ${crackedCount > 0 ? `⚡ ${crackedCount} Cracked Node${crackedCount > 1 ? 's' : ''} Need Tune-Up` : doneTonight ? '✓ Signal Check Clear Tonight' : 'Nightly 3-Minute Warm-Up'}
              </div>
              <h2 class="signal-title">Nightly "Signal Check" (${signalQueue.length} Qs)</h2>
            </div>
          </div>
          <p class="signal-desc">
            ${crackedCount > 0
              ? 'Targets missed exam/review questions first so cracked nodes turn solid Gold again.'
              : doneTonight
                ? 'Warm-up complete for tonight! You can still run an extra quick review anytime.'
                : 'Quick 3-minute warm-up from nodes you have already studied—prioritizing tricky & hesitated questions.'}
          </p>
          <button type="button" class="btn ${crackedCount > 0 ? 'btn-gold' : doneTonight ? 'btn-secondary' : 'btn-primary'} btn-block" data-action="start-signal-check">
            ${doneTonight ? 'Run Bonus Signal Check' : 'Start 3-Min Signal Check'}
          </button>
        </div>
      `;
    }

    // Winding S-curve offsets
    const SHIFTS = [0, 44, 0, -44];
    let globalNodeIdx = 0;

    const chaptersHtml = DATA.campaign.map((ch) => {
      const chGold = ch.groups.filter((g) => state.nodes[g].status === 'gold' && !state.nodes[g].cracked).length;
      const allChGold = chGold === ch.groups.length;

      const nodesHtml = ch.groups.map((g) => {
        const n = state.nodes[g];
        const brief = DATA.briefings[g] || { title: g, subtitle: '' };
        const qs = Q_BY_GROUP.get(g) || [];
        const shift = SHIFTS[globalNodeIdx % SHIFTS.length];
        globalNodeIdx++;

        const visualState = n.cracked ? 'cracked' : n.status;
        const statusIcon = n.cracked
          ? '⚡'
          : n.status === 'gold'
            ? '★'
            : n.status === 'next'
              ? '▶'
              : n.status === 'in_progress'
                ? '◐'
                : '🔒';

        const masteryPct = Math.round(computeGroupMastery(g) * 100);

        return `
          <div class="path-node-wrap" style="--shift:${shift}px">
            ${n.status === 'next' && !n.cracked ? '<div class="node-cta-float" aria-hidden="true">Next Up</div>' : ''}
            <button
              type="button"
              class="node-medallion state-${visualState}"
              data-open-node="${escHtml(g)}"
              aria-label="${escHtml(g)}: ${escHtml(brief.title)} (${visualState.replace('_', ' ')}, ${qs.length} questions)"
            >
              <span class="node-code">${escHtml(g)}</span>
              <span class="node-sub-icon" aria-hidden="true">${statusIcon}</span>
            </button>
            <div class="node-caption">
              <div class="node-caption-title">${escHtml(brief.title)}</div>
              <div class="node-caption-meta">${qs.length} Qs · ${masteryPct}% mastery</div>
              ${n.cracked ? '<span class="crack-pill">⚡ Tune-Up Needed</span>' : ''}
            </div>
          </div>
        `;
      }).join('');

      let bossHtml = '';
      if (ch.bossAfter) {
        const bId = ch.bossAfter.id;
        const cleared = Boolean(state.bosses[bId]);
        // Collect all groups up to and including this chapter
        const bossGroups = [];
        for (const c of DATA.campaign) {
          bossGroups.push(...c.groups);
          if (c.chapter === ch.chapter) break;
        }
        const unlockedCount = bossGroups.filter((g) => state.nodes[g].status !== 'locked').length;
        bossHtml = `
          <div class="boss-card ${cleared ? 'is-cleared' : ''}">
            <div class="boss-info">
              <div class="panel-eyebrow">${cleared ? '🏆 Boss Cleared' : '🛡️ Inline Boss Checkpoint'}</div>
              <h4>${escHtml(ch.bossAfter.title)}</h4>
              <p>${escHtml(ch.bossAfter.subtitle)} (${unlockedCount}/${bossGroups.length} unlocked)</p>
            </div>
            <button type="button" class="btn ${cleared ? 'btn-secondary' : 'btn-gold'}" data-boss-id="${escHtml(bId)}" data-boss-ch="${ch.chapter}">
              ${cleared ? 'Replay' : 'Challenge'}
            </button>
          </div>
        `;
      }

      return `
        <section class="chapter-block" aria-label="Chapter ${ch.chapter}: ${escHtml(ch.title)}">
          <div class="chapter-banner">
            <div>
              <div class="chapter-eyebrow">Chapter ${ch.chapter} · Subelement ${escHtml(ch.subelement)}</div>
              <h3 class="chapter-title">${escHtml(ch.title)}</h3>
              <p class="chapter-focus">${escHtml(ch.focus)}</p>
            </div>
            <span class="chapter-tally ${allChGold ? 'is-gold' : ''}">${chGold}/${ch.groups.length} Gold</span>
          </div>
          <div class="winding-nodes">
            ${nodesHtml}
          </div>
          ${bossHtml}
        </section>
      `;
    }).join('');

    // Chapter 13: Final Boss License Readiness Certification (3 Mock Exams >= 30/35)
    const highPasses = state.exams.filter((e) => e.mode === 'mock35' && e.score >= 30).length;
    const certDone = highPasses >= 3 && goldCount === 35;

    const finalBossHtml = `
      <section class="final-boss-card" aria-label="Chapter 13 Final Boss License Readiness">
        <div class="panel-eyebrow" style="color:var(--gold)">Chapter 13 · Final Boss Certification</div>
        <h3>FCC Technician License Readiness</h3>
        <div class="cert-stars" aria-label="${Math.min(3, highPasses)} of 3 high-pass mock exams earned">
          <span class="cert-star ${highPasses >= 1 ? 'earned' : ''}">⭐</span>
          <span class="cert-star ${highPasses >= 2 ? 'earned' : ''}">⭐</span>
          <span class="cert-star ${highPasses >= 3 ? 'earned' : ''}">⭐</span>
        </div>
        <p class="signal-desc">
          ${certDone
            ? '🎉 CERTIFIED READY! You have mastered all 35 groups and scored 30+/35 (85%+) on 3 Official Mock Exams. Go claim your call sign!'
            : `Complete all 35 Path nodes (${goldCount}/35 Gold) and pass 3 Official 35-Question Mock Exams at 30+/35 (85%+) — ${Math.min(3, highPasses)}/3 completed.`}
        </p>
        <button type="button" class="btn btn-gold btn-block" data-action="start-mock35">
          Launch Official 35-Question Mock Exam
        </button>
      </section>
    `;

    campaignEl.innerHTML = chaptersHtml + finalBossHtml;
  }

  // Open Node Modal (Preview / Unlock Jump-Ahead / Choose Stage)
  function openNodeModal(group) {
    const node = state.nodes[group];
    const brief = DATA.briefings[group];
    const qs = Q_BY_GROUP.get(group) || [];
    if (!node || !brief) return;

    const dlg = document.getElementById('node-dialog');
    const body = document.getElementById('node-dialog-body');
    const masteryPct = Math.round(computeGroupMastery(group) * 100);
    const isLocked = node.status === 'locked';
    const isGoldOrCracked = node.status === 'gold' || node.cracked;

    body.innerHTML = `
      <div class="dialog-head-row">
        <div>
          <div class="panel-eyebrow">Group ${escHtml(group)} · ${qs.length} Official Questions</div>
          <h2 id="node-dialog-title" class="dialog-title">${escHtml(brief.title)}</h2>
        </div>
        <form method="dialog">
          <button value="close" class="icon-btn" aria-label="Close">✕</button>
        </form>
      </div>
      <p class="dialog-desc">${escHtml(brief.subtitle)}</p>
      <div class="stat-grid" style="margin-bottom:0.2rem">
        <div class="stat-box">
          <div class="stat-box-val">${masteryPct}%</div>
          <div class="stat-box-lbl">Group Mastery</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-val">${node.cracked ? 'Cracked ⚡' : isLocked ? 'Locked' : node.status === 'gold' ? 'Gold ★' : 'Ready'}</div>
          <div class="stat-box-lbl">Node Status</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.55rem;margin-top:0.2rem">
        ${isLocked ? `
          <button type="button" class="btn btn-primary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing" autofocus>
            Unlock &amp; Jump Ahead (Full 3-Stage Lesson)
          </button>
        ` : isGoldOrCracked ? `
          <button type="button" class="btn ${node.cracked ? 'btn-gold' : 'btn-primary'} btn-block" data-modal-start="${escHtml(group)}" data-start-stage="challenge" autofocus>
            ${node.cracked ? 'Repair Cracked Node (Quiz Only)' : 'Quick Practice Quiz (Skip Warm-Up)'}
          </button>
          <button type="button" class="btn btn-secondary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing">
            Full 3-Stage Lesson (Briefing + Flash-Pass + Quiz)
          </button>
        ` : `
          <button type="button" class="btn btn-primary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing" autofocus>
            Start 3-Stage Lesson (~8 min)
          </button>
          <button type="button" class="btn btn-secondary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="challenge">
            Skip Straight to 4-Choice Challenge
          </button>
        `}
      </div>
    `;
    dlg.showModal();
  }

  // TAB 2: Practice Exams
  function renderExamsTab() {
    const container = document.getElementById('exams-container');
    const completedGroups = ORDERED_GROUPS.filter((g) => state.nodes[g].status === 'gold');
    const unlockedGroups = ORDERED_GROUPS.filter((g) => state.nodes[g].status !== 'locked');
    const checkpointPoolGroups = completedGroups.length > 0 ? completedGroups : unlockedGroups;
    const highPasses = state.exams.filter((e) => e.mode === 'mock35' && e.score >= 30).length;

    const historyHtml = state.exams.length === 0
      ? '<p class="panel-desc" style="margin-bottom:0">No practice exams taken yet. Try a Progress Checkpoint after your first few nodes, or jump into a full 35-question Mock Exam anytime!</p>'
      : `<div style="display:flex;flex-direction:column;gap:0.6rem">
          ${state.exams.slice(0, 10).map((ex, idx) => {
            const pct = Math.round((ex.score / ex.total) * 100);
            const passed = pct >= 74;
            const dt = new Date(ex.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
            return `
              <div class="band-row" style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap">
                <div>
                  <div style="font-weight:800;font-size:0.9rem">
                    ${ex.mode === 'mock35' ? 'Official 35-Q Mock Exam' : `Progress Checkpoint (${ex.total} Qs)`}
                    <span style="color:${passed ? 'var(--success)' : 'var(--danger)'};margin-left:0.35rem">${ex.score}/${ex.total} (${pct}%)</span>
                  </div>
                  <div style="font-size:0.75rem;color:var(--text-secondary)">
                    ${escHtml(dt)}
                    ${ex.mode === 'mock35' && ex.studiedTotal > 0 && ex.studiedTotal < 35
                      ? ` · Studied nodes: ${ex.studiedScore}/${ex.studiedTotal} (${Math.round((ex.studiedScore / ex.studiedTotal) * 100)}%)`
                      : ''}
                  </div>
                </div>
                ${ex.missedIds && ex.missedIds.length > 0 ? `
                  <button type="button" class="btn btn-secondary" style="padding:0.42rem 0.75rem;font-size:0.8rem" data-review-exam="${idx}">
                    Review ${ex.missedIds.length} Missed
                  </button>
                ` : '<span class="badge-pill" style="background:var(--success-soft);color:var(--success)">Perfect 100%</span>'}
              </div>
            `;
          }).join('')}
        </div>`;

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-eyebrow">True VEC Exam Simulation</div>
            <h2 class="panel-title">Official 35-Question Mock Exam</h2>
          </div>
          <span class="badge-pill">Pass: 26/35 (74%)</span>
        </div>
        <p class="panel-desc">
          Pulls 1 random question from each of the 35 official NCVEC groups (<code>T1A</code>–<code>T0C</code>). No mid-test hints, supports flagging questions, and reports <strong>both</strong> your Raw Score and your <strong>Studied-Nodes Score</strong> (${completedGroups.length}/35 Gold so far).
        </p>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-box-val">${state.exams.filter((e) => e.mode === 'mock35').length}</div>
            <div class="stat-box-lbl">Mock Exams Taken</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${highPasses}/3</div>
            <div class="stat-box-lbl">85%+ Cert Stars</div>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-block" data-action="start-mock35">
          Start Official 35-Question Mock Exam
        </button>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-eyebrow">5–8 Minute End-of-Night Check</div>
            <h2 class="panel-title">Progress Checkpoint Exam</h2>
          </div>
          <span class="badge-pill">${checkpointPoolGroups.length} Qs</span>
        </div>
        <p class="panel-desc">
          Pulls 1 random question from each ${completedGroups.length > 0 ? 'completed Gold' : 'unlocked'} group (${checkpointPoolGroups.length} questions, 74% pass threshold). Ideal for testing retention without unseen chapters!
        </p>
        <button type="button" class="btn btn-secondary btn-block" data-action="start-checkpoint">
          Start ${checkpointPoolGroups.length}-Question Progress Checkpoint
        </button>
      </div>

      <div class="panel-card">
        <div class="panel-eyebrow">Closed-Loop History</div>
        <h3 class="panel-title" style="margin-bottom:0.75rem">Recent Exam Reports</h3>
        ${historyHtml}
      </div>
    `;
  }

  // TAB 3: Study Aids, Math Sandbox, Schematics, Logistics & Backup
  let mathSolveTarget = 'E';

  function renderAidsTab() {
    const container = document.getElementById('aids-container');
    const mathCount = DATA.pool.filter((q) => q.tags.includes('math')).length;
    const backupCode = exportBackupString();

    const checklistDefs = [
      {
        key: 'frn',
        title: '1. Get your free FCC FRN (Registration Number) beforehand',
        desc: 'Register at wireless.fcc.gov/uls (CORES) before exam day—Volunteer Examiners cannot accept Social Security Numbers.'
      },
      {
        key: 'session',
        title: '2. Book a $0 Laurel VEC session or online HamStudy.org exam',
        desc: 'Laurel VEC clubs charge $0 exam fees; ARRL/GLAARG online & in-person sessions typically cost $14–$15.'
      },
      {
        key: 'id_calc',
        title: '3. Pack Government Photo ID + cleared basic calculator',
        desc: 'Bring 1 government photo ID (or 2 forms for students) and an optional non-programmable calculator with cleared memory.'
      },
      {
        key: 'fee35',
        title: '4. Pay the $35 FCC fee & wait for ULS database grant before TX',
        desc: 'After passing, FCC emails a link to pay the $35 license fee within 10 days. You may transmit as soon as your call sign appears in the FCC ULS database!'
      }
    ];

    container.innerHTML = `
      <!-- 1. Interactive Math Sandbox & Math Drill -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-eyebrow">Subelements T5 &amp; T3</div>
            <h2 class="panel-title">Interactive Ohm's Law, Power &amp; Wavelength Sandbox</h2>
          </div>
          <span class="badge-pill">${mathCount} Math Qs</span>
        </div>
        <p class="panel-desc">
          Tap any variable below to see its cover-up formula, test live numbers, or launch a focused drill across all ${mathCount} calculation &amp; unit questions.
        </p>

        <div class="formula-triangles">
          <div class="triangle-card">
            <strong>Ohm's Law (Tap Variable)</strong>
            <div class="tri-grid">
              <button type="button" class="tri-btn tri-top ${mathSolveTarget === 'E' ? 'is-selected' : ''}" data-math-target="E">E (Volts)</button>
              <button type="button" class="tri-btn ${mathSolveTarget === 'I' ? 'is-selected' : ''}" data-math-target="I">I (Amps)</button>
              <button type="button" class="tri-btn ${mathSolveTarget === 'R' ? 'is-selected' : ''}" data-math-target="R">R (Ohms)</button>
            </div>
            <div id="ohms-formula-box" class="formula-readout">
              ${mathSolveTarget === 'I' ? 'I = E / R (Amps = Volts ÷ Ohms)' : mathSolveTarget === 'R' ? 'R = E / I (Ohms = Volts ÷ Amps)' : 'E = I × R (Volts = Amps × Ohms)'}
            </div>
          </div>

          <div class="triangle-card">
            <strong>Power &amp; Wavelength</strong>
            <div class="tri-grid">
              <button type="button" class="tri-btn tri-top ${mathSolveTarget === 'P' ? 'is-selected' : ''}" data-math-target="P">P (Watts)</button>
              <button type="button" class="tri-btn ${mathSolveTarget === 'WL' ? 'is-selected' : ''}" data-math-target="WL">λ (Meters)</button>
              <button type="button" class="tri-btn ${mathSolveTarget === 'DB' ? 'is-selected' : ''}" data-math-target="DB">dB Rules</button>
            </div>
            <div class="formula-readout">
              ${mathSolveTarget === 'WL' ? 'Meters = 300 / MHz · MHz = 300 / Meters' : mathSolveTarget === 'DB' ? '+3dB = 2× · -6dB = ¼ · +10dB = 10×' : 'P = I × E (Watts = Amps × Volts)'}
            </div>
          </div>
        </div>

        <div class="band-row" style="margin-bottom:0.85rem">
          <div style="font-weight:800;font-size:0.84rem;margin-bottom:0.35rem">Live Quick Calculator (Enter any 2 values)</div>
          <div class="calc-row">
            <div class="calc-field">
              <label for="calc-e">Volts (E)</label>
              <input id="calc-e" type="number" step="any" placeholder="13.8">
            </div>
            <div class="calc-field">
              <label for="calc-i">Amps (I)</label>
              <input id="calc-i" type="number" step="any" placeholder="10">
            </div>
            <div class="calc-field">
              <label for="calc-r">Ohms (R)</label>
              <input id="calc-r" type="number" step="any" placeholder="1.38">
            </div>
          </div>
          <div id="calc-live-result" class="formula-readout" style="margin-top:0.55rem">
            Example: 13.8 V × 10 A = 138 W (R = 1.38 Ω)
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block" data-action="start-math-drill">
          Drill Math &amp; Conversion Questions (${mathCount} Qs)
        </button>
      </div>

      <!-- 2. Visual Technician Band Map -->
      <div class="panel-card">
        <div class="panel-eyebrow">Subelements T1B &amp; T2A</div>
        <h2 class="panel-title" style="margin-bottom:0.35rem">Visual Technician Band &amp; Privilege Map</h2>
        <p class="panel-desc">
          Every frequency slice, mode restriction, calling channel, and power cap tested on the 2026–2030 Element 2 exam.
        </p>
        ${renderBandMapHtml(false)}
      </div>

      <!-- 3. Official Circuit Schematics Reference -->
      <div class="panel-card">
        <div class="panel-eyebrow">Subelements T6 &amp; T7</div>
        <h2 class="panel-title" style="margin-bottom:0.35rem">Official Exam Schematics (Figures T-1, T-2, T-3)</h2>
        <p class="panel-desc">Tap any schematic below to inspect full-screen component callouts.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.6rem">
          <button type="button" class="btn btn-secondary" data-zoom-fig="T-1">Figure T-1 (NPN Switch)</button>
          <button type="button" class="btn btn-secondary" data-zoom-fig="T-2">Figure T-2 (Power Supply)</button>
          <button type="button" class="btn btn-secondary" data-zoom-fig="T-3">Figure T-3 (T-Tuner)</button>
        </div>
      </div>

      <!-- 4. Exam Day Logistics Checklist -->
      <div class="panel-card">
        <div class="panel-eyebrow">From Study Path to Call Sign</div>
        <h2 class="panel-title" style="margin-bottom:0.65rem">Exam Day Logistics Checklist</h2>
        <div class="checklist-items">
          ${checklistDefs.map((item) => {
            const checked = Boolean(state.checklist[item.key]);
            return `
              <label class="check-item ${checked ? 'is-done' : ''}">
                <input type="checkbox" data-check-key="${escHtml(item.key)}" ${checked ? 'checked' : ''}>
                <span class="check-text">
                  <strong>${escHtml(item.title)}</strong>
                  ${escHtml(item.desc)}
                </span>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 5. 1-Tap Progress Backup / Transfer & Preferences -->
      <div class="panel-card">
        <div class="panel-eyebrow">Offline Storage &amp; Device Sync</div>
        <h2 class="panel-title" style="margin-bottom:0.35rem">1-Tap Progress Backup &amp; Settings</h2>
        <p class="panel-desc">
          Progress saves automatically in <code>localStorage</code>. Copy this compact code to save a backup in Notes or move your streak between desktop and phone.
        </p>
        <label for="backup-code-box" style="font-size:0.78rem;font-weight:700;color:var(--text-secondary)">Backup / Restore Code (<code>HAM1:...</code>)</label>
        <textarea id="backup-code-box" class="backup-textarea" spellcheck="false">${escHtml(backupCode)}</textarea>
        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;margin-bottom:1rem">
          <button type="button" class="btn btn-primary" data-action="copy-backup">Copy Progress Backup Code</button>
          <button type="button" class="btn btn-secondary" data-action="restore-backup">Restore Pasted Code</button>
        </div>

        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;padding-top:0.75rem;border-top:1px solid var(--border-subtle)">
          <button type="button" class="btn btn-secondary" data-action="toggle-theme">
            Theme: ${state.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button type="button" class="btn btn-secondary" data-action="toggle-sound">
            Audio Tones: ${state.sound ? '🔊 On' : '🔇 Off'}
          </button>
          <button type="button" class="btn btn-secondary" style="color:var(--danger)" data-action="reset-progress">
            Reset All Progress
          </button>
        </div>
      </div>
    `;

    bindLiveOhmCalculator();
  }

  function bindLiveOhmCalculator() {
    const eIn = document.getElementById('calc-e');
    const iIn = document.getElementById('calc-i');
    const rIn = document.getElementById('calc-r');
    const out = document.getElementById('calc-live-result');
    if (!eIn || !iIn || !rIn || !out) return;

    const recompute = () => {
      const e = parseFloat(eIn.value);
      const i = parseFloat(iIn.value);
      const r = parseFloat(rIn.value);
      const hasE = Number.isFinite(e);
      const hasI = Number.isFinite(i);
      const hasR = Number.isFinite(r);

      if (hasE && hasI && i !== 0) {
        out.textContent = `R = ${(e / i).toFixed(2)} Ω · Power P = ${(e * i).toFixed(2)} W`;
      } else if (hasE && hasR && r !== 0) {
        const cur = e / r;
        out.textContent = `Current I = ${cur.toFixed(2)} A · Power P = ${(e * cur).toFixed(2)} W`;
      } else if (hasI && hasR) {
        const volt = i * r;
        out.textContent = `Voltage E = ${volt.toFixed(2)} V · Power P = ${(volt * i).toFixed(2)} W`;
      } else {
        out.textContent = 'Enter any two of Volts (E), Amps (I), or Ohms (R) to solve automatically.';
      }
    };

    eIn.addEventListener('input', recompute);
    iIn.addEventListener('input', recompute);
    rIn.addEventListener('input', recompute);
  }

  function renderActiveTab() {
    renderHeader();
    if (activeTab === 'path') renderPathTab();
    else if (activeTab === 'exams') renderExamsTab();
    else if (activeTab === 'aids') renderAidsTab();
  }

  function switchTab(tab) {
    activeTab = tab;
    for (const sec of ['path', 'exams', 'aids']) {
      const view = document.getElementById(`view-${sec}`);
      const btn = document.getElementById(`tab-btn-${sec}`);
      const isTarget = sec === tab;
      view.hidden = !isTarget;
      view.classList.toggle('is-active', isTarget);
      btn.classList.toggle('is-active', isTarget);
      if (isTarget) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    }
    renderActiveTab();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // =========================================================================
  // ACTIVE SESSION ENGINE (Lessons, Signal Check, Drills, Exams, Walkthroughs)
  // =========================================================================

  function openSessionOverlay() {
    document.getElementById('session-overlay').hidden = false;
    document.getElementById('app-shell').setAttribute('inert', '');
  }

  function closeSessionOverlay() {
    activeSession = null;
    document.getElementById('session-overlay').hidden = true;
    document.getElementById('app-shell').removeAttribute('inert');
    renderActiveTab();
  }

  // 1. Start 3-Stage Node Lesson
  function startNodeLesson(group, initialStage = 'briefing') {
    const qs = Q_BY_GROUP.get(group) || [];
    const brief = DATA.briefings[group];
    if (!qs.length || !brief) return;

    if (state.nodes[group].status === 'locked') {
      state.nodes[group].status = 'in_progress';
    } else if (state.nodes[group].status === 'next') {
      state.nodes[group].status = 'in_progress';
    }
    recordStudyActivity();
    saveState();

    activeSession = {
      kind: 'node',
      group,
      stage: initialStage, // 'briefing' | 'flash' | 'challenge' | 'summary'
      cardIdx: 0,
      queue: initialStage === 'challenge' ? prepareQuizItems(qs, false) : prepareQuizItems(qs, true),
      qIdx: 0,
      firstTryCorrect: 0,
      totalGroupQs: qs.length,
      answeredState: null, // { chosenIdx, isCorrect }
      questionShownAt: Date.now()
    };
    openSessionOverlay();
    renderSession();
  }

  function prepareQuizItems(questions, keepFixedOrder = false) {
    const list = keepFixedOrder ? questions.slice() : fyShuffle(questions);
    return list.map((q) => {
      const choices = keepFixedOrder
        ? q.choices.map((text, origIdx) => ({ text, origIdx }))
        : buildShuffledChoices(q);
      const correctSlot = choices.findIndex((c) => c.origIdx === q.answer);
      return { q, choices, correctSlot, retried: false };
    });
  }

  // 2. Start Practice Quiz (Signal Check / Math Drill / Boss Checkpoint)
  function startDrillSession({ mode, title, questions, bossId = null }) {
    if (!questions.length) {
      showToast('No questions available for this session yet.');
      return;
    }
    recordStudyActivity();
    saveState();

    activeSession = {
      kind: 'drill',
      mode, // 'signal' | 'math' | 'boss'
      bossId,
      title,
      queue: prepareQuizItems(questions, false),
      qIdx: 0,
      correctCount: 0,
      totalInitial: questions.length,
      repairedGroups: new Set(),
      touchedGroups: new Set(questions.map((q) => q.group)),
      missedGroups: new Set(),
      answeredState: null,
      questionShownAt: Date.now()
    };
    openSessionOverlay();
    renderSession();
  }

  // 3. Start Official 35-Q Mock Exam or Progress Checkpoint Exam
  function startExamSession(mode) {
    let groups = ORDERED_GROUPS;
    if (mode === 'checkpoint') {
      const gold = ORDERED_GROUPS.filter((g) => state.nodes[g].status === 'gold');
      const unlocked = ORDERED_GROUPS.filter((g) => state.nodes[g].status !== 'locked');
      groups = gold.length > 0 ? gold : unlocked;
    }
    if (!groups.length) {
      showToast('Unlock at least 1 group first!');
      return;
    }

    const items = groups.map((g) => {
      const pool = Q_BY_GROUP.get(g) || [];
      const q = pool[Math.floor(Math.random() * pool.length)];
      const choices = buildShuffledChoices(q);
      const correctSlot = choices.findIndex((c) => c.origIdx === q.answer);
      return {
        q,
        choices,
        correctSlot,
        selectedSlot: null,
        flagged: false
      };
    });

    recordStudyActivity();
    saveState();

    activeSession = {
      kind: 'exam',
      mode, // 'mock35' | 'checkpoint'
      stage: 'taking', // 'taking' | 'results'
      items,
      qIdx: 0,
      startedAt: Date.now(),
      report: null
    };
    openSessionOverlay();
    renderSession();
  }

  // 4. Start Mistake Walkthrough
  function startMistakeWalkthrough(missedIds, title = 'Mistake Walkthrough') {
    const questions = missedIds.map((id) => Q_BY_ID.get(id)).filter(Boolean);
    if (!questions.length) {
      showToast('No missed questions to review!');
      return;
    }
    activeSession = {
      kind: 'walkthrough',
      title,
      items: questions,
      qIdx: 0
    };
    openSessionOverlay();
    renderSession();
  }

  // Render Current Session Screen
  function renderSession() {
    if (!activeSession) return;
    const footer = document.getElementById('session-footer');
    footer.className = 'session-footer';
    document.getElementById('session-right-slot').innerHTML = '';

    if (activeSession.kind === 'node') {
      if (activeSession.stage === 'briefing') return renderNodeBriefing();
      if (activeSession.stage === 'flash') return renderInteractiveQuestion(true);
      if (activeSession.stage === 'challenge') return renderInteractiveQuestion(false);
      if (activeSession.stage === 'summary') return renderNodeSummary();
    }
    if (activeSession.kind === 'drill') {
      if (activeSession.qIdx >= activeSession.queue.length) return renderDrillSummary();
      return renderInteractiveQuestion(false);
    }
    if (activeSession.kind === 'exam') {
      if (activeSession.stage === 'results') return renderExamResults();
      return renderExamQuestion();
    }
    if (activeSession.kind === 'walkthrough') {
      return renderWalkthroughCard();
    }
  }

  // Stage 1: Node Briefing Cards
  function renderNodeBriefing() {
    const { group, cardIdx } = activeSession;
    const brief = DATA.briefings[group];
    const cards = brief.cards || [];
    const card = cards[cardIdx];

    document.getElementById('session-title-pill').textContent = `${group} · Stage 1: Briefing`;
    document.getElementById('session-counter').textContent = `Card ${cardIdx + 1} / ${cards.length}`;
    const pct = Math.round(((cardIdx + 1) / (cards.length * 3)) * 100);
    document.getElementById('session-bar').value = pct;

    document.getElementById('session-right-slot').innerHTML = `
      <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.65rem;font-size:0.74rem" data-action="skip-to-challenge">
        Skip to Quiz
      </button>
    `;

    const body = document.getElementById('session-body');
    body.innerHTML = `
      <div class="briefing-card">
        <div class="panel-eyebrow">${escHtml(brief.title)}</div>
        <h2 style="font-size:1.22rem">${escHtml(card.heading)}</h2>
        <p style="font-size:0.95rem;color:var(--text-primary)">${formatRichText(card.body)}</p>
        ${card.bullets && card.bullets.length ? `
          <ul class="briefing-bullets">
            ${card.bullets.map((b) => `<li>${formatRichText(b)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      ${cardIdx === 0 ? renderMiniAidForBriefing(brief.aid) : ''}
      <div class="briefing-dots" aria-hidden="true">
        ${cards.map((_, i) => `<span class="b-dot ${i === cardIdx ? 'is-active' : ''}"></span>`).join('')}
      </div>
    `;

    const isLast = cardIdx === cards.length - 1;
    document.getElementById('session-footer').innerHTML = `
      <div class="footer-inner">
        <div style="display:flex;gap:0.6rem">
          ${cardIdx > 0 ? `<button type="button" class="btn btn-secondary" data-action="prev-card">Back</button>` : ''}
          <button type="button" class="btn btn-primary btn-block" data-action="next-card">
            ${isLast ? 'Continue to Stage 2: Flash-Pass →' : 'Next Concept Card →'}
          </button>
        </div>
        <div class="kbd-hint">Press Space / Enter for next · ← / → to flip cards</div>
      </div>
    `;
    body.scrollTop = 0;
  }

  // Stage 2 (Flash-Pass) & Stage 3 (Challenge) & Drills
  function renderInteractiveQuestion(isFlashPass) {
    const item = activeSession.queue[activeSession.qIdx];
    const q = item.q;
    const total = activeSession.queue.length;
    const pos = activeSession.qIdx + 1;
    const ansState = activeSession.answeredState;

    if (activeSession.kind === 'node') {
      document.getElementById('session-title-pill').textContent = isFlashPass
        ? `${activeSession.group} · Stage 2: Flash-Pass`
        : `${activeSession.group} · Stage 3: Challenge${item.retried ? ' (Retry)' : ''}`;
      const baseOffset = isFlashPass ? 33 : 66;
      const pct = Math.min(99, baseOffset + Math.round((pos / total) * 33));
      document.getElementById('session-bar').value = pct;
      if (isFlashPass) {
        document.getElementById('session-right-slot').innerHTML = `
          <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.65rem;font-size:0.74rem" data-action="skip-to-challenge">
            Skip Warm-Up
          </button>
        `;
      }
    } else {
      document.getElementById('session-title-pill').textContent = activeSession.title;
      document.getElementById('session-bar').value = Math.round((pos / total) * 100);
    }
    document.getElementById('session-counter').textContent = `${pos} / ${total}`;

    const letters = ['A', 'B', 'C', 'D'];
    const figHtml = q.figure && DATA.figures[q.figure]
      ? `
        <button type="button" class="schematic-box btn-block" data-zoom-fig="${escHtml(q.figure)}" aria-label="Zoom Figure ${escHtml(q.figure)}">
          ${DATA.figures[q.figure]}
          <div class="zoom-hint">🔍 Tap schematic to zoom full screen</div>
        </button>
      `
      : '';

    const choicesHtml = item.choices.map((c, idx) => {
      let cls = 'choice-btn';
      if (isFlashPass && !ansState) {
        cls += idx === item.correctSlot ? ' is-flash-target' : ' is-flash-dimmed';
      } else if (ansState) {
        if (idx === item.correctSlot) cls += ' is-correct';
        else if (idx === ansState.chosenIdx && !ansState.isCorrect) cls += ' is-wrong';
      }
      return `
        <button
          type="button"
          class="${cls}"
          data-pick-choice="${idx}"
          ${ansState ? 'disabled' : ''}
        >
          <span class="choice-key">${letters[idx]}</span>
          <span>${escHtml(c.text)}</span>
        </button>
      `;
    }).join('');

    const body = document.getElementById('session-body');
    body.innerHTML = `
      <div class="quiz-top-zone">
        <div class="q-meta-row">
          <span class="q-id-chip">${escHtml(q.id)}</span>
          ${q.fcc_rules && q.fcc_rules.length
            ? `<span class="q-rule-chip">FCC Part ${escHtml(q.fcc_rules.join(', '))}</span>`
            : isFlashPass
              ? '<span class="q-rule-chip">Tap the highlighted answer to lock it in</span>'
              : ''}
        </div>
        <h2 class="q-stem">${escHtml(q.question)}</h2>
        ${figHtml}
      </div>
      <div class="choices-stack">
        ${choicesHtml}
      </div>
    `;

    const footer = document.getElementById('session-footer');
    if (!ansState) {
      footer.className = 'session-footer';
      footer.innerHTML = `
        <div class="footer-inner">
          <div class="kbd-hint">
            ${isFlashPass
              ? 'Flash-Pass Warm-Up: Distractors dimmed — tap the correct choice (1–4 or A–D)'
              : 'Select an answer (Keys 1–4 or A–D)'}
          </div>
        </div>
      `;
    } else {
      footer.className = `session-footer ${ansState.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
      footer.innerHTML = `
        <div class="footer-inner">
          <div class="feedback-banner-title">
            ${ansState.isCorrect
              ? (isFlashPass ? '✓ Got it! Why this is right:' : '✓ Correct!')
              : '✗ Not quite — queued to loop back at end of round'}
          </div>
          <p class="feedback-why">${escHtml(q.explanation)}</p>
          <button type="button" class="btn ${ansState.isCorrect ? 'btn-success' : 'btn-danger'} btn-block" data-action="continue-quiz">
            Continue →
          </button>
          <div class="kbd-hint">Press Space or Enter to continue</div>
        </div>
      `;
    }
  }

  function handleChoicePick(slotIdx) {
    if (!activeSession || activeSession.answeredState) return;
    const isFlashPass = activeSession.kind === 'node' && activeSession.stage === 'flash';
    const item = activeSession.queue[activeSession.qIdx];
    if (!item || slotIdx < 0 || slotIdx >= item.choices.length) return;

    // In Flash-Pass, encourage tapping the highlighted right answer
    if (isFlashPass && slotIdx !== item.correctSlot) {
      showToast('In Flash-Pass warm-up, tap the highlighted correct choice!');
      return;
    }

    const isCorrect = slotIdx === item.correctSlot;
    const elapsed = Date.now() - activeSession.questionShownAt;
    const qsState = getQState(item.q.id);
    qsState.lastSeen = Date.now();

    if (isFlashPass) {
      if (qsState.bucket === 0) qsState.bucket = 1;
    } else {
      if (isCorrect) {
        qsState.streak = (qsState.streak || 0) + 1;
        qsState.hesitated = elapsed > HESITATION_MS;
        if (!item.retried) {
          qsState.bucket = Math.min(3, Math.max(2, qsState.bucket + 1));
          if (activeSession.kind === 'node') activeSession.firstTryCorrect++;
          if (activeSession.kind === 'drill') activeSession.correctCount++;
        } else {
          qsState.bucket = Math.max(2, qsState.bucket);
        }
      } else {
        qsState.streak = 0;
        qsState.missed = (qsState.missed || 0) + 1;
        qsState.bucket = 1;
        if (activeSession.kind === 'drill') {
          activeSession.missedGroups.add(item.q.group);
        }
        // Loop missed question back at end of round in Node Challenge & Signal Check!
        if (activeSession.kind === 'node' || activeSession.mode === 'signal') {
          const reshuffled = buildShuffledChoices(item.q);
          activeSession.queue.push({
            q: item.q,
            choices: reshuffled,
            correctSlot: reshuffled.findIndex((c) => c.origIdx === item.q.answer),
            retried: true
          });
        }
      }
    }

    playFeedbackTone(isCorrect);
    activeSession.answeredState = { chosenIdx: slotIdx, isCorrect };
    saveState();
    renderSession();
  }

  function advanceQuizStep() {
    if (!activeSession || !activeSession.answeredState) return;
    activeSession.answeredState = null;
    activeSession.qIdx++;
    activeSession.questionShownAt = Date.now();

    if (activeSession.kind === 'node') {
      if (activeSession.qIdx >= activeSession.queue.length) {
        if (activeSession.stage === 'flash') {
          const qs = Q_BY_GROUP.get(activeSession.group) || [];
          activeSession.stage = 'challenge';
          activeSession.queue = prepareQuizItems(qs, false);
          activeSession.qIdx = 0;
          activeSession.questionShownAt = Date.now();
        } else if (activeSession.stage === 'challenge') {
          completeNodeChallenge(activeSession.group);
          activeSession.stage = 'summary';
        }
      }
    }
    renderSession();
  }

  function completeNodeChallenge(group) {
    const node = state.nodes[group];
    const wasGold = node.status === 'gold';
    node.status = 'gold';
    node.cracked = false;
    node.clears = (node.clears || 0) + 1;
    node.lastReviewed = Date.now();

    if (!wasGold) {
      state.streak.todayNodes = (state.streak.todayNodes || 0) + 1;
    }
    // Ensure all questions in cleared node are at least Review/Mastered
    for (const q of Q_BY_GROUP.get(group) || []) {
      const qs = getQState(q.id);
      if (qs.bucket < 2) qs.bucket = 2;
    }
    ensureNextNodeUnlocked(state);
    recordStudyActivity();
    saveState();
  }

  function renderNodeSummary() {
    const { group, firstTryCorrect, totalGroupQs } = activeSession;
    const brief = DATA.briefings[group];
    const acc = Math.round((firstTryCorrect / totalGroupQs) * 100);
    document.getElementById('session-title-pill').textContent = `${group} · Node Mastered!`;
    document.getElementById('session-counter').textContent = '100% Clear';
    document.getElementById('session-bar').value = 100;

    document.getElementById('session-body').innerHTML = `
      <div class="final-boss-card" style="margin:auto 0">
        <div style="font-size:2.8rem">🏅</div>
        <div class="panel-eyebrow" style="color:var(--gold)">Node Turned Solid Gold</div>
        <h2>${escHtml(group)}: ${escHtml(brief.title)}</h2>
        <p class="signal-desc">
          First-pass accuracy: <strong>${firstTryCorrect}/${totalGroupQs} (${acc}%)</strong> — every missed item was looped &amp; cleared!
        </p>
        <div class="stat-grid" style="margin-bottom:0">
          <div class="stat-box">
            <div class="stat-box-val">${state.streak.todayNodes}/${GOAL_NODES}</div>
            <div class="stat-box-lbl">Tonight's Nodes</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${computeOverallReadiness().pct}%</div>
            <div class="stat-box-lbl">Exam Readiness</div>
          </div>
        </div>
      </div>
    `;

    const nextGroup = ORDERED_GROUPS.find((g) => state.nodes[g].status === 'next');
    document.getElementById('session-footer').innerHTML = `
      <div class="footer-inner">
        ${nextGroup ? `
          <button type="button" class="btn btn-primary btn-block" data-open-node="${escHtml(nextGroup)}" data-direct-start="1">
            Continue to Next Node (${escHtml(nextGroup)}) →
          </button>
        ` : ''}
        <button type="button" class="btn btn-secondary btn-block" data-action="finish-session">
          Back to Skill Path
        </button>
      </div>
    `;
  }

  function renderDrillSummary() {
    const { mode, title, correctCount, totalInitial, bossId, touchedGroups, missedGroups } = activeSession;
    const pct = Math.round((correctCount / totalInitial) * 100);
    const passedBoss = pct >= 74;

    if (mode === 'signal') {
      state.streak.todayReviewDone = true;
      for (const g of touchedGroups) {
        if (state.nodes[g].cracked && !missedGroups.has(g)) {
          state.nodes[g].cracked = false;
        }
        state.nodes[g].lastReviewed = Date.now();
      }
    }
    if (mode === 'boss' && bossId && passedBoss) {
      state.bosses[bossId] = true;
    }
    saveState();

    document.getElementById('session-title-pill').textContent = title;
    document.getElementById('session-counter').textContent = 'Complete';
    document.getElementById('session-bar').value = 100;

    document.getElementById('session-body').innerHTML = `
      <div class="final-boss-card" style="margin:auto 0">
        <div style="font-size:2.6rem">${mode === 'boss' ? (passedBoss ? '🏆' : '🛡️') : '📡'}</div>
        <div class="panel-eyebrow" style="color:var(--accent)">${escHtml(title)}</div>
        <h2>${correctCount}/${totalInitial} First-Try (${pct}%)</h2>
        <p class="signal-desc">
          ${mode === 'signal'
            ? 'Signal Check complete! Any cracked groups you answered cleanly are restored to solid Gold.'
            : mode === 'boss'
              ? (passedBoss ? 'Boss Checkpoint cleared! Your recall across chapters is holding strong.' : 'Need 74%+ to clear this Boss Checkpoint—review weak nodes and challenge again!')
              : 'Math & formula drill complete!'}
        </p>
      </div>
    `;

    document.getElementById('session-footer').innerHTML = `
      <div class="footer-inner">
        <button type="button" class="btn btn-primary btn-block" data-action="finish-session">
          Done
        </button>
      </div>
    `;
  }

  // Official Mock Exam & Progress Checkpoint Question View
  function renderExamQuestion() {
    const { items, qIdx, mode } = activeSession;
    const item = items[qIdx];
    const q = item.q;
    const answeredCount = items.filter((it) => it.selectedSlot !== null).length;

    document.getElementById('session-title-pill').textContent =
      mode === 'mock35' ? 'Official 35-Q Mock Exam' : 'Progress Checkpoint Exam';
    document.getElementById('session-counter').textContent =
      `Q ${qIdx + 1}/${items.length} (${answeredCount} answered)`;
    document.getElementById('session-bar').value = Math.round((answeredCount / items.length) * 100);

    document.getElementById('session-right-slot').innerHTML = `
      <button type="button" class="btn btn-secondary flag-btn ${item.flagged ? 'is-flagged' : ''}" style="padding:0.35rem 0.65rem;font-size:0.75rem" data-action="toggle-flag">
        ${item.flagged ? '⚑ Flagged' : '⚐ Flag'}
      </button>
    `;

    const stripHtml = `
      <div class="exam-nav-strip" role="navigation" aria-label="Exam question navigator">
        ${items.map((it, idx) => `
          <button
            type="button"
            class="exam-q-pip ${it.selectedSlot !== null ? 'is-answered' : ''} ${idx === qIdx ? 'is-current' : ''} ${it.flagged ? 'is-flagged' : ''}"
            data-exam-jump="${idx}"
            aria-label="Question ${idx + 1}${it.flagged ? ' (flagged)' : ''}${it.selectedSlot !== null ? ' (answered)' : ''}"
          >${idx + 1}</button>
        `).join('')}
      </div>
    `;

    const letters = ['A', 'B', 'C', 'D'];
    const figHtml = q.figure && DATA.figures[q.figure]
      ? `
        <button type="button" class="schematic-box btn-block" data-zoom-fig="${escHtml(q.figure)}">
          ${DATA.figures[q.figure]}
          <div class="zoom-hint">🔍 Tap schematic to zoom</div>
        </button>
      `
      : '';

    const choicesHtml = item.choices.map((c, idx) => `
      <button
        type="button"
        class="choice-btn ${item.selectedSlot === idx ? 'is-selected' : ''}"
        data-exam-pick="${idx}"
      >
        <span class="choice-key">${letters[idx]}</span>
        <span>${escHtml(c.text)}</span>
      </button>
    `).join('');

    document.getElementById('session-body').innerHTML = `
      ${stripHtml}
      <div class="quiz-top-zone">
        <div class="q-meta-row">
          <span class="q-id-chip">${escHtml(q.id)}</span>
          <span class="q-rule-chip">Subelement ${escHtml(q.subelement)} · No hints until Submit</span>
        </div>
        <h2 class="q-stem">${escHtml(q.question)}</h2>
        ${figHtml}
      </div>
      <div class="choices-stack">
        ${choicesHtml}
      </div>
    `;

    const isLast = qIdx === items.length - 1;
    document.getElementById('session-footer').innerHTML = `
      <div class="footer-inner">
        <div style="display:flex;gap:0.55rem">
          <button type="button" class="btn btn-secondary" data-action="exam-prev" ${qIdx === 0 ? 'disabled' : ''}>← Prev</button>
          ${!isLast
            ? `<button type="button" class="btn btn-primary btn-block" data-action="exam-next">Next Question →</button>`
            : `<button type="button" class="btn btn-gold btn-block" data-action="exam-submit">Submit Exam (${answeredCount}/${items.length})</button>`}
          ${!isLast && answeredCount === items.length
            ? `<button type="button" class="btn btn-gold" data-action="exam-submit">Submit</button>`
            : ''}
        </div>
        <div class="kbd-hint">Keys 1–4 / A–D select · F flags · ← / → navigate</div>
      </div>
    `;
  }

  async function submitExamWithCheck() {
    if (!activeSession || activeSession.kind !== 'exam') return;
    const unanswered = activeSession.items.filter((it) => it.selectedSlot === null).length;
    const flagged = activeSession.items.filter((it) => it.flagged).length;

    if (unanswered > 0 || flagged > 0) {
      const ok = await openConfirmDialog({
        title: 'Submit Practice Exam?',
        html: `<p>You have <strong>${unanswered} unanswered</strong> and <strong>${flagged} flagged</strong> question(s).</p><p>Submit anyway and view your score breakdown?</p>`,
        confirmLabel: 'Submit & Grade Exam',
        cancelLabel: 'Keep Reviewing'
      });
      if (!ok) return;
    }

    gradeExamSession();
  }

  function gradeExamSession() {
    const { items, mode } = activeSession;
    let score = 0;
    let studiedTotal = 0;
    let studiedScore = 0;
    const missedIds = [];
    const newlyCracked = [];
    const subStats = {};
    for (const s of DATA.subelements) {
      subStats[s.id] = { correct: 0, total: 0, title: s.title };
    }

    for (const it of items) {
      const q = it.q;
      const isRight = it.selectedSlot === it.correctSlot;
      const node = state.nodes[q.group];
      const wasStudied = node && node.status === 'gold';

      if (subStats[q.subelement]) {
        subStats[q.subelement].total++;
        if (isRight) subStats[q.subelement].correct++;
      }

      if (wasStudied) {
        studiedTotal++;
        if (isRight) studiedScore++;
      }

      const qs = getQState(q.id);
      qs.lastSeen = Date.now();

      if (isRight) {
        score++;
        if (qs.bucket >= 2) qs.bucket = 3;
      } else {
        missedIds.push(q.id);
        qs.missed = (qs.missed || 0) + 1;
        if (qs.bucket > 0) qs.bucket = 1;
        if (wasStudied && !node.cracked) {
          node.cracked = true;
          newlyCracked.push(q.group);
        }
      }
    }

    const record = {
      id: 'ex_' + Date.now(),
      ts: Date.now(),
      mode,
      score,
      total: items.length,
      studiedScore,
      studiedTotal,
      missedIds
    };
    state.exams.unshift(record);
    state.exams = state.exams.slice(0, 30);
    recordStudyActivity();
    saveState();

    activeSession.stage = 'results';
    activeSession.report = { record, newlyCracked, subStats };
    renderSession();
  }

  function renderExamResults() {
    const { record, newlyCracked, subStats } = activeSession.report;
    const rawPct = Math.round((record.score / record.total) * 100);
    const passCount = Math.ceil(record.total * 0.74);
    const passed = record.score >= (record.mode === 'mock35' ? 26 : passCount);
    const showDualScore = record.mode === 'mock35' && record.studiedTotal > 0 && record.studiedTotal < 35;
    const studiedPct = record.studiedTotal > 0
      ? Math.round((record.studiedScore / record.studiedTotal) * 100)
      : 0;

    document.getElementById('session-title-pill').textContent = 'Exam Score Report';
    document.getElementById('session-counter').textContent = passed ? 'PASSED ✓' : 'Keep Climbing';
    document.getElementById('session-bar').value = rawPct;

    const subRowsHtml = DATA.subelements
      .filter((s) => subStats[s.id] && subStats[s.id].total > 0)
      .map((s) => {
        const st = subStats[s.id];
        const p = Math.round((st.correct / st.total) * 100);
        return `
          <div class="sub-bar-row">
            <strong>${escHtml(s.id)}</strong>
            <div class="sub-track"><div class="sub-fill" style="width:${p}%"></div></div>
            <span style="text-align:right;color:var(--text-secondary)">${st.correct}/${st.total}</span>
          </div>
        `;
      }).join('');

    document.getElementById('session-body').innerHTML = `
      <div class="panel-card" style="text-align:center;border-color:${passed ? 'var(--success)' : 'var(--warning)'}">
        <div class="panel-eyebrow" style="color:${passed ? 'var(--success)' : 'var(--warning)'}">
          ${passed ? '🎉 Passing Exam Score (74%+ Required)' : 'Mid-Campaign Benchmark Report'}
        </div>
        <h2 style="font-size:1.85rem;margin:0.25rem 0">${record.score} / ${record.total} (${rawPct}%)</h2>
        ${showDualScore ? `
          <div class="band-row" style="margin-top:0.65rem;text-align:left;border-color:rgba(56,189,248,0.45)">
            <div style="font-size:0.75rem;font-weight:800;color:var(--accent);text-transform:uppercase">Smart Studied-Nodes Score</div>
            <div style="font-size:1.12rem;font-weight:900;margin-top:0.1rem">
              ${record.studiedScore}/${record.studiedTotal} (${studiedPct}%) on material you've learned!
            </div>
            <p class="band-notes">You haven't unlocked all 35 groups yet—this tracks retention strictly on your completed Gold nodes.</p>
          </div>
        ` : ''}
        ${newlyCracked.length > 0 ? `
          <p class="panel-desc" style="margin:0.65rem 0 0;color:var(--warning)">
            ⚡ Marked <strong>${escHtml(newlyCracked.join(', '))}</strong> as <em>Cracked</em> on your Path so your next Nightly Signal Check targets those weak spots!
          </p>
        ` : ''}
      </div>

      <div class="panel-card">
        <div class="panel-eyebrow">Subelement Breakdown (T1–T0)</div>
        <div style="margin-top:0.65rem">${subRowsHtml}</div>
      </div>
    `;

    document.getElementById('session-footer').innerHTML = `
      <div class="footer-inner">
        ${record.missedIds.length > 0 ? `
          <button type="button" class="btn btn-primary btn-block" data-action="walkthrough-current-exam">
            Review ${record.missedIds.length} Missed Question${record.missedIds.length > 1 ? 's' : ''} →
          </button>
        ` : ''}
        <button type="button" class="btn btn-secondary btn-block" data-action="finish-session">
          Return to App
        </button>
      </div>
    `;
  }

  // Mistake Walkthrough View
  function renderWalkthroughCard() {
    const { items, qIdx, title } = activeSession;
    const q = items[qIdx];
    const letters = ['A', 'B', 'C', 'D'];

    document.getElementById('session-title-pill').textContent = title;
    document.getElementById('session-counter').textContent = `Missed ${qIdx + 1} / ${items.length}`;
    document.getElementById('session-bar').value = Math.round(((qIdx + 1) / items.length) * 100);

    const figHtml = q.figure && DATA.figures[q.figure]
      ? `
        <button type="button" class="schematic-box btn-block" data-zoom-fig="${escHtml(q.figure)}">
          ${DATA.figures[q.figure]}
          <div class="zoom-hint">🔍 Tap schematic to zoom</div>
        </button>
      `
      : '';

    document.getElementById('session-body').innerHTML = `
      <div class="quiz-top-zone">
        <div class="q-meta-row">
          <span class="q-id-chip">${escHtml(q.id)} · Group ${escHtml(q.group)}</span>
          ${q.fcc_rules && q.fcc_rules.length ? `<span class="q-rule-chip">FCC Part ${escHtml(q.fcc_rules.join(', '))}</span>` : ''}
        </div>
        <h2 class="q-stem">${escHtml(q.question)}</h2>
        ${figHtml}
      </div>

      <div class="panel-card" style="border-color:var(--success);margin-top:0.25rem">
        <div class="panel-eyebrow" style="color:var(--success)">Correct Answer (${letters[q.answer]})</div>
        <p style="font-weight:800;font-size:1rem;margin:0.25rem 0 0.65rem">${escHtml(q.choices[q.answer])}</p>
        <div class="panel-eyebrow">Why It's Right</div>
        <p style="font-size:0.9rem;margin-top:0.2rem">${escHtml(q.explanation)}</p>
      </div>
    `;

    const isLast = qIdx === items.length - 1;
    document.getElementById('session-footer').innerHTML = `
      <div class="footer-inner">
        <div style="display:flex;gap:0.55rem">
          <button type="button" class="btn btn-secondary" data-action="walk-prev" ${qIdx === 0 ? 'disabled' : ''}>← Prev</button>
          <button type="button" class="btn btn-primary btn-block" data-action="${isLast ? 'finish-session' : 'walk-next'}">
            ${isLast ? 'Finish Walkthrough ✓' : 'Next Missed Question →'}
          </button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // EVENT DELEGATION, KEYBOARD SHORTCUTS, TIMER & INIT
  // =========================================================================

  function bindEvents() {
    // Bottom nav tabs
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Header streak & goal summary pills
    document.getElementById('streak-pill').addEventListener('click', () => {
      openConfirmDialog({
        title: `🔥 ${state.streak.count}-Night Study Streak`,
        html: `
          <p>Longest streak: <strong>${state.streak.longest} night(s)</strong>.</p>
          <p>Streaks roll over at <strong>3:00 AM local time</strong>, so late-night sessions after midnight always count toward tonight!</p>
        `,
        confirmLabel: 'Nice!',
        cancelLabel: ''
      });
    });

    document.getElementById('goal-pill').addEventListener('click', () => {
      const mins = Math.floor(state.streak.todaySeconds / 60);
      openConfirmDialog({
        title: 'Tonight’s 30-Minute Session Goal',
        html: `
          <p>Active study time tonight: <strong>${mins} / 30 minutes</strong></p>
          <p>New Gold nodes tonight: <strong>${state.streak.todayNodes} / ${GOAL_NODES} nodes</strong></p>
          <p>Signal Check warm-up: <strong>${state.streak.todayReviewDone ? 'Completed ✓' : 'Pending'}</strong></p>
        `,
        confirmLabel: 'Keep Going',
        cancelLabel: ''
      });
    });

    // Session close button
    document.getElementById('session-close-btn').addEventListener('click', async () => {
      if (activeSession && activeSession.kind === 'exam' && activeSession.stage === 'taking') {
        const ok = await openConfirmDialog({
          title: 'Exit Practice Exam?',
          html: '<p>Your current in-progress exam answers have not been submitted yet.</p>',
          confirmLabel: 'Exit Exam',
          cancelLabel: 'Stay in Exam',
          danger: true
        });
        if (!ok) return;
      }
      closeSessionOverlay();
    });

    // Global click delegation
    document.addEventListener('click', async (e) => {
      lastInteractionTs = Date.now();
      const el = e.target.closest('[data-open-node],[data-modal-start],[data-zoom-fig],[data-action],[data-pick-choice],[data-exam-pick],[data-exam-jump],[data-boss-id],[data-review-exam],[data-math-target]');
      if (!el) return;

      if (el.dataset.zoomFig) {
        openFigureZoom(el.dataset.zoomFig);
        return;
      }

      if (el.dataset.openNode) {
        const g = el.dataset.openNode;
        if (el.dataset.directStart === '1') {
          startNodeLesson(g, 'briefing');
        } else {
          openNodeModal(g);
        }
        return;
      }

      if (el.dataset.modalStart) {
        const dlg = document.getElementById('node-dialog');
        if (dlg.open) dlg.close();
        startNodeLesson(el.dataset.modalStart, el.dataset.startStage || 'briefing');
        return;
      }

      if (el.dataset.bossId) {
        const chNum = Number(el.dataset.bossCh);
        const groups = [];
        for (const c of DATA.campaign) {
          groups.push(...c.groups);
          if (c.chapter === chNum) break;
        }
        const unlocked = groups.filter((g) => state.nodes[g].status !== 'locked');
        const targetGroups = unlocked.length > 0 ? unlocked : groups.slice(0, 3);
        const qs = targetGroups.map((g) => {
          const arr = Q_BY_GROUP.get(g) || [];
          return arr[Math.floor(Math.random() * arr.length)];
        }).filter(Boolean);
        startDrillSession({
          mode: 'boss',
          bossId: el.dataset.bossId,
          title: `Boss Checkpoint (${qs.length} Qs)`,
          questions: qs
        });
        return;
      }

      if (el.dataset.reviewExam !== undefined) {
        const ex = state.exams[Number(el.dataset.reviewExam)];
        if (ex && ex.missedIds) {
          startMistakeWalkthrough(ex.missedIds, 'Exam Mistake Walkthrough');
        }
        return;
      }

      if (el.dataset.mathTarget) {
        mathSolveTarget = el.dataset.mathTarget;
        renderAidsTab();
        return;
      }

      if (el.dataset.pickChoice !== undefined) {
        handleChoicePick(Number(el.dataset.pickChoice));
        return;
      }

      if (el.dataset.examPick !== undefined && activeSession && activeSession.kind === 'exam') {
        activeSession.items[activeSession.qIdx].selectedSlot = Number(el.dataset.examPick);
        renderSession();
        return;
      }

      if (el.dataset.examJump !== undefined && activeSession && activeSession.kind === 'exam') {
        activeSession.qIdx = Number(el.dataset.examJump);
        renderSession();
        return;
      }

      const act = el.dataset.action;
      if (!act) return;

      if (act === 'start-signal-check') {
        const qList = buildSignalCheckQueue();
        startDrillSession({ mode: 'signal', title: 'Nightly Signal Check', questions: qList });
      } else if (act === 'start-mock35') {
        startExamSession('mock35');
      } else if (act === 'start-checkpoint') {
        startExamSession('checkpoint');
      } else if (act === 'start-math-drill') {
        const mathQs = fyShuffle(DATA.pool.filter((q) => q.tags.includes('math')));
        startDrillSession({ mode: 'math', title: 'Math & Formula Drill', questions: mathQs });
      } else if (act === 'prev-card' && activeSession) {
        activeSession.cardIdx = Math.max(0, activeSession.cardIdx - 1);
        renderSession();
      } else if (act === 'next-card' && activeSession) {
        const cards = DATA.briefings[activeSession.group].cards;
        if (activeSession.cardIdx < cards.length - 1) {
          activeSession.cardIdx++;
        } else {
          activeSession.stage = 'flash';
          activeSession.qIdx = 0;
          activeSession.questionShownAt = Date.now();
        }
        renderSession();
      } else if (act === 'skip-to-challenge' && activeSession && activeSession.kind === 'node') {
        const qs = Q_BY_GROUP.get(activeSession.group) || [];
        activeSession.stage = 'challenge';
        activeSession.queue = prepareQuizItems(qs, false);
        activeSession.qIdx = 0;
        activeSession.answeredState = null;
        activeSession.questionShownAt = Date.now();
        renderSession();
      } else if (act === 'continue-quiz') {
        advanceQuizStep();
      } else if (act === 'finish-session') {
        closeSessionOverlay();
      } else if (act === 'toggle-flag' && activeSession && activeSession.kind === 'exam') {
        const cur = activeSession.items[activeSession.qIdx];
        cur.flagged = !cur.flagged;
        renderSession();
      } else if (act === 'exam-prev' && activeSession && activeSession.kind === 'exam') {
        activeSession.qIdx = Math.max(0, activeSession.qIdx - 1);
        renderSession();
      } else if (act === 'exam-next' && activeSession && activeSession.kind === 'exam') {
        activeSession.qIdx = Math.min(activeSession.items.length - 1, activeSession.qIdx + 1);
        renderSession();
      } else if (act === 'exam-submit') {
        submitExamWithCheck();
      } else if (act === 'walkthrough-current-exam' && activeSession && activeSession.report) {
        startMistakeWalkthrough(activeSession.report.record.missedIds, 'Exam Mistake Walkthrough');
      } else if (act === 'walk-prev' && activeSession && activeSession.kind === 'walkthrough') {
        activeSession.qIdx = Math.max(0, activeSession.qIdx - 1);
        renderSession();
      } else if (act === 'walk-next' && activeSession && activeSession.kind === 'walkthrough') {
        activeSession.qIdx = Math.min(activeSession.items.length - 1, activeSession.qIdx + 1);
        renderSession();
      } else if (act === 'copy-backup') {
        const box = document.getElementById('backup-code-box');
        const code = exportBackupString();
        if (box) box.value = code;
        const ok = await copyTextToClipboard(code);
        showToast(ok ? '✓ Progress backup code copied to clipboard!' : 'Select and copy the HAM1 code from the text box.');
      } else if (act === 'restore-backup') {
        const box = document.getElementById('backup-code-box');
        if (!box) return;
        try {
          importBackupString(box.value);
          renderActiveTab();
          showToast('✓ Progress restored from backup code!');
        } catch (err) {
          showToast('Invalid backup code: ' + err.message);
        }
      } else if (act === 'toggle-theme') {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
        renderAidsTab();
      } else if (act === 'toggle-sound') {
        state.sound = !state.sound;
        saveState();
        renderAidsTab();
      } else if (act === 'reset-progress') {
        const ok = await openConfirmDialog({
          title: 'Reset All Study Progress?',
          html: '<p>This clears your Gold nodes, question mastery, streak, and exam history on this device. Consider copying a Backup Code first!</p>',
          confirmLabel: 'Reset Everything',
          cancelLabel: 'Cancel',
          danger: true
        });
        if (ok) {
          state = createDefaultState();
          applyTheme();
          saveState();
          renderActiveTab();
          showToast('Progress reset to Night 1.');
        }
      }
    });

    // Checklist checkboxes
    document.addEventListener('change', (e) => {
      const cb = e.target.closest('input[data-check-key]');
      if (!cb) return;
      state.checklist[cb.dataset.checkKey] = cb.checked;
      saveState();
      renderAidsTab();
    });

    // Desktop Keyboard-First Shortcuts (1-4 / A-D, Space/Enter, F, Arrows, Esc)
    document.addEventListener('keydown', (e) => {
      lastInteractionTs = Date.now();
      if (!activeSession) return;
      if (document.querySelector('dialog[open]')) return;
      if (e.target.matches('input, textarea, select')) return;

      const key = e.key;
      const lower = key.toLowerCase();

      if (key === 'Escape') {
        e.preventDefault();
        document.getElementById('session-close-btn').click();
        return;
      }

      // Briefing keyboard nav
      if (activeSession.kind === 'node' && activeSession.stage === 'briefing') {
        if (key === ' ' || key === 'Enter' || key === 'ArrowRight') {
          e.preventDefault();
          const btn = document.querySelector('[data-action="next-card"]');
          if (btn) btn.click();
        } else if (key === 'ArrowLeft') {
          e.preventDefault();
          const btn = document.querySelector('[data-action="prev-card"]');
          if (btn) btn.click();
        }
        return;
      }

      // Interactive Quiz (Flash, Challenge, Drill)
      const isQuiz = (activeSession.kind === 'node' && (activeSession.stage === 'flash' || activeSession.stage === 'challenge')) ||
        (activeSession.kind === 'drill' && activeSession.qIdx < activeSession.queue.length);

      if (isQuiz) {
        if (activeSession.answeredState) {
          if (key === ' ' || key === 'Enter') {
            e.preventDefault();
            advanceQuizStep();
          }
          return;
        }
        const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
        if (map[lower] !== undefined) {
          e.preventDefault();
          handleChoicePick(map[lower]);
        }
        return;
      }

      // Exam Mode keyboard nav
      if (activeSession.kind === 'exam' && activeSession.stage === 'taking') {
        const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
        if (map[lower] !== undefined) {
          e.preventDefault();
          activeSession.items[activeSession.qIdx].selectedSlot = map[lower];
          renderSession();
        } else if (lower === 'f') {
          e.preventDefault();
          activeSession.items[activeSession.qIdx].flagged = !activeSession.items[activeSession.qIdx].flagged;
          renderSession();
        } else if (key === 'ArrowRight' || key === ' ' || key === 'Enter') {
          if (activeSession.qIdx < activeSession.items.length - 1) {
            e.preventDefault();
            activeSession.qIdx++;
            renderSession();
          }
        } else if (key === 'ArrowLeft') {
          if (activeSession.qIdx > 0) {
            e.preventDefault();
            activeSession.qIdx--;
            renderSession();
          }
        }
        return;
      }

      // Walkthrough keyboard nav
      if (activeSession.kind === 'walkthrough') {
        if (key === 'ArrowRight' || key === ' ' || key === 'Enter') {
          e.preventDefault();
          const nextBtn = document.querySelector('[data-action="walk-next"], [data-action="finish-session"]');
          if (nextBtn) nextBtn.click();
        } else if (key === 'ArrowLeft') {
          e.preventDefault();
          const prevBtn = document.querySelector('[data-action="walk-prev"]');
          if (prevBtn) prevBtn.click();
        }
      }
    });

    // Light-dismiss fallback for <dialog closedby="any"> where unsupported (Safari)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (ev, dialog) => {
        const r = dialog.getBoundingClientRect();
        return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
      };
      for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (ev) => { pressedOutside = outside(ev, dialog); });
        dialog.addEventListener('pointerup', (ev) => {
          if (pressedOutside && outside(ev, dialog)) dialog.close();
        });
      }
    }

    // Active Study Foreground Timer (ticks every 5s while actively studying)
    setInterval(() => {
      if (document.hidden) return;
      if (!activeSession) return;
      if (Date.now() - lastInteractionTs > 90000) return;
      rolloverDayIfNeeded();
      state.streak.todaySeconds = (state.streak.todaySeconds || 0) + 5;
      recordStudyActivity();
      saveState();
      renderHeader();
    }, 5000);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  function init() {
    applyTheme();
    rolloverDayIfNeeded();
    ensureNextNodeUnlocked();
    bindEvents();
    renderActiveTab();
    registerServiceWorker();
  }

  init();
})();
