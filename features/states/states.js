/* ════════════════════════════════════════════════════════════════════
   FEATURE: States (State / Province master)  ·  New
   Self-contained module. Registers a full CRUD resource through
   window.TravelPortal — gets the generic table engine (search, status
   filter, add/edit/delete modal) for free. Used by passport, visa and
   address records. Persists to localStorage (epal_tr_states).
   Shows a "New" badge in the sidebar AND on the page heading.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[States] TravelPortal not found — feature not loaded'); return; }
const COUNTRIES=TP.pools.COUNTRIES;

const schema={
  label:'States', icon:'🗺', idPrefix:'ST',
  title:'States', sub:'State / province master — for passports, visas & addresses',
  nw:true,                                   // → "New" badge on the page heading
  search:['name','country','code','zone'],
  statusKey:'status', statusOpts:['Active','Inactive'],
  badgeMaps:{status:{Active:'ok',Inactive:'muted'}},
  columns:[
    {k:'name',t:'State / Province',strong:true},
    {k:'country',t:'Country'},
    {k:'code',t:'Code',mono:true},
    {k:'zone',t:'Zone / Region'},
    {k:'status',t:'Status',badge:'status'}
  ],
  fields:[
    {k:'name',t:'State / Province Name',type:'text',req:true,full:true},
    {k:'country',t:'Country',type:'select',opts:COUNTRIES,req:true},
    {k:'code',t:'Code',type:'text'},
    {k:'zone',t:'Zone / Region',type:'text'},
    {k:'status',t:'Status',type:'select',opts:['Active','Inactive']}
  ],
  seed:[
    {id:'ST-1',name:'Dhaka',country:'Bangladesh',code:'BD-13',zone:'Central',status:'Active'},
    {id:'ST-2',name:'Chattogram',country:'Bangladesh',code:'BD-10',zone:'South-East',status:'Active'},
    {id:'ST-3',name:'Sylhet',country:'Bangladesh',code:'BD-60',zone:'North-East',status:'Active'},
    {id:'ST-4',name:'Khulna',country:'Bangladesh',code:'BD-40',zone:'South-West',status:'Active'},
    {id:'ST-5',name:'Rajshahi',country:'Bangladesh',code:'BD-50',zone:'North-West',status:'Active'},
    {id:'ST-6',name:'Dubai',country:'UAE',code:'AE-DU',zone:'Gulf',status:'Active'},
    {id:'ST-7',name:'Makkah',country:'Saudi Arabia',code:'SA-02',zone:'Hejaz',status:'Active'},
    {id:'ST-8',name:'Madinah',country:'Saudi Arabia',code:'SA-03',zone:'Hejaz',status:'Active'},
    {id:'ST-9',name:'Selangor',country:'Malaysia',code:'MY-10',zone:'West',status:'Inactive'}
  ]
};

TP.onReady(()=>{
  // group with a New badge, then attach the States resource (also flagged New)
  TP.addGroup({grp:'master-data',label:'Master Data',ic:'🗂',section:'Master Data',nw:true});
  TP.registerResource('states',schema,{group:'master-data',ic:'🗺',nw:true});
});
})();
