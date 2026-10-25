'use strict';
/* Page-level motion: masked headline reveals and figures that sleep off-screen. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const make = (parent, name, attrs) => { const el = document.createElementNS(NS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); parent.append(el); return el; };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Wrap each word of a .split heading in a mask, keeping inline markup (em) intact.
  document.querySelectorAll('.split').forEach(heading => {
    let index = 0;
    const walk = parent => [...parent.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const outer = document.createElement('span'), inner = document.createElement('span');
          outer.className = 'w'; inner.textContent = part; inner.style.setProperty('--wi', index++);
          outer.append(inner); frag.append(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') walk(child);
    });
    walk(heading);
  });

  const once = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in'); once.unobserve(entry.target);
  }), {rootMargin: '0px 0px -10% 0px'});
  document.querySelectorAll('.split, [data-reveal]').forEach(el => {
    if (el.matches('[data-reveal]')) {
      const siblings = [...el.parentElement.children].filter(c => c.matches('[data-reveal]'));
      el.style.setProperty('--rd', `${siblings.indexOf(el) * 90}ms`);
    }
    if (reduced.matches) el.classList.add('is-in'); else once.observe(el);
  });

  // Ambient figures run only while visible.
  const ambient = new Map();
  const ambientObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    const hooks = ambient.get(entry.target);
    if (hooks) entry.isIntersecting && !reduced.matches ? hooks.start() : hooks.stop();
  }), {rootMargin: '60px'});
  document.querySelectorAll('.ambient').forEach(el => ambientObserver.observe(el));
  const loopWhileVisible = (el, draw) => {
    let frame = 0;
    const tick = now => { draw(now); frame = requestAnimationFrame(tick); };
    ambient.set(el, {start() { if (!frame) frame = requestAnimationFrame(tick); }, stop() { cancelAnimationFrame(frame); frame = 0; }});
  };

  /* Fig. 1 — one training step on 8 GPUs; an agent sweeps it and the waiting disappears behind the sweep. */
  const heroFigure = document.querySelector('.hero-figure');
  const canvas = heroFigure?.querySelector('canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const state = heroFigure.querySelector('.hero-state');
    const lanes = Array.from({length: 8}, (_, lane) => {
      let seed = lane * 7919 + 17;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const blocks = []; let t = 0;
      while (t < .9 + rnd() * .08) {
        const stall = rnd() < .2 && blocks.length && !blocks[blocks.length - 1].stall;
        const w = stall ? .03 + rnd() * .07 : .02 + rnd() * .07;
        blocks.push({start: t, w, stall, shade: ['#cfcabf', '#bdb7ab', '#a9a397', '#d9d5cc'][Math.floor(rnd() * 4)]});
        t += w;
      }
      return blocks;
    });
    const baseEnd = Math.max(...lanes.map(l => l[l.length - 1].start + l[l.length - 1].w));
    let w = 0, h = 0, dpr = 1;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); };
    new ResizeObserver(resize).observe(canvas); resize();
    const CYCLE = 11000;
    const draw = now => {
      const p = (now % CYCLE) / CYCLE;
      // hold baseline → sweep → hold boosted → reset
      const scan = p < .18 ? -1 : p < .55 ? (p - .18) / .37 : 2;
      const fade = p > .9 ? ease((p - .9) / .1) : 0;
      const label = scan < 0 ? 'baseline' : scan <= 1 ? 'agent at work' : 'after the loop';
      if (state.textContent !== label) { state.textContent = label; state.classList.toggle('is-boosted', scan > 1); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const left = 54, right = w - 14, top = 26, laneH = (h - top - 30) / 8, barH = Math.min(14, laneH * .58);
      const X = t => left + t / (baseEnd * 1.02) * (right - left);
      ctx.font = '400 10px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
      // time axis
      ctx.fillStyle = '#151412';
      ['0', '¼', '½', '¾', '1 step'].forEach((s, k) => { const x = X(baseEnd * k / 4); ctx.fillRect(x, top - 10, 1, 5); ctx.textAlign = k === 4 ? 'right' : 'center'; ctx.fillText(s, k === 4 ? x + 4 : x, top - 18); });
      let end = 0;
      lanes.forEach((blocks, lane) => {
        const y = top + lane * laneH + (laneH - barH) / 2;
        ctx.textAlign = 'left'; ctx.fillStyle = '#151412'; ctx.fillText(`GPU ${lane}`, 4, y + barH / 2);
        let cursor = 0;
        blocks.forEach(b => {
          // a block is boosted once the sweep has passed it
          const k = Math.max(0, Math.min(1, ((scan * baseEnd) - b.start) / .06)) * (1 - fade);
          const len = b.stall ? b.w * (1 - k) : b.w * (1 - .3 * k);
          if (len > .0005) {
            ctx.fillStyle = b.stall ? '#c8361f' : b.shade;
            ctx.globalAlpha = b.stall ? 1 - .6 * k : 1;
            ctx.fillRect(X(cursor), y, Math.max(0, X(cursor + len) - X(cursor) - 1.2), barH);
            ctx.globalAlpha = 1;
          }
          cursor += len;
        });
        end = Math.max(end, cursor);
      });
      const bottom = top + laneH * 8;
      // step-end markers
      ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.strokeStyle = '#15141255'; ctx.beginPath(); ctx.moveTo(X(baseEnd), top - 4); ctx.lineTo(X(baseEnd), bottom); ctx.stroke();
      if (end < baseEnd - .01) {
        ctx.strokeStyle = '#c8361f'; ctx.beginPath(); ctx.moveTo(X(end), top - 4); ctx.lineTo(X(end), bottom); ctx.stroke();
        ctx.fillStyle = '#c8361f'; ctx.textAlign = 'center';
        ctx.fillText(`${(baseEnd / end).toFixed(2)}× shorter step`, (X(end) + X(baseEnd)) / 2, bottom + 14);
      }
      ctx.setLineDash([]);
      if (scan >= 0 && scan <= 1) {
        const sx = X(scan * baseEnd);
        ctx.fillStyle = '#c8361f22'; ctx.fillRect(sx - 14, top - 4, 14, bottom - top + 4);
        ctx.fillStyle = '#c8361f'; ctx.fillRect(sx - 1, top - 6, 2, bottom - top + 8);
      }
    };
    if (reduced.matches) draw(CYCLE * .7);
    else { loopWhileVisible(heroFigure, draw); draw(0); }
  }

  /* Fig. 2 — the research stack: five planes, a probe that goes all the way down. */
  const stack = document.querySelector('.stack');
  if (stack) {
    const layers = [['Research question', 'what we want to learn'], ['Training recipe', 'losses · schedules · data'], ['System architecture', 'parallelism · memory · I/O'], ['Execution', 'compile · overlap · precision'], ['GPU kernels', 'GEMM · attention · fusion']];
    const cx = 170, hw = 140, hh = 50, gap = 76, top = 66;
    const cy = i => top + i * gap;
    const planes = [];
    for (let i = layers.length - 1; i >= 0; i--) {
      const g = make(stack, 'g', {class: `plane${i === 4 ? ' kernel' : ''}`, style: `--i:${i}`});
      make(g, 'polygon', {class: 'face', points: `${cx},${cy(i) - hh} ${cx + hw},${cy(i)} ${cx},${cy(i) + hh} ${cx - hw},${cy(i)}`});
      const lines = make(g, 'g', {class: 'lines'});
      for (let k = 1; k < 4; k++) {
        const f = k / 4;
        make(lines, 'line', {x1: cx - hw * (1 - f), y1: cy(i) - hh * f, x2: cx + hw * f, y2: cy(i) + hh * (1 - f)});
        make(lines, 'line', {x1: cx + hw * (1 - f), y1: cy(i) - hh * f, x2: cx - hw * f, y2: cy(i) + hh * (1 - f)});
      }
      make(g, 'line', {class: 'leader', x1: cx + hw + 6, y1: cy(i), x2: 336, y2: cy(i)});
      make(g, 'text', {class: 'lvl', x: cx - hw - 4, y: cy(i) + 4, 'text-anchor': 'end'}).textContent = `L${i + 1}`;
      make(g, 'text', {class: 'name', x: 346, y: cy(i) - 3}).textContent = layers[i][0];
      make(g, 'text', {class: 'sub', x: 346, y: cy(i) + 15}).textContent = layers[i][1];
      make(g, 'text', {class: 'tick', x: 552, y: cy(i) - 3, 'text-anchor': 'end'}).textContent = '✓';
      planes[i] = g;
    }
    const probe = make(stack, 'line', {class: 'probe', x1: cx, x2: cx, y1: 6, y2: 6});
    const halo = make(stack, 'circle', {class: 'probe-halo', cx, cy: 6, r: 11});
    const dot = make(stack, 'circle', {class: 'probe-dot', cx, cy: 6, r: 5});
    const finish = cy(4);
    const setTip = yy => { probe.setAttribute('y2', yy); dot.setAttribute('cy', yy); halo.setAttribute('cy', yy); planes.forEach((p, i) => p.classList.toggle('is-hit', yy >= cy(i) - 2)); };
    const runProbe = () => {
      const start = performance.now() + 900, dur = 2600;
      const frame = now => {
        const t = Math.max(0, Math.min(1, (now - start) / dur));
        setTip(6 + (finish - 6) * ease(t));
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    if (reduced.matches) { stack.classList.add('is-in'); setTip(finish); }
    else new IntersectionObserver((entries, observer) => { if (entries[0].isIntersecting) { stack.classList.add('is-in'); runProbe(); observer.disconnect(); } }, {threshold: .4}).observe(stack);
  }

  /* § 06 — the loop, nested: agent → infrastructure → research, each turn handing a pulse outward. */
  const orbits = document.querySelector('.orbits');
  if (orbits) {
    const svg = orbits.querySelector('svg');
    const C = 260;
    const rings = [{r: 84, name: 'agent', speed: .9}, {r: 158, name: 'infrastructure', speed: .5}, {r: 232, name: 'research', speed: .3}];
    const defs = make(svg, 'defs', {});
    rings.forEach((ring, k) => {
      make(svg, 'circle', {class: 'ob-ring', cx: C, cy: C, r: ring.r});
      make(defs, 'path', {id: `ob-path-${k}`, d: `M${C - ring.r - 8} ${C}A${ring.r + 8} ${ring.r + 8} 0 0 1 ${C + ring.r + 8} ${C}`, fill: 'none'});
      const label = make(svg, 'text', {class: 'ob-label'});
      make(label, 'textPath', {href: `#ob-path-${k}`, startOffset: '25%', 'text-anchor': 'middle'}).textContent = ring.name;
      ring.stops = Array.from({length: 6}, (_, i) => {
        const a = (-90 + i * 60) * Math.PI / 180;
        return make(svg, 'circle', {class: 'ob-stop', cx: C + ring.r * Math.cos(a), cy: C + ring.r * Math.sin(a), r: 4});
      });
      ring.trail = make(svg, 'path', {class: 'ob-trail', stroke: `url(#ob-trail-${k})`, 'stroke-width': 3});
      ring.comet = make(svg, 'circle', {class: 'ob-comet', r: 5.5});
      ring.angle = -Math.PI / 2 - k * 1.3;
    });
    rings.forEach((ring, k) => {
      const grad = make(defs, 'linearGradient', {id: `ob-trail-${k}`, gradientUnits: 'userSpaceOnUse'});
      make(grad, 'stop', {offset: 0, 'stop-color': '#c8361f', 'stop-opacity': 0}); make(grad, 'stop', {offset: 1, 'stop-color': '#c8361f', 'stop-opacity': .9});
      ring.grad = grad;
    });
    const core = make(svg, 'text', {class: 'ob-core', x: C, y: C + 17, 'text-anchor': 'middle'}); core.textContent = 'AI';
    const pulses = [];
    let last = 0;
    const draw = now => {
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      rings.forEach((ring, k) => {
        const before = ring.angle;
        ring.angle += ring.speed * dt;
        // crossing the top hands a pulse to the next ring out
        const top = -Math.PI / 2;
        const turns = a => Math.floor((a - top) / (2 * Math.PI));
        if (k < rings.length - 1 && turns(ring.angle) > turns(before)) pulses.push({k, a: top, t: 0});
        const a = ring.angle, x = C + ring.r * Math.cos(a), y = C + ring.r * Math.sin(a);
        ring.comet.setAttribute('cx', x.toFixed(1)); ring.comet.setAttribute('cy', y.toFixed(1));
        const a0 = a - 1.1, x0 = C + ring.r * Math.cos(a0), y0 = C + ring.r * Math.sin(a0);
        ring.trail.setAttribute('d', `M${x0.toFixed(1)} ${y0.toFixed(1)}A${ring.r} ${ring.r} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`);
        ring.grad.setAttribute('x1', x0.toFixed(1)); ring.grad.setAttribute('y1', y0.toFixed(1)); ring.grad.setAttribute('x2', x.toFixed(1)); ring.grad.setAttribute('y2', y.toFixed(1));
        ring.stops.forEach((stop, i) => {
          const sa = (-90 + i * 60) * Math.PI / 180;
          const d = Math.abs(Math.atan2(Math.sin(a - sa), Math.cos(a - sa)));
          stop.style.fill = d < .12 ? '#c8361f' : '';
        });
      });
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += dt / .9;
        if (!p.el) p.el = make(svg, 'circle', {class: 'ob-pulse', r: 3.5});
        const r = rings[p.k].r + (rings[p.k + 1].r - rings[p.k].r) * ease(Math.min(1, p.t));
        p.el.setAttribute('cx', (C + r * Math.cos(p.a)).toFixed(1)); p.el.setAttribute('cy', (C + r * Math.sin(p.a)).toFixed(1));
        p.el.style.opacity = Math.min(1, (1 - p.t) * 4).toFixed(2);
        if (p.t >= 1) { p.el.remove(); pulses.splice(i, 1); }
      }
    };
    if (reduced.matches) draw(0);
    else { loopWhileVisible(orbits, draw); draw(0); }
  }
})();
