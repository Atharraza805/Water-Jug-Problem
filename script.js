/**
 * ═══════════════════════════════════════════════════════════
 *  AquaSolve — script.js
 *  Algorithm  : BFS (Breadth-First Search)
 *  Features   : Rich step explanations, animated jugs,
 *               bubble physics, pour streams, confetti,
 *               dark/light toggle, keyboard nav, speed ctrl
 * ═══════════════════════════════════════════════════════════
 */

'use strict';

/* ═══════════════════════════════
   DOM REFERENCES
═══════════════════════════════ */
const $ = id => document.getElementById(id);

// Inputs
const jug1CapEl   = $('jug1Cap');
const jug2CapEl   = $('jug2Cap');
const targetEl    = $('target');
const errCard     = $('errCard');
const errText     = $('errText');

// Buttons
const startBtn  = $('startBtn');
const resetBtn  = $('resetBtn');
const prevBtn   = $('prevBtn');
const nextBtn   = $('nextBtn');
const autoBtn   = $('autoBtn');
const themeBtn  = $('themeBtn');
const themeIcon = $('themeIcon');

// Speed
const speedSlider = $('speedSlider');
const speedLabel  = $('speedLabel');

// Jug visuals
const wbA    = $('wbA');
const wbB    = $('wbB');
const miniA  = $('miniA');
const miniB  = $('miniB');
const readA  = $('readA');
const readB  = $('readB');
const capA   = $('capA');
const capB   = $('capB');
const colA   = $('colA');
const colB   = $('colB');
const splA   = $('splA');
const splB   = $('splB');
const bubA   = $('bubA');
const bubB   = $('bubB');
const tickA  = $('tickA');
const tickB  = $('tickB');

// Pour channel
const flowPipe  = $('flowPipe');
const flowLiq   = $('flowLiq');
const flowLabel = $('flowLabel');
const drip1     = $('drip1');
const drip2     = $('drip2');
const drip3     = $('drip3');

// Explanation card
const explainCard   = $('explainCard');
const explainBadge  = $('explainBadge');
const explainIcon   = $('explainIcon');
const explainStep   = $('explainStep');
const explainAction = $('explainAction');
const explainDetail = $('explainDetail');
const explainWhy    = $('explainWhy');
const transBefore   = $('transBefore');
const transAfter    = $('transAfter');

// State / goal
const statePill  = $('statePill');
const goalAmt    = $('goalAmt');
const goalPill   = $('goalPill');

// Victory
const victoryBanner = $('victoryBanner');
const victorySub    = $('victorySub');

// Stats
const totalStepsEl    = $('totalSteps');
const currentStepDisp = $('currentStepDisp');
const statusDisp      = $('statusDisp');

// BFS
const bfsCur     = $('bfsCur');
const bfsNxt     = $('bfsNxt');
const bfsQChips  = $('bfsQChips');

// Header
const liveBadge  = $('liveBadge');

// Auto button
const autoBtnLbl = $('autoBtnLbl');
const playIconWrap = $('playIconWrap');

// History
const historyList = $('historyList');

/* ═══════════════════════════════
   STATE
═══════════════════════════════ */
let steps        = [];
let currentStep  = -1;
let autoInterval = null;
let isPlaying    = false;
let jugACap      = 0;
let jugBCap      = 0;
let targetAmt    = 0;
let bubTimers    = [];  // bubble animation cleanup

/* ═══════════════════════════════
   THEME TOGGLE
═══════════════════════════════ */
themeBtn.addEventListener('click', () => {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  themeIcon.textContent = dark ? '☀️' : '🌙';
});

/* ═══════════════════════════════
   SPEED SLIDER LABEL
═══════════════════════════════ */
speedSlider.addEventListener('input', () => {
  const raw  = parseInt(speedSlider.value);
  const mult = (2500 / raw).toFixed(1);
  speedLabel.textContent = mult + '×';
  if (isPlaying) { stopAuto(); startAuto(); }
});

/* ═══════════════════════════════
   GCD UTILITY
═══════════════════════════════ */
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/* ═══════════════════════════════
   VALIDATION
═══════════════════════════════ */
function showError(msg) {
  errText.textContent = msg;
  errCard.classList.remove('hidden');
}
function clearError() { errCard.classList.add('hidden'); }

function validate() {
  const a = parseInt(jug1CapEl.value);
  const b = parseInt(jug2CapEl.value);
  const t = parseInt(targetEl.value);

  if ([a,b,t].some(isNaN))          { showError('Please enter valid numbers for all fields.'); return null; }
  if (a < 1 || b < 1 || t < 1)     { showError('All capacities must be at least 1 L.'); return null; }
  if (a > 99 || b > 99 || t > 99)  { showError('Values must be ≤ 99 L.'); return null; }
  if (a === b)                       { showError('Jug A and Jug B must have different capacities.'); return null; }
  if (t > Math.max(a, b))           { showError(`Target ${t}L cannot exceed the larger jug (${Math.max(a,b)}L).`); return null; }

  const g = gcd(a, b);
  if (t % g !== 0) {
    showError(`No solution exists! GCD(${a}, ${b}) = ${g}, which does not divide ${t}. Try a different target.`);
    return null;
  }
  clearError();
  return { a, b, t };
}

/* ═══════════════════════════════
   BFS SOLVER
   Operations per state:
   1. Fill A        4. Empty B
   2. Fill B        5. Pour A → B
   3. Empty A       6. Pour B → A
═══════════════════════════════ */
function solveBFS(capA, capB, goal) {
  const visited = new Set();
  // Each node: { a, b, path }
  // path = array of { a, b, op } where op describes the move taken TO reach this state
  const queue = [{ a: 0, b: 0, path: [{ a: 0, b: 0, op: 'init' }] }];

  while (queue.length) {
    const node = queue.shift();
    const { a, b, path } = node;
    const key = `${a},${b}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (a === goal || b === goal) return path;

    const moves = [
      { na: capA,                        nb: b,                          op: 'fillA'  },
      { na: a,                           nb: capB,                       op: 'fillB'  },
      { na: 0,                           nb: b,                          op: 'emptyA' },
      { na: a,                           nb: 0,                          op: 'emptyB' },
      { na: Math.max(0, a-(capB-b)),     nb: Math.min(capB, a+b),        op: 'pourAB' },
      { na: Math.min(capA, a+b),         nb: Math.max(0, b-(capA-a)),    op: 'pourBA' },
    ];

    for (const m of moves) {
      const nk = `${m.na},${m.nb}`;
      if (!visited.has(nk)) {
        queue.push({
          a: m.na, b: m.nb,
          path: [...path, { a: m.na, b: m.nb, op: m.op }]
        });
      }
    }
  }
  return null;
}

/* ═══════════════════════════════
   RICH EXPLANATIONS
   Returns { title, icon, detail, why }
   for every operation type
═══════════════════════════════ */
function buildExplanation(step, prev, capA, capB, goal) {
  const { op, a, b } = step;
  const pA = prev ? prev.a : 0;
  const pB = prev ? prev.b : 0;

  const pct = v => Math.round(v * 100);
  const full = v => v === 0 ? 'empty' : 'full';

  switch (op) {
    case 'init':
      return {
        icon: '🏁',
        title: 'Initial State — Both jugs empty',
        detail: `We begin with <strong>Jug A (${capA}L)</strong> and <strong>Jug B (${capB}L)</strong>, both completely empty. The BFS algorithm will now explore all possible moves to reach the target of <strong>${goal} L</strong>.`,
        why: `BFS guarantees we find the shortest sequence of steps — it explores all 1-step solutions first, then 2-step, and so on.`
      };

    case 'fillA':
      return {
        icon: '🚰',
        title: `Fill Jug A to the brim (${capA} L)`,
        detail: `Turn on the tap and fill <strong>Jug A</strong> completely. It now holds <strong>${capA} L</strong> — its maximum capacity. Jug B remains unchanged at <strong>${b} L</strong>.`,
        why: `Filling a jug is the only way to introduce new water into the system. Since Jug A was at ${pA}L, we add ${capA - pA}L of fresh water.`
      };

    case 'fillB':
      return {
        icon: '🚰',
        title: `Fill Jug B to the brim (${capB} L)`,
        detail: `Completely fill <strong>Jug B</strong> from the tap. It now holds <strong>${capB} L</strong> — its full capacity. Jug A stays at <strong>${a} L</strong>.`,
        why: `Jug B was at ${pB}L. Adding ${capB - pB}L brings it to full. This creates a known precise quantity we can use for measuring.`
      };

    case 'emptyA': {
      const lost = pA;
      return {
        icon: '🗑️',
        title: `Empty Jug A completely`,
        detail: `Pour out all <strong>${lost} L</strong> from Jug A — drain it completely. Jug A is now empty (0 L). Jug B remains at <strong>${b} L</strong>.`,
        why: `Emptying a jug resets it to zero so it can be used as a receiving vessel in the next pour. This is key when a jug is "blocked" from receiving more water.`
      };
    }

    case 'emptyB': {
      const lost = pB;
      return {
        icon: '🗑️',
        title: `Empty Jug B completely`,
        detail: `Drain all <strong>${lost} L</strong> from Jug B, leaving it at 0 L. Jug A remains at <strong>${a} L</strong>.`,
        why: `Emptying Jug B frees up its full ${capB}L capacity as a destination for the next pour operation.`
      };
    }

    case 'pourAB': {
      const poured  = pA - a;            // how much left A
      const spaceB  = capB - pB;         // how much B could accept
      const limited = pA > spaceB ? `Jug B could only accept <strong>${spaceB}L</strong> before reaching its cap.` : `Jug A was completely emptied into Jug B.`;
      return {
        icon: '➡️',
        title: `Pour Jug A → Jug B (${poured} L transferred)`,
        detail: `Tilt Jug A to pour into Jug B. <strong>${poured} L</strong> is transferred. ${limited} Jug A now holds <strong>${a}L</strong> and Jug B holds <strong>${b}L</strong>.`,
        why: `Pouring from A to B combines their volumes without losing any water. The pour stops when either Jug A is empty OR Jug B is full — whichever comes first.`
      };
    }

    case 'pourBA': {
      const poured  = pB - b;
      const spaceA  = capA - pA;
      const limited = pB > spaceA ? `Jug A could only accept <strong>${spaceA}L</strong> before reaching its cap.` : `Jug B was completely emptied into Jug A.`;
      return {
        icon: '⬅️',
        title: `Pour Jug B → Jug A (${poured} L transferred)`,
        detail: `Tilt Jug B to pour into Jug A. <strong>${poured} L</strong> is transferred. ${limited} Jug B now holds <strong>${b}L</strong> and Jug A holds <strong>${a}L</strong>.`,
        why: `Pouring from B to A moves water precisely — the exact volume transferred depends on the remaining space in Jug A (${capA - pA}L free) and the amount in Jug B (${pB}L).`
      };
    }

    default:
      return { icon: '💧', title: 'Operation', detail: '', why: '' };
  }
}

/* ═══════════════════════════════
   BUILD TICK MARKS (ruler)
═══════════════════════════════ */
function buildTicks(container, cap) {
  container.innerHTML = '';
  const count = Math.min(cap, 10);
  for (let i = 0; i <= count; i++) {
    const tick = document.createElement('div');
    tick.className = 'tick' + (i % 2 === 0 ? ' major' : '');
    container.appendChild(tick);
  }
}

/* ═══════════════════════════════
   BUBBLE SPAWNER
═══════════════════════════════ */
function spawnBubbles(container, count = 4) {
  // clear old
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'bub';
    const size = 4 + Math.random() * 6;
    b.style.cssText = `
      width:${size}px; height:${size}px;
      left:${10 + Math.random() * 75}%;
      bottom:${5 + Math.random() * 20}%;
      animation-duration:${1.5 + Math.random() * 2}s;
      animation-delay:${Math.random() * 1.5}s;
    `;
    container.appendChild(b);
  }
}

function clearBubbles(container) {
  container.innerHTML = '';
}

/* ═══════════════════════════════
   POUR ANIMATION
═══════════════════════════════ */
function triggerPour(op) {
  // Reset
  flowPipe.classList.remove('active');
  flowPipe.style.height = '0';
  flowLabel.classList.remove('visible');
  flowLabel.textContent = '';
  [drip1, drip2, drip3].forEach(d => d.classList.remove('active'));

  if (op === 'pourAB' || op === 'pourBA') {
    const label = op === 'pourAB' ? 'A → B' : 'B → A';
    flowPipe.classList.add('active');
    flowPipe.style.height = '70px';
    flowLabel.textContent = label;
    flowLabel.classList.add('visible');
    [drip1, drip2, drip3].forEach(d => d.classList.add('active'));

    setTimeout(() => {
      flowPipe.classList.remove('active');
      flowPipe.style.height = '0';
      flowLabel.classList.remove('visible');
      [drip1, drip2, drip3].forEach(d => d.classList.remove('active'));
    }, 900);
  }
}

/* ═══════════════════════════════
   SPLASH EFFECT
═══════════════════════════════ */
function triggerSplash(el) {
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

/* ═══════════════════════════════
   RENDER STEP
═══════════════════════════════ */
function renderStep(idx) {
  if (idx < 0 || idx >= steps.length) return;
  currentStep = idx;
  const s    = steps[idx];
  const prev = idx > 0 ? steps[idx - 1] : null;

  /* ── Water levels ── */
  const pA = jugACap > 0 ? (s.a / jugACap) * 100 : 0;
  const pB = jugBCap > 0 ? (s.b / jugBCap) * 100 : 0;

  wbA.style.height  = pA + '%';
  wbB.style.height  = pB + '%';
  miniA.style.width = pA + '%';
  miniB.style.width = pB + '%';

  readA.textContent = `${s.a} / ${jugACap} L`;
  readB.textContent = `${s.b} / ${jugBCap} L`;

  statePill.textContent = `( ${s.a} , ${s.b} )`;
  currentStepDisp.textContent = `${idx} / ${steps.length - 1}`;

  /* ── Spawn bubbles when water level increases ── */
  const prevA = prev ? prev.a : 0;
  const prevB = prev ? prev.b : 0;
  if (s.a > prevA)    spawnBubbles(bubA, 5);
  else if (s.a === 0) clearBubbles(bubA);
  if (s.b > prevB)    spawnBubbles(bubB, 5);
  else if (s.b === 0) clearBubbles(bubB);

  /* ── Splash on receive ── */
  if (s.a > prevA) triggerSplash(splA);
  if (s.b > prevB) triggerSplash(splB);

  /* ── Pour animation ── */
  triggerPour(s.op);

  /* ── Jug column highlights ── */
  colA.classList.remove('active', 'goal-reached', 'jugB');
  colB.classList.remove('active', 'goal-reached', 'jugB');

  const isGoal = s.a === targetAmt || s.b === targetAmt;

  if (isGoal) {
    if (s.a === targetAmt) colA.classList.add('goal-reached');
    if (s.b === targetAmt) colB.classList.add('goal-reached');
    victoryBanner.classList.remove('hidden');
    victorySub.textContent = `Target ${targetAmt}L achieved in ${idx} step${idx===1?'':'s'} via BFS`;
    statusDisp.textContent = '✅ Solved!';
    statusDisp.style.color = 'var(--success)';
    liveBadge.innerHTML = '<span class="live-dot active"></span> Solved!';
    launchConfetti();
  } else {
    victoryBanner.classList.add('hidden');
    const op = s.op;
    if (op === 'fillA' || op === 'emptyA') colA.classList.add('active');
    if (op === 'fillB' || op === 'emptyB') colB.classList.add('active');
    if (op === 'pourAB') { colA.classList.add('active'); colB.classList.add('active', 'jugB'); }
    if (op === 'pourBA') { colA.classList.add('active'); colB.classList.add('active', 'jugB'); }
  }

  /* ── Explanation ── */
  const exp = buildExplanation(s, prev, jugACap, jugBCap, targetAmt);
  explainIcon.textContent   = exp.icon;
  explainStep.textContent   = `Step ${idx}`;
  explainAction.textContent = exp.title;
  explainDetail.innerHTML   = exp.detail;

  if (exp.why) {
    explainWhy.textContent = exp.why;
    explainWhy.classList.add('visible');
  } else {
    explainWhy.classList.remove('visible');
  }

  transBefore.textContent = prev ? `(${prev.a}, ${prev.b})` : '—';
  transAfter.textContent  = `(${s.a}, ${s.b})`;

  explainCard.classList.add('highlight');
  setTimeout(() => explainCard.classList.remove('highlight'), 700);

  /* ── BFS trace strip ── */
  bfsCur.textContent = `(${s.a}, ${s.b})`;
  if (idx + 1 < steps.length) {
    const ns = steps[idx + 1];
    bfsNxt.textContent = `(${ns.a}, ${ns.b})`;
  } else {
    bfsNxt.textContent = '— Goal —';
  }

  // Queue preview chips
  bfsQChips.innerHTML = '';
  const qSample = steps.slice(idx + 1, idx + 5);
  qSample.forEach(qs => {
    const chip = document.createElement('div');
    chip.className = 'bfs-q-chip';
    chip.textContent = `(${qs.a},${qs.b})`;
    bfsQChips.appendChild(chip);
  });
  if (qSample.length === 0) {
    bfsQChips.innerHTML = '<span style="font-size:.72rem;color:var(--text-3)">Queue empty — goal reached</span>';
  }

  /* ── History highlight ── */
  highlightHistory(idx);

  /* ── Button states ── */
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx >= steps.length - 1;
  if (idx >= steps.length - 1) stopAuto();
}

/* ═══════════════════════════════
   BUILD HISTORY
═══════════════════════════════ */
function buildHistory() {
  historyList.innerHTML = '';
  steps.forEach((s, i) => {
    const exp   = buildExplanation(s, i > 0 ? steps[i-1] : null, jugACap, jugBCap, targetAmt);
    const isGoal = s.a === targetAmt || s.b === targetAmt;
    const item  = document.createElement('div');
    item.className = 'hist-item' + (i === 0 ? ' active' : '') + (isGoal ? ' goal-item' : '');
    item.innerHTML = `
      <span class="h-num">${i}</span>
      <div class="h-info">
        <div class="h-action">${exp.icon} ${exp.title}</div>
        <div class="h-state">(${s.a}, ${s.b})</div>
      </div>
    `;
    item.addEventListener('click', () => { stopAuto(); renderStep(i); });
    historyList.appendChild(item);
  });
}

function highlightHistory(idx) {
  const items = historyList.querySelectorAll('.hist-item');
  items.forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    if (i === idx) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

/* ═══════════════════════════════
   START SIMULATION
═══════════════════════════════ */
startBtn.addEventListener('click', () => {
  stopAuto();
  const vals = validate();
  if (!vals) return;

  jugACap   = vals.a;
  jugBCap   = vals.b;
  targetAmt = vals.t;

  // Update UI labels
  capA.textContent = `Cap: ${jugACap} L`;
  capB.textContent = `Cap: ${jugBCap} L`;
  goalAmt.textContent = targetAmt;

  // Build tick marks
  buildTicks(tickA, jugACap);
  buildTicks(tickB, jugBCap);

  liveBadge.innerHTML = '<span class="live-dot active"></span> Solving…';
  statusDisp.textContent = 'BFS running…';
  statusDisp.style.color = '';

  // BFS
  const raw = solveBFS(jugACap, jugBCap, targetAmt);

  if (!raw) {
    showError('BFS found no solution. This configuration has no answer.');
    liveBadge.innerHTML = '<span class="live-dot"></span> Failed';
    return;
  }

  steps = raw; // each element: { a, b, op }
  totalStepsEl.textContent = (steps.length - 1) + ' moves';
  liveBadge.innerHTML = '<span class="live-dot active"></span> Running';

  victoryBanner.classList.add('hidden');
  currentStep = 0;
  buildHistory();
  renderStep(0);

  prevBtn.disabled = true;
  nextBtn.disabled = steps.length <= 1;
  autoBtn.disabled = false;
});

/* ═══════════════════════════════
   NAVIGATION
═══════════════════════════════ */
nextBtn.addEventListener('click', () => {
  if (currentStep < steps.length - 1) renderStep(currentStep + 1);
});
prevBtn.addEventListener('click', () => {
  if (currentStep > 0) renderStep(currentStep - 1);
});

/* ═══════════════════════════════
   AUTO PLAY
═══════════════════════════════ */
autoBtn.addEventListener('click', () => {
  isPlaying ? stopAuto() : startAuto();
});

function startAuto() {
  if (steps.length === 0) return;
  if (currentStep >= steps.length - 1) renderStep(0);
  isPlaying = true;
  autoBtn.classList.add('playing');
  autoBtnLbl.textContent = 'Pause';
  playIconWrap.textContent = '⏸';

  const delay = parseInt(speedSlider.value);
  autoInterval = setInterval(() => {
    if (currentStep >= steps.length - 1) { stopAuto(); return; }
    renderStep(currentStep + 1);
  }, delay);
}

function stopAuto() {
  isPlaying = false;
  clearInterval(autoInterval);
  autoInterval = null;
  autoBtn.classList.remove('playing');
  autoBtnLbl.textContent = 'Auto Play';
  playIconWrap.textContent = '▶';
}

/* ═══════════════════════════════
   RESET
═══════════════════════════════ */
resetBtn.addEventListener('click', () => {
  stopAuto();
  steps = []; currentStep = -1;
  jugACap = jugBCap = targetAmt = 0;

  wbA.style.height = wbB.style.height = '0%';
  miniA.style.width = miniB.style.width = '0%';
  readA.textContent = readB.textContent = '0 / 0 L';
  capA.textContent  = capB.textContent  = 'Cap: — L';
  statePill.textContent = '( — , — )';
  goalAmt.textContent = '—';

  explainIcon.textContent = '💧';
  explainStep.textContent = 'Step 0';
  explainAction.textContent = 'Configure & start the simulation';
  explainDetail.innerHTML = 'Set jug capacities and a target amount, then press <strong>Solve & Simulate</strong>.';
  explainWhy.classList.remove('visible');
  transBefore.textContent = '—';
  transAfter.textContent  = '—';

  bfsCur.textContent = bfsNxt.textContent = '—';
  bfsQChips.innerHTML = '';

  historyList.innerHTML = '<div class="hist-empty"><div style="font-size:2rem">🌊</div><p>No simulation yet.<br/>Run a solve to see full step history.</p></div>';

  victoryBanner.classList.add('hidden');
  clearError();

  colA.classList.remove('active','goal-reached','jugB');
  colB.classList.remove('active','goal-reached','jugB');

  flowPipe.style.height = '0';
  flowPipe.classList.remove('active');
  flowLabel.classList.remove('visible');
  [drip1, drip2, drip3].forEach(d => d.classList.remove('active'));

  clearBubbles(bubA);
  clearBubbles(bubB);
  tickA.innerHTML = '';
  tickB.innerHTML = '';

  prevBtn.disabled = nextBtn.disabled = autoBtn.disabled = true;
  totalStepsEl.textContent = currentStepDisp.textContent = '—';
  statusDisp.textContent = '—';
  statusDisp.style.color = '';
  liveBadge.innerHTML = '<span class="live-dot"></span> Ready';
});

/* ═══════════════════════════════
   CONFETTI 🎉
═══════════════════════════════ */
function launchConfetti() {
  const palette = [
    '#38bdf8','#818cf8','#34d399','#fbbf24','#fb923c',
    '#f472b6','#a3e635','#60a5fa','#c084fc'
  ];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-p';
      const sz = 6 + Math.random() * 10;
      el.style.cssText = `
        left:${Math.random() * 100}vw;
        top:-15px;
        width:${sz}px; height:${sz}px;
        background:${palette[Math.floor(Math.random()*palette.length)]};
        animation-duration:${1.2 + Math.random() * 1.6}s;
        animation-delay:${Math.random() * 0.8}s;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }, i * 20);
  }
}

/* ═══════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  switch (e.key) {
    case 'ArrowRight':
    case 'n': nextBtn.click(); break;
    case 'ArrowLeft':
    case 'p': prevBtn.click(); break;
    case ' ':
      e.preventDefault();
      if (!autoBtn.disabled) autoBtn.click();
      break;
    case 'r':
    case 'R': resetBtn.click(); break;
  }
});

/* ═══════════════════════════════
   INIT
═══════════════════════════════ */
prevBtn.disabled = nextBtn.disabled = autoBtn.disabled = true;
