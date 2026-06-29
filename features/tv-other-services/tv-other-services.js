/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Other Services — catalog  ·  New
   One "Others" section to manage all misc services an agency sells beyond
   the main ticket/visa: passport processing, bank statement / solvency,
   hotel, insurance, attestation, manpower, transfer, etc. These items feed
   the invoice/booking as ADD-ONS (see Flight Booking → Add-on services).
   Renders into #tv-othersvc-root. Shared localStorage epal_tv_other_services.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_other_services';
var CATS=['Passport','Visa','Hotel','Insurance','Document','Manpower','Transfer','Tour','Ancillary','Logistics','Misc'];
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function uid(){return 'SVC-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}var d=seed();try{localStorage.setItem(LS,JSON.stringify(d));}catch(e){}return d;}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
function seed(){return [
  {id:'SVC-1',name:'Passport Processing (new)',cat:'Passport',price:3000,active:true},
  {id:'SVC-2',name:'Passport Renewal',cat:'Passport',price:3500,active:true},
  {id:'SVC-3',name:'Bank Statement / Solvency',cat:'Document',price:2000,active:true},
  {id:'SVC-4',name:'Hotel Booking (per night)',cat:'Hotel',price:9000,active:true},
  {id:'SVC-5',name:'Travel Insurance',cat:'Insurance',price:1500,active:true},
  {id:'SVC-6',name:'Visa Document Attestation',cat:'Document',price:2500,active:true},
  {id:'SVC-7',name:'Manpower / Medical',cat:'Manpower',price:5000,active:true},
  {id:'SVC-8',name:'Airport Transfer',cat:'Transfer',price:2000,active:true},
  {id:'SVC-9',name:'Tour Guide (per day)',cat:'Tour',price:4000,active:true},
  {id:'SVC-10',name:'eVisa Processing',cat:'Visa',price:3000,active:true},
  {id:'SVC-11',name:'Document Courier',cat:'Logistics',price:800,active:true},
  {id:'SVC-12',name:'SIM / eSIM',cat:'Misc',price:1200,active:true},
  {id:'SVC-13',name:'Excess Baggage',cat:'Ancillary',price:3500,active:true},
  {id:'SVC-14',name:'Seat Selection',cat:'Ancillary',price:1500,active:true}
];}
var ROWS=load();
var flt='';

function root(){return document.getElementById('tv-othersvc-root');}
function render(){var r=root();if(!r)return;injectCss();
  var rows=ROWS.filter(function(x){return !flt||x.cat===flt;}).map(function(x){
    return '<tr><td class="mono">'+esc(x.id)+'</td><td><strong>'+esc(x.name)+'</strong></td>'
      +'<td><span class="tvo-cat">'+esc(x.cat)+'</span></td><td>'+money(x.price)+'</td>'
      +'<td><span class="tvo-pill" style="background:'+(x.active?'#16a34a':'#94a3b8')+'">'+(x.active?'Active':'Inactive')+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +'<button class="tvo-op" title="Edit price" onclick="tvoPrice(\''+x.id+'\')">✏️</button>'
        +'<button class="tvo-op" title="Toggle active" onclick="tvoToggle(\''+x.id+'\')">🔁</button>'
        +'<button class="tvo-op" title="Delete" onclick="tvoDel(\''+x.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">No services for this category.</td></tr>';
  var chip=function(v,l){return '<button class="tvo-chip'+(flt===v?' on':'')+'" onclick="tvoFilter(\''+v+'\')">'+l+'</button>';};
  r.innerHTML=''
   +'<div class="tvo-kpis">'
     +'<div class="tvo-kpi"><div class="l">🧩 Services</div><div class="v">'+ROWS.length+'</div></div>'
     +'<div class="tvo-kpi"><div class="l">🟢 Active</div><div class="v" style="color:#16a34a">'+ROWS.filter(function(x){return x.active;}).length+'</div></div>'
     +'<div class="tvo-kpi"><div class="l">🗂 Categories</div><div class="v">'+CATS.length+'</div></div>'
   +'</div>'
   +'<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;font-size:12.5px;color:#1e40af;margin-bottom:14px">💡 These services appear as <b>add-ons</b> when invoicing a main sale (e.g. Flight Booking → Add-on services).</div>'
   +'<div class="tvo-card tvo-pad"><div class="tvo-h">➕ Add Service</div><div class="tvo-add">'
     +'<input id="tvo-name" placeholder="Service name" style="flex:1;min-width:180px">'
     +'<select id="tvo-cat">'+CATS.map(function(c){return '<option>'+esc(c)+'</option>';}).join('')+'</select>'
     +'<input id="tvo-price" type="number" placeholder="Default price ৳" style="width:150px">'
     +'<button class="erp-btn btn-primary" onclick="tvoAdd()">Add</button></div></div>'
   +'<div class="tvo-card tvo-pad"><div class="tvo-h">🧾 Service Catalog <span class="tvo-chips">'+chip('','All')+CATS.map(function(c){return chip(c,c);}).join('')+'</span></div>'
     +'<table class="tvo-tbl"><thead><tr><th>ID</th><th>Service</th><th>Category</th><th>Default Price</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
window.tvoFilter=function(v){flt=v;render();};
window.tvoAdd=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var name=g('tvo-name').trim();if(!name){alert('Service name is required.');return;}
  ROWS.unshift({id:uid(),name:name,cat:g('tvo-cat'),price:+g('tvo-price')||0,active:true});save();render();};
window.tvoPrice=function(id){var x=ROWS.find(function(z){return z.id===id;});if(!x)return;var p=prompt('Default price (৳) for '+x.name+':',x.price);if(p===null)return;x.price=+p||0;save();render();};
window.tvoToggle=function(id){var x=ROWS.find(function(z){return z.id===id;});if(x){x.active=!x.active;save();render();}};
window.tvoDel=function(id){if(!confirm('Delete this service?'))return;ROWS=ROWS.filter(function(z){return z.id!==id;});save();render();};

function injectCss(){if(document.getElementById('tvo-css'))return;var s=document.createElement('style');s.id='tvo-css';var P='#erp-panel-tv-other-svc ';
  s.textContent=''
  +P+'.tvo-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:14px}'
  +P+'.tvo-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.tvo-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.tvo-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.tvo-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.tvo-pad{padding:15px 17px}'+P+'.tvo-h{font-size:13.5px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +P+'.tvo-chips{display:inline-flex;gap:6px;flex-wrap:wrap;margin-left:auto}'
  +P+'.tvo-chip{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:20px;padding:4px 11px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--text2)}'
  +P+'.tvo-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}'
  +P+'.tvo-add{display:flex;gap:9px;flex-wrap:wrap}'
  +P+'.tvo-add input,'+P+'.tvo-add select{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tvo-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tvo-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3)}'
  +P+'.tvo-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tvo-cat{font-size:10.5px;background:var(--bg3);color:var(--text2);padding:2px 8px;border-radius:6px}'
  +P+'.tvo-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tvo-op{border:0;background:none;cursor:pointer;font-size:13px;padding:3px 6px;border-radius:6px}'+P+'.tvo-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
