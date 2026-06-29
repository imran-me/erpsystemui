---
name: feature-placement
description: erp-combined is the source of truth; Travel module extracted to travel.html and injected at runtime
metadata:
  type: project
---

Architecture (corrected 2026-06-29 — earlier I wrongly built a separate Travel app; refactored):

- **`erp-combined.html` is the single source of truth.** Its Travel section mirrors the user's LIVE, operational system — **never delete or redesign it; only add** (with a "New" badge). [[new-label-convention]]
- The Travel module's panel HTML (`tv-*` panels, lines were ~9126–13101) was **extracted (moved, not deleted)** into `travel.html` purely to shrink combined.
- `erp-combined.html` loads it back **in place at parse time**: an inline loader does a synchronous `XMLHttpRequest('travel.html', false)` + `document.write(responseText)` into `.erp-content`. Identical DOM/IDs/events/JS/DB — seamless. Needs http(s) (GitHub Pages), not `file://`.
- Travel **CSS, JS, sidebar nav, and RBAC registries (`erpPanels`/`erpTitles`/`G.tvSvc`) stay in `erp-combined.html`**, unchanged.
- **Develop all new Travel UI inside `travel.html`** (new `.erp-panel#erp-panel-<id>` sections); combined reflects them automatically. The matching nav item + `erpPanels`/`erpTitles` + RBAC `G.tvSvc` entry are small one-liners added in `erp-combined.html`.
- Travel section is RBAC-gated: switch role to **Travels Agent** (top-right "View As") to see it.
- `erp-combined.backup.html` = local pre-extraction backup (gitignored; git history also has it).
- **EON** AI companion is embedded in `erp-combined.html` (and rides along anywhere combined renders).

Superseded: the old `window.TravelPortal` mini-engine + standalone travel app. The `features/*` prototypes (Quotation, Tasks, Visa-Pro, Ticketing-Pro, Compliance, Expense, States) are NOT wired anymore — they are to be re-added as **native erp panels** inside `travel.html`.
