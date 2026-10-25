'use strict';
(() => {
  const root = document.querySelector('.workflow');
  if (!root) return;
  const steps = [
    {title:'Find the real bottleneck.', description:'Profile the best current version, narrowing from stage to module to operation to kernel. Name the top hotspot before changing code.', output:'A localized bottleneck and a testable hypothesis.'},
    {title:'Change one thing well.', description:'Attack one bottleneck class at a time. Keep the change behind a switch, off by default, so its effect can be isolated and compared.', output:'One controlled edit, ready for a timing screen.'},
    {title:'Is the gain worth checking?', description:'Measure the candidate with bench.py time, adding a quick check when needed. Run the full check once timing reaches the target; otherwise, record the result and iterate.', output:'A timing result that determines the next step.'},
    {title:'Let the evidence decide.', description:'Run bench.py check against the frozen judge. It checks structure, benefit, bitwise agreement and statistical consistency; the judge remains read-only to the agent.', output:'check.json: PASS, no_benefit or INCORRECT.'},
    {title:'Keep every experiment.', description:'Record the profile, code change and result in WORK_LOG. Failed checks and no-gain rounds matter, too: their feedback guides the next experiment.', output:'A resumable record of what changed and what happened.'},
    {title:'A better next question.', description:'Use the recorded evidence to choose the next experiment. Stop at a verified PASS that meets the target, or when profiling identifies a ceiling.', output:'Another focused round — or a documented stopping point.'}
  ];
  const buttons = [...root.querySelectorAll('[data-step]')];
  const play = root.querySelector('.wf-play');
  const announcement = root.querySelector('#wf-announcement');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let scenario = 'pass';
  let timer = null;
  function show(index, announce = false) {
    active = index;
    const data = steps[index];
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    root.querySelector('#wf-step-count').textContent = `STEP ${String(index + 1).padStart(2, '0')} / 06`;
    root.querySelector('#wf-detail-title').textContent = data.title;
    root.querySelector('#wf-description').textContent = data.description;
    root.querySelector('#wf-output').textContent = index === 2 ? (scenario === 'pass' ? 'Timing target reached → continue to the frozen judge.' : 'Below the timing target → log the round without a full check.') : data.output;
    root.querySelector('#wf-path-label').textContent = scenario === 'miss' ? 'Below target: Screen → Log → Next → Profile.' : 'Target reached: Screen → Check → Log → Next.';
    root.querySelector('#wf-next').innerHTML = `${index === 5 ? 'Back to profile' : 'Next step'} <span aria-hidden="true">→</span>`;
    root.querySelectorAll('.wf-stage-art span').forEach((bar, i) => {
      bar.style.height = `${25 + ((i * 23 + index * 17) % 76)}%`;
      bar.style.background = i === index ? '#d9c893' : '#9eaf8c';
    });
    if (announce) announcement.textContent = `Step ${index + 1}: ${data.title} ${data.description}`;
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    root.classList.remove('is-playing');
    play.setAttribute('aria-pressed', 'false');
    play.innerHTML = '<span aria-hidden="true">▶</span> Play the loop';
  }
  function next(announce = false) {
    const index = active === 2 && scenario === 'miss' ? 4 : (active + 1) % steps.length;
    show(index, announce);
  }
  function start() {
    if (active === 3 && scenario === 'miss') show(4);
    root.classList.add('is-playing');
    play.setAttribute('aria-pressed', 'true');
    play.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause the loop';
    timer = setInterval(() => next(), 4500);
  }
  buttons.forEach(button => button.addEventListener('click', () => {stop(); show(Number(button.dataset.step), true);}));
  root.querySelector('#wf-next').addEventListener('click', () => {stop(); next(true);});
  play.addEventListener('click', () => timer ? stop() : start());
  root.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
    stop();
    scenario = button.dataset.scenario;
    root.querySelectorAll('[data-scenario]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    buttons[3].classList.toggle('is-skipped', scenario === 'miss');
    buttons[3].querySelector('.wf-step-caption').textContent = scenario === 'miss' ? 'Skipped on this path' : 'Verify correctness';
    show(2, true);
    announcement.textContent = scenario === 'miss' ? 'Below target: skip the full check, log the round, and choose the next experiment.' : 'Timing target reached: continue to the full check.';
  }));
  // Playback is opt-in. Pause when the diagram is off-screen or the page is hidden.
  document.addEventListener('visibilitychange', () => {if (document.hidden) stop();});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) stop();
  }).observe(root);
  motion.addEventListener('change', stop);
  show(0);
})();
