/* Export a workout plan in a portable format that My Workout can import. */
(function(root){
 const DAYS=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
 function planForSharing(plan){
  return Object.fromEntries(Object.entries(plan||{}).filter(([day,workout])=>/^[0-6]$/.test(day)&&workout&&typeof workout.title==='string'&&Array.isArray(workout.items)&&workout.items.length).map(([day,workout])=>[day,{title:workout.title,items:workout.items.map(item=>({name:item.name,sets:item.sets,reps:item.reps,...(Number.isInteger(item.restSeconds)?{restSeconds:item.restSeconds}:{}),...(item.machine?{machine:item.machine}:{}),...(item.cycle?{cycle:item.cycle}:{}),...(item.image?{image:item.image}:{})}))}]));
 }
 function toImportText(plan){
  const safePlan=planForSharing(plan);
  const blocks=Object.entries(safePlan).map(([day,workout])=>[
   `## ${DAYS[Number(day)]} — ${workout.title}`,
   ...workout.items.map(item=>`| ${String(item.name).replace(/\|/g,' ')} | ${item.sets} | ${item.reps} | ${item.restSeconds??'—'} | ${String(item.machine||'').replace(/\|/g,' ')} | ${String(item.cycle||'').replace(/\|/g,' ')} | ${String(item.image||'').replace(/\|/g,' ')} |`)
  ].join('\n'));
  return ['Ficha completa My Workout','No app, escolha Adicionar treino e cole esta mensagem em Importar arquivo / texto. Depois, toque em Salvar treino.','',...blocks].join('\n');
 }
 root.WorkoutShareFormat=Object.freeze({planForSharing,toImportText});
 if(typeof module!=='undefined')module.exports=root.WorkoutShareFormat;
})(typeof window!=='undefined'?window:globalThis);
