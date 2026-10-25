'use strict';

// Evidence records are intentionally separate from presentation. Numbers are source-reported.
const projectData = [
  {name:'Faster-NanoChat', short:'NanoChat', domain:'llm', speed:'1.0744', workload:'D24 (~1.384B) · Tensorwise FP8 training', hardware:'8 × H20', scope:'3,358.4 → 3,126.0 ms/update', status:'N1 statistical equivalence', note:'Short steady-state timing excludes compile and warmup. Six-seed short-trajectory PASS; full-schedule BPB/CORE evaluation was not run.'},
  {name:'Faster-YOCO', short:'YOCO', domain:'llm', speed:'2.12', workload:'YOCO-3B pretraining · BF16, no FP8', hardware:'8 × H100 80GB', scope:'Training update speedup', status:'Statistical equivalence', note:'20,000-update run: 1.91× end-to-end (5,345 → 2,799 s), including startup and saves. Not a claim of bitwise-identical losses.'},
  {name:'Faster-LLaVA', short:'LLaVA', domain:'mllm', speed:'2.39', workload:'LLaVA-1.5-7B stage-2 fine-tuning', hardware:'4 × H20', scope:'Stage-2 fine-tuning', status:'Statistical equivalence', note:'Source-reported PASS under the task judge.'},
  {name:'Faster-BAGEL', short:'BAGEL', domain:'mllm', speed:'1.82', workload:'7B-MoT SFT · BF16 compute, no FP8', hardware:'8 × Hopper 80GB', scope:'1.4367 → 0.7873 s/step', status:'Statistical equivalence', note:'2,000 steps × 4 seeds; reference 2σ consistency and held-out VLM CE checks pass. Image-generation quality was not evaluated.'},
  {name:'Faster-R3', short:'R3', domain:'mllm', speed:'1.47', workload:'BAGEL 7B-MoT Tree-RL', hardware:'4 × H200-class', scope:'Rollout + reward + optimizer step', status:'Bitwise identical · 14-step check', note:'16-step timing run; 14 deterministic training records match bitwise. Not a full long-training result.'},
  {name:'Faster-RAE', short:'RAE', domain:'image', speed:'5.32', workload:'Stage-1 decoder + GAN training', hardware:'2 × H200', scope:'Decoder + GAN step time', status:'Statistical equivalence', note:'Not the complete 16-epoch runtime. RAE is a representation autoencoder, not a VAE.'},
  {name:'Faster-DMD', short:'DMD2', domain:'image', speed:'1.72', workload:'DMD2 one-step SD1.5 distillation + GAN', hardware:'4 × H20', scope:'Distillation + GAN', status:'Statistical equivalence', note:'Source-reported PASS under the task judge.'},
  {name:'Faster-JiT', short:'JiT', domain:'image', speed:'1.56', workload:'JiT-B/16 · ImageNet 256 training', hardware:'2 × H200-class', scope:'100.02 → 64.04 ms/step', status:'Statistical equivalence', note:'BF16, no FP8. Separate 40-epoch, single-seed check on 8 × H100: FID50k 39.07 vs 39.24; 600 epochs not run.'},
  {name:'Faster-SelfForcing', short:'Self-Forcing', domain:'video', speed:'2.08', workload:'Self-Forcing video DMD training', hardware:'2 × H200', scope:'Video DMD training', status:'Statistical equivalence', note:'Source-reported PASS under the task judge.'},
  {name:'Faster-RoboTwin', short:'RoboTwin', domain:'embodied', speed:'4.38', estimate:true, workload:'π0.5 policy evaluation · RoboTwin 2.0', hardware:'8 × H20', scope:'Estimated 73.5 → 16.8 h benchmark wall-clock', status:'Compared episodes match bitwise', note:'Seven-task smoke checks, 2–10 episodes/job; the full 10,000-episode run was not performed.'},
  {name:'Faster-Motus', short:'Motus', domain:'embodied', speed:'9.59', workload:'RoboTwin 2.0 fine-tuning · 27,244 episodes', hardware:'8 × B200', scope:'7.468 → 0.779 s/iteration', status:'Bitwise identical · 1,100 iterations', note:'All 8 ranks match across two epoch boundaries: losses, learning rates, batches, validation metrics, final parameters and optimizer state. No full training run or RoboTwin evaluation.'},
  {name:'Faster-FastWAM', short:'FastWAM', domain:'embodied', speed:'3.46', workload:'FastWAM-LIBERO training recipe', hardware:'8 × B200', scope:'1,541.4 → 445.7 ms/iteration', status:'LIBERO evaluation reproduced', note:'LIBERO overall: release checkpoint 97.15%, faster run 96.90%. Not a claim of bitwise equivalence.'}
];
const domains = [
  {id:'llm', name:'LLM'},
  {id:'mllm', name:'MLLM'},
  {id:'image', name:'Image Generation'},
  {id:'video', name:'Video Generation'},
  {id:'embodied', name:'Embodied AI'}
];

document.documentElement.classList.remove('no-js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const repoUrl = project => `https://github.com/AI4AI-for-Anything/${encodeURIComponent(project.name)}`;
{
  const speeds = projectData.map(p => Number(p.speed));
  document.querySelectorAll('[data-total-projects]').forEach(el => { el.textContent = projectData.length; });
  // Speedups are ratios, so the hero reports their geometric mean.
  const mean = Math.exp(speeds.reduce((sum, s) => sum + Math.log(s), 0) / speeds.length);
  document.querySelectorAll('[data-speed-mean]').forEach(el => { el.textContent = mean.toFixed(2); });
  document.querySelectorAll('[data-speed-max]').forEach(el => { el.textContent = Math.max(...speeds).toFixed(2); });
}

/* ---------- Results ladder: every project on one log axis ---------- */
(() => {
  const ladder = document.querySelector('.ladder');
  const filters = document.querySelector('.filters');
  const panel = document.querySelector('.ladder-wrap');
  if (!ladder || !filters || !panel) return;
  const rowsHost = ladder.querySelector('.ladder-rows');
  const MAX = 10;
  const pos = s => Math.log(s) / Math.log(MAX) * 100;
  const domainName = id => domains.find(d => d.id === id).name;
  ladder.querySelector('.ladder-axis').innerHTML = `<div class="l-grid" style="height:100%"><span></span><span>project · hardware</span><div class="ax">${[1, 1.5, 2, 3, 5, 10].map(t => `<span style="left:${pos(t)}%">${t}×</span>`).join('')}</div><span style="text-align:right">speedup</span></div>`;

  const sorted = [...projectData].sort((a, b) => Number(b.speed) - Number(a.speed));
  rowsHost.innerHTML = sorted.map((p, k) => {
    const id = `detail-${p.short.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    return `<div class="lrow" data-domain="${p.domain}"><div>`
      + `<button class="lbtn l-grid" type="button" aria-expanded="false" aria-controls="${id}">`
      + `<span class="l-rank">${String(k + 1).padStart(2, '0')}</span>`
      + `<span class="l-name"><strong>${esc(p.short)}</strong><small><i>${esc(domainName(p.domain))}</i> · ${esc(p.hardware)}</small></span>`
      + `<span class="l-track" aria-hidden="true"><span class="l-line" style="--p:${pos(Number(p.speed)).toFixed(2)};--k:${k}"></span><span class="l-dot${p.estimate ? ' est' : ''}" style="--p:${pos(Number(p.speed)).toFixed(2)};--k:${k}"></span></span>`
      + `<span class="l-val">${Number(p.speed).toFixed(2)}<small>×</small>${p.estimate ? '<span class="sr-only"> estimated</span>' : ''}</span></button>`
      + `<div class="ldetail" id="${id}"><div><div class="ldetail-inner"><a class="text-link" href="${repoUrl(p)}">${esc(p.name)} ↗</a><dl><dt>Workload</dt><dd>${esc(p.workload)}</dd><dt>Measured</dt><dd>${esc(p.speed)}× · ${esc(p.scope)}${p.estimate ? ' (estimated)' : ''}</dd><dt>Correctness</dt><dd>${esc(p.status)}</dd><dt>Notes</dt><dd>${esc(p.note)}</dd></dl></div></div></div>`
      + `</div></div>`;
  }).join('');
  rowsHost.querySelectorAll('.lbtn').forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    document.getElementById(button.getAttribute('aria-controls')).classList.toggle('is-open', open);
  }));

  const choices = [{id:'all', name:'All'}, ...domains];
  filters.innerHTML = choices.map(c => `<button type="button" data-filter="${c.id}" aria-pressed="false" aria-controls="ladder-panel">${esc(c.name)} <small>${c.id === 'all' ? projectData.length : projectData.filter(p => p.domain === c.id).length}</small></button>`).join('')
    + '<span class="filters-hint" aria-hidden="true"><i>↓</i>Click a domain to expand</span>'
    + '<button type="button" class="filters-hide" aria-controls="ladder-panel" hidden>Hide results ↑</button>';
  const hide = filters.querySelector('.filters-hide'), hint = filters.querySelector('.filters-hint');
  // Closed by default, also when reached through #research: only a domain button opens the ladder.
  function show(filter) {
    const open = filter !== null;
    filters.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    hide.hidden = !open; hint.hidden = open;
    panel.classList.toggle('is-open', open);
    rowsHost.querySelectorAll('.lbtn').forEach(b => { b.tabIndex = -1; });
    if (!open) { ladder.classList.remove('is-in'); return; }
    let rank = 0;
    rowsHost.querySelectorAll('.lrow').forEach(row => {
      const visible = filter === 'all' || row.dataset.domain === filter;
      row.classList.toggle('is-hidden', !visible);
      row.querySelector('.lbtn').tabIndex = visible ? 0 : -1;
      if (visible) row.querySelector('.l-rank').textContent = String(++rank).padStart(2, '0');
    });
    if (reducedMotion.matches) ladder.classList.add('is-in');
    else requestAnimationFrame(() => requestAnimationFrame(() => ladder.classList.add('is-in')));
  }
  filters.addEventListener('click', event => {
    if (event.target.closest('.filters-hide')) { show(null); filters.querySelector('[data-filter]').focus(); return; }
    const button = event.target.closest('[data-filter]');
    if (button) show(button.getAttribute('aria-pressed') === 'true' ? null : button.dataset.filter);
  });
  show(null);
})();

/* ---------- Header menu ---------- */
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });

/* ---------- Wishing List ---------- */
const form = document.querySelector('#wish-form');
const feedback = document.querySelector('#form-feedback');
function wishTemplate() {
  const data = new FormData(form);
  return `ResearchBoost Wishing List\n\nEmail: ${data.get('email') || '[your email]'}\nRepository: ${data.get('repository') || '[repository URL]'}\nGPU support: ${data.get('gpu') || '[available GPUs, or none]'}\nMinimum compute budget: ${data.get('compute') || '[minimum reproduction budget]'}\n\nWorkload & notes:\n${data.get('notes') || '[bottleneck, target improvement, and correctness checks]'}\n\nI understand cases are selected based on available resources and reproducible evaluation.`;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  window.location.href = `mailto:ydove1031@gmail.com?subject=${encodeURIComponent('ResearchBoost Wishing List — workload proposal')}&body=${encodeURIComponent(wishTemplate())}`;
  feedback.textContent = 'Email draft requested. Review it in your email app before sending. If no app opens, use Copy template.';
});
document.querySelector('#copy-template').addEventListener('click', async () => {
  const text = wishTemplate();
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const fallback = document.createElement('textarea'); fallback.value = text; fallback.setAttribute('aria-label', 'Submission template'); fallback.style.position = 'fixed'; fallback.style.left = '-9999px'; document.body.append(fallback); fallback.select();
      const copied = document.execCommand('copy'); fallback.remove(); if (!copied) throw new Error('Copy unavailable');
    }
    feedback.textContent = 'Template copied. Paste it into an email to ydove1031@gmail.com. Nothing has been sent.';
  } catch (_) { feedback.textContent = 'Clipboard access is unavailable. Select your form text and email it to ydove1031@gmail.com.'; }
});
