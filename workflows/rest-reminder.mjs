import { sleep } from 'workflow';
import webpush from 'web-push';
import { configureWebPush,getRedis } from '../api/_lib/push.mjs';
import { REST_REMINDERS_KEY,digest } from '../api/_lib/rest-reminders.mjs';

async function deliver(token,nonce){
 'use step';
 const redis=getRedis(),id=digest(token),raw=await redis.hget(REST_REMINDERS_KEY,id),record=typeof raw==='string'?JSON.parse(raw):raw;
 if(!record||record.nonce!==nonce||record.dueAt>Date.now())return {sent:false};
 try{configureWebPush();await webpush.sendNotification(record.subscription,JSON.stringify({title:'Descanso concluído',body:'Hora da próxima série.',url:'/treino/',tag:`workout-rest-${nonce}`,icon:'/assets/images/icon-192.png',badge:'/assets/images/icon-192.png'}),{TTL:300})}
 catch(error){if([404,410].includes(error.statusCode))await redis.hdel(REST_REMINDERS_KEY,id);throw error}
 const fresh=await redis.hget(REST_REMINDERS_KEY,id),current=typeof fresh==='string'?JSON.parse(fresh):fresh;
 if(current?.nonce===nonce)await redis.hdel(REST_REMINDERS_KEY,id);
 return {sent:true};
}

export async function restReminder(input){
 'use workflow';
 console.info('Scheduling rest reminder',input.delaySeconds);
 await sleep(`${input.delaySeconds}s`);
 return deliver(input.token,input.nonce);
}
