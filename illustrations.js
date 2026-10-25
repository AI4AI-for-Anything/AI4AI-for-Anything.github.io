'use strict';
// Keep decorative artwork calm outside the viewport and when the tab is hidden.
(() => {
  const scenes = document.querySelectorAll('.art-scene, .workflow');
  const visible = new Set();
  const sync = () => scenes.forEach(scene => scene.classList.toggle('is-in-view', !document.hidden && visible.has(scene)));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {if(entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);});
    sync();
  }, {rootMargin:'50px'});
  scenes.forEach(scene => observer.observe(scene));
  document.addEventListener('visibilitychange', sync);
})();
