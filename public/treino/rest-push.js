const RestPush=(()=>{
 const SETTINGS_KEY='mt-expiry-push',STATE_KEY='mt-rest-push';let currentRest=()=>null,queue=Promise.resolve();
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 const enabled=()=>read(SETTINGS_KEY)?.enabled===true&&Notification.permission==='granted';
 const token=()=>read(SETTINGS_KEY)?.token;
 const state=()=>read(STATE_KEY);
 const save=value=>localStorage.setItem(STATE_KEY,JSON.stringify(value));
 async function request(method,body){const response=await fetch('/api/notifications/rest',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Não foi possível programar o aviso do descanso.');return response.json()}
 async function subscription(){const registration=await navigator.serviceWorker.getRegistration('/');return registration?.pushManager.getSubscription()}
 function cancel(){const previous=state();localStorage.removeItem(STATE_KEY);if(!previous?.token||location.hostname==='localhost'||location.hostname==='127.0.0.1')return;queue=queue.catch(()=>{}).then(()=>request('DELETE',{token:previous.token}).catch(()=>{}));}
 function sync(rest=currentRest()){
  if(!rest?.end||rest.end<=Date.now()){cancel();return}
  if(!enabled()||location.hostname==='localhost'||location.hostname==='127.0.0.1')return;
  const previous=state();if(previous?.dueAt===rest.end&&previous?.token===token())return;
  const next={token:token(),dueAt:rest.end,nonce:crypto.randomUUID()};save(next);
  queue=queue.catch(()=>{}).then(async()=>{try{const sub=await subscription();if(!sub)throw Error('Inscrição de notificações indisponível.');await request('POST',{token:next.token,nonce:next.nonce,delaySeconds:Math.max(1,Math.ceil((next.dueAt-Date.now())/1000)),subscription:sub.toJSON()})}catch(error){localStorage.removeItem(STATE_KEY);console.warn('Rest reminder unavailable',error)}});
 }
 function init(provider){currentRest=provider;window.addEventListener('workoutpushenabled',()=>sync());window.addEventListener('workoutpushdisabled',()=>cancel());window.addEventListener('online',()=>sync());document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});}
 return {init,sync,cancel};
})();
