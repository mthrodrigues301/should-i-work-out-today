process.env.TZ = "America/Sao_Paulo";
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const script = fs.readFileSync('src/scripts/check-in.js', 'utf8');
function setup(now, stored = '[]', blocked = false) {
 const elements = new Map();
 const make = () => ({children:[], classList:{remove(){},add(){}},setAttribute(k,v){this[k]=v},append(...v){this.children.push(...v)},replaceChildren(){this.children=[]},addEventListener(k,v){this[k]=v},focus(){}});
 const get = id => {if(!elements.has(id)) elements.set(id,make());return elements.get(id)};
 let value = stored, message, timer;
 class Clock extends Date {constructor(...args){super(...(args.length ? args : [now]));}}
 const context = vm.createContext({Date:Clock,Set,JSON,SyntaxError,document:{querySelector:get,createElement:make,addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem(k){return k === "workout-check-ins-v1" ? value : "{}"},setItem(k,v){if(blocked)throw Error('blocked');value=v}},setTimeout(fn){timer=fn},clearTimeout(){},showToast(v){message=v}});
 vm.runInContext(fs.readFileSync('src/locales/pt.js','utf8'),context);
 vm.runInContext(fs.readFileSync("public/workout-history.js","utf8"),context);
 context.WorkoutHistory=context.window.WorkoutHistory;
 vm.runInContext(script,context);
 context.window.workoutCheckIn.render(context.window.WORKOUT_LOCALES.pt);
 return {get,value:()=>value,message:()=>message,advance(v){now=v;timer()}};
}
let t = setup('2026-09-27T23:59:00-03:00','["2026-09-21","2026-09-26"]');
assert.equal(t.get('#checkInCount').textContent,'2 treinos nesta semana');
t.get('#checkInButton').click();t.get('#checkInButton').click();
assert.deepEqual(JSON.parse(t.value()),['2026-09-21','2026-09-26','2026-09-27']);
assert.equal(t.get('#checkInCount').textContent,'3 treinos nesta semana');
t.advance('2026-09-28T00:01:00-03:00');
assert.equal(t.get('#checkInCount').textContent,'0 treinos nesta semana');
assert.equal(t.get('#checkInButton').hidden,false);
t.get('#checkInButton').click();t.get('#checkInUndo').click();
assert.deepEqual(JSON.parse(t.value()),['2026-09-21','2026-09-26','2026-09-27']);
t=setup('2027-01-01T12:00:00-03:00','["2026-12-31"]');
assert.equal(t.get('#checkInCount').textContent,'1 treino nesta semana');
t=setup('2026-09-24T12:00:00-03:00','invalid');t.get('#checkInButton').click();assert.equal(JSON.parse(t.value()).length,1);
t=setup('2026-09-24T12:00:00-03:00','[]',true);t.get('#checkInButton').click();assert.equal(t.value(),'[]');assert.match(t.message(),/Não foi possível/);
console.log('Passed: local dates, duplicate prevention, midnight/week rollover, year boundary, undo preserving history, malformed storage, failed writes.');
