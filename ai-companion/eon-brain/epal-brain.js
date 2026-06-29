/* ════════════════════════════════════════════════════════════════════
   EON Brain — EPAL ERP edition.
   The Firebase brain (eon-brain.js) needs Firestore, which the EPAL ERP
   doesn't have. This drop-in reads ALL the ERP's data instead — every
   `epal_*` localStorage store (travel features, tasks, etc.) PLUS the
   on-screen ERP tables (employees, vendors, original travel, CRM…) — and
   exposes the same window.EonBrain API the companion consumes.
   Works on demo data, no backend. Load as a plain script before EON.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if (window.EonBrain) return;

var DL_HINTS=['deadline','duedate','due','expiry','expire','expires','valid','validtill','valid_till','travel','traveldate','travel_date','ttl','appointment','remindat','remind_at','date','checkin','dueDate'];
var LBL_HINTS=['name','title','label','customer','applicant','party','source','pnr','route','vendor','airline','subject','reference','ref'];
var SKIP=['epalRole','epalDept','epal_eon_brain','epal_eon_reminders','epalTheme','epal_eon_state'];
var RM='epal_eon_reminders';

function norm(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,'');}
function pretty(k){return String(k).replace(/^epal[_-]?(tv[_-]?)?/i,'').replace(/[_-]+/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}).trim()||k;}
function toIso(v){ if(v==null||v==='')return null; if(typeof v!=='string')return null;
  if(!/\d{4}-\d{2}-\d{2}/.test(v)&&!/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v))return null;
  var t=Date.parse(v); return isNaN(t)?null:new Date(t).toISOString(); }
function firstStr(o){for(var k in o){if(typeof o[k]==='string'&&o[k].trim())return o[k];}return '';}

/* ---- collect every epal_* localStorage store ---- */
function collectLocal(data){
  for(var i=0;i<localStorage.length;i++){
    var key=localStorage.key(i);
    if(!/^epal/i.test(key)||SKIP.indexOf(key)>=0) continue;
    var val; try{val=JSON.parse(localStorage.getItem(key));}catch(e){continue;}
    if(Array.isArray(val)){ if(val.length&&typeof val[0]==='object') data[pretty(key)]=val; }
    else if(val&&typeof val==='object'){
      for(var p in val){ if(Array.isArray(val[p])&&val[p].length&&typeof val[p][0]==='object') data[pretty(key)+' · '+p]=val[p]; }
    }
  }
}
/* ---- scrape on-screen ERP tables NOT backed by our localStorage (.tvx) ---- */
function collectDOM(data){
  try{
    var tables=document.querySelectorAll('#erp-screen .erp-content table');
    var n=0;
    tables.forEach(function(tb){
      if(n>40) return;                              // cap total scraped tables
      if(tb.closest('.tvx')) return;                // skip our feature tables (already in localStorage)
      var ths=tb.querySelectorAll('thead th'); if(ths.length<2) return;
      var heads=Array.prototype.map.call(ths,function(th){return th.textContent.trim()||('c'+Math.random());});
      var trs=tb.querySelectorAll('tbody tr'); if(trs.length<1) return;
      var panel=tb.closest('.erp-panel'); var title=panel?(panel.querySelector('.tv-page-title,.page-title,h2')||{}).textContent:'';
      var ent='Screen · '+((title||'Table').trim().slice(0,28));
      var recs=[];
      Array.prototype.slice.call(trs,0,30).forEach(function(tr){
        var tds=tr.querySelectorAll('td'); if(!tds.length||tr.querySelector('.empty')) return;
        var o={}; Array.prototype.forEach.call(tds,function(td,idx){ if(heads[idx]) o[heads[idx]]=td.textContent.trim().replace(/\s+/g,' '); });
        if(Object.keys(o).length) recs.push(o);
      });
      if(recs.length){ data[ent]=(data[ent]||[]).concat(recs); n++; }
    });
  }catch(e){}
}

/* ---- build flat records with label + deadline per entity ---- */
function deadlineField(rows){
  var fields=Object.keys(rows[0]||{});
  var best=null,bestHits=0;
  fields.forEach(function(f){
    var nf=norm(f); var isName=DL_HINTS.some(function(h){return nf.indexOf(norm(h))>=0;});
    var hits=0; rows.slice(0,30).forEach(function(r){ if(toIso(r[f]))hits++; });
    if((isName&&hits>0)&&hits>bestHits){best=f;bestHits=hits;}
  });
  return best;
}
function labelField(rows){
  var fields=Object.keys(rows[0]||{});
  for(var i=0;i<LBL_HINTS.length;i++){ var f=fields.find(function(x){return norm(x)===norm(LBL_HINTS[i]);}); if(f)return f; }
  for(var j=0;j<LBL_HINTS.length;j++){ var g=fields.find(function(x){return norm(x).indexOf(norm(LBL_HINTS[j]))>=0;}); if(g)return g; }
  return fields[0];
}
function build(data){
  var records=[];
  Object.keys(data).forEach(function(ent){
    var rows=data[ent]; if(!Array.isArray(rows)||!rows.length)return;
    var df=deadlineField(rows), lf=labelField(rows);
    rows.forEach(function(r,idx){
      if(!r||typeof r!=='object')return;
      records.push({entity:ent, id:r.id||r.pnr||(ent+'-'+idx), label:String(r[lf]!=null?r[lf]:firstStr(r)||(ent+' #'+(idx+1))), deadlineAt:df?toIso(r[df]):null, payload:r});
    });
  });
  return records;
}

/* ---- cache ---- */
var CACHE={data:{},records:[],ts:0};
function refresh(){ var data={}; collectLocal(data); collectDOM(data); CACHE={data:data,records:build(data),ts:Date.now()}; return CACHE; }
function ensure(){ if(Date.now()-CACHE.ts>15000||!CACHE.records.length) refresh(); }

/* ---- reminders ---- */
function rmLoad(){try{return JSON.parse(localStorage.getItem(RM))||[];}catch(e){return [];}}
function rmSave(a){try{localStorage.setItem(RM,JSON.stringify(a));}catch(e){}}

/* ---- alerts: upcoming/overdue deadlines + due reminders ---- */
function alerts(){
  ensure(); var now=Date.now(), out=[];
  CACHE.records.forEach(function(r){
    if(!r.deadlineAt)return; var t=Date.parse(r.deadlineAt); if(isNaN(t))return;
    var d=Math.floor((t-now)/86400000);
    if(d<=30) out.push({label:r.label,entity:r.entity,deadlineAt:r.deadlineAt,days:d,when:(d<0?Math.abs(d)+'d overdue':d===0?'today':d+'d')});
  });
  rmLoad().forEach(function(rm){ if(rm.dismissed)return; var t=Date.parse(rm.snoozedTo||rm.remindAt); if(isNaN(t))return;
    var d=Math.floor((t-now)/86400000); if(d<=7) out.push({label:'⏰ '+rm.title,entity:'reminder',deadlineAt:rm.remindAt,days:d,when:(d<0?'due':d===0?'today':d+'d'),id:rm.id,reminder:true}); });
  return out.sort(function(a,b){return Date.parse(a.deadlineAt)-Date.parse(b.deadlineAt);});
}

/* ---- meditation lifecycle ---- */
var STATE={state:'idle',message:''}, T1=null, T2=null;
function setState(s,m){STATE={state:s,message:m||''};}
function meditate(){
  refresh(); var a=alerts(); var n=CACHE.records.length, ents=Object.keys(CACHE.data).length;
  clearTimeout(T1);clearTimeout(T2); setState('meditating');
  T1=setTimeout(function(){
    var msg = a.length ? ('Read '+n+' records across '+ents+' areas. Nearest: '+a[0].label+' — '+a[0].when+'.')
                       : ('Read '+n+' records across '+ents+' areas — nothing due soon. 🌿');
    setState('insight',msg);
    T2=setTimeout(function(){setState('idle');},90000);
  },1100);
  return Promise.resolve(a);
}

/* ---- public API (mirrors the Firebase brain) ---- */
window.EonBrain={
  start:function(){refresh();return Promise.resolve();},
  isOwner:function(){ return true; },                 // demo: EON always sees the data
  ensureData:function(){ensure();return Promise.resolve();},
  getData:function(){ensure();return CACHE.data;},
  getRecords:function(){ensure();return CACHE.records;},
  getAlerts:function(){return alerts();},
  getState:function(){return STATE;},
  status:function(){ensure();return {learned:CACHE.records.length,entities:Object.keys(CACHE.data).length};},
  meditate:meditate,
  createReminder:function(o){var a=rmLoad();var r={id:'R'+Date.now().toString(36),title:(o&&o.title)||'Reminder',remindAt:(o&&o.remindAt)||new Date(Date.now()+864e5).toISOString(),link:(o&&o.link)||'',seen:false,dismissed:false};a.push(r);rmSave(a);return r;},
  snooze:function(id,min){var a=rmLoad();var r=a.find(function(x){return x.id===id;});if(r){r.snoozedTo=new Date(Date.now()+(min||30)*60000).toISOString();rmSave(a);}return r;},
  dismiss:function(id){var a=rmLoad();var r=a.find(function(x){return x.id===id;});if(r){r.dismissed=true;rmSave(a);}return r;},
  markSeen:function(id){var a=rmLoad();var r=a.find(function(x){return x.id===id;});if(r){r.seen=true;rmSave(a);}return r;},
  refresh:refresh
};
// initial read (and again once the page has settled / panels rendered)
refresh();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',refresh);
setTimeout(refresh,2500);
console.info('%c[EON brain] EPAL edition ready —','color:#7ed957;font-weight:700', (window.EonBrain.status().learned)+' records across '+window.EonBrain.status().entities+' areas. Try EonBrain.getAlerts().');
})();
