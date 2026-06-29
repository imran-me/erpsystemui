---
name: feature-placement
description: New features go in travel.html; EON companion goes on every page
metadata:
  type: project
---

Decided 2026-06-29 for the EPAL ERP prototype:

- **New features are built in `travel.html`** (Epal Travels Employee Portal), as modular plugins via `window.TravelPortal` (each in its own `features/<name>/` folder). NOT in `erp-combined.html` — that page uses a different nav system (`showErpPanel`).
- **EON AI companion must be embedded on every UI page.** Currently on `travel.html` and `erp-combined.html`. `index.html` is an instant redirect so it's skipped. Any new top-level page gets the same embed: `three` import-map + 3 EON CSS links + `<script type="module" src="ai-companion/js/main.js">`.

Related: [[new-label-convention]] (tag new things with a "New" badge).
