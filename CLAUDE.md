# EPAL ERP — Project Context

> Auto-loaded by Claude Code each session. Keep this current so we never lose context between sessions.

## What this project is
A **single-page, single-file ERP UI prototype** for the **EPAL Group** (Bangladesh-based holding company with 8 sister concerns). It is a static front-end demo — **no backend, no build step, no framework**. Pure HTML + inline CSS + vanilla JS in one giant file. Deployed via **GitHub Pages**.

The owner ("the boss") / stakeholder is **MD**; many design decisions are tagged in the code with `MD: <date>` comments — these mark boss-requested changes. Honor those comments; don't undo MD decisions without being asked.

## Files
| File | Size | Purpose |
|------|------|---------|
| [erp-combined.html](erp-combined.html) | ~15,300 lines | **The main app & single source of truth.** All CSS, JS, panels, RBAC. The Travel module's HTML now lives in `travel.html` and is injected here at runtime. |
| [travel.html](travel.html) | ~3,980 lines | **Travel module — HTML fragment** (the `tv-*` panels). Extracted verbatim from `erp-combined.html`. NOT a standalone page (no html/head/body). Injected into combined at parse time. |
| [erp-combined.backup.html](erp-combined.backup.html) | — | Local pre-extraction backup (gitignored; git history also has it). |
| [index.html](index.html) | tiny | Redirect → `erp-combined.html`. |
| [ai-companion/](ai-companion/) | ~14 MB | **EON** — modular 3D AI companion (Three.js). Embedded in `erp-combined.html`. |
| [features/](features/) | — | Earlier `window.TravelPortal`-based feature prototypes (Quotation, Tasks, Visa-Pro, Ticketing-Pro, Compliance, Expense, States). **Not currently wired** — to be re-added as native erp panels inside `travel.html`. |

## Architecture: the Travel module split (MD: 29-Jun-2026)
- **`erp-combined.html` is the ONE source of truth.** The Travel module's panel HTML was **extracted (moved, nothing deleted)** into `travel.html` to shrink combined.
- `erp-combined.html` loads it back **in place during page parse**: a small inline loader does a synchronous `XMLHttpRequest` for `travel.html` and `document.write`s it into `.erp-content` exactly where the panels used to be. Result: identical DOM, IDs, events, JS and DB — the user cannot tell it's external. (Needs http(s); works on GitHub Pages, not `file://`.)
- The Travel module's **CSS, JS, sidebar nav, RBAC entries (`erpPanels`/`erpTitles`/`G.tvSvc`) all stay in `erp-combined.html`** and are unchanged.
- **Develop all Travel UI in `travel.html`** going forward (add new `.erp-panel#erp-panel-<id>` sections there); combined reflects them automatically. Any new nav item / `erpPanels` / `erpTitles` / RBAC entry for a new panel still goes in `erp-combined.html` (small one-liners).

## Prototyping rules (important)
- This is **UI design only** — mock data + localStorage, no backend.
- **Every newly added thing gets a `New` badge** so the user can see what changed.
- **Never delete** existing Travel/ERP content — it mirrors the live operational system. Adding is fine; deleting is prohibited.
- A new feature must render **all its sections** so the user can test-input immediately.
- Switch role to **Travels Agent** (top-right "View As") to see the Travel section (RBAC-gated to `agent`/`admin`/`superadmin`).

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
