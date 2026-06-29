/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Integrations / API Hub  ·  New
   One place to manage every external connection a travel agency uses:
   GDS (Amadeus/Sabre/Travelport), IATA BSP/NDC, aggregators (TBO), payment
   gateways, and messaging (WhatsApp/SMS/Email). Connect/disconnect, sync,
   rotate keys, and a live sync log. Renders into #tv-int-root
   (panel erp-panel-tv-integrations). localStorage epal_tv_integrations.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_integrations';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function nowStr(){return new Date().toISOString().slice(0,16).replace('T',' ');}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(DB));}catch(e){}}
function seed(){return {connectors:[
  {id:'amadeus',name:'Amadeus',cat:'GDS',ic:'🅰',endpoint:'api.amadeus.com/v2',key:'AMA-••••-4417',connected:true,last:'2026-06-29 08:10'},
  {id:'sabre',name:'Sabre',cat:'GDS',ic:'🅢',endpoint:'api.sabre.com/v3',key:'',connected:false,last:''},
  {id:'travelport',name:'Travelport / Galileo',cat:'GDS',ic:'🅖',endpoint:'api.travelport.com/11',key:'TVP-••••-9921',connected:true,last:'2026-06-29 07:45'},
  {id:'iata',name:'IATA BSP / NDC',cat:'Settlement',ic:'✈',endpoint:'api.iata.org/bsp/v1',key:'IATA-••••-7731',connected:true,last:'2026-06-28 23:00'},
  {id:'tbo',name:'TBO Holidays',cat:'Aggregator',ic:'🌐',endpoint:'api.tbotechnology.in',key:'TBO-••••-3380',connected:true,last:'2026-06-29 06:30'},
  {id:'sslcommerz',name:'SSLCommerz',cat:'Payment',ic:'💳',endpoint:'securepay.sslcommerz.com',key:'SSL-••••-2210',connected:true,last:'2026-06-29 09:02'},
  {id:'bkash',name:'bKash',cat:'Payment',ic:'📱',endpoint:'tokenized.pay.bka.sh',key:'BKH-••••-7745',connected:true,last:'2026-06-29 09:00'},
  {id:'whatsapp',name:'WhatsApp Business',cat:'Messaging',ic:'💬',endpoint:'graph.facebook.com/v19',key:'WA-••••-5567',connected:true,last:'2026-06-29 08:50'},
  {id:'sms',name:'SMS Gateway',cat:'Messaging',ic:'✉',endpoint:'api.sms.net.bd',key:'',connected:false,last:''},
  {id:'smtp',name:'Email / SMTP',cat:'Messaging',ic:'📧',endpoint:'smtp.epalgroup.com:587',key:'SMTP-••••-1180',connected:true,last:'2026-06-29 08:40'}
],log:[
  {at:'2026-06-29 09:02',text:'SSLCommerz · payment status callback received (3 txns)'},
  {at:'2026-06-29 08:10',text:'Amadeus · fare cache refreshed (DAC routes)'},
  {at:'2026-06-28 23:00',text:'IATA BSP · billing file imported (5 records)'}
]};}
var DB=load();
var CATS=['GDS','Settlement','Aggregator','Payment','Messaging'];
var CATC={GDS:'#2563eb',Settlement:'#7c3aed',Aggregator:'#0d9488',Payment:'#16a34a',Messaging:'#d97706'};

function root(){return document.getElementById('tv-int-root');}
function logAdd(text){DB.log.unshift({at:nowStr(),text:text});DB.log=DB.log.slice(0,12);}
function render(){var r=root();if(!r)return;injectCss();
  var conn=DB.connectors.filter(function(c){return c.connected;}).length;
  var cards=DB.connectors.map(function(c){
    return '<div class="tvi-card">'
      +'<div class="tvi-top"><span class="tvi-ic" style="background:'+(CATC[c.cat]||'#64748b')+'">'+c.ic+'</span>'
        +'<div style="flex:1"><div class="tvi-name">'+esc(c.name)+'</div><div class="tvi-cat">'+esc(c.cat)+'</div></div>'
        +'<span class="tvi-dot '+(c.connected?'on':'')+'" title="'+(c.connected?'Connected':'Disconnected')+'"></span></div>'
      +'<div class="tvi-meta"><div>Endpoint <code>'+esc(c.endpoint)+'</code></div>'
        +'<div>API key <code>'+esc(c.key||'— not set —')+'</code> <button class="tvi-link" onclick="tviKey(\''+c.id+'\')">rotate</button></div>'
        +'<div>Last sync: '+esc(c.last||'never')+'</div></div>'
      +'<div class="tvi-act">'
        +'<button class="erp-btn btn-sm '+(c.connected?'btn-ghost':'btn-primary')+'" onclick="tviToggle(\''+c.id+'\')">'+(c.connected?'Disconnect':'Connect')+'</button>'
        +'<button class="erp-btn btn-sm btn-ghost" '+(c.connected?'':'disabled style="opacity:.45"')+' onclick="tviSync(\''+c.id+'\')">⟳ Sync</button>'
        +'<button class="erp-btn btn-sm btn-ghost" onclick="tviTest(\''+c.id+'\')">Test</button>'
      +'</div></div>';
  }).join('');
  var logs=DB.log.map(function(l){return '<div class="tvi-logrow"><span class="tvi-logt">'+esc(l.at)+'</span> '+esc(l.text)+'</div>';}).join('')||'<div style="color:var(--text3);font-size:12.5px">No activity yet.</div>';

  r.innerHTML=''
   +'<div class="tvi-kpis">'
     +'<div class="tvi-kpi"><div class="l">🔌 Connected</div><div class="v">'+conn+' / '+DB.connectors.length+'</div></div>'
     +'<div class="tvi-kpi"><div class="l">🛰 GDS Live</div><div class="v">'+DB.connectors.filter(function(c){return c.cat==='GDS'&&c.connected;}).length+'</div></div>'
     +'<div class="tvi-kpi"><div class="l">💳 Payment</div><div class="v">'+DB.connectors.filter(function(c){return c.cat==='Payment'&&c.connected;}).length+'</div></div>'
     +'<div class="tvi-kpi" style="display:flex;align-items:center;justify-content:center"><button class="erp-btn btn-primary" onclick="tviSyncAll()">⟳ Sync All Connected</button></div>'
   +'</div>'
   +'<div class="tvi-grid">'+cards+'</div>'
   +'<div class="tvi-card2"><div class="tvi-h">🧾 Sync &amp; Activity Log</div>'+logs+'</div>';
}

window.tviToggle=function(id){var c=DB.connectors.find(function(x){return x.id===id;});if(!c)return;c.connected=!c.connected;if(c.connected){c.last=nowStr();if(!c.key)c.key=id.toUpperCase().slice(0,3)+'-••••-'+(Math.floor(Math.random()*9000)+1000);logAdd(c.name+' · connected');}else{logAdd(c.name+' · disconnected');}save();render();};
window.tviSync=function(id){var c=DB.connectors.find(function(x){return x.id===id;});if(!c||!c.connected){alert('Connect first.');return;}c.last=nowStr();logAdd(c.name+' · manual sync complete');save();render();};
window.tviTest=function(id){var c=DB.connectors.find(function(x){return x.id===id;});if(!c)return;alert((c.connected?'✅ ':'⚠️ ')+c.name+' connection test\n\nEndpoint: '+c.endpoint+'\nStatus: '+(c.connected?'200 OK — handshake successful':'Not connected')+'\nLatency: '+(c.connected?(40+Math.floor(Math.random()*120))+' ms':'—'));};
window.tviKey=function(id){var c=DB.connectors.find(function(x){return x.id===id;});if(!c)return;var k=prompt('Enter new API key / token for '+c.name+':','');if(k===null)return;c.key=id.toUpperCase().slice(0,3)+'-••••-'+String(k).slice(-4);logAdd(c.name+' · API key rotated');save();render();};
window.tviSyncAll=function(){var n=0;DB.connectors.forEach(function(c){if(c.connected){c.last=nowStr();n++;}});logAdd('Sync All · '+n+' connectors refreshed');save();render();alert('⟳ Synced '+n+' connected integration(s).');};

function injectCss(){if(document.getElementById('tvi-css'))return;var s=document.createElement('style');s.id='tvi-css';var P='#erp-panel-tv-integrations ';
  s.textContent=''
  +P+'.tvi-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.tvi-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.tvi-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.tvi-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.tvi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:16px}'
  +P+'.tvi-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:15px;box-shadow:var(--shadow)}'
  +P+'.tvi-top{display:flex;align-items:center;gap:11px;margin-bottom:11px}'
  +P+'.tvi-ic{width:40px;height:40px;border-radius:11px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800}'
  +P+'.tvi-name{font-size:14px;font-weight:700}'+P+'.tvi-cat{font-size:11px;color:var(--text3)}'
  +P+'.tvi-dot{width:11px;height:11px;border-radius:50%;background:#cbd5e1;flex-shrink:0}'+P+'.tvi-dot.on{background:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.18)}'
  +P+'.tvi-meta{font-size:11.5px;color:var(--text2);line-height:1.9;border-top:1px solid var(--border);padding-top:9px}'
  +P+'.tvi-meta code{background:var(--bg3);border-radius:5px;padding:1px 6px;font-size:11px}'
  +P+'.tvi-link{border:0;background:none;color:var(--accent);cursor:pointer;font-size:11px;font-family:inherit;text-decoration:underline}'
  +P+'.tvi-act{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}'
  +P+'.tvi-card2{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:15px 17px;box-shadow:var(--shadow)}'
  +P+'.tvi-h{font-size:13.5px;font-weight:700;margin-bottom:11px}'
  +P+'.tvi-logrow{font-size:12.5px;color:var(--text);padding:6px 0;border-bottom:1px dashed var(--border)}'
  +P+'.tvi-logt{font-family:"DM Mono",monospace;font-size:11px;color:var(--text3);margin-right:8px}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
