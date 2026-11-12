# Srikanth Mangipudi — Portfolio

A fast portfolio site (HTML + CSS + vanilla JS, with GSAP vendored locally for motion). Everything that ships lives in `dist/`.

```
dist/
  index.html        # all content (experience, skills, projects, education, resume, contact)
  style.css         # design tokens, layout, light/dark themes, responsive rules
  refined.css       # current palette and illustration styles
  app.js            # theme, mobile menu, active nav, lazy résumé preview, copy email; no-GSAP fallbacks
  motion.js/.css    # GSAP + ScrollTrigger: intro, text reveals, illustration assembly, scroll polish
  cursor.js/.css    # GSAP cursor (fine pointers only): trailing ring, snap-to-button, action labels
  vendor/           # gsap.min.js, ScrollTrigger.min.js (3.13)
  favicon.svg
  assets/
    Srikanth_Mangipudi_Resume.pdf   
.github/workflows/pages.yml         # auto-deploys dist/ to GitHub Pages on every push to main
vercel.json                         # optional: deploy the same dist/ on Vercel instead
```

## Preview locally

```
python -m http.server 8765 --directory dist
```
Open http://localhost:8765.

## Update content

- Text and links: edit `dist/index.html`.
- New resume: replace `dist/assets/Srikanth_Mangipudi_Resume.pdf` (keep the same file name).
- Then `git add -A && git commit -m "Update" && git push`. GitHub Actions redeploys in about a minute.
