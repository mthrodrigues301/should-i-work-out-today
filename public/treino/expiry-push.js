const ExpiryPush=(()=>{
 const KEY='mt-expiry-push';let getPlan,queue=Promise.resolve(),lastSynced='';
 const element=id=>document.getElementById(id);
 const status=text=>{if(element('expiry-push-status'))element('expiry-push-status').textContent=text};
 function stored(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
 function buttons(){const enabled=!!stored()?.enabled;element('expiry-enable').hidden=enabled;element('expiry-disable').hidden=!enabled}
 function token(){let state=stored();if(!state?.token){state={token:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join(''),enabled:false};localStorage.setItem(KEY,JSON.stringify(state))}return state.token}
 async function request(method,body){const r=await fetch('/api/notifications/expiry',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Não foi possível sincronizar o aviso. Conecte-se e tente novamente.');return r.json()}
 function payload(plan){return {dates:[...new Set(Object.values(plan).filter(w=>w.items.length&&WorkoutValidity.valid(w.validity)).map(w=>w.validity.expiresOn))].sort(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}}
 async function subscription(){const registration=await navigator.serviceWorker.getRegistration('/');return registration?.pushManager.getSubscription()}
 function sync(plan){if(!stored()?.enabled||!getPlan)return;const settings=payload(plan),signature=JSON.stringify(settings);if(signature===lastSynced)return;queue=queue.catch(()=>{}).then(async()=>{if(!stored()?.enabled)return;try{const sub=await subscription();if(!sub||Notification.permission!=='granted')throw Error('Notificações indisponíveis. Reative a permissão nas configurações do aparelho.');await request('POST',{token:token(),subscription:sub.toJSON(),...settings});lastSynced=signature;status(settings.dates.length?'Aviso ativo · às 8h após o vencimento.':'Aviso ativo. Defina a validade de pelo menos um treino.')}catch(e){status(e.message+' A alteração ficou salva no app; o aviso pode manter a data anterior.')}})}
 async function enable(){
  if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){status('Prévia local: a entrega real será habilitada após publicação com o serviço de notificações configurado. Nenhuma permissão foi solicitada.');return}
  if(!('Notification'in window)||!('PushManager'in window)||!('serviceWorker'in navigator)){status('Neste aparelho, instale o app na Tela de Início e abra por lá. No iPhone, é necessário iOS 16.4 ou superior.');return}
  if(!payload(getPlan()).dates.length){status('Defina a validade de um treino antes de ativar o aviso.');return}
  element('expiry-enable').disabled=true;
  try{
   // Permission must originate from this explicit tap, before asynchronous setup.
   if(await Notification.requestPermission()!=='granted')throw Error('Permissão não concedida. Você pode habilitá-la nas configurações do aparelho.');
   const keyResponse=await fetch('/api/notifications/public-key');if(!keyResponse.ok)throw Error('Serviço de notificações ainda não configurado.');const {publicKey}=await keyResponse.json();
   const padding='='.repeat((4-publicKey.length%4)%4),binary=atob((publicKey+padding).replace(/-/g,'+').replace(/_/g,'/'));const applicationServerKey=Uint8Array.from(binary,c=>c.charCodeAt(0));
   await navigator.serviceWorker.register('/service-worker.js');const registration=await navigator.serviceWorker.ready;
   const existing=await registration.pushManager.getSubscription();if(localStorage.getItem('workout-daily-push-enabled')===null)localStorage.setItem('workout-daily-push-enabled',String(!!existing));
   const sub=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
   const settings=payload(getPlan()),deviceToken=token();await request('POST',{token:deviceToken,subscription:sub.toJSON(),...settings});localStorage.setItem(KEY,JSON.stringify({token:deviceToken,enabled:true}));lastSynced=JSON.stringify(settings);status('Aviso ativo · vencimento e fim de descanso.');buttons();window.dispatchEvent(new Event('workoutpushenabled'));
  }catch(e){status(e.message||'Não foi possível ativar o aviso.')}finally{element('expiry-enable').disabled=false}
 }
 async function disable(){element('expiry-disable').disabled=true;queue=queue.catch(()=>{}).then(async()=>{try{await request('DELETE',{token:token()});localStorage.setItem(KEY,JSON.stringify({token:token(),enabled:false}));lastSynced='';status('Aviso de vencimento desativado.');buttons()}catch(e){status('Não foi possível desativar. O aviso continua ativo; tente novamente com internet.')}finally{element('expiry-disable').disabled=false}});await queue}
 function init(provider){getPlan=provider;buttons();element('expiry-enable').onclick=enable;element('expiry-disable').onclick=disable;window.addEventListener('online',()=>sync(getPlan()));document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastSynced='';sync(getPlan())}});sync(getPlan());if(location.hostname==='localhost'||location.hostname==='127.0.0.1')status('Prévia local: envio real pendente de publicação e configuração.');}
 return {init,sync};
})();
