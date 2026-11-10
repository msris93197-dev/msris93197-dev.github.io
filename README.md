# Srikanth Mangipudi — Portfolio

A fast, dependency-free portfolio site (HTML + CSS + vanilla JS). Everything that ships lives in `dist/`.

```
dist/
  index.html        # all content (experience, skills, projects, education, resume, contact)
  style.css         # design tokens, layout, light/dark themes, responsive rules
  app.js            # mobile menu, active nav, scroll reveals, stat counters, copy email
  favicon.svg
  assets/
    Srikanth_Mangipudi_Resume.pdf   # linked from nav, hero, resume section and contact
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
