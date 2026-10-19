/* Pure workout state transitions, shared by UI and regression tests. */
const Training={
 restSeconds(ex,fallback){return Number.isInteger(ex?.restSeconds)&&ex.restSeconds>=0&&ex.restSeconds<=1800?ex.restSeconds:fallback},
 totalSets(ex){const n=Number(ex.sets);return Number.isInteger(n)&&n>0&&n<=100?n:1},
 count(t,i,ex,done){if(done.includes(i))return this.totalSets(ex);return Math.min(this.totalSets(ex),Math.max(0,Number(t?.sets?.[i])||0))},
 next(items,done,after=-1){for(let step=1;step<=items.length;step++){const i=(after+step)%items.length;if(!done.includes(i))return i}return -1},
 restLeft(t,now=Date.now()){return t?.rest?Math.max(0,t.rest.end===null?t.rest.remaining:t.rest.end-now):0},
 mark(t,items,done,i,all,restSeconds,now=Date.now()){
  if(!t||t.startedAt===null||done.includes(i)||!items[i])return done;
  t.sets??={};const total=this.totalSets(items[i]);t.sets[i]=all?total:Math.min(total,this.count(t,i,items[i],done)+1);
  const updated=t.sets[i]===total?[...done,i]:[...done];t.finished=updated.length===items.length;
  t.current=t.sets[i]===total?this.next(items,updated,i):i;
  t.rest=!t.finished&&t.sets[i]<total&&restSeconds>0?{end:now+restSeconds*1000,remaining:restSeconds*1000,exercise:i}:null;
  if(t.finished){t.elapsed+=Math.max(0,now-t.startedAt);t.startedAt=null;t.completedAt=now;t.focus=false}
  return updated;
 }
};
if(typeof module!=='undefined')module.exports=Training;
