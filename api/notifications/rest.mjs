import { randomUUID } from 'node:crypto';
import { start } from 'workflow/api';
import { getRedis,json } from '../_lib/push.mjs';
import { REST_REMINDERS_KEY,digest,validate } from '../_lib/rest-reminders.mjs';
import { restReminder } from '../../workflows/rest-reminder.mjs';

export default async function handler(req,res){
 if(!['POST','DELETE'].includes(req.method))return json(res,{error:'Method not allowed'},405);
 const token=req.body?.token;if(!/^[a-f0-9]{64}$/.test(token||''))return json(res,{error:'Invalid device token'},400);
 try{
  const redis=getRedis(),id=digest(token);
  if(req.method==='DELETE'){await redis.hdel(REST_REMINDERS_KEY,id);return json(res,{scheduled:false})}
  let data;try{data=validate(req.body)}catch{return json(res,{error:'Invalid rest reminder'},400)}
  await redis.hset(REST_REMINDERS_KEY,{[id]:{nonce:data.nonce,subscription:data.subscription,dueAt:Date.now()+data.delaySeconds*1000,createdAt:new Date().toISOString()}});
  await start(restReminder,[data]);
  return json(res,{scheduled:true});
 }catch(error){console.error('Rest reminder scheduling failed',error);return json(res,{error:'Could not schedule rest reminder'},503)}
}
