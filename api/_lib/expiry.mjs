import {createHash} from 'node:crypto';
export const EXPIRY_KEY='workout:expiry-subscriptions';
export const digest=v=>createHash('sha256').update(v).digest('hex');
export function validate(b){
 if(!/^[a-f0-9]{64}$/.test(b?.token||''))throw Error('token');
 if(!Array.isArray(b.dates)||b.dates.length>7)throw Error('dates');
 const dates=[...new Set(b.dates)];for(const d of dates)if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('date');
 if(typeof b.timeZone!=='string'||b.timeZone.length>100)throw Error('timezone');new Intl.DateTimeFormat('en',{timeZone:b.timeZone}).format();
 const s=b.subscription,u=new URL(s?.endpoint);const hosts=['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','notify.windows.com'];
 if(u.protocol!=='https:'||u.port||u.username||u.password||!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw Error('endpoint');
 if(!/^[\w-]{80,100}$/.test(s?.keys?.p256dh||'')||!/^[\w-]{20,30}$/.test(s?.keys?.auth||''))throw Error('keys');
 return {subscription:{endpoint:u.href,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth}},dates,timeZone:b.timeZone};
}
export function localSlot(timeZone,now){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour)}}
export async function dispatchExpiry(redis,send,now=new Date()){
 const rows=await redis.hgetall(EXPIRY_KEY)||{},result={sent:0,failed:0,removed:0};
 for(const [id,raw] of Object.entries(rows)){let lock;try{
  const r=typeof raw==='string'?JSON.parse(raw):raw;
  if(Date.parse(r.retireAt)<now.getTime()){await redis.hdel(EXPIRY_KEY,id);result.removed++;continue}
  const slot=localSlot(r.timeZone,now);if(slot.hour!==8)continue;
  const pending=r.dates.filter(d=>d<slot.date&&!r.sentDates?.includes(d));if(!pending.length)continue;
  lock=`workout:expiry-lock:${id}:${digest(pending.join(','))}`;if(!await redis.set(lock,'1',{nx:true,ex:300}))continue;
  const rawFresh=await redis.hget(EXPIRY_KEY,id),fresh=typeof rawFresh==='string'?JSON.parse(rawFresh):rawFresh;if(!fresh||fresh.revision!==r.revision){await redis.del(lock);continue}
  try{await send(r.subscription,JSON.stringify({title:'Hora de renovar seu treino',body:'A validade da sua ficha terminou. Renove o treino ou cadastre um novo.',url:'/my-workout/?expired=1',tag:'workout-expiry'}),{TTL:86400})}catch(e){if([404,410].includes(e.statusCode)){await redis.hdel(EXPIRY_KEY,id);result.removed++}else result.failed++;await redis.del(lock);continue}
  const next={...r,sentDates:[...new Set([...(r.sentDates||[]),...pending])]};
  await redis.eval("local v=redis.call('HGET',KEYS[1],ARGV[1]); if v and cjson.decode(v).revision == ARGV[2] then redis.call('HSET',KEYS[1],ARGV[1],ARGV[3]); return 1 end; return 0",[EXPIRY_KEY],[id,r.revision,JSON.stringify(next)]);
  result.sent++;await redis.del(lock);
 }catch{result.failed++;if(lock)await redis.del(lock)}}return result;
}
