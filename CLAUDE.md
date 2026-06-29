# EPAL ERP — Project Context

> Auto-loaded by Claude Code each session. Keep this current so we never lose context between sessions.

## What this project is
A **single-page, single-file ERP UI prototype** for the **EPAL Group** (Bangladesh-based holding company with 8 sister concerns). It is a static front-end demo — **no backend, no build step, no framework**. Pure HTML + inline CSS + vanilla JS in one giant file. Deployed via **GitHub Pages**.

The owner ("the boss") / stakeholder is **MD**; many design decisions are tagged in the code with `MD: <date>` comments — these mark boss-requested changes. Honor those comments; don't undo MD decisions without being asked.

## Files
| File | Size | Purpose |
|------|------|---------|
| [erp-combined.html](erp-combined.html) | ~19,300 lines (1.5 MB) | **The main app.** Entire ERP: all CSS, all HTML panels, all JS in one file. |
| [travel.html](travel.html) | ~900 lines | **Epal Travels — Employee Portal** (separate standalone page, employee-facing). |
| [index.html](index.html) | tiny | Redirect → `erp-combined.html` (so the GitHub Pages root URL loads the app). |
| [ai-companion/](ai-companion/) | ~14 MB | **EON** — modular 3D AI companion (Three.js). Self-contained; embedded in `travel.html`. |
| [features/](features/) | — | **Modular features**, one folder each, plugged into `travel.html` via `window.TravelPortal`. |

## Prototyping rules (important)
- This is **UI design only** — mock data + localStorage, no backend. Build screens & ideas.
- **Every newly added thing gets a `New` badge** (`<span class="badge-new">New</span>`, or `nw:true` on nav helpers) so the user can see what changed.
- New features are **modular**: their own folder under `features/`, self-contained, registered via `window.TravelPortal` (see [features/README.md](features/README.md)). Never edit the core engine to add a feature.
- A feature must render **all its sections** so the user can do **test input** right away.
- **Never delete** existing features/content.

## Where new work goes (decided 2026-06-29)
- **New features → `travel.html`** (the Epal Travels Employee Portal). It's the home for new modular features via `window.TravelPortal`. Build there unless told otherwise.
- **EON → every page.** Currently embedded in both `travel.html` and `erp-combined.html`. `index.html` is just a redirect (no EON needed). Any new top-level page must get the same EON embed (import-map + 3 CSS + module script).

## EON AI companion
- Lives entirely in `ai-companion/`; embedded via an import-map (`three`) + 3 CSS links + `<script type="module" src="ai-companion/js/main.js">`.
- Auto-boots, walks around, reacts to typing/clicks/forms, persists to localStorage. Needs a server (ES modules) — works on GitHub Pages, not `file://`. Resolves its own paths via `import.meta.url`. The `✕` chip hides it.

## How the app works (architecture)
- **No router / no framework.** Everything is one HTML document.
- Screens: `#login-screen` (currently disabled — boots straight into ERP per `MD: 27-Jun-2026`), `#erp-screen`, `#crm-screen`.
- **Navigation = panel switching.** Each module is a `<div id="erp-panel-<id>">`. The JS function **`showErpPanel(id, navEl)`** (~line 15961) hides all panels (removes `.active`), shows the chosen one, updates the sidebar highlight and breadcrumb title.
  - `erpPanels` = array of all panel ids; `erpTitles` = id → title map. **Add new panels to both.**
- Sidebar is collapsible (`toggleSidebar()`, `MD: 18-Jun-2026`).
- **Quick-access tabs**: drag any sidebar item to pin it (`MD: 18-Jun-2026`).
- Persistent **news bulletin ticker** under the topbar.
- Tabs/chips within panels toggle via `classList.add/remove('active')` patterns (e.g. `psm-tab`, `psc-chip`).
- ESC key closes modals (global keydown handler).

## Modules / panels (high level)
- **Group Dashboard** — KPI hero cards, 8-company performance strip, office issues tracker, multi-bank cash position, lead funnel, AR aging, schedules.
- **Sister concerns** (each has its own dashboard): Epal Group, Epal IT Solutions, **Epal Travels**, Epal Properties, Epal Constructions, Wood Art Interiors, Epal Online Shop, Epal Manufacturing.
- **User Management** — All Users (category tabs), Add User (3-section form).
- **Business Operations / Products**, **Accounts & Finance**, **HRM**, **Payroll**, **Task** (Task Map: milestones, timers, weighted % progress), **Reports**, **Reminder**, **Marketing**, **Settings**, **Trash**.
- **Travels-specific modules**: Passport, Vendor & Agent, Portal Management, Air Ticketing, **Direct Sale** (6 tabs: Manage Tickets / Direct Sale / Refund / Re-Issue / Void / EMD, each with Payable + Receivable schedules), Manage Sales, Airlines, Country, States, Flight Schedule, Contract Flight, Invoice Template, Visa Processing.
- **Accounts modules**: Payment Daily Sheet (`pds-*`), Payment Schedule Center (`psc-*` / `psm-*`).

## Conventions
- **CSS naming**: module-prefixed (e.g. `vsa-*` visa, `biz-*` business ops, `tvd-*` travels dashboard, `pds-*` payment daily sheet, `psc-*`/`psm-*` payment schedule, `qt-*` quick tabs).
- **Color system**: CSS vars in `:root`. Each sister concern has its own accent var (`--travels`, `--it`, `--construction`, `--woodart`, `--properties`, `--onlineshop`, `--manufacturing`).
- **Fonts**: DM Sans (UI), DM Mono (numbers/code) via Google Fonts.
- **`MD: <date>` comments** = boss-requested design decisions. Preserve them.
- Section dividers use big `<!-- ===== TITLE ===== -->` comment banners — useful for navigation/grep.

## Working in this repo
- **Editing**: the main file is huge. Use Grep to locate a panel/function by id or by its `<!-- ===== -->` banner, then Read that region and Edit in place. Don't read the whole file.
- **No build / no install.** To preview: open the HTML in a browser (or the GitHub Pages URL).
- **Git**: branch is `main`; commits go straight to `main`. Recent work has been on the Task module and the new Travels employee portal.
- **Testing**: manual / visual only — there is no test suite.

## Current state (as of 2026-06-29)
- Latest commit: "Add Epal Travels employee portal (travel.html)".
- Recent focus: Task Map UX (milestones, per-milestone timers, weighted progress, inline link/attach modals, card avatars) and the new standalone employee portal.

---
*Update this file as the project evolves so the next session starts with full context.*
