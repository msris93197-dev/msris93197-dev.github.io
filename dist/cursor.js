/* ==========================================================================
   Cursor · GSAP
   A precise dot plus a trailing ring that:
   - stretches along the direction of travel (velocity-aware),
   - snaps around buttons and nav items (sticky focus frame),
   - shows a short action label on links that leave the page or download,
   - hands back to the native cursor on text fields, the PDF and touch.
   Fine pointers only; disabled for reduced motion and "Pause motion".
   ========================================================================== */
(() => {
  if (!window.gsap) return;
  const root = document.documentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const enabled = () => fine.matches && !reduced.matches && !root.classList.contains('motion-paused');

  const layer = document.createElement('div');
  layer.className = 'cursor';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="cursor-ring"><span class="cursor-shape"></span><span class="cursor-label"></span></div><div class="cursor-dot"></div>';
  document.body.append(layer);
  const ring = layer.querySelector('.cursor-ring');
  const shape = layer.querySelector('.cursor-shape');
  const label = layer.querySelector('.cursor-label');
  const dot = layer.querySelector('.cursor-dot');

  const STICK = '.btn, .theme-toggle, .nav-links a, .socials a, .guide-float, .menu-btn, .brand, .ptz-controls button, .ptz-targets button, .motion-control';
  const NATIVE = 'input, textarea, select, [contenteditable="true"], object, iframe, .pdf-slot';
  const INTERACTIVE = 'a, button, [role="button"], label, summary, .xcard';

  const SIZE = 34;
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { x: mouse.x, y: mouse.y };
  let visible = false, stuck = null, lit = null, mode = '';

  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
  gsap.set(ring, { width: SIZE, height: SIZE });
  const dotX = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3.out' });
  const setRing = { x: gsap.quickSetter(ring, 'x', 'px'), y: gsap.quickSetter(ring, 'y', 'px') };
  const setShape = { r: gsap.quickSetter(shape, 'rotation', 'deg'), sx: gsap.quickSetter(shape, 'scaleX'), sy: gsap.quickSetter(shape, 'scaleY') };

  // Ring follows with frame-rate independent smoothing; it stretches with speed.
  const follow = () => {
    let tx = mouse.x, ty = mouse.y;
    const k = 1 - Math.pow(1 - .2, gsap.ticker.deltaRatio());
    const dx = tx - pos.x, dy = ty - pos.y;
    pos.x += dx * k; pos.y += dy * k;
    setRing.x(pos.x); setRing.y(pos.y);
    if (!stuck && !mode) {
      const speed = Math.min(Math.hypot(dx, dy) / 90, .38);
      setShape.r(Math.atan2(dy, dx) * 180 / Math.PI);
      setShape.sx(1 + speed); setShape.sy(1 - speed * .55);
    } else { setShape.r(0); setShape.sx(1); setShape.sy(1); }
  };

  const morph = (vars) => gsap.to(ring, { duration: .45, ease: 'expo.out', overwrite: 'auto', ...vars });
  let native = false;
  const paint = () => {
    layer.className = ['cursor', visible && 'is-visible', native && 'is-native', stuck && 'is-stuck',
      mode.startsWith('label') && 'is-label', mode === 'hint' && 'is-hint', mode === 'hover' && 'is-hover'].filter(Boolean).join(' ');
  };

  // Over controls the ring melts into the dot; the control's own hover takes over.
  function stick(el) {
    stuck = el; mode = '';
    paint();
    morph({ width: 8, height: 8, '--r': '4px' });
  }

  function reset() {
    stuck = null; mode = '';
    paint();
    morph({ width: SIZE, height: SIZE, '--r': `${SIZE / 2}px` });
  }

  function setMode(el) {
    if (!el || !el.closest) return;
    const isNative = Boolean(el.closest(NATIVE));
    if (isNative !== native) { native = isNative; root.classList.toggle('cursor-native', native); paint(); }
    if (native) { if (stuck || mode) reset(); return; }

    const sticky = el.closest(STICK);
    if (sticky) { if (sticky !== stuck) stick(sticky); return; }

    const link = el.closest('a');
    let text = '';
    if (link?.hasAttribute('download')) text = 'Download';
    else if (link?.matches('[href^="mailto:"]')) text = 'Email';
    else if (link?.target === '_blank') text = 'Open ↗';
    const hint = !text && el.closest('.xcard') ? 'Click to pin on diagram' : '';
    const interactive = Boolean(el.closest(INTERACTIVE));
    const next = text ? `label:${text}` : hint ? 'hint' : interactive ? 'hover' : '';
    if (next === mode && !stuck) return;
    stuck = null; mode = next;
    label.textContent = text || hint;
    paint();
    const size = text ? (text.length > 6 ? 80 : 64) : hint ? 22 : interactive ? 54 : SIZE;
    morph({ width: size, height: size, '--r': `${size / 2}px` });
  }

  function show(e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (visible) return;
    visible = true;
    pos.x = mouse.x; pos.y = mouse.y;
    gsap.set(dot, { x: mouse.x, y: mouse.y });
    root.classList.add('has-cursor');
    paint();
    gsap.ticker.add(follow);
  }

  function hide() {
    if (!visible) return;
    visible = false; stuck = null; mode = ''; native = false;
    root.classList.remove('has-cursor', 'cursor-native');
    paint();
    gsap.set(ring, { width: SIZE, height: SIZE, '--r': `${SIZE / 2}px` });
    gsap.ticker.remove(follow);
    lit?.classList.remove('cursor-lit'); lit = null;
  }

  // Soft spotlight that follows the pointer across cards.
  function spotlight(e) {
    const card = e.target.closest('.project, .pillar, .up, .edu');
    if (lit && lit !== card) lit.classList.remove('cursor-lit');
    lit = card;
    if (!card) return;
    const b = card.getBoundingClientRect();
    card.style.setProperty('--px', `${e.clientX - b.left}px`);
    card.style.setProperty('--py', `${e.clientY - b.top}px`);
    card.classList.add('cursor-lit');
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !enabled()) { hide(); return; }
    show(e);
    dotX(e.clientX); dotY(e.clientY);
    setMode(e.target);
    spotlight(e);
  }, { passive: true });

  document.addEventListener('pointerdown', (e) => {
    if (!visible || e.pointerType !== 'mouse') return;
    gsap.to(shape, { scale: .78, duration: .18, ease: 'power3.out', overwrite: 'auto' });
    gsap.fromTo(dot, { width: 6, height: 6 }, { width: 13, height: 13, duration: .16, yoyo: true, repeat: 1, ease: 'power2.out', overwrite: 'auto' });
  });
  document.addEventListener('pointerup', () => {
    if (visible) gsap.to(shape, { scale: 1, duration: .7, ease: 'elastic.out(1, .4)', overwrite: 'auto' });
  });
  // While the page scrolls under a still pointer, re-read what is beneath it.
  let queued = false;
  addEventListener('scroll', () => {
    if (!visible || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; setMode(document.elementFromPoint(mouse.x, mouse.y)); });
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', hide);
  addEventListener('blur', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Tab') hide(); });
  fine.addEventListener('change', hide);
  reduced.addEventListener('change', hide);
  document.querySelector('#motion-control')?.addEventListener('click', hide);
})();
