/* Local, immutable daily log. A date may have either a completed session or an absence. */
const WorkoutHistoryStore=(()=>{
 const KEY='mt-history-v1';
 const dateKey=time=>{const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}};
 const write=value=>localStorage.setItem(KEY,JSON.stringify(value));
 const location=value=>value&&Number.isFinite(value.latitude)&&value.latitude>=-90&&value.latitude<=90&&Number.isFinite(value.longitude)&&value.longitude>=-180&&value.longitude<=180?{latitude:Number(value.latitude.toFixed(6)),longitude:Number(value.longitude.toFixed(6)),accuracy:Number.isFinite(value.accuracy)?Math.max(0,Math.round(value.accuracy)):undefined}:undefined;
 const logCompletion=(session,workout,day)=>{if(!session?.finished||!Number.isFinite(session.completedAt))return;const all=read(),date=dateKey(session.completedAt),savedLocation=location(session.location),exercises=workout.items.map((item,index)=>({name:item.name,sets:item.sets,reps:item.reps,completedSets:Math.min(Number(item.sets)||1,Math.max(0,Number(session.sets?.[index])||0))})),complete=exercises.every(item=>item.completedSets>=(Number(item.sets)||1));all[date]={kind:'trained',date,completedAt:session.completedAt,elapsed:Math.max(0,Math.floor(session.elapsed||0)),title:workout.title,day,partial:!complete,exercises,...(savedLocation?{location:savedLocation}:{})};write(all)};
 const logAbsence=(date,reason,workout,day)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!reason.trim())throw Error('Motivo obrigatório');const all=read();all[date]={kind:'skipped',date,reason:reason.trim().slice(0,500),title:workout.title,day};write(all)};
 const removeAbsence=date=>{const all=read();if(all[date]?.kind!=='skipped')return false;delete all[date];write(all);return true};
 return {KEY,read,logCompletion,logAbsence,removeAbsence,dateKey};
})();
if(typeof module!=='undefined')module.exports=WorkoutHistoryStore;
