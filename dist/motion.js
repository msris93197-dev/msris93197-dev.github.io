/* ==========================================================================
   Motion system · GSAP 3.13 + ScrollTrigger
   - Native scrolling (no scroll-jacking); every effect is progressive.
   - One easing family (expo/power3) and one rhythm so the page feels designed.
   - Content is revealed lazily as it enters the viewport; illustrations
     assemble on arrival and pause their loops when off-screen.
   - Respects prefers-reduced-motion and the footer "Pause motion" control.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.intro-loader');
  const dropIntro = () => { loader?.remove(); root.classList.remove('intro-on'); };
  if (!window.gsap || !window.ScrollTrigger) { dropIntro(); return; }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const control = $('#motion-control');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const EASE = 'expo.out';
  let stopped = false;
  let introPlayed = false;
  let revealed = false;
  let passReady = false; // tilt starts once the card has landed // after a pause, content stays put; only ambient motion resumes
  const media = gsap.matchMedia();

  /* ---------- Text splitting (word masks, optional characters) ---------- */
  function split(el, chars = false) {
    if (!el) return { words: [], chars: [], revert() {} };
    const original = el.innerHTML;
    const words = [], letters = [];
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const mask = document.createElement('span');
            mask.className = 'sw';
            const inner = document.createElement('span');
            inner.className = 'sw-i';
            if (chars) {
              [...part].forEach((c) => {
                const s = document.createElement('span');
                s.className = 'sc'; s.textContent = c;
                inner.append(s); letters.push(s);
              });
            } else inner.textContent = part;
            mask.append(inner); frag.append(mask); words.push(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR' && child.tagName !== 'svg') walk(child);
      });
    };
    walk(el);
    if (chars) {
      el.setAttribute('aria-label', label);
      $$('.sw', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
    }
    return { words, chars: letters, revert() { el.innerHTML = original; if (chars) el.removeAttribute('aria-label'); } };
  }

  /* ---------- Illustration assembly (lazy: prepared hidden, built on entry) ---------- */
  function prepareArt(svg) {
    if (!svg || svg.__art) return svg?.__art;
    const parts = [...svg.children].filter((n) => !/^(defs|title|desc|style|marker)$/i.test(n.tagName));
    const lines = $$('path, line, polyline', svg).filter((p) => {
      const cs = getComputedStyle(p);
      return cs.stroke !== 'none' && cs.strokeDasharray === 'none' && p.getTotalLength && !p.closest('marker');
    });
    const lengths = lines.map((p) => { try { return Math.ceil(p.getTotalLength()) + 2; } catch (e) { return 0; } });
    gsap.set(parts, { autoAlpha: 0, y: 10 });
    lines.forEach((p, i) => lengths[i] && gsap.set(p, { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] }));
    svg.__art = { parts, lines, lengths };
    return svg.__art;
  }
  function buildArt(svg, delay = 0) {
    const art = prepareArt(svg);
    if (!art || art.built) return;
    art.built = true;
    const tl = gsap.timeline({ delay, onComplete: () => gsap.set(art.lines, { clearProps: 'strokeDasharray,strokeDashoffset' }) });
    tl.to(art.parts, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: { amount: Math.min(.9, art.parts.length * .03) } }, 0)
      .to(art.lines, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: { amount: .6 } }, .1);
  }

  /* ---------- Reveal helpers ---------- */
  const handled = new Set();
  const settle = (el) => { el.classList.add('in'); gsap.set(el, { clearProps: 'transform,opacity,visibility' }); };
  function batch(selector, from, opts = {}) {
    const els = $$(selector).filter((el) => !handled.has(el));
    if (!els.length) return;
    els.forEach((el) => { handled.add(el); prepareArtIn(el); });
    gsap.set(els, { autoAlpha: 0, ...from });
    const shown = new WeakSet();
    ScrollTrigger.batch(els, {
      start: opts.start || 'top 90%',
      onEnter: (entering) => {
        const group = entering.filter((el) => !shown.has(el));
        if (!group.length) return;
        group.forEach((el) => shown.add(el));
        gsap.to(group, {
        autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, rotationX: 0,
        duration: opts.duration || 1.1, ease: EASE, stagger: opts.stagger ?? .1, overwrite: true,
        onStart: () => group.forEach((el, i) => artIn(el).forEach((svg) => buildArt(svg, .2 + i * .1))),
        onComplete: () => group.forEach(settle),
        });
      },
    });
  }
  const artIn = (el) => $$('svg.engineering-viz, svg.pillar-art, .pillar-art svg', el);
  const prepareArtIn = (el) => artIn(el).forEach(prepareArt);

  /* ---------- Opening: optional first-visit intro, then the hero ---------- */
  function intro() {
    return new Promise((resolve) => {
      if (!loader || !root.classList.contains('intro-on')) { dropIntro(); resolve(); return; }
      try { sessionStorage.setItem('introSeen', '1'); } catch (e) { /* storage unavailable */ }
      const count = $('.il-count', loader), n = { v: 0 };
      const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
      const load = gsap.timeline()
        .from('.il-mark .il-ch', { yPercent: 120, duration: .8, ease: EASE, stagger: .07 })
        .from('.il-meta', { autoAlpha: 0, y: 8, duration: .6, ease: EASE }, .15)
        .to(n, { v: 100, duration: 1.05, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0)
        .to('.il-bar i', { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, 0);
      Promise.all([fonts, load.then()]).then(() => {
        gsap.timeline({ onComplete: dropIntro })
          .to('.il-inner', { yPercent: -60, autoAlpha: 0, duration: .55, ease: 'power3.in' })
          .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' }, '-=.2')
          .add(resolve, '-=.62');
      });
    });
  }

  function hero() {
    const heroEls = $$('.hero .reveal');
    heroEls.forEach((el) => { handled.add(el); el.classList.add('in'); });
    const name = split($('.hero h1'), true);
    const tag = split($('.hero .tagline'));
    const arc = $('.pass-arc');
    const tl = gsap.timeline({ defaults: { ease: EASE, duration: 1.1 } });
    tl.from('.brand, .nav-links > a, .nav-cta > *', { y: -18, autoAlpha: 0, stagger: .05, duration: .9, clearProps: 'transform,opacity,visibility' }, 0)
      .from('.hero .eyebrow', { y: 14, autoAlpha: 0, duration: .8 }, .05)
      .from('.hero .hello', { y: 22, autoAlpha: 0, duration: .9 }, .12)
      .from(name.chars, { yPercent: 118, rotation: 6, duration: 1.25, stagger: .026, transformOrigin: '0% 100%' }, .16)
      .from(tag.words, { yPercent: 115, duration: 1, stagger: .022 }, .5)
      .from('.hero .intro, .hero .actions > *, .hero .socials > *', { y: 22, autoAlpha: 0, duration: .9, stagger: .06 }, .7)
      .from('.pass', { y: 90, rotationX: 22, rotationY: -16, rotation: 3, autoAlpha: 0, transformPerspective: 1400, transformOrigin: '50% 100%', duration: 1.6 }, .3)
      .from('.pass-head > *, .pass-route .from, .pass-route .to', { y: 14, autoAlpha: 0, stagger: .07, duration: .8 }, .85);
    if (arc && arc.getTotalLength) {
      tl.from('.pass-plane', { autoAlpha: 0, duration: .5 }, 1)
        .fromTo(arc, { attr: { 'stroke-dashoffset': arc.getTotalLength() } }, { attr: { 'stroke-dashoffset': 0 }, duration: 1.2, ease: 'power2.inOut' }, 1);
    }
    tl.from('.pass-grid > div', { y: 12, autoAlpha: 0, stagger: .05, duration: .8 }, 1.05)
      .from('.pass-stack span', { scale: .5, autoAlpha: 0, stagger: .045, duration: .7, ease: 'back.out(2.2)' }, 1.25)
      .from('.pass-stub > *', { x: 18, autoAlpha: 0, stagger: .09, duration: .8 }, 1.15)
      .from('.strip', { autoAlpha: 0, duration: 1.2, ease: 'power2.out' }, 1.2);
    tl.call(() => { passReady = true; }, null, 1.95);
    return () => { name.revert(); tag.revert(); };
  }

  /* ---------- Everything below the fold ---------- */
  function scrollScenes(cleanups) {
    // Section headings: eyebrow wipes in, headline rises word by word.
    $$('.sec-head').forEach((head) => {
      handled.add(head); head.classList.add('in');
      const words = split($('h2', head));
      cleanups.push(words.revert);
      gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: head, start: 'top 86%', toggleActions: 'play none none none' } })
        .from($('.eyebrow', head), { clipPath: 'inset(0% 100% 0% 0%)', x: -10, duration: 1 })
        .from(words.words, { yPercent: 115, rotation: 2.5, duration: 1.15, stagger: .035 }, .08)
        .from($$(':scope > :not(.eyebrow):not(h2)', head), { y: 18, autoAlpha: 0, duration: .9 }, .35);
    });

    // Quick guide tiles cascade in.
    gsap.from('.guide-title', { y: 16, autoAlpha: 0, duration: .9, ease: EASE, scrollTrigger: { trigger: '.guide', start: 'top 92%', toggleActions: 'play none none none' } });
    batch('.guide-grid li', { y: 26 }, { stagger: .06, duration: .9, start: 'top bottom' });

    // Journey: the line draws, each milestone lands as the line reaches it.
    const journey = $('.journey');
    if (journey) {
      const stops = $$('li', journey);
      gsap.timeline({ scrollTrigger: { trigger: journey, start: 'top 82%', toggleActions: 'play none none none' } })
        .fromTo(journey, { '--jp': 0 }, { '--jp': 1, duration: 1.9, ease: 'power2.inOut' })
        .from(stops, { y: 22, autoAlpha: 0, duration: .9, ease: EASE, stagger: 1.6 / Math.max(stops.length, 1) }, .1)
        .from($$('.stop', journey), { scale: 0, duration: .6, ease: 'back.out(3)', stagger: 1.6 / Math.max(stops.length, 1) }, .15);
    }

    // The minor: lead line, then classroom → production rows connect.
    const minor = $('.minor');
    if (minor) {
      handled.add(minor); minor.classList.add('in');
      const lead = split($('.lead-text', minor));
      cleanups.push(lead.revert);
      const tl = gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: minor, start: 'top 82%', toggleActions: 'play none none none' } })
        .from(lead.words, { yPercent: 115, duration: 1.1, stagger: .045 })
        .from('.minor-intro, .cm-head', { y: 18, autoAlpha: 0, duration: .9, stagger: .1 }, .25);
      $$('.course-map li', minor).forEach((row, i) => {
        tl.from($('.cm-course', row), { x: -36, autoAlpha: 0, duration: .9 }, .45 + i * .11)
          .from($('.cm-link', row), { scaleX: 0, transformOrigin: '0% 50%', duration: .6, ease: 'power2.inOut' }, .6 + i * .11)
          .from($('.cm-now', row), { x: 36, autoAlpha: 0, duration: .9 }, .8 + i * .11);
      });
    }

    // Company banners: card rises, logo spins in, numbers count up.
    $$('.company').forEach((co) => {
      handled.add(co);
      gsap.set(co, { autoAlpha: 0, y: 50 });
      const tl = gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: co, start: 'top 86%', toggleActions: 'play none none none' }, onComplete: () => settle(co) })
        .to(co, { autoAlpha: 1, y: 0, duration: 1.1 })
        .from($('.company-mark', co), { scale: .3, rotation: -25, autoAlpha: 0, duration: 1, ease: 'back.out(1.8)' }, .2)
        .from($$('.company-info > *, .company-badge', co), { y: 14, autoAlpha: 0, duration: .8, stagger: .07 }, .3)
        .from($$('.company-stats li', co), { y: 20, autoAlpha: 0, duration: .8, stagger: .08 }, .45);
      $$('[data-count]', co).forEach((el, i) => {
        const end = Number(el.dataset.count), suffix = el.dataset.suffix || '', v = { n: 0 };
        el.textContent = '0' + suffix;
        tl.to(v, { n: end, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(v.n) + suffix; } }, .5 + i * .08);
        cleanups.push(() => { el.textContent = end + suffix; });
      });
    });

    // Experience diagrams build themselves; cards slide in beside them.
    $$('.map').forEach((map) => {
      handled.add(map);
      const svg = $('svg', map);
      prepareArt(svg);
      gsap.set(map, { autoAlpha: 0, y: 40 });
      gsap.timeline({ scrollTrigger: { trigger: map, start: 'top 85%', toggleActions: 'play none none none' }, onComplete: () => settle(map) })
        .to(map, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE })
        .add(() => buildArt(svg), .15)
        .from($$('figcaption > *, .ptz-targets, .ptz-controls, .ptz-status', map), { y: 10, autoAlpha: 0, duration: .7, stagger: .08, ease: EASE }, .3);
    });
    batch('.track-head', { y: 30 });
    batch('.xcard', { x: 46 }, { stagger: .09 });

    // Cards with illustrations.
    batch('.pillar', { y: 60, rotationX: 8, transformPerspective: 1000 }, { stagger: .12, duration: 1.2 });
    batch('.edu', { y: 36 }, { stagger: .12 });
    batch('.project', { y: 80, scale: .97 }, { stagger: .14, duration: 1.25, start: 'top 92%' });
    batch('.up', { y: 60, scale: .97 }, { stagger: .12, duration: 1.2 });
    batch('.skill', { x: -28 }, { stagger: .07, duration: .9 });

    // Resume: copy rises, the document drops onto the desk.
    const frame = $('.resume-frame');
    if (frame) {
      handled.add(frame);
      gsap.set(frame, { autoAlpha: 0, y: 90, rotation: 6 });
      gsap.to(frame, { autoAlpha: 1, y: 0, rotation: matchMedia('(max-width: 980px)').matches ? 0 : 1, duration: 1.4, ease: EASE,
        scrollTrigger: { trigger: frame, start: 'top 88%', toggleActions: 'play none none none' }, onComplete: () => settle(frame) });
    }
    batch('.resume-copy', { y: 36 });

    // Contact: the closing line gets the biggest moment on the page.
    const contact = $('.contact-copy');
    if (contact) {
      handled.add(contact); contact.classList.add('in');
      const h = split($('h2', contact));
      cleanups.push(h.revert);
      gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: contact, start: 'top 80%', toggleActions: 'play none none none' } })
        .from($('.eyebrow', contact), { clipPath: 'inset(0% 100% 0% 0%)', duration: 1 })
        .from(h.words, { yPercent: 115, rotation: 3, duration: 1.2, stagger: .05 }, .05)
        .from($$('.contact-lead, .contact-email, .contact-actions > *', contact), { y: 22, autoAlpha: 0, duration: .9, stagger: .07 }, .4);
    }
    const compose = $('.compose');
    if (compose) {
      handled.add(compose);
      gsap.set(compose, { autoAlpha: 0, y: 60, rotationX: 10, transformPerspective: 1200, transformOrigin: '50% 0%' });
      gsap.timeline({ scrollTrigger: { trigger: compose, start: 'top 88%', toggleActions: 'play none none none' }, onComplete: () => settle(compose) })
        .to(compose, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.3, ease: EASE })
        .from($$(':scope > *', compose), { y: 14, autoAlpha: 0, duration: .8, stagger: .07, ease: EASE }, .25);
    }

    // Anything else marked .reveal falls back to a calm rise.
    batch('.reveal', { y: 34 });
    batch('.footer > *', { y: 14 }, { start: 'top 99%', stagger: .08 });
  }

  /* ---------- Scroll-linked polish ---------- */
  function scrollPolish(cleanups) {
    // Reading progress
    gsap.fromTo('.reading-progress', { scaleX: 0 }, { scaleX: 1, ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: .25 } });

    // Gentle depth: the profile card floats up as the hero leaves.
    gsap.to('.pass-wrap', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    $$('.p-ill svg, .up-ill svg').forEach((svg) => {
      gsap.fromTo(svg, { yPercent: 4 }, { yPercent: -4, ease: 'none', scrollTrigger: { trigger: svg.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 } });
    });

    // Tech strip: GSAP loop that speeds up and leans with scroll velocity.
    const track = $('.strip-track');
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 });
      const skew = gsap.quickTo(track, 'skewX', { duration: .6, ease: 'power3.out' });
      let base = 1, settleCall;
      ScrollTrigger.create({
        trigger: '.strip', start: 'top bottom', end: 'bottom top',
        onToggle: (s) => (s.isActive ? loop.play() : loop.pause()),
        onUpdate: (s) => {
          const v = s.getVelocity();
          skew(gsap.utils.clamp(-7, 7, v / -260));
          gsap.to(loop, { timeScale: base * (1 + Math.min(Math.abs(v) / 450, 5)), duration: .25, overwrite: true });
          settleCall?.kill();
          settleCall = gsap.delayedCall(.18, () => { skew(0); gsap.to(loop, { timeScale: base, duration: 1.2, ease: 'power2.out', overwrite: true }); });
        },
      });
      const strip = $('.strip');
      const slow = () => { base = .15; gsap.to(loop, { timeScale: base, duration: .8, overwrite: true }); };
      const resume = () => { base = 1; gsap.to(loop, { timeScale: base, duration: .8, overwrite: true }); };
      strip.addEventListener('pointerenter', slow); strip.addEventListener('pointerleave', resume);
      cleanups.push(() => { strip.removeEventListener('pointerenter', slow); strip.removeEventListener('pointerleave', resume); settleCall?.kill(); });
    }

    // Header tucks away while reading down, returns the moment you scroll up.
    const nav = $('.nav'), links = $('#nav-links');
    let tucked = false;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (s) => {
        const tuck = s.direction === 1 && s.scroll() > 520 && !links.classList.contains('open') && !nav.contains(document.activeElement);
        if (tuck === tucked) return;
        tucked = tuck;
        gsap.to(nav, { yPercent: tuck ? -105 : 0, duration: tuck ? .45 : .7, ease: tuck ? 'power3.in' : EASE, overwrite: true });
      },
    });
    cleanups.push(() => gsap.set(nav, { clearProps: 'transform' }));

    // Lazy animation: loops inside illustrations only run while visible.
    $$('figure, .pillar-art, .pass').forEach((fig) => {
      const svgs = fig.tagName === 'svg' ? [fig] : $$('svg', fig);
      const set = (on) => {
        fig.classList.toggle('is-offscreen', !on);
        svgs.forEach((s) => (on ? s.unpauseAnimations?.() : s.pauseAnimations?.()));
      };
      set(false);
      ScrollTrigger.create({ trigger: fig, start: 'top bottom+=100', end: 'bottom top-=100', onToggle: (s) => set(s.isActive) });
      cleanups.push(() => fig.classList.remove('is-offscreen'));
    });
  }

  /* ---------- Desktop interactions ---------- */
  function interactions(cleanups) {
    const on = (el, type, fn) => { el.addEventListener(type, fn); cleanups.push(() => el.removeEventListener(type, fn)); };

    // Magnetic controls: they lean toward the pointer and settle back.
    $$('.btn, .theme-toggle, .socials a, .guide-float, .p-links a, .menu-btn').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      const strength = el.classList.contains('btn') ? .22 : .35;
      on(el, 'pointermove', (e) => {
        const b = el.getBoundingClientRect();
        xTo((e.clientX - b.left - b.width / 2) * strength);
        yTo((e.clientY - b.top - b.height / 2) * strength * 1.2);
      });
      on(el, 'pointerleave', () => { xTo(0); yTo(0); });
      cleanups.push(() => gsap.set(el, { clearProps: 'transform' }));
    });

    // Illustration lift on project, upcoming and pillar cards.
    $$('.project, .up, .pillar').forEach((card) => {
      const art = $('.p-ill svg, .up-ill svg, .pillar-art', card);
      if (!art) return;
      const sTo = gsap.quickTo(art, 'scale', { duration: .7, ease: 'power3.out' });
      on(card, 'pointerenter', () => sTo(1.035));
      on(card, 'pointerleave', () => sTo(1));
    });

    // Navigation: a soft pill glides under the pointer between links;
    // a short ink line marks the section you are reading.
    const links = $('#nav-links');
    if (links && matchMedia('(min-width: 981px)').matches) {
      const pill = document.createElement('span');
      const ink = document.createElement('span');
      pill.className = 'nav-pill'; ink.className = 'nav-ink';
      pill.setAttribute('aria-hidden', 'true'); ink.setAttribute('aria-hidden', 'true');
      links.prepend(pill); links.append(ink); links.classList.add('has-ink');
      let pillOn = false;
      const glide = (a) => {
        if (!a) { pillOn = false; gsap.to(pill, { autoAlpha: 0, scale: .9, duration: .35, ease: 'power2.out', overwrite: true }); return; }
        const box = { x: a.offsetLeft, y: a.offsetTop, width: a.offsetWidth, height: a.offsetHeight };
        if (!pillOn) gsap.set(pill, { ...box, scale: .85 });
        pillOn = true;
        gsap.to(pill, { ...box, autoAlpha: 1, scale: 1, duration: .55, ease: 'elastic.out(1, .75)', overwrite: true });
      };
      const mark = (a) => {
        if (!a) { gsap.to(ink, { autoAlpha: 0, duration: .3, overwrite: true }); return; }
        gsap.to(ink, { x: a.offsetLeft + a.offsetWidth / 2 - 8, width: 16, autoAlpha: 1, duration: .7, ease: EASE, overwrite: true });
      };
      const active = () => $('a.active', links);
      const mo = new MutationObserver(() => mark(active()));
      $$('a', links).forEach((a) => mo.observe(a, { attributes: true, attributeFilter: ['class'] }));
      on(links, 'pointerover', (e) => { const a = e.target.closest('a'); if (a) glide(a); });
      on(links, 'pointerleave', () => glide(null));
      mark(active());
      cleanups.push(() => { mo.disconnect(); ink.remove(); pill.remove(); links.classList.remove('has-ink'); });
    }

    // Buttons: a liquid fill spreads from the exact point the pointer enters
    // and drains back out the way it leaves; the icon nudges forward.
    $$('.btn, .guide-float').forEach((btn) => {
      const fill = document.createElement('span');
      fill.className = 'btn-fill'; fill.setAttribute('aria-hidden', 'true');
      btn.prepend(fill); btn.classList.add('has-fill');
      gsap.set(fill, { xPercent: -50, yPercent: -50, scale: 0 });
      const icon = $('svg', btn);
      const place = (e) => {
        const b = btn.getBoundingClientRect();
        const d = Math.hypot(b.width, b.height) * 2.1;
        gsap.set(fill, { x: e.clientX - b.left, y: e.clientY - b.top, width: d, height: d });
      };
      on(btn, 'pointerenter', (e) => {
        place(e);
        gsap.to(fill, { scale: 1, duration: .6, ease: 'power3.out', overwrite: true });
        if (icon) gsap.to(icon, { x: 3, duration: .4, ease: 'back.out(3)', overwrite: true });
      });
      on(btn, 'pointerleave', (e) => {
        place(e);
        gsap.to(fill, { scale: 0, duration: .5, ease: 'power3.inOut', overwrite: true });
        if (icon) gsap.to(icon, { x: 0, duration: .4, ease: 'power3.out', overwrite: true });
      });
      cleanups.push(() => { fill.remove(); btn.classList.remove('has-fill'); if (icon) gsap.set(icon, { clearProps: 'transform' }); });
    });
  }


  /* ---------- Profile card: cursor-driven perspective tilt ----------
     Measured on a wrapper that never transforms, so the maths stays stable.
     Anywhere in the hero the card leans gently toward the cursor; over the
     card it tilts fully, inner layers drift for depth and a light follows. */
  function tiltCard(cleanups) {
    const wrap = $('.pass-wrap'), pass = $('.pass'), hero = $('.hero');
    if (!wrap || !pass || !hero) return;
    const glare = document.createElement('span');
    glare.className = 'pass-glare'; glare.setAttribute('aria-hidden', 'true');
    pass.append(glare);
    gsap.set(pass, { transformPerspective: 1000, transformOrigin: '50% 50%' });
    const q = (el, prop, d = 1) => gsap.quickTo(el, prop, { duration: d, ease: 'power3.out' });
    const rx = q(pass, 'rotationX'), ry = q(pass, 'rotationY'), lift = q(pass, 'z', .8);
    const layers = [['.pass-head', 6], ['.pass-route', 14], ['.pass-grid', 8], ['.pass-stack', 18], ['.pass-stub > *', 10]]
      .map(([sel, depth]) => ({ els: $$(sel, pass), depth }))
      .filter((l) => l.els.length)
      .map((l) => ({ x: q(l.els, 'x', 1.1), y: q(l.els, 'y', 1.1), depth: l.depth }));
    let rect = null;
    const measure = () => { rect = wrap.getBoundingClientRect(); };
    const move = (e) => {
      if (e.pointerType === 'touch' || !passReady) return;
      if (!rect) measure();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      // -1..1 across the card; softened when the pointer is elsewhere in the hero
      const nx = gsap.utils.clamp(-1, 1, (e.clientX - cx) / (rect.width / 2));
      const ny = gsap.utils.clamp(-1, 1, (e.clientY - cy) / (rect.height / 2));
      const k = inside ? 1 : .32;
      rx(-ny * 11 * k); ry(nx * 13 * k); lift(inside ? 24 : 0);
      layers.forEach((l) => { l.x(nx * l.depth * k * .6); l.y(ny * l.depth * k * .6); });
      pass.classList.toggle('is-tilting', inside);
      if (inside) {
        pass.style.setProperty('--gx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        pass.style.setProperty('--gy', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      }
    };
    const reset = () => {
      rx(0); ry(0); lift(0);
      layers.forEach((l) => { l.x(0); l.y(0); });
      pass.classList.remove('is-tilting');
    };
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', reset);
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    cleanups.push(() => {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', reset);
      removeEventListener('scroll', measure);
      removeEventListener('resize', measure);
      glare.remove(); reset();
    });
  }

  /* ---------- Lifecycle ---------- */
  function configure() {
    media.revert();
    const quiet = stopped || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quiet) {
      dropIntro();
      $$('.reveal').forEach((el) => el.classList.add('in'));
      $$('svg').forEach((svg) => svg.pauseAnimations?.());
      return;
    }
    media.add('(prefers-reduced-motion: no-preference)', (ctx) => {
      root.classList.add('gsap-motion');
      const cleanups = [];
      let alive = true;
      const start = () => {
        if (!revealed) {
          try {
            cleanups.push(hero());
            scrollScenes(cleanups);
          } catch (err) {
            console.warn('Motion setup fell back to static content:', err);
            ScrollTrigger.getAll().forEach((st) => st.animation && st.animation.progress(1));
            $$('.reveal').forEach(settle);
          }
        }
        scrollPolish(cleanups);
        if (revealed) passReady = true;
        tiltCard(cleanups);
        if (finePointer.matches) interactions(cleanups);
        ScrollTrigger.refresh();
      };
      if (!introPlayed) { introPlayed = true; intro().then(() => alive && ctx.add(start)); } else start();
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => {
        alive = false;
        revealed = true;
        cleanups.forEach((fn) => fn && fn());
        root.classList.remove('gsap-motion');
        $$('.reveal').forEach((el) => el.classList.add('in'));
        $$('svg').forEach((svg) => { if (svg.__art) delete svg.__art; });
      };
    });
  }

  control?.addEventListener('click', () => {
    stopped = !stopped;
    control.setAttribute('aria-pressed', String(stopped));
    control.textContent = stopped ? 'Enable motion' : 'Pause motion';
    root.classList.toggle('motion-paused', stopped);
    configure();
  });
  configure();
})();

// PTZ demonstration (Vehant): pick a target in the scene, then send an
// authenticated command through the pipeline and watch the camera respond.
// Illustrative only; all state is local.
(() => {
  const scene = document.querySelector('.ptz-scene');
  if (!scene) return;
  const q = (s) => scene.querySelector(s);
  const status = document.querySelector('.ptz-status');
  const head = q('#ptz-head'), cone = q('#ptz-cone');
  const ret = q('#ptz-reticle'), retPath = q('#ptz-reticle path');
  const chip = q('#ptz-chip'), chipText = q('#ptz-chip text');
  const packet = q('#ptz-packet');
  const steps = ['#ptz-s1', '#ptz-s2', '#ptz-s3', '#ptz-s4'].map(q);
  const read = { pan: q('#ptz-pan'), tilt: q('#ptz-tilt'), zoom: q('#ptz-zoom'), state: q('#ptz-state') };
  const PIVOT = '72 150', PX = 72, PY = 150;
  const VIEW = { x: 12, y: 34, w: 376, h: 220 };
  const targets = {
    person1: { x: 196, y: 178, w: 30, h: 48, label: 'Pedestrian 1' },
    person2: { x: 300, y: 108, w: 30, h: 48, label: 'Pedestrian 2' },
    car: { x: 323, y: 227, w: 72, h: 40, label: 'Vehicle' },
  };
  const live = () => window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !document.documentElement.classList.contains('motion-paused');
  const brackets = (w, h, c = 8) => {
    const x = w / 2, y = h / 2;
    return `M${-x} ${-y + c}V${-y}H${-x + c}M${x - c} ${-y}H${x}V${-y + c}M${x} ${y - c}V${y}H${x - c}M${-x + c} ${y}H${-x}V${y - c}`;
  };
  const st = { sel: 'person1', pan: 0, tilt: 0, zoom: 1, w: 30, h: 48, angle: 0 };
  let scan = null, tl = null;

  const paint = () => {
    read.pan.textContent = `${st.pan >= 0 ? '+' : ''}${st.pan.toFixed(1)}°`;
    read.tilt.textContent = `${st.tilt >= 0 ? '+' : ''}${st.tilt.toFixed(1)}°`;
    read.zoom.textContent = `${st.zoom.toFixed(1)}×`;
  };
  const setState = (text, tone = '') => {
    read.state.textContent = text;
    read.state.setAttribute('class', `pz-read pz-state ${tone}`.trim());
  };
  const say = (text) => { if (status) status.textContent = text; };
  const drawReticle = () => retPath.setAttribute('d', brackets(st.w, st.h));
  const hot = (i, on) => steps[i]?.classList.toggle('is-hot', on);

  function startScan() {
    if (!live() || scan) return;
    setState('SCANNING');
    gsap.set(head, { rotation: -6, svgOrigin: PIVOT });
    scan = gsap.to(head, { rotation: 8, svgOrigin: PIVOT, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
  function stopScan() { scan?.kill(); scan = null; }

  function select(key, instant) {
    st.sel = key;
    const t = targets[key];
    const nx = (t.x - VIEW.x) / VIEW.w, ny = (t.y - VIEW.y) / VIEW.h;
    chipText.textContent = `x ${nx.toFixed(2)} · y ${ny.toFixed(2)}`;
    const chipY = t.y - t.h / 2 - 16;
    ret.classList.remove('locked');
    document.querySelectorAll('[data-scene-target]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sceneTarget === key)));
    if (instant || !live()) {
      ret.setAttribute('transform', `translate(${t.x} ${t.y})`);
      chip.setAttribute('transform', `translate(${t.x} ${chipY})`);
      st.w = t.w; st.h = t.h; drawReticle();
    } else {
      gsap.to(ret, { x: t.x, y: t.y, duration: .7, ease: 'expo.out', overwrite: true });
      gsap.to(chip, { x: t.x, y: chipY, duration: .75, ease: 'expo.out', overwrite: true });
      gsap.to(st, { w: t.w, h: t.h, duration: .6, ease: 'expo.out', onUpdate: drawReticle, overwrite: true });
    }
    say(`${t.label} selected at x ${nx.toFixed(2)}, y ${ny.toFixed(2)}. Send Move, Zoom or Stop.`);
  }

  // A command packet hops through the pipeline: scene → C++/ONVIF → Kafka → camera.
  function pipeline(timeline, stop) {
    packet.classList.toggle('is-stop', Boolean(stop));
    // Two-row snake: 01 → 02, 02 ↓ 03, 03 ← 04.
    const hops = [[[176, 293], [223, 293]], [[309, 319], [309, 331]], [[224, 361], [177, 361]]];
    const speed = stop ? .14 : .26;
    timeline.call(() => hot(0, true)).set(packet, { attr: { cx: 176, cy: 293, opacity: 1 } });
    hops.forEach(([[ax, ay], [bx, by]], i) => {
      timeline.set(packet, { attr: { cx: ax, cy: ay } })
        .to(packet, { attr: { cx: bx, cy: by }, duration: speed, ease: 'power1.inOut' })
        .call(() => { hot(i, false); hot(i + 1, true); })
        .to({}, { duration: stop ? .05 : .16 });
    });
    timeline.set(packet, { attr: { opacity: 0 } }).call(() => hot(3, false), null, '+=.15');
    return timeline;
  }

  function send(action) {
    stopScan(); tl?.kill(); steps.forEach((s, i) => hot(i, false));
    const t = targets[st.sel];
    const angle = Math.atan2(t.y - PY, t.x - PX) * 180 / Math.PI;
    const pan = ((t.x - VIEW.x) / VIEW.w - .5) * 90;
    if (action === 'stop') {
      if (live()) { gsap.killTweensOf(head); gsap.killTweensOf(st); gsap.killTweensOf(cone); }
      paint(); setState('STOPPED', 'stop');
      say('STOP sent at top priority. The camera head halts where it is; the mount stays fixed.');
      if (live()) tl = pipeline(gsap.timeline(), true);
      return;
    }
    setState('SENDING');
    say(action === 'zoom'
      ? `Zoom command for ${t.label}: authenticated, queued, then the lens narrows on the target.`
      : `Move command for ${t.label}: signed with WS-Security, queued in Kafka, then the head pans and tilts.`);
    if (!live()) {
      if (action === 'move') { head.setAttribute('transform', `rotate(${angle} ${PIVOT})`); st.pan = pan; st.tilt = -angle; st.angle = angle; }
      else st.zoom = 3;
      if (action === 'zoom') cone.setAttribute('transform', 'matrix(1 0 0 .42 0 87)');
      paint(); setState('ACK ✓', 'ok'); ret.classList.add('locked');
      return;
    }
    tl = pipeline(gsap.timeline(), false);
    if (action === 'move') {
      tl.to(head, { rotation: angle, svgOrigin: PIVOT, duration: 1.1, ease: 'power3.inOut' }, '-=.35')
        .to(st, { pan, tilt: -angle, duration: 1.1, ease: 'power3.inOut', onUpdate: paint }, '<');
      st.angle = angle;
    } else {
      // Aim first if needed, then narrow the field of view.
      if (Math.abs(st.angle - angle) > .5) {
        tl.to(head, { rotation: angle, svgOrigin: PIVOT, duration: .9, ease: 'power3.inOut' }, '-=.35')
          .to(st, { pan, tilt: -angle, duration: .9, ease: 'power3.inOut', onUpdate: paint }, '<');
        st.angle = angle;
      }
      tl.to(cone, { scaleY: .42, svgOrigin: '98 150', duration: .9, ease: 'expo.out' })
        .to(st, { zoom: 3, duration: .9, ease: 'expo.out', onUpdate: paint }, '<')
        .fromTo(ret, { scale: 1.25 }, { scale: 1, duration: .6, ease: 'back.out(2)', transformOrigin: '50% 50%' }, '<');
    }
    tl.call(() => { setState('ACK ✓', 'ok'); ret.classList.add('locked'); });
  }

  function reset() {
    tl?.kill(); stopScan();
    steps.forEach((s, i) => hot(i, false));
    if (window.gsap) {
      gsap.killTweensOf([head, cone, st, ret, chip]);
      gsap.set(packet, { attr: { opacity: 0 } });
      gsap.set(cone, { scaleY: 1, svgOrigin: '98 150' });
      gsap.set(head, { rotation: 0, svgOrigin: PIVOT });
    } else { head.removeAttribute('transform'); cone.removeAttribute('transform'); }
    Object.assign(st, { pan: 0, tilt: 0, zoom: 1, angle: 0 });
    paint(); setState('IDLE');
    select('person1', true);
    startScan();
  }

  document.querySelectorAll('[data-scene-target]').forEach((b) => b.addEventListener('click', () => { stopScan(); select(b.dataset.sceneTarget); }));
  document.querySelectorAll('[data-ptz]').forEach((b) => b.addEventListener('click', () => (b.dataset.ptz === 'reset' ? reset() : send(b.dataset.ptz))));
  const calm = () => { tl?.kill(); stopScan(); if (window.gsap) gsap.set(packet, { attr: { opacity: 0 } }); };
  document.querySelector('#motion-control')?.addEventListener('click', () => { if (document.documentElement.classList.contains('motion-paused')) calm(); else startScan(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', calm);

  paint();
  select('person1', true);
  setState(live() ? 'SCANNING' : 'IDLE');
  // Begin the idle sweep once the diagram has been built on screen.
  setTimeout(startScan, 1200);
})();
