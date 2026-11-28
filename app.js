/* Watt a Ham — 2026–2030 Technician License Study App (Zero-Build Static PWA) */
(function () {
  'use strict';

  const DATA = window.HAM_DATA;
  if (!DATA || !Array.isArray(DATA.pool)) {
    console.error('HAM_DATA failed to load.');
    return;
  }

  const STORAGE_KEY = 'ham_study_v1';
  const GOAL_SECONDS = 30 * 60; // 30-minute daily pace ring (uncapped beyond 30m)
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
      hideWelcome: false,
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
    if (typeof incoming.hideWelcome === 'boolean') base.hideWelcome = incoming.hideWelcome;
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
      hw: state.hideWelcome ? 1 : 0,
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
    if (c.hw !== undefined) next.hideWelcome = Boolean(c.hw);
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

  // HTML Escaping, Markdown (**bold**, *italic*, `code`) & Jargon Auto-Linker
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const GLOSSARY = DATA.glossary || {};
  const PHOTOS = DATA.photos || {};
  const ALIAS_TO_KEY = new Map();
  let JARGON_RE = null;
  (function initGlossaryMatcher() {
    const allAliases = [];
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      for (const rawAlias of entry.aliases || []) {
        const clean = rawAlias.trim();
        if (!clean) continue;
        const low = clean.toLowerCase();
        if (!ALIAS_TO_KEY.has(low)) {
          ALIAS_TO_KEY.set(low, key);
          allAliases.push(clean);
        }
      }
    }
    if (allAliases.length) {
      allAliases.sort((a, b) => b.length - a.length);
      const escaped = allAliases.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      JARGON_RE = new RegExp(`(?<![A-Za-z0-9-/])(${escaped.join('|')})(?![A-Za-z0-9-])`, 'gi');
    }
  })();

  function formatRichText(str, opts = {}) {
    const { linkJargon = false, seenTerms = null, excludeKey = null } = opts;
    const codeSlots = [];
    let out = escHtml(str).replace(/`([^`]+)`/g, (_, code) => {
      codeSlots.push(`<code>${code}</code>`);
      return `\u0000CODE${codeSlots.length - 1}\u0000`;
    });
    out = out
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^\s*](?:[^*]*?[^\s*])?)\*(?!\*)/g, '<em>$1</em>');

    if (linkJargon && JARGON_RE) {
      const localSeen = seenTerms || new Set();
      const parts = out.split(/(<[^>]+>|\u0000CODE\d+\u0000)/g);
      out = parts.map((seg) => {
        if (!seg || seg.startsWith('<') || seg.startsWith('\u0000CODE')) return seg;
        return seg.replace(JARGON_RE, (match) => {
          const gKey = ALIAS_TO_KEY.get(match.toLowerCase());
          if (!gKey || gKey === excludeKey || localSeen.has(gKey)) return match;
          localSeen.add(gKey);
          return `<button type="button" class="jargon-term" data-jargon-key="${escHtml(gKey)}">${match}</button>`;
        });
      }).join('');
    }

    return out.replace(/\u0000CODE(\d+)\u0000/g, (_, idx) => codeSlots[Number(idx)]);
  }

  // Anchored Jargon Popover Controller (with Nested Term History)
  let jargonHistory = [];
  let jargonAnchorRect = null;

  function closeJargonPopover() {
    const pop = document.getElementById('jargon-popover');
    if (!pop) return;
    if (typeof pop.hidePopover === 'function') {
      try { pop.hidePopover(); } catch {}
    }
    pop.classList.remove('is-fallback-open');
    jargonHistory = [];
  }

  function openJargonPopover(gKey, triggerEl = null, isBack = false) {
    const entry = GLOSSARY[gKey];
    const pop = document.getElementById('jargon-popover');
    const inner = document.getElementById('jargon-popover-inner');
    if (!entry || !pop || !inner) return;

    if (triggerEl && typeof triggerEl.getBoundingClientRect === 'function') {
      const r = triggerEl.getBoundingClientRect();
      if (!pop.matches?.(':popover-open') && !pop.classList.contains('is-fallback-open')) {
        jargonAnchorRect = r;
        jargonHistory = [];
      } else if (!isBack && pop.dataset.currentKey && pop.dataset.currentKey !== gKey) {
        jargonHistory.push(pop.dataset.currentKey);
      }
    }
    pop.dataset.currentKey = gKey;

    const popSeen = new Set([gKey]);
    const popPhoto = entry.photo && PHOTOS[entry.photo] ? PHOTOS[entry.photo] : null;
    inner.innerHTML = `
      <div class="jargon-pop-top">
        <div>
          <div class="jargon-pop-cat">${escHtml(entry.category || 'Glossary')}</div>
          <h3 id="jargon-pop-title" class="jargon-pop-title">${escHtml(entry.term)}</h3>
          ${entry.expansion ? `<div class="jargon-pop-exp">${escHtml(entry.expansion)}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:0.35rem">
          ${jargonHistory.length > 0 ? `<button type="button" class="jargon-back-btn" data-action="jargon-back">← Back</button>` : ''}
          <button type="button" class="jargon-close-btn" data-action="jargon-close" aria-label="Close definition">✕</button>
        </div>
      </div>
      ${popPhoto ? `
        <button type="button" class="jargon-pop-photo-btn" data-zoom-photo="${escHtml(entry.photo)}" aria-label="Enlarge photo of ${escHtml(popPhoto.title)}">
          <img class="jargon-pop-photo-img" src="${escHtml(popPhoto.src)}" width="${Number(popPhoto.width) || 640}" height="${Number(popPhoto.height) || 480}" alt="${escHtml(popPhoto.title)}">
          <span class="jargon-pop-photo-badge">🔍 Tap to enlarge</span>
        </button>
      ` : ''}
      <p class="jargon-pop-def">${formatRichText(entry.definition, { linkJargon: true, seenTerms: popSeen, excludeKey: gKey })}</p>
      ${entry.analogy ? `
        <div class="jargon-pop-analogy">
          <strong>Real-world intuition:</strong> ${formatRichText(entry.analogy, { linkJargon: true, seenTerms: popSeen, excludeKey: gKey })}
        </div>
      ` : ''}
    `;

    if (typeof pop.showPopover === 'function') {
      try { pop.showPopover(); } catch {}
    } else {
      pop.classList.add('is-fallback-open');
    }

    // Clamp popover cleanly near the clicked word within viewport bounds
    const vw = window.innerWidth || 390;
    const vh = window.innerHeight || 800;
    const rect = jargonAnchorRect || { left: vw / 2 - 40, right: vw / 2 + 40, top: vh / 3, bottom: vh / 3 + 22 };
    const popW = pop.offsetWidth || Math.min(vw * 0.92, 340);
    const popH = pop.offsetHeight || 210;

    let left = rect.left + (rect.right - rect.left) / 2 - popW / 2;
    left = Math.max(12, Math.min(vw - popW - 12, left));
    let top = rect.bottom + 8;
    if (rect.top > vh * 0.54 && rect.top - popH - 10 >= 12) {
      top = rect.top - popH - 8;
    } else if (top + popH > vh - 12) {
      top = Math.max(12, vh - popH - 12);
    }
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
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

  function shouldHideSchematicLegend() {
    if (!activeSession) return false;
    if (activeSession.kind === 'exam' && activeSession.stage === 'taking') return true;
    if (activeSession.kind === 'node' && (activeSession.stage === 'flash' || activeSession.stage === 'challenge') && !activeSession.answeredState) {
      return true;
    }
    if (activeSession.kind === 'drill' && activeSession.qIdx < activeSession.queue.length && !activeSession.answeredState) {
      return true;
    }
    return false;
  }

  function openFigureZoom(figKey) {
    const svg = DATA.figures[figKey];
    if (!svg) return;
    const dlg = document.getElementById('figure-dialog');
    document.getElementById('figure-dialog-title').textContent = `Exam Schematic — Figure ${figKey}`;
    document.getElementById('figure-dialog-svg').innerHTML = svg;
    const testedCaptions = {
      'T-1': 'Tested on Exam: #1 Resistor · #2 NPN Transistor (controls current flow) · #3 Lamp · #4 Battery. (#5 Ground is not asked.)',
      'T-2': 'Tested on Exam: #3 SPST Switch · #4 Transformer · #6 Capacitor · #8 LED · #9 Variable Resistor. (#1, #2, #5, #7, #10 are circuit context only—not asked!)',
      'T-3': 'Tested on Exam: #3 Variable Inductor · #4 Antenna. (#1 & #2 are not asked!)'
    };
    document.getElementById('figure-dialog-caption').textContent = shouldHideSchematicLegend()
      ? 'Component labels hidden while answering—tap ✕ or outside to return to your question.'
      : (testedCaptions[figKey] || '');
    dlg.showModal();
  }

  function openPhotoZoom(photoKey) {
    const p = PHOTOS[photoKey];
    if (!p) return;
    closeJargonPopover();
    const dlg = document.getElementById('figure-dialog');
    document.getElementById('figure-dialog-title').textContent = p.title;
    document.getElementById('figure-dialog-svg').innerHTML = `
      <img class="figure-zoom-photo" src="${escHtml(p.src)}" width="${Number(p.width) || 720}" height="${Number(p.height) || 540}" alt="${escHtml(p.title)}">
    `;
    document.getElementById('figure-dialog-caption').innerHTML = `
      ${escHtml(p.caption)}
      <span class="photo-credit-line">
        Photo: ${escHtml(p.credit)} · ${escHtml(p.license)} ·
        <a href="${escHtml(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
      </span>
    `;
    if (!dlg.open) dlg.showModal();
  }

  // Paged First-Visit Welcome / How-It-Works Guide
  const WELCOME_SLIDES = [
    {
      eyebrow: 'Welcome to Watt a Ham · Step 1 of 5',
      title: 'Your Guided Path to a Ham Radio Call Sign',
      lead: 'Watt a Ham is an independent study guide teaching the public-domain 2026–2030 US Technician (Element 2) question pool from scratch—no prior radio or electronics background required.',
      rows: [
        {
          icon: '🗺️',
          html: '<strong>35-Node Skill Path (All 409 Pool Questions):</strong> Instead of random flashcards, topics are ordered from everyday on-air operating into electronics, antennas, and FCC rules.'
        },
        {
          icon: '⏱️',
          html: '<strong>Built for Any Pace:</strong> Knock out one 8-minute node whenever you have a spare moment, or work through several chapters in a weekend cram.'
        },
        {
          icon: '✈️',
          html: '<strong>100% Offline Ready:</strong> Add to your phone’s Home Screen (or open locally) and every lesson, diagram, and photo works without internet.'
        }
      ]
    },
    {
      eyebrow: 'How Lessons Work · Step 2 of 5',
      title: 'Every Node Uses a 3-Stage Lesson',
      lead: 'Each node on the Path covers one NCVEC question group (~11–12 questions) in three smooth steps:',
      rows: [
        {
          icon: '📖',
          html: '<strong>Stage 1 · Illustrated Walkthrough Cards:</strong> Plain-English concept cards with custom diagrams, interactive widgets, real equipment photos, and a final <strong>Cheat-Sheet</strong>.'
        },
        {
          icon: '⚡',
          html: '<strong>Stage 2 · Flash-Pass Warm-Up:</strong> First look at every question with wrong choices dimmed/crossed out so you lock in the right answer first.'
        },
        {
          icon: '🏅',
          html: '<strong>Stage 3 · 4-Choice Challenge:</strong> Shuffled quiz where any missed item loops back at the end of the round until you clear 100% and turn the node <strong>Gold ★</strong>.'
        }
      ]
    },
    {
      eyebrow: 'Smart Reading Aids · Step 3 of 5',
      title: 'Know Exactly What to Memorize',
      lead: 'Handbook cards are designed so you can enjoy the real-world hobby context without guessing what is actually on the test:',
      rows: [
        {
          icon: '🎯',
          html: '<strong>Bold &amp; <code>Highlighted</code> = Tested Facts:</strong> In concept cards, only exam-tested rules, formulas, and numbers are bolded or highlighted.'
        },
        {
          icon: '💬',
          html: '<strong>Tap <span class="welcome-dotted-demo">Dotted Terms</span> Anywhere:</strong> Tap underlined slang or acronyms (like <em>SWR</em>, <em>PTT</em>, or <em>Field Day</em>) for instant definitions, analogies, and gear photos.'
        },
        {
          icon: '👀',
          html: '<strong>Read-Only &amp; Mid-Quiz Peek:</strong> Tap any node to <strong>Read Cards Only</strong> without quizzing, or tap <strong>📖 Cards</strong> mid-quiz for a quick refresher.'
        }
      ]
    },
    {
      eyebrow: 'Closed-Loop Practice · Step 4 of 5',
      title: 'Signal Checks, Cracked Nodes & Mock Exams',
      lead: 'Your practice exams and your Skill Path talk directly to each other so nothing slips through the cracks:',
      rows: [
        {
          icon: '📡',
          html: '<strong>Signal Check &amp; Boss Checkpoints:</strong> Quick 5–10 question tune-ups prioritize questions you previously missed or hesitated on (&gt;12 seconds).'
        },
        {
          icon: '📝',
          html: '<strong>2 Practice Exam Modes (Exams Tab):</strong> Take a <strong>Progress Checkpoint</strong> on only unlocked groups, or a <strong>Full 35-Question Practice Exam</strong> (26/35 to pass) with Smart Dual Scoring.'
        },
        {
          icon: '⚡',
          html: '<strong>Cracked Node Repair:</strong> Missing a Gold group on a Mock Exam marks that node <strong>Cracked</strong> on your Path so your next review repairs that exact weak spot.'
        }
      ]
    },
    {
      eyebrow: 'Reference & Sync · Step 5 of 5',
      title: 'Study Aids, Exam Checklist & Backup Codes',
      lead: 'Visit the Aids & Info tab anytime for interactive reference tools and one-tap cross-device progress transfer:',
      rows: [
        {
          icon: '🧮',
          html: '<strong>Visual Aids &amp; 106-Term Glossary:</strong> Exam-focused Band &amp; Power chart, live Ohm’s Law calculator + <strong>33-Q Math Drill</strong>, zoomable <strong>Figures T-1..T-3</strong>, and searchable A–Z Glossary.'
        },
        {
          icon: '🔄',
          html: '<strong>1-Tap <code>HAM1:</code> Backup Code:</strong> Progress saves automatically on this device—copy your compact backup code to save a snapshot or move between phone and computer.'
        },
        {
          icon: '❓',
          html: '<strong>Bring This Guide Back Anytime:</strong> Tap the <strong>?</strong> button in the top-right header (or in <em>Aids &amp; Info → Settings</em>) whenever you want a refresher.'
        }
      ]
    }
  ];

  let welcomeStep = 0;

  function openWelcomeModal(stepIdx = 0) {
    closeJargonPopover();
    welcomeStep = Math.max(0, Math.min(WELCOME_SLIDES.length - 1, stepIdx));
    renderWelcomeModal();
    const dlg = document.getElementById('welcome-dialog');
    if (dlg && !dlg.open) dlg.showModal();
  }

  function renderWelcomeModal() {
    const dlg = document.getElementById('welcome-dialog');
    const body = document.getElementById('welcome-dialog-body');
    if (!dlg || !body) return;
    const idx = Math.max(0, Math.min(WELCOME_SLIDES.length - 1, welcomeStep));
    welcomeStep = idx;
    const slide = WELCOME_SLIDES[idx];
    const isLast = idx === WELCOME_SLIDES.length - 1;

    body.innerHTML = `
      <div class="dialog-head-row">
        <div>
          <div class="panel-eyebrow">${escHtml(slide.eyebrow)}</div>
          <h2 id="welcome-dialog-title" class="dialog-title">${escHtml(slide.title)}</h2>
        </div>
        <form method="dialog">
          <button value="close" class="icon-btn" aria-label="Close guide for now">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </form>
      </div>
      <div style="max-height:58dvh;overflow-y:auto;display:flex;flex-direction:column;gap:0.7rem;padding-right:0.1rem">
        <p class="welcome-lead">${escHtml(slide.lead)}</p>
        <div class="welcome-feature-list">
          ${slide.rows.map((r) => `
            <div class="welcome-feature-row">
              <div class="welcome-feature-icon" aria-hidden="true">${r.icon}</div>
              <div class="welcome-feature-text">${r.html}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="welcome-dots" role="tablist" aria-label="Guide steps">
        ${WELCOME_SLIDES.map((_, i) => `
          <button type="button" class="welcome-dot-btn ${i === idx ? 'is-active' : ''}" data-welcome-step="${i}" aria-label="Go to step ${i + 1}" aria-current="${i === idx ? 'step' : 'false'}"></button>
        `).join('')}
      </div>
      <div style="display:flex;gap:0.55rem">
        ${idx > 0 ? `<button type="button" class="btn btn-secondary" data-action="welcome-prev">← Back</button>` : ''}
        <button type="button" class="btn btn-primary btn-block" data-action="${isLast ? 'welcome-close' : 'welcome-next'}">
          ${isLast ? 'Start Studying →' : `Next (${idx + 2}/${WELCOME_SLIDES.length}) →`}
        </button>
      </div>
      <div class="welcome-dismiss-bar">
        <label class="welcome-optout">
          <input type="checkbox" id="welcome-optout-cb" data-welcome-optout="1" ${state.hideWelcome ? 'checked' : ''}>
          <span>Don’t show again on startup</span>
        </label>
        ${!state.hideWelcome ? `
          <button type="button" class="welcome-skip-forever-btn" data-action="welcome-dismiss-forever">
            Don’t show again &amp; close
          </button>
        ` : ''}
      </div>
    `;
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
    const prog = document.getElementById('daily-progress');
    prog.setAttribute('value', String(ringPct));
    prog.style.setProperty('--value', String(ringPct));
    prog.setAttribute('aria-valuetext', `${mins} minutes studied today`);
    document.getElementById('daily-ring-label').textContent = `${mins}m`;
    const nToday = state.streak.todayNodes || 0;
    document.getElementById('goal-nodes-label').textContent =
      `${nToday} node${nToday === 1 ? '' : 's'}`;

    const navBadge = document.getElementById('cracked-nav-badge');
    if (crackedCount > 0) {
      navBadge.textContent = String(crackedCount);
      navBadge.hidden = false;
    } else {
      navBadge.hidden = true;
    }
  }

  // Reusable Visual Helpers (Exam-Focused & Contextually Timed)
  function renderBandPrivilegesHtml(includeOptionalFullChart = false) {
    return `
      <div class="band-list">
        <!-- 1. 10-Meter HF Band -->
        <div class="band-row">
          <div class="band-row-top">
            <span class="band-name">10-Meter Band — Your ONLY HF Voice Band</span>
            <span class="band-power">200 W PEP max</span>
          </div>
          <div class="slice-list">
            <div class="slice-row">
              <div>
                <div class="slice-freq">28.200 – 28.300 MHz</div>
                <div class="slice-desc">Automatic propagation beacons (one-way band-opening signals)</div>
              </div>
              <span class="mode-tag seg-cw">Beacons</span>
            </div>
            <div class="slice-row">
              <div>
                <div class="slice-freq">28.300 – 28.500 MHz</div>
                <div class="slice-desc">Technician SSB Phone (only HF voice slice for Techs!)</div>
              </div>
              <span class="mode-tag seg-ssb">SSB Voice</span>
            </div>
          </div>
          <p class="band-notes">Digital modes like <strong>FT8</strong> are also authorized on <code>10m</code>, <code>6m</code>, and <code>2m</code>.</p>
        </div>

        <!-- 2. VHF / UHF Landmarks & .0-.1 CW Rule -->
        <div class="band-row">
          <div class="band-row-top">
            <span class="band-name">6m, 2m &amp; 70cm — VHF / UHF Rules</span>
            <span class="band-power">1500 W PEP max</span>
          </div>
          <div class="slice-list">
            <div class="slice-row">
              <div>
                <div class="slice-freq">50.0–50.1 &amp; 144.0–144.1 MHz</div>
                <div class="slice-desc">Bottom 100 kHz of 6m &amp; 2m are reserved strictly for Morse code</div>
              </div>
              <span class="mode-tag seg-cw">CW Only</span>
            </div>
            <div class="slice-row">
              <div>
                <div class="slice-freq">52.525 MHz → 6m · 146.520 MHz → 2m</div>
                <div class="slice-desc">Exam band-matching landmarks (<code>146.520 MHz</code> = 2m FM simplex calling)</div>
              </div>
              <span class="mode-tag seg-all">FM / All Modes</span>
            </div>
            <div class="slice-row">
              <div>
                <div class="slice-freq">All Bands Above 50 MHz</div>
                <div class="slice-desc">SSB voice allowed in at least some segment; any Tech can contact the <strong>ISS</strong> on VHF</div>
              </div>
              <span class="mode-tag seg-all">VHF / Space</span>
            </div>
          </div>
          <p class="band-notes">Repeater offsets: <code>±600 kHz</code> on 2m · <code>±5 MHz</code> on 70cm. Stay off exact band edges, and yield to primary users on secondary bands.</p>
        </div>

        <!-- 3. Two-Number Power Comparison -->
        <div class="quick-tiles">
          <div class="quick-tile">
            <div class="quick-tile-val">200 Watts PEP</div>
            <div class="quick-tile-lbl">Max Tech power in <strong>HF segments</strong> (below 30 MHz)</div>
          </div>
          <div class="quick-tile">
            <div class="quick-tile-val">1500 Watts PEP</div>
            <div class="quick-tile-lbl">Max Tech power <strong>above 30 MHz</strong> (VHF / UHF)</div>
          </div>
        </div>
      </div>

      ${includeOptionalFullChart ? `
        <details class="extra-ref-drawer">
          <summary>Optional: Full Post-License Technician Band Chart (Not Tested on Exam)</summary>
          <div style="margin-top:0.65rem;font-size:0.8rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:0.38rem">
            <div><strong>80m / 40m / 15m HF CW-only:</strong> <code>3.525–3.600</code>, <code>7.025–7.125</code>, and <code>21.025–21.200 MHz</code> (200W PEP).</div>
            <div><strong>10m RTTY / Data &amp; CW:</strong> <code>28.000–28.300 MHz</code> (200W PEP).</div>
            <div><strong>6m &amp; 2m full spans:</strong> <code>50–54 MHz</code> and <code>144–148 MHz</code> (all modes above <code>.1 MHz</code>).</div>
            <div><strong>1.25m &amp; 70cm spans:</strong> <code>222–225 MHz</code> (plus <code>219–220 MHz</code> 50W fixed digital) and <code>420–450 MHz</code> (<code>446.000 MHz</code> simplex calling).</div>
          </div>
        </details>
      ` : ''}
    `;
  }

  // Interactive Mini-Widget State & Renderer (Used Inside Walkthrough Cards)
  const widgetState = {
    repeaterMode: 'repeater', // 'simplex' | 'repeater' | 'reverse'
    dutyPct: 50,
    switchType: 'spst', // 'spst' | 'spdt'
    spstClosed: false,
    spdtPos: 'A',
    waveMhz: 146.52
  };

  function renderSingleSchematicWidget(figKey) {
    const chipsByFig = {
      'T-1': [
        ['#1', 'Resistor'], ['#2', 'Transistor (controls current)'], ['#3', 'Lamp'], ['#4', 'Battery']
      ],
      'T-2': [
        ['#3', 'SPST Switch'], ['#4', 'Transformer'], ['#6', 'Capacitor'], ['#8', 'LED'], ['#9', 'Variable Resistor']
      ],
      'T-3': [
        ['#3', 'Variable Inductor'], ['#4', 'Antenna']
      ]
    };
    const chips = chipsByFig[figKey] || [];
    return `
      <div class="panel-card" style="margin:0.2rem 0 0">
        <div class="panel-eyebrow" style="margin-bottom:0.4rem">Exam Diagram — Figure ${escHtml(figKey)} (Only Highlighted Numbers Tested)</div>
        <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="${escHtml(figKey)}">
          ${DATA.figures[figKey] || ''}
          <div class="callout-chips">
            ${chips.map(([num, lbl]) => `<span class="callout-chip"><strong>${escHtml(num)}</strong> ${escHtml(lbl)}</span>`).join('')}
          </div>
          <div class="zoom-hint">🔍 Tap diagram to inspect full screen</div>
        </button>
      </div>
    `;
  }

  function renderMiniAidForBriefing(aid) {
    if (!aid) return '';
    if (aid === 'repeater-sim') {
      const m = widgetState.repeaterMode;
      const rx = m === 'simplex' ? '146.520 MHz' : m === 'repeater' ? '146.940 MHz (Repeater Out)' : '147.540 MHz (Repeater In!)';
      const tx = m === 'simplex' ? '146.520 MHz' : m === 'repeater' ? '147.540 MHz (+600 kHz Offset)' : '146.940 MHz';
      const note = m === 'simplex'
        ? 'Simplex: Both radios transmit & receive directly on the exact same frequency (no hilltop relay).'
        : m === 'repeater'
          ? 'Repeater (+600 kHz offset): When you hold PTT, your rig automatically shifts +600 kHz up to feed the repeater’s input!'
          : 'Reverse Button Held: You are listening directly on the repeater’s input—if your friend still sounds clear, you can switch to simplex!';
      return `
        <div class="mini-widget-box">
          <div class="panel-eyebrow">Interactive Try-It: Simplex vs. Repeater Offset &amp; Reverse</div>
          <div class="widget-pill-row">
            <button type="button" class="widget-pill-btn ${m === 'simplex' ? 'is-active' : ''}" data-widget-rep="simplex">Simplex (146.520)</button>
            <button type="button" class="widget-pill-btn ${m === 'repeater' ? 'is-active' : ''}" data-widget-rep="repeater">2m Repeater (+600 kHz)</button>
            <button type="button" class="widget-pill-btn ${m === 'reverse' ? 'is-active' : ''}" data-widget-rep="reverse">Hold [Reverse] Button</button>
          </div>
          <div class="quick-tiles">
            <div class="quick-tile">
              <div class="quick-tile-val">${escHtml(rx)}</div>
              <div class="quick-tile-lbl">Your Radio Listens (RX)</div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">${escHtml(tx)}</div>
              <div class="quick-tile-lbl">Your Radio Transmits (TX)</div>
            </div>
          </div>
          <p class="band-notes" style="margin:0">${escHtml(note)}</p>
        </div>
      `;
    }
    if (aid === 'duty-slider') {
      const d = widgetState.dutyPct;
      const mult = (100 / d).toFixed(d === 50 || d === 100 || d === 25 || d === 20 ? 0 : 1);
      return `
        <div class="mini-widget-box">
          <div class="panel-eyebrow">Interactive Try-It: Transmit Duty Cycle vs. Allowable RF Exposure</div>
          <div class="widget-pill-row">
            <button type="button" class="widget-pill-btn ${d === 100 ? 'is-active' : ''}" data-widget-duty="100">100% (Continuous FM)</button>
            <button type="button" class="widget-pill-btn ${d === 50 ? 'is-active' : ''}" data-widget-duty="50">50% (Half TX / Half RX)</button>
            <button type="button" class="widget-pill-btn ${d === 25 ? 'is-active' : ''}" data-widget-duty="25">25% (Casual SSB Chat)</button>
          </div>
          <div class="quick-tiles">
            <div class="quick-tile">
              <div class="quick-tile-val">${d}% TX Time</div>
              <div class="quick-tile-lbl">Active transmit duty cycle</div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">${mult}× Power Density</div>
              <div class="quick-tile-lbl">Allowed vs. 100% continuous TX</div>
            </div>
          </div>
          <p class="band-notes" style="margin:0">Notice the exam rule: dropping duty cycle from <code>100%</code> to <code>50%</code> doubles (<code>2×</code>) allowable power density!</p>
        </div>
      `;
    }
    if (aid === 'switch-flipper') {
      const isSpst = widgetState.switchType === 'spst';
      const closed = widgetState.spstClosed;
      const pos = widgetState.spdtPos;
      return `
        <div class="mini-widget-box">
          <div class="panel-eyebrow">Interactive Bench: Tap to Flip SPST vs. SPDT Switches</div>
          <div class="widget-pill-row">
            <button type="button" class="widget-pill-btn ${isSpst ? 'is-active' : ''}" data-widget-swtype="spst">SPST (Fig T-2 #3)</button>
            <button type="button" class="widget-pill-btn ${!isSpst ? 'is-active' : ''}" data-widget-swtype="spdt">SPDT (1 Input → 2 Outputs)</button>
            <button type="button" class="btn btn-secondary" style="padding:0.32rem 0.68rem;font-size:0.76rem;margin-left:auto" data-widget-flip="1">
              ${isSpst ? (closed ? '⚡ Open Switch' : '⚡ Close Switch') : `⚡ Flip to Circuit ${pos === 'A' ? 'B' : 'A'}`}
            </button>
          </div>
          ${isSpst ? `
            <svg viewBox="0 0 420 105" class="teaching-svg" role="img" aria-label="Interactive SPST switch">
              <line x1="35" y1="58" x2="148" y2="58" stroke="currentColor" stroke-width="3"/>
              <circle cx="154" cy="58" r="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
              <line x1="160" y1="${closed ? 58 : 55}" x2="218" y2="${closed ? 58 : 30}" stroke="var(--gold)" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="224" cy="58" r="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
              <line x1="230" y1="58" x2="325" y2="58" stroke="currentColor" stroke-width="3"/>
              <circle cx="348" cy="58" r="18" fill="${closed ? 'var(--gold)' : 'var(--bg-surface)'}" stroke="currentColor" stroke-width="2.5"/>
              <text x="348" y="63" text-anchor="middle" font-size="11" font-weight="800" fill="${closed ? '#451a03' : 'var(--text-secondary)'}">${closed ? 'ON' : 'OFF'}</text>
              <text x="210" y="94" text-anchor="middle" font-size="11" fill="var(--text-secondary)">Single-Pole Single-Throw (SPST) — exact symbol of Component #3 in Figure T-2!</text>
            </svg>
          ` : `
            <svg viewBox="0 0 420 120" class="teaching-svg" role="img" aria-label="Interactive SPDT switch">
              <line x1="35" y1="60" x2="142" y2="60" stroke="currentColor" stroke-width="3"/>
              <circle cx="148" cy="60" r="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
              <line x1="154" y1="60" x2="218" y2="${pos === 'A' ? 34 : 86}" stroke="var(--gold)" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="224" cy="34" r="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
              <circle cx="224" cy="86" r="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
              <line x1="230" y1="34" x2="318" y2="34" stroke="currentColor" stroke-width="2.5"/>
              <line x1="230" y1="86" x2="318" y2="86" stroke="currentColor" stroke-width="2.5"/>
              <rect x="318" y="19" width="76" height="28" rx="6" fill="${pos === 'A' ? 'var(--success-soft)' : 'var(--bg-surface)'}" stroke="${pos === 'A' ? 'var(--success)' : 'var(--border-strong)'}"/>
              <text x="356" y="37" text-anchor="middle" font-size="10.5" font-weight="800" fill="currentColor">Antenna A</text>
              <rect x="318" y="71" width="76" height="28" rx="6" fill="${pos === 'B' ? 'var(--success-soft)' : 'var(--bg-surface)'}" stroke="${pos === 'B' ? 'var(--success)' : 'var(--border-strong)'}"/>
              <text x="356" y="89" text-anchor="middle" font-size="10.5" font-weight="800" fill="currentColor">Dummy Load B</text>
            </svg>
          `}
        </div>
      `;
    }
    if (aid === 'wavelength-slider') {
      const mhz = widgetState.waveMhz;
      const meters = 300 / mhz;
      const bandLbl = mhz < 30 ? '10m HF Band' : mhz < 60 ? '6m VHF Band' : mhz < 200 ? '2m VHF Band' : '70cm UHF Band';
      const cycles = mhz < 35 ? 2 : mhz < 70 ? 3 : mhz < 200 ? 6 : 11;
      let pathD = 'M 24 44';
      const segW = 372 / (cycles * 2);
      for (let i = 0; i < cycles * 2; i++) {
        const x1 = 24 + i * segW + segW / 2;
        const y1 = i % 2 === 0 ? 12 : 76;
        const x2 = 24 + (i + 1) * segW;
        pathD += ` Q ${x1.toFixed(1)} ${y1} ${x2.toFixed(1)} 44`;
      }
      return `
        <div class="mini-widget-box">
          <div class="panel-eyebrow">Interactive 300 Rule: Pick a Band to Watch Wavelength Change</div>
          <div class="widget-pill-row">
            <button type="button" class="widget-pill-btn ${mhz === 28.4 ? 'is-active' : ''}" data-widget-wave="28.4">28.4 MHz (10m)</button>
            <button type="button" class="widget-pill-btn ${mhz === 50.1 ? 'is-active' : ''}" data-widget-wave="50.1">50.1 MHz (6m)</button>
            <button type="button" class="widget-pill-btn ${mhz === 146.52 ? 'is-active' : ''}" data-widget-wave="146.52">146.52 MHz (2m)</button>
            <button type="button" class="widget-pill-btn ${mhz === 440 ? 'is-active' : ''}" data-widget-wave="440">440 MHz (70cm)</button>
          </div>
          <svg viewBox="0 0 420 88" class="teaching-svg" role="img" aria-label="Dynamic wavelength visualization">
            <line x1="18" y1="44" x2="402" y2="44" stroke="var(--border-strong)" stroke-width="1.5"/>
            <path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="3"/>
          </svg>
          <div class="formula-readout" style="text-align:center">
            300 ÷ ${mhz} MHz = ${meters.toFixed(2)} meters (${escHtml(bandLbl)})
          </div>
        </div>
      `;
    }
    if (aid === 'fig-t1') return renderSingleSchematicWidget('T-1');
    if (aid === 'fig-t2' || aid === 'fig-t2-switch') return renderSingleSchematicWidget('T-2');
    if (aid === 'fig-t3') return renderSingleSchematicWidget('T-3');
    if (aid === 'repeater-basics') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow" style="margin-bottom:0.5rem">3 Starter Numbers in Group T2A</div>
          <div class="quick-tiles">
            <div class="quick-tile">
              <div class="quick-tile-val">146.520 MHz</div>
              <div class="quick-tile-lbl">National 2-meter FM simplex calling channel</div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">±600 kHz</div>
              <div class="quick-tile-lbl">Standard repeater offset on 2 meters</div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">±5 MHz</div>
              <div class="quick-tile-lbl">Standard repeater offset on 70 centimeters</div>
            </div>
          </div>
        </div>
      `;
    }
    if (aid === 'band-privileges' || aid === 'band-map') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow" style="margin-bottom:0.5rem">Exam-Tested Band &amp; Power Summary</div>
          ${renderBandPrivilegesHtml(false)}
        </div>
      `;
    }
    if (aid === 'power-circle') {
      const powerReadout = powerSolveTarget === 'PI'
        ? 'I = P / E (Amps = Watts ÷ Volts)'
        : powerSolveTarget === 'PE'
          ? 'E = P / I (Volts = Watts ÷ Amps)'
          : 'P = I × E (Watts = Amps × Volts)';
      return `
        <div class="mini-widget-box" style="align-items:center;text-align:center">
          <div class="panel-eyebrow">Interactive Cover-Up Circle: Tap P, I, or E</div>
          <div class="t-circle" role="group" aria-label="DC Power interactive circle">
            <div class="t-top">
              <button type="button" class="t-cell ${powerSolveTarget === 'P' ? 'is-selected' : ''}" data-power-target="P">P<small>Watts</small></button>
            </div>
            <div class="t-bottom">
              <button type="button" class="t-cell ${powerSolveTarget === 'PI' ? 'is-selected' : ''}" data-power-target="PI">I<small>Amps</small></button>
              <button type="button" class="t-cell ${powerSolveTarget === 'PE' ? 'is-selected' : ''}" data-power-target="PE">E<small>Volts</small></button>
            </div>
          </div>
          <div class="formula-readout">${escHtml(powerReadout)}</div>
        </div>
      `;
    }
    if (aid === 'ohms-circle' || aid === 'ohms-triangle') {
      const ohmsReadout = mathSolveTarget === 'I'
        ? 'I = E / R (Amps = Volts ÷ Ohms)'
        : mathSolveTarget === 'R'
          ? 'R = E / I (Ohms = Volts ÷ Amps)'
          : 'E = I × R (Volts = Amps × Ohms)';
      return `
        <div class="mini-widget-box" style="align-items:center;text-align:center">
          <div class="panel-eyebrow">Interactive Cover-Up Circle: Tap E, I, or R</div>
          <div class="t-circle" role="group" aria-label="Ohm's Law interactive circle">
            <div class="t-top">
              <button type="button" class="t-cell ${mathSolveTarget === 'E' ? 'is-selected' : ''}" data-math-target="E">E<small>Volts</small></button>
            </div>
            <div class="t-bottom">
              <button type="button" class="t-cell ${mathSolveTarget === 'I' ? 'is-selected' : ''}" data-math-target="I">I<small>Amps</small></button>
              <button type="button" class="t-cell ${mathSolveTarget === 'R' ? 'is-selected' : ''}" data-math-target="R">R<small>Ohms</small></button>
            </div>
          </div>
          <div class="formula-readout">${escHtml(ohmsReadout)}</div>
        </div>
      `;
    }
    if (aid === 'metric-db') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow" style="margin-bottom:0.5rem">Only Conversions &amp; dB Steps Tested</div>
          <div class="quick-tiles">
            <div class="quick-tile">
              <div class="quick-tile-val">Slide 3 Places</div>
              <div class="quick-tile-lbl"><code>mA ⇄ A</code> · <code>mW ⇄ W</code> · <code>Hz ⇄ kHz ⇄ MHz ⇄ GHz</code></div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">1,000,000 pF</div>
              <div class="quick-tile-lbl">Equals <code>1 µF</code> (micro = millionth)</div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">+3 / -6 / +10 dB</div>
              <div class="quick-tile-lbl"><code>2×</code> power · <code>¼</code> power · <code>10×</code> power</div>
            </div>
          </div>
        </div>
      `;
    }
    if (aid === 'wavelength') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow" style="margin-bottom:0.45rem">The 300 Rule &amp; Spectrum Steps</div>
          <div class="quick-tiles">
            <div class="quick-tile">
              <div class="quick-tile-val">m = 300 / MHz</div>
              <div class="quick-tile-lbl">Higher frequency = shorter wavelength (all move at <code>300,000,000 m/s</code>)</div>
            </div>
            <div class="quick-tile">
              <div class="quick-tile-val">3 · 30 · 300 MHz</div>
              <div class="quick-tile-lbl"><strong>HF:</strong> 3–30 · <strong>VHF:</strong> 30–300 · <strong>UHF:</strong> 300–3000 MHz</div>
            </div>
          </div>
        </div>
      `;
    }
    if (aid === 'bandwidth-ladder') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow">Signal Widths from Narrowest to Widest</div>
          <div class="bw-ladder">
            <div class="bw-row"><strong>CW (Morse)</strong><div class="bw-track"><div class="bw-fill" style="width:6%"></div></div><code>150 Hz</code></div>
            <div class="bw-row"><strong>SSB Voice</strong><div class="bw-track"><div class="bw-fill" style="width:24%"></div></div><code>3 kHz</code></div>
            <div class="bw-row"><strong>FM Repeater</strong><div class="bw-track"><div class="bw-fill" style="width:52%"></div></div><code>10–15 kHz</code></div>
            <div class="bw-row"><strong>Fast-Scan TV</strong><div class="bw-track"><div class="bw-fill" style="width:100%"></div></div><code>~6 MHz</code></div>
          </div>
        </div>
      `;
    }
    if (aid === 'fig-t2-switch') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow">Preview for Question T6A09 — Component #3 in Figure T-2</div>
          <button type="button" class="schematic-box btn-block" data-zoom-fig="T-2">
            ${DATA.figures['T-2']}
            <div class="zoom-hint">Look at #3 (top-left): 1 wire in, 1 open blade = Single-Pole Single-Throw (SPST) switch</div>
          </button>
        </div>
      `;
    }
    if (aid === 'figures') {
      return `
        <div class="panel-card" style="margin-top:0.2rem">
          <div class="panel-eyebrow" style="margin-bottom:0.45rem">Tap Any Diagram to Zoom — Only Highlighted Numbers Are Tested!</div>
          <div style="display:flex;flex-direction:column;gap:0.65rem">
            <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="T-1">
              ${DATA.figures['T-1']}
              <div class="callout-chips">
                <span class="callout-chip"><strong>#1</strong> Resistor</span>
                <span class="callout-chip"><strong>#2</strong> Transistor</span>
                <span class="callout-chip"><strong>#3</strong> Lamp</span>
                <span class="callout-chip"><strong>#4</strong> Battery</span>
              </div>
            </button>
            <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="T-2">
              ${DATA.figures['T-2']}
              <div class="callout-chips">
                <span class="callout-chip"><strong>#3</strong> SPST Switch</span>
                <span class="callout-chip"><strong>#4</strong> Transformer</span>
                <span class="callout-chip"><strong>#6</strong> Capacitor</span>
                <span class="callout-chip"><strong>#8</strong> LED</span>
                <span class="callout-chip"><strong>#9</strong> Variable Resistor</span>
              </div>
            </button>
            <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="T-3">
              ${DATA.figures['T-3']}
              <div class="callout-chips">
                <span class="callout-chip"><strong>#3</strong> Variable Inductor</span>
                <span class="callout-chip"><strong>#4</strong> Antenna</span>
              </div>
            </button>
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

    // Signal Check & Welcome Banner
    if (signalQueue.length === 0) {
      const firstGroup = ORDERED_GROUPS[0];
      const firstBrief = DATA.briefings[firstGroup];
      signalSlot.innerHTML = `
        <div class="signal-card">
          <div class="signal-top">
            <div>
              <div class="signal-eyebrow">35-Node Guided Path · 2026–2030 Exam Pool</div>
              <h2 class="signal-title">Welcome to Watt a Ham</h2>
            </div>
          </div>
          <p class="signal-desc">
            Master all 409 public-domain Technician pool questions at your own pace—knock out one 8-minute node whenever you have a spare moment, or power through multiple chapters in a sitting.
          </p>
          <button type="button" class="btn btn-primary btn-block" data-open-node="${escHtml(firstGroup)}" data-direct-start="1">
            Start Node 1: ${escHtml(firstGroup)} — ${escHtml(firstBrief ? firstBrief.title : 'Operating')}
          </button>
        </div>
      `;
    } else {
      const doneToday = state.streak.todayReviewDone && crackedCount === 0;
      signalSlot.innerHTML = `
        <div class="signal-card ${crackedCount > 0 ? 'has-cracks' : ''}">
          <div class="signal-top">
            <div>
              <div class="signal-eyebrow">
                ${crackedCount > 0 ? `⚡ ${crackedCount} Cracked Node${crackedCount > 1 ? 's' : ''} Need Tune-Up` : doneToday ? '✓ Warm-Up Complete Today' : 'Quick 3-Minute Warm-Up'}
              </div>
              <h2 class="signal-title">Signal Check Review (${signalQueue.length} Qs)</h2>
            </div>
          </div>
          <p class="signal-desc">
            ${crackedCount > 0
              ? 'Targets missed exam and review questions first so cracked nodes turn solid Gold again.'
              : doneToday
                ? 'You have already completed a Signal Check today—run another quick refresher anytime you like.'
                : 'A fast refresher pulled from nodes you have already studied, prioritizing tricky and hesitated questions.'}
          </p>
          <button type="button" class="btn ${crackedCount > 0 ? 'btn-gold' : doneToday ? 'btn-secondary' : 'btn-primary'} btn-block" data-action="start-signal-check">
            ${doneToday ? 'Run Extra Signal Check' : 'Start 3-Min Signal Check'}
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

    // Chapter 13: Final Readiness Milestone (3 Practice Exams >= 30/35)
    const highPasses = state.exams.filter((e) => e.mode === 'mock35' && e.score >= 30).length;
    const certDone = highPasses >= 3 && goldCount === 35;

    const finalBossHtml = `
      <section class="final-boss-card" aria-label="Chapter 13 Final Readiness Milestone">
        <div class="panel-eyebrow" style="color:var(--gold)">Chapter 13 · Final Readiness Milestone</div>
        <h3>Technician Exam Readiness Milestone</h3>
        <div class="cert-stars" aria-label="${Math.min(3, highPasses)} of 3 high-pass practice exams earned">
          <span class="cert-star ${highPasses >= 1 ? 'earned' : ''}">⭐</span>
          <span class="cert-star ${highPasses >= 2 ? 'earned' : ''}">⭐</span>
          <span class="cert-star ${highPasses >= 3 ? 'earned' : ''}">⭐</span>
        </div>
        <p class="signal-desc">
          ${certDone
            ? '🎉 EXAM-READY MILESTONE! You have mastered all 35 groups and scored 30+/35 (85%+) on 3 Full 35-Question Practice Exams. Go claim your call sign!'
            : `Complete all 35 Path nodes (${goldCount}/35 Gold) and score 30+/35 (85%+) on 3 Full 35-Question Practice Exams — ${Math.min(3, highPasses)}/3 completed.`}
        </p>
        <button type="button" class="btn btn-gold btn-block" data-action="start-mock35">
          Launch Full 35-Question Practice Exam
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
          <div class="panel-eyebrow">Group ${escHtml(group)} · ${qs.length} Pool Questions</div>
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
            Unlock &amp; Start Full Lesson (${(brief.cards || []).length} Cards + Quiz)
          </button>
          <button type="button" class="btn btn-secondary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing" data-read-only="1">
            📖 Read Walkthrough Cards Only
          </button>
        ` : isGoldOrCracked ? `
          <button type="button" class="btn ${node.cracked ? 'btn-gold' : 'btn-primary'} btn-block" data-modal-start="${escHtml(group)}" data-start-stage="challenge" autofocus>
            ${node.cracked ? 'Repair Cracked Node (Quiz Only)' : 'Quick Practice Quiz (Skip Cards)'}
          </button>
          <button type="button" class="btn btn-secondary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing" data-read-only="1">
            📖 Read Walkthrough Cards Only (${(brief.cards || []).length} Cards)
          </button>
          <button type="button" class="btn btn-secondary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing">
            Full 3-Stage Lesson (Cards + Flash-Pass + Quiz)
          </button>
        ` : `
          <button type="button" class="btn btn-primary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing" autofocus>
            Start Guided Lesson (${(brief.cards || []).length} Cards + Quiz)
          </button>
          <button type="button" class="btn btn-secondary btn-block" data-modal-start="${escHtml(group)}" data-start-stage="briefing" data-read-only="1">
            📖 Read Walkthrough Cards Only
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
                    ${ex.mode === 'mock35' ? 'Full 35-Q Practice Exam' : `Progress Checkpoint (${ex.total} Qs)`}
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
            <div class="panel-eyebrow">Exam-Format Practice Test</div>
            <h2 class="panel-title">Full 35-Question Practice Exam</h2>
          </div>
          <span class="badge-pill">Pass: 26/35 (74%)</span>
        </div>
        <p class="panel-desc">
          Pulls 1 random question from each of the 35 NCVEC pool groups (<code>T1A</code>–<code>T0C</code>). No mid-test hints, supports flagging questions, and reports <strong>both</strong> your Raw Score and your <strong>Studied-Nodes Score</strong> (${completedGroups.length}/35 Gold so far).
        </p>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-box-val">${state.exams.filter((e) => e.mode === 'mock35').length}</div>
            <div class="stat-box-lbl">Practice Exams Taken</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${highPasses}/3</div>
            <div class="stat-box-lbl">85%+ Readiness Stars</div>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-block" data-action="start-mock35">
          Start Full 35-Question Practice Exam
        </button>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-eyebrow">5–8 Minute Mid-Path Check</div>
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
  let powerSolveTarget = 'P';

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

    const ohmsReadout = mathSolveTarget === 'I'
      ? 'I = E / R (Amps = Volts ÷ Ohms)'
      : mathSolveTarget === 'R'
        ? 'R = E / I (Ohms = Volts ÷ Amps)'
        : 'E = I × R (Volts = Amps × Ohms)';

    const powerReadout = powerSolveTarget === 'PI'
      ? 'I = P / E (Amps = Watts ÷ Volts)'
      : powerSolveTarget === 'PE'
        ? 'E = P / I (Volts = Watts ÷ Amps)'
        : 'P = I × E (Watts = Amps × Volts)';

    container.innerHTML = `
      <!-- 1. Interactive Math Sandbox & Math Drill -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-eyebrow">Subelements T5 &amp; T3</div>
            <h2 class="panel-title">Interactive Formula Circles &amp; Math Sandbox</h2>
          </div>
          <span class="badge-pill">${mathCount} Math Qs</span>
        </div>
        <p class="panel-desc">
          Tap any letter inside either circle to cover it up and reveal the exact exam formula, or test live numbers below.
        </p>

        <div class="formula-triangles">
          <div class="triangle-card">
            <strong>Ohm's Law Circle (Tap E, I, or R)</strong>
            <div class="t-circle" role="group" aria-label="Ohm's Law interactive circle">
              <div class="t-top">
                <button type="button" class="t-cell ${mathSolveTarget === 'E' ? 'is-selected' : ''}" data-math-target="E">E<small>Volts</small></button>
              </div>
              <div class="t-bottom">
                <button type="button" class="t-cell ${mathSolveTarget === 'I' ? 'is-selected' : ''}" data-math-target="I">I<small>Amps</small></button>
                <button type="button" class="t-cell ${mathSolveTarget === 'R' ? 'is-selected' : ''}" data-math-target="R">R<small>Ohms</small></button>
              </div>
            </div>
            <div id="ohms-formula-box" class="formula-readout">${escHtml(ohmsReadout)}</div>
          </div>

          <div class="triangle-card">
            <strong>DC Power Circle (Tap P, I, or E)</strong>
            <div class="t-circle" role="group" aria-label="DC Power interactive circle">
              <div class="t-top">
                <button type="button" class="t-cell ${powerSolveTarget === 'P' ? 'is-selected' : ''}" data-power-target="P">P<small>Watts</small></button>
              </div>
              <div class="t-bottom">
                <button type="button" class="t-cell ${powerSolveTarget === 'PI' ? 'is-selected' : ''}" data-power-target="PI">I<small>Amps</small></button>
                <button type="button" class="t-cell ${powerSolveTarget === 'PE' ? 'is-selected' : ''}" data-power-target="PE">E<small>Volts</small></button>
              </div>
            </div>
            <div class="formula-readout">${escHtml(powerReadout)}</div>
          </div>
        </div>

        <div class="quick-tiles" style="margin-bottom:0.85rem">
          <div class="quick-tile">
            <div class="quick-tile-val">m = 300 / MHz</div>
            <div class="quick-tile-lbl">Wavelength in meters (<code>MHz = 300 / m</code>)</div>
          </div>
          <div class="quick-tile">
            <div class="quick-tile-val">+3 / -6 / +10 dB</div>
            <div class="quick-tile-lbl"><code>2×</code> power · <code>¼</code> power · <code>10×</code> power</div>
          </div>
          <div class="quick-tile">
            <div class="quick-tile-val">Slide 3 Places</div>
            <div class="quick-tile-lbl"><code>mA ⇄ A</code> · <code>kHz ⇄ MHz ⇄ GHz</code> (<code>10⁶ pF = 1 µF</code>)</div>
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

      <!-- 2. Exam-Focused Technician Band & Privilege Guide -->
      <div class="panel-card">
        <div class="panel-eyebrow">Subelements T1B &amp; T2A</div>
        <h2 class="panel-title" style="margin-bottom:0.35rem">Exam-Focused Band &amp; Privilege Guide</h2>
        <p class="panel-desc">
          Trimmed strictly to the frequencies, mode rules, and power caps actually tested on the 2026–2030 Element 2 exam.
        </p>
        ${renderBandPrivilegesHtml(true)}
      </div>

      <!-- 3. Exam Circuit Schematics Reference (Tested Callouts Only) -->
      <div class="panel-card">
        <div class="panel-eyebrow">Subelements T6A, T6C &amp; T6D</div>
        <h2 class="panel-title" style="margin-bottom:0.35rem">Exam Circuit Schematics (Tested Callouts Only)</h2>
        <p class="panel-desc">Only 11 numbered symbols across all 3 diagrams are ever asked on the exam—tap any schematic to zoom full-screen.</p>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="T-1">
            ${DATA.figures['T-1']}
            <div class="callout-chips">
              <span class="callout-chip"><strong>#1</strong> Resistor</span>
              <span class="callout-chip"><strong>#2</strong> Transistor (controls current)</span>
              <span class="callout-chip"><strong>#3</strong> Lamp</span>
              <span class="callout-chip"><strong>#4</strong> Battery</span>
            </div>
          </button>
          <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="T-2">
            ${DATA.figures['T-2']}
            <div class="callout-chips">
              <span class="callout-chip"><strong>#3</strong> SPST Switch</span>
              <span class="callout-chip"><strong>#4</strong> Transformer</span>
              <span class="callout-chip"><strong>#6</strong> Capacitor</span>
              <span class="callout-chip"><strong>#8</strong> LED</span>
              <span class="callout-chip"><strong>#9</strong> Variable Resistor</span>
            </div>
          </button>
          <button type="button" class="schematic-box btn-block" style="margin-top:0" data-zoom-fig="T-3">
            ${DATA.figures['T-3']}
            <div class="callout-chips">
              <span class="callout-chip"><strong>#3</strong> Variable Inductor</span>
              <span class="callout-chip"><strong>#4</strong> Antenna</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 4. Searchable A-Z Ham & Electronics Glossary -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-eyebrow">Plain-English Jargon Reference</div>
            <h2 class="panel-title">Searchable Ham &amp; Electronics Glossary</h2>
          </div>
          <span class="badge-pill">${Object.keys(GLOSSARY).length} Concepts</span>
        </div>
        <p class="panel-desc">
          Every dotted term inside lessons and Flash-Pass is tappable—or search any acronym, slang word, or circuit part right here.
        </p>
        <input id="glossary-search" type="search" class="glossary-search-input" value="${escHtml(glossaryQuery)}" placeholder="Search terms (e.g., SWR, rig, PTT, CTCSS, keyer, ULS...)" aria-label="Search ham radio glossary">
        <div id="glossary-list" class="glossary-scroll"></div>
      </div>

      <!-- 5. Exam Day Logistics Checklist -->
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
          Progress saves automatically in <code>localStorage</code>. Copy this compact code to save a backup in Notes or move your progress between desktop and phone.
        </p>
        <label for="backup-code-box" style="font-size:0.78rem;font-weight:700;color:var(--text-secondary)">Backup / Restore Code (<code>HAM1:...</code>)</label>
        <textarea id="backup-code-box" class="backup-textarea" spellcheck="false">${escHtml(backupCode)}</textarea>
        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;margin-bottom:1rem">
          <button type="button" class="btn btn-primary" data-action="copy-backup">Copy Progress Backup Code</button>
          <button type="button" class="btn btn-secondary" data-action="restore-backup">Restore Pasted Code</button>
        </div>

        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;padding-top:0.75rem;border-top:1px solid var(--border-subtle)">
          <button type="button" class="btn btn-secondary" data-action="open-welcome-guide">
            📖 How Watt a Ham Works
          </button>
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
        <p class="panel-desc" style="margin:0.85rem 0 0;font-size:0.76rem">
          Watt a Ham is an independent open-source study guide built on the public-domain 2026–2030 NCVEC Element 2 question pool and is not affiliated with, sponsored by, or endorsed by the FCC, NCVEC, ARRL, or any Volunteer Examiner Coordinator.
        </p>
      </div>
    `;

    bindLiveOhmCalculator();
    bindGlossarySearch();
  }

  let glossaryQuery = '';
  const SORTED_GLOSSARY_ENTRIES = Object.entries(GLOSSARY).sort((a, b) =>
    (a[1].term || '').localeCompare(b[1].term || '')
  );

  function renderGlossaryList(query) {
    const listEl = document.getElementById('glossary-list');
    if (!listEl) return;
    const q = (query || '').trim().toLowerCase();
    const matches = !q
      ? SORTED_GLOSSARY_ENTRIES
      : SORTED_GLOSSARY_ENTRIES.filter(([, entry]) => {
          if ((entry.term || '').toLowerCase().includes(q)) return true;
          if ((entry.expansion || '').toLowerCase().includes(q)) return true;
          if ((entry.category || '').toLowerCase().includes(q)) return true;
          if ((entry.definition || '').toLowerCase().includes(q)) return true;
          return (entry.aliases || []).some((al) => al.toLowerCase().includes(q));
        });

    if (!matches.length) {
      listEl.innerHTML = `<p class="panel-desc" style="margin:0.4rem 0">No glossary terms matched <strong>${escHtml(query)}</strong>.</p>`;
      return;
    }

    listEl.innerHTML = matches.map(([gKey, entry]) => {
      const localSeen = new Set([gKey]);
      const gPhoto = entry.photo && PHOTOS[entry.photo] ? PHOTOS[entry.photo] : null;
      return `
        <div class="glossary-item">
          <div class="glossary-item-head">
            <div>
              <strong style="font-size:0.95rem;color:var(--text-primary)">${escHtml(entry.term)}</strong>
              ${entry.expansion ? `<span style="font-size:0.78rem;color:var(--text-secondary);margin-left:0.35rem">— ${escHtml(entry.expansion)}</span>` : ''}
            </div>
            <span class="badge-pill">${escHtml(entry.category || 'Glossary')}</span>
          </div>
          <div class="glossary-item-body">
            ${gPhoto ? `
              <button type="button" class="glossary-thumb-btn" data-zoom-photo="${escHtml(entry.photo)}" aria-label="Enlarge photo of ${escHtml(gPhoto.title)}">
                <img class="glossary-thumb-img" src="${escHtml(gPhoto.src)}" width="${Number(gPhoto.width) || 640}" height="${Number(gPhoto.height) || 480}" loading="lazy" alt="${escHtml(gPhoto.title)}">
              </button>
            ` : ''}
            <div style="flex:1;min-width:0">
              <p style="font-size:0.85rem;line-height:1.46;color:var(--text-primary);margin:0.15rem 0 0">
                ${formatRichText(entry.definition, { linkJargon: true, seenTerms: localSeen, excludeKey: gKey })}
              </p>
              ${entry.analogy ? `
                <p style="font-size:0.79rem;line-height:1.42;color:var(--text-secondary);margin:0.35rem 0 0">
                  <em>Analogy:</em> ${formatRichText(entry.analogy, { linkJargon: true, seenTerms: localSeen, excludeKey: gKey })}
                </p>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function bindGlossarySearch() {
    const searchIn = document.getElementById('glossary-search');
    if (!searchIn) return;
    renderGlossaryList(glossaryQuery);
    searchIn.addEventListener('input', () => {
      glossaryQuery = searchIn.value;
      renderGlossaryList(glossaryQuery);
    });
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
    closeJargonPopover();
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
    closeJargonPopover();
    activeSession = null;
    document.getElementById('session-overlay').hidden = true;
    document.getElementById('app-shell').removeAttribute('inert');
    renderActiveTab();
  }

  // 1. Start 3-Stage Node Lesson (or Read-Only Walkthrough Handbook)
  function startNodeLesson(group, initialStage = 'briefing', opts = {}) {
    const { readOnly = false } = opts;
    const qs = Q_BY_GROUP.get(group) || [];
    const brief = DATA.briefings[group];
    if (!qs.length || !brief) return;

    if (!readOnly) {
      if (state.nodes[group].status === 'locked' || state.nodes[group].status === 'next') {
        state.nodes[group].status = 'in_progress';
      }
    }
    recordStudyActivity();
    saveState();

    activeSession = {
      kind: 'node',
      group,
      readOnly: Boolean(readOnly),
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

  // 3. Start Full 35-Q Practice Exam or Progress Checkpoint Exam
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

  function renderCardPhotosHtml(photoKeys) {
    if (!Array.isArray(photoKeys) || !photoKeys.length) return '';
    const valid = photoKeys.filter((k) => Boolean(PHOTOS[k]));
    if (!valid.length) return '';
    return `
      <div class="equip-photo-grid ${valid.length > 1 ? 'is-pair' : ''}">
        ${valid.map((k) => {
          const p = PHOTOS[k];
          return `
            <button type="button" class="equip-photo-card" data-zoom-photo="${escHtml(k)}" aria-label="Enlarge photo: ${escHtml(p.title)}">
              <img class="equip-photo-img" src="${escHtml(p.src)}" width="${Number(p.width) || 720}" height="${Number(p.height) || 540}" alt="${escHtml(p.title)}">
              <div class="equip-photo-body">
                <div class="equip-photo-title">${escHtml(p.title)}</div>
                <div class="equip-photo-cap">${escHtml(p.caption)}</div>
                <div class="equip-photo-meta">🔍 Tap to enlarge · ${escHtml(p.license)}</div>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  // Shared Walkthrough Card Renderer (Used by Stage 1 Lesson, Read-Only Mode & Mid-Quiz Peek)
  function renderWalkthroughCardHtml(group, cardIdx) {
    const brief = DATA.briefings[group];
    const cards = (brief && brief.cards) || [];
    const card = cards[cardIdx];
    if (!brief || !card) return '';

    const seenTerms = new Set();
    const isCheatsheet = card.kind === 'cheatsheet';
    const paragraphs = Array.isArray(card.paragraphs)
      ? card.paragraphs
      : (card.body ? [card.body] : []);
    const illusSvg = card.illustration && DATA.illustrations
      ? DATA.illustrations[card.illustration]
      : '';
    const photosHtml = renderCardPhotosHtml(card.photos);
    const widgetKey = card.widget || (!card.paragraphs && cardIdx === 0 ? brief.aid : null);

    return `
      <div class="briefing-card ${isCheatsheet ? 'cheatsheet-card' : ''}">
        <div class="panel-eyebrow">
          ${isCheatsheet
            ? `${escHtml(group)} · Exam Quick-Recap Cheat-Sheet`
            : `${escHtml(group)} · ${escHtml(brief.title)}`}
        </div>
        ${!isCheatsheet && cardIdx === 0 ? `
          <div class="exam-signal-note">
            <span>🎯 <strong>Bold</strong> &amp; <code>highlighted</code> facts are on the exam · Dotted words open definitions</span>
          </div>
        ` : ''}
        <h2 style="font-size:1.22rem">${formatRichText(card.heading)}</h2>
        ${paragraphs.length ? `
          <div class="walkthrough-prose">
            ${paragraphs.map((p) => `<p>${formatRichText(p, { linkJargon: true, seenTerms })}</p>`).join('')}
          </div>
        ` : ''}
        ${illusSvg ? `
          <div class="teaching-fig-frame">
            ${illusSvg}
          </div>
        ` : ''}
        ${photosHtml}
        ${card.bullets && card.bullets.length ? `
          <ul class="briefing-bullets">
            ${card.bullets.map((b) => `<li>${formatRichText(b, { linkJargon: true, seenTerms })}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      ${widgetKey ? renderMiniAidForBriefing(widgetKey) : ''}
      <div class="briefing-dots" aria-hidden="true">
        ${cards.map((_, i) => `<span class="b-dot ${i === cardIdx ? 'is-active' : ''}"></span>`).join('')}
      </div>
    `;
  }

  // Mid-Quiz Walkthrough Cards Peek Modal
  const peekState = { group: null, cardIdx: 0 };

  function openCardsPeekModal(group) {
    if (!DATA.briefings[group]) return;
    closeJargonPopover();
    peekState.group = group;
    peekState.cardIdx = 0;
    renderCardsPeekModal();
    const dlg = document.getElementById('cards-peek-dialog');
    if (dlg && !dlg.open) dlg.showModal();
  }

  function renderCardsPeekModal() {
    const dlg = document.getElementById('cards-peek-dialog');
    const body = document.getElementById('cards-peek-body');
    const brief = DATA.briefings[peekState.group];
    if (!dlg || !body || !brief) return;
    const cards = brief.cards || [];
    const idx = Math.max(0, Math.min(cards.length - 1, peekState.cardIdx));
    peekState.cardIdx = idx;

    body.innerHTML = `
      <div class="dialog-head-row">
        <div>
          <div class="panel-eyebrow">${escHtml(peekState.group)} · Card ${idx + 1} of ${cards.length}</div>
          <h2 id="cards-peek-title" class="dialog-title">${escHtml(brief.title)}</h2>
        </div>
        <form method="dialog">
          <button value="close" class="icon-btn" aria-label="Close walkthrough cards">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </form>
      </div>
      <div style="max-height:64dvh;overflow-y:auto;display:flex;flex-direction:column;gap:0.75rem;padding-right:0.15rem">
        ${renderWalkthroughCardHtml(peekState.group, idx)}
      </div>
      <div style="display:flex;gap:0.55rem;padding-top:0.25rem">
        <button type="button" class="btn btn-secondary" data-action="peek-prev" ${idx === 0 ? 'disabled' : ''}>← Prev</button>
        <button type="button" class="btn btn-primary btn-block" data-action="peek-next" ${idx >= cards.length - 1 ? 'disabled' : ''}>
          ${idx >= cards.length - 1 ? 'Last Card (Cheat-Sheet)' : `Next Card (${idx + 2}/${cards.length}) →`}
        </button>
      </div>
    `;
  }

  // Stage 1: Node Walkthrough Cards (Full Lesson or Read-Only Handbook Mode)
  function renderNodeBriefing(preserveScroll = false) {
    const { group, cardIdx, readOnly } = activeSession;
    const brief = DATA.briefings[group];
    const cards = brief.cards || [];

    document.getElementById('session-title-pill').textContent = readOnly
      ? `${group} · Walkthrough Handbook`
      : `${group} · Stage 1: Walkthrough`;
    document.getElementById('session-counter').textContent = `Card ${cardIdx + 1} / ${cards.length}`;
    const pct = readOnly
      ? Math.round(((cardIdx + 1) / cards.length) * 100)
      : Math.round(((cardIdx + 1) / (cards.length * 3)) * 100);
    document.getElementById('session-bar').value = pct;

    document.getElementById('session-right-slot').innerHTML = readOnly
      ? `
        <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.65rem;font-size:0.74rem" data-action="convert-to-quiz">
          Take Quiz →
        </button>
      `
      : `
        <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.65rem;font-size:0.74rem" data-action="skip-to-challenge">
          Skip to Quiz
        </button>
      `;

    const body = document.getElementById('session-body');
    const prevScroll = body.scrollTop;
    body.innerHTML = renderWalkthroughCardHtml(group, cardIdx);

    const isLast = cardIdx === cards.length - 1;
    const gPos = ORDERED_GROUPS.indexOf(group);
    const nextOrderedGroup = gPos >= 0 && gPos < ORDERED_GROUPS.length - 1 ? ORDERED_GROUPS[gPos + 1] : null;

    if (readOnly && isLast) {
      document.getElementById('session-footer').innerHTML = `
        <div class="footer-inner">
          <div style="display:flex;gap:0.6rem">
            ${cardIdx > 0 ? `<button type="button" class="btn btn-secondary" data-action="prev-card">Back</button>` : ''}
            <button type="button" class="btn btn-primary btn-block" data-action="convert-to-quiz">
              Start Quiz for ${escHtml(group)} →
            </button>
          </div>
          <div style="display:flex;gap:0.6rem">
            ${nextOrderedGroup ? `
              <button type="button" class="btn btn-secondary btn-block" data-action="read-next-node">
                📖 Read Next Group (${escHtml(nextOrderedGroup)}) →
              </button>
            ` : ''}
            <button type="button" class="btn btn-secondary ${nextOrderedGroup ? '' : 'btn-block'}" data-action="finish-session">
              Done
            </button>
          </div>
        </div>
      `;
    } else {
      document.getElementById('session-footer').innerHTML = `
        <div class="footer-inner">
          <div style="display:flex;gap:0.6rem">
            ${cardIdx > 0 ? `<button type="button" class="btn btn-secondary" data-action="prev-card">Back</button>` : ''}
            <button type="button" class="btn btn-primary btn-block" data-action="next-card">
              ${isLast ? 'Continue to Stage 2: Flash-Pass →' : `Next Card (${cardIdx + 2}/${cards.length}) →`}
            </button>
          </div>
          <div class="kbd-hint">Press Space / Enter for next · ← / → to flip cards</div>
        </div>
      `;
    }
    body.scrollTop = preserveScroll ? prevScroll : 0;
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
      document.getElementById('session-right-slot').innerHTML = `
        <div style="display:flex;align-items:center;gap:0.4rem">
          <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.6rem;font-size:0.74rem" data-peek-group="${escHtml(q.group)}">
            📖 Cards
          </button>
          ${isFlashPass ? `
            <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.6rem;font-size:0.74rem" data-action="skip-to-challenge">
              Skip Warm-Up
            </button>
          ` : ''}
        </div>
      `;
    } else {
      document.getElementById('session-title-pill').textContent = activeSession.title;
      document.getElementById('session-bar').value = Math.round((pos / total) * 100);
      document.getElementById('session-right-slot').innerHTML = `
        <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.62rem;font-size:0.74rem" data-peek-group="${escHtml(q.group)}">
          📖 Cards
        </button>
      `;
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
        <h2 class="q-stem">${isFlashPass ? formatRichText(q.question, { linkJargon: true }) : escHtml(q.question)}</h2>
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
          <p class="feedback-why">${formatRichText(q.explanation, { linkJargon: true })}</p>
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
            <div class="stat-box-val">${state.streak.todayNodes}</div>
            <div class="stat-box-lbl">Nodes Cleared Today</div>
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

  // Full 35-Q Practice Exam & Progress Checkpoint Question View
  function renderExamQuestion() {
    const { items, qIdx, mode } = activeSession;
    const item = items[qIdx];
    const q = item.q;
    const answeredCount = items.filter((it) => it.selectedSlot !== null).length;

    document.getElementById('session-title-pill').textContent =
      mode === 'mock35' ? 'Full 35-Q Practice Exam' : 'Progress Checkpoint Exam';
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
            ⚡ Marked <strong>${escHtml(newlyCracked.join(', '))}</strong> as <em>Cracked</em> on your Path so your next Signal Check targets those weak spots!
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
    document.getElementById('session-right-slot').innerHTML = `
      <button type="button" class="btn btn-secondary" style="padding:0.35rem 0.62rem;font-size:0.74rem" data-peek-group="${escHtml(q.group)}">
        📖 Cards
      </button>
    `;

    const figHtml = q.figure && DATA.figures[q.figure]
      ? `
        <button type="button" class="schematic-box btn-block" data-zoom-fig="${escHtml(q.figure)}">
          ${DATA.figures[q.figure]}
          <div class="zoom-hint">🔍 Tap schematic to zoom</div>
        </button>
      `
      : '';

    const seenWalk = new Set();
    document.getElementById('session-body').innerHTML = `
      <div class="quiz-top-zone">
        <div class="q-meta-row">
          <span class="q-id-chip">${escHtml(q.id)} · Group ${escHtml(q.group)}</span>
          ${q.fcc_rules && q.fcc_rules.length ? `<span class="q-rule-chip">FCC Part ${escHtml(q.fcc_rules.join(', '))}</span>` : ''}
        </div>
        <h2 class="q-stem">${formatRichText(q.question, { linkJargon: true, seenTerms: seenWalk })}</h2>
        ${figHtml}
      </div>

      <div class="panel-card" style="border-color:var(--success);margin-top:0.25rem">
        <div class="panel-eyebrow" style="color:var(--success)">Correct Answer (${letters[q.answer]})</div>
        <p style="font-weight:800;font-size:1rem;margin:0.25rem 0 0.65rem">${escHtml(q.choices[q.answer])}</p>
        <div class="panel-eyebrow">Why It's Right</div>
        <p style="font-size:0.9rem;margin-top:0.2rem">${formatRichText(q.explanation, { linkJargon: true, seenTerms: seenWalk })}</p>
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

    // Header streak & daily activity pills
    document.getElementById('streak-pill').addEventListener('click', () => {
      openConfirmDialog({
        title: `🔥 ${state.streak.count}-Day Study Streak`,
        html: `
          <p>Longest streak: <strong>${state.streak.longest} day(s)</strong>.</p>
          <p>Days roll over at <strong>3:00 AM local time</strong>, so studying past midnight still counts toward the same day.</p>
        `,
        confirmLabel: 'Got It',
        cancelLabel: ''
      });
    });

    document.getElementById('goal-pill').addEventListener('click', () => {
      const mins = Math.floor(state.streak.todaySeconds / 60);
      openConfirmDialog({
        title: 'Today’s Study Activity',
        html: `
          <p>Active study time today: <strong>${mins} min</strong> (ring fills at 30 min)</p>
          <p>New Gold nodes cleared today: <strong>${state.streak.todayNodes || 0}</strong></p>
          <p>Signal Check warm-up: <strong>${state.streak.todayReviewDone ? 'Completed ✓' : 'Available'}</strong></p>
          <p style="font-size:0.82rem">Go at whatever pace fits your schedule—one quick node when you have a spare moment, or several chapters in a single cram session.</p>
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

    function refreshInteractiveWidgetHost() {
      const peekDlg = document.getElementById('cards-peek-dialog');
      if (peekDlg && peekDlg.open) {
        renderCardsPeekModal();
      } else if (activeSession && activeSession.kind === 'node' && activeSession.stage === 'briefing') {
        renderNodeBriefing(true);
      } else if (activeTab === 'aids') {
        renderAidsTab();
      }
    }

    // Global click delegation
    document.addEventListener('click', async (e) => {
      lastInteractionTs = Date.now();

      // Dismiss fallback jargon popover when clicking outside it
      const popEl = document.getElementById('jargon-popover');
      if (popEl && popEl.classList.contains('is-fallback-open')) {
        if (!e.target.closest('#jargon-popover') && !e.target.closest('[data-jargon-key]')) {
          closeJargonPopover();
        }
      }

      const el = e.target.closest(
        '[data-welcome-step],[data-zoom-photo],[data-jargon-key],[data-peek-group],[data-open-node],[data-modal-start],[data-zoom-fig],[data-action],[data-pick-choice],[data-exam-pick],[data-exam-jump],[data-boss-id],[data-review-exam],[data-math-target],[data-power-target],[data-widget-rep],[data-widget-duty],[data-widget-swtype],[data-widget-flip],[data-widget-wave]'
      );
      if (!el) return;

      if (el.dataset.welcomeStep !== undefined) {
        welcomeStep = Number(el.dataset.welcomeStep);
        renderWelcomeModal();
        return;
      }

      if (el.dataset.zoomPhoto) {
        openPhotoZoom(el.dataset.zoomPhoto);
        return;
      }

      if (el.dataset.jargonKey) {
        openJargonPopover(el.dataset.jargonKey, el);
        return;
      }

      if (el.dataset.peekGroup) {
        openCardsPeekModal(el.dataset.peekGroup);
        return;
      }

      if (el.dataset.widgetRep) {
        widgetState.repeaterMode = el.dataset.widgetRep;
        refreshInteractiveWidgetHost();
        return;
      }

      if (el.dataset.widgetDuty) {
        widgetState.dutyPct = Number(el.dataset.widgetDuty);
        refreshInteractiveWidgetHost();
        return;
      }

      if (el.dataset.widgetSwtype) {
        widgetState.switchType = el.dataset.widgetSwtype;
        refreshInteractiveWidgetHost();
        return;
      }

      if (el.dataset.widgetFlip) {
        if (widgetState.switchType === 'spst') {
          widgetState.spstClosed = !widgetState.spstClosed;
        } else {
          widgetState.spdtPos = widgetState.spdtPos === 'A' ? 'B' : 'A';
        }
        refreshInteractiveWidgetHost();
        return;
      }

      if (el.dataset.widgetWave) {
        widgetState.waveMhz = Number(el.dataset.widgetWave);
        refreshInteractiveWidgetHost();
        return;
      }

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
        startNodeLesson(el.dataset.modalStart, el.dataset.startStage || 'briefing', {
          readOnly: el.dataset.readOnly === '1'
        });
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
        refreshInteractiveWidgetHost();
        return;
      }

      if (el.dataset.powerTarget) {
        powerSolveTarget = el.dataset.powerTarget;
        refreshInteractiveWidgetHost();
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

      if (act === 'open-welcome-guide') {
        openWelcomeModal(0);
      } else if (act === 'welcome-prev') {
        welcomeStep = Math.max(0, welcomeStep - 1);
        renderWelcomeModal();
      } else if (act === 'welcome-next') {
        welcomeStep = Math.min(WELCOME_SLIDES.length - 1, welcomeStep + 1);
        renderWelcomeModal();
      } else if (act === 'welcome-close') {
        const dlg = document.getElementById('welcome-dialog');
        if (dlg && dlg.open) dlg.close();
      } else if (act === 'welcome-dismiss-forever') {
        state.hideWelcome = true;
        saveState();
        const dlg = document.getElementById('welcome-dialog');
        if (dlg && dlg.open) dlg.close();
      } else if (act === 'jargon-back') {
        const prevKey = jargonHistory.pop();
        if (prevKey) openJargonPopover(prevKey, null, true);
      } else if (act === 'jargon-close') {
        closeJargonPopover();
      } else if (act === 'peek-prev') {
        closeJargonPopover();
        peekState.cardIdx = Math.max(0, peekState.cardIdx - 1);
        renderCardsPeekModal();
      } else if (act === 'peek-next') {
        closeJargonPopover();
        const cards = (DATA.briefings[peekState.group] && DATA.briefings[peekState.group].cards) || [];
        peekState.cardIdx = Math.min(cards.length - 1, peekState.cardIdx + 1);
        renderCardsPeekModal();
      } else if (act === 'convert-to-quiz' && activeSession && activeSession.kind === 'node') {
        closeJargonPopover();
        const g = activeSession.group;
        if (state.nodes[g].status === 'locked' || state.nodes[g].status === 'next') {
          state.nodes[g].status = 'in_progress';
          saveState();
        }
        activeSession.readOnly = false;
        const isGold = state.nodes[g].status === 'gold';
        activeSession.stage = isGold ? 'challenge' : 'flash';
        const qs = Q_BY_GROUP.get(g) || [];
        activeSession.queue = prepareQuizItems(qs, !isGold);
        activeSession.qIdx = 0;
        activeSession.answeredState = null;
        activeSession.questionShownAt = Date.now();
        renderSession();
      } else if (act === 'read-next-node' && activeSession && activeSession.kind === 'node') {
        closeJargonPopover();
        const pos = ORDERED_GROUPS.indexOf(activeSession.group);
        if (pos >= 0 && pos < ORDERED_GROUPS.length - 1) {
          startNodeLesson(ORDERED_GROUPS[pos + 1], 'briefing', { readOnly: true });
        }
      } else if (act === 'start-signal-check') {
        const qList = buildSignalCheckQueue();
        startDrillSession({ mode: 'signal', title: 'Signal Check Review', questions: qList });
      } else if (act === 'start-mock35') {
        startExamSession('mock35');
      } else if (act === 'start-checkpoint') {
        startExamSession('checkpoint');
      } else if (act === 'start-math-drill') {
        const mathQs = fyShuffle(DATA.pool.filter((q) => q.tags.includes('math')));
        startDrillSession({ mode: 'math', title: 'Math & Formula Drill', questions: mathQs });
      } else if (act === 'prev-card' && activeSession) {
        closeJargonPopover();
        activeSession.cardIdx = Math.max(0, activeSession.cardIdx - 1);
        renderSession();
      } else if (act === 'next-card' && activeSession) {
        closeJargonPopover();
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
        closeJargonPopover();
        const qs = Q_BY_GROUP.get(activeSession.group) || [];
        activeSession.readOnly = false;
        activeSession.stage = 'challenge';
        activeSession.queue = prepareQuizItems(qs, false);
        activeSession.qIdx = 0;
        activeSession.answeredState = null;
        activeSession.questionShownAt = Date.now();
        renderSession();
      } else if (act === 'continue-quiz') {
        closeJargonPopover();
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
          showToast('Study progress reset.');
        }
      }
    });

    // Checklist & Welcome Opt-Out checkboxes
    document.addEventListener('change', (e) => {
      const welcomeCb = e.target.closest('input[data-welcome-optout]');
      if (welcomeCb) {
        state.hideWelcome = Boolean(welcomeCb.checked);
        saveState();
        renderWelcomeModal();
        return;
      }
      const cb = e.target.closest('input[data-check-key]');
      if (!cb) return;
      state.checklist[cb.dataset.checkKey] = cb.checked;
      saveState();
      renderAidsTab();
    });

    // Desktop Keyboard-First Shortcuts (1-4 / A-D, Space/Enter, F, Arrows, Esc)
    document.addEventListener('keydown', (e) => {
      lastInteractionTs = Date.now();
      const popEl = document.getElementById('jargon-popover');
      if (e.key === 'Escape' && popEl && popEl.classList.contains('is-fallback-open')) {
        e.preventDefault();
        closeJargonPopover();
        return;
      }
      const welcomeDlg = document.getElementById('welcome-dialog');
      if (welcomeDlg && welcomeDlg.open) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nb = welcomeDlg.querySelector('[data-action="welcome-next"]');
          if (nb) nb.click();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const pb = welcomeDlg.querySelector('[data-action="welcome-prev"]');
          if (pb) pb.click();
        }
        return;
      }
      const peekDlg = document.getElementById('cards-peek-dialog');
      if (peekDlg && peekDlg.open) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nb = peekDlg.querySelector('[data-action="peek-next"]:not(:disabled)');
          if (nb) nb.click();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const pb = peekDlg.querySelector('[data-action="peek-prev"]:not(:disabled)');
          if (pb) pb.click();
        }
        return;
      }
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
    if (!state.hideWelcome) {
      openWelcomeModal(0);
    }
    registerServiceWorker();
  }

  init();
})();
