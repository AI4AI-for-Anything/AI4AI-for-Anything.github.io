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
  let offset = 0, stride = 0, cycle = 0, cardWidth = 0, current = -1;
  let playing = !reduced.matches, hovering = false, inView = false;
  let frame = 0, lastTime = 0, holdUntil = 0, tween = null, drag = null, suppressClickUntil = 0;
  const speed = 22; // CSS pixels per second, independent of display refresh rate.
  const logical = () => originals.length ? ((Math.round(offset / stride) % originals.length) + originals.length) % originals.length : 0;
  function syncButton() {
    play.setAttribute('aria-pressed', String(playing));
    play.textContent = playing ? 'Ⅱ Pause motion' : '▶ Resume motion';
  }
  function canDrift() {
    return originals.length > 1 && playing && inView && !document.hidden && !hovering && !drag && !track.contains(document.activeElement);
  }
  function normalize() {
    if (!cycle) return;
    while (offset < cycle - stride / 2) { offset += cycle; if(tween) {tween.from += cycle; tween.to += cycle;} if(drag) drag.origin += cycle; }
    while (offset >= cycle * 2 - stride / 2) { offset -= cycle; if(tween) {tween.from -= cycle; tween.to -= cycle;} if(drag) drag.origin -= cycle; }
  }
  function paint() {
    if (originals.length < 2 || !stride) return;
    normalize();
    track.style.transform = `translate3d(${(viewport.clientWidth - cardWidth) / 2 - 3 - offset}px,0,0)`;
    const physical = Math.round(offset / stride);
    if (physical === current) return;
    current = physical;
    const selected = logical();
    slides.forEach((slide, i) => {
      const active = i === physical;
      slide.classList.toggle('is-current', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.querySelectorAll('a').forEach(link => {link.tabIndex = active ? 0 : -1;});
    });
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    count.innerHTML = `${String(selected + 1).padStart(2, '0')} <span>/ ${String(originals.length).padStart(2, '0')}</span>`;
  }
  function tick(now) {
    frame = 0;
    const dt = lastTime ? Math.min(now - lastTime, 64) : 0;
    lastTime = now;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.duration);
      offset = tween.from + (tween.to - tween.from) * (1 - Math.pow(1 - t, 3));
      if (t === 1) tween = null;
      paint();
    } else if (canDrift() && now >= holdUntil) { offset += speed * dt / 1000; paint(); }
    if (tween || canDrift()) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }
  function wake() { if (!frame && (tween || canDrift())) {lastTime = 0; frame = requestAnimationFrame(tick);} }
  function goTo(target) {
    if (originals.length < 2) return;
    if (track.contains(document.activeElement)) root.querySelector('.project-next').focus({preventScroll:true});
    holdUntil = performance.now() + 1300;
    if (reduced.matches) {offset = target; tween = null; paint();}
    else tween = {from:offset,to:target,start:performance.now(),duration:650};
    const i = ((Math.round(target / stride) % originals.length) + originals.length) % originals.length;
    status.textContent = `${originals[i].querySelector('h3').textContent}, ${i + 1} of ${originals.length}`;
    wake();
  }
  function choose(i) {
    let delta = i - logical();
    if (delta > originals.length / 2) delta -= originals.length;
    if (delta < -originals.length / 2) delta += originals.length;
    goTo((Math.round(offset / stride) + delta) * stride);
  }
  function measure(reset = false) {
    if (originals.length < 2) return;
    const oldStride = stride;
    const progress = oldStride ? offset / oldStride : originals.length;
    cardWidth = slides[0].getBoundingClientRect().width;
    stride = slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
    cycle = stride * originals.length;
    offset = reset ? cycle : progress * stride;
    // A queued ResizeObserver after filtering must not cancel a user's navigation.
    if (tween && oldStride && !reset) {tween.from *= stride / oldStride; tween.to *= stride / oldStride;}
    if (drag && oldStride) drag.origin *= stride / oldStride;
    current = -1; paint(); wake();
  }
  function rebuild() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0; tween = null; drag = null;
    viewport.classList.remove('is-dragging');
    root.classList.remove('is-ready'); track.style.transform = '';
    track.querySelectorAll('[data-carousel-clone]').forEach(card => card.remove());
    originals = [...track.querySelectorAll('.project-card')];
    dots.replaceChildren(); status.textContent = ''; current = -1;
    controls.hidden = originals.length < 2;
    syncButton();
    if (originals.length < 2) return;
    originals.forEach((card, i) => {
      card.setAttribute('role','group'); card.setAttribute('aria-roledescription','slide');
      card.setAttribute('aria-label',`${card.querySelector('h3').textContent}, ${i+1} of ${originals.length}`);
    });
    const copies = () => originals.map(card => {const copy = card.cloneNode(true); copy.dataset.carouselClone = ''; return copy;});
    track.prepend(...copies()); track.append(...copies()); slides = [...track.children];
    choices = originals.map((card,i) => {
      const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('aria-label',`Show ${card.querySelector('h3').textContent}`);
      button.title = card.querySelector('h3').textContent;
      button.addEventListener('click',()=>choose(i)); dots.append(button); return button;
    });
    root.classList.add('is-ready'); measure(true);
  }
  root.querySelector('.project-prev').addEventListener('click',()=>goTo((Math.round(offset/stride)-1)*stride));
  root.querySelector('.project-next').addEventListener('click',()=>goTo((Math.round(offset/stride)+1)*stride));
  play.addEventListener('click',()=>{playing = !playing; syncButton(); wake();});
  root.addEventListener('keydown',event=>{
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || originals.length<2) return;
    event.preventDefault();
    if(event.key==='Home') choose(0);
    else if(event.key==='End') choose(originals.length-1);
    else goTo((Math.round(offset/stride)+(event.key==='ArrowLeft'?-1:1))*stride);
  });
  track.addEventListener('click',event=>{
    if (performance.now()<suppressClickUntil) {event.preventDefault();return;}
    if (originals.length<2) return;
    const card=event.target.closest('.project-card'); if(!card) return;
    const i=slides.indexOf(card);
    if(i!==current) {event.preventDefault();goTo(i*stride);}
  });
  viewport.addEventListener('dragstart',event=>event.preventDefault());
  viewport.addEventListener('pointerdown',event=>{
    if(event.button!==0 || !event.isPrimary || originals.length<2) return;
    tween=null;drag={id:event.pointerId,x:event.clientX,y:event.clientY,origin:offset,moved:false};
  });
  viewport.addEventListener('pointermove',event=>{
    if(!drag || event.pointerId!==drag.id) return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved && Math.abs(dx)>6 && Math.abs(dx)>Math.abs(dy)) {
      drag.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');
    }
    if(drag.moved) {offset=drag.origin-dx;paint();}
  });
  function release(event) {
    if(!drag || event.pointerId!==drag.id) return;
    if(drag.moved) suppressClickUntil=performance.now()+350;
    drag=null;viewport.classList.remove('is-dragging');holdUntil=performance.now()+1200;
    if(viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    wake();
  }
  viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
  viewport.addEventListener('lostpointercapture',release);
  viewport.addEventListener('wheel',event=>{
    if(originals.length<2 || Math.abs(event.deltaX)<=Math.abs(event.deltaY)) return;
    event.preventDefault();tween=null;offset+=event.deltaX*(event.deltaMode===1?16:1);holdUntil=performance.now()+1200;paint();wake();
  },{passive:false});
  viewport.addEventListener('mouseenter',()=>{hovering=true;});
  viewport.addEventListener('mouseleave',()=>{hovering=false;wake();});
  track.addEventListener('focusout',()=>setTimeout(wake,0));
  document.addEventListener('visibilitychange',()=>{lastTime=0;wake();});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;lastTime=0;wake();},{threshold:0.1}).observe(viewport);
  let resizeFrame;
  new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>measure());}).observe(viewport);
  reduced.addEventListener('change',()=>{playing=!reduced.matches;tween=null;syncButton();wake();});
  track.addEventListener('projectsupdated',rebuild);
  rebuild();document.fonts.ready.then(()=>measure());
})();
