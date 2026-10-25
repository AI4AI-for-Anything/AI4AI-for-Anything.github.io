'use strict';

// Evidence records are intentionally separate from presentation. Numbers are source-reported.
const projectData = [
  {name:'Faster-RAE', type:'Representation autoencoder', categories:[], speed:'5.32', workload:'Stage-1 decoder + GAN training', hardware:'2 × H200', scope:'Decoder + GAN step time', status:'Statistical equivalence', note:'Not the complete 16-epoch runtime. RAE is a representation autoencoder, not a VAE.'},
  {name:'Faster-SelfForcing', type:'Video generation', categories:['DiT'], speed:'2.08', workload:'Self-Forcing video DMD training', hardware:'2 × H200', scope:'Video DMD training', status:'Statistical equivalence', note:'Source-reported PASS under the task judge.'},
  {name:'Faster-LLaVA', type:'Multimodal', categories:['Multimodal'], speed:'2.39', workload:'LLaVA-1.5-7B stage-2 fine-tuning', hardware:'4 × H20', scope:'Stage-2 fine-tuning', status:'Statistical equivalence', note:'Source-reported PASS under the task judge.'},
  {name:'Faster-DMD', type:'Diffusion distillation', categories:[], speed:'1.72', workload:'DMD2 one-step SD1.5 distillation + GAN', hardware:'4 × H20', scope:'Distillation + GAN', status:'Statistical equivalence', note:'Source-reported PASS under the task judge.'},
  {name:'Faster-BAGEL', type:'Multimodal', categories:['Multimodal'], speed:'1.82', workload:'7B-MoT SFT · BF16 compute, no FP8', hardware:'8 × Hopper 80GB', scope:'1.4367 → 0.7873 s/step', status:'Statistical equivalence', private:true, note:'2,000 steps × 4 seeds; reference 2σ consistency and held-out VLM CE checks pass. Image-generation quality was not evaluated.'},
  {name:'Faster-R3', type:'Multimodal reinforcement learning', categories:['Multimodal'], speed:'1.47', workload:'BAGEL 7B-MoT Tree-RL', hardware:'4 × H200-class (~140 GiB)', scope:'Rollout + reward + optimizer step', status:'Bitwise identical · 14-step check', private:true, note:'16-step timing run; 14 deterministic training records match bitwise. Not a full long-training result.'},
  {name:'Faster-NanoChat', type:'LLM', categories:['LLM'], speed:'1.0744', workload:'D24 (~1.384B) · Tensorwise FP8 training', hardware:'8 × H20', scope:'3,358.4 → 3,126.0 ms/update', status:'N1 statistical equivalence', private:true, note:'Short steady-state timing excludes compile and warmup. Six-seed short-trajectory PASS; full-schedule BPB/CORE evaluation was not run.'},
  {name:'Faster-RoboTwin', type:'Robotics · Related ecosystem', categories:['WAM'], speed:'4.38', estimate:true, workload:'π0.5 policy evaluation · RoboTwin 2.0', hardware:'8 × H20', scope:'Estimated full-benchmark wall-clock', status:'Compared episodes match bitwise', private:true, note:'Estimated 73.5 → 16.8 hours. Seven-task smoke checks, 2–10 episodes/job; the full 10,000-episode run was not performed.'},
  {name:'Faster-JiT', type:'DiT', categories:['DiT'], speed:'1.56', workload:'JiT-B/16 · ImageNet 256 training', hardware:'2 × H200-class Hopper', scope:'100.02 → 64.04 ms/step', status:'Statistical equivalence', private:true, note:'BF16, no FP8. Separate 40-epoch, single-seed check on 8 × H100: FID50k 39.07 vs 39.24; 600 epochs not run.'},
  {name:'Faster-YOCO', type:'LLM', categories:['LLM'], speed:'2.12', workload:'YOCO-3B pretraining · BF16, no FP8', hardware:'8 × H100 80GB', scope:'Training update speedup', status:'Statistical equivalence', private:true, note:'20,000-update run: 1.91× end-to-end (5,345 → 2,799 s), including startup and saves. Not a claim of bitwise-identical losses.'},
  {name:'Faster-Motus', type:'Embodied models', categories:['WAM'], speed:'9.59', workload:'RoboTwin 2.0 fine-tuning · 27,244 episodes', hardware:'8 × B200', scope:'7.468 → 0.779 s/training iteration', status:'Bitwise identical · 1,100 iterations', private:true, note:'All 8 ranks match across two epoch boundaries: losses, learning rates, batches, validation metrics, final parameters and optimizer state. No full training run or RoboTwin evaluation.'},
  {name:'Faster-FastWAM', type:'WAM', categories:['WAM'], speed:'3.46', workload:'FastWAM-LIBERO training recipe', hardware:'8 × B200', scope:'1,541.4 → 445.7 ms/iteration', status:'LIBERO evaluation reproduced', private:true, note:'LIBERO overall: release checkpoint 97.15%, faster run 96.90%. Not a claim of bitwise equivalence.'}
];

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// Add future, verified model series here; every value uses this project's own baseline.
const comparisonSeries = [
  { label: 'Baseline', value: () => 1, baseline: true },
  { label: 'RBA', value: project => Number(project.speed), baseline: false }
];
function renderComparison(project) {
  if (!project.speed) return '<p class="chart-pending">Comparison pending verified measurements.</p>';
  const series = comparisonSeries.map(model => ({ ...model, speed: model.value(project) })).filter(model => Number.isFinite(model.speed) && model.speed > 0);
  const maximum = Math.max(...series.map(model => model.speed));
  return `<div class="project-chart" style="grid-template-columns:repeat(${series.length},minmax(0,1fr))" role="group" aria-label="${esc(project.name)} relative speed${project.estimate ? ', estimated' : ''}"><p class="chart-heading">Relative speed${project.estimate ? ' · Estimated' : ''}</p>${series.map(model => `<div class="chart-row"><span class="chart-label">${esc(model.label)}</span><span class="chart-track" aria-hidden="true"><span class="chart-bar${model.baseline ? ' chart-baseline' : ''}" style="height:${(model.speed / maximum * 100).toFixed(4)}%"></span></span><span class="chart-value">${esc(model.speed)}×</span></div>`).join('')}<p class="chart-note">Own baseline = 1× · Higher is faster</p></div>`;
}
function renderProjectCard(project) {
  const repository = `https://github.com/AI4AI-for-Anything/${encodeURIComponent(project.name)}`;
  return `<article class="project-card"><div class="project-name"><span class="project-type">${esc(project.type)}</span><h3><a href="${repository}">${esc(project.name)}</a></h3><p>${esc(project.workload)}</p></div><div class="card-summary"><div class="project-number${project.speed && project.speed.length > 4 ? ' precise' : ''}">${project.speed ? `${esc(project.speed)}<span>×</span><small>${project.estimate ? 'estimated speedup' : 'speedup'}</small>` : 'Pending'}</div><a class="project-detail" href="${repository}" aria-label="Detail: ${esc(project.name)} repository">Detail <span aria-hidden="true">↗</span></a></div>${renderComparison(project)}</article>`;
}
const projectList = document.querySelector('#project-list');
function renderProjects(filter = 'all') {
  const projects = filter === 'all' ? projectData : projectData.filter(project => project.categories.includes(filter));
  document.querySelector('#results-context').textContent = `${filter === 'all' ? 'All research directions' : filter} · ${projects.length} project${projects.length === 1 ? '' : 's'} · Source-reported evidence, not a cross-hardware ranking.`;
  if (!projects.length) {
    projectList.innerHTML = `<div class="empty-state"><p class="project-type">Pending research direction</p><h3>${esc(filter)} is an open direction.</h3><p>No verified result is published here yet. Have a reproducible workload? <a class="inline-link" href="#wishing-list">Add it to the Wishing List ↗</a></p></div>`;
    return;
  }
  projectList.innerHTML = projects.map(renderProjectCard).join('');
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  renderProjects(button.dataset.filter);
}));
renderProjects();

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });

const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateTab(tab) {
  tabs.forEach(other => {
    const active = tab === other;
    other.setAttribute('aria-selected', String(active)); other.tabIndex = active ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.indexOf(tab);
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    activateTab(next); next.focus();
  });
});

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
    if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const fallback = document.createElement('textarea'); fallback.value = text; fallback.setAttribute('aria-label', 'Submission template'); fallback.style.position = 'fixed'; fallback.style.left = '-9999px'; document.body.append(fallback); fallback.select();
      const copied = document.execCommand('copy'); fallback.remove(); if(!copied) throw new Error('Copy unavailable');
    }
    feedback.textContent = 'Template copied. Paste it into an email to ydove1031@gmail.com. Nothing has been sent.';
  } catch (_) { feedback.textContent = 'Clipboard access is unavailable. Select your form text and email it to ydove1031@gmail.com.'; }
});
