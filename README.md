# Srikanth Mangipudi — portfolio

A responsive, buildless portfolio using HTML, CSS, vanilla JavaScript, and original SVG/CSS illustrations. No runtime JavaScript dependencies. Google Fonts is the only external presentation dependency; system fonts provide fallbacks.

## Preview

From this directory run `python -m http.server 8765 --directory dist` and open http://localhost:8765.

## Deploy to Vercel

Upload this directory to a GitHub repository you own, then import it into Vercel. Select Framework Preset **Other**, leave the build command empty, and set Output Directory to **dist**. The included `vercel.json` declares that output directory. Do not upload `work/`, the company work log, or credentials. Sites hosting metadata under `.openai/` is unrelated to Vercel and can be omitted from a Vercel-only repository.

Vercel reference: https://vercel.com/docs/deployments and https://vercel.com/docs/project-configuration#outputdirectory.

## Content updates

Edit `dist/index.html` for project descriptions, links, email, and experience. Styles are in `dist/style.css`; motion and filtering are in `dist/app.js`. All meaningful content remains readable without JavaScript. Keyboard focus, reduced-motion preferences, semantic sections, and native expandable details are supported.

The email and LinkedIn URL were taken from your existing public Portfolio_Srikanth repository; confirm they are current. The resume was not provided, so there is no fake download link. Add the actual resume under dist/assets/ and link it after review. TomiRen is marked in development because the user described it that way; the user identified their contributor role and supplied https://github.com/Saroj-Pedada/TomiRen. Unauthenticated GitHub API access returns 404, so the local project at D:/my_learning/TOMI-REN was subsequently reviewed. Package manifests, catalog/search source, placeholder checkout/admin pages, and commit authorship establish the stack and current development stage. The supplied URL is linked with an access-required note. The portfolio now includes source-backed catalog/search capabilities, contributions authored by msris93197-dev, and a clearly labeled storefront concept. No live demo or production performance claims are made.

Professional work is sourced from the supplied work log and user clarification that IAM includes a FastAPI backend. The featured platform case study elevates IAM/database work, IAM–licensing integration, complete admin frontend/backend ownership, and website/deployment contributions. Its architecture diagram is explicitly conceptual; it does not disclose production topology. Four selectable contributions update the explanatory illustration and highlight relevant platform components. It omits internal security configuration, database layout, hardware precision, future plans and line-count claims. Illustrations are labeled conceptual and are not screenshots of proprietary applications. Project Bridge's repository describes shared work; the site does not assert sole authorship. Confirm individual contributions before expanding that case study. The older TimeTable_tracker experiment is omitted at the user’s request; the existing portfolio itself is not presented as a product project.

## Recruiter readiness

Add your resume and exact employment titles, education and internship organisation from verified resume content. Pin Project Bridge, Cadence and TomiRen on GitHub when the latter is ready. Give each project a concise README with the problem, your own contribution, setup steps, screenshot, live demo and known limitations. Prefer measured user or reliability outcomes over lines of code. Add a custom domain and absolute canonical/OG image URLs after selecting public hosting.

## Project recommendations

### Project Bridge: highest priority

Review based on public `server/app.js`, `server/routes/projectRoutes.js`, `server/controllers/userController.js`, and repository README; this is a targeted inspection, not a full security audit.

1. Register session and Passport middleware before protected routers. They currently follow the main route mounts. Add authentication, role and resource-ownership checks to every protected endpoint; project create/update/delete routes show no router-level guards in the reviewed file. Never trust a URL teacherId or userId as authorization. Verify any controller checks as part of this change.
2. Replace the committed session secret with an environment secret and rotate it for any deployment using that value. Use a production session store, secure/httpOnly cookies over HTTPS, deliberate SameSite settings, CSRF protection where needed, and OAuth state verification. Avoid assigning a teacher role to every non-student email. Use an explicit verified institutional domain and server-controlled role provisioning.
3. Replace the hard-coded port, localhost CORS origin and redirects with validated environment configuration. Bind to the hosting provider's PORT. Deploy the React client on Vercel and the existing Express server as a Render web service, with a managed MongoDB database. Configure OAuth redirect URLs and cookies for actual domains; same-origin proxying or related custom domains simplifies cookie behavior. This deployment recommendation follows the existing split client/server structure.
4. Add request validation, pagination and indexes driven by real query patterns. Use projections and lean queries for read-only lists when appropriate. Make application decisions atomic and prevent duplicate requests with suitable constraints. Benchmark before optimizing.
5. Add integration tests for unauthorized writes, cross-user access, concurrent acceptance, duplicate applications, and invalid input. Provide a seeded read-only demo without real student records. Clarify Firebase versus Passport authentication in the README: both are present in the repository's descriptions/source.

References: https://expressjs.com/en/advanced/best-practice-security/ and https://render.com/docs/deploy-node-express-app.

### Cadence

The repository already lists a GitHub Pages deployment and backup support. Keep that simple static hosting. Improvements worth prioritizing: multi-tab conflict detection using storage events and revision checks, versioned backup migrations, automated tests for date boundaries and restore behavior, and accessible heatmap descriptions. If users request multi-device syncing, introduce explicit accounts and sync conflict handling; localStorage alone cannot provide sync. Consider IndexedDB only once data size or structured querying justifies it.

### TomiRen

Local-source review confirms React/TypeScript/Vite, Express/TypeScript, PostgreSQL/Drizzle and shared Zod schemas. Catalog/search are implemented in the inspected source; checkout and admin pages are placeholders. Your commit history records catalog APIs, product detail and category tree, PostgreSQL search/suggestions, shared contracts, API/query infrastructure, UI/filter controls, and query-plan analysis on a seeded 50k-product dataset. This is shared work with Saroj; the portfolio only credits your recorded contributions. Tests exist, but were not run during this read-only review.

1. Deploy the React storefront on Vercel with npm workspace support and access to packages/shared. Set the web project root to apps/web and confirm shared-package imports resolve during production builds. See https://vercel.com/docs/monorepos.
2. Host the Express API as a long-running service (Render is one option) with managed PostgreSQL. The API package currently has dev/typecheck/test scripts but no production build/start scripts: add those before deployment, and ensure shared-package exports resolve in built JavaScript. Pin a currently supported Node version compatible with the project. See https://render.com/docs/deploy-node-express-app.
3. The Vite /api proxy is development-only and strips /api. Configure an equivalent production rewrite/proxy, or an explicit API origin and CORS policy; preserve the path translation. Frontend routes also need an SPA fallback that does not swallow API requests.
4. Apply reviewed migrations once through a controlled deployment job; use a restricted runtime database role and separate migration credentials. Use synthetic seed data for recruiter demos. Keep credentials in host environment settings.
5. Continue query-plan analysis, but measure full HTTP latency with realistic concurrent requests before claiming production performance. The 50k dataset/EXPLAIN results are development evidence, not a load-test SLA. Watch facet-query cost and repeated per-product subqueries with actual plans before rewriting them.
6. Complete server-authoritative totals, stock reservations, idempotent checkout, verified payment callbacks/webhooks and authorization before taking real payments. Keep price-history functionality and Split-Pay clearly on the roadmap until implemented and tested. Publish a read-only catalog demo first; it already demonstrates meaningful engineering without unfinished payment flows.

## Verification

JavaScript syntax checked with Node. Browser checks cover desktop presentation, native case-study expansion, project filtering and motion pause. Mobile QA is recorded in the final handoff. Site publication is a separate private review deployment; it is not a Vercel deployment and is not a recruiter-public URL.

Latest platform update: JavaScript syntax and successful local HTTP response checked. Browser visual QA for this update was blocked when the existing preview tab resolved to an unsupported browser error URL; desktop/mobile CSS was reviewed in source, but the new layout has not received a fresh browser visual check. Earlier portfolio browser checks apply to the prior layout.

Layout cleanup: the platform diagram has no selected-node outline on initial load; intentional contribution selections still highlight the related components. Project Bridge and Cadence use equal-width grid columns and stretched cards with matching minimum content heights. The old tracker link has been removed.

## Pantrix addition — 20 October 2026

Added the online grocery store using the user-supplied description and public repository README. Stack: Java, Spring Boot, JPA/Hibernate, MySQL, JSP/Bootstrap, Docker and Render. Both live app and source links are included. The card uses an original conceptual basket illustration, without screenshots or invented product data. Three standard project cards share a row on wide screens; the wider TomiRen feature is retained. The Render wake-up note is supported by the repository README. Feature behavior was not independently exercised during this content update.

## Structure redesign — 21 October 2026

Clear section directory and Professional experience / Personal projects headings replace ambiguous editorial labels. Company work is grouped under a shared QAIG & QULABS employer/date header. All professional projects use the same light card surface and named titles. The platform illustration and contribution selector remain available inside an expandable case study. Personal project links, equal-height cards and the TomiRen feature are retained.

Redesign verification: desktop and 390px mobile browser review passed, with no horizontal overflow. All three company project cards have identical background colors. The platform case-study disclosure and licensing contribution selector were exercised successfully. Personal project cards remain responsive. JavaScript syntax and HTML section identifiers checked.

## Pantrix brand update

Replaced the conceptual vegetable-basket drawing with the actual storefront branding from layouts/app-header.jsp and css/theme.css: Font Awesome shopping-basket glyph, bold Inter wordmark, brand brown #6B3F23 and cream #FBF7F1. The icon path is from the bundled Font Awesome Free font; attribution: https://fontawesome.com / https://fontawesome.com/license/free. The live storefront timed out during inspection; branding was verified against the public repository source.

## Interactive frontend redesign

The design research reviewed Brittany Chiang (https://brittanychiang.com/), Josh Comeau (https://www.joshwcomeau.com/), and Bruno Simon (https://bruno-simon.com/). Adopted principles: visible social/contact links and clear experience/project hierarchy; small responsive interactions; one memorable interactive centerpiece. Their code, illustrations and branding were not copied.

New presentation: a typographic hero and local engineering workbench with platform/desktop/data modes and a three-step illustrative flow. A sticky header includes GitHub, LinkedIn, active-section indicators, a reading-progress line, and quick navigation (Ctrl/Cmd+K). Project detail dialogs provide problem, engineering focus, scope and source/live links. The employer context uses a sticky desktop rail and compact mobile layout. Pantrix branding, actual portfolio content and the experience/personal-project separation are preserved. Project hover treatments, scroll reveals and copy-email feedback complete the interaction layer. No frontend framework or heavy 3D engine is required.

Interactive workbench states are demonstrations only; they do not call company services or imply measured latency. Native dialogs provide modal focus handling and Escape dismissal. Reduced-motion preferences and the existing motion pause control are respected. All original static content and links remain readable without JavaScript; interactive dialogs and workflow demos require JavaScript.

Interactive redesign QA: desktop and 390px mobile views checked with no horizontal overflow; both header social links visible. Workflow completion, motion-paused immediate completion, project dialog content/links, quick-navigation filtering, Ctrl+K opening, Escape dismissal, and existing admin case-study selection passed browser checks. No browser JavaScript errors were recorded. Node syntax checks passed. Native clipboard permission can vary by browser; copy-email has a visible-address fallback.
