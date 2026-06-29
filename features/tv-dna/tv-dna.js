/* FEATURE (native, additive): Customer Travel-DNA & Next-Trip Predictor · New
   Builds a behavioural profile per customer from bookings + quotes (trips,
   favourite destination, avg spend, season) and predicts the next trip with
   a tailored auto-offer. #tv-dna-root. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
function root(){return document.getElementById('tv-dna-root');}
function profiles(){
  var map={};function add(name,dest,amt){if(!name)return;var k=name.trim();if(!map[k])map[k]={name:k,trips:0,spend:0,dests:{}};map[k].trips++;map[k].spend+=(+amt||0);if(dest)map[k].dests[dest]=(map[k].dests[dest]||0)+1;}
  (rd('epal_tv_fbk')||[]).forEach(function(b){add(b.customer,b.to,(b.fare*b.pax.length)+(b.taxes*b.pax.length));});
  (rd('epal_tv_quotations')||[]).forEach(function(q){var s=(q.items||[]).reduce(function(a,it){return a+(+it.qty||0)*(+it.sale||0);},0);add(q.customer,(q.items&&q.items[0]&&(q.items[0].desc||'').split(' ')[2])||'',s);});
  (rd('epal_tv_hotels')||[]).forEach(function(h){add(h.customer,'',h.amount);});
  // seed if empty
  var arr=Object.keys(map).map(function(k){return map[k];});
  if(!arr.length)arr=[{name:'Rahim Enterprise',trips:6,spend:540000,dests:{DXB:4,JED:2}},{name:'Nadia Sultana',trips:2,spend:138000,dests:{JED:2}},{name:'GreenLand Tours',trips:9,spend:1240000,dests:{KUL:5,SIN:4}}];
  arr.forEach(function(p){var top=Object.keys(p.dests||{}).sort(function(a,b){return p.dests[b]-p.dests[a];})[0]||'—';p.fav=top;p.avg=p.trips?Math.round(p.spend/p.trips):0;
    p.tier=p.spend>800000?'VIP':p.spend>300000?'Gold':'Regular';
    p.next=p.fav!=='—'?('Likely '+p.fav+' again'):'New destination';
    p.offer=p.tier==='VIP'?'Priority fare + free transfer':p.tier==='Gold'?'5% loyalty discount':'Welcome-back fare alert';});
  return arr.sort(function(a,b){return b.spend-a.spend;});
}
function render(){var r=root();if(!r)return;injectCss();var P=profiles();var tc={VIP:'#7c3aed',Gold:'#d97706',Regular:'#64748b'};
  var rows=P.map(function(p){return '<tr><td><strong>'+esc(p.name)+'</strong></td>'
    +'<td><span class="dna-pill" style="background:'+tc[p.tier]+'">'+p.tier+'</span></td>'
    +'<td>'+p.trips+'</td><td>'+money(p.spend)+'</td><td>'+money(p.avg)+'</td><td>'+esc(p.fav)+'</td>'
    +'<td>'+esc(p.next)+'</td><td><span class="dna-offer">'+esc(p.offer)+'</span></td>'
    +'<td style="text-align:right"><button class="erp-btn btn-sm btn-primary" onclick="tvDnaOffer(\''+esc(p.name).replace(/\x27/g,"")+'\')">📲 Send offer</button></td></tr>';}).join('');
  var vip=P.filter(function(p){return p.tier==='VIP';}).length;
  r.innerHTML='<div class="dna-kpis"><div class="dna-kpi"><div class="l">🧬 Profiles</div><div class="v">'+P.length+'</div></div>'
    +'<div class="dna-kpi"><div class="l">👑 VIP customers</div><div class="v" style="color:#7c3aed">'+vip+'</div></div>'
    +'<div class="dna-kpi"><div class="l">💰 Lifetime value</div><div class="v" style="font-size:19px">'+money(P.reduce(function(a,p){return a+p.spend;},0))+'</div></div></div>'
    +'<div class="dna-card"><table class="dna-tbl"><thead><tr><th>Customer</th><th>Tier</th><th>Trips</th><th>Lifetime Spend</th><th>Avg/Trip</th><th>Fav Dest</th><th>Next Trip (predicted)</th><th>Auto-Offer</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Profiles learn from live bookings, quotes &amp; hotel sales. Fire the offer at the predicted next-trip window.</div>';
}
window.tvDnaOffer=function(name){alert('📲 Tailored offer queued for '+name+'\n\n(Mock) A WhatsApp template with their predicted destination + tier perk would be scheduled at the optimal next-trip window.');};
function injectCss(){if(document.getElementById('dna-css'))return;var s=document.createElement('style');s.id='dna-css';var P='#erp-panel-tv-dna ';
  s.textContent=P+'.dna-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.dna-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.dna-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.dna-kpi .v{font-size:23px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.dna-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:auto}'
  +P+'.dna-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.dna-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 11px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.dna-tbl td{padding:9px 11px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.dna-pill{display:inline-block;font-size:10px;font-weight:700;color:#fff;padding:2px 8px;border-radius:20px}'
  +P+'.dna-offer{font-size:11.5px;background:var(--accent-light,#eff6ff);color:var(--accent);padding:2px 8px;border-radius:6px}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
