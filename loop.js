'use strict';
/* The Research Loop: six stations on a ring inside a frozen task; a stage shows what each step does to one training step. */
(() => {
  const root = document.querySelector('.workflow');
  if (!root) return;
  const steps = [
    {name:'Profile', title:'Find the real bottleneck.', description:'Profile the best current version, narrowing from stage to module to operation to kernel. Name the top hotspot before changing code.', output:'A localized bottleneck and a testable hypothesis.'},
    {name:'Edit', title:'Change one thing well.', description:'Attack one bottleneck class at a time. Keep the change behind a switch, off by default, so its effect can be isolated and compared.', output:'One controlled edit, ready for a timing screen.'},
    {name:'Screen', title:'Is the gain worth checking?', description:'Measure the candidate with bench.py time, adding a quick check when needed. Run the full check once timing reaches the target; otherwise, record the result and iterate.', output:'A timing result that determines the next step.'},
    {name:'Check', title:'Let the evidence decide.', description:'Run bench.py check against the frozen judge. It checks structure, benefit, bitwise agreement and statistical consistency; the judge remains read-only to the agent.', output:'check.json: PASS, no_benefit or INCORRECT.'},
    {name:'Log', title:'Keep every experiment.', description:'Record the profile, code change and result in WORK_LOG. Failed checks and no-gain rounds matter, too: their feedback guides the next experiment.', output:'A resumable record of what changed and what happened.'},
    {name:'Next', title:'A better next question.', description:'Use the recorded evidence to choose the next experiment. Stop at a verified PASS that meets the target, or when profiling identifies a ceiling.', output:'Another focused round — or a documented stopping point.'}
  ];
  // One illustrative training step (units of 10 ms) and three scripted rounds of the loop.
  const BASE = [{n:'data', w:5}, {n:'fwd', w:8}, {n:'gemm', w:38}, {n:'attn', w:14}, {n:'norm', w:6}, {n:'copy', w:13}, {n:'opt', w:9}, {n:'comm', w:7}];
  const ROUNDS = [
    {hot:'gemm', what:'fp32 GEMM on SIMT cores', drill:['backward', 'decoder', 'GEMM', 'sgemm · SIMT'], idea:'run the GEMM on tensor cores, keep dgrad exact', sw:'SPLIT_GEMM', code:['y = split_gemm(x)', 'y = gemm_fp32(x)'], change:'split GEMM onto tensor cores', to:{pass:12, miss:34}, outcome:'pass'},
    {hot:'attn', what:'attention bmm + softmax', drill:['forward', 'attention', 'bmm', 'softmax · bmm'], idea:'fuse the softmax into the attention kernel', sw:'FUSED_ATTN', code:['y = fused_attention(q, k, v)', 'y = attention(q, k, v)'], change:'fuse attention softmax', to:{pass:5, miss:11}, outcome:'miss'},
    {hot:'copy', what:'pageable host → device copies', drill:['data', 'loader', 'H2D copy', 'memcpy · pageable'], idea:'prefetch batches into pinned buffers', sw:'PINNED_PREFETCH', code:['batch = prefetch_pinned(loader)', 'batch = next(loader)'], change:'prefetch into pinned buffers', to:{pass:3, miss:11}, outcome:'pass'}
  ];
  const TARGET = 1.10;
  // One knob for the whole loop: dwell per step, the comet's travel and every stage animation.
  const SPEED = 2.2;
  const DWELL = [4600, 4400, 4200, 4800, 3800, 3800].map(ms => ms / SPEED);
  const ANG = [-90, -30, 30, 90, 150, 210];
  const SIDE = ['top', 'right', 'right', 'bottom', 'left', 'left'];
  const ICONS = [
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M8 13v-2M10.5 13V8M13 13v-3.5"/>',
    '<rect x="2.5" y="7.5" width="19" height="9" rx="4.5"/><circle cx="16.5" cy="12" r="2.6"/>',
    '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M9.5 3h5M12 3v3.5M18 6.5l1.5-1.5"/>',
    '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3M9.5 16l1.8 1.8 3.2-3.6"/>',
    '<path d="M6 3h11a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 17 21H6Z"/><path d="M6 3v18M9.5 8h5.5M9.5 12h5.5M9.5 16h3.5"/>',
    '<path d="M5 20V12a5 5 0 0 1 5-5h9"/><path d="m16 4 3 3-3 3"/><path d="M5 20h0"/>'
  ];
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const C = 320, R = 190, RF = 292;
  const pt = (deg, r = R) => [C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180)];
  const f1 = n => Number(n.toFixed(1));

  const ring = root.querySelector('.ring');
  const ringWrap = root.querySelector('.ring-wrap');
  const stationsHost = root.querySelector('.stations');
  const stage = root.querySelector('.stage');
  const panel = root.querySelector('.wf-panel');
  const play = root.querySelector('.wf-play');
  const announcement = root.querySelector('#wf-announcement');
  const center = {round: root.querySelector('.rc-round'), time: root.querySelector('.rc-time'), spark: root.querySelector('.rc-spark')};

  /* ---- Ring drawing ---- */
  const make = (name, attrs, parent = ring) => { const el = document.createElementNS(NS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); parent.append(el); return el; };
  const defs = make('defs', {});
  const glow = make('radialGradient', {id: 'ring-glow'}, defs);
  make('stop', {offset: 0, 'stop-color': '#c8361f', 'stop-opacity': .07}, glow); make('stop', {offset: 1, 'stop-color': '#c8361f', 'stop-opacity': 0}, glow);
  make('circle', {class: 'glow', cx: C, cy: C, r: R - 6});
  make('circle', {class: 'frozen', cx: C, cy: C, r: RF});
  const ticks = make('g', {class: 'ticks'});
  for (let a = 0; a < 360; a += 6) {
    if (ANG.some(s => Math.abs(((a - s + 540) % 360) - 180) < 9)) continue;
    const [x0, y0] = pt(a, R + 9), [x1, y1] = pt(a, R + (a % 30 === 0 ? 17 : 13));
    make('line', {x1: f1(x0), y1: f1(y0), x2: f1(x1), y2: f1(y1)}, ticks);
  }
  const arcD = i => { const [x0, y0] = pt(ANG[i]), [x1, y1] = pt(ANG[i] + 60); return `M${f1(x0)} ${f1(y0)}A${R} ${R} 0 0 1 ${f1(x1)} ${f1(y1)}`; };
  const [sx, sy] = pt(ANG[2]), [lx, ly] = pt(ANG[4]);
  const chordD = `M${f1(sx)} ${f1(sy)}Q${C} ${C + 148} ${f1(lx)} ${f1(ly)}`;
  const base = ANG.map((_, i) => make('path', {class: 'track', d: arcD(i)}));
  const chord = make('path', {class: 'chord', d: chordD});
  const segs = {};
  ANG.forEach((_, i) => { segs[`a${i}`] = make('path', {class: 'seg-hot', d: arcD(i)}); });
  segs.chord = make('path', {class: 'seg-hot', d: chordD});
  Object.values(segs).forEach(p => { p.len = p.getTotalLength(); p.style.strokeDasharray = `${p.len} ${p.len}`; p.style.strokeDashoffset = p.len; });
  const comet = make('g', {class: 'comet'});
  make('circle', {class: 'comet-halo', r: 15}, comet); make('circle', {class: 'comet-core', r: 6.5}, comet);
  const ROUTES = {'0>1': ['a0'], '1>2': ['a1'], '2>3': ['a2'], '3>4': ['a3'], '2>4': ['chord'], '4>5': ['a4'], '5>0': ['a5']};

  /* ---- Stations ---- */
  const buttons = steps.map((step, i) => {
    const [x, y] = pt(ANG[i]);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'st'; button.dataset.step = i;
    button.style.setProperty('--x', (x / 640 * 100).toFixed(3)); button.style.setProperty('--y', (y / 640 * 100).toFixed(3));
    button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-controls', 'wf-detail');
    button.setAttribute('aria-label', `Step ${i + 1}: ${step.name}`);
    button.innerHTML = `<span class="st-node"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[i]}</svg></span><span class="st-label lab-${SIDE[i]}" aria-hidden="true"><span class="st-name">${step.name}</span></span>`;
    stationsHost.append(button);
    return button;
  });

  /* ---- Round state ---- */
  const total = blocks => blocks.reduce((s, b) => s + b.w, 0);
  let r = 0, outcome = ROUNDS[0].outcome, baseline = BASE, history = [], best = [total(BASE)];
  let active = 0, playing = false, userPaused = false, timer = 0, travel = 0, travelling = [];
  const visited = new Set();
  const candidate = () => baseline.map(b => b.n === ROUNDS[r].hot ? {...b, w: ROUNDS[r].to[outcome], from: b.w} : b);
  const ms = blocks => Math.round(total(blocks) * 10);
  const speedup = () => total(baseline) / total(candidate());
  const last = () => r === ROUNDS.length - 1;

  /* ---- Stage: what each step does to the training step ---- */
  const axis = '<div class="axis"><span></span><div><span>0</span><span>250</span><span>500</span><span>750</span><span>1000 ms</span></div><span></span></div>';
  function row(kind, name, sub, blocks, {hot = '', hotCls = 'hot', extra = '', inner = () => '', cls = '', msAttrs = '', msText} = {}) {
    return `<div class="tl ${kind} ${cls}"><span class="tl-name">${name}<small${kind === 'cand' ? ' class="on"' : ''}>${sub}</small></span>`
      + `<div class="tl-track">${blocks.map((b, k) => `<i class="${b.n === hot ? hotCls : ''}" style="--w:${b.w}${b.from != null && b.n === hot ? `;--from:${b.from}` : ''}">${inner(b, k)}</i>`).join('')}${extra}</div>`
      + `<b class="tl-ms"${msAttrs}>${msText ?? `${ms(blocks)} ms`}</b></div>`;
  }
  const hexFor = seed => { let s = seed * 9301 + 49297; return Array.from({length: 20}, () => (s = (s * 9301 + 49297) % 233280, '0123456789abcdef'[s % 16])).join(''); };
  const SCENES = [
    () => {
      const R0 = ROUNDS[r], sum = total(baseline), hot = baseline.find(b => b.n === R0.hot);
      let start = 0; for (const b of baseline) { if (b.n === R0.hot) break; start += b.w; }
      const share = Math.round(hot.w / sum * 100);
      const inner = (b, k) => (b.w / sum >= .08 ? `<span class="share" style="--k:${k}">${Math.round(b.w / sum * 100)}%</span>` : '')
        + (b.n === R0.hot ? `<span class="callout${start / sum > .45 ? ' flip' : ''}">hotspot · <b>${R0.what}</b> · ${share}% of the step</span>` : '');
      return axis + row('ref', 'baseline', 'profiled', baseline, {hot: R0.hot, hotCls: 'hot heat', inner, extra: `<span class="lens" style="--end:${sum}"></span>`})
        + `<div class="ov"><div class="drill">${R0.drill.map(d => `<span>${d}</span>`).join('→')}</div><p class="hypo">hypothesis → ${R0.idea}</p></div>`;
    },
    () => {
      const R0 = ROUNDS[r], cand = candidate();
      return axis + row('ref', 'reference', 'switch off', baseline, {hot: R0.hot})
        + row('cand', 'candidate', '<span class="flip-on">switch on</span>', cand, {hot: R0.hot, hotCls: 'patched shrink', cls: 'slide-in', msAttrs: ` data-count-from="${ms(baseline)}" data-count-to="${ms(cand)}" data-delay="1700" data-dur="1000"`})
        + `<div class="ov"><div class="diff"><span class="ln" style="--k:0">  def step(x):</span><span class="ln add" style="--k:1">+   <span class="kw">if</span> switch("${R0.sw}"):   <em># default off</em></span><span class="ln add" style="--k:2">+       ${R0.code[0]}</span><span class="ln add" style="--k:3">+   <span class="kw">else</span>:</span><span class="ln" style="--k:4">        ${R0.code[1]}</span></div></div>`;
    },
    () => {
      const R0 = ROUNDS[r], cand = candidate(), sb = total(baseline), sc = total(cand), dur = 2.4, dc = dur * sc / sb, s = speedup().toFixed(2);
      return axis + row('ref', 'reference', 'bench.py time', baseline, {hot: R0.hot, extra: `<span class="ph" style="--end:${sb};--dur:${dur}s"></span>`, msAttrs: ` data-count-from="0" data-count-to="${ms(baseline)}" data-delay="300" data-dur="${dur * 1000}"`})
        + row('cand', 'candidate', 'bench.py time', cand, {hot: R0.hot, hotCls: 'patched', extra: `<span class="ph" style="--end:${sc};--dur:${dc.toFixed(2)}s"></span><span class="target" style="--t:${(sb / TARGET).toFixed(2)}"><span>target</span></span>`, msAttrs: ` data-count-from="0" data-count-to="${ms(cand)}" data-delay="300" data-dur="${Math.round(dc * 1000)}"`})
        + `<div class="ov">${outcome === 'pass'
          ? `<span class="verdict pass" style="--at:2.9s"><b>${s}×</b> ≥ ${TARGET.toFixed(2)}× target → run the full check</span>`
          : `<span class="verdict miss" style="--at:2.9s"><b>${s}×</b> &lt; ${TARGET.toFixed(2)}× target → log it, skip the full check</span>`}</div>`;
    },
    () => {
      const R0 = ROUNDS[r], cand = candidate();
      const rows = axis + row('ref', 'reference', 'outputs', baseline, {hot: R0.hot, cls: 'dim'}) + row('cand', 'candidate', 'outputs', cand, {hot: R0.hot, hotCls: 'patched', cls: 'dim'});
      const gates = [['Structure', 'same interface'], ['Benefit', '≥ minimum bar'], ['Bitwise', 'records match'], ['Statistical', 'seeds in band']]
        .map(([name, note], k) => `<div class="gate" style="--k:${k}"><b>${name}</b><span>${note} <em>✓</em></span></div>`).join('');
      if (outcome !== 'pass') return rows + `<div class="ov"><div class="judge skipped"><div class="judge-lock">${LOCK}<span>frozen judge</span></div><div class="gates">${gates}</div></div><p class="skip-note">Not run on this path: timing was <b>below target</b>, so the round goes straight to the log.</p></div>`;
      const hex = hexFor(r + 3), chars = hex.match(/.{1,4}/g).join(' ');
      const reveal = text => [...text].map((c, k) => `<i style="--k:${k}">${c}</i>`).join('');
      return rows + `<div class="ov"><div class="judge"><div class="judge-lock">${LOCK}<span>frozen judge</span></div><div class="gates">${gates}</div><div class="compare"><span>ref</span><span class="hx">${reveal(chars)}</span><span>cand</span><span class="hx">${reveal(chars)}</span></div></div></div><div class="stamp">PASS<small>check.json</small></div>`;
    },
    () => {
      const R0 = ROUNDS[r], s = speedup().toFixed(2);
      const older = [...history].reverse().slice(0, 2);
      if (older.length < 2) older.push({no: 0, change: 'reference profiled', text: `${ms(BASE)} ms · baseline`});
      const note = (n, cls, k = 0) => `<div class="note ${cls}" style="--k:${k}"><b>R${n.no}</b><span>${n.change}</span><span class="res${n.pass === false ? ' bad' : ''}">${n.text ?? `${n.s.toFixed(2)}× · ${n.pass ? 'PASS' : 'below target'}`}</span></div>`;
      return axis + row('ref', 'reference', '', baseline, {hot: R0.hot, cls: 'dim'}) + row('cand', 'candidate', '', candidate(), {hot: R0.hot, hotCls: 'patched', cls: 'dim'})
        + `<div class="ov"><div class="notes">${note({no: r + 1, change: R0.change, s: Number(s), pass: outcome === 'pass'}, 'new')}${older.slice(0, 2).map((n, k) => note(n, 'old', k)).join('')}</div></div>`;
    },
    () => {
      const R0 = ROUNDS[r], cand = candidate(), pass = outcome === 'pass';
      const rows = pass
        ? axis + row('ref', 'baseline', 'new', cand, {hot: R0.hot, hotCls: 'tuned', cls: 'promote'}) + row('ref', 'previous', 'retired', baseline, {cls: 'ghost demote'})
        : axis + row('ref', 'baseline', 'kept', baseline, {hot: R0.hot}) + row('cand', 'candidate', 'discarded', cand, {hot: R0.hot, hotCls: 'patched', cls: 'discard'});
      const stop = last();
      const goText = stop ? (pass ? 'target met → final full check, release with the evidence' : 'profiled ceiling: alternatives measured slower')
        : (pass ? 'profile the new baseline for the next bottleneck' : 'keep the baseline, try the next hypothesis');
      return rows + `<div class="ov"><div class="fork"><div class="${stop ? '' : 'go'}"><b>↻ continue</b> ${stop ? 'another round' : goText}</div><div class="${stop ? 'go' : ''}"><b>■ stop</b> ${stop ? goText : 'at a verified target, or a profiled ceiling'}</div></div></div>`;
    }
  ];
  function count(el) {
    const from = Number(el.dataset.countFrom), to = Number(el.dataset.countTo);
    if (reduced.matches) { el.textContent = `${to} ms`; return; }
    const delay = Number(el.dataset.delay || 0) / SPEED, dur = Number(el.dataset.dur || 1000) / SPEED, start = performance.now() + delay;
    el.textContent = `${from} ms`;
    const frame = now => {
      const t = Math.max(0, Math.min(1, (now - start) / dur));
      el.textContent = `${Math.round(from + (to - from) * t)} ms`;
      if (t < 1 && el.isConnected) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---- Center readout ---- */
  function paintCenter() {
    center.round.textContent = String(r + 1).padStart(2, '0');
    const preview = active === 5 && outcome === 'pass';
    center.time.innerHTML = preview ? `${ms(baseline)} → <b>${ms(candidate())}</b> ms` : `${ms(baseline)} ms`;
    const values = preview ? [...best, total(candidate())] : best;
    const x = i => 4 + i * (112 / 3), y = v => 4 + (100 - v) / 45 * 26;
    center.spark.innerHTML = `<line class="base" x1="0" x2="120" y1="${y(100)}" y2="${y(100)}"/><polyline points="${values.map((v, i) => `${x(i)},${f1(y(v))}`).join(' ')}"/>${values.map((v, i) => `<circle cx="${x(i)}" cy="${f1(y(v))}" r="${i === values.length - 1 ? 3.2 : 2.2}"/>`).join('')}`;
  }

  /* ---- Showing a step ---- */
  const restart = (el, cls, on = true) => { el.classList.remove(cls); if (on) { void el.offsetWidth; el.classList.add(cls); } };
  function paintOutcome() {
    root.dataset.outcome = outcome;
    root.querySelectorAll('.wf-scenario [data-scenario]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scenario === outcome)));
    base[2].classList.toggle('is-off', outcome === 'miss'); base[3].classList.toggle('is-off', outcome === 'miss');
    buttons[3].classList.toggle('is-skipped', outcome === 'miss');
  }
  function show(index, announce = false) {
    active = index;
    visited.add(index);
    root.dataset.step = index;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.classList.toggle('is-done', visited.has(i) && i !== index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    const data = steps[index];
    root.querySelector('#wf-step-count').textContent = `Step ${String(index + 1).padStart(2, '0')} / 06`;
    root.querySelector('#wf-step-name').textContent = `${data.name} · round ${r + 1}`;
    root.querySelector('#wf-detail-title').textContent = data.title;
    root.querySelector('#wf-description').textContent = data.description;
    root.querySelector('#wf-output').textContent = index === 2 ? (outcome === 'pass' ? 'Timing target reached → continue to the frozen judge.' : 'Below the timing target → log the round without a full check.') : data.output;
    root.querySelector('#wf-path-label').textContent = outcome === 'miss' ? 'Below target: Screen → Log → Next → Profile.' : 'Target reached: Screen → Check → Log → Next.';
    root.querySelector('#wf-next').innerHTML = `${index === 5 ? 'Next round' : 'Next step'} <span aria-hidden="true">→</span>`;
    restart(panel, 'is-swapping', !reduced.matches);
    stage.innerHTML = SCENES[index]();
    stage.getAnimations?.({subtree: true}).forEach(animation => { animation.playbackRate = SPEED; });
    stage.querySelectorAll('[data-count-to]').forEach(count);
    paintCenter();
    if (announce) announcement.textContent = `Step ${index + 1}, ${data.name}: ${data.title} ${data.description}`;
    schedule();
  }
  const nextIndex = () => active === 2 && outcome === 'miss' ? 4 : (active + 1) % steps.length;
  function newRound() {
    const passed = outcome === 'pass';
    history.push({no: r + 1, change: ROUNDS[r].change, s: speedup(), pass: passed});
    if (last()) { r = 0; baseline = BASE; history = []; best = [total(BASE)]; }
    else { if (passed) baseline = candidate().map(({n, w}) => ({n, w})); best.push(total(baseline)); r++; }
    outcome = ROUNDS[r].outcome;
    visited.clear();
    restart(center.round, 'tick', !reduced.matches);
    Object.values(segs).forEach(p => { p.classList.add('is-fading'); });
    setTimeout(() => Object.values(segs).forEach(p => { if (!p.lit) { p.style.strokeDashoffset = p.len; p.classList.remove('is-fading'); } }), 650);
    Object.values(segs).forEach(p => { p.lit = false; });
    paintOutcome();
  }
  function cancelTravel() {
    if (!travel) return;
    cancelAnimationFrame(travel); travel = 0;
    comet.classList.remove('is-on');
    travelling.forEach(p => { p.lit = false; p.style.strokeDashoffset = p.len; });
  }
  function travelAlong(ids, done) {
    const paths = travelling = ids.map(id => segs[id]);
    const length = paths.reduce((s, p) => s + p.len, 0), duration = 900 / SPEED, start = performance.now();
    paths.forEach(p => { p.lit = true; p.classList.remove('is-fading'); });
    comet.classList.add('is-on');
    const frame = now => {
      const t = Math.min(1, (now - start) / duration), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      let d = e * length;
      for (const p of paths) {
        const local = Math.max(0, Math.min(p.len, d));
        p.style.strokeDashoffset = p.len - local;
        if (d >= 0 && d <= p.len) { const q = p.getPointAtLength(local); comet.setAttribute('transform', `translate(${q.x} ${q.y})`); }
        d -= p.len;
      }
      if (t < 1) { travel = requestAnimationFrame(frame); return; }
      travel = 0; comet.classList.remove('is-on'); done();
    };
    travel = requestAnimationFrame(frame);
  }
  function advance(announce = false) {
    const to = nextIndex(), ids = ROUTES[`${active}>${to}`];
    const arrive = () => { if (to === 0) newRound(); show(to, announce); };
    cancelTravel(); clearTimeout(timer);
    if (ids && !reduced.matches) travelAlong(ids, arrive); else arrive();
  }
  function schedule() {
    clearTimeout(timer);
    if (playing && !travel) timer = setTimeout(() => advance(), DWELL[active]);
  }
  function syncButton() {
    play.setAttribute('aria-pressed', String(playing));
    play.innerHTML = playing ? '<span aria-hidden="true">Ⅱ</span> Pause' : '<span aria-hidden="true">▶</span> Play the loop';
  }
  function start() {
    if (playing || reduced.matches) return;
    playing = true; userPaused = false; syncButton();
    if (active === 3 && outcome === 'miss') show(4); else schedule();
  }
  function stop(byUser) {
    if (byUser) userPaused = true;
    if (!playing) return;
    playing = false; clearTimeout(timer); syncButton();
  }

  buttons.forEach((button, i) => button.addEventListener('click', () => { cancelTravel(); stop(true); show(i, true); }));
  root.querySelector('#wf-next').addEventListener('click', () => { stop(true); advance(true); });
  play.addEventListener('click', () => playing ? stop(true) : (userPaused = false, start()));
  root.querySelectorAll('.wf-scenario [data-scenario]').forEach(button => button.addEventListener('click', () => {
    cancelTravel(); stop(true);
    outcome = button.dataset.scenario;
    paintOutcome();
    show(2, true);
    announcement.textContent = outcome === 'miss' ? 'Below target: skip the full check, log the round, and choose the next experiment.' : 'Timing target reached: continue to the full check.';
  }));
  // Autoplay while the ring crosses the middle of the viewport; pause otherwise.
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !userPaused && !document.hidden) start(); else stop(false);
  }, {rootMargin: '-30% 0px -30% 0px'}).observe(ringWrap);
  new IntersectionObserver(entries => root.classList.toggle('is-in-view', entries[0].isIntersecting)).observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(false); });
  reduced.addEventListener('change', () => { if (reduced.matches) stop(false); });

  paintOutcome(); show(0);
})();

/* A real agent session: best-so-far step line, every candidate marked, the notebook in lockstep. */
(() => {
  const root = document.querySelector('.session');
  if (!root) return;
  const svg = root.querySelector('.session-chart');
  const list = root.querySelector('.notebook');
  const replay = root.querySelector('.session-replay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  // From the RAE task session in the launch video. R1 measured faster but failed the judge; its marker shows the rejected candidate.
  const rounds = [
    {r:'R0', ms:989.38, kind:'ref', label:'reference 989.38', log:['baseline · fp32 GEMMs on SIMT cores', '→ 989.38 ms/step']},
    {r:'R1', ms:385, kind:'bad', label:'faster, but INCORRECT', log:['global TF32', '✗ INCORRECT · recon_total +0.009 > δ 0.0086'], res:'bad'},
    {r:'R2', ms:522.73, kind:'scr', label:'screened 522.73', log:['per-GEMM precision · dgrad kept fp32', '→ 522.73 ms · 3-seed screen equivalent']},
    {r:'R3', ms:458.59, kind:'pass', label:'458.59', log:['dgrad as 3 × TF32 hi/lo split', '✓ 458.59 ms · full check PASS'], res:'ok'},
    {r:'R4', ms:408.33, kind:'pass', label:'408.33', log:['pad decoder seq 257 → 264 + key mask', '✓ 408.33 ms · PASS'], res:'ok'},
    {r:'R5', ms:394.98, kind:'pass', label:'394.98', log:['pad discriminator seq 785 → 792', '✓ 394.98 ms · PASS'], res:'ok'},
    {r:'R6', ms:357.19, kind:'pass', label:'357.19', log:['compile LPIPS + frozen DINO blocks', '✓ 357.19 ms · PASS'], res:'ok'}
  ];
  // The video's log jumps from R6 to "R8"; R7 is not shown anywhere we can check, so the closing profile is labelled "end".
  const tail = {r:'end', log:['profile: GEMM 49% · attention bmm 14% · copies 8%', '→ alternatives measured slower → stop']};
  const X0 = 64, X1 = 690, Y0 = 356, Y1 = 26;
  const x = i => X0 + (X1 - X0) * i / (rounds.length - 1);
  const y = v => Y0 - v / 1000 * (Y0 - Y1);
  const make = (name, attrs, parent = svg) => { const el = document.createElementNS(NS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); parent.append(el); return el; };
  const defs = make('defs', {});
  const grad = make('linearGradient', {id: 'sx-area', x1: 0, y1: 0, x2: 0, y2: 1}, defs);
  make('stop', {offset: 0, 'stop-color': '#c8361f', 'stop-opacity': .16}, grad); make('stop', {offset: 1, 'stop-color': '#c8361f', 'stop-opacity': 0}, grad);
  const clip = make('clipPath', {id: 'sx-clip'}, defs);
  const clipRect = make('rect', {x: X0 - 8, y: 0, width: X1 - X0 + 16, height: 420}, clip);
  clipRect.style.transformBox = 'fill-box'; clipRect.style.transformOrigin = 'left'; clipRect.style.transition = 'transform .8s cubic-bezier(.2,.75,.1,1)';
  const grid = make('g', {class: 'sx-grid'});
  [0, 250, 500, 750, 1000].forEach(v => { make('line', {x1: X0, x2: X1, y1: y(v), y2: y(v)}, grid); make('text', {x: X0 - 14, y: y(v) + 4, 'text-anchor': 'end'}, grid).textContent = v; });
  const xs = make('g', {class: 'sx-x'});
  rounds.forEach((round, i) => { make('text', {x: x(i), y: Y0 + 26, 'text-anchor': 'middle'}, xs).textContent = round.r; });
  // Best-so-far as a staircase: only judged improvements lower it.
  let best = rounds[0].ms, d = `M${X0} ${y(best)}`, area = `M${X0} ${Y0}L${X0} ${y(best)}`;
  const reach = [0];
  let acc = 0;
  rounds.slice(1).forEach((round, k) => {
    const i = k + 1, next = round.kind === 'bad' ? best : Math.min(best, round.ms);
    d += `H${x(i)}V${y(next)}`; area += `H${x(i)}V${y(next)}`;
    acc += (x(i) - x(i - 1)) + Math.abs(y(next) - y(best));
    reach.push(acc); best = next;
  });
  area += `V${Y0}Z`;
  const g = make('g', {'clip-path': 'url(#sx-clip)'});
  make('path', {class: 'sx-area', d: area}, g);
  const line = make('path', {class: 'sx-best', d});
  const length = acc;
  line.style.strokeDasharray = `${length} ${length}`;
  line.style.transition = 'stroke-dashoffset .8s cubic-bezier(.2,.75,.1,1)';
  const points = rounds.map((round, i) => {
    const p = make('g', {class: 'sx-pt'}), px = x(i), py = y(round.ms);
    if (round.kind === 'ref') make('rect', {class: 'ref', x: px - 6, y: py - 6, width: 12, height: 12}, p);
    else if (round.kind === 'bad') {
      make('line', {class: 'sx-drop', x1: px, x2: px, y1: y(989.38) + 6, y2: py - 10}, p);
      make('path', {class: 'bad', d: `M${px - 7} ${py - 7}l14 14m0 -14l-14 14`}, p);
    } else make('circle', {class: round.kind === 'scr' ? 'scr' : 'pass', cx: px, cy: py, r: 6}, p);
    // Labels sit under each marker, clear of the staircase; the reference label sits above.
    const above = round.kind === 'ref';
    make('text', {class: `sx-lbl${round.kind === 'bad' ? ' red' : round.kind === 'pass' ? '' : ' dim'}`, x: above ? px - 6 : px, y: above ? py - 14 : py + 24, 'text-anchor': above ? 'start' : 'middle'}, p).textContent = round.label;
    return p;
  });

  const entries = [...rounds, tail];
  list.innerHTML = entries.map(entry => `<li><b>${entry.r}</b><div><span>${entry.log[0]}</span><span class="res${entry.res ? ` ${entry.res}` : ''}">${entry.log[1]}</span></div></li>`).join('');
  const items = [...list.children];
  let timers = [];
  function showAll() {
    timers.forEach(clearTimeout); timers = [];
    list.classList.remove('is-animated');
    points.forEach(p => p.classList.add('is-on'));
    line.style.strokeDashoffset = 0; clipRect.style.transform = 'none';
  }
  function run() {
    if (reduced.matches) { showAll(); return; }
    timers.forEach(clearTimeout); timers = [];
    list.classList.add('is-animated');
    items.forEach(item => item.classList.remove('is-on', 'is-now'));
    points.forEach(p => p.classList.remove('is-on'));
    line.style.transition = clipRect.style.transition = 'none';
    line.style.strokeDashoffset = length; clipRect.style.transform = 'scaleX(0)';
    void line.getBoundingClientRect();
    line.style.transition = 'stroke-dashoffset .8s cubic-bezier(.2,.75,.1,1)'; clipRect.style.transition = 'transform .8s cubic-bezier(.2,.75,.1,1)';
    entries.forEach((entry, i) => timers.push(setTimeout(() => {
      items.forEach(item => item.classList.remove('is-now'));
      items[i].classList.add('is-on', 'is-now');
      if (points[i]) {
        points[i].classList.add('is-on');
        line.style.strokeDashoffset = length - reach[i];
        clipRect.style.transform = `scaleX(${(x(i) - X0 + 8) / (X1 - X0 + 16)})`;
      }
    }, 300 + i * 900)));
  }
  replay.addEventListener('click', run);
  if (reduced.matches) showAll();
  else {
    run(); timers.forEach(clearTimeout); timers = [];
    new IntersectionObserver((list, observer) => { if (list[0].isIntersecting) { run(); observer.disconnect(); } }, {threshold: .35}).observe(svg);
  }
})();
