# Self-Evaluation (Assignment 4) — Campus Radio  
Scope: Work I completed (excludes Manager/Producer items per team split)

## 1. Design (30 pts)
- **Initial Component Diagram (10/10):** Provided pre-code MVC-oriented component diagram in `Docs/diagrams.md` with dated description of Express routes, EJS views, models, and MongoDB.
- **Initial Sequence Diagram (10/10):** Documented pre-code request/response + DB flow for DJ page and add-track POST in `Docs/diagrams.md`, including short explanations and timestamps.
- **Updated Diagrams (10/10):** Updated component/sequence to reflect delivered system (session store, seeding, shared partials, catalog-backed add-track) in `Docs/diagrams.md`.

## 2. EJS Implementation (50 pts)
- **EJS Syntax (20/20):** Views use EJS conditionals/loops and helpers (`fmtSeconds`, session locals) correctly across `views/index.ejs` and `views/dj.ejs`.
- **Data Passing (10/10):** Server injects session-aware data (queue, stats, shows, catalog, lastRole, sessionId) into EJS; verified rendering in home + DJ routes.
- **EJS Views (10/10):** Dynamic pages with shared layout via partials (`views/partials/header.ejs`, `footer.ejs`) and page templates (`index.ejs`, `dj.ejs`); role nav highlights active page.
- **Directory Structure (10/10):** Clear separation of `routes/`, `views/`, `public/`, `models/`, `config/`, and `Docs/`; static assets under `public/css` and `public/js`.

## 3. Functionality (20 pts)
- **Working features (20/20):** Home page “continue where you left off” reflects session state; DJ dashboard supports validation, add/move/remove queue items, search/filter, show selection, catalog add-to-queue, and status messaging. Links/buttons route correctly.

## 4. Database Implementation (30 pts)
- **Database Setup (10/10):** `server.js` connects to MongoDB via `mongoose` and `connect-mongo` session store; seeding runs on startup.
- **Data Model Schema Design (10/10):** Schemas for `DJProfile` (queue, stats, show/slot), `Track` (catalog), and `Show` (lineup) capture radio data needs.
- **Frontend/Backend Data Sync (10/10):** Queue/show selections persist to Mongo; catalog and shows loaded from DB into EJS; CRUD (add/move/remove queue, save show) updates UI from server responses.

## 5. Session Management and Continuity (20 pts)
- **Data Persistence & Restoration (10/10):** Sessions stored in Mongo; home “continue” shows last role/visit; DJ queue and selections tied to session and reload with saved state (except unsent form inputs).
- **Logout & Session Clearing (10/10):** `/auth/logout` clears session and cookie while leaving DB data intact; user redirected to home.

---

