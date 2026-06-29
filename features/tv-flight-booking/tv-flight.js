/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Flight Booking — GDS-style  ·  New
   The core ticketing flow modelled on Amadeus/Sabre/TBO: search → fare
   results → book (passengers + PNR) → ticket operations (Issue / Re-issue /
   Refund / Void / EMD) with a history log. Renders into #tv-flight-root
   (panel erp-panel-tv-flight in travel.html). localStorage: epal_tv_fbk.
   Additive only — nothing existing is touched.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_fbk';
var AIRPORTS=[['DAC','Dhaka'],['CGP','Chattogram'],['CXB','Cox’s Bazar'],['DXB','Dubai'],['JED','Jeddah'],['RUH','Riyadh'],['KUL','Kuala Lumpur'],['DOH','Doha'],['SIN','Singapore'],['IST','Istanbul'],['LHR','London'],['JFK','New York']];
var AIRLINES=[['Biman Bangladesh','BG'],['US-Bangla','BS'],['Emirates','EK'],['Qatar Airways','QR'],['Saudia','SV'],['Malaysia Airlines','MH'],['IndiGo','6E'],['Turkish Airlines','TK'],['FlyDubai','FZ']];
var CABINS=['Economy','Premium Economy','Business','First'];
var TRIPS=['One-way','Return'];
var PAXT=['Adult','Child','Infant'];
var BST={Confirmed:'#16a34a',Hold:'#d97706',Voided:'#94a3b8',Refunded:'#7c3aed','Re-issued':'#2563eb',Cancelled:'#dc2626'};
var TST={Issued:'#16a34a',Unissued:'#94a3b8',Refunded:'#7c3aed',Void:'#dc2626'};
/* Add-on services pulled from the shared "Other Services" catalog (additives on the invoice) */
function svcCatalog(){try{var r=localStorage.getItem('epal_tv_other_services');if(r){return JSON.parse(r).filter(function(s){return s.active;});}}catch(e){}
  return [{id:'d1',name:'Passport Processing',price:3000},{id:'d2',name:'Bank Statement / Solvency',price:2000},{id:'d3',name:'Travel Insurance',price:1500},{id:'d4',name:'Airport Transfer',price:2000},{id:'d5',name:'Visa Attestation',price:2500}];}
function addonTotal(list){return (list||[]).reduce(function(a,x){return a+(+x.price||0)*(+x.qty||1);},0);}

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function pnr(){var a='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789',s='';for(var i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
function tktNo(){return '0'+(Math.floor(Math.random()*900)+100)+'-'+(Math.floor(Math.random()*9e9)+1e9);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return [];}
function save(){try{localStorage.setItem(LS,JSON.stringify(BOOKINGS));}catch(e){}}
var BOOKINGS=load();
function stamp(){return new Date().toISOString().slice(0,10);}

var view='search', results=null, query=null, draft=null;
function root(){return document.getElementById('tv-flight-root');}
function render(){var r=root();if(!r)return; injectCss();
  if(view==='book') return bookForm(r);
  if(view==='bookings') return bookingsView(r);
  return searchView(r);
}

/* ---------- SEARCH ---------- */
function apOpts(sel){return AIRPORTS.map(function(a){return '<option value="'+a[0]+'"'+(a[0]===sel?' selected':'')+'>'+a[0]+' — '+esc(a[1])+'</option>';}).join('');}
function searchView(r){
  var q=query||{from:'DAC',to:'DXB',depart:'',ret:'',pax:1,cabin:'Economy',trip:'Return'};
  r.innerHTML=''
   +'<div class="tvf-bar">'
     +'<button class="erp-btn btn-ghost" onclick="tvfGoBookings()">🗂 My Bookings <span class="tvf-badge">'+BOOKINGS.length+'</span></button>'
   +'</div>'
   +'<div class="tvf-search">'
     +'<div class="tvf-sgrid">'
       +'<div class="tvf-f"><label>Trip</label><select id="tvf-trip">'+TRIPS.map(function(t){return '<option'+(t===q.trip?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'
       +'<div class="tvf-f"><label>From</label><select id="tvf-from">'+apOpts(q.from)+'</select></div>'
       +'<div class="tvf-f"><label>To</label><select id="tvf-to">'+apOpts(q.to)+'</select></div>'
       +'<div class="tvf-f"><label>Departure</label><input id="tvf-dep" type="date" value="'+esc(q.depart)+'"></div>'
       +'<div class="tvf-f"><label>Return</label><input id="tvf-ret" type="date" value="'+esc(q.ret)+'"></div>'
       +'<div class="tvf-f"><label>Passengers</label><input id="tvf-pax" type="number" min="1" max="9" value="'+esc(q.pax)+'"></div>'
       +'<div class="tvf-f"><label>Cabin</label><select id="tvf-cabin">'+CABINS.map(function(c){return '<option'+(c===q.cabin?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div>'
       +'<div class="tvf-f tvf-f-btn"><label>&nbsp;</label><button class="erp-btn btn-primary" onclick="tvfSearch()">🔍 Search Flights</button></div>'
     +'</div>'
   +'</div>'
   +'<div id="tvf-results">'+(results?resultsHtml():'<div class="tvf-hint">✈️ Enter a route and search to see live-style fares from multiple airlines.</div>')+'</div>';
}
function resultsHtml(){
  if(!results.length) return '<div class="tvf-hint">No flights found for this route. Try another date.</div>';
  var head='<div class="tvf-rhead">'+results.length+' flights · '+esc(query.from)+' → '+esc(query.to)+' · '+esc(query.cabin)+' · '+query.pax+' pax</div>';
  return head+results.map(function(f,i){
    return '<div class="tvf-flight">'
      +'<div class="tvf-air"><span class="tvf-code">'+esc(f.code)+'</span><div><div class="tvf-aname">'+esc(f.airline)+'</div><div class="tvf-fno">'+esc(f.flightNo)+' · '+esc(query.cabin)+'</div></div></div>'
      +'<div class="tvf-time"><div class="tvf-t">'+esc(f.dep)+'</div><div class="tvf-ap">'+esc(query.from)+'</div></div>'
      +'<div class="tvf-mid"><div class="tvf-dur">'+esc(f.dur)+'</div><div class="tvf-line"><span></span></div><div class="tvf-stops">'+(f.stops===0?'Non-stop':f.stops+' stop')+'</div></div>'
      +'<div class="tvf-time"><div class="tvf-t">'+esc(f.arr)+'</div><div class="tvf-ap">'+esc(query.to)+'</div></div>'
      +'<div class="tvf-fare"><div class="tvf-price">'+money(f.fare*query.pax)+'</div><div class="tvf-pp">'+money(f.fare)+'/pax · '+(f.refundable?'<span class="tvf-ref ok">Refundable</span>':'<span class="tvf-ref no">Non-ref</span>')+'</div>'
      +'<button class="erp-btn btn-primary btn-sm" onclick="tvfBook('+i+')">Select →</button></div>'
      +'</div>';
  }).join('');
}

/* deterministic-ish mock fare generator */
function genResults(q){
  var base={DXB:48000,JED:62000,RUH:57000,KUL:39000,DOH:51000,SIN:66000,IST:72000,LHR:95000,JFK:128000,CGP:6500,CXB:7200}[q.to]||45000;
  var cabinMult={'Economy':1,'Premium Economy':1.6,'Business':2.8,'First':4.2}[q.cabin]||1;
  var n=5+Math.floor(Math.random()*3);
  var out=[];
  for(var i=0;i<n;i++){
    var a=AIRLINES[Math.floor(Math.random()*AIRLINES.length)];
    var stops=Math.random()<0.55?0:1;
    var depH=6+Math.floor(Math.random()*15), depM=Math.random()<0.5?'00':'30';
    var durH=3+Math.floor(Math.random()*9)+stops*2, durM=Math.random()<0.5?'10':'45';
    var arrH=(depH+durH)%24;
    var fare=Math.round((base*cabinMult*(0.85+Math.random()*0.4))/100)*100;
    out.push({airline:a[0],code:a[1],flightNo:a[1]+(100+Math.floor(Math.random()*800)),
      dep:(depH<10?'0':'')+depH+':'+depM, arr:(arrH<10?'0':'')+arrH+':'+depM,
      dur:durH+'h '+durM+'m', stops:stops, fare:fare, taxes:Math.round(fare*0.18/100)*100,
      refundable:Math.random()<0.6, baggage:(q.cabin==='Economy'?'30kg':'40kg')});
  }
  return out.sort(function(x,y){return x.fare-y.fare;});
}

/* ---------- BOOK ---------- */
function bookForm(r){
  var f=draft.flight, q=draft.query;
  var paxRows=draft.pax.map(function(p,i){
    return '<tr><td>'+(i+1)+'</td>'
      +'<td><select data-pk="type">'+PAXT.map(function(t){return '<option'+(t===p.type?' selected':'')+'>'+t+'</option>';}).join('')+'</select></td>'
      +'<td><input data-pk="name" value="'+esc(p.name)+'" placeholder="Full name (as in passport)" style="width:100%"></td>'
      +'<td><input data-pk="passport" value="'+esc(p.passport)+'" placeholder="Passport no" style="width:140px"></td></tr>';
  }).join('');
  var sub=f.fare*draft.pax.length, tax=f.taxes*draft.pax.length, addo=addonTotal(draft.addons), grand=sub+tax+addo;
  var cat=svcCatalog();
  var addRows=(draft.addons||[]).map(function(a,i){return '<div class="tvf-addon-row"><span>'+esc(a.name)+' × '+(a.qty||1)+'</span><span class="mono">'+money((a.price||0)*(a.qty||1))+'</span><button class="tvf-op" title="Remove" onclick="tvfDelSvc('+i+')">✕</button></div>';}).join('')||'<div style="font-size:12px;color:var(--text3);padding:4px 0">No add-on services yet.</div>';
  r.innerHTML=''
   +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><button class="erp-btn btn-ghost" onclick="tvfBackResults()">← Back to results</button></div>'
   +'<div class="tvf-card tvf-pad"><div class="tvf-h">✈️ Itinerary</div>'
     +'<div class="tvf-itin"><span class="tvf-code">'+esc(f.code)+'</span><strong>'+esc(f.airline)+'</strong> '+esc(f.flightNo)
     +' &nbsp;·&nbsp; '+esc(q.from)+' '+esc(f.dep)+' → '+esc(q.to)+' '+esc(f.arr)+' &nbsp;·&nbsp; '+esc(f.dur)+' &nbsp;·&nbsp; '+esc(q.cabin)
     +' &nbsp;·&nbsp; '+(f.refundable?'Refundable':'Non-refundable')+' &nbsp;·&nbsp; 🧳 '+esc(f.baggage)+'</div></div>'
   +'<div class="tvf-card tvf-pad"><div class="tvf-h">👥 Passengers ('+draft.pax.length+')</div>'
     +'<table class="tvf-tbl"><thead><tr><th>#</th><th>Type</th><th>Name</th><th>Passport</th></tr></thead><tbody>'+paxRows+'</tbody></table></div>'
   +'<div class="tvf-card tvf-pad"><div class="tvf-h">➕ Add-on Services <span style="font-size:11px;color:var(--text3);font-weight:500">— other services on this invoice (passport, hotel, insurance…)</span></div>'
     +'<div class="tvf-addons">'+addRows+'</div>'
     +'<div class="tvf-addon-add"><select id="tvf-svc">'+cat.map(function(s){return '<option value="'+esc(s.id)+'">'+esc(s.name)+' — '+money(s.price)+'</option>';}).join('')+'</select>'
       +'<input id="tvf-svc-qty" type="number" min="1" value="1" style="width:70px">'
       +'<button class="erp-btn btn-sm btn-ghost" onclick="tvfAddSvc()">＋ Add service</button>'
       +'<span style="font-size:11px;color:var(--text3);margin-left:auto;align-self:center">Manage catalog in “Other Services”</span></div></div>'
   +'<div class="tvf-two">'
     +'<div class="tvf-card tvf-pad"><div class="tvf-h">📇 Contact &amp; Vendor</div><div class="tvf-sgrid2">'
       +'<div class="tvf-f"><label>Customer</label><input id="tvf-cust" value="'+esc(draft.customer)+'" placeholder="Customer / company"></div>'
       +'<div class="tvf-f"><label>Phone</label><input id="tvf-phone" value="'+esc(draft.phone)+'" placeholder="+8801..."></div>'
       +'<div class="tvf-f"><label>Email</label><input id="tvf-email" value="'+esc(draft.email)+'" placeholder="email@example.com"></div>'
       +'<div class="tvf-f"><label>Hold / Issue</label><select id="tvf-mode"><option value="Hold">Hold (PNR only)</option><option value="Confirmed">Issue now</option></select></div>'
     +'</div></div>'
     +'<div class="tvf-card tvf-pad"><div class="tvf-h">🧮 Fare Summary</div>'
       +'<div class="tvf-sumrow"><span>Base fare × '+draft.pax.length+'</span><span>'+money(sub)+'</span></div>'
       +'<div class="tvf-sumrow"><span>Taxes & surcharge</span><span>'+money(tax)+'</span></div>'
       +'<div class="tvf-sumrow"><span>Add-on services</span><span>'+money(addo)+'</span></div>'
       +'<div class="tvf-sumrow tot"><span>Total Payable</span><span>'+money(grand)+'</span></div>'
       +'<button class="erp-btn btn-primary" style="width:100%;margin-top:12px" onclick="tvfConfirm()">✅ Create Booking</button></div>'
   +'</div>';
}

/* ---------- BOOKINGS LIST ---------- */
function bookingsView(r){
  var rows=BOOKINGS.map(function(b){
    var sub=b.fare*b.pax.length, grand=sub+b.taxes*b.pax.length+addonTotal(b.addons);
    return '<tr>'
      +'<td class="mono">'+esc(b.id)+'</td><td class="mono"><strong>'+esc(b.pnr)+'</strong></td>'
      +'<td><strong>'+esc(b.customer||'—')+'</strong><div style="font-size:11px;color:var(--text3)">'+esc(b.pax.length)+' pax</div></td>'
      +'<td>'+esc(b.code)+' '+esc(b.airline)+'<div style="font-size:11px;color:var(--text3)">'+esc(b.from)+'→'+esc(b.to)+' · '+esc(b.dep)+'</div></td>'
      +'<td>'+money(grand)+'</td>'
      +'<td><span class="tvf-pill" style="background:'+(BST[b.bookingStatus]||'#94a3b8')+'">'+esc(b.bookingStatus)+'</span></td>'
      +'<td><span class="tvf-pill" style="background:'+(TST[b.ticketStatus]||'#94a3b8')+'">'+esc(b.ticketStatus)+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +'<button class="tvf-op" title="Issue" onclick="tvfOp(\''+b.id+'\',\'issue\')">🎫</button>'
        +'<button class="tvf-op" title="Re-issue" onclick="tvfOp(\''+b.id+'\',\'reissue\')">🔁</button>'
        +'<button class="tvf-op" title="Refund" onclick="tvfOp(\''+b.id+'\',\'refund\')">↩️</button>'
        +'<button class="tvf-op" title="Void" onclick="tvfOp(\''+b.id+'\',\'void\')">🚫</button>'
        +'<button class="tvf-op" title="EMD / Ancillary" onclick="tvfOp(\''+b.id+'\',\'emd\')">➕</button>'
        +'<button class="tvf-op" title="History" onclick="tvfHistory(\''+b.id+'\')">🕑</button>'
      +'</td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:30px;font-style:italic">No bookings yet. Search & book a flight.</td></tr>';
  r.innerHTML=''
   +'<div class="tvf-bar"><button class="erp-btn btn-ghost" onclick="tvfGoSearch()">← Search Flights</button>'
     +'<div class="tvf-kpis2"><span>Bookings: <b>'+BOOKINGS.length+'</b></span>'
     +'<span>Issued: <b>'+BOOKINGS.filter(function(b){return b.ticketStatus==='Issued';}).length+'</b></span></div></div>'
   +'<div class="tvf-card"><table class="tvf-tbl"><thead><tr><th>Invoice</th><th>PNR</th><th>Customer</th><th>Airline / Route</th><th>Total</th><th>Booking</th><th>Ticket</th><th style="text-align:right">Operations</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
   +'<div id="tvf-hist"></div>';
}

/* ---------- handlers ---------- */
window.tvfSearch=function(){
  var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  query={from:g('tvf-from'),to:g('tvf-to'),depart:g('tvf-dep'),ret:g('tvf-ret'),pax:Math.max(1,+g('tvf-pax')||1),cabin:g('tvf-cabin'),trip:g('tvf-trip')};
  if(query.from===query.to){alert('Origin and destination must differ.');return;}
  results=genResults(query);
  var rc=document.getElementById('tvf-results'); if(rc) rc.innerHTML=resultsHtml();
};
window.tvfBook=function(i){var f=results[i];
  draft={flight:f,query:query,customer:'',phone:'',email:'',pax:[],addons:[]};
  for(var p=0;p<query.pax;p++) draft.pax.push({type:p===0?'Adult':'Adult',name:'',passport:''});
  view='book'; render();
};
window.tvfBackResults=function(){view='search';render();};
window.tvfAddSvc=function(){syncBook();var sel=document.getElementById('tvf-svc');var qe=document.getElementById('tvf-svc-qty');var qty=Math.max(1,+(qe&&qe.value)||1);if(!sel)return;var cat=svcCatalog();var s=cat.find(function(x){return x.id===sel.value;});if(!s)return;draft.addons.push({name:s.name,price:+s.price||0,qty:qty});render();};
window.tvfDelSvc=function(i){syncBook();draft.addons.splice(i,1);render();};
window.tvfGoBookings=function(){view='bookings';render();};
window.tvfGoSearch=function(){view='search';render();};
function syncBook(){var r=root();
  r.querySelectorAll('tr [data-pk]').forEach(function(el){var tr=el.closest('tr');var idx=Array.prototype.indexOf.call(tr.parentNode.children,tr);if(draft.pax[idx])draft.pax[idx][el.getAttribute('data-pk')]=el.value;});
  var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  draft.customer=g('tvf-cust');draft.phone=g('tvf-phone');draft.email=g('tvf-email');draft.mode=g('tvf-mode');
}
window.tvfConfirm=function(){ syncBook();
  if(!draft.customer.trim()){alert('Customer name is required.');return;}
  if(!draft.pax[0].name.trim()){alert('At least the first passenger name is required.');return;}
  var f=draft.flight,q=draft.query;
  var issue=draft.mode==='Confirmed';
  var b={id:'TS-'+String(Date.now()).slice(-5),pnr:pnr(),customer:draft.customer,phone:draft.phone,email:draft.email,
    airline:f.airline,code:f.code,flightNo:f.flightNo,from:q.from,to:q.to,dep:f.dep,arr:f.arr,dur:f.dur,cabin:q.cabin,
    fare:f.fare,taxes:f.taxes,refundable:f.refundable,pax:draft.pax,addons:draft.addons||[],
    bookingStatus:issue?'Confirmed':'Hold',ticketStatus:issue?'Issued':'Unissued',history:[]};
  b.history=[{at:stamp(),text:'Booking created (PNR '+b.pnr+').'}];
  if((b.addons||[]).length) b.history.push({at:stamp(),text:'Add-on services: '+b.addons.map(function(a){return a.name+' ×'+(a.qty||1);}).join(', ')+' ('+money(addonTotal(b.addons))+').'});
  if(issue){ b.pax.forEach(function(p){p.tkt=tktNo();}); b.history.push({at:stamp(),text:'Ticket issued.'}); }
  BOOKINGS.unshift(b); save();
  alert('✅ Booking created\nPNR: '+b.pnr+'\nInvoice: '+b.id+(issue?'\nTickets issued.':'\nHeld (not yet issued).'));
  view='bookings'; render();
};
window.tvfOp=function(id,kind){var b=BOOKINGS.find(function(x){return x.id===id;});if(!b)return;
  if(kind==='issue'){ if(b.ticketStatus==='Issued'){alert('Already issued.');return;} b.ticketStatus='Issued';b.bookingStatus='Confirmed';b.pax.forEach(function(p){if(!p.tkt)p.tkt=tktNo();});log(b,'Ticket issued.'); }
  else if(kind==='reissue'){var d=prompt('Re-issue fare difference (৳):','0');if(d===null)return;b.bookingStatus='Re-issued';b.taxes=(+b.taxes||0)+(+d||0);log(b,'Re-issued. Fare difference ৳'+(+d||0)+'.');}
  else if(kind==='refund'){if(!b.refundable && !confirm('This fare is marked Non-refundable. Continue with refund anyway?'))return;var rfd=prompt('Refund amount to customer (৳):','0');if(rfd===null)return;b.bookingStatus='Refunded';b.ticketStatus='Refunded';log(b,'Refunded ৳'+(+rfd||0)+' to customer.');}
  else if(kind==='void'){if(!confirm('Void this ticket? (BSP: same-day only)'))return;b.bookingStatus='Voided';b.ticketStatus='Void';log(b,'Ticket voided.');}
  else if(kind==='emd'){var ds=prompt('EMD / ancillary (e.g. extra baggage, seat):');if(!ds)return;var amt=prompt('Amount (৳):','0');b.taxes=(+b.taxes||0)+(+amt||0);log(b,'EMD added: '+ds+' (৳'+(+amt||0)+').');}
  save(); render();
};
window.tvfHistory=function(id){var b=BOOKINGS.find(function(x){return x.id===id;});if(!b)return;
  var h=document.getElementById('tvf-hist'); if(!h)return;
  h.innerHTML='<div class="tvf-card tvf-pad" style="margin-top:16px"><div class="tvf-h">🕑 History — '+esc(b.id)+' / PNR '+esc(b.pnr)+'</div>'
    +(b.history||[]).map(function(t){return '<div class="tvf-tl"><span class="tvf-dot"></span><b>'+esc(t.at)+'</b> &nbsp;'+esc(t.text)+'</div>';}).join('')
    +'<div style="margin-top:8px"><strong>Passengers & tickets:</strong>'+b.pax.map(function(p){return '<div style="font-size:12.5px;color:var(--text2)">• '+esc(p.name||'—')+' ('+esc(p.type)+')'+(p.tkt?' · '+esc(p.tkt):'')+'</div>';}).join('')+'</div></div>';
  h.scrollIntoView({behavior:'smooth',block:'nearest'});
};
function log(b,text){(b.history=b.history||[]).push({at:stamp(),text:text});}

function injectCss(){ if(document.getElementById('tvf-css'))return; var s=document.createElement('style'); s.id='tvf-css'; var P='#erp-panel-tv-flight ';
  s.textContent=''
  +P+'.tvf-bar{display:flex;align-items:center;gap:12px;margin-bottom:14px}'
  +P+'.tvf-badge{background:var(--accent);color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;margin-left:5px}'
  +P+'.tvf-kpis2{margin-left:auto;display:flex;gap:16px;font-size:13px;color:var(--text2)}'
  +P+'.tvf-search{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:16px;margin-bottom:16px}'
  +P+'.tvf-sgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;align-items:end}'
  +P+'.tvf-sgrid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
  +P+'.tvf-f label{display:block;font-size:11.5px;color:var(--text2);margin-bottom:5px;font-weight:600}'
  +P+'.tvf-f input,'+P+'.tvf-f select,'+P+'.tvf-tbl input,'+P+'.tvf-tbl select{width:100%;box-sizing:border-box;border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tvf-hint{background:var(--bg2);border:1px dashed var(--border2,#d0d6e8);border-radius:12px;padding:28px;text-align:center;color:var(--text3);font-size:13.5px}'
  +P+'.tvf-rhead{font-size:12.5px;color:var(--text2);margin-bottom:10px;font-weight:600}'
  +P+'.tvf-flight{display:grid;grid-template-columns:1.6fr .8fr 1fr .8fr 1.4fr;gap:12px;align-items:center;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:11px;box-shadow:var(--shadow)}'
  +P+'.tvf-air{display:flex;align-items:center;gap:10px}'
  +P+'.tvf-code{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-weight:800;font-size:12px;padding:0 6px}'
  +P+'.tvf-aname{font-size:13.5px;font-weight:700}'+P+'.tvf-fno{font-size:11px;color:var(--text3)}'
  +P+'.tvf-t{font-size:16px;font-weight:700}'+P+'.tvf-ap{font-size:11px;color:var(--text3)}'
  +P+'.tvf-mid{text-align:center}'+P+'.tvf-dur{font-size:11px;color:var(--text2)}'
  +P+'.tvf-line{height:2px;background:var(--border2,#d0d6e8);position:relative;margin:5px 0}'+P+'.tvf-line span{position:absolute;right:0;top:-3px;width:7px;height:7px;border-radius:50%;background:var(--accent)}'
  +P+'.tvf-stops{font-size:10.5px;color:var(--green,#16a34a);font-weight:600}'
  +P+'.tvf-fare{text-align:right}'+P+'.tvf-price{font-size:17px;font-weight:800;color:var(--text)}'+P+'.tvf-pp{font-size:10.5px;color:var(--text3);margin:2px 0 7px}'
  +P+'.tvf-ref.ok{color:#16a34a;font-weight:700}'+P+'.tvf-ref.no{color:#dc2626;font-weight:700}'
  +P+'.tvf-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.tvf-pad{padding:15px 17px}'+P+'.tvf-h{font-size:13.5px;font-weight:700;margin-bottom:11px;display:flex;align-items:center;gap:8px}'
  +P+'.tvf-itin{font-size:13px;color:var(--text);display:flex;align-items:center;gap:6px;flex-wrap:wrap}'
  +P+'.tvf-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}'
  +'@media(max-width:900px){'+P+'.tvf-two{grid-template-columns:1fr}'+P+'.tvf-flight{grid-template-columns:1fr 1fr}}'
  +P+'.tvf-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tvf-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.tvf-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tvf-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tvf-op{border:0;background:none;cursor:pointer;font-size:14px;padding:3px 5px;border-radius:6px}'+P+'.tvf-op:hover{background:var(--bg3)}'
  +P+'.tvf-sumrow{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--border);font-size:13px}'
  +P+'.tvf-sumrow.tot{font-weight:700;font-size:15px;border-bottom:none;border-top:2px solid var(--border);margin-top:6px;padding-top:10px}'
  +P+'.tvf-tl{display:flex;align-items:center;gap:9px;padding:5px 0;font-size:12.5px}'
  +P+'.tvf-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0}'
  +P+'.tvf-addons{margin-bottom:10px}'
  +P+'.tvf-addon-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dashed var(--border);font-size:13px}'
  +P+'.tvf-addon-row span:first-child{flex:1}'
  +P+'.tvf-addon-add{display:flex;gap:9px;flex-wrap:wrap;margin-top:8px}'
  +P+'.tvf-addon-add select,'+P+'.tvf-addon-add input{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.tvf-addon-add select{min-width:240px}';
  document.head.appendChild(s);
}
function boot(){ var r=root(); if(r){render();} else {document.addEventListener('DOMContentLoaded',render);} }
boot();
})();
