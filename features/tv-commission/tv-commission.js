/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Commission Management  ·  New
   Track commission earned from airlines / vendors / GSAs — expected vs
   received vs outstanding, by source & period. Renders into #tv-comm-root
   (panel erp-panel-tv-commission). localStorage epal_tv_commission. Additive.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_commission';
var SRC=['Emirates','Qatar Airways','Saudia','US-Bangla','Biman Bangladesh','Malaysia Airlines','Turkish Airlines','Galaxy Travels','SkyLink GSA','TBO','Sabre'];
var TYPES=['Airline','Vendor','GSA','Portal'];
var SPILL={Received:'#16a34a',Partial:'#d97706',Pending:'#dc2626'};

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function uid(){return 'CM-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
function seed(){return [
  {id:'CM-001',source:'Emirates',type:'Airline',period:'Jun 2026',sales:1850000,rate:5,received:60000},
  {id:'CM-002',source:'Qatar Airways',type:'Airline',period:'Jun 2026',sales:920000,rate:6,received:0},
  {id:'CM-003',source:'Saudia',type:'Airline',period:'Jun 2026',sales:1340000,rate:5,received:67000},
  {id:'CM-004',source:'Galaxy Travels',type:'Vendor',period:'Jun 2026',sales:680000,rate:3,received:10000},
  {id:'CM-005',source:'SkyLink GSA',type:'GSA',period:'May 2026',sales:540000,rate:4,received:21600}
];}
var ROWS=load();
var flt='';

/* ---- volume slabs / tiers (override the flat rate when applied) ---- */
var TLS='epal_tv_commission_tiers';
function loadT(){try{var r=localStorage.getItem(TLS);if(r)return JSON.parse(r);}catch(e){}return {apply:true,slabs:[{min:0,rate:5},{min:1000000,rate:6},{min:2000000,rate:7}]};}
function saveT(){try{localStorage.setItem(TLS,JSON.stringify(TIERS));}catch(e){}}
var TIERS=loadT();
function slabRate(sales){if(!TIERS.apply)return null;var r=null;TIERS.slabs.slice().sort(function(a,b){return a.min-b.min;}).forEach(function(s){if((+sales||0)>=s.min)r=+s.rate;});return r;}
function effRate(x){var sr=slabRate(+x.sales||0);return sr!=null?sr:(+x.rate||0);}
function expected(r){return Math.round((+r.sales||0)*(effRate(r)/100))+(+r.override||0);}
function outstanding(r){return Math.max(0,expected(r)-(+r.received||0));}
function statusOf(r){var e=expected(r),rc=+r.received||0;if(rc>=e&&e>0)return 'Received';if(rc>0)return 'Partial';return 'Pending';}

function root(){return document.getElementById('tv-comm-root');}
function render(){var r=root();if(!r)return;injectCss();
  var exp=ROWS.reduce(function(a,x){return a+expected(x);},0);
  var rec=ROWS.reduce(function(a,x){return a+(+x.received||0);},0);
  var out=ROWS.reduce(function(a,x){return a+outstanding(x);},0);
  var avg=ROWS.length?(ROWS.reduce(function(a,x){return a+(+x.rate||0);},0)/ROWS.length):0;

  var rows=ROWS.filter(function(x){return !flt||statusOf(x)===flt;}).map(function(x){var st=statusOf(x);
    return '<tr><td class="mono">'+esc(x.id)+'</td><td><strong>'+esc(x.source)+'</strong></td><td>'+esc(x.type)+'</td><td>'+esc(x.period)+'</td>'
      +'<td>'+money(x.sales)+'</td><td>'+esc(x.rate)+'%</td><td><strong>'+effRate(x)+'%</strong></td>'
      +'<td><strong>'+money(expected(x))+'</strong>'+((+x.override)?'<div style="font-size:10px;color:#16a34a">+'+money(x.override)+' bonus</div>':'')+'</td><td style="color:#16a34a">'+money(x.received)+'</td>'
      +'<td style="color:'+(outstanding(x)>0?'#dc2626':'var(--text3)')+'">'+money(outstanding(x))+'</td>'
      +'<td><span class="tvc-pill" style="background:'+(SPILL[st]||'#94a3b8')+'">'+st+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +(st!=='Received'?'<button class="tvc-op" title="Mark fully received" onclick="tvcReceive(\''+x.id+'\')">✓</button>':'')
        +'<button class="tvc-op" title="Record payment" onclick="tvcPay(\''+x.id+'\')">💳</button>'
        +'<button class="tvc-op" title="Override / volume bonus" onclick="tvcOverride(\''+x.id+'\')">💲</button>'
        +'<button class="tvc-op" title="Delete" onclick="tvcDel(\''+x.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="12" style="text-align:center;color:var(--text3);padding:24px">No commission rows.</td></tr>';

  var chip=function(v,l){return '<button class="tvc-chip'+(flt===v?' on':'')+'" onclick="tvcFilter(\''+v+'\')">'+l+'</button>';};
  r.innerHTML=''
   +'<div class="tvc-kpis">'
     +'<div class="tvc-kpi"><div class="l">📈 Expected Commission</div><div class="v">'+money(exp)+'</div></div>'
     +'<div class="tvc-kpi"><div class="l">🟢 Received</div><div class="v" style="color:#16a34a;font-size:20px">'+money(rec)+'</div></div>'
     +'<div class="tvc-kpi"><div class="l">🔴 Outstanding</div><div class="v" style="color:#dc2626;font-size:20px">'+money(out)+'</div></div>'
     +'<div class="tvc-kpi"><div class="l">📊 Avg Rate</div><div class="v">'+avg.toFixed(1)+'%</div></div>'
   +'</div>'
   +'<div class="tvc-card tvc-pad"><div class="tvc-h">📶 Volume Commission Slabs (tiers) '
     +'<button class="erp-btn btn-sm '+(TIERS.apply?'btn-primary':'btn-ghost')+'" style="margin-left:auto" onclick="tvcTierToggle()">'+(TIERS.apply?'Slabs ON':'Slabs OFF')+'</button></div>'
     +'<div class="tvc-slabs">'+TIERS.slabs.slice().sort(function(a,b){return a.min-b.min;}).map(function(s,i){return '<span class="tvc-slab">≥ '+money(s.min)+' → <b>'+s.rate+'%</b> <button class="tvc-sx" title="Edit" onclick="tvcTierEdit('+i+')">✏️</button><button class="tvc-sx" title="Remove" onclick="tvcTierDel('+i+')">✕</button></span>';}).join('')
       +'<button class="erp-btn btn-sm btn-ghost" onclick="tvcTierAdd()">＋ Add slab</button></div>'
     +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">When ON, a row\'s <b>effective rate</b> = the highest slab its sales volume reaches (overrides the flat rate). Override/volume bonus adds on top.</div></div>'
   +'<div class="tvc-card tvc-pad"><div class="tvc-h">➕ Add Commission Rule / Entry</div><div class="tvc-add">'
     +'<select id="tvc-src">'+SRC.map(function(s){return '<option>'+esc(s)+'</option>';}).join('')+'</select>'
     +'<select id="tvc-type">'+TYPES.map(function(t){return '<option>'+esc(t)+'</option>';}).join('')+'</select>'
     +'<input id="tvc-period" placeholder="Period (e.g. Jul 2026)" style="width:140px">'
     +'<input id="tvc-sales" type="number" placeholder="Sales volume ৳" style="width:150px">'
     +'<input id="tvc-rate" type="number" step="0.1" placeholder="Base rate %" style="width:100px">'
     +'<input id="tvc-override" type="number" placeholder="Override ৳" style="width:120px">'
     +'<button class="erp-btn btn-primary" onclick="tvcAdd()">Add</button>'
   +'</div></div>'
   +'<div class="tvc-card tvc-pad"><div class="tvc-h">💼 Commission Statement <span class="tvc-chips">'+chip('','All')+chip('Pending','Pending')+chip('Partial','Partial')+chip('Received','Received')+'</span></div>'
     +'<table class="tvc-tbl"><thead><tr><th>ID</th><th>Source</th><th>Type</th><th>Period</th><th>Sales Volume</th><th>Rate</th><th>Eff. Rate</th><th>Expected</th><th>Received</th><th>Outstanding</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

window.tvcFilter=function(v){flt=v;render();};
window.tvcTierToggle=function(){TIERS.apply=!TIERS.apply;saveT();render();};
window.tvcTierEdit=function(i){var arr=TIERS.slabs.slice().sort(function(a,b){return a.min-b.min;});var s=arr[i];if(!s)return;var m=prompt('Sales threshold ৳ (slab applies at/above):',s.min);if(m===null)return;var r=prompt('Commission rate % at this slab:',s.rate);if(r===null)return;s.min=+m||0;s.rate=+r||0;saveT();render();};
window.tvcTierAdd=function(){var m=prompt('Sales threshold ৳:','3000000');if(m===null)return;var r=prompt('Rate %:','8');if(r===null)return;TIERS.slabs.push({min:+m||0,rate:+r||0});saveT();render();};
window.tvcTierDel=function(i){var arr=TIERS.slabs.slice().sort(function(a,b){return a.min-b.min;});var s=arr[i];TIERS.slabs=TIERS.slabs.filter(function(x){return x!==s;});saveT();render();};
window.tvcOverride=function(id){var x=ROWS.find(function(z){return z.id===id;});if(!x)return;var v=prompt('Override / volume incentive bonus (৳) for '+x.source+':',x.override||0);if(v===null)return;x.override=+v||0;save();render();};
window.tvcAdd=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var sales=+g('tvc-sales')||0,rate=+g('tvc-rate')||0; if(!sales||!rate){alert('Sales volume and rate are required.');return;}
  ROWS.unshift({id:uid(),source:g('tvc-src'),type:g('tvc-type'),period:g('tvc-period').trim()||'—',sales:sales,rate:rate,override:+g('tvc-override')||0,received:0});save();render();};
window.tvcReceive=function(id){var r=ROWS.find(function(x){return x.id===id;});if(r){r.received=expected(r);save();render();}};
window.tvcPay=function(id){var r=ROWS.find(function(x){return x.id===id;});if(!r)return;var amt=prompt('Commission received amount (৳):',String(outstanding(r)));if(amt===null)return;r.received=(+r.received||0)+(+amt||0);save();render();};
window.tvcDel=function(id){if(!confirm('Delete this commission row?'))return;ROWS=ROWS.filter(function(x){return x.id!==id;});save();render();};

function injectCss(){if(document.getElementById('tvc-css'))return;var s=document.createElement('style');s.id='tvc-css';var P='#erp-panel-tv-commission ';
  s.textContent=''
  +P+'.tvc-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.tvc-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.tvc-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.tvc-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.tvc-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.tvc-pad{padding:15px 17px}'+P+'.tvc-h{font-size:13.5px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +P+'.tvc-chips{display:inline-flex;gap:6px;margin-left:auto}'
  +P+'.tvc-chip{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:20px;padding:4px 12px;font-size:11.5px;cursor:pointer;font-family:inherit;color:var(--text2)}'
  +P+'.tvc-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}'
  +P+'.tvc-add{display:flex;gap:9px;flex-wrap:wrap}'
  +P+'.tvc-add input,'+P+'.tvc-add select{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tvc-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tvc-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.tvc-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tvc-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tvc-op{border:0;background:none;cursor:pointer;font-size:13px;padding:3px 6px;border-radius:6px}'+P+'.tvc-op:hover{background:var(--bg3)}'
  +P+'.tvc-slabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center}'
  +P+'.tvc-slab{background:var(--bg3);border:1px solid var(--border);border-radius:20px;padding:5px 12px;font-size:12px}'
  +P+'.tvc-sx{border:0;background:none;cursor:pointer;font-size:11px;padding:0 2px}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
