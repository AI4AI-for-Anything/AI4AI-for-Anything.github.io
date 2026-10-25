'use strict';
(() => {
  const root = document.querySelector('.project-carousel');
  if (!root) return;
  const track = root.querySelector('#project-list');
  const viewport = root.querySelector('.project-window');
  const controls = root.querySelector('.project-controls');
  const dots = root.querySelector('.project-dots');
  const count = root.querySelector('.project-count');
  const status = root.querySelector('.carousel-status');
  const play = root.querySelector('.project-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let originals = [], slides = [], choices = [];
  let position = 1, busy = false, settleTimer = null, autoTimer = null, playing = false;
  let hovering = false, inView = false;
  const index = () => (position - 1 + originals.length) % originals.length;
  function pause() {
    playing = false;
    clearInterval(autoTimer); autoTimer = null;
    play.setAttribute('aria-pressed', 'false');
    play.textContent = '▶ Auto-play';
  }
  function syncAuto() {
    clearInterval(autoTimer); autoTimer = null;
    if (playing && inView && !document.hidden && !hovering && !track.contains(document.activeElement)) {
      autoTimer = setInterval(() => move(position + 1, false), 5000);
    }
  }
  function paint(animate) {
    if (originals.length < 2) return;
    track.classList.toggle('is-snap', !animate);
    const selected = index();
    const card = slides[position];
    track.style.transform = `translateX(${viewport.clientWidth / 2 - 3 - card.offsetLeft - card.offsetWidth / 2}px)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-current', i === position);
      const accessible = !slide.hasAttribute('data-carousel-clone') && i === selected + 1;
      slide.setAttribute('aria-hidden', String(!accessible));
      slide.querySelectorAll('a').forEach(link => { link.tabIndex = accessible ? 0 : -1; });
    });
    choices.forEach((choice, i) => choice.setAttribute('aria-pressed', String(i === selected)));
    count.innerHTML = `${String(selected + 1).padStart(2, '0')} <span>/ ${String(originals.length).padStart(2, '0')}</span>`;
    if (!animate) { void track.offsetWidth; track.classList.remove('is-snap'); }
  }
  function settle() {
    clearTimeout(settleTimer);
    if (position === 0) position = originals.length;
    if (position === originals.length + 1) position = 1;
    paint(false); busy = false;
  }
  function move(next, announce = true) {
    if (busy || originals.length < 2 || next === position) return;
    busy = true; position = next;
    paint(!reduced.matches);
    if (announce) status.textContent = `${originals[index()].querySelector('h3').textContent}, ${index() + 1} of ${originals.length}`;
    if (reduced.matches) settle();
    else settleTimer = setTimeout(settle, 440);
  }
  function manual(next) { pause(); move(next); }
  function reset() {
    pause(); clearTimeout(settleTimer); busy = false; position = 1;
    root.classList.remove('is-ready'); track.style.transform = '';
    track.querySelectorAll('[data-carousel-clone]').forEach(card => card.remove());
    originals = [...track.querySelectorAll('.project-card')];
    dots.replaceChildren(); status.textContent = '';
    controls.hidden = originals.length < 2;
    if (originals.length < 2) return;
    originals.forEach((card, i) => {
      card.setAttribute('role', 'group'); card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `${card.querySelector('h3').textContent}, ${i + 1} of ${originals.length}`);
    });
    const clone = card => { const copy = card.cloneNode(true); copy.dataset.carouselClone = ''; return copy; };
    track.prepend(clone(originals.at(-1))); track.append(clone(originals[0]));
    slides = [...track.children];
    choices = originals.map((card, i) => {
      const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('aria-label', `Show ${card.querySelector('h3').textContent}`);
      button.title = card.querySelector('h3').textContent;
      button.addEventListener('click', () => manual(i + 1)); dots.append(button); return button;
    });
    root.classList.add('is-ready'); paint(false);
  }
  root.querySelector('.project-prev').addEventListener('click', () => manual(position - 1));
  root.querySelector('.project-next').addEventListener('click', () => manual(position + 1));
  play.addEventListener('click', () => {
    if (playing) pause();
    else { playing = true; play.setAttribute('aria-pressed', 'true'); play.textContent = 'Ⅱ Pause'; syncAuto(); }
  });
  track.addEventListener('click', event => {
    if (originals.length < 2) return;
    const card = event.target.closest('.project-card'); if (!card) return;
    const target = slides.indexOf(card);
    if (target !== position || card.hasAttribute('data-carousel-clone') || busy) {
      event.preventDefault(); if (!busy) manual(target);
    }
  });
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || originals.length < 2) return;
    event.preventDefault();
    // Move focus out of a slide before that slide becomes hidden.
    if (track.contains(event.target)) root.querySelector(event.key === 'ArrowLeft' ? '.project-prev' : '.project-next').focus({preventScroll:true});
    manual(event.key === 'Home' ? 1 : event.key === 'End' ? originals.length : position + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  let touch = null;
  viewport.addEventListener('touchstart', event => { touch = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null; }, {passive:true});
  viewport.addEventListener('touchend', event => {
    if (!touch) return;
    const dx = event.changedTouches[0].clientX - touch.x, dy = event.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) manual(position + (dx < 0 ? 1 : -1));
    touch = null;
  }, {passive:true});
  viewport.addEventListener('touchcancel', () => {touch = null;}, {passive:true});
  viewport.addEventListener('mouseenter', () => {hovering = true; syncAuto();});
  viewport.addEventListener('mouseleave', () => {hovering = false; syncAuto();});
  track.addEventListener('focusin', pause);
  document.addEventListener('visibilitychange', syncAuto);
  new IntersectionObserver(entries => {inView = entries[0].isIntersecting; syncAuto();}, {threshold:0.15}).observe(viewport);
  let resizeFrame;
  new ResizeObserver(() => {cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(settle);}).observe(viewport);
  reduced.addEventListener('change', () => {pause(); settle();});
  track.addEventListener('projectsupdated', reset);
  reset();
  document.fonts.ready.then(() => paint(false));
})();
