import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = process.cwd();

// 1. Verify runtime files exist and sizes match target budget
const requiredFiles = ['index.html', 'style.css', 'data.js', 'app.js', 'manifest.json', 'sw.js', 'icon.svg'];
let totalBytes = 0;
for (const f of requiredFiles) {
  const full = path.join(root, f);
  assert.ok(fs.existsSync(full), `Missing runtime file: ${f}`);
  const st = fs.statSync(full);
  assert.ok(st.size > 100, `File unexpectedly tiny: ${f}`);
  totalBytes += st.size;
}
console.log(`Runtime files verified: ${requiredFiles.length} files, ${(totalBytes / 1024).toFixed(1)} KB total.`);

// 2. Verify manifest.json & sw.js asset parity
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './index.html');
assert.equal(manifest.icons[0].src, './icon.svg');

const swCode = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const f of requiredFiles.filter((x) => x !== 'sw.js')) {
  assert.ok(swCode.includes(`./${f}`), `sw.js ASSETS missing ./${f}`);
}

// 3. Evaluate data.js in isolated VM and audit all 409 questions + 35 briefings + 3 SVGs
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), sandbox);
const DATA = sandbox.window.HAM_DATA;

assert.equal(DATA.pool.length, 409, 'Pool must have 409 questions');
assert.equal(Object.keys(DATA.briefings).length, 35, 'Must have 35 briefings');
assert.deepEqual(Object.keys(DATA.figures).sort(), ['T-1', 'T-2', 'T-3']);

// Verify SVG callout numbers in Figures T-1, T-2, T-3
for (const n of ['1', '2', '3', '4', '5']) {
  assert.ok(DATA.figures['T-1'].includes(`>${n}<`), `Figure T-1 missing callout ${n}`);
}
for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
  assert.ok(DATA.figures['T-2'].includes(`>${n}<`), `Figure T-2 missing callout ${n}`);
}
for (const n of ['1', '2', '3', '4']) {
  assert.ok(DATA.figures['T-3'].includes(`>${n}<`), `Figure T-3 missing callout ${n}`);
}

// Verify all 58 positional questions have slot D ('All these choices/answers are correct')
const posQs = DATA.pool.filter((q) => q.has_positional_choice);
assert.equal(posQs.length, 58, 'Expected 58 positional-choice questions');
for (const q of posQs) {
  assert.match(q.choices[3], /all these (choices|answers) are correct/i, `Unexpected positional choice on ${q.id}`);
}

// Verify every index.html element ID referenced by getElementById in app.js exists in index.html or dynamic templates
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const combinedHtml = htmlSrc + '\n' + appSrc;
const idRefs = [...appSrc.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
for (const id of new Set(idRefs)) {
  assert.ok(
    combinedHtml.includes(`id="${id}"`),
    `Missing DOM element id="${id}" referenced by getElementById()`
  );
}
console.log(`Verified ${new Set(idRefs).size} DOM ID bindings between index.html and app.js.`);
console.log('ALL SMOKE CHECKS PASSED!');

// 4. Full Behavioral Integration Test (Booting app.js against simulated DOM + localStorage)
class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.hidden = false;
    this.open = false;
    this.returnValue = '';
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this._innerHTML = '';
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = { setProperty(k, v) { this[k] = v; } };
    this.classList = {
      _set: new Set(),
      add: (...c) => c.forEach((x) => this.classList._set.add(x)),
      remove: (...c) => c.forEach((x) => this.classList._set.delete(x)),
      toggle: (x, force) => {
        const add = force !== undefined ? force : !this.classList._set.has(x);
        if (add) this.classList._set.add(x); else this.classList._set.delete(x);
      },
      contains: (x) => this.classList._set.has(x)
    };
  }
  set innerHTML(val) {
    this._innerHTML = String(val);
    registerDynamicIds(this._innerHTML);
  }
  get innerHTML() { return this._innerHTML; }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  removeAttribute(k) { this.attributes.delete(k); }
  getAttribute(k) { return this.attributes.get(k) ?? null; }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const arr = this.listeners.get(type) || [];
    this.listeners.set(type, arr.filter((f) => f !== fn));
  }
  dispatchEvent(ev) {
    const arr = this.listeners.get(ev.type) || [];
    for (const fn of arr) fn(ev);
  }
  showModal() { this.open = true; }
  close(val = '') {
    this.open = false;
    if (val) this.returnValue = val;
    this.dispatchEvent({ type: 'close' });
  }
  select() {}
  remove() {}
  matches() { return false; }
  closest(sel) { return this._closestMatch || null; }
}

const domById = new Map();
function registerDynamicIds(html) {
  for (const m of html.matchAll(/id="([^"]+)"/g)) {
    if (!domById.has(m[1])) domById.set(m[1], new MockElement('div', m[1]));
  }
}
registerDynamicIds(htmlSrc);

const navTabs = ['path', 'exams', 'aids'].map((t) => {
  const el = domById.get(`tab-btn-${t}`);
  el.dataset.tab = t;
  return el;
});

const docListeners = new Map();
const storageMap = new Map();

const domEnv = {
  console,
  Date,
  Math,
  JSON,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Map,
  Set,
  RegExp,
  Error,
  parseFloat,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  escape,
  unescape,
  encodeURIComponent,
  decodeURIComponent,
  setTimeout: () => 1,
  clearTimeout: () => {},
  setInterval: () => 1,
  HTMLDialogElement: { prototype: { closedBy: 'any' } },
  navigator: { clipboard: { writeText: async () => {} } },
  localStorage: {
    getItem: (k) => storageMap.get(k) ?? null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k)
  },
  window: {
    HAM_DATA: DATA,
    location: { protocol: 'file:' },
    scrollTo: () => {},
    addEventListener: () => {}
  },
  document: {
    hidden: false,
    documentElement: new MockElement('html'),
    body: { append: () => {} },
    createElement: (t) => new MockElement(t),
    execCommand: () => true,
    getElementById: (id) => {
      if (!domById.has(id)) domById.set(id, new MockElement('div', id));
      return domById.get(id);
    },
    querySelectorAll: (sel) => (sel === '.nav-tab' ? navTabs : []),
    querySelector: () => null,
    addEventListener: (type, fn) => {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    }
  }
};

vm.createContext(domEnv);
vm.runInContext(appSrc, domEnv);

function fireClick(dataset) {
  const fakeEl = new MockElement('button');
  fakeEl.dataset = dataset;
  fakeEl._closestMatch = fakeEl;
  for (const fn of docListeners.get('click') || []) {
    fn({ target: fakeEl });
  }
}

// Verify initial Path render
assert.match(domById.get('campaign-container').innerHTML, /Chapter 1/);
assert.match(domById.get('campaign-container').innerHTML, /T2A/);

// Switch through Exams & Aids tabs cleanly
navTabs[1].dispatchEvent({ type: 'click' });
assert.match(domById.get('exams-container').innerHTML, /Official 35-Question Mock Exam/);
navTabs[2].dispatchEvent({ type: 'click' });
assert.match(domById.get('aids-container').innerHTML, /Exam-Focused Band/);
fireClick({ powerTarget: 'PI' });
assert.match(domById.get('aids-container').innerHTML, /I = P \/ E/);
fireClick({ zoomFig: 'T-1' });
assert.match(domById.get('figure-dialog-caption').textContent, /Tested on Exam/);
navTabs[0].dispatchEvent({ type: 'click' });

// Start Node 1 (T2A) directly -> verify Night-1 aid has only T2A starter numbers -> walk Briefing -> Flash-Pass -> Challenge
fireClick({ openNode: 'T2A', directStart: '1' });
assert.match(domById.get('session-body').innerHTML, /3 Starter Numbers in Group T2A/);
assert.doesNotMatch(domById.get('session-body').innerHTML, /200 W PEP/);
const t2aCards = DATA.briefings.T2A.cards.length;
for (let i = 0; i < t2aCards; i++) {
  fireClick({ action: 'next-card' });
}
assert.match(domById.get('session-title-pill').textContent, /Flash-Pass/);

// Complete all 11 Flash-Pass questions by picking the highlighted choice
const t2aLen = DATA.pool.filter((q) => q.group === 'T2A').length;
for (let i = 0; i < t2aLen; i++) {
  const bodyHtml = domById.get('session-body').innerHTML;
  const match = bodyHtml.match(/class="choice-btn is-flash-target"\s+data-pick-choice="(\d)"/);
  assert.ok(match, 'Flash-Pass must highlight exactly 1 target choice');
  fireClick({ pickChoice: match[1] });
  fireClick({ action: 'continue-quiz' });
}

// Now in Stage 3 Challenge! Intentionally miss Q1 on first try, then clear all + loop-back!
assert.match(domById.get('session-title-pill').textContent, /Stage 3: Challenge/);
let safety = 0;
let intentionallyMissedOnce = false;
while (!domById.get('session-title-pill').textContent.includes('Node Mastered') && safety < 30) {
  safety++;
  const bodyHtml = domById.get('session-body').innerHTML;
  const qidMatch = bodyHtml.match(/<span class="q-id-chip">(T2A\d+)<\/span>/);
  const qObj = DATA.pool.find((x) => x.id === qidMatch[1]);
  const rightText = qObj.choices[qObj.answer]
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const btnMatches = [...bodyHtml.matchAll(/data-pick-choice="(\d)"[\s\S]*?<span>([\s\S]*?)<\/span>/g)];
  const rightSlot = Number(btnMatches.find((m) => m[2] === rightText)[1]);
  const chosen = !intentionallyMissedOnce ? (rightSlot + 1) % 4 : rightSlot;
  intentionallyMissedOnce = true;
  fireClick({ pickChoice: String(chosen) });
  fireClick({ action: 'continue-quiz' });
}
assert.equal(safety, t2aLen + 1, 'Missed question must loop back exactly once at end of Challenge');
fireClick({ action: 'finish-session' });

let saved = JSON.parse(storageMap.get('ham_study_v1'));
assert.equal(saved.nodes.T2A.status, 'gold');
assert.equal(saved.nodes.T2B.status, 'next');
assert.equal(saved.streak.todayNodes, 1);

// Launch Official 35-Q Mock Exam and verify schematic zoom hides component spoilers!
fireClick({ action: 'start-mock35' });
fireClick({ zoomFig: 'T-2' });
assert.match(domById.get('figure-dialog-caption').textContent, /Component labels hidden while answering/);
for (let i = 0; i < 35; i++) {
  fireClick({ examJump: String(i) });
  // Intentionally leave T2A wrong so T2A cracks!
  const bodyHtml = domById.get('session-body').innerHTML;
  const qid = bodyHtml.match(/<span class="q-id-chip">(T[0-9][A-Z]\d+)<\/span>/)[1];
  const qObj = DATA.pool.find((x) => x.id === qid);
  if (qObj.group === 'T2A') {
    const rightText = qObj.choices[qObj.answer]
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const btnMatches = [...bodyHtml.matchAll(/data-exam-pick="(\d)"[\s\S]*?<span>([\s\S]*?)<\/span>/g)];
    const rightSlot = Number(btnMatches.find((m) => m[2] === rightText)[1]);
    fireClick({ examPick: String((rightSlot + 1) % 4) });
  } else {
    fireClick({ examPick: '0' });
  }
}
fireClick({ action: 'exam-submit' });
assert.match(domById.get('session-body').innerHTML, /Smart Studied-Nodes Score/);
saved = JSON.parse(storageMap.get('ham_study_v1'));
assert.equal(saved.nodes.T2A.cracked, true, 'Missing Gold T2A on Mock Exam must mark T2A Cracked');
fireClick({ action: 'finish-session' });

// Run Nightly Signal Check and verify clearing repairs T2A back to un-cracked Gold!
fireClick({ action: 'start-signal-check' });
let sigSteps = 0;
while (!domById.get('session-counter').textContent.includes('Complete') && sigSteps < 25) {
  sigSteps++;
  const bodyHtml = domById.get('session-body').innerHTML;
  const qid = bodyHtml.match(/<span class="q-id-chip">(T[0-9][A-Z]\d+)<\/span>/)[1];
  const qObj = DATA.pool.find((x) => x.id === qid);
  const rightText = qObj.choices[qObj.answer]
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const btnMatches = [...bodyHtml.matchAll(/data-pick-choice="(\d)"[\s\S]*?<span>([\s\S]*?)<\/span>/g)];
  const rightSlot = Number(btnMatches.find((m) => m[2] === rightText)[1]);
  fireClick({ pickChoice: String(rightSlot) });
  fireClick({ action: 'continue-quiz' });
}
saved = JSON.parse(storageMap.get('ham_study_v1'));
assert.equal(saved.nodes.T2A.cracked, false, 'Clearing Signal Check must repair Cracked T2A back to solid Gold');
assert.equal(saved.streak.todayReviewDone, true);
fireClick({ action: 'finish-session' });

// Verify Backup Code Export & Restore round-trip
navTabs[2].dispatchEvent({ type: 'click' });
fireClick({ action: 'copy-backup' });
const backupVal = domById.get('backup-code-box').value;
assert.ok(backupVal.startsWith('HAM1:'), 'Backup code must start with HAM1:');
fireClick({ action: 'restore-backup' });
saved = JSON.parse(storageMap.get('ham_study_v1'));
assert.equal(saved.nodes.T2A.status, 'gold');

console.log('ALL END-TO-END BEHAVIORAL INTEGRATION TESTS PASSED!');
