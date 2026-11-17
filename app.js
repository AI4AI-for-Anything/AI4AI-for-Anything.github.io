'use strict';

// Evidence records are intentionally separate from presentation. Numbers are source-reported.
const projectData = [
  {
    "name": "Faster-Motus",
    "short": "Motus",
    "domain": "embodied",
    "speed": "9.59",
    "workload": "RoboTwin 2.0 fine-tuning · 27,244 episodes",
    "scope": "7.468 → 0.779 s/iteration",
    "status": "Bitwise identical · 1,100 iterations",
    "note": "All 8 ranks match across two epoch boundaries: losses, learning rates, batches, validation metrics, final parameters and optimizer state. No full training run or RoboTwin evaluation."
  },
  {
    "name": "Faster-RAE",
    "short": "RAE",
    "domain": "image",
    "speed": "5.32",
    "workload": "Stage-1 decoder + GAN training",
    "scope": "Decoder + GAN step time",
    "status": "Statistical equivalence",
    "note": "Not the complete 16-epoch runtime. RAE is a representation autoencoder, not a VAE."
  },
  {
    "name": "Faster-RoboTwin",
    "short": "RoboTwin",
    "domain": "embodied",
    "speed": "4.38",
    "estimate": true,
    "workload": "π0.5 policy evaluation · RoboTwin 2.0",
    "scope": "Estimated 73.5 → 16.8 h benchmark wall-clock",
    "status": "Compared episodes match bitwise",
    "note": "Seven-task smoke checks, 2–10 episodes/job; the full 10,000-episode run was not performed."
  },
  {
    "short": "PIDG (module)",
    "name": "PIDG",
    "domain": "3d",
    "speed": "4.17",
    "url": "https://github.com/HaoqinHong/Physics-Informed-Deformable-Gaussian-Splatting-ResearchBoost",
    "workload": "dry_ice · optical-flow module group",
    "scope": "9,369.79 → 2,244.31 ms/module group",
    "status": "Task metric · module numerical checks",
    "note": "R06 generic module PASS; formal benefit verdict UNAVAILABLE_SHARED_WORKLOAD. Excludes complete training; not formal ResearchBoost acceptance.",
    "community": true
  },
  {
    "name": "Faster-FastWAM",
    "short": "FastWAM",
    "domain": "embodied",
    "speed": "3.46",
    "workload": "FastWAM-LIBERO training recipe",
    "scope": "1,541.4 → 445.7 ms/iteration",
    "status": "Task metric · LIBERO evaluation reproduced",
    "note": "LIBERO overall: release checkpoint 97.15%, faster run 96.90%. Not a claim of bitwise equivalence."
  },
  {
    "short": "LLaVA-OneVision-2",
    "name": "LLaVA-OneVision-2",
    "domain": "mllm",
    "speed": "3.0",
    "url": "https://github.com/EvolvingLMMs-Lab/LLaVA-OneVision-2#training-acceleration",
    "workload": "4B quick-start SFT · one epoch · merged upstream",
    "scope": "2.2× Hopper / 3.0× Blackwell",
    "status": "Statistical equivalence",
    "note": "One-epoch fixed evaluation loss checks. Hopper preset was timed on GPUs with more than 80 GB; not yet tested on 80 GB cards.",
    "community": true,
    "low": 2.2,
    "label": "2.2–3.0"
  },
  {
    "short": "OpenWAM",
    "name": "OpenWAM",
    "domain": "embodied",
    "speed": "2.77",
    "url": "https://github.com/OpenWAM-Official/OpenWAM#training-acceleration",
    "workload": "OpenWAM-α fine-tuning · seven SFT benchmarks",
    "scope": "Warmed-up training throughput",
    "status": "Task metric · LIBERO evaluation reproduced",
    "note": "Measured without checkpointing or an 80 GiB cap versus all-layer checkpointing. LIBERO 99.05% vs released checkpoint 99.2%. Merged upstream.",
    "community": true,
    "low": 2.54,
    "label": "2.54–2.77"
  },
  {
    "name": "Faster-LLaVA",
    "short": "LLaVA",
    "domain": "mllm",
    "speed": "2.39",
    "workload": "LLaVA-1.5-7B stage-2 fine-tuning",
    "scope": "Stage-2 fine-tuning",
    "status": "Statistical equivalence",
    "note": "Source-reported PASS under the task judge."
  },
  {
    "short": "ProteinMPNN",
    "name": "Faster-ProteinMPNN",
    "domain": "science",
    "speed": "2.25",
    "url": "https://github.com/micky-li-hd/Faster-ProteinMPNN",
    "workload": "ProteinMPNN v_48_020 · full public dataset",
    "scope": "450.65 → 200.52 s/epoch, epochs 2–6",
    "status": "Exploratory comparison",
    "note": "Six of 150 epochs per arm; validation perplexity 5.884 vs 5.934 / 5.897. Not a frozen-judge four-gate PASS or full-training convergence claim.",
    "community": true
  },
  {
    "name": "Faster-YOCO",
    "short": "YOCO",
    "domain": "llm",
    "speed": "2.12",
    "workload": "YOCO-3B pretraining · BF16, no FP8",
    "scope": "Training update speedup",
    "status": "Statistical equivalence",
    "note": "20,000-update run: 1.91× end-to-end (5,345 → 2,799 s), including startup and saves. Not a claim of bitwise-identical losses."
  },
  {
    "name": "Faster-SelfForcing",
    "short": "Self-Forcing",
    "domain": "video",
    "speed": "2.08",
    "workload": "Self-Forcing video DMD training",
    "scope": "Video DMD training",
    "status": "Statistical equivalence",
    "note": "Source-reported PASS under the task judge."
  },
  {
    "name": "Faster-R3",
    "short": "R3",
    "domain": "mllm",
    "speed": "2.08",
    "workload": "BAGEL 7B-MoT Tree-RL",
    "scope": "24.72 → 11.87 s/RL step, including GenEval reward service",
    "status": "Bitwise identical · 14-step check",
    "note": "16-step timing run; 14 deterministic steps match bitwise on all eight ranks. Includes reward-service improvements; training code alone is 1.88× with the optimized service on both sides."
  },
  {
    "short": "MiniMax-H3",
    "name": "Faster-MiniMax-H3",
    "domain": "video",
    "speed": "1.86",
    "url": "https://github.com/2018cx/Faster-MiniMax-H3",
    "workload": "MiniMax-H3 FL2VA · BF16 LoRA / ZeRO-3",
    "scope": "LoRA fine-tuning",
    "status": "Statistical equivalence",
    "note": "Source-reported statistical equivalence; see project evidence for the fixed workload.",
    "community": true
  },
  {
    "name": "Faster-BAGEL",
    "short": "BAGEL",
    "domain": "mllm",
    "speed": "1.82",
    "workload": "7B-MoT SFT · BF16 compute, no FP8",
    "scope": "1.4367 → 0.7873 s/step",
    "status": "Statistical equivalence",
    "note": "2,000 steps × 4 seeds; reference 2σ consistency and held-out VLM CE checks pass. Image-generation quality was not evaluated."
  },
  {
    "name": "Faster-DMD",
    "short": "DMD2",
    "domain": "image",
    "speed": "1.72",
    "workload": "DMD2 one-step SD1.5 distillation + GAN",
    "scope": "Distillation + GAN",
    "status": "Statistical equivalence",
    "note": "Source-reported PASS under the task judge."
  },
  {
    "short": "LLM2Vec",
    "name": "Faster-LLM2Vec",
    "domain": "llm",
    "speed": "1.60",
    "url": "https://github.com/AI4AI-for-Anything/Faster-LLM2Vec",
    "workload": "Mistral-7B · BF16 LoRA · independent MNTP / SimCSE stages",
    "scope": "1.60× SimCSE; 1.29× MNTP",
    "status": "Statistical equivalence · historical N1 checks",
    "note": "Three seeds, 60 updates each. Full-schedule training, MTEB quality and MNTP-to-SimCSE handoff untested; combined source has not been revalidated on GPU.",
    "community": true
  },
  {
    "name": "Faster-JiT",
    "short": "JiT",
    "domain": "image",
    "speed": "1.56",
    "workload": "JiT-B/16 · ImageNet 256 training",
    "scope": "100.02 → 64.04 ms/step",
    "status": "Statistical equivalence",
    "note": "BF16, no FP8. Separate 40-epoch, single-seed check: FID50k 39.07 vs 39.24; 600 epochs not run."
  },
  {
    "short": "Protenix",
    "name": "Faster-Protenix",
    "domain": "science",
    "speed": "1.55",
    "url": "https://github.com/micky-li-hd/Faster-Protenix",
    "workload": "Protenix 2.0.0 · 128 updates · crop 384",
    "scope": "1,503.99 → 968.83 s whole process",
    "status": "Manual review",
    "note": "216/216 training and 135/138 normal/EMA comparisons passed; three EMA deviations accepted within reference-repeat variance. Full-corpus convergence outside scope.",
    "community": true
  },
  {
    "short": "FermiNet",
    "name": "Faster-FermiNet",
    "domain": "science",
    "speed": "1.25",
    "url": "https://github.com/sen-ye/faster-ferminet",
    "workload": "Fe / Kr / Cd / Xe all-electron training · KFAC",
    "scope": "Geometric mean steady-state step speedup across four atoms",
    "status": "Bitwise identical",
    "note": "Frozen timing and bitwise gates PASS across all four atoms; 8- and 110-step checks. Compilation/warmup excluded; full convergence not run.",
    "community": true
  },
  {
    "name": "Faster-NanoChat",
    "short": "NanoChat",
    "domain": "llm",
    "speed": "1.20",
    "workload": "D24 (~1.384B) · Tensorwise FP8 training",
    "scope": "User-reported updated training speedup",
    "status": "N1 statistical equivalence",
    "note": "Updated headline supplied by the project owner. Earlier 1.0744× timing (3,358.4 → 3,126.0 ms/update) and six-seed N1 check are historical; no new timing pair was supplied. Full-schedule BPB/CORE evaluation was not run.",
    "community": true
  },
  {
    "short": "3DGS",
    "name": "Original 3DGS",
    "domain": "3d",
    "speed": "1.13",
    "url": "https://github.com/HaoqinHong/Physics-Informed-Deformable-Gaussian-Splatting-ResearchBoost",
    "workload": "Mip-NeRF360 · bonsai / bicycle / garden",
    "scope": "4,269.73 → 3,773.86 s total; three full 30,000-step pipelines",
    "status": "Task metric · held-out-view PSNR",
    "note": "Frozen judge INCORRECT: 11 numerical violations remain unresolved; no formal acceptance. ΔPSNR −0.014 to +0.038 dB. One eligible timing pair per scene; noise not estimated.",
    "community": true
  }
];
const domains = [
  {id:'llm', name:'LLM'},
  {id:'mllm', name:'MLLM'},
  {id:'image', name:'Image Generation'},
  {id:'video', name:'Video Generation'},
  {id:'embodied', name:'Embodied AI'},
  {id:'science', name:'AI for Science'},
  {id:'3d', name:'3D Reconstruction'}
];

document.documentElement.classList.remove('no-js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const repoUrl = project => project.url || `https://github.com/AI4AI-for-Anything/${encodeURIComponent(project.name)}`;
{
  const speeds = projectData.map(p => Number(p.speed));
  const lowSpeeds = projectData.map(p => p.low || Number(p.speed));
  document.querySelectorAll('[data-total-domains]').forEach(el => { el.textContent = domains.length; });
  document.querySelectorAll('[data-total-projects]').forEach(el => { el.textContent = projectData.length; });
  // Speedups are ratios, so the hero reports their geometric mean.
  const mean = Math.exp(speeds.reduce((sum, s) => sum + Math.log(s), 0) / speeds.length);
  document.querySelectorAll('[data-speed-mean]').forEach(el => { el.textContent = `${Math.exp(lowSpeeds.reduce((sum, s) => sum + Math.log(s), 0) / lowSpeeds.length).toFixed(2)}–${mean.toFixed(2)}`; });
  document.querySelectorAll('[data-speed-max]').forEach(el => { el.textContent = Math.max(...speeds).toFixed(2); });
}

/* ---------- Results ladder: every project on one log axis ---------- */
(() => {
  const ladder = document.querySelector('.ladder');
  const filters = document.querySelector('.filters');
  const panel = document.querySelector('.ladder-wrap');
  const more = document.querySelector('.results-more');
  if (!ladder || !filters || !panel || !more) return;
  const rowsHost = ladder.querySelector('.ladder-rows');
  const MAX = 10;
  const pos = s => Math.log(s) / Math.log(MAX) * 100;
  const domainName = id => domains.find(d => d.id === id).name;
  ladder.querySelector('.ladder-axis').innerHTML = `<div class="l-grid" style="height:100%"><span></span><span>project</span><div class="ax">${[1, 1.5, 2, 3, 5, 10].map(t => `<span style="left:${pos(t)}%">${t}×</span>`).join('')}</div><span style="text-align:right">speedup</span></div>`;

  const sorted = [...projectData].sort((a, b) => Number(b.speed) - Number(a.speed));
  rowsHost.innerHTML = sorted.map((p, k) => {
    const id = `detail-${p.short.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    return `<div class="lrow" data-domain="${p.domain}"><div>`
      + `<button class="lbtn l-grid" type="button" aria-expanded="false" aria-controls="${id}">`
      + `<span class="l-rank">${String(k + 1).padStart(2, '0')}</span>`
      + `<span class="l-name"><strong>${esc(p.short)}</strong><small><i>${esc(domainName(p.domain))}</i>${p.community ? ' · Community' : ''}</small><small>${esc(p.status)}</small></span>`
      + `<span class="l-track" aria-hidden="true"><span class="l-line" style="--p:${pos(Number(p.speed)).toFixed(2)};--k:${k}"></span>${p.low ? `<span class="l-range" style="left:${pos(p.low)}%;width:${pos(Number(p.speed))-pos(p.low)}%"></span>` : ''}<span class="l-dot${p.estimate ? ' est' : ''}" style="--p:${pos(Number(p.speed)).toFixed(2)};--k:${k}"></span></span>`
      + `<span class="l-val">${esc(p.label || Number(p.speed).toFixed(2))}<small>×</small>${p.estimate ? '<span class="l-est" aria-label="estimated">est.</span>' : ''}</span></button>`
      + `<div class="ldetail" id="${id}" hidden><div><div class="ldetail-inner"><a class="text-link" href="${repoUrl(p)}">${esc(p.name)} ↗</a><dl><dt>Workload</dt><dd>${esc(p.workload)}</dd><dt>Measured</dt><dd>${esc(p.label || Number(p.speed).toFixed(2))}× · ${esc(p.scope)}${p.estimate ? ' (estimated)' : ''}</dd><dt>Correctness</dt><dd>${esc(p.status)}</dd><dt>Notes</dt><dd>${esc(p.note)}</dd></dl></div></div></div>`
      + `</div></div>`;
  }).join('');
  rowsHost.querySelectorAll('.lbtn').forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    const detail = document.getElementById(button.getAttribute('aria-controls'));
    detail.hidden = !open;
    detail.classList.toggle('is-open', open);
  }));

  const choices = [{id:'all', name:'All'}, ...domains];
  filters.innerHTML = choices.map(c => `<button type="button" data-filter="${c.id}" aria-pressed="false" aria-controls="ladder-panel">${esc(c.name)} <small>${c.id === 'all' ? projectData.length : projectData.filter(p => p.domain === c.id).length}</small></button>`).join('');
  let activeFilter = 'all';
  let expanded = false;
  function show(filter) {
    activeFilter = filter;
    filters.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    more.hidden = filter !== 'all';
    more.textContent = expanded ? 'Show top 6' : `View all ${projectData.length} results`;
    more.setAttribute('aria-expanded', String(expanded));
    let rank = 0;
    rowsHost.querySelectorAll('.lrow').forEach((row, index) => {
      const visible = filter === 'all' ? expanded || index < 6 : row.dataset.domain === filter;
      row.hidden = !visible;
      if (!visible) {
        row.querySelector('.lbtn').setAttribute('aria-expanded', 'false');
        const detail = row.querySelector('.ldetail');
        detail.hidden = true;
        detail.classList.remove('is-open');
      }
      if (visible) row.querySelector('.l-rank').textContent = String(++rank).padStart(2, '0');
    });
    if (reducedMotion.matches) ladder.classList.add('is-in');
    else requestAnimationFrame(() => requestAnimationFrame(() => ladder.classList.add('is-in')));
  }
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (button) {
      expanded = false;
      show(button.dataset.filter);
    }
  });
  more.addEventListener('click', () => { expanded = !expanded; show(activeFilter); });
  show('all');
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

/* ---------- Public GitHub star count; refresh while the page is visible ---------- */
(() => {
  const nodes = document.querySelectorAll('[data-star-count]');
  if (!nodes.length) return;
  const key = 'researchboost-stars:DAGroup-PKU/ResearchBoost-Agent';
  const interval = 5 * 60 * 1000;
  let lastAttempt = 0;
  let inFlight = false;
  let cached = null;
  const valid = count => Number.isSafeInteger(count) && count >= 0;
  function render(record, stale) {
    nodes.forEach(node => {
      node.textContent = record ? record.count.toLocaleString('en-US') : '—';
      const label = record ? `${record.count.toLocaleString('en-US')} GitHub stars${stale ? ' (cached; refresh unavailable)' : ''}` : 'GitHub star count unavailable';
      node.setAttribute('aria-label', label);
      node.title = record ? `${label}. Last fetched ${new Date(record.at).toLocaleString()}` : label;
      node.dataset.state = record ? (stale ? 'cached' : 'live') : 'unavailable';
    });
  }
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && valid(stored.count) && Number.isFinite(stored.at)) cached = stored;
  } catch (_) { /* Storage is optional. */ }
  render(cached, true);
  async function refresh() {
    if (document.hidden || inFlight || (lastAttempt && Date.now() - lastAttempt < interval)) return;
    inFlight = true;
    lastAttempt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('https://api.github.com/repos/DAGroup-PKU/ResearchBoost-Agent', {
        headers: {Accept: 'application/vnd.github+json'}, signal: controller.signal, cache: 'no-store', credentials: 'omit'
      });
      if (!response.ok) throw new Error('GitHub request failed');
      const data = await response.json();
      if (!valid(data.stargazers_count)) throw new Error('Invalid GitHub count');
      cached = {count: data.stargazers_count, at: Date.now()};
      render(cached, false);
      try { localStorage.setItem(key, JSON.stringify(cached)); } catch (_) { /* Storage is optional. */ }
    } catch (_) { render(cached, true); }
    finally { clearTimeout(timeout); inFlight = false; }
  }
  refresh();
  setInterval(refresh, interval);
  document.addEventListener('visibilitychange', refresh);
})();
