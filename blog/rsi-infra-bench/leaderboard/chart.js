/* Speedup-over-time chart for the RBB timeline pages. Data: JSON in <script id=data>.
   Either one dataset {series, focus, xmax, aria} or, on the overview, {tasks: {key: dataset+{name, cap, page}}, order, first}. */
(function () {
  const de = document.getElementById('data'), el = document.getElementById('chart'), tip = document.getElementById('tip');
  if (!de || !el) return;
  const ALL = JSON.parse(de.textContent);
  const multi = !!ALL.tasks;
  let D, S, byK, svg, cur;
  const fmt = v => v.toFixed(2) + '×';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const show = (e, h) => {
    tip.innerHTML = h; tip.style.display = 'block';
    const w = tip.offsetWidth, hh = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + hh > innerHeight - 8) y = e.clientY - hh - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  };
  const hide = () => { tip.style.display = 'none'; };
  const hl = k => {
    if (!svg) return;
    svg.classList.toggle('hl', !!k);
    svg.querySelectorAll('.sr').forEach(g => g.classList.toggle('on', g.dataset.k === k));
    document.querySelectorAll('.chip[data-k]').forEach(c => c.classList.toggle('on', c.dataset.k === k));
  };
  function bindChips() {
    document.querySelectorAll('.chip[data-k]').forEach(c => {
      c.addEventListener('mouseenter', () => hl(c.dataset.k));
      c.addEventListener('mouseleave', () => hl(null));
    });
  }
  function render() {
    const W = Math.max(280, el.clientWidth - 12), narrow = W < 560;
    const H = Math.round(Math.min(470, Math.max(250, W * 0.5)));
    const L = narrow ? 42 : 54, R = narrow ? 12 : 22, T = 14, B = narrow ? 42 : 48;
    const xmax = D.xmax;
    const vals = S.flatMap(r => r.pts.map(p => p[1]).concat(r.final ? [r.final] : []));
    const ymx = Math.max(1.2, ...vals);
    const step = ymx <= 1.6 ? 0.1 : ymx <= 2.6 ? 0.25 : ymx <= 4.5 ? 0.5 : 1;
    const ymax = Math.ceil((ymx + 0.02) / step) * step, ymin = 1;
    const x = h => L + h / xmax * (W - L - R), y = v => T + (ymax - v) / (ymax - ymin) * (H - T - B);
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(D.aria)}">`;
    for (let v = ymin; v <= ymax + 1e-9; v += step) {
      s += `<line class="${Math.abs(v - 1) < 1e-9 ? 'base' : 'g'}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      s += `<text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v.toFixed(step < 0.5 ? 2 : step < 1 ? 1 : 0)}×</text>`;
    }
    const xs = narrow ? 2 : 1;
    for (let h = 0; h <= xmax + 1e-9; h += xs) {
      s += `<line class="gx" x1="${x(h)}" x2="${x(h)}" y1="${T}" y2="${H - B}"/>`;
      s += `<text class="ax" x="${x(h)}" y="${H - B + 18}" text-anchor="middle">${h}</text>`;
    }
    s += `<text class="axl" x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">hours since start</text>`;
    for (const r of S) {
      const dim = D.focus && D.focus !== r.k;
      let d = `M${x(0)} ${y(1)}`;
      for (const p of r.pts) d += `H${x(p[0])}V${y(p[1])}`;
      d += `H${x(r.end)}`;
      s += `<g class="sr${dim ? ' dim' : ''}${D.focus === r.k ? ' foc' : ''}" data-k="${r.k}">`;
      s += `<path class="ln" d="${d}" stroke="${r.color}"/>`;
      s += `<path class="hit" d="${d}" data-k="${r.k}"/>`;
      r.pts.forEach((p, i) => { s += `<circle class="pt" cx="${x(p[0])}" cy="${y(p[1])}" r="3.4" fill="${r.color}" data-k="${r.k}" data-i="${i}"/>`; });
      if (r.final) s += `<circle class="fin" cx="${x(r.end)}" cy="${y(r.final)}" r="5.5" stroke="${r.color}" data-k="${r.k}"/>`;
      s += '</g>';
    }
    s += '</svg>';
    el.innerHTML = s;
    svg = el.querySelector('svg');
    svg.querySelectorAll('.hit,.pt,.fin').forEach(n => {
      const r = byK[n.dataset.k];
      n.addEventListener('mousemove', e => {
        hl(r.k);
        let h = `<b>${esc(r.name)}</b><br>`;
        if (n.classList.contains('pt')) {
          const p = r.pts[+n.dataset.i];
          h += `Round ${p[2]} · ${p[0].toFixed(1)} h<br>self-measured best ${fmt(p[1])}`;
        } else if (n.classList.contains('fin')) {
          h += `judged ${fmt(r.final)}<br>run ended at ${r.end.toFixed(1)} h`;
        } else {
          h += `self-best ${r.pts.length ? fmt(r.pts[r.pts.length - 1][1]) : '—'} · judged ${r.final ? fmt(r.final) : '—'}`;
        }
        if (r.k !== D.focus) h += `<br><span style="color:var(--red)">open the trace →</span>`;
        show(e, h);
      });
      n.addEventListener('mouseleave', () => { hl(null); hide(); });
      n.addEventListener('click', () => { if (r.k !== D.focus && r.href) location.href = r.href; });
    });
  }
  function use(d) {
    D = d;
    S = D.series.slice().sort((a, b) => (a.k === D.focus) - (b.k === D.focus));
    byK = Object.fromEntries(S.map(r => [r.k, r]));
  }
  function select(t, push) {
    if (!ALL.tasks[t]) t = ALL.first;
    cur = t; use(ALL.tasks[t]);
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t ? 'true' : 'false'));
    const set = (id, h) => { const n = document.getElementById(id); if (n) n.innerHTML = h; };
    set('figname', esc(D.name));
    set('cap', D.cap);
    set('chips', [...D.series].sort((a, b) => b.final - a.final).map(r =>
      `<a class="chip" data-k="${r.k}" href="${r.href}"><i style="background:${r.color}"></i>${esc(r.short)}${r.tag ? `<span class="nerf">${esc(r.tag)}</span>` : ''}<small>${fmt(r.final)}</small></a>`).join(''));
    const pg = document.getElementById('taskpage'); if (pg) { pg.href = D.page; pg.textContent = D.name + ' →'; }
    bindChips(); render();
    if (push) history.replaceState(null, '', '#' + t);
  }
  if (multi) {
    document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => select(b.dataset.t, true)));
    select(decodeURIComponent(location.hash.slice(1)) || ALL.first, false);
    addEventListener('hashchange', () => select(decodeURIComponent(location.hash.slice(1)), false));
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const i = ALL.order.indexOf(cur), n = ALL.order.length;
      select(ALL.order[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n], true);
    });
  } else {
    use(ALL); bindChips(); render();
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 120); });
})();
// Arrow keys page through the prev / next links (task and trace pages).
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || document.getElementById('tabs')) return;
  const sel = e.key === 'ArrowLeft' ? '.pager .prev' : e.key === 'ArrowRight' ? '.pager .next' : null;
  const a = sel && document.querySelector(sel);
  if (a && a.href) location.href = a.href;
});
// Leaderboard: hover notes (elements with data-tip; leaves the chart's own tooltip alone) and the trace picker.
(function () {
  const tip = document.getElementById('tip');
  if (tip && document.querySelector('[data-tip]')) {
    let mine = false;
    document.addEventListener('pointermove', e => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { if (mine) { tip.style.display = 'none'; mine = false; } return; }
      mine = true; tip.textContent = t.dataset.tip; tip.style.display = 'block';
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = e.clientX + 14, y = e.clientY + 16;
      if (x + w > innerWidth - 8) x = e.clientX - w - 14;
      if (y + h > innerHeight - 8) y = e.clientY - h - 12;
      tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
    });
  }
  const pt = document.getElementById('pt'), pm = document.getElementById('pm'), go = document.getElementById('pgo');
  if (pt && pm && go) { const up = () => { go.href = 't-' + pt.value + '-' + pm.value + '.html'; }; pt.onchange = up; pm.onchange = up; up(); }
})();
