(() => {
  const root = document.documentElement;
  root.classList.add("js", "motion-ready");
  const gsapReady = Boolean(window.gsap && window.ScrollTrigger);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  const toggle = document.getElementById("theme-toggle");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    const dark = theme === "dark";
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    toggle.setAttribute("aria-pressed", String(dark));
    if (metaTheme) metaTheme.setAttribute("content", dark ? "#101112" : "#f7f8fa");
  };
  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  // Smooth switch: the new theme spreads as a circle from the toggle
  // (View Transitions); other browsers get a quick colour cross-fade.
  // Registered so the reveal radius can be animated smoothly (feathered edge).
  let featherReady = false;
  try { CSS.registerProperty({ name: "--vt-r", syntax: "<length>", inherits: false, initialValue: "0px" }); featherReady = true; }
  catch (e) { featherReady = e && e.name === "InvalidModificationError"; }
  let switching = false;
  const switchTheme = (next, x, y) => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("motion-paused");
    if (calm) { applyTheme(next); return; }
    if (!document.startViewTransition) {
      root.classList.add("theme-fade");
      applyTheme(next);
      setTimeout(() => root.classList.remove("theme-fade"), 650);
      return;
    }
    // A soft-edged circle (feathered mask) eases out from the toggle; the old
    // view dims slightly underneath so the hand-off feels effortless.
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 160;
    const feather = CSS.registerProperty !== undefined && CSS.supports("mask-image", "radial-gradient(#000, transparent)") && featherReady;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    switching = true;
    root.classList.add("theme-vt");
    if (feather) root.classList.add("theme-vt-soft");
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      // fill: "forwards" holds the final frame until the transition ends (no flash-back).
      const timing = { duration: 950, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" };
      if (feather) {
        root.animate({ "--vt-r": ["0px", `${r}px`] }, { ...timing, pseudoElement: "::view-transition-new(root)" });
      } else {
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { ...timing, pseudoElement: "::view-transition-new(root)" });
      }
      root.animate({ opacity: [1, .85] }, { ...timing, pseudoElement: "::view-transition-old(root)" });
    }).catch(() => {});
    vt.finished.finally(() => { root.classList.remove("theme-vt-soft", "theme-vt"); switching = false; });
  };
  toggle.addEventListener("click", (e) => {
    if (switching) return; // let the current reveal finish cleanly
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    const b = toggle.getBoundingClientRect();
    const x = e.clientX || b.left + b.width / 2, y = e.clientY || b.top + b.height / 2;
    switchTheme(next, x, y);
    try { localStorage.setItem("theme", next); } catch (err) { /* storage unavailable */ }
  });
  // Follow the OS setting until the visitor picks a theme themselves
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (err) { /* ignore */ }
    if (!saved) applyTheme(e.matches ? "dark" : "light");
  });

  document.querySelector('.guide-float')?.addEventListener('click', () => {
    document.getElementById('navigation-guide')?.focus({ preventScroll: true });
  });
  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header border on scroll ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector(".menu-btn");
  const links = document.getElementById("nav-links");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Active section in nav ---------- */
  const navLinks = [...links.querySelectorAll("a")];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (!reduced && !gsapReady && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Count-up numbers ---------- */
  if (!reduced && !gsapReady && "IntersectionObserver" in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 1200, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach((c) => countIO.observe(c));
  }

  /* ---------- Pause SVG (SMIL) animations for reduced motion ---------- */
  if (reduced) document.querySelectorAll("svg").forEach((s) => s.pauseAnimations && s.pauseAnimations());

  /* ---------- Experience: card ↔ system-map highlighting ---------- */
  document.querySelectorAll(".track").forEach((track) => {
    const map = track.querySelector(".map");
    if (!map) return;
    const parts = map.querySelectorAll("[data-part]");
    const cards = track.querySelectorAll(".xcard");
    let pinned = null;
    const show = (card) => {
      if (!card) {
        map.classList.remove("focusing");
        parts.forEach((p) => p.classList.remove("on"));
        cards.forEach((c) => c.classList.remove("is-on"));
        return;
      }
      const wanted = (card.dataset.parts || "").split(/\s+/);
      map.classList.add("focusing");
      parts.forEach((p) => p.classList.toggle("on", wanted.includes(p.dataset.part)));
      cards.forEach((c) => c.classList.toggle("is-on", c === card));
    };
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => show(card));
      card.addEventListener("mouseleave", () => show(pinned));
      card.addEventListener("focus", () => show(card));
      card.addEventListener("blur", () => show(pinned));
      card.addEventListener("click", () => {
        pinned = pinned === card ? null : card;
        show(pinned);
      });
    });
  });

  /* ---------- Lazy résumé preview: the PDF loads only as you approach it ---------- */
  const pdfSlot = document.querySelector(".pdf-slot");
  if (pdfSlot) {
    const loadPdf = () => {
      if (pdfSlot.dataset.loaded) return;
      pdfSlot.dataset.loaded = "1";
      const obj = document.createElement("object");
      obj.type = "application/pdf";
      obj.data = pdfSlot.dataset.pdf;
      obj.setAttribute("aria-label", "Resume preview");
      obj.innerHTML = '<div class="frame-fallback"><p>Your browser can’t preview PDFs here.</p>' +
        '<a class="btn btn-primary btn-sm" href="assets/Srikanth_Mangipudi_Resume.pdf" target="_blank" rel="noopener">Open resume ↗</a></div>';
      const done = () => pdfSlot.classList.add("is-loaded");
      obj.addEventListener("load", done, { once: true });
      setTimeout(done, 1600);
      pdfSlot.append(obj);
    };
    if ("IntersectionObserver" in window) {
      const pdfIO = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { pdfIO.disconnect(); loadPdf(); }
      }, { rootMargin: "900px 0px" });
      pdfIO.observe(pdfSlot);
    } else loadPdf();
  }

  /* ---------- Compose email (opens visitor's mail app) ---------- */
  const compose = document.getElementById("compose");
  compose?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(compose);
    const name = String(data.get("name") || "").trim();
    const company = String(data.get("company") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = `Opportunity for Srikanth${company ? " — " + company : ""}`;
    const body = `${message}\n\n— ${name}${company ? "\n" + company : ""}`;
    window.location.href = `mailto:mangipudisrikanth03@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById("copy-email");
  const toast = document.querySelector(".toast");
  let timer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { toast.hidden = true; }, 2200);
  };
  copyBtn?.addEventListener("click", async () => {
    const email = copyBtn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied ✓");
    } catch (e) {
      showToast(email);
    }
  });
})();
