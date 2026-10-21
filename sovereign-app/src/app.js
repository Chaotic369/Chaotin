import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-sans/latin-ext-400.css';
import '@fontsource/dm-sans/latin-ext-500.css';
import '@fontsource/dm-sans/latin-ext-600.css';
import '@fontsource/dm-sans/latin-ext-700.css';
import {initializeApp} from "firebase/app";
import {getDatabase,ref,set,get} from "firebase/database";
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {App as CapApp} from '@capacitor/app';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {StatusBar,Style} from '@capacitor/status-bar';
const NATIVE=Capacitor.isNativePlatform();

/* Firebase: same project, same record as the original app */
const firebaseConfig={apiKey:"AIzaSyD07C7OHAd4b4JSP9yPwx40pkCpd53yKrA",authDomain:"infinity-369.firebaseapp.com",projectId:"infinity-369",storageBucket:"infinity-369.firebasestorage.app",messagingSenderId:"1029653211647",appId:"1:1029653211647:web:4612a3e5f11b2739c01fca",databaseURL:"https://infinity-369-default-rtdb.firebaseio.com"};
const db=getDatabase(initializeApp(firebaseConfig)),PATH='operatives/raja_prime';

const $=id=>document.getElementById(id),clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const mins=t=>{const[a,b]=String(t).split(':').map(Number);return(a||0)*60+(b||0)};
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],R=n=>(n<0?'-₹':'₹')+Math.abs(n);
const fd=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'}),cap=s=>s?s[0]+s.slice(1).toLowerCase():'';
const mk=o=>({id:Date.now()+'',duration:25,time:null,category:null,priority:'normal',repeat:null,completed:false,failed:false,completedAt:null,createdAt:Date.now(),notes:'',...o});

const TL=[['07:00','System start: wake up [DISCIPLINE]'],['07:10','Maintenance: bath / brush [HEALTH]'],['07:30','Fuel: breakfast [HEALTH]'],['08:00','Neural compile: deep work [LOGIC]'],['11:00','Cache clear: stretch [HEALTH]'],['11:10','Fuel: mid-day nutrition [HEALTH]'],['12:10','Deployment: college [LOGIC]'],['17:20','Return to base [DISCIPLINE]'],['17:30','Fuel recharge: eat food [HEALTH]'],['18:00','Neural compile: study / code [LOGIC]'],['20:00','Fuel: evening nutrition [HEALTH]'],['20:30','Neural compile: final study block [MEMORY]'],['21:30','Physical protocol: exercise [STRENGTH]'],['22:10','Decompression: shower [HEALTH]'],['23:00','Night maintenance [DISCIPLINE]'],['23:30','Screen lock: read / plan [FOCUS]'],['00:00','Power down: sleep [HEALTH]']];
const DEFAULT={profile:{username:'OPERATIVE',avatarUrl:''},settings:{},tasks:[],budget:[],
timeline:[],workout_log:[],timeline_completed:{},timeline_completed_times:{},
exercises:[],
neural:{decks:[],subjects:[]},heatmap:{},global_streak:0,last_active_date:null,detox_streak:0,detox_last_checkin:null,taskSortMode:'time',taskFilter:'all',taskCatFilter:'',avoidance_log:[],fail_log:[],discipline_debt:0,debrief_log:[],morning_intentions:[],win_log:[],weekly_reviews:[],sleep_log:[]};

let S=clone(DEFAULT),synced=false,hist=[],tab='today',bTab='l',bm='m',tlOpen=false,dkT;
const arr=['tasks','budget','workout_log','exercises','timeline','win_log','morning_intentions','fail_log','avoidance_log','debrief_log','weekly_reviews','sleep_log','weight_log','checkins','missed_log'];
function fix(){const D=clone(DEFAULT);for(const k in D)if(S[k]==null)S[k]=D[k];S.profile={...D.profile,...S.profile};S.settings={...D.settings,...S.settings};
arr.forEach(k=>{if(!Array.isArray(S[k]))S[k]=Object.values(S[k]||{})});
for(const k in S.timeline_completed)if(!Array.isArray(S.timeline_completed[k]))S.timeline_completed[k]=Object.values(S.timeline_completed[k]||{});
S.timeline.sort((a,b)=>mins(a.time)-mins(b.time))}

/* Cloud sync: identical logic to the original (newest write wins) */
const dot=ok=>{$('sy').className='dot '+(ok?'ok':'off');$('sy').title=ok?'Synced':'Offline'};
/* Offline-first storage: every change is written to this device first, then pushed to Firebase whenever it is reachable */
const LK='sp_state_v1',DIRTY='sp_dirty_v1';
let syncing=false,pushing=false,boot=false,pushT,hadSynced=false;
const withTO=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
const isDirty=()=>{try{return localStorage.getItem(DIRTY)==='1'}catch(e){return false}};
const setDirty=v=>{try{v?localStorage.setItem(DIRTY,'1'):localStorage.removeItem(DIRTY)}catch(e){}};
function persist(){try{localStorage.setItem(LK,JSON.stringify(S))}catch(e){console.error('Local save failed',e)}}
function loadLocal(){try{const r=localStorage.getItem(LK);if(r){const o=JSON.parse(r);if(o&&typeof o==='object')S=o}}catch(e){}}
function save(){if(boot){persist();return}S.lastUpdated=Date.now();persist();setDirty(true);schedulePush();sch()}
function schedulePush(){clearTimeout(pushT);pushT=setTimeout(()=>push(),800)}
async function push(force){
if(pushing||(!synced&&!force))return false;
pushing=true;const snap=S.lastUpdated;let ok=false;
try{await withTO(set(ref(db,PATH),S),10000);if(S.lastUpdated===snap)setDirty(false);dot(1);ok=true}
catch(e){console.error('Firebase Sync Fail:',e);dot(0)}
finally{pushing=false}
if(ok&&isDirty())schedulePush();
return ok}
/* Newest write wins, except that unsent local changes always win and are pushed up */
async function sync(){
if(syncing)return;syncing=true;
try{
const s=await withTO(get(ref(db,PATH)),10000),dirty=isDirty(),first=!hadSynced;
if(s.exists()){
const c=s.val(),rl=c.lastUpdated||0,ll=S.lastUpdated||0;
if(!dirty&&rl>=ll){S=c;fix();persist();synced=true;hadSynced=true;streaks();chkMiss();dot(1);render();sch();if(rl>ll||first)toast('Synced')}
else{synced=true;hadSynced=true;const ok=await push(true);toast(ok?'Local changes pushed':'Offline: working locally')}
}else{synced=true;hadSynced=true;const ok=await push(true);toast(ok?'New cloud record created':'Offline: working locally')}
}catch(e){console.error('Sync Error:',e);dot(0);if(!hadSynced)toast('Offline: working locally')}
finally{syncing=false}}





function streaks(){const t=dk(new Date()),T=new Date(),b0=S.last_active_date+'|'+S.global_streak;T.setHours(0,0,0,0);
if(!S.last_active_date){S.last_active_date=t;S.global_streak=0}else if(S.last_active_date!==t){const L=new Date(S.last_active_date);L.setHours(0,0,0,0);const d=Math.round((T-L)/864e5);if(d===1)S.global_streak=(S.global_streak||0)+1;else if(d>1)S.global_streak=1;S.last_active_date=t}
if(b0!==S.last_active_date+'|'+S.global_streak)save();else persist()}

let tt;function toast(m){const e=$('to');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2200)}
const H=()=>{hist.push(JSON.stringify(S));if(hist.length>50)hist.shift()},commit=()=>{save();render()};

/* Time detection: ranges (8-10pm, 8pm-10pm), single times (8pm, 14:30), ambiguous ones ask AM/PM */
let tdis='';
function tparse(s){const P=(h,m,p)=>({h:+h,m:+(m||0),p:(p||'').toLowerCase()}),N=x=>((x.h%12)+(x.p==='pm'?12:0))*60+x.m,F=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'),O=x=>x.p==='am'?'pm':'am';
let m=s.match(/(?<![\d:])(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?(?![\d:])/i);
if(m){const a=P(m[1],m[2],m[3]),b=P(m[4],m[5],m[6]),ok=a.h<=23&&b.h<=23&&(!(a.p||b.p)||(a.h>=1&&a.h<=12&&b.h>=1&&b.h<=12));
if(ok){const r={text:m[0],i:m.index},c24=!a.p&&!b.p&&(a.h>12||b.h>12||m[1][0]==='0'||m[4][0]==='0');let s1,e1;
if(c24){s1=a.h*60+a.m;e1=b.h*60+b.m}
else{if(!a.p&&!b.p)return{...r,ask:true};
if(!b.p){b.p=a.p;if(N(b)<=N(a))b.p=O(a)}else if(!a.p){a.p=b.p;if(N(a)>=N(b))a.p=O(b)}
s1=N(a);e1=N(b)}
let d=e1-s1;if(d<=0)d+=1440;return{...r,ask:false,time:F(s1),dur:Math.min(d,1440)}}}
m=s.match(/(?<![\d:])(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/i);
if(m&&+m[1]>=1&&+m[1]<=12){const x=P(m[1],m[2],m[3]);return{text:m[0],i:m.index,ask:false,time:F(N(x))}}
m=s.match(/(?<![\d:])([01]?\d|2[0-3]):([0-5]\d)(?![\d:])/);
if(m)return{text:m[0],i:m.index,ask:false,time:F(+m[1]*60+ +m[2])};
m=s.match(/(?<![\d:#!.\w-])(\d{1,2})(?![\d:.]|\s*(?:xp|%|min|kg|[-–—]|to\b|am|pm))/i);
if(m&&+m[1]>=1&&+m[1]<=12)return{text:m[0],i:m.index,ask:true,bare:true};
return null}
function tui(){const el=$('ti');if(!el)return;const v=el.value,m=tparse(v),h=$('th'),p=$('tp');if(!m||!m.ask)tdis='';
const hm=m&&!(m.ask&&m.text===tdis)?m:null;
if(h){h.innerHTML=hm?esc(v.slice(0,hm.i))+'<mark>'+esc(hm.text)+'</mark>'+esc(v.slice(hm.i+hm.text.length)):esc(v);h.scrollLeft=el.scrollLeft}
if(p){const s=!!m&&m.ask&&m.text!==tdis;p.hidden=!s;if(s)p.innerHTML=`<span>${esc(m.text)} · ${m.bare?'is this a time?':'AM or PM?'}</span><button class="btn" data-a="tap" data-i="am">AM</button><button class="btn" data-a="tap" data-i="pm">PM</button><button class="ic" data-a="tano" aria-label="Not a time">✕</button>`}}

/* Tasks: same quick-add syntax as before */
function parse(raw){let t=raw,time=null,duration=25,category=null,priority='normal',repeat=null,m;
{const tm=tparse(t);if(tm&&!tm.ask){time=tm.time;if(tm.dur)duration=tm.dur;t=t.slice(0,tm.i)+t.slice(tm.i+tm.text.length)}}
if(m=t.match(/#([A-Za-z]+)/)){category=m[1].toUpperCase();t=t.replace(m[0],'')}
if(/!critical/i.test(t)){priority='critical';t=t.replace(/!critical/i,'')}else if(/!high/i.test(t)){priority='high';t=t.replace(/!high/i,'')}
if(m=t.match(/repeat:(daily|weekly)/i)){repeat=m[1].toLowerCase();t=t.replace(m[0],'')}
const title=t.replace(/\s+/g,' ').trim();return title?mk({title,time,duration,category,priority,repeat}):null}

/* Budget: same shorthand as before */
const catMap={v:'Vegetable',vegetable:'Vegetable',fr:'Fruit',fruit:'Fruit',f:'Fruit',m:'Milk',milk:'Milk',g:'Gas',gas:'Gas',ff:'Fast food','fast food':'Fast food',r:'Food ration','food ration':'Food ration',gt:'Given to','given to':'Given to',tf:'Taken from','taken from':'Taken from'};
function bal(){let t=0,o=0,c=0;S.budget.forEach(b=>{const v=b.category.toLowerCase()==='taken from'?b.amount:-b.amount;t+=v;b.mode==='Cash'?c+=v:o+=v});return{t,o,c}}
function ana(mode){const now=new Date(),g={};S.budget.filter(b=>b.category.toLowerCase()!=='taken from').forEach(b=>{const d=new Date(b.date);if((now-d)/864e5>(mode==='d'?30:183))return;const k=mode==='d'?dk(d):d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),o=g[k]=g[k]||{};o[b.category]=(o[b.category]||0)+b.amount});
return Object.keys(g).sort().reverse().map(k=>{const c=g[k],t=Object.values(c).reduce((a,b)=>a+b,0);return `<section class="card"><div class="row" style="padding-top:0"><b class="g">${k}</b><b class="neg">-₹${t}</b></div>${Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<div class="sub" style="display:flex;justify-content:space-between"><span>${esc(n)}</span><span>₹${v} · ${Math.round(v/t*100)}%</span></div><div class="pb"><i style="width:${Math.round(v/t*100)}%"></i></div>`).join('')}</section>`}).join('')||'<p class="sub">No spending in this range yet.</p>'}

function pstreak(){const s=new Set(S.workout_log.map(w=>dk(new Date(w.date))));const d=new Date();let c=0;if(!s.has(dk(d)))d.setDate(d.getDate()-1);while(s.has(dk(d))){c++;d.setDate(d.getDate()-1)}return c}


/* Screens */
const V={
today(){const t=dk(new Date()),n=new Date(),nm=n.getHours()*60+n.getMinutes(),a=S.activeTask,P={critical:0,high:1,normal:2};
const pend=S.tasks.filter(x=>!x.completed&&!x.failed).sort((x,y)=>(x.time?mins(x.time):1e4)-(y.time?mins(y.time):1e4)||(P[x.priority]??2)-(P[y.priority]??2)),fin=S.tasks.filter(x=>x.completed||x.failed);
const mi=S.morning_intentions.find(m=>m.date===t),wins=S.win_log.filter(w=>dk(new Date(w.timestamp))===t),dl=S.timeline_completed[t]||[];let cur=-1;S.timeline.forEach((x,i)=>{if(mins(x.time)<=nm)cur=i});
let act='';if(a){const s=a.isTimeline?S.timeline.find(x=>x.id===a.id):S.tasks.find(x=>x.id===a.id);act=`<section class="card act"><h2>In progress</h2><div class="big" id="tm">…</div><p>${esc(s?(s.title||s.label):'Task')}</p><div class="btns" style="justify-content:flex-start"><button class="btn p" data-a="adone">Done</button><button class="btn" data-a="amin">+1 min</button><button class="btn" data-a="askip">Skip</button><button class="btn d" data-a="afail">Fail</button></div></section>`}
const row=x=>`<div class="row${x.failed?' fl':''}"><button class="ck${x.completed?' on':''}" data-a="done" data-i="${esc(x.id)}" aria-label="Complete">${x.completed?'✓':''}</button><div class="g" data-a="task" data-i="${esc(x.id)}"><div class="${x.completed||x.failed?'mu':''}">${esc(x.title)}</div><div class="sub">${esc([x.time,x.category,x.priority!=='normal'?x.priority:'',x.repeat,x.failed?'failed':''].filter(Boolean).join(' · '))}</div></div>${x.completed||x.failed?'':`<button class="ic" data-a="start" data-i="${esc(x.id)}" aria-label="Start">▶</button>`}</div>`;
let nowc='';if(!a){const x=S.timeline[cur];if(x){const nx=S.timeline[(cur+1)%S.timeline.length],dn=dl.includes(x.id),pt=pend[0];nowc=`<section class="card act"><h2>Now · ${esc(x.time)}</h2><h3>${esc(x.label.replace(/\s*\[[^\]]*\]\s*$/,''))}</h3><p class="sub">${nx?'Next: '+esc(nx.time)+' · '+esc(nx.label.replace(/\s*\[[^\]]*\]\s*$/,'')):''}</p>${pt?`<p class="sub">Next task: ${esc(pt.title)}${pt.time?' · '+esc(pt.time):''}</p>`:''}<div class="btns" style="justify-content:flex-start"><button class="btn p" data-a="tl" data-i="${esc(x.id)}">${dn?'Undo done':'Done'}</button><button class="btn" data-a="tlstart" data-i="${esc(x.id)}">Start timer</button></div></section>`}}
const SCH=`<section class="card" id="tld"><h2>Daily schedule <span class="sub">${dl.length} of ${S.timeline.length} done</span></h2>${S.timeline.map((x,i)=>`<div class="row${i===cur?' now':''}"><button class="ck${dl.includes(x.id)?' on':''}" data-a="tl" data-i="${esc(x.id)}" aria-label="Mark done">${dl.includes(x.id)?'✓':''}</button><div class="g" data-a="tledit" data-i="${esc(x.id)}"><div>${esc(x.label.replace(/\s*\[[^\]]*\]\s*$/,''))}</div><div class="sub">${esc(x.time)}</div></div></div>`).join('')}<button class="btn" data-a="tledit" style="margin-top:10px">Add block</button></section>`;
return act+nowc+SCH+`<section class="card"><h2>Tasks</h2>${pend.map(row).join('')||'<p class="sub">Nothing pending. Type below to add one, e.g. “Study 8pm #logic !high”.</p>'}</section>`
+(fin.length?`<section class="card"><h2>Finished <button class="lnk" data-a="clear">Clear all</button></h2>${fin.map(row).join('')}</section>`:'')
+`<section class="card"><h2>Today's priorities <button class="lnk" data-a="intent">${mi?'Edit':'Set'}</button></h2>${mi?[mi.p1,mi.p2,mi.p3].filter(Boolean).map(p=>`<div style="margin-top:4px">${esc(p)}${p===mi.critical?' <span class="chip">must not fail</span>':''}</div>`).join(''):'<p class="sub">Pick up to three things that must get done today.</p>'}</section>`

+cki()+`<section class="card"><h2>Wins</h2><div class="add"><input id="wi" placeholder="Log a win" data-enter="win" autocomplete="off"><button class="btn" data-a="win">Log</button></div>${wins.slice(-5).reverse().map(w=>`<div style="margin-top:8px">${esc(w.text)}</div>`).join('')}</section>`},

train(){return `<section class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><b>${S.workout_log.length}</b><span>Sessions</span></div><div class="tile"><b>${pstreak()}</b><span>Day streak</span></div></section>`
+`<button class="btn p" data-a="rep">Repeat yesterday's workout</button>`
+`<section class="card"><h2>Exercises <button class="lnk" data-a="ex">Add</button></h2>${S.exercises.map(e=>`<div class="row"><div class="g" data-a="ex" data-i="${esc(e.id)}"><div>${esc(e.name)}</div><div class="sub">${esc(e.group||'')} · ${e.targetSets}×${e.targetReps}${e.isHold?' s':''}${e.prSets?` · best ${e.prSets}×${e.prReps}`:''}</div></div><button class="btn" data-a="log" data-i="${esc(e.id)}">Log</button></div>`).join('')||'<p class="sub">No exercises yet. Add one to start tracking.</p>'}</section>`
+exui()+`<section class="card"><h2>Recent sessions</h2>${S.workout_log.slice(-8).reverse().map(w=>`<div class="row"><div class="g" style="cursor:default">${esc(w.exerciseName)}<div class="sub">${fd(w.date)}${w.notes?' · '+esc(w.notes):''}</div></div><span class="chip">${w.sets}×${w.reps}${w.duration?' · '+w.duration+' min':''}</span></div>`).join('')||'<p class="sub">Log your first session to see it here.</p>'}</section>`},

budget(){const b=bal(),now=new Date(),mo=S.budget.filter(x=>{const d=new Date(x.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).reverse();let last='',L='';
mo.forEach(x=>{const d=new Date(x.date),g=d.getDate()+' '+MN[d.getMonth()],inc=x.category.toLowerCase()==='taken from';if(g!==last){L+=`<div class="sub grp">${g}</div>`;last=g}L+=`<div class="row"><div class="g" data-a="bitem" data-i="${esc(x.id)}"><div>${esc(x.item||x.person||x.category)}</div><div class="sub">${esc(x.category)}${x.person&&x.item?' · '+esc(x.person):''} · ${esc(x.mode)}</div></div><b class="${inc?'pos':'neg'}">${inc?'+':'-'}₹${x.amount}</b></div>`});
return `<section class="tiles"><div class="tile w"><b class="${b.t<0?'neg':''}">${R(b.t)}</b><span>Total balance</span></div><div class="tile"><b>${R(b.o)}</b><span>Online</span></div><div class="tile"><b>${R(b.c)}</b><span>Cash</span></div></section>`
+bgui()+`<div class="seg"><button class="${bTab==='l'?'on':''}" data-a="bt" data-i="l">Ledger</button><button class="${bTab==='a'?'on':''}" data-a="bt" data-i="a">Analytics</button></div>`
+(bTab==='l'?`<section class="card"><h2>${MN[now.getMonth()]} ${now.getFullYear()}</h2>${L||'<p class="sub">No transactions this month. Add one below, e.g. “120 v cash” or “500 gt Ravi”.</p>'}</section>`:`<div class="seg"><button class="${bm==='m'?'on':''}" data-a="bm" data-i="m">Last 6 months</button><button class="${bm==='d'?'on':''}" data-a="bm" data-i="d">Last 30 days</button></div>${ana(bm)}`)},

stats(){const p=S.profile,tot=S.tasks.length,dn=S.tasks.filter(x=>x.completed).length,w=p.currentWeight||'',wp=w?Math.min(100,Math.max(0,(w-45)/10*100)):0;
return `<section class="card"><div class="row" style="padding-top:0"><div class="av">${p.avatarUrl?`<img src="${esc(p.avatarUrl)}" alt="">`:esc((p.username||'OP').slice(0,2))}</div><div class="g" style="cursor:default"><b>${esc(p.username)}</b></div><button class="btn" data-a="prof">Settings</button></div><input value="${esc(p.mission||'')}" placeholder="Your mission" data-ch="mission" style="margin-top:12px"></section>`
+`<section class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><b>${dstreak()}</b><span>Streak (70%+ days)</span></div><div class="tile"><b>${tot?Math.round(dn/tot*100):0}%</b><span>Completion</span></div><div class="tile"><b>${dn}</b><span>Tasks done</span></div><div class="tile"><b>${S.workout_log.length}</b><span>Workouts</span></div></section>`
+(S.discipline_debt>0?`<section class="card"><div class="row" style="padding:0"><div class="g" style="cursor:default"><div>Discipline debt: ${S.discipline_debt}</div><div class="sub">Critical tasks you failed or avoided</div></div><button class="btn" data-a="debt">Clear it</button></div></section>`:'')
+insui()
+wtui()}
};

const DK={today:()=>`<div class="tp" id="tp" hidden></div><div class="add"><div class="hl"><div class="th" id="th" aria-hidden="true"></div><input id="ti" placeholder="Add a task… e.g. Study 8-10pm" data-enter="addtask" enterkeyhint="send" autocomplete="off"></div><button class="btn p" data-a="addtask">Add</button></div>`,
budget:()=>`<div class="chips">${[['v','Veg'],['f','Fruit'],['m','Milk'],['g','Gas'],['ff','Fast food'],['r','Ration'],['gt','Given to'],['tf','Taken from']].map(([k,n])=>`<button class="chip" data-a="cat" data-i="${k}">${n}</button>`).join('')}</div><div class="add"><input id="bi" placeholder="Amount and item, e.g. 120 v cash" data-enter="bud" enterkeyhint="send" autocomplete="off" autocapitalize="none"><button class="btn p" data-a="bud">Add</button></div>`};
function render(){$('v').innerHTML=V[tab]();if(dkT!==tab){dkT=tab;$('dk').innerHTML=DK[tab]?DK[tab]():'';$('dk').hidden=!DK[tab];document.body.classList.toggle('dk',!!DK[tab])}document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab))}

/* Insights */
const dayD=n=>{const d=new Date();d.setDate(d.getDate()-n);return d},dayKey=n=>dk(dayD(n));
const adh=k=>{const T=S.timeline.length;return T?Math.round((S.timeline_completed[k]||[]).filter(i=>S.timeline.some(x=>x.id===i)).length/T*100):0};
const tdone=k=>S.tasks.filter(x=>x.completed&&x.completedAt&&dk(new Date(x.completedAt))===k).length;
const blk=x=>x.label.replace(/\s*\[[^\]]*\]\s*$/,'');
function dstreak(){let c=0,i=adh(dayKey(0))>=70?0:1;while(i<400&&adh(dayKey(i))>=70){c++;i++}return c}
const bars=(v,l,m)=>`<div class="bars">${v.map(x=>`<div><i style="height:${m?Math.max(3,Math.round(x/m*100)):3}%" title="${x}"></i></div>`).join('')}</div><div class="bl">${l.map(x=>`<span>${x}</span>`).join('')}</div>`;
function wkui(){const n=Date.now(),cnt=a=>{const b=a+7,W=t=>t>=n-b*864e5&&t<n-a*864e5;return{t:S.tasks.filter(x=>x.completed&&x.completedAt&&W(x.completedAt)).length,w:S.workout_log.filter(x=>W(x.date)).length,s:S.budget.filter(x=>x.category.toLowerCase()!=='taken from'&&W(x.date)).reduce((q,x)=>q+x.amount,0),b:[0,1,2,3,4,5,6].reduce((q,i)=>q+(S.timeline_completed[dayKey(a+i)]||[]).length,0)}},c=cnt(0),p=cnt(7);
const L=S.weight_log.slice().sort((x,y)=>x.date-y.date),cur=L.length?L[L.length-1].kg:0,bs=L.filter(x=>x.date<=n-7*864e5).pop()||L[0],wd=L.length>1&&bs?Math.round((cur-bs.kg)*10)/10:null;
const r=(l,v,pv,inv,f)=>{const d=v-pv,k=d===0?'':((d>0)===!inv?'pos':'neg');return `<div class="wkr"><span>${l}</span><b>${f?f(v):v}</b><small class="${k}">${d>0?'+':''}${f?f(d):d}</small></div>`};
const up=[c.t>=p.t,c.b>=p.b,c.w>=p.w,c.s<=p.s].filter(Boolean).length,none=c.t+c.b+c.w+c.s===0,v=none?'No data yet':up>=3?'Good week':up===2?'Mixed week':'Slipping',vc=none?'':up>=3?'pos':up===2?'':'neg';
return `<section class="card"><h2>Week in review <span class="${vc}">${v}</span></h2>${r('Tasks done',c.t,p.t)}${r('Blocks completed',c.b,p.b)}${r('Workouts',c.w,p.w)}${r('Spending',c.s,p.s,1,R)}<div class="wkr"><span>Weight change</span><b>${wd===null?'—':(wd>0?'+':'')+wd+' kg'}</b></div><div class="sub">Last 7 days vs the 7 before</div></section>`}
function mui(){const c={};S.missed_log.filter(m=>m.date>=dayKey(14)).forEach(m=>{const k=blk(m);c[k]=(c[k]||0)+1});const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).filter(e=>e[1]>1).slice(0,3),rec=S.missed_log.map((m,i)=>({m,i})).slice(-5).reverse();
return `<section class="card"><h2>Missed blocks</h2>${top.length?`<p class="sub">Most skipped: ${top.map(([k,v])=>esc(k)+' ×'+v).join(', ')}</p>`:''}${rec.map(({m,i})=>`<div class="row"><div class="g" data-a="why" data-i="${i}"><div>${esc(blk(m))}</div><div class="sub">${esc(m.date)} · ${esc(m.time)}${m.why?' · '+esc(m.why):' · tap to add a reason'}</div></div></div>`).join('')||'<p class="sub">Nothing missed so far.</p>'}</section>`}
function insui(){const a0=adh(dayKey(0)),a7=Math.round([0,1,2,3,4,5,6].reduce((q,i)=>q+adh(dayKey(i)),0)/7),st=dstreak(),ds=[6,5,4,3,2,1,0],lb=ds.map(i=>dayD(i).toLocaleDateString(undefined,{weekday:'narrow'})),tv=ds.map(i=>tdone(dayKey(i))),bv=ds.map(i=>adh(dayKey(i)));
return `<section class="card"><h2>Schedule adherence</h2><div class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><b>${a0}%</b><span>Today</span></div><div class="tile"><b>${a7}%</b><span>7-day average</span></div></div><div class="pb" style="margin-top:10px"><i style="width:${a0}%"></i></div><div class="sub">${st} day${st===1?'':'s'} in a row at 70%+</div></section>`+wkui()+`<section class="card"><h2>Last 7 days</h2><div class="sub">Tasks done per day</div>${bars(tv,lb,Math.max(1,...tv))}<div class="sub" style="margin-top:10px">Schedule blocks done (%)</div>${bars(bv,lb,100)}</section>`+mui()}
function cki(){const t=dk(new Date()),c=S.checkins.find(x=>x.date===t);return `<section class="card"><h2>Evening check-in <button class="lnk" data-a="cki">${c?'Edit':'Start'}</button></h2>${c?`<p class="sub">Went well: ${esc(c.good||'—')}</p><p class="sub">Slipped: ${esc(c.slip||'—')}</p><p class="sub">Tomorrow: ${esc(c.next||'—')}</p>`:'<p class="sub">30 seconds: what went well, what slipped, and tomorrow\'s top priority.</p>'}</section>`}
function exui(){const h=S.exercises.map(e=>{const L=S.workout_log.filter(w=>w.exerciseId===e.id).slice(-8);if(L.length<2)return '';const v=L.map(w=>w.sets*w.reps),m=Math.max(...v);return `<div class="sub" style="display:flex;justify-content:space-between;margin-top:8px"><span>${esc(e.name)}</span><span>${v[v.length-1]} ${e.isHold?'s':'reps'} last</span></div>`+bars(v,L.map(w=>new Date(w.date).getDate()),m)}).join('');return h?`<section class="card"><h2>Progress per exercise</h2>${h}</section>`:''}
function bgui(){const n=new Date(),lim=+S.settings.budgetLimit||0,sp=S.budget.filter(x=>{const d=new Date(x.date);return x.category.toLowerCase()!=='taken from'&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}).reduce((a,x)=>a+x.amount,0),pc=lim?Math.min(100,Math.round(sp/lim*100)):0,wk={};
S.budget.filter(x=>x.category.toLowerCase()!=='taken from'&&Date.now()-x.date<7*864e5).forEach(x=>{wk[x.category]=(wk[x.category]||0)+x.amount});const wt=Object.values(wk).reduce((a,b)=>a+b,0);
return `<section class="card"><h2>Monthly limit <button class="lnk" data-a="blim">${lim?'Edit':'Set'}</button></h2>${lim?`<div class="row" style="padding:0"><b class="g">${R(sp)} of ${R(lim)}</b><b class="${sp>lim?'neg':''}">${pc}%</b></div><div class="pb"><i style="width:${pc}%${sp>lim?';background:var(--er)':''}"></i></div><div class="sub">${sp>lim?R(sp-lim)+' over':R(lim-sp)+' left'} this month</div>`:'<p class="sub">Set a monthly spending limit to track it here.</p>'}${wt?`<h2 style="margin-top:14px">This week by category · ${R(wt)}</h2>`+Object.entries(wk).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="sub" style="display:flex;justify-content:space-between"><span>${esc(k)}</span><span>${R(v)} · ${Math.round(v/wt*100)}%</span></div><div class="pb"><i style="width:${Math.round(v/wt*100)}%"></i></div>`).join(''):''}</section>`}
function chkMiss(){let ch=0;if(!S.settings.missedFrom){S.settings.missedFrom=dayKey(0);ch=1}[1,0].forEach(o=>{const k=dayKey(o);if(k<S.settings.missedFrom)return;const n=new Date(),nm=o?1440:n.getHours()*60+n.getMinutes(),dn=S.timeline_completed[k]||[];S.timeline.forEach((x,i)=>{const nx=S.timeline[i+1],end=nx?mins(nx.time):1440;if(end<=nm&&!dn.includes(x.id)&&!S.missed_log.some(m=>m.date===k&&m.id===x.id)){S.missed_log.push({id:x.id,date:k,label:x.label,time:x.time,why:''});ch=1}})});if(ch)save()}
const dlf=async(name,txt,type)=>{if(NATIVE){try{const w=await Filesystem.writeFile({path:name,data:txt,directory:Directory.Cache,encoding:Encoding.UTF8});await Share.share({title:name,url:w.uri,dialogTitle:name})}catch(e){console.error(e);toast('Export failed')}return}
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const ntf=new Set();
setInterval(()=>{if(!S.settings.remind||NATIVE)return;const n=new Date(),t=dk(n),hm=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');S.timeline.forEach(x=>{if(x.time!==hm||ntf.has(t+x.id))return;ntf.add(t+x.id);toast('Now: '+blk(x));try{if(window.Notification&&Notification.permission==='granted')new Notification(blk(x),{body:hm})}catch(e){}})},20000);
setInterval(chkMiss,60000);setTimeout(chkMiss,5000);

/* Weight tracking */
const wdt=t=>{const d=new Date(t);return dk(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')},wfmt=t=>new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function wsync(){const L=S.weight_log.slice().sort((a,b)=>a.date-b.date);if(L.length)S.profile.currentWeight=L[L.length-1].kg}
function wtui(){const p=S.profile,L=S.weight_log.slice().sort((a,b)=>a.date-b.date),g=+p.goalWeight||0,h=+p.height||0,f=n=>String(Math.round(n*10)/10),sg=n=>(n>0?'+':'')+f(n);
const cur=L.length?L[L.length-1].kg:(+p.currentWeight||0),st=L.length?L[0].kg:cur;
if(!cur)return `<section class="card"><h2>Weight <button class="lnk" data-a="wgoal">Goal</button></h2><p class="sub">Log your weight to see your trend, change and progress to your goal.</p><button class="btn p" data-a="wlog" style="width:100%;margin-top:10px">Log weight</button></section>`;
const base=L.filter(x=>x.date<=Date.now()-7*864e5).pop()||L[0],d7=base?cur-base.kg:0,dg=g?cur-g:null,pr=g&&st!==g?Math.max(0,Math.min(100,(st-cur)/(st-g)*100)):0;
let ch='';const pts=L.slice(-30);
if(pts.length>1){const vs=pts.map(x=>x.kg);if(g)vs.push(g);const mn=Math.min(...vs)-.5,mx=Math.max(...vs)+.5,X=i=>12+i*276/(pts.length-1),Y=v=>12+(mx-v)/(mx-mn)*86;
ch=`<svg class="wch" viewBox="0 0 300 110" role="img" aria-label="Weight trend">${g?`<line class="wg" x1="12" x2="288" y1="${Y(g)}" y2="${Y(g)}"/><text class="wt" x="288" y="${Y(g)-4}" text-anchor="end">goal ${f(g)}</text>`:''}<polyline class="wl" points="${pts.map((x,i)=>X(i)+','+Y(x.kg)).join(' ')}"/>${pts.map((x,i)=>`<circle class="wd" cx="${X(i)}" cy="${Y(x.kg)}" r="3"/>`).join('')}</svg>`}
const tiles=`<div class="wtl"><button data-a="wlog"><b>${f(cur)} <small>kg</small></b><span>Current · tap to update</span></button><div><b>${sg(d7)} <small>kg</small></b><span>Last 7 days</span></div><button data-a="wgoal"><b>${dg===null?'—':f(Math.abs(dg))+' <small>kg</small>'}</b><span>${dg===null?'Set a goal':dg>0?'To lose':dg<0?'To gain':'At goal'}</span></button><div><b>${h?f(cur/((h/100)**2)):L.length}</b><span>${h?'BMI':'Entries'}</span></div></div>`;
const bar=g?`<div class="pb"><i style="width:${pr}%"></i></div><div class="sub">Start ${f(st)} kg · Goal ${f(g)} kg · ${Math.round(pr)}%</div>`:`<p class="sub">Set a goal to track your progress.</p>`;
const rows=L.slice(-6).reverse().map(x=>{const pv=L[L.indexOf(x)-1];return `<div class="row"><div class="g" data-a="wedit" data-i="${esc(x.id)}"><div>${f(x.kg)} kg${pv?' <span class="sub">'+sg(x.kg-pv.kg)+'</span>':''}</div><div class="sub">${wfmt(x.date)}${x.note?' · '+esc(x.note):''}</div></div></div>`}).join('');
return `<section class="card"><h2>Weight <button class="lnk" data-a="wgoal">Goal</button></h2>${tiles}${ch}${bar}<button class="btn p" data-a="wlog" style="width:100%;margin-top:12px">Log weight</button><button class="btn" data-a="wsame" style="width:100%;margin-top:8px">Same as last weigh-in</button>${rows?`<h2 style="margin-top:14px">Recent weigh-ins</h2>${rows}`:''}</section>`}

/* Sheets */
const lab=(t,h)=>`<label>${t}</label>${h}`,inp=(id,v='',x='')=>`<input id="${id}" value="${esc(v)}" ${x}>`,close=()=>$('sh').close();
function sheet(title,body,save,id,del,lbl='Save'){const d=$('sh');d.innerHTML=`<div class="grab"></div><h3>${title}</h3>${body}<div class="btns"><button class="btn" data-a="close">Cancel</button>${del?`<button class="btn d" data-a="${del}" data-i="${esc(id)}">Delete</button>`:''}${save?`<button class="btn p" data-a="${save}" data-i="${esc(id||'')}">${lbl}</button>`:''}</div>`;if(!d.open)d.showModal()}

const A={
close,
theme(){const d=document.documentElement,n=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=n;try{localStorage.setItem('sp_theme',n)}catch(e){}tc()},
undo(){if(!hist.length)return toast('Nothing to undo');S=JSON.parse(hist.pop());fix();commit();toast('Undone')},
sync(){close();toast('Syncing…');sync()},
addtask(){const q=tparse($('ti').value);if(q&&q.ask&&!q.bare&&q.text!==tdis)return toast('Pick AM or PM for '+q.text);const t=parse($('ti').value);if(!t)return;H();S.tasks.push(t);$('ti').value='';tdis='';tui();commit()},
tap(p){const el=$('ti'),m=tparse(el.value);if(!m||!m.ask)return;const e=m.i+m.text.length;el.value=el.value.slice(0,e)+p+el.value.slice(e);el.focus();el.setSelectionRange(e+2,e+2);tui()},
tano(){const m=tparse($('ti').value);if(m&&m.ask)tdis=m.text;tui();$('ti').focus()},
done(id){const t=S.tasks.find(x=>x.id===id);if(!t)return;H();
if(t.failed){t.failed=false;t.completedAt=null;return commit()}
if(t.completed){t.completed=false;t.completedAt=null;return commit()}
t.completed=true;t.completedAt=Date.now();if(S.activeTask&&!S.activeTask.isTimeline&&S.activeTask.id===id)S.activeTask=null;
if(t.repeat==='daily'&&!t._repeated){t._repeated=true;S.tasks.push({...t,id:Date.now()+'',completed:false,failed:false,completedAt:null,_repeated:false,createdAt:Date.now()})}commit()},
deltask(id){close();H();if(S.activeTask&&S.activeTask.id===id)S.activeTask=null;S.tasks=S.tasks.filter(x=>x.id!==id);commit()},
clear(){H();S.tasks=S.tasks.filter(x=>!x.completed&&!x.failed);commit()},
task(id){const t=S.tasks.find(x=>x.id===id);if(!t)return;sheet('Task',`<p style="margin:8px 0 4px">${esc(t.title)}</p><p class="sub">${esc([t.time,t.category,t.priority!=='normal'?t.priority:'',t.repeat].filter(Boolean).join(' · '))}</p>`,t.completed||t.failed?'':'start',id,'deltask','Start timer')},
bitem(id){const b=S.budget.find(x=>x.id===id);if(!b)return;sheet(R(b.amount),`<p style="margin:8px 0 4px">${esc(b.item||b.person||b.category)}</p><p class="sub">${esc(b.category)} · ${esc(b.mode)} · ${fd(b.date)}</p>`,'',id,'delb')},
start(id){close();const t=S.tasks.find(x=>x.id===id);if(!t||t.completed||t.failed)return;if(S.activeTask)return toast('Finish the current task first');H();S.activeTask={id,isTimeline:false,startTime:Date.now(),addedMins:0,expectedDuration:t.duration||25};commit()},
adone(){const a=S.activeTask;if(!a)return;H();if(a.isTimeline){const t=dk(new Date()),l=S.timeline_completed[t]=S.timeline_completed[t]||[];if(!l.includes(a.id))l.push(a.id);S.activeTask=null;return commit()}S.activeTask=null;A.done(a.id)},
amin(){if(!S.activeTask)return;H();S.activeTask.addedMins++;commit()},
askip(){H();S.activeTask=null;commit();toast('Skipped')},
afail(){const a=S.activeTask;if(!a)return;H();const s=a.isTimeline?S.timeline.find(x=>x.id===a.id):S.tasks.find(x=>x.id===a.id);if(!a.isTimeline&&s){s.failed=true;s.completedAt=Date.now()}if(s&&s.priority==='critical')S.discipline_debt=(S.discipline_debt||0)+1;S.activeTask=null;commit()},
tl(id){const t=dk(new Date());H();const l=S.timeline_completed[t]=S.timeline_completed[t]||[],i=l.indexOf(id);if(i>=0)l.splice(i,1);else{l.push(id);(S.timeline_completed_times[t]=S.timeline_completed_times[t]||{})[id]=Date.now()}commit()},
tlstart(id){if(S.activeTask)return toast('Finish the current task first');const i=S.timeline.findIndex(x=>x.id===id);if(i<0)return;const nx=S.timeline[(i+1)%S.timeline.length];let d=mins(nx.time)-mins(S.timeline[i].time);if(d<=0)d+=1440;H();S.activeTask={id,isTimeline:true,startTime:Date.now(),addedMins:0,expectedDuration:Math.min(d,120)};commit()},
tledit(id){const x=S.timeline.find(y=>y.id===id)||{};sheet(x.id?'Edit block':'New block',lab('Time',inp('f1',x.time||'','type="time"'))+lab('Label',inp('f2',x.label||'')),'tlsave',x.id,x.id&&'tldel')},
tlsave(id){const time=$('f1').value,label=$('f2').value.trim();if(!time||!label)return toast('Add a time and a label');H();if(id)Object.assign(S.timeline.find(x=>x.id===id),{time,label});else S.timeline.push({id:'t'+Date.now(),time,label,color:'var(--blue)'});S.timeline.sort((a,b)=>mins(a.time)-mins(b.time));close();commit()},
tldel(id){H();S.timeline=S.timeline.filter(x=>x.id!==id);close();commit()},
intent(){const m=S.morning_intentions.find(x=>x.date===dk(new Date()))||{};sheet('Today’s priorities',lab('Priority 1',inp('f1',m.p1))+lab('Priority 2',inp('f2',m.p2))+lab('Priority 3',inp('f3',m.p3))+lab('Must not fail (copy one from above)',inp('f4',m.critical)),'intentsave')},
intentsave(){const p1=$('f1').value.trim(),p2=$('f2').value.trim(),p3=$('f3').value.trim(),critical=$('f4').value.trim();if(!p1&&!p2&&!p3)return close();H();const t=dk(new Date()),i=S.morning_intentions.findIndex(x=>x.date===t),e={date:t,p1,p2,p3,critical,timestamp:Date.now()};if(i>=0)S.morning_intentions[i]=e;else S.morning_intentions.push(e);close();commit()},
win(){const t=$('wi').value.trim();if(!t)return;H();S.win_log.push({text:t,timestamp:Date.now()});commit()},
debt(){const d=S.discipline_debt;if(!(d>0))return;H();S.tasks.push(mk({title:`Debt clearance: ${d} critical task${d>1?'s':''} (25 push-ups or 20 min deep work each)`,category:'DISCIPLINE',priority:'critical'}));S.discipline_debt=0;commit()},
ex(id){const e=S.exercises.find(x=>x.id===id)||{};sheet(e.id?'Edit exercise':'New exercise',lab('Name',inp('f1',e.name))+lab('Muscle group',inp('f2',e.group))+`<div class="two"><div>${lab('Target sets',inp('f3',e.targetSets||3,'type="number"'))}</div><div>${lab('Reps or seconds',inp('f4',e.targetReps||10,'type="number"'))}</div></div><label class="ckl"><input id="f5" type="checkbox"${e.isHold?' checked':''}> Timed hold (seconds)</label>`,'exsave',e.id,e.id&&'exdel')},
exsave(id){const name=$('f1').value.trim();if(!name)return toast('Add a name');H();const o={name,group:$('f2').value.trim().toUpperCase(),targetSets:+$('f3').value||3,targetReps:+$('f4').value||10,isHold:$('f5').checked};if(id)Object.assign(S.exercises.find(x=>x.id===id),o);else S.exercises.push({id:'e'+Date.now(),prSets:0,prReps:0,...o});close();commit()},
exdel(id){H();S.exercises=S.exercises.filter(x=>x.id!==id);close();commit()},
log(id){sheet('Log session',lab('Exercise',`<select id="f1">${S.exercises.map(e=>`<option value="${esc(e.id)}"${e.id===id?' selected':''}>${esc(e.name)}</option>`).join('')}</select>`)+`<div class="two"><div>${lab('Sets',inp('f2','','type="number" min="1"'))}</div><div>${lab('Reps',inp('f3','','type="number" min="1"'))}</div></div>`+lab('Duration (min, optional)',inp('f4','','type="number" min="0"'))+lab('Notes',inp('f5')),'logsave')},
logsave(){const ex=S.exercises.find(x=>x.id===$('f1').value),sets=parseInt($('f2').value),reps=parseInt($('f3').value),duration=parseInt($('f4').value)||0;if(!ex||!sets||!reps)return toast('Enter sets and reps');H();
S.workout_log.push({date:Date.now(),exerciseId:ex.id,exerciseName:ex.name,sets,reps,duration,notes:$('f5').value.trim()});const lt=sets*reps;
if(lt>=ex.targetSets*ex.targetReps){ex.targetReps+=ex.isHold?5:1;toast('Progressive overload achieved')}
if(lt>(ex.prSets||0)*(ex.prReps||0)){ex.prSets=sets;ex.prReps=reps}close();commit()},
bud(){const s=$('bi').value.trim();if(!s)return toast('Enter an amount and item');let amount=0,mode='Online',category='Miscellaneous',person='',item='';const rest=[];
s.split(/\s+/).forEach(p=>{const n=parseFloat(p);if(!isNaN(n))amount=n;else if(p.toLowerCase()==='cash')mode='Cash';else if(p.toLowerCase()==='online')mode='Online';else rest.push(p)});
const ci=rest.findIndex(p=>catMap[p.toLowerCase()]);
if(ci>-1){category=catMap[rest[ci].toLowerCase()];const o=rest.filter((_,i)=>i!==ci).join(' ');if(category==='Given to'||category==='Taken from')person=o||'Unknown';else item=o}else if(rest.length)category=rest.join(' ');
if(amount<=0)return toast('Enter a valid amount');H();S.budget.push({id:'b_'+Date.now(),date:Date.now(),category,amount,mode,person,item});$('bi').value='';commit();toast(`Recorded ${category} ${R(amount)} (${mode})`)},
cat(c){const i=$('bi'),keys=Object.keys(catMap),p=i.value.trim().split(/\s+/).filter(Boolean).filter(x=>!keys.includes(x.toLowerCase()));p.push(c);i.value=p.join(' ');i.focus()},
delb(id){close();H();S.budget=S.budget.filter(b=>b.id!==id);commit()},
bt(k){bTab=k;render()},bm(k){bm=k;render()},
cki(){const c=S.checkins.find(x=>x.date===dk(new Date()))||{};sheet('Evening check-in',lab('What went well?',inp('f1',c.good))+lab('What slipped?',inp('f2',c.slip))+lab('Top priority tomorrow',inp('f3',c.next)),'ckisave')},
ckisave(){const good=$('f1').value.trim(),slip=$('f2').value.trim(),next=$('f3').value.trim();if(!good&&!slip&&!next)return close();H();const t=dk(new Date()),i=S.checkins.findIndex(x=>x.date===t),e={date:t,good,slip,next,timestamp:Date.now()};if(i>=0)S.checkins[i]=e;else S.checkins.push(e);
if(next){const tm=dk(dayD(-1));if(!S.morning_intentions.some(x=>x.date===tm))S.morning_intentions.push({date:tm,p1:next,p2:'',p3:'',critical:'',timestamp:Date.now()})}close();commit()},
why(i){const m=S.missed_log[+i];if(!m)return;sheet('Why was it missed?',`<p class="sub" style="margin:8px 0 0">${esc(blk(m))} · ${esc(m.date)}</p>`+lab('Reason (optional)',inp('f1',m.why||'')),'whysave',String(i))},
whysave(i){const m=S.missed_log[+i];if(m){H();m.why=$('f1').value.trim()}close();commit()},
rep(){const y=dayKey(1),L=S.workout_log.filter(w=>dk(new Date(w.date))===y);if(!L.length)return toast('No workout logged yesterday');H();L.forEach(w=>S.workout_log.push({...w,date:Date.now()}));commit();toast('Repeated yesterday\'s workout')},
wsame(){const L=S.weight_log.slice().sort((a,b)=>a.date-b.date);if(!L.length)return toast('Log a weight first');H();S.weight_log.push({id:'w'+Date.now(),date:Date.now(),kg:L[L.length-1].kg,note:''});wsync();commit();toast('Weight logged')},
blim(){sheet('Monthly spending limit',lab('Limit (₹)',inp('f1',S.settings.budgetLimit||'','type="number" inputmode="numeric"')),'blimsave')},
blimsave(){S.settings.budgetLimit=Math.max(0,parseFloat($('f1').value)||0);close();commit()},
notif(){const c=NK(),op=(v,l,cur)=>`<option value="${v}"${String(cur)===String(v)?' selected':''}>${l}</option>`;
sheet('Notifications',`<label class="ckl"><input id="f1" type="checkbox"${S.settings.remind?' checked':''}> Reminders on</label><label class="ckl"><input id="f2" type="checkbox"${c.blocks?' checked':''}> Schedule blocks</label><label class="ckl"><input id="f3" type="checkbox"${c.tasks?' checked':''}> Timed tasks</label>`
+lab('Remind me',`<select id="f4">${[0,5,10,15,30,60].map(v=>op(v,v?v+' min before':'At the time',c.lead)).join('')}</select>`)
+lab('Snooze for',`<select id="f5">${[5,10,15,30].map(v=>op(v,v+' min',c.snooze)).join('')}</select>`)
+lab('Alert style',`<select id="f6">${[['loud','Sound and vibrate'],['quiet','Silent']].map(([v,l])=>op(v,l,c.style)).join('')}</select>`)
+lab('Quiet hours from (optional)',inp('f7',c.qStart,'type="time"'))+lab('Quiet hours until',inp('f8',c.qEnd,'type="time"'))
+lab('Evening check-in reminder (optional)',inp('f9',c.checkin,'type="time"'))
+`<div class="btns" style="justify-content:flex-start"><button class="btn" data-a="ntest">Send test</button></div>`,'notifsave')},
notifsave(){const n={blocks:$('f2').checked,tasks:$('f3').checked,lead:+$('f4').value||0,snooze:+$('f5').value||10,style:$('f6').value,qStart:$('f7').value,qEnd:$('f8').value,checkin:$('f9').value},on=$('f1').checked;
H();S.settings.notif=n;close();
if(on&&!S.settings.remind){askPerm().then(ok=>{S.settings.remind=true;commit();toast(ok?'Reminders on':'Reminders on (in-app only)')})}
else{S.settings.remind=on;commit();toast(on?'Notification settings saved':'Reminders off')}},
async ntest(){if(!NATIVE)return toast('The test works in the Android app');if(!await askPerm())return toast('Allow notifications first');const c=NK();
try{await mkChannels();await LocalNotifications.registerActionTypes({types:[{id:'ACT',actions:[{id:'done',title:'Done'},{id:'snooze',title:'Snooze '+c.snooze+' min'}]}]});
await LocalNotifications.schedule({notifications:[{id:hid('test'+Date.now()),title:'Test reminder',body:'Try the Done and Snooze buttons',schedule:{at:new Date(Date.now()+4000),allowWhileIdle:true},channelId:chan(c),actionTypeId:'ACT',extra:{kind:'test'}}]});toast('Test sent. Leave the app to see it')}catch(e){toast('Could not send test')}},
exp(){const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"',D=t=>dk(new Date(t)),X=[['type','date','name','detail','value']];
S.tasks.forEach(x=>X.push(['task',D(x.createdAt||Date.now()),x.title,x.completed?'done':x.failed?'failed':'open',x.time||'']));
S.workout_log.forEach(x=>X.push(['workout',D(x.date),x.exerciseName,x.sets+'x'+x.reps,x.duration||'']));
S.weight_log.forEach(x=>X.push(['weight',D(x.date),'kg',x.note||'',x.kg]));
S.budget.forEach(x=>X.push(['budget',D(x.date),x.item||x.person||x.category,x.category+' '+x.mode,x.amount]));
S.missed_log.forEach(x=>X.push(['missed',x.date,x.label,x.why||'',x.time]));
dlf('sovereign-logs.csv',X.map(r=>r.map(q).join(',')).join('\n'),'text/csv');toast('CSV exported')},
bak(){dlf('sovereign-backup.json',JSON.stringify(S,null,1),'application/json');toast('Backup saved')},
wlog(){const L=S.weight_log.slice().sort((a,b)=>a.date-b.date),last=L.length?L[L.length-1].kg:(S.profile.currentWeight||'');sheet('Log weight',lab('Weight (kg)',inp('f1',last,'type="number" step="0.1" inputmode="decimal"'))+lab('Date and time',inp('f2',wdt(Date.now()),'type="datetime-local"'))+lab('Note (optional)',inp('f3')),'wsave')},
wedit(id){const e=S.weight_log.find(x=>x.id===id);if(!e)return;sheet('Edit weight',lab('Weight (kg)',inp('f1',e.kg,'type="number" step="0.1" inputmode="decimal"'))+lab('Date and time',inp('f2',wdt(e.date),'type="datetime-local"'))+lab('Note (optional)',inp('f3',e.note||'')),'wsave',id,'wdel')},
wsave(id){const kg=parseFloat($('f1').value);if(!(kg>0&&kg<500))return toast('Enter a valid weight');const dt=new Date($('f2').value),date=isNaN(dt)?Date.now():dt.getTime(),note=$('f3').value.trim();H();
const e=id?S.weight_log.find(x=>x.id===id):null;
if(e)Object.assign(e,{kg,date,note});else S.weight_log.push({id:'w'+Date.now(),date,kg,note});wsync();close();commit();toast('Weight saved')},
wdel(id){H();S.weight_log=S.weight_log.filter(x=>x.id!==id);wsync();close();commit()},
wgoal(){const p=S.profile;sheet('Weight goal',lab('Goal weight (kg)',inp('f1',p.goalWeight||'','type="number" step="0.1" inputmode="decimal"'))+lab('Height (cm, optional, for BMI)',inp('f2',p.height||'','type="number" inputmode="numeric"')),'wgsave')},
wgsave(){const g=parseFloat($('f1').value),h=parseFloat($('f2').value);S.profile.goalWeight=g>0?g:0;S.profile.height=h>0?h:0;close();commit()},
prof(){const p=S.profile;sheet('Settings',lab('Name',inp('f1',p.username))+lab('Mission',inp('f2',p.mission||''))+lab('Avatar image URL',inp('f3',p.avatarUrl||'','placeholder="https://"'))+`<div class="btns" style="justify-content:flex-start"><button class="btn" data-a="undo">Undo</button><button class="btn" data-a="theme">Theme</button><button class="btn" data-a="sync">Sync now</button><button class="btn" data-a="notif">Notifications</button><button class="btn" data-a="exp">Export CSV</button><button class="btn" data-a="bak">Backup</button><button class="btn d" data-a="reset">Factory reset</button></div>`,'profsave')},
profsave(){const n=$('f1').value.trim().toUpperCase();if(n)S.profile.username=n;S.profile.mission=$('f2').value.trim();S.profile.avatarUrl=$('f3').value.trim();close();commit()},
reset(){if(!confirm('Factory reset? This erases all tasks, schedule blocks, workouts and weight entries. Only your budget logs are kept. This cannot be undone.'))return;const r=clone(DEFAULT);r.budget=S.budget;withTO(set(ref(db,PATH),r),10000).then(()=>{try{localStorage.removeItem(LK);localStorage.removeItem(DIRTY)}catch(e){}location.reload()}).catch(()=>toast('Reset failed'))}
};
const C={mission(v){S.profile.mission=v.trim();save();toast('Mission saved')},weight(v){const n=parseFloat(v);if(n>0){S.profile.currentWeight=n;commit()}}};

document.addEventListener('click',e=>{const n=e.target.closest('nav button');if(n){tab=n.dataset.t;scrollTo(0,0);return render()}const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a]){if(b.classList.contains('ck'))navigator.vibrate?.(8);A[b.dataset.a](b.dataset.i)}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.enter)A[e.target.dataset.enter]()});
document.addEventListener('change',e=>{const k=e.target.dataset.ch;if(k)C[k](e.target.value)});
$('sh').addEventListener('click',e=>{if(e.target===$('sh'))close()});
document.addEventListener('input',e=>{if(e.target.id==='ti')tui()});
document.addEventListener('scroll',e=>{if(e.target.id==='ti'){const h=$('th');if(h)h.scrollLeft=e.target.scrollLeft}},true);
let gy=null,gd=0;
document.addEventListener('pointerdown',e=>{const g=e.target.closest('.grab');if(!g)return;gy=e.clientY;gd=0;try{g.setPointerCapture(e.pointerId)}catch(x){}$('sh').style.transition='none'});
document.addEventListener('pointermove',e=>{if(gy===null)return;gd=Math.max(0,e.clientY-gy);$('sh').style.transform=`translateY(${gd}px)`});
const gend=()=>{if(gy===null)return;const d=$('sh'),far=gd>100;gy=null;gd=0;d.style.transition='';if(far)close();d.style.transform=''};
document.addEventListener('pointerup',gend);
document.addEventListener('pointercancel',gend);
$('v').addEventListener('toggle',e=>{if(e.target.id==='tld')tlOpen=e.target.open},true);
setInterval(()=>{const a=S.activeTask,e=$('tm');if(!a||!e)return;const s=(a.expectedDuration+a.addedMins)*60-(Date.now()-a.startTime)/1000,m=Math.abs(s);e.textContent=(s<0?'+':'')+Math.floor(m/60)+':'+String(Math.floor(m%60)).padStart(2,'0');e.style.color=s<0?'var(--er)':''},1000);

function tc(){const m=document.querySelector('meta[name=theme-color]'),bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();if(m)m.content=bg;
if(NATIVE){const dark=document.documentElement.dataset.theme==='dark';try{StatusBar.setStyle({style:dark?Style.Dark:Style.Light}).catch(()=>{});StatusBar.setBackgroundColor({color:bg}).catch(()=>{})}catch(e){}}}
const inDock=e=>e.target.closest&&e.target.closest('.dock');
document.addEventListener('focusin',e=>{if(inDock(e))document.body.classList.add('kb')});
document.addEventListener('focusout',e=>{if(inDock(e))document.body.classList.remove('kb')});
document.addEventListener('pointerdown',e=>{if(e.target.closest('.dock button'))e.preventDefault()});
if(window.visualViewport){const f=()=>document.documentElement.style.setProperty('--kb',Math.max(0,innerHeight-visualViewport.height-visualViewport.offsetTop)+'px');visualViewport.addEventListener('resize',f);visualViewport.addEventListener('scroll',f)}
/* ===== Native layer: offline-first sync, interactive notifications, back button ===== */
const NK=()=>({blocks:true,tasks:true,lead:0,snooze:10,style:'loud',qStart:'',qEnd:'',checkin:'',...(S.settings.notif||{})});
const hid=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)%2147000000+1};
const chan=c=>c.style==='quiet'?'sp_quiet':'sp_loud';
const inQuiet=(d,c)=>{if(!c.qStart||!c.qEnd)return false;const m=d.getHours()*60+d.getMinutes(),a=mins(c.qStart),b=mins(c.qEnd);return a===b?false:a<b?(m>=a&&m<b):(m>=a||m<b)};

async function askPerm(){if(!NATIVE)return false;
try{let p=await LocalNotifications.checkPermissions();if(p.display!=='granted')p=await LocalNotifications.requestPermissions();
try{const e=await LocalNotifications.checkExactNotificationSetting();if(e.exact_alarm!=='granted')await LocalNotifications.changeExactNotificationSetting()}catch(x){}
return p.display==='granted'}catch(e){return false}}

async function mkChannels(){
await LocalNotifications.createChannel({id:'sp_loud',name:'Reminders',description:'Schedule and task reminders',importance:4,visibility:1,vibration:true,lights:true});
await LocalNotifications.createChannel({id:'sp_quiet',name:'Reminders (silent)',description:'Silent reminders',importance:2,visibility:1,vibration:false})}

/* Rebuilds the next 7 days of reminders from the current data and settings */
async function rescheduleAll(){
if(!NATIVE)return;
try{
const pend=await LocalNotifications.getPending(),old=pend.notifications.filter(n=>!(n.extra&&n.extra.snz));
if(old.length)await LocalNotifications.cancel({notifications:old.map(n=>({id:n.id}))});
const c=NK();
await LocalNotifications.registerActionTypes({types:[{id:'ACT',actions:[{id:'done',title:'Done'},{id:'snooze',title:'Snooze '+c.snooze+' min'}]}]});
if(!S.settings.remind)return;
const perm=await LocalNotifications.checkPermissions();if(perm.display!=='granted')return;
await mkChannels();
const now=Date.now(),b=new Date(),out=[],ch=chan(c);
const at=(d,hm,lead)=>{const[h,m]=String(hm).split(':').map(Number);return new Date(d.getFullYear(),d.getMonth(),d.getDate(),h||0,(m||0)-lead)};
const add=(t,key,title,body,extra,act)=>{if(t.getTime()<=now+3000||inQuiet(t,c))return;out.push({id:hid(key),title,body,schedule:{at:t,allowWhileIdle:true},channelId:ch,...(act?{actionTypeId:'ACT'}:{}),extra})};
for(let o=0;o<7;o++){const d=new Date(b.getFullYear(),b.getMonth(),b.getDate()+o),k=dk(d);
if(c.blocks)S.timeline.forEach(x=>{if((S.timeline_completed[k]||[]).includes(x.id))return;add(at(d,x.time,c.lead),k+'|tl|'+x.id,blk(x),c.lead?'Starts at '+x.time+' (in '+c.lead+' min)':'Now: '+x.time,{kind:'tl',id:x.id,date:k},1)});
if(c.checkin&&!S.checkins.some(x=>x.date===k))add(at(d,c.checkin,0),k+'|cki','Evening check-in','What went well and what slipped today?',{kind:'cki'},0)}
if(c.tasks)S.tasks.forEach(x=>{if(x.completed||x.failed||!x.time)return;let t=at(new Date(b.getFullYear(),b.getMonth(),b.getDate()),x.time,c.lead);if(t.getTime()<=now+3000)t=at(new Date(b.getFullYear(),b.getMonth(),b.getDate()+1),x.time,c.lead);add(t,'task|'+x.id,x.title,'Task at '+x.time,{kind:'task',id:x.id},1)});
out.sort((p,q)=>p.schedule.at-q.schedule.at);
if(out.length)await LocalNotifications.schedule({notifications:out.slice(0,400)})
}catch(e){console.error('Notification scheduling failed',e)}}
let nT;function sch(){if(!NATIVE)return;clearTimeout(nT);nT=setTimeout(rescheduleAll,1500)}

async function snooze(n){const c=NK();
try{await LocalNotifications.schedule({notifications:[{id:hid('snz'+Date.now()),title:n.title,body:(n.body||'')+' (snoozed)',schedule:{at:new Date(Date.now()+c.snooze*60000),allowWhileIdle:true},channelId:chan(c),actionTypeId:'ACT',extra:{...(n.extra||{}),snz:1}}]});toast('Snoozed for '+c.snooze+' min')}catch(e){toast('Could not snooze')}}

function nsetup(){
window.addEventListener('online',()=>sync());
window.addEventListener('offline',()=>dot(0));
document.addEventListener('visibilitychange',()=>{if(document.hidden)push();else{sync();sch()}});
setInterval(()=>{if(!synced||isDirty())sync()},45000);
if(!NATIVE)return;
try{
LocalNotifications.addListener('localNotificationActionPerformed',e=>{const n=e.notification||{},x=n.extra||{},a=e.actionId;
if(a==='snooze'){snooze(n);return}
if(a==='done'){
if(x.kind==='tl'&&x.date){H();const l=S.timeline_completed[x.date]=S.timeline_completed[x.date]||[];if(!l.includes(x.id)){l.push(x.id);(S.timeline_completed_times[x.date]=S.timeline_completed_times[x.date]||{})[x.id]=Date.now()}commit();toast('Marked done');return}
if(x.kind==='task'){const t=S.tasks.find(y=>y.id===x.id);if(t&&!t.completed){A.done(x.id);toast('Marked done')}return}}
tab='today';render();if(x.kind==='cki')A.cki()});
CapApp.addListener('backButton',()=>{const d=$('sh');if(d.open){close();return}if(tab!=='today'){tab='today';render();return}CapApp.exitApp()});
CapApp.addListener('appStateChange',s=>{if(s.isActive){sync();sch()}else push()})
}catch(e){console.error('Native setup failed',e)}}

boot=true;loadLocal();tc();fix();streaks();boot=false;render();sync();nsetup();sch();
