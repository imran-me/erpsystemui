/* FEATURE (native, additive): Compliance & Fraud Sentinel · New
   Anomaly radar — duplicate passport across customers, name mismatch
   ticket-vs-passport, suspiciously low fare (ADM bait), abnormal refunds.
   Flags issues with severity before they become fines. #tv-sentinel-root. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
var LS='epal_tv_sentinel_dismiss';
function dismissed(){return rd(LS)||[];}
function saveDis(a){try{localStorage.setItem(LS,JSON.stringify(a));}catch(e){}}
function root(){return document.getElementById('tv-sentinel-root');}
function scan(){
  var f=[];var fbk=rd('epal_tv_fbk')||[];
  // low-fare / ADM bait: sale below a floor for the route family
  fbk.forEach(function(b){var sale=(b.fare||0);if(sale>0&&sale<35000&&(b.to&&['DXB','JED','RUH','DOH','KUL'].indexOf(b.to)>=0)){f.push({sev:'High',type:'Fare below market floor',detail:b.pnr+' · '+b.from+'-'+b.to+' @ '+money(sale)+' — possible ADM exposure',k:'lowfare-'+b.id});}});
  // duplicate passenger names across bookings (possible duplicate issuance)
  var names={};fbk.forEach(function(b){(b.pax||[]).forEach(function(p){var n=(p.name||'').trim().toLowerCase();if(!n)return;names[n]=(names[n]||0)+1;});});
  Object.keys(names).forEach(function(n){if(names[n]>1)f.push({sev:'Medium',type:'Duplicate passenger across PNRs',detail:'"'+n+'" appears in '+names[n]+' bookings — verify not double-issued',k:'dup-'+n});});
  // abnormal refund (payout > 90% of ticket = unusual)
  (rd('epal_tv_refunds')||[]).forEach(function(r){var po=Math.max(0,(+r.airlineRefund||0)-(+r.penalty||0)-(+r.fee||0));if((+r.gross||0)>0&&po>(+r.gross||0)*0.95){f.push({sev:'Medium',type:'Abnormal refund payout',detail:r.id+' · payout '+money(po)+' ≈ full ticket — review penalty applied',k:'ref-'+r.id});}});
  // ADM open (compliance)
  var bsp=rd('epal_tv_bsp');if(bsp&&bsp.adms)bsp.adms.filter(function(a){return a.status==='Open';}).forEach(function(a){f.push({sev:'High',type:'Unresolved ADM',detail:a.id+' · '+a.airline+' · '+money(a.amount)+' — '+a.reason,k:'adm-'+a.id});});
  if(!f.length)f.push({sev:'seed',type:'Seed example — name mismatch',detail:'Ticket name "MD RAHIM" vs passport "MD. RAHIM UDDIN" — correct before travel',k:'seed-1'});
  var dis=dismissed();return f.filter(function(x){return dis.indexOf(x.k)<0;});
}
function render(){var r=root();if(!r)return;injectCss();var F=scan();
  var sevC={High:'#dc2626',Medium:'#d97706',Low:'#2563eb',seed:'#94a3b8'};
  var hi=F.filter(function(x){return x.sev==='High';}).length;
  var rows=F.map(function(x){return '<tr><td><span class="sn-pill" style="background:'+(sevC[x.sev]||'#94a3b8')+'">'+(x.sev==='seed'?'Info':x.sev)+'</span></td>'
    +'<td><strong>'+esc(x.type)+'</strong></td><td>'+esc(x.detail)+'</td>'
    +'<td style="text-align:right;white-space:nowrap"><button class="sn-op" title="Mark reviewed / dismiss" onclick="tvSnDismiss(\''+x.k.replace(/'/g,"")+'\')">✓ Reviewed</button></td></tr>';}).join('')
    ||'<tr><td colspan="4" style="text-align:center;color:#16a34a;padding:26px">No anomalies. All clean. ✓</td></tr>';
  r.innerHTML='<div class="sn-kpis"><div class="sn-kpi"><div class="l">🛡 Open Flags</div><div class="v">'+F.length+'</div></div>'
    +'<div class="sn-kpi"><div class="l">🔴 High severity</div><div class="v" style="color:#dc2626">'+hi+'</div></div>'
    +'<div class="sn-kpi" style="display:flex;align-items:center;justify-content:center"><button class="erp-btn btn-primary" onclick="tvSnRescan()">↻ Re-scan now</button></div></div>'
    +'<div class="sn-card"><table class="sn-tbl"><thead><tr><th>Severity</th><th>Anomaly</th><th>Detail</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Heuristic checks across bookings, refunds &amp; ADMs. Dismissals are remembered.</div>';
}
window.tvSnRescan=function(){render();};
window.tvSnDismiss=function(k){var d=dismissed();if(d.indexOf(k)<0)d.push(k);saveDis(d);render();};
function injectCss(){if(document.getElementById('sn-css'))return;var s=document.createElement('style');s.id='sn-css';var P='#erp-panel-tv-sentinel ';
  s.textContent=P+'.sn-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.sn-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.sn-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.sn-kpi .v{font-size:23px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.sn-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}'
  +P+'.sn-tbl{width:100%;border-collapse:collapse;font-size:13px}'+P+'.sn-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 13px;border-bottom:1px solid var(--border);background:var(--bg3)}'
  +P+'.sn-tbl td{padding:10px 13px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.sn-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.sn-op{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);cursor:pointer;font-size:11.5px;padding:4px 9px;border-radius:7px;font-family:inherit;color:var(--text2)}'+P+'.sn-op:hover{border-color:var(--accent);color:var(--accent)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
