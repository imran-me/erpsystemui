/* FEATURE (native, additive): Agent Performance Coach · New
   Per-agent scorecard (conversion, response time, margin, sales) + a
   gamified leaderboard + automatic micro-nudges ("3 quotes idle >24h").
   #tv-coach-root. localStorage epal_tv_coach (mock metrics, editable). */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
var LS='epal_tv_coach';
function load(){return rd(LS)||[
  {name:'Imran Hossain',leads:42,won:21,respMin:18,sales:1850000,margin:11.2},
  {name:'Fatema Akter',leads:38,won:14,respMin:46,sales:1120000,margin:9.4},
  {name:'Mitu Rani',leads:29,won:17,respMin:12,sales:1340000,margin:12.8},
  {name:'Tareq Aziz',leads:33,won:9,respMin:73,sales:680000,margin:7.1}
];}
function save(){try{localStorage.setItem(LS,JSON.stringify(A));}catch(e){}}
var A=load();
function root(){return document.getElementById('tv-coach-root');}
function conv(a){return a.leads?Math.round(a.won/a.leads*100):0;}
function score(a){return Math.round(conv(a)*1.2 + (a.margin||0)*2 + Math.max(0,60-a.respMin)/2 + (a.sales/100000));}
function nudges(a){var n=[];if(a.respMin>40)n.push('⏱ Slow response ('+a.respMin+'m avg) — reply leads <30m');if(conv(a)<35)n.push('🎯 Low conversion ('+conv(a)+'%) — follow up open quotes');if(a.margin<9)n.push('💸 Thin margin ('+a.margin+'%) — apply volume slabs');if(!n.length)n.push('🏆 On track — keep it up!');return n;}
function render(){var r=root();if(!r)return;injectCss();var ranked=A.slice().sort(function(x,y){return score(y)-score(x);});
  var rows=ranked.map(function(a,i){return '<tr><td><span class="ch-rank">'+(i+1)+'</span></td><td><strong>'+esc(a.name)+'</strong></td>'
    +'<td>'+a.leads+'</td><td>'+a.won+'</td><td>'+conv(a)+'%</td><td>'+a.respMin+'m</td><td>'+money(a.sales)+'</td><td>'+a.margin+'%</td>'
    +'<td><span class="ch-score">'+score(a)+'</span></td>'
    +'<td style="text-align:right"><button class="erp-btn btn-sm btn-ghost" onclick="tvCoachNudge(\''+esc(a.name).replace(/\x27/g,"")+'\')">Send nudge</button></td></tr>';}).join('');
  var nfeed=ranked.map(function(a){return nudges(a).filter(function(n){return n.indexOf('On track')<0;}).map(function(n){return '<div class="ch-nudge"><b>'+esc(a.name)+':</b> '+esc(n)+'</div>';}).join('');}).join('')||'<div style="color:var(--text3);font-size:12.5px">No nudges — team is on track. 🎉</div>';
  r.innerHTML='<div class="ch-kpis"><div class="ch-kpi"><div class="l">🏆 Top performer</div><div class="v" style="font-size:16px">'+esc(ranked[0].name)+'</div></div>'
    +'<div class="ch-kpi"><div class="l">📈 Avg conversion</div><div class="v">'+Math.round(A.reduce(function(s,a){return s+conv(a);},0)/A.length)+'%</div></div>'
    +'<div class="ch-kpi"><div class="l">💰 Team sales</div><div class="v" style="font-size:18px">'+money(A.reduce(function(s,a){return s+a.sales;},0))+'</div></div></div>'
    +'<div class="ch-card"><div class="ch-h">🎮 Leaderboard</div><table class="ch-tbl"><thead><tr><th>#</th><th>Agent</th><th>Leads</th><th>Won</th><th>Conv.</th><th>Resp.</th><th>Sales</th><th>Margin</th><th>Score</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div class="ch-card" style="margin-top:14px"><div class="ch-h">🔔 Auto-Nudges</div>'+nfeed+'</div>';
}
window.tvCoachNudge=function(name){var a=A.find(function(x){return x.name===name;});alert('🔔 Nudge sent to '+name+':\n\n• '+nudges(a).join('\n• '));};
function injectCss(){if(document.getElementById('ch-css'))return;var s=document.createElement('style');s.id='ch-css';var P='#erp-panel-tv-coach ';
  s.textContent=P+'.ch-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.ch-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.ch-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.ch-kpi .v{font-size:23px;font-weight:700;margin-top:4px}'
  +P+'.ch-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:15px 17px}'+P+'.ch-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.ch-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.ch-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 11px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.ch-tbl td{padding:9px 11px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.ch-rank{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font-size:11px;font-weight:700}'
  +P+'.ch-score{font-weight:800;font-family:"DM Mono",monospace;color:var(--accent)}'
  +P+'.ch-nudge{font-size:12.5px;padding:7px 0;border-bottom:1px dashed var(--border)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
