const {test}=require('node:test');
const assert=require('node:assert/strict');
let database={};
global.localStorage={getItem:key=>database[key]||null,setItem:(key,value)=>database[key]=value};
const history=require('../public/treino/history-store.js');

test('a completed workout stores its completed date, duration and exercise snapshot',()=>{
 database={};
 history.logCompletion({finished:true,completedAt:new Date(2026,9,15,21,30).getTime(),elapsed:1540000,sets:{0:3}}, {title:'Full Body A',items:[{name:'Supino',sets:'3',reps:'8–12'}]}, 1);
 const entry=history.read()['2026-10-15'];
 assert.equal(entry.kind,'trained');
 assert.equal(entry.elapsed,1540000);
 assert.deepEqual(entry.exercises,[{name:'Supino',sets:'3',reps:'8–12',completedSets:3}]);
});

test('a completed workout keeps an optional local location within valid coordinates',()=>{
 database={};
 const completedAt=new Date(2026,9,15,21,30).getTime(),workout={title:'Full Body A',items:[]};
 history.logCompletion({finished:true,completedAt,elapsed:0,location:{latitude:-23.5505208,longitude:-46.633308,accuracy:14.7}},workout,1);
 assert.deepEqual(history.read()['2026-10-15'].location,{latitude:-23.550521,longitude:-46.633308,accuracy:15});
 history.logCompletion({finished:true,completedAt,elapsed:0,location:{latitude:100,longitude:0}},workout,1);
 assert.equal(history.read()['2026-10-15'].location,undefined);
});

test('an absence replaces only that date and limits the reason',()=>{
 database={};
 history.logAbsence('2026-10-15','Viagem', {title:'Full Body A'},1);
 const entry=history.read()['2026-10-15'];
 assert.equal(entry.kind,'skipped');
 assert.equal(entry.reason,'Viagem');
 assert.throws(()=>history.logAbsence('bad','',{title:'A'},1));
});

test('changing the mind removes only the recorded absence',()=>{
 database={};
 history.logAbsence('2026-10-15','Viagem',{title:'Full Body A'},1);
 history.logAbsence('2026-10-16','Descanso',{title:'Full Body B'},2);
 assert.equal(history.removeAbsence('2026-10-15'),true);
 assert.equal(history.read()['2026-10-15'],undefined);
 assert.equal(history.read()['2026-10-16'].reason,'Descanso');
 assert.equal(history.removeAbsence('2026-10-15'),false);
});
