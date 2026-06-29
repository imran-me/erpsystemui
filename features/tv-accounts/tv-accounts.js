/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Vendor / Agent Accounts (Party Ledger)  ·  New
   Track money agent/vendor-wise. List every party with current due; click a
   name to open the FULL account — opening balance, complete transaction
   history (invoices, payments, refunds, ADMs) with running balance, ageing
   buckets, add-transaction, and a printable statement.
   Renders into #tv-acc-root (panel erp-panel-tv-accounts). localStorage
   epal_tv_accounts. Additive only.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_accounts';
var TYPES=['Vendor','Agent','GSA','Airline','Portal'];
var KINDS=[ /* kind : direction (debit raises what we owe / receivable) */
  {k:'Invoice / Purchase',d:'debit'},{k:'ADM (Debit Memo)',d:'debit'},{k:'Service Charge',d:'debit'},
  {k:'Payment',d:'credit'},{k:'Refund / ACM',d:'credit'},{k:'Credit Note',d:'credit'},{k:'Adjustment',d:'credit'}
];
function dirOf(kind){var x=KINDS.find(function(z){return z.k===kind;});return x?x.d:'debit';}

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){var v=Number(n||0);return (v<0?'-৳ ':'৳ ')+Math.abs(v).toLocaleString('en-IN');}
function uid(p){return p+'-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function stamp(){return new Date().toISOString().slice(0,10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(PARTIES));}catch(e){}}
function seed(){return [
  {id:'VN-001',name:'Galaxy Travels',type:'Vendor',phone:'+8801611000001',email:'sohel@galaxy.com',opening:0,txns:[
    {date:'2026-06-01',ref:'PUR-1101',desc:'Emirates block seats — 10 pax',kind:'Invoice / Purchase',amount:480000},
    {date:'2026-06-10',ref:'PAY-3301',desc:'Bank transfer — City Bank',kind:'Payment',amount:300000},
    {date:'2026-06-20',ref:'PUR-1140',desc:'Qatar Airways group fare',kind:'Invoice / Purchase',amount:120000}
  ]},
  {id:'VN-002',name:'Dubai Holidays Ltd',type:'Vendor',phone:'+97150000003',email:'k@dubaiholidays.ae',opening:60000,txns:[
    {date:'2026-06-05',ref:'PUR-1110',desc:'DXB hotel + transfer package',kind:'Invoice / Purchase',amount:220000},
    {date:'2026-06-18',ref:'PAY-3320',desc:'Partial settlement',kind:'Payment',amount:150000},
    {date:'2026-06-22',ref:'ADM-7781',desc:'Airline debit memo passed on',kind:'ADM (Debit Memo)',amount:8400}
  ]},
  {id:'AG-010',name:'Al-Haramain Agency',type:'Agent',phone:'+8801611000004',email:'saleh@haramain.com',opening:0,txns:[
    {date:'2026-06-03',ref:'INV-9001',desc:'Umrah visa lot — 6 pax',kind:'Invoice / Purchase',amount:316000},
    {date:'2026-06-15',ref:'RCV-5001',desc:'Received cash',kind:'Payment',amount:200000}
  ]},
  {id:'GS-021',name:'SkyLink GSA',type:'GSA',phone:'+8801611000002',email:'lima@skylink.com',opening:0,txns:[
    {date:'2026-06-08',ref:'PUR-1120',desc:'US-Bangla allotment',kind:'Invoice / Purchase',amount:95000},
    {date:'2026-06-29',ref:'PAY-3340',desc:'Full settlement',kind:'Payment',amount:95000}
  ]}
];}
var PARTIES=load();
PARTIES.forEach(function(p){if(p.creditLimit===undefined)p.creditLimit=({Vendor:500000,GSA:300000,Agent:200000,Airline:800000,Portal:150000})[p.type]||200000;if(!p.terms)p.terms='Net 15';});

/* ---- ledger math ---- */
function sorted(p){return (p.txns||[]).slice().sort(function(a,b){return (a.date<b.date?-1:a.date>b.date?1:0);});}
function totals(p){var d=0,cr=0;(p.txns||[]).forEach(function(t){if(dirOf(t.kind)==='debit')d+=(+t.amount||0);else cr+=(+t.amount||0);});
  return {debit:d,credit:cr,closing:(+p.opening||0)+d-cr};}
function avail(p){return (+p.creditLimit||0)-Math.max(0,totals(p).closing);}
function utilPct(p){var cl=+p.creditLimit||0;if(!cl)return 0;return Math.min(100,Math.round(Math.max(0,totals(p).closing)/cl*100));}
function dpoDays(p){var t=totals(p);var base=p.type==='Agent'?t.credit:t.debit;if(!base)return 0;return Math.round(Math.max(0,t.closing)/base*30);}
function ageing(p){ // FIFO: credits pay oldest debits first; bucket remaining debit by age
  var rows=sorted(p), debits=[]; var creditPool=( +p.opening<0?-p.opening:0);
  rows.forEach(function(t){var amt=+t.amount||0; if(dirOf(t.kind)==='debit')debits.push({date:t.date,amt:amt}); else creditPool+=amt;});
  if(+p.opening>0)debits.unshift({date:'2026-01-01',amt:+p.opening});
  debits.forEach(function(d){var pay=Math.min(d.amt,creditPool);d.amt-=pay;creditPool-=pay;});
  var b={b0:0,b30:0,b60:0}; var today=new Date();today.setHours(0,0,0,0);
  debits.forEach(function(d){if(d.amt<=0)return;var age=Math.round((today-new Date(d.date))/86400000);
    if(age<=30)b.b0+=d.amt;else if(age<=60)b.b30+=d.amt;else b.b60+=d.amt;});
  return b;
}

var view='list', curId=null, fltType='', q='';
function root(){return document.getElementById('tv-acc-root');}
function render(){var r=root();if(!r)return;injectCss(); if(view==='detail')detail(r);else list(r);}

/* ---- LIST ---- */
function list(r){
  var rows=PARTIES.filter(function(p){return (!fltType||p.type===fltType) && (!q||(p.name+' '+p.phone).toLowerCase().indexOf(q.toLowerCase())>=0);})
    .map(function(p){var t=totals(p);
    return '<tr style="cursor:pointer" onclick="tvaOpen(\''+p.id+'\')">'
      +'<td class="mono">'+esc(p.id)+'</td>'
      +'<td><strong style="color:var(--accent)">'+esc(p.name)+'</strong></td>'
      +'<td>'+esc(p.type)+'</td>'
      +'<td class="mono">'+esc(p.phone||'—')+'</td>'
      +'<td>'+money(t.debit)+'</td><td>'+money(t.credit)+'</td>'
      +'<td><strong style="color:'+(t.closing>0?'#dc2626':t.closing<0?'#16a34a':'var(--text2)')+'">'+money(t.closing)+'</strong></td>'
      +'<td>'+money(p.creditLimit)+'</td><td style="color:'+(avail(p)<0?'#dc2626':'var(--text2)')+'">'+money(avail(p))+'</td>'
      +'<td>'+(t.closing>0?'<span class="tva-pill" style="background:#dc2626">Due</span>':t.closing<0?'<span class="tva-pill" style="background:#16a34a">Advance</span>':'<span class="tva-pill" style="background:#94a3b8">Settled</span>')+'</td>'
      +'<td style="text-align:right"><button class="erp-btn btn-sm btn-ghost" onclick="event.stopPropagation();tvaOpen(\''+p.id+'\')">Open Account →</button></td></tr>';
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:26px">No parties match.</td></tr>';

  var payable=PARTIES.reduce(function(a,p){var c=totals(p).closing;return a+(c>0?c:0);},0);
  var advance=PARTIES.reduce(function(a,p){var c=totals(p).closing;return a+(c<0?-c:0);},0);
  var chip=function(v,l){return '<button class="tva-chip'+(fltType===v?' on':'')+'" onclick="tvaType(\''+v+'\')">'+l+'</button>';};

  r.innerHTML=''
   +'<div class="tva-kpis">'
     +'<div class="tva-kpi"><div class="l">🏢 Parties</div><div class="v">'+PARTIES.length+'</div></div>'
     +'<div class="tva-kpi"><div class="l">🔴 Total Payable (Due)</div><div class="v" style="color:#dc2626;font-size:20px">'+money(payable)+'</div></div>'
     +'<div class="tva-kpi"><div class="l">🟢 Advances Paid</div><div class="v" style="color:#16a34a;font-size:20px">'+money(advance)+'</div></div>'
     +'<div class="tva-kpi"><div class="l">📄 Transactions</div><div class="v">'+PARTIES.reduce(function(a,p){return a+(p.txns||[]).length;},0)+'</div></div>'
   +'</div>'
   +'<div class="tva-toolbar"><input class="tva-search" placeholder="Search party name / phone…" value="'+esc(q)+'" oninput="tvaSearch(this.value)">'
     +'<span class="tva-chips">'+chip('','All')+TYPES.map(function(t){return chip(t,t);}).join('')+'</span>'
     +'<button class="erp-btn btn-primary" style="margin-left:auto" onclick="tvaNewParty()">＋ New Party</button></div>'
   +'<div class="tva-card"><table class="tva-tbl"><thead><tr><th>ID</th><th>Party Name</th><th>Type</th><th>Phone</th><th>Total Debit</th><th>Total Credit</th><th>Balance</th><th>Credit Limit</th><th>Available</th><th>Status</th><th style="text-align:right">Account</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
   +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">💡 Click any party name to open the full account — ledger, history, dues &amp; statement.</div>';
}

/* ---- DETAIL (full account) ---- */
function detail(r){
  var p=PARTIES.find(function(x){return x.id===curId;}); if(!p){view='list';return list(r);}
  var t=totals(p), ag=ageing(p), rows=sorted(p), run=(+p.opening||0);
  var ledger='<tr><td>'+'—'+'</td><td class="mono">OPENING</td><td>Opening balance</td><td></td><td></td><td><strong>'+money(run)+'</strong></td><td></td></tr>';
  ledger+=rows.map(function(tx){var dir=dirOf(tx.kind);var dr=dir==='debit'?(+tx.amount||0):0,crd=dir==='credit'?(+tx.amount||0):0;run+=dr-crd;
    return '<tr><td>'+esc(tx.date)+'</td><td class="mono">'+esc(tx.ref||'—')+'</td><td>'+esc(tx.desc||'')
      +' <span class="tva-kind">'+esc(tx.kind)+'</span></td>'
      +'<td style="color:#dc2626">'+(dr?money(dr):'')+'</td><td style="color:#16a34a">'+(crd?money(crd):'')+'</td>'
      +'<td><strong>'+money(run)+'</strong></td>'
      +'<td style="text-align:right"><button class="tva-op" title="Delete entry" onclick="tvaDelTxn(\''+tx.ref+'\',\''+tx.date+'\')">🗑</button></td></tr>';
  }).join('');

  r.innerHTML=''
   +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">'
     +'<button class="erp-btn btn-ghost" onclick="tvaBack()">← All Accounts</button>'
     +'<div class="tva-acct-av">'+esc(p.name.slice(0,2).toUpperCase())+'</div>'
     +'<div><div style="font-size:18px;font-weight:700">'+esc(p.name)+'</div>'
       +'<div style="font-size:12px;color:var(--text3)">'+esc(p.type)+' · '+esc(p.id)+' · '+esc(p.phone||'')+' · '+esc(p.email||'')+'</div></div>'
     +'<div style="margin-left:auto;text-align:right"><div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.4px">Current Balance</div>'
       +'<div style="font-size:24px;font-weight:800;color:'+(t.closing>0?'#dc2626':t.closing<0?'#16a34a':'var(--text)')+'">'+money(t.closing)+'</div>'
       +'<div style="font-size:11px">'+(t.closing>0?'Payable / Due to settle':t.closing<0?'Advance with party':'Fully settled')+'</div></div>'
     +'<button class="erp-btn btn-ghost" onclick="tvaPrint()">🖨 Statement</button>'
   +'</div>'
   +'<div class="tva-kpis">'
     +'<div class="tva-kpi"><div class="l">Opening</div><div class="v" style="font-size:18px">'+money(p.opening)+'</div></div>'
     +'<div class="tva-kpi"><div class="l">Total Debit</div><div class="v" style="font-size:18px;color:#dc2626">'+money(t.debit)+'</div></div>'
     +'<div class="tva-kpi"><div class="l">Total Credit</div><div class="v" style="font-size:18px;color:#16a34a">'+money(t.credit)+'</div></div>'
     +'<div class="tva-kpi"><div class="l">Closing Balance</div><div class="v" style="font-size:18px">'+money(t.closing)+'</div></div>'
   +'</div>'
   +'<div class="tva-card tva-pad"><div class="tva-h">📊 Due Ageing</div><div class="tva-age">'
     +'<div class="tva-ageb"><span>0–30 days</span><b>'+money(ag.b0)+'</b></div>'
     +'<div class="tva-ageb"><span>31–60 days</span><b style="color:#d97706">'+money(ag.b30)+'</b></div>'
     +'<div class="tva-ageb"><span>60+ days</span><b style="color:#dc2626">'+money(ag.b60)+'</b></div>'
   +'</div></div>'
   +'<div class="tva-card tva-pad"><div class="tva-h">💳 Credit &amp; Terms <button class="erp-btn btn-sm btn-ghost" style="margin-left:auto" onclick="tvaCredit(\''+p.id+'\')">Edit limit / terms</button></div>'
     +'<div class="tva-age">'
       +'<div class="tva-ageb"><span>Credit Limit</span><b>'+money(p.creditLimit)+'</b></div>'
       +'<div class="tva-ageb"><span>Available</span><b style="color:'+(avail(p)<0?'#dc2626':'#16a34a')+'">'+money(avail(p))+'</b></div>'
       +'<div class="tva-ageb"><span>Payment Terms</span><b>'+esc(p.terms||'Net 15')+'</b></div>'
       +'<div class="tva-ageb"><span>'+(p.type==='Agent'?'DSO (days sales o/s)':'DPO (days payable o/s)')+'</span><b>'+dpoDays(p)+' days</b></div>'
     +'</div>'
     +'<div class="tva-util"><div class="tva-util-b" style="width:'+utilPct(p)+'%;background:'+(utilPct(p)>=90?'#dc2626':utilPct(p)>=70?'#d97706':'#16a34a')+'"></div></div>'
     +'<div style="font-size:11.5px;color:var(--text3);margin-top:5px">Credit utilization: <b>'+utilPct(p)+'%</b>'+(utilPct(p)>=90?' — ⚠️ near limit':'')+'</div></div>'
   +'<div class="tva-card tva-pad"><div class="tva-h">➕ Add Transaction</div><div class="tva-add">'
     +'<input id="tva-date" type="date" value="'+stamp()+'">'
     +'<select id="tva-kind">'+KINDS.map(function(k){return '<option>'+esc(k.k)+'</option>';}).join('')+'</select>'
     +'<input id="tva-ref" placeholder="Ref / voucher" style="width:130px">'
     +'<input id="tva-desc" placeholder="Description" style="flex:1;min-width:160px">'
     +'<input id="tva-amt" type="number" placeholder="Amount ৳" style="width:120px">'
     +'<button class="erp-btn btn-primary" onclick="tvaAddTxn()">Post</button>'
   +'</div></div>'
   +'<div class="tva-card"><table class="tva-tbl"><thead><tr><th>Date</th><th>Voucher</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th><th></th></tr></thead><tbody>'+ledger+'</tbody></table></div>';
}

/* ---- handlers ---- */
window.tvaOpen=function(id){curId=id;view='detail';render();};
window.tvaBack=function(){view='list';curId=null;render();};
window.tvaType=function(v){fltType=v;render();};
window.tvaSearch=function(v){q=v;var r=root();list(r);var s=r.querySelector('.tva-search');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}};
window.tvaNewParty=function(){var name=prompt('New party name:');if(!name)return;var type=prompt('Type (Vendor / Agent / GSA / Airline / Portal):','Vendor')||'Vendor';
  PARTIES.unshift({id:uid(type==='Agent'?'AG':type==='GSA'?'GS':'VN'),name:name.trim(),type:type.trim(),phone:'',email:'',opening:0,txns:[],creditLimit:({Vendor:500000,GSA:300000,Agent:200000})[type.trim()]||200000,terms:'Net 15'});save();render();};
window.tvaCredit=function(id){var p=PARTIES.find(function(x){return x.id===id;});if(!p)return;var cl=prompt('Credit limit (৳) for '+p.name+':',p.creditLimit||0);if(cl===null)return;p.creditLimit=+cl||0;var tm=prompt('Payment terms (e.g. Net 7 / Net 15 / Net 30):',p.terms||'Net 15');if(tm!==null)p.terms=tm.trim();save();render();};
window.tvaAddTxn=function(){var p=PARTIES.find(function(x){return x.id===curId;});if(!p)return;var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var amt=+g('tva-amt')||0;if(!amt){alert('Amount is required.');return;}
  p.txns.push({date:g('tva-date')||stamp(),ref:g('tva-ref').trim()||uid('TXN'),desc:g('tva-desc').trim()||'—',kind:g('tva-kind'),amount:amt});save();render();};
window.tvaDelTxn=function(ref,date){var p=PARTIES.find(function(x){return x.id===curId;});if(!p)return;if(!confirm('Delete this ledger entry?'))return;
  var i=p.txns.findIndex(function(t){return t.ref===ref&&t.date===date;});if(i>=0){p.txns.splice(i,1);save();render();}};
window.tvaPrint=function(){var p=PARTIES.find(function(x){return x.id===curId;});if(!p)return;var t=totals(p),rows=sorted(p),run=(+p.opening||0);
  var body='<tr><td>—</td><td>OPENING</td><td>Opening balance</td><td></td><td></td><td>'+money(run)+'</td></tr>';
  body+=rows.map(function(tx){var dir=dirOf(tx.kind);var dr=dir==='debit'?(+tx.amount||0):0,crd=dir==='credit'?(+tx.amount||0):0;run+=dr-crd;
    return '<tr><td>'+esc(tx.date)+'</td><td>'+esc(tx.ref)+'</td><td>'+esc(tx.desc)+' ('+esc(tx.kind)+')</td><td style="text-align:right">'+(dr?money(dr):'')+'</td><td style="text-align:right">'+(crd?money(crd):'')+'</td><td style="text-align:right">'+money(run)+'</td></tr>';}).join('');
  var w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return;}
  w.document.write('<!doctype html><html><head><title>Statement — '+esc(p.name)+'</title><style>body{font-family:Arial,sans-serif;color:#1a2035;padding:34px;max-width:820px;margin:auto}h1{font-size:20px;margin:0}.m{color:#5a6480;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12.5px}th,td{padding:8px;border-bottom:1px solid #e4e8f0;text-align:left}th{background:#f0f2f8;font-size:10.5px;text-transform:uppercase}.hd{display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:12px}.lg{font-weight:800;font-size:19px;color:#2563eb;font-style:italic}.bal{margin-top:14px;text-align:right;font-size:15px;font-weight:700}</style></head><body>'
   +'<div class="hd"><div><div class="lg">Epal Travels</div><div class="m">Account Statement</div></div><div style="text-align:right"><h1>'+esc(p.name)+'</h1><div class="m">'+esc(p.type)+' · '+esc(p.id)+'<br>'+esc(p.phone||'')+'<br>As of '+stamp()+'</div></div></div>'
   +'<table><thead><tr><th>Date</th><th>Voucher</th><th>Particulars</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead><tbody>'+body+'</tbody></table>'
   +'<div class="bal">Closing Balance: '+money(t.closing)+' '+(t.closing>0?'(Payable)':t.closing<0?'(Advance)':'(Settled)')+'</div>'
   +'<p class="m" style="margin-top:24px">This is a system-generated statement from Epal Travels ERP.</p>'
   +'<scr'+'ipt>window.onload=function(){window.print();}</scr'+'ipt></body></html>');w.document.close();};

function injectCss(){if(document.getElementById('tva-css'))return;var s=document.createElement('style');s.id='tva-css';var P='#erp-panel-tv-accounts ';
  s.textContent=''
  +P+'.tva-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.tva-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.tva-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.tva-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.tva-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}'
  +P+'.tva-search{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;min-width:220px;outline:none}'
  +P+'.tva-chips{display:inline-flex;gap:6px;flex-wrap:wrap}'
  +P+'.tva-chip{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:20px;padding:5px 12px;font-size:11.5px;cursor:pointer;font-family:inherit;color:var(--text2)}'
  +P+'.tva-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}'
  +P+'.tva-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.tva-pad{padding:15px 17px}'+P+'.tva-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.tva-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tva-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.tva-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.tva-tbl tr:hover td{background:#fafbff}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tva-pill{display:inline-block;font-size:10px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tva-kind{font-size:9.5px;background:var(--bg3);color:var(--text2);padding:1px 6px;border-radius:5px;margin-left:5px;white-space:nowrap}'
  +P+'.tva-acct-av{width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px}'
  +P+'.tva-age{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}'
  +P+'.tva-ageb{background:var(--bg3);border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-size:13px}'+P+'.tva-ageb b{font-family:"DM Mono",monospace}'
  +P+'.tva-add{display:flex;gap:9px;flex-wrap:wrap}'
  +P+'.tva-add input,'+P+'.tva-add select{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tva-op{border:0;background:none;cursor:pointer;font-size:13px;padding:3px 6px;border-radius:6px}'+P+'.tva-op:hover{background:var(--bg3)}'
  +P+'.tva-util{height:10px;background:var(--bg3);border-radius:8px;overflow:hidden;margin-top:12px}'+P+'.tva-util-b{height:100%;border-radius:8px;transition:width .3s}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
