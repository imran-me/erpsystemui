/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Hotels & Holiday Packages  ·  New
   Multi-product selling (TBO / ShareTrip style): hotel search → book, and
   ready holiday packages → book/quote, with a combined bookings list.
   Renders into #tv-hotel-root (panel erp-panel-tv-hotels).
   localStorage epal_tv_hotels. Additive only.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_hotels';
var CITIES=['Dubai','Makkah','Madinah','Kuala Lumpur','Singapore','Bangkok','Maldives','Istanbul','Cox’s Bazar'];
var HNAMES=['Grand Plaza','Royal Continental','Pearl Suites','City Garden Inn','Skyline Tower','Oasis Resort','Crown Palace','Marina Bay Hotel'];
var PKG=[
  {id:'PK-1',name:'Umrah Package — 10 Nights',dest:'Makkah + Madinah',nights:10,price:165000,inc:['Visa','Return air','4★ hotel','Ziyarah','Transport'],ic:'🕋'},
  {id:'PK-2',name:'Dubai City Break',dest:'Dubai, UAE',nights:4,price:78000,inc:['Visa','Air','4★ hotel','City tour','Desert safari'],ic:'🏙'},
  {id:'PK-3',name:'Malaysia Explorer',dest:'Kuala Lumpur + Genting',nights:5,price:69000,inc:['Visa','Air','Hotel','Tours','Transfers'],ic:'🌴'},
  {id:'PK-4',name:'Maldives Honeymoon',dest:'Maldives',nights:4,price:142000,inc:['Air','Water villa','All meals','Speedboat'],ic:'🏝'},
  {id:'PK-5',name:'Thailand Delight',dest:'Bangkok + Pattaya',nights:5,price:62000,inc:['Visa','Air','Hotel','City tour','Coral island'],ic:'🐘'},
  {id:'PK-6',name:'Istanbul Heritage',dest:'Istanbul, Turkey',nights:5,price:118000,inc:['Visa','Air','Hotel','Bosphorus cruise'],ic:'🕌'}
];
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function uid(p){return p+'-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return [];}
function save(){try{localStorage.setItem(LS,JSON.stringify(BOOK));}catch(e){}}
var BOOK=load();
var tab='hotels', hres=null, hq=null;

function root(){return document.getElementById('tv-hotel-root');}
function render(){var r=root();if(!r)return;injectCss();
  var tabs='<div class="tvh-tabs">'
    +'<button class="'+(tab==='hotels'?'on':'')+'" onclick="tvhTab(\'hotels\')">🏨 Hotels</button>'
    +'<button class="'+(tab==='packages'?'on':'')+'" onclick="tvhTab(\'packages\')">🧳 Holiday Packages</button>'
    +'<button class="'+(tab==='bookings'?'on':'')+'" onclick="tvhTab(\'bookings\')">🗂 Bookings <span class="tvh-b">'+BOOK.length+'</span></button></div>';
  r.innerHTML=tabs+'<div id="tvh-body">'+(tab==='hotels'?hotels():tab==='packages'?packages():bookings())+'</div>';
}

/* hotels */
function hotels(){
  var q=hq||{city:'Dubai',cin:'',cout:'',rooms:1,guests:2};
  var form='<div class="tvh-search"><div class="tvh-sgrid">'
    +'<div class="tvh-f"><label>City</label><select id="tvh-city">'+CITIES.map(function(c){return '<option'+(c===q.city?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></div>'
    +'<div class="tvh-f"><label>Check-in</label><input id="tvh-cin" type="date" value="'+esc(q.cin)+'"></div>'
    +'<div class="tvh-f"><label>Check-out</label><input id="tvh-cout" type="date" value="'+esc(q.cout)+'"></div>'
    +'<div class="tvh-f"><label>Rooms</label><input id="tvh-rooms" type="number" min="1" value="'+esc(q.rooms)+'"></div>'
    +'<div class="tvh-f"><label>Guests</label><input id="tvh-guests" type="number" min="1" value="'+esc(q.guests)+'"></div>'
    +'<div class="tvh-f"><label>&nbsp;</label><button class="erp-btn btn-primary" onclick="tvhSearch()">🔍 Search Hotels</button></div>'
    +'</div></div>';
  var res=hres?hres.map(function(h,i){
    return '<div class="tvh-hotel"><div class="tvh-himg">🏨</div>'
      +'<div class="tvh-hinfo"><div class="tvh-hname">'+esc(h.name)+' <span class="tvh-star">'+'★'.repeat(h.star)+'</span></div>'
      +'<div class="tvh-hmeta">'+esc(hq.city)+' · '+esc(h.area)+' · '+(h.refundable?'<span style="color:#16a34a;font-weight:700">Free cancellation</span>':'<span style="color:#dc2626;font-weight:700">Non-refundable</span>')+'</div>'
      +'<div class="tvh-hamen">'+h.amen.map(function(a){return '<span>'+esc(a)+'</span>';}).join('')+'</div></div>'
      +'<div class="tvh-hfare"><div class="tvh-price">'+money(h.price)+'</div><div class="tvh-pp">/night · per room</div>'
      +'<button class="erp-btn btn-primary btn-sm" onclick="tvhBookHotel('+i+')">Book →</button></div></div>';
  }).join(''):'<div class="tvh-hint">🏨 Search a city to see live-style hotel rates.</div>';
  return form+'<div>'+res+'</div>';
}
function genHotels(city){var base={'Dubai':9000,'Makkah':7000,'Madinah':6500,'Singapore':14000,'Maldives':32000,'Bangkok':5500,'Istanbul':8000,'Kuala Lumpur':6000,'Cox’s Bazar':4500}[city]||7000;
  var areas=['Downtown','Airport Rd','Beachfront','City Center','Old Town'];var amenAll=['Wifi','Breakfast','Pool','Gym','Airport pickup','Spa'];
  var n=4+Math.floor(Math.random()*3);var out=[];for(var i=0;i<n;i++){var star=3+Math.floor(Math.random()*3);
    out.push({name:HNAMES[Math.floor(Math.random()*HNAMES.length)],star:star,area:areas[Math.floor(Math.random()*areas.length)],
      price:Math.round(base*(0.7+star*0.18+Math.random()*0.3)/100)*100,refundable:Math.random()<0.6,
      amen:amenAll.slice(0,2+Math.floor(Math.random()*3))});}
  return out.sort(function(a,b){return a.price-b.price;});}

/* packages */
function packages(){
  return '<div class="tvh-pkgs">'+PKG.map(function(p){
    return '<div class="tvh-pkg"><div class="tvh-pic">'+p.ic+'</div>'
      +'<div class="tvh-pname">'+esc(p.name)+'</div><div class="tvh-pdest">📍 '+esc(p.dest)+' · '+p.nights+' nights</div>'
      +'<div class="tvh-pinc">'+p.inc.map(function(x){return '<span>✓ '+esc(x)+'</span>';}).join('')+'</div>'
      +'<div class="tvh-prow"><div class="tvh-price">'+money(p.price)+'<span class="tvh-pp"> /person</span></div>'
      +'<button class="erp-btn btn-primary btn-sm" onclick="tvhBookPkg(\''+p.id+'\')">Book / Quote</button></div></div>';
  }).join('')+'</div>';
}

/* bookings */
function bookings(){
  var rows=BOOK.map(function(b){
    return '<tr><td class="mono">'+esc(b.id)+'</td><td><span class="tvh-tag">'+esc(b.type)+'</span></td>'
      +'<td><strong>'+esc(b.title)+'</strong><div style="font-size:11px;color:var(--text3)">'+esc(b.detail)+'</div></td>'
      +'<td>'+esc(b.customer||'—')+'</td><td>'+esc(b.dates||'—')+'</td><td>'+money(b.amount)+'</td>'
      +'<td><span class="tvh-pill" style="background:'+(b.status==='Confirmed'?'#16a34a':'#d97706')+'">'+esc(b.status)+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'+(b.status!=='Confirmed'?'<button class="tvh-op" title="Confirm" onclick="tvhConfirm(\''+b.id+'\')">✓</button>':'')+'<button class="tvh-op" title="Delete" onclick="tvhDel(\''+b.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:26px">No hotel/package bookings yet.</td></tr>';
  return '<div class="tvh-card"><table class="tvh-tbl"><thead><tr><th>Ref</th><th>Type</th><th>Item</th><th>Customer</th><th>Dates</th><th>Amount</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

window.tvhTab=function(t){tab=t;render();};
window.tvhSearch=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  hq={city:g('tvh-city'),cin:g('tvh-cin'),cout:g('tvh-cout'),rooms:+g('tvh-rooms')||1,guests:+g('tvh-guests')||2};
  hres=genHotels(hq.city);var b=document.getElementById('tvh-body');if(b)b.innerHTML=hotels();};
window.tvhBookHotel=function(i){var h=hres[i];var cust=prompt('Customer name for this hotel booking:','');if(cust===null)return;
  var nights=1; if(hq.cin&&hq.cout){nights=Math.max(1,Math.round((new Date(hq.cout)-new Date(hq.cin))/86400000));}
  var amount=h.price*nights*hq.rooms;
  BOOK.unshift({id:uid('HTL'),type:'Hotel',title:h.name+' ('+h.star+'★)',detail:hq.city+' · '+nights+'n × '+hq.rooms+' room(s)',customer:cust.trim()||'Walk-in',dates:(hq.cin||'?')+' → '+(hq.cout||'?'),amount:amount,status:'Hold'});
  save();alert('🏨 Hotel held\n'+h.name+'\n'+nights+' night(s) × '+hq.rooms+' room(s) = '+money(amount));tab='bookings';render();};
window.tvhBookPkg=function(id){var p=PKG.find(function(x){return x.id===id;});if(!p)return;var cust=prompt('Customer name for "'+p.name+'":','');if(cust===null)return;var pax=+prompt('Number of travellers:','1')||1;
  BOOK.unshift({id:uid('PKG'),type:'Package',title:p.name,detail:p.dest+' · '+p.nights+'n · '+pax+' pax',customer:cust.trim()||'Walk-in',dates:'—',amount:p.price*pax,status:'Hold'});
  save();alert('🧳 Package booked (Hold)\n'+p.name+'\n'+pax+' pax = '+money(p.price*pax));tab='bookings';render();};
window.tvhConfirm=function(id){var b=BOOK.find(function(x){return x.id===id;});if(b){b.status='Confirmed';save();render();}};
window.tvhDel=function(id){if(!confirm('Delete this booking?'))return;BOOK=BOOK.filter(function(x){return x.id!==id;});save();render();};

function injectCss(){if(document.getElementById('tvh-css'))return;var s=document.createElement('style');s.id='tvh-css';var P='#erp-panel-tv-hotels ';
  s.textContent=''
  +P+'.tvh-tabs{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--border)}'
  +P+'.tvh-tabs button{border:0;background:none;padding:10px 16px;font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}'
  +P+'.tvh-tabs button.on{color:var(--accent);border-bottom-color:var(--accent)}'
  +P+'.tvh-b{background:var(--accent);color:#fff;border-radius:10px;padding:0 7px;font-size:11px;margin-left:4px}'
  +P+'.tvh-search{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:16px;margin-bottom:16px}'
  +P+'.tvh-sgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;align-items:end}'
  +P+'.tvh-f label{display:block;font-size:11.5px;color:var(--text2);margin-bottom:5px;font-weight:600}'
  +P+'.tvh-f input,'+P+'.tvh-f select{width:100%;box-sizing:border-box;border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tvh-hint{background:var(--bg2);border:1px dashed var(--border2,#d0d6e8);border-radius:12px;padding:26px;text-align:center;color:var(--text3);font-size:13.5px}'
  +P+'.tvh-hotel{display:flex;gap:14px;align-items:center;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:11px;box-shadow:var(--shadow)}'
  +P+'.tvh-himg{width:60px;height:60px;border-radius:11px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0}'
  +P+'.tvh-hinfo{flex:1}'+P+'.tvh-hname{font-size:14.5px;font-weight:700}'+P+'.tvh-star{color:#f59e0b;font-size:12px}'
  +P+'.tvh-hmeta{font-size:12px;color:var(--text2);margin:3px 0}'
  +P+'.tvh-hamen span{font-size:10.5px;background:var(--bg3);color:var(--text2);padding:1px 7px;border-radius:6px;margin-right:5px}'
  +P+'.tvh-hfare{text-align:right}'+P+'.tvh-price{font-size:18px;font-weight:800}'+P+'.tvh-pp{font-size:10.5px;color:var(--text3)}'
  +P+'.tvh-pkgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}'
  +P+'.tvh-pkg{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--shadow)}'
  +P+'.tvh-pic{font-size:30px}'+P+'.tvh-pname{font-size:15px;font-weight:700;margin-top:6px}'+P+'.tvh-pdest{font-size:12px;color:var(--text2);margin:3px 0 9px}'
  +P+'.tvh-pinc{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:11px}'+P+'.tvh-pinc span{font-size:11px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:1px 7px;border-radius:6px}'
  +'[data-theme="dark"] '+P+'.tvh-pinc span{background:rgba(22,163,74,.13);border-color:rgba(22,163,74,.35)}'
  +P+'.tvh-prow{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);padding-top:11px}'
  +P+'.tvh-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}'
  +P+'.tvh-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tvh-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3)}'
  +P+'.tvh-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tvh-tag{font-size:10.5px;font-weight:700;background:var(--bg3);color:var(--text2);padding:2px 8px;border-radius:6px}'
  +P+'.tvh-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tvh-op{border:0;background:none;cursor:pointer;font-size:13px;padding:3px 6px;border-radius:6px}'+P+'.tvh-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
