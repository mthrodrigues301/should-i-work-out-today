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

test('an absence replaces only that date and limits the reason',()=>{
 database={};
 history.logAbsence('2026-10-15','Viagem', {title:'Full Body A'},1);
 const entry=history.read()['2026-10-15'];
 assert.equal(entry.kind,'skipped');
 assert.equal(entry.reason,'Viagem');
 assert.throws(()=>history.logAbsence('bad','',{title:'A'},1));
});
