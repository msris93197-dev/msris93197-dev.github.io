(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  const toggle = document.getElementById("theme-toggle");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    const dark = theme === "dark";
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    toggle.setAttribute("aria-pressed", String(dark));
    if (metaTheme) metaTheme.setAttribute("content", dark ? "#0e1624" : "#f7f8fa");
  };
  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
  });
  // Follow the OS setting until the visitor picks a theme themselves
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (err) { /* ignore */ }
    if (!saved) applyTheme(e.matches ? "dark" : "light");
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
  if (!reduced && "IntersectionObserver" in window) {
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
  if (!reduced && "IntersectionObserver" in window) {
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
