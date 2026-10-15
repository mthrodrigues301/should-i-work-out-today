/* Session summaries are separate from manual attendance. Never infer exercise details from check-ins. */
(function(root){
 const KEY='workout-completions-v1';
 function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}}
 function dateKey(time){const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 function update(id,session,workout){const records=read();if(session?.finished&&Number.isFinite(session.completedAt)){records[id]={date:dateKey(session.completedAt),completedAt:session.completedAt,title:workout.title,elapsed:session.elapsed,exercises:workout.items.length}}else delete records[id];localStorage.setItem(KEY,JSON.stringify(records))}
 function dates(){return [...new Set(Object.values(read()).filter(v=>v&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)).map(v=>v.date))]}
 const api={KEY,update,dates};if(typeof module!=='undefined')module.exports=api;else root.WorkoutHistory=api;
})(typeof window!=='undefined'?window:globalThis);
