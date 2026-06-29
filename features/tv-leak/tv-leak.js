/* FEATURE (native, additive): Profit Leak Detector · New
   Cross-module audit of money silently lost — unclaimed commission, expired
   unused tickets, open refunds, overdue receivables, expired TTL holds, ADM
   exposure. Computes total recoverable ৳ with one-click jump-to-fix.
   #tv-leak-root. Read-only/computed. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
function root(){return document.getElementById('tv-leak-root');}
function leaks(){
  var out=[];
  var comm=rd('epal_tv_commission')||[];var cOut=comm.reduce(function(a,x){var e=Math.round((+x.sales||0)*((+x.rate||0)/100))+(+x.override||0);return a+Math.max(0,e-(+x.received||0));},0);
  if(cOut>0)out.push({cat:'Unclaimed commission',amt:cOut,go:'tv-commission',note:comm.length+' airline/vendor lines'});
  var bsp=rd('epal_tv_bsp');var unused=bsp&&bsp.unused?bsp.unused.filter(function(u){return (u.status||'Open')!=='Recovered';}).reduce(function(a,u){return a+(+u.value||0);},0):0;
  if(unused>0)out.push({cat:'Unused tickets (recoverable)',amt:unused,go:'tv-bsp',note:'file refund claims'});
  var adm=bsp&&bsp.adms?bsp.adms.filter(function(a){return a.status!=='Settled';}).reduce(function(s,a){return s+(+a.amount||0);},0):0;
  if(adm>0)out.push({cat:'Open ADM exposure',amt:adm,go:'tv-bsp',note:'dispute or settle'});
  var refs=rd('epal_tv_refunds')||[];var rAwait=refs.filter(function(r){return r.status==='Filed';}).reduce(function(a,r){return a+(+r.airlineRefund||0);},0);
  if(rAwait>0)out.push({cat:'Refunds awaiting from airline',amt:rAwait,go:'tv-refunds',note:'chase the airline'});
  var acc=rd('epal_tv_accounts')||[];var recv=acc.filter(function(p){return p.type==='Agent';}).reduce(function(a,p){var c=(+p.opening||0)+(p.txns||[]).reduce(function(s,t){var d=['Invoice / Purchase','ADM (Debit Memo)','Service Charge'].indexOf(t.kind)>=0;return s+(d?(+t.amount||0):-(+t.amount||0));},0);return a+(c>0?c:0);},0);
  if(recv>0)out.push({cat:'Overdue receivables (agents)',amt:recv,go:'tv-accounts',note:'collect dues'});
  var ttl=rd('epal_tv_ttl');var expired=ttl&&ttl.pnrs?ttl.pnrs.filter(function(p){return p.status==='Hold'&&new Date(p.ttl)<new Date();}).reduce(function(a,p){return a+(+p.amount||0);},0):0;
  if(expired>0)out.push({cat:'Expired TTL holds (penalty risk)',amt:expired,go:'tv-ttl',note:'issue or release'});
  return out;
}
function render(){var r=root();if(!r)return;injectCss();var L=leaks();var total=L.reduce(function(a,x){return a+x.amt;},0);
  var rows=L.map(function(x){return '<tr><td><strong>'+esc(x.cat)+'</strong><div style="font-size:11px;color:var(--text3)">'+esc(x.note)+'</div></td>'
    +'<td style="font-family:\'DM Mono\',monospace;font-size:15px;color:#dc2626;font-weight:700">'+money(x.amt)+'</td>'
    +'<td style="text-align:right"><button class="erp-btn btn-sm btn-primary" onclick="showErpPanel(\''+x.go+'\',null)">Recover →</button></td></tr>';}).join('')
    ||'<tr><td colspan="3" style="text-align:center;color:#16a34a;padding:26px">No leaks detected — every taka accounted for. 🎉</td></tr>';
  r.innerHTML='<div class="lk-hero"><div><div class="lk-l">💧 Total Recoverable / At-Risk</div><div class="lk-v">'+money(total)+'</div>'
    +'<div class="lk-s">aggregated across commission, tickets, refunds, ADMs, receivables &amp; TTL holds</div></div>'
    +'<button class="erp-btn btn-ghost" onclick="tvLeakRefresh()" style="margin-left:auto">↻ Re-scan</button></div>'
    +'<div class="lk-card"><table class="lk-tbl"><thead><tr><th>Leak Source</th><th>Amount</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Live — recomputed from every module each visit. Plug the biggest red number first.</div>';
}
window.tvLeakRefresh=function(){render();};
function injectCss(){if(document.getElementById('lk-css'))return;var s=document.createElement('style');s.id='lk-css';var P='#erp-panel-tv-leak ';
  s.textContent=P+'.lk-hero{display:flex;align-items:center;gap:14px;background:linear-gradient(120deg,#fef2f2,#fff7ed);border:1px solid #fecaca;border-radius:16px;padding:20px 22px;margin-bottom:18px}'
  +'[data-theme="dark"] '+P+'.lk-hero{background:linear-gradient(120deg,rgba(220,38,38,.12),rgba(234,88,12,.12));border-color:rgba(220,38,38,.35)}'
  +P+'.lk-l{font-size:12.5px;color:var(--text2);font-weight:600}'+P+'.lk-v{font-size:34px;font-weight:800;color:#dc2626;font-family:"DM Mono",monospace;margin:3px 0}'+P+'.lk-s{font-size:11.5px;color:var(--text3)}'
  +P+'.lk-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}'
  +P+'.lk-tbl{width:100%;border-collapse:collapse;font-size:13px}'+P+'.lk-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:11px 14px;border-bottom:1px solid var(--border);background:var(--bg3)}'
  +P+'.lk-tbl td{padding:12px 14px;border-bottom:1px solid var(--border);vertical-align:middle}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
