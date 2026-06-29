/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): BSP / ADM Reconciliation  ·  New
   IATA back-office: reconcile agency ticket sales against the BSP billing
   file, flag discrepancies, track ADMs (Agency Debit Memos) and unused
   tickets. Renders into #tv-bsp-root (panel erp-panel-tv-bsp in
   travel.html). localStorage: epal_tv_bsp. Additive only.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_bsp';
var AIRLINES=['Emirates','Qatar Airways','Saudia','US-Bangla','Biman Bangladesh','Malaysia Airlines','Turkish Airlines'];
var MSTATUS={Matched:'#16a34a',Unmatched:'#94a3b8',Discrepancy:'#dc2626'};
var ASTATUS={Open:'#dc2626',Disputed:'#d97706',Settled:'#16a34a'};

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function uid(p){return p+'-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function stamp(){return new Date().toISOString().slice(0,10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(DB));}catch(e){}}
function seed(){return {
  txns:[
    {id:'176-2401110011',pax:'Rahim Uddin',airline:'Emirates',issue:'2026-06-26',comm:5600,agency:112000,bsp:112000,status:'Matched'},
    {id:'065-2401110024',pax:'Nadia Sultana',airline:'Saudia',issue:'2026-06-27',comm:3450,agency:69000,bsp:69000,status:'Matched'},
    {id:'232-2401110088',pax:'GreenLand (x4)',airline:'Malaysia Airlines',issue:'2026-06-27',comm:9200,agency:184000,bsp:188000,status:'Discrepancy'},
    {id:'157-2401110102',pax:'Kamal Hossain',airline:'US-Bangla',issue:'2026-06-28',comm:3150,agency:63000,bsp:63000,status:'Unmatched'},
    {id:'217-2401110133',pax:'Tanvir Ahmed',airline:'Qatar Airways',issue:'2026-06-28',comm:2900,agency:58000,bsp:0,status:'Unmatched'}
  ],
  adms:[
    {id:'ADM-7781',airline:'Emirates',ticket:'176-2400990012',reason:'Incorrect fare — lower than published',amount:8400,date:'2026-06-20',status:'Open'},
    {id:'ADM-7765',airline:'Qatar Airways',ticket:'217-2400980451',reason:'Commission claimed on non-commissionable fare',amount:3200,date:'2026-06-12',status:'Disputed'}
  ],
  unused:[
    {id:'065-2400970333',pax:'Walk-in hold',airline:'Saudia',value:62000,expiry:'2026-08-31'},
    {id:'176-2400960777',pax:'Corporate block',airline:'Emirates',value:54000,expiry:'2026-09-15'}
  ]
};}
var DB=load();
if(!DB.api) DB.api={connected:true,endpoint:'api.iata.org/bsp/v1',keyMasked:'IATA-••••-7731',lastSync:'2026-06-28 23:00'};

var fltM='';   // BSP recon filter
function nowStr(){return new Date().toISOString().slice(0,16).replace('T',' ');}
function root(){return document.getElementById('tv-bsp-root');}
function render(){var r=root();if(!r)return; injectCss();
  var api=DB.api;
  var apiCard=''
   +'<div class="tvb-api">'
     +'<div class="tvb-api-l"><span class="tvb-api-ic">🔌</span><div>'
       +'<div class="tvb-api-t">IATA / BSP API <span style="font-size:8px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:1px 5px;border-radius:6px;vertical-align:middle">New</span></div>'
       +'<div class="tvb-api-s">Endpoint <code>'+esc(api.endpoint)+'</code> · Key <code>'+esc(api.keyMasked)+'</code> · Last sync: '+esc(api.lastSync||'never')+'</div>'
     +'</div></div>'
     +'<div class="tvb-api-r">'
       +'<span class="tvb-pill" style="background:'+(api.connected?'#16a34a':'#94a3b8')+'">'+(api.connected?'● Connected':'○ Disconnected')+'</span>'
       +'<button class="erp-btn btn-primary btn-sm" '+(api.connected?'':'disabled style="opacity:.5"')+' onclick="tvbSync()">⟳ Sync from IATA BSP</button>'
       +'<button class="erp-btn btn-ghost btn-sm" onclick="tvbToggleConn()">'+(api.connected?'Disconnect':'Connect')+'</button>'
     +'</div>'
   +'</div>';
  var remit=DB.txns.reduce(function(a,t){return a+(t.status!=='Unmatched'?(+t.bsp||0)-(+t.comm||0):0);},0);
  var admOpen=DB.adms.filter(function(a){return a.status!=='Settled';}).reduce(function(a,x){return a+(+x.amount||0);},0);
  var unmatched=DB.txns.filter(function(t){return t.status!=='Matched';}).length;
  var unusedVal=DB.unused.reduce(function(a,x){return a+(+x.value||0);},0);

  var txns=DB.txns.filter(function(t){return !fltM||t.status===fltM;});
  var trows=txns.map(function(t){var diff=(+t.bsp||0)-(+t.agency||0);
    return '<tr>'
      +'<td class="mono">'+esc(t.id)+'</td><td>'+esc(t.pax)+'</td><td>'+esc(t.airline)+'</td><td>'+esc(t.issue)+'</td>'
      +'<td>'+money(t.agency)+'</td><td>'+money(t.bsp)+'</td>'
      +'<td style="color:'+(diff===0?'var(--text3)':'#dc2626')+'">'+(diff===0?'—':(diff>0?'+':'')+money(diff))+'</td>'
      +'<td><span class="tvb-pill" style="background:'+(MSTATUS[t.status]||'#94a3b8')+'">'+esc(t.status)+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +(t.status!=='Matched'?'<button class="tvb-op" title="Mark matched" onclick="tvbMatch(\''+t.id+'\')">✓</button>':'')
        +(t.status==='Discrepancy'?'<button class="tvb-op" title="Raise ADM from this" onclick="tvbToAdm(\''+t.id+'\')">⚠️</button>':'')
      +'</td></tr>';
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:24px">No transactions for this filter.</td></tr>';

  var arows=DB.adms.map(function(a){
    return '<tr><td class="mono">'+esc(a.id)+'</td><td>'+esc(a.airline)+'</td><td class="mono">'+esc(a.ticket)+'</td>'
      +'<td>'+esc(a.reason)+'</td><td style="color:#dc2626">'+money(a.amount)+'</td><td>'+esc(a.date)+'</td>'
      +'<td><span class="tvb-pill" style="background:'+(ASTATUS[a.status]||'#94a3b8')+'">'+esc(a.status)+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +(a.status==='Open'?'<button class="tvb-op" title="Dispute" onclick="tvbAdm(\''+a.id+'\',\'Disputed\')">⚖️</button>':'')
        +(a.status!=='Settled'?'<button class="tvb-op" title="Settle / Pay" onclick="tvbAdm(\''+a.id+'\',\'Settled\')">💳</button>':'')
        +'<button class="tvb-op" title="Delete" onclick="tvbAdmDel(\''+a.id+'\')">🗑</button>'
      +'</td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:20px">No ADMs. 🎉</td></tr>';

  var urows=DB.unused.map(function(u){var st=u.status||'Open';
    return '<tr><td class="mono">'+esc(u.id)+'</td><td>'+esc(u.pax)+'</td><td>'+esc(u.airline)+'</td><td>'+money(u.value)+'</td><td>'+esc(u.expiry)+'</td>'
      +'<td><span class="tvb-pill" style="background:'+({Open:'#94a3b8',Claimed:'#d97706',Recovered:'#16a34a'})[st]+'">'+st+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +(st==='Open'?'<button class="tvb-op" title="File refund claim" onclick="tvbClaim(\''+u.id+'\')">📝 Claim</button>':'')
        +(st==='Claimed'?'<button class="tvb-op" title="Mark recovered" onclick="tvbRecovered(\''+u.id+'\')">✓ Recovered</button>':'')
      +'</td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:18px">No unused tickets.</td></tr>';

  // fare audit: transactions whose issued (agency) fare differs from the BSP fare
  var fa=DB.txns.filter(function(t){return t.status==='Discrepancy';});
  var faRows=fa.map(function(t){var diff=(+t.agency||0)-(+t.bsp||0);
    return '<tr><td class="mono">'+esc(t.id)+'</td><td>'+esc(t.airline)+'</td><td>'+money(t.agency)+'</td><td>'+money(t.bsp)+'</td>'
      +'<td style="color:#dc2626">'+money(Math.abs(diff))+'</td>'
      +'<td style="text-align:right;white-space:nowrap"><button class="tvb-op" title="Raise ADM" onclick="tvbToAdm(\''+t.id+'\')">⚠️</button><button class="tvb-op" title="Resolve (mark matched)" onclick="tvbResolve(\''+t.id+'\')">✓</button></td></tr>';
  }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:18px">No fare discrepancies ✓</td></tr>';

  var chip=function(v,l){return '<button class="tvb-chip'+(fltM===v?' on':'')+'" onclick="tvbFilter(\''+v+'\')">'+l+'</button>';};

  r.innerHTML=''
   +apiCard
   +'<div class="tvb-kpis">'
     +'<div class="tvb-kpi"><div class="l">💷 BSP Remittance Due</div><div class="v">'+money(remit)+'</div><div class="s">net of commission</div></div>'
     +'<div class="tvb-kpi"><div class="l">⚠️ ADM Exposure</div><div class="v" style="color:#dc2626">'+money(admOpen)+'</div><div class="s">'+DB.adms.filter(function(a){return a.status!=='Settled';}).length+' open</div></div>'
     +'<div class="tvb-kpi"><div class="l">🔁 Unreconciled</div><div class="v" style="color:#d97706">'+unmatched+'</div><div class="s">txns to match</div></div>'
     +'<div class="tvb-kpi"><div class="l">🎫 Unused Tickets</div><div class="v" style="font-size:19px">'+money(unusedVal)+'</div><div class="s">'+DB.unused.length+' open</div></div>'
   +'</div>'
   +'<div class="tvb-card tvb-pad"><div class="tvb-h">📑 BSP Reconciliation'
     +'<span class="tvb-chips">'+chip('','All')+chip('Matched','Matched')+chip('Unmatched','Unmatched')+chip('Discrepancy','Discrepancy')+'</span>'
     +'<button class="erp-btn btn-primary btn-sm" style="margin-left:8px" onclick="tvbAutoMatch()">⚙ Run Auto-Match</button></div>'
     +'<table class="tvb-tbl"><thead><tr><th>Ticket No</th><th>Passenger</th><th>Airline</th><th>Issue</th><th>Agency Amt</th><th>BSP Amt</th><th>Diff</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+trows+'</tbody></table></div>'
   +'<div class="tvb-card tvb-pad"><div class="tvb-h">⚠️ ADM Tracker — Agency Debit Memos</div>'
     +'<div class="tvb-add">'
       +'<select id="tvb-air">'+AIRLINES.map(function(a){return '<option>'+esc(a)+'</option>';}).join('')+'</select>'
       +'<input id="tvb-tkt" placeholder="Ticket no">'
       +'<input id="tvb-rsn" placeholder="Reason" style="flex:1;min-width:160px">'
       +'<input id="tvb-amt" type="number" placeholder="Amount ৳" style="width:120px">'
       +'<button class="erp-btn btn-primary" onclick="tvbAdmAdd()">＋ Add ADM</button>'
     +'</div>'
     +'<table class="tvb-tbl"><thead><tr><th>ADM #</th><th>Airline</th><th>Ticket</th><th>Reason</th><th>Amount</th><th>Date</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+arows+'</tbody></table></div>'
   +'<div class="tvb-card tvb-pad"><div class="tvb-h">🔎 Fare Audit — issued vs BSP fare <button class="erp-btn btn-primary btn-sm" style="margin-left:auto" onclick="tvbRunAudit()">Run fare audit</button></div>'
     +'<table class="tvb-tbl"><thead><tr><th>Ticket</th><th>Airline</th><th>Issued (agency)</th><th>BSP fare</th><th>Variance</th><th style="text-align:right">Action</th></tr></thead><tbody>'+faRows+'</tbody></table>'
     +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Variances are likely ADM exposure — resolve or raise an ADM proactively before the airline does.</div></div>'
   +'<div class="tvb-card tvb-pad"><div class="tvb-h">🎫 Unused / Open Tickets — recovery (≈3–5% of air spend)</div>'
     +'<table class="tvb-tbl"><thead><tr><th>Ticket No</th><th>Held For</th><th>Airline</th><th>Value</th><th>Expiry</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+urows+'</tbody></table></div>';
}

window.tvbSync=function(){ if(!DB.api.connected){alert('Connect the IATA / BSP API first.');return;}
  // simulate pulling fresh rows from the IATA BSP billing file via API
  var n=1+Math.floor(Math.random()*2); var added=[];
  for(var i=0;i<n;i++){ var air=AIRLINES[Math.floor(Math.random()*AIRLINES.length)];
    var amt=(Math.floor(Math.random()*80)+40)*1000; var tk=(Math.floor(Math.random()*900)+100)+'-24'+(Math.floor(Math.random()*9e7)+1e7);
    DB.txns.unshift({id:tk,pax:'(imported · BSP)',airline:air,issue:stamp(),comm:Math.round(amt*0.05),agency:0,bsp:amt,status:'Unmatched'}); added.push(tk); }
  DB.api.lastSync=nowStr(); save(); render();
  alert('⟳ IATA BSP API sync complete\n\nPulled '+n+' new billing record(s) into reconciliation:\n• '+added.join('\n• ')+'\n\n(Match them against agency sales below.)');
};
window.tvbToggleConn=function(){ DB.api.connected=!DB.api.connected; if(DB.api.connected)DB.api.lastSync=nowStr(); save(); render(); };
window.tvbFilter=function(v){fltM=v;render();};
window.tvbRunAudit=function(){var n=0;DB.txns.forEach(function(t){if((+t.bsp||0)>0 && (+t.agency||0)!==(+t.bsp||0) && t.status!=='Matched'){t.status='Discrepancy';n++;}});save();render();alert('🔎 Fare audit complete — '+n+' variance(s) flagged for review.');};
window.tvbResolve=function(id){var t=DB.txns.find(function(x){return x.id===id;});if(t){t.status='Matched';if(+t.bsp===0)t.bsp=t.agency;save();render();}};
window.tvbClaim=function(id){var u=DB.unused.find(function(x){return x.id===id;});if(u){u.status='Claimed';save();render();}};
window.tvbRecovered=function(id){var u=DB.unused.find(function(x){return x.id===id;});if(u){u.status='Recovered';save();render();}};
window.tvbAutoMatch=function(){var n=0;DB.txns.forEach(function(t){if(t.status==='Unmatched'){t.status=((+t.bsp||0)===(+t.agency||0)&&+t.bsp>0)?'Matched':'Discrepancy';n++;}});save();render();alert('Auto-match complete. '+n+' transaction(s) processed.');};
window.tvbMatch=function(id){var t=DB.txns.find(function(x){return x.id===id;});if(t){t.status='Matched';if(+t.bsp===0)t.bsp=t.agency;save();render();}};
window.tvbToAdm=function(id){var t=DB.txns.find(function(x){return x.id===id;});if(!t)return;var diff=(+t.agency||0)-(+t.bsp||0);
  DB.adms.unshift({id:uid('ADM'),airline:t.airline,ticket:t.id,reason:'Fare discrepancy vs BSP billing',amount:Math.abs(diff)||0,date:stamp(),status:'Open'});save();render();};
window.tvbAdmAdd=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var air=g('tvb-air'),tkt=g('tvb-tkt').trim(),rsn=g('tvb-rsn').trim(),amt=+g('tvb-amt')||0;
  if(!tkt||!amt){alert('Ticket no and amount are required.');return;}
  DB.adms.unshift({id:uid('ADM'),airline:air,ticket:tkt,reason:rsn||'—',amount:amt,date:stamp(),status:'Open'});save();render();};
window.tvbAdm=function(id,s){var a=DB.adms.find(function(x){return x.id===id;});if(a){a.status=s;save();render();}};
window.tvbAdmDel=function(id){if(!confirm('Delete this ADM record?'))return;DB.adms=DB.adms.filter(function(x){return x.id!==id;});save();render();};

function injectCss(){if(document.getElementById('tvb-css'))return;var s=document.createElement('style');s.id='tvb-css';var P='#erp-panel-tv-bsp ';
  s.textContent=''
  +P+'.tvb-api{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:linear-gradient(120deg,#eef4ff,#f5f3ff);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:16px;box-shadow:var(--shadow)}'
  +'[data-theme="dark"] '+P+'.tvb-api{background:linear-gradient(120deg,rgba(37,99,235,.12),rgba(124,58,237,.12))}'
  +P+'.tvb-api-l{display:flex;align-items:center;gap:12px}'
  +P+'.tvb-api-ic{font-size:24px}'
  +P+'.tvb-api-t{font-size:14px;font-weight:700}'
  +P+'.tvb-api-s{font-size:11.5px;color:var(--text2);margin-top:2px}'
  +P+'.tvb-api-s code{background:var(--bg2);border:1px solid var(--border);border-radius:5px;padding:1px 5px;font-size:11px}'
  +P+'.tvb-api-r{margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +P+'.tvb-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.tvb-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.tvb-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.tvb-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'+P+'.tvb-kpi .s{font-size:10.5px;color:var(--text3);margin-top:2px}'
  +P+'.tvb-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.tvb-pad{padding:15px 17px}'
  +P+'.tvb-h{font-size:13.5px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +P+'.tvb-chips{display:inline-flex;gap:6px;margin-left:8px}'
  +P+'.tvb-chip{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:20px;padding:4px 12px;font-size:11.5px;cursor:pointer;font-family:inherit;color:var(--text2)}'
  +P+'.tvb-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}'
  +P+'.tvb-add{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:13px}'
  +P+'.tvb-add input,'+P+'.tvb-add select{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tvb-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tvb-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.tvb-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.tvb-tbl tr:hover td{background:#fafbff}'
  +P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tvb-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tvb-op{border:0;background:none;cursor:pointer;font-size:14px;padding:3px 6px;border-radius:6px}'+P+'.tvb-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
