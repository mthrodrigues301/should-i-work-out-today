import { createHash } from 'node:crypto';

export const REST_REMINDERS_KEY='workout:rest-reminders';
export const digest=value=>createHash('sha256').update(value).digest('hex');

function subscription(value){
 const endpoint=new URL(value?.endpoint);
 const hosts=['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','notify.windows.com'];
 if(endpoint.protocol!=='https:'||endpoint.port||endpoint.username||endpoint.password||!hosts.some(host=>endpoint.hostname===host||endpoint.hostname.endsWith('.'+host)))throw Error('endpoint');
 if(!/^[\w-]{80,100}$/.test(value?.keys?.p256dh||'')||!/^[\w-]{20,30}$/.test(value?.keys?.auth||''))throw Error('keys');
 return {endpoint:endpoint.href,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth}};
}

export function validate(body){
 if(!/^[a-f0-9]{64}$/.test(body?.token||''))throw Error('token');
 if(!/^[a-f0-9-]{16,80}$/.test(body?.nonce||''))throw Error('nonce');
 if(!Number.isInteger(body?.delaySeconds)||body.delaySeconds<1||body.delaySeconds>1800)throw Error('delay');
 return {token:body.token,nonce:body.nonce,delaySeconds:body.delaySeconds,subscription:subscription(body.subscription)};
}
