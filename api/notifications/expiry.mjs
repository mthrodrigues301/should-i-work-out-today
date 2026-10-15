import {randomUUID} from 'node:crypto';
import {getRedis,json} from '../_lib/push.mjs';
import {EXPIRY_KEY,digest,validate} from '../_lib/expiry.mjs';
export default async function handler(req,res){
 if(!['POST','DELETE'].includes(req.method))return json(res,{error:'Method not allowed'},405);
 const token=req.body?.token;if(!/^[a-f0-9]{64}$/.test(token||''))return json(res,{error:'Invalid device token'},400);
 let data;if(req.method==='POST'){try{data=validate(req.body)}catch{return json(res,{error:'Invalid reminder settings'},400)}}
 try{const redis=getRedis(),id=digest(token);
 if(req.method==='DELETE'){await redis.hdel(EXPIRY_KEY,id);return json(res,{enabled:false})}
 const stored=await redis.hget(EXPIRY_KEY,id),old=typeof stored==='string'?JSON.parse(stored):stored;
 await redis.hset(EXPIRY_KEY,{[id]:{...data,revision:randomUUID(),sentDates:(old?.sentDates||[]).filter(d=>data.dates.includes(d)),retireAt:new Date(Date.now()+120*86400000).toISOString()}});
 return json(res,{enabled:true});}catch{return json(res,{error:'Reminder service unavailable'},503)}
}
