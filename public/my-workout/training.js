/* Pure workout state transitions, shared by UI and regression tests. */
const Training={
 restSeconds(ex,fallback){return Number.isInteger(ex?.restSeconds)&&ex.restSeconds>=0&&ex.restSeconds<=1800?ex.restSeconds:fallback},
 totalSets(ex){const n=Number(ex.sets);return Number.isInteger(n)&&n>0&&n<=100?n:1},
 resumeDay(sessions,week){const entry=Object.entries(sessions||{}).filter(([key,value])=>key.startsWith(week+':')&&value&&!value.finished&&(value.startedAt!==null||Number(value.elapsed)>0||Number.isInteger(value.current))).sort((a,b)=>(Number(b[1].updatedAt)||Number(b[1].startedAt)||Number(b[1].elapsed)||0)-(Number(a[1].updatedAt)||Number(a[1].startedAt)||Number(a[1].elapsed)||0))[0];if(!entry)return null;const day=Number(entry[0].slice(week.length+1));return Number.isInteger(day)&&day>=0&&day<=6?day:null},
 count(t,i,ex,done){if(done.includes(i))return this.totalSets(ex);return Math.min(this.totalSets(ex),Math.max(0,Number(t?.sets?.[i])||0))},
 next(items,done,after=-1){for(let step=1;step<=items.length;step++){const i=(after+step)%items.length;if(!done.includes(i))return i}return -1},
 cycleMembers(items,i){const cycle=items[i]?.cycle;if(!cycle)return [];return items.map((item,index)=>item?.cycle===cycle?index:-1).filter(index=>index>=0)},
 nextCycle(items,counts,members,after){if(members.length<2)return -1;const minimum=Math.min(...members.map(i=>Math.max(0,Number(counts?.[i])||0)));for(let step=1;step<=members.length;step++){const i=members[(members.indexOf(after)+step+members.length)%members.length];if((Number(counts?.[i])||0)<this.totalSets(items[i])&&(Number(counts?.[i])||0)===minimum)return i}return -1},
 predictNext(t,items,done,i,all=false){if(!t||!items[i])return this.next(items,done,i);const copy={...t,startedAt:0,finished:false,rest:null,sets:{...(t.sets||{})}};this.mark(copy,items,done,i,all,0,0);return copy.finished?-1:copy.current},
 restLeft(t,now=Date.now()){return t?.rest?Math.max(0,t.rest.end===null?t.rest.remaining:t.rest.end-now):0},
 mark(t,items,done,i,all,restSeconds,now=Date.now()){
  if(!t||t.startedAt===null||done.includes(i)||!items[i])return done;
  t.sets??={};const total=this.totalSets(items[i]);t.sets[i]=all?total:Math.min(total,this.count(t,i,items[i],done)+1);
  const updated=t.sets[i]===total?[...done,i]:[...done];t.finished=updated.length===items.length;
  const members=this.cycleMembers(items,i),cycleNext=this.nextCycle(items,t.sets,members,i);
  t.current=cycleNext>=0?cycleNext:t.sets[i]===total?this.next(items,updated,i):i;
  t.rest=!t.finished&&restSeconds>0?{end:now+restSeconds*1000,remaining:restSeconds*1000,exercise:i,nextExercise:t.current,betweenExercises:t.current!==i,seconds:restSeconds}:null;
  if(t.finished){t.elapsed+=Math.max(0,now-t.startedAt);t.startedAt=null;t.completedAt=now;t.outcome='complete';t.focus=false}
  return updated;
 }
};
if(typeof module!=='undefined')module.exports=Training;
