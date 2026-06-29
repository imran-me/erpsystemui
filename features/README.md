# Modular Features

Each new feature lives in its **own folder** here and is **self-contained** — its own JS (and CSS/assets if needed). A feature plugs into the Epal Travels portal through the global **`window.TravelPortal`** API exposed by [travel.html](../travel.html); it never edits the core engine.

Loaded by adding one line near the end of `<body>` in `travel.html`:
```html
<script src="features/<name>/<name>.js"></script>
```
Remove that line → the feature disappears cleanly.

## TravelPortal API (the contract)
```js
const TP = window.TravelPortal;
TP.helpers              // { $, esc, money, pretty, uid, sum }
TP.pools               // { AIRLINES, AIRPORTS, COUNTRIES, OFFICERS, VENDORS_LIST }
TP.DB, TP.RES          // live data store + resource schemas (read existing records)
TP.store               // { lkey, loadRes, saveRes }
TP.openForm(key,id)    // reuse the core add/edit modal
TP.go(id)              // navigate to a page

TP.addGroup({grp,label,ic,section,nw})        // add a sidebar group (nw:true → "New" badge)
TP.addNavItem({id,label,ic,group,nw})         // add a sidebar item
TP.registerPage({id,label,sub,ic,group,nw,render})  // custom page — render(contentEl)
TP.registerResource(key, schema, {group,ic,nw})     // full CRUD table/board for free
TP.refreshNav()
TP.onReady(cb)         // run registration safely
```

## Conventions
- **Prototype = UI only.** Data is mock + localStorage. No backend.
- **Mark everything new** with a `New` badge: pass `nw:true` to nav helpers, and add
  `<span class="badge-new">New</span>` next to new headings/buttons inside the page.
- A feature page should render **all its sections** so the user can do **test input** immediately.
- Keep each feature's localStorage key namespaced (e.g. `epal_tr_<feature>`).

## Features
- **quotation/** — Quotation Builder: multi-line quotes (flight/visa/hotel/transfer),
  live profit & VAT calc, mock WhatsApp send, convert-to-booking, print/PDF.
- **states/** — States master (state/province per country). Full CRUD via
  `registerResource`; example of the smallest possible feature.
